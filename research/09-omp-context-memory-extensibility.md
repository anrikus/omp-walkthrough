# 09 — omp context, memory, sessions, and extensibility
> Slice: OmpContextResearch · Researched 2026-10-08 · Scope: Documentation-grounded feature inventory and safe walkthrough design for the installed omp 18.8.6 research target; no model calls or settings changes.

## Narration-ready takeaways
- “omp separates project instructions, always-carried rules, on-demand skills, and cross-session memory. They are different mechanisms, not four names for the same context.” [2][5][12]
- “Time Traveling Stream Rules can detect a pattern in streamed output, interrupt the attempt, inject a corrective rule, and retry. That is a specific runtime mechanism—not a promise that every mistake is prevented.” [4]
- “Snapcompact can render older conversation text into images locally, instead of asking a language model to summarize it. The next model must support vision, and the archive still has truncation and size limits.” [6]
- “Long-term memory is opt-in. You can choose file-backed local summaries, remote Hindsight, local Mnemopi databases, or the documented Sharpshooter decision-file mode.” [5]
- “Mnemopi's database is local, but its default memory-processing route can use an online model. Local storage and fully offline inference are different promises.” [8][10]
- “The session is a tree: you can revisit a point without deleting the other branch. Forking is a separate operation that creates a new session identity.” [9][11][30]
- “Prewalk is a one-shot model handoff: one model starts the work, then another continues after an eligible edit or write. It is off by default.” [7]
- “Skills supply instructions; tools execute functions; extensions register tools and intercept lifecycle events. Today's hook files normally run through that same extension runtime.” [12][13][14][18]
- “omp is not tied to one model company: its registry combines bundled providers, custom endpoints, local-engine discovery, and extension-registered providers. But provider flexibility is not unique to omp—Codex also documents custom and local providers.” [10][35]
- “Secret obfuscation is disabled by default, and enabling it does not redact every surface. HTML exports can contain raw context, so never record or share a real working session casually.” [23][9]

## Findings

### Evidence boundary, identity, and comparison policy

The official identity chain is concrete: `https://omp.sh/install` redirects to an installer naming `can1357/oh-my-pi` and `@oh-my-pi/pi-coding-agent`; the repository README links back to `omp.sh`, credits Stencil Labs, and identifies the project as a Pi fork. The official v18.8.6 release page is accessible and includes cache-aware pruning and resumed-session fixes. The website's “omp², soon!” is an announcement teaser, not documentation of a released second-generation product. [1][24][25][33]

**Scope of verification:** this is a documentation inspection, not runtime acceptance testing. `omp://` references below were opened through the installed harness's documentation device. Their descriptions are evidence of documented behavior, not independent proof that every path works on this machine. The public README tracks `main`, whereas the release page is version-pinned; do not silently present later README changes as measured v18.8.6 behavior. [25][33]

**Fair current comparison:** Claude Code's current first-party memory guide documents both authored instructions and auto memory, `AGENTS.md` compatibility, imports, path-scoped rules, skills, and hooks as the enforcement alternative to instructions. Codex's current configuration reference documents custom provider namespaces, Ollama/LM Studio selection, automatic compaction, MCP, plugins, and policy controls. Thus the appropriate comparison here is concrete implementation, ergonomics, breadth, and defaults—not “mainstream agents cannot remember or extend themselves.” Both pages were accessed 2026-10-08. [34][35]

**Measured evidence convention:** unless a section explicitly supplies a measurement, no controlled omp-vs-Claude-Code/Codex result for that feature was found in the opened sources. The feature-purpose statements below describe documented mechanisms; benefits marked **[INFERENCE]** are plausible workflow advantages, not demonstrated benchmark gains. [2–23]

**Demo convention:** every demo below is a proposed 20–40 second storyboard, not an executed test. Use diagrams, source excerpts, or a clearly labelled illustrative UI replay. No live prompt, credentials, actual memory mutation, extension execution, upload, or settings change is required. A real product capture can replace an illustration only after a separate approved rehearsal; never label fabricated outputs “actual run.”

### Feature inventory

“On” means documented facility/discovery enabled, not that credentials, a server, a memory bank, or user-authored files magically exist. Defaults are the documentation values accessed 2026-10-08, not a reading of this user's effective configuration. [2][5][10][12][17]

