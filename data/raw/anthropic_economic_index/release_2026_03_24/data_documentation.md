# Data Documentation

This document describes the data sources and variables used in the fourth Anthropic Economic Index (AEI) report.

## Claude.ai Usage Data

### Overview
The core dataset contains Claude.ai usage metrics aggregated by geography and analysis dimensions (facets).

**Source files**:
- `aei_raw_claude_ai_2026-02-05_to_2026-02-12.csv` 

**Note on data sources**: The AEI raw file contains raw counts and percentages.

### Data Schema
Each row represents one metric value for a specific geography and facet combination:

| Column | Type | Description |
|--------|------|-------------|
| `geo_id` | string | Geographic identifier (ISO-3166-1 country code for countries, ISO 3166-2 region code for country-state, or "GLOBAL"). Examples: "USA", "AGO-LUA" (Angola-Luanda), "ALB-02" (Albania-Fier) (raw version uses 2- instead of 3-letter country codes) |
| `geography` | string | Geographic level: "country", "country-state", or "global" |
| `date_start` | date | Start of data collection period |
| `date_end` | date | End of data collection period |
| `platform_and_product` | string | "Claude AI (Free and Pro)" |
| `facet` | string | Analysis dimension (see Facets below) |
| `level` | integer | Sub-level within facet (0-2) |
| `variable` | string | Metric name (see Variables below) |
| `cluster_name` | string | Specific entity within facet (task, pattern, etc.). For intersections, format is "base::category" |
| `value` | float | Numeric metric value |

### Facets

**Geographic Facets:**
- **country**: Country-level aggregations
- **country-state**: Subnational region aggregations (ISO 3166-2 regions globally)

**Content Facets:**
- **onet_task**: O*NET occupational tasks
- **collaboration**: Human-AI collaboration patterns
- **request**: Request complexity levels (0=highest granularity, 1=middle granularity, 2=lowest granularity)
- **multitasking**: Whether conversation involves single or multiple tasks
- **human_only_ability**: Whether a human could complete the task without AI assistance
- **use_case**: Use case categories (work, coursework, personal)
- **task_success**: Whether the task was successfully completed

**Numeric Facets** (continuous variables with distribution statistics):
- **human_only_time**: Estimated time for a human to complete the task without AI
- **human_with_ai_time**: Estimated time for a human to complete the task with AI assistance
- **ai_autonomy**: Degree of AI autonomy in task completion
- **human_education_years**: Estimated years of human education required for the task
- **ai_education_years**: Estimated equivalent years of AI "education" demonstrated

**Intersection Facets:**
- **onet_task::collaboration**: Intersection of O*NET tasks and collaboration patterns
- **onet_task::multitasking**: Intersection of O*NET tasks and multitasking status
- **onet_task::human_only_ability**: Intersection of O*NET tasks and human-only ability
- **onet_task::use_case**: Intersection of O*NET tasks and use case categories
- **onet_task::task_success**: Intersection of O*NET tasks and task success
- **onet_task::human_only_time**: Mean human-only time per O*NET task
- **onet_task::human_with_ai_time**: Mean human-with-AI time per O*NET task
- **onet_task::ai_autonomy**: Mean AI autonomy per O*NET task
- **onet_task::human_education_years**: Mean human education years per O*NET task
- **onet_task::ai_education_years**: Mean AI education years per O*NET task
- **request::collaboration**: Intersection of request categories and collaboration patterns
- **request::multitasking**: Intersection of request categories and multitasking status
- **request::human_only_ability**: Intersection of request categories and human-only ability
- **request::use_case**: Intersection of request categories and use case categories
- **request::task_success**: Intersection of request categories and task success
- **request::human_only_time**: Mean human-only time per request category
- **request::human_with_ai_time**: Mean human-with-AI time per request category
- **request::ai_autonomy**: Mean AI autonomy per request category
- **request::human_education_years**: Mean human education years per request category
- **request::ai_education_years**: Mean AI education years per request category

### Core Variables

Variables follow the pattern `{prefix}_{suffix}` with specific meanings:

**From AEI raw file**: `*_count`, `*_pct`

#### Usage Metrics
- **usage_count**: Total number of conversations/interactions in a geography
- **usage_pct**: Percentage of total usage (relative to parent geography - global for countries, parent country for country-state regions)

