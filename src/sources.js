import { SOURCE, normalizeRows } from './core.js';

export const D2EMU_SOURCE = 'https://d2emu.com/api/v1/dclone';
export function sourceInfo(env) {
  const live = Boolean(env.D2EMU_USERNAME && env.D2EMU_TOKEN);
  return live
    ? { id: 'd2emu', name: 'D2Emu · 实时进度', url: D2EMU_SOURCE, website: 'https://d2emu.com/dclone', live: true }
    : { id: 'diablo2io', name: 'diablo2.io · D2Emu 自动追踪', url: SOURCE, website: 'https://diablo2.io/dclonetracker.php', live: true };
}

// D2Emu's documented nested snapshot uses stages 1–6. Its flat live-feed
// representation uses status 0–5 and server names such as krSoftcoreLadder.
export function normalizeD2Emu(data, now = Date.now()) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.status === 'ERROR') throw new Error('数据源返回了无效记录');
  const rows = [];
  const regions = {us:1,eu:2,kr:3,asia:3};
  const timestamp = value => {
    if (value == null) return Math.floor(now/1000);
    const numeric = Number(value);
    const ms = Number.isFinite(numeric) ? (numeric > 1e12 ? numeric : numeric * 1000) : Date.parse(value);
    if (!Number.isFinite(ms) || ms <= 0 || ms > now + 300000) throw new Error('数据源时间无效');
    return Math.floor(ms/1000);
  };
  for (const [name, value] of Object.entries(data.dclone || data)) {
    if (!value || typeof value !== 'object') continue;
    if (regions[name] && value.ladder) {
      for (const [ladder, mode] of Object.entries({ladder:1,nonladder:2})) {
        for (const [character, hc] of Object.entries({sc:2,hc:1})) {
          const progress=value[ladder]?.[character];
          if (progress == null) continue;
          rows.push({region:regions[name],ladder:mode,hc,ver:1,progress:Number(progress),timestamped:timestamp(null)});
        }
      }
    } else {
      const match=name.match(/^(us|eu|kr|asia)(?=[A-Z])/);
      if (!match) continue; // The service does not monitor China's separate realm.
      const suffix=name.slice(match[0].length);
      if (!/(?:Ladder|NonLadder)/i.test(suffix) || !/(?:Softcore|Hardcore)/i.test(suffix)) throw new Error('数据源服务器标识无效');
      if (!Number.isInteger(value.status) || value.status<0 || value.status>5) throw new Error('数据源进度无效');
      rows.push({region:regions[match[0]],ladder:/NonLadder/i.test(suffix)?2:1,hc:/Hardcore/i.test(suffix)?1:2,ver:/Rotw/i.test(suffix)?2:1,progress:value.status+1,timestamped:timestamp(value.updated_at)});
    }
  }
  return normalizeRows(rows,now).map(row=>({...row,source:'d2emu',checkedAt:now}));
}

export async function querySource(env, version, now, fetcher = fetch) {
  const info=sourceInfo(env);
  const direct=info.id === 'd2emu';
  const headers={accept:'application/json','user-agent':`BlackFurRadar/1.1 (+${env.SITE_URL || 'https://example.com'})`};
  if (direct) {
    headers['x-emu-token']=env.D2EMU_TOKEN;
    headers['x-emu-username']=env.D2EMU_USERNAME;
  }
  const response=await fetcher(direct ? info.url : `${info.url}?ver=${version}`,{headers,signal:AbortSignal.timeout(15000),redirect:'manual'});
  if (!response.ok) throw new Error(`数据源 HTTP ${response.status}`);
  const text=await response.text();
  if(text.length>100000) throw new Error('数据源响应过大');
  let raw;
  try {raw=JSON.parse(text);}catch{throw new Error('数据源返回了非 JSON 响应');}
  return direct ? normalizeD2Emu(raw,now) : normalizeRows(raw,now).map((row,i)=>({...row,source:'diablo2io',checkedAt:now,reporterId:String(raw[i].reporter_id ?? '')}));
}
