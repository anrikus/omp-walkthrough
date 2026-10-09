import type { MountContext, RenderContext, SceneModule } from '../../engine/types';
import { createTerminal, ompUi, pairedBars, type TerminalScript } from '../../kit';
import { sceneFrame, withEvidence, reveal } from '../shared/scene';
import './early.css';

const recreation = 'Recreation · omp 18.8.6 defaults · illustrative coupons fixture';
const account = 'Model shown assumes one usable Anthropic account, unchanged catalog, no competing usable chat provider, and no explicit model override.';
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function claim(ctx: MountContext, id: string, code = false): HTMLElement {
  const box = element('section', 'ch09-claim');
  box.dataset.item = id;
  box.append(element(code ? 'pre' : 'p', code ? 'ch09-code' : 'ch09-copy', ctx.onScreen(id).text));
  withEvidence(box, ctx.onScreen(id), ctx);
  return box;
}
function evidence(ctx: MountContext, id: string): HTMLElement {
  const box = element('div', 'ch09-evidence');
  box.dataset.item = id;
  withEvidence(box, ctx.onScreen(id), ctx);
  return box;
}
function visible(el: HTMLElement, progress: number, ctx: RenderContext): void {
  reveal(el, Math.min(1, progress * 5), ctx.reducedMotion);
  el.toggleAttribute('inert', !ctx.reducedMotion && progress <= 0);
}
function layer(el: HTMLElement, active: boolean): void {
  el.style.opacity = active ? '1' : '0';
  el.toggleAttribute('inert', !active);
}
function terminal(ctx: MountContext, cols: number, rows: number, events: TerminalScript['events']) {
  const view = createTerminal({ cols, rows, label: recreation });
  view.el.classList.add('ch09-terminal');
  const first = ctx.scene.sentences[0]!;
  const last = ctx.scene.sentences.at(-1)!;
  const script: TerminalScript = {
    cols, rows, label: recreation, duration: ctx.sentence(last.id).end,
    events: [{ at: ctx.sentence(first.id).start, op: 'status', line: ompUi.statusBand({ width: cols, path: '/demo/coupons', model: 'Opus 5.5', thinking: '◒ high' }) }, ...events],
  };
  return { el: view.el, render: (ctx: RenderContext) => view.render(script, ctx.t, ctx.reducedMotion) };
}
function frameFor(stage: HTMLElement, ctx: MountContext) {
  const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
  frame.el.classList.add('ch09-early');
  frame.notes.append(element('p', 'ch09-account', account));
  return frame;
}

export const editScene: SceneModule = (() => {
  let current: HTMLElement, historical: HTMLElement, chartLayer: HTMLElement, address: HTMLElement, readEvidence: HTMLElement, modelEvidence: HTMLElement, diffEvidence: HTMLElement;
  let term: ReturnType<typeof terminal>, bars: ReturnType<typeof pairedBars>;
  return {
    id: '9.1',
    mount(stage, ctx) {
      const frame = frameFor(stage, ctx);
      frame.el.classList.add('ch09-edit-frame');
      const composition = element('div', 'ch09-edit-composition');
      const layers = element('div', 'ch09-layers');
      current = element('div', 'ch09-current');
      const diff = ompUi.edit({ width: 76, path: 'src/coupons.ts', added: 1, removed: 1, rows: [
        { kind: 'hunk', text: '@@ -1,3 +1,3 @@' },
        { kind: 'context', text: 'export function isExpired(expiresAt: number, now: number): boolean {' },
        { kind: 'remove', text: '  return expiresAt < now;' },
        { kind: 'add', text: [{ text: '  return expiresAt ' }, { text: '<=', inverse: true }, { text: ' now;' }] },
        { kind: 'context', text: '}' },
      ] });
      const editCue = ctx.sentence('9.1.2');
      term = terminal(ctx, 76, 11, [
        { at: ctx.sentence('9.1.1').start, op: 'print', lines: ompUi.readRow({ width: 76, path: 'src/coupons.ts' }) },
        { at: editCue.start + (editCue.end - editCue.start) * .45, op: 'print', lines: [[], ...diff] },
      ]);
      const proof = element('div', 'ch09-proof-row');
      readEvidence = evidence(ctx, '9.1.a'); modelEvidence = evidence(ctx, '9.1.b'); diffEvidence = evidence(ctx, '9.1.d');
      readEvidence.prepend(element('span', 'ch09-proof-label', 'Read row'));
      modelEvidence.prepend(element('span', 'ch09-proof-label', 'Selected model'));
      diffEvidence.prepend(element('span', 'ch09-proof-label', 'Edit diff'));
      proof.append(readEvidence, modelEvidence, diffEvidence);
      frame.header.append(proof);
      address = claim(ctx, '9.1.c', true);
      address.classList.add('ch09-address');
      current.append(term.el, address);
      chartLayer = element('div', 'ch09-edit-chart');
      bars = pairedBars({ title: 'Historical edit-format experiment', condition: 'Creator-reported · synthetic React repairs · 2026-02-12', axisLabel: 'Repair success (%)', width: 1036, height: 580, domain: [0, 100], pairs: [{
        label: 'Grok Code Fast 1', first: { label: 'Patch', value: 6.7, valueLabel: '6.7%' }, second: { label: 'Historical hashline', value: 68.3, valueLabel: '68.3%' },
      }] });
      chartLayer.append(bars.el);
      historical = element('section', 'ch09-claim ch09-historical');
      historical.dataset.item = '9.1.e';
      const benchmark = ctx.onScreen('9.1.e');
      const split = benchmark.text.indexOf('\n');
      historical.append(element('p', 'ch09-benchmark-lead', benchmark.text.slice(0, split)), element('p', 'ch09-benchmark-conditions', benchmark.text.slice(split + 1)));
      withEvidence(historical, benchmark, ctx);
      layers.append(current, chartLayer);
      composition.append(layers, historical);
      frame.visual.append(composition);
    },
    render(ctx) {
      term.render(ctx);
      const historyBeat = !ctx.reducedMotion && ctx.t >= ctx.sentence('9.1.3').start && ctx.t < ctx.sentence('9.1.5').start;
      layer(current, !historyBeat); layer(chartLayer, historyBeat);
      visible(historical, ctx.progress('9.1.3'), ctx);
      visible(address, ctx.progress('9.1.2'), ctx);
      visible(readEvidence, ctx.progress('9.1.1'), ctx);
      visible(modelEvidence, ctx.progress('9.1.1'), ctx);
      visible(diffEvidence, Math.max(0, (ctx.progress('9.1.2') - .45) / .55), ctx);
      bars.render(ctx.progress('9.1.3'), ctx.reducedMotion);
    },
  };
})();

