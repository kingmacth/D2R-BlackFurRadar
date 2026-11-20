# 更新记录 / Changelog

## 2026-11-20

- 新增中英文恐惧地带公开显示，展示当前、下一轮与本地时间；在线全区统一，不增加服务器选择。
- 接入 D2Runewizard 无 token JSON 接口，使用新接口地址，携带集成标识、来源署名，遵守缓存 TTL。
- 新增独立的微信提醒开关与 36 个可多选轮换区域组，默认关闭。下一轮命中订阅时开始前约 4–5 分钟提醒，同轮合并并去重。
- 提醒设置与去重持久化；缺失预测、过期数据、接口错误不发送，微信失败仅在开始前重试。
- 保留现有黑毛报警设置与两套 S16 攻略。补充提醒窗口、来源格式、失败重试、重启去重及公开接口隐私测试。

Added bilingual public current/upcoming Terror Zones and independent multi-zone WeChat subscriptions. Online regions share the rotation. Matching upcoming zones are announced once per rotation about 4–5 minutes early, with durable deduplication and retries only before the start. Uses the public D2Runewizard JSON API with attribution and cache-aware polling. Existing DClone settings and S16 guides are preserved.

## 2026-11-12

### S16 双流派补充 / Separate S16 builds

- 中英文 README 的两个流派介绍增加线上网站及各语言直达链接，并明确攻略、语言切换和等级查询均无需登录。
- 新增独立的高速开荒回响恶魔流，中英文完整正文、五阶段进度与 1–65 级查询；保留纯召唤为另一套独立流派，不合并内容。
- 首页首先突出“快速开荒方案”，两个流派各有独立顶栏入口和卡片。
- 两页及首页均标明 S16，分别位于 `/guides/s16/echo-demon` 与 `/guides/s16/summon-warlock`；旧链接保留语言参数并跳转 S16。之后的赛季应另建归档目录。
- 回响英文翻译覆盖静态内容与等级查询；两页共用语言偏好，切换语言保留所选等级。
- 14 项服务测试及双流派浏览器验证通过，涵盖英文完整性、S16 标记、等级查询、手机布局、旧链接及 CSP。

Added a separate bilingual Echoing Strike & Demons fast-leveling build with five stages and a level 1–65 lookup. Pure Summoner remains a distinct build. The homepage highlights the fast-leveling option first and provides separate navigation links and cards. Both guides are labeled S16 and stored under `/guides/s16/`; legacy links redirect to their S16 edition. Future seasons must have separate archives. Translation coverage, shared language preference, level retention, mobile layout and CSP were checked; all 14 service tests passed.

Both README versions now include live website links for each guide and language, with an explicit note that reading, language switching and level lookup require no login.

### 新增

- 召唤术士第16赛季开荒指南：`/guides/summon-warlock`，无需登录即可访问。
- 中文与英文完整内容、总览流程、等级加点查询、阶段配装、符文之语及刷图路线。
- 首页顶栏“开荒指南 ↗”与指南卡片入口，支持随页面语言跳转。
- 指南与雷达共用语言偏好，支持 `?lang=zh-CN` / `?lang=en` 直达；切换语言保留所选等级。
- 原始 HTML 导入脚本 `scripts/import-warlock-guide.py`，生成可部署页面并将重复配图保存为一份资源。

### 修复与维护

- 增加首屏可见的顶栏入口，提高指南入口的可发现性。
- HTML 响应设置 `Cache-Control: no-store` 和 `CDN-Cache-Control: no-store`，首页静态资源引用添加版本参数。
- 内联脚本与样式改为独立同站点资源，兼容现有严格 CSP；移除外部字体依赖。
- 优化指南在手机上的表格、网格布局和语言切换。
- 更新中英文 README，说明访问路径、使用方式、内容维护和再生成流程。

### 验证

- JavaScript 语法检查通过，13 项现有服务测试通过。
- 本地浏览器验证通过：公开首页、管理权限、中英文、语言记忆、顶栏入口、等级查询、切换语言保留等级、图片加载、手机布局及 CSP。
- 线上浏览器验证：首页首屏顶栏入口可见，点击成功进入指南页。
- 攻略内容来自提供的文档，游戏机制及活动时刻未另行核实。

### English

**Added:** A standalone, public Season 16 Summon Warlock guide with complete Chinese and English content, level-based skill lookup, progression, gear, runewords and farming routes. Homepage navigation and a guide card provide access. Language preference is shared with the radar; direct language URLs and level retention on language changes are supported. An importer packages the supplied HTML and deduplicates its illustration.

**Fixed:** Added a clearly visible header link. Disabled HTML caching and versioned homepage asset references. Moved inline scripts and styles to same-origin files for strict CSP compatibility, removed remote font dependencies, and improved mobile layouts. Updated both README versions with access and maintenance instructions.

**Verified:** Syntax checks, all 13 existing service tests, and local browser checks for navigation, bilingual content, language persistence, calculators, images, mobile layouts and CSP passed. A live-browser check confirmed the header link is visible and opens the guide. Supplied gameplay and event claims were not independently verified.
