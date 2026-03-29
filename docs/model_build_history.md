# How We Built the Model

## Purpose

This document is the internal source text behind the public build-history page.

Use it for:
- future public writing
- engineering handoff context
- explaining why the model evolved in the order it did

It is not the canonical behavior spec. For live behavior, use:
- `v2_engine.js`
- `docs/role_transformation_overhaul_plan.md`
- `docs/v2_0_results_spec.md`
- `docs/data/role_transformation_contract.md`
- `docs/data/task_role_graph_contract.md`

## The Question

The motivating question was never just:

"Which occupations are exposed to AI?"

It was:

"If AI gets better at parts of a role, what happens to the role as an organizational unit?"

That distinction drives the whole architecture.

A pure exposure score collapses several different outcomes:
- augmentation
- compression
- splitting into execution and oversight tiers
- collapse of the seat as a distinct role

Those outcomes matter because users do not only want to know whether AI overlaps with their work. They want to know what happens to their role after that overlap starts to matter.

The latest architectural turn pushes that one step further: the product is no longer presented mainly as a fate label plus supporting diagnostics. It now leads with a structural-state layer and keeps the canonical trajectory layer beneath it as mechanism. The first read is no longer "what is the fate label?" but "how much of the work is under AI pressure, and what state does the occupation move through over time?"

The first calibration pass after that shift then made one important correction: trajectory could not stay purely occupation-context-driven once the repo already had a reviewed function layer. Demand response and structural necessity now read function-category structure too, so a revenue-creation role, a workflow-execution role, and a governance-heavy role do not inherit the same Jevons and retained-core logic.

The next correction was about causality and calibration rather than new surface area. Once trajectory became the top-level read, the repo still needed two things to make that layer defensible: a way to show which function anchors were actually holding the seat together, and a way to keep edited-role comparisons from talking only in legacy fate language. The live runtime now exposes per-function trajectory contribution groups and a trajectory-aware edit delta, and the classifier itself is now tuned against the default occupation-map regression snapshot so the shipped distribution can actually reach stable, transforming, compressing, and collapsing states instead of bunching into a narrow first-pass band.

The next UI refinement was about hierarchy. The prototype still felt like a structured report because time lived in cards, labels, and threshold buckets instead of in one clear forecasting surface. The live page now treats a role-level trajectory graph as the primary time object: the graph is driven by continuous `P(t)`, continuous `D(t)`, derived `L(t)`, and analytic `dP/dt`; it now renders as a stricter transformed-share accumulation curve from `P(t)`, with a conservative/aggressive scenario band, a buildout marker at max `dP/dt`, and threshold crossings projected directly onto that baseline curve rather than explained in a separate competing time panel.

The next cleanup was about keeping that hierarchy honest after the graph landed. The timing frontier still existed for audit value, but it was too builder-facing to compete with the trajectory line, so it moved into a collapsed timing inspector inside supporting detail. At the same time, the occupation landscape sidebar stopped acting like a metric dump and started interpreting where the role sits and what nearby roles imply.

One more small correction followed on the role-shape side: the three retained-role columns were too willing to repeat the same anchor. The live runtime now enforces distinct groupings first at the reviewed function layer and then, when that layer is too thin, by backfilling later groups from non-overlapping scored tasks. That made the page read more like one coherent forecast and less like the same evidence being restated three times.

The next architectural branch did not replace that trajectory stack yet. Instead, it added a parallel structural-state layer above it. The reason was straightforward: the runtime was already good at showing how pressure accumulates over time, but it still routed too much interpretation through wave-timing language and fate labels. The new shadow `state_trajectory` layer reuses the same task/function substrate and asks a different first question: is the retained role broad or narrow, is one bottleneck carrying too much of the seat, does automation free the worker into a stronger retained core, and do firms have enough incentive to finish automation once the next bottleneck clears. That branch stays tunable and explicitly experimental for now, with user-adjustable demand-offset and automation-investment assumptions, so the new state machine can be tested beside the shipped trajectory layer before it replaces any older interpretation logic. The first UI version of that branch was still too report-like, so the next pass promoted it into its own continuous role-integrity graph with an assumption band, dominant-state ribbon, and transition markers. That made the page lead with a seat-level state path over time instead of dropping users straight into checkpoint cards. The next framing pass tightened the product again: the top-level structural-state surface now opens with a task-exposure strip and a derived 0-10 year occupation-state forecast, stacked across retained, complemented, compressed, rebundled, and displaced states, while the continuous role-integrity line remains underneath only as a supporting explanation of how intact today's job shape stays during that forecast and the five-year read remains as the practical checkpoint view below it. The older transformation-layer hero, checkpoint, and timing sections were then explicitly removed from the default page flow so the new state forecast could stand on its own. The tuning layer now exposes five continuous assumption controls on top of that state model: demand offset, automation-investment pressure, adoption speed, exposure buildout speed, and role staying power. The exposure-buildout control now stands in for the broader capability-side exposure dynamic, not only the steepness of already-exposed curves.

