# 06 — Next-generation harnesses and harness–model co-design
> Slice: NextGenHarnessResearch · Researched 2026-10-08 · Scope: Official DeepSeek Harness profile, its research connections, cross-harness evidence, and complementary next-generation directions.

## Narration-ready takeaways
- DeepSeek Harness is not another language model. It is DeepSeek’s MIT-licensed agent runtime, built on Cordis so that even the agent loop, model adapter, tools, and session storage are replaceable plugins. [1][2][3]
- The research story has advanced beyond “train a model for one harness.” DeepSeek’s V4.1 report describes reinforcement learning across multiple Claude Code versions and across OpenCode, Pi, and DeepSeek Harness configurations. [13]
- The same model does not get the same score in every harness. In DeepSeek’s controlled V4.1 comparison, the simplest DeepSeek Harness configuration scored above its Standard and programmatic-tool configurations on both reported coding benchmarks. [13]
- That does not make DeepSeek Harness the universal winner: mini-SWE scored higher on DeepSWE, and an independent preprint found Hermes ahead of DeepSeek Harness with each of its three tested models. These are benchmark-specific results, not a ranking of every developer workflow. [13][24]
- Tool protocols and retained reasoning matter. DeepSeek-V3.2’s report warns that representing tool results as user messages can interfere with reasoning retention; MiniMax reports measurable losses when prior thinking is discarded. [11][21]
- “Everything is a plugin” has a real software-design paper behind it, but that paper is a preprint about composability—not a peer-reviewed demonstration that dsh writes better code. [3][5]
- Peer-reviewed work already shows how closely training and the inference interface can interact: SWE-smith converts expert function calls into a different student format and uses a specific tool-output retention policy. [17]
- “Self-improving” can mean editing memories, skills, and instructions without changing model weights. Prime Agent explicitly uses that meaning—and reports a case where refinement preserved an exploit as a reusable skill. [25]
- Running in the background and surviving a crash are different capabilities. Prime Agent separates sessions from the UI, while Anthropic and Temporal describe durable execution boundaries and external event histories. [25][26][27]
- ACP connects a user-facing client to an agent; A2A connects independent agentic applications. Neither protocol is a research result establishing the best internal multi-agent architecture. [28][30]
- omp² is more than an unexplained teaser: Stencil’s official architecture essay describes journal-derived session state, a trusted control plane, bounded execution, explicit compatibility, and multiple views of the same state—but labels the architecture partly built and partly still in progress. [32][33]

## Findings

### 1. Official-source identity and the dsh product profile

**Identity established.** The official repository is `github.com/deepseek-ai/deepseek-harness`, whose README identifies DeepSeek AI as its developer, links `deepseek.com`, and points to `deepseek-harness.github.io/deepseek-harness/` as documentation. The source branch opened here is **`master`**, not `main`. The official package named by that README is **`@deepseek-ai/dsh`**; a similarly named package or desktop wrapper should not be substituted merely because its name contains “DeepSeek.” [1]

**Access limitation, not an identity substitution.** The candidate landing pages `https://www.deepseek.com/harness/en`, `/harness/en/`, and `/en/harness/`, plus `https://api-docs.deepseek.com/updates/`, could not be fetched in this session; a browser attempt also failed. The profile below therefore rests on the official repository and its linked documentation, not on lookalike landing pages.

| Aspect | Officially supported description, as of 2026-10-08 | Evidence |
| --- | --- | --- |
| Status | Experimental **developer preview**, with compatibility-breaking changes expected. The safety notice explicitly says it has **not undergone a security audit** and must not be treated as secure or production-ready. | [1][10] |
| License | MIT; copyright © 2026 DeepSeek. Permission includes modification and redistribution, subject to retaining copyright and permission notices; no warranty. | [2] |
| Public release date | **Not officially established from accessible sources in this session.** August 13, 2026 is excluded from the official profile; see Unverified leads. | Research limitation; not promoted from [36][37] |
| Runtime architecture | Cordis plugins supply services, typed events, and reversible effects through a shared context. Model adapters, tool registry, session log, and agent loop are all replaceable through configuration. | [3] |
| Composition | Profiles compose ordered plugin bundles plus user/CLI patch layers. Shipped templates are `web`, `headless`, `sdk`, `sdk-minimal`, and `acp`; Desktop owns a separate reserved profile. | [3] |
| Web interface | `npx @deepseek-ai/dsh web` starts the local Web UI at `http://127.0.0.1:3080` by default. This is a documented command, **not executed during this research**. | [1] |
| Desktop | Official Electron application wraps the complete Web application and bundles its matching runtime; it is not a separate agent implementation. The desktop documentation covers macOS/Windows behavior and other platform-specific implementation details, but this dossier does not infer a complete current downloadable-platform matrix from source code alone. | [3][8] |
| Automation surfaces | Headless one-shot runner, TypeScript/Python SDK access, and an ACP application profile. | [3] |
| Default capabilities | File read/write/edit, shell execution, web search, public HTTP(S) fetch, subagents, task/goal tracking, durable sessions, workspace-write policy and risky-action approvals. MCP resources/client integration is provided; unconfigured scopes expose no MCP tools. | [6] |
| Models | DeepSeek by default; documented catalog examples include Anthropic, OpenAI, Moonshot/Kimi, and Z.ai/GLM. Custom endpoints support OpenAI Chat Completions, OpenAI Responses, and Anthropic Messages protocols. Compatibility still depends on the endpoint’s actual semantics. | [7] |
| Authentication caveat | The **Models settings UI** does not yet support OAuth-sign-in providers such as Codex. This does **not** mean dsh cannot delegate to Codex: a different provider integrates the real Codex app-server as a subagent. | [7][9] |
| Delegation | Fresh or history-seeded in-process children; out-of-process children via ACP, Codex app-server, Claude Agent SDK, or another dsh runtime; continuation, adjacent-agent messaging, interrupt, and status discovery. | [9] |
| Experimental teams | Opt-in Agent Teams add durable roster, task board, and mailbox over continuable subagents. The V4.1 report additionally describes a trained Team configuration. | [3][13] |

**Profiles are not benchmark modes.** The application profiles above determine how dsh is launched. V4.1’s evaluation instead compares **Minimal**, **Standard**, and **PTC** agent configurations: Minimal exposes one bash tool; Standard has 26 initial function tools; PTC lets the model write TypeScript through `run_code` over 24 underlying tools. Standard/PTC use a custom dated build in that experiment. These counts and modes describe the report’s configuration—not a promise about every current dsh install. [3][13, Appendix B.1]

