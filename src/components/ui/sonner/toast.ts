// Lazy wrapper so vue-sonner is not bundled into the critical path / initial bundle
const triggerToasterMount = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('load-toaster'));
  }
};

export const toast = {
  success: (message: string) => {
    triggerToasterMount();
    return import('vue-sonner').then(m => m.toast.success(message));
  },
  error: (message: string) => {
    triggerToasterMount();
    return import('vue-sonner').then(m => m.toast.error(message));
  },
  warning: (message: string) => {
    triggerToasterMount();
    return import('vue-sonner').then(m => m.toast.warning(message));
  },
  info: (message: string) => {
    triggerToasterMount();
    return import('vue-sonner').then(m => m.toast.info(message));
  }
};
