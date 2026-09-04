import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNavigation, activeView } from './useNavigation';

describe('useNavigation composable', () => {
  beforeEach(() => {
    window.location.hash = '';
    activeView.value = 'list';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    const nav = useNavigation();
    nav.cleanupNavigation();
  });

  it('defaults to list view when hash is empty', () => {
    const { activeView: view, initNavigation } = useNavigation();
    initNavigation();
    expect(view.value).toBe('list');
  });

  it('parses initial hash from window.location.hash', () => {
    window.location.hash = '#study';
    const { activeView: view, initNavigation } = useNavigation();
    initNavigation();
    expect(view.value).toBe('study');
  });

  it('updates window.location.hash when view changes', async () => {
    const { setView } = useNavigation();
    setView('dashboard');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(window.location.hash).toBe('#dashboard');
  });

  it('updates view on hashchange event', () => {
    const { activeView: view, initNavigation } = useNavigation();
    initNavigation();
    window.location.hash = '#study';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(view.value).toBe('study');
  });
});
