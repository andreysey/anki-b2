import { test, expect } from '@playwright/test';

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByText('die Abteilung').first()).toBeVisible();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline')).toBeVisible();
  await page.goto('./#study');
  await expect(page.locator('[aria-roledescription="flashcard"]').first()).toBeVisible();
});
