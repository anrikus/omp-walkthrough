# 01 — The coding-agent harness ecosystem
> Slice: EcosystemResearch · Researched 2026-10-08 · Scope: Definitions, product landscape, adoption evidence, and interoperability; not a benchmark ranking or a recommendation of one universal winner.

## Narration-ready takeaways
- A coding model is not the same thing as a coding agent. Academic surveys describe agents that add planning, memory, perception, and actions around a language model; practitioners call much of that surrounding machinery the harness.[1][2][4]
- The harness decides what context reaches the model, which tools it can use, where those tools run, how work survives a context reset, and how humans can supervise it.[4][6][7]
- “Harness” is useful terminology, not a settled scientific taxonomy. In October 2025, LangChain’s Harrison Chase explicitly described it as a term he was starting to see more often, with blurry boundaries between frameworks, runtimes, and harnesses.[3]
- The terminal-versus-IDE distinction is increasingly a choice of interface, not necessarily a choice of agent. OpenAI documents one Codex harness behind multiple surfaces, while ACP lets compatible editors communicate with independently developed agents.[7][17]
- Open source and model choice are separate axes. Codex CLI is Apache-2.0 and supports custom and local providers; Amp is proprietary but supports multiple models and bring-your-own provider connections.[30][40]
- The 2026 Stack Overflow survey is already available: it was released on October 6. In its coding-agent-and-assistant question, 65.5% of the 12,255 respondents in the “Used” group selected Claude Code, 58.7% selected GitHub Copilot, and 29.5% selected OpenAI Codex; these are overlapping survey selections, not exclusive market shares.[9][10]
- Adoption is real, but it does not imply unattended autonomy. In the same survey, 48.0% of respondents to the trust question said they trust AI when they can easily verify its output, while 6.6% trust it with important work decisions.[9]
- AIDev gives researchers evidence beyond product marketing: its published dataset paper reports 932,791 agent-authored pull requests through August 1, 2025. The current dataset card describes a different, later v4 snapshot with 2,743,854 pull requests through November 2025, so the two totals must not be mixed.[13][14]
- The ecosystem is converging on reusable instructions, skills, and protocols—but those solve different problems. AGENTS.md carries project guidance, Agent Skills package reusable procedures, MCP connects external systems, ACP connects editors to agents, and A2A connects independently implemented agents.[16][17][18][19][20]
- A current landscape cannot simply repeat a 2025 product list. Windsurf became Devin Desktop, the legacy Kimi CLI was replaced by Kimi Code CLI, and Roo Code’s official documentation now announces its shutdown.[43][46][48]
- omp belongs to the open, multi-provider side of this landscape, with an intentionally integrated tool surface. Its repository describes it as a Pi fork built by Stencil Labs, with LSP, debugger access, structured subagents, and memory—but those feature categories are not all exclusive to omp.[21][23][28][42][50][51]

## Findings

### Definitions: model, agent, harness, scaffold, framework, runtime, and IDE

**Academic grounding.** Wang et al.’s survey, published in *Automated Software Engineering* in 2025, organizes software-engineering agents around perception, memory, and action. The authors distinguish a language model as the cognitive core from the larger system that receives environmental information, remembers relevant information, and acts on the environment.[1] Liu et al.’s survey, published in *ACM Transactions on Software Engineering and Methodology* in March 2026, uses planning, memory, perception, and action; its explicit scope requires iterative interaction with an environment rather than simply a one-shot language-model call.[2]

These are related but not identical taxonomies: one treats planning/reasoning within action, while the other names planning separately. Neither should be cited as establishing a universally agreed definition of the modern product term “harness.” Their literature coverage is also historical: Liu et al. report a collection ending September 11, 2024, despite the later journal publication.[1][2]

| Term | Defensible meaning for this video | Boundary / caveat | Evidence |
|---|---|---|---|
| Model | The learned language-model component used for inference. | Selecting a model does not itself supply file permissions, execution environments, durable sessions, or UI. | [1][2][4] |
| Agent | A goal-directed system that iteratively perceives feedback and acts; LangChain’s operational shorthand is a model calling tools in a loop until a task is complete. | Human supervision is compatible with being an agent; “agent” does not mean fully autonomous or correct. | [2][5] |
| Harness | The surrounding code, configuration, and execution logic: prompts, tools, state, context management, execution, policies, and orchestration. | LangChain’s broad “If you’re not the model, you’re the harness” is a practitioner definition, not a formal consensus. OpenAI explicitly includes the agent loop and supporting lifecycle/auth/tool logic. | [4][5][7] |
| Scaffold | [INFERENCE] Use as an overlapping research term for an arrangement of prompts, tools, control flow, and environment around a model, rather than claim a hard technical distinction from harness. | mini-SWE-agent itself uses “agent scaffold” when explaining its deliberately simple model-focused baseline. Do not confuse it with a generated application skeleton. | [35] |
| Agent framework | Reusable programming abstractions for constructing agents. | Chase places LangChain here; the framework is something from which a configured harness can be assembled. His taxonomy expressly acknowledges overlap. | [3] |
| Agent runtime | Execution infrastructure such as persistence, streaming, durable execution, and human interrupts. | Chase places LangGraph here; runtime and framework can overlap. | [3] |
| IDE / editor / terminal UI | The human-facing work surface, which may contain a native harness, drive an external harness, or both. | One IDE can host multiple agents; one harness can power multiple interfaces. Zed and Codex provide concrete examples. | [7][17][50] |
| Harness engineering | Designing the system around model capabilities: context, environments, constraints, tools, feedback, and work continuity. | OpenAI also uses the phrase for repository architecture, documentation, and engineering processes that make a codebase legible to agents—not just editing the CLI’s agent loop. | [4][54] |

**Three authoritative practitioner formulations:**

1. LangChain documentation: “Agent = Model + Harness”; the harness is the prompt, tools, and middleware around the loop, with the job of supplying the right context at the right time.[5]
2. Anthropic calls the Claude Agent SDK a general-purpose agent harness, including context management such as compaction, then shows why additional initialization, progress artifacts, and end-to-end checks are needed for work spanning sessions.[6]
3. OpenAI calls the harness “the agent loop and logic that underlies all Codex experiences,” adding thread persistence, configuration/authentication, sandboxed tool execution, MCP, and skills.[7]

**When did the term become common?** The opened evidence supports a cautious chronology, not a coinage claim: Chase wrote on October 25, 2025 that “Agent Harness” was a term he was “just starting to see be used more,” and explicitly said he did not invent it; Anthropic published *Effective harnesses for long-running agents* on November 26, 2025; OpenAI published its App Server explanation on February 4 and *Harness engineering* on February 11, 2026; LangChain published a full harness anatomy on March 10, 2026.[3][6][7][54][4] [INFERENCE] The safe narrative is that the vocabulary became conspicuous in first-party engineering writing in late 2025 and early 2026. Establishing the first usage, or a measured popularity inflection, would require a corpus study not performed here.[3][6][7][54][4]

### Comparison table: how to read the landscape

The grouping below is editorial, by origin or prominent interface—not a claim that each product occupies only one category. Current official sources show CLI products gaining desktop/web surfaces and editors hosting external agents.[7][28][42][46][50]

**Snapshot rules:** all current ownership, licensing, interfaces, and model-support entries are **as of 2026-10-08**. “Multi-provider” means documented provider choice, not a guarantee that every model works equally well. Licenses refer to the named source component; hosted services, commercial extensions, model weights, and third-party dependencies may have separate terms. Dates name the earliest *verified milestone in the opened sources*, with origin, announcement, preview, and public availability distinguished. **Unverified** means the first release was not established, not that it did not exist. No repository-creation date is substituted for a release date.

#### Model-vendor CLI lineage

