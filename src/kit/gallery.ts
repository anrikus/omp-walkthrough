import { barChart, pairedBars, scatter, smallMultiples, timeline, diagram, statCard, quoteCard, gradeBadge, dateStamp, recreationLabel, createTerminal, ompUi, unicodeGlyphs, terminalCells, clamp, lerp, ease, windowed, typewriter } from './index';
import type { Line, TerminalScript, EditOptions, TaskOptions } from './index';
import editCapture from '../../reference/tui/captures/tool-history-edit-160x45.png?url';
import statusCapture from '../../reference/tui/captures/tool-history-read-160x45.png?url';
import hubCapture from '../../reference/tui/captures/agent-hub-empty-120x36.png?url';
import taskCapture from '../../reference/tui/captures/gallery-task-lifecycle-160x45.png?url';

const text = (value: string): Line => [{ text: value }];
const editData: EditOptions = {
  width: 160, path: 'src/greet.ts', fileIcon: '🟦', added: 1, removed: 1,
  rows: [
    { kind: 'hunk', text: '@@ -1,3 +1,3 @@' },
    { kind: 'context', text: [{ text: 'export function ', fg: 'accent' }, { text: 'greet', fg: 'success' }, { text: '(name', fg: 'fg' }, { text: ': string', fg: 'accent' }, { text: ')', fg: 'dim' }, { text: ': string', fg: 'accent' }, { text: ' {', fg: 'dim' }] },
    { kind: 'remove', text: '··return `Hello, ${name}!`;' },
    { kind: 'add', text: [{ text: '··return `Hello, ${name' }, { text: '.trim()', inverse: true }, { text: '}!`;' }] },
    { kind: 'context', text: '}' },
  ],
};
const taskAssignment = 'Read packages/server/src/auth/session.ts and middleware.ts, then document the session-cookie validation flow and any TODOs.';
const taskData: TaskOptions = {
  width: 160, phase: 'done', assignment: taskAssignment, requests: 6, duration: '48.2s',
  agents: [{ name: 'AuthLoader', description: 'Load auth middleware', status: 'done', requests: 6, context: '11.6%/200K', cost: '$0.12', duration: '41.9s', output: ['Session validation runs in middleware.ts:42 via verifySessionCookie().', 'Cookies are HMAC-signed (SHA-256) and checked against the session sto…', 'TODO at session.ts:88 — sliding-expiration refresh is stubbed.'] }],
};
const fixtureStatus = (width = 160) => ompUi.statusBand({ width, model: 'no-model', thinking: '', path: 'project', context: '1.2K/?', auto: true });
const fixtureTitle: Line = [{ text: ' '.repeat(124) + 'Reference fixture — read-only replay', fg: 'comment', italic: true }];
function element<K extends keyof HTMLElementTagNameMap>(tag: K, value = '', className = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag); el.textContent = value; el.className = className; return el;
}

