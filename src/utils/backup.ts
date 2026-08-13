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
    srsData: { ...srsData },
  };
}

export function exportBackupJson(
  masteredIds: Set<string>,
  srsData: Record<string, SRSState>
): string {
  const payload = createBackupPayload(masteredIds, srsData);
  return JSON.stringify(payload, null, 2);
}

export function parseAndValidateBackup(rawJson: string): {
  success: boolean;
  data?: BackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON structure: expected an object' };
    }

    if (!Array.isArray(parsed.masteredIds)) {
      return { success: false, error: 'Invalid backup format: masteredIds must be an array' };
    }

    if (!parsed.srsData || typeof parsed.srsData !== 'object' || Array.isArray(parsed.srsData)) {
      return { success: false, error: 'Invalid backup format: srsData must be an object' };
    }

    // Sanitize masteredIds to strings
    const validMasteredIds = parsed.masteredIds
      .filter((id: unknown) => typeof id === 'string')
      .map((id: string) => id.trim())
      .filter(Boolean);

    // Validate SRS records
    const validSRS: Record<string, SRSState> = {};
    for (const [key, val] of Object.entries(parsed.srsData)) {
      if (val && typeof val === 'object' && typeof (val as SRSState).level === 'number') {
        const srs = val as SRSState;
        validSRS[key] = {
          level: Math.min(5, Math.max(0, Math.floor(srs.level))),
          lastReview: typeof srs.lastReview === 'number' ? srs.lastReview : 0,
        };
      }
    }

    return {
      success: true,
      data: {
        version: typeof parsed.version === 'number' ? parsed.version : 1,
        timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
        masteredIds: validMasteredIds,
        srsData: validSRS,
      },
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
