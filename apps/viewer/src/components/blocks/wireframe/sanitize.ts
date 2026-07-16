import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

export const ALLOWED_TAGS = [
  'a',
  'article',
  'aside',
  'b',
  'blockquote',
  'button',
  'caption',
  'code',
  'col',
  'colgroup',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'header',
  'hr',
  'img',
  'input',
  'label',
  'legend',
  'li',
  'main',
  'nav',
  'ol',
  'option',
  'p',
  'pre',
  'section',
  'select',
  'small',
  'span',
  'strong',
  'summary',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
] as const;

export const ALLOWED_ATTR = [
  'alt',
  'aria-describedby',
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'checked',
  'colspan',
  'disabled',
  'for',
  'id',
  'name',
  'placeholder',
  'role',
  'rowspan',
  'selected',
  'tabindex',
  'title',
  'type',
  'value',
] as const;

const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: [...ALLOWED_ATTR],
  ALLOW_ARIA_ATTR: false,
  ALLOW_DATA_ATTR: false,
  RETURN_TRUSTED_TYPE: false,
};

function applyViewOnlyPolicy(markup: string): string {
  if (!markup || typeof document === 'undefined') {
    return markup;
  }

  const template = document.createElement('template');
  template.innerHTML = markup;

  template.content.querySelectorAll('button, input, textarea, select').forEach((control) => {
    control.setAttribute('disabled', '');
  });

  template.content.querySelectorAll('img').forEach((image) => {
    const placeholder = document.createElement('span');
    const alt = image.getAttribute('alt')?.trim();

    placeholder.className = 'wf-image-placeholder';
    placeholder.setAttribute('role', 'img');
    placeholder.textContent = alt || '이미지 자리표시자';
    image.replaceWith(placeholder);
  });

  return template.innerHTML;
}

export function sanitizeWireframeHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, SANITIZE_CONFIG);

  return applyViewOnlyPolicy(sanitized);
}
