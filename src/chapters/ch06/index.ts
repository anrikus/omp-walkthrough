import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { pairedBars, ease } from '../../kit';
import { sceneFrame, withEvidence, reveal as sharedReveal } from '../shared/scene';
import './scene.css';

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function item(ctx: MountContext, id: string, className = ''): HTMLElement {
  const value = ctx.onScreen(id);
  const node = el('section', `ng-evidence ${className}`);
  node.dataset.onScreen = id;
  node.append(el('p', 'ng-copy', value.text));
  withEvidence(node, value, ctx);
  return node;
}

function box(title: string, detail?: string, className = ''): HTMLElement {
  const node = el('section', `ng-box ${className}`);
  node.append(el('h3', '', title));
  if (detail) node.append(el('p', '', detail));
  return node;
}

function progress(ctx: RenderContext, id: string): number {
  return ctx.reducedMotion ? 1 : ease(Math.min(1, ctx.progress(id) * 3));
}

function reveal(node: HTMLElement, p: number, reducedMotion: boolean): void {
  sharedReveal(node, p, reducedMotion);
  node.toggleAttribute('inert', !reducedMotion && p === 0);
}

function visible(node: HTMLElement, show: boolean): void {
  node.style.opacity = show ? '1' : '0';
  node.toggleAttribute('inert', !show);
  node.setAttribute('aria-hidden', String(!show));
}

function canvas(ctx: MountContext, stage: HTMLElement, layout: 'full' | 'split' = 'full') {
  const frame = sceneFrame(stage, { title: ctx.scene.title, layout, date: '2026-10-08' });
  frame.el.classList.add('ng-scene');
  return frame;
}

function composition(): SceneModule {
  let plugins: HTMLElement[] = [];
  let registration: HTMLElement;
  let oldAdapter: HTMLElement;
  let newAdapter: HTMLElement;
  let captions: HTMLElement[] = [];
  return {
    id: '6.1',
    mount(stage, ctx) {
      const frame = canvas(ctx, stage, 'split');
      const shell = el('div', 'ng-runtime');
      shell.append(el('h3', 'ng-runtime-title', 'Cordis runtime'));
      const rail = el('div', 'ng-plugin-rail');
      plugins = ['Loop', 'Model adapter', 'Tools', 'Session storage'].map((title) => box(title, 'Replaceable plugin', 'ng-plugin'));
      plugins.forEach((plugin) => rail.append(plugin));
      oldAdapter = el('div', 'ng-adapter', 'Model adapter');
      newAdapter = el('div', 'ng-adapter ng-adapter-new', 'Replacement adapter');
      const swap = el('div', 'ng-swap');
      swap.append(oldAdapter, newAdapter);
      plugins[1]!.replaceChildren(swap, el('p', '', 'Replaceable plugin'));
      registration = box('Runtime registrations', 'Registrations reverse; external undo is not guaranteed', 'ng-registration');
      shell.append(rail, registration);
      frame.visual.append(shell);
      captions = ['6.1.a', '6.1.b', '6.1.c'].map((id) => item(ctx, id));
      frame.aside!.append(...captions);
      frame.notes.append(el('p', '', 'Architecture schematic · replacement does not mean external undo'));
    },
    render(ctx) {
      const build = progress(ctx, '6.1.1');
      plugins.forEach((plugin, index) => {
        const p = ctx.reducedMotion ? 1 : Math.max(0, Math.min(1, build * 4 - index));
        plugin.style.opacity = String(p);
        plugin.style.transform = `translateX(${(1 - p) * -44}px)`;
      });
      const swap = progress(ctx, '6.1.2');
      oldAdapter.style.opacity = String(1 - swap);
      oldAdapter.style.transform = `translateX(${swap * 65}px)`;
      newAdapter.style.opacity = String(swap);
      newAdapter.style.transform = `translateX(${(1 - swap) * -65}px)`;
      reveal(captions[0]!, progress(ctx, '6.1.1'), ctx.reducedMotion);
      reveal(captions[1]!, progress(ctx, '6.1.3'), ctx.reducedMotion);
      reveal(captions[2]!, progress(ctx, '6.1.4'), ctx.reducedMotion);
      reveal(registration, progress(ctx, '6.1.5'), ctx.reducedMotion);
    },
  };
}

