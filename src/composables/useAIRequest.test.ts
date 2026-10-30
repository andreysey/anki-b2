import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useAIRequest } from './useAIRequest';
import * as ai from '../utils/ai';

const PROMPT = { systemInstruction: 'sys', prompt: 'p' };

// useAIRequest registers onUnmounted, so run it inside a component
const setup = () => {
  let api!: ReturnType<typeof useAIRequest>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useAIRequest();
        return () => h('div');
      }
    })
  );
  return { api, wrapper };
};

describe('useAIRequest', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('stores the result of a finished request', async () => {
    vi.spyOn(ai, 'callAI').mockResolvedValue({
      success: true,
      text: 'Antwort',
      source: 'cloud',
      model: 'gemini-flash-lite-latest'
    });
    const { api } = setup();
    await api.run('grammar', PROMPT);
    expect(api.resultText.value).toBe('Antwort');
    expect(api.isLoading.value).toBe(false);
    expect(api.displayModelLabel.value).toBe('gemini-flash-lite-latest');
    expect(api.displaySourceLabel.value).toBe('Cloud API');
  });

  it('ignores the answer of a request superseded by a newer one', async () => {
    let resolveFirst!: (v: ai.AIServiceResponse) => void;
    const signals: AbortSignal[] = [];
    vi.spyOn(ai, 'callAI')
      .mockImplementationOnce((_p, _s, _cb, signal) => {
        signals.push(signal!);
        return new Promise((r) => (resolveFirst = r));
      })
      .mockImplementationOnce(async (_p, _s, _cb, signal) => {
        signals.push(signal!);
        return { success: true, text: 'second', source: 'webllm' };
      });

    const { api } = setup();
    const first = api.run('grammar', PROMPT);
    await api.run('dialogue', PROMPT);
    resolveFirst({ success: true, text: 'first', source: 'cloud' });
    await first;

    expect(signals[0].aborted).toBe(true);
    expect(api.resultText.value).toBe('second');
    expect(api.displaySourceLabel.value).toBe('WebGPU Local AI');
  });

  it('reset clears the answer and aborts the running request', () => {
    let signal!: AbortSignal;
    vi.spyOn(ai, 'callAI').mockImplementation((_p, _s, _cb, s) => {
      signal = s!;
      return new Promise(() => {});
    });
    const { api } = setup();
    void api.run('grammar', PROMPT);
    api.reset();
    expect(signal.aborted).toBe(true);
    expect(api.isLoading.value).toBe(false);
    expect(api.resultText.value).toBe('');
  });

  it('aborts the running request on unmount', () => {
    let signal!: AbortSignal;
    vi.spyOn(ai, 'callAI').mockImplementation((_p, _s, _cb, s) => {
      signal = s!;
      return new Promise(() => {});
    });
    const { api, wrapper } = setup();
    void api.run('grammar', PROMPT);
    wrapper.unmount();
    expect(signal.aborted).toBe(true);
  });
});