#### Content Facet Metrics
**O*NET Task Metrics**:
- **onet_task_count**: Number of conversations using this specific O*NET task
- **onet_task_pct**: Percentage of geographic total using this task
- **onet_task_pct_index**: Specialization index comparing task usage to baseline (global for countries, parent country for country-state regions)
- **onet_task_collaboration_count**: Number of conversations with both this task and collaboration pattern (intersection)
- **onet_task_collaboration_pct**: Percentage of the base task's total that has this collaboration pattern (sums to 100% within each task)

#### Occupation Metrics
- **soc_pct**: Percentage of classified O*NET tasks associated with this SOC major occupation group (e.g., Management, Computer and Mathematical)

**Request Metrics**:
- **request_count**: Number of conversations in this request category level
- **request_pct**: Percentage of geographic total in this category
- **request_collaboration_count**: Number of conversations with both this request category and collaboration pattern (intersection)
- **request_collaboration_pct**: Percentage of the base request's total that has this collaboration pattern (sums to 100% within each request)

**Collaboration Pattern Metrics**:
- **collaboration_count**: Number of conversations with this collaboration pattern
- **collaboration_pct**: Percentage of geographic total with this pattern

**Multitasking Metrics**:
- **multitasking_count**: Number of conversations with this multitasking status
- **multitasking_pct**: Percentage of geographic total with this status

**Human-Only Ability Metrics**:
- **human_only_ability_count**: Number of conversations with this human-only ability status
- **human_only_ability_pct**: Percentage of geographic total with this status

**Use Case Metrics**:
- **use_case_count**: Number of conversations in this use case category
- **use_case_pct**: Percentage of geographic total in this category

**Task Success Metrics**:
- **task_success_count**: Number of conversations with this task success status
- **task_success_pct**: Percentage of geographic total with this status

#### Numeric Facet Metrics
For numeric facets (human_only_time, human_with_ai_time, ai_autonomy, human_education_years, ai_education_years), the following distribution statistics are available:

- **{facet}_mean**: Mean value across all conversations
- **{facet}_median**: Median value across all conversations
- **{facet}_stdev**: Standard deviation of values
- **{facet}_mean_ci_lower**: Lower bound of 95% confidence interval for the mean
- **{facet}_mean_ci_upper**: Upper bound of 95% confidence interval for the mean
- **{facet}_median_ci_lower**: Lower bound of 95% confidence interval for the median
- **{facet}_median_ci_upper**: Upper bound of 95% confidence interval for the median
- **{facet}_count**: Total number of observations for this facet
- **{facet}_histogram_count**: Count of observations in each histogram bin (one row per bin, bin range in cluster_name, e.g., "[1.0, 1.0)")
- **{facet}_histogram_pct**: Percentage of observations in each histogram bin (one row per bin)

For numeric intersection facets (e.g., onet_task::human_only_time), the same metrics are available per category (e.g., per O*NET task), with cluster_name containing the category identifier:
- **{base}_{numeric}_mean**: Mean value for this category
- **{base}_{numeric}_median**: Median value for this category
- **{base}_{numeric}_stdev**: Standard deviation for this category
- **{base}_{numeric}_count**: Number of observations for this category
- **{base}_{numeric}_mean_ci_lower/upper**: 95% CI bounds for the mean
- **{base}_{numeric}_median_ci_lower/upper**: 95% CI bounds for the median

#### Special Values
- **not_classified**: Indicates data that was filtered for privacy protection or could not be classified
- **none**: Indicates the absence of the attribute (e.g., no collaboration, no task selected)

### Data Processing Notes
- **Minimum Observations**: 200 conversations per country, 100 per country-state region (applied in enrichment step, not raw preprocessing)
- **not_classified**:
  - For regular facets: Captures filtered/unclassified conversations
  - For intersection facets: Each base cluster has its own not_classified (e.g., "task1::not_classified")
- **Intersection Percentages**: Calculated relative to base cluster totals, ensuring each base cluster's percentages sum to 100%
- **Country Codes**: ISO-3166-1 format for countries, three letter codes in the enriched file (e.g., "USA", "GBR", "FRA") and two letter codes in the raw file (e.g., "US", "GB", "FR"); ISO 3166-2 format for country-state regions (e.g., "AGO-LUA", "ALB-02" in enriched file, or "US-CA" in raw file)
- **Variable Definitions**: See Core Variables section above

