# Visual kit

Import from `src/kit/index.ts`. Components are DOM/SVG factories, not a second animation engine. Create each component once in a scene's `mount`, append its `el`, and call `render` from the audio-driven scene renderer. Remove its element on unmount. No component starts a timer, requestAnimationFrame loop or CSS animation.

```ts
import { barChart, windowed } from '../../kit';
const chart = barChart({
  title: 'Illustrative comparison', condition: 'Synthetic example; not a benchmark result',
  axisLabel: 'Success (%)', domain: [0, 100],
  data: [{ label: 'A', value: 48, valueLabel: '48%', note: 'Same illustrative protocol' }],
});
stage.append(chart.el);
chart.render(windowed(ctx.t, 2, 6), ctx.reducedMotion);
```

All charts/cards use `render(progress, reducedMotion = false)`: progress is clamped to 0–1, and reduced motion renders 1. Exact supplied numeric labels are never animated into different factual values. Diagrams move message dots along the link during this progress interval; repeat windows explicitly in the scene only when appropriate. Inputs are treated as immutable. A scene is responsible for its evidence chips; the kit does not infer claims or citations.

The dev-only `#kit` route is the interactive gallery. Its default export, `mountGallery(root: HTMLElement): () => void`, mounts every component and returns its cleanup function. The slider controls 0–12 seconds; the final-state checkbox exercises reduced motion. Fixture numbers and quoted copy in the gallery are explicitly synthetic. Fidelity panels compare four renderer states with their original PNGs, without repeating the startup logo.

## Terminal

```ts
import { createTerminal, ompUi, type TerminalScript } from '../../kit';
const script: TerminalScript = {
  cols: 112, rows: 16, duration: 8,
  events: [
    { at: 0, op: 'status', line: ompUi.statusBand({ width: 112, path: 'project' }) },
    { at: 0.5, op: 'type', text: 'Inspect the greeting.', cps: 20 },
    { at: 2, op: 'print', lines: ompUi.readRow({ width: 112, path: 'src/greet.ts' }) },
    { at: 3, op: 'stream', lines: [[{ text: 'A supplied response.' }]], lps: 4 },
  ],
};
const terminal = createTerminal({ cols: 112, rows: 16 });
stage.append(terminal.el);
terminal.render(script, ctx.t, ctx.reducedMotion);
```

`createTerminal({cols, rows, label?}): TerminalView` returns `{el, render(script, seconds, reducedMotion?)}`. Dimensions must be integers (`cols ≥ 2`, `rows ≥ 1`). A script may change the grid dimensions. Default label: `Recreation · omp 18.8.6 defaults`. `label` can supply the suffix (`omp 18.8.6 defaults`) or a complete prefixed label; the renderer always ensures the visible `Recreation ·` prefix. Include `· illustrative model roles, not an endorsement` for mixed-provider examples. Supply complete narration-aligned events and a duration that includes all intended typing/streaming. At reduced motion the renderer evaluates the script at its duration and hides the cursor.

`TerminalScript` has `{cols, rows, duration, label?, events}`. `TermEvent` is:

| Event | Meaning and example |
|---|---|
| `type` | Replace the current prompt text; reveal grapheme clusters at `cps` (default 28). `{at:1, op:'type', text:'Read the file', cps:20, style:{bold:true}}` |
| `print` | Append lines immediately and clear submitted prompt text. `{at:3, op:'print', lines:[[{text:'Result'}]]}` |
| `stream` | Append complete lines at `lps` (default 8), first at `at + 1/lps`; clear prompt text. `{at:4, op:'stream', lines, lps:3}` |
| `replace` | Replace the transcript and clear prompt text; retain the status band. `{at:5, op:'replace', lines}` |
| `status` | Replace the band displayed after transcript content. `{at:0, op:'status', line:ompUi.statusBand()}` |
| `clear` | Clear transcript, status and prompt. `{at:6, op:'clear'}` |

