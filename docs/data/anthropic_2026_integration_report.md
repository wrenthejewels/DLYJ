# Anthropic 2026 Integration Report

This report compares the normalized Anthropic priors generated from the imported `2026-01-15` raw release against the normalized priors generated from the imported `2026-03-24` raw release.

## Coverage summary

- 2026-01-15 anthropic task evidence rows: `551`
- 2026-03-24 anthropic task evidence rows: `569`
- 2026-01-15 anthropic occupation-cluster priors: `340`
- 2026-03-24 anthropic occupation-cluster priors: `283`
- 2026-01-15 occupations covered: `61`
- 2026-03-24 occupations covered: `61`

## Mean delta across overlapping occupation-cluster priors

- Exposure delta: `-0.013`
- Augmentation delta: `-0.021`
- Automation delta: `-0.058`
- Confidence delta: `-0.065`

## Largest exposure shifts

| Occupation | Cluster | 2026-01-15 | 2026-03-24 | Delta |
| --- | --- | ---: | ---: | ---: |
| Office Clerks, General | Admin | 0.27 | 0.00 | -0.27 |
| Compliance Officers | Research | 0.25 | 0.00 | -0.25 |
| Financial Managers | Docs | 0.00 | 0.25 | 0.25 |
| Cost Estimators | Decision | 0.00 | 0.25 | 0.25 |
| General and Operations Managers | Admin | 0.25 | 0.00 | -0.25 |
| Property, Real Estate, and Community Association Managers | Client | 0.00 | 0.25 | 0.25 |
| Property, Real Estate, and Community Association Managers | Admin | 0.23 | 0.00 | -0.23 |
| Advertising Sales Agents | Admin | 0.23 | 0.00 | -0.23 |
| Training and Development Specialists | Coordination | 0.23 | 0.00 | -0.23 |
| Computer and Information Systems Managers | Coordination | 0.23 | 0.00 | -0.23 |
| Human Resources Specialists | Coordination | 0.00 | 0.23 | 0.23 |
| Public Relations Specialists | Admin | 0.23 | 0.00 | -0.23 |

## Interpretation

- Both integrations use direct task telemetry from Claude.ai and 1P API logs, aggregated into the existing O*NET-task and task-cluster pipeline.
- Collaboration labels are mapped directly into augmentation versus automation mode shares using the observed `directive`, `feedback loop`, `learning`, `task iteration`, and `validation` breakdowns.
- The `2026-03-24` release adds a February 2026 observation window and the report itself highlights diversification, slightly higher augmentation in Claude.ai, API migration for coding work, and learning-curve effects among higher-tenure users.
- Additional task telemetry such as work-use share, human-only ability, AI autonomy, and task-success coverage continues to inform exposure scaling and evidence confidence.
