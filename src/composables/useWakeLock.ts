import { ref } from 'vue';

export function useWakeLock() {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const isLocked = ref(false);
  let shouldBeLocked = false;
  let sentinel: { release: () => Promise<void>; addEventListener: (event: string, cb: () => void) => void } | null = null;

  const requestWakeLock = async () => {
    shouldBeLocked = true;
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
  }

  const cleanup = () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
