import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GradeButtons from './GradeButtons.vue';

describe('GradeButtons.vue', () => {
  it('renders the four grades with keyboard and swipe hints', () => {
    const wrapper = mount(GradeButtons);
    const buttons = wrapper.findAll('button');
    expect(buttons.map((b) => b.find('span').text())).toEqual([
      'AGAIN (1)',
      'HARD (2)',
      'GOOD (3)',
      'EASY (4)'
    ]);
    expect(buttons[0].text()).toContain('Swipe ←');
    expect(buttons[2].text()).toContain('Swipe →');
    expect(buttons[1].text()).toContain('Key 2');
  });

  it('uses the visible label as accessible name and explains the grade in the title', () => {
    const again = mount(GradeButtons).findAll('button')[0];
    expect(again.attributes('aria-label')).toBeUndefined();
    expect(again.attributes('title')).toContain('reset card to level 0');
  });

  it('emits the rating', async () => {
    const wrapper = mount(GradeButtons);
    const buttons = wrapper.findAll('button');
    for (const b of buttons) await b.trigger('click');
    expect(wrapper.emitted('grade')).toEqual([['again'], ['hard'], ['good'], ['easy']]);
  });
});
