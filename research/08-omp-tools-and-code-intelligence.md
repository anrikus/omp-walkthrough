# 08 — OMP tools and code intelligence
> Slice: OmpToolsResearch · Researched 2026-10-08 · Scope: Tool layer, code intelligence, runtime and operator controls for the installed omp 18.8.6 documentation; no execution benchmarks or demonstrations performed.

## Narration-ready takeaways
- OMP puts language-server navigation, diagnostics and refactoring, plus a real Debug Adapter Protocol debugger, inside the agent's tool surface. Those integrations are enabled by default, but they still need suitable language servers and debugger adapters installed. [11][12][13]
- Hashline gives an edit an address: a file snapshot tag plus original line numbers or syntax-block anchors. In the current format, the model copies a four-hex-digit file tag instead of repeating the old code verbatim. [4]
- OMP's creator reported Grok Code Fast 1 improving from 6.7% to 68.3% in a synthetic React mutation-repair experiment when the edit format changed. That is a first-party benchmark of a particular task and historical format—not proof that current OMP makes every coding model ten times better. [5]
- Search has several distinct jobs here: glob finds filenames, grep finds text, AST grep finds syntax, and find uses model judgments to locate an implementation from a description. Semantic find can make network requests and is not the same tool as the Unix find command. [7][8][9][14]
- Python and JavaScript evaluation keep state between cells; Python uses a retained subprocess, not a Jupyter server. Notebook files can be edited as marked-up cells, but that editing path does not execute the notebook or refresh its saved outputs. [18][19][20]
- Browser automation and computer use are different interfaces: the browser exposes web-page and tab APIs, while computer use exposes native windows, screenshots, input and accessibility. Both are Eval preludes, not standalone agent tools. [21][22]
- Checkpoint and rewind compress an investigation into a retained report. They rewind conversation context, not files, Git commits, processes or the desktop. [30][31]
- OMP has a real Rust native layer for search, structural editing, shell and platform services, but the whole application is not written in Rust. Its documented native targets include both Windows x64 and Windows ARM64. [38][39]
- Approval is not a sandbox: OMP defaults to yolo approval, and approved shell or Eval code retains broad host access. For comparison, Codex documents an OS-enforced local sandbox and separate approval policy; fewer prompts should not be presented as inherently safer. [35][17][44]
- Several impressive integrations are opt-in: computer use, GitHub, security scans, image generation, speech-file generation and checkpoint/rewind are disabled by default. A feature inventory is not a promise that all of them run immediately after installation. [22][24][26][27][28][30]

## Findings

### Evidence boundary and official identity

The official repository is `https://github.com/can1357/oh-my-pi`: its README names Stencil Labs, links `https://omp.sh`, and identifies the project as a Pi fork; the product site independently names Stencil Labs and uses the same tagline. The official changelog includes release **18.8.6 dated 2026-10-08**. Repository `main` also contains an Unreleased section, so bundled documentation is preferred for the installed surface; live source defaults below are identified separately. All version-sensitive statements in this dossier are as of **2026-10-08**. [1][2][3]

This is a documentation-grounded inventory, not a runtime acceptance test. Every proposed demonstration below is a **production suggestion [INFERENCE]**, not something run in this research. No omp agent run, settings change, installation, paid inference or benchmark was performed. For every feature except the historical edit-format experiment, **no controlled comparative performance measurement was established in the opened sources**. Architectural advantages below explain a mechanism; they do not establish a measured improvement over Claude Code or Codex.

**Fair comparison rule.** OMP's README says “most agents are still sprinkling print statements,” “searches return instantly,” and “everything your IDE knows, the agent knows.” These are first-party marketing statements, not established comparative results. Claude Code's official plugin documentation includes LSP servers, and Codex's current docs explicitly discuss browser, computer-use, web-search and security-review surfaces. Do not narrate those capabilities as categorically absent from mainstream harnesses. The defensible differentiator is OMP's particular integrated workflow and controls, not exclusive ownership of every capability. [2][42][43][44]

### Feature inventory and invocation convention

The user usually requests the outcome in natural language; the agent calls these tools. In the default `tools.xdev=true` configuration, discoverable tools can be exposed as `xd://<name>` devices: read the device documentation, then write its JSON arguments. The special resolution devices instead take plain text. Explicitly requested tools can remain top-level. Browser and computer APIs run through `eval`. The table gives **schema/documented defaults, not this user's effective configuration**; tool filters, runtime mode, credentials and prerequisite binaries can change availability. Settings can be supplied with a non-persisting `--config <file>` overlay; `/settings` and `omp config set` normally write global configuration. [41][30][34][18][21][22][40]

