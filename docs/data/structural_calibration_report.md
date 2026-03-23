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
- spearman correlation: `0.849`
- high-priority mismatches: `2`
- medium-priority mismatches: `6`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `31/63`
- spearman correlation: `0.926`
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
- spearman correlation: `0.834`
- high-priority mismatches: `16`
- medium-priority mismatches: `5`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.675`
- high-priority mismatches: `0`
- medium-priority mismatches: `3`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.937`
- high-priority mismatches: `0`
- medium-priority mismatches: `5`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.494`
- high-priority mismatches: `0`
- medium-priority mismatches: `1`
- description: Compares a hybrid modeled timing proxy to the derived occupation-level wave-acceleration context. The proxy uses primary displacement wave for real structural transitions and forward trigger/recomposition readiness for augmentation-first roles.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.584`
- high-priority mismatches: `0`
- medium-priority mismatches: `2`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.648`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

### Individual AI Usage Plausibility
- strength: `weak`
- coverage: `31/63`
- spearman correlation: `0.275`
- high-priority mismatches: `0`
- medium-priority mismatches: `16`
- description: Compares the model's org-level adoption context (BTOS-derived organizational conversion plus adoption pressure) against observed individual-level Claude usage fractions from the AEI labor market follow-up. These measure different things: org adoption versus worker behavior. Large gaps — especially where individual usage exceeds org adoption — may signal that workers in that role are adapting faster than the org-level signal captures, and deserve closer adoption-realization review.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap | Individual usage gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Statistical Assistants | high | bargaining_power | weak | n/a (ok) | 0.129 (low) | 0.190 (medium) | 0.373 (high) | 0.231 (medium) | 0.132 (low) | 0.010 (ok) | 0.126 (low) | 0.017 (ok) | 0.021 (ok) |
| News Analysts, Reporters, and Journalists | high | recomposition_and_timing | medium | n/a (ok) | 0.091 (ok) | 0.202 (medium) | 0.236 (high) | 0.075 (ok) | 0.200 (medium) | 0.048 (ok) | 0.028 (ok) | 0.066 (ok) | 0.341 (medium) |
| Insurance Claims and Policy Processing Clerks | high | bargaining_power | weak | 0.209 (medium) | n/a (ok) | 0.086 (ok) | 0.313 (high) | 0.200 (medium) | 0.060 (ok) | 0.158 (low) | 0.202 (medium) | 0.038 (ok) | n/a (ok) |
| Court, Municipal, and License Clerks | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.020 (ok) | 0.294 (high) | 0.097 (ok) | 0.039 (ok) | 0.134 (low) | 0.099 (ok) | 0.037 (ok) | n/a (ok) |
| Computer User Support Specialists | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.181 (medium) | 0.291 (high) | 0.018 (ok) | 0.042 (ok) | 0.242 (low) | 0.025 (ok) | 0.039 (ok) | n/a (ok) |
| Marketing Managers | high | bargaining_power | weak | 0.147 (low) | n/a (ok) | 0.003 (ok) | 0.287 (high) | 0.062 (ok) | 0.065 (ok) | 0.055 (ok) | 0.048 (ok) | 0.062 (ok) | n/a (ok) |
| Bookkeeping, Accounting, and Auditing Clerks | high | adoption_realization | medium | 0.136 (low) | 0.172 (low) | 0.158 (low) | 0.275 (high) | 0.109 (ok) | 0.021 (ok) | 0.170 (low) | 0.044 (ok) | 0.001 (ok) | 0.153 (low) |
| Financial Managers | high | bargaining_power | weak | 0.113 (ok) | n/a (ok) | 0.125 (low) | 0.273 (high) | 0.045 (ok) | 0.084 (ok) | 0.002 (ok) | 0.054 (ok) | 0.047 (ok) | n/a (ok) |
| Customer Service Representatives | high | adoption_realization | medium | 0.015 (ok) | 0.177 (low) | 0.100 (ok) | 0.257 (high) | 0.030 (ok) | 0.005 (ok) | 0.195 (medium) | 0.120 (low) | 0.157 (low) | 0.269 (medium) |
| Sales Managers | high | bargaining_power | weak | 0.154 (low) | n/a (ok) | 0.043 (ok) | 0.268 (high) | 0.052 (ok) | 0.063 (ok) | 0.077 (ok) | 0.076 (ok) | 0.027 (ok) | n/a (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| bargaining_power | 17 |
| accountability_guardrails | 13 |
| recomposition_and_timing | 10 |
| adoption_realization | 6 |
| task_pressure | 3 |
| demand_and_adoption | 2 |
| specialization_resilience | 1 |
| individual_ai_usage | 1 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Statistical Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| News Analysts, Reporters, and Journalists | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Insurance Claims and Policy Processing Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Court, Municipal, and License Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Computer User Support Specialists | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Marketing Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Bookkeeping, Accounting, and Auditing Clerks | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Financial Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Customer Service Representatives | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Sales Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Computer Systems Analysts | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Billing and Posting Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Management Analysts | recomposition_and_timing | 0.178 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Editors | recomposition_and_timing | 0.175 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| News Analysts, Reporters, and Journalists | recomposition_and_timing | 0.173 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Advertising Sales Agents | recomposition_and_timing | 0.173 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Customer Service Representatives | adoption_realization | 0.154 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Writers and Authors | recomposition_and_timing | 0.150 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Bookkeeping, Accounting, and Auditing Clerks | adoption_realization | 0.149 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Office Clerks, General | adoption_realization | 0.144 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Graphic Designers | recomposition_and_timing | 0.133 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Software Developers | recomposition_and_timing | 0.130 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Mechanical Engineers | 0.640 | 0.359 | 0.281 | 0.636 | medium |
| Computer Systems Analysts | 0.596 | 0.328 | 0.268 | 0.721 | high |
| Financial and Investment Analysts | 0.626 | 0.381 | 0.245 | 0.678 | medium |
| Paralegals and Legal Assistants | 0.557 | 0.330 | 0.227 | 0.763 | high |
| Lawyers | 0.786 | 0.571 | 0.215 | 0.763 | medium |
| General and Operations Managers | 0.684 | 0.893 | 0.209 | 0.763 | medium |
| Insurance Claims and Policy Processing Clerks | 0.549 | 0.340 | 0.209 | 0.641 | medium |
| Executive Secretaries and Executive Administrative Assistants | 0.497 | 0.306 | 0.191 | 0.806 | medium |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer Service Representatives | 0.432 | 0.255 | 0.177 | 0.872 | low |
| Office Clerks, General | 0.445 | 0.269 | 0.175 | 0.822 | low |
| Bookkeeping, Accounting, and Auditing Clerks | 0.464 | 0.291 | 0.172 | 0.864 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.447 | 0.277 | 0.171 | 0.850 | low |
| Logisticians | 0.401 | 0.262 | 0.139 | 0.817 | low |
| Training and Development Specialists | 0.421 | 0.284 | 0.137 | 0.832 | low |
| Business Operations Specialists, All Other | 0.435 | 0.306 | 0.129 | 0.838 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.457 | 0.328 | 0.129 | 0.853 | low |

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
| Statistical Assistants | 0.494 | 0.121 | 0.373 | 0.850 | high |
| Insurance Claims and Policy Processing Clerks | 0.406 | 0.093 | 0.313 | 0.850 | high |
| Court, Municipal, and License Clerks | 0.399 | 0.105 | 0.294 | 0.850 | high |
| Computer User Support Specialists | 0.505 | 0.214 | 0.291 | 0.850 | high |
| Marketing Managers | 0.600 | 0.887 | 0.287 | 0.850 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.400 | 0.125 | 0.275 | 0.850 | high |
| Financial Managers | 0.614 | 0.887 | 0.273 | 0.850 | high |
| Sales Managers | 0.631 | 0.899 | 0.268 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Statistical Assistants | 0.452 | 0.221 | 0.231 | 0.580 | medium |
| Insurance Claims and Policy Processing Clerks | 0.425 | 0.625 | 0.200 | 0.580 | medium |
| Executive Secretaries and Executive Administrative Assistants | 0.416 | 0.615 | 0.199 | 0.600 | medium |
| Transportation, Storage, and Distribution Managers | 0.332 | 0.502 | 0.170 | 0.480 | low |
| Property, Real Estate, and Community Association Managers | 0.338 | 0.506 | 0.167 | 0.610 | low |
| Logisticians | 0.346 | 0.501 | 0.155 | 0.570 | low |
| Information Security Analysts | 0.426 | 0.270 | 0.155 | 0.520 | low |
| Operations Research Analysts | 0.302 | 0.153 | 0.150 | 0.470 | low |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Management Analysts | 0.451 | 0.659 | 0.208 | 0.855 | medium |
| Editors | 0.489 | 0.694 | 0.205 | 0.855 | medium |
| News Analysts, Reporters, and Journalists | 0.493 | 0.693 | 0.200 | 0.864 | medium |
| Advertising Sales Agents | 0.472 | 0.671 | 0.199 | 0.867 | medium |
| Paralegals and Legal Assistants | 0.501 | 0.686 | 0.185 | 0.817 | medium |
| Writers and Authors | 0.448 | 0.625 | 0.177 | 0.847 | low |
| Software Developers | 0.466 | 0.620 | 0.154 | 0.841 | low |
| Graphic Designers | 0.456 | 0.610 | 0.154 | 0.862 | low |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Network and Computer Systems Administrators | 0.588 | 0.318 | 0.270 | 0.390 | low |
| Computer User Support Specialists | 0.569 | 0.327 | 0.242 | 0.384 | low |
| Claims Adjusters, Examiners, and Investigators | 0.600 | 0.390 | 0.210 | 0.367 | low |
| Loan Interviewers and Clerks | 0.600 | 0.393 | 0.207 | 0.376 | low |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | 0.600 | 0.398 | 0.202 | 0.373 | low |
| Customer Service Representatives | 0.600 | 0.405 | 0.195 | 0.838 | medium |
| Cost Estimators | 0.600 | 0.407 | 0.193 | 0.363 | low |
| Software Quality Assurance Analysts and Testers | 0.600 | 0.414 | 0.186 | 0.373 | low |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Insurance Claims and Policy Processing Clerks | 0.506 | 0.304 | 0.202 | 0.580 | medium |
| First-Line Supervisors of Office and Administrative Support Workers | 0.529 | 0.334 | 0.194 | 0.580 | medium |
| Compliance Officers | 0.623 | 0.447 | 0.176 | 0.630 | low |
| Claims Adjusters, Examiners, and Investigators | 0.595 | 0.434 | 0.161 | 0.520 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.480 | 0.336 | 0.145 | 0.600 | low |
| Human Resources Managers | 0.651 | 0.508 | 0.143 | 0.600 | low |
| Operations Research Analysts | 0.614 | 0.755 | 0.141 | 0.470 | low |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.549 | 0.414 | 0.135 | 0.390 | low |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Office Clerks, General | 0.539 | 0.361 | 0.178 | 0.796 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.520 | 0.348 | 0.172 | 0.806 | low |
| Customer Service Representatives | 0.512 | 0.355 | 0.157 | 0.813 | low |
| Lawyers | 0.185 | 0.277 | 0.092 | 0.416 | ok |
| Receptionists and Information Clerks | 0.430 | 0.340 | 0.090 | 0.530 | ok |
| Architectural and Engineering Managers | 0.219 | 0.301 | 0.082 | 0.499 | ok |
| Paralegals and Legal Assistants | 0.353 | 0.271 | 0.082 | 0.796 | ok |
| Editors | 0.289 | 0.371 | 0.082 | 0.800 | ok |

### Individual AI Usage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.521 | 0.148 | 0.373 | 0.650 | medium |
| News Analysts, Reporters, and Journalists | 0.551 | 0.210 | 0.341 | 0.650 | medium |
| Electronics Engineers, Except Computer | 0.437 | 0.100 | 0.337 | 0.650 | medium |
| Compliance Officers | 0.427 | 0.121 | 0.306 | 0.650 | medium |
| Editors | 0.543 | 0.246 | 0.297 | 0.650 | medium |
| Mechanical Engineers | 0.368 | 0.081 | 0.287 | 0.650 | medium |
| Management Analysts | 0.529 | 0.243 | 0.286 | 0.650 | medium |
| Writers and Authors | 0.525 | 0.246 | 0.278 | 0.650 | medium |

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

