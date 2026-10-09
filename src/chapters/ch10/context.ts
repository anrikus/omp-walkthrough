import type { MountContext, RenderContext, SceneModule } from '../../engine/types';
import { createTerminal, ompUi, ease, type TerminalScript } from '../../kit';
import { sceneFrame, withEvidence, reveal as revealElement } from '../shared/scene';
import './context.css';

const label = 'Recreation · omp 18.8.6 defaults · illustrative coupons fixture';
const cols = 72;
const status = () => ompUi.statusBand({ width: cols, path: '/demo/coupons', model: 'Opus 5.5', thinking: '◒ high' });
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) => {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};
function reveal(el: HTMLElement, p: number, reducedMotion: boolean) {
  revealElement(el, p, reducedMotion);
  el.inert = !reducedMotion && p === 0;
}
function fact(ctx: MountContext, id: string) {
  const el = node('section', 'ch10-context-fact');
  el.append(node('p', '', ctx.onScreen(id).text));
  withEvidence(el, ctx.onScreen(id), ctx);
  return el;
}
function frame(stage: HTMLElement, ctx: MountContext) {
  const result = sceneFrame(stage, { title: ctx.scene.title, layout: 'split', date: '2026-10-08' });
  result.el.classList.add('ch10-context');
  result.notes.append(node('p', '', 'Illustrative fixture; one usable Anthropic account, unchanged catalog, no competing usable chat provider or explicit model override. No model or tool execution is represented.'));
  return result;
}
function terminal(rows: number) { return createTerminal({ cols, rows, label }); }
function script(ctx: MountContext, rows: number): TerminalScript {
  const last = ctx.scene.sentences.at(-1)!;
  return { cols, rows, duration: ctx.sentence(last.id).end, events: [{ at: 0, op: 'status', line: status() }] };
}
function typed(ctx: MountContext, id: string, text: string) {
  const cue = ctx.sentence(id);
  return { at: cue.start, op: 'type' as const, text, cps: text.length / ((cue.end - cue.start) * 0.32) };
}
const beat = (ctx: RenderContext, id: string) => ctx.reducedMotion ? 1 : ease(Math.min(1, ctx.progress(id) * 3));

export const scene101: SceneModule = (() => {
  let term: ReturnType<typeof terminal>, story: TerminalScript;
  let model: HTMLElement, command: HTMLElement, description: HTMLElement;
  let lanes: HTMLElement[], near: HTMLElement, farther: HTMLElement, stop: HTMLElement;
  return {
    id: '10.1',
    mount(stage, ctx) {
      const f = frame(stage, ctx);
      term = terminal(3);
      story = script(ctx, 3);
      story.events.push(typed(ctx, '10.1.2', '/extensions'));
      model = fact(ctx, '10.1.b');
      command = node('div', 'ch10-context-evidence');
      withEvidence(command, ctx.onScreen('10.1.a'), ctx);
      description = fact(ctx, '10.1.c');
      const terminalGroup = node('section', 'ch10-context-terminal-group');
      terminalGroup.append(term.el, command);
      f.visual.append(terminalGroup, model, description);
      const layerList = node('div', 'ch10-context-layers');
      const data = [
        ['Project instructions', 'Project context · each session here'],
        ['RULES.md', 'Expiry is inclusive · every request'],
        ['skill://coupon-review', 'Instructions loaded on demand'],
        ['Cross-session memory', 'A lead to verify later'],
      ];
      lanes = data.map(([title, detail]) => {
        const lane = node('section', 'ch10-context-layer');
        lane.append(node('h3', '', title), node('p', '', detail));
        layerList.append(lane);
        return lane;
      });
      const discovery = node('section', 'ch10-context-discovery');
      discovery.append(node('h3', '', 'Native project discovery'));
      farther = node('p', 'ch10-context-far', '/demo/.omp/ · farther context');
      near = node('p', 'ch10-context-near', '/demo/coupons/.omp/ · nonempty');
      stop = node('p', 'ch10-context-stop', 'Discovery stops here');
      discovery.append(farther, near, stop);
      f.aside!.append(layerList, discovery);
    },
    render(ctx) {
      term.render(story, ctx.t, ctx.reducedMotion);
      reveal(model, beat(ctx, '10.1.1'), ctx.reducedMotion);
      reveal(command, beat(ctx, '10.1.2'), ctx.reducedMotion);
      reveal(description, beat(ctx, '10.1.3'), ctx.reducedMotion);
      lanes.forEach((el, i) => {
        const p = beat(ctx, i === 0 ? '10.1.1' : '10.1.2');
        el.style.opacity = String(p);
        el.style.transform = `translateY(${(1 - p) * 8}px)`;
      });
      const p = beat(ctx, '10.1.3');
      farther.style.opacity = String(1 - 0.65 * p);
      near.style.transform = `translateX(${-14 * (1 - p)}px)`;
      stop.style.opacity = String(p);
    },
  };
})();

