import { ref, watch } from 'vue';
import { cleanTextForSpeech } from '../utils/sanitize';
import { safeStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';

const activeUtterances = new Set<SpeechSynthesisUtterance>();

export function useSpeechSynthesis() {
  const germanVoices = ref<SpeechSynthesisVoice[]>([]);
  const selectedVoiceURI = ref(safeStorage.getString(STORAGE_KEYS.TTS_VOICE, ''));

  const rawRate = Number(safeStorage.getString(STORAGE_KEYS.TTS_RATE, '0.85'));
  const initialRate = Number.isFinite(rawRate) ? Math.min(2.0, Math.max(0.5, rawRate)) : 0.85;
  const ttsRate = ref(initialRate);

  const loadVoices = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      germanVoices.value = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang.toLowerCase().startsWith('de'));
      if (!selectedVoiceURI.value && germanVoices.value.length) {
        // Prefer standard de-DE voices
        const preferred =
          germanVoices.value.find((v) => v.lang === 'de-DE') || germanVoices.value[0];
        selectedVoiceURI.value = preferred.voiceURI;
      }
    }
  };

  const warmupSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        // Silent utterance of empty space to wake up the speech pipeline on iOS/Android
        const silent = new SpeechSynthesisUtterance(' ');
        silent.volume = 0;
        silent.rate = 2;
        window.speechSynthesis.speak(silent);
      } catch {
        // Ignore errors
      }
    }
  };

  const initVoices = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  };

  const updateMediaSession = (title: string, artist = 'German B2 Professional') => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album: 'Anki B2 German Vocabulary',
          artwork: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch {
        // Ignore mediaSession metadata errors in unsupported contexts
      }
    }
  };

  const clearMediaSession = () => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {
        // Ignore errors
      }
    }
  };

  const stopAudio = () => {
    activeUtterances.clear();
    clearMediaSession();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  watch(selectedVoiceURI, (val) => {
    safeStorage.setItem(STORAGE_KEYS.TTS_VOICE, val);
  });

  watch(ttsRate, (val) => {
    const clamped = Math.min(2.0, Math.max(0.5, val));
    safeStorage.setItem(STORAGE_KEYS.TTS_RATE, String(clamped));
  });

  const playAudio = (text: string, lang = 'de-DE') => {
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
    utterance.lang = lang;
    utterance.rate = ttsRate.value;
    const allVoices = window.speechSynthesis.getVoices();
    if (lang.startsWith('de')) {
      const voice = germanVoices.value.find((v) => v.voiceURI === selectedVoiceURI.value);
      if (voice) {
        utterance.voice = voice;
      }
    } else if (lang.startsWith('en')) {
      const englishVoice =
        allVoices.find((v) => v.lang === 'en-US') ||
        allVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }
    activeUtterances.add(utterance);
    updateMediaSession(cleaned, lang.startsWith('de') ? 'German Pronunciation' : 'English Translation');
    utterance.onend = utterance.onerror = () => {
      activeUtterances.delete(utterance);
      if (activeUtterances.size === 0) {
        clearMediaSession();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const playSequence = (items: Array<{ text: string; lang?: string }>) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }

    // Stop currently playing speech
    stopAudio();

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const validItems = items
      .map((item) => ({
        text: cleanTextForSpeech(item.text),
        lang: item.lang || 'de-DE'
      }))
      .filter((item) => Boolean(item.text));

    if (validItems.length === 0) return;

    const allVoices = window.speechSynthesis.getVoices();
    const germanVoice = germanVoices.value.find((v) => v.voiceURI === selectedVoiceURI.value);
    const englishVoice =
      allVoices.find((v) => v.lang === 'en-US') ||
      allVoices.find((v) => v.lang.toLowerCase().startsWith('en'));

    validItems.forEach((item) => {
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = item.lang;
      utterance.rate = ttsRate.value;

      if (item.lang.startsWith('de') && germanVoice) {
        utterance.voice = germanVoice;
      } else if (item.lang.startsWith('en') && englishVoice) {
        utterance.voice = englishVoice;
      }

      activeUtterances.add(utterance);
      utterance.onend = utterance.onerror = () => {
        activeUtterances.delete(utterance);
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  return {
    germanVoices,
    selectedVoiceURI,
    ttsRate,
    loadVoices,
    initVoices,
    warmupSpeech,
    playAudio,
    playSequence,
    stopAudio
  };
}
