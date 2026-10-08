# Forecast backtest

Evaluation cutoff: **2026-10-08 (Kuala Lumpur)**.

[Rate source](https://api.frankfurter.dev/v2/rates?base=EUR&quotes=MYR%2CKRW&from=2022-01-01&to=2026-10-08) · retrieved 2026-10-08T06:08:24.795Z.

Data: 2022-01-01–2026-10-08, 1742 matched MYR/KRW observations.

## Method

The app’s 2000-path calendar-day simulator is run from monthly historical origins, each using only its trailing year of data. Targets are 1%, 3%, and 5% above the rate known at that origin. Only complete future windows are scored. The outcome is whether an observed daily reference rate reaches the target; this does not measure intraday or retail cash rates.

Each simulated date draws only from past consecutive-day returns ending on the same weekday. Returns across missing dates are excluded; each weekday needs at least eight samples. This changes the calendar assumption, not a fitted probability adjustment.

News adjustment is disabled: no archived news available at each historical origin was supplied. This evaluates the rate-only simulation, not the news heuristic or MiroFish.

## Results

Brier score is average squared probability error; lower is better. No-change predicts zero chance for these above-current targets. Historical frequency estimates target hits from the training year, using each forecast’s window length and calendar-day delay. It remains a simple comparator rather than a fitted model.

| Window | Cases | Mean estimate | Actual hit rate | Model Brier | No-change Brier | Historical frequency Brier |
|---|---:|---:|---:|---:|---:|---:|
| This month | 135 | 10.9% | 14.1% | 0.091 | 0.141 | 0.089 |
| Next month | 132 | 26.5% | 34.1% | 0.172 | 0.341 | 0.172 |
| Next 3 months | 126 | 48.7% | 58.7% | 0.255 | 0.587 | 0.297 |

## Calibration across all windows

| Estimate bin | Cases | Mean estimate | Actual hit rate |
|---|---:|---:|---:|
| 0–20% | 197 | 3.9% | 13.7% |
| 20–40% | 79 | 30.8% | 39.2% |
| 40–60% | 43 | 48.3% | 60.5% |
| 60–80% | 38 | 70.1% | 65.8% |
| 80–100% | 36 | 88.3% | 80.6% |

## Findings

Mean estimates fall below observed hit rates in 3 of three horizons. This is a development comparison on previously examined cases, not a new holdout. Results do not justify replacing displayed probabilities with observed hit rates.

Data diagnostic: 498 returned observations fall on weekends, and the revised simulator samples weekend changes on their matching calendar weekdays. These are provider-series observations, not proof of tradable weekend prices.

## Limits

- Origins, horizons and target levels overlap, so cases are correlated. Counts are not independent evidence; no confidence interval or accuracy guarantee is claimed.
- This is an exploratory backtest, not an untouched holdout. Changes selected after seeing this report need a fresh later evaluation period.
- Provider history may contain revisions; this download is not a vintage data archive. End-of-origin-day availability is assumed.
- Missing publication days are left blank; incomplete endpoint coverage is excluded. No historical prices or outcomes are fabricated.
- The model samples independent daily changes and may miss volatility clustering, regime changes, and persistent trends.
- Headline and MiroFish influence needs a separate dated-evidence evaluation before it can adjust probabilities.

Forecast source SHA-256: 3e10e5808ee0667b7cf8652f2b6ff64e1b39fa8ced0e8d5aadb1c61842a117fd.

Reproduce: `node scripts/backtest-forecast.mjs --as-of=2026-10-08`. The local rates snapshot is reused; raw case results are in `forecast-calendar-v2.json`.

## Comparison with the preserved original model

Same cases and rate snapshot; news disabled in both. Lower Brier score is better. This comparison uses already inspected development data, not independent validation.

| Horizon | Original mean estimate | Calendar mean estimate | Actual hits | Original Brier | Calendar Brier |
|---|---:|---:|---:|---:|---:|
| This month | 7.5% | 10.9% | 14.1% | 0.098 | 0.091 |
| Next month | 20.5% | 26.5% | 34.1% | 0.182 | 0.172 |
| Next 3 months | 39.1% | 48.7% | 58.7% | 0.266 | 0.255 |

The original results remain in [forecast-backtest.md](forecast-backtest.md). Next-month performance is approximately tied with the historical-frequency comparator; a tiny score difference does not establish superiority.

## Source-calendar interpretation

[Frankfurter documentation](https://frankfurter.dev/) says the default series blends providers. In this downloaded series, weekend observations can change; the previous weekday-only simulation did not match that calendar. The correction conditions samples on the day of the week without claiming weekend values are tradable prices. Provider revisions, holidays and sampling independence remain limitations.
