# 10 — omp multi-agent features and settings
> Slice: OmpMultiAgentSettingsResearch · Researched 2026-10-08 · Scope: Documented multi-agent orchestration, model routing, safety, and configuration for the installed omp 18.8.6; not a performance benchmark.

## Narration-ready takeaways
- “omp can delegate work to named specialist agents, run a batch in the background, and bring each result back into the main conversation. The child starts without the parent's conversation history, so a clear assignment and shared context matter.” [5]
- “The stock agent roster contains five types: scout, reviewer, security-reviewer, task, and sonic. Extra specialists can come from project files, user definitions, extensions, or supported plugin packages.” [6][23]
- “Model roles separate the job from the model: you can change the model behind a reviewer or worker without rewriting the agent's instructions. omp has fifteen built-in roles, and you can define additional chat roles.” [6][7]
- “A second model can review the first as it works. An advisor can inspect source and send concerns or blockers, but it is not an approval authority—and its default investigative tools are read-only.” [12]
- “Agent Hub makes the team visible: you can inspect a worker's transcript, see its model and usage, steer it, and revive it after it has been parked.” [13]
- “omp's eval tool exposes both real subagents and lightweight model calls. A completion has no tools or history; a workpool reuses workers; a judge returns typed assessments.” [9][10][11]
- “Workspace isolation is an integration feature, not a promise that all agent actions are harmless. omp's default approval mode is yolo, and headless task agents are explicitly put in that mode; explicit tool restrictions still matter.” [5][21]
- “There is no single concurrency knob for everything. Task spawns, eval agent handles, workpools, judgments, and provider requests have different limits.” [5][9][8]
- “A role's list of candidate models is not the same thing as a request-failure fallback chain. omp keeps those mechanisms separate, and exact-model fallback rules outrank role rules.” [7][8]
- “Collab is shared control of one running session, not another mixture-of-agents algorithm. Guests can observe or steer the host's existing agents according to the link they receive.” [14]
- “Settings should be explained as trade-offs rather than magic performance switches: LSP-aware workers, extra advisors, larger context windows, and automatic memory capture all change the work the system performs.” [8][12][20][30]

## Findings

### Evidence boundary and official identity

The official identity is established through reciprocal first-party links: `omp.sh` identifies Stencil Labs; its `/install` URL resolves to the installer in `can1357/oh-my-pi`; the repository links back to `omp.sh` and identifies itself as built by Stencil Labs. This is stronger provenance than a repository name guessed from search results. [1][2][3]

The official `v18.8.6` release is non-prerelease and was published at `2026-10-08T19:05:03Z`, as recorded in the opened GitHub release API response. Its notes specifically include fixes for stale judge-role chains, subagent `@advisor` role resolution, queued asides blocked behind wait, and live configuration reload; these are particularly relevant to this walkthrough. The release also introduces per-session `worktree.onStart` and `worktree.onExit` controls; do not confuse session worktrees with task isolation. [4]

This slice uses grade C first-party documentation and pinned source, not peer-reviewed evidence. It establishes what the product documents and exposes—not that a particular model combination improves accuracy or lowers total cost. No agent-mode CLI, model call, benchmark, build, or test was run. Configuration reads were read-only; only schema/default information is included, not the user's model assignments or secrets.

### Exact bundled agents, custom definitions, and precedence

The following is the **bundled** roster at the pinned `v18.8.6` source, not a list inferred from whichever extensions happen to be installed locally. Agent/model/thinking defaults are not guaranteed effective selections: settings overrides can replace them. [6][23]

| Bundled type | Intended assignment and declared surface | Declared model / thinking | Evidence |
| --- | --- | --- | --- |
| `scout` | Fast read-only codebase investigation; declares `read, find, grep, glob, web_search`; structural read summarization is disabled; structured findings include summary, files, architecture, and an optional full report | `@smol`, `medium` | [24] |
| `reviewer` | Quality/security review; declares source/search tools **and bash**, can spawn `scout`; structured verdict and incremental findings | `@slow`; no explicit thinking selector in the opened frontmatter | [25] |
| `security-reviewer` | Read-only vulnerability discovery; declares `read, find, grep, glob, lsp, ast_grep`; structured coverage and findings | No explicit model in the opened frontmatter; use normal parent/default fallback policy | [26][6] |
| `task` | General-purpose delegated multi-step work; shared task prompt; `spawns: "*"` subject to runtime caps | `@task`, `auto` | [23] |
| `sonic` | Strictly mechanical updates or data collection; shared task prompt | `@smol`, `medium` | [23] |

The generic reviewer is **not** equivalent to a capability-confined read-only agent: its declared `bash` tool can execute code. Conversely, a tool appearing in frontmatter does not guarantee it is available: settings, construction prerequisites, spawn policy, plan mode, and depth gates can remove tools or deny a spawn. [25][6][21]

Custom definitions are Markdown with frontmatter, normally under project `.omp/agents/*.md` or user `~/.omp/agent/agents/*.md`. Required fields are `name` and `description`, with body text supplying the system prompt; optional fields include `tools`, `spawns`, prioritized `model`, `thinking-level`/`thinking`, `output`, `blocking`, `autoloadSkills`, `read-summarize`, `prewalk`, and `advisor`. `main` and `sub` are reserved. An explicit empty tools list still grants the hidden result-submission tool `yield`. [6]

Discovery uses first-wins, exact-name deduplication: nearest project OMP agents → user OMP agents → OMP extension-package roots → supported Claude marketplace plugin agents → bundled agents. Direct `.claude/agents`, `.codex/agents`, and `.gemini/agents` are deliberately skipped; plugin support does not mean every foreign agent directory is imported. Project definitions can therefore shadow stock names. [6]

For task dispatch, model precedence is `task.agentModelOverrides[agentName]` → the agent's frontmatter model candidates → parent active model, then configured/default fallback. The task wire schema does **not** accept a per-item `model` field. The public eval `agent()` helper likewise selects a discovered agent, rather than exposing a worker-model argument. Internal bridges/hooks have additional routing abilities and should not be presented as user-callable fields. [5][6][9]

The composer can tag a model with `^`; user-mentioned models become branch-local `m1`, `m2`, … pseudonyms accepted by task, eval `agent()`, and `workpool()`. They use the general task template, not an automatically inferred specialty, and ordinary override/spawn policies still apply. [6]

### Model roles and fallback routing

**Exactly fifteen built-in roles** are documented, counted from these two lists: [7]

- Chat roles: `default`, `smol`, `slow`, `vision`, `plan`, `commit`, `tiny`, `memory`, `task`, `advisor`. `tiny` and `memory` can select chat or tiny catalog models. [7]
- Model-kind roles: `image`, `web`, `speech`, `dictation`, `judge`. These respectively select image generation, search/grounded chat, TTS, STT, and judgment; judge can also select tiny/chat models. [7]

