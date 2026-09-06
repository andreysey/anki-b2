/**
 * verb-grammar.ts — Verb Conjugation & B2 Tense Generator for Anki cards.
 *
 * Generates 10 essential German B2 time and mood forms with consistent context:
 * 1. Präsens
 * 2. Präteritum
 * 3. Perfekt
 * 4. Plusquamperfekt
 * 5. Futur I
 * 6. Futur II (Vermutung)
 * 7. Passiv (Vorgangspassiv)
 * 8. Passiversatz (sich lassen / sein zu)
 * 9. Konjunktiv I (Indirekte Rede)
 * 10. Konjunktiv II (Gegenwart & Vergangenheit)
 */

export interface TenseEntry {
  name: string;
  code: string;
  sentence: string;
}

const SEP_PREFIXES = [
  'zurück',
  'zusammen',
  'weiter',
  'wieder',
  'vorbei',
  'hinweg',
  'entgegen',
  'durch',
  'unter',
  'über',
  'um',
  'ab',
  'an',
  'auf',
  'aus',
  'bei',
  'dar',
  'ein',
  'fest',
  'fort',
  'frei',
  'gegen',
  'heim',
  'her',
  'hin',
  'los',
  'mit',
  'nach',
  'nieder',
  'vor',
  'weg',
  'zu'
];

/**
 * Parses German verb string with principal forms in parentheses.
 * e.g. "etw. anfordern (fordert an, forderte an, hat angefordert)"
 */
