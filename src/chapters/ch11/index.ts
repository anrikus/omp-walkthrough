import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { ease } from '../../kit';
import { reveal, sceneFrame, withEvidence } from '../shared/scene';
import './settings.css';

type Beat = { el: HTMLElement; sentence: string; rule?: HTMLElement };

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderBeat(beat: Beat, ctx: RenderContext): void {
  const progress = ctx.progress(beat.sentence);
  const shown = Math.min(1, progress * 4);
  reveal(beat.el, shown, ctx.reducedMotion);
  beat.el.inert = !ctx.reducedMotion && shown < 1;
  if (beat.rule) beat.rule.style.transform = `scaleX(${ctx.reducedMotion ? 1 : ease(progress)})`;
}

function evidenceText(ctx: MountContext, id: string, className: string): HTMLElement {
  const item = ctx.onScreen(id);
  const card = element('section', className);
  card.dataset.item = id;
  const text = element('p', 'settings-copy');
  // Keep the source wording and separators intact while distinguishing recommendation classes.
  const parts = item.text.split(/(Official guidance|Official documented pattern|Behavior-justified|Editorial synthesis)/g);
  for (const part of parts) {
    if (/^(Official guidance|Official documented pattern|Behavior-justified|Editorial synthesis)$/.test(part)) {
      text.append(element('strong', 'settings-class', part));
    } else {
      text.append(document.createTextNode(part));
    }
  }
  card.append(text);
  withEvidence(card, item, ctx);
  return card;
}

type SettingPart = readonly [role: 'class' | 'key' | 'value' | 'effect' | 'context' | 'statement' | 'caveat', start: string];

// Boundaries are exact source substrings; slices retain every word and qualifier from ctx.onScreen.
const settingParts: Record<string, readonly SettingPart[]> = {
  '11.2.a': [['class', 'Behavior-justified'], ['key', 'tools.approvalMode:'], ['value', 'write'], ['effect', 'reads/writes allowed'], ['value', 'always-ask'], ['effect', 'edits prompt too'], ['caveat', 'not inherited child confinement']],
  '11.2.b': [['class', 'Official guidance'], ['key', 'tools.approval.eval:'], ['value', 'prompt (or deny)'], ['effect', 'bash pattern rules']],
  '11.2.c': [['class', 'Official guidance'], ['context', 'WATCHDOG.yml'], ['key', 'advisors[].tools:'], ['value', 'retain default read, grep, glob and optional recall'], ['effect', 'do not add']],
  '11.2.d': [['class', 'Behavior-justified'], ['key', '/collab'], ['value', 'view'], ['effect', 'observation'], ['class', 'Behavior-justified'], ['key', '--config'], ['effect', 'process-local overlays']],
  '11.3.a': [['class', 'Behavior-justified'], ['key', 'task.enableLsp:'], ['value', 'false'], ['effect', 'for search-only workers']],
  '11.3.b': [['class', 'Behavior-justified'], ['key', 'task.maxConcurrency:'], ['value', 'choose a finite numeric limit'], ['effect', 'shipped 32'], ['class', 'Behavior-justified'], ['key', 'providers.maxInFlightRequests:'], ['value', 'positive per-provider limits matching your allowance'], ['effect', '{} leaves providers uncapped']],
  '11.3.c': [['class', 'Official guidance'], ['key', 'write'], ['value', 'agent://<id>'], ['effect', 'for retained follow-up'], ['class', 'Behavior-justified'], ['key', 'autolearn.autoContinue:'], ['value', 'false'], ['effect', 'avoid extra autonomous']],
  '11.4.a': [['class', 'Official guidance'], ['key', 'modelRoles.<role>:'], ['value', 'provider/model-id'], ['key', 'task.agentModelOverrides.<agent>:'], ['value', '"@<role>"'], ['effect', 'explanatory notation']],
  '11.4.b': [['class', 'Official documented pattern'], ['context', 'default advisor without a WATCHDOG roster:'], ['key', 'advisor.enabled:'], ['value', 'true'], ['key', 'advisor.reviewMode:'], ['value', 'agent-end'], ['key', 'advisor.syncBacklog:'], ['value', 'strict'], ['effect', 'opt-in']],
  '11.4.c': [['class', 'Behavior-justified'], ['context', 'per-call'], ['key', 'schemaMode:'], ['value', 'strict'], ['effect', 'fail after exhausted'], ['class', 'Behavior-justified'], ['key', 'task.showResolvedModelBadge:'], ['value', 'true'], ['effect', 'explicit deviation']],
  '11.4.d': [['class', 'Editorial synthesis'], ['statement', 'cross-family review ablation:'], ['effect', 'compare equally capable']],
};

