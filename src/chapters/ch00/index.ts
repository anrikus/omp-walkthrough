import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { ease, gradeBadge } from '../../kit';
import { sceneFrame, withEvidence, reveal as revealMotion } from '../shared/scene';
import './opening.css';

function reveal(el: HTMLElement, progress: number, reducedMotion: boolean): void {
  revealMotion(el, progress, reducedMotion);
  el.inert = !reducedMotion && progress === 0;
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function item(ctx: MountContext, id: string, className = 'opening-copy'): HTMLElement {
  const content = ctx.onScreen(id);
  const el = node('section', className);
  el.append(node('p', 'opening-item-text', content.text));
  withEvidence(el, content, ctx);
  return el;
}

function beat(ctx: RenderContext, id: string, offset = 0, span = 1): number {
  return ctx.reducedMotion ? 1 : ease(Math.max(0, Math.min(1, (ctx.progress(id) - offset) / span)));
}

interface PairView { el: HTMLElement; render(progress: number): void }
function pair(first: number, second: number, firstLabel: string, secondLabel: string, cis?: [number, number]): PairView {
  const el = node('div', 'opening-pair');
  const fills: HTMLElement[] = [];
  const intervals: HTMLElement[] = [];
  [first, second].forEach((value, i) => {
    const row = node('div', 'opening-bar-row');
    row.append(node('span', 'opening-bar-label', i === 0 ? firstLabel : secondLabel));
    const track = node('div', 'opening-bar-track');
    const fill = node('div', `opening-bar-fill opening-bar-fill--${i}`);
    fill.style.width = `${value}%`;
    fills.push(fill);
    track.append(fill);
    if (cis) {
      const interval = node('div', 'opening-ci');
      interval.style.left = `${value - cis[i]!}%`;
      interval.style.width = `${cis[i]! * 2}%`;
      track.append(interval);
      intervals.push(interval);
    }
    row.append(track, node('span', 'opening-bar-value', `${value.toFixed(1)}%`));
    el.append(row);
  });
  return { el, render(p) {
    fills.forEach(fill => { fill.style.transform = `scaleX(${p})`; });
    intervals.forEach(interval => { interval.style.opacity = String(Math.max(0, (p - 0.8) * 5)); });
  } };
}

function comparison(): SceneModule {
  let rows: HTMLElement[] = [];
  let charts: PairView[] = [];
  let conditions: HTMLElement;
  let closing: HTMLElement;
  return {
    id: '0.1',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, eyebrow: 'Same model. Different machinery.', date: '2026-10-08' });
      frame.el.classList.add('opening-scene');
      const matrix = node('div', 'opening-matrix');
      rows = [];
      charts = [
        pair(15.7, 32.6, 'OpenHands', 'Terminus 2', [2.6, 3]),
        pair(35.2, 49.6, 'Terminus 2', 'Codex CLI', [3.1, 2.9]),
        pair(52.1, 57.8, 'Claude Code', 'Terminus 2', [2.5, 2.5]),
      ];
      ['0.1.a', '0.1.b', '0.1.c'].forEach((id, i) => {
        const row = node('div', 'opening-matrix-row');
        row.append(item(ctx, id, 'opening-matrix-copy'), charts[i]!.el);
        matrix.append(row);
        rows.push(row);
      });
      conditions = item(ctx, '0.1.d', 'opening-conditions');
      frame.visual.append(matrix, conditions);
      closing = node('p', 'opening-footer', "Historical comparisons, not today's product standings.");
      frame.notes.append(node('span', 'opening-scale', 'Success · 0–100% scale · whiskers: reported 95% CIs'), closing);
    },
    render(ctx) {
      rows.forEach((row, i) => {
        const p = beat(ctx, '0.1.1', i * 0.13, 0.45);
        reveal(row, p, ctx.reducedMotion);
        charts[i]!.render(p);
        const emphasis = (i === 1 ? beat(ctx, '0.1.2', 0, 0.4) * (1 - beat(ctx, '0.1.2', 0.55, 0.3)) : i === 2 ? beat(ctx, '0.1.2', 0.55, 0.25) : 0) * (1 - beat(ctx, '0.1.2', 0.85, 0.15));
        row.style.transform = `translate(${ctx.reducedMotion ? 0 : emphasis * 12}px, ${ctx.reducedMotion ? 0 : 16 * (1 - ease(p))}px)`;
      });
      reveal(conditions, beat(ctx, '0.1.1', 0, 0.2), ctx.reducedMotion);
      reveal(closing, beat(ctx, '0.1.3', 0, 0.35), ctx.reducedMotion);
    },
  };
}

