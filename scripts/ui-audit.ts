/**
 * ui-audit.ts — lets a developer or AI agent "see" the UI.
 *
 * Usage: npm run build && npm run audit:ui
 *
 * Serves dist/ with `vite preview`, drives a headless Chrome over the DevTools protocol and,
 * for every view × width × theme:
 *   - saves a screenshot to .audit/<theme>-<width>-<view>.png
 *   - fails on horizontal page overflow
 * and runs axe-core (WCAG checks incl. contrast) on every view in both themes at 1280px.
 * Exits with code 1 when anything is found.
 *
 * Chrome is found via $CHROME_BIN, common binary names, or the Flatpak com.google.Chrome.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '.audit');
const PREVIEW_PORT = 4180;
const DEBUG_PORT = 9340;
const APP_URL = `http://localhost:${PREVIEW_PORT}/anki-b2/`;
const WIDTHS = [360, 768, 1024, 1440];
const THEMES = ['light', 'dark'] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Chrome discovery ────────────────────────────────────────────────────────────
function findChrome(): string[] {
  const candidates = [
    process.env.CHROME_BIN,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    'microsoft-edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean) as string[];
  for (const bin of candidates) {
    if (spawnSync(bin, ['--version'], { stdio: 'ignore' }).status === 0) return [bin];
  }
  if (spawnSync('flatpak', ['info', 'com.google.Chrome'], { stdio: 'ignore' }).status === 0) {
    return ['flatpak', 'run', 'com.google.Chrome'];
  }
  throw new Error('Chrome not found. Install Chrome/Chromium or set CHROME_BIN.');
}

/** Closes the whole browser over DevTools; killing a Flatpak wrapper process leaves Chrome running. */
async function closeBrowser(port: number): Promise<void> {
  try {
    const { webSocketDebuggerUrl } = (await (
      await fetch(`http://127.0.0.1:${port}/json/version`)
    ).json()) as { webSocketDebuggerUrl: string };
    const ws = new WebSocket(webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    await sleep(500);
  } catch {
    // already gone
  }
}

async function waitFor(url: string, tries = 60): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

// ── Minimal DevTools protocol client ────────────────────────────────────────────
class Page {
  private id = 0;
  private pending = new Map<number, (msg: { result?: unknown }) => void>();
  private ws: WebSocket;

  private constructor(ws: WebSocket) {
    this.ws = ws;
    ws.addEventListener('message', (e: MessageEvent) => {
      const msg = JSON.parse(String(e.data));
      this.pending.get(msg.id)?.(msg);
      this.pending.delete(msg.id);
    });
  }

  static async connect(port: number): Promise<Page> {
    await waitFor(`http://127.0.0.1:${port}/json/version`);
    const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as {
      type: string;
      webSocketDebuggerUrl: string;
    }[];
    const ws = new WebSocket(targets.find((t) => t.type === 'page')!.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    return new Page(ws);
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<{ result?: unknown }> {
    const id = ++this.id;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval<T>(expression: string): Promise<T> {
    const res = (await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    })) as { result?: { result?: { value?: T }; exceptionDetails?: { text: string } } };
    if (res.result?.exceptionDetails) throw new Error(res.result.exceptionDetails.text);
    return res.result?.result?.value as T;
  }

  async screenshot(file: string): Promise<void> {
    const res = (await this.send('Page.captureScreenshot', { format: 'png' })) as {
      result: { data: string };
    };
    fs.writeFileSync(file, Buffer.from(res.result.data, 'base64'));
  }

  close() {
    this.ws.close();
  }
}

// ── In-page helpers ─────────────────────────────────────────────────────────────
// Clicks the first button whose text contains any of the labels (tabs have short labels on phones)
const clickButton = (...labels: string[]) =>
  `(async () => { const labels = ${JSON.stringify(labels)}; [...document.querySelectorAll('button')].find(b => labels.some(l => b.textContent.includes(l)))?.click(); await new Promise(r => setTimeout(r, 900)); return true; })()`;

const VIEWS: { name: string; action?: string }[] = [
  { name: 'list' },
  { name: 'study', action: clickButton('Study') },
  {
    name: 'flipped',
    action: `(async () => { document.querySelector('[aria-roledescription="flashcard"]')?.click(); await new Promise(r => setTimeout(r, 1200)); return true; })()`
  },
  { name: 'dashboard', action: clickButton('Dashboard', 'Stats') },
  {
    name: 'palette',
    action: `(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })); await new Promise(r => setTimeout(r, 900)); return true; })()`
  }
];

const OVERFLOW = `document.documentElement.scrollWidth > document.documentElement.clientWidth`;

const AXE_RUN = `(async () => {
  const r = await axe.run(document, { resultTypes: ['violations'] });
  return r.violations.map(v => v.impact + ' ' + v.id + ' (' + v.nodes.length + '): ' + v.help + ' → ' + v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', '));
})()`;

async function openApp(page: Page, theme: string, width: number) {
  const mobile = width < 500;
  await page.send('Emulation.setDeviceMetricsOverride', {
    width,
    height: mobile ? 800 : 900,
    deviceScaleFactor: 1,
    mobile
  });
  await page.send('Emulation.setTouchEmulationEnabled', {
    enabled: mobile,
    maxTouchPoints: mobile ? 5 : 0
  });
  await page.send('Page.navigate', { url: APP_URL });
  await sleep(1500);
  await page.eval(`localStorage.setItem('anki_theme_mode', '${theme}'); true`);
  await page.send('Page.reload');
  await sleep(2500);
}

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    throw new Error('dist/ not found — run `npm run build` first.');
  }
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const children: ChildProcess[] = [];
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-b2-audit-'));
  const cleanup = () => {
    children.forEach((c) => c.kill());
    fs.rmSync(profile, { recursive: true, force: true });
  };
  process.on('exit', cleanup);

  children.push(
    spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
      cwd: ROOT,
      stdio: 'ignore'
    })
  );
  const [chromeBin, ...chromeArgs] = findChrome();
  children.push(
    spawn(
      chromeBin,
      [
        ...chromeArgs,
        '--headless=new',
        `--remote-debugging-port=${DEBUG_PORT}`,
        `--user-data-dir=${profile}`,
        '--no-first-run',
        'about:blank'
      ],
      { stdio: 'ignore' }
    )
  );
  await waitFor(APP_URL);
  const page = await Page.connect(DEBUG_PORT);
  // Always test the fresh build, not a service-worker-cached one
  await page.send('Network.enable');
  await page.send('Network.setBypassServiceWorker', { bypass: true });
  await page.send('Network.setCacheDisabled', { cacheDisabled: true });

  const problems: string[] = [];
  const axeSource = fs.readFileSync(path.join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');

  for (const theme of THEMES) {
    for (const width of [...WIDTHS, 1280]) {
      const isAxeRun = width === 1280;
      await openApp(page, theme, width);
      if (isAxeRun) await page.eval(`${axeSource}; true`);
      for (const view of VIEWS) {
        if (view.action) await page.eval(view.action);
        const tag = `${theme}-${width}-${view.name}`;
        if (isAxeRun) {
          for (const v of await page.eval<string[]>(AXE_RUN))
            problems.push(`[axe ${theme} ${view.name}] ${v}`);
        } else {
          if (await page.eval<boolean>(OVERFLOW))
            problems.push(`[overflow] ${tag}: page scrolls horizontally`);
          await page.screenshot(path.join(OUT_DIR, `${tag}.png`));
        }
      }
      await page.eval(
        `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); true`
      );
    }
  }

  page.close();
  await closeBrowser(DEBUG_PORT);
  const shots = fs.readdirSync(OUT_DIR).length;
  console.log(`📸 ${shots} screenshots in .audit/`);
  if (problems.length) {
    console.log(`\n❌ ${problems.length} problem(s):`);
    problems.forEach((p) => console.log('  ' + p));
    process.exitCode = 1;
  } else {
    console.log('✅ No horizontal overflow and no axe-core violations in any view or theme.');
  }
  cleanup();
  process.exit();
}

main().catch(async (err: unknown) => {
  console.error('❌ UI audit failed:', err instanceof Error ? err.message : err);
  await closeBrowser(DEBUG_PORT);
  process.exit(1);
});