export default function mountGallery(root: HTMLElement): () => void {
  const gallery = element('div', '', 'kit-gallery');
  const title = element('h1', 'Visual kit / time laboratory');
  title.tabIndex = -1;
  gallery.append(title, element('p', 'Production components, driven by one explicit time value. The examples below are synthetic test data, not benchmark evidence or actual tool executions. Move the slider in either direction; no component owns a running clock.'));
  const back = element('a', 'Return to presentation'); back.href = '#ch00'; gallery.append(back);
  const controls = element('div', '', 'kit-gallery-controls');
  const sliderLabel = element('label', 'Scene time'); sliderLabel.htmlFor = 'kit-time';
  const slider = element('input'); slider.type = 'range'; slider.id = 'kit-time'; slider.min = '0'; slider.max = '12'; slider.step = '.01'; slider.value = '6';
  const value = element('output'); value.setAttribute('for', 'kit-time');
  const reducedLabel = element('label', 'Final state / reduced motion'); reducedLabel.htmlFor = 'kit-reduced';
  const reduced = element('input'); reduced.id = 'kit-reduced'; reduced.type = 'checkbox'; reduced.checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.append(sliderLabel, slider, value, reduced, reducedLabel); gallery.append(controls);
  const grid = element('div', '', 'kit-gallery-grid'); gallery.append(grid);
  const renders: Array<(t: number, reducedMotion: boolean) => void> = [];
  let number = 0;
  const section = (name: string, wide = false) => {
    const panel = element('section', '', 'kit-gallery-section');
    panel.dataset.component = name; panel.dataset.wide = String(wide); panel.id = `kit-component-${++number}`;
    panel.append(element('h2', name)); grid.append(panel); return panel;
  };
  const component = (name: string, view: { el: Element; render(p: number, reducedMotion?: boolean): void }, wide = false) => {
    const panel = section(name, wide); panel.append(view.el); renders.push((t, r) => view.render(t / 12, r)); return panel;
  };
  const terminal = (name: string, script: TerminalScript, wide = false) => {
    const view = createTerminal(script); const panel = section(name, wide); panel.append(view.el);
    renders.push((t, r) => view.render(script, t, r)); return panel;
  };
  const demoEdit = ompUi.edit({ ...editData, width: 112 });
  terminal('Terminal: typing, streaming, cursor and scroll', {
    cols: 112, rows: 15, duration: 12,
    events: [
      { at: 0, op: 'status', line: ompUi.statusBand({ width: 112, path: 'walkthrough', context: '12K/200K' }) },
      { at: .3, op: 'type', text: 'Trim the greeting input, then explain the change.', cps: 22 },
      { at: 3, op: 'print', lines: [text(' Trim the greeting input, then explain the change.'), [], ...ompUi.readRow({ path: 'src/greet.ts', width: 112 }), []] },
      { at: 4, op: 'stream', lines: demoEdit, lps: 3 },
      { at: 7, op: 'stream', lines: Array.from({ length: 9 }, (_, i) => text(` Explanation line ${i + 1}: synthetic text to exercise deterministic scrolling.`)), lps: 2 },
      { at: 11.6, op: 'type', text: '', cps: 1 },
    ],
  }, true);
  terminal('Status band and curved prompt', { cols: 100, rows: 3, duration: 12, events: [{ at: 0, op: 'status', line: ompUi.statusBand({ width: 100, path: 'walkthrough', git: 'main +1', context: '12K/200K' }) }, { at: 1, op: 'type', text: 'Show the harness, not just the model.', cps: 12 }] }, true);
  const tui = (name: string, lines: Line[], rows = lines.length) => terminal(name, { cols: 84, rows, duration: 12, events: [{ at: 0, op: 'replace', lines }] }, true);
  tui('Compact read — preview off', ompUi.readRow({ width: 84, path: 'src/greet.ts' }), 3);
  tui('Edit frame and inverse changed span', ompUi.edit({ ...editData, width: 84 }));
  tui('Grouped grep results', ompUi.grep({ width: 84, pattern: 'verifySessionCookie', matches: 2, files: 2, scope: 'src/', groups: [{ path: 'src/auth.ts', rows: [{ line: 42, text: 'export function verifySessionCookie(cookie: string) {' }] }, { path: 'src/middleware.ts', rows: [{ line: 18, text: 'const session = verifySessionCookie(cookie);' }] }] }));
  tui('LSP references', ompUi.lsp({ width: 84, action: 'references', path: 'src/auth.ts', line: 42, response: [text('src/middleware.ts:18:19'), text('src/auth.test.ts:27:10')] }));
  tui('DAP stack trace', ompUi.dap({ width: 84, action: 'stack_trace', session: 'auth-debug', adapter: 'node', status: 'stopped', stopReason: 'breakpoint', location: 'src/auth.ts:42', output: [text('#0 verifySessionCookie  src/auth.ts:42'), text('#1 middleware           src/middleware.ts:18')] }));
  const lifecycle = createTerminal({ cols: 84, rows: 12 });
  section('Task lifecycle: batch / running / done', true).append(lifecycle.el);
  renders.push((t, r) => {
    const phase = r || t >= 8 ? 'done' : t >= 4 ? 'running' : 'batch';
    const script: TerminalScript = { cols: 84, rows: 12, duration: 12, events: [{ at: 0, op: 'replace', lines: ompUi.task({ ...taskData, width: 84, phase, agents: taskData.agents.map(agent => ({ ...agent, status: phase === 'batch' ? 'pending' : phase, currentTool: phase === 'running' ? { name: 'Read', detail: 'src/auth.ts', elapsedSeconds: 7 } : undefined })) }) }] };
    lifecycle.render(script, t, r);
  });
  tui('Todo phases and completion states', ompUi.todo({ width: 84, phases: [{ title: 'Understand', items: [{ text: 'Read call sites', status: 'completed' }, { text: 'Inspect the request path', status: 'in-progress' }] }, { title: 'Change', items: [{ text: 'Update implementation', status: 'pending' }, { text: 'Run service test', status: 'blocked', blockedNote: 'service unavailable' }, { text: 'Replace the public API', status: 'abandoned' }] }] }));
  tui('Agent Hub', ompUi.agentHub({ width: 84, height: 12 }), 12);
  tui('Advisor note with severity rail', ompUi.advisor({ width: 84, notes: [{ severity: 'concern', turnsAgo: 0, advisor: 'reference-advisor', text: 'The parser assumes every token is present. Review the empty-input branch before accepting the edit.' }] }));
  tui('Compaction separator', [ompUi.compaction({ width: 84, before: '42K', after: '1.2K' })], 3);
  tui('TTSR live notice — source-derived', ompUi.ttsr({ width: 84, rules: [{ name: 'Prefer structured edits', description: 'Use the edit tool for source changes. This notice is reconstructed from the pinned terminal renderer, not a live capture.' }] }));
  tui('Plan-mode banner', ompUi.planMode({ width: 84, path: '/tmp/plan.md' }));
  tui('Model selector rows', ompUi.modelSelector({ width: 84, rows: [{ id: 'anthropic/claude-opus-5-5', selected: true, context: '200K', available: true }, { id: 'openai/gpt-5.4', context: '1M', available: false }] }));

  const bars = { title: 'Bar chart with uncertainty', condition: 'Synthetic kit data · same illustrative protocol · not a benchmark result', axisLabel: 'Success (%)', domain: [0, 100] as [number, number], data: [{ label: 'Interface A', value: 48, valueLabel: '48%', ci: [42, 54] as [number, number], ciLabel: '95% CI 42–54%', note: 'n = 100 illustrative tasks' }, { label: 'Interface B', value: 67, valueLabel: '67%', ci: [62, 72] as [number, number], ciLabel: '95% CI 62–72%', note: 'Same tasks, different interface', color: '#7dd4c5' }] };
  component('Bar chart / CI whiskers / notes', barChart(bars));
  component('Paired before-and-after bars', pairedBars({ title: 'Keep the model fixed', condition: 'Synthetic demonstration · no empirical claim', axisLabel: 'Success (%)', domain: [0, 100], pairs: [{ label: 'Model A', first: { label: 'Before', value: 38, valueLabel: '38%' }, second: { label: 'After', value: 62, valueLabel: '62%' } }, { label: 'Model B', first: { label: 'Before', value: 71, valueLabel: '71%' }, second: { label: 'After', value: 59, valueLabel: '59%' } }] }));
  component('Cost–success scatter', scatter({ title: 'Cost belongs beside success', condition: 'Synthetic kit coordinates · shared illustrative protocol', costAxis: 'Cost per task ($)', successAxis: 'Success (%)', costDomain: [0, 6], successDomain: [0, 100], points: [{ label: 'A', cost: 1.2, success: 38, note: 'Cheap, fewer successes' }, { label: 'B', cost: 3.5, success: 72, note: 'Higher success at higher cost', color: '#7dd4c5' }, { label: 'C', cost: 5, success: 55, color: '#eab77b' }] }));
  component('Small multiples — separate scales', smallMultiples({ title: 'Different protocols, separate panels', condition: 'Synthetic kit data; these axes must not be combined', panels: [{ ...bars, title: 'Protocol A', condition: 'Illustrative percentage', width: 700, height: 420 }, { ...bars, title: 'Protocol B', condition: 'Illustrative independent percentage', width: 700, height: 420, data: [{ label: 'A', value: 82 }, { label: 'B', value: 77 }] }], columns: 2 }), true);
  component('Dated timeline', timeline({ title: 'Every moving target gets a date', condition: 'Synthetic milestones for animation testing', events: [{ date: '2025-09-01', label: 'Measure', note: 'Record the protocol' }, { date: '2026-02-15', label: 'Change', note: 'Keep comparisons dated' }, { date: '2026-10-08', label: 'Recheck', note: 'Update the evidence' }] }));
  component('Node-link diagram and message dots', diagram({ title: 'A bounded delegation', condition: 'Illustrative architecture, not a measured performance claim', width: 1000, height: 500, nodes: [{ id: 'lead', label: 'Integration owner', x: 170, y: 250, width: 240 }, { id: 'worker', label: 'Worker', x: 530, y: 150 }, { id: 'review', label: 'Reviewer', x: 530, y: 360 }, { id: 'result', label: 'Evidence', x: 860, y: 250 }], links: [{ from: 'lead', to: 'worker', label: 'contract' }, { from: 'worker', to: 'review', label: 'patch' }, { from: 'review', to: 'result', label: 'findings' }] }));
  component('Stat card with conditions', statCard({ value: '48 / 100', label: 'Illustrative successes', condition: 'Synthetic data · fixed model, task set and protocol', note: 'A count is not a claim about omp.' }));
  component('Quote card with attribution', quoteCard({ quote: 'A result belongs to a system, not only to a model.', attribution: 'Editorial framing · this presentation', context: 'Demonstration copy, not a quotation attributed to a researcher.' }));
  const badges = section('Evidence grades, date stamp and recreation label', true);
  const badgeRow = element('div', '', 'kit-gallery-badges'); badges.append(badgeRow);
  for (const grade of ['A', 'B', 'C', 'D', 'E'] as const) { const view = gradeBadge(grade); badgeRow.append(view.el); renders.push((t, r) => view.render(t / 12, r)); }
  for (const view of [dateStamp('2026-10-08'), recreationLabel('omp 18.8.6 defaults')]) { badgeRow.append(view.el); renders.push((t, r) => view.render(t / 12, r)); }
  const stageSample = element('div', '', 'kit-stage-sample');
  section('On the white presentation stage', true).append(stageSample);
  for (const view of [barChart({ ...bars, title: 'Self-contained contrast on a white stage', height: 350 }), dateStamp('2026-10-08'), recreationLabel()]) {
    stageSample.append(view.el); renders.push((t, r) => view.render(t / 12, r));
  }
  const motion = section('Animation helpers', true); const motionReadout = element('pre'); motion.append(motionReadout);
  renders.push((t, r) => { const p = r ? 1 : t / 12; motionReadout.textContent = `clamp: ${clamp(p).toFixed(3)}    lerp(0,100): ${lerp(0, 100, p).toFixed(1)}    ease: ${ease(p).toFixed(3)}\nwindowed(t,2,8): ${windowed(r ? 12 : t, 2, 8).toFixed(3)}\ntypewriter: ${typewriter('The audio clock owns every frame.', p)}`; });
  const glyphPanel = section('Unicode preset glyph coverage', true);
  glyphPanel.append(element('p', 'Full, self-hosted JetBrains Mono v2.304 with Noto Sans Symbols 2 fallback. Each symbol keeps its recorded Unicode character, including box drawing, braille spinners and the advisor rail. Emoji may use the platform emoji font.'));
  const glyphList = element('ul', '', 'kit-glyph-grid'); glyphList.setAttribute('role', 'list'); glyphPanel.append(glyphList);
  for (const glyph of [...new Set(terminalCells(unicodeGlyphs).filter(g => g !== ' '))]) {
    const item = element('li'); const symbol = element('span', glyph, 'kit-term-glyph'); symbol.dataset.glyph = glyph;
    if (/\p{Emoji_Presentation}|\uFE0F/u.test(glyph)) symbol.classList.add('kit-term-emoji');
    item.append(symbol, element('code', `U+${glyph.codePointAt(0)!.toString(16).toUpperCase()}`)); glyphList.append(item);
  }

  const fidelity = element('section', '', 'kit-fidelity');
  fidelity.append(element('h2', 'Fidelity desk: renderer beside the reference'), element('p', 'Left: our DOM recreation. Right: the matching omp 18.8.6 reference PNG, cropped after the startup banner where needed. These saved-history and gallery fixtures are synthetic. Geometry, strings and glyphs are the comparison target; the approved OFL font is JetBrains Mono rather than the reference’s Ubuntu Sans Mono Nerd Font. Our foreground/background use Titanium’s terminal palette (#E8ECF4 / #151820); the reference host used #E5E5E5 / #101010.'));
  gallery.append(fidelity);
  const compare = (name: string, capture: string, cols: number, lines: Line[], imageWidth: number, cropTop: number, cropHeight: number) => {
    fidelity.append(element('h3', name));
    const pair = element('div', '', 'kit-fidelity-pair'); pair.dataset.fidelity = name;
    const left = element('div'), right = element('div');
    const view = createTerminal({ cols, rows: lines.length, label: 'Recreation · omp 18.8.6 defaults · synthetic reference fixture' });
    view.el.style.setProperty('--kit-cols', String(cols));
    const script: TerminalScript = { cols, rows: lines.length, duration: 12, events: [{ at: 0, op: 'replace', lines }] };
    view.render(script, 12, true); left.append(view.el);
    const sourceLink = element('a', 'Reference PNG · open full resolution', 'kit-capture-caption'); sourceLink.href = capture; sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer';
    const clip = element('div', '', 'kit-capture'); clip.style.aspectRatio = `${imageWidth} / ${cropHeight}`;
    const image = element('img'); image.src = capture; image.alt = `${name}: original omp 18.8.6 synthetic reference capture`;
    image.style.transform = `translateY(-${cropTop / (cols === 120 ? 872 : 1088) * 100}%)`;
    clip.append(image); right.append(sourceLink, clip); pair.append(left, right); fidelity.append(pair);
  };
  compare('Edit history', editCapture, 160, [
    [{ text: ' Synthetic reference fixture: read a tiny TypeScript file. Saved history only; no model or tool was executed.'.padEnd(160), bg: 'chrome' }],
    [], [], ...ompUi.readRow({ width: 160, path: 'src/greet.ts' }), [],
    [{ text: ' The fixture exports ' }, { text: 'greet(name)', fg: 'success' }, { text: '. This is fabricated transcript content rendered by the real omp binary, not an executed task.' }],
    [], ...ompUi.edit(editData), [],
    text(' Fixture complete. The read and edit above are saved synthetic history; no tools or models ran.'), [],
    [{ text: ' Warning: No default model selected. Use /login, set an API key environment variable, or select a local model with /model or --model.', fg: 'warning' }],
    [], fixtureTitle, fixtureStatus(), ompUi.prompt({ width: 160 }),
  ], 1776, 12 * 24, 22 * 24);
  compare('Status band', statusCapture, 160, [fixtureTitle, fixtureStatus(), ompUi.prompt({ width: 160 })], 1776, 20 * 24, 3 * 24);
  compare('Agent Hub', hubCapture, 120, ompUi.agentHub({ width: 120, height: 36 }), 1336, 0, 36 * 24);
  const taskLines: Line[] = [
    [], text('  · streaming args'), [],
    ...ompUi.task({ width: 160, phase: 'batch', assignment: 'Read packages/server/src/auth/*.ts and summarize the session-cookie', agents: [{ name: 'AuthLoader', description: 'Read packages/server/src/auth/*.ts and summarize the session-co…' }] }),
    [], [], text('  · in progress'), [],
    ...ompUi.task({ width: 160, phase: 'batch', assignment: taskAssignment, agents: [{ name: 'AuthLoader', description: 'Read packages/server/src/auth/session.ts and middleware.ts, the…' }] }),
    [], [], text('  · done'), [], ...ompUi.task(taskData), [], [], text('  · failed'), [],
    ...ompUi.task({ width: 160, phase: 'failed', assignment: taskAssignment, agents: [{ name: 'RateLimiter', description: 'Audit rate limiter', status: 'failed', requests: 3, context: '3.2%/200K', cost: '$0.10', duration: '9.8s', error: 'Subagent exited 1: target file packages/server/src/auth/rate-limit.ts…' }], requests: 3, duration: '9.8s' }),
  ];
  compare('Task lifecycle', taskCapture, 160, taskLines, 1776, 0, 42 * 24);
  const render = () => { const t = Number(slider.value); value.textContent = `${t.toFixed(2)} s`; slider.setAttribute('aria-valuetext', `${t.toFixed(2)} seconds`); for (const draw of renders) draw(t, reduced.checked); gallery.dataset.time = String(t); };
  slider.addEventListener('input', render); reduced.addEventListener('change', render);
  root.replaceChildren(gallery); render(); title.focus({ preventScroll: true });
  return () => { slider.removeEventListener('input', render); reduced.removeEventListener('change', render); gallery.remove(); };
}
