import { describe, it, expect } from 'vitest';
import { detectEnvironment, getWebGPUHelp, LOCAL_AI_GUIDE_URL } from './webgpuHelp';

const UA = {
  winChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
  winEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  linuxChrome:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
  linuxFirefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:159.0) Gecko/20100101 Firefox/159.0',
  android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/156.0 Mobile/15E148 Safari/604.1',
  chromebook:
    'Mozilla/5.0 (X11; CrOS x86_64 15000.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'
};

describe('detectEnvironment', () => {
  it.each([
    [UA.winChrome, 'windows', 'chromium'],
    [UA.winEdge, 'windows', 'chromium'],
    [UA.macSafari, 'macos', 'safari'],
    [UA.linuxChrome, 'linux', 'chromium'],
    [UA.linuxFirefox, 'linux', 'firefox'],
    [UA.android, 'android', 'chromium'],
    [UA.iphoneChrome, 'ios', 'chromium'],
    [UA.chromebook, 'chromeos', 'chromium']
  ])('detects %s', (ua, platform, browser) => {
    expect(detectEnvironment(ua)).toEqual({ platform, browser });
  });
});

describe('getWebGPUHelp', () => {
  it('gives Linux Chrome users the flags and dual-GPU tips', () => {
    const help = getWebGPUHelp(UA.linuxChrome);
    expect(help.label).toBe('Chrome on Linux');
    expect(help.steps.join(' ')).toContain('chrome://flags');
    expect(help.steps.join(' ')).toContain('NVIDIA');
  });

  it('points Linux Firefox users to a Chromium browser', () => {
    expect(getWebGPUHelp(UA.linuxFirefox).steps[0]).toContain('Chrome');
  });

  it('suggests updating the driver on Windows', () => {
    expect(getWebGPUHelp(UA.winChrome).steps[0]).toContain('graphics driver');
  });

  it('tells iPhone users to update iOS', () => {
    expect(getWebGPUHelp(UA.iphoneChrome).steps[0]).toContain('iOS');
  });

  it('falls back to a generic tip for unknown browsers', () => {
    expect(getWebGPUHelp('SomeBot/1.0')).toEqual({
      label: 'your browser on your system',
      steps: ['Try the latest Chrome or Edge.']
    });
  });

  it('links to the guide in the repository', () => {
    expect(LOCAL_AI_GUIDE_URL).toMatch(/LOCAL_AI_GUIDE\.md$/);
  });
});
