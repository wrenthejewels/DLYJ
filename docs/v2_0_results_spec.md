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

Current supported occupation coverage:
- the searchable selector and role studio now ship with `61` selected occupations from `data/metadata/launch_occupation_seed.csv`

## Current Public Result Order

The live page now renders results as a state-first briefing with supporting detail beneath it:

1. current analysis summary header
2. setup / default-analysis gate
3. `Structural state model`
   - task-exposure strip
   - 0-10 role outcome balance
   - transition read
4. `Five-year read`
   - five-year summary cards
   - secondary `Role coherence over time` chart
   - secondary stacked `State-share forecast` chart
5. `What is setting the state`
6. `Why this happens`
7. `What the role becomes`
8. `Occupation landscape`
   - x-y outcome map
   - 0-10 dominant-state matrix
   - restored structural diagnostic map
9. supporting-detail disclosure containing:
   - `How we analyze your role`
   - `Task pressure map`
   - `Why the timing looks this way`

The main page no longer leads with the older trajectory storyboard or the legacy wave/fate layer as the dominant object. The live result now opens with the `state_trajectory` shadow layer, keeps the canonical `trajectory` layer as supporting mechanism, and leaves the older fate/frontier fields as compatibility detail.

Within that state layer, `exposure buildout speed` should be interpreted as the capability-side exposure control. It affects both how sharply already-exposed task pressure ramps and how quickly moderately hard tasks start entering the exposed set as frontier capability expands.

The current state calibration is also intentionally less willing than earlier builds to overuse `rebalanced` or `indeterminate` as sink states. Higher transformed-share paths now pull more readily into `compressed` or `displaced` when structural support and demand do not keep pace.

## Current Headline Surface

The sticky summary header now shows:
- occupation title
- hierarchy / level
- analysis mode
- change-selections control

The main outcome headline now appears inside the structural-state panel rather than the older trajectory panel.

Current live trajectory states:
- `stable`
- `expanding`
- `transforming`
- `compressing`
- `collapsing`
- `unsettled`

Current live internal `role_fate_state` values:
- `augmented`
- `compressed`
- `elevated`
- `split`
- `expanded`
- `collapsed`
- `mixed_transition`

Current live public `role_fate_label` values:
- `Your role stays intact — AI assists, you still lead`
- `The work survives, but fewer people will do it`
- `Execution is leaving this role. Judgment is what stays.`
- `Your role is splitting into two different seats`
- `Demand for this role is growing alongside AI`
- `The standalone seat here is weakening`
- `The path forward for this role is still unsettled`

Current classification approach:
- `classifyRoleFate()` uses a score-per-fate system rather than a sequential if/else tree
- Each of the 7 fates receives a composite score from weighted soft-gate contributions using `fateGate(value, threshold, ramp)`, `fateGateBelow(value, threshold, ramp)`, and `fateGateBand(value, low, high, ramp)` helpers (sigmoid-like clamped ramps with configurable half-width, default 0.08)
- The fate with the highest composite score wins; ties degrade smoothly instead of depending on evaluation order
- `mixed_transition` has no fixed base score; it must earn its score from cross-pressure (protective and destructive signals coexisting) and a mid-range integrity band. It only wins when signals genuinely conflict, not by default when nothing else is clear.
- `split` uses a continuous function-count ramp (0 at 0 functions, ~0.25 at 1, ~0.75 at 2, 1.0 at 3+) instead of a hard binary gate at 2
- Numeric-threshold contributions use soft gates; pure categorical checks on `roleState`/`nextWaveState` remain discrete
- Confidence blends three signals: classifier margin between top two fates (40%), signal decisiveness across key inputs (30%), and evidence quality from `recompositionConfidence` (30%). Clamped to [0.18, 0.92].
- The return includes a `_scores` object with all 7 per-fate composite scores for debugging

Current interpretation rule:
- `Your role is splitting into two different seats` is intentionally strict and only fires when the live function layer shows real internal bifurcation rather than generic workflow recomposition
- `The work survives, but fewer people will do it` no longer fires on median direct-pressure values alone; it now needs clearer seat-compression evidence such as higher headcount displacement risk or a thinner retained core
- the fate gate uses the earlier wave-derived `role_outlook` state as a calibration anchor, so coherent retained-core roles are less likely to be flattened into `The work survives, but fewer people will do it`
- moderate-pressure roles with coherent retained work now tend to fall into `Your role stays intact — AI assists, you still lead`, `Execution is leaving this role. Judgment is what stays.`, or `The path forward for this role is still unsettled` instead of the older broader split/compression path
- `Demand for this role is growing alongside AI` and `The path forward for this role is still unsettled` are both reachable in the live classifier under default settings

