# Role Transformation Contract

## Purpose

This document defines the first-pass normalized layer that sits above task exposure.

It makes the model answer not only:
- what tasks are exposed

But also:
- what function the role serves
- which tasks matter most to that function
- what accountability still stays with a human
- how likely the role is to compress, fragment, delegate, or retain its core

## New normalized files

### `job_description_task_evidence.csv`

Reviewed public-posting task-gap expansion layer.

Use it to:
- store non-O*NET task evidence for launch roles
- preserve provenance for manually reviewed task additions
- feed new tasks into the richer task inventory

Current coverage:
- all `64` of the current `64` modeled occupations now have reviewed posting-backed task-gap additions
- the live reviewed posting layer now carries `352` rows across those `64` occupations
- density is still uneven: `41` occupations currently have `4` reviewed rows, `22` have `8`, and `1` has `12`
- the remaining review debt is now about density and quality differences across those reviewed additions, not blank occupation-level coverage

### `task_source_evidence.csv`

Source-specific task evidence contract.

Each row preserves one task and one source view with:
- normalized exposure
- normalized augmentation
- normalized automation
- evidence weight
- confidence
- promotion status

Current source roles:
- `live_task_evidence`
- `reviewed_task_estimate`
- `benchmark_task_label`
- `cluster_prior_proxy`
- `fallback_task_proxy`

Current rule:
- cluster and fallback proxies remain visible, but they are now down-weighted when stronger task-level evidence already exists for the same task
- in the live browser scorer, `task_source_evidence.csv` is now the actual task-level resolver:
  - `live_task_evidence` has highest task-level priority
  - `reviewed_task_estimate` is next
  - `benchmark_task_label` is the last task-level promotion tier
  - `cluster_prior_proxy` and `fallback_task_proxy` remain fallback only
- once the resolved task-level evidence reliability clears the runtime threshold, the resolved task evidence can alter both task-level `automation_difficulty` and task-level `direct_exposure_pressure`
- clusters with strong enough resolved task-evidence coverage can also shift their baseline difficulty path toward task evidence before that baseline is projected onto task rows
- tasks with strong enough resolved task-level reliability can now promote into a task-first task baseline before any residual task-evidence blend is applied

### `occupation_source_priors.csv`

Source-specific occupation prior contract.

Use it to compare:
- live aggregate priors
- benchmark percentiles
- benchmark bundle summaries

This is the occupation-level comparison layer that keeps benchmarks visible without forcing them into the live task layer too early.

### `role_functions.csv`

Stores role summary and function anchors.