The next hero-chart pass simplified that same state forecast for individual users again, but in a more consequential direction. The dominant-state line was easier to scan than the stacked five-state chart, but it still threw away too much of what the model knew about upside, downside, and retained transformation. The main slot now shows a 0-10 role outcome balance chart instead: a three-band time series for what stays mostly intact, what changes but still points toward a surviving seat, and what reads as downside pressure. The older stacked occupation-state chart still exists, but it has been demoted into the secondary chart row beside `Role coherence over time`, where it now reads as a state-fit companion rather than the primary forecast surface.

The next cleanup pass was deliberately smaller and more architectural than visual. By then the product had already stopped showing the old trajectory/wave/timing panels in the default flow, but the client was still re-rendering those hidden sections on every result update and still falling back to legacy fate wording in a few edit-impact spots. The runtime now stops spending normal update work on those hidden legacy sections, the edit-impact callout now prefers the newer trajectory state language, and the transition-trigger layer now reads the already-computed `next_wave_retained` diagnostic directly instead of falling back to the exported wave object. The remaining wave/fate fields are treated more explicitly as compatibility scaffolding instead of active page logic. That matters because it marks the first real retirement step in the shift away from wave-first interpretation: the old exports still exist where the lower layer or backward compatibility needs them, but they no longer get equal runtime/UI weight with the new state forecast.

The next visual calibration pass pushed that same time logic into both the hero chart and the occupation comparison surface. The top occupation-state forecast uses explicit yearly ticks from `0` through `10` instead of grouped time buckets, which makes it read more like a real time series than a staged diagram. The occupation landscape underneath also stopped being one default scatter. It now brings together three occupation-level reads on the same language: an outcome map, a 0-10 dominant-state matrix, and a restored structural diagnostic map. That matters because each one answers a different question: what happens first, what path each occupation follows over time, and what structural tradeoffs sit underneath that path.

The next calibration pass focused on a subtler problem in the new state layer. Once the exposure-dynamics control started unlocking harder tasks over time, the raw transformation curves moved in the right direction, but the structural classifier still left too many roles parked in `rebalanced` or `indeterminate` long after compression had become the dominant force. The fix was not another global aggressiveness knob. Instead, the role-integrity calculation now loses support faster as transformed share and bottleneck pressure rise, and the discrete state thresholds now reserve `rebalanced` for a narrower class of genuinely surviving-but-reorganized roles. In practice that makes the live model more willing to call `compressed` or `displaced` when demand and structural support do not keep pace, while still preserving a smaller complemented lane for high-structure professions such as managers and lawyers.

The next calibration issue was more basic: the time model was still reading too mild at year 0 for already tool-saturated knowledge work. Direct AI pressure could be high while transformed share still started near zero, because the engine was only good at modeling future buildout of exposure, not current realized workflow change. The fix was to add a present-day realization floor inside each task's contribution. That floor rises with direct pressure, observability, cluster capability readiness, and absorption, then gets reduced by retained leverage and accountability. The result is that roles such as software developers, writers, and customer support no longer begin the graph as if almost nothing has changed yet, while protected high-accountability roles still start lower than their raw task pressure alone would imply.

The next step made that floor more principled instead of more hand-tuned. The model already had `occupation_individual_ai_usage_context.csv` as a calibration-only reference, derived from observed occupation-level Claude usage. That source is now promoted narrowly into the runtime trajectory layer. It does not become task evidence, and it does not rewrite demand/adoption or the rest of the decade. Instead, it acts as a soft year-0 anchor for the covered subset of occupations, weighted more heavily when worker-level usage is higher than the org-side adoption context and more lightly when the org-side context already outruns observed worker usage. The important design point is that this remains a universal function: the runtime still uses one shared task-level present-day floor, but that floor now has a documented empirical nudge where current occupation-level AI use is actually observed.

