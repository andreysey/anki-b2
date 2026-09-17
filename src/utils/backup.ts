import type { SRSState } from '../types';

export interface BackupData {
  version: number;
  timestamp: number;
  masteredIds: string[];
  srsData: Record<string, SRSState>;
}

const BACKUP_VERSION = 1;

export function createBackupPayload(
  masteredIds: Set<string>,
  srsData: Record<string, SRSState>
): BackupData {
  return {
    version: BACKUP_VERSION,
    timestamp: Date.now(),
    masteredIds: Array.from(masteredIds),
    srsData: { ...srsData }
  };
}

export function exportBackupJson(
  masteredIds: Set<string>,
  srsData: Record<string, SRSState>
): string {
  const payload = createBackupPayload(masteredIds, srsData);
  return JSON.stringify(payload, null, 2);
}

export const MAX_BACKUP_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_BACKUP_ENTRIES = 25000;

export function parseAndValidateBackup(rawJson: string): {
  success: boolean;
  data?: BackupData;
  error?: string;
} {
  if (typeof rawJson !== 'string' || rawJson.length > MAX_BACKUP_SIZE_BYTES) {
    return { success: false, error: 'Backup file exceeds maximum allowed size of 5 MB' };
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON structure: expected an object' };
    }

    if (!Array.isArray(parsed.masteredIds)) {
      return { success: false, error: 'Invalid backup format: masteredIds must be an array' };
    }

    if (parsed.masteredIds.length > MAX_BACKUP_ENTRIES) {
      return {
        success: false,
        error: `Invalid backup: masteredIds exceeds maximum of ${MAX_BACKUP_ENTRIES} entries`
      };
    }

    if (!parsed.srsData || typeof parsed.srsData !== 'object' || Array.isArray(parsed.srsData)) {
      return { success: false, error: 'Invalid backup format: srsData must be an object' };
    }

    const srsKeys = Object.keys(parsed.srsData);
    if (srsKeys.length > MAX_BACKUP_ENTRIES) {
      return {
        success: false,
        error: `Invalid backup: srsData exceeds maximum of ${MAX_BACKUP_ENTRIES} entries`
      };
    }

    // Sanitize masteredIds to strings
    const validMasteredIds = parsed.masteredIds
      .filter((id: unknown) => typeof id === 'string')
      .map((id: string) => id.trim())
      .filter(Boolean);

    // Validate SRS records with prototype pollution protection and finite number validation
    const validSRS: Record<string, SRSState> = {};
    for (const [key, val] of Object.entries(parsed.srsData)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      if (
        val &&
        typeof val === 'object' &&
        Number.isFinite((val as SRSState).level) &&
        Number.isFinite((val as SRSState).lastReview)
      ) {
        const srs = val as SRSState;
        validSRS[key] = {
          level: Math.min(5, Math.max(0, Math.floor(srs.level))),
          lastReview: Math.max(0, Math.floor(srs.lastReview))
        };
      }
    }

    return {
      success: true,
      data: {
        version: typeof parsed.version === 'number' ? parsed.version : 1,
        timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
        masteredIds: validMasteredIds,
        srsData: validSRS
      }
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `JSON parse error: ${message}` };
  }
}

export function downloadBackupFile(
  masteredIds: Set<string>,
  srsData: Record<string, SRSState>,
  filename = `anki-b2-backup-${new Date().toISOString().slice(0, 10)}.json`
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const jsonStr = exportBackupJson(masteredIds, srsData);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
