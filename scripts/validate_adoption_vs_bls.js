const fs = require('fs');
const path = require('path');

// Simple CSV parser (handles quoted fields)
function parseCSV(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

const BASE = 'C:/Users/clayw/Test 8-22/data/normalized';

const labor    = parseCSV(path.join(BASE, 'occupation_labor_market_context.csv'));
const demand   = parseCSV(path.join(BASE, 'occupation_demand_adoption_context.csv'));
const occs     = parseCSV(path.join(BASE, 'occupations.csv'));
const usage    = parseCSV(path.join(BASE, 'occupation_individual_ai_usage_context.csv'));

// Build lookup maps
const laborMap  = Object.fromEntries(labor.map(r => [r.occupation_id, r]));
const demandMap = Object.fromEntries(demand.map(r => [r.occupation_id, r]));
const usageMap  = Object.fromEntries(usage.map(r => [r.occupation_id, r]));

// Only active occupations with a title
const activeOccs = occs.filter(o => o.is_active === '1');

console.log(`Total active occupations: ${activeOccs.length}`);
console.log(`Labor market rows: ${labor.length}`);
console.log(`Demand/adoption rows: ${demand.length}`);
console.log(`Individual usage rows: ${usage.length}`);
console.log('');

// Build comparison table
const rows = [];
for (const occ of activeOccs) {
  const id = occ.occupation_id;
  const L = laborMap[id];
  const D = demandMap[id];
  const U = usageMap[id];

  if (!L || !D) continue; // skip if missing core data

  const growth = parseFloat(L.projection_growth_pct);
  const adoptionRealization = parseFloat(D.adoption_realization_context);
  const indivGap = U ? parseFloat(U.individual_vs_org_gap) : 0;

  // BLS trajectory
  let bls_trajectory;
  if (growth < -2)      bls_trajectory = 'declining';
  else if (growth <= 5) bls_trajectory = 'stable';
  else                  bls_trajectory = 'growing';

  // Adoption pressure tier
  let adoption_pressure_tier;
  if (adoptionRealization >= 0.65)      adoption_pressure_tier = 'high';
  else if (adoptionRealization >= 0.35) adoption_pressure_tier = 'medium';
  else                                   adoption_pressure_tier = 'low';

  // Alignment classification
  let classification;
  const isHigh   = adoption_pressure_tier === 'high';
  const isMedium = adoption_pressure_tier === 'medium';
  const isLow    = adoption_pressure_tier === 'low';

  if (bls_trajectory === 'declining' && (isHigh || isMedium)) {
    classification = 'aligned';
  } else if (bls_trajectory === 'growing' && (isLow || isMedium)) {
    classification = 'aligned';
  } else if (bls_trajectory === 'growing' && isHigh) {
    classification = 'conflict-model-high';
  } else if (bls_trajectory === 'declining' && isLow) {
    classification = 'conflict-model-low';
  } else if (bls_trajectory === 'stable') {
    // stable is neutral — classify based on pressure as informational
    classification = 'stable-' + adoption_pressure_tier;
  } else {
    classification = 'other';
  }

  // Flag "interesting": declining with high individual usage gap
  const interesting = bls_trajectory === 'declining' && indivGap > 0.1;

  rows.push({
    id,
    title:                    occ.title_short || occ.title,
    growth_pct:               growth,
    bls_trajectory,
    ai_adoption_context:      parseFloat(D.ai_adoption_context),
    adoption_realization:     adoptionRealization,
    adoption_pressure_tier,
    indiv_gap:                indivGap,
    gap_direction:            U ? U.gap_direction : 'n/a',
    calibration_flag:         U ? U.calibration_flag : 'n/a',
    classification,
    interesting
  });
}

// Sort by growth_pct ascending (most declining first)
rows.sort((a, b) => a.growth_pct - b.growth_pct);

// ── FULL TABLE ──────────────────────────────────────────────────────────────
console.log('='.repeat(130));
console.log('FULL COMPARISON TABLE — sorted by BLS projection growth % (most declining first)');
console.log('='.repeat(130));

const COL = {
  title:        28,
  growth:        8,
  traj:         10,
  ai_adopt:     10,
  adopt_real:   11,
  tier:          8,
  gap:           9,
  gap_dir:      11,
  calib:         8,
  class_:       22,
};

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s.substring(0, n) : s + ' '.repeat(n - s.length);
}
function rpad(s, n) {
  s = String(s);
  return s.length >= n ? s.substring(0, n) : ' '.repeat(n - s.length) + s;
}

