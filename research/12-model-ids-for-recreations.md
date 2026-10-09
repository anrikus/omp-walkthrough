# 12 — Real model IDs for omp TUI recreations
> Slice: ModelIdsResearch · Researched 2026-10-08 · Scope: omp 18.8.6 bundled catalog, role resolution, source-derived display strings, and dated official-vendor model identities; illustrative configurations, not endorsements or model-quality comparisons.

## Narration-ready takeaways

- “A model has three names here: the vendor's API ID, omp's provider-qualified selector, and the human-readable label. They are not interchangeable.” For example, `claude-opus-5-5`, `anthropic/claude-opus-5-5`, and the status-line label `Opus 5.5` identify different representations of the same selected catalog row. [1][4][7]
- “omp's bundled model knowledge is a snapshot, not a promise of access.” Version 18.8.6 ships a static catalog; credentials, disabled providers, discovery, caches, and custom entries determine the usable runtime roster. [1][2][6]
- “There is no universal shipped main model.” Startup looks for available provider defaults; Anthropic's default is `claude-opus-5-5`, whereas the OpenAI and Codex provider descriptors still name `gpt-5.5`. A descriptor is not proof that its named model is available. [4][14]
- “Fifteen roles do not mean fifteen hard-coded model assignments.” Seven roles have their own priority arrays; others inherit, alias another list, or have no list. [3][4][5]
- “The shipped strong-role list starts with GPT-5.6 Sol, not the newest GPT-6.1 Sol.” The small-role list starts with `google-antigravity/gemini-3.8-flash`. Updating a presentation to the newest model must not silently rewrite shipped defaults. [3][18]
- “The same model looks different across the interface.” The ordinary ANSI terminal status line uses a friendly name, selectors use provider plus ID, and Agent Hub normally drops the provider. Its task-result model badge is **off by default**; the separate native host rendering path has a different contract. [7][8][9][10][11][13]
- “Benchmark labels are not API identifiers.” Terminal-Bench 4.0 says `GPT-6 Astra` and `Opus 5.5`; the corresponding vendor IDs are `gpt-6-astra` and `claude-opus-5-5`. The board is evidence about those benchmark entries, not a vendor API schema. [16][17][18]
- “A newer model can be present without being the role's first choice.” The 18.8.6 catalog includes `claude-haiku-5-5` and `gpt-6.1-sol`, but its priority arrays retain older Haiku and Sol choices. [1][3][17][18]
- “Date and endpoint details matter.” Z.ai's GLM-5.3 release-note date differs from Terminal-Bench's date; Qwen's regional availability dates differ; Mistral's Medium 3.5 documentation and announcement disagree. Preserve those differences rather than inventing a single definitive timeline. [16][23][24][26]

## Findings

### 1. Evidence boundary, reproducibility, and catalog location

All fast-moving statements below are **as of 2026-10-08**. Product and model identity evidence is grade C first-party evidence, not peer-reviewed evidence of comparative performance. This research did not run omp agent/prompt mode, authenticate, invoke any model, or inspect or change the user's model assignments. Formatted strings are **[INFERENCE: deterministic source-derived examples]**, not transcripts of paid model runs.

The source checkout used for catalog queries was created by the TUI-capture worker with `git clone --depth 1 --branch v18.8.6 https://github.com/can1357/oh-my-pi.git`. Its reported detached commit was `f068751e2f1dbdbc195977776d47a26db8697495`; the worker reported no source modifications. References use permanent tag/commit URLs, not the disposable checkout path. The installed Homebrew formula identifies a compiled release binary, rather than a readable installed JavaScript package; source-level catalog queries therefore used the fixed-tag checkout. [1][28]

| Layer | Location and meaning | Evidence |
|---|---|---|
| Baked model rows | `packages/catalog/src/models.json`; JSON provider keys contain model rows with concrete `provider`, `id`, `name`, kind, limits, and metadata. The fixed-tag JSON has **75 provider keys / 5,671 provider-scoped model rows**, counted by reading the JSON and emitting one `(provider, id)` tuple per row; all 5,671 tuples are distinct. This is **not** 5,671 distinct model families or bare IDs, and is not a count of authorized accounts or exclusively chat models. | [1] |
| Static accessor | `packages/catalog/src/models.ts` imports that JSON, lazily builds provider maps, and exposes `getBundledModel`, `getBundledModels`, and `getBundledProviders`. Its comment explicitly excludes runtime discovery, overlays, and disk caches. | [2], lines 1–64 |
| Provider policy/defaults | `packages/catalog/src/compat/rules.json` contains compiled provider rules; KDL files under `compat/rules/providers/` author their `default-model` values. `provider-models/descriptors.ts` derives `DEFAULT_MODEL_PER_PROVIDER` from these entries. | [14], descriptors lines 200–203 |
| Role priorities | `packages/coding-agent/src/priority.json`, interpreted by `config/model-resolver.ts`; these are ordered selector patterns, including fuzzy forms and aliases, not a list of exact API IDs. | [3][4] |
| Runtime registry | `config/model-registry.ts`; bundled rows are merged with configuration, caches, discovery, and extension models. `getAvailable()` is chat-only unless another kind is requested, and availability requires a credential source or keyless provider and excludes disabled providers. | [6][29] |

The shared catalog refresh can add new IDs without a new binary; provider-authoritative discovery can replace a bundled chat roster. Consequently, **“in the 18.8.6 catalog” in this dossier means the baked JSON, not whatever a network-connected 18.8.6 session discovers today**. A configured credential source is also not evidence that a request will succeed. [2][6]

### 2. All fifteen roles: shipped priorities and inheritance

`ROLE_PRIORITY_ALIAS` maps `advisor → slow`, `tiny → smol`, and `memory → smol`. `ROLE_CONFIGURED_FALLBACK` separately maps `advisor → slow`, `tiny → smol`, and `memory → tiny`. That distinction preserves configured-role inheritance rather than simply substituting a JSON array. Unset `smol` and `slow` try an explicitly configured `default` before their built-in lists; advisor does not simply inherit the main model. [4], lines 1100–1141, 1188–1231

The table names complete chains reproduced immediately below. **“No list” means no built-in role priority array, not “the feature is disabled,” and not a claim about every workload caller's fallback.** [3][4][5]

