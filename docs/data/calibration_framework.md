# Calibration Framework

## Scope

This document is the canonical reference for the empirical calibration layer.

It does not define the live runtime score.

It defines how external or non-runtime data should be used to check, pressure-test, and tune the live model.

## Why This Layer Exists

The live model makes forward-looking claims about role transformation.

Those claims should not be "validated" directly against current job loss or raw employment changes because those outcomes are heavily confounded by:
- macroeconomic cycles
- industry-specific demand
- hiring freezes
- firm strategy
- measurement lag
- non-AI productivity changes

So the calibration layer is aimed at structural plausibility, not direct labor-displacement proof.

## Current Principle

Use external or non-runtime data in three ways:

1. structural calibration
   - checks whether the model's retained-human and role-shape logic is directionally plausible
2. contextual calibration
   - checks whether demand and labor-market context strongly disagree with the model
3. review prioritization
   - identifies occupations where the model likely needs manual review or data upgrades

Do not use this layer to directly drive runtime task scores unless a source is later promoted into the live scoring stack.

Current promoted runtime context layers:
- `occupation_demand_adoption_context.csv`
- `occupation_individual_ai_usage_context.csv` (narrow promotion for present-day transformed-share anchoring only)
- `occupation_recomposition_context.csv`
- `occupation_function_context.csv`

These are derived outer-layer runtime inputs.
They constrain demand/adoption, recomposition/timing, function-level retention metrics, and the present-day transformed-share floor.
They do not directly change task automability or task-level evidence resolution.

## Current Calibration Checks

### 1. Human Guardrail Plausibility

Purpose:
- check whether the model's retained human/accountability layer is directionally plausible

Current target:
- `human_constraint_target`

Current data:
- `data/normalized/occupation_ors_structural_context.csv`
- `data/normalized/occupation_quality_indicators.csv` (confidence supplement only)

Current formula:
- ORS signal:
  - `human_constraint_index` from `occupation_ors_structural_context.csv`
  - that normalized index is itself derived from:
    - `0.40 * autonomy_intensity`
    - `0.30 * supervising_others_share`
    - `0.20 * inverse_pace_constraint_intensity`
    - `0.10 * pause_control_share`
- target when ORS exists:
  - `ors_human_constraint_signal`
- when ORS is missing:
  - the occupation is currently left unscored for this strongest check rather than being collapsed back into a weaker proxy target

Compared against:
- `0.60 * retained_accountability_strength`
- `0.40 * retained_function_strength`

Current strength:
- strong

Reason:
- ORS is now the main structural check for this layer and is materially better grounded than the old quality-only proxy, but some launch occupations still lack usable ORS rows and are therefore left unscored until coverage improves

### 2. Demand Context Plausibility

Purpose:
- check whether the model's demand-expansion layer looks directionally implausible relative to current labor-market context

Current target:
- `demand_context_target`

Current data:
- `data/normalized/occupation_labor_market_context.csv`

Current formula:
- `0.55 * projection_growth_percentile`
- `0.25 * openings_rate_percentile`
- `0.20 * inverse_unemployment_percentile`

Compared against:
- `demand_expansion_signal`

Current strength:
- weak

Reason:
- these are context variables, not causal evidence of AI-driven demand effects

### 3. Wage Leverage Plausibility

Purpose:
- check whether the model's retained bargaining-power layer is obviously out of line with broad wage context

Current target:
- `wage_leverage_target`

Current data:
- `data/normalized/occupation_labor_market_context.csv`

Current formula:
- `0.75 * median_wage_percentile`
- `0.25 * wage_dispersion_percentile`

Compared against:
- `retained_bargaining_power`

Current strength:
- weak

Reason:
- wage level is only a coarse proxy for bargaining power and should never be treated as direct proof

### 4. Routine Pressure Plausibility

Purpose:
- check whether the model's pressure and compressibility layers are directionally plausible relative to routine share and occupational complexity

Current target:
- `routine_pressure_target`

Current data:
- `data/normalized/occupation_adaptation_priors.csv`

Current formula:
- `0.55 * routine_share`
- `0.20 * inverse_job_zone`
- `0.15 * inverse_people_share`
- `0.10 * inverse_learning_intensity`

