import { compact, isObject, jwtPayload, parseDocuments, safeFileName, text, timestamp, unixSeconds } from './json';
import { DEFAULT_SETTINGS, LIMITS, type ConversionOptions, type ConversionResult, type ConvertedEntry, type Direction, type InputSource, type JsonObject, type Provider, type Sub2apiAccount, type Sub2apiDocument } from './types';

const platforms: Record<Provider, string> = { codex: 'openai', claude: 'anthropic', gemini: 'gemini', antigravity: 'antigravity' };
const providers: Record<string, Provider | undefined> = { codex: 'codex', openai: 'codex', claude: 'claude', anthropic: 'claude', gemini: 'gemini', antigravity: 'antigravity' };
const mappedCPAKeys = new Set(['type', 'access_token', 'refresh_token', 'id_token', 'token', 'account_id', 'account_uuid', 'organization_uuid', 'email', 'expired', 'last_refresh', 'plan_type', 'project_id', 'expires_in', 'timestamp', 'token_type']);

function object(value: unknown): JsonObject {
  return isObject(value) ? value : {};
}

function required(value: unknown, field: string): string {
  const result = text(value);
  if (!result) throw new Error(`缺少 ${field}，无法转换此账号。`);
  if (/^[•*]{3,}$/.test(result) || /^(\[redacted\]|<redacted>|redacted)$/i.test(result) || result.includes('****')) throw new Error(`${field} 已脱敏，请使用管理员原始导出。`);
  return result;
}

function providerOf(value: unknown, cpa: boolean): Provider {
  const key = text(value)?.toLowerCase();
  const provider = key ? providers[key] : undefined;
  if (!provider) throw new Error(cpa ? '不支持或缺少 CPA type；支持 codex、claude、gemini、antigravity。' : '不支持此 platform；支持 openai、anthropic、gemini、antigravity。');
  return provider;
}

function getExpiry(record: JsonObject, token: JsonObject, claims: JsonObject): string | undefined {
  const explicit = timestamp(record.expired) ?? timestamp(token.expiry) ?? timestamp(token.expires_at) ?? timestamp(token.expiration) ?? timestamp(token.expires_in_abs) ?? timestamp(claims.exp);
  if (explicit) return explicit;
  if (typeof record.timestamp === 'number' && typeof record.expires_in === 'number') {
    const base = timestamp(record.timestamp);
    return base ? timestamp(Date.parse(base) + record.expires_in * 1000) : undefined;
  }
  return undefined;
}

export function sub2apiBundle(accounts: Sub2apiAccount[], now: Date): Sub2apiDocument {
  return { type: 'sub2api-data', version: 1, exported_at: now.toISOString(), proxies: [], accounts };
}

