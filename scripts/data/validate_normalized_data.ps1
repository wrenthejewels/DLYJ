param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$ErrorActionPreference = 'Stop'

function Get-Headers {
    param([Parameter(Mandatory)] [string]$Path)
    return ((Get-Content -Path $Path -TotalCount 1) -split ',' | ForEach-Object { $_.Trim('"') })
}

function Assert-Headers {
    param(
        [Parameter(Mandatory)] [string]$Path,
        [Parameter(Mandatory)] [string[]]$Expected
    )

    $actual = Get-Headers -Path $Path
    if (($actual.Count -ne $Expected.Count) -or (Compare-Object -ReferenceObject $Expected -DifferenceObject $actual)) {
        throw "Header mismatch in $Path. Expected: $($Expected -join ', ') Actual: $($actual -join ', ')"
    }
}

function Assert-NoDuplicates {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Key,
        [Parameter(Mandatory)] [string]$Label
    )

    $dupes = $Rows | Group-Object -Property $Key | Where-Object { $_.Count -gt 1 }
    if ($dupes) {
        $keys = $dupes | ForEach-Object { $_.Name }
        throw "Duplicate $Label values found: $($keys -join ', ')"
    }
}

function Assert-ForeignKey {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Column,
        [Parameter(Mandatory)] [string[]]$Allowed,
        [Parameter(Mandatory)] [string]$Label
    )

    $missing = $Rows |
        ForEach-Object { $_.$Column } |
        Where-Object { $_ -and ($_ -notin $Allowed) } |
        Select-Object -Unique
    if ($missing) {
        throw "Invalid $Label references: $($missing -join ', ')"
    }
}

function Assert-PipeForeignKey {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Column,
        [Parameter(Mandatory)] [string[]]$Allowed,
        [Parameter(Mandatory)] [string]$Label
    )

    $missing = @()
    foreach ($row in $Rows) {
        $values = @()
        if ($row.$Column) {
            $values = ($row.$Column -split '\|') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        }
        foreach ($value in $values) {
            if ($value -notin $Allowed) {
                $missing += $value
            }
        }
    }

    $missing = $missing | Select-Object -Unique
    if ($missing) {
        throw "Invalid $Label references: $($missing -join ', ')"
    }
}

function Assert-ShareSums {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$GroupColumn,
        [Parameter(Mandatory)] [string]$ShareColumn,
        [double]$Target = 1.0,
        [double]$Tolerance = 0.02
    )

    $violations = @()
    foreach ($group in ($Rows | Group-Object -Property $GroupColumn)) {
        $sum = ($group.Group | Measure-Object -Property $ShareColumn -Sum).Sum
        if ([Math]::Abs([double]$sum - $Target) -gt $Tolerance) {
            $violations += ('{0}={1:N3}' -f $group.Name, [double]$sum)
        }
    }

    if ($violations.Count -gt 0) {
        throw "Share sums out of tolerance: $($violations -join '; ')"
    }
}

$normalizedDir = Join-Path $Root 'data\normalized'
$crosswalkDir = Join-Path $Root 'data\crosswalks'
$metadataDir = Join-Path $Root 'data\metadata'

