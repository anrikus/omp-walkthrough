/**
 * Generate committed atlas fixtures: node scripts/generate-atlas-demos.mjs
 * Requires Node 26's TypeScript stripping; imports only the pure ompUi builders.
 * This writes demo properties only. It never runs omp, a provider, or a tool.
 *
 * Fidelity: src/kit/README.md documents the builder/TerminalScript contract;
 * reference/tui/states.md and style-spec.md link the pinned 18.8.6 sources.
 * Tool shapes follow the gallery/history captures, but their coupons content is
 * synthetic, aligned with narration/ch09-walkthrough-editing.json and ch10.
 * Read previews and resolved task-model badges remain off. TTSR, task progress,
 * and method-specific compaction variants are source-derived, not live captures.
 * Animation timestamps are editorial choreography, never execution measurements.
 * Compaction counts are explicitly illustrative, not a savings/performance claim.
 *
 * Full modal captures retain every captured row at their original dimensions;
 * clear removes the underlying composer while a modal is visible.
 * Named-token colors follow the companion PNGs, without claiming pixel identity.
 * Session-list title/preview cells become synthetic coupons history, preserving
 * the captured metadata row, borders and column positions. Other grids stay unchanged.
 * No startup/logo/warning capture is included; no session was actually executed.
 *
 * Model caveat: Opus 5.5 / high assumes one usable Anthropic account, unchanged
 * catalog, no competing usable chat provider and no explicit model override.
 * There is no universal shipped model. Selector entries do not prove access.
 * Missing surfaces are intentionally left alone rather than faked with generic
 * tool rows, config panels, or Task frames for eval agents/workpools.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { ompUi, textWidth, terminalCells } from '../src/kit/omp-ui.ts';

const atlasUrl = new URL('../atlas/features.json', import.meta.url);
const features = JSON.parse(await readFile(atlasUrl, 'utf8'));
const byId = new Map(features.map(feature => [feature.id, feature]));
if (byId.size !== features.length) throw new Error('Duplicate atlas feature IDs');
const WIDTH = 120;
const LABEL = 'Recreation · omp 18.8.6 defaults · illustrative coupons fixture';
const line = (text, fg = 'dim') => [{ text, fg }];
const lines = (...texts) => texts.map(text => line(text));
const status = (width = WIDTH) => ompUi.statusBand({ width, model: 'Opus 5.5', thinking: '◒ high', path: '/demo/coupons' });
const caveats = lines(
  'Illustrative fixture; no model or tool executed. As of 2026-10-08.',
  'Opus assumes one usable Anthropic account and unchanged catalog;',
  'no competing usable chat provider or explicit override. No universal default.',
);
const demos = new Map();

function add(id, prompt, frames, { note = '', optIn = false, caption = '', mode = '' } = {}) {
  const feature = byId.get(id);
  if (!feature) throw new Error(`Unknown demo feature ID: ${id}`);
  if (demos.has(id)) throw new Error(`Duplicate demo: ${id}`);
  const notices = [...caveats, ...(note ? lines(note) : [])];
  const events = [
    { at: 0, op: 'status', line: status() },
    { at: 0, op: 'replace', lines: notices },
    { at: 0.4, op: 'type', text: prompt, cps: 48 },
    ...frames.map((frame, index) => ({ at: index ? 6.5 : 3, op: 'replace', lines: [...notices, ...frame] })),
    ...(mode ? [{ at: 3, op: 'status', line: ompUi.statusBand({ width: WIDTH, model: 'Opus 5.5', thinking: '◒ high', path: '/demo/coupons', mode }) }] : []),
  ];
  const rows = Math.max(14, notices.length + Math.max(...frames.map(frame => frame.length)) + 3);
  demos.set(id, { cols: WIDTH, rows, duration: 10, label: `${LABEL}${optIn || feature.default === 'off' ? ' · opt-in' : ''} · synthetic builder surface${caption ? ` · ${caption}` : ''}`, events });
}

const readCoupons = () => ompUi.readRow({ width: WIDTH, path: 'src/coupons.ts' });
const editCoupons = () => ompUi.edit({ width: WIDTH, path: 'src/coupons.ts', added: 1, removed: 1, rows: [
  { kind: 'hunk', text: '@@ -1,3 +1,3 @@' },
  { kind: 'context', text: 'export function isExpired(expiresAt: number, now: number): boolean {' },
  { kind: 'remove', text: '  return expiresAt < now;' },
  { kind: 'add', text: '  return expiresAt <= now;' },
  { kind: 'context', text: '}' },
] });
const grepCoupons = () => ompUi.grep({ width: WIDTH, pattern: 'isExpired', matches: 3, files: 2, scope: 'src/', groups: [
  { path: 'src/coupons.ts', rows: [{ line: 1, text: 'export function isExpired(expiresAt: number, now: number): boolean {' }] },
  { path: 'src/checkout.ts', rows: [
    { line: 1, text: 'import { isExpired } from "./coupons";' },
    { line: 3, text: '  return !isExpired(expiresAt, now);' },
  ] },
] });
add('hashline-edit', 'Read src/coupons.ts, then use its current hashline address to make expiry inclusive.', [readCoupons(), [...readCoupons(), ...editCoupons()]], {
  note: 'Source address comes from the latest model-facing read; this default UI shows only the Read row and diff.',
});
add('read', 'Read src/coupons.ts before changing the expiry boundary.', [readCoupons()], {
  note: 'read.toolResultPreview=false: the compact Read row is the default, not a source-code preview.',
});
add('grep', 'Find isExpired in src/ so we can inspect the coupon declaration and callers.', [grepCoupons()]);
add('native-search', 'Search src/ for isExpired with grep.', [grepCoupons()], {
  caption: 'grep is the visible frontend',
  note: 'Grep is the visible frontend here; the native search backend has no separate recreated UI.',
});
add('lsp', 'Use LSP references for isExpired at src/coupons.ts line 1.', [ompUi.lsp({
  width: WIDTH, action: 'references', path: 'src/coupons.ts', line: 1, symbol: 'isExpired',
  response: lines('💡 3 found⟦⌃O: Expand⟧', ' ├─ src/coupons.ts 1 reference', ' │  └─ line 1, col 17',
    ' └─ src/checkout.ts 2 references', '    ├─ line 1, col 10', '    └─ … 1 more'),
})], { note: 'Installed TypeScript server required; references and positions are illustrative fixture data.' });
add('debug', 'Inspect the stopped coupon fixture stack at the isExpired breakpoint.', [ompUi.dap({
  width: WIDTH, action: 'stack_trace', session: 'dbg-1', adapter: 'js-debug-adapter', status: 'stopped',
  cwd: '/demo/coupons', program: './dist/index.js', stopReason: 'breakpoint', frame: 'isExpired',
  location: 'src/coupons.ts:2:3', output: lines('Stack trace:', '- #1000 isExpired @ src/coupons.ts:2:3', '- #1001 checkout @ src/checkout.ts:3:3'),
})], { note: 'Requires an installed adapter and prepared TypeScript source maps; frame IDs are illustrative.' });
const todo = complete => ompUi.todo({ width: WIDTH, phases: [
  { title: 'Inspect', items: [{ text: 'Read the coupon expiry boundary and checkout caller', status: 'completed' }] },
  { title: 'Change', items: [
    { text: 'Use an inclusive expiry boundary', status: complete ? 'completed' : 'in-progress' },
    { text: 'Review the equality case before integration', status: 'pending' },
  ] },
] });
add('todo', 'Track the coupon investigation, inclusive-boundary edit, and equality-case review.', [todo(false), todo(true)]);
add('rulebook-ttsr', 'Review an attempted change back to expiresAt < now against our authored expiry rule.', [ompUi.ttsr({
  width: WIDTH, rules: [{ name: 'coupon-expiry-inclusive', description: 'Coupon expiry is inclusive: use expiresAt <= now. Preserve the equality case.' }],
})], { note: 'Authored fixture rule; source-derived live-notice shape, not a captured interruption or containment guarantee.' });
for (const [id, prompt, method, note] of [
  ['compaction', '/compact Preserve the inclusive expiry decision and the checkout caller.', 'compacted', 'Illustrative token counts only; this separator does not demonstrate lossless history or savings.'],
  ['snapcompact', '/compact Preserve the coupon investigation for continuation.', 'snap-compacted', 'Conditional snapcompact selection requires vision; illustrative counts, not savings or free downstream image use.'],
  ['handoff', '/handoff Continue the inclusive coupon-expiry change and check the equality case.', 'handed-off', 'Same-session continuation via a model side request; illustrative counts, not a new-session or savings claim.'],
]) {
  add(id, prompt, [[ompUi.compaction({ width: WIDTH, before: '42K', after: '1.2K', method })]], { note });
}
add('plan-mode', '/plan', [ompUi.planMode({ width: WIDTH, path: 'local://PLAN.md' })], {
  mode: '🗺 Plan', note: 'Source-derived banner; /plan or Alt+Shift+P enters plan mode. Startup is off; the plan role is separate.',
});
add('skills', 'Load the discovered coupon-review skill before inspecting the expiry policy.', [ompUi.readRow({ width: WIDTH, path: 'skill://coupon-review' })], {
  note: 'Illustrative discovered instruction skill; loading it is not executing a function.',
});
add('providers', '/model', [ompUi.modelSelector({ width: WIDTH, rows: [
  { id: 'anthropic/claude-opus-5-5', selected: true },
] })], { note: 'Selector-row excerpt only; illustrative eligible model, not an account roster, login, or inference result.' });

const scout = { name: 'CouponScout', description: 'Map expiry declaration and checkout callers', role: 'scout' };
const reviewer = { name: 'CouponReview', description: 'Review the inclusive expiry boundary', role: 'coupon-reviewer' };
const patcher = { name: 'CouponPatch', description: 'Change the coupon expiry boundary', role: 'task' };
const mechanical = { name: 'CouponIndex', description: 'Collect coupon source paths', role: 'sonic' };
const task = (agents, phase = 'running', extra = {}) => ompUi.task({ width: WIDTH, phase, agents, ...extra });
const running = (agent, path = 'src/coupons.ts') => ({ ...agent, status: 'running', currentTool: { name: 'Read', detail: path } });
const done = (agent, output) => ({ ...agent, status: 'done', output });
add('task-batches', 'Delegate independent coupon caller research and boundary review with full fixture context.', [
  task([scout, { ...reviewer, role: 'reviewer' }], 'batch', { assignment: 'Shared context: /demo/coupons; inclusive expiry. Return findings; do not edit.' }),
  task([running(scout), running({ ...reviewer, role: 'reviewer' }, 'src/checkout.ts')]),
], { note: 'Task workers start without parent history; supplied descriptions and progress are synthetic, not measured.' });
add('scout-agent', 'Use the read-only scout to map isExpired and its checkout caller; return findings without edits.', [
  task([running(scout)]), task([done(scout, ['src/coupons.ts:1 declares isExpired.', 'src/checkout.ts:3 calls it.'])], 'done'),
], { note: 'Bundled scout is read-only; availability and resolved model depend on discovery and routing.' });
add('role-backed-agents', 'Delegate an expiry review to our configured coupon-reviewer agent using the @review role.', [
  task([reviewer], 'batch', { agent: 'coupon-reviewer' }), task([running(reviewer)]),
], { optIn: true, note: 'Custom coupon-reviewer and @review mapping are illustrative opt-ins; role names are not a safety boundary.' });
add('task-sonic-tiers', 'Use task for the boundary change and sonic only to collect the coupon source paths.', [
  task([patcher, mechanical], 'batch'), task([running(patcher), done(mechanical, ['src/coupons.ts', 'src/checkout.ts', 'src/index.ts'])]),
], { note: 'task and sonic are worker definitions, not measured speed tiers; effort hints and model badges remain off.' });
add('task-isolation', 'With task isolation enabled, delegate the coupon edit in an isolated workspace.', [
  task([{ ...patcher, isolated: true }], 'batch'), task([{ ...running(patcher), isolated: true }]),
], { optIn: true, note: 'Requires Git and task.isolation.enabled=true; workspace separation is not a security sandbox.' });
add('agent-output-schemas', 'Ask CouponScout for strict structured findings with path, line, and inclusive fields.', [
  task([running(scout)]), task([done(scout, ['{"path":"src/coupons.ts","line":2,"inclusive":false}'])], 'done', { expanded: true }),
], { note: 'Illustrative supplied strict schema and parsed output; permissive is the default, and shape is not truth.' });
add('advisor-watchdog', 'With the advisor enabled, review the coupon change against our WATCHDOG priorities.', [ompUi.advisor({
  width: WIDTH, notes: [{ severity: 'concern', text: 'Check the equality case: a coupon expiring at now must be expired.' }],
})], { optIn: true, note: 'Advisor is off by default; note content is synthetic. Advice is not approval or a successful review guarantee.' });
if (!byId.has('agent-hub-jobs')) throw new Error('Unknown demo feature ID: agent-hub-jobs');
demos.set('agent-hub-jobs', {
  cols: WIDTH, rows: 36, duration: 10,
  label: `${LABEL} · source-derived full Activity overlay`,
  events: [
    { at: 0, op: 'status', line: status() },
    { at: 0, op: 'replace', lines: caveats },
    { at: 0.4, op: 'type', text: '/hub', cps: 48 },
    { at: 3, op: 'clear' },
    { at: 3, op: 'replace', lines: ompUi.agentHub({ width: WIDTH, height: 36, tab: 'activity' }) },
  ],
});

// Only these two captured layouts are styled; this is not an ANSI parser.
function colorCapture(id, row, index, rowCount) {
  const title = id === 'tui' ? 'Keyboard Shortcuts' : 'Resume Session (current folder)';
  const titleStart = index === 0 ? row.indexOf(title) : -1;
  const right = row.lastIndexOf('│');
  const category = id === 'tui' && (index === 2 || index === 16);
  const keyRow = id === 'tui' && [7, 9, 11, 13, 21, 23, 25, 27, 29, 31].includes(index);
  const keyStart = keyRow ? row.indexOf('│', 1) + 1 : -1;
  const keyEnd = keyRow ? row.indexOf('│', keyStart) : -1;
  const footer = index === (id === 'tui' ? 34 : 42);
  const current = id === 'sessions' && index === 6 ? row.indexOf('current') : -1;
  const done = id === 'sessions' && index === 6 ? row.indexOf('✔ done') : -1;
  const spans = [];
  let offset = 0;
  for (const glyph of terminalCells(row)) {
    let fg = footer || (id === 'sessions' && (index === 5 || index === 6)) ? 'dim' : 'fg';
    const outer = index === 0 || index === rowCount - 1 || offset === 0 || offset === right;
    if (outer) fg = 'border';
    if (titleStart >= 0 && offset >= titleStart && offset < titleStart + title.length) fg = 'accent';
    if (keyRow && offset >= keyStart && offset < keyEnd) fg = 'success';
    if (id === 'tui' && glyph === '█') fg = 'accent';
    if (id === 'tui' && glyph === '│' && offset === right - 2) fg = 'dim';
    if (id === 'sessions' && index === 4 && glyph === '❯') fg = 'accent';
    if (current >= 0 && offset >= current && offset < current + 7) fg = 'accent';
    if (done >= 0 && offset >= done && offset < done + 6) fg = 'success';
    const bold = category && !outer;
    const last = spans.at(-1);
    if (last && last.fg === fg && Boolean(last.bold) === bold) last.text += glyph;
    else spans.push({ text: glyph, fg, ...(bold ? { bold: true } : {}) });
    offset += glyph.length;
  }
  return spans;
}

async function captured(id, prompt, basename, cols, rows, detail, replacements = []) {
  if (!byId.has(id)) throw new Error(`Unknown captured feature ID: ${id}`);
  if (demos.has(id)) throw new Error(`Duplicate demo: ${id}`);
  const text = await readFile(new URL(`../reference/tui/captures/${basename}.txt`, import.meta.url), 'utf8');
  const capturedRows = text.replace(/\r\n/g, '\n').split('\n');
  if (capturedRows.at(-1) === '') capturedRows.pop();
  if (capturedRows.length !== rows) throw new Error(`${basename}: expected ${rows} captured rows, got ${capturedRows.length}`);
  if (capturedRows.some(row => textWidth(row) > cols)) throw new Error(`${basename}: captured grid would wrap`);
  for (const [rowNumber, expected, replacement] of replacements) {
    const index = rowNumber - 1;
    const row = capturedRows[index];
    if (!row?.startsWith('│') || !row.includes(expected)) throw new Error(`${basename}:${rowNumber}: capture content changed`);
    const border = row.lastIndexOf('│');
    const content = `│ ${replacement}`;
    const padding = textWidth(row.slice(0, border)) - textWidth(content);
    if (padding < 0) throw new Error(`${basename}:${rowNumber}: replacement exceeds captured cell width`);
    capturedRows[index] = `${content}${' '.repeat(padding)}${row.slice(border)}`;
  }
  demos.set(id, { cols, rows, duration: 10, label: `${LABEL} · captured layout · ${detail}`, events: [
    { at: 0, op: 'status', line: status(cols) },
    { at: 0, op: 'replace', lines: caveats },
    { at: 0.4, op: 'type', text: prompt, cps: 48 },
    { at: 3, op: 'clear' },
    { at: 3, op: 'replace', lines: capturedRows.map((row, index) => colorCapture(id, row, index, rows)) },
  ] });
}
await captured('tui', '/hotkeys', 'hotkeys-120x36', 120, 36, 'unchanged keyboard overlay');
await captured('sessions', '/resume', 'session-list-160x45', 160, 45, 'substituted coupons title/preview', [
  [5, 'Reference fixture — read-only replay', '❯ Coupons — inclusive expiry'],
  [6, 'Synthetic reference fixture:', '  Inspect src/coupons.ts. Synthetic saved history; no model or tool executed.'],
]);

// Reasons are intentional coverage boundaries, not generated claims about access.
const omissionGroups = [
  ['No captured/builder role-editing or messaging surface; selector candidates and Task continuation would be stand-ins.', [
    'model-roles', 'agent-messaging-revival',
  ]],
  ['No dedicated captured/builder tool-result surface; a generic invoked row would invent presentation.', [
    'glob', 'find', 'ast-grep', 'ast-edit', 'bash', 'eval', 'notebooks', 'browser', 'computer', 'github',
    'web-search', 'security-scan', 'generate-image', 'tts', 'ida', 'ask', 'resolve',
  ]],
  ['No dedicated captured/builder context or persistence surface; Read/config panels would not demonstrate this behavior.', [
    'checkpoint-rewind', 'context-files', 'sticky-rules', 'system-customization', 'memory',
    'retain-recall-reflect', 'memory-edit', 'learn-manage-skill', 'prewalk',
  ]],
  ['No dedicated captured/builder orchestration surface; eval agents and workpools are not Task-tool calls.', [
    'eval-agent-waves', 'eval-workpool', 'eval-completion', 'eval-judgment', 'eval-shared-tools',
  ]],
  ['No dedicated captured/builder behavior surface; a settings, Read, or model-list stand-in would be misleading.', [
    'approval', 'vibe', 'magic-keywords', 'native-runtime', 'export-share', 'hooks', 'extensions', 'marketplace',
    'mcp', 'custom-tools', 'sdk-rpc', 'secrets', 'collab', 'model-fallback-routing', 'configuration-profiles-overlays',
  ]],
];
const omissionReasons = new Map();
for (const [reason, ids] of omissionGroups) for (const id of ids) {
  if (!byId.has(id)) throw new Error(`Unknown omitted feature ID: ${id}`);
  if (demos.has(id) || omissionReasons.has(id)) throw new Error(`Conflicting coverage decision: ${id}`);
  omissionReasons.set(id, reason);
}
const absentIds = features.filter(feature => !demos.has(feature.id) && !omissionReasons.has(feature.id)).map(feature => feature.id);
if (absentIds.length) throw new Error(`Feature IDs absent from coverage decisions: ${absentIds.join(', ')}`);

const palette = new Set(['fg', 'bg', 'chrome', 'widget', 'accent', 'deepBlue', 'gold', 'bright', 'dim', 'comment',
  'warning', 'success', 'error', 'border', 'mutedBorder', 'toolErrorBg', 'python', 'thinkingOff', 'thinkingMinimal', 'thinkingLow']);
function validateLine(row, cols, id) {
  if (!Array.isArray(row)) throw new Error(`${id}: invalid Line`);
  for (const span of row) {
    if (!span || typeof span.text !== 'string') throw new Error(`${id}: invalid Span.text`);
    for (const [key, value] of Object.entries(span)) {
      if (key === 'text') continue;
      if (key === 'fg' || key === 'bg') {
        if (typeof value !== 'string' || !(palette.has(value) || /^#[0-9a-f]{3,8}$/i.test(value))) throw new Error(`${id}: invalid color`);
      } else if (!['bold', 'dim', 'italic', 'underline', 'inverse', 'strike'].includes(key) || typeof value !== 'boolean') {
        throw new Error(`${id}: invalid span field ${key}`);
      }
    }
  }
  if (row.some(span => /[\n\r\t]/.test(span.text)) || textWidth(row.map(span => span.text).join('')) > cols) throw new Error(`${id}: line would wrap`);
}
function validateDemo(id, demo) {
  if (!Number.isInteger(demo.cols) || demo.cols < 2 || !Number.isInteger(demo.rows) || demo.rows < 1) throw new Error(`${id}: invalid dimensions`);
  if (!Number.isFinite(demo.duration) || demo.duration <= 0 || demo.duration > 12) throw new Error(`${id}: duration outside (0,12]`);
  if (!demo.label.startsWith(LABEL)) throw new Error(`${id}: missing fidelity label`);
  let previous = -Infinity, transcriptRows = 0, hasStatus = false, hasPrompt = false;
  for (let index = 0; index < demo.events.length; index++) {
    const event = demo.events[index];
    if (!Number.isFinite(event.at) || event.at < 0 || event.at < previous || event.at > demo.duration) throw new Error(`${id}: invalid event time`);
    previous = event.at;
    if (event.op === 'clear') { transcriptRows = 0; hasStatus = false; hasPrompt = false; }
    else if (event.op === 'status') { validateLine(event.line, demo.cols, id); hasStatus = true; }
    else if (event.op === 'type') {
      if (typeof event.text !== 'string' || !event.text || !Number.isFinite(event.cps) || event.cps <= 0) throw new Error(`${id}: invalid typing event`);
      if (textWidth(`╰─ ${event.text} `) > demo.cols) throw new Error(`${id}: prompt would wrap`);
      const clear = demo.events.slice(index + 1).find(next => ['type', 'clear', 'replace', 'print'].includes(next.op));
      if (event.at + terminalCells(event.text).length / event.cps > (clear?.at ?? demo.duration)) throw new Error(`${id}: typing truncated`);
      hasPrompt = true;
    } else if (event.op === 'replace' || event.op === 'print') {
      if (!Array.isArray(event.lines)) throw new Error(`${id}: invalid lines`);
      event.lines.forEach(row => validateLine(row, demo.cols, id));
      transcriptRows = event.op === 'replace' ? event.lines.length : transcriptRows + event.lines.length;
      hasPrompt = false;
    } else throw new Error(`${id}: unsupported event ${event.op}`);
    if (transcriptRows + Number(hasStatus) + Number(hasStatus || hasPrompt) > demo.rows) throw new Error(`${id}: viewport would clip`);
  }
}
for (const [id, demo] of demos) validateDemo(id, demo);
// Every deliberate omission loses stale demo content, never feature metadata.
const updated = features.map(feature => {
  if (demos.has(feature.id)) return { ...feature, demo: demos.get(feature.id) };
  if (omissionReasons.has(feature.id)) {
    const { demo, ...metadata } = feature;
    return metadata;
  }
  return feature;
});
await writeFile(atlasUrl, `${JSON.stringify(updated, null, 2)}\n`);
const without = updated.filter(feature => !feature.demo);
console.log(JSON.stringify({
  generated: demos.size,
  withDemos: updated.length - without.length,
  withoutDemos: without.length,
  absentIds,
  undemoed: without.map(feature => ({ id: feature.id, reason: omissionReasons.get(feature.id) })),
}, null, 2));
