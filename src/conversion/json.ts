import { LIMITS, type JsonObject } from './types';

export function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function text(...values: unknown[]): string | undefined {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

export function compact(value: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ''));
}

function assertDepth(value: unknown, depth = 0): void {
  if (depth > LIMITS.depth) throw new Error('JSON 嵌套过深，最多支持 64 层。');
  if (Array.isArray(value)) value.forEach((item) => assertDepth(item, depth + 1));
  else if (isObject(value)) Object.values(value).forEach((item) => assertDepth(item, depth + 1));
}

export function parseDocuments(input: string): unknown[] {
  if (new TextEncoder().encode(input).byteLength > LIMITS.bytes) throw new Error('输入超过 20 MiB 限制。');
  const source = input.replace(/^\uFEFF/, '').trim();
  if (!source) throw new Error('输入为空，请选择文件或粘贴 JSON。');
  const documents: unknown[] = [];
  let start = -1;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (start < 0) {
      if (/\s/.test(ch)) continue;
      if (ch !== '{' && ch !== '[') throw new Error('仅支持 JSON 对象、数组或逐行 JSON；请勿粘贴说明文字。');
      start = i;
    }
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === '{' || ch === '[') {
      depth++;
      if (depth > LIMITS.depth) throw new Error('JSON 嵌套过深，最多支持 64 层。');
    } else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) {
        try {
          const value: unknown = JSON.parse(source.slice(start, i + 1));
          assertDepth(value);
          documents.push(value);
        } catch {
          throw new Error('JSON 格式无效，请检查括号、引号和逗号。');
        }
        start = -1;
        if (documents.length > LIMITS.accounts) throw new Error('输入对象数量超过 5000 条限制。');
      }
    }
  }
  if (start >= 0 || depth !== 0 || quoted) throw new Error('JSON 不完整，请检查括号和引号。');
  return documents;
}

export function jwtPayload(value: unknown): JsonObject {
  if (typeof value !== 'string') return {};
  try {
    const payload = value.split('.')[1];
    if (!payload || payload.length > 65536) return {};
    const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0))));
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function timestamp(value: unknown): string | undefined {
  let milliseconds: number;
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim()))) {
    const numeric = Number(value);
    milliseconds = numeric < 1e11 ? numeric * 1000 : numeric;
  } else if (typeof value === 'string' && value.trim()) milliseconds = Date.parse(value);
  else return undefined;
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export function unixSeconds(value: unknown): string | undefined {
  const normalized = timestamp(value);
  return normalized ? String(Math.floor(Date.parse(normalized) / 1000)) : undefined;
}

export function safeFileName(value: string): string {
  const stem = value.normalize('NFKC').replace(/\.json$/i, '').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^[.\s-]+|[.\s-]+$/g, '').slice(0, 100);
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem)) return `account-${stem}`;
  return stem || 'account';
}

export function redact(value: unknown, key = ''): unknown {
  if (/(token|secret|password|api[_-]?key|private[_-]?key|authorization|cookie)/i.test(key) && typeof value === 'string') return value ? '••••••••' : '';
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)]));
  return value;
}
