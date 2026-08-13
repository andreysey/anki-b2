export const STORAGE_KEYS = {
  MASTERED_WORDS: 'anki_mastered_words',
  SRS_DATA: 'anki_srs_v2',
  THEME_MODE: 'anki_theme_mode',
  TTS_VOICE: 'anki_tts_voice',
  TTS_RATE: 'anki_tts_rate',
  GEMINI_API_KEY: 'anki_gemini_api_key',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
