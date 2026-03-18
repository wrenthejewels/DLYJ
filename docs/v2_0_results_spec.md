# V2.0 Results Specification

## Scope

This is a supporting contract doc, not the main planning doc.

For current model status, roadmap, and next steps, read:
- `docs/README.md`
- `docs/role_transformation_overhaul_plan.md`

## Purpose

This document describes the current live `2.0` results contract as implemented in:
- `v2_engine.js`
- `app.js`
- `index.html`

Current live surfaces:
- `/` = model
- `/guide` = guide
- `/method` = methodology

## Current Public Result Order

The live page now renders results as a staged walkthrough plus appendix:

1. current analysis summary header
2. setup / default-analysis gate
3. `How we analyze your role`
4. `Where AI pressure lands first`
5. `What still needs a human`
6. `What the role becomes`
7. technical appendix

The main page no longer leads with the older dashboard stack. It now leads with the role-building walkthrough and keeps the denser audit surfaces behind progressive disclosure.

## Current Headline Surface

The sticky summary header now shows:
- occupation title
- hierarchy / level
- analysis mode
- change-selections control

The main outcome headline appears later in the walkthrough, after the role-building, pressure, and retained-human sections.

Current live `role_fate_label` values:
- `AI-supported role stays intact`
- `Same work, fewer people`
- `Less execution, more judgment`
- `Splits into execution and oversight tiers`
- `AI increases demand for the role`
- `Core role breaks down`
- `Mixed signals, path still unclear`

## Current Role Fate Map

The live `Role Fate Map` is rendered in the client from `task_breakdown.tasks`.

Current columns:
- `Current role`
- `Bargaining-power tasks`
- `Direct AI pressure`
- `Indirect spillover`
- `Retained leverage`

These columns are derived from task-level signals, not directly returned as a first-class `role_fate_map` object from the engine.

## Current Task-Evidence Behavior

The live engine is now hybrid rather than a pure cluster-only path:

1. a prior-based cluster baseline is still computed from cluster priors shrunk toward the occupation exposure prior
2. before task rows are scored, clusters with strong enough resolved task-evidence coverage can shift that baseline toward a task-first cluster evidence estimate
3. that resulting cluster baseline is projected onto active task rows as the fallback starting task-difficulty model
4. `task_source_evidence.csv` resolves each task's best available task-level evidence using source precedence
5. tasks with high enough task-level evidence reliability can now promote into a task-first task baseline before any residual task-evidence blending is applied
6. any remaining reliable resolved task evidence can still blend into task `automation_difficulty`
7. task-level direct pressure is then computed from that task-level difficulty
8. reliable resolved task evidence can also blend into the task's final `direct_exposure_pressure`

Current blend rule:
- resolved task evidence only affects task difficulty or task pressure when `direct_evidence_reliability > 0.20`
- the evidence blend weight is capped at `0.85`
- the cluster-baseline task-first path only activates when cluster-level task evidence clears the runtime coverage and reliability thresholds
- the task-baseline task-first path is source-aware:
  - `live_task_evidence` can promote earlier than the generic threshold
  - `reviewed_task_estimate` can promote somewhat earlier than the generic threshold
  - `benchmark_task_label` is held to a stricter threshold and lower max baseline weight
- task mapping confidence also damps the task-first baseline weight so ambiguous mappings do not over-promote
- the task-level source precedence is:
  - `live_task_evidence`
  - `reviewed_task_estimate`
  - `benchmark_task_label`
  - `cluster_prior_proxy`
  - `fallback_task_proxy`
- when more than one promoted task-level source is available, the runtime resolves a weighted task-level consensus using source reliability, `evidence_weight`, and source-role multipliers before applying the blend
- `cluster_prior_proxy` and `fallback_task_proxy` remain fallback metadata and do not themselves receive a task-evidence blend weight in the current runtime
- the task-ease signal used for `automation_difficulty` is:
  - `0.65 * automation_score`
  - `0.25 * exposure_score`
  - `0.10 * augmentation_score`
