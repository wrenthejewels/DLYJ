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
    $OutputPath = Join-Path $Root 'docs\data\benchmark_disagreement_diagnostics.md'
}

function To-Number {
    param([object]$Value, [double]$Default = 0.0)
    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
        return $Default
    }
    return [double]$Value
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

function Get-ActionForDriver([string]$Driver) {
    switch ($Driver) {
        'legacy_fallback_gap' { return 'expand Anthropic 2026 task mapping for this occupation before changing score logic' }
        'stub_dependency' { return 'replace stub-heavy clusters with direct Anthropic or stronger O*NET-derived evidence' }
        'low_confidence_review' { return 'review task-cluster mapping and confidence calibration before trusting the disagreement' }
        default { return 'perform manual concept review against the benchmark bundle and confirm whether the mismatch is expected' }
    }
}

$occupations = Import-Csv (Join-Path $ContractDir 'occupations.csv')
$exposure = Import-Csv (Join-Path $ContractDir 'occupation_exposure_priors.csv')
$benchmarks = Import-Csv (Join-Path $ContractDir 'occupation_benchmark_scores.csv')
$taskClusters = Import-Csv (Join-Path $ContractDir 'occupation_task_clusters.csv')
$taskPriors = Import-Csv (Join-Path $ContractDir 'task_augmentation_automation_priors.csv')
$clusterMeta = Import-Csv (Join-Path $ContractDir 'task_clusters.csv')

$occupationTitleById = @{}
foreach ($row in $occupations) { $occupationTitleById[$row.occupation_id] = $row.title }
$clusterLabelById = @{}
foreach ($row in $clusterMeta) { $clusterLabelById[$row.task_cluster_id] = $row.label_short }

$benchmarkByOccupation = @{}
foreach ($row in $benchmarks) { $benchmarkByOccupation[$row.occupation_id] = $row }
$clustersByOccupation = Group-ByKey -Rows $taskClusters -Key 'occupation_id'
$priorsByOccupation = Group-ByKey -Rows $taskPriors -Key 'occupation_id'
$priorMapByOccupation = @{}
foreach ($occupationId in $priorsByOccupation.Keys) {
    $priorMapByOccupation[$occupationId] = @{}
    foreach ($row in $priorsByOccupation[$occupationId]) {
        $priorMapByOccupation[$occupationId][$row.task_cluster_id] = $row
    }
}

$diagnostics = New-Object System.Collections.Generic.List[object]
foreach ($row in $exposure) {
    if (-not $benchmarkByOccupation.ContainsKey($row.occupation_id)) { continue }
    $benchmark = $benchmarkByOccupation[$row.occupation_id]
    $benchmarkScore = To-Number $benchmark.benchmark_mean_percentile $null
    if ($null -eq $benchmarkScore) { continue }

    $clusters = if ($clustersByOccupation.ContainsKey($row.occupation_id)) { $clustersByOccupation[$row.occupation_id] } else { @() }
    $priorsByCluster = if ($priorMapByOccupation.ContainsKey($row.occupation_id)) { $priorMapByOccupation[$row.occupation_id] } else { @{} }

    $anthropic202603Share = 0.0
    $anthropic202601Share = 0.0
    $anthropic2025Share = 0.0
    $stubShare = 0.0
    $weightedTaskConfidence = 0.0
    $weightTotal = 0.0
    $topClusterSummaries = New-Object System.Collections.Generic.List[string]

    foreach ($cluster in ($clusters | Sort-Object { [double]$_.share_prior } -Descending)) {
        $share = To-Number $cluster.share_prior
        $prior = $priorsByCluster[$cluster.task_cluster_id]
        if (-not $prior) { continue }

        $weightTotal += $share
        $sourceString = [string]$prior.primary_sources
        $taskConfidence = To-Number $prior.evidence_confidence
        $weightedTaskConfidence += ($share * $taskConfidence)

        if ($sourceString -like '*src_anthropic_ei_2026_03_24*') { $anthropic202603Share += $share }
        if ($sourceString -like '*src_anthropic_ei_2026_01_15*') { $anthropic202601Share += $share }
        if ($sourceString -like '*src_anthropic_ei_2025_03_27*') { $anthropic2025Share += $share }
        if ($sourceString -like '*src_internal_stub_2026_03*') { $stubShare += $share }

        if ($topClusterSummaries.Count -lt 3) {
            $sourceLabel = if ($sourceString -like '*src_anthropic_ei_2026_03_24*') {
                'anthropic_2026_03'
            } elseif ($sourceString -like '*src_anthropic_ei_2026_01_15*') {
                'anthropic_2026_01'
            } elseif ($sourceString -like '*src_anthropic_ei_2025_03_27*') {
                'anthropic_2025'
            } elseif ($sourceString -like '*src_internal_stub_2026_03*') {
                'stub'
            } else {
                'other'
            }
            $topClusterSummaries.Add(('{0} ({1:N2}, {2})' -f $clusterLabelById[$cluster.task_cluster_id], $share, $sourceLabel))
        }
    }

    $meanTaskConfidence = if ($weightTotal -gt 0) { $weightedTaskConfidence / $weightTotal } else { 0.0 }
    $absoluteDelta = [Math]::Abs((To-Number $row.exposure_score) - $benchmarkScore)
    $signedDelta = (To-Number $row.exposure_score) - $benchmarkScore
    $exposureConfidence = To-Number $row.confidence

    $flags = New-Object System.Collections.Generic.List[string]
    if ($anthropic2025Share -ge 0.10) { $flags.Add('legacy_fallback') }
    if ($stubShare -ge 0.35) { $flags.Add('stub_heavy') }
    if ($meanTaskConfidence -lt 0.45 -or $exposureConfidence -lt 0.55) { $flags.Add('low_confidence') }
    if ($signedDelta -lt -0.35) { $flags.Add('benchmark_higher_than_live') }
    if ($signedDelta -gt 0.35) { $flags.Add('live_higher_than_benchmark') }

    $driver = if ($anthropic2025Share -ge 0.10) {
        'legacy_fallback_gap'
    } elseif ($stubShare -ge 0.35) {
        'stub_dependency'
    } elseif ($meanTaskConfidence -lt 0.45 -or $exposureConfidence -lt 0.55) {
        'low_confidence_review'
    } else {
        'conceptual_gap_review'
    }

    $diagnostics.Add([PSCustomObject]@{
        occupation_id = $row.occupation_id
        occupation_title = $occupationTitleById[$row.occupation_id]
        live_exposure = To-Number $row.exposure_score
        benchmark_percentile = $benchmarkScore
        signed_delta = $signedDelta
        absolute_delta = $absoluteDelta
        exposure_confidence = $exposureConfidence
        anthropic_2026_03_share = $anthropic202603Share
        anthropic_2026_01_share = $anthropic202601Share
        anthropic_2025_share = $anthropic2025Share
        stub_share = $stubShare
        weighted_task_confidence = $meanTaskConfidence
        driver = $driver
        flags = ($flags -join ', ')
        top_clusters = ($topClusterSummaries -join '; ')
    })
}

