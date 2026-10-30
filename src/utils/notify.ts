// Toast notifications. vue-sonner and its <Toaster> are loaded lazily so they stay out of the
// initial bundle. The first notification triggers that load and waits until the Toaster has
// mounted — a toast fired before then would be lost.

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

type ToastKind = 'success' | 'error' | 'warning' | 'info';

// Safety net: never hold a notification forever if the Toaster fails to load
const TOASTER_WAIT_MS = 3000;

let markReady: () => void = () => {};
const toasterReady = new Promise<void>((resolve) => (markReady = resolve));

/** Called by the Toaster component once it is mounted. */
export const markToasterReady = (): void => markReady();

const show = async (kind: ToastKind, message: string, options?: ToastOptions) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('load-toaster'));
  await Promise.race([
    toasterReady,
    new Promise<void>((resolve) => setTimeout(resolve, TOASTER_WAIT_MS))
  ]);
  const { toast } = await import('vue-sonner');
  return options ? toast[kind](message, options) : toast[kind](message);
};

export const notify = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  warning: (message: string) => show('warning', message),
  info: (message: string, options?: ToastOptions) => show('info', message, options)
};