$headerMap = @{
    'occupations.csv' = @('occupation_id','onet_soc_code','title','title_short','role_family','is_active','selection_priority','notes')
    'occupation_aliases.csv' = @('occupation_id','alias','alias_type','source','weight')
    'occupation_selector_index.csv' = @('occupation_id','title','role_family','search_blob','employment_us','median_wage_usd','projection_growth_pct','exposure_prior_score','adaptive_capacity_prior_score','selector_weight','coverage_tier')
    'occupation_tasks.csv' = @('occupation_id','onet_task_id','task_statement','task_type','importance','frequency','source_mix','notes')
    'job_description_task_evidence.csv' = @('occupation_id','evidence_id','employer_name','job_title','source_url','source_kind','task_statement','task_family_id','task_type','importance','frequency','review_status','source_confidence','notes')
    'occupation_task_inventory.csv' = @('occupation_id','task_id','onet_task_id','task_statement','task_family_id','task_type','time_share_prior','value_centrality','bargaining_power_weight','role_criticality','ai_support_observability','source_mix','source_confidence','notes')
    'occupation_role_variants.csv' = @('occupation_id','variant_id','variant_label','variant_summary','variant_order','is_default','task_ids','function_ids','preferred_task_families','preferred_function_ids','questionnaire_signature','source_mix','notes')
    'task_clusters.csv' = @('task_cluster_id','label','label_short','description','default_coupling_class','default_reviewability_class','default_human_advantage_class')
    'occupation_task_clusters.csv' = @('occupation_id','task_cluster_id','share_prior','importance_prior','evidence_confidence','source_mix','notes')
    'task_cluster_membership.csv' = @('occupation_id','onet_task_id','task_cluster_id','membership_weight','mapping_method','mapping_confidence','notes')
    'task_dependency_edges.csv' = @('occupation_id','from_task_id','to_task_id','dependency_type','dependency_strength','edge_source','edge_confidence','notes')
    'role_functions.csv' = @('occupation_id','function_id','function_category','role_summary','function_statement','function_weight','source_mix','source_confidence','notes')
    'occupation_function_map.csv' = @('occupation_id','function_id','function_type','function_weight','delegability_guardrail','source_mix','source_confidence','notes')
    'task_function_edges.csv' = @('occupation_id','task_id','function_id','edge_type','task_to_function_weight','accountability_weight','judgment_requirement','trust_requirement','regulatory_liability_weight','human_authority_requirement','source_mix','source_confidence','notes')
    'function_accountability_profiles.csv' = @('occupation_id','function_id','accountability_statement','primary_output','primary_stakeholder','judgment_requirement','trust_requirement','regulatory_liability_weight','human_authority_requirement','bargaining_power_retention','source_mix','source_confidence','notes')
    'occupation_role_explanations.csv' = @('occupation_id','title','role_transformation_type','function_anchor_count','primary_driver','secondary_driver','primary_counterweight','evidence_profile','confidence_band','review_priority','explanation_summary')
    'occupation_exposure_priors.csv' = @('occupation_id','source_id','exposure_score','augmentation_score','automation_score','adaptive_capacity_score','confidence','release_date','notes')
    'task_exposure_evidence.csv' = @('occupation_id','onet_task_id','task_cluster_id','source_id','exposure_score','augmentation_score','automation_score','observed_usage_share','evidence_type','confidence','notes')
    'task_source_evidence.csv' = @('occupation_id','task_id','source_id','source_role','exposure_score','augmentation_score','automation_score','evidence_weight','confidence','promotion_status','notes')
    'task_augmentation_automation_priors.csv' = @('occupation_id','task_cluster_id','exposure_score','augmentation_likelihood','partial_automation_likelihood','high_automation_likelihood','evidence_confidence','primary_sources','notes')
    'occupation_adaptation_priors.csv' = @('occupation_id','adaptive_capacity_score','transferability_score','learning_intensity_score','transition_option_count','job_zone','source_mix','confidence','notes')
    'occupation_source_priors.csv' = @('occupation_id','prior_key','source_id','source_role','prior_score','prior_type','confidence','promotion_status','notes')
    'occupation_benchmark_scores.csv' = @('occupation_id','aioe_score','aioe_percentile','lm_aioe_score','lm_aioe_percentile','webb_ai_score','webb_ai_percentile','webb_robot_score','webb_robot_percentile','webb_software_score','webb_software_percentile','sml_score','sml_percentile','gpts_dv_beta_score','gpts_dv_beta_percentile','gpts_human_beta_score','gpts_human_beta_percentile','benchmark_mean_percentile','source_id','confidence','notes')
    'occupation_benchmark_source_scores.csv' = @('occupation_id','benchmark_key','benchmark_label','benchmark_group','raw_score','percentile','source_id','release_date','notes')
    'task_benchmark_gpt4_labels.csv' = @('occupation_id','onet_task_id','gpt4_automation_label','gpt4_automation_score','human_automation_label','human_automation_score','source_id','notes')
    'ability_benchmark_scores.csv' = @('ability_name','aioe_ability_exposure_score','aioe_ability_exposure_percentile','source_id','notes')
    'occupation_quality_indicators.csv' = @('occupation_id','earnings_quality_proxy','labor_market_security_proxy','working_environment_quality_proxy','autonomy_proxy','learning_opportunity_proxy','social_interaction_intensity','time_pressure_proxy','quality_confidence','source_mix','notes')
    'occupation_labor_market_context.csv' = @('occupation_id','employment_us','annual_openings','median_wage_usd','wage_p25_usd','wage_p75_usd','projection_growth_pct','unemployment_group_id','unemployment_group_label','unemployment_series_id','latest_unemployment_rate','latest_unemployment_period','labor_market_confidence','release_year')
    'occupation_demand_adoption_context.csv' = @('occupation_id','demand_expansion_context','labor_demand_context','labor_tightness_context','ai_adoption_context','adoption_realization_context','labor_context_confidence','adoption_context_confidence','context_confidence','btos_covered_sector_share','source_mix','notes')
    'occupation_recomposition_context.csv' = @('occupation_id','workflow_compression_context','organizational_conversion_context','wave_acceleration_context','displacement_wave_bias','recomposition_context_confidence','source_mix','notes')
    'occupation_function_context.csv' = @('occupation_id','accountability_context','bargaining_power_context','fragmentation_context','accountability_context_confidence','bargaining_context_confidence','fragmentation_context_confidence','ors_guardrail_signal','expert_scarcity_signal','heterogeneity_fragmentation_signal','source_mix','notes')
    'occupation_heterogeneity_context.csv' = @('occupation_id','onet_soc_code','acs_reference_year','acs_release_label','acs_socp_code','acs_query_mode','sample_record_count','employed_record_count','weighted_worker_count','wage_record_count','median_wage_usd','wage_p25_usd','wage_p75_usd','wage_dispersion_ratio','wage_dispersion_percentile','education_dispersion','industry_dispersion','class_of_worker_dispersion','age_band_dispersion','sex_mix_balance','worker_mix_dispersion','heterogeneity_index','acs_confidence','source_mix','notes')
    'occupation_industry_mix.csv' = @('occupation_id','onet_soc_code','acs_reference_year','acs_release_label','acs_socp_code','acs_query_mode','acs_industry_code','industry_rank','industry_weighted_worker_count','industry_share','source_mix','notes')
    'occupation_btos_sector_mix.csv' = @('occupation_id','onet_soc_code','acs_reference_year','acs_release_label','acs_socp_code','acs_query_mode','btos_sector_code','btos_sector_label','sector_rank','sector_weighted_worker_count','sector_share','covered_sector_share','covered_sector_share_normalized','source_mix','notes')
    'industry_ai_adoption_context.csv' = @('btos_reference_date','btos_release_label','btos_sector_code','btos_sector_label','current_ai_use_share','current_ai_use_se','current_llm_use_share','current_llm_use_se','current_task_substitution_share_conditional','current_task_substitution_se','current_workflow_change_share_conditional','current_workflow_change_se','planned_ai_use_share','planned_ai_use_se','planned_llm_use_share','planned_llm_use_se','planned_task_substitution_share_conditional','planned_task_substitution_se','planned_workflow_change_share_conditional','planned_workflow_change_se','current_task_substitution_intensity','planned_task_substitution_intensity','workflow_change_intensity','adoption_context_index','btos_confidence','source_mix','notes')
    'occupation_unemployment_monthly.csv' = @('unemployment_group_id','unemployment_group_label','unemployment_series_id','year','month','period','month_label','unemployment_rate','is_missing','source_id','notes')
    'occupation_task_role_profiles.csv' = @('occupation_id','core_task_share','support_task_share','mean_value_centrality','mean_bargaining_power_weight','dependency_density','coverage_gap_flag','review_status','notes')
    'occupation_role_transformation.csv' = @('occupation_id','direct_task_pressure','indirect_dependency_pressure','function_exposure_pressure','retained_function_strength','retained_accountability_strength','retained_bargaining_power','role_fragmentation_risk','role_compressibility','demand_expansion_signal','delegation_likelihood','headcount_displacement_risk','role_transformation_type','confidence','source_mix','notes')
    'occupation_ors_structural_context.csv' = @('occupation_id','onet_soc_code','bls_occ_code','ors_reference_year','ors_reference_wave','interaction_intensity','external_interaction_intensity','internal_interaction_intensity','people_skill_intensity','speaking_intensity','autonomy_intensity','review_intensity','pause_control_share','self_paced_share','supervisor_present_share','supervising_others_share','pace_constraint_intensity','people_control_share','software_control_share','target_control_share','fast_pace_share','telework_ability_share','work_schedule_variability_share','human_constraint_index','ors_confidence','source_mix','notes')
    'occupation_structural_calibration_targets.csv' = @('occupation_id','title','human_constraint_target','human_constraint_confidence','adoption_context_target','adoption_context_confidence','demand_context_target','demand_context_confidence','wage_leverage_target','wage_leverage_confidence','routine_pressure_target','routine_pressure_confidence','recomposition_context_target','recomposition_context_confidence','wave_timing_target','wave_timing_confidence','specialization_resilience_target','specialization_resilience_confidence','role_heterogeneity_target','role_heterogeneity_confidence','model_human_guardrail','model_adoption_context','model_demand_context','model_wage_leverage','model_routine_pressure','model_recomposition_context','model_wave_timing','model_specialization_resilience','model_role_fragmentation','human_constraint_gap','adoption_context_gap','demand_context_gap','wage_leverage_gap','routine_pressure_gap','recomposition_context_gap','wave_timing_gap','specialization_resilience_gap','role_heterogeneity_gap','human_constraint_review','adoption_context_review','demand_context_review','wage_leverage_review','routine_pressure_review','recomposition_context_review','wave_timing_review','specialization_resilience_review','role_heterogeneity_review','quality_source_mix','ors_source_mix','heterogeneity_source_mix','btos_source_mix','adaptation_source_mix','labor_release_year','highest_review_tier','primary_review_layer','primary_review_strength','primary_review_score','primary_review_reason','notes')
    'occupation_role_shape_review.csv' = @('occupation_id','title','function_anchor_count','role_heterogeneity_target','role_heterogeneity_gap','role_heterogeneity_review','primary_review_layer','role_shape_candidate_score','role_shape_status','role_shape_reason','source_mix','notes')
    'occupation_transition_adjacency.csv' = @('from_occupation_id','to_occupation_id','adjacency_score','adjacency_type','source','confidence','notes')
    'crosswalk_onet_to_bls.csv' = @('onet_soc_code','bls_occ_code','title_onet','title_bls','match_type','confidence')
    'crosswalk_onet_to_isco.csv' = @('onet_soc_code','isco_code','title_onet','title_isco','match_type','confidence')
    'launch_occupation_seed.csv' = @('launch_rank','provisional_onet_soc_code','title','role_family','priority_band','rationale','data_readiness','status','notes')
    'ui_role_category_map.csv' = @('ui_role_key','ui_role_label','onet_soc_code','title','fit_rank','fit_type','notes')
    'role_family_function_defaults.csv' = @('role_family','function_category','role_summary','function_statement','accountability_statement','primary_output','primary_stakeholder','judgment_requirement','trust_requirement','regulatory_liability_weight','human_authority_requirement','bargaining_power_retention','source_mix','notes')
    'occupation_role_function_overrides.csv' = @('occupation_id','function_category','role_summary','function_statement','accountability_statement','primary_output','primary_stakeholder','judgment_requirement','trust_requirement','regulatory_liability_weight','human_authority_requirement','bargaining_power_retention','source_mix','notes')
    'occupation_secondary_function_overrides.csv' = @('occupation_id','function_key','function_category','role_summary','function_statement','accountability_statement','primary_output','primary_stakeholder','function_weight','judgment_requirement','trust_requirement','regulatory_liability_weight','human_authority_requirement','bargaining_power_retention','priority_task_families','source_mix','notes')
    'reviewed_task_exposure_overrides.csv' = @('occupation_id','task_id','exposure_score','augmentation_score','automation_score','confidence','notes')
    'job_description_seed_task_expansions.csv' = @('occupation_id','evidence_id','employer_name','job_title','source_url','source_kind','task_statement','task_family_id','task_type','importance','frequency','review_status','source_confidence','notes')
    'job_description_review_sources.csv' = @('occupation_id','source_ref','employer_name','job_title','source_url','source_kind','review_status','notes')
    'pilot_role_transformation_calibration.csv' = @('occupation_id','function_retention_bias','accountability_bias','bargaining_bias','direct_pressure_bias','delegation_bias','displacement_bias','benchmark_pressure_floor','notes')
}

