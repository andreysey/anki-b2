import { test, expect } from '@playwright/test';

test('studying does not download the local AI engine (~6 MB)', async ({ page }) => {
  const engineRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('vendor-webllm')) engineRequests.push(req.url());
  });

  await page.goto('./#study');
  const card = page.locator('[aria-roledescription="flashcard"]').first();
  await expect(card).toBeVisible();
  await card.focus();
  await page.keyboard.press('Space'); // the AI coach is on the back of the card
  await expect(page.getByText('AI Coach').first()).toBeVisible();
  await page.waitForTimeout(1000);

  expect(engineRequests).toEqual([]);
});
