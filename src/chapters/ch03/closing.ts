import type { MountContext, RenderContext, SceneModule } from '../../engine/types';
import { diagram, pairedBars, type ChartComponent } from '../../kit';
import { sceneFrame, withEvidence, type SceneFrame } from '../shared/scene';
import { element, evidence, normalizeChart, layer, showLayer, progress } from './helpers';
import './closing.css';

type Renderer = (ctx: RenderContext) => void;

function closingScene(id: string, build: (ctx: MountContext, frame: SceneFrame) => Renderer): SceneModule {
  let root: HTMLElement | undefined;
  let render: Renderer | undefined;
  return {
    id,
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('ch03-scene', 'ch03-closing');
      root = frame.el;
      render = build(ctx, frame);
    },
    render(ctx) { render?.(ctx); },
    unmount() { root?.remove(); root = undefined; render = undefined; },
  };
}

function splitPhase(parent: HTMLElement, ctx: MountContext, item: string) {
  const el = layer(parent, 'ch03-closing-split');
  const visual = element('div', 'ch03-closing-visual');
  const aside = element('div', 'ch03-closing-aside');
  aside.append(evidence(ctx, item));
  el.append(visual, aside);
  return { el, visual, aside };
}

function mountChart(parent: HTMLElement, chart: ChartComponent): ChartComponent {
  normalizeChart(chart);
  parent.append(chart.el);
  return chart;
}

function sentenceCopy(ctx: MountContext, id: string, className = 'ch03-closing-qualification'): HTMLElement {
  const sentence = ctx.scene.sentences.find(candidate => candidate.id === id);
  if (!sentence) throw new Error(`Missing narration sentence ${id}`);
  const el = element('section', className);
  el.append(element('p', '', sentence.text));
  withEvidence(el, { id, kind: 'caption', text: sentence.text, claims: sentence.claims, sources: sentence.sources }, ctx);
  return el;
}

function sentenceVisibility(el: HTMLElement, ctx: RenderContext, id: string): void {
  const visible = ctx.reducedMotion || ctx.t >= ctx.sentence(id).start;
  el.style.opacity = visible ? '1' : '0';
  el.inert = !visible;
}

function completedVisibility(el: HTMLElement, visible: boolean): void {
  el.style.opacity = visible ? '1' : '0';
  el.inert = !visible;
  el.setAttribute('aria-hidden', String(!visible));
}

function summaryCard(ctx: MountContext, id: string, visual: HTMLElement): HTMLElement {
  const card = evidence(ctx, id);
  card.classList.add('ch03-summary-card');
  card.prepend(visual);
  return card;
}

function relationship(from: string, to: string, connector = '→'): HTMLElement {
  const el = element('div', 'ch03-summary-relationship');
  el.append(element('span', '', from), element('span', 'ch03-summary-connector', connector), element('strong', '', to));
  return el;
}

function summaryBars(axisLabel: string, rows: readonly { label: string; value: number; text: string }[], maximum = 100): HTMLElement {
  const chart = element('div', 'ch03-summary-bars');
  for (const datum of rows) {
    const row = element('div', 'ch03-summary-bar-row');
    const track = element('div', 'ch03-summary-bar-track');
    track.setAttribute('aria-hidden', 'true');
    const fill = element('div', 'ch03-summary-bar-fill');
    fill.style.width = `${datum.value / maximum * 100}%`;
    track.append(fill);
    row.append(element('span', '', datum.label), track, element('strong', '', datum.text));
    chart.append(row);
  }
  const axis = element('div', 'ch03-summary-bar-axis');
  axis.append(element('span', '', '0'), element('span', '', axisLabel), element('span', '', String(maximum)));
  chart.append(axis);
  return chart;
}

