import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { dateStamp, ease, statCard } from '../../kit';
import { sceneFrame, withEvidence } from '../shared/scene';
import './scenes.css';

type Motion = (ctx: RenderContext) => void;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function progress(ctx: RenderContext, sentence: string): number {
  return ctx.reducedMotion ? 1 : ease(Math.min(1, ctx.progress(sentence) * 4));
}

function show(el: HTMLElement, p: number, reduced: boolean, axis: 'x' | 'y' = 'y'): void {
  el.style.opacity = String(p);
  el.style.transform = reduced ? 'none' : `translate${axis.toUpperCase()}(${(1 - p) * 24}px)`;
  el.toggleAttribute('inert', p === 0);
}

function entrance(el: HTMLElement, sentence: string): Motion {
  return ctx => show(el, progress(ctx, sentence), ctx.reducedMotion);
}

function item(ctx: MountContext, id: string, className = '', dated = false): HTMLElement {
  const data = ctx.onScreen(id);
  const el = element('section', `mainstream-item ${className}`);
  el.dataset.onScreen = id;
  el.append(element('p', 'mainstream-copy', data.text));
  const evidence = withEvidence(el, data, ctx);
  if (dated) evidence?.append(dateStamp('2026-10-08').el);
  return el;
}

function panel(title: string, className = ''): HTMLElement {
  const el = element('section', `mainstream-panel ${className}`);
  el.append(element('h3', 'mainstream-heading', title));
  return el;
}

function makeScene(id: string, build: (frame: ReturnType<typeof sceneFrame>, ctx: MountContext, motions: Motion[]) => void): SceneModule {
  let motions: Motion[] = [];
  return {
    id,
    mount(stage, ctx) {
      motions = [];
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('mainstream');
      build(frame, ctx, motions);
    },
    render(ctx) { for (const motion of motions) motion(ctx); },
    unmount() { motions = []; },
  };
}

const strengths = makeScene('4.1', (frame, ctx, motions) => {
  const current = item(ctx, '4.1.a', 'mainstream-current');
  frame.visual.append(current);
  const products = element('div', 'mainstream-products');
  const codex = panel('Codex CLI');
  const claude = panel('Claude Code');
  const codexText = item(ctx, '4.1.b');
  const claudeText = item(ctx, '4.1.c');
  codex.append(codexText);
  claude.append(claudeText);
  products.append(codex, claude);
  frame.visual.append(products);
  const caveat = element('p', 'mainstream-note', 'Provider compatibility depends on the selected model and API. Local language-server setup still matters.');
  frame.notes.append(caveat);
  motions.push(entrance(current, '4.1.1'), entrance(codexText, '4.1.2'), entrance(claudeText, '4.1.3'), entrance(caveat, '4.1.4'));
});

const layers = makeScene('4.2', (frame, ctx, motions) => {
  const map = element('div', 'mainstream-layer-map');
  const laneNames = ['Harness', 'Tool boundary', 'API', 'Serving infrastructure'];
  const boxes = laneNames.map((name, i) => {
    const box = panel(name, i === 3 ? 'mainstream-serving' : '');
    if (i === 3) box.append(element('p', 'mainstream-layer-detail', 'September 2025 incident'));
    map.append(box);
    return box;
  });
  const connector = element('div', 'mainstream-connector');
  connector.setAttribute('aria-hidden', 'true');
  map.append(connector);
  const account = item(ctx, '4.2.a', 'mainstream-postmortem');
  frame.visual.append(map, account);
  const takeaway = element('p', 'mainstream-note', 'Changing the harness does not remove the dependency on model-serving infrastructure.');
  frame.notes.append(takeaway);
  motions.push(entrance(account, '4.2.1'), entrance(takeaway, '4.2.2'));
  motions.push(c => {
    const p = progress(c, '4.2.1');
    connector.style.transform = `scaleX(${p})`;
    boxes[3]!.style.transform = c.reducedMotion ? 'none' : `translateY(${-12 * p}px)`;
    boxes[3]!.style.opacity = String(0.55 + 0.45 * p);
  });
});