function intervention(): SceneModule {
  let ring: HTMLElement;
  let before: HTMLElement;
  let after: HTMLElement;
  let chart: PairView;
  let facts: HTMLElement;
  let takeaway: HTMLElement;
  return {
    id: '0.2',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, eyebrow: 'A controlled historical intervention · 2024 study', layout: 'split', date: '2024' });
      frame.el.classList.add('opening-scene');
      const cutaway = node('div', 'opening-cutaway');
      ring = node('div', 'opening-interface-ring');
      before = node('span', 'opening-interface-label', 'Shell-only interface');
      after = node('span', 'opening-interface-label opening-interface-label--after', 'SWE-agent ACI');
      const core = node('div', 'opening-model-core');
      core.append(node('strong', '', 'GPT-4 Turbo'), node('span', '', 'gpt-4-1106-preview'), node('span', 'opening-core-caption', 'Model weights held fixed'));
      cutaway.append(ring, before, after, core);
      chart = pair(11, 18, 'Shell-only', 'SWE-agent ACI');
      chart.el.classList.add('opening-intervention-bars');
      frame.visual.append(cutaway, chart.el, node('p', 'opening-axis', 'Success on SWE-bench Lite · shared 0–100% scale'));
      facts = item(ctx, '0.2.a', 'opening-study-facts');
      frame.aside!.append(facts);
      takeaway = node('p', 'opening-takeaway', 'The interface changed. The model weights did not.');
      frame.notes.append(takeaway);
    },
    render(ctx) {
      const p = beat(ctx, '0.2.1', 0.15, 0.65);
      ring.style.transform = `scaleX(${1 + 0.035 * Math.sin(Math.PI * p)})`;
      before.style.opacity = String(1 - Math.min(1, 2 * p));
      after.style.opacity = String(Math.max(0, 2 * p - 1));
      chart.render(p);
      reveal(facts, beat(ctx, '0.2.1', 0, 0.15), ctx.reducedMotion);
      reveal(takeaway, beat(ctx, '0.2.2', 0, 0.4), ctx.reducedMotion);
    },
  };
}

function introduction(): SceneModule {
  let title: HTMLElement;
  let disclaimer: HTMLElement;
  let legend: HTMLElement[];
  let conclusion: HTMLElement;
  return {
    id: '0.3',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, date: '2026-10-08' });
      frame.el.classList.add('opening-scene');
      title = item(ctx, '0.3.a', 'opening-title-card');
      disclaimer = item(ctx, '0.3.b', 'opening-disclaimer');
      const gradeRow = node('div', 'opening-grade-row');
      const legendItem = ctx.onScreen('0.3.c');
      gradeRow.setAttribute('aria-label', legendItem.text);
      legend = (['A', 'B', 'C', 'D', 'E'] as const).map(grade => {
        const wrap = node('div', 'opening-grade');
        wrap.append(gradeBadge(grade).el);
        gradeRow.append(wrap);
        return wrap;
      });
      conclusion = item(ctx, '0.3.d', 'opening-conclusion');
      frame.visual.append(title, disclaimer, gradeRow, conclusion);
    },
    render(ctx) {
      reveal(title, beat(ctx, '0.3.1', 0, 0.4), ctx.reducedMotion);
      reveal(disclaimer, beat(ctx, '0.3.2', 0, 0.4), ctx.reducedMotion);
      legend.forEach((el, i) => reveal(el, beat(ctx, '0.3.3', i * 0.13, 0.25), ctx.reducedMotion));
      reveal(conclusion, beat(ctx, '0.3.4', 0, 0.5), ctx.reducedMotion);
    },
  };
}

const chapter: ChapterModule = {
  id: 'ch00',
  scenes: { '0.1': comparison(), '0.2': intervention(), '0.3': introduction() },
};
export default chapter;
