import { describe, it, expect } from 'vitest';
import { getGermanVoiceHelp } from './voiceHelp';

const UA = {
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0 Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
  linux: 'Mozilla/5.0 (X11; Linux x86_64; rv:159.0) Gecko/20100101 Firefox/159.0',
  android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/156.0 Mobile Safari/537.36',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
};

describe('getGermanVoiceHelp', () => {
  it.each([
    [UA.windows, 'Windows', 'Add voices'],
    [UA.mac, 'macOS', 'Spoken Content'],
    [UA.linux, 'Linux', 'speech-dispatcher.socket'],
    [UA.android, 'Android', 'Google speech services'],
    [UA.iphone, 'iPhone / iPad', 'Spoken Content']
  ])('gives platform-specific steps', (ua, label, hint) => {
    const help = getGermanVoiceHelp(ua);
    expect(help.label).toBe(label);
    expect(help.steps.join(' ')).toContain(hint);
  });

  it('falls back to generic steps', () => {
    expect(getGermanVoiceHelp('UnknownBot/1.0').label).toBe('your system');
  });
});
