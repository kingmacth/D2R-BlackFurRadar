import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTerror,queryTerror,dueTerror,validateTerrorSettings,TZ_API} from '../src/terror.js';
import {zoneIds,zoneLabel} from '../public/tz-zones.js';
import {RadarState} from '../src/worker.js';
import {initialState} from '../src/core.js';
const start=Date.UTC(2026,10,20,7,0), next=start+1800000;
const snapshot=now=>({...normalizeTerror({current:'River of Flame and City of the Damned',next:'Chaos Sanctuary'},now),refreshAt:next});
test('matches aliases and grouped zones, while preserving unknown names',()=>{
  assert.deepEqual(zoneIds('The Chaos Sanctuary'),['chaos']);
  assert.deepEqual(zoneIds('Chaos Sanctuary'),['chaos']);
  assert.deepEqual(zoneIds('Worldstone Keep, Throne of Destruction, and Worldstone Chamber'),['worldstone']);
  assert.equal(zoneLabel('Chaos Sanctuary','zh-CN'),'混沌避难所');
  assert.equal(zoneLabel('New Unknown Area','zh-CN'),'New Unknown Area');
  assert.throws(()=>validateTerrorSettings({enabled:true,zones:[]}));
  assert.throws(()=>validateTerrorSettings({enabled:true,zones:['wrong']}));
  assert.deepEqual(validateTerrorSettings({enabled:false,zones:[]}),{enabled:false,zones:[]});
});
test('normalizes actual public API shape and rejects stale previous rotation or missing current data',()=>{
  const d=normalizeTerror({currentTerrorZone:{zone:'The Pit'},nextTerrorZone:{zone:'Travincal'}},start+60000,start);
  assert.equal(d.nextAt,next);assert.equal(d.startAt,start);
  assert.throws(()=>normalizeTerror({current:'The Pit'},next+1000,start));
  assert.throws(()=>normalizeTerror({current:''},start));
  assert.equal(normalizeTerror({current:'The Pit'},start).next,null);
});
test('respects cache TTL and origin Date, sends integration identifiers, and rejects redirects',async()=>{
  const d=await queryTerror({},start+60000,async(url,init)=>{
    assert.equal(url,TZ_API);assert.equal(init.redirect,'manual');assert.ok(init.headers['D2R-Contact']);
    return Response.json({current:'The Pit',next:'Chaos Sanctuary'},{headers:{date:new Date(start).toUTCString(),'cache-control':'public, s-maxage=600',age:'60'}});
  });
  assert.equal(d.refreshAt,start+600000);
  await assert.rejects(queryTerror({},start,async()=>new Response(null,{status:308})),/308/);
});
test('only matching upcoming slots alert inside five-minute window, deduplicated by rotation',()=>{
  const tz={settings:{enabled:true,zones:['chaos','travincal']},snapshot:snapshot(start),sent:[],retryAt:0,error:null};
  assert.equal(dueTerror(tz,next-300001),false);
  assert.equal(dueTerror(tz,next-300000),true);
  assert.equal(dueTerror(tz,next-1),true);
  assert.equal(dueTerror(tz,next),false);
  tz.sent=[next];assert.equal(dueTerror(tz,next-100000),false);
  tz.sent=[];tz.settings.zones=['pit'];assert.equal(dueTerror(tz,next-100000),false);
  tz.settings.zones=['chaos'];tz.error='unavailable';assert.equal(dueTerror(tz,next-100000),false);
  tz.error=null;tz.snapshot.next=null;assert.equal(dueTerror(tz,next-100000),false);
});
test('DO stores subscriptions, retries delivery, survives restart, and never leaks subscription settings publicly',async t=>{
  let now=next-300000,stored=initialState(), pushes=0,fail=true;
  t.mock.method(Date,'now',()=>now);
  t.mock.method(globalThis,'fetch',async(url)=>{
    if(String(url).includes('d2runewizard.com')) return Response.json({current:'The Pit',next:'The Chaos Sanctuary'});
    if(String(url).includes('dclone_api'))return new Response('',{status:503});
    pushes++;return new Response(fail?'failure':'ok');
  });
  const ctx={storage:{get:async()=>structuredClone(stored),put:async(_,s)=>stored=structuredClone(s)}};
  const env={WXPUSH_URL:'https://push.test/push',WXPUSH_TOKEN:'test',SITE_URL:'https://example.com'};
  let obj=new RadarState(ctx,env);
  const request=(path,method='GET',body)=>new Request('https://internal/api/'+path,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  assert.equal((await obj.fetch(request('terror-settings','PUT',{enabled:true,zones:['chaos','travincal']}))).status,200);
  await Promise.all([obj.fetch(request('tick','POST')),obj.fetch(request('tick','POST'))]);assert.equal(pushes,1);
  now+=60000;fail=false;obj=new RadarState(ctx,env);
  await obj.fetch(request('tick','POST'));assert.equal(pushes,2);assert.deepEqual(stored.terror.sent,[next]);
  now+=60000;await obj.fetch(request('tick','POST'));assert.equal(pushes,2);
  const pub=await(await obj.fetch(request('public'))).json();
  assert.equal(pub.terror,undefined);assert.equal(pub.terrorZone.settings,undefined);assert.equal(pub.terrorZone.snapshot.next,'The Chaos Sanctuary');
});
