import { ref, watch } from 'vue';

export type AppView = 'list' | 'study' | 'dashboard';

const parseHashView = (): AppView => {
  if (typeof window === 'undefined') return 'list';
  const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (raw === 'study') return 'study';
  if (raw === 'dashboard') return 'dashboard';
  return 'list';
};

export const activeView = ref<AppView>(parseHashView());

export function useNavigation() {
  const syncHashFromView = (view: AppView) => {
    if (typeof window === 'undefined') return;
    const targetHash = view === 'list' ? '' : `#${view}`;
    if (window.location.hash !== targetHash) {
      if (view === 'list') {
        // Clear hash without polluting history unnecessarily
        const urlWithoutHash = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', urlWithoutHash);
      } else {
        window.location.hash = targetHash;
      }
    }
  };

  const handleHashChange = () => {
    activeView.value = parseHashView();
  };

  const initNavigation = () => {
    if (typeof window === 'undefined') return;
    activeView.value = parseHashView();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
  };

  const cleanupNavigation = () => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('hashchange', handleHashChange);
    window.removeEventListener('popstate', handleHashChange);
  };

  watch(activeView, (newView) => {
    syncHashFromView(newView);
  });

  return {
    activeView,
    initNavigation,
    cleanupNavigation,
    setView: (view: AppView) => {
      activeView.value = view;
    }
  };
}