- the direct-pressure signal used for `direct_exposure_pressure` is:
  - `0.50 * automation_score`
  - `0.35 * exposure_score`
  - `0.15 * augmentation_score`

This means the live browser scorer is no longer purely Anthropic-or-cluster at the task layer. It now resolves multiple task-level evidence tiers, can promote them into both a coverage-aware task-first cluster baseline and a task-first task baseline, and then still falls back to cluster priors where task evidence is thin. It still is not a universal pure per-task prior model, because low-coverage tasks remain cluster-seeded.

## Current Cluster-Summary Behavior

The live engine now derives public cluster summaries from the scored task rows when `task_breakdown` is available.

Current flow:
1. score task rows
2. aggregate task rows back into task-derived cluster summaries
3. recompute public wave timing from that task-derived cluster bundle
4. use those summaries for:
   - `top_exposed_work`
   - `role_defining_work` retained-share updates
   - `transformation_map.current_bundle`
   - `transformation_map.exposed_clusters`
   - `transformation_map.retained_clusters`
   - `transformation_map.elevated_clusters`
   - `wave_trajectory`
   - `primary_displacement_wave`

This means the public cluster layer and public wave engine now reflect task-level difficulty blending, task-level direct-evidence pressure blending, and task-level spillover instead of relying only on the pre-task cluster bundle.

## Current Role-Variant Behavior

For a small reviewed subset of heterogeneous occupations, the live app now supports more than one reviewed baseline role shape.

Current flow:
1. `getRoleComposition(...)` can expose reviewed role variants for the selected occupation
2. the browser recommends the closest variant from the current questionnaire profile and current role mix
3. the user can keep that recommendation or explicitly override it
4. that selected variant changes the default task/function bundle the role studio starts from
5. after that, normal task/function editing still has final authority over the active composition used for scoring

This means the runtime is no longer always starting from one occupation-wide default bundle for every occupation.

For the stronger reviewed split occupations, the selected variant can now also change the starting function-anchor mix rather than only swapping tasks under one shared function baseline.

Current reviewed-variant occupations:
- `Market Research Analysts and Marketing Specialists`
- `Accountants and Auditors`
- `Editors`
- `Technical Writers`
- `News Analysts, Reporters, and Journalists`
- `Management Analysts`
- `Web Developers`

## Current Narrative Contract

The narrative panel now uses four structured cards:

1. `Likely Organizational Fate`
2. `Direct Pressure And Spillover`
3. `What Protects Bargaining Power`
4. `How Your Inputs Shift The Result`

These are powered by:
- `role_fate_readout.organizational_fate`
- `fate_drivers`
- `fate_counterweights`
- `narrative_summary`

## Current Result Object

The live engine returns these result fields as part of the app-facing contract:

```ts
type RoleFateState =
  | 'augmented'
  | 'compressed'
  | 'elevated'
  | 'split'
  | 'expanded'
  | 'collapsed'
  | 'mixed_transition'

type V2Result = {
  selected_role_category: string
  selected_occupation_id: string
  selected_occupation_title: string

  role_outlook: string
  role_outlook_label: string

  role_fate_state: RoleFateState
  role_fate_label: string
  role_fate_confidence: number
  role_fate_readout: {
    organizational_fate: string
    drivers: string[]
    counterweights: string[]
  }
  fate_drivers: string[]
  fate_counterweights: string[]
  role_summary: string
  occupation_explanation: {
    // Live-generated from the current edited run, not read from an offline CSV.
    role_transformation_type: string | null
    function_anchor_count: number
    primary_driver: string | null
    secondary_driver: string | null
    primary_counterweight: string | null
    evidence_profile: string | null
    confidence_band: string | null
    review_priority: string | null
    explanation_summary: string | null
  } | null

  questionnaire_profile: {
    function_centrality: number
    human_signoff_requirement: number
    liability_and_regulatory_burden: number
    relationship_ownership: number
    exception_and_context_load: number
    workflow_decomposability: number
    organizational_adoption_readiness: number
    ai_observability_of_work: number
    dependency_bottleneck_strength: number
    external_trust_requirement: number
    augmentation_fit: number
    substitution_risk_modifier: number
  }
  questionnaire_profile_source: 'native_profile' | 'legacy_answers' | 'default_profile'

  occupation_assignment: {
    role_category: string
    role_category_label: string
    selected_occupation_id: string
    selected_occupation_title: string
    onet_soc_code: string | null
    selector_weight: number
    anchor_confidence: number
    category_candidate_count: number
    category_candidate_rank: number | null
    occupation_prior_source: string | null
    assignment_method: string
    task_assignment_method: string
    selected_variant: {
      variant_id: string
      variant_label: string
      selection_mode: 'auto' | 'manual'
      recommended_variant_id: string | null
      recommended_variant_label: string | null
      recommendation_score: number | null
      recommendation_drivers: string[]
    } | null
    dominant_task_clusters: Array<{
      task_cluster_id: string
      label: string
    }>
    selected_task_inputs: {
      dominant_task_ids: string[]
      critical_task_ids: string[]
      ai_support_task_ids: string[]
      support_task_ids: string[]
    }
    selected_composition: {
      variant_id: string | null
      variant_label: string | null
      variant_mode: 'auto' | 'manual' | 'none'
      active_task_count: number
      active_function_count: number
      added_dependency_count: number
      custom_function_link_count: number
      active_task_function_link_count: number
      share_override_count: number
      removed_task_count: number
      added_task_count: number
      removed_function_count: number
      added_function_count: number
      edit_delta: {
        has_user_edits: true
        comparison_scope: 'same_occupation_same_variant_default_composition'
        baseline_variant_id: string | null
        baseline_variant_label: string | null
        baseline_task_count: number | null
        baseline_function_count: number | null
        changed_task_count: number
        changed_function_count: number
        added_task_labels: string[]
        removed_task_labels: string[]
        added_function_labels: string[]
        removed_function_labels: string[]
        share_override_count: number
        added_dependency_count: number
        custom_function_link_count: number
        source_mix_delta: {
          baseline_task_source_counts: {
            onet_tasks: number
            reviewed_job_posting_tasks: number
            reviewed_role_graph_tasks: number
          }
          current_task_source_counts: {
            onet_tasks: number
            reviewed_job_posting_tasks: number
            reviewed_role_graph_tasks: number
          }
          baseline_direct_evidence_tasks: number
          current_direct_evidence_tasks: number
          baseline_fallback_tasks: number
          current_fallback_tasks: number
        }
        baseline_role_fate_label: string | null
        current_role_fate_label: string | null
        role_fate_changed: boolean
        metric_deltas: {
          direct_exposure_pressure: number | null
          indirect_dependency_pressure: number | null
          retained_bargaining_power: number | null
          retained_accountability_strength: number | null
          workflow_compression: number | null
          organizational_conversion: number | null
        }
        largest_metric_shift: {
          metric_key: string
          metric_label: string
          direction: 'up' | 'down'
          delta: number
          current_value: number | null
          baseline_value: number | null
        } | null
        summary: string
      } | null
    }
    role_defining_cluster: {
      task_cluster_id: string
      label: string
    } | null
    direct_task_evidence_count: number
    fallback_task_count: number
    questionnaire_effect: string
  }

  primary_displacement_wave: 'current' | 'next' | 'distant'
  primary_displacement_wave_confidence: number
  primary_displacement_wave_confidence_label: 'Low' | 'Medium' | 'High'
  wave_trajectory: {
    current: WaveSnapshot
    next: WaveSnapshot
    distant: WaveSnapshot
  }

  top_exposed_work: {
    task_cluster_id: string
    label: string
    share_of_role: number
    automation_difficulty: number
    wave_assignment: 'current' | 'next' | 'distant'
    exposure_level: 'low' | 'moderate' | 'high'
  } | null

  role_defining_work: {
    task_cluster_id: string
    label: string
    share_of_role: number
    retained_share: number
    wave_assignment: 'current' | 'next' | 'distant'
    automation_difficulty: number
  } | null

  exposed_task_share: number
  residual_role_strength: 'weak' | 'moderate' | 'strong'
  personalization_fit: 'weak' | 'moderate' | 'strong'
  function_metrics: {
    function_exposure_pressure: number
    retained_function_strength: number
    retained_accountability_strength: number
    retained_bargaining_power: number
    role_fragmentation_risk: number
    role_compressibility: number
    accountability_context: number | null
    bargaining_power_context: number | null
    fragmentation_context: number | null
    accountability_context_confidence: number
    bargaining_context_confidence: number
    fragmentation_context_confidence: number
    demand_expansion_signal: number
    demand_expansion_context: number
    labor_demand_context: number
    labor_tightness_context: number
    ai_adoption_context: number
    adoption_realization_context: number
    delegation_likelihood: number
    headcount_displacement_risk: number
    role_transformation_type: string
    confidence_score: number
    support_high_pressure_share: number
    routine_high_pressure_share: number
    per_function_breakdown: Array<{
      function_id: string
      function_category: string | null
      role_summary: string | null
      function_statement: string | null
      function_weight: number
      exposure_pressure: number
      retained_strength: number
      supported_share: number
      exposed_share: number
      custom_link_count: number
    }>
  } | null

  recomposition_summary: RecompositionSummary
  transformation_map: {
    current_bundle: ClusterRow[]
    exposed_clusters: ClusterRow[]
    retained_clusters: ClusterRow[]
    elevated_clusters: ClusterRow[]
  }

  task_breakdown: {
    total_tasks_considered: number
    direct_evidence_tasks: number
    cluster_fallback_tasks: number
    user_selected_task_count: number
    tasks: RoleTaskRow[]
  }

  audit_trace: {
    top_pressure_tasks: Array<{
      task_id: string
      task_statement: string
      task_cluster_label: string | null
      task_source_label: string
      evidence_source_role: string | null
      evidence_source_id: string | null
      supporting_roles: string[]
      score: number
    }>
    top_spillover_tasks: Array<{
      task_id: string
      task_statement: string
      task_cluster_label: string | null
      task_source_label: string
      evidence_source_role: string | null
      evidence_source_id: string | null
      supporting_roles: string[]
      score: number
    }>
    top_retained_tasks: Array<{
      task_id: string
      task_statement: string
      task_cluster_label: string | null
      task_source_label: string
      evidence_source_role: string | null
      evidence_source_id: string | null
      supporting_roles: string[]
      score: number
    }>
    top_exposed_functions: Array<{
      function_id: string
      role_summary: string
      function_category: string | null
      score: number
      supported_share: number
    }>
    top_retained_functions: Array<{
      function_id: string
      role_summary: string
      function_category: string | null
      score: number
      supported_share: number
    }>
    evidence_citations: Array<{
      task_id: string
      task_statement: string
      task_source_label: string
      evidence_source_role: string | null
      evidence_source_id: string | null
      supporting_roles: string[]
      reliability: number
    }>
    export_summary: string
  } | null

  narrative_summary: {
    why_this_role_changes: string
    what_is_under_pressure: string
    what_stays_core: string
    personalization_fit_summary: string
  }

  evidence_summary: EvidenceSummary
  labor_market_context: LaborMarketContext | null
  diagnostics: Diagnostics
}
```