function settingCard(ctx: MountContext, id: string): HTMLElement {
  const item = ctx.onScreen(id);
  const card = element('section', 'settings-setting');
  card.dataset.item = id;
  const content = element('div', 'settings-setting-content');
  const parts = settingParts[id]!;
  let offset = 0;
  let pair: HTMLElement | undefined;
  parts.forEach(([role, start], index) => {
    const next = parts[index + 1];
    const end = next ? item.text.indexOf(next[1], offset + start.length) : item.text.length;
    if (end < 0 || !item.text.startsWith(start, offset)) throw new Error(`Setting boundaries do not match ${id}`);
    const text = item.text.slice(offset, end).replace(/^[\s·;—]+|[\s·;—]+$/g, '');
    const part = element(role === 'value' ? 'strong' : 'span', `settings-part settings-part--${role}`, text);
    if (role === 'key' || role === 'value') {
      if (role === 'key' || !pair) {
        pair = element('p', 'settings-key-value');
        content.append(pair);
      }
      pair.append(part);
    } else {
      pair = undefined;
      content.append(part);
    }
    offset = end;
  });
  card.append(content);
  withEvidence(card, item, ctx);
  return card;
}

function profile(id: string, goal: string, itemIds: string[], noteSentence: string): SceneModule {
  let beats: Beat[] = [];
  let noteBeat: Beat;
  return {
    id,
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, eyebrow: goal, date: '2026-10-08' });
      frame.el.classList.add('settings-scene');
      const grid = element('div', `settings-profile settings-profile--${id === '11.3' ? 'cost' : id === '11.4' ? 'rigor' : 'safety'}`);
      grid.setAttribute('role', 'group');
      grid.setAttribute('aria-label', `${ctx.scene.title} conditional profile`);
      beats = itemIds.map((itemId) => {
        const item = ctx.onScreen(itemId);
        const card = settingCard(ctx, itemId);
        const rule = element('span', 'settings-setting-rule');
        rule.setAttribute('aria-hidden', 'true');
        card.append(rule);
        grid.append(card);
        return { el: card, sentence: item.at!, rule };
      });
      frame.visual.append(grid);
      const source = ctx.scene.sentences.find((sentence) => sentence.id === noteSentence)!;
      const qualification = element('p', 'settings-qualification', source.text);
      const refs = element('button', 'scene-evidence-button', 'Evidence');
      refs.type = 'button';
      refs.setAttribute('aria-label', `Evidence for ${source.text}`);
      ctx.cite(refs, { claims: source.claims, sources: source.sources });
      const row = element('div', 'settings-note-row');
      row.append(qualification, refs);
      frame.notes.append(row);
      noteBeat = { el: row, sentence: noteSentence };
    },
    render(ctx) {
      beats.forEach((beat) => renderBeat(beat, ctx));
      renderBeat(noteBeat, ctx);
    },
  };
}

let opening: Beat[] = [];
let goalLines: HTMLElement[] = [];
const defaults: SceneModule = {
  id: '11.1',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, eyebrow: 'Choose a goal before changing a setting', date: '2026-10-08' });
    frame.el.classList.add('settings-scene');
    const composition = element('div', 'settings-opener');
    const premise = evidenceText(ctx, '11.1.a', 'settings-premise');
    const choices = element('ul', 'settings-goals');
    goalLines = ['Safety-first', 'Cost-conscious', 'Max-rigor'].map((name) => {
      const choice = element('li', 'settings-goal', name);
      choices.append(choice);
      return choice;
    });
    premise.append(choices);
    const shipped = evidenceText(ctx, '11.1.b', 'settings-defaults');
    composition.append(premise, shipped);
    frame.visual.append(composition);
    const comparison = element('p', 'settings-compare');
    comparison.append(element('span', '', 'Shipped defaults'), element('span', 'settings-compare-line'), element('strong', '', 'Deliberate deviations'));
    frame.notes.append(comparison);
    opening = [
      { el: premise, sentence: '11.1.1' },
      { el: shipped, sentence: '11.1.2' },
      { el: choices, sentence: '11.1.2' },
      { el: comparison, sentence: '11.1.3' },
    ];
  },
  render(ctx) {
    opening.forEach((beat) => renderBeat(beat, ctx));
    const p = ctx.progress('11.1.2');
    goalLines.forEach((line, i) => {
      const beat = ctx.reducedMotion ? 1 : ease(Math.max(0, Math.min(1, p * 3 - i * 0.45)));
      line.style.opacity = String(beat);
      line.style.transform = `translateX(${(1 - beat) * -24}px)`;
    });
  },
};

