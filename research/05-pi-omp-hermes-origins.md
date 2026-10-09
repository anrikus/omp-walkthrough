# 05 — Pi, omp, Hermes Agent, and OpenClaw: origins and design philosophies
> Slice: AltHarnessOriginsResearch · Researched 2026-10-08 · Scope: Creators, motivations, lineage, releases, architecture, licensing, and a dated 2025–2026 timeline.

## Narration-ready takeaways

- Mario Zechner built Pi because he wanted direct control over the model’s context, inspectable interactions, and a predictable tool—not because he wanted the longest feature list. His November 2025 explanation was: “if I don't need it, it won't be built.” [1]
- Pi’s original recipe was four default tools—read, write, edit, and bash—with the system prompt and tool definitions together below 1,000 tokens. Those are the creator’s November 2025 figures, not a measurement of today’s configurable Pi installation. [1]
- Pi’s philosophy evolved: despite its original rejection of built-in MCP, its September 29, 2026 release added MCP, tool search, and JavaScript codemode as built-in extensions. Historical descriptions of Pi as having “no MCP” are now out of date. [1][7][8]
- Oh-my-pi is explicitly a fork of Pi, led by Can Bölük and built by Stencil Labs. Where Pi emphasizes an extensible minimal harness, omp advertises an integrated coding environment with language servers, a debugger, hash-anchored editing, memory, and first-class subagents. [12][14][15][16][21]
- Bölük’s central argument is that a model’s ability to solve a task can be obscured by the interface it must use to express a change. His hashline experiment changed the edit format rather than training new model weights—but its results are a creator-run editing benchmark, not proof of universal coding superiority. [18]
- The “omp², soon!” banner has a documented meaning: a replacement architecture described in September 2026’s *The Harness Playbook*. The author explicitly distinguishes work already built from work still being designed. [21][22]
- Nous Research’s official release index dates Hermes Agent to February 25, 2026. Its ambition is “the agent that grows with you”: retaining useful facts, creating reusable skills, and carrying that knowledge across terminal and messaging interactions. [23][24][25][26][27]
- Hermes Agent is not another name for the Hermes language models. The agent is model-agnostic application software; Hermes 4 is a separately trained family of model weights from the same research organization. [24][25][31]
- OpenClaw connects this story to personal assistants: Peter Steinberger built an assistant that lives on the user’s devices and in their chats, and Pi’s own README presents OpenClaw as an integration example. Today’s OpenClaw documentation says its agent runtime is now OpenClaw-owned, while Pi’s terminal UI library remains a dependency. [4][32][35]
- These are not four rungs on a single ladder. They emphasize different things—customization, integrated developer tooling, persistent learning, and personal-assistant connectivity—and all four publish their core repositories under the MIT license. [4][5][12][15][23][24][30][32][36]

## Findings

### Evidence and date discipline

This slice primarily uses **Grade C evidence**: creator statements, official documentation, release records, and published package artifacts. Those sources establish what creators intended and what projects document; their product claims and creator-run benchmarks are not independent demonstrations of effectiveness. The one Grade B research report below concerns **Hermes 4 model training**, not a controlled evaluation of Hermes Agent’s memory or skill-learning system. [1][18][22][24][31]

“Created,” “first package publication,” “announcement,” and “latest release” are kept separate. In particular, a GitHub repository creation timestamp does not establish when its code first became public, and a surviving package-version list cannot rule out earlier unpublished or removed versions. [2][13]

### Pi — Mario Zechner’s controllable, minimal harness

**Who and canonical identity.** Mario Zechner is the creator: his own essay describes building Pi, and the license names him. The historical repository URL `github.com/badlogic/pi-mono` now resolves to `github.com/earendil-works/pi`; the current README links `pi.dev` and installs the `@earendil-works/pi-coding-agent` package. The old `@mariozechner/pi-coding-agent` npm page explicitly tells users to move to the Earendil scope, as of 2026-10-08. [1][2][4][5]

**When.** The earliest surviving publication in the old CLI package’s npm version list is **0.6.2**, with Unix-millisecond timestamp **1762987475139**, converted here to **2025-11-12T22:44:35.139Z**. This is a verified earliest-listed *CLI package release*, not a claim that the whole toolkit originated that day. The archived package changelog begins at **0.7.6, 2025-11-13**, and says “Previous releases did not maintain a changelog.” The canonical motivation essay is dated **2025-11-30**, and contains a later benchmark update explicitly labeled December 2. [1][2][3]

**Why.** Zechner says he initially preferred Claude Code, but disliked the accumulation of features he did not use, changing prompts/tools, behavior changes, hidden context injection, and inadequate visibility into interactions. He also wanted a documented session format, an agent core suitable for alternative UIs, and better support for self-hosted models. These are **his historically situated reasons**, not a current independent audit of Claude Code or other competitors. [1]

**Original design choices, November 2025.** [1]

- Four default tools: `read`, `write`, `edit`, `bash`; optional read-only exploration tools could be selected separately. [1]
- A short, replaceable system prompt, project instructions in `AGENTS.md`, and below **1,000 tokens** for system prompt plus tool definitions according to the creator. [1]
- No built-in task-list tool, plan mode, MCP client, background bash manager, or dedicated subagent tool in the described version; use files, CLI programs, and tmux where appropriate. [1]
- The subagent position was nuanced: Zechner explicitly recognized valid cases such as code review and showed Pi invoking itself through bash. His stronger objection to parallel feature implementation was a personal workflow judgment, not an empirical law. [1]
- Unrestricted execution by default; the original essay suggested a container if full host access was uncomfortable. The current README still says Pi has no built-in permissions system restricting filesystem, processes, network, or credentials, and documents sandbox/container options. This is a trade-off, not proof that competing safeguards are worthless. [1][4]

**Current philosophy is not frozen in 2025.** The README still emphasizes adaptation through extensions, skills, templates, themes, packages, RPC, and SDK embedding, and says Pi skips built-in subagents and plan mode. However, **v0.99.0 on 2026-09-29 added MCP, tool search, and codemode as built-in extensions**, and **v1.0.0 on 2026-10-01 changed the default TUI to fullscreen**, with regular terminal scrollback still selectable. **v1.1.0 is dated 2026-10-07** in the current changelog, as of 2026-10-08. [4][7]

Current MCP documentation describes stdio and streamable HTTP, OAuth, and configurable exposure modes. The default `codemode` exposure keeps individual server tools out of direct model declarations and discovers them programmatically; `deferred`, `direct`, and `hidden` modes are also available. [8]