foreach ($entry in $headerMap.GetEnumerator()) {
    $path = if ($entry.Key -like 'crosswalk_*') {
        Join-Path $crosswalkDir $entry.Key
    } elseif ($entry.Key -in @('launch_occupation_seed.csv','ui_role_category_map.csv','role_family_function_defaults.csv','occupation_role_function_overrides.csv','occupation_secondary_function_overrides.csv','reviewed_task_exposure_overrides.csv','job_description_seed_task_expansions.csv','job_description_review_sources.csv','pilot_role_transformation_calibration.csv')) {
        Join-Path $metadataDir $entry.Key
    } else {
        Join-Path $normalizedDir $entry.Key
    }

    if (!(Test-Path $path)) {
        throw "Missing required file: $path"
    }

    Assert-Headers -Path $path -Expected $entry.Value
}

$occupations = Import-Csv (Join-Path $normalizedDir 'occupations.csv')
$taskClusters = Import-Csv (Join-Path $normalizedDir 'task_clusters.csv')
$selector = Import-Csv (Join-Path $normalizedDir 'occupation_selector_index.csv')
$occupationTasks = Import-Csv (Join-Path $normalizedDir 'occupation_tasks.csv')
$jobDescriptionEvidence = Import-Csv (Join-Path $normalizedDir 'job_description_task_evidence.csv')
$occupationTaskInventory = Import-Csv (Join-Path $normalizedDir 'occupation_task_inventory.csv')
$roleVariants = Import-Csv (Join-Path $normalizedDir 'occupation_role_variants.csv')
$occTaskClusters = Import-Csv (Join-Path $normalizedDir 'occupation_task_clusters.csv')
$taskMembership = Import-Csv (Join-Path $normalizedDir 'task_cluster_membership.csv')
$taskDependencyEdges = Import-Csv (Join-Path $normalizedDir 'task_dependency_edges.csv')
$roleFunctions = Import-Csv (Join-Path $normalizedDir 'role_functions.csv')
$occupationFunctionMap = Import-Csv (Join-Path $normalizedDir 'occupation_function_map.csv')
$taskFunctionEdges = Import-Csv (Join-Path $normalizedDir 'task_function_edges.csv')
$functionProfiles = Import-Csv (Join-Path $normalizedDir 'function_accountability_profiles.csv')
$roleExplanations = Import-Csv (Join-Path $normalizedDir 'occupation_role_explanations.csv')
$exposurePriors = Import-Csv (Join-Path $normalizedDir 'occupation_exposure_priors.csv')
$taskEvidence = Import-Csv (Join-Path $normalizedDir 'task_exposure_evidence.csv')
$taskSourceEvidence = Import-Csv (Join-Path $normalizedDir 'task_source_evidence.csv')
$taskPriors = Import-Csv (Join-Path $normalizedDir 'task_augmentation_automation_priors.csv')
$adaptation = Import-Csv (Join-Path $normalizedDir 'occupation_adaptation_priors.csv')
$occupationSourcePriors = Import-Csv (Join-Path $normalizedDir 'occupation_source_priors.csv')
$benchmarks = Import-Csv (Join-Path $normalizedDir 'occupation_benchmark_scores.csv')
$benchmarkSources = Import-Csv (Join-Path $normalizedDir 'occupation_benchmark_source_scores.csv')
$taskBenchmarks = Import-Csv (Join-Path $normalizedDir 'task_benchmark_gpt4_labels.csv')
$abilityBenchmarks = Import-Csv (Join-Path $normalizedDir 'ability_benchmark_scores.csv')
$quality = Import-Csv (Join-Path $normalizedDir 'occupation_quality_indicators.csv')
$labor = Import-Csv (Join-Path $normalizedDir 'occupation_labor_market_context.csv')
$demandAdoptionContext = Import-Csv (Join-Path $normalizedDir 'occupation_demand_adoption_context.csv')
$recompositionContext = Import-Csv (Join-Path $normalizedDir 'occupation_recomposition_context.csv')
$functionContext = Import-Csv (Join-Path $normalizedDir 'occupation_function_context.csv')
$heterogeneity = Import-Csv (Join-Path $normalizedDir 'occupation_heterogeneity_context.csv')
$industryMix = Import-Csv (Join-Path $normalizedDir 'occupation_industry_mix.csv')
$btosSectorMix = Import-Csv (Join-Path $normalizedDir 'occupation_btos_sector_mix.csv')
$btosAdoption = Import-Csv (Join-Path $normalizedDir 'industry_ai_adoption_context.csv')
$taskRoleProfiles = Import-Csv (Join-Path $normalizedDir 'occupation_task_role_profiles.csv')
$roleTransformation = Import-Csv (Join-Path $normalizedDir 'occupation_role_transformation.csv')
$roleShapeReview = Import-Csv (Join-Path $normalizedDir 'occupation_role_shape_review.csv')
$transitions = Import-Csv (Join-Path $normalizedDir 'occupation_transition_adjacency.csv')
$launchSeed = Import-Csv (Join-Path $metadataDir 'launch_occupation_seed.csv')
$secondaryFunctions = Import-Csv (Join-Path $metadataDir 'occupation_secondary_function_overrides.csv')
$reviewedTaskOverrides = Import-Csv (Join-Path $metadataDir 'reviewed_task_exposure_overrides.csv')
$sourceIds = Select-String -Path (Join-Path $metadataDir 'source_registry.yaml') -Pattern '^\s*- source_id:\s*(.+)$' |
    ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() }
