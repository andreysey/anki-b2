import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StudySessionDone from './StudySessionDone.vue';

const props = { mode: 'daily' as const, reviewedCount: 22, streak: 5, newLeft: 300, newPerDay: 10 };

describe('StudySessionDone', () => {
  it('celebrates the finished day with stats', () => {
    const text = mount(StudySessionDone, { props }).text();
    expect(text).toContain('Done for today');
    expect(text).toContain('22 cards reviewed');
    expect(text).toContain('5-day streak');
  });

  it('offers more new words and studying everything', async () => {
    const wrapper = mount(StudySessionDone, { props });
    const buttons = wrapper.findAll('button');
    expect(buttons.map((b) => b.text())).toEqual(['10 more new words', 'Keep studying everything']);
    await buttons[0]!.trigger('click');
    await buttons[1]!.trigger('click');
    expect(wrapper.emitted('add-new')).toHaveLength(1);
    expect(wrapper.emitted('set-mode')).toEqual([['all']]);
  });

  it('hides "more new" when none are left and offers going back from "all cards"', async () => {
    const wrapper = mount(StudySessionDone, { props: { ...props, mode: 'all', newLeft: 0 } });
    expect(wrapper.text()).toContain('You went through every card');
    const buttons = wrapper.findAll('button');
    expect(buttons.map((b) => b.text())).toEqual(["Back to today's session"]);
    await buttons[0]!.trigger('click');
    expect(wrapper.emitted('set-mode')).toEqual([['daily']]);
  });

  it('says when nothing was due', () => {
    expect(mount(StudySessionDone, { props: { ...props, reviewedCount: 0 } }).text()).toContain(
      'Nothing is due right now'
    );
  });
});