The next occupation-landscape runtime pass addressed a performance failure rather than a scoring one. The new matrix/outcome map and the restored structural diagnostic map had each been computing the full launch set independently, which made the section visibly slow on desktop and fragile on smaller devices. The occupation-level surfaces now share one cached snapshot under the active assumption controls, and the structural diagnostic map initializes lazily instead of competing with the rest of the page during first paint.

The next occupation-level pass reintroduced an x-y chart and the older structural scatter, but only after translating them into the new model language. The occupation block now starts with an outcome map that compresses each role into first structural shift versus year-10 displacement share, then shows the full dominant-state matrix, and then restores the older structural diagnostic map underneath. The important constraint was to keep the old axes where they were still useful while stripping out fate labels and wave-first language that no longer matched the live model. The restored map now behaves like a secondary structural diagnostic rather than a competing headline forecast.

The next page-logic pass separated the control surfaces for those two layers. The individual role forecast at the top already depended on the user's selected occupation, hierarchy, questionnaire answers, and edits, so letting the occupation landscape inherit those same controls made the comparison set unstable and hard to interpret. The bottom occupation block now has its own hierarchy selector and its own copies of the five state-model sliders. Those controls always rerun the full modeled occupation set under reviewed default questionnaire presets for each occupation, while the top controls remain tied only to the user's scored role. That keeps the comparison section useful as a shared-baseline landscape instead of a projection of one edited role onto every occupation.

The next hierarchy pass tightened what a senior title is allowed to do in the model. Up to that point, hierarchy only changed the questionnaire/profile layer, which meant higher levels already looked more owner-shaped but did not receive any extra persistence once execution compression started to bite. The runtime now adds a narrow hierarchy-persistence bonus on top of the existing profile path. It is intentionally gated: higher hierarchy only adds protection when retained accountability, decision authority, and coordination signals are already real. That means the model no longer has to pretend senior tasks are less exposed, but it can still treat genuinely owner-heavy senior seats as slower to dissolve than junior execution-heavy seats inside the same occupation.

The next role-forecast pass addressed a more visual modeling problem: too many roles were still inheriting similar hero-chart silhouettes even when their underlying structures differed. The fix was not just another annotation layer. The state engine now detects a small set of tipping points directly from the baseline state timeline, such as when compression starts to outpace offset, when today's job is no longer mostly intact, or when a core bottleneck begins to clear. It then assigns each role to a curve family such as `stable_hold`, `complement_then_hold`, `rebundle_then_hold`, `early_compression`, `compression_then_break`, `late_cliff`, or `demand_expansion`. The hero role outcome balance chart uses those new engine fields to reshape the visible path, so roles are less likely to all read as the same smooth early plateau followed by a late downside rise.

The first calibration pass after that release was about reachability rather than inventing new families. In the initial sweep, `late_cliff` and `demand_expansion` almost never appeared because the gates were too dependent on the final discrete state label. The calibration widened those families to read more directly from demand strength, retained integrity, and late structural breaks on the timeline itself. It also changed the primary tipping-point selector for `late_cliff` so those roles now point to the later intactness or bottleneck break rather than to the first minor state transition.

The next shared-function calibration pass was about reducing formula floors and restoring more believable separation between role families. The structural report had started to show a repeated pattern: accountability mismatches were still the largest queue, routine and support-heavy roles still sat too high on bargaining leverage because the retained-leverage term set too hard a floor, and too many occupations still hit `intactness_break` early enough to reuse similar medium-term path shapes. The runtime now handles those issues in three connected ways. First, `retained_bargaining_power` leans a bit less on raw retained leverage and a bit more on function-level bargaining retention, bargaining-weighted task structure, and retained accountability. That lowers the artificial floor for clerical and support-heavy roles without turning knowledge-heavy roles into automatic collapses. Second, retained accountability now gets a narrower conditional lift when high authority and trust signals are paired with genuinely people-heavy work, which helps manager-like seats more than document-heavy professional roles. Third, knowledge-heavy drafting, documentation, and analysis work now gets a modest routine-pressure damp, and the `intactness_break` trigger now waits for clearer actual break conditions instead of firing as soon as integrity slips a little below the midpoint. The result is not a role-by-role patch. It is a more differentiated shared model: software, sales, managers, and content roles now separate more cleanly, while the strongest early-compression paths remain concentrated in clerical, intake, and routine support work.

