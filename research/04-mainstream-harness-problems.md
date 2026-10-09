# 04 — Mainstream harness problems, limitations, and strengths
> Slice: MainstreamCritiqueResearch · Researched 2026-10-08 · Scope: Claude Code and OpenAI Codex CLI/cloud; licensing, context, costs, security, extensibility, empirical outcomes, and fair comparisons.

## Narration-ready takeaways

- A coding agent is more than its model: Claude Code itself describes the harness as the layer that supplies tools and manages the context the model sees. Problems in that layer should not be confused with problems in model serving. [11][13][40]
- Codex CLI is open-source under Apache 2.0, and its official configuration supports custom model providers and local Ollama or LM Studio. It would be inaccurate to describe every mainstream harness as closed or single-provider. [1][6]
- Claude Code is governed by Anthropic’s commercial or consumer terms, rather than an open-source license. Its current rules distinguish permitted use of the unmodified client from third-party developers collecting or routing Claude account credentials. [2][3]
- Subscription portability is not a simple banned-or-allowed story: Anthropic’s October 7 update explicitly says Agent SDK, noninteractive CLI, and third-party app usage can still draw from subscription limits, while separate legal documentation restricts credential intermediation. [3][4]
- Tool metadata can consume a substantial context budget: Anthropic documented a five-server example with 58 tools using approximately 55K tokens before conversation. But current Claude Code defers MCP tool definitions by default, so that old example is not its present-day default overhead. [11][15]
- Compaction is useful but not lossless: Anthropic warns that early conversational instructions may be lost. Claude Code provides context inspection and persistent project instructions, while Codex’s documented server-side compaction can retain an opaque encrypted representation. [11][13]
- Anthropic’s September 2025 quality postmortem identified three infrastructure bugs, not a deliberate reduction in model quality or a demonstrated Claude Code prompt regression. Changing the harness alone would not establish a fix for those serving failures. [40]
- Sandboxing is not a blanket protection around every integration: both vendors document boundaries around command execution, with separate controls or responsibilities for MCP and other connections. Claude Code’s local Bash sandbox is off by default in the documentation inspected. [24][25]
- Security research also records improvement: a revised ToolLeak study reports successful attacks against older Claude Code configurations but zero successes in its ten-attempt cells for the tested newer Claude Code release. Neither result is a universal compromise rate or a guarantee of safety. [30]
- Early Claude Code pull requests were often useful: a peer-reviewed study found 475 of 567 were merged. However, 214 of those merged requests needed revisions, and the matched human baseline also commonly needed revision. [33]
- “No subagents” and “no LSP” are obsolete blanket criticisms of Claude Code: it documents subagents and language-server plugins today. The real questions concern provider freedom, integration depth, deployment scope, and what works without additional setup. [11][21][22]
- Benchmark success is not the same as an accepted, maintainable contribution: research on agent-authored pull requests finds CI failures, duplicated work, unwanted features, and absent reviewer engagement among rejection patterns. [34][35]

## Findings

### 1. Attribution: what is actually a harness problem?

**Products and date:** Claude Code, Codex CLI, Gemini CLI; historical bug reports closed by December 12, 2025, analyzed in a 2026 paper. **Evidence:** grade A venue confirmation; figures below are from the accessible arXiv v1 manuscript. **Fixed?** The dataset contains closed issues, not an inventory of still-open vulnerabilities or a current failure-rate measurement. [36]

Zhang et al.’s *Engineering Pitfalls in AI Coding Tools* manually classified **3,864** retained bug reports: **2,343** Claude Code, **1,192** Codex, and **329** Gemini CLI. Table 2 labels **2,587 / 67.0%** functional, **690 / 17.9%** usability/UI, **294 / 7.6%** compatibility, **227 / 5.9%** performance, and **66 / 1.7%** security. Table 4 assigns **826 / 21.4%** to API/integration and **613 / 15.9%** to configuration/setup. These are proportions of selected reports, **not proportions of all user sessions that fail**. [36]

The official FSE 2026 program lists this work under Industry Papers. The accessible manuscript nevertheless retains placeholder publication metadata, and its abstract disagrees with the arXiv API abstract on several figures; use the exact tables and the discrepancy note below rather than an unqualified headline. [36]

For narration, separate these layers:

| Layer | Grounded example | What the evidence does not establish |
|---|---|---|
| Harness implementation | Codex historically used a model-generated working directory as a sandbox writable root; patched in CLI 0.39.0. [26] | That current Codex, or every cloud session, has the same defect. [26] |
| Model-serving infrastructure | Anthropic’s 2025 routing, output-corruption, and compiler issues. [40] | That an alternative prompt or harness would eliminate those backend problems. [INFERENCE] [40] |
| Policy and capacity | Subscription windows, provider permissions, credential-routing conditions. [3][4][17][20] | That every interrupted session is a software bug, or that API access is unlimited. [INFERENCE] [16][20] |
| Deployment/integration | Cline’s permissive issue-triage workflow enabled an injection-to-cache-poisoning chain. [31] | That merely installing any coding assistant reproduces that chain. [31] |
| Socio-technical outcome | Agent PRs can be duplicates or unwanted work, even before code review. [34] | That non-merge necessarily means incorrect code. [34] |

**Editorial conclusion [INFERENCE]:** The defensible case for a different harness is control over these mechanisms and measurable outcomes—not the premise that mainstream products are categorically incapable. [6][11][13][34][36]

### 2. Openness, licensing, provider choice, and authentication lock-in

#### Current support and licensing

**As of 2026-10-08; grade C first-party documentation throughout.** These are product boundaries, not bugs with a promised fix. [1][2][3][6][7]

| Product | Documented position | Limitation and counterweight |
|---|---|---|
| Claude Code | Repository license says “© Anthropic PBC. All rights reserved. Use is subject to Anthropic’s Commercial Terms of Service.” Legal docs additionally distinguish commercial users from Free/Pro/Max consumer terms. [2][3] | Public issue tracking and plugins are not the same thing as an open-source implementation license. [INFERENCE] [2][3] |
| Claude Code model access | Its architecture docs say it uses Claude models; commercial deployment docs/legal terms cover Anthropic and supported cloud-provider credentials, including Bedrock, Google’s Agent Platform, and Microsoft Foundry. [3][11] | Multiple **hosting/inference providers for Claude** should not be advertised as unrestricted, officially supported model-family neutrality. Conversely, do not claim another model is technically impossible to route through it. [INFERENCE] [3][11] |
| Codex CLI | Apache-2.0 repository; configurable providers, Mistral configuration example, Ollama/LM Studio OSS mode, Azure, and a built-in Bedrock provider. [1][6] | API compatibility, selected model capabilities, and service entitlements still matter. The existence of a configuration example does not prove every provider/model performs equally well. [6] |
| Codex cloud | Requires ChatGPT sign-in; API-key access supports local CLI/SDK/IDE workflows but excludes or limits cloud features. [7][20] | Open-source local code does not make the hosted service’s authentication, billing, or feature availability vendor-independent. [INFERENCE] [1][7][20] |

#### Anthropic policy chronology: retain the distinctions

