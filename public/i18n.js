const translations = {
  '黑毛雷达': 'DClone Radar', '黑毛雷达 · D2R': 'DClone Radar · D2R',
  '暗黑破坏神 II 黑毛进度监控与微信报警': 'Diablo II Clone progress tracking and WeChat alerts',
  '管理设置': 'Manage alerts', '退出管理': 'Sign out', '显示语言': 'Display language',
  '庇护之地 · 预警哨站': 'SANCTUARY · EARLY WARNING', '恐惧将至，': 'Terror is coming. ', '提前知晓。': 'Be ready.',
  '每分钟检查黑毛进度，关键时刻通过微信通知你。': 'Checks DClone progress every minute and alerts you on WeChat.',
  '管理入口': 'ADMIN ACCESS', '调整你的报警': 'Manage your alerts',
  '进度公开显示。修改监控范围和微信报警需要管理密码。': 'Progress is public. Sign in to change tracking and WeChat alerts.',
  '管理密码': 'Admin password', '进入控制台': 'Sign in', '运行状态': 'Service status',
  '雷达状态': 'Radar status', '报警阈值': 'Alert threshold', '最近检查成功': 'Last successful check', '微信通道': 'WeChat channel',
  '监控进度': 'Tracked progress', '刷新状态 ↻': 'Refresh ↻',
  '显示已保存的监控范围 · 页面每 30 秒更新': 'Saved tracking scope · Page refreshes every 30 seconds',
  '正在读取进度…': 'Loading progress…', '云端每分钟检查，关闭页面仍会报警': 'Cloud checks every minute. Alerts continue when this page is closed.',
  '立即检查': 'Check now', '报警设置': 'Alert settings', '启用报警': 'Enable alerts',
  '服务器': 'Region', '可多选': 'Select one or more', '亚服': 'Asia', '美服': 'Americas', '欧服': 'Europe',
  '赛季模式': 'Ladder mode', '天梯': 'Ladder', '非天梯': 'Non-Ladder', '角色模式': 'Character mode', '普通': 'Softcore', '专家': 'Hardcore',
  '游戏版本': 'Expansion', '术士君临 RotW': 'Reign of the Warlock', '毁灭之王 LoD': 'Lord of Destruction',
  '默认术士君临。公共 API 同时选两版本时交替查询，各每 2 分钟一次。': 'Defaults to RotW. With both expansions selected, the public API checks each once every 2 minutes.',
  '报警起始进度': 'Alert from stage', '1 · 平静': '1 · Quiet', '6 · 入侵': '6 · Invasion',
  '查询快照有效期（分钟）': 'Snapshot validity (minutes)',
  '按最近成功采集时间判断；进度长期未变不会被误判过期。默认 120 分钟。': 'Based on the last successful fetch, not the last stage change. Default: 120 minutes.',
  '达到阈值及以上时，每轮每个进度通知一次。回到进度 1 后开启新一轮。': 'One alert per stage at or above the threshold in each cycle. Stage 1 starts a new cycle.',
  '保存设置': 'Save settings', '发送微信测试消息 ↗': 'Send a WeChat test ↗', '通知记录': 'Notification history', '最近 100 条': 'Latest 100 events',
  '微信通道确认接收后记录成功。网络超时会重试，极少数情况下可能重复送达；未被轮询观测到的中间进度不会补发。': 'Success means the WeChat channel accepted the message. Timeouts are retried and may occasionally cause duplicates. Unobserved intermediate stages are not sent.',
  '为等待少一分焦虑': 'Stay ready for the next walk',
  'D2Emu 自动追踪 · 可人工修正': 'D2Emu automatic tracking · Manual corrections allowed',
  '实时进度 · 每分钟查询': 'Live progress · Checked every minute',
  '数据来自 diablo2.io，自动追踪由 D2Emu 提供，亦允许人工修正。“进度变更”是上次状态改变时间，长时间未变化不等于数据过期。': 'Data from diablo2.io, with automatic tracking powered by D2Emu and optional manual corrections. “Stage changed” means the last change, not the last fetch. An unchanged stage does not mean stale data.',
  '尚无记录': 'No records yet', '实时源未配置': 'Source not configured', '查询异常': 'Check unavailable', '暂无进度': 'No progress data',
  '数据过期': 'Snapshot expired', '报警已暂停': 'Alerts paused', '监控中': 'Monitoring', '登录后查看': 'Sign in to view',
  '未配置': 'Not configured', '需检查': 'Needs attention', '已配置': 'Configured',
  '最近检查超过 3 分钟未成功，请检查定时任务。': 'No successful check in over 3 minutes. Check the scheduled task.',
  '等待该模式的社区上报': 'Waiting for data for this mode', '最近查询': 'Last fetched', '历史记录': 'Historical record',
  ' · 查询已过期，不报警': ' · Snapshot expired; no alert', ' · 达到报警阈值': ' · Alert threshold reached',
  '暂无数据，不触发报警': 'No data; no alert', '进度变更': 'Stage changed',
  '暂无通知记录。可以先发送一条微信测试消息。': 'No notifications yet. Send a WeChat test to check the channel.',
  '恐惧凝视着庇护之地': 'Terror gazes upon Sanctuary.', '恐惧接近庇护之地': 'Terror approaches Sanctuary.',
  '恐惧开始在庇护之地成形': 'Terror begins to form within Sanctuary.', '恐惧蔓延至庇护之地': 'Terror spreads across Sanctuary.',
  '恐惧即将降临庇护之地': 'Terror is about to be unleashed upon Sanctuary.', '迪亚波罗入侵庇护之地': 'Diablo has invaded Sanctuary.',
  '服务暂时无法访问': 'The service is temporarily unavailable.', '操作失败': 'The request failed.',
  '请求超时，请稍后刷新状态确认结果': 'Request timed out. Refresh shortly to confirm the result.',
  '服务器、赛季、角色和版本都至少选一项': 'Select at least one region, ladder mode, character mode, and expansion.',
  '设置已保存，下次云端检查生效': 'Settings saved. Changes apply to the next cloud check.',
  '已检查；距离上次请求不足 60 秒时复用最近结果': 'Checked. Results are reused if the last request was less than 60 seconds ago.',
  '测试消息已提交微信通道，请查看微信': 'Test submitted to the WeChat channel. Please check WeChat.',
  '管理密码不正确': 'Incorrect admin password.', '尚未配置管理密码 ADMIN_TOKEN': 'The admin password has not been configured.',
  '请求来源不允许': 'This request origin is not allowed.', '需要 JSON 请求': 'A JSON request is required.', '请求过大': 'The request is too large.',
  '启用状态无效': 'Invalid alert enabled state.', '阈值必须是 1–6': 'The threshold must be between 1 and 6.',
  '上报有效期必须为 5–10080 分钟': 'Snapshot validity must be between 5 and 10080 minutes.', '请选择有效的监控范围': 'Choose a valid tracking scope.',
  '测试消息每分钟最多一次': 'Only one test message is allowed per minute.', '服务处理失败，请稍后重试': 'The service could not process the request. Try again shortly.',
  '数据源查询超时': 'The data source request timed out.', '数据源响应过大': 'The data source response is too large.',
  '数据源返回了非 JSON 响应': 'The data source returned a non-JSON response.', '数据源返回了无效记录': 'The data source returned invalid records.',
  '数据源记录格式异常': 'The data source returned malformed records.', '数据源时间无效': 'Invalid source timestamp.',
  '数据源服务器标识无效': 'Invalid source realm identifier.', '数据源进度无效': 'Invalid source progress.',
  '未配置 WXPUSH_TOKEN': 'The WeChat push token has not been configured.', '微信推送地址必须使用 HTTPS': 'The WeChat endpoint must use HTTPS.',
  '微信推送超时，将重试': 'WeChat push timed out; retry scheduled.', '微信通道连接失败，将重试': 'WeChat connection failed; retry scheduled.',
  '测试消息已提交微信通道': 'Test submitted to the WeChat channel',
};

