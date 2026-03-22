const fs = require('fs');
const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', '..', 'v2_engine.js'));

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

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numeric = Number(String(value).trim());
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function blendAvailable(pairs, fallback = null) {
  let numerator = 0;
  let denominator = 0;
  pairs.forEach(([value, weight]) => {
    const numericValue = toNumber(value, null);
    const numericWeight = toNumber(weight, 0);
    if (numericValue === null || !numericWeight) {
      return;
    }
    numerator += numericValue * numericWeight;
    denominator += numericWeight;
  });
  return denominator ? (numerator / denominator) : fallback;
}

function average(values, fallback = null) {
  const numeric = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!numeric.length) {
    return fallback;
  }
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function parseNoteMetric(noteText, metricKey) {
  const notes = String(noteText || '');
  const pattern = new RegExp(`${metricKey}=([0-9.]+)`, 'i');
  const match = notes.match(pattern);
  return match ? toNumber(match[1], null) : null;
}

function percentileRanks(values, reverse = false) {
  const numericValues = values
    .map((entry) => toNumber(entry, null))
    .filter((entry) => entry !== null)
    .sort((left, right) => left - right);

  if (!numericValues.length) {
    return new Map();
  }

  if (numericValues[0] === numericValues[numericValues.length - 1]) {
    return new Map(numericValues.map((value) => [value, 0.5]));
  }

  const unique = Array.from(new Set(numericValues));
  const map = new Map();

  unique.forEach((value, index) => {
    const rank = unique.length === 1 ? 0.5 : (index / (unique.length - 1));
    map.set(value, reverse ? (1 - rank) : rank);
  });

  return map;
}

function spearmanCorrelation(rows, leftKey, rightKey) {
  const filtered = rows.filter((row) => {
    return typeof row[leftKey] === 'number' && !Number.isNaN(row[leftKey]) &&
      typeof row[rightKey] === 'number' && !Number.isNaN(row[rightKey]);
  });

  if (filtered.length < 3) {
    return null;
  }

  const leftRanks = percentileRanks(filtered.map((row) => row[leftKey]));
  const rightRanks = percentileRanks(filtered.map((row) => row[rightKey]));
  const ranked = filtered.map((row) => {
    return {
      left: leftRanks.get(row[leftKey]),
      right: rightRanks.get(row[rightKey])
    };
  });

  const leftMean = ranked.reduce((sum, row) => sum + row.left, 0) / ranked.length;
  const rightMean = ranked.reduce((sum, row) => sum + row.right, 0) / ranked.length;
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;

  ranked.forEach((row) => {
    const leftDiff = row.left - leftMean;
    const rightDiff = row.right - rightMean;
    numerator += leftDiff * rightDiff;
    leftVariance += leftDiff * leftDiff;
    rightVariance += rightDiff * rightDiff;
  });

  if (!leftVariance || !rightVariance) {
    return null;
  }

  return numerator / Math.sqrt(leftVariance * rightVariance);
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatPct(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/a';
  }
  return `${Math.round(value * 100)}%`;
}

function formatMaybe(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/a';
  }
  return value.toFixed(3);
}

function gapTier(gap, confidence) {
  if (confidence >= 0.7 && gap >= 0.22) {
    return 'high';
  }
  if (confidence >= 0.5 && gap >= 0.18) {
    return 'medium';
  }
  if (gap >= 0.12) {
    return 'low';
  }
  return 'ok';
}

function priorityScore(review) {
  if (review === 'high') {
    return 3;
  }
  if (review === 'medium') {
    return 2;
  }
  if (review === 'low') {
    return 1;
  }
  return 0;
}

function calibrationStrengthMultiplier(strength) {
  if (strength === 'strong') {
    return 1.15;
  }
  if (strength === 'medium') {
    return 1.0;
  }
  if (strength === 'weak') {
    return 0.6;
  }
  return 0.75;
}

