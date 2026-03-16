# How We Built The Model

## Purpose

This document is a mechanical reconstruction of how the current role model was built and why each iteration happened.

It is not the canonical product spec.

Use these files for current authoritative behavior:
- `docs/README.md`
- `v2_engine.js`
- `docs/role_transformation_overhaul_plan.md`
- `docs/v2_0_results_spec.md`
- `docs/data/role_transformation_contract.md`

Use this file for:
- future blog-post drafting
- engineering handoff context
- explaining why the model evolved the way it did

Maintenance rule:
- update this file after major architecture changes, not after every minor tuning pass

## The Starting Problem

The original problem was not simply:

"Which occupations are exposed to AI?"

It was:

"If AI gets better at parts of a role, what happens to the role as an organizational unit?"

That is a different question.

A pure exposure score is too coarse because it collapses several distinct outcomes:
- a role can become more productive without shrinking
- a role can lose routine work but retain a judgment-heavy core
- a role can split into a cheaper execution tier and a smaller oversight tier
- a role can actually collapse as a distinct seat

The model exists because "AI can do some tasks in this occupation" is not the same as "this job disappears."

## First Naive Approach

The natural first model is an occupation-level exposure model:
- map the user to an occupation
- assign an exposure score
- maybe add some benchmark context

This is useful for ranking occupations, but weak for explanation.

Why it fails:
- it does not show which work is under pressure
- it cannot distinguish core work from support work
- it cannot model spillover
- it cannot explain why two people in the same occupation may face different outcomes
- it cannot separate role compression from role collapse

This is why the model could not stay occupation-level.

## Second Approach: Cluster-Level Priors

The next improvement was to move from whole occupations to reduced task families or clusters.

That produced a better structure:
- each occupation became a weighted bundle of task clusters
- each cluster could carry an automation-difficulty estimate
- clusters could be placed into rough wave buckets like `current`, `next`, and `distant`

This was a pragmatic step because cluster priors are:
- easier to review than fully task-level scores
- more stable than sparse task-level evidence
- good enough to seed a first working model

This solved some problems:
- pressure could start in different parts of a role
- wave timing became interpretable
- the model became more decomposable

But it still had major weaknesses:
- clusters were still averages
- tasks inside a cluster could differ materially
- the public output was still too detached from the actual task rows

So cluster priors were a workable scaffold, not an end state.

## Third Approach: Richer Task Inventory

The next bottleneck was that the model needed a better representation of the role itself.

O*NET alone was not enough for many occupations.

So the model expanded the task layer with:
- richer task inventories
- reviewed job-description task additions
- stable internal `task_id`s
- task attributes like:
  - `value_centrality`
  - `bargaining_power_weight`
  - `role_criticality`
  - `ai_support_observability`

This mattered because once tasks became first-class objects, the model could stop asking only:

"How exposed is this occupation?"

and start asking:

"Which specific tasks explain why this role exists, and which of those tasks are reachable by AI?"

That moved the model closer to role structure instead of simple exposure ranking.

## Fourth Approach: Dependency Graph

Once tasks existed as nodes, the next missing piece was edges.

That led to the task dependency graph:
- some tasks enable other tasks
- some tasks review other tasks
- some tasks exist mainly because upstream work exists

This added the concept of indirect spillover.

That mattered because many support tasks are not easy to automate directly, but they still lose value when upstream work is compressed or automated.

This was one of the major conceptual upgrades in the model:
- direct pressure = AI can do the task itself
- indirect pressure = the task becomes less necessary because adjacent work changes

Without the graph, the model would systematically understate the risk to support work and overstate the autonomy of each task.

## Fifth Approach: Function / Accountability Layer

Even a task graph is still not enough.

Why:
- roles are not just bundles of tasks
- roles exist to own functions
- some functions retain human value even when many underlying tasks become cheaper

So the model added a function layer:
- role functions
- occupation-to-function maps
- task-to-function edges
- accountability and guardrail profiles

This layer exists to answer a different question:

"If exposed tasks get cheaper, does a coherent human-owned function still remain?"

That is how the model tries to distinguish:
- augmented roles
- narrowed but still valuable roles
- polarized roles
- compressed roles
- collapsed roles

This was the step that turned the system from an exposure model into a role-transformation model.

## Sixth Approach: Editable Role Composition

At this point the model still assumed the user matched a generic occupation bundle.

That was not good enough because real users often do:
- more of one task than the default occupation mix
- less of another
- extra coordination work
- extra oversight work
- custom support dependencies

So the model added an editable composition layer:
- source-bucketed tasks
- removable and addable tasks
- task-share overrides
- editable function anchors
- optional user-declared dependency edges
- optional task-to-function link overrides

This moved personalization from "answer a few questions" to "edit the role structure itself."

That was a large design improvement because it let the user change the actual graph being scored rather than merely perturbing top-level coefficients.

## Seventh Approach: Task-Level Scoring

Even after the graph and function layers existed, the public scoring path still leaned too hard on cluster outputs.

So the next step was to score tasks directly:
- compute task share
- compute task direct pressure
- propagate dependency spillover
- compute retained leverage per task

This was the point where the explanation got much better because the visible output started to reflect actual task rows rather than abstract cluster labels.

But the first version was still hybrid:
- cluster priors produced the baseline difficulty
- that baseline was projected onto tasks
- tasks were scored on top of that inherited baseline

