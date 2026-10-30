<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Button } from './ui/button';
import { Trash2, Download, ChevronDown } from '@lucide/vue';
import { useAIAssistantState } from '../composables/useAIAssistantState';
import {
  isWebGPUSupported,
  isModelReady,
  isModelLoading,
  modelLoadingProgress,
  modelLoadingText,
  selectedLocalModel,
  setSelectedLocalModel,
  type LocalModelOption
} from '../utils/webllmState';
import { getWebGPUHelp, LOCAL_AI_GUIDE_URL } from '../utils/webgpuHelp';

const { isSettingsOpen } = useAIAssistantState();

const availableModels = ref<LocalModelOption[]>([]);
const isCurrentModelCached = ref(false);
// navigator.gpu can exist while no GPU adapter is available (common on Linux)
const hasGPUAdapter = ref(true);
const gpuReady = computed(() => isWebGPUSupported() && hasGPUAdapter.value);
const webgpuHelp = getWebGPUHelp();

// webllm is imported lazily: it pulls in the large WebLLM runtime
const loadWebLLM = () => import('../utils/webllm');

const checkCachedStatus = async () => {
  if (!isWebGPUSupported()) return;
  const { isModelCached } = await loadWebLLM();
  isCurrentModelCached.value = await isModelCached(selectedLocalModel.value);
};

const loadModelsList = async () => {
  if (!isWebGPUSupported()) return;
  const { getAvailableLocalModels, checkWebGPUAvailability } = await loadWebLLM();
  hasGPUAdapter.value = await checkWebGPUAvailability();
  if (!hasGPUAdapter.value) return;
  availableModels.value = await getAvailableLocalModels();
  await checkCachedStatus();
};

watch(isSettingsOpen, (open) => {
  if (open) loadModelsList();
});
onMounted(loadModelsList);

const handleModelChange = async (e: Event) => {
  const { value } = e.target as HTMLSelectElement;
  if (!value) return;
  setSelectedLocalModel(value);
  await checkCachedStatus();
};

// Runs a model action, then refreshes the "downloaded" state; failures are logged, not thrown
const withCacheRefresh = async (action: () => Promise<unknown>, errorMessage: string) => {
  try {
    await action();
    await checkCachedStatus();
  } catch (e: unknown) {
    console.error(errorMessage, e);
  }
};

const handleLoadModel = () =>
  withCacheRefresh(
    async () => (await loadWebLLM()).getWebLLMEngine(selectedLocalModel.value),
    'Manual WebLLM loading failed:'
  );

const handleDeleteModel = () =>
  withCacheRefresh(
    async () => (await loadWebLLM()).deleteLocalModelFromCache(selectedLocalModel.value),
    'Failed to delete model from cache:'
  );

const loadingText = computed(() => modelLoadingText.value || 'Downloading model...');
const modelActionButtonLabel = computed(() =>
  isCurrentModelCached.value ? 'Load & Activate Model' : 'Download & Activate Model'
);
</script>

<template>
  <div class="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-2.5">
    <div class="flex items-center justify-between">
      <div
        class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
      >
        Offline WebGPU Local AI
      </div>
      <span
        v-if="isModelReady"
        class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
      >
        Active
      </span>
      <span v-else-if="!gpuReady" class="text-[10px] text-amber-600 dark:text-amber-400">
        WebGPU Unavailable
      </span>
    </div>

    <p class="text-[11px] text-slate-500 leading-relaxed">
      Choose from dynamically available open-weights models. Run 100% locally and offline without
      Chrome flags or API keys.
    </p>

    <div
      v-if="!gpuReady"
      class="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5"
      data-testid="webgpu-help"
    >
      <div class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
        How to enable it ({{ webgpuHelp.label }}):
      </div>
      <ol class="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
        <li v-for="step in webgpuHelp.steps" :key="step">{{ step }}</li>
      </ol>
      <div class="text-[11px] text-slate-500">
        Or add a Gemini API key above.
        <a
          :href="LOCAL_AI_GUIDE_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-600 dark:text-primary-400 underline hover:text-primary-500"
          >Full guide for all systems</a
        >
      </div>
    </div>

    <div v-else class="space-y-2.5">
      <!-- Model Selection Dropdown -->
      <div class="flex flex-col gap-1.5">
        <label
          for="localModelSelect"
          class="text-[10.5px] font-semibold text-slate-600 dark:text-slate-400"
        >
          Select Model (Auto-discovered):
        </label>
        <div class="relative">
          <select
            id="localModelSelect"
            :value="selectedLocalModel"
            @change="handleModelChange"
            :disabled="isModelLoading"
            class="w-full text-xs py-2 pl-3 pr-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option
              v-for="model in availableModels"
              :key="model.id"
              :value="model.id"
              class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1"
            >
              {{ model.isCached ? '✓ [Downloaded] ' : '' }}{{ model.name }} (~{{ model.vramMB }}
              MB VRAM)
            </option>
          </select>
          <div
            class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400"
          >
            <ChevronDown class="h-4 w-4" />
          </div>
        </div>
      </div>

      <!-- Loading Progress -->
      <div
        v-if="isModelLoading"
        class="space-y-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
      >
        <div
          class="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          <span>{{ loadingText }}</span>
          <span>{{ modelLoadingProgress }}%</span>
        </div>
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div
            class="bg-primary-500 h-full transition-all duration-300 rounded-full"
            :style="{ width: `${modelLoadingProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Actions: Download or Delete Cached Model -->
      <div v-else class="flex flex-col @xs:flex-row gap-2">
        <Button
          v-if="!isModelReady"
          variant="outline"
          size="sm"
          @click="handleLoadModel"
          class="flex-1 text-xs font-semibold py-2 rounded-xl"
        >
          <Download class="h-3.5 w-3.5 mr-1" />
          {{ modelActionButtonLabel }}
        </Button>
        <Button
          v-if="isCurrentModelCached"
          variant="outline"
          size="sm"
          @click="handleDeleteModel"
          title="Delete downloaded model files from cache to free up disk space"
          class="text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 border-red-500/20 rounded-xl px-3"
        >
          <Trash2 class="h-3.5 w-3.5 mr-1" />
          Delete Cached Model
        </Button>
      </div>
    </div>
  </div>
</template>
