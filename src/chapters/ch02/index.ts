import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { diagram, ease, gradeBadge, pairedBars, scatter, type ChartComponent } from '../../kit';
import { sceneFrame, withEvidence, reveal } from '../shared/scene';
import './scenes.css';

type Animator = (ctx: RenderContext) => void;
type Beat = { sentence: string; build: (visual: HTMLElement, copy: HTMLElement, ctx: MountContext) => Animator; note?: string };

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function claim(parent: HTMLElement, ctx: MountContext, id: string, secondary = false): HTMLElement {
  const box = element('section');
  const item = ctx.onScreen(id);
  box.dataset.onScreen = id;
  box.append(element('p', secondary ? 'measure-secondary' : '', item.text));
  withEvidence(box, item, ctx);
  parent.append(box);
  return box;
}

function node(title: string, detail?: string): HTMLElement {
  const el = element('div', 'measure-node');
  el.append(element('strong', '', title));
  if (detail) el.append(element('small', '', detail));
  return el;
}

function chart(parent: HTMLElement, component: ChartComponent): ChartComponent {
  // Short chart labels remain at least 22 logical pixels at the authored width.
  for (const label of component.el.querySelectorAll('text')) {
    if (Number(label.getAttribute('font-size')) < 22) label.setAttribute('font-size', '22');
  }
  parent.append(component.el);
  return component;
}

function revealAt(el: HTMLElement, ctx: RenderContext, sentence: string, speed = 3): void {
  const started = ctx.reducedMotion || ctx.t >= ctx.sentence(sentence).start;
  reveal(el, started ? ctx.progress(sentence) * speed : 0, ctx.reducedMotion && started);
  el.toggleAttribute('inert', !started);
  el.setAttribute('aria-hidden', String(!started));
}

function beatScene(id: string, beats: Beat[], options: { date?: string } = { date: '2026-10-08' }): SceneModule {
  let layers: Array<{ el: HTMLElement; note: HTMLElement; animate: Animator }> = [];
  return {
    id,
    mount(stage, ctx) {
      layers = [];
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', ...options });
      frame.el.classList.add('measure-frame');
      for (const beat of beats) {
        const el = element('div', 'measure-layer');
        const visual = element('div', 'measure-graphic');
        const copy = element('div', 'measure-copy');
        el.append(visual, copy);
        frame.visual.append(el);
        const note = element('div', 'measure-note', beat.note ?? '');
        frame.notes.append(note);
        layers.push({ el, note, animate: beat.build(visual, copy, ctx) });
      }
    },
    render(ctx) {
      let active = 0;
      beats.forEach((beat, index) => { if (ctx.t >= ctx.sentence(beat.sentence).start) active = index; });
      if (ctx.reducedMotion) active = beats.length - 1;
      layers.forEach((layer, index) => {
        const shown = index === active;
        layer.el.style.opacity = shown ? '1' : '0';
        layer.note.style.opacity = shown ? '1' : '0';
        layer.el.toggleAttribute('inert', !shown);
        layer.el.setAttribute('aria-hidden', String(!shown));
        layer.note.setAttribute('aria-hidden', String(!shown));
        layer.animate(ctx);
      });
    },
  };
}

function equation(parent: HTMLElement): HTMLElement[] {
  const grid = element('div', 'measure-equation');
  const boxes = [node('Model'), node('Agent harness'), node('Task set'), node('Evaluation protocol'), node('Reported system score')];
  grid.append(...boxes);
  parent.append(grid);
  return boxes;
}