[INFERENCE] This is a more useful narrative than “minimalists versus MCP”: Pi’s original objection targeted overhead and composability; its current design integrates MCP while managing how tools enter context. That interpretation connects the old motivation with the current implementation without claiming the creator explicitly gave this retrospective explanation. [1][8][37]

**The pi-mono packages.** The creator’s November essay identifies the four foundational components: unified LLM API (`pi-ai`), agent loop/core (`pi-agent-core`), terminal framework (`pi-tui`), and CLI (`pi-coding-agent`). [1]

| Snapshot | Packages and purposes | Source |
|---|---|---|
| Original creator account, November 2025 | `pi-ai`: providers/streaming/tool calls; `pi-agent-core`: orchestration and events; `pi-tui`: terminal rendering; `pi-coding-agent`: interactive agent and session features | [1] |
| Historical `pi-mono` README at tag `v0.50.0` | Above four plus `pi-mom` (Slack bot), `pi-web-ui` (chat web components), `pi-pods` (vLLM deployment management) | [6] |
| Current repository, as of 2026-10-08 | `@earendil-works/chord`, `pi-telemetry`, `pi-ai`, `pi-durable`, `pi-agent-core`, `pi-coding-agent`, `pi-tui`; chat automation links to the separate `earendil-works/pi-chat` repository | [4] |

**Relationship to Peter Steinberger and Armin Ronacher.** The archived Pi changelog credits `@steipete` for contributions underlying standalone binaries and OAuth UI improvements in December 2025. Pi’s current README explicitly identifies OpenClaw as a real-world integration. [3][4]

Ronacher’s **2026-01-31** essay, *Pi: The Minimal Agent Within OpenClaw*, describes his own Pi extensions, session-branching workflow, and enthusiasm for software that an agent can extend. It also identifies Peter as the OpenClaw creator and says OpenClaw then used Pi underneath. For **claims about Ronacher’s own work**, it is first-person Grade C evidence; for his praise and claims about other projects, this dossier treats it as **Grade E personal commentary**, corroborating consequential lineage claims with project documentation. [9][32][35]

**Creator-reported benchmark.** Zechner reported a Terminal-Bench **2.0** run using **Pi + Claude Opus 4.5**, with **five trials per task**, begun November 30 and completed December 1, 2025. His submitted JSON reports `n_total_trials: 445`, top-level `n_trials: 445`, `n_errors: 71`, and the named evaluation’s `n_trials: 428`, with metric mean **0.4786516853932584**. His displayed screenshot shows **0.479**, **428 trials**, and **71 errors**. These are quoted, not reconciled or converted to an independently calculated success percentage. [1][10][11]

The article compares several model–harness combinations using their respective native models. It therefore does **not** isolate Pi’s causal contribution against all those harnesses with the same model. No Pi package version or confidence interval is established by the cited article/summary JSON; the score should not be narrated as a current rank or a clean matched-model win. [1][10]

**License.** MIT; copyright **2025 Mario Zechner**. [5]

### Oh-my-pi / omp — a Pi fork with integrated developer tooling

**Who and official links.** The repository is `github.com/can1357/oh-my-pi`, with official homepage `omp.sh`. Its README states “Built by Stencil Labs” and “Fork of Pi.” GitHub’s `can1357` profile identifies **Can Bölük**; Stencil’s About page identifies him as **founder & CEO** and **Meehir Patel** as **co-founder & COO**. The evidence establishes leadership and organizational attribution, not that either person wrote every subsystem. [12][13][14][15]

**When and fork status.** GitHub records creation of the omp repository at **2025-12-31T14:01:28Z**. GitHub currently returns `fork: false`, while the project’s own README explicitly calls it a fork of Pi. Those facts are not contradictory: the platform’s current fork-network flag is not the same as source ancestry. The migration guide documents continued selective upstream porting and records a historical Pi sync marker dated **2026-03-22**. Do not present that sync date as omp’s creation date. [12][13][17]

The early published artifact **`@oh-my-pi/pi-coding-agent@1.337.0`** remains readable through UNPKG. Its README still says “pi,” contains the omp package name and repository link, and retains upstream material; its changelog ends with Pi **0.31.1, 2026-01-02**. This demonstrates why copying the earliest package’s changelog version and calling it the first *omp* release would be misleading. [39][40]

**Motivation and design direction.** Stencil calls omp its “open-source proving ground for applied AI research,” explaining that it builds tools it can experiment with, evaluate, and improve. The current README’s framing is “The Pi you love, with batteries included.” [12][15]

Bölük’s February 12 essay argues that tool schemas, edit formats, error messages, and state management mediate the model’s ability to complete work. The central hashline idea is to expose content-derived anchors in file reads and have edits refer to those anchors instead of reproducing old text exactly. Its motivation is reducing mechanically failed edits and detecting stale input, not changing model weights. [18]

**What omp adds, documented as of 2026-10-08.** This is a profile of omp’s integration choices, **not a claim that none of its competitors has equivalents**. [12][21]

| Area | Documented design | Source |
|---|---|---|
| Editing | Hash-anchored changes, stale-anchor rejection, and a read/edit workflow designed together | [12][18] |
| Code intelligence | LSP operations and write-through integration; language-aware renames and diagnostics | [12][17] |
| Debugging | DAP integration with examples using LLDB, Delve, and debugpy | [12] |
| Execution | Persistent Python and Bun/JavaScript kernels that can call the harness’s tools | [12] |
| Native implementation | Rust-backed search, file operations, embedded shell/builtins, and native Windows operation | [12][21] |
| Rules | Time-traveling stream rules: match generated output, abort, inject a reminder, and retry; the README says injections survive compaction | [12] |
| Multi-agent work | First-class tasks, structured/schema-validated results, worktree isolation, live transcripts/steering in Agent Hub, and a separately configured advisor model | [12] |
| Memory | Agent-curated facts/lessons and selectable local, Hindsight, or Mnemopi backends; project-scoped by default in the current README | [12] |
| Integration | MCP, browser control, ACP/editor use, session collaboration, and discovery of other tools’ existing project instructions | [12][17] |

**Version history.** The public GitHub release page marks **v18.8.6** as latest, released **October 8, 2026**, matching the user-specified local version. The coding-agent changelog dates **18.8.0** to October 7 and **18.8.6** to October 8; 18.8.6 adds per-session Git-worktree settings and expanded xAI search/read support, among other fixes. This is public release evidence, not a runtime test of the local installation. [19][20]

