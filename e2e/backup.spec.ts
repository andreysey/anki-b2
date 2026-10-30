import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { gradeFirstCardGood, readSrs } from './helpers';

test('exported backup restores progress on a new device', async ({ page, browser }) => {
  await gradeFirstCardGood(page);
  const saved = await readSrs(page);

  await page.goto('./#dashboard');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Backup' }).click();
  const backupPath = await (await downloadPromise).path();
  const backup = fs.readFileSync(backupPath, 'utf8');

  // A fresh browser profile = a new device with no progress
  const fresh = await (await browser.newContext()).newPage();
  await fresh.goto('./#dashboard');
  expect(await readSrs(fresh)).toEqual({});

  await fresh.locator('input[type="file"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup)
  });
  await expect(fresh.getByText(/Successfully restored .* 1 SRS cards/)).toBeVisible();
  expect(await readSrs(fresh)).toEqual(saved);
  await fresh.reload();
  expect(await readSrs(fresh)).toEqual(saved);
  await fresh.context().close();
});

test('an invalid backup is rejected and keeps current progress', async ({ page }) => {
  await gradeFirstCardGood(page);
  const saved = await readSrs(page);

  await page.goto('./#dashboard');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"srsData": {"x": {"level": "NaN"}}')
  });
  await expect(page.locator('.text-red-600').first()).toBeVisible();
  expect(await readSrs(page)).toEqual(saved);
});
