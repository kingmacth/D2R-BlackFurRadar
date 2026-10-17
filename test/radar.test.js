import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState as defaultState, normalizeRows, observe, pendingEvents, validateSettings, keyOf } from '../src/core.js';
import worker, { RadarState, sendWechat } from '../src/worker.js';
import { normalizeD2Emu, querySource, sourceInfo } from '../src/sources.js';

const now = 1792200000000;
// Most existing transition fixtures exercise LoD; production defaults to RotW.
const initialState = () => { const state=defaultState(); state.settings.versions=[1]; return state; };
const row = (progress, offset = 0, extra = {}) => ({ region: 3, ladder: 1, hc: 2, ver: 1, progress, timestamped: now / 1000 + offset, ...extra });
function accept(state, time) {
  const due = pendingEvents(state, time);
  for (const x of due) {
    state.tracks[x.key].sent.push(x.stage);
    delete state.tracks[x.key].pending[x.stage];
  }
  return due.map(x => x.stage);
}
test('defaults: Asia ladder softcore, threshold 4; strict settings validation', () => {
  const s = initialState().settings;
  assert.deepEqual(s.regions,[3]);
  assert.deepEqual(s.ladders,[1]);
  assert.deepEqual(s.hardcore,[2]);
  assert.equal(s.threshold,4);
  assert.deepEqual(defaultState().settings.versions,[2]);
  assert.throws(() => validateSettings({...s,regions:[]}));
  assert.throws(() => validateSettings({...s,threshold:'4'}));
  assert.throws(() => validateSettings({...s,maxAgeMinutes:0}));
  assert.deepEqual(validateSettings({...s,regions:[1,2,3]}).regions,[1,2,3]);
});
test('each observed stage once per cycle; restart and corrections preserve dedup', () => {
  let state=initialState();
  for (const [progress,seconds,expected] of [[3,0,[]],[4,60,[4]],[4,120,[]],[5,180,[5]],[4,240,[]],[5,300,[]],[6,360,[6]],[1,420,[]],[4,480,[4]]]) {
    state = structuredClone(state);
    observe(state,[row(progress,seconds)],now+seconds*1000);
    assert.deepEqual(accept(state,now+seconds*1000),expected);
  }
});
test('jump to 5 only alerts 5, stale and unselected reports never alert', () => {
  const state=initialState();
  observe(state,[row(3)],now);
  observe(state,[row(5,60)],now+60000);
  assert.deepEqual(accept(state,now+60000),[5]);
  observe(state,[row(6,-9000),row(6,60,{region:1}),row(6,60,{hc:1})],now+60000);
  assert.deepEqual(accept(state,now+60000),[]);
});
test('mode/version separation, lower threshold and expired pending', () => {
  const state=initialState();
  state.settings.regions=[1,3];
  state.settings.versions=[1,2];
  observe(state,[row(4),row(4,0,{region:1}),row(4,0,{ver:2})],now);
  assert.equal(pendingEvents(state,now).length,3);
  state.settings.enabled=false;
  assert.equal(pendingEvents(state,now).length,0);
  state.settings.enabled=true;
  observe(state,[row(4)],now);
  assert.equal(pendingEvents(state,now+121*60000).length,0);
});
test('older reports cannot regress/reset a cycle; missing rows are preserved', () => {
  const state=initialState();
  observe(state,[row(5,60)],now+60000);
  accept(state,now+60000);
  observe(state,[row(1),row(2,60,{region:1})],now+60000);
  assert.equal(state.tracks[keyOf(row(5))].cycle,1);
  assert.equal(state.rows.find(r=>r.region===3).progress,5);
  assert.equal(state.rows.length,2);
});
test('normalize real API string values, including hc=1 hardcore and ver=2', () => {
  const normalized=normalizeRows([{progress:'4',region:'3',ladder:'1',hc:'1',timestamped:String(now/1000),ver:'2'}],now);
  assert.equal(normalized[0].hc,1);
  assert.equal(normalized[0].ver,2);
  for (const data of [[],{},[row(7)],[row(4),row(4)],[row(4,99999)]]) assert.throws(()=>normalizeRows(data,now));
});
test('self-hosted WeChat protocol and response acknowledgement', async () => {
  const env={WXPUSH_URL:'https://push.example.com/push',WXPUSH_USER_ID:'test-user',WXPUSH_TOKEN:'test-token'};
  await sendWechat(env,'中文通知',async (url,init)=>{
    assert.equal(url.href,env.WXPUSH_URL);
    assert.equal(init.headers.token,'test-token');
    assert.equal(init.headers['x-app-name'],'D2R-BlackFurRadar');
    assert.equal(init.body.get('message'),'中文通知');
    assert.equal(init.body.get('userId'),'test-user');
    assert.equal(init.redirect,'manual');
    return new Response('ok');
  });
  await assert.rejects(sendWechat(env,'test',async()=>new Response('failure')));
  await assert.rejects(sendWechat({...env,WXPUSH_TOKEN:''},'test'));
});
test('worker protects settings and internal cron; rejects foreign mutation origins', async () => {
  const env={ADMIN_TOKEN:'secret',RADAR:{idFromName:()=>1,get:()=>({fetch:()=>new Response('{}')})}};
  assert.equal((await worker.fetch(new Request('https://example.com/api/status'),env)).status,401);
  assert.equal((await worker.fetch(new Request('https://example.com/api/tick',{method:'POST',headers:{authorization:'Bearer secret'}}),env)).status,404);
  assert.equal((await worker.fetch(new Request('https://example.com/api/settings',{method:'PUT',headers:{authorization:'Bearer secret',origin:'https://evil.com'}}),env)).status,403);
  assert.equal((await worker.fetch(new Request('https://example.com/api/status',{headers:{authorization:'Bearer secret'}}),env)).status,200);
  assert.equal((await worker.fetch(new Request('https://example.com/api/status'),{})).status,503);
  assert.equal((await worker.fetch(new Request('https://example.com/api/public'),env)).status,200);
  assert.equal((await worker.fetch(new Request('https://example.com/api/public',{method:'PUT'}),env)).status,401);
});
test('DO retries failed sends, serializes overlapping polls, survives recreation, rate limits failed fetches', async t => {
  let stored=initialState();
  const ctx={storage:{get:async()=>structuredClone(stored),put:async(_key,value)=>{stored=structuredClone(value);}}};
  const env={WXPUSH_URL:'https://push.test/push',WXPUSH_TOKEN:'test',SITE_URL:'https://example.com',D2EMU_USERNAME:'test',D2EMU_TOKEN:'test'};
  let clock=now;
  t.mock.method(Date,'now',()=>clock);
  let sourceCalls=0,pushCalls=0,failPush=true,failSource=false;
  t.mock.method(globalThis,'fetch',async url=>{
    if(String(url).includes('/api/v1/dclone')) {
      sourceCalls++;
      if(failSource) return new Response('unavailable',{status:503});
      return Response.json({krSoftcoreLadder:{status:3,updated_at:now/1000}});
    }
    pushCalls++;
    return new Response(failPush?'failure':'ok');
  });
  let object=new RadarState(ctx,env);
  const tick=()=>new Request('https://internal/api/tick',{method:'POST'});
  await Promise.all([object.fetch(tick()),object.fetch(tick())]);
  assert.equal(sourceCalls,1);
  assert.equal(pushCalls,1);
  assert.equal(stored.tracks[keyOf(row(4))].sent.length,0);
  object=new RadarState(ctx,env);
  clock+=120000;
  failPush=false;
  await object.fetch(tick());
  assert.equal(pushCalls,2);
  assert.deepEqual(stored.tracks[keyOf(row(4))].sent,[4]);
  clock+=60000;
  await object.fetch(tick());
  assert.equal(pushCalls,2);
  failSource=true;
  clock+=60000;
  await object.fetch(tick());
  const calls=sourceCalls;
  clock+=1000;
  await object.fetch(tick());
  assert.equal(sourceCalls,calls);
  assert.match(stored.sourceError,/503/);
  assert.equal(stored.rows[0].progress,4);
});

