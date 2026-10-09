import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { ease, quoteCard, statCard } from '../../kit';
import { sceneFrame, withEvidence } from '../shared/scene';
import './origins.css';

const NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fact(ctx: MountContext, id: string, className = ''): HTMLElement {
  const item = ctx.onScreen(id);
  const card = el('section', `origins-fact ${className}`);
  card.dataset.onScreen = id;
  card.append(el('p', 'origins-exact', item.text));
  withEvidence(card, item, ctx);
  return card;
}

function quotation(ctx: MountContext, id: string): HTMLElement {
  const item = ctx.onScreen(id);
  const attribution = item.text.indexOf(' — ');
  const card = quoteCard({
    quote: item.text.slice(0, attribution),
    attribution: item.text.slice(attribution),
  });
  card.el.classList.add('origins-quote');
  card.el.dataset.onScreen = id;
  withEvidence(card.el, item, ctx);
  return card.el;
}

function started(ctx: RenderContext, sentence: string): boolean {
  return ctx.reducedMotion || ctx.t >= ctx.sentence(sentence).start;
}

function enter(node: HTMLElement, ctx: RenderContext, sentence: string): void {
  const visible = started(ctx, sentence);
  const p = ctx.reducedMotion ? 1 : ease(Math.min(1, ctx.progress(sentence) * 4));
  node.inert = !visible;
  node.style.opacity = String(p);
  node.style.transform = `translateY(${(1 - p) * 12}px)`;
}

function page(node: HTMLElement, visible: boolean): void {
  node.hidden = !visible;
  node.inert = !visible;
}

function panel(title: string, detail: string): HTMLElement {
  const node = el('section', 'origins-node');
  node.append(el('h3', '', title), el('p', '', detail));
  return node;
}

function philosophyCards(): { el: HTMLElement; cards: HTMLElement[] } {
  const root = el('div', 'origins-philosophies');
  const cards = [
    panel('Pi', 'Control'),
    panel('omp', 'Integrated developer tools'),
    panel('Hermes Agent', 'Persistent learning'),
    panel('OpenClaw', 'Assistant connectivity'),
  ];
  root.append(...cards);
  return { el: root, cards };
}

interface Drawing {
  el: HTMLElement;
  node(title: string, detail: string, x: number, y: number, width: number, height: number, className?: string): HTMLElement;
  line(path: string, dashed?: boolean): SVGPathElement;
}

function drawing(width: number, height: number, description: string): Drawing {
  const root = el('div', 'origins-drawing');
  root.style.width = `${width}px`;
  root.style.height = `${height}px`;
  root.setAttribute('aria-label', description);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');
  root.append(svg);
  return {
    el: root,
    node(title, detail, x, y, nodeWidth, nodeHeight, className = '') {
      const node = panel(title, detail);
      node.classList.add('origins-positioned');
      if (className) node.classList.add(className);
      Object.assign(node.style, { left: `${x}px`, top: `${y}px`, width: `${nodeWidth}px`, height: `${nodeHeight}px` });
      root.append(node);
      return node;
    },
    line(path, dashed = false) {
      const line = document.createElementNS(NS, 'path');
      line.setAttribute('d', path);
      line.setAttribute('pathLength', '1');
      line.classList.add(dashed ? 'origins-link--historical' : 'origins-link');
      svg.append(line);
      return line;
    },
  };
}

function trace(line: SVGPathElement, progress: number, reducedMotion: boolean): void {
  const p = reducedMotion ? 1 : ease(Math.max(0, Math.min(1, progress)));
  line.setAttribute('stroke-dasharray', '1');
  line.setAttribute('stroke-dashoffset', String(1 - p));
  line.style.opacity = String(p > 0 ? 1 : 0);
}

const philosophies: SceneModule = (() => {
  let board: ReturnType<typeof philosophyCards>;
  let synthesis: HTMLElement;
  let license: HTMLElement;
  return {
    id: '5.1',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('origins');
      board = philosophyCards();
      synthesis = fact(ctx, '5.1.a', 'origins-synthesis');
      license = fact(ctx, '5.1.b', 'origins-footer-fact');
      frame.visual.append(board.el, synthesis);
      frame.notes.append(license);
    },
    render(ctx) {
      enter(board.el, ctx, '5.1.1');
      enter(synthesis, ctx, '5.1.1');
      enter(license, ctx, '5.1.3');
      const p = ctx.reducedMotion ? 1 : ease(ctx.progress('5.1.2'));
      board.cards.forEach((card, index) => {
        card.style.transform = `translateX(${(index % 2 === 0 ? -1 : 1) * 22 * (1 - p)}px)`;
        card.dataset.emphasis = p > 0 ? 'active' : 'rest';
      });
    },
  };
})();

