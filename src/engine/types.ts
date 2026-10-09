export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface NarrationSentence {
  id: string;
  text: string;
  spoken?: string;
  claims: string[];
  sources?: string[];
  pauseAfter?: number;
}

export interface OnScreenItem {
  id: string;
  kind: 'stat' | 'quote' | 'label' | 'caption' | 'badge' | 'code' | 'tui';
  text: string;
  grade?: Grade;
  claims: string[];
  sources?: string[];
  at?: string;
}

export interface NarrationScene {
  id: string;
  title: string;
  visual: string;
  sentences: NarrationSentence[];
  onScreen: OnScreenItem[];
  holdAfter?: number;
}

export interface NarrationChapter {
  id: string;
  slug: string;
  title: string;
  act: string;
  targetSeconds: number;
  takeaway: string;
  scenes: NarrationScene[];
}

export interface CueSpan {
  start: number;
  end: number;
}

export interface ChapterCues {
  chapter: string;
  audio: string;
  captions: string;
  duration: number;
  sampleRate: 24000;
  voice: 'af_heart';
  model: string;
  lexiconHash: string;
  scenes: Array<{ id: string } & CueSpan>;
  sentences: Array<{ id: string; scene: string } & CueSpan>;
}

export interface MountContext {
  chapter: NarrationChapter;
  scene: NarrationScene;
  sentence(id: string): CueSpan;
  onScreen(id: string): OnScreenItem;
  cite(el: HTMLElement, refs: { claims?: string[]; sources?: string[] }): void;
}

export interface RenderContext {
  t: number;
  duration: number;
  sentence(id: string): CueSpan;
  progress(id: string, opts?: { lead?: number; lag?: number }): number;
  reducedMotion: boolean;
}

export interface SceneModule {
  id: string;
  mount(stage: HTMLElement, ctx: MountContext): void;
  render(ctx: RenderContext): void;
  unmount?(): void;
}

export interface ChapterModule {
  id: string;
  scenes: Record<string, SceneModule>;
}
