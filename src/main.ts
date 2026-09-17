import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import 'vue-sonner/style.css';

const app = createApp(App);

app.config.errorHandler = (err, _instance, info) => {
  console.error('[AnkiB2 Global Error]:', err, info);
};

app.mount('#app');
