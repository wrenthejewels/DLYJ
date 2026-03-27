param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$OutputDir,
    [switch]$RebuildSelector
)

$ErrorActionPreference = 'Stop'

if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

function Clamp {
    param(
        [double]$Value,
        [double]$Min,
        [double]$Max
    )

    return [Math]::Max($Min, [Math]::Min($Max, $Value))
}

function Get-Map {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Key
    )

    $map = @{}
    foreach ($row in $Rows) {
        $map[$row.$Key] = $row
    }
    return $map
}

function Group-ByKey {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$Key
    )

    $map = @{}
    foreach ($row in $Rows) {
        if (-not $map.ContainsKey($row.$Key)) {
            $map[$row.$Key] = New-Object System.Collections.Generic.List[object]
        }
        $map[$row.$Key].Add($row)
    }
    return $map
}

function Import-TabCsv {
    param([Parameter(Mandatory)] [string]$Path)

    $raw = Get-Content -Path $Path -Raw
    return $raw | ConvertFrom-Csv -Delimiter "`t"
}

$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$occupationTaskClusters = Import-Csv (Join-Path $OutputDir 'occupation_task_clusters.csv')
$taskPriors = Import-Csv (Join-Path $OutputDir 'task_augmentation_automation_priors.csv')
$laborContext = Import-Csv (Join-Path $OutputDir 'occupation_labor_market_context.csv')
$jobZones = Import-TabCsv (Join-Path $Root 'data\raw\onet\job_zones.txt')

$taskClustersByOcc = Group-ByKey -Rows $occupationTaskClusters -Key 'occupation_id'
$taskPriorsByOcc = Group-ByKey -Rows $taskPriors -Key 'occupation_id'
$laborByOcc = Get-Map -Rows $laborContext -Key 'occupation_id'
$taskPriorMapByOcc = @{}
foreach ($occupationId in $taskPriorsByOcc.Keys) {
    $taskPriorMapByOcc[$occupationId] = Get-Map -Rows $taskPriorsByOcc[$occupationId] -Key 'task_cluster_id'
}

$jobZoneBySoc = @{}
foreach ($row in $jobZones) {
    if ($row.'O*NET-SOC Code' -and $row.'Job Zone') {
        $jobZoneBySoc[$row.'O*NET-SOC Code'] = [int][double]$row.'Job Zone'
    }
}

$wages = $laborContext | ForEach-Object { [double]$_.median_wage_usd }
$growth = $laborContext | ForEach-Object { [double]$_.projection_growth_pct }
$openingsRates = $laborContext | ForEach-Object { [double]$_.annual_openings / [Math]::Max([double]$_.employment_us, 1.0) }
$unemploymentRates = $laborContext |
    Where-Object { $_.latest_unemployment_rate } |
    ForEach-Object { [double]$_.latest_unemployment_rate }

$minWage = ($wages | Measure-Object -Minimum).Minimum
$maxWage = ($wages | Measure-Object -Maximum).Maximum
$minGrowth = ($growth | Measure-Object -Minimum).Minimum
$maxGrowth = ($growth | Measure-Object -Maximum).Maximum
$minOpeningsRate = ($openingsRates | Measure-Object -Minimum).Minimum
$maxOpeningsRate = ($openingsRates | Measure-Object -Maximum).Maximum
$minUnemployment = if ($unemploymentRates.Count) { ($unemploymentRates | Measure-Object -Minimum).Minimum } else { 2.0 }
$maxUnemployment = if ($unemploymentRates.Count) { ($unemploymentRates | Measure-Object -Maximum).Maximum } else { 6.0 }

$rangeWage = [Math]::Max(1.0, $maxWage - $minWage)
$rangeGrowth = [Math]::Max(1.0, $maxGrowth - $minGrowth)
$rangeOpenings = [Math]::Max(0.0001, $maxOpeningsRate - $minOpeningsRate)
$rangeUnemployment = [Math]::Max(0.1, $maxUnemployment - $minUnemployment)

$knowledgeClusters = @('cluster_analysis','cluster_research_synthesis','cluster_decision_support','cluster_oversight_strategy','cluster_drafting')
$peopleClusters = @('cluster_client_interaction','cluster_relationship_management','cluster_coordination')
$routineClusters = @('cluster_execution_routine','cluster_workflow_admin','cluster_documentation')

$exposureRows = New-Object System.Collections.Generic.List[object]
$adaptationRows = New-Object System.Collections.Generic.List[object]
$today = Get-Date -Format 'yyyy-MM-dd'