| Role | Shipped priority / unset behavior | Fixed-tag source lines |
|---|---|---|
| `default` | No role list. Startup uses available provider defaults, then an available-model fallback; explicit CLI/session/settings selection has its own precedence. | [4], 86–123, 1137–1141, 2398–2400; [6], Initial model selection |
| `smol` | **S**; configured `default` is inherited before S when `smol` is unset. | [3], 2–37; [4], 1100–1102 |
| `slow` | **L**; configured `default` is inherited before L when `slow` is unset. | [3], 38–67; [4], 1100–1102 |
| `vision` | No built-in list; accepts chat models. Image-question capability is checked separately. | [4], 1137–1141; [5]; [6], roles |
| `plan` | No built-in list. Official docs demonstrate `plan: "@slow"`; assigning it does not itself enter plan mode. | [4], 1137–1141; [6], roles |
| `commit` | No built-in list. Do not label a chosen commit model a shipped universal default. | [4], 1137–1141; [5] |
| `tiny` | Unset → `@smol`; built-in priority alias is S. Accepts chat or tiny models. | [4], 1114–1130; [5][6] |
| `memory` | Unset → `@tiny` → `@smol`; built-in priority alias is S. | [4], 1114–1130; [6] |
| `task` | No built-in list. The bundled general worker declares `@task`; agent/frontmatter and parent fallback are separate from this table. | [4], 1137–1141; [27] |
| `advisor` | Configured advisor, otherwise configured `slow`, otherwise L. | [4], 1114–1141, 1188–1231; [6] |
| `image` | **I**, image generation rather than image analysis. | [3], 68–77; [5][6] |
| `web` | **W**, search/grounded-workload candidates, not the coding chat model. | [3], 78–90; [5] |
| `speech` | **T**, text-to-speech. | [3], 91–95; [5] |
| `dictation` | **D**, speech-to-text. | [3], 96–98; [5] |
| `judge` | **J**; can select judgment, tiny, or chat models. | [3], 99–105; [5][6] |

**S — complete smol chain, in order:** [3], lines 2–37

```text
google-antigravity/gemini-3.8-flash
gemini-3.8-flash
gemini-3-8-flash
gemini-3.7-flash
gemini-3-7-flash
gemini-3.6-flash
gemini-3-6-flash
gemini-3.5-flash
gemini-3-5-flash
openai-codex/gpt-5.3-codex-spark
gpt-5.3-codex-spark
5.3-spark
spark
zai/glm-5.3-flash
glm-5.3-flash
gemini-3.1-flash-lite
gemini-3-1-flash-lite
flash-lite
cerebras/gpt-oss-120b
gpt-oss-120b
oss-120b
cerebras/zai-glm-4.7
cerebras/zai-glm-4.6
cerebras/zai-glm
claude-haiku-4-5
claude-haiku-4.5
haiku-4-5
haiku-4.5
haiku
openai-codex/gpt-5.6-luna
gpt-5.6-luna
openai-codex/gpt-5.4-mini
gpt-5.4-mini
-mini
```

**L — complete slow chain, in order:** [3], lines 38–67

```text
openai-codex/gpt-5.6-sol
gpt-5.6-sol
anthropic/claude-fable-5-1
claude-fable-5-1
claude-fable-5.1
fable-5.1
fable-5-1
anthropic/claude-fable-5
claude-fable-5
fable-5
kimi-code/k3
kimi-k3
moonshotai/kimi-k3
k3
zai/glm-5.3
glm-5.3
anthropic/claude-opus-5-5
claude-opus-5-5
opus-5-5
anthropic/claude-opus-5
claude-opus-5
opus-5
openai-codex/gpt-5.5
gpt-5.5
claude-opus-4-8
claude-opus-4.8
opus-4-8
opus-4.8
```

| Chain | Complete ordered contents | Source |
|---|---|---|
| I | `openai/gpt-image-2` → `openai-codex/gpt-image-2` → `google-antigravity/gemini-3-pro-image` → `xai/grok-imagine-image` → `xai-oauth/grok-imagine-image` → `openrouter/google/gemini-3-pro-image` → `google/gemini-3-pro-image` → `deepinfra/black-forest-labs/FLUX-2-pro` | [3], 68–77 |
| W | `web/parallel` → `web/hosted` → `web/exa` → `web/firecrawl` → `web/searxng` → `web/startpage` → `web/duckduckgo` → `web/ecosia` → `web/google` → `web/mojeek` → `web/public` | [3], 78–90 |
| T | `local/kokoro` → `xai/grok-tts` → `xai-oauth/grok-tts` | [3], 91–95 |
| D | `local/parakeet-tdt-0.6b-v3` | [3], 96–98 |
| J | `typesafe/jev-latest` → `openrouter/~typesafe/jev-latest` → `@tiny` → `@smol` → `@default` | [3], 99–105 |

These lists choose an available match; they are **not** per-request failure-retry chains. Exact `provider/id` selectors disambiguate provider identity. Bare IDs, substring forms, recently used variants, and provider preference can affect a match. Several priority strings are intentionally not exact static catalog rows: for example, the baked `openai-codex` catalog lacks `gpt-5.3-codex-spark`, `gpt-5.4-mini`, and `gpt-5.5`. This is a bounded static observation, not proof those selectors cannot resolve after discovery or alias handling. [1][3][4][6]

#### Provider defaults relevant to the presentation

These are KDL `default-model` values, **not a global ranking and not necessarily the resulting active model**. `pickDefaultAvailableModel` filters auto-selectable providers, prefers concrete credentials when any exist, seeks a matching available default, and otherwise returns the first available model. [4], lines 86–123; [14]

| Provider | Shipped provider default ID | Source |
|---|---|---|
| `anthropic` | `claude-opus-5-5` | [14], `anthropic.kdl:4` |
| `openai` | `gpt-5.5` | [14], `openai.kdl:4` |
| `openai-codex` | `gpt-5.5` | [14], `openai-codex.kdl:4`; that provider enables authoritative dynamic models |
| `google` | `gemini-3.1-pro-preview` | [14], `google.kdl:4` |
| `google-antigravity` | `gemini-3.1-pro` | [14], `google-antigravity.kdl:4`; authoritative dynamic models |
| `zai` | `glm-5.3` | [14], `zai.kdl:4` |
| `moonshot` | `kimi-k2.7-code` | [14], `moonshot.kdl:4` |
| `deepseek` | `deepseek-v4-pro` | [14], `deepseek.kdl:4` |

The global `defaultThinkingLevel` setting is `high`; a role selector, agent frontmatter, or live session choice can override it. Do not portray every worker as high merely because the parent is high: the bundled scout and sonic definitions select medium thinking, while task uses auto. [15][27]

### 3. Current vendor models and exact baked-catalog membership

**Reading the table:** “Yes” identifies at least one concrete matching catalog identity, not authorized access, provider endorsement, availability in every region, or a live endpoint test. API ID case and punctuation are retained. “No exact ID” is distinguished from the same model being represented under a gateway-specific ID. All catalog results are from [1]; vendor IDs/dates are from the official URLs linked in the final column. This is a selection relevant to coding and routing, **not a measured popularity ranking or an exhaustive vendor inventory**.