So task rows existed, but they were not yet driving enough of the model.

## Eighth Approach: Direct Task-Evidence Blend

The next mismatch was between the methodology we wanted and the runtime we actually had.

The intended direction was:
- use task evidence first when it is good
- use cluster priors only when task evidence is weak

The shipped runtime was not there yet.

So the first practical step was smaller:
- keep cluster priors as the baseline
- let reliable task evidence blend into task-level direct pressure

This was phase 1 of the recent work.

Why this step came first:
- it improved sensitivity without destabilizing thin-coverage occupations
- it let the model react to task-specific evidence
- it preserved the stability of the cluster-based baseline

This was not yet the ideal model, but it was a controlled improvement.

## Ninth Approach: Task-Derived Cluster Summaries

After task rows were being scored, the public cluster surfaces were still partly reading from older cluster bundles.

That created a mismatch:
- the task layer said one thing
- the visible cluster layer still partly reflected pre-task assumptions

So the model next aggregated scored task rows back into cluster summaries and used those for:
- `top_exposed_work`
- `transformation_map.current_bundle`
- `transformation_map.exposed_clusters`
- `transformation_map.retained_clusters`
- `transformation_map.elevated_clusters`

This was phase 2 of the recent work.

Conceptually, this mattered because it reversed the direction of explanation:
- before: cluster priors imposed a view on tasks
- after: tasks started producing the public cluster view

That made the visible cluster layer more faithful to the actual task graph.

## Tenth Approach: Task-Derived Wave Engine

Even after task-derived cluster summaries existed, the wave engine was still partly inherited from the older pre-task cluster path.

So the next change was to recompute:
- cluster absorption
- wave assignment
- wave trajectory
- primary displacement wave

from the task-derived cluster bundle itself.

This was phase 3 of the recent work.

At that point, the public outputs became much more internally coherent:
- tasks drive cluster summaries
- cluster summaries drive wave timing
- wave timing drives role-fate interpretation

That is a cleaner upward aggregation path than preserving multiple parallel scoring stacks.

## Eleventh Approach: Task-Source Evidence Resolver

The next weakness was the runtime evidence path.

The engine was still mostly behaving like:
- Anthropic task evidence if available
- otherwise cluster fallback

But the repo already had a richer source-comparison layer in `task_source_evidence.csv`.

So the next step was to promote that comparison layer into the live runtime.

The current task resolver now works like this:
- `live_task_evidence`
- `reviewed_task_estimate`
- `benchmark_task_label`
- `cluster_prior_proxy`
- `fallback_task_proxy`

And the promoted task-level tiers can now affect live task scoring.

This was the most recent step.

Why it mattered:
- reviewed task estimates stopped being comparison-only
- benchmark task labels stopped being comparison-only
- proxy fallback stopped blocking better task-level evidence from affecting the score

This moved the model from a narrow evidence path to a real task-source resolver.

## Data Sources Along The Way

The model did not come from one dataset.

It was built by layering different kinds of sources for different jobs:
- structural sources to describe what the work is
- task-evidence sources to estimate what AI is already touching
- labor-market sources to add context
- benchmark sources to compare against existing literature
- reviewed internal layers to close gaps that public datasets did not cover cleanly
- calibration-only sources to pressure-test the model without turning every external dataset into a runtime score input

The cleanest way to understand the stack is by role, not by chronology.

### 1. Structural Backbone Sources

These sources define what the occupation and task graph actually are.

- `O*NET Database`:
  chosen because it is the strongest standard U.S. occupation-and-task backbone available for public work modeling.
  It provided the starting occupation taxonomy, task lists, work context, and the base structure for the role graph.
  It was necessary, but not sufficient, because many modern role shapes were too thin or too generic when taken from O*NET alone.

- `Manual job description review seed`:
  chosen because O*NET underdescribed some launch occupations and often missed workflow-specific modern tasks.
  This layer filled task gaps from reviewed job-description evidence so the model could represent what people in those roles are actually doing now.

- `Manual task-cluster review overrides`:
  chosen because purely heuristic task-to-cluster inference was too coarse in disagreement-heavy occupations.
  This layer let the repo correct cluster assignments where keyword-based inference was producing weak bundles.

- `V2 task role-graph seed`:
  chosen because once the model moved below occupation scores, it needed a first-pass task graph with bargaining-power and dependency assumptions.
  This was a derived internal layer that converted the structural sources into a usable role-graph seed for the redesign.

- `Manual role-graph review expansions`:
  chosen because the seed graph was still too thin or too brittle in some occupations.
  This layer added reviewed tasks and dependency edges where the generated graph was clearly missing real support structure.

### 2. Runtime Task-Evidence Sources

These sources feed the live evidence path that estimates how reachable individual tasks are.

- `Anthropic Economic Index 2026-01-15`:
  chosen because it is the strongest live task-level empirical source in the repo.
  It provided real task-usage evidence from Claude.ai and first-party API activity, which made the model much less dependent on abstract occupation priors.

- `Anthropic Economic Index 2025-03-27 legacy extract`:
  retained because coverage in the newer path is not perfect.
  This older release remains as fallback support for rows that are not yet cleanly resolved by the January 2026 pipeline.

- `V2 cluster prior proxy`:
  chosen because task evidence is still sparse or uneven in parts of the launch set.
  This is not direct empirical evidence; it is a fallback proxy that attaches cluster-level priors to task rows when better task evidence is missing.

