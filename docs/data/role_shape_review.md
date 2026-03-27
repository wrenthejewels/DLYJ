# Role Shape Review

This report is a calibration-driven review artifact for deciding where one occupation likely hides multiple stable role variants.

It does not directly score the live runtime on its own.
It exists to tell the repo which occupations are the best candidates for reviewed role-variant expansion beyond the first implemented set.

Generated from:
- `data/normalized/occupation_structural_calibration_targets.csv`
- `data/normalized/occupation_role_explanations.csv`
- `data/normalized/occupation_role_variants.csv`

## Summary

- occupations reviewed: `61`
- implemented first-pass variants: `7`
- strong candidates: `0`
- watchlist: `0`
- target table: `data/normalized/occupation_role_shape_review.csv`

## Implemented First Pass

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.481 | 2 | 0.365 | 0.289 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Market Research Analysts and Marketing Specialists | 0.275 | 2 | 0.405 | 0.070 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Management Analysts | 0.257 | 2 | 0.358 | 0.083 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Editors | 0.257 | 2 | 0.361 | 0.079 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Technical Writers | 0.252 | 2 | 0.360 | 0.058 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Accountants and Auditors | 0.229 | 3 | 0.376 | 0.079 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| News Analysts, Reporters, and Journalists | 0.219 | 3 | 0.353 | 0.079 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |

## Strong Candidates

- No occupation currently clears the strong-candidate threshold.

## Watchlist

- No occupation currently sits on the role-shape watchlist.

## Selection Rule

- Strong candidate: role-shape review is primary and the occupation clears a higher heterogeneity/anchor threshold.
- Watchlist: role-shape review is primary and the occupation is directionally split-looking, but the evidence is still weaker than the strong-candidate bar.
- Not now: another layer should be tuned first, or the role-shape evidence is still too weak.