**Persistence and replaceability are concrete, bounded claims.** The architecture says every model-visible request must be reconstructable from the session log, and session consumers derive model history, forks, resumes, and projections from durable events. It also explicitly notes that a hard process loss before stream settlement leaves no durable attempt stream. Avoid turning “traceable” into an unlimited guarantee that every in-flight byte or every external side effect is recoverable. [3]

**Safety and data handling belong in a fair profile.** The documented default policy confines file writes to the workspace and asks before risky actions, but the safety notice warns that sandboxing and approval prompts do not guarantee isolation. The base bundle describes feedback-triggered OTel upload of a complete canonical session prefix, including context, and a separate default-on DeepSeek session-log contributor. Therefore “runs locally” must not be narrated as “all data stays local.” [6][10]

### 2. What Cordis contributes—and what its paper does not establish

The official Cordis repository calls itself a **meta-framework of spatiotemporal composability**, links the design paper, and warns that its API is not yet stable. The paper’s official repository calls the work a **preprint under active revision**. The current arXiv record has v1 dated August 26, 2026; no peer-reviewed acceptance is established here. [4][5]

The abstract separates two problems:
- **Temporal composability:** completely reverting a component’s effects upon removal, modeled through revertible context transformations.
- **Spatial composability:** declaring dependencies and reactively activating/deactivating components as the context changes.
- **Combined mechanism:** one context mediates effects and coeffects; a calculus models dynamic composition; Cordis implements effect tracking, dependency resolution, configuration reconciliation, and hot module replacement. [5]

In dsh, that translates into mounting a plugin beside other plugins instead of patching a privileged application core. Registrations unwind on unload, and model, filesystem, subprocess, tool, and subagent providers sit behind explicit capability seams. [3]

**[INFERENCE] The defensible novelty claim is depth of replaceability and formalized lifecycle composition, not the invention of plugins.** Neither the paper abstract nor the product documentation establishes priority over all earlier plugin systems. Nor does a proof about mediated runtime effects imply that deleting files, sending email, or invoking arbitrary third-party code can magically be undone. [3][5][10]

### 3. The strongest direct research connection: DeepSeek-V4.1 trains across harnesses

V4.1 is a much stronger answer to “the research backing it” than merely attaching the older V3.2 report to dsh. Its September 17, 2026 v1 report explicitly names dsh in **training**, **inference comparisons**, and **multi-agent experiments**. [13]

**The training system.** Section 5.1 says the post-training recipe remains SFT → RL → on-policy distillation, with no claimed new optimization algorithm. The emphasis is automated task/environment synthesis, verification, quality filtering, difficulty calibration, and scaling trajectories. Coding environments come from difficult/failing contributed sessions and public repositories; specialized agents construct, attempt, inspect, and repair those environments. [13, §§5.1–5.1.1]

**Not dsh-only tuning.** Figure 7 describes RL in dsh Minimal; Figure 8 describes joint RL across multiple Claude Code versions and heterogeneous scaffolds including OpenCode, Pi, and dsh Standard/PTC. A worker container normalizes interactions into a common trajectory schema while a separate agent sandbox runs the actual scaffold and tools. Both are outside the preemptible GPU-training pool. The report also merges checkpoints from different scaffold/configuration runs. [13, §5.1.2, Figures 7–8]

**What this implies.** **[INFERENCE]** A harness is part of the model’s operating distribution: prompts, message roles, tool schemas, state retention, and turn-taking can all be learned conditions. But “models are tuned to specific harnesses” is only half the story: this report explicitly trains for **diversity across harnesses**, not exclusivity to one product. [11][13][17][22]

**What is actually controlled.** Section 5.3.4 holds the V4.1 checkpoint, decoding configuration, and task set fixed while changing the harness, including native prompts, schemas, and turn logic. This is direct evidence of a harness-dependent performance difference. It is **not** proof that all evaluated harnesses were unseen during training: several are explicitly in the training mixture. [13]

**Trainable collaboration.** Section 5.3.5 describes Team-mode RL with task reward, a collaboration bonus for delegation/communication, and a derived-latency penalty calculated from a dependency DAG’s critical path. This is more specific than prompting an untrained model to “use subagents.” The reported comparison is preliminary and selects strongest observed multi-agent configurations against strongest available single-agent baselines; it is not an equal-dollar or equal-token proof that more agents always help. [13]

### 4. DeepSeek research lineage and broader co-design evidence

This is a **research map**, not a cross-paper leaderboard: the studies change different combinations of models, data, inference budgets, tools, and selection procedures. “Harness relevance” does not mean “the improvement came from the harness alone.” [11][13][16][17][18]

