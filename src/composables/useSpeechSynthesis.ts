import { ref, watch } from 'vue';
import { cleanTextForSpeech } from '../utils/sanitize';
import { safeStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';

export function useSpeechSynthesis() {
  const germanVoices = ref<SpeechSynthesisVoice[]>([]);
  const selectedVoiceURI = ref(safeStorage.getString(STORAGE_KEYS.TTS_VOICE, ''));
  const ttsRate = ref(Number(safeStorage.getString(STORAGE_KEYS.TTS_RATE, '0.85')) || 0.85);

  const loadVoices = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      germanVoices.value = window.speechSynthesis.getVoices().filter(v => 
        v.lang.toLowerCase().startsWith('de')
      );
      if (!selectedVoiceURI.value && germanVoices.value.length > 0) {
        // Prefer standard de-DE voices
        const preferred = germanVoices.value.find(v => v.lang === 'de-DE') || germanVoices.value[0];
        selectedVoiceURI.value = preferred.voiceURI;
      }
    }
  };

  const initVoices = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  };

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  watch(selectedVoiceURI, (val) => {
    safeStorage.setItem(STORAGE_KEYS.TTS_VOICE, val);
  });

  watch(ttsRate, (val) => {
    safeStorage.setItem(STORAGE_KEYS.TTS_RATE, String(val));
  });

  const playAudio = (text: string) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    // Guaranteed cancellation of any queued/interrupted utterances
    stopAudio();

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'de-DE';
    utterance.rate = ttsRate.value;
    const voice = germanVoices.value.find(v => v.voiceURI === selectedVoiceURI.value);
    if (voice) {
      utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  return {
    germanVoices,
    selectedVoiceURI,
    ttsRate,
    loadVoices,
    initVoices,
    playAudio,
    stopAudio
  };
}