| Feature | One-line purpose | How to invoke / enable | Default on/off | Docs ref |
|---|---|---|---|---|
| hashline edit | Snapshot-anchored existing-file edits | `edit {input: "[PATH#TAG]…"}`; `edit.mode` | `hashline`, with model-family fallback caveat | [4] `omp://tools/edit.md` |
| read | Unified source, document, data and URL reading | `read {path:"src/file.ts:20-45"}` | Essential; summaries enabled | [6][41] `omp://tools/read.md` |
| grep | Regex content search | `grep {pattern,path}`; `grep.enabled` | On | [7] `omp://tools/grep.md` |
| glob | Filename/path discovery | `glob {path:"src/**/*.ts"}`; `glob.enabled` | On, essential | [8] `omp://tools/glob.md` |
| find | Model-judged semantic source search | `find {query,grep_keywords:[],path}`; `omp find`; `find.enabled` | `auto`, native System One judge prerequisite | [9] `omp://tools/find.md` |
| Native search | In-process Rust matching/traversal | Used by search tools | Backend, not a separate toggle/tool | [10] `omp://natives-text-search-pipeline.md` |
| LSP | Navigation, diagnostics and refactoring | `lsp {action:"status"}`; `lsp.enabled`; `--no-lsp` disables session integration | On; lazy startup on; usable server required | [11][12][40] |
| DAP debug | Launch/attach, stop, inspect, step | `debug {action:"launch",program,adapter}`; `debug.enabled` | On; usable adapter required | [13] `omp://tools/debug.md` |
| ast_grep | Structural pattern matching | `ast_grep {pat,path,lang?}`; `astGrep.enabled` | Off | [14] `omp://tools/ast-grep.md` |
| ast_edit | Preview structural substitutions | `ast_edit {ops:[{pat,out}],paths:[…]}`; `astEdit.enabled` | On | [15] `omp://tools/ast-edit.md` |
| bash | Commands, PTY and supervised services | `bash {command,cwd?,timeout?,name?,ready?}`; `bash.enabled` | On in live source; finite PTY off, service PTY on, `launch.enabled` on | [16][17][46] |
| eval / Python | Retained Python and Bun cells | `eval {language:"py" or "js",code}`; `eval.py`, `eval.js` | Both on; Python interpreter prerequisite | [18][19] |
| notebooks | Read/edit `.ipynb` via cell-marked text | `read` then `edit` notebook | File dispatch, not a separate execution tool | [20] `omp://notebook-tool-runtime.md` |
| browser | Managed browser/tab interaction | `eval` → `await browser.open(…)`; `browser.enabled` | On if Eval enabled; browser/backend prerequisite | [21] `omp://tools/browser.md` |
| computer | Native desktop input and accessibility | `/computer on`; `computer.enabled`; Eval `computer.*` | Off | [22][23] |
| github | Typed GitHub CLI operations | `github {op:"repo_view",repo:…}`; `github.enabled` | Off; `gh` on PATH required | [24] `omp://tools/github.md` |
| web_search | Configured search/grounding chain | `web_search {query}`; `web_search.enabled`; `modelRoles.web` | On; usable search candidate required | [25][40][41] |
| security_scan | Planned native review / explicit cloud scan | `security_scan {action:"preflight",…}` then `start`; `security.enabled` | Off; specific auth prerequisites | [26] `omp://tools/security_scan.md` |
| generate_image | Generate/edit image files | `generate_image {subject,…}`; `generate_image.enabled`; `modelRoles.image` | Off | [27] `omp://tools/generate_image.md` |
| tts | Generate an audio file from text | `tts {text,output_path}`; `speechgen.enabled`; `modelRoles.speech` | Off | [28] `omp://tools/tts.md` |
| ida | Open/script IDA Pro databases | `ida {action:"open",db:…}`; `ida.enabled` | On gate, but absent without local idalib installation | [29] `omp://tools/ida.md` |
| checkpoint / rewind | Retain investigation report, drop exploration context | `checkpoint {goal}` → `rewind {report}`; `checkpoint.enabled` | Off | [30][31] |
| todo | Parent/session task-state tracking | `todo {op:"init",items:[…]}`; `/todo`; `todo.enabled` | On in live source; additional registry/mode gating | [32][41] |
| ask | Interactive choice/free-form elicitation | `ask {questions:[…]}`; `ask.enabled` | On in live source; prompt-capable UI required; timeout 0 | [33][41] |
| resolve devices | Apply/reject staged previews | `write xd://resolve` or `xd://reject`, plain-text reason | Available when wired to relevant preview flow; not a standalone tool | [34] `omp://resolve-tool-runtime.md` |
| approval mode | Per-tier and per-tool permission decisions | `--approval-mode always-ask\|write\|yolo`; `tools.approvalMode` | `yolo` | [35] `omp://approval-mode.md` |
| vibe mode | Director delegates to persistent workers | `/vibe [prompt]`; repeat `/vibe` to exit | Opt-in interactive mode | [36] `omp://vibe-mode.md` |
| magic keywords | Turn-scoped workflow instructions | Lowercase prose `ultrathink`, `orchestrate`, `workflowz`, `jevify` | Global and four individual switches on | [37] `omp://magic-keywords.md` |
| Rust / Windows runtime | Native algorithms and platform primitives | Backend selected by OS/architecture; `PI_NATIVE_VARIANT` on x64 | Automatic native selection, not a separate agent tool | [38][39] |

### Hashline: current contract, benefit and historical measurement

**What / problem.** Current hashline uses `[PATH#TAG]`, where `TAG` is a four-uppercase-hex snapshot tag recorded by read/grep/edit; operations refer to the original snapshot's line numbers. `PUT N.=M:` replaces a range, `PUT N*:` replaces a syntax block, gaps insert, and `CUT`/named registers support moving code without re-emitting the captured text. `write` creates or wholly overwrites files. This avoids quoting the exact old text as a replacement anchor, the failure mechanism motivating the creator's experiment. [4][5]

**Controls and caveats.** Mode resolution is model-specific variant → `PI_EDIT_VARIANT` → `edit.mode` → hashline. Settings-derived hashline can fall back to `replace` for listed model families; `PI_STRICT_EDIT_MODE` disables that family fallback. `edit.enforceSeenLines=true` and `edit.blockAutoGenerated=true` are defaults. Stale tags can recover only when recorded snapshots prove a unique safe result; otherwise the edit fails. A syntax regression can produce a warning rather than rollback. Multi-file preparation happens before writing, but an OS write failure can leave earlier writes applied. Thus neither “every stale edit is rejected” nor “atomic across all files” is accurate. [4]

**Measured evidence.** Can Bölük's 2026-02-12 post describes 180 React mutation-repair tasks, three runs per task, fresh sessions, comparisons to original files before/after formatting, and sixteen models. It reports Grok Code Fast 1 6.7% → 68.3% and Grok 4 Fast output tokens down 61%. These are **Grade C maintainer-reported experiments**, not peer-reviewed findings, not SWE-bench scores, and not a measured result for omp 18.8.6. The article's illustrative old format tags individual lines with 2–3 characters, unlike the current file-tag language. Exact provider model revision, pinned harness commit and confidence intervals are not given in the opened article. Its linked raw benchmark location returned HTTP 404 during this research; no raw-run replication claim is warranted. [5][4]

**Demo, 30–40 s [INFERENCE].** On a prepared toy Python file, display one function with its actual tag, replace its body using `PUT`, then show the returned fresh tag. Animate the copied tag and the unchanged neighboring function. Optional second card explains a deliberate stale/unseen-range refusal; do not fake a guaranteed stale failure because recovery exists. [4]

### Reading and the four search choices

**Read.** One `path` accepts local files, internal resources, archives, SQLite, images, documents and URLs; normal `.ipynb` reads expose editable cells. Range suffixes live in the path, e.g. `:20-45`, `:-10`, `:raw`. Bare parseable code reads can summarize structure; source defaults enable summaries and set a 100-line minimum before summarization. This addresses excessive raw-file output [INFERENCE], not a quantified token win in the opened sources. [6][20][41]

**Read demo, 25–35 s [INFERENCE].** Prepare a >100-line toy module. Show its summary, request exactly the omitted function range, then read a small local JSON fixture or archive member to show a single path interface. Use only synthetic content. [6][41]

**Grep.** Native matching tries Rust regex, then PCRE2 for unsupported constructs such as lookaround, with literal recovery for malformed patterns. Defaults are case-sensitive and gitignore-aware; hidden files are included. File and match caps are surfaced rather than unlimited output. Regex-error recovery means a malformed expression can become a literal search; do not interpret an empty result as proof of absence without checking the query. [7][10]