`vision` is image analysis by a chat model; `image` is generation. Assigning `plan` does not enter plan mode; assigning `speech` does not select the main coding model. Custom role names can be introduced through `modelRoles`, `modelTags`, or `cycleOrder`. Role mappings belong in `config.yml`, while provider endpoints/model metadata belong in `models.yml`. [7]

Unset `tiny` resolves through `@smol`; unset `memory` through `@tiny`. Unset `smol` and `slow` inherit an explicitly configured `default` before built-in priority lists. An unset advisor uses an explicitly configured `slow`, otherwise its own strong-model priority chain; it does not simply inherit the current main model. A configured but invalid explicit advisor assignment is not silently replaced. [7][12]

Three distinct mechanisms must not be conflated:

1. **Availability selection:** comma-separated role candidates use the first available match; this is not a per-request retry chain. [7]
2. **Failure recovery:** `retry.fallbackChains` selects exact `provider/model-id` → `provider/*` → live role → `default`. Model-kind roles own their own chains and never borrow the chat `default` chain; an explicit empty role chain disables its fallbacks. Per-agent frontmatter candidate lists additionally become per-spawn primary/fallback chains. There is no `agent:<name>` fallback key. [8]
3. **Context promotion:** an explicitly configured `contextPromotionTarget` can switch to a larger-context model before compaction, with `contextPromotion.enabled`; there is no automatic model-name-derived larger-sibling chain. [7]

Use exact `provider/model-id` selectors when provider identity matters. Bare IDs can resolve differently depending on recent usage and provider priority. Fallback entries without an effort suffix inherit the failing turn's thinking level; explicit suffixes can replace it. [7][8]

### MoA feature map

“Pattern enabled” below is **[INFERENCE] architectural interpretation** of the documented primitives, not a claim of a built-in named algorithm or an accuracy result. [5][9][12]

| Feature | Pattern enabled [INFERENCE] | Configuration / invocation surface | Important constraint | Docs |
| --- | --- | --- | --- | --- |
| Batched `task` | Planner → parallel specialists → integration owner | `task.batch: true`; `{context, tasks:[...]}`; each item supplies self-contained `task` and `solutionSpace` | Children do not inherit conversation history; context is shared across the batch | [5] |
| `scout` specialization | Scout fan-out, compressed evidence back to planner | Select `agent: "scout"`; route with `task.agentModelOverrides` or `@smol` | Scout is research-only, not an implementation or unrestricted reasoning worker | [5][24] |
| Role-backed custom agents | Cross-model executor/reviewer | `model: "@review"` in agent file; concrete `modelRoles.review` in config | A project definition can shadow the bundled reviewer; role name does not confer safety | [6][21] |
| `task` and `sonic` | Capable worker plus mechanical worker tier | Bundled `@task` / `@smol`; per-agent overrides; `task.enableEffort` optionally exposes `lo/med/hi` | `solutionSpace`, not assignment size, feeds task's `auto` thinking classifier | [5][23] |
| Task isolation | Independent edits → controlled integration | Enable `task.isolation.enabled`; request `isolated: true`; `task.isolation.merge: patch` or `branch`; `task.isolation.apply` | Requires Git; failed captures/merges retain recovery artifacts; not arbitrary-code containment | [5][21] |
| Peer messaging and revival | Coordinated workers; feedback to the same reviewer | `write agent://<id>`; broadcast `agent://all`; read `history://<id>` | Outbound messaging requires `write`; parked workers can revive; hard-aborted agents are terminal | [5][13] |
| Per-call schemas | Structured fan-in rather than prose scraping | Task `outputSchema`, `schemaMode`; eval `schema`, `schemaMode`/Python `schema_mode` | Default permissive can accept invalid output with warning after retries; strict fails instead | [5][9] |
| Eval `agent()` plus `wait(handles)` | Acyclic dependency graph / staged waves | `agent(prompt, ...)` returns handle; pass upstream result/artifact downstream; `wait` is a wave barrier | No node waits on its descendant; explicit failure retention is available | [9][10] |
| Eval `workpool()` | Queue of independent items, reusable specialist workers | `.push`, `.status`, `.peek`, `.close`; `eval.workpool.freshAgents` | Reuse shares a worker's accumulated context; fresh mode gives each item a new context; first full drain closes pool | [9] |
| Eval `completion()` | Tool-free independent proposal or synthesis | `completion(prompt, model="default"/"smol"/"slow", schema=...)` | Stateless, no tools/history; not a full agent session | [9][11] |
| `judge()` / `judge_batch()` | Rubric-based ranking/classification of candidate results | `modelRoles.judge`; choice, bool, score questions; host-owned batch over states | Same configured judge role is not automatically a heterogeneous judge ensemble | [9][11] |
| Kernel-defined tools | Workers access a shared controlled function/data interface | Python `@tool`, JS `tool(fn, ...)`; pass names in `tools` | Calls execute in parent kernel; children do not inherit its variables; plan mode rejects sharing | [9] |
| Advisor + `WATCHDOG.yml` | Continuous critique, specialty reviewers, synchronous final review | `advisor.enabled`; `modelRoles.advisor`; named roster entries and cadence/backlog controls | Default is advisory, not approval; optional mutating tools require trust | [12] |
| Prewalk | Strong planning → cheaper/faster continuation | `prewalk.enabled` or `/prewalk`; task-specific frontmatter / `task.prewalk` / `task.agentPrewalk` | One session changes model once; not two independent agents debating | [22][6] |
| Agent Hub / background jobs | Human supervision of parallel agents | `Alt+A`, tree/activity view, steer/revive/kill; `/jobs`; `proc://` | `/agents` is definition/settings management, **not** the live hub | [13][15] |
| Collab | Human team observes/steers the same orchestration | `/collab view` or `/collab`; guests join link | Host executes tools; full link grants steering/subagent control; advisor rows are not shared | [14] |

### Concrete examples reproduced from official docs

These are documentation examples, **not applied settings, not endorsed current model rankings, and not proof the named models are available to this user**. Literal selectors are retained from the cited examples rather than silently updated. [6][7][12][18]

**Role-backed reviewer — custom agent frontmatter and matching configuration.** This example intentionally uses `reviewer`, so its custom definition can shadow the bundled reviewer. Because it omits `tools`, do not present it as a read-only grant. [6]

```md
---
name: reviewer
description: Review a change for correctness.
model: "@review"
---

Review the assigned change and report concrete findings.
```

```yaml
modelRoles:
  review: openai/gpt-5.4:high
```

The documented task dispatch example: [6]

