param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$OutputDir,
    [switch]$PassThru
)

$ErrorActionPreference = 'Stop'

if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

function Clamp([double]$Value, [double]$Min, [double]$Max) {
    return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

function Format-Decimal {
    param(
        [double]$Value,
        [int]$Digits = 4
    )

    return $Value.ToString("F$Digits", [System.Globalization.CultureInfo]::InvariantCulture)
}

function Get-SourceRole([string]$SourceId) {
    if ($SourceId -like 'src_anthropic_ei_*') { return 'live_task_evidence' }
    if ($SourceId -eq 'src_internal_stub_2026_03') { return 'fallback_task_proxy' }
    if ($SourceId -eq 'src_openai_gpts_are_gpts_2023') { return 'benchmark_task_label' }
    if ($SourceId -eq 'src_reviewed_task_scoring_2026_03') { return 'reviewed_task_estimate' }
    if ($SourceId -eq 'src_v2_cluster_prior_proxy_2026_03') { return 'cluster_prior_proxy' }
    if ($SourceId -eq 'src_v2_launch_aggregate_2026_03') { return 'live_task_aggregate' }
    return 'supporting_evidence'
}

function Get-PromotionStatus([string]$SourceRole) {
    switch ($SourceRole) {
        'live_task_evidence' { return 'active_live' }
        'live_task_aggregate' { return 'active_live' }
        'reviewed_task_estimate' { return 'active_supporting' }
        'benchmark_task_label' { return 'active_supporting' }
        'cluster_prior_proxy' { return 'active_supporting' }
        'fallback_task_proxy' { return 'fallback_only' }
        default { return 'benchmark_only' }
    }
}

function Get-EvidenceWeight([string]$SourceRole, [bool]$HasTaskLevelEvidence = $false) {
    switch ($SourceRole) {
        'live_task_evidence' { return 1.00 }
        'reviewed_task_estimate' { return 0.68 }
        'benchmark_task_label' { return 0.72 }
        'cluster_prior_proxy' { return $(if ($HasTaskLevelEvidence) { 0.18 } else { 0.46 }) }
        'fallback_task_proxy' { return $(if ($HasTaskLevelEvidence) { 0.12 } else { 0.28 }) }
        'live_task_aggregate' { return 0.90 }
        default { return 0.50 }
    }
}

function Get-AnthropicReleasePriority([string]$SourceId) {
    if ($SourceId -eq 'src_anthropic_ei_2026_03_24') { return 3 }
    if ($SourceId -eq 'src_anthropic_ei_2026_01_15') { return 2 }
    if ($SourceId -eq 'src_anthropic_ei_2025_03_27') { return 1 }
    return 0
}

$inventory = Import-Csv (Join-Path $OutputDir 'occupation_task_inventory.csv')
$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$taskEvidence = Import-Csv (Join-Path $OutputDir 'task_exposure_evidence.csv')
$taskPriors = Import-Csv (Join-Path $OutputDir 'task_augmentation_automation_priors.csv')
$taskBenchmarks = Import-Csv (Join-Path $OutputDir 'task_benchmark_gpt4_labels.csv')
$occupationPriors = Import-Csv (Join-Path $OutputDir 'occupation_exposure_priors.csv')
$benchmarkSources = Import-Csv (Join-Path $OutputDir 'occupation_benchmark_source_scores.csv')
$benchmarkScores = Import-Csv (Join-Path $OutputDir 'occupation_benchmark_scores.csv')
$reviewedTaskOverridesPath = Join-Path $Root 'data\metadata\reviewed_task_exposure_overrides.csv'
$reviewedTaskOverrides = if (Test-Path $reviewedTaskOverridesPath) { Import-Csv $reviewedTaskOverridesPath } else { @() }
$occupationIds = @($occupations | Select-Object -ExpandProperty occupation_id)

$taskEvidenceByKey = @{}
foreach ($row in $taskEvidence) {
    $key = "$($row.occupation_id)|$($row.onet_task_id)"
    if (-not $taskEvidenceByKey.ContainsKey($key)) {
        $taskEvidenceByKey[$key] = New-Object System.Collections.Generic.List[object]
    }
    $taskEvidenceByKey[$key].Add($row)
}

foreach ($key in @($taskEvidenceByKey.Keys)) {
    $rows = @($taskEvidenceByKey[$key].ToArray())
    $liveRows = @($rows | Where-Object { (Get-SourceRole -SourceId $_.source_id) -eq 'live_task_evidence' })
    if ($liveRows.Count -gt 1) {
        $latestPriority = ($liveRows | ForEach-Object { Get-AnthropicReleasePriority -SourceId $_.source_id } | Measure-Object -Maximum).Maximum
        $rows = @($rows | Where-Object {
            $role = Get-SourceRole -SourceId $_.source_id
            if ($role -ne 'live_task_evidence') { return $true }
            return (Get-AnthropicReleasePriority -SourceId $_.source_id) -eq $latestPriority
        })
        $taskEvidenceByKey[$key] = New-Object System.Collections.Generic.List[object]
        foreach ($row in $rows) {
            $taskEvidenceByKey[$key].Add($row)
        }
    }
}

$taskBenchmarkByKey = @{}
foreach ($row in $taskBenchmarks) {
    $taskBenchmarkByKey["$($row.occupation_id)|$($row.onet_task_id)"] = $row
}

$taskPriorByKey = @{}
foreach ($row in $taskPriors) {
    $taskPriorByKey["$($row.occupation_id)|$($row.task_cluster_id)"] = $row
}

$reviewedOverridesByTaskId = @{}
foreach ($row in $reviewedTaskOverrides) {
    $reviewedOverridesByTaskId[$row.task_id] = $row
}

$taskSourceRows = New-Object System.Collections.Generic.List[object]
foreach ($task in $inventory) {
    $taskKey = "$($task.occupation_id)|$($task.onet_task_id)"
    $hasDirectTaskEvidence = $false
    $hasBenchmarkTaskLabel = $taskBenchmarkByKey.ContainsKey($taskKey)
    $hasReviewedTaskEstimate = $reviewedOverridesByTaskId.ContainsKey($task.task_id)

    if ($taskEvidenceByKey.ContainsKey($taskKey)) {
        foreach ($evidence in $taskEvidenceByKey[$taskKey]) {
            $sourceRole = Get-SourceRole -SourceId $evidence.source_id
            if ($sourceRole -eq 'live_task_evidence') {
                $hasDirectTaskEvidence = $true
            }
            $taskSourceRows.Add([PSCustomObject]@{
                occupation_id = $task.occupation_id
                task_id = $task.task_id
                source_id = $evidence.source_id
                source_role = $sourceRole
                exposure_score = Format-Decimal -Value ([double]$evidence.exposure_score) -Digits 4
                augmentation_score = Format-Decimal -Value ([double]$evidence.augmentation_score) -Digits 4
                automation_score = Format-Decimal -Value ([double]$evidence.automation_score) -Digits 4
                evidence_weight = Format-Decimal -Value (Get-EvidenceWeight -SourceRole $sourceRole -HasTaskLevelEvidence $hasBenchmarkTaskLabel) -Digits 4
                confidence = Format-Decimal -Value ([double]$evidence.confidence) -Digits 4
                promotion_status = Get-PromotionStatus -SourceRole $sourceRole
                notes = "task_match|evidence_type=$($evidence.evidence_type)"
            })
        }
    }

    if ($hasReviewedTaskEstimate) {
        $reviewed = $reviewedOverridesByTaskId[$task.task_id]
        $taskSourceRows.Add([PSCustomObject]@{
            occupation_id = $task.occupation_id
            task_id = $task.task_id
            source_id = 'src_reviewed_task_scoring_2026_03'
            source_role = 'reviewed_task_estimate'
            exposure_score = Format-Decimal -Value ([double]$reviewed.exposure_score) -Digits 4
            augmentation_score = Format-Decimal -Value ([double]$reviewed.augmentation_score) -Digits 4
            automation_score = Format-Decimal -Value ([double]$reviewed.automation_score) -Digits 4
            evidence_weight = Format-Decimal -Value (Get-EvidenceWeight -SourceRole 'reviewed_task_estimate' -HasTaskLevelEvidence $hasDirectTaskEvidence) -Digits 4
            confidence = Format-Decimal -Value ([double]$reviewed.confidence) -Digits 4
            promotion_status = Get-PromotionStatus -SourceRole 'reviewed_task_estimate'
            notes = "reviewed_task_override|$($reviewed.notes)"
        })
    }

    if ($taskBenchmarkByKey.ContainsKey($taskKey)) {
        $benchmark = $taskBenchmarkByKey[$taskKey]
        $gptNorm = if ($benchmark.gpt4_automation_score -ne '') { [double]$benchmark.gpt4_automation_score / 4.0 } else { 0.0 }
        $humanNorm = if ($benchmark.human_automation_score -ne '') { [double]$benchmark.human_automation_score / 4.0 } else { $gptNorm }
        $automation = Clamp ((0.70 * $gptNorm) + (0.30 * $humanNorm)) 0.0 1.0
        $exposure = Clamp (([Math]::Max($gptNorm, $humanNorm)) * 0.95) 0.0 1.0
        $augmentation = Clamp (0.20 + ($exposure * 0.30) + ((1 - $automation) * 0.20)) 0.05 0.95
        $confidence = if ($benchmark.human_automation_score -ne '') { 0.68 } else { 0.60 }

        $taskSourceRows.Add([PSCustomObject]@{
            occupation_id = $task.occupation_id
            task_id = $task.task_id
            source_id = 'src_openai_gpts_are_gpts_2023'
            source_role = 'benchmark_task_label'
            exposure_score = Format-Decimal -Value $exposure -Digits 4
            augmentation_score = Format-Decimal -Value $augmentation -Digits 4
            automation_score = Format-Decimal -Value $automation -Digits 4
            evidence_weight = Format-Decimal -Value (Get-EvidenceWeight -SourceRole 'benchmark_task_label' -HasTaskLevelEvidence ($hasDirectTaskEvidence -or $hasReviewedTaskEstimate)) -Digits 4
            confidence = Format-Decimal -Value $confidence -Digits 4
            promotion_status = Get-PromotionStatus -SourceRole 'benchmark_task_label'
            notes = 'task_match|benchmark_task_label'
        })
    }

    $priorKey = "$($task.occupation_id)|$($task.task_family_id)"
    if ($taskPriorByKey.ContainsKey($priorKey)) {
        $prior = $taskPriorByKey[$priorKey]
        $proxyAutomation = ([double]$prior.partial_automation_likelihood * 0.65) + ([double]$prior.high_automation_likelihood * 0.35)
        $proxyBackstopped = $hasDirectTaskEvidence -or $hasBenchmarkTaskLabel -or $hasReviewedTaskEstimate
        $proxyConfidence = Clamp (([double]$prior.evidence_confidence * $(if ($proxyBackstopped) { 0.68 } else { 0.92 }))) 0.15 0.95
        $taskSourceRows.Add([PSCustomObject]@{
            occupation_id = $task.occupation_id
            task_id = $task.task_id
            source_id = 'src_v2_cluster_prior_proxy_2026_03'
            source_role = 'cluster_prior_proxy'
            exposure_score = Format-Decimal -Value ([double]$prior.exposure_score) -Digits 4
            augmentation_score = Format-Decimal -Value ([double]$prior.augmentation_likelihood) -Digits 4
            automation_score = Format-Decimal -Value $proxyAutomation -Digits 4
            evidence_weight = Format-Decimal -Value (Get-EvidenceWeight -SourceRole 'cluster_prior_proxy' -HasTaskLevelEvidence $proxyBackstopped) -Digits 4
            confidence = Format-Decimal -Value $proxyConfidence -Digits 4
            promotion_status = if ($proxyBackstopped) { 'backstop_only' } else { (Get-PromotionStatus -SourceRole 'cluster_prior_proxy') }
            notes = if ($proxyBackstopped) { 'cluster_proxy|mapped_from_task_family|proxy_backstopped_by_task_evidence' } else { 'cluster_proxy|mapped_from_task_family' }
        })
    }
}

$occupationSourceRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $occupationPriors | Where-Object { $_.occupation_id -in $occupationIds }) {
    $liveRole = Get-SourceRole -SourceId $row.source_id
    foreach ($metric in @(
        @{ key = 'live_exposure'; score = [double]$row.exposure_score; type = 'live_exposure' },
        @{ key = 'live_augmentation'; score = [double]$row.augmentation_score; type = 'live_augmentation' },
        @{ key = 'live_automation'; score = [double]$row.automation_score; type = 'live_automation' },
        @{ key = 'live_adaptive_capacity'; score = [double]$row.adaptive_capacity_score; type = 'adaptation_support' }
    )) {
        $occupationSourceRows.Add([PSCustomObject]@{
            occupation_id = $row.occupation_id
            prior_key = $metric.key
            source_id = $row.source_id
            source_role = $liveRole
            prior_score = Format-Decimal -Value $metric.score -Digits 4
            prior_type = $metric.type
            confidence = Format-Decimal -Value ([double]$row.confidence) -Digits 4
            promotion_status = Get-PromotionStatus -SourceRole $liveRole
            notes = $row.notes
        })
    }
}