$topRows = @($diagnostics | Where-Object { $_.absolute_delta -ge 0.35 } | Sort-Object absolute_delta -Descending)
$driverCounts = @($topRows | Group-Object driver | Sort-Object Count -Descending)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('# Benchmark Disagreement Diagnostics')
$lines.Add('')
$lines.Add('This report classifies the largest benchmark-bundle disagreements into likely evidence-gap versus conceptual-gap buckets. It is intended to drive review work, not to auto-update public scoring.')
$lines.Add('')
$lines.Add('## Driver summary')
$lines.Add('')
foreach ($group in $driverCounts) {
    $lines.Add(('- `{0}`: `{1}` occupations' -f $group.Name, $group.Count))
}
$lines.Add('')
$lines.Add('## Largest reviewed disagreements')
$lines.Add('')
$lines.Add('| Occupation | Delta | 2026 share | Legacy share | Stub share | Task conf. | Driver |')
$lines.Add('| --- | ---: | ---: | ---: | ---: | ---: | --- |')
foreach ($row in ($topRows | Select-Object -First 15)) {
    $lines.Add(('| {0} | {1:N3} | {2:N2} | {3:N2} | {4:N2} | {5:N2} | {6} |' -f $row.occupation_title, $row.signed_delta, $row.anthropic_2026_share, $row.anthropic_2025_share, $row.stub_share, $row.weighted_task_confidence, $row.driver))
}
$lines.Add('')
$lines.Add('## Review notes')
$lines.Add('')
foreach ($row in ($topRows | Select-Object -First 10)) {
    $flagLabel = if ([string]::IsNullOrWhiteSpace($row.flags)) { 'none' } else { $row.flags }
    $lines.Add(('### {0}' -f $row.occupation_title))
    $lines.Add(('- Driver: `{0}`' -f $row.driver))
    $lines.Add(('- Flags: `{0}`' -f $flagLabel))
    $lines.Add(('- Top clusters: `{0}`' -f $row.top_clusters))
    $lines.Add(('- Recommended action: `{0}`' -f (Get-ActionForDriver -Driver $row.driver)))
    $lines.Add('')
}

$reportDir = Split-Path -Parent $OutputPath
if ($reportDir -and -not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
}
$lines | Set-Content -Path $OutputPath -Encoding UTF8

[PSCustomObject]@{
    reviewed_disagreements = $topRows.Count
    output_path = $OutputPath
} | Format-List