**Grep demo, 20–30 s [INFERENCE].** Search a known literal across two toy modules, show file tags and context, then narrow to one file/range. Highlight the difference between a match and surrounding context. [7]

**Glob.** Glob discovers paths, defaults to `hidden=true`, `gitignore=true`, and a 200-result maximum. A bare `*.ts` searches recursively through automatic prefixing, whereas a path-prefixed glob uses its stated structure. Mtime sorting still requires walking the searched tree; a timeout returns a clearly incomplete scan, not definitive absence. [8]

**Glob demo, 20–25 s [INFERENCE].** Show a small prepared nested tree; contrast `src/*.ts` with `src/**/*.ts`. Reveal an ignored fixture only after explicitly setting `gitignore:false`; do not expose real ignored credentials. [8]

**Find.** This is semantic grep: lexical pre-ranking → filename judgments → passage sketches → full-passage verification. It accepts `query`, required `grep_keywords` (possibly empty), and a scope. `find.enabled=auto` enables the tool only when the judge role first resolves to a native System One model, not merely any chat model. It can send source passages to a judge and reports cost/requests; its scores are called calibrated probabilities in the docs, but no calibration study was established here. [9]

**Find demo, 25–35 s [INFERENCE].** Use a clearly labeled prepared recording of a query like “where do we reject expired coupons?” on a synthetic fixture; highlight the ranked path/range and the usage footer, then read that range. For a zero-paid-inference production constraint, animate the documented request/result structure instead and label it “interface illustration—not a measured live result.” Do not run a paid judge silently. [9]

**Native pipeline.** Search functions map directly from generated JS/TS bindings into Rust N-API exports. Filesystem grep deliberately does **not** use the shared scan cache; glob/fuzzy path discovery can use an optional walker cache, default false at the native API. Directory search can stop early when a result budget is satisfied, while unbounded traversal uses parallel work stealing. Oversized files are searched only over a leading 4 MiB window. These are concrete engineering mechanisms, not proof of “fastest” search. [10]

**Native search demo, 20–30 s [INFERENCE].** Animate `grep → N-API → Rust regex / PCRE2 → walker → bounded results`, with a separate cache branch only for eligible discovery flows. Show a truncation badge and a narrowed query, not an invented stopwatch race. [10]

### LSP: code intelligence before changing code

**What / problem.** LSP supports definition, type definition, implementation, references, hover, symbols, diagnostics, rename, file rename, code actions, status, reload, capabilities and raw requests. [INFERENCE] Server-provided references and workspace edits reduce dependence on lexical guessing; this is not a universal completeness guarantee, and Claude Code also supports LSP plugins. [11][42]

**Enable / defaults.** `lsp.enabled=true`, with lazy startup by default. Auto-detection requires a cwd root marker and resolvable executable in supported local bins or PATH; startup marker detection does not walk parents. Put project overrides in `.omp/lsp.json`; workspace `reload` rereads configuration. `rename` and `rename_file` **apply by default**, so explicitly use `apply:false` for a safe preview. Code actions list unless `apply:true` with a selector. Workspace diagnostics can launch `cargo check`, `npx tsc --noEmit`, `pyright` or `go build`; they are not just passive reads. [11][12]

**Demo, 30–40 s [INFERENCE].** Preinstall one suitable server and prepare a small typed project. Show `status`, a reference query, and a rename preview (`apply:false`) affecting the declaration and caller. Then show an existing diagnostics result. Avoid claiming a clean result from a missing or failed server. [11][12]

### DAP: observe runtime state instead of only speculating

**What / problem.** `debug` drives one root DAP session, including adapter-created child sessions: launch/attach, source/function/instruction/data breakpoints, continue/step/pause, frames/scopes/variables, evaluation, disassembly and memory operations. Some actions require adapter capabilities. [INFERENCE] This provides direct runtime observations without adding logging, but does not establish that mainstream products cannot debug. [13][2]

**Enable / defaults.** `debug.enabled=true`; an installed supported adapter is still required. Built-in IDs include `debugpy`, `dlv`, `lldb-dap`, `gdb` and `js-debug-adapter`. Custom definitions use `.omp/dap.json` or documented YAML equivalents. The tool's `debug` is distinct from the UI-only debug/report selector. Evaluation, launch and state changes use exec approval; inspection actions are read-tier. [13]

**Demo, 30–40 s [INFERENCE].** Use a prepared local Python arithmetic bug with debugpy already installed. Launch, set a breakpoint, continue, inspect the unexpected operand, step once and terminate. On-screen labels distinguish observed values from the model's diagnosis. Never attach to a real credential-bearing process. [13]

### AST grep and AST edit: syntax rather than text coincidence

**AST grep.** `astGrep.enabled=false`; enable it to search patterns such as `console.log($ARG)` with whole-node metavariables. `$$$NAME` captures multiple nodes. Languages infer by extension, with `lang` available for overrides. Parse issues must not be treated as a clean “not found.” [INFERENCE] This addresses formatting variations and accidental text matches without requiring a language server. [14]

**AST grep demo, 20–30 s [INFERENCE].** Search two differently formatted calls plus a comment containing the same words. Show the AST matches and captured argument; the comment is a contrast fixture, not a universal parser benchmark. [14]

**AST edit.** `astEdit.enabled=true`; `ops:[{pat,out}]` and `paths` produce a preview, not an immediate mutation. The follow-up is plain-text `write xd://resolve` to apply or `xd://reject` to discard. Files with syntax-error trees are skipped. The docs explicitly warn that stale-preview count checking occurs after the apply rerun and that OS write failures can partially apply a multi-file run; do not market this as transactional across every target. [15][34]

**AST edit demo, 25–35 s [INFERENCE].** Preview `console.log($ARG)` → `logger.info($ARG)` across two prepared JS fixtures; show “files NOT modified yet,” then discard. A second short preview/apply can be filmed in the disposable fixture with no concurrent writers. [15]

### Bash: embedded shell, finite jobs and managed services

**What / problem.** Finite non-PTY calls run in embedded POSIX-compatible brush, even if `shellPath` points to PowerShell. Named services use the user's external shell and a broker. `command`, `cwd`, `timeout`, `pty`, `async`, `name` and `ready` cover command execution, background work and readiness checks; there is no model-facing `env` field. [INFERENCE] Managed service identities/readiness reduce ad-hoc background-process bookkeeping. [16][17]

