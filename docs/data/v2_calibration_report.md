# V2 Calibration Report

This report compares the live `v2_engine.js` output against the reviewed calibration set in `data/metadata/v2_reviewed_calibration_set.csv`.

## Summary

- calibration cases: `10`
- average score: `1.000`
- perfect-match cases: `10`
- partial-mismatch cases: `0`

## Metric pass rates

- `compatibility_role_outlook`: `10` / `10`
- `seat_break_scenario`: `0` / `0`
- `residual_role_strength`: `10` / `10`
- `personalization_fit`: `10` / `10`
- `top_exposed_cluster`: `10` / `10`
- `exposed_task_share`: `10` / `10`
- `workflow_compression`: `10` / `10`
- `substitution_gap`: `10` / `10`

## Case results

| Occupation | Score | Compatibility outlook | Seat-break scenario | Top exposed | Compression | Gap | Notes |
| --- | ---: | --- | --- | --- | ---: | ---: | --- |
| Software Developers | 1.000 | role_becomes_more_senior | current | cluster_drafting | 0.562 | 0.204 | reviewed_baseline_software |
| Operations Research Analysts | 1.000 | routine_tasks_absorbed | distant | cluster_analysis | 0.402 | 0.204 | reviewed_baseline_or_analyst |
| Management Analysts | 1.000 | routine_tasks_absorbed | distant | cluster_coordination | 0.440 | 0.179 | reviewed_baseline_management_analyst |
| Market Research Analysts and Marketing Specialists | 1.000 | routine_tasks_absorbed | current | cluster_research_synthesis | 0.532 | 0.210 | reviewed_baseline_market_research |
| Human Resources Specialists | 1.000 | routine_tasks_absorbed | distant | cluster_relationship_management | 0.336 | 0.213 | reviewed_baseline_hr |
| Accountants and Auditors | 1.000 | routine_tasks_absorbed | current | cluster_qa_review | 0.534 | 0.251 | reviewed_baseline_accountants |
| Lawyers | 1.000 | mostly_augmented | distant | cluster_analysis | 0.251 | 0.181 | reviewed_baseline_lawyers |
| Writers and Authors | 1.000 | routine_tasks_absorbed | current | cluster_drafting | 0.458 | 0.177 | reviewed_baseline_writers |
| Marketing Managers | 1.000 | mostly_augmented | distant | cluster_oversight_strategy | 0.371 | 0.200 | reviewed_baseline_project_management |
| Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | 1.000 | role_narrows_but_remains_viable | current | cluster_execution_routine | 0.684 | 0.324 | reviewed_baseline_admin_assistant |