- `task_source_evidence.csv` resolver contract:
  this is not an external raw source by itself, but it is an important part of how the source stack works.
  It was introduced so the runtime could prefer live task evidence, then reviewed estimates, then benchmark task labels, before falling back to proxy logic.

### 3. Role-Transformation Structure Sources

These sources were added because exposure alone could not explain what happens to the role as an organizational unit.

- `Role function seed layer`:
  chosen because the model needed explicit function anchors and accountability surfaces, not just exposed tasks.
  This was the first layer that let the model ask whether a coherent human-owned function remains after exposed work gets cheaper.

- `Role function expansion layer`:
  chosen because some occupations were clearly too heterogeneous for a single function anchor.
  This reviewed layer added secondary anchors for occupations where one “main function” was too reductive.

- `occupation_role_variants.csv` reviewed role variants:
  chosen because some occupations were structurally split enough that one default baseline role shape was misleading.
  This live layer now gives the browser a small set of reviewed baseline variants for the strongest heterogeneous occupations.

### 4. Labor-Market Context Sources

These sources add outer context. They are important, but they are not the same thing as task automability.

- `BLS Occupational Projections 2024-2034`:
  chosen to give the model a simple forward demand context.
  This is where the demand modifier comes from. It lightly informs the fate-classification layer, not the core task evidence layer.

- `BLS Occupational Employment and Wage Statistics (OEWS)`:
  chosen to provide employment and wage context for occupation selection and broader labor-market framing.
  It helps situate occupations in the economy, but it is not a direct task-exposure source.

- `BLS CPS unemployment by occupation group`:
  chosen to provide the current labor-market chart on the product side.
  It is context only. It is not used to infer that AI is already causing job loss in any direct way.

- `V2 launch aggregate prior`:
  chosen as an internal derived occupation prior for launch stability.
  It combines structure, task evidence, and labor-market context into a launch-ready occupation-level prior, but the model has been moving away from relying on this as the main story.

### 5. Benchmark And Comparison Sources

These sources were chosen so the model could be compared against existing AI-exposure literature without letting those benchmarks directly dictate the public result.

- `AI Occupational Exposure (AIOE)`:
  chosen as an occupation-level benchmark comparison.
  Useful for checking whether the live model’s directional rankings are broadly plausible.

- `Webb AI exposure paper`:
  chosen because it is one of the best-known earlier occupation-level AI exposure references.
  Useful as a historical comparison layer, not as a live runtime driver.

- `Suitability for Machine Learning (Brynjolfsson, Mitchell, Rock)`:
  chosen because it captures a different but related benchmark view of machine-learnability at the occupation level.
  Useful for triangulation, not direct scoring.

- `GPTs are GPTs`:
  chosen because it includes task and occupation benchmark material close to the current problem space.
  Useful for benchmark comparison and task-label inspection, not for live runtime scoring.

- `Benchmark bundle aggregate`:
  chosen as a convenience layer so those benchmark signals could be compared together inside the repo.
  It exists for audit and comparison, not for headline outputs.

### 6. Calibration-Only External Sources

These sources were chosen because they are excellent for checking the model’s structural assumptions, but weaker as direct runtime inputs.

- `BLS Occupational Requirements Survey (ORS), 2025 preliminary plus 2023 backstop`:
  chosen because it gives the strongest official structural read on autonomy, supervision, pace control, and related work requirements.
  It is now the main external calibration source for the human-retention and accountability side of the model.

- `Census ACS 2024 1-year PUMS API`:
  chosen because it gives an observable external read on within-occupation heterogeneity.
  It is used to derive wage dispersion, education dispersion, industry dispersion, worker-mix spread, and occupation-by-industry mix, which helps test whether some occupations are too heterogeneous for a single baseline role shape.

- `Census BTOS AI supplement`:
  chosen because it gives an official external read on sector-level AI use and workflow change.
  It is used only as an adoption-context calibration layer, joined back to occupations through ACS-based sector mix, so the model can pressure-test organizational conversion assumptions without confusing business AI use with task automability.

### 7. Historical, Conceptual, And Not-Yet-Live Sources

These sources still matter in the repo, but they should not be described as active live model inputs.

- `Manning and Aguirre adaptive capacity paper`:
  historically relevant because the project explored adaptive-capacity-style occupation priors early on.
  It is now archived and not used in the active runtime.

- `OECD Job Quality Framework`:
  chosen as a conceptual frame for quality and work-structure thinking.
  It influenced how some quality-style indicators were thought about, but it is not a direct runtime dataset.

- `OECD PIAAC public use files`:
  kept as a planned optional future empirical layer for broader quality-style calibration.
  Not active in the current live model.

- `ILO refined global GenAI exposure index`:
  mirrored because it is relevant benchmark material.
  Not yet mapped cleanly enough into the repo’s U.S.-first O*NET path to be treated as an active model source.

- `Acemoglu online vacancies paper materials`:
  mirrored for completeness and future review.
  Not yet normalized into an active model dataset.

- `Internal v2 stub generator`:
  chosen as temporary scaffolding so the product could continue moving while raw-source normalization was incomplete.
  This is development scaffolding, not a source anyone should cite as the basis of the model itself.

### 8. The Practical Source Hierarchy

If someone asks what the current model is really built on, the short answer is:

