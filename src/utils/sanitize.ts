import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string | undefined | null): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html);
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
    .replace(/[*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