| Work / current source version | Venue / grade | Harness-relevant claim | Key numbers and conditions | What it does not prove |
| --- | --- | --- | --- | --- |
| **SWE-RL**, final proceedings paper | **NeurIPS 2025 Main Conference; A**, venue confirmed on proceedings page | RL teaches single-response search/replace patch generation from issue plus file context. **Agentless Mini** is simplified to match that training task. This is **not interactive tool-use RL**. [16] | Llama3-SWE-RL-70B: **41.0%** SWE-bench Verified; **500 generated patches/issue**, temperature **1.0**, top **30 reproduction tests** for reranking, then one submitted patch. §3.1/Table 1. [16] | The final submission’s “pass@1” label does not mean one generated trajectory. The limitations explicitly acknowledge that the external pipeline prevents learning from interaction feedback. [16] |
| **SWE-smith**, final proceedings paper | **NeurIPS 2025 Datasets and Benchmarks; A**, venue confirmed | Rejection-sampling fine-tuning on successful SWE-agent trajectories. Teacher native calls are converted to student XML; student inference keeps the five most recent tool outputs. [17] | **5,016** trajectories train Qwen2.5-Coder-Instruct-32B into SWE-agent-LM-32B; **40.2%** SWE-bench Verified in one attempt, **75-step** limit, temperature **0.0**. Dataset itself: **50,137 tasks**, **128 repositories**. §§2–4, Table 3, Appendix F.1. [17] | Not RL in this experiment, and not an unseen-harness transfer study; training and evaluation use SWE-agent. [17] |
| **DeepSWE-Preview**, July 2, 2025 research article | Agentica / Together AI; **C** | Qwen3-32B is post-trained with RL through rLLM/R2E-Gym, using bash, search, file editor, and finish actions with executable-test reward. [18] | **42.2%** SWE-bench Verified pass@1 averaged over **16 runs**, **64K** context and **100** environment steps; **59.0%** uses hybrid best-of-**16** selection. §§2–4/Figures 10–11. [18] | Not a harness-only gain, not cross-harness transfer, and not the later **DeepSWE v1.1 benchmark**, despite the shared name. [13][18] |
| **Kimi K2**, arXiv **2507.20534v2**, February 3, 2026 | Technical report; **B** | Real/synthetic tool trajectories and Gym-like RL; tool/task synthesis plus executable coding environments. Multiple inference setups are reported. [19] | Same Kimi-K2-Instruct: SWE-bench Verified **51.8%** Agentless, **65.8%** agentic single attempt, **71.6%** multiple attempts/internal verifier. Agentic uses bash/editor; non-thinking, **128K** context. §4.1.1/Table 3. [19] | Different selection budgets confound a simple “harness gain.” Multiple deployments do not establish held-out-harness generalization. [19] |
| **GLM-4.5**, arXiv **2508.06471v1**, August 8, 2025 | Technical report; **B** | Agentic SFT, multi-turn tool RL, executable-test reward, and XML-like tool encoding; malformed tool calls terminate traces with zero reward. [20] | **64.2%** SWE-bench Verified using **OpenHands v0.34.0**, **100** iterations, **128K** context, temperature **0.6**, top-p **1.0**. §4.2.3/Table 5. [20] | The report also evaluates Claude Code, but does not establish that Claude Code was excluded from training. [20] |
| **MiniMax-M2**, November 3, 2025 retention article and generalization guide | First-party technical posts; **C** | Preserve interleaved reasoning in subsequent requests; separately, training data perturb tools, prompts, environments, and responses to reduce scaffold brittleness. [21][22] | Retain/discard thinking: SWE-bench Verified **69.4 / 67.2**; Tau² **87 / 64**; BrowseComp **44.0 / 31.4**. Vendor ablation; sample counts, CIs, and complete harness settings not supplied. [21] | Qualitative cold-start-scaffold generalization claims have no published numerical transfer matrix in the opened guide. [22] |
| **Qwen3-Coder**, original July 22, 2025 release | Qwen official research/release blog; **C** | Execution-driven and long-horizon multi-turn RL; co-released Qwen Code customizes prompts, parser, and function-calling support. [23] | Infrastructure supports **20,000 independent environments in parallel**. This is concurrency capacity, not the number of tools, tasks, or demonstrations. [23] | Co-release does not establish that training used Qwen Code specifically. Original Qwen3-Coder is not Qwen3-Coder-Next. [23] |
| **DeepSeek-V3.2**, arXiv **2512.02556v1**, December 2, 2025 | Technical report; **B** | Agentic task synthesis and explicit thinking-retention/message-role rules; synthetic-agent-only RL ablation improves downstream tool tasks. [11] | **1,827** synthesized general-agent environments (§3.2.3); introduction says **over 1,800** environments and **85,000** complex prompts. These are different units. [11] | Its internal evaluation framework should not automatically be renamed “the publicly released dsh.” [11] |
| **DeepSeek-V4**, arXiv **2606.19348v1**, displayed April 26, 2026 | Technical report; **B** | XML-based `DSML` tool encoding, retained thinking across user turns in tool-calling scenarios; minimal in-house coding framework and long-context architecture. [12] | Coding evaluation: bash plus file-edit tools, **500** interaction steps, **512K** context (§5.3.1), despite native **1M** context capability. [12] | Model context capacity is not the context actually used in every evaluation. This preview report does not establish dsh’s public launch date. [12] |
| **DeepSeek-V4.1-Flash**, arXiv **2609.19969v1**, September 17, 2026 | Technical report; **B** | Explicit multi-scaffold RL, fixed-checkpoint harness comparison, and collaboration/latency-aware Team training. [13] | **Eight configurations / six scaffold families**; DeepSWE **N=8**, Terminal-Bench **N=3** samples/task. Table 4 and Appendix B.1; full results below. [13] | Multi-scaffold training plus multi-scaffold evaluation is not proof of transfer to every unseen harness. [13] |
| **DSec**, arXiv **2609.22978v1**, September 19, 2026 | DeepSeek / Tsinghua technical report; **B** | Sandbox infrastructure co-designed with RL: stateful rollouts survive GPU preemption; FnCall/container/microVM/full-VM backends have different isolation and resource trade-offs. [39] | A production scale unit spans **nearly 160 CPU nodes**; **about 3 M** sandboxes/day, peak **~380K** concurrent, creation rate **exceeding 5,000/s** (§2.4). [39] | This is training infrastructure scale, not the throughput of a laptop running dsh. [39] |

**A particularly useful mechanism example: V3.2.** It retains historical reasoning while tool messages accumulate, but discards reasoning when a new user message arrives. It specifically warns that Roo Code/Terminus-style tool-as-user-message representations may miss the benefit. Its Terminal-Bench 2.0 result of 46.4 uses Claude Code in thinking mode, whereas 39.3 uses Terminus in non-thinking mode—**two variables change**, so their difference is not a clean harness-only effect. Its SWE-bench robustness range of 72–74 across other settings is a useful counterweight to any claim of total harness lock-in. [11, §§3.2.1, 4.1]

**V4 changes the contract again.** For tool-calling scenarios it retains reasoning across user-message boundaries; for ordinary conversation it retains the prior discard-on-new-user strategy. Its report still warns about frameworks that simulate tools through user messages. A blanket recommendation to strip, retain, or summarize all thinking identically across providers is therefore not justified. [12, §5.1.1]

**Practical implication for an omp settings segment. [INFERENCE]** Prefer provider-aware adapters and measure the exact model/tool-format/context combination rather than assuming that “OpenAI-compatible” means semantically identical. dsh’s own settings guide documents role, token-cap, thinking-format, and modality compatibility switches; the research shows why such differences can matter. This is not a recommendation to change any installed settings during research. [7][11][12][21]

### 5. Benchmarks: official comparisons versus independent evaluation

#### DeepSeek’s own fixed-model comparison

These are **vendor-reported research results**, not independently reproduced scores. All rows use **DeepSeek-V4.1-Flash**, maximum reasoning effort **100**, Linux task containers, temperature **1.0**, top-p **0.95**, **1M-token** context, and **500** model-generation rounds. DeepSWE v1.1 uses **N=8 samples/task**; Terminal-Bench v2.1 uses **N=3** and **no network access**. The report does not give confidence intervals for Table 4. [13, §5.3.4]

