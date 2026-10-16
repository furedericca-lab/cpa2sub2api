import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { convertSources } from '../../src/conversion/converter';
import { mergedDocument, zipEntries } from '../../src/conversion/export';
import { jwtPayload, parseDocuments, redact, safeFileName, timestamp, unixSeconds } from '../../src/conversion/json';
import { LIMITS, type Direction, type JsonObject, type Provider } from '../../src/conversion/types';
import { strFromU8, unzipSync } from 'fflate';
import { cpaFixture, EXPIRES, jwt, NOW, SECONDS } from '../fixtures/accounts';

function convert(data: unknown, direction: Direction = 'cpa-to-sub2api') {
  return convertSources([{ name: 'synthetic.json', text: JSON.stringify(data) }], direction, { now: NOW });
}

describe('provider mappings and round trips', () => {
  it.each<Provider>(['codex', 'claude', 'gemini', 'antigravity'])('round trips %s credentials and expiry', (provider) => {
    const original = cpaFixture(provider);
    const forward = convert(original);
    expect(forward.issues).toEqual([]);
    expect(forward.entries).toHaveLength(1);
    expect(forward.entries[0].account).toMatchObject({ type: 'oauth', concurrency: 10, priority: 1 });
    const bundle = mergedDocument(forward.entries, NOW);
    expect(bundle).toMatchObject({ type: 'sub2api-data', version: 1, proxies: [], exported_at: NOW.toISOString() });
    const reverse = convert(bundle, 'sub2api-to-cpa');
    expect(reverse.issues).toEqual([]);
    const document = reverse.entries[0].document as JsonObject;
    expect(document.type).toBe(provider);
    expect(document.email).toBe(original.email);
    if (provider === 'gemini') expect(document.token).toEqual(original.token);
    else {
      expect(document.access_token).toBe(original.access_token);
      expect(document.refresh_token).toBe(original.refresh_token);
      expect(document.expired).toBe(EXPIRES);
    }
  });

  it('maps Codex claims without requiring an id_token or a valid signed JWT', () => {
    const input = { ...cpaFixture('codex'), email: undefined, account_id: undefined, plan_type: undefined };
    const account = convert(input).entries[0].account!;
    expect(account.credentials).toMatchObject({ chatgpt_account_id: 'synthetic-account', chatgpt_user_id: 'synthetic-user', organization_id: 'synthetic-org', plan_type: 'plus', expires_at: EXPIRES });
    expect(convert({ type: 'codex', access_token: 'synthetic-opaque' }).entries).toHaveLength(1);
    expect(jwtPayload('not.jwt')).toEqual({});
  });

  it('does not guess Codex provider for missing type', () => {
    expect(convert({ access_token: 'synthetic' }).issues[0].reason).toContain('缺少 CPA type');
  });

  it('accepts missing refresh token and retains blank Codex field in reverse', () => {
    const forward = convert({ ...cpaFixture('codex'), refresh_token: undefined });
    expect(forward.entries[0].account!.credentials.refresh_token).toBeUndefined();
    expect(forward.entries[0].warnings).toContain('缺少 refresh_token，令牌到期后需重新授权。');
    expect(convert(mergedDocument(forward.entries, NOW), 'sub2api-to-cpa').entries[0].document.refresh_token).toBe('');
  });

  it('accepts native sub2api accounts without converter metadata', () => {
    const accounts = [
      { name: 'native-openai', platform: 'openai', type: 'oauth', credentials: { access_token: 'synthetic', id_token: 'synthetic-id', chatgpt_account_id: 'native-account', email: 'native@example.invalid', expires_at: String(SECONDS) } },
      { name: 'native-claude', platform: 'anthropic', type: 'oauth', credentials: { access_token: 'synthetic', email_address: 'claude@example.invalid', expires_at: SECONDS } },
      { name: 'native-google', platform: 'gemini', type: 'oauth', credentials: { access_token: 'synthetic', project_id: 'native-project', expires_at: EXPIRES }, extra: { email: 'gemini@example.invalid' } },
      { name: 'native-ag', platform: 'antigravity', type: 'oauth', credentials: { access_token: 'synthetic', email: 'ag@example.invalid', expires_at: EXPIRES } },
    ];
    const result = convert({ accounts }, 'sub2api-to-cpa');
    expect(result.issues).toEqual([]);
    expect(result.entries.map((entry) => entry.provider)).toEqual(['codex', 'claude', 'gemini', 'antigravity']);
    expect(result.entries[0].document).toMatchObject({ account_id: 'native-account', expired: EXPIRES });
    expect(result.entries[1].document.expired).toBe(EXPIRES);
    expect(result.entries[2].document).toMatchObject({ project_id: 'native-project', token: { expiry: EXPIRES } });
  });

  it('maps Gemini aliases and scopes and preserves false flags', () => {
    const record = { type: 'gemini', project_id: 'synthetic', checked: false, token: { accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh', expires_in_abs: SECONDS, scopes: ['openid', 'email'], tokenType: 'Bearer' } };
    const entry = convert(record).entries[0];
    expect(entry.account!.credentials).toMatchObject({ access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', expires_at: String(SECONDS), scope: 'openid email', token_type: 'Bearer', oauth_type: 'code_assist' });
    const reversed = convert(entry.document, 'sub2api-to-cpa').entries[0];
    expect(reversed.document.checked).toBe(false);
  });

  it('preserves unknown CPA metadata and device identity without activating proxy or disabled settings', () => {
    const record = { ...cpaFixture('claude'), disabled: true, proxy_url: 'http://proxy.invalid', prefix: 'synthetic-prefix', custom: { safe: false } };
    const forward = convert(record).entries[0];
    expect(forward.warnings.join(' ')).toContain('如需继续停用，请在 sub2api 中设置');
    expect(forward.warnings.join(' ')).toContain('请在 sub2api 中重新配置此账号的代理');
    const reversed = convert(forward.document, 'sub2api-to-cpa').entries[0];
    expect(reversed.document).toMatchObject({ disabled: true, proxy_url: 'http://proxy.invalid', prefix: 'synthetic-prefix', custom: { safe: false }, claude_device_ids: ['synthetic-device'] });
  });

  it('does not allow archived metadata to replace mapped credentials', () => {
    const account = convert(cpaFixture('claude')).entries[0].account!;
    account.extra = { cpa2sub2api: { version: 1, provider: 'claude', metadata: { type: 'codex', access_token: 'stale', id_token: 'stale', token: { access_token: 'stale' } } } };
    const output = convert(account, 'sub2api-to-cpa').entries[0].document;
    expect(output.type).toBe('claude');
    expect(output.access_token).toBe('synthetic-claude-access');
    expect(output.id_token).toBeUndefined();
    expect(output.token).toBeUndefined();
  });

  it('uses custom nonnegative settings and validates integer bounds', () => {
    const source = [{ name: 'synthetic.json', text: JSON.stringify(cpaFixture('codex')) }];
    expect(convertSources(source, 'cpa-to-sub2api', { concurrency: 23, priority: 0 }).entries[0].account).toMatchObject({ concurrency: 23, priority: 0 });
    for (const settings of [{ concurrency: 0 }, { concurrency: NaN }, { concurrency: 1.2 }, { priority: -1 }, { priority: Infinity }]) expect(() => convertSources(source, 'cpa-to-sub2api', settings)).toThrow('整数');
  });
});

describe('expiry handling', () => {
  it.each([SECONDS, String(SECONDS), SECONDS * 1000, String(SECONDS * 1000), EXPIRES, '2030-01-01T08:00:00+08:00'])('normalizes %s without milliseconds/seconds confusion', (value) => {
    expect(timestamp(value)).toBe(EXPIRES);
    expect(unixSeconds(value)).toBe(String(SECONDS));
  });
  it.each([undefined, null, '', 'invalid', Infinity, 1e30])('omits invalid timestamp %s without throwing', (value) => expect(timestamp(value)).toBeUndefined());
  it('derives Antigravity absolute expiry only from a known timestamp', () => {
    const base = { type: 'antigravity', access_token: 'synthetic', timestamp: NOW.getTime(), expires_in: 3600 };
    expect(convert(base).entries[0].account!.credentials.expires_at).toBe(String(NOW.getTime() / 1000 + 3600));
    expect(convert({ ...base, timestamp: undefined }).entries[0].account!.credentials.expires_at).toBeUndefined();
  });
  it('warns on expired credentials but does not refresh or discard them', () => {
    const entry = convert({ ...cpaFixture('claude'), expired: '2020-01-01T00:00:00Z' }).entries[0];
    expect(entry.warnings.some((warning) => warning.includes('已过期'))).toBe(true);
    expect(entry.account!.credentials.expires_at).toBe('1577836800');
  });
});

describe('batch validation', () => {
  it('isolates invalid accounts, preserves order and avoids silently deduplicating', () => {
    const valid = cpaFixture('claude');
    const result = convert([valid, { type: 'unsupported' }, null, valid]);
    expect(result.entries).toHaveLength(2);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.map((issue) => issue.position)).toEqual([2, 3]);
    expect(result.entries[0].fileName).not.toBe(result.entries[1].fileName);
  });
  it('continues after malformed files and never leaks parser token contents', () => {
    const result = convertSources([{ name: 'broken.json', text: '{"secret":"synthetic-sensitive", bad}' }, { name: 'good.json', text: JSON.stringify(cpaFixture('claude')) }], 'cpa-to-sub2api', { now: NOW });
    expect(result.entries).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(JSON.stringify(result.issues)).not.toContain('synthetic-sensitive');
  });
  it.each(['api-key', 'setup-token', 'upstream', 'unknown', undefined])('rejects non-OAuth account type %s', (type) => {
    const result = convert({ accounts: [{ platform: 'openai', type, credentials: { access_token: 'synthetic' } }] }, 'sub2api-to-cpa');
    expect(result.entries).toHaveLength(0);
    expect(result.issues[0].reason).toContain('仅支持 OAuth');
  });
  it('rejects unsupported platform and SIWC without leaking type values', () => {
    expect(convert({ type: 'codex', use_siwc: true, access_token: 'synthetic' }).issues[0].reason).toContain('SIWC');
    expect(convert({ type: 'synthetic-sensitive' }).issues[0].reason).not.toContain('synthetic-sensitive');
    expect(convert({ accounts: [{ platform: 'unknown', type: 'oauth', credentials: { access_token: 'synthetic' } }] }, 'sub2api-to-cpa').issues).toHaveLength(1);
  });
  it.each(['***', 'sk-****', '••••••••', '[REDACTED]', '<redacted>'])('rejects masked access token %s', (access_token) => expect(convert({ type: 'claude', access_token }).entries).toHaveLength(0));
  it('rejects direction mismatch, empty account arrays and future document headers', () => {
    expect(convert({ accounts: [] }).issues[0].reason).toContain('方向');
    expect(convert({ accounts: [] }, 'sub2api-to-cpa').issues[0].reason).toContain('为空');
    const account = convert(cpaFixture('codex')).entries[0].account;
    expect(convert({ version: 99, accounts: [account] }, 'sub2api-to-cpa').issues[0].reason).toContain('版本');
    expect(convert({ type: 'unrelated', accounts: [account] }, 'sub2api-to-cpa').issues[0].reason).toContain('类型');
    expect(convert({ type: 'sub2api-bundle', version: 0, accounts: [account] }, 'sub2api-to-cpa').entries).toHaveLength(1);
  });
  it('enforces source, byte, depth and account limits', () => {
    expect(() => convertSources(Array.from({ length: LIMITS.files + 1 }, () => ({ name: 'x', text: '{}' })), 'cpa-to-sub2api')).toThrow('500');
    expect(() => parseDocuments(' '.repeat(LIMITS.bytes + 1))).toThrow('20 MiB');
    expect(() => parseDocuments('['.repeat(65) + ']'.repeat(65))).toThrow('嵌套过深');
    const result = convert(Array.from({ length: LIMITS.accounts + 1 }, () => cpaFixture('claude')));
    expect(result.entries).toHaveLength(0);
    expect(result.issues[0].reason).toContain('5000');
  });
});

describe('JSON input, privacy and export', () => {
  it('parses BOM, JSONL and concatenated objects with escaped braces', () => {
    const object = { name: '中文 { "test" } \\ world' };
    expect(parseDocuments('\uFEFF ' + JSON.stringify(object) + '\n' + JSON.stringify([object]) + JSON.stringify(object))).toEqual([object, [object], object]);
  });
  it.each(['', '{', '{"key":}', '{]', 'explanation {}', '{} trailing', 'null', '"text"'])('rejects malformed input without exposing it: %s', (input) => expect(() => parseDocuments(input)).toThrow());
  it('decodes UTF-8 JWT claims locally without asserting authenticity', () => {
    expect(jwtPayload(jwt({ name: '测试用户' }))).toEqual({ name: '测试用户' });
    expect(jwtPayload(undefined)).toEqual({});
  });
  it('redacts nested secret fields without changing source objects', () => {
    const original = { token: { access_token: 'synthetic-access', refreshToken: 'synthetic-refresh', client_secret: 'synthetic-secret', expiry: EXPIRES }, password: 'synthetic-password', api_key: 'synthetic-key', value: false };
    const masked = redact(original);
    expect(JSON.stringify(masked)).not.toContain('synthetic-');
    expect(masked).toMatchObject({ value: false, token: { expiry: EXPIRES } });
    expect(original.token.access_token).toBe('synthetic-access');
  });
  it.each(['../../unsafe', 'C:\\secret\\file.json', 'CON', '', '测试/账号.json'])('uses flat, safe file names for %s', (name) => expect(safeFileName(name)).not.toMatch(/[/\\:]|^\./));
  it.each(['CON', 'NUL', 'aux.json', 'COM1.name', 'LPT9'])('avoids Windows reserved filename %s', (name) => expect(safeFileName(name)).toMatch(/^account-/));
  it('generates ZIP with unique flat names and original unmasked JSON', () => {
    const result = convert([cpaFixture('codex'), cpaFixture('codex'), cpaFixture('gemini')]);
    const zipped = unzipSync(zipEntries(result.entries));
    expect(Object.keys(zipped)).toHaveLength(3);
    for (const entry of result.entries) expect(JSON.parse(strFromU8(zipped[entry.fileName]))).toEqual(entry.document);
    expect(() => zipEntries([])).toThrow();
  });
  it('emits the header and account fields accepted by the pinned sub2api schema', () => {
    const source = readFileSync('vendor/sub2api/backend/internal/handler/admin/account_data.go', 'utf8');
    const payload = mergedDocument(convert(cpaFixture('codex')).entries, NOW);
    expect(source).toContain('dataType       = "sub2api-data"');
    expect(source).toContain('dataVersion    = 1');
    for (const field of Object.keys(payload)) expect(source).toContain(`json:"${field}`);
    expect(payload.accounts[0].credentials.access_token).toBeTruthy();
  });
});
