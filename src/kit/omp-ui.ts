import type { Line, Span, TermColor } from './terminal';

export interface WidthOptions { width?: number }
export interface StatusBandOptions extends WidthOptions {
  model?: string; thinking?: string; brand?: string; path?: string; pathIcon?: string;
  mode?: string; git?: string; context?: string; cost?: string; auto?: boolean;
  /** Already-formatted embedded gauge text, e.g. ┃86%───────────8.2K─. */
  gauge?: string;
}
export interface PromptOptions extends WidthOptions { text?: string; hint?: string }
export interface ReadRowOptions extends WidthOptions { path: string; preview?: Line[] }
export interface EditDiffRow { kind: 'hunk' | 'context' | 'add' | 'remove'; text: string | Line }
export interface EditOptions extends WidthOptions {
  path: string; fileIcon?: string; added: number; removed: number; rows: EditDiffRow[];
  moreHunks?: number; moreLines?: number; contentAbove?: boolean;
}
export interface GrepFile { path: string; rows: Array<{ line: number; text: string | Line; matched?: boolean }> }
export interface GrepOptions extends WidthOptions {
  pattern: string; matches: number; files: number; scope?: string; truncated?: boolean;
  groups?: GrepFile[]; /** Exact supplied renderer excerpt, without the outer one-cell inset. */
  rows?: Line[]; moreMatches?: number;
}
export interface LspOptions extends WidthOptions {
  action: string; path?: string; line?: number; symbol?: string; request?: Line[]; response?: Line[];
}
export interface DapOptions extends WidthOptions {
  action: string; session?: string; adapter?: string; status?: string; cwd?: string; program?: string;
  stopReason?: string; frame?: string; instructionPointer?: string; location?: string;
  configurationDonePending?: boolean; exitCode?: number; output: Line[]; moreLines?: number;
}
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'aborted';
export interface TaskAgent {
  name: string; description: string; status?: TaskStatus; model?: string; role?: string;
  requests?: number; context?: string; cost?: string; duration?: string;
  badge?: 'retrying' | 'rate-limited'; isolated?: boolean; output?: string[]; error?: string;
  currentTool?: { name: string; detail?: string; elapsedSeconds?: number; elapsedLabel?: string };
}
export interface TaskOptions extends WidthOptions {
  phase: 'batch' | 'running' | 'done' | 'failed'; agent?: string; assignment?: string;
  agents: TaskAgent[]; expanded?: boolean; modelBadges?: boolean;
  /** Supplied aggregate measurements; never inferred from wall time. */
  requests?: number; duration?: string;
}
export interface TodoItem {
  text: string; status: 'pending' | 'in-progress' | 'completed' | 'abandoned' | 'blocked'; blockedNote?: string;
}
export interface TodoPhase { title: string; items: TodoItem[] }
export interface TodoOptions extends WidthOptions { phases: TodoPhase[] }
export interface AgentHubOptions extends WidthOptions {
  height?: number; tab?: 'agents' | 'activity'; filter?: string; scope?: string; following?: boolean;
  search?: string; rows?: Line[]; footer?: string;
}
export interface AdvisorNote {
  text: string; severity?: 'nit' | 'concern' | 'blocker'; turnsAgo?: number; advisor?: string;
}
export interface AdvisorOptions extends WidthOptions { notes: AdvisorNote[]; expanded?: boolean }
export interface CompactionOptions extends WidthOptions {
  before: string; after: string;
  method?: 'compacted' | 'remote-compacted' | 'soft-compacted' | 'handed-off' | 'snap-compacted' | 'shaken';
}
export interface TtsrRule { name: string; description?: string; content?: string }
export interface TtsrOptions extends WidthOptions { rules: TtsrRule[]; expanded?: boolean }
export interface PlanModeOptions extends WidthOptions { path: string }
export interface ModelRow {
  id: string; selected?: boolean; context?: string; price?: string; available?: boolean;
}
export interface ModelSelectorOptions extends WidthOptions { rows: ModelRow[] }

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
export function terminalCells(text: string): string[] {
  return Array.from(segmenter.segment(text), part => part.segment);
}
export function cellWidth(grapheme: string): number {
  const point = grapheme.codePointAt(0) ?? 0;
  if (point < 32 || (point >= 0x7f && point < 0xa0) || /^\p{Mark}+$/u.test(grapheme)) return 0;
  if (/\p{Emoji_Presentation}|\uFE0F/u.test(grapheme)) return 2;
  return point >= 0x1100 && (point <= 0x115f || point === 0x2329 || point === 0x232a ||
    (point >= 0x2e80 && point <= 0xa4cf && point !== 0x303f) ||
    (point >= 0xac00 && point <= 0xd7a3) || (point >= 0xf900 && point <= 0xfaff) ||
    (point >= 0xfe10 && point <= 0xfe19) || (point >= 0xfe30 && point <= 0xfe6f) ||
    (point >= 0xff00 && point <= 0xff60) || (point >= 0xffe0 && point <= 0xffe6) ||
    (point >= 0x20000 && point <= 0x3fffd)) ? 2 : 1;
}
export function textWidth(text: string): number {
  return lineWidth([{ text }]);
}
const s = (text: string, fg?: TermColor, extra: Omit<Span, 'text' | 'fg'> = {}): Span => ({ text, ...(fg ? { fg } : {}), ...extra });
const lineWidth = (line: Line): number => {
  let column = 0, widest = 0;
  for (const span of line) for (const { segment } of segmenter.segment(span.text)) {
    if (segment === '\n' || segment === '\r\n') { widest = Math.max(widest, column); column = 0; }
    else column += segment === '\t' ? 4 - column % 4 : cellWidth(segment);
  }
  return Math.max(widest, column);
};
const cols = (width = 120): number => Number.isFinite(width) ? Math.max(1, Math.floor(width)) : 120;
function splitRows(line: Line, startColumn = 0): Line[] {
  if (!line.some(span => /[\t\n]/.test(span.text))) return [line];
  const rows: Line[] = [];
  let row: Line = [], column = startColumn;
  for (const span of line) {
    let text = '';
    for (const { segment } of segmenter.segment(span.text)) {
      if (segment === '\n' || segment === '\r\n') {
        if (text) row.push({ ...span, text });
        rows.push(row); row = []; text = ''; column = startColumn;
      } else {
        const size = segment === '\t' ? 4 - column % 4 : cellWidth(segment);
        text += segment === '\t' ? ' '.repeat(size) : segment;
        column += size;
      }
    }
    if (text) row.push({ ...span, text });
  }
  rows.push(row);
  return rows;
}
export function fitLine(line: Line, width: number, options: { pad?: boolean; ellipsis?: boolean } = {}): Line {
  width = Math.max(0, Math.floor(Number.isFinite(width) ? width : 0));
  const rows = splitRows(line);
  line = rows[0];
  const truncated = options.ellipsis === true && (rows.length > 1 || lineWidth(line) > width);
  const limit = Math.max(0, width - (truncated ? 1 : 0));
  const result: Line = [];
  let used = 0;
  outer: for (const span of line) {
    let text = '';
    for (const { segment } of segmenter.segment(span.text)) {
      const size = cellWidth(segment);
      if (used + size > limit) {
        if (text) result.push({ ...span, text });
        break outer;
      }
      text += segment;
      used += size;
    }
    if (text) result.push({ ...span, text });
  }
  if (truncated && width > 0) { result.push(s('…', 'dim')); used++; }
  if (options.pad && used < width) result.push(s(' '.repeat(width - used)));
  return result;
}
const short = (text: string, width: number): string => fitLine([s(text)], width, { ellipsis: true }).map(span => span.text).join('');
const words = (text: string, width: number): string[] => {
  width = Math.max(1, width);
  const rows: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let row = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      if (row && textWidth(`${row} ${word}`) > width) { rows.push(row); row = ''; }
      let part = '';
      for (const cell of terminalCells(word)) {
        if (textWidth(part + cell) > width && part) { rows.push(part); part = ''; }
        part += cell;
      }
      row += `${row ? ' ' : ''}${part}`;
    }
    rows.push(row);
  }
  return rows;
};
function rule(width: number, title: Line = [], left = '├', right = '┤', inset = 3, color: TermColor = 'border'): Line {
  const inner = Math.max(0, width - 2);
  const label = title.length ? fitLine([s('─'.repeat(inset) + ' ', color), ...title, s(' ', color)], inner) : [];
  return fitLine([s(left, color), ...label, s('─'.repeat(Math.max(0, inner - lineWidth(label))) + right, color)], width);
}
function bodyRow(line: Line, width: number, inset = 1, border: TermColor = 'border', bg?: TermColor): Line {
  line = splitRows(line, 1 + inset)[0];
  const inner = fitLine([s(' '.repeat(inset)), ...line], Math.max(0, width - 2), { pad: true, ellipsis: true });
  return fitLine([s('│', border), ...inner, s('│', border)], width).map(span => bg ? { bg, ...span } : span);
}
function bodyRows(line: Line, width: number, inset: number, border: TermColor, bg: TermColor): Line[] {
  return splitRows(line, 1 + inset).map(row => bodyRow(row, width, inset, border, bg));
}
function frame(title: Line, sections: Array<{ title?: string; rows: Line[]; divider?: boolean }>, width: number, error = false, inset = 1): Line[] {
  const border: TermColor = error ? 'error' : 'mutedBorder';
  const background: TermColor = error ? 'toolErrorBg' : 'chrome';
  const lines = [rule(width, title, '╭', '╮', 3, border)];
  for (const section of sections) {
    if (section.divider || section.title) lines.push(rule(width, section.title ? [s(section.title, 'dim')] : [], '├', '┤', 3, border));
    lines.push(...section.rows.flatMap(row => bodyRows(row, width, inset, border, background)));
  }
  lines.push(rule(width, [], '╰', '╯', 0, border));
  return lines;
}
function statusBand(o: StatusBandOptions = {}): Line {
  const width = cols(o.width);
  const segments: Line[] = [[s(o.brand ?? 'π', 'comment')], [s(`⬢ ${o.model ?? 'Opus 5.5'}${o.thinking === '' ? '' : ` · ${o.thinking ?? '◒ high'}`}`, 'accent')]];
  if (o.mode) segments.push([s(o.mode, 'accent')]);
  if (o.path) segments.push([s(`${o.pathIcon ?? '🗑'} ${o.path}`, 'bright')]);
  if (o.git) segments.push([s(o.git, 'warning')]);
  if (o.context) segments.push([s(`◫ ${o.context}`, 'dim')]);
  if (o.cost) segments.push([s(o.cost, 'gold')]);
  const line: Line = [s(' ')];
  segments.forEach((segment, index) => { if (index) line.push(s(' > ', 'border')); line.push(...segment); });
  if (o.auto) line.push(s(' ⟲', 'dim'));
  line.push(s(' '));
  const band: Line = [...line.map(span => ({ bg: 'chrome' as const, ...span })), s('▶', 'chrome', { bg: 'bg' })];
  const remaining = Math.max(0, width - lineWidth(band));
  const gauge = o.gauge ? short(o.gauge, remaining) : '';
  band.push(s('─'.repeat(Math.max(0, remaining - textWidth(gauge))) + gauge, 'accent'));
  return fitLine(band, width, { pad: true });
}
function prompt(o: PromptOptions = {}): Line {
  const width = cols(o.width);
  const line = fitLine([s('╰─', 'accent'), s(o.text ? ` ${o.text}` : '')], width);
  const room = width - lineWidth(line);
  if (o.hint && room > 1) {
    const hint = short(o.hint, room - 1);
    line.push(s(' '.repeat(room - textWidth(hint)) + hint, 'comment'));
  }
  return fitLine(line, width, { pad: true });
}
function readRow(o: ReadRowOptions): Line[] {
  const width = cols(o.width);
  // Interactive read groups suppress the source body unless preview is enabled.
  return [fitLine([s(' ● Read '), s(o.path, 'accent')], width, { ellipsis: true }), ...(o.preview ?? []).flatMap(row => splitRows(row).map(line => fitLine(line, width)))];
}
function edit(o: EditOptions): Line[] {
  const width = cols(o.width);
  const fileIcon = o.fileIcon ?? (/\.(?:ts|tsx|mts|cts)$/.test(o.path) ? '🟦' : '📄');
  const title = [s('✎ Edit: ', 'accent'), s(`${fileIcon} ${o.path} `, 'accent'), s('⟦', 'dim'), s(`+${o.added}`, 'success'), s('/', 'dim'), s(`-${o.removed}`, 'error'), s('⟧', 'dim')];
  const rows: Line[] = [];
  if (o.contentAbove) rows.push([s('… (content above)', 'dim')]);
  for (const row of o.rows) {
    const color: TermColor = row.kind === 'add' ? 'success' : row.kind === 'remove' ? 'error' : 'dim';
    const prefix = row.kind === 'add' ? '+' : row.kind === 'remove' ? '-' : row.kind === 'context' ? ' ' : '';
    const spans = typeof row.text === 'string' ? [s(row.text)] : row.text;
    for (const content of splitRows(spans, 1 + textWidth(prefix))) {
      rows.push([s(prefix, color), ...content.map((span, index) => ({ fg: color, ...span, text: index === 0 && (row.kind === 'add' || row.kind === 'remove') ? span.text.replace(/^ +/, indent => '·'.repeat(indent.length)) : span.text }))]);
    }
  }
  if (o.moreHunks || o.moreLines) rows.push([s(`… (${o.moreHunks ?? 0} more hunks, ${o.moreLines ?? 0} more lines)`, 'dim')]);
  return frame(title, [{ rows }], width, false, 0);
}
function grep(o: GrepOptions): Line[] {
  const width = cols(o.width);
  const head = [s(' 🔍 Grep: ', 'accent'), s(o.pattern, 'bright'), s(` ${o.matches} matches · ${o.files} files`, 'dim')];
  if (o.scope) head.push(s(` · in ${o.scope}`, 'dim'));
  if (o.truncated) head.push(s(' · truncated', 'warning'));
  const lines: Line[] = [head];
  if (o.rows) lines.push(...o.rows.flatMap(row => splitRows(row, 1).map(content => [s(' '), ...content])));
  else if (o.matches === 0) lines.push([s(' No matches found', 'dim')]);
  else (o.groups ?? []).forEach((group, index, groups) => {
    const last = index === groups.length - 1 && !o.moreMatches;
    lines.push([s(` ${last ? '└─' : '├─'} `, 'dim'), s(`# ${group.path}`, 'accent')]);
    group.rows.forEach(row => {
      const prefix = s(` ${last ? '   ' : '│  '}${row.matched === false ? ' ' : '*'}${row.line}│ `, 'dim');
      const content = typeof row.text === 'string' ? [s(row.text, 'dim')] : row.text;
      lines.push(...splitRows(content, textWidth(prefix.text)).map(spans => [prefix, ...spans]));
    });
  });
  if (o.moreMatches) lines.push([s(` └─ … ${o.moreMatches} more matches`, 'dim')]);
  return lines.flatMap(line => splitRows(line).map(row => fitLine(row, width, { ellipsis: true })));
}
function lsp(o: LspOptions): Line[] {
  const request: Line[] = [];
  if (o.path) request.push([s(o.path, 'dim')]);
  if (o.line !== undefined) request.push([s(`line ${o.line}`, 'dim')]);
  if (o.symbol) request.push([s(`symbol: ${o.symbol}`, 'dim')]);
  request.push(...(o.request ?? []));
  return frame([s(`💡 LSP ${o.action.replaceAll('_', ' ')}`, 'accent')], [
    { rows: request }, { title: 'Response', rows: o.response?.length ? o.response : [[s('No result', 'dim')]] },
  ], cols(o.width));
}
function dap(o: DapOptions): Line[] {
  const session: Line[] = [];
  if (o.session) session.push([s(`Session ${o.session}`, 'dim')]);
  const fields = [['Adapter', o.adapter], ['Status', o.status], ['CWD', o.cwd], ['Program', o.program], ['Stop reason', o.stopReason], ['Frame', o.frame], ['Instruction pointer', o.instructionPointer], ['Location', o.location]];
  for (const [label, value] of fields) if (value) session.push([s(`${label}: ${value}`, 'dim')]);
  if (o.configurationDonePending) session.push([s('Configuration: pending configurationDone; set breakpoints, then continue.', 'warning')]);
  if (o.exitCode !== undefined) session.push([s(`Exit code: ${o.exitCode}`, 'dim')]);
  const output = o.output.length ? [...o.output] : [[s('No output', 'dim')]];
  if (o.moreLines) output.push([s(`… ${o.moreLines} more lines ⟦⌃O: Expand⟧`, 'dim')]);
  return frame([s(`🐞 Debug ${o.action.replaceAll('_', ' ')}`, 'accent')], [
    ...(session.length ? [{ title: 'Session', rows: session }] : []), { title: 'Output', rows: output },
  ], cols(o.width));
}
function task(o: TaskOptions): Line[] {
  const width = cols(o.width);
  const call = o.phase === 'batch';
  const failed = o.phase === 'failed';
  const count = o.agents.length;
  const header = call ? `⇶ Task: ${o.agent ?? 'task'}` : `${failed ? '✘' : o.phase === 'running' ? '⇶' : '•'} Task ${count} ${count === 1 ? 'agent' : 'agents'}`;
  const rows: Line[] = [];
  const visible = o.expanded ? o.agents : call ? o.agents.slice(0, 4) : o.agents.slice(-4);
  const hidden = count - visible.length;
  if (hidden && !call) {
    const omitted = o.agents.slice(0, hidden);
    const counts = (['done', 'running', 'pending', 'failed', 'aborted'] as const).map(status => {
      const n = omitted.filter(agent => (agent.status ?? 'pending') === status).length;
      return n ? `${n} ${status}` : '';
    }).filter(Boolean);
    rows.push([s(`… ${hidden} more agents (${counts.join(' · ')}) ⟦⌃O: Expand⟧`, 'dim')]);
  }
  for (const agent of visible) {
    const status = agent.status ?? (o.phase === 'done' ? 'done' : o.phase === 'failed' ? 'failed' : 'pending');
    const color: TermColor = status === 'failed' || status === 'aborted' ? 'error' : status === 'done' ? 'success' : 'accent';
    // Task peers use a static dot even while live (agent-tree.ts), not a blocking spinner.
    const glyph = !call && status === 'failed' ? '✘' : !call && status === 'aborted' ? '⏹' : '•';
    const nameColor: TermColor = call || status !== 'done' ? 'accent' : 'fg';
    const line: Line = [s(`${glyph} `, call ? 'dim' : status === 'done' ? 'fg' : color), s(agent.name.replaceAll('.', '>'), nameColor, { bold: true }), s(`: ${call ? short(agent.description, 64) : agent.description}`, call ? 'dim' : nameColor)];
    if (agent.role && agent.role !== 'task') line.push(s(` ⟨${agent.role}⟩`, 'dim'));
    if (o.modelBadges && agent.model) line.push(s(` ⟦${agent.model}⟧`, 'accent'));
    if (agent.isolated) line.push(s(' [isolated]', 'dim'));
    if (!call) {
      if ((status === 'done' && o.phase !== 'running') || status === 'failed' || status === 'aborted') line.push(s(` ⟦${status}⟧`, color));
      if (agent.badge) line.push(s(` ⟦${agent.badge}⟧`, agent.badge === 'retrying' ? 'warning' : 'error'));
      if (agent.requests !== undefined) line.push(s(` · ${agent.requests} req`, 'dim'));
      if (agent.context) line.push(s(` · ${agent.context}`, 'dim'));
      if (agent.cost) line.push(s(' · ', 'dim'), s(agent.cost, 'gold'));
      if (agent.duration) line.push(s(` · ${agent.duration}`, 'dim'));
    }
    rows.push(line);
    if (!call && agent.currentTool && status === 'running') {
      // v18.8.6 symbols.ts selects └ for the Unicode tree.hook.
      const tool = agent.currentTool;
      const detail: Line = [s(`  └ ${tool.name}${tool.detail ? `: ${short(tool.detail, 40)}` : ''}`, 'dim')];
      if ((tool.elapsedSeconds ?? 0) > 5 && tool.elapsedLabel) detail.push(s(` · ${tool.elapsedLabel}`, 'warning'));
      rows.push(detail);
    }
    if (!call && agent.error) rows.push([s(`  ${agent.error}`, 'error')]);
    if (!call && agent.output?.length) {
      rows.push([s('  Output', 'comment')]);
      for (const text of o.expanded ? agent.output : agent.output.slice(0, 3)) rows.push([s(`    ${o.expanded ? text : short(text, 70)}`, 'comment')]);
    }
  }
  if (call && hidden) rows.push([s(`• … ${hidden} more agents`, 'dim')]);
  if (!call && o.phase !== 'running') {
    const successes = o.agents.filter(agent => (agent.status ?? (failed ? 'failed' : 'done')) === 'done').length;
    const failures = o.agents.filter(agent => (agent.status ?? (failed ? 'failed' : 'done')) === 'failed').length;
    const aborted = o.agents.filter(agent => agent.status === 'aborted').length;
    const summary: Line = [s('⟦', 'dim')];
    const parts: Span[] = [];
    if (aborted) parts.push(s(`${aborted} aborted`, 'error'));
    if (failures) parts.push(s(`${failures} failed`, 'error'));
    if (successes) parts.push(s(`${successes} succeeded`, 'success'));
    if (o.requests !== undefined) parts.push(s(`${o.requests} req`, 'dim'));
    if (o.duration) parts.push(s(o.duration, 'dim'));
    parts.forEach((part, index) => { if (index) summary.push(s(' · ', 'dim')); summary.push(part); });
    summary.push(s('⟧', 'dim'));
    rows.push(summary);
  }
  const assignment = o.assignment ? words(o.assignment, width - 3).map(text => [s(text, 'dim')]) : [];
  return frame([s(header, failed ? 'error' : 'accent')], [...(assignment.length ? [{ rows: assignment }] : []), { rows, divider: assignment.length > 0 }], width, failed);
}
function roman(n: number): string {
  let result = '';
  for (const [value, glyph] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']] as const) {
    while (n >= value) { result += glyph; n -= value; }
  }
  return result;
}
function todo(o: TodoOptions): Line[] {
  const count = o.phases.reduce((sum, phase) => sum + phase.items.length, 0);
  const rows: Line[] = [];
  o.phases.forEach((phase, index) => {
    const closed = phase.items.filter(item => item.status === 'completed' || item.status === 'abandoned').length;
    if (o.phases.length > 1) rows.push([s(`${roman(index + 1)}. ${phase.title}  ${closed}/${phase.items.length}`, 'dim')]);
    phase.items.forEach((item, itemIndex) => {
      const color: TermColor = item.status === 'completed' ? 'success' : item.status === 'abandoned' ? 'error' : item.status === 'blocked' ? 'warning' : item.status === 'in-progress' ? 'accent' : 'dim';
      const prefix = o.phases.length > 1 ? `  ${itemIndex === phase.items.length - 1 ? '└─' : '├─'} ` : '';
      rows.push([s(prefix, color), s(`${item.status === 'completed' ? '☑' : '☐'} `, color), s(item.text, color, { strike: item.status === 'completed' || item.status === 'abandoned' }), ...(item.status === 'blocked' ? [s(item.blockedNote ? ` (blocked: ${item.blockedNote})` : ' (blocked)', 'warning')] : [])]);
    });
  });
  return frame([s(`☑ Todo ${count} ${count === 1 ? 'task' : 'tasks'}`, 'accent')], [{ rows }], cols(o.width));
}
function agentHub(o: AgentHubOptions = {}): Line[] {
  const width = cols(o.width);
  const height = Number.isFinite(o.height) ? Math.max(7, Math.floor(o.height!)) : 36;
  const tab = o.tab ?? 'activity';
  const lines: Line[] = [rule(width, [s('Agent Hub', 'accent')], '╭', '╮', 1)];
  lines.push(bodyRow([s(' 1 Agents ', tab === 'agents' ? 'accent' : 'dim', tab === 'agents' ? { bg: 'deepBlue' } : {}), s(' · ', 'comment'), s(' 2 Activity ', tab === 'activity' ? 'accent' : 'dim', tab === 'activity' ? { bg: 'deepBlue' } : {})], width));
  lines.push(bodyRow([s(`${o.filter ?? 'all agents'} · ${o.scope ?? 'all'} · ${o.following === false ? 'paused' : 'following'} · search: ${o.search || '—'}`, 'comment')], width));
  lines.push(bodyRow([], width));
  const rows = o.rows?.length ? o.rows.flatMap(row => splitRows(row, 2)) : [[s('No agent activity recorded yet', 'dim')]];
  const available = height - 7;
  for (let index = 0; index < available; index++) lines.push(bodyRow(rows[index] ?? [], width));
  lines.push(rule(width), bodyRow([s(o.footer ?? '1:agents  j/k:select  ⏎:transcript  ␣:follow  f:filter  s:scope  /:search  ⎋:close', 'comment')], width), rule(width, [], '╰', '╯'));
  return lines;
}
function advisor(o: AdvisorOptions): Line[] {
  const width = cols(o.width);
  const blockers = o.notes.filter(note => note.severity === 'blocker').length;
  const lines: Line[] = [[s(' ⓘ Advisor', 'gold', { bold: true }), s(` ${o.notes.length} ${o.notes.length === 1 ? 'note' : 'notes'}`, 'comment'), ...(blockers ? [s(` · ${blockers} ${blockers === 1 ? 'blocker' : 'blockers'}`, 'error')] : [])]];
  const shown = o.expanded ? o.notes : o.notes.slice(0, 3);
  for (const note of shown) {
    const color: TermColor = note.severity === 'blocker' ? 'error' : note.severity === 'concern' ? 'warning' : 'dim';
    const prefix: Line = [];
    if (note.severity) prefix.push(s(`⟦${note.severity}⟧ `, color));
    if (note.turnsAgo !== undefined) prefix.push(s(`T-${note.turnsAgo} `, 'comment'));
    if (note.advisor && note.advisor !== 'default') prefix.push(s(`[${note.advisor}] `, 'comment'));
    const innerWidth = Math.max(1, Math.min(110, width - 1) - 4);
    const paragraphs = note.text.split('\n').filter(text => text.trim());
    let first = true;
    for (const paragraph of paragraphs) {
      let remaining = paragraph.trim().replace(/\s+/g, ' ');
      while (remaining) {
        const capacity = Math.max(1, innerWidth - (first ? lineWidth(prefix) : 0));
        const text = words(remaining, capacity)[0] ?? '';
        lines.push([s('   ▎ ', color), ...(first ? prefix : []), s(text)]);
        remaining = remaining.slice(text.length).trimStart();
        first = false;
      }
    }
  }
  if (shown.length < o.notes.length) lines.push([s(`   ▎ … +${o.notes.length - shown.length} more notes`, 'comment')]);
  return lines.map(line => fitLine(line, width, { ellipsis: true }));
}
function compaction(o: CompactionOptions): Line {
  const width = cols(o.width);
  const label = short(` 📷 ${o.method ?? 'compacted'} · ${o.before}→${o.after} · ⌃O `, width);
  const left = Math.floor((width - textWidth(label)) / 2);
  return [s('─'.repeat(left), 'border'), s(label, 'dim'), s('─'.repeat(Math.max(0, width - left - textWidth(label))), 'border')];
}
function ttsr(o: TtsrOptions): Line[] {
  if (!o.rules.length) return [];
  const width = cols(o.width);
  const rows: Line[] = [];
  const single = o.rules.length === 1 ? o.rules[0] : undefined;
  // Terminal presentation, not native "Rule applied:" (ttsr-notification.ts:107–159).
  rows.push(single ? [s('⚠ Injecting rule: '), s(single.name, undefined, { bold: true }), s('  ↶')] : [s(`⚠ Injecting ${o.rules.length} rules:  ↶`)]);
  const details: Line[] = [];
  let elided = false;
  for (const rule of o.expanded ? o.rules : o.rules.slice(0, 4)) {
    const description = (rule.description || rule.content || '').trim();
    const paragraphs = description.split('\n');
    const limit = single ? 2 : 1;
    const omitted = !o.expanded && paragraphs.length > limit;
    elided ||= omitted;
    const text = (o.expanded ? paragraphs : paragraphs.slice(0, limit)).join('\n') + (omitted ? '…' : '');
    if (single) {
      if (text) details.push(...words(text, width - 2).map(line => [s(line, undefined, { italic: true })]));
    } else {
      const name = `${rule.name}${description ? ': ' : ''}`;
      const body = words(text, Math.max(1, width - 2 - textWidth(name)));
      details.push([s(name, undefined, { bold: true }), s(body[0] ?? '', undefined, { italic: true })]);
      details.push(...body.slice(1).map(line => [s(line, undefined, { italic: true })]));
    }
  }
  const hidden = o.expanded ? 0 : Math.max(0, o.rules.length - 4);
  if (hidden) details.push([s(`… +${hidden} more (⌃O to expand)`, undefined, { italic: true })]);
  else if (elided) details.push([s(' (⌃O to expand)', undefined, { italic: true })]);
  if (details.length) rows.push([], ...details);
  const inverse = (line: Line): Line => fitLine([s(' '), ...line], width, { pad: true }).map(span => ({ ...span, fg: 'warning', inverse: true }));
  return [[], inverse([]), ...rows.map(inverse), inverse([])];
}
function planMode(o: PlanModeOptions): Line[] {
  return [fitLine([s(` Plan mode enabled. Plan file: ${o.path}`, 'dim')], cols(o.width), { ellipsis: true })];
}
function modelSelector(o: ModelSelectorOptions): Line[] {
  const width = cols(o.width);
  return o.rows.map(row => {
    const suffix = [row.context ? `${row.context} ◫` : '', row.price ?? ''].filter(Boolean).join('  ');
    const left = fitLine([s(row.selected ? ' ❯ ' : '   ', 'accent'), s(row.id, row.available === false ? 'comment' : 'fg')], Math.max(0, width - textWidth(suffix) - (suffix ? 1 : 0)), { ellipsis: true });
    const line: Line = [...left, s(' '.repeat(Math.max(0, width - lineWidth(left) - textWidth(suffix)))), s(suffix, 'dim')];
    return fitLine(row.selected ? line.map(span => ({ bg: 'deepBlue', ...span })) : line, width);
  });
}

export const ompUi = { statusBand, prompt, readRow, edit, grep, lsp, dap, task, todo, agentHub, advisor, compaction, ttsr, planMode, modelSelector };
