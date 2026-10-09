export function clamp(value: number, min = 0, max = 1): number {
  return Number.isNaN(value) ? min : Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function ease(progress: number): number {
  const p = clamp(progress);
  return p * p * (3 - 2 * p);
}

export function windowed(time: number, start: number, end: number): number {
  if (end < start) throw new RangeError('A motion window must end at or after its start.');
  if (start === end) return time >= end ? 1 : 0;
  return clamp((time - start) / (end - start));
}

export function typewriter(text: string, progress: number): string {
  const characters = Array.from(text);
  return characters.slice(0, Math.floor(characters.length * clamp(progress))).join('');
}
