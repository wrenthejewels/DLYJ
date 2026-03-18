# Current Model Working Plan

## Read This First

This is the canonical living planning and handoff document for the current model.

A new session should read this document first to understand:
- what the live product is now
- what has already been implemented
- what the current model stack looks like
- what still needs to be done next

Supporting docs:
- `docs/README.md` = documentation entrypoint and source-of-truth routing
- `docs/v2_0_questionnaire_spec.md` = current intake and questionnaire contract
- `docs/v2_0_results_spec.md` = current result object and UI/result contract
- `docs/data/calibration_framework.md` = current empirical calibration / validation framework
- `docs/model_build_history.md` = plain-speak history of how the model evolved

## Documentation Structure

Keep this file as the one central planning and handoff doc.

Recommended doc roles:
- `docs/README.md` = first stop for doc routing and precedence
- `docs/role_transformation_overhaul_plan.md` = canonical current-state, roadmap, and next-steps document
- `docs/v2_0_questionnaire_spec.md` = supporting intake and questionnaire reference
- `docs/v2_0_results_spec.md` = supporting output/result contract reference
- `docs/data/calibration_framework.md` = canonical calibration-layer reference
- `docs/model_build_history.md` = plain-speak history and future writing input

Recommended merge decision:
- do not merge the questionnaire or results specs into this file, because they work better as narrow contract docs
- do not create a second top-level roadmap or release snapshot doc
- if future planning notes are created, fold them back into this file instead of creating another top-level roadmap

Update rule:
- update this file whenever the live model, roadmap, or implementation status materially changes
- update `docs/model_build_history.md` when the change is architecturally meaningful enough to matter for the model narrative

## Current Live Surface

Current live pages:
- `/` = model
- `/guide` = guide
- `/method` = methodology

Archived pages:
- `archive/legacy-pages/` = older model/guide/method surfaces kept for reference
- `archive/route-aliases/` = older `*2` / `*3` route snapshots and aliases

## Current Live Model Summary

The live model is a role-fate model built on top of:
- a mapped occupation anchor
- an occupation task inventory
- a task-role graph with dependency edges
- a task-source evidence resolver spanning live task evidence, reviewed task estimates, benchmark task labels, and proxy fallback
- a hybrid task-pressure stack where cluster priors still provide the fallback difficulty anchor, but strong resolved task evidence can now shift cluster baselines and blend into task-level automation difficulty and task-level direct pressure
- a structured role-refinement profile derived from the questionnaire
- labor-market context as a supporting layer

The live model currently outputs:
- a role-fate label
- a wave trajectory
- a staged role-building walkthrough on the main page
- a task-level breakdown
- a recomposition summary
- evidence and occupation-assignment summaries
- an editable role composition layer built from source-bucketed tasks and function anchors

Current live explanation / presentation surfaces:
- the model page now uses a staged walkthrough instead of the older dashboard-style results stack
- the model page now exposes a stronger audit surface, including edit-impact summaries, task/function/evidence trace detail, and a technical appendix behind progressive disclosure
- the guide page now includes a live `34`-occupation default-settings comparison chart:
  - it batch-runs the live engine in the browser on page load
  - it uses explicit default settings (`Level 3`, default role-family questionnaire preset, no composition edits, reviewed variants on auto)
  - it lets the user swap X/Y metrics without relying on a static exported image or hand-maintained snapshot
  - it is explanatory only and does not alter runtime scoring on the main model page

Current live role-fate labels:
- `AI-supported role stays intact`
- `Same work, fewer people`
- `Less execution, more judgment`
- `Splits into execution and oversight tiers`
- `AI increases demand for the role`
- `Core role breaks down`
- `Mixed signals, path still unclear`

## First-Pass Implementation Status

Implemented on `2026-03-10`:
- `job_description_task_evidence.csv`
- `role_functions.csv`
- `occupation_function_map.csv`
- `task_function_edges.csv`
- `function_accountability_profiles.csv`
- `task_source_evidence.csv`
- `occupation_source_priors.csv`
- `occupation_role_transformation.csv`
- `occupation_role_explanations.csv`

Implemented on `2026-03-13`:
- phase-1 direct task-evidence blending in the live browser scorer:
  - cluster priors still provided the baseline task-difficulty model
  - reliable resolved task evidence now blends into `direct_exposure_pressure` at the task row level
  - low-reliability task evidence remains confidence/coverage metadata only
- phase-2 task-derived cluster summaries in the live browser scorer:
  - public cluster surfaces now aggregate from scored task rows rather than the pre-task cluster bundle
  - `top_exposed_work` and `transformation_map` now reflect task-level pressure and spillover
- phase-3 task-derived wave engine in the live browser scorer:
  - reliable resolved task evidence now also blends into task-level `automation_difficulty`
  - task-derived cluster summaries now carry task-aggregated difficulty, absorption rate, and wave assignment
  - `wave_trajectory` and `primary_displacement_wave` are now recomputed from the task-derived cluster bundle rather than preserved from the pre-task cluster bundle
- phase-4 task-source evidence resolver in the live browser scorer:
  - `task_source_evidence.csv` now drives task-level evidence resolution at runtime
  - `live_task_evidence`, `reviewed_task_estimate`, and `benchmark_task_label` can all promote into the live task score before proxy fallback
  - proxy rows remain visible and can still backstop unresolved tasks, but they no longer block reviewed or benchmark task-level evidence from affecting the score
- phase-5 coverage-aware task-first cluster baselines in the live browser scorer:
  - cluster baselines can now shift toward resolved task evidence when a cluster has enough task-level evidence coverage and reliability
  - the public diagnostics now report how many cluster baselines used this task-first path
  - this is still a hybrid baseline, not yet a pure per-task prior model
- phase-6 task-first task baselines in the live browser scorer:
  - high-reliability task rows can now promote into `task_first_resolved_evidence` instead of only inheriting a cluster-seeded baseline
  - task-level baseline promotion now reduces the remaining task-evidence blend weight so the same evidence is not double-counted
  - public diagnostics now report how many task rows used this task-first task path
  - the promotion gate is now source-aware and mapping-confidence-aware so reviewed/live evidence can promote more readily than benchmark-only evidence
- phase-7 structural calibration scaffold:
  - `scripts/data/run_structural_calibration_report.js` now generates a non-runtime structural calibration target table and disagreement report
  - the first calibration layer compares live outputs against local quality-context, BLS labor-context, and adaptation-prior structural proxies
  - the generated calibration table and report now also recommend which model layer to review first when an occupation shows a meaningful mismatch
  - the review routing is now strength-aware so medium-strength structural mismatches can outrank weaker contextual proxies when triaging next tuning work
  - this layer is for review and tuning only, not direct runtime scoring
- phase-8 calibration-informed bargaining-power tuning:
  - the structural calibration queue surfaced a repeated overstatement in retained bargaining power for routine and support-heavy roles
  - the live scorer now derives `retained_bargaining_power` more from pressure-adjusted retained task leverage and less from raw bargaining-weight averages
  - support-heavy and routine-heavy work under high pressure now explicitly drags that metric down
- phase-15 specialization-aware bargaining-power tuning:
  - after the accountability queue was narrowed, the remaining bargaining queue showed a second pattern: support-heavy roles still sat too high while knowledge-heavy technical roles sat too low
  - the live scorer now adds a centered specialization lift from adaptation-layer knowledge share, learning intensity, and adaptive capacity
  - this lets high-knowledge, high-learning roles keep more bargaining power without restoring the earlier overstatement for routine support work
- phase-17 occupation-specific bargaining cleanup:
  - the remaining weak bargaining queue still showed a low-scarcity overstatement in `Customer Service Representatives`, `Bookkeeping Clerks`, and `Statistical Assistants`
  - instead of changing the runtime formula again, the reviewed function layer was corrected so those occupations no longer inherit too much bargaining retention, authority, or guardrail from generic function defaults
  - this improved the wage-leverage and specialization-resilience calibration layers while preserving the stronger technical-role lift added in the prior bargaining pass
- phase-9 calibration-informed routine-pressure tuning:
  - the strength-aware calibration queue surfaced a stronger structural miss in routine/admin-heavy occupations
  - the live scorer now uses adaptation-derived routine context to lift routine-task reachability and workflow compression for structurally routine, low-people-intensity roles
  - that lift is concentrated in execution, workflow-admin, documentation, and secondarily drafting-heavy bundles rather than applied uniformly across all work
- phase-16 routine-admin task-pressure tuning:
  - the remaining routine-pressure misses were concentrated in admin-heavy occupations whose core workflow-admin and documentation tasks were still being pulled down too far by direct task evidence
  - the live scorer now gives structural routine context more weight in the direct-pressure baseline for workflow-admin and documentation work, especially when that work is core to the role
  - the same structural routine context now also dampens how much direct task evidence can pull those admin-heavy task rows down, which improved the routine-pressure calibration layer without changing the task-first evidence architecture
- phase-10 official ORS calibration integration:
  - `scripts/data/normalize_ors.py` now derives `occupation_ors_structural_context.csv` from official BLS ORS `2025` preliminary data with `2023` backstop coverage
  - the human-guardrail calibration target is now primarily ORS-driven, using autonomy, supervisory responsibility, and pace-control structure rather than the older quality-only proxy
  - ORS remains calibration-only and is not a direct runtime scoring input
