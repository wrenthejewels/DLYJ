'use strict';

const fs = require('fs');
const path = require('path');

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(v) { return Math.min(1, Math.max(0, v)); }

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''); // strip BOM
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    // simple CSV parse: handle quoted fields
    const fields = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { fields.push(cur); cur = ''; }
      else { cur += c; }
    }
    fields.push(cur);
    const row = {};
    headers.forEach((h, i) => { row[h] = (fields[i] || '').trim(); });
    return row;
  });
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// ── Load data ──────────────────────────────────────────────────────────────

const BASE = path.join(__dirname, '..', 'data', 'normalized');
const orsRows   = parseCSV(path.join(BASE, 'occupation_ors_structural_context.csv'));
const priorRows = parseCSV(path.join(BASE, 'task_augmentation_automation_priors.csv'));

// ── Step 2: Build friction signals per occupation ──────────────────────────

const frictionByOcc = {}; // occupation_id → { judgment, accountability, tacit, exception, ors_confidence }

for (const row of orsRows) {
  const autonomy    = num(row['autonomy_intensity']);
  if (autonomy === null) continue; // skip occupations missing key ORS data

  const interaction   = num(row['interaction_intensity'])         ?? 0;
  const review        = num(row['review_intensity'])              ?? 0;
  const supervising   = num(row['supervising_others_share'])      ?? 0;
  const people_skill  = num(row['people_skill_intensity'])        ?? 0;
  const hci           = num(row['human_constraint_index'])        ?? 0;
  const wsv           = num(row['work_schedule_variability_share']) ?? 0;
  const self_paced    = num(row['self_paced_share'])              ?? 0;
  const confidence    = num(row['ors_confidence'])                ?? 0.5;

  const judgment       = clamp(autonomy * 0.60 + hci * 0.25 + wsv * 0.15);
  const accountability = clamp(review   * 0.50 + supervising * 0.50);
  const tacit          = clamp(interaction * 0.50 + people_skill * 0.35 + hci * 0.15);
  const exception      = clamp(wsv * 0.50 + (1 - self_paced) * 0.30 + hci * 0.20);

  frictionByOcc[row['occupation_id']] = { judgment, accountability, tacit, exception, ors_confidence: confidence };
}

console.log(`Occupations with valid ORS friction data: ${Object.keys(frictionByOcc).length}`);

// ── Step 3: Get cluster weights per occupation from File B ─────────────────

// Build a map: occupation_id → [ { cluster_id, exposure_score } ]
const clustersByOcc = {};
for (const row of priorRows) {
  const occ = row['occupation_id'];
  const cluster = row['task_cluster_id'];
  const exp = num(row['exposure_score']);
  if (!occ || !cluster || exp === null) continue;
  if (!clustersByOcc[occ]) clustersByOcc[occ] = [];
  clustersByOcc[occ].push({ cluster_id: cluster, exposure_score: exp });
}

// For each occupation in frictionByOcc, compute normalised cluster weights
// weight_raw = 1 - exposure_score  (higher retention → more central to this occ's work)
const occClusterWeights = {}; // occ_id → { cluster_id: normalised_weight }

for (const occ of Object.keys(frictionByOcc)) {
  const clusters = clustersByOcc[occ];
  if (!clusters || clusters.length === 0) continue;

  const rawWeights = clusters.map(c => ({ cluster_id: c.cluster_id, w: Math.max(0, 1 - c.exposure_score) }));
  const total = rawWeights.reduce((s, c) => s + c.w, 0);
  if (total === 0) continue;

  const norm = {};
  for (const { cluster_id, w } of rawWeights) { norm[cluster_id] = w / total; }
  occClusterWeights[occ] = norm;
}

console.log(`Occupations with both ORS + cluster data: ${Object.keys(occClusterWeights).length}`);

// ── Step 4: Weighted cluster averages ─────────────────────────────────────
// For each cluster, gather (friction_dimension × normalized_cluster_weight) across occupations,
// weighted by ors_confidence.

const clusterAccum = {}; // cluster_id → { dims: {judgment, accountability, tacit, exception}, total_weight }

for (const occ of Object.keys(occClusterWeights)) {
  const friction    = frictionByOcc[occ];
  const clusterWts  = occClusterWeights[occ];
  const conf        = friction.ors_confidence;

  for (const [cluster_id, normW] of Object.entries(clusterWts)) {
    const effectiveW = normW * conf; // final weight for this occupation's contribution to this cluster
    if (!clusterAccum[cluster_id]) {
      clusterAccum[cluster_id] = { judgment: 0, accountability: 0, tacit: 0, exception: 0, total_weight: 0 };
    }
    const a = clusterAccum[cluster_id];
    a.judgment       += friction.judgment       * effectiveW;
    a.accountability += friction.accountability * effectiveW;
    a.tacit          += friction.tacit          * effectiveW;
    a.exception      += friction.exception      * effectiveW;
    a.total_weight   += effectiveW;
  }
}

// Finalise: divide by total_weight
const derived = {};
for (const [cluster_id, a] of Object.entries(clusterAccum)) {
  if (a.total_weight === 0) continue;
  derived[cluster_id] = {
    judgment:       a.judgment       / a.total_weight,
    accountability: a.accountability / a.total_weight,
    tacit:          a.tacit          / a.total_weight,
    exception:      a.exception      / a.total_weight,
  };
}

// ── Step 5: Compare vs hard-coded values ──────────────────────────────────

