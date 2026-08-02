import { describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from './useTheme';

describe('useTheme composable', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to system mode', () => {
    const { themeMode } = useTheme();
    expect(themeMode.value).toBe('system');
  });

  it('sets and applies light theme mode', () => {
    const { setThemeMode, themeMode } = useTheme();
    setThemeMode('light');
    expect(themeMode.value).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('anki_theme_mode')).toBe('light');
  });

  it('sets and applies dark theme mode', () => {
    const { setThemeMode, themeMode } = useTheme();
    setThemeMode('dark');
    expect(themeMode.value).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('anki_theme_mode')).toBe('dark');
  });

  it('cycles theme mode from system -> light -> dark -> system', () => {
    const { cycleTheme, themeMode, setThemeMode } = useTheme();
    setThemeMode('system');

    cycleTheme();
    expect(themeMode.value).toBe('light');

    cycleTheme();
    expect(themeMode.value).toBe('dark');

    cycleTheme();
    expect(themeMode.value).toBe('system');
  });
});