| Date | What the opened source actually establishes | Grade / current disposition |
|---|---|---|
| January 9, 2026 | An OpenClaw issue reports `This credential is only authorized for use with Claude Code and cannot be used for other API requests`, breaking previously working synced OAuth use in clawdbot 2.0.0-beta5 on macOS. [9] | **E, anecdotal issue report.** Evidence of an observed enforcement episode, not a complete vendor policy or prevalence estimate. Its closed status is not proof that all third-party OAuth routing became permitted. [9] |
| April 4, 2026 | The Next Web reports a restriction on using flat-rate subscriptions through OpenClaw and quotes Claude Code head Boris Cherny saying subscriptions were not built for those tools’ usage patterns. [10] | **D, secondary reporting.** Historical announcement, not sufficient authority for today’s blanket rule. Do not reuse its speculative cost multipliers or motive claims. [10][4] |
| June 15, 2026 | Official support update: “We’ve paused the previously-announced changes to Claude Agent SDK usage. For now, nothing has changed: Claude Agent SDK, `claude -p`, and third-party app usage still draw from your subscription limits.” [4] | **C.** Direct evidence that the SDK billing change was paused; does not precisely enumerate all historical third-party OAuth arrangements. [4] |
| October 7, 2026 | Official update: Max and Team now include monthly API credits; “You can still use the Claude Agent SDK, `claude -p`, and third-party apps with your subscription limits.” [4][5] | **C, current as of access.** A blanket “subscriptions cannot be used with third-party apps” would contradict this text. [4] |
| Legal docs, accessed October 8, 2026 | Anthropic prohibits third-party developers offering Claude.ai login or collecting, storing, or intermediating Claude.ai credentials/session tokens; separately permits end users signing into an unmodified Claude Code binary, including on a hosting platform. [3] | **C.** Credential handling and product hosting restrictions remain expressly documented; exact reconciliation with the broad support-page wording is not fully specified. [3][4] |

The relevant legal wording is unusually important to quote rather than paraphrase into a general ban:

> “Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic’s own flow.” [3]

The same page expressly says this does not prevent an end user signing into the **unmodified Claude Code binary** with their subscription, including a platform-hosted binary. It also requires that hosted binaries not be modified or have authentication methods removed, and says customers may not pay for, resell, or intermediate end users’ Claude usage. Anthropic reserves enforcement without prior notice. [3]

**OpenAI is not a symmetrical case:** current official support explicitly documents optional subscription sharing in participating third-party apps/sites, with separate permission, per-app weekly limits, and no API-key sharing. Go/Plus/Pro eligibility for participating commercial apps is distinguished from supported open-source tools, which the page says remain available to all ChatGPT users. This is documented permission for supported integrations, not permission to redistribute arbitrary credentials or evade limits. [8]

**Narration implication [INFERENCE]:** Discuss the fragility of relying on an undocumented credential path, not a fictitious universal prohibition. Check the exact integration and authentication route shown in the omp demonstration. [3][4][7][8][9]

### 3. Context overhead, observability, compaction, and regressions

#### System prompts: size is configuration-dependent, not one honest universal number

**Products:** both. **Date/status:** current docs accessed 2026-10-08; continuing architectural tradeoff with substantial controls. [11][12][13]

- Claude Code’s effective context contains conversation, file contents, outputs, CLAUDE.md, memory, loaded skills, and system instructions. It also inserts reminders/context for changed files and commit/PR attribution. Attribution and built-in Git instructions have documented switches. Therefore “the user did not type this instruction” does not establish an undisclosed model change. [11]
- Anthropic documents a minimal SDK default, a full `claude_code` preset, and a custom prompt string; it also describes a shorter prompt configuration and dynamic memory-directory sections. Replacing the prompt can remove built-in safety/tool guidance that the integrator must replace. [12]
- Codex’s January 23, 2026 engineering account describes model-specific base instructions, an optional replacement `model_instructions_file`, user/developer instruction layers, tools, and environment messages. It explicitly says the server controls the system message and prompt ordering, while the client controls tool definitions and its instructions. [13]
- **No fixed current system-prompt token count is established by these sources.** This dossier does not turn a leaked prompt or one user’s `/context` output into a universal “Claude Code wastes N tokens” fact. A measured comparison would need pinned client/model versions, authentication route, tools, plugins, system-prompt variant, and tokenizer. [INFERENCE] [11][12][13]

#### MCP overhead: substantial evidence, plus already-shipped mitigations

**Historical evidence:** Anthropic’s November 4, 2025 article gives an illustrative code-execution transformation from **150,000 to 2,000 tokens**, described as **98.7%** savings. This is not a controlled estimate of every Claude Code session or a measured omp advantage. [14]

Its November 24 article documents a five-server example—GitHub, Slack, Sentry, Grafana, Splunk—with **58 tools / approximately 55K tokens** before conversation, and a separate optimized example of approximately **77K** total initial context versus **8.7K** with tool search. It reports internal MCP evaluation accuracy changes for Opus 4 (**49% to 74%**) and Opus 4.5 (**79.5% to 88.1%**), without a trial count or confidence interval in that section. Do not mix the separate **134K** anecdote, **72K** tool-definition example, and **77K** total-context figure into one experiment. [15]

**Current status:** Claude Code documents MCP tool definitions as deferred by default; names and server instructions still consume context before use. It recommends disabling unused servers and notes that command-line integrations can remain more context-efficient because they add no per-tool listing. The historical eager-loading problem is therefore **mitigated, not an accurate description of today’s default**. [11][16]

#### Observability exists, but is not full transparency into everything the model sees

| Product | What is observable/controllable | Remaining limitation; status |
|---|---|---|
| Claude Code | `/context` shows space usage; local plaintext JSONL saves messages/tool calls/results; `/usage` shows token estimates, subscription usage, attribution, and cache statistics; OpenTelemetry can export usage. [11][16] | Local attribution is approximate and excludes other machines/claude.ai. API-dollar estimates are not authoritative invoices, and subscription usage is not the same as that displayed API price. **Current limitation with explicit documentation.** [16] |
| Codex | Public model-specific client instructions, configurable instruction files, documented prompt assembly, and visible subagent threads. [13][23] | OpenAI’s documented compaction includes opaque `encrypted_content`; inspectable client code is not equivalent to human-readable server-owned instructions, internal reasoning, or compacted latent state. **Architectural limitation; no universal fix claimed.** [13] |

**Compaction:** Claude Code clears older tool outputs before summarizing; early detailed instructions can be lost. It supports focus instructions for `/compact` and persistent CLAUDE.md rules. It now stops after repeated immediate refilling rather than endlessly compacting. Codex’s documented `/responses/compact` path automatically replaces conversation input with a smaller representation at a threshold. These are useful continuity mechanisms, not proof of perfect recall. [11][13]

#### Grounded harness regressions versus the September 2025 serving incident

- **Codex, disclosed January 23, 2026:** OpenAI acknowledges its initial MCP integration enumerated tools in an inconsistent order, causing prompt-cache misses, and links the correction. It also explains how model/tool/configuration changes can invalidate caches. **Harness implementation; historical bug described as corrected.** [13]
- **Claude Code, current docs:** before **v2.1.222**, a single MCP call caused subsequent requests to be attributed to that server, overstating its usage share. **Usage-observability bug, fixed in the documented version; not evidence those tokens were actually billed to the server.** [16]
- **Claude Code, current docs:** before **v2.1.211**, cost totals persisted across `/clear`; before **v2.1.251**, the documented main-conversation prompt-cache summary was unavailable. These are specific examples of changes in diagnostics, not a quantified causal account of model quality. [16]
- **Anthropic, September 17, 2025 postmortem:** three overlapping infrastructure bugs were reported resolved: Sonnet 4 context routing, output corruption, and approximate-top-k XLA:TPU miscompilation. The postmortem says the first routing bug began August 5 and initially affected **0.8%** of Sonnet 4 requests; at the worst hour on August 31, **16%** were affected. Approximately **30%** of Claude Code users making requests during the described period had at least one message misrouted. These are three different denominators. [40]
- Routing correction began September 4, completed on first-party/Vertex by September 16 and Bedrock September 18; output-corruption rollback was September 2; compiler-related rollbacks included September 4 and September 12. The postmortem admits evaluation/detection gaps and says the team relied too heavily on noisy evaluations. **Serving infrastructure, not an established harness-prompt failure.** [40]

