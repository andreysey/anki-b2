import DOMPurify from 'dompurify';

const purifier = typeof window !== 'undefined' ? DOMPurify(window) : DOMPurify;
let domParserInstance: DOMParser | null = null;

const getDOMParser = (): DOMParser | null => {
  if (typeof DOMParser === 'undefined') return null;
  if (!domParserInstance) {
    domParserInstance = new DOMParser();
  }
  return domParserInstance;
};

export const sanitizeHtml = (html: string | undefined | null): string => {
  if (!html) return '';
  const cleanScript = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  const formatted = cleanScript
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>');

  const sanitized = purifier.sanitize(`<span>${formatted}</span>`, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'span', 'p', 'br'],
    ALLOWED_ATTR: ['class', 'style', 'title']
  });

  return sanitized.replace(/^<span>/i, '').replace(/<\/span>$/i, '');
};

export const cleanTextForSpeech = (text: string | undefined | null): string => {
  if (!text) return '';
  let plainText = text;
  const parser = getDOMParser();
  if (parser) {
    const doc = parser.parseFromString(text, 'text/html');
    plainText = doc.body.textContent || '';
  } else {
    plainText = text.replace(/<[^>]*>/g, '');
  }
  return plainText
    .replace(/\*{1,2}/g, '')
    .replace(/_{1,2}/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/…/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
};