function training(): SceneModule {
  let harnesses: HTMLElement[] = [];
  let flow: HTMLElement;
  let boundary: HTMLElement;
  let normalized: HTMLElement;
  let fact: HTMLElement;
  return {
    id: '6.2',
    mount(stage, ctx) {
      const frame = canvas(ctx, stage);
      const main = el('div', 'ng-training');
      const sandbox = el('section', 'ng-sandbox');
      sandbox.append(el('h3', '', 'Actual scaffolds + tools in sandboxes'));
      const inputs = el('div', 'ng-harnesses');
      harnesses = ['Claude Code versions', 'OpenCode', 'Pi', 'dsh Standard / PTC'].map((title) => box(title));
      inputs.append(...harnesses);
      sandbox.append(inputs);
      flow = el('div', 'ng-flow', '→');
      flow.setAttribute('aria-hidden', 'true');
      normalized = box('Common training format', 'Worker normalizes interactions', 'ng-normalized');
      const rl = box('Reinforcement learning', 'Interface diversity', 'ng-rl');
      main.append(sandbox, flow, normalized, el('div', 'ng-flow', '→'), rl);
      boundary = box('Training / evaluation overlap', 'Not every evaluated harness is established as held out', 'ng-boundary');
      fact = item(ctx, '6.2.a');
      frame.visual.append(main, boundary, fact);
      frame.notes.append(el('p', '', 'A wider training distribution is not proof of robustness to every unseen interface.'));
    },
    render(ctx) {
      const p = progress(ctx, '6.2.1');
      harnesses.forEach((node, i) => {
        const local = ctx.reducedMotion ? 1 : Math.max(0, Math.min(1, p * 4 - i));
        node.style.opacity = String(local);
        node.style.transform = `translateX(${(1 - local) * -60}px)`;
      });
      reveal(fact, p, ctx.reducedMotion);
      reveal(boundary, progress(ctx, '6.2.2'), ctx.reducedMotion);
      reveal(normalized, progress(ctx, '6.2.3'), ctx.reducedMotion);
      flow.style.transform = `translateX(${ctx.reducedMotion ? 0 : ctx.progress('6.2.3') * 32}px)`;
    },
  };
}

interface CompactPlot {
  el: HTMLElement;
  bars: HTMLElement[];
}

function percentageAxis(): HTMLElement {
  const axis = el('p', 'ng-axis');
  axis.append(el('span', '', '0%'), el('span', '', '100%'));
  return axis;
}

// Independent panels retain their own labelled protocol and percentage axis.
function plot(title: string, metric: string, rows: Array<[string, number]>, ctx: MountContext, claimId: string): CompactPlot {
  const panel = el('section', 'ng-plot');
  panel.append(el('h3', '', title), el('p', 'ng-metric', metric));
  const list = el('ul', 'ng-bars');
  const bars: HTMLElement[] = [];
  rows.forEach(([label, value]) => {
    const row = el('li', 'ng-bar-row');
    const track = el('div', 'ng-bar-track');
    const bar = el('span', 'ng-bar-fill');
    bar.style.width = `${value}%`;
    bar.setAttribute('aria-hidden', 'true');
    track.append(bar);
    row.append(el('span', '', label), track, el('span', 'ng-value', `${value}%`));
    list.append(row);
    bars.push(bar);
  });
  panel.append(list, percentageAxis(), item(ctx, claimId, 'ng-plot-evidence'));
  return { el: panel, bars };
}

