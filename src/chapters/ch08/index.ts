import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { createTerminal, ompUi, statCard, type Line, type TerminalScript } from '../../kit';
import { sceneFrame, withEvidence } from '../shared/scene';
import './scenes.css';

type Draw = (ctx: RenderContext) => void;
const mixed = 'Recreation · omp 18.8.6 defaults · illustrative model roles, not an endorsement';
function element(tag: string, className: string, text?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function claim(ctx: MountContext, id: string, className = ''): HTMLElement {
  const item = ctx.onScreen(id);
  const el = element('section', `ch08-claim ${className}`);
  el.append(element('p', 'ch08-copy', item.text));
  withEvidence(el, item, ctx);
  return el;
}
function visible(el: HTMLElement, show: boolean): void {
  el.style.opacity = show ? '1' : '0';
  el.toggleAttribute('inert', !show);
  el.setAttribute('aria-hidden', String(!show));
}
function began(ctx: RenderContext, id: string): boolean {
  return ctx.reducedMotion || ctx.t >= ctx.sentence(id).start;
}
function progress(ctx: RenderContext, id: string): number {
  return ctx.reducedMotion ? 1 : ctx.progress(id);
}
function module(id: string, build: (stage: HTMLElement, ctx: MountContext) => Draw): SceneModule {
  let draw: Draw = () => {};
  return { id, mount(stage, ctx) { draw = build(stage, ctx); }, render(ctx) { draw(ctx); } };
}
function frame(stage: HTMLElement, ctx: MountContext) {
  const result = sceneFrame(stage, { title: ctx.scene.title, date: '2026-10-08', layout: 'full' });
  result.el.classList.add('ch08');
  return result;
}
function terminal(parent: HTMLElement, lines: Line[], cols: number, rows: number, label = mixed) {
  const view = createTerminal({ cols, rows, label });
  parent.append(view.el);
  const script: TerminalScript = { cols, rows, duration: 1, events: [{ at: 0, op: 'replace', lines }] };
  return { view, script };
}
interface FlowNode { text: string; x: number; y: number; width?: number; tone?: string; sentence?: string }
interface FlowLink { from: number; to: number; sentence: string }
function flow(parent: HTMLElement, height: number, nodes: FlowNode[], links: FlowLink[], width = 1760): Draw {
  const board = element('div', 'ch08-flow');
  board.style.height = `${height}px`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');
  board.append(svg);
  const dots = links.map(link => {
    const a = nodes[link.from]!;
    const b = nodes[link.to]!;
    const x1 = a.x + (a.width ?? 260) / 2;
    const x2 = b.x - (b.width ?? 260) / 2;
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', `M ${x1} ${a.y} C ${(x1 + x2) / 2} ${a.y}, ${(x1 + x2) / 2} ${b.y}, ${x2} ${b.y}`);
    path.setAttribute('class', 'ch08-wire');
    const dot = document.createElementNS(svg.namespaceURI, 'circle');
    dot.setAttribute('r', '7');
    dot.setAttribute('class', 'ch08-packet');
    svg.append(path, dot);
    return { dot, path, link, x1, x2, y1: a.y, y2: b.y, showAt: a.sentence ?? b.sentence };
  });
  const nodeViews = nodes.map(node => {
    const el = element('div', `ch08-node ${node.tone ?? ''}`, node.text);
    el.style.left = `${node.x / width * 100}%`;
    el.style.top = `${node.y}px`;
    el.style.width = `${node.width ?? 260}px`;
    board.append(el);
    return { el, sentence: node.sentence };
  });
  parent.append(board);
  return ctx => {
    for (const { el, sentence } of nodeViews) if (sentence) visible(el, began(ctx, sentence));
    for (const { dot, path, link, x1, x2, y1, y2, showAt } of dots) {
      path.setAttribute('opacity', !showAt || began(ctx, showAt) ? '1' : '0');
      const p = progress(ctx, link.sentence);
      const q = 1 - p;
      const middle = (x1 + x2) / 2;
      const x = q ** 3 * x1 + 3 * q * q * p * middle + 3 * q * p * p * middle + p ** 3 * x2;
      const y = q ** 3 * y1 + 3 * q * q * p * y1 + 3 * q * p * p * y2 + p ** 3 * y2;
      dot.setAttribute('transform', `translate(${x} ${y})`);
      dot.setAttribute('opacity', began(ctx, link.sentence) ? '1' : '0');
    }
  };
}

const contracts = module('8.1', (stage, ctx) => {
  const f = frame(stage, ctx);
  const layout = element('div', 'ch08-contract-layout');
  const taskInput = ctx.onScreen('8.1.b');
  const input = element('section', 'ch08-claim ch08-task-input');
  const objectText = taskInput.text
    .replace('input: {', 'input:\n{')
    .replace(', tasks: [', ',\n  tasks: [\n    ')
    .replaceAll(', task:', ',\n      task:')
    .replaceAll(', solutionSpace:', ',\n      solutionSpace:')
    .replace('}, {name:', '},\n    {name:')
    .replace('}]} · ', '}\n  ]}\n· ');
  input.append(element('pre', 'ch08-task-object', objectText));
  withEvidence(input, taskInput, ctx);
  const side = element('div', 'ch08-contract-side');
  const taskLabel = ctx.onScreen('8.1.a');
  const taskDescriptions = Array.from(ctx.onScreen('8.1.b').text.matchAll(/task: "([^"]+)"/g), match => match[1]!);
  const { view, script } = terminal(side, ompUi.task({
    width: 58, phase: 'batch', agent: 'scout', modelBadges: false,
    agents: [
      { name: 'AuthFlow', description: taskDescriptions[0]!, status: 'pending' },
      { name: 'AuthTests', description: taskDescriptions[1]!, status: 'pending' },
    ],
  }), 58, 7, taskLabel.text);
  script.events[0]!.at = ctx.sentence('8.1.2').start;
  script.duration = ctx.sentence('8.1.4').end;
  script.events.push({ at: 0, op: 'status', line: ompUi.statusBand({ width: 58, model: 'Opus 5.5', thinking: '◒ high' }) });
  withEvidence(side, taskLabel, ctx);
  const taskState = element('p', 'ch08-caption', 'Pending task input · no results or metrics');
  side.append(taskState);
  const contract = element('div', 'ch08-contract-fields');
  for (const text of ['Scope', 'Expected artifacts', 'Evidence', 'Dependencies', 'Completion criteria']) {
    contract.append(element('span', 'ch08-contract-field', text));
  }
  f.title.parentElement!.append(contract);
  layout.append(input, side);
  f.visual.append(layout);
  const drawFlow = flow(side, 170, [
    { text: 'Contract\nprinciple', x: 80, y: 85, width: 150 },
    { text: 'task\nshared context', x: 270, y: 85, width: 160 },
    { text: 'AuthFlow\nself-contained task', x: 475, y: 40, width: 190 },
    { text: 'AuthTests\nself-contained task', x: 475, y: 132, width: 190 },
    { text: 'Separate child\nhistories', x: 700, y: 85, width: 180 },
  ], [
    { from: 0, to: 1, sentence: '8.1.1' },
    { from: 1, to: 2, sentence: '8.1.3' }, { from: 1, to: 3, sentence: '8.1.3' },
    { from: 2, to: 4, sentence: '8.1.4' }, { from: 3, to: 4, sentence: '8.1.4' },
  ], 800);
  const takeaway = claim(ctx, '8.1.c', 'ch08-inline');
  f.notes.append(takeaway);
  return render => {
    visible(input, began(render, '8.1.2'));
    visible(view.el, began(render, '8.1.1'));
    visible(taskState, began(render, '8.1.2'));
    visible(contract, began(render, '8.1.4'));
    visible(takeaway, began(render, '8.1.4'));
    view.render(script, render.t, render.reducedMotion);
    drawFlow(render);
  };
});

const routing = module('8.2', (stage, ctx) => {
  const f = frame(stage, ctx);
  f.el.classList.add('ch08-routing');
  const roster = claim(ctx, '8.2.a', 'ch08-inline');
  const condition = claim(ctx, '8.2.b', 'ch08-inline');
  const recreation = claim(ctx, '8.2.d', 'ch08-recreation ch08-inline');
  const board = element('div', 'ch08-route-board');
  const columns = ['Chat roles', 'Chat roles', 'Model-kind roles'].map(label => {
    const col = element('section', 'ch08-route-column');
    col.append(element('h3', 'ch08-column-title', label));
    board.append(col);
    return col;
  });
  const selectors: HTMLElement[] = [];
  const groups = [
    [[1, 6, 9], [4]],
    [[2, 7, 8], [3, 5, 10]],
    [[11], [12], [13], [14], [15]],
  ];
  for (const [columnIndex, columnGroups] of groups.entries()) {
    for (const indices of columnGroups) {
      const group = element('section', 'ch08-model-group');
      const selector = element('h4', 'ch08-selector', ctx.onScreen(`8.2.r${indices[0]}`).text.split('  ')[1]!);
      const roles = element('div', 'ch08-model-roles');
      for (const index of indices) {
        const item = ctx.onScreen(`8.2.r${index}`);
        const row = element('section', 'ch08-claim ch08-route-row');
        row.append(element('strong', 'ch08-role-tag', item.text.split('  ')[0]!));
        withEvidence(row, item, ctx);
        roles.append(row);
      }
      selectors.push(selector);
      group.append(selector, roles);
      columns[columnIndex]!.append(group);
    }
  }
  const strings = ctx.onScreen('8.2.c');
  const statusRegion = element('section', 'ch08-status-region');
  const fragments = strings.text.split('\n');
  const fragmentLines: Line[] = [[
    { text: 'Status: ', fg: 'comment' },
    ...ompUi.statusBand({ width: 104, model: 'Opus 5.5', thinking: '◒ high' }),
  ]];
  for (const text of fragments.slice(1, 4)) {
    const prefixEnd = text.indexOf(': ') + 2;
    const [role, modelAndEffort] = text.slice(prefixEnd).split(' · ');
    const effortStart = modelAndEffort!.indexOf(' ');
    fragmentLines.push([
      { text: text.slice(0, prefixEnd), fg: 'comment' },
      { text: role!, fg: role === 'SMOL' ? 'warning' : role === 'SLOW' ? 'accent' : 'dim' },
      { text: ' · ' },
      { text: modelAndEffort!.slice(0, effortStart), fg: 'dim' },
      { text: modelAndEffort!.slice(effortStart), fg: role === 'SMOL' ? 'dim' : 'accent' },
    ]);
  }
  const { view, script } = terminal(statusRegion, fragmentLines, 112, 4, mixed);
  const statusNote = element('section', 'ch08-claim ch08-status-note');
  statusNote.append(element('p', 'ch08-caption', fragments[4]));
  withEvidence(statusNote, strings, ctx);
  statusRegion.append(statusNote);
  f.title.parentElement!.append(roster, condition);
  f.visual.append(recreation, board, statusRegion);
  f.notes.append(element('p', 'ch08-caption', 'Role routing is not a model-quality ranking. Nonchat services stay in the selector.'));
  return render => {
    visible(condition, began(render, '8.2.2'));
    visible(board, began(render, '8.2.2'));
    visible(recreation, began(render, '8.2.3'));
    for (const selector of selectors) visible(selector, began(render, '8.2.3'));
    visible(statusRegion, began(render, '8.2.4'));
    board.setAttribute('data-routing', began(render, '8.2.3') ? 'assigned' : 'roles');
    view.render(script, render.t, render.reducedMotion);
  };
});

const fanout = module('8.3', (stage, ctx) => {
  const f = frame(stage, ctx);
  const inference = claim(ctx, '8.3.a', 'ch08-inline');
  f.visual.append(inference);
  const scoutFlow = flow(f.visual, 400, [
    { text: 'Bounded\ninvestigations', x: 170, y: 110 },
    { text: 'Read-only scout\nflow / paths', x: 645, y: 55, width: 320 },
    { text: 'Read-only scout\ntests / assumptions', x: 645, y: 165, width: 320 },
    { text: 'outputSchema\nartifact references', x: 1130, y: 110, width: 340 },
    { text: 'One integration\nowner', x: 1580, y: 205, width: 300, tone: 'ch08-owner' },
    { text: 'Optional edit task', x: 170, y: 315, sentence: '8.3.2' },
    { text: 'Git workspace A', x: 685, y: 270, width: 310, sentence: '8.3.2' },
    { text: 'Git workspace B', x: 685, y: 370, width: 310, sentence: '8.3.2' },
  ], [
    { from: 0, to: 1, sentence: '8.3.1' }, { from: 0, to: 2, sentence: '8.3.1' },
    { from: 1, to: 3, sentence: '8.3.3' }, { from: 2, to: 3, sentence: '8.3.3' },
    { from: 3, to: 4, sentence: '8.3.4' },
    { from: 5, to: 6, sentence: '8.3.2' }, { from: 5, to: 7, sentence: '8.3.2' },
    { from: 6, to: 4, sentence: '8.3.4' }, { from: 7, to: 4, sentence: '8.3.4' },
  ]);
  const isolation = element('section', 'ch08-isolation');
  isolation.append(claim(ctx, '8.3.b', 'ch08-inline'));
  f.visual.append(isolation);
  f.notes.append(element('p', 'ch08-caption', 'Reconcile shared interfaces and consequential assumptions before calling the result integrated.'));
  return render => {
    visible(isolation, began(render, '8.3.2'));
    scoutFlow(render);
  };
});

const advisor = module('8.4', (stage, ctx) => {
  const f = frame(stage, ctx);
  const pages = element('div', 'ch08-pages');
  const review = element('section', 'ch08-page');
  const evalPage = element('section', 'ch08-page');
  review.append(claim(ctx, '8.4.a', 'ch08-inline'));
  const { view, script } = terminal(review, ompUi.advisor({ width: 116, notes: [{ severity: 'concern', turnsAgo: 0,
    text: 'Verify the greeting preserves empty-input behavior' }] }), 116, 4,
  'Recreation · omp 18.8.6 defaults · exception: advisor enabled; illustrative concern');
  const reviewFlow = flow(review, 210, [
    { text: 'Transcript update', x: 165, y: 100 },
    { text: 'Advisor concern', x: 650, y: 100, width: 320 },
    { text: 'Adjudication', x: 1130, y: 100, width: 300 },
    { text: 'External-check\ngate', x: 1570, y: 100, width: 300, tone: 'ch08-gate' },
  ], [{ from: 0, to: 1, sentence: '8.4.1' }, { from: 1, to: 2, sentence: '8.4.2' }, { from: 2, to: 3, sentence: '8.4.2' }]);
  review.append(element('p', 'ch08-caption', 'Additional mutating tool grants change the trust boundary. Advice is not approval.'));
  evalPage.append(claim(ctx, '8.4.b', 'ch08-inline'));
  const evalFlow = flow(evalPage, 310, [
    { text: 'completion()\nno tools / history', x: 210, y: 50, width: 350 },
    { text: 'agent()\nreal handles', x: 210, y: 260, width: 350 },
    { text: 'wait(handles)\ndependency waves', x: 675, y: 260, width: 350 },
    { text: 'workpool()\nreusable workers', x: 210, y: 155, width: 350 },
    { text: 'judge()\ntyped assessment', x: 1150, y: 155, width: 340 },
    { text: 'Factual\nverification', x: 1570, y: 155, width: 300, tone: 'ch08-gate' },
  ], [{ from: 1, to: 2, sentence: '8.4.3' }, { from: 0, to: 4, sentence: '8.4.3' },
    { from: 3, to: 4, sentence: '8.4.3' }]);
  const boundary = claim(ctx, '8.4.c', 'ch08-boundary');
  evalPage.append(boundary);
  const summary = element('section', 'ch08-page ch08-summary ch08-advisor-summary');
  for (const [id, title] of [['8.4.a', 'Advisor'], ['8.4.b', 'Eval primitives'], ['8.4.c', 'Verification boundary']]) {
    const card = claim(ctx, id!, 'ch08-summary-card');
    card.prepend(element('h3', 'ch08-summary-title', title));
    summary.append(card);
  }
  pages.append(review, evalPage, summary);
  f.visual.append(pages);
  f.notes.append(element('p', 'ch08-caption', 'A typed result stops before the factual verification gate.'));
  return render => {
    const complete = progress(render, '8.4.4') >= 0.75;
    const second = render.t >= render.sentence('8.4.3').start;
    visible(review, !complete && !second); visible(evalPage, !complete && second);
    visible(summary, complete);
    visible(boundary, began(render, '8.4.4'));
    view.render(script, render.t, render.reducedMotion);
    reviewFlow(render); evalFlow(render);
  };
});

const hub = module('8.5', (stage, ctx) => {
  const f = frame(stage, ctx);
  f.el.classList.add('ch08-hub');
  const label = ctx.onScreen('8.5.a');
  const modelItem = ctx.onScreen('8.5.c');
  const modelLines = modelItem.text.split('\n');
  const rows: Line[] = [
    [{ text: 'Flat', fg: 'accent' }, { text: ' / By parent', fg: 'dim' }],
    [{ text: '• AuthFlow   ', fg: 'accent' }, { text: 'SMOL · gemini-3.8-flash ◑ med', fg: 'dim' }],
    [{ text: '• AuthTests  ', fg: 'accent' }, { text: 'SMOL · gemini-3.8-flash ◑ med', fg: 'dim' }],
    [], [{ text: 'Recent activity', fg: 'accent' }],
    [{ text: '  AuthFlow   Locate cookie validation', fg: 'fg' }],
    [{ text: '  AuthTests  Locate cookie tests', fg: 'fg' }],
    [], [{ text: 'Transcript     Model     Usage', fg: 'dim' }],
  ];
  const { view, script } = terminal(f.visual, ompUi.agentHub({ width: 120, height: 16, tab: 'agents', rows }), 120, 16, label.text);
  const legend = element('div', 'ch08-hub-legend');
  withEvidence(legend, label, ctx);
  legend.append(element('p', 'ch08-caption', 'Fictional repository fixture · source-derived worker rows · no performance metrics or findings'));
  f.title.parentElement!.append(legend);
  const workerModels = element('section', 'ch08-worker-models');
  for (const text of modelLines) workerModels.append(element('p', 'ch08-copy', text));
  withEvidence(workerModels, modelItem, ctx);
  const controls = claim(ctx, '8.5.b', 'ch08-hub-controls');
  f.visual.append(workerModels);
  f.notes.append(controls);
  return render => {
    view.render(script, render.t, render.reducedMotion);
    controls.setAttribute('data-highlight', began(render, '8.5.2') ? 'true' : 'false');
  };
});

const safety = module('8.6', (stage, ctx) => {
  const f = frame(stage, ctx);
  const pages = element('div', 'ch08-pages');
  const boundaryPage = element('section', 'ch08-page');
  const limitsPage = element('section', 'ch08-page');
  const top = element('div', 'ch08-safety-top');
  const approval = statCard({ value: 'yolo', label: 'Shipped approval mode', condition: 'Headless task children: yolo' });
  top.append(approval.el, claim(ctx, '8.6.a'));
  boundaryPage.append(top);
  const safetyFlow = flow(boundaryPage, 210, [
    { text: 'Explicit tool policy', x: 175, y: 105, width: 310 },
    { text: 'deny\nrestriction survives', x: 740, y: 50, width: 350, tone: 'ch08-gate' },
    { text: 'prompt\nno interactive UI', x: 740, y: 160, width: 350 },
    { text: 'Required prompt\nfails', x: 1390, y: 160, width: 350, tone: 'ch08-gate' },
  ], [{ from: 0, to: 1, sentence: '8.6.2' }, { from: 0, to: 2, sentence: '8.6.2' }, { from: 2, to: 3, sentence: '8.6.2' }]);
  const limit = claim(ctx, '8.6.b', 'ch08-boundary');
  const perimeter = element('p', 'ch08-caption', 'Git workspace lanes do not confine networks, credentials, or arbitrary filesystem access.');
  boundaryPage.append(limit);
  limitsPage.append(claim(ctx, '8.6.c', 'ch08-inline'));
  const scopes = element('div', 'ch08-limit-scopes');
  for (const text of ['Task spawns', 'Eval agent jobs', 'Workpools', 'Judgments', 'Provider requests']) scopes.append(element('div', 'ch08-limit', text));
  limitsPage.append(scopes);
  const recovery = claim(ctx, '8.6.d', 'ch08-boundary');
  limitsPage.append(recovery);
  const recoveryFlow = flow(limitsPage, 210, [
    { text: 'Role candidates', x: 240, y: 50, width: 350 },
    { text: 'First available match', x: 1220, y: 50, width: 420 },
    { text: 'Request failure', x: 240, y: 160, width: 350 },
    { text: 'retry.fallbackChains', x: 1220, y: 160, width: 420 },
  ], [{ from: 0, to: 1, sentence: '8.6.5' }, { from: 2, to: 3, sentence: '8.6.5' }]);
  const summary = element('section', 'ch08-page ch08-summary');
  for (const [id, title] of [['8.6.a', 'Approval mode'], ['8.6.b', 'Confinement boundary'], ['8.6.c', 'Concurrency limits'], ['8.6.d', 'Selection and recovery']]) {
    const card = claim(ctx, id!, 'ch08-summary-card');
    card.prepend(element('h3', 'ch08-summary-title', title));
    summary.append(card);
  }
  pages.append(boundaryPage, limitsPage, summary); f.visual.append(pages);
  f.notes.append(perimeter, element('p', 'ch08-caption', 'Autonomy, workspace separation, concurrency, and recovery are different boundaries.'));
  return render => {
    const complete = progress(render, '8.6.5') >= 0.75;
    const second = render.t >= render.sentence('8.6.4').start;
    visible(boundaryPage, !complete && !second); visible(limitsPage, !complete && second);
    visible(summary, complete);
    visible(limit, began(render, '8.6.2')); visible(perimeter, began(render, '8.6.3'));
    visible(recovery, began(render, '8.6.5'));
    approval.render(progress(render, '8.6.1'), render.reducedMotion);
    safetyFlow(render); recoveryFlow(render);
  };
});

const notAlgorithms = module('8.7', (stage, ctx) => {
  const f = frame(stage, ctx);
  const cards = element('div', 'ch08-not-cards');
  const collab = element('section', 'ch08-not-card');
  collab.append(element('h3', '', 'Collab'), element('p', 'ch08-not-label', 'Humans share one running session'));
  const collabFlow = flow(collab, 210, [
    { text: 'Human', x: 150, y: 50, width: 230 },
    { text: 'Human', x: 150, y: 160, width: 230 },
    { text: 'One live\nsession', x: 640, y: 105, width: 260 },
  ], [{ from: 0, to: 2, sentence: '8.7.1' }, { from: 1, to: 2, sentence: '8.7.1' }], 820);
  collab.append(element('p', 'ch08-not-label', 'Not an autonomous-agent algorithm'));
  const prewalk = element('section', 'ch08-not-card');
  prewalk.append(element('h3', '', 'Prewalk'), element('p', 'ch08-not-label', 'One session changes model once'));
  const prewalkFlow = flow(prewalk, 210, [
    { text: 'Model A', x: 170, y: 105, width: 250 },
    { text: 'Model B', x: 640, y: 105, width: 250 },
  ], [{ from: 0, to: 1, sentence: '8.7.2' }], 820);
  prewalk.append(element('p', 'ch08-not-label', 'Not parallel debaters'));
  cards.append(collab, prewalk); f.visual.append(cards, claim(ctx, '8.7.a', 'ch08-inline'));
  const principles = element('section', 'ch08-principles');
  const principlesFlow = flow(principles, 100, [
    { text: 'Dependency graph', x: 240, y: 50, width: 360 },
    { text: 'Fitting primitive', x: 880, y: 50, width: 360 },
    { text: 'Measure integrated outcome', x: 1490, y: 50, width: 470 },
  ], [{ from: 0, to: 1, sentence: '8.7.3' }, { from: 1, to: 2, sentence: '8.7.3' }]);
  f.visual.append(principles);
  const inference = claim(ctx, '8.7.b', 'ch08-inline');
  f.notes.append(inference);
  return render => {
    visible(prewalk, began(render, '8.7.2'));
    visible(inference, began(render, '8.7.3'));
    visible(principles, began(render, '8.7.3'));
    principlesFlow(render);
    cards.setAttribute('data-principles', began(render, '8.7.3') ? 'true' : 'false');
    collabFlow(render); prewalkFlow(render);
  };
});

const chapter: ChapterModule = {
  id: 'ch08',
  scenes: { '8.1': contracts, '8.2': routing, '8.3': fanout, '8.4': advisor, '8.5': hub, '8.6': safety, '8.7': notAlgorithms },
};
export default chapter;
