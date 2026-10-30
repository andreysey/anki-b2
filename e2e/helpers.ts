import { expect, type Page } from '@playwright/test';

export const SRS_KEY = 'anki_srs_v2';

export async function readSrs(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), SRS_KEY);
}

/** Opens Study, flips the first card and grades it "Good". */
export async function gradeFirstCardGood(page: Page): Promise<void> {
  await page.goto('./#study');
  const card = page.locator('[aria-roledescription="flashcard"]').first();
  await expect(card).toBeVisible();
  await card.focus();
  await page.keyboard.press('Space'); // flip (a click would hit the audio button in the middle)
  await page.getByRole('button', { name: /GOOD/ }).click();
  await expect.poll(async () => Object.keys(await readSrs(page)).length).toBe(1);
}
