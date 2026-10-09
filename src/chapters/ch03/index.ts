import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { diagram, pairedBars, scatter } from '../../kit';
import type { ChartComponent } from '../../kit/charts';
import { sceneFrame, withEvidence } from '../shared/scene';
import { element, evidence, layer, normalizeChart, progress, showLayer } from './helpers';
import { searchingScene, practitionerScene, reversalScene, trainingScene } from './closing';
import './ch03.css';

// Opening scenes retain only their unbounded layers when motion is reduced.
function showOpeningLayer(el: HTMLElement, ctx: RenderContext, start: string, end?: string): void {
  if (!ctx.reducedMotion) {
    showLayer(el, ctx, start, end);
    return;
  }
  const visible = end === undefined;
  el.style.opacity = visible ? '1' : '0';
  el.toggleAttribute('inert', !visible);
  el.setAttribute('aria-hidden', String(!visible));
}
function introductoryNote(ctx: MountContext, sentenceId: string): HTMLElement {
  const sentence = ctx.scene.sentences.find(item => item.id === sentenceId)!;
  const el = element('section', 'ch03-intro-note');
  el.append(element('p', '', sentence.text));
  withEvidence(el, { id: sentenceId, kind: 'caption', text: sentence.text, claims: sentence.claims, sources: sentence.sources, grade: 'A' }, ctx);
  return el;
}

function controlledInterfaces(): SceneModule {
  let intro: HTMLElement;
  let paired: HTMLElement;
  let ablations: HTMLElement;
  let introNote: HTMLElement;
  let firstEvidence: HTMLElement;
  let ablationEvidence: HTMLElement;
  let note: HTMLElement;
  let frozen: ChartComponent;
  let comparison: ChartComponent;
  const fills: HTMLElement[] = [];
  return {
    id: '3.1',
    mount(stage, ctx) {
      fills.length = 0;
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full' });
      frame.el.classList.add('ch03-scene');
      const visual = element('div', 'ch03-main');
      const aside = element('aside', 'ch03-aside ch03-evidence-stack');
      frame.visual.append(visual, aside);
      intro = layer(visual);
      frozen = normalizeChart(diagram({
        title: 'Keep the model fixed', condition: 'Change the interface, not the execution model', width: 1036, height: 560,
        nodes: [
          { id: 'model', label: 'GPT-4 Turbo', x: 518, y: 265, width: 260, height: 104 },
          { id: 'shell', label: 'Shell + demo', x: 205, y: 455, width: 250, height: 84 },
          { id: 'aci', label: 'SWE-agent ACI + demo', x: 800, y: 455, width: 340, height: 84 },
        ], links: [{ from: 'model', to: 'shell' }, { from: 'model', to: 'aci' }],
      }));
      intro.append(frozen.el);
      introNote = introductoryNote(ctx, '3.1.1');
      aside.append(introNote);
      paired = layer(visual);
      comparison = normalizeChart(pairedBars({
        title: 'Same model, same 300 issues', condition: 'SWE-bench Lite · demonstrations in both systems',
        width: 1036, height: 560, domain: [0, 20], axisLabel: 'Resolved issues (%)',
        pairs: [{ label: 'GPT-4 Turbo', first: { label: 'Shell + demo', value: 11, valueLabel: '11.00%' }, second: { label: 'ACI + demo', value: 18, valueLabel: '18.00%' } }],
      }));
      paired.append(comparison.el);
      firstEvidence = evidence(ctx, '3.1.a');
      aside.append(firstEvidence);
      ablations = layer(visual, 'ch03-ablations');
      const rows = [
        { title: 'Linting', before: 'Without linting', value: 15, label: '15.0%', after: 'With linting' },
        { title: 'Observation history', before: 'Full history', value: 15, label: '15.0%', after: 'Last five observations' },
        { title: 'File viewing', before: 'Full file', value: 12.7, label: '12.7%', after: '100-line window' },
        { title: 'Search', before: 'Iterative', value: 12, label: '12.0%', after: 'Summarized' },
      ];
      for (const row of rows) {
        const panel = element('section', 'ch03-ablation');
        panel.append(element('h3', '', row.title));
        for (const datum of [{ label: row.before, value: row.value, text: row.label }, { label: row.after, value: 18, text: '18.0%' }]) {
          const label = element('div', 'ch03-ablation-label');
          label.append(element('span', '', datum.label), element('strong', '', datum.text));
          const track = element('div', 'ch03-ablation-track');
          const fill = element('div', 'ch03-ablation-fill');
          fill.style.width = `${datum.value / 20 * 100}%`;
          track.append(fill);
          panel.append(label, track);
          fills.push(fill);
        }
        const axis = element('div', 'ch03-ablation-axis');
        axis.append(element('span', '', '0'), element('span', '', 'Resolved (%)'), element('span', '', '20'));
        panel.append(axis);
        ablations.append(panel);
      }
      ablationEvidence = evidence(ctx, '3.1.b');
      aside.append(ablationEvidence);
      note = element('p', 'ch03-note', 'Separate comparisons. Every bar starts at zero. These gains are not additive.');
      frame.notes.append(note);
    },
    render(ctx) {
      showOpeningLayer(intro, ctx, '3.1.1', '3.1.2');
      showOpeningLayer(introNote, ctx, '3.1.1', '3.1.2');
      showOpeningLayer(paired, ctx, '3.1.2', '3.1.3');
      showOpeningLayer(ablations, ctx, '3.1.3');
      showOpeningLayer(firstEvidence, ctx, '3.1.2');
      showOpeningLayer(ablationEvidence, ctx, '3.1.3');
      showOpeningLayer(note, ctx, '3.1.4');
      frozen.render(progress(ctx, '3.1.1'), ctx.reducedMotion);
      comparison.render(progress(ctx, '3.1.2'), ctx.reducedMotion);
      const p = progress(ctx, '3.1.3');
      fills.forEach(fill => { fill.style.transform = `scaleX(${p})`; });
      firstEvidence.style.transform = `translateX(${ctx.reducedMotion ? 0 : 8 * (1 - progress(ctx, '3.1.5'))}px)`;
    },
  };
}