**The hashline result, with the right boundaries.** The author reports **Grok Code Fast 1: 6.7% → 68.3%** from patch to hashline on a React-file mutation/recovery benchmark, with **three runs × 180 tasks**, fresh sessions, and **sixteen models** in the body of the article. Scoring compares restored files against the original, before/after formatting; this is not a general repository-issue benchmark. The title says fifteen LLMs, whereas the body and current chart caption refer to sixteen tested models; retain that distinction rather than silently rewriting it. [18]

The current essay’s caption says hashline beats patch in **14/16** models and a **v2 revision** improves further in **12/16**. It also contains wording inconsistencies, including “four tools (read, edit, write).” Treat these as reasons to use the underlying experiment/report for any detailed benchmark graphic, not to inflate a headline into a universal quality claim. [18]

**What “omp², soon!” refers to.** The banner is corroborated by the **2026-09-02** essay *The Harness Playbook*, explicitly describing a replacement architecture. Its author characterizes it as both a postmortem and a playbook, with parts already built and parts still being worked through. [21][22]

Its five stated consequences are: one journal-derived authoritative session; trusted host-side control/policy; bounded, cancellable, observable work; structured model/provider compatibility; and UI/remote/inspector views as projections of the same state. The proposed DOM materializes messages, tools, queues, and other state together, so rewind/fork/resume do not depend on disconnected mutable state. These are **documented architectural intentions**, not a claim that every mechanism is shipped in omp 18.8.6. [22]

**License.** MIT; the current file credits **Mario Zechner (2025), Can Bölük (2025–2026), and Stencil Labs, Inc. (2026)**. [16]

### Hermes Agent — Nous Research’s persistent, learning-oriented assistant

**Official identity and when.** The first-party chain is explicit: `nousresearch.com/releases` links Hermes Agent to `hermes-agent.nousresearch.com`, whose official-links page identifies `github.com/NousResearch/hermes-agent` as its source. The official release index labels **2026-02-25** as the Hermes Agent release. No lookalike domain is used as an official source here. [23][24][25][41]

The project is attributed to **Nous Research**, not to a single inventor in the opened launch/index material. The current **v0.21.6** release, dated **2026-10-08**, was published by `teknium1`; that establishes a release-maintainer role, not sole authorship. [24][25][38]

**Why.** The official launch description is “An autonomous agent that lives on your server, remembers what it learns, and gets more capable the longer it runs.” The README operationalizes that aspiration through memory persistence, skill creation/refinement, conversation search, and user modeling. “The agent that grows with you” is a product aim; a guarantee of steadily improving task performance would require additional evaluation. [24][25]

**Architecture.** The official developer map centers on Python’s `AIAgent`, reached through CLI, gateway, ACP, batch runner, API server, or Python-library entry points. Prompt construction, provider resolution, tool dispatch, context handling, and SQLite/FTS5 session storage are separate documented subsystems. [29]

- **Curated memory:** `MEMORY.md` and `USER.md` are bounded stores, injected as a frozen snapshot at session start. Writes persist immediately, but the prompt snapshot changes only for a new session. The docs explicitly warn that a textual claim to have remembered something is not evidence of an actual `memory` tool call. [26]
- **Procedural memory/skills:** on-demand `SKILL.md` documents follow progressive disclosure and the Agent Skills format. The agent can create or change skills; `/learn` turns a described workflow or source material into a reusable skill. This describes file/tool-mediated learning, not automatic weight updates to the underlying LLM. [27]
- **Recall:** the memory guide documents SQLite FTS5 search returning actual stored messages without an LLM summarization step. Its wording differs from the current README’s “FTS5 session search with LLM summarization”; see the uncertainty notes below. [24][26]
- **Messaging and automation:** the official site lists terminal access plus Telegram, Discord, Slack, WhatsApp, Signal, and email, with scheduling and delegated work. The repository adds multiple execution backends and batch trajectory generation for research workflows. [23][24]
- **Models:** the README supports Nous Portal, OpenRouter, OpenAI, custom endpoints, and other providers. Hermes Agent is not restricted to Nous’s own model weights. [24]

**Relationship to Hermes models.** Nous’s release index distinguishes the **AGENT** entry from **MODEL** entries such as Hermes 4. The Hermes 4 technical report describes a trained hybrid-reasoning model family, using Llama 3.1 checkpoints for the 405B/70B variants and Qwen3 for the 14B variant. It does not evaluate the subsequently released Hermes Agent as a persistent assistant. [25][31]

**Relationship to OpenClaw.** Hermes provides **`hermes claw migrate`**, importing compatible persona, memory, skills, model/provider configuration, MCP, and messaging settings. It previews changes, makes a backup by default, and requires explicit permission to migrate secrets; some items, including cron configurations, plugins, multi-agent lists, and bindings, are archived for manual recreation rather than automatically translated. [28]

[INFERENCE] A documented migration path and overlapping personal-assistant functions justify describing Hermes as an **alternative in the same space**. They do not establish that Hermes is an OpenClaw fork, was created solely to compete with it, has absorbed its users, or outperforms it. [23][24][28][32]

**Adoption signals, as of 2026-10-08.** The opened GitHub repository metadata reports **252,054 stars** and **54,392 forks**. These are visible project-attention signals, not active-user, retention, installation, or task-success counts. The v0.21.6 release separately reports **2,106 merged PRs** in its stated window since v0.21.5; that is a maintainer-reported development activity count, not a count of distinct contributors or users. [24][38]

**Distribution nuance.** The October 8 v0.21.6 notes say the release ships a tag, GitHub release, and Docker image; Desktop, Termux, and Microsoft Store stay on their existing builds until the next bundled release. Do not imply every Hermes surface has the same release revision simply because the repository has a new tag. [38]

**License.** MIT; the opened file names **Copyright (c) 2025 Nous Research**. A copyright year is not a launch date; the explicit product release date remains February 25, 2026. [25][30]

### OpenClaw — the personal-assistant branch of the story

**Who/what/why.** The official README identifies **Peter Steinberger and the community** as builders. OpenClaw is an open-source assistant running on users’ own devices, with a gateway connecting chats, tools, sessions, and companion apps. The current README emphasizes user-held state/memory/credentials, configurable providers and harnesses, and stewardship by the independent OpenClaw Foundation. [32]