function evidenceSummary(ctx: MountContext): HTMLElement {
  const summary = el('div', 'ng-layer ng-summary ng-evidence-summary');
  const vendor = el('section', 'ng-summary-vendor');
  const multiples = el('div', 'ng-summary-multiples');
  const sentenceCase = (text: string): string => text.charAt(0) + text.slice(1).toLowerCase();
  const barRow = (label: string, value: string, alternate = false): HTMLElement => {
    const row = el('li', 'ng-summary-bar-row');
    const track = el('span', 'ng-bar-track');
    const bar = el('span', `ng-bar-fill${alternate ? ' ng-bar-alt' : ''}`);
    bar.style.width = `${value}%`;
    track.setAttribute('aria-hidden', 'true');
    track.append(bar);
    row.append(el('span', '', label), track, el('strong', 'ng-value', `${value}%`));
    return row;
  };

  for (const id of ['6.3.a', '6.3.b']) {
    const value = ctx.onScreen(id);
    const [provenance, benchmark, results, conditions] = value.text.split(' · ');
    const [metric, scores] = results.split(': ');
    const panel = el('section', 'ng-summary-plot');
    panel.dataset.onScreen = id;
    panel.append(el('p', 'ng-summary-provenance', sentenceCase(provenance)), el('h3', '', benchmark), el('p', 'ng-summary-metric', metric));
    const bars = el('ul', 'ng-summary-bars');
    for (const score of scores.split(/ \/ |; /)) {
      const separator = score.lastIndexOf(' ');
      bars.append(barRow(score.slice(0, separator), score.slice(separator + 1)));
    }
    panel.append(bars, percentageAxis(), el('p', 'ng-summary-condition', conditions));
    withEvidence(panel, value, ctx);
    multiples.append(panel);
  }
  vendor.append(multiples, item(ctx, '6.3.c', 'ng-summary-builds'));

  const value = ctx.onScreen('6.3.d');
  const [provenance, models, benchmark, report] = value.text.split(' · ');
  const resultsEnd = report.indexOf('. Three runs, ');
  const [metric, scores] = report.slice(0, resultsEnd).split(': ');
  const [conditions, warning] = report.slice(resultsEnd + 2).split('. DIFFERENT ');
  const labels = metric.slice(metric.lastIndexOf(', ') + 2).split('/');
  const independent = el('section', 'ng-summary-plot ng-summary-independent');
  independent.dataset.onScreen = value.id;
  independent.append(el('p', 'ng-summary-provenance', sentenceCase(provenance)), el('h3', '', benchmark), el('p', 'ng-summary-metric', `${models} · ${metric}`));
  const pairs = el('div', 'ng-summary-pairs');
  for (const score of scores.split('; ')) {
    const separator = score.lastIndexOf(' ');
    const values = score.slice(separator + 1).split('/');
    const pair = el('section', 'ng-summary-pair');
    const bars = el('ul', 'ng-summary-bars');
    bars.append(barRow(labels[0], values[0]), barRow(labels[1], values[1], true));
    pair.append(el('h4', '', score.slice(0, separator)), bars);
    pairs.append(pair);
  }
  independent.append(pairs, percentageAxis(), el('p', 'ng-summary-condition', `${conditions}.`), el('p', 'ng-summary-protocol-warning', sentenceCase(`DIFFERENT ${warning}`)));
  withEvidence(independent, value, ctx);
  summary.append(vendor, independent);
  return summary;
}

function reasoningSummary(ctx: MountContext): HTMLElement {
  const summary = el('div', 'ng-layer ng-summary ng-reasoning-summary');
  const roles = el('section', 'ng-summary-roles');
  roles.append(el('h3', '', 'DeepSeek-V3.2 · role lanes'));
  roles.append(box('Tool result → role: tool', 'Earlier reasoning retained during tool interactions'));
  roles.append(box('Tool result → role: user', 'Earlier reasoning can be discarded', 'ng-user-lane'));
  roles.append(item(ctx, '6.4.a'));
  const ablation = plot('MiniMax-M2', 'First-party ablation · SWE-bench Verified · resolved (%)', [['Retain thinking', 69.4], ['Discard thinking', 67.2]], ctx, '6.4.b');
  summary.append(roles, ablation.el);
  return summary;
}