**Defaults / control.** Finite timeout is 300 seconds; 0 disables it. Async does not remove the deadline. Finite PTY defaults false; named-service PTY defaults true. Named services reject `async:true` or any supplied `timeout`, and readiness defaults to 30 seconds. Inspect/stop through `proc://`; `bashInterceptor.enabled=false` means dedicated-tool redirection is not automatically enforced by that optional interceptor. Command approval patterns are not containment and do not govern shells spawned through Eval. [16][17]

**Demo, 25–35 s [INFERENCE].** Run a harmless fixture command, then launch a loopback-only local fixture HTTP server with a unique `name` and `ready.port`; show readiness, `proc://` status and explicit stop. Use `--bind 127.0.0.1` with Python's HTTP server rather than the docs' all-interface example. The demo is proposed, not run. [16]

### Eval, Python REPL and notebooks

**Eval / Python.** Python and JavaScript each retain separate state; both are on by default, with `PI_PY`/`PI_JS` overrides. Python is a plain subprocess with an IPython-style syntax transformer, not actual IPython/Jupyter; the runner itself needs no extra pip dependency. `display()` captures structured/rich output; reset affects only the chosen language. Compaction can preserve the live kernel, but resuming in a fresh process does not restore historical variable values. [18][19]

**Problem / evidence.** [INFERENCE] Retained imports/data avoid repeatedly reconstructing one-off analysis and give a structured alternative to shell scripts. No measured speed or task-success improvement for this feature was established. The docs recommend `%load` for reusable setup and have explicit managed dependency installation; the video should not install packages during a supposedly deterministic short demo. [18][19]

**Eval demo, 25–35 s [INFERENCE].** First Python cell defines `values=[2,4,6]`; second displays their mean using retained state. A JavaScript cell defines a separate variable. Show that no external model call or notebook server is involved in this arithmetic. [18][19]

**Notebook distinction.** `read demo.ipynb` presents `# %% [code] cell:N` / markdown/raw markers; `edit` round-trips that view to JSON while preserving unrelated notebook metadata. Existing code-cell outputs and execution counts are preserved even when source changes, so those outputs can be stale. Standalone `write` is not notebook-aware; only write valid notebook JSON there. [20]

**Notebook demo, 25–35 s [INFERENCE].** Open a two-cell synthetic notebook, change a cell through hashline, show the raw JSON source changed and stored output did not. Overlay “editing ≠ executing”; separately run equivalent code through Eval if desired. [20]

### Browser and computer use

**Browser.** `browser.enabled=true` exposes the Eval facade when Eval is enabled. Named tabs support DOM/ARIA inspection, selectors, screenshots, input, network inspection, recording and page evaluation; backend choices include Chromium and attachment/native-webview routes. All browser host operations request exec approval. `tab.observe()` IDs and ARIA refs are separate, and navigation/re-render can invalidate them. `allowed_domains` is not a sandbox; `tab.run` has full Bun/Node/tool access. [21]

**Browser demo, 25–35 s [INFERENCE].** Open a pre-existing local fixture page in a fresh non-authenticated browser tab, observe, toggle a known checkbox by its fresh ID, then screenshot the deterministic result and close the tab. No external accounts, downloads, uploads or real forms. [21]

**Computer.** Disabled by default; `/computer on` enables it session-locally. `computer.windows`, `window`, screenshots and OS accessibility operate the real desktop without DOM. Inspection helpers use read approval; input/mutation uses exec. `read_only:true` constrains the desktop facade but is not a sandbox for arbitrary JavaScript. There is no `computer.backend` setting; native platform choice and permissions determine capability. [22][23]

**Computer demo, 25–35 s [INFERENCE].** On a clean demo account/VM, target exactly one harmless editor window, capture only that window and inspect its AX tree. If permissions are missing, show `capabilities()` and the prerequisite—not a simulated success. A click/type segment should touch only an unsaved toy document and be explicitly approved. [22][23]

### GitHub and web search

**GitHub.** Disabled by default and requires `gh` on PATH; authentication is checked during operations. The typed operations cover repository/file reads, searches, PR creation/checkout/push and Actions watching. Individual issue/PR views and diffs use `issue://` / `pr://`, rather than invented `issue_view`/`pr_view` operations. [INFERENCE] Typed arguments and formatted results reduce CLI quoting and parsing work; no comparative measurement was established. [24]

**GitHub demo, 20–30 s [INFERENCE].** Use read-only `repo_view` and `file_read` on a fixed public fixture repository/ref. For an offline deterministic cut, display a dated previously captured result labeled as recorded. Never create a PR, push or show authentication state on-screen. [24]

**Web search.** `web_search.enabled=true` in live defaults; `modelRoles.web` and `retry.fallbackChains.web` select the chain. The in-session tool has no per-call model override; one-shot `omp search`, `omp q` and `omp web-search` do. Fallback is sequential, provider support for recency/numeric options varies, and post-filter constraints may be relaxed with a note if otherwise no sources remain. Search snippets are discovery material, not a substitute for opening the source. [25][40][41]

**Web demo, 25–35 s [INFERENCE].** Show a recorded query scoped to an official public documentation site, then the actual read of its source URL. Freeze the recording date and keep the provider label/constraint notes visible; live rankings are not deterministic. For zero-spend capture, explicitly select an available credential-free search backend outside this research, or animate the documented flow without fabricated results. [25][40]

### Security scans, images and speech

**Security scan.** `security.enabled=false`. Native `preflight` stores an immutable scope/model/auth/workflow plan, and `start` rejects stale fingerprints before running a restricted review session. Native scanning requires stored OAuth or specifically supported provider-owned authentication; ordinary API-key-only providers are not accepted. Explicit `cloud_*` operations require ChatGPT Codex OAuth and are not an automatic fallback. Findings have validation states; “completed” does not mean the repository is proven secure. Codex itself also offers a security product, so this is not an OMP-exclusive category. [26][43]

**Security demo, 25–35 s [INFERENCE].** Animate `preflight → pinned plan → start → findings → validation` using a synthetic source fixture and clearly labeled illustrative IDs, or show a sanitized genuine existing recording. Do not launch a scan for this research or promise deterministic findings. Avoid depicting a fabricated validated vulnerability as a real result. [26]

**Generate image.** `generate_image.enabled=false`; accepts structured prompt fields, optional image inputs and an optional per-call image model. Otherwise it uses the image role/chain and applicable active-model candidates. It writes temporary image paths; `read` opens the images, rather than the tool returning an image block directly. Provider dimensions/models can differ from requested catalog entries, and zero image data is a normal result with an explanatory message. [27]

**Image demo, 20–30 s [INFERENCE].** Show an unsubmitted prompt for a generic geometric title-card illustration and the documented input/output route. Only show an output image if an authorized prior generation actually exists, with its real model metadata. A newly generated output is neither deterministic nor zero-cost by default. [27]

