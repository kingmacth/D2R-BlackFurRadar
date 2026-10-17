const $ = id => document.getElementById(id);
document.querySelector('.domain').textContent = window.location.host;
let token = '';
let current = null;
let dirty = false;
let feedbackTimer;
const stages = ['', '恐惧凝视着庇护之地', '恐惧接近庇护之地', '恐惧开始在庇护之地成形', '恐惧蔓延至庇护之地', '恐惧即将降临庇护之地', '迪亚波罗入侵庇护之地'];
function notify(message, error = false) {
  $('feedback').textContent = translateMessage(message);
  $('feedback').className = error ? 'error' : '';
  $('feedback').hidden = false;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => $('feedback').hidden = true, 6500);
}
async function api(path, options = {}) {
  const response = await fetch(`/api/${path}`, { ...options, headers: { ...(token ? {authorization: `Bearer ${token}`} : {}), ...options.headers }, signal: AbortSignal.timeout(90000) });
  let data;
  try { data = await response.json(); } catch { throw new Error('服务暂时无法访问'); }
  if (response.status === 401) logout();
  if (!response.ok) throw new Error(data.error || '操作失败');
  return data;
}
function logout() {
  token = '';
  dirty = false;
  setAdminUI(false);
  $('login').hidden = true;
  $('token').value = '';
  $('events').replaceChildren();
  if (current) render({ ...current, events: [], pushConfigured: undefined, pushError: null });
  refresh().catch(e => notify(e.message, true));
}
function setAdminUI(admin) {
  $('logout').hidden = !admin;
  $('manage').hidden = admin;
  $('settings-panel').hidden = !admin;
  $('history-panel').hidden = !admin;
  $('check').hidden = !admin;
  $('workspace').classList.toggle('public-view', !admin);
}
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function matches(row, s) { return s.regions.includes(row.region) && s.ladders.includes(row.ladder) && s.hardcore.includes(row.hc) && s.versions.includes(row.ver); }
function label(r) { return `${r.ver === 1 ? 'LoD' : 'RotW'} · ${t(['','美服','欧服','亚服'][r.region])} · ${t(r.ladder === 1 ? '天梯' : '非天梯')} · ${t(r.hc === 1 ? '专家' : '普通')}`; }
function render(data) {
  current = data;
  const s = data.settings;
  const live = data.sourceInfo?.live === true;
  const direct = data.sourceInfo?.id === 'd2emu';
  $('source-notice').hidden = direct;
  $('source-notice').textContent = t('数据来自 diablo2.io，自动追踪由 D2Emu 提供，亦允许人工修正。“进度变更”是上次状态改变时间，长时间未变化不等于数据过期。');
  $('source-link').textContent = direct ? 'd2emu.com' : 'diablo2.io';
  $('source-link').href = data.sourceInfo?.website || 'https://diablo2.io/dclonetracker.php';
  $('source-kind').textContent = t(direct ? '实时进度 · 每分钟查询' : 'D2Emu 自动追踪 · 可人工修正');
  const healthy = data.lastSuccess && Date.now() - data.lastSuccess < 180000 && !data.sourceError;
  const selectedRows = data.rows.filter(row => matches(row,s));
  const hasFreshData = selectedRows.some(row => Date.now()-(row.checkedAt ?? row.timestamped*1000) <= s.maxAgeMinutes*60000);
  $('radar-status').textContent = t(!live ? '实时源未配置' : !healthy ? '查询异常' : !selectedRows.length ? '暂无进度' : !hasFreshData ? '数据过期' : !s.enabled ? '报警已暂停' : '监控中');
  $('threshold-display').textContent = `${s.threshold} / 6`;
  $('last-check').textContent = date(data.lastSuccess);
  $('push-status').textContent = t(!token ? '登录后查看' : !data.pushConfigured ? '未配置' : data.pushError ? '需检查' : '已配置');
  const errors = [data.sourceError, data.pushError, data.lastSuccess && !healthy && !data.sourceError ? '最近检查超过 3 分钟未成功，请检查定时任务。' : null].filter(Boolean);
  $('service-errors').textContent = errors.map(translateMessage).join(' · ');
  $('service-errors').hidden = !errors.length;
  if (!dirty) {
    $('enabled').checked = s.enabled;
    $('threshold').value = s.threshold;
    $('threshold-value').value = `${s.threshold} / 6`;
    $('max-age').value = s.maxAgeMinutes;
    for (const name of ['regions','ladders','hardcore','versions']) document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = s[name].includes(Number(el.value)));
  }
  const container = $('progress-list');
  container.replaceChildren();
  // Render all selected combinations, including modes missing from the upstream.
  for (const ver of s.versions) for (const region of s.regions) for (const ladder of s.ladders) for (const hc of s.hardcore) {
    const row = data.rows.find(r => r.ver === ver && r.region === region && r.ladder === ladder && r.hc === hc);
    const stale = !row || Date.now() - (row.checkedAt ?? row.timestamped * 1000) > s.maxAgeMinutes * 60000;
    const active = row && !stale && row.progress >= s.threshold;
    const card = node('article', undefined, `progress-card${active ? ' alerting' : ''}`);
    const head = node('div', undefined, 'card-head');
    head.append(node('span', label({ver,region,ladder,hc}), 'mode-label'));
    const number = node('span', row ? row.progress : '—', 'progress-number');
    number.append(node('small', ' / 6'));
    head.append(number);
    card.append(head, node('p', t(row ? stages[row.progress] : '等待该模式的社区上报'), 'stage-message'));
    const bars = node('div', undefined, 'stage-bars');
    bars.setAttribute('aria-hidden', 'true');
    for (let i=1;i<=6;i++) bars.append(node('i', undefined, row && row.progress >= i ? 'filled' : ''));
    card.append(bars, node('p', row ? `${t(row.checkedAt ? '最近查询' : '历史记录')} ${date(row.checkedAt ?? row.timestamped * 1000)}${t(stale ? ' · 查询已过期，不报警' : active ? ' · 达到报警阈值' : '')}` : t('暂无数据，不触发报警'), `report-time${stale ? ' stale' : ''}`));
    if (row) card.append(node('p', `${t('进度变更')} ${date(row.timestamped * 1000)}`, 'report-time'));
    container.append(card);
  }
  $('events').replaceChildren();
  for (const event of data.events || []) {
    const row = node('div', undefined, `event ${event.type}`);
    row.append(node('time', date(event.at)), node('span', translateMessage(event.message)));
    $('events').append(row);
  }
  if (!data.events?.length) $('events').append(node('p', t('暂无通知记录。可以先发送一条微信测试消息。'), 'empty'));
}
async function refresh() { render(await api(token ? 'status' : 'public')); }
async function action(button, work) {
  button.disabled = true;
  try { await work(); } catch (e) { notify(e.name === 'TimeoutError' ? '请求超时，请稍后刷新状态确认结果' : e.message, true); }
  finally { button.disabled = false; }
}
$('login-form').addEventListener('submit', e => {
  e.preventDefault();
  action(e.submitter || e.target.querySelector('button'), async () => {
    token = $('token').value.trim();
    await refresh();
    $('token').value = '';
    $('login').hidden = true;
    $('dashboard').hidden = false;
    $('logout').hidden = false;
    setAdminUI(true);
  });
});
$('logout').addEventListener('click', logout);
$('manage').addEventListener('click', () => { $('login').hidden = !$('login').hidden; if (!$('login').hidden) $('token').focus(); });
$('settings-form').addEventListener('input', () => dirty = true);
$('enabled').addEventListener('change', () => dirty = true);
$('threshold').addEventListener('input', () => $('threshold-value').value = `${$('threshold').value} / 6`);
$('settings-form').addEventListener('submit', e => {
  e.preventDefault();
  action(e.submitter, async () => {
    const settings = { enabled: $('enabled').checked, threshold: Number($('threshold').value), maxAgeMinutes: Number($('max-age').value) };
    for (const name of ['regions','ladders','hardcore','versions']) {
      settings[name] = [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => Number(el.value));
      if (!settings[name].length) throw new Error('服务器、赛季、角色和版本都至少选一项');
    }
    await api('settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(settings) });
    dirty = false;
    await refresh();
    notify('设置已保存，下次云端检查生效');
  });
});
$('refresh').addEventListener('click', e => action(e.currentTarget, refresh));
$('check').addEventListener('click', e => action(e.currentTarget, async () => {
  const data = await api('check', { method: 'POST' });
  await refresh();
  notify(data.sourceError || '已检查；距离上次请求不足 60 秒时复用最近结果', Boolean(data.sourceError));
}));
$('test-push').addEventListener('click', e => action(e.currentTarget, async () => {
  await api('test-push', { method: 'POST' });
  await refresh();
  notify('测试消息已提交微信通道，请查看微信');
}));
$('language').addEventListener('change', e => {
  setLanguage(e.target.value);
  $('feedback').hidden = true;
  if (current) render(current);
});
applyLanguage();
refresh().catch(e => notify(e.message, true));
setInterval(() => { if (!document.hidden) refresh().catch(() => {}); }, 30000);
import { t, formatDate as date, translateMessage, applyLanguage, setLanguage } from './i18n.js';
