export interface Word {
  level: string;
  thema: number;
  german: string;
  german_audio: string;
  english: string;
  ukrainian: string;
  example?: string;
  id?: string; // We'll generate or use a composite key if missing
}

export interface SRSState {
  level: number;
  lastReview: number;
}

export type StudyDirection = 'DE_TO_UA' | 'UA_TO_DE';

export interface AppState {
  vocabulary: Word[];
  filteredVocabulary: Word[];
  isStudyMode: boolean;
  currentStudyIndex: number;
  isFlipped: boolean;
  studyDirection: StudyDirection;
  isAutoplay: boolean;
  masteredIds: Set<string>;
  srsData: Record<string, SRSState>;
}
