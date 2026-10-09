import { clamp } from './motion';

export interface CardComponent<T extends HTMLElement = HTMLElement> {
  el: T;
  render(progress: number, reducedMotion?: boolean): void;
}

export interface StatCardOptions {
  value: string;
  label: string;
  condition: string;
  note?: string;
}

export interface QuoteCardOptions {
  quote: string;
  attribution: string;
  context?: string;
}

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export interface GradeBadgeComponent extends CardComponent<HTMLSpanElement> {}
export interface DateStampComponent extends CardComponent<HTMLTimeElement> {}
export interface RecreationLabelComponent extends CardComponent<HTMLSpanElement> {}
export interface StatCardComponent extends CardComponent<HTMLElement> {}
export interface QuoteCardComponent extends CardComponent<HTMLElement> {}

const gradeLabels: Record<EvidenceGrade, string> = {
  A: 'Peer-reviewed',
  B: 'Preprint/tech report',
  C: 'First-party',
  D: 'Secondary',
  E: 'Anecdotal',
};

function part<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

function card<T extends HTMLElement>(el: T): CardComponent<T> {
  const render = (progress: number, reducedMotion = false): void => {
    el.style.opacity = String(reducedMotion ? 1 : clamp(progress));
  };
  render(1);
  return { el, render };
}

export function statCard(options: StatCardOptions): StatCardComponent {
  const el = document.createElement('section');
  el.className = 'kit-stat';
  el.setAttribute('aria-label', `${options.label}: ${options.value}. ${options.condition}`);
  el.append(
    part('p', 'kit-stat-value', options.value),
    part('h3', 'kit-stat-label', options.label),
    part('p', 'kit-stat-condition', options.condition),
  );
  if (options.note) el.append(part('p', 'kit-stat-note', options.note));
  return card(el);
}

export function quoteCard(options: QuoteCardOptions): QuoteCardComponent {
  const el = document.createElement('figure');
  el.className = 'kit-quote';
  el.append(
    part('blockquote', 'kit-quote-text', options.quote),
    part('figcaption', 'kit-quote-attribution', options.attribution),
  );
  if (options.context) el.append(part('p', 'kit-quote-context', options.context));
  return card(el);
}

export function gradeBadge(grade: EvidenceGrade): GradeBadgeComponent {
  const label = gradeLabels[grade];
  if (!label) throw new RangeError(`Unknown evidence grade: ${String(grade)}`);
  const el = document.createElement('span');
  el.className = 'kit-grade';
  el.dataset.grade = grade;
  el.append(part('span', 'kit-grade-letter', grade), part('span', 'kit-grade-label', label));
  return card(el);
}

export function dateStamp(date: string): DateStampComponent {
  const el = part('time', 'kit-date', `As of ${date}`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) el.dateTime = date;
  return card(el);
}

export function recreationLabel(label = 'omp 18.8.6 defaults'): RecreationLabelComponent {
  return card(part('span', 'kit-recreation', `Recreation · ${label}`));
}
