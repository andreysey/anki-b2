import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
app.use(PrimeVue, { unstyled: true })
app.mount('#app')
