// OLS regression to empirically derive AUTOMATION_DIFFICULTY_WEIGHTS
// Usage: node scripts/ols_weight_regression.js

const fs = require('fs');
const path = require('path');

// ─── Friction profiles ────────────────────────────────────────────────────────
const FRICTION_PROFILES = {
  cluster_drafting:               { exception: 0.25, accountability: 0.35, judgment: 0.30, document: 1.00, tacit: 0.20 },
  cluster_analysis:               { exception: 0.45, accountability: 0.55, judgment: 0.55, document: 0.80, tacit: 0.35 },
  cluster_research_synthesis:     { exception: 0.60, accountability: 0.45, judgment: 0.55, document: 0.75, tacit: 0.40 },
  cluster_coordination:           { exception: 0.75, accountability: 0.55, judgment: 0.65, document: 0.35, tacit: 0.80 },
  cluster_client_interaction:     { exception: 0.70, accountability: 0.65, judgment: 0.85, document: 0.25, tacit: 0.85 },
  cluster_qa_review:              { exception: 0.40, accountability: 0.80, judgment: 0.55, document: 0.55, tacit: 0.35 },
  cluster_decision_support:       { exception: 0.65, accountability: 0.85, judgment: 0.80, document: 0.55, tacit: 0.60 },
  cluster_execution_routine:      { exception: 0.15, accountability: 0.35, judgment: 0.15, document: 0.35, tacit: 0.15 },
  cluster_oversight_strategy:     { exception: 0.70, accountability: 0.85, judgment: 0.90, document: 0.45, tacit: 0.80 },
  cluster_relationship_management:{ exception: 0.65, accountability: 0.55, judgment: 0.90, document: 0.20, tacit: 0.90 },
  cluster_documentation:          { exception: 0.12, accountability: 0.35, judgment: 0.18, document: 0.95, tacit: 0.10 },
  cluster_workflow_admin:         { exception: 0.20, accountability: 0.35, judgment: 0.18, document: 0.55, tacit: 0.12 },
};

// FRICTION_WEIGHTS: accountability=0.25, judgment=0.22, tacit=0.22, exception=0.18, inverse_document=0.13
function computeIntrinsicFriction(cluster) {
  const p = FRICTION_PROFILES[cluster];
  if (!p) return null;
  return (p.accountability * 0.25) + (p.judgment * 0.22) + (p.tacit * 0.22) +
         (p.exception * 0.18) + ((1 - p.document) * 0.13);
}

// ─── Human advantage (raw h, component = 0.35 * h) ───────────────────────────
const HUMAN_ADVANTAGE = {
  cluster_client_interaction:      1.00,
  cluster_relationship_management: 1.00,
  cluster_oversight_strategy:      0.85,
  cluster_coordination:            0.65,
  cluster_decision_support:        0.55,
  cluster_qa_review:               0.45,
  cluster_research_synthesis:      0.35,
  cluster_analysis:                0.30,
  cluster_documentation:           0.20,
  cluster_drafting:                0.15,
  cluster_workflow_admin:          0.12,
  cluster_execution_routine:       0.05,
};

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const lines = raw.trim().split('\n');
  const header = lines[0].replace(/\r/, '').split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const cols = line.replace(/\r/, '').split(',').map(c => c.replace(/"/g, '').trim());
    const row = {};
    header.forEach((h, i) => row[h] = cols[i]);
    return row;
  });
}

// ─── Load files ───────────────────────────────────────────────────────────────
const BASE = path.join(__dirname, '..', 'data', 'normalized');
const fileA = parseCSV(path.join(BASE, 'task_exposure_evidence.csv'));
const fileB = parseCSV(path.join(BASE, 'task_augmentation_automation_priors.csv'));

console.log(`File A rows: ${fileA.length}`);
console.log(`File B rows: ${fileB.length}`);

// ─── Build empiricalResistance lookup ─────────────────────────────────────────
// R = 1 - avg(partial_automation_likelihood, high_automation_likelihood)
const resistanceByOccCluster = {};
const resistanceByCluster = {};   // for fallback