```json
{
  "context": "Review the current change in this repository.",
  "tasks": [
    {
      "agent": "reviewer",
      "task": "Report concrete correctness findings.",
      "solutionSpace": "Review cause and failure modes are open; no known defect."
    }
  ]
}
```

**Per-agent routing through named roles.** The docs use this example for `vibe_spawn`'s `fast` → sonic and `good` → task tiers; the same `task.agentModelOverrides` mapping also governs ordinary task agent resolution. [6]

```yaml
task:
  agentModelOverrides:
    sonic: "@fast_worker"
    task: "@good_worker"
modelRoles:
  fast_worker: openai/gpt-5-mini
  good_worker: openai/gpt-5.4:high
```

**Continuous versus final review.** First enable the advisor subsystem with the documented config; the separate roster example keeps turn review asynchronous while final review waits synchronously. `strict` removes the wall-clock cap but releases on abort/failure and other documented stop conditions; it is not proof every final answer has passed a successful review. [12]

```yaml
modelRoles:
  advisor: anthropic/claude-sonnet-4-5:medium
advisor:
  enabled: true
```

```yaml
advisors:
  - name: Turn reviewer
    reviewMode: turn
    syncBacklog: off
  - name: Final reviewer
    reviewMode: agent-end
    syncBacklog: strict
```

**Judgment routing, not an automatic ensemble.** The source's role/chain example uses the following mapping. Candidates are fallbacks, not concurrent voting members. A true multi-model judge ensemble would need explicit orchestration and an aggregation policy; none is established as an omp default here. [8][9][11]

```yaml
modelRoles:
  judge: typesafe/jev-latest
retry:
  fallbackChains:
    judge:
      - typesafe/jev-preview
      - "@tiny"
      - "@smol"
      - "@default"
```

**Different compaction triggers for different agent types.** The docs explicitly show this configuration; it is an example of precedence, not evidence that these thresholds are optimal. [8]

```yaml
compaction:
  thresholdTokens: 40000
task:
  agentCompactionThresholdOverrides:
    scout: "80%"
    task: 90000
```

For planner/executor narration, the official prewalk example is simply `prewalk: { enabled: true }`, with `@smol` as the default target, or `omp --prewalk-into openai/gpt-5-mini`. No command was run. The handoff occurs at the completed assistant-turn boundary containing the eligible edit/write result, after the todo gate when that tool exists; “at the first edit” is a simplification, not the precise boundary. [22]

### Structured output, helpers, and asynchronous lifecycle

The task output precedence is per-invocation `outputSchema` → frontmatter `output` → parent session schema. `schemaMode: strict` makes retry-exhausted invalid results fail; `permissive` can retain them with a warning. Invalid caller schemas fail preflight. Parsed data can be read through paths such as `agent://<id>/reports/0/data`; nested child IDs use dots, not JSON-path slashes. Schema validation constrains shape, not factual correctness. [5][6] **[INFERENCE] Therefore a typed review should still carry source anchors and reproducible checks.**

The eval helper distinctions matter for both cost accounting and orchestration: `completion()` is a tool-free one-shot call; `agent()` is a background child session; `workpool()` reuses full workers for multiple items; `judge()` is typed assessment, and `judge_batch()` applies common questions over multiple states. A bool answer is a probability, not a JavaScript/Python boolean. Score answers use probability-weighted rubric level indices; do not treat them as benchmark accuracy. [9][11]

The eval docs recommend judge rather than completion for classification/yes-no/ranking, and `judge_batch` rather than a loop of `judge` for multiple states. This is official operational guidance; “cheap and fast” is the docs' characterization, not an independently measured latency/cost result. [11]

`wait(handles)` in eval waits for every supplied handle and returns values in input order; it can retain failure objects with `raise_errors=False` / `raiseErrors: false`. The **tool** `wait` is different: it takes no job selector and returns on a caller-owned result, peer message, or steering interruption. Results auto-deliver, so the docs direct agents to continue useful work rather than poll. Workpools have no `pool.wait()`; leave eval and use the tool when completely blocked. [9][10][15]

Completed task agents remain idle and can receive follow-up messages; default idle parking is `420000` ms. Parked agents can revive from history, retaining their workspace when isolated and kept alive. Hard cancellation ends the instance. Prefer messaging a context-bearing existing agent for follow-ups instead of spawning a blank replacement—the task docs expressly recommend this. [5]

Concurrency is layered, not one global “32 agents” guarantee: task spawns use a session-scoped semaphore; each workpool has its own live-worker cap; eval `agent()` does not take a `task.maxConcurrency` slot and instead counts against background-job capacity; completion/judgment requests share a separate fixed process-wide request semaphore. Provider-level request limits are another control and can span local omp processes using one config root. [5][9][8]

### Advisor, watchdog, and human oversight

Advisor-style architectures are not unique to omp. Anthropic's official April 9, 2026 announcement documents a Claude Platform advisor tool in which a Sonnet/Haiku executor decides when to consult Opus; that advisor does not call tools or produce user-facing output. omp's documented advisor instead reviews transcript updates on a configured cadence and may have investigative tools. These are different implementations of assistance/review—not evidence that Claude lacks multi-model orchestration, nor that Anthropic's reported evaluation gains transfer to omp. [33][12]

`WATCHDOG.md` contains advisor-only review priorities, not the main agent's ordinary instruction context. `WATCHDOG.yml` defines one or more named advisors with their own models, tools, instructions, cadence, and backlog policy. Default investigative tools are `read`, `grep`, `glob`, and optionally recall. An explicit roster may grant mutating tools, so “advisors can never edit” would be wrong. An isolated advisor ToolSession has separate tool state; it is not necessarily a separate filesystem. [12]

Advisors receive new transcript deltas, including reasoning and tool activity, and filter previously injected advice to avoid reviewing their own advice recursively. Notes use `nit`, `concern`, or `blocker`. Delivery depends on turn state and host mode: deliberate user interruption and plan mode can preserve notes as visible cards instead of resuming the agent; late turn-mode concerns do not automatically reopen terminal answers. Advisors can be wrong; the docs explicitly tell the primary to weigh advice rather than blindly obey. [12]

`advisor.syncBacklog: off` favors primary throughput; `1` is the closest bounded synchronous mode, waiting up to 30 seconds; `3` and `5` allow more lag; `strict` waits without a wall-clock cap. The docs' `agent-end` + strict pattern supplies synchronous final review boundaries, but failures release waits. This is an orchestration trade-off, not a correctness gate equivalent to passing tests. [12]

Agent Hub (`Alt+A`) is for watching the live/persisted team, inspecting transcripts, filtering activity, steering, revival, and killing. `/agents` separately configures agent definitions and model overrides. Advisor transcript rows in the local Hub are observational, not messageable/revivable/killed peers; Collab excludes them. [13][14]