- structure comes mainly from O*NET plus reviewed task/graph expansions
- live task evidence comes mainly from the Anthropic Economic Index stack plus explicit fallback proxies
- role-transformation logic comes from the reviewed function and accountability layers
- labor-market context comes mainly from BLS projections, OEWS, and CPS context tables
- benchmark comparison comes from AIOE, Webb, SML, and GPTs-are-GPTs
- structural calibration comes mainly from BLS ORS, Census ACS PUMS, and Census BTOS

That is the mechanically honest summary.

## Where The Model Stands Now

The model is now a hybrid upward-aggregating system:

1. map the user to an occupation
2. build an editable task and function graph
3. compute baseline cluster difficulty from priors
4. project that baseline onto tasks
5. resolve task-level evidence from the task-source stack
6. let reliable resolved task evidence alter task difficulty and direct pressure
7. propagate dependency spillover
8. compute retained leverage per task
9. aggregate tasks back into cluster summaries
10. recompute wave timing from the task-derived cluster bundle
11. classify role fate using task, cluster, function, and wave signals

This is much better than the early occupation-level model because it can now represent:
- where pressure starts
- how pressure spreads
- what work still holds bargaining power
- whether the human-owned role remains coherent

## The Main Remaining Gap

The major remaining limitation is no longer basic architecture.

It is a mix of:
- evidence coverage
- outer-layer adoption realism
- explanation depth
- a few remaining structurally coarse occupations

The logic is now:
- cluster baseline first for thin or weakly evidenced tasks
- cluster baseline can shift toward task evidence when cluster coverage is strong
- high-reliability task rows can promote into a task-first baseline

So the model is no longer purely cluster-seeded.

But it is also not yet fully task-first everywhere.

The remaining gap is:
- expand the task-first path to more occupations without trusting weak evidence too aggressively
- keep explicit fallback tiers so sparse occupations do not become noisy

That is why the next major step is broader, better-calibrated per-task prior coverage rather than another abstract layer of model complexity.

In practical terms, that would mean:
- if a task has strong task-level evidence, start from that task's own evidence
- only use cluster priors when the task lacks good evidence
- only use occupation priors when cluster evidence is also weak

That would make the model more granular and more faithful to task-specific evidence.

But it also introduces risk:
- thin-coverage occupations can get noisy
- the system can become less stable if weak task evidence is trusted too aggressively

So this is not just "more detail is better."

It requires:
- confidence-aware routing
- explicit fallback tiers
- careful calibration on sparse occupations

## Current Holistic Read

By `2026-03-15`, the model had crossed an important line:

It was no longer mainly missing whole conceptual layers.

Instead, the remaining work was mostly about making the existing layers more empirically grounded, less flattened, and easier to audit.

What now looks strong:
- the runtime is task-scored rather than occupation-only
- public cluster and wave outputs are task-derived rather than inherited from a separate pre-task bundle
- the task-source resolver is live and can promote reviewed and benchmark task evidence
- the function layer is now rich enough to express both explicit runtime variants and a middle state of supplemental anchors without forcing every occupation into variants
- the calibration layer is now good enough to separate stronger structural misses from weaker proxy disagreements

What still looks unfinished:
- the task-first path is still incomplete for thin-coverage tasks
- adoption realization is still audited more confidently than it is modeled
- bargaining-power calibration is directionally useful but still tied to weak external proxies
- the explanation surface is now materially better than it was, with a baseline edit delta, task/source/function audit trace, direct-evidence citations, and short per-task causal notes, but it still is not a full provenance browser for every intermediate score
- the explanation surface now also includes a live `34`-occupation default-settings comparison chart on the guide page, which is useful because it stays tied to the shipped engine instead of becoming a static illustration, but it is still explanatory rather than a full reviewer workbench
- most occupations still use one default reviewed baseline even when their function layer is now richer than their visible explanation suggests

The practical consequence is that the next best work is no longer “invent another abstraction.”

It is:
- strengthen evidence coverage where the task-first path is still fallback-heavy
- keep adding supplemental anchors only where calibration says one function layer is still too flat
- improve the audit and explanation surface so the model is easier to defend
- treat BTOS and similar outer layers as calibration tools until they are strong enough to promote safely
- run a controlled `O*NET 30.2` refresh only after the current stack has stabilized

## Why The Model Evolved This Way

The sequence was not arbitrary.

Each iteration solved a concrete failure mode in the prior version:

1. Occupation scores were too coarse.
2. Cluster priors improved decomposition but were still too averaged.
3. Richer task inventories made the role structurally legible.
4. Dependency edges made spillover legible.
5. Function anchors made retained human value legible.
6. Editable composition made the model user-specific instead of occupation-generic.
7. Task-level scoring made the explanation concrete.
8. Task-evidence blending made the task layer responsive to empirical evidence.
9. Task-derived cluster summaries removed a public/runtime mismatch.
10. Task-derived wave timing removed another public/runtime mismatch.
11. The task-source resolver made the evidence path less brittle and less proxy-dependent.
12. The structural calibration scaffold kept external checks outside runtime instead of turning every new dataset into a score input.
13. The calibration scaffold was then made actionable by routing each mismatch toward a likely tuning layer instead of just printing gap tables.
14. The first repeated calibration finding then fed back into runtime scoring by reducing overstatement in retained bargaining power for routine and support-heavy roles.
15. The calibration queue was then made strength-aware so weak contextual proxies would not dominate tuning decisions over medium-strength structural checks.
16. That strength-aware queue then surfaced a stronger structural miss in routine/admin-heavy occupations, which led to a routine-context lift for workflow compression and routine task pressure.
17. The first official external structural source, BLS ORS, was then integrated into the calibration layer so the human-guardrail check relied mainly on observed autonomy, supervisory responsibility, and pace-control structure instead of lighter quality proxies.
18. The next official external structural source, ACS PUMS, was then integrated into the calibration layer so the repo could compare model fragmentation risk to observed within-occupation heterogeneity rather than only discussing role variety abstractly.
19. BTOS was then integrated as a calibration-only adoption-context layer so the repo could compare organizational conversion assumptions to observed sector AI uptake without pretending that business AI use is the same thing as task automability.
20. The heterogeneity review was then formalized into a generated role-shape candidate report so future multi-variant modeling decisions would come from a stable repo artifact instead of a one-off conversation.
21. The strongest reviewed heterogeneous occupations were then promoted into explicit runtime role variants so the browser could stop pretending that those occupations only had one stable baseline role shape.
22. The result surface then gained a first composition-edit delta so the browser could compare the current edited run to the unedited baseline for the same occupation and reviewed variant instead of only describing the current run in isolation.
23. That edit-delta was then widened into a more useful audit layer by exposing which tasks changed, which functions changed, and how the evidence mix changed, so the browser could start showing not just that an edit mattered, but what structurally moved.
24. The audit layer then expanded again into a real audit trace with top pressure tasks, spillover tasks, retained tasks, exposed and retained functions, direct-evidence citations, a copyable export summary, and short per-task causal notes about whether each row still follows the fallback model or is being pulled by task-level evidence.

So the model has evolved by repeatedly doing the same thing:
- identify where the current abstraction is too coarse
- move one layer lower
- keep explicit fallback behavior
- aggregate upward only after lower-level scoring is coherent

That is the central design pattern in the whole system.

## Why Calibration Stayed Outside Runtime

Once the model became task-first enough to produce meaningful disagreements, the next obvious question was:

"Why not just pour more outside data directly into the live score?"

The answer is that some data is better for calibration than for runtime.

That is why the repo now has a structural calibration scaffold outside the live browser score.

The intended separation is:
- runtime scoring uses task, function, and evidence layers directly tied to the role model
- calibration uses external or non-runtime context to pressure-test those layers

That keeps the score more interpretable and avoids blurring:
- task automability
- organizational adoption
- labor-market demand
- broad occupational quality context

In other words, calibration exists to tune the model without contaminating the core runtime stack with noisy downstream indicators.

That separation still allows calibration to change the runtime indirectly.

The first concrete example in this repo was the bargaining-power layer:
- the calibration queue kept flagging routine and support-heavy roles as having implausibly high retained bargaining power
- instead of piping wage context directly into runtime scoring, the model was adjusted by changing the bargaining-power formula itself
- the live scorer now leans more on pressure-adjusted retained leverage and less on static bargaining-weight averages

The next concrete example was a second bargaining-power refinement:
- after the accountability queue narrowed, the remaining bargaining mismatches split in two directions rather than one
- support-heavy roles like customer service were still too high, while high-knowledge technical roles like data scientists and software developers were too low
- the fix was not another occupation-by-occupation override; it was adding a centered specialization lift from adaptation-layer knowledge share, learning intensity, and adaptive capacity
- that let the live scorer represent a role's retained scarcity and technical leverage more directly instead of pretending all bargaining power should flow through the same support-vs-pressure logic

The next concrete example was the routine-pressure layer:
- once the queue became strength-aware, admin-heavy occupations like office clerks and secretaries moved to the top of the structural review list
- the model was not changed by feeding the calibration target directly into scoring
- instead, the live scorer was updated to read existing adaptation-layer routine context more directly when estimating routine reachability and workflow compression

The next concrete example was a narrower routine-admin correction:
- even after the earlier routine-context lift, the admin-heavy queue still showed that secretaries, office clerks, and bookkeeping clerks were too low on modeled routine pressure
- the underlying issue was not missing routine context; it was that direct task evidence could still pull core workflow-admin and documentation tasks down too far after the structural routine baseline was set
- the next fix was narrower: the model added an office-admin routine context built from high routine share, low people share, and lower knowledge share
- that office-admin context now gives workflow-admin, documentation, and some execution-routine tasks a stronger baseline pressure lift and a stronger evidence damp only in those office-admin-style occupations
- that was still a task-level change, not a return to occupation-only scoring, because it only affected task bundles that were already structurally routine-like

The next correction returned to the function layer:
- even after the narrower office-admin pressure fix, the weaker bargaining queue still showed that some support roles were too flattened
- the important distinction was not just "lower the score"; it was "separate low-scarcity execution from the part of the role that still handles exceptions, resolution, or reconciliation"
- bookkeeping therefore picked up a reviewed `transaction_processing` anchor, while customer support picked up a lighter reviewed `case_queue_execution` anchor
- the first customer-support version was too strong and dragged the human-guardrail ordering down too much, so the repo kept the bookkeeping split and softened the customer-support split
- that left the runtime in a better state: support roles now have a cleaner structural story for why their bargaining power is lower, without flattening the whole occupation into one low-authority execution bucket
- the next nearby case was `Statistical Assistants`, which still looked too flattened even after that pass; it therefore picked up a reviewed `data_preparation_execution` anchor so lower-scarcity data entry, coding, and reporting-packet work no longer had to sit inside one flat statistical-support purpose layer

