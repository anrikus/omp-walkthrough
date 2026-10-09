# Outline — "The Harness Layer: an evidence-based introduction to omp"
> Planning outline (v1, 2026-10-08) · Independent/community production · planned ≈40 min across 14 chapters + unnarrated feature atlas. Final narration runs 44:29 at natural speed (user's pacing choice); the scripts of record are `narration/chNN-*.json`.
> Claim IDs resolve via `research/claims.json` (`C<dossier>-T<n>` = takeaway, `C<dossier>-N<n>` = key-number row); `D<nn>` = whole dossier section. Grades: A peer-reviewed · B preprint/tech report · C first-party · D secondary · E anecdotal.

## Editorial decisions (user, 2026-10-08)
Narrated web presentation · Kokoro-82M voice · ~30–40 min chaptered · audience: Claude Code/Codex users + tech leads · animated recreations of the omp TUI showing **real current model IDs** and **omp 18.8.6 shipped defaults** · independent branding · Ch. 4 = trade-offs + dated history · Ch. 7 = "which pattern fits which task" · Ch. 6 = multi-axis story led by DeepSeek Harness · **omp² gets a full chapter** · non-peer-reviewed numbers shown with grade badge + conditions · narrated core features + unnarrated feature atlas · Ch. 11 = goal-based settings profiles.

## Global rules for script and visuals
1. Peer-reviewed evidence first; every number carries model, harness, benchmark version, and date on screen; narration states the key caveat in one clause.
2. Every scene shows its claims as citation chips; clicking a chip opens an evidence card (source, grade, conditions, caveats, link).
3. "As of 2026-10-08" stamp on every fast-moving fact (leaderboards, versions, policies, adoption).
4. Comparisons with other harnesses use only current, dated first-party docs; historical gaps are labelled with their date. No exclusivity claims for omp features (C01-T11, C04-T11, C09-T9).
5. TUI recreations are labelled "Recreation · omp 18.8.6 defaults"; model IDs shown are illustrative, not endorsements.
6. Never merge different benchmarks/protocols into one chart axis; never add ablation deltas into a waterfall (D03 visual guidance).

---

## Act I — The harness matters

### Ch 0 · Cold open: same model, different harness (1:00)
**Takeaway:** the agent you use is a model *plus* a harness, and the harness alone can move results a lot — in both directions.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 0.1 | In a peer-reviewed Terminal-Bench study, the same model scored very differently depending on the harness — and vendor harnesses won some matchups and lost others. | Two-sided harness matrix: Gemini 2.5 Pro (OpenHands 15.7% → Terminus 2 32.6%), GPT-5 (Terminus 2 35.2% → Codex CLI 49.6%), Opus 4.5 (Claude Code 52.1% → Terminus 2 57.8%), with 95% CIs | C03-N14, C03-N15, C03-N16 (A) |
| 0.2 | Same GPT-4 Turbo, same benchmark: 11% with a shell, 18% with an interface designed for it. | Frozen model icon; interface ring swaps | C03-T1 (A) |
| 0.3 | What this is: an independent, cited tour of the harness layer and of omp, an open harness that wires IDE tooling into the agent. Badge legend; independence disclaimer; "data as of 2026-10-08". | Title card; grade-badge legend | C01-T11 |

### Ch 1 · What a harness is — the 2026 landscape (3:00)
**Takeaway:** "harness" names the machinery around the model; the market is best read along independent axes, and it changes monthly.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 1.1 | Model vs agent vs harness: surveys define agents by planning, memory, perception, action around a model. | Cutaway: model core inside a ring (context, tools, execution, state, policy, orchestration); interfaces outside | C01-T1 (A), C01-T2 |
| 1.2 | The term is useful but not settled — in Oct 2025 Harrison Chase described it as one he was starting to see more often. | Quote card | C01-T3 |
| 1.3 | Read the market along axes, not as a ranking: openness, provider freedom, interface. Codex CLI is Apache-2.0 with custom/local providers; Amp is proprietary but multi-model; one Codex harness sits behind several surfaces; ACP lets editors host independent agents. | 3-axis map with dated product dots | C01-T4, C01-T5 |
| 1.4 | Adoption is real (Stack Overflow 2026: Claude Code 65.5%, Copilot 58.7%, Codex 29.5% of the 12,255 "Used" respondents — overlapping selections), but trust is conditional: 48.0% trust output they can verify, 6.6% trust it with important decisions. | Labelled survey bars + trust split | C01-T6, C01-T7 |
| 1.5 | Agent-authored PRs are now a research dataset: AIDev's paper counts 932,791 (to Aug 1 2025); its later v4 snapshot is a separate count. | Counter animation, two separate labels | C01-T8 (A) |
| 1.6 | Convergence on shared primitives that solve different problems: AGENTS.md, Agent Skills, MCP, ACP, A2A. | Protocol boundary diagram | C01-T9 |
| 1.7 | The map has a date stamp: Windsurf became Devin Desktop, Kimi CLI became Kimi Code CLI, Roo Code announced shutdown. | Map tiles flipping with dates | C01-T10 |
| 1.8 | Where omp sits: open source, multi-provider, deliberately integrated tool surface; a Pi fork by Stencil Labs; its feature categories are not exclusive. | omp dot placed on the axes map | C01-T11 |

### Ch 2 · How harnesses are measured — and how benchmarks mislead (2:45)
**Takeaway:** a score belongs to model + harness + task set + protocol, and "passed" is not "correct".

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 2.1 | Scores are system scores; SWE-bench separates its all-agent board from a bash-only, fixed mini-SWE-agent model comparison. | Protocol conveyor belt (model → scaffold → container → patch → re-grade → score); evaluation harness vs agent harness | C02-T1 |
| 2.2 | Terminal-Bench names both the model and the agent: on TB 2.0, GPT-5.2 scores 62.9% in Codex CLI and 54.0% in Terminus 2. | Paired bars, "system comparison" label | C02-T2 |
| 2.3 | Today's flagships: Terminal-Bench 4.0 (leader: Opus 5.5 in Claude Code, 64.8% ± 3.1) and SWE-bench Pro v2 (642 tasks + HARD-51). Separate panels, never one axis. | Version timeline TB1 → TB4; three separate scoreboard panels | C02-T3, C02-N4, C02-N7 |
| 2.4 | "Verified" isn't infallible: UTBoost found 345 erroneous patches marked passing, changing historical rankings on Lite and Verified. | "Passed vs correct" animation: green tests turn red | C02-T4 (A), C02-N9, C02-N10 |
| 2.5 | Validity cuts both ways (weak tests accept bad fixes; over-specific tests reject good ones); ABC checklist; report cost with accuracy (AI Agents That Matter; HAL's cost–accuracy plane). | Checklist; HAL cost–accuracy scatter (single table) | C02-T5, C02-T6 (A), C02-N11, C02-N12 |
| 2.6 | METR's time horizon is task difficulty in human time at a success probability — not how long an agent can run. | Horizon chart (human duration × success) | C02-T7 |
| 2.7 | Where the alternatives show up: omp has a small third-party SaaS-workflow result (17/30), not a flagship coding-board entry; Hermes and dsh appear in an independent preprint; Pi and dsh in DeepSeek's own evaluation; the Hermes Index compares models inside Hermes. | Evidence map with grade badges | C02-T8, C02-T9, C02-T10, C02-N15 |

### Ch 3 · Same model, better harness: the evidence (3:45)
**Takeaway:** controlled studies show large harness effects, they can be automated — and none of them crowns a universal design.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 3.1 | SWE-agent: shell-only 11.00% → ACI 18.00%; separate ablations for linting, history, viewing, search (not additive). | Frozen model, interchangeable modules; separate ablation bars | C03-T1, C03-T2, C03-N1…N5 (A) |
| 3.2 | CodeAct: executable code actions 74.4% vs JSON 52.4% on composed tools — but JSON wins on atomic calls. | Gain, then reversal flip | C03-T3, C03-N6, C03-N8 (A) |
| 3.3 | Simple can win: Agentless; HAL's same-model scaffold swap (GPT-4.1 2.0% → 44.0%, GPT-5 Medium 12.0% → 46.0%, with cost). | Cost–success scatter from HAL Table A23 only | C03-T4, C03-N10, C03-N12, C03-N13 (A) |
| 3.4 | Context is a harness decision: Lost in the Middle; focused context beats full history (Context Rot, first-party); curated memory took GPT-4o from 19% to 99% on Game of 24 (narrow task); ACE 42.4 → 59.4 on AppWorld. | "Signal, not size" diptych | C03-T5, C03-N24, C03-N25, C03-N26, C03-N28 |
| 3.5 | Harness design can be automated: ADAS, AFlow, Darwin Gödel Machine (held-out Polyglot 14.2% → 28.9%), GEPA (beats RL on some tasks, not AIME-2025); Meta-Harness (same-task caveat). | Automatic-design timeline, three lanes (code / prompt / weights) | C03-T6, C03-T7, C03-N30…N32, C03-N34, C03-N36 |
| 3.6 | Practitioner results, clearly badged first-party: LangChain 52.8% → 66.5% on TB 2.0 (no CI); hashline 6.7% → 68.3% for Grok Code Fast 1 on synthetic React mutations. | Two inset charts with C badges and conditions | C03-T8, C03-T9, C03-N19, C03-N37 |
| 3.7 | No universal best: Diff-XYZ — search/replace helps GPT-4.1, hurts GPT-4.1-nano; more instructions, memory, or reasoning can hurt. | Reversal panel | C03-T10, C03-N22, C03-N23 |
| 3.8 | Models are now trained for harnesses: OpenAI documents training for its patch format; DeepSeek V4.1 trains across several harnesses. → Ch 6. | Bridge animation | C03-T11 |

---

## Act II — Where the field is

### Ch 4 · Claude Code and Codex in 2026: strengths, trade-offs, and the history that mattered (3:00)
**Takeaway:** the mainstream tools are strong and fast-moving; the real decisions are provider freedom, integration depth, policy, and defaults — not missing features.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 4.1 | Steelman: both lead Terminal-Bench 4.0; Codex CLI is Apache-2.0 with custom and local providers; Claude Code documents subagents, LSP plugins, deferred MCP loading. "No subagents / no LSP" is an obsolete criticism. | Current-state card, dated | C02-T3, C04-T2, C04-T5, C04-T11 |
| 4.2 | Attribute failures to the right layer: Anthropic's Sep 2025 quality incident was serving infrastructure, not the harness. | Layered failure map (UI/harness → tools/sandbox → API → serving → review) | C04-T1, C04-T7 |
| 4.3 | Dated history: in 2025, tool metadata could eat context (58 tools ≈ 55K tokens in Anthropic's own example) — since mitigated; creators' late-2025 complaints about control and observability. | Timeline lane "2025" with historical badges | C04-T5, D05 (Zechner Nov 2025, historical) |
| 4.4 | Policy is nuanced, not a blanket ban: Claude Code is under commercial terms; credential-routing rules coexist with the Oct 7 update keeping SDK/non-interactive/third-party usage on subscription limits. | Two-lane policy timeline; weaker-evidence episodes styled as such | C04-T3, C04-T4 |
| 4.5 | Current trade-offs: compaction is not lossless (Claude Code shows context; Codex's compacted state can be opaque); sandbox boundaries and defaults (Claude Code's local Bash sandbox off by default); security record (fixed CVEs; revised ToolLeak shows newer Claude Code hardening). | Trade-off cards, each with strength + cost | C04-T6, C04-T8, C04-T9 |
| 4.6 | Outcomes in the wild: 475 of 567 early Claude Code PRs merged, 214 of them after revisions; benchmark wins ≠ accepted contributions. | PR funnel | C04-T10 (A), C04-T12 |
| 4.7 | The questions that remain: provider freedom, integration depth, deployment scope, what works out of the box. | Four questions → Ch 5 | C04-T11 |

### Ch 5 · Why Pi, omp and Hermes exist (3:00)
**Takeaway:** four projects, four philosophies — not rungs on one ladder.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 5.1 | Four values: control (Pi), the harness interface (omp), persistent learning (Hermes Agent), personal-assistant connectivity (OpenClaw). All MIT core repos. | Philosophy montage with attributed quotes | C05-T10 |
| 5.2 | Pi (Mario Zechner, Nov 2025): "if I don't need it, it won't be built"; four tools, prompt + tools < 1,000 tokens — and on 2026-09-29 Pi added MCP, tool search, codemode. | Quote card; then evolution flip with dates | C05-T1, C05-T2, C05-T3 |
| 5.3 | omp: an explicit Pi fork (repo created 2025-12-31), led by Can Bölük, built by Stencil Labs; integrated LSP, debugger, hash-anchored edits, memory, subagents. Its argument: a model's ability can be obscured by the interface it must use. | Lineage arrow; "IDE wired in" | C05-T4, C05-T5 |
| 5.4 | Hermes Agent (Nous Research, released 2026-02-25): "the agent that grows with you" — memory, reusable skills, terminal + messaging; not the Hermes model family. | Skills/memory loop | C05-T7, C05-T8 |
| 5.5 | OpenClaw: a personal assistant that started as a Pi integration; its runtime is now OpenClaw-owned, Pi-TUI remains a dependency. | Lineage map with dated arrow change | C05-T9 |

### Ch 6 · The next generation: harness–model co-design (2:30)
**Takeaway:** the frontier is models and harnesses shaped together — composable runtimes, training across harnesses, durable execution, open protocols.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 6.1 | DeepSeek Harness: an MIT-licensed agent runtime on Cordis — the loop, model adapter, tools and session storage are all replaceable plugins. "Everything is a plugin" rests on a composability preprint, not a coding-quality proof. | Replaceable agent cross-section; provider swap | C06-T1, C06-T6 |
| 6.2 | DeepSeek V4.1 trains with RL across Claude Code versions, OpenCode, Pi and dsh configurations. | Training distribution expands | C06-T2 |
| 6.3 | Same checkpoint, different harness configs: DSH Minimal 72.6 / Standard 70.5 / PTC 67.6 on DeepSWE (mini-SWE 74.2); TB 2.1 90.6 / 85.8 / 85.8 (mini-SWE 90.3) — vendor-reported, no CI. Independent Claw-SWE-Bench: Hermes ahead of dsh for all three models tested. | Two small-multiple charts + separate independent panel | C06-T3, C06-T4, C06-N1…N6 |
| 6.4 | Interfaces shape reasoning: how tool results are framed and whether prior thinking is kept matters (DeepSeek V3.2; MiniMax M2 69.4 vs 67.2, first-party). | Message-role lanes animation | C06-T5, C06-N8 |
| 6.5 | Other axes: "self-improving" via memories/skills (Prime Agent — including a preserved exploit); background vs crash-survival (durable execution); ACP vs A2A boundaries. | Three meanings of learning; protocol boundary diagram | C06-T8, C06-T9, C06-T10 |

---

## Act III — Multi-agent, done on evidence

### Ch 7 · Multi-agent systems: which pattern fits which task (3:30)
**Takeaway:** "more agents" is not a strategy; match the pattern to the task and verify the result.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 7.1 | Terms: Mixture-of-Agents is a specific layered proposal-and-synthesis method (ICLR 2025). Six mechanisms side by side: single loop, isolated worker, parallel map/reduce, debate, layered MoA, router/cascade. | Mechanism matrix — change one dimension at a time | C07-T1 (A) |
| 7.2 | What extra inference buys: MoA 65.1% vs GPT-4o 57.5% (AlpacaEval 2.0, judge-based); sampling-and-voting; debate gains vs a strong single-model baseline. | Separate panels | C07-T2, C07-T4, C07-T5 |
| 7.3 | Diversity is not the goal: Self-MoA's repeated strongest proposer vs X-MAS's role-specific heterogeneity. | "Diversity is not enough" paired chart | C07-T3 |
| 7.4 | Scale with care: Anthropic's 90.2% internal-eval gain at ~15× the tokens of chat; failure taxonomies (MAST); Science of Scaling v3 — multi-agent helps parallelizable tasks, hurts sequential ones; Cognition's 2026 shift to one writer + clean-context reviewers. | Cost meter; help/hurt split | C07-T6, C07-T8, D07 key numbers |
| 7.5 | Approval ≠ proof: self-preference and superficial code-evaluation biases; evaluators that inspect artifacts do better. | Judge vs artifact-inspector | C07-T9 |
| 7.6 | A coding division of labor that has evidence: strong planner, cheaper scouts, capable editor, evidence-seeking reviewer (HyperAgent; not a fixed recipe). | Role diagram | C07-T7 |
| 7.7 | Eleven principles with confidence badges (strong baseline first; parallelize separable work; one integration owner for coupled edits; contracts not job titles; models by measured role; …). | Animated checklist, High/Medium/Low badges | C07-T10, D07 principles 1–11 |

### Ch 8 · omp's multi-agent toolkit (3:30)
**Takeaway:** omp exposes the primitives those principles need; it does not promise a winning topology, and its defaults favor autonomy over confinement.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 8.1 | Delegation: named specialist agents, batched in the background; children start without the parent's history, so assignments must be contracts (principle 4). | TUI recreation: task batch with context + per-item assignments | C10-T1 |
| 8.2 | Roster and roles: five bundled agents (scout, reviewer, security-reviewer, task, sonic); fifteen model roles decouple the job from the model. | Role-routing board with real model IDs (illustrative, shipped defaults) | C10-T2, C10-T3 |
| 8.3 | Fan-out with one owner: parallel scouts, isolated workspaces, typed results back to the planner (principles 2, 3, 7). | Scout fan-out; isolation lanes merging | D10 MoA feature map |
| 8.4 | Review and verification: an advisor watches the main agent (read-only investigative tools by default; not an approval authority); eval helpers — completion, workpool, judge (typed, not calibrated guarantees). | Advisor timeline; DAG vs workpool split | C10-T4, C10-T6 |
| 8.5 | Oversight: Agent Hub — transcript, model, usage, steer, revive parked workers. | Agent Hub recreation | C10-T5 |
| 8.6 | Limits and safety: yolo is the default approval mode and task children run in yolo; isolation is not a sandbox; concurrency caps differ by mechanism; role candidates ≠ fallback chains. | Safety boundary card | C10-T7, C10-T8, C10-T9 |
| 8.7 | Not multi-agent algorithms: Collab shares a live session with humans; Prewalk is a one-shot model handoff. | Two "not this" cards | C10-T10, C09-T7 |

---

## Act IV — omp in practice

### Ch 9 · Walkthrough I: editing and code intelligence (4:00)
| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 9.1 | Hashline: an edit gets an address — file snapshot tag + original line/block anchors, instead of re-quoting old code. Creator-reported benchmark shown with its conditions. | Addressed-edit animation; benchmark inset (C badge) | C08-T2, C08-T3 |
| 9.2 | Four search jobs: glob (names), grep (text), AST grep (syntax), find (model-judged semantic, may use network); LSP for symbol relationships. | Search decision tree | C08-T4 |
| 9.3 | LSP and DAP in the tool surface: definitions, references, diagnostics, rename; a real debugger with breakpoints and frames. On by default; servers/adapters must be installed. | Static vs dynamic split screen | C08-T1 |
| 9.4 | AST grep and edit: syntax rather than text coincidence (AST grep off by default, AST edit on). | Pattern match highlight | D08 AST section |
| 9.5 | Eval: persistent Python and JS cells (not Jupyter); browser and computer use as eval preludes. | Notebook-like cell recreation | C08-T5, C08-T6 |
| 9.6 | Checkpoint/rewind collapses an investigation into a report — it rewinds context, not files. | Context vs disk rewind | C08-T7 |
| 9.7 | Native Rust layer for search, AST, shell, platform services — not an all-Rust app; Windows x64 and ARM64 targets. | Three-layer architecture | C08-T8 |
| 9.8 | Defaults and prerequisites: approval is not a sandbox; several integrations are opt-in. | Traffic-light prerequisites | C08-T9, C08-T10 |

### Ch 10 · Walkthrough II: context, memory and extensibility (4:00)
| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 10.1 | Four context mechanisms with different lifetimes: project instructions, always-carried rules, on-demand skills, cross-session memory. | Context-layer diagram | C09-T1 |
| 10.2 | Time Traveling Stream Rules: detect a pattern mid-stream, interrupt, inject a rule, retry — a specific mechanism, not a guarantee. | Three TTSR timelines (regex / AST gate / judged) | C09-T2 |
| 10.3 | Compaction, snapcompact (older context rendered to images locally; needs a vision model), handoff. | Dual timeline | C09-T3 |
| 10.4 | Memory is opt-in, five modes; "local storage" ≠ "offline processing". | Backend capability matrix | C09-T4, C09-T5 |
| 10.5 | Sessions are a tree: revisit without deleting; fork creates a new identity. | Tree recreation | C09-T6 |
| 10.6 | Plan mode; Prewalk as a one-shot handoff (off by default). | Plan review recreation | C09-T7 |
| 10.7 | Skills supply instructions, tools execute, extensions register tools and intercept lifecycle; MCP connects external systems. | Extension anatomy | C09-T8 |
| 10.8 | Provider breadth: 79 provider IDs counted in the docs' credential tables (researcher count) — breadth, not exclusivity. | Provider-count card | C09-T9 |
| 10.9 | Secrets: obfuscation is off by default and partial; exports can contain raw context. | Trust-boundary diagram | C09-T10 |

### Ch 11 · Recommended settings, by goal (2:30)
**Takeaway:** settings are trade-offs; pick a goal, apply the matching profile, then measure on your own work.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 11.1 | No evidence selects a universal best model ensemble, thinking level, or fan-out; defaults are starting points. | "No universal preset" card | C10-T11, D07 principle 11 |
| 11.2 | **Safety-first:** `tools.approvalMode: write` or `always-ask`; `tools.approval.eval: prompt`; keep the advisor's read-only tools; `/collab view` for observers; `--config` overlays for demos. | Profile card with per-setting citation chips | D10 recommendation rows (approval, bash/eval boundary, reviewer grants, session sharing, temporary demos) |
| 11.3 | **Cost-conscious:** `task.enableLsp: false` for search-only workers; finite `task.maxConcurrency`; `providers.maxInFlightRequests`; reuse agents via `agent://`; `autolearn.autoContinue: false`. | Profile card | D10 rows (subagent LSP, task parallelism, provider concurrency, retained follow-up, auto-capture) |
| 11.4 | **Max-rigor:** exact `provider/model-id` role selectors; advisor `agent-end` + `syncBacklog: strict`; `schemaMode: strict`; `task.showResolvedModelBadge: true`; cross-family review only as an experiment. | Profile card | D10 rows (worker routing, advisor cadence, typed fan-in, visible model) + D07 principle 9 (Low) |
| 11.5 | Measure: strong single-loop baseline, record model IDs and config, re-evaluate after any model or harness change. | Measurement loop | D07 principles 1, 10, 11 |

---

## Act V — What's next

### Ch 12 · omp²: the next architecture (3:00)
**Takeaway:** omp² is public pre-release work on one idea — shared complexity needs a single owner — with a published register of what is built and what is not. Persistent **pre-release / design** badge and date stamp throughout; schematic visuals, no invented terminal behavior.

| # | Narration intent | Visual | Claims |
|---|---|---|---|
| 12.1 | There is a second omp taking shape: omp², a public Rust rewrite on the `omp2` branch, marked pre-release with breaking changes — not the omp 18.8.6 shown so far. | Two cards: "Released omp 18.8.6" vs "Public omp2 pre-release" | C11-T1 |
| 12.2 | The motivating critique includes omp itself: message history, extension state, background jobs, configuration and UI state each had separate owners — saving the messages wasn't saving the session. | Conversation rewinds while todo / tools / jobs boxes stay at the wrong moment (illustration of the essay's account) | C11-T2 |
| 12.3 | Five commitments: one authoritative session, a trusted control plane, bounded work, explicit compatibility, views as projections. | Five-pillar title card, each badged with its implementation status | C11-T3 |
| 12.4 | One authoritative session: a journal reconstructs a tree holding messages, tools, jobs, todos and queues, so rewind, fork, resume and every view derive from the same state. | Journal events build one tree; scrubber reconstructs a snapshot | C11-T4 |
| 12.5 | Trust boundary and bounded work: the host owns state, routing, approvals and limits; execution crosses a boundary to an obedient stub — explicitly still partial. | Thick trust boundary; capped streams; "partial" tag, no "security solved" shield | C11-T5 |
| 12.6 | Settings and behavior get owners: convars carry scope and persistence; Directors compose across-turn behavior (Plan → ForceTool); a compiled rulebook owns model/provider quirks — part of which already shipped in 18.x. | Convar cards; Director stack; rulebook | C11-T6, C11-T7 |
| 12.7 | The UI becomes a projection: terminal, remote and inspector views consume state; a bounded TLA+ check covers one transcript protocol — not the whole application. | One session feeding three views; evidence badge on the model check | C11-T8, C11-T9 |
| 12.8 | Where it stands (2026-10-08): 36 ADRs — 25 report Implemented, 11 Partial (author-reported); explicit gaps; config migration exists but no upgrade guarantee; no dated release commitment. Developer card links the public branch as pre-release, not a supported migration path. | Built / partial / planned register; closing links to source and releases | C11-T10, C11-T11, D11 component register |

Creator-reported speed figures stay in evidence cards only — their conditions are incomplete (D11 "Open questions").

### Ch 13 · Close (0:45)
Recap the three claims that survive all the evidence: the harness is part of the result; no design wins everywhere; measure on your own work. Independence disclaimer; date stamp; pointer to the references panel and feature atlas.

---

## Feature atlas (unnarrated appendix)
One card per user-facing feature from the D08, D09 and D10 feature tables: purpose, how to invoke, default on/off, prerequisites, docs reference (`omp://…`), and a looping, seekable TUI recreation where omp has a dedicated captured surface (24 of 72 features; the rest have no faithful terminal surface to recreate). Cards for features narrated in Ch 8–10 link back to their scene.
