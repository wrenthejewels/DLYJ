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
- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.
- this report is for calibration and review, not runtime scoring.

## Summary

- occupations evaluated: `63`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`

## Check Strengths

### Human Guardrail Plausibility
- strength: `strong`
- coverage: `44/63`
- spearman correlation: `0.835`
- high-priority mismatches: `3`
- medium-priority mismatches: `12`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `62/63`
- spearman correlation: `0.935`
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
- spearman correlation: `0.832`
- high-priority mismatches: `16`
- medium-priority mismatches: `2`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.633`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.952`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer, with a light calibration-only damp for review-flagged org-higher individual-usage overhang cases.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.473`
- high-priority mismatches: `3`
- medium-priority mismatches: `0`
- description: Compares a hybrid modeled timing proxy to the derived occupation-level wave-acceleration context. The proxy uses primary displacement wave for real structural transitions and forward trigger/recomposition readiness for augmentation-first roles, and the target is lightly tempered in review-flagged org-higher individual-usage overhang cases.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.551`
- high-priority mismatches: `0`
- medium-priority mismatches: `3`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.218`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

### Individual AI Usage Plausibility
- strength: `weak`
- coverage: `31/63`
- spearman correlation: `0.308`
- high-priority mismatches: `0`
- medium-priority mismatches: `12`
- description: Compares the model's org-level adoption context (BTOS-derived organizational conversion plus adoption pressure) against observed individual-level Claude usage fractions from the AEI labor market follow-up. These measure different things: org adoption versus worker behavior. Large gaps — especially where individual usage exceeds org adoption — may signal that workers in that role are adapting faster than the org-level signal captures, and deserve closer adoption-realization review.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap | Individual usage gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Customer Service Representatives | high | individual_ai_usage | weak | 0.016 (ok) | 0.095 (ok) | 0.100 (ok) | 0.258 (high) | 0.027 (ok) | 0.021 (ok) | 0.176 (low) | 0.121 (low) | 0.158 (low) | 0.340 (medium) |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | high | accountability_guardrails | strong | 0.209 (medium) | 0.038 (ok) | 0.112 (ok) | 0.095 (ok) | 0.023 (ok) | 0.000 (ok) | 0.316 (high) | 0.073 (ok) | 0.029 (ok) | n/a (ok) |
| Insurance Claims and Policy Processing Clerks | high | specialization_resilience | medium | n/a (ok) | 0.051 (ok) | 0.086 (ok) | 0.314 (high) | 0.194 (medium) | 0.075 (ok) | 0.128 (low) | 0.202 (medium) | 0.067 (ok) | n/a (ok) |
| Cost Estimators | high | accountability_guardrails | strong | 0.250 (high) | 0.063 (ok) | 0.157 (low) | 0.059 (ok) | 0.068 (ok) | 0.009 (ok) | 0.311 (high) | 0.076 (ok) | 0.073 (ok) | n/a (ok) |
| Court, Municipal, and License Clerks | high | accountability_guardrails | strong | 0.300 (high) | 0.032 (ok) | 0.020 (ok) | 0.289 (high) | 0.120 (low) | 0.120 (ok) | 0.014 (ok) | 0.098 (ok) | 0.059 (ok) | n/a (ok) |
| Computer User Support Specialists | high | accountability_guardrails | strong | 0.229 (high) | 0.002 (ok) | 0.181 (medium) | 0.287 (high) | 0.048 (ok) | 0.145 (low) | 0.093 (ok) | 0.024 (ok) | 0.008 (ok) | n/a (ok) |
| Marketing Managers | high | recomposition_and_timing | medium | 0.118 (ok) | 0.031 (ok) | 0.003 (ok) | 0.283 (high) | 0.075 (ok) | 0.113 (ok) | 0.020 (ok) | 0.046 (ok) | 0.041 (ok) | n/a (ok) |
| News Analysts, Reporters, and Journalists | high | bargaining_power | weak | n/a (ok) | 0.027 (ok) | 0.202 (medium) | 0.237 (high) | 0.079 (ok) | 0.105 (ok) | 0.004 (ok) | 0.029 (ok) | 0.067 (ok) | 0.277 (medium) |
| Receptionists and Information Clerks | high | task_pressure | medium | 0.115 (ok) | 0.098 (ok) | 0.006 (ok) | 0.276 (high) | 0.155 (low) | 0.035 (ok) | 0.128 (low) | 0.135 (low) | 0.105 (ok) | n/a (ok) |
| Billing and Posting Clerks | high | bargaining_power | weak | 0.058 (ok) | 0.080 (ok) | 0.099 (ok) | 0.272 (high) | 0.016 (ok) | 0.048 (ok) | 0.145 (low) | 0.062 (ok) | 0.052 (ok) | n/a (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| accountability_guardrails | 26 |
| recomposition_and_timing | 15 |
| bargaining_power | 5 |
| task_pressure | 3 |
| specialization_resilience | 2 |
| demand_and_adoption | 2 |
| role_shape_heterogeneity | 2 |
| individual_ai_usage | 1 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Customer Service Representatives | individual_ai_usage | weak | high | Individual AI usage mismatch points to a gap between observed worker-level Claude adoption and the model's org-level adoption context. Large individual_higher gaps may indicate workers adapting faster than the org-adoption signal captures. |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Insurance Claims and Policy Processing Clerks | specialization_resilience | medium | high | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Cost Estimators | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Court, Municipal, and License Clerks | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Computer User Support Specialists | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Marketing Managers | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| News Analysts, Reporters, and Journalists | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Receptionists and Information Clerks | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Billing and Posting Clerks | bargaining_power | weak | high | Wage-leverage mismatch is visible, but this case overlaps a known weak measurement surface: the wage proxy is outrunning the model's structural bargaining floor/ceiling rather than pointing cleanly to a fixable runtime error. |
| Financial Managers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Statistical Assistants | task_pressure | medium | high | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Statistical Assistants | task_pressure | 0.155 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Management Analysts | recomposition_and_timing | 0.143 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Office Clerks, General | role_shape_heterogeneity | 0.141 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Computer and Information Systems Managers | recomposition_and_timing | 0.135 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Writers and Authors | recomposition_and_timing | 0.129 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Software Developers | recomposition_and_timing | 0.126 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Civil Engineers | recomposition_and_timing | 0.122 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Insurance Claims and Policy Processing Clerks | specialization_resilience | 0.117 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |
| Information Security Analysts | recomposition_and_timing | 0.115 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| First-Line Supervisors of Office and Administrative Support Workers | specialization_resilience | 0.114 | Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Court, Municipal, and License Clerks | 0.570 | 0.270 | 0.300 | 0.806 | high |
| Cost Estimators | 0.554 | 0.304 | 0.250 | 0.721 | high |
| Computer User Support Specialists | 0.556 | 0.327 | 0.229 | 0.806 | high |
| Sales Managers | 0.675 | 0.895 | 0.220 | 0.721 | medium |
| Network and Computer Systems Administrators | 0.586 | 0.367 | 0.219 | 0.721 | medium |
| Lawyers | 0.786 | 0.571 | 0.215 | 0.763 | medium |
| General and Operations Managers | 0.684 | 0.893 | 0.209 | 0.763 | medium |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | 0.649 | 0.858 | 0.209 | 0.678 | medium |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Bookkeeping, Accounting, and Auditing Clerks | 0.400 | 0.299 | 0.101 | 0.864 | ok |
| Receptionists and Information Clerks | 0.371 | 0.273 | 0.098 | 0.881 | ok |
| Customer Service Representatives | 0.361 | 0.266 | 0.095 | 0.872 | ok |
| Office Clerks, General | 0.372 | 0.277 | 0.095 | 0.822 | ok |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.377 | 0.284 | 0.093 | 0.850 | ok |
| Billing and Posting Clerks | 0.386 | 0.306 | 0.080 | 0.877 | ok |
| Purchasing Agents, Except Wholesale, Retail, and Farm Products | 0.328 | 0.255 | 0.073 | 0.833 | ok |
| Statistical Assistants | 0.471 | 0.401 | 0.070 | 0.842 | ok |

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
| Insurance Claims and Policy Processing Clerks | 0.407 | 0.093 | 0.314 | 0.850 | high |
| Court, Municipal, and License Clerks | 0.394 | 0.105 | 0.289 | 0.850 | high |
| Computer User Support Specialists | 0.501 | 0.214 | 0.287 | 0.850 | high |
| Marketing Managers | 0.604 | 0.887 | 0.283 | 0.850 | high |
| Receptionists and Information Clerks | 0.276 | 0.000 | 0.276 | 0.850 | high |
| Billing and Posting Clerks | 0.328 | 0.056 | 0.272 | 0.850 | high |
| Financial Managers | 0.618 | 0.887 | 0.269 | 0.850 | high |
| Statistical Assistants | 0.387 | 0.121 | 0.266 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Statistical Assistants | 0.488 | 0.221 | 0.267 | 0.580 | medium |
| Executive Secretaries and Executive Administrative Assistants | 0.420 | 0.615 | 0.194 | 0.600 | medium |
| Insurance Claims and Policy Processing Clerks | 0.431 | 0.625 | 0.194 | 0.580 | medium |
| Transportation, Storage, and Distribution Managers | 0.318 | 0.502 | 0.184 | 0.480 | low |
| Information Security Analysts | 0.452 | 0.270 | 0.182 | 0.520 | medium |
| Property, Real Estate, and Community Association Managers | 0.344 | 0.506 | 0.161 | 0.610 | low |
| First-Line Supervisors of Office and Administrative Support Workers | 0.459 | 0.615 | 0.156 | 0.580 | low |
| Purchasing Agents, Except Wholesale, Retail, and Farm Products | 0.349 | 0.504 | 0.155 | 0.560 | low |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Computer Network Architects | 0.484 | 0.656 | 0.172 | 0.853 | low |
| Management Analysts | 0.480 | 0.646 | 0.167 | 0.855 | low |
| Software Quality Assurance Analysts and Testers | 0.480 | 0.641 | 0.161 | 0.836 | low |
| Computer and Information Systems Managers | 0.452 | 0.610 | 0.158 | 0.854 | low |
| Writers and Authors | 0.462 | 0.613 | 0.152 | 0.847 | low |
| Software Developers | 0.493 | 0.644 | 0.150 | 0.841 | low |
| Graphic Designers | 0.474 | 0.622 | 0.148 | 0.862 | low |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.426 | 0.574 | 0.148 | 0.813 | low |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | 0.600 | 0.284 | 0.316 | 0.843 | high |
| Cost Estimators | 0.600 | 0.289 | 0.311 | 0.833 | high |
| Transportation, Storage, and Distribution Managers | 0.600 | 0.374 | 0.226 | 0.814 | high |
| Customer Service Representatives | 0.600 | 0.424 | 0.176 | 0.838 | low |
| Purchasing Agents, Except Wholesale, Retail, and Farm Products | 0.600 | 0.432 | 0.168 | 0.809 | low |
| Network and Computer Systems Administrators | 0.616 | 0.449 | 0.167 | 0.829 | low |
| Claims Adjusters, Examiners, and Investigators | 0.600 | 0.437 | 0.163 | 0.822 | low |
| Office Clerks, General | 0.600 | 0.441 | 0.159 | 0.790 | low |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Statistical Assistants | 0.420 | 0.648 | 0.228 | 0.580 | medium |
| Insurance Claims and Policy Processing Clerks | 0.507 | 0.304 | 0.202 | 0.580 | medium |
| First-Line Supervisors of Office and Administrative Support Workers | 0.530 | 0.334 | 0.196 | 0.580 | medium |
| Compliance Officers | 0.624 | 0.447 | 0.177 | 0.630 | low |
| Claims Adjusters, Examiners, and Investigators | 0.593 | 0.434 | 0.159 | 0.520 | low |
| Human Resources Managers | 0.651 | 0.508 | 0.143 | 0.600 | low |
| Operations Research Analysts | 0.616 | 0.755 | 0.139 | 0.470 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.475 | 0.336 | 0.139 | 0.600 | low |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.537 | 0.360 | 0.177 | 0.796 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.519 | 0.349 | 0.170 | 0.806 | low |
| Customer Service Representatives | 0.511 | 0.353 | 0.158 | 0.813 | low |
| Receptionists and Information Clerks | 0.455 | 0.350 | 0.105 | 0.855 | ok |
| Personal Financial Advisors | 0.258 | 0.359 | 0.101 | 0.813 | ok |
| Paralegals and Legal Assistants | 0.370 | 0.275 | 0.095 | 0.796 | ok |
| Loan Interviewers and Clerks | 0.418 | 0.323 | 0.095 | 0.789 | ok |
| Lawyers | 0.185 | 0.277 | 0.092 | 0.416 | ok |

### Individual AI Usage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer Service Representatives | 0.361 | 0.701 | 0.340 | 0.650 | medium |
| Advertising Sales Agents | 0.461 | 0.148 | 0.312 | 0.650 | medium |
| News Analysts, Reporters, and Journalists | 0.487 | 0.210 | 0.277 | 0.650 | medium |
| Electronics Engineers, Except Computer | 0.364 | 0.100 | 0.264 | 0.650 | medium |
| Editors | 0.486 | 0.246 | 0.240 | 0.650 | medium |
| Management Analysts | 0.476 | 0.243 | 0.233 | 0.650 | medium |
| Compliance Officers | 0.352 | 0.121 | 0.231 | 0.650 | medium |
| Mechanical Engineers | 0.301 | 0.081 | 0.220 | 0.650 | medium |

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

