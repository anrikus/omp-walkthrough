import type { MountContext, RenderContext, SceneModule } from '../../engine/types';
import { createTerminal, ease, ompUi, type TerminalScript, type TerminalView } from '../../kit';
import { reveal, sceneFrame, withEvidence } from '../shared/scene';
import './sessions.css';

const recreation = 'Recreation · omp 18.8.6 defaults · illustrative coupons fixture';
const statusAssumption = 'One usable Anthropic account; unchanged catalog; no competing usable chat provider or explicit model override.';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function claim(ctx: MountContext, id: string, className = ''): HTMLElement {
  const item = ctx.onScreen(id);
  const el = node('section', `ch10-session-claim ${className}`);
  el.append(node('p', 'ch10-session-copy', item.text));
  withEvidence(el, item, ctx);
  return el;
}

function terminal(ctx: MountContext, id: string, cols: number, rows: number, mode?: string): { el: HTMLElement; view: TerminalView; script: TerminalScript } {
  const item = ctx.onScreen(id);
  const sentence = ctx.sentence(item.at!);
  const view = createTerminal({ cols, rows, label: recreation });
  view.el.classList.add('ch10-session-terminal');
  const el = node('section', 'ch10-session-terminal-wrap');
  el.append(view.el);
  withEvidence(el, item, ctx);
  return {
    el,
    view,
    script: {
      cols, rows,
      duration: ctx.sentence(ctx.scene.sentences.at(-1)!.id).end + (ctx.scene.holdAfter ?? 0.8),
      events: [
        { at: 0, op: 'status', line: ompUi.statusBand({ width: cols, model: 'Opus 5.5', thinking: '◒ high', path: '/demo/coupons', mode }) },
        { at: sentence.start, op: 'type', text: item.text.replace(/^╰─ /, ''), cps: 24 },
      ],
    },
  };
}

function beat(ctx: RenderContext, id: string, start = 0, end = 0.22): number {
  if (ctx.reducedMotion) return 1;
  return Math.max(0, Math.min(1, (ctx.progress(id) - start) / (end - start)));
}

function show(el: HTMLElement, progress: number, reducedMotion = false): void {
  reveal(el, progress, reducedMotion);
  el.inert = !reducedMotion && progress === 0;
}

function rule(): HTMLElement {
  const el = node('span', 'ch10-session-route');
  el.setAttribute('aria-hidden', 'true');
  el.append(node('span', 'ch10-session-route-arrow', '→'));
  return el;
}

let memory: {
  terminal: ReturnType<typeof terminal>;
  summary: HTMLElement;
  details: HTMLElement;
  rows: HTMLTableRowElement[];
  network: HTMLElement;
  lesson: HTMLElement;
  source: HTMLElement;
  route: HTMLElement;
  sourceCode: HTMLElement;
};