function actionSpaces(): SceneModule {
  let composed: HTMLElement;
  let composition: HTMLElement;
  let atomic: HTMLElement;
  let leftChart: ChartComponent;
  let rightChart: ChartComponent;
  let actionDiagram: ChartComponent;
  let note: HTMLElement;
  return {
    id: '3.2',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full' });
      frame.el.classList.add('ch03-scene');
      const columns = element('div', 'ch03-two-protocols');
      frame.visual.append(columns);
      composed = element('section', 'ch03-protocol');
      const right = element('div', 'ch03-protocol ch03-positioned');
      columns.append(composed, right);
      leftChart = normalizeChart(pairedBars({
        title: 'Composed tool tasks', condition: 'M³ToolEval · 82 tasks · zero-shot · max 10 turns',
        width: 864, height: 380, domain: [0, 100], axisLabel: 'Success (%)',
        pairs: [{ label: 'Action', first: { label: 'JSON', value: 52.4, valueLabel: '52.4%' }, second: { label: 'Python', value: 74.4, valueLabel: '74.4%' } }],
      }));
      composed.append(leftChart.el, evidence(ctx, '3.2.a'));
      composition = layer(right, 'ch03-protocol');
      actionDiagram = normalizeChart(diagram({
        title: 'More work inside one turn', condition: 'Code actions can compose tools', width: 864, height: 500,
        nodes: [
          { id: 'code', label: 'Python action', x: 170, y: 295, width: 230, height: 92 },
          { id: 'loop', label: 'Loops + variables', x: 490, y: 210, width: 300, height: 92 },
          { id: 'tools', label: 'Composed tool calls', x: 650, y: 390, width: 320, height: 92 },
        ], links: [{ from: 'code', to: 'loop' }, { from: 'loop', to: 'tools' }],
      }));
      composition.append(actionDiagram.el);
      atomic = layer(right, 'ch03-protocol');
      rightChart = normalizeChart(pairedBars({
        title: 'Atomic calls', condition: 'API-Bank · level 1 · no composition advantage',
        width: 864, height: 380, domain: [0, 100], axisLabel: 'Success (%)',
        pairs: [{ label: 'Action', first: { label: 'JSON', value: 82.7, valueLabel: '82.7%' }, second: { label: 'Code', value: 76.7, valueLabel: '76.7%' } }],
      }));
      atomic.append(rightChart.el, evidence(ctx, '3.2.b'));
      note = element('p', 'ch03-note', 'Separate benchmarks, separate axes. The action space changes which interface wins.');
      frame.notes.append(note);
    },
    render(ctx) {
      showOpeningLayer(composed, ctx, '3.2.1');
      showOpeningLayer(composition, ctx, '3.2.2', '3.2.3');
      showOpeningLayer(atomic, ctx, '3.2.3');
      showOpeningLayer(note, ctx, '3.2.3');
      leftChart.render(progress(ctx, '3.2.1'), ctx.reducedMotion);
      actionDiagram.render(progress(ctx, '3.2.2'), ctx.reducedMotion);
      rightChart.render(progress(ctx, '3.2.3'), ctx.reducedMotion);
    },
  };
}