| Harness/configuration | DeepSWE v1.1 resolved | Terminal-Bench v2.1 pass@1 | Exact configuration qualification |
| --- | ---: | ---: | --- |
| Claude Code | 69.8 | 88.0 | **v2.1.251**, Claude Agent SDK/native tools. [13] |
| Codex | 65.6 | 84.1 | **v0.147.0**, app-server mode with **adapted tool schemas**. [13] |
| OpenCode | 65.5 | 85.0 | **v1.18.15**, build agent, shell/file tools/native delegation. [13] |
| Pi | 66.2 | 86.1 | **v0.84.2**, RPC plus search extension; not an unmodified stock Pi comparison. [13] |
| mini-SWE | 74.2 | 90.3 | `mini_swe_v2` port, upstream commit **04d809ceab9df28f9adaed044884180159172930**, single bash tool and submission marker. [13] |
| DSH Minimal | 72.6 | 90.6 | Single bash tool; **exact Minimal build not specified in Appendix B.1**. [13] |
| DSH Standard | 70.5 | 85.8 | **v0.1.1+custom.202609011522**, full SDK profile, 26 initial tools. [13] |
| DSH PTC | 67.6 | 85.8 | Same custom build; `run_code`, TypeScript over 24 underlying tools. [13] |

**Read the result fairly.** DSH Minimal has the highest point estimate on Terminal-Bench, while mini-SWE has the highest on DeepSWE. Standard/PTC do not exceed Minimal on either benchmark. **[INFERENCE]** This is an excellent visual rebuttal to “more built-in machinery automatically means a higher benchmark score,” not a reason to remove features users need for other workloads. Differences as small as 90.6 versus 90.3 should not be called statistically significant without uncertainty analysis. [13]

The official model card also publishes these rows, and its evaluation folder supplies a reference Pier patch and reproduction commands for dsh-minimal/mini-swe-agent, with pinned Pier and DeepSWE repository commits. The dsh SDK command uses **`0.1.5.*`**, a version range rather than one immutable package artifact; the instructions also warn that the patch is a reference to adapt. **Reproduction materials available** is not the same as **independent reproduction completed**. [14][15]

#### Independent evidence exists, but is not replication of the same table

**Claw-SWE-Bench v2**, September 28, 2026, is an independently authored preprint—not a DeepSeek technical report and not confirmed peer-reviewed here. Its full-350 benchmark spans **350 issues, 43 repositories, eight language groups**, using a common task prompt, task-specific Docker environments, cleaned future Git history, blocked external network except inference, **3,600-second** timeout, concurrency **three**, and **three runs per harness/model pair**. The native system prompts/tooling remain part of the harness variable. Model APIs are routed through OpenRouter. [24, §§3, 5, Appendices A–B]

| Model | DSH pass@1 | Hermes pass@1 | Interpretation |
| --- | ---: | ---: | --- |
| GLM 5.1 | 69.1% | 73.1% | Independent benchmark point estimates; not dsh’s own benchmark. [24, Table 2] |
| Qwen 3.6-flash | 56.8% | 62.8% | Same full-350 protocol within this model group. [24, Table 2] |
| DeepSeek-V4.1-Flash | 76.5% | 81.7% | Same model label, different benchmark and integration from DeepSeek’s Table 4. [24, Table 2] |

Exact dsh/Hermes artifact versions and complete decoding settings are not specified in the opened paper’s main table/appendices; its appendix refers to the released README for harness-specific settings. No confidence intervals are supplied for these Table 2 means. Consequently these numbers are **bounded independent evidence**, not a timeless ranking of current releases. [24]

**[INFERENCE]** The honest answer to “are dsh benchmarks independently verified?” is: there is independent evaluation of dsh, but this dossier does not establish an independent reproduction of the exact V4.1 Table 4 experiments. These are different claims. [13][24]

### 6. What is genuinely new, and is dsh the right exemplar?

| Candidate story | Evidence-based assessment |
| --- | --- |
| “A new coding agent with tools, plans, memory, and subagents” | **Not an exclusive differentiator.** Current Claude Code documentation already describes tools, memory, parallel agents, hooks, scheduled work, and multiple user interfaces; omp advertises integrated IDE tools and subagents. [33][35] |
| “Open source versus closed mainstream harnesses” | **Too broad.** dsh is MIT, but Codex CLI is already Apache-2.0. Openness alone does not separate dsh from all mainstream products. [2][34] |
| “Everything—including the loop—is replaceable” | A substantiated dsh architectural choice. **[INFERENCE]** Its distinguishing emphasis is pervasive composition with lifecycle-managed dependencies, not just a marketplace of tool extensions; no first-in-history claim established. [3][5] |
| “Models and harnesses are co-designed” | Directly supported by V4.1’s multi-scaffold RL, schema normalization, Team reward, and controlled inference comparison. **[INFERENCE]** This is the best reason to feature dsh prominently. [13] |
| “The new harness is smarter than Claude Code/Codex/omp” | Unsupported as a universal claim. DeepSeek’s table runs **DeepSeek’s model inside each harness**, not each vendor’s best native model; omp is not included. Independent Claw results favor Hermes over dsh on the cited cells. [13][24] |
| “Programmatic tool calling always wins” | Contradicted as a blanket rule by the reported DSH PTC point estimates. Expressivity and convenience are not synonymous with higher accuracy on a fixed benchmark. [13] |
| “Self-improving framework” | Replaceability enables modification; it does not by itself demonstrate autonomous improvement. Distinguish plugin authoring from training model weights and from persistent memory/skill refinement. [3][13][25] |
| “Safe hot-swapping means safe autonomy” | Not supported: the official dsh safety notice expressly warns against treating preview software as secure or production-ready. [10] |

**Recommendation to the user. [INFERENCE]** Use dsh as **one compelling exemplar** of two converging directions: a deeply composable agent runtime, and models trained against real, varied harness interfaces. Pair it with an independent benchmark caveat and with other projects that solve different problems. The evidence does not support a single linear ladder where Claude Code and Codex are obsolete, dsh is the unquestioned next step, and omp automatically inherits superiority. [3][13][24][26][34][35]

### 7. Other substantiated next-generation directions in 2026

**Persistent, revisable harness state — Prime Agent.** Its latest opened report is arXiv v1, August 24, 2026; the manuscript also states first publication August 5. It separates fixed model weights, active context, persistent REPL/subagents, and disk-backed histories/memories/skills. Refinement modifies versioned supplemental instructions, facts, executable skills, and reusable agent roles at turn boundaries; the base prompt remains immutable. This is explicitly fixed-weight “self-improvement.” [25, §§2.2–2.5]

The daemon allows work to continue after UI detachment. A reported seven-day Sonnet 5 Factorio trajectory uses **23.4 million output tokens**, completes **24 of 196 technologies**, and reaches **71%** on advanced-circuit research. The same section reports a separate trace that saved a resource-spawning exploit as a skill. These are case studies, not population-level success rates; retaining behavior can retain mistakes or gaming as well as knowledge. [25, §3.5]