Compared against:
- `0.60 * direct_exposure_pressure`
- `0.40 * workflow_compression`

Current strength:
- medium

Reason:
- this is still a derived target, but it is much closer to the model's structural claim about routine/compressible work than labor-market outcome proxies

### 5. Specialization Resilience Plausibility

Purpose:
- check whether the model's retained-function and retained-bargaining layers are directionally plausible relative to occupational complexity and knowledge intensity

Current target:
- `specialization_resilience_target`

Current data:
- `data/normalized/occupation_adaptation_priors.csv`

Current formula:
- `0.30 * adaptive_capacity_score`
- `0.25 * learning_intensity_score`
- `0.20 * transferability_score`
- `0.10 * normalized_job_zone`
- `0.15 * knowledge_share`

Compared against:
- `0.45 * retained_function_strength`
- `0.35 * retained_bargaining_power`
- `0.20 * function_retention`

Current strength:
- medium

Reason:
- this is not a pure external benchmark, but it is structurally closer to retained-role resilience than wage level alone

### 6. Recomposition Context Plausibility

Purpose:
- check whether the model's workflow-compression and organizational-conversion layer is directionally plausible relative to the new derived recomposition context

Current target:
- `recomposition_context_target`

Current data:
- `data/normalized/occupation_recomposition_context.csv`

Current formula:
- `0.55 * workflow_compression_context`
- `0.45 * organizational_conversion_context`

Compared against:
- `0.55 * workflow_compression`
- `0.45 * organizational_conversion`

Current strength:
- medium

Reason:
- this is still a derived target, but it is closer to the live recomposition claim than the older demand-only outer checks because it uses adaptation structure plus the promoted runtime demand/adoption context layer

### 7. Wave Timing Plausibility

Purpose:
- check whether the model's timing frontier is directionally plausible relative to the derived recomposition/timing context

Current target:
- `wave_timing_target`

Current data:
- `data/normalized/occupation_recomposition_context.csv`

Current formula:
- `0.60 * next_scenario_lift`
- `0.25 * distant_scenario_lift`
- `0.15 * organizational_adoption_ceiling`

Compared against:
- `timing_frontier.primary_wave_score`

Current strength:
- medium

Reason:
- this is still a derived timing target, but it now compares the occupation timing context to a continuous frontier-derived runtime score instead of to a raw displacement-wave bucket; that change is what pulled the timing audit back into the same range as the stronger shared checks

### 8. Role Heterogeneity Plausibility

Purpose:
- check whether the model is making an occupation look too uniform or too split relative to observed within-occupation heterogeneity

Current target:
- `role_heterogeneity_target`

Current data:
- `data/normalized/occupation_heterogeneity_context.csv`
- `data/normalized/occupation_adaptation_priors.csv`

Current formula:
- ACS heterogeneity signal:
  - `0.35 * industry_dispersion`
  - `0.25 * education_dispersion`
  - `0.20 * worker_mix_dispersion`
  - `0.20 * wage_dispersion_percentile`
- fragmentation-pressure blend:
  - `0.60 * acs_heterogeneity_signal`
  - `0.40 * inverse_people_share`
- scaled target:
  - `0.05 + 0.40 * fragmentation_pressure_blend`

Compared against:
- `role_fragmentation_risk`

Current strength:
- medium

Reason:
- ACS PUMS gives a real external read on within-occupation spread, but heterogeneity is still not identical to fragmentation, so the current target is deliberately scaled into a lower fragmentation-pressure range and conditioned on people intensity rather than treated as a one-to-one truth label

Current review conclusion:
- the first implemented reviewed role-variant set is concentrated in content and analysis-heavy occupations where the work bundle is structurally diverse without being primarily people-intense
- the current implemented set is:
  - `Accountants and Auditors`
  - `Editors`
  - `Market Research Analysts and Marketing Specialists`
  - `Management Analysts`
  - `News Analysts, Reporters, and Journalists`
  - `Technical Writers`
  - `Web Developers`
- watchlist rather than immediate split candidates:
  - `Operations Research Analysts`