export const searchScene: SceneModule = (() => {
  let requests: HTMLElement, network: HTMLElement, symbols: HTMLElement, branches: HTMLElement[], pulse: HTMLElement;
  let term: ReturnType<typeof terminal>;
  return {
    id: '9.2',
    mount(stage, ctx) {
      const frame = frameFor(stage, ctx);
      const grid = element('div', 'ch09-search-grid');
      const left = element('div', 'ch09-column');
      const tree = element('div', 'ch09-tree');
      tree.append(element('h3', 'ch09-subtitle', 'What do you need to find?'));
      const fork = element('div', 'ch09-branches');
      branches = ['Names\nglob', 'Text\ngrep', 'Syntax\nast_grep', 'Behavior\nfind'].map(text => element('div', 'ch09-branch', text));
      fork.append(...branches); tree.append(fork);
      requests = claim(ctx, '9.2.a', true);
      left.append(tree, requests);
      const right = element('div', 'ch09-column');
      term = terminal(ctx, 48, 2, []);
      network = claim(ctx, '9.2.b');
      const [searchLead, searchConditions] = ctx.onScreen('9.2.b').text.split('\n') as [string, string];
      const judgeBoundary = searchConditions.indexOf(';');
      network.firstElementChild!.replaceChildren(element('span', 'ch09-structured-lead', searchLead), ' ', element('span', 'ch09-config-line', searchConditions.slice(0, judgeBoundary + 1)), ' ', element('span', 'ch09-condition-line', searchConditions.slice(judgeBoundary + 1).trim()));
      const flow = element('div', 'ch09-network-flow');
      flow.append(element('span', '', 'Source passages'), element('span', 'ch09-arrow', '→'), element('span', '', 'Judge / network'));
      pulse = element('span', 'ch09-travel-dot'); flow.append(pulse);
      network.prepend(flow);
      symbols = element('div', 'ch09-symbols');
      symbols.append(element('h3', 'ch09-subtitle', 'isExpired'), element('p', 'ch09-copy', 'Declaration → import → checkout call'), element('p', 'ch09-small', 'src/coupons.ts → src/checkout.ts'));
      right.append(term.el, network, symbols);
      grid.append(left, right); frame.visual.append(grid);
    },
    render(ctx) {
      term.render(ctx);
      const build = ctx.progress('9.2.1');
      branches.forEach((branch, i) => visible(branch, Math.max(0, build * 1.5 - i * .12), ctx));
      visible(requests, ctx.progress('9.2.2'), ctx); visible(network, ctx.progress('9.2.3'), ctx); visible(symbols, ctx.progress('9.2.4'), ctx);
      pulse.style.transform = `translateX(${(ctx.reducedMotion ? 1 : ctx.progress('9.2.3')) * 420}px)`;
    },
  };
})();