const system = beatScene('2.1', [
  {
    sentence: '2.1.1',
    build(visual, copy, ctx) {
      const boxes = equation(visual);
      claim(copy, ctx, '2.1.a');
      return render => boxes.forEach((box, index) => reveal(box, render.progress('2.1.1') * 2.6 - index * 0.3, render.reducedMotion));
    },
    note: 'The unit being measured is the whole system, not an isolated model.',
  },
  {
    sentence: '2.1.2',
    build(visual, copy, ctx) {
      const lanes = element('div', 'measure-flow');
      const all = node('SWE-bench all-agent view', 'Model + agent harness');
      const fixed = node('Fixed mini-SWE-agent', 'Bash-only model comparison');
      lanes.append(all, fixed);
      visual.append(lanes);
      claim(copy, ctx, '2.1.a');
      return render => { reveal(all, render.progress('2.1.2') * 2, render.reducedMotion); reveal(fixed, render.progress('2.1.2') * 2 - 0.5, render.reducedMotion); };
    },
    note: 'Different comparison questions deserve separate views.',
  },
  {
    sentence: '2.1.3',
    build(visual, copy, ctx) {
      const boundary = element('div', 'measure-boundary');
      boundary.append(element('h3', '', 'Evaluation harness · setup, execution, grading'));
      const flow = chart(boundary, diagram({ title: 'Pro V2 example: patch re-grade', condition: 'An example protocol, not a universal implementation', width: 980, height: 360,
        nodes: [{ id: 'agent', label: 'Agent harness', x: 215, y: 240, width: 290, height: 90 }, { id: 'grade', label: 'Pristine-image grade', x: 735, y: 240, width: 340, height: 90 }],
        links: [{ from: 'agent', to: 'grade', label: 'patch' }],
      }));
      visual.append(boundary);
      claim(copy, ctx, '2.1.a', true);
      claim(copy, ctx, '2.1.b', true);
      return render => flow.render(render.progress('2.1.3'), render.reducedMotion);
    },
    note: 'Control flow belongs to the agent; the grading boundary belongs to the evaluation.',
  },
]);

const terminalComparison = beatScene('2.2', [{
  sentence: '2.2.1',
  build(visual, copy, ctx) {
    const bars = chart(visual, pairedBars({ title: 'Same model · different systems', condition: 'GPT-5.2 · Terminal-Bench 2.0 · 89 tasks', width: 1037, height: 580,
      axisLabel: 'Success (%)', domain: [0, 100], pairs: [{ label: 'GPT-5.2', first: { label: 'Codex CLI', value: 62.9, valueLabel: '62.9%', ci: [59.9, 65.9], ciLabel: '95% CI ± 3.0 pp' }, second: { label: 'Terminus 2', value: 54, valueLabel: '54.0%', ci: [51.1, 56.9], ciLabel: '95% CI ± 2.9 pp' } }],
    }));
    claim(copy, ctx, '2.2.a');
    const caveat = element('div', 'measure-callout', 'A system comparison — not a budget-matched harness ablation.');
    copy.append(caveat);
    return render => { bars.render(render.progress('2.2.1'), render.reducedMotion); revealAt(caveat, render, '2.2.2'); };
  },
  note: 'Official live-board evidence is first-party, even when the original benchmark paper is peer-reviewed.',
}]);

