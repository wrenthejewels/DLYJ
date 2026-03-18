param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$SourceDir,
    [string]$OutputDir,
    [switch]$IncludeCandidates,
    [switch]$RebuildSelector
)

$ErrorActionPreference = 'Stop'

if (-not $SourceDir) {
    $SourceDir = Join-Path $Root 'data\raw\bls'
}
if (-not $OutputDir) {
    $OutputDir = Join-Path $Root 'data\normalized'
}

function Convert-ToOccupationId([string]$SocCode) {
    return 'occ_' + ($SocCode -replace '[-\.]', '_')
}

function Import-RequiredCsv([string]$Path) {
    if (!(Test-Path $Path)) {
        throw "Missing required BLS extract: $Path"
    }
    return Import-Csv $Path
}

function Get-RowValue {
    param(
        [Parameter(Mandatory)] [pscustomobject]$Row,
        [Parameter(Mandatory)] [string[]]$Candidates
    )

    foreach ($candidate in $Candidates) {
        $property = $Row.PSObject.Properties[$candidate]
        if ($property -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
            return [string]$property.Value
        }
    }

    return $null
}

function Get-LaborMarketConfidence {
    param(
        [Parameter(Mandatory)] [pscustomobject]$Row
    )

    $raw = Get-RowValue -Row $Row -Candidates @('labor_market_confidence')
    if ($raw -and $raw -match '^[0-9]+(\.[0-9]+)?$') {
        return ('{0:N2}' -f [double]$raw)
    }
    return '0.85'
}

