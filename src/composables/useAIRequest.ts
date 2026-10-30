// State of one AI coach request: streaming result, cancellation of stale requests, copy.
// Must be called from a component's setup (it registers an unmount cleanup).
import { ref, computed, onUnmounted } from 'vue';
import { callAI, type AIServiceResponse } from '../utils/ai';
import type { AIPrompt, AIPromptType } from '../utils/aiPrompts';

const COPY_FEEDBACK_MS = 2000;

export function useAIRequest() {
  const isLoading = ref(false);
  const isError = ref(false);
  const resultText = ref('');
  const resultSource = ref<AIServiceResponse['source']>('none');
  const resultModel = ref('');
  const explanationType = ref<AIPromptType | null>(null);
  const isCopied = ref(false);

  // Each request gets an id; results of superseded requests are ignored
  let activeRequestId = 0;
  let activeAbortController: AbortController | null = null;

  const abortActive = () => {
    activeAbortController?.abort();
    activeAbortController = null;
  };

  const reset = () => {
    abortActive();
    activeRequestId++;
    isLoading.value = false;
    isError.value = false;
    resultText.value = '';
    resultModel.value = '';
    resultSource.value = 'none';
    explanationType.value = null;
    isCopied.value = false;
  };

  const run = async (type: AIPromptType, { systemInstruction, prompt }: AIPrompt) => {
    abortActive();
    const abortController = new AbortController();
    activeAbortController = abortController;

    const requestId = ++activeRequestId;
    explanationType.value = type;
    isLoading.value = true;
    isError.value = false;
    resultText.value = '';
    resultModel.value = '';
    isCopied.value = false;

    const res = await callAI(
      prompt,
      systemInstruction,
      (_chunk, fullText) => {
        if (activeRequestId === requestId) resultText.value = fullText;
      },
      abortController.signal
    );

    if (activeRequestId !== requestId) return;
    resultText.value = res.text;
    resultSource.value = res.source;
    resultModel.value = res.model || '';
    isError.value = !res.success;
    isLoading.value = false;
  };

  const copy = async () => {
    if (!resultText.value) return;
    try {
      await navigator.clipboard.writeText(resultText.value.replace(/<[^>]*>/g, ''));
      isCopied.value = true;
      setTimeout(() => {
        isCopied.value = false;
      }, COPY_FEEDBACK_MS);
    } catch (err: unknown) {
      console.warn('Failed to copy AI text:', err);
    }
  };

  const displayModelLabel = computed(() => {
    if (resultModel.value) return resultModel.value;
    if (resultSource.value === 'nano') return 'gemini-nano';
    if (resultSource.value === 'webllm') return 'local-model';
    return 'gemini-cloud';
  });

  const displaySourceLabel = computed(() => {
    if (resultSource.value === 'nano') return 'On-Device AI';
    if (resultSource.value === 'webllm') return 'WebGPU Local AI';
    return 'Cloud API';
  });

  onUnmounted(abortActive);

  return {
    isLoading,
    isError,
    resultText,
    resultSource,
    resultModel,
    explanationType,
    isCopied,
    displayModelLabel,
    displaySourceLabel,
    run,
    reset,
    copy
  };
}