const pi: SceneModule = (() => {
  let quote: HTMLElement;
  let dates: HTMLElement;
  let historical: HTMLElement;
  let current: HTMLElement;
  let historicalFact: HTMLElement;
  let currentFact: HTMLElement;
  let tools: HTMLElement[];
  let prompt: ReturnType<typeof statCard>;
  let discovery: SVGPathElement[];
  let boundary: HTMLElement;
  return {
    id: '5.2',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('origins');
      const layout = el('div', 'origins-pi-layout');
      const attribution = el('div', 'origins-pi-attribution');
      quote = quotation(ctx, '5.2.a');
      const evolution = el('div', 'origins-evolution');
      dates = el('div', 'origins-dates');
      dates.append(el('span', '', '2025-11-30 · creator account'), el('span', '', '2026-09-29 · v0.99.0 release'));
      const pages = el('div', 'origins-pages');
      historical = el('div', 'origins-pi-history');
      const recipe = el('div', 'origins-tool-recipe');
      tools = ['read', 'write', 'edit', 'bash'].map(name => el('div', 'origins-tool', name));
      recipe.append(...tools);
      prompt = statCard({ value: '< 1,000 tokens', label: 'System prompt + tool definitions', condition: 'November 2025 · original recipe · creator-reported' });
      prompt.el.classList.add('origins-prompt-size');
      historicalFact = fact(ctx, '5.2.b');
      attribution.append(quote, historicalFact);
      historical.append(recipe, prompt.el);
      current = el('div', 'origins-pi-current');
      const map = drawing(1072, 240, 'The model uses tool search and JavaScript codemode to discover MCP server tools; server tools are outside direct model declarations.');
      map.node('Model', 'Controlled context', 0, 30, 245, 152);
      map.node('Tool search', 'JavaScript codemode', 335, 30, 325, 152);
      map.node('MCP servers', 'Discover tools', 755, 30, 317, 152);
      discovery = [map.line('M245 106 H335'), map.line('M660 106 H755')];
      boundary = el('p', 'origins-discovery-boundary', 'Server tools are not each declared directly to the model');
      currentFact = fact(ctx, '5.2.c');
      current.append(map.el, boundary, currentFact);
      pages.append(historical, current);
      evolution.append(dates, pages);
      layout.append(attribution, evolution);
      frame.visual.append(layout);
      frame.notes.append(el('p', 'origins-note', 'Historical recipe and current configurable installation are different snapshots.'));
    },
    render(ctx) {
      enter(quote, ctx, '5.2.1');
      enter(dates, ctx, '5.2.1');
      const evolved = ctx.reducedMotion || ctx.t >= ctx.sentence('5.2.4').start;
      page(historical, !evolved);
      page(current, evolved);
      tools.forEach((tool, index) => {
        enter(tool, ctx, '5.2.2');
        const p = ctx.reducedMotion ? 1 : ease(Math.max(0, Math.min(1, ctx.progress('5.2.2') * 4 - index * 0.45)));
        tool.style.transform = `translateY(${(1 - p) * 20}px)`;
      });
      enter(historicalFact, ctx, '5.2.2');
      prompt.render(Math.min(1, ctx.progress('5.2.3') * 3), ctx.reducedMotion);
      prompt.el.inert = !started(ctx, '5.2.3');
      enter(current, ctx, '5.2.4');
      enter(currentFact, ctx, '5.2.4');
      enter(boundary, ctx, '5.2.5');
      discovery.forEach((line, index) => trace(line, ctx.progress('5.2.5') * 2 - index * 0.65, ctx.reducedMotion));
    },
  };
})();

