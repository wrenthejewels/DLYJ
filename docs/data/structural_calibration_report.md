# Structural Calibration Report

This report is the first empirical calibration scaffold for the live model.

It does not validate AI-driven job loss directly.
It checks whether the model’s structural claims line up directionally with the best local non-runtime context currently present in the repo.

Generated from:
- `data/normalized/occupation_ors_structural_context.csv`
- `data/normalized/occupation_heterogeneity_context.csv`
- `data/normalized/industry_ai_adoption_context.csv`
- `data/normalized/occupation_btos_sector_mix.csv`
- `data/normalized/occupation_recomposition_context.csv`
- `data/normalized/occupation_quality_indicators.csv`
- `data/normalized/occupation_labor_market_context.csv`
- `data/normalized/occupation_adaptation_priors.csv`
- `data/normalized/occupation_individual_ai_usage_context.csv`
- live outputs from `v2_engine.js`

Current limitations:
- `occupation_ors_structural_context.csv` is now the main structural input for the human-guardrail check, using the normalized ORS structural index.
- occupations without usable ORS structural rows are currently left unscored for that strongest check instead of being silently folded back into a weaker proxy.
- `occupation_individual_ai_usage_context.csv` is calibration-only context derived from the AEI labor market follow-up. It measures observed individual-level Claude usage fractions by occupation, which is structurally different from the model's BTOS-derived org-level adoption context. Do not treat individual usage as a direct replacement for `ai_adoption_context`. Large divergences can still matter in review: `individual_higher` cases may indicate workers in a role are adapting faster than org adoption signals reflect, while review-flagged `org_higher` cases can indicate BTOS-heavy occupation targets that need a lighter recomposition/timing read.
- `occupation_heterogeneity_context.csv` is calibration-only context. It is useful for checking whether the model is overstating role uniformity, but it is still an external structural proxy rather than a runtime role-definition input.
- the heterogeneity check is not raw ACS alone; the target is scaled into a fragmentation-pressure range and conditioned on lower people-intensity so it stays closer to the model’s actual role-splitting claim.
- `industry_ai_adoption_context.csv` is also calibration-only context. It measures observed sector AI use and deployment change, not direct task automability.
- the BTOS adoption check is not compared on raw business-use percentages; the BTOS signal is mapped into the model’s organizational-conversion range so it behaves as a directional review target rather than a literal prevalence label.
- `occupation_recomposition_context.csv` is a derived outer-layer target. It is useful for checking workflow compression, organizational conversion, and timing assumptions, but it is still not direct proof of realized displacement. In review-flagged `org_higher` occupations, the calibration scaffold now lightly tempers that target with observed individual usage so sector BTOS overhang does not automatically become a journalism-style recomposition miss.
- `Lawyers` is the current explicit ACS/BTOS coverage exception. It keeps real ORS coverage, but ACS heterogeneity and BTOS sector mix do not resolve cleanly, so calibration should treat it as an ORS-backed reviewed exception rather than forcing a synthetic external join.
- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.
- this report is for calibration and review, not runtime scoring.

## Summary

- occupations evaluated: `61`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`
- explicit external coverage exceptions: `1`

## Check Strengths

### Human Guardrail Plausibility
- strength: `strong`
- coverage: `43/61`
- spearman correlation: `0.887`
- high-priority mismatches: `0`
- medium-priority mismatches: `9`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `60/61`
- spearman correlation: `0.922`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares organizational conversion and default adoption pressure to a BTOS adoption-context signal joined from sector-level AI-use estimates through ACS-derived occupation sector mix, then rescaled into the model’s adoption-realization range.

### Demand Context Plausibility
- strength: `weak`
- coverage: `61/61`
- spearman correlation: `0.851`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares demand-expansion signals to labor-market context, not to direct AI displacement.

### Wage Leverage Plausibility
- strength: `weak`
- coverage: `61/61`
- spearman correlation: `0.819`
- high-priority mismatches: `11`
- medium-priority mismatches: `10`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.852`
- high-priority mismatches: `0`
- medium-priority mismatches: `3`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.954`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer, with a light calibration-only damp for review-flagged org-higher individual-usage overhang cases.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.592`
- high-priority mismatches: `35`
- medium-priority mismatches: `5`
- description: Compares a hybrid modeled timing proxy to the derived occupation-level wave-acceleration context. The proxy uses primary displacement wave for real structural transitions and forward trigger/recomposition readiness for augmentation-first roles, and the target is lightly tempered in review-flagged org-higher individual-usage overhang cases.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.648`
- high-priority mismatches: `0`
- medium-priority mismatches: `1`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.385`
- high-priority mismatches: `1`
- medium-priority mismatches: `0`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

