import type { MountContext, RenderContext, SceneModule } from '../../engine/types';
import { createTerminal, ease, ompUi, statCard, type TerminalScript } from '../../kit';
import { sceneFrame, withEvidence } from '../shared/scene';
import './extensions.css';

const recreation = 'Recreation · omp 18.8.6 defaults · illustrative coupons fixture';
const statusAssumption = 'One usable Anthropic account; unchanged catalog; no competing usable chat provider or explicit model override.';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function claim(ctx: MountContext, id: string): HTMLElement {
  const item = ctx.onScreen(id);
  const el = node('section', 'ch10-ext-claim');
  el.append(node('p', 'ch10-ext-exact', item.text));
  withEvidence(el, item, ctx);
  return el;
}

function visible(el: HTMLElement, ctx: RenderContext, sentence: string): void {
  const shown = ctx.reducedMotion || ctx.t >= ctx.sentence(sentence).start;
  el.style.opacity = shown ? '1' : '0';
  el.inert = !shown;
}

function terminal(cols: number, rows: number) {
  const view = createTerminal({ cols, rows, label: recreation });
  view.el.classList.add('ch10-ext-terminal');
  return view;
}

function status(width: number): TerminalScript['events'][number] {
  return { at: 0, op: 'status', line: ompUi.statusBand({ width, model: 'Opus 5.5', thinking: '◒ high', path: '/demo/coupons' }) };
}

function anatomy(label: string, detail: string): HTMLElement {
  const el = node('section', 'ch10-ext-anatomy-node');
  el.append(node('h3', '', label), node('p', '', detail));
  return el;
}

let extensionState: {
  root: HTMLElement;
  read: HTMLElement;
  terminal: ReturnType<typeof createTerminal>;
  script: TerminalScript;
  pieces: HTMLElement[];
  bridge: HTMLElement;
  guidance: HTMLElement;
  boundary: HTMLElement;
};

export const scene107: SceneModule = {
  id: '10.7',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    const root = node('div', 'ch10-ext-anatomy');
    const read = node('section', 'ch10-ext-read');
    const view = terminal(112, 3);
    read.append(view.el);
    withEvidence(read, ctx.onScreen('10.7.a'), ctx);
    const diagram = node('div', 'ch10-ext-anatomy-row');
    const skill = anatomy('Skill', 'Instruction text');
    const tool = anatomy('Tool', 'Executable function');
    const extension = anatomy('Extension runtime', 'Capabilities + lifecycle events');
    extension.append(node('p', 'ch10-ext-detail', 'Modern hook files use this runtime'));
    const boundary = node('strong', 'ch10-ext-boundary', 'Code-trust boundary');
    extension.append(boundary);
    const bridge = anatomy('MCP bridge', 'External tools, resources, prompts');
    bridge.append(node('span', 'ch10-ext-default', 'Server instructions: on by default'));
    diagram.append(skill, tool, extension, bridge);
    const guidance = claim(ctx, '10.7.b');
    root.append(read, diagram, guidance);
    frame.visual.append(root);
    frame.notes.append(node('p', 'ch10-ext-footer', `${statusAssumption}\nExecutable integration means trusting code.`));
    extensionState = {
      root: frame.el, read, terminal: view, pieces: [skill, tool, extension], bridge, guidance, boundary,
      script: {
        cols: 112, rows: 3, duration: ctx.sentence('10.7.3').end,
        events: [status(112), { at: ctx.sentence('10.7.1').start, op: 'print', lines: ompUi.readRow({ width: 112, path: 'skill://coupon-review' }) }],
      },
    };
  },
  render(ctx) {
    const state = extensionState;
    state.terminal.render(state.script, ctx.t, ctx.reducedMotion);
    visible(state.read, ctx, '10.7.1');
    const separation = ctx.reducedMotion ? 1 : ease(ctx.progress('10.7.1'));
    state.pieces.forEach((piece, index) => {
      visible(piece, ctx, '10.7.1');
      piece.style.transform = `translateY(${(1 - separation) * (index + 1) * 4}px)`;
    });
    visible(state.bridge, ctx, '10.7.2');
    state.bridge.style.transform = `translateY(${ctx.reducedMotion ? 0 : 12 * (1 - ease(ctx.progress('10.7.2')))}px)`;
    visible(state.guidance, ctx, '10.7.2');
    visible(state.boundary, ctx, '10.7.3');
    state.boundary.style.transform = `scaleX(${ctx.reducedMotion ? 1 : 0.88 + 0.12 * ease(ctx.progress('10.7.3'))})`;
  },
  unmount() { extensionState.root.remove(); },
};

