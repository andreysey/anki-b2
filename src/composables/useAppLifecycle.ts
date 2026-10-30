// Small app-wide behaviours that each need setup on mount and cleanup on unmount.
// Call these from App's setup.
import { watch, onMounted, onUnmounted, type Ref } from 'vue';
import { useVocabulary, tickDueClock } from './useVocabulary';
import { updateAppBadge } from '../utils/badge';
import { shouldShowBackupReminder, markBackupReminderShown } from '../utils/dataSafety';
import { downloadBackupFile } from '../utils/backup';
import { notify } from '../utils/notify';

const DUE_CLOCK_INTERVAL_MS = 60_000;
const BACKUP_REMINDER_DELAY_MS = 4000;
const BACKUP_TOAST_DURATION_MS = 15_000;

/** Keeps the due-card count current while the app stays open and mirrors it on the PWA badge. */
export function useDueBadge() {
  const { dueCardsCount } = useVocabulary();
  let timer: number | undefined;
  const onVisible = () => {
    if (document.visibilityState === 'visible') tickDueClock();
  };

  watch(dueCardsCount, updateAppBadge, { immediate: true });
  onMounted(() => {
    timer = window.setInterval(tickDueClock, DUE_CLOCK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
  });
  onUnmounted(() => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  });
}

/** Progress lives only in this browser; nudges the user to back it up (at most once a week). */
export function useBackupReminder() {
  const { masteredIds, srsData } = useVocabulary();
  let timer: number | undefined;

  const remind = () => {
    const hasProgress = masteredIds.value.size > 0 || Object.keys(srsData.value).length > 0;
    if (!shouldShowBackupReminder(hasProgress)) return;
    markBackupReminderShown();
    notify.info('Back up your progress', {
      description:
        'Your progress is saved only in this browser and could be lost if browser data is cleared.',
      duration: BACKUP_TOAST_DURATION_MS,
      action: {
        label: 'Back up now',
        onClick: () => {
          downloadBackupFile(masteredIds.value, srsData.value);
          notify.success('Backup saved');
        }
      }
    });
  };

  onMounted(() => {
    timer = window.setTimeout(remind, BACKUP_REMINDER_DELAY_MS);
  });
  onUnmounted(() => window.clearTimeout(timer));
}

/** Ctrl+K / ⌘K toggles the search palette. */
export function useCommandPaletteShortcut(isOpen: Ref<boolean>) {
  const onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen.value = !isOpen.value;
    }
  };
  onMounted(() => window.addEventListener('keydown', onKeydown));
  onUnmounted(() => window.removeEventListener('keydown', onKeydown));
}

/** Page Lifecycle API: save SRS progress immediately when the browser freezes the page. */
export function usePersistOnFreeze() {
  const { saveSRS } = useVocabulary();
  const onFreeze = () => saveSRS(true);
  onMounted(() => document.addEventListener('freeze', onFreeze));
  onUnmounted(() => document.removeEventListener('freeze', onFreeze));
}