foreach ($row in $benchmarkSources | Where-Object { $_.occupation_id -in $occupationIds }) {
    $occupationSourceRows.Add([PSCustomObject]@{
        occupation_id = $row.occupation_id
        prior_key = $row.benchmark_key
        source_id = $row.source_id
        source_role = 'benchmark_occupation_prior'
        prior_score = Format-Decimal -Value ([double]$row.percentile) -Digits 4
        prior_type = 'benchmark_percentile'
        confidence = Format-Decimal -Value 0.6500 -Digits 4
        promotion_status = 'benchmark_only'
        notes = "raw_score=$($row.raw_score)|group=$($row.benchmark_group)"
    })
}

foreach ($row in $benchmarkScores | Where-Object { $_.occupation_id -in $occupationIds }) {
    $confidence = if ($row.confidence) { [double]$row.confidence } else { 0.50 }
    $occupationSourceRows.Add([PSCustomObject]@{
        occupation_id = $row.occupation_id
        prior_key = 'benchmark_mean_percentile'
        source_id = 'src_benchmark_bundle_2026_03'
        source_role = 'benchmark_bundle'
        prior_score = Format-Decimal -Value ([double]$row.benchmark_mean_percentile) -Digits 4
        prior_type = 'benchmark_bundle'
        confidence = Format-Decimal -Value $confidence -Digits 4
        promotion_status = 'benchmark_only'
        notes = $row.notes
    })
}

$taskSourceRows |
    Sort-Object occupation_id, task_id, source_id |
    Export-Csv -Path (Join-Path $OutputDir 'task_source_evidence.csv') -NoTypeInformation -Encoding UTF8

$occupationSourceRows |
    Sort-Object occupation_id, prior_key, source_id |
    Export-Csv -Path (Join-Path $OutputDir 'occupation_source_priors.csv') -NoTypeInformation -Encoding UTF8

if ($PassThru) {
    [PSCustomObject]@{
        task_source_rows = $taskSourceRows.Count
        occupation_source_rows = $occupationSourceRows.Count
    }
}
