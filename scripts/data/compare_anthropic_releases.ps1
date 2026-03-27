param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$ContractDir,
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

if (-not $ContractDir) {
    $ContractDir = Join-Path $Root 'data\normalized'
}
if (-not $OutputPath) {
    $OutputPath = Join-Path $Root 'docs\data\anthropic_2026_integration_report.md'
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

function To-Number {
    param(
        [object]$Value,
        [double]$Default = 0.0
    )

    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
        return $Default
    }

    return [double]$Value
}

function Get-TopRows {
    param(
        [object[]]$Rows,
        [string]$SortColumn,
        [int]$Count = 12
    )

    return @($Rows | Sort-Object -Property $SortColumn -Descending | Select-Object -First $Count)
}

$baselineDir = Join-Path $Root 'data\tmp_anthropic_compare_2026_01_15'
$releaseDir = Join-Path $Root 'data\tmp_anthropic_compare_2026_03_24'
New-Item -ItemType Directory -Force -Path $baselineDir | Out-Null
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

& (Join-Path $PSScriptRoot 'normalize_anthropic_ei.ps1') `
    -Root $Root `
    -ContractDir $ContractDir `
    -OutputDir $baselineDir `
    -Mode release_2026_01_15 | Out-Null

& (Join-Path $PSScriptRoot 'normalize_anthropic_ei.ps1') `
    -Root $Root `
    -ContractDir $ContractDir `
    -OutputDir $releaseDir `
    -Mode release_2026_03_24 | Out-Null

$baselinePriors = Import-Csv (Join-Path $baselineDir 'task_augmentation_automation_priors.csv')
$releasePriors = Import-Csv (Join-Path $releaseDir 'task_augmentation_automation_priors.csv')
$baselineEvidence = Import-Csv (Join-Path $baselineDir 'task_exposure_evidence.csv')
$releaseEvidence = Import-Csv (Join-Path $releaseDir 'task_exposure_evidence.csv')
$occupations = Import-Csv (Join-Path $ContractDir 'occupations.csv')
$clusters = Import-Csv (Join-Path $ContractDir 'task_clusters.csv')

$occupationTitleById = @{}
foreach ($row in $occupations) { $occupationTitleById[$row.occupation_id] = $row.title }
$clusterLabelById = @{}
foreach ($row in $clusters) { $clusterLabelById[$row.task_cluster_id] = $row.label_short }

$baselineAnthropicPriors = @($baselinePriors | Where-Object { $_.primary_sources -like '*src_anthropic_ei_2026_01_15*' })
$releaseAnthropicPriors = @($releasePriors | Where-Object { $_.primary_sources -like '*src_anthropic_ei_2026_03_24*' })
$baselineAnthropicEvidence = @($baselineEvidence | Where-Object { $_.source_id -eq 'src_anthropic_ei_2026_01_15' })
$releaseAnthropicEvidence = @($releaseEvidence | Where-Object { $_.source_id -eq 'src_anthropic_ei_2026_03_24' })

$legacyMap = @{}
foreach ($row in $baselineAnthropicPriors) { $legacyMap["$($row.occupation_id)|$($row.task_cluster_id)"] = $row }
$releaseMap = @{}
foreach ($row in $releaseAnthropicPriors) { $releaseMap["$($row.occupation_id)|$($row.task_cluster_id)"] = $row }

$comparisonRows = New-Object System.Collections.Generic.List[object]
$allKeys = @($legacyMap.Keys + $releaseMap.Keys | Sort-Object -Unique)
foreach ($key in $allKeys) {
    $legacy = $legacyMap[$key]
    $release = $releaseMap[$key]
    $occupationId, $clusterId = $key -split '\|', 2

    $legacyExposure = To-Number $legacy.exposure_score
    $releaseExposure = To-Number $release.exposure_score
    $legacyAug = To-Number $legacy.augmentation_likelihood
    $releaseAug = To-Number $release.augmentation_likelihood
    $legacyAuto = To-Number $legacy.partial_automation_likelihood
    $releaseAuto = To-Number $release.partial_automation_likelihood
    $legacyConfidence = To-Number $legacy.evidence_confidence
    $releaseConfidence = To-Number $release.evidence_confidence

    $comparisonRows.Add([PSCustomObject]@{
        occupation_id = $occupationId
        occupation_title = if ($occupationTitleById.ContainsKey($occupationId)) { $occupationTitleById[$occupationId] } else { $occupationId }
        task_cluster_id = $clusterId
        task_cluster_label = if ($clusterLabelById.ContainsKey($clusterId)) { $clusterLabelById[$clusterId] } else { $clusterId }
        legacy_exposure = $legacyExposure
        release_exposure = $releaseExposure
        exposure_delta = $releaseExposure - $legacyExposure
        legacy_augmentation = $legacyAug
        release_augmentation = $releaseAug
        augmentation_delta = $releaseAug - $legacyAug
        legacy_automation = $legacyAuto
        release_automation = $releaseAuto
        automation_delta = $releaseAuto - $legacyAuto
        legacy_confidence = $legacyConfidence
        release_confidence = $releaseConfidence
        confidence_delta = $releaseConfidence - $legacyConfidence
        absolute_exposure_delta = [Math]::Abs($releaseExposure - $legacyExposure)
    })
}

