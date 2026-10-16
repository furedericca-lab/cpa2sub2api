export type JsonObject = Record<string, unknown>;
export type Direction = 'cpa-to-sub2api' | 'sub2api-to-cpa';
export type Provider = 'codex' | 'claude' | 'gemini' | 'antigravity';

export interface Sub2apiAccount extends JsonObject {
  name: string;
  platform: string;
  type: 'oauth';
  credentials: JsonObject;
  concurrency: number;
  priority: number;
  extra?: JsonObject;
}

export interface Sub2apiDocument extends JsonObject {
  type: 'sub2api-data';
  version: 1;
  exported_at: string;
  proxies: JsonObject[];
  accounts: Sub2apiAccount[];
}

export interface ConversionOptions {
  concurrency: number;
  priority: number;
  now: Date;
}

export interface ConvertedEntry {
  id: string;
  source: string;
  label: string;
  provider: Provider;
  fileName: string;
  document: JsonObject | Sub2apiDocument;
  account?: Sub2apiAccount;
  warnings: string[];
}

export interface ConversionIssue {
  source: string;
  position?: number;
  reason: string;
}

export interface ConversionResult {
  entries: ConvertedEntry[];
  issues: ConversionIssue[];
}

export interface InputSource {
  name: string;
  text: string;
}

export const DEFAULT_SETTINGS = { concurrency: 10, priority: 1 };
export const LIMITS = { files: 500, bytes: 20 * 1024 * 1024, accounts: 5000, depth: 64 };
