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

- occupations evaluated: `63`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`
- explicit external coverage exceptions: `1`

## Check Strengths

### Human Guardrail Plausibility
- strength: `strong`
- coverage: `44/63`
- spearman correlation: `0.887`
- high-priority mismatches: `0`
- medium-priority mismatches: `9`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `62/63`
- spearman correlation: `0.941`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares organizational conversion and default adoption pressure to a BTOS adoption-context signal joined from sector-level AI-use estimates through ACS-derived occupation sector mix, then rescaled into the model’s adoption-realization range.

### Demand Context Plausibility
- strength: `weak`
- coverage: `63/63`
- spearman correlation: `0.818`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares demand-expansion signals to labor-market context, not to direct AI displacement.

### Wage Leverage Plausibility
- strength: `weak`
- coverage: `63/63`
- spearman correlation: `0.830`
- high-priority mismatches: `16`
- medium-priority mismatches: `3`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.579`
- high-priority mismatches: `0`
- medium-priority mismatches: `2`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.939`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer, with a light calibration-only damp for review-flagged org-higher individual-usage overhang cases.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.491`
- high-priority mismatches: `39`
- medium-priority mismatches: `7`
- description: Compares a hybrid modeled timing proxy to the derived occupation-level wave-acceleration context. The proxy uses primary displacement wave for real structural transitions and forward trigger/recomposition readiness for augmentation-first roles, and the target is lightly tempered in review-flagged org-higher individual-usage overhang cases.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.547`
- high-priority mismatches: `0`
- medium-priority mismatches: `3`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.225`
- high-priority mismatches: `1`
- medium-priority mismatches: `0`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

