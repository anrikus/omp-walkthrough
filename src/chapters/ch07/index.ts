import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { pairedBars, ease } from '../../kit';
import { sceneFrame, withEvidence } from '../shared/scene';
import './scenes.css';

type Motion = (ctx: RenderContext) => void;
const svgNS = 'http://www.w3.org/2000/svg';
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function svgElement<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>, text?: string): SVGElementTagNameMap[K] {
  const el = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  if (text !== undefined) el.textContent = text;
  return el;
}
function beat(ctx: RenderContext, sentence: string, fraction = 0.18): number {
  if (ctx.reducedMotion) return 1;
  if (ctx.t < ctx.sentence(sentence).start) return 0;
  return ease(Math.min(1, ctx.progress(sentence) / fraction));
}
function show(el: HTMLElement, p: number): void {
  el.style.opacity = String(p);
  el.setAttribute('inert', '');
  if (p > 0) el.removeAttribute('inert');
}
function authored(id: string, build: (ctx: MountContext, frame: ReturnType<typeof sceneFrame>, motions: Motion[]) => void): SceneModule {
  let motions: Motion[] = [];
  return {
    id,
    mount(stage, ctx) {
      motions = [];
      const frame = sceneFrame(stage, { title: ctx.scene.title, date: '2026-10-08' });
      frame.el.classList.add('ch07');
      build(ctx, frame, motions);
    },
    render(ctx) { for (const motion of motions) motion(ctx); },
    unmount() { motions = []; },
  };
}
function claim(ctx: MountContext, id: string, motions: Motion[], className = ''): HTMLElement {
  const item = ctx.onScreen(id);
  const box = element('section', `claim ${className}`);
  box.append(element('p', '', item.text));
  withEvidence(box, item, ctx);
  if (item.at) motions.push(c => show(box, beat(c, item.at!)));
  return box;
}
function phase(parent: HTMLElement, start: string, end: string | undefined, motions: Motion[]): HTMLElement {
  const el = element('section', 'phase');
  parent.append(el);
  motions.push(ctx => {
    const active = ctx.t >= ctx.sentence(start).start && (!end || ctx.t < ctx.sentence(end).start);
    show(el, active ? 1 : 0);
  });
  return el;
}
function completed(parent: HTMLElement, ctx: MountContext, motions: Motion[], className: string): HTMLElement {
  const earlier = Array.from(parent.children) as HTMLElement[];
  const result = element('div', className);
  parent.append(result);
  const last = ctx.scene.sentences.at(-1)!.id;
  motions.push(render => {
    const done = render.reducedMotion || render.t >= render.sentence(last).start;
    if (done) for (const layer of earlier) show(layer, 0);
    show(result, done ? 1 : 0);
  });
  return result;
}
function summaryClaim(ctx: MountContext, id: string): HTMLElement {
  const item = ctx.onScreen(id);
  const box = element('section');
  const divider = item.text.indexOf(' · ');
  box.append(element('h3', '', divider < 0 ? item.text : item.text.slice(0, divider)));
  if (divider >= 0) box.append(element('p', '', item.text.slice(divider + 3)));
  withEvidence(box, item, ctx);
  return box;
}
interface FlowNode { label: string; x: number; y: number; width?: number }
function flow(title: string, nodes: FlowNode[], edges: [number, number][], sentence: string, motions: Motion[], height = 340): HTMLElement {
  const root = element('div', 'flow');
  root.style.height = `${height}px`;
  const svg = svgElement('svg', { viewBox: `0 0 900 ${height}`, role: 'img', 'aria-label': title });
  root.append(svg);
  const dots: Array<{ el: SVGCircleElement; x1: number; y1: number; x2: number; y2: number }> = [];
  for (const [a, b] of edges) {
    const from = nodes[a]!;
    const to = nodes[b]!;
    svg.append(svgElement('line', { x1: String(from.x), y1: String(from.y), x2: String(to.x), y2: String(to.y), class: 'flow-link' }));
    const dot = svgElement('circle', { cx: '0', cy: '0', r: '6', class: 'flow-dot' });
    svg.append(dot);
    dots.push({ el: dot, x1: from.x, y1: from.y, x2: to.x, y2: to.y });
  }
  for (const node of nodes) {
    const w = node.width ?? 210;
    svg.append(svgElement('rect', { x: String(node.x - w / 2), y: String(node.y - 35), width: String(w), height: '70', rx: '8', class: 'flow-node' }));
    svg.append(svgElement('text', { x: String(node.x), y: String(node.y + 9), 'text-anchor': 'middle' }, node.label));
  }
  motions.push(ctx => {
    const p = ctx.reducedMotion ? 1 : ease(ctx.progress(sentence));
    for (const dot of dots) dot.el.setAttribute('transform', `translate(${dot.x1 + (dot.x2 - dot.x1) * p} ${dot.y1 + (dot.y2 - dot.y1) * p})`);
  });
  return root;
}

