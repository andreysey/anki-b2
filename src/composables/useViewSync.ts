// Keeps the current view (URL hash) and study mode in sync, and handles what changes with the
// view: audio stops and the screen may sleep outside study mode; content scrolls to the top.
import { watch, nextTick, type Ref } from 'vue';
import { useNavigation } from './useNavigation';
import { useVocabulary } from './useVocabulary';

export function useViewSync(options: {
  mainContent: Ref<HTMLElement | null>;
  stopAudio: () => void;
  requestWakeLock: () => void;
  releaseWakeLock: () => void;
}) {
  const { activeView } = useNavigation();
  const { isStudyMode } = useVocabulary();

  watch(activeView, async (view) => {
    const studying = view === 'study';
    if (studying) {
      options.requestWakeLock();
    } else {
      options.stopAudio();
      options.releaseWakeLock();
    }
    isStudyMode.value = studying;
    await nextTick();
    if (options.mainContent.value) options.mainContent.value.scrollTop = 0;
  });

  watch(isStudyMode, (studying) => {
    if (studying && activeView.value !== 'study') activeView.value = 'study';
    else if (!studying && activeView.value === 'study') activeView.value = 'list';
  });
}
