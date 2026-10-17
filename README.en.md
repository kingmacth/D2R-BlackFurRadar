# D2R BlackFurRadar

English | [简体中文](README.md)

A Cloudflare Worker that checks Diablo II: Resurrected DClone progress every minute and sends WeChat alerts. The public dashboard supports Chinese and English; an admin password protects alert settings, notification history, and test messages.

- Defaults: Asia, Ladder, Softcore, Reign of the Warlock, alert threshold **4/6**.
- Each observed stage at or above the threshold is announced once per cycle. A newer stage 1 report starts a new cycle.
- Settings, deduplication records, and pending notifications persist in a SQLite Durable Object.
- Notifications continue while the browser is closed. Failed pushes are retried with backoff.

## Data source

The default [diablo2.io public API](https://diablo2.io/post2417335.html) requires no API key. Its [tracker](https://diablo2.io/dclonetracker.php) uses automatic reports powered by D2Emu and also permits manual corrections. `ver=2` selects RotW; `ver=1` selects LoD. The API's last-change timestamp is displayed separately from the last successful fetch.

Requests are globally spaced at least 60 seconds apart, including manual checks and failed requests. If both expansions are selected, they alternate, so each is checked every two minutes. Third-party data may be delayed or unavailable; polling does not guarantee an instantaneous feed.

## Bring your own WeChat push service

**The author's current WeChat push service is personally self-hosted. It is not a shared public endpoint for users of this repository. You must deploy your own push service and configure your own endpoint, recipient, and token. No personal endpoint or credentials are included.**

Recommended project, also used by the author: [kingmacth/echat-work-push-plus](https://github.com/kingmacth/echat-work-push-plus). It sends messages through a self-managed WeCom application and supports Docker deployment. Follow that repository's README to configure the WeCom application and expose your service over HTTPS.

The radar calls its text endpoint:

```http
POST https://push.example.com/push
token: <your-own-token>
x-app-name: D2R-BlackFurRadar
Content-Type: application/x-www-form-urlencoded

message=<notification>&userId=<your-recipient>
```

Only HTTP 200 with the trimmed response body `ok` counts as accepted. Redirects are not followed. `userId` may be empty to use the push service's `DefaultReceiverUserId`. Configure the WeCom application secrets only on your push server; the radar only needs its push token.

## Setup and deployment

Requires Node.js 22 or newer and a Cloudflare account with Workers and Durable Objects access. Use `npm.cmd` / `npx.cmd` in PowerShell if its execution policy blocks npm scripts.

```sh
npm ci
cp wrangler.jsonc wrangler.local.jsonc
cp .dev.vars.example .dev.vars
```

Do not overwrite existing local configuration. The npm scripts automatically prefer the Git-ignored `wrangler.local.jsonc` when it exists. Edit these variables in your local configuration:

| Variable | Value |
| --- | --- |
| `WXPUSH_URL` | Your self-hosted HTTPS endpoint ending in `/push` |
| `WXPUSH_USER_ID` | Your recipient ID, or empty to use the push service default |
| `SITE_URL` | Your radar's deployed URL, included in notifications |

The shared configuration uses `workers.dev`. For your own custom domain, add `routes: [{ "pattern": "radar.example.com", "custom_domain": true }]` and set `workers_dev` to `false` in the local configuration.

```sh
npx wrangler login
npm run check
npm test
npm run build
npm run deploy
node scripts/wrangler.mjs secret put ADMIN_TOKEN
node scripts/wrangler.mjs secret put WXPUSH_TOKEN
```

Set a strong `ADMIN_TOKEN`. `WXPUSH_TOKEN` must match the `Token` of your own push service. Open your radar, sign in to the admin panel, and send a test message. Acceptance by the service does not guarantee client delivery. Timeouts and a process interruption immediately after sending may cause duplicates.

For local development, set these secrets in `.dev.vars` and run `npm run dev`. The optional direct D2Emu adapter requires your own `D2EMU_USERNAME` and `D2EMU_TOKEN`; these are not required for the default public source. See [D2Emu's documentation](https://d2emu.com/docs) to request access. This optional adapter has fixture coverage but has not been verified online with real credentials.

## Privacy and verification

`.dev.vars`, `.env` files, personal Wrangler configuration, local credential files, runtime state, logs, browser profiles, and screenshots are Git-ignored. The committed `.dev.vars.example` contains placeholders only. Keep actual passwords and tokens in local files or Cloudflare Secrets.

`npm test` covers notification cycles, deduplication, source parsing, snapshot freshness, retries, persistence, authentication, and the WeChat protocol. With Chrome or Edge installed, `node scripts/ui-check.mjs` verifies the public dashboard, admin settings, both languages, persisted language choice, and mobile layout using local fixtures. It sends no real push messages.
