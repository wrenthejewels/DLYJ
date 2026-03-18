# Launch Coverage

## Goal

This file locks the first-pass launch occupation set so normalization work does not expand chaotically.

## Current target

- `64` core occupations are now selected in the live seed population
- `2` stretch occupations remain as near-term candidates
- the `30` white-collar occupations from `data/metadata/next_30_white_collar_seed.csv` have now been promoted into the live seed
- focus is white-collar roles where the v2.0 transformation model is likely to be legible and evidence-backed
- the launch set is now explicitly shaped to cover every broad role category already exposed in the v1 UI

## Selection criteria

- clear task structure that can be mapped into v2.0 task clusters
- useful variation across augmentation, automation, and coupling
- enough labor-market salience to matter for public launch
- enough likely source coverage across O*NET, Anthropic, Manning/Aguirre, and BLS

## Coverage goals by family

- software and data analysis
- administration and office support
- finance and accounting
- sales, marketing, and communications
- legal and compliance
- HR and training
- content, creative, and journalism
- engineering and operations
- hybrid product-management and consulting proxies

## UI bridge

The current product surface in `index.html` still exposes broad role categories such as `Administrative`, `Product Management`, and `Journalism`.

Use `data/metadata/ui_role_category_map.csv` as the bridge between those UI categories and the launch occupation set.

This prevents the launch occupation seed from being distorted by one-to-one category matching while still preserving full public-category coverage.

## Out of scope for the first pass

- highly physical occupations
- trades and field service work
- narrow medical specialties
- occupations with weak task-level evidence and high crosswalk ambiguity

## Source of truth

Use `data/metadata/launch_occupation_seed.csv` as the live supported occupation seed until a broader ingestion path replaces the current curated enrollment flow.

Use `data/metadata/next_30_white_collar_seed.csv` as the promotion record for the `2026-03-18` white-collar expansion batch and as the reference ordering for any follow-up calibration work.