### 4. Cost, caps, and changing subscription economics

**Interpretation [INFERENCE]:** A flat subscription is a price for an entitlement subject to limits, not a fixed amount of autonomous work. A per-token API exposes a different ceiling and cost model; neither permits comparing products fairly through a single advertised monthly price. [16][17][20]

| Product / date | Documented issue or change | Current status / counterweight |
|---|---|---|
| Claude Pro/Max, announced July 28, 2025, effective August 28 | TechCrunch reports new overall and Opus-specific weekly limits, in addition to five-hour limits; Anthropic estimated fewer than 5% of subscribers affected. **D reporting of vendor statements.** [18] | Historical capacity-policy change, not evidence every customer was affected or that those exact allowances remain current. [18][19] |
| Claude Code, May 6, 2026 | Anthropic announced doubling five-hour limits for Pro/Max/Team/seat-based Enterprise and removing the peak-hours reduction for Pro/Max. **C.** [19] | A critique that only describes tightening omits a documented loosening. It did not announce abolition of all weekly limits. [19][17] |
| Claude, as of October 8, 2026 | Pro: **$20 monthly**, or page-displayed **$17/month** annual equivalent with **$200 billed up front**; Max starts **$100/month**, with 5x/20x Pro session-usage choices. Taxes excluded; limits apply. **C.** [17] | Shared five-hour and paid-plan weekly windows; no fixed message count. Conversation complexity, model and features matter. Usage credits permit continuation at standard API rates. [17] |
| Claude Max/Team, October 7, 2026 update | Monthly API credits: Max 5x **$100**, Max 20x **$200**; Team Standard **$20/seat**, Premium **$100/seat**, pooled cap **$500/month**. **C.** [4][5] | Eligible plan must be active for seven days; credits require claiming/linking, do not roll over, and do not raise interactive subscription limits. They exclude interactive Claude Code/extra usage and third-party cloud inference. API-key `claude -p`/SDK runs are covered under the documented conditions. [5] |
| Codex, as of October 8, 2026 | Plus **$20/month**; Pro tiers **$100/$200/$500/month**. Current Plus local-message estimates vary dramatically by model: GPT-6 Astra **5–45**, GPT-6.1 Sol **15–160**, GPT-6 Luna **350–3,000** per five hours. **C.** [20] | These are estimates, not fixed message caps. Local/cloud work shares allowance; weekly limits may apply. Current Pro plans have **no five-hour limit**, so do not apply an older universal five-hour claim. API-key usage is billed separately and has different feature availability. [20] |

Anthropic’s current cost guide reports enterprise averages of **around $13 per developer per active day**, **$150–250 per developer per month**, and **below $30 per active day for 90% of users**. The page supplies no sample size or collection window for this aggregate; it is vendor planning guidance, not a comparative cost benchmark or a forecast for the viewer. [16]

**Multi-agent cost is not free:** both vendors say subagents issue their own model/tool work and consume more tokens or the same shared plan allowance. Claude’s guide recommends small teams; Codex warns parallel writers can create conflicts and coordination overhead. Whether parallelism lowers **total** cost must be measured per workload. [16][22][23]

### 5. Security: boundaries, patched vulnerabilities, research, and supply chain

#### Current sandbox designs and residual scope

**As of 2026-10-08; grade C.** These are documented design boundaries; an explicit opt-out or out-of-sandbox integration is not itself a CVE. [24][25]

- **Claude Code:** local shell sandbox uses Seatbelt on macOS and bubblewrap/socat on Linux/WSL2; native Windows commands run unsandboxed. The sandbox is off by default. File/web tools, hooks, local MCP servers, LSP servers, and helper processes run outside that shell boundary, with permission rules or their own controls instead. Default shell reads can reach much of the machine, including credential files, unless restricted. [24]
- Claude also documents strict sandboxing, read-deny/credential controls, and `failIfUnavailable`; without the latter, an unavailable sandbox can result in unsandboxed commands. A fully encompassing boundary requires enclosing the whole agent process in an appropriate container, VM, or sandbox runtime. These controls are a substantive strength, but they require the operator to understand their scope. [24]
- **Codex CLI/IDE:** default command network access is off; OS enforcement and approval policies bound local execution. Workspace write access is distinct from read-only operation and from explicit escalation. Current docs warn that domain rules do not constrain traffic unless the relevant network proxy is enabled; MCP, web search, connector, and other traffic have separate controls. [25]
- **Codex cloud:** docs explicitly distinguish legacy isolated-container setup/agent phases from the current cloud environment. Do not copy the legacy “all secrets removed before agent phase” statement onto every current cloud feature without checking its environment documentation. [25]

#### Specific historical CVEs: prerequisites and fixed versions are part of the claim

| Product / advisory date | Vulnerability and required circumstances | Affected → fixed | Evidence / status |
|---|---|---|---|
| Codex CLI and VS Code extension; September 19, 2025 vendor disclosure | **CVE-2025-59532 / GHSA-w5fx-fh39-j5rw:** model-generated `cwd` could become writable sandbox root outside the intended starting workspace. Allowed writes/commands where the process already had permissions; **network-disabled restriction was not bypassed**. [26] | CLI **0.2.0–0.38.0 → 0.39.0**; extension **≤0.4.11 → 0.4.12**. [26] | **C. Patched.** Local implementation advisory; not a general claim about Codex cloud or current releases. [26] |
| Claude Code; November 19, 2025 disclosure | **CVE-2025-65099 / GHSA-5hhx-v7f6-x7gv:** startup `yarn --version` could execute project Yarn plugins/yarnPath before directory-trust acceptance. Requires **Yarn ≥3.0**, and starting Claude Code in an untrusted directory. [27][28] | **<1.0.39 → 1.0.39**. [27][28] | **C. Patched.** Disclosure date is not necessarily patch-release date; auto-update users were reported to have received the correction. [27] |
| Claude Code; February 6, 2026 disclosure | **CVE-2026-25725 / GHSA-ff64-7w26-62rf:** bubblewrap did not protect absent `.claude/settings.json`; malicious code already inside the sandbox could create persistent hooks that ran with host privileges after restart. [29] | **<2.1.2 → 2.1.2**. [29] | **C. Patched.** Requires the absent-file condition, bubblewrap path, malicious sandboxed execution, and restart for the described persistence. [29] |

The advisories do not supply a measured victim rate. CVSS severity, existence of a report, and actual incidence are different quantities; this dossier does not use raw CVE counts to rank vendor safety. [26][27][28][29]

#### Peer-reviewed prompt-injection evidence—and meaningful hardening

**ToolLeak / two-channel injection:** Xie et al., *Proceedings of the ACM on Software Engineering*, ISSTA issue, 2026; publication confirmed through ACM-deposited metadata, detailed results read in **arXiv:2509.05755v6, June 28, 2026**. Evaluated products include Claude Code, Cursor, Copilot, Cline, Windsurf and Trae, **not Codex**. The threat model requires connection to an attacker-controlled external tool whose description/return the attacker can influence. [30]

