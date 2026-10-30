// Lazy wrapper so vue-sonner is not bundled into the critical path / initial bundle
const triggerToasterMount = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('load-toaster'));
  }
};

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export const notify = {
  success: (message: string) => {
    triggerToasterMount();
    return import('vue-sonner').then((m) => m.toast.success(message));
  },
  error: (message: string) => {
    triggerToasterMount();
    return import('vue-sonner').then((m) => m.toast.error(message));
  },
  warning: (message: string) => {
    triggerToasterMount();
    return import('vue-sonner').then((m) => m.toast.warning(message));
  },
  info: (message: string, options?: ToastOptions) => {
    triggerToasterMount();
    return import('vue-sonner').then((m) =>
      options ? m.toast.info(message, options) : m.toast.info(message)
    );
  }
};
