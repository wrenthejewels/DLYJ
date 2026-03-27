param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$SourceDir,
    [string]$OutputDir,
    [string]$ContractDir,
    [switch]$IncludeCandidates,
    [ValidateSet('auto','legacy_2025','release_2026_01_15','release_2026_03_24')]
    [string]$Mode = 'auto'
)

$ErrorActionPreference = 'Stop'

if (-not $SourceDir) {
    $SourceDir = Join-Path $Root 'data\raw\anthropic_economic_index'
}
if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}
if (-not $ContractDir) {
    $ContractDir = Join-Path $Root 'data\normalized'
}
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

function Convert-ToOccupationId([string]$SocCode) {
    return 'occ_' + ($SocCode -replace '[-\.]', '_')
}

function Clamp([double]$Value, [double]$Min, [double]$Max) {
    return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

function Import-RequiredCsv([string]$Path) {
    if (!(Test-Path $Path)) {
        throw "Missing required Anthropic extract: $Path"
    }
    return Import-Csv $Path
}

function Average {
    param([double[]]$Values)

    $usable = @($Values | Where-Object { $null -ne $_ })
    if (-not $usable.Count) { return $null }
    return (($usable | Measure-Object -Average).Average)
}

function Normalize-Text([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return '' }
    return ($Text.ToLowerInvariant() -replace '[^a-z0-9\s]', ' ' -replace '\s+', ' ').Trim()
}

function Parse-NullableDouble([object]$Value) {
    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
        return $null
    }
    return [double]$Value
}