## Current Task Row Contract

```ts
type RoleTaskRow = {
  task_id: string
  onet_task_id: string
  task_statement: string
  task_type: string
  task_source_bucket: 'onet_tasks' | 'reviewed_job_posting_tasks' | 'reviewed_role_graph_tasks'
  task_source_label: string
  task_cluster_id: string
  task_cluster_label: string
  share_of_role: number
  selection_multiplier: number
  automation_difficulty: number
  automation_difficulty_baseline: number
  automation_difficulty_baseline_source: 'cluster_priors' | 'task_first_cluster_evidence' | 'task_first_resolved_evidence'
  automation_difficulty_task_first_weight: number
  automation_difficulty_evidence_weight: number
  automation_difficulty_source: 'cluster_model' | 'resolved_task_evidence' | 'task_first_resolved_evidence'
  wave_assignment: 'current' | 'next' | 'distant'
  direct_exposure_pressure: number
  direct_pressure_baseline: number
  direct_pressure_evidence_signal: number | null
  direct_pressure_evidence_weight: number
  direct_pressure_source: 'cluster_model' | 'resolved_task_evidence'
  indirect_dependency_pressure: number
  value_centrality: number
  bargaining_power_weight: number
  role_criticality: 'core' | 'supporting' | string
  ai_support_observability: number
  evidence_confidence: number
  direct_evidence_reliability: number
  mapping_method: string
  mapping_confidence: number
  evidence_type: string
  evidence_source: string | null
  observed_usage_share: number
  has_direct_evidence: boolean
  has_live_task_evidence: boolean
  resolved_evidence_source_role: string | null
  resolved_evidence_promotion_status: string | null
  resolved_evidence_source_count: number
  resolved_evidence_task_source_count: number
  resolved_evidence_supporting_source_ids: string[]
  resolved_evidence_supporting_roles: string[]
  is_role_critical: boolean
  is_user_selected_dominant: boolean
  is_user_selected_critical: boolean
  is_user_selected_ai_support: boolean
  is_user_selected_support_task: boolean
  elevation_boost: number
  exposed_share: number
  retained_share: number
  retained_leverage: number
  exposure_score: number
  exposure_level: 'low' | 'moderate' | 'high'
  likely_mode: 'automation' | 'augmentation' | 'mixed'
}
```