export function buildVerbTenses(fullGerman: string, example: string = ''): TenseEntry[] | null {
  if (!fullGerman) return null;

  // Verb with forms: (3.Sg.Präsens, 3.Sg.Präteritum, hat/ist Partizip II)
  const parenMatch = fullGerman.match(
    /\(([^()]+,\s*[^()]+,\s*(?:hat|ist|hat\/ist)\s+[^()]+)\)$/
  );
  if (!parenMatch) return null;

  const parts = parenMatch[1].split(',').map((s) => s.trim());
  if (parts.length < 3) return null;

  const prasens3sg = parts[0];
  const prateritum3sg = parts[1];
  const auxMatch = parts[2].match(/^(hat\/ist|hat|ist)\s+(.+)$/);
  if (!auxMatch) return null;

  const isSein = auxMatch[1].includes('ist') && !auxMatch[1].includes('hat');
  const p2 = auxMatch[2].replace(/^sich\s+/i, '').trim();

  const beforeParens = fullGerman.replace(/\s*\([^)]*\)$/, '').trim();
  const isReflexive = /^sich\s+/i.test(beforeParens) || prasens3sg.includes('sich');

  const cleanedBeforeParens = beforeParens
    .replace(/^(?:etw\.|jdn\.|jdm\.|jds\.)(?:\/(?:etw\.|jdn\.|jdm\.|jds\.))?\s+/i, '')
    .replace(/^sich\s+/i, '')
    .replace(/(?:^|\s)(?:an|auf|aus|bei|für|in|mit|nach|über|um|unter|von|vor|zu)\s*\(\+[^)]+\)/gi, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .replace(/\|/g, '');

  const words = cleanedBeforeParens.split(/\s+/).filter(Boolean);
  const infinitive = words[words.length - 1];

  if (!infinitive || infinitive.length < 3) return null;

  // Detect separable prefix (verified against 3sg form: if separated, 3sg ends with prefix e.g. "führt durch")
  let prefix = '';
  let baseVerb = infinitive;
  for (const sp of SEP_PREFIXES) {
    if (infinitive.startsWith(sp) && infinitive.length >= sp.length + 3) {
      // Check if it really separates in Präsens (e.g. "führt durch" vs "überweist")
      const words = prasens3sg.split(/\s+/);
      if (words.length > 1 && words[words.length - 1] === sp) {
        prefix = sp;
        baseVerb = infinitive.slice(sp.length);
        break;
      } else if (!['durch', 'über', 'unter', 'um', 'wieder'].includes(sp)) {
        // Pure separable prefixes (ab, an, auf, etc.)
        prefix = sp;
        baseVerb = infinitive.slice(sp.length);
        break;
      }
    }
  }

  // zu + infinitive
  const zuInf = prefix ? `${prefix}zu${baseVerb}` : `zu ${infinitive}`;

  // Konjunktiv 1 (3. Sg: baseVerb Stamm + e)
  let konj1Stem = baseVerb.replace(/en$/, 'e').replace(/n$/, 'e');
  if (baseVerb === 'sein') konj1Stem = 'sei';

  // Auxiliary forms for 3. Sg.
  const auxHatIst = isSein ? 'ist' : 'hat';
  const auxHatteWar = isSein ? 'war' : 'hatte';
  const auxInf = isSein ? 'sein' : 'haben';
  const auxKonj2 = isSein ? 'wäre' : 'hätte';

  // Extract contextual object/theme for unified comparison
  let obj = '';
  let subject = 'Er';

  const prepMatch = fullGerman.match(
    /(?:^|\s)(um|auf|an|für|über|zu|mit|von|in)\s+\(\+?\s*(?:Akk\.|Dat\.)\)/i
  );

  if (isReflexive) {
    if (prepMatch) {
      const prep = prepMatch[1].toLowerCase();
      if (prep === 'um') obj = 'um die Stelle';
      else if (prep === 'auf') obj = 'auf den Termin';
      else if (prep === 'an') obj = 'an das Projekt';
      else if (prep === 'für') obj = 'für das Angebot';
      else if (prep === 'über') obj = 'über den Bericht';
      else if (prep === 'zu') obj = 'zur Besprechung';
      else if (prep === 'mit') obj = 'mit den Kollegen';
      else if (prep === 'von') obj = 'vom Plan';
      else if (prep === 'in') obj = 'in die Arbeit';
    } else if (/sich\s+(?:etw\.|jdn\.)/i.test(fullGerman) || /(?:etw\.|jdn\.)\s+sich/i.test(fullGerman)) {
      obj = 'das Dokument';
    } else {
      obj = '';
    }
  } else if (isSein) {
    // Intransitive / motion / state verbs typically don't have an Akkusativ object
    if (example.includes('Zug')) {
      subject = 'Der Zug';
      obj = 'pünktlich';
    } else if (example.includes('Bus')) {
      subject = 'Der Bus';
      obj = 'rechtzeitig';
    } else {
      subject = 'Er';
      obj = 'rechtzeitig';
    }
  } else {
    if (prepMatch) {
      const prep = prepMatch[1].toLowerCase();
      if (prep === 'um') obj = 'um die Stelle';
      else if (prep === 'auf') obj = 'auf den Fehler';
      else if (prep === 'an') obj = 'an das Vorhaben';
      else if (prep === 'für') obj = 'für die Lösung';
      else if (prep === 'über') obj = 'über den Bericht';
      else if (prep === 'zu') obj = 'zur Besprechung';
      else if (prep === 'mit') obj = 'mit den Partnern';
      else if (prep === 'von') obj = 'vom Plan';
      else if (prep === 'in') obj = 'in den Prozess';
    } else if (fullGerman.includes('Angebot') || example.includes('Angebot')) {
      obj = 'das Angebot';
    } else if (fullGerman.includes('Termin') || example.includes('Termin')) {
      obj = 'den Termin';
    } else if (fullGerman.includes('Prüfung') || example.includes('Prüfung')) {
      obj = 'die Prüfung';
    } else if (fullGerman.includes('Bericht') || example.includes('Bericht')) {
      obj = 'den Bericht';
    } else if (fullGerman.includes('Projekt') || example.includes('Projekt')) {
      obj = 'das Projekt';
    } else {
      obj = 'das Dokument';
    }
  }

  // Helper clean function for uniform spacing
  const clean = (s: string) =>
    s
      .replace(/\s+/g, ' ')
      .replace(/\s+([.,;:])/g, '$1')
      .trim();

  // Normalize 3sg form without stray 'sich' in stem for flexible positioning
  const purePrasens3sg = prasens3sg.replace(/^sich\s+/i, '').replace(/\s+sich$/i, '');
  const purePrateritum3sg = prateritum3sg.replace(/^sich\s+/i, '').replace(/\s+sich$/i, '');

  // 1. Präsens
  let praesSentence = '';
  if (isReflexive) {
    if (prefix && purePrasens3sg.includes(prefix)) {
      const stemPart = purePrasens3sg.replace(new RegExp(`\\s*${prefix}$`), '');
      praesSentence = `${subject} ${stemPart} sich ${obj} ${prefix}.`;
    } else {
      praesSentence = `${subject} ${purePrasens3sg} sich ${obj}.`;
    }
  } else if (prefix && purePrasens3sg.includes(prefix)) {
    const stemPart = purePrasens3sg.replace(new RegExp(`\\s*${prefix}$`), '');
    praesSentence = `${subject} ${stemPart} ${obj} ${prefix}.`;
  } else {
    praesSentence = `${subject} ${purePrasens3sg} ${obj}.`;
  }

  // 2. Präteritum
  const invertedSubject = subject === 'Er' ? 'er' : subject.startsWith('Der ') ? 'der ' + subject.slice(4) : subject;
  let praetSentence = '';
  if (isReflexive) {
    if (prefix && purePrateritum3sg.includes(prefix)) {
      const stemPart = purePrateritum3sg.replace(new RegExp(`\\s*${prefix}$`), '');
      praetSentence = `Gestern ${stemPart} ${invertedSubject} sich ${obj} ${prefix}.`;
    } else {
      praetSentence = `Gestern ${purePrateritum3sg} ${invertedSubject} sich ${obj}.`;
    }
  } else if (prefix && purePrateritum3sg.includes(prefix)) {
    const stemPart = purePrateritum3sg.replace(new RegExp(`\\s*${prefix}$`), '');
    praetSentence = `Gestern ${stemPart} ${invertedSubject} ${obj} ${prefix}.`;
  } else {
    praetSentence = `Gestern ${purePrateritum3sg} ${invertedSubject} ${obj}.`;
  }

  // 3. Perfekt
  const perfSentence = isReflexive
    ? `${subject} ${auxHatIst} sich ${obj} ${p2}.`
    : `${subject} ${auxHatIst} ${obj} ${p2}.`;

  // 4. Plusquamperfekt
  const plusqSentence = isReflexive
    ? `${subject} ${auxHatteWar} sich ${obj} ${p2}.`
    : `${subject} ${auxHatteWar} ${obj} ${p2}.`;

  // 5. Futur I
  const fut1Sentence = isReflexive
    ? `${subject} wird sich ${obj} ${infinitive}.`
    : `${subject} wird ${obj} ${infinitive}.`;

  // 6. Futur II (Vermutung)
  const fut2Sentence = isReflexive
    ? `${subject} wird sich wohl schon ${obj} ${p2} ${auxInf}.`
    : `${subject} wird wohl schon ${obj} ${p2} ${auxInf}.`;

  // 7. Passiv (Vorgangspassiv)
  let passivSentence = '';
  if (isReflexive) {
    passivSentence = '(Nicht passivfähig – reflexives Verb)';
  } else if (isSein) {
    passivSentence = '(Nicht passivfähig – intransitives Verb)';
  } else {
    const passivSubject = obj
      ? obj.startsWith('den ')
        ? 'Der ' + obj.slice(4)
        : obj[0].toUpperCase() + obj.slice(1)
      : 'Es';
    passivSentence = `${passivSubject} wird / wurde ${p2}.`;
  }

  // 8. Passiversatz (sich lassen / sein zu)
  let passivErsatzSentence = '';
  if (isReflexive) {
    passivErsatzSentence = '(Kein Passiversatz – reflexives Verb)';
  } else if (isSein) {
    passivErsatzSentence = '(Kein Passiversatz – intransitives Verb)';
  } else {
    const passivSubject = obj
      ? obj.startsWith('den ')
        ? 'Der ' + obj.slice(4)
        : obj[0].toUpperCase() + obj.slice(1)
      : 'Es';
    passivErsatzSentence = `${passivSubject} lässt sich ${infinitive} · ist ${zuInf}.`;
  }

  // 9. Konjunktiv I (Indirekte Rede)
  let konj1Sentence = '';
  if (isReflexive) {
    if (prefix) {
      konj1Sentence = `Er sagte, er ${konj1Stem} sich ${obj} ${prefix}.`;
    } else {
      konj1Sentence = `Er sagte, er ${konj1Stem} sich ${obj}.`;
    }
  } else if (prefix) {
    konj1Sentence = `Er sagte, er ${konj1Stem} ${obj} ${prefix}.`;
  } else {
    konj1Sentence = `Er sagte, er ${konj1Stem} ${obj}.`;
  }

  // 10. Konjunktiv II (Gegenwart & Vergangenheit)
  const konj2Sentence = isReflexive
    ? `${subject} würde sich ${obj} ${infinitive} · ${auxKonj2} sich ${p2}.`
    : `${subject} würde ${obj} ${infinitive} · ${auxKonj2} ${obj} ${p2}.`;

  return [
    { name: 'Präsens', code: 'praes', sentence: clean(praesSentence) },
    { name: 'Präteritum', code: 'praet', sentence: clean(praetSentence) },
    { name: 'Perfekt', code: 'perf', sentence: clean(perfSentence) },
    { name: 'Plusquamperfekt', code: 'plusq', sentence: clean(plusqSentence) },
    { name: 'Futur I', code: 'fut1', sentence: clean(fut1Sentence) },
    { name: 'Futur II (Vermutung)', code: 'fut2', sentence: clean(fut2Sentence) },
    { name: 'Passiv', code: 'pass', sentence: clean(passivSentence) },
    { name: 'Passiversatz', code: 'pass-alt', sentence: clean(passivErsatzSentence) },
    { name: 'Konjunktiv I', code: 'konj1', sentence: clean(konj1Sentence) },
    { name: 'Konjunktiv II', code: 'konj2', sentence: clean(konj2Sentence) }
  ];
}

/**
 * Formats TenseEntry array into clean, pre-styled HTML for Anki note cards.
 */
export function formatTensesHtml(tenses: TenseEntry[] | null): string {
  if (!tenses || tenses.length === 0) return '';

  const rows = tenses
    .map(
      (t) =>
        `<div class="tense-row"><span class="badge ${t.code}">${t.name}</span><span class="tense-text">${t.sentence}</span></div>`
    )
    .join('');

  return `<details class="tense-spoiler"><summary class="tense-summary">⏱️ Zeitformen & Grammatik ▾</summary><div class="tense-grid">${rows}</div></details>`;
}
