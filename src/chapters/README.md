# Building a chapter scene

The narration JSON is the content contract. Use its exact sentence and `onScreen` IDs, preserve numeric conditions and caveats, and attach the supplied evidence. The shared layer is presentation framing, not another animation engine. It does not invent claims, cue times, charts or terminal events.

Import chapter helpers from `../shared/scene`, components from `../../kit`, and types from `../../engine/types` when working in `src/chapters/chNN/index.ts`. The [kit guide](../kit/README.md) documents component signatures and faithful terminal conventions.

## The stage and its regions

The engine gives every scene a **1920 × 1080 logical-pixel stage**. The shell scales that stage to the available width and height; do not add another viewport scale, use viewport units, or position captions or transport inside the scene.

The theater has no permanent sidebar. At desktop widths it retains the 40 px top bar, 44 px transport, 24 px bottom independence footer and 16 px vertical spacing; the centered stage uses the largest 16:9 rectangle remaining after reserving the measured caption dock. Hiding captions removes the full dock height and its 4 px gap. Stage scaling observes the independent stage-area box, coalesces size changes into one animation-frame write, and skips unchanged scales; scene content and sentence changes cannot resize it, but a newly measured dock can. The palette, typography and logical stage size stay unchanged. Narrow screens wrap controls and scroll the bounded main region rather than shrinking interface text.

Captions use a chapter-stable, native-size dock **below** the stage, outside both `.stage-viewport` and the scaled `#stage` DOM. Caption text is at least 44 px high (two 20 px lines plus 4 px padding); the dock adds another 4 px padding and grows without a height cap to show every active sentence completely, without manual scrolling or covering scene qualifications or evidence. On chapter, available caption width or font changes, an offscreen grid stacks every chapter sentence in the same cell with the exact `.caption-text` font, padding and maximum width; one layout read measures their maximum rendered height. Width observation ignores height-only changes and coalesces measurement through animation frames, never measuring per playback frame. The inline evidence slot has fixed flex-basis `min(14rem, 30%)`, so sentence-specific chips cannot change caption width; hiding captions moves those chips into transport. Keep narration, conditions and source controls meaningful when captions are hidden; do not position scene elements around shell controls.

References and Atlas use the reader root grid: a 40 px desktop header, the 24 px independence disclaimer immediately below it, then the actual `.app-main` scrollbox filling the remaining height. Mobile header and disclaimer rows size automatically. The disclaimer stays visible without bottom overlap; only presentation routes keep it at the bottom. Reader bottom padding and scroll-padding are at least the measured disclaimer height plus 16 px, allowing the last content to scroll fully into view. Focus `ensureVisible` continues to use the actual main scrollbox.

```ts
const frame = sceneFrame(stage, {
  title: ctx.scene.title,
  eyebrow: 'A condition that helps read the scene', // optional; sentence case
  layout: 'split',
  date: '2026-10-08',
});
```

`sceneFrame` returns `{ el, header, title, visual, aside, footer, notes, stamps }`. Append the main component to `visual`, supporting content to `aside` when present, and qualifications or a concise takeaway to `notes`. `stamps` is the header's provenance area, populated by the optional date. The frame is appended to the supplied stage once.

| Region | Logical coordinates and size |
|---|---|
| Safe content box | x = 80…1840; y = 64…1016; 1760 × 952 |
| Header | y = 64…256; 192 px high |
| Main body | y = 284…900; 616 px high |
| Footer / notes | y = 928…1016; 88 px high |
| Gaps | 28 px between header, body and footer |

Layout variants share those regions:

- **`full`** — the visual uses the entire body; `aside` is `null`. Use for one chart, a large diagram, a quote, or a title-led argument.
- **`split`** — main visual and aside share the body 60/40, with a 32 px gutter. The usable column widths are 1036.8 and 691.2 px. Use for a chart plus conditions, a mechanism plus implications, or an evidence comparison.
- **`stack`** — visual and aside share the body 60/40 vertically, with a 24 px gutter: 355.2 and 236.8 px. Use when long horizontal structures need the full width.
- **`terminal-focus`** — visual and annotation aside share the body 80/20 vertically, with a 24 px gutter: 473.6 and 118.4 px. Keep the lower strip to a short interpretation; put a long transcript in the shell's accessible transcript rather than shrinking it into the scene.

