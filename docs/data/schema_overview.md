# Schema Overview

## Directory model

- `data/raw/`: external source mirrors or reduced extracts.
- `data/normalized/`: model-facing CSVs joined by canonical IDs.
- `data/crosswalks/`: mappings across occupation taxonomies.
- `data/metadata/`: provenance and normalization policy.

## Canonical keys

- `occupation_id`: stable internal occupation key
- `task_id`: stable internal task key
- `onet_soc_code`: canonical external occupation code for US-first launch
- `task_cluster_id`: stable reduced-task taxonomy key
- `source_id`: provenance key from `source_registry.yaml`

## Primary normalized joins

Core join path:
1. `occupations.csv`
2. `occupation_selector_index.csv`
3. `occupation_tasks.csv`
4. `occupation_task_clusters.csv`
5. `task_augmentation_automation_priors.csv`
6. `occupation_exposure_priors.csv`
7. `occupation_adaptation_priors.csv`
8. `occupation_benchmark_scores.csv`
9. `occupation_benchmark_source_scores.csv`
10. `task_benchmark_gpt4_labels.csv`
11. `ability_benchmark_scores.csv`
12. `occupation_quality_indicators.csv`
13. `occupation_labor_market_context.csv`

Current role-fate extension:
14. `occupation_task_inventory.csv` (live richer task contract)
15. `task_dependency_edges.csv` (live role-graph edges)
16. `occupation_task_role_profiles.csv` (live role-graph summaries)
17. `job_description_task_evidence.csv` (reviewed task-gap expansion evidence)
18. `task_source_evidence.csv` (source-specific task evidence contract)
19. `occupation_source_priors.csv` (source-specific occupation prior contract)
20. `role_functions.csv` (role summary and function anchors)
21. `occupation_function_map.csv` (occupation-to-function binding and guardrails)
22. `task_function_edges.csv` (task-to-function graph edges, including reviewed multi-anchor splits; now used by the live browser scorer as the baseline task-to-function graph)
23. `function_accountability_profiles.csv` (judgment, trust, liability, authority profiles)
24. `occupation_role_transformation.csv` (offline occupation-level audit/reference outputs from the broader transformation pipeline)
25. `occupation_role_explanations.csv` (offline occupation-level explanation summaries derived from the audit/reference outputs)
26. `occupation_ors_structural_context.csv` (official BLS ORS-derived structural context used for calibration-only human-retention checks)
27. `occupation_heterogeneity_context.csv` (official Census ACS PUMS-derived heterogeneity context used for calibration-only fragmentation / role-shape checks)
28. `occupation_industry_mix.csv` (official Census ACS PUMS-derived occupation-by-industry mix kept as a general occupation industry context table)
29. `occupation_btos_sector_mix.csv` (official Census ACS PUMS-derived occupation-by-BTOS-sector bridge used to join BTOS industry AI context back to occupations)
30. `industry_ai_adoption_context.csv` (official Census BTOS-derived sector AI adoption context used both for calibration and as a source input into the derived runtime adoption-context layer)
31. `occupation_demand_adoption_context.csv` (derived occupation-level runtime context blending BLS labor demand with ACS x BTOS adoption realization context for the outer demand/conversion layer)
32. `occupation_recomposition_context.csv` (derived occupation-level runtime context blending adaptation structure with demand/adoption context for workflow compression, organizational conversion, and wave timing)
33. `occupation_structural_calibration_targets.csv` (non-runtime structural calibration targets comparing live model metrics to local BLS, Census, quality-context, and adaptation-prior proxies, plus strength-aware review-layer recommendations for mismatch triage)
34. `occupation_role_shape_review.csv` (non-runtime role-shape candidate review table derived from the structural calibration layer to identify occupations most likely to need explicit multi-variant modeling)
35. `occupation_role_variants.csv` (live reviewed role-variant baselines for occupations that now support more than one stable role shape in the browser scorer)

## Purpose of the normalized layer

This layer is designed so the live v2.x model can answer:
- what tasks are exposed
- which tasks define the role's value
- which tasks carry bargaining power
- which supporting tasks are indirectly at risk because they depend on exposed core work
- whether exposed tasks are more likely augmented or automated
- whether exposed tasks decouple cleanly from the residual role
- how viable the residual role remains
- how adaptable the worker is relative to transformed role states