$secondaryFunctionKeys = $secondaryFunctions | ForEach-Object {
    [PSCustomObject]@{ composite_key = "$($_.occupation_id)|$($_.function_key)" }
}
$roleVariantKeys = $roleVariants | ForEach-Object {
    [PSCustomObject]@{ composite_key = "$($_.occupation_id)|$($_.variant_id)" }
}
$industryMixKeys = $industryMix | ForEach-Object {
    [PSCustomObject]@{ composite_key = "$($_.occupation_id)|$($_.acs_industry_code)" }
}
$btosSectorMixKeys = $btosSectorMix | ForEach-Object {
    [PSCustomObject]@{ composite_key = "$($_.occupation_id)|$($_.btos_sector_code)" }
}

$occupationIds = $occupations | Select-Object -ExpandProperty occupation_id
$taskClusterIds = $taskClusters | Select-Object -ExpandProperty task_cluster_id

Assert-NoDuplicates -Rows $occupations -Key 'occupation_id' -Label 'occupation_id'
Assert-NoDuplicates -Rows $taskClusters -Key 'task_cluster_id' -Label 'task_cluster_id'
Assert-NoDuplicates -Rows $selector -Key 'occupation_id' -Label 'selector occupation_id'
Assert-NoDuplicates -Rows $jobDescriptionEvidence -Key 'evidence_id' -Label 'job description evidence_id'
Assert-NoDuplicates -Rows $occupationTaskInventory -Key 'task_id' -Label 'task inventory task_id'
Assert-NoDuplicates -Rows $roleVariantKeys -Key 'composite_key' -Label 'role variant occupation/variant'
Assert-NoDuplicates -Rows $roleFunctions -Key 'function_id' -Label 'role function function_id'
Assert-NoDuplicates -Rows $functionProfiles -Key 'function_id' -Label 'function profile function_id'
Assert-NoDuplicates -Rows $roleExplanations -Key 'occupation_id' -Label 'role explanations occupation_id'
Assert-NoDuplicates -Rows $labor -Key 'occupation_id' -Label 'labor occupation_id'
Assert-NoDuplicates -Rows $demandAdoptionContext -Key 'occupation_id' -Label 'demand/adoption context occupation_id'
Assert-NoDuplicates -Rows $recompositionContext -Key 'occupation_id' -Label 'recomposition context occupation_id'
Assert-NoDuplicates -Rows $functionContext -Key 'occupation_id' -Label 'function context occupation_id'
Assert-NoDuplicates -Rows $heterogeneity -Key 'occupation_id' -Label 'heterogeneity occupation_id'
Assert-NoDuplicates -Rows $industryMixKeys -Key 'composite_key' -Label 'occupation industry mix occupation/industry'
Assert-NoDuplicates -Rows $btosSectorMixKeys -Key 'composite_key' -Label 'occupation BTOS sector mix occupation/sector'
Assert-NoDuplicates -Rows $btosAdoption -Key 'btos_sector_code' -Label 'BTOS adoption sector code'
Assert-NoDuplicates -Rows $taskRoleProfiles -Key 'occupation_id' -Label 'task role profile occupation_id'
Assert-NoDuplicates -Rows $roleTransformation -Key 'occupation_id' -Label 'role transformation occupation_id'
Assert-NoDuplicates -Rows $roleShapeReview -Key 'occupation_id' -Label 'role shape review occupation_id'
Assert-NoDuplicates -Rows $launchSeed -Key 'launch_rank' -Label 'launch_rank'
Assert-NoDuplicates -Rows $secondaryFunctionKeys -Key 'composite_key' -Label 'secondary function occupation/function'
Assert-NoDuplicates -Rows $reviewedTaskOverrides -Key 'task_id' -Label 'reviewed task override task_id'