let providerState: {
  root: HTMLElement;
  count: ReturnType<typeof statCard>;
  read: HTMLElement;
  terminal: ReturnType<typeof createTerminal>;
  script: TerminalScript;
  comparison: HTMLElement;
  segments: HTMLElement[];
};

export const scene108: SceneModule = {
  id: '10.8',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    const root = node('div', 'ch10-ext-providers');
    const item = ctx.onScreen('10.8.b');
    const lineBreak = item.text.indexOf('\n');
    const count = statCard({ value: '79', label: item.text.slice(0, lineBreak), condition: item.text.slice(lineBreak + 1) });
    count.el.classList.add('ch10-ext-count');
    withEvidence(count.el, item, ctx);
    const sum = node('div', 'ch10-ext-denominator');
    const core = node('div', 'ch10-ext-core', '14 Core');
    const additional = node('div', 'ch10-ext-additional', '65 Additional IDs');
    sum.append(core, additional);
    count.el.append(sum, node('p', 'ch10-ext-count-note', 'Grouped rows split · local engines included'));
    const right = node('div', 'ch10-ext-provider-right');
    const read = node('section', 'ch10-ext-read');
    const view = terminal(55, 3);
    read.append(view.el);
    withEvidence(read, ctx.onScreen('10.8.a'), ctx);
    const comparison = claim(ctx, '10.8.c');
    comparison.classList.add('ch10-ext-comparison');
    comparison.prepend(node('h3', '', 'A nonexclusive capability'));
    right.append(read, comparison);
    root.append(count.el, right);
    frame.visual.append(root);
    frame.notes.append(node('p', 'ch10-ext-footer', `${statusAssumption}\nCredential-table breadth, not account access; provider customization is not exclusive to omp.`));
    const modelCue = ctx.sentence('10.8.1');
    providerState = {
      root: frame.el, count, read, terminal: view, comparison, segments: [core, additional],
      script: {
        cols: 55, rows: 3, duration: ctx.sentence('10.8.2').end,
        events: [status(55), { at: modelCue.start, op: 'type', text: '/model', cps: 6 / ((modelCue.end - modelCue.start) * 0.35) }],
      },
    };
  },
  render(ctx) {
    const state = providerState;
    visible(state.count.el, ctx, '10.8.1');
    visible(state.read, ctx, '10.8.1');
    state.terminal.render(state.script, ctx.t, ctx.reducedMotion);
    const progress = ctx.reducedMotion ? 1 : ease(ctx.progress('10.8.1'));
    state.segments.forEach((segment, index) => {
      segment.style.transform = `translateY(${(1 - progress) * (index + 1) * 4}px)`;
    });
    visible(state.comparison, ctx, '10.8.2');
    state.comparison.style.transform = `translateY(${ctx.reducedMotion ? 0 : -12 * (1 - ease(ctx.progress('10.8.2')))}px)`;
  },
  unmount() { providerState.root.remove(); },
};

let disclosureState: {
  root: HTMLElement;
  terminal: ReturnType<typeof createTerminal>;
  script: TerminalScript;
  boundary: HTMLElement;
  policy: HTMLElement;
  warning: HTMLElement;
  exportLine: HTMLElement;
  decisions: HTMLElement[];
  token: HTMLElement;
};