function Infer-ClusterId {
    param(
        [string]$TaskStatement,
        [string]$OccupationId,
        [hashtable]$KeywordRowsByCluster,
        [hashtable]$RoleClusterBias,
        [string]$RoleFamily
    )

    $normalizedTask = Normalize-Text $TaskStatement
    $scores = @{}
    foreach ($clusterId in $KeywordRowsByCluster.Keys) {
        $bias = 0.0
        if ($RoleClusterBias.ContainsKey($RoleFamily) -and $RoleClusterBias[$RoleFamily].ContainsKey($clusterId)) {
            $bias = [double]$RoleClusterBias[$RoleFamily][$clusterId] * 0.35
        }
        $scores[$clusterId] = $bias
        foreach ($keywordRow in $KeywordRowsByCluster[$clusterId]) {
            if ($normalizedTask -like "*$(Normalize-Text $keywordRow.keyword)*") {
                $scores[$clusterId] += [double]$keywordRow.weight
            }
        }
    }
    return ($scores.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
}

function Get-PreferredMode {
    param(
        [string]$RequestedMode,
        [string]$AnthropicSourceDir
    )

    if ($RequestedMode -ne 'auto') {
        return $RequestedMode
    }

    $latestReleaseDir = Join-Path $AnthropicSourceDir 'release_2026_03_24\data'
    $latestApiPath = Join-Path $latestReleaseDir 'aei_raw_1p_api_2026-02-05_to_2026-02-12.csv'
    $latestClaudePath = Join-Path $latestReleaseDir 'aei_raw_claude_ai_2026-02-05_to_2026-02-12.csv'
    if ((Test-Path $latestApiPath) -and (Test-Path $latestClaudePath)) {
        return 'release_2026_03_24'
    }

    $releaseDir = Join-Path $AnthropicSourceDir 'release_2026_01_15\data\intermediate'
    $apiPath = Join-Path $releaseDir 'aei_raw_1p_api_2025-11-13_to_2025-11-20.csv'
    $claudePath = Join-Path $releaseDir 'aei_raw_claude_ai_2025-11-13_to_2025-11-20.csv'

    if ((Test-Path $apiPath) -and (Test-Path $claudePath)) {
        return 'release_2026_01_15'
    }

    return 'legacy_2025'
}

function Get-2026ReleaseConfig {
    param(
        [Parameter(Mandatory)] [string]$Mode,
        [Parameter(Mandatory)] [string]$AnthropicSourceDir
    )

    switch ($Mode) {
        'release_2026_03_24' {
            return [PSCustomObject]@{
                source_id = 'src_anthropic_ei_2026_03_24'
                release_label = 'release_2026_03_24'
                release_dir = Join-Path $AnthropicSourceDir 'release_2026_03_24\data'
                api_file = 'aei_raw_1p_api_2026-02-05_to_2026-02-12.csv'
                claude_file = 'aei_raw_claude_ai_2026-02-05_to_2026-02-12.csv'
            }
        }
        'release_2026_01_15' {
            return [PSCustomObject]@{
                source_id = 'src_anthropic_ei_2026_01_15'
                release_label = 'release_2026_01_15'
                release_dir = Join-Path $AnthropicSourceDir 'release_2026_01_15\data\intermediate'
                api_file = 'aei_raw_1p_api_2025-11-13_to_2025-11-20.csv'
                claude_file = 'aei_raw_claude_ai_2025-11-13_to_2025-11-20.csv'
            }
        }
        default {
            throw "Unsupported 2026 release mode: $Mode"
        }
    }
}

function Get-OrCreateTaskMetric {
    param(
        [hashtable]$Map,
        [string]$TaskKey
    )

    if (-not $Map.ContainsKey($TaskKey)) {
        $Map[$TaskKey] = @{
            task_key = $TaskKey
            task_count = 0.0
            collaboration = @{}
            human_only_ability = @{}
            use_case = @{}
            task_success = @{}
            multitasking = @{}
            ai_autonomy_mean = $null
            ai_autonomy_count = 0.0
            human_only_time_mean = $null
            human_only_time_count = 0.0
            human_with_ai_time_mean = $null
            human_with_ai_time_count = 0.0
        }
    }

    return $Map[$TaskKey]
}

function Split-AnthropicClusterName([string]$ClusterName) {
    $separatorIndex = $ClusterName.LastIndexOf('::')
    if ($separatorIndex -lt 0) {
        return [PSCustomObject]@{
            task_key = Normalize-Text $ClusterName
            label = ''
        }
    }

    $taskName = $ClusterName.Substring(0, $separatorIndex)
    $label = $ClusterName.Substring($separatorIndex + 2)
    return [PSCustomObject]@{
        task_key = Normalize-Text $taskName
        label = $label
    }
}

function Merge-ShareBucket {
    param(
        [hashtable]$WeightedSums,
        [hashtable]$Weights,
        [hashtable]$SourceShares,
        [double]$Weight
    )

    foreach ($label in $SourceShares.Keys) {
        if (-not $WeightedSums.ContainsKey($label)) { $WeightedSums[$label] = 0.0 }
        if (-not $Weights.ContainsKey($label)) { $Weights[$label] = 0.0 }
        $WeightedSums[$label] += ([double]$SourceShares[$label] * $Weight)
        $Weights[$label] += $Weight
    }
}

function Finalize-ShareBucket {
    param(
        [hashtable]$WeightedSums,
        [hashtable]$Weights
    )

    $result = @{}
    foreach ($label in $WeightedSums.Keys) {
        $weight = if ($Weights.ContainsKey($label)) { [double]$Weights[$label] } else { 0.0 }
        if ($weight -gt 0) {
            $result[$label] = [double]$WeightedSums[$label] / $weight
        }
    }

    return $result
}

function Get-ShareValue {
    param(
        [hashtable]$Bucket,
        [string]$Label,
        [double]$Default = 0.0
    )

    if ($Bucket.ContainsKey($Label)) {
        return [double]$Bucket[$Label]
    }

    return $Default
}

function Get-MeanValue {
    param(
        [hashtable]$Metric,
        [string]$MeanKey,
        [string]$CountKey,
        [double]$DefaultCount
    )

    if ($null -eq $Metric[$MeanKey]) {
        return [PSCustomObject]@{
            weighted_sum = 0.0
            weight = 0.0
        }
    }

    $weight = if ($Metric[$CountKey] -gt 0) { [double]$Metric[$CountKey] } else { $DefaultCount }
    return [PSCustomObject]@{
        weighted_sum = ([double]$Metric[$MeanKey] * $weight)
        weight = $weight
    }
}

function Get-2026PlatformMetrics {
    param(
        [Parameter(Mandatory)] [string]$Path,
        [switch]$RequireGlobalRows
    )

    $rows = Import-RequiredCsv $Path
    $taskMetrics = @{}
    $totalTaskCount = 0.0

    foreach ($row in $rows) {
        if ($RequireGlobalRows -and $row.geo_id -ne 'GLOBAL') {
            continue
        }

        if ($row.facet -eq 'onet_task' -and $row.variable -eq 'onet_task_count') {
            $taskKey = Normalize-Text $row.cluster_name
            if (-not $taskKey) { continue }

            $metric = Get-OrCreateTaskMetric -Map $taskMetrics -TaskKey $taskKey
            $metric.task_count = [double]$row.value
            $totalTaskCount += [double]$row.value
            continue
        }

        $parts = Split-AnthropicClusterName -ClusterName $row.cluster_name
        if (-not $parts.task_key) {
            continue
        }

        $metric = Get-OrCreateTaskMetric -Map $taskMetrics -TaskKey $parts.task_key
        switch ($row.facet) {
            'onet_task::collaboration' {
                if ($row.variable -eq 'onet_task_collaboration_pct' -and $parts.label) {
                    $metric.collaboration[$parts.label] = ([double]$row.value / 100.0)
                }
            }
            'onet_task::human_only_ability' {
                if ($row.variable -eq 'onet_task_human_only_ability_pct' -and $parts.label) {
                    $metric.human_only_ability[$parts.label] = ([double]$row.value / 100.0)
                }
            }
            'onet_task::use_case' {
                if ($row.variable -eq 'onet_task_use_case_pct' -and $parts.label) {
                    $metric.use_case[$parts.label] = ([double]$row.value / 100.0)
                }
            }
            'onet_task::task_success' {
                if ($row.variable -eq 'onet_task_task_success_pct' -and $parts.label) {
                    $metric.task_success[$parts.label] = ([double]$row.value / 100.0)
                }
            }
            'onet_task::multitasking' {
                if ($row.variable -eq 'onet_task_multitasking_pct' -and $parts.label) {
                    $metric.multitasking[$parts.label] = ([double]$row.value / 100.0)
                }
            }
            'onet_task::ai_autonomy' {
                if ($row.variable -eq 'onet_task_ai_autonomy_mean') {
                    $metric.ai_autonomy_mean = [double]$row.value
                } elseif ($row.variable -eq 'onet_task_ai_autonomy_count') {
                    $metric.ai_autonomy_count = [double]$row.value
                }
            }
            'onet_task::human_only_time' {
                if ($row.variable -eq 'onet_task_human_only_time_mean') {
                    $metric.human_only_time_mean = [double]$row.value
                } elseif ($row.variable -eq 'onet_task_human_only_time_count') {
                    $metric.human_only_time_count = [double]$row.value
                }
            }
            'onet_task::human_with_ai_time' {
                if ($row.variable -eq 'onet_task_human_with_ai_time_mean') {
                    $metric.human_with_ai_time_mean = [double]$row.value
                } elseif ($row.variable -eq 'onet_task_human_with_ai_time_count') {
                    $metric.human_with_ai_time_count = [double]$row.value
                }
            }
        }
    }

    return [PSCustomObject]@{
        total_task_count = $totalTaskCount
        task_metrics = $taskMetrics
    }
}

function Combine-2026Metrics {
    param([object[]]$PlatformMetrics)

    $combined = @{}
    $totalTaskCount = ($PlatformMetrics | Measure-Object -Property total_task_count -Sum).Sum

    foreach ($platform in $PlatformMetrics) {
        foreach ($taskKey in $platform.task_metrics.Keys) {
            $sourceMetric = $platform.task_metrics[$taskKey]
            if (-not $combined.ContainsKey($taskKey)) {
                $combined[$taskKey] = @{
                    task_key = $taskKey
                    task_count = 0.0
                    collaboration_weighted = @{}
                    collaboration_weights = @{}
                    human_only_weighted = @{}
                    human_only_weights = @{}
                    use_case_weighted = @{}
                    use_case_weights = @{}
                    task_success_weighted = @{}
                    task_success_weights = @{}
                    multitasking_weighted = @{}
                    multitasking_weights = @{}
                    ai_autonomy_weighted_sum = 0.0
                    ai_autonomy_weight = 0.0
                    human_only_time_weighted_sum = 0.0
                    human_only_time_weight = 0.0
                    human_with_ai_time_weighted_sum = 0.0
                    human_with_ai_time_weight = 0.0
                }
            }

            $target = $combined[$taskKey]
            $taskWeight = [Math]::Max([double]$sourceMetric.task_count, 0.0)
            $target.task_count += $taskWeight

            if ($taskWeight -gt 0) {
                Merge-ShareBucket -WeightedSums $target.collaboration_weighted -Weights $target.collaboration_weights -SourceShares $sourceMetric.collaboration -Weight $taskWeight
                Merge-ShareBucket -WeightedSums $target.human_only_weighted -Weights $target.human_only_weights -SourceShares $sourceMetric.human_only_ability -Weight $taskWeight
                Merge-ShareBucket -WeightedSums $target.use_case_weighted -Weights $target.use_case_weights -SourceShares $sourceMetric.use_case -Weight $taskWeight
                Merge-ShareBucket -WeightedSums $target.task_success_weighted -Weights $target.task_success_weights -SourceShares $sourceMetric.task_success -Weight $taskWeight
                Merge-ShareBucket -WeightedSums $target.multitasking_weighted -Weights $target.multitasking_weights -SourceShares $sourceMetric.multitasking -Weight $taskWeight
            }

            $aiAutonomy = Get-MeanValue -Metric $sourceMetric -MeanKey 'ai_autonomy_mean' -CountKey 'ai_autonomy_count' -DefaultCount $taskWeight
            $target.ai_autonomy_weighted_sum += $aiAutonomy.weighted_sum
            $target.ai_autonomy_weight += $aiAutonomy.weight

            $humanOnlyTime = Get-MeanValue -Metric $sourceMetric -MeanKey 'human_only_time_mean' -CountKey 'human_only_time_count' -DefaultCount $taskWeight
            $target.human_only_time_weighted_sum += $humanOnlyTime.weighted_sum
            $target.human_only_time_weight += $humanOnlyTime.weight

            $humanWithAiTime = Get-MeanValue -Metric $sourceMetric -MeanKey 'human_with_ai_time_mean' -CountKey 'human_with_ai_time_count' -DefaultCount $taskWeight
            $target.human_with_ai_time_weighted_sum += $humanWithAiTime.weighted_sum
            $target.human_with_ai_time_weight += $humanWithAiTime.weight
        }
    }

    $finalRows = @{}
    foreach ($taskKey in $combined.Keys) {
        $entry = $combined[$taskKey]
        $finalRows[$taskKey] = [PSCustomObject]@{
            task_key = $taskKey
            task_count = [double]$entry.task_count
            task_pct = if ($totalTaskCount -gt 0) { [double]$entry.task_count / [double]$totalTaskCount } else { 0.0 }
            collaboration = Finalize-ShareBucket -WeightedSums $entry.collaboration_weighted -Weights $entry.collaboration_weights
            human_only_ability = Finalize-ShareBucket -WeightedSums $entry.human_only_weighted -Weights $entry.human_only_weights
            use_case = Finalize-ShareBucket -WeightedSums $entry.use_case_weighted -Weights $entry.use_case_weights
            task_success = Finalize-ShareBucket -WeightedSums $entry.task_success_weighted -Weights $entry.task_success_weights
            multitasking = Finalize-ShareBucket -WeightedSums $entry.multitasking_weighted -Weights $entry.multitasking_weights
            ai_autonomy_mean = if ($entry.ai_autonomy_weight -gt 0) { [double]$entry.ai_autonomy_weighted_sum / [double]$entry.ai_autonomy_weight } else { $null }
            human_only_time_mean = if ($entry.human_only_time_weight -gt 0) { [double]$entry.human_only_time_weighted_sum / [double]$entry.human_only_time_weight } else { $null }
            human_with_ai_time_mean = if ($entry.human_with_ai_time_weight -gt 0) { [double]$entry.human_with_ai_time_weighted_sum / [double]$entry.human_with_ai_time_weight } else { $null }
        }
    }

    return $finalRows
}

$metadataDir = Join-Path $Root 'data\metadata'
$normalizedDir = $ContractDir
$launchSeed = Import-Csv (Join-Path $metadataDir 'launch_occupation_seed.csv')
if (-not $IncludeCandidates) {
    $launchSeed = $launchSeed | Where-Object { $_.status -eq 'selected' }
}
$seedCodes = $launchSeed | Select-Object -ExpandProperty provisional_onet_soc_code
$seedBySoc = @{}
foreach ($row in $launchSeed) { $seedBySoc[$row.provisional_onet_soc_code] = $row }

$taskMembership = Import-Csv (Join-Path $normalizedDir 'task_cluster_membership.csv')
$existingEvidence = Import-Csv (Join-Path $normalizedDir 'task_exposure_evidence.csv')
$existingPriors = Import-Csv (Join-Path $normalizedDir 'task_augmentation_automation_priors.csv')
$occupationTasks = Import-Csv (Join-Path $normalizedDir 'occupation_tasks.csv')
$keywordRows = Import-Csv (Join-Path $metadataDir 'task_cluster_keywords.csv')
$roleProfiles = Import-Csv (Join-Path $metadataDir 'role_family_cluster_profiles.csv')

$membershipByKey = @{}
foreach ($row in $taskMembership) {
    $membershipByKey["$($row.occupation_id)|$($row.onet_task_id)"] = $row
}

$keywordRowsByCluster = @{}
foreach ($row in $keywordRows) {
    if (-not $keywordRowsByCluster.ContainsKey($row.task_cluster_id)) { $keywordRowsByCluster[$row.task_cluster_id] = @() }
    $keywordRowsByCluster[$row.task_cluster_id] += $row
}

$roleClusterBias = @{}
foreach ($row in $roleProfiles) {
    if (-not $roleClusterBias.ContainsKey($row.role_family)) { $roleClusterBias[$row.role_family] = @{} }
    $roleClusterBias[$row.role_family][$row.task_cluster_id] = [double]$row.share_prior
}

$newEvidence = New-Object System.Collections.Generic.List[object]
$selectedOccupationIds = $launchSeed | ForEach-Object { Convert-ToOccupationId $_.provisional_onet_soc_code }
$statementRowsByTaskName = @{}
foreach ($row in $occupationTasks) {
    if ($row.occupation_id -notin $selectedOccupationIds) {
        continue
    }

    $taskNameKey = Normalize-Text $row.task_statement
    if (-not $taskNameKey) { continue }

    if (-not $statementRowsByTaskName.ContainsKey($taskNameKey)) {
        $statementRowsByTaskName[$taskNameKey] = New-Object System.Collections.Generic.List[object]
    }

    $statementRowsByTaskName[$taskNameKey].Add($row)
}

$activeMode = Get-PreferredMode -RequestedMode $Mode -AnthropicSourceDir $SourceDir
$releaseConfig = if ($activeMode -like 'release_2026_*') {
    Get-2026ReleaseConfig -Mode $activeMode -AnthropicSourceDir $SourceDir
} else {
    $null
}
$anthropicSourceId = if ($releaseConfig) { $releaseConfig.source_id } else { 'src_anthropic_ei_2025_03_27' }

if ($releaseConfig) {
    $apiMetrics = Get-2026PlatformMetrics -Path (Join-Path $releaseConfig.release_dir $releaseConfig.api_file)
    $claudeMetrics = Get-2026PlatformMetrics -Path (Join-Path $releaseConfig.release_dir $releaseConfig.claude_file) -RequireGlobalRows
    $platformMetrics = @($apiMetrics, $claudeMetrics)
    $combinedMetrics = Combine-2026Metrics -PlatformMetrics $platformMetrics
    $maxTaskPct = (($combinedMetrics.Values | Measure-Object -Property task_pct -Maximum).Maximum)
    if (-not $maxTaskPct -or [double]$maxTaskPct -le 0) { $maxTaskPct = 0.01 }
    $maxTaskCount = (($combinedMetrics.Values | Measure-Object -Property task_count -Maximum).Maximum)
    if (-not $maxTaskCount -or [double]$maxTaskCount -le 0) { $maxTaskCount = 1.0 }

    foreach ($taskKey in $combinedMetrics.Keys) {
        if (-not $statementRowsByTaskName.ContainsKey($taskKey)) {
            continue
        }

        $metric = $combinedMetrics[$taskKey]
        $usageScore = Clamp ([Math]::Sqrt(([double]$metric.task_pct) / [double]$maxTaskPct)) 0.03 0.98
        $autonomyNorm = if ($null -ne $metric.ai_autonomy_mean) {
            Clamp ((([double]$metric.ai_autonomy_mean) - 1.0) / 4.0) 0.0 1.0
        } else {
            0.50
        }
        $workShare = Get-ShareValue -Bucket $metric.use_case -Label 'work'
        $successShare = Get-ShareValue -Bucket $metric.task_success -Label 'yes'
        $nonHumanShare = Get-ShareValue -Bucket $metric.human_only_ability -Label 'no'

        $directiveShare = Get-ShareValue -Bucket $metric.collaboration -Label 'directive'
        $feedbackShare = Get-ShareValue -Bucket $metric.collaboration -Label 'feedback loop'
        $learningShare = Get-ShareValue -Bucket $metric.collaboration -Label 'learning'
        $iterationShare = Get-ShareValue -Bucket $metric.collaboration -Label 'task iteration'
        $validationShare = Get-ShareValue -Bucket $metric.collaboration -Label 'validation'
        $augmentationBase = Clamp ($feedbackShare + $learningShare + $iterationShare + $validationShare) 0.0 0.98
        $automationBase = Clamp $directiveShare 0.0 0.98

        $exposure = Clamp (($usageScore * 0.72) + ($workShare * 0.16) + ($autonomyNorm * 0.12)) 0.03 0.98
        $augmentation = Clamp (($augmentationBase * 0.78) + ($successShare * 0.12) + ((1.0 - $nonHumanShare) * 0.10)) 0.0 0.98
        $automation = Clamp (($automationBase * 0.72) + ($autonomyNorm * 0.18) + ($nonHumanShare * 0.10)) 0.0 0.98

        $coverageSignals = @()
        $coverageSignals += if ($metric.collaboration.ContainsKey('not_classified')) { 1.0 - [double]$metric.collaboration['not_classified'] } else { 0.75 }
        $coverageSignals += if ($metric.human_only_ability.ContainsKey('not_classified')) { 1.0 - [double]$metric.human_only_ability['not_classified'] } else { 0.75 }
        $coverageSignals += if ($metric.use_case.ContainsKey('not_classified')) { 1.0 - [double]$metric.use_case['not_classified'] } else { 0.75 }
        $classificationCoverage = Average -Values $coverageSignals
        $countNorm = Clamp (([Math]::Log10(([double]$metric.task_count + 1.0))) / ([Math]::Log10(([double]$maxTaskCount + 1.0)))) 0.0 1.0
        $confidence = Clamp (0.35 + ($countNorm * 0.35) + ($classificationCoverage * 0.20) + ($workShare * 0.10)) 0.35 0.96

        $timeRatio = if ($null -ne $metric.human_only_time_mean -and [double]$metric.human_only_time_mean -gt 0 -and $null -ne $metric.human_with_ai_time_mean) {
            [double]$metric.human_with_ai_time_mean / [double]$metric.human_only_time_mean
        } else {
            $null
        }
        $autonomyMeanLabel = if ($null -ne $metric.ai_autonomy_mean) { '{0:N2}' -f [double]$metric.ai_autonomy_mean } else { 'na' }
        $timeRatioLabel = if ($null -ne $timeRatio) { '{0:N2}' -f $timeRatio } else { 'na' }
        $notes = @(
            'anthropic_normalized'
            $releaseConfig.release_label
            ('task_count={0:N0}' -f [double]$metric.task_count)
            ('work_share={0:N2}' -f $workShare)
            ('autonomy_mean={0}' -f $autonomyMeanLabel)
            ('success_share={0:N2}' -f $successShare)
            ('time_ratio={0}' -f $timeRatioLabel)
        ) -join '|'

        foreach ($statementRow in $statementRowsByTaskName[$taskKey]) {
            $occupationId = $statementRow.occupation_id
            $taskId = $statementRow.onet_task_id
            $mapping = $membershipByKey["$occupationId|$taskId"]
            $clusterId = if ($mapping) { $mapping.task_cluster_id } else {
                Infer-ClusterId -TaskStatement $statementRow.task_statement -OccupationId $occupationId -KeywordRowsByCluster $keywordRowsByCluster -RoleClusterBias $roleClusterBias -RoleFamily $statementRow.role_family
            }
            if (-not $clusterId) { continue }

            $newEvidence.Add([PSCustomObject]@{
                occupation_id = $occupationId
                onet_task_id = $taskId
                task_cluster_id = $clusterId
                source_id = $anthropicSourceId
                exposure_score = ('{0:N2}' -f $exposure)
                augmentation_score = ('{0:N2}' -f $augmentation)
                automation_score = ('{0:N2}' -f $automation)
                observed_usage_share = ('{0:N4}' -f [double]$metric.task_pct)
                evidence_type = 'anthropic_task_usage'
                confidence = ('{0:N2}' -f $confidence)
                notes = $notes
            })
        }
    }
} else {
    $rawRows = Import-RequiredCsv (Join-Path $SourceDir 'automation_vs_augmentation_by_task.csv')
    $taskPctRows = Import-RequiredCsv (Join-Path $SourceDir 'task_pct_v2.csv')
    $pctByTaskName = @{}
    foreach ($row in $taskPctRows) {
        $pctByTaskName[(Normalize-Text $row.task_name)] = [double]$row.pct
    }
    $maxPct = ($taskPctRows | Measure-Object -Property pct -Maximum).Maximum
    if (-not $maxPct -or [double]$maxPct -le 0) { $maxPct = 0.01 }

    foreach ($row in $rawRows) {
        $taskNameKey = Normalize-Text $row.task_name
        if (-not $statementRowsByTaskName.ContainsKey($taskNameKey)) {
            continue
        }

        $augmentation = [double]$row.feedback_loop + [double]$row.task_iteration + [double]$row.validation + [double]$row.learning
        $automation = [double]$row.directive
        $pct = if ($pctByTaskName.ContainsKey($taskNameKey)) { [double]$pctByTaskName[$taskNameKey] } else { 0.0 }
        $exposure = Clamp ([Math]::Sqrt($pct / [double]$maxPct)) 0.05 0.95

        foreach ($statementRow in $statementRowsByTaskName[$taskNameKey]) {
            $occupationId = $statementRow.occupation_id
            $taskId = $statementRow.onet_task_id
            $mapping = $membershipByKey["$occupationId|$taskId"]
            $clusterId = if ($mapping) {
                $mapping.task_cluster_id
            } else {
                Infer-ClusterId -TaskStatement $statementRow.task_statement -OccupationId $occupationId -KeywordRowsByCluster $keywordRowsByCluster -RoleClusterBias $roleClusterBias -RoleFamily $statementRow.role_family
            }
            if (-not $clusterId) { continue }

            $newEvidence.Add([PSCustomObject]@{
                occupation_id = $occupationId
                onet_task_id = $taskId
                task_cluster_id = $clusterId
                source_id = $anthropicSourceId
                exposure_score = ('{0:N2}' -f $exposure)
                augmentation_score = ('{0:N2}' -f (Clamp $augmentation 0.00 0.98))
                automation_score = ('{0:N2}' -f (Clamp $automation 0.00 0.98))
                observed_usage_share = ('{0:N4}' -f $pct)
                evidence_type = 'anthropic_task_usage'
                confidence = '0.78'
                notes = 'anthropic_normalized|release_2025_03_27'
            })
        }
    }
}

$evidenceByKey = @{}
foreach ($row in $existingEvidence | Where-Object { $_.occupation_id -in $selectedOccupationIds }) {
    $evidenceByKey["$($row.occupation_id)|$($row.onet_task_id)"] = $row
}
foreach ($row in $newEvidence) {
    $evidenceByKey["$($row.occupation_id)|$($row.onet_task_id)"] = $row
}
$mergedEvidence = $evidenceByKey.Values | Sort-Object occupation_id, onet_task_id
$mergedEvidence | Export-Csv -Path (Join-Path $OutputDir 'task_exposure_evidence.csv') -NoTypeInformation -Encoding UTF8

$aggregates = @{}
foreach ($row in $newEvidence) {
    $key = "$($row.occupation_id)|$($row.task_cluster_id)"
    if (-not $aggregates.ContainsKey($key)) {
        $aggregates[$key] = [PSCustomObject]@{
            occupation_id = $row.occupation_id
            task_cluster_id = $row.task_cluster_id
            weighted_exposure = 0.0
            weighted_augmentation = 0.0
            weighted_automation = 0.0
            weighted_confidence = 0.0
            total_weight = 0.0
        }
    }

    $usageWeight = [double]$row.observed_usage_share
    if ($usageWeight -le 0) { $usageWeight = 0.01 }
    $aggregate = $aggregates[$key]
    $aggregate.weighted_exposure += ([double]$row.exposure_score * $usageWeight)
    $aggregate.weighted_augmentation += ([double]$row.augmentation_score * $usageWeight)
    $aggregate.weighted_automation += ([double]$row.automation_score * $usageWeight)
    $aggregate.weighted_confidence += ([double]$row.confidence * $usageWeight)
    $aggregate.total_weight += $usageWeight
}

$newPriors = New-Object System.Collections.Generic.List[object]
foreach ($aggregate in $aggregates.Values) {
    $weight = [Math]::Max($aggregate.total_weight, 0.01)
    $partialAuto = $aggregate.weighted_automation / $weight
    $newPriors.Add([PSCustomObject]@{
        occupation_id = $aggregate.occupation_id
        task_cluster_id = $aggregate.task_cluster_id
        exposure_score = ('{0:N2}' -f ($aggregate.weighted_exposure / $weight))
        augmentation_likelihood = ('{0:N2}' -f ($aggregate.weighted_augmentation / $weight))
        partial_automation_likelihood = ('{0:N2}' -f $partialAuto)
        high_automation_likelihood = ('{0:N2}' -f (Clamp ($partialAuto - 0.08) 0.02 0.90))
        evidence_confidence = ('{0:N2}' -f ($aggregate.weighted_confidence / $weight))
        primary_sources = "$anthropicSourceId|src_onet_30_1"
        notes = "anthropic_normalized|mode=$activeMode"
    })
}

$priorByKey = @{}
foreach ($row in $existingPriors | Where-Object { $_.occupation_id -in $selectedOccupationIds }) {
    $priorByKey["$($row.occupation_id)|$($row.task_cluster_id)"] = $row
}
foreach ($row in $newPriors) {
    $priorByKey["$($row.occupation_id)|$($row.task_cluster_id)"] = $row
}
$mergedPriors = $priorByKey.Values | Sort-Object occupation_id, task_cluster_id
$mergedPriors | Export-Csv -Path (Join-Path $OutputDir 'task_augmentation_automation_priors.csv') -NoTypeInformation -Encoding UTF8

[PSCustomObject]@{
    anthropic_task_rows = $newEvidence.Count
    merged_task_evidence_rows = $mergedEvidence.Count
    merged_task_prior_rows = $mergedPriors.Count
    source_dir = $SourceDir
    mode = $activeMode
} | Format-List
