// Chrome built-in AI (Gemini Nano) via the Prompt API:
// https://developer.chrome.com/docs/ai/prompt-api
import { CANCELLED, type AIProgressCallback, type AIServiceResponse } from './aiTypes';

export type LanguageModelAvailability =
  'unavailable' | 'downloadable' | 'downloading' | 'available';

interface LanguageModelExpected {
  type: 'text';
  languages: string[];
}

export interface LanguageModelOptions {
  expectedInputs?: LanguageModelExpected[];
  expectedOutputs?: LanguageModelExpected[];
  initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
}

export interface LanguageModelSession {
  prompt: (input: string, options?: { signal?: AbortSignal }) => Promise<string>;
  promptStreaming?: (
    input: string,
    options?: { signal?: AbortSignal }
  ) => ReadableStream<string> | AsyncIterable<string>;
  destroy: () => void;
}

export interface LanguageModelStatic {
  availability: (options?: LanguageModelOptions) => Promise<LanguageModelAvailability>;
  create: (options?: LanguageModelOptions) => Promise<LanguageModelSession>;
}

/** Nano reads English/German prompts and answers in English (it has no Ukrainian). */
export const ON_DEVICE_LANGUAGES: Pick<LanguageModelOptions, 'expectedInputs' | 'expectedOutputs'> =
  {
    expectedInputs: [{ type: 'text', languages: ['en', 'de'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
  };

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful German Language Coach.';

export const getOnDeviceAIEngine = (): LanguageModelStatic | null =>
  (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel ?? null;

/**
 * True only when Gemini Nano is already downloaded and supports our languages.
 * 'downloadable' is treated as unavailable: creating a session would silently
 * start a multi-GB model download.
 */
export const checkOnDeviceSupport = async (): Promise<boolean> => {
  const engine = getOnDeviceAIEngine();
  if (!engine) return false;
  try {
    return (await engine.availability(ON_DEVICE_LANGUAGES)) === 'available';
  } catch {
    return false;
  }
};

/** Reads a streamed answer (async iterable or ReadableStream), reporting progress. */
async function readStream(
  stream: ReadableStream<string> | AsyncIterable<string>,
  onProgress?: AIProgressCallback
): Promise<string> {
  let text = '';
  const append = (chunk: string) => {
    text += chunk;
    onProgress?.(chunk, text);
  };
  if (Symbol.asyncIterator in Object(stream)) {
    for await (const chunk of stream as AsyncIterable<string>) append(chunk);
    return text;
  }
  const reader = (stream as ReadableStream<string>).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text;
    if (value) append(value);
  }
}

/**
 * Asks Gemini Nano. Returns null when Nano isn't available or fails, so the caller can
 * fall back to the next backend; a cancelled request returns CANCELLED.
 */
export async function askNano(
  prompt: string,
  systemInstruction: string | undefined,
  onProgress?: AIProgressCallback,
  signal?: AbortSignal
): Promise<AIServiceResponse | null> {
  const engine = getOnDeviceAIEngine();
  if (!engine || !(await checkOnDeviceSupport())) return null;

  let session: LanguageModelSession | null = null;
  try {
    session = await engine.create({
      ...ON_DEVICE_LANGUAGES,
      initialPrompts: [{ role: 'system', content: systemInstruction || DEFAULT_SYSTEM_PROMPT }],
      signal
    });
    const stream = session.promptStreaming?.(prompt, { signal });
    const isReadable =
      stream &&
      (Symbol.asyncIterator in Object(stream) ||
        typeof (stream as ReadableStream<string>).getReader === 'function');
    const text = isReadable
      ? await readStream(stream, onProgress)
      : await session.prompt(prompt, { signal });
    return { success: true, text, source: 'nano', model: 'Gemini Nano (On-Device)' };
  } catch (e: unknown) {
    if (signal?.aborted) return CANCELLED;
    console.warn('Chrome Built-in AI failed, falling back to local WebLLM or Cloud API', e);
    return null;
  } finally {
    session?.destroy();
  }
}
