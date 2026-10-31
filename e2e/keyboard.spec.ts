import { test, expect, type Page } from '@playwright/test';

const flashcard = (page: Page) => page.locator('[aria-roledescription="flashcard"]').first();
const gradeButtons = (page: Page) => page.getByRole('button', { name: /EASY/ });

/** Presses Space and expects the card to show its back (grade buttons), then flips it back. */
async function expectSpaceFlips(page: Page, focusCard: boolean) {
  if (focusCard) await flashcard(page).focus();
  else await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Space');
  await expect(gradeButtons(page)).toBeVisible();
  await page.keyboard.press('Space');
  await expect(gradeButtons(page)).toBeHidden();
}

test('Space flips the card when the app opens directly on Study', async ({ page }) => {
  await page.goto('./#study');
  await expect(flashcard(page)).toBeVisible();
  await expectSpaceFlips(page, false);
  await expectSpaceFlips(page, true);
});

test('Space flips the card after switching tabs', async ({ page }) => {
  await page.goto('./#study');
  await expect(flashcard(page)).toBeVisible();
  await page.getByRole('tab', { name: /Dashboard/ }).click();
  await expect(page.getByText('Activity & Analytics')).toBeVisible();
  await page.getByRole('tab', { name: /Study/ }).click();
  await expect(flashcard(page)).toBeVisible();
  await expectSpaceFlips(page, true);
  await expectSpaceFlips(page, false);
});