const mechanisms = authored('7.1', (ctx, frame, motions) => {
  const grid = element('div', 'pattern-grid');
  const definitions = [
    { name: 'Single loop', cue: '7.1.3', points: [[65, 64], [240, 64], [405, 64]], edges: [[0, 1], [1, 2], [2, 1]], labels: ['Request', 'Loop', 'Answer'] },
    { name: 'Isolated worker', cue: '7.1.3', points: [[65, 64], [240, 64], [405, 64]], edges: [[0, 1], [1, 2]], labels: ['Request', 'Worker', 'Return'] },
    { name: 'Parallel map/reduce', cue: '7.1.3', points: [[65, 64], [235, 30], [235, 95], [405, 64]], edges: [[0, 1], [0, 2], [1, 3], [2, 3]], labels: ['Request', 'Map', 'Map', 'Reduce'] },
    { name: 'Debate', cue: '7.1.4', points: [[65, 64], [240, 30], [240, 95], [405, 64]], edges: [[0, 1], [0, 2], [1, 2], [2, 1], [1, 3], [2, 3]], labels: ['Request', 'Revise', 'Revise', 'Answer'] },
    { name: 'Layered MoA', cue: '7.1.2', points: [[65, 64], [230, 30], [230, 95], [405, 64]], edges: [[0, 1], [0, 2], [1, 3], [2, 3]], labels: ['Request', 'Propose', 'Propose', 'Synthesize'] },
    { name: 'Router/cascade', cue: '7.1.5', points: [[65, 64], [240, 64], [405, 64]], edges: [[0, 1], [1, 2]], labels: ['Request', 'Select', 'Escalate?'] },
  ];
  for (const def of definitions) {
    const box = element('section', 'mechanism');
    box.append(element('h3', '', def.name));
    const focus = element('div', 'mechanism-focus');
    const svg = svgElement('svg', { viewBox: '0 0 480 125', role: 'img', 'aria-label': def.name });
    const dots: Array<{ el: SVGCircleElement; a: number[]; b: number[] }> = [];
    const topology = svgElement('g', {});
    svg.append(topology);
    for (const edge of def.edges) {
      const a = def.points[edge[0]!]!;
      const b = def.points[edge[1]!]!;
      topology.append(svgElement('line', { x1: String(a[0]), y1: String(a[1]), x2: String(b[0]), y2: String(b[1]), stroke: 'var(--color-muted)', 'stroke-width': '2' }));
      const dot = svgElement('circle', { r: '5', fill: 'var(--color-accent)' });
      topology.append(dot);
      dots.push({ el: dot, a, b });
    }
    def.points.forEach((point, i) => {
      const group = i === 0 ? svg : topology;
      group.append(svgElement('rect', { x: String(point[0]! - 66), y: String(point[1]! - 20), width: '132', height: '40', rx: '6', fill: 'var(--color-panel)', stroke: 'var(--color-control-line)' }));
      group.append(svgElement('text', { x: String(point[0]), y: String(point[1]! + 7), 'text-anchor': 'middle', fill: 'var(--color-ink)', 'font-size': '25' }, def.labels[i]!));
    });
    box.append(svg, focus);
    grid.append(box);
    motions.push(c => {
      const active = c.t >= c.sentence(def.cue).start && c.t <= c.sentence(def.cue).end;
      focus.style.opacity = active ? '1' : '0';
      topology.setAttribute('opacity', String(beat(c, def.cue)));
      const p = c.reducedMotion ? 1 : ease(c.progress(def.cue));
      for (const d of dots) d.el.setAttribute('transform', `translate(${d.a[0]! + (d.b[0]! - d.a[0]!) * p} ${d.a[1]! + (d.b[1]! - d.a[1]!) * p})`);
    });
  }
  const evidence = element('div', 'evidence-pair');
  evidence.append(claim(ctx, '7.1.a', motions), claim(ctx, '7.1.b', motions));
  frame.visual.append(grid, evidence);
  const fit = element('div', 'task-fit');
  fit.append(element('span', '', 'Bounded exploration'), element('span', '', 'Independent search'), element('span', '', 'Keep dependent chains intact'));
  frame.notes.append(fit);
  motions.push(c => show(fit, beat(c, '7.1.6')));
});

