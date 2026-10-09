import type { MountContext, RenderContext, SceneModule } from '../../engine/types';
import { createTerminal, ompUi, type Line, type TerminalScript } from '../../kit';
import { reveal, sceneFrame, withEvidence } from '../shared/scene';
import './intelligence.css';

const recreation = 'Recreation · omp 18.8.6 defaults · illustrative coupons fixture';
const account = 'Model shown assumes one usable Anthropic account, unchanged catalog, no competing usable chat provider, and no explicit model override.';
const line = (text: string): Line => [{ text, fg: 'dim' }];

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function fixture(lines: Line[]) {
  const view = createTerminal({ cols: 61, rows: lines.length, label: recreation });
  view.el.classList.add('ch09-intelligence__terminal');
  const script: TerminalScript = {
    cols: 61,
    rows: lines.length,
    duration: 0,
    label: recreation,
    events: [{ at: 0, op: 'print', lines }],
  };
  view.render(script, 0, true);
  return { el: view.el, rows: Array.from(view.el.querySelectorAll<HTMLElement>('.kit-term-row')) };
}

function evidence(ctx: MountContext, id: string, label: string): HTMLElement {
  const el = element('div', 'ch09-intelligence__fixture-evidence');
  el.dataset.item = id;
  el.append(element('span', 'ch09-intelligence__source-label', label));
  withEvidence(el, ctx.onScreen(id), ctx);
  return el;
}

function visible(el: HTMLElement, progress: number, ctx: RenderContext): void {
  reveal(el, progress, ctx.reducedMotion);
  el.toggleAttribute('inert', !ctx.reducedMotion && progress <= 0);
  el.setAttribute('aria-hidden', String(!ctx.reducedMotion && progress <= 0));
}

export const intelligenceScene: SceneModule = (() => {
  let terminalRows: HTMLElement[][];
  let fixtureEvidence: HTMLElement[];
  let prerequisites: HTMLElement;
  let rename: HTMLElement;
  let diagnosis: HTMLElement;

  return {
    id: '9.3',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('ch09-intelligence');
      frame.notes.append(element('p', 'ch09-intelligence__account', account));
      const diagnosisSentence = ctx.scene.sentences.find(sentence => sentence.id === '9.3.4')!;
      diagnosis = element('div', 'ch09-intelligence__diagnosis');
      diagnosis.append(element('p', 'ch09-intelligence__diagnosis-text', diagnosisSentence.text));
      withEvidence(diagnosis, { ...diagnosisSentence, kind: 'label' }, ctx);
      frame.notes.append(diagnosis);

      prerequisites = element('section', 'ch09-intelligence__prerequisites');
      prerequisites.dataset.item = '9.3.d';
      const prerequisiteCopy = element('div', 'ch09-intelligence__prerequisite-copy');
      prerequisiteCopy.append(
        element('p', 'ch09-intelligence__prerequisite-text', ctx.onScreen('9.3.d').text),
      );
      prerequisites.append(prerequisiteCopy);
      withEvidence(prerequisites, ctx.onScreen('9.3.d'), ctx);
      frame.header.append(prerequisites);

      const panes = element('div', 'ch09-intelligence__panes');
      const left = element('div', 'ch09-intelligence__pane');
      const right = element('div', 'ch09-intelligence__pane');
      const lsp = fixture(ompUi.lsp({
        width: 61,
        action: 'references',
        path: 'src/coupons.ts',
        line: 1,
        symbol: 'isExpired',
        response: [
          line('💡 3 found⟦⌃O: Expand⟧'),
          line(' ├─ src/coupons.ts 1 reference'),
          line(' │  └─ line 1, col 17'),
          line(' └─ src/checkout.ts 2 references'),
          line('    ├─ line 1, col 10'),
          line('    └─ … 1 more'),
        ],
      }));
      const dap = fixture(ompUi.dap({
        width: 61,
        action: 'stack_trace',
        session: 'dbg-1',
        adapter: 'js-debug-adapter',
        status: 'stopped',
        cwd: '/demo/coupons',
        program: './dist/index.js',
        stopReason: 'breakpoint',
        frame: 'isExpired',
        location: 'src/coupons.ts:2:3',
        output: [
          line('Stack trace:'),
          line('- #1000 isExpired @ src/coupons.ts:2:3'),
          line('- #1001 checkout @ src/checkout.ts:3:3'),
        ],
      }));
      const lspEvidence = evidence(ctx, '9.3.a', 'Reference lookup');
      const dapEvidence = evidence(ctx, '9.3.b', 'Stack trace');
      terminalRows = [lsp.rows, dap.rows];
      fixtureEvidence = [lspEvidence, dapEvidence];

      rename = element('section', 'ch09-intelligence__rename');
      rename.dataset.item = '9.3.c';
      const renameItem = ctx.onScreen('9.3.c');
      const titleEnd = renameItem.text.indexOf('\n');
      const renameHeader = element('div', 'ch09-intelligence__rename-header');
      renameHeader.append(element('h3', 'ch09-intelligence__rename-title', renameItem.text.slice(0, titleEnd)));
      withEvidence(renameHeader, renameItem, ctx);
      rename.append(
        renameHeader,
        element('pre', 'ch09-intelligence__rename-code', renameItem.text.slice(titleEnd + 1)),
      );
      left.append(lsp.el, lspEvidence, rename);
      right.append(dap.el, dapEvidence);
      panes.append(left, right);

      const status = createTerminal({ cols: 128, rows: 2, label: recreation });
      status.el.classList.add('ch09-intelligence__status');
      status.el.setAttribute('aria-label', 'Shared omp status and prompt for the illustrative fixture');
      const statusScript: TerminalScript = {
        cols: 128,
        rows: 2,
        duration: 0,
        events: [{ at: 0, op: 'status', line: ompUi.statusBand({ width: 128, path: '/demo/coupons', model: 'Opus 5.5', thinking: '◒ high' }) }],
      };
      status.render(statusScript, 0, true);
      status.el.querySelector('.kit-recreation')?.remove();
      frame.visual.append(panes, status.el);
    },
    render(ctx) {
      const completed = ctx.reducedMotion || ctx.t >= ctx.sentence('9.3.4').start;
      const lookupProgress = completed ? 1 : Math.min(1, ctx.progress('9.3.1') / .72);
      for (const rows of terminalRows) {
        rows.forEach((row, index) => {
          const progress = index === 0 ? 1 : Math.max(0, Math.min(1, lookupProgress * rows.length - index + 1));
          row.style.opacity = String(progress);
          row.setAttribute('aria-hidden', String(progress <= 0));
        });
      }
      const evidenceProgress = completed ? 1 : Math.max(0, Math.min(1, (ctx.progress('9.3.1') - .6) * 8));
      for (const el of fixtureEvidence) visible(el, evidenceProgress, ctx);
      visible(prerequisites, completed ? 1 : Math.min(1, ctx.progress('9.3.2') * 5), ctx);
      visible(rename, completed ? 1 : Math.min(1, ctx.progress('9.3.3') * 5), ctx);
      visible(diagnosis, completed ? 1 : 0, ctx);
    },
  };
})();