| Feature | One-line purpose | How to invoke / configure | Default | Docs ref |
|---|---|---|---|---|
| Context files | Load project/user instructions | `.omp/AGENTS.md`, standalone `AGENTS.md` / `CLAUDE.md`; inspect `/extensions` | Native/project discovery on; foreign user sources opt-in | [2] `omp://context-files.md` |
| Sticky rules | Carry short hard requirements on each request | Native user/project `RULES.md` | Loaded when present | [2] |
| System customization | Append, replace instruction block, or template it | `APPEND_SYSTEM.md`, `SYSTEM.md`, `SYSTEM_TEMPLATE.md`; corresponding CLI flags | Bundled prompt; customization opt-in | [3] |
| Rulebook / TTSR | On-demand guidance / output-triggered correction | `.omp/rules/*.{md,mdc}`; `condition`, `astCondition`, `question`; `ttsr.*` | TTSR on, builtin rules on; once/discard/always | [4][26] |
| Compaction | Reduce model-visible history | `/compact [instructions]`; `compaction.*` | Enabled | [6] |
| Snapcompact | Image-archive older history | `compaction.methodOrder` includes `snapcompact`; `snapcompact.shape` | Second method after remote; shape `auto` | [6] |
| Cross-session memory | Persist selected knowledge beyond a session | `/settings`; `memory.backend`; `/memory view|stats|diagnose` | `off` | [5][8] |
| retain / recall / reflect | Store, retrieve, and reuse memory | Tool calls, often `xd://` discoverable devices | Available only with Hindsight/Mnemopi | [27–29] |
| memory_edit | Correct/invalidate Mnemopi rows | `memory_edit {op,id,...}`; first read `memory://<id>` | Mnemopi only | [31] |
| learn / manage_skill | Capture lessons / maintain generated procedures | `autolearn.enabled: true`; tool calls | Off | [20][21] |
| Sessions / tree / fork | Persist and branch work | `/tree`, `/branch`, `/fork`, `--resume`, `--continue` | File-backed sessions; auto-resume false | [9][11][30][32] |
| Export / share | Portable session artifact or encrypted snapshot | `/export [path]`, `/dump`, `/share` | Explicit action; share redaction on | [9] |
| Handoff | Commit a focused continuation document | `/handoff [focus instructions]` | Manual or chosen compaction method | [6][22] |
| Plan mode | Separate planning/review from execution | `Alt+Shift+P`; `/plan-review`; `plan.*` | Facility on, startup mode off | [15][16][32] |
| Prewalk | One-shot planner-to-implementer model switch | `/prewalk`, `/prewalk restart`, `/prewalk off`; `--prewalk-into` | Off; target `@smol` | [7] |
| Skills | Load procedural instructions only when relevant | `skill://<name>`; `/skill:<name>` if commands enabled | Discovery unless disabled; command registration gated | [12] |
| Hooks | Event interception | `.omp/hooks/pre|post/*.ts`; `--hook` | Discovered files use extension runner | [13] |
| Extensions | Add commands/tools/events/UI/providers | `--extension path`, `-e`; factory `pi.register...` | Ambient discovery unless disabled | [14][19] |
| Marketplace / plugins | Package and distribute capabilities | `/marketplace`; `omp plugin ...`; `/reload-plugins` | User install scope by default; installation explicit | [17] |
| MCP | Connect external tool/resource/prompt servers | `.omp/mcp.json`; `/mcp add|reload|reconnect` | SDK MCP enabled; instructions true per server | [18][36][37] |
| Custom tools | Execute domain-specific code | `.omp/tools/*.ts|js`; SDK `customTools` | Discovered in unrestricted sessions; no custom implementation by default | [38] |
| SDK / RPC | Embed/control omp from another program | `createAgentSession()`; `omp --mode rpc` | Explicit integration modes | [39][40] |
| TUI / themes / keys | Adapt interaction and presentation | `/hotkeys`; `keybindings.yml`; `/settings` Appearance | Dark `titanium`, light `light`; Vim off | [15][41][42] |
| Providers / local models | Use different inference backends | `--model provider/id`; `/model`; `models.yml`; tiny-model role selection | Availability depends on auth/keyless local discovery | [10][43] |
| Secret handling | Substitute secrets in supported provider text | `secrets.enabled: true`; `secrets.yml` | Off | [23] |
| Live collaboration | Share one running session with people | `/collab view`, `/collab`, `omp join` | Explicit sharing | [44] |

### 1. Context files and sticky instructions

**Behavior and invocation.** Native `.omp/AGENTS.md` is automatically injected as project context. Standalone ancestor `AGENTS.md` and `CLAUDE.md` participate in discovery; foreign user-level sources require `enabledProviders` opt-in. Native project discovery stops at the **nearest non-empty `.omp/`**, even if it lacks `AGENTS.md`; this is not recursive concatenation of every native config directory. One user file and one project file per depth survive priority shadowing. `@path` imports expand relative to the importing file, up to five hops; missing imports remain literal. `/extensions` exposes discovered sources and disable controls. [2]

`RULES.md` is special only at native user/project locations: it becomes always-apply content carried on every request, not a dormant TTSR rule. A nearer native directory can block a farther `RULES.md`; keep this file short. `SYSTEM.md` does not replace context-file discovery. [2][3]

**Problem / fair comparison.** [INFERENCE] This reduces migration work for a team with several instruction-file conventions, but requires understanding shadowing. Claude Code also supports `AGENTS.md`, `CLAUDE.md`, imports and scoped rules; its docs describe concatenation rather than omp's same-depth priority winner. “No supported-subset footnotes” in the omp README is marketing contradicted by its own detailed caveats. [2][33][34]

**Demo (30 s).** Animate a root `AGENTS.md`, package `AGENTS.md`, and package `.omp/AGENTS.md`; label the winner at each depth, then contrast a short `RULES.md` always-carried ribbon. Show the exact discovery table, not an invented “all files loaded” result. [2]

### 2. System-prompt customization

`APPEND_SYSTEM.md` / `--append-system-prompt` adds guidance while retaining the full default prompt. `SYSTEM.md` / `--system-prompt` replaces the default instruction block, but preserves generated skills, rules, secret guidance, project footer, and tool schemas. It removes built-in tool/workflow policy unique to the default template. `SYSTEM_TEMPLATE.md` / `--system-prompt-template <path>` is the raw Handlebars route; its template must explicitly render the in-block sections it wants. Literal CLI and template flags are mutually exclusive. Only SDK `CreateAgentSessionOptions.systemPrompt` can replace every generated block. [3]

**Problem.** [INFERENCE] These routes provide increasing control without forcing every customization to become a fork. That control is not automatically safe: full replacement can omit safety and project context, and a copied rendered `/dump` freezes dynamic tool metadata. No comparative performance measurement is supplied. [3]

**Demo (30 s).** Three cards: “append → keep policy,” “SYSTEM → replace instruction block,” “template → render live fields.” Move a persistent project footer beneath each; finish with an SDK-only full-replacement warning. [3]

### 3. Rulebook and Time Traveling Stream Rules

The rule pipeline normalizes native, Agents, Cursor, Windsurf, Cline, GitHub and built-in sources by rule name. Normal rulebook entries expose guidance through `rule://`; always-apply entries carry their body, whereas TTSR uses trigger metadata. Native regular rule files live at cwd `.omp/rules/*.{md,mdc}` or the active user rules directory. [26]

TTSR defaults: `enabled: true`, `builtinRules: true`, `contextMode: discard`, `interruptMode: always`, `repeatMode: once`, `repeatGap: 10` completed turns, `judge: auto`. Without an explicit scope it monitors assistant text and tool arguments, not thinking. A regex match may abort streamed output, discard the partial assistant attempt, inject a hidden persisted correction, then schedule continuation. AST triggers operate on finalized reconstructed source-bearing tool arguments before execution; they do not analyze every pre-existing line of the eventual file. [4]

Judged `question` rules run **after** completed outputs and never stream-interrupt. `auto` only judges when the role resolves to the documented native System One model; `on` can use the resolved chat model. Failures log and produce no warning. `omp ttsr test` does not call a judge; question rules therefore do not trigger there. `/omfg` can generate rules from a correction, but involves model work and is not a deterministic capture. [4]

**Problem / comparison.** [INFERENCE] Output-triggered corrective context can avoid loading every conditional rule's full body on every initial turn. It does not eliminate matching/retry costs or prove superior instruction adherence. Claude's docs distinguish instruction context from deterministic `PreToolUse` enforcement; TTSR is not a replacement for a security boundary. [4][34]

