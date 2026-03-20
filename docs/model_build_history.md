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
