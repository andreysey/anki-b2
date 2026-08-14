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
  german_audio: 'anrufen.mp3'
};

vi.mock('../utils/ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/ai')>();
  return {
    ...actual,
    checkOnDeviceSupport: vi.fn().mockResolvedValue(false),
    getCloudKey: vi.fn().mockReturnValue(''),
    setCloudKey: vi.fn(),
    callAI: vi.fn().mockResolvedValue({
      success: true,
      text: 'Grammar analysis result',
      source: 'cloud',
      model: 'gemini-flash-lite-latest'
    })
  };
});

describe('AIAssistant.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders setup badge when no local AI or cloud key is present', async () => {
    vi.spyOn(aiUtils, 'checkOnDeviceSupport').mockResolvedValue(false);
    vi.spyOn(aiUtils, 'getCloudKey').mockReturnValue('');

    const wrapper = mount(AIAssistant, {
      props: { word: mockWord }
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain('Setup Required');
  });

  it('renders active cloud badge when cloud key is available', async () => {
    vi.spyOn(aiUtils, 'checkOnDeviceSupport').mockResolvedValue(false);
    vi.spyOn(aiUtils, 'getCloudKey').mockReturnValue('mock-api-key');

    const wrapper = mount(AIAssistant, {
      props: { word: mockWord }
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain('Gemini Cloud (Active)');
  });

  it('triggers grammar breakdown AI call and supports copy to clipboard', async () => {
    vi.spyOn(aiUtils, 'checkOnDeviceSupport').mockResolvedValue(false);
    vi.spyOn(aiUtils, 'getCloudKey').mockReturnValue('mock-api-key');
    const callAISpy = vi.spyOn(aiUtils, 'callAI').mockResolvedValue({
      success: true,
      text: 'Grammar breakdown answer with German: Das ist ein wichtiges Verb.',
      source: 'cloud',
      model: 'gemini-flash-lite-latest'
    });

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true
    });

    const wrapper = mount(AIAssistant, {
      props: { word: mockWord }
    });

    await new Promise((r) => setTimeout(r, 20));

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Grammar Breakdown'));
    await btn?.trigger('click');

    expect(callAISpy).toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain('Grammar breakdown answer');

    // Test copy button
    const copyBtn = wrapper.find('button[aria-label="Copy text to clipboard"]');
    expect(copyBtn.exists()).toBe(true);
    await copyBtn.trigger('click');
    expect(writeTextSpy).toHaveBeenCalled();
  });

  it('triggers workplace dialogue AI call on button click', async () => {
    vi.spyOn(aiUtils, 'checkOnDeviceSupport').mockResolvedValue(false);
    vi.spyOn(aiUtils, 'getCloudKey').mockReturnValue('mock-api-key');
    const callAISpy = vi.spyOn(aiUtils, 'callAI').mockResolvedValue({
      success: true,
      text: 'Person A: Guten Morgen!\n(Добрий ранок!)',
      source: 'cloud',
      model: 'gemini-flash-lite-latest'
    });

    const wrapper = mount(AIAssistant, {
      props: { word: mockWord }
    });

    await new Promise((r) => setTimeout(r, 20));

    const btn = wrapper.findAll('button').find((b) => b.text().includes('Workplace Dialogue'));
    await btn?.trigger('click');

    expect(callAISpy).toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.text()).toContain('Person A: Guten Morgen!');
  });
});
