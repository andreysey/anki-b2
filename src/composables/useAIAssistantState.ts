import { ref } from 'vue';
import { checkOnDeviceSupport, getCloudKey, setCloudKey } from '../utils/ai';

const hasNano = ref(false);
const hasCloudKey = ref(false);
const apiKey = ref('');
const isSettingsOpen = ref(false);

export function useAIAssistantState() {
  const init = async () => {
    hasNano.value = await checkOnDeviceSupport();
    apiKey.value = getCloudKey();
    hasCloudKey.value = !!apiKey.value;
  };

  const openSettings = () => {
    apiKey.value = getCloudKey();
    hasCloudKey.value = !!apiKey.value;
    isSettingsOpen.value = true;
  };

  const closeSettings = () => {
    isSettingsOpen.value = false;
  };

  const saveApiKey = (newKey: string) => {
    setCloudKey(newKey.trim());
    apiKey.value = newKey.trim();
    hasCloudKey.value = !!newKey.trim();
    isSettingsOpen.value = false;
  };

  const removeApiKey = () => {
    setCloudKey('');
    apiKey.value = '';
    hasCloudKey.value = false;
  };

  return {
    hasNano,
    hasCloudKey,
    apiKey,
    isSettingsOpen,
    init,
    openSettings,
    closeSettings,
    saveApiKey,
    removeApiKey
  };
}
