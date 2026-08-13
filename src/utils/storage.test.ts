import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeStorage } from './storage';

describe('safeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns default value when key is missing', () => {
    const res = safeStorage.getItem('non_existent_key', { fallback: true });
    expect(res).toEqual({ fallback: true });
  });

  it('correctly parses and returns valid JSON object', () => {
    localStorage.setItem('test_obj', JSON.stringify({ name: 'Anki', count: 42 }));
    const res = safeStorage.getItem('test_obj', { name: '', count: 0 });
    expect(res).toEqual({ name: 'Anki', count: 42 });
  });

  it('handles invalid JSON gracefully without throwing and returns default value', () => {
    localStorage.setItem('corrupted_key', 'INVALID_JSON_{[[');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const res = safeStorage.getItem('corrupted_key', ['default']);
    expect(res).toEqual(['default']);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('getString returns stored string or default', () => {
    expect(safeStorage.getString('theme', 'dark')).toBe('dark');
    localStorage.setItem('theme', 'light');
    expect(safeStorage.getString('theme', 'dark')).toBe('light');
  });

  it('setItem serializes objects and stores them', () => {
    const success = safeStorage.setItem('state', { active: true });
    expect(success).toBe(true);
    expect(localStorage.getItem('state')).toBe('{"active":true}');
  });

  it('removeItem removes item from localStorage', () => {
    localStorage.setItem('temp', '123');
    const success = safeStorage.removeItem('temp');
    expect(success).toBe(true);
    expect(localStorage.getItem('temp')).toBeNull();
  });
});