const versions: SceneModule = (() => {
  let cards: HTMLElement[] = [];
  let whisker: SVGElement;
  let release: HTMLElement;
  let note: HTMLElement;
  return {
    id: '2.3',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('measure-versions');
      const timeline = element('div', 'measure-release-line');
      timeline.setAttribute('aria-label', 'Terminal-Bench release sequence, not a score trend');
      timeline.append(element('span', '', 'Terminal-Bench 2.0'), element('span', 'measure-release-arrow', '→'));
      release = element('strong', '', 'Terminal-Bench 4.0');
      timeline.append(release, element('span', 'measure-release-caption', 'Release sequence, not a score trend'));
      frame.header.append(timeline);
      const grid = element('div', 'measure-protocols');
      cards = [];
      for (const id of ['2.3.a', '2.3.b', '2.3.c']) {
        const item = ctx.onScreen(id);
        const parts = item.text.split(' · ');
        const card = element('section', 'measure-protocol');
        card.dataset.onScreen = id;
        card.append(element('h3', '', parts[0]));
        if (id === '2.3.a') {
          const result = element('div', 'measure-protocol-result');
          const [value, interval] = parts[4].split(', ');
          result.append(element('strong', '', value), element('p', '', interval));
          const range = svgElement('svg', { viewBox: '0 0 500 44', role: 'img', 'aria-label': 'Reported 95% confidence interval, 64.8% plus or minus 3.1 percentage points. Percentage scale from zero to one hundred.' });
          range.append(svgElement('line', { x1: '10', x2: '490', y1: '22', y2: '22', stroke: '#c6ced8', 'stroke-width': '3' }));
          whisker = svgElement('g', { stroke: '#554fad', 'stroke-width': '4' });
          const low = String(10 + 480 * 0.617);
          const high = String(10 + 480 * 0.679);
          whisker.append(svgElement('path', { d: `M${low} 22 H${high} M${low} 12 V32 M${high} 12 V32`, fill: 'none' }), svgElement('circle', { cx: String(10 + 480 * 0.648), cy: '22', r: '6', fill: '#554fad' }));
          range.append(whisker);
          result.append(range);
          card.append(result, element('p', 'measure-protocol-sample', parts[2]), element('p', '', parts[3]), element('p', 'measure-protocol-meta', parts[1]), element('p', 'measure-protocol-caveat', parts[5]));
        } else {
          card.append(element('p', 'measure-protocol-sample', parts[1]));
          for (let index = 2; index < parts.length; index++) {
            card.append(element('p', index === parts.length - 1 ? 'measure-protocol-meta' : 'measure-protocol-caveat', parts[index]));
          }
        }
        withEvidence(card, item, ctx);
        grid.append(card);
        cards.push(card);
      }
      frame.visual.append(grid);
      frame.notes.append(element('div', '', 'Separate protocols. No shared percentage axis, trend line, or cross-benchmark ranking.'));
      note = element('div', '', 'Terminal release changes: repaired tasks · revised resource limits · removed saturated problems');
      frame.notes.append(note);
    },
    render(ctx) {
      reveal(cards[0], ctx.progress('2.3.1') * 4, ctx.reducedMotion);
      cards.slice(1).forEach(card => revealAt(card, ctx, '2.3.2', 4));
      whisker.style.opacity = String(ctx.reducedMotion ? 1 : ease(ctx.progress('2.3.1')));
      reveal(release, ctx.progress('2.3.1') * 4, ctx.reducedMotion);
      revealAt(note, ctx, '2.3.4', 4);
    },
  };
})();

const correctness = beatScene('2.4', [
  {
    sentence: '2.4.1',
    build(visual, copy, ctx) {
      const flow = chart(visual, diagram({ title: 'An uncovered edge case', condition: 'UTBoost · historical SWE-bench systems · ACL 2025', width: 1037, height: 450,
        nodes: [{ id: 'pass', label: 'Original tests pass', x: 255, y: 245, width: 330, height: 90 }, { id: 'edge', label: 'Added tests expose error', x: 785, y: 245, width: 410, height: 90 }],
        links: [{ from: 'pass', to: 'edge' }],
      }));
      claim(copy, ctx, '2.4.a');
      return render => flow.render(render.progress('2.4.1'), render.reducedMotion);
    },
    note: 'Passing the original suite is weaker than complete correctness.',
  },
  {
    sentence: '2.4.2',
    build(visual, copy, ctx) {
      const pair = element('div', 'measure-pair');
      const panels = [['SWE-bench Lite', '18'], ['SWE-bench Verified', '11']].map(([title, value]) => {
        const panel = element('section', 'measure-lane');
        panel.append(element('h3', '', title), element('div', 'measure-hero', value), element('p', '', 'Historical ranking changes'));
        pair.append(panel);
        return panel;
      });
      visual.append(element('h3', 'measure-subhead', '345 erroneous passing patches · 36 affected task instances'));
      visual.append(pair);
      claim(copy, ctx, '2.4.a', true);
      claim(copy, ctx, '2.4.b');
      return render => panels.forEach((panel, index) => reveal(panel, render.progress('2.4.2') * 2 - index * 0.35, render.reducedMotion));
    },
    note: 'Separate historical boards — not October 2026 rank movements.',
  },
], {});

