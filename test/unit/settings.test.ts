import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSettings, saveSettings } from '../../front/src/lib/settings';
import { DEFAULT_SETTINGS } from '../../src/conversion/types';

afterEach(() => vi.unstubAllGlobals());

describe('allowlisted nonsecret preferences', () => {
  it('saves only concurrency and priority regardless of extra caller data', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    saveSettings({ concurrency: 20, priority: 0, access_token: 'synthetic-secret' } as typeof DEFAULT_SETTINGS);
    expect(setItem).toHaveBeenCalledWith('cpa2sub2api:preferences:v1', '{"concurrency":20,"priority":0}');
  });
  it('loads valid preferences and ignores unrelated values', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{"concurrency":20,"priority":0,"access_token":"synthetic"}' });
    expect(loadSettings()).toEqual({ concurrency: 20, priority: 0 });
  });
  it.each(['broken', 'null', '[]', '{"concurrency":0,"priority":1}', '{"concurrency":10,"priority":-1}', '{"concurrency":"10","priority":1}'])('falls back for invalid persisted data: %s', (value) => {
    vi.stubGlobal('localStorage', { getItem: () => value });
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
  it('survives blocked storage access', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } });
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(DEFAULT_SETTINGS)).toBe(false);
  });
});
