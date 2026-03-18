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

  const header = rows[0].map((column, index) => {
    if (index === 0) {
      return String(column || '').replace(/^\uFEFF/, '');
    }
    return column;
  });

  return rows
    .slice(1)
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

function average(values, fallback = null) {
  const numeric = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!numeric.length) {
    return fallback;
  }
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
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

function percentileRanks(values) {
  const valid = values
    .filter((value) => typeof value === 'number' && !Number.isNaN(value))
    .sort((a, b) => a - b);
  const unique = Array.from(new Set(valid));
  const ranks = new Map();
  if (!unique.length) {
    return ranks;
  }
  unique.forEach((value, index) => {
    const pct = unique.length === 1 ? 0.5 : (index / (unique.length - 1));
    ranks.set(value, pct);
  });
  return ranks;
}

function parseNoteMetric(noteText, metricKey) {
  const notes = String(noteText || '');
  const pattern = new RegExp(`${metricKey}=([0-9.]+)`, 'i');
  const match = notes.match(pattern);
  return match ? toNumber(match[1], null) : null;
}

function uniqueStrings(values) {
  const seen = {};
  return values.filter((value) => {
    const normalized = String(value || '').trim();
    if (!normalized || seen[normalized]) {
      return false;
    }
    seen[normalized] = true;
    return true;
  });
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const normalizedDir = path.join(repoRoot, 'data', 'normalized');
  const outputPath = path.join(normalizedDir, 'occupation_function_context.csv');

  const occupations = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupations.csv'), 'utf8'))
    .filter((row) => String(row.is_active || '').toLowerCase() !== 'false');
  const orsRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_ors_structural_context.csv'), 'utf8'));
  const qualityRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_quality_indicators.csv'), 'utf8'));
  const heterogeneityRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_heterogeneity_context.csv'), 'utf8'));
  const adaptationRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_adaptation_priors.csv'), 'utf8'));
  const laborRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_labor_market_context.csv'), 'utf8'));
  const demandRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_demand_adoption_context.csv'), 'utf8'));

  const orsById = Object.fromEntries(orsRows.map((row) => [row.occupation_id, row]));
  const qualityById = Object.fromEntries(qualityRows.map((row) => [row.occupation_id, row]));
  const heterogeneityById = Object.fromEntries(heterogeneityRows.map((row) => [row.occupation_id, row]));
  const adaptationById = Object.fromEntries(adaptationRows.map((row) => [row.occupation_id, row]));
  const laborById = Object.fromEntries(laborRows.map((row) => [row.occupation_id, row]));
  const demandById = Object.fromEntries(demandRows.map((row) => [row.occupation_id, row]));

  const wageValues = laborRows.map((row) => toNumber(row.median_wage_usd, null));
  const wageRanks = percentileRanks(wageValues);

  const header = [
    'occupation_id',
    'accountability_context',
    'bargaining_power_context',
    'fragmentation_context',
    'accountability_context_confidence',
    'bargaining_context_confidence',
    'fragmentation_context_confidence',
    'ors_guardrail_signal',
    'expert_scarcity_signal',
    'heterogeneity_fragmentation_signal',
    'source_mix',
    'notes'
  ];

  const rows = occupations.map((occupation) => {
    const ors = orsById[occupation.occupation_id] || {};
    const quality = qualityById[occupation.occupation_id] || {};
    const heterogeneity = heterogeneityById[occupation.occupation_id] || {};
    const adaptation = adaptationById[occupation.occupation_id] || {};
    const labor = laborById[occupation.occupation_id] || {};
    const demand = demandById[occupation.occupation_id] || {};

    const knowledgeShare = clamp(parseNoteMetric(adaptation.notes, 'knowledge_share') ?? 0.35, 0, 1);
    const peopleShare = clamp(parseNoteMetric(adaptation.notes, 'people_share') ?? 0.35, 0, 1);
    const routineShare = clamp(parseNoteMetric(adaptation.notes, 'routine_share') ?? 0.25, 0, 1);
    const normalizedJobZone = clamp((clamp(toNumber(adaptation.job_zone, 3), 1, 5) - 1) / 4, 0, 1);
    const wagePct = (() => {
      const wage = toNumber(labor.median_wage_usd, null);
      return wage === null ? 0.5 : (wageRanks.get(wage) ?? 0.5);
    })();

    const orsGuardrailSignal = blendAvailable([
      [toNumber(ors.human_constraint_index, null), 0.44],
      [toNumber(ors.autonomy_intensity, null), 0.16],
      [toNumber(ors.supervising_others_share, null), 0.12],
      [toNumber(ors.people_skill_intensity, null), 0.10],
      [toNumber(ors.review_intensity, null), 0.08],
      [toNumber(ors.pause_control_share, null), 0.06],
      [toNumber(ors.people_control_share, null), 0.04]
    ], null);

    const qualityAccountabilitySignal = clamp(blendAvailable([
      [toNumber(quality.autonomy_proxy, null), 0.42],
      [toNumber(quality.social_interaction_intensity, null), 0.22],
      [toNumber(quality.labor_market_security_proxy, null), 0.16],
      [toNumber(quality.working_environment_quality_proxy, null), 0.10],
      [toNumber(quality.learning_opportunity_proxy, null), 0.10]
    ], 0.50), 0, 1);

    const accountabilityContext = clamp(
      blendAvailable([
        [orsGuardrailSignal, 0.72],
        [qualityAccountabilitySignal, 0.28]
      ], qualityAccountabilitySignal),
      0,
      1
    );

    const expertScarcitySignal = clamp(blendAvailable([
      [toNumber(quality.earnings_quality_proxy, null), 0.20],
      [toNumber(quality.labor_market_security_proxy, null), 0.12],
      [toNumber(quality.autonomy_proxy, null), 0.12],
      [toNumber(quality.learning_opportunity_proxy, null), 0.10],
      [wagePct, 0.12],
      [toNumber(heterogeneity.wage_dispersion_percentile, null), 0.08],
      [knowledgeShare, 0.10],
      [toNumber(adaptation.adaptive_capacity_score, null), 0.08],
      [toNumber(adaptation.learning_intensity_score, null), 0.08],
      [toNumber(demand.labor_tightness_context, null), 0.10]
    ], 0.50), 0, 1);

    const bargainingPowerContext = clamp(
      blendAvailable([
        [expertScarcitySignal, 0.76],
        [accountabilityContext, 0.14],
        [toNumber(demand.labor_demand_context, null), 0.10]
      ], expertScarcitySignal),
      0,
      1
    );

    const heterogeneityFragmentationSignal = clamp(blendAvailable([
      [toNumber(heterogeneity.heterogeneity_index, null), 0.50],
      [toNumber(heterogeneity.industry_dispersion, null), 0.15],
      [toNumber(heterogeneity.education_dispersion, null), 0.10],
      [1 - peopleShare, 0.15],
      [routineShare, 0.10]
    ], 0.35), 0, 1);

    const fragmentationContext = clamp(
      blendAvailable([
        [heterogeneityFragmentationSignal, 0.74],
        [1 - accountabilityContext, 0.12],
        [1 - normalizedJobZone, 0.06],
        [1 - knowledgeShare, 0.08]
      ], heterogeneityFragmentationSignal),
      0,
      1
    );

    const accountabilityContextConfidence = clamp(blendAvailable([
      [toNumber(ors.ors_confidence, null), 0.72],
      [toNumber(quality.quality_confidence, null), 0.28]
    ], 0.42), 0, 1);

    const bargainingContextConfidence = clamp(average([
      toNumber(quality.quality_confidence, null),
      toNumber(labor.labor_market_confidence, null),
      toNumber(adaptation.confidence, null),
      toNumber(demand.context_confidence, null)
    ], 0.55), 0, 1);

    const fragmentationContextConfidence = clamp(average([
      toNumber(heterogeneity.acs_confidence, null),
      toNumber(adaptation.confidence, null)
    ], 0.55), 0, 1);

    return {
      occupation_id: occupation.occupation_id,
      accountability_context: accountabilityContext.toFixed(4),
      bargaining_power_context: bargainingPowerContext.toFixed(4),
      fragmentation_context: fragmentationContext.toFixed(4),
      accountability_context_confidence: accountabilityContextConfidence.toFixed(4),
      bargaining_context_confidence: bargainingContextConfidence.toFixed(4),
      fragmentation_context_confidence: fragmentationContextConfidence.toFixed(4),
      ors_guardrail_signal: orsGuardrailSignal === null ? '' : orsGuardrailSignal.toFixed(4),
      expert_scarcity_signal: expertScarcitySignal.toFixed(4),
      heterogeneity_fragmentation_signal: heterogeneityFragmentationSignal.toFixed(4),
      source_mix: uniqueStrings([
        String(ors.source_mix || '').trim(),
        String(quality.source_mix || '').trim(),
        String(heterogeneity.source_mix || '').trim(),
        String(adaptation.source_mix || '').trim(),
        String(labor.source_mix || '').trim(),
        String(demand.source_mix || '').trim(),
        'src_runtime_function_context_2026_03'
      ]).join('|'),
      notes: [
        `knowledge_share=${knowledgeShare.toFixed(3)}`,
        `people_share=${peopleShare.toFixed(3)}`,
        `routine_share=${routineShare.toFixed(3)}`,
        `job_zone_norm=${normalizedJobZone.toFixed(3)}`,
        `wage_pct=${wagePct.toFixed(3)}`
      ].join('|')
    };
  });

  const csvLines = [header.join(',')].concat(rows.map((row) => (
    header.map((column) => csvEscape(row[column])).join(',')
  )));

  fs.writeFileSync(outputPath, `${csvLines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${rows.length} function context rows to ${path.relative(repoRoot, outputPath)}`);
}

main();
