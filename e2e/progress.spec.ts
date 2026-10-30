import { test, expect } from '@playwright/test';
import { gradeFirstCardGood, readSrs } from './helpers';

test('a graded card is saved and survives a reload', async ({ page }) => {
  await gradeFirstCardGood(page);
  const before = await readSrs(page);

  await page.reload();
  await page.goto('./#dashboard');
  await expect(page.getByText('Activity & Analytics')).toBeVisible();
  expect(await readSrs(page)).toEqual(before);
});
