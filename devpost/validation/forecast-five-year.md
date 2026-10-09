# Five-year forecast backtest

Cutoff: 2026-10-09, Kuala Lumpur. Only outcomes before this date are scored.

## Summary

Across 1,413 scored cases (717 Frankfurter, 696 Twelve Data), compare the calibration tables and paired uncertainty intervals below. Cases are correlated, not independent trials. Every six-month-block interval for the Brier difference from the one-year model spans zero; improved accuracy from five years is not established. The historical-frequency baseline has a lower point-estimate Brier score in 6 of six provider/horizon comparisons.

## Design

- Frozen five-year implementation, run directly from the app source; 2,000 paths per case. No fitting or probability correction is performed.
- Monthly origins on the 15th, targets 1%, 3%, and 5% above the last known rate. A full five-year span is required before each origin, with up to seven days allowed at the left boundary for closures.
- All same-date observations are withheld (one-date publication lag). Only complete outcome windows are included. Twelve Data uses weekday closes; Friday values carry through weekends, exactly matching the model’s flat-weekend assumption. No missing weekday prices are filled.
- Frankfurter uses calendar-day reference observations. Each provider is scored against its own observations: these scores are not a head-to-head comparison of identical market outcomes.
- News is disabled because no point-in-time headline archive was supplied. This evaluates rate-only estimates, not the complete news-adjusted product or MiroFish.
- Baselines: no-change (0% for these positive targets), the app’s one-year model with the same provider/calendar, and historical hit frequency over complete windows within the five-year training history. Historical frequency matches horizon length and delay from the starting quote; all baseline outcomes precede the origin.

## Metrics and uncertainty

Brier score is mean squared probability error (lower is better). Bias is mean predicted probability minus observed hit frequency. Skill = 1 − model Brier / historical-frequency Brier. AUROC measures ranking, not calibration. Log loss uses probabilities clipped to [1/4000, 3999/4000], so exact 0/100% simulation outcomes do not create infinite scores.

Intervals are approximate 95% percentile circular moving-block bootstrap intervals (2,000 draws), resampling six-month groups of forecast origins while retaining all target cases in each origin. Twelve-month blocks are a dependence sensitivity check. Intervals reflect historical sampling variability, not confidence intervals for an individual future prediction. Small numbers of regimes and history revisions limit inference. No independent-case binomial intervals or significance claims are used.

With 2,000 independent simulated paths, nominal Monte Carlo standard error is at most 1.12 percentage points (about ±2.2 points at 95%). That only measures simulation noise conditional on the model—not forecasting accuracy.

## Frankfurter

Historical observations: 2015-01-01–2026-10-08; 4299 usable source observations. Retrieved 2026-10-08T16:23:14.620Z.

| Horizon | Cases / origins | Mean estimate | Actual hits | Brier | Frequency baseline | One-year model | No-change | Skill |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| This month | 243 / 81 | 8.0% | 14.4% | 0.099 | 0.093 | 0.097 | 0.144 | -7.4% |
| Next month | 240 / 80 | 18.1% | 28.3% | 0.155 | 0.144 | 0.160 | 0.283 | -7.7% |
| Next 3 months | 234 / 78 | 32.1% | 48.3% | 0.215 | 0.197 | 0.229 | 0.483 | -9.0% |

### Uncertainty and discrimination

Δ Brier = five-year model minus baseline; negative favors five years. An interval spanning zero does not establish improvement.

| Horizon | Brier 95% interval (6m) | Δ vs frequency (6m) | Δ vs one-year (6m) | Δ vs frequency (12m) | Bias interval (6m) | AUROC | Log loss |
|---|---:|---:|---:|---:|---:|---:|---:|
| This month | [0.0759, 0.1260] | [0.0005, 0.0133] | [-0.0044, 0.0108] | [0.0003, 0.0129] | [-0.1080, -0.0232] | 0.859 | 0.311 |
| Next month | [0.1210, 0.1904] | [0.0009, 0.0209] | [-0.0175, 0.0088] | [0.0001, 0.0206] | [-0.1675, -0.0394] | 0.833 | 0.498 |
| Next 3 months | [0.1587, 0.2747] | [-0.0014, 0.0364] | [-0.0539, 0.0249] | [-0.0028, 0.0341] | [-0.2802, -0.0515] | 0.790 | 0.652 |

### Calibration (all horizons and targets pooled)

| Predicted bin | Cases | Mean predicted | Observed hits |
|---|---:|---:|---:|
| 0–20% | 444 | 4.0% | 11.5% |
| 20–40% | 119 | 26.6% | 46.2% |
| 40–60% | 85 | 49.0% | 64.7% |
| 60–80% | 61 | 66.2% | 78.7% |
| 80–100% | 8 | 81.5% | 87.5% |

### Target sensitivity (all horizons pooled)

| Target above starting rate | Cases | Mean predicted | Observed hits | Model Brier | Frequency Brier |
|---|---:|---:|---:|---:|---:|
| 1.0% | 239 | 45.5% | 61.1% | 0.238 | 0.218 |
| 3.0% | 239 | 10.2% | 21.3% | 0.158 | 0.146 |
| 5.0% | 239 | 2.0% | 7.9% | 0.071 | 0.067 |