const inference = authored('7.2', (ctx, frame, motions) => {
  const first = phase(frame.visual, '7.2.1', '7.2.3', motions);
  const split = element('div', 'two-column');
  const study = element('section', 'study');
  const chart = pairedBars({
    title: 'Historical instruction following', condition: 'AlpacaEval 2.0 · length-controlled win rate', width: 1000, height: 420,
    axisLabel: 'LC win rate (%)', domain: [0, 100],
    pairs: [{ label: 'ICLR 2025', first: { label: 'MoA', value: 65.1, valueLabel: '65.1% ± 0.6 SD' }, second: { label: 'GPT-4 Omni (05/13)', value: 57.5, valueLabel: '57.5%' } }],
  });
  study.append(chart.el, element('p', 'quiet', 'A judge-based comparison — not repository repair.'));
  motions.push(c => chart.render(c.progress('7.2.1'), c.reducedMotion));
  split.append(study, claim(ctx, '7.2.a', motions, 'claim--dense'));
  first.append(split);
  const next = phase(frame.visual, '7.2.3', undefined, motions);
  const panels = element('div', 'study');
  const sampling = element('section', 'study study-surface');
  sampling.append(element('h3', '', 'Independent samples, then vote'));
  sampling.append(flow('Independent candidates converge on voting', [
    { label: 'Sample', x: 160, y: 70 }, { label: 'Sample', x: 160, y: 160 }, { label: 'Sample', x: 160, y: 250 }, { label: 'Vote', x: 710, y: 160 },
  ], [[0, 3], [1, 3], [2, 3]], '7.2.3', motions));
  panels.append(sampling);
  next.append(panels, claim(ctx, '7.2.b', motions));
  frame.notes.append(element('p', '', 'Separate studies and protocols. No combined leaderboard.'));
  const summary = completed(frame.visual, ctx, motions, 'completed-study');
  const moa = summaryClaim(ctx, '7.2.a');
  const comparisons = summaryClaim(ctx, '7.2.b');
  comparisons.append(flow('Independent samples feed a vote', [
    { label: 'Sample', x: 170, y: 55 }, { label: 'Sample', x: 170, y: 175 },
    { label: 'Vote', x: 700, y: 115 },
  ], [[0, 2], [1, 2]], '7.2.4', motions, 240));
  summary.append(moa, comparisons);
});

const diversity = authored('7.3', (ctx, frame, motions) => {
  const columns = element('div', 'two-column equal-column');
  const self = element('section', 'study');
  self.append(element('h3', '', 'Repeat a competent proposer'));
  self.append(flow('Repeated strongest proposer retains a distinct aggregator', [
    { label: 'Strong proposer', x: 220, y: 65, width: 280 }, { label: 'Strong proposer', x: 220, y: 165, width: 280 },
    { label: 'Strong proposer', x: 220, y: 265, width: 280 }, { label: 'Other aggregator', x: 690, y: 165, width: 300 },
  ], [[0, 3], [1, 3], [2, 3]], '7.3.1', motions));
  self.append(claim(ctx, '7.3.a', motions));
  const role = element('section', 'study');
  role.append(element('h3', '', 'Select for the function and domain'));
  const table = element('div', 'role-table');
  for (const label of ['Function', 'Domain', 'Role-specific choice', 'Task-specific choice', 'Preserve competence', 'Test useful diversity']) table.append(element('div', '', label));
  role.append(table, claim(ctx, '7.3.b', motions));
  motions.push(c => show(role, beat(c, '7.3.2')));
  columns.append(self, role);
  frame.visual.append(columns);
  const note = element('p', '', 'A collection of brands is not, by itself, an architecture.');
  frame.notes.append(note);
  motions.push(c => show(note, beat(c, '7.3.3')));
});