The project’s official lore traces the names **Warelay → Clawd/Clawdbot → Moltbot → OpenClaw**, gives the Clawd persona’s beginning as **November 25, 2025**, and dates the Moltbot and OpenClaw renamings to **January 27 and January 30, 2026**, respectively. This is first-party project history written in a playful style; the persona birthday is not automatically a package’s first release date. [33]

**Pi connection: historical versus current.** Pi’s README identifies OpenClaw as a real-world integration, and OpenClaw thanks Zechner for Pi. Ronacher’s January 31 essay describes Pi under the hood at that time. [4][9][32]

As of 2026-10-08, the OpenClaw architecture page at the historical `/pi` URL says **“No external agent framework packages remain.”** It describes an OpenClaw-owned reusable `@openclaw/agent-core`, runtime code, model/provider transport, and plugin-facing contracts. It explicitly retains **`@earendil-works/pi-tui`** as a third-party terminal component toolkit, and says the legacy runtime alias `pi` normalizes to `openclaw`. The right present-day formulation is **Pi ancestry and a continuing Pi-TUI dependency**, not “today’s OpenClaw is just the Pi coding agent wrapped in chat.” [35]

**Creator motivation.** In his 2026 OpenClaw essay, Steinberger describes beginning AI exploration to have fun and inspire people, then wanting an agent usable by his mother. He says OpenClaw should remain open source and independent while he joins OpenAI. Those statements should not be conflated with the current README’s separate claim that OpenAI is a donor rather than the project’s owner. [32][34]

**License.** MIT; current copyright attribution is **2026 OpenClaw Foundation**. [36]

### Verbatim creator/organization motivation quotes

| Project / speaker | Verbatim quote | Date/context and source URL |
|---|---|---|
| Pi / Mario Zechner | “My philosophy in all of this was: if I don't need it, it won't be built. And I don't need a lot of things.” | 2025-11-30, creator’s account: https://mariozechner.at/posts/2025-11-30-pi-coding-agent/ [1] |
| Pi / Mario Zechner | “pi is my attempt to build myself a tool where I'm in control as much as possible.” | Same essay, “In summary.” [1] |
| omp / Can Bölük | “Often the model isn't flaky at understanding the task. It's flaky at expressing itself. You're blaming the pilot for the landing gear.” | 2026-02-12, “So What?”: https://stencil.so/blog/the-harness-problem [18] |
| omp² / Can Bölük | “Unavoidable complexity needs an owner.” | 2026-09-02, introduction: https://stencil.so/blog/harness-playbook [22] |
| Stencil Labs | “At our core, we're a research company. We build tools we can constantly experiment with, evaluate, improve, and iterate on, and we publish what we learn along the way.” | Undated current About page: https://stencil.so/about [15] |
| Hermes Agent / Nous Research | “The agent that grows with you” | Repository tagline, current: https://github.com/NousResearch/hermes-agent [24] |
| Hermes Agent / Nous Research | “An autonomous agent that lives on your server, remembers what it learns, and gets more capable the longer it runs.” | 2026-02-25 release entry: https://nousresearch.com/releases [25] |
| OpenClaw / Peter Steinberger | “When I started exploring AI, my goal was to have fun and inspire people.” | 2026 creator account: https://steipete.me/posts/2026/openclaw [34] |
| OpenClaw / Peter Steinberger | “My next mission is to build an agent that even my mum can use.” | Same account. [34] |

### Design-philosophy comparison

The labels in the second row are **[INFERENCE] editorial summaries**, not measured scores. Feature presence does not establish feature quality, nor that another project cannot implement an equivalent. [4][12][23][32]

| Dimension | Pi | omp | Hermes Agent | OpenClaw |
|---|---|---|---|---|
| Stated purpose | Minimal, extensible harness made to fit your workflow. [4] | Coding agent “with the IDE wired in”; applied-research proving ground. [12][15] | Agent that grows with the user through memory and skills. [24][25] | Assistant on your devices and in your chats. [32] |
| [INFERENCE] Center of gravity | User-controlled composition. [1][4] | Integrated developer-tool surface. [12] | Persistent personal/task learning. [24][26][27] | Gateway, devices, channels, and assistant ownership. [32] |
| Lineage | Zechner’s original toolkit/CLI; current Earendil repository. [1][4] | Explicit Pi fork with continuing selective upstream porting. [12][17] | Nous Research project; migration support does not prove an OpenClaw fork. [24][28] | Historically integrated Pi; current runtime internalized, Pi-TUI retained. [4][9][35] |
| Extensibility | TypeScript extensions, skills, templates, themes, packages, RPC/SDK. [4] | Extensions/capability discovery plus integrated protocols/tools. [12][17] | Skills, plugins, memory providers, tools, Python library/ACP/API entry points. [24][27][29] | Plugins, skills, configurable runtimes/providers, channel and companion surfaces. [32][35] |
| MCP stance | Rejected in original 2025 essay; built-in since 2026-09-29, with managed exposure. [1][7][8] | Built-in integration documented. [12][17] | MCP integration and migration documented. [28][29][41] | Current migration/architecture ecosystem includes MCP; the historical Pi ancestry is not a reason to assert no MCP. [28][35] |
| Multi-agent stance | Current README omits built-in subagents; originally showed shell-spawned review agents, rather than forbidding all delegation. [1][4] | First-class tasks, schema results, isolation, Agent Hub, advisor. [12] | Isolated delegated tasks and programmatic tool pipelines. [24] | Per-agent workspaces and selectable built-in/plugin runtimes. [35][42] |
| Durable knowledge/state | Sessions, branch navigation, and extension-managed customization. [4][9] | Project-oriented memory with selectable engines; omp² proposes broader unified journal state. [12][22] | Bounded memory files, session search, reusable skills. [26][27] | Workspace instruction/persona/memory files plus agent-owned session storage. [42] |
| Important trade-off | Minimal core leaves workflow choices to extensions/users; host permissions require external isolation if needed. [4] | Rich integration requires coherence across many subsystems; its creator’s own postmortem motivates omp². [12][22] | Persistence depends on actual writes and session boundaries; memory is bounded, not perfect recall. [26] | Host tools and inbound messaging require deliberate trust/authorization/sandbox configuration. [32] |
| Core license | MIT. [5] | MIT. [16] | MIT. [30] | MIT. [36] |

### Dated timeline, 2025–2026