The paper’s Table 5 reports success as invocation of a command-execution tool with the intended payload, over **10 attempts per cell**. For Claude Code **2.0.37**, its two-channel attack scores **0.6** with Sonnet 4 and **0.7** with Sonnet 4.5. For Claude Code **2.1.138**, the displayed two-channel cells are **0.0** with Sonnet 4, 4.5, 4.6 and Opus 4.7. Section 6.4 attributes the hardening to progressive tool disclosure plus stronger model refusals. This is evidence that harness design can help security, not just evidence against mainstream products. [30]

**Limits:** small cells, selected configurations, an attacker-controlled integration, and simultaneous client/model changes prevent treating this as a population risk estimate or a clean estimate of one defense’s causal effect. The revised paper still contains broad prose about compromising every tested pair; that is incompatible with applying the claim to the newer zero-success cells. Cite the tables and versioned results, not that unqualified sentence. **Status:** measured hardening in the evaluated newer release; not a comprehensive safety guarantee or a CVE patch certificate. [30]

#### Supply-chain incidents: distinguish the two causal stories

- **Cline, February 17, 2026 unauthorized npm publication; postmortem February 23/24:** a permissive `claude-code-action` issue-triage workflow accepted untrusted users and allowed Bash. Cline describes prompt injection followed by GitHub Actions cache poisoning, access to release credentials, and a failed npm-token rotation. Unauthorized **cline@2.3.0** added an OpenClaw installation script; Cline says the binary was byte-identical to the previous release, the installed OpenClaw project was legitimate, no user data was exfiltrated, and VS Code/JetBrains distributions were unaffected. **2.4.0** was the corrected release; workflows were removed and publishing moved to OIDC. **C, affected vendor postmortem.** This is an agent-enabled integration failure, not evidence OpenClaw itself was malware. [31]
- **Nx s1ngularity, August 26, 2025; September 5 postmortem:** attackers initially exploited conventional shell injection in a `pull_request_target` workflow, stole npm publishing credentials, and published malicious postinstall packages. Those packages attempted to use local AI CLIs such as Claude/Gemini to search for sensitive data and exfiltrated through GitHub CLI. The AI tools were an attempted aid **after** the supply-chain compromise, not the original prompt-injection vector. Malicious versions were removed, credentials revoked, and release controls hardened. **C, vendor postmortem.** Previously exposed secrets still need remediation; a package update cannot reverse disclosure. [32]

**Security implication [INFERENCE]:** Alternative harnesses inherit these classes of risk when given the same credentials, untrusted inputs, and execution rights. An omp demonstration should explain its actual boundaries instead of implying that being open-source makes those boundaries unnecessary. [24][25][30][31][32]

### 6. Extensibility: real boundaries versus obsolete feature claims

**As of 2026-10-08, grade C except the clearly identified research example.** [6][11][12][21][22][23][41]

| Question | Claude Code | Codex | Defensible critique |
|---|---|---|---|
| Subagents / teams | Separate-context custom subagents, per-agent prompts/tools/permissions/models; docs link agent teams and cross-session messaging. Teams are documented as experimental and disabled by default. [22][16] | Current local releases enable subagents by default; custom roles can choose model/reasoning/instructions; `/agent` exposes threads. [23] | Not “cannot do multi-agent.” Compare orchestration semantics, supervision, write isolation, setup, and model-provider routing. [INFERENCE] [22][23] |
| Provider freedom | Official docs frame native model choice around Claude and supported inference hosts. [3][11] | Custom provider configuration and local OSS mode are explicit. [6] | Distinguish model family from cloud host; do not label Codex open-source code as vendor-locked in the same sense as a hosted subscription. [INFERENCE] [1][3][6] |
| LSP | Official plugins provide navigation and diagnostics; require installation of both plugin and language-server executable. Plugin LSP servers do **not** run in Claude cloud sessions. [21] | This slice did not establish a complete current LSP/DAP capability matrix. | Claude’s install/deployment boundary is a real limitation. “Claude Code has no LSP” is false. No Codex absence claim is made. [21] |
| Debugger | Shell access and integrations are documented; a specialist agent called “debugger” is not proof of a Debug Adapter Protocol implementation. [11][22] | No independently established native-DAP comparison here. | Treat native DAP, CLI debugger access, and third-party MCP wrappers as distinct until each is verified. [INFERENCE] [11][22] |
| Prompt / workflow customization | SDK minimal/full/custom prompt modes, output styles, project instructions, hooks, skills, and plugins. [11][12][22] | Replacement model-instructions file, developer instructions, config profiles, hooks, MCP, custom agent roles. [6][13][23] | “Cannot customize” is false. Closed binary modification rights, provider compatibility, and hosted-feature constraints are the more precise issues. [3][6][7][12] |
| Edit format | No universal cross-model editing superiority established here. | OpenAI’s GPT-4.1 guide says the model was extensively trained on its recommended `apply_patch` diff format. [41] | Training-format fit is real; exclusivity is not. The same guide reports high success with SEARCH/REPLACE and pseudo-XML formats. “Only OpenAI models can use apply_patch” is unsupported. [41] |

The bug study includes Codex’s historical failure to invoke `apply_patch` rather than merely print a patch as an example of a functional issue. This illustrates why “supports model X” and “works equally well with model X” are separate assertions. The study does not establish that this exact historical issue persists in the current release. [36]

### 7. Empirical output studies: useful contributions, rework, and limits of comparison

#### Claude Code matched-PR study: strong evidence, early snapshot

**Watanabe et al., TOSEM 2026; accepted manuscript arXiv:2509.14745v3, February 9, 2026; ACM online publication September 16, 2026. Grade A.** The study identifies marked Claude Code-assisted PRs created **February 24–April 30, 2025** and matches **567** to **567** human PRs from the same authors/repositories across **157** repositories. Exact client/model versions were not controlled. [33]

- **475/567** agent PRs merged; ACM’s abstract reports **83.8%**. **516/567** matched human PRs merged. [33]
- Among **merged** PRs, **261/475** agent PRs and **302/516** human PRs required no further revision. ACM’s agent figure is **54.9%**; the manuscript’s human fraction is about **58.5%** when rounded to one decimal. The remaining **214/475** agent PRs are the denominator behind the **45.1%** revision headline. [33]
- Revised agent and human PRs did not show a statistically significant difference in revision-volume proxies; the study does not establish equivalence in actual developer time. Bug fixes, documentation, refactoring and style changes all appear in agent revisions. **88/214** revised agent PRs still included Claude co-authorship, so calling every revision purely human rescue is also wrong. [33]
- **Limitations/status:** observational selection, excluded open PRs, imperfect visibility into pre-submission edits, and an earlier human sampling window. These outcomes are not a current defect rate, security audit, causal model/harness comparison, or an unresolved bug with a particular fix release. [33]

#### Multi-product PR failures: workflow alignment matters

**Ehsani et al., MSR 2026; arXiv:2601.15195v1, January 21, 2026. Grade A publication confirmation.** From **33,596** AIDev-pop agent PRs, the paper reports **24,014 / 71.48%** merged. Its product-specific observed rates are Codex **18,004/21,799, 82.59%**; Cursor **1,005/1,541, 65.22%**; Claude Code **271/459, 59.04%**; Devin **2,595/4,827, 53.76%**; Copilot **2,139/4,970, 43.04%**. [34]

Those figures are **not** a controlled leaderboard: different users, repositories, tasks, time periods, and review workflows selected each product. The much lower Claude rate than in Watanabe’s matched study is a warning about population definitions, not proof one paper is wrong or the product deteriorated. This paper’s accessed text does not fully resolve every dataset timestamp/client version, so do not supply a fabricated run date or current-model label. [33][34]