`ClusterRow` in the current live result is now effectively a task-derived cluster summary with fields including:

```ts
type ClusterRow = {
  task_cluster_id: string
  label: string
  share_of_role: number
  automation_difficulty: number
  automation_difficulty_source: 'task_aggregated_cluster_model' | 'task_aggregated_resolved_task_evidence' | 'task_aggregated_task_first_resolved_evidence'
  baseline_difficulty_source: 'cluster_priors' | 'task_first_cluster_evidence'
  task_first_weight: number
  task_evidence_coverage_ratio: number
  task_evidence_mean_reliability: number
  resolved_task_evidence_count: number
  wave_assignment: 'current' | 'next' | 'distant'
  wave_assignment_source: 'task_aggregated'
  absorption_rate: number
  direct_exposure_pressure: number
  indirect_dependency_pressure: number
  retained_leverage: number
  evidence_confidence: number
  exposure_score: number
  exposure_level: 'low' | 'moderate' | 'high'
  exposed_share: number
  retained_share: number
  residual_relevance: number
  elevation_boost: number
  absorbed_share: number
  is_role_critical: boolean
  direct_evidence_task_count: number
  task_first_task_count: number
  task_evidence_adjusted_tasks: number
  summary_source: 'task_aggregated'
}
```

The editable composition payload that drives this result is now:

```ts
type CompositionEdits = {
  removed_task_ids: string[]
  added_task_ids: string[]
  removed_function_ids: string[]
  added_function_ids: string[]
  task_share_overrides: Record<string, number>
  task_function_links: Array<{
    task_id: string
    function_id: string
  }>
}

type DependencyEdits = {
  added_edges: Array<{
    from_task_id: string
    to_task_id: string
  }>
}
```

The live model page now usually produces this payload through `getRoleComposition(occupationId)` plus the role graph editor, not through the older five-selector task-input flow.

The engine also exposes an occupation-scoped composition baseline through `getRoleComposition(occupationId)`, with source-bucketed tasks plus function anchors for the editor.
That baseline now includes the reviewed task-to-function graph for both display and live scoring; custom task-to-function links are additive overrides rather than the only function links the scorer sees.
For some occupations, that baseline can now also include more than one reviewed default function anchor even when the occupation does not expose explicit runtime role variants. Current examples are `Financial and Investment Analysts`, `Software Developers`, `Graphic Designers`, `Paralegals and Legal Assistants`, `Compliance Officers`, `Training and Development Specialists`, `Mechanical Engineers`, `Business Operations Specialists, All Other`, `Computer Systems Analysts`, `Executive Secretaries and Executive Administrative Assistants`, and `Human Resources Specialists`, each of which now starts from a richer reviewed function graph without exposing a separate variant selector.

