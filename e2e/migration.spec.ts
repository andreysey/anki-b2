import { test, expect } from '@playwright/test';
import { readSrs } from './helpers';

const LEGACY = '<span style="color: #ef4444; font-weight: bold;">die</span> Abteilung, -en-1';

test('progress saved by an older version is kept after updating', async ({ page }) => {
  // Storage as written by v1.64 and earlier (keys contained HTML)
  await page.addInitScript((legacy) => {
    if (localStorage.getItem('anki_srs_v2')) return; // only before the first load
    localStorage.setItem('anki_srs_v2', JSON.stringify({ [legacy]: { level: 3, lastReview: 1 } }));
    localStorage.setItem('anki_mastered_words', JSON.stringify([]));
  }, LEGACY);

  await page.goto('./#dashboard');
  await expect(page.getByText('Activity & Analytics')).toBeVisible();
  await expect
    .poll(() => readSrs(page))
    .toEqual({ 'die Abteilung, -en-1': { level: 3, lastReview: 1 } });

  // Stays migrated after a reload (no old key written back)
  await page.reload();
  expect(await readSrs(page)).toEqual({ 'die Abteilung, -en-1': { level: 3, lastReview: 1 } });
});
