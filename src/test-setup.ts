import { beforeEach } from 'vitest';
import { resetVocabularyState } from './test-utils/fixtures';
import { markToasterReady } from './utils/notify';

// No <Toaster> is mounted in unit tests: don't make notifications wait for it
markToasterReady();

beforeEach(async () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  await resetVocabularyState();
});