Assert-ForeignKey -Rows $selector -Column 'occupation_id' -Allowed $occupationIds -Label 'selector occupation_id'
Assert-ForeignKey -Rows $occupationTasks -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation tasks occupation_id'
Assert-ForeignKey -Rows $jobDescriptionEvidence -Column 'occupation_id' -Allowed $occupationIds -Label 'job description occupation_id'
Assert-ForeignKey -Rows $jobDescriptionEvidence -Column 'task_family_id' -Allowed $taskClusterIds -Label 'job description task_family_id'
Assert-ForeignKey -Rows $occupationTaskInventory -Column 'occupation_id' -Allowed $occupationIds -Label 'task inventory occupation_id'
Assert-ForeignKey -Rows $occupationTaskInventory -Column 'task_family_id' -Allowed $taskClusterIds -Label 'task inventory task_family_id'
Assert-ForeignKey -Rows $roleVariants -Column 'occupation_id' -Allowed $occupationIds -Label 'role variants occupation_id'
Assert-PipeForeignKey -Rows $roleVariants -Column 'task_ids' -Allowed ($occupationTaskInventory | Select-Object -ExpandProperty task_id) -Label 'role variants task_ids'
Assert-PipeForeignKey -Rows $roleVariants -Column 'function_ids' -Allowed ($roleFunctions | Select-Object -ExpandProperty function_id) -Label 'role variants function_ids'
Assert-PipeForeignKey -Rows $roleVariants -Column 'preferred_task_families' -Allowed $taskClusterIds -Label 'role variants preferred_task_families'
Assert-PipeForeignKey -Rows $roleVariants -Column 'preferred_function_ids' -Allowed ($roleFunctions | Select-Object -ExpandProperty function_id) -Label 'role variants preferred_function_ids'
Assert-ForeignKey -Rows $occTaskClusters -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation task cluster occupation_id'
Assert-ForeignKey -Rows $occTaskClusters -Column 'task_cluster_id' -Allowed $taskClusterIds -Label 'occupation task cluster task_cluster_id'
Assert-ForeignKey -Rows $taskMembership -Column 'occupation_id' -Allowed $occupationIds -Label 'task membership occupation_id'
Assert-ForeignKey -Rows $taskMembership -Column 'task_cluster_id' -Allowed $taskClusterIds -Label 'task membership task_cluster_id'
Assert-ForeignKey -Rows $taskDependencyEdges -Column 'occupation_id' -Allowed $occupationIds -Label 'task dependency occupation_id'
Assert-ForeignKey -Rows $taskDependencyEdges -Column 'edge_source' -Allowed $sourceIds -Label 'task dependency edge_source'
Assert-ForeignKey -Rows $roleFunctions -Column 'occupation_id' -Allowed $occupationIds -Label 'role function occupation_id'
Assert-ForeignKey -Rows $occupationFunctionMap -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation function map occupation_id'
Assert-ForeignKey -Rows $functionProfiles -Column 'occupation_id' -Allowed $occupationIds -Label 'function profile occupation_id'
Assert-ForeignKey -Rows $roleExplanations -Column 'occupation_id' -Allowed $occupationIds -Label 'role explanations occupation_id'
Assert-ForeignKey -Rows $roleShapeReview -Column 'occupation_id' -Allowed $occupationIds -Label 'role shape review occupation_id'
Assert-ForeignKey -Rows $taskFunctionEdges -Column 'occupation_id' -Allowed $occupationIds -Label 'task function edge occupation_id'
Assert-ForeignKey -Rows $demandAdoptionContext -Column 'occupation_id' -Allowed $occupationIds -Label 'demand/adoption context occupation_id'
Assert-ForeignKey -Rows $recompositionContext -Column 'occupation_id' -Allowed $occupationIds -Label 'recomposition context occupation_id'
Assert-ForeignKey -Rows $btosSectorMix -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation BTOS sector mix occupation_id'
Assert-ForeignKey -Rows $exposurePriors -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation exposure occupation_id'
Assert-ForeignKey -Rows $exposurePriors -Column 'source_id' -Allowed $sourceIds -Label 'occupation exposure source_id'
Assert-ForeignKey -Rows $taskEvidence -Column 'occupation_id' -Allowed $occupationIds -Label 'task evidence occupation_id'
Assert-ForeignKey -Rows $taskEvidence -Column 'task_cluster_id' -Allowed $taskClusterIds -Label 'task evidence task_cluster_id'
Assert-ForeignKey -Rows $taskEvidence -Column 'source_id' -Allowed $sourceIds -Label 'task evidence source_id'
Assert-ForeignKey -Rows $taskSourceEvidence -Column 'occupation_id' -Allowed $occupationIds -Label 'task source evidence occupation_id'
Assert-ForeignKey -Rows $taskSourceEvidence -Column 'source_id' -Allowed $sourceIds -Label 'task source evidence source_id'
Assert-ForeignKey -Rows $taskPriors -Column 'occupation_id' -Allowed $occupationIds -Label 'task priors occupation_id'
Assert-ForeignKey -Rows $taskPriors -Column 'task_cluster_id' -Allowed $taskClusterIds -Label 'task priors task_cluster_id'
Assert-ForeignKey -Rows $adaptation -Column 'occupation_id' -Allowed $occupationIds -Label 'adaptation occupation_id'
Assert-ForeignKey -Rows $occupationSourcePriors -Column 'occupation_id' -Allowed $occupationIds -Label 'occupation source priors occupation_id'
Assert-ForeignKey -Rows $occupationSourcePriors -Column 'source_id' -Allowed $sourceIds -Label 'occupation source priors source_id'
Assert-ForeignKey -Rows $benchmarks -Column 'occupation_id' -Allowed $occupationIds -Label 'benchmark occupation_id'
Assert-ForeignKey -Rows $benchmarks -Column 'source_id' -Allowed $sourceIds -Label 'benchmark source_id'
Assert-ForeignKey -Rows $benchmarkSources -Column 'occupation_id' -Allowed $occupationIds -Label 'benchmark source occupation_id'
Assert-ForeignKey -Rows $benchmarkSources -Column 'source_id' -Allowed $sourceIds -Label 'benchmark source source_id'
Assert-ForeignKey -Rows $taskBenchmarks -Column 'occupation_id' -Allowed $occupationIds -Label 'task benchmark occupation_id'
Assert-ForeignKey -Rows $taskBenchmarks -Column 'source_id' -Allowed $sourceIds -Label 'task benchmark source_id'
Assert-ForeignKey -Rows $abilityBenchmarks -Column 'source_id' -Allowed $sourceIds -Label 'ability benchmark source_id'
Assert-ForeignKey -Rows $quality -Column 'occupation_id' -Allowed $occupationIds -Label 'quality occupation_id'
Assert-ForeignKey -Rows $labor -Column 'occupation_id' -Allowed $occupationIds -Label 'labor occupation_id'
Assert-ForeignKey -Rows $functionContext -Column 'occupation_id' -Allowed $occupationIds -Label 'function context occupation_id'
Assert-ForeignKey -Rows $heterogeneity -Column 'occupation_id' -Allowed $occupationIds -Label 'heterogeneity occupation_id'
Assert-ForeignKey -Rows $industryMix -Column 'occupation_id' -Allowed $occupationIds -Label 'industry mix occupation_id'
Assert-ForeignKey -Rows $taskRoleProfiles -Column 'occupation_id' -Allowed $occupationIds -Label 'task role profile occupation_id'
Assert-ForeignKey -Rows $roleTransformation -Column 'occupation_id' -Allowed $occupationIds -Label 'role transformation occupation_id'
Assert-ForeignKey -Rows $transitions -Column 'from_occupation_id' -Allowed $occupationIds -Label 'transition from_occupation_id'
Assert-ForeignKey -Rows $transitions -Column 'to_occupation_id' -Allowed $occupationIds -Label 'transition to_occupation_id'
Assert-ForeignKey -Rows $secondaryFunctions -Column 'occupation_id' -Allowed $occupationIds -Label 'secondary function occupation_id'
Assert-ForeignKey -Rows $reviewedTaskOverrides -Column 'occupation_id' -Allowed $occupationIds -Label 'reviewed task override occupation_id'

