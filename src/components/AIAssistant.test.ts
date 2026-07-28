import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AIAssistant from './AIAssistant.vue';
import type { Word } from '../types';
import * as aiUtils from '../utils/ai';

const mockWord: Word = {
  id: '1',
  german: 'anrufen',
  english: 'to call',
  ukrainian: 'дзвонити',
  level: 'B2',
  thema: 99,
  example: 'Ich rufe an.',
  german_audio: 'anrufen.mp3',
};

vi.mock('../utils/ai', () => ({
  checkOnDeviceSupport: vi.fn().mockResolvedValue(false),
  getCloudKey: vi.fn().mockReturnValue(''),
  setCloudKey: vi.fn(),
  callAI: vi.fn().mockResolvedValue({
    text: 'Grammar analysis result',
    source: 'cloud',
  }),
}));

describe('AIAssistant.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders setup badge when no local AI or cloud key is present', async () => {
    vi.spyOn(aiUtils, 'checkOnDeviceSupport').mockResolvedValue(false);
    vi.spyOn(aiUtils, 'getCloudKey').mockReturnValue('');

    const wrapper = mount(AIAssistant, {
      props: { word: mockWord },
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain('Setup Required');
  });

  it('renders active cloud badge when cloud key is available', async () => {
    vi.spyOn(aiUtils, 'checkOnDeviceSupport').mockResolvedValue(false);
    vi.spyOn(aiUtils, 'getCloudKey').mockReturnValue('mock-api-key');

    const wrapper = mount(AIAssistant, {
      props: { word: mockWord },
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain('Gemini Cloud (Active)');
  });

  it('triggers grammar breakdown AI call on button click', async () => {
    vi.spyOn(aiUtils, 'checkOnDeviceSupport').mockResolvedValue(false);
    vi.spyOn(aiUtils, 'getCloudKey').mockReturnValue('mock-api-key');
    const callAISpy = vi.spyOn(aiUtils, 'callAI').mockResolvedValue({
      text: 'Grammar breakdown answer',
      source: 'cloud',
    });

    const wrapper = mount(AIAssistant, {
      props: { word: mockWord },
    });

    await new Promise((r) => setTimeout(r, 20));

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Grammar Breakdown'));
    await btn?.trigger('click');

    expect(callAISpy).toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain('Grammar breakdown answer');
  });

  it('triggers workplace dialogue AI call on button click', async () => {
    vi.spyOn(aiUtils, 'checkOnDeviceSupport').mockResolvedValue(false);
    vi.spyOn(aiUtils, 'getCloudKey').mockReturnValue('mock-api-key');
    const callAISpy = vi.spyOn(aiUtils, 'callAI').mockResolvedValue({
      text: 'Dialogue answer',
      source: 'cloud',
    });

    const wrapper = mount(AIAssistant, {
      props: { word: mockWord },
    });

    await new Promise((r) => setTimeout(r, 20));

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Workplace Dialogue'));
    await btn?.trigger('click');

    expect(callAISpy).toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain('Dialogue answer');
  });
});