### Settings inventory: defaults, not this user's effective settings

All defaults below are **as of the accessed 18.8.6 documentation/schema on 2026-10-08**. An effective configuration may differ. The full schema is larger than this quality/cost/safety/multi-agent-focused inventory; the settings docs explicitly describe their own catalog as partial. [8]

| Key | Type | Default | Effect / caution | Source |
| --- | --- | --- | --- | --- |
| `modelRoles` | record | `{}` | Primary workload selectors; supports custom chat roles | [8] |
| `modelRoleStorage` | enum | `global` | `project` saves role assignments to cwd `.omp/config.yml`, not arbitrary settings | [8] |
| `modelPresets` | record | `{}` | Named role + default-thinking snapshots; switching is persistent, not merely a visual toggle | [7][8] |
| `enabledModels` / `modelProviderOrder` | arrays | `[]` / `[]` | Chat-model scope; provider preference for ambiguous IDs | [7][8] |
| `enabledProviders` / `disabledProviders` | arrays | `[]` / `[]` | First opts foreign config discovery in; second can disable model/discovery providers; not synonymous controls | [8][18] |
| `defaultThinkingLevel` | enum | `high` | `minimal, low, medium, high, xhigh, max, auto`; actual model support matters | [8] |
| `thinkingBudgets.{minimal,low,medium,high,xhigh,max}` | numbers | `1024, 2048, 8192, 16384, 32768, 32768` | Token budgets only on transports supporting budget-style reasoning; not a universal effort cap | [8] |
| `providers.autoThinkingMaxEffort` | enum | `xhigh` | Auto-classifier ceiling, with documented model-required-effort exceptions | [8] |
| `temperature` / `topP` / `topK` / `minP` / `presencePenalty` / `repetitionPenalty` | numbers | each `-1` | Negative leaves provider/model default unsent | [8] |
| `task.batch` / `task.speculativeLaunch` | booleans | `true` / `true` | Batched schema; may launch a closed task item while the batch still streams, subject to authorization | [5][27] |
| `task.maxConcurrency` | number | `32` | Task semaphore; `0` unlimited, not a quality recommendation or full eval-spawn limit | [5][9] |
| `task.maxRecursionDepth` | number | `2` | Depth gate; negative removes cap | [5] |
| `task.softRequestBudget` / `task.softRequestBudgetNotice` | number / boolean | `200` / `true` | Wrap-up notice at budget; force-stop at 1.5×; `0` disables budget | [5][27] |
| `task.maxRuntimeMs` / `task.agentIdleTtlMs` | numbers | `0` / `420000` | No hard runtime limit by default; idle sessions park after TTL, `<=0` disables parking | [5] |
| `task.enableEffort` / `task.maxEffort` | boolean / enum | `false` / `max` | Expose per-spawn coarse effort; maximum hint level from `minimal` through `max` | [5][32] |
| `task.agentModelOverrides` / `task.disabledAgents` | record / array | `{}` / `[]` | Exact agent-name model routing and disabling | [6][27] |
| `task.enableLsp` | boolean | `false` | Allow worker LSP; explicitly off by default to keep workers cheap | [30] |
| `task.isolation.enabled` / `task.isolation.apply` | booleans | `false` / `true` | Enable isolated-spawn option; automatically integrate successful captured changes when apply is on | [5][27][31] |
| `task.isolation.merge` / `task.isolation.commits` | enums | `patch` / `generic` | Patch or branch integration; generic or AI nested-repo commit messages | [5][27] |
| `task.prewalk` / `task.agentPrewalk` | boolean / record | `false` / `{}` | Generic task handoff; per-agent on/off/target overrides | [5][6][27] |
| `task.agentAdvisor` | record | `{}` | Per-agent advisor opt-in/model, overriding frontmatter; children default to no advisor | [5][8] |
| `task.showResolvedModelBadge` | boolean | `false` | Display actual subagent model ID in task widget | [27] |
| `task.agentCompactionThresholdOverrides` | record | `{}` | Exact agent-name token or percentage trigger; overrides model triggers | [8] |
| `tier.{openai,anthropic,google}` | enums | each `none` | Provider-specific service tier, not reasoning level | [8] |
| `tier.subagent` / `tier.advisor` | enums | `inherit` / `none` | Workers can inherit main fast tier; advisors standard by default | [8][12] |
| `task.agentServiceTierOverrides` / `task.agentAccountPools` | records | `{}` / `{}` | Per-agent tier or provider OAuth account pool; pools fail rather than borrow unlisted accounts; not model routing | [6][8] |
| `providers.maxInFlightRequests` | record | `{}` | Positive per-provider request limits shared across local processes/config root; omitted provider unlimited | [8] |
| `retry.enabled` / `retry.modelFallback` | booleans | `true` / `true` | Recovery and model fallback controls | [8] |
| `retry.maxRetries` / `retry.baseDelayMs` / `retry.maxDelayMs` | numbers | `10` / `500` / `300000` | Per-request retry bound and delay controls | [8] |
| `retry.fallbackChains` / `retry.fallbackRevertPolicy` | record / enum | `{}` / `cooldown-expiry` | Explicit routing; recover primary after suppression expires, or `never` stay on fallback | [8] |
| `retry.usageAwareFallback` / `retry.waitForUsageReset` | booleans | `false` / `false` | Optional quota-aware recovery; authoritative long reset waits can hold workers | [8] |
| `retry.usageReservePct` / `retry.usageReservePolicy` | number / enum | `10` / `confirm` | Protect quota; `confirm` without UI auto-falls back, unlike `fail-closed` | [8] |
| `tools.approvalMode` / `tools.approval` | enum / record | `yolo` / `{}` | `always-ask` allows reads; `write` allows reads+writes; `yolo` all tiers; explicit policies remain | [8][21] |
| `bash.allowCompoundCommands` | boolean | `false` | Opt-in limited literal `&&` approval handling; not containment | [8][21] |
| `tools.maxTimeout` | number | `0` | No settings cap on requested tool timeout; tool-specific rules still apply | [8] |
| `async.enabled` / `async.maxJobs` | boolean / number | `true` / `100` | Background work enabled; running-job capacity separate from task concurrency | [8][9] |
| `bash.autoBackground.enabled` / `.thresholdMs` | boolean / number | `true` / `60000` | Long commands move to managed background jobs | [8] |
| `eval.py` / `eval.js` / `eval.tools.enabled` | booleans | each `true` | Retained runtimes and shareable kernel-defined tools | [8][9] |
| `eval.workpool.freshAgents` | boolean | `false` | Reuse workers versus fresh context for every item | [8][9] |
| `eval.autoBackground.enabled` / `.thresholdMs` | boolean / number | `false` / `60000` | Optional long-cell backgrounding; messages can trigger early backgrounding | [9] |
| `lsp.enabled` / `lsp.lazy` / `lsp.shared` | booleans | each `true` | IDE navigation; on-demand startup; one server per project through broker when available | [8] |
| `lsp.diagnosticsOnWrite` / `.diagnosticsOnEdit` / `.formatOnWrite` | booleans | `true` / `false` / `false` | Diagnostics/format work triggered by mutation type | [8] |
| `extendedContext` / `contextPromotion.enabled` | booleans | `false` / `false` | Larger windows and explicit promotion opt-ins; larger windows can consume more usage | [7][8] |
| `compaction.enabled` / `.asyncEnabled` / `.midTurnEnabled` | booleans | each `true` | Automatic/background/safe-mid-turn compaction; subagents always check mid-turn | [8] |
| `compaction.methodOrder` | array | `[remote, snapcompact, handoff, shake, soft]` | Ordered strategy fallback; no one method assumed available | [8] |
| `compaction.thresholdPercent` / `.thresholdTokens` | numbers | `-1` / `-1` | Reserve-based unless overridden; positive tokens wins over percentage | [8] |
| `compaction.reserveTokens` / `.keepRecentTokens` | number / number | unset / `20000` | Unset reserve generally max(`16384`, 15% window), with small-window exception | [8] |
| `compaction.modelThresholds` / `.modelThresholdsEnabled` | record / boolean | `{}` / `true` | Exact-model or longest-prefix trigger; agent override wins | [8] |
| `memory.backend` | enum | `off` | `off, local, hindsight, mnemopi, sharpshooter`; settings catalog omits the fifth option | [20][28] |
| `autolearn.enabled` / `.autoContinue` | booleans | `false` / `false` | Experimental capture guidance / extra private capture turns | [8] |
| `advisor.enabled` / `.reviewMode` / `.reviewInterval` | boolean / enum / number | `false` / `turn` / `1` | Opt-in review cadence; roster entries carry their own cadence | [12] |
| `advisor.syncBacklog` / `.immuneTurns` / `.maxNotesPerUpdate` | enum / number / number | `off` / `3` / `4` | Wait policy, concern cooldown, non-blocker note cap | [12] |
| `ttsr.enabled` / `.builtinRules` | booleans | `true` / `true` | Rule monitoring and stock rule loading | [19][29] |
| `ttsr.judge` / `.interruptMode` / `.contextMode` | enums | `auto` / `always` / `discard` | Judgment-gated rules; interrupt scope; handling partial output | [19][29] |
| `ttsr.repeatMode` / `.repeatGap` / `.disabledRules` | enum / number / array | `once` / `10` / `[]` | Once per session or after-gap repetition; ignored rule names | [19][29] |
| `providers.cacheRetention` / `.cacheWarming` | enums | `auto` / `idle` | Retention policy; warming can make additional model requests even while idle | [8] |
| `secrets.enabled` | boolean | `false` | Configured secret obfuscation/credential-shaped redaction before provider requests | [8] |
| `collab.autoStart` | enum | `off` | `view` or `control` automatically hosts sessions; links grant access | [14] |

