import type { ChapterModule, MountContext, RenderContext, SceneModule } from '../../engine/types';
import { ease } from '../../kit';
import { reveal, sceneFrame, withEvidence } from '../shared/scene';
import { adoptionScene, datasetScene } from './stats';
import './landscape.css';

type Update = (ctx: RenderContext) => void;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function place(el: HTMLElement, x: number, y: number, width: number, height?: number): HTMLElement {
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${width}px` });
  if (height !== undefined) el.style.height = `${height}px`;
  return el;
}

function node(parent: HTMLElement, title: string, x: number, y: number, width: number, height: number, detail?: string): HTMLElement {
  const el = element('div', 'landscape-node');
  el.append(element('strong', '', title));
  if (detail) el.append(element('small', '', detail));
  parent.append(place(el, x, y, width, height));
  return el;
}

function label(parent: HTMLElement, text: string, x: number, y: number, width: number): HTMLElement {
  const el = place(element('div', 'landscape-label', text), x, y, width);
  parent.append(el);
  return el;
}

function evidence(parent: HTMLElement, ctx: MountContext, id: string): HTMLElement {
  const item = ctx.onScreen(id);
  const el = element('section', 'landscape-evidence');
  el.append(element('p', '', item.text));
  withEvidence(el, item, ctx);
  parent.append(el);
  return el;
}

function show(el: HTMLElement, ctx: RenderContext, sentence: string, start = 0, end = 0.25): void {
  const p = ctx.reducedMotion ? 1 : Math.max(0, Math.min(1, (ctx.progress(sentence) - start) / (end - start)));
  reveal(el, p, ctx.reducedMotion);
  if (p === 1) el.style.transform = 'none';
  el.toggleAttribute('inert', p === 0);
}

function scene(id: string, mount: (stage: HTMLElement, ctx: MountContext) => Update): SceneModule {
  let update: Update;
  return {
    id,
    mount(stage, ctx) { update = mount(stage, ctx); },
    render(ctx) { update(ctx); },
  };
}

function frameFor(stage: HTMLElement, ctx: MountContext, note: string) {
  const frame = sceneFrame(stage, { title: ctx.scene.title, layout: 'full', date: '2026-10-08' });
  frame.el.classList.add('ch01');
  frame.notes.append(element('p', 'landscape-note', note));
  return frame;
}

function matrix(parent: HTMLElement, rows: readonly (readonly string[])[]): { el: HTMLTableElement; rows: HTMLTableRowElement[] } {
  const table = element('table', 'landscape-matrix');
  table.setAttribute('aria-label', 'Independent descriptive axes; no ranking or performance scores');
  const head = table.createTHead().insertRow();
  for (const title of ['Dated example', 'Source rights', 'Provider freedom', 'Interface']) {
    const cell = element('th', '', title);
    cell.scope = 'col';
    head.append(cell);
  }
  const body = table.createTBody();
  const elements = rows.map((values) => {
    const row = body.insertRow();
    values.forEach((value, index) => {
      const cell = row.insertCell();
      if (index === 0) cell.append(element('span', 'landscape-product', value));
      else cell.textContent = value;
    });
    return row;
  });
  parent.append(table);
  return { el: table, rows: elements };
}

const machineryScene = scene('1.1', (stage, ctx) => {
  const frame = frameFor(stage, ctx, 'Keep the model, the harness machinery and the human interface conceptually separate.');
  const map = element('div', 'landscape-map');
  const boundary = place(element('div', 'landscape-boundary'), 30, 12, 1190, 358);
  const boundaryTitle = label(map, 'Harness machinery · explanatory synthesis', 300, 0, 650);
  boundaryTitle.classList.add('landscape-boundary-title');
  const survey = place(element('div', 'landscape-boundary landscape-ring'), 242, 75, 740, 234);
  const core = node(map, 'Model core', 466, 154, 294, 88);
  core.classList.add('landscape-core');
  const surveyLabels = element('div', '');
  label(surveyLabels, 'Planning', 355, 112, 220);
  label(surveyLabels, 'Memory', 650, 112, 220);
  label(surveyLabels, 'Perception', 320, 320, 220);
  label(surveyLabels, 'Action', 680, 320, 220);
  const machinery = element('div', '');
  for (const [text, x, y] of [
    ['Context', 50, 50], ['Tools', 940, 50], ['Execution', 50, 174],
    ['State', 940, 174], ['Policy', 50, 298], ['Orchestration', 940, 298],
  ] as const) label(machinery, text, x, y, 250);
  const surfaces = element('div', '');
  label(surfaces, 'Human surfaces', 1360, 12, 370);
  node(surfaces, 'CLI', 1400, 65, 290, 76);
  node(surfaces, 'Editor', 1400, 170, 290, 76);
  node(surfaces, 'Web', 1400, 275, 290, 76);
  const outside = place(element('div', 'landscape-link', '↔'), 1238, 173, 142, 64);
  surfaces.append(outside);
  map.prepend(boundary, survey);
  map.append(surveyLabels, machinery, surfaces);
  frame.visual.append(map);
  const claims = element('div', 'landscape-evidence-grid');
  frame.visual.append(claims);
  const surveyEvidence = evidence(claims, ctx, '1.1.a');
  const machineryEvidence = evidence(claims, ctx, '1.1.b');
  return (render) => {
    show(core, render, '1.1.1');
    show(survey, render, '1.1.1');
    show(surveyLabels, render, '1.1.1', 0.12, 0.45);
    show(surveyEvidence, render, '1.1.1');
    show(boundary, render, '1.1.2');
    show(boundaryTitle, render, '1.1.2');
    show(machinery, render, '1.1.2');
    show(machineryEvidence, render, '1.1.2');
    show(surfaces, render, '1.1.3');
  };
});

const terminologyScene = scene('1.2', (stage, ctx) => {
  const frame = frameFor(stage, ctx, 'Overlapping vocabulary, not hard nested boundaries. Chase explicitly disclaimed inventing the term.');
  const layout = element('div', 'landscape-quote-layout');
  const quote = element('figure', 'landscape-quote');
  const item = ctx.onScreen('1.2.a');
  const [wording, attribution, date, condition] = item.text.split(' · ');
  quote.append(element('blockquote', '', wording), element('figcaption', '', `${attribution} · ${date}`), element('p', '', condition));
  withEvidence(quote, item, ctx);
  const concepts = element('div', 'landscape-concepts');
  const framework = place(element('div', 'landscape-concept', 'Framework'), 0, 38, 440, 300);
  const runtime = place(element('div', 'landscape-concept', 'Runtime'), 300, 38, 440, 300);
  const harness = place(element('div', 'landscape-concept', 'Harness'), 150, 252, 440, 300);
  concepts.append(framework, runtime, harness);
  layout.append(quote, concepts);
  frame.visual.append(layout);
  return (render) => {
    show(quote, render, '1.2.1');
    show(concepts, render, '1.2.2');
    const p = render.reducedMotion ? 1 : ease(render.progress('1.2.2'));
    framework.style.transform = `translateX(${(1 - p) * -30}px)`;
    runtime.style.transform = `translateX(${(1 - p) * 30}px)`;
    harness.style.transform = `translateY(${(1 - p) * 30}px)`;
  };
});

const axesScene = scene('1.3', (stage, ctx) => {
  const frame = frameFor(stage, ctx, 'Three independent descriptions. Provider choice ≠ equal performance; component licenses ≠ service terms.');
  const axes = matrix(frame.visual, [
    ['Codex CLI/core', 'Apache-2.0', 'Custom + local providers', 'CLI + other surfaces'],
    ['Amp', 'Proprietary', 'Multi-model + connections', 'Not classified here'],
  ]);
  const surfaces = element('div', 'landscape-surfaces');
  const codex = element('div', 'landscape-surface');
  codex.append(element('strong', '', 'One Codex harness'), element('span', '', '→'), element('span', '', 'CLI · editor · web'));
  const acp = element('div', 'landscape-surface');
  acp.append(element('span', '', 'Compatible editor'), element('strong', '', '↔ ACP ↔'), element('span', '', 'Independent agent'));
  surfaces.append(codex, acp);
  frame.visual.append(surfaces);
  const claims = element('div', 'landscape-evidence-grid');
  frame.visual.append(claims);
  const rights = evidence(claims, ctx, '1.3.a');
  const compatibility = evidence(claims, ctx, '1.3.b');
  return (render) => {
    show(axes.el, render, '1.3.1');
    for (const row of axes.rows) show(row, render, '1.3.2');
    show(rights, render, '1.3.1');
    show(surfaces, render, '1.3.3');
    show(compatibility, render, '1.3.3');
    const p = render.reducedMotion ? 1 : render.progress('1.3.4');
    frame.notes.toggleAttribute('data-emphasis', p > 0);
  };
});

const protocolScene = scene('1.6', (stage, ctx) => {
  const frame = frameFor(stage, ctx, 'Common formats do not establish identical discovery rules, execution policies or safety guarantees.');
  const map = element('div', 'landscape-map');
  map.style.flexBasis = '414px';
  const instructions = element('div', '');
  node(instructions, 'AGENTS.md', 0, 44, 380, 116, 'Project guidance');
  node(instructions, 'Agent Skills', 0, 216, 380, 116, 'Reusable procedures');
  const inputLink = place(element('div', 'landscape-link', 'inputs →'), 394, 156, 214, 54);
  instructions.append(inputLink);
  const owned = place(element('div', 'landscape-boundary'), 624, 18, 480, 378);
  owned.append(element('p', '', 'One agent application'));
  node(owned, 'Agent', 100, 62, 280, 94);
  const workers = node(owned, 'Internal workers', 48, 248, 380, 88, 'Native scheduling ≠ A2A');
  const workerLink = place(element('div', 'landscape-link', '↓ internal branch'), 68, 178, 340, 46);
  owned.append(workerLink);
  const external = element('div', '');
  node(external, 'Compatible editor', 1388, 18, 372, 88);
  node(external, 'External tools / data', 1388, 158, 372, 88);
  node(external, 'Independent agent', 1388, 298, 372, 100, 'Opaque application');
  for (const [text, y] of [['↔ ACP ↔', 40], ['↔ MCP ↔', 180], ['↔ A2A ↔', 328]] as const) {
    external.append(place(element('div', 'landscape-link', text), 1120, y, 250, 46));
  }
  map.append(instructions, owned, external);
  frame.visual.append(map);
  const claim = evidence(frame.visual, ctx, '1.6.a');
  return (render) => {
    show(instructions, render, '1.6.1');
    show(owned, render, '1.6.1');
    show(external, render, '1.6.2');
    show(workers, render, '1.6.3');
    show(workerLink, render, '1.6.3');
    show(claim, render, '1.6.1');
    const p = render.reducedMotion ? 1 : render.progress('1.6.4');
    frame.notes.toggleAttribute('data-emphasis', p > 0);
  };
});

const churnScene = scene('1.7', (stage, ctx) => {
  const frame = frameFor(stage, ctx, 'Historical names stay visible as history. These are documented milestones, not inferred first-release dates.');
  const tiles = element('div', 'landscape-tiles');
  const windsurf = element('section', 'landscape-tile');
  windsurf.append(element('h3', '', 'Windsurf'));
  const devin = element('strong', '', '→ Devin Desktop');
  const devinDate = element('time', '', '2026-06-02');
  devinDate.dateTime = '2026-06-02';
  windsurf.append(devin, element('p', '', 'Successor launch'), devinDate);
  const kimi = element('section', 'landscape-tile');
  kimi.append(element('h3', '', 'Kimi CLI'));
  const kimiCode = element('strong', '', '→ Kimi Code CLI');
  const kimiDate = element('time', '', '2026-09-22');
  kimiDate.dateTime = '2026-09-22';
  kimi.append(kimiCode, element('p', '', 'Legacy CLI final release'), kimiDate);
  const roo = element('section', 'landscape-tile');
  roo.append(element('h3', '', 'Roo Code extension'), element('strong', '', 'Historical / retired'), element('p', '', 'Official docs report shutdown'), element('p', '', 'No shutdown year inferred'));
  tiles.append(windsurf, kimi, roo);
  frame.visual.append(tiles);
  const claim = evidence(frame.visual, ctx, '1.7.a');
  return (render) => {
    show(windsurf, render, '1.7.1', 0, 0.14);
    show(devin, render, '1.7.1', 0.1, 0.3);
    show(kimi, render, '1.7.1', 0.25, 0.43);
    show(kimiCode, render, '1.7.1', 0.35, 0.55);
    const milestoneProgress = render.reducedMotion ? 1 : render.progress('1.7.1');
    const devinFlip = ease(Math.max(0, Math.min(1, (milestoneProgress - 0.1) / 0.2)));
    const kimiFlip = ease(Math.max(0, Math.min(1, (milestoneProgress - 0.35) / 0.2)));
    devin.style.transform = render.reducedMotion ? 'none' : `perspective(700px) rotateX(${-70 * (1 - devinFlip)}deg)`;
    kimiCode.style.transform = render.reducedMotion ? 'none' : `perspective(700px) rotateX(${-70 * (1 - kimiFlip)}deg)`;
    show(roo, render, '1.7.1', 0.58, 0.78);
    show(claim, render, '1.7.1');
    const p = render.reducedMotion ? 1 : render.progress('1.7.2');
    roo.toggleAttribute('data-emphasis', p > 0);
  };
});

const placementScene = scene('1.8', (stage, ctx) => {
  const frame = frameFor(stage, ctx, 'Place a project on the map, not on a podium. Compare dated capabilities and boundaries.');
  const axes = matrix(frame.visual, [['omp', 'MIT repository', 'Multi-provider', 'Not classified here']]);
  const lineage = element('p', 'landscape-note', 'Pi fork · built by Stencil Labs');
  frame.visual.append(lineage);
  const tools = element('div', 'landscape-tools');
  const toolNodes = [
    ['LSP', 'Language-server tooling'], ['Debugger', ''],
    ['Structured subagents', ''], ['Memory', ''],
  ].map(([title, detail]) => {
    const el = element('div', 'landscape-tool', title);
    if (detail) el.append(element('small', '', detail));
    tools.append(el);
    return el;
  });
  frame.visual.append(tools);
  const claim = evidence(frame.visual, ctx, '1.8.a');
  return (render) => {
    show(axes.el, render, '1.8.1');
    show(lineage, render, '1.8.1');
    show(tools, render, '1.8.2');
    toolNodes.forEach((el, index) => show(el, render, '1.8.2', index * 0.12, index * 0.12 + 0.2));
    show(claim, render, '1.8.1');
    const p = render.reducedMotion ? 1 : render.progress('1.8.3');
    frame.notes.toggleAttribute('data-emphasis', p > 0);
  };
});

const chapter: ChapterModule = {
  id: 'ch01',
  scenes: {
    '1.1': machineryScene,
    '1.2': terminologyScene,
    '1.3': axesScene,
    '1.4': adoptionScene,
    '1.5': datasetScene,
    '1.6': protocolScene,
    '1.7': churnScene,
    '1.8': placementScene,
  },
};

export default chapter;
