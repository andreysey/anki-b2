import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string | undefined | null): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html);
};