Current counter meaning:
- `task_breakdown.direct_evidence_tasks` now means active tasks resolved to a task-level evidence tier (`live_task_evidence`, `reviewed_task_estimate`, or `benchmark_task_label`), not only Anthropic-backed rows.
- `task_breakdown.cluster_fallback_tasks` means active tasks that still fall back to proxy-only resolution.

Current supporting counters:
- `evidence_summary.source_coverage.task_evidence_adjusted_rows` = how many active task rows actually received a resolved-task-evidence blend
- `diagnostics.task_evidence_adjusted_tasks` = matching engine-level counter for the same runtime behavior
- `evidence_summary.source_coverage.task_first_cluster_rows` = how many active cluster baselines promoted into the coverage-aware task-first path
- `diagnostics.task_first_cluster_count` = matching engine-level counter for that cluster-baseline behavior
- `evidence_summary.source_coverage.task_first_task_rows` = how many active task rows promoted into the task-first task baseline path
- `diagnostics.task_first_task_count` = matching engine-level counter for that task-baseline behavior
- `evidence_summary.source_coverage.live_task_evidence_rows` = how many active task rows resolved primarily to Anthropic live task evidence
- `evidence_summary.source_coverage.reviewed_task_estimate_rows` = how many active task rows resolved primarily to reviewed task estimates
- `evidence_summary.source_coverage.benchmark_task_label_rows` = how many active task rows resolved primarily to benchmark task labels
- `evidence_summary.source_coverage.cluster_proxy_rows` = how many active task rows still fall back to cluster proxy resolution
- `evidence_summary.thin_evidence_guardrail` = a narrow runtime uncertainty flag that activates only when direct task coverage, high-specificity task evidence, and task-first promotion are all very thin while fallback proxy use dominates the role mix
- `primary_displacement_wave_confidence` = a separate timing-confidence score so wave timing can be less certain than the structural readout when task evidence is unusually sparse

## Structural Scores Now Used Publicly

The live page relies on these engine-level structural scores:
- `direct_exposure_pressure`
- `indirect_dependency_pressure`
- `retained_leverage_score`
- `residual_role_integrity`
- `exposed_core_share`
- `retained_core_share`
- `demand_expansion_modifier`
- `function_retention`
- `function_exposure_pressure`
- `retained_function_strength`
- `retained_accountability_strength`
- `retained_bargaining_power`
- `delegation_likelihood`
- `headcount_displacement_risk`
- `demand_expansion_context`
- `labor_demand_context`
- `labor_tightness_context`
- `ai_adoption_context`
- `adoption_realization_context`
- `workflow_compression_context`
- `organizational_conversion_context`
- `wave_acceleration_context`
- `displacement_wave_bias`
- `augmentation_fit`
- `substitution_risk_modifier`

Current live derivation notes:
- `retained_accountability_strength` now leans primarily on delegability guardrails, human authority, and judgment, with smaller trust and liability terms
- `retained_bargaining_power` now leans primarily on pressure-adjusted retained task leverage, then blends in function-level bargaining retention, guardrails, retained accountability, and a centered specialization signal from the adaptation layer
- reviewed function priors can now distinguish expert judgment from formal sign-off ownership more explicitly for some occupations, which can lower `retained_accountability_strength` without collapsing `retained_bargaining_power`
- the same reviewed function layer can now also lower `retained_bargaining_power` for support occupations whose earlier function defaults overstated scarce leverage
- in the current runtime, some support occupations now express that lower leverage through reviewed supplemental execution anchors rather than only a flat occupation-wide discount; bookkeeping now separates transaction processing from reconciliation-heavy work, and customer support now separates queue execution from higher-value issue resolution
- that same pattern now also applies to `Statistical Assistants`, where lower-scarcity data-preparation execution sits below higher-value statistical-support and analyst-coordination work
- the live function layer can also separate lower-signoff deal-motion work from commercial ownership; `Sales Representatives of Services` now routes pipeline, proposal, and internal deal-orchestration work through a lighter reviewed anchor instead of forcing it into the same accountability readout as pricing, relationship judgment, and revenue ownership
- the same structural pattern now also applies to some administrative work; `Secretaries and Administrative Assistants` now separates scheduling and coordination support from lower-authority clerical execution instead of forcing those tasks through one blended administrative guardrail profile