function directionsSummary(ctx: MountContext): HTMLElement {
  const summary = el('div', 'ng-layer ng-summary ng-directions-summary');
  const learning = el('section', 'ng-summary-direction');
  learning.append(el('h3', '', 'Learning'), box('Weights / memory / skills', 'Prime refines memory and skills with fixed model weights'), item(ctx, '6.5.a'));
  const recovery = el('section', 'ng-summary-direction');
  recovery.append(el('h3', '', 'Durable execution'), box('UI lifecycle ≠ recovery', 'External event histories survive beyond the interface'), item(ctx, '6.5.b'));
  const protocols = el('section', 'ng-summary-direction');
  protocols.append(el('h3', '', 'Protocol boundaries'), box('Client —ACP→ agent', 'App —A2A→ independent app'), item(ctx, '6.5.c'), box('Internal scheduling stays inside', undefined, 'ng-summary-warning'));
  summary.append(learning, recovery, protocols);
  return summary;
}

function evidencePanels(): SceneModule {
  let vendor: HTMLElement;
  let independent: HTMLElement;
  let summary: HTMLElement;
  let vendorBars: HTMLElement[] = [];
  let independentBars: HTMLElement[] = [];
  return {
    id: '6.3',
    mount(stage, ctx) {
      const frame = canvas(ctx, stage);
      const layers = el('div', 'ng-layers');
      vendor = el('div', 'ng-layer ng-vendor');
      const multiples = el('div', 'ng-multiples');
      const deep = plot('DeepSWE v1.1', 'Vendor technical report · resolved (%)', [['DSH Minimal', 72.6], ['Standard', 70.5], ['PTC', 67.6], ['mini-SWE', 74.2]], ctx, '6.3.a');
      const terminal = plot('Terminal-Bench v2.1', 'Vendor technical report · pass@1 (%)', [['DSH Minimal', 90.6], ['Standard', 85.8], ['PTC', 85.8], ['mini-SWE', 90.3]], ctx, '6.3.b');
      vendorBars = [...deep.bars, ...terminal.bars];
      multiples.append(deep.el, terminal.el);
      vendor.append(multiples, item(ctx, '6.3.c', 'ng-builds'));
      independent = el('div', 'ng-layer ng-independent');
      independent.append(el('h3', 'ng-independent-title', 'Independent counterpoint · not a replication'));
      const comparison = el('div', 'ng-claw');
      const models = [['V4.1-Flash', 76.5, 81.7], ['GLM5.1', 69.1, 73.1], ['Qwen3.6-flash', 56.8, 62.8]] as const;
      independentBars = [];
      models.forEach(([name, dsh, hermes]) => {
        const panel = box(name, 'Claw-SWE-Bench full-350 · mean pass@1 (%)', 'ng-claw-model');
        for (const [label, value] of [['dsh', dsh], ['Hermes', hermes]] as const) {
          const row = el('div', 'ng-independent-row');
          const track = el('div', 'ng-bar-track');
          const bar = el('span', `ng-bar-fill ${label === 'Hermes' ? 'ng-bar-alt' : ''}`);
          bar.style.width = `${value}%`;
          bar.setAttribute('aria-hidden', 'true');
          track.append(bar);
          row.append(el('span', '', label), track, el('strong', '', `${value}%`));
          panel.append(row);
          independentBars.push(bar);
        }
        panel.append(percentageAxis());
        comparison.append(panel);
      });
      independent.append(comparison, item(ctx, '6.3.d'));
      summary = evidenceSummary(ctx);
      layers.append(vendor, independent, summary);
      frame.visual.append(layers);
      frame.notes.append(el('p', '', 'Separate benchmarks. Separate protocols. No pooled ranking, shared comparison axis, or replication claim.'));
    },
    render(ctx) {
      const completed = ctx.reducedMotion || ctx.t >= ctx.sentence('6.3.4').start;
      const isIndependent = ctx.t >= ctx.sentence('6.3.3').start;
      visible(vendor, !completed && !isIndependent);
      visible(independent, !completed && isIndependent);
      visible(summary, completed);
      const p = progress(ctx, '6.3.1');
      vendorBars.forEach((bar, i) => {
        const isMini = i % 4 === 3;
        const amount = isMini ? progress(ctx, '6.3.2') : p;
        bar.style.transform = `scaleX(${amount})`;
      });
      independentBars.forEach((bar) => { bar.style.transform = `scaleX(${progress(ctx, '6.3.3')})`; });
    },
  };
}