Current first pass:
- one primary function anchor for every supported occupation
- reviewed supplemental anchors for a targeted multi-anchor subset where one function anchor was too reductive
- role-family defaults for broad coverage
- occupation-specific overrides for function-sensitive roles
- `Market Research Analysts and Marketing Specialists` now includes a reviewed supplemental marketing-operations anchor so its execution-heavy variant is function-distinct as well as task-distinct
- `News Analysts, Reporters, and Journalists` now includes a reviewed broadcast-orchestration anchor so its anchor/producer variant is function-distinct from the field-reporter source-development path
- `Technical Writers` now keeps a stronger release-enablement split by assigning the release-planning task and related workflow/review tasks more clearly to the release-enablement anchor
- `Editors` now keeps a stronger managing-editor split by assigning planning, contributor-management, and packaging tasks more clearly to the publication-orchestration anchor
- `Management Analysts` now keeps a stronger change-enablement split by assigning rollout, governance, training, and stakeholder-alignment tasks more clearly to the change-enablement anchor
- `Web Developers` now includes a reviewed web-platform-enablement anchor so its platform-heavy variant is function-distinct from the experience-building software-delivery path
- `Software Developers` now includes a reviewed technical-stewardship supplemental anchor so architecture, standards, and technical-direction work can carry more judgment than routine delivery or reliability work without pretending the occupation has a separate explicit runtime variant
- `Graphic Designers` now includes a reviewed production-execution supplemental anchor so asset/layout/file production can carry lower retained ownership than higher-level visual direction without forcing the occupation into explicit runtime variants
- `Paralegals and Legal Assistants` now includes a reviewed procedural-execution supplemental anchor so filing, drafting, and procedural support work can sit below matter-coordination and legal-support work in the accountability layer
- `Compliance Officers` now includes a reviewed issue-remediation supplemental anchor so remediation follow-through, evidence readiness, and issue closure can sit below higher-level compliance interpretation and control ownership in the accountability layer
- `Training and Development Specialists` now includes a reviewed learning-content-enablement supplemental anchor so curriculum and learning-asset production can sit below higher-level learning-program ownership in the accountability layer
- `Mechanical Engineers` now includes a reviewed validation-integration supplemental anchor so prototyping, test execution, integration, and production-readiness work can sit below higher-level system-design ownership in the accountability layer
- `Business Operations Specialists, All Other` now includes a reviewed operational-followthrough supplemental anchor so trackers, recurring follow-through, workflow upkeep, and cross-functional action management can sit below higher-level diagnosis and operating-design work in the accountability layer
- `Computer Systems Analysts` now includes a reviewed implementation-enablement supplemental anchor so release support, issue triage, rollout follow-through, and workflow-adoption work can sit below higher-level systems-fit analysis and requirements translation in the accountability layer
- `Executive Secretaries and Executive Administrative Assistants` now includes a reviewed executive-coordination supplemental anchor so executive gatekeeping, stakeholder routing, and decision-cadence support can sit above lower-authority workflow execution without forcing the occupation into explicit runtime variants
- `Human Resources Specialists` now includes a reviewed people-process-admin supplemental anchor so onboarding, employee records, benefits administration, and HRIS-heavy process work can sit below higher-context people guidance and recruiting judgment in the accountability layer
- `Bookkeeping, Accounting, and Auditing Clerks` now includes a reviewed transaction-processing supplemental anchor so payables, payroll, coding, and payment-workflow execution can sit below higher-value reconciliation and exception-handling work in the accountability and bargaining layers
- `Customer Service Representatives` now includes a lighter reviewed case-queue-execution supplemental anchor so queue flow, documentation, and support-workflow follow-through can sit below higher-value issue resolution and escalation work without turning the whole occupation into a low-authority queue role
- `Statistical Assistants` now includes a reviewed data-preparation-execution supplemental anchor so data entry, coding, reporting packets, and support-workflow upkeep can sit below higher-value statistical support and analyst-coordination work in the bargaining layer
- `Sales Representatives of Services` now includes a reviewed deal-orchestration supplemental anchor so pipeline upkeep, internal partner coordination, proposal flow, and deal logistics can sit below higher-value commercial judgment and account-ownership work in the accountability layer
- `Secretaries and Administrative Assistants` now includes a reviewed admin-coordination supplemental anchor so scheduling, meeting flow, information routing, and follow-up support can sit above lower-authority clerical execution in the accountability layer

### `occupation_function_map.csv`

Binds each occupation to its function anchors and stores a `delegability_guardrail`.

Interpretation:
- higher guardrail means exposed tasks are less likely to eliminate the role outright because judgment, trust, authority, or liability still matter

### `occupation_role_variants.csv`

Reviewed role-variant baseline contract for occupations that are too heterogeneous for one default bundle.

Each row stores:
- an occupation-scoped `variant_id`
- a reviewed `variant_label` and `variant_summary`
- explicit default `task_ids`
- explicit default `function_ids`
- preferred task-family and function signatures used for recommendation
- a questionnaire-signature sketch used to recommend the closest variant in the live app

Current live/browser status:
- this file is now a direct runtime input for a small reviewed subset of launch occupations
- it does not directly change task pressure formulas
- it changes which default task/function baseline the role studio starts from before user edits
- the browser can now recommend a reviewed variant from the current questionnaire profile and current role mix, while still allowing the user to override it explicitly
- for the stronger reviewed split occupations, variants can now differ at both the task-bundle layer and the function-anchor layer
- reviewed supplemental anchors now also extend slightly beyond the explicit role-variant subset, so some occupations can carry more than one reviewed default function anchor without exposing a separate variant selector