If a layout needs more room, change the composition or split the argument across existing beats. Do not silently clip facts, drop confidence intervals, or abbreviate model IDs into a different claim. The shell fallback can scroll a dense list; an authored scene should be deliberately composed to fit. Inspect the actual kit element dimensions, including headings, labels and conditions, when mounting; do not measure them on every frame.

## Type and colour

The shared frame uses Manrope for headings and IBM Plex Sans for explanation. The shell's `--font-mono` is the kit's full, self-hosted OFL JetBrains Mono face with Noto Symbols fallback.

Programming ligatures and contextual alternates are disabled globally, including against chapter font shorthands. Keep operators such as `<=`, `.=`, `->` and `!=` literal; do not re-enable `liga` or `calt` in scene CSS.

| Role | Starting scale |
|---|---|
| Scene title | 64 px / 1.12; normally no more than two lines |
| Optional eyebrow | 26 px; descriptive, not an all-caps category ornament |
| Main explanatory text | 32 px |
| Aside text | 30 px |
| Conditions, notes and evidence | 24 px; do not make caveats an unreadable afterthought |

Use `--color-ink`, `--color-muted`, `--color-panel`, `--color-paper`, `--color-accent` and the shared fonts. Keep the stage light and the editorial accent restrained. The kit's charts and terminal components have their own intentional dark surfaces. **Never recolour Titanium terminal tokens to match the stage**, change recorded glyphs into icons, or imply that a host font is an omp default. Use the kit's grade badge rather than a colour-only dot.

Component choices follow the argument:

- `pairedBars` for a controlled before/after or same-model comparison; `barChart` for a common protocol with an honest shared axis.
- `scatter` for cost–success trade-offs; `smallMultiples` for independent protocols that must not share an axis.
- `timeline` for dated milestones, not a ranking; `diagram` for ownership, boundaries, and message flow.
- `statCard` only when a number has a readable condition; `quoteCard` for exact attributed wording.
- `createTerminal` with `ompUi` builders for TUI recreations. Supply complete `TerminalScript` events whose time is derived from the narration cues. Read preview remains off unless the scene explicitly demonstrates opting in.

## Evidence and provenance

Call `withEvidence(container, ctx.onScreen(id), ctx)` **once during mount** after appending the factual content to that container. It returns the appended evidence row, or `null` when the item has neither a grade nor references. It uses the kit's grade badge and a native citation button wired through `ctx.cite`; opening evidence pauses narration. Do not call it every frame or manually duplicate citation-dialog logic. It does not replace the content with `item.text`: the builder is responsible for showing that exact wording or exact constituent labels without changing its meaning.

Chapter narration and cue data load with the shell so the menu, captions and transcript are immediately available. The Feature Atlas code and feature data load only on an atlas route. Evidence records load on the first citation request or References visit, sharing one cached import; opening a citation still pauses narration and opens the modal immediately while its records load. Claim chips retain claim IDs internally, and source-only chips retain stable global source IDs. A compact generated citation-label manifest provides readable grade/author/year labels without eagerly loading full evidence records; omp locators use `omp docs: path`. Claim labels choose the strongest cited source grade in A–E order, with stable ties, while accessible descriptions retain source titles. Long live labels scroll within the fixed evidence column beside captions, so they never change caption width or the measured dock height. Closing the modal or changing routes discards a pending display update; import failures explain how to reload and try again. The narration and `ctx.cite` contracts are unchanged.

Claim-chip accessible descriptions include a concise claim summary and the selected source title, not a claim ID. IDs remain in the evidence card's traceability information rather than visible citation labels or their accessible names.

Bibliography `gradeNote` explanations for role-dependent sources appear verbatim after **Evidence grading:** in source cards, both in evidence dialogs and References. Source grading remains distinct from the grades attached to individual claims.