**TTS.** `speechgen.enabled=false` is the audio-file tool gate, distinct from other live/speaking features. Select `modelRoles.speech`; local Kokoro uses `tts.localVoice`, not the per-call `voice_id`. Local synthesis always writes PCM16 WAV, substituting a `.wav` sibling for a non-WAV request; no local MP3 encoder is bundled. Text is limited to 15,000 JavaScript string characters. [28]

**TTS demo, 25–35 s [INFERENCE].** With local Kokoro weights pre-provisioned and a pinned voice, synthesize one public-domain/toy sentence to `demo.wav`, show actual path/codec, then play the genuine recording in the edit. No voice cloning, real person's imitation, cloud fallback or hidden API billing. This research did not provision or synthesize it. [28]

### IDA: specialized reverse-engineering integration

**What / enable.** `ida.enabled` defaults on but the tool and executable read views disappear without a local IDA installation shipping idalib. Python must import `ida_domain` and `idapro`; `ida.installDir` is authoritative when set. The tool opens databases, comments/renames/sets types, and runs persistent Python. Each project-shared database host serializes requests; original executable inputs are copied into the IDB store and are not modified. Database changes can autosave, so “read the binary” should not be sold as no local side effects. [29]

**Problem / evidence.** [INFERENCE] This exposes specialist binary-analysis state directly rather than making an agent infer everything from text dumps. No comparative success/accuracy measurement was established, and ownership of the IDA integration does not eliminate its installation/licensing prerequisite. [29]

**Demo, 25–35 s [INFERENCE].** Only if an already authorized IDA installation exists: open a precompiled self-authored toy executable, show function names or pseudocode through the documented read/helpers, add a comment in a disposable IDB and close it. Otherwise show the prerequisite and architecture diagram; do not purchase software or run an unknown binary to fill the shot. [29]

### Checkpoint / rewind, todo, ask and resolution devices

**Checkpoint / rewind.** `checkpoint.enabled=false` gates the pair. One active checkpoint captures conversation boundaries; `rewind` requires a nonempty report and applies context branching at turn end. There is no Git/worktree restoration, despite a misleading summary string noted in the checkpoint docs. [INFERENCE] This can keep exploratory detail out of subsequent context while preserving a conclusion, but no controlled downstream-quality improvement was established. [30][31]

**Demo, 25–35 s [INFERENCE].** Checkpoint a read-only investigation of two toy files, inspect them, then rewind with a short report. Show the retained report and a “files unchanged by rewind” caption. Do not call it undo. [30][31]

**Todo.** The tool mutates phase/task state with `init/start/done/drop/block/unblock/rm/append/view`; only one task remains active after normalization. Defaults enable it in live source, but registry modes can omit it and it is normally parent-owned rather than inherited by subagents. `done` records a status transition, not independent proof the work passed tests. [32][41]

**Todo demo, 20–30 s [INFERENCE].** Initialize three toy tasks, mark one done and one blocked with an explicit reason, then show the remaining item. Label the panel “coordination state—not verification.” [32]

**Ask.** Interactive forms support one or several questions, single/multi-select, custom input and richer UI notes/previews. `ask.enabled=true` in live source; a prompt-capable UI is needed. `ask.timeout=0` disables auto-selection by default; if configured nonzero, timeout may select the recommended or first choice, while plan mode disables timeouts. [33][41]

**Ask demo, 20–30 s [INFERENCE].** Offer “CSV or JSON export?” on a toy task, manually choose JSON and add a note. Show the structured answer. Keep timeout disabled; never demonstrate a timeout as informed user consent. [33]

**Resolve.** There is no current standalone resolve tool. Preview producers queue pending operations, finalized by `write` to `xd://resolve` / `xd://reject` with plain-text reasons; `xd://propose` separately submits a plan slug in plan mode. [INFERENCE] Explicit staging makes intent visible but does not automatically imply human approval or a sandbox. [34][15][35]

**Resolve demo, 20–25 s [INFERENCE].** Reuse the AST preview shot: freeze the unchanged fixture, display the plain-text reject write and its discard message. Contrast JSON tool-device arguments with the plain-text resolution body. [34][15]

### Approval, vibe and magic keywords

**Approval.** Modes: `always-ask` auto-approves read only; `write` auto-approves read/write and asks for exec; `yolo` defaults to approving all three. Explicit per-tool policies remain relevant. Even `always-ask` does not ask on every read. OMP docs explicitly say shell approval patterns and computer read-only guards are not broad containment. Codex documents an OS sandbox separately from approvals, a meaningful mainstream strength. [35][17][23][44]

**Demo, 25–35 s [INFERENCE].** In a disposable capture session launched with `--approval-mode write`, request a harmless arithmetic execution, show the prompt, then reject. Use `always-ask` instead if demonstrating a file mutation prompt. Do not run a destructive command to prove the guard. [35]

**Vibe.** `/vibe` changes the top-level interactive agent into a director with read, optional todo and five worker-control tools. Workers perform searches/edits/execution; `fast` selects bundled sonic and `good` bundled task, subject to model routing. It conflicts with active or paused plan/goal modes. This is a worker architecture, not a synonym for yolo or “ignore permissions.” [36]

**Demo, 25–35 s [INFERENCE].** Use an existing authorized recording or an explicitly labeled UI storyboard: director assigns two small independent fixture tasks, receives reports and reads touched files. No claim of correctness based solely on worker completion. Detailed multi-agent settings belong in the other research slice. [36]

**Magic keywords.** Lowercase standalone prose triggers `ultrathink`, `orchestrate`, `workflowz`, `jevify`; code spans, paths and function-call spelling do not. All four switches and the global switch default true. `workflowz` uses the configuration key `magicKeywords.workflow`. Ultrathink adds reasoning guidance and, under automatic thinking, chooses the highest supported effort; it is not evidence that the model's underlying intelligence changed. [37]

**Demo, 20–30 s [INFERENCE].** Film editor highlighting for lowercase `ultrathink`, then contrast a code-span occurrence and `Ultrathink`. Display a settings card naming `magicKeywords.workflow` for workflowz. Do not submit a costly reasoning run just to demonstrate highlighting. [37]

### Rust native engine and Windows-native claims

The architecture is an ESM loader plus Rust Node-API addon; consumer TypeScript owns higher-level tool policy/rendering, while Rust owns algorithms and native resources. Native capabilities include search, AST operations, edit state, shell/PTY/process, desktop and media services. Documented targets are Linux/macOS/Windows on x64 and ARM64; x64 variants are modern x86-64-v3/AVX2 and baseline x86-64-v2. [38]

