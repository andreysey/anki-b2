import { ref, watch } from 'vue';
import { safeStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeStyle = 'macos' | 'material';

const themeMode = ref<ThemeMode>(
  safeStorage.getString(STORAGE_KEYS.THEME_MODE, 'system') as ThemeMode
);

const themeStyle = ref<ThemeStyle>(
  (safeStorage.getString(STORAGE_KEYS.THEME_STYLE, 'macos') as ThemeStyle) === 'material'
    ? 'material'
    : 'macos'
);

export function useTheme() {
  let mediaQuery: MediaQueryList | null = null;

  const getSystemTheme = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  const applyTheme = () => {
    if (typeof document === 'undefined') return;

    const targetTheme = themeMode.value === 'system' ? getSystemTheme() : themeMode.value;

    if (targetTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (themeStyle.value === 'material') {
      document.documentElement.classList.add('theme-material');
      document.documentElement.classList.remove('theme-macos');
    } else {
      document.documentElement.classList.add('theme-macos');
      document.documentElement.classList.remove('theme-material');
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode;
    safeStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    applyTheme();
  };

  const setThemeStyle = (style: ThemeStyle) => {
    themeStyle.value = style;
    safeStorage.setItem(STORAGE_KEYS.THEME_STYLE, style);
    applyTheme();
  };

  const toggleThemeStyle = () => {
    setThemeStyle(themeStyle.value === 'macos' ? 'material' : 'macos');
  };

  const cycleTheme = () => {
    if (themeMode.value === 'system') {
      setThemeMode('light');
    } else if (themeMode.value === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('system');
    }
  };

  const handleSystemThemeChange = () => {
    if (themeMode.value === 'system') {
      applyTheme();
    }
  };

  const initTheme = () => {
    applyTheme();

    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemThemeChange);
      }
    }
  };

  const cleanupTheme = () => {
    if (mediaQuery) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    }
  };

  watch([themeMode, themeStyle], applyTheme);

  return {
    themeMode,
    themeStyle,
    setThemeMode,
    setThemeStyle,
    toggleThemeStyle,
    cycleTheme,
    initTheme,
    cleanupTheme,
    applyTheme
  };
}