const hardcoded = {
  cluster_drafting:              { exception: 0.25, accountability: 0.35, judgment: 0.30, document: 1.00, tacit: 0.20 },
  cluster_analysis:              { exception: 0.45, accountability: 0.55, judgment: 0.55, document: 0.80, tacit: 0.35 },
  cluster_research_synthesis:    { exception: 0.60, accountability: 0.45, judgment: 0.55, document: 0.75, tacit: 0.40 },
  cluster_coordination:          { exception: 0.75, accountability: 0.55, judgment: 0.65, document: 0.35, tacit: 0.80 },
  cluster_client_interaction:    { exception: 0.70, accountability: 0.65, judgment: 0.85, document: 0.25, tacit: 0.85 },
  cluster_qa_review:             { exception: 0.40, accountability: 0.80, judgment: 0.55, document: 0.55, tacit: 0.35 },
  cluster_decision_support:      { exception: 0.65, accountability: 0.85, judgment: 0.80, document: 0.55, tacit: 0.60 },
  cluster_execution_routine:     { exception: 0.15, accountability: 0.35, judgment: 0.15, document: 0.35, tacit: 0.15 },
  cluster_oversight_strategy:    { exception: 0.70, accountability: 0.85, judgment: 0.90, document: 0.45, tacit: 0.80 },
  cluster_relationship_management:{ exception: 0.65, accountability: 0.55, judgment: 0.90, document: 0.20, tacit: 0.90 },
  cluster_documentation:         { exception: 0.12, accountability: 0.35, judgment: 0.18, document: 0.95, tacit: 0.10 },
  cluster_workflow_admin:        { exception: 0.20, accountability: 0.35, judgment: 0.18, document: 0.55, tacit: 0.12 },
};

const DIMS = ['exception', 'accountability', 'judgment', 'tacit'];
const THRESHOLD = 0.12;

const pad  = (s, n) => String(s).padEnd(n);
const fpad = (v, n) => (v === null || v === undefined ? 'N/A'.padStart(n) : v.toFixed(3).padStart(n));
const sign = v => (v >= 0 ? '+' : '') + v.toFixed(3);

console.log('\n');
console.log('═'.repeat(130));
console.log('CLUSTER FRICTION VALIDATION  —  ORS-derived vs Hard-coded');
console.log('═'.repeat(130));

const allClusters = Object.keys(hardcoded);

for (const cluster_id of allClusters) {
  const hc = hardcoded[cluster_id];
  const d  = derived[cluster_id];

  console.log('\n' + '─'.repeat(130));
  console.log(`CLUSTER: ${cluster_id}`);
  console.log('─'.repeat(130));

  const header = pad('Dimension', 22) + pad('Hard-coded', 12) + pad('ORS-derived', 13) + pad('Delta', 12) + 'Flag';
  console.log(header);
  console.log('·'.repeat(70));

  for (const dim of DIMS) {
    const hcVal  = hc[dim];
    const dVal   = d ? d[dim] : null;
    const delta  = dVal !== null ? dVal - hcVal : null;
    const flag   = (delta !== null && Math.abs(delta) > THRESHOLD) ? `  *** |delta| > ${THRESHOLD}` : '';
    console.log(
      pad(dim, 22) +
      fpad(hcVal, 10) + '  ' +
      (dVal !== null ? fpad(dVal, 10) : '       N/A') + '   ' +
      (delta !== null ? sign(delta).padStart(9) : '      N/A') +
      flag
    );
  }
  // document is always null from ORS — just show hard-coded for completeness
  console.log(pad('document_intensity', 22) + fpad(hc.document, 10) + '  ' + '       N/A' + '   ' + '      N/A  (no ORS proxy)');

  if (!d) {
    console.log('\n  [!] No ORS-derived data available for this cluster.');
  }
}

console.log('\n' + '═'.repeat(130));
console.log('SUMMARY — Clusters with at least one |delta| > 0.12');
console.log('═'.repeat(130));

let anyFlagged = false;
for (const cluster_id of allClusters) {
  const hc = hardcoded[cluster_id];
  const d  = derived[cluster_id];
  if (!d) continue;
  const flags = DIMS.filter(dim => Math.abs(d[dim] - hc[dim]) > THRESHOLD);
  if (flags.length > 0) {
    anyFlagged = true;
    const details = flags.map(dim => `${dim}: Δ=${sign(d[dim] - hc[dim])}`).join('  |  ');
    console.log(`  ${pad(cluster_id, 38)}  ${details}`);
  }
}
if (!anyFlagged) console.log('  (none)');

console.log('\n' + '═'.repeat(130));
console.log('CLUSTER COVERAGE — occupations contributing to each cluster');
console.log('═'.repeat(130));

// Count occupations with non-zero weight per cluster
const clusterOccCount = {};
for (const occ of Object.keys(occClusterWeights)) {
  for (const cluster_id of Object.keys(occClusterWeights[occ])) {
    clusterOccCount[cluster_id] = (clusterOccCount[cluster_id] || 0) + 1;
  }
}
for (const c of Object.keys(hardcoded).sort()) {
  const n = clusterOccCount[c] || 0;
  const tw = clusterAccum[c] ? clusterAccum[c].total_weight.toFixed(4) : 'N/A';
  console.log(`  ${pad(c, 38)}  occupations=${String(n).padStart(3)}  effective_weight=${tw}`);
}

console.log('');