The embedded brush shell has in-process utility builtins, including uutils-derived commands, ripgrep-library-backed grep/rg and walker-backed fd; these avoid fork/exec for those builtins. Windows has explicit PATH enrichment and platform process handling. This substantiates a native Windows implementation path, **not a tested claim that every Unix command, language server, debugger or desktop feature works without prerequisites on Windows**. No Windows acceptance run was performed. [39][38][12][13]

**Demo, 25–35 s [INFERENCE].** Animate TypeScript policy → Node-API → Rust algorithms/platform services, then reveal the six documented platform tags. If real Windows footage is available later, show an actual safe command in a native Windows terminal and label OS/version; do not pass off a macOS capture as Windows. [38][39]

### Recommended walkthrough order and rationale

The following is a proposed editorial order **[INFERENCE]**, based on the documented dependencies rather than comparative performance data. [4][6][11][15][18][21][22][35]

1. **Safety + identity card:** version, disposable fixture, approval mode, enabled-versus-installed distinction. [3][35]
2. **Read → glob → grep → hashline:** establish how the agent sees and safely addresses source before showing sophisticated editing. [4][6][7][8]
3. **LSP → DAP:** static semantic knowledge, then observed runtime state; show why these are different. [11][13]
4. **AST grep → AST edit → resolve:** structural matching and explicit preview/apply after viewers understand ordinary edits. [14][15][34]
5. **Bash/service → Eval → notebook distinction:** execution lifecycle, retained state, and the important edit-versus-execute boundary. [16][18][20]
6. **Browser → computer:** progressively broader interaction surfaces with a fresh safety reminder. [21][22][23]
7. **Find → web search → GitHub:** implementation search versus external discovery versus repository operations; label network/model prerequisites. [9][25][24]
8. **Ask → todo → checkpoint/rewind:** operator feedback, progress state and context control; avoid portraying them as correctness evidence. [33][32][30][31]
9. **Short optional montage:** security, IDA, image, TTS; disclose prerequisites instead of implying all-on defaults. [26][29][27][28]
10. **Magic keywords / vibe handoff → native engine closing diagram:** connect to the separate multi-agent chapter; finish with the underlying architecture, not an unmeasured speed boast. [37][36][38][39]

### omp.sh claims: substantiated versus not established

| Site claim | Assessment against opened docs |
|---|---|
| “LSP” / “DAP” | Substantiated feature implementation and documented prerequisites; not proof every server/adapter capability works universally. [1][11][12][13] |
| “hashline edits” | Substantiated current snapshot-tag contract; historical per-line-hash illustration should not be shown as current syntax. [1][4][5] |
| “native Rust engine doing the heavy lifting” | Substantiated native algorithm/platform layer; not an all-Rust application or comparative timing result. [1][38][39] |
| “Windows-native, skip the WSL” | Documented win32-x64/win32-arm64 targets and native Windows runtime paths substantiate implementation intent; end-to-end Windows compatibility was not exercised here. [1][38][39] |
| “all you need built in” | Marketing: several features are off by default or require external binaries/models/auth. “Integrated” is safer narration than “everything works out of the box.” [1][12][13][22][24][26][27][28][29] |
| “every tool tuned against real sessions” | README and site assert it; opened changelog gives examples of fixes, but no per-tool study or exhaustive session-evidence corpus was established. Do not turn this into a measured claim. [1][2][3] |
| “IDE wired in” | Defensible metaphor for LSP/DAP and semantic tooling, not literal parity with every IDE feature. [1][11][13][14] |
| “omp², soon!” | A site teaser, not a verified release, specification or delivery date. [1] |
| Subagents, plan mode, hindsight memory, time-traveling rules | Outside this slice's feature scope; not assessed here. Their presence in site copy alone is not verification. [1] |

## Key numbers

| Claim/metric | Value | Conditions (model, harness, benchmark/version, date) | Source [n] (location) | Grade |
|---|---|---|---|---|
| Historical mutation-repair pass rate | 6.7% → 68.3% | Grok Code Fast 1; patch vs historical hashline; synthetic React repairs, 180 tasks × 3 runs, fresh sessions; article dated 2026-02-12, accessed 2026-10-08; exact model revision/harness commit/CI not provided | [5], “The Benchmark” | C |
| Historical output-token reduction | 61% | Grok 4 Fast, historical edit-format experiment; same reported benchmark design; exact denominator/raw run reports not recovered | [5], “The Benchmark” | C |
| Article's cross-model comparison | Hashline beats patch in 14/16; v2 improves further in 12/16 | Article's top chart caption, accessed 2026-10-08; no inference that every model improves or that this is 18.8.6 | [5], opening caption | C |
| Current snapshot tag | Four uppercase hexadecimal characters | Installed bundled edit docs; file snapshot, not per-line two-character hash | [4], “Input,” “Limits and validation” | C |
| Glob visible cap / timeout | 200 paths / 5000 ms | Built-in local tool defaults/maximum; partial scans flagged | [8], “Limits & Caps” | C |
| Native oversized-file grep window | Leading 4 MiB | Native grep single-file/deferred prefix search, not guaranteed whole-file coverage | [10], “Execution branches,” “Search/collection semantics” | C |
| Semantic find scope/caps | 128 filename candidates; 20 files read; 40 passages verified | Documented cascade, not a measured retrieval benchmark; model-judged | [9], “Limits & Caps” | C |
| Finite Bash timeout | 300 s default; 0 disables | Async preserves deadline; named services use readiness timeout instead | [16], “Inputs” | C |
| Eval timeout | 30 s default; 0 disables | Active-runtime window; specified host waits pause/reset window, not simple whole-call wall time | [18], “Inputs,” “Execution flow” | C |
| DAP session shape | One root session tree | Adapter-created children allowed; not one arbitrary independent root per tool call | [13], “Flow,” “Limits & Caps” | C |
| TTS input cap | 1–15,000 JavaScript string characters | All tool backends; local Kokoro output WAV/PCM16 | [28], “Inputs,” “Limits & Caps” | C |
| Supported native platform tags | linux-x64, linux-arm64, darwin-x64, darwin-arm64, win32-x64, win32-arm64 | Loader target list as of 2026-10-08; not six executed platform tests | [38], “Loader and distribution” | C |

## Contested or uncertain