function timingLane(title: string, steps: string[], condition: string) {
  const el = node('section', 'ch10-context-timing');
  el.append(node('h3', '', title));
  const rail = node('div', 'ch10-context-rail');
  const track = node('div', 'ch10-context-track');
  const marker = node('span', 'ch10-context-marker');
  marker.setAttribute('aria-hidden', 'true');
  rail.append(track, marker);
  const labels = node('div', 'ch10-context-steps');
  labels.style.gridTemplateColumns = `repeat(${steps.length}, minmax(0, 1fr))`;
  steps.forEach(text => labels.append(node('span', '', text)));
  el.append(rail, labels, node('p', 'ch10-context-lane-note', condition));
  return { el, track, marker };
}
export const scene102: SceneModule = (() => {
  let term: ReturnType<typeof terminal>, story: TerminalScript;
  let noticeEvidence: HTMLElement, explanation: HTMLElement, security: HTMLElement;
  let lanes: ReturnType<typeof timingLane>[];
  return {
    id: '10.2',
    mount(stage, ctx) {
      const f = frame(stage, ctx);
      term = terminal(10);
      story = script(ctx, 10);
      const cue = ctx.sentence('10.2.1');
      story.events.push({ at: cue.start, op: 'print', lines: [
        [{ text: 'Illustrative attempted edit · src/coupons.ts', fg: 'dim' }],
        [{ text: 'return expiresAt < now;', fg: 'warning' }],
      ] }, { at: cue.start + (cue.end - cue.start) * 0.35, op: 'print', lines: ompUi.ttsr({ width: cols, rules: [{ name: 'coupon-expiry-inclusive', description: 'Use an inclusive boundary when checking coupon expiry.' }] }) });
      noticeEvidence = node('div', 'ch10-context-evidence');
      noticeEvidence.append(node('span', '', 'Rule notice'));
      withEvidence(noticeEvidence, ctx.onScreen('10.2.a'), ctx);
      explanation = fact(ctx, '10.2.b');
      f.visual.append(term.el, explanation);
      lanes = [
        timingLane('Regex · stream interrupt', ['Streaming', 'Match', 'Inject / retry'], 'The attempt can be interrupted mid-stream.'),
        timingLane('AST · execution gate', ['Final arguments', 'AST check', 'Execution'], 'Source-bearing arguments; before execution.'),
        timingLane('Judged question · after output', ['Output complete', 'Judge', 'Guidance'], 'No stream interruption; judge must be available.'),
      ];
      security = node('p', 'ch10-context-boundary', 'Corrective guidance ≠ security containment');
      f.aside!.append(...lanes.map(lane => lane.el), security);
      f.notes.replaceChildren(noticeEvidence,
        node('p', '', 'Source-derived, illustrative notice; not a captured stream or resumed event.'),
        node('p', '', 'One usable Anthropic account; unchanged catalog; no competing usable chat provider or explicit model override.'));
    },
    render(ctx) {
      term.render(story, ctx.t, ctx.reducedMotion);
      reveal(noticeEvidence, beat(ctx, '10.2.1'), ctx.reducedMotion);
      reveal(explanation, beat(ctx, '10.2.3'), ctx.reducedMotion);
      lanes.forEach((lane, i) => {
        const sentence = `10.2.${i + 1}`;
        const p = ctx.reducedMotion ? 1 : ctx.progress(sentence);
        lane.el.style.opacity = String(beat(ctx, sentence));
        lane.track.style.transform = `scaleX(${p})`;
        lane.marker.style.transform = `translateX(${p * 570}px)`;
      });
      reveal(security, beat(ctx, '10.2.4'), ctx.reducedMotion);
    },
  };
})();