## Current Trajectory Surface

The live client now synthesizes the task-, function-, and context-level outputs into one canonical `trajectory` object.

That layer exposes:
- `P(s)` = execution compression by scenario
- `D(s)` = demand response by scenario
- `S` = structural necessity
- `L(s)` = role viability by scenario
- a graph-ready `timeline` block with:
  - one dense baseline transformed-share curve driven by `P(t)`
  - a conservative/aggressive transformed-share scenario band
  - a continuous time axis rather than wave regions
  - a buildout marker at max baseline `dP/dt`
  - threshold markers placed directly on the baseline `P(t)` curve at the `30%`, `50%`, and `70%` crossing years
- threshold timing ranges for three thresholds across conservative / baseline / aggressive growth profiles
- per-function trajectory contributions grouped as:
  - `holding_core`
  - `thinning`
  - `retained_role`
- when reviewed function depth is too thin to keep those groups distinct, later groups can backfill from non-overlapping scored tasks so the section still reads as three different slices of the role instead of repeating one anchor

The older storyboard, fate, trigger, and seat maps still exist, but they now sit behind the trajectory layer rather than defining the main user read.

## Current State-Trajectory Shadow Layer

The live client now also exposes a parallel `state_trajectory` object ahead of the older trajectory surface.

This layer is intentionally experimental and is built from the same steps `1-8` substrate rather than from the older fate labels. It is trying to answer a slightly different question:

- how structurally broad or narrow is the role?
- does one automatable bottleneck dominate the seat?
- does AI free human time to concentrate on the retained core?
- does demand offset enough of the buildout to preserve the seat?
- how strong is the firm incentive to finish automation?

Current live `state_trajectory` states:
- `retained`
- `complemented`
- `demand_expanding`
- `rebalanced`
- `compressed`
- `bottleneck_fragile`
- `displaced`
- `indeterminate`

Current live first-pass `state_trajectory` fields:
- `headline`
- `summary`
- `current_state`
- `likely_next_state`
- `distant_state`
- `long_run_state`
- `dimensionality`
- `bottleneck_risk`
- `focus_reallocation`
- `demand_offset`
- `firm_incentive`
- `hierarchy_persistence`
- `curve_family`
- `tipping_points`
- `primary_tipping_point`
- `checkpoints.current|next|distant`
- `timeline`
- `primary_risk`
- `transition_conditions`
- `assumptions`

Current live `state_trajectory.timeline` shape:
- `y_metric = role_integrity`
- `baseline.points[]` with:
  - `year`
  - `role_integrity`
  - `state`
  - `state_label`
  - `transformed_share`
  - `demand_offset`
  - `structural_support`
  - `bottleneck_risk`
  - `firm_incentive`
  - `transition_pressure`
- `band.points[]` with:
  - `year`
  - `lower_role_integrity`
  - `upper_role_integrity`
- `state_runs[]`
- `markers.transitions[]`
- `markers.largest_shift`
- `markers.floor`

Current live note:
- this layer is a shadow interpretation engine built on top of the shared task/function scorer
- it does not replace `trajectory`, `role_fate_*`, or the older compatibility exports yet
- its demand, firm-incentive, adoption-speed, exposure-buildout-speed, and role-staying-power assumptions are intentionally tunable from the client, and those continuous controls are isolated to this new layer rather than mutating the legacy trajectory contract
- the main page now leads this layer with a task-exposure strip and a derived `0-10` role outcome balance chart built from `state_trajectory.timeline.baseline.points`
- that hero chart compresses the richer state model into three user-facing shares of today’s role over time: `mostly intact`, `changed but retained`, and `downside risk`
- that hero chart is no longer shaped by one generic mapping only; the client now reads `state_trajectory.curve_family` and `state_trajectory.primary_tipping_point` to reshape the balance curve so different roles can read as `stable hold`, `complement then hold`, `rebundle then hold`, `early compression`, `compression then break`, `late cliff`, or `demand expansion`
- the top chart therefore functions as a role-path summary, not as a literal probability distribution: it uses the shared state timeline, then bends that timeline into a more occupation-specific path family once the engine has identified the main structural break
- the same top-level state forecast still uses the client-side `STATE_FORECAST_WEIGHTS` mapping, but that stacked five-state view now lives below as a secondary `State-share forecast` chart rather than the hero chart
- the underlying trajectory timeline no longer assumes that year-0 transformed share is near zero by default; task contributions now include a present-day realization floor based on current direct pressure, observability, cluster capability readiness, and absorption, reduced by retained leverage and accountability
- for the covered subset of occupations, that same present-day floor now also reads a narrow occupation-level individual-usage anchor from `occupation_individual_ai_usage_context.csv`; this is a soft year-0 calibration input only, not a task-evidence source
- the state forecast share mapping is now defined in a named `STATE_FORECAST_WEIGHTS` constant in `app.js` (previously inline magic numbers). Each weight maps a continuous engine signal to one of the five user-facing states, with documented calibration basis and per-weight comments
- that top forecast now uses explicit yearly ticks from `0` through `10`, rather than the older grouped time labels
- the top strip now separates work pressure from occupational outcome by surfacing:
  - direct AI pressure today
  - spillover-affected work
  - work likely to change by year `5`
  - the current human-retained core