### Configuration layers, environment, and credentials

Effective settings priority is declared setting environment variable → runtime overrides → later CLI overlays → project → global → defaults. Objects deep-merge, arrays replace wholesale, and named presets resolve as whole entries. Native project settings use the launch cwd's `.omp`, not an ancestor walk; agent-definition and watchdog discovery have their own different rules. Ordinary settings commands write global config; `modelRoleStorage: project` is a narrow exception for role assignments. [8][16]

Relevant process controls include `PI_SMOL_MODEL`, `PI_SLOW_MODEL`, `PI_PLAN_MODEL`; `PI_PY`/`PI_JS`; `PI_CONFIG_FILES`; and `OMP_PROFILE` (`PI_PROFILE` fallback). A profile isolates OMP settings/auth/sessions/caches, while project and enabled foreign configurations still follow their documented discovery paths. Explicit `--profile` wins over environment selection. [8][16][17]

Credential precedence is **not** settings precedence: runtime key → explicit `models.yml` key → stored OAuth → login-sourced API key → extension fallback → environment → other stored key. Provider availability is only a configuration check, not successful authentication. A `models.yml` `apiKey` token interpreted as an environment variable becomes literal text if that variable is unset; the docs tell launchers to verify it is nonempty. Never show secrets during a demo: `omp config list` masks credential values, whereas an explicit `omp config get <credential-key>` returns them unmasked. [7][8][18]

### Safety boundaries that must be visible in the walkthrough

The default `tools.approvalMode` is `yolo`. Task children are forced to yolo because headless sessions cannot answer prompts, but per-tool deny/prompt policies remain meaningful: a required prompt without an interactive UI fails instead of silently granting permission. The parent's restrictive **mode alone** must not be sold as a child-execution sandbox. [5][21]

Bash pattern rules control the bash tool, not commands launched through eval or the whole process's access. Official docs explicitly recommend an eval prompt/deny policy alongside bash patterns when the goal is to gate eval's shell path. Workspace copies/worktrees separate changes for integration; they do not establish network, credential, or arbitrary filesystem confinement. [21][5]

Plan-mode subagents are more narrowly constructed: tools become `read`, `grep`, `glob`, `web_search`, plus eligible `ast_grep`; spawns and prewalk are cleared, LSP/IRC are disabled, and isolation/eval-defined tools are rejected. This is a real mode distinction, not merely a planner prompt. [5][6]

TTSR monitors declared streams and matches regex, AST, or judged conditions. AST matching is checked before tool execution; regex stream interruption discards or keeps the partial message according to settings and retries with the rule injected. AST rules see source-bearing payloads, not necessarily the whole future file. **[INFERENCE] TTSR is a corrective guidance mechanism, not a complete security policy or proof no unsafe behavior can occur.** [19]

### Recommended-settings table: conditional, evidence-linked, not a universal preset

Labels: **Official guidance** is explicitly recommended or prescribed by docs. **[INFERENCE] behavior-justified** is a recommendation derived directly from documented semantics for the stated goal; it is not a measured accuracy/cost optimum. Confidence describes the configuration rationale, not comparative model performance.