const omp: SceneModule = (() => {
  let lineage: HTMLElement;
  let arrow: SVGPathElement;
  let tools: HTMLElement;
  let branches: SVGPathElement[];
  let quote: HTMLElement;
  let experiment: HTMLElement;
  return {
    id: '5.3',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('origins');
      lineage = el('div', 'origins-lineage-strip');
      const fork = drawing(550, 150, 'Pi to omp is an explicit fork, not a first-release claim.');
      fork.node('Pi', '', 0, 24, 160, 96);
      fork.node('omp', '', 390, 24, 160, 96);
      arrow = fork.line('M160 72 H365 M352 60 L365 72 L352 84');
      const forkLabel = el('p', 'origins-fork-label', 'Explicit fork');
      fork.el.append(forkLabel);
      lineage.append(fork.el, fact(ctx, '5.3.a'));
      const lower = el('div', 'origins-omp-lower');
      tools = el('div', 'origins-integrated');
      const map = drawing(1000, 240, 'omp integrates language servers, a DAP debugger, hash-anchored edits, memory and subagents. These are integration choices, not exclusive capabilities.');
      map.node('omp', 'Integrated surface', 0, 75, 256, 136);
      const labels = ['LSP', 'DAP debugger', 'Hash-anchored edits', 'Memory', 'Subagents'];
      branches = labels.map((label, index) => {
        const y = index * 48;
        map.node(label, '', 450, y, 550, 42, 'origins-tool-node');
        return map.line(`M256 143 H346 V${y + 21} H450`);
      });
      tools.append(map.el, fact(ctx, '5.3.b'));
      quote = quotation(ctx, '5.3.c');
      lower.append(tools, quote);
      frame.visual.append(lineage, lower);
      experiment = el('p', 'origins-note', 'Creator-run editing experiment: change the edit interface; leave model weights alone.');
      frame.notes.append(experiment);
    },
    render(ctx) {
      enter(lineage, ctx, '5.3.1');
      trace(arrow, ctx.progress('5.3.2') * 2, ctx.reducedMotion);
      enter(tools, ctx, '5.3.3');
      branches.forEach((line, index) => trace(line, ctx.progress('5.3.3') * 3 - index * 0.3, ctx.reducedMotion));
      enter(quote, ctx, '5.3.4');
      enter(experiment, ctx, '5.3.5');
    },
  };
})();

const hermes: SceneModule = (() => {
  let release: HTMLElement;
  let quote: HTMLElement;
  let mechanism: HTMLElement;
  let loop: SVGPathElement[];
  let session: HTMLElement;
  let snapshot: HTMLElement;
  let refresh: SVGPathElement;
  let weights: HTMLElement;
  let condition: HTMLElement;
  return {
    id: '5.4',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('origins');
      const layout = el('div', 'origins-hermes-layout');
      const attribution = el('div', 'origins-hermes-attribution');
      release = fact(ctx, '5.4.a');
      quote = quotation(ctx, '5.4.b');
      attribution.append(release, quote);
      const map = drawing(1080, 616, 'Hermes Agent writes external memory and reusable skills. A bounded prompt snapshot refreshes at a new session, not through model training. The Hermes model family is separately trained.');
      mechanism = el('div', 'origins-mechanism');
      const application = el('h3', 'origins-application-title', 'Hermes Agent · application software');
      const interaction = map.node('Interactions', 'Terminal + messaging', 0, 68, 260, 136);
      const store = map.node('External state', 'Memory facts + reusable skills', 395, 68, 330, 136);
      const writeLabel = el('p', 'origins-write-label', 'Tool writes');
      loop = [map.line('M260 110 H395'), map.line('M560 204 V250 H130 V204')];
      mechanism.append(application, writeLabel);
      map.el.append(mechanism);
      session = map.node('New session', 'Refresh boundary', 820, 68, 260, 136);
      snapshot = map.node('Prompt snapshot', 'Bounded store', 735, 284, 345, 108);
      refresh = map.line('M725 124 H820 M950 204 V284 M560 250 V338 H735');
      weights = map.node('Hermes model family', 'Separately trained model weights · not this memory/skills loop', 0, 456, 1080, 132, 'origins-weights');
      const noTraining = el('p', 'origins-no-training', 'External state changes; model weights do not');
      mechanism.append(noTraining);
      // Nodes are siblings of the SVG so semantic text never becomes a scaled diagram label.
      interaction.dataset.hermesLoop = 'interaction';
      store.dataset.hermesLoop = 'store';
      mechanism.append(interaction, store);
      condition = fact(ctx, '5.4.c', 'origins-footer-fact');
      layout.append(attribution, map.el);
      frame.visual.append(layout);
      frame.notes.append(condition);
    },
    render(ctx) {
      enter(release, ctx, '5.4.1');
      enter(quote, ctx, '5.4.2');
      enter(mechanism, ctx, '5.4.2');
      loop.forEach((line, index) => trace(line, ctx.progress('5.4.2') * 2 - index * 0.6, ctx.reducedMotion));
      enter(session, ctx, '5.4.3');
      enter(snapshot, ctx, '5.4.3');
      trace(refresh, ctx.progress('5.4.3') * 1.7, ctx.reducedMotion);
      enter(condition, ctx, '5.4.3');
      enter(weights, ctx, '5.4.4');
    },
  };
})();