The next data-refresh pass updated the live Anthropic Economic Index source from the `2026-01-15` release to the newer `2026-03-24` "Learning curves" release while keeping the January release only as backfill where the later raw task window did not map cleanly. That mattered for two reasons. First, it refreshed the direct task telemetry that feeds the pressure layer with February 2026 usage rather than November 2025 usage. Second, it gave the repo a first concrete release-to-release empirical comparison for the same raw-schema family: the March release added task evidence rows overall, but it still left two thin-coverage edge cases. The live selector was then trimmed from `63` to `61` occupations so direct Anthropic task evidence now covers the full shipped set. In practice, that means the empirical source got fresher while the default user experience also stopped relying on uncovered occupation exceptions.

The next pass was a scoring-layer review focused on mechanical issues rather than new surface area. A full audit of the engine and UI identified six confirmed issues: a step-function discontinuity in the coherence bonus, an overly aggressive absorption rate floor, undocumented magic numbers in the state forecast share mapping, missing documentation on the wave thresholds and scoring weights, silent failure when role composition loading failed, and brittleness in the role fate decision tree. The first five were fixed directly. The coherence bonus now ramps smoothly instead of jumping at exact cluster-count and retained-share thresholds. The absorption rate floor was lowered from 0.45 to 0.25 so high-friction clusters can realistically show low absorption. The state forecast weights were extracted into a named constant block with per-weight documentation. The wave thresholds, friction weights, and automation difficulty weights all received inline calibration comments. And the composition load path now shows a user-visible error instead of failing silently. The role fate decision tree was documented as the highest-priority remaining scoring-quality issue but left untouched because its 50+ hand-tuned thresholds need a more deliberate replacement strategy than a quick fix.

A second pass in the same session then addressed the four remaining scoring-quality issues. The role fate decision tree was replaced with a score-per-fate system: each of the seven fates now receives a composite score from weighted soft-gate contributions, and the highest score wins. This eliminates evaluation-order dependence and degrades smoothly near decision boundaries instead of flipping at hard thresholds. The confidence formula was extended to blend classifier margin, signal decisiveness, and evidence quality (from `recompositionConfidence`) rather than measuring only input spread. On the UI side, ~34 legacy hidden compatibility divs and three dead hidden sections were removed from `index.html`, and the remaining trajectory detail sections were wrapped in a disclosure widget so the state forecast is the unambiguous primary surface.

A third pass then tightened the score-per-fate system itself. The `mixed_transition` fate had a hardcoded 0.30 base score that gave it a structural advantage over fates that had to earn every point from signal gates; that was replaced with a cross-pressure formulation that only scores high when protective and destructive signals genuinely coexist. The split signal's hard binary gate on function count was replaced with a continuous ramp so roles with thin function layers can contribute partial signal. Several remaining numeric-threshold ternaries in the fate scores were converted to soft gates for consistency, while pure categorical checks on discrete labels were kept as-is. The task-graph path's inline wave-assignment logic was replaced with a call to the shared `waveAssignmentForDifficulty()` helper to eliminate a normalization gap. Dead code was cleaned up: an unused `administrativeRoutineContext` computation, a double `var` declaration of `learningIntensity`, and a `fallback_source_role` field that was always identical to `primary_source_role`. On the UI side, `simplifyForecastStateKey` was aligned to reference the `STATE_FORECAST_WEIGHTS` constant for the displaced threshold instead of maintaining an independent inline value.