| Harness | Owner / license | Model support | Interface | First release / verified milestone | Distinguishing idea | Source |
|---|---|---|---|---|---|---|
| Claude Code | Anthropic PBC; proprietary, all rights reserved | Claude-focused official configuration; Anthropic and cloud-hosted Claude | CLI, IDE, desktop, cloud | **2025-02-24**, limited research preview | Integrated repository agent and developer-tool workflow; now also exposes reusable agent machinery | [21][39] |
| OpenAI Codex CLI | OpenAI; **Apache-2.0** CLI/core repository | OpenAI-first, **not OpenAI-only**: custom providers, Ollama/LM Studio, built-in Bedrock | Local CLI; associated IDE, desktop, web surfaces | **2025-04-16**, open-source experimental CLI | A reusable core harness and App Server across interfaces | [7][40] |
| Gemini CLI | Google; **Apache-2.0** | Gemini-focused documented defaults; not a claim that third-party adaptation is impossible | CLI and noninteractive scripts; shares technology with Gemini Code Assist | **2025-06-25**, public preview announcement | Terminal-first Google model integration, Google Search grounding, MCP extensions | [41] |
| Qwen Code | Qwen team; **Apache-2.0** | Qwen-optimized origin; current docs explicitly support OpenAI, Anthropic, Gemini, Qwen, and local providers | CLI, IDE, desktop, web, chat, SDK | **2025-07-22**, open-source announcement | Gemini CLI adaptation that evolved into multi-protocol, multi-interface agent tooling | [42] |
| Kimi CLI → **Kimi Code CLI** | Moonshot AI; legacy Python CLI **Apache-2.0**; current successor **MIT** | Kimi defaults; other compatible providers documented | Terminal/TUI, ACP-compatible editors | First public release **unverified**; legacy final release **1.52.0, 2026-09-22** | Successor ships a single-binary distribution, isolated coder/explore/plan workers, video input, hooks, and ACP | [43] |

**Vendor-bound nuance:** Anthropic’s documented model configuration is Claude-centric, but Qwen’s own 2025 release documented a Claude Code proxy route for Qwen3-Coder. Therefore “Claude Code can never run a non-Anthropic model” would be too strong; distinguish first-party supported configuration from third-party compatibility.[39][42] Likewise, treating all vendor CLIs as closed-source or single-provider is directly contradicted by Codex and Qwen’s current sources.[40][42]

#### IDE-origin / editor-integrated agents

| Harness | Owner / license | Model support | Interface | First release / verified milestone | Distinguishing idea | Source |
|---|---|---|---|---|---|---|
| Cursor | Anysphere, Inc.; proprietary | Multiple model vendors plus Cursor model offerings | AI-oriented editor | Exact first launch **unverified**; **0.2.0, 2023-04-06** is an early verified public release | Editor designed around AI pair programming; early migration from CodeMirror to VSCodium fork | [44] |
| GitHub Copilot **agent mode** | GitHub/Microsoft; **MIT** VS Code Chat extension source; commercial service separately governed | Multiple vendors; availability varies by plan and surface | Editor agent mode; separate cloud-agent products exist | **2025-02-06**, VS Code Insiders preview | Iterates on edits and runtime feedback inside the editor | [45] |
| Windsurf / Cascade → **Devin Desktop / Devin Local** | Originally Codeium; current Cognition; proprietary platform | Multi-model; also hosts third-party agents via ACP | Full IDE plus agent command center; related CLI/cloud surfaces | Windsurf **2024-11-13** GA; successor **2026-06-02** launch | Original “flows” combined user activity with agent context; successor organizes local/cloud/third-party agents in Spaces and a Kanban view | [46] |
| Cline | Cline Bot Inc.; core repository **Apache-2.0**; JetBrains plugin not open-sourced | Multi-provider, including local Ollama/LM Studio and compatible endpoints | IDE, CLI, desktop, SDK | Exact public release **unverified**; creator dates initial hackathon demo to **July 2024** | Reviewable edits/checkpoints, explicit Plan/Act workflow, shared extensible engine | [47] |
| Roo Code — **historical/retired entry** | Roo Code, Inc.; **Apache-2.0** | Model-agnostic archived documentation | VS Code extension | First release **unverified**; official docs announce shutdown on **May 15** | Cline-derived configurable modes and cross-mode orchestration; do not recommend it as an actively maintained October-2026 alternative | [48] |
| Kilo Code | Kilo team / Kilo-Org; current repository **MIT** | Multi-provider with mid-task switching | VS Code, JetBrains, CLI, cloud | **2025-03-26**, verified public availability announcement | Original VS Code extension forked Roo/Cline; current CLI explicitly derives from OpenCode | [49] |
| Zed Agent | Zed Industries, Inc.; primarily **GPL-3.0-or-later**, marked Apache-2.0 components | Hosted, API, subscription, gateway, and local options | Native editor agent; ACP external agents; terminal threads | **2025-05-07**, agentic-editing public announcement; not the editor’s first release | Agent workflows and editable multibuffer review integrated with a native editor; explicit separation of agent choice and model access | [50] |
| JetBrains Junie | JetBrains s.r.o.; proprietary, all rights reserved | Current product explicitly model-agnostic / BYOK | Junie Local in JetBrains IDEs; Junie CLI | **January 2025**, EAP announcement; exact day not established from opened publication metadata | Uses the IntelliJ IDEA engine for project understanding, inspections, and verification | [51] |

**Additional present-day names the blueprint misses:** Google announced Antigravity on November 18, 2025 as an agentic development platform spanning editor, terminal, and browser, with task-oriented agent management; the 2026 survey lists it separately from Gemini Code Assist.[52][9] Mistral also maintains the Apache-2.0 Mistral Vibe CLI, whose current repository describes subagents, skills, MCP, and editor integration.[53] These should not be silently subsumed under Gemini CLI or generic independent tools.[41][52][53]

#### Independent CLI-origin products and terminal environments

| Harness | Owner / license | Model support | Interface | First release / verified milestone | Distinguishing idea | Source |
|---|---|---|---|---|---|---|
| Aider | Aider-AI maintainers; **Apache-2.0** | Cloud and local LLMs | Terminal; editor/watch integration | First release **unverified**; publicly installable by **2023-05-25** | Repository map and Git-integrated pair editing / automatic commits | [27] |
| OpenCode — **anomalyco/opencode** | Anomaly; **MIT** | Provider-agnostic, including local models | TUI, desktop, IDE extension | First release **unverified** | LSP integration, multiple sessions, build/plan agents; not the archived Go project with the same name | [28][55] |
| Goose | Originated at Block; now AAIF/Linux Foundation project; **Apache-2.0** | Multiple providers and local models | Desktop, CLI, API | **2025-01-28**, codename-goose launch announcement | On-machine general-purpose agent with MCP-based extensions | [15][29] |
| Amp | **Amp Frontier Corporation**; proprietary | Multi-model defaults plus API keys, subscriptions, cloud providers, custom endpoints | CLI, web, macOS/iOS apps | **2025-05-15**, public availability / waitlist removal; earlier preview date unverified | Opinionated multi-model workflow; shared threads and per-thread remote machines called orbs | [30] |
| Crush | Charmbracelet, Inc.; **FSL-1.1-MIT**, not unrestricted MIT at release | Multi-model; compatible custom APIs | Terminal TUI | **2025-07-30**, Crush announcement; predecessor earlier | Charm terminal interface, LSP/MCP, model switching while preserving context | [31][55] |
| Factory Droid | The San Francisco AI Factory Inc.; proprietary | Multiple model providers | CLI/headless, desktop/web/mobile, IDE/workflow integrations | **2025-09-25**, availability to anyone; earlier private/product origins unverified | Complete software-delivery tasks across existing work surfaces, long-running work and automation | [32] |
| Warp | Warp; current client **AGPLv3**, UI crates **MIT**; service scope separate | Multi-model and multi-harness | Terminal-derived development environment, built-in or external agents | Agent Mode **2024-06-17**; client open-sourced **2026-04-28**; terminal predates agent mode | Terminal-native execution plus agent management; not merely a coding CLI | [33] |