### `task_function_edges.csv`

Maps every normalized task to one or more occupation function anchors.

Key fields:
- `task_to_function_weight`
- `accountability_weight`
- `judgment_requirement`
- `trust_requirement`
- `regulatory_liability_weight`
- `human_authority_requirement`

This is the bridge between flat task exposure and role-level function retention.

Current behavior:
- tasks can now bind to more than one function anchor where a reviewed split is warranted
- the live browser scorer now uses the reviewed baseline task-to-function edges directly, then lets user-declared task-to-function links override or add to that graph at runtime
- the scorer uses both the task-to-function edge weights and the occupation-level function weights when aggregating function pressure

### `function_accountability_profiles.csv`

Stores function-level accountability and institutional burden.

Use it to represent:
- who the role serves
- what the role is accountable for
- how much judgment, trust, liability, and authority remain human-owned

### `occupation_role_transformation.csv`

First-pass occupation-level audit/reference output from the broader transformation pipeline.

Current metrics:
- `direct_task_pressure`
- `indirect_dependency_pressure`
- `function_exposure_pressure`
- `retained_function_strength`
- `retained_accountability_strength`
- `retained_bargaining_power`
- `role_fragmentation_risk`
- `role_compressibility`
- `demand_expansion_signal`
- `delegation_likelihood`
- `headcount_displacement_risk`
- `role_transformation_type`

Current live/browser status:
- the browser scorer now computes the function-pressure and function-retention layer live from the active edited task/function graph
- the live role-fate gate now reads this layer directly when choosing the public fate label
- the `split` fate is now intentionally scarce: it requires function-level evidence of real bifurcation, not just medium task exposure plus some retained higher-value work
- this CSV remains useful as an offline audit, comparison, and validation layer, but it is no longer the source of truth for the live browser score

### `occupation_role_explanations.csv`

Derived explanation layer for each occupation-level transformation output.

Use it to surface:
- the strongest pressure signals
- the strongest retained counterweight
- the current function-anchor mix
- the current evidence mix
- which occupations should be reviewed next because proxy dependence is still high

Current live/browser status:
- the browser now generates explanation summaries from the current run instead of reading this CSV into the live scoring path
- this file remains an offline occupation-level audit summary for QA, comparison, and reviewed reference text

### `occupation_demand_adoption_context.csv`

Derived occupation-level outer runtime context.

Use it to represent:
- broader labor-demand expansion context
- labor-market tightness context
- sector-weighted AI adoption context
- occupation-level adoption-realization context

Current source path:
- BLS labor-market context from `occupation_labor_market_context.csv`
- ACS sector bridge from `occupation_btos_sector_mix.csv`
- BTOS sector AI/business-condition context from `industry_ai_adoption_context.csv`

Current live/browser status:
- this file is now a direct runtime input for the outer demand/adoption layer
- it does not change task-level automability or task-level direct evidence
- it now informs:
  - `demand_expansion_modifier`
  - `demand_expansion_signal`
  - effective adoption realization
  - `organizational_conversion`
- this means BTOS no longer sits only in calibration; it now affects runtime only after being aggregated back to the occupation layer and blended with labor context
- BTOS still does not directly touch task scores, task difficulty, or task pressure

### `occupation_recomposition_context.csv`

Derived occupation-level outer runtime recomposition and timing context.

Use it to represent:
- likely workflow compression context
- likely organizational conversion context
- likely wave acceleration context
- likely displacement-wave bias

Current source path:
- adaptation structure from `occupation_adaptation_priors.csv`
- runtime demand/adoption context from `occupation_demand_adoption_context.csv`