| Vendor / model | Exact API model ID | Release/date evidence | In omp 18.8.6 baked catalog? | Official URL / source |
|---|---|---|---|---|
| Anthropic Opus 5.5 | `claude-opus-5-5` | 2026-09-22 | Yes: `anthropic/claude-opus-5-5` | [Opus overview](https://platform.claude.com/docs/en/models/opus-5-5/overview) [17] |
| Anthropic Sonnet 5.5 | `claude-sonnet-5-5` | 2026-09-28 | Yes: `anthropic/claude-sonnet-5-5` | [Sonnet overview](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) [17] |
| Anthropic Fable 5.1 | `claude-fable-5-1` | 2026-09-01 | Yes: `anthropic/claude-fable-5-1` | [Fable overview](https://platform.claude.com/docs/en/models/fable-5-1/overview) [17] |
| Anthropic Haiku 5.5 | `claude-haiku-5-5` | 2026-10-07 | Yes: `anthropic/claude-haiku-5-5`; **not** the explicit Haiku generation in S | [Haiku overview](https://platform.claude.com/docs/en/models/haiku-5-5/overview) [17] |
| OpenAI GPT-6 Astra | `gpt-6-astra` | 2026-09-03 | Yes: `openai/gpt-6-astra`, `openai-codex/gpt-6-astra`, among others | [Model](https://developers.openai.com/api/docs/models/gpt-6-astra), [changelog](https://developers.openai.com/api/docs/changelog) [18] |
| OpenAI GPT-6.1 Sol | `gpt-6.1-sol` | 2026-09-29 | Yes: `openai/gpt-6.1-sol`, `openai-codex/gpt-6.1-sol`, among others; **not** L's head | [Model](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [changelog](https://developers.openai.com/api/docs/changelog) [18] |
| OpenAI GPT-6 Sol / Luna | `gpt-6-sol` / `gpt-6-luna` | Both 2026-09-22 | Yes: both IDs under `openai` and `openai-codex` | [Changelog](https://developers.openai.com/api/docs/changelog) [18] |
| Google Gemini 3.8 Flash | `gemini-3.8-flash` | 2026-09-02 GA | Yes: `google/gemini-3.8-flash`, `google-antigravity/gemini-3.8-flash`, among others | [Changelog](https://ai.google.dev/gemini-api/docs/changelog) [19] |
| Google Gemini 3.5 Flash-Lite | `gemini-3.5-flash-lite` | 2026-07-21 GA; vendor explicitly calls it a subagent option | Yes: `google/gemini-3.5-flash-lite`, among others | [Changelog](https://ai.google.dev/gemini-api/docs/changelog) [19] |
| Google Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` | 2026-02-19; still preview in current catalog | Yes: `google/gemini-3.1-pro-preview`, among others | [Model](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview), [changelog](https://ai.google.dev/gemini-api/docs/changelog) [19] |
| DeepSeek V4.1 Flash | `deepseek-flash` | 2026-09-10 official release; report publication is a different date | Yes: `deepseek/deepseek-flash`, name `DeepSeek V4.1 Flash` | [Updates](https://api-docs.deepseek.com/updates/), [pricing/model details](https://api-docs.deepseek.com/quick_start/pricing/) **read through disclosed relay** [20] |
| DeepSeek V4 Pro 0813 | `deepseek-v4-pro` | 2026-08-13 GA update; original V4 API launch 2026-04-24 | Yes: `deepseek/deepseek-v4-pro`, among others | [Updates](https://api-docs.deepseek.com/updates/), [model details](https://api-docs.deepseek.com/quick_start/pricing/) **relay** [20] |
| xAI Grok 4.7 | `grok-4.7` | 2026-09-21 | Yes: `xai/grok-4.7`, `xai-oauth/grok-4.7`, among others | [Launch](https://x.ai/news/grok-4-7), [API guide](https://docs.x.ai/developers/grok-4-7) [21] |
| xAI Grok Build 0.1 | `grok-build-0.1` | May 2026 release-note section; exact day not established; early access | Yes: `xai/grok-build-0.1`, among others | [Model](https://docs.x.ai/developers/models/grok-build-0.1), [release notes](https://docs.x.ai/developers/release-notes) [21] |
| Moonshot Kimi K3 | `kimi-k3` | July 2026; exact day not established | Yes: `moonshot/kimi-k3`, among others. `kimi-code/k3` is a different concrete catalog selector. | [Models](https://platform.kimi.ai/docs/models), [changelog](https://platform.kimi.ai/docs/platform-changelog.md) [22] |
| Moonshot Kimi K2.7 Code / HighSpeed | `kimi-k2.7-code` / `kimi-k2.7-code-highspeed` | June 2026; exact days not established | Yes: both under `moonshot` | [Models](https://platform.kimi.ai/docs/models), [changelog](https://platform.kimi.ai/docs/platform-changelog.md) [22] |
| Z.ai GLM-5.3 | `glm-5.3` | **2026-08-18** release-note label; TB4 says Aug 14 | Yes: `zai/glm-5.3`, among others | [API guide](https://docs.z.ai/guides/llm/glm-5.3), [release notes](https://docs.z.ai/release-notes/new-released) [23] |
| Z.ai GLM-5.3-Flash / FlashX | `glm-5.3-flash` / `glm-5.3-flashx` | Flash: 2026-08-26; separate FlashX day not established | Yes: both under `zai` | [Model guide](https://docs.z.ai/guides/vlm/glm-5.3-flash), [release notes](https://docs.z.ai/release-notes/new-released) [23] |
| Alibaba Qwen3.8-Max | `qwen3.8-max` | Announcement 2026-08-03; International Model Studio availability row 2026-08-02 | Yes: `alibaba-token-plan/qwen3.8-max`, plus gateways; this is not proof of a direct general Model Studio row | [Announcement](https://www.alibabacloud.com/en/press-room/alibaba-unveils-qwen3-8-max), [availability](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) [24] |
| Alibaba Qwen3.8-Max-0902 | `qwen3.8-max-0902`; alias `qwen3.8-max-2026-09-02` | 2026-09-02 International availability | **No exact bare ID** for either. Represented by `openrouter/qwen/qwen3.8-max-0902` and other gateway-specific IDs. | [Availability](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) [24] |
| Alibaba Qwen3.8-Flash | `qwen3.8-flash` | 2026-08-26 Model Studio row | Yes: `alibaba-token-plan/qwen3.8-flash`, among others | [Availability](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) [24] |
| Alibaba Qwen3-Coder-Next | `qwen3-coder-next` | 2026-02-20 Model Studio row | Yes: `alibaba-coding-plan/qwen3-coder-next`, `ollama-cloud/qwen3-coder-next` | [Availability](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) [24] |
| MiniMax M3 | `MiniMax-M3` | 2026-06-01 | Yes: `minimax/MiniMax-M3`, among others; preserve uppercase | [Model/API example](https://www.minimax.io/models/text/m3), [release notes](https://platform.minimax.io/docs/release-notes/models) [25] |
| MiniMax M2.7 | `MiniMax-M2.7` | 2026-03-18 | Yes: `minimax/MiniMax-M2.7`, among others | [Release notes](https://platform.minimax.io/docs/release-notes/models) [25] |
| Mistral Large 4 | `mistral-large-4` | 2026-10-06 **Public Preview** | Yes: `mistral/mistral-large-4`, among others | [Model](https://docs.mistral.ai/models/mistral-large-4-0), [changelog](https://docs.mistral.ai/resources/changelogs) [26] |
| Mistral Medium 3.5 | `mistral-medium-3-5`; announcement also names `mistral-medium-latest` | Docs/changelog 2026-04-28; announcement 2026-05-22, with differing status | **No exact `mistral-medium-3-5` ID**. Catalog has `mistral/mistral-medium-2604` named `Mistral Medium 3.5`, and `openrouter/mistralai/mistral-medium-3-5`. Alias membership not asserted. | [Model](https://docs.mistral.ai/models/mistral-medium-3-5-26-04), [announcement](https://mistral.ai/news/vibe-remote-agents-mistral-medium-3-5/), [changelog](https://docs.mistral.ai/resources/changelogs) [26] |
| Mistral Codestral 25.08 | `codestral-2508` | 2025-07-30; completion/FIM model line, not a claim of latest agent model | Yes: `mistral/codestral-2508` | [Model](https://docs.mistral.ai/models/codestral-25-08), [changelog](https://docs.mistral.ai/resources/changelogs) [26] |

**Identity caveats:** Anthropic's current documentation says dateless IDs from generation 4.6 onward are themselves pinned snapshots; do not automatically call `claude-opus-5-5` a moving alias. DeepSeek's current model-details page maps `deepseek-flash` to V4.1 Flash and says legacy Flash names remain accepted while their old models are retired. The DeepSeek report's title is not the hosted API ID. [17][20]

### 4. Exact display contracts

These are model-bearing substrings, not fabricated full sessions. Examples specifically target the **ordinary ANSI terminal rendering path**, with the **Unicode glyph preset**, sufficient width, ordinary noncompact model segment, no advisor/fast/slow-mode decoration, and the stated thinking level. ANSI colors are omitted. Rendering an entire row additionally requires real width, selected state, metrics, and live task state. All subsequent profile string palettes and task-badge defaults have this ANSI scope. [7][8][9][10][12][13]

**Native-host exception:** the separate status-line `describe()` path returns the name plus a plain effort word, e.g. `Opus 5.5 · high`, with the host responsible for drawing the model icon. Native task descriptions pass the model regardless of the ANSI feed-badge setting, and effort is conveyed as a color token rather than the Unicode glyph. Do not reuse the ANSI “no task model badge by default” assertion for a native-host recreation. This dossier does not claim to capture the host's final native pixels. [7], segments 380–393; [13], task lines 1890–1891

| Surface | Rule and exact example [INFERENCE: source-derived] | Evidence |
|---|---|---|
| Status line | Uses `model.name`, else `model.id`, else `no-model`; strips a leading `Claude `. At high: `⬢ Opus 5.5 · ◒ high`; GPT example: `⬢ GPT-6.1 Sol · ◒ high`. No provider prefix. | [7], segments 275–280, 296–313, 340–394 |
| Status-line medium / auto | Medium is abbreviated: `⬢ Gemini 3.8 Flash · ◑ med`. Pending automatic effort uses `⟳ auto`; do not freeze a resolved worker at pending auto. | [7], segments 296–313; symbols 564–570 |
| Model browser, all-provider context | Selected current model's left model fragment: `❯ anthropic/claude-opus-5-5 ●`; `anthropic/` is dim, selected ID accented. Metric columns are separate. | [8], 1479–1522 |
| Model browser, single-provider context | Provider prefix is omitted: model token `claude-opus-5-5`. Details line uses the full friendly name `Claude Opus 5.5`. | [8] |
| Model Hub role assignment | Uppercase tag such as `DEFAULT`, concrete selector `anthropic/claude-opus-5-5`; auto selection uses `auto → anthropic/claude-opus-5-5`, and unassigned uses `—`. Thinking label in role rows can be `◑ medium`, unlike the status line's `◑ med`. Exact inter-column spaces depend on width/padding. | [9], 2595–2639; [5] |
| Agent Hub main model | Bare ID plus thinking: `claude-opus-5-5 ◒ high`. | [10], renderer 167–217 |
| Agent Hub task-role worker | Role/model badge: `TASK · claude-opus-5-5 ◒ high`, if the worker has role task and high resolved effort. Scout: `SMOL · gemini-3.8-flash ◑ med` when those are its resolved values. | [10]; [27] |
| Agent Hub request fallback | Keeps provider in the fallback form: `fallback → openai/gpt-6-sol`, with a thinking symbol if set. Do not use this label for ordinary role assignment. | [10], renderer 167–217 |
| Task/subagent result headers, shipped defaults | **No model substring.** `task.showResolvedModelBadge` defaults to false. Show a model in Agent Hub or the selector instead of silently enabling this setting. | [11], 494–505 |
| Task/subagent headers, explicitly enabled badge | Uses resolved `provider/id` and a separate effort glyph; e.g. `◒ anthropic/claude-opus-5-5`. Does not append the literal `:high` suffix. | [12][13] |
| Long enabled badge | Maximum 30 cells, including the effort glyph/space; e.g. `◒ google-antigr…ude-sonnet-5-5` for the long `google-antigravity/claude-sonnet-5-5` identity. This is an opt-in example, not the shipped-default scene. | [12], 128–182, 214–222 |

Status-line overflow can drop the model segment whole rather than truncate its model name. Model-browser rows end-truncate with `…`; Agent Hub right-hand badges disappear if they do not fit; enabled task badges middle-truncate. A single generic truncation component would therefore be an inaccurate recreation. A routing selector can also append `@upstream`; no such routing is assumed in the examples. [7][8][10][12][13]

### 5. Recreation configurations

**All configurations below are illustrative, not an endorsement.** They are deterministic presentation fixtures, not claimed optimal ensembles. The underlying visual settings remain shipped defaults; profile B's provider mix and both profiles' explicit role mappings are user configuration, not shipped universal behavior. A defaults-only chapter should first show the unconfigured role view or an explicitly credential-conditioned automatic selection, and introduce these profiles only in the settings chapter. [3][4][6][11]

**Defaults-only anchor [INFERENCE]:** with a usable Anthropic account, its catalog unchanged, and no competing credentialed/auto-selectable chat provider or explicit model assignment, the provider-default rule can select `anthropic/claude-opus-5-5`; high is the global thinking default. Show `⬢ Opus 5.5 · ◒ high`, not a hard-coded claim that every new omp install starts on that model. Do not infer the same result for an unauthenticated machine. [1][4][14][15]

#### A. Single chat vendor: Anthropic, with explicit role assignments

**Purpose:** isolate role indirection from provider switching. The main identity comes from Anthropic's shipped provider default; the smol/slow identities are explicit candidates in S/L. For roles with no shipped list, retaining the main identity is a conservative **illustrative author choice**, not a claim that omp recommends Opus for that role. The documentation permits role aliases/concrete selectors and demonstrates assigning distinct plan/vision/advisor roles. [3][6][14][27]

| Role shown | Concrete assignment | Justification, not a quality judgment |
|---|---|---|
| `default` | `anthropic/claude-opus-5-5` | Shipped Anthropic provider default. [14] |
| `smol` | `anthropic/claude-haiku-4-5` | Exact baked identity for an S candidate; deliberately **not** silently upgraded to Haiku 5.5. [1][3] |
| `slow` | `anthropic/claude-fable-5-1` | First Anthropic-qualified candidate in L. [3] |
| `plan` | `anthropic/claude-fable-5-1` | Concrete expansion of the official `plan: "@slow"` example for this profile. [6] |
| `task` | `anthropic/claude-opus-5-5` | Deliberately retains the main identity; explicit assignment makes the fixture independent of unset-role/caller fallback. Role selectors are documented; this is not a shipped task priority. [6][27] |
| `advisor` | `anthropic/claude-fable-5-1` | Preserves the documented configured-slow inheritance. [4][6] |
| `commit`, `vision` | `anthropic/claude-opus-5-5` | Retain the main identity rather than inventing a separate recommendation. Vision requires the row's image input, which the baked Opus row supports. [1][6] |
| `tiny`, `memory` | `anthropic/claude-haiku-4-5` | Concrete expansion of tiny → smol and memory → tiny. [4][6] |
| `judge` | `anthropic/claude-haiku-4-5` | Explicit chat-judge choice reached by J's documented `@tiny` branch; not the first J candidate and not a claim about judge accuracy. [3][5][6] |

“Single vendor” applies to the **chat/judgment roles**, not all services. Leave `image`, `web`, `speech`, and `dictation` out of this profile scene unless their actual provider selection is separately explained; their shipped arrays remain I/W/T/D. [3][5]

#### B. Mixed providers: preserve the shipped smol/slow list heads

**Purpose:** show provider-independent roles without inventing a newest-model ranking. Explicitly bind roles because setting only `default` can cause unset smol/slow to inherit it rather than consult S/L. Assume the named providers have usable access; no access was tested. [3][4][6]

| Role shown | Concrete assignment | Justification, not a quality judgment |
|---|---|---|
| `default` | `anthropic/claude-opus-5-5` | Same shipped provider-default anchor as A. [14] |
| `smol` | `google-antigravity/gemini-3.8-flash` | Literal first S entry. [3] |
| `slow` | `openai-codex/gpt-5.6-sol` | Literal first L entry; baked name `GPT-5.6 Sol`. [1][3] |
| `plan` | `openai-codex/gpt-5.6-sol` | Concrete expansion of documented `@slow` plan example. [6] |
| `task` | `anthropic/claude-opus-5-5` | Explicitly retain main identity, as in A; not a shipped task priority. [6][27] |
| `advisor` | `openai-codex/gpt-5.6-sol` | Documented configured-slow inheritance. [4][6] |
| `commit` | `anthropic/claude-opus-5-5` | Explicitly retain main identity, as in A; not a shipped commit priority. [6] |
| `vision` | `google/gemini-3.1-pro-preview` | Literal official role-settings example. Requires this separate provider's access; Antigravity access is not assumed to authorize Google API access. [6][27] |
| `tiny`, `memory` | `google-antigravity/gemini-3.8-flash` | Preserve tiny → smol and memory → tiny. [4][6] |
| `judge` | `typesafe/jev-latest` | Literal first J entry and official settings example; not a chat model label. [3][27] |
| `image` | `openai/gpt-image-2` | Literal first I entry and official settings example. [3][27] |
| `web` | `web/parallel` | Literal first W entry. [3] |
| `speech` | `local/kokoro` | Literal first T entry and official settings example. [3][27] |
| `dictation` | `local/parakeet-tdt-0.6b-v3` | Only D entry and official settings example. [3][27] |

These profiles do **not** imply cross-vendor review is better, that an advisor is enabled merely by assigning its role, or that a local TTS/STT model makes the chat workload local. A genuine local-chat scene needs a separately verified serving model ID and setup; it is not fabricated here. [5][6][27]

#### Exact string palette for the two profiles

All model names/IDs below were read from the baked catalog. These are source-derived model segments at high effort; when showing a built-in scout/sonic use its medium effort, replacing the status suffix with `◑ med` and Agent Hub suffix with `◑ med`. Role tags are uppercase: `DEFAULT`, `SMOL`, `SLOW`, `VISION`, `PLAN`, `COMMIT`, `TINY`, `MEMORY`, `TASK`, `ADVISOR`, `IMAGE`, `WEB`, `SPEECH`, `DICTATION`, `JUDGE`. [1][5][7][10][27]

| Concrete selector: model-selector / assigned-role model value | Exact status-line model segment at high | Exact Agent Hub model fragment at high |
|---|---|---|
| `anthropic/claude-opus-5-5` | `⬢ Opus 5.5 · ◒ high` | `claude-opus-5-5 ◒ high` |
| `anthropic/claude-haiku-4-5` | `⬢ Haiku 4.5 · ◒ high` | `claude-haiku-4-5 ◒ high` |
| `anthropic/claude-fable-5-1` | `⬢ Fable 5.1 · ◒ high` | `claude-fable-5-1 ◒ high` |
| `google-antigravity/gemini-3.8-flash` | `⬢ Gemini 3.8 Flash · ◒ high` | `gemini-3.8-flash ◒ high` |
| `openai-codex/gpt-5.6-sol` | `⬢ GPT-5.6 Sol · ◒ high` | `gpt-5.6-sol ◒ high` |
| `google/gemini-3.1-pro-preview` | `⬢ Gemini 3.1 Pro Preview · ◒ high` | `gemini-3.1-pro-preview ◒ high` |

For a worker-role badge, prepend its actual role, e.g. `SMOL · claude-haiku-4-5 ◑ med`, `SLOW · gpt-5.6-sol ◒ high`, or `TASK · claude-opus-5-5 ◒ high`. Do not assign a role badge merely from an agent's human-readable specialty name. For nonchat service roles show the exact assignment values from profile B in the role selector, not fictional coding-session status lines. At shipped defaults task-result headers contain **none** of these model strings. [5][9][10][11]

### 6. Consistency with the existing narration

Dossier 02's current TB4 section was checked against the rendered official board in this session. Keep its model labels in the benchmark graphic; use the API/selector forms only when crossing into omp. This table does not restate scores or imply omp ran those benchmark entries. [16]

| Narration / TB4 label | Vendor API ID | Suitable concrete baked omp selector | Rule |
|---|---|---|---|
| Opus 5.5 | `claude-opus-5-5` | `anthropic/claude-opus-5-5` | Friendly omp status name is `Opus 5.5`. [1][7][17] |
| Sonnet 5.5 | `claude-sonnet-5-5` | `anthropic/claude-sonnet-5-5` | Do not substitute older Sonnet examples from bundled docs without calling them historical examples. [1][17][27] |
| GPT-6 Astra | `gpt-6-astra` | `openai-codex/gpt-6-astra` | Present in catalog; not the descriptor's shipped provider default. [1][14][18] |
| GPT-6.1 Sol | `gpt-6.1-sol` | `openai-codex/gpt-6.1-sol` | Not the `gpt-5.6-sol` at L's head. [1][3][18] |
| Fable 5.1 | `claude-fable-5-1` | `anthropic/claude-fable-5-1` | An actual L candidate. [1][3][17] |
| GLM-5.3 / GLM-5.3-Flash | `glm-5.3` / `glm-5.3-flash` | `zai/glm-5.3` / `zai/glm-5.3-flash` | Preserve vendor versus benchmark release-date disagreement. [1][16][23] |
| Grok 4.7 | `grok-4.7` | `xai/grok-4.7` | Do not turn the board's harness label `Grok Build` into the `grok-build-0.1` model ID. [1][16][21] |
| Qwen3.8-Max-0902 | `qwen3.8-max-0902` | `openrouter/qwen/qwen3.8-max-0902` | The extra slash belongs to the gateway model ID; it must not be discarded. [1][24] |
| Gemini 3.8 Flash | `gemini-3.8-flash` | `google-antigravity/gemini-3.8-flash` | Also S's first entry. [1][3][19] |

Other existing narration is historical or uses a different benchmark: dossier 02 includes GPT-5.2, GPT-5.3-Codex, GPT-5.5 and older Claude/Gemini entries on TB2/SWE-bench, Kimi-K3 on SWE-Bench Pro V2, and DeepSeek V4/V4.1 in harness studies. Do not globally replace those names with October's latest IDs: that would change the experiment being described. For a *current* DeepSeek API recreation, `deepseek-flash` denotes V4.1 Flash; it must not be captioned as a recreation of a historical V4 Flash run. This is an editorial consistency recommendation, not a new verification of all those historical scores. [20][30]

## Key numbers

| Claim/metric | Value | Conditions | Source [n] (location) | Grade |
|---|---:|---|---|---|
| Built-in roles | 15 | omp 18.8.6, not custom roles | [5], role metadata; model-browser `MODEL_ROLE_IDS` lines 64–80 | C |
| Roles with their own JSON priority arrays | 7 | smol, slow, image, web, speech, dictation, judge; inheritance counted separately | [3], complete file | C |
| Baked provider keys / provider-scoped model rows | 75 / 5,671 | Fixed-tag `models.json`; Python JSON read/count, one distinct `(provider, id)` tuple per row; all kinds; not distinct bare IDs or credentialed models | [1], JSON root/count | C |
| Default global thinking setting | `high` | Role/agent/session choices can override | [15], lines 197–209, default at 201 | C |
| Task model-badge width cap | 30 terminal cells | Only when `task.showResolvedModelBadge` is enabled; default false | [11], 494–505; [12], 128–182 | C |
| Anthropic current releases used in table | Sep 1 / Sep 22 / Sep 28 / Oct 7, 2026 | Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5 respectively | [17], per-model overview “Released” line | C |
| OpenAI Astra / Sol releases | Sep 3 / Sep 29, 2026 | `gpt-6-astra` / `gpt-6.1-sol`; not older Sol in shipped L | [18], dated API changelog entries | C |
| Catalog membership test scope | Exact ID and concrete provider/ID | Not fuzzy matching, auth, runtime discovery, or endpoint execution | [1], jq-selected catalog rows | C |

## Contested or uncertain

- **DeepSeek transport caveat:** direct requests to several official API-doc paths failed. The official updates and pricing pages were opened through `r.jina.ai`, a third-party text relay. Claims remain attributed to the official pages, but their retrieval provenance is weaker than the directly opened vendor pages. A strict direct-vendor-only screen should omit those release-date/API claims until directly retrievable rather than hide the relay. [20]
- **DeepSeek changed its plan:** the September launch announcement said V4 Pro would be phased out/rerouted; the current updates page explicitly says it will continue after September 14, and current model details still list V4 Pro 0813. Do not narrate the superseded plan as the current service state. [20]
- **GLM-5.3:** vendor release notes label August 18; TB4's release column says August 14. Neither should silently overwrite the other. [16][23]
- **Mistral Medium 3.5:** model docs/changelog say April 28; announcement says May 22 and public preview, while model documentation says GA. This dossier does not resolve that conflict by choosing the nicer date. Its baked direct-provider ID also differs from the current docs' API ID. [1][26]
- **Month-only dates:** Kimi K3, Kimi K2.7 Code, and Grok Build 0.1 do not get invented exact release days. [21][22]
- **Qwen availability:** the table names International-region Model Studio dates where relevant. US availability of Qwen3.8-Max is listed later; do not interpret one regional row as worldwide first release. [24]
- **Static does not mean live:** current model metadata can be amended or replaced through discovery; a snapshot row is not a tested account permission or inference endpoint. [6]
- **Profiles versus defaults:** explicit assignments in A/B are intentionally labelled illustrations. The user's request for shipped-default terminal behavior means model badges stay off, and automatic roles must not be falsely presented as saved explicit assignments. [4][9][11]

## Corrections & nuances to the blueprint

1. Replace any universal “omp defaults to model X” statement with an available-provider/default-selection explanation. Show a dated, credential-conditioned example. [4][14]
2. Keep two separate artifacts: a current-vendor identity table and a shipped-role routing table. “Current frontier” and “first in the shipped priority list” are not synonyms. [1][3][17][18]
3. Do not display provider-qualified IDs in the ordinary status line or omit them from the all-provider selector. Do not copy friendly names into Agent Hub badges. [7][8][10]
4. Use Agent Hub to make model assignments visible in the defaults chapter; showing resolved models in task-result headers requires an explicit nondefault setting. [10][11]
5. Never use a benchmark harness label as a model ID, or carry benchmark reasoning label `max` into every recreated session. omp's global default is high, and bundled worker definitions can override it. [15][16][21][27]
6. “Open weights” and “local” are separate properties. No unverified local chat server or model is included in these profiles; the literal local speech/dictation selectors are sourced examples, not evidence that the coding model runs locally. [3][6][27]

## Open questions for the user

- For the defaults chapter, is the preferred stated access assumption **one Anthropic account**, or should the presentation show the unauthenticated model-selection state before introducing any provider?
- Which illustrative settings profile should receive the longer animation: **A, one chat vendor**, or **B, the shipped smol/slow list heads across vendors**? Neither changes the defaults chapter's claims.
- Should an optional settings callout demonstrate enabling task model badges, or should all model visibility stay in Agent Hub/Model Hub to preserve shipped display defaults throughout?
- Should the presentation expose the vendor date conflicts and DeepSeek relay caveat in expandable evidence cards, or omit those timeline points from narration?
- Is a genuinely local-chat setup important enough to commission a separately verified server/model scene, rather than imply local chat from the local voice models?

## Unverified leads

- No model-quality, popularity, cross-vendor-review, latency, or cost-optimality ranking was established by this research. Vendor positioning is not independent comparative evidence.
- MiniMax lists `MiniMax-M3.1-Flash-Preview` but says it is available only through M Plan and MiniMax Code for now. A generally callable public API ID and exact release date were **not established**; it is not a proposed generic API recreation. [25]
- The opened xAI guide says Grok 4.7 Fast is not available on the public xAI API. Do not invent a public `grok-4.7-fast` choice. [21]
- No live account's access to the profiles' IDs was tested. No success/error transcript may be fabricated from catalog membership.
- No exact public release day was established for Kimi K3/K2.7 Code or Grok Build 0.1; no separate FlashX release day was established. [21][22][23]
- Mistral alias membership beyond the explicitly queried IDs, and model equivalence across differently named gateways, remain unasserted. The table lists observed catalog identities rather than guessing equivalence rules. [1][26]

## Visual ideas

- **Three representations, one selection:** morph `anthropic/claude-opus-5-5` in the selector into `⬢ Opus 5.5 · ◒ high` in the status band, then `claude-opus-5-5 ◒ high` in Agent Hub. Label this as source-derived recreation. [1][7][8][10]
- **Priority versus newest:** place `openai-codex/gpt-5.6-sol` at the head of the shipped L chain beside the dated `gpt-6.1-sol` vendor card; caption “catalog presence ≠ role priority.” [1][3][18]
- **Conditional routing animation:** role → ordered candidates → availability filter → concrete provider/ID. Use a separate visual for request-failure recovery so the mechanisms are not conflated. [4][6]
- **Hidden-by-default badge:** task header remains clean; open Agent Hub to reveal models. An optional later settings toggle can explain the opt-in badge, without back-projecting it into the defaults scene. [10][11][12]
- **Catalog timestamp card:** “omp 18.8.6 · 2026-10-08 · bundled snapshot,” with a separate indicator for any scene that deliberately depicts runtime discovery. [1][6]

## References

[1] Stencil Labs / can1357. “Bundled models.json.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/f068751e2f1dbdbc195977776d47a26db8697495/packages/catalog/src/models.json . Grade: C. Accessed 2026-10-08. Read from the fixed-tag checkout with the Eval `read` helper and parsed as JSON; provider/ID/name membership and Opus image input printed directly. Row denominator counted as one `(provider, id)` tuple per nested model row, with matching distinct-tuple count; earlier scout denominator of 739 was erroneous and is not used. Supplementary membership queries used jq.

[2] Stencil Labs / can1357. “Static bundled model registry.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/catalog/src/models.ts#L1-L64 ; raw source opened: https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/catalog/src/models.ts . Grade: C. Accessed 2026-10-08.

[3] Stencil Labs / can1357. “Role model priority arrays.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/priority.json#L1-L106 ; raw source opened: https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/priority.json . Grade: C. Accessed 2026-10-08. File-line ranges exclude the URL reader's six-line wrapper.

[4] Stencil Labs / can1357. “Model resolver.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/config/model-resolver.ts#L86-L123 ; role logic https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/config/model-resolver.ts#L1100-L1231 ; matching lines 738–990; concrete formatting lines 181–209; role resolution lines 1421–1467. Grade: C. Accessed 2026-10-08. Raw and fixed-tag local source opened.

[5] Stencil Labs / can1357. “Model role metadata and model browser role IDs.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/config/model-roles.ts#L56-L89 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/overlays/model-browser.ts#L64-L93 . Grade: C. Accessed 2026-10-08. Raw/fixed-tag source opened.

[6] Stencil Labs. “Model and Provider Configuration.” Bundled omp 18.8.6 documentation, 2026. omp://models.md . Grade: C. Accessed 2026-10-08. Especially lines 247–283 (merge/refresh), 570–625 (availability/startup), 627–654 (roles), 714–726 (selectors). Companion public source repository: https://github.com/can1357/oh-my-pi/tree/v18.8.6 .

[7] Stencil Labs / can1357. “Status-line model segments, layout, and Unicode symbols.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/status-line/segments.ts#L275-L394 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/status-line/component.ts#L3021-L3075 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/theme/symbols.ts#L395-L581 . Grade: C. Accessed 2026-10-08. Raw/fixed-tag source opened.

[8] Stencil Labs / can1357. “Model browser row rendering.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/overlays/model-browser.ts#L1479-L1522 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/overlays/model-picker.ts#L257-L258 . Grade: C. Accessed 2026-10-08. Raw/fixed-tag source opened, including provider-prefix/detail rendering.

[9] Stencil Labs / can1357. “Model Hub role rows.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/overlays/model-hub.ts#L2595-L2639 . Grade: C. Accessed 2026-10-08. Raw/fixed-tag source opened.

[10] Stencil Labs / can1357. “Agent Hub model and role rendering.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/overlays/agent-hub-renderer.ts#L116-L217 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/overlays/agent-hub.ts#L2149-L2191 . Grade: C. Accessed 2026-10-08. Raw/fixed-tag source opened.

[11] Stencil Labs / can1357. “Task showResolvedModelBadge setting.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/task/settings.ts#L494-L505 . Grade: C. Accessed 2026-10-08. Raw/fixed-tag source opened.

[12] Stencil Labs / can1357. “Task model badge and middle truncation.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/render/render-utils.ts#L128-L222 . Grade: C. Accessed 2026-10-08. Raw/fixed-tag source opened.

[13] Stencil Labs / can1357. “Task model identity and header rendering.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/task/executor.ts#L4201-L4209 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/tools/task.ts#L1063-L1114 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/tools/task.ts#L1890-L1891 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/tui/src/tools/agent-tree.ts#L69-L133 . Grade: C. Accessed 2026-10-08. Raw/fixed-tag source opened, including native describe path.

[14] Stencil Labs / can1357. “Provider default-model descriptors and compiled rules.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/catalog/src/provider-models/descriptors.ts#L200-L203 ; https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/catalog/src/compat/rules.json ; KDL directory https://github.com/can1357/oh-my-pi/tree/v18.8.6/packages/catalog/src/compat/rules/providers . Grade: C. Accessed 2026-10-08. Opened eight named provider KDL files (line 4) and queried compiled `.providers[].defaultModel` in fixed-tag local source.

[15] Stencil Labs / can1357. “Default thinking level setting.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/session/settings.ts#L197-L209 . Grade: C. Accessed 2026-10-08. Fixed-tag source opened.

[16] Terminal-Bench team. “Terminal-Bench 4.0 leaderboard.” Terminal-Bench, 2026. https://www.tbench.ai/?version=4.0 . Grade: C. Accessed 2026-10-08. Opened with read; rendered model labels/date column inspected in browser. Evidence for benchmark labels, not vendor API IDs.

[17] Anthropic. “Claude model overviews and model comparison.” Claude Platform, 2026. https://platform.claude.com/docs/en/models/opus-5-5/overview ; https://platform.claude.com/docs/en/models/sonnet-5-5/overview ; https://platform.claude.com/docs/en/models/fable-5-1/overview ; https://platform.claude.com/docs/en/models/haiku-5-5/overview ; https://platform.claude.com/docs/en/models/overview . Grade: C. Accessed 2026-10-08. Individual overview lines 14–18 give IDs/releases; comparison lines 56/63 explain pinned dateless IDs.

[18] OpenAI. “GPT-6 Astra; GPT-6.1 Sol; API changelog.” OpenAI Developers, 2026. https://developers.openai.com/api/docs/models/gpt-6-astra ; https://developers.openai.com/api/docs/models/gpt-6.1-sol ; https://developers.openai.com/api/docs/changelog . Grade: C. Accessed 2026-10-08. Model ID/Snapshots sections and September 3, 22, 29 entries opened.

[19] Google. “Gemini API changelog and models.” Google AI for Developers, 2026. https://ai.google.dev/gemini-api/docs/changelog ; https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview ; https://ai.google.dev/gemini-api/docs/models . Grade: C. Accessed 2026-10-08. September 2, July 21, February 19 entries; model-code/version sections.

[20] DeepSeek. “API updates; Models & Pricing; September 10 announcement.” DeepSeek API Docs, 2026. Official URLs: https://api-docs.deepseek.com/updates/ ; https://api-docs.deepseek.com/quick_start/pricing/ ; https://api-docs.deepseek.com/news/news260910/ . Opened relay URLs: https://r.jina.ai/https://api-docs.deepseek.com/updates/ ; https://r.jina.ai/https://api-docs.deepseek.com/quick_start/pricing/ ; https://r.jina.ai/https://api-docs.deepseek.com/news/news260910/ . Grade: C for attributed first-party content, with third-party retrieval caveat. Accessed 2026-10-08. September 10/August 13/April 24 updates, continuation notice, model-version mapping.

[21] xAI. “Grok 4.7 launch/API guide; Grok Build 0.1; release notes.” xAI, 2026. https://x.ai/news/grok-4-7 ; https://docs.x.ai/developers/grok-4-7 ; https://docs.x.ai/developers/models/grok-build-0.1 ; https://docs.x.ai/developers/release-notes . Grade: C. Accessed 2026-10-08. September 21 dateline, exact API names, Fast access caveat, May release section.

[22] Moonshot AI. “Model List and Platform Changelog.” Kimi Open Platform, 2026. https://platform.kimi.ai/docs/models ; https://platform.kimi.ai/docs/platform-changelog.md . Grade: C. Accessed 2026-10-08. Exact model table and July/June 2026 update blocks.

[23] Z.ai. “New releases; GLM-5.3; GLM-5.3-Flash.” Z.ai Developer Documentation, 2026. https://docs.z.ai/release-notes/new-released ; https://docs.z.ai/guides/llm/glm-5.3 ; https://docs.z.ai/guides/vlm/glm-5.3-flash . Grade: C. Accessed 2026-10-08. August 18/26 update labels, API example and Model Code field.

[24] Alibaba Cloud. “Alibaba unveils Qwen3.8-Max; Newly released models.” Alibaba Cloud, 2026. https://www.alibabacloud.com/en/press-room/alibaba-unveils-qwen3-8-max ; https://www.alibabacloud.com/help/en/model-studio/newly-released-models . Grade: C. Accessed 2026-10-08. Announcement dateline and International/US regional model availability tables.

[25] MiniMax. “Model release notes; MiniMax M3; model introduction.” MiniMax, 2026. https://platform.minimax.io/docs/release-notes/models ; https://www.minimax.io/models/text/m3 ; https://www.minimax.io/blog/minimax-m3 ; https://platform.minimax.io/docs/guides/models-intro . Grade: C. Accessed 2026-10-08. June 1/March 18 entries, M3 API example, restricted M3.1 Flash Preview listing.

[26] Mistral AI. “Changelog and model cards; Vibe remote agents and Mistral Medium 3.5.” Mistral AI, 2025–2026. https://docs.mistral.ai/resources/changelogs ; https://docs.mistral.ai/models/mistral-large-4-0 ; https://docs.mistral.ai/models/mistral-medium-3-5-26-04 ; https://mistral.ai/news/vibe-remote-agents-mistral-medium-3-5/ ; https://docs.mistral.ai/models/codestral-25-08 . Grade: C. Accessed 2026-10-08. Dated headings, model IDs/status fields, announcement dateline and alias.

[27] Stencil Labs. “Settings — Models; bundled agent definitions.” Bundled omp 18.8.6 documentation/source, 2026. omp://settings.md (lines 378–418 opened); https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/task/agents.ts (embedded task and sonic definitions, source lines 44–73); https://raw.githubusercontent.com/can1357/oh-my-pi/v18.8.6/packages/coding-agent/src/prompts/agents/scout.md (frontmatter, source lines 1–7). Grade: C. Accessed 2026-10-08. Underlying source opened directly; dossier 10 used only to locate it. Role configuration examples opened directly in bundled settings/models docs.

[28] Stencil Labs / Homebrew installation metadata. “omp 18.8.6 formula.” Locally installed release metadata, 2026. file:///opt/homebrew/Cellar/omp/18.8.6/.brew/omp.rb ; upstream release https://github.com/can1357/oh-my-pi/releases/tag/v18.8.6 . Grade: C. Accessed 2026-10-08. Local formula opened read-only; confirms compiled-binary distribution.

[29] Stencil Labs / can1357. “Model registry availability.” oh-my-pi, v18.8.6, 2026. https://github.com/can1357/oh-my-pi/blob/v18.8.6/packages/coding-agent/src/config/model-registry.ts#L2746-L2802 . Grade: C. Accessed 2026-10-08. Raw source opened.

[30] Project research dossier. “02 — Harness benchmarks.” omp-walkthrough research, 2026. https://github.com/anrikus/omp-walkthrough/blob/main/research/02-harness-benchmarks.md . Grade: D as a project synthesis, not independent primary evidence. Accessed 2026-10-08. Lines 1–180 and references read for narration consistency only; no historical score is newly asserted here.