**Name and license traps:** the archived **opencode-ai/opencode** says it continued as Crush; it is not today’s **anomalyco/opencode**.[55][28] Crush’s current license restricts competing commercial use and grants MIT rights on each version’s second anniversary; calling it simply “MIT open source” erases that restriction.[31] Conversely, calling Warp’s current client closed-source is stale: the actual code repository and April 2026 announcement establish its open-source cutover.[33]

#### Research scaffolds / evaluation-oriented implementations

| Harness or scaffold | Owner / license | Model support | Interface | First release / verified milestone | Distinguishing idea | Source |
|---|---|---|---|---|---|---|
| SWE-agent | Princeton/Stanford research team; **MIT** | Language model of choice | CLI, batch research runs | **2024-04-02**, explicit release announcement | Configurable agent–computer interfaces; current maintainers recommend mini-SWE-agent for default use | [34][35] |
| mini-SWE-agent | SWE-agent team; **MIT** | Multiple model interfaces/providers | CLI, batch, Python bindings, trajectory viewer | First release **unverified** in the opened sources; current docs identify v2 | Bash-only actions, linear history, independent subprocess actions; “100 lines” refers to the agent class, not the complete package | [35] |
| OpenHands | OpenHands / All Hands AI and community; current named repository **MIT** | Model-agnostic; current Agent Canvas also hosts other agents | Self-hosted GUI/control center, local/remote/cloud backends | Project began **2024-03-12** as OpenDevin; exact first runnable release unverified | General software-engineering agent platform; now also a multi-agent automation/control surface | [38] |
| Agentless | OpenAutoCoder; **MIT** | OpenAI setup and Claude integration documented; arbitrary model compatibility not established here | Python research/batch pipeline | **2024-07-01**, v1.0 release | Localization → repair → patch validation, rather than a free-form agent loop | [36] |
| Terminus | Terminal-Bench team; original framework **Apache-2.0** | Model-agnostic via LiteLLM | Evaluation agent controlling a sandboxed terminal | **2025-05-19**, research-preview announcement | Original design uses one interactive tmux tool and runs agent logic outside the task container; not an everyday unrestricted-agent recommendation | [37] |

Research and commercial categories overlap: OpenHands’ current repository describes an agent control center, while mini-SWE-agent explicitly serves both research and everyday CLI workflows. “Research scaffold” is therefore an origin/use-case label, not a claim that the tool cannot be deployed.[35][38]

#### Minimal/extensible and personal-agent lineage — brief entries

| Harness | Owner / license | Model support | Interface | First release / verified milestone | Distinguishing idea | Source |
|---|---|---|---|---|---|---|
| Pi | Creator Mario Zechner; current **earendil-works/pi** repository; **MIT** | Multi-provider | CLI, RPC, TypeScript SDK | Exact first release **unverified here**; creator’s public account **2025-11-30** | Minimal extensible harness; current README deliberately omits built-in subagents/plan mode, while the current changelog documents built-in MCP | [22] |
| oh-my-pi / **omp** | Stencil Labs / **can1357/oh-my-pi**; **MIT** | Multi-provider | CLI/TUI, programmatic/editor integration including ACP | Exact first release **unverified here** | Pi-derived “batteries included” harness: LSP, DAP, hashline editing, structured subagents, memory, and execution tools | [23] |
| OpenClaw | OpenClaw Foundation; **MIT** | Multiple model and harness plugins | Personal/team gateway, messaging and native apps | Exact first release **unverified here** | Personal-assistant integration and persistent gateway, not solely a coding CLI; current docs say it owns its agent runtime | [25] |
| Hermes Agent | Nous Research; **MIT** | Model-agnostic | CLI, desktop, messaging, server deployment | **2026-02-25**, official release index | Agent-curated memory, skills generated from experience, scheduled work, and isolated delegation | [24] |

Pi’s November 2025 essay is historical evidence of design motivation, not a reliable current feature matrix: its October 2026 changelog includes MCP commands and related fixes.[22] Similarly, current OpenClaw runtime documentation says no external agent framework packages remain and identifies `pi-tui` as a remaining UI dependency. Do not equate historical Pi ancestry with a current dependency on the entire Pi harness.[25]

#### New entrant

| Harness | Owner / license | Model support | Interface | First release / verified milestone | Distinguishing idea | Source |
|---|---|---|---|---|---|---|
| **DeepSeek Harness (`dsh`)** | **DeepSeek AI**, canonical **deepseek-ai/deepseek-harness**; **MIT** | DeepSeek plus other catalog providers and custom OpenAI/Anthropic-compatible APIs | Web, Electron desktop, headless, SDK, ACP profiles | Exact launch date **unverified**; official README says **developer preview** as of access | Cordis-powered “everything is a plugin,” including adapters, tools, session state, and the agent loop | [26] |

The official project is established by its DeepSeek-owned repository, self-identification, DeepSeek domain link, and linked documentation. No lookalike domain is needed as evidence, and the table does not promote an unofficial August launch-date claim to fact.[26]

### Adoption: separate survey selections, observed contributions, and vendor claims

#### Stack Overflow 2025 versus the newly released 2026 survey

The 2025 survey reported **84% using or planning to use AI tools**, **51% of professional developers using them daily**, and **52% either not using agents or using simpler AI tools**. Those are different populations and constructs; the 84% must not be narrated as agent adoption.[8]

The 2026 results were released **October 6, 2026**, and the survey overview reports **30,903 responses** from **169 countries**. Individual optional questions have smaller denominators.[10] For `AISelect` (`v2026.1`, n = 17,464), **65.9%** selected “AI coding assistants or coding agents,” **62.5%** general-purpose chat, and **26.2%** “AI agents or automated workflows.” For `AIFreq`, **73.0%** is the daily-use percentage for the coding-assistant/agent row, not 73% of all developers.[9]

The `AICodeAgent` question asks about use **in the past year**, not exclusive preference, current daily use, paid seats, or “best” product. Its **Used n = 12,255** table reports the following selections; percentages are quoted rather than recomputed.[9]

| Survey label | Respondents selecting “Used” | Reported percent | Interpretation |
|---|---:|---:|---|
| Claude Code | 8,030 | 65.5% | Past-year selection in this question’s respondent group |
| GitHub Copilot | 7,196 | 58.7% | Broad product label, not isolated agent-mode telemetry |
| OpenAI Codex | 3,620 | 29.5% | Does not separate CLI, IDE, app, and web |
| Cursor | 3,127 | 25.5% | Past-year product selection |
| Google Antigravity | 1,956 | 16.0% | Distinct from Gemini Code Assist in questionnaire |
| Gemini Code Assist | 1,789 | 14.6% | Do not silently relabel this as Gemini CLI |
| Open Code | 1,662 | 13.6% | Preserve survey spelling; no repository identifier in the table |
| JetBrains AI | 1,569 | 12.8% | Not a Junie-only measurement |
| Windsurf | 796 | 6.5% | Historical product name within a past-year question |
| Warp | 641 | 5.2% | Past-year product selection |
| Cline | 551 | 4.5% | Past-year product selection |
| Pi | 535 | 4.4% | No separate omp result is established |
| Kilo Code | 392 | 3.2% | Past-year product selection |
| Aider | 256 | 2.1% | Past-year product selection |

Source for every row: Stack Overflow 2026, AI data §2.3, “AI coding agents,” `AICodeAgent`, n = 12,255, accessed 2026-10-08.[9]