Evidence prose renders `[INFERENCE]` markers as a visible **Researcher inference** label; `[INFERENCE: detail]` retains its detail in the label. This presentation treatment does not change the underlying evidence text or hide qualifications.

- The frame's optional **date stamp goes at the upper right**, beside the title region. Stamp fast-moving facts `2026-10-08` unless the narration explicitly names another historical date.
- A **recreation label stays directly above its recreated content**, never separated from the image it qualifies. `createTerminal` already owns a persistent label; do not add a second frame label around it.
- For a custom recreation, use `recreation: 'defaults'` on the frame for `Recreation · omp 18.8.6 defaults`. Use `'mixed-providers'` when showing the illustrative mixed-provider model profile; it adds `· illustrative model roles, not an endorsement`.
- Put conditions with their chart/card and qualifications in `notes`. Never rely on the modal alone to disclose a number's benchmark version, model, protocol or date.

## Time is audio time

The engine mounts a scene once, caches it, and may call `render` at any time and in any order. `ctx.t` is seconds relative to the scene start; `ctx.duration` includes its final hold. `ctx.sentence(id)` returns scene-relative `{ start, end }`. `ctx.progress(id, { lead?, lag? })` is clamped progress through that sentence, optionally starting earlier or finishing later. Do not estimate timings from word counts or maintain your own accumulating clock.

Scene DOM and chapter modules remain cached across navigation, but inactive chapter audio is paused, its listeners are aborted, and its media resource is released and the audio element detached. Audio is recreated when the chapter is revisited. Browser Back, menu navigation, deep links and auto-advance all share this lifecycle.

Deliberate jumps to nonzero scene boundaries target 30 ms inside the scene (or half its span for shorter scenes) to avoid decoder rounding undershoot. Chapter starts at zero stay at zero, and arbitrary nonboundary seeks stay unchanged. The actual media clock remains authoritative for rendering.

Use `reveal(el, ctx.progress(sentenceId), ctx.reducedMotion)` for a restrained entrance. It only changes opacity and a small vertical translation; repeated calls with identical arguments give identical styles. Wrap a component if it already owns its transform, so the entrance does not overwrite the component's own motion.

For a terminal, use the corresponding cue-relative event times and `terminal.render(script, ctx.t, ctx.reducedMotion)`. For charts/cards, call `component.render(progress, ctx.reducedMotion)`. The kit keeps factual value labels exact rather than animating a percentage through untrue intermediate claims.

**Reduced motion means the meaningful completed state**, not a slower animation or invisible content. Honour it for direct-time calculations as well as helper progress. Do not run CSS animations, independent `requestAnimationFrame` loops, intervals, accumulated counters, or autonomous Web Animations. In `render`, update only the necessary transform, opacity, text and attributes; no layout measurement, DOM discovery, component construction, event registration, or forced style/layout reads. Never condition a result on which direction the viewer sought.

## Accessibility

The shell owns its page heading, narration captions, transcript, transport and evidence dialog. Scene headings should start at `h2` and maintain a sensible hierarchy. Use text nodes and semantic elements; no `innerHTML` for narrative data. Keep evidence chips keyboard-operable through the shared helper.

The visible **Chapters** button (or **M**) opens a native modal drawer with chapter links, the current chapter transcript and scene links, and the single-key-shortcut preference. Opening it pauses narration; selecting a chapter or starting playback closes it. Escape, the Close button and clicking the backdrop dismiss it, restoring the invoking focus unless navigation has already moved focus to the new page heading. The browser supplies modal focus containment. Citation buttons in the transcript open the same evidence dialog; dismissing evidence returns to the transcript without resuming audio.

Desktop transport is one row: play/pause, five-second back/forward, chapter scrubber and scene markers, clock, captions, reduced motion, References and Fullscreen. **Space** plays or pauses outside native controls, arrow keys seek five seconds, **C** toggles captions, **R** opens/returns from References, **M** toggles Chapters and **F** toggles fullscreen on the presentation. Disabling Single-key shortcuts disables C/R/M/F and removes those `aria-keyshortcuts`; visible controls and native keyboard activation still work. Text-entry controls do not trigger these shortcuts.

