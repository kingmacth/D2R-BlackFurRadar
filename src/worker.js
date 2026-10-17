import { STAGES, initialState, validateSettings, observe, pendingEvents, recordEvent, labelOf } from './core.js';
import { sourceInfo, querySource } from './sources.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const securityHeaders = {
  'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'strict-transport-security': 'max-age=31536000',
};
async function authorized(request, token) {
  if (!token) return false;
  const provided = request.headers.get('authorization') || '';
  if (provided.length > 1024) return false;
  const digest = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [a,b] = await Promise.all([digest(provided), digest(`Bearer ${token}`)]);
  return a.reduce((diff, byte, i) => diff | (byte ^ b[i]), 0) === 0;
}
const radar = env => env.RADAR.get(env.RADAR.idFromName('global'));

export default {
  async fetch(request, env) {
    let response;
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/public' && request.method === 'GET') response = await radar(env).fetch(request);
      else if (!env.ADMIN_TOKEN) response = json({ error: '尚未配置管理密码 ADMIN_TOKEN' }, 503);
      else if (!(await authorized(request, env.ADMIN_TOKEN))) response = json({ error: '管理密码不正确' }, 401);
      else if (!['GET','HEAD'].includes(request.method) && request.headers.get('origin') && request.headers.get('origin') !== url.origin) response = json({ error: '请求来源不允许' }, 403);
      else if (url.pathname === '/api/tick') response = json({ error: 'Not found' }, 404);
      else response = await radar(env).fetch(request);
    } else if (url.pathname === '/health') {
      response = json({ ok: true, service: 'd2r-blackfur-radar' });
    } else response = await env.ASSETS.fetch(request);
    response = new Response(response.body, response);
    for (const [k,v] of Object.entries(securityHeaders)) response.headers.set(k,v);
    return response;
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(radar(env).fetch('https://radar.internal/api/tick', { method: 'POST' }).then(async r => {
      if (!r.ok) throw new Error('Scheduled radar check failed');
      console.info(JSON.stringify({ event: 'radar_check', ...await r.json() }));
    }));
  },
};

export async function sendWechat(env, message, fetcher = fetch) {
  if (!env.WXPUSH_TOKEN) throw new Error('未配置 WXPUSH_TOKEN');
  const url = new URL(env.WXPUSH_URL);
  if (url.protocol !== 'https:') throw new Error('微信推送地址必须使用 HTTPS');
  const response = await fetcher(url, {
    method: 'POST', headers: { token: env.WXPUSH_TOKEN, 'x-app-name': 'D2R-BlackFurRadar' },
    body: new URLSearchParams({ message, userId: env.WXPUSH_USER_ID || '' }),
    signal: AbortSignal.timeout(15000), redirect: 'manual',
  });
  if (response.status !== 200 || (await response.text()).trim() !== 'ok') throw new Error(`微信通道未确认成功（HTTP ${response.status}）`);
}