The next correction returned to the task-pressure layer again:
- `Office Clerks, General` was still surfacing as a routine-pressure miss even after the broader office-admin context and the new support-role splits
- the problem was that the broader adaptation prior still did not fully recognize a role that was clerical because of its active task mix and low-authority function baseline, not just because of occupation-wide routine-share notes
- the live scorer therefore added a narrower `clericalExecutionContext` derived from the active role mix itself: high workflow-admin/documentation/execution-routine share plus lower authority, lower guardrails, and lower bargaining retention
- that extra context now adds a little more direct-pressure lift and evidence damp only on those clerical task families
- this was useful because it moved office-clerk-like roles closer to the empirical routine-pressure target without flattening higher-context admin roles the same way

The next correction returned to the structural accountability queue:
- `Sales Representatives of Services` still looked too flattened even after the earlier customer and support-role changes
- the problem was not that the whole role had low accountability; it was that pipeline upkeep, internal partner coordination, proposal flow, and deal-handoff work were still inheriting the same sign-off assumptions as actual commercial judgment and relationship ownership
- the repo therefore added a reviewed `deal_orchestration` anchor alongside `revenue_creation` and `account_stewardship`
- that lowered retained accountability to a more believable level without collapsing bargaining power, because the role still keeps real customer/revenue ownership while no longer treating all internal deal motion as if it had the same sign-off weight

The next nearby administrative case had the same shape:
- `Secretaries and Administrative Assistants` still looked too flattened because one blended administrative anchor was covering both lower-authority clerical execution and higher-value scheduling, meeting flow, and follow-up coordination
- the repo therefore added a reviewed `admin_coordination` anchor on top of the lower-authority workflow-execution baseline
- that pulled retained accountability down materially, and more importantly it changed the remaining review story: the occupation stopped looking like a pure human-guardrail miss and started looking more like a residual routine-pressure question

The next concrete example was the expert-versus-signoff cleanup:
- after the support-role accountability over-calls were corrected, several expert occupations still looked too high on retained accountability even though the issue was not really "this work is easy to delegate"
- the real problem was that the reviewed function layer was still conflating expert judgment and trusted context with formal sign-off ownership
- `Mechanical Engineers`, `Financial and Investment Analysts`, `Accountants and Auditors`, and `Software Developers` were then revised so they kept strong judgment and bargaining retention but lower authority and guardrail priors where final sign-off often sits elsewhere
- that was an important structural clarification: expert work can stay scarce and high-leverage without the model claiming the occupation always owns the final human sign-off
- that same logic then pushed the model into richer structural anchor work instead of more global reweighting:
  - `Software Developers` gained a reviewed `technical_stewardship` anchor so standards, architecture, and technical-direction work no longer had to read like generic delivery or reliability work
  - `Graphic Designers` gained a reviewed `production_execution` anchor so asset/layout/file production no longer carried the same retained-ownership assumptions as higher-level visual direction
  - `Paralegals and Legal Assistants` gained a reviewed `procedural_execution` anchor so filing, drafting, and procedural follow-through no longer inherited the same authority assumptions as higher-value legal-support and matter-coordination work
  - `Compliance Officers` gained a reviewed `issue_remediation` anchor so complaints, evidence readiness, and issue-closure work no longer inherited the same sign-off assumptions as higher-level compliance interpretation and control ownership
  - `Training and Development Specialists` gained a reviewed `learning_content_enablement` anchor so curriculum and courseware production no longer inherited the same ownership assumptions as learning-program priorities and program effectiveness
  - `Mechanical Engineers` gained a reviewed `validation_integration` anchor so prototyping, testing, integration, and readiness work no longer inherited the same sign-off assumptions as higher-level system-design ownership
  - `Business Operations Specialists, All Other` gained a reviewed `operational_followthrough` anchor so trackers, handoffs, recurring follow-through, and workflow upkeep no longer inherited the same sign-off assumptions as higher-level diagnosis and operating-design work
  - `Computer Systems Analysts` gained a reviewed `implementation_enablement` anchor so release support, issue triage, documentation follow-through, and workflow-adoption work no longer inherited the same sign-off assumptions as higher-level systems-fit analysis and requirements translation
  - `Executive Secretaries and Executive Administrative Assistants` gained a reviewed `executive_coordination` anchor so gatekeeping, board support, stakeholder routing, and decision-cadence support no longer inherited the same authority assumptions as lower-authority workflow execution
  - `Human Resources Specialists` gained a reviewed `people_process_admin` anchor so onboarding, records, benefits, and HRIS-heavy process work no longer inherited the same ownership assumptions as higher-context people guidance and recruiting judgment
- this was the key structural lesson: some occupations did not need full runtime role variants, but they still needed richer default function graphs because one flat purpose layer was too reductive

