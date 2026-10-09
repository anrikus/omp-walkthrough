import type { MountContext, OnScreenItem } from '../../engine/types';
import { dateStamp, gradeBadge, recreationLabel } from '../../kit/cards';
import { ease } from '../../kit/motion';
import '../../kit/kit.css';
import './scene.css';

export type SceneLayout = 'full' | 'split' | 'stack' | 'terminal-focus';

export interface SceneFrameOptions {
  title: string;
  eyebrow?: string;
  layout?: SceneLayout;
  date?: string;
  recreation?: 'defaults' | 'mixed-providers';
}

export interface SceneFrame {
  el: HTMLElement;
  header: HTMLElement;
  title: HTMLHeadingElement;
  visual: HTMLElement;
  aside: HTMLElement | null;
  footer: HTMLElement;
  notes: HTMLElement;
  stamps: HTMLElement;
}

export function sceneFrame(stage: HTMLElement, opts: SceneFrameOptions): SceneFrame {
  const layout = opts.layout ?? 'full';
  const el = document.createElement('section');
  el.className = `scene-frame scene-frame--${layout}`;

  const header = document.createElement('header');
  header.className = 'scene-header';
  const heading = document.createElement('div');
  heading.className = 'scene-heading';
  if (opts.eyebrow !== undefined) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'scene-eyebrow';
    eyebrow.textContent = opts.eyebrow;
    heading.append(eyebrow);
  }
  const title = document.createElement('h2');
  title.className = 'scene-title';
  title.textContent = opts.title;
  heading.append(title);

  const stamps = document.createElement('div');
  stamps.className = 'scene-stamps';
  if (opts.date !== undefined) stamps.append(dateStamp(opts.date).el);
  header.append(heading, stamps);

  const body = document.createElement('div');
  body.className = 'scene-body';
  const visual = document.createElement('div');
  visual.className = 'scene-visual';
  if (opts.recreation !== undefined) {
    const label = opts.recreation === 'mixed-providers'
      ? 'omp 18.8.6 defaults · illustrative model roles, not an endorsement'
      : 'omp 18.8.6 defaults';
    visual.append(recreationLabel(label).el);
  }
  body.append(visual);

  let aside: HTMLElement | null = null;
  if (layout !== 'full') {
    aside = document.createElement('aside');
    aside.className = 'scene-aside';
    body.append(aside);
  }

  const footer = document.createElement('footer');
  footer.className = 'scene-footer';
  const notes = document.createElement('div');
  notes.className = 'scene-notes';
  footer.append(notes);
  el.append(header, body, footer);
  stage.append(el);
  return { el, header, title, visual, aside, footer, notes, stamps };
}

export function withEvidence(el: HTMLElement, item: OnScreenItem, ctx: MountContext): HTMLElement | null {
  const hasReferences = item.claims.length > 0 || (item.sources?.length ?? 0) > 0;
  if (!item.grade && !hasReferences) return null;

  const row = document.createElement('div');
  row.className = 'scene-evidence';
  if (item.grade) row.append(gradeBadge(item.grade).el);
  if (hasReferences) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene-evidence-button';
    button.textContent = 'Evidence';
    button.setAttribute('aria-label', `Evidence for ${item.text}`);
    ctx.cite(button, { claims: item.claims, sources: item.sources });
    row.append(button);
  }
  el.append(row);
  return row;
}

export function reveal(el: HTMLElement, p: number, reducedMotion: boolean): void {
  const progress = reducedMotion ? 1 : ease(p);
  el.style.opacity = String(progress);
  el.style.transform = reducedMotion ? 'none' : `translateY(${16 * (1 - progress)}px)`;
}
