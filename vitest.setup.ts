import { config } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';

config.global.plugins = [[PrimeVue, { theme: { preset: Aura } }], ToastService];