function cpaToSub(record: JsonObject, source: string, options: ConversionOptions): Omit<ConvertedEntry, 'id'> {
  const provider = providerOf(record.type, true);
  if (record.use_siwc === true) throw new Error('SIWC 账号暂不支持转换。');
  const token = provider === 'gemini' ? object(record.token) : record;
  const accessToken = required(token.access_token ?? token.accessToken, provider === 'gemini' ? 'token.access_token' : 'access_token');
  const claims = jwtPayload(accessToken);
  const idClaims = jwtPayload(record.id_token);
  const auth = { ...object(idClaims['https://api.openai.com/auth']), ...object(claims['https://api.openai.com/auth']) };
  const profile = object(claims['https://api.openai.com/profile']);
  const email = text(record.email, profile.email, claims.email, idClaims.email);
  const expires = getExpiry(record, token, claims);
  const refresh = text(token.refresh_token, token.refreshToken);
  const warnings: string[] = [];
  if (!refresh) warnings.push('缺少 refresh_token，令牌到期后需重新授权。');
  if (!expires) warnings.push('缺少有效的到期时间，请在目标服务中检查。');
  if (expires && Date.parse(expires) <= options.now.getTime()) warnings.push('令牌已过期，导入后需刷新。');
  if (record.disabled === true) warnings.push('此账号在 CPA 中已停用；如需继续停用，请在 sub2api 中设置。');
  if (record.proxy_url) warnings.push('请在 sub2api 中重新配置此账号的代理。');
  const credentials = compact({
    access_token: accessToken,
    refresh_token: refresh,
    expires_at: provider === 'codex' ? expires : unixSeconds(expires),
  });
  if (provider === 'codex') {
    const organizations = Array.isArray(auth.organizations) ? auth.organizations.filter(isObject) : [];
    const organization = organizations.find((item) => item.is_default === true) ?? organizations[0];
    Object.assign(credentials, compact({
      id_token: text(record.id_token),
      chatgpt_account_id: text(record.account_id, auth.chatgpt_account_id),
      chatgpt_user_id: text(auth.chatgpt_user_id, auth.user_id),
      organization_id: text(organization?.id),
      email,
      plan_type: text(record.plan_type, auth.chatgpt_plan_type),
      expires_in: expires ? Math.max(0, Math.floor((Date.parse(expires) - options.now.getTime()) / 1000)) : undefined,
    }));
  } else if (provider === 'claude') {
    Object.assign(credentials, compact({ email_address: email, id_token: text(record.id_token), account_uuid: text(record.account_uuid), organization_uuid: text(record.organization_uuid) }));
  } else {
    Object.assign(credentials, compact({
      email,
      project_id: text(record.project_id),
      token_type: text(token.token_type, token.tokenType),
      scope: Array.isArray(token.scopes) ? token.scopes.filter((v): v is string => typeof v === 'string').join(' ') : text(token.scope),
      oauth_type: provider === 'gemini' && text(record.project_id) ? 'code_assist' : undefined,
      plan_type: text(record.plan_type),
    }));
    if (!text(record.project_id)) warnings.push('缺少 Google Cloud 项目 ID（project_id），请在目标服务中检查。');
  }
  const metadata = Object.fromEntries(Object.entries(record).filter(([key]) => !mappedCPAKeys.has(key)));
  const extra = compact({ email, last_refresh: timestamp(record.last_refresh), cpa2sub2api: { version: 1, provider, metadata } });
  const account: Sub2apiAccount = { name: email ?? source.replace(/\.json$/i, ''), platform: platforms[provider], type: 'oauth', credentials, concurrency: options.concurrency, priority: options.priority, extra };
  return { source, label: account.name, provider, fileName: `${safeFileName(source)}.sub2api.json`, account, document: sub2apiBundle([account], options.now), warnings };
}

function subToCPA(account: JsonObject, source: string, options: ConversionOptions): Omit<ConvertedEntry, 'id'> {
  if (account.type !== 'oauth') throw new Error('仅支持 OAuth 账号；API Key、setup-token 和 upstream 账号不转换。');
  const provider = providerOf(account.platform, false);
  const credentials = object(account.credentials);
  const extra = object(account.extra);
  const access = required(credentials.access_token, 'credentials.access_token');
  const refresh = text(credentials.refresh_token);
  const email = text(extra.email, credentials.email, credentials.email_address);
  const expires = timestamp(credentials.expires_at) ?? timestamp(jwtPayload(access).exp);
  const archive = object(extra.cpa2sub2api);
  const metadata = archive.version === 1 && archive.provider === provider
    ? Object.fromEntries(Object.entries(object(archive.metadata)).filter(([key]) => !mappedCPAKeys.has(key)))
    : {};
  const document: JsonObject = { ...metadata, type: provider, ...compact({ email, last_refresh: timestamp(extra.last_refresh) }) };
  const warnings: string[] = [];
  if (!refresh) warnings.push('缺少 refresh_token，令牌到期后需重新授权。');
  if (!expires) warnings.push('缺少有效的到期时间，请在目标服务中检查。');
  if (expires && Date.parse(expires) <= options.now.getTime()) warnings.push('令牌已过期，导入后需刷新。');
  if (account.proxy_key) warnings.push('请在 CPA 中重新配置此账号的代理。');
  if (provider === 'gemini') {
    Object.assign(document, compact({ project_id: text(credentials.project_id), auto: typeof extra.auto === 'boolean' ? extra.auto : metadata.auto, checked: typeof extra.checked === 'boolean' ? extra.checked : metadata.checked }));
    document.token = compact({ access_token: access, refresh_token: refresh, expiry: expires, token_type: text(credentials.token_type), scope: text(credentials.scope) });
  } else {
    Object.assign(document, compact({ access_token: access, refresh_token: refresh, expired: expires }));
    if (provider === 'codex') {
      document.refresh_token = refresh ?? '';
      Object.assign(document, compact({ id_token: text(credentials.id_token), account_id: text(credentials.chatgpt_account_id), plan_type: text(credentials.plan_type) }));
      if (!text(credentials.id_token)) warnings.push('缺少 id_token，CPA 可读取的身份信息有限。');
    } else if (provider === 'claude') Object.assign(document, compact({ id_token: text(credentials.id_token), account_uuid: text(credentials.account_uuid), organization_uuid: text(credentials.organization_uuid) }));
    else Object.assign(document, compact({ project_id: text(credentials.project_id), token_type: text(credentials.token_type), plan_type: text(credentials.plan_type) }));
  }
  warnings.push('sub2api 的并发、优先级、分组、计费和模型映射设置会留在原服务中。');
  const label = text(account.name, email) ?? 'account';
  return { source, label, provider, fileName: `${safeFileName(email ?? label)}.${provider}.json`, document, warnings };
}