export const searchingScene: SceneModule = closingScene('3.5', (ctx, frame) => {
  const stages = layer(frame.visual);
  const code = splitPhase(stages, ctx, '3.5.a');
  const codeChart = mountChart(code.visual, diagram({
    title: 'Search over harness code', condition: 'Categorical lane — not a chronology', width: 1016, height: 500,
    nodes: [
      { id: 'adas', label: 'ADAS', x: 190, y: 190, width: 260 },
      { id: 'aflow', label: 'AFlow', x: 190, y: 310, width: 260 },
      { id: 'dgm', label: 'DGM', x: 190, y: 430, width: 260 },
      { id: 'executor', label: 'Frozen execution models', x: 765, y: 310, width: 350, height: 100 },
    ],
    links: [{ from: 'adas', to: 'executor' }, { from: 'aflow', to: 'executor' }, { from: 'dgm', to: 'executor' }],
  }));
  code.aside.append(element('p', 'ch03-closing-callout', 'Search changes the harness, not the execution-model weights.'));

  const transfer = splitPhase(stages, ctx, '3.5.b');
  const transferChart = mountChart(transfer.visual, pairedBars({
    title: 'DGM: transfer to unseen Polyglot', condition: 'o3-mini executor · entirely held-out tasks',
    width: 1016, height: 470, domain: [0, 100], axisLabel: 'Polyglot success (%)',
    pairs: [{ label: 'Agent', first: { label: 'Initial', value: 14.2, valueLabel: '14.2%' },
      second: { label: 'Evolved', value: 28.9, valueLabel: '28.9%' } }],
  }));
  transfer.aside.append(element('p', 'ch03-closing-callout', 'Held-out transfer, not reuse of the search tasks.'));

  const prompt = splitPhase(stages, ctx, '3.5.c');
  const promptChart = mountChart(prompt.visual, diagram({
    title: 'Prompt search is not weight training', condition: 'GEPA Table 1 · Qwen3-8B', width: 1016, height: 500,
    nodes: [
      { id: 'gepa', label: 'GEPA', x: 185, y: 220, width: 240 },
      { id: 'prompt', label: 'Optimize prompts', x: 740, y: 220, width: 370 },
      { id: 'grpo', label: 'GRPO', x: 185, y: 390, width: 240 },
      { id: 'weights', label: 'Train model weights', x: 740, y: 390, width: 370 },
    ],
    links: [{ from: 'gepa', to: 'prompt' }, { from: 'grpo', to: 'weights' }],
  }));
  prompt.aside.append(element('p', 'ch03-closing-callout', 'GRPO won AIME-2025; study rollout budgets were unequal.'));

  const meta = splitPhase(stages, ctx, '3.5.d');
  const metaChart = mountChart(meta.visual, diagram({
    title: 'Meta-Harness: a reused evaluation set', condition: 'Haiku 4.5 · Terminal-Bench 2 · preprint', width: 1016, height: 500,
    nodes: [
      { id: 'tasks', label: 'Same 89 tasks', x: 235, y: 300, width: 300, height: 100 },
      { id: 'search', label: 'Harness search', x: 750, y: 200, width: 340 },
      { id: 'evaluation', label: 'Evaluation', x: 750, y: 420, width: 340 },
    ],
    links: [{ from: 'tasks', to: 'search' }, { from: 'tasks', to: 'evaluation' }],
  }));
  const summary = layer(frame.visual, 'ch03-summary ch03-search-summary');
  summary.append(
    summaryCard(ctx, '3.5.a', relationship('ADAS / AFlow / DGM', 'Frozen execution models')),
    summaryCard(ctx, '3.5.b', summaryBars('Polyglot success (%)', [
      { label: 'Initial', value: 14.2, text: '14.2%' },
      { label: 'Evolved', value: 28.9, text: '28.9%' },
    ])),
    summaryCard(ctx, '3.5.c', relationship('Prompt optimization', 'Weight training', '≠')),
    summaryCard(ctx, '3.5.d', relationship('Same 89 tasks', 'Search + evaluation')),
  );
  const compute = sentenceCopy(ctx, '3.5.5', 'ch03-note');
  frame.notes.append(compute);
  return render => {
    const complete = render.reducedMotion || render.t >= render.sentence('3.5.5').start;
    completedVisibility(stages, !complete);
    completedVisibility(summary, complete);
    showLayer(code.el, render, '3.5.1', '3.5.2');
    showLayer(transfer.el, render, '3.5.2', '3.5.3');
    showLayer(prompt.el, render, '3.5.3', '3.5.4');
    showLayer(meta.el, render, '3.5.4');
    codeChart.render(progress(render, '3.5.1'), render.reducedMotion);
    transferChart.render(progress(render, '3.5.2'), render.reducedMotion);
    promptChart.render(progress(render, '3.5.3'), render.reducedMotion);
    metaChart.render(progress(render, '3.5.4'), render.reducedMotion);
    sentenceVisibility(compute, render, '3.5.5');
  };
});

