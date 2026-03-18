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
- live outputs from `v2_engine.js`

Current limitations:
- `occupation_ors_structural_context.csv` is now the main structural input for the human-guardrail check, using the normalized ORS structural index.
- occupations without usable ORS structural rows are currently left unscored for that strongest check instead of being silently folded back into a weaker proxy.
- `occupation_heterogeneity_context.csv` is calibration-only context. It is useful for checking whether the model is overstating role uniformity, but it is still an external structural proxy rather than a runtime role-definition input.
- the heterogeneity check is not raw ACS alone; the target is scaled into a fragmentation-pressure range and conditioned on lower people-intensity so it stays closer to the model’s actual role-splitting claim.
- `industry_ai_adoption_context.csv` is also calibration-only context. It measures observed sector AI use and deployment change, not direct task automability.
- the BTOS adoption check is not compared on raw business-use percentages; the BTOS signal is mapped into the model’s organizational-conversion range so it behaves as a directional review target rather than a literal prevalence label.
- `occupation_recomposition_context.csv` is a derived outer-layer target. It is useful for checking workflow compression, organizational conversion, and timing assumptions, but it is still not direct proof of realized displacement.
- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.
- this report is for calibration and review, not runtime scoring.

## Summary

- occupations evaluated: `34`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`

## Check Strengths

### Human Guardrail Plausibility
- strength: `strong`
- coverage: `23/34`
- spearman correlation: `0.910`
- high-priority mismatches: `0`
- medium-priority mismatches: `2`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `32/34`
- spearman correlation: `0.857`
- high-priority mismatches: `0`
- medium-priority mismatches: `1`
- description: Compares organizational conversion and default adoption pressure to a BTOS adoption-context signal joined from sector-level AI-use estimates through ACS-derived occupation sector mix, then rescaled into the model’s adoption-realization range.

### Demand Context Plausibility
- strength: `weak`
- coverage: `34/34`
- spearman correlation: `0.919`
- high-priority mismatches: `1`
- medium-priority mismatches: `0`
- description: Compares demand-expansion signals to labor-market context, not to direct AI displacement.

### Wage Leverage Plausibility
- strength: `weak`
- coverage: `34/34`
- spearman correlation: `0.786`
- high-priority mismatches: `9`
- medium-priority mismatches: `4`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.693`
- high-priority mismatches: `0`
- medium-priority mismatches: `7`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.834`
- high-priority mismatches: `4`
- medium-priority mismatches: `3`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.517`
- high-priority mismatches: `5`
- medium-priority mismatches: `6`
- description: Compares the modeled primary displacement wave to the derived occupation-level wave-acceleration context.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.574`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.426`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Editors | high | recomposition_and_timing | medium | n/a (ok) | 0.080 (ok) | 0.133 (low) | 0.074 (ok) | 0.097 (ok) | 0.263 (high) | 0.421 (high) | 0.042 (ok) | 0.102 (ok) |
| Customer Service Representatives | high | bargaining_power | weak | 0.010 (ok) | 0.148 (low) | 0.154 (low) | 0.416 (high) | 0.070 (ok) | 0.017 (ok) | 0.274 (high) | 0.129 (low) | 0.076 (ok) |
| Statistical Assistants | high | bargaining_power | weak | n/a (ok) | 0.111 (ok) | 0.177 (low) | 0.360 (high) | 0.137 (low) | 0.165 (low) | 0.296 (high) | 0.110 (ok) | 0.015 (ok) |
| Bookkeeping, Accounting, and Auditing Clerks | high | bargaining_power | weak | 0.069 (ok) | 0.175 (low) | 0.150 (low) | 0.321 (high) | 0.107 (ok) | 0.099 (ok) | 0.142 (low) | 0.042 (ok) | 0.018 (ok) |
| Operations Research Analysts | high | recomposition_and_timing | medium | n/a (ok) | 0.094 (ok) | 0.113 (ok) | 0.006 (ok) | 0.158 (low) | 0.169 (low) | 0.307 (high) | 0.107 (ok) | 0.085 (ok) |
| Advertising Sales Agents | high | recomposition_and_timing | medium | n/a (ok) | 0.018 (ok) | 0.262 (high) | 0.201 (medium) | 0.130 (low) | 0.225 (high) | 0.102 (ok) | 0.058 (ok) | 0.019 (ok) |
| Paralegals and Legal Assistants | high | recomposition_and_timing | medium | 0.154 (low) | 0.115 (ok) | 0.064 (ok) | 0.185 (medium) | 0.026 (ok) | 0.261 (high) | 0.120 (low) | 0.005 (ok) | 0.099 (ok) |
| Lawyers | high | accountability_guardrails | strong | 0.217 (medium) | n/a (ok) | 0.084 (ok) | 0.257 (high) | 0.055 (ok) | 0.124 (low) | 0.152 (low) | 0.081 (ok) | 0.083 (ok) |
| Office Clerks, General | high | adoption_realization | medium | 0.157 (low) | 0.181 (medium) | 0.126 (low) | 0.257 (high) | 0.234 (medium) | 0.103 (ok) | 0.197 (medium) | 0.146 (low) | 0.023 (ok) |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | high | accountability_guardrails | strong | 0.164 (low) | 0.176 (low) | 0.043 (ok) | 0.238 (high) | 0.252 (medium) | 0.124 (low) | 0.230 (high) | 0.145 (low) | 0.040 (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| recomposition_and_timing | 10 |
| accountability_guardrails | 7 |
| adoption_realization | 7 |
| bargaining_power | 4 |
| task_pressure | 2 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Editors | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Customer Service Representatives | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Statistical Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Bookkeeping, Accounting, and Auditing Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Operations Research Analysts | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Advertising Sales Agents | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Paralegals and Legal Assistants | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Lawyers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Office Clerks, General | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Data Scientists | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Computer Systems Analysts | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Editors | recomposition_and_timing | 0.226 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Paralegals and Legal Assistants | recomposition_and_timing | 0.215 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Advertising Sales Agents | recomposition_and_timing | 0.201 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Writers and Authors | recomposition_and_timing | 0.183 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Graphic Designers | task_pressure | 0.163 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| News Analysts, Reporters, and Journalists | recomposition_and_timing | 0.155 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Software Developers | recomposition_and_timing | 0.154 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Public Relations Specialists | recomposition_and_timing | 0.152 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Office Clerks, General | adoption_realization | 0.149 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Mechanical Engineers | adoption_realization | 0.142 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Lawyers | 0.788 | 0.571 | 0.217 | 0.763 | medium |
| Mechanical Engineers | 0.549 | 0.359 | 0.190 | 0.636 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.551 | 0.373 | 0.178 | 0.763 | low |
| Financial and Investment Analysts | 0.558 | 0.381 | 0.177 | 0.678 | low |
| General and Operations Managers | 0.717 | 0.893 | 0.176 | 0.763 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.429 | 0.265 | 0.164 | 0.806 | low |
| Computer Systems Analysts | 0.488 | 0.328 | 0.160 | 0.721 | low |
| Office Clerks, General | 0.451 | 0.294 | 0.157 | 0.806 | low |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.449 | 0.268 | 0.181 | 0.822 | medium |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.451 | 0.275 | 0.176 | 0.850 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.465 | 0.290 | 0.175 | 0.864 | low |
| Mechanical Engineers | 0.401 | 0.240 | 0.161 | 0.879 | low |
| Customer Service Representatives | 0.402 | 0.254 | 0.148 | 0.872 | low |
| Training and Development Specialists | 0.430 | 0.283 | 0.147 | 0.832 | low |
| Business Operations Specialists, All Other | 0.449 | 0.304 | 0.145 | 0.838 | low |
| Technical Writers | 0.503 | 0.361 | 0.143 | 0.876 | low |

### Demand Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.394 | 0.132 | 0.262 | 0.850 | high |
| Statistical Assistants | 0.511 | 0.334 | 0.177 | 0.850 | low |
| Customer Service Representatives | 0.444 | 0.290 | 0.154 | 0.850 | low |
| News Analysts, Reporters, and Journalists | 0.563 | 0.410 | 0.153 | 0.850 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.414 | 0.264 | 0.150 | 0.850 | low |
| Logisticians | 0.684 | 0.818 | 0.134 | 0.850 | low |
| Editors | 0.646 | 0.513 | 0.133 | 0.850 | low |
| Office Clerks, General | 0.338 | 0.212 | 0.126 | 0.850 | low |

### Wage Leverage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer Service Representatives | 0.416 | 0.000 | 0.416 | 0.850 | high |
| Statistical Assistants | 0.458 | 0.098 | 0.360 | 0.850 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.412 | 0.091 | 0.321 | 0.850 | high |
| Lawyers | 0.720 | 0.977 | 0.257 | 0.850 | high |
| Office Clerks, General | 0.318 | 0.061 | 0.257 | 0.850 | high |
| Data Scientists | 0.634 | 0.879 | 0.245 | 0.850 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.314 | 0.076 | 0.238 | 0.850 | high |
| Computer Systems Analysts | 0.509 | 0.735 | 0.226 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.470 | 0.721 | 0.252 | 0.530 | medium |
| Office Clerks, General | 0.503 | 0.738 | 0.234 | 0.510 | medium |
| Graphic Designers | 0.425 | 0.205 | 0.220 | 0.740 | medium |
| Software Developers | 0.456 | 0.253 | 0.203 | 0.600 | medium |
| Data Scientists | 0.420 | 0.219 | 0.201 | 0.520 | medium |
| News Analysts, Reporters, and Journalists | 0.540 | 0.341 | 0.199 | 0.730 | medium |
| Writers and Authors | 0.364 | 0.171 | 0.193 | 0.740 | medium |
| Operations Research Analysts | 0.318 | 0.160 | 0.158 | 0.600 | low |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.397 | 0.661 | 0.263 | 0.861 | high |
| Paralegals and Legal Assistants | 0.468 | 0.729 | 0.261 | 0.825 | high |
| Management Analysts | 0.343 | 0.597 | 0.254 | 0.877 | high |
| Advertising Sales Agents | 0.341 | 0.566 | 0.225 | 0.893 | high |
| Writers and Authors | 0.372 | 0.581 | 0.209 | 0.875 | medium |
| Web Developers | 0.385 | 0.586 | 0.201 | 0.870 | medium |
| Software Developers | 0.411 | 0.592 | 0.181 | 0.851 | medium |
| Public Relations Specialists | 0.364 | 0.542 | 0.178 | 0.854 | low |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.250 | 0.671 | 0.421 | 0.861 | high |
| Operations Research Analysts | 0.250 | 0.557 | 0.307 | 0.713 | high |
| Statistical Assistants | 0.250 | 0.546 | 0.296 | 0.838 | high |
| Customer Service Representatives | 0.600 | 0.326 | 0.274 | 0.844 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.250 | 0.480 | 0.230 | 0.816 | high |
| Logisticians | 0.250 | 0.451 | 0.201 | 0.791 | medium |
| Compliance Officers | 0.600 | 0.403 | 0.197 | 0.779 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.250 | 0.447 | 0.197 | 0.807 | medium |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Software Developers | 0.560 | 0.738 | 0.178 | 0.600 | low |
| Data Scientists | 0.605 | 0.775 | 0.170 | 0.520 | low |
| Graphic Designers | 0.502 | 0.659 | 0.157 | 0.740 | low |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.560 | 0.405 | 0.155 | 0.360 | low |
| Office Clerks, General | 0.430 | 0.284 | 0.146 | 0.510 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.419 | 0.274 | 0.145 | 0.530 | low |
| Customer Service Representatives | 0.483 | 0.354 | 0.129 | 0.590 | low |
| Accountants and Auditors | 0.591 | 0.480 | 0.111 | 0.500 | ok |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.284 | 0.386 | 0.102 | 0.810 | ok |
| Paralegals and Legal Assistants | 0.383 | 0.284 | 0.099 | 0.810 | ok |
| Accountants and Auditors | 0.295 | 0.380 | 0.085 | 0.792 | ok |
| Operations Research Analysts | 0.278 | 0.363 | 0.085 | 0.827 | ok |
| Lawyers | 0.185 | 0.268 | 0.083 | 0.441 | ok |
| Customer Service Representatives | 0.360 | 0.284 | 0.076 | 0.824 | ok |
| Management Analysts | 0.269 | 0.340 | 0.071 | 0.880 | ok |
| Data Scientists | 0.268 | 0.330 | 0.062 | 0.409 | ok |

## Interpretation

- Treat `Human Guardrail Plausibility` as the most useful current structural check.
- Treat `Adoption Context Plausibility` as the best current outer-layer check on whether the model is over- or under-stating organizational AI conversion relative to observed sector uptake.
- Treat `Recomposition Context Plausibility` and `Wave Timing Plausibility` as the best current checks on whether workflow compression, organizational conversion, and displacement timing are directionally plausible.
- Treat `Role Heterogeneity Plausibility` as the best current check on whether the model is making an occupation look too uniform or too split.
- Treat `Demand Context Plausibility` and `Wage Leverage Plausibility` as weak calibration layers that can surface suspicious outliers, not as truth labels.
- Occupations with repeated high-priority gaps should be reviewed at the layer that likely caused the disagreement: function anchors, accountability weights, task evidence coverage, or role-shape assumptions.

## Next Data Upgrades

- Extend ORS coverage or mapping so fewer launch occupations remain unscored on the strongest human-guardrail check.
- Use the new BTOS review queue to decide whether adoption-realization tuning should remain calibration-only or graduate into a later controlled runtime parameter review.
- Refresh `O*NET` after the current official calibration layers are stable, so structural tuning is not confounded with a database-version jump.
- Consider whether the ACS heterogeneity layer is strong enough to justify future multi-variant occupation modeling rather than one default role shape per occupation.

