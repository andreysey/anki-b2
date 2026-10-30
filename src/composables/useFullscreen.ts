// Fullscreen ("Zen mode") state that follows the browser, including Esc / F11 exits.
import { ref, onMounted, onUnmounted } from 'vue';

export function useFullscreen() {
  const isFullscreen = ref(false);

  const sync = () => {
    isFullscreen.value = Boolean(document.fullscreenElement);
  };

  const toggleFullscreen = async () => {
    if (typeof document === 'undefined') return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Rejected (no user gesture or not allowed) — nothing to do
    }
  };

  onMounted(() => document.addEventListener('fullscreenchange', sync));
  onUnmounted(() => document.removeEventListener('fullscreenchange', sync));

  return { isFullscreen, toggleFullscreen };
}