- phase-11 official ACS PUMS heterogeneity integration:
  - `scripts/data/normalize_acs_pums.py` now derives `occupation_heterogeneity_context.csv` from official `2024 ACS 1-year PUMS` Census API queries for the launch occupation set
  - the calibration layer now includes a role-heterogeneity / fragmentation check built from ACS wage dispersion, education dispersion, industry dispersion, and worker-mix spread
  - that ACS signal is scaled into a lower fragmentation-pressure target and conditioned on lower people intensity before it is compared with `role_fragmentation_risk`
  - ACS remains calibration-only and is not a direct runtime scoring input
  - the same ACS pass now also derives `occupation_industry_mix.csv` and `occupation_btos_sector_mix.csv` so BTOS sector context can join back to occupations through observed ACS worker mix
- phase-12 official BTOS adoption-context integration:
  - `scripts/data/normalize_btos.py` now derives `industry_ai_adoption_context.csv` from the official Census `AI_Supplement_Table.xlsx` download
  - the structural calibration layer now includes an adoption-context check built from BTOS sector AI-use and deployment-change estimates, joined back to occupations through `occupation_btos_sector_mix.csv`
  - that BTOS signal is rescaled into the model’s organizational-conversion range before it is compared to the live adoption-realization surface
  - BTOS is not a direct task-scoring input; it now reaches runtime only through the later derived occupation-level demand/adoption context layer
- phase-13 role-shape review scaffold:
  - `scripts/data/run_role_shape_review.js` now derives `occupation_role_shape_review.csv` and `docs/data/role_shape_review.md` from the structural calibration layer
  - this pass turns the heterogeneity queue into a stable candidate list for future multi-variant occupation modeling
  - the current strong candidates match the earlier manual review: `Market Research Analysts and Marketing Specialists`, `Editors`, `Technical Writers`, `News Analysts, Reporters, and Journalists`, and `Management Analysts`
  - the original watchlist was `Web Developers` and `Operations Research Analysts`
- phase-14 reviewed role-variant runtime support:
  - `occupation_role_variants.csv` now defines reviewed baseline role variants for the first heterogeneous launch occupations
  - the live browser scorer can now recommend a reviewed variant from the questionnaire profile plus the current role mix, while still allowing explicit user override
  - the reviewed occupations using this path are `Market Research Analysts and Marketing Specialists`, `Editors`, `Technical Writers`, `News Analysts, Reporters, and Journalists`, `Management Analysts`, `Web Developers`, and `Accountants and Auditors`
  - task and function editing still remain the final runtime authority after the reviewed variant baseline is chosen
- phase-24 routine pressure calibration formula fix:
  - diagnosed that `modelRoutinePressure` in the calibration script was using `direct_exposure_pressure * 0.60 + workflow_compression * 0.40`, which conflates AI pressure on knowledge work (Software Developers) with structural routine-ness (Secretaries, Office Clerks)
  - updated `modelRoutinePressure` to `0.50 * (routine_high_pressure_share * 0.55 + workflow_compression * 0.45) + 0.50 * (1 - labor_intensity_proxy)` where labor_intensity_proxy mirrors the wage leverage formula
  - this distinguishes "routine role under pressure" (Secretaries: high routine_high_pressure_share, low labor_intensity) from "knowledge role under different pressure" (Software Developers: low routine share, high labor_intensity)
  - result: routinePressureCorrelation 0.697→0.702 (+0.005); task_pressure queue dropped off top-3; specializationResilienceCorrelation improved to 0.614 (+0.043) as side effect of phase-23 lift
  - note: this is a calibration measurement fix, not a change to the engine scoring formula

- phase-23 bargaining power scarcity lift via superlinear specialization term:
  - diagnosed structural ceiling in function context approach (max 28% blend → Data Scientists limited to ~0.74 vs target 0.88)
  - added a superlinear bonus term to the bargaining power formula: `max(0, specializationContext - 0.72) * 0.22` activates only for genuinely high-specialization roles and adds 0.029–0.046 lift for Data Scientists, Software Developers, Lawyers, Engineers
  - also increased the linear specialization coefficient from 0.16 to 0.22 for a broader lift
  - net effect: wageLeverageCorrelation 0.781 → 0.808 (+0.027); bargaining_power dropped off the top-3 review queue
  - remaining absolute gaps for Data Scientists/Lawyers reflect a measurement difference — the model measures structural task-level bargaining power while ACS wages measure market scarcity premium; these can differ for scarce roles where demand expansion outpaces automation

- phase-22 recomposition context blend weight and formula update:
  - build script (`build_occupation_recomposition_context.js`): AI adoption weights 0.18→0.24 each, offset by reducing structural penalty weights (knowledge 0.10→0.06, jobZone 0.08→0.04) — makes the formula more responsive to AI adoption signals rather than penalizing high-knowledge/high-zone roles
  - engine (`v2_engine.js`): workflowCompression blend weight 22%→32% (both occurrences); gives outer context more influence on the final compression output
  - net effect: recompositionContextCorrelation 0.852 → 0.885 (+0.033); waveTimingCorrelation −0.006 (acceptable)
  - content/writing roles (Editors, Journalists, Writers) moved meaningfully toward calibration targets; remaining gap reflects that even 32% blend cannot overcome base calculations that underestimate compression for AI-intensive content work

- phase-21 Sep 2025 AEI window task evidence integration:
  - September 2025 release (Aug 4–11 2025 window) downloaded and processed as `src_anthropic_ei_sep_2025_window`
  - Coverage analysis: 2,618 GLOBAL onet_task_count rows; 2,616 match to O*NET IDs; 176 overlap with our 34-occupation inventory; 8 had no prior evidence and were added
  - Newly covered occupations: Logisticians, Training and Development Specialists, Computer Systems Analysts, Operations Research Analysts, Mechanical Engineers, Lawyers, Secretaries and Administrative Assistants, Office Clerks (one task each)
  - The other 2,440 uncovered Sep 2025 tasks belong to occupations outside our 34-occupation set — Jan 2026 remains the primary window for our modeled occupations
  - `job_exposure.csv` (March 2026) normalized into `occupation_individual_ai_usage_context.csv` as a calibration reference: 19 occupations flagged as "review" (gap >0.25), pattern splits into org-higher (BTOS adoption overstates) and individual-higher (workers using Claude more than org adoption context implies, notably Customer Service Reps, Office Clerks, Admin Assistants, Financial Analysts)

- phase-20 AEI labor market follow-up task evidence integration:
  - `task_penetration.csv` and `job_exposure.csv` from `labor_market_impacts/` (March 6, 2026) downloaded and registered as `src_aei_labor_market_2026_03`
  - 13 tasks with economy-wide penetration >0.01 and no prior evidence added to `task_exposure_evidence.csv` and `task_source_evidence.csv`; spans Compliance Officers, Project Management Specialists, Software Developers, Web Developers, Data Scientists, and Sales Representatives of Services (7 tasks)
  - confidence set at 0.45 (lower than direct AEI; penetration is economy-wide not occupation-specific); source_role is `benchmark_task_label` so it cannot outrank existing live_task_evidence
  - `job_exposure.csv` registered as calibration reference only; large divergences from `ai_adoption_context` noted (Customer Service Reps 0.70 vs 0.16, Software Developers 0.29 vs 0.85) but not yet integrated — the two signals measure different things (individual Claude usage vs. organizational workflow adoption)
  - 360 tasks in inventory gain their first signal from task_penetration.csv of which 347 have zero penetration, confirming the cluster-prior fallback is appropriate for those tasks; 13 are genuinely newly covered

- phase-19 empirically-grounded FRICTION_WEIGHTS update:
  - previous weights placed `accountability_load` first (0.25), with `judgment_requirement` and `tacit_context_dependence` equal and lower (0.22 each)
  - Dallas Fed research (February 2026) found wages rising specifically in AI-exposed occupations requiring tacit knowledge and experience, while employment declined where those qualities were absent — direct empirical evidence that tacit context is the friction dimension that protects roles in practice
  - OECD AI-WIPS (November 2024) job-posting analysis found originality (maps to judgment requirement) saw the largest skill demand increase in high-AI-exposure occupations — corroborating the Dallas Fed signal from a different methodology
  - updated weights: `tacit_context_dependence` 0.22→0.28, `judgment_requirement` 0.22→0.26, `accountability_load` 0.25→0.18, `exception_burden` 0.18→0.15, `inverse_document_intensity` unchanged at 0.13
  - net effect: tacit + judgment (0.54 combined) now outweigh accountability + exception (0.33 combined), reversing the previous ordering
  - methodology page updated with empirical grounding explanation; guide page updated with the build narrative

- phase-18 AEI-calibrated cluster friction update for documentation and drafting:
  - OLS regression across 324 AEI task rows (confidence ≥ 0.50) revealed that `cluster_documentation` and `cluster_drafting` were the two largest systematic underestimates in the model — model difficulty 0.33/0.35 vs. empirical 0.57/0.58
  - the regression could not directly update the four AUTOMATION_DIFFICULTY_WEIGHTS (R²=0.105; couplingProtection collinear with intercept; humanAdvantage confounded by usage-share selection in AEI data) so the weights are unchanged
  - instead, the per-cluster gap analysis identified that `judgment_requirement` and `tacit_context_dependence` were too low for both clusters: documentation was set as if the work required almost no contextual judgment (0.18) or tacit knowledge (0.10), and drafting was similarly underweighted
  - updated `cluster_documentation`: judgment 0.18→0.55, tacit 0.10→0.45, exception 0.12→0.25 (documentation work requires regulatory context judgment, audience-specific calibration, and organizational knowledge even when the output is a structured artifact)
  - updated `cluster_drafting`: judgment 0.30→0.55, tacit 0.20→0.45 (quality drafting requires understanding the organizational voice, audience expectations, and strategic purpose — not just sentence construction)
  - these changes move model difficulty for both clusters to approximately 0.40, partially closing the empirical gap without overcorrecting for data limitations in the AEI sample