**Demo (35 s).** Use the documented official `Box::leak` recording/storyboard: source-bearing proposed edit → pattern trigger → rule injection → retry. Clearly distinguish recorded example from guaranteed behavior; annotate “regex streaming,” “AST pre-execution,” and “question post-output” as separate timelines. [4][33]

### 4. Compaction, snapcompact, and handoff

`/compact [instructions]` invokes manual maintenance. Automatic maintenance covers threshold crossing, overflow recovery, incomplete-output recovery, idle work and safe mid-turn boundaries. `compaction.enabled`, `midTurnEnabled`, `asyncEnabled`, and `autoContinue` default true; the documented method order is `remote`, `snapcompact`, `handoff`, `shake`, `soft`, with unsupported/failed methods advancing. `keepRecentTokens` defaults to 20,000. A normal compaction adds a summary entry and keeps a recent tail; it does not simply erase visible scrollback. [6]

**Snapcompact:** local deterministic serialization/rasterization produces model-aware PNG text frames, with chronological plain-text edges. It does not call a summarization model; using the resulting archive in later inference still incurs the reading provider's image costs. Vision support is required. Defaults include an 80-frame upper bound and 2,000-character truncated tool-result serialization; the standing frame-byte budget is 3,000,000 bytes. Later archive rescue can truncate old source text and drop images. Therefore “lossless infinite context” is false. Documentation attributes its shape choices to package 200k-token evaluations, but the opened guide does not supply an independently reviewed end-to-end coding-success result. [6]

**Handoff:** `/handoff [focus]` generates a document through a side request carrying live history/cache context, disables dispatched tools, and commits an ordinary compaction entry **in the same session**. It is not automatically a new agent or new session. At least two message entries and usable uncompacted content are required; the interactive command refuses while streaming. `handoffSaveToDisk` defaults false and only governs automatically triggered handoff artifacts. [6][22]

An additional opt-in `compaction.experimentalContextManagement: true` uses persistent `context_notes`, branch-bound `history://current/full` retrieval and local `new_context` rollover instead of automatic summary recompression. Its notebook cap is 16,384 UTF-8 bytes, and the model remains responsible for useful notes. This should be labelled experimental, not the default snapcompact behavior. [6]

**Problem / comparison.** [INFERENCE] These mechanisms target long-session context pressure and summary latency; they are different tradeoffs, not proof that larger context always helps. Codex also documents automatic compaction. omp's locally rasterized archive is the specific mechanism to explain rather than claiming compaction itself as unique. [6][35]

**Demos (30 s each).** Compaction: animate “old history → summary + recent tail” while scrollback remains visible. Snapcompact: render a clearly synthetic transcript into a bitmap illustration and place “vision required / bounded archive” beside it. Handoff: show the same session ID before and after a focused handoff document becomes a compaction node. No live summarization required. [6][22]

### 5. Memory backends and tools

`memory.backend` has five documented modes: `off`, `local`, `hindsight`, `mnemopi`, `sharpshooter`. Memory defaults off. The local backend extracts persisted sessions and consolidates summaries and procedural playbooks; it injects `Memory Guidance`, with `memory://root`, `MEMORY.md`, `learned.md` and generated skill files. It does **not** expose structured retain/recall/reflect/memory_edit tools. Treat retrieved memory as heuristic evidence, checking current source before acting. [5]

Hindsight requires a reachable server, default `http://localhost:8888`, with optional configured authentication. Its default scoping is `per-project-tagged`: a shared bank with project tags plus global untagged recall. Automatic recall occurs on the primary session's first model turn and automatic retention defaults to every three user turns. `/memory clear` clears local state/cache, **not the remote bank**. Hindsight is a backend integration; the site's “hindsight memory” does not mean enabled by default or built-in hosted storage. [5]

Mnemopi uses local SQLite banks, defaults to `per-project` absolute-cwd-derived isolation, `autoRecall: true`, `autoRetain: true`, retention every four user turns, and eight prompt recalls. Its `llmMode: smol` resolves the memory role and may call an online model; `llmMode: none` disables LLM calls, while `noEmbeddings: true` uses FTS-only recall. Hindsight's Git-primary-root project identity and Mnemopi's absolute-cwd identity differ; linked worktrees therefore must not be assumed to share the same memory scope across backends. [5][8]

Sharpshooter is documented as friction-gated project decision files for architecture/product/style consolidated in the background. The opened overview does not document enough of its invocation beyond backend selection or operational contract to recommend it for the main walkthrough. [5]

| Tool | Precise invocation shape and behavior | Important limit / side effect |
|---|---|---|
| `retain` | `{items:[{content,context?}]}` stores durable facts | Hindsight returns queued, not confirmed; Mnemopi confirms synchronous row writes, not background extraction. [27] |
| `recall` | `{query}` retrieves scoped memories | Mnemopi previews default to 500 characters; read full `memory://<id>` before update. [28] |
| `reflect` | `{query,context?}` reuses retrieved memory | Hindsight returns server synthesis; Mnemopi does recall plus formatting, **no separate synthesis call**. [29] |
| `memory_edit` | `{op:"update"|"forget"|"invalidate",id,content?,...}` | Mnemopi only; updates replace whole content; facts immutable, episodic rows invalidate-only. [31] |
| `learn` | `{memory,context?,skill?}` stores a lesson, optionally generated skill | Requires autolearn plus local/Hindsight/Mnemopi; lesson can succeed before skill write fails. [20] |
| `manage_skill` | `{action:"create"|"update"|"delete",name,description?,body?}` | Autolearn required but independent of memory backend; refreshes active skills after success when callback exists. [21] |

`learn` does not refresh the current skill listing; `manage_skill` does. Managed skills never override authored skills and are capped at 64,000 UTF-8 bytes including generated frontmatter. Local lessons are deduplicated, newest-first, capped at 100, and injected beginning with a later session. Mnemopi shutdown has a limited drain window, so `/memory enqueue` is the stronger retention/extraction boundary, but still respects consolidation age gates. [5][8][20][21]

**Problem / comparison.** [INFERENCE] Memory can reduce re-explanation of prior decisions, but stored mistakes and stale facts can also mislead. Claude Code already documents auto memory and subagent memory; the differentiating story is selectable backend semantics and explicit curation, not “Claude forgets everything.” No reviewed omp-specific memory uplift is established here. [5][8][34]

