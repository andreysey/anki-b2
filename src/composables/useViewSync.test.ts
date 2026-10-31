import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

describe('useViewSync', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('turns study mode on when the app opens directly on #study', async () => {
    window.location.hash = '#study';
    const { useViewSync } = await import('./useViewSync');
    const { useVocabulary } = await import('./useVocabulary');
    const requestWakeLock = vi.fn();

    useViewSync({
      mainContent: ref(null),
      stopAudio: vi.fn(),
      requestWakeLock,
      releaseWakeLock: vi.fn()
    });

    expect(useVocabulary().isStudyMode.value).toBe(true);
    expect(requestWakeLock).toHaveBeenCalled();
    window.location.hash = '';
  });
});
