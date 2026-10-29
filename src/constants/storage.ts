export const STORAGE_KEYS = {
  MASTERED_WORDS: 'anki_mastered_words',
  SRS_DATA: 'anki_srs_v2',
  THEME_MODE: 'anki_theme_mode',
  THEME_STYLE: 'anki_theme_style',
  TTS_VOICE: 'anki_tts_voice',
  TTS_RATE: 'anki_tts_rate',
  GEMINI_API_KEY: 'anki_gemini_api_key',
  STUDY_STREAK: 'anki_study_streak_v1',
  WEBLLM_MODEL: 'anki_webllm_model',
  AUTOPLAY: 'anki_autoplay',
  LAST_BACKUP: 'anki_last_backup',
  LAST_BACKUP_REMINDER: 'anki_last_backup_reminder',
  PERSIST_REQUESTED: 'anki_persist_requested'
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
