# V2.0 Questionnaire Specification

## Scope

This is a supporting reference doc, not the main planning doc.

For current model status, roadmap, and next steps, read:
- `docs/README.md`
- `docs/role_transformation_overhaul_plan.md`

## Purpose

This document describes the current live intake contract for the `2.0` role-fate model.

The live intake is now a hybrid:
- occupation anchoring
- an editable role composition studio
- a questionnaire UI that renders as core questions plus optional deeper modules
- a native role-refinement profile authored from named refinement factors

## Current Intake Flow

The live page now collects inputs in this order:

1. occupation anchor through a combined searchable selector
   - when available, an optional inline reviewed role-variant dropdown appears under the occupation selection and auto-loads one reviewed baseline while still letting the user choose another reviewed version
2. hierarchy / seniority through the five-step ladder
3. analysis mode:
   - default analysis
   - adjust the role first
4. optional role refinement and role breakdown editing when the user chooses the adjustment path

Current selector coverage:
- the occupation selector now exposes `61` supported occupations from the live launch seed

## Current Role Composition Inputs

The live role-breakdown studio in `index.html` now exposes an occupation-scoped composition editor built from `engine.getRoleComposition(selectedOccupationId)`.

Current editable elements:

1. source-bucketed task rows:
   - baseline `O*NET` tasks
   - reviewed public-posting tasks
   - reviewed role-review tasks
2. reviewed function anchors for the selected occupation
3. for a small reviewed subset of occupations, a reviewed role-variant selector that now appears inline under occupation selection and changes the default baseline task/function bundle before the editor opens
4. custom task-to-task support links
5. custom task-to-function links
6. optional per-task share overrides in the graph editor

The live app now surfaces the reviewed-variant choice as an optional inline control under occupation selection when one exists. It starts from one auto-selected reviewed baseline variant when one exists, then lets the user add/remove tasks and functions, connect nodes, and optionally rebalance task shares before scoring.

Current reviewed-variant occupations:
- `Market Research Analysts and Marketing Specialists`
- `Accountants and Auditors`
- `Editors`
- `Technical Writers`
- `News Analysts, Reporters, and Journalists`
- `Management Analysts`
- `Office Clerks, General`

## Current Runtime Mapping

The client translates composition edits into this runtime contract:

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

The live model-page path no longer depends on five standalone task selectors.

The engine still accepts the older `dominantTaskIds` / `criticalTaskIds` / `aiSupportTaskIds` / `supportTaskIds` path for compatibility with external callers and tests, but that is no longer the main browser runtime path.

## Current Engine Effect Of Composition Inputs

The engine currently applies composition inputs in four places:

### 1. Active role bundle selection

For occupations with reviewed role variants, the engine can now first choose a reviewed baseline variant from the current questionnaire profile and current role mix when real questionnaire or composition-edit signal exists, unless the user explicitly overrides that choice in the inline occupation control or editor.

Selected task ids determine which inventory rows remain active in the run.

Selected function ids determine which occupation function anchors remain active in the run.

This changes:
- the task inventory passed into scoring
- the active function summary
- the default dependency graph
- the occupation-assignment summary shown in the UI
- the reviewed baseline variant summary shown in the role studio for supported occupations

### 2. Task-share reweighting

If the user changes task share weights in the graph editor, the engine applies `task_share_overrides`, then renormalizes the role mix before cluster aggregation and task-level scoring.

### 3. Dependency and function remapping

User-declared task-to-task support links are appended to the default occupation dependency graph through `DependencyEdits.added_edges`.

User-declared task-to-function links are applied before scoring and can raise a task's effective authority, bargaining-power, and judgment contribution inside the active function bundle.

### 4. Role-fate interpretation

These composition changes indirectly affect:
- `role_fate_state`
- `role_fate_label`
- `role_fate_confidence`
- `fate_drivers`
- `fate_counterweights`
- `occupation_assignment.selected_composition`
- `occupation_assignment.selected_variant`
- `questionnaire_effect`

## Current Questionnaire Layer

The visible UI now presents a role-refinement surface:
- a live role-refinement readout
- core questions
- optional deeper modules

The live UI now authors named refinement responses directly:
- `ai_observability_of_work`
- `evidence_trail_strength`
- `review_signoff_clarity`
- `digital_workflow_readiness`
- `workflow_decomposability`
- `process_standardization`
- `exception_and_context_load`
- `feedback_loop_speed`
- `tacit_knowledge_load`
- `human_signoff_requirement`
- `external_trust_requirement`
- `organizational_adoption_readiness`
- `delegation_pressure`
- `workflow_integration_readiness`

The engine still accepts legacy `Q*` answers as a compatibility fallback for external callers, but that is no longer the active runtime path used by the live app.

## Current Structured Questionnaire Profile