- no occupation currently clears the strong-candidate threshold beyond the implemented set
- the more common middle state is now a richer default function graph without explicit runtime variants
- that middle state is currently the better fit for occupations like `Financial and Investment Analysts`, `Computer Systems Analysts`, and `Software Developers`

## Current Outputs

The calibration scaffold and adjacent context builders currently write:
- `data/normalized/occupation_ors_structural_context.csv`
- `data/normalized/occupation_heterogeneity_context.csv`
- `data/normalized/occupation_industry_mix.csv`
- `data/normalized/occupation_btos_sector_mix.csv`
- `data/normalized/industry_ai_adoption_context.csv`
- `data/normalized/occupation_demand_adoption_context.csv`
- `data/normalized/occupation_recomposition_context.csv`
- `data/normalized/occupation_structural_calibration_targets.csv`
- `data/normalized/occupation_role_shape_review.csv`
- `docs/data/structural_calibration_report.md`
- `docs/data/role_shape_review.md`

Generated by:
- `scripts/data/normalize_ors.py`
- `scripts/data/normalize_acs_pums.py`
- `scripts/data/normalize_btos.py`
- `scripts/data/build_occupation_demand_adoption_context.js`
- `scripts/data/build_occupation_recomposition_context.js`
- `scripts/data/run_structural_calibration_report.js`
- `scripts/data/run_role_shape_review.js`

The generated target table now also includes:
- `highest_review_tier`
- `primary_review_layer`
- `primary_review_strength`
- `primary_review_score`
- `primary_review_reason`

Those fields are not runtime inputs.
They exist so calibration disagreements can be routed to the right tuning layer instead of being handled as generic "the model seems off" feedback.

The generated markdown report also summarizes which review layers recur most often across occupations so recurring tuning problems are easy to spot.
It now also separates the strongest medium-strength structural queue from weaker contextual queues so review effort is not dominated by the noisiest proxy.
The role-shape review pass now also converts the heterogeneity queue into an explicit candidate list for reviewed role-variant work, so that review no longer depends on ad hoc session notes.

This layer has already informed one runtime tuning pass:
- repeated bargaining-power mismatches in routine and support-heavy roles led to a recalibration of the live `retained_bargaining_power` formula
- the calibration data still stays outside runtime; it was used to diagnose the layer, not piped in as a direct score input

It has now informed a second runtime tuning pass:
- once the queue became strength-aware, routine/admin-heavy occupations surfaced as the strongest medium-strength structural mismatch
- that led to a recalibration of routine-task reachability and workflow compression using the existing adaptation layer's routine context

It has now informed a third pass (2026-03-27 mathematical audit):
- `buildTrajectoryStructuralNecessity` weights summed to 1.10 instead of 1.00, compressing the top 9% of the score range into the ceiling; corrected to sum to 1.00
- `buildStateFocusReallocation` positive weights summed to 1.04; corrected to 1.00
- `roleIntegrity` positive weights summed to 0.92, making 1.0 unreachable; rebalanced to 1.00, compression asymmetry reduced from 4.9x to ~3x
- human advantage effective weight was 8.75% due to double-scaling; restored to declared 25%
- bottleneck risk compression multiplier could reach 1.40, saturating the score and drowning out additive nuance terms; capped at 1.0
- Dirichlet posterior in `normalizeTaskWeights` did not correct when prior base shares summed to less than 1.0; now normalizes posterior to sum to 1.0
- single-cluster coherence defaulted to 0.5 instead of near-1.0; corrected to 0.92 for the no-cross-dependency case
- 9 occupations silently received neutral presets due to key normalization mismatch; aliases added plus new `marketing` and `communications` presets
- state forecast share normalization denominator/numerator clamping mismatch caused shares to sum to slightly less than 1.0; corrected

A continuation pass (2026-03-28) addressed four more issues found by a second sweep:
- `buildStateFirmIncentive` base weights summed to 1.06; corrected to 1.00 by reducing bottleneck and inverse-dimensionality terms
- `assistMargin` positive weights summed to 0.90; corrected to 1.00 by adding a delegationLikelihood term and increasing capabilityReadiness and augmentationFit
- `structuralBreakMargin` positive weights summed to 0.92; corrected to 1.00 by increasing headcountDisplacementRisk, directExposure, and organizationalReadiness
- `clamp()` silently passed NaN through via Math.max/Math.min; added an explicit NaN guard returning `min` to prevent silent score corruption