Of **600** sampled rejected PRs, **38** became inaccessible, leaving **562** categorized. The taxonomy records **228** abandoned/not meaningfully reviewed, **142** duplicate PRs, **99** CI/test failures, **24** unwanted features, **19** incorrect implementations, and **15** incomplete implementations. Use counts: some printed percentages use the original 600 denominator. **Status:** historical outcomes; no product-wide fixed/unfixed classification follows. [34]

#### Maintainability: a narrow but useful code-reuse result

**Huang et al., MSR 2026; arXiv:2601.21276v1, January 29, 2026. Grade A publication confirmation.** The broad Python analysis includes **3,858 PRs**, but its semantic-redundancy analysis is restricted to **617 PRs from one repository, crewAI**. It reports Average Max Redundancy **0.2867** for agent PRs versus **0.1532** for human PRs, described by the authors as nearly **1.87x**, with **p<0.001**. [35]

This metric is maximum embedding similarity between new and existing functions, with attempted filtering of moved/renamed code. It is **not** a measured “1.87x more technical debt,” a proven semantic-clone count, a security defect rate, or an isolated Claude/Codex harness effect. The authors identify potential misclassification and limited generalizability; manually checking ten samples does not make every clone conclusion certain. **Status:** research signal motivating reuse checks, not evidence that current agents universally ignore existing code. [35]

#### Productivity: avoid replaying an old headline as a current verdict

METR’s **February 24, 2026** update describes a new experiment with **57 developers, 143 repositories, and 800+ tasks**, including broader adoption of Claude Code/Codex. It expressly calls the new productivity signal unreliable because developers/tasks with expected AI benefits selected out and concurrent agents made task-time reporting difficult. Its raw estimates were **−18%** completion time for returning participants (interval **−38% to +9%**) and **−4%** for new participants (**−15% to +9%**), rather than an established current slowdown or speedup. **Grade B, research-organization technical report; no current causal product ranking.** [37]

The report recounts the earlier **19% slowdown** result, but says early-2026 tools likely help more and the available data only weakly identifies how much. Do not claim “research proves Claude Code/Codex slow developers down” using that earlier, different tool/task snapshot. [37]

**Unresolved output-security question:** the opened product-specific studies above do not establish a controlled, current prevalence of exploitable vulnerabilities in Claude Code- versus Codex-generated production code. Prompt-injection susceptibility, PR acceptance, embedding redundancy, and insecure-code prevalence are different outcomes. No invented common percentage is supplied. [30][33][34][35]

### 8. Steelman: documented strengths and current benchmark standing

- **Claude Code:** documented terminal/IDE/desktop/cloud interfaces, persistent sessions, checkpoints, context inspection, custom instructions, subagents, hooks, MCP and LSP plugins are substantial functionality—not a bare shell loop. Checkpoints restore covered local file changes, not arbitrary remote actions; the scope limitation belongs next to the strength. [11][21][22]
- **Codex:** Apache-2.0 implementation, model-provider configuration, public explanation of prompt assembly, local sandbox defaults, custom roles, and subagent inspection provide real transparency and extensibility. Hosted authentication constraints should not erase those strengths. [1][6][13][23][25]
- **Measured security improvement:** newer Claude Code configurations resist the specific ToolLeak command-invocation attack in all displayed ten-attempt cells, whereas older ones did not. [30]
- **Real contribution usefulness:** the matched Claude study’s majority of accepted PRs and Codex’s high observed merge fraction in AIDev both counter an “agents produce only junk” narrative, even though neither establishes a current causal comparison. [33][34]
- **Current benchmark steelman, grade D independent leaderboard:** the Terminal-Bench **4.0** rendered table, inspected as of **2026-10-08**, lists **Opus 5.5 (max) + Claude Code** first at **64.8% ±3.1%**, **Sonnet 5.5 (max) + Claude Code** second at **61.8% ±2.9%**, and **GPT-6 Astra (max) + Codex** and **GPT-6.1 Sol (max) + Codex** tied third at **58.2% ±2.8%** and **58.2% ±3.1%** respectively. These are displayed model–agent combinations, not standalone harness scores. Exact client build/run count were not exposed in the inspected table; the ± values are reproduced as displayed without independently specifying their statistical construction. [38]
- Terminal-Bench’s 4.0 release explains task/resource changes and a flat **eight-hour agent timeout**; major changes require rerunning trials. Its release-date column is model release date, not the date every run was executed. Do not compare percentages across benchmark versions as a performance trend. [38][39]

**Editorial synthesis [INFERENCE]:** The strongest introduction to omp can acknowledge leading mainstream systems, then demonstrate specific decisions about model choice, context, code intelligence, edits, orchestration, observability and security. These sources do not establish that omp outperforms them without a controlled omp evaluation. [6][11][13][21][23][30][38]

### 9. Brief comparison: Gemini CLI, Cursor, and GitHub Copilot agent

| Product | Shared concern | Important difference / strength | Date and status |
|---|---|---|---|
| Gemini CLI | Included in the same empirical engineering-bug study; API/model/configuration integration remains a source of failures. [36] | Apache-2.0, open source, MCP, search grounding, checkpointing, project instructions; official README advertises personal-account free usage of **60 requests/minute and 1,000/day**. [43] | README as of 2026-10-08; quotas are a dated product claim, not guaranteed future capacity. Historical bug reports are not a current per-session rate. [36][43] |
| Cursor | Pricing communication and opaque routing tradeoffs can affect expectation/cost; ToolLeak evaluates an external-tool injection surface. [30][42] | Multi-provider product; tool-generation/hardening improvements are present in the revised security study. [30][42] | July 4, 2025 first-party apology explains June 16 change from request counting to included usage credit; it acknowledges “unlimited” applied to Auto rather than all models and offers refunds. Historical rollout was acknowledged/remediated; this is not current-plan pricing. [42] |
| GitHub Copilot cloud agent | Unvalidated code, sensitive-data access, prompt injection, and auditability are expressly discussed in vendor risk docs. [44] | Default CodeQL, dependency advisory checks, secret scanning, second-opinion review; branch/credential restrictions, human review before merge, signed attributed commits, and session/audit logs. [44] | Current documentation as of 2026-10-08. Default workflow approval can be configured away; do not present every control as immutable. [44] |

The three are not interchangeable examples of “closed, single-model harnesses.” Gemini’s open-source license and Cursor’s model-provider mix alone defeat that simplification; the common theme is managing authority, context, workflow fit and economics. [INFERENCE] [30][36][42][43][44]

## Key numbers