Fullscreen targets the entire application root, so transport, the independence footer and evidence dialogs remain available. Its button follows the browser's `fullscreenchange` state, including browser Escape exits; unavailable or rejected requests show an honest notice and leave the normal window usable. Opening References or Atlas pauses narration, and returning restores the saved chapter position without automatically resuming it. The footer always reads: “Independent community explainer · not affiliated with Stencil Labs · facts as of 2026-10-08”.

Kit charts already provide accessible titles and descriptions. Keep informative SVGs labelled and provide readable numeric labels or a text alternative for the relationship they depict. Set `aria-hidden="true"` on genuinely decorative SVGs only. Do not mark factual charts or any focusable control hidden from assistive technology. Preserve text alternatives for diagrams and terminal stories; their essential claim must remain understandable in the narration/transcript and on-screen wording, not only in a moving dot or colour.

## A tiny example

This README-only example uses an existing `ch01` item to demonstrate the interfaces; it is **not an implementation of chapter 1**. A production chapter must export every scene in its narration JSON.

```ts
import type { ChapterModule, SceneModule } from '../../engine/types';
import { sceneFrame, withEvidence, reveal } from '../shared/scene';

let card: HTMLElement;
const scene: SceneModule = {
  id: '1.1',
  mount(stage, ctx) {
    const frame = sceneFrame(stage, {
      title: ctx.scene.title, layout: 'full', date: '2026-10-08',
    });
    const item = ctx.onScreen('1.1.a');
    card = document.createElement('section');
    const text = document.createElement('p');
    text.textContent = item.text;
    card.append(text);
    withEvidence(card, item, ctx);
    frame.visual.append(card);
  },
  render(ctx) {
    reveal(card, ctx.progress('1.1.1'), ctx.reducedMotion);
  },
};
const chapter: ChapterModule = { id: 'ch01', scenes: { '1.1': scene } };
export default chapter;
```

The validator inspects the **literal scene-map keys**, not merely the chapter filename. Prefer a default-exported `ChapterModule` object with `id: 'chNN'` and `scenes: { 'N.1': firstScene, 'N.2': secondScene }`. Local/imported constants and spreads are supported; avoid a runtime-generated map, computed IDs, or a function that hides the scene-map keys. A scene's own `id` must agree with its map key. The registry discovers only `./ch*/index.ts`; helper files under `shared/` are not chapter modules.

## Verify in the running presentation

1. Run `npm run data`, then `npm run dev`; open `#chNN/<sceneId>`, for example `http://127.0.0.1:4180/#ch01/1.1` when the dev server uses port 4180. A chapter without real generated cues deliberately uses the typographic fallback; do not mistake that fallback for verification of an authored module.
2. Use the real audio clock and capture the start, a mid-sentence state, and the completed scene. Confirm the exact on-screen numbers, conditions, citations, date/recreation labels, fit, contrast and typography at 1920×1080 and a laptop viewport.
3. Pause. Seek to the same time from both directions. Wait for `seeked` and two paint frames, then compare screenshots and inspect text/attributes. The same time and preferences must give identical results; the screenshot must also depict the correct beat, not merely a repeatable wrong state.
4. Toggle reduced motion and inspect the completed meaningful state. Open a citation while narration plays: the evidence card must pause audio, retain the correct claim and sources, and be closable with Escape.
5. Check browser console errors and failed resources. A media request cancelled by a seek is not a missing asset; inspect the active audio's `readyState`, `currentTime` and error state before diagnosing it. Keep screenshots and notes outside the repository unless the integration owner requests committed evidence.
6. Run `npm run build` and `npm run validate` once after the coordinated editing wave lands. Before release, `npm run validate -- --strict` must pass: missing authored scenes, cues or audio are errors, not a release-ready fallback.
