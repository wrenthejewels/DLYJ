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
- `occupation_individual_ai_usage_context.csv` is calibration-only context derived from the AEI labor market follow-up. It measures observed individual-level Claude usage fractions by occupation, which is structurally different from the model's BTOS-derived org-level adoption context. Do not treat individual usage as a direct replacement for `ai_adoption_context`. Large divergences — especially `individual_higher` cases — may indicate that workers in a role are adapting faster than org adoption signals reflect, and deserve adoption-realization review.
- `occupation_heterogeneity_context.csv` is calibration-only context. It is useful for checking whether the model is overstating role uniformity, but it is still an external structural proxy rather than a runtime role-definition input.
- the heterogeneity check is not raw ACS alone; the target is scaled into a fragmentation-pressure range and conditioned on lower people-intensity so it stays closer to the model’s actual role-splitting claim.
- `industry_ai_adoption_context.csv` is also calibration-only context. It measures observed sector AI use and deployment change, not direct task automability.
- the BTOS adoption check is not compared on raw business-use percentages; the BTOS signal is mapped into the model’s organizational-conversion range so it behaves as a directional review target rather than a literal prevalence label.
- `occupation_recomposition_context.csv` is a derived outer-layer target. It is useful for checking workflow compression, organizational conversion, and timing assumptions, but it is still not direct proof of realized displacement.
- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.
- this report is for calibration and review, not runtime scoring.

## Summary

- occupations evaluated: `63`
- target table: `data/normalized/occupation_structural_calibration_targets.csv`

## Check Strengths

### Human Guardrail Plausibility
- strength: `strong`
- coverage: `32/63`
- spearman correlation: `0.870`
- high-priority mismatches: `0`
- medium-priority mismatches: `9`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `31/63`
- spearman correlation: `0.898`
- high-priority mismatches: `0`
- medium-priority mismatches: `5`
- description: Compares organizational conversion and default adoption pressure to a BTOS adoption-context signal joined from sector-level AI-use estimates through ACS-derived occupation sector mix, then rescaled into the model’s adoption-realization range.

### Demand Context Plausibility
- strength: `weak`
- coverage: `63/63`
- spearman correlation: `0.803`
- high-priority mismatches: `2`
- medium-priority mismatches: `4`
- description: Compares demand-expansion signals to labor-market context, not to direct AI displacement.

