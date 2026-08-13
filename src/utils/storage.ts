/**
 * Safe wrapper around localStorage with fallback handling and JSON parsing resilience.
 */
export const safeStorage = {
  getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (err) {
      console.warn(`[safeStorage] Failed to parse key "${key}" from localStorage:`, err);
      return defaultValue;
    }
  },

  getString(key: string, defaultValue = ''): string {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? item : defaultValue;
    } catch (err) {
      console.warn(`[safeStorage] Failed to get string key "${key}" from localStorage:`, err);
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (err) {
      console.error(`[safeStorage] Failed to set key "${key}" in localStorage:`, err);
      return false;
    }
  },

  removeItem(key: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[safeStorage] Failed to remove key "${key}" from localStorage:`, err);
      return false;
    }
  }
};