The next concrete example was the low-scarcity bargaining cleanup:
- even after the specialization-aware bargaining pass, some support occupations still held too much modeled bargaining power because the reviewed function layer was giving them more scarce leverage than they really carry
- `Customer Service Representatives`, `Bookkeeping, Accounting, and Auditing Clerks`, and `Statistical Assistants` were then revised at the function layer rather than through another formula rewrite
- their reviewed anchors now describe support, reconciliation, and analysis-assistance work more explicitly, with lower bargaining retention, authority, and guardrails
- that mattered because the model should be able to say "this work still matters" without inflating it into the kind of leverage signal associated with technically scarce or decision-owning roles

The next concrete example was the ORS integration:
- the earlier human-guardrail check depended too much on an internal quality proxy layer
- official ORS work-requirement data was added as a calibration-only table instead of being pushed straight into runtime
- the human-guardrail target now leans mainly on ORS autonomy, supervisory responsibility, and pace-control structure, and occupations without usable ORS rows are left unscored for that strongest check until coverage improves

The next concrete example was the ACS PUMS integration:
- the repo needed a real external read on whether an occupation was actually one stable shape or a heterogeneous bundle
- official ACS microdata was added as a calibration-only table instead of being pushed into the runtime score
- the resulting heterogeneity layer summarizes wage dispersion, education dispersion, industry dispersion, and worker-mix spread
- because heterogeneity is broader than fragmentation, that signal is scaled into a lower fragmentation-pressure target and conditioned on lower people intensity before being compared to the model

The next concrete example was the BTOS integration:
- the repo needed a direct external read on whether industries surrounding an occupation were actually using AI and changing workflows around it
- official Census BTOS AI supplement data was added as a calibration-only table instead of being pushed into the runtime score
- the resulting sector layer summarizes current AI use, planned AI use, task-substitution intensity, workflow-change intensity, and LLM use
- because those are business-use prevalence signals rather than model-native adoption scores, the BTOS signal is mapped into the model’s organizational-conversion range before being compared to the live adoption surface

The next concrete example was the accountability tuning pass:
- once the ORS-backed human-guardrail check was strong enough, the repo could finally review that queue without pretending weak proxies were good enough
- the review showed the runtime was still leaning too much on trust and liability alone when estimating retained accountability
- the live scorer was then adjusted to lean more on delegability guardrails, human authority, and judgment, while keeping trust and liability as smaller supporting terms
- that made the accountability layer more about durable human sign-off and decision ownership, and less about any role that happens to sit in a trusted or regulated setting

The next concrete example was an occupation-specific accountability correction:
- after the global accountability formula improved, the remaining high-confidence under-call was `General and Operations Managers`
- instead of changing the formula again, the reviewed function layer for that occupation was strengthened at the people-resource leadership anchor
- the occupation's function weights, guardrails, and authority priors were raised to better reflect real managerial sign-off and staffing ownership
- this was the more disciplined move because the remaining queue no longer looked like one global error; it looked like a smaller set of occupation-specific function-map misses

The next concrete example was the mirror-image accountability correction:
- once the managerial under-call was fixed, the remaining strongest misses were occupation-level over-calls rather than under-calls
- `Paralegals and Legal Assistants`, `Sales Representatives of Services`, and `Computer Systems Analysts` were still carrying more modeled guardrail and authority than their external structural targets supported
- the fix was again in the reviewed function layer rather than another formula rewrite: guardrails and human-authority priors were reduced for those occupations' function anchors
- that made the accountability layer more disciplined by separating "important work in a trusted context" from "work that still carries durable human sign-off ownership"

The next concrete example was the role-shape review scaffold:
- the ACS heterogeneity queue was useful, but it still lived mostly as a report and a memory of which occupations looked split
- a generated review artifact was added so the repo itself could carry that decision surface forward
- the result is a stable candidate table and markdown review report identifying which occupations are strongest candidates for explicit multi-variant modeling and which ones are still just a watchlist

The next concrete example was the first reviewed runtime role-variant layer:
- once the review queue stabilized, the repo promoted the strongest candidates into a small live `occupation_role_variants.csv` contract
- the browser can now recommend a reviewed baseline variant from the questionnaire profile plus the current task/function mix
- the user can override that choice explicitly
- after that, the editable role studio still has final authority because tasks, functions, shares, and support links remain directly editable

The next concrete example was deepening one of those reviewed variants so the split was not only cosmetic:
- `Market Research Analysts and Marketing Specialists` originally had two reviewed variants but both still shared one thin function anchor
- a reviewed supplemental marketing-operations anchor was then added and its task-to-function edges were redistributed
- that made the `marketing_ops_analyst` variant distinct at the function layer as well as the task layer, which is closer to the actual role split the review queue was surfacing

The next concrete example repeated that pattern for journalism:
- `News Analysts, Reporters, and Journalists` already had a meaningful task split between field reporting and anchor/producer work
- but the anchor/producer side was still borrowing the reporter-side source-development anchor
- a reviewed broadcast-orchestration anchor was added so the anchor/producer variant could start from a distinct function baseline that better matches program shaping, segment coordination, and live delivery

The next concrete example was tightening an already-existing split instead of adding a new anchor:
- `Technical Writers` already had a reviewed release-enablement anchor, but the release variant was still underusing it
- the release-planning task was promoted into the variant baseline and several workflow/review tasks were reweighted more clearly toward the release-enablement function
- that made the release-side variant less like “documentation author plus a small release bonus” and more like an actual documentation-program workflow role