function complexityAndCost(): SceneModule {
  let intro: HTMLElement;
  let introEvidence: HTMLElement;
  let hal: HTMLElement;
  let halEvidence: HTMLElement;
  let terminalEvidence: HTMLElement;
  let note: HTMLElement;
  let workflow: ChartComponent;
  let costs: ChartComponent;
  let circles: SVGCircleElement[];
  let aside: HTMLElement;
  let retainedAgentless: HTMLElement;
  return {
    id: '3.3',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full' });
      frame.el.classList.add('ch03-scene');
      const visual = element('div', 'ch03-cost-main');
      aside = element('aside', 'ch03-cost-aside');
      frame.visual.append(visual, aside);
      intro = layer(visual);
      workflow = normalizeChart(diagram({
        title: 'Agentless: prescribed workflow', condition: 'Localization → repair → validation', width: 1160, height: 616,
        nodes: [
          { id: 'locate', label: 'Localization', x: 200, y: 330, width: 280, height: 120 },
          { id: 'repair', label: 'Repair', x: 580, y: 330, width: 220, height: 120 },
          { id: 'validate', label: 'Validation', x: 950, y: 330, width: 280, height: 120 },
        ], links: [{ from: 'locate', to: 'repair' }, { from: 'repair', to: 'validate' }],
      }));
      intro.append(workflow.el);
      introEvidence = evidence(ctx, '3.3.a');
      aside.append(introEvidence);
      hal = layer(visual);
      costs = normalizeChart(scatter({
        title: 'HAL Table A23 · only four supplied systems', condition: 'SWE-bench Verified Mini · 50 tasks · best run', width: 1160, height: 616,
        costAxis: 'Whole-evaluation cost ($)', successAxis: 'Best-run accuracy (%)', costDomain: [0, 450], successDomain: [0, 60],
        points: [
          { label: 'GPT-4.1 · HAL Generalist', cost: 51.8, success: 2, costLabel: '$51.80', successLabel: '2.0%', color: '#75b9ec', labelDx: 30, labelDy: -32 },
          { label: 'GPT-4.1 · SWE-Agent', cost: 393.65, success: 44, costLabel: '$393.65', successLabel: '44.0%', color: '#75b9ec', labelDx: -28, labelDy: 14 },
          { label: 'GPT-5 Medium · HAL Generalist', cost: 57.58, success: 12, costLabel: '$57.58', successLabel: '12.0%', color: '#eab77b', labelDx: 30, labelDy: -76 },
          { label: 'GPT-5 Medium · SWE-Agent', cost: 162.93, success: 46, costLabel: '$162.93', successLabel: '46.0%', color: '#eab77b', labelDx: 22, labelDy: -50 },
        ],
      }));
      circles = [...costs.el.querySelectorAll('circle')];
      hal.append(costs.el);
      halEvidence = evidence(ctx, '3.3.b');
      terminalEvidence = evidence(ctx, '3.3.c');
      terminalEvidence.classList.add('ch03-separate-study');
      aside.append(halEvidence, terminalEvidence);
      retainedAgentless = evidence(ctx, '3.3.a');
      retainedAgentless.classList.add('ch03-retained-agentless');
      aside.append(retainedAgentless);
      note = element('p', 'ch03-note', 'Accuracy and cost describe complete systems. They are best runs, not means or single-tool effects.');
      frame.notes.append(note);
    },
    render(ctx) {
      const complete = ctx.reducedMotion || ctx.t >= ctx.sentence('3.3.5').start;
      aside.classList.toggle('ch03-cost-complete', complete);
      showOpeningLayer(intro, ctx, '3.3.1', '3.3.2');
      showOpeningLayer(introEvidence, ctx, '3.3.1', '3.3.2');
      showOpeningLayer(hal, ctx, '3.3.2');
      showOpeningLayer(halEvidence, ctx, '3.3.2');
      showOpeningLayer(terminalEvidence, ctx, '3.3.4');
      showOpeningLayer(retainedAgentless, ctx, '3.3.5');
      showOpeningLayer(note, ctx, '3.3.3');
      workflow.render(progress(ctx, '3.3.1'), ctx.reducedMotion);
      costs.render(progress(ctx, '3.3.2'), ctx.reducedMotion);
      const emphasizeSecond = complete;
      circles.forEach((circle, index) => {
        circle.setAttribute('stroke', emphasizeSecond && index >= 2 ? '#eef3fa' : '#162235');
        circle.setAttribute('stroke-width', emphasizeSecond && index >= 2 ? '4' : '2');
      });
    },
  };
}