| Month/year | Event and exact date where verified | Interpretation / source |
|---|---|---|
| 08/2025 | Nous releases Hermes 4 models and technical report on **August 26**. | Model-family context, **not** the Hermes Agent launch. [25][31] |
| 11/2025 | Zechner publishes *What if you don't need MCP at all?*, **November 2**. | Precursor argument for composable CLI/code workflows; historically dated. [37] |
| 11/2025 | Earliest surviving old-scope Pi CLI npm release: **0.6.2, November 12**. | Converted from npm’s version timestamp; not necessarily first code existence. [2] |
| 11/2025 | Pi changelog’s first recorded entry: **0.7.6, November 13**. | Earlier versions explicitly lacked changelog entries. [3] |
| 11/2025 | OpenClaw lore dates the Clawd persona’s origin to **November 25**. | Persona/project-history marker, not verified package publication. [33] |
| 11/2025 | Pi motivation essay, **November 30**; benchmark begins that day. | Creator describes controlled context, minimal prompt/tools, and deliberate omissions. [1][10] |
| 12/2025 | Pi benchmark completes **December 1**; article’s leaderboard snapshot is labeled **December 2**. | Historical creator-run result, not current placement. [1][10] |
| 12/2025 | Pi **0.12.0, December 2**, adds standalone binary support based in part on Steinberger’s contribution. | Concrete technical connection between the projects’ creators. [3] |
| 12/2025 | omp repository created **December 31, 14:01:28 UTC**. | GitHub creation record; exact initial public-fork action not separately established. [13] |
| 01/2026 | OpenClaw lore records **January 27** Moltbot renaming and **January 30** OpenClaw renaming. | Names should not be presented as three unrelated projects. [33] |
| 01/2026 | Ronacher publishes *Pi: The Minimal Agent Within OpenClaw*, **January 31**. | Influential personal account; Grade E for comparative praise about other products. [9] |
| 02/2026 | Bölük publishes the hashline/harness essay, **February 12**. | Creator-run evidence that editing interface changes can alter benchmark outcomes. [18] |
| 02/2026 | Official Hermes Agent release entry: **February 25**. | First-party release date. [25] |
| 03/2026 | omp’s porting guide records a Pi sync marker dated **March 22**. | Evidence of continued upstream tracking, not a new fork date. [17] |
| 09/2026 | *The Harness Playbook*, **September 2**, describes omp². | Roadmap/postmortem explicitly mixes built and in-progress work. [22] |
| 09/2026 | Pi **0.99.0, September 29**, adds built-in MCP/codemode/tool search. | Material change from the original no-MCP stance. [7][8] |
| 10/2026 | Pi **1.0.0, October 1**, defaults to fullscreen; **1.1.0, October 7**, follows. | Current release trajectory as of 2026-10-08. [7] |
| 10/2026 | omp **18.8.6, October 8**; Hermes **0.21.6, October 8**. | Public releases; Hermes notes distinguish core/Docker release from desktop/mobile bundle updates. [19][20][38] |
| 10/2026 | OpenClaw’s current architecture documentation describes its own runtime and retained Pi-TUI dependency. | Current state **as of October 8**; this is not the exact date the cutover occurred. [35] |

## Key numbers

| Claim/metric | Value | Conditions (model, harness, benchmark/version, date) | Source [n] (location) | Grade |
|---|---|---|---|---|
| Pi original default tools | **4** | `read`, `write`, `edit`, `bash`; creator’s November 2025 configuration, not all optional tools | [1], “Minimal toolset” | C |
| Pi original system+tool prompt | **Below 1,000 tokens** | Creator-reported; November 2025; tokenizer and measurement harness not specified | [1], “Minimal toolset” | C |
| Earliest surviving Pi CLI npm publication | **0.6.2; 2025-11-12T22:44:35.139Z** | Derived by UTC conversion of `1762987475139`, the earliest timestamp in the old-scope npm version list | [2], raw HTML `window.__context__.context.packument.versions` | C |
| Pi Terminal-Bench mean | **0.4786516853932584**; screenshot **0.479** | Pi + `claude-opus-4-5`, Terminal-Bench 2.0 per article, 2025-11-30–12-01; five trials/task; Pi version/CI not established | [1], “Benchmarks”; [10], `stats.evals...metrics[0].mean`; [11], “Mean” | C |
| Pi benchmark trial/error fields | **445 total; 428 named-eval trials; 71 errors** | Same run; differing fields retained exactly, not silently reconciled | [10], `n_total_trials`, `stats.n_trials`, named eval `n_trials`, `n_errors` | C |
| omp repository creation | **2025-12-31T14:01:28Z** | GitHub repository metadata, not an independent first-public-release record | [13], `created_at` | C |
| Hashline reported pass-rate change | **6.7% → 68.3%** | Grok Code Fast 1, patch→hashline; React mutation/recovery editing benchmark, three runs×180 tasks; article dated 2026-02-12; no CI quoted | [18], “The Benchmark” | C |
| Hashline comparison scope | **16 models; 14/16 beat patch; v2 further improves 12/16** | Current article caption; distinguish tested model count from “15 LLMs” headline | [18], opening chart caption | C |
| Current omp release | **18.8.6; 2026-10-08** | GitHub release marked latest as of access date; local version supplied by user, not executed here | [19], release header; [20], version section | C |
| Hermes Agent official launch | **2026-02-25** | Nous release catalogue’s AGENT entry | [25], “Hermes Agent” | C |
| Hermes bounded memory capacities | **2,200 characters; 1,375 characters** | MEMORY.md and USER.md respectively, defaults in current guide as of 2026-10-08; not claims about total searchable history | [26], “How It Works” | C |
| Hermes GitHub attention signals | **252,054 stars; 54,392 forks** | Snapshot as of 2026-10-08; not users or benchmark performance | [24], repository metadata | C |
| Hermes release-window activity | **2,106 merged PRs** | v0.21.6 notes, window since v0.21.5, measured at `818c13be1dc4fd28987e1e881a9408224afd4535`; as of 2026-10-08 | [38], “About this release” | C |
| Pi releases marking philosophy changes | **0.99.0: 2026-09-29; 1.0.0: 2026-10-01; 1.1.0: 2026-10-07** | MCP/codemode introduction; fullscreen default; latest listed release respectively, as of 2026-10-08 | [7], corresponding version headings | C |

## Contested or uncertain