function accountsOf(document: unknown, direction: Direction): unknown[] {
  if (Array.isArray(document)) return document;
  if (!isObject(document)) throw new Error('输入不是 JSON 对象或数组。');
  if (direction === 'cpa-to-sub2api') {
    if (Array.isArray(document.accounts)) throw new Error('检测到 sub2api 文档，请切换转换方向。');
    return [document];
  }
  if (Array.isArray(document.accounts)) {
    if (document.type !== undefined && document.type !== 'sub2api-data' && document.type !== 'sub2api-bundle') throw new Error('不支持此 sub2api 文档类型。');
    if (document.version !== undefined && document.version !== 0 && document.version !== 1) throw new Error('不支持此 sub2api 文档版本。');
    return document.accounts;
  }
  if (document.platform && document.credentials) return [document];
  throw new Error('缺少 accounts 数组；如果这是 CPA 文件，请切换转换方向。');
}

export function convertSources(sources: InputSource[], direction: Direction, settings: Partial<ConversionOptions> = {}): ConversionResult {
  const options = { ...DEFAULT_SETTINGS, now: new Date(), ...settings };
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 1000 || !Number.isInteger(options.priority) || options.priority < 0 || options.priority > 100000) throw new Error('并发数须为 1–1000 的整数，优先级须为 0–100000 的整数。');
  if (!Number.isFinite(options.now.getTime())) throw new Error('无效的导出时间。');
  if (sources.length > LIMITS.files || sources.reduce((n, item) => n + new TextEncoder().encode(item.text).byteLength, 0) > LIMITS.bytes) throw new Error('一次最多 500 个文件，总大小不超过 20 MiB。');
  const result: ConversionResult = { entries: [], issues: [] };
  const usedNames = new Set<string>();
  let attempted = 0;
  for (const source of sources) {
    try {
      const documents = parseDocuments(source.text);
      for (const doc of documents) {
        const accounts = accountsOf(doc, direction);
        if (!accounts.length) throw new Error('账号数组为空。');
        if (attempted + accounts.length > LIMITS.accounts) throw new Error('账号数量超过 5000 条限制；此文档未转换。');
        for (const [index, account] of accounts.entries()) {
          attempted++;
          try {
            if (!isObject(account)) throw new Error('账号不是 JSON 对象。');
            const entry = direction === 'cpa-to-sub2api' ? cpaToSub(account, source.name, options) : subToCPA(account, source.name, options);
            const originalName = entry.fileName;
            let suffix = 2;
            while (usedNames.has(entry.fileName.toLowerCase())) entry.fileName = originalName.replace(/\.json$/, `-${suffix++}.json`);
            usedNames.add(entry.fileName.toLowerCase());
            result.entries.push({ ...entry, id: `entry-${result.entries.length + 1}` });
          } catch (error) {
            result.issues.push({ source: source.name, position: index + 1, reason: error instanceof Error ? error.message : '无法转换此账号。' });
          }
        }
      }
    } catch (error) {
      result.issues.push({ source: source.name, reason: error instanceof Error ? error.message : '无法读取此文件。' });
    }
  }
  return result;
}
