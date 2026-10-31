export interface Word {
  level: string;
  thema: number;
  german: string;
  german_audio: string;
  english: string;
  ukrainian: string;
  example?: string;
  id?: string;
  _searchIndex?: string; // Normalized search text, built on the first search (words.ts)
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
