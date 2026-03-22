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
- coverage: `23/63`
- spearman correlation: `0.733`
- high-priority mismatches: `4`
- medium-priority mismatches: `5`
- description: Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.

### Adoption Context Plausibility
- strength: `medium`
- coverage: `31/63`
- spearman correlation: `0.877`
- high-priority mismatches: `0`
- medium-priority mismatches: `4`
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
- spearman correlation: `0.780`
- high-priority mismatches: `15`
- medium-priority mismatches: `9`
- description: Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.

### Routine Pressure Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.677`
- high-priority mismatches: `0`
- medium-priority mismatches: `12`
- description: Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.

### Recomposition Context Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.907`
- high-priority mismatches: `2`
- medium-priority mismatches: `3`
- description: Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer.

### Wave Timing Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.513`
- high-priority mismatches: `4`
- medium-priority mismatches: `4`
- description: Compares the modeled primary displacement wave to the derived occupation-level wave-acceleration context.

### Specialization Resilience Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.638`
- high-priority mismatches: `0`
- medium-priority mismatches: `0`
- description: Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.

### Role Heterogeneity Plausibility
- strength: `medium`
- coverage: `63/63`
- spearman correlation: `0.324`
- high-priority mismatches: `0`
- medium-priority mismatches: `2`
- description: Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.

### Individual AI Usage Plausibility
- strength: `weak`
- coverage: `31/63`
- spearman correlation: `0.297`
- high-priority mismatches: `0`
- medium-priority mismatches: `16`
- description: Compares the model's org-level adoption context (BTOS-derived organizational conversion plus adoption pressure) against observed individual-level Claude usage fractions from the AEI labor market follow-up. These measure different things: org adoption versus worker behavior. Large gaps — especially where individual usage exceeds org adoption — may signal that workers in that role are adapting faster than the org-level signal captures, and deserve closer adoption-realization review.

## Highest-Priority Mismatches

| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap | Individual usage gap |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Advertising Sales Agents | high | recomposition_and_timing | medium | n/a (ok) | 0.075 (ok) | 0.228 (high) | 0.101 (ok) | 0.225 (medium) | 0.193 (medium) | 0.007 (ok) | 0.025 (ok) | 0.010 (ok) | 0.379 (medium) |
| Sales Managers | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.043 (ok) | 0.363 (high) | 0.200 (medium) | 0.044 (ok) | 0.144 (low) | 0.012 (ok) | 0.004 (ok) | n/a (ok) |
| Marketing Managers | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.003 (ok) | 0.355 (high) | 0.146 (low) | 0.063 (ok) | 0.186 (low) | 0.098 (ok) | 0.039 (ok) | n/a (ok) |
| Financial Managers | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.125 (low) | 0.351 (high) | 0.061 (ok) | 0.075 (ok) | 0.260 (low) | 0.008 (ok) | 0.016 (ok) | n/a (ok) |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | high | accountability_guardrails | strong | 0.226 (high) | 0.104 (ok) | 0.032 (ok) | 0.095 (ok) | 0.048 (ok) | 0.159 (low) | 0.323 (high) | 0.166 (low) | 0.005 (ok) | n/a (ok) |
| Lawyers | high | bargaining_power | weak | 0.185 (medium) | n/a (ok) | 0.086 (ok) | 0.321 (high) | 0.175 (low) | 0.039 (ok) | 0.104 (ok) | 0.043 (ok) | 0.064 (ok) | 0.250 (medium) |
| Bookkeeping, Accounting, and Auditing Clerks | high | bargaining_power | weak | 0.140 (low) | 0.177 (low) | 0.158 (low) | 0.317 (high) | 0.017 (ok) | 0.066 (ok) | 0.131 (low) | 0.063 (ok) | 0.006 (ok) | 0.158 (low) |
| Billing and Posting Clerks | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.099 (ok) | 0.316 (high) | 0.038 (ok) | 0.066 (ok) | 0.127 (low) | 0.003 (ok) | 0.044 (ok) | n/a (ok) |
| Statistical Assistants | high | bargaining_power | weak | n/a (ok) | 0.123 (low) | 0.190 (medium) | 0.316 (high) | 0.254 (medium) | 0.155 (low) | 0.002 (ok) | 0.164 (low) | 0.001 (ok) | 0.014 (ok) |
| Human Resources Managers | high | bargaining_power | weak | n/a (ok) | n/a (ok) | 0.001 (ok) | 0.315 (high) | 0.116 (ok) | 0.063 (ok) | 0.177 (low) | 0.094 (ok) | 0.012 (ok) | n/a (ok) |