Implemented scripts:
- `build_job_description_evidence.ps1`
- `build_role_function_layer.ps1`
- `build_source_comparison_layer.ps1`
- `build_role_transformation_scores.ps1`
- `build_role_explanations.ps1`
- `rebuild_role_transformation_stack.ps1`

Current implementation scope:
- reviewed multi-anchor function graphs for the highest-complexity occupations, with single-anchor coverage retained elsewhere
- task-to-function weighting for every normalized task
- live role composition editing across O*NET tasks, reviewed job-posting tasks, reviewed role-review tasks, and value-defining functions
- task-to-function explanation links surfaced in the composition editor so users can see which selected tasks mainly support which functions
- lightweight user-declared dependency links between selected tasks, used as optional spillover adjustments during a run
- unified task-source comparison rows across Anthropic, GPT task labels, cluster proxies, and stubs, with proxies down-weighted when task-level evidence exists
- unified occupation prior rows across live aggregates and benchmark sources
- occupation-level explanation summaries for all `64` modeled occupations
- task-row evidence resolution from `task_source_evidence.csv`, with reviewed and benchmark task evidence now participating in live scoring alongside Anthropic task evidence
- task-row direct-evidence blending for both automation difficulty and direct pressure
- coverage-aware task-first cluster baselines, where strong resolved task evidence can now shift the cluster baseline before that baseline is projected onto task rows
- task-first task baselines, where high-reliability task rows can now promote into their own task-level baseline before any residual task-evidence blend is applied
- source-aware task-first task promotion, where live and reviewed evidence can promote more readily than benchmark labels and low-confidence task mappings are damped
- a first non-runtime empirical calibration layer with structural calibration targets and a generated disagreement report
- a first actionable non-runtime empirical calibration layer that also emits review-layer recommendations for disagreement triage
- a first calibration-informed runtime tuning pass on the repeated bargaining-power overstatement surfaced by that review queue
- a second calibration-informed runtime tuning pass on routine-pressure underestimation in admin-heavy occupations
- phase-2 task-derived cluster aggregation for exposed/retained cluster surfaces and top-exposed-cluster readouts
- phase-3 task-derived automation-difficulty and wave recomputation for public wave timing and cluster outputs
- runtime questionnaire redesign with native role-refinement factors and legacy-answer fallback retained only for compatibility
- reviewed role-variant baselines for the first heterogeneous occupation subset, with questionnaire-informed recommendation and explicit override in the role studio
- reviewed public-job-posting task-gap coverage for `49` of `64` modeled occupations
- reviewed role-transformation calibration for `49` of `64` modeled occupations:
  - `5` function-heavy pilots
  - `4` routine-heavy contrast roles
  - `5` second-tranche launch roles
  - `5` third-tranche launch roles
  - `7` fourth-tranche launch roles
  - `8` fifth-tranche launch roles
  - `5` sixth-tranche launch roles
  - `5` seventh-tranche launch roles
  - `5` eighth-tranche launch roles
- first-pass role transformation outputs for all `64` modeled occupations

Known current limits:
- multi-anchor function coverage exists only for a reviewed subset of the most obviously split roles, not yet for every occupation that may need it
- reviewed role-variant coverage now exists only for the first heterogeneous subset, not yet for every occupation that likely hides multiple stable role shapes
- transformation scoring still relies on broad role-family defaults and benchmark floors underneath the reviewed overrides
- thin-coverage occupations still depend heavily on cluster priors for automation difficulty even after proxy down-weighting and the new task-first baseline layers
- the live engine now has both task-first cluster baselines and task-first task baselines, but low-coverage tasks still inherit a cluster-seeded fallback path
- the live engine now also applies a narrow thin-evidence guardrail: only when the active role is overwhelmingly fallback-driven and task-first support is unusually weak does it explicitly lower fate/timing confidence and widen recomposition uncertainty
- the live engine now also applies a derived function-context layer: ORS, ACS heterogeneity, adaptation, quality, labor, and demand/adoption context now feed confidence-weighted outer constraints on retained accountability, retained bargaining power, and fragmentation risk
- the live questionnaire now renders as core questions plus optional deeper modules and writes a native factor-based role-refinement profile, but external legacy-answer fallback still exists in the engine for compatibility

### What Has Been Done So Far

- Imported benchmark layers for `AIOE`, `Webb`, `SML`, and `GPTs are GPTs`
- Built a unified task-source evidence layer and occupation prior comparison layer
- Added a task-role graph with richer task inventory, dependency edges, and role-profile summaries
- Added a role-function layer with function anchors, accountability profiles, task-to-function edges, and reviewed supplemental anchors for split-function occupations
- Added a first-pass role-transformation scoring layer for all modeled occupations
- Added occupation-by-occupation explanation outputs so each transformation row has a plain-English audit summary
- Reduced proxy overreach by down-weighting cluster-prior task evidence when direct task evidence or benchmark task labels already exist
- Promoted the source-comparison layer into the live task scorer so reviewed task estimates and benchmark task labels can now affect runtime task scoring instead of remaining comparison-only
- Added a first live direct-task-evidence runtime blend so sufficiently reliable task evidence can move task-level direct pressure and task-level automation difficulty without replacing the baseline cluster-prior layer
- Added a coverage-aware task-first cluster-baseline blend so clusters with enough resolved task evidence can shift the baseline difficulty path before task-row scoring
- Added a task-first task-baseline path so high-reliability task rows can now use their own resolved task evidence as the main baseline source rather than only adjusting a cluster-seeded baseline
- Tightened the task-first task-baseline path so source role and task-mapping confidence both affect whether a task actually promotes into that baseline
- Added a first structural calibration scaffold so live model outputs can now be compared against local non-runtime guardrail, labor-context, and wage-context targets before any future data is promoted into runtime
- Added task-derived cluster aggregation so the public cluster summaries and `top_exposed_work` now reflect scored task rows rather than only the pre-task cluster bundle
- Recomputed the live wave engine from the task-derived cluster bundle so public wave timing now follows the same bottom-up task stack as the public cluster layer
- Added a reviewed task-scoring layer for the highest-proxy occupation gap so Business Operations Specialists no longer reads as pure proxy coverage
- Extended the reviewed task-scoring layer to the remaining medium-priority evidence gaps:
  - Data Scientists
  - Paralegals and Legal Assistants
  - Sales Representatives of Services
- Added a reviewed supplemental function anchor for Paralegals and Legal Assistants so the role retains a distinct matter-coordination function instead of collapsing into one flat support anchor
- Added a first-pass runtime questionnaire redesign:
  - native role-refinement profile under the hood
  - named refinement-factor UI and presets
  - legacy `Q1..Q16` compatibility fallback retained only for external callers
  - runtime scoring tied more directly to retained function, sign-off, substitution pressure, dependency drag, and augmentation fit
  - updated runtime copy so the questionnaire is framed as role refinement rather than generic friction
  - moved the visible UI to a schema-rendered core-questions plus optional-modules surface
- Replaced the old post-selection task picker with an editable role composition layer:
  - source-bucketed O*NET tasks
  - reviewed public job-posting tasks
  - reviewed role-review tasks
  - value-defining function anchors
  - per-task function-link explanations
  - optional user-declared support links between selected tasks
- Extended reviewed supplemental function coverage for:
  - Human Resources Specialists
  - Management Analysts
  - Accountants and Auditors
  - Computer Systems Analysts
- Replaced seed-only job-description placeholders with reviewed public posting evidence for:
  - Lawyers
  - Data Scientists
  - Management Analysts
  - Technical Writers
  - Sales Representatives
  - Project Management Specialists
  - Business Operations Specialists, All Other
  - Customer Service Representatives
  - Accountants and Auditors
  - Paralegals and Legal Assistants
  - Human Resources Specialists
  - Training and Development Specialists
  - Market Research Analysts and Marketing Specialists
  - Computer Systems Analysts
  - Software Developers
  - General and Operations Managers
  - Financial and Investment Analysts
  - Operations Research Analysts
  - Web Developers
  - Graphic Designers
  - Writers and Authors
  - Advertising Sales Agents
  - Compliance Officers
  - Logisticians
  - Electronics Engineers, Except Computer
  - Mechanical Engineers
  - News Analysts, Reporters, and Journalists
  - Public Relations Specialists
  - Editors
  - Statistical Assistants
  - Bookkeeping, Accounting, and Auditing Clerks
  - Office Clerks, General
  - Secretaries and Administrative Assistants, Except Legal, Medical, and Executive
  - Executive Secretaries and Executive Administrative Assistants
- Added reviewed calibration overrides for:
  - Lawyers
  - Data Scientists
  - Management Analysts
  - Technical Writers
  - Sales Representatives
  - Bookkeeping Clerks
  - Office Clerks
  - Secretaries and Administrative Assistants
  - Executive Assistants
  - Project Management Specialists
  - Business Operations Specialists, All Other
  - Customer Service Representatives
  - Accountants and Auditors
  - Paralegals and Legal Assistants
  - Human Resources Specialists
  - Training and Development Specialists
  - Market Research Analysts and Marketing Specialists
  - Computer Systems Analysts
  - Software Developers
  - General and Operations Managers
  - Financial and Investment Analysts
  - Operations Research Analysts
  - Web Developers
  - Graphic Designers
  - Writers and Authors
  - Advertising Sales Agents
  - Compliance Officers
  - Logisticians
  - Electronics Engineers, Except Computer
  - Mechanical Engineers
  - News Analysts, Reporters, and Journalists
  - Public Relations Specialists
  - Editors
  - Statistical Assistants

