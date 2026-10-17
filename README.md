# 黑毛雷达

[English](README.en.md) | 简体中文

部署在 Cloudflare Workers 的暗黑破坏神 II 黑毛进度微信报警服务。

- 运行平台：Cloudflare Workers + SQLite Durable Objects。
- 默认：亚服 / 天梯 / 普通角色 / 术士君临（RotW），进度达到 **4** 开始报警。
- 页面可多选亚服、美服、欧服，设置天梯、角色和游戏版本，调整阈值与查询快照有效期。
- Cron 每分钟检查。页面关闭后仍运行；页面刷新只读取缓存，不额外查询上游。
- 数据、设置、待发送消息和去重记录存储在 SQLite Durable Object，重新部署不会清空。
- 首页和进度查询无需密码；修改报警设置、查看通知记录和测试微信需要管理密码。微信 token 通过 Cloudflare Secret 配置，浏览器无法读取。
- 右上角可选择中文或 English，默认中文，浏览器会记住选择。页面、进度、时间格式、提示和历史记录随语言切换；语言偏好仅保存在当前浏览器，不修改共享报警配置。

## 数据与报警规则

默认数据源：[diablo2.io 公共 API](https://diablo2.io/post2417335.html)，接口 `https://diablo2.io/dclone_api.php?ver=2`，无需用户名或 token。`ver=2` 为术士君临，`ver=1` 为毁灭之王。站方在[追踪页](https://diablo2.io/dclonetracker.php)明确说明自动追踪由 D2Emu 提供，同时允许人工修正。它是第三方同步服务，不保证零延迟或上游游戏采集持续在线。

时间分开显示：**最近查询**是本服务成功获得快照的时间；**进度变更**来自 API 的 `timestamped`，表示上次进度报告/变更时间。进度几天没有变化不能据此判定接口几天没有更新。页面说明自动跟踪与人工修正的混合来源，不将同步延迟承诺为实时保证。

可选直连源：[D2Emu API](https://d2emu.com/docs)，接口 `https://d2emu.com/api/v1/dclone`。如果以后申请了自己的用户名和 token，可配置 `D2EMU_USERNAME`、`D2EMU_TOKEN` 两个 Secret，两项都存在时自动切换直连。适配器支持嵌套和平面响应；平面响应 `status` 0–5 转换为页面进度 1–6。此可选直连适配尚未使用真实凭据线上实测，不影响默认公共源。

服务全局限制相邻上游请求至少间隔 60 秒，包括手动检查、失败请求和 Cron 重试，满足接口要求。首次接收到有效且达到阈值的记录会报警。

默认只监控 RotW，每分钟查询一次。同时选择两个版本时交替查询，每个版本每 2 分钟一次，以遵守上游全局限频。可选的 D2Emu 直连一次快照读取全部版本。

按游戏版本、区服、天梯和角色分别去重。默认阈值 4 时，实际观测到的 4、5、6 每轮各发送一次；例如 3 直接跳到 5，只发送 5。同一轮 5 回落到 4 再回到 5 不重复发送。**更新的报告回到 1** 才开始新一轮；如果数据源没有记录新一轮的 1，无法可靠识别这一轮，因此可能漏报，不以普通回落猜测新一轮。

默认快照有效期 120 分钟，按成功取得快照的时间判断。接口最后变更时间独立展示。上游暂时遗漏的模式保留最后已知记录及其原采集时间。接口出错不清空记录，也不会把错误响应当成进度。更换数据源时清除旧进度和去重记录，避免混用。

推送失败写入待发送记录，按 2、4、8…最多 60 分钟间隔重试。关闭报警、取消某模式、提高阈值或数据过期会取消不再符合条件的待发送记录。通道确认成功后持久化去重；外部通道不提供幂等保障，超时或恰好在成功发送后进程中断可能造成重复消息。确认接收不代表微信客户端一定已送达。

## 微信通道

**作者当前使用的微信推送是个人自行搭建的服务，不是供本项目用户共享调用的公共通道。使用者需要自行部署微信推送服务，并修改推送地址、接收人和密钥。仓库不包含作者的实际服务地址、接收人或凭据。**

推荐作者实际使用的项目：[kingmacth/echat-work-push-plus](https://github.com/kingmacth/echat-work-push-plus)。它通过企业微信自建应用发送消息，支持 Docker 部署；本雷达使用它的 `/push` 文本接口。企业微信应用、服务部署和相关要求请按照该项目的 README 配置。

接入步骤：

1. 自行部署推荐的微信推送项目，配置自己的企业微信应用和接口 `Token`，通过 HTTPS 提供服务。
2. 将本项目配置中的 `WXPUSH_URL` 改为自己的完整 `/push` 地址，例如 `https://push.example.com/push`。
3. 将 `WXPUSH_USER_ID` 改为自己的接收人 ID；留空时由推送服务使用其 `DefaultReceiverUserId`。
4. 在 Cloudflare Secret 中设置 `WXPUSH_TOKEN`，值须与自建推送服务的 `Token` 一致。企业微信 CorpSecret 等应用凭据只配置在推送服务端，本项目不需要它们。
5. 在雷达管理页面发送测试消息，确认自己的微信能收到。

请求协议：

```text
POST https://push.example.com/push
token: <WXPUSH_TOKEN>
x-app-name: D2R-BlackFurRadar
Content-Type: application/x-www-form-urlencoded

message=<消息>&userId=<接收人>
```

只有 HTTP 200 且响应正文去除空格后为 `ok` 才认定成功。不跟随重定向，防止 token 发送到其他地址。

## 本地运行

需要 Node.js 22 或更新版本。PowerShell 下使用 `npm.cmd`，无需修改执行策略。

```powershell
npm.cmd ci --cache .npm-cache
Copy-Item .dev.vars.example .dev.vars
# 编辑 .dev.vars，设置 ADMIN_TOKEN 和 WXPUSH_TOKEN
npm.cmd run dev
```

已配置的工程请保留现有 `.dev.vars`，不要覆盖。`ADMIN_TOKEN` 是页面管理密码；仅保存在当前页面内存中，刷新页面后需要重新输入。`.dev.vars` 已被 Git 忽略，不要上传。

## 部署

Cloudflare 账户需要管理 Workers 和 Durable Objects 的权限；使用自定义域名时还需管理自己的域名。SQLite Durable Object 会自动创建。

`wrangler.jsonc` 仅含通用示例。首次部署建议复制成被 Git 忽略的 `wrangler.local.jsonc` 并填写自己的配置；`npm run dev/deploy/build` 会自动优先使用本地配置。

```powershell
Copy-Item wrangler.jsonc wrangler.local.jsonc
```

编辑本地配置中的变量：

| 配置项 | 填写内容 |
| --- | --- |
| `WXPUSH_URL` | 自行搭建的微信推送 HTTPS `/push` 地址，示例配置默认留空 |
| `WXPUSH_USER_ID` | 自己的接收人 ID，或留空使用推送服务默认接收人 |
| `SITE_URL` | 自己的雷达站点地址，会写入报警消息 |

默认使用 Cloudflare 提供的 `workers.dev` 域名。若使用自定义域名，在本地配置添加 `routes`，例如 `[{ "pattern": "radar.example.com", "custom_domain": true }]`，并将 `workers_dev` 设为 `false`。不要覆盖已有本地配置。

```powershell
npx.cmd wrangler login
npm.cmd run check
npm.cmd test
npm.cmd run build
npm.cmd run deploy
node scripts/wrangler.mjs secret put ADMIN_TOKEN
node scripts/wrangler.mjs secret put WXPUSH_TOKEN
# 可选：申请 D2Emu API 访问权后，配置两项以改用直连；公共源不需要：
node scripts/wrangler.mjs secret put D2EMU_USERNAME
node scripts/wrangler.mjs secret put D2EMU_TOKEN
```

也可通过环境变量 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 认证。密钥必须通过 Secret 设置，不要放到 `wrangler.jsonc` 或提交到 Git。修改管理密码后同步更新本地 `.dev.vars` 以便查阅。

`WXPUSH_URL`、`WXPUSH_USER_ID`、`SITE_URL` 是普通配置。修改域名时同时修改路由和 `SITE_URL`。部署后在页面登录，发送微信测试消息，检查最新查询成功时间。Cron 变更可能需要数分钟传播。

## 检查与排障

`npm.cmd test` 覆盖报警去重、轮次切换、数据解析和过期、范围筛选、失败重试、并发检查、重启持久化、管理认证与微信协议。

已安装 Chrome 或 Edge 时，可运行 `node scripts/ui-check.mjs` 做本地浏览器验证，截图保存在被 Git 忽略的 `artifacts/`。验证使用模拟数据，不发送微信消息。

- `GET /health`：公共服务存活检查，不代表上游数据新鲜。
- `GET /api/public`：公开查询已知进度与数据源状态，无推送记录或密钥。
- `GET /api/status`：认证后查看设置、已知进度与运行状态和通知记录。
- `PUT /api/settings`：认证后更新 JSON 配置。
- `POST /api/check`：立即检查，仍受 60 秒限制。
- `POST /api/test-push`：微信测试，每分钟最多一次。
- `/api/tick`：仅内部 Cron 可访问，公共路由拒绝调用。

认证使用请求头 `Authorization: Bearer <ADMIN_TOKEN>`。上游 HTTP 403、超时、无效 JSON、推送失败均会显示在控制台；日志最多保留 100 条通知事件。手动检查也可能触发真实报警。

页面所有资源随 Worker 部署，无 CDN、外部字体或浏览器端微信密钥。

## 隐私与提交

`.dev.vars`、`.env`、`wrangler.local.jsonc`、本地凭据文件、`.wrangler/` 运行数据与日志、浏览器测试配置及截图均被 Git 忽略。仓库提供的 `.dev.vars.example` 只有占位值。真实 token、管理密码、接收人和部署配置应保存在本地或 Cloudflare Secrets，不能提交到 GitHub。
