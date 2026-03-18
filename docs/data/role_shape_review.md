# Role Shape Review

This report is a calibration-driven review artifact for deciding where one occupation likely hides multiple stable role variants.

It does not directly score the live runtime on its own.
It exists to tell the repo which occupations are the best candidates for reviewed role-variant expansion beyond the first implemented set.

Generated from:
- `data/normalized/occupation_structural_calibration_targets.csv`
- `data/normalized/occupation_role_explanations.csv`
- `data/normalized/occupation_role_variants.csv`

## Summary

- occupations reviewed: `34`
- implemented first-pass variants: `7`
- strong candidates: `0`
- watchlist: `1`
- target table: `data/normalized/occupation_role_shape_review.csv`

## Implemented First Pass

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |
| --- | ---: | ---: | ---: | ---: | --- |
| Market Research Analysts and Marketing Specialists | 0.514 | 1 | 0.392 | 0.152 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Web Developers | 0.506 | 1 | 0.380 | 0.140 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Editors | 0.468 | 2 | 0.386 | 0.196 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Accountants and Auditors | 0.463 | 2 | 0.380 | 0.187 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Management Analysts | 0.438 | 2 | 0.340 | 0.161 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| News Analysts, Reporters, and Journalists | 0.323 | 2 | 0.351 | 0.120 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |
| Technical Writers | 0.260 | 2 | 0.369 | 0.076 | Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion. |

## Strong Candidates

- No occupation currently clears the strong-candidate threshold.

## Watchlist

| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why not yet |
| --- | ---: | ---: | ---: | ---: | --- |
| Operations Research Analysts | 0.506 | 1 | 0.363 | 0.169 | Meaningful role-shape pressure exists, but the evidence still looks better suited to monitoring than immediate variant modeling. |

## Selection Rule

- Strong candidate: role-shape review is primary and the occupation clears a higher heterogeneity/anchor threshold.
- Watchlist: role-shape review is primary and the occupation is directionally split-looking, but the evidence is still weaker than the strong-candidate bar.
- Not now: another layer should be tuned first, or the role-shape evidence is still too weak.