## 1P API Usage Data

### Overview
Dataset containing first-party API usage metrics along various dimensions based on a sample of 1P API traffic and analyzed using privacy-preserving methods.

**Note**: Unlike Claude.ai data, API data has **no geographic breakdowns** (no country or country-state facets). All API metrics are reported at global level only (`geography: "global"`, `geo_id: "GLOBAL"`).

**Source file**: `aei_raw_1p_api_2026-02-05_to_2026-02-12.csv` 

### Data Schema
Each row represents one metric value for a specific facet combination at global level:

| Column | Type | Description |
|--------|------|-------------|
| `geo_id` | string | Geographic identifier (always "GLOBAL" for API data) |
| `geography` | string | Geographic level (always "global" for API data) |
| `date_start` | date | Start of data collection period |
| `date_end` | date | End of data collection period |
| `platform_and_product` | string | "1P API" |
| `facet` | string | Analysis dimension (see Facets below) |
| `level` | integer | Sub-level within facet (0-2) |
| `variable` | string | Metric name (see Variables below) |
| `cluster_name` | string | Specific entity within facet. For intersections, format is "base::category" or "base::index"/"base::count" for mean value metrics |
| `value` | float | Numeric metric value |

### Facets

**Content Facets:**
- **onet_task**: O*NET occupational tasks
- **collaboration**: Human-AI collaboration patterns
- **request**: Request categories (hierarchical levels 0-2 from bottom-up taxonomy)
- **multitasking**: Whether conversation involves single or multiple tasks
- **human_only_ability**: Whether a human could complete the task without AI assistance
- **use_case**: Use case categories (work, coursework, personal)
- **task_success**: Whether the task was successfully completed

**Numeric Facets** (continuous variables with distribution statistics):
- **human_only_time**: Estimated time for a human to complete the task without AI
- **human_with_ai_time**: Estimated time for a human to complete the task with AI assistance
- **ai_autonomy**: Degree of AI autonomy in task completion
- **human_education_years**: Estimated years of human education required for the task
- **ai_education_years**: Estimated equivalent years of AI "education" demonstrated

**Intersection Facets:**
- **onet_task::collaboration**: Intersection of O*NET tasks and collaboration patterns
- **onet_task::multitasking**: Intersection of O*NET tasks and multitasking status
- **onet_task::human_only_ability**: Intersection of O*NET tasks and human-only ability
- **onet_task::use_case**: Intersection of O*NET tasks and use case categories
- **onet_task::task_success**: Intersection of O*NET tasks and task success
- **onet_task::human_only_time**: Mean human-only time per O*NET task
- **onet_task::human_with_ai_time**: Mean human-with-AI time per O*NET task
- **onet_task::ai_autonomy**: Mean AI autonomy per O*NET task
- **onet_task::human_education_years**: Mean human education years per O*NET task
- **onet_task::ai_education_years**: Mean AI education years per O*NET task
- **onet_task::cost**: Mean cost per O*NET task (indexed, 1.0 = average)
- **onet_task::prompt_tokens**: Mean prompt tokens per O*NET task (indexed, 1.0 = average)
- **onet_task::completion_tokens**: Mean completion tokens per O*NET task (indexed, 1.0 = average)
- **request::collaboration**: Intersection of request categories and collaboration patterns
- **request::multitasking**: Intersection of request categories and multitasking status
- **request::human_only_ability**: Intersection of request categories and human-only ability
- **request::use_case**: Intersection of request categories and use case categories
- **request::task_success**: Intersection of request categories and task success
- **request::human_only_time**: Mean human-only time per request category
- **request::human_with_ai_time**: Mean human-with-AI time per request category
- **request::ai_autonomy**: Mean AI autonomy per request category
- **request::human_education_years**: Mean human education years per request category
- **request::ai_education_years**: Mean AI education years per request category
- **request::cost**: Mean cost per request category (indexed, 1.0 = average)
- **request::prompt_tokens**: Mean prompt tokens per request category (indexed, 1.0 = average)
- **request::completion_tokens**: Mean completion tokens per request category (indexed, 1.0 = average)