Public wording rule:
- keep `residual_role_integrity`
- do not expose `coherence` as the primary public label
- when wave cards still display wave connectivity, label it as `retained integrity`

Current metric note:
- `retained_bargaining_power` in the live engine now leans more on pressure-adjusted retained task leverage and less on raw task bargaining-weight averages alone
- the same metric now also reads adaptation-layer knowledge share, learning intensity, and adaptive capacity as a centered specialization lift
- routine-heavy or support-heavy work that is already under high pressure now drags this metric down more than it did in earlier builds
- `workflow_compression` and the routine-pressure path now also incorporate an adaptation-derived routine-context lift for structurally routine, low-people-intensity occupations, concentrated in execution/admin/documentation-heavy task bundles
- for core workflow-admin and documentation tasks, that same structural routine context now also dampens how much direct task evidence can pull direct pressure below the routine/admin baseline
- the current runtime now adds a narrower office-admin routine-context lift for very routine, low-people, lower-knowledge occupations, which further raises direct pressure in workflow-admin, documentation, and some execution-routine tasks before the final role summary is aggregated
- the current runtime now also adds a role-mix-derived clerical-execution lift for office-clerk-like roles with heavy admin/documentation shares and low-authority function baselines, which further raises direct pressure and workflow compression for those clerical task families before aggregation
- the current runtime no longer derives demand context from BLS growth alone when `occupation_demand_adoption_context.csv` exists
- the current runtime now splits the outer layer into:
  - labor demand context
  - labor tightness context
  - sector-weighted AI adoption context
  - adoption-realization context
- questionnaire-side `organizational_adoption_readiness` is now blended with occupation-level `adoption_realization_context` to form `effective_adoption_pressure`
- that effective adoption pressure affects recomposition and outer role-fate pressure, but not task-level automability

## Current Runtime Demand / Adoption Contract

The live browser scorer now has an explicit outer runtime context layer:

- `occupation_demand_adoption_context.csv`
  - derived from BLS labor context plus ACS x BTOS adoption context
  - used for demand expansion and adoption realization
  - not used for task-level automability

Current output surfaces:
- `labor_market_context` now also exposes:
  - `demand_expansion_context`
  - `labor_demand_context`
  - `labor_tightness_context`
  - `ai_adoption_context`
  - `adoption_realization_context`
  - `context_confidence`
  - `btos_covered_sector_share`
- `diagnostics` now also exposes:
- `effective_adoption_pressure`
- `demand_expansion_context`
- `labor_demand_context`
- `labor_tightness_context`
- `ai_adoption_context`
- `adoption_realization_context`
- `workflow_compression_context`
- `organizational_conversion_context`
- `wave_acceleration_context`
- `displacement_wave_bias`

Current interpretation:
- `demand_expansion_modifier` is now the runtime demand read used by the fate classifier
- when the derived context row exists, it comes from `demand_expansion_context`
- when that row is missing, the engine still falls back to the older simple BLS growth transform

## Current Runtime Recomposition / Timing Contract

The live browser scorer now also has a second outer runtime context layer:

- `occupation_recomposition_context.csv`
  - derived from adaptation structure plus the runtime demand/adoption context
  - used for recomposition and timing
  - not used for task-level automability

Current output surfaces:
- `labor_market_context` now also exposes:
  - `workflow_compression_context`
  - `organizational_conversion_context`
  - `wave_acceleration_context`
  - `displacement_wave_bias`
  - `recomposition_context_confidence`