export const scene104: SceneModule = {
  id: '10.4',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    frame.el.classList.add('ch10-sessions');
    const layout = node('div', 'ch10-memory-layout');
    const matrixColumn = node('div', 'ch10-memory-matrix-column');
    const sidebar = node('div', 'ch10-memory-sidebar');
    const summary = claim(ctx, '10.4.b', 'ch10-memory-summary');
    const table = node('table', 'ch10-memory-matrix');
    table.append(node('caption', 'ch10-session-small', 'Backend capability matrix · storage and processing are different questions'));
    const head = document.createElement('thead');
    const headingRow = document.createElement('tr');
    for (const label of ['Backend', 'Storage', 'Processing / tools']) {
      const th = node('th', '', label);
      th.scope = 'col';
      headingRow.append(th);
    }
    head.append(headingRow);
    const body = document.createElement('tbody');
    const rows = [
      ['off', 'Memory disabled', 'Off by default'],
      ['local', 'Local summaries', 'No structured retain/recall/reflect tools'],
      ['hindsight', 'Server backend', 'Reachable server required'],
      ['mnemopi', 'Local SQLite', 'Default smol processing may go online'],
      ['sharpshooter', 'Documented mode', 'Operational detail limited'],
    ].map(([backend, storage, processing]) => {
      const row = document.createElement('tr');
      row.dataset.backend = backend;
      const title = node('th', 'ch10-memory-backend', backend);
      title.scope = 'row';
      const capability = node('td', '', processing);
      if (backend === 'off') capability.replaceChildren(node('span', 'ch10-memory-default', processing));
      row.append(title, node('td', '', storage), capability);
      body.append(row);
      return row;
    });
    table.append(head, body);

    const sourceLane = node('div', 'ch10-memory-source-lane');
    const lesson = node('div', 'ch10-memory-lesson');
    lesson.append(node('p', 'ch10-session-small', 'Illustrative remembered lesson'), node('p', 'ch10-memory-lesson-text', 'Expiry is inclusive'));
    const route = rule();
    const source = node('div', 'ch10-memory-source');
    const sourceCode = node('code', 'ch10-session-source-code', 'return expiresAt <= now;');
    source.append(node('p', 'ch10-session-small', 'Verify current source · src/coupons.ts'), node('p', 'ch10-session-small', 'isExpired'), sourceCode);
    sourceLane.append(lesson, route, source);
    matrixColumn.append(summary, table, sourceLane);

    const term = terminal(ctx, '10.4.a', 46, 2);
    const commandNote = node('p', 'ch10-session-small', 'Command staged, not submitted. No memory-service result is being shown.');
    const details = claim(ctx, '10.4.c', 'ch10-memory-details');
    const network = node('div', 'ch10-memory-network');
    network.append(node('span', 'ch10-memory-storage', 'Local SQLite'), rule(), node('span', 'ch10-memory-processing', 'smol may use an online model'));
    sidebar.append(term.el, commandNote, details);
    sourceLane.append(network);
    layout.append(matrixColumn, sidebar);
    frame.visual.append(layout);
    frame.notes.append(node('p', 'ch10-session-footer', 'A local database is not an offline-inference guarantee. A remembered policy is a lead, not authority.'));
    frame.notes.append(node('p', 'ch10-session-footer', statusAssumption));
    memory = { terminal: term, summary, details, rows, network, lesson, source, route, sourceCode };
  },
  render(ctx) {
    memory.terminal.view.render(memory.terminal.script, ctx.t, ctx.reducedMotion);
    show(memory.summary, beat(ctx, '10.4.1'), ctx.reducedMotion);
    memory.rows.forEach((row, index) => { row.style.opacity = String(ease(beat(ctx, '10.4.1', index * 0.1, index * 0.1 + 0.2))); });
    show(memory.network, beat(ctx, '10.4.2') * (1 - beat(ctx, '10.4.3', 0.3, 0.55)));
    show(memory.details, beat(ctx, '10.4.3'), ctx.reducedMotion);
    show(memory.lesson, beat(ctx, '10.4.3', 0.55, 0.8), ctx.reducedMotion);
    show(memory.source, beat(ctx, '10.4.4', 0.25, 0.65), ctx.reducedMotion);
    memory.route.style.opacity = String(beat(ctx, '10.4.4'));
    memory.route.style.transform = `scaleX(${ease(beat(ctx, '10.4.4', 0, 0.55))})`;
    memory.sourceCode.dataset.checked = String(beat(ctx, '10.4.4', 0.6, 0.8) === 1);
  },
};

let sessions: {
  terminal: ReturnType<typeof terminal>;
  facts: HTMLElement;
  root: HTMLElement;
  inclusive: HTMLElement;
  alternative: HTMLElement;
  ancestry: HTMLElement;
  identityA: HTMLElement;
  identityB: HTMLElement;
  forkRoute: HTMLElement;
  commandNote: HTMLElement;
  pruning: HTMLElement;
  selectedLabel: HTMLElement;
};

