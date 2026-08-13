import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string | undefined | null): string => {
  if (!html) return '';
  const cleanedInput = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  const formatted = cleanedInput
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>');
  const purifier = typeof window !== 'undefined' ? DOMPurify(window) : DOMPurify;
  const sanitized = purifier.sanitize(`<span>${formatted}</span>`, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'span', 'p', 'br'],
    ALLOWED_ATTR: ['class', 'style', 'title']
  });
  return sanitized.replace(/^<span>/i, '').replace(/<\/span>$/i, '');
};

export const cleanTextForSpeech = (text: string | undefined | null): string => {
  if (!text) return '';
  let plainText = text;
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(text, 'text/html');
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