A fourth pass was a full mathematical audit of the engine, state forecast, and preset layers. A systematic review of every weighted sum, normalization step, edge case, and cross-file data contract identified 17 issues across four categories. The most consequential fixes were: (1) the structural-necessity weight vector summed to 1.10 instead of 1.00, compressing the top 9% of scores into the ceiling, corrected by redistributing 0.10 across the lower-weighted terms; (2) the human-advantage signal in automation difficulty was double-scaled to an effective 8.75% weight instead of the declared 25%, fixed by removing the redundant 0.35 pre-multiplier; (3) an operator-precedence bug in role-shape classification allowed the function-layer signal to override the cluster-share comparison unconditionally because `&&` binds tighter than `||`, fixed with explicit parentheses; (4) nine occupations silently received neutral questionnaire presets because the preset dictionary used hyphenated keys while the runtime normalized them to underscore/short forms, fixed by adding alias entries and two missing role-family presets; (5) single-cluster roles received a coherence score of 0.5 instead of near-1.0, fixed by returning 0.92 when no cross-cluster dependencies exist to measure. The medium-priority fixes included: normalizing the Dirichlet posterior to sum to 1.0 even when prior base shares do not, capping the bottleneck-risk compression multiplier at 1.0 so additive nuance terms stay meaningful, rebalancing role-integrity weights so a fully intact role can reach 1.0 without positive stayingBias, correcting the focus-reallocation positive weights from 1.04 to 1.00, fixing the state-forecast normalization denominator to match the numerator clamping so shares always sum to exactly 1.0, eliminating fragile double-`.find()` calls in the event-detection logic, and exempting the year-5 marker from proximity deduplication since it is always analytically relevant. The audit also catalogued ~20 dead render functions, ~94 orphaned DOM element IDs, and ~12 unused module exports as a cleanup backlog.

A continuation pass addressed four more weight-sum issues found by a second mathematical sweep: `buildStateFirmIncentive` base weights summed to 1.06, `assistMargin` positive weights summed to 0.90, `structuralBreakMargin` positive weights summed to 0.92, and `clamp()` silently passed NaN through via Math.max/Math.min. All four were corrected. The dead code backlog from the first audit was then executed: ~20 dead render functions, ~60 orphaned DOM-write calls in live functions, 3 dead engine functions, dead module exports, and an orphaned stylesheet were all removed.

## What Existing Research Gave Us

The prior literature was useful, but it was mostly measuring technological overlap rather than role transformation.

The key path was:
- occupation-level automation framing from Frey and Osborne
- task-level corrections showing that unit of analysis changes the answer materially
- task and ability overlap work such as AIOE, Webb, SML, and GPTs are GPTs
- observed AI usage from the Anthropic Economic Index

The strongest update from reading that literature was not that exposure work was bad.
It was that exposure work was being asked to answer a broader organizational question than it actually measured.

## The Main Failure Modes of Exposure Scores

Exposure scores kept failing in the same ways:
- they flatten core work and support work together
- they miss spillover from adjacent workflow changes
- they miss within-occupation role variation
- they confuse exposed tasks with disappearing seats
- they usually under-model adoption friction and institutional constraints

That made the relevant object a role-transformation model, not an exposure leaderboard.

## The Sequence of Model Changes

### 1. Occupation-level scoring

The first naive version mapped a user to an occupation and assigned an exposure-style score.

It failed because it could not show:
- where pressure starts
- what work is core versus support
- why two workers in one occupation might face different outcomes
- the difference between role compression and role collapse

### 2. Cluster-level priors

The next version decomposed occupations into task families or clusters.

That was useful because clusters are:
- reviewable by humans
- more stable than sparse task-level evidence
- good enough to seed an early wave model

This improved decomposition, but clusters were still averages.
Tasks inside one cluster could differ a lot in exposure, importance, and retained leverage.

### 3. Richer task inventory

The next step was to make tasks first-class objects.

That required:
- richer task inventories
- reviewed job-description additions where O*NET was too thin
- stable internal `task_id`s
- task attributes such as `value_centrality`, `bargaining_power_weight`, `role_criticality`, and `ai_support_observability`

This changed the question from:
- how exposed is this occupation?

to:
- which tasks explain why the role exists, and what happens if those tasks move?

### 4. Dependency graph

Tasks alone still implied too much independence.

The graph layer added explicit edges so the model could represent:
- direct pressure on a task
- indirect spillover onto connected support work

This was one of the most important upgrades, because support work often weakens when upstream work changes even if the support task is not easy to automate directly.

### 5. Function and accountability layer

Tasks still described how the work gets done, not what the human role is there to own.

The function layer added:
- role functions
- occupation-to-function maps
- task-to-function edges
- accountability and guardrail profiles

This was the step that turned the project from an exposure model into a role-transformation model.
The key distinction became:
- exposed tasks
- retained human-owned function

### 6. Editable role composition

The model still assumed that users matched a generic occupation bundle.
That was too coarse.

The editable layer added:
- removable and addable tasks
- editable function anchors
- optional dependency edits
- optional task-to-function edits
- reviewed role variants for occupations with meaningfully different work shapes

This moved personalization from coefficient nudging to editing the actual graph being scored.

