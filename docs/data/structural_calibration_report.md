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
- medium-priority mismatches: `3`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `32/34`
- spearman correlation: `0.861`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
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
- spearman correlation: `0.808`
- high-priority mismatches: `7`
- medium-priority mismatches: `6`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.633`
- high-priority mismatches: `1`
- medium-priority mismatches: `7`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.885`
- high-priority mismatches: `4`
- medium-priority mismatches: `3`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.536`
- high-priority mismatches: `4`
- medium-priority mismatches: `6`
- description: Compares the modeled primary displacement wave to the derived occupation-level wave-acceleration context.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.614`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `34/34`
- spearman correlation: `0.412`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Editors | high | recomposition_and_timing | medium | n/a (ok) | 0.076 (ok) | 0.133 (low) | 0.086 (ok) | 0.126 (low) | 0.256 (high) | 0.447 (high) | 0.036 (ok) | 0.104 (ok) |
| Customer Service Representatives | high | bargaining_power | weak | 0.012 (ok) | 0.142 (low) | 0.154 (low) | 0.406 (high) | 0.055 (ok) | 0.010 (ok) | 0.290 (high) | 0.127 (low) | 0.074 (ok) |
| Statistical Assistants | high | bargaining_power | weak | n/a (ok) | 0.110 (ok) | 0.177 (low) | 0.365 (high) | 0.158 (low) | 0.153 (low) | 0.039 (ok) | 0.107 (ok) | 0.017 (ok) |
| Operations Research Analysts | high | recomposition_and_timing | medium | n/a (ok) | 0.095 (ok) | 0.113 (ok) | 0.002 (ok) | 0.183 (medium) | 0.158 (low) | 0.321 (high) | 0.105 (ok) | 0.085 (ok) |
| Bookkeeping, Accounting, and Auditing Clerks | high | bargaining_power | weak | 0.071 (ok) | 0.171 (low) | 0.150 (low) | 0.321 (high) | 0.105 (ok) | 0.071 (ok) | 0.152 (low) | 0.044 (ok) | 0.021 (ok) |
| Computer Systems Analysts | high | accountability_guardrails | strong | 0.162 (low) | 0.124 (low) | 0.080 (ok) | 0.219 (medium) | 0.075 (ok) | 0.117 (ok) | 0.274 (high) | 0.066 (ok) | 0.017 (ok) |
| Advertising Sales Agents | high | recomposition_and_timing | medium | n/a (ok) | 0.018 (ok) | 0.262 (high) | 0.200 (medium) | 0.164 (low) | 0.212 (medium) | 0.080 (ok) | 0.058 (ok) | 0.020 (ok) |
| Lawyers | high | accountability_guardrails | strong | 0.217 (medium) | n/a (ok) | 0.084 (ok) | 0.254 (high) | 0.072 (ok) | 0.103 (ok) | 0.155 (low) | 0.082 (ok) | 0.083 (ok) |
| Office Clerks, General | high | accountability_guardrails | strong | 0.159 (low) | 0.178 (low) | 0.126 (low) | 0.248 (high) | 0.233 (medium) | 0.060 (ok) | 0.176 (low) | 0.145 (low) | 0.021 (ok) |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | high | accountability_guardrails | strong | 0.166 (low) | 0.173 (low) | 0.043 (ok) | 0.226 (high) | 0.247 (medium) | 0.079 (ok) | 0.209 (medium) | 0.142 (low) | 0.038 (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| recomposition_and_timing | 12 |
| accountability_guardrails | 9 |
| task_pressure | 5 |
| adoption_realization | 4 |
| bargaining_power | 3 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Editors | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Customer Service Representatives | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Statistical Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Operations Research Analysts | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Bookkeeping, Accounting, and Auditing Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Computer Systems Analysts | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Advertising Sales Agents | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Lawyers | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Office Clerks, General | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Management Analysts | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Paralegals and Legal Assistants | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Editors | recomposition_and_timing | 0.220 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Management Analysts | recomposition_and_timing | 0.215 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| News Analysts, Reporters, and Journalists | recomposition_and_timing | 0.199 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Paralegals and Legal Assistants | recomposition_and_timing | 0.198 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Advertising Sales Agents | recomposition_and_timing | 0.189 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Writers and Authors | recomposition_and_timing | 0.178 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Graphic Designers | task_pressure | 0.175 | Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping. |
| Web Developers | recomposition_and_timing | 0.165 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Software Developers | recomposition_and_timing | 0.151 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Public Relations Specialists | recomposition_and_timing | 0.143 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Lawyers | 0.788 | 0.571 | 0.217 | 0.763 | medium |
| Mechanical Engineers | 0.550 | 0.359 | 0.191 | 0.636 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.554 | 0.373 | 0.181 | 0.763 | medium |
| Financial and Investment Analysts | 0.559 | 0.381 | 0.178 | 0.678 | low |
| General and Operations Managers | 0.717 | 0.893 | 0.176 | 0.763 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.431 | 0.265 | 0.166 | 0.806 | low |
| Computer Systems Analysts | 0.490 | 0.328 | 0.162 | 0.721 | low |
| Office Clerks, General | 0.453 | 0.294 | 0.159 | 0.806 | low |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.446 | 0.268 | 0.178 | 0.822 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.449 | 0.275 | 0.173 | 0.850 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.460 | 0.290 | 0.171 | 0.864 | low |
| Mechanical Engineers | 0.398 | 0.240 | 0.158 | 0.879 | low |
| Training and Development Specialists | 0.427 | 0.283 | 0.144 | 0.832 | low |
| Business Operations Specialists, All Other | 0.447 | 0.304 | 0.143 | 0.838 | low |
| Customer Service Representatives | 0.397 | 0.254 | 0.142 | 0.872 | low |
| Technical Writers | 0.499 | 0.361 | 0.138 | 0.876 | low |

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
| Customer Service Representatives | 0.406 | 0.000 | 0.406 | 0.850 | high |
| Statistical Assistants | 0.463 | 0.098 | 0.365 | 0.850 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.412 | 0.091 | 0.321 | 0.850 | high |
| Lawyers | 0.723 | 0.977 | 0.254 | 0.850 | high |
| Office Clerks, General | 0.309 | 0.061 | 0.248 | 0.850 | high |
| Graphic Designers | 0.497 | 0.265 | 0.232 | 0.850 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.302 | 0.076 | 0.226 | 0.850 | high |
| Computer Systems Analysts | 0.516 | 0.735 | 0.219 | 0.850 | medium |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.475 | 0.721 | 0.247 | 0.530 | medium |
| Graphic Designers | 0.443 | 0.205 | 0.237 | 0.740 | high |
| Office Clerks, General | 0.505 | 0.738 | 0.233 | 0.510 | medium |
| Software Developers | 0.478 | 0.253 | 0.225 | 0.600 | medium |
| Data Scientists | 0.436 | 0.219 | 0.217 | 0.520 | medium |
| Writers and Authors | 0.385 | 0.171 | 0.215 | 0.740 | medium |
| News Analysts, Reporters, and Journalists | 0.529 | 0.341 | 0.189 | 0.730 | medium |
| Operations Research Analysts | 0.343 | 0.160 | 0.183 | 0.600 | medium |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.444 | 0.700 | 0.256 | 0.861 | high |
| Management Analysts | 0.389 | 0.635 | 0.245 | 0.877 | high |
| Paralegals and Legal Assistants | 0.510 | 0.750 | 0.240 | 0.825 | high |
| News Analysts, Reporters, and Journalists | 0.513 | 0.740 | 0.227 | 0.878 | high |
| Advertising Sales Agents | 0.389 | 0.601 | 0.212 | 0.893 | medium |
| Writers and Authors | 0.409 | 0.611 | 0.203 | 0.875 | medium |
| Web Developers | 0.424 | 0.614 | 0.190 | 0.870 | medium |
| Software Developers | 0.450 | 0.627 | 0.177 | 0.851 | low |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.250 | 0.697 | 0.447 | 0.861 | high |
| Operations Research Analysts | 0.250 | 0.571 | 0.321 | 0.713 | high |
| Customer Service Representatives | 0.600 | 0.310 | 0.290 | 0.844 | high |
| Computer Systems Analysts | 0.250 | 0.524 | 0.274 | 0.852 | high |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.250 | 0.459 | 0.209 | 0.816 | medium |
| Compliance Officers | 0.600 | 0.399 | 0.201 | 0.779 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.250 | 0.451 | 0.201 | 0.807 | medium |
| Logisticians | 0.250 | 0.444 | 0.194 | 0.791 | medium |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Software Developers | 0.571 | 0.738 | 0.167 | 0.600 | low |
| Data Scientists | 0.618 | 0.775 | 0.157 | 0.520 | low |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.558 | 0.405 | 0.153 | 0.360 | low |
| Graphic Designers | 0.508 | 0.659 | 0.152 | 0.740 | low |
| Office Clerks, General | 0.429 | 0.284 | 0.145 | 0.510 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.417 | 0.274 | 0.142 | 0.530 | low |
| Customer Service Representatives | 0.481 | 0.354 | 0.127 | 0.590 | low |
| Accountants and Auditors | 0.592 | 0.480 | 0.112 | 0.500 | ok |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Editors | 0.282 | 0.386 | 0.104 | 0.810 | ok |
| Paralegals and Legal Assistants | 0.380 | 0.284 | 0.096 | 0.810 | ok |
| Accountants and Auditors | 0.293 | 0.380 | 0.087 | 0.792 | ok |
| Operations Research Analysts | 0.278 | 0.363 | 0.085 | 0.827 | ok |
| Lawyers | 0.185 | 0.268 | 0.083 | 0.441 | ok |
| Customer Service Representatives | 0.358 | 0.284 | 0.074 | 0.824 | ok |
| Management Analysts | 0.268 | 0.340 | 0.072 | 0.880 | ok |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.310 | 0.246 | 0.064 | 0.743 | ok |

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