**Demos (20–35 s each).** Overview: show backend switch as a diagram, never toggle real settings. Retain/recall: a synthetic “fixture uses UTC” fact travels into a project bank and back with an ID. Reflect: contrast Hindsight synthesis with Mnemopi's formatted hits. Edit: expand a clipped preview before a wholesale replacement illustration. Learn: separate fact capture from generated playbook; show authored skills winning. Each mutation is a labelled storyboard, not a real write. [5][8][20][21][27–31]

### 6. Session lifecycle, navigation, export, and live sharing

File-backed sessions live by default under `~/.omp/agent/sessions/<encoded-cwd>/...jsonl`. Entries carry parent pointers; active model context follows the leaf's ancestry. Ordinary branching preserves old entries; targeted destructive rewrite helpers and pruning are separate, so avoid saying the entire system is absolutely immutable. `/tree` is same-file navigation, `/branch`/`/rewind` opens transcript rewind, and `/fork` creates a new identity/file in persistent mode. Selecting a user message rewinds to its parent and can restore its draft. [9][11][30]

`--resume [id|path]`, `--continue`, `/resume`, and `/fork` address different restart/reuse needs. `/new` creates a new conversation identity; `/clear` clears live context while preserving the file/history via a reset boundary; `/fresh` refreshes provider-facing state without creating a new session file. Foreign Claude/Codex session imports are documented CLI routes, not evidence of byte-for-byte semantic equivalence. [9][19]

`/export` writes HTML including historical entries; `/dump` describes current live context and can write a raw temporary request sidecar. Both can expose sensitive content. Default `/share` produces a redacted, gzipped AES-256-GCM snapshot, puts its key in the URL fragment, and uploads to a share server (or configured gist route); size reduction can remove images, shorten text, and drop old entries. Custom TUI share handlers receive ordinary unredacted HTML and define their own privacy behavior. [9]

`/collab` is **human live-session sharing, not mixture-of-agents orchestration**: guests see one session, while host tools execute on the host. `/collab view` exposes read-only access; full-control guests can prompt and interrupt. Do not record an actual join key. [44]

**Problem.** [INFERENCE] Tree navigation supports exploring alternatives without manually copying transcripts; export and collaboration support review/handoff. These are specific semantics, not an established absence of session management elsewhere. [9][11][44]

**Demos (30 s each).** Tree: branch A/B diagram with active-path highlighting and one restored draft. Lifecycle: four labelled cards `new/clear/fresh/fork`, retaining or replacing identity as appropriate. Export/share: synthetic export vs encrypted envelope; blur/omit any join URL and annotate truncation. Collab: host/viewer diagram with a locked input box; do not initiate a relay connection. [9][11][44]

### 7. Plan mode and prewalk

Plan mode is available by default (`plan.enabled: true`) but fresh sessions do not enter it automatically (`plan.defaultOnStartup: false`). Toggle with `Alt+Shift+P`. `/plan-review` reopens the latest plan in plan mode; its review UI supports section/line annotations and undo. `--plan <id>` selects a **model role**, not a boolean switch that enters plan mode. `--plan-yolo` explicitly starts a read-only planning flow, auto-approves the model's proposal, then implements with the target role; do not use this auto-approval path as the safety demo. [15][16][19][32]

Prewalk is separate: `/prewalk` arms a one-shot switch to current `@smol`; `--prewalk-into <model-or-role>` chooses a target. If todo is active, any successful todo call opens the gate; the first eligible edit/write-result turn triggers switching at its completed assistant-turn boundary—even an unsuccessful edit result can trigger it. Read-only `xd://` requests routed through `write` do not count as workspace edits. `/prewalk off` cancels the pending switch; `/prewalk restart` returns to current `@default` and re-arms `@smol`. Settings-based startup arming does not automatically re-arm resumed sessions. [7]

**Problem.** [INFERENCE] Planning offers a review boundary; prewalk attempts cost/latency specialization by changing models after the first implementation activity. No measured savings or quality guarantee for this policy is supplied in the opened guide. “The expensive model only plans and never edits” is specifically wrong. [7][19]

**Demos (30 s each).** Plan: show the documented shortcut and review annotations over a synthetic plan, stopping before approval. Prewalk: animate todo gate → first edit result → completed-turn boundary → model badge switch; keep cost figures absent unless a separate measured run exists. [7][15][16]

### 8. Skills, hooks, extensions, plugins, and custom tools

Skills are metadata-first instruction packs loaded through `skill://`, conventionally `<skills-root>/<name>/SKILL.md` one level down; nested `group/name/SKILL.md` is not discovered by ordinary scanners. A `/skill:<name>` invocation injects content when skill commands are enabled. Frontmatter `globs`/`alwaysApply` on skills is metadata, not automatic invocation enforcement. Descriptions matter for selection. [12]

Hooks and extensions must not be taught as independent modern runtimes: CLI `--hook` aliases `--extension`, discovered TS/JS factories bind extension events, and new integrations should use `ExtensionAPI`. Native ambient hooks must be in `hooks/pre/` or `hooks/post/`, not directly under `hooks/`. Extensions can register commands, tools, shortcuts, providers, renderers and lifecycle handlers; calling session actions during module load fails, while executable code such as `pi.exec` can already run. Treat loading one as executing trusted code. [13][14]

Custom tools supply an executable factory and schema, either through SDK `customTools` or discovery under `.omp/tools` and other permitted sources. They share the execution pipeline; unrestricted and restricted tool sets behave differently. A skill can describe a procedure but is not itself a callable function. [38]

Marketplaces support Git/local/direct catalogs with preferred `.omp-plugin/marketplace.json` and Claude-compatible fallback. Plugins can bundle skills, commands, agents, rules, hooks, tools, MCP/LSP/DAP definitions and extension entrypoints. User scope is default; project installs can shadow user installs. `/reload-plugins` refreshes only selected capability sets; newly installed non-MCP tools, hooks and extension modules require restarting the session. Compatibility does not imply “every third-party plugin works unchanged.” [17]

**Problem / comparison.** [INFERENCE] These layers let teams evolve a workflow without modifying the core, reuse existing packs, and keep rarely needed instructions out of the initial context. Current Claude/Codex documentation also exposes extension mechanisms; avoid exclusive claims. Runtime executable extensions introduce a different trust surface from static skills. [12–14][17][34][35][38]