### 7. Task-level scoring

The runtime then shifted from cluster surfaces to actual task scoring.

That made the explanation more concrete, but the first task layer still inherited too much of its baseline from cluster priors.

### 8. Task-source evidence resolver

The next major change was to resolve task evidence explicitly from a source stack:
- live task evidence
- reviewed task estimates
- benchmark task labels
- cluster priors
- occupation priors

The central rule is specificity.
The model prefers the strongest claim about the exact row being scored, with explicit fallbacks when evidence is weak.

### 9. Upward aggregation

Once tasks were being scored properly, the public surfaces needed to become consequences of task scoring rather than inherited assumptions.

That led to:
- task-derived cluster summaries
- task-derived wave timing
- task-led role-fate interpretation

This kept the public explanation aligned with the actual runtime.

### 10. Task accession layer

The next gap was that the model could explain what gets pressured, but not what grows because of that pressure.

That matters because a heterogeneous role-fate model needs more than:
- exposed work
- retained work

It also needs:
- shrinking work
- accession work
- the new bundle that those changes create

The first accession pass therefore derives likely growing human bundles from the same task-scored cluster bundle, using retained share, elevation pull, spillover, bargaining/accountability retention, and demand expansion.

This is still a first-pass structural estimate, not a fully externally calibrated task frontier.
But it is a better object for explaining role transformation than asking users to infer “what grows” from the fate label alone.

The follow-on step was to stop exposing those bundles as raw internal cluster names.
The live rebundle panel now synthesizes first-pass public labels from the top task statements plus linked function anchors, so users see something closer to `contract language documentation` or `borrower option handling` instead of `cluster_documentation` or `cluster_client_interaction`.

The next follow-on was to expose organizational thresholds directly.
The live result now also derives a first-pass transition-trigger map: assistive use, delegation, compression, and structural seat break.
That layer is intentionally not a fake exact forecast of external price or reliability points.
It is a normalized read of when the role starts to change organizationally given the task graph, function graph, adoption pressure, compressibility, and retained human leverage.

After that, the model still needed to answer a simpler user question:
what actually leaves the seat, what stays human-owned, and what takes over more of the job after the transition starts.
The live result now also derives a first-pass seat map from the shrinking bundles, retained bundles, and accession bundles so the outcome surface can show a compact before/after role shape instead of forcing users to infer it from prose.

That immediately raised a second presentation problem:
once the model surfaces more bundles, it also needs to say which bundle reads are well-supported and which are still relatively thin.
The current answer is a first-pass qualitative confidence badge on the bundle rows.
The trigger layer now also carries a first-pass confidence label and a more specific reason, because organizational threshold reads can be thinner or more contested than the bundle read they sit on top of.
The first generic version overused one explanation. The current one separates task-backed reads from adjacent-threshold ties, crowded ordering, and thin rebundle evidence.

The next timing update tightened the same idea.
The old wave layer still leaned on difficulty bands plus special-case promotion rules for narrowed roles.
That was hard to defend, and it blurred the difference between:
- model capability
- reviewability and delegability
- economics
- retained-core friction

The runtime now uses a shared timing frontier instead.
Each cluster and each public trigger is evaluated against explicit hurdles using:
- capability readiness
- supervision readiness
- economic pressure
- organizational friction

Those hurdles are then tested under `current`, `next`, and `distant` scenarios, with occupation-level scenario lifts and adoption ceilings coming from the recomposition context layer.
That made the timing story easier to explain.
It also made the trigger map and wave engine use the same object instead of two partly overlapping heuristics.
## Why the Model Did Not Become a Black Box

There were simpler-looking alternatives.
We could have trained a more opaque predictor over occupation features and benchmark signals and emitted one final risk score.

We did not choose that path because it would have answered the explanatory question badly.
The design goal was always to be able to point to:
- the task rows
- the function map
- the dependency path
- the evidence tier
- the retained leverage signals

and say why the output moved.

That preference increases architectural complexity, but it keeps the model auditable.

## Why Calibration Mostly Stays Outside Runtime

As more external data became available, the tempting move was to pour it straight into the live score.
The repo mostly avoided that.

The reason is interpretability.
Task automability, organizational adoption, labor demand, and occupational heterogeneity are different signals.
If they are blended carelessly, the result says less, not more.

The working rule is:
- use external data to expose where the model's own layers are wrong
- then fix the model at the correct layer

