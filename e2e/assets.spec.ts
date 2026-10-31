import { test, expect, type Response } from '@playwright/test';

test('every view loads without missing files or reload loops', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (res: Response) => {
    if (res.status() >= 400 && res.url().startsWith('http://localhost')) failed.push(res.url());
  });

  await page.goto('./');
  await expect(page.getByText('die Abteilung').first()).toBeVisible();
  // A reload would wipe this marker
  await page.evaluate(
    () => ((window as unknown as { __sameDocument: boolean }).__sameDocument = true)
  );
  await page.getByRole('tab', { name: /Study/ }).click();
  const card = page.locator('[aria-roledescription="flashcard"]').first();
  await expect(card).toBeVisible();
  await card.focus();
  await page.keyboard.press('Space'); // the AI coach is on the back of the card
  // dispatchEvent: Playwright's hit test can't see through the card's 3D flip transform
  await page.getByRole('button', { name: 'AI Settings' }).first().dispatchEvent('click');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: /Dashboard/ }).click();
  await expect(page.getByText('Activity & Analytics')).toBeVisible();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();

  expect(failed).toEqual([]);
  expect(
    await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument)
  ).toBe(true);
});
