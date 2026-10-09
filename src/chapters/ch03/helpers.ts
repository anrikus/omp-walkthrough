import type { MountContext, RenderContext } from '../../engine/types';
import type { ChartComponent } from '../../kit/charts';
import { withEvidence } from '../shared/scene';

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function evidence(ctx: MountContext, id: string): HTMLElement {
  const item = ctx.onScreen(id);
  const el = element('section', 'ch03-evidence-copy');
  el.dataset.onScreen = id;
  el.append(element('p', '', item.text));
  withEvidence(el, item, ctx);
  return el;
}

export function normalizeChart<T extends Element>(chart: ChartComponent<T>): ChartComponent<T> {
  for (const text of chart.el.querySelectorAll('text')) {
    if (Number(text.getAttribute('font-size')) < 22) text.setAttribute('font-size', '22');
  }
  return chart;
}

export function layer(parent: HTMLElement, className = ''): HTMLElement {
  const el = element('div', `ch03-layer ${className}`);
  parent.append(el);
  return el;
}

export function showLayer(el: HTMLElement, ctx: RenderContext, startSentence: string, endSentence?: string): void {
  const visible = ctx.t >= ctx.sentence(startSentence).start
    && (endSentence === undefined || ctx.t < ctx.sentence(endSentence).start);
  el.style.opacity = visible ? '1' : '0';
  el.toggleAttribute('inert', !visible);
  el.setAttribute('aria-hidden', String(!visible));
}

export function progress(ctx: RenderContext, id: string): number {
  return ctx.reducedMotion ? 1 : Math.min(1, ctx.progress(id) * 2.5);
}