| Setting / practice | Recommended value or action, for the stated goal | Justification and recommendation class | Source | Confidence |
| --- | --- | --- | --- | --- |
| Worker model routing | Exact `provider/model-id` via named `modelRoles` and role-backed agent overrides when provider identity matters | **Official guidance:** exact selectors remove ambiguity; role-backed examples keep concrete choice separate from instructions | [6][7] | High |
| Reviewer tool grants | Keep default read-only investigative advisor tools unless model/workspace are trusted | **Official guidance:** mutating advisor grants require trust; a reviewer label is not a safety control | [12] | High |
| Interactive approval | `tools.approvalMode: write` when workspace edits are authorized but code execution should prompt; `always-ask` when edits should prompt too | **[INFERENCE] behavior-justified:** these values implement those goals; yolo does not. Not inherited confinement for children | [21][5] | High for semantics |
| Bash/eval boundary | Explicit `tools.approval.eval: prompt` or `deny` when bash policy must not be bypassed through eval | **Official guidance:** eval can spawn a shell outside bash pattern rules; headless prompts can fail work | [21] | High |
| Subagent LSP | `task.enableLsp: false` for cheap search-only delegation; enable `true` when workers need LSP-aware navigation | **Official guidance in schema:** off keeps workers cheap; enable when worth extra tokens. No quantified savings promised | [30] | High for trade-off |
| Visible worker model | `task.showResolvedModelBadge: true` for a cross-model demonstration | **[INFERENCE] behavior-justified:** shows actual model rather than implying an override resolved as intended | [27] | High for observability |
| Task parallelism | Keep a finite `task.maxConcurrency`; do not set `0` merely because more workers sound better | **[INFERENCE] behavior-justified:** `0` removes task bound. Exact finite value depends on limits and budget; default `32` is a starting default, not an optimum | [5][9] | High for boundedness; no optimal count |
| Provider concurrency | Use `providers.maxInFlightRequests` for an actual provider-request cap | **[INFERENCE] behavior-justified:** this is the documented cross-process per-provider limiter, unlike task concurrency. Value must follow the user's provider limit | [8] | High |
| Retained agent follow-up | Message an existing agent through `agent://` instead of a fresh spawn | **Official guidance:** it retains relevant context; parked agents revive | [5] | High |
| Typed fan-in | `schemaMode: strict` when downstream code requires valid structured results | **[INFERENCE] behavior-justified:** permissive can return invalid data after retries; strict fails. Validate factual claims separately | [5][9] | High for shape only |
| Classification/ranking | Use `judge`; multiple states use `judge_batch` | **Official guidance:** preferred helper for this workload; no independent cheap/fast measurements in this slice | [11] | High for supported workflow; unmeasured cost |
| Advisor cadence | `agent-end` + `syncBacklog: strict` only when final-review completion matters more than bounded latency; asynchronous turn review otherwise | **Official documented pattern:** final-review wait versus primary throughput; failures still release waiters | [12] | High for semantics |
| Auto-capture | Keep `autolearn.autoContinue: false` when avoiding extra autonomous capture turns is the goal | **[INFERENCE] behavior-justified:** enabling performs a private extra-token turn; memory mode itself is a separate decision | [8] | High |
| Background provider traffic | `providers.cacheWarming: off` when the goal is no cache-warming requests while idle | **[INFERENCE] behavior-justified:** warming otherwise replays requests; may sacrifice cache savings, so not a lowest-total-cost claim | [8] | High |
| Session sharing | `/collab view` rather than control sharing when the audience only needs observation | **[INFERENCE] behavior-justified:** view link cannot prompt/interrupt/control agents; still exposes readable session content | [14] | High |
| Memory use | Treat recalled memory as heuristic and recheck against current source | **Official guidance:** current repo/user instructions outrank conflicting memory | [20] | High |
| Temporary demos | Use documented `--config` overlays rather than silently changing machine-wide policy | **[INFERENCE] behavior-justified:** overlays are process-local; do not show commands that write the user's config without consent | [8] | High |

No evidence here selects an optimal default/smol/slow model, thinking level, memory backend, number of advisors, compaction threshold, or fan-out count. Those are explicit decisions below, not guesses disguised as best practices.

## Key numbers

| Claim/metric | Value | Conditions (model, harness, benchmark/version, date) | Source [n] (location) | Grade |
| --- | --- | --- | --- | --- |
| Release publication | `2026-10-08T19:05:03Z` | omp `v18.8.6`, GitHub release API, as of access 2026-10-08; not a benchmark | [4] `published_at` | C |
| Built-in model roles | **15**, counted here from 10 chat + 5 model-kind roles | Documented role list for accessed installed docs, 2026-10-08 | [7] “Role aliases and settings” | C |
| Bundled agent types | **5**, counted here | Pinned `v18.8.6`; plugins/custom definitions excluded | [23] `EMBEDDED_AGENT_DEFS` | C |
| Task concurrency default | `32`; `0` unlimited | Task SpawnRun semaphore, not all eval agents; as of 2026-10-08 | [5] “Limits & Caps” | C |
| Recursion default | `2`; negative disables cap | Task/eval spawn policy, as of 2026-10-08 | [5] “Limits & Caps” | C |
| Background jobs | Default and documented eval maximum `100` | Session-wide jobs shared with nested/background activity; not 100 model requests | [9] “Limits and errors” | C |
| Completion/judgment request cap | `32` | Shared process-wide semaphore; separate from task count | [9] “judge() and judgment batches” | C |
| Soft request budget | `200`; forced wrap-up at `1.5×` | Per subagent; `0` disables; bundled scouts/sonic may cap lower | [5] “Limits & Caps” | C |
| Agent idle parking | `420000` ms, documented as 7 min | Default task idle TTL; `<=0` keeps live | [5] “Limits & Caps” | C |
| Advisor review defaults | Every `1` eligible update; `4` non-blocker notes | Default advisor `turn` cadence; note range `1–32`; blockers exempt | [12] “Default advisor settings” | C |
| Bounded advisor catch-up | Up to `30` seconds | `syncBacklog` values `1`, `3`, `5`; strict has no wall-clock cap | [12] “Catch-up” | C |
| Tool wait safety cap | `30` minutes | Caller-owned job/service wait, no user-selectable timeout | [15] “Behavior” | C |
| Default compaction reserve | Larger of `16384` tokens and `15%`, with small-window exception | Accessed defaults; not an optimized benchmark threshold | [8] “Context, compaction, and memory” | C |
| Isolated baseline cap | `1 GiB` | Each repository's uncommitted snapshot; overflow fails before spawn | [5] “Limits & Caps” | C |

These are configuration/runtime limits, not success-rate measurements. No omp-specific runs, confidence intervals, benchmark splits, or measured quality gains were established in this slice; Anthropic's separate advisor evaluation is not an omp benchmark. [33]

## Contested or uncertain