## Most Common Review Layers

| Review layer | Occupations flagged |
| --- | ---: |
| bargaining_power | 19 |
| accountability_guardrails | 9 |
| adoption_realization | 9 |
| recomposition_and_timing | 7 |
| task_pressure | 7 |
| role_shape_heterogeneity | 4 |
| individual_ai_usage | 2 |
| demand_and_adoption | 2 |

## Review Queue

| Occupation | Primary review layer | Layer strength | Highest tier | Why review |
| --- | --- | --- | --- | --- |
| Advertising Sales Agents | recomposition_and_timing | medium | high | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Sales Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Marketing Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Financial Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | accountability_guardrails | strong | high | Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails. |
| Lawyers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Bookkeeping, Accounting, and Auditing Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Billing and Posting Clerks | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Statistical Assistants | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Human Resources Managers | bargaining_power | weak | high | Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions. |
| Customer Service Representatives | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Logisticians | adoption_realization | medium | high | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |

## Strongest Structural Queue

| Occupation | Review layer | Review score | Why review |
| --- | --- | ---: | --- |
| Editors | recomposition_and_timing | 0.191 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Management Analysts | recomposition_and_timing | 0.191 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| News Analysts, Reporters, and Journalists | recomposition_and_timing | 0.184 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Customer Service Representatives | adoption_realization | 0.173 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Advertising Sales Agents | recomposition_and_timing | 0.167 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Office Clerks, General | adoption_realization | 0.161 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | adoption_realization | 0.159 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Writers and Authors | recomposition_and_timing | 0.151 | Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability. |
| Logisticians | adoption_realization | 0.150 | BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability. |
| Training and Development Specialists | role_shape_heterogeneity | 0.142 | Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation. |

## Largest Gaps By Check

### Human Guardrail Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Paralegals and Legal Assistants | 0.599 | 0.330 | 0.269 | 0.763 | high |
| General and Operations Managers | 0.648 | 0.893 | 0.245 | 0.763 | high |
| Computer Systems Analysts | 0.573 | 0.328 | 0.245 | 0.721 | high |
| Mechanical Engineers | 0.600 | 0.359 | 0.241 | 0.636 | medium |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.599 | 0.373 | 0.226 | 0.763 | high |
| Financial and Investment Analysts | 0.583 | 0.381 | 0.202 | 0.678 | medium |
| Graphic Designers | 0.504 | 0.316 | 0.188 | 0.678 | medium |
| Lawyers | 0.756 | 0.571 | 0.185 | 0.763 | medium |

