import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import './assets/main.css'

const app = createApp(App)
app.use(ToastService);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark'
        }
    }
})
app.mount('#app')