- **Memory enum drift:** settings.md lists four choices, but memory.md and the read-only schema list five including `sharpshooter`. The inventory uses the schema-confirmed enum. [8][20][28]
- **Task model fallback wording:** task.md summarizes settings → frontmatter → task role/session fallback, whereas the focused discovery page spells settings → frontmatter → parent active/default. The pinned bundled generic task itself declares `@task`, which explains why task-role routing applies to that type without proving a universal implicit task-role default for every custom agent. Use the focused precedence and pinned definition together. [5][6][23]
- **Isolation follow-up wording:** task.md explicitly notes a current follow-up template calls isolated runs non-resumable even though the retained-workspace lifecycle allows parking/revival. Narrate the documented lifecycle and flag the stale hint rather than claiming isolation forbids follow-up. [5]
- **“Mixture of agents” is descriptive here:** documented primitives support heterogeneous delegation, review, and aggregation, but do not establish a particular research-paper MoA algorithm, automatic majority vote, independent-error assumption, or optimal ensemble topology. [5][9][12]
- **Judgment probabilities are model output, not calibrated guarantees:** the docs specify their data shape and score semantics, not real-world calibration or measured defect-detection accuracy. [11]
- **Source-only verification:** source/docs support these claims, but no end-to-end runtime demo was executed. Provider availability, account entitlement, price, and throughput for example selectors remain untested. [18]

## Corrections & nuances to the blueprint

- Replace the tentative role list with the exact fifteen-role list; add `vision`, `tiny`, `memory`, `task`, `advisor`, `image`, `web`, `dictation`, and `judge` where the abbreviated list omitted them. [7]
- Do not describe every locally listed specialist as bundled. The stock five are confirmed in pinned source; others can be user/project/extension/plugin additions. [6][23]
- “Task has per-agent model overrides” is correct; “put `model` in a task item” is not the documented API. [5][6]
- Collab is multi-user session sharing, not an additional autonomous worker or voting architecture. [14]
- Prewalk is a one-shot model handoff inside a session, not a parallel planner/executor pair. [22]
- Do not say that all workers inherit parent history, that task concurrency bounds every eval agent, that all reviewers are read-only, that yolo is merely a one-time optional toggle, or that worktrees are a complete sandbox. The docs contradict each simplification. [5][9][21][25]
- “Recommended settings” must be conditional on cost, latency, trust, provider limits, and workflow. Defaults are not benchmark-derived best practices; this dossier intentionally does not crown a best model ensemble. [8][12][18]

## Open questions for the user

1. Is the video demonstrating the shipped defaults, the user's existing setup, or a deliberately selected teaching configuration? Which deviations should be visibly labelled?
2. Which actual providers/models may be named or used in the eventual recorded demo, and what total model-call spend is authorized? Documentation examples here are not recommendations of current model quality.
3. Should the main demonstration optimize understandable sequencing, lowest spend, shortest elapsed time, or final-review rigor? This determines fan-out, worker reuse, effort, and advisor cadence.
4. Should edit-capable workers be allowed at all in the recorded session, and what trust/approval policy should the audience see? Prompt-heavy policies can block headless workers rather than forwarding every question to a human. [5][21]
5. Is long-term memory wanted, and if so should storage/processing be local or remote? “Local storage” alone does not mean no model processing: the documented local summary pipeline performs model extraction/consolidation. [20]
6. Should the walkthrough teach paper-style proposal/aggregation ensembles, or practical coding delegation with one integration owner and specialist review? omp supports primitives for both, but the video should not imply they are identical.
7. Should a final advisor wait be allowed to extend the demo without a time cap (`strict`), or should visible bounded/asynchronous review be used? [12]
8. Should viewers only observe through a view link, or is interactive guest steering part of the demonstration? Both expose session content, and a control link grants substantially more power. [14]

## Unverified leads

- No peer-reviewed or controlled evaluation of an **omp-specific** model-role/agent/advisor combination was established in this slice. Link general MoA research from the separate research slice only with its own conditions; do not transfer its effect sizes to omp.
- No optimal `task.maxConcurrency`, worker `auto` thinking policy, compaction trigger, advisor ensemble size, or prewalk cost/accuracy curve was established.
- No live credentials/model entitlements were probed, and no named documentation-example model was called.
- No full runtime containment/security audit was performed; documented permission/isolation limitations are reported without claiming untested exploits.

## Visual ideas

- **Role-routing board:** show the fifteen roles grouped into chat and model-kind columns; draw agent → role → concrete provider/model. Animate an exact-model fallback row overriding a role row. Supported by the role list and precedence, not a leaderboard. [7][8]
- **Scout fan-out scene:** one main planner sends distinct self-contained investigations with shared context; result cards return schema fields rather than whole transcripts. Overlay “children start without conversation history.” Later code execution would need separate authorization. [5][24]
- **Cross-model reviewer scene:** display the official `@review` agent/config example, then show the actual resolved model badge and Agent Hub's transcript/usage inspector. Avoid implying the example selector is the best reviewer. [6][13][27]
- **DAG versus workpool split-screen:** left: named handles, dependency arrows, wave barriers; right: independent item queue feeding reusable workers. Highlight fresh-agent mode as new context, and mark the different concurrency caps. [9][10]
- **Judge scene:** show two candidate artifacts evaluated under the same explicit rubric, with bool answers rendered as probabilities. A separate caption says “one judge role is not an automatic multi-model ensemble.” [9][11]
- **Advisor timeline:** main-agent turns above, asynchronous turn review below, then an `agent-end` strict final-review boundary. Show concerns that become visible cards instead of forcing a restart when the user has interrupted. [12]
- **Isolation/integration scene:** two workspace lanes produce patch artifacts, then a controlled merge into the parent. Keep a visible warning “workspace separation ≠ arbitrary-code sandbox”; show conflict/recovery as a documented possibility, not a staged measured failure. [5][21]
- **Lifecycle scene:** `running → idle → parked → revived`; animate `write agent://id` returning a parked worker. Label default idle TTL `420000 ms (7 min)`, not measured execution time. [5][13]
- **Human oversight scene:** `Alt+A` opens live Hub; `/agents` opens definition management; `/collab view` adds a human spectator rather than another model node. [13][14]
- **Settings precedence stack:** defaults, global, project, overlays, runtime, setting env. Show an array replaced rather than concatenated and avoid displaying the user's actual credentials. [8][16]

## References

[1] Stencil Labs. “omp — a coding agent with the IDE wired in.” omp.sh, 2026. https://omp.sh/ . Grade: C. Accessed 2026-10-08.

[2] oh-my-pi maintainers. “OMP Coding Agent Installer.” Official repository, 2026. https://omp.sh/install (resolved to https://raw.githubusercontent.com/can1357/oh-my-pi/main/scripts/install.sh). Grade: C. Accessed 2026-10-08.

[3] oh-my-pi maintainers / Stencil Labs. “oh-my-pi repository and README.” GitHub, 2026. https://github.com/can1357/oh-my-pi . Grade: C. Accessed 2026-10-08.

