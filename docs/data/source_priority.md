# Source Priority

When a normalized field could be informed by multiple sources, use this default precedence:

1. live task evidence
2. reviewed task estimates
3. benchmark task labels
4. cluster prior proxies
5. fallback task proxies
6. occupation-level empirical priors
7. O*NET structure and context proxies
8. manual heuristic fallback

## Examples

- `task_source_evidence.csv`: resolve task rows in this order: `live_task_evidence`, then `reviewed_task_estimate`, then `benchmark_task_label`, and only then `cluster_prior_proxy` or `fallback_task_proxy`. In the live engine, the first three tiers can alter task difficulty and task pressure, can push a cluster into the coverage-aware `task_first_cluster_evidence` baseline path when enough task coverage exists, and can promote a task row into `task_first_resolved_evidence` when task-level reliability is strong enough. That task-first task promotion is source-aware and mapping-confidence-aware, so reviewed and live evidence can promote more readily than benchmark labels. Proxy tiers remain fallback only.
- `task_benchmark_manual_overrides.csv`: treat this as a normalization bridge into the existing `benchmark_task_label` tier, not as a new source tier. Use it only when the raw GPT-task-label source cannot map a selected occupation cleanly.
- `task_exposure_evidence.csv`: treat this as the live-task-evidence input feeding `task_source_evidence.csv`, not the only task-level runtime source.
- among multiple `src_anthropic_ei_*` live-task rows for the same task, prefer the newest release (`2026-03-24`, then `2026-01-15`, then `2025-03-27`) and use older releases only as backfill where the later release does not map to that task row.
- `occupation_exposure_priors.csv`: prefer the launch aggregate occupation exposure prior derived from Anthropic task evidence and O*NET structure. Treat BLS labor context as a separate downstream input for demand/readout layers rather than part of the exposure prior itself.
- `occupation_benchmark_scores.csv`: keep benchmark scores separate from public scoring and use them only for comparison reports or offline validation.
- `occupation_quality_indicators.csv`: use OECD as a framework and O*NET as the initial implementation substrate.
- `occupation_transition_adjacency.csv`: use O*NET adjacency and later augment with empirical transition data if added.
- `benchmark-only` sources such as `AIOE` or `ILO` may validate directional rankings, but they should not override the public headline stack unless they are explicitly promoted after comparison work.