- The benchmark article's title says 15 LLMs, its methodology says sixteen, and its current caption distinguishes historical hashline and v2. It also says “four tools” while parenthetically listing only read, edit and write. Preserve those inconsistencies; do not silently normalize the experimental configuration. [5]
- The README repeats 6.7% → 68.3%, +5 pp, −61% tokens and a MiniMax multiplier, but its marketing table is not an independently reproduced benchmark. This dossier uses only the clearest article-backed numbers and does not extrapolate them to whole-repository engineering. [2][5]
- The old benchmark report link and the search-discovered current hashline/bench URL both returned 404. Therefore raw fixtures, per-run variance, exact model versions and exact old harness revision remain unverified; the source grade is C, not A/B. [5]
- `tools.xdev`, bash/ask/todo/web-search default values were read from current repository source as well as contextual bundled docs; `main` can advance beyond the installed build. The file documents its provenance rather than claiming an effective local settings audit. [41][46][3]
- AST preview/apply and hashline validation reduce particular edit risks but do not guarantee multi-file transactional rollback. Notebook outputs can remain stale after edits. These are material limitations worth stating on screen. [4][15][20]
- Native search speed, LSP completeness, semantic find calibration, debugger effectiveness, computer-use reliability and security-scanner precision have no controlled independent measurements established in the opened evidence. Feature presence is the strongest supported claim. [10][11][9][13][22][26]

## Corrections & nuances to the blueprint

- Use **“file snapshot tag plus original line/block anchors”** for current hashline, not the historical 2–3-character hash on every line. [4][5]
- `find` is semantic model-judged search, not glob or Unix find. AST grep is off by default while AST edit is on. [9][14][15]
- Browser/computer are Eval preludes; Python is not Jupyter; notebook editing does not run notebooks. [21][22][19][20]
- There is no standalone current `resolve` tool, and checkpoint/rewind is not a Git/filesystem undo. [34][30][31]
- Distinguish **enabled by default**, **present in the session**, **dependency installed**, and **credentialed/available**. LSP/DAP/IDA and the disabled opt-ins make this distinction essential. [11][12][13][29][26]
- Approval mode is not sandboxing, and vibe mode is not yolo. Avoid an anti-mainstream story that erases Claude Code LSP plugins or Codex's sandbox/security/browsing capabilities. [35][36][42][43][44]
- A definitive “best settings” claim is not justified by the evidence here. For filming, a disposable fixture plus explicit approval policy and only necessary integrations is an editorial safety recommendation [INFERENCE], not a benchmark-optimal configuration. [35][23]

## Open questions for the user

1. Should the core video be beginner-focused, with IDA/security/media integrations in an optional appendix, or an exhaustive tool tour?
2. Is previously authorized footage available for model-dependent features, or must production remain entirely zero-paid-inference? Semantic find, image generation, security reviews and vibe-worker runs cannot be truthfully presented as newly exercised deterministic demos under the latter constraint. [9][27][26][36]
3. May filming use a clean VM/demo account and prepared fixture project, especially for desktop input? [23]
4. Is the historical Grade C hashline experiment acceptable with a visible “maintainer-reported synthetic benchmark” label, or should numbers be omitted until the raw data is recovered? [5]
5. Should Windows-native be a documented architecture statement, or does the final video require an actual Windows capture/acceptance demonstration? [38][39]

## Unverified leads

- Recover the original React edit benchmark fixtures and per-run reports from the creator; the article's `can1357/omp/.../react-edit-benchmark` link and discovered `oh-my-pi/.../hashline/bench` location were inaccessible (404) in this session. No raw-data citation is supplied. [5]
- Independent or peer-reviewed evaluations isolating current OMP 18.8.6 hashline, LSP, DAP, read summarization, native search, semantic find or security scanning were not established in this slice. Do not upgrade the maintainer's benchmark to peer-reviewed evidence.
- Exact local effective tool enablement, available LSP/DAP binaries, Chromium provisioning, computer permissions, IDA availability and cached Kokoro weights were not audited; all relevant demo prerequisites remain prerequisites, not claimed local capabilities. [12][13][21][23][29][28]
- Confirm any desired Windows demo on its actual target system; loader support and implementation docs are not operational certification. [38][39]

## Visual ideas

- **Addressed edit animation:** old-string reproduction versus a current `[file#TAG]` + `PUT` anchor; label the historic format separately. [4][5]
- **Two-bar benchmark inset:** 6.7% and 68.3%, titled “Grok Code Fast 1 · synthetic React mutation repair · creator-reported · historical format · 3 × 180 tasks,” not “OMP overall accuracy.” [5]
- **Search decision tree:** filename → glob; known literal → grep; syntax pattern → AST grep; unknown behavior → find; unknown symbol relationship → LSP. Show a “judge/network” badge only on semantic find. [7][8][9][14][11]
- **Static versus dynamic split screen:** LSP reference graph on one side, DAP stopped frame/variables on the other. [11][13]
- **Three-layer architecture:** agent/TypeScript policy, Node-API bridge, Rust algorithms/platform layer; place Windows/macOS/Linux badges beneath the native layer. [38][39]
- **Traffic-light prerequisites:** on by default, opt-in, external dependency/auth—separate columns rather than one misleading “included” checkmark. Use the inventory table. [11][13][22][24][26][27][28][29]
- **Context versus disk rewind:** conversation branch collapses into a report while the filesystem column stays fixed; notebook source/output gets a similar independent-state diagram. [30][31][20]
- **Safety boundaries graphic:** OMP approval decision versus ambient execution, compared fairly to Codex's separate sandbox/approval layers. Do not draw browser allowed-domains or computer read-only as a full security perimeter. [35][21][23][44]

## References

All references were opened with `read` during this research. Bundled `omp://` references denote the locally installed documentation; their year is the 2026 release context, not an independently established original publication date. Grade C means first-party evidence, not independent verification.

