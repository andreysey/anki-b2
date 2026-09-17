import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCloudKey,
  setCloudKey,
  checkOnDeviceSupport,
  callAI,
  getAvailableGeminiModels
} from './ai';

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
          create: async () => ({
            prompt: async () => '',
            destroy: () => {}
          })
        }
      };
      const isSupported = await checkOnDeviceSupport();
      expect(isSupported).toBe(true);
    });
  });

  describe('getAvailableGeminiModels', () => {
    it('fetches and filters models supporting generateContent from API', async () => {
      const mockList = {
        models: [
          { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
          { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }
        ]
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockList
      } as Response);

      const models = await getAvailableGeminiModels('dynamic-test-key');
      expect(models).toContain('gemini-2.5-flash');
      expect(models).toContain('gemini-2.0-flash');
      expect(models).not.toContain('text-embedding-004');
    });
  });

  describe('callAI', () => {
    it('returns error response when no key and no on-device AI is available', async () => {
      const res = await callAI('Explain dictionary entry');
      expect(res.success).toBe(false);
      expect(res.source).toBe('none');
      expect(res.text).toContain('API key');
    });

    it('calls cloud API successfully when key is set', async () => {
      setCloudKey('test-key');

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'German grammar explanation' }]
            }
          }
        ]
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const res = await callAI('Explain word', 'System rule');
      expect(res.success).toBe(true);
      expect(res.source).toBe('cloud');
      expect(res.text).toBe('German grammar explanation');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/[^:]+:generateContent$/),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-goog-api-key': 'test-key'
          })
        })
      );
    });

    it('handles HTTP 429 quota exhaustion with friendly English message', async () => {
      setCloudKey('test-key-quota');

      const error429Response = {
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Quota exceeded for quota metric', status: 'RESOURCE_EXHAUSTED' } })
      };

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)
        .mockResolvedValueOnce(error429Response as Response);

      const res = await callAI('Explain word');
      expect(res.success).toBe(false);
      expect(res.source).toBe('none');
      expect(res.text).toBe(
        'Gemini API request quota exceeded. Please wait a minute before retrying, or switch to the local WebGPU model in AI settings.'
      );
    });

    it('falls back to secondary model if first model fails', async () => {
      setCloudKey('test-key-fallback');

      const error404Response = {
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'models/gemini-2.5-flash is not found' } })
      };

      const successResponse = {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Fallback response' }] } }]
        })
      };

      // Mock dynamic models list call failure/success followed by generateContent calls
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)
        .mockResolvedValueOnce(error404Response as Response)
        .mockResolvedValueOnce(successResponse as Response);

      const res = await callAI('Explain word');
      expect(res.success).toBe(true);
      expect(res.source).toBe('cloud');
      expect(res.text).toBe('Fallback response');
    });

    it('uses Chrome on-device AI when window.ai is available', async () => {
      const promptMock = vi.fn().mockResolvedValue('On-device AI response');
      const destroyMock = vi.fn();

      window.ai = {
        languageModel: {
          capabilities: async () => ({ available: 'readily' }),
          create: async () => ({
            prompt: promptMock,
            destroy: destroyMock
          })
        }
      };

      const res = await callAI('Translate this');
      expect(res.success).toBe(true);
      expect(res.source).toBe('nano');
      expect(res.text).toBe('On-device AI response');
      expect(promptMock).toHaveBeenCalledWith('Translate this');
      expect(destroyMock).toHaveBeenCalled();
    });

    it('streams on-device AI response when promptStreaming is available', async () => {
      const destroyMock = vi.fn();
      async function* mockStream() {
        yield 'Hello ';
        yield 'World';
      }

      window.ai = {
        languageModel: {
          availability: async () => 'readily',
          create: async () => ({
            prompt: vi.fn(),
            promptStreaming: () => mockStream(),
            destroy: destroyMock
          })
        }
      };

      const progressMock = vi.fn();
      const res = await callAI('Stream this', undefined, progressMock);
      expect(res.success).toBe(true);
      expect(res.source).toBe('nano');
      expect(res.text).toBe('Hello World');
      expect(progressMock).toHaveBeenCalledWith('Hello ', 'Hello ');
      expect(progressMock).toHaveBeenCalledWith('World', 'Hello World');
      expect(destroyMock).toHaveBeenCalled();
    });

    it('rejects callAI if API key contains invalid characters', async () => {
      setCloudKey('invalid key with spaces');
      const res = await callAI('Hello');
      expect(res.success).toBe(false);
      expect(res.text).toContain('Invalid Gemini API key format');
    });

    it('aborts callAI request when AbortSignal is cancelled', async () => {
      setCloudKey('test-valid-key');
      const controller = new AbortController();
      controller.abort();

      const res = await callAI('Hello', undefined, undefined, controller.signal);
      expect(res.success).toBe(false);
      expect(res.text).toBe('Request cancelled');
    });
  });
});
