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
- high-priority mismatches: `1`
- medium-priority mismatches: `6`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `60/61`
- spearman correlation: `0.915`
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
- spearman correlation: `0.818`
- high-priority mismatches: `13`
- medium-priority mismatches: `3`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.845`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.941`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer, with a light calibration-only damp for review-flagged org-higher individual-usage overhang cases.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.826`
- high-priority mismatches: `9`
- medium-priority mismatches: `11`
- description: Compares a hybrid modeled timing proxy to the derived occupation-level wave-acceleration context. The proxy uses primary displacement wave for real structural transitions and forward trigger/recomposition readiness for augmentation-first roles, and the target is lightly tempered in review-flagged org-higher individual-usage overhang cases.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.660`
- high-priority mismatches: `0`
- medium-priority mismatches: `1`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `61/61`
- spearman correlation: `0.407`
- high-priority mismatches: `1`
- medium-priority mismatches: `0`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

### Individual AI Usage Plausibility
- strength: `weak`
- coverage: `29/61`
- spearman correlation: `0.327`
- high-priority mismatches: `0`
- medium-priority mismatches: `12`
- description: Compares the model's org-level adoption context (BTOS-derived organizational conversion plus adoption pressure) against observed individual-level Claude usage fractions from the AEI labor market follow-up. These measure different things: org adoption versus worker behavior. Large gaps — especially where individual usage exceeds org adoption — may signal that workers in that role are adapting faster than the org-level signal captures, and deserve closer adoption-realization review.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap | Individual usage gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Advertising Sales Agents | high | bargaining_power | weak | n/a (ok) | 0.032 (ok) | 0.007 (ok) | 0.254 (high) | 0.095 (ok) | 0.035 (ok) | 0.074 (ok) | 0.034 (ok) | 0.070 (ok) | 0.340 (medium) |
| Customer Service Representatives | high | individual_ai_usage | weak | 0.011 (ok) | 0.106 (ok) | 0.108 (ok) | 0.286 (high) | 0.056 (ok) | 0.044 (ok) | 0.287 (high) | 0.120 (ok) | 0.123 (low) | 0.328 (medium) |
| News Analysts, Reporters, and Journalists | high | bargaining_power | weak | n/a (ok) | 0.069 (ok) | 0.198 (medium) | 0.234 (high) | 0.149 (low) | 0.005 (ok) | 0.033 (ok) | 0.022 (ok) | 0.086 (ok) | 0.319 (medium) |
| Insurance Claims and Policy Processing Clerks | high | specialization_resilience | medium | n/a (ok) | 0.064 (ok) | 0.076 (ok) | 0.316 (high) | 0.144 (low) | 0.031 (ok) | 0.176 (low) | 0.225 (medium) | 0.052 (ok) | n/a (ok) |
| Office Clerks, General | high | role_shape_heterogeneity | medium | 0.097 (ok) | 0.105 (ok) | 0.142 (low) | 0.100 (ok) | 0.174 (low) | 0.069 (ok) | 0.289 (high) | 0.013 (ok) | 0.290 (high) | 0.067 (ok) |
| Receptionists and Information Clerks | high | specialization_resilience | medium | 0.112 (ok) | 0.107 (ok) | 0.002 (ok) | 0.286 (high) | 0.150 (low) | 0.011 (ok) | 0.157 (low) | 0.154 (low) | 0.087 (ok) | n/a (ok) |
| Computer User Support Specialists | high | accountability_guardrails | strong | 0.173 (low) | 0.023 (ok) | 0.193 (medium) | 0.283 (high) | 0.091 (ok) | 0.072 (ok) | 0.122 (low) | 0.035 (ok) | 0.035 (ok) | n/a (ok) |
| Insurance Sales Agents | high | bargaining_power | weak | n/a (ok) | 0.049 (ok) | 0.038 (ok) | 0.234 (high) | 0.064 (ok) | 0.071 (ok) | 0.262 (high) | 0.114 (ok) | 0.028 (ok) | n/a (ok) |
| Management Analysts | high | recomposition_and_timing | medium | 0.072 (ok) | 0.060 (ok) | 0.032 (ok) | 0.064 (ok) | 0.086 (ok) | 0.124 (low) | 0.255 (high) | 0.044 (ok) | 0.092 (ok) | 0.258 (medium) |
| Billing and Posting Clerks | high | adoption_realization | medium | 0.058 (ok) | 0.089 (ok) | 0.078 (ok) | 0.247 (high) | 0.050 (ok) | 0.007 (ok) | 0.015 (ok) | 0.002 (ok) | 0.062 (ok) | n/a (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| accountability_guardrails | 29 |
| task_pressure | 11 |
| bargaining_power | 4 |
| adoption_realization | 4 |
| specialization_resilience | 3 |
| demand_and_adoption | 3 |
| individual_ai_usage | 1 |
| role_shape_heterogeneity | 1 |
| recomposition_and_timing | 1 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Advertising Sales Agents | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Customer Service Representatives | individual_ai_usage | weak | high | Individual AI usage mismatch points to a gap between observed worker-level Claude adoption and the model's org-level adoption context. Large individual_higher gaps may indicate workers adapting faster than the org-adoption signal captures. |
| News Analysts, Reporters, and Journalists | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Insurance Claims and Policy Processing Clerks | specialization_resilience | medium | high | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Office Clerks, General | role_shape_heterogeneity | medium | high | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Receptionists and Information Clerks | specialization_resilience | medium | high | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Computer User Support Specialists | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Insurance Sales Agents | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Management Analysts | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Billing and Posting Clerks | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Loan Interviewers and Clerks | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Human Resources Managers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Office Clerks, General | role_shape_heterogeneity | 0.231 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Writers and Authors | task_pressure | 0.163 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | 0.161 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Insurance Claims and Policy Processing Clerks | specialization_resilience | 0.144 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Graphic Designers | task_pressure | 0.140 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Public Relations Specialists | task_pressure | 0.118 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Editors | task_pressure | 0.118 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Management Analysts | recomposition_and_timing | 0.106 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Bookkeeping, Accounting, and Auditing Clerks | adoption_realization | 0.105 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Statistical Assistants | adoption_realization | 0.105 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Lawyers | 0.797 | 0.571 | 0.226 | 0.763 | high |
| General and Operations Managers | 0.683 | 0.893 | 0.210 | 0.763 | medium |
| Transportation, Storage, and Distribution Managers | 0.630 | 0.828 | 0.198 | 0.678 | medium |
| Court, Municipal, and License Clerks | 0.465 | 0.270 | 0.195 | 0.806 | medium |
| Mechanical Engineers | 0.553 | 0.359 | 0.194 | 0.636 | medium |
| Computer Systems Analysts | 0.516 | 0.328 | 0.188 | 0.721 | medium |
| Financial and Investment Analysts | 0.562 | 0.381 | 0.181 | 0.678 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.552 | 0.373 | 0.179 | 0.763 | low |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.423 | 0.286 | 0.137 | 0.850 | low |
| Statistical Assistants | 0.528 | 0.403 | 0.125 | 0.842 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.422 | 0.301 | 0.122 | 0.864 | low |
| Receptionists and Information Clerks | 0.381 | 0.274 | 0.107 | 0.881 | ok |
| Customer Service Representatives | 0.373 | 0.267 | 0.106 | 0.872 | ok |
| Office Clerks, General | 0.383 | 0.278 | 0.105 | 0.822 | ok |
| Information Security Analysts | 0.520 | 0.418 | 0.102 | 0.828 | ok |
| Market Research Analysts and Marketing Specialists | 0.488 | 0.399 | 0.089 | 0.886 | ok |

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
| Insurance Claims and Policy Processing Clerks | 0.412 | 0.096 | 0.316 | 0.850 | high |
| Customer Service Representatives | 0.303 | 0.017 | 0.286 | 0.850 | high |
| Receptionists and Information Clerks | 0.286 | 0.000 | 0.286 | 0.850 | high |
| Computer User Support Specialists | 0.504 | 0.221 | 0.283 | 0.850 | high |
| Advertising Sales Agents | 0.654 | 0.400 | 0.254 | 0.850 | high |
| Billing and Posting Clerks | 0.305 | 0.058 | 0.247 | 0.850 | high |
| Loan Interviewers and Clerks | 0.348 | 0.104 | 0.244 | 0.850 | high |
| Human Resources Managers | 0.618 | 0.858 | 0.240 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.685 | 0.922 | 0.237 | 0.680 | medium |
| Writers and Authors | 0.376 | 0.170 | 0.206 | 0.790 | medium |
| Graphic Designers | 0.395 | 0.206 | 0.189 | 0.740 | medium |
| Software Developers | 0.440 | 0.253 | 0.187 | 0.600 | medium |
| Editors | 0.386 | 0.207 | 0.179 | 0.660 | low |
| Office Clerks, General | 0.712 | 0.538 | 0.174 | 0.510 | low |
| Architectural and Engineering Managers | 0.295 | 0.131 | 0.164 | 0.620 | low |
| Public Relations Specialists | 0.335 | 0.184 | 0.151 | 0.780 | low |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Management Analysts | 0.515 | 0.639 | 0.124 | 0.853 | low |
| Computer and Information Systems Managers | 0.482 | 0.592 | 0.110 | 0.844 | ok |
| Information Security Analysts | 0.667 | 0.761 | 0.094 | 0.823 | ok |
| Writers and Authors | 0.494 | 0.584 | 0.090 | 0.885 | ok |
| Computer Network Architects | 0.540 | 0.628 | 0.088 | 0.861 | ok |
| Operations Research Analysts | 0.423 | 0.508 | 0.085 | 0.713 | ok |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.421 | 0.504 | 0.083 | 0.839 | ok |
| Civil Engineers | 0.500 | 0.576 | 0.077 | 0.820 | ok |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.740 | 0.451 | 0.289 | 0.790 | high |
| Customer Service Representatives | 0.740 | 0.453 | 0.287 | 0.848 | high |
| Insurance Sales Agents | 0.283 | 0.545 | 0.262 | 0.881 | high |
| Management Analysts | 0.418 | 0.673 | 0.255 | 0.853 | high |
| Personal Financial Advisors | 0.280 | 0.518 | 0.238 | 0.873 | high |
| Property, Real Estate, and Community Association Managers | 0.274 | 0.504 | 0.230 | 0.868 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.740 | 0.510 | 0.230 | 0.849 | high |
| Executive Secretaries and Executive Administrative Assistants | 0.331 | 0.554 | 0.223 | 0.846 | high |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Insurance Claims and Policy Processing Clerks | 0.515 | 0.289 | 0.225 | 0.640 | medium |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.383 | 0.205 | 0.177 | 0.680 | low |
| Software Developers | 0.569 | 0.732 | 0.163 | 0.600 | low |
| Court, Municipal, and License Clerks | 0.421 | 0.265 | 0.157 | 0.700 | low |
| Receptionists and Information Clerks | 0.412 | 0.259 | 0.154 | 0.640 | low |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.553 | 0.412 | 0.141 | 0.520 | low |
| First-Line Supervisors of Office and Administrative Support Workers | 0.555 | 0.421 | 0.134 | 0.620 | low |
| Sales Managers | 0.675 | 0.545 | 0.130 | 0.750 | low |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.655 | 0.365 | 0.290 | 0.796 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.518 | 0.394 | 0.124 | 0.855 | low |
| Customer Service Representatives | 0.484 | 0.361 | 0.123 | 0.831 | low |
| Computer and Information Systems Managers | 0.258 | 0.378 | 0.120 | 0.834 | low |
| Loan Interviewers and Clerks | 0.406 | 0.295 | 0.111 | 0.824 | ok |
| Financial Managers | 0.265 | 0.374 | 0.109 | 0.866 | ok |
| Lawyers | 0.147 | 0.255 | 0.108 | 0.434 | ok |
| Civil Engineers | 0.246 | 0.339 | 0.093 | 0.796 | ok |

### Individual AI Usage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.488 | 0.148 | 0.340 | 0.650 | medium |
| Customer Service Representatives | 0.373 | 0.701 | 0.328 | 0.650 | medium |
| News Analysts, Reporters, and Journalists | 0.529 | 0.210 | 0.319 | 0.650 | medium |
| Editors | 0.509 | 0.246 | 0.263 | 0.650 | medium |
| Electronics Engineers, Except Computer | 0.361 | 0.100 | 0.261 | 0.650 | medium |
| Management Analysts | 0.502 | 0.243 | 0.258 | 0.650 | medium |
| Paralegals and Legal Assistants | 0.529 | 0.293 | 0.236 | 0.650 | medium |
| Writers and Authors | 0.480 | 0.246 | 0.234 | 0.650 | medium |

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

