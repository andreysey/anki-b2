import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import 'vue-sonner/style.css';

// After a new release the old files are gone from the server, so a tab opened earlier can fail
// to load a view it hasn't shown yet. Reload to pick up the new version — but only once per
// failing file: if it is still missing after the reload, reloading again would loop forever.
const RELOADED_FOR_KEY = 'anki_reloaded_for';
window.addEventListener('vite:preloadError', (event) => {
  const failure = String((event as Event & { payload?: unknown }).payload ?? 'unknown');
  try {
    const tried = JSON.parse(sessionStorage.getItem(RELOADED_FOR_KEY) ?? '[]') as string[];
    if (tried.includes(failure)) return; // already reloaded for this; let the error surface
    sessionStorage.setItem(RELOADED_FOR_KEY, JSON.stringify([...tried, failure].slice(-10)));
  } catch {
    return; // without storage we can't guard against a reload loop
  }
  event.preventDefault();
  window.location.reload();
});

const app = createApp(App);

app.config.errorHandler = (err, _instance, info) => {
  console.error('[AnkiB2 Global Error]:', err, info);
};

app.mount('#app');