let language = 'zh-CN';
try { if (localStorage.getItem('radar-language') === 'en') language = 'en'; } catch {}
export const getLanguage = () => language;
export const t = text => language === 'en' ? (translations[text] ?? text) : text;
export const formatDate = value => value ? new Date(value).toLocaleString(language === 'en' ? 'en-GB' : 'zh-CN', {hour12:false}) : t('尚无记录');

// API and persisted history remain language-neutral: translate their existing
// Chinese messages at display time without changing shared alert settings.
export function translateMessage(message) {
  if (!message || language !== 'en') return message;
  if (translations[message]) return translations[message];
  const failed = message.match(/^数据源查询失败：(.*)$/);
  if (failed) return `Data source request failed: ${translateMessage(failed[1])}`;
  const http = message.match(/^数据源 HTTP (\d+)$/);
  if (http) return `Data source HTTP ${http[1]}`;
  const wechat = message.match(/^微信通道未确认成功（HTTP (\d+)）$/);
  if (wechat) return `WeChat channel did not confirm success (HTTP ${wechat[1]})`;
  let result = message;
  for (const [zh,en] of [['美服','Americas'],['欧服','Europe'],['亚服','Asia'],['非天梯','Non-Ladder'],['天梯','Ladder'],['专家','Hardcore'],['普通','Softcore'],['推送失败，将重试','push failed; retry scheduled'],['已提交微信通道','submitted to WeChat'],['进度','stage']]) result=result.replaceAll(zh,en);
  return result;
}

const staticText = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  const node=walker.currentNode;
  const source=node.textContent.trim();
  if (translations[source]) staticText.push({node,source,original:node.textContent});
}
const attributes=[];
for (const element of document.querySelectorAll('[placeholder], [aria-label], meta[name="description"]')) {
  for (const name of ['placeholder','aria-label','content']) {
    const source=element.getAttribute(name);
    if (translations[source]) attributes.push({element,name,source});
  }
}
export function applyLanguage() {
  document.documentElement.lang=language;
  document.title=t('黑毛雷达 · D2R');
  for (const {node,source,original} of staticText) node.textContent=original.replace(source,t(source));
  for (const {element,name,source} of attributes) element.setAttribute(name,t(source));
  document.getElementById('language').value=language;
}
export function setLanguage(value) {
  language=value === 'en' ? 'en' : 'zh-CN';
  try {localStorage.setItem('radar-language',language);} catch {}
  applyLanguage();
}