### Wage Leverage Plausibility
- strength: `weak`
- coverage: `63/63`
- spearman correlation: `0.788`
- high-priority mismatches: `15`
- medium-priority mismatches: `10`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.757`
- high-priority mismatches: `0`
- medium-priority mismatches: `10`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.920`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.607`
- high-priority mismatches: `4`
- medium-priority mismatches: `4`
- description: Compares the modeled primary displacement wave to the derived occupation-level wave-acceleration context.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.681`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.605`
- high-priority mismatches: `0`
- medium-priority mismatches: `1`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

### Individual AI Usage Plausibility
- strength: `weak`
- coverage: `31/63`
- spearman correlation: `0.240`
- high-priority mismatches: `0`
- medium-priority mismatches: `17`
- description: Compares the model's org-level adoption context (BTOS-derived organizational conversion plus adoption pressure) against observed individual-level Claude usage fractions from the AEI labor market follow-up. These measure different things: org adoption versus worker behavior. Large gaps — especially where individual usage exceeds org adoption — may signal that workers in that role are adapting faster than the org-level signal captures, and deserve closer adoption-realization review.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap | Individual usage gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Advertising Sales Agents | high | recomposition_and_timing | medium | n/a (ok) | 0.074 (ok) | 0.228 (high) | 0.141 (low) | 0.111 (ok) | 0.186 (medium) | 0.007 (ok) | 0.053 (ok) | 0.008 (ok) | 0.378 (medium) |
| Sales Managers | high | bargaining_power | weak | 0.205 (medium) | n/a (ok) | 0.043 (ok) | 0.350 (high) | 0.199 (medium) | 0.038 (ok) | 0.144 (low) | 0.019 (ok) | 0.003 (ok) | n/a (ok) |
| Financial Managers | high | bargaining_power | weak | 0.171 (low) | n/a (ok) | 0.125 (low) | 0.334 (high) | 0.059 (ok) | 0.066 (ok) | 0.260 (low) | 0.001 (ok) | 0.017 (ok) | n/a (ok) |
| Lawyers | high | bargaining_power | weak | 0.150 (low) | n/a (ok) | 0.086 (ok) | 0.328 (high) | 0.181 (medium) | 0.031 (ok) | 0.104 (ok) | 0.036 (ok) | 0.055 (ok) | 0.250 (medium) |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | high | accountability_guardrails | strong | 0.219 (medium) | 0.117 (ok) | 0.032 (ok) | 0.080 (ok) | 0.058 (ok) | 0.138 (low) | 0.323 (high) | 0.158 (low) | 0.003 (ok) | n/a (ok) |
| Statistical Assistants | high | bargaining_power | weak | n/a (ok) | 0.135 (low) | 0.190 (medium) | 0.316 (high) | 0.259 (medium) | 0.135 (low) | 0.002 (ok) | 0.164 (low) | 0.001 (ok) | 0.026 (ok) |
| Billing and Posting Clerks | high | accountability_guardrails | strong | 0.302 (medium) | n/a (ok) | 0.099 (ok) | 0.308 (high) | 0.044 (ok) | 0.056 (ok) | 0.127 (low) | 0.009 (ok) | 0.008 (ok) | n/a (ok) |
| Marketing Managers | high | bargaining_power | weak | 0.187 (medium) | n/a (ok) | 0.003 (ok) | 0.302 (high) | 0.135 (low) | 0.049 (ok) | 0.186 (low) | 0.073 (ok) | 0.083 (ok) | n/a (ok) |
| Human Resources Managers | high | bargaining_power | weak | 0.113 (ok) | n/a (ok) | 0.001 (ok) | 0.301 (high) | 0.115 (ok) | 0.055 (ok) | 0.177 (low) | 0.102 (ok) | 0.012 (ok) | n/a (ok) |
| Logisticians | high | adoption_realization | medium | n/a (ok) | 0.187 (medium) | 0.200 (medium) | 0.110 (ok) | 0.002 (ok) | 0.059 (ok) | 0.272 (high) | 0.019 (ok) | 0.124 (low) | 0.292 (medium) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| bargaining_power | 16 |
| accountability_guardrails | 11 |
| adoption_realization | 11 |
| task_pressure | 7 |
| recomposition_and_timing | 6 |
| individual_ai_usage | 2 |
| demand_and_adoption | 2 |
| role_shape_heterogeneity | 1 |
| specialization_resilience | 1 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Advertising Sales Agents | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Sales Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Financial Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Lawyers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Statistical Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Billing and Posting Clerks | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Marketing Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Human Resources Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Logisticians | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Customer Service Representatives | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Software Developers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Management Analysts | recomposition_and_timing | 0.176 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Customer Service Representatives | adoption_realization | 0.174 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Editors | recomposition_and_timing | 0.165 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | adoption_realization | 0.162 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Advertising Sales Agents | recomposition_and_timing | 0.161 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Office Clerks, General | adoption_realization | 0.161 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| News Analysts, Reporters, and Journalists | recomposition_and_timing | 0.160 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Bookkeeping, Accounting, and Auditing Clerks | adoption_realization | 0.159 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Logisticians | adoption_realization | 0.153 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Writers and Authors | recomposition_and_timing | 0.147 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Billing and Posting Clerks | 0.487 | 0.185 | 0.302 | 0.658 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.592 | 0.373 | 0.219 | 0.763 | medium |
| Loan Interviewers and Clerks | 0.500 | 0.285 | 0.215 | 0.641 | medium |
| General and Operations Managers | 0.680 | 0.893 | 0.213 | 0.763 | medium |
| Sales Managers | 0.625 | 0.830 | 0.205 | 0.641 | medium |
| Paralegals and Legal Assistants | 0.532 | 0.330 | 0.202 | 0.763 | medium |
| Marketing Managers | 0.583 | 0.770 | 0.187 | 0.641 | medium |
| Computer Systems Analysts | 0.514 | 0.328 | 0.186 | 0.721 | medium |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer Service Representatives | 0.453 | 0.255 | 0.199 | 0.872 | medium |
| Office Clerks, General | 0.466 | 0.269 | 0.196 | 0.822 | medium |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.467 | 0.277 | 0.190 | 0.850 | medium |
| Logisticians | 0.449 | 0.262 | 0.187 | 0.817 | medium |
| Bookkeeping, Accounting, and Auditing Clerks | 0.475 | 0.291 | 0.184 | 0.864 | medium |
| Executive Secretaries and Executive Administrative Assistants | 0.500 | 0.328 | 0.172 | 0.853 | low |
| Training and Development Specialists | 0.449 | 0.284 | 0.165 | 0.832 | low |
| Accountants and Auditors | 0.516 | 0.357 | 0.159 | 0.860 | low |

### Demand Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.487 | 0.259 | 0.228 | 0.850 | high |
| Network and Computer Systems Administrators | 0.380 | 0.155 | 0.225 | 0.850 | high |
| News Analysts, Reporters, and Journalists | 0.528 | 0.326 | 0.202 | 0.850 | medium |
| Logisticians | 0.637 | 0.837 | 0.200 | 0.850 | medium |
| Statistical Assistants | 0.617 | 0.427 | 0.190 | 0.850 | medium |
| Computer User Support Specialists | 0.360 | 0.179 | 0.181 | 0.850 | medium |
| Claims Adjusters, Examiners, and Investigators | 0.348 | 0.181 | 0.167 | 0.850 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.508 | 0.350 | 0.158 | 0.850 | low |

### Wage Leverage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Sales Managers | 0.549 | 0.899 | 0.350 | 0.850 | high |
| Financial Managers | 0.553 | 0.887 | 0.334 | 0.850 | high |
| Lawyers | 0.599 | 0.927 | 0.328 | 0.850 | high |
| Statistical Assistants | 0.437 | 0.121 | 0.316 | 0.850 | high |
| Billing and Posting Clerks | 0.364 | 0.056 | 0.308 | 0.850 | high |
| Marketing Managers | 0.585 | 0.887 | 0.302 | 0.850 | high |
| Human Resources Managers | 0.554 | 0.855 | 0.301 | 0.850 | high |
| Customer Service Representatives | 0.308 | 0.016 | 0.292 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Operations Research Analysts | 0.414 | 0.153 | 0.261 | 0.470 | low |
| Statistical Assistants | 0.480 | 0.221 | 0.259 | 0.580 | medium |
| Accountants and Auditors | 0.631 | 0.399 | 0.233 | 0.540 | medium |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | 0.469 | 0.257 | 0.212 | 0.550 | medium |
| Securities, Commodities, and Financial Services Sales Agents | 0.459 | 0.258 | 0.200 | 0.610 | medium |
| Sales Managers | 0.452 | 0.253 | 0.199 | 0.590 | medium |
| Network and Computer Systems Administrators | 0.478 | 0.282 | 0.196 | 0.630 | medium |
| Software Developers | 0.459 | 0.273 | 0.186 | 0.550 | medium |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Management Analysts | 0.453 | 0.658 | 0.206 | 0.855 | medium |
| Editors | 0.494 | 0.687 | 0.193 | 0.855 | medium |
| Advertising Sales Agents | 0.474 | 0.660 | 0.186 | 0.867 | medium |
| News Analysts, Reporters, and Journalists | 0.496 | 0.681 | 0.185 | 0.864 | medium |
| Paralegals and Legal Assistants | 0.507 | 0.685 | 0.178 | 0.817 | low |
| Writers and Authors | 0.460 | 0.632 | 0.173 | 0.847 | low |
| Market Research Analysts and Marketing Specialists | 0.434 | 0.581 | 0.147 | 0.838 | low |
| Software Developers | 0.467 | 0.611 | 0.144 | 0.841 | low |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.250 | 0.573 | 0.323 | 0.813 | high |
| Property, Real Estate, and Community Association Managers | 0.250 | 0.548 | 0.298 | 0.386 | low |
| Logisticians | 0.250 | 0.522 | 0.272 | 0.797 | high |
| Financial Managers | 0.250 | 0.510 | 0.260 | 0.392 | low |
| Personal Financial Advisors | 0.250 | 0.493 | 0.243 | 0.376 | low |
| Data Scientists | 0.250 | 0.493 | 0.243 | 0.365 | low |
| Financial and Investment Analysts | 0.250 | 0.484 | 0.234 | 0.833 | high |
| Information Security Analysts | 0.250 | 0.484 | 0.234 | 0.367 | low |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Operations Research Analysts | 0.561 | 0.755 | 0.194 | 0.470 | low |
| Statistical Assistants | 0.484 | 0.648 | 0.164 | 0.580 | low |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.572 | 0.414 | 0.158 | 0.390 | low |
| First-Line Supervisors of Office and Administrative Support Workers | 0.469 | 0.334 | 0.135 | 0.580 | low |
| Customer Service Representatives | 0.436 | 0.302 | 0.134 | 0.560 | low |
| Data Scientists | 0.586 | 0.718 | 0.133 | 0.510 | low |
| Compliance Officers | 0.574 | 0.447 | 0.127 | 0.630 | low |
| Insurance Claims and Policy Processing Clerks | 0.421 | 0.304 | 0.117 | 0.580 | ok |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.541 | 0.361 | 0.180 | 0.796 | medium |
| Receptionists and Information Clerks | 0.516 | 0.340 | 0.176 | 0.530 | low |
| Training and Development Specialists | 0.485 | 0.312 | 0.173 | 0.823 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.519 | 0.348 | 0.171 | 0.806 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.482 | 0.320 | 0.162 | 0.827 | low |
| Paralegals and Legal Assistants | 0.427 | 0.271 | 0.156 | 0.796 | low |
| Customer Service Representatives | 0.498 | 0.355 | 0.143 | 0.813 | low |
| Logisticians | 0.460 | 0.336 | 0.124 | 0.817 | low |

### Individual AI Usage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.527 | 0.148 | 0.378 | 0.650 | medium |
| Electronics Engineers, Except Computer | 0.449 | 0.100 | 0.349 | 0.650 | medium |
| Compliance Officers | 0.456 | 0.121 | 0.335 | 0.650 | medium |
| News Analysts, Reporters, and Journalists | 0.544 | 0.210 | 0.334 | 0.650 | medium |
| Mechanical Engineers | 0.397 | 0.081 | 0.315 | 0.650 | medium |
| Editors | 0.549 | 0.246 | 0.303 | 0.650 | medium |
| Logisticians | 0.449 | 0.157 | 0.292 | 0.650 | medium |
| Writers and Authors | 0.533 | 0.246 | 0.287 | 0.650 | medium |

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
The model assigns these occupations to the `distant` primary displacement wave because their task clusters retain enough function in both current and next wave analyses to remain in the `stable` wave state. The `wave_acceleration_context` calibration target (0.48–0.57) reflects AI *adoption* speed for these roles, not displacement timing. These are augmentation-first occupations: AI is actively being adopted into the workflow (next wave) while the role itself is not being displaced yet (distant wave). The model is correct about displacement; the WAC signal is correct about adoption. They measure different phenomena. This gap will persist unless the wave timing check is redesigned to separate displacement timing from augmentation timing, or unless the primary displacement wave is assessed against a separate displacement-specific benchmark.

**Demand Context — adaptation floor on declining occupations (Advertising Sales Agents, Network/CS Admins)**
The `demandExpansionSignal` formula includes adaptation terms (`adaptiveCapacity`, `transferability`, `learningIntensity`) that add approximately 0.25 to the output regardless of BLS labor market projections. Even with `demand_expansion_context=0.17` for Network Admins, the model outputs 0.38 because IT workers have high adaptive capacity and transferability scores. The demand context target reflects BLS projected decline; the model floor reflects human capital resilience signals. These gaps will persist unless the adaptation term weights in `demandExpansionSignal` are reduced or suppressed for occupations with strong BLS decline signals.

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

