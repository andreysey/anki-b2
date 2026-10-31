import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import type { Word } from '../types';
import { buildDailySession, NEW_CARDS_PER_DAY } from '../utils/srs';

const DAY = 24 * 60 * 60 * 1000;
const word = (id: string): Word => ({
  id,
  german: id,
  english: id,
  ukrainian: id,
  level: 'B2',
  thema: 1,
  german_audio: id
});
const deck = (n: number) => Array.from({ length: n }, (_, i) => word(`w${i}`));

describe('buildDailySession', () => {
  it('takes due reviews first, then new cards up to the quota, and skips cards not due', () => {
    const now = 10 * DAY;
    const cards = [word('due'), word('later'), word('new1'), word('new2'), word('new3')];
    const reviews = {
      due: { level: 1, lastReview: now - 2 * DAY },
      later: { level: 3, lastReview: now - DAY }
    };
    const session = buildDailySession(cards, reviews, now, 2);
    expect(session.cards.map((c) => c.id)).toEqual(['due', 'new1', 'new2']);
    expect(session).toMatchObject({ dueCount: 1, newCount: 2, newLeft: 1 });
  });
});

describe('daily study session', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  const setup = async (cards = deck(25)) => {
    const { useVocabulary } = await import('./useVocabulary');
    const vocab = useVocabulary();
    vocab.vocabulary.value = cards;
    vocab.isStudyMode.value = true;
    await nextTick();
    return vocab;
  };

  it(`offers ${NEW_CARDS_PER_DAY} new cards a day, then is done`, async () => {
    const vocab = await setup();
    expect(vocab.studyList.value).toHaveLength(NEW_CARDS_PER_DAY);

    for (let i = 0; i < NEW_CARDS_PER_DAY; i++) vocab.updateSRS('good');
    expect(vocab.isSessionDone.value).toBe(true);
    expect(vocab.studyList.value).toHaveLength(NEW_CARDS_PER_DAY); // the session did not reshape
  });

  it('"again" keeps the card in the session; grading never skips one', async () => {
    const vocab = await setup(deck(3));
    const shown: string[] = [];
    for (const rating of ['again', 'good', 'good', 'good'] as const) {
      shown.push(vocab.studyList.value[vocab.currentStudyIndex.value]!.id!);
      vocab.updateSRS(rating);
    }
    expect(shown).toEqual(['w0', 'w0', 'w1', 'w2']);
    expect(vocab.isSessionDone.value).toBe(true);
  });

  it('"+10 more new" extends today with the next new cards', async () => {
    const vocab = await setup();
    for (let i = 0; i < NEW_CARDS_PER_DAY; i++) vocab.updateSRS('good');

    vocab.addNewCards();
    await nextTick();
    expect(vocab.isSessionDone.value).toBe(false);
    expect(vocab.currentStudyIndex.value).toBe(0);
    expect(vocab.studyList.value.map((w) => w.id)).toEqual(
      deck(25)
        .slice(10, 20)
        .map((w) => w.id)
    );
  });

  it('remembers new cards seen today after a reload', async () => {
    let vocab = await setup();
    for (let i = 0; i < 4; i++) vocab.updateSRS('good');
    (await import('./useProgress')).flushPendingSRS(); // what closing the page does

    vi.resetModules(); // reload: progress and today's count come from storage
    vocab = await setup();
    expect(vocab.studyList.value.map((w) => w.id)).toEqual(
      deck(25)
        .slice(4, 10)
        .map((w) => w.id)
    );
  });

  it('starts fresh on a new day', async () => {
    let vocab = await setup();
    for (let i = 0; i < NEW_CARDS_PER_DAY; i++) vocab.updateSRS('good');
    const saved = JSON.parse(localStorage.getItem('anki_daily_study_v1')!);
    localStorage.setItem('anki_daily_study_v1', JSON.stringify({ ...saved, date: '2000-01-01' }));

    vi.resetModules();
    vocab = await setup();
    expect(vocab.dailySession.value.newCount).toBe(NEW_CARDS_PER_DAY);
  });

  it('mastering a word removes it without skipping the next one', async () => {
    const vocab = await setup(deck(3));
    vocab.toggleMastered(vocab.studyList.value[0]!);
    await nextTick();
    expect(vocab.studyList.value[vocab.currentStudyIndex.value]!.id).toBe('w1');
  });

  it('"keep studying everything" switches to all cards', async () => {
    const vocab = await setup();
    vocab.setSessionMode('all');
    await nextTick();
    expect(vocab.studyList.value).toHaveLength(25);
  });
});