Current live/browser status:
- this file is now a direct runtime input for the recomposition and timing layer
- it does not change task-level automability or task-level evidence resolution
- it now informs:
  - `workflow_compression`
  - `organizational_conversion`
  - wave-state thresholds
  - `primary_displacement_wave`
- this is intentionally a constraining layer rather than a replacement layer; task exposure and the task graph still dominate the main runtime path

### `pilot_role_transformation_calibration.csv`

Stores reviewed occupation-level calibration adjustments for the reviewed set.

Use it to apply explicit, auditable changes where reviewed role logic still differs from first-pass outputs.

Current reviewed use:
- preserve stronger authority/accountability guardrails for lawyers
- promote data scientists toward augmented-core interpretation
- preserve recommendation/adoption value for management analysts
- increase recomposition pressure for technical writers
- preserve relationship and commitment work for sales representatives
- increase compression/displacement pressure for bookkeeping and clerical support roles
- preserve executive assistants as the higher-context admin contrast
- preserve project-management ownership, escalation handling, and client coordination
- preserve follow-through and judgment for broad business operations work
- increase compression pressure for customer support while keeping residual service ownership
- preserve more residual control value for accountants than for generic clerical finance support
- place paralegals under stronger recomposition pressure than attorney roles
- preserve trust, policy judgment, and manager coaching value in HR work
- preserve learning-program ownership while allowing stronger content-production recomposition
- increase direct tooling pressure for marketing analysis and marketing operations work
- preserve requirements and integration ownership for systems analysts
- preserve core engineering ownership for software developers despite higher exposure
- preserve operating ownership and resource decisions for operations managers
- preserve tradeoff judgment for finance-analysis work
- preserve decision interpretation in operations-research roles despite high modeling exposure
- preserve web-platform ownership while raising tooling pressure for web development work
- raise generation pressure for graphic-design execution while preserving brand direction
- raise generation pressure and recomposition for writers and authors
- preserve relationship and revenue ownership for advertising-oriented sales work
- preserve compliance authority, liability, and escalation ownership
- preserve supply coordination and tradeoff value in logistics work
- preserve technical ownership in electronics and mechanical engineering
- raise recomposition pressure for journalism while preserving reporting judgment
- preserve reputation and relationship coordination in public-relations work
- preserve editorial gatekeeping and quality-control value for editors
- increase compressibility pressure for statistical assistants relative to analyst roles

## Current scoring rule

The current stack now works like this:

1. Start with the richer task inventory.
2. For occupations with reviewed role variants, resolve the selected or recommended baseline variant from `occupation_role_variants.csv`.
3. Use that reviewed variant to choose the starting default task/function bundle before any user edits are applied.
4. Attach all available source-specific task evidence.
5. Compute baseline cluster automation difficulty from cluster priors shrunk toward the occupation exposure prior.
6. For clusters with strong enough resolved task-evidence coverage, shift that cluster baseline toward a task-first cluster evidence estimate.
7. Project the resulting cluster read onto active tasks as the fallback task-difficulty model.
8. Resolve each task's best available task-level evidence from `task_source_evidence.csv` using explicit source precedence.
9. For tasks with sufficiently reliable resolved task evidence, promote the task baseline itself toward task evidence.
10. For tasks with remaining reliable resolved task evidence, blend the resolved task evidence signal into final `automation_difficulty`.
11. Compute baseline task `direct_exposure_pressure` from that task-level difficulty and then blend the resolved task-pressure signal into final `direct_exposure_pressure` when reliability clears the same threshold.
12. Add indirect pressure through dependency edges.
13. Compute retained task share and retained leverage per task.
14. Aggregate the scored task rows back into task-derived cluster summaries.
15. Recompute cluster absorption, wave assignment, and the public wave engine from those task-derived cluster summaries.
16. Weight each task by how much it supports the role's function or functions.
17. Preserve human guardrails through accountability, trust, liability, and authority.
18. In the live browser scorer, compute function exposure, retained function strength, retained accountability, retained bargaining power, delegation pressure, and displacement pressure from the active edited run.
19. Derive occupation-level demand and adoption context from BLS labor signals plus ACS x BTOS sector adoption context, then use that outer layer to inform demand expansion and organizational conversion without altering task-level automability.
20. Derive occupation-level recomposition and timing context from adaptation structure plus the demand/adoption context layer, then use that outer layer to constrain workflow compression, organizational conversion, and wave timing without altering task-level automability.
21. Produce role-transformation outputs instead of stopping at exposure.
22. In the offline audit layer, apply reviewed calibration overrides only where a manual review pass has explicitly justified them.

