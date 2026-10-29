# Local AI Guide (English & Ukrainian)

The AI coach can run **on your own device**, offline and without an API key. It uses **WebGPU** to run a small language model (Gemma 3 1B or Qwen3.5 0.8B) on your graphics card. Local models answer in **English**; the cloud Gemini API answers in Ukrainian.

If local AI is not available, the app falls back to the Gemini API (add a free key in **AI Assistant Setup**).

---

## [English]

### Quick check

1. Open the app → **AI Assistant Setup** → section **Offline WebGPU Local AI**.
   - **Download & Activate Model** → everything works, click it.
   - **WebGPU Unavailable** → follow the steps for your system below.
2. For details, open [webgpureport.org](https://webgpureport.org) — it shows whether your browser sees a GPU.

The first start downloads the model once (about 0.7–1.9 GB). After that it loads from the browser cache in seconds and works offline.

### Support at a glance

| System        | Chrome / Edge / Brave                        | Firefox                 | Safari        |
| ------------- | -------------------------------------------- | ----------------------- | ------------- |
| Windows 10/11 | ✅ Works                                     | ✅ Works (141+)         | —             |
| macOS         | ✅ Works                                     | ✅ Apple Silicon (147+) | ✅ Safari 26+ |
| Linux         | ⚠️ Intel / NVIDIA yes, others may need flags | ❌ Nightly only         | —             |
| ChromeOS      | ✅ Works                                     | —                       | —             |
| Android 12+   | ⚠️ Chrome, recent phones only                | ❌                      | —             |
| iPhone / iPad | ⚠️ iOS 26+, any browser                      | ⚠️ iOS 26+              | ⚠️ iOS 26+    |

⚠️ = works on some devices; phones often lack the memory for a 1 GB model, so the cloud API is the safer choice there.

### Windows

- Use **Chrome**, **Edge** or **Firefox 141+**.
- If it shows _WebGPU Unavailable_:
  1. Update your graphics driver (NVIDIA / AMD / Intel website, or Windows Update).
  2. Browser settings → **System** → enable **Use graphics acceleration when available**, then restart the browser.
  3. Laptops with two GPUs: **Settings → System → Display → Graphics**, add your browser and choose **High performance**.

### macOS

- **Chrome**, **Edge**, **Safari 26+** (macOS Tahoe or later) and **Firefox** on Apple Silicon work out of the box.
- On older Safari versions, use Chrome instead.

### Linux

- Use **Chrome**, **Chromium** or **Brave** (recent versions). Firefox only supports WebGPU in Nightly builds.
- Check `chrome://gpu` → line **WebGPU** should say _Hardware accelerated_.
- If it doesn't:
  1. Open `chrome://flags`, enable **Unsafe WebGPU Support** (`#enable-unsafe-webgpu`) and **Vulkan** (`#enable-vulkan`), restart.
  2. Make sure Vulkan drivers are installed (`vulkaninfo --summary` should list your GPU).
  3. Laptops with NVIDIA + integrated GPU: start the browser on the NVIDIA card, e.g. via **Launch using Discrete Graphics Card** in your app menu, or:
     ```bash
     __NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia google-chrome
     ```
  4. Flatpak browsers need the NVIDIA GL runtime matching your driver (`flatpak list | grep nvidia`). Fedora Atomic / Bazzite install it automatically.
- Firefox (experimental): `about:config` → `dom.webgpu.enabled` = `true`.

### Android

- **Chrome** on Android 12+ with a recent Qualcomm or ARM GPU.
- The model needs ~1–2 GB of free memory; on most phones the cloud API works better.

### iPhone / iPad

- WebGPU arrived with **iOS / iPadOS 26**. All browsers on iOS use the Safari engine, so the iOS version is what matters.
- Memory limits may close the page while the model loads; use the cloud API if that happens.

### Always

- Don't use a **private / incognito window**: the model can't be cached and downloads every time.
- Keep **2–3 GB of free disk space** for the model cache.
- Remote desktops and virtual machines usually have no GPU access.

### Chrome built-in AI (Gemini Nano)

Desktop Chrome can also provide its own on-device model. The app uses it automatically when Chrome has already downloaded it. For websites this API is still rolling out, so most users will see the WebGPU model instead. Requirements: [Chrome Prompt API docs](https://developer.chrome.com/docs/ai/prompt-api).

---

## [Українська]

### Швидка перевірка

1. Відкрийте застосунок → **AI Assistant Setup** → розділ **Offline WebGPU Local AI**.
   - **Download & Activate Model** — усе працює, натисніть кнопку.
   - **WebGPU Unavailable** — дивіться кроки для вашої системи нижче.
2. Детальніше: [webgpureport.org](https://webgpureport.org) показує, чи бачить браузер відеокарту.

Першого разу модель завантажується один раз (приблизно 0,7–1,9 ГБ). Далі вона береться з кешу браузера за кілька секунд і працює без інтернету. Локальні моделі відповідають **англійською**, хмарний Gemini — українською.

### Коротко за системами

| Система       | Chrome / Edge / Brave                                     | Firefox                 | Safari        |
| ------------- | --------------------------------------------------------- | ----------------------- | ------------- |
| Windows 10/11 | ✅ Працює                                                 | ✅ Працює (141+)        | —             |
| macOS         | ✅ Працює                                                 | ✅ Apple Silicon (147+) | ✅ Safari 26+ |
| Linux         | ⚠️ Intel / NVIDIA так, інші — можуть знадобитися прапорці | ❌ лише Nightly         | —             |
| ChromeOS      | ✅ Працює                                                 | —                       | —             |
| Android 12+   | ⚠️ Chrome, лише нові телефони                             | ❌                      | —             |
| iPhone / iPad | ⚠️ iOS 26+, будь-який браузер                             | ⚠️ iOS 26+              | ⚠️ iOS 26+    |

⚠️ — працює не на всіх пристроях. Телефонам часто бракує пам'яті для моделі на 1 ГБ, тож там надійніше хмарний API.

### Windows

- **Chrome**, **Edge** або **Firefox 141+**.
- Якщо бачите _WebGPU Unavailable_:
  1. Оновіть драйвер відеокарти (сайт NVIDIA / AMD / Intel або Windows Update).
  2. Налаштування браузера → **Система** → увімкніть **Використовувати апаратне прискорення**, перезапустіть браузер.
  3. Ноутбук із двома відеокартами: **Параметри → Система → Дисплей → Графіка**, додайте браузер і виберіть **Висока продуктивність**.

### macOS

- **Chrome**, **Edge**, **Safari 26+** (macOS Tahoe і новіші) та **Firefox** на Apple Silicon працюють одразу.
- На старіших версіях Safari використовуйте Chrome.

### Linux

- **Chrome**, **Chromium** або **Brave** (свіжі версії). Firefox підтримує WebGPU лише в Nightly.
- Відкрийте `chrome://gpu` — у рядку **WebGPU** має бути _Hardware accelerated_.
- Якщо ні:
  1. `chrome://flags` → увімкніть **Unsafe WebGPU Support** (`#enable-unsafe-webgpu`) і **Vulkan** (`#enable-vulkan`), перезапустіть.
  2. Перевірте драйвери Vulkan: `vulkaninfo --summary` має показати відеокарту.
  3. Ноутбук з NVIDIA + вбудованою графікою: запускайте браузер на NVIDIA, через пункт **Launch using Discrete Graphics Card** у меню або командою:
     ```bash
     __NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia google-chrome
     ```
  4. Браузерам із Flatpak потрібна бібліотека NVIDIA GL тієї ж версії, що й драйвер (`flatpak list | grep nvidia`). Fedora Atomic / Bazzite ставлять її автоматично.
- Firefox (експериментально): `about:config` → `dom.webgpu.enabled` = `true`.

### Android

- **Chrome** на Android 12+ з новим процесором Qualcomm або ARM.
- Моделі потрібно 1–2 ГБ вільної пам'яті; на більшості телефонів краще хмарний API.

### iPhone / iPad

- WebGPU з'явився в **iOS / iPadOS 26**. Усі браузери на iOS працюють на рушії Safari, тож важлива саме версія iOS.
- Сторінка може закритися під час завантаження моделі через брак пам'яті — тоді використовуйте хмарний API.

### Завжди

- Не використовуйте **приватне вікно / інкогніто**: модель не збережеться й завантажуватиметься щоразу.
- Залиште **2–3 ГБ вільного місця на диску** для кешу моделі.
- Віддалений робочий стіл і віртуальні машини зазвичай не мають доступу до відеокарти.

### Вбудований AI Chrome (Gemini Nano)

Chrome на комп'ютері може надавати власну модель на пристрої. Застосунок використовує її автоматично, якщо Chrome уже завантажив модель. Для сайтів цей API ще розгортається, тож більшість користувачів бачитимуть модель WebGPU. Вимоги: [документація Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api).
