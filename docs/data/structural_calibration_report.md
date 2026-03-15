# Structural Calibration Report

This report is the first empirical calibration scaffold for the live model.

It does not validate AI-driven job loss directly.
It checks whether the model’s structural claims line up directionally with the best local non-runtime context currently present in the repo.

Generated from:
- `data/normalized/occupation_ors_structural_context.csv`
- `data/normalized/occupation_heterogeneity_context.csv`
- `data/normalized/industry_ai_adoption_context.csv`
- `data/normalized/occupation_btos_sector_mix.csv`
- `data/normalized/occupation_quality_indicators.csv`
- `data/normalized/occupation_labor_market_context.csv`
- `data/normalized/occupation_adaptation_priors.csv`
- live outputs from `v2_engine.js`

Current limitations:
- `occupation_ors_structural_context.csv` is now the main structural input for the human-guardrail check, using the normalized ORS structural index.
- occupations without usable ORS structural rows are currently left unscored for that strongest check instead of being silently folded back into a weaker proxy.
- `occupation_heterogeneity_context.csv` is calibration-only context. It is useful for checking whether the model is overstating role uniformity, but it is still an external structural proxy rather than a runtime role-definition input.
- the heterogeneity check is not raw ACS alone; the target is scaled into a fragmentation-pressure range and conditioned on lower people-intensity so it stays closer to the model’s actual role-splitting claim.
- `industry_ai_adoption_context.csv` is also calibration-only context. It measures observed sector AI use and deployment change, not direct task automability.
- the BTOS adoption check is not compared on raw business-use percentages; the BTOS signal is mapped into the model’s organizational-conversion range so it behaves as a directional review target rather than a literal prevalence label.
- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.
- this report is for calibration and review, not runtime scoring.

## Summary