**Durable execution and independent state — Anthropic Managed Agents.** The April 8 engineering article separates harness, sandbox, and append-only session log so implementations can fail or be replaced independently. A failed harness can be restarted from the external event log, while context management remains a transform over durable session data. It also reports that a context-reset workaround for Sonnet 4.5 became dead weight with Opus 4.5. This is first-party architecture evidence, not a proof that every long-running task finishes correctly. [26]

**An outer harness around inner SDKs — Temporal.** The August 20 announcement describes Temporal Workflows around existing inner harnesses, durable waits for approvals/timers/callbacks, application-controlled tool boundaries, and event histories. It explicitly calls the project **earlier than public preview** at publication. **[INFERENCE]** Its useful contrast with dsh is the layer being optimized: durable business-process execution around an inner loop, rather than a single extensible local agent product. [27]

**Interoperable client and agent boundaries — ACP and A2A.** ACP’s v1 documentation specifies JSON-RPC 2.0 between a user-facing client and agent, including sessions, updates, cancellation, permissions, and capability-dependent filesystem/terminal operations. Its 2026 updates include a registry release on March 9, session resume stabilization on April 22, and a **v2 draft** on July 20. These are documented milestones as of access, not universal implementation support. [28][29]

A2A’s official March 12, 2026 release announces v1.0 for communication between independent agents across stacks/organizations, with JSON+HTTP, gRPC, and JSON-RPC bindings and polling/streaming/webhooks. The current overview explicitly says it is **not an agent development kit** and **not a protocol specifying an agent’s own internal subagent/tool calls**. **[INFERENCE]** Do not replace the mixture-of-agents design discussion with a protocol logo: wire interoperability does not determine good delegation, shared-state ownership, or verification. [30][31]

**An engine-like authoritative state architecture — omp².** Stencil’s September 2 “Harness Playbook” is a first-party design essay: one journal-derived session representation, trusted-host policy, bounded/cancellable work, structured provider compatibility, and views as projections. It expressly distinguishes lessons from existing omp from replacement architecture partly implemented and partly being worked through. The current official omp homepage still says **“omp², soon!”**, as of October 8. Treat the playbook as documented design direction, not evidence that all features are available in the locally installed omp release. [32][33]

### 8. Lookalike/source-authentication register

These domains are **not used for dsh product or research facts**. Unofficial does not automatically mean malicious; the issue is attribution and evidentiary authority. [1][36][37][38]

| Domain encountered | What was actually established | Citation policy |
| --- | --- | --- |
| `deepseek-harness.app` | Opened homepage explicitly says “Unofficial community site · not affiliated with DeepSeek.” | E for its third-party product discussion; used only to document the disclaimer and unverified date claim. [37] |
| `deepseekagent.io` | Opened homepage explicitly says independent guide, not affiliated with or endorsed by DeepSeek; it also discusses a community Desktop installer. | E; do not substitute its installer/product story for the official Desktop repository. [38] |
| `deepseekharness.io` | Opened a guide/advertising/plugin-index site that links to the official repository as the primary source; no official ownership was authenticated. | Treat as unauthenticated third-party/E, never as a DeepSeek announcement. [36] |
| `deepseek-harness.org` | Direct read returned HTTP 404. | Ownership/content unverified; excluded. |
| `deepseek.ai` | Direct read failed DNS resolution. | Ownership/content unverified; excluded. |
| `deepseekv4pro.com` | Surfaced as a search result; its page was not opened. | Unverified lead only; no claims taken from it. |

## Key numbers

| Claim/metric | Value | Conditions (model, harness, benchmark/version, date) | Source [n] (location) | Grade |
| --- | --- | --- | --- | --- |
| Same-model DSH Minimal versus Standard versus PTC | **72.6 / 70.5 / 67.6** | DeepSeek-V4.1-Flash, effort 100, DeepSWE v1.1, N=8/task, Linux, 1M context, 500 rounds, T=1.0/top-p=.95; September 17, 2026 report. Standard/PTC custom build `0.1.1+custom.202609011522`; Minimal build unspecified. | [13] Table 4; Appendix B.1 | B |
| Same three DSH configurations | **90.6 / 85.8 / 85.8** | Same V4.1 checkpoint/settings; Terminal-Bench v2.1, N=3/task, no network. Not confidence-adjusted. | [13] Table 4 | B |
| mini-SWE comparison | **74.2 / 90.3** | DeepSWE v1.1 / Terminal-Bench v2.1 respectively; same V4.1 settings; `mini_swe_v2` port of commit `04d809ceab9df28f9adaed044884180159172930`. | [13] Table 4; Appendix B.1 | B |
| Independent DSH / Hermes point estimates | **76.5% / 81.7%** | DeepSeek-V4.1-Flash via OpenRouter, Claw-SWE-Bench full-350, three runs, 3,600s/task, concurrency3; v2 September28, 2026; exact harness builds/CIs not given in opened paper. | [24] Table 2; §5; Appendix B | B |
| Independent DSH / Hermes, another model | **69.1% / 73.1%** | GLM5.1; same Claw full-350 protocol. | [24] Table 2 | B |
| Independent DSH / Hermes, another model | **56.8% / 62.8%** | Qwen3.6-flash; same Claw full-350 protocol. | [24] Table 2 | B |
| DSH Team versus single-agent at eight hours | **30.04% / 20.39% Almost@1** | V4.1-Flash; ProgramBench172 golden tasks; up to3 rollouts/task,516 planned/configuration; score threshold≥.95; strongest observed configurations, preliminary and not equal-token/cost. | [13] §5.3.5/Figure10 | B |
| Reasoning retention ablation | **69.4 versus 67.2** | MiniMax-M2, SWE-bench Verified; retain versus discard prior thinking, November3,2025. Full harness versions/runs/CIs not supplied. | [21] “Why is Interleaved Thinking Important for M2?” | C |
| Retention on a tool benchmark | **87 versus 64** | MiniMax-M2, Tau²; same vendor ablation; benchmark split not specified in post. | [21] Same section | C |
| SWE-RL result with selection budget | **41.0%** | Llama3-SWE-RL-70B, Agentless Mini, SWE-bench Verified;500 candidates/issue,30 reproduction tests,T=1.0,one selected final patch. | [16] §3.1/Table1 | A |
| SWE-smith-trained single attempt | **40.2%** | SWE-agent-LM-32B/Qwen2.5-Coder-Instruct, SWE-agent, SWE-bench Verified,5,016 training trajectories,75-step cap,T=0.0. | [17] §§3–4/Table3 | A |
| DeepSWE-Preview single / selected result | **42.2% / 59.0%** | Qwen3-32B post-trained with RL; R2E-Gym; SWE-bench Verified. First is pass@1 averaged over16 runs,64K/100steps; second is hybrid best-of16. | [18] §§3–4/Figures10–11 | C |
| V3.2 synthesized general environments | **1,827** | Environment-synthesis pipeline, not number of prompts or tools; December2,2025 report. | [11] §3.2.3 “General Agent” | B |
| Long-running refinement case | **7 days;23.4M output tokens;24/196 technologies** | Sonnet5, Prime Agent, Factorio; single reported trajectory, not average success. | [25] §3.5/Figure9 | B |

