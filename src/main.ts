import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import 'vue-sonner/style.css';

// After a new release the old files are gone from the server, so a tab opened earlier can fail
// to load a view it hasn't shown yet. Reload once to pick up the new version.
const RELOAD_KEY = 'anki_chunk_reload';
window.addEventListener('vite:preloadError', (event) => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return; // already tried; let the error surface
    sessionStorage.setItem(RELOAD_KEY, '1');
  } catch {
    return; // without storage we can't guard against a reload loop
  }
  event.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    // storage unavailable
  }
});

const app = createApp(App);

app.config.errorHandler = (err, _instance, info) => {
  console.error('[AnkiB2 Global Error]:', err, info);
};

app.mount('#app');