- occupations evaluated: `34`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`

## Check Strengths

### Human Guardrail Plausibility
- strength: `strong`
- coverage: `23/34`
- spearman correlation: `0.895`
- high-priority mismatches: `1`
- medium-priority mismatches: `4`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `32/34`
- spearman correlation: `0.124`
- high-priority mismatches: `0`
- medium-priority mismatches: `1`
- description: Compares organizational conversion and default adoption pressure to a BTOS adoption-context signal joined from sector-level AI-use estimates through ACS-derived occupation sector mix, then rescaled into the model’s adoption-realization range.

### Demand Context Plausibility
- strength: `weak`
- coverage: `34/34`
- spearman correlation: `0.861`
- high-priority mismatches: `2`
- medium-priority mismatches: `3`
- description: Compares demand-expansion signals to labor-market context, not to direct AI displacement.

### Wage Leverage Plausibility
- strength: `weak`
- coverage: `34/34`
- spearman correlation: `0.740`
- high-priority mismatches: `9`
- medium-priority mismatches: `4`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.700`
- high-priority mismatches: `0`
- medium-priority mismatches: `2`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.511`
- high-priority mismatches: `0`
- medium-priority mismatches: `2`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.363`
- high-priority mismatches: `0`
- medium-priority mismatches: `2`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Specialization gap | Heterogeneity gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Customer Service Representatives | high | bargaining_power | weak | 0.003 (ok) | 0.161 (low) | 0.088 (ok) | 0.403 (high) | 0.052 (ok) | 0.124 (low) | 0.015 (ok) |
| Statistical Assistants | high | bargaining_power | weak | n/a (ok) | 0.047 (ok) | 0.129 (low) | 0.318 (high) | 0.090 (ok) | 0.125 (low) | 0.094 (ok) |
| Advertising Sales Agents | high | demand_and_adoption | weak | n/a (ok) | 0.067 (ok) | 0.311 (high) | 0.223 (high) | 0.074 (ok) | 0.066 (ok) | 0.106 (ok) |
| Bookkeeping, Accounting, and Auditing Clerks | high | bargaining_power | weak | 0.064 (ok) | 0.169 (low) | 0.075 (ok) | 0.297 (high) | 0.152 (low) | 0.034 (ok) | 0.117 (ok) |
| Data Scientists | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.194 (medium) | 0.287 (high) | 0.170 (low) | 0.184 (medium) | 0.105 (ok) |
| Office Clerks, General | high | adoption_realization | medium | 0.159 (low) | 0.187 (medium) | 0.047 (ok) | 0.236 (high) | 0.285 (medium) | 0.139 (low) | 0.082 (ok) |
| Computer Systems Analysts | high | accountability_guardrails | strong | 0.166 (low) | 0.093 (ok) | 0.168 (low) | 0.264 (high) | 0.036 (ok) | 0.083 (ok) | 0.059 (ok) |
| Lawyers | high | accountability_guardrails | strong | 0.255 (high) | n/a (ok) | 0.041 (ok) | 0.234 (high) | 0.016 (ok) | 0.089 (ok) | 0.134 (low) |
| Logisticians | high | demand_and_adoption | weak | n/a (ok) | 0.118 (ok) | 0.254 (high) | 0.093 (ok) | 0.019 (ok) | 0.030 (ok) | 0.118 (ok) |
| Software Developers | high | accountability_guardrails | strong | 0.166 (low) | 0.034 (ok) | 0.142 (low) | 0.252 (high) | 0.155 (low) | 0.191 (medium) | 0.084 (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| accountability_guardrails | 9 |
| role_shape_heterogeneity | 8 |
| bargaining_power | 5 |
| adoption_realization | 4 |
| task_pressure | 4 |
| demand_and_adoption | 2 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Customer Service Representatives | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Statistical Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Advertising Sales Agents | demand_and_adoption | weak | high | Demand-context mismatch points to demand-expansion or adoption-realization assumptions rather than core task reachability. |
| Bookkeeping, Accounting, and Auditing Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Data Scientists | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Office Clerks, General | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Computer Systems Analysts | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Lawyers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Logisticians | demand_and_adoption | weak | high | Demand-context mismatch points to demand-expansion or adoption-realization assumptions rather than core task reachability. |
| Software Developers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | medium | medium | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| General and Operations Managers | accountability_guardrails | strong | medium | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | task_pressure | 0.162 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Editors | role_shape_heterogeneity | 0.159 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Office Clerks, General | adoption_realization | 0.154 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Accountants and Auditors | role_shape_heterogeneity | 0.148 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Management Analysts | role_shape_heterogeneity | 0.142 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Operations Research Analysts | role_shape_heterogeneity | 0.140 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| Graphic Designers | task_pressure | 0.132 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Market Research Analysts and Marketing Specialists | role_shape_heterogeneity | 0.128 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |
| News Analysts, Reporters, and Journalists | task_pressure | 0.118 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Web Developers | role_shape_heterogeneity | 0.115 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Lawyers | 0.826 | 0.571 | 0.255 | 0.763 | high |
| Mechanical Engineers | 0.561 | 0.359 | 0.202 | 0.636 | medium |
| Financial and Investment Analysts | 0.573 | 0.381 | 0.192 | 0.678 | medium |
| General and Operations Managers | 0.704 | 0.893 | 0.189 | 0.763 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.562 | 0.373 | 0.189 | 0.763 | medium |
| Computer Systems Analysts | 0.494 | 0.328 | 0.166 | 0.721 | low |
| Software Developers | 0.555 | 0.389 | 0.166 | 0.721 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.426 | 0.265 | 0.161 | 0.806 | low |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.456 | 0.268 | 0.187 | 0.822 | medium |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.447 | 0.275 | 0.172 | 0.850 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.458 | 0.290 | 0.169 | 0.864 | low |
| Mechanical Engineers | 0.408 | 0.240 | 0.168 | 0.879 | low |
| Customer Service Representatives | 0.415 | 0.254 | 0.161 | 0.872 | low |
| General and Operations Managers | 0.388 | 0.247 | 0.141 | 0.869 | low |
| Training and Development Specialists | 0.418 | 0.283 | 0.136 | 0.832 | low |
| Business Operations Specialists, All Other | 0.438 | 0.304 | 0.134 | 0.838 | low |

### Demand Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.443 | 0.132 | 0.311 | 0.850 | high |
| Logisticians | 0.564 | 0.818 | 0.254 | 0.850 | high |
| Operations Research Analysts | 0.627 | 0.823 | 0.196 | 0.850 | medium |
| Data Scientists | 0.700 | 0.894 | 0.194 | 0.850 | medium |
| Training and Development Specialists | 0.540 | 0.728 | 0.188 | 0.850 | medium |
| Mechanical Engineers | 0.504 | 0.673 | 0.169 | 0.850 | low |
| Computer Systems Analysts | 0.484 | 0.652 | 0.168 | 0.850 | low |
| Management Analysts | 0.582 | 0.737 | 0.155 | 0.850 | low |

### Wage Leverage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer Service Representatives | 0.403 | 0.000 | 0.403 | 0.850 | high |
| Statistical Assistants | 0.416 | 0.098 | 0.318 | 0.850 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.388 | 0.091 | 0.297 | 0.850 | high |
| Data Scientists | 0.592 | 0.879 | 0.287 | 0.850 | high |
| Computer Systems Analysts | 0.471 | 0.735 | 0.264 | 0.850 | high |
| Software Developers | 0.543 | 0.795 | 0.252 | 0.850 | high |
| Office Clerks, General | 0.297 | 0.061 | 0.236 | 0.850 | high |
| Lawyers | 0.743 | 0.977 | 0.234 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.417 | 0.721 | 0.305 | 0.530 | medium |
| Office Clerks, General | 0.453 | 0.738 | 0.285 | 0.510 | medium |
| Graphic Designers | 0.384 | 0.205 | 0.178 | 0.740 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.411 | 0.585 | 0.174 | 0.610 | low |
| Data Scientists | 0.389 | 0.219 | 0.170 | 0.520 | low |
| News Analysts, Reporters, and Journalists | 0.502 | 0.341 | 0.161 | 0.730 | low |
| Software Developers | 0.408 | 0.253 | 0.155 | 0.600 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.434 | 0.586 | 0.152 | 0.590 | low |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Software Developers | 0.547 | 0.738 | 0.191 | 0.600 | medium |
| Data Scientists | 0.591 | 0.775 | 0.184 | 0.520 | medium |
| Graphic Designers | 0.494 | 0.659 | 0.165 | 0.740 | low |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.563 | 0.405 | 0.158 | 0.360 | low |
| Office Clerks, General | 0.423 | 0.284 | 0.139 | 0.510 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.411 | 0.274 | 0.137 | 0.530 | low |
| Statistical Assistants | 0.461 | 0.586 | 0.125 | 0.670 | low |
| Customer Service Representatives | 0.479 | 0.354 | 0.124 | 0.590 | low |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.190 | 0.386 | 0.196 | 0.810 | medium |
| Accountants and Auditors | 0.193 | 0.380 | 0.187 | 0.792 | medium |
| Operations Research Analysts | 0.194 | 0.363 | 0.169 | 0.827 | low |
| Management Analysts | 0.179 | 0.340 | 0.161 | 0.880 | low |
| Market Research Analysts and Marketing Specialists | 0.240 | 0.392 | 0.152 | 0.845 | low |
| General and Operations Managers | 0.181 | 0.323 | 0.142 | 0.831 | low |
| Web Developers | 0.240 | 0.380 | 0.140 | 0.821 | low |
| Lawyers | 0.134 | 0.268 | 0.134 | 0.441 | low |

## Interpretation

- Treat `Human Guardrail Plausibility` as the most useful current structural check.
- Treat `Adoption Context Plausibility` as the best current outer-layer check on whether the model is over- or under-stating organizational AI conversion relative to observed sector uptake.
- Treat `Role Heterogeneity Plausibility` as the best current check on whether the model is making an occupation look too uniform or too split.
- Treat `Demand Context Plausibility` and `Wage Leverage Plausibility` as weak calibration layers that can surface suspicious outliers, not as truth labels.
- Occupations with repeated high-priority gaps should be reviewed at the layer that likely caused the disagreement: function anchors, accountability weights, task evidence coverage, or role-shape assumptions.

## Next Data Upgrades

- Extend ORS coverage or mapping so fewer launch occupations remain unscored on the strongest human-guardrail check.
- Use the new BTOS review queue to decide whether adoption-realization tuning should remain calibration-only or graduate into a later controlled runtime parameter review.
- Refresh `O*NET` after the current official calibration layers are stable, so structural tuning is not confounded with a database-version jump.
- Consider whether the ACS heterogeneity layer is strong enough to justify future multi-variant occupation modeling rather than one default role shape per occupation.