### Questionnaire Redesign Status

The questionnaire migration is now mostly implemented.

What is live:
- the runtime engine accepts a native structured questionnaire profile
- the live app authors named refinement-factor inputs directly rather than numeric question IDs
- runtime scoring now uses retained-function and authority-oriented factors more directly
- presets are authored as named refinement-factor presets, with legacy answer presets kept only as compatibility exports
- the visible UI now presents:
  - a role-refinement readout
  - core questions
  - optional deeper modules
  - schema-rendered questionnaire content rather than hardcoded questionnaire markup

What is not finished yet:
- module-level branching and specialized deep paths are still limited
- guide and methodology copy will still need continued tightening as the model evolves
- the long-term cleanup question is whether to keep or fully remove the legacy `Q*` compatibility fallback for external callers

### Current Calibration State (as of 2026-03-18, post phases 18–24)

| Layer | Correlation | Session Δ | Notes |
|---|---|---|---|
| humanGuardrailCorrelation | 0.910 | +0.015 | Improved from ~0.895 |
| adoptionContextCorrelation | 0.861 | — | New metric |
| demandContextCorrelation | 0.919 | — | New metric |
| wageLeverageCorrelation | 0.808 | +0.069 total | Improved from ~0.739 |
| routinePressureCorrelation | 0.702 | +0.005 | Phase-24 calibration formula fix |
| recompositionContextCorrelation | 0.885 | +0.033 | Phase-22 two-pronged fix |
| waveTimingCorrelation | 0.536 | −0.006 | Acceptable tradeoff from phase-22 |
| specializationResilienceCorrelation | 0.614 | +0.043 | Side effect of phase-23 specialization lift |
| roleHeterogeneityCorrelation | 0.412 | — | Lowest; ACS heterogeneity signal |

Top review queues (post phases 22–24):
- `recomposition_and_timing`: 9 occupations — content/writing roles still dominant. Phase-22 improved from 0.852→0.885; remaining gap reflects 32% blend still not enough for the largest content-role mismatches.
- `accountability_guardrails`: 9 occupations — systematic positive bias; ranking correct at 0.910.
- `adoption_realization`: 6 occupations (surfaced after task_pressure and bargaining_power resolved)
- ~~`task_pressure`~~ *(resolved by phase-24 calibration formula fix — routinePressureCorrelation 0.697→0.702, queue dropped off top-3)*
- ~~`bargaining_power`~~ *(resolved by phase-23 specialization lift — wageLeverageCorrelation 0.781→0.808)*

### What Still Needs To Be Done

#### Empirical calibration queue (prioritized)

1. **AEI March 2026 data check** *(completed 2026-03-18 — findings below, integration pending)*
   - No new release folder on Hugging Face (last release remains `release_2026_01_15`)
   - However, a `labor_market_impacts/` folder was added ~March 6, 2026 with two new files now downloaded to `data/raw/anthropic_economic_index/labor_market_impacts/`
   - **`task_penetration.csv`** (17,999 rows): economy-wide Claude usage penetration per O*NET task statement text. 657 of 669 model tasks match (98.2%). Distribution is bimodal — 92.5% zero, nonzero median 0.91. Orthogonal to existing `observed_usage_share` (correlation -0.054). 360 model tasks gain first signal; 13 have meaningful penetration (>0.01) with no current evidence. These 13 are the priority integration target.
   - **`job_exposure.csv`** (756 rows): observed Claude usage fraction by occupation (6-digit SOC). 32/34 model occupations match. Measures individual-level AI usage, NOT organizational workflow adoption — structurally different from `ai_adoption_context` (BTOS-derived). Large divergences on 25/32 occupations. Notable: Customer Service Reps 0.70 vs model's 0.16; Software Developers 0.29 vs model's 0.85. Should feed calibration validation, not directly replace `ai_adoption_context`.
   - Three older releases not yet pulled: `release_2025_02_10`, `release_2025_03_27`, `release_2025_09_15` — September 2025 raw file is 18.9 MB from a different time window (Aug 4–11, 2025); could expand task evidence coverage complementarily with the current Nov 2025 window.
   - **Completed integration work**:
     - 13 tasks with penetration >0.01 and no prior evidence added to `task_exposure_evidence.csv` and `task_source_evidence.csv` as `src_aei_labor_market_2026_03` / `benchmark_task_label` / confidence 0.45. Occupations covered: Compliance Officers, Project Management Specialists, Software Developers, Web Developers, Data Scientists, Sales Representatives of Services (7 tasks).
     - Source registered in `data/metadata/source_registry.yaml`
   - **Remaining integration work**:
     - Add `job_exposure.csv` to the calibration scaffold as occupation-level AI usage signal; flag large divergences (e.g. Customer Service Reps 0.70 vs model 0.16; Software Developers 0.29 vs model 0.85) as calibration candidates — but do not replace `ai_adoption_context` since these measure individual Claude usage, not organizational adoption
     - Sep 2025 release pulled and processed: added 8 new task evidence rows across 8 occupations (see phase-21)

2. ~~**FRICTION_WEIGHTS update from Dallas Fed + OECD findings**~~ *(completed 2026-03-18 — see phase-19)*

3. ~~**BLS 2024–34 AI projections → wave assignment cross-check**~~ *(completed 2026-03-18 — validation only, no engine changes)*
   - Cross-check run against `occupation_labor_market_context.csv` (projection_growth_pct) and `occupation_demand_adoption_context.csv` for all 34 occupations
   - Result: 14 aligned, 4 conflict-model-high, 2 conflict-model-low, 14 stable/neutral
   - **conflict-model-high (model sees more pressure than BLS):** Marketing Specialists (+6.7%), Web Developers (+7.5%), Management Analysts (+8.8%), Software Developers (+15.8%) — all classic augmentation cases where BLS captures net employment growth from demand expansion while the model correctly identifies high task-level AI pressure. These are not calibration errors; they reflect the model asking a different question than BLS.
   - **conflict-model-low (model less pessimistic than BLS):** Customer Service Reps (-5.5%) and Office Clerks (-6.7%) — BLS decline partly reflects secular/structural contraction predating the current AI wave (chatbots, digitization, offshoring). Both have high individual-vs-org gaps (+0.84 and +0.51 respectively), suggesting workers are already adapting with AI tools faster than org adoption signals reflect. Worth monitoring but not a model calibration error.
   - Script: `scripts/validate_adoption_vs_bls.js`

4. **O*NET 30.2 refresh** *(schema change, requires deliberate upgrade)*
   - O*NET 30.2 released February 2026: Job Zone structure changed from 5-level to 4-level
   - The model uses job zone complexity in `occupation_adaptation_priors.csv` — those values need updating
   - Treat as a separate schema/data upgrade; do not bundle with scoring tuning
   - Hold until AEI update, FRICTION_WEIGHTS pass, and BLS cross-check are complete

5. **MIT Iceberg Index cross-check** *(medium-term validation)*
   - MIT/Oak Ridge (Nov 2025): maps 32,000+ skills across 923 occupations; finds 11.7% of workforce already replaceable by current AI
   - Cross-reference their skill-exposure rankings against model's wave assignments for 34 occupations
   - Identifies any structural mismatches between skill-based exposure framing and the model's task-based framing
   - Source: `https://iceberg.mit.edu/report.pdf`

6. **Dallas Fed young worker finding → entry-level capabilitySignal** *(low priority)*
   - Dallas Fed (Feb 2026): employment declining most for workers under 25 in AI-exposed industries
   - Hierarchy levels 1–2 already push toward execution-heavy framing; consider whether a specific capabilitySignal lift for low-hierarchy runs in high-exposure occupations is warranted
   - Hold until the FRICTION_WEIGHTS pass is stable

#### Architecture / coverage queue

- Strengthen the adoption-realization layer without contaminating core task reachability:
  - keep `BTOS` out of task-level scoring
  - use BTOS only through a derived occupation-level runtime context row
  - continue reviewing whether any further contained adoption-parameter tuning is justified after one full review cycle
- Keep expanding richer default function graphs only where the current queue still shows a clearly flattened occupation:
  - prefer supplemental anchors over new runtime variants unless the role-shape evidence is strong
  - hold `Operations Research Analysts` on the watchlist until stronger split evidence appears
- Replace more cluster-proxy dependence with direct task evidence or reviewed benchmark promotion where coverage is still thin
- Expand task-first task-baseline coverage so more occupations can leave the cluster-seeded fallback path without becoming noisy
- Improve task-to-function weighting where O*NET still overstates generic admin or workflow tasks
- Promote the explanation layer into a more user-facing audit surface:
  - clearer task/source drill-down
  - clearer deltas after user composition edits
- Add simple task-weight controls so users can mark selected work as major, medium, or minor rather than only in/out
- Decide whether to keep or remove the remaining legacy-answer compatibility fallback in the engine
- Expand beyond the current `34` modeled occupations once the reviewed workflow is stable
- Revisit the current output taxonomy only after the explanation surface and calibration story are stronger

### Autoresearch Agenda

Highest-value next research directions:
- empirical outcome calibration from official labor-market and work-organization data instead of only internal score tuning
- better within-occupation task heterogeneity so one occupation can represent more than one stable role shape
- clearer user-facing explanation of why exposed work does or does not destroy the role