**Demos (20–30 s each).** Skill: metadata card expands into a playbook on demand. Hook: highlight a `tool_call` event handler and a blocked fictional command—do not execute a destructive command. Extension: show the documented `hello-ext` registration and static output design. Custom tool: schema → deterministic function → result card. Marketplace: local catalog → plugin contents → reload-versus-restart legend; no installation or network fetch. [12–14][17][38]

### 9. MCP configuration, runtime, and authoring

Prefer project `.omp/mcp.json` or active-profile user `mcp.json`. Imported configurations include Claude, Codex, Gemini, OpenCode, Cursor, Windsurf, VS Code and plugins, with documented precedence rather than universal merge semantics. Transport definitions support `stdio`, Streamable `http`, and legacy `sse`; use explicit types because writer and discovery inference differ. `/mcp add`, `/mcp reload`, and `/mcp reconnect` manage the lifecycle. [18][36][37]

The runtime connects/list-tools in parallel and has a 250 ms initial gate; cached deferred tool definitions or later registration permit slow servers to finish asynchronously. Print mode additionally waits for configured readiness/failure up to its timeout and has a fail-fast `OMP_MCP_REQUIRE_READY=1` option. Individual server failures do not necessarily fail the whole agent. Server instructions default on, are labelled server-controlled/unverified, and can be disabled with per-server `instructions: false`; this does not remove its tools. [18][36][37]

Authoring contract: MCP tools become `mcp__<server>_<tool>` via the bridge; validation checks transport structure, not reachability. Names/equivalent connections are deduplicated, and resources/prompts load best-effort after tool discovery. This guide explains how to expose a server to omp, not a replacement for implementing a standards-conformant server SDK. [37]

**Problem / comparison.** [INFERENCE] MCP brings external capabilities into the same agent, and late registration addresses startup blocking. Codex also documents MCP, so protocol support is not unique. Server-owned instructions are an additional prompt trust surface, not authoritative user policy. [18][35–37]

**Demo (35 s).** A fake localhost definition with `instructions:false` flows through discovery → initialize → tools/list → registry. Animate one fast and one late server on the 250 ms timeline; no process is actually launched. [18][36][37]

### 10. SDK and RPC

The Bun SDK exposes `createAgentSession`, session state/events, tool wiring and control; import `SessionManager`, `AuthStorage`, and `ModelRegistry` from the package root, not the narrower `/sdk` path. Default construction discovers and enables several capabilities, so an embedder should explicitly isolate settings, auth, registries and storage rather than treating the minimal example as hermetic. [39]

`omp --mode rpc` is a custom newline-delimited JSON protocol over stdio, **not JSON-RPC 2.0**. It sends a ready frame, command responses and events; protocol v2 negotiation enables lossless chunking within documented limits. MCP and RPC therefore are not interchangeable wire protocols. RPC disables automatic title generation, but issuing a model prompt still invokes inference. [40]

**Problem.** [INFERENCE] SDK supports direct Bun embedding; RPC supports other languages/process boundaries without reverse-engineering terminal output. No comparative host-integration measurement is supplied. [39][40]

**Demo (30 s).** Split-screen static TypeScript `createAgentSession` lifecycle and JSONL `ready → negotiate_protocol → response` example; highlight no `session.prompt` is executed. [39][40]

### 11. TUI, themes, and keybindings

The TUI separates differential rendering from session integration. Extensions can mount custom components in an interactive overlay; headless UI and RPC component mounting have different contracts, so `hasUI` alone does not guarantee arbitrary components work. `/hotkeys` shows current remapped application shortcuts. User remaps live in separate `keybindings.yml`, not a nested config object; named profiles inherit then override. Vim editing is an optional subset, off by default. [15][42]

Theme defaults are dark `titanium`, light `light`, `symbolPreset: unicode`, and `colorBlindMode: false`; terminal appearance selects the slot. Custom JSON themes live under active agent `themes/`, and settings Appearance selects dark/light themes. A supplied remap or theme is not required to use the TUI. [41]

**Problem.** [INFERENCE] This supports readable filming and familiar interaction rather than a demonstrated coding-quality gain. Remapped keys and terminal interception mean hardcoded shortcut captions should be checked in the eventual capture environment. [15][41]

**Demo (25 s).** A labelled replay opens `/hotkeys`, points at plan and model shortcuts, then shows two theme previews. Use high contrast and avoid any real session's title, directory or account footer. [15][41]

### 12. Provider breadth, local inference, and secrets

**Count with an explicit denominator:** manual counting of the opened `providers.md` credential tables gives **79 distinct provider IDs**: 14 Core rows plus 65 IDs across 63 Additional-hosted rows (the GitLab and OpenCode rows each contain two IDs). This is a researcher count, not a quoted total, and includes local-engine rows in that second table. Additional prose names OAuth-only IDs and the Apple bridge; the separate local catalog serves tiny/speech workloads. Therefore 79 is a table count, **not the exhaustive number of supported providers**, not model count, and not a count of independent model manufacturers. The README's “60+ providers” is a first-party headline consistent with a lower bound, accessed 2026-10-08. [10][33][43]

The registry combines bundled catalog, `models.yml`, cached/runtime discovery, and extension registrations. Select with `--model provider/id` or `/model`; availability checks configuration, not key validity. Ollama, llama.cpp and LM Studio have implicit local discovery; an Apple Foundation Models bridge is conditional on supported hardware/runtime eligibility and is not auto-selected because its window may be too small. Provider-specific endpoint capabilities still matter: “model-agnostic” does not mean every model supports every tool, image or compaction path. Codex also documents custom providers and `--oss` local selection. [10][35]

For local auxiliary inference, configure roles such as `modelRoles.tiny: local/lfm2.5-230m` and explicit empty fallback chains where applicable. Local title selection is an explicit no-billing boundary: failure leaves the session untitled rather than silently calling an online title model. Tiny models default CPU/q4; MLX is opt-in on Apple silicon. These small-model measurements concern title/memory subtasks, not whole-repository coding performance. [43]

Secret obfuscation replaces supported message/replay text with reversible placeholders and restores tool arguments before execution. `secrets.enabled` defaults false; custom definitions go in user/project `secrets.yml`. Static system prompts, static tool definitions, binaries and opaque encrypted replay are outside its redaction boundary. Provider auth storage is separately documented in `agent.db`; runtime `--api-key` overrides are not persisted. “Keeps all secrets away from all models” is not supported. [10][23]