[INFERENCE] A bar chart of these selections is defensible if its title says “reported past-year use among respondents to this question.” A pie chart labelled market share is not: the categories overlap and the question does not measure exclusive users.[9] [INFERENCE] Do not turn the 2025-to-2026 headline differences into a clean growth curve: the questionnaire now combines coding assistants and agents and separately lists agents/workflows, while the earlier agent question defined autonomous entities with minimal intervention.[8][9]

**Source-internal discrepancies:** the 2026 launch blog says 67% familiar-code generation and 61% debugging, while the data page reports **69.3%** and **63.8%** for its current workflow rows. This dossier uses the explicit data-table values if needed, and does not silently reconcile the difference.[9][10]

#### JetBrains State of Developer Ecosystem

JetBrains’ 2025 report is based on **24,534** cleaned responses across **194 countries**, collected **April–June 2025**, with balancing by geography, employment, programming language, and JetBrains-product use. It reports **85%** regularly using AI for coding/development and **62%** relying on at least one coding assistant, agent, or editor.[11] This is a primary company-run developer survey, not a peer-reviewed causal productivity experiment, and its grouped categories do not identify a harness’s market share.[11]

#### GitHub Octoverse

Octoverse 2025, published October 28, 2025 and updated February 28, 2026, reports that **nearly 80% of new developers on GitHub use Copilot within their first week**. The population is new GitHub developers, and the product is Copilot broadly—not all software developers and not specifically autonomous agent mode.[12] GitHub explicitly calls its activity observations **observational rather than causal**, so higher repository/PR activity must not be credited to agent harnesses alone.[12]

#### AIDev: real agent-associated pull requests, with version discipline

The AIDev dataset paper by Li, Zhang, and Hassan was published in the **23rd International Conference on Mining Software Repositories (MSR 2026)**; the ACM-deposited DOI metadata confirms the proceedings venue and April 13, 2026 publication. The latest arXiv HTML opened resolves to **2602.09185v1, 2026-02-09**.[13]

Its Table 1 and §1 report **932,791 Agentic-PRs**, **116,211 repositories**, and **72,189 developers**, with a **2025-08-01 cutoff**, covering Codex, Devin, Copilot, Cursor, and Claude Code. Its enriched subset is **33,596 PRs** from **2,807 repositories with more than 100 stars**.[13]

The **current author-maintained dataset card** is instead **v4, cutoff November 2025**, with **2,743,854 PRs**, **327,477 repositories**, **159,056 human developers**, and **six agents**, adding Google Jules. This later snapshot is grade C artifact documentation, not a claim that the published paper evaluated all those records.[14] The card contains a commented-out v5 lead; it is not used as a released-data claim.[14]

[INFERENCE] These records establish substantial visible participation in GitHub workflows, not the total fraction of all code written by AI, private-repository adoption, or a controlled comparison of harness quality. Product-specific raw merge percentages should not become a winner chart without controlling for task mix, repository population, attribution, and human selection.[13][14]

#### Vendor-reported signals — explicitly not comparable user counts

- OpenCode’s homepage claims **“16M Monthly Devs”** as of **2026-10-08**. The opened page does not provide a counting methodology, sampling frame, or uncertainty interval; quote only as **Anomaly’s vendor-reported claim**, not independently measured adoption.[28]
- Cline’s creator announced **five million installations** across editors in January 2026. This is **vendor-reported installation count**, not five million unique or active developers; the page is dated January 29 locally and January 30 in its UTC publication metadata.[47]
- GitHub stars are intentionally not used as a primary adoption metric in this dossier. [INFERENCE] A star count is a repository-attention signal and cannot be substituted for the survey or contribution populations above.[9][13][14]

### Structural trends and shared primitives

#### 1. Openness, model choice, and interface choice are independent

Concrete counterexamples prevent a simplistic binary: Codex is a vendor-origin open-source harness with custom providers; Amp is proprietary and multi-provider; Qwen Code is vendor-origin, open-source, and explicitly multi-protocol; Zed is an open-source editor that can run its native agent or external ACP agents.[30][40][42][50] [INFERENCE] A useful comparison should have separate columns for source rights, model/provider access, and work surface rather than a single “open versus locked-in” badge.[30][40][42][50]

#### 2. One harness, many surfaces; one surface, many harnesses

OpenAI’s App Server separates Codex core from clients through a bidirectional JSON-RPC interface, supporting progress, approvals, thread state, and diffs.[7] Zed documents native agents, external ACP agents, and terminal threads separately; Devin Desktop and OpenHands Agent Canvas also document hosting agents from other vendors.[50][46][38] [INFERENCE] Interface competition is increasingly accompanied by composition: a user can choose an editor without accepting only that editor’s native harness.[17][46][50]

#### 3. Convergence does not mean identical behavior

| Primitive | What is shared | What is not established by the shared name | Examples / sources |
|---|---|---|---|
| **AGENTS.md** | Plain Markdown project instructions: setup, tests, style, conventions; a predictable discovery location | Identical precedence, trust, automatic execution, or discovery in every harness | Official format page even gives explicit configuration for Aider and Gemini CLI. [19] |
| **Agent Skills** | A folder with `SKILL.md` metadata/instructions, optionally scripts/resources; progressive disclosure of full instructions | Safety or correctness of arbitrary skills; identical lifecycle or execution policy | Open format originally developed by Anthropic, with a broad client showcase. [20] |
| **MCP** | Connection between AI applications and external data/tools/workflows | A full coding-agent UI protocol or a universal internal multi-agent scheduler | MCP docs; OpenAI explains why richer Codex UI/session semantics motivated App Server. [16][7] |
| **Subagents / teams** | Delegation, separate context, role/task specialization | One standard messaging protocol, scheduling policy, budget policy, or guaranteed quality benefit | Claude Code teams, omp structured workers, Qwen Code teams, and Kimi isolated subagents are all documented. [21][23][42][43] |
| **Hooks / middleware** | Lifecycle interception and integration points | That every hook is deterministic or equally secure: Claude supports shell, HTTP, MCP, LLM-prompt, and subagent hook types | Claude reference; Codex advanced configuration; Cline plugins. [21][40][47] |
| **Persistent context and state** | Session persistence, memory files, summaries, work artifacts | Model-weight learning, flawless recall, or a common memory representation | Anthropic long-running work; Hermes skills/memory; omp memory; LangChain harness anatomy. [6][24][23][4] |

A particularly important distinction: a natural-language instruction asks the model to do something; an execution policy or command hook can enforce a rule in code. A hook that calls another model remains probabilistic. [INFERENCE] “Supports hooks” alone is insufficient evidence that a safety boundary is enforced.[21][4]

#### 4. Protocol map: MCP, ACP, and A2A are complementary boundaries

- **MCP — Model Context Protocol:** official docs define an open standard connecting AI applications to external systems, including data sources, tools, and prompts/workflows. Anthropic open-sourced it in November 2024; the Linux Foundation announced its contribution to AAIF in December 2025.[16][15]
- **ACP — Agent Client Protocol:** standardizes editor/IDE-to-coding-agent communication, including agent-specific UX such as diffs. Local agents use JSON-RPC over stdio. The introduction describes remote HTTP/WebSocket scenarios but warns full remote support remains work in progress; do not present every future transport capability as complete.[17]
- **A2A — Agent2Agent:** supports communication and delegation between independently built, opaque agent applications. Its own documentation explicitly says it is **not an agent development kit and not a protocol for an agent’s own subagents**; internal workers may instead use framework-native mechanisms or MCP.[18]
- **Acronym collision:** the AAIF press release also links an “ACP” to OpenAI’s **commerce** documentation. That is not the Agent Client Protocol used by Zed/editor integrations; spell out the name in narration and graphics.[15][17]

On **December 9, 2025**, the Linux Foundation announced AAIF with founding contributions of **MCP from Anthropic, Goose from Block, and AGENTS.md from OpenAI**. The same statement described AGENTS.md’s August 2025 release; the format’s own site credits collaborative work across Codex, Amp, Jules, Cursor, and Factory.[15][19] This is a concrete governance/convergence event, not proof that all tools implement these standards identically.[15][19]

