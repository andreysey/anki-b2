// How to install a German text-to-speech voice, per OS. Pronunciation uses the
// browser's built-in voices (Web Speech API), which come from the operating system.
import { detectEnvironment, type HelpPlatform } from './webgpuHelp';

export interface VoiceHelp {
  label: string;
  steps: string[];
}

const RESTART = 'Restart the browser afterwards.';

const STEPS: Record<HelpPlatform, string[]> = {
  windows: [
    'Settings → Time & language → Speech → Add voices → German (Germany).',
    RESTART,
    'Microsoft Edge also includes natural-sounding German voices out of the box.'
  ],
  macos: [
    'System Settings → Accessibility → Spoken Content → System voice → Manage Voices → German.',
    RESTART
  ],
  linux: [
    'Most reliable: Google Chrome — it has German voices built in ("Google Deutsch").',
    'Firefox and other browsers rely on system voices: install speech-dispatcher and espeak-ng (e.g. "sudo dnf install speech-dispatcher espeak-ng"), run "systemctl --user enable --now speech-dispatcher.socket" and restart the browser. Sandboxed (Flatpak/Snap) builds may still not reach them.',
    'Brave and Chromium installed as Flatpak have no voices at all — use Chrome for pronunciation.'
  ],
  chromeos: ['Settings → Accessibility → Text-to-Speech → Voice settings → add a German voice.'],
  android: [
    'Settings → Text-to-speech output → Google speech services → Install voice data → German.'
  ],
  ios: ['Settings → Accessibility → Spoken Content → Voices → German.'],
  other: ['Install a German text-to-speech voice in your system settings.', RESTART]
};

const LABELS: Record<HelpPlatform, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  chromeos: 'ChromeOS',
  android: 'Android',
  ios: 'iPhone / iPad',
  other: 'your system'
};

export function getGermanVoiceHelp(
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): VoiceHelp {
  const { platform } = detectEnvironment(userAgent);
  return { label: LABELS[platform], steps: STEPS[platform] };
}
