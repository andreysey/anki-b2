// Facade over the vocabulary feature. State lives in focused modules:
//   useVocabularyData — loading data.json          useFilters      — search & filters
//   useProgress       — mastered/SRS/streak/saving useStudySession — study mode
// Pure logic: utils/srs.ts (scheduling) and utils/words.ts (keys & search).
// Prefer the focused composables in new code; this keeps existing callers working.
import { useVocabularyData } from './useVocabularyData';
import { useFilters } from './useFilters';
import { useProgress } from './useProgress';
import { useStudySession } from './useStudySession';

export { SRS_INTERVALS_MS, getCardDueDate, compareStudyCards } from '../utils/srs';
export {
  getItemKey,
  normalizeGermanText,
  normalizeToSimpleAscii,
  buildSearchIndex,
  matchesSearchFilter
} from '../utils/words';
export { tickDueClock, saveSRS, flushPendingSRS, type StudyStreakData } from './useProgress';

export function useVocabulary() {
  const { loadVocabulary, ...data } = useVocabularyData();
  return {
    ...data,
    ...useFilters(),
    ...useProgress(),
    ...useStudySession(),
    init: loadVocabulary
  };
}