export class RadarState {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.tail = Promise.resolve();
  }
  // Serialize storage, network calls and settings mutations across await boundaries.
  fetch(request) {
    const job = this.tail.then(() => this.handle(request));
    this.tail = job.catch(() => {});
    return job.catch(() => json({ error: '服务处理失败，请稍后重试' }, 500));
  }
  async handle(request) {
    const state = (await this.ctx.storage.get('state')) || initialState();
    const source = sourceInfo(this.env);
    const path = new URL(request.url).pathname;
    const sameSource = (state.provider || 'diablo2io') === source.id;
    const visible = { settings: state.settings, rows: sameSource ? state.rows : [], lastAttempt: state.lastAttempt, lastSuccess: sameSource ? state.lastSuccess : null, sourceError: state.sourceError, source: source.url, sourceInfo: source };
    if (request.method === 'GET' && path === '/api/public') return json(visible);
    if (request.method === 'GET' && path === '/api/status') return json({ ...state, ...visible, tracks: undefined, pushConfigured: Boolean(this.env.WXPUSH_TOKEN) });
    if (request.method === 'PUT' && path === '/api/settings') {
      if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: '需要 JSON 请求' }, 415);
      if (Number(request.headers.get('content-length') || 0) > 8192) return json({ error: '请求过大' }, 413);
      try {
        const text = await request.text();
        if (text.length > 8192) return json({ error: '请求过大' }, 413);
        state.settings = validateSettings(JSON.parse(text));
      } catch (e) { return json({ error: e.message }, 400); }
      pendingEvents(state, Date.now());
      await this.ctx.storage.put('state', state);
      return json({ settings: state.settings });
    }
    if (request.method === 'POST' && path === '/api/test-push') {
      const now = Date.now();
      if (state.lastTest && now - state.lastTest < 60000) return json({ error: '测试消息每分钟最多一次' }, 429);
      state.lastTest = now;
      await this.ctx.storage.put('state', state);
      try {
        await sendWechat(this.env, `【黑毛雷达 · 测试】\n微信推送通道连接成功。\n报警阈值：${state.settings.threshold}/6\n${this.env.SITE_URL}`);
        state.pushError = null;
        recordEvent(state, { type: 'test', at: now, message: '测试消息已提交微信通道' });
        await this.ctx.storage.put('state', state);
        return json({ ok: true });
      } catch (e) {
        state.pushError = e.message;
        await this.ctx.storage.put('state', state);
        return json({ error: state.pushError }, 502);
      }
    }
    if (request.method === 'POST' && ['/api/tick','/api/check'].includes(path)) {
      await this.poll(state);
      return json({ ok: !state.sourceError, lastSuccess: state.lastSuccess, sourceError: state.sourceError, pushError: state.pushError });
    }
    return json({ error: 'Not found' }, 404);
  }
  async poll(state) {
    const now = Date.now();
    // Upstream mandates >=60s, including failed calls, manual checks and cron retries.
    if (state.lastAttempt && now - state.lastAttempt < 60000) return;
    const info = sourceInfo(this.env);
    if ((state.provider || 'diablo2io') !== info.id) {
      state.rows = [];
      state.tracks = {};
      state.lastSuccess = null;
    }
    state.provider = info.id;
    state.lastAttempt = now;
    const versions = state.settings.versions;
    const version = versions[(versions.indexOf(state.lastVersion) + 1) % versions.length];
    state.lastVersion = version;
    await this.ctx.storage.put('state', state);
    try {
      observe(state, await querySource(this.env, version, now), now);
      state.lastSuccess = now;
      state.sourceError = null;
    } catch (e) {
      state.sourceError = e.name === 'TimeoutError' ? '数据源查询超时' : `数据源查询失败：${e.message.slice(0, 200)}`;
    }
    const due = pendingEvents(state, now);
    await this.ctx.storage.put('state', state); // Persist outbox before submitting messages.
    for (const item of due) {
      const { event, key, stage } = item;
      const message = `【黑毛进度报警 ${stage}/6】\n${labelOf(event)}\n${STAGES[stage]}\n进度变更：${new Date(event.timestamped * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}（北京时间）\n${this.env.SITE_URL}\nData courtesy of ${info.id === 'd2emu' ? 'd2emu.com' : 'diablo2.io'}`;
      try {
        await sendWechat(this.env, message);
        state.tracks[key].sent.push(stage);
        delete state.tracks[key].pending[stage];
        state.pushError = null;
        state.lastPush = Date.now();
        recordEvent(state, { type: 'alert', at: state.lastPush, stage, label: labelOf(event), reportAt: event.timestamped * 1000, message: `${labelOf(event)} · 进度 ${stage}/6 已提交微信通道` });
      } catch (e) {
        state.pushError = e.name === 'TimeoutError' ? '微信推送超时，将重试' : (e.message.startsWith('微信') || e.message.startsWith('未配置') ? e.message : '微信通道连接失败，将重试');
        event.attempts++;
        event.nextAttempt = now + Math.min(2 ** Math.min(event.attempts, 6), 60) * 60000;
        recordEvent(state, { type: 'error', at: Date.now(), message: `${labelOf(event)} · 进度 ${stage}/6 推送失败，将重试` });
        await this.ctx.storage.put('state', state);
        break; // Do not hammer an unavailable push service for every selected mode.
      }
      await this.ctx.storage.put('state', state);
    }
  }
}
