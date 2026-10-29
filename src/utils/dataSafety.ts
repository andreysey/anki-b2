// Keeps learning progress from silently disappearing.
// Progress lives only in this browser's localStorage, which browsers may clear
// (Safari after 7 days without a visit, others under disk pressure).
import { safeStorage } from './storage';
import { STORAGE_KEYS } from '../constants/storage';

const DAY_MS = 24 * 60 * 60 * 1000;
export const BACKUP_REMINDER_DAYS = 7;

/**
 * Asks the browser to keep this site's storage ("persistent storage").
 * Chrome decides silently; Firefox may show a one-time prompt, so we only ask once,
 * after the user has actually started learning.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persist || !storage.persisted) return false;
  try {
    if (await storage.persisted()) return true;
    if (safeStorage.getString(STORAGE_KEYS.PERSIST_REQUESTED, '')) return false;
    safeStorage.setItem(STORAGE_KEYS.PERSIST_REQUESTED, '1');
    return await storage.persist();
  } catch {
    return false;
  }
}

export async function isStoragePersisted(): Promise<boolean | null> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persisted) return null;
  try {
    return await storage.persisted();
  } catch {
    return null;
  }
}

export function markBackupDone(now: number = Date.now()): void {
  safeStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now);
}

export function getLastBackup(): number | null {
  const value = safeStorage.getItem<number | null>(STORAGE_KEYS.LAST_BACKUP, null);
  return typeof value === 'number' && value > 0 ? value : null;
}

/** A backup is due when there is progress and none was made in the last 7 days. */
export function isBackupDue(
  hasProgress: boolean,
  lastBackup: number | null,
  now: number = Date.now()
): boolean {
  if (!hasProgress) return false;
  return lastBackup === null || now - lastBackup >= BACKUP_REMINDER_DAYS * DAY_MS;
}

/** Show the reminder toast at most once per 7 days. */
export function shouldShowBackupReminder(hasProgress: boolean, now: number = Date.now()): boolean {
  if (!isBackupDue(hasProgress, getLastBackup(), now)) return false;
  const lastReminder = safeStorage.getItem<number>(STORAGE_KEYS.LAST_BACKUP_REMINDER, 0);
  return now - lastReminder >= BACKUP_REMINDER_DAYS * DAY_MS;
}

export function markBackupReminderShown(now: number = Date.now()): void {
  safeStorage.setItem(STORAGE_KEYS.LAST_BACKUP_REMINDER, now);
}

/** "today", "yesterday", "5 days ago", or "never". */
export function formatBackupAge(lastBackup: number | null, now: number = Date.now()): string {
  if (lastBackup === null) return 'never';
  const days = Math.floor((now - lastBackup) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
