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
- strong candidates: `1`
- watchlist: `0`
- target table: `data/normalized/occupation_role_shape_review.csv`

## Implemented First Pass

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |
| --- | ---: | ---: | ---: | ---: | --- |
| Technical Writers | 0.255 | 2 | 0.347 | 0.097 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Editors | 0.254 | 2 | 0.371 | 0.048 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Market Research Analysts and Marketing Specialists | 0.246 | 2 | 0.362 | 0.031 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Management Analysts | 0.235 | 2 | 0.330 | 0.047 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Accountants and Auditors | 0.211 | 3 | 0.362 | 0.034 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| News Analysts, Reporters, and Journalists | 0.198 | 3 | 0.337 | 0.027 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |

## Strong Candidates

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |
| --- | ---: | ---: | ---: | ---: | --- |
| Receptionists and Information Clerks | 0.428 | 2 | 0.285 | 0.221 | High heterogeneity signal with direct role-shape review pressure and enough retained-function complexity to justify explicit variant modeling. |

## Watchlist

- No occupation currently sits on the role-shape watchlist.

## Selection Rule

- Strong candidate: role-shape review is primary and the occupation clears a higher heterogeneity/anchor threshold.
- Watchlist: role-shape review is primary and the occupation is directionally split-looking, but the evidence is still weaker than the strong-candidate bar.
- Not now: another layer should be tuned first, or the role-shape evidence is still too weak.