| Claim/metric | Value | Conditions (model, harness, benchmark/version, date) | Source [n] (location) | Grade |
|---|---|---|---|---|
| MCP definitions example | 58 tools; approximately 55K tokens | Five named MCP servers; Anthropic illustration, Nov 24, 2025; not current Claude Code default | [15], “Tool Search Tool — The challenge” | C |
| Tool-search context example | Approximately 77K → 8.7K tokens | Separate 50+ tool illustration; no trial count/CI given | [15], “Our solution” | C |
| MCP task accuracy | Opus 4: 49% → 74%; Opus 4.5: 79.5% → 88.1% | Anthropic internal MCP evaluations; tool search enabled; no n/CI in section | [15], “Our solution” | C |
| Code-execution illustration | 150,000 → 2,000 tokens; source states 98.7% | Illustrative MCP discovery/orchestration pattern, Nov 4, 2025 | [14], “Code execution with MCP improves context efficiency” | C |
| Worst-hour routing impact | 16% of Sonnet 4 requests | Aug 31, 2025; not average over incident and not all users | [40], issue 1 | B |
| Users with ≥1 misrouted message | Approximately 30% | Claude Code users making requests during the stated incident period | [40], issue 1 | B |
| Claude limit expansion | Five-hour limits doubled | Pro/Max/Team/seat-based Enterprise, effective May 6, 2026 | [19], “Higher usage limits” | C |
| New monthly API credit | Max 5x $100; Max 20x $200 | Oct 7 update; claimed eligible accounts, non-rolling platform credit; separate from interactive plan limits, as of Oct 8 | [4][5], plan table and exclusions | C |
| Codex Plus local-message estimate | Astra 5–45; Sol 6.1 15–160; Luna 350–3,000 / five hours | GPT-6 Astra, GPT-6.1 Sol, GPT-6 Luna respectively; estimated not fixed; as of Oct 8, 2026 | [20], usage FAQ table | C |
| ToolLeak command-invocation success | Old: 0.6/0.7; new: 0.0 in four displayed Claude-model cells | Claude Code 2.0.37 versus 2.1.138; old Sonnet 4/4.5, new Sonnet 4/4.5/4.6 and Opus 4.7; ten attempts per cell, manuscript v6 Jun 28, 2026 | [30], Tables 2 and 5, §6.4 | A venue; author-manuscript detail |
| Claude PR merge | 475/567; publisher reports 83.8% | Claude-marked Feb 24–Apr 30, 2025 PRs; matched observational cohort; exact model/client not controlled | [33], §3–4; ACM abstract | A |
| Revisions among merged Claude PRs | 214/475; publisher reports 45.1% | Denominator is merged PRs, not all submitted PRs | [33], §4.3 | A |
| Human merge comparator | 516/567 | Same-author/repository sample with backward-extended date window | [33], §3–4 | A |
| Multi-agent-product PR merge | 24,014/33,596; 71.48% | AIDev-pop observational dataset; not randomized product comparison | [34], §3 | A |
| Codex observed PR merge | 18,004/21,799; 82.59% | Same AIDev-pop study; product attribution, exact model/build uncontrolled | [34], §3 | A |
| Selected rejected-PR patterns | 228 abandoned; 142 duplicates; 99 CI/test failures | 562 accessible/categorized out of 600 sampled rejected PRs | [34], Table 2 | A |
| Embedding-redundancy score | 0.2867 agent vs 0.1532 human | 617 crewAI PRs; CodeSage-based Average Max Redundancy; p<0.001; not debt/defect count | [35], §2.1–2.2 and §3.1 | A |
| Classified harness bug reports | 3,864; 67.0% functional | Closed reports by Dec 12, 2025; Claude Code/Codex/Gemini; accessible v1 tables | [36], Tables 1–2 | A venue; manuscript figures |
| Current benchmark leaders | Claude/Opus 5.5 64.8% ±3.1%; Codex/Astra 58.2% ±2.8% | TB4.0; max effort; as of Oct 8, 2026; client builds/n not in inspected table; uncertainty reproduced as displayed | [38], rendered table rows 1 and 3 | D |
| Current benchmark resource limit | Eight hours | TB4.0 flat agent timeout; not each run’s duration | [39], “Calibrating resources” | D |

## Contested or uncertain

1. **Anthropic’s authentication/billing wording has a real tension.** The legal page prohibits third-party credential intermediation and third-party Claude.ai login offerings; the June 15/October 7 support updates broadly retain subscription use for “third-party apps.” A plausible reading distinguishes authorized SDK/unmodified-client flows from developers relaying account tokens, but that reconciliation is **[INFERENCE]**, not a quoted exhaustive policy. Do not certify a particular omp OAuth implementation as compliant from these pages alone. [3][4][5]
2. **The April OpenClaw announcement and January OAuth failure are weaker historical evidence.** This dossier’s opened sources are respectively secondary reporting and an issue report. They establish reported episodes, not a complete enforcement timeline or current ban. [9][10]
3. **Bug-study numbers disagree between source surfaces.** The arXiv API abstract says **36.9%** API/integration/configuration and **37.2%/24.7%** tool invocation/command execution; the accessible v1 HTML/PDF says **37.3%** and **37.6%/25%**. The unversioned PDF resolved to v1 dated March 21, 2026. No verified newer full manuscript reconciles these differences; this dossier uses explicitly located table figures instead. Its placeholder June conference date also differs from the official FSE program’s July 5–9 dates. [36]
4. **ToolLeak’s broad prose is overinclusive for its revised tables.** “Every tested pair” cannot be used to describe the newer zero-success configurations. The paper’s proposed explanation for improvement is not a clean randomized ablation of each defense. [30]
5. **Peer-reviewed does not mean every inference is warranted.** The PR-failure manuscript’s prose interprets Cliff’s delta as percentage differences and reports approximated odds claims that should not be reused as literal percentage effects. The code-reuse paper’s embedding similarity and sentiment measures do not prove measured future maintenance cost or reviewer blindness. [34][35]
6. **Merge-rate differences are not a harness leaderboard.** Cohort and task selection can explain different observed rates; exact model/client configurations and pre-submission human work are not controlled. [33][34]
7. **Documentation is a dated observation, not a reproducibility lock.** These live pages contain rollout-, account-, version-, and deployment-specific qualifications. No paid client runs, local exploit tests, or side-by-side task evaluations were performed for this dossier. Current benchmark rows were read after client-side rendering because the static page contained empty row placeholders. [6][16][20][21][23][38]

## Corrections & nuances to the blueprint

- Replace **“problems with mainstream harnesses” as a premise of inferiority** with specific tradeoffs, historical failures, and current boundaries. The current benchmark evidence includes strong mainstream model–harness combinations. [38]
- **Codex CLI is not closed source** and is not limited by its documented configuration to OpenAI-hosted models. Codex cloud is a separately constrained hosted offering. [1][6][7]
- **Claude Code has subagents and LSP plugins.** Agent teams and cross-session workflows are documented; LSP requires setup and does not operate through those plugins in cloud sessions. [11][16][21][22]
- **Eager MCP loading is not the current Claude Code default.** Anthropic both described the overhead and shipped deferred loading. The benefit is a shared design lesson, not automatically a unique omp feature. [11][14][15][16]
- **Do not narrate a current blanket third-party-subscription ban.** Include June’s pause and October’s new API credits, and distinguish credential routing from SDK/unmodified-client use. OpenAI also expressly supports subscription use in participating third-party integrations. [3][4][5][8]
- **Do not attribute Anthropic’s September 2025 infrastructure postmortem to its harness.** It demonstrates the need for accurate diagnosis and user-visible monitoring. [40]
- **`apply_patch` is training-aligned, not model-exclusive.** The primary guide also endorses successful alternative formats. [41]
- **Neither “more agents” nor “open-source” proves better quality, lower cost or safety.** Current vendors themselves describe token/coordination costs, and supply-chain incidents cross product boundaries. [16][23][31][32]

## Open questions for the user

- Should the narrative emphasize a durable engineering comparison, with historical incidents in sidebars, or make vendor-policy volatility a central part of the story?
- Which audience and deployment should the demonstrated defaults target: individual developers using existing subscriptions, API-paying power users, or organizations with managed credentials and sandbox requirements?
- What threat model should the walkthrough teach: trusted personal repositories, untrusted open-source contributions, or unattended CI agents with sensitive credentials?
- If legal permissibility of a particular third-party authentication flow is essential to the video, should the finished narration wait for written vendor clarification, rather than present the documented ambiguity as resolved?

## Unverified leads