export const practitionerScene: SceneModule = closingScene('3.6', (ctx, frame) => {
  const stages = layer(frame.visual);
  const context = splitPhase(stages, ctx, '3.6.a');
  const contextChart = mountChart(context.visual, diagram({
    title: 'Context selection changes retrieval burden', condition: 'Chroma Context Rot · Sonnet 4 non-thinking', width: 1016, height: 460,
    nodes: [
      { id: 'history', label: 'Full history', note: '~113k tokens', x: 245, y: 195, width: 330 },
      { id: 'excerpts', label: 'Focused excerpts', x: 245, y: 365, width: 330 },
      { id: 'task', label: 'LongMemEval_s', note: '306 cleaned prompts', x: 775, y: 280, width: 320 },
    ],
    links: [{ from: 'history', to: 'task' }, { from: 'excerpts', to: 'task' }],
  }));

  const langchain = splitPhase(stages, ctx, '3.6.b');
  const langchainChart = mountChart(langchain.visual, pairedBars({
    title: 'LangChain report', condition: 'gpt-5.2-codex · TB2.0 · 89 tasks',
    width: 1016, height: 470, domain: [0, 100], axisLabel: 'Terminal-Bench success (%)',
    pairs: [{ label: 'CLI', first: { label: 'Default', value: 52.8, valueLabel: '52.8%' },
      second: { label: 'Tuned', value: 66.5, valueLabel: '66.5%' } }],
  }));
  langchain.aside.append(element('p', 'ch03-closing-callout', 'No held-out test. Repeats and confidence intervals unreported.'));

  const creator = splitPhase(stages, ctx, '3.6.c');
  const creatorChart = mountChart(creator.visual, pairedBars({
    title: 'Creator report: hashline', condition: 'Grok Code Fast 1 · synthetic React mutations',
    width: 1016, height: 470, domain: [0, 100], axisLabel: 'Original-file matching success (%)',
    pairs: [{ label: 'Edit', first: { label: 'Patch', value: 6.7, valueLabel: '6.7%' },
      second: { label: 'Hashline', value: 68.3, valueLabel: '68.3%' } }],
  }));
  const summary = layer(frame.visual, 'ch03-summary ch03-practitioner-summary');
  const retrieval = element('div', 'ch03-summary-retrieval');
  retrieval.append(
    relationship('Focused excerpts', 'LongMemEval_s'),
    relationship('Full history (~113k tokens)', 'LongMemEval_s'),
    element('p', '', 'Different retrieval burdens'),
  );
  summary.append(
    summaryCard(ctx, '3.6.a', retrieval),
    summaryCard(ctx, '3.6.b', summaryBars('TB2.0 success (%)', [
      { label: 'Default', value: 52.8, text: '52.8%' },
      { label: 'Tuned', value: 66.5, text: '66.5%' },
    ])),
    summaryCard(ctx, '3.6.c', summaryBars('Original-file matching (%)', [
      { label: 'Patch', value: 6.7, text: '6.7%' },
      { label: 'Hashline', value: 68.3, text: '68.3%' },
    ])),
  );
  const caution = sentenceCopy(ctx, '3.6.4', 'ch03-note');
  frame.notes.append(caution);
  return render => {
    const complete = render.reducedMotion || render.t >= render.sentence('3.6.4').start;
    completedVisibility(stages, !complete);
    completedVisibility(summary, complete);
    showLayer(context.el, render, '3.6.1', '3.6.2');
    showLayer(langchain.el, render, '3.6.2', '3.6.3');
    showLayer(creator.el, render, '3.6.3');
    contextChart.render(progress(render, '3.6.1'), render.reducedMotion);
    langchainChart.render(progress(render, '3.6.2'), render.reducedMotion);
    creatorChart.render(progress(render, '3.6.3'), render.reducedMotion);
    sentenceVisibility(caution, render, '3.6.4');
  };
});