The next concrete example repeated that same tightening move for editors:
- `Editors` already had a reviewed publication-orchestration anchor, but the managing-editor variant was still carrying too much line-editing residue
- the managing-editor baseline was shifted toward planning, contributor supervision, packaging, and calendar-orchestration tasks
- those tasks were also reweighted more clearly toward the publication-orchestration anchor, so the split became more managerial at the function layer rather than just managerial in the variant label

The next concrete example repeated that tightening move for management-analyst consulting:
- `Management Analysts` already had a reviewed change-enablement anchor, but the implementation-heavy variant was still leaning too much on the diagnostic consulting baseline
- the change-enablement variant was then shifted toward rollout, governance, stakeholder-alignment, and worker-training tasks
- those tasks were also reweighted more clearly toward the change-enablement anchor, so the split became more implementation-heavy at the function layer rather than just implementation-heavy in the variant label

The next concrete example expanded the reviewed role-variant layer beyond the original first-pass set:
- `Web Developers` had remained on the heterogeneity watchlist because one default software-delivery baseline was still “good enough” for launch
- once the first five reviewed split occupations had stabilized, the repo promoted web development into a reviewed two-variant path: experience-building work versus platform-heavy web delivery maintenance
- a reviewed web-platform-enablement anchor was added so deployment, reliability, accessibility, testing, and performance tasks could start from a distinct function baseline rather than being treated as just another flavor of generic software delivery

The next concrete example made the function layer richer without forcing a full role split:
- after the accountability queue narrowed, `Financial and Investment Analysts` still looked too coarse under one flat investment-analysis anchor
- but the evidence still did not justify explicit runtime role variants the way it did for journalism, editing, management consulting, or web development
- the repo therefore added a reviewed stakeholder-translation anchor and redistributed presentation, recommendation, and stakeholder-facing tasks into it
- that was a useful intermediate move because it let the baseline function graph become more realistic without pretending the occupation already had two clearly stable default role shapes

The next concrete example showed why the role-shape review artifact still matters even after the first variant set is live:
- once the accountability queue and supplemental-anchor coverage improved, the generated review artifact shifted again
- `Operations Research Analysts` still looked like a watchlist case rather than a clean runtime split
- `Accountants and Auditors` emerged as the strongest remaining candidate for a future reviewed split
- that was useful because it showed the repo could now distinguish three states instead of only two: one-flat-baseline occupations, multi-anchor-but-not-yet-split occupations, and explicit reviewed runtime-variant occupations

The next concrete example promoted that strongest remaining candidate into the live variant layer:
- `Accountants and Auditors` had already picked up a finance-advisory supplemental anchor, but the review queue kept showing that one baseline was still hiding two stable shapes
- the repo added a reviewed audit-assurance anchor and then promoted the occupation into two live baselines: financial-reporting accounting work versus audit-and-controls work
- that was the right move because the split was not only about different task lists; it also changed the purpose layer from close/reporting integrity to assurance/testing and remediation
- after that promotion, the generated role-shape review artifact no longer showed any strong unimplemented split candidates, leaving `Operations Research Analysts` as the lone watchlist case

The next concrete example was a non-variant structural cleanup for software development:
- the role-shape artifact did not justify splitting software developers into explicit reviewed variants
- but the accountability queue still suggested that one delivery-heavy function readout was too coarse
- the repo added a reviewed technical-stewardship anchor so standards, architecture, cross-functional scope, and technical-direction work could stand apart from pure delivery and system reliability
- the important part was not inflating sign-off ownership; it was representing a high-judgment technical layer without pretending it carries the same formal authority as executive or policy sign-off

The next concrete example repeated that structural-anchor move for graphic design:
- the accountability queue suggested the role was still too flattened, but a full variant split was not the right answer
- the repo split the function graph into higher-level creative direction and lower-level production execution
- this let layout prep, asset assembly, and production-ready output carry lower human-retained ownership than brand coherence, audience fit, and final visual direction
- after that change, graphic design no longer surfaced as an accountability-guardrail case in the structural queue

## A Rationalist Summary

The model was built by progressively replacing hidden averages with explicit structure.

The direction of travel has been:
- occupation averages
- cluster priors
- task graph
- function graph
- task scoring
- task-derived public outputs
- source-resolved task evidence
- non-runtime structural calibration
- official structural calibration inputs
- official heterogeneity calibration inputs
- official adoption-context calibration inputs
- generated role-shape review artifacts
- reviewed runtime role variants for occupations that are structurally too split for one baseline bundle
- reviewed supplemental default anchors for occupations that need a richer function graph before they justify explicit runtime variants

The remaining steps are:
- keep improving task-first scoring until strong task evidence is the default starting point whenever coverage is high enough
- review whether any calibration layer is strong enough to justify a narrow runtime promotion without collapsing interpretability

That would be the cleanest next version of the model so far.

## Suggested Blog-Post Spine

If this is later turned into a blog post, the cleanest spine is probably:

1. The problem: exposure scores are not role models.
2. Why occupation-level AI rankings were not enough.
3. Why cluster priors were useful but incomplete.
4. Why I had to build a richer task graph.
5. Why I added dependency spillover.
6. Why functions and accountability changed the problem.
7. Why the model had to become editable.
8. Why I moved public outputs to task-derived summaries.
9. Why I promoted the source-comparison layer into the runtime.
10. Why broader, better-calibrated task-first coverage is still the hard remaining problem.

That would produce a story that is causal rather than celebratory, which is the right framing for this system.
