import { ref } from 'vue';

export function useWakeLock() {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const isLocked = ref(false);
  let shouldBeLocked = false;
  let sentinel: { release: () => Promise<void>; addEventListener: (event: string, cb: () => void) => void } | null = null;

  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

  const resetInactivityTimer = () => {
    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    if (shouldBeLocked) {
      if (!isLocked.value) {
        void requestWakeLock();
      }
      inactivityTimer = setTimeout(async () => {
        // Auto-release to prevent battery drain if user walks away
        if (sentinel) {
          try {
            await sentinel.release();
          } catch {
            // Ignore
          }
          sentinel = null;
          isLocked.value = false;
        }
      }, INACTIVITY_TIMEOUT_MS);
    }
  };

  const handleUserActivity = () => {
    if (shouldBeLocked) {
      resetInactivityTimer();
    }
  };

  const requestWakeLock = async () => {
    shouldBeLocked = true;
    resetInactivityTimer();
    if (!isSupported || isLocked.value) return;
    try {
      sentinel = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<any> } }).wakeLock.request('screen');
      isLocked.value = true;
      sentinel?.addEventListener('release', () => {
        isLocked.value = false;
        sentinel = null;
      });
    } catch {
      isLocked.value = false;
      sentinel = null;
    }
  };

  const releaseWakeLock = async () => {
    shouldBeLocked = false;
    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    if (sentinel) {
      try {
        await sentinel.release();
      } catch {
        // Ignore errors during release
      }
      sentinel = null;
    }
    isLocked.value = false;
  };

  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && shouldBeLocked && !isLocked.value) {
      await requestWakeLock();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => {
      document.addEventListener(ev, handleUserActivity, { passive: true });
    });
  }

  const cleanup = () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => {
        document.removeEventListener(ev, handleUserActivity);
      });
    }
    releaseWakeLock();
  };

  return {
    isSupported,
    isLocked,
    requestWakeLock,
    releaseWakeLock,
    cleanup
  };
}