### Core Variables

#### Content Facet Metrics
**O*NET Task Metrics**:
- **onet_task_count**: Number of 1P API records using this specific O*NET task
- **onet_task_pct**: Percentage of total using this task

**Request Metrics**:
- **request_count**: Number of 1P API records in this request category
- **request_pct**: Percentage of total in this category

**Collaboration Pattern Metrics**:
- **collaboration_count**: Number of 1P API records with this collaboration pattern
- **collaboration_pct**: Percentage of total with this pattern

**Multitasking Metrics**:
- **multitasking_count**: Number of records with this multitasking status
- **multitasking_pct**: Percentage of total with this status

**Human-Only Ability Metrics**:
- **human_only_ability_count**: Number of records with this human-only ability status
- **human_only_ability_pct**: Percentage of total with this status

**Use Case Metrics**:
- **use_case_count**: Number of records in this use case category
- **use_case_pct**: Percentage of total in this category

**Task Success Metrics**:
- **task_success_count**: Number of records with this task success status
- **task_success_pct**: Percentage of total with this status

#### Numeric Facet Metrics
For numeric facets (human_only_time, human_with_ai_time, ai_autonomy, human_education_years, ai_education_years), the following distribution statistics are available:

- **{facet}_mean**: Mean value across all records
- **{facet}_median**: Median value across all records
- **{facet}_stdev**: Standard deviation of values
- **{facet}_mean_ci_lower**: Lower bound of 95% confidence interval for the mean
- **{facet}_mean_ci_upper**: Upper bound of 95% confidence interval for the mean
- **{facet}_median_ci_lower**: Lower bound of 95% confidence interval for the median
- **{facet}_median_ci_upper**: Upper bound of 95% confidence interval for the median
- **{facet}_count**: Total number of observations for this facet
- **{facet}_histogram_count**: Count of observations in each histogram bin (one row per bin)
- **{facet}_histogram_pct**: Percentage of observations in each histogram bin (one row per bin)

#### Indexed Facet Metrics (API-specific)
For indexed facets (cost_index, prompt_tokens_index, completion_tokens_index), values are normalized so that 1.0 represents the average:

- **{facet}_index**: Re-indexed mean value (1.0 = average across all categories)
- **{facet}_count**: Number of records for this metric

#### Intersection Metrics
For categorical intersections (e.g., onet_task::collaboration):
- **{base}_{secondary}_count**: Records with both this base category and secondary category
- **{base}_{secondary}_pct**: Percentage of the base category's total with this secondary category

For numeric intersections (e.g., onet_task::human_only_time):
- **{base}_{numeric}_mean**: Mean value for this category
- **{base}_{numeric}_median**: Median value for this category
- **{base}_{numeric}_stdev**: Standard deviation for this category
- **{base}_{numeric}_count**: Number of observations for this category
- **{base}_{numeric}_mean_ci_lower/upper**: 95% CI bounds for the mean
- **{base}_{numeric}_median_ci_lower/upper**: 95% CI bounds for the median

## External Data Sources

We use external data to enrich Claude usage data with external economic and demographic sources.

### ISO Country Codes

**ISO 3166 Country Codes**

International standard codes for representing countries and territories, used for mapping IP-based geolocation data to standardized country identifiers.

- **Standard**: ISO 3166-1
- **Source**: GeoNames geographical database
- **URL**: https://download.geonames.org/export/dump/countryInfo.txt
- **License**: Creative Commons Attribution 4.0 License (https://creativecommons.org/licenses/by/4.0/)
- **Download date**: September 2, 2025
- **Key fields**:
  - `iso_alpha_2`: Two-letter country code (e.g., "US", "GB", "FR")
  - `iso_alpha_3`: Three-letter country code (e.g., "USA", "GBR", "FRA")
  - `country_name`: Country name from GeoNames
- **Usage**: Maps IP-based country identification to standardized ISO codes for consistent geographic aggregation

### ISO Region Code Mapping

Region-level geographic data uses ISO 3166-2 standard subdivision codes. Some countries were excluded from region-level analysis due to mapping issues between source data codes and ISO 3166-2 standards. Country-level data remains available for all countries.