#### 5. “Minimal” and “batteries included” coexist

mini-SWE-agent deliberately prioritizes a simple bash-only loop and transparent trajectories, while omp deliberately bundles richer tool and orchestration surfaces. Pi emphasizes customization, and DeepSeek Harness makes the loop and adapters themselves replaceable plugins.[35][23][22][26] [INFERENCE] These are different design choices—not a proven linear succession from primitive to advanced, and not enough evidence to prescribe one design for every task.[35][23][22][26]

## Key numbers

| Claim/metric | Value | Conditions (model, harness, benchmark/version, date) | Source [n] (location) | Grade |
|---|---|---|---|---|
| SO 2026 total response count | **30,903** | Developer Survey 2026; 169 countries; released 2026-10-06; not every respondent answered every question | [10], overview “At a glance” / release article | C |
| Coding assistant/agent use | **65.9%; 11,509 / 17,464** | `AISelect`, multi-select, optional, v2026.1; “in your role at work”; no model/harness versions | [9], §2.1 “AI tool usage” | C |
| Agent/automated-workflow use | **26.2%; 4,582 / 17,464** | Same question; separate category from coding assistant/agent; overlap allowed | [9], §2.1 “AI tool usage” | C |
| Daily coding assistant/agent use | **73.0%** | Among users of that category; `AIFreq`, optional scale, v2026.1; overall question n = 14,478, not a row-specific denominator | [9], §2.1 “AI tool usage frequency” | C |
| Claude Code past-year use | **65.5%; 8,030 / 12,255** | `AICodeAgent`, Used group, v2026.1, accessed 2026-10-08; not exclusive share | [9], §2.3 “AI coding agents” | C |
| GitHub Copilot past-year use | **58.7%; 7,196 / 12,255** | Same survey question; includes broad Copilot label, not agent-mode-only | [9], §2.3 | C |
| OpenAI Codex past-year use | **29.5%; 3,620 / 12,255** | Same survey question; no surface/version breakdown | [9], §2.3 | C |
| Trust only when easily verifiable | **48.0%; 6,872 / 14,304** | `AITrust`, single-select, optional, v2026.1 | [9], §2.2 “Trust in AI tools” | C |
| Trust including important decisions | **6.6%; 949 / 14,304** | Same question, different category; not a measured error rate | [9], §2.2 | C |
| 2025 AI use or planned use | **84%** | SO 2025; broad AI tools, not agents; usage question n = 33,662 | [8], §3.1 “AI tools in the development process” | C |
| JetBrains regular AI coding/development use | **85%** | April–June 2025 survey; 24,534 cleaned responses across 194 countries; balanced response sample | [11], “AI proficiency” / “Methodology” | C |
| JetBrains coding assistant/agent/editor use | **62%** | Same report, combined product categories | [11], “AI proficiency” | C |
| New GitHub developers using Copilot in first week | **“nearly 80%”** | GitHub vendor/platform-reported; Octoverse 2025, updated 2026-02-28; not all developers or agent mode | [12], “The state of GitHub in 2025” | C |
| Published AIDev Agentic-PRs | **932,791** | Five agents; cutoff **2025-08-01**; arXiv **2602.09185v1, 2026-02-09**, MSR 2026; not a benchmark run | [13], §1 / Table 1 | A |
| Published AIDev enriched subset | **33,596 PRs / 2,807 repositories** | Repositories **>100 stars**, same paper/snapshot | [13], Table 1 | A |
| Current AIDev artifact snapshot | **2,743,854 PRs / 327,477 repositories / 159,056 human developers** | **v4**, six agents, cutoff **November 2025**, accessed 2026-10-08; not the paper’s original sample | [14], “Overview” / “Quick Look” | C |
| OpenCode claimed monthly developers | **“16M”** | Vendor-reported homepage figure as of 2026-10-08; definition/CI not supplied in opened page | [28], “Monthly Devs” | C |
| Cline claimed installations | **“five million”** | Vendor-reported multi-editor installs; Jan 29/30, 2026 announcement; not unique users | [47], opening / “From garage project” | C |

Survey percentages and counts are quoted as published, not recalculated. No confidence intervals are supplied alongside the quoted website tables. These are adoption/usage signals; there are no model-performance benchmark numbers in this slice.[8][9][10][11][12][13][14]

## Contested or uncertain

- **There is no authoritative single harness boundary.** Chase explicitly acknowledges overlap; LangChain’s broad definition and OpenAI’s product-specific decomposition are useful but should not be presented as an agreed standard.[3][4][7]
- **“First release” is often not recoverable from a modern README.** This dossier names public previews, dated announcements, project origins, or first documented existence separately. Unknown first dates remain unknown; they are not filled with repository timestamps or secondary-site guesses.
- **The 2026 survey’s product choices are not mutually exclusive or uniformly scoped.** “JetBrains AI,” “Gemini Code Assist,” “GitHub Copilot,” and “OpenAI Codex” can denote broader products than a specific harness/version. The same page separates general agents/workflows from coding assistants/agents.[9]
- **Survey editorial summaries can differ from their tables.** The familiar-code/debugging values differ between the 2026 release article and data tables; daily-use prose can also obscure its conditional denominator. Prefer the displayed question, population, and table, and retain the discrepancy note.[9][10]
- **AIDev is versioned evidence.** The published paper and present v4 artifact describe different cutoffs, agents, and sample sizes. Neither should be described as a census of all AI coding.[13][14]
- **Current source versus shipped artifact:** this is a documentation/repository survey, not an installation or runtime audit. Current default branches may include changes not yet in a stable package. No “works in practice” claim is inferred solely from source presence.
- **Current product descriptions can be stale inside standards showcases.** For example, the shared-skills and AGENTS.md sites still list historical names such as Roo/Windsurf, while the products’ own sources document shutdown or renaming. Product-specific current sources take precedence for lifecycle status.[19][20][46][48]
- **Weakest numeric evidence:** OpenCode’s “16M Monthly Devs” and Cline’s installation total are first-party claims with no comparable active-user methodology in the opened pages. They remain grade C and explicitly vendor-reported; neither is used to rank quality.[28][47]

## Corrections & nuances to the blueprint

1. **Do not conflate model, harness, and interface.** A model family is not a harness; an editor can host another company’s harness; several interfaces can share one core.[2][7][17][50]
2. **Vendor CLI does not mean closed or strictly vendor-bound.** Codex CLI is Apache-2.0 and supports custom/local providers; Qwen Code is explicitly multi-protocol.[40][42]
3. **The “mainstream tools lack subagents/LSP/hooks” narrative is not current.** Claude Code documents teams and hooks, Qwen’s current feature table includes LSP and teams, OpenCode advertises LSP, Zed integrates editor intelligence, and Junie is built on the IntelliJ engine. Any omp advantage must be demonstrated at the level of particular semantics or workflows, not asserted from the generic feature name.[21][28][42][50][51]
4. **Several named products need updated labels.** Windsurf/Cascade → Devin Desktop/Devin Local; legacy Kimi CLI → Kimi Code CLI; Roo Code belongs in the historical lineage, not the active recommendation set.[43][46][48]
5. **Open/closed labels need component and date qualifiers.** Warp client is open-source since April 2026; Crush is currently FSL-1.1-MIT; Copilot Chat source is MIT but the service has separate terms; Cline’s JetBrains plugin is not open-sourced.[33][31][45][47]
6. **Pi and omp should not be collapsed into one product.** Their own repositories state different default philosophies; current Pi is also not accurately described with a frozen 2025 “no MCP” claim.[22][23]
7. **OpenClaw and Hermes are broader personal/general agents, not merely coding CLIs.** Their messaging, state, and automation roles explain their place in this map.[24][25]
8. **DeepSeek Harness is real and official, but its exact launch date remains unverified here.** Its preview status and plugin architecture are supported by the actual DeepSeek repository, not lookalike sites.[26]
9. **Add Antigravity and Mistral Vibe to the awareness map.** They are present in opened official material and in the 2026 survey; the original blueprint was illustrative, not a complete current list.[9][52][53]
10. **A2A is not a prescription for an internal mixture-of-agents architecture.** Its official docs explicitly distinguish independent-agent interoperability from an agent’s own subagent mechanism.[18]

