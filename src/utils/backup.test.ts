import { describe, it, expect, vi } from 'vitest';
import {
  createBackupPayload,
  exportBackupJson,
  parseAndValidateBackup,
  downloadBackupFile,
} from './backup';
import type { SRSState } from '../types';

describe('backup utility', () => {
  it('creates structured backup payload and JSON', () => {
    const masteredIds = new Set<string>(['w1', 'w2']);
    const srsData: Record<string, SRSState> = {
      w1: { level: 2, lastReview: 1000 },
      w2: { level: 5, lastReview: 2000 },
    };

    const payload = createBackupPayload(masteredIds, srsData);
    expect(payload.version).toBe(1);
    expect(payload.masteredIds).toEqual(['w1', 'w2']);
    expect(payload.srsData).toEqual(srsData);

    const jsonStr = exportBackupJson(masteredIds, srsData);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.masteredIds).toEqual(['w1', 'w2']);
    expect(parsed.srsData.w1.level).toBe(2);
  });

  it('validates and parses valid backup payload', () => {
    const validJson = JSON.stringify({
      version: 1,
      timestamp: Date.now(),
      masteredIds: ['w1', 'w2'],
      srsData: {
        w1: { level: 3, lastReview: 12345 },
      },
    });

    const result = parseAndValidateBackup(validJson);
    expect(result.success).toBe(true);
    expect(result.data?.masteredIds).toEqual(['w1', 'w2']);
    expect(result.data?.srsData.w1.level).toBe(3);
  });

  it('clamps invalid SRS levels to 0..5 range', () => {
    const json = JSON.stringify({
      version: 1,
      timestamp: Date.now(),
      masteredIds: ['w1'],
      srsData: {
        w1: { level: 99, lastReview: 12345 },
        w2: { level: -5, lastReview: 12345 },
      },
    });

    const result = parseAndValidateBackup(json);
    expect(result.success).toBe(true);
    expect(result.data?.srsData.w1.level).toBe(5);
    expect(result.data?.srsData.w2.level).toBe(0);
  });

  it('rejects invalid JSON or malformed structures', () => {
    expect(parseAndValidateBackup('invalid json').success).toBe(false);
    expect(parseAndValidateBackup('null').success).toBe(false);
    expect(parseAndValidateBackup(JSON.stringify({ masteredIds: 'not an array', srsData: {} })).success).toBe(false);
    expect(parseAndValidateBackup(JSON.stringify({ masteredIds: [], srsData: [] })).success).toBe(false);
  });

  it('triggers browser download link in downloadBackupFile', () => {
    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_val: string) {},
      set download(_val: string) {},
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    downloadBackupFile(new Set<string>(['w1']), {});
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
  });
});
