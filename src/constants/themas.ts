export const SPECIAL_THEMAS: Readonly<Record<number, string>> = {
  99: 'Unregelmäßige Verben',
  98: 'Verben mit Präpositionen',
  97: 'Adjektive mit Präpositionen',
  96: 'Nomen-Verb-Verbindungen',
  95: 'Redemittel',
} as const;

export const getThemaLabel = (thema: number): string => {
  return SPECIAL_THEMAS[thema] ?? `Theme ${thema}`;
};