Excluded counters (training counts origins; others count target/horizon attempts): {"training":0,"model":0,"incompleteOutcome":0,"incompleteHorizon":12,"baseline":0}.

Data SHA-256: f486077746ffd1fe0fa5df402d4ccc2a29046b00dee027439a0ac23be7340a51.

## Twelve Data

Historical observations: 2015-01-01–2026-10-08; 3064 usable source observations. Retrieved 2026-10-08T16:23:24.652Z.

| Horizon | Cases / origins | Mean estimate | Actual hits | Brier | Frequency baseline | One-year model | No-change | Skill |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| This month | 240 / 80 | 22.1% | 20.4% | 0.112 | 0.111 | 0.108 | 0.204 | -1.0% |
| Next month | 234 / 78 | 38.4% | 34.2% | 0.172 | 0.165 | 0.169 | 0.342 | -4.5% |
| Next 3 months | 222 / 74 | 56.3% | 56.3% | 0.207 | 0.206 | 0.198 | 0.563 | -0.6% |

### Uncertainty and discrimination

Δ Brier = five-year model minus baseline; negative favors five years. An interval spanning zero does not establish improvement.

| Horizon | Brier 95% interval (6m) | Δ vs frequency (6m) | Δ vs one-year (6m) | Δ vs frequency (12m) | Bias interval (6m) | AUROC | Log loss |
|---|---:|---:|---:|---:|---:|---:|---:|
| This month | [0.0918, 0.1384] | [-0.0067, 0.0090] | [-0.0027, 0.0125] | [-0.0078, 0.0105] | [-0.0472, 0.0759] | 0.829 | 0.363 |
| Next month | [0.1498, 0.1976] | [-0.0104, 0.0254] | [-0.0116, 0.0193] | [-0.0127, 0.0291] | [-0.0450, 0.1294] | 0.776 | 0.526 |
| Next 3 months | [0.1864, 0.2304] | [-0.0345, 0.0366] | [-0.0190, 0.0393] | [-0.0362, 0.0466] | [-0.1329, 0.1280] | 0.719 | 0.602 |

### Calibration (all horizons and targets pooled)

| Predicted bin | Cases | Mean predicted | Observed hits |
|---|---:|---:|---:|
| 0–20% | 214 | 9.3% | 6.1% |
| 20–40% | 139 | 31.9% | 25.2% |
| 40–60% | 190 | 50.9% | 46.3% |
| 60–80% | 145 | 69.1% | 75.9% |
| 80–100% | 8 | 82.5% | 100.0% |

### Target sensitivity (all horizons pooled)

| Target above starting rate | Cases | Mean predicted | Observed hits | Model Brier | Frequency Brier |
|---|---:|---:|---:|---:|---:|
| 1.0% | 232 | 63.1% | 69.0% | 0.203 | 0.202 |
| 3.0% | 232 | 34.1% | 26.7% | 0.172 | 0.163 |
| 5.0% | 232 | 18.2% | 13.8% | 0.113 | 0.113 |

Excluded counters (training counts origins; others count target/horizon attempts): {"training":0,"model":0,"incompleteOutcome":21,"incompleteHorizon":12,"baseline":0}.

Data SHA-256: dd6faccbf0841dd3f11bde9f701b437bc8f397c9af6408e70386a6f032bd7d70.

## Interpretation and limits

- Use the calibration tables and paired score differences together. More history is not automatically a better probability model. Do not convert these observed hit frequencies directly into user-facing probabilities.
- Outcomes are daily reference/closing-rate hits, not intraday highs, spreads, or executable retail exchange rates. Weekend carry in the Twelve Data model is a convention, not weekend tradability.
- Forecast windows and five-year training windows overlap heavily. Targets share paths and outcomes. Bootstrap blocks reduce but cannot eliminate dependence; six- and twelve-month results should be considered together.
- Data were downloaded now, not from historical publication vintages. The lag reduces same-date look-ahead but does not establish original availability or remove revisions/survivorship effects.
- Prior work already inspected parts of this history. This is retrospective evaluation of the newly fixed five-year model, not an untouched holdout. Do not tune and then cite these results as independent validation.
- No future live data were scored. Validate any calibration/model changes on a fresh chronological holdout or prospective forecasts before claiming reliable probabilities.
- Strict complete-outcome selection can favor well-covered periods. Exclusion counts are disclosed; no unknown outcomes are imputed.

## Statistical references

- [Gneiting & Raftery (2007): Strictly Proper Scoring Rules, Prediction, and Estimation](https://sites.stat.washington.edu/people/raftery/Research/PDF/Gneiting2007jasa.pdf), for probability scoring and calibration principles.
- [DasGupta: The Bootstrap](https://www.stat.purdue.edu/~dasgupta/bootstrap.pdf), for bootstrap inference including dependent observations. The 6/12-month block choices here are sensitivity settings, not estimated optimal block lengths.

## Reproduce

Run `node scripts/backtest-five-year.mjs --as-of=2026-10-09`. Private provider snapshots are cached in ignored `.cache/backtest/`; the Twelve Data key stays in ignored `.env.local`. No key is stored in the report. Results and case-level probabilities are in `forecast-five-year.json`. Provider revisions can change a fresh download; compare snapshot hashes.

App model SHA-256: 199ac5260e29c3265513dc61e257f6c8f093d7ce98fa2e598157b801d116092a.