### Adoption Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Customer Service Representatives | 0.453 | 0.255 | 0.198 | 0.872 | medium |
| Office Clerks, General | 0.465 | 0.269 | 0.196 | 0.822 | medium |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.464 | 0.277 | 0.187 | 0.850 | medium |
| Logisticians | 0.446 | 0.262 | 0.184 | 0.817 | medium |
| Bookkeeping, Accounting, and Auditing Clerks | 0.469 | 0.291 | 0.177 | 0.864 | low |
| Mechanical Engineers | 0.410 | 0.240 | 0.170 | 0.879 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.495 | 0.328 | 0.167 | 0.853 | low |
| General and Operations Managers | 0.412 | 0.247 | 0.165 | 0.869 | low |

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
| Sales Managers | 0.536 | 0.899 | 0.363 | 0.850 | high |
| Marketing Managers | 0.532 | 0.887 | 0.355 | 0.850 | high |
| Financial Managers | 0.536 | 0.887 | 0.351 | 0.850 | high |
| Lawyers | 0.606 | 0.927 | 0.321 | 0.850 | high |
| Bookkeeping, Accounting, and Auditing Clerks | 0.442 | 0.125 | 0.317 | 0.850 | high |
| Billing and Posting Clerks | 0.372 | 0.056 | 0.316 | 0.850 | high |
| Statistical Assistants | 0.437 | 0.121 | 0.316 | 0.850 | high |
| Human Resources Managers | 0.540 | 0.855 | 0.315 | 0.850 | high |

### Routine Pressure Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Operations Research Analysts | 0.410 | 0.153 | 0.257 | 0.470 | low |
| Statistical Assistants | 0.475 | 0.221 | 0.254 | 0.580 | medium |
| Accountants and Auditors | 0.627 | 0.399 | 0.228 | 0.540 | medium |
| Advertising Sales Agents | 0.487 | 0.262 | 0.225 | 0.650 | medium |
| Market Research Analysts and Marketing Specialists | 0.469 | 0.250 | 0.218 | 0.510 | medium |
| Writers and Authors | 0.468 | 0.254 | 0.213 | 0.600 | medium |
| Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products | 0.466 | 0.257 | 0.209 | 0.550 | medium |
| Sales Managers | 0.453 | 0.253 | 0.200 | 0.590 | medium |

### Recomposition Context Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Management Analysts | 0.435 | 0.658 | 0.223 | 0.855 | high |
| Editors | 0.464 | 0.687 | 0.223 | 0.855 | high |
| News Analysts, Reporters, and Journalists | 0.468 | 0.681 | 0.213 | 0.864 | medium |
| Paralegals and Legal Assistants | 0.477 | 0.685 | 0.208 | 0.817 | medium |
| Advertising Sales Agents | 0.467 | 0.660 | 0.193 | 0.867 | medium |
| Writers and Authors | 0.454 | 0.632 | 0.178 | 0.847 | low |
| Graphic Designers | 0.439 | 0.609 | 0.170 | 0.862 | low |
| Software Developers | 0.442 | 0.611 | 0.168 | 0.841 | low |

### Wave Timing Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.250 | 0.573 | 0.323 | 0.813 | high |
| Property, Real Estate, and Community Association Managers | 0.250 | 0.548 | 0.298 | 0.386 | low |
| Network and Computer Systems Administrators | 0.600 | 0.319 | 0.281 | 0.390 | low |
| Logisticians | 0.250 | 0.522 | 0.272 | 0.797 | high |
| Financial Managers | 0.250 | 0.510 | 0.260 | 0.392 | low |
| Personal Financial Advisors | 0.250 | 0.493 | 0.243 | 0.376 | low |
| Data Scientists | 0.250 | 0.493 | 0.243 | 0.365 | low |
| Financial and Investment Analysts | 0.250 | 0.484 | 0.234 | 0.833 | high |

### Specialization Resilience Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Operations Research Analysts | 0.561 | 0.755 | 0.194 | 0.470 | low |
| Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | 0.580 | 0.414 | 0.166 | 0.390 | low |
| Statistical Assistants | 0.484 | 0.648 | 0.164 | 0.580 | low |
| First-Line Supervisors of Office and Administrative Support Workers | 0.469 | 0.334 | 0.135 | 0.580 | low |
| Customer Service Representatives | 0.436 | 0.302 | 0.134 | 0.560 | low |
| Data Scientists | 0.586 | 0.718 | 0.133 | 0.510 | low |
| Compliance Officers | 0.574 | 0.447 | 0.127 | 0.630 | low |
| Insurance Claims and Policy Processing Clerks | 0.421 | 0.304 | 0.117 | 0.580 | ok |

