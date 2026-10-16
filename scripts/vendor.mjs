import { createHash } from 'node:crypto';
import { readdir, readFile, lstat, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const lockPath = resolve(root, 'vendor/vendor-lock.json');

async function digest(directory) {
  const hash = createHash('sha256');
  let files = 0;
  async function walk(path) {
    for (const entry of (await readdir(path)).sort()) {
      if (entry === '.git') continue;
      const full = resolve(path, entry);
      const stat = await lstat(full);
      if (stat.isDirectory()) await walk(full);
      else if (stat.isFile()) {
        hash.update(`${relative(directory, full)}\0`);
        hash.update(createHash('sha256').update(await readFile(full)).digest('hex'));
        hash.update('\n');
        files++;
      } else throw new Error('Vendor snapshots must contain regular files only');
    }
  }
  await walk(directory);
  return { sha256: hash.digest('hex'), files };
}

if (process.argv[2] === 'record' && process.argv[3]) {
  const sourceRoot = resolve(process.argv[3]);
  const vendors = [];
  for (const [name, url, license] of [
    ['sub2api', 'https://github.com/Wei-Shaw/sub2api', 'LGPL-3.0'],
    ['CLIProxyAPI', 'https://github.com/router-for-me/CLIProxyAPI', 'MIT'],
  ]) {
    const commit = execFileSync('git', ['-C', resolve(sourceRoot, name), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    vendors.push({ name, url, commit, license, ...await digest(resolve(root, 'vendor', name)) });
  }
  await writeFile(lockPath, JSON.stringify({ format: 1, storage: 'git-submodule', vendors }, null, 2) + '\n');
  console.log('Recorded vendor provenance and content digests');
} else if (process.argv[2] === 'verify') {
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  for (const vendor of lock.vendors) {
    const commit = execFileSync('git', ['-C', resolve(root, 'vendor', vendor.name), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (commit !== vendor.commit) throw new Error(`Vendor commit mismatch: ${vendor.name}. Run git submodule update --init --recursive.`);
    const actual = await digest(resolve(root, 'vendor', vendor.name));
    if (actual.sha256 !== vendor.sha256 || actual.files !== vendor.files) throw new Error(`Vendor snapshot changed: ${vendor.name}`);
    console.log(`${vendor.name}: PASS (${actual.files} files, ${vendor.commit.slice(0, 12)})`);
  }
} else throw new Error('Usage: node scripts/vendor.mjs verify | record <upstream-clone-directory>');