for (const row of fileB) {
  const occ = row.occupation_id;
  const cl  = row.task_cluster_id;
  const pal = parseFloat(row.partial_automation_likelihood);
  const hal = parseFloat(row.high_automation_likelihood);
  if (isNaN(pal) || isNaN(hal)) continue;
  const R = 1 - (pal + hal) / 2;
  resistanceByOccCluster[`${occ}|${cl}`] = R;
  if (!resistanceByCluster[cl]) resistanceByCluster[cl] = [];
  resistanceByCluster[cl].push(R);
}

// Compute cluster-level averages for fallback
const clusterAvgResistance = {};
for (const [cl, vals] of Object.entries(resistanceByCluster)) {
  clusterAvgResistance[cl] = vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Build regression dataset ─────────────────────────────────────────────────
// NOTE: couplingProtection = 0.5 (constant) is collinear with the intercept.
// We regress only [intrinsicFriction, humanAdvantage_scaled, empiricalResistance]
// and recover the couplingProtection weight separately by fixing it at its current
// ratio relative to the other weights, then renormalize all four together.
const X = [];  // [intrinsicFriction, humanAdvantage_scaled, empiricalResistance]
const y = [];  // 1 - automation_score

let skipped_confidence = 0, skipped_missing = 0;

for (const row of fileA) {
  const autoScore = parseFloat(row.automation_score);
  const conf      = parseFloat(row.confidence);
  const cluster   = row.task_cluster_id;
  const occ       = row.occupation_id;

  if (isNaN(autoScore) || isNaN(conf)) { skipped_missing++; continue; }
  if (conf < 0.50) { skipped_confidence++; continue; }
  if (!FRICTION_PROFILES[cluster]) { skipped_missing++; continue; }

  const intrinsic = computeIntrinsicFriction(cluster);
  const h_scaled  = 0.35 * (HUMAN_ADVANTAGE[cluster] ?? 0);
  const key       = `${occ}|${cluster}`;
  const resistance = resistanceByOccCluster[key] !== undefined
    ? resistanceByOccCluster[key]
    : (clusterAvgResistance[cluster] ?? 0.5);

  X.push([intrinsic, h_scaled, resistance]);
  y.push(1 - autoScore);
}

console.log(`\nUsable rows for regression: ${X.length}`);
console.log(`Skipped (confidence < 0.50): ${skipped_confidence}`);
console.log(`Skipped (missing data/cluster): ${skipped_missing}`);

// ─── OLS via normal equations: β = (XᵀX)⁻¹ Xᵀy ─────────────────────────────
// Add intercept column
const n = X.length;
const p = 4; // 3 predictors + 1 intercept (coupling dropped: constant = collinear with intercept)

// Build design matrix with intercept
const Xd = X.map(row => [1, ...row]);

// Compute XᵀX (p×p) and Xᵀy (p×1)
function matMul(A, B, rowsA, colsA, colsB) {
  const C = Array.from({length: rowsA}, () => new Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++)
    for (let k = 0; k < colsA; k++)
      for (let j = 0; j < colsB; j++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

// XᵀX
const XtX = Array.from({length: p}, () => new Array(p).fill(0));
for (let i = 0; i < p; i++)
  for (let j = 0; j < p; j++)
    for (let k = 0; k < n; k++)
      XtX[i][j] += Xd[k][i] * Xd[k][j];

// Xᵀy
const Xty = new Array(p).fill(0);
for (let i = 0; i < p; i++)
  for (let k = 0; k < n; k++)
    Xty[i] += Xd[k][i] * y[k];

// Invert XᵀX via Gaussian elimination with partial pivoting
function invertMatrix(M, size) {
  const A = M.map(row => [...row]);
  const I = Array.from({length: size}, (_, i) => Array.from({length: size}, (_, j) => i === j ? 1 : 0));
  for (let col = 0; col < size; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < size; row++)
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    [A[col], A[maxRow]] = [A[maxRow], A[col]];
    [I[col], I[maxRow]] = [I[maxRow], I[col]];
    const pivot = A[col][col];
    if (Math.abs(pivot) < 1e-12) throw new Error(`Singular matrix at col ${col}`);
    for (let j = 0; j < size; j++) { A[col][j] /= pivot; I[col][j] /= pivot; }
    for (let row = 0; row < size; row++) {
      if (row === col) continue;
      const factor = A[row][col];
      for (let j = 0; j < size; j++) {
        A[row][j] -= factor * A[col][j];
        I[row][j] -= factor * I[col][j];
      }
    }
  }
  return I;
}

const XtX_inv = invertMatrix(XtX, p);

// β = XᵀX⁻¹ Xᵀy
const beta = new Array(p).fill(0);
for (let i = 0; i < p; i++)
  for (let j = 0; j < p; j++)
    beta[i] += XtX_inv[i][j] * Xty[j];

const [intercept, w1, w2, w3] = beta;
// w4 (couplingProtection) cannot be estimated from constant data.
// We assign it a placeholder = 0 for OLS purposes; see normalization below.
const w4 = 0;

// ─── R² ───────────────────────────────────────────────────────────────────────
const yMean = y.reduce((a, b) => a + b, 0) / n;
let ssTot = 0, ssRes = 0;
for (let k = 0; k < n; k++) {
  const yHat = intercept + w1 * X[k][0] + w2 * X[k][1] + w3 * X[k][2];
  ssTot += (y[k] - yMean) ** 2;
  ssRes += (y[k] - yHat) ** 2;
}
const r2 = 1 - ssRes / ssTot;

// ─── Normalize weights to sum to 1 ───────────────────────────────────────────
// couplingProtection cannot be identified via OLS (constant predictor).
// Strategy A: normalize only the 3 OLS weights (report coupling as "not identified").
// Strategy B: re-insert coupling at its current proportion of the current sum (0.10 out of 1.0),
//   then renormalize the 3 OLS weights to fill the remaining 0.90.
const olsWeights = [w1, w2, w3];
const olsSum = olsWeights.reduce((a, b) => a + b, 0);

// Strategy A: normalize 3 weights only
const normOLS = olsWeights.map(w => w / olsSum);

// Strategy B: fix coupling at its current fraction (0.10), scale OLS weights to 0.90
const COUPLING_FIXED_SHARE = 0.10;
const normB = olsWeights.map(w => (w / olsSum) * (1 - COUPLING_FIXED_SHARE));
normB.push(COUPLING_FIXED_SHARE);  // append coupling

// ─── Predictor and target means ───────────────────────────────────────────────
const means = [0, 0, 0];
for (const row of X) row.forEach((v, i) => means[i] += v);
means.forEach((_, i) => means[i] /= n);
const yMeanVal = yMean;

// ─── Per-cluster analysis ─────────────────────────────────────────────────────
const CURRENT_WEIGHTS = { intrinsic: 0.40, human: 0.25, empirical: 0.25, coupling: 0.10 };
const COUPLING_DEFAULT = 0.5;

// Gather automation scores per cluster
const clusterAutoScores = {};
for (const row of fileA) {
  const cl = row.task_cluster_id;
  const autoScore = parseFloat(row.automation_score);
  const conf = parseFloat(row.confidence);
  if (isNaN(autoScore) || isNaN(conf) || conf < 0.50) continue;
  if (!clusterAutoScores[cl]) clusterAutoScores[cl] = [];
  clusterAutoScores[cl].push(autoScore);
}

// ─── Print results ────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  OLS REGRESSION RESULTS');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`\nR² = ${r2.toFixed(6)}`);
console.log(`\nIntercept = ${intercept.toFixed(6)}`);

console.log('\n─── Raw OLS Coefficients (3 estimable predictors) ──────────────');
const labelsOLS = ['intrinsicFriction', 'humanAdvantage_scaled', 'empiricalResistance'];
olsWeights.forEach((w, i) => console.log(`  ${labelsOLS[i].padEnd(22)}: ${w.toFixed(6)}`));
console.log(`  ${'Sum (OLS 3)'.padEnd(22)}: ${olsSum.toFixed(6)}`);
console.log(`  (couplingProtection = 0.5 constant; absorbed into intercept — not separately identified)`);

console.log('\n─── Strategy A: Normalized OLS weights (3 predictors, coupling not included) ───');
const currentA = [0.40, 0.25, 0.25];
normOLS.forEach((w, i) => {
  const diff = w - currentA[i];
  const sign = diff >= 0 ? '+' : '';
  console.log(`  ${labelsOLS[i].padEnd(22)}: ${w.toFixed(4)}   (current: ${currentA[i].toFixed(2)}, Δ ${sign}${diff.toFixed(4)})`);
});

console.log('\n─── Strategy B: Fix coupling at 0.10, rescale 3 OLS weights to 0.90 ───────────');
const labelsB = ['intrinsicFriction', 'humanAdvantage_scaled', 'empiricalResistance', 'couplingProtection'];
const currentB = [0.40, 0.25, 0.25, 0.10];
normB.forEach((w, i) => {
  const diff = w - currentB[i];
  const sign = diff >= 0 ? '+' : '';
  console.log(`  ${labelsB[i].padEnd(22)}: ${w.toFixed(4)}   (current: ${currentB[i].toFixed(2)}, Δ ${sign}${diff.toFixed(4)})`);
});

console.log('\n─── Predictor and Target Means ─────────────────────────────────');
labelsOLS.forEach((l, i) => console.log(`  mean(${l.padEnd(22)}): ${means[i].toFixed(4)}`));
console.log(`  mean(couplingProtection    ): 0.5000  (constant)`);
console.log(`  mean(y = 1 - automation_score): ${yMeanVal.toFixed(4)}`);

console.log('\n─── Per-Cluster: Current Model vs Empirical Difficulty ─────────');
console.log(`  ${'Cluster'.padEnd(34)} ${'Model Diff'.padEnd(12)} ${'Empirical Diff'.padEnd(16)} ${'Δ'.padEnd(10)} N`);
console.log(`  ${'-'.repeat(80)}`);

// Compute per-cluster model difficulty with current weights
for (const cl of Object.keys(FRICTION_PROFILES).sort()) {
  const intrinsic = computeIntrinsicFriction(cl);
  const h_scaled  = 0.35 * (HUMAN_ADVANTAGE[cl] ?? 0);
  const avgR = clusterAvgResistance[cl] ?? 0.5;
  const modelDiff = CURRENT_WEIGHTS.intrinsic * intrinsic
                  + CURRENT_WEIGHTS.human     * h_scaled
                  + CURRENT_WEIGHTS.empirical * avgR
                  + CURRENT_WEIGHTS.coupling  * COUPLING_DEFAULT;

  const autoScores = clusterAutoScores[cl];
  if (!autoScores || autoScores.length === 0) {
    console.log(`  ${cl.padEnd(34)} ${modelDiff.toFixed(4).padEnd(12)} ${'(no data)'.padEnd(16)} ${'—'.padEnd(10)}`);
    continue;
  }
  const avgAuto = autoScores.reduce((a, b) => a + b, 0) / autoScores.length;
  const empirDiff = 1 - avgAuto;
  const delta = modelDiff - empirDiff;
  const sign = delta >= 0 ? '+' : '';
  console.log(`  ${cl.padEnd(34)} ${modelDiff.toFixed(4).padEnd(12)} ${empirDiff.toFixed(4).padEnd(16)} ${(sign + delta.toFixed(4)).padEnd(10)} ${autoScores.length}`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  SUGGESTED NEW WEIGHTS — Strategy B (OLS-derived, coupling fixed at 0.10):');
labelsB.forEach((l, i) => console.log(`    ${l}: ${normB[i].toFixed(4)}`));
console.log('\n  SUGGESTED NEW WEIGHTS — Strategy A (OLS-derived, coupling excluded):');
labelsOLS.forEach((l, i) => console.log(`    ${l}: ${normOLS[i].toFixed(4)}`));
console.log('  (coupling weight not separately estimated; set manually if needed)');
console.log('═══════════════════════════════════════════════════════════════\n');