- the same top block now also exposes five-year summary outputs derived from that forecast:
  - first structural shift
  - fastest transition period
  - dominant state by year `5`
  - role mostly intact by year `5`
  - displacement risk by year `5`
- the transition read above those cards now also surfaces the model's primary tipping point when one is present, so the summary can name the condition most likely to change the role path rather than only restating the first state transition
- the continuous role-integrity line now remains visible only as a secondary explanatory chart beneath that main forecast, so the page distinguishes occupational outcome from the integrity of today's job shape
- the older `Transformation layer`, transformed-share hero chart, `Curve checkpoints`, and timing-frontier section are no longer part of the default main-page flow
- the client no longer re-renders those hidden legacy trajectory/wave/timing sections on every result update; they now survive only as dormant compatibility surfaces plus exported engine fields
- the transition-trigger layer now reads the shared `next_wave_retained` diagnostic directly instead of falling back to the exported `wave_trajectory` object
- `What the role becomes` remains on the main page, but it now ships as a compressed retained-role summary rather than a second full analytical surface

The supporting-detail disclosure remains where denser surfaces live:
- `How we analyze your role`
- `Task pressure map`
- `Why the timing looks this way`

Those supporting sections still expose:
- the timing-frontier panel, now nested inside a collapsed `Inspect timing model` inspector, with:
  - the role's primary frontier blocker
  - scenario activation across `current`, `next`, `distant`, and the adoption ceiling
  - the four frontier components (`capability_readiness`, `supervision_readiness`, `economic_pressure`, `organizational_friction`)
  - the top work bundles currently setting the timing read
- a visible occupation landscape on the main page that now stacks three comparison views:
  - an x-y outcome map using first structural shift versus year-10 displacement share
  - a `0-10` dominant-state matrix across all modeled occupations under a separate occupation-comparison control panel
  - a restored structural diagnostic map using the older pressure/integrity axes, but now described in current structural-state language rather than fate/wave language
  - those occupation-level surfaces share one cached occupation snapshot under the active occupation-comparison controls, so the page does not recompute the full launch set separately for each view
  - the occupation-comparison controls are intentionally separate from the individual role controls above and always apply reviewed default questionnaire presets for each occupation at the selected hierarchy level
- hierarchy now affects the runtime in two ways:
  - it shifts the questionnaire/profile inputs toward more ownership, sign-off, coordination, and exception load at higher levels
  - it adds a narrow hierarchy-persistence bonus to structural support when higher hierarchy is paired with real retained ownership signals, so senior seats are slower to dissolve without simply lowering task exposure
- the state layer now also detects explicit structural tipping points on the baseline timeline:
  - `first_structural_shift`
  - `retained_reorganization`
  - `compression_overtakes_offset`
  - `bottleneck_cliff`
  - `intactness_break`
  - `displacement_plausible`
- rebundle panels naming which work bundles shrink first and which retained bundles likely grow
- transition-trigger cards showing when the role crosses from assistive use into delegation, compression, or structural seat change
- the seat map showing what leaves the seat, what stays human-owned, and what expands inside the retained role
- confidence badges and source-aware reasons on bundle rows
- the appendix / audit surfaces for denser task, evidence, and edit-delta detail

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
- current GPT task-label coverage note:
  - `benchmark_task_label` rows now span all `61` selected occupations
  - all `30` promoted next-phase occupations now have benchmark task-label rows in the live resolver
  - `task_benchmark_gpt4_labels.csv` now carries `1300` rows across the live selector
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
3. derive a per-cluster `timing_frontier` from the task-derived cluster bundle
4. evaluate explicit `current`, `next`, and `distant` scenarios using:
   - cluster capability readiness
   - supervision readiness
   - economic pressure
   - organizational friction
   - occupation-level scenario inputs from `occupation_recomposition_context.csv`