function reasoning(): SceneModule {
  let lanes: HTMLElement;
  let comparison: HTMLElement;
  let summary: HTMLElement;
  let packet: HTMLElement;
  let discarded: HTMLElement;
  let chart: ReturnType<typeof pairedBars>;
  return {
    id: '6.4',
    mount(stage, ctx) {
      const frame = canvas(ctx, stage);
      const layers = el('div', 'ng-layers');
      lanes = el('div', 'ng-layer ng-roles');
      lanes.append(el('h3', '', 'DeepSeek-V3.2 · message-role protocol'));
      const tool = el('div', 'ng-message-lane');
      tool.append(box('Tool result'), el('span', 'ng-lane-role', 'role: tool'), box('Earlier reasoning', 'Retained during tool interactions'));
      const user = el('div', 'ng-message-lane ng-user-lane');
      discarded = box('Earlier reasoning', 'Can be discarded', 'ng-discarded');
      user.append(box('Tool result'), el('span', 'ng-lane-role', 'role: user'), discarded);
      packet = el('span', 'ng-packet', 'Message');
      tool.append(packet);
      lanes.append(tool, user, item(ctx, '6.4.a'));
      comparison = el('div', 'ng-layer ng-reasoning-comparison');
      chart = pairedBars({ title: 'MiniMax-M2', condition: 'First-party ablation · 2025-11-03', axisLabel: 'SWE-bench Verified · resolved (%)', domain: [0, 100], width: 1040, height: 490,
        pairs: [{ label: 'Thinking', first: { label: 'retain', value: 69.4, valueLabel: '69.4%' }, second: { label: 'discard', value: 67.2, valueLabel: '67.2%' } }],
      });
      chart.el.querySelectorAll('text').forEach((text) => {
        const size = Number(text.getAttribute('font-size'));
        if (size < 22) text.setAttribute('font-size', '24');
      });
      comparison.append(chart.el, item(ctx, '6.4.b'));
      summary = reasoningSummary(ctx);
      layers.append(lanes, comparison, summary);
      frame.visual.append(layers);
      frame.notes.append(el('p', '', 'Model- and version-specific interface semantics · do not generalize one retention policy to every model.'));
    },
    render(ctx) {
      const completed = ctx.reducedMotion || ctx.progress('6.4.2') >= 0.7;
      const second = ctx.t >= ctx.sentence('6.4.2').start;
      visible(lanes, !completed && !second);
      visible(comparison, !completed && second);
      visible(summary, completed);
      const p = ctx.reducedMotion ? 1 : ctx.progress('6.4.1');
      packet.style.transform = `translateX(${p * 1080}px)`;
      packet.style.opacity = ctx.reducedMotion ? '0' : String(Math.sin(p * Math.PI));
      discarded.style.opacity = String(1 - p * 0.5);
      chart.render(progress(ctx, '6.4.2'), ctx.reducedMotion);
    },
  };
}