- `diagnostics` now also exposes:
  - `workflow_compression_context`
  - `organizational_conversion_context`
  - `wave_acceleration_context`
  - `displacement_wave_bias`
  - `timing_confidence`
- `evidence_summary` now also exposes:
  - `thin_evidence_guardrail`
- `function_metrics` and `diagnostics` now also expose:
  - `accountability_context`
  - `bargaining_power_context`
  - `fragmentation_context`
  - per-context confidence fields
- top-level result now also exposes:
  - `primary_displacement_wave_confidence`
  - `primary_displacement_wave_confidence_label`

Current interpretation:
- `workflow_compression` and `organizational_conversion` now also receive a derived occupation-level recomposition/timing context
- wave-state thresholds and `primary_displacement_wave` now also receive a modest occupation-level timing bias from that same recomposition context
- when direct task evidence is unusually thin and fallback dominates the active role mix, the runtime now lowers fate and timing confidence and widens recomposition bands rather than keeping the standard confidence path
- this is still an outer-layer runtime input only:
  - it does not affect task difficulty
  - it does not affect task-level direct pressure
  - it does not replace the task-derived wave bundle

## Current Runtime Function Contract

The live browser scorer now also has a third outer runtime context layer:

- `occupation_function_context.csv`
  - derived from ORS, ACS heterogeneity, adaptation, quality, labor, and the runtime demand/adoption context
  - used for retained accountability, retained bargaining power, and fragmentation risk
  - not used for task-level automability

Current interpretation:
- `retained_accountability_strength` now also receives a modest occupation-level accountability context
- `retained_bargaining_power` now also receives a modest occupation-level bargaining context
- `role_fragmentation_risk` now also receives a modest occupation-level fragmentation context
- these blends are confidence-aware and deliberately modest, so the reviewed function graph still dominates the live read

## Current Gaps Between Spec And Implementation

Still not implemented as first-class result objects:
- a direct `role_fate_map` payload from the engine
- explicit `split_risk`, `collapse_risk`, or `elevation_potential` fields
- source drill-down at the task-row UI level
- weighted user-entered task shares
- universal per-task priors; the current live build now has both task-first cluster baselines and task-first task baselines, but low-coverage tasks still inherit a cluster-seeded fallback path

Still implemented as transitional compatibility surfaces:
- `role_outlook`
- `role_outlook_label`
- wave trajectory cards
- legacy transformation cluster lists
- legacy-answer questionnaire compatibility fallback

Current explanation surface:
- the engine now returns a live explanation summary generated from the current edited run
- the explanation block is now aligned to the same task/function graph and function metrics that drive the live score
- the client also surfaces task-to-function links and user-declared support links in the composition flow before scoring
- for supported occupations, the client also surfaces a reviewed role-variant selector ahead of the graph editor and shows whether the current baseline is recommended or manually overridden
- the result payload now also returns a composition-edit delta against the unedited baseline for the same occupation and selected reviewed variant, so the client can explain what the user’s edits actually changed
- the result payload now also returns an `audit_trace` block naming the main pressure tasks, spillover tasks, retained tasks, exposed and retained functions, direct-evidence citations, and a plain-text `export_summary` for copy/share workflows

## Current Acceptance Criteria

The current live result is considered aligned when:

1. the page shows current task makeup before the task breakdown verdict logic becomes abstract
2. direct AI pressure and indirect spillover are separate visible concepts
3. bargaining-power tasks are shown explicitly
4. role fate is a first-class label with confidence
5. task-level rows carry the main explanation burden
6. public copy does not rely on `coherence` as the main explanatory term

## Next Result-Surface Work

Recommended next changes:
- return `role_fate_map` directly from the engine rather than rebuilding it in the client
- add source drill-down and task-level citations
- add weighted task-share controls so users can do more than tag a handful of tasks
- deepen the current composition-edit delta into a fuller task/source/function drill-down
- reduce or remove the legacy-answer compatibility fallback as external callers migrate