export const scene109: SceneModule = {
  id: '10.9',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    const root = node('div', 'ch10-ext-disclosure');
    const view = terminal(112, 2);
    const body = node('div', 'ch10-ext-disclosure-body');
    const left = node('div', 'ch10-ext-disclosure-left');
    const item = ctx.onScreen('10.9.a');
    const firstBreak = item.text.indexOf('\n');
    const lastBreak = item.text.lastIndexOf('\n');
    const policy = node('section', 'ch10-ext-secret-map');
    const statement = node('section', 'ch10-ext-secret-statement');
    statement.append(
      node('p', 'ch10-ext-secret-setting', item.text.slice(0, firstBreak)),
      node('p', 'ch10-ext-secret-condition', item.text.slice(firstBreak + 1, lastBreak)),
    );
    const boundary = node('section', 'ch10-ext-text-boundary');
    boundary.append(node('h3', '', 'Supported message text only'));
    const track = node('div', 'ch10-ext-substitution-track');
    const token = node('span', 'ch10-ext-substitution-token', 'DEMO_PASSWORD_NOT_REAL');
    track.append(token);
    boundary.append(track);
    const excluded = node('section', 'ch10-ext-excluded');
    excluded.append(node('h3', '', 'Excluded:'));
    const surfaces = node('ul', 'ch10-ext-excluded-surfaces');
    surfaces.setAttribute('role', 'list');
    item.text.slice(lastBreak + 1 + 'Excluded: '.length).split(' · ').forEach(surface => {
      surfaces.append(node('li', '', surface));
    });
    excluded.append(surfaces);
    withEvidence(statement, item, ctx);
    policy.append(statement, excluded, boundary);
    left.append(policy);
    const right = node('div', 'ch10-ext-disclosure-right');
    const warning = claim(ctx, '10.9.b');
    warning.classList.add('ch10-ext-warning');
    const route = node('div', 'ch10-ext-export-route');
    const exportLine = node('span', 'ch10-ext-export-line');
    exportLine.setAttribute('aria-hidden', 'true');
    route.append(node('span', '', 'Session context'), exportLine, node('strong', 'ch10-ext-stop', 'Stop: review before sharing'));
    warning.prepend(route);
    const decisions = ['Persistence', 'Execution', 'Disclosure'].map(label => node('strong', 'ch10-ext-decision', label));
    const choices = node('div', 'ch10-ext-decisions');
    choices.append(...decisions);
    right.append(warning, choices);
    body.append(left, right);
    root.append(view.el, body);
    frame.visual.append(root);
    frame.notes.append(node('p', 'ch10-ext-footer', `${statusAssumption}\nDummy text only. No export command is executed; no sharing is demonstrated.`));
    disclosureState = {
      root: frame.el, terminal: view, boundary, policy, warning, exportLine, decisions, token,
      script: {
        cols: 112, rows: 2, duration: ctx.sentence('10.9.3').end,
        events: [status(112)],
      },
    };
  },
  render(ctx) {
    const state = disclosureState;
    state.terminal.render(state.script, ctx.t, ctx.reducedMotion);
    visible(state.boundary, ctx, '10.9.1');
    visible(state.policy, ctx, '10.9.1');
    state.token.style.transform = `translateX(${ctx.reducedMotion ? 0 : -100 * (1 - ease(ctx.progress('10.9.1')))}%)`;
    visible(state.warning, ctx, '10.9.2');
    state.exportLine.style.transform = `scaleX(${ctx.reducedMotion ? 1 : ease(ctx.progress('10.9.2'))})`;
    state.decisions.forEach((decision, index) => {
      visible(decision, ctx, '10.9.3');
      decision.style.transform = `translateY(${ctx.reducedMotion ? 0 : -(1 - ease(ctx.progress('10.9.3'))) * (index + 1) * 4}px)`;
    });
  },
  unmount() { disclosureState.root.remove(); },
};
