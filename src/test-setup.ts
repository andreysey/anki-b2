import { beforeEach } from 'vitest';
import { resetVocabularyState } from './test-utils/fixtures';

beforeEach(async () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  await resetVocabularyState();
});