Examples:
- if ORS shows the accountability layer is off, change the accountability layer
- if external evidence shows a cluster friction profile is too easy, change that profile
- if BTOS shows the adoption story is off, change the outer conversion layer

This keeps the runtime from collapsing into score soup.

## What Changed Our Mind Recently

Several recent updates were real belief updates rather than routine maintenance:
- drafting and documentation were too easy in the model, so their friction profiles were raised
- tacit knowledge and judgment were more protective than accountability alone, so their weights were increased relative to accountability
- firm adoption and individual AI usage were not the same signal, so BTOS-style adoption context and occupation-level usage were kept separate instead of blended

## Where the Model Stands Now

As of March 2026, the architecture is no longer missing whole conceptual layers.
The main remaining work is:
- improving task-first evidence coverage
- refining thin function graphs where one default is still too flat
- improving the audit surface
- keeping outer adoption and demand layers empirical without letting them contaminate task automability
- hardening regression guardrails so classifier or trigger drift is caught before it reaches the occupation map
- turning the first-pass accession, trigger, and seat layers into more structural reallocation objects rather than compact explanatory heuristics alone

A follow-up March 2026 function-depth pass resolved an earlier docs/runtime drift in the support and clerical queue and then finished the last remaining one-anchor occupations.
`Customer Service Representatives`, `Statistical Assistants`, `Bookkeeping Clerks`, `Office Clerks`, `Secretaries and Administrative Assistants`, `Logisticians`, `Electronics Engineers`, `Writers and Authors`, and `Advertising Sales Agents` now all ship with reviewed supplemental anchors in the live graph rather than only in the narrative docs, so every selected occupation now starts from a reviewed multi-anchor default function graph.

The runtime is now best described as an upward-aggregating role model:
1. resolve occupation
2. build editable task and function graph
3. start from stable cluster difficulty priors
4. project onto tasks
5. resolve task evidence from the source stack
6. let reliable task evidence alter task scores
7. propagate spillover through the dependency graph
8. compute retained leverage and retained function signals
9. aggregate tasks back into cluster, wave, and role outcomes
10. choose the fate label from the structured signals

One important late correction was tightening the public fate classifier twice.

The first fix was narrowing `Splits into execution and oversight tiers`. Earlier versions let that label act as a broad catch-all for medium-pressure recomposition. That was too loose and too literal. The split gate is now strict and only assigns true split outcomes when the function layer shows real internal bifurcation, not just exposed work plus some retained higher-value work.

The second fix came after that. Once `split` was narrowed, `Same work, fewer people` started swallowing almost the whole library because the compressed gate still treated median direct pressure as enough evidence of seat compression. The correction was to anchor the public fate pass partly to the earlier wave-derived `role_outlook` state and to require stronger compression evidence before assigning `Same work, fewer people`. That brought back a more plausible separation between `AI-supported role stays intact`, `Less execution, more judgment`, `Same work, fewer people`, and `Mixed signals, path still unclear`.

## Design Rules That Emerged

These rules were not written first. They were learned by watching which model changes kept surviving review.

- represent the role before scoring the role
- when an abstraction hides the mechanism, move one layer lower
- keep explicit fallback tiers
- aggregate upward only after the lower layer is coherent
- prefer auditable mechanisms to opaque elegance
- keep exposure separate from displacement for as long as possible

## Compact Summary

The model evolved by replacing hidden averages with explicit structure.

The sequence was:
- occupation scores
- cluster priors
- richer tasks
- dependency graph
- function and accountability layer
- editable role composition
- task-level scoring
- source-resolved task evidence
- task-derived public outputs
- calibration that fixes internal layers instead of replacing them

The next good versions should probably follow the same pattern.

## Recent UI Trim

The supporting analytical breakdown is narrower now than in the earlier 2.0 passes.

- `Your role before and after` was removed from the live page
- the standalone `What protects this role` box was removed
- the separate audit-trace table was removed from the live UI and replaced by the remaining task-level evidence notes in the task breakdown
- the task pressure map remains, but it now defaults to current structural language (`Likely mode`, `Pressure band`) instead of centering the older wave framing
- the task list disclosure now expands directly from one click instead of relying on the older secondary render path
- the secondary stacked state-share chart was replaced by a hero-chart inspector so the five public states can still be inspected without repeating the main forecast as a second graph