- **Historical criticism is not current feature absence.** Zechner’s November 2025 complaints about Claude Code and Bölük’s February 2026 criticisms describe their experiences and claims at those times. This slice does not establish that present-day Claude Code or Codex lacks LSP, subagents, teams, alternative providers, or observability features. Do not reuse the essays as an October 2026 missing-feature checklist. [1][18]
- **Pi’s explicit “will not support MCP” statement was superseded.** Preserve the original quote as history, immediately paired with the September 2026 release record. The same applies to original praise for a non-fullscreen terminal UI versus the October 2026 fullscreen default. [1][7][8]
- **OpenClaw’s Pi dependency changed.** Historical integration is supported, but current official architecture says no external agent framework packages remain; Pi-TUI is the named exception as a UI toolkit. The exact runtime-internalization date was not established here. [4][9][32][35]
- **First release ≠ initial invention.** Pi’s earliest surviving CLI npm entry is verified, but that does not date earlier toolkit work. omp’s repository creation is verified; its early package artifact retains an upstream changelog and should not be used to fabricate an inaugural omp version/date. [2][3][13][39][40]
- **Hermes marketing is stronger than the evidence.** The README calls it “the only agent with a built-in learning loop,” and the homepage says it “never forgets” how it solved a problem. The memory guide instead documents bounded stores, dependence on actual tool writes, and session-boundary constraints. Treat exclusivity/perfect recall as unsubstantiated marketing, not narration-ready facts. [23][24][26]
- **Hermes first-party docs disagree in details.** Homepage lists five terminal backends, repository lists seven; README says session search uses LLM summarization, while the memory guide explicitly says actual messages, no LLM summarization. Describe capabilities without a cross-page precise count, and use the focused memory guide for the present search description pending code-level verification. [23][24][26][29]
- **Benchmark caveats matter.** Pi’s trial-count fields differ; omp’s essay has a fifteen-model headline, sixteen-model body, a revised caption, and an inconsistent tool-count sentence. Neither experiment establishes that one of these products universally dominates the others; neither is peer-reviewed. [1][10][11][18]
- **omp² is not a shipped-feature guarantee.** The author explicitly marks the architecture as partially built/partially in progress. The playbook also criticizes omp’s own earlier state handling, so an honest introduction should not turn it into a competitors-only attack. [22]
- **Core MIT licenses do not license every connected service or model.** The four software license files license their respective software; they do not state that all model weights, hosted APIs, or subscription uses inherit those terms. [5][16][30][36]

## Corrections & nuances to the blueprint

1. **The creator guesses were correct:** Pi is Mario Zechner’s project; `can1357` is Can Bölük; current omp attribution includes Stencil Labs and a wider contributor community. [1][12][14][15][16][19]
2. **Avoid a single causal story of “mainstream failures caused all alternatives.”** Pi has an explicit dissatisfaction/control narrative; omp emphasizes integrated tools and harness experimentation; Hermes emphasizes persistent learning; OpenClaw emphasizes a personal assistant and ownership. The opened sources do not establish that all four arose from the same complaint. [1][15][18][24][25][32][34]
3. **“Pi has no MCP” is now false without a historical qualifier.** The original philosophical stance remains useful history, but built-in MCP shipped in September 2026. [1][7][8]
4. **“OpenClaw uses Pi” needs a tense and a layer.** The early integration and Pi lineage are real; current OpenClaw owns its agent runtime and retains the Pi-TUI library. [4][9][35]
5. **“omp²” is documented, not a mystery to fill with speculation.** Use the September playbook’s architectural goals, clearly labeled as a replacement design in progress. [21][22]
6. **Hermes Agent is not the Hermes model family, and learning is not automatically model training.** Its documented memory and skills mechanisms persist external state; its namesake models have a separate training report. [24][26][27][31]
7. **An alternative is not automatically a fork or an upgrade.** Hermes’s OpenClaw migration utility proves compatibility work and audience overlap, not source ancestry, migration volume, or superiority. [28]
8. **Package names and release numbers evolved.** Preserve old `pi-mono`/`@mariozechner` names when describing historical artifacts; use current Earendil names for current Pi instructions, and separate omp’s own releases from inherited Pi changelog entries. [2][4][6][19][39][40]

## Open questions for the user

- Should the video emphasize the **historical divergence in 2025–early 2026**, the **current October 2026 product landscape**, or show both with explicit date cards? This materially changes how the Pi/MCP and OpenClaw/Pi stories should be narrated. [1][7][35]
- How much screen time should the documented but partly in-progress **omp² architecture** receive relative to a walkthrough of the installed **18.8.6** release? [19][22]
- Is the intended audience primarily developers choosing a coding harness, or also viewers choosing an always-available personal assistant? Hermes and OpenClaw’s messaging/memory emphasis makes the comparison broader than terminal coding alone. [12][23][24][32]
- Should direct creator quotes retain their informal tone, or should narration paraphrase them while showing the exact source quote on screen? The research can support either editorial style. [1][18][34]

## Unverified leads

- **Pi’s first toolkit commit/public unveiling before the CLI npm release:** a search result suggested an August 2025 repository origin, but repository creation/history APIs failed in this session. It is not promoted to a finding or timeline event. The verified CLI publication is November 12. [2][3]
- **Exact inaugural omp publication:** read-only `npm view @oh-my-pi/pi-coding-agent time --json` returned a `1.337.0` timestamp of `2026-01-02T21:58:02Z`; the version’s artifact was opened, but its timestamp was not separately recovered through the opened `read` sources. Retain this as a lead, not the fully source-qualified first release. The December 31 repository timestamp is independently opened and citable. [13][39][40]
- **Hermes individual founding contributions and pre-launch development timeline:** the opened release index attributes the project to Nous Research and the current release to a maintainer, but does not establish a sole creator or an exact internal development start. [24][25][38]
- **Controlled longitudinal improvement from Hermes’s learning loop:** no peer-reviewed or formal Agent-specific experiment was established in this slice. The Hermes 4 report is not a substitute. [24][26][27][31]
- **A firm omp² launch date, final release identifier, and complete shipped feature set:** the opened sources describe intent and partial implementation, not a release guarantee. [21][22]
- **Precise date OpenClaw internalized the agent runtime:** current state is established, the cutover date is not. [35]

## Visual ideas

