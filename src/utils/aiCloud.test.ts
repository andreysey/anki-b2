import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rankGeminiModels, askGemini, QUOTA_EXCEEDED_MESSAGE } from './aiCloud';

describe('rankGeminiModels', () => {
  it('orders flash-lite-latest first, then Flash Lite, Flash, Pro, newer versions first', () => {
    const models = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-2.5-flash-lite'
    ];
    expect([...models].sort(rankGeminiModels)).toEqual([
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro'
    ]);
  });
});

describe('askGemini', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('rejects malformed keys without any request', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    const res = await askGemini('bad key!', 'p', undefined);
    expect(res.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stops at the first quota error instead of trying other models', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      // model list request fails → default candidate list
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const res = await askGemini('quota-test-key', 'p', 'sys');
    expect(res).toEqual({ success: false, text: QUOTA_EXCEEDED_MESSAGE, source: 'none' });
    expect(fetchMock).toHaveBeenCalledTimes(2); // list + one generateContent
  });
});
