export const SOURCE = 'https://diablo2.io/dclone_api.php';
export const DEFAULT_SETTINGS = {
  enabled: true, threshold: 4, regions: [3], ladders: [1],
  hardcore: [2], versions: [2], maxAgeMinutes: 120,
};
export const STAGES = ['', '恐惧凝视着庇护之地', '恐惧接近庇护之地', '恐惧开始在庇护之地成形', '恐惧蔓延至庇护之地', '恐惧即将降临庇护之地', '迪亚波罗入侵庇护之地'];
export const keyOf = r => `${r.ver}:${r.region}:${r.ladder}:${r.hc}`;
export const labelOf = r => `${r.ver === 1 ? 'LoD' : 'RotW'} · ${['', '美服', '欧服', '亚服'][r.region]} · ${r.ladder === 1 ? '天梯' : '非天梯'} · ${r.hc === 1 ? '专家' : '普通'}`;

export function validateSettings(input) {
  if (!input || typeof input.enabled !== 'boolean') throw new Error('启用状态无效');
  if (!Number.isInteger(input.threshold) || input.threshold < 1 || input.threshold > 6) throw new Error('阈值必须是 1–6');
  if (!Number.isInteger(input.maxAgeMinutes) || input.maxAgeMinutes < 5 || input.maxAgeMinutes > 10080) throw new Error('上报有效期必须为 5–10080 分钟');
  const out = { enabled: input.enabled, threshold: input.threshold, maxAgeMinutes: input.maxAgeMinutes };
  for (const [field, allowed] of Object.entries({ regions: [1,2,3], ladders: [1,2], hardcore: [1,2], versions: [1,2] })) {
    const value = input[field];
    if (!Array.isArray(value) || !value.length || value.some(x => !allowed.includes(x))) throw new Error('请选择有效的监控范围');
    out[field] = [...new Set(value)];
  }
  return out;
}

export function normalizeRows(data, now = Date.now()) {
  if (!Array.isArray(data) || data.length === 0 || data.length > 24) throw new Error('数据源返回了无效记录');
  const keys = new Set();
  return data.map(raw => {
    const row = Object.fromEntries(['progress','region','ladder','hc','timestamped','ver'].map(k => [k, Number(raw[k] ?? (k === 'ver' ? 1 : NaN))]));
    if (![1,2,3,4,5,6].includes(row.progress) || ![1,2,3].includes(row.region) ||
        ![1,2].includes(row.ladder) || ![1,2].includes(row.hc) || ![1,2].includes(row.ver) ||
        !Number.isSafeInteger(row.timestamped) || row.timestamped <= 0 || row.timestamped * 1000 > now + 300000 || keys.has(keyOf(row))) throw new Error('数据源记录格式异常');
    keys.add(keyOf(row));
    return row;
  });
}

export function selected(row, settings) {
  return settings.regions.includes(row.region) && settings.ladders.includes(row.ladder) &&
    settings.hardcore.includes(row.hc) && settings.versions.includes(row.ver);
}
export const fresh = (row, settings, now) => now - (row.checkedAt ?? row.timestamped * 1000) <= settings.maxAgeMinutes * 60000;

export function initialState() {
  return { settings: structuredClone(DEFAULT_SETTINGS), tracks: {}, rows: [], events: [], lastAttempt: null, lastSuccess: null, sourceError: null, pushError: null, lastPush: null, lastTest: null };
}

// Only a newer report of stage 1 starts a new cycle. A correction 5 -> 4 must not re-alert.
export function observe(state, rows, now) {
  for (const row of rows) {
    const key = keyOf(row);
    let track = state.tracks[key];
    if (track && row.timestamped < track.timestamped) continue;
    if (!track) track = state.tracks[key] = { cycle: 1, progress: row.progress, timestamped: row.timestamped, sent: [], pending: {} };
    else if (row.progress === 1 && track.progress > 1 && row.timestamped > track.timestamped) {
      track.cycle++;
      track.sent = [];
      track.pending = {};
    }
    track.progress = row.progress;
    track.timestamped = row.timestamped;
    if (state.settings.enabled && selected(row, state.settings) && fresh(row, state.settings, now) && row.progress >= state.settings.threshold && !track.sent.includes(row.progress)) {
      track.pending[row.progress] ??= { ...row, observedAt: now, attempts: 0, nextAttempt: now };
    }
  }
  // Preserve last known records if the upstream temporarily omits a mode.
  const merged = new Map(state.rows.map(row => [keyOf(row), row]));
  for (const row of rows) if (!merged.has(keyOf(row)) || merged.get(keyOf(row)).timestamped <= row.timestamped) merged.set(keyOf(row), row);
  state.rows = [...merged.values()];
}

export function pendingEvents(state, now) {
  const due = [];
  for (const [key, track] of Object.entries(state.tracks)) {
    for (const [stage, event] of Object.entries(track.pending)) {
      if (!state.settings.enabled || !selected(event, state.settings) || event.progress < state.settings.threshold || !fresh(event, state.settings, now)) {
        delete track.pending[stage];
      } else if (event.nextAttempt <= now) due.push({ key, stage: Number(stage), event });
    }
  }
  return due;
}

export function recordEvent(state, entry) {
  state.events.unshift(entry);
  state.events = state.events.slice(0, 100);
}