**Problem.** [INFERENCE] Breadth permits selecting a vendor or local endpoint for a workload, while selective obfuscation reduces some accidental textual disclosure. Neither establishes compliance, complete offline operation, or perfect credential security. [10][23][43]

**Demos (30 s each).** Providers: pan across grouped provider IDs, with “79 IDs in these tables—not 79 model makers.” Local: separate on-device title worker from main coding model. Secrets: use obvious fake `DEMO_PASSWORD_NOT_REAL` in a diagram and show protected message text versus excluded static-prompt/image lanes; never open auth files or dump a real request. [10][23][43]

### Recommended walkthrough order

This order is an editorial recommendation **[INFERENCE]**, chosen to introduce information boundaries before mechanisms that persist, transform, or share that information. [2–23]

1. Provider/model distinction and a clean TUI: establish harness versus model, without a “Codex is locked to OpenAI” strawman. [10][15][35]
2. Context files → sticky rules → prompt customization: establish what instructions enter initially and what remains carried. [2][3]
3. Skills → rulebook → TTSR: contrast requested knowledge with runtime correction. [4][12][26]
4. Plan review → prewalk: distinguish user approval from automated model switching. [7][15][16][19]
5. Session tree/fork/resume → compaction → snapcompact → handoff: show durable transcript versus model-visible context. [6][9][11][22]
6. Memory backends → retain/recall/edit → learn/manage_skill: cross the session boundary only after explaining within-session persistence. [5][8][20][21][27–31]
7. Custom tools → extensions/hooks → plugins → MCP → SDK/RPC: progress from one callable function to integration architecture. [13][14][17][18][36–40]
8. Secrets → export/share → read-only collab: explain disclosure boundaries before the “share” call to action. [9][23][44]

### omp.sh / README claim audit

| Claim | Audit conclusion |
|---|---|
| “hindsight memory” | Substantiated as an optional remote backend integration, not default memory or guaranteed hosted service. [1][5] |
| “time-traveling rules” | Substantiated as TTSR interruption/injection/retry; questions are post-output and defaults suppress repeats. [1][4] |
| “plan mode” | Substantiated by settings, shortcut, review and plan-yolo docs; startup is off. [1][15][16][19][32] |
| “snapcompact” metadata keyword | Documented local image archival with vision and budget constraints; not lossless/unlimited memory. [1][6] |
| Broad model logos / README “60+” | Substantiated breadth via provider tables and local discovery; compatibility varies by endpoint. [1][10][33] |
| “every tool tuned against real sessions” / “most capable” | Marketing language; no universal comparative evaluation established by this slice. [1][33] |
| “no supported subset footnotes” for other tools' configuration | Too broad: docs explicitly describe opt-ins, shadowing, nonrecursive skills and transport-field differences. [2][12][18][33] |
| “the agent remembers ... retain ... learn ... recall” | Conditional: backend off by default; local backend lacks that structured tool set; learn additionally requires autolearn. [5][20][27–29][33] |
| “injections survive compaction, so the fix sticks” | Persistence/suppression state is documented; this does not prove the model always obeys a correction thereafter. [4][33] |
| “omp², soon!” | Teaser substantiated, released feature set not established. [1] |
| IDE/Rust/LSP/DAP/hashline/subagent claims | Outside this slice's substantiation remit; use the tools and multi-agent dossiers, not this inventory as proof. [1] |

## Key numbers

| Claim/metric | Value | Conditions (model, harness, benchmark/version, date) | Source [n] (location) | Grade |
|---|---|---|---|---|
| Provider table count | 79 distinct IDs, manually counted | Opened provider credential tables, as of 2026-10-08; 14 + 65, grouped rows split; not exhaustive support total | [10] Core / Additional hosted tables | C, researcher count |
| README provider headline | “60+” | `main` README as of 2026-10-08; lower-bound marketing count | [33] introduction | C |
| Memory backend modes | 5 including off | off/local/hindsight/mnemopi/sharpshooter, documentation as of 2026-10-08 | [5] opening table | C |
| Hindsight / Mnemopi default retention cadence | 3 / 4 user turns | Only after selecting corresponding backend; not durability guarantees | [5] Hindsight; [8] settings | C |
| Local memory injection cap | 5000 approximate tokens | Summary and learned lessons share budget | [5] configuration | C |
| Mnemopi recall preview cap | 500 characters | Explicit recall uses default preview; full row separate | [28] outputs | C |
| Managed skill limit | 64,000 UTF-8 bytes | Includes generated frontmatter | [21] limits | C |
| Snapcompact frame bound | 80 frames | Upper bound; context/provider/3,000,000-byte budgets can reduce it | [6] Snapcompact method | C |
| Snapcompact tool-result cap | 2,000 characters | Default per serialized result; head ratio 0.6 | [6] Snapcompact method | C |
| Recent history retained | 20,000 tokens | `compaction.keepRecentTokens` default | [6] Settings and defaults | C |
| TTSR repeat gap | 10 completed turns | Only relevant to after-gap; default repeat mode is once | [4] settings/repeat policy | C |
| MCP initial gate | 250 ms | Deferred/later tool discovery; not a connection-speed benchmark | [36] Fast startup gate | C |
| Default MCP request deadline | 30,000 ms | Env/per-server override; zero disables | [37] server fields | C |
| Local title benchmark | LFM2.5-230M warm mean / p95: 93 / 194 ms; 3–7 words: 21/28 | Doc calls test 30 recent first-session prompts, q4 CPU, no examples; row denominator differs; hardware/date/CI not specified for this table | [43] Task 1 replacement benchmark | C, first-party experiment |
| Local title alternatives | Falcon-H1-Tiny-90M 117 / 174 ms, 17/29; LFM2.5-350M 166 / 266 ms, 4/30 | Same table conditions; do not hide denominator discrepancies | [43] Task 1 replacement benchmark | C, first-party experiment |
| Local memory prompt experiment | Qwen2.5-1.5B extraction F1 0.52 → 0.83, 1 → 3 shots | q4 CPU memory-task experiments; evaluation definition/date/CI not fully given | [43] Technique polarity flips | C, first-party experiment |