const validity = beatScene('2.5', [
  {
    sentence: '2.5.1',
    build(visual, copy, ctx) {
      const pair = element('div', 'measure-pair');
      const acceptance = node('False acceptance', 'Bad fix → inadequate tests → pass');
      acceptance.append(gradeBadge('A').el);
      const rejection = node('False rejection', 'Good fix → over-specific tests or unreliable environment → fail');
      rejection.append(gradeBadge('C').el);
      pair.append(acceptance, rejection);
      visual.append(pair);
      claim(copy, ctx, '2.5.a');
      return render => { reveal(acceptance, render.progress('2.5.1') * 2, render.reducedMotion); reveal(rejection, render.progress('2.5.1') * 2 - 0.5, render.reducedMotion); };
    },
    note: 'UTBoost research (A) and OpenAI’s Verified motivation (C) address different validity failures.',
  },
  {
    sentence: '2.5.2',
    build(visual, copy, ctx) {
      const steps = element('div', 'measure-steps');
      const labels = ['Task validity', 'Outcome validity', 'Reporting'].map(text => element('span', '', text));
      steps.append(...labels);
      visual.append(steps);
      claim(copy, ctx, '2.5.b');
      return render => labels.forEach((label, index) => reveal(label, render.progress('2.5.2') * 2.5 - index * 0.4, render.reducedMotion));
    },
    note: 'The empty-response example is a historical τ-bench-Airline setup — not a current τ³ result.',
  },
  {
    sentence: '2.5.3',
    build(visual, copy, ctx) {
      const layout = visual.parentElement!;
      layout.classList.add('measure-validity-final');
      const points = chart(visual, scatter({ title: 'HAL Table A23 only', condition: 'GPT-5 Medium · Verified Mini · 50 tasks', width: 800, height: 370,
        costAxis: 'Corresponding full-run cost ($)', successAxis: 'Best-run accuracy (%)', costDomain: [0, 220], successDomain: [0, 60], points: [
          { label: 'Generalist', cost: 57.58, success: 12, costLabel: '$57.58', successLabel: '12.0%', labelDx: 20, labelDy: -28 },
          { label: 'SWE-Agent', cost: 162.93, success: 46, costLabel: '$162.93', successLabel: '46.0%', labelDx: -20, labelDy: -28 },
        ],
      }));
      claim(copy, ctx, '2.5.a', true);
      claim(copy, ctx, '2.5.b', true);
      const results = element('div', 'measure-validity-results');
      claim(results, ctx, '2.5.c', true);
      claim(results, ctx, '2.5.d', true);
      layout.append(results);
      return render => points.render(render.progress('2.5.3'), render.reducedMotion);
    },
    note: 'Cost alongside accuracy, with protected holdouts. This is not a cost-per-issue chart.',
  },
], {});

function svgElement<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string>, text?: string): SVGElementTagNameMap[K] {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  if (text !== undefined) el.textContent = text;
  return el;
}

const horizon = beatScene('2.6', [{
  sentence: '2.6.1',
  build(visual, copy, ctx) {
    const svg = svgElement('svg', { viewBox: '0 0 1037 600', role: 'img', 'aria-label': 'Illustrative success curve against human-expert task duration. The selected success threshold defines the time horizon. No model data plotted.' });
    svg.append(svgElement('rect', { width: '1037', height: '600', fill: '#162235' }));
    const text = (value: string, x: string, y: string, extra: Record<string, string> = {}) => svgElement('text', { x, y, fill: '#eef3fa', 'font-size': '26', ...extra }, value);
    svg.append(text('Schematic · no model data', '40', '48'), text('Predicted success', '90', '100'), text('Human-expert task duration', '330', '550'));
    svg.append(svgElement('path', { d: 'M90 140 V480 H970', fill: 'none', stroke: '#aab9ca', 'stroke-width': '2' }));
    const curve = svgElement('path', { d: 'M100 150 C360 155 380 220 525 300 S740 455 940 460', fill: 'none', stroke: '#75b9ec', 'stroke-width': '6', pathLength: '1', 'stroke-dasharray': '1' });
    const threshold = svgElement('g', {});
    threshold.append(svgElement('path', { d: 'M90 300 H525 V480', fill: 'none', stroke: '#eab77b', 'stroke-width': '3', 'stroke-dasharray': '8 8' }), svgElement('circle', { cx: '525', cy: '300', r: '9', fill: '#eab77b' }), text('Selected success threshold', '110', '280'), text('Time horizon', '510', '400', { 'text-anchor': 'end' }));
    svg.append(curve, threshold);
    visual.append(svg);
    claim(copy, ctx, '2.6.a');
    const scope = element('div', 'measure-callout', 'Task difficulty in human time — not an agent-runtime stopwatch or workplace hours saved.');
    copy.append(scope);
    return render => {
      const p = render.reducedMotion ? 1 : ease(render.progress('2.6.1'));
      curve.setAttribute('stroke-dashoffset', String(1 - p));
      threshold.style.opacity = String(p);
      revealAt(scope, render, '2.6.2');
    };
  },
  note: 'Clean, self-contained tasks differ from contextual everyday workplace activity.',
}]);