const safety = profile('11.2', 'Interactive safety · conditional recommendations', ['11.2.a', '11.2.b', '11.2.c', '11.2.d'], '11.2.5');
const cost = profile('11.3', 'Controlled spending · conditional recommendations', ['11.3.a', '11.3.b', '11.3.c'], '11.3.4');
const rigor = profile('11.4', 'Explicit review · conditional recommendations', ['11.4.a', '11.4.b', '11.4.c', '11.4.d'], '11.4.4');

let measurementBeats: Beat[] = [];
let loopNodes: HTMLElement[] = [];
let connector: SVGPathElement;
let benefit: HTMLElement;
const measure: SceneModule = {
  id: '11.5',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, { title: ctx.scene.title, eyebrow: 'The profile is a hypothesis', date: '2026-10-08' });
    frame.el.classList.add('settings-scene');
    const loop = element('div', 'settings-loop');
    const labels = ['Strong simple baseline', 'Record model IDs / configuration / date', 'Validated quality / total cost / latency', 'Re-evaluate after changes'];
    loopNodes = labels.map((label, i) => {
      const node = element('div', `settings-loop-node settings-loop-node--${i}`, label);
      loop.append(node);
      return node;
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1760 340');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('settings-loop-path');
    const track = document.createElementNS(svg.namespaceURI, 'path') as SVGPathElement;
    const path = 'M 230 128 H 1530 Q 1710 128 1710 234 Q 1710 320 1530 320 H 230 Q 50 320 50 234 Q 50 128 230 128';
    track.setAttribute('d', path);
    track.classList.add('settings-loop-track');
    connector = document.createElementNS(svg.namespaceURI, 'path') as SVGPathElement;
    connector.setAttribute('d', path);
    connector.setAttribute('pathLength', '1');
    connector.classList.add('settings-loop-connector');
    svg.append(track, connector);
    loop.prepend(svg);
    frame.visual.append(loop);
    const method = evidenceText(ctx, '11.5.a', 'settings-method');
    frame.visual.append(method);
    const benefitSentence = ctx.scene.sentences.find((sentence) => sentence.id === '11.5.2')!;
    benefit = element('section', 'settings-benefit');
    benefit.append(element('p', 'settings-copy', benefitSentence.text));
    withEvidence(benefit, { ...benefitSentence, kind: 'label' }, ctx);
    frame.visual.append(benefit);
    const landing = evidenceText(ctx, '11.5.b', 'settings-landing');
    frame.notes.append(landing);
    measurementBeats = [
      { el: method, sentence: '11.5.1' },
      { el: benefit, sentence: '11.5.2' },
      { el: landing, sentence: '11.5.3' },
    ];
  },
  render(ctx) {
    measurementBeats.forEach((beat) => renderBeat(beat, ctx));
    loopNodes.forEach((node, i) => {
      const progress = i === 3 ? Math.min(1, ctx.progress('11.5.3') * 4) : Math.max(0, Math.min(1, ctx.progress('11.5.1') * 3 - i * 0.7));
      reveal(node, progress, ctx.reducedMotion);
    });
    const progress = ctx.reducedMotion ? 1 : (ctx.progress('11.5.1') * 0.45 + ctx.progress('11.5.2') * 0.2 + ctx.progress('11.5.3') * 0.35);
    connector.setAttribute('stroke-dasharray', `${progress} 1`);
  },
};

const chapter: ChapterModule = {
  id: 'ch11',
  scenes: { '11.1': defaults, '11.2': safety, '11.3': cost, '11.4': rigor, '11.5': measure },
};
export default chapter;
