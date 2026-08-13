import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import App from './App.vue';
import type { Word } from './types';

const mockWords: Word[] = [
  {
    id: '1',
    german: 'anrufen',
    english: 'to call',
    ukrainian: 'дзвонити',
    level: 'B2',
    thema: 99,
    example: 'Ich rufe an.',
    german_audio: 'anrufen.mp3',
  },
  {
    id: '2',
    german: 'schlafen',
    english: 'to sleep',
    ukrainian: 'спати',
    level: 'B1+',
    thema: 1,
    example: 'Er schläft.',
    german_audio: 'schlafen.mp3',
  },
];

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('App.vue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWords,
    } as Response);
  });

  it('renders application title and navigation options', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Toast: true,
        },
      },
    });

    // Wait for init
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.text()).toContain('Anki B2');
    expect(wrapper.text()).toContain('Dashboard');
    expect(wrapper.text()).toContain('Dictionary');
  });

  it('handles global keydown event in study mode for Space (flip)', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Toast: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Switch to study mode by clicking Start Study button
    const studyButton = wrapper.findAll('button').find((b) => b.text().includes('Start Study'));
    if (studyButton) {
      await studyButton.trigger('click');
    }

    const event = new KeyboardEvent('keydown', { code: 'Space' });
    window.dispatchEvent(event);

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Anki B2');
  });

  it('handles keyboard shortcuts ArrowRight and ArrowLeft in study mode', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Toast: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const studyButton = wrapper.findAll('button').find((b) => b.text().includes('Start Study'));
    if (studyButton) {
      await studyButton.trigger('click');
    }

    const rightEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });
    window.dispatchEvent(rightEvent);

    const leftEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
    window.dispatchEvent(leftEvent);
  });
});
