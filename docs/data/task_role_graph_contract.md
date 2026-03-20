# Task Role Graph Contract

## Purpose

This document is the first implementation step for the `Role Fate Map` redesign.

It defines:
- the current task-coverage problem
- the minimum new normalized fields needed for role-fate modeling
- the first CSV contracts to add to the data layer

## Current Snapshot

Current live task-graph coverage:
- `1905` task rows in `data/normalized/occupation_task_inventory.csv`
- `63` modeled occupations currently have task-inventory rows
- average `29.8` rows per covered occupation
- minimum `24`
- maximum `41`
- no selected occupation is currently missing task-inventory coverage

Thin-coverage occupations already visible:
- `Electronics Engineers, Except Computer` (`24`)
- `Industrial Engineers` (`24`)
- `Paralegals and Legal Assistants` (`24`)
- `Writers and Authors` (`24`)
- `Advertising Sales Agents` (`24`)
- `Customer Service Representatives` (`24`)
- `General and Operations Managers` (`25`)
- `Sales Managers` (`25`)
- `Computer and Information Systems Managers` (`25`)
- `Financial Managers` (`25`)

Current gap summary:
- all selected occupations are now buildable through the task-role graph layer
- dependency structure, role criticality, value centrality, and bargaining weights are all present in the normalized layer
- GPT task-label benchmark coverage now reaches `62` of the `63` selected occupations
- the reviewed function graph now carries `128` occupation-function rows across `63` occupations, and all `63` occupations now start from more than one reviewed default function anchor
- all `30` promoted next-phase occupations now start from two reviewed default anchors, and `17` of those occupations also override the role-family default primary anchor where the generic family primary was misleading
- the remaining gap is not "no graph" or "no anchor depth" for the promoted cohort; every selected occupation now has reviewed multi-anchor default coverage. The remaining debt is evidence density, second-anchor maturity, and the fact that `Business Operations Specialists, All Other` still has no direct GPT task-label coverage from that source

## Design Rule

The new normalized layer should model a role as a graph, not only a flat list.

The first pass should stay practical:
- do not attempt full enterprise workflow mining
- do add enough structure to model core vs supporting work and direct vs indirect pressure

## New Canonical Concepts

- `task_id`: stable internal task key
- `role_criticality`: `core`, `supporting`, `optional`
- `value_centrality`: how much the task explains why the role exists
- `bargaining_power_weight`: how much worker leverage depends on the task
- `dependency_type`: `supports`, `reviews`, `enables`, `feeds`, `follows_from`
- `dependency_strength`: normalized edge weight

## Proposed Normalized Files

### 1. `occupation_task_inventory.csv`

Use as the richer replacement / successor contract for the current flat task view.

Required columns:
- `occupation_id`
- `task_id`
- `onet_task_id`
- `task_statement`
- `task_family_id`
- `task_type`
- `time_share_prior`
- `value_centrality`
- `bargaining_power_weight`
- `role_criticality`
- `ai_support_observability`
- `source_mix`
- `source_confidence`
- `notes`

### 2. `task_dependency_edges.csv`

Use to encode how tasks support or depend on each other.

Required columns:
- `occupation_id`
- `from_task_id`
- `to_task_id`
- `dependency_type`
- `dependency_strength`
- `edge_source`
- `edge_confidence`
- `notes`

Interpretation:
- `from_task_id -> to_task_id` means the source task supports or enables the target task

### 3. `occupation_task_role_profiles.csv`

Use for occupation-level summary annotations derived from the richer graph.

Required columns:
- `occupation_id`
- `core_task_share`
- `support_task_share`
- `mean_value_centrality`
- `mean_bargaining_power_weight`
- `dependency_density`
- `coverage_gap_flag`
- `review_status`
- `notes`

## Mapping From Existing Files

Starting points already in repo:
- `occupation_tasks.csv` for baseline task statements
- `occupation_task_clusters.csv` for task-family grouping
- `task_exposure_evidence.csv` for direct AI evidence
- `task_augmentation_automation_priors.csv` for mode priors

What must be added by curation or new joins:
- `value_centrality`
- `bargaining_power_weight`
- `role_criticality`
- dependency edges

## First Curation Priority

Start with the thinner-covered occupations listed above.

Review order:
1. fill missing or obviously skeletal task inventories
2. mark core vs supporting tasks
3. add high-confidence dependency edges among the top value-defining tasks
4. derive occupation-level summary fields
5. increase the share of tasks with reliable direct evidence strong enough to influence live task pressure