Best external data directions to evaluate next (ranked by readiness):
1. `AEI March 2026 update` — check Hugging Face for new task rows from the March 5 follow-up report *(in progress)*
2. `FRICTION_WEIGHTS empirical update` — Dallas Fed (Feb 2026) and OECD AI-WIPS (Nov 2024) both show tacit knowledge and originality/judgment as the friction dimensions that actually protect wages; update weights accordingly *(ready)*
3. `BLS 2024–34 AI employment projections` — official projections now explicitly model AI displacement; use as wave assignment validation *(ready)*
4. `O*NET 30.2` — Job Zone structure changed 5→4 levels; requires controlled schema upgrade *(hold)*
5. `MIT Iceberg Index (Nov 2025)` — 923-occupation skills-based replacement model; useful for structural cross-check *(medium-term)*
6. `BLS American Time Use Survey (ATUS)` — for grounding how broad work categories and time use actually split in practice *(low priority)*
7. `O*NET Technology Skills / Tools and Technology` — for task-tool adjacency and more explicit augmentation vs automation routing *(low priority)*

Current official-source notes checked during autoresearch on `2026-03-13`:
- `BLS ORS`: official public-use datasets now span the first wave (`2018`), second wave final (`2023`), and third wave preliminary (`2025`). The repo now uses the `2025` preliminary workbook plus `2023` backstop coverage for the calibration-only ORS structural table.
- `ACS PUMS`: official Census PUMS `2024 ACS 1-year` microdata is now integrated through the Census API for the launch occupation set and feeds the calibration-only heterogeneity table.
- `BTOS`: official Census BTOS AI/business-condition context is now integrated as a sector adoption layer. It still is not a direct task-automability input, but it now feeds a derived occupation-level runtime adoption/demand context row through ACS sector mix.
- `O*NET`: the official database release line has moved beyond the repo's current `30.1` footing. A controlled `30.2` refresh should be treated as a separate schema/data upgrade, not bundled casually into model tuning.
- `AEI`: no new release folder on Hugging Face. `labor_market_impacts/` folder added ~March 6, 2026 contains `task_penetration.csv` (17,999 task rows, economy-wide penetration) and `job_exposure.csv` (756 occupation rows). Both downloaded to `data/raw/anthropic_economic_index/labor_market_impacts/`. Integration pending — see empirical calibration queue item 1 above. Three older releases (`2025-02-10`, `2025-03-27`, `2025-09-15`) also exist on Hugging Face but have not been pulled.
- `BLS employment projections (2024–34)`: updated projections now explicitly model AI displacement at the occupation level. These should be used for wave assignment cross-validation.

Updated integration order:
1. `AEI March 2026 data check` — free task evidence coverage improvement if new rows exist
2. `FRICTION_WEIGHTS update` — Dallas Fed + OECD findings are specific enough to act on
3. `BLS 2024–34 AI projections cross-check` — validation exercise for current wave assignments
4. `O*NET 30.2` refresh and schema audit — hold until calibration passes above are stable

Directions that are probably weak unless new evidence appears:
- adding more benchmark score vendors without improving outcome calibration
- inventing more top-level labels before the current label set is externally stress-tested
- treating labor-market demand data as if it directly proves task automability
- ORS as a direct friction profile source — confirmed too coarse; measures occupational context not task-type intrinsic difficulty

Concrete next build sequence:
1. Complete AEI March 2026 data check; integrate if new rows exist.
2. Run FRICTION_WEIGHTS empirical update using Dallas Fed + OECD tacit/judgment findings.
3. Run BLS wave assignment cross-check for 34 occupations.
4. Hold the reviewed role-variant layer at the current seven-occupation subset unless stronger evidence appears for `Operations Research Analysts` or another occupation clears the role-shape bar.
5. Treat `General and Operations Managers` and `Computer Systems Analysts` as hold cases for now: both already have enough structure that more anchor expansion would likely chase the calibration target instead of improving the model.
6. Run a controlled `O*NET 30.2` refresh only after the AEI, FRICTION_WEIGHTS, and BLS calibration passes are stable.

### Immediate Accountability Review

The `accountability_guardrails` queue was reviewed and a contained runtime tuning pass was justified.

Outcome:
- the live scorer now leans less on trust and liability alone when estimating `retained_accountability_strength`
- it leans more on `delegability_guardrail`, `human_authority_requirement`, and `judgment_requirement`
- this produced a cleaner separation between roles that merely operate in trusted contexts and roles that still carry real human sign-off, delegation, and decision ownership
- after the tuning pass, the structural calibration report's `humanGuardrailCorrelation` improved from roughly `0.494` to `0.544`
- a follow-up occupation-specific review then strengthened the `General and Operations Managers` people-resource leadership anchor and managerial authority priors, lifting the correlation again to roughly `0.606` without another global formula change
- a second occupation-specific review then reduced overstated guardrails for `Paralegals and Legal Assistants`, `Sales Representatives of Services`, and `Computer Systems Analysts`, lifting the correlation again to roughly `0.696`
- a third occupation-specific review then separated expert judgment from formal sign-off more explicitly for `Mechanical Engineers`, `Financial and Investment Analysts`, `Accountants and Auditors`, and `Software Developers`, lifting the correlation again to roughly `0.792`
- a fourth narrow reviewed-function pass then reduced overstated guardrails further for `Paralegals and Legal Assistants`, `Sales Representatives of Services`, and `Computer Systems Analysts`, while structural anchor coverage was expanded for `Financial and Investment Analysts` through a reviewed stakeholder-translation anchor; after that pass, `humanGuardrailCorrelation` improved again to roughly `0.828`
- a fifth structural-anchor pass then added reviewed supplemental anchors for `Software Developers`, `Graphic Designers`, and `Paralegals and Legal Assistants`, lifting `humanGuardrailCorrelation` again to roughly `0.842`
- a sixth structural-anchor pass then added reviewed supplemental anchors for `Compliance Officers` and `Training and Development Specialists`, which reduced the accountability queue again from `13` to `11` by splitting lower-authority remediation and learning-content work away from higher-level role ownership
- a seventh structural-anchor pass then added a reviewed validation-integration anchor for `Mechanical Engineers`, which separated prototype, test, integration, and readiness work from higher-level design ownership and lifted `humanGuardrailCorrelation` again to roughly `0.866`
- an eighth structural-anchor pass then added a reviewed operational-followthrough anchor for `Business Operations Specialists, All Other`, which separated trackers, handoffs, recurring follow-through, and workflow upkeep from higher-level diagnosis and operating-design work and reduced the accountability queue again from `11` to `10`
- a ninth structural-anchor pass then kept the reviewed `implementation_enablement` anchor for `Computer Systems Analysts` and added a reviewed `executive_coordination` anchor for `Executive Secretaries and Executive Administrative Assistants`, separating release/readiness support from higher-level system-fit analysis in one case and executive gatekeeping/decision-cadence support from lower-authority workflow execution in the other; that lifted `humanGuardrailCorrelation` again to roughly `0.87`
- a tenth structural-anchor pass then added a reviewed `people_process_admin` anchor for `Human Resources Specialists`, separating onboarding, records, benefits, and HRIS-heavy process work from higher-context people guidance and recruiting judgment; that lifted `humanGuardrailCorrelation` again to roughly `0.879` and reduced the accountability queue from `10` to `9`
- a follow-up office-admin task-pressure pass then added a narrower routine-context lift for workflow-admin, documentation, and some execution-routine tasks in very routine, low-people, lower-knowledge occupations; that lifted `routinePressureCorrelation` again to roughly `0.679`
- a follow-up support-structure pass then kept a stronger reviewed `transaction_processing` anchor for `Bookkeeping Clerks` and a lighter reviewed `case_queue_execution` anchor for `Customer Service Representatives`, improving the bargaining and specialization queue without giving up most of the human-guardrail gains from the earlier structural passes
- a second support-structure pass then added a reviewed `data_preparation_execution` anchor for `Statistical Assistants`, separating data entry, coding, and reporting-packet work from higher-value statistical-support work and lifting `wageLeverageCorrelation` again to roughly `0.739` without harming the human-guardrail layer
- a follow-up clerical-pressure pass then added a role-mix-derived clerical-execution context on top of the earlier office-admin routine context, lifting `routinePressureCorrelation` again to roughly `0.700` and pushing `Office Clerks, General` off the main task-pressure queue
- a follow-up sales-structure pass then added a reviewed `deal_orchestration` anchor for `Sales Representatives of Services`, separating pipeline upkeep, internal partner coordination, proposal flow, and handoff logistics from higher-value commercial judgment and account ownership; that lifted `humanGuardrailCorrelation` again to roughly `0.892`
- a follow-up admin-structure pass then added a reviewed `admin_coordination` anchor for `Secretaries and Administrative Assistants`, separating scheduling, meeting flow, information routing, and follow-up support from lower-authority clerical execution; that lifted `humanGuardrailCorrelation` again to roughly `0.895` and reduced the main accountability queue from `10` to `9`

