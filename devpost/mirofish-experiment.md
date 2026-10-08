# MiroFish news scenario experiment for RinggitWon

Prepared 2026-10-08 (Asia/Kuala_Lumpur). Status: research and reusable protocol ready; no external simulation executed, account created, payment made, or data uploaded. No app code changes.

## Availability and costs

The official project's maintainer explicitly identifies **mirofish.homes and mirofish.my as unaffiliated third-party services**. Its official channels are [666ghj/MiroFish](https://github.com/666ghj/MiroFish), mirofish.ai, and a static demonstration. That demo cannot run new uploaded scenarios. The maintainer describes outputs as qualitative, without calibrated confidence or a stable probability contract. These statements come from the [maintainer FAQ](https://github.com/666ghj/MiroFish/issues/726), opened July 21, 2026 and marked verified against a July 23 code baseline; they are not a runtime test of either hosted service.

| Option | Publicly verified access and integration | Cost / unresolved details |
| --- | --- | --- |
| [mirofish.homes](https://mirofish.homes/) | Landing page directs visitors to mirofish.my; advertises text and optional file inputs. | No separate working service or API established in this review. |
| [mirofish.my](https://mirofish.my/) | Console requires sign-in; advertises PDF/Markdown/TXT inputs, reports and follow-up interaction. Its FAQ distinguishes deterministic fixture mode from Python backend mode. | [Pricing](https://mirofish.my/pricing) advertises Starter $9/month, Pro $19/month, Premium $49/month, alongside annual-equivalent rates $7.50, $15.83, $40.83/month. No numeric run quotas, free entitlement, tax/currency code or checkout total verified. |
| Official self-hosted project | Python backend and local frontend; source exposes simulation create/prepare/status routes and downloadable Markdown reports. | Requires an LLM API account/key and Zep key, plus local compute. No fixed cost per run established. |

No public hosted API authentication guide, supported SDK, webhook contract or report-export specification was found for the two supplied domains in the inspected pages/searches. This means **unverified**, not proof that these features do not exist. Their advertised UI does not establish that a paid simulation actually executes. The [hosted guide dated July 24, 2026](https://mirofish.my/blog/how-to-use-mirofish) describes a manual source-packet → graph review → simulation → report workflow.

For the official project, [simulation source](https://github.com/666ghj/MiroFish/blob/main/backend/app/api/simulation.py) exposes `POST /api/simulation/create`, `POST /api/simulation/prepare`, and status retrieval. [Report source](https://github.com/666ghj/MiroFish/blob/main/backend/app/api/report.py) implements `GET /api/report/<report_id>/download` returning Markdown. These are deployment-local routes, **not verified mirofish.my endpoints**. A future adapter could import a reviewed Markdown report; direct app integration needs separate engineering and version pinning.

The [official setup instructions](https://github.com/666ghj/MiroFish/blob/60757b3c825d577a1d7a86ab1ba6d5c21f51c261/README.md) require Node 18+, Python 3.11–3.12 and uv. Its [configuration template](https://github.com/666ghj/MiroFish/blob/60757b3c825d577a1d7a86ab1ba6d5c21f51c261/.env.example) requires `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL_NAME`, and `ZEP_API_KEY`. Exact LLM cost depends on the selected provider/model and measured usage; none was selected here.

[Zep's current pricing](https://www.getzep.com/pricing/) lists a free allocation of 10,000 credits/month, 2 projects and 5 custom entity/edge types, with variable rate limits. Flex is $125/month with 50,000 credits and automatic paid top-ups; Flex Plus is $375/month. Free-tier compatibility and sufficient quota for this experiment have not been verified. Do not assume the official README's older free-quota guidance guarantees a free run today.

## Proposed experiment

Question: can source-grounded simulated reactions improve the specificity and usefulness of RinggitWon's MYR/KRW explanations? It is an explanation experiment, with independently scored directional claims when the evidence supports them. Choose the official local project for a reproducible first run; record its commit and provider configuration. Start with one short packet and three repetitions using fixed settings. Repetitions measure instability, not event probabilities.

Keep the app's statistical output and this experiment in separate artifacts. Do not change bootstrap paths, headline adjustments, target-hit percentages or displayed model probabilities using MiroFish text. Do not translate agent counts, agreement, report confidence, or repetition frequencies into market probabilities.

### Input template

All brackets below are **blank placeholders**, not observations or article evidence. Replace every required field before running. A valid packet needs at least one verified dated public source. Use short factual paraphrases; preserve original language and label translations. A current article about an old event is not evidence available at that old cutoff.

```text
PACKET_ID: [unique ID]
AS_OF: [ISO 8601 timestamp with timezone]
TIMEZONE: Asia/Kuala_Lumpur
PAIR: MYR/KRW
QUOTE: KRW per 1 MYR; a rise means more won for one ringgit
SCENARIO_START: [timestamp after AS_OF]
SCENARIO_END: [timestamp]
RATE_AS_OF: [value; reference observation date; publication/availability time]
RATE_SOURCE: [public URL and stored snapshot/version]
OPTIONAL_TRAVEL_TARGET: [KRW per MYR or omitted]
EVIDENCE:
  - ID: S1
    TITLE: [exact source title]
    PUBLISHER: [publisher]
    URL: [public source URL]
    PUBLISHED_AT: [timestamp and timezone]
    AVAILABLE_BY_AS_OF: [proof: archived version/capture and timestamp]
    RETRIEVED_AT: [timestamp]
    EVENT_AT: [date/time, distinct from publication time]
    ORIGINAL_LANGUAGE: [language]
    FACTS: [brief verified paraphrase of accessible content]
    TRANSLATION_NOTE: [if applicable]
    CAVEATS: [headline only / revised / contradictory / unknown]
  - [repeat only for verified sources]
KNOWN_CONTEXT: [source-ID-backed facts available by AS_OF]
UNKNOWN: [missing evidence; no invented replacements]
```

### Exact reusable prompt

Paste this prompt with the completed packet into a configured simulation. Freeze the prompt before seeing outcomes.

```text
Produce a qualitative MYR/KRW news scenario explanation for a traveler using
RinggitWon. Use only the accompanying packet as factual evidence and respect its
AS_OF cutoff. Do not browse for later information or use remembered subsequent
events. If dates, the window, or verified evidence are missing, return
INSUFFICIENT INPUT with the missing fields and stop.

The quote is KRW per 1 MYR. Higher means a traveler receives more KRW for one MYR.
An event affecting both currencies need not determine this cross-rate's direction.
Separate verified facts, assumptions, simulated reactions, and unknowns. Cite
packet source IDs for each factual claim. Do not invent articles, quotes, current
prices, actor statements, statistics, or new real-world events. Hypothetical
agents are fictional role models; their posts are not real evidence.

Model relevant Malaysian and Korean policymakers, importers/exporters, currency
market participants, news interpreters and travelers only where the packet
supports their relevance. Label assumed incentives. Examine MYR and KRW channels
separately, then their relative effect. Treat USD/global-risk channels as
conditional mechanisms when unsupported by packet facts.

For the packet's exact window, explain three conditional paths: higher KRW/MYR,
lower KRW/MYR, and mixed or little directional information. For each, give the
trigger, actor response, currency transmission mechanism, countervailing force,
and an observable condition that would contradict it. Do not force evidence into
all three paths; say unsupported where appropriate. Do not assign probabilities,
percentage confidence, price targets or exact target-hit dates. Agent agreement
and repeated simulation outcomes are not real-world likelihoods.

Return Markdown with:
1. Cutoff, quote convention, window and evidence limitations.
2. At most five source-grounded factual anchors with source IDs.
3. The three conditional paths in a compact table.
4. One preferred directional hypothesis: UP / DOWN / MIXED / INSUFFICIENT,
   selected only when justified; explicit assumptions and disconfirming signals.
5. At most three falsifiable claims, each with a deadline, observable measure,
   direction/threshold, and a specified public verification source. If no
   measurable claim is supported, abstain.
6. A <=100-word traveler explanation, ending: "Exploratory news scenarios;
   these do not alter RinggitWon's statistical model estimates."

Do not recommend a purchase, exchange date or trading action. Identify unresolved
information rather than filling it with plausibility. Keep the output under
700 words.
```

## Evaluation without future information

1. **Pre-register cases.** Choose consecutive monthly cutoffs and one fixed horizon before inspecting results; reserve later months as untouched evaluation cases. Use all eligible cases, including quiet periods and abstentions. Set selection rules, thresholds and exclusions on development cases only.
2. **Freeze historical packets.** Include only rates actually published and source versions available by each cutoff. Store timestamps, archived copies, hashes and retrieval logs. Exclude unavailable/revised-only sources rather than backfilling from current summaries. Keep later rates, later news and existing model predictions out of the simulation packet.
3. **Control model leakage.** A modern LLM may already know historical outcomes. A cutoff prompt cannot erase that knowledge. Historical runs are therefore exploratory and potentially contaminated. Stronger evidence requires a model demonstrably predating the outcome or prospective runs sealed before their outcome window. Start a prospective packet now once actual dated evidence is collected.
4. **Seal outputs.** Save every raw report, graph/config, model version, project commit, seeds where controllable, repetitions, timing and measured cost before opening future observations. Fix claims from the original report; no rewriting them after seeing what happened. Retain failures and contradictory repeats.
5. **Score separately.** Have a reviewer assess source support, invented facts, quote-direction errors and explanation usefulness without seeing which method generated the text. Compare MiroFish with the same packet summarized directly by the same LLM, using the same output format and budget where feasible.
6. **Open outcomes.** For UP/DOWN claims, predefine a neutral band from training data and measure the last published reference observation on/before the horizon end relative to the cutoff rate. Score directional accuracy, abstention coverage and each falsifiable claim's success/failure/unresolved status. Keep endpoint direction separate from a target being reached at any observed day within the window; a daily reference series cannot establish intraday dealer-price hits. Log unforeseen shocks without retroactively changing the score.
7. **Assess usefulness, not calibration.** Report case counts and uncertainty, per-period results and costs. Do not compute probability calibration or Brier scores from qualitative labels. Statistical probability evaluation belongs to the separate forecast-validation track. Select a fixed prompt on development cases, then evaluate it once on held-out/prospective cases; overlapping horizons are dependent observations.

## Next required user action

For a real run, authorize a small official local MiroFish setup with a stated spending ceiling, and configure the selected LLM provider and Zep credentials locally (do not paste keys into chat). Then populate the packet with dated public evidence and verify available quota before starting. No usable deployment or credential access has been established by this research, so a simulation result cannot yet be reported. If choosing mirofish.my instead, first confirm its actual run allowance, total charge and export capability with its operator; that service is independent of the official project.