## Open questions for the user

- Should the opening landscape stay focused on developer-controlled coding tools, or include personal-agent gateways and cloud/software-factory control planes? The dossier supports both, but they require different comparison criteria.
- Should the video show the new Stack Overflow adoption bars, prominently labelled as overlapping past-year survey selections, or keep adoption as a brief contextual statement to avoid a popularity-ranking impression?
- For narration, is a short ecosystem map plus a downloadable full comparison preferable to naming every product on screen? This is an editorial pacing decision, not a missing research fact.

## Unverified leads

- Exact first public/runnable release dates for OpenCode, Pi, omp, OpenClaw, Cline, Roo Code, Kimi’s legacy/successor CLIs, mini-SWE-agent, and DeepSeek Harness; exact day of Junie’s January 2025 announcement. Dated milestones in the table are deliberately not represented as proof of first-ever release.
- A first coinage or quantitative popularity curve for “agent harness.” The dated first-party sequence establishes visible usage, not invention.[3][6][7][54][4]
- The AIDev card’s commented-out **v5 / AIDev-7.6M** lead is not treated as an available released snapshot without separate version verification.[14]
- A comparable independent, current monthly-active-user census across harnesses. None is established by the opened surveys, vendor counters, or public-PR dataset.[9][14][28][47]
- A full October-2026 JetBrains ecosystem edition and Octoverse 2026 are not established by the opened sources; the cited JetBrains/Octoverse editions remain explicitly 2025 rather than being silently relabelled current-year research.[11][12]

## Visual ideas

- **Model → harness → interface cutaway:** animate a model inside a ring of prompts, context, tools, execution, state, policy, and orchestration, with CLI/IDE/web views outside it. Ground the component labels in LangChain and Codex’s own architecture; make clear this is a synthesized explanatory diagram, not a universal standard.[4][7]
- **Two-way interface graph:** one Codex core connects to several surfaces; one Zed/Devin Desktop surface connects to several agents. Use ACP on editor↔agent edges, not on model-provider edges.[7][17][46][50]
- **An ecosystem matrix instead of a podium:** rows for the product families, independent columns for license, provider choice, work surface, and execution location. The comparison tables supply the data; do not imply the row ordering is a benchmark rank.[22]–[53]
- **2026 reported-use bars:** use the exact `AICodeAgent` counts/percentages above, show n = 12,255 and “used in the past year; multiple selections.” No pie chart and no inferred omp usage from Pi’s row.[9]
- **Two AIDev snapshot cards:** paper: 932,791 PRs / five agents / Aug 1, 2025; current artifact v4: 2,743,854 / six agents / Nov 2025. Animate the cutoff label with the count so viewers cannot confuse the two.[13][14]
- **Protocol wiring diagram:** user/editor —ACP→ agent; agent —MCP→ tool/data; independent agent —A2A→ independent agent. Add a dotted native internal-subagent branch to avoid suggesting A2A is required for internal delegation.[16][17][18]
- **Dated change markers:** show Windsurf → Devin Desktop (June 2, 2026), Kimi legacy final release (September 22, 2026), and Warp’s source opening (April 28, 2026). This visual makes the need for current citations concrete.[46][43][33]
- **Vocabulary timeline:** October 25, 2025 LangChain framework/runtime/harness distinction → November 26 Anthropic long-running harnesses → February 4/11, 2026 OpenAI harness/App Server writing → March 10 LangChain anatomy. Caption “selected first-party publications,” not “invention of harnesses.”[3][6][7][54][4]

## References

All sources below were opened with `read` in this research session. Related first-party documents are grouped under one number when together supporting a product row. Grades: **A** peer-reviewed publication; **B** preprint/formal technical report; **C** primary project/vendor/standards source. No grade D/E evidence is needed for the findings. Repository and documentation snapshots are mutable; access date applies to every grouped URL.

[1] Yanlin Wang et al. “Agents in software engineering: survey, landscape, and vision.” *Automated Software Engineering* 32, article 70, 2025; publisher confirms publication 2025-08-07. https://link.springer.com/article/10.1007/s10515-025-00544-2 . Open manuscript: https://arxiv.org/html/2409.09030 (resolved **v2, 2024-09-23**). Grade: **A** for the published survey; manuscript version recorded separately. Accessed 2026-10-08.

[2] Junwei Liu, Kaixin Wang, Yixuan Chen, Xin Peng, Zhenpeng Chen, Lingming Zhang, Yiling Lou. “Large Language Model-Based Agents for Software Engineering: A Survey.” *ACM Transactions on Software Engineering and Methodology*, 2026. https://doi.org/10.1145/3796507 (ACM-deposited Crossref metadata confirms journal and **2026-03-05** publication); https://arxiv.org/html/2409.02977 (resolved **v2, 2025-12-03**, §§I–III). Grade: **A**; journal HTML returned 403, publisher-deposited DOI metadata and open manuscript were accessible. No claims about unexamined v1→v2 changes. Accessed 2026-10-08.

[3] Harrison Chase. “Agent Frameworks, Runtimes, and Harnesses—oh my!” LangChain, **2025-10-25**. https://www.langchain.com/blog/agent-frameworks-runtimes-and-harnesses-oh-my . Grade: **C**. Accessed 2026-10-08.

[4] Vivek Trivedy. “The Anatomy of an Agent Harness.” LangChain, **2026-03-10**. https://www.langchain.com/blog/the-anatomy-of-an-agent-harness . Grade: **C** (engineering explanation, not peer-reviewed research). Accessed 2026-10-08.

[5] LangChain. “Agents.” Current documentation, 2026 snapshot. https://docs.langchain.com/oss/python/langchain/agents . Grade: **C**. Accessed 2026-10-08.

[6] Justin Young. “Effective harnesses for long-running agents.” Anthropic, **2025-11-26**. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents . Grade: **C**. Accessed 2026-10-08.

[7] Celia Chen. “Unlocking the Codex harness: how we built the App Server.” OpenAI, **2026-02-04**. https://openai.com/index/unlocking-the-codex-harness/ . Grade: **C**. Accessed 2026-10-08.

[8] Stack Overflow. “AI.” *2025 Developer Survey*, 2025. https://survey.stackoverflow.co/2025/ai . Grade: **C**, primary survey report. Accessed 2026-10-08.

[9] Stack Overflow. “AI data 2026.” *2026 Developer Survey*, questionnaire **v2026.1**, 2026. https://survey.stackoverflow.co/2026/ai/data.md ; editorial chapter https://survey.stackoverflow.co/2026/ai . Grade: **C**, primary survey report. Accessed 2026-10-08.

[10] Stack Overflow. “The results of the 2026 Developer Survey are here!” **2026-10-06**. https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/ ; “Stack Overflow Developer Survey 2026,” https://survey.stackoverflow.co/2026/ . Grade: **C**. Accessed 2026-10-08.

[11] Olga Bedrina. “The State of Developer Ecosystem 2025: Coding in the Age of AI, New Productivity Metrics, and Changing Realities.” JetBrains Research, October 2025. https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/ . Grade: **C**, primary company-run survey. Accessed 2026-10-08.