function signalNotSize(): SceneModule {
  let positions: HTMLElement;
  let positionEvidence: HTMLElement;
  let columns: HTMLElement;
  let memory: HTMLElement;
  let appworld: HTMLElement;
  let memoryChart: ChartComponent;
  let appworldChart: ChartComponent;
  let highlight: HTMLElement;
  let note: HTMLElement;
  let retainedPosition: HTMLElement;
  return {
    id: '3.4',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full' });
      frame.el.classList.add('ch03-scene');
      positions = layer(frame.visual, 'ch03-position-study');
      positions.append(element('h3', '', 'Where the useful evidence sits'));
      const strip = element('div', 'ch03-position-strip');
      for (const label of ['Beginning', 'Middle', 'End']) {
        const section = element('div', 'ch03-context-zone');
        section.append(element('span', '', label));
        const lines = element('div', 'ch03-context-lines');
        lines.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 5; i++) lines.append(element('span'));
        section.append(lines);
        strip.append(section);
      }
      highlight = element('div', 'ch03-position-highlight', 'Relevant evidence');
      strip.append(highlight);
      positions.append(strip, element('p', 'ch03-position-caption', 'Position is a study variable — this is not an accuracy curve.'));
      positionEvidence = evidence(ctx, '3.4.a');
      positions.append(positionEvidence);
      columns = layer(frame.visual, 'ch03-two-protocols');
      memory = element('section', 'ch03-protocol');
      appworld = element('section', 'ch03-protocol');
      columns.append(memory, appworld);
      memoryChart = normalizeChart(pairedBars({
        title: 'Curated memory · Game of 24', condition: 'GPT-4o · 100 sequential tasks · narrow arithmetic', width: 864, height: 300,
        domain: [0, 100], axisLabel: 'Success (%)',
        pairs: [{ label: 'Memory', first: { label: 'DC-empty', value: 19, valueLabel: '19%' }, second: { label: 'DC-RS', value: 99, valueLabel: '99%' } }],
      }));
      memory.append(memoryChart.el, evidence(ctx, '3.4.b'));
      appworldChart = normalizeChart(pairedBars({
        title: 'Offline context adaptation · AppWorld', condition: 'DeepSeek-V3.1-671B · labeled training examples', width: 864, height: 300,
        domain: [0, 100], axisLabel: 'Four-metric average',
        pairs: [{ label: 'Context', first: { label: 'ReAct', value: 42.4, valueLabel: '42.4' }, second: { label: 'ACE + labels', value: 59.4, valueLabel: '59.4' } }],
      }));
      appworld.append(appworldChart.el, evidence(ctx, '3.4.c'));
      columns.classList.add('ch03-signal-panels');
      retainedPosition = evidence(ctx, '3.4.a');
      retainedPosition.classList.add('ch03-retained-position');
      frame.visual.append(retainedPosition);
      note = element('p', 'ch03-note', 'Select useful evidence. Neither “always shrink” nor “always retain” is a universal policy.');
      withEvidence(note, { id: '3.4.takeaway', kind: 'caption', text: note.textContent!, claims: ['C03-T2', 'C03-N28'] }, ctx);
      frame.notes.append(note);
    },
    render(ctx) {
      showOpeningLayer(positions, ctx, '3.4.1', '3.4.2');
      showOpeningLayer(columns, ctx, '3.4.2');
      showOpeningLayer(memory, ctx, '3.4.2');
      showOpeningLayer(appworld, ctx, '3.4.3');
      showOpeningLayer(retainedPosition, ctx, '3.4.4');
      showOpeningLayer(note, ctx, '3.4.4');
      memoryChart.render(progress(ctx, '3.4.2'), ctx.reducedMotion);
      appworldChart.render(progress(ctx, '3.4.3'), ctx.reducedMotion);
      highlight.style.transform = `translateX(${ctx.reducedMotion ? 1056 : 1056 * ctx.progress('3.4.1')}px)`;
    },
  };
}

const chapter: ChapterModule = {
  id: 'ch03',
  scenes: {
    '3.1': controlledInterfaces(),
    '3.2': actionSpaces(),
    '3.3': complexityAndCost(),
    '3.4': signalNotSize(),
    '3.5': searchingScene,
    '3.6': practitionerScene,
    '3.7': reversalScene,
    '3.8': trainingScene,
  },
};
export default chapter;
