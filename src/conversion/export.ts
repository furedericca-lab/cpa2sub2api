import { strToU8, zipSync } from 'fflate';
import { sub2apiBundle } from './converter';
import type { ConvertedEntry, Direction } from './types';

export function mergedDocument(entries: ConvertedEntry[], now = new Date()) {
  return sub2apiBundle(entries.flatMap((entry) => entry.account ? [entry.account] : []), now);
}

export function zipEntries(entries: ConvertedEntry[]): Uint8Array {
  if (!entries.length) throw new Error('没有可导出的结果。');
  const files = Object.fromEntries(entries.map((entry) => [entry.fileName, strToU8(JSON.stringify(entry.document, null, 2))]));
  return zipSync(files, { level: 6 });
}

export function exportName(direction: Direction, extension: 'json' | 'zip', now = new Date()): string {
  return `${direction === 'cpa-to-sub2api' ? 'sub2api' : 'cpa'}-${now.toISOString().replace(/[:.]/g, '-')}.${extension}`;
}