### Role Heterogeneity Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Receptionists and Information Clerks | 0.506 | 0.285 | 0.221 | 0.530 | medium |
| First-Line Supervisors of Office and Administrative Support Workers | 0.471 | 0.285 | 0.186 | 0.496 | low |
| Office Clerks, General | 0.541 | 0.361 | 0.180 | 0.796 | medium |
| Training and Development Specialists | 0.485 | 0.312 | 0.173 | 0.823 | low |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 0.519 | 0.348 | 0.171 | 0.806 | low |
| Executive Secretaries and Executive Administrative Assistants | 0.482 | 0.320 | 0.162 | 0.827 | low |
| Purchasing Agents, Except Wholesale, Retail, and Farm Products | 0.419 | 0.276 | 0.143 | 0.489 | low |
| Cost Estimators | 0.419 | 0.276 | 0.143 | 0.468 | low |

### Individual AI Usage Plausibility
| Occupation | Model | Target | Gap | Confidence | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| Advertising Sales Agents | 0.527 | 0.148 | 0.379 | 0.650 | medium |
| Electronics Engineers, Except Computer | 0.447 | 0.100 | 0.347 | 0.650 | medium |
| Compliance Officers | 0.455 | 0.121 | 0.334 | 0.650 | medium |
| Mechanical Engineers | 0.410 | 0.081 | 0.328 | 0.650 | medium |
| News Analysts, Reporters, and Journalists | 0.528 | 0.210 | 0.318 | 0.650 | medium |
| Logisticians | 0.446 | 0.157 | 0.289 | 0.650 | medium |
| Editors | 0.532 | 0.246 | 0.286 | 0.650 | medium |
| Writers and Authors | 0.532 | 0.246 | 0.286 | 0.650 | medium |

## Interpretation

- Treat `Human Guardrail Plausibility` as the most useful current structural check.
- Treat `Adoption Context Plausibility` as the best current outer-layer check on whether the model is over- or under-stating organizational AI conversion relative to observed sector uptake.
- Treat `Recomposition Context Plausibility` and `Wave Timing Plausibility` as the best current checks on whether workflow compression, organizational conversion, and displacement timing are directionally plausible.
- Treat `Role Heterogeneity Plausibility` as the best current check on whether the model is making an occupation look too uniform or too split.
- Treat `Individual AI Usage Plausibility` as a weak annotation layer, not a scoring target. It surfaces occupations where observed individual Claude usage diverges materially from the model's org-level adoption context. `individual_higher` gaps are the more actionable pattern: they suggest workers are using Claude more than the model's structural adoption signal implies, which may indicate the adoption-realization estimate is lagging. `org_higher` gaps are less actionable: they typically reflect organizational AI workflow rollout that is not yet translating into individual usage.
- Treat `Demand Context Plausibility` and `Wage Leverage Plausibility` as weak calibration layers that can surface suspicious outliers, not as truth labels.
- Occupations with repeated high-priority gaps should be reviewed at the layer that likely caused the disagreement: function anchors, accountability weights, task evidence coverage, or role-shape assumptions.

## Next Data Upgrades

- Extend ORS coverage or mapping so fewer launch occupations remain unscored on the strongest human-guardrail check.
- Use the new BTOS review queue to decide whether adoption-realization tuning should remain calibration-only or graduate into a later controlled runtime parameter review.
- Refresh `O*NET` after the current official calibration layers are stable, so structural tuning is not confounded with a database-version jump.
- Consider whether the ACS heterogeneity layer is strong enough to justify future multi-variant occupation modeling rather than one default role shape per occupation.
- Review high-priority `individual_higher` cases from the Individual AI Usage check as candidates for adoption-realization tuning. Do not replace `ai_adoption_context` with the individual usage signal — they measure different phenomena.
- Once the current calibration layers are stable, check whether a later AEI release provides more complete occupation-level individual usage coverage than the current 34-occupation subset.

