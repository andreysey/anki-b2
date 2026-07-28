import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCloudKey, setCloudKey, checkOnDeviceSupport, callAI } from './ai';

describe('ai utils', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.ai;
    vi.restoreAllMocks();
  });

  describe('Cloud key storage', () => {
    it('returns empty string when no key is set', () => {
      expect(getCloudKey()).toBe('');
    });

    it('sets and retrieves cloud key from localStorage', () => {
      setCloudKey('test-api-key');
      expect(getCloudKey()).toBe('test-api-key');
    });
  });

  describe('checkOnDeviceSupport', () => {
    it('returns false when window.ai is missing', async () => {
      const isSupported = await checkOnDeviceSupport();
      expect(isSupported).toBe(false);
    });

    it('returns true when window.ai.languageModel reports available', async () => {
      window.ai = {
        languageModel: {
          capabilities: async () => ({ available: 'readily' }),
          create: async () => ({}),
        },
      };
      const isSupported = await checkOnDeviceSupport();
      expect(isSupported).toBe(true);
    });
  });

  describe('callAI', () => {
    it('returns error response when no key and no on-device AI is available', async () => {
      const res = await callAI('Explain dictionary entry');
      expect(res.success).toBe(false);
      expect(res.source).toBe('none');
      expect(res.text).toContain('No API key');
    });

    it('calls cloud API successfully when key is set', async () => {
      setCloudKey('test-key');

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'German grammar explanation' }],
            },
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const res = await callAI('Explain word', 'System rule');
      expect(res.success).toBe(true);
      expect(res.source).toBe('cloud');
      expect(res.text).toBe('German grammar explanation');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-1.5-flash:generateContent?key=test-key'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('uses Chrome on-device AI when window.ai is available', async () => {
      const promptMock = vi.fn().mockResolvedValue('On-device AI response');
      const destroyMock = vi.fn();

      window.ai = {
        languageModel: {
          capabilities: async () => ({ available: 'readily' }),
          create: async () => ({
            prompt: promptMock,
            destroy: destroyMock,
          }),
        },
      };

      const res = await callAI('Translate this');
      expect(res.success).toBe(true);
      expect(res.source).toBe('nano');
      expect(res.text).toBe('On-device AI response');
      expect(promptMock).toHaveBeenCalledWith('Translate this');
      expect(destroyMock).toHaveBeenCalled();
    });
  });
});