function recommendReviewLayer(row) {
  const candidates = [
    {
      layer: 'accountability_guardrails',
      strength: 'strong',
      reason: 'Human-constraint mismatch points to function anchors, accountability weights, or trust/liability guardrails.',
      review: row.human_constraint_review,
      score: row.human_constraint_gap * Math.max(row.human_constraint_confidence, 0.35) * calibrationStrengthMultiplier('strong')
    },
    {
      layer: 'adoption_realization',
      strength: 'medium',
      reason: 'BTOS adoption-context mismatch points to organizational conversion or adoption-realization assumptions rather than core task reachability.',
      review: row.adoption_context_review,
      score: row.adoption_context_gap * Math.max(row.adoption_context_confidence, 0.35) * calibrationStrengthMultiplier('medium')
    },
    {
      layer: 'demand_and_adoption',
      strength: 'weak',
      reason: 'Demand-context mismatch points to demand-expansion or adoption-realization assumptions rather than core task reachability.',
      review: row.demand_context_review,
      score: row.demand_context_gap * Math.max(row.demand_context_confidence, 0.35) * calibrationStrengthMultiplier('weak')
    },
    {
      layer: 'bargaining_power',
      strength: 'weak',
      reason: 'Wage-leverage mismatch points to retained bargaining-power weights or function-level leverage assumptions.',
      review: row.wage_leverage_review,
      score: row.wage_leverage_gap * Math.max(row.wage_leverage_confidence, 0.35) * calibrationStrengthMultiplier('weak')
    },
    {
      layer: 'task_pressure',
      strength: 'medium',
      reason: 'Routine-pressure mismatch points to task-pressure weighting, routine-share assumptions, or cluster/task mapping.',
      review: row.routine_pressure_review,
      score: row.routine_pressure_gap * Math.max(row.routine_pressure_confidence, 0.35) * calibrationStrengthMultiplier('medium')
    },
    {
      layer: 'recomposition_and_timing',
      strength: 'medium',
      reason: 'Recomposition-context mismatch points to workflow-compression, organizational-conversion, or wave-timing assumptions rather than core task reachability.',
      review: row.recomposition_context_review,
      score: row.recomposition_context_gap * Math.max(row.recomposition_context_confidence, 0.35) * calibrationStrengthMultiplier('medium')
    },
    {
      layer: 'specialization_resilience',
      strength: 'medium',
      reason: 'Specialization-resilience mismatch points to retained-function weighting, knowledge intensity assumptions, or adaptation priors.',
      review: row.specialization_resilience_review,
      score: row.specialization_resilience_gap * Math.max(row.specialization_resilience_confidence, 0.35) * calibrationStrengthMultiplier('medium')
    },
    {
      layer: 'role_shape_heterogeneity',
      strength: 'medium',
      reason: 'Role-heterogeneity mismatch points to occupation shape assumptions, missing multi-anchor variants, or overstated uniformity within the occupation.',
      review: row.role_heterogeneity_review,
      score: row.role_heterogeneity_gap * Math.max(row.role_heterogeneity_confidence, 0.35) * calibrationStrengthMultiplier('medium')
    },
    {
      layer: 'individual_ai_usage',
      strength: 'weak',
      reason: 'Individual AI usage mismatch points to a gap between observed worker-level Claude adoption and the model\'s org-level adoption context. Large individual_higher gaps may indicate workers adapting faster than the org-adoption signal captures.',
      review: row.individual_usage_review,
      score: (row.individual_usage_gap ?? 0) * Math.max(row.individual_usage_confidence ?? 0, 0.35) * calibrationStrengthMultiplier('weak')
    }
  ];

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0];
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const normalizedDir = path.join(repoRoot, 'data', 'normalized');
  const reportPath = path.join(repoRoot, 'docs', 'data', 'structural_calibration_report.md');
  const targetPath = path.join(normalizedDir, 'occupation_structural_calibration_targets.csv');

  const occupations = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupations.csv'), 'utf8'))
    .filter((row) => String(row.is_active || '').toLowerCase() !== 'false');
  const orsRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_ors_structural_context.csv'), 'utf8'));
  const heterogeneityRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_heterogeneity_context.csv'), 'utf8'));
  const btosRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'industry_ai_adoption_context.csv'), 'utf8'));
  const btosSectorMixRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_btos_sector_mix.csv'), 'utf8'));
  const recompositionRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_recomposition_context.csv'), 'utf8'));
  const qualityRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_quality_indicators.csv'), 'utf8'));
  const laborRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_labor_market_context.csv'), 'utf8'));
  const adaptationRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_adaptation_priors.csv'), 'utf8'));
  const individualUsageRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_individual_ai_usage_context.csv'), 'utf8'));

  const orsById = Object.fromEntries(orsRows.map((row) => [row.occupation_id, row]));
  const heterogeneityById = Object.fromEntries(heterogeneityRows.map((row) => [row.occupation_id, row]));
  const btosBySector = Object.fromEntries(btosRows.map((row) => [row.btos_sector_code, row]));
  const recompositionById = Object.fromEntries(recompositionRows.map((row) => [row.occupation_id, row]));
  const qualityById = Object.fromEntries(qualityRows.map((row) => [row.occupation_id, row]));
  const laborById = Object.fromEntries(laborRows.map((row) => [row.occupation_id, row]));
  const adaptationById = Object.fromEntries(adaptationRows.map((row) => [row.occupation_id, row]));
  const individualUsageById = Object.fromEntries(individualUsageRows.map((row) => [row.occupation_id, row]));
  const btosSectorMixById = btosSectorMixRows.reduce((map, row) => {
    if (!map[row.occupation_id]) {
      map[row.occupation_id] = [];
    }
    map[row.occupation_id].push(row);
    return map;
  }, {});

  const wageDispersionRows = occupations.map((occupation) => {
    const labor = laborById[occupation.occupation_id] || {};
    const p25 = toNumber(labor.wage_p25_usd, null);
    const p75 = toNumber(labor.wage_p75_usd, null);
    const median = toNumber(labor.median_wage_usd, null);
    const openings = toNumber(labor.annual_openings, null);
    const employment = toNumber(labor.employment_us, null);

    return {
      occupation_id: occupation.occupation_id,
      wage_dispersion_ratio: (p25 !== null && p75 !== null && median && median > 0)
        ? ((p75 - p25) / median)
        : null,
      openings_rate: (openings !== null && employment && employment > 0)
        ? (openings / employment)
        : null,
      median_wage_usd: median,
      projection_growth_pct: toNumber(labor.projection_growth_pct, null),
      unemployment_rate: toNumber(labor.latest_unemployment_rate, null)
    };
  });

  const medianWageRanks = percentileRanks(wageDispersionRows.map((row) => row.median_wage_usd));
  const wageDispersionRanks = percentileRanks(wageDispersionRows.map((row) => row.wage_dispersion_ratio));
  const openingsRateRanks = percentileRanks(wageDispersionRows.map((row) => row.openings_rate));
  const growthRanks = percentileRanks(wageDispersionRows.map((row) => row.projection_growth_pct));
  const unemploymentInverseRanks = percentileRanks(wageDispersionRows.map((row) => row.unemployment_rate), true);
  const btosAdoptionSignals = occupations.map((occupation) => {
    const sectorMix = btosSectorMixById[occupation.occupation_id] || [];
    const coveredShare = sectorMix.length
      ? clamp(Math.max(...sectorMix.map((row) => toNumber(row.covered_sector_share, 0))), 0, 1)
      : 0;
    const rawSignal = sectorMix.length
      ? blendAvailable(
        sectorMix.map((row) => {
          const sector = btosBySector[row.btos_sector_code];
          return [sector ? sector.adoption_context_index : null, row.covered_sector_share_normalized];
        }),
        null
      )
      : null;
    const rawConfidence = rawSignal === null
      ? 0
      : clamp(
        (blendAvailable(
          sectorMix.map((row) => {
            const sector = btosBySector[row.btos_sector_code];
            return [sector ? sector.btos_confidence : null, row.covered_sector_share_normalized];
          }),
          0.5
        ) * 0.70) +
        (coveredShare * 0.30),
        0,
        1
      );
    return {
      occupation_id: occupation.occupation_id,
      raw_signal: rawSignal,
      covered_share: coveredShare,
      confidence: rawConfidence
    };
  });
  const btosAdoptionSignalById = Object.fromEntries(btosAdoptionSignals.map((row) => [row.occupation_id, row]));
  const btosAdoptionRanks = percentileRanks(btosAdoptionSignals.map((row) => row.raw_signal));

  const engine = await DLYJV2.create({ basePath: repoRoot });
  const rows = [];

  occupations.forEach((occupation) => {
    const occupationId = occupation.occupation_id;
    const ors = orsById[occupationId] || {};
    const heterogeneity = heterogeneityById[occupationId] || {};
    const btosSectorMix = btosSectorMixById[occupationId] || [];
    const recomposition = recompositionById[occupationId] || {};
    const btosAdoption = btosAdoptionSignalById[occupationId] || {};
    const quality = qualityById[occupationId] || {};
    const labor = laborById[occupationId] || {};
    const adaptation = adaptationById[occupationId] || {};
    const laborDerived = wageDispersionRows.find((row) => row.occupation_id === occupationId) || {};
    const result = engine.computeResult({
      occupationId,
      seniorityLevel: 3
    });

    const individualUsage = individualUsageById[occupationId] || {};
    const observedIndividualExposure = toNumber(individualUsage.observed_exposure, null);
    const individualVsOrgGapRaw = toNumber(individualUsage.individual_vs_org_gap, null);
    const individualUsageDirection = individualUsage.gap_direction || '';
    const individualUsageSourceFlag = individualUsage.calibration_flag || (observedIndividualExposure === null ? 'no_data' : 'ok');

    const knowledgeShare = clamp(parseNoteMetric(adaptation.notes, 'knowledge_share') ?? 0.4, 0, 1);
    const peopleShare = clamp(parseNoteMetric(adaptation.notes, 'people_share') ?? 0.3, 0, 1);
    const routineShare = clamp(parseNoteMetric(adaptation.notes, 'routine_share') ?? 0.2, 0, 1);
    const jobZone = clamp(toNumber(adaptation.job_zone, 3), 1, 5);
    const normalizedJobZone = (jobZone - 1) / 4;

    const orsHumanConstraintSignal = toNumber(ors.human_constraint_index, null);
    const humanConstraintTarget = orsHumanConstraintSignal === null
      ? null
      : clamp(orsHumanConstraintSignal, 0, 1);
    const demandContextTarget = clamp(
      ((growthRanks.get(laborDerived.projection_growth_pct) ?? 0.5) * 0.55) +
      ((openingsRateRanks.get(laborDerived.openings_rate) ?? 0.5) * 0.25) +
      ((unemploymentInverseRanks.get(laborDerived.unemployment_rate) ?? 0.5) * 0.20),
      0,
      1
    );
    const btosCoveredShare = clamp(toNumber(btosAdoption.covered_share, 0), 0, 1);
    const adoptionContextSignal = btosAdoption.raw_signal;
    const adoptionContextPercentile = adoptionContextSignal === null
      ? null
      : (btosAdoptionRanks.get(adoptionContextSignal) ?? 0.5);
    const adoptionContextTarget = adoptionContextPercentile === null
      ? null
      : clamp(0.24 + (adoptionContextPercentile * 0.22), 0, 1);
    const wageLeverageTarget = clamp(
      ((medianWageRanks.get(laborDerived.median_wage_usd) ?? 0.5) * 0.75) +
      ((wageDispersionRanks.get(laborDerived.wage_dispersion_ratio) ?? 0.5) * 0.25),
      0,
      1
    );
    const routinePressureTarget = clamp(
      (routineShare * 0.55) +
      ((1 - normalizedJobZone) * 0.20) +
      ((1 - peopleShare) * 0.15) +
      ((1 - clamp(toNumber(adaptation.learning_intensity_score, 0.5), 0, 1)) * 0.10),
      0,
      1
    );
    const specializationResilienceTarget = clamp(
      (clamp(toNumber(adaptation.adaptive_capacity_score, 0.5), 0, 1) * 0.30) +
      (clamp(toNumber(adaptation.learning_intensity_score, 0.5), 0, 1) * 0.25) +
      (clamp(toNumber(adaptation.transferability_score, 0.5), 0, 1) * 0.20) +
      (normalizedJobZone * 0.10) +
      (knowledgeShare * 0.15),
      0,
      1
    );
    const roleHeterogeneitySignal = clamp(
      (clamp(toNumber(heterogeneity.heterogeneity_index, 0.5), 0, 1) * 0.60) +
      ((1 - peopleShare) * 0.40),
      0,
      1
    );
    const roleHeterogeneityTarget = clamp(
      0.05 + (roleHeterogeneitySignal * 0.40),
      0,
      1
    );
    const recompositionContextTarget = clamp(blendAvailable([
      [recomposition.workflow_compression_context, 0.55],
      [recomposition.organizational_conversion_context, 0.45]
    ], 0.5), 0, 1);
    const waveTimingTarget = clamp(toNumber(recomposition.wave_acceleration_context, 0.5), 0, 1);

    const humanConstraintConfidence = orsHumanConstraintSignal === null
      ? 0
      : clamp(
        (toNumber(quality.quality_confidence, 0.4) * 0.15) +
        (toNumber(ors.ors_confidence, 0.7) * 0.85),
        0,
        1
      );
    const adoptionContextConfidence = adoptionContextTarget === null
      ? 0
      : clamp(
        (toNumber(btosAdoption.confidence, 0.5) * 0.70) +
        (btosCoveredShare * 0.15) +
        (0.15 * 0.5),
        0,
        1
      );
    const demandContextConfidence = toNumber(labor.labor_market_confidence, 0.5);
    const wageLeverageConfidence = toNumber(labor.labor_market_confidence, 0.5);
    const adaptationConfidence = toNumber(adaptation.confidence, 0.5);
    const roleHeterogeneityConfidence = clamp(
      (toNumber(heterogeneity.acs_confidence, 0.45) * 0.65) +
      (adaptationConfidence * 0.35),
      0,
      1
    );
    const recompositionContextConfidence = clamp(
      toNumber(recomposition.recomposition_context_confidence, average([adaptationConfidence, adoptionContextConfidence], 0.55)),
      0,
      1
    );

    const modelHumanGuardrail = clamp(
      ((toNumber(result.function_metrics?.retained_accountability_strength, 0.5) * 0.60) +
      (toNumber(result.function_metrics?.retained_function_strength, 0.5) * 0.40)),
      0,
      1
    );
    const modelAdoptionContext = clamp(blendAvailable([
      [result.recomposition_summary?.organizational_conversion, 0.65],
      [result.diagnostics?.adoption_pressure, 0.35]
    ], 0.5), 0, 1);
    const modelDemandContext = clamp(toNumber(result.function_metrics?.demand_expansion_signal, 0.5), 0, 1);
    const modelWageLeverage = clamp(toNumber(result.function_metrics?.retained_bargaining_power, 0.5), 0, 1);
    const modelLaborIntensityProxy = clamp(
      (toNumber(result.function_metrics?.retained_bargaining_power, 0.5) * 0.45) +
      (toNumber(result.diagnostics?.retained_leverage_score, 0.5) * 0.35) +
      (toNumber(result.diagnostics?.function_retention, 0.5) * 0.20),
      0,
      1
    );
    const modelRoutinePressure = clamp(
      ((toNumber(result.function_metrics?.routine_high_pressure_share, 0.3) * 0.55) +
      (toNumber(result.recomposition_summary?.workflow_compression, 0.5) * 0.45)) * 0.50 +
      (1 - modelLaborIntensityProxy) * 0.50,
      0,
      1
    );
    const modelSpecializationResilience = clamp(
      (toNumber(result.function_metrics?.retained_function_strength, 0.5) * 0.45) +
      (toNumber(result.function_metrics?.retained_bargaining_power, 0.5) * 0.35) +
      (toNumber(result.diagnostics?.function_retention, 0.5) * 0.20),
      0,
      1
    );
    const modelRoleFragmentation = clamp(
      toNumber(result.function_metrics?.role_fragmentation_risk, result.role_fragmentation_risk ?? 0.5),
      0,
      1
    );
    const modelRecompositionContext = clamp(
      blendAvailable([
        [result.recomposition_summary?.workflow_compression, 0.55],
        [result.recomposition_summary?.organizational_conversion, 0.45]
      ], 0.5),
      0,
      1
    );
    const modelWaveTiming = result.primary_displacement_wave === 'current'
      ? 1
      : (result.primary_displacement_wave === 'next' ? 0.6 : 0.25);
    const individualUsageConfidence = observedIndividualExposure === null ? 0 : 0.65;
    const individualUsageGap = observedIndividualExposure === null
      ? null
      : Math.abs(modelAdoptionContext - observedIndividualExposure);
    const individualUsageReview = individualUsageGap === null
      ? 'ok'
      : gapTier(individualUsageGap, individualUsageConfidence);
    const humanConstraintGap = humanConstraintTarget === null
      ? null
      : Math.abs(modelHumanGuardrail - humanConstraintTarget);
    const adoptionContextGap = adoptionContextTarget === null
      ? null
      : Math.abs(modelAdoptionContext - adoptionContextTarget);
    const roleHeterogeneityGap = Math.abs(modelRoleFragmentation - roleHeterogeneityTarget);
    const recompositionContextGap = Math.abs(modelRecompositionContext - recompositionContextTarget);
    const waveTimingGap = Math.abs(modelWaveTiming - waveTimingTarget);

    rows.push({
      occupation_id: occupationId,
      title: occupation.title,
      human_constraint_target: humanConstraintTarget === null ? null : Number(humanConstraintTarget.toFixed(3)),
      human_constraint_confidence: Number(humanConstraintConfidence.toFixed(3)),
      adoption_context_target: adoptionContextTarget === null ? null : Number(adoptionContextTarget.toFixed(3)),
      adoption_context_confidence: Number(adoptionContextConfidence.toFixed(3)),
      demand_context_target: Number(demandContextTarget.toFixed(3)),
      demand_context_confidence: Number(demandContextConfidence.toFixed(3)),
      wage_leverage_target: Number(wageLeverageTarget.toFixed(3)),
      wage_leverage_confidence: Number(wageLeverageConfidence.toFixed(3)),
      routine_pressure_target: Number(routinePressureTarget.toFixed(3)),
      routine_pressure_confidence: Number(adaptationConfidence.toFixed(3)),
      recomposition_context_target: Number(recompositionContextTarget.toFixed(3)),
      recomposition_context_confidence: Number(recompositionContextConfidence.toFixed(3)),
      wave_timing_target: Number(waveTimingTarget.toFixed(3)),
      wave_timing_confidence: Number(recompositionContextConfidence.toFixed(3)),
      specialization_resilience_target: Number(specializationResilienceTarget.toFixed(3)),
      specialization_resilience_confidence: Number(adaptationConfidence.toFixed(3)),
      role_heterogeneity_target: Number(roleHeterogeneityTarget.toFixed(3)),
      role_heterogeneity_confidence: Number(roleHeterogeneityConfidence.toFixed(3)),
      model_human_guardrail: Number(modelHumanGuardrail.toFixed(3)),
      model_adoption_context: Number(modelAdoptionContext.toFixed(3)),
      model_demand_context: Number(modelDemandContext.toFixed(3)),
      model_wage_leverage: Number(modelWageLeverage.toFixed(3)),
      model_routine_pressure: Number(modelRoutinePressure.toFixed(3)),
      model_recomposition_context: Number(modelRecompositionContext.toFixed(3)),
      model_wave_timing: Number(modelWaveTiming.toFixed(3)),
      model_specialization_resilience: Number(modelSpecializationResilience.toFixed(3)),
      model_role_fragmentation: Number(modelRoleFragmentation.toFixed(3)),
      human_constraint_gap: humanConstraintGap === null ? null : Number(humanConstraintGap.toFixed(3)),
      adoption_context_gap: adoptionContextGap === null ? null : Number(adoptionContextGap.toFixed(3)),
      demand_context_gap: Number(Math.abs(modelDemandContext - demandContextTarget).toFixed(3)),
      wage_leverage_gap: Number(Math.abs(modelWageLeverage - wageLeverageTarget).toFixed(3)),
      routine_pressure_gap: Number(Math.abs(modelRoutinePressure - routinePressureTarget).toFixed(3)),
      recomposition_context_gap: Number(recompositionContextGap.toFixed(3)),
      wave_timing_gap: Number(waveTimingGap.toFixed(3)),
      specialization_resilience_gap: Number(Math.abs(modelSpecializationResilience - specializationResilienceTarget).toFixed(3)),
      role_heterogeneity_gap: Number(roleHeterogeneityGap.toFixed(3)),
      human_constraint_review: humanConstraintGap === null ? 'ok' : gapTier(humanConstraintGap, humanConstraintConfidence),
      adoption_context_review: adoptionContextGap === null ? 'ok' : gapTier(adoptionContextGap, adoptionContextConfidence),
      demand_context_review: gapTier(Math.abs(modelDemandContext - demandContextTarget), demandContextConfidence),
      wage_leverage_review: gapTier(Math.abs(modelWageLeverage - wageLeverageTarget), wageLeverageConfidence),
      routine_pressure_review: gapTier(Math.abs(modelRoutinePressure - routinePressureTarget), adaptationConfidence),
      recomposition_context_review: gapTier(recompositionContextGap, recompositionContextConfidence),
      wave_timing_review: gapTier(waveTimingGap, recompositionContextConfidence),
      specialization_resilience_review: gapTier(Math.abs(modelSpecializationResilience - specializationResilienceTarget), adaptationConfidence),
      role_heterogeneity_review: gapTier(roleHeterogeneityGap, roleHeterogeneityConfidence),
      observed_individual_exposure: observedIndividualExposure === null ? null : Number(observedIndividualExposure.toFixed(3)),
      individual_vs_org_gap: individualVsOrgGapRaw === null ? null : Number(individualVsOrgGapRaw.toFixed(3)),
      individual_usage_direction: individualUsageDirection,
      individual_usage_source_flag: individualUsageSourceFlag,
      individual_usage_confidence: Number(individualUsageConfidence.toFixed(3)),
      individual_usage_gap: individualUsageGap === null ? null : Number(individualUsageGap.toFixed(3)),
      individual_usage_review: individualUsageReview,
      quality_source_mix: quality.source_mix || '',
      ors_source_mix: ors.source_mix || '',
      heterogeneity_source_mix: heterogeneity.source_mix || '',
      btos_source_mix: btosSectorMix.map((row) => {
        const sector = btosBySector[row.btos_sector_code];
        return sector ? sector.source_mix : '';
      }).filter(Boolean).join('|'),
      adaptation_source_mix: adaptation.source_mix || '',
      labor_release_year: labor.release_year || '',
      notes: [
        String(quality.notes || '').trim(),
        adoptionContextTarget === null ? '' : `btos_covered_share=${btosCoveredShare.toFixed(3)}|btos_percentile=${adoptionContextPercentile.toFixed(3)}`,
        String(adaptation.notes || '').trim(),
        String(recomposition.notes || '').trim(),
        labor.release_year ? `labor_context_${labor.release_year}` : '',
        individualUsageSourceFlag && individualUsageSourceFlag !== 'no_data' && individualUsageSourceFlag !== 'ok'
          ? `individual_usage_flag=${individualUsageSourceFlag}|direction=${individualUsageDirection}`
          : ''
      ].filter(Boolean).join('|')
    });
  });

  rows.forEach((row) => {
    const recommendation = recommendReviewLayer(row);
    row.highest_review_tier = ['high', 'medium', 'low', 'ok']
      .find((tier) => (
        row.human_constraint_review === tier ||
        row.adoption_context_review === tier ||
        row.demand_context_review === tier ||
        row.wage_leverage_review === tier ||
        row.routine_pressure_review === tier ||
        row.recomposition_context_review === tier ||
        row.wave_timing_review === tier ||
        row.specialization_resilience_review === tier ||
        row.role_heterogeneity_review === tier
      )) || 'ok';
    row.primary_review_layer = recommendation.layer;
    row.primary_review_strength = recommendation.strength;
    row.primary_review_score = Number(recommendation.score.toFixed(3));
    row.primary_review_reason = recommendation.reason;
  });

  const csvHeader = [
    'occupation_id',
    'title',
    'human_constraint_target',
    'human_constraint_confidence',
    'adoption_context_target',
    'adoption_context_confidence',
    'demand_context_target',
    'demand_context_confidence',
    'wage_leverage_target',
    'wage_leverage_confidence',
    'routine_pressure_target',
    'routine_pressure_confidence',
    'recomposition_context_target',
    'recomposition_context_confidence',
    'wave_timing_target',
    'wave_timing_confidence',
    'specialization_resilience_target',
    'specialization_resilience_confidence',
    'role_heterogeneity_target',
    'role_heterogeneity_confidence',
    'model_human_guardrail',
    'model_adoption_context',
    'model_demand_context',
    'model_wage_leverage',
    'model_routine_pressure',
    'model_recomposition_context',
    'model_wave_timing',
    'model_specialization_resilience',
    'model_role_fragmentation',
    'human_constraint_gap',
    'adoption_context_gap',
    'demand_context_gap',
    'wage_leverage_gap',
    'routine_pressure_gap',
    'recomposition_context_gap',
    'wave_timing_gap',
    'specialization_resilience_gap',
    'role_heterogeneity_gap',
    'human_constraint_review',
    'adoption_context_review',
    'demand_context_review',
    'wage_leverage_review',
    'routine_pressure_review',
    'recomposition_context_review',
    'wave_timing_review',
    'specialization_resilience_review',
    'role_heterogeneity_review',
    'observed_individual_exposure',
    'individual_vs_org_gap',
    'individual_usage_direction',
    'individual_usage_source_flag',
    'individual_usage_confidence',
    'individual_usage_gap',
    'individual_usage_review',
    'quality_source_mix',
    'ors_source_mix',
    'heterogeneity_source_mix',
    'btos_source_mix',
    'adaptation_source_mix',
    'labor_release_year',
    'highest_review_tier',
    'primary_review_layer',
    'primary_review_strength',
    'primary_review_score',
    'primary_review_reason',
    'notes'
  ];
  const csvLines = [csvHeader.join(',')].concat(rows.map((row) => {
    return csvHeader.map((column) => csvEscape(row[column])).join(',');
  }));
  fs.writeFileSync(targetPath, `${csvLines.join('\n')}\n`, 'utf8');

  const checks = [
    {
      label: 'Human Guardrail Plausibility',
      strength: 'strong',
      targetKey: 'human_constraint_target',
      modelKey: 'model_human_guardrail',
      gapKey: 'human_constraint_gap',
      reviewKey: 'human_constraint_review',
      confidenceKey: 'human_constraint_confidence',
      description: 'Compares the model’s retained human/accountability guardrails to the normalized ORS structural index where ORS coverage exists. Occupations without usable ORS rows are left unscored for this strongest check.'
    },
    {
      label: 'Adoption Context Plausibility',
      strength: 'medium',
      targetKey: 'adoption_context_target',
      modelKey: 'model_adoption_context',
      gapKey: 'adoption_context_gap',
      reviewKey: 'adoption_context_review',
      confidenceKey: 'adoption_context_confidence',
      description: 'Compares organizational conversion and default adoption pressure to a BTOS adoption-context signal joined from sector-level AI-use estimates through ACS-derived occupation sector mix, then rescaled into the model’s adoption-realization range.'
    },
    {
      label: 'Demand Context Plausibility',
      strength: 'weak',
      targetKey: 'demand_context_target',
      modelKey: 'model_demand_context',
      gapKey: 'demand_context_gap',
      reviewKey: 'demand_context_review',
      confidenceKey: 'demand_context_confidence',
      description: 'Compares demand-expansion signals to labor-market context, not to direct AI displacement.'
    },
    {
      label: 'Wage Leverage Plausibility',
      strength: 'weak',
      targetKey: 'wage_leverage_target',
      modelKey: 'model_wage_leverage',
      gapKey: 'wage_leverage_gap',
      reviewKey: 'wage_leverage_review',
      confidenceKey: 'wage_leverage_confidence',
      description: 'Compares retained bargaining power to wage-level and wage-dispersion context as a coarse external check.'
    },
    {
      label: 'Routine Pressure Plausibility',
      strength: 'medium',
      targetKey: 'routine_pressure_target',
      modelKey: 'model_routine_pressure',
      gapKey: 'routine_pressure_gap',
      reviewKey: 'routine_pressure_review',
      confidenceKey: 'routine_pressure_confidence',
      description: 'Compares modeled pressure/compressibility to adaptation-layer routine share, people share, learning intensity, and job-zone complexity.'
    },
    {
      label: 'Recomposition Context Plausibility',
      strength: 'medium',
      targetKey: 'recomposition_context_target',
      modelKey: 'model_recomposition_context',
      gapKey: 'recomposition_context_gap',
      reviewKey: 'recomposition_context_review',
      confidenceKey: 'recomposition_context_confidence',
      description: 'Compares workflow compression and organizational conversion to the derived occupation-level recomposition context built from adaptation structure plus the runtime demand/adoption context layer.'
    },
    {
      label: 'Wave Timing Plausibility',
      strength: 'medium',
      targetKey: 'wave_timing_target',
      modelKey: 'model_wave_timing',
      gapKey: 'wave_timing_gap',
      reviewKey: 'wave_timing_review',
      confidenceKey: 'wave_timing_confidence',
      description: 'Compares the modeled primary displacement wave to the derived occupation-level wave-acceleration context.'
    },
    {
      label: 'Specialization Resilience Plausibility',
      strength: 'medium',
      targetKey: 'specialization_resilience_target',
      modelKey: 'model_specialization_resilience',
      gapKey: 'specialization_resilience_gap',
      reviewKey: 'specialization_resilience_review',
      confidenceKey: 'specialization_resilience_confidence',
      description: 'Compares retained function/bargaining signals to adaptation-layer learning intensity, transferability, adaptive capacity, and knowledge intensity.'
    },
    {
      label: 'Role Heterogeneity Plausibility',
      strength: 'medium',
      targetKey: 'role_heterogeneity_target',
      modelKey: 'model_role_fragmentation',
      gapKey: 'role_heterogeneity_gap',
      reviewKey: 'role_heterogeneity_review',
      confidenceKey: 'role_heterogeneity_confidence',
      description: 'Compares modeled role fragmentation risk to an ACS PUMS heterogeneity signal built from wage dispersion, education dispersion, industry dispersion, and worker-mix spread, then scaled by lower people-intensity from the adaptation layer.'
    },
    {
      label: 'Individual AI Usage Plausibility',
      strength: 'weak',
      targetKey: 'observed_individual_exposure',
      modelKey: 'model_adoption_context',
      gapKey: 'individual_usage_gap',
      reviewKey: 'individual_usage_review',
      confidenceKey: 'individual_usage_confidence',
      description: 'Compares the model\'s org-level adoption context (BTOS-derived organizational conversion plus adoption pressure) against observed individual-level Claude usage fractions from the AEI labor market follow-up. These measure different things: org adoption versus worker behavior. Large gaps — especially where individual usage exceeds org adoption — may signal that workers in that role are adapting faster than the org-level signal captures, and deserve closer adoption-realization review.'
    }
  ];

  const lines = [];
  lines.push('# Structural Calibration Report');
  lines.push('');
  lines.push('This report is the first empirical calibration scaffold for the live model.');
  lines.push('');
  lines.push('It does not validate AI-driven job loss directly.');
  lines.push('It checks whether the model’s structural claims line up directionally with the best local non-runtime context currently present in the repo.');
  lines.push('');
  lines.push('Generated from:');
  lines.push('- `data/normalized/occupation_ors_structural_context.csv`');
  lines.push('- `data/normalized/occupation_heterogeneity_context.csv`');
  lines.push('- `data/normalized/industry_ai_adoption_context.csv`');
  lines.push('- `data/normalized/occupation_btos_sector_mix.csv`');
  lines.push('- `data/normalized/occupation_recomposition_context.csv`');
  lines.push('- `data/normalized/occupation_quality_indicators.csv`');
  lines.push('- `data/normalized/occupation_labor_market_context.csv`');
  lines.push('- `data/normalized/occupation_adaptation_priors.csv`');
  lines.push('- `data/normalized/occupation_individual_ai_usage_context.csv`');
  lines.push('- live outputs from `v2_engine.js`');
  lines.push('');
  lines.push('Current limitations:');
  lines.push('- `occupation_ors_structural_context.csv` is now the main structural input for the human-guardrail check, using the normalized ORS structural index.');
  lines.push('- occupations without usable ORS structural rows are currently left unscored for that strongest check instead of being silently folded back into a weaker proxy.');
  lines.push('- `occupation_individual_ai_usage_context.csv` is calibration-only context derived from the AEI labor market follow-up. It measures observed individual-level Claude usage fractions by occupation, which is structurally different from the model\'s BTOS-derived org-level adoption context. Do not treat individual usage as a direct replacement for `ai_adoption_context`. Large divergences — especially `individual_higher` cases — may indicate that workers in a role are adapting faster than org adoption signals reflect, and deserve adoption-realization review.');
  lines.push('- `occupation_heterogeneity_context.csv` is calibration-only context. It is useful for checking whether the model is overstating role uniformity, but it is still an external structural proxy rather than a runtime role-definition input.');
  lines.push('- the heterogeneity check is not raw ACS alone; the target is scaled into a fragmentation-pressure range and conditioned on lower people-intensity so it stays closer to the model’s actual role-splitting claim.');
  lines.push('- `industry_ai_adoption_context.csv` is also calibration-only context. It measures observed sector AI use and deployment change, not direct task automability.');
  lines.push('- the BTOS adoption check is not compared on raw business-use percentages; the BTOS signal is mapped into the model’s organizational-conversion range so it behaves as a directional review target rather than a literal prevalence label.');
  lines.push('- `occupation_recomposition_context.csv` is a derived outer-layer target. It is useful for checking workflow compression, organizational conversion, and timing assumptions, but it is still not direct proof of realized displacement.');
  lines.push('- labor-market checks are contextual and should not be treated as proof of AI displacement or demand expansion.');
  lines.push('- this report is for calibration and review, not runtime scoring.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- occupations evaluated: \`${rows.length}\``);
  lines.push(`- target table: \`data/normalized/occupation_structural_calibration_targets.csv\``);
  lines.push('');
  lines.push('## Check Strengths');
  lines.push('');
  checks.forEach((check) => {
    const correlation = spearmanCorrelation(rows, check.targetKey, check.modelKey);
    const coveredRows = rows.filter((row) => typeof row[check.targetKey] === 'number' && !Number.isNaN(row[check.targetKey])).length;
    const highPriority = rows.filter((row) => row[check.reviewKey] === 'high').length;
    const mediumPriority = rows.filter((row) => row[check.reviewKey] === 'medium').length;
    lines.push(`### ${check.label}`);
    lines.push(`- strength: \`${check.strength}\``);
    lines.push(`- coverage: \`${coveredRows}/${rows.length}\``);
    lines.push(`- spearman correlation: \`${correlation === null ? 'n/a' : correlation.toFixed(3)}\``);
    lines.push(`- high-priority mismatches: \`${highPriority}\``);
    lines.push(`- medium-priority mismatches: \`${mediumPriority}\``);
    lines.push(`- description: ${check.description}`);
    lines.push('');
  });

  lines.push('## Highest-Priority Mismatches');
  lines.push('');
  const priorityRows = rows
    .map((row) => {
      return {
        ...row,
        anyPriority: row.human_constraint_review !== 'ok' ||
          row.adoption_context_review !== 'ok' ||
          row.demand_context_review !== 'ok' ||
          row.wage_leverage_review !== 'ok' ||
          row.routine_pressure_review !== 'ok' ||
          row.specialization_resilience_review !== 'ok' ||
          row.role_heterogeneity_review !== 'ok' ||
          row.individual_usage_review !== 'ok',
        anyHigh: row.human_constraint_review === 'high' ||
          row.adoption_context_review === 'high' ||
          row.demand_context_review === 'high' ||
          row.wage_leverage_review === 'high' ||
          row.routine_pressure_review === 'high' ||
          row.recomposition_context_review === 'high' ||
          row.wave_timing_review === 'high' ||
          row.specialization_resilience_review === 'high' ||
          row.role_heterogeneity_review === 'high' ||
          row.individual_usage_review === 'high',
        maxGap: Math.max(
          row.human_constraint_gap,
          row.adoption_context_gap,
          row.demand_context_gap,
          row.wage_leverage_gap,
          row.routine_pressure_gap,
          row.recomposition_context_gap,
          row.wave_timing_gap,
          row.specialization_resilience_gap,
          row.role_heterogeneity_gap,
          row.individual_usage_gap ?? 0
        )
      };
    })
    .filter((row) => row.anyPriority)
    .sort((left, right) => {
      const reviewDelta = priorityScore(right.highest_review_tier) - priorityScore(left.highest_review_tier);
      if (reviewDelta) {
        return reviewDelta;
      }
      return right.maxGap - left.maxGap;
    });

  if (!priorityRows.length) {
    lines.push('- No structural mismatches rose above `ok` under the current thresholds.');
  } else {
    lines.push('| Occupation | Highest tier | Review layer | Layer strength | Human guardrail gap | Adoption gap | Demand gap | Wage leverage gap | Routine gap | Recomposition gap | Wave timing gap | Specialization gap | Heterogeneity gap | Individual usage gap |');
    lines.push('| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
    priorityRows.slice(0, 10).forEach((row) => {
      lines.push(`| ${row.title} | ${row.highest_review_tier} | ${row.primary_review_layer} | ${row.primary_review_strength} | ${formatMaybe(row.human_constraint_gap)} (${row.human_constraint_review}) | ${formatMaybe(row.adoption_context_gap)} (${row.adoption_context_review}) | ${formatMaybe(row.demand_context_gap)} (${row.demand_context_review}) | ${formatMaybe(row.wage_leverage_gap)} (${row.wage_leverage_review}) | ${formatMaybe(row.routine_pressure_gap)} (${row.routine_pressure_review}) | ${formatMaybe(row.recomposition_context_gap)} (${row.recomposition_context_review}) | ${formatMaybe(row.wave_timing_gap)} (${row.wave_timing_review}) | ${formatMaybe(row.specialization_resilience_gap)} (${row.specialization_resilience_review}) | ${formatMaybe(row.role_heterogeneity_gap)} (${row.role_heterogeneity_review}) | ${formatMaybe(row.individual_usage_gap)} (${row.individual_usage_review}) |`);
    });
  }
  lines.push('');
  lines.push('## Most Common Review Layers');
  lines.push('');
  const reviewLayerCounts = priorityRows.reduce((map, row) => {
    map[row.primary_review_layer] = (map[row.primary_review_layer] || 0) + 1;
    return map;
  }, {});
  const sortedReviewLayers = Object.entries(reviewLayerCounts)
    .sort((left, right) => right[1] - left[1]);
  if (!sortedReviewLayers.length) {
    lines.push('- No review-layer pattern surfaced under the current thresholds.');
  } else {
    lines.push('| Review layer | Occupations flagged |');
    lines.push('| --- | ---: |');
    sortedReviewLayers.forEach(([layer, count]) => {
      lines.push(`| ${layer} | ${count} |`);
    });
  }
  lines.push('');
  lines.push('## Review Queue');
  lines.push('');
  lines.push('| Occupation | Primary review layer | Layer strength | Highest tier | Why review |');
  lines.push('| --- | --- | --- | --- | --- |');
  priorityRows.slice(0, 12).forEach((row) => {
    lines.push(`| ${row.title} | ${row.primary_review_layer} | ${row.primary_review_strength} | ${row.highest_review_tier} | ${row.primary_review_reason} |`);
  });
  lines.push('');
  lines.push('## Strongest Structural Queue');
  lines.push('');
  const strongStructuralRows = priorityRows
    .filter((row) => row.primary_review_strength === 'medium')
    .sort((left, right) => right.primary_review_score - left.primary_review_score);
  if (!strongStructuralRows.length) {
    lines.push('- No medium-strength structural queue surfaced above the current thresholds.');
  } else {
    lines.push('| Occupation | Review layer | Review score | Why review |');
    lines.push('| --- | --- | ---: | --- |');
    strongStructuralRows.slice(0, 10).forEach((row) => {
      lines.push(`| ${row.title} | ${row.primary_review_layer} | ${row.primary_review_score.toFixed(3)} | ${row.primary_review_reason} |`);
    });
  }
  lines.push('');
  lines.push('## Largest Gaps By Check');
  lines.push('');
  checks.forEach((check) => {
    lines.push(`### ${check.label}`);
    lines.push('| Occupation | Model | Target | Gap | Confidence | Review |');
    lines.push('| --- | ---: | ---: | ---: | ---: | --- |');
    rows
      .slice()
      .filter((row) => typeof row[check.gapKey] === 'number' && !Number.isNaN(row[check.gapKey]))
      .sort((left, right) => right[check.gapKey] - left[check.gapKey])
      .slice(0, 8)
      .forEach((row) => {
        lines.push(`| ${row.title} | ${formatMaybe(row[check.modelKey])} | ${formatMaybe(row[check.targetKey])} | ${formatMaybe(row[check.gapKey])} | ${formatMaybe(row[check.confidenceKey])} | ${row[check.reviewKey]} |`);
      });
    lines.push('');
  });

  lines.push('## Interpretation');
  lines.push('');
  lines.push('- Treat `Human Guardrail Plausibility` as the most useful current structural check.');
  lines.push('- Treat `Adoption Context Plausibility` as the best current outer-layer check on whether the model is over- or under-stating organizational AI conversion relative to observed sector uptake.');
  lines.push('- Treat `Recomposition Context Plausibility` and `Wave Timing Plausibility` as the best current checks on whether workflow compression, organizational conversion, and displacement timing are directionally plausible.');
  lines.push('- Treat `Role Heterogeneity Plausibility` as the best current check on whether the model is making an occupation look too uniform or too split.');
  lines.push('- Treat `Individual AI Usage Plausibility` as a weak annotation layer, not a scoring target. It surfaces occupations where observed individual Claude usage diverges materially from the model\'s org-level adoption context. `individual_higher` gaps are the more actionable pattern: they suggest workers are using Claude more than the model\'s structural adoption signal implies, which may indicate the adoption-realization estimate is lagging. `org_higher` gaps are less actionable: they typically reflect organizational AI workflow rollout that is not yet translating into individual usage.');
  lines.push('- Treat `Demand Context Plausibility` and `Wage Leverage Plausibility` as weak calibration layers that can surface suspicious outliers, not as truth labels.');
  lines.push('- Occupations with repeated high-priority gaps should be reviewed at the layer that likely caused the disagreement: function anchors, accountability weights, task evidence coverage, or role-shape assumptions.');
  lines.push('');
  lines.push('## Next Data Upgrades');
  lines.push('');
  lines.push('- Extend ORS coverage or mapping so fewer launch occupations remain unscored on the strongest human-guardrail check.');
  lines.push('- Use the new BTOS review queue to decide whether adoption-realization tuning should remain calibration-only or graduate into a later controlled runtime parameter review.');
  lines.push('- Refresh `O*NET` after the current official calibration layers are stable, so structural tuning is not confounded with a database-version jump.');
  lines.push('- Consider whether the ACS heterogeneity layer is strong enough to justify future multi-variant occupation modeling rather than one default role shape per occupation.');
  lines.push('- Review high-priority `individual_higher` cases from the Individual AI Usage check as candidates for adoption-realization tuning. Do not replace `ai_adoption_context` with the individual usage signal — they measure different phenomena.');
  lines.push('- Once the current calibration layers are stable, check whether a later AEI release provides more complete occupation-level individual usage coverage than the current 34-occupation subset.');
  lines.push('');

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(JSON.stringify({
    occupations: rows.length,
    targetPath,
    reportPath,
    humanGuardrailCorrelation: spearmanCorrelation(rows, 'human_constraint_target', 'model_human_guardrail'),
    adoptionContextCorrelation: spearmanCorrelation(rows, 'adoption_context_target', 'model_adoption_context'),
    demandContextCorrelation: spearmanCorrelation(rows, 'demand_context_target', 'model_demand_context'),
    wageLeverageCorrelation: spearmanCorrelation(rows, 'wage_leverage_target', 'model_wage_leverage'),
    routinePressureCorrelation: spearmanCorrelation(rows, 'routine_pressure_target', 'model_routine_pressure'),
    recompositionContextCorrelation: spearmanCorrelation(rows, 'recomposition_context_target', 'model_recomposition_context'),
    waveTimingCorrelation: spearmanCorrelation(rows, 'wave_timing_target', 'model_wave_timing'),
    specializationResilienceCorrelation: spearmanCorrelation(rows, 'specialization_resilience_target', 'model_specialization_resilience'),
    roleHeterogeneityCorrelation: spearmanCorrelation(rows, 'role_heterogeneity_target', 'model_role_fragmentation'),
    individualAiUsageCorrelation: spearmanCorrelation(rows, 'observed_individual_exposure', 'model_adoption_context'),
    topReviewLayers: sortedReviewLayers.slice(0, 3).map(([layer, count]) => ({ layer, count }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