test('public snapshot excludes notification history, push configuration and dedup state',async()=>{
  const state=initialState();state.events=[{message:'private'}];state.tracks={private:'value'};
  const object=new RadarState({storage:{get:async()=>state}},{});
  const response=await object.fetch(new Request('https://internal/api/public'));
  const data=await response.json();
  assert.equal(data.events,undefined);assert.equal(data.tracks,undefined);assert.equal(data.pushConfigured,undefined);
  assert.deepEqual(data.settings.regions,[3]);assert.equal(data.sourceInfo.live,true);
});

test('D2Emu flat live stages are zero-based; live freshness is snapshot time, not last change',()=>{
  const rows=normalizeD2Emu({
    krSoftcoreLadder:{status:3,updated_at:now/1000-86400},
    usHardcoreNonLadderRotw:{status:5,updated_at:now/1000},
    cnSoftcoreLadder:{status:0,updated_at:now/1000},
  },now);
  assert.equal(rows.length,2);assert.equal(rows[0].progress,4);assert.equal(rows[0].region,3);
  assert.equal(rows[1].progress,6);assert.equal(rows[1].ver,2);assert.equal(rows[1].hc,1);assert.equal(rows[1].ladder,2);
  const state=initialState();observe(state,rows,now);assert.deepEqual(accept(state,now),[4]);
  assert.throws(()=>normalizeD2Emu({krSoftcoreLadder:{status:6}},now));
  assert.throws(()=>normalizeD2Emu({status:'ERROR',message:'invalid token'},now));
  const nested=normalizeD2Emu({asia:{ladder:{sc:4,hc:1},nonladder:{sc:2,hc:1}}},now);
  assert.equal(nested.length,4);assert.equal(nested[0].progress,4);
});