export const scene103: SceneModule = (() => {
  let term: ReturnType<typeof terminal>, story: TerminalScript;
  let compactEvidence: HTMLElement, handoffEvidence: HTMLElement, explanation: HTMLElement;
  let summary: HTMLElement, snapLabel: HTMLElement, tiles: HTMLElement, tail: HTMLElement, handoff: HTMLElement, cost: HTMLElement;
  let older: HTMLElement[], visible: HTMLElement, identity: HTMLElement;
  return {
    id: '10.3',
    mount(stage, ctx) {
      const f = frame(stage, ctx);
      term = terminal(5);
      story = script(ctx, 5);
      story.events.push(typed(ctx, '10.3.1', '/compact'));
      const first = ctx.sentence('10.3.1');
      story.events.push({ at: first.start + (first.end - first.start) * 0.68, op: 'print', lines: [ompUi.prompt({ width: cols, text: '/compact' }), [{ text: ' ' }, { text: 'Session compacted 1 time', fg: 'comment' }]] });
      story.events.push(typed(ctx, '10.3.4', '/handoff Focus on the coupon expiry boundary'));
      compactEvidence = node('div', 'ch10-context-evidence');
      compactEvidence.append(node('span', '', '/compact'));
      withEvidence(compactEvidence, ctx.onScreen('10.3.a'), ctx);
      handoffEvidence = node('div', 'ch10-context-evidence');
      handoffEvidence.append(node('span', '', '/handoff'));
      withEvidence(handoffEvidence, ctx.onScreen('10.3.c'), ctx);
      explanation = fact(ctx, '10.3.b');
      const commands = node('div', 'ch10-context-command-evidence');
      commands.append(compactEvidence, handoffEvidence);
      f.visual.append(term.el, commands, explanation);
      const dual = node('div', 'ch10-context-dual');
      const screenLane = node('section', 'ch10-context-history');
      screenLane.append(node('h3', '', 'Visible scrollback · preserved'));
      visible = node('div', 'ch10-context-scroll');
      ['Coupon investigation', 'isExpired → checkout', 'Inclusive boundary', 'Recent checkout discussion'].forEach(text => visible.append(node('p', '', text)));
      screenLane.append(visible);
      const modelLane = node('section', 'ch10-context-history ch10-context-model');
      modelLane.append(node('h3', '', 'Model-visible context'));
      const transformArea = node('div', 'ch10-context-transform-area');
      const prior = node('div', 'ch10-context-prior');
      older = ['Coupon investigation', 'Expiry policy'].map(text => node('p', '', text));
      prior.append(...older);
      summary = node('div', 'ch10-context-summary');
      summary.append(node('strong', '', 'Compaction'), node('span', '', 'Summary + recent tail'));
      snapLabel = node('p', 'ch10-context-snap-label', 'Snapcompact · instead');
      tiles = node('div', 'ch10-context-raster');
      tiles.append(node('span', '', 'Local raster tiles'), node('span', '', 'Bounded archive'));
      transformArea.append(prior, tiles);
      tail = node('p', 'ch10-context-tail', '+ Recent tail');
      modelLane.append(summary, snapLabel, transformArea, tail);
      dual.append(screenLane, modelLane);
      cost = node('p', 'ch10-context-image-cost', 'Vision required · downstream image costs remain');
      identity = node('p', 'ch10-context-identity', 'Same session identity');
      handoff = node('div', 'ch10-context-handoff');
      handoff.append(node('h3', '', 'Focused handoff document'), node('p', '', 'Coupon expiry boundary · not another agent'));
      f.aside!.append(dual, cost, identity, handoff);
    },
    render(ctx) {
      term.render(story, ctx.t, ctx.reducedMotion);
      reveal(compactEvidence, beat(ctx, '10.3.1'), ctx.reducedMotion);
      reveal(handoffEvidence, beat(ctx, '10.3.4'), ctx.reducedMotion);
      reveal(explanation, beat(ctx, '10.3.2'), ctx.reducedMotion);
      const compact = beat(ctx, '10.3.1');
      const snap = ctx.reducedMotion ? 1 : ctx.progress('10.3.2');
      const alternative = beat(ctx, '10.3.2');
      older.forEach(el => {
        el.style.opacity = String(Math.max(0, 1 - snap * 2) * alternative);
        el.style.transform = 'none';
      });
      summary.style.opacity = String(compact);
      summary.style.transform = 'none';
      snapLabel.style.opacity = String(alternative);
      tiles.style.opacity = String(Math.max(0, (snap - 0.5) * 2));
      tiles.style.transform = `translateY(${(1 - snap) * 8}px)`;
      tail.style.opacity = String(alternative);
      visible.style.opacity = '1';
      reveal(cost, beat(ctx, '10.3.3'), ctx.reducedMotion);
      identity.style.opacity = '1';
      const p = beat(ctx, '10.3.4');
      handoff.style.opacity = String(p);
      handoff.style.transform = `translateY(${12 * (1 - p)}px)`;
    },
  };
})();
