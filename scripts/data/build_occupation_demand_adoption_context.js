const fs = require('fs');
const path = require('path');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  if (!rows.length) {
    return [];
  }

  const header = rows[0].map((column, index) => index === 0 ? String(column || '').replace(/^\uFEFF/, '') : column);
  return rows.slice(1)
    .filter((entry) => entry.some((value) => String(value || '').trim().length))
    .map((entry) => {
      const record = {};
      header.forEach((column, index) => {
        record[column] = entry[index] !== undefined ? entry[index] : '';
      });
      return record;
    });
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numeric = Number(String(value).trim());
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function percentileRanks(values, invert = false) {
  const valid = values.filter((value) => typeof value === 'number' && !Number.isNaN(value)).sort((a, b) => a - b);
  const unique = Array.from(new Set(valid));
  const map = new Map();
  if (!unique.length) {
    return map;
  }
  unique.forEach((value, index) => {
    const pct = unique.length === 1 ? 0.5 : (index / (unique.length - 1));
    map.set(value, invert ? (1 - pct) : pct);
  });
  return map;
}

function blendAvailable(entries, fallback = null) {
  let numerator = 0;
  let denominator = 0;
  entries.forEach(([value, weight]) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return;
    }
    const safeWeight = Number.isFinite(weight) ? weight : 0;
    if (safeWeight <= 0) {
      return;
    }
    numerator += value * safeWeight;
    denominator += safeWeight;
  });
  return denominator > 0 ? (numerator / denominator) : fallback;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const normalizedDir = path.join(repoRoot, 'data', 'normalized');
  const outputPath = path.join(normalizedDir, 'occupation_demand_adoption_context.csv');

  const occupations = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupations.csv'), 'utf8'))
    .filter((row) => String(row.is_active || '1') !== '0');
  const laborRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_labor_market_context.csv'), 'utf8'));
  const btosRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'industry_ai_adoption_context.csv'), 'utf8'));
  const btosSectorMixRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_btos_sector_mix.csv'), 'utf8'));

  const laborById = Object.fromEntries(laborRows.map((row) => [row.occupation_id, row]));
  const btosBySector = Object.fromEntries(btosRows.map((row) => [row.btos_sector_code, row]));
  const btosSectorMixById = btosSectorMixRows.reduce((map, row) => {
    if (!map[row.occupation_id]) {
      map[row.occupation_id] = [];
    }
    map[row.occupation_id].push(row);
    return map;
  }, {});

  const laborDerived = occupations.map((occupation) => {
    const labor = laborById[occupation.occupation_id] || {};
    const openings = toNumber(labor.annual_openings, null);
    const employment = toNumber(labor.employment_us, null);
    return {
      occupation_id: occupation.occupation_id,
      projection_growth_pct: toNumber(labor.projection_growth_pct, null),
      openings_rate: openings !== null && employment && employment > 0 ? (openings / employment) : null,
      unemployment_rate: toNumber(labor.latest_unemployment_rate, null)
    };
  });

  const growthRanks = percentileRanks(laborDerived.map((row) => row.projection_growth_pct));
  const openingsRanks = percentileRanks(laborDerived.map((row) => row.openings_rate));
  const inverseUnemploymentRanks = percentileRanks(laborDerived.map((row) => row.unemployment_rate), true);

  const btosSignals = occupations.map((occupation) => {
    const rows = btosSectorMixById[occupation.occupation_id] || [];
    const coveredShare = rows.length
      ? clamp(Math.max(...rows.map((row) => toNumber(row.covered_sector_share, 0))), 0, 1)
      : 0;
    const weightedAdoptionIndex = rows.length
      ? blendAvailable(rows.map((row) => {
        const sector = btosBySector[row.btos_sector_code];
        return [sector ? toNumber(sector.adoption_context_index, null) : null, toNumber(row.covered_sector_share_normalized, 0)];
      }), null)
      : null;
    const weightedCurrentAiUse = rows.length
      ? blendAvailable(rows.map((row) => {
        const sector = btosBySector[row.btos_sector_code];
        return [sector ? toNumber(sector.current_ai_use_share, null) : null, toNumber(row.covered_sector_share_normalized, 0)];
      }), null)
      : null;
    const weightedWorkflowChange = rows.length
      ? blendAvailable(rows.map((row) => {
        const sector = btosBySector[row.btos_sector_code];
        return [sector ? toNumber(sector.workflow_change_intensity, null) : null, toNumber(row.covered_sector_share_normalized, 0)];
      }), null)
      : null;
    const confidence = weightedAdoptionIndex === null
      ? 0
      : clamp(blendAvailable(rows.map((row) => {
        const sector = btosBySector[row.btos_sector_code];
        return [sector ? toNumber(sector.btos_confidence, 0.5) : null, toNumber(row.covered_sector_share_normalized, 0)];
      }), 0.5) * 0.7 + coveredShare * 0.3, 0, 1);

    return {
      occupation_id: occupation.occupation_id,
      btos_covered_sector_share: coveredShare,
      weighted_adoption_index: weightedAdoptionIndex,
      weighted_current_ai_use: weightedCurrentAiUse,
      weighted_workflow_change: weightedWorkflowChange,
      adoption_confidence: confidence
    };
  });

  const btosById = Object.fromEntries(btosSignals.map((row) => [row.occupation_id, row]));
  const adoptionRanks = percentileRanks(btosSignals.map((row) => row.weighted_adoption_index));
  const currentUseRanks = percentileRanks(btosSignals.map((row) => row.weighted_current_ai_use));
  const workflowChangeRanks = percentileRanks(btosSignals.map((row) => row.weighted_workflow_change));

  const rows = occupations.map((occupation) => {
    const labor = laborById[occupation.occupation_id] || {};
    const laborSignal = laborDerived.find((row) => row.occupation_id === occupation.occupation_id) || {};
    const btos = btosById[occupation.occupation_id] || {};
    const growthPct = laborSignal.projection_growth_pct;
    const openingsRate = laborSignal.openings_rate;
    const unemploymentRate = laborSignal.unemployment_rate;

    const growthPctPct = growthPct === null ? 0.5 : (growthRanks.get(growthPct) ?? 0.5);
    const openingsRatePct = openingsRate === null ? 0.5 : (openingsRanks.get(openingsRate) ?? 0.5);
    const inverseUnemploymentPct = unemploymentRate === null ? 0.5 : (inverseUnemploymentRanks.get(unemploymentRate) ?? 0.5);
    const weightedAdoptionIndexPct = btos.weighted_adoption_index === null ? 0.5 : (adoptionRanks.get(btos.weighted_adoption_index) ?? 0.5);
    const weightedCurrentAiUsePct = btos.weighted_current_ai_use === null ? 0.5 : (currentUseRanks.get(btos.weighted_current_ai_use) ?? 0.5);
    const weightedWorkflowChangePct = btos.weighted_workflow_change === null ? 0.5 : (workflowChangeRanks.get(btos.weighted_workflow_change) ?? 0.5);

    const laborDemandContext = clamp(
      (growthPctPct * 0.55) +
      (openingsRatePct * 0.25) +
      (inverseUnemploymentPct * 0.20),
      0,
      1
    );
    const laborTightnessContext = clamp(
      (openingsRatePct * 0.60) +
      (inverseUnemploymentPct * 0.40),
      0,
      1
    );
    const aiAdoptionContext = clamp(
      (weightedAdoptionIndexPct * 0.55) +
      (weightedCurrentAiUsePct * 0.20) +
      (weightedWorkflowChangePct * 0.15) +
      (clamp(toNumber(btos.btos_covered_sector_share, 0), 0, 1) * 0.10),
      0,
      1
    );
    const demandExpansionContext = clamp(
      (laborDemandContext * 0.70) +
      (laborTightnessContext * 0.30),
      0,
      1
    );
    const adoptionRealizationContext = clamp(
      (aiAdoptionContext * 0.70) +
      (clamp(toNumber(btos.adoption_confidence, 0), 0, 1) * 0.15) +
      (laborTightnessContext * 0.15),
      0,
      1
    );
    const laborConfidence = clamp(toNumber(labor.labor_market_confidence, 0.5), 0, 1);
    const adoptionConfidence = clamp(toNumber(btos.adoption_confidence, 0), 0, 1);
    const contextConfidence = clamp((laborConfidence * 0.55) + (adoptionConfidence * 0.45), 0, 1);

    return {
      occupation_id: occupation.occupation_id,
      demand_expansion_context: demandExpansionContext.toFixed(4),
      labor_demand_context: laborDemandContext.toFixed(4),
      labor_tightness_context: laborTightnessContext.toFixed(4),
      ai_adoption_context: aiAdoptionContext.toFixed(4),
      adoption_realization_context: adoptionRealizationContext.toFixed(4),
      labor_context_confidence: laborConfidence.toFixed(4),
      adoption_context_confidence: adoptionConfidence.toFixed(4),
      context_confidence: contextConfidence.toFixed(4),
      btos_covered_sector_share: clamp(toNumber(btos.btos_covered_sector_share, 0), 0, 1).toFixed(4),
      source_mix: 'src_bls_proj_2024_2034|src_bls_cps_occupation_unemployment_2026_03|src_bls_oews_2024|src_census_acs_2024_1yr_pums_api|src_census_btos_2026_03',
      notes: [
        `growth_pct_pct=${growthPctPct.toFixed(3)}`,
        `openings_rate_pct=${openingsRatePct.toFixed(3)}`,
        `inverse_unemployment_pct=${inverseUnemploymentPct.toFixed(3)}`,
        `btos_adoption_pct=${weightedAdoptionIndexPct.toFixed(3)}`,
        `btos_current_ai_use_pct=${weightedCurrentAiUsePct.toFixed(3)}`,
        `btos_workflow_change_pct=${weightedWorkflowChangePct.toFixed(3)}`
      ].join('|')
    };
  });

  const header = [
    'occupation_id',
    'demand_expansion_context',
    'labor_demand_context',
    'labor_tightness_context',
    'ai_adoption_context',
    'adoption_realization_context',
    'labor_context_confidence',
    'adoption_context_confidence',
    'context_confidence',
    'btos_covered_sector_share',
    'source_mix',
    'notes'
  ];

  const csv = [
    header.join(','),
    ...rows.map((row) => header.map((key) => csvEscape(row[key])).join(','))
  ].join('\n') + '\n';

  fs.writeFileSync(outputPath, csv, 'utf8');
  console.log(`Wrote ${rows.length} occupation runtime context rows to ${path.relative(repoRoot, outputPath)}`);
}

main();