export const reversalScene: SceneModule = closingScene('3.7', (ctx, frame) => {
  const stages = layer(frame.visual);
  const comparison = layer(stages, 'ch03-closing-reversals');
  const charts = element('div', 'ch03-closing-chart-pair');
  const large = mountChart(charts, pairedBars({
    title: 'GPT-4.1', condition: 'Diff-XYZ v2 · Table 5 · same diff-generation protocol',
    width: 864, height: 390, domain: [0, 1], axisLabel: 'Exact match',
    pairs: [{ label: 'Format', first: { label: 'Unified diff', value: 0.81, valueLabel: '0.81' },
      second: { label: 'Search/replace', value: 0.95, valueLabel: '0.95', color: '#7dd4c5' } }],
  }));
  const nano = mountChart(charts, pairedBars({
    title: 'GPT-4.1-nano', condition: 'Diff-XYZ v2 · Table 5 · same diff-generation protocol',
    width: 864, height: 390, domain: [0, 1], axisLabel: 'Exact match',
    pairs: [{ label: 'Format', first: { label: 'Unified diff', value: 0.50, valueLabel: '0.50' },
      second: { label: 'Search/replace', value: 0.07, valueLabel: '0.07', color: '#eab77b' } }],
  }));
  comparison.append(charts, evidence(ctx, '3.7.a'));

  const gate = splitPhase(stages, ctx, '3.7.b');
  const gateChart = mountChart(gate.visual, diagram({
    title: 'Use feedback, not a universal default', condition: 'Model × task × interface policy', width: 1016, height: 510,
    nodes: [
      { id: 'policy', label: 'Instructions, memory, reasoning', x: 190, y: 305, width: 300, height: 125 },
      { id: 'feedback', label: 'Task feedback', x: 545, y: 305, width: 230, height: 100 },
      { id: 'retain', label: 'Keep what helps', x: 830, y: 195, width: 260, height: 85 },
      { id: 'revise', label: 'Revise what hurts', x: 830, y: 420, width: 260, height: 85 },
    ],
    links: [{ from: 'policy', to: 'feedback' }, { from: 'feedback', to: 'retain' }, { from: 'feedback', to: 'revise' }],
  }));
  const summary = layer(frame.visual, 'ch03-summary ch03-reversal-summary');
  const models = element('div', 'ch03-summary-models');
  const largeResult = element('section', 'ch03-summary-model');
  largeResult.append(element('h3', '', 'GPT-4.1'), summaryBars('Exact match', [
    { label: 'Unified diff', value: 0.81, text: '0.81' },
    { label: 'Search/replace', value: 0.95, text: '0.95' },
  ], 1));
  const nanoResult = element('section', 'ch03-summary-model');
  nanoResult.append(element('h3', '', 'GPT-4.1-nano'), summaryBars('Exact match', [
    { label: 'Unified diff', value: 0.50, text: '0.50' },
    { label: 'Search/replace', value: 0.07, text: '0.07' },
  ], 1));
  models.append(largeResult, nanoResult);
  const feedback = element('div', 'ch03-summary-feedback');
  feedback.append(
    element('p', '', 'Instructions, memory, reasoning'),
    relationship('Task feedback', 'Keep what helps'),
    relationship('Task feedback', 'Revise what hurts'),
  );
  summary.append(summaryCard(ctx, '3.7.a', models), summaryCard(ctx, '3.7.b', feedback));
  const caution = sentenceCopy(ctx, '3.7.3', 'ch03-note');
  frame.notes.append(caution);
  return render => {
    const complete = render.reducedMotion || render.t >= render.sentence('3.7.3').start;
    completedVisibility(stages, !complete);
    completedVisibility(summary, complete);
    showLayer(comparison, render, '3.7.1', '3.7.2');
    showLayer(gate.el, render, '3.7.2');
    large.render(progress(render, '3.7.1'), render.reducedMotion);
    nano.render(progress(render, '3.7.1'), render.reducedMotion);
    gateChart.render(progress(render, '3.7.2'), render.reducedMotion);
    sentenceVisibility(caution, render, '3.7.3');
  };
});