## Contested or uncertain

- **Launch date is still an evidence gap.** The August13 claim is widespread in opened unofficial guides, but no accessible official dated announcement was obtained. Do not narrate it as confirmed until the official announcement body/date can be opened. [36][37]
- **Latest source is not latest install.** The dsh profile describes official `master` documentation as accessed; benchmark builds are dated separately. The V4.1 table’s custom Standard/PTC build and Pi extension must stay visible in any caption. [1][13]
- **Independent evaluation is not independent replication.** Claw-SWE-Bench is independent of DeepSeek, but uses another task set, adapter, provider route, and outer budget; it neither validates nor falsifies DeepSeek Table4 numerically. [13][24]
- **Claw version matters.** This dossier uses **v2, September28**, not the earlier v1. The current paper expands the main design to seven harnesses and three models and provides a Lite subset; v1 results must not be mixed into a v2 chart. Exact material v1-to-v2 numerical deltas were not reconstructed here. [24]
- **V4.1 overgeneralization risk.** The introduction claims capability on “over95% of real-world tasks,” but that phrase is not a defined population-level evaluation in the cited scaffold table. It is deliberately not a narration-ready takeaway or key metric. [13]
- **V4.1 Team results are selected, preliminary configurations.** The report’s own qualifications rule out treating them as proof of a universally optimal team structure. [13]
- **DeepSWE article inconsistency.** Its detailed test-time-scaling discussion and evaluation table give **59.0%**, while the conclusion says **59.2%**. This dossier uses the detailed table/Figure10 figure and discloses the mismatch rather than silently averaging or reconciling it. [18]
- **SWE-RL’s “pass@1” ambiguity matters.** The selected final patch is scored once after hundreds of candidates; SWE-smith’s comparison table describes all entries as pass@1, but SWE-RL’s own methodology reveals the different generation budget. Do not plot those as equal-compute single-rollout scores. [16][17]
- **Research versus product security.** Cordis composition claims and dsh’s durable logs do not supersede dsh’s explicit unaudited-preview warning. [3][5][10]
- **V4 date metadata oddity.** The opened arXiv HTML/abstract displays April26,2026 despite the `2606.19348` identifier. The citation records the displayed date; this dossier does not infer a product release date from either string. [12]

## Corrections & nuances to the blueprint

1. **Replace “next generation equals DeepSeek Harness” with several axes.** dsh illustrates composition and training integration; Prime illustrates persistent refinement; Managed Agents and Temporal illustrate durable boundaries; ACP/A2A illustrate interoperability. This is a proposed explanatory taxonomy, not a formal industry classification. **[INFERENCE]** [3][13][25][26][27][28][30]
2. **There really is current DeepSeek research tied to dsh.** V4.1 explicitly trains and evaluates with it; it is no longer necessary to imply a connection using only V3.2. But V4.1 also trains with competitors. [13]
3. **“Trained for a harness” need not mean locked to it.** Tool-format/state compatibility is important, while multi-scaffold training and evaluation are deliberate attempts to generalize. [11][13][19][20][22]
4. **SWE-RL, SWE-smith, and DeepSWE are different interventions.** SWE-RL’s core training is single-response patch RL; SWE-smith’s reported model uses trajectory fine-tuning; DeepSWE-Preview uses interactive RL. Grouping all three as “RL inside an agent harness” would be wrong. [16][17][18]
5. **Do not criticize a 2026 product using a 2025 absence.** Current Claude Code documents memory, parallel/background agents, hooks, multiple interfaces, and scheduled work; Codex CLI is open source; dsh itself integrates both as subagent providers. [9][34][35]
6. **omp’s current feature pitch is not an omp² release announcement.** Separate what the installed product can demonstrate from Stencil’s explicitly partial replacement architecture. [32][33]
7. **Do not confuse neural mixture-of-experts with runtime mixture-of-agents.** V4/V4.1’s MoE parameter routing is a model architecture; Team-mode agents and their mailbox/task board are separate runtime processes/roles and an additional training/evaluation configuration. [12][13]

## Open questions for the user

- Should the narration present **dsh as the central case study** in next-generation design, or use a balanced three-part story: composability, training across harnesses, and durable/persistent execution?
- Should vendor-controlled V4.1 results appear on screen alongside the independent Claw results, with explicit “vendor report / independent preprint / different benchmark” labels, or should the video avoid numerical dsh rankings until a matched independent replication is available?
- Should **omp²** be a clearly labeled future-looking closing segment, or should the video stay strictly within features demonstrable in the currently installed omp?
- For “self-improvement,” should the video cover only persistent memory/skills, or also model-weight training and runtime modification? These need separate visual definitions to avoid implying one mechanism does all three.

## Unverified leads

- **Official dsh release-date lead:** `https://x.com/deepseek_ai/status/2087887408440164663` surfaced as DeepSeek’s v0.1 developer-preview announcement, but `read` could not retrieve the post body/date without xAI credentials. No paid API was used. `https://github.com/deepseek-ai/deepseek-harness/discussions/12` returned404. Official landing/API-doc pages and the npm registry endpoint failed to load; repository commit history alone would not establish the public-release date. **August13,2026 remains unverified**, not disproved.
- **Complete immutable dsh benchmark artifact:** V4.1 AppendixB.1 identifies Standard/PTC’s custom build, but not the exact Minimal build. Reproduction instructions use an SDK version range. A strict replicated benchmark needs concrete artifact hashes and the same adapters/settings. [13][15]
- **Cordis peer review:** the official paper repository explicitly calls it a preprint. No acceptance at POPL/OOPSLA or another venue was verified; keep GradeB. [5]
- **Generalized unseen-harness robustness:** V4.1 demonstrates cross-harness evaluation and names several harnesses in training, but does not establish in the cited section that every evaluation family was held out. [13]
- **Official current downloadable Desktop platform matrix:** source documents an official Electron application; installer availability, architecture coverage, and first installer-release date were not authenticated from an official download index. [8]
- **Lookalike domains without authenticated content:** `deepseek.ai`, `deepseek-harness.org`, and search-only `deepseekv4pro.com` were excluded; do not fill those gaps from their branding.

