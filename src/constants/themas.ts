export const THEMA_NUMBERS = {
  VERBEN: 99,
  PRAEPOSITIONEN: 98,
  ADJEKTIVE: 97,
  NOMEN_VERB: 96,
  REDEMITTEL: 95
} as const;

export const SPECIAL_THEMAS: Readonly<Record<number, string>> = {
  [THEMA_NUMBERS.VERBEN]: 'Unregelmäßige Verben',
  [THEMA_NUMBERS.PRAEPOSITIONEN]: 'Verben mit Präpositionen',
  [THEMA_NUMBERS.ADJEKTIVE]: 'Adjektive mit Präpositionen',
  [THEMA_NUMBERS.NOMEN_VERB]: 'Nomen-Verb-Verbindungen',
  [THEMA_NUMBERS.REDEMITTEL]: 'Redemittel'
} as const;

export const getThemaLabel = (thema: number): string => {
  return SPECIAL_THEMAS[thema] ?? `Theme ${thema}`;
};
