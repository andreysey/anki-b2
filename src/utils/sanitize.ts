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

const sanitizeStyleAttribute = (styleValue: string): string => {
  const safeDeclarations = styleValue
    .split(';')
    .map((decl) => decl.trim())
    .filter((decl) => /^color\s*:\s*[^;]+$/i.test(decl));
  return safeDeclarations.length ? `${safeDeclarations.join('; ')};` : '';
};

purifier.addHook('afterSanitizeAttributes', (node) => {
  if (!node || typeof (node as Element).querySelectorAll !== 'function') return;
  const element = node as Element;
  if (element.hasAttribute && element.hasAttribute('style')) {
    const safeStyle = sanitizeStyleAttribute(element.getAttribute('style') || '');
    if (safeStyle) {
      element.setAttribute('style', safeStyle);
    } else {
      element.removeAttribute('style');
    }
  }
  const styledDescendants = element.querySelectorAll('[style]');
  styledDescendants.forEach((child) => {
    const safeStyle = sanitizeStyleAttribute(child.getAttribute('style') || '');
    if (safeStyle) {
      child.setAttribute('style', safeStyle);
    } else {
      child.removeAttribute('style');
    }
  });
});

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

export const sanitizeAiHtml = (text: string | undefined | null): string => {
  if (!text) return '';
  const cleanScript = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s*style\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');

  // Process basic markdown lists line by line
  const lines = cleanScript.split('\n');
  const formattedLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const listMatch = trimmed.match(/^[-*•]\s+(.+)$/);

    if (listMatch) {
      if (!inList) {
        formattedLines.push('<ul class="list-disc pl-4 space-y-0.5 my-1">');
        inList = true;
      }
      formattedLines.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }
      formattedLines.push(line);
    }
  }

  if (inList) {
    formattedLines.push('</ul>');
  }

  const formatted = formattedLines
    .join('\n')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>'
    );

  // Strictly forbid the style attribute to prevent CSS injection / UI spoofing
  const sanitized = purifier.sanitize(`<span>${formatted}</span>`, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'span', 'p', 'br', 'code', 'pre', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class', 'title']
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
