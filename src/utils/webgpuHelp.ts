// Short, platform-specific tips shown when local AI (WebGPU) isn't available.
// The full guide lives in LOCAL_AI_GUIDE.md.

export const LOCAL_AI_GUIDE_URL =
  'https://github.com/andreysey/anki-b2/blob/main/LOCAL_AI_GUIDE.md';

export type HelpPlatform = 'windows' | 'macos' | 'linux' | 'chromeos' | 'android' | 'ios' | 'other';
export type HelpBrowser = 'chromium' | 'firefox' | 'safari' | 'other';

export interface WebGPUHelp {
  label: string;
  steps: string[];
}

const PLATFORM_LABELS: Record<HelpPlatform, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  chromeos: 'ChromeOS',
  android: 'Android',
  ios: 'iPhone / iPad',
  other: 'your system'
};

const BROWSER_LABELS: Record<HelpBrowser, string> = {
  chromium: 'Chrome',
  firefox: 'Firefox',
  safari: 'Safari',
  other: 'your browser'
};

export function detectEnvironment(userAgent: string): {
  platform: HelpPlatform;
  browser: HelpBrowser;
} {
  const ua = userAgent;
  const platform: HelpPlatform = /iPhone|iPad|iPod/.test(ua)
    ? 'ios'
    : /Android/.test(ua)
      ? 'android'
      : /CrOS/.test(ua)
        ? 'chromeos'
        : /Windows/.test(ua)
          ? 'windows'
          : /Macintosh|Mac OS X/.test(ua)
            ? 'macos'
            : /Linux/.test(ua)
              ? 'linux'
              : 'other';

  const browser: HelpBrowser = /Firefox|FxiOS/.test(ua)
    ? 'firefox'
    : /Chrome|Chromium|CriOS|Edg\//.test(ua)
      ? 'chromium'
      : /Safari/.test(ua)
        ? 'safari'
        : 'other';

  return { platform, browser };
}

const ENABLE_ACCELERATION =
  'Browser settings → System → turn on "Use graphics acceleration when available", then restart.';

function stepsFor(platform: HelpPlatform, browser: HelpBrowser): string[] {
  switch (platform) {
    case 'windows':
      return browser === 'firefox'
        ? ['Update Firefox to version 141 or newer.', 'Update your graphics driver.']
        : [
            'Update your graphics driver (NVIDIA / AMD / Intel or Windows Update).',
            ENABLE_ACCELERATION,
            'Laptop with two GPUs: Settings → System → Display → Graphics → set the browser to "High performance".'
          ];
    case 'macos':
      if (browser === 'safari') return ['Update to Safari 26 or newer, or use Chrome.'];
      if (browser === 'firefox')
        return ['Update Firefox (Apple Silicon Macs are supported), or use Chrome or Safari 26+.'];
      return ['Update the browser.', ENABLE_ACCELERATION];
    case 'linux':
      return browser === 'firefox'
        ? [
            'Firefox supports WebGPU on Linux only in Nightly builds — use Chrome, Chromium or Brave.',
            'Experimental: about:config → dom.webgpu.enabled = true.'
          ]
        : [
            'Open chrome://gpu and check the "WebGPU" line.',
            'Open chrome://flags, enable "Unsafe WebGPU Support" and "Vulkan", then restart.',
            'Laptop with NVIDIA + integrated GPU: start the browser on the NVIDIA card ("Launch using Discrete Graphics Card").'
          ];
    case 'chromeos':
      return ['Update ChromeOS.', ENABLE_ACCELERATION];
    case 'android':
      return [
        'Use Chrome on Android 12 or newer.',
        'Phones often lack the memory for a local model — the cloud API is the safer choice.'
      ];
    case 'ios':
      return [
        'Update to iOS / iPadOS 26 or newer.',
        'Phones often lack the memory for a local model — the cloud API is the safer choice.'
      ];
    default:
      return ['Try the latest Chrome or Edge.'];
  }
}

export function getWebGPUHelp(
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): WebGPUHelp {
  const { platform, browser } = detectEnvironment(userAgent);
  return {
    label: `${BROWSER_LABELS[browser]} on ${PLATFORM_LABELS[platform]}`,
    steps: stepsFor(platform, browser)
  };
}