### Individual AI Usage Plausibility
- strength: `weak`
- coverage: `31/63`
- spearman correlation: `0.303`
- high-priority mismatches: `0`
- medium-priority mismatches: `13`
- description: Compares the model's org-level adoption context (BTOS-derived organizational conversion plus adoption pressure) against observed individual-level Claude usage fractions from the AEI labor market follow-up. These measure different things: org adoption versus worker behavior. Large gaps — especially where individual usage exceeds org adoption — may signal that workers in that role are adapting faster than the org-level signal captures, and deserve closer adoption-realization review.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap | Individual usage gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Customer Service Representatives | high | role_shape_heterogeneity | medium | 0.015 (ok) | 0.111 (ok) | 0.100 (ok) | 0.257 (high) | 0.004 (ok) | 0.046 (ok) | 0.533 (high) | 0.121 (low) | 0.158 (low) | 0.324 (medium) |
| Bookkeeping, Accounting, and Auditing Clerks | high | task_pressure | medium | 0.006 (ok) | 0.116 (ok) | 0.158 (low) | 0.167 (low) | 0.170 (low) | 0.046 (ok) | 0.514 (high) | 0.064 (ok) | 0.037 (ok) | 0.105 (ok) |
| Office Clerks, General | high | role_shape_heterogeneity | medium | 0.089 (ok) | 0.118 (ok) | 0.103 (ok) | 0.041 (ok) | 0.050 (ok) | 0.069 (ok) | 0.503 (high) | 0.044 (ok) | 0.316 (high) | 0.056 (ok) |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | high | accountability_guardrails | strong | 0.172 (low) | 0.115 (ok) | 0.030 (ok) | 0.144 (low) | 0.020 (ok) | 0.030 (ok) | 0.476 (high) | 0.111 (ok) | 0.171 (low) | 0.054 (ok) |
| Insurance Claims and Policy Processing Clerks | high | specialization_resilience | medium | n/a (ok) | 0.069 (ok) | 0.086 (ok) | 0.313 (high) | 0.172 (low) | 0.009 (ok) | 0.464 (high) | 0.202 (medium) | 0.067 (ok) | n/a (ok) |
| Network and Computer Systems Administrators | high | accountability_guardrails | strong | 0.161 (low) | 0.040 (ok) | 0.006 (ok) | 0.054 (ok) | 0.142 (low) | 0.009 (ok) | 0.456 (high) | 0.068 (ok) | 0.015 (ok) | n/a (ok) |
| Loan Interviewers and Clerks | high | accountability_guardrails | strong | 0.161 (low) | 0.064 (ok) | 0.127 (low) | 0.247 (high) | 0.033 (ok) | 0.003 (ok) | 0.455 (high) | 0.016 (ok) | 0.096 (ok) | n/a (ok) |
| Technical Writers | high | demand_and_adoption | weak | n/a (ok) | 0.064 (ok) | 0.136 (low) | 0.070 (ok) | 0.117 (ok) | 0.018 (ok) | 0.444 (high) | 0.051 (ok) | 0.049 (ok) | 0.031 (ok) |
| Management Analysts | high | recomposition_and_timing | medium | 0.073 (ok) | 0.070 (ok) | 0.050 (ok) | 0.012 (ok) | 0.070 (ok) | 0.097 (ok) | 0.437 (high) | 0.007 (ok) | 0.052 (ok) | 0.268 (medium) |
| Computer and Information Systems Managers | high | accountability_guardrails | strong | 0.165 (low) | 0.057 (ok) | 0.097 (ok) | 0.155 (low) | 0.086 (ok) | 0.086 (ok) | 0.396 (high) | 0.016 (ok) | 0.077 (ok) | n/a (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| accountability_guardrails | 31 |
| role_shape_heterogeneity | 5 |
| task_pressure | 5 |
| bargaining_power | 5 |
| adoption_realization | 4 |
| demand_and_adoption | 3 |
| specialization_resilience | 2 |
| recomposition_and_timing | 1 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Customer Service Representatives | role_shape_heterogeneity | medium | high | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Bookkeeping, Accounting, and Auditing Clerks | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Office Clerks, General | role_shape_heterogeneity | medium | high | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Insurance Claims and Policy Processing Clerks | specialization_resilience | medium | high | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Network and Computer Systems Administrators | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Loan Interviewers and Clerks | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Technical Writers | demand_and_adoption | weak | high | Demand-context mismatch points to demand-expansion or adoption-realization assumptions rather than core task reachability. |
| Management Analysts | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Computer and Information Systems Managers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Data Scientists | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Office Clerks, General | role_shape_heterogeneity | 0.252 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Statistical Assistants | task_pressure | 0.171 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Customer Service Representatives | role_shape_heterogeneity | 0.128 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Insurance Claims and Policy Processing Clerks | specialization_resilience | 0.117 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| First-Line Supervisors of Office and Administrative Support Workers | specialization_resilience | 0.114 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Information Security Analysts | task_pressure | 0.108 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Bookkeeping, Accounting, and Auditing Clerks | task_pressure | 0.107 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Management Analysts | recomposition_and_timing | 0.083 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Personal Financial Advisors | role_shape_heterogeneity | 0.082 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Billing and Posting Clerks | adoption_realization | 0.082 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Lawyers | 0.785 | 0.571 | 0.214 | 0.763 | medium |
| General and Operations Managers | 0.685 | 0.893 | 0.208 | 0.763 | medium |
| Court, Municipal, and License Clerks | 0.468 | 0.270 | 0.198 | 0.806 | medium |
| Transportation, Storage, and Distribution Managers | 0.631 | 0.828 | 0.197 | 0.678 | medium |
| Mechanical Engineers | 0.556 | 0.359 | 0.197 | 0.636 | medium |
| Computer Systems Analysts | 0.521 | 0.328 | 0.193 | 0.721 | medium |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | 0.673 | 0.858 | 0.185 | 0.678 | medium |
| Financial and Investment Analysts | 0.565 | 0.381 | 0.184 | 0.678 | medium |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.395 | 0.277 | 0.118 | 0.822 | ok |
| Bookkeeping, Accounting, and Auditing Clerks | 0.415 | 0.299 | 0.116 | 0.864 | ok |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.399 | 0.284 | 0.115 | 0.850 | ok |
| Customer Service Representatives | 0.377 | 0.266 | 0.111 | 0.872 | ok |
| Receptionists and Information Clerks | 0.380 | 0.273 | 0.107 | 0.881 | ok |
| Statistical Assistants | 0.504 | 0.401 | 0.103 | 0.842 | ok |
| Billing and Posting Clerks | 0.400 | 0.306 | 0.094 | 0.877 | ok |
| Market Research Analysts and Marketing Specialists | 0.485 | 0.398 | 0.088 | 0.886 | ok |

### Demand Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| News Analysts, Reporters, and Journalists | 0.528 | 0.326 | 0.202 | 0.850 | medium |
| Logisticians | 0.637 | 0.837 | 0.200 | 0.850 | medium |
| Statistical Assistants | 0.617 | 0.427 | 0.190 | 0.850 | medium |
| Computer User Support Specialists | 0.360 | 0.179 | 0.181 | 0.850 | medium |
| Claims Adjusters, Examiners, and Investigators | 0.348 | 0.181 | 0.167 | 0.850 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.508 | 0.350 | 0.158 | 0.850 | low |
| Cost Estimators | 0.376 | 0.219 | 0.157 | 0.850 | low |
| Technical Writers | 0.480 | 0.344 | 0.136 | 0.850 | low |

### Wage Leverage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Insurance Claims and Policy Processing Clerks | 0.406 | 0.093 | 0.313 | 0.850 | high |
| Marketing Managers | 0.605 | 0.887 | 0.282 | 0.850 | high |
| Receptionists and Information Clerks | 0.275 | 0.000 | 0.275 | 0.850 | high |
| Billing and Posting Clerks | 0.327 | 0.056 | 0.271 | 0.850 | high |
| Statistical Assistants | 0.386 | 0.121 | 0.265 | 0.850 | high |
| Human Resources Managers | 0.597 | 0.855 | 0.258 | 0.850 | high |
| Customer Service Representatives | 0.273 | 0.016 | 0.257 | 0.850 | high |
| Computer User Support Specialists | 0.464 | 0.214 | 0.250 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Statistical Assistants | 0.515 | 0.221 | 0.295 | 0.580 | medium |
| Information Security Analysts | 0.477 | 0.270 | 0.207 | 0.520 | medium |
| Transportation, Storage, and Distribution Managers | 0.324 | 0.502 | 0.178 | 0.480 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.438 | 0.615 | 0.177 | 0.600 | low |
| Insurance Claims and Policy Processing Clerks | 0.453 | 0.625 | 0.172 | 0.580 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.632 | 0.462 | 0.170 | 0.630 | low |
| Court, Municipal, and License Clerks | 0.590 | 0.422 | 0.168 | 0.590 | low |
| Operations Research Analysts | 0.316 | 0.153 | 0.163 | 0.470 | low |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Management Analysts | 0.549 | 0.646 | 0.097 | 0.855 | ok |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.482 | 0.574 | 0.092 | 0.813 | ok |
| Personal Financial Advisors | 0.468 | 0.557 | 0.089 | 0.849 | ok |
| Computer Network Architects | 0.567 | 0.656 | 0.088 | 0.853 | ok |
| Computer and Information Systems Managers | 0.524 | 0.610 | 0.086 | 0.854 | ok |
| Property, Real Estate, and Community Association Managers | 0.471 | 0.554 | 0.084 | 0.858 | ok |
| Operations Research Analysts | 0.415 | 0.492 | 0.077 | 0.687 | ok |
| Writers and Authors | 0.537 | 0.613 | 0.076 | 0.847 | ok |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer Service Representatives | 1.000 | 0.467 | 0.533 | 0.838 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 1.000 | 0.486 | 0.514 | 0.847 | high |
| Office Clerks, General | 1.000 | 0.497 | 0.503 | 0.790 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 1.000 | 0.524 | 0.476 | 0.818 | high |
| Insurance Claims and Policy Processing Clerks | 1.000 | 0.536 | 0.464 | 0.853 | high |
| Network and Computer Systems Administrators | 1.000 | 0.544 | 0.456 | 0.829 | high |
| Loan Interviewers and Clerks | 1.000 | 0.545 | 0.455 | 0.848 | high |
| Technical Writers | 1.000 | 0.556 | 0.444 | 0.842 | high |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Statistical Assistants | 0.420 | 0.648 | 0.228 | 0.580 | medium |
| Insurance Claims and Policy Processing Clerks | 0.506 | 0.304 | 0.202 | 0.580 | medium |
| First-Line Supervisors of Office and Administrative Support Workers | 0.531 | 0.334 | 0.196 | 0.580 | medium |
| Compliance Officers | 0.624 | 0.447 | 0.177 | 0.630 | low |
| Claims Adjusters, Examiners, and Investigators | 0.593 | 0.434 | 0.159 | 0.520 | low |
| Human Resources Managers | 0.651 | 0.508 | 0.143 | 0.600 | low |
| Operations Research Analysts | 0.615 | 0.755 | 0.140 | 0.470 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.475 | 0.336 | 0.139 | 0.600 | low |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.676 | 0.360 | 0.316 | 0.796 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.520 | 0.349 | 0.171 | 0.806 | low |
| Customer Service Representatives | 0.511 | 0.353 | 0.158 | 0.813 | low |
| Receptionists and Information Clerks | 0.456 | 0.350 | 0.106 | 0.855 | ok |
| Personal Financial Advisors | 0.258 | 0.359 | 0.101 | 0.813 | ok |
| Financial Managers | 0.280 | 0.379 | 0.099 | 0.841 | ok |
| Paralegals and Legal Assistants | 0.371 | 0.275 | 0.096 | 0.796 | ok |
| Loan Interviewers and Clerks | 0.419 | 0.323 | 0.096 | 0.789 | ok |

### Individual AI Usage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.498 | 0.148 | 0.349 | 0.650 | medium |
| Customer Service Representatives | 0.377 | 0.701 | 0.324 | 0.650 | medium |
| News Analysts, Reporters, and Journalists | 0.528 | 0.210 | 0.318 | 0.650 | medium |
| Editors | 0.526 | 0.246 | 0.280 | 0.650 | medium |
| Electronics Engineers, Except Computer | 0.379 | 0.100 | 0.279 | 0.650 | medium |
| Management Analysts | 0.511 | 0.243 | 0.268 | 0.650 | medium |
| Writers and Authors | 0.494 | 0.246 | 0.248 | 0.650 | medium |
| Compliance Officers | 0.363 | 0.121 | 0.242 | 0.650 | medium |

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

