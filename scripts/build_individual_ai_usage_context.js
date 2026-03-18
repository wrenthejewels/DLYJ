'use strict';

const fs = require('fs');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = raw.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] !== undefined ? vals[i] : ''; });
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function toCSVValue(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function writeCSV(filePath, rows, columns) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map(c => toCSVValue(row[c])).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

function fmt4(n) {
  return typeof n === 'number' ? n.toFixed(4) : n;
}

// ── paths ────────────────────────────────────────────────────────────────────

const BASE = path.resolve(__dirname, '..');
const FILE_A = path.join(BASE, 'data/raw/anthropic_economic_index/labor_market_impacts/job_exposure.csv');
const FILE_B = path.join(BASE, 'data/normalized/occupation_demand_adoption_context.csv');
const FILE_C = path.join(BASE, 'data/normalized/occupations.csv');
const OUT    = path.join(BASE, 'data/normalized/occupation_individual_ai_usage_context.csv');

const SOURCE_ID = 'src_aei_labor_market_2026_03';

// ── load ─────────────────────────────────────────────────────────────────────

const exposureRows  = parseCSV(FILE_A);   // occ_code, title, observed_exposure
const adoptionRows  = parseCSV(FILE_B);   // occupation_id, ..., ai_adoption_context, adoption_realization_context, ...
const occupations   = parseCSV(FILE_C);   // occupation_id, onet_soc_code, title, ...

// ── build lookup maps ─────────────────────────────────────────────────────────

// File A: 6-digit SOC → observed_exposure
const exposureBySOC = new Map();
for (const row of exposureRows) {
  exposureBySOC.set(row.occ_code.trim(), parseFloat(row.observed_exposure));
}

// File B: occupation_id → { ai_adoption_context, adoption_realization_context }
const adoptionByOccId = new Map();
for (const row of adoptionRows) {
  adoptionByOccId.set(row.occupation_id.trim(), {
    ai_adoption_context:          parseFloat(row.ai_adoption_context),
    adoption_realization_context: parseFloat(row.adoption_realization_context),
  });
}

// ── step 2: join ──────────────────────────────────────────────────────────────

const joined = occupations.map(occ => {
  const occ_id      = occ.occupation_id.trim();
  const onet_code   = occ.onet_soc_code.trim();           // e.g. "11-1021.00"
  const soc6        = onet_code.replace(/\.00$/, '');     // e.g. "11-1021"

  const exp = exposureBySOC.has(soc6) ? exposureBySOC.get(soc6) : null;
  const adopt = adoptionByOccId.get(occ_id) || { ai_adoption_context: null, adoption_realization_context: null };

  return {
    occupation_id:               occ_id,
    onet_soc_code:               onet_code,
    observed_exposure:           exp,          // null if no match
    ai_adoption_context:         adopt.ai_adoption_context,
    adoption_realization_context: adopt.adoption_realization_context,
  };
});

// ── step 3: percentile rank among matched occupations ────────────────────────

const matched = joined.filter(r => r.observed_exposure !== null);
console.log(`\nMatched occupations (have exposure data): ${matched.length}`);
console.log(`Unmatched occupations:                    ${joined.length - matched.length}`);

// Sort matched by observed_exposure ascending to assign ranks
const sorted = [...matched].sort((a, b) => a.observed_exposure - b.observed_exposure);

// Percentile rank: rank / (n - 1) so min=0, max=1
const n = sorted.length;
const pctByOccId = new Map();
sorted.forEach((row, idx) => {
  pctByOccId.set(row.occupation_id, n === 1 ? 0 : idx / (n - 1));
});

// ── step 4: calibration signals ──────────────────────────────────────────────

const outputRows = joined.map(row => {
  const hasData = row.observed_exposure !== null;
  const obs_pct = hasData ? pctByOccId.get(row.occupation_id) : null;

  const ai_ctx = row.ai_adoption_context;

  let gap = null, gap_direction = '', cal_flag = '';

  if (hasData && ai_ctx !== null && !isNaN(ai_ctx)) {
    gap = obs_pct - ai_ctx;
    const absGap = Math.abs(gap);
    gap_direction = gap >  0.10 ? 'individual_higher'
                  : gap < -0.10 ? 'org_higher'
                  : 'aligned';
    cal_flag = absGap > 0.25 ? 'review'
             : absGap > 0.10 ? 'watch'
             : 'ok';
  } else if (!hasData) {
    cal_flag = 'no_data';
  }

  return {
    occupation_id:                row.occupation_id,
    onet_soc_code:                row.onet_soc_code,
    observed_exposure:            hasData ? fmt4(row.observed_exposure)        : '',
    observed_exposure_pct:        hasData ? fmt4(obs_pct)                      : '',
    ai_adoption_context:          ai_ctx !== null ? fmt4(ai_ctx)               : '',
    adoption_realization_context: row.adoption_realization_context !== null
                                    ? fmt4(row.adoption_realization_context)   : '',
    individual_vs_org_gap:        gap !== null ? fmt4(gap)                     : '',
    gap_direction:                gap_direction,
    calibration_flag:             cal_flag,
    source_id:                    hasData ? SOURCE_ID : '',
  };
});

// ── step 5: write output ──────────────────────────────────────────────────────

const COLUMNS = [
  'occupation_id', 'onet_soc_code', 'observed_exposure', 'observed_exposure_pct',
  'ai_adoption_context', 'adoption_realization_context',
  'individual_vs_org_gap', 'gap_direction', 'calibration_flag', 'source_id',
];

writeCSV(OUT, outputRows, COLUMNS);
console.log(`\nOutput written to: ${OUT}`);
console.log(`Total rows written: ${outputRows.length}`);

// ── summary table: top 15 calibration candidates ─────────────────────────────

const withGap = outputRows
  .filter(r => r.individual_vs_org_gap !== '')
  .map(r => ({ ...r, _absGap: Math.abs(parseFloat(r.individual_vs_org_gap)) }))
  .sort((a, b) => b._absGap - a._absGap);

// Pull title from occupations for display
const titleByOccId = new Map(occupations.map(o => [o.occupation_id.trim(), o.title_short || o.title]));

const top15 = withGap.slice(0, 15);

console.log('\n── Top 15 Calibration Candidates (by |individual_vs_org_gap| desc) ──────────────────');
console.log(
  'Rank  occupation_id          title                          obs_exp  obs_pct  ai_adopt  gap      direction           flag'
);
console.log('─'.repeat(130));
top15.forEach((r, i) => {
  const title = (titleByOccId.get(r.occupation_id) || '').padEnd(30).slice(0, 30);
  const rank  = String(i + 1).padStart(2);
  const oid   = r.occupation_id.padEnd(22);
  const oe    = r.observed_exposure.padStart(7);
  const op    = r.observed_exposure_pct.padStart(7);
  const aa    = r.ai_adoption_context.padStart(8);
  const gp    = r.individual_vs_org_gap.padStart(7);
  const dir   = r.gap_direction.padEnd(20);
  const flag  = r.calibration_flag;
  console.log(`${rank}.   ${oid} ${title} ${oe}  ${op}  ${aa}  ${gp}  ${dir}  ${flag}`);
});

console.log('\n── Flag summary ──────────────────────────────────────────────────────────────────────');
const flags = { review: 0, watch: 0, ok: 0, no_data: 0 };
for (const r of outputRows) flags[r.calibration_flag] = (flags[r.calibration_flag] || 0) + 1;
for (const [flag, count] of Object.entries(flags)) {
  console.log(`  ${flag.padEnd(8)} ${count}`);
}
