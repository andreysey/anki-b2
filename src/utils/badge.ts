// PWA App Badging API helper (navigator.setAppBadge / clearAppBadge)
export function updateAppBadge(count: number): void {
  if (typeof navigator === 'undefined') return;

  try {
    if (count > 0 && 'setAppBadge' in navigator) {
      void (navigator as unknown as { setAppBadge: (c: number) => Promise<void> }).setAppBadge(count).catch(() => {
        // Silently ignore if denied or unsupported
      });
    } else if (count <= 0 && 'clearAppBadge' in navigator) {
      void (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {
        // Silently ignore
      });
    }
  } catch {
    // Unsupported browser or security restriction
  }
}
