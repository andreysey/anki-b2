// Browser tests of the built app (npm run build first): study progress, backup, offline.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/anki-b2/`,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      // CI runners already have Google Chrome; locally use Playwright's Chromium
      use: { ...devices['Desktop Chrome'], ...(process.env.CI ? { channel: 'chrome' } : {}) }
    }
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/anki-b2/`,
    reuseExistingServer: !process.env.CI
  }
});