const contextHistory = makeScene('4.3', (frame, ctx, motions) => {
  const pair = element('div', 'mainstream-history-pair');
  const historic = panel('Historical example · 2025-11-24');
  const historicData = ctx.onScreen('4.3.a');
  const stat = statCard({ value: '58 tools ≈ 55K tokens', label: 'Before conversation', condition: historicData.text });
  stat.el.dataset.onScreen = historicData.id;
  withEvidence(stat.el, historicData, ctx);
  historic.append(stat.el);
  const current = panel('Current mitigation · 2026-10-08');
  const deferred = element('div', 'mainstream-context-gate');
  const names = element('span', '', 'Names + instructions');
  const gate = element('span', 'mainstream-gate', 'On demand');
  const definitions = element('span', '', 'Tool definitions');
  deferred.append(names, gate, definitions);
  current.append(deferred, item(ctx, '4.3.b'));
  pair.append(historic, current);
  // The supplied creator account is a paraphrase, not a quotation.
  const creator = item(ctx, '4.3.c', 'mainstream-creator');
  frame.visual.append(pair, creator);
  const lesson = element('p', 'mainstream-note', 'The design decision is when tool information enters context—not simply the number of tools.');
  frame.notes.append(lesson);
  motions.push(entrance(historic, '4.3.1'), entrance(current, '4.3.2'), entrance(creator, '4.3.3'), entrance(lesson, '4.3.4'));
  motions.push(c => { gate.style.transform = `scaleX(${0.8 + 0.2 * progress(c, '4.3.2')})`; });
});

const policy = makeScene('4.4', (frame, ctx, motions) => {
  frame.visual.classList.add('mainstream-policy-layout');
  const lanes = element('div', 'mainstream-policy-lanes');
  const credentials = panel('Credential handling', 'mainstream-policy-card');
  const billing = panel('Billing', 'mainstream-policy-card');
  const credentialStack = element('div', 'mainstream-policy-stack');
  const credentialRules = item(ctx, '4.4.a', '', true);
  const hosted = item(ctx, '4.4.d', 'mainstream-hosted', true);
  credentialStack.append(credentialRules, hosted);
  credentials.append(credentialStack);
  const dates = element('div', 'mainstream-policy-dates');
  dates.append(element('span', '', '2026-06-15\nSDK changes paused'), element('span', 'mainstream-date-arrow', '→'), element('span', '', '2026-10-07\nSubscription update'));
  const billingRules = item(ctx, '4.4.b', '', true);
  const license = item(ctx, '4.4.e', 'mainstream-license', true);
  billing.append(dates, billingRules, license);
  lanes.append(credentials, billing);
  const interpretation = item(ctx, '4.4.c', 'mainstream-interpretation', true);
  frame.visual.append(lanes, interpretation);
  frame.notes.append(element('p', 'mainstream-note', 'A billing allowance is not a certification of a third-party authentication implementation.'));
  motions.push(entrance(credentials, '4.4.1'), entrance(license, '4.4.1'), entrance(billingRules, '4.4.2'), entrance(dates, '4.4.2'), entrance(hosted, '4.4.3'), entrance(interpretation, '4.4.3'));
});

const tradeoffs = makeScene('4.5', (frame, ctx, motions) => {
  const continuity = panel('Continuity ↔ recall', 'mainstream-continuity-card');
  const balance = element('div', 'mainstream-balance');
  const strength = element('p', 'mainstream-balance-side', 'Strength: continuity');
  const cost = element('p', 'mainstream-balance-side', 'Cost: recall + observability');
  const hinge = element('span', 'mainstream-balance-hinge', '↔');
  balance.append(strength, hinge, cost);
  continuity.append(balance, item(ctx, '4.5.a', 'mainstream-continuity-copy'));
  const boundary = panel('Local Bash sandbox', 'mainstream-boundary-column');
  const scope = element('div', 'mainstream-scope');
  const enclosure = element('p', 'mainstream-enclosure', 'Shell only · default off');
  const outside = element('p', 'mainstream-outside', 'Outside: file/web · MCP · LSP · hooks');
  scope.append(enclosure, outside);
  boundary.append(scope, item(ctx, '4.5.b'));
  const research = element('div', 'mainstream-security-research');
  const hardening = panel('Observed hardening', 'mainstream-hardening');
  hardening.append(item(ctx, '4.5.d'));
  const patched = panel('Historical · patched advisories', 'mainstream-patched');
  patched.append(item(ctx, '4.5.c'));
  research.append(hardening, patched);
  const choices = element('div', 'mainstream-tradeoff-choices');
  choices.append(continuity, boundary);
  frame.visual.classList.add('mainstream-tradeoff-grid');
  frame.visual.append(choices, research);
  const note = element('p', 'mainstream-note', 'Check the actual tool and process boundary. A patched flaw or a tested attack is not a population risk estimate.');
  frame.notes.append(note);
  motions.push(c => {
    show(continuity, progress(c, '4.5.1'), c.reducedMotion);
    show(boundary, progress(c, '4.5.3'), c.reducedMotion);
    show(hardening, progress(c, '4.5.4'), c.reducedMotion);
    show(patched, progress(c, '4.5.4'), c.reducedMotion);
    outside.dataset.highlight = String(c.reducedMotion || c.t >= c.sentence('4.5.5').start);
    hinge.style.transform = c.reducedMotion ? 'none' : `scaleX(${0.7 + 0.3 * progress(c, '4.5.2')})`;
  }, entrance(note, '4.5.5'));
});