const alternatives = beatScene('2.7', [
  {
    sentence: '2.7.1',
    build(visual, copy, ctx) {
      const report = element('div', 'measure-flow');
      report.append(element('h3', 'measure-subhead', 'OMP + DeepSeek V4 Flash'), element('div', 'measure-hero', '17 / 30'), element('p', 'measure-subhead', 'SaaS workflow successes · 56.7%'));
      const dots = element('div', 'measure-rank');
      ['Composio Golden Eval', '900 seconds/task', 'First-party report'].forEach(text => dots.append(element('span', '', text)));
      report.append(dots);
      visual.append(report);
      claim(copy, ctx, '2.7.a');
      return render => reveal(report, render.progress('2.7.1') * 3, render.reducedMotion);
    },
    note: 'A workflow evaluation is not a flagship coding-board result.',
  },
  {
    sentence: '2.7.2',
    build(visual, copy, ctx) {
      const boxes = element('div', 'measure-flow');
      const reasoning = node('Reasoning settings change');
      const providers = node('Providers change');
      const conclusion = node('Harness-only inference is limited');
      boxes.append(reasoning, providers, conclusion);
      visual.append(boxes);
      claim(copy, ctx, '2.7.b');
      return render => [reasoning, providers, conclusion].forEach((box, index) => reveal(box, render.progress('2.7.2') * 2.5 - index * 0.4, render.reducedMotion));
    },
    note: 'The inspected tables bound the search; absence here is not proof of absence everywhere.',
  },
  {
    sentence: '2.7.3',
    build(visual, copy, ctx) {
      const pair = element('div', 'measure-flow');
      const independent = node('Independent Claw-SWE-Bench v2', 'Hermes + DeepSeek Harness · preprint');
      const vendor = node('DeepSeek technical report', 'Pi + DeepSeek Harness · vendor evaluation');
      pair.append(independent, vendor);
      visual.append(pair);
      claim(copy, ctx, '2.7.c');
      return render => { reveal(independent, render.progress('2.7.3') * 2, render.reducedMotion); reveal(vendor, render.progress('2.7.3') * 2 - 0.5, render.reducedMotion); };
    },
    note: 'Independent preprints and vendor reports are different evidence lanes.',
  },
  {
    sentence: '2.7.4',
    build(visual, copy, ctx) {
      const boundary = element('div', 'measure-boundary');
      boundary.append(element('h3', '', 'Hermes Index · fixed harness'), node('Models compared within Hermes'), node('Terminal suite excludes GPU tasks', 'Some scores and costs are provisional'));
      visual.append(boundary);
      claim(copy, ctx, '2.7.d');
      return render => reveal(boundary, render.progress('2.7.4') * 3, render.reducedMotion);
    },
    note: 'Not comparable to the full official Terminal-Bench 4 board.',
  },
  {
    sentence: '2.7.5',
    build(visual, copy, ctx) {
      const layout = visual.parentElement!;
      layout.classList.add('measure-alternatives-final');
      visual.remove();
      copy.remove();
      const cards = [
        ['17/30 successes · 56.7%', '2.7.a'],
        ['Bounded search, limited comparison', '2.7.b'],
        ['Independent preprint / vendor report', '2.7.c'],
        ['Models within a fixed harness', '2.7.d'],
      ].map(([title, id]) => {
        const card = element('section', 'measure-summary-card');
        card.append(element('h3', '', title));
        claim(card, ctx, id, true);
        layout.append(card);
        return card;
      });
      return render => cards.forEach(card => reveal(card, render.progress('2.7.5') * 3, render.reducedMotion));
    },
    note: 'A score belongs to a model, a harness, a task set, and an evaluation protocol.',
  },
]);

const chapter: ChapterModule = {
  id: 'ch02',
  scenes: { '2.1': system, '2.2': terminalComparison, '2.3': versions, '2.4': correctness, '2.5': validity, '2.6': horizon, '2.7': alternatives },
};
export default chapter;