test('source selection keeps credentials server-side and never follows upstream redirects',async()=>{
  assert.equal(sourceInfo({}).live,true);
  const env={D2EMU_USERNAME:'own-user',D2EMU_TOKEN:'own-secret'};
  const rows=await querySource(env,1,now,async(url,init)=>{
    assert.equal(url,'https://d2emu.com/api/v1/dclone');assert.equal(init.headers['x-emu-token'],'own-secret');
    assert.equal(init.headers['x-emu-username'],'own-user');assert.equal(init.redirect,'manual');
    return Response.json({krSoftcoreLadder:{status:3}});
  });
  assert.equal(rows[0].progress,4);
  await assert.rejects(querySource(env,1,now,async()=>new Response('',{status:401})),/401/);
  const snapshot=await querySource({},2,now,async(url,init)=>{
    assert.equal(new URL(url).searchParams.get('ver'),'2');assert.equal(init.headers['x-emu-token'],undefined);
    return Response.json([row(4,-86400,{ver:2})]);
  });
  assert.equal(snapshot[0].ver,2);assert.equal(snapshot[0].checkedAt,now);
  assert.equal(snapshot[0].timestamped,now/1000-86400);
  const state=defaultState();observe(state,snapshot,now);assert.deepEqual(accept(state,now),[4]);
});

test('public automatic snapshots alert without credentials; switching providers removes old dedup',async t=>{
  let state=initialState();let pushes=0;
  const ctx={storage:{get:async()=>structuredClone(state),put:async(_,v)=>state=structuredClone(v)}};
  let clock=now;t.mock.method(Date,'now',()=>clock);
  t.mock.method(globalThis,'fetch',async(url)=>{
    if(String(url).includes('dclone_api'))return Response.json([row(4)]);
    if(String(url).includes('d2emu.com'))return Response.json({krSoftcoreLadder:{status:3}});
    pushes++;return new Response('ok');
  });
  const env={WXPUSH_URL:'https://push.test/push',WXPUSH_TOKEN:'test'};
  let object=new RadarState(ctx,env);
  await object.fetch(new Request('https://internal/api/tick',{method:'POST'}));
  assert.equal(pushes,1);assert.equal(state.provider,'diablo2io');
  env.D2EMU_USERNAME='test';env.D2EMU_TOKEN='test';clock+=60000;
  object=new RadarState(ctx,env);
  await object.fetch(new Request('https://internal/api/tick',{method:'POST'}));
  assert.equal(pushes,2);assert.equal(state.provider,'d2emu');assert.equal(state.rows[0].source,'d2emu');
});
