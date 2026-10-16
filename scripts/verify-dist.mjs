import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../dist');
const files = await readdir(root);
if (!files.includes('index.html') || !files.includes('_headers')) throw new Error('Missing static deployment entry points');
if (files.includes('vendor') || files.includes('functions') || files.includes('_worker.js')) throw new Error('Unexpected runtime/source in static deployment');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
if (!html.includes('/assets/')) throw new Error('Missing bundled assets');
const headers = await readFile(resolve(root, '_headers'), 'utf8');
if (!headers.includes("connect-src 'none'")) throw new Error('Local-only CSP missing');
console.log('Static Pages artifact: PASS (entry point, bundled assets, local-only headers, no vendor/backend)');