const scale = authored('7.4', (ctx, frame, motions) => {
  const improvement = phase(frame.visual, '7.4.1', '7.4.2', motions);
  const hero = element('div', 'hero-study');
  hero.append(element('p', 'big-number', '90.2%'), element('h3', '', 'Reported improvement on an internal research evaluation'), claim(ctx, '7.4.a', motions));
  improvement.append(hero);
  const costs = phase(frame.visual, '7.4.2', '7.4.3', motions);
  const meter = element('div', 'hero-study');
  meter.append(element('h3', '', 'Keep the denominator visible: chat tokens'));
  for (const [label, value] of [['Chat reference', 1], ['Agents', 4], ['Multi-agent', 15]] as const) {
    const row = element('div', 'cost-meter');
    const track = element('div', 'cost-track');
    const fill = element('div', 'cost-fill');
    track.append(fill);
    row.append(element('span', '', label), track, element('strong', '', value === 1 ? '1×' : `≈${value}×`));
    meter.append(row);
    motions.push(c => { fill.style.transform = `scaleX(${value / 15 * (c.reducedMotion ? 1 : ease(c.progress('7.4.2')))})`; });
  }
  meter.append(claim(ctx, '7.4.b', motions));
  costs.append(meter);
  const directions = phase(frame.visual, '7.4.3', '7.4.4', motions);
  const halves = element('div', 'two-column equal-column');
  const helps = element('section', 'direction');
  helps.append(element('h3', '', 'Can help'), element('strong', '', 'Parallelizable tasks'), element('p', '', 'Independent work can proceed together.'));
  const hurts = element('section', 'direction direction--hurt');
  hurts.append(element('h3', '', 'Can hurt'), element('strong', '', 'Sequential planning'), element('p', '', 'Dependent reasoning still needs its chain.'));
  halves.append(helps, hurts);
  directions.append(halves, claim(ctx, '7.4.c', motions));
  const failure = phase(frame.visual, '7.4.4', '7.4.5', motions);
  const buckets = element('div', 'failure-list');
  ['System design', 'Inter-agent alignment', 'Verification'].forEach((label, i) => {
    const card = element('section');
    card.append(element('h3', '', label));
    buckets.append(card);
    motions.push(c => { card.style.transform = `translateY(${(1 - beat(c, '7.4.4', 0.3 + i * 0.2)) * 20}px)`; });
  });
  failure.append(buckets, claim(ctx, '7.4.d', motions));
  frame.notes.append(element('p', '', 'Evidence strength and task conditions travel with each result.'));
  const summary = completed(frame.visual, ctx, motions, 'completed-scale');
  for (const id of ['7.4.a', '7.4.b', '7.4.c', '7.4.d', '7.4.e']) summary.append(summaryClaim(ctx, id));
});

const approval = authored('7.5', (ctx, frame, motions) => {
  const columns = element('div', 'two-column equal-column');
  const judge = element('section', 'study study-surface');
  judge.append(element('h3', '', 'Approval alone'), element('p', 'assertion', '“Reviewed” ≠ “verified”'), element('p', 'quiet', 'Self-preference and surface-form biases can affect code judging.'));
  const inspector = element('section', 'study study-surface');
  inspector.append(element('h3', '', 'An evaluator with access to evidence'));
  inspector.append(flow('Implementation and requirements feed an artifact inspector and external checks', [
    { label: 'Implementation', x: 180, y: 65, width: 290 }, { label: 'Requirements', x: 180, y: 190, width: 290 },
    { label: 'Inspector', x: 630, y: 125, width: 240 },
  ], [[0, 2], [1, 2]], '7.5.2', motions, 260));
  inspector.append(element('p', '', 'Run external checks'));
  columns.append(judge, inspector);
  motions.push(c => show(inspector, beat(c, '7.5.2')));
  frame.visual.append(columns, claim(ctx, '7.5.a', motions));
});