export const trainingScene: SceneModule = closingScene('3.8', (ctx, frame) => {
  const stages = layer(frame.visual);
  const patch = splitPhase(stages, ctx, '3.8.a');
  const patchChart = mountChart(patch.visual, diagram({
    title: 'Training meets a patch interface', condition: 'OpenAI documentation · format-specific training', width: 1016, height: 500,
    nodes: [
      { id: 'training', label: 'Model training', x: 235, y: 300, width: 320, height: 100 },
      { id: 'format', label: 'Patch format', x: 765, y: 300, width: 320, height: 100 },
    ],
    links: [{ from: 'training', to: 'format', label: 'Compatibility' }],
  }));
  patch.aside.append(element('p', 'ch03-closing-callout', 'Documented compatibility is not proof that alternate tools cannot work.'));

  const harnesses = splitPhase(stages, ctx, '3.8.b');
  const harnessChart = mountChart(harnesses.visual, diagram({
    title: 'Training across harnesses', condition: 'DeepSeek V4.1 technical report · September 2026', width: 1016, height: 550,
    nodes: [
      { id: 'training', label: 'DeepSeek V4.1 training', x: 255, y: 335, width: 360, height: 100 },
      { id: 'claude', label: 'Claude Code', x: 785, y: 175, width: 300 },
      { id: 'opencode', label: 'OpenCode', x: 785, y: 280, width: 300 },
      { id: 'pi', label: 'Pi', x: 785, y: 385, width: 300 },
      { id: 'dsh', label: 'dsh', x: 785, y: 490, width: 300 },
    ],
    links: [{ from: 'training', to: 'claude' }, { from: 'training', to: 'opencode' },
      { from: 'training', to: 'pi' }, { from: 'training', to: 'dsh' }],
  }));
  const summary = layer(frame.visual, 'ch03-summary ch03-training-summary');
  const patchTraining = relationship('Model training', 'Patch format');
  const harnessTraining = element('div', 'ch03-summary-harnesses');
  harnessTraining.append(element('h3', '', 'DeepSeek V4.1 training'));
  for (const harness of ['Claude Code', 'OpenCode', 'Pi', 'dsh']) {
    harnessTraining.append(relationship('Training', harness));
  }
  summary.append(summaryCard(ctx, '3.8.a', patchTraining), summaryCard(ctx, '3.8.b', harnessTraining));
  const takeaway = sentenceCopy(ctx, '3.8.3', 'ch03-note');
  frame.notes.append(takeaway);
  return render => {
    const complete = render.reducedMotion || render.t >= render.sentence('3.8.3').start;
    completedVisibility(stages, !complete);
    completedVisibility(summary, complete);
    showLayer(patch.el, render, '3.8.1', '3.8.2');
    showLayer(harnesses.el, render, '3.8.2');
    patchChart.render(progress(render, '3.8.1'), render.reducedMotion);
    harnessChart.render(progress(render, '3.8.2'), render.reducedMotion);
    sentenceVisibility(takeaway, render, '3.8.3');
  };
});