function directions(): SceneModule {
  let learning: HTMLElement;
  let durability: HTMLElement;
  let protocols: HTMLElement;
  let summary: HTMLElement;
  let exploit: HTMLElement;
  let memory: HTMLElement;
  let recovery: HTMLElement;
  let external: HTMLElement;
  let protocolDot: HTMLElement;
  return {
    id: '6.5',
    mount(stage, ctx) {
      const frame = canvas(ctx, stage);
      const layers = el('div', 'ng-layers');
      learning = el('div', 'ng-layer ng-learning');
      const meanings = el('div', 'ng-three');
      const weights = box('Weight training', 'Changes the model', 'ng-muted-box');
      memory = box('Memory + instructions', 'Refinement with fixed weights');
      const skills = box('Executable skills', 'Refinement with fixed weights');
      meanings.append(weights, memory, skills);
      exploit = box('A retained exploit', 'A reported case — not a success-rate estimate', 'ng-warning');
      learning.append(meanings, exploit, item(ctx, '6.5.a'));
      durability = el('div', 'ng-layer ng-durability');
      const modes = el('div', 'ng-three');
      const detach = box('Interface disconnects', 'Prime: UI-detached work');
      recovery = box('Worker crashes', 'Anthropic: restart the harness from an external event log');
      external = box('Durable waits', 'Temporal: event histories around an existing inner harness');
      modes.append(detach, recovery, external);
      durability.append(modes, el('div', 'ng-recovery-rail', 'Interface lifecycle  ≠  durable execution'), item(ctx, '6.5.b'));
      protocols = el('div', 'ng-layer ng-protocols');
      const boundary = el('div', 'ng-protocol-grid');
      const client = box('User-facing client');
      const app = box('Agentic application', 'Internal scheduling stays inside', 'ng-application');
      app.append(el('div', 'ng-internal', 'Agent · subagents · scheduler'));
      const other = box('Independent application');
      boundary.append(client, el('div', 'ng-protocol-label', 'ACP →'), app, el('div', 'ng-protocol-label', 'A2A →'), other);
      protocolDot = el('span', 'ng-protocol-dot');
      protocolDot.setAttribute('aria-hidden', 'true');
      boundary.append(protocolDot);
      protocols.append(boundary, item(ctx, '6.5.c'));
      summary = directionsSummary(ctx);
      layers.append(learning, durability, protocols, summary);
      frame.visual.append(layers);
      frame.notes.append(el('p', '', 'Composition · training · persistence · interoperability: no single axis establishes a universally superior harness.'));
    },
    render(ctx) {
      const completed = ctx.reducedMotion || ctx.t >= ctx.sentence('6.5.6').start;
      const durable = ctx.t >= ctx.sentence('6.5.3').start;
      const protocol = ctx.t >= ctx.sentence('6.5.5').start;
      visible(learning, !completed && !durable);
      visible(durability, !completed && durable && !protocol);
      visible(protocols, !completed && protocol);
      visible(summary, completed);
      memory.style.transform = `translateY(${(1 - progress(ctx, '6.5.1')) * 38}px)`;
      reveal(exploit, progress(ctx, '6.5.2'), ctx.reducedMotion);
      reveal(recovery, progress(ctx, '6.5.3'), ctx.reducedMotion);
      reveal(external, progress(ctx, '6.5.4'), ctx.reducedMotion);
      const p = ctx.reducedMotion ? 1 : ctx.progress('6.5.5');
      protocolDot.style.transform = `translateX(${p * 1510}px)`;
      protocolDot.style.opacity = ctx.reducedMotion ? '0' : String(Math.sin(p * Math.PI));
    },
  };
}

const chapter: ChapterModule = {
  id: 'ch06',
  scenes: { '6.1': composition(), '6.2': training(), '6.3': evidencePanels(), '6.4': reasoning(), '6.5': directions() },
};
export default chapter;