export const scene105: SceneModule = {
  id: '10.5',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    frame.el.classList.add('ch10-sessions');
    const layout = node('div', 'ch10-tree-layout');
    const commandColumn = node('div', 'ch10-tree-commands');
    const term = terminal(ctx, '10.5.a', 50, 3);
    const forkAt = ctx.sentence('10.5.2').start;
    term.script.events.push(
      { at: forkAt, op: 'print', lines: [ompUi.prompt({ width: 50, text: '/tree' })] },
      { at: forkAt, op: 'type', text: '/fork', cps: 16 },
    );
    const commandNote = node('p', 'ch10-session-small');
    const facts = claim(ctx, '10.5.b', 'ch10-tree-facts');
    commandColumn.append(term.el, commandNote, facts);

    const diagram = node('section', 'ch10-tree-diagram');
    diagram.append(node('h3', 'ch10-session-subtitle', 'Illustrative session ancestry'));
    diagram.append(node('p', 'ch10-session-small', 'External explanation, not a recreation of the /tree selector'));
    const root = node('div', 'ch10-tree-root');
    root.append(node('strong', '', 'Checkout decision'), node('span', 'ch10-session-small', 'Session A'));
    const ancestry = node('div', 'ch10-tree-ancestry');
    ancestry.setAttribute('aria-hidden', 'true');
    const inclusive = node('div', 'ch10-tree-branch ch10-tree-inclusive');
    const selectedLabel = node('span', 'ch10-tree-selection', 'Inclusive path');
    inclusive.append(node('span', 'ch10-tree-glyph', '├─'), node('div', 'ch10-tree-branch-copy'));
    const inclusiveCopy = inclusive.lastElementChild as HTMLElement;
    inclusiveCopy.append(node('strong', '', 'Inclusive expiry'), node('code', 'ch10-session-source-code', 'expiresAt <= now'), selectedLabel);
    const alternative = node('div', 'ch10-tree-branch ch10-tree-alternative');
    alternative.append(node('span', 'ch10-tree-glyph', '└─'), node('div', 'ch10-tree-branch-copy'));
    const alternativeCopy = alternative.lastElementChild as HTMLElement;
    alternativeCopy.append(node('strong', '', 'Alternative policy'), node('span', 'ch10-session-small', 'Prior branch retained'));
    const tree = node('div', 'ch10-tree-branches');
    tree.append(root, ancestry, inclusive, alternative);
    diagram.append(tree);

    const identities = node('div', 'ch10-tree-identities');
    const identityA = node('div', 'ch10-tree-identity');
    identityA.append(node('strong', '', 'Navigate: session A'), node('p', 'ch10-session-small', 'Same identity · same session file'));
    const forkRoute = rule();
    const identityB = node('div', 'ch10-tree-identity ch10-tree-fork');
    identityB.append(node('strong', '', '/fork: session B'), node('p', 'ch10-session-small', 'New identity; new file in persistent mode'));
    identities.append(identityA, forkRoute, identityB);
    const pruning = node('p', 'ch10-tree-pruning', 'Ordinary branching preserves alternatives. Pruning and destructive rewrites can remove history.');
    diagram.append(identities, pruning);
    layout.append(commandColumn, diagram);
    frame.visual.append(layout);
    frame.notes.append(node('p', 'ch10-session-footer', 'Active context follows selected ancestry, not every branch. Navigation and forking are different operations.'));
    frame.notes.append(node('p', 'ch10-session-footer', statusAssumption));
    sessions = { terminal: term, facts, root, inclusive, alternative, ancestry, identityA, identityB, forkRoute, commandNote, pruning, selectedLabel };
  },
  render(ctx) {
    sessions.terminal.view.render(sessions.terminal.script, ctx.t, ctx.reducedMotion);
    show(sessions.root, beat(ctx, '10.5.1'), ctx.reducedMotion);
    show(sessions.inclusive, beat(ctx, '10.5.1', 0.15, 0.4), ctx.reducedMotion);
    show(sessions.alternative, beat(ctx, '10.5.1', 0.35, 0.6), ctx.reducedMotion);
    show(sessions.identityA, beat(ctx, '10.5.1', 0.55, 0.8), ctx.reducedMotion);
    show(sessions.facts, beat(ctx, '10.5.2'), ctx.reducedMotion);
    show(sessions.identityB, beat(ctx, '10.5.2', 0.3, 0.6), ctx.reducedMotion);
    sessions.forkRoute.style.opacity = String(beat(ctx, '10.5.2', 0.15, 0.3));
    sessions.forkRoute.style.transform = `scaleX(${ease(beat(ctx, '10.5.2', 0.15, 0.5))})`;
    const selected = beat(ctx, '10.5.3');
    sessions.ancestry.style.opacity = String(selected);
    sessions.ancestry.style.transform = `scaleY(${ease(selected)})`;
    sessions.inclusive.dataset.selected = String(selected > 0);
    sessions.root.dataset.selected = String(selected > 0);
    sessions.selectedLabel.textContent = selected > 0 ? 'Selected ancestry · active context' : 'Inclusive path';
    show(sessions.pruning, beat(ctx, '10.5.3', 0.5, 0.75), ctx.reducedMotion);
    sessions.commandNote.textContent = ctx.reducedMotion || ctx.t >= ctx.sentence('10.5.2').start
      ? '/fork is a separate command. The schematic shows its identity boundary; no command result is fabricated.'
      : '/tree is staged in the composer. The tree at right is an external schematic, not a fabricated selector.';
  },
};

let planning: {
  terminal: ReturnType<typeof terminal>;
  settings: HTMLElement;
  plan: HTMLElement;
  planLines: HTMLElement[];
  boundary: HTMLElement;
  prewalk: HTMLElement;
  todo: HTMLElement;
  steps: HTMLElement[];
  arrows: HTMLElement[];
  initialEdit: HTMLElement;
};

