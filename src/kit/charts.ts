import { clamp, ease, lerp } from './motion';

export interface ChartComponent<T extends Element = SVGSVGElement> {
  el: T;
  render(progress: number, reducedMotion?: boolean): void;
}

export interface ChartOptions {
  title: string;
  condition: string;
  width?: number;
  height?: number;
}

export interface BarDatum {
  label: string;
  value: number;
  valueLabel?: string;
  note?: string;
  color?: string;
  ci?: readonly [number, number];
  ciLabel?: string;
}

export interface BarChartOptions extends ChartOptions {
  data: readonly BarDatum[];
  axisLabel: string;
  domain?: readonly [number, number];
}
export interface BarChartComponent extends ChartComponent {}

export interface BarPair {
  label: string;
  first: BarDatum;
  second: BarDatum;
}
export interface PairedBarsOptions extends ChartOptions {
  pairs: readonly BarPair[];
  axisLabel: string;
  domain?: readonly [number, number];
}
export interface PairedBarsComponent extends ChartComponent {}

export interface ScatterPoint {
  label: string;
  cost: number;
  success: number;
  costLabel?: string;
  successLabel?: string;
  note?: string;
  color?: string;
  labelDx?: number;
  labelDy?: number;
}
export interface ScatterOptions extends ChartOptions {
  points: readonly ScatterPoint[];
  costAxis: string;
  successAxis: string;
  costDomain?: readonly [number, number];
  successDomain?: readonly [number, number];
}
export interface ScatterComponent extends ChartComponent {}

export interface SmallMultiplesOptions {
  title: string;
  condition: string;
  panels: readonly BarChartOptions[];
  columns?: number;
}
export interface SmallMultiplesComponent extends ChartComponent<HTMLElement> {}

export interface TimelineEvent {
  date: string;
  label: string;
  note?: string;
  color?: string;
}
export interface TimelineOptions extends ChartOptions {
  events: readonly TimelineEvent[];
  axisLabel?: string;
}
export interface TimelineComponent extends ChartComponent {}

export interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  note?: string;
  color?: string;
}
export interface DiagramLink {
  from: string;
  to: string;
  label?: string;
  color?: string;
}
export interface DiagramOptions extends ChartOptions {
  nodes: readonly DiagramNode[];
  links: readonly DiagramLink[];
}
export interface DiagramComponent extends ChartComponent {}

const palette = {
  ink: '#eef3fa', muted: '#aab9ca', grid: '#35445a', blue: '#75b9ec',
  orange: '#eab77b', teal: '#7dd4c5', purple: '#b5a3ea', panel: '#162235',
};
const ns = 'http://www.w3.org/2000/svg';
type Attributes = Record<string, string | number>;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attributes = {}, text?: string): SVGElementTagNameMap[K] {
  const el = document.createElementNS(ns, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  if (text !== undefined) el.textContent = text;
  return el;
}

function text(parent: SVGElement, value: string, x: number, y: number, attrs: Attributes = {}): SVGTextElement {
  const el = svg('text', { x, y, fill: palette.ink, 'font-size': 22, ...attrs }, value);
  parent.append(el);
  return el;
}

function lines(value: string, width: number, size: number): string[] {
  const limit = Math.max(1, Math.floor(width / (size * 0.56)));
  const result: string[] = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (!word) continue;
      if (line && line.length + word.length + 1 > limit) {
        result.push(line);
        line = '';
      }
      let rest = word;
      while (rest.length > limit) {
        let end = limit;
        const last = rest.charCodeAt(end - 1);
        if (last >= 0xd800 && last <= 0xdbff) end = end === 1 ? 2 : end - 1;
        result.push(rest.slice(0, end));
        rest = rest.slice(end);
      }
      line += `${line ? ' ' : ''}${rest}`;
    }
    result.push(line);
  }
  return result;
}

function wrapped(parent: SVGElement, value: string, x: number, y: number, width: number, size = 20, attrs: Attributes = {}): number {
  const rows = lines(value, width, size);
  const el = svg('text', { x, y, fill: palette.muted, 'font-size': size, ...attrs });
  rows.forEach((row, index) => el.append(svg('tspan', { x, dy: index ? size * 1.35 : 0 }, row)));
  parent.append(el);
  return rows.length * size * 1.35;
}