[4] oh-my-pi maintainers. “v18.8.6 release.” GitHub, 2026. https://api.github.com/repos/can1357/oh-my-pi/releases/tags/v18.8.6 ; human link https://github.com/can1357/oh-my-pi/releases/tag/v18.8.6 . Grade: C. Accessed 2026-10-08. Opened API metadata and complete release body.

[5] oh-my-pi maintainers. “task.” Bundled omp documentation, 2026. omp://tools/task.md . Grade: C. Accessed 2026-10-08.

[6] oh-my-pi maintainers. “Task Agent Discovery and Selection.” Bundled omp documentation, 2026. omp://task-agent-discovery.md . Grade: C. Accessed 2026-10-08.

[7] oh-my-pi maintainers. “Model and Provider Configuration.” Bundled omp documentation, 2026. omp://models.md . Grade: C. Accessed 2026-10-08. Relevant opened sections: provider/model configuration, credentials, runtime resolution, role aliases, presets, context promotion.

[8] oh-my-pi maintainers. “Settings.” Bundled omp documentation, 2026. omp://settings.md . Grade: C. Accessed 2026-10-08. Relevant opened sections: storage/precedence, models, advisor, thinking, sampling, retry, tools/approvals, shell/eval/LSP, context/memory, providers/services.

[9] oh-my-pi maintainers. “eval.” Bundled omp documentation, 2026. omp://tools/eval.md . Grade: C. Accessed 2026-10-08.

[10] oh-my-pi maintainers. “Eval agents and workpool helper reference.” Runtime tool documentation, 2026. xd://eval/agents . Grade: C. Accessed 2026-10-08.

[11] oh-my-pi maintainers. “Eval judgment and completion helper reference.” Runtime tool documentation, 2026. xd://eval/judge . Grade: C. Accessed 2026-10-08.

[12] oh-my-pi maintainers. “Advisor, WATCHDOG.md, and WATCHDOG.yml.” Bundled omp documentation, 2026. omp://advisor-watchdog.md . Grade: C. Accessed 2026-10-08. Opened enabling, cadence, tools/isolation, delivery, catch-up, failures, watchdog files and roster examples.

[13] oh-my-pi maintainers. “Agent Hub.” Bundled omp documentation, 2026. omp://agent-hub.md . Grade: C. Accessed 2026-10-08.

[14] oh-my-pi maintainers. “Collab: Live Session Sharing.” Bundled omp documentation, 2026. omp://collab.md . Grade: C. Accessed 2026-10-08. Opened live sharing, guest permissions, link security, settings, hosting boundary.

[15] oh-my-pi maintainers. “wait.” Bundled omp documentation, 2026. omp://tools/wait.md . Grade: C. Accessed 2026-10-08.

[16] oh-my-pi maintainers. “Configuration Discovery and Resolution.” Bundled omp documentation, 2026. omp://config-usage.md . Grade: C. Accessed 2026-10-08. Opened roots, profiles, settings registry/layers.

[17] oh-my-pi maintainers. “Environment Variables (Current Runtime Reference).” Bundled omp documentation, 2026. omp://environment-variables.md . Grade: C. Accessed 2026-10-08. Opened dotenv loading, auth, proxy sections; role/feature environment overrides additionally documented in [8].

[18] oh-my-pi maintainers. “Providers.” Bundled omp documentation, 2026. omp://providers.md . Grade: C. Accessed 2026-10-08. Opened provider/model identity, availability, credentials, environment mappings.

[19] oh-my-pi maintainers. “TTSR Injection Lifecycle.” Bundled omp documentation, 2026. omp://ttsr-injection-lifecycle.md . Grade: C. Accessed 2026-10-08. Opened discovery/defaults, streaming/AST matching, interruption/retry, persistence.

[20] oh-my-pi maintainers. “Autonomous Memory.” Bundled omp documentation, 2026. omp://memory.md . Grade: C. Accessed 2026-10-08. Opened backend list, usage guidance, local pipeline and model selection.

[21] oh-my-pi maintainers. “Tool approval mode.” Bundled omp documentation, 2026. omp://approval-mode.md . Grade: C. Accessed 2026-10-08.

[22] oh-my-pi maintainers. “Prewalk.” Bundled omp documentation, 2026. omp://prewalk.md . Grade: C. Accessed 2026-10-08.

[23] oh-my-pi maintainers. “Bundled agent definitions — agents.ts.” GitHub source, tag v18.8.6, 2026. https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/task/agents.ts . Grade: C. Accessed 2026-10-08.

[24] oh-my-pi maintainers. “Bundled scout agent.” GitHub source, tag v18.8.6, 2026. https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/prompts/agents/scout.md . Grade: C. Accessed 2026-10-08. Opened frontmatter and initial instructions.

[25] oh-my-pi maintainers. “Bundled reviewer agent.” GitHub source, tag v18.8.6, 2026. https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/prompts/agents/reviewer.md . Grade: C. Accessed 2026-10-08. Opened frontmatter and initial procedure.

[26] oh-my-pi maintainers. “Bundled security-reviewer agent.” GitHub source, tag v18.8.6, 2026. https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/prompts/agents/security-reviewer.md . Grade: C. Accessed 2026-10-08. Opened frontmatter.

[27] oh-my-pi maintainers. “Task settings schema/default annotations.” Read-only runtime settings surface, 2026. cfg://task . Grade: C. Accessed 2026-10-08. Only default annotations and descriptions used; user-specific effective assignments intentionally excluded.

[28] oh-my-pi maintainers. “memory.backend schema.” Read-only runtime settings surface, 2026. cfg://memory.backend . Grade: C. Accessed 2026-10-08. Type/default/enum only used.

[29] oh-my-pi maintainers. “TTSR settings schema/default annotations.” Read-only runtime settings surface, 2026. cfg://ttsr . Grade: C. Accessed 2026-10-08. Defaults/enums only used.

[30] oh-my-pi maintainers. “task.enableLsp schema and guidance.” Read-only runtime settings surface, 2026. cfg://task.enableLsp . Grade: C. Accessed 2026-10-08. Default false; explicit cost/enablement guidance.

[31] oh-my-pi maintainers. “task.isolation.enabled schema.” Read-only runtime settings surface, 2026. cfg://task.isolation.enabled . Grade: C. Accessed 2026-10-08. Default/type only used.

[32] oh-my-pi maintainers. “task.maxEffort schema.” Read-only runtime settings surface, 2026. cfg://task.maxEffort . Grade: C. Accessed 2026-10-08. Default/type/enum/description only used.

[33] Anthropic. “The advisor strategy: Give agents an intelligence boost.” Claude Platform announcement, April 9, 2026. https://claude.com/resources/articles/the-advisor-strategy . Grade: C. Accessed 2026-10-08. Opened complete article and evaluation footnotes; cited here only for the distinct documented architecture, not an omp performance claim.
