import { loadChapter } from '../chapters/registry';
import { createFallbackScene } from './fallback';
import type {
  ChapterCues,
  ChapterModule,
  CueSpan,
  NarrationChapter,
  NarrationScene,
  NarrationSentence,
  RenderContext,
  SceneModule,
} from './types';

const SCENE_BOUNDARY_SEEK_INSET_SECONDS = 0.03;

export interface PlayerState {
  chapter: NarrationChapter;
  cues: ChapterCues | null;
  scene: NarrationScene;
  sentence: NarrationSentence | null;
  time: number;
  duration: number;
  playing: boolean;
}

interface PlayerOptions {
  cite: (el: HTMLElement, refs: { claims?: string[]; sources?: string[] }) => void;
  onFrame: (state: PlayerState) => void;
  onEnded: () => void;
  onError: (message: string) => void;
}

interface TimedScene extends CueSpan {
  scene: NarrationScene;
  spans: Map<string, CueSpan>;
  sentences: Array<{ sentence: NarrationSentence } & CueSpan>;
}

interface MountedScene {
  el: HTMLElement;
  module: SceneModule;
  context: RenderContext;
}

interface ChapterEntry {
  chapter: NarrationChapter;
  cues: ChapterCues | null;
  staticScene: NarrationScene;
  timeline: TimedScene[];
  views: Map<string, MountedScene>;
  module?: ChapterModule | null;
  modulePromise?: Promise<ChapterModule | null>;
  audio: HTMLAudioElement | null;
  audioEvents: AbortController | null;
  pendingSeek: number | null;
}

