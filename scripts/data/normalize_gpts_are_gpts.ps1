param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$SourceDir,
    [string]$OutputDir
)

$ErrorActionPreference = 'Stop'

if (-not $SourceDir) {
    $SourceDir = Join-Path $Root 'data\raw\gpts_are_gpts'
}
if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

function Import-RequiredCsv {
    param(
        [Parameter(Mandatory)] [string]$Path,
        [string]$Delimiter = ','
    )

    if (-not (Test-Path $Path)) {
        throw "Missing required GPTs-are-GPTs extract: $Path"
    }

    $raw = Get-Content -Path $Path -Raw -Encoding UTF8
    if ($Delimiter -eq ',' -and $raw.StartsWith(',')) {
        $raw = 'row_id' + $raw
    }

    return ($raw | ConvertFrom-Csv -Delimiter $Delimiter)
}

function Normalize-SocCode([string]$Code) {
    if ([string]::IsNullOrWhiteSpace($Code)) { return '' }
    $trimmed = $Code.Trim()
    if ($trimmed -match '^\d{2}-\d{4}$') {
        return "$trimmed.00"
    }
    return $trimmed
}

function Simplify-SocCode([string]$Code) {
    if ([string]::IsNullOrWhiteSpace($Code)) { return '' }
    return (Normalize-SocCode $Code).Substring(0, 7)
}

function New-PercentileMap {
    param(
        [Parameter(Mandatory)] [object[]]$Rows,
        [Parameter(Mandatory)] [string]$ScoreColumn,
        [string]$KeyColumn = 'occupation_id'
    )

    $scored = @($Rows | Where-Object { $_.$ScoreColumn -ne '' } | Sort-Object { [double]$_.($ScoreColumn) })
    $map = @{}
    if (-not $scored.Count) { return $map }

    for ($index = 0; $index -lt $scored.Count; $index++) {
        $key = [string]$scored[$index].($KeyColumn)
        $percentile = if ($scored.Count -eq 1) { 1.0 } else { [double]$index / [double]($scored.Count - 1) }
        $map[$key] = $percentile
    }

    return $map
}

function Get-LabelScore([string]$Label) {
    if ([string]::IsNullOrWhiteSpace($Label)) { return '' }
    if ($Label -match '^T([0-4])$') {
        return [int]$Matches[1]
    }
    return ''
}

$occupations = Import-Csv (Join-Path $OutputDir 'occupations.csv')
$occupationTasks = Import-Csv (Join-Path $OutputDir 'occupation_tasks.csv')
$occupationTaskInventory = Import-Csv (Join-Path $OutputDir 'occupation_task_inventory.csv')
$existingWide = Import-Csv (Join-Path $OutputDir 'occupation_benchmark_scores.csv')
$existingSourcePath = Join-Path $OutputDir 'occupation_benchmark_source_scores.csv'
$existingSourceRows = if (Test-Path $existingSourcePath) { Import-Csv $existingSourcePath } else { @() }
$taskBenchmarkManualPath = Join-Path $Root 'data\metadata\task_benchmark_manual_overrides.csv'
$taskBenchmarkManualRows = if (Test-Path $taskBenchmarkManualPath) { Import-Csv $taskBenchmarkManualPath } else { @() }

$occupationBySoc = @{}
$occupationBySimpleSoc = @{}
foreach ($row in $occupations) {
    $occupationBySoc[$row.onet_soc_code] = $row
    $occupationBySimpleSoc[(Simplify-SocCode $row.onet_soc_code)] = $row
}

$taskLookup = @{}
foreach ($row in $occupationTasks) {
    $taskLookup["$($row.occupation_id)|$($row.onet_task_id)"] = $true
}
foreach ($row in $occupationTaskInventory) {
    $taskLookup["$($row.occupation_id)|$($row.onet_task_id)"] = $true
}

$occLevelRows = Import-RequiredCsv (Join-Path $SourceDir 'occ_level.csv')
$taskLabelRows = Import-RequiredCsv (Join-Path $SourceDir 'automation_gpt4_human_labels.tsv') "`t"
$autoScoreRows = Import-RequiredCsv (Join-Path $SourceDir 'autoScores.csv')

$retainedSourceRows = @(
    $existingSourceRows |
        Where-Object {
            $_.source_id -notin @(
                'src_openai_gpts_are_gpts_2023',
                'src_webb_2020',
                'src_brynjolfsson_mitchell_rock_2018'
            )
        }
)

$newSourceRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $occLevelRows) {
    $soc = Normalize-SocCode $row.'O*NET-SOC Code'
    if (-not $occupationBySoc.ContainsKey($soc)) {
        continue
    }

    $occupationId = $occupationBySoc[$soc].occupation_id
    $metrics = @(
        @{ key = 'gpts_dv_alpha'; label = 'GPTs GPT-4 alpha'; score = $row.dv_rating_alpha }
        @{ key = 'gpts_dv_beta'; label = 'GPTs GPT-4 beta'; score = $row.dv_rating_beta }
        @{ key = 'gpts_dv_gamma'; label = 'GPTs GPT-4 gamma'; score = $row.dv_rating_gamma }
        @{ key = 'gpts_human_alpha'; label = 'GPTs human alpha'; score = $row.human_rating_alpha }
        @{ key = 'gpts_human_beta'; label = 'GPTs human beta'; score = $row.human_rating_beta }
        @{ key = 'gpts_human_gamma'; label = 'GPTs human gamma'; score = $row.human_rating_gamma }
    )

    foreach ($metric in $metrics) {
        if ([string]::IsNullOrWhiteSpace([string]$metric.score)) {
            continue
        }

        $newSourceRows.Add([PSCustomObject]@{
            occupation_id = $occupationId
            benchmark_key = $metric.key
            benchmark_label = $metric.label
            benchmark_group = 'occupation_exposure'
            raw_score = '{0:N6}' -f [double]$metric.score
            percentile = ''
            source_id = 'src_openai_gpts_are_gpts_2023'
            release_date = '2023-03-17'
            notes = 'benchmark_only|matched_via_onet_soc|openai_occ_level'
        })
    }
}

$latestAutoBySoc = @{}
foreach ($row in $autoScoreRows) {
    $simpleSoc = $row.simpleOcc
    if ([string]::IsNullOrWhiteSpace($simpleSoc)) {
        continue
    }

    if (-not $latestAutoBySoc.ContainsKey($simpleSoc) -or [int]$row.year -gt [int]$latestAutoBySoc[$simpleSoc].year) {
        $latestAutoBySoc[$simpleSoc] = $row
    }
}

foreach ($simpleSoc in $latestAutoBySoc.Keys) {
    if (-not $occupationBySimpleSoc.ContainsKey($simpleSoc)) {
        continue
    }

    $row = $latestAutoBySoc[$simpleSoc]
    $occupationId = $occupationBySimpleSoc[$simpleSoc].occupation_id
    $metrics = @(
        @{ key = 'webb_ai'; label = 'Webb AI'; score = $row.pct_ai; source_id = 'src_webb_2020'; notes = 'benchmark_only|mirrored_via_openai_autoscores|measure=pct_ai' }
        @{ key = 'webb_robot'; label = 'Webb robotics'; score = $row.pct_robot; source_id = 'src_webb_2020'; notes = 'benchmark_only|mirrored_via_openai_autoscores|measure=pct_robot' }
        @{ key = 'webb_software'; label = 'Webb software'; score = $row.pct_software; source_id = 'src_webb_2020'; notes = 'benchmark_only|mirrored_via_openai_autoscores|measure=pct_software' }
        @{ key = 'sml'; label = 'SML'; score = $row.mSML; source_id = 'src_brynjolfsson_mitchell_rock_2018'; notes = 'benchmark_only|mirrored_via_openai_autoscores|measure=mSML' }
    )

    foreach ($metric in $metrics) {
        if ([string]::IsNullOrWhiteSpace([string]$metric.score)) {
            continue
        }

        $newSourceRows.Add([PSCustomObject]@{
            occupation_id = $occupationId
            benchmark_key = $metric.key
            benchmark_label = $metric.label
            benchmark_group = 'occupation_exposure'
            raw_score = '{0:N6}' -f [double]$metric.score
            percentile = ''
            source_id = $metric.source_id
            release_date = '2023-03-17'
            notes = $metric.notes
        })
    }
}

$mergedSourceByKey = @{}
foreach ($row in $retainedSourceRows) {
    $mergedSourceByKey["$($row.occupation_id)|$($row.benchmark_key)"] = $row
}
foreach ($row in $newSourceRows) {
    $mergedSourceByKey["$($row.occupation_id)|$($row.benchmark_key)"] = $row
}

$mergedSourceRows = @($mergedSourceByKey.Values)
foreach ($benchmarkKey in ($mergedSourceRows | Select-Object -ExpandProperty benchmark_key -Unique)) {
    $rowsForKey = @($mergedSourceRows | Where-Object { $_.benchmark_key -eq $benchmarkKey })
    $pctMap = New-PercentileMap -Rows $rowsForKey -ScoreColumn 'raw_score'
    foreach ($row in $rowsForKey) {
        $row.percentile = if ($pctMap.ContainsKey($row.occupation_id)) { '{0:N4}' -f [double]$pctMap[$row.occupation_id] } else { '' }
    }
}

