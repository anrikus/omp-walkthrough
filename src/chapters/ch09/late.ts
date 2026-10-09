import type { MountContext, SceneModule } from '../../engine/types';
import { createTerminal, ease, ompUi, type TerminalScript, type TerminalView } from '../../kit';
import { reveal, sceneFrame, withEvidence } from '../shared/scene';
import './late.css';

const recreation = 'Recreation · omp 18.8.6 defaults · illustrative coupons fixture';
const accountCaveat = 'Status assumes one usable Anthropic account, unchanged catalog, no competing usable chat provider and no explicit model override.';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className.split(' ').map(name => `ch09-late-${name}`).join(' ');
  if (text !== undefined) el.textContent = text;
  return el;
}

function claim(parent: HTMLElement, ctx: MountContext, id: string): HTMLElement {
  const item = ctx.onScreen(id);
  const section = element('div', 'claim');
  section.append(element('p', 'claim-text', item.text));
  withEvidence(section, item, ctx);
  parent.append(section);
  return section;
}

function terminal(cols: number, rows: number): TerminalView {
  const view = createTerminal({ cols, rows, label: recreation });
  view.el.classList.add('ch09-late-terminal');
  return view;
}

function status(cols: number) {
  return ompUi.statusBand({ width: cols, model: 'Opus 5.5', thinking: '◒ high', path: '/demo/coupons' });
}

let rewindTerminal: TerminalView;
let rewindScript: TerminalScript;
let rewindBoundary: HTMLElement;
let conversationLabel: HTMLElement;
let conversationBlocks: HTMLElement[];
let retainedReport: HTMLElement;
let rewindArrow: HTMLElement;

export const rewindScene: SceneModule = {
  id: '9.6',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    frame.el.classList.add('ch09-late-frame');
    const body = element('div', 'rewind');
    const contextLane = element('section', 'context-lane');
    const readPane = element('div', 'read-pane');
    readPane.append(element('h3', 'lane-title', 'Context · coupon investigation'));
    rewindTerminal = terminal(70, 4);
    const reads = ctx.onScreen('9.6.a');
    const first = ctx.sentence('9.6.1');
    rewindScript = {
      cols: 70, rows: 4, duration: ctx.sentence('9.6.3').end,
      events: [
        { at: first.start, op: 'status', line: status(70) },
        ...reads.text.split('\n').map((line, index) => ({
          at: first.start + (first.end - first.start) * index * 0.22,
          op: 'print' as const,
          lines: ompUi.readRow({ width: 70, path: line.replace(/^● Read /, '') }),
        })),
      ],
    };
    readPane.append(rewindTerminal.el);
    withEvidence(readPane, reads, ctx);

    const contraction = element('div', 'contraction');
    contraction.append(element('h3', 'lane-title', 'Checkpoint → retained report'));
    conversationLabel = element('p', 'conversation-label', 'Exploratory conversation');
    const blocks = element('div', 'conversation-blocks');
    blocks.setAttribute('aria-hidden', 'true');
    conversationBlocks = [0, 1, 2].map(() => element('span', 'conversation-block'));
    blocks.append(...conversationBlocks);
    rewindArrow = element('div', 'rewind-arrow', '↓ Context only');
    retainedReport = element('div', 'report');
    retainedReport.append(
      element('h4', 'report-title', 'Retained report'),
      element('p', 'report-copy', 'Expiry includes now.'),
      element('p', 'report-detail', 'The conclusion replaces exploratory context.'),
    );
    contraction.append(conversationLabel, blocks, rewindArrow, retainedReport);
    contextLane.append(readPane, contraction);

    const diskLane = element('section', 'disk-lane');
    const disk = element('div', 'disk-source');
    disk.append(
      element('h3', 'lane-title', 'Disk / processes · not rewound'),
      element('p', 'source-path', 'src/coupons.ts · source edit remains'),
      element('pre', 'source-code', 'return expiresAt <= now;'),
      element('p', 'disk-scopes', 'Files · Git commits · running processes · desktop'),
    );
    const boundary = element('div', 'context-boundary');
    rewindBoundary = claim(boundary, ctx, '9.6.b');
    diskLane.append(disk, boundary);
    body.append(contextLane, diskLane);
    frame.visual.append(body);
    frame.notes.append(element('p', 'footer-copy', accountCaveat));
  },
  render(ctx) {
    rewindTerminal.render(rewindScript, ctx.t, ctx.reducedMotion);
    reveal(rewindBoundary, ctx.progress('9.6.2'), ctx.reducedMotion);
    rewindBoundary.inert = !ctx.reducedMotion && ctx.progress('9.6.2') <= 0;
    const progress = ctx.reducedMotion ? 1 : ease(ctx.progress('9.6.3'));
    conversationLabel.style.opacity = String(1 - progress);
    conversationBlocks.forEach((block, index) => {
      block.style.transform = `translateX(${(2 - index) * 36 * progress}px) scaleX(${1 - progress * 0.92})`;
      block.style.opacity = String(1 - progress);
    });
    retainedReport.style.transform = `translateY(${-42 * progress}px)`;
    rewindArrow.style.opacity = String(1 - progress);
  },
};

let nativeLayers: HTMLElement[];
let nativeDots: HTMLElement[];
let nativeTargets: HTMLElement;