It has now also informed a shared-function calibration pass focused on recurring queue patterns rather than one-off reviewed-anchor fixes:
- the repeated clerical/support `wage_leverage` overreads were traced back to a bargaining-power floor set too heavily by `weightedRetainedLeverage`; the live runtime now lowers that raw-leverage weight and shifts more of the metric into function-level bargaining retention, weighted bargaining structure, and retained accountability
- the remaining high-authority manager queue showed that hierarchy/profile effects alone were not enough to preserve owner-heavy seats; the live runtime now adds a narrower conditional people/authority lift inside retained accountability rather than a blanket hierarchy shield
- the remaining timing/template queue showed that `intactness_break` and `compression_overtakes_offset` were still firing too early for too many roles; the live runtime now requires stronger transformed-share and transition-pressure evidence before those tipping points appear
- knowledge-heavy drafting, documentation, and analysis work now also receives a modest routine-pressure damp so the task-pressure layer does not flatten content and creative roles into clerical-style compression reads

A narrower structural-pressure follow-up then kept only the part that survived the next full audit:
- drafting, documentation, and research-synthesis work can now contribute a bounded share into `routine_high_pressure_share` when that work is already under meaningful direct pressure in lower-people, knowledge-heavy roles
- that kept change improved `routinePressureCorrelation` without degrading the stronger human-guardrail check, while only modestly softening the weak wage-leverage proxy

It has now also informed a long reviewed-function cleanup pass:
- repeated accountability mismatches justified richer supplemental anchors and narrower occupation-level guardrail corrections
- that pass materially improved the ORS-backed human-guardrail check, but the remaining queue is now mixed enough that broad formula tuning is no longer the right default
- the latest contained reviews suggest `General and Operations Managers` and `Computer Systems Analysts` should currently be held rather than treated as fresh missing-anchor cases

## How To Use This Layer

1. run the calibration report
2. inspect rank correlations and largest disagreements
3. use the generated review-layer recommendation to decide which model layer to inspect first
4. review occupations with repeated high-priority mismatches
5. tune the layer that likely caused the mismatch

Likely tuning layers:
- function anchors
- accountability guardrails
- task evidence coverage
- task-to-function weights
- role-shape assumptions

Do not jump straight to changing top-level labels without finding the causal layer underneath.

## What Is Not Yet Honest To Claim

Do not claim that this framework currently validates:
- direct AI-caused headcount reduction
- realized AI displacement by occupation
- net demand effects from AI
- exact future role collapse timing

That is outside the scope of the current empirical layer.

## Best Next Data Upgrades

Priority upgrades:
- controlled `O*NET 30.2` refresh after the current official calibration layers are stable

Implemented official calibration layer:
- `BLS ORS` is now integrated as `occupation_ors_structural_context.csv`
- current ORS-derived fields emphasize autonomy, supervisory responsibility, and pace-control structure because those aligned most cleanly with the model’s retained-accountability claim
- ORS still remains calibration-only; it does not directly change runtime task scores
- `ACS PUMS` is now integrated as `occupation_heterogeneity_context.csv`
- current ACS-derived fields emphasize within-occupation wage dispersion, education dispersion, industry dispersion, and worker-mix spread
- the live heterogeneity check scales that ACS signal into a lower fragmentation-pressure target and conditions it on lower people intensity before comparing it to `role_fragmentation_risk`
- ACS still remains calibration-only; it does not directly change runtime task scores
- `occupation_industry_mix.csv` remains as the broader ACS occupation-by-industry context table
- `occupation_btos_sector_mix.csv` is now emitted from the same ACS pass as the direct bridge into BTOS sector context
- `BTOS` is now integrated as `industry_ai_adoption_context.csv`
- current BTOS-derived fields emphasize current AI use, planned AI use, task-substitution intensity, workflow-change intensity, and LLM use at the sector layer
- the live adoption check maps that BTOS signal into the model’s organizational-conversion range before comparing it to the model’s adoption-realization surface
- BTOS still does not directly change runtime task scores
- `occupation_demand_adoption_context.csv` is now derived from:
  - `occupation_labor_market_context.csv`
  - `occupation_btos_sector_mix.csv`
  - `industry_ai_adoption_context.csv`