Current review conclusion:
- the remaining accountability queue is narrower and more mixed than before
- `Lawyers` still look like a legitimate high-guardrail occupation rather than a tuning mistake
- the earlier over-calls for `Paralegals and Legal Assistants`, `Sales Representatives of Services`, and `Computer Systems Analysts` were narrow enough to justify one more reviewed-function pass, but they no longer define the whole queue after that pass
- `Financial and Investment Analysts` now sits in a structurally cleaner middle state: not a reviewed role-variant occupation, but also no longer forced through one flat finance-analysis anchor
- `Paralegals and Legal Assistants` now also sits in a structurally cleaner middle state: the occupation still does not justify reviewed runtime variants, but a new procedural-execution anchor now separates lower-authority filing, drafting, and procedural follow-through from higher-value legal-support and matter-coordination work
- `Compliance Officers` now also sits in a structurally cleaner middle state: the occupation still does not justify reviewed runtime variants, but a new issue-remediation anchor now separates tracked follow-through, evidence readiness, and issue closure from higher-level compliance interpretation and control ownership
- `Training and Development Specialists` now also sits in a structurally cleaner middle state: the occupation still does not justify reviewed runtime variants, but a new learning-content-enablement anchor now separates curriculum and courseware production from higher-level learning-program ownership
- `Mechanical Engineers` now also sits in a structurally cleaner middle state: the occupation still does not justify reviewed runtime variants, but a new validation-integration anchor now separates prototyping, testing, integration, and production-readiness work from higher-level system-design ownership
- `Business Operations Specialists, All Other` now also sits in a structurally cleaner middle state: the occupation still does not justify reviewed runtime variants, but a new operational-followthrough anchor now separates trackers, workflow upkeep, and cross-functional follow-through from higher-level diagnosis and operating-design work
- `Computer Systems Analysts` now also sits in a structurally cleaner middle state: the occupation still does not justify reviewed runtime variants, but a new implementation-enablement anchor now separates rollout, release-support, documentation, and issue-triage work from higher-level systems-fit and requirements-translation work
- `Executive Secretaries and Executive Administrative Assistants` now also sits in a structurally cleaner middle state: the occupation still does not justify reviewed runtime variants, but a new executive-coordination anchor now separates executive gatekeeping, stakeholder routing, and decision-cadence support from lower-authority workflow execution
- `Human Resources Specialists` now also sits in a structurally cleaner middle state: the occupation still does not justify reviewed runtime variants, but a new people-process-admin anchor now separates onboarding, benefits, records, and HRIS-heavy process execution from higher-context people guidance and recruiting judgment
- several medium-strength outliers now look more like calibration-target limits or mixed-signal cases than clean model errors, so further broad formula tuning is not justified right now

### Immediate ACS Review

Initial review conclusion from the ACS heterogeneity queue:
- strongest current multi-variant role-shape candidates:
  - `Editors`
  - `News Analysts, Reporters, and Journalists`
  - `Management Analysts`
  - `Technical Writers`
  - `Market Research Analysts and Marketing Specialists`
- watchlist rather than immediate split candidates:
  - `Operations Research Analysts`

Current role-shape review conclusion:
- `Operations Research Analysts` remains a watchlist case, not a reviewed runtime variant candidate
- the occupation still presents as one coherent `decision_intelligence` baseline with some heterogeneity around application context, not as two clearly stable role shapes that justify separate reviewed defaults
- unless new reviewed function anchors or clearer split-task evidence appears, the repo should keep monitoring this occupation rather than promoting it into the role-variant layer

Why this matters:
- these occupations look structurally diverse enough that one default occupation bundle may be hiding materially different stable role shapes
- the admin-heavy occupations still show more urgent misses in task pressure and bargaining-power calibration than in role-shape heterogeneity

Current status:
- the first five strong candidates plus `Web Developers` and `Accountants and Auditors` are now implemented as reviewed runtime role variants
- `Market Research Analysts and Marketing Specialists` now also has a reviewed secondary marketing-operations function anchor, so its marketing-ops variant no longer shares one thin market-sensing-only function baseline
- `News Analysts, Reporters, and Journalists` now also has a reviewed broadcast-orchestration function anchor, so its anchor/producer variant no longer borrows the field-reporter source-development function baseline
- `Technical Writers` now has a sharper release-enablement split: the release variant includes the reviewed release-planning task and more strongly weights workflow/review tasks toward the release-enablement anchor
- `Editors` now has a sharper managing-editor split: the managing-editor variant starts from a more orchestration-heavy task bundle and more strongly weights planning, contributor-management, and packaging tasks toward the publication-orchestration anchor
- `Management Analysts` now has a sharper change-enablement split: the implementation-heavy variant includes the worker-training rollout task and more strongly weights rollout, governance, and stakeholder-alignment tasks toward the change-enablement anchor
- `Web Developers` now has a reviewed web-platform-enablement anchor, so the platform-heavy variant can start from deployment, performance, accessibility, and reliability work instead of borrowing the same software-delivery-only function baseline as the experience-building variant
- `Accountants and Auditors` now also exposes reviewed runtime role variants: a financial-reporting baseline and an audit-and-controls baseline, supported by a new audit-assurance function anchor so the split now differs at the function layer as well as the task bundle
- `Financial and Investment Analysts` now also uses a reviewed stakeholder-translation supplemental anchor in the default function graph, so presentation, recommendation, and stakeholder-translation work no longer has to live inside one flat investment-analysis-only anchor even though the occupation has not yet been promoted into explicit runtime role variants
- `Software Developers` now also uses a reviewed technical-stewardship supplemental anchor in the default function graph, so architecture, standards, and technical-direction work no longer has to collapse into one flat delivery-plus-reliability readout
- `Graphic Designers` now also uses a reviewed production-execution supplemental anchor in the default function graph, so asset/layout production no longer carries the same human-retained ownership assumptions as higher-level visual direction
- `Paralegals and Legal Assistants` now also uses a reviewed procedural-execution supplemental anchor in the default function graph, so filing, drafting, and procedural support work no longer inherits the same authority assumptions as legal-support and matter-coordination work under attorney supervision
- `Compliance Officers` now also uses a reviewed issue-remediation supplemental anchor in the default function graph, so complaints, remediation follow-through, evidence readiness, and issue closure no longer inherit the same authority assumptions as higher-level compliance interpretation and control decisions
- `Training and Development Specialists` now also uses a reviewed learning-content-enablement supplemental anchor in the default function graph, so curriculum, courseware, and training-material production no longer inherits the same ownership assumptions as learning-program priorities and training outcomes
- `Mechanical Engineers` now also uses a reviewed validation-integration supplemental anchor in the default function graph, so prototyping, test execution, integration follow-through, and production-readiness work no longer inherits the same sign-off assumptions as higher-level system-design ownership
- `Business Operations Specialists, All Other` now also uses a reviewed operational-followthrough supplemental anchor in the default function graph, so trackers, recurring follow-through, workflow upkeep, and cross-functional action management no longer inherits the same sign-off assumptions as higher-level diagnosis and operating-design work
- `Computer Systems Analysts` now also uses a reviewed implementation-enablement supplemental anchor in the default function graph, so release support, workflow adoption, issue triage, and documentation follow-through no longer inherits the same sign-off assumptions as higher-level systems-fit analysis and requirements translation
- `Executive Secretaries and Executive Administrative Assistants` now also uses a reviewed executive-coordination supplemental anchor in the default function graph, so executive gatekeeping, stakeholder routing, board support, and decision-cadence follow-through no longer inherits the same authority assumptions as lower-level workflow execution
- `Human Resources Specialists` now also uses a reviewed people-process-admin supplemental anchor in the default function graph, so onboarding, benefits administration, records upkeep, and HRIS-heavy process work no longer inherits the same authority assumptions as higher-context people guidance and recruiting judgment
- `Bookkeeping, Accounting, and Auditing Clerks` now also uses a reviewed transaction-processing supplemental anchor in the default function graph, so payables, payroll, coding, and payment-workflow execution no longer inherits the same leverage assumptions as reconciliation-heavy bookkeeping support
- `Customer Service Representatives` now also uses a lighter reviewed case-queue-execution supplemental anchor in the default function graph, so ticket routing, queue flow, and support-workflow follow-through no longer inherits the same leverage assumptions as higher-value issue-resolution work
- `Statistical Assistants` now also uses a reviewed data-preparation-execution supplemental anchor in the default function graph, so data entry, coding, reporting packets, and database-upkeep work no longer inherits the same leverage assumptions as higher-value statistical support
- `Sales Representatives of Services` now also uses a reviewed deal-orchestration supplemental anchor in the default function graph, so pipeline upkeep, proposal flow, internal partner coordination, and deal-handoff tasks no longer inherits the same sign-off assumptions as higher-value commercial judgment and account ownership
- `Secretaries and Administrative Assistants` now also uses a reviewed admin-coordination supplemental anchor in the default function graph, so scheduling, meeting flow, information routing, and follow-up support no longer inherits the same sign-off assumptions as lower-authority clerical execution and records upkeep
- the contained follow-up review on `Operations Research Analysts` did not justify promotion into runtime variants yet: the occupation still looks more like one coherent decision-intelligence role with varied application contexts than two clearly stable baseline role shapes
- the latest generated role-shape review no longer shows any strong unimplemented split candidates; `Operations Research Analysts` remains the only watchlist case
- the remaining role-shape work is no longer “whether to do variants at all”; it is whether to hold the current seven-occupation reviewed set, keep expanding supplemental anchor coverage where one flat baseline is too coarse, and only add new reviewed variants again if stronger evidence appears
- the stronger structural-anchor pass also narrowed the accountability queue materially: `Software Developers` moved slightly closer to the ORS-backed target, `Graphic Designers` dropped out of the accountability queue into the weaker task-pressure queue, `Paralegals and Legal Assistants` moved from a high accountability miss to a low one, the later `Compliance Officers` and `Training and Development Specialists` passes pushed both occupations off the main accountability queue, the later `Business Operations Specialists, All Other` pass pushed that occupation off the main accountability queue, and the later `Human Resources Specialists` pass pushed that occupation off the main accountability queue too
- the latest office-admin task-pressure pass materially improved the remaining routine/admin queue as well: `Secretaries`, `Office Clerks`, and `Bookkeeping Clerks` all moved upward on modeled routine pressure without abandoning the task-first evidence stack
- the latest support-structure pass then improved the weaker bargaining queue too: `Bookkeeping Clerks` and `Customer Service Representatives` now carry explicit lower-scarcity execution anchors instead of one flat support-purpose layer, and the softer customer-support weighting kept `humanGuardrailCorrelation` near its earlier peak while preserving the bargaining improvement
- the latest follow-up support pass then extended that same logic to `Statistical Assistants`, which now no longer reads like one flat statistical-support purpose layer despite containing a large share of lower-scarcity data-preparation work
- the latest clerical-pressure pass then made the remaining office-clerk miss more explicit: a role with a very clerical task mix and a low-authority function baseline now receives extra clerical-execution pressure even if its broader adaptation prior is not as extreme as a pure office-admin role
- the latest sales-structure pass then cleaned up one of the remaining medium-strength accountability cases: `Sales Representatives of Services` no longer treats pipeline, proposal, and internal deal-motion work as if it carries the same sign-off as actual commercial ownership
- the latest admin-structure pass then cleaned up another remaining accountability case: `Secretaries and Administrative Assistants` no longer treats scheduling and coordination support as if it carries the same guardrail profile as lower-authority clerical execution, and the occupation now reads more like a remaining routine-pressure question than a guardrail over-call

