import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AIStatusBadge from './AIStatusBadge.vue';

const base = { hasNano: false, hasLocalModel: false, resultModel: '', hasCloudKey: false };

describe('AIStatusBadge.vue', () => {
  it.each([
    [{ hasNano: true, hasCloudKey: true }, 'Gemini Nano'],
    [{ hasLocalModel: true, hasCloudKey: true }, 'Local AI (Offline)'],
    [{ resultModel: 'gemini-flash-lite-latest', hasCloudKey: true }, 'gemini-flash-lite-latest'],
    [{ hasCloudKey: true }, 'Gemini Cloud (Active)'],
    [{}, 'Setup Required']
  ])('shows the first available backend (%o)', (props, label) => {
    const wrapper = mount(AIStatusBadge, { props: { ...base, ...props } });
    expect(wrapper.text()).toBe(label);
  });

  it('explains the active model in a tooltip', () => {
    const wrapper = mount(AIStatusBadge, { props: { ...base, resultModel: 'm1' } });
    expect(wrapper.attributes('title')).toBe('Active model: m1');
  });
});