[1] Stencil Labs. “omp — a coding agent with the IDE wired in.” Official product site, 2026. https://omp.sh/ . Grade: C. Accessed 2026-10-08.
[2] Stencil Labs / can1357. “oh-my-pi README.” GitHub, 2026. https://github.com/can1357/oh-my-pi . Grade: C. Accessed 2026-10-08.
[3] OMP contributors. “Coding-agent changelog,” 18.8.6 and adjacent entries. GitHub, 2026. https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/CHANGELOG.md . Grade: C. Accessed 2026-10-08.
[4] OMP contributors. “edit.” Bundled documentation, 2026. omp://tools/edit.md . Grade: C. Accessed 2026-10-08.
[5] Can Bölük. “We improved 15 LLMs at coding in one afternoon. Only the harness changed.” Stencil Labs, 2026-02-12. https://stencil.so/blog/the-harness-problem (opened via https://blog.can.ac/2026/02/12/the-harness-problem/ redirect). Grade: C, first-party experimental blog, not peer reviewed. Accessed 2026-10-08.
[6] OMP contributors. “read.” Bundled documentation, 2026. omp://tools/read.md . Grade: C. Accessed 2026-10-08.
[7] OMP contributors. “grep.” Bundled documentation, 2026. omp://tools/grep.md . Grade: C. Accessed 2026-10-08.
[8] OMP contributors. “glob.” Bundled documentation, 2026. omp://tools/glob.md . Grade: C. Accessed 2026-10-08.
[9] OMP contributors. “find.” Bundled documentation, 2026. omp://tools/find.md . Grade: C. Accessed 2026-10-08.
[10] OMP contributors. “Natives Text/Search Pipeline.” Bundled documentation, 2026. omp://natives-text-search-pipeline.md . Grade: C. Accessed 2026-10-08.
[11] OMP contributors. “lsp.” Bundled documentation, 2026. omp://tools/lsp.md . Grade: C. Accessed 2026-10-08.
[12] OMP contributors. “LSP configuration in OMP.” Bundled documentation, 2026. omp://lsp-config.md . Grade: C. Accessed 2026-10-08.
[13] OMP contributors. “debug.” Bundled documentation, 2026. omp://tools/debug.md . Grade: C. Accessed 2026-10-08.
[14] OMP contributors. “ast_grep.” Bundled documentation, 2026. omp://tools/ast-grep.md . Grade: C. Accessed 2026-10-08.
[15] OMP contributors. “ast_edit.” Bundled documentation, 2026. omp://tools/ast-edit.md . Grade: C. Accessed 2026-10-08.
[16] OMP contributors. “bash.” Bundled documentation, 2026. omp://tools/bash.md . Grade: C. Accessed 2026-10-08.
[17] OMP contributors. “Bash tool runtime.” Bundled documentation, 2026. omp://bash-tool-runtime.md . Grade: C. Accessed 2026-10-08.
[18] OMP contributors. “eval.” Bundled documentation, 2026. omp://tools/eval.md . Grade: C. Accessed 2026-10-08.
[19] OMP contributors. “Eval Tool Python Backend.” Bundled documentation, 2026. omp://python-repl.md . Grade: C. Accessed 2026-10-08.
[20] OMP contributors. “Notebook file runtime internals.” Bundled documentation, 2026. omp://notebook-tool-runtime.md . Grade: C. Accessed 2026-10-08.
[21] OMP contributors. “Browser Eval prelude.” Bundled documentation, 2026. omp://tools/browser.md . Grade: C. Accessed 2026-10-08.
[22] OMP contributors. “computer Eval prelude.” Bundled documentation, 2026. omp://tools/computer.md . Grade: C. Accessed 2026-10-08.
[23] OMP contributors. “Scriptable computer use.” Bundled documentation, 2026. omp://computer-use.md . Grade: C. Accessed 2026-10-08.
[24] OMP contributors. “github.” Bundled documentation, 2026. omp://tools/github.md . Grade: C. Accessed 2026-10-08.
[25] OMP contributors. “web_search.” Bundled documentation, 2026. omp://tools/web_search.md . Grade: C. Accessed 2026-10-08.
[26] OMP contributors. “security_scan.” Bundled documentation, 2026. omp://tools/security_scan.md . Grade: C. Accessed 2026-10-08.
[27] OMP contributors. “generate_image.” Bundled documentation, 2026. omp://tools/generate_image.md . Grade: C. Accessed 2026-10-08.
[28] OMP contributors. “tts.” Bundled documentation, 2026. omp://tools/tts.md . Grade: C. Accessed 2026-10-08.
[29] OMP contributors. “ida.” Bundled documentation, 2026. omp://tools/ida.md . Grade: C. Accessed 2026-10-08.
[30] OMP contributors. “checkpoint.” Bundled documentation, 2026. omp://tools/checkpoint.md . Grade: C. Accessed 2026-10-08.
[31] OMP contributors. “rewind.” Bundled documentation, 2026. omp://tools/rewind.md . Grade: C. Accessed 2026-10-08.
[32] OMP contributors. “todo.” Bundled documentation, 2026. omp://tools/todo.md . Grade: C. Accessed 2026-10-08.
[33] OMP contributors. “ask.” Bundled documentation, 2026. omp://tools/ask.md . Grade: C. Accessed 2026-10-08.
[34] OMP contributors. “Resolution devices runtime.” Bundled documentation, 2026. omp://resolve-tool-runtime.md . Grade: C. Accessed 2026-10-08.
[35] OMP contributors. “Tool approval mode.” Bundled documentation, 2026. omp://approval-mode.md . Grade: C. Accessed 2026-10-08.
[36] OMP contributors. “Vibe mode.” Bundled documentation, 2026. omp://vibe-mode.md . Grade: C. Accessed 2026-10-08.
[37] OMP contributors. “Magic keywords.” Bundled documentation, 2026. omp://magic-keywords.md . Grade: C. Accessed 2026-10-08.
[38] OMP contributors. “Natives Architecture.” Bundled documentation, 2026. omp://natives-architecture.md . Grade: C. Accessed 2026-10-08.
[39] OMP contributors. “Natives Shell, PTY, Process, and Key Internals.” Bundled documentation, 2026. omp://natives-shell-pty-process.md . Grade: C. Accessed 2026-10-08.
[40] OMP contributors. “Settings.” Bundled documentation, 2026. omp://settings.md . Grade: C. Accessed 2026-10-08.
[41] OMP contributors. “Tool setting registrations,” `packages/coding-agent/src/tools/settings.ts`. GitHub main source, 2026. https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/tools/settings.ts . Grade: C. Accessed 2026-10-08.
[42] Anthropic. “Install and manage plugins.” Claude Code documentation, 2026. https://code.claude.com/docs/en/plugins/install (opened via https://code.claude.com/docs/en/discover-plugins). Grade: C. Accessed 2026-10-08.
[43] OpenAI. “Codex Security.” Official documentation, 2026. https://learn.chatgpt.com/docs/security (opened via https://developers.openai.com/codex/security). Grade: C. Accessed 2026-10-08.
[44] OpenAI. “Agent approvals & security.” Official documentation, 2026. https://learn.chatgpt.com/docs/agent-approvals-security . Grade: C. Accessed 2026-10-08.
[45] OMP contributors. “CLI reference.” Bundled documentation, 2026. omp://cli-reference.md . Grade: C. Accessed 2026-10-08.
[46] OMP contributors. “Execution setting registrations,” `packages/coding-agent/src/exec/settings.ts`, `cfgBashEnabled`. GitHub main source, 2026. https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/exec/settings.ts . Grade: C. Accessed 2026-10-08.