export const syntaxScene: SceneModule = (() => {
  let syntax: HTMLElement, alternate: HTMLElement, defaults: HTMLElement, reject: HTMLElement, match: HTMLElement, replacement: HTMLElement;
  let term: ReturnType<typeof terminal>;
  return {
    id: '9.4',
    mount(stage, ctx) {
      const frame = frameFor(stage, ctx);
      const grid = element('div', 'ch09-search-grid');
      const left = element('div', 'ch09-column');
      syntax = element('section', 'ch09-claim ch09-syntax');
      syntax.dataset.item = '9.4.a';
      const source = element('pre', 'ch09-code');
      const sourceLines = ctx.onScreen('9.4.a').text.split('\n');
      sourceLines.forEach((text, i) => {
        const row = element('span', `ch09-source-line${i === 2 ? ' ch09-comment' : ''}`, text + (i < sourceLines.length - 1 ? '\n' : ''));
        source.append(row);
        if (i === 1) { match = element('span', 'ch09-match'); row.prepend(match); }
      });
      syntax.append(source); withEvidence(syntax, ctx.onScreen('9.4.a'), ctx);
      alternate = element('section', 'ch09-alternate');
      alternate.append(element('h3', 'ch09-subtitle', 'Same call expression, different formatting'), element('pre', 'ch09-code', 'console.log(\n  checkout(now, now)\n);'));
      replacement = element('p', 'ch09-replacement', 'console.log($ARG) → console.info($ARG)');
      left.append(syntax, alternate, replacement);
      const right = element('div', 'ch09-column');
      term = terminal(ctx, 48, 3, [{ at: ctx.sentence('9.4.1').start, op: 'print', lines: ompUi.readRow({ width: 48, path: 'src/index.ts' }) }]);
      defaults = claim(ctx, '9.4.b');
      const [settings, preview, warning] = ctx.onScreen('9.4.b').text.split('\n') as [string, string, string];
      defaults.firstElementChild!.replaceChildren(element('span', 'ch09-config-line', settings.replace(' · ', ' ·\n')), ' ', element('span', 'ch09-structured-lead', preview), ' ', element('span', 'ch09-condition-line', warning));
      reject = claim(ctx, '9.4.c', true);
      right.append(term.el, defaults, reject);
      grid.append(left, right); frame.visual.append(grid);
    },
    render(ctx) {
      term.render(ctx);
      visible(syntax, ctx.progress('9.4.1'), ctx); visible(alternate, ctx.progress('9.4.1'), ctx);
      match.style.transform = `scaleX(${ctx.reducedMotion ? 1 : ctx.progress('9.4.1')})`;
      visible(defaults, ctx.progress('9.4.2'), ctx); visible(replacement, ctx.progress('9.4.2'), ctx);
      visible(reject, ctx.progress('9.4.3'), ctx);
      replacement.dataset.discarded = String(ctx.reducedMotion || ctx.t >= ctx.sentence('9.4.3').start);
    },
  };
})();

export const evalScene: SceneModule = (() => {
  let cells: HTMLElement, notebook: HTMLElement, automation: HTMLElement, retained: HTMLElement, sourceArrow: HTMLElement;
  let term: ReturnType<typeof terminal>;
  return {
    id: '9.5',
    mount(stage, ctx) {
      const frame = frameFor(stage, ctx);
      const composition = element('div', 'ch09-eval');
      term = terminal(ctx, 126, 2, []);
      const grid = element('div', 'ch09-search-grid');
      const left = element('div', 'ch09-column');
      cells = claim(ctx, '9.5.a', true);
      retained = element('div', 'ch09-runtime-lanes');
      retained.append(element('div', '', 'Python\nretained subprocess'), element('div', 'ch09-isolated', 'JavaScript\nseparate runtime'));
      left.append(cells, retained);
      const right = element('div', 'ch09-column');
      notebook = claim(ctx, '9.5.b');
      const notebookFlow = element('div', 'ch09-notebook-flow');
      sourceArrow = element('span', 'ch09-source-arrow', 'edit → source');
      notebookFlow.append(sourceArrow, element('span', 'ch09-stale', 'Saved output\nnot refreshed'));
      notebook.prepend(notebookFlow);
      automation = claim(ctx, '9.5.c');
      const statusRows = ctx.onScreen('9.5.c').text.split('\n').map(text => {
        const row = element('span', 'ch09-status-row');
        const boundary = text.indexOf(';');
        row.append(element('span', 'ch09-status-setting', text.slice(0, boundary + 1)), ' ', element('span', 'ch09-condition-line', text.slice(boundary + 1).trim()));
        return row;
      });
      automation.firstElementChild!.replaceChildren(...statusRows.flatMap((row, index) => index ? [' ', row] : [row]));
      right.append(notebook, automation);
      grid.append(left, right); composition.append(term.el, grid); frame.visual.append(composition);
    },
    render(ctx) {
      term.render(ctx);
      visible(cells, ctx.progress('9.5.1'), ctx); visible(retained, ctx.progress('9.5.1'), ctx);
      visible(notebook, ctx.progress('9.5.2'), ctx); visible(automation, ctx.progress('9.5.3'), ctx);
      sourceArrow.style.transform = `translateX(${(ctx.reducedMotion ? 1 : ctx.progress('9.5.2')) * 18}px)`;
    },
  };
})();
