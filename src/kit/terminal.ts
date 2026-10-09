import { cellWidth, terminalCells } from './omp-ui';
import './kit.css';

export type TermColor = 'fg' | 'bg' | 'chrome' | 'widget' | 'accent' | 'deepBlue' | 'gold' | 'bright' | 'dim' | 'comment' | 'warning' | 'success' | 'error' | 'border' | 'mutedBorder' | 'toolErrorBg' | 'python' | 'thinkingOff' | 'thinkingMinimal' | 'thinkingLow' | `#${string}`;
export interface Span {
  text: string; fg?: TermColor; bg?: TermColor; bold?: boolean; dim?: boolean;
  italic?: boolean; underline?: boolean; inverse?: boolean; strike?: boolean;
}
export type Line = Span[];
export type TermEvent =
  | { at: number; op: 'type'; text: string; cps?: number; style?: Omit<Span, 'text'> }
  | { at: number; op: 'print'; lines: Line[] }
  | { at: number; op: 'stream'; lines: Line[]; lps?: number }
  | { at: number; op: 'replace'; lines: Line[] }
  | { at: number; op: 'status'; line: Line }
  | { at: number; op: 'clear' };
export interface TerminalScript { cols: number; rows: number; duration: number; label?: string; events: TermEvent[] }
export interface TerminalView {
  el: HTMLElement;
  render(script: TerminalScript, t: number, reducedMotion?: boolean): void;
}

// Titanium v18.8.6 defaults: reference/tui/style-spec.md lines 17–41.
// fg/bg intentionally use the theme's terminal palette, not the capture host's colors.
export const termColors: Readonly<Record<Exclude<TermColor, `#${string}`>, string>> = {
  fg: '#E8ECF4', bg: '#151820', chrome: '#0F1216', widget: '#1C2029',
  accent: '#00B4FF', deepBlue: '#0082B3', gold: '#D4C090', bright: '#E8ECF4',
  dim: '#9CA3B0', comment: '#6B7280', warning: '#FFB347', success: '#00FF88',
  error: '#FF4757', border: '#2A3038', mutedBorder: '#1F252D', toolErrorBg: '#1A0F10',
  python: '#F0C040', thinkingOff: '#4A5058', thinkingMinimal: '#5A6068', thinkingLow: '#6A7078',
};
export const unicodeGlyphs = 'π ⬢ ◫ 👥 ✔ ✘ ⚠ ⏳ ⟳ ⏹ ├─ └─ │ ─ └ ╭╮╰╯ ├┤┬┴┼ ┌┐└┘ ┃ ○ ◔ ◑ ◒ ◕ ◉ ⣾ ⣽ ⣻ ⢿ ⡿ ⣟ ⣯ ⣷ ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏ ▎ ⟦ ⟧ ⇶ ✎ ⎿ ⌃ ⎋ ⏎ ␣ ⏪ ↶ ☑ ☐ ⟨ ⟩ 🟦 📄 🗑 🔍 💡 🐞 📷 ⓘ ❯ ⟲ ▶ → ● •';
const resolve = (color: TermColor | undefined, fallback: 'fg' | 'bg') => color?.startsWith('#') ? color : termColors[(color ?? fallback) as keyof typeof termColors];
const fontLicenseUrl = new URL('./fonts/OFL.txt', import.meta.url).href;
const terminalLabel = (label = 'omp 18.8.6 defaults') => label.startsWith('Recreation · ') ? label : `Recreation · ${label}`;

function wrap(lines: Line[], cols: number): Line[] {
  const result: Line[] = [];
  for (const line of lines) {
    let row: Line = [], used = 0;
    for (const span of line) {
      let run = '';
      const flush = () => { if (run) { row.push({ ...span, text: run }); run = ''; } };
      for (const glyph of terminalCells(span.text)) {
        if (glyph === '\n' || glyph === '\r' || glyph === '\r\n') {
          flush(); result.push(row); row = []; used = 0; continue;
        }
        const count = glyph === '\t' ? 4 - used % 4 : 1;
        for (let index = 0; index < count; index++) {
          const cell = glyph === '\t' ? ' ' : glyph;
          const width = cellWidth(cell);
          if (used + width > cols) { flush(); result.push(row); row = []; used = 0; }
          run += cell; used += width;
        }
      }
      flush();
    }
    result.push(row);
  }
  return result;
}