## Visual ideas

- **A replaceable agent cross-section:** model adapter, loop, tools, sandbox/filesystem, session log, and UI as plugin blocks connected through Cordis. Animate a provider swap without redrawing the entire product; distinguish a reversible runtime registration from irreversible external work. [3][5][10]
- **One checkpoint, eight harness configurations:** two horizontal small-multiple charts from V4.1 Table4. Keep benchmark names, N, effort, custom-build asterisks, and “vendor-reported; no CI” on screen. mini-SWE leads one chart; DSH Minimal leads the other. [13]
- **Independent counterpoint—not a merged leaderboard:** a separate Claw full-350 panel showing dsh/Hermes for the three models, with a prominent “different benchmark and protocol” label. [24]
- **Training distribution expands:** first animate one harness around a model, then multiple Claude versions, Pi, OpenCode, and dsh modes feeding normalized trajectories to a trainer. Use Figure8’s documented structure; do not invent raw numeric training curves. [13]
- **The message-role bug:** same tool output travels through a `tool` lane versus a `user` lane; V3.2’s reasoning-retention rule changes. Label this model/version-specific, then show V4’s revised retention behavior. [11][12]
- **Three meanings of learning:** weight updates; context/memory updates; executable skill/prompt/role updates. Place SWE-RL/DeepSWE, Prime Agent, and dsh’s composition layer in the appropriate boxes rather than calling everything fine-tuning. [3][16][18][25]
- **UI disappears, work continues; worker crashes, history survives:** separate background-lifecycle and durable-recovery animations based on Prime/Managed Agents/Temporal. No animation implying automatic undo of real-world side effects. [25][26][27]
- **Protocol boundary diagram:** user/editor —ACP→ harness; harness —MCP→ tool; independent agent —A2A→ independent agent. Draw internal subagent scheduling inside the harness boundary. [28][30]
- **A future-labeled omp² card:** authoritative journal in the center, TUI/web/remote/subagent views around it, with “design essay; partly implemented” visible. [32]

## References

[1] DeepSeek-AI. “DeepSeek Harness” (official repository README). GitHub, 2026. https://github.com/deepseek-ai/deepseek-harness (branch `master`; README also at https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md). Grade: C. Accessed 2026-10-08.

[2] DeepSeek. “MIT License.” DeepSeek Harness official repository, 2026. https://github.com/deepseek-ai/deepseek-harness/blob/master/LICENSE. Grade: C. Accessed 2026-10-08.

[3] DeepSeek-AI. “DeepSeek Harness Architecture.” Official repository, 2026, living documentation. https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md. Grade: C. Accessed 2026-10-08.

[4] Cordis contributors. “Cordis: A Meta-Framework of Spatiotemporal Composability.” Official repository, undated living README. https://github.com/cordiverse/cordis. Grade: C. Accessed 2026-10-08.

[5] Yifan Shi, Wei Zhang, Tianyi Cui. “A Programming Paradigm for Spatiotemporal Composability.” arXiv:2608.25512v1, 2026-08-26. https://arxiv.org/abs/2608.25512; official status repository https://github.com/cordiverse/paper. Grade: B for the paper; repository status statement C. No accepted venue verified. Accessed 2026-10-08.

[6] DeepSeek-AI. “@deepseek-ai/dsh-base.” Official repository package reference, 2026. https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/README.md. Grade: C. Accessed 2026-10-08.

[7] DeepSeek-AI. “Configure models.” Official user guide, 2026. https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md. Grade: C. Accessed 2026-10-08.

[8] DeepSeek-AI. “DeepSeek Harness Desktop.” Official repository, 2026. https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md. Grade: C. Accessed 2026-10-08.

[9] DeepSeek-AI. “subagent/ — subagent capability family.” Official repository, 2026. https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/README.md. Grade: C. Accessed 2026-10-08.

[10] DeepSeek-AI. “Safety.” Official repository, 2026. https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md. Grade: C. Accessed 2026-10-08.

[11] DeepSeek-AI et al. “DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models.” Technical report, arXiv:2512.02556v1, 2025-12-02; current unversioned HTML still identifies v1. https://arxiv.org/html/2512.02556; metadata https://arxiv.org/abs/2512.02556. Grade: B. Accessed 2026-10-08.

[12] DeepSeek-AI et al. “DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence.” Technical report, arXiv:2606.19348v1, displayed date 2026-04-26. https://arxiv.org/html/2606.19348; metadata https://arxiv.org/abs/2606.19348. Grade: B. Accessed 2026-10-08.

[13] DeepSeek-AI. “DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression.” Technical report, arXiv:2609.19969v1, 2026-09-17; latest unversioned HTML identifies v1. https://arxiv.org/html/2609.19969. Grade: B. Accessed 2026-10-08.

[14] DeepSeek-AI. “DeepSeek-V4.1-Flash” model card. Official Hugging Face organization, 2026. https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash. Grade: C. Accessed 2026-10-08.

[15] DeepSeek-AI. “Running DeepSWE with dsh-minimal and mini-swe-agent.” Official V4.1 evaluation README, 2026. https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/raw/main/evaluation/README.md. Grade: C. Accessed 2026-10-08.

[16] Yuxiang Wei, Olivier Duchenne, Jade Copet, Quentin Carbonneaux, Lingming Zhang, Daniel Fried, Gabriel Synnaeve, Rishabh Singh, Sida I. Wang. “SWE-RL: Advancing LLM Reasoning via Reinforcement Learning on Open Software Evolution.” NeurIPS 2025, Main Conference, Advances in Neural Information Processing Systems38. DOI:10.52202/085713-2629. Venue-confirming record: https://proceedings.neurips.cc/paper_files/paper/2025/hash/7107d4d2e837bde2171c6b71b5bde954-Abstract-Conference.html; final paper: https://proceedings.neurips.cc/paper_files/paper/2025/file/7107d4d2e837bde2171c6b71b5bde954-Paper-Conference.pdf. Proceedings metadata publication date 2026-04-23. Grade: A. Accessed 2026-10-08.

