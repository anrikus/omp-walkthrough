# 00 — Research synthesis
> Orchestrator synthesis of dossiers 01–10 · 2026-10-08 · Claim IDs: `C<dossier>-T<n>` = the n-th "Narration-ready takeaway" in that dossier, `C<dossier>-N<n>` = the n-th "Key numbers" row. Both resolve through `claims.json`; sources resolve through `bibliography.json` / `citation-map.json`.

## Bottom line

1. **The harness is a first-order variable.** Peer-reviewed controlled studies show the same model scoring very differently under a different interface, tool set, or control loop: SWE-agent took GPT-4 Turbo from 11.00% to 18.00% on SWE-bench Lite, and CodeAct from 52.4% to 74.4% on its 82-task tool benchmark (C03-T1, C03-T2, C03-T3). Leaderboards and vendor reports keep showing the same thing (C02-T2, C06-T3).
2. **No harness, edit format, or multi-agent topology is universally best.** Reversals across models and tasks are common, including cases where more instructions, memory, or reasoning hurt (C03-T10, C06-T4, C07-T10).
3. **Many popular criticisms of Claude Code and Codex are out of date.** Codex CLI is Apache-2.0 with custom/local providers; Claude Code documents subagents, LSP plugins, and deferred MCP tool loading (C04-T2, C04-T5, C04-T11). Both lead the current Terminal-Bench 4.0 board (C02-T3). The defensible critique is about trade-offs — provider coupling and policy complexity, compaction opacity, sandbox defaults, cost — not missing features (C04-T4, C04-T6, C04-T8).
4. **Pi, omp, Hermes Agent and OpenClaw are not a linear succession.** Each emphasizes a different value: control and minimalism, integrated IDE tooling, persistent learning, personal-assistant connectivity (C05-T10). Pi itself has evolved: it added built-in MCP, tool search and codemode on 2026-09-29 (C05-T3).
5. **"Next generation" is a shift to harness–model co-design, not one product.** DeepSeek's V4.1 report trains across Claude Code versions, OpenCode, Pi, and DeepSeek Harness configurations (C06-T2, C03-T11). DeepSeek Harness (dsh) is an official MIT developer preview built on the Cordis plugin architecture (C06-T1), but it is not a universal winner; an independent preprint ranks Hermes ahead of it for each of three tested models (C06-T4).
6. **"Mixture-of-Agents" is a specific ICLR 2025 ensemble method**, not a synonym for subagents (C07-T1). Best practice for coding is conditional: parallelize separable work, keep one integration owner for coupled edits, write delegation contracts, verify with evidence rather than model approval, and measure the cost (dossier 07, principles 1–11; C07-T9, C07-T10).
7. **omp provides primitives for these patterns** — five bundled agents, fifteen model roles, batched subagents, isolation, typed outputs, judge/workpool/completion helpers, an advisor, Agent Hub (C10-T1 … C10-T6). No study evaluates omp's multi-agent configurations, and all omp feature evidence is grade C first-party documentation; the only omp performance numbers are a creator-run editing benchmark (C08-T3) and a small third-party SaaS-workflow evaluation (C02-T8).

## Blueprint corrections

| Blueprint item | What the evidence says | Proposed framing |
|---|---|---|
| Current overview of the ecosystem | "Harness" is useful but unsettled terminology (C01-T3); the product map churns quickly (C01-T10); open source and model choice are independent axes (C01-T5); shared primitives are converging (C01-T9) | A dated map organized by axes (openness × provider freedom × interface), not a ranked product list |
| Harness benchmarks | Terminal-Bench 4.0 and SWE-bench Pro v2 are the current flagships; scores belong to model + harness + task set + protocol (C02-T1, C02-T3); validity problems are documented in peer-reviewed work (C02-T4 … C02-T6) | "How to read a harness benchmark", with a standings snapshot stamped 2026-10-08 |
| Research that harness optimization alone improves performance | Strong grade-A evidence exists (SWE-agent, CodeAct, Agentless, HAL, Terminal-Bench, ADAS, AFlow, DGM, GEPA, ACE, Dynamic Cheatsheet); practitioner results (hashline, LangChain) are grade C (C03-T1 … C03-T9) | Lead with the peer-reviewed evidence, then the labelled practitioner results, then the counter-evidence |
| Problems with Codex and Claude Code | See bottom line 3; Anthropic's September 2025 quality incident was serving infrastructure, not the harness (C04-T7); subscription policy is nuanced, not a blanket ban (C04-T4) | "Trade-offs, not villains": dated current state, plus the history that motivated the alternatives |
| What led to Hermes, Pi and omp | Different motivations, verified from the creators' own writing (C05-T1, C05-T4, C05-T5, C05-T7) | Four design philosophies on a dated timeline |
| Next-gen harnesses like DeepSeek Harness | dsh is real and official, but its August 13 2026 launch date is unverified from official sources (dossier 06) | Several axes: composability (dsh), training across harnesses (V4.1), durable or persistent execution, interoperability protocols (C06-T8 … C06-T10), omp² as documented-but-in-progress (C06-T11) |
| Best-practice mixture-of-agents architecture | MoA ≠ subagents ≠ routing; evidence is conditional (C07-T1 … C07-T10) | "Which multi-agent pattern fits which task, evidence and budget" |
| omp features enabling mixture of agents | Primitives exist; Collab is human session sharing and Prewalk is a one-shot model handoff, neither is a multi-agent algorithm (C10-T10; dossier 09) | Map each omp primitive to a research principle; make no performance claims |
| Walkthrough of each feature | About 40 features; many are opt-in, and defaults matter (approval mode defaults to yolo) (C08-T9, C08-T10) | Narrated core features plus a complete feature atlas (see open decisions) |
| Recommended settings | No evidence-based universal optimum (dossier 10; dossier 07 principle 11) | Goal-conditioned profiles, each setting justified by docs or cited evidence |

## Evidence presentation policy (proposed)

- Every on-screen claim carries a grade badge: **Peer-reviewed** (A), **Preprint / tech report** (B), **First-party** (C), **Secondary** (D), **Anecdotal** (E).
- Numbers always appear with their conditions (model, harness, benchmark version, date). Narration states the key caveat in a short clause.
- Fast-moving facts get a date stamp ("as of 2026-10-08").
- Comparisons with other harnesses use only current, dated first-party documentation. Historical gaps are labelled with their dates.
- Clicking a citation chip opens an evidence card: source, grade, conditions, caveats, link.

## Gaps that more desk research cannot close

- No independent or peer-reviewed evaluation of omp on a flagship coding benchmark (C02-T8, C08-T3).
- No controlled evidence for optimal settings, agent counts, or cross-family review superiority (dossier 07, "Contested or uncertain"; dossier 10, "Unverified leads").
- The DeepSeek Harness launch date is not confirmed by an official source (dossier 06).
- The raw data behind the hashline benchmark returned 404 (dossier 08).

## Chapter plan

Superseded by `script/outline.md` (14 chapters; planned ≈40 min, final narration 44:29), which records the user's 2026-10-08 editorial decisions, including a full omp² chapter (fed by dossier 11) and real model IDs in recreations (fed by dossier 12). The scripts of record are `narration/chNN-*.json`.