$mergedSourceRows = @($mergedSourceRows | Sort-Object occupation_id, benchmark_key)
$mergedSourceRows | Export-Csv -Path $existingSourcePath -NoTypeInformation -Encoding UTF8

$wideByOccupation = @{}
foreach ($row in $existingWide) {
    $wideByOccupation[$row.occupation_id] = [PSCustomObject]@{
        occupation_id = $row.occupation_id
        aioe_score = $row.aioe_score
        aioe_percentile = $row.aioe_percentile
        lm_aioe_score = $row.lm_aioe_score
        lm_aioe_percentile = $row.lm_aioe_percentile
        webb_ai_score = ''
        webb_ai_percentile = ''
        webb_robot_score = ''
        webb_robot_percentile = ''
        webb_software_score = ''
        webb_software_percentile = ''
        sml_score = ''
        sml_percentile = ''
        gpts_dv_beta_score = ''
        gpts_dv_beta_percentile = ''
        gpts_human_beta_score = ''
        gpts_human_beta_percentile = ''
        benchmark_mean_percentile = $row.benchmark_mean_percentile
        source_id = 'src_benchmark_bundle_2026_03'
        confidence = $row.confidence
        notes = $row.notes
    }
}

foreach ($occupation in $occupations) {
    if (-not $wideByOccupation.ContainsKey($occupation.occupation_id)) {
        $wideByOccupation[$occupation.occupation_id] = [PSCustomObject]@{
            occupation_id = $occupation.occupation_id
            aioe_score = ''
            aioe_percentile = ''
            lm_aioe_score = ''
            lm_aioe_percentile = ''
            webb_ai_score = ''
            webb_ai_percentile = ''
            webb_robot_score = ''
            webb_robot_percentile = ''
            webb_software_score = ''
            webb_software_percentile = ''
            sml_score = ''
            sml_percentile = ''
            gpts_dv_beta_score = ''
            gpts_dv_beta_percentile = ''
            gpts_human_beta_score = ''
            gpts_human_beta_percentile = ''
            benchmark_mean_percentile = ''
            source_id = 'src_benchmark_bundle_2026_03'
            confidence = '0.00'
            notes = 'benchmark_only'
        }
    }
}

$rowsByOccupation = $mergedSourceRows | Group-Object occupation_id
foreach ($group in $rowsByOccupation) {
    $row = $wideByOccupation[$group.Name]
    foreach ($entry in $group.Group) {
        switch ($entry.benchmark_key) {
            'aioe' {
                $row.aioe_score = $entry.raw_score
                $row.aioe_percentile = $entry.percentile
            }
            'lm_aioe' {
                $row.lm_aioe_score = $entry.raw_score
                $row.lm_aioe_percentile = $entry.percentile
            }
            'webb_ai' {
                $row.webb_ai_score = $entry.raw_score
                $row.webb_ai_percentile = $entry.percentile
            }
            'webb_robot' {
                $row.webb_robot_score = $entry.raw_score
                $row.webb_robot_percentile = $entry.percentile
            }
            'webb_software' {
                $row.webb_software_score = $entry.raw_score
                $row.webb_software_percentile = $entry.percentile
            }
            'sml' {
                $row.sml_score = $entry.raw_score
                $row.sml_percentile = $entry.percentile
            }
            'gpts_dv_beta' {
                $row.gpts_dv_beta_score = $entry.raw_score
                $row.gpts_dv_beta_percentile = $entry.percentile
            }
            'gpts_human_beta' {
                $row.gpts_human_beta_score = $entry.raw_score
                $row.gpts_human_beta_percentile = $entry.percentile
            }
        }
    }

    $percentiles = @()
    foreach ($value in @(
        $row.aioe_percentile,
        $row.lm_aioe_percentile,
        $row.webb_ai_percentile,
        $row.webb_robot_percentile,
        $row.webb_software_percentile,
        $row.sml_percentile,
        $row.gpts_dv_beta_percentile,
        $row.gpts_human_beta_percentile
    )) {
        if (-not [string]::IsNullOrWhiteSpace([string]$value)) {
            $percentiles += [double]$value
        }
    }

    $row.benchmark_mean_percentile = if ($percentiles.Count) {
        '{0:N4}' -f (($percentiles | Measure-Object -Average).Average)
    } else {
        ''
    }

    $row.confidence = if ($percentiles.Count) {
        '{0:N2}' -f ([Math]::Min(0.93, 0.45 + (0.06 * $percentiles.Count)))
    } else {
        '0.00'
    }

    $row.notes = ('benchmark_only|aioe={0}|lm_aioe={1}|webb_ai={2}|webb_robot={3}|webb_software={4}|sml={5}|gpts_dv_beta={6}|gpts_human_beta={7}' -f
        ([bool]$row.aioe_score).ToString().ToLowerInvariant(),
        ([bool]$row.lm_aioe_score).ToString().ToLowerInvariant(),
        ([bool]$row.webb_ai_score).ToString().ToLowerInvariant(),
        ([bool]$row.webb_robot_score).ToString().ToLowerInvariant(),
        ([bool]$row.webb_software_score).ToString().ToLowerInvariant(),
        ([bool]$row.sml_score).ToString().ToLowerInvariant(),
        ([bool]$row.gpts_dv_beta_score).ToString().ToLowerInvariant(),
        ([bool]$row.gpts_human_beta_score).ToString().ToLowerInvariant()
    )
}