foreach ($occupation in $occupations) {
    $occupationId = $occupation.occupation_id
    $clusters = if ($taskClustersByOcc.ContainsKey($occupationId)) { @() + $taskClustersByOcc[$occupationId] } else { @() }
    $priorsByCluster = if ($taskPriorMapByOcc.ContainsKey($occupationId)) { $taskPriorMapByOcc[$occupationId] } else { @{} }
    $labor = $laborByOcc[$occupationId]

    if (-not $clusters.Count -and $priorsByCluster.Count -gt 0) {
        $syntheticShare = 1.0 / $priorsByCluster.Count
        $clusters = @(
            foreach ($clusterId in $priorsByCluster.Keys) {
                [PSCustomObject]@{
                    occupation_id = $occupationId
                    task_cluster_id = $clusterId
                    share_prior = $syntheticShare
                    importance_prior = 0.60
                    evidence_confidence = 0.40
                }
            }
        )
    }

    if (-not $clusters.Count -or -not $labor) {
        continue
    }

    $weightedClusters = New-Object System.Collections.Generic.List[object]
    $weightTotal = 0.0

    foreach ($cluster in $clusters) {
        $taskPrior = $priorsByCluster[$cluster.task_cluster_id]
        if (-not $taskPrior) {
            continue
        }

        $weight = [double]$cluster.share_prior * (0.70 + (0.30 * [double]$cluster.importance_prior))
        $weightTotal += $weight
        $weightedClusters.Add([PSCustomObject]@{
            task_cluster_id = $cluster.task_cluster_id
            weight_raw = $weight
            exposure_score = [double]$taskPrior.exposure_score
            augmentation_likelihood = [double]$taskPrior.augmentation_likelihood
            partial_automation_likelihood = [double]$taskPrior.partial_automation_likelihood
            high_automation_likelihood = [double]$taskPrior.high_automation_likelihood
            evidence_confidence = [double]$taskPrior.evidence_confidence
            primary_sources = [string]$taskPrior.primary_sources
        })
    }

    if ($weightTotal -le 0) {
        continue
    }

    foreach ($entry in $weightedClusters) {
        Add-Member -InputObject $entry -NotePropertyName weight -NotePropertyValue ($entry.weight_raw / $weightTotal)
    }

    $weightedExposure = 0.0
    $weightedAugmentation = 0.0
    $weightedAutomation = 0.0
    $weightedConfidence = 0.0
    $anthropicCoverage = 0.0
    $hasAnthropic202603 = $false
    $hasAnthropic202601 = $false
    $hasAnthropic2025 = $false
    $knowledgeShare = 0.0
    $peopleShare = 0.0
    $routineShare = 0.0

    foreach ($entry in $weightedClusters) {
        $weightedExposure += $entry.weight * $entry.exposure_score
        $weightedAugmentation += $entry.weight * $entry.augmentation_likelihood
        $weightedAutomation += $entry.weight * (($entry.partial_automation_likelihood * 0.65) + ($entry.high_automation_likelihood * 0.35))
        $weightedConfidence += $entry.weight * $entry.evidence_confidence

        if ($entry.primary_sources -match 'src_anthropic_ei_\d{4}_\d{2}_\d{2}') {
            $anthropicCoverage += $entry.weight
            if ($entry.primary_sources -like '*src_anthropic_ei_2026_03_24*') { $hasAnthropic202603 = $true }
            if ($entry.primary_sources -like '*src_anthropic_ei_2026_01_15*') { $hasAnthropic202601 = $true }
            if ($entry.primary_sources -like '*src_anthropic_ei_2025_03_27*') { $hasAnthropic2025 = $true }
        }
        if ($entry.task_cluster_id -in $knowledgeClusters) {
            $knowledgeShare += $entry.weight
        }
        if ($entry.task_cluster_id -in $peopleClusters) {
            $peopleShare += $entry.weight
        }
        if ($entry.task_cluster_id -in $routineClusters) {
            $routineShare += $entry.weight
        }
    }

    $jobZone = if ($jobZoneBySoc.ContainsKey($occupation.onet_soc_code)) { $jobZoneBySoc[$occupation.onet_soc_code] } else { 3 }
    $jobZoneNorm = Clamp (($jobZone - 1.0) / 4.0) 0.0 1.0
    $wageNorm = Clamp ((([double]$labor.median_wage_usd) - $minWage) / $rangeWage) 0.0 1.0
    $growthNorm = Clamp ((([double]$labor.projection_growth_pct) - $minGrowth) / $rangeGrowth) 0.0 1.0
    $openingsRate = [double]$labor.annual_openings / [Math]::Max([double]$labor.employment_us, 1.0)
    $openingsNorm = Clamp (($openingsRate - $minOpeningsRate) / $rangeOpenings) 0.0 1.0
    $unemploymentRate = if ($labor.latest_unemployment_rate) { [double]$labor.latest_unemployment_rate } else { $null }
    $unemploymentNorm = if ($null -ne $unemploymentRate) {
        Clamp (($unemploymentRate - $minUnemployment) / $rangeUnemployment) 0.0 1.0
    } else {
        0.50
    }

    $laborResilience = Clamp ((($growthNorm * 0.35) + ($openingsNorm * 0.25) + ($wageNorm * 0.20) + ((1 - $unemploymentNorm) * 0.20))) 0.0 1.0
    $transferability = Clamp (0.20 + ($knowledgeShare * 0.28) + ($peopleShare * 0.22) + ($jobZoneNorm * 0.12) + ((1 - $routineShare) * 0.10) + ($laborResilience * 0.08)) 0.05 0.99
    $learningIntensity = Clamp (0.18 + ($jobZoneNorm * 0.32) + ($knowledgeShare * 0.22) + ($growthNorm * 0.12) + ($wageNorm * 0.10) + ($peopleShare * 0.06)) 0.05 0.99
    $adaptiveCapacity = Clamp (($transferability * 0.38) + ($learningIntensity * 0.30) + ((1 - $routineShare) * 0.14) + ($peopleShare * 0.10) + ($laborResilience * 0.08)) 0.05 0.99
    $confidence = Clamp (($weightedConfidence * 0.55) + ($anthropicCoverage * 0.20) + (([double]$labor.labor_market_confidence) * 0.15) + ($jobZoneNorm * 0.10)) 0.35 0.88

    $anthropicSourceId = if ($hasAnthropic202603) {
        'src_anthropic_ei_2026_03_24'
    } elseif ($hasAnthropic202601) {
        'src_anthropic_ei_2026_01_15'
    } elseif ($hasAnthropic2025) {
        'src_anthropic_ei_2025_03_27'
    } else {
        'src_anthropic_ei_2025_03_27'
    }
    $sourceMix = "src_onet_30_1|$anthropicSourceId|src_bls_oews_2024|src_bls_proj_2024_2034|src_bls_cps_occupation_unemployment_2026_03"
    $exposureRows.Add([PSCustomObject]@{
        occupation_id = $occupationId
        source_id = 'src_v2_launch_aggregate_2026_03'
        exposure_score = ('{0:N3}' -f $weightedExposure)
        augmentation_score = ('{0:N3}' -f $weightedAugmentation)
        automation_score = ('{0:N3}' -f $weightedAutomation)
        adaptive_capacity_score = ('{0:N3}' -f $adaptiveCapacity)
        confidence = ('{0:N2}' -f $confidence)
        release_date = $today
        notes = ('derived_launch_aggregate|anthropic_cluster_coverage={0:N2}|job_zone={1}|labor_resilience={2:N2}' -f $anthropicCoverage, $jobZone, $laborResilience)
    })

    $adaptationRows.Add([PSCustomObject]@{
        occupation_id = $occupationId
        adaptive_capacity_score = ('{0:N3}' -f $adaptiveCapacity)
        transferability_score = ('{0:N3}' -f $transferability)
        learning_intensity_score = ('{0:N3}' -f $learningIntensity)
        transition_option_count = [Math]::Round(6 + ($transferability * 9) + ($peopleShare * 3) + ($laborResilience * 2))
        job_zone = $jobZone
        source_mix = $sourceMix
        confidence = ('{0:N2}' -f $confidence)
        notes = ('derived_launch_aggregate|knowledge_share={0:N2}|people_share={1:N2}|routine_share={2:N2}' -f $knowledgeShare, $peopleShare, $routineShare)
    })
}

$exposureRows | Sort-Object occupation_id | Export-Csv `
    -Path (Join-Path $OutputDir 'occupation_exposure_priors.csv') `
    -NoTypeInformation `
    -Encoding UTF8

$adaptationRows | Sort-Object occupation_id | Export-Csv `
    -Path (Join-Path $OutputDir 'occupation_adaptation_priors.csv') `
    -NoTypeInformation `
    -Encoding UTF8

if ($RebuildSelector) {
    & (Join-Path $PSScriptRoot 'build_selector_index.ps1') -Root $Root | Out-Null
}

[PSCustomObject]@{
    occupation_exposure_priors = $exposureRows.Count
    occupation_adaptation_priors = $adaptationRows.Count
    selector_rebuilt = [bool]$RebuildSelector
} | Format-List