Current bargaining-power rule:
- `retained_bargaining_power` is no longer driven mainly by static task bargaining weights
- the live scorer now leans primarily on pressure-adjusted retained task leverage, then blends in function-level bargaining retention, guardrails, retained accountability, and a centered specialization signal from the adaptation layer
- support-heavy and routine-heavy work that is already under high pressure now pulls retained bargaining power down instead of being over-credited by raw task weights alone
- high-knowledge, high-learning occupations can now retain more bargaining power even when direct pressure is nontrivial, because the live scorer treats specialization as a separate leverage signal rather than collapsing it into static task bargaining weights
- occupation-specific reviewed overrides can also lower bargaining retention where the function layer was overstating scarcity or commercial leverage for support occupations
- the live reviewed support-layer now does this partly by splitting some occupations into a higher-value default service or reconciliation anchor plus a lower-scarcity execution anchor rather than only dialing one flat occupation-wide bargaining weight down

Current accountability rule:
- `retained_accountability_strength` is no longer driven mainly by low exposure plus trust and liability
- the live scorer now leans more on `delegability_guardrail`, `human_authority_requirement`, and `judgment_requirement`, then blends in smaller trust and liability terms
- that means the score is now trying harder to capture durable human sign-off and decision ownership instead of over-crediting any role that merely operates in a trusted or regulated context
- occupation-specific reviewed overrides can still shift that layer further when the calibration queue shows a clear miss; for example, managerial people-leadership anchors can carry higher guardrail and authority priors than the generic occupation baseline, while support or advisory occupations can have those guardrails reduced when the reviewed function layer is overstating real sign-off ownership
- the same reviewed override path can also separate expert or technically scarce work from formal sign-off ownership; some occupations now keep higher bargaining retention and judgment while carrying lower authority or guardrail priors than earlier builds

Current routine-pressure rule:
- the live scorer now reads the adaptation layer's structural routine context more directly when estimating routine-task pressure and workflow compression
- occupations with high derived `routine_share`, low `people_share`, and lower job-zone complexity now get an extra routine-reachability lift, concentrated in `cluster_execution_routine`, `cluster_workflow_admin`, `cluster_documentation`, and secondarily `cluster_drafting`
- this does not replace task scoring with occupation-level priors; it only lifts the pressure/compression path for task bundles that are already structurally routine-like
- in the current runtime, that structural routine context also carries more weight for core workflow-admin and documentation tasks, and it dampens how much direct task evidence can pull those task rows down
- the current runtime now adds a second, narrower office-admin routine-context lift for occupations with very high routine share, low people share, and lower knowledge share; this extra lift is concentrated in `cluster_workflow_admin`, `cluster_documentation`, and smaller `cluster_execution_routine` slices rather than applied across all tasks
- that office-admin routine context also adds an extra evidence damp on those same admin-heavy task rows so direct task evidence cannot overstate human retention for secretarial, office-clerk, or bookkeeping-style execution work
- the current runtime now also adds a role-mix-derived clerical-execution context: when the active role is heavily concentrated in workflow-admin, documentation, and execution-routine work and its reviewed function baseline carries low authority and lower guardrails, those clerical task families receive an additional pressure lift and evidence damp before aggregation

