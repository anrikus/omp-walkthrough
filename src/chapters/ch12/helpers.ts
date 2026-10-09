import type { MountContext, RenderContext, SceneModule } from '../../engine/types';
import { sceneFrame, withEvidence, type SceneFrame } from '../shared/scene';

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function claim(parent: HTMLElement, ctx: MountContext, id: string, className = ''): HTMLElement {
  const item = ctx.onScreen(id);
  const el = element('section', `ch12-claim ${className}`);
  el.dataset.onScreen = id;
  el.append(element('p', 'ch12-claim-text', item.text));
  withEvidence(el, item, ctx);
  parent.append(el);
  return el;
}

export function architectureScene(
  id: string,
  build: (frame: SceneFrame, ctx: MountContext) => (ctx: RenderContext) => void,
): SceneModule {
  let render: ((ctx: RenderContext) => void) | undefined;
  return {
    id,
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('ch12');
      claim(frame.notes, ctx, `${id}.z`, 'ch12-prerelease');
      render = build(frame, ctx);
    },
    render(ctx) { render?.(ctx); },
    unmount() { render = undefined; },
  };
}

export function shape<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}

export function canvas(width: number, height: number, description: string): SVGSVGElement {
  const el = shape('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': description });
  el.classList.add('ch12-diagram');
  const title = shape('title');
  title.textContent = description;
  el.append(title);
  return el;
}

export function text(parent: SVGElement, x: number, y: number, value: string, size = 28, anchor = 'middle'): SVGTextElement {
  const el = shape('text', { x, y, 'font-size': size, 'text-anchor': anchor });
  value.split('\n').forEach((line, index) => {
    const span = shape('tspan', { x, dy: index === 0 ? 0 : size * 1.22 });
    span.textContent = line;
    el.append(span);
  });
  parent.append(el);
  return el;
}

export function box(parent: SVGElement, x: number, y: number, width: number, height: number, title: string, detail = '', kind = ''): SVGGElement {
  const el = shape('g', { class: `ch12-box ${kind}` });
  el.append(shape('rect', { x, y, width, height, rx: 12 }));
  text(el, x + width / 2, y + (detail ? 43 : height / 2 + 9), title, 29);
  if (detail) text(el, x + width / 2, y + 84, detail, 24);
  parent.append(el);
  return el;
}

export function line(parent: SVGElement, x1: number, y1: number, x2: number, y2: number, className = ''): SVGLineElement {
  const el = shape('line', { x1, y1, x2, y2, class: `ch12-line ${className}`, pathLength: 1 });
  parent.append(el);
  return el;
}

export function beat(ctx: RenderContext, sentence: string): number {
  return ctx.reducedMotion ? 1 : ctx.progress(sentence);
}

export function draw(el: SVGElement, progress: number): void {
  el.setAttribute('stroke-dasharray', '1');
  el.setAttribute('stroke-dashoffset', String(1 - Math.min(1, Math.max(0, progress))));
}

export function stagger(progress: number, index: number, count: number): number {
  return Math.min(1, Math.max(0, progress * (count + 1) - index));
}
