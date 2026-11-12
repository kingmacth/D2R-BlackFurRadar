# 更新记录 / Changelog

## 2026-11-12

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