Events are evaluated in timestamp order, retaining input order for ties. Seeking recomputes state, including cursor visibility, from the requested time. Wrapped content keeps the last `rows` rows. Scrolling is a deterministic row window, not smooth browser scrolling. The composer follows transcript height rather than being permanently docked at the bottom. `data-scroll-rows` exposes the clipped row count for inspection.

`Line` is `Span[]`. `Span` contains `{text, fg?, bg?, bold?, dim?, italic?, underline?, inverse?, strike?}`. Strike supports completed/abandoned todo items. Example: `[{text:'removed', fg:'error', strike:true}]`. Literal text is never interpreted as HTML or ANSI.

`TermColor` accepts a hex color or these Titanium tokens: `fg`, `bg`, `chrome`, `widget`, `accent`, `deepBlue`, `gold`, `bright`, `dim`, `comment`, `warning`, `success`, `error`, `border`, `mutedBorder`, `toolErrorBg`, `python`, `thinkingOff`, `thinkingMinimal`, `thinkingLow`. `termColors` exports the resolved read-only map: `termColors.accent === '#00B4FF'`.

The terminal palette is Titanium's `fg=#E8ECF4`, `bg=#151820`. The reference capture host used different external defaults (`#E5E5E5`, `#101010`). Full, self-hosted OFL JetBrains Mono v2.304 supplies text and box/block glyphs; Noto Sans Symbols 2 and platform emoji fonts fill glyph gaps. The reference's Ubuntu Sans Mono Nerd Font is a capture assumption, not an omp default. Default sizing is 18px type, 24px rows; override `--kit-terminal-size` and `--kit-line-height` on the terminal element when composing a scene. Glyphs are allocated explicit terminal-cell widths; no ligatures or Nerd Font substitutions. Stage terminals clip overflow rather than keeping a separate user scroll position. The gallery fits its terminals to the available width.

