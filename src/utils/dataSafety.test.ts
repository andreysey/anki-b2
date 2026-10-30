import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  requestPersistentStorage,
  isStoragePersisted,
  markBackupDone,
  getLastBackup,
  isBackupDue,
  shouldShowBackupReminder,
  markBackupReminderShown,
  formatBackupAge
} from './dataSafety';
import { downloadBackupFile } from './backup';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 29, 12);

const mockStorage = (persisted: boolean, persistResult = true) => {
  const storage = {
    persisted: vi.fn().mockResolvedValue(persisted),
    persist: vi.fn().mockResolvedValue(persistResult)
  };
  Object.defineProperty(navigator, 'storage', { value: storage, configurable: true });
  return storage;
};

describe('dataSafety', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    delete (navigator as any).storage;
  });

  describe('requestPersistentStorage', () => {
    it('asks the browser once and remembers that it asked', async () => {
      const storage = mockStorage(false, false);
      expect(await requestPersistentStorage()).toBe(false);
      expect(await requestPersistentStorage()).toBe(false);
      expect(storage.persist).toHaveBeenCalledTimes(1);
    });

    it('does not ask when storage is already persistent', async () => {
      const storage = mockStorage(true);
      expect(await requestPersistentStorage()).toBe(true);
      expect(storage.persist).not.toHaveBeenCalled();
    });

    it('returns false when the Storage API is missing', async () => {
      expect(await requestPersistentStorage()).toBe(false);
      expect(await isStoragePersisted()).toBeNull();
    });
  });

  describe('backup timing', () => {
    it('is not due without progress', () => {
      expect(isBackupDue(false, null, NOW)).toBe(false);
    });

    it('is due with progress and no backup, or a backup older than 7 days', () => {
      expect(isBackupDue(true, null, NOW)).toBe(true);
      expect(isBackupDue(true, NOW - 8 * DAY, NOW)).toBe(true);
      expect(isBackupDue(true, NOW - 2 * DAY, NOW)).toBe(false);
    });

    it('stores the backup time', () => {
      markBackupDone(NOW);
      expect(getLastBackup()).toBe(NOW);
    });

    it('marks a backup when the file is downloaded', () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      downloadBackupFile(new Set(['w1']), {});
      expect(getLastBackup()).not.toBeNull();
    });

    it('reminds at most once per 7 days', () => {
      expect(shouldShowBackupReminder(true, NOW)).toBe(true);
      markBackupReminderShown(NOW);
      expect(shouldShowBackupReminder(true, NOW + 3 * DAY)).toBe(false);
      expect(shouldShowBackupReminder(true, NOW + 7 * DAY)).toBe(true);
    });

    it('does not remind after a recent backup', () => {
      markBackupDone(NOW - DAY);
      expect(shouldShowBackupReminder(true, NOW)).toBe(false);
    });
  });

  it('formats the backup age', () => {
    expect(formatBackupAge(null, NOW)).toBe('never');
    expect(formatBackupAge(NOW - 60_000, NOW)).toBe('today');
    expect(formatBackupAge(NOW - DAY, NOW)).toBe('yesterday');
    expect(formatBackupAge(NOW - 5 * DAY, NOW)).toBe('5 days ago');
  });
});