5. assign each cluster to the earliest scenario where its frontier margin clears the hurdle
6. use those summaries for:
   - `top_exposed_work`
   - `role_defining_work` retained-share updates
   - `task_accession_map`
   - `transition_trigger_map`
   - `transformation_map.current_bundle`
   - `transformation_map.exposed_clusters`
   - `transformation_map.retained_clusters`
   - `transformation_map.elevated_clusters`
   - `wave_trajectory`
   - `primary_displacement_wave`

The browser now treats the structural cluster id and the public bundle label as different things. The runtime keeps the underlying `task_cluster_id` / `task_cluster_label`, but user-facing readouts now default to a task-derived public label synthesized from the highest-share tasks plus linked function anchors.

This means the public cluster layer and public wave engine now reflect task-level difficulty blending, task-level direct-evidence pressure blending, task-level spillover, and explicit timing-frontier hurdle crossings instead of relying only on the pre-task cluster bundle or raw difficulty bands.

## Current Role-Variant Behavior

For a small reviewed subset of heterogeneous occupations, the live app now supports more than one reviewed baseline role shape.

That subset now includes `Market Research Analysts and Marketing Specialists`, `Editors`, `Technical Writers`, `News Analysts, Reporters, and Journalists`, `Management Analysts`, `Accountants and Auditors`, and `Office Clerks, General`.

Current flow:
1. `getRoleComposition(...)` can expose reviewed role variants for the selected occupation, and the live page now surfaces that reviewed-variant choice inline under occupation selection when one exists
2. the browser recommends the closest variant from the current questionnaire profile and current role mix when the user has supplied real profile or composition-edit signal; otherwise baseline runs keep the reviewed default variant
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

## Current Supporting-Detail Contract

The denser explanation layer now sits behind the technical appendix rather than as four top-level narrative cards.

Current supporting-detail surfaces include:
- task-level breakdowns
- shrinking versus growing work bundles from the new accession layer
- transition-trigger thresholds for assistive use, delegation, compression, and structural seat change
- task source labels and evidence tiers

These are still powered by the same result fields:
- `role_fate_readout.organizational_fate`
- `fate_drivers`
- `fate_counterweights`
- `narrative_summary`
- `occupation_assignment`
- `recomposition_summary`
- `task_accession_map`
- `transition_trigger_map`

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

type TriggerFrontier = {
  scenario_margins: {
    current: number
    next: number
    distant: number
  }
  crossing_wave: 'current' | 'next' | 'distant'
  readiness_score: number
  binding_constraint: 'capability_limited' | 'supervision_limited' | 'economics_limited' | 'organization_limited' | null
  binding_constraint_label: string | null
}

type TrajectoryState =
  | 'stable'
  | 'expanding'
  | 'transforming'
  | 'compressing'
  | 'collapsing'
  | 'unsettled'

type TrajectoryTimelineThreshold = {
  key: 'noticeable_change' | 'role_restructuring' | 'major_transformation'
  label: string
  threshold: number
  year: number | null
  marker_year: number
  compression: number
  demand: number
  viability: number
  crossed: boolean
}

type TrajectoryTimelineBaselinePoint = {
  year: number
  compression: number
  transformed_share: number
  demand: number
  viability: number
  dp_dt: number
}

type TrajectoryTimelineBandPoint = {
  year: number
  conservative_compression: number
  conservative_transformed_share: number
  aggressive_compression: number
  aggressive_transformed_share: number
  lower_compression: number
  lower_transformed_share: number
  upper_compression: number
  upper_transformed_share: number
  conservative_viability: number
  aggressive_viability: number
  lower_viability: number
  upper_viability: number
}

type TrajectoryTimelineInflection = {
  year: number
  compression: number
  transformed_share: number
  demand: number
  viability: number
  dp_dt: number
}

type TrajectoryTimelineBaseline = {
  label: string
  points: Array<TrajectoryTimelineBaselinePoint>
}