const outcomes = makeScene('4.6', (frame, ctx, motions) => {
  const composition = element('div', 'mainstream-outcome');
  const funnel = element('div', 'mainstream-funnel');
  funnel.append(element('h3', 'mainstream-heading', 'Early Claude Code-assisted contributions'));
  const submitted = element('div', 'mainstream-funnel-row mainstream-submitted');
  submitted.append(element('strong', '', '567'), element('span', '', 'Marked PRs in the observed sample'));
  const merged = element('div', 'mainstream-funnel-row mainstream-merged');
  merged.append(element('strong', '', '475 / 567'), element('span', '', 'Merged'));
  const revision = element('div', 'mainstream-revision');
  revision.append(element('strong', '', '214 / 475'), element('span', '', 'Merged PRs needed revisions'));
  const human = element('p', 'mainstream-human', 'Matched human PRs also commonly revised.');
  funnel.append(submitted, merged, revision, human);
  const conditions = item(ctx, '4.6.a', 'mainstream-outcome-conditions');
  composition.append(funnel, conditions);
  frame.visual.append(composition);
  const caveat = element('p', 'mainstream-note', 'Contribution workflow ≠ current defect rate ≠ controlled harness comparison.');
  frame.notes.append(caveat);
  motions.push(entrance(conditions, '4.6.1'), entrance(submitted, '4.6.1'), entrance(merged, '4.6.1'), entrance(revision, '4.6.2'), entrance(human, '4.6.2'), entrance(caveat, '4.6.3'));
  motions.push(c => { merged.style.transform = c.reducedMotion ? 'none' : `translateX(${(1 - progress(c, '4.6.1')) * 60}px)`; });
});

const questions = makeScene('4.7', (frame, ctx, motions) => {
  const outcomes = element('div', 'mainstream-outcome-pair');
  const benchmark = panel('Benchmark result');
  benchmark.append(element('p', 'mainstream-subtitle', 'Passing the evaluated task'));
  const accepted = panel('Accepted contribution');
  accepted.append(element('p', 'mainstream-subtitle', 'Work accepted and maintained'));
  outcomes.append(benchmark, element('span', 'mainstream-not-equal', '≠'), accepted);
  const cards = element('div', 'mainstream-question-grid');
  const labels = ['Provider freedom', 'Integration depth', 'Deployment scope', 'Out-of-box defaults'];
  const cardsList = labels.map(label => {
    const card = panel(label);
    cards.append(card);
    return card;
  });
  const summary = item(ctx, '4.7.a', 'mainstream-question-summary');
  frame.visual.append(outcomes, cards, summary);
  frame.notes.append(element('p', 'mainstream-note', 'Different priorities—not a vendor ranking.'));
  motions.push(entrance(outcomes, '4.7.1'), entrance(summary, '4.7.2'));
  motions.push(c => {
    const p = c.progress('4.7.2');
    cardsList.forEach((card, i) => show(card, c.reducedMotion ? 1 : ease(Math.min(1, Math.max(0, p * 5 - i * 0.45))), c.reducedMotion));
  });
});

const chapter: ChapterModule = {
  id: 'ch04',
  scenes: { '4.1': strengths, '4.2': layers, '4.3': contextHistory, '4.4': policy, '4.5': tradeoffs, '4.6': outcomes, '4.7': questions },
};
export default chapter;