Current live scoring note:
- `task_augmentation_automation_priors.csv` and `occupation_exposure_priors.csv` still provide the fallback baseline difficulty anchor in the browser scorer
- `task_source_evidence.csv` is now the runtime task-evidence resolver layer: it promotes live task evidence, reviewed task estimates, and benchmark task labels ahead of proxy fallback
- clusters with strong enough resolved task-evidence coverage can now shift their baseline difficulty toward task evidence before that baseline is projected onto task rows
- high-reliability task rows can now promote further into a task-first task baseline before residual evidence blending
- `task_exposure_evidence.csv` now primarily feeds the `live_task_evidence` tier inside that resolver and preserves Anthropic-specific observation metadata such as usage share
- task-level evidence rows continue to feed evidence confidence and `direct_coverage_ratio` even when they do not clear that threshold
- task-derived cluster summaries now drive the public cluster layer and the live wave trajectory
- `occupation_role_variants.csv` is now a runtime input for a small reviewed subset of heterogeneous occupations; it does not score anything by itself, but it changes which default task/function baseline the model starts from before user edits
- the stronger reviewed split occupations can now differ at the function-anchor layer too, not only by task bundle
- accounting now follows that stronger split pattern too: the reviewed accounting variants now diverge through an explicit audit-assurance anchor rather than only through task bundle choice
- reviewed supplemental anchors are now slightly broader than the explicit role-variant subset; some occupations, such as `Financial and Investment Analysts`, `Software Developers`, `Graphic Designers`, `Paralegals and Legal Assistants`, `Compliance Officers`, `Training and Development Specialists`, `Mechanical Engineers`, `Business Operations Specialists, All Other`, `Computer Systems Analysts`, `Executive Secretaries and Executive Administrative Assistants`, and `Human Resources Specialists`, can now expose more than one reviewed default function anchor even without a separate variant selector
- software development, graphic design, paralegal support, compliance work, training-content work, mechanical engineering, and broad business operations now follow that structural-anchor path too: each occupation carries a richer reviewed default function graph without exposing explicit runtime variants
- journalism now follows that stronger split pattern as well: the anchor/producer baseline activates a reviewed broadcast-orchestration anchor instead of reusing the reporter-side source-development anchor
- technical writing now follows it more closely too: the release-enablement baseline carries the release-planning task and more clearly weighted workflow/review edges into the release-enablement anchor
- editing now follows it more closely too: the managing-editor baseline carries a more orchestration-heavy task bundle and more clearly weighted planning/packaging edges into the publication-orchestration anchor
- management-analyst consulting now follows it more closely too: the change-enablement baseline carries the worker-training rollout task and more clearly weighted rollout/governance edges into the change-enablement anchor
- web-development now follows it too: the platform-maintainer baseline carries deployment, reliability, accessibility, and performance work into a reviewed web-platform-enablement anchor instead of staying inside one flat software-delivery baseline
- `occupation_structural_calibration_targets.csv` is not a runtime input; it exists only for calibration, disagreement reporting, and tuning review
- `occupation_ors_structural_context.csv` is also not a runtime input; it currently feeds the calibration layer’s human-guardrail target using ORS autonomy, supervision, and pace-control structure
- `occupation_heterogeneity_context.csv` is also not a runtime input; it currently feeds the calibration layer’s role-heterogeneity target using ACS wage dispersion, education dispersion, industry dispersion, and worker-mix spread
- `occupation_industry_mix.csv` is also not a runtime input; it remains a general ACS occupation-by-industry context table
- `occupation_btos_sector_mix.csv` is also not a direct runtime scoring table; it bridges ACS occupation sector mix into both the BTOS calibration layer and the derived runtime demand/adoption context layer
- `industry_ai_adoption_context.csv` is also not a direct task-scoring input; it currently feeds the calibration layer’s adoption-context target and the derived runtime occupation adoption context using BTOS sector AI-use and deployment-change estimates
- `occupation_demand_adoption_context.csv` is now a runtime input for the outer demand/adoption layer; it does not affect task automability, but it does inform demand expansion, effective adoption realization, and organizational conversion
- `occupation_recomposition_context.csv` is now a runtime input for the outer recomposition/timing layer; it does not affect task automability, but it does constrain workflow compression, organizational conversion, and wave timing
- `occupation_role_shape_review.csv` is also not a runtime input; it currently turns the ACS/structural heterogeneity queue into a concrete candidate list for future variant review and expansion work

See `docs/data/task_role_graph_contract.md` for the first-step contract behind the role-fate redesign.
See `docs/data/role_transformation_contract.md` for the first-pass function and role-transformation layer.
See `docs/data/calibration_framework.md` for the empirical calibration scaffold.