[12] GitHub Staff. “Octoverse: A new developer joins GitHub every second as AI leads TypeScript to #1.” GitHub, **2025-10-28**, updated **2026-02-28**. https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/ (opened through https://github.blog/2025-10-28-octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1). Grade: **C**, vendor/platform-reported observations. Accessed 2026-10-08.

[13] Hao Li, Haoxiang Zhang, Ahmed E. Hassan. “AIDev: Studying AI Coding Agents on GitHub.” *Proceedings of the 23rd International Conference on Mining Software Repositories*, ACM, **2026-04-13**. https://doi.org/10.1145/3793302.3797249 (publisher-deposited proceedings metadata); https://arxiv.org/html/2602.09185 (latest resolved **v1, 2026-02-09**), §1/Table 1. Grade: **A**; ACM HTML was inaccessible, DOI metadata confirmed venue. Accessed 2026-10-08.

[14] Hao Li / AIDev authors. “AIDev dataset card,” **v4**, cutoff November 2025; 2026 snapshot. https://huggingface.co/datasets/hao-li/AIDev . Grade: **C**, author-maintained artifact, distinct from the paper’s sample. Accessed 2026-10-08.

[15] The Linux Foundation. “Linux Foundation Announces the Formation of the Agentic AI Foundation (AAIF), Anchored by New Project Contributions Including Model Context Protocol (MCP), goose and AGENTS.md.” **2025-12-09**. https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation . Grade: **C**. Accessed 2026-10-08.

[16] Model Context Protocol maintainers. “What is the Model Context Protocol (MCP)?” Documentation, **2026-07-28** route. https://modelcontextprotocol.io/docs/getting-started/intro (resolved https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro). Grade: **C**. Accessed 2026-10-08.

[17] Agent Client Protocol maintainers. “Introduction.” Current documentation, 2026 snapshot. https://agentclientprotocol.com/overview/introduction (resolved https://agentclientprotocol.com/get-started/introduction). Grade: **C**. Accessed 2026-10-08.

[18] A2A Protocol / Linux Foundation. “Agent2Agent Protocol,” especially “What A2A Is Not.” Current documentation, 2026 snapshot. https://a2a-protocol.org/latest/ . Grade: **C**. Accessed 2026-10-08.

[19] AGENTS.md maintainers / AAIF. “AGENTS.md.” Current format documentation, 2026 snapshot. https://agents.md/ . Grade: **C**. Accessed 2026-10-08.

[20] Agent Skills maintainers. “Agent Skills Overview.” Current format documentation and client showcase, 2026 snapshot. https://agentskills.io/home . Grade: **C**. Accessed 2026-10-08.

[21] Anthropic. “Orchestrate teams of Claude Code sessions”; “Hooks reference.” Current documentation, 2026 snapshot. https://code.claude.com/docs/en/agent-teams ; https://code.claude.com/docs/en/hooks . Grade: **C**. Accessed 2026-10-08.

[22] Pi maintainers / Mario Zechner. “Pi” README, https://github.com/earendil-works/pi ; “Changelog,” https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/CHANGELOG.md (including **1.1.0, 2026-10-07** and **1.0.4, 2026-10-05**); Zechner, “What I learned building an opinionated and minimal coding agent,” **2025-11-30**, https://mariozechner.at/posts/2025-11-30-pi-coding-agent/ . Grade: **C** for own-project facts; criticisms of other products in the historical essay are not used as current evidence. Accessed 2026-10-08.

[23] Stencil Labs / can1357. “oh-my-pi” repository and README. https://github.com/can1357/oh-my-pi . Current 2026 snapshot; links canonical https://omp.sh . Grade: **C**. Accessed 2026-10-08.

[24] Nous Research. “Hermes Agent” README, https://raw.githubusercontent.com/NousResearch/hermes-agent/main/README.md ; “Releases,” https://nousresearch.com/releases (**2026-02-25** Hermes Agent entry). Grade: **C**. Accessed 2026-10-08.

[25] OpenClaw maintainers. “OpenClaw” repository/README, https://github.com/OpenClaw/OpenClaw ; “Agent runtime architecture,” https://docs.openclaw.ai/pi . Current 2026 snapshot. Grade: **C**. Accessed 2026-10-08.

[26] DeepSeek AI. “DeepSeek Harness” README, https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/README.md ; “Configure models,” https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md ; “DeepSeek Harness Architecture,” https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/architecture.md . Current developer-preview snapshot, 2026. Grade: **C**. Accessed 2026-10-08.

[27] Aider-AI maintainers. “aider” repository/README, https://github.com/Aider-AI/aider ; “Improving GPT-4’s codebase understanding with ctags,” **2023-05-25**, https://aider.chat/2023/05/25/ctags.html (explicit update says current repo maps no longer use ctags). Grade: **C**. Accessed 2026-10-08.

[28] Anomaly / OpenCode maintainers. “OpenCode” homepage, https://opencode.ai/ ; repository, https://github.com/anomalyco/opencode . Current 2026 snapshot. Grade: **C**. Accessed 2026-10-08.

[29] Goose maintainers / Adewale Abati. Current repository, https://github.com/block/goose (redirects to https://github.com/aaif-goose/goose); “Introducing codename goose,” **2025-01-28**, https://goose-docs.ai/blog/2025/01/28/introducing-codename-goose/ . Grade: **C**. Accessed 2026-10-08.

[30] Amp Frontier Corporation / Thorsten Ball. “Amp License Terms,” https://ampcode.com/terms ; “Introduction,” https://ampcode.com/docs/markdown (lastModified **2026-09-02**); “Model Routing,” https://ampcode.com/docs/markdown/customize/model-routing (lastModified **2026-10-02**); “Amp is now available. Here’s how I use it,” **2025-05-15**, https://ampcode.com/notes/how-i-use-amp . Grade: **C**. Accessed 2026-10-08.

[31] Charmbracelet, Inc. “Crush” README, https://raw.githubusercontent.com/charmbracelet/crush/main/README.md ; “Functional Source License, Version 1.1, MIT Future License,” https://github.com/charmbracelet/crush/blob/main/LICENSE.md ; Christian Rocha, “Crush, Welcome Home,” **2025-07-30**, https://charm.land/blog/crush-comes-home/ . Grade: **C**. Accessed 2026-10-08.

[32] Factory / The San Francisco AI Factory Inc. “Build Your Software Factory,” https://factory.com/ ; “Factory Raises $50M Series B,” **2025-09-25**, https://factory.com/news/series-b ; “End User License Agreement,” updated **2026-04-29**, https://factory.com/legal/eula . Grade: **C**. EULA is specifically the reseller agreement; used for product/code ownership, not to infer all direct-customer terms. Accessed 2026-10-08.

[33] Warp / Zach Lloyd / Michelle Lim. Current repository README, https://github.com/warpdotdev/Warp ; “Warp is now open-source,” **2026-04-28**, https://www.warp.dev/blog/warp-is-now-open-source ; “Agent Mode: LLM embedded in the terminal for multi-step workflows,” **2024-06-17**, https://www.warp.dev/blog/agent-mode . Grade: **C**. Accessed 2026-10-08.

[34] SWE-agent / SWE-bench maintainers. SWE-agent README, https://github.com/SWE-agent/SWE-agent ; LICENSE, https://raw.githubusercontent.com/SWE-agent/SWE-agent/main/LICENSE ; SWE-bench README news with **2024-04-02** release, https://raw.githubusercontent.com/SWE-bench/SWE-bench/main/README.md . Grade: **C**. Accessed 2026-10-08.

[35] SWE-agent team / Kilian A. Lieret and Carlos E. Jimenez. “The minimal AI software engineering agent,” https://github.com/SWE-agent/mini-swe-agent/blob/main/README.md ; package/license metadata, https://pypi.org/project/mini-swe-agent/ . Current v2 documentation, 2026 snapshot. Grade: **C**. Accessed 2026-10-08.