- **Lineage map with dated arrows:** Mario/Pi → omp labeled “fork; repository created 2025-12-31”; Pi → early OpenClaw labeled “SDK integration”; that second arrow changes in the October 2026 frame to “Pi-TUI dependency; agent runtime now OpenClaw-owned.” Hermes sits beside OpenClaw with a separate dashed “migration utility” arrow, not a fork arrow. [4][12][13][28][32][35]
- **A philosophy montage:** four creator/organization quotes from the quote table—control, harness interface, growing memory/skills, accessible personal assistant. Use attributed speech rather than depicting an unmeasured quality ranking. [1][18][24][34]
- **Animated timeline:** the dated table above, with distinct icons/labels for “package publication,” “repository creation,” “essay,” “rename,” and “release.” This prevents the common visual conflation of those events. [2][3][13][18][25][33]
- **Pi’s philosophy evolution:** split screen “November 2025: no built-in MCP” versus “September 2026: MCP via controlled exposure/codemode”; animate tools remaining outside direct context until needed. [1][7][8]
- **Hashline close-up:** text reproduction versus referring to a content-derived anchor, followed by a stale-anchor rejection. If showing the **6.7% → 68.3%** bar pair, display the exact Grok model, React mutation benchmark, three×180 conditions, and “creator-run benchmark” alongside it. [18]
- **Hermes memory mechanism, not a magical growing brain:** a session writes bounded MEMORY/USER entries and a SKILL.md; a new session loads a frozen memory snapshot and retrieves skills/history when needed. A visible “external state, not weight training” label prevents model/harness confusion. [26][27][31]
- **omp versus omp² state diagram:** current feature boxes versus the proposed single journal-derived session tree, with a clear “architecture in progress” title. [12][22]
- **Adoption card rather than a leaderboard:** Hermes GitHub stars/forks with the access date and “not active users”; do not place attention counts beside benchmark scores as if they were comparable measures. [24]

## References

[1] Mario Zechner. “What I learned building an opinionated and minimal coding agent.” Creator’s blog, 2025-11-30, with December 2 benchmark update in the opened page. https://mariozechner.at/posts/2025-11-30-pi-coding-agent/ . Grade: C (primary creator account; personal competitor assessments remain attributed opinions). Accessed 2026-10-08.

[2] Mario Zechner / npm. “@mariozechner/pi-coding-agent — version history.” npm, 2025–2026. https://www.npmjs.com/package/@mariozechner/pi-coding-agent?activeTab=versions . Grade: C. Opened rendered page and raw HTML; earliest timestamp in `window.__context__.context.packument.versions` is `0.6.2`, `1762987475139`. Accessed 2026-10-08.

[3] Pi contributors. “pi-coding-agent CHANGELOG, published package 0.12.0.” npm artifact served by UNPKG, 2025. https://unpkg.com/@mariozechner/pi-coding-agent@0.12.0/CHANGELOG.md . Grade: C (versioned first-party package artifact). Accessed 2026-10-08.

[4] Pi contributors / Earendil. “Pi — README and repository metadata.” GitHub, 2026. https://github.com/badlogic/pi-mono (resolved to https://github.com/earendil-works/pi). Grade: C. Accessed 2026-10-08.

[5] Mario Zechner. “MIT License.” Pi repository, 2025–2026. https://raw.githubusercontent.com/earendil-works/pi/main/LICENSE . Grade: C. Accessed 2026-10-08.

[6] Pi contributors. “Pi Monorepo — README, v0.50.0.” GitHub, 2026. https://raw.githubusercontent.com/badlogic/pi-mono/v0.50.0/README.md . Grade: C. Accessed 2026-10-08.

[7] Pi contributors. “Coding-agent changelog.” GitHub, 2026. https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/CHANGELOG.md . Grade: C. Relevant entries: 0.99.0 (2026-09-29), 1.0.0 (2026-10-01), 1.1.0 (2026-10-07). Accessed 2026-10-08.

[8] Pi contributors. “MCP Servers.” Pi documentation, 2026. https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/mcp.md . Grade: C. Accessed 2026-10-08.

[9] Armin Ronacher. “Pi: The Minimal Agent Within OpenClaw.” Personal blog, 2026-01-31. https://lucumr.pocoo.org/2026/1/31/pi/ . Grade: E for personal analysis/praise of other products; C only for his first-person account of his own extensions/workflow. Accessed 2026-10-08.

[10] Mario Zechner (`badlogic`). “result.json — Pi / Claude Opus 4.5 / Terminal-Bench run.” GitHub Gist, 2025-12-01. https://gist.github.com/badlogic/f45e8f6e481e5ab7d3a50659da84edaa . Grade: C (creator-submitted experiment artifact). Accessed 2026-10-08.

[11] Mario Zechner. “Terminal-Bench result screenshot.” Creator’s blog, 2025. https://mariozechner.at/posts/2025-11-30-pi-coding-agent/media/terminal-bench.png . Grade: C. Opened as an image. Accessed 2026-10-08.

[12] Can Bölük / Stencil Labs / omp contributors. “oh-my-pi — README and repository metadata.” GitHub, 2026. https://github.com/can1357/oh-my-pi . Grade: C. Accessed 2026-10-08.

[13] GitHub / can1357. “Repository metadata: can1357/oh-my-pi.” GitHub REST API, 2026. https://api.github.com/repos/can1357/oh-my-pi?per_page=1 . Grade: C. Relevant fields: `created_at`, `fork`, `homepage`. Accessed 2026-10-08.

[14] Can Bölük. “can1357 public profile.” GitHub REST API, 2026. https://api.github.com/users/can1357 . Grade: C. Accessed 2026-10-08.

[15] Stencil Labs. “About — New instruments for building software.” Official website, undated/current. https://stencil.so/about . Grade: C. Accessed 2026-10-08.

[16] Mario Zechner / Can Bölük / Stencil Labs, Inc. “MIT License.” omp repository, 2025–2026. https://raw.githubusercontent.com/can1357/oh-my-pi/main/LICENSE . Grade: C. Accessed 2026-10-08.

[17] omp contributors. “Porting From pi-mono: A Practical Merge Guide.” Bundled omp documentation, 2026. omp://porting-from-pi-mono.md . Grade: C (local installed documentation). Relevant sections: “Last Sync Point,” “Replace import scopes,” “Intentional Divergences.” Accessed 2026-10-08.