function drawSpan(span: Span): HTMLSpanElement {
  const el = document.createElement('span');
  const fg = resolve(span.fg, 'fg'), bg = resolve(span.bg, 'bg');
  el.style.color = span.inverse ? bg : fg;
  if (span.bg || span.inverse) el.style.backgroundColor = span.inverse ? fg : bg;
  if (span.bold) el.style.fontWeight = '700';
  if (span.italic) el.style.fontStyle = 'italic';
  if (span.dim) el.style.opacity = '.65';
  const decorations = [span.underline && 'underline', span.strike && 'line-through'].filter(Boolean);
  if (decorations.length) el.style.textDecoration = decorations.join(' ');
  let text = '';
  const flush = () => { if (text) { el.append(document.createTextNode(text)); text = ''; } };
  for (const glyph of terminalCells(span.text)) {
    if (/^[\u0020-\u024f]+$/u.test(glyph)) { text += glyph; continue; }
    flush();
    const symbol = document.createElement('span');
    symbol.className = /\p{Emoji_Presentation}|\uFE0F/u.test(glyph) ? 'kit-term-glyph kit-term-emoji' : 'kit-term-glyph';
    symbol.style.width = `${cellWidth(glyph) * .6}em`;
    symbol.textContent = glyph;
    el.append(symbol);
  }
  flush();
  return el;
}

export function createTerminal(options: { cols: number; rows: number; label?: string }): TerminalView {
  const el = document.createElement('figure');
  el.className = 'kit-terminal';
  el.dataset.fontLicense = fontLicenseUrl;
  const caption = document.createElement('figcaption');
  caption.className = 'kit-recreation';
  caption.textContent = terminalLabel(options.label);
  const viewport = document.createElement('div');
  viewport.className = 'kit-term-viewport';
  const grid = document.createElement('div');
  grid.className = 'kit-term-grid';
  grid.setAttribute('aria-live', 'off');
  viewport.append(grid); el.append(caption, viewport);
  let rowEls: HTMLDivElement[] = [], signatures: string[] = [];
  let activeScript: TerminalScript | undefined;
  let events: TermEvent[] = [];
  let cols = 0, rows = 0;
  const resize = (nextCols: number, nextRows: number) => {
    if (!Number.isInteger(nextCols) || !Number.isInteger(nextRows) || nextCols < 2 || nextRows < 1) throw new RangeError('Terminal requires integer cols >= 2 and rows >= 1');
    if (cols === nextCols && rows === nextRows) return;
    cols = nextCols; rows = nextRows;
    el.style.setProperty('--kit-cols', String(cols));
    grid.style.width = `${cols}ch`;
    grid.style.height = `calc(${rows} * var(--kit-line-height))`;
    rowEls = Array.from({ length: rows }, () => { const row = document.createElement('div'); row.className = 'kit-term-row'; return row; });
    grid.replaceChildren(...rowEls); signatures = [];
  };
  resize(options.cols, options.rows);
  return {
    el,
    render(script, t, reducedMotion = false) {
      resize(script.cols, script.rows);
      if (script !== activeScript) {
        activeScript = script;
        events = [...script.events].sort((a, b) => a.at - b.at);
      }
      const time = reducedMotion ? script.duration : Math.max(0, Math.min(t, script.duration));
      let transcript: Line[] = [], status: Line | undefined, prompt: Line | undefined;
      for (const event of events) {
        if (event.at > time) break;
        switch (event.op) {
          case 'clear': transcript = []; status = undefined; prompt = undefined; break;
          case 'replace': transcript = [...event.lines]; prompt = undefined; break;
          case 'print': transcript.push(...event.lines); prompt = undefined; break;
          case 'stream': transcript.push(...event.lines.slice(0, Math.floor((time - event.at) * (event.lps ?? 8)))); prompt = undefined; break;
          case 'status': status = event.line; break;
          case 'type': {
            const characters = terminalCells(event.text);
            const count = Math.floor((time - event.at) * (event.cps ?? 28));
            prompt = [{ text: '╰─ ', fg: 'accent' }, { ...event.style, text: characters.slice(0, count).join('') }];
            break;
          }
        }
      }
      if (status) transcript.push(status);
      if (status || prompt) {
        const line: Line = prompt ?? [{ text: '╰─ ', fg: 'accent' }];
        if (!reducedMotion && time < script.duration && Math.floor(time / .55) % 2 === 0) line.push({ text: ' ', bg: 'bright' });
        transcript.push(line);
      }
      const all = wrap(transcript, cols);
      const visible = all.slice(-rows);
      el.dataset.scrollRows = String(Math.max(0, all.length - rows));
      el.dataset.time = String(time);
      const label = terminalLabel(script.label ?? options.label);
      if (caption.textContent !== label) caption.textContent = label;
      for (let i = 0; i < rows; i++) {
        const line = visible[i] ?? [];
        const signature = JSON.stringify(line);
        if (signatures[i] === signature) continue;
        signatures[i] = signature;
        rowEls[i]!.replaceChildren(...line.map(drawSpan));
      }
    },
  };
}