Current live direct-evidence rule:
- `direct_evidence_reliability` must exceed `0.20` before resolved task evidence changes task difficulty or task pressure
- the `task_first_resolved_evidence` baseline path is source-aware:
  - `live_task_evidence` promotes earlier than the generic threshold
  - `reviewed_task_estimate` promotes somewhat earlier than the generic threshold
  - `benchmark_task_label` is held to a stricter threshold and lower max baseline weight
- task mapping confidence damps task-first baseline promotion so weaker task-cluster mappings do not over-promote
- blend weight is capped at `0.85`
- when a task row promotes into the task-first baseline path, the remaining task-evidence blend weight is reduced by the portion already consumed by that baseline promotion
- when multiple promoted task-level sources exist for the same task, the runtime resolves a weighted task-level consensus using source reliability, `evidence_weight`, and source-role multipliers before blending
- the task-ease signal used for `automation_difficulty` is `0.65 * automation_score + 0.25 * exposure_score + 0.10 * augmentation_score`
- the direct-pressure task signal is `0.50 * automation_score + 0.35 * exposure_score + 0.15 * augmentation_score`
- task-level source precedence is `live_task_evidence` -> `reviewed_task_estimate` -> `benchmark_task_label` -> `cluster_prior_proxy` -> `fallback_task_proxy`
- `cluster_prior_proxy` and `fallback_task_proxy` remain fallback-only tiers in the blend logic; they identify unresolved tasks but do not themselves receive a positive task-evidence blend weight
- cluster priors still provide the fallback difficulty anchor in the current live engine, but clusters with strong enough resolved task coverage can now take a task-first baseline blend before task-row scoring and tasks with strong enough direct reliability can now take a task-first task baseline as well

Current live cluster and wave rule:
- `transformation_map`, `top_exposed_work`, and `wave_trajectory` now come from cluster summaries aggregated from the scored task rows
- those task-derived cluster summaries carry task-level difficulty, wave assignment, absorption rate, direct pressure, spillover, retained share, and retained leverage
- those cluster summaries also expose whether the underlying cluster baseline came from `cluster_priors` or `task_first_cluster_evidence`, plus the task-first blend weight, evidence coverage diagnostics, and task-first task counts
- the live engine now recomputes the public wave engine from the task-derived cluster bundle rather than preserving a separate pre-task wave bundle
- when direct task coverage is very thin, high-specificity task evidence is scarce, and fallback proxy use dominates the active role mix, the runtime now activates a thin-evidence guardrail that lowers fate and timing confidence and widens recomposition bands instead of pretending the readout is equally sharp

Current live demand and adoption rule:
- the runtime no longer relies only on a one-number BLS growth transform for demand
- the engine now derives `occupation_demand_adoption_context.csv` from:
  - BLS growth, openings, and unemployment context
  - ACS occupation-to-BTOS-sector mix
  - BTOS sector AI-use and workflow-change context
- `demand_expansion_context` now replaces the old simple growth-only demand modifier when that derived context row is available
- `organizational_adoption_readiness` from the questionnaire still matters, but it is now blended with occupation-level `adoption_realization_context` to form the runtime `effective_adoption_pressure`
- `effective_adoption_pressure` now feeds `organizational_conversion` and the residual-viability friction term
- this is an outer-layer runtime input only:
  - it does not change task difficulty
  - it does not change task-level direct pressure
  - it does not change the evidence resolver source hierarchy

Current live recomposition and timing rule:
- the runtime now also derives `occupation_recomposition_context.csv` from:
  - adaptation structure such as routine share, people share, knowledge share, and job zone
  - the already-derived runtime demand/adoption context layer
- `workflow_compression_context` now blends into `workflow_compression`
- `organizational_conversion_context` now blends into `organizational_conversion`
- `wave_acceleration_context` and `displacement_wave_bias` now modestly tighten or loosen wave-state thresholds and primary displacement timing
- this is still an outer-layer runtime input:
  - it does not change task difficulty
  - it does not change task-level direct pressure
  - it does not replace the task-derived wave bundle