The live intake now maps named refinement responses into a structured role-refinement profile with fields including:
- `function_centrality`
- `human_signoff_requirement`
- `liability_and_regulatory_burden`
- `relationship_ownership`
- `exception_and_context_load`
- `workflow_decomposability`
- `organizational_adoption_readiness`
- `ai_observability_of_work`
- `dependency_bottleneck_strength`
- `handoff_and_coordination_complexity`
- `external_trust_requirement`
- `stakeholder_alignment_burden`
- `execution_vs_judgment_mix`
- `augmentation_fit`
- `substitution_risk_modifier`

## Current Composite Signals

The live engine then compresses that profile into these runtime composites:

```ts
functionRetention = avg(
  function_centrality,
  human_signoff_requirement,
  liability_and_regulatory_burden,
  relationship_ownership
)

capabilitySignal = avg(
  ai_observability_of_work,
  workflow_decomposability,
  substitution_risk_modifier
)

couplingProtection = avg(
  functionRetention,
  exception_and_context_load,
  dependency_bottleneck_strength,
  external_trust_requirement
)

adoptionPressure = organizational_adoption_readiness
```

It also derives bundle friction dimensions from the structured profile:
- `exception_burden`
- `accountability_load`
- `judgment_requirement`
- `document_intensity`
- `tacit_context_dependence`

All answers are first normalized to `[0, 1]`.

## Current Functional Interpretation By Section

### Role Anchoring

Current live fields:
- category
- occupation
- hierarchy

These drive:
- occupation resolution
- occupation candidate ranking
- seniority signal
- part of elevation and retained-role logic

### Task Composition

Current live fields:
- source-bucketed tasks
- function anchors
- custom support links
- custom task-to-function links
- optional task share overrides

These drive:
- active task selection
- active function selection
- task-share reweighting
- task-to-task spillover changes
- function-sensitive weighting
- visible current-role rows and assignment summaries

### Adaptation And Demand Context

Current live fields:
- hierarchy
- `organizational_adoption_readiness`
- `delegation_pressure`
- `workflow_integration_readiness`

These drive:
- `adoptionPressure`
- `effective_adoption_pressure` once questionnaire adoption readiness is blended with the occupation-level `adoption_realization_context`
- `demand_expansion_modifier` once labor-demand context and labor-tightness context are folded in
- the outer recomposition/timing layer once occupation-level recomposition context is folded in
- part of `role_fate_state`

Current runtime note:
- the questionnaire still supplies the user-specific adoption-readiness signal
- but the live engine no longer treats that answer as the whole adoption story
- it now blends the questionnaire-side `organizational_adoption_readiness` with an occupation-level runtime context row derived from:
  - BLS growth / openings / unemployment context
  - ACS occupation-to-sector mix
  - BTOS sector AI-adoption context
- the resulting runtime demand/adoption layer then feeds a second derived occupation-level recomposition/timing context used for:
  - workflow compression
  - organizational conversion
  - wave timing
- this outer-layer blend only affects demand expansion and organizational conversion
- it does not change task-level automability or the task evidence resolver

## Current UX Rules

The live UI now enforces these behaviors:
- the composition editor is occupation-specific
- the reviewed role-variant selector only appears for occupations that currently support more than one stable baseline role shape
- the default role bundle is loaded from `getRoleComposition(...)`
- when role variants exist, the default role bundle now comes from the reviewed default baseline unless the user supplies real questionnaire or composition-edit signal, in which case the runtime can switch to the recommended reviewed variant
- the current reviewed role-variant subset now includes `Accountants and Auditors`, so the selector can now appear for accounting users as well as the earlier heterogeneous reviewed occupations
- add/remove controls only show tasks and functions not currently active
- custom support links only connect currently selected tasks
- task-to-function links only persist when both the task and function stay selected
- if the user removes all active tasks or functions, the engine falls back to the occupation defaults rather than scoring an empty role
- hierarchy changes alone no longer silently switch the reviewed baseline variant while the selector is still on its default-held variant
- once the user has started editing the composition, the app preserves those edits instead of silently resetting the graph when the recommendation changes
- graph edits rerun scoring live on the same occupation
- the questionnaire is rendered from schema in the client rather than hardcoded page markup

## Current Gaps

Still missing from the intake relative to the broader redesign:
- simpler weighted task-share buckets layered on top of the current graph-level share overrides
- explicit `AI-danger task` or bargaining-break prompt separate from the current composition editor
- direct residual-role-distinctiveness question
- broader reviewed role-variant coverage for occupations with multiple distinct function paths

## Next Intake Work

Recommended next changes:

1. add lighter-weight task-share controls so users can mark work as major, medium, or minor without editing raw share values in the graph
2. add explicit `if AI got very good at this task, would bargaining power break?` prompts
3. add a direct residual-role-distinctiveness question for roles that still feel under-described by the occupation default
4. decide whether the legacy `Q*` fallback should remain for external compatibility or be removed entirely