function finite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite; received ${value}.`);
}

function dimensions(options: ChartOptions, defaultHeight = 620): { width: number; height: number } {
  const width = options.width ?? 1120;
  const height = options.height ?? defaultHeight;
  finite(width, 'Chart width');
  finite(height, 'Chart height');
  if (width < 480 || height < 280) throw new RangeError('Charts require width ≥ 480 and height ≥ 280.');
  return { width, height };
}

function frame(options: ChartOptions, width: number, height: number, description: string): { el: SVGSVGElement; top: number } {
  const el = svg('svg', {
    viewBox: `0 0 ${width} ${height}`, width, height, role: 'img',
    'aria-label': `${options.title}. ${options.condition}. ${description}`,
    'font-family': 'inherit',
  });
  el.style.display = 'block';
  el.style.width = '100%';
  el.style.height = 'auto';
  el.append(svg('title', {}, options.title), svg('desc', {}, `${options.condition}. ${description}`));
  el.append(svg('rect', { x: 0, y: 0, width, height, fill: palette.panel }));
  const titleHeight = wrapped(el, options.title, 20, 34, width - 40, 28, { fill: palette.ink, 'font-weight': 650 });
  const conditionHeight = wrapped(el, options.condition, 20, 34 + titleHeight, width - 40, 18);
  return { el, top: 50 + titleHeight + conditionHeight };
}

function domain(values: readonly number[], requested?: readonly [number, number]): readonly [number, number] {
  values.forEach(value => finite(value, 'Chart data'));
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const result = requested ?? [low, high === low ? low + 1 : high];
  finite(result[0], 'Domain minimum');
  finite(result[1], 'Domain maximum');
  if (result[0] >= result[1] || result[0] > low || result[1] < high) {
    throw new RangeError('Chart domain must increase and include zero and every data value.');
  }
  return result;
}

function scale(value: number, range: readonly [number, number], start: number, end: number): number {
  return lerp(start, end, (value - range[0]) / (range[1] - range[0]));
}

function tickLabel(value: number): string {
  return String(Number(value.toPrecision(5)));
}

function barNote(datum: BarDatum): string {
  const interval = datum.ci ? datum.ciLabel ?? `CI ${datum.ci[0]}–${datum.ci[1]}` : '';
  return [datum.note, interval].filter(Boolean).join(' · ');
}

export function barChart(options: BarChartOptions): BarChartComponent {
  const { width, height: requestedHeight } = dimensions(options, Math.max(460, 170 + options.data.length * 108));
  const labelWidth = width * 0.24;
  const left = labelWidth + 20;
  const right = width - Math.max(120, width * 0.15);
  const noteWidth = width - left - 24;
  const rowHeights = options.data.map(datum => Math.max(78,
    lines(datum.label, labelWidth - 20, 22).length * 30 + 18,
    56 + (barNote(datum) ? lines(barNote(datum), noteWidth, 17).length * 23 : 0)));
  const headingHeight = 50 + lines(options.title, width - 40, 28).length * 37.8
    + lines(options.condition, width - 40, 18).length * 24.3;
  const height = Math.max(requestedHeight, headingHeight + rowHeights.reduce((a, b) => a + b, 0) + 88);
  const values = options.data.flatMap(datum => {
    if (datum.ci && (datum.ci[0] > datum.value || datum.ci[1] < datum.value)) {
      throw new RangeError(`CI for ${datum.label} must contain its value.`);
    }
    return datum.ci ? [datum.value, ...datum.ci] : [datum.value];
  });
  const range = domain(values, options.domain);
  const summary = options.data.map(d => `${d.label}: ${d.valueLabel ?? d.value}. ${barNote(d)}`).join('; ');
  const { el, top } = frame(options, width, height, `${options.axisLabel}. ${summary}`);
  const bottom = height - 74;
  for (let index = 0; index <= 4; index++) {
    const value = lerp(range[0], range[1], index / 4);
    const x = scale(value, range, left, right);
    el.append(svg('line', { x1: x, x2: x, y1: top, y2: bottom, stroke: palette.grid }));
    text(el, tickLabel(value), x, bottom + 27, { 'text-anchor': 'middle', 'font-size': 17, fill: palette.muted });
  }
  text(el, options.axisLabel, (left + right) / 2, height - 16, { 'text-anchor': 'middle', 'font-size': 20 });
  const zero = scale(0, range, left, right);
  const bars: Array<{ rect: SVGRectElement; end: number; whisker?: SVGGElement }> = [];
  let y = top;
  options.data.forEach((datum, index) => {
    const end = scale(datum.value, range, left, right);
    wrapped(el, datum.label, 20, y + 28, labelWidth - 20, 22, { fill: palette.ink });
    const rect = svg('rect', { x: zero, y: y + 8, width: 0, height: 28, rx: 3, fill: datum.color ?? palette.blue });
    el.append(rect);
    text(el, datum.valueLabel ?? String(datum.value), width - 20, y + 29, { 'text-anchor': 'end', 'font-weight': 650 });
    let whisker: SVGGElement | undefined;
    if (datum.ci) {
      const low = scale(datum.ci[0], range, left, right);
      const high = scale(datum.ci[1], range, left, right);
      whisker = svg('g', { stroke: palette.ink, 'stroke-width': 2 });
      whisker.append(
        svg('line', { x1: low, x2: high, y1: y + 22, y2: y + 22 }),
        svg('line', { x1: low, x2: low, y1: y + 12, y2: y + 32 }),
        svg('line', { x1: high, x2: high, y1: y + 12, y2: y + 32 }),
      );
      el.append(whisker);
    }
    const note = barNote(datum);
    if (note) wrapped(el, note, left, y + 60, noteWidth, 17);
    bars.push({ rect, end, whisker });
    y += rowHeights[index] ?? 78;
  });
  const render = (progress: number, reducedMotion = false): void => {
    const p = reducedMotion ? 1 : ease(progress);
    for (const bar of bars) {
      const end = lerp(zero, bar.end, p);
      bar.rect.setAttribute('x', String(Math.min(zero, end)));
      bar.rect.setAttribute('width', String(Math.abs(end - zero)));
      bar.whisker?.setAttribute('opacity', String(p));
    }
  };
  render(1);
  return { el, render };
}

export function pairedBars(options: PairedBarsOptions): PairedBarsComponent {
  return barChart({
    ...options,
    data: options.pairs.flatMap(pair => [
      { ...pair.first, label: `${pair.label} — ${pair.first.label}`, color: pair.first.color ?? palette.blue },
      { ...pair.second, label: `${pair.label} — ${pair.second.label}`, color: pair.second.color ?? palette.orange },
    ]),
  });
}

export function scatter(options: ScatterOptions): ScatterComponent {
  const { width, height } = dimensions(options, 680);
  const xDomain = domain(options.points.map(point => point.cost), options.costDomain);
  const yDomain = domain(options.points.map(point => point.success), options.successDomain);
  const summary = options.points.map(point => `${point.label}: ${options.costAxis} ${point.costLabel ?? point.cost}; ${options.successAxis} ${point.successLabel ?? point.success}${point.note ? `. ${point.note}` : ''}`).join('; ');
  const { el, top } = frame(options, width, height, summary);
  const left = 106;
  const right = width - 240;
  const bottom = height - 90;
  if (right <= left || bottom <= top + 80) throw new RangeError('Scatter chart needs more room for its axes and condition.');
  for (let index = 0; index <= 4; index++) {
    const p = index / 4;
    const x = lerp(left, right, p);
    const y = lerp(bottom, top, p);
    el.append(
      svg('line', { x1: x, x2: x, y1: top, y2: bottom, stroke: palette.grid }),
      svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: palette.grid }),
    );
    text(el, tickLabel(lerp(xDomain[0], xDomain[1], p)), x, bottom + 28, { 'text-anchor': 'middle', 'font-size': 17, fill: palette.muted });
    text(el, tickLabel(lerp(yDomain[0], yDomain[1], p)), left - 16, y + 6, { 'text-anchor': 'end', 'font-size': 17, fill: palette.muted });
  }
  text(el, options.costAxis, (left + right) / 2, height - 18, { 'text-anchor': 'middle' });
  text(el, options.successAxis, 26, (top + bottom) / 2, { 'text-anchor': 'middle', transform: `rotate(-90 26 ${(top + bottom) / 2})` });
  const points = options.points.map(point => {
    const x = scale(point.cost, xDomain, left, right);
    const y = scale(point.success, yDomain, bottom, top);
    const dot = svg('circle', { cx: x, cy: y, r: 8, fill: point.color ?? palette.teal, stroke: palette.panel, 'stroke-width': 2 });
    el.append(dot);
    const dx = point.labelDx ?? 14;
    const dy = point.labelDy ?? -12;
    finite(dx, `Scatter label ${point.label} dx`);
    finite(dy, `Scatter label ${point.label} dy`);
    const endAnchor = dx < 0;
    const labelX = Math.max(left + (endAnchor ? 20 : 0), Math.min(width - (endAnchor ? 20 : 40), x + dx));
    const labelWidth = endAnchor ? labelX - left : width - 20 - labelX;
    const values = `${point.costLabel ?? point.cost} / ${point.successLabel ?? point.success}`;
    const labelHeight = lines(point.label, labelWidth, 20).length * 27;
    const valueHeight = lines(values, labelWidth, 17).length * 22.95;
    const noteHeight = point.note ? lines(point.note, labelWidth, 16).length * 21.6 : 0;
    const totalHeight = labelHeight + valueHeight + noteHeight;
    if (totalHeight > bottom - top) throw new RangeError(`Scatter label ${point.label} needs more vertical room; increase chart height or adjust labelDx.`);
    const labelY = Math.max(top + 20, Math.min(bottom - totalHeight + 20, y + dy));
    const anchor = { 'text-anchor': endAnchor ? 'end' : 'start' };
    wrapped(el, point.label, labelX, labelY, labelWidth, 20, { ...anchor, fill: palette.ink });
    wrapped(el, values, labelX, labelY + labelHeight, labelWidth, 17, anchor);
    if (point.note) wrapped(el, point.note, labelX, labelY + labelHeight + valueHeight, labelWidth, 16, anchor);
    return dot;
  });
  const render = (progress: number, reducedMotion = false): void => {
    const p = reducedMotion ? 1 : ease(progress);
    points.forEach(dot => dot.setAttribute('r', String(8 * p)));
  };
  render(1);
  return { el, render };
}

export function smallMultiples(options: SmallMultiplesOptions): SmallMultiplesComponent {
  const columns = options.columns ?? 2;
  if (!Number.isInteger(columns) || columns < 1) throw new RangeError('Small-multiple columns must be a positive integer.');
  const el = document.createElement('section');
  el.className = 'kit-small-multiples';
  el.style.background = palette.panel;
  el.style.color = palette.ink;
  el.style.padding = '20px';
  el.style.boxSizing = 'border-box';
  el.style.overflowWrap = 'anywhere';
  const title = document.createElement('h3');
  title.textContent = options.title;
  title.style.margin = '0 0 12px';
  const condition = document.createElement('p');
  condition.textContent = options.condition;
  condition.style.color = palette.muted;
  condition.style.margin = '0 0 24px';
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  grid.style.gap = '24px';
  const panels = options.panels.map(panel => barChart(panel));
  panels.forEach(panel => grid.append(panel.el));
  el.append(title, condition, grid);
  return { el, render(progress, reducedMotion = false) { panels.forEach(panel => panel.render(progress, reducedMotion)); } };
}

export function timeline(options: TimelineOptions): TimelineComponent {
  const { width, height: requestedHeight } = dimensions(options, Math.max(460, options.events.length * 118 + 150));
  const events = options.events.map(event => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) throw new RangeError(`Timeline date must use YYYY-MM-DD: ${event.date}`);
    const date = Date.parse(`${event.date}T00:00:00Z`);
    if (!Number.isFinite(date) || new Date(date).toISOString().slice(0, 10) !== event.date) throw new RangeError(`Invalid timeline date: ${event.date}`);
    return { ...event, dateValue: date };
  }).sort((a, b) => a.dateValue - b.dateValue);
  const rowHeights = events.map(event => 56 + (event.note ? lines(event.note, width - 270, 18).length * 25 : 0)
    + Math.max(0, lines(event.label, width - 270, 22).length - 1) * 30);
  const headingHeight = 50 + lines(options.title, width - 40, 28).length * 37.8
    + lines(options.condition, width - 40, 18).length * 24.3;
  const height = Math.max(requestedHeight, headingHeight + rowHeights.reduce((a, b) => a + b, 0) + 74);
  const { el, top } = frame(options, width, height, events.map(e => `${e.date}: ${e.label}. ${e.note ?? ''}`).join('; '));
  const x = 215;
  const bottom = height - 60;
  el.append(svg('line', { x1: x, x2: x, y1: top, y2: bottom, stroke: palette.grid, 'stroke-width': 3 }));
  const progressLine = svg('line', { x1: x, x2: x, y1: top, y2: bottom, stroke: palette.blue, 'stroke-width': 3 });
  el.append(progressLine);
  let y = top + 24;
  const dots = events.map((event, index) => {
    text(el, event.date, x - 24, y + 7, { 'text-anchor': 'end', 'font-size': 20 });
    const dot = svg('circle', { cx: x, cy: y, r: 7, fill: event.color ?? palette.blue });
    el.append(dot);
    const labelHeight = wrapped(el, event.label, x + 28, y + 7, width - 270, 22, { fill: palette.ink });
    if (event.note) wrapped(el, event.note, x + 28, y + 10 + labelHeight, width - 270, 18);
    y += rowHeights[index] ?? 80;
    return dot;
  });
  text(el, `${options.axisLabel ?? 'Date'} · chronological order; spacing is not elapsed time`, 20, height - 16, { 'font-size': 17, fill: palette.muted });
  const render = (progress: number, reducedMotion = false): void => {
    const p = reducedMotion ? 1 : clamp(progress);
    progressLine.setAttribute('y2', String(lerp(top, bottom, p)));
    dots.forEach((dot, index) => dot.setAttribute('r', String(7 * clamp(p * dots.length - index))));
  };
  render(1);
  return { el, render };
}

export function diagram(options: DiagramOptions): DiagramComponent {
  const { width, height } = dimensions(options, 620);
  const nodes = new Map<string, DiagramNode>();
  for (const node of options.nodes) {
    if (nodes.has(node.id)) throw new Error(`Duplicate diagram node id: ${node.id}`);
    finite(node.x, `Node ${node.id} x`);
    finite(node.y, `Node ${node.id} y`);
    finite(node.width ?? 160, `Node ${node.id} width`);
    finite(node.height ?? 72, `Node ${node.id} height`);
    if ((node.width ?? 160) <= 0 || (node.height ?? 72) <= 0) throw new RangeError(`Node ${node.id} needs positive dimensions.`);
    nodes.set(node.id, node);
  }
  const links = options.links.map(link => {
    const from = nodes.get(link.from);
    const to = nodes.get(link.to);
    if (!from || !to) throw new Error(`Diagram link ${link.from} → ${link.to} references unknown node ${!from ? link.from : link.to}.`);
    if (from.x === to.x && from.y === to.y) throw new Error(`Diagram link ${link.from} → ${link.to} requires distinct node positions.`);
    return { ...link, fromNode: from, toNode: to };
  });
  const description = [
    ...options.nodes.map(node => `${node.label}${node.note ? `: ${node.note}` : ''}`),
    ...links.map(link => `${link.fromNode.label} → ${link.toNode.label}${link.label ? `: ${link.label}` : ''}`),
  ].join('; ');
  const { el, top } = frame(options, width, height, description);
  for (const node of nodes.values()) {
    const w = node.width ?? 160;
    const h = node.height ?? 72;
    if (w < 24 + 22 * 0.56) throw new RangeError(`Node ${node.id} needs more width for its label and padding.`);
    if (node.x - w / 2 < 1 || node.x + w / 2 > width - 1 || node.y - h / 2 < top || node.y + h / 2 > height - 1) {
      throw new RangeError(`Node ${node.id} must fit below the diagram heading and inside the viewBox.`);
    }
    const labelHeight = lines(node.label, w - 24, 22).length * 29.7;
    if (labelHeight + 12 > h) throw new RangeError(`Node ${node.id} label needs height ≥ ${Math.ceil(labelHeight + 12)}; increase its height or width.`);
    if (node.note) {
      const noteWidth = w + 60;
      const noteBottom = node.y + h / 2 + 7 + lines(node.note, noteWidth, 17).length * 22.95;
      if (node.x - noteWidth / 2 < 0 || node.x + noteWidth / 2 > width || noteBottom > height) {
        throw new RangeError(`Node ${node.id} note must fit inside the viewBox; move the node or increase the diagram dimensions.`);
      }
    }
  }
  const messages: Array<{ dot: SVGCircleElement; x1: number; y1: number; x2: number; y2: number }> = [];
  for (const link of links) {
    const from = link.fromNode;
    const to = link.toNode;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const sourceScale = Math.min((from.width ?? 160) / 2 / Math.abs(dx), (from.height ?? 72) / 2 / Math.abs(dy));
    const targetScale = Math.min((to.width ?? 160) / 2 / Math.abs(dx), (to.height ?? 72) / 2 / Math.abs(dy));
    if (sourceScale + targetScale >= 1) throw new Error(`Diagram nodes ${from.id} and ${to.id} overlap along their link.`);
    const x1 = from.x + dx * sourceScale;
    const y1 = from.y + dy * sourceScale;
    const x2 = to.x - dx * targetScale;
    const y2 = to.y - dy * targetScale;
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    const color = link.color ?? palette.muted;
    el.append(svg('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 2 }));
    el.append(svg('path', { d: `M ${x2 - ux * 12 - uy * 6} ${y2 - uy * 12 + ux * 6} L ${x2} ${y2} L ${x2 - ux * 12 + uy * 6} ${y2 - uy * 12 - ux * 6}`, fill: 'none', stroke: color, 'stroke-width': 2 }));
    if (link.label) {
      const labelX = (x1 + x2) / 2 - uy * 18;
      const labelY = (y1 + y2) / 2 + ux * 18;
      const labelWidth = Math.min(240, 2 * (labelX - 20), 2 * (width - 20 - labelX));
      const labelRows = lines(link.label, labelWidth, 17);
      const labelHeight = labelRows.length * 22.95;
      if (labelWidth < 17 || labelY - 17 < top || labelY - 17 + labelHeight > height) {
        throw new RangeError(`Diagram link ${link.from} → ${link.to} label must fit below the heading and inside the viewBox.`);
      }
      const labelLeft = labelX - Math.min(labelWidth, Math.max(...labelRows.map(row => row.length)) * 17 * 0.56) / 2;
      const labelRight = 2 * labelX - labelLeft;
      for (const node of nodes.values()) {
        if (labelLeft < node.x + (node.width ?? 160) / 2 && labelRight > node.x - (node.width ?? 160) / 2
          && labelY - 17 < node.y + (node.height ?? 72) / 2 && labelY - 17 + labelHeight > node.y - (node.height ?? 72) / 2) {
          throw new RangeError(`Diagram link ${link.from} → ${link.to} label overlaps node ${node.id}; move the nodes or shorten the label.`);
        }
      }
      wrapped(el, link.label, labelX, labelY, labelWidth, 17, { 'text-anchor': 'middle' });
    }
    const dot = svg('circle', { cx: x1, cy: y1, r: 5, fill: link.color ?? palette.teal });
    el.append(dot);
    messages.push({ dot, x1, y1, x2, y2 });
  }
  for (const node of options.nodes) {
    const w = node.width ?? 160;
    const h = node.height ?? 72;
    el.append(svg('rect', { x: node.x - w / 2, y: node.y - h / 2, width: w, height: h, rx: 8, fill: palette.panel, stroke: node.color ?? palette.blue, 'stroke-width': 2 }));
    const labelRows = lines(node.label, w - 24, 22).length;
    wrapped(el, node.label, node.x, node.y - labelRows * 29.7 / 2 + 22, w - 24, 22, { fill: palette.ink, 'text-anchor': 'middle' });
    if (node.note) wrapped(el, node.note, node.x, node.y + h / 2 + 24, w + 60, 17, { 'text-anchor': 'middle' });
  }
  const render = (progress: number, reducedMotion = false): void => {
    const p = reducedMotion ? 1 : clamp(progress);
    for (const message of messages) {
      message.dot.setAttribute('cx', String(lerp(message.x1, message.x2, p)));
      message.dot.setAttribute('cy', String(lerp(message.y1, message.y2, p)));
      message.dot.setAttribute('opacity', p <= 0 || p >= 1 ? '0' : '1');
    }
  };
  render(1);
  return { el, render };
}