Current live function-context rule:
- the runtime now also derives `occupation_function_context.csv` from:
  - ORS structural guardrails
  - ACS heterogeneity
  - adaptation priors
  - quality indicators
  - labor context
  - the runtime demand/adoption context layer
- `accountability_context` now blends into `retained_accountability_strength`
- `bargaining_power_context` now blends into `retained_bargaining_power`
- `fragmentation_context` now blends into `role_fragmentation_risk`
- blend weight is confidence-aware and deliberately modest, so the reviewed function graph still dominates the runtime read
- this is still an outer-layer runtime input:
  - it does not change task difficulty
  - it does not change task-level direct pressure
  - it does not replace the reviewed task-to-function graph

Current live role-variant rule:
- a reviewed subset of occupations now exposes more than one stable default role shape in the browser scorer
- the browser recommends the closest reviewed variant from the current questionnaire profile plus the current task/function mix
- an explicit user variant choice overrides the recommendation until the user returns to auto mode
- once the baseline is chosen, the normal editable composition flow still has final authority because users can continue adding/removing tasks and functions and changing workflow links
- the current reviewed runtime-variant subset now includes `Accountants and Auditors` alongside market research, editors, technical writing, journalism, management consulting, and web development
- a nearby structural pattern now exists too: some occupations can carry reviewed supplemental anchors in the default function graph without being promoted into explicit role variants when the evidence supports a richer purpose layer but not yet multiple stable baseline role shapes
- current examples of that structural-anchor path now include `Financial and Investment Analysts`, `Software Developers`, `Graphic Designers`, `Paralegals and Legal Assistants`, `Compliance Officers`, `Training and Development Specialists`, `Mechanical Engineers`, `Business Operations Specialists, All Other`, `Computer Systems Analysts`, `Executive Secretaries and Executive Administrative Assistants`, and `Human Resources Specialists`

Current live audit-delta rule:
- when the user materially edits the composition, the runtime now also computes a comparison against the unedited baseline for the same occupation and selected reviewed variant
- that comparison does not change the live score; it exists so the result surface can explain what the edits changed
- the current delta compares direct pressure, spillover pressure, retained bargaining power, retained accountability, workflow compression, and organizational conversion
- the result contract now also exposes which tasks were added or removed, which functions changed, and how the task source mix and direct-evidence/fallback mix changed
- the result contract now exposes the largest measured shift, whether the headline fate label changed, and a short audit summary of the edit impact

Current live audit-trace rule:
- the result contract now also exposes `audit_trace`, which names the top pressure tasks, spillover tasks, retained tasks, exposed functions, retained functions, and direct-evidence citations behind the current run
- the same block now includes a plain-text `export_summary` so the browser can copy a compact audit trail into notes, review docs, or bug reports without reconstructing it client-side
- the task list UI now also uses task-row source and baseline metadata to render a short causal note for each task, explaining whether the row still follows the fallback cluster model or is being pulled by promoted/blended task evidence

## Current limitations

- Job-description evidence currently covers all `64` of `64` modeled occupations.
- Multi-anchor function coverage exists only for a reviewed subset of occupations.
- The transformation output is still a first-pass model and still depends on role-family defaults, benchmark floors, and cluster-prior proxies under the reviewed overrides.
- Resolved task evidence now affects task-level pressure and task-level difficulty in the live browser scorer, and high-reliability tasks can now use a task-first task baseline, but low-coverage tasks still fall back to the cluster-seeded path.
- The new thin-evidence guardrail only activates in unusually sparse cases; most mixed-evidence occupations still keep the standard confidence path.
- The live explanation layer is now generated from the current run, and it now includes both a baseline edit delta and a task/source/function audit trace, but it is still a compact reviewer surface rather than a full provenance browser for every intermediate score.
- The live questionnaire layer now writes a native factor-based role-refinement profile in the app, but the engine still retains the legacy-answer fallback for compatibility with external callers and older tests.
- Reviewed role variants now exist only for a small heterogeneous subset of occupations, so most occupations still use a single default baseline bundle.