const openClaw: SceneModule = (() => {
  let connectivityFact: HTMLElement;
  let ownershipFact: HTMLElement;
  let prioritiesFact: HTMLElement;
  let connectivity: HTMLElement;
  let channels: SVGPathElement[];
  let ownership: HTMLElement;
  let historicalLine: SVGPathElement;
  let currentOwnership: HTMLElement;
  let retained: SVGPathElement;
  let priorities: ReturnType<typeof philosophyCards>;
  return {
    id: '5.5',
    mount(stage, ctx) {
      const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
      frame.el.classList.add('origins');
      const layout = el('div', 'origins-openclaw-layout');
      const facts = el('div', 'origins-openclaw-facts');
      connectivityFact = fact(ctx, '5.5.a');
      ownershipFact = fact(ctx, '5.5.b');
      prioritiesFact = fact(ctx, '5.5.c');
      facts.append(connectivityFact, ownershipFact, prioritiesFact);
      const pages = el('div', 'origins-pages');
      const connected = drawing(1080, 616, 'OpenClaw connects personal devices and chats with user-held state and configurable model providers.');
      connected.node('OpenClaw', 'Peter Steinberger', 350, 212, 380, 150);
      connected.node('Personal devices', '', 0, 22, 340, 100);
      connected.node('Chats', '', 740, 22, 340, 100);
      connected.node('User-held state', '', 0, 464, 340, 100);
      connected.node('Configurable providers', '', 740, 464, 340, 112);
      channels = [
        connected.line('M170 122 V176 H445 V212'),
        connected.line('M910 122 V176 H635 V212'),
        connected.line('M445 362 V410 H170 V464'),
        connected.line('M635 362 V410 H910 V464'),
      ];
      connectivity = connected.el;
      const lineage = drawing(1080, 616, 'Historically OpenClaw integrated Pi. As of October 8 2026 OpenClaw owns its agent runtime while retaining the Pi TUI toolkit dependency. The exact runtime-internalization date is not established.');
      lineage.node('Historical integration', 'Pi → OpenClaw assistant workflow', 0, 0, 1080, 108, 'origins-history-node');
      historicalLine = lineage.line('M130 108 V156 H950 V205', true);
      currentOwnership = el('div', 'origins-current-ownership');
      const currentLabel = el('p', 'origins-ownership-date', 'As of 2026-10-08');
      const runtime = lineage.node('OpenClaw-owned', 'Agent runtime', 0, 230, 470, 148);
      const tui = lineage.node('Pi TUI toolkit', '@earendil-works/pi-tui', 610, 230, 470, 148);
      const retainedLabel = el('p', 'origins-retained-label', 'Retained dependency');
      const uncertainty = el('p', 'origins-uncertainty', 'Exact runtime-internalization date not established');
      currentOwnership.append(currentLabel, runtime, tui, retainedLabel, uncertainty);
      lineage.el.append(currentOwnership);
      retained = lineage.line('M470 304 H610');
      ownership = lineage.el;
      priorities = philosophyCards();
      priorities.el.classList.add('origins-philosophies--closing');
      pages.append(connectivity, ownership, priorities.el);
      layout.append(facts, pages);
      frame.visual.append(layout);
      frame.notes.append(el('p', 'origins-note', 'Shared ancestry does not make the projects interchangeable.'));
    },
    render(ctx) {
      const final = ctx.reducedMotion || ctx.t >= ctx.sentence('5.5.4').start;
      const history = ctx.t >= ctx.sentence('5.5.2').start;
      enter(connectivityFact, ctx, '5.5.1');
      enter(ownershipFact, ctx, '5.5.2');
      enter(prioritiesFact, ctx, '5.5.4');
      page(connectivity, !history && !final);
      page(ownership, history && !final);
      page(priorities.el, final);
      enter(connectivity, ctx, '5.5.1');
      channels.forEach((line, index) => trace(line, ctx.progress('5.5.1') * 3 - index * 0.35, ctx.reducedMotion));
      enter(ownership, ctx, '5.5.2');
      trace(historicalLine, ctx.progress('5.5.2') * 2, ctx.reducedMotion);
      enter(currentOwnership, ctx, '5.5.3');
      trace(retained, ctx.progress('5.5.3') * 2, ctx.reducedMotion);
      enter(priorities.el, ctx, '5.5.4');
      const p = ctx.reducedMotion ? 1 : ease(ctx.progress('5.5.4'));
      priorities.cards.forEach((card, index) => {
        card.style.transform = `translateX(${(index % 2 === 0 ? -1 : 1) * 24 * (1 - p)}px)`;
      });
    },
  };
})();

const chapter: ChapterModule = {
  id: 'ch05',
  scenes: { '5.1': philosophies, '5.2': pi, '5.3': omp, '5.4': hermes, '5.5': openClaw },
};

export default chapter;