Assert-ShareSums -Rows $occTaskClusters -GroupColumn 'occupation_id' -ShareColumn 'share_prior'
if ($occupationTaskInventory.Count -gt 0) {
    Assert-ShareSums -Rows $occupationTaskInventory -GroupColumn 'occupation_id' -ShareColumn 'time_share_prior'
}
if ($industryMix.Count -gt 0) {
    Assert-ShareSums -Rows $industryMix -GroupColumn 'occupation_id' -ShareColumn 'industry_share'
}

$taskInventoryIds = $occupationTaskInventory | Select-Object -ExpandProperty task_id
Assert-ForeignKey -Rows $taskDependencyEdges -Column 'from_task_id' -Allowed $taskInventoryIds -Label 'task dependency from_task_id'
Assert-ForeignKey -Rows $taskDependencyEdges -Column 'to_task_id' -Allowed $taskInventoryIds -Label 'task dependency to_task_id'
Assert-ForeignKey -Rows $reviewedTaskOverrides -Column 'task_id' -Allowed $taskInventoryIds -Label 'reviewed task override task_id'
Assert-ForeignKey -Rows $taskSourceEvidence -Column 'task_id' -Allowed $taskInventoryIds -Label 'task source evidence task_id'
Assert-ForeignKey -Rows $taskFunctionEdges -Column 'task_id' -Allowed $taskInventoryIds -Label 'task function edges task_id'

$functionIds = $roleFunctions | Select-Object -ExpandProperty function_id
Assert-ForeignKey -Rows $occupationFunctionMap -Column 'function_id' -Allowed $functionIds -Label 'occupation function map function_id'
Assert-ForeignKey -Rows $functionProfiles -Column 'function_id' -Allowed $functionIds -Label 'function profile function_id'
Assert-ForeignKey -Rows $taskFunctionEdges -Column 'function_id' -Allowed $functionIds -Label 'task function edges function_id'

$coreCount = ($launchSeed | Where-Object { $_.status -eq 'selected' }).Count
$stretchCount = ($launchSeed | Where-Object { $_.status -eq 'candidate' }).Count

[PSCustomObject]@{
    occupations = $occupations.Count
    occupation_tasks = $occupationTasks.Count
    job_description_task_evidence = $jobDescriptionEvidence.Count
    task_clusters = $taskClusters.Count
    role_functions = $roleFunctions.Count
    task_source_evidence = $taskSourceEvidence.Count
    role_transformation_rows = $roleTransformation.Count
    sources = $sourceIds.Count
    selected_launch_occupations = $coreCount
    stretch_launch_occupations = $stretchCount
    validation = 'ok'
} | Format-List