function Try-ParseNumber {
    param(
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $trimmed = $Value.Trim()
    if ($trimmed -in @('*', '**', '#')) {
        return $null
    }

    $number = 0.0
    if ([double]::TryParse($trimmed, [ref]$number)) {
        return $number
    }

    return $null
}

function Normalize-SocCode {
    param(
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $normalized = $Value.Trim()
    $normalized = $normalized -replace '^=+', ''
    $normalized = $normalized -replace '^"+', ''
    $normalized = $normalized -replace '"+$', ''
    if ($normalized -match '^\d{2}-\d{4}$') {
        return "$normalized.00"
    }
    return $normalized
}

function Get-BroadSocCode {
    param(
        [string]$Value
    )

    $normalized = Normalize-SocCode $Value
    if ([string]::IsNullOrWhiteSpace($normalized)) {
        return $null
    }

    if ($normalized -match '^(\d{2}-\d{3})\d\.\d{2}$') {
        return '{0}0.00' -f $Matches[1]
    }

    return $normalized
}

$metadataDir = Join-Path $Root 'data\metadata'
$launchSeed = Import-Csv (Join-Path $metadataDir 'launch_occupation_seed.csv')
if (-not $IncludeCandidates) {
    $launchSeed = $launchSeed | Where-Object { $_.status -eq 'selected' }
}
$seedBySoc = @{}
foreach ($row in $launchSeed) {
    $seedBySoc[$row.provisional_onet_soc_code] = $row
}

$oews = Import-RequiredCsv (Join-Path $SourceDir 'oews_may_2024_extract.csv')
$oewsBySoc = @{}
foreach ($row in $oews) {
    $soc = Normalize-SocCode (Get-RowValue -Row $row -Candidates @('onet_soc_code', 'occ_code'))
    if ($soc) {
        $oewsBySoc[$soc] = $row
    }
}

$projectionPath = Join-Path $SourceDir 'occupational_projections_2024_2034_extract.csv'
if (-not (Test-Path $projectionPath)) {
    $projectionPath = Join-Path $SourceDir 'Employment Projections.csv'
}
$projectionBySoc = @{}
if (Test-Path $projectionPath) {
    $projections = Import-Csv $projectionPath
    foreach ($row in $projections) {
        $soc = Normalize-SocCode (Get-RowValue -Row $row -Candidates @('onet_soc_code', 'Occupation Code'))
        if ($soc) {
            $projectionBySoc[$soc] = $row
        }
    }
}

$existingLaborPath = Join-Path $OutputDir 'occupation_labor_market_context.csv'
$existingLaborByOcc = @{}
if (Test-Path $existingLaborPath) {
    foreach ($row in (Import-Csv $existingLaborPath)) {
        $existingLaborByOcc[$row.occupation_id] = $row
    }
}

$rows = New-Object System.Collections.Generic.List[object]
foreach ($seed in $launchSeed) {
    $soc = Normalize-SocCode $seed.provisional_onet_soc_code
    if (-not $soc) {
        continue
    }

    $broadSoc = Get-BroadSocCode $soc
    $row = if ($oewsBySoc.ContainsKey($soc)) {
        $oewsBySoc[$soc]
    } elseif ($broadSoc -and $oewsBySoc.ContainsKey($broadSoc)) {
        $oewsBySoc[$broadSoc]
    } else {
        $null
    }
    $projection = if ($projectionBySoc.ContainsKey($soc)) {
        $projectionBySoc[$soc]
    } elseif ($broadSoc -and $projectionBySoc.ContainsKey($broadSoc)) {
        $projectionBySoc[$broadSoc]
    } else {
        $null
    }
    $occupationId = Convert-ToOccupationId $soc
    $existingLabor = $existingLaborByOcc[$occupationId]
    if (-not $row -and -not $existingLabor) {
        continue
    }

    $employment = Try-ParseNumber (Get-RowValue -Row $row -Candidates @('employment_us'))
    if ($employment -eq $null) {
        $employment = Try-ParseNumber $existingLabor.employment_us
    }
    $existingAnnualOpenings = Try-ParseNumber $existingLabor.annual_openings
    $existingGrowth = Try-ParseNumber $existingLabor.projection_growth_pct
    $existingReleaseYear = Try-ParseNumber $existingLabor.release_year
    $medianWage = Try-ParseNumber (Get-RowValue -Row $row -Candidates @('median_wage_usd'))
    $wageP25 = Try-ParseNumber (Get-RowValue -Row $row -Candidates @('wage_p25_usd'))
    $wageP75 = Try-ParseNumber (Get-RowValue -Row $row -Candidates @('wage_p75_usd'))
    $projectionOpenings = if ($projection) {
        $directOpenings = Try-ParseNumber (Get-RowValue -Row $projection -Candidates @('annual_openings'))
        if ($directOpenings -ne $null) {
            $directOpenings
        } else {
            $rawOpenings = Try-ParseNumber (Get-RowValue -Row $projection -Candidates @('Occupational Openings, 2024-2034 Annual Average'))
            if ($rawOpenings -ne $null) { $rawOpenings * 1000.0 } else { $null }
        }
    } else { $null }
    $projectionGrowth = if ($projection) {
        $directGrowth = Try-ParseNumber (Get-RowValue -Row $projection -Candidates @('projection_growth_pct'))
        if ($directGrowth -ne $null) {
            $directGrowth
        } else {
            Try-ParseNumber (Get-RowValue -Row $projection -Candidates @('Employment Percent Change, 2024-2034'))
        }
    } else { $null }
    $projectionReleaseYear = if ($projection) { Try-ParseNumber $projection.release_year } else { $null }
    $rows.Add([PSCustomObject]@{
        occupation_id = $occupationId
        employment_us = [int]$employment
        annual_openings = if ($projectionOpenings -ne $null) { [int]$projectionOpenings } elseif ($existingAnnualOpenings -ne $null) { [int]$existingAnnualOpenings } else { [Math]::Max(1200, [Math]::Round($employment * 0.07)) }
        median_wage_usd = if ($medianWage -ne $null) { [int]$medianWage } elseif ($existingLabor.median_wage_usd) { [int]$existingLabor.median_wage_usd } else { 0 }
        wage_p25_usd = if ($wageP25 -ne $null) { [int]$wageP25 } elseif ($existingLabor.wage_p25_usd) { [int]$existingLabor.wage_p25_usd } else { 0 }
        wage_p75_usd = if ($wageP75 -ne $null) { [int]$wageP75 } elseif ($existingLabor.wage_p75_usd) { [int]$existingLabor.wage_p75_usd } else { 0 }
        projection_growth_pct = if ($projectionGrowth -ne $null) { [double]$projectionGrowth } elseif ($existingGrowth -ne $null) { [double]$existingGrowth } else { 0.0 }
        unemployment_group_id = $existingLabor.unemployment_group_id
        unemployment_group_label = $existingLabor.unemployment_group_label
        unemployment_series_id = $existingLabor.unemployment_series_id
        latest_unemployment_rate = $existingLabor.latest_unemployment_rate
        latest_unemployment_period = $existingLabor.latest_unemployment_period
        labor_market_confidence = if ($row) { Get-LaborMarketConfidence -Row $row } elseif ($existingLabor.labor_market_confidence) { ('{0:N2}' -f [double]$existingLabor.labor_market_confidence) } else { '0.85' }
        release_year = if ($projectionReleaseYear -ne $null) { [int]$projectionReleaseYear } elseif ($existingReleaseYear -ne $null) { [int]$existingReleaseYear } else { 2024 }
    })
}

$rows = $rows | Sort-Object occupation_id
$rows | Export-Csv -Path (Join-Path $OutputDir 'occupation_labor_market_context.csv') -NoTypeInformation -Encoding UTF8

if ($RebuildSelector) {
    & (Join-Path $PSScriptRoot 'build_selector_index.ps1') -Root $Root | Out-Null
}

[PSCustomObject]@{
    occupations_with_bls_context = $rows.Count
    source_dir = $SourceDir
    rebuilt_selector = [bool]$RebuildSelector
} | Format-List