$wideRows = @($wideByOccupation.Values | Sort-Object occupation_id)
$wideRows | Export-Csv -Path (Join-Path $OutputDir 'occupation_benchmark_scores.csv') -NoTypeInformation -Encoding UTF8

$taskOutputRows = New-Object System.Collections.Generic.List[object]
foreach ($row in $taskLabelRows) {
    $soc = Normalize-SocCode $row.'O*NET-SOC Code'
    if (-not $occupationBySoc.ContainsKey($soc)) {
        continue
    }

    $occupationId = $occupationBySoc[$soc].occupation_id
    $taskId = [string]$row.'Task ID'
    if (-not $taskLookup.ContainsKey("$occupationId|$taskId")) {
        continue
    }

    $taskOutputRows.Add([PSCustomObject]@{
        occupation_id = $occupationId
        onet_task_id = $taskId
        gpt4_automation_label = [string]$row.gpt4_automation
        gpt4_automation_score = Get-LabelScore $row.gpt4_automation
        human_automation_label = [string]$row.human_automation
        human_automation_score = Get-LabelScore $row.human_automation
        source_id = 'src_openai_gpts_are_gpts_2023'
        notes = 'benchmark_only|matched_via_onet_soc_and_task_id'
    })
}

$taskOutputByKey = @{}
foreach ($row in $taskOutputRows) {
    $taskOutputByKey["$($row.occupation_id)|$($row.onet_task_id)"] = $row
}
foreach ($row in $taskBenchmarkManualRows) {
    if ([string]::IsNullOrWhiteSpace([string]$row.occupation_id) -or [string]::IsNullOrWhiteSpace([string]$row.onet_task_id)) {
        continue
    }

    $taskKey = "$($row.occupation_id)|$($row.onet_task_id)"
    if (-not $taskLookup.ContainsKey($taskKey)) {
        continue
    }

    $taskOutputByKey[$taskKey] = [PSCustomObject]@{
        occupation_id = [string]$row.occupation_id
        onet_task_id = [string]$row.onet_task_id
        gpt4_automation_label = [string]$row.gpt4_automation_label
        gpt4_automation_score = if (-not [string]::IsNullOrWhiteSpace([string]$row.gpt4_automation_score)) { [string]$row.gpt4_automation_score } else { Get-LabelScore $row.gpt4_automation_label }
        human_automation_label = [string]$row.human_automation_label
        human_automation_score = if (-not [string]::IsNullOrWhiteSpace([string]$row.human_automation_score)) { [string]$row.human_automation_score } else { Get-LabelScore $row.human_automation_label }
        source_id = if (-not [string]::IsNullOrWhiteSpace([string]$row.source_id)) { [string]$row.source_id } else { 'src_openai_gpts_are_gpts_2023' }
        notes = if (-not [string]::IsNullOrWhiteSpace([string]$row.notes)) { [string]$row.notes } else { 'benchmark_only|manual_bridge' }
    }
}

@($taskOutputByKey.Values) |
    Sort-Object occupation_id, onet_task_id |
    Export-Csv -Path (Join-Path $OutputDir 'task_benchmark_gpt4_labels.csv') -NoTypeInformation -Encoding UTF8

[PSCustomObject]@{
    occupation_benchmark_source_rows = $mergedSourceRows.Count
    occupation_benchmark_rows = $wideRows.Count
    task_benchmark_rows = $taskOutputByKey.Count
    source_dir = $SourceDir
} | Format-List