No A/B-grade evidence in this slice demonstrates that omp's particular context/memory/extensibility bundle improves coding benchmarks over current Claude Code or Codex. The numbers above are defaults, limits, scoped first-party experiments, or explicitly counted inventory—not a leaderboard. [4–10][21][28][36][37][43]

## Contested or uncertain

- **Memory summary versus detailed tools:** `reflect` sounds synthesizing in high-level descriptions, but the Mnemopi tool implementation guide specifies recall plus formatting, not a synthesis model. Narrate the backend distinction. [8][29]
- **Local does not imply offline:** Mnemopi stores locally but default memory-role processing can go online; tiny-model roles and fallback chains must be deliberate. [8][43]
- **Irreversibility and persistence:** tree branching preserves branches, but pruning/destructive helpers exist; Hindsight queue acknowledgement is not remote persistence acknowledgement; Mnemopi shutdown may end before all derived work completes. [6][8][27][30]
- **Research limitations:** snapcompact cites package 200k-token QA evaluations, but the opened guide does not report enough controlled result detail to narrate a universal compression/accuracy multiplier. Local title benchmark row denominators differ from its 30-prompt description. [6][43]
- **Documentation surfaces evolve:** public README is `main`; bundled documentation is reported as current by its device, not independently checked against every source file in release `f068751`. Treat detailed features as documentation-grounded and test intended captures separately. [25][33]
- **Security is conditional:** current secret obfuscation omits important surfaces and is off by default; encrypted sharing does not make the recipient untrusted-safe once they have the key. The latter is **[INFERENCE]** from the documented link-decryption design. [9][23]

## Corrections & nuances to the blueprint

- Do not sell context files, skills, auto memory, MCP, or provider customization as categorically absent in mainstream harnesses today. Current first-party documentation contradicts that frame. [34][35]
- Separate “harness feature exists” from “research demonstrates improved performance”; this inventory establishes the former and only narrow local-model subtask measurements. [6][43]
- “Time travel” is a metaphor for correcting a streamed attempt, not undoing arbitrary external effects or guaranteeing compliance. Judged rules cannot interrupt. [4]
- `--plan` selects the plan model; prewalk can start implementation before switching; handoff compacts within the same session; `/tree` does not fork a new file. [7][11][19][22]
- “Memory” covers five modes including off, not one always-on feature; `learn` and `manage_skill` have different backend prerequisites and refresh semantics. [5][20][21]
- Collab belongs to human collaboration/session sharing, not mixture-of-agents architecture. [44]

## Open questions for the user

1. Should the video use only real rehearsed captures, or may clearly labelled mechanism animations illustrate model-dependent behavior such as TTSR, prewalk, and handoff?
2. Which memory story should lead: privacy-oriented local storage, a completely offline FTS-only setup, or a separately hosted Hindsight service? These choices change what can honestly be demonstrated.
3. Is the audience an everyday coding-agent user or a harness integrator? SDK/RPC and extension authoring warrant an appendix for the former and a full segment for the latter.
4. May a later capture stage create a disposable demonstration profile and fixture repository? This research did not do so or modify existing settings.
5. Should “model-agnosticism” be framed as breadth and first-class integration rather than exclusivity? Current Codex documentation makes an exclusivity claim indefensible. [35]

## Unverified leads

- Full independently reproducible snapcompact evaluation tables, run counts, confidence intervals and release-pinned QA results were not opened; do not use a compression or correctness multiplier from hearsay. [6]
- Sharpshooter's complete operational lifecycle and recommendation quality are not established by its overview row. [5]
- Plan mode's exhaustive tool allowlist and sandbox-enforcement guarantees were not established from the opened material; do not claim that the documented read-only planning flow is an OS security sandbox. [19]
- No runtime smoke tests, external model requests, memory writes, plugin installations, uploads, or TUI captures were performed in this slice.

## Visual ideas

- **Context-layer diagram:** static prompt → project footer → always-carried rules → skill metadata → on-demand contents; use the distinctions and precedence from [2][3][12].
- **Three TTSR timelines:** regex streaming interruption, AST pre-execution gate, question post-output feedback. Do not collapse them into a single “mid-token judge” animation. [4]
- **Dual timeline:** persistent session-tree scrollback above, shortened model input below; snapcompact's bitmap middle and plain edges are an alternate lower track. [6][11]
- **Backend capability matrix:** local vs Hindsight vs Mnemopi, with retain/recall/reflect/edit/learn rows and off-by-default badge. Sharpshooter stays a documented-but-not-demonstrated optional column. [5][8][20][27–31]
- **Provider-count card:** 79 distinct table IDs, visually grouped as model vendors/gateways/subscription routes/local servers, labelled researcher-counted as of access date—not 79 independently trained models. [10]
- **Trust-boundary diagram:** static instructions, executable extensions, remote MCP instructions, obfuscated provider text, raw HTML export, encrypted share. [3][9][14][18][23]
- **Local title chart:** plot exact mean/p95 pairs from Key numbers, with q4 CPU and denominator warnings visibly attached; never title it “omp coding speed.” [43]

## References

All `omp://` references are first-party bundled documentation opened in this session. They are Grade C implementation/documentation evidence, not peer-reviewed research. Publication year is listed as n.d. where the opened page does not state one; access date is not substituted for publication date.