function createTimeline(chapter: NarrationChapter, cues: ChapterCues | null): TimedScene[] {
  if (!cues) return [];
  const scenes = new Map(cues.scenes.map((span) => [span.id, span]));
  const sentences = new Map(cues.sentences.map((span) => [span.id, span]));
  return chapter.scenes.map((scene) => {
    const span = scenes.get(scene.id);
    if (!span) throw new Error(`Missing audio cue for scene ${scene.id}.`);
    const relative = new Map<string, CueSpan>();
    const timedSentences = scene.sentences.map((sentence) => {
      const cue = sentences.get(sentence.id);
      if (!cue || cue.scene !== scene.id) {
        throw new Error(`Missing audio cue for sentence ${sentence.id}.`);
      }
      relative.set(sentence.id, { start: cue.start - span.start, end: cue.end - span.start });
      return { sentence, start: cue.start, end: cue.end };
    });
    return { scene, start: span.start, end: span.end, spans: relative, sentences: timedSentences };
  }).sort((a, b) => a.start - b.start);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class PresentationPlayer {
  readonly #stage: HTMLElement;
  readonly #options: PlayerOptions;
  readonly #chapters = new Map<string, ChapterEntry>();
  #active: ChapterEntry | null = null;
  #visible: MountedScene | null = null;
  #state: PlayerState | null = null;
  #frame: number | null = null;
  #selection = 0;
  #playAttempt = 0;
  #wantsPlayback = false;
  #naturalEndAllowed = false;
  #failure: Error | null = null;
  #renderFailed = false;
  #destroyed = false;
  #reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(stage: HTMLElement, options: PlayerOptions) {
    this.#stage = stage;
    this.#options = options;
  }

  get state(): PlayerState | null {
    return this.#state;
  }

  get reducedMotion(): boolean {
    return this.#reducedMotion;
  }

  set reducedMotion(value: boolean) {
    this.#reducedMotion = value;
    this.#render();
  }

  async select(chapter: NarrationChapter, cues: ChapterCues | null, sceneId?: string): Promise<void> {
    if (this.#destroyed) return;
    this.pause();
    const selection = ++this.#selection;
    const outgoing = this.#active;
    if (outgoing && (outgoing.chapter !== chapter || outgoing.cues !== cues)) {
      this.#releaseAudio(outgoing);
    }
    if (this.#visible) this.#visible.el.hidden = true;
    this.#visible = null;
    this.#active = null;
    this.#state = null;
    this.#renderFailed = false;
    this.#failure = null;

    try {
      const scene = sceneId ? chapter.scenes.find((item) => item.id === sceneId) : chapter.scenes[0];
      if (!scene) throw new Error(`Unknown scene ${sceneId ?? '(first scene)'} in ${chapter.id}.`);
      let entry = this.#chapters.get(chapter.id);
      if (!entry) {
        entry = {
          chapter, cues, staticScene: scene, timeline: createTimeline(chapter, cues),
          views: new Map(), audio: null, audioEvents: null, pendingSeek: null,
        };
        this.#chapters.set(chapter.id, entry);
      } else if (entry.chapter !== chapter || entry.cues !== cues) {
        const timeline = createTimeline(chapter, cues);
        this.#disposeViews(entry);
        entry.chapter = chapter;
        entry.cues = cues;
        entry.timeline = timeline;
      }
      entry.staticScene = scene;
      this.#active = entry;
      if (!cues) {
        this.#render();
        if (this.#renderFailed) throw this.#failure;
        return;
      }

      this.#ensureAudio(entry, cues);
      const timing = entry.timeline.find((item) => item.scene.id === scene.id);
      if (!timing) throw new Error(`Missing audio cue for scene ${scene.id}.`);
      this.#seekAudio(entry, timing.start);
      this.#render();
      if (this.#renderFailed) throw this.#failure;
      const chapterModule = await (entry.modulePromise ??= loadChapter(chapter.id));
      if (selection !== this.#selection || this.#destroyed) return;
      if (chapterModule && chapterModule.id !== chapter.id) {
        throw new Error(`Chapter module ${chapterModule.id} does not match ${chapter.id}.`);
      }
      entry.module = chapterModule;
      this.#render();
      if (this.#renderFailed) throw this.#failure;
    } catch (error) {
      if (selection === this.#selection && !this.#destroyed) {
        if (!this.#active && outgoing) this.#releaseAudio(outgoing);
        if (!this.#renderFailed) {
          this.#fail(`Could not select ${chapter.id}: ${errorMessage(error)}`, true);
        }
        throw this.#failure ?? error;
      }
    }
  }

  async play(): Promise<void> {
    const entry = this.#active;
    if (this.#destroyed || !entry?.cues || !entry.audio) return;
    if (this.#renderFailed) throw this.#failure ?? new Error('The current scene could not render.');
    this.#failure = null;
    const audio = entry.audio;
    if (audio.ended || audio.currentTime >= entry.cues.duration) this.seek(0);
    if (this.#failure) throw this.#failure;
    const selection = this.#selection;
    const attempt = ++this.#playAttempt;
    this.#wantsPlayback = true;
    this.#naturalEndAllowed = true;
    try {
      const playing = audio.play();
      this.#render();
      this.#scheduleFrame();
      await playing;
      if (this.#destroyed || selection !== this.#selection || attempt !== this.#playAttempt) {
        if (entry !== this.#active || entry.audio !== audio) audio.pause();
        return;
      }
      if (this.#failure) throw this.#failure;
      this.#render();
      this.#scheduleFrame();
    } catch (error) {
      if (selection === this.#selection && attempt === this.#playAttempt && !this.#destroyed) {
        if (!this.#failure) {
          this.#fail(`Could not play ${entry.chapter.title}: ${errorMessage(error)}`);
        }
        throw this.#failure ?? error;
      }
    }
  }

  pause(): void {
    ++this.#playAttempt;
    this.#wantsPlayback = false;
    this.#naturalEndAllowed = false;
    this.#cancelFrame();
    this.#active?.audio?.pause();
    this.#render();
  }

  seek(t: number): void {
    const entry = this.#active;
    if (this.#destroyed || !entry?.cues || !entry.audio || !Number.isFinite(t)) return;
    const target = Math.max(0, Math.min(entry.cues.duration, t));
    this.#naturalEndAllowed = this.#wantsPlayback && !entry.audio.paused && target < entry.cues.duration;
    try {
      this.#seekAudio(entry, target);
      this.#render();
    } catch (error) {
      this.#fail(`Could not seek ${entry.chapter.title}: ${errorMessage(error)}`);
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    ++this.#selection;
    ++this.#playAttempt;
    this.#wantsPlayback = false;
    this.#naturalEndAllowed = false;
    this.#cancelFrame();
    this.#active = null;
    this.#visible = null;
    this.#state = null;
    for (const entry of this.#chapters.values()) {
      this.#releaseAudio(entry);
      this.#disposeViews(entry);
    }
    this.#chapters.clear();
  }

  #releaseAudio(entry: ChapterEntry): void {
    entry.audioEvents?.abort();
    entry.audioEvents = null;
    const audio = entry.audio;
    entry.audio = null;
    entry.pendingSeek = null;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio.remove();
  }

  #ensureAudio(entry: ChapterEntry, cues: ChapterCues): void {
    const source = new URL(cues.audio, document.baseURI).href;
    if (entry.audio) {
      if (entry.audio.src !== source) entry.audio.src = source;
      return;
    }
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const controller = new AbortController();
    entry.audio = audio;
    entry.audioEvents = controller;
    const active = () => this.#active === entry && entry.audio === audio && entry.cues !== null && !this.#destroyed;
    const refresh = () => {
      if (active()) this.#render();
    };
    audio.addEventListener('loadedmetadata', () => {
      if (!active()) return;
      if (entry.pendingSeek !== null) {
        const target = entry.pendingSeek;
        try {
          audio.currentTime = target;
          entry.pendingSeek = null;
        } catch (error) {
          if (active()) this.#fail(`Could not seek ${entry.chapter.title}: ${errorMessage(error)}`);
          return;
        }
      }
      refresh();
    }, { signal: controller.signal });
    audio.addEventListener('timeupdate', refresh, { signal: controller.signal });
    audio.addEventListener('seeked', refresh, { signal: controller.signal });
    audio.addEventListener('playing', () => {
      if (!active() || !this.#wantsPlayback) {
        audio.pause();
        return;
      }
      this.#render();
      this.#scheduleFrame();
    }, { signal: controller.signal });
    audio.addEventListener('pause', () => {
      if (!active() || !audio.paused) return;
      this.#cancelFrame();
      // At a natural end the browser may dispatch pause before ended.
      if (!audio.ended) {
        this.#wantsPlayback = false;
        this.#naturalEndAllowed = false;
      }
      this.#render();
    }, { signal: controller.signal });
    audio.addEventListener('ended', () => {
      if (!active() || !audio.ended) return;
      const notify = this.#wantsPlayback && this.#naturalEndAllowed;
      this.#wantsPlayback = false;
      this.#naturalEndAllowed = false;
      ++this.#playAttempt;
      this.#cancelFrame();
      this.#render();
      if (notify) this.#options.onEnded();
    }, { signal: controller.signal });
    audio.addEventListener('error', () => {
      if (!active()) return;
      const detail = audio.error?.message || `media error ${audio.error?.code ?? 'unknown'}`;
      this.#fail(`Could not load audio for ${entry.chapter.title}: ${detail}`);
    }, { signal: controller.signal });
    audio.src = source;
    audio.hidden = true;
    audio.dataset.chapter = entry.chapter.id;
    this.#stage.append(audio);
  }

  #seekAudio(entry: ChapterEntry, target: number): void {
    const audio = entry.audio;
    if (!audio) return;
    const boundary = target === 0 ? undefined : entry.timeline.find((item) => item.start === target);
    // Seek inside exact scene boundaries so decoder rounding cannot land in the preceding scene.
    const seekTarget = boundary
      ? target + Math.min(SCENE_BOUNDARY_SEEK_INSET_SECONDS, (boundary.end - boundary.start) / 2)
      : target;
    // Retain the requested seek until metadata is available, never as a render clock.
    if (audio.readyState === 0) {
      entry.pendingSeek = seekTarget;
      return;
    }
    audio.currentTime = seekTarget;
    entry.pendingSeek = null;
  }

  #mount(entry: ChapterEntry, scene: NarrationScene, timing: TimedScene | null): MountedScene {
    const authored = timing ? entry.module?.scenes[scene.id] : undefined;
    const key = `${authored ? 'authored' : timing ? 'fallback' : 'static'}:${scene.id}`;
    const cached = entry.views.get(key);
    if (cached) return cached;
    const module = authored ?? createFallbackScene(scene);
    if (module.id !== scene.id) throw new Error(`Scene module ${module.id} does not match ${scene.id}.`);
    const el = document.createElement('div');
    el.className = 'presentation-scene';
    el.dataset.chapter = entry.chapter.id;
    el.dataset.scene = scene.id;
    el.hidden = true;
    const sentence = (id: string): CueSpan => {
      const span = timing?.spans.get(id);
      if (!span) throw new Error(`No audio cue for sentence ${id} in scene ${scene.id}.`);
      return span;
    };
    const context: RenderContext = {
      t: 0,
      duration: timing ? timing.end - timing.start : 0,
      reducedMotion: this.#reducedMotion,
      sentence,
      progress: (id, opts) => {
        const span = sentence(id);
        if (context.reducedMotion) return 1;
        const start = span.start - (opts?.lead ?? 0);
        const end = span.end + (opts?.lag ?? 0);
        if (end <= start) return context.t >= end ? 1 : 0;
        return Math.max(0, Math.min(1, (context.t - start) / (end - start)));
      },
    };
    const onScreen = new Map(scene.onScreen.map((item) => [item.id, item]));
    this.#stage.append(el);
    try {
      module.mount(el, {
        chapter: entry.chapter,
        scene,
        sentence,
        onScreen: (id) => {
          const item = onScreen.get(id);
          if (!item) throw new Error(`Unknown on-screen item ${id} in scene ${scene.id}.`);
          return item;
        },
        cite: this.#options.cite,
      });
    } catch (error) {
      el.remove();
      module.unmount?.();
      throw error;
    }
    const view = { el, module, context };
    entry.views.set(key, view);
    return view;
  }

  #render(): void {
    const entry = this.#active;
    if (!entry || this.#destroyed) return;
    const audio = entry.cues ? entry.audio : null;
    const time = audio?.currentTime ?? 0;
    let timing: TimedScene | null = null;
    if (entry.cues && entry.pendingSeek === null) {
      timing = entry.timeline[0] ?? null;
      for (const candidate of entry.timeline) {
        if (candidate.start > time) break;
        timing = candidate;
      }
    }
    const scene = entry.cues && timing ? timing.scene : entry.staticScene;
    const sentence = timing?.sentences.find((item) => time >= item.start && time < item.end)?.sentence ?? null;
    this.#state = {
      chapter: entry.chapter, cues: entry.cues, scene, sentence,
      time, duration: entry.cues?.duration ?? 0,
      playing: Boolean(audio && !audio.paused && !audio.ended),
    };
    if (!this.#renderFailed) {
      try {
        const view = this.#mount(entry, scene, timing);
        if (this.#visible !== view) {
          if (this.#visible) this.#visible.el.hidden = true;
          view.el.hidden = false;
          this.#visible = view;
        }
        view.context.t = time - (timing?.start ?? 0);
        view.context.reducedMotion = this.#reducedMotion;
        view.module.render(view.context);
      } catch (error) {
        this.#fail(`Could not render scene ${scene.id}: ${errorMessage(error)}`, true);
        return;
      }
    }
    this.#options.onFrame(this.#state);
  }

  #scheduleFrame(): void {
    const audio = this.#active?.audio;
    if (this.#frame !== null || this.#destroyed || this.#renderFailed || !this.#wantsPlayback || !audio || audio.paused || audio.ended) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = null;
      if (!this.#active?.audio?.paused && this.#wantsPlayback) {
        this.#render();
        this.#scheduleFrame();
      }
    });
  }

  #cancelFrame(): void {
    if (this.#frame === null) return;
    cancelAnimationFrame(this.#frame);
    this.#frame = null;
  }

  #fail(message: string, renderFailed = false): void {
    this.#failure = new Error(message);
    this.#wantsPlayback = false;
    this.#naturalEndAllowed = false;
    this.#renderFailed ||= renderFailed;
    this.#cancelFrame();
    this.#active?.audio?.pause();
    if (this.#state) {
      this.#state = { ...this.#state, playing: false };
      this.#options.onFrame(this.#state);
    }
    this.#options.onError(message);
  }

  #disposeViews(entry: ChapterEntry): void {
    for (const view of entry.views.values()) {
      try {
        view.module.unmount?.();
      } catch (error) {
        this.#options.onError(`Could not unmount scene ${view.module.id}: ${errorMessage(error)}`);
      } finally {
        view.el.remove();
      }
    }
    entry.views.clear();
  }
}