- A canonical current Claude Code system-prompt token count, a versioned prompt-growth series, and any claimed quality loss causally caused by that growth were **not established**. Do not use unaudited prompt leaks or screenshots as a universal metric.
- A complete October 2026 native-LSP/native-DAP feature matrix for Codex, Claude Code, Gemini CLI, Cursor, Copilot and omp was **not established by this slice**. Do not infer absence from an unexamined feature or from the lack of a menu item.
- Current controlled security-defect rates for code generated by Claude Code versus Codex CLI/cloud were **not established**. ToolLeak is an integration attack study, not that measurement. [30]
- A complete vendor-authored explanation reconciling every January/April Anthropic OAuth restriction with June/October SDK billing guidance remains unavailable in the opened sources. [3][4][9][10]
- Latest **published** full-text revisions for the bug taxonomy and ToolLeak differ in availability from their accessible arXiv manuscripts; manuscript version and table must remain visible when quoting details. [30][36]

## Visual ideas

- **Layered failure map:** UI/harness → tools/sandbox → provider API → serving infrastructure → human review. Animate the Codex sandbox CVE, Anthropic routing incident, and duplicate PR into different layers instead of treating all as model intelligence failures. [13][26][34][40]
- **Policy timeline with two lanes:** credential-routing rules above; subscription/SDK billing below. Put January anecdote and April reporting in visibly weaker-evidence styling, then June pause and October credit update in primary-source styling. [3][4][5][9][10]
- **Context-budget bars:** reproduce Anthropic’s separate approximately 77K and 8.7K illustrative startup-context bars; label “Anthropic example, Nov 2025—not stock October 2026 Claude Code.” Follow with the current deferred-loading documentation. [11][15]
- **Sandbox boundary diagram:** draw shell subprocesses inside, and MCP/hooks/file tools in explicitly separate regions; accompany each product with its actual default and deployment scope rather than one generic security shield. [24][25]
- **Two-generation security chart:** Claude Code 2.0.37 versus 2.1.138, exact model cells and n=10, with zero successes labeled “none observed in these trials,” not “immune.” [30]
- **PR funnel:** 567 Claude-assisted submissions → 475 merged → 261 without further revision / 214 revised; adjacent matched-human funnel, not a detached “45% needed rescue” headline. [33]
- **Failure-pattern counts:** 228 abandoned, 142 duplicate, 99 CI/test failure, with the visible annotation “562 accessible rejected PRs; not all PRs.” [34]
- **Fair benchmark card:** TB4.0’s model+harness rows with displayed uncertainties and October 8 access date; do not place an unmeasured omp bar beside them. [38][39]

## References

[1] OpenAI. “openai/codex — README and repository license metadata.” GitHub, live repository. https://github.com/openai/codex. Grade: C. Accessed 2026-10-08.

[2] Anthropic. “Claude Code LICENSE.md.” GitHub, live repository. https://raw.githubusercontent.com/anthropics/claude-code/main/LICENSE.md. Grade: C. Accessed 2026-10-08.

[3] Anthropic. “Legal and compliance.” Claude Code documentation, live. https://code.claude.com/docs/en/legal-and-compliance. Grade: C. Accessed 2026-10-08.

[4] Anthropic. “Use the Claude Agent SDK with your Claude plan.” Claude Help Center, updates June 15 and October 7, 2026. https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan. Grade: C. Accessed 2026-10-08.

[5] Anthropic. “Monthly API credits for Max and Team plans.” Claude Help Center, 2026. https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans. Grade: C. Accessed 2026-10-08.

[6] OpenAI. “Advanced Configuration.” ChatGPT Learn / Codex documentation, live. https://learn.chatgpt.com/docs/config-file/config-advanced (opened via https://developers.openai.com/codex/config-advanced). Grade: C. Accessed 2026-10-08.

[7] OpenAI. “Authentication.” ChatGPT Learn / Codex documentation, live. https://learn.chatgpt.com/docs/auth (opened via https://developers.openai.com/codex/auth). Grade: C. Accessed 2026-10-08.

[8] OpenAI. “Using your ChatGPT plan in other apps and sites”; “Sign in with ChatGPT.” OpenAI Help Center, live 2026 documentation. https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites ; https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt. Grade: C. Accessed 2026-10-08.

[9] alejandroOPI. “Claude Code OAuth tokens now blocked for external API use,” issue #559. openclaw/openclaw, GitHub, January 9, 2026. https://github.com/openclaw/openclaw/issues/559. Grade: E (user issue report, not vendor policy). Accessed 2026-10-08.

[10] Ana Maria Constantin. “Anthropic cuts Claude subscribers off from OpenClaw in cost crackdown.” The Next Web, April 4, 2026. https://thenextweb.com/news/anthropic-openclaw-claude-subscription-ban-cost. Grade: D. Accessed 2026-10-08.

[11] Anthropic. “How Claude Code works.” Claude Code documentation, live. https://code.claude.com/docs/en/how-claude-code-works.md. Grade: C. Accessed 2026-10-08.

[12] Anthropic. “Modifying system prompts.” Claude Agent SDK documentation, live. https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts.md. Grade: C. Accessed 2026-10-08.

[13] Michael Bolin / OpenAI. “Unrolling the Codex agent loop.” OpenAI Engineering, January 23, 2026. https://openai.com/index/unrolling-the-codex-agent-loop/. Grade: C (first-party implementation account). Accessed 2026-10-08.

[14] Anthropic. “Code execution with MCP: Building more efficient agents.” Anthropic Engineering, November 4, 2025. https://www.anthropic.com/engineering/code-execution-with-mcp. Grade: C (engineering illustration, not peer-reviewed benchmark). Accessed 2026-10-08.

[15] Anthropic. “Introducing advanced tool use on the Claude Developer Platform.” Anthropic Engineering, November 24, 2025. https://www.anthropic.com/engineering/advanced-tool-use. Grade: C (includes internal evaluations). Accessed 2026-10-08.

[16] Anthropic. “Manage costs effectively.” Claude Code documentation, live. https://code.claude.com/docs/en/costs.md. Grade: C. Accessed 2026-10-08.

[17] Anthropic. “Pricing.” Claude, live. https://claude.com/pricing. Grade: C. Accessed 2026-10-08.

[18] Maxwell Zeff. “Anthropic unveils new rate limits to curb Claude Code power users.” TechCrunch, July 28, 2025, updated July 29. https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/. Grade: D. Accessed 2026-10-08.

[19] Anthropic. “Higher usage limits for Claude and a compute deal with SpaceX.” Anthropic, May 6, 2026. https://www.anthropic.com/news/higher-limits-spacex. Grade: C. Accessed 2026-10-08.

[20] OpenAI. “Pricing.” ChatGPT Learn / Codex documentation, live. https://learn.chatgpt.com/docs/pricing (opened via https://developers.openai.com/codex/pricing). Grade: C. Accessed 2026-10-08.

[21] Anthropic. “Code intelligence plugins.” Claude Code documentation, live. https://code.claude.com/docs/en/plugins/code-intelligence.md. Grade: C. Accessed 2026-10-08.

[22] Anthropic. “Create custom subagents.” Claude Code documentation, live. https://code.claude.com/docs/en/sub-agents.md. Grade: C. Accessed 2026-10-08.

[23] OpenAI. “Subagents.” ChatGPT Learn / Codex documentation, live. https://learn.chatgpt.com/docs/agent-configuration/subagents. Grade: C. Accessed 2026-10-08.

[24] Anthropic. “Configure the sandboxed Bash tool.” Claude Code documentation, live. https://code.claude.com/docs/en/sandboxing.md. Grade: C. Accessed 2026-10-08.

