# Forecast backtest

Evaluation cutoff: **2026-10-08 (Kuala Lumpur)**.

[Rate source](https://api.frankfurter.dev/v2/rates?base=EUR&quotes=MYR%2CKRW&from=2022-01-01&to=2026-10-08) · retrieved 2026-10-08T06:08:24.795Z.

Data: 2022-01-01–2026-10-08, 1742 matched MYR/KRW observations.

## Method

The app’s unchanged 2000-path simulator is run from monthly historical origins, each using only its trailing year of data. Targets are 1%, 3%, and 5% above the rate known at that origin. Only complete future windows are scored. The outcome is whether an observed daily reference rate reaches the target; this does not measure intraday or retail cash rates.

News adjustment is disabled: no archived news available at each historical origin was supplied. This evaluates the rate-only simulation, not the news heuristic or MiroFish.

## Results

Brier score is average squared probability error; lower is better. No-change predicts zero chance for these above-current targets. Historical frequency estimates target hits from the training year, using each forecast’s window length and calendar-day delay. It remains a simple comparator rather than a fitted model.

| Window | Cases | Mean estimate | Actual hit rate | Model Brier | No-change Brier | Historical frequency Brier |
|---|---:|---:|---:|---:|---:|---:|
| This month | 135 | 7.5% | 14.1% | 0.098 | 0.141 | 0.089 |
| Next month | 132 | 20.5% | 34.1% | 0.182 | 0.341 | 0.172 |
| Next 3 months | 126 | 39.1% | 58.7% | 0.266 | 0.587 | 0.297 |

## Calibration across all windows

| Estimate bin | Cases | Mean estimate | Actual hit rate |
|---|---:|---:|---:|
| 0–20% | 240 | 4.2% | 17.1% |
| 20–40% | 60 | 27.4% | 46.7% |
| 40–60% | 40 | 49.8% | 72.5% |
| 60–80% | 34 | 67.6% | 64.7% |
| 80–100% | 19 | 88.7% | 94.7% |

## Findings

The model underestimates the aggregate target-hit frequency in all three horizons in this sample. It is not calibrated enough to present as a reliable real-world probability. Results do not justify replacing the displayed probabilities with the observed hit rates.

Data diagnostic: 498 returned observations fall on weekends, while the current simulator advances on weekdays only. The provider publication calendar and this model assumption need reconciling in a separately evaluated revision; this report preserves the existing model.

## Limits

- Origins, horizons and target levels overlap, so cases are correlated. Counts are not independent evidence; no confidence interval or accuracy guarantee is claimed.
- This is an exploratory backtest, not an untouched holdout. Changes selected after seeing this report need a fresh later evaluation period.
- Provider history may contain revisions; this download is not a vintage data archive. End-of-origin-day availability is assumed.
- Missing publication days are left blank; incomplete endpoint coverage is excluded. No historical prices or outcomes are fabricated.
- The model samples independent daily changes and may miss volatility clustering, regime changes, and persistent trends.
- Headline and MiroFish influence needs a separate dated-evidence evaluation before it can adjust probabilities.

Forecast source SHA-256: 1ab484cf5beb9ffd3b63937eb3a69685d8dd003e46149705fb0c7cac137c8de5.

Reproduce: `node scripts/backtest-forecast.mjs --as-of=2026-10-08`. The local rates snapshot is reused; raw case results are in `forecast-backtest.json`.
