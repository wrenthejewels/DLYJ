# Role Shape Review

This report is a calibration-driven review artifact for deciding where one occupation likely hides multiple stable role variants.

It does not directly score the live runtime on its own.
It exists to tell the repo which occupations are the best candidates for reviewed role-variant expansion beyond the first implemented set.

Generated from:
- `data/normalized/occupation_structural_calibration_targets.csv`
- `data/normalized/occupation_role_explanations.csv`
- `data/normalized/occupation_role_variants.csv`

## Summary

- occupations reviewed: `63`
- implemented first-pass variants: `6`
- strong candidates: `0`
- watchlist: `0`
- target table: `data/normalized/occupation_role_shape_review.csv`

## Implemented First Pass

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.266 | 2 | 0.371 | 0.098 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Market Research Analysts and Marketing Specialists | 0.248 | 2 | 0.362 | 0.040 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Management Analysts | 0.237 | 2 | 0.330 | 0.054 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Technical Writers | 0.237 | 2 | 0.347 | 0.022 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Accountants and Auditors | 0.223 | 3 | 0.362 | 0.080 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| News Analysts, Reporters, and Journalists | 0.206 | 3 | 0.337 | 0.057 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |

## Strong Candidates

- No occupation currently clears the strong-candidate threshold.

## Watchlist

- No occupation currently sits on the role-shape watchlist.

## Selection Rule

- Strong candidate: role-shape review is primary and the occupation clears a higher heterogeneity/anchor threshold.
- Watchlist: role-shape review is primary and the occupation is directionally split-looking, but the evidence is still weaker than the strong-candidate bar.
- Not now: another layer should be tuned first, or the role-shape evidence is still too weak.