[17] John Yang, Kilian Lieret, Carlos E. Jimenez, Alexander Wettig, Kabir Khandpur, Yanzhe Zhang, Binyuan Hui, Ofir Press, Ludwig Schmidt, Diyi Yang. “SWE-smith: Scaling Data for Software Engineering Agents.” NeurIPS 2025, Datasets and Benchmarks Track, Advances in Neural Information Processing Systems38. DOI:10.52202/085713-3239. Venue-confirming record: https://proceedings.neurips.cc/paper_files/paper/2025/hash/8b86cf5ace600c48fd188efbb8dedec8-Abstract-Datasets_and_Benchmarks_Track.html; final paper: https://proceedings.neurips.cc/paper_files/paper/2025/file/8b86cf5ace600c48fd188efbb8dedec8-Paper-Datasets_and_Benchmarks_Track.pdf. Proceedings metadata publication date 2026-04-23. Grade: A. Accessed 2026-10-08.

[18] Michael Luo, Naman Jain, Jaskirat Singh, Sijun Tan et al. “DeepSWE: Training a Fully Open-sourced, State-of-the-Art Coding Agent by Scaling RL.” Agentica / Together AI research blog, 2025-07-02. https://www.together.ai/blog/deepswe. Grade: C. Accessed 2026-10-08.

[19] Kimi Team. “Kimi K2: Open Agentic Intelligence.” Technical report, arXiv:2507.20534v2, 2026-02-03; original release2025. https://arxiv.org/html/2507.20534. Grade: B. Accessed 2026-10-08. The delegated source check compared v1/v2 and found the cited SWE-bench/Terminal-Bench metrics unchanged; this is not a claim that the entire paper was unchanged.

[20] GLM-4.5 Team, Zhipu AI and Tsinghua University. “GLM-4.5: Agentic, Reasoning, and Coding (ARC) Foundation Models.” Technical report, arXiv:2508.06471v1, 2025-08-08; current unversioned HTML still identifies v1. https://arxiv.org/html/2508.06471. Grade: B. Accessed 2026-10-08.

[21] MiniMax. “Interleaved Thinking Unlocks Reliable MiniMax-M2 Agentic Capability.” Official technical article, 2025-11-03. https://www.minimax.io/news/why-is-interleaved-thinking-important-for-m2. Grade: C. Accessed 2026-10-08.

[22] MiniMax. “Aligning to What? Rethinking Agent Generalization in MiniMax M2.” Official documentation, undated. https://platform.minimax.io/docs/guides/text-m2-agent-generalization. Grade: C. Accessed 2026-10-08.

[23] Qwen Team. “Qwen3-Coder: Agentic Coding in the World.” Official blog, 2025-07-22. https://qwenlm.github.io/blog/qwen3-coder/. Grade: C. Accessed 2026-10-08.

[24] Mengyu Zheng, Kai Han, Boxun Li, Haiyang Xu et al. “Claw-SWE-Bench: A Benchmark for Evaluating OpenClaw-style Agent Harnesses on Coding Tasks.” arXiv:2606.12344v2, 2026-09-28. https://arxiv.org/html/2606.12344. Grade: B, independent preprint; no accepted venue verified. Accessed 2026-10-08.

[25] Seth Karten, Alex L. Zhang, Kevin Thomas, Sebastian Müller et al. “Prime Agent: A Self-Improving RLM Harness.” Technical report, arXiv:2608.23552v1, 2026-08-24; manuscript first-published date2026-08-05. https://arxiv.org/html/2608.23552. Grade: B. Accessed 2026-10-08.

[26] Lance Martin, Gabe Cemaj, Michael Cohen. “Scaling Managed Agents: Decoupling the brain from the hands.” Anthropic Engineering, 2026-04-08. https://www.anthropic.com/engineering/managed-agents. Grade: C. Accessed 2026-10-08.

[27] Cornelia Davis. “Temporal Agent Harness: An early look at durable agent infrastructure.” Temporal, 2026-08-20. https://temporal.io/blog/temporal-agent-harness-durable-agent-infrastructure. Grade: C. Accessed 2026-10-08.

[28] Agent Client Protocol project. “Overview — Agent Client Protocol v1.” Official documentation, undated living version. https://agentclientprotocol.com/protocol/v1/overview. Grade: C. Accessed 2026-10-08.

[29] Agent Client Protocol project. “Updates.” Official dated project announcements, 2025–2026. https://agentclientprotocol.com/updates. Grade: C. Accessed 2026-10-08.

[30] A2A project / Linux Foundation. “A2A Protocol.” Official documentation, undated living version. https://a2a-protocol.org/latest/. Grade: C. Accessed 2026-10-08.

[31] A2A Protocol Community. “A2A Protocol Ships v1.0: Production-Ready Standard for Agent-to-Agent Communication.” Official announcement, 2026-03-12 (date in official URL). https://a2a-protocol.org/latest/blog/2026/03/12/a2a-protocol-ships-v10-production-ready-standard-for-agent-to-agent-communication/. Grade: C. Accessed 2026-10-08.

[32] Can Bölük. “The Harness Playbook.” Stencil, 2026-09-02. https://stencil.so/blog/harness-playbook. Grade: C for the author’s omp/omp² design account; not independent validation of critiques of other projects. Accessed 2026-10-08.

[33] Stencil Labs. “omp — a coding agent with the IDE wired in.” Official product homepage, undated living page. https://omp.sh/. Grade: C. Accessed 2026-10-08.

[34] OpenAI. “Codex CLI.” Official repository README/license declaration, living version2026. https://github.com/openai/codex. Grade: C. Accessed 2026-10-08.

[35] Anthropic. “Claude Code Overview.” Official documentation, living version2026. https://code.claude.com/docs/en/overview. Grade: C. Accessed 2026-10-08.

[36] deepseekharness.io, operator not authenticated. “DeepSeek Harness: Everything Is a Plugin.” Third-party guide, undated living page. https://deepseekharness.io/. Grade: E for third-party product claims; opened only for source-authentication/date-claim assessment. Accessed 2026-10-08.

[37] DSH Field Kit / deepseek-harness.app. “DeepSeek Harness Guide — Install, Modes, Plugins.” Explicitly unofficial community guide,2026. https://deepseek-harness.app/. Grade: E for third-party product claims; disclaimer observed directly. Accessed 2026-10-08.

[38] DeepSeek Agent guide, independent operator. “DeepSeek Harness | Agent Guides, Desktop & Plugins.” Explicitly unaffiliated guide,2026. https://deepseekagent.io/. Grade: E for third-party product claims; disclaimer observed directly. Accessed 2026-10-08.

[39] Jialiang Huang, Hongxuan Tang, Jingchang Chen, Yuxuan Liu et al. “DeepSeek Elastic Compute (DSec): A Sandbox Infrastructure for Effective Agentic Training at Scale.” DeepSeek-AI / Tsinghua University technical report, arXiv:2609.22978v1,2026-09-19. https://arxiv.org/html/2609.22978. Grade: B. Accessed 2026-10-08.