The unmodified full fonts are pinned to [JetBrains Mono v2.304](https://github.com/JetBrains/JetBrainsMono/tree/v2.304/fonts/webfonts). `fonts/JetBrainsMono-Regular.woff2` SHA-256 is `a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2`; `fonts/JetBrainsMono-Bold.woff2` is `c503cc5ec5f8b2c7666b7ecda1adf44bd45f2e6579b2eba0fc292150416588a2`. Their original copyright and SIL OFL 1.1 license are in [fonts/OFL.txt](fonts/OFL.txt), emitted with the application and discoverable through each terminal's `data-font-license` URL. The npm fontsource subsets omit box/block ranges, which is why the terminal uses these full files instead.

Width helpers are exported for builders:

```ts
terminalCells('e\u0301👥'); // two grapheme clusters
cellWidth('👥');          // 2 cells
textWidth('A👥');         // 3 cells
fitLine([{text:'Example'}], 5, {ellipsis:true}); // 'Exam…'
fitLine([{text:'A'}], 5, {pad:true});            // 'A    '
```

`terminalCells(text): string[]`, `cellWidth(grapheme): number`, `textWidth(text): number`, and `fitLine(line, width, {pad?, ellipsis?} = {}): Line` preserve span styles and grapheme clusters. `textWidth` measures the widest newline-delimited row, with tabs advancing to four-column stops. `fitLine` is single-row: it expands tabs, clips at the first newline and marks omitted content when `ellipsis` is requested. Multiline builders split rows before padding; tab stops account for borders and insets. `unicodeGlyphs` exports the space-delimited gallery glyph specimen, e.g. `terminalCells(unicodeGlyphs)`.

## omp UI builders

`ompUi` contains the following pure data builders. All accept `width?: number` (default 120). They return `Line[]` except `statusBand`, `prompt` and `compaction`, which return one `Line`. Pass a frame's width equal to the intended terminal width: the 160-column reference tool frames also occupy 160 terminal cells (a wide emoji is two cells, not one character).

```ts
ompUi.statusBand({model:'Opus 5.5', thinking:'◒ high', path:'project', context:'12K/200K'});
ompUi.prompt({text:'Explain the change.', hint:'esc cancel'});
ompUi.readRow({path:'src/greet.ts'}); // no source preview in the shipped default
ompUi.edit({path:'src/greet.ts', added:1, removed:1, rows:[
  {kind:'hunk', text:'@@ -1 +1 @@'},
  {kind:'remove', text:'return name;'},
  {kind:'add', text:[{text:'return name'}, {text:'.trim()', inverse:true}, {text:';'}]},
]});
ompUi.grep({pattern:'greet', matches:1, files:1, scope:'src/', groups:[
  {path:'src/greet.ts', rows:[{line:1, text:'export function greet() {}'}]},
]});
ompUi.lsp({action:'references', path:'src/greet.ts', line:1,
  response:[[{text:'src/main.ts:4:1'}]]});
ompUi.dap({action:'stack_trace', session:'debug-1', status:'stopped',
  stopReason:'breakpoint', output:[[{text:'#0 greet  src/greet.ts:1'}]]});
ompUi.task({phase:'running', agents:[{name:'Reader', description:'Read call sites',
  status:'running', currentTool:{name:'Read', detail:'src/main.ts', elapsedSeconds:7, elapsedLabel:'7s'}}]});
ompUi.todo({phases:[{title:'Change', items:[{text:'Inspect call sites', status:'completed'},
  {text:'Update greeting', status:'in-progress'}]}]});
ompUi.agentHub({width:120, height:36});
ompUi.advisor({notes:[{severity:'concern', turnsAgo:0, text:'Review empty input.'}]});
ompUi.compaction({before:'42K', after:'1.2K'}); // supplied illustrative counts
ompUi.ttsr({rules:[{name:'Structured edits', description:'Use the edit tool for source changes.'}]});
ompUi.planMode({path:'/tmp/plan.md'});
ompUi.modelSelector({rows:[{id:'anthropic/claude-opus-5-5', selected:true, available:true}]});
```

Exported builder input types and optional controls:

| API / types | Additional controls |
|---|---|
| `statusBand` / `StatusBandOptions`, `WidthOptions` | `brand`, `model`, `thinking` (empty string suppresses tail), `path`, `pathIcon`, `mode`, `git`, `context`, `cost`, `auto`, `gauge`; metrics are preformatted supplied strings |
| `prompt` / `PromptOptions` | `text`, right-aligned `hint` |
| `readRow` / `ReadRowOptions` | `path`, opt-in `preview: Line[]`; off by default |
| `edit` / `EditOptions`, `EditDiffRow` | `fileIcon`, `rows` (`hunk/context/add/remove`, text or spans), `moreHunks`, `moreLines`, `contentAbove`; TypeScript paths use the captured blue-square icon |
| `grep` / `GrepOptions`, `GrepFile` | `groups`, exact renderer excerpt `rows`, `scope`, `truncated`, `moreMatches`; groups contain `{path, rows:[{line,text,matched?}]}` |
| `lsp` / `LspOptions` | `action`, `path`, `line`, `symbol`, `request: Line[]`, `response: Line[]` |
| `dap` / `DapOptions` | `action`, `session`, `adapter`, `status`, `cwd`, `program`, `stopReason`, `frame`, `instructionPointer`, `location`, `configurationDonePending`, `exitCode`, `output`, `moreLines` |
| `task` / `TaskOptions`, `TaskAgent`, `TaskStatus` | Phase `batch/running/done/failed`; optional `assignment`, `agent`, `expanded`, `modelBadges` (off), supplied aggregate `requests`, `duration`. Agent has `name`, `description`, `status` (`pending/running/done/failed/aborted`), optional `model`, `role`, `requests`, `context`, `cost`, `duration`, `badge` (`retrying/rate-limited`), `isolated`, `output`, `error`, `currentTool`. Tool detail has `name`, `detail`, `elapsedSeconds`, `elapsedLabel` |
| `todo` / `TodoOptions`, `TodoPhase`, `TodoItem` | `phases:[{title,items}]`; item status `pending/in-progress/completed/abandoned/blocked`, optional `blockedNote` |
| `agentHub` / `AgentHubOptions` | `height` (default 36), `tab` (`agents/activity`), `filter`, `scope`, `following`, `search`, explicit `rows: Line[]`, `footer` |
| `advisor` / `AdvisorOptions`, `AdvisorNote` | `notes:[{text,severity?,turnsAgo?,advisor?}]`; severity `nit/concern/blocker`; optional `expanded` |
| `compaction` / `CompactionOptions` | `before`, `after`, `method` (`compacted/remote-compacted/soft-compacted/handed-off/snap-compacted/shaken`) |
| `ttsr` / `TtsrOptions`, `TtsrRule` | `rules:[{name,description?,content?}]`, `expanded`; source-derived warning notice, not evidence of live triggering |
| `planMode` / `PlanModeOptions` | `path` |
| `modelSelector` / `ModelSelectorOptions`, `ModelRow` | `rows:[{id,selected?,context?,price?,available?}]`; catalog visibility is not account access |

Widths clip without inventing content. Builders contain capture/source comments for non-obvious rendering details. They render supplied evidence; they do not run tools, imply account access, compute costs or invent runtime status.

## Charts and diagrams

`ChartComponent<T = SVGSVGElement>` exposes `el: T` and `render(progress, reducedMotion?)`. `ChartOptions` contains required `title`, `condition` and optional `width`, `height`. Named result types are `BarChartComponent`, `PairedBarsComponent`, `ScatterComponent`, `SmallMultiplesComponent`, `TimelineComponent`, `DiagramComponent`. Small multiples use an HTMLElement; the others use SVGSVGElement. Charts include a dark backdrop and accessible title/description text, so they remain readable on the white presentation stage. Domains are increasing and include zero/all data; confidence intervals are absolute bounds, not errors to add to the value. `ciLabel`, when supplied, is the exact full displayed interval label; otherwise the kit formats `CI low–high`.

```ts
barChart({title:'Example', condition:'Synthetic', axisLabel:'Success (%)',
  data:[{label:'A', value:48, valueLabel:'48%', ci:[42,54], ciLabel:'95% CI 42–54%', note:'n=100'}]});
pairedBars({title:'Before / after', condition:'Synthetic', axisLabel:'Success (%)',
  pairs:[{label:'Same model', first:{label:'Before', value:38}, second:{label:'After', value:62}}]});
scatter({title:'Cost and success', condition:'Synthetic', costAxis:'Cost ($)', successAxis:'Success (%)',
  points:[{label:'A', cost:1.2, success:48, costLabel:'$1.20', successLabel:'48%', note:'Same protocol'}]});
smallMultiples({title:'Separate protocols', condition:'Synthetic', columns:2, panels:[
  {title:'Protocol A', condition:'Independent scale', axisLabel:'Success (%)', data:[{label:'A',value:48}]},
  {title:'Protocol B', condition:'Independent scale', axisLabel:'Success (%)', data:[{label:'A',value:72}]},
]});
timeline({title:'Dated changes', condition:'Illustrative milestones', events:[
  {date:'2025-01-01', label:'Measure'}, {date:'2026-10-08', label:'Recheck', note:'Keep the protocol dated'},
]});
diagram({title:'Review flow', condition:'Illustrative', width:1000, height:500,
  nodes:[{id:'owner',label:'Owner',x:220,y:250}, {id:'reviewer',label:'Reviewer',x:750,y:250}],
  links:[{from:'owner',to:'reviewer',label:'patch'}]});
```

| Function / options | Data and optional fields |
|---|---|
| `barChart(BarChartOptions)` | `data: BarDatum[]`, `axisLabel`, optional `domain:[min,max]`. `BarDatum` has `label`, `value`, `valueLabel?`, `note?`, `color?`, `ci?:[low,high]`, `ciLabel?` |
| `pairedBars(PairedBarsOptions)` | `pairs: BarPair[]`, `axisLabel`, optional `domain`; `BarPair` has `label`, `first:BarDatum`, `second:BarDatum` |
| `scatter(ScatterOptions)` | `points: ScatterPoint[]`, `costAxis`, `successAxis`, optional `costDomain`, `successDomain`; point has `label`, `cost`, `success`, `costLabel?`, `successLabel?`, `note?`, `color?`, `labelDx?`, `labelDy?` |
| `smallMultiples(SmallMultiplesOptions)` | `title`, `condition`, `panels:BarChartOptions[]`, `columns?`; each panel keeps its own scale. Do not combine unrelated protocols into a shared axis |
| `timeline(TimelineOptions)` | `events:TimelineEvent[]`, `axisLabel?`; event has valid `date:YYYY-MM-DD`, `label`, `note?`, `color?`. Sorted chronologically; spacing is explicitly not elapsed time |
| `diagram(DiagramOptions)` | `nodes:DiagramNode[]`, `links:DiagramLink[]`; node has unique `id`, `label`, center `x/y` in viewBox pixels, optional `width/height` (160×72), `note`, `color`; link has existing `from/to`, optional `label/color`. Links clip to node edges; duplicates, unknown IDs, overlapping linked boxes, nodes/notes outside the viewBox or above the header, text that does not fit its node, and link labels overlapping nodes throw clear errors |

Choose dimensions for the eventual stage, not the gallery thumbnail. Scatter label offsets are explicit editorial layout choices; use them to resolve collisions. A negative `labelDx` selects end anchoring. Preferred offsets are clamped to the chart's safe text region; insufficient vertical space throws rather than clipping. Long IDs wrap without dropping characters. Text content is never silently replaced with a guessed shorter claim.

## Cards and badges

Each card has `CardComponent<T extends HTMLElement = HTMLElement>` shape and `render(progress, reducedMotion?)`. Text remains exact; only the whole card's opacity changes. Named result types: `StatCardComponent`, `QuoteCardComponent`, `GradeBadgeComponent`, `DateStampComponent`, `RecreationLabelComponent`.

```ts
statCard({value:'48 / 100', label:'Illustrative successes', condition:'Synthetic fixed protocol', note:'Not an omp result'});
quoteCard({quote:'A supplied quotation.', attribution:'Named author, work, date', context:'Relevant caveat'});
gradeBadge('A'); // A Peer-reviewed; never color alone
dateStamp('2026-10-08'); // semantic <time>: As of 2026-10-08
recreationLabel(); // Recreation · omp 18.8.6 defaults
recreationLabel('omp 18.8.6 defaults · illustrative model roles, not an endorsement');
```

`StatCardOptions` requires `value`, `label`, `condition`; optional `note`. `QuoteCardOptions` requires `quote`, `attribution`; optional `context`. `EvidenceGrade` is `'A'|'B'|'C'|'D'|'E'`: Peer-reviewed, Preprint/tech report, First-party, Secondary, Anecdotal. `gradeBadge` accepts that letter; `dateStamp` accepts a display date string (valid ISO formatting adds `datetime`); `recreationLabel` accepts the suffix after “Recreation ·”. These are labels, not automatic citations.

## Motion helpers

```ts
clamp(1.4);                 // 1; optional min/max default to 0/1
lerp(20, 80, .5);           // 50; progress is intentionally not clamped
ease(.5);                  // .5; clamped smoothstep, p²(3−2p)
windowed(4, 2, 6);          // .5; reversed windows throw, zero-length windows step
typewriter('Harness', .5);  // 'Har'; Unicode code-point safe, not word timing
```

Signatures: `clamp(value, min=0, max=1):number`, `lerp(start,end,progress):number`, `ease(progress):number`, `windowed(time,start,end):number`, `typewriter(text,progress):string`. A typewriter is visual choreography, not an inferred narration word-alignment track.