- that derived table is now a runtime outer-layer input for:
  - `demand_expansion_context`
  - `labor_demand_context`
  - `labor_tightness_context`
  - `ai_adoption_context`
  - `adoption_realization_context`
- this promotion is intentionally narrow:
  - it affects demand expansion and organizational conversion
  - it does not affect task automability or task-level evidence resolution
- `occupation_recomposition_context.csv` is now derived from:
  - `occupation_adaptation_priors.csv`
  - `occupation_demand_adoption_context.csv`
- that derived table is now a runtime outer-layer input for:
  - `workflow_compression_context`
  - `organizational_conversion_context`
  - `wave_acceleration_context`
  - `displacement_wave_bias`
- this promotion is also intentionally narrow:
  - it affects recomposition and timing
  - it does not affect task automability or task-level evidence resolution

Until the next calibration layers are integrated, the current calibration layer should be treated as:
- useful
- honest
- partial

not:
- definitive
- outcome-validating
- final

## Next Official Integrations

Autoresearch status checked on `2026-03-13`:
- `BLS ORS` official public-use data is now integrated through a `2025` preliminary release with `2023` backstop coverage for the launch occupation set.
- `ACS PUMS` official `2024 ACS 1-year` microdata is now integrated through the Census API for the launch occupation set.
- `BTOS` official AI/business-condition context is now integrated through ACS sector mix as both:
  - a calibration adoption-context layer
  - and a derived runtime outer-layer adoption-realization context
- `O*NET` has moved beyond the repo's current `30.1` footing, but that should be handled as a separate controlled refresh after the next calibration layers are in place.

Recommended build order:
1. review how the new runtime demand/adoption context behaves against the BTOS adoption queue and decide whether any further adoption-realization fitting is warranted
2. use the remaining accountability and bargaining queues to decide where richer supplemental anchors are still justified and where the disagreement is mostly a proxy limit
3. `O*NET 30.2` refresh after the stronger calibration layers are stable and the first reviewed role-variant layer has settled

Current BTOS normalized tables:
- `industry_ai_adoption_context.csv`
  - purpose: sector adoption context for calibration and for the derived runtime occupation adoption layer
- `occupation_btos_sector_mix.csv`
  - purpose: ACS-derived occupation sector bridge for BTOS joins
- `occupation_demand_adoption_context.csv`
  - purpose: occupation-level runtime demand/adoption context derived from BLS plus ACS x BTOS

Current role-shape review outputs:
- `occupation_role_shape_review.csv`
  - purpose: generated occupation-level candidate table for reviewed role-variant expansion
- `role_shape_review.md`
  - purpose: human-readable summary of strong candidates and watchlist occupations for further reviewed role-variant work

Promotion rule:
- keep new outer-layer sources out of task-level scoring first
- promotion into runtime is acceptable only when the source is:
  - aggregated back to the occupation level
  - clearly separated from task automability
  - interpretable as demand or adoption realization rather than task capability
- this is now the rule the new `occupation_demand_adoption_context.csv` layer follows

## Current Holistic Reading

The calibration layer is now strongest at telling the repo three things:

1. where human-guardrail logic is directionally credible
2. where a role is still too structurally flat
3. where the model is probably disagreeing with a weak proxy rather than revealing a clean runtime bug

Current practical read:
- `Human Guardrail Plausibility` is the strongest current calibration surface and should remain the main structural review queue.
- `Routine Pressure Plausibility` is now strong enough to justify contained runtime tuning when the remaining queue is clearly concentrated in routine/admin-heavy work.
- `Role Heterogeneity Plausibility` is now strong enough to justify holding the current reviewed variant set steady until a new occupation clearly clears the bar.
- `Adoption Context Plausibility` remains an outer audit layer first, but the model now also uses a derived occupation-level demand/adoption context row at runtime to inform demand expansion and organizational conversion without changing task scores.
- `Wage Leverage Plausibility` remains useful for spotting suspicious support-role overcalls, but it is still too weak to act as a direct runtime target.
