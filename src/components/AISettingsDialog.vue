<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Trash2, Download } from 'lucide-vue-next';
import { useAIAssistantState } from '../composables/useAIAssistantState';
import {
  isWebGPUSupported,
  isModelReady,
  isModelLoading,
  modelLoadingProgress,
  modelLoadingText,
  getWebLLMEngine,
  getAvailableLocalModels,
  selectedLocalModel,
  setSelectedLocalModel,
  type LocalModelOption
} from '../utils/webllm';

const { isSettingsOpen, apiKey, saveApiKey, removeApiKey } = useAIAssistantState();
const localKey = ref(apiKey.value);
const availableModels = ref<LocalModelOption[]>([]);
const isModelsLoading = ref(false);
const isCurrentModelCached = ref(false);

const checkCachedStatus = async () => {
  if (!isWebGPUSupported()) return;
  const { isModelCached } = await import('../utils/webllm');
  isCurrentModelCached.value = await isModelCached(selectedLocalModel.value);
};

const loadModelsList = async () => {
  if (!isWebGPUSupported()) return;
  isModelsLoading.value = true;
  try {
    availableModels.value = await getAvailableLocalModels();
    await checkCachedStatus();
  } finally {
    isModelsLoading.value = false;
  }
};

watch(isSettingsOpen, (open) => {
  if (open) {
    localKey.value = apiKey.value;
    loadModelsList();
  }
});

onMounted(() => {
  loadModelsList();
});

const handleSave = () => {
  saveApiKey(localKey.value);
};

const handleRemove = () => {
  removeApiKey();
  localKey.value = '';
};

const handleModelChange = async (e: Event) => {
  const target = e.target as HTMLSelectElement;
  if (target.value) {
    setSelectedLocalModel(target.value);
    await checkCachedStatus();
  }
};

const handleLoadModel = async () => {
  try {
    await getWebLLMEngine(selectedLocalModel.value);
    await checkCachedStatus();
  } catch (e) {
    console.error('Manual WebLLM loading failed:', e);
  }
};

const handleDeleteModel = async () => {
  try {
    const { deleteLocalModelFromCache } = await import('../utils/webllm');
    await deleteLocalModelFromCache(selectedLocalModel.value);
    await checkCachedStatus();
  } catch (e) {
    console.error('Failed to delete model from cache:', e);
  }
};

const loadingText = computed(() => modelLoadingText.value || 'Downloading model...');

const modelActionButtonLabel = computed(() =>
  isCurrentModelCached.value ? 'Load & Activate Model' : 'Download & Activate Model'
);
</script>

<template>
  <Dialog v-model:open="isSettingsOpen">
    <DialogContent class="max-w-105 w-[90vw]">
      <DialogHeader>
        <DialogTitle>AI Assistant Setup</DialogTitle>
        <DialogDescription>
          Configure on-device inference via Google Chrome or a secure cloud connection to the Gemini API.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 pt-1">
        <div class="flex flex-col gap-2">
          <label
            for="apiKeyInput"
            class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            Gemini Cloud API Key
          </label>
          <div class="flex gap-2">
            <Input
              id="apiKeyInput"
              v-model="localKey"
              placeholder="Paste AI Studio API Key..."
              type="password"
              class="flex-1"
            />
            <Button
              size="sm"
              @click="handleSave"
              class="px-4 font-semibold"
            >
              Save
            </Button>
            <Button
              v-if="apiKey"
              variant="outline"
              size="sm"
              @click="handleRemove"
              title="Remove stored API key"
              class="text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 border-red-500/20"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
          <span class="text-[10px] text-slate-500">
            Keys are stored locally in your browser. Get a free key on
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              class="text-primary-600 dark:text-primary-400 underline hover:text-primary-500"
            >
              Google AI Studio
            </a>.
          </span>
        </div>

        <!-- Local WebGPU AI Section -->
        <div class="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Offline WebGPU Local AI
            </div>
            <span
              v-if="isModelReady"
              class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
            >
              Active
            </span>
            <span
              v-else-if="!isWebGPUSupported()"
              class="text-[10px] text-amber-600 dark:text-amber-400"
            >
              WebGPU Unavailable
            </span>
          </div>

          <p class="text-[11px] text-slate-500 leading-relaxed">
            Choose from dynamically available open-weights models. Run 100% locally and offline without Chrome flags or API keys.
          </p>

          <div v-if="isWebGPUSupported()" class="space-y-2.5">
            <!-- Model Selection Dropdown -->
            <div class="flex flex-col gap-1.5">
              <label for="localModelSelect" class="text-[10.5px] font-semibold text-slate-600 dark:text-slate-400">
                Select Model (Auto-discovered):
              </label>
              <div class="relative">
                <select
                  id="localModelSelect"
                  :value="selectedLocalModel"
                  @change="handleModelChange"
                  :disabled="isModelLoading"
                  class="w-full text-xs py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                >
                  <option
                    v-for="model in availableModels"
                    :key="model.id"
                    :value="model.id"
                  >
                    {{ model.isCached ? '✓ [Downloaded] ' : '' }}{{ model.name }} (~{{ model.vramMB }} MB VRAM)
                  </option>
                </select>
              </div>
            </div>

            <!-- Loading Progress -->
            <div v-if="isModelLoading" class="space-y-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div class="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
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
            <div v-if="!isModelLoading" class="flex gap-2">
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

        <!-- Chrome Built-in Prompt API Note -->
        <div class="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-1.5">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Chrome Built-in Gemini Nano
          </div>
          <div class="text-[11px] text-slate-500 leading-relaxed">
            If you have Chrome with Prompt API enabled in <code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]">chrome://flags</code>, it will be automatically used first with zero download required.
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
