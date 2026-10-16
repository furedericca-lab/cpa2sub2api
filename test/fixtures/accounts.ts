import type { JsonObject, Provider } from '../../src/conversion/types';

export const NOW = new Date('2026-10-16T12:00:00.000Z');
export const EXPIRES = '2030-01-01T00:00:00.000Z';
export const SECONDS = Date.parse(EXPIRES) / 1000;

export function jwt(payload: JsonObject): string {
  return `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.synthetic`;
}

export function cpaFixture(provider: Provider): JsonObject {
  const common = { type: provider, email: `${provider}@example.invalid`, last_refresh: NOW.toISOString(), expired: EXPIRES };
  if (provider === 'gemini') return { ...common, project_id: 'synthetic-project', checked: false, auto: true, token: { access_token: 'synthetic-gemini-access', refresh_token: 'synthetic-gemini-refresh', expiry: EXPIRES, token_type: 'Bearer', scope: 'openid email' } };
  if (provider === 'codex') return {
    ...common,
    access_token: jwt({ exp: SECONDS, 'https://api.openai.com/auth': { chatgpt_account_id: 'synthetic-account', chatgpt_user_id: 'synthetic-user', chatgpt_plan_type: 'plus', organizations: [{ id: 'synthetic-org', is_default: true }] } }),
    id_token: jwt({ email: common.email }), refresh_token: 'synthetic-codex-refresh', account_id: 'synthetic-account', plan_type: 'plus',
  };
  return { ...common, access_token: `synthetic-${provider}-access`, refresh_token: `synthetic-${provider}-refresh`, ...(provider === 'claude' ? { account_uuid: 'synthetic-claude-account', organization_uuid: 'synthetic-claude-org', claude_device_ids: ['synthetic-device'] } : { project_id: 'synthetic-project', token_type: 'Bearer', plan_type: 'free' }) };
}
