import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(resolve(root, 'wrangler.jsonc'), 'utf8'));
if (config.name !== 'cpa2sub2api' || config.pages_build_output_dir !== './dist') {
  throw new Error('Unexpected Pages project or output directory');
}

const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: 'd7bf5987a206b7ea342add617a9d9dcd' };
delete env.CF_ACCOUNT_ID;
const result = spawnSync('pnpm', [
  'exec', 'wrangler', 'pages', 'deploy', 'dist',
  '--project-name', config.name, '--branch', 'main',
], { cwd: root, env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
