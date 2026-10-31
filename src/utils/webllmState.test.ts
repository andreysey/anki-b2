import { describe, it, expect, afterEach, vi } from 'vitest';
import { hasLocalModelFiles } from './webllmState';

const MODEL = 'gemma3-1b-it-q4f16_1-MLC';

function stubCaches(urls: string[] | null) {
  vi.stubGlobal('caches', {
    has: vi.fn(async () => urls !== null),
    open: vi.fn(async () => ({ keys: async () => (urls ?? []).map((url) => ({ url })) }))
  });
}

describe('hasLocalModelFiles', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('finds a downloaded model in WebLLM cache storage', async () => {
    stubCaches([`https://huggingface.co/mlc-ai/${MODEL}/resolve/main/params_shard_0.bin`]);
    expect(await hasLocalModelFiles(MODEL)).toBe(true);
  });

  it('is false for another model, an empty cache or no cache at all', async () => {
    stubCaches(['https://huggingface.co/mlc-ai/Qwen3.5-0.8B-q4f32_1-MLC/resolve/main/x.bin']);
    expect(await hasLocalModelFiles(MODEL)).toBe(false);
    stubCaches([]);
    expect(await hasLocalModelFiles(MODEL)).toBe(false);
    stubCaches(null);
    expect(await hasLocalModelFiles(MODEL)).toBe(false);
  });

  it('is false when cache storage is unavailable or throws', async () => {
    vi.stubGlobal('caches', undefined);
    expect(await hasLocalModelFiles(MODEL)).toBe(false);
    vi.stubGlobal('caches', { has: () => Promise.reject(new Error('denied')) });
    expect(await hasLocalModelFiles(MODEL)).toBe(false);
  });
});