[1] Stencil Labs. “omp — a coding agent with the IDE wired in.” Official website, n.d. https://omp.sh/ . Grade: C. Accessed 2026-10-08.
[2] omp maintainers. “Context files.” Bundled documentation, n.d. omp://context-files.md . Grade: C. Accessed 2026-10-08.
[3] omp maintainers. “System Prompt Customization.” Bundled documentation, n.d. omp://system-prompt-customization.md . Grade: C. Accessed 2026-10-08.
[4] omp maintainers. “TTSR Injection Lifecycle.” Bundled documentation, n.d. omp://ttsr-injection-lifecycle.md . Grade: C. Accessed 2026-10-08.
[5] omp maintainers. “Autonomous Memory.” Bundled documentation, n.d. omp://memory.md . Grade: C. Accessed 2026-10-08.
[6] omp maintainers. “Compaction and Branch Summaries.” Bundled documentation, n.d. omp://compaction.md . Grade: C. Accessed 2026-10-08.
[7] omp maintainers. “Prewalk.” Bundled documentation, n.d. omp://prewalk.md . Grade: C. Accessed 2026-10-08.
[8] omp maintainers. “Mnemopi memory backend.” Bundled documentation, n.d. omp://mnemosyne-memory-backend.md . Grade: C. Accessed 2026-10-08.
[9] omp maintainers. “Session Operations: export, dump, share, fresh, clear, fork, resume/continue.” Bundled documentation, n.d. omp://session-operations-export-share-fork-resume.md . Grade: C. Accessed 2026-10-08.
[10] omp maintainers. “Providers.” Bundled documentation, n.d. omp://providers.md . Grade: C. Accessed 2026-10-08.
[11] omp maintainers. “/tree Command Reference.” Bundled documentation, n.d. omp://tree.md . Grade: C. Accessed 2026-10-08.
[12] omp maintainers. “Skills.” Bundled documentation, n.d. omp://skills.md . Grade: C. Accessed 2026-10-08.
[13] omp maintainers. “Hooks.” Bundled documentation, n.d. omp://hooks.md . Grade: C. Accessed 2026-10-08.
[14] omp maintainers. “Extensions.” Bundled documentation, n.d. omp://extensions.md . Grade: C. Accessed 2026-10-08.
[15] omp maintainers. “Keybindings.” Bundled documentation, n.d. omp://keybindings.md . Grade: C. Accessed 2026-10-08.
[16] omp maintainers. “Slash command internals,” §13 /plan-review. Bundled documentation, n.d. omp://slash-command-internals.md . Grade: C. Accessed 2026-10-08.
[17] omp maintainers. “Marketplace plugin system.” Bundled documentation, n.d. omp://marketplace.md . Grade: C. Accessed 2026-10-08.
[18] omp maintainers. “MCP configuration in OMP.” Bundled documentation, n.d. omp://mcp-config.md . Grade: C. Accessed 2026-10-08.
[19] omp maintainers. “CLI reference.” Bundled documentation, n.d. omp://cli-reference.md . Grade: C. Accessed 2026-10-08.
[20] omp maintainers. “learn.” Bundled tool documentation, n.d. omp://tools/learn.md . Grade: C. Accessed 2026-10-08.
[21] omp maintainers. “manage_skill.” Bundled tool documentation, n.d. omp://tools/manage_skill.md . Grade: C. Accessed 2026-10-08.
[22] omp maintainers. “/handoff generation pipeline.” Bundled documentation, n.d. omp://handoff-generation-pipeline.md . Grade: C. Accessed 2026-10-08.
[23] omp maintainers. “Secret Obfuscation.” Bundled documentation, n.d. omp://secrets.md . Grade: C. Accessed 2026-10-08.
[24] omp maintainers. “OMP Coding Agent Installer.” Official source script, n.d. https://omp.sh/install → https://raw.githubusercontent.com/can1357/oh-my-pi/main/scripts/install.sh . Grade: C. Accessed 2026-10-08.
[25] omp maintainers. “Release v18.8.6.” GitHub Releases, 2026. https://github.com/can1357/oh-my-pi/releases/tag/v18.8.6 (commit f068751e2f1dbdbc195977776d47a26db8697495). Grade: C. Accessed 2026-10-08.
[26] omp maintainers. “Rulebook Matching Pipeline.” Bundled documentation, n.d. omp://rulebook-matching-pipeline.md . Grade: C. Accessed 2026-10-08.
[27] omp maintainers. “retain.” Bundled tool documentation, n.d. omp://tools/retain.md . Grade: C. Accessed 2026-10-08.
[28] omp maintainers. “recall.” Bundled tool documentation, n.d. omp://tools/recall.md . Grade: C. Accessed 2026-10-08.
[29] omp maintainers. “reflect.” Bundled tool documentation, n.d. omp://tools/reflect.md . Grade: C. Accessed 2026-10-08.
[30] omp maintainers. “Session Storage and Entry Model.” Bundled documentation, n.d. omp://session.md . Grade: C. Accessed 2026-10-08.
[31] omp maintainers. “memory_edit.” Bundled tool documentation, n.d. omp://tools/memory_edit.md . Grade: C. Accessed 2026-10-08.
[32] omp maintainers. “Settings,” Interaction. Bundled documentation, n.d. omp://settings.md . Grade: C. Accessed 2026-10-08.
[33] Stencil Labs / omp maintainers. “oh-my-pi README.” Official GitHub repository, n.d. https://raw.githubusercontent.com/can1357/oh-my-pi/main/README.md . Grade: C. Accessed 2026-10-08.
[34] Anthropic. “How Claude remembers your project.” Claude Code documentation, n.d. https://code.claude.com/docs/en/memory (opened Markdown alternate https://code.claude.com/docs/en/memory.md). Grade: C. Accessed 2026-10-08.
[35] OpenAI. “Configuration Reference.” Codex documentation, n.d. https://developers.openai.com/codex/config-reference (redirected to https://learn.chatgpt.com/docs/config-file/config-reference). Grade: C. Accessed 2026-10-08.
[36] omp maintainers. “MCP runtime lifecycle.” Bundled documentation, n.d. omp://mcp-runtime-lifecycle.md . Grade: C. Accessed 2026-10-08.
[37] omp maintainers. “MCP server and tool authoring.” Bundled documentation, n.d. omp://mcp-server-tool-authoring.md . Grade: C. Accessed 2026-10-08.
[38] omp maintainers. “Custom Tools.” Bundled documentation, n.d. omp://custom-tools.md . Grade: C. Accessed 2026-10-08.
[39] omp maintainers. “SDK.” Bundled documentation, n.d. omp://sdk.md . Grade: C. Accessed 2026-10-08.
[40] omp maintainers. “RPC Protocol Reference.” Bundled documentation, n.d. omp://rpc.md . Grade: C. Accessed 2026-10-08.
[41] omp maintainers. “Theming Reference.” Bundled documentation, n.d. omp://theme.md . Grade: C. Accessed 2026-10-08.
[42] omp maintainers. “TUI integration for extensions and custom tools.” Bundled documentation, n.d. omp://tui.md . Grade: C. Accessed 2026-10-08.
[43] omp maintainers. “Local Model Catalog and Experiments.” Bundled documentation, n.d. omp://local-models.md . Grade: C. Accessed 2026-10-08.
[44] omp maintainers. “Collab: Live Session Sharing.” Bundled documentation, n.d. omp://collab.md . Grade: C. Accessed 2026-10-08.