type V2Result = {
  selected_role_category: string
  selected_occupation_id: string
  selected_occupation_title: string

  trajectory: {
    state: TrajectoryState
    headline: string
    summary: string
    role_shape: 'oversight_heavy' | 'coordination_heavy' | 'compressed_seat' | 'split_role' | 'dissolved_role' | 'mixed_shape'
    structural_necessity: {
      score: number
      explanation: string
    }
    scenarios: {
      current: { compression: number, demand: number, viability: number, interpretation: string }
      next: { compression: number, demand: number, viability: number, interpretation: string }
      distant: { compression: number, demand: number, viability: number, interpretation: string }
    }
    threshold_timing: {
      noticeable_change: { conservative: string, baseline: string, aggressive: string }
      role_restructuring: { conservative: string, baseline: string, aggressive: string }
      major_transformation: { conservative: string, baseline: string, aggressive: string }
    }
    demand_response: {
      epsilon: number
      latent_demand: number
      satiation_headroom: number
      revenue_linkage: number
      explanation: string
    }
    present_day_anchor: {
      usage_anchor: number | null
      structural_floor_basis: number
      empirical_weight: number
      observed_exposure: number | null
      gap_direction: 'aligned' | 'individual_higher' | 'org_higher' | null
      calibration_flag: 'ok' | 'watch' | 'review' | 'no_data' | null
    }
    timeline: {
      x_max_years: number
      y_metric: 'transformed_share'
      scenario_anchors: Array<{
        key: 'current' | 'next' | 'distant'
        label: string
        year: number
      }>
      baseline: TrajectoryTimelineBaseline
      band: {
        conservative_label: string
        aggressive_label: string
        points: Array<TrajectoryTimelineBandPoint>
      }
      markers: {
        inflection: TrajectoryTimelineInflection | null
        thresholds: {
          noticeable_change: TrajectoryTimelineThreshold
          role_restructuring: TrajectoryTimelineThreshold
          major_transformation: TrajectoryTimelineThreshold
        }
      }
    }
    function_contributions: {
      holding_core: Array<{
        function_id: string
        label: string
        function_category: string | null
        score: number
        summary: string
      }>
      thinning: Array<{
        function_id: string
        label: string
        function_category: string | null
        score: number
        summary: string
      }>
      retained_role: Array<{
        function_id: string
        label: string
        function_category: string | null
        score: number
        summary: string
      }>
    }
    drivers: Array<{
      key: 'execution_compression' | 'demand_response' | 'structural_necessity'
      label: string
      strength: number
      summary: string
    }>
  }

  state_trajectory: {
    headline: string
    summary: string
    current_state: 'retained' | 'complemented' | 'demand_expanding' | 'rebalanced' | 'compressed' | 'bottleneck_fragile' | 'displaced' | 'indeterminate'
    likely_next_state: same as current_state
    distant_state: same as current_state
    long_run_state: same as current_state
    dimensionality: {
      score: number
      label: 'Low' | 'Moderate' | 'High'
      task_effective_count: number
      cluster_effective_count: number
      function_effective_count: number
      retained_effective_count: number
      top_task_share: number
      top_cluster_share: number
      explanation: string
    }
    bottleneck_risk: {
      score: number
      label: 'Low' | 'Moderate' | 'High'
      top_core_label: string | null
      top_core_exposure: number
      top_two_core_share: number
      explanation: string
    }
    focus_reallocation: {
      score: number
      label: 'Low' | 'Moderate' | 'High'
      routine_share: number
      explanation: string
    }
    demand_offset: {
      score: number
      base_score: number
      mode: 'Low' | 'Moderate' | 'High'
      explanation: string
    }
    firm_incentive: {
      score: number
      mode: 'Low' | 'Moderate' | 'High'
      explanation: string
    }
    hierarchy_persistence: {
      score: number
      bonus: number
      label: 'Low' | 'Moderate' | 'High'
      explanation: string
    }
    checkpoints: {
      current: StateCheckpoint
      next: StateCheckpoint
      distant: StateCheckpoint
    }
    timeline: {
      y_metric: 'role_integrity'
      x_max_years: number
      baseline: {
        label: string
        points: StateTimelinePoint[]
      }
      band: {
        conservative_label: string
        aggressive_label: string
        points: Array<{
          year: number
          lower_role_integrity: number
          upper_role_integrity: number
          lower_transition_pressure: number
          upper_transition_pressure: number
        }>
      }
      state_runs: Array<{
        state: string
        state_label: string
        start_year: number
        end_year: number
        duration_years: number
        marker_year: number
        start_role_integrity: number
        end_role_integrity: number
      }>
      markers: {
        largest_shift: {
          year: number
          role_integrity: number
          slope: number
          state: string | null
          state_label: string | null
        } | null
        transitions: Array<{
          year: number
          state: string
          state_label: string
          role_integrity: number
        }>
        floor: StateTimelinePoint | null
      }
    }
    primary_risk: string
    transition_conditions: Array<{
      key: string
      score: number
      label: string
      summary: string
    }>
    assumptions: {
      demand_bias: number
      investment_bias: number
      adoption_bias: number
      exposure_bias: number
      staying_bias: number
    }
  }

Where `StateCheckpoint` means:
- `year`
- `state`
- `state_label`
- `role_integrity`
- `transformed_share`
- `demand_offset`
- `structural_support`
- `bottleneck_risk`
- `firm_incentive`
- `transition_pressure`

Where `StateTimelinePoint` means `StateCheckpoint`.

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
  // when source = default_profile, organizational_adoption_readiness is treated as
  // a conservative baseline runtime signal rather than an implicit midpoint answer

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
        trajectory_delta: {
          baseline_state: TrajectoryState | null
          current_state: TrajectoryState | null
          state_changed: boolean
          baseline_role_shape: string | null
          current_role_shape: string | null
          role_shape_changed: boolean
          baseline_role_restructuring_bucket: string | null
          current_role_restructuring_bucket: string | null
          role_restructuring_bucket_changed: boolean
          metric_deltas: {
            next_compression: number | null
            next_demand: number | null
            next_viability: number | null
            distant_viability: number | null
            structural_necessity: number | null
          }
          next_scenario_delta: {
            compression: number | null
            demand: number | null
            viability: number | null
          }
          structural_necessity_delta: number | null
          largest_shift: {
            metric_key: string
            metric_label: string
            direction: 'up' | 'down'
            delta: number
            current_value: number | null
            baseline_value: number | null
          } | null
          summary: string
        } | null
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
  timing_frontier: {
    capability_readiness: number
    supervision_readiness: number
    economic_pressure: number
    organizational_friction: number
    scenario_activation: {
      current: number
      next: number
      distant: number
      ceiling: number
    }
    triggers: {
      assist: TriggerFrontier
      delegate: TriggerFrontier
      compress: TriggerFrontier
      structural_break: TriggerFrontier
    }
    cluster_drivers: Array<{
      task_cluster_id: string
      label: string
      crossing_wave: 'current' | 'next' | 'distant'
      binding_constraint: 'capability_limited' | 'supervision_limited' | 'economics_limited' | 'organization_limited' | null
      binding_constraint_label: string | null
      current_margin: number | null
      next_margin: number | null
    }>
    primary_displacement_wave: 'current' | 'next' | 'distant'
    primary_wave_score: number
    primary_binding_constraint: 'capability_limited' | 'supervision_limited' | 'economics_limited' | 'organization_limited' | null
    primary_binding_constraint_label: string | null
  }

  top_exposed_work: {
    task_cluster_id: string
    task_cluster_label: string
    label: string
    public_summary: string | null
    share_of_role: number
    automation_difficulty: number
    wave_assignment: 'current' | 'next' | 'distant'
    exposure_level: 'low' | 'moderate' | 'high'
  } | null

  role_defining_work: {
    task_cluster_id: string
    task_cluster_label: string
    label: string
    public_summary: string | null
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
  task_accession_map: {
    accession_clusters: Array<{
      task_cluster_id: string
      task_cluster_label: string
      public_label: string
      public_summary: string | null
      accession_score: number
      accession_kind: 'review' | 'exception' | 'coordination' | 'relationship' | 'governance' | 'integration' | 'demand_expansion'
      accession_driver: string
      derived_from_exposed_clusters: string[]
      net_share_delta: number
      confidence_label: 'Strong evidence' | 'Mixed evidence' | 'Thin evidence'
      confidence_reason: string
      confidence: number
    }>
    shrinking_clusters: Array<{
      task_cluster_id: string
      task_cluster_label: string
      public_label: string
      public_summary: string | null
      shrink_score: number
      net_share_delta: number
      primary_pressure: 'direct' | 'spillover' | 'mixed'
      confidence_label: 'Strong evidence' | 'Mixed evidence' | 'Thin evidence'
      confidence_reason: string
      confidence: number
    }>
    net_role_rebundle_summary: string
    accession_confidence: number
  }
  transition_trigger_map: {
    summary: string
    bargaining_cliff_summary: string
    bargaining_cliff_stage: 'delegate' | 'compress'
    decisive_trigger_id: 'assist' | 'delegate' | 'compress' | 'structural_break' | null
    decisive_trigger_label: string | null
    primary_binding_constraint: 'capability_limited' | 'supervision_limited' | 'economics_limited' | 'organization_limited' | null
    primary_binding_constraint_label: string | null
    confidence: number
    confidence_label: 'Strong evidence' | 'Mixed evidence' | 'Thin evidence'
    confidence_reason: string
    timing_frontier: V2Result['timing_frontier']
    triggers: Array<{
      trigger_id: 'assist' | 'delegate' | 'compress' | 'structural_break'
      trigger_label: string
      readiness_score: number
      readiness_label: 'active now' | 'close if tooling improves' | 'not there yet'
      frontier_margin: number | null
      crossing_wave: 'current' | 'next' | 'distant' | null
      binding_constraint: 'capability_limited' | 'supervision_limited' | 'economics_limited' | 'organization_limited' | null
      binding_constraint_label: string | null
      confidence: number
      confidence_label: 'Strong evidence' | 'Mixed evidence' | 'Thin evidence'
      confidence_reason: string
      threshold_summary: string
      mechanism_summary: string
      consequence_summary: string
    }>
  }
  seat_change_map: {
    summary: string
    net_seat_effect_label: string
    shrinking_share_estimate: number
    retained_share_estimate: number
    growing_share_estimate: number
    shrinking_bundles: Array<{
      task_cluster_id: string
      task_cluster_label: string
      public_label: string
      public_summary: string | null
      shrink_score: number
      net_share_delta: number
      primary_pressure: 'direct' | 'spillover' | 'mixed'
    }>
    retained_bundles: Array<{
      task_cluster_id: string
      task_cluster_label: string
      public_label: string
      public_summary: string | null
      retained_share: number
      confidence_label: 'Strong evidence' | 'Mixed evidence' | 'Thin evidence'
      confidence_reason: string
      evidence_confidence: number
    }>
    growing_bundles: Array<{
      task_cluster_id: string
      task_cluster_label: string
      public_label: string
      public_summary: string | null
      accession_score: number
      accession_kind: 'review' | 'exception' | 'coordination' | 'relationship' | 'governance' | 'integration' | 'demand_expansion'
      accession_driver: string
      derived_from_exposed_clusters: string[]
      net_share_delta: number
      confidence_label: 'Strong evidence' | 'Mixed evidence' | 'Thin evidence'
      confidence_reason: string
      confidence: number
    }>
  }
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
    shrinking_clusters: Array<{
      task_cluster_id: string
      task_cluster_label: string
      public_label: string
      public_summary: string | null
      shrink_score: number
      net_share_delta: number
      primary_pressure: 'direct' | 'spillover' | 'mixed'
    }>
    accession_clusters: Array<{
      task_cluster_id: string
      task_cluster_label: string
      public_label: string
      public_summary: string | null
      accession_score: number
      accession_kind: string
      accession_driver: string
      derived_from_exposed_clusters: string[]
      net_share_delta: number
      confidence: number
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
    how_the_work_rebundles: string
    when_the_role_turns: string
    how_the_seat_rebalances: string
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
  public_task_cluster_label: string
  public_task_cluster_summary: string | null
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
  task_cluster_label: string
  label: string
  public_label: string
  public_summary: string | null
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
  frontier_capability_readiness: number
  frontier_supervision_readiness: number
  frontier_economic_pressure: number
  frontier_organizational_friction: number
  frontier_binding_constraint: 'capability_limited' | 'supervision_limited' | 'economics_limited' | 'organization_limited'
  frontier_binding_constraint_label: string
  frontier_crossing_wave: 'current' | 'next' | 'distant'
  frontier_scenario_activation: {
    current: number
    next: number
    distant: number
    ceiling: number
  }
  frontier_scenario_margins: {
    current: number
    next: number
    distant: number
  }
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
Every selected occupation now starts from more than one reviewed default function anchor even when the occupation does not expose explicit runtime role variants. That means the baseline composition is no longer a one-anchor placeholder plus custom edges; it is a reviewed multi-anchor graph by default, with sharper examples including `Financial and Investment Analysts`, `Software Developers`, `Graphic Designers`, `Paralegals and Legal Assistants`, `Compliance Officers`, `Training and Development Specialists`, `Mechanical Engineers`, `Computer Systems Analysts`, `Executive Secretaries and Executive Administrative Assistants`, `Human Resources Specialists`, `Customer Service Representatives`, `Statistical Assistants`, `Bookkeeping, Accounting, and Auditing Clerks`, `Office Clerks, General`, `Secretaries and Administrative Assistants, Except Legal, Medical, and Executive`, `Logisticians`, `Electronics Engineers, Except Computer`, `Writers and Authors`, and `Advertising Sales Agents`.
That same structural path now covers the entire promoted `next 30` cohort as well: all `30` promoted occupations now start from two reviewed default anchors in the composition baseline, and `17` of them also use occupation-specific primary-anchor overrides where the role-family default primary anchor was too coarse.

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
- in the reviewed baseline occupation library this is mainly a sparse-evidence backstop rather than a frequently active default-path clamp, but it remains important for weaker-support or more heavily edited compositions
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
- `present_day_anchor`
- `workflow_compression_context`
- `organizational_conversion_context`
- `next_scenario_lift`
- `distant_scenario_lift`
- `organizational_adoption_ceiling`
- `economic_pressure_context`
- `augmentation_fit`
- `substitution_risk_modifier`
- `timing_frontier`

Current live derivation notes:
- `retained_accountability_strength` now leans primarily on delegability guardrails, human authority, and judgment, with smaller trust and liability terms
- that same accountability layer is now a little less willing to over-credit reviewed service/clerical support anchors as durable sign-off ownership; some reviewed revenue-support, billing, lending-intake, and executive-support anchors now carry lighter authority/guardrail priors than earlier builds
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
- `primary_displacement_wave` is now the earliest scenario where the `compress` or `structural_break` timing frontier clears its hurdle; it is no longer a direct difficulty-band label plus a small promotion heuristic
- once the task-graph recomposition path is active, the live engine now lets the outer recomposition context pull materially harder than earlier builds did: the final task-graph-stage blend is `0.40 / 0.60` for workflow compression and `0.50 / 0.50` for organizational conversion
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
- in plain baseline runs, that questionnaire-side adoption term no longer defaults to a neutral midpoint; `default_profile` runs now use a lower conservative adoption-readiness baseline so occupations are not treated as implicitly medium-adoption before any user input exists
- that effective adoption pressure affects recomposition and outer role-fate pressure, but not task-level automability
- `occupation_individual_ai_usage_context.csv` is now promoted narrowly into the runtime trajectory layer as a soft present-day anchor where observed individual AI usage exists
- that promotion does not affect task evidence precedence, task-level direct pressure resolution, or the outer demand/adoption context; it only nudges the year-0 transformed-share floor for covered occupations

## Current Runtime Demand / Adoption Contract

The live browser scorer now has an explicit outer runtime context layer:

- `occupation_demand_adoption_context.csv`
  - derived from BLS labor context plus ACS x BTOS adoption context
  - used for demand expansion and adoption realization
  - not used for task-level automability
- `adoption_realization_context` now weights the occupation-level BTOS adoption signal more heavily than confidence-only terms, adds smaller BTOS current-use and workflow-change terms through covered-sector share, and only lets labor tightness materially raise realization when AI adoption is already meaningfully active

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
- `next_scenario_lift`
- `distant_scenario_lift`
- `organizational_adoption_ceiling`
- `economic_pressure_context`
- `retained_accountability_strength`
- `retained_bargaining_power`
- `role_fragmentation_risk`
- `role_compressibility`
- `delegation_likelihood`
- `headcount_displacement_risk`
- `role_transformation_type`
- `function_anchor_count`
- `function_exposure_spread`
- `function_retained_strength_spread`

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
  - `next_scenario_lift`
  - `distant_scenario_lift`
  - `organizational_adoption_ceiling`
  - `economic_pressure_context`
  - `recomposition_context_confidence`
- `diagnostics` now also exposes:
  - `workflow_compression_context`
  - `organizational_conversion_context`
  - `next_scenario_lift`
  - `distant_scenario_lift`
  - `organizational_adoption_ceiling`
  - `economic_pressure_context`
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
- `role_fate_*`
- older wave trajectory cards
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

1. the page leads with trajectory rather than with a dense diagnostic stack
2. timing is shown as range buckets only, never single dates
3. execution compression, demand response, and structural necessity are all visible concepts
4. scenario cards show `current`, `next`, and `distant` in one scan
5. the user can tell what the role becomes before opening the detailed task surfaces
6. older task/evidence/audit detail still exists behind disclosure

## Next Result-Surface Work

Recommended next changes:
- keep the new regression guardrail around the default occupation-map distribution current as the classifier evolves, and keep using the compact audit dump for default fate / trigger outputs
- keep tightening trigger-confidence reasons so the panel distinguishes genuinely tied thresholds from weak rebundle evidence and the remaining crowded-ordering edge cases
- return `role_fate_map` directly from the engine rather than rebuilding it in the client
- add source drill-down and task-level citations
- add weighted task-share controls so users can do more than tag a handful of tasks
- deepen the current composition-edit delta into a fuller task/source/function drill-down
- reduce or remove the legacy-answer compatibility fallback as external callers migrate
- keep expanding the public work-bundle layer so more of the result surface uses occupation-specific work bundles instead of internal abstractions
