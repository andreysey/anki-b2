export interface Word {
  level: string;
  thema: number;
  german: string;
  german_audio: string;
  english: string;
  ukrainian: string;
  example?: string;
  id?: string;
  _searchIndex?: string; // Precomputed normalized search index for fast lookup
}

export interface SRSState {
  level: number;
  lastReview: number;
}

export type StudyDirection = 'DE_TO_UA' | 'UA_TO_DE';

export interface SelectOption<T> {
  label: string;
  value: T;
}