### Individual AI Usage Plausibility
- strength: `weak`
- coverage: `29/61`
- spearman correlation: `0.307`
- high-priority mismatches: `0`
- medium-priority mismatches: `12`
- description: Compares the model's org-level adoption context (BTOS-derived organizational conversion plus adoption pressure) against observed individual-level Claude usage fractions from the AEI labor market follow-up. These measure different things: org adoption versus worker behavior. Large gaps — especially where individual usage exceeds org adoption — may signal that workers in that role are adapting faster than the org-level signal captures, and deserve closer adoption-realization review.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap | Individual usage gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Office Clerks, General | high | role_shape_heterogeneity | medium | 0.105 (ok) | 0.106 (ok) | 0.142 (low) | 0.089 (ok) | 0.160 (low) | 0.070 (ok) | 0.549 (high) | 0.018 (ok) | 0.289 (high) | 0.067 (ok) |
| Customer Service Representatives | high | individual_ai_usage | weak | 0.017 (ok) | 0.108 (ok) | 0.108 (ok) | 0.273 (high) | 0.050 (ok) | 0.046 (ok) | 0.547 (high) | 0.112 (ok) | 0.124 (low) | 0.327 (medium) |
| Bookkeeping, Accounting, and Auditing Clerks | high | adoption_realization | medium | 0.011 (ok) | 0.123 (low) | 0.141 (low) | 0.142 (low) | 0.122 (low) | 0.045 (ok) | 0.490 (high) | 0.037 (ok) | 0.047 (ok) | 0.113 (ok) |
| Loan Interviewers and Clerks | high | accountability_guardrails | strong | 0.167 (low) | 0.054 (ok) | 0.124 (low) | 0.238 (high) | 0.055 (ok) | 0.019 (ok) | 0.459 (high) | 0.014 (ok) | 0.117 (ok) | n/a (ok) |
| Insurance Claims and Policy Processing Clerks | high | specialization_resilience | medium | n/a (ok) | 0.072 (ok) | 0.076 (ok) | 0.308 (high) | 0.178 (low) | 0.011 (ok) | 0.455 (high) | 0.216 (medium) | 0.058 (ok) | n/a (ok) |
| Network and Computer Systems Administrators | high | accountability_guardrails | strong | 0.166 (low) | 0.036 (ok) | 0.006 (ok) | 0.048 (ok) | 0.120 (low) | 0.018 (ok) | 0.450 (high) | 0.051 (ok) | 0.026 (ok) | n/a (ok) |
| Management Analysts | high | recomposition_and_timing | medium | 0.072 (ok) | 0.065 (ok) | 0.032 (ok) | 0.039 (ok) | 0.092 (ok) | 0.119 (ok) | 0.423 (high) | 0.060 (ok) | 0.083 (ok) | 0.263 (medium) |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | high | task_pressure | medium | 0.168 (low) | 0.138 (low) | 0.015 (ok) | 0.148 (low) | 0.241 (medium) | 0.010 (ok) | 0.392 (high) | 0.171 (low) | 0.124 (low) | 0.029 (ok) |
| Computer User Support Specialists | high | accountability_guardrails | strong | 0.176 (low) | 0.028 (ok) | 0.193 (medium) | 0.267 (high) | 0.084 (ok) | 0.061 (ok) | 0.382 (high) | 0.046 (ok) | 0.008 (ok) | n/a (ok) |
| Computer and Information Systems Managers | high | accountability_guardrails | strong | 0.164 (low) | 0.057 (ok) | 0.076 (ok) | 0.110 (ok) | 0.118 (ok) | 0.083 (ok) | 0.370 (high) | 0.054 (ok) | 0.110 (ok) | n/a (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| accountability_guardrails | 28 |
| task_pressure | 12 |
| bargaining_power | 6 |
| adoption_realization | 4 |
| demand_and_adoption | 2 |
| role_shape_heterogeneity | 1 |
| individual_ai_usage | 1 |
| specialization_resilience | 1 |
| recomposition_and_timing | 1 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Office Clerks, General | role_shape_heterogeneity | medium | high | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Customer Service Representatives | individual_ai_usage | weak | high | Individual AI usage mismatch points to a gap between observed worker-level Claude adoption and the model's org-level adoption context. Large individual_higher gaps may indicate workers adapting faster than the org-adoption signal captures. |
| Bookkeeping, Accounting, and Auditing Clerks | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Loan Interviewers and Clerks | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Insurance Claims and Policy Processing Clerks | specialization_resilience | medium | high | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Network and Computer Systems Administrators | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Management Analysts | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Computer User Support Specialists | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Computer and Information Systems Managers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Accountants and Auditors | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Graphic Designers | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Office Clerks, General | role_shape_heterogeneity | 0.230 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | 0.164 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Writers and Authors | task_pressure | 0.144 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Insurance Claims and Policy Processing Clerks | specialization_resilience | 0.138 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Graphic Designers | task_pressure | 0.130 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Public Relations Specialists | task_pressure | 0.126 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Receptionists and Information Clerks | task_pressure | 0.125 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Statistical Assistants | adoption_realization | 0.109 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Bookkeeping, Accounting, and Auditing Clerks | adoption_realization | 0.106 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Architectural and Engineering Managers | task_pressure | 0.105 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Lawyers | 0.787 | 0.571 | 0.216 | 0.763 | medium |
| General and Operations Managers | 0.683 | 0.893 | 0.210 | 0.763 | medium |
| Court, Municipal, and License Clerks | 0.471 | 0.270 | 0.201 | 0.806 | medium |
| Mechanical Engineers | 0.558 | 0.359 | 0.199 | 0.636 | medium |
| Computer Systems Analysts | 0.521 | 0.328 | 0.193 | 0.721 | medium |
| Transportation, Storage, and Distribution Managers | 0.636 | 0.828 | 0.192 | 0.678 | medium |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | 0.671 | 0.858 | 0.187 | 0.678 | medium |
| Financial and Investment Analysts | 0.567 | 0.381 | 0.186 | 0.678 | medium |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.423 | 0.286 | 0.138 | 0.850 | low |
| Statistical Assistants | 0.533 | 0.403 | 0.130 | 0.842 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.423 | 0.301 | 0.123 | 0.864 | low |
| Receptionists and Information Clerks | 0.385 | 0.274 | 0.111 | 0.881 | ok |
| Customer Service Representatives | 0.374 | 0.267 | 0.108 | 0.872 | ok |
| Information Security Analysts | 0.524 | 0.418 | 0.106 | 0.828 | ok |
| Office Clerks, General | 0.384 | 0.278 | 0.106 | 0.822 | ok |
| Market Research Analysts and Marketing Specialists | 0.495 | 0.399 | 0.096 | 0.886 | ok |

### Demand Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Information Security Analysts | 0.581 | 0.787 | 0.207 | 0.850 | medium |
| News Analysts, Reporters, and Journalists | 0.527 | 0.329 | 0.198 | 0.850 | medium |
| Claims Adjusters, Examiners, and Investigators | 0.380 | 0.183 | 0.197 | 0.850 | medium |
| Computer User Support Specialists | 0.374 | 0.181 | 0.193 | 0.850 | medium |
| Cost Estimators | 0.388 | 0.223 | 0.165 | 0.850 | low |
| Logisticians | 0.698 | 0.846 | 0.148 | 0.850 | low |
| Editors | 0.585 | 0.443 | 0.142 | 0.850 | low |
| Office Clerks, General | 0.463 | 0.321 | 0.142 | 0.850 | low |

### Wage Leverage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Insurance Claims and Policy Processing Clerks | 0.404 | 0.096 | 0.308 | 0.850 | high |
| Receptionists and Information Clerks | 0.285 | 0.000 | 0.285 | 0.850 | high |
| Customer Service Representatives | 0.290 | 0.017 | 0.273 | 0.850 | high |
| Computer User Support Specialists | 0.488 | 0.221 | 0.267 | 0.850 | high |
| Human Resources Managers | 0.598 | 0.858 | 0.260 | 0.850 | high |
| Sales Managers | 0.641 | 0.896 | 0.255 | 0.850 | high |
| Billing and Posting Clerks | 0.308 | 0.058 | 0.250 | 0.850 | high |
| Marketing Managers | 0.649 | 0.887 | 0.238 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.681 | 0.922 | 0.241 | 0.680 | medium |
| Receptionists and Information Clerks | 0.536 | 0.731 | 0.195 | 0.640 | medium |
| Writers and Authors | 0.352 | 0.170 | 0.182 | 0.790 | medium |
| Insurance Claims and Policy Processing Clerks | 0.455 | 0.632 | 0.178 | 0.640 | low |
| Graphic Designers | 0.381 | 0.206 | 0.175 | 0.740 | low |
| Architectural and Engineering Managers | 0.301 | 0.131 | 0.170 | 0.620 | low |
| Lawyers | 0.265 | 0.103 | 0.162 | 0.590 | low |
| Public Relations Specialists | 0.345 | 0.184 | 0.161 | 0.780 | low |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Management Analysts | 0.521 | 0.639 | 0.119 | 0.853 | ok |
| Information Security Analysts | 0.675 | 0.761 | 0.086 | 0.823 | ok |
| Computer and Information Systems Managers | 0.509 | 0.592 | 0.083 | 0.844 | ok |
| Computer Network Architects | 0.546 | 0.628 | 0.082 | 0.861 | ok |
| Writers and Authors | 0.505 | 0.584 | 0.079 | 0.885 | ok |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.427 | 0.504 | 0.077 | 0.839 | ok |
| Office Clerks, General | 0.470 | 0.400 | 0.070 | 0.790 | ok |
| Personal Financial Advisors | 0.392 | 0.461 | 0.069 | 0.873 | ok |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 1.000 | 0.451 | 0.549 | 0.790 | high |
| Customer Service Representatives | 1.000 | 0.453 | 0.547 | 0.848 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 1.000 | 0.510 | 0.490 | 0.849 | high |
| Loan Interviewers and Clerks | 1.000 | 0.541 | 0.459 | 0.868 | high |
| Insurance Claims and Policy Processing Clerks | 1.000 | 0.545 | 0.455 | 0.865 | high |
| Network and Computer Systems Administrators | 1.000 | 0.550 | 0.450 | 0.845 | high |
| Management Analysts | 0.250 | 0.673 | 0.423 | 0.853 | high |
| Technical Writers | 1.000 | 0.591 | 0.409 | 0.844 | high |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Insurance Claims and Policy Processing Clerks | 0.506 | 0.289 | 0.216 | 0.640 | medium |
| Software Developers | 0.554 | 0.732 | 0.178 | 0.600 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.377 | 0.205 | 0.171 | 0.680 | low |
| Court, Municipal, and License Clerks | 0.420 | 0.265 | 0.155 | 0.700 | low |
| Receptionists and Information Clerks | 0.407 | 0.259 | 0.148 | 0.640 | low |
| Graphic Designers | 0.519 | 0.658 | 0.140 | 0.740 | low |
| Operations Research Analysts | 0.612 | 0.746 | 0.134 | 0.600 | low |
| Marketing Managers | 0.614 | 0.742 | 0.127 | 0.640 | low |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.654 | 0.365 | 0.289 | 0.796 | high |
| Customer Service Representatives | 0.485 | 0.361 | 0.124 | 0.831 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.518 | 0.394 | 0.124 | 0.855 | low |
| Loan Interviewers and Clerks | 0.412 | 0.295 | 0.117 | 0.824 | ok |
| Computer and Information Systems Managers | 0.268 | 0.378 | 0.110 | 0.834 | ok |
| Financial Managers | 0.274 | 0.374 | 0.100 | 0.866 | ok |
| Lawyers | 0.159 | 0.255 | 0.096 | 0.434 | ok |
| Receptionists and Information Clerks | 0.444 | 0.352 | 0.092 | 0.841 | ok |

### Individual AI Usage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.500 | 0.148 | 0.351 | 0.650 | medium |
| Customer Service Representatives | 0.374 | 0.701 | 0.327 | 0.650 | medium |
| News Analysts, Reporters, and Journalists | 0.534 | 0.210 | 0.324 | 0.650 | medium |
| Editors | 0.518 | 0.246 | 0.272 | 0.650 | medium |
| Electronics Engineers, Except Computer | 0.370 | 0.100 | 0.270 | 0.650 | medium |
| Management Analysts | 0.506 | 0.243 | 0.263 | 0.650 | medium |
| Paralegals and Legal Assistants | 0.534 | 0.293 | 0.241 | 0.650 | medium |
| Writers and Authors | 0.486 | 0.246 | 0.240 | 0.650 | medium |

## Interpretation

- Treat `Human Guardrail Plausibility` as the most useful current structural check.
- Treat `Adoption Context Plausibility` as the best current outer-layer check on whether the model is over- or under-stating organizational AI conversion relative to observed sector uptake.
- Treat `Recomposition Context Plausibility` as a strong current check on whether workflow compression and organizational conversion are directionally plausible. Treat `Wave Timing Plausibility` as a check on adoption acceleration alignment, not displacement timing — the model and WAC measure different phenomena for augmentation-first occupations (see Structural Measurement Limits).
- Treat `Role Heterogeneity Plausibility` as the best current check on whether the model is making an occupation look too uniform or too split.
- Treat `Individual AI Usage Plausibility` as a weak annotation layer, not a scoring target. It surfaces occupations where observed individual Claude usage diverges materially from the model's org-level adoption context. `individual_higher` gaps are the more actionable pattern: they suggest workers are using Claude more than the model's structural adoption signal implies, which may indicate the adoption-realization estimate is lagging. `org_higher` gaps are less actionable: they typically reflect organizational AI workflow rollout that is not yet translating into individual usage.
- Treat `Demand Context Plausibility` and `Wage Leverage Plausibility` as weak calibration layers that can surface suspicious outliers, not as truth labels. Both have structural measurement limits (see Structural Measurement Limits) that prevent the Spearman correlation from reaching 1.0 regardless of model accuracy.
- Occupations with repeated high-priority gaps should be reviewed at the layer that likely caused the disagreement: function anchors, accountability weights, task evidence coverage, or role-shape assumptions.

## Structural Measurement Limits

These flag patterns are architectural — they reflect genuine differences between what the model measures and what the calibration target measures. Chasing them with profile or data edits will not improve the model; it will distort it.

**Wage Leverage — manager model_LOW flags (Sales, Financial, HR, Marketing Managers)**
The model caps bargaining power around 0.55 for functional managers even when their `barg` profile values are 0.78–0.84. The bottleneck is `weightedRetainedLeverage * 0.40`, which comes from task-level retained leverage and is not accessible via `function_accountability_profiles.csv`. No profile edit can close a 0.30+ gap here. The wage leverage target is derived from wage level and dispersion, which naturally puts managers at 0.85–0.90. These flags will persist until the task-level retained_leverage component is recalibrated for functional manager clusters.

**Wage Leverage — clerical model_HIGH flags (Customer Service Reps, Billing Clerks, Statistical Assistants)**
The same `weightedRetainedLeverage * 0.40` component sets a formula floor (~0.30–0.44) for low-wage routine roles, even when all profile fields are set to near-zero. The wage leverage target for these roles is near 0 (0.016–0.121) based on low wages and narrow wage dispersion. No profile edit can bring the model output below the structural floor. Confirmed: adding near-zero Statistical Assistants profile rows left the model at 0.437. These flags will persist unless the formula weight on `weightedRetainedLeverage` is reduced.

**Wave Timing — distant-vs-next divergence (Sales Reps Services, Logisticians, Financial Analysts)**
The live model can still assign these occupations to the `distant` primary displacement wave because their task clusters retain enough function to avoid a true displacement read even while AI adoption is clearly entering the workflow. The `wave_acceleration_context` calibration target reflects AI *adoption* speed, not strict displacement timing. The calibration script now partially corrects for this by using a hybrid timing proxy: real structural transitions still map from `primary_displacement_wave`, but augmentation-first roles can also score earlier through assist/delegate trigger readiness plus recomposition pressure. Residual gaps here are more likely to mean “adoption is moving faster than displacement” than “the runtime wave label is wrong.”

**Demand Context — adaptation floor on declining occupations**
The `demandExpansionSignal` formula includes adaptation terms (`adaptiveCapacity`, `transferability`, `learningIntensity`) that add approximately 0.25 to the output regardless of BLS labor market projections. For occupations with strong BLS decline signals, set `demand_floor_suppression` (0–1) in `occupation_demand_adoption_context.csv` to scale down the adaptation weight and align the signal with the BLS labor context. A value of 0.20 reduces adaptation terms by 80%, which resolves most high-gap cases without distorting the model for normal occupations. Remaining medium gaps on this check (News Analysts, Logisticians model_LOW, Statistical Assistants model_HIGH) reflect rank ordering differences rather than formula errors.

**Adoption Realization — forward-looking vs observed state (10–11 flags)**
The model forward-looks on automation pressure; BTOS measures current observed organizational AI adoption. The model anticipates adoption that has not yet been recorded at the sector level. Gaps here mean the model is ahead of measured reality, which is the intended behavior for a forward-looking displacement estimate. These flags are not errors. Review them only if the gap is unusually large or if occupation-level BTOS data suggests a systematic directional mistake in the adoption estimate.

**Individual AI Usage — org adoption vs worker behavior**
The model computes an org-level adoption context from BTOS organizational AI use data. The Individual AI Usage check compares this against observed individual Claude usage fractions from AEI survey data. These measure different phenomena: an org can have low official AI adoption while workers use Claude individually, and vice versa. `individual_higher` gaps may signal workers are adapting faster than org-level policy reflects. `org_higher` gaps may reflect enterprise rollouts not yet visible in individual worker behavior. Neither pattern is a model error in isolation.

## Next Data Upgrades

- Extend ORS coverage or mapping so fewer launch occupations remain unscored on the strongest human-guardrail check.
- Use the new BTOS review queue to decide whether adoption-realization tuning should remain calibration-only or graduate into a later controlled runtime parameter review.
- Refresh `O*NET` after the current official calibration layers are stable, so structural tuning is not confounded with a database-version jump.
- Consider whether the ACS heterogeneity layer is strong enough to justify future multi-variant occupation modeling rather than one default role shape per occupation.
- Review high-priority `individual_higher` cases from the Individual AI Usage check as candidates for adoption-realization tuning. Do not replace `ai_adoption_context` with the individual usage signal — they measure different phenomena.
- Once the current calibration layers are stable, check whether a later AEI release provides more complete occupation-level individual usage coverage than the current 34-occupation subset.