export const scene106: SceneModule = {
  id: '10.6',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    frame.el.classList.add('ch10-sessions');
    const layout = node('div', 'ch10-plan-layout');
    const terminalColumn = node('div', 'ch10-plan-terminal-column');
    const term = terminal(ctx, '10.6.a', 58, 3, '🗺 Plan');
    term.script.events.splice(1, 0, { at: 0, op: 'print', lines: ompUi.planMode({ width: 58, path: 'local://PLAN.md' }) });
    const settings = claim(ctx, '10.6.b', 'ch10-plan-settings');
    const initialEdit = node('div', 'ch10-plan-initial-edit');
    initialEdit.append(
      node('p', 'ch10-session-small', 'Illustrative initial edit · starting model'),
      node('code', 'ch10-session-source-code', 'src/coupons.ts · isExpired\nreturn expiresAt <= now;'),
      node('p', 'ch10-session-small', 'May already be changed before handoff; not an executed result.'),
    );
    terminalColumn.append(term.el, settings, initialEdit);

    const diagramColumn = node('div', 'ch10-plan-diagram-column');
    const plan = node('section', 'ch10-plan-document');
    plan.append(node('h3', 'ch10-session-subtitle', 'Synthetic coupon-change plan'));
    const list = node('ol', 'ch10-plan-list');
    const planLines = [
      'Verify the inclusive-expiry policy in current source.',
      'Keep isExpired in src/coupons.ts and its checkout caller.',
      'Review the equality-boundary change before approval.',
    ].map(text => {
      const line = node('li', '', text);
      list.append(line);
      return line;
    });
    const boundary = node('p', 'ch10-plan-review-boundary', 'Review boundary · stop before approval');
    plan.append(list, boundary);

    const item = ctx.onScreen('10.6.c');
    const [off, todoText, routeText, caveat] = item.text.split('\n');
    const prewalk = node('section', 'ch10-plan-prewalk');
    prewalk.append(node('h3', 'ch10-session-subtitle', 'Separate optional handoff schematic'));
    prewalk.append(node('p', 'ch10-plan-default', off));
    const todo = node('p', 'ch10-plan-todo', todoText);
    prewalk.append(todo);
    const flow = node('div', 'ch10-plan-flow');
    const arrows: HTMLElement[] = [];
    const steps = routeText.split(' → ').map((text, index) => {
      if (index > 0) {
        const arrow = node('span', 'ch10-plan-flow-arrow', ' → ');
        arrows.push(arrow);
        flow.append(arrow);
      }
      const step = node('span', 'ch10-plan-flow-step', text);
      flow.append(step);
      return step;
    });
    prewalk.append(flow, node('p', 'ch10-plan-caveat', caveat));
    withEvidence(prewalk, item, ctx);
    diagramColumn.append(plan, prewalk);
    layout.append(terminalColumn, diagramColumn);
    frame.visual.append(layout);
    frame.notes.append(node('p', 'ch10-session-footer', 'Review is not model routing. Prewalk is off by default; the terminal model stays Opus 5.5 throughout this recreation.'));
    frame.notes.append(node('p', 'ch10-session-footer', statusAssumption));
    planning = { terminal: term, settings, plan, planLines, boundary, prewalk, todo, steps, arrows, initialEdit };
  },
  render(ctx) {
    planning.terminal.view.render(planning.terminal.script, ctx.t, ctx.reducedMotion);
    show(planning.settings, beat(ctx, '10.6.1'), ctx.reducedMotion);
    show(planning.plan, beat(ctx, '10.6.1'), ctx.reducedMotion);
    planning.planLines.forEach((line, index) => show(line, beat(ctx, '10.6.1', 0.12 + index * 0.12, 0.32 + index * 0.12), ctx.reducedMotion));
    show(planning.boundary, beat(ctx, '10.6.1', 0.55, 0.8), ctx.reducedMotion);
    show(planning.prewalk, beat(ctx, '10.6.2'), ctx.reducedMotion);
    const flow = ctx.reducedMotion ? 1 : ctx.progress('10.6.2');
    planning.todo.dataset.active = String(flow >= 0.2);
    planning.steps.forEach((step, index) => { step.dataset.active = String(flow >= 0.3 + index * 0.2); });
    planning.arrows.forEach((arrow, index) => {
      arrow.style.transform = `scaleX(${ease(beat(ctx, '10.6.2', 0.38 + index * 0.2, 0.52 + index * 0.2))})`;
    });
    show(planning.initialEdit, beat(ctx, '10.6.2', 0.22, 0.38), ctx.reducedMotion);
    planning.initialEdit.dataset.emphasized = String(beat(ctx, '10.6.3') > 0);
  },
};
