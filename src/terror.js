import { TZ_ZONES, zoneIds, zoneLabel } from '../public/tz-zones.js';
export const TZ_API='https://d2runewizard.com/api/trackers/terror-zone';
export const TZ_SOURCE='https://d2runewizard.com/tz-tracker';
export const TZ_DEFAULTS={enabled:false,zones:[]};
const ROTATION=30*60000;
export function validateTerrorSettings(input) {
  if (!input || typeof input.enabled !== 'boolean' || !Array.isArray(input.zones) || input.zones.length>36 || input.zones.some(id=>!TZ_ZONES.some(z=>z.id===id))) throw new Error('Invalid Terror Zone settings');
  const zones=[...new Set(input.zones)];
  if(input.enabled && !zones.length) throw new Error('Select at least one Terror Zone');
  return {enabled:input.enabled,zones};
}
const nameOf=value=>typeof value==='string'?value:value?.zone;
export function normalizeTerror(data, now, sourceTime=now) {
  const current=nameOf(data.currentTerrorZone)||nameOf(data.current)||nameOf(data.terrorZone?.highestProbabilityZone);
  const next=nameOf(data.nextTerrorZone)||nameOf(data.next);
  if(typeof current!=='string'||!current.trim()||current.length>1000|| (next!=null && (typeof next!=='string'||next.length>1000))) throw new Error('Invalid Terror Zone response');
  // Public payload has no rotation timestamps. Use the origin's Date header and
  // the current 30-minute online schedule (documented by diablo2.io), never a
  // browser's time or an old cached snapshot assigned to a new slot.
  if(!Number.isFinite(sourceTime)||sourceTime>now+60000||Math.floor(sourceTime/ROTATION)!==Math.floor(now/ROTATION)) throw new Error('Stale Terror Zone response');
  const startAt=Math.floor(sourceTime/ROTATION)*ROTATION;
  return {current:current.trim(),next:next?.trim()||null,startAt,nextAt:startAt+ROTATION,checkedAt:now,source:TZ_SOURCE};
}
export async function queryTerror(env,now,fetcher=fetch) {
  const response=await fetcher(TZ_API,{headers:{accept:'application/json','D2R-Contact':env.TZ_CONTACT||'https://github.com/kingmacth/D2R-BlackFurRadar/issues','D2R-Platform':'Cloudflare Workers','D2R-Repo':'https://github.com/kingmacth/D2R-BlackFurRadar'},signal:AbortSignal.timeout(12000),redirect:'manual'});
  if(!response.ok) throw new Error(`Terror Zone source HTTP ${response.status}`);
  const text=await response.text();
  if(text.length>65536) throw new Error('Terror Zone response too large');
  const data=JSON.parse(text);
  const snapshot=normalizeTerror(data,now,response.headers.has('date')?Date.parse(response.headers.get('date')):now);
  const cache=response.headers.get('cache-control')||'';
  const reports=Number(data.terrorZone?.highestProbabilityZone?.amount||0);
  const ttl=Math.max(60,reports>3?reports*60:60,Number(cache.match(/s-maxage=(\d+)/)?.[1]||cache.match(/max-age=(\d+)/)?.[1]||0));
  const age=Number(response.headers.get('age')||0);
  const until=Math.max(60000,(ttl-age)*1000);
  return {...snapshot,refreshAt:Math.min(now+until,snapshot.nextAt)};
}
export function dueTerror(tz, now) {
  const s=tz.settings, d=tz.snapshot;
  if(!s.enabled||!d?.next||tz.error||now>Math.max(d.refreshAt||d.checkedAt,d.checkedAt)+180000||now<d.nextAt-300000||now>=d.nextAt||tz.sent.includes(d.nextAt)||tz.retryAt>now) return false;
  return zoneIds(d.next).some(id=>s.zones.includes(id));
}
export function terrorMessage(d,site) {
  return `【恐惧地带 · 即将开启】\n${zoneLabel(d.next,'zh-CN')}\n${d.next}\n开始：${new Date(d.nextAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}（北京时间）\n约五分钟后开启，请提前准备。\n${site}\nData courtesy of ${TZ_SOURCE}`;
}