[18] Can Bölük. “We improved 15 LLMs at coding in one afternoon. Only the harness changed.” Stencil Labs / author’s blog, 2026-02-12; opened version contains v2 comparison caption. https://blog.can.ac/2026/02/12/the-harness-problem/ (redirected to https://stencil.so/blog/the-harness-problem; markdown alternate https://stencil.so/blog/the-harness-problem/index.md). Grade: C (creator-run benchmark/blog, not a peer-reviewed paper). Accessed 2026-10-08.

[19] omp contributors. “Release v18.8.6.” GitHub Releases, 2026-10-08. https://github.com/can1357/oh-my-pi/releases/tag/v18.8.6 . Grade: C. Accessed 2026-10-08.

[20] omp contributors. “Coding-agent changelog.” GitHub, 2026. https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/CHANGELOG.md . Grade: C. Accessed 2026-10-08.

[21] Stencil Labs. “omp — a coding agent with the IDE wired in.” Official website, undated/current. https://omp.sh/ . Grade: C. Accessed 2026-10-08.

[22] Can Bölük. “The Harness Playbook.” Stencil Labs, 2026-09-02. https://stencil.so/blog/harness-playbook (markdown alternate https://stencil.so/blog/harness-playbook/index.md). Grade: C (creator’s engineering postmortem/design essay, not peer-reviewed). Accessed 2026-10-08.

[23] Nous Research. “Hermes Agent — The Agent That Grows With You.” Official product website, 2026. https://hermes-agent.nousresearch.com/ . Grade: C. Accessed 2026-10-08.

[24] Nous Research / Hermes Agent contributors. “Hermes Agent — README and repository metadata.” GitHub, 2026. https://github.com/NousResearch/hermes-agent . Grade: C. Accessed 2026-10-08.

[25] Nous Research. “Releases.” Official release catalogue, 2025–2026. https://nousresearch.com/releases . Grade: C. Relevant entries: Hermes Agent (2026-02-25), Hermes 4 (2025-08-26). Accessed 2026-10-08.

[26] Nous Research / Hermes Agent contributors. “Persistent Memory.” Official documentation, 2026. https://hermes-agent.nousresearch.com/docs/user-guide/features/memory . Grade: C. Accessed 2026-10-08.

[27] Nous Research / Hermes Agent contributors. “Skills System.” Official documentation, 2026. https://hermes-agent.nousresearch.com/docs/user-guide/features/skills . Grade: C. Accessed 2026-10-08.

[28] Nous Research / Hermes Agent contributors. “Migrate from OpenClaw.” Official documentation, 2026. https://hermes-agent.nousresearch.com/docs/guides/migrate-from-openclaw . Grade: C. Accessed 2026-10-08.

[29] Nous Research / Hermes Agent contributors. “Architecture.” Official developer documentation, 2026. https://hermes-agent.nousresearch.com/docs/developer-guide/architecture . Grade: C. Accessed 2026-10-08.

[30] Nous Research. “MIT License.” Hermes Agent repository, 2025–2026. https://github.com/NousResearch/hermes-agent/blob/main/LICENSE (opened raw https://raw.githubusercontent.com/NousResearch/hermes-agent/main/LICENSE). Grade: C. Accessed 2026-10-08.

[31] Ryan Teknium, Roger Jin, Jai Suphavadeeprasit, Dakota Mahan, Jeffrey Quesnelle, Joe Li, Chen Guang, Shannon Sands, and Karan Malhotra. “Hermes 4 Technical Report.” Nous Research, 2025-08-26 per official release catalogue. https://nousresearch.com/wp-content/uploads/2025/08/Hermes_4_Technical_Report.pdf . Grade: B (formal lab technical report; no peer-reviewed acceptance asserted; publisher PDF, no version identifier supplied on the opened first page). Relevant sections: Abstract, §1, §3. Accessed 2026-10-08.

[32] Peter Steinberger / OpenClaw contributors / OpenClaw Foundation. “OpenClaw — README and repository metadata.” GitHub, 2026. https://github.com/openclaw/openclaw . Grade: C. Accessed 2026-10-08.

[33] OpenClaw contributors. “The Lore of OpenClaw.” Official documentation, 2026. https://docs.openclaw.ai/start/lore . Grade: C (first-party historical narrative; humorous tone, not an audited historical record). Accessed 2026-10-08.

[34] Peter Steinberger. “OpenClaw, OpenAI and the future.” Creator’s blog, 2026. https://steipete.me/posts/2026/openclaw . Grade: C. Read tool opened the markdown alternate; exact publication day not established from that rendition. Accessed 2026-10-08.

[35] OpenClaw contributors. “Agent runtime architecture.” Official documentation at historical `/pi` URL, 2026. https://docs.openclaw.ai/pi . Grade: C. Relevant sections: “Runtime Layout,” “Boundaries,” “Runtime Selection.” Accessed 2026-10-08.

[36] OpenClaw Foundation. “MIT License.” OpenClaw repository, 2026. https://github.com/openclaw/openclaw/blob/main/LICENSE (opened raw https://raw.githubusercontent.com/openclaw/openclaw/main/LICENSE). Grade: C. Accessed 2026-10-08.

[37] Mario Zechner. “What if you don't need MCP at all?” Creator’s blog, 2025-11-02. https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/ . Grade: C for the creator’s stated motivation and own tooling; historical comparative opinions remain attributed. Accessed 2026-10-08.

[38] Nous Research / `teknium1`. “Hermes Agent v0.21.6.” GitHub Releases, 2026-10-08. https://github.com/NousResearch/hermes-agent/releases/tag/v0.21.6 . Grade: C. Accessed 2026-10-08.

[39] omp contributors. “pi-coding-agent 1.337.0 — README.” Published npm artifact served by UNPKG, 2026. https://unpkg.com/@oh-my-pi/pi-coding-agent@1.337.0/README.md . Grade: C (versioned first-party artifact, including inherited documentation). Accessed 2026-10-08.

[40] omp contributors / Pi contributors. “pi-coding-agent 1.337.0 — CHANGELOG.” Published npm artifact served by UNPKG, 2026. https://unpkg.com/@oh-my-pi/pi-coding-agent@1.337.0/CHANGELOG.md . Grade: C. Accessed 2026-10-08.

[41] Nous Research. “Hermes Agent — official links and overview.” Official `llms.txt`, 2026. https://hermes-agent.nousresearch.com/llms.txt . Grade: C. Accessed 2026-10-08.

[42] OpenClaw contributors. “Agent runtime.” Official documentation, 2026. https://docs.openclaw.ai/concepts/agent . Grade: C. Accessed 2026-10-08.