$avgExposureDelta = (($comparisonRows | Measure-Object -Property exposure_delta -Average).Average)
$avgAugmentationDelta = (($comparisonRows | Measure-Object -Property augmentation_delta -Average).Average)
$avgAutomationDelta = (($comparisonRows | Measure-Object -Property automation_delta -Average).Average)
$avgConfidenceDelta = (($comparisonRows | Measure-Object -Property confidence_delta -Average).Average)
$topShiftRows = Get-TopRows -Rows $comparisonRows -SortColumn 'absolute_exposure_delta' -Count 12

$reportLines = New-Object System.Collections.Generic.List[string]
$reportLines.Add('# Anthropic 2026 Integration Report')
$reportLines.Add('')
$reportLines.Add('This report compares the normalized Anthropic priors generated from the imported `2026-01-15` raw release against the normalized priors generated from the imported `2026-03-24` raw release.')
$reportLines.Add('')
$reportLines.Add('## Coverage summary')
$reportLines.Add('')
$reportLines.Add(('- 2026-01-15 anthropic task evidence rows: `{0}`' -f $baselineAnthropicEvidence.Count))
$reportLines.Add(('- 2026-03-24 anthropic task evidence rows: `{0}`' -f $releaseAnthropicEvidence.Count))
$reportLines.Add(('- 2026-01-15 anthropic occupation-cluster priors: `{0}`' -f $baselineAnthropicPriors.Count))
$reportLines.Add(('- 2026-03-24 anthropic occupation-cluster priors: `{0}`' -f $releaseAnthropicPriors.Count))
$reportLines.Add(('- 2026-01-15 occupations covered: `{0}`' -f (@($baselineAnthropicPriors | Select-Object -ExpandProperty occupation_id -Unique).Count)))
$reportLines.Add(('- 2026-03-24 occupations covered: `{0}`' -f (@($releaseAnthropicPriors | Select-Object -ExpandProperty occupation_id -Unique).Count)))
$reportLines.Add('')
$reportLines.Add('## Mean delta across overlapping occupation-cluster priors')
$reportLines.Add('')
$reportLines.Add(('- Exposure delta: `{0:N3}`' -f $avgExposureDelta))
$reportLines.Add(('- Augmentation delta: `{0:N3}`' -f $avgAugmentationDelta))
$reportLines.Add(('- Automation delta: `{0:N3}`' -f $avgAutomationDelta))
$reportLines.Add(('- Confidence delta: `{0:N3}`' -f $avgConfidenceDelta))
$reportLines.Add('')
$reportLines.Add('## Largest exposure shifts')
$reportLines.Add('')
$reportLines.Add('| Occupation | Cluster | 2026-01-15 | 2026-03-24 | Delta |')
$reportLines.Add('| --- | --- | ---: | ---: | ---: |')
foreach ($row in $topShiftRows) {
    $reportLines.Add(('| {0} | {1} | {2:N2} | {3:N2} | {4:N2} |' -f $row.occupation_title, $row.task_cluster_label, $row.legacy_exposure, $row.release_exposure, $row.exposure_delta))
}
$reportLines.Add('')
$reportLines.Add('## Interpretation')
$reportLines.Add('')
$reportLines.Add('- Both integrations use direct task telemetry from Claude.ai and 1P API logs, aggregated into the existing O*NET-task and task-cluster pipeline.')
$reportLines.Add('- Collaboration labels are mapped directly into augmentation versus automation mode shares using the observed `directive`, `feedback loop`, `learning`, `task iteration`, and `validation` breakdowns.')
$reportLines.Add('- The `2026-03-24` release adds a February 2026 observation window and the report itself highlights diversification, slightly higher augmentation in Claude.ai, API migration for coding work, and learning-curve effects among higher-tenure users.')
$reportLines.Add('- Additional task telemetry such as work-use share, human-only ability, AI autonomy, and task-success coverage continues to inform exposure scaling and evidence confidence.')

$reportDir = Split-Path -Parent $OutputPath
if ($reportDir -and -not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
}

$reportLines | Set-Content -Path $OutputPath -Encoding UTF8

[PSCustomObject]@{
    output_path = $OutputPath
    baseline_priors = $baselineAnthropicPriors.Count
    release_priors = $releaseAnthropicPriors.Count
    compared_rows = $comparisonRows.Count
} | Format-List