Immediate prep result:
- the ACS bridge now includes `occupation_btos_sector_mix.csv`, and the BTOS adoption-context layer is live both as a calibration check and as an input to the derived runtime occupation demand/adoption context row

### Holistic Model Read On `2026-03-15`

What is now structurally strong:
- the live runtime is no longer just a cluster-exposure model; it is now task-scored, function-aware, task-derived in its public cluster and wave outputs, and partially task-first in its baseline logic
- the reviewed variant layer is now stable at seven occupations and the role-shape review artifact no longer shows any strong unimplemented split candidates
- the reviewed supplemental-anchor path is now doing useful work for occupations that are too coarse under one flat purpose layer but still do not justify explicit runtime variants
- the calibration stack is now strong enough to distinguish credible structural misses from weaker proxy disagreements

What still looks weak or incomplete:
- adoption realization is still the weakest important outer layer; `BTOS` is now useful both for auditing it and for the new derived runtime context layer, but it still should not touch task-level scoring directly
- the next outer layer is now also partly promoted: recomposition and timing no longer sit entirely on hand-authored thresholds, because a new derived `occupation_recomposition_context.csv` layer now constrains workflow compression, organizational conversion, and wave timing without touching task-level scoring
- bargaining-power calibration is directionally better than before, but it still relies on weak external proxies and should be treated as a review surface rather than a truth label
- task-first coverage is still incomplete; many low-coverage tasks continue to inherit a cluster-seeded fallback path
- the explanation surface is still compact relative to the underlying model, but it now includes a baseline edit-delta, a task/source/function audit trace, direct-evidence citations, and per-task causal notes in the live UI
- the questionnaire and composition editor are better than the old model, and the result surface now exposes a baseline edit-delta, but users still cannot easily express rough time-share weights or drill all the way down to task/source/function citations from that delta

Review conclusions from the last contained role pass:
- `General and Operations Managers` should stay as a hold case for now; the remaining gap looks closer to calibration-target limits than to a missing structural anchor
- `Computer Systems Analysts` should also stay as a hold case for now; the occupation already has a richer default graph and the remaining disagreement is now mixed across guardrails and wage-leverage proxies rather than a clean missing-anchor signal
- `Operations Research Analysts` remains watchlist-only; the repo still does not have good enough evidence for explicit runtime variants there

Recommended next structural / tuning order:
1. evaluate the new runtime `occupation_recomposition_context.csv` layer before adding any more outer-layer data
2. keep strengthening the explanation layer above the current edit-delta and audit-trace surface before adding more top-level labels
3. expand task-first evidence coverage only where the evidence resolver is strong enough to avoid noisy fallback removal
4. run the controlled `O*NET 30.2` refresh only after the current calibration and structural review cycle is stable

## Purpose

This document defines the next major overhaul of the role model.

The end goal is not only to measure task exposure to AI.

The end goal is to estimate:
- displacement risk
- role transformation
- retained bargaining power
- residual role integrity
- whether the role's core function still requires a human

Task exposure remains necessary, but it is only one layer.

## Problem Statement

The current stack is directionally useful, but it is still too task-centric in three ways:

1. O*NET task lists are incomplete for many real roles.
2. The model can overstate risk when exposed tasks do not equal the role's core function.
3. The dependency structure between tasks and the role's final organizational function is still too shallow.

Example:

A lawyer may have many high-exposure tasks:
- drafting
- research
- summarization
- document review

But the role's function is not "produce drafts."

The role's function is closer to:
- interpret the law
- advise clients under uncertainty
- act as accountable advocate
- carry professional and institutional responsibility

If AI helps with many tasks but does not replace that function, the role may transform without collapsing.

## North Star

The model should answer:

1. What is this role trying to accomplish?
2. What work is performed in service of that function?
3. Which tasks face direct AI pressure?
4. Which tasks lose value because upstream or downstream work changes?
5. Which parts of the role still carry bargaining power, accountability, trust, or institutional authority?
6. Does the remaining bundle still justify a distinct role?

## Design Principles

### 1. Function first, tasks second

Tasks should be modeled as being in service of a role function, not as the role itself.

### 2. Use a graph, not only a list

A pure sequential list is better than a flat task table, but still too narrow.

Many roles are not one clean chain.
They are better represented as a directed graph with:
- task nodes
- support relationships
- review relationships
- decision gates
- function nodes

Recommendation:

Do not model every role as one linear chain that ends in a single function.

Instead, model:
- several task chains
- one or more "function anchors"
- accountability / trust / judgment nodes above the task layer

That is more realistic and still compatible with o-ring style reasoning.

### 3. Separate evidence types

Direct task evidence, occupation priors, and structural role annotations should not be merged into one opaque score.

The stack should preserve:
- what is observed
- what is inferred
- what is benchmarked
- what is manually curated

### 4. Replace stubs wherever possible

Generated stubs are acceptable only as temporary fallback.

Launch roles should move toward:
- direct task evidence
- benchmark task labels
- manual review
- job-description-derived task expansions

### 5. Measure transformation, not only substitution

The model should explicitly distinguish:
- tasks AI can assist
- tasks AI can partially automate
- tasks AI can automate
- tasks whose value declines because connected work changes
- functions that remain human-accountable

## Proposed Model Stack

### Layer 1. Occupation and role identity

Keep:
- `occupations.csv`
- `occupation_aliases.csv`

Add stronger role-definition fields:
- canonical role summary
- role function statement
- accountability statement
- primary output / deliverable
- primary stakeholder served
- regulatory / trust burden

### Layer 2. Enriched task inventory

Current O*NET task lists remain the base layer, but should no longer be treated as complete.

Task inventory should be built from:
- O*NET tasks
- manual task expansions
- launch-role job description research
- benchmark task annotations where available

Each task should carry:
- source provenance
- whether it is O*NET-native or expanded
- whether it is core, supporting, optional, or situational
- whether it is directly user-facing, internally supporting, or institutionally accountable

### Layer 3. Function graph

Add a role-function layer above tasks.

This should include:
- function nodes
- task-to-task edges
- task-to-function edges
- accountability edges
- review / sign-off edges

Example:

For lawyers:
- research feeds drafting
- drafting feeds advice
- advice feeds advocacy / representation
- representation feeds role function
- accountability sits above several of those nodes

### Layer 4. Multi-source exposure normalization

Build a normalized framework that can compare sources without collapsing them too early.

Use:
- Anthropic task telemetry as the main direct task evidence layer
- GPTs-are-GPTs task labels as supporting task evidence
- AIOE ability and occupation scores as occupation / ability priors
- Webb as occupation benchmark prior
- SML as occupation benchmark prior

Recommended rule:

- task-level sources should inform direct task pressure
- occupation-level benchmark sources should calibrate priors and flag implausible outputs
- benchmark-only sources should not directly overwrite live task evidence unless explicitly promoted

### Layer 5. Role transformation and displacement engine

The final engine should estimate:
- direct task pressure
- indirect dependency pressure
- retained bargaining power
- function retention
- function delegation
- accountability retention
- role fragmentation
- demand expansion
- final role-fate state

## Main Workstreams

## Workstream 1. Normalized Exposure Framework

### Goal

Create one comparison-ready exposure layer across all benchmark and live sources.

### Why

Right now the repo has useful source imports, but the active stack and benchmark stack are still too separate.

### Deliverables

- unified source comparison contract
- task-level evidence table with source-specific rows
- occupation-level prior table with source-specific rows
- source weighting and precedence rules
- benchmark disagreement diagnostics tied to promotion decisions

### Proposed rules

- Anthropic = primary live task evidence
- reviewed task estimates = promoted supporting task evidence
- GPTs task labels = secondary task evidence / fallback promotion tier
- AIOE = occupation + ability prior
- Webb = occupation benchmark prior
- SML = occupation benchmark prior

### Key output

A normalized exposure framework that answers:
- what each source says
- where sources agree
- where sources disagree
- which source is allowed to drive which layer

Current live status:
- cluster priors still provide the baseline difficulty prior
- resolved task evidence now blends into both task-level automation difficulty and task-level direct pressure when `direct_evidence_reliability > 0.20`
- the task-level resolver currently prioritizes `live_task_evidence`, then `reviewed_task_estimate`, then `benchmark_task_label`, then proxy fallback
- that blend weight is capped at `0.85`
- low-reliability task evidence still stays in confidence and coverage surfaces only
- public cluster summaries are now aggregated back up from scored task rows after direct pressure, spillover, and retained-share calculations
- wave trajectory is now recomputed from that task-derived cluster bundle rather than from the older pre-task cluster bundle

