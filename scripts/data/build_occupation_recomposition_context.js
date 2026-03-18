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

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function parseNoteMetric(noteText, metricKey) {
  const notes = String(noteText || '');
  const pattern = new RegExp(`${metricKey}=([0-9.]+)`, 'i');
  const match = notes.match(pattern);
  return match ? toNumber(match[1], null) : null;
}

function average(values, fallback = null) {
  const numeric = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!numeric.length) {
    return fallback;
  }
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
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
  const outputPath = path.join(normalizedDir, 'occupation_recomposition_context.csv');

  const occupations = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupations.csv'), 'utf8'))
    .filter((row) => String(row.is_active || '').toLowerCase() !== 'false');
  const adaptationRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_adaptation_priors.csv'), 'utf8'));
  const demandRows = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_demand_adoption_context.csv'), 'utf8'));

  const adaptationById = Object.fromEntries(adaptationRows.map((row) => [row.occupation_id, row]));
  const demandById = Object.fromEntries(demandRows.map((row) => [row.occupation_id, row]));

  const header = [
    'occupation_id',
    'workflow_compression_context',
    'organizational_conversion_context',
    'wave_acceleration_context',
    'displacement_wave_bias',
    'recomposition_context_confidence',
    'source_mix',
    'notes'
  ];

  const rows = occupations.map((occupation) => {
    const adaptation = adaptationById[occupation.occupation_id] || {};
    const demand = demandById[occupation.occupation_id] || {};

    const knowledgeShare = clamp(parseNoteMetric(adaptation.notes, 'knowledge_share') ?? 0.4, 0, 1);
    const peopleShare = clamp(parseNoteMetric(adaptation.notes, 'people_share') ?? 0.3, 0, 1);
    const routineShare = clamp(parseNoteMetric(adaptation.notes, 'routine_share') ?? 0.2, 0, 1);
    const normalizedJobZone = clamp((clamp(toNumber(adaptation.job_zone, 3), 1, 5) - 1) / 4, 0, 1);

    const laborDemandContext = clamp(toNumber(demand.labor_demand_context, 0.5), 0, 1);
    const laborTightnessContext = clamp(toNumber(demand.labor_tightness_context, 0.5), 0, 1);
    const aiAdoptionContext = clamp(toNumber(demand.ai_adoption_context, 0.5), 0, 1);
    const adoptionRealizationContext = clamp(toNumber(demand.adoption_realization_context, aiAdoptionContext), 0, 1);
    const demandExpansionContext = clamp(toNumber(demand.demand_expansion_context, laborDemandContext), 0, 1);

    const workflowCompressionContext = clamp(
      (routineShare * 0.30) +
      ((1 - peopleShare) * 0.16) +
      ((1 - knowledgeShare) * 0.10) +
      ((1 - normalizedJobZone) * 0.08) +
      (aiAdoptionContext * 0.18) +
      (adoptionRealizationContext * 0.18),
      0,
      1
    );

    const organizationalConversionContext = clamp(
      (adoptionRealizationContext * 0.42) +
      (aiAdoptionContext * 0.18) +
      (laborTightnessContext * 0.14) +
      (demandExpansionContext * 0.12) +
      (routineShare * 0.08) +
      ((1 - peopleShare) * 0.06),
      0,
      1
    );

    const waveAccelerationContext = clamp(
      (organizationalConversionContext * 0.45) +
      (workflowCompressionContext * 0.35) +
      (demandExpansionContext * 0.20),
      0,
      1
    );

    const displacementWaveBias = clamp(
      (workflowCompressionContext * 0.42) +
      (organizationalConversionContext * 0.30) +
      ((1 - knowledgeShare) * 0.10) +
      ((1 - peopleShare) * 0.10) +
      ((1 - normalizedJobZone) * 0.08),
      0,
      1
    );

    const recompositionContextConfidence = clamp(
      (average([
        toNumber(adaptation.confidence, null),
        toNumber(demand.context_confidence, null),
        toNumber(demand.adoption_context_confidence, null),
        toNumber(demand.labor_context_confidence, null)
      ], 0.55) * 0.80) +
      (clamp(toNumber(demand.btos_covered_sector_share, 0), 0, 1) * 0.20),
      0,
      1
    );

    return {
      occupation_id: occupation.occupation_id,
      workflow_compression_context: workflowCompressionContext.toFixed(4),
      organizational_conversion_context: organizationalConversionContext.toFixed(4),
      wave_acceleration_context: waveAccelerationContext.toFixed(4),
      displacement_wave_bias: displacementWaveBias.toFixed(4),
      recomposition_context_confidence: recompositionContextConfidence.toFixed(4),
      source_mix: uniqueStrings([
        String(adaptation.source_mix || '').trim(),
        String(demand.source_mix || '').trim(),
        'src_runtime_demand_adoption_context_2026_03'
      ]).join('|'),
      notes: [
        `routine_share=${routineShare.toFixed(3)}`,
        `people_share=${peopleShare.toFixed(3)}`,
        `knowledge_share=${knowledgeShare.toFixed(3)}`,
        `job_zone_norm=${normalizedJobZone.toFixed(3)}`,
        `adoption_realization_context=${adoptionRealizationContext.toFixed(3)}`,
        `demand_expansion_context=${demandExpansionContext.toFixed(3)}`
      ].join('|')
    };
  });

  const csvLines = [header.join(',')].concat(rows.map((row) => {
    return header.map((column) => csvEscape(row[column])).join(',');
  }));

  fs.writeFileSync(outputPath, `${csvLines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${rows.length} recomposition context rows to ${path.relative(repoRoot, outputPath)}`);
}

main();
