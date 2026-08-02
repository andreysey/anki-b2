import { ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

const themeMode = ref<ThemeMode>(
  (localStorage.getItem('anki_theme_mode') as ThemeMode) || 'system'
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
  };

  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode;
    localStorage.setItem('anki_theme_mode', mode);
    applyTheme();
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

  watch(themeMode, applyTheme);

  return {
    themeMode,
    setThemeMode,
    cycleTheme,
    initTheme,
    cleanupTheme,
    applyTheme
  };
}
