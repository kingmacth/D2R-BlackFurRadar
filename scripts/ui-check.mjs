// Local browser QA with fixture data. Never connects to a push service.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, access, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { initialState } from '../src/core.js';

const delay = ms => new Promise(r => setTimeout(r, ms));
const state = initialState();
state.rows = [{region:3,ladder:1,hc:2,ver:2,progress:4,timestamped:Math.floor(Date.now()/1000)-86400,checkedAt:Date.now(),source:'diablo2io'}];
state.sourceInfo = {id:'diablo2io',live:true};
state.lastSuccess = Date.now();
state.pushConfigured = true;
state.terror={settings:{enabled:false,zones:['chaos']},sent:[]};
state.terrorZone={snapshot:{current:'The Pit',next:'The Chaos Sanctuary',startAt:Math.floor(Date.now()/1800000)*1800000,nextAt:Math.floor(Date.now()/1800000)*1800000+1800000,checkedAt:Date.now()},error:null};
let browser;
for (const candidate of [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean)) {
  try { await access(candidate); browser = candidate; break; } catch {}
}
if (!browser) throw new Error('Set CHROME_PATH to an installed Chrome/Edge executable');
const server = createServer(async (req,res) => {
  const pathname=new URL(req.url,'http://localhost').pathname;
  const legacy=pathname.match(/^\/guides\/(summon-warlock|echo-demon)(?:\.html)?$/);
  if(legacy){res.writeHead(308,{location:`/guides/s16/${legacy[1]}${new URL(req.url,'http://localhost').search}`});res.end();return;}
  res.setHeader('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  if(req.url.startsWith('/api/')) {
    if(req.url !== '/api/public' && req.headers.authorization !== 'Bearer test-password') {res.writeHead(401,{'content-type':'application/json'});res.end(JSON.stringify({error:'管理密码不正确'}));return;}
    if(req.url === '/api/settings') {
      let body=''; for await(const chunk of req) body+=chunk;
      state.settings=JSON.parse(body);
    }
    if(req.url === '/api/terror-settings') {
      let body='';for await(const chunk of req)body+=chunk;
      state.terror.settings=JSON.parse(body);
    }
    res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(state));return;
  }
  const file = pathname === '/' ? 'index.html' : /^\/guides\/s16\/(summon-warlock|echo-demon)$/.test(pathname) ? pathname.slice(1)+'.html' : pathname.slice(1);
  if(!['index.html','app.js','i18n.js','style.css','terror-ui.js','tz-zones.js'].includes(file) && !/^guides\/s16\/(summon-warlock\.(html|js|css)|echo-demon\.(html|js|css|i18n\.json)|(echo|warlock)-[a-f0-9]{12}\.webp)$/.test(file)) {res.writeHead(404);res.end();return;}
  res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json; charset=utf-8':'text/html; charset=utf-8');
  res.end(await readFile(new URL(`../public/${file}`,import.meta.url)));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
await mkdir('.browser-qa',{recursive:true});
const profile=await mkdtemp(resolve('.browser-qa/run-'));
const child=spawn(browser,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let ws;
try {
  let targets;
  for(let i=0;i<100;i++) {
    try {const port=(await readFile(resolve(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];targets=await (await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(1000)})).json();break;}catch{await delay(100);}
  }
  if(!targets) throw new Error('Browser did not start');
  ws=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  let seq=0;const waiting=new Map();const pageErrors=[];
  ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')pageErrors.push(m.params.exceptionDetails.text);if(m.method==='Log.entryAdded' && /Content Security Policy|Refused to execute|Refused to apply/i.test(m.params.entry.text))pageErrors.push(m.params.entry.text);if(m.id){const h=waiting.get(m.id);waiting.delete(m.id);m.error?h.reject(new Error(m.error.message)):h.resolve(m.result);}};
  const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;waiting.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails) throw new Error(r.exceptionDetails.text);return r.result.value;};
  async function until(expression) {for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(50);}throw new Error(`UI condition timed out: ${expression}`);}
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Log.enable');
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1200,deviceScaleFactor:1,mobile:false});
  await command('Page.navigate',{url:`http://127.0.0.1:${port}`});
  await until(`document.getElementById('login-form') !== null && document.readyState === 'complete'`);
  await until(`document.querySelectorAll('.progress-card').length===1`);
  assert.equal(await evaluate(`document.getElementById('login').hidden`),true);
  assert.equal(await evaluate(`document.getElementById('settings-panel').hidden`),true);
  assert.equal(await evaluate(`document.getElementById('check').hidden`),true);
  assert.equal(await evaluate(`document.getElementById('guide-nav').getBoundingClientRect().height>0`),true);
  assert.equal(await evaluate(`document.getElementById('guide-nav').textContent`),'S16 纯召唤 ↗');
  assert.equal(await evaluate(`document.getElementById('echo-nav').textContent`),'S16 快速开荒 ↗');
  await mkdir('artifacts',{recursive:true});
  let screenshot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  await writeFile('artifacts/public.png',Buffer.from(screenshot.data,'base64'));
  await evaluate(`document.getElementById('language').value='en';document.getElementById('language').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.documentElement.lang`),'en');
  assert.equal(await evaluate(`document.getElementById('radar-status').textContent`),'Monitoring');
  assert.equal(await evaluate(`document.querySelector('.stage-message').textContent`),'Terror spreads across Sanctuary.');
  assert.equal(await evaluate(`document.getElementById('manage').textContent`),'Manage alerts');
  assert.equal(await evaluate(`document.getElementById('guide-nav').textContent`),'S16 Pure Summoner ↗');
  assert.equal(await evaluate(`document.getElementById('echo-nav').textContent`),'S16 Fast Leveling ↗');
  assert.equal(await evaluate(`(()=>{const body=document.body.cloneNode(true);body.querySelectorAll('select').forEach(e=>e.remove());return /[\u3400-\u9fff]/u.test(body.textContent)})()`),false);
  await command('Page.reload');
  await until(`document.querySelectorAll('.progress-card').length===1`);
  assert.equal(await evaluate(`document.documentElement.lang`),'en');
  assert.equal(await evaluate(`document.getElementById('language').value`),'en');
  await evaluate(`document.getElementById('language').value='zh-CN';document.getElementById('language').dispatchEvent(new Event('change'))`);
  await evaluate(`document.getElementById('manage').click()`);
  await evaluate(`document.getElementById('token').value='test-password';document.querySelector('#login-form button').click()`);
  await until(`document.getElementById('settings-panel').hidden === false`);
  assert.equal(await evaluate(`document.querySelector('input[name=regions][value="3"]').checked`),true);
  assert.equal(await evaluate(`document.querySelector('input[name=regions][value="1"]').checked`),false);
  assert.equal(await evaluate(`document.querySelectorAll('.progress-card').length`),1);
  assert.equal(await evaluate(`document.querySelector('.progress-number').textContent`),'4 / 6');
  assert.equal(await evaluate(`document.querySelector('input[name=versions][value="2"]').checked`),true);
  assert.equal(await evaluate(`document.getElementById('radar-status').textContent`),'监控中');
  assert.equal(await evaluate(`document.querySelectorAll('[name="tz-zones"]').length`),36);
  assert.match(await evaluate(`document.getElementById('terror-zone').textContent`),/混沌避难所/);
  await evaluate(`document.getElementById('tz-enabled').click();document.querySelector('[name="tz-zones"][value="travincal"]').click();document.querySelector('#terror-form button').click()`);
  await until(`document.querySelector('#terror-form button')?.disabled===false`);
  await delay(200);
  assert.deepEqual(state.terror.settings,{enabled:true,zones:['travincal','chaos']});
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
  await mkdir('artifacts',{recursive:true});
  const capture=async name=>{const r=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`artifacts/${name}.png`,Buffer.from(r.data,'base64'));};
  await capture('desktop');
  await evaluate(`document.getElementById('threshold').value='5';document.getElementById('threshold').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('language').value='en';document.getElementById('language').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.getElementById('threshold').value`),'5');
  assert.equal(state.settings.threshold,4);
  await capture('desktop-en');
  await evaluate(`document.getElementById('language').value='zh-CN';document.getElementById('language').dispatchEvent(new Event('change'))`);
  await evaluate(`document.querySelector('input[name=regions][value="1"]').click();document.getElementById('threshold').value='5';document.getElementById('threshold').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#settings-form button').click()`);
  await until(`document.querySelectorAll('.progress-card').length===2`);
  assert.deepEqual(state.settings.regions,[3,1]);assert.equal(state.settings.threshold,5);
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
  await capture('mobile');
  await evaluate(`document.getElementById('language').value='en';document.getElementById('language').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
  await capture('mobile-en');
  await evaluate(`document.getElementById('logout').click()`);
  assert.equal(await evaluate(`document.getElementById('dashboard').hidden`),false);
  assert.equal(await evaluate(`document.getElementById('settings-panel').hidden`),true);
  assert.equal(await evaluate(`document.getElementById('warlock-guide').textContent.includes('Summon Warlock')`),true);
  await evaluate(`document.getElementById('guide-nav').click()`);
  await until(`!!document.getElementById('wrapEn') && document.getElementById('wrapEn').hidden===false`);
  assert.equal(await evaluate(`document.documentElement.lang`),'en');
  await until(`document.querySelector('#wrapEn .hero img').complete && document.querySelector('#wrapEn .hero img').naturalWidth>0`);
  await evaluate(`document.querySelector('#quickEn button[data-m="30"]').click()`);
  assert.equal(await evaluate(`document.getElementById('c-skill-en').textContent.includes('Bind Demon 1')`),true);
  await evaluate(`document.getElementById('btn-zh').click()`);
  assert.equal(await evaluate(`document.getElementById('wrapZh').hidden`),false);
  assert.equal(await evaluate(`document.getElementById('lv').value`),'30');
  assert.equal(await evaluate(`document.getElementById('c-skill').textContent.includes('束缚恶魔 1')`),true);
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
  const guideShot=async name=>{const r=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`artifacts/${name}.png`,Buffer.from(r.data,'base64'));};
  await guideShot('guide-zh-mobile');
  await evaluate(`document.querySelector('#quick button[data-m="60"]').click();document.getElementById('btn-en').click()`);
  assert.equal(await evaluate(`document.getElementById('lvEn').value`),'60');
  assert.equal(await evaluate(`document.getElementById('c-skill-en').textContent.includes('Demon Mastery')`),true);
  assert.equal(await evaluate(`[...document.querySelectorAll('#wrapEn a[href^="#"]')].every(a=>document.getElementById(a.hash.slice(1)))`),true);
  await command('Page.reload');
  await until(`!!document.getElementById('wrapEn') && !document.getElementById('wrapEn').hidden`);
  assert.equal(await evaluate(`document.documentElement.lang`),'en');
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await guideShot('guide-en-desktop');
  await evaluate(`document.getElementById('radar-home').click()`);
  await until(`!!document.getElementById('language') && document.getElementById('language').value==='en'`);
  assert.equal(await evaluate(`document.getElementById('echo-guide').compareDocumentPosition(document.getElementById('warlock-guide')) & Node.DOCUMENT_POSITION_FOLLOWING`),4);
  await evaluate(`document.getElementById('echo-nav').click()`);
  await until(`!!document.getElementById('guide-language') && document.getElementById('guide-language').value==='en' && document.getElementById('ckStage').textContent.includes('Stage')`);
  assert.equal(await evaluate(`location.pathname`),'/guides/s16/echo-demon');
  assert.equal(await evaluate(`document.querySelector('.season-tag').textContent.includes('S16')`),true);
  await until(`document.querySelector('.hero img').complete && document.querySelector('.hero img').naturalWidth>0`);
  await evaluate(`document.getElementById('lvRange').value='30';document.getElementById('lvRange').dispatchEvent(new Event('input'))`);
  assert.equal(await evaluate(`document.getElementById('ckSkill').textContent.includes('Bind Demon')`),true);
  await evaluate(`document.getElementById('guide-language').value='zh-CN';document.getElementById('guide-language').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.getElementById('lvRange').value`),'30');
  assert.equal(await evaluate(`document.getElementById('ckSkill').textContent.includes('束缚恶魔')`),true);
  await evaluate(`document.getElementById('lvRange').value='65';document.getElementById('lvRange').dispatchEvent(new Event('input'))`);
  assert.equal(await evaluate(`document.getElementById('ckStage').textContent.includes('阶段五')`),true);
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
  await guideShot('echo-s16-zh-mobile');
  await evaluate(`document.getElementById('guide-language').value='en';document.getElementById('guide-language').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.getElementById('lvRange').value`),'65');
  assert.equal(await evaluate(`document.getElementById('ckTask').textContent.includes('Nightmare Baal')`),true);
  assert.equal(await evaluate(`(()=>{const body=document.body.cloneNode(true);body.querySelectorAll('select').forEach(e=>e.remove());return /[\u3400-\u9fff]/u.test(body.textContent)})()`),false);
  await guideShot('echo-s16-en-mobile');
  await command('Page.reload');
  await until(`!!document.getElementById('guide-language') && document.getElementById('guide-language').value==='en' && document.documentElement.lang==='en'`);
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await guideShot('echo-s16-en-desktop');
  await evaluate(`document.getElementById('echo-home').click()`);
  await until(`!!document.getElementById('echo-guide') && document.documentElement.lang==='en'`);
  assert.deepEqual(pageErrors,[]);
  console.log('Browser QA passed: radar controls, two independent S16 builds, fast-leveling priority, both guide languages, language persistence, both calculators, level retention, images, mobile layouts, return links and strict CSP.');
} finally {
  if(ws?.readyState===1)ws.close();
  child.kill();
  server.close();
}
