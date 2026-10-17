// Keep personal deployment settings out of the repository. All npm Wrangler
// commands prefer the ignored local configuration when it exists.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const local = fileURLToPath(new URL('wrangler.local.jsonc', root));
const shared = fileURLToPath(new URL('wrangler.jsonc', root));
const cli = fileURLToPath(new URL('node_modules/wrangler/bin/wrangler.js', root));
const [command = 'dev', ...args] = process.argv.slice(2);
const result = spawnSync(process.execPath, [cli, command, '--config', existsSync(local) ? local : shared, ...args], {
  cwd: fileURLToPath(root), stdio: 'inherit', windowsHide: true,
});
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