export const nativeScene: SceneModule = {
  id: '9.7',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    frame.el.classList.add('ch09-late-frame');
    const body = element('div', 'native');
    claim(body, ctx, '9.7.a');
    const stack = element('div', 'native-stack');
    const layers = [
      ['TypeScript', 'Policy / rendering', 'Higher-level decisions and presentation'],
      ['Node-API', 'Native addon', 'The language boundary'],
      ['Rust', 'Algorithms / platform services', 'Search · structural editing · shell operations'],
    ];
    nativeLayers = [];
    nativeDots = [];
    layers.forEach(([name, role, detail], index) => {
      const layer = element('section', `native-layer native-layer-${index}`);
      layer.append(element('h3', 'native-name', name), element('p', 'native-role', role), element('p', 'native-detail', detail));
      nativeLayers.push(layer);
      stack.append(layer);
      if (index < layers.length - 1) {
        const connector = element('div', 'native-connector', '→');
        connector.setAttribute('aria-hidden', 'true');
        const dot = element('span', 'native-dot');
        nativeDots.push(dot);
        connector.append(dot);
        stack.append(connector);
      }
    });
    nativeTargets = element('section', 'native-targets');
    const chips = element('div', 'target-chips');
    chips.append(element('span', 'target-chip', 'Windows x64'), element('span', 'target-chip', 'ARM64'));
    nativeTargets.append(chips);
    claim(nativeTargets, ctx, '9.7.b');
    body.append(stack, nativeTargets);
    frame.visual.append(body);
    frame.notes.append(element('p', 'footer-copy', 'Documented targets are not Windows footage or acceptance evidence.'));
  },
  render(ctx) {
    const progress = ctx.reducedMotion ? 1 : ctx.progress('9.7.1');
    nativeLayers.forEach((layer, index) => {
      layer.style.opacity = String(0.35 + 0.65 * ease(Math.max(0, Math.min(1, progress * 3 - index))));
    });
    nativeDots.forEach((dot, index) => {
      const step = ctx.reducedMotion ? 1 : ease(Math.max(0, Math.min(1, progress * 2 - index)));
      dot.style.transform = `translateX(${step * 48}px)`;
      dot.style.opacity = String(step > 0 && step < 1 ? 1 : 0);
    });
    reveal(nativeTargets, ctx.progress('9.7.2'), ctx.reducedMotion);
    nativeTargets.inert = !ctx.reducedMotion && ctx.progress('9.7.2') <= 0;
  },
};

let boundaryTerminal: TerminalView;
let boundaryScript: TerminalScript;
let approvalBoundary: HTMLElement;
let defaultMatrix: HTMLElement;
let boundaryTakeaway: HTMLElement;

export const boundaryScene: SceneModule = {
  id: '9.8',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
    frame.el.classList.add('ch09-late-frame');
    const body = element('div', 'execution');
    boundaryTerminal = terminal(128, 2);
    boundaryScript = {
      cols: 128, rows: 2, duration: ctx.sentence('9.8.3').end,
      events: [{ at: ctx.sentence('9.8.1').start, op: 'status', line: status(128) }],
    };
    const columns = element('div', 'execution-columns');
    defaultMatrix = element('section', 'defaults');
    const matrix = element('dl', 'matrix');
    [
      ['enabled', 'Available to the agent', 'enabled'],
      ['opt-in', 'Explicitly switched on', 'optin'],
      ['installed dependency', 'Required tool present', 'installed'],
      ['credentials', 'Account / service access', 'credentials'],
    ].forEach(([label, description, tone]) => {
      const cell = element('div', `matrix-cell matrix-${tone}`);
      cell.append(element('dt', 'matrix-label', label), element('dd', 'matrix-description', description));
      matrix.append(cell);
    });
    defaultMatrix.append(matrix);
    claim(defaultMatrix, ctx, '9.8.a');

    approvalBoundary = element('section', 'host-boundary');
    approvalBoundary.append(
      element('h3', 'host-title', 'Broad host access'),
      element('p', 'host-scope', 'Files · processes · network · desktop'),
    );
    const approval = element('div', 'approval');
    approval.append(element('h4', 'approval-title', 'Approval decisions are inside this boundary'));
    claim(approval, ctx, '9.8.b');
    approvalBoundary.append(approval, element('p', 'host-caption', 'An approval policy is not OS isolation.'));
    columns.append(defaultMatrix, approvalBoundary);
    boundaryTakeaway = element('p', 'takeaway', ctx.chapter.takeaway);
    body.append(boundaryTerminal.el, columns, boundaryTakeaway);
    frame.visual.append(body);
    frame.notes.append(element('p', 'footer-copy', accountCaveat));
  },
  render(ctx) {
    boundaryTerminal.render(boundaryScript, ctx.t, ctx.reducedMotion);
    reveal(defaultMatrix, ctx.progress('9.8.1'), ctx.reducedMotion);
    defaultMatrix.inert = !ctx.reducedMotion && ctx.progress('9.8.1') <= 0;
    reveal(approvalBoundary, ctx.progress('9.8.2'), ctx.reducedMotion);
    approvalBoundary.inert = !ctx.reducedMotion && ctx.progress('9.8.2') <= 0;
    reveal(boundaryTakeaway, ctx.progress('9.8.3'), ctx.reducedMotion);
  },
};