// Header
console.log(
  pad('Title', COL.title) +
  rpad('Growth%', COL.growth) +
  pad(' Trajectory', COL.traj) +
  rpad('AI_Adopt', COL.ai_adopt) +
  rpad('Realiz', COL.adopt_real) +
  pad(' Tier', COL.tier) +
  rpad('IndvGap', COL.gap) +
  pad(' GapDir', COL.gap_dir) +
  pad(' Calib', COL.calib) +
  '  Classification'
);
console.log('-'.repeat(130));

for (const r of rows) {
  const interesting_marker = r.interesting ? ' *' : '';
  console.log(
    pad(r.title, COL.title) +
    rpad(r.growth_pct.toFixed(1), COL.growth) +
    pad(' ' + r.bls_trajectory, COL.traj) +
    rpad(r.ai_adoption_context.toFixed(4), COL.ai_adopt) +
    rpad(r.adoption_realization.toFixed(4), COL.adopt_real) +
    pad(' ' + r.adoption_pressure_tier, COL.tier) +
    rpad(r.indiv_gap.toFixed(4), COL.gap) +
    pad(' ' + r.gap_direction, COL.gap_dir) +
    pad(' ' + r.calibration_flag, COL.calib) +
    '  ' + r.classification + interesting_marker
  );
}

console.log('');
console.log('* = interesting: BLS declining + high individual-vs-org gap (workers adapting faster than org adoption implies)');

// ── CONFLICT CASES ──────────────────────────────────────────────────────────
const conflicts = rows.filter(r => r.classification.startsWith('conflict'));

console.log('');
console.log('='.repeat(130));
console.log('CONFLICT CASES');
console.log('='.repeat(130));

if (conflicts.length === 0) {
  console.log('No conflict cases found.');
} else {
  for (const r of conflicts) {
    console.log('');
    console.log(`  ${r.title} (${r.id})`);
    console.log(`    BLS growth: ${r.growth_pct.toFixed(1)}%  →  ${r.bls_trajectory}`);
    console.log(`    Model adoption pressure: ${r.adoption_pressure_tier} (realization=${r.adoption_realization.toFixed(4)}, ai_adoption=${r.ai_adoption_context.toFixed(4)})`);
    console.log(`    Individual-vs-org gap: ${r.indiv_gap.toFixed(4)} (${r.gap_direction}) | calibration: ${r.calibration_flag}`);
    console.log(`    Classification: ${r.classification}`);

    if (r.classification === 'conflict-model-high') {
      console.log(`    Explanation: BLS projects employment growth, but the model sees high AI adoption pressure.`);
      console.log(`    This typically reflects occupations where AI enables productivity gains without headcount decline`);
      console.log(`    (i.e., augmentation rather than substitution), or where demand expansion offsets displacement.`);
      console.log(`    The model may be capturing task-level automation risk that BLS employment projections lag behind.`);
    } else if (r.classification === 'conflict-model-low') {
      console.log(`    Explanation: BLS projects employment decline, but the model sees low adoption pressure.`);
      console.log(`    This may indicate structural/demographic decline (e.g., offshoring, demand shifts) rather than`);
      console.log(`    AI-specific automation. The model correctly assigns low AI adoption pressure; the BLS decline`);
      console.log(`    has a different root cause.`);
    }
  }
}

// ── SUMMARY STATS ──────────────────────────────────────────────────────────
const aligned      = rows.filter(r => r.classification === 'aligned').length;
const confHigh     = rows.filter(r => r.classification === 'conflict-model-high').length;
const confLow      = rows.filter(r => r.classification === 'conflict-model-low').length;
const stableRows   = rows.filter(r => r.classification.startsWith('stable')).length;
const interestingN = rows.filter(r => r.interesting).length;

console.log('');
console.log('='.repeat(130));
console.log('SUMMARY');
console.log('='.repeat(130));
console.log(`Total occupations in comparison: ${rows.length}`);
console.log(`  Aligned (BLS + model consistent):  ${aligned}`);
console.log(`  Conflict — model-high (model >BLS): ${confHigh}`);
console.log(`  Conflict — model-low  (model <BLS): ${confLow}`);
console.log(`  Stable trajectory (neutral):        ${stableRows}`);
console.log(`  Interesting (declining + high gap): ${interestingN}`);