[25] OpenAI. “Agent approvals & security.” ChatGPT Learn / Codex documentation, live. https://learn.chatgpt.com/docs/agent-approvals-security. Grade: C. Accessed 2026-10-08.

[26] OpenAI / fouad-openai. “Sandbox bypass due to bug in path configuration logic.” GitHub Security Advisory GHSA-w5fx-fh39-j5rw, CVE-2025-59532, September 19, 2025. https://github.com/openai/codex/security/advisories/GHSA-w5fx-fh39-j5rw. Grade: C. Accessed 2026-10-08.

[27] Anthropic / GitHub Advisory Database. “Claude Code vulnerable to command execution prior to startup trust dialog.” GHSA-5hhx-v7f6-x7gv, CVE-2025-65099, November 19, 2025. https://github.com/advisories/GHSA-5hhx-v7f6-x7gv. Grade: C. Accessed 2026-10-08.

[28] NIST National Vulnerability Database. “CVE-2025-65099.” Published November 19, 2025; modified June 17, 2026. https://nvd.nist.gov/vuln/detail/CVE-2025-65099. Grade: C (official advisory record; required Yarn version and prerequisites). Accessed 2026-10-08.

[29] Anthropic / GitHub Advisory Database. “Claude Code has Sandbox Escape via Persistent Configuration Injection in settings.json.” GHSA-ff64-7w26-62rf, CVE-2026-25725, February 6, 2026. https://github.com/advisories/GHSA-ff64-7w26-62rf. Grade: C. Accessed 2026-10-08.

[30] Yuchong Xie et al. “Red-Teaming Coding Agents from a Tool-Invocation Perspective: An Empirical Security Assessment.” Proceedings of the ACM on Software Engineering 3, ISSTA, pp. 4024–4047, 2026. Author manuscript https://arxiv.org/html/2509.05755v6 (v6, June 28, 2026). Publication confirmed in ACM-deposited record https://api.crossref.org/works/10.1145/3832267 (DOI 10.1145/3832267; published October 1, 2026). Grade: A for confirmed publication; quoted detailed tables are the specified author-manuscript version. Accessed 2026-10-08.

[31] Saoud Rizwan / Cline. “Post-mortem: Unauthorized Cline CLI npm publish on February 17, 2026.” Cline, displayed February 23, 2026; metadata February 24 UTC. https://cline.ghost.io/post-mortem-unauthorized-cline-cli-npm/. Grade: C (affected vendor postmortem). Accessed 2026-10-08.

[32] Juri Strumpflohner / Nx. “S1ngularity — What Happened, How We Responded, What We Learned.” Nx, September 5, 2025. https://nx.dev/blog/s1ngularity-postmortem. Grade: C (affected vendor postmortem). Accessed 2026-10-08.

[33] Miku Watanabe, Hao Li, Yutaro Kashiwa, Brittany Reid, Hajimu Iida, Ahmed E. Hassan. “On the Use of Agentic Coding: An Empirical Study of Pull Requests on GitHub.” ACM Transactions on Software Engineering and Methodology 35(10), 2026; online September 16. https://arxiv.org/html/2509.14745v3 (v3, February 9, 2026). ACM-deposited publication metadata and rounded publisher abstract: https://api.crossref.org/works/10.1145/3798166 (DOI 10.1145/3798166). Grade: A. Accessed 2026-10-08.

[34] Ramtin Ehsani, Sakshi Pathak, Shriya Rawal, Abdullah Al Mujahid, Mia Mohammad Imran, Preetha Chatterjee. “Where Do AI Coding Agents Fail? An Empirical Study of Failed Agentic Pull Requests in GitHub.” MSR 2026, pp. 807–811. https://arxiv.org/html/2601.15195v1 (v1, January 21, 2026); ACM-deposited publication record https://api.crossref.org/works/10.1145/3793302.3793579 (DOI 10.1145/3793302.3793579). Grade: A. Accessed 2026-10-08.

[35] Haoming Huang, Pongchai Jaisri, Shota Shimizu, Lingfeng Chen, Sota Nakashima, Gema Rodríguez-Pérez. “More Code, Less Reuse: Investigation on Code Quality and Reviewer Sentiment towards AI-generated Pull Requests.” MSR 2026, pp. 1024–1028. Manuscript title uses “Investigating”: https://arxiv.org/html/2601.21276v1 (v1, January 29, 2026). ACM-deposited publication record https://api.crossref.org/works/10.1145/3793302.3793622 (DOI 10.1145/3793302.3793622). Grade: A. Accessed 2026-10-08.

[36] Ruixin Zhang, Wuyang Dai, Hung Viet Pham, Gias Uddin, Jinqiu Yang, Song Wang. “Engineering Pitfalls in AI Coding Tools: An Empirical Study of Bugs in Claude Code, Codex, and Gemini CLI.” FSE 2026 Industry Papers; venue confirmed in official program https://conf.researchr.org/program/fse-2026/program-fse-2026/Detailed-Table. Accessible manuscript https://arxiv.org/html/2603.20847 and https://arxiv.org/pdf/2603.20847 resolved to v1, March 21, 2026; API abstract https://arxiv.org/abs/2603.20847 contains discrepant figures noted above. Grade: A for confirmed venue; quoted tables explicitly from accessible manuscript, not a verified final typeset version. Accessed 2026-10-08.

[37] Joel Becker, Nate Rush, Tom Cunningham, David Rein, Khalid Mahamud / METR. “We are Changing our Developer Productivity Experiment Design.” METR research update, February 24, 2026. https://metr.org/blog/2026-02-24-uplift-update/. Grade: B (research-organization technical report; not peer-reviewed publication). Accessed 2026-10-08.

[38] Terminal-Bench maintainers. “Terminal-Bench 4.0 leaderboard.” Terminal-Bench, live. https://www.tbench.ai/?version=4.0. Grade: D (independent benchmark-maintainer results). Accessed 2026-10-08 with `read`, then browser rendering to expose dynamic rows; ranks/uncertainties are dated observations, not independent reruns.

[39] Ryan Marten / Terminal-Bench. “Terminal-Bench 4.0: Calibrating task resources, fixing tasks, and removing saturated tasks.” Terminal-Bench, 2026. https://www.tbench.ai/news/terminal-bench-4-0. Grade: D (benchmark-maintainer methodology). Accessed 2026-10-08.

[40] Sam McAllister et al. / Anthropic. “A postmortem of three recent issues.” Anthropic Engineering, September 17, 2025, subsequently updated. https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues. Grade: B (formal first-party technical incident report; vendor attribution, not independent audit). Accessed 2026-10-08.

[41] OpenAI. “GPT-4.1 Prompting Guide.” OpenAI Cookbook, 2025, currently marked archived. https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide. Grade: C. Accessed 2026-10-08; especially “Appendix: Generating and Applying File Diffs” and “Other Effective Diff Formats.”

[42] Michael Truell / Cursor. “Clarifying our pricing.” Cursor, July 4, 2025. https://cursor.com/blog/june-2025-pricing. Grade: C. Accessed 2026-10-08.

[43] Google. “Gemini CLI — README.” google-gemini/gemini-cli, GitHub, live. https://raw.githubusercontent.com/google-gemini/gemini-cli/main/README.md ; repository identity/license metadata https://github.com/google-gemini/gemini-cli. Grade: C. Accessed 2026-10-08.

[44] GitHub. “Risks and mitigations for GitHub Copilot cloud agent.” GitHub Docs, live. https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/risks-and-mitigations (opened from former /concepts/agents/cloud-agent/risks-and-mitigations route). Grade: C. Accessed 2026-10-08.