[36] Chunqiu Steven Xia, Yinlin Deng, Soren Dunn, Lingming Zhang / OpenAutoCoder. “Agentless” repository README, including **2024-07-01** release news. https://github.com/OpenAutoCoder/Agentless . Grade: **C** for repository/design/release facts; no benchmark finding is asserted here. Accessed 2026-10-08.

[37] Mike Merrill, Alex Shaw / Terminal-Bench maintainers. “Terminus,” https://www.tbench.ai/news/terminus ; dated news index, https://www.tbench.ai/news (**2025-05-19**); original framework repository/license, https://github.com/laude-institute/terminal-bench (redirects https://github.com/harbor-framework/terminal-bench-1). Grade: **C** for the team’s own agent/framework. Accessed 2026-10-08.

[38] OpenHands maintainers / Graham Neubig. Current “Agent Canvas” README and MIT repository metadata, https://github.com/All-Hands-AI/OpenHands (redirects https://github.com/OpenHands/OpenHands); “One Year of OpenHands: A Journey of Open Source AI Development,” **2025-03-17**, https://www.openhands.dev/blog/one-year-of-openhands-a-journey-of-open-source-ai-development . Grade: **C**. Accessed 2026-10-08.

[39] Anthropic PBC. Claude Code LICENSE, https://raw.githubusercontent.com/anthropics/claude-code/main/LICENSE.md ; “Model configuration,” https://code.claude.com/docs/en/model-config ; “Claude 3.7 Sonnet and Claude Code,” **2025-02-24**, https://www.anthropic.com/news/claude-3-7-sonnet . Grade: **C**. Accessed 2026-10-08.

[40] OpenAI. Codex repository/README, https://github.com/openai/codex ; “Advanced Configuration,” https://developers.openai.com/codex/config-advanced (redirects https://learn.chatgpt.com/docs/config-file/config-advanced, especially Custom model providers / Bedrock / OSS mode); “Introducing OpenAI o3 and o4-mini,” **2025-04-16**, §“Codex CLI,” https://openai.com/index/introducing-o3-and-o4-mini/ . Grade: **C**. Accessed 2026-10-08.

[41] Google / Taylor Mullen / Ryan J. Salva. Gemini CLI repository, https://github.com/google-gemini/gemini-cli ; “Gemini CLI: your open-source AI agent,” **2025-06-25**, https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-cli-open-source-ai-agent/ . Grade: **C**. Accessed 2026-10-08.

[42] Qwen Team. Qwen Code repository/README, https://github.com/QwenLM/qwen-code ; “Qwen3-Coder: Agentic Coding in the World,” **2025-07-22**, https://qwenlm.github.io/blog/qwen3-coder/ . Grade: **C**. Its comparisons with competitors are not treated as independent evaluations. Accessed 2026-10-08.

[43] Moonshot AI. Legacy Kimi CLI repository/README, https://github.com/MoonshotAI/kimi-cli ; successor Kimi Code CLI repository/README, https://github.com/MoonshotAI/kimi-code ; legacy changelog final release **1.52.0, 2026-09-22**, https://raw.githubusercontent.com/MoonshotAI/kimi-cli/main/CHANGELOG.md . Grade: **C**. Accessed 2026-10-08.

[44] Anysphere / Cursor. “Terms of Service,” updated **2026-09-03**, https://cursor.com/terms-of-service ; “Models & Pricing,” https://cursor.com/docs/models (redirects https://cursor.com/docs/models-and-pricing); “Introducing Cursor 0.2.0! (2023-04-06),” https://cursor.com/changelog/0-2-0 . Grade: **C**. Accessed 2026-10-08.

[45] GitHub / Microsoft / Thomas Dohmke. “GitHub Copilot: The agent awakens,” **2025-02-06**, https://github.blog/news-insights/product-news/github-copilot-the-agent-awakens/ ; MIT extension repository, https://github.com/microsoft/vscode-copilot-chat ; “Supported AI models in GitHub Copilot,” https://docs.github.com/en/copilot/reference/ai-models/supported-models ; “GitHub Terms for Additional Products and Features,” effective **2026-08-27**, https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features#github-copilot . Grade: **C**. Accessed 2026-10-08.

[46] Codeium/Windsurf team, subsequently Cognition. “Windsurf Launch,” **2024-11-13**, https://windsurf.com/blog/windsurf-launch (redirects https://devin.ai/blog/windsurf-launch); Cognition, “Windsurf is now Devin Desktop,” **2026-06-02**, https://devin.ai/blog/windsurf-is-now-devin-desktop ; “AI Models,” https://docs.devin.ai/desktop/models ; “Platform Terms of Service,” updated **2026-06-30**, https://cognition.com/legal/platform-terms-of-service . Grade: **C**. Accessed 2026-10-08.

[47] Cline maintainers / Saoud Rizwan. Current repository/README, https://github.com/cline/cline ; “5M installs, $1M Open Source Grant program, and the story of how we got here,” displayed **2026-01-29**, https://cline.ghost.io/5m-installs-1m-open-source-grant-program/ . Official-site ownership and Ghost affiliation verified through raw HTML/organization metadata/RSS link at https://cline.bot/blog/5m-installs-1m-open-source-grant-program . Grade: **C**. Accessed 2026-10-08.

[48] Roo Code, Inc. Repository/README, https://github.com/RooCodeInc/Roo-Code ; official documentation, https://roocodeinc.github.io/Roo-Code/ . Current archived/shutdown notices, 2026 snapshot; notices state May 15. Grade: **C**. Accessed 2026-10-08.

[49] Kilo team / JP Posma. Current repository/README, https://github.com/Kilo-Org/kilocode ; “Kilo Code: speedrunning open source coding AI,” **2025-03-26**, https://blog.kilo.ai/p/kilo-code-speedrunning-open-source-coding-ai . Grade: **C**. Accessed 2026-10-08.

[50] Zed Industries / Richard Feldman. Current repository/README, https://github.com/zed-industries/zed ; “AI” documentation, https://zed.dev/docs/ai/overview ; “Zed: The Fastest AI Code Editor,” **2025-05-07**, https://zed.dev/blog/fastest-ai-code-editor . Grade: **C**; “fastest” is the source title, not an endorsed comparative finding. Accessed 2026-10-08.

[51] JetBrains / Andrew Zakonov. “Junie by JetBrains,” https://junie.jetbrains.com/ ; LICENSE, https://raw.githubusercontent.com/JetBrains/junie/main/LICENSE.md ; “Meet Junie, Your Coding Agent by JetBrains,” January 2025, https://blog.jetbrains.com/junie/2025/01/meet-junie-your-coding-agent-by-jetbrains/ . Grade: **C**. Exact publication day not inferred from modification metadata. Accessed 2026-10-08.

[52] Logan Kilpatrick / Google. “Start building with Gemini 3,” §Google Antigravity, **2025-11-18**. https://blog.google/innovation-and-ai/technology/developers-tools/gemini-3-developers/ . Grade: **C**. Accessed 2026-10-08.

[53] Mistral AI. “Mistral Vibe” repository/README. https://github.com/mistralai/mistral-vibe . Current 2026 snapshot. Grade: **C**. Accessed 2026-10-08.

[54] Ryan Lopopolo. “Harness engineering: leveraging Codex in an agent-first world.” OpenAI, **2026-02-11**. https://openai.com/index/harness-engineering/ (successfully opened with https://openai.com/index/harness-engineering/?_format=markdown after bare URL returned 403). Grade: **C**, first-party engineering account; its productivity estimates are not used as controlled experimental results. Accessed 2026-10-08.

[55] opencode-ai maintainers. “Archived: Project has Moved.” https://github.com/opencode-ai/opencode/blob/main/README.md . Current archived README, 2026 snapshot. Grade: **C**. Accessed 2026-10-08.