## Implementation Notes

- `task_id` should be stable even when multiple public sources describe the same task differently
- internal curation is allowed when public sources are too generic
- low-confidence edges are acceptable if they are labeled explicitly and do not override stronger direct evidence
- the first pass only needs enough edges to support direct vs indirect pressure reasoning

## Current Seed Implementation

The first seeded build is generated by:
- `scripts/data/build_task_role_graph.ps1`

It currently produces:
- `1905` inventory rows
- `3538` dependency edges
- `63` occupation role profiles

Seeded-review outcome:
- `63` occupations now have task inventory coverage
- `63` occupations are buildable through the task-role graph layer
- targeted manual review expansions now cover all `63` occupations, so the remaining review queue is now about strengthening the thinnest reviewed roles rather than filling blank occupation slots
- the reviewed job-description layer now carries `536` rows: `4` occupations at `4` reviewed rows, `51` at `8`, `8` at `12`, and `1` at `16`
- the latest promoted-cohort density pass moved `Software Quality Assurance Analysts and Testers`, `Personal Financial Advisors`, `Securities, Commodities, and Financial Services Sales Agents`, `Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products`, `Property, Real Estate, and Community Association Managers`, and `Transportation, Storage, and Distribution Managers` from `4` reviewed posting rows to `8` each

Current live scoring status:
- task rows are now individually scored in the browser task graph
- a small reviewed subset of heterogeneous occupations can now start from more than one reviewed role-variant baseline before users edit the task graph
- `Market Research Analysts and Marketing Specialists` now uses a reviewed marketing-operations anchor, so its ops-heavy variant starts from a distinct function mix rather than only a task-only split
- `News Analysts, Reporters, and Journalists` now uses a reviewed broadcast-orchestration anchor, so its anchor/producer baseline no longer inherits the field-reporter source-development function mix
- `Technical Writers`, `Editors`, `Management Analysts`, and `Accountants and Auditors` still use explicit reviewed role variants with sharper task-to-function weighting inside those variant baselines
- `Financial and Investment Analysts` now uses a reviewed stakeholder-translation supplemental anchor in the default task-to-function graph
- `Operations Research Analysts` now uses a reviewed decision-translation supplemental anchor in the default task-to-function graph
- `Software Developers` now uses a reviewed system-reliability supplemental anchor in the default task-to-function graph
- `Computer Systems Analysts` now uses a reviewed requirements-translation supplemental anchor in the default task-to-function graph
- `Compliance Officers` now uses a reviewed control-enablement supplemental anchor in the default task-to-function graph
- `Human Resources Specialists` now uses a reviewed people-advisory supplemental anchor in the default task-to-function graph
- `Executive Secretaries and Executive Administrative Assistants` now also uses a reviewed executive-coordination supplemental anchor in the default task-to-function graph, so executive gatekeeping, board support, stakeholder routing, and decision-cadence tasks no longer inherit the same authority assumptions as lower-level workflow execution
- `Customer Service Representatives` now also uses a reviewed case-queue-execution supplemental anchor in the default task-to-function graph, so ticket routing, queue flow, case updates, and support-workflow follow-through no longer inherit the same bargaining or ownership assumptions as higher-value service-resolution work
- `Statistical Assistants` now also uses a reviewed data-preparation-execution supplemental anchor in the default task-to-function graph, so data entry, coding, packet preparation, and database-upkeep tasks no longer inherit the same bargaining assumptions as higher-value statistical support and analyst-facing interpretation work
- `Bookkeeping, Accounting, and Auditing Clerks` now also uses a reviewed transaction-processing supplemental anchor in the default task-to-function graph, so posting, document-fit, and routine account-processing work no longer inherits the same retained-authority assumptions as higher-value financial-integrity work
- `Office Clerks, General` now also uses a reviewed office-flow-coordination supplemental anchor in the default task-to-function graph, so request routing, paperwork follow-through, and shared-office flow no longer inherits the same retained-authority assumptions as one flat workflow-execution baseline
- `Secretaries and Administrative Assistants, Except Legal, Medical, and Executive` now also uses a reviewed admin-coordination supplemental anchor in the default task-to-function graph, so scheduling, stakeholder follow-up, and information-routing work no longer inherits the same authority assumptions as lower-level clerical execution
- `Logisticians` now also uses a reviewed logistics-flow-coordination supplemental anchor in the default task-to-function graph, so supplier alignment, shipment exceptions, and deployment coordination no longer flatten into one generic reliable-execution purpose layer
- `Electronics Engineers, Except Computer` now also uses a reviewed electronics-validation-integration supplemental anchor in the default task-to-function graph, so verification, production feedback, and system-integration work no longer inherits the same purpose layer as core design alone
- `Writers and Authors` now also uses a reviewed content-system-stewardship supplemental anchor in the default task-to-function graph, so review cycles, style systems, and publishing coherence no longer flatten into one draft-only creative-production anchor
- `Advertising Sales Agents` now also uses a reviewed campaign-account-stewardship supplemental anchor in the default task-to-function graph, so approvals, proof flow, proposal follow-through, and account continuity no longer inherit the same structure as first-pitch revenue creation
- `Sales Representatives of Services` now also uses a reviewed deal-orchestration supplemental anchor in the default task-to-function graph, so account plans, proposal flow, internal partner coordination, customer-record upkeep, and deal-handoff tasks no longer inherit the same sign-off assumptions as higher-value commercial judgment and account ownership
- `Secretaries and Administrative Assistants` now also uses a reviewed admin-coordination supplemental anchor in the default task-to-function graph, so scheduling, meeting flow, information routing, and follow-up tasks no longer inherit the same authority assumptions as lower-authority clerical execution and records upkeep
- the promoted `next 30` occupations are no longer single-anchor placeholders: every promoted occupation now starts from two reviewed default anchors, and representative promoted-cohort splits now include `Financial Managers` separating operating-finance ownership from resource-allocation leadership, `Computer User Support Specialists` separating frontline support enablement from workflow-adoption work, `Personal Financial Advisors` separating financial advice from relationship-book stewardship, and `Court, Municipal, and License Clerks` separating public-record administration from case-window coordination
- `17` promoted occupations also now use occupation-specific primary-anchor overrides, so roles like `Computer and Information Systems Managers`, `Information Security Analysts`, `Architectural and Engineering Managers`, and `First-Line Supervisors of Office and Administrative Support Workers` no longer inherit a misleading role-family default primary function
- task difficulty now starts from a hybrid baseline stack: cluster priors still seed the fallback baseline, clusters with strong enough resolved task-evidence coverage can shift toward a task-first cluster evidence estimate, and high-reliability task rows can promote into a task-first task baseline before residual task-evidence blending
- `task_source_evidence.csv` now resolves task rows through explicit source precedence before scoring
- reliable resolved task evidence can now blend into both task-level `automation_difficulty` and task-level `direct_exposure_pressure`
- for very routine, low-people, lower-knowledge office/admin occupations, the live scorer now gives workflow-admin, documentation, and some execution-routine tasks an extra structural pressure lift before residual direct-evidence blending
- the live scorer now also derives a narrower clerical-execution context from the active role mix itself: occupations with heavy workflow-admin/documentation/execution-routine share plus low-authority function baselines get an additional pressure lift and evidence damp on those clerical task families before the final task graph is aggregated
- indirect spillover still propagates through explicit dependency edges
- the public cluster layer is now aggregated back up from scored task rows for exposed/retained/elevated cluster summaries
- the public wave engine is now recomputed from those task-derived cluster summaries
- the live rebundle panel now also reuses those same scored task rows plus task-to-function links to synthesize first-pass public work-bundle labels, so shrinking and growing bundles are shown as occupation-specific work slices rather than raw cluster ids
- the live transition-trigger panel now also reuses those same scored task rows, function metrics, and wave outputs to estimate when the role crosses from assistive use into delegation, compression, or a structural seat break
- that trigger layer now also exposes a compact confidence label and reason derived from task coverage, accession confidence, outer context confidence, and score separation, so the runtime can admit when adjacent trigger stages are hard to distinguish
- the live seat map now also reuses those same shrinking, retained, and accession bundles to show what leaves the seat, what stays human-owned, and what expands inside the retained role
- those same bundle surfaces now also expose first-pass qualitative confidence labels derived from the underlying cluster evidence and task-coverage mix
- task rows in the live result now also expose `task_source_bucket` and `task_source_label`, so downstream explanation surfaces can show whether a selected row came from baseline O*NET, reviewed public-posting expansion, or reviewed role-graph expansion
- task rows also now carry enough source and baseline metadata for per-task causal text in the live UI, including whether the row still follows the cluster fallback path or has promoted/blended task evidence in the current run