## Workstream 2. Task Gap Expansion

### Goal

Fill missing or thin task inventories for launch roles.

### Why

O*NET is useful, but it is not a complete description of the real work bundle for many modern roles.

### Approach

For each launch role:
- collect a curated set of real job descriptions
- extract missing tasks and responsibilities
- deduplicate against O*NET tasks
- classify new tasks as core / supporting / optional
- map them into existing or new task families
- score them with the same exposure machinery

### Important rule

Do not just add more task rows.

Add only tasks that materially improve the model's understanding of:
- role function
- trust/accountability burden
- cross-task dependency
- user/stakeholder responsibility

### Priority occupations

Start with roles that are:
- thinly covered
- function-sensitive
- highly exposed on benchmarks
- likely to be misread by pure task exposure

Initial examples:
- Lawyers
- Management Analysts
- Project Management Specialists
- Data Scientists
- Technical Writers
- Sales Representatives
- Business Operations Specialists

## Workstream 3. Function and Dependency Graph

### Goal

Model how tasks combine into the role's function.

### Why

This is the missing layer between "AI can do some tasks" and "the role is displaced."

### Recommendation

Use a directed graph, not only a sequential list.

The graph should support:
- multiple chains
- branching
- review loops
- coordination work
- sign-off / accountability nodes
- terminal function nodes

### New concepts

- `function_id`
- `function_statement`
- `task_to_function_weight`
- `accountability_weight`
- `judgment_requirement`
- `trust_requirement`
- `regulatory_liability_weight`
- `human_authority_requirement`

### New normalized files

- `role_functions.csv`
- `occupation_function_map.csv`
- `task_function_edges.csv`
- `function_accountability_profiles.csv`

### Scoring impact

This layer should help answer:
- can AI do the task?
- does that matter for the role's core function?
- if AI does the task, who still owns the outcome?
- what work remains economically necessary?

## Workstream 4. Transformation / Displacement Scoring

### Goal

Move from exposure scoring to role-fate scoring with explicit function retention logic.

### Proposed decomposition

For each role, compute:
- direct task pressure
- indirect dependency pressure
- function retention
- accountability retention
- bargaining power retention
- role fragmentation
- role compressibility
- demand expansion

### Proposed outputs

- `task_exposure_pressure`
- `function_exposure_pressure`
- `retained_function_strength`
- `retained_accountability_strength`
- `retained_bargaining_power`
- `role_fragmentation_risk`
- `delegation_likelihood`
- `headcount_displacement_risk`
- `role_transformation_type`

### Interpretation

High task exposure should not imply high displacement if:
- core function remains human-owned
- accountability remains human-owned
- bargaining-power tasks remain intact
- AI mostly compresses support work rather than replacing the function

## Workstream 5. Calibration and Evaluation

### Goal

Make the model empirically defensible.

### Evaluation questions

- Does the model overpredict collapse for function-heavy professions?
- Does it underpredict compression for routine-support roles?
- Does replacing stubs with benchmark task labels improve plausibility?
- Do added job-description tasks improve role-fate explanations?

### Evaluation layers

- source agreement diagnostics
- occupation-by-occupation expert review
- launch-role manual calibration set
- sensitivity testing on function-weight assumptions

## Recommended Data Model Changes

### Keep and strengthen

- `occupation_tasks.csv`
- `occupation_task_inventory.csv`
- `task_dependency_edges.csv`
- `occupation_task_role_profiles.csv`
- `task_exposure_evidence.csv`
- `task_augmentation_automation_priors.csv`

### Add

- `role_functions.csv`
- `occupation_function_map.csv`
- `task_function_edges.csv`
- `function_accountability_profiles.csv`
- `job_description_task_evidence.csv`
- `task_source_evidence.csv`
- `occupation_source_priors.csv`

### Deprecate conceptually

The model should stop treating `occupation_exposure_priors.csv` as the main answer.

It should become one intermediate layer inside a broader role-transformation model.

## Source Strategy

### Use actively in the live stack

- Anthropic task telemetry
- GPTs-are-GPTs task labels
- O*NET tasks and work structure
- manual review for function and dependency layers

### Use as priors / calibration / benchmarks

- AIOE
- Webb
- SML
- GPTs occupation-level ratings

### Use only as temporary fallback

- internal stubs

## Implementation Phases

## Phase 1. Exposure normalization

Build:
- unified source comparison framework
- source-specific task evidence contract
- source-specific occupation prior contract
- precedence rules for task vs occupation evidence

Success condition:
- every launch role has a transparent source comparison view

Current shipped subset:
- resolved task evidence now influences live task-level automation difficulty and direct pressure when reliability clears the runtime threshold
- task-derived cluster summaries now drive the public cluster layer and top-exposed-cluster readouts
- the task-derived wave engine is now live on top of those task-derived cluster summaries
- the runtime task-source evidence resolver is now live
- the runtime now also has a coverage-aware task-first cluster-baseline path
- the runtime now also has a task-first task-baseline path for high-reliability task rows
- the remaining gap is expanding that task-first coverage without making thin occupations unstable

## Phase 2. Task-gap expansion

Build:
- job-description ingestion process
- role-by-role manual expansion workflow
- deduplication and provenance logic

Success condition:
- no launch role remains thin or obviously skeletal

## Phase 3. Function graph

Build:
- role function schema
- task-to-function edges
- accountability and trust annotations
- DAG-based dependency layer

Success condition:
- each launch role has at least one reviewed function graph

## Phase 4. Role transformation engine

Build:
- function-aware scoring
- transformation / displacement decomposition
- new public outputs

Success condition:
- the model can explain why a role transforms without assuming collapse from task exposure alone

## Phase 5. Calibration

Build:
- reviewed occupation set
- benchmark comparison panels
- scenario tests

Success condition:
- outputs are directionally credible across launch roles and benchmark-sensitive occupations

## Immediate Next Steps

1. Add weighted task-share controls to the composition editor so selected tasks can be marked as major, medium, or minor instead of only present or absent.
2. Add explicit result deltas that explain what changed after composition edits, for example which retained functions strengthened or which spillover links increased pressure.
3. Replace more cluster-prior proxy dependence with direct task evidence, GPT task-label promotion, or reviewed manual mapping for the highest-proxy occupations that still lean on fallback.
4. Push direct task evidence one layer deeper by deriving cluster automation difficulty from task rows wherever task-level evidence is strong enough.
5. Recompute the upstream wave engine bottom-up from task-derived cluster summaries instead of preserving a separate pre-task wave bundle.
6. Use the new occupation explanation layer to run another occupation-by-occupation audit and tighten task-to-function weighting where explanations still look generic.
7. Decide whether to keep or remove the remaining legacy-answer compatibility fallback after external callers are checked.

## One-Sentence Summary

The next model should not ask only whether AI can do tasks inside a role.

It should ask whether AI changes the set of tasks, dependencies, and accountability relationships enough to replace the role's core function in the organization.

## Next 30 White-Collar Expansion Staging

Promoted on `2026-03-18`:
- next-phase expansion seed recorded at `data/metadata/next_30_white_collar_seed.csv`
- the live seed now covers `64` selected occupations, up from the prior `34`
- wave order:
  - wave `1` = adjacent high-readiness roles that deepen current families
  - wave `2` = manager, specialist, and architecture layers that deepen authority contrasts
  - wave `3` = breadth roles that fill execution, supervisory, and public-sector gaps

Current family gaps the staged queue is meant to close:
- software and IT infrastructure: support, QA, security, network architecture, and IT management
- finance and insurance: managerial finance, lending, wealth advice, claims, and policy-processing tiers
- sales and marketing: managerial sales, finance-adjacent sales, insurance sales, and technical B2B sales
- administration and operations: reception, billing, procurement, supervisory admin, transportation leadership, and property management
- engineering: civil, industrial, electrical, and engineering-management pathways

The original expansion gates are now complete for enrollment and first-pass runtime generation:
1. confirm raw-source coverage across O*NET, BLS, AEI, ORS, ACS, and BTOS
2. seed the occupation metadata row and role-family mapping
3. build the baseline task inventory and job-description review queue
4. generate the first-pass task graph and dependency review list
5. author first-pass function anchors and accountability priors
6. run the role-variant gate:
   - no variant if one baseline role shape looks structurally coherent
   - supplemental anchors if one baseline is too flat but not clearly split
   - explicit variants only if heterogeneity is strong enough to justify multiple stable baselines
7. add task-source evidence rows and occupation prior rows
8. run structural calibration and role-shape review before public exposure
9. write the occupation explanation row and audit the public explanation surface

Next review focus after promotion:
- backfill reviewed job-description evidence for the remaining `15` newly promoted occupations
- expand ORS, ACS, and BTOS calibration coverage so the outer-layer review stack does not rely on fallback context for the new cohort
- review thin task-inventory occupations first, especially `Information Security Analysts`, `Marketing Managers`, `Compliance Officers`, `Management Analysts`, and `Network and Computer Systems Administrators`

Remaining cross-cutting follow-up:
- decide whether `insurance` and `procurement` become explicit role families or remain mapped into existing finance and operations presets
- extend questionnaire preset coverage for manager-heavy and infrastructure-heavy occupations before the first new batch goes live
- confirm how broad BLS rows that split into narrower O*NET occupations will be handled, especially procurement
