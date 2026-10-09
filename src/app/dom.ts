export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function button(text: string, action: () => void, className = ''): HTMLButtonElement {
  const el = element('button', className, text);
  el.type = 'button';
  el.addEventListener('click', action);
  return el;
}

export function link(text: string, href: string, className = ''): HTMLAnchorElement {
  const isWebUrl = /^https?:\/\//.test(href);
  if (!href.startsWith('#') && !isWebUrl) throw new Error(`Unsupported link destination: ${href}. Use a hash route or an http(s) URL.`);
  const el = element('a', className, text);
  el.href = href;
  if (isWebUrl) {
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  }
  return el;
}
