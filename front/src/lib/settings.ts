import { DEFAULT_SETTINGS } from '../../../src/conversion/types';

const KEY = 'cpa2sub2api:preferences:v1';

export function loadSettings(): typeof DEFAULT_SETTINGS {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (parsed && typeof parsed === 'object' && 'concurrency' in parsed && 'priority' in parsed) {
      const { concurrency, priority } = parsed;
      if (typeof concurrency === 'number' && Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 1000 && typeof priority === 'number' && Number.isInteger(priority) && priority >= 0 && priority <= 100000) return { concurrency, priority };
    }
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: typeof DEFAULT_SETTINGS): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ concurrency: settings.concurrency, priority: settings.priority }));
    return true;
  } catch {
    return false;
  }
}
