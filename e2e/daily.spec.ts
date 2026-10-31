import { test, expect } from '@playwright/test';

test("a day's session: 10 new cards, done screen, 10 more, kept after reload", async ({ page }) => {
  await page.goto('./#study');
  await expect(page.getByText('0 to review · 10 new')).toBeVisible();
  await expect(page.getByText('1 of 10')).toBeVisible();

  const grades = page.getByRole('button', { name: /GOOD/ });
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Space');
    await expect(grades).toBeVisible();
    await page.keyboard.press('3');
    await expect(grades).toBeHidden();
  }

  await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible();
  await expect(page.getByText('10 cards reviewed')).toBeVisible();

  await page.getByRole('button', { name: '10 more new words' }).click();
  await expect(page.getByText('1 of 10')).toBeVisible();
  await expect(page.locator('[aria-roledescription="flashcard"]')).toBeVisible();

  // Reload: the 10 cards learned today are not offered as new again
  await page.reload();
  await expect(page.getByText('1 of 10')).toBeVisible();
  const first = await page.getByRole('heading', { level: 2 }).first().textContent();
  expect(first).not.toContain('die Abteilung'); // the first card of day one
});

test('"Study all" switches to every card and back', async ({ page }) => {
  await page.goto('./#study');
  await page.getByRole('button', { name: 'Study all' }).click();
  await expect(page.getByText(/1 of 36\d\d/)).toBeVisible();
  await page.getByRole('button', { name: 'Back to today' }).click();
  await expect(page.getByText('1 of 10')).toBeVisible();
});