const roles = authored('7.6', (ctx, frame, motions) => {
  const columns = element('div', 'two-column');
  const actual = element('section', 'study');
  actual.append(element('h3', '', 'HyperAgent’s actual roles'));
  actual.append(flow('HyperAgent: a central planner coordinates navigator, editor and executor', [
    { label: 'Planner', x: 170, y: 170 }, { label: 'Navigator', x: 690, y: 55 },
    { label: 'Editor', x: 690, y: 170 }, { label: 'Executor', x: 690, y: 285 },
  ], [[0, 1], [0, 2], [0, 3]], '7.6.1', motions));
  actual.append(claim(ctx, '7.6.a', motions));
  const review = element('section', 'boundary');
  review.append(element('h3', '', 'Workflow synthesis'), element('p', 'quiet', 'Not an additional HyperAgent role'), element('p', 'assertion', 'Evidence-seeking reviewer'), element('p', '', 'Inspect implementation and requirements.'), claim(ctx, '7.6.b', motions));
  motions.push(c => show(review, beat(c, '7.6.3')));
  columns.append(actual, review);
  frame.visual.append(columns);
  const note = element('p', '', 'A role-specific option — not a permanent model list or a fixed team size.');
  frame.notes.append(note);
  motions.push(c => show(note, beat(c, '7.6.2')));
});

const principles = authored('7.7', (ctx, frame, motions) => {
  const grid = element('div', 'principles');
  const columns = Array.from({ length: 3 }, () => element('div', 'principle-column'));
  grid.append(...columns);
  const endings = ['baseline', 'information', 'owner', 'titles', 'performance', 'planner:', 'provenance', 'checks;', 'review', 'communication', 'harness'];
  for (let i = 1; i <= 11; i++) {
    const item = ctx.onScreen(`7.7.p${i}`);
    const box = element('section', 'principle');
    const [statement, confidence] = item.text.split(' — ') as [string, string];
    const leadEnd = statement.indexOf(endings[i - 1]!) + endings[i - 1]!.length;
    box.append(element('h3', '', statement.slice(0, leadEnd)));
    if (leadEnd < statement.length) box.append(element('p', 'principle-detail', statement.slice(leadEnd).trim()));
    const meta = element('div', 'principle-meta');
    if (i === 9) {
      const [low, medium] = confidence.split('; ') as [string, string];
      const qualifications = element('p', 'principle-detail');
      qualifications.append(element('span', 'confidence confidence--low', 'Low'), document.createTextNode(low.slice(3)), document.createElement('br'));
      qualifications.append(element('span', 'confidence', 'medium'), document.createTextNode(medium.slice(6)));
      box.append(qualifications);
    } else {
      const [level, word] = confidence.split(' ');
      meta.append(element('span', 'confidence', level), element('span', 'principle-detail', word));
    }
    withEvidence(meta, item, ctx);
    box.append(meta);
    const focus = element('div', 'principle-focus');
    box.append(focus);
    columns[i <= 4 ? 0 : i <= 8 ? 1 : 2]!.append(box);
    motions.push(c => {
      show(box, beat(c, item.at!, i < 9 ? 0.4 + i * 0.035 : 0.22));
      const focusCue = i === 9 ? '7.7.2' : i >= 10 ? '7.7.3' : undefined;
      const focused = !c.reducedMotion && focusCue !== undefined && c.t >= c.sentence(focusCue).start && c.t <= c.sentence(focusCue).end;
      focus.style.opacity = focused ? '1' : '0';
    });
  }
  const resources = element('section', 'resource-key');
  resources.append(element('h3', '', 'Measure separately'));
  for (const label of ['Latency', 'Total compute', 'Communication']) {
    const row = element('div', 'resource-line');
    row.append(element('span', '', label));
    resources.append(row);
  }
  const pulse = element('div', 'resource-pulse');
  resources.append(pulse);
  motions.push(c => {
    show(resources, beat(c, '7.7.3'));
    pulse.style.transform = `scaleX(${c.reducedMotion ? 1 : c.progress('7.7.3')})`;
  });
  columns[2]!.append(resources);
  frame.visual.append(grid);
  const legend = claim(ctx, '7.7.a', motions);
  legend.style.flexDirection = 'row';
  legend.style.alignItems = 'center';
  frame.notes.append(legend);
});

const chapter: ChapterModule = {
  id: 'ch07',
  scenes: { '7.1': mechanisms, '7.2': inference, '7.3': diversity, '7.4': scale, '7.5': approval, '7.6': roles, '7.7': principles },
};
export default chapter;
