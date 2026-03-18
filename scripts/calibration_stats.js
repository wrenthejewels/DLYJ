const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'data', 'normalized');

// --- CSV parser (handles quoted fields) ---
function parseCSV(filepath) {
  const text = fs.readFileSync(filepath, 'utf8');
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');
  const headers = splitCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = vals[idx] !== undefined ? vals[idx].trim() : ''; });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuote = !inQuote; }
    else if (c === ',' && !inQuote) { result.push(cur); cur = ''; }
    else { cur += c; }
  }
  result.push(cur);
  return result;
}

function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

function percentile(sorted, p) {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n === 0) return null;
  const mx = xs.reduce((a,b)=>a+b,0)/n;
  const my = ys.reduce((a,b)=>a+b,0)/n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]-mx, dy = ys[i]-my;
    num += dx*dy; dx2 += dx*dx; dy2 += dy*dy;
  }
  return num / Math.sqrt(dx2 * dy2);
}

function groupAvg(rows, groupKey, valueKey, filterFn) {
  const acc = {};
  for (const row of rows) {
    if (filterFn && !filterFn(row)) continue;
    const g = row[groupKey];
    const v = num(row[valueKey]);
    if (g === undefined || g === '' || v === null) continue;
    if (!acc[g]) acc[g] = { sum: 0, count: 0 };
    acc[g].sum += v;
    acc[g].count++;
  }
  const result = {};
  for (const g in acc) result[g] = acc[g].sum / acc[g].count;
  return result;
}

// ============================================================
// 1. task_exposure_evidence.csv
// ============================================================
console.log('\n=== 1. task_exposure_evidence.csv ===\n');

const evidence = parseCSV(path.join(BASE, 'task_exposure_evidence.csv'));
console.log(`Rows loaded: ${evidence.length}`);

// Distribution of automation_score
const autoScores = evidence.map(r => num(r['automation_score'])).filter(v => v !== null);
autoScores.sort((a,b) => a-b);
const percentiles = [10,25,35,50,65,75,90];
console.log('\nautomation_score percentiles:');
percentiles.forEach(p => {
  console.log(`  p${p}: ${percentile(autoScores, p).toFixed(4)}`);
});
console.log(`  min: ${autoScores[0].toFixed(4)}`);
console.log(`  max: ${autoScores[autoScores.length-1].toFixed(4)}`);

// Correlation: automation_score vs observed_usage_share (where usage_share > 0)
const corrRows = evidence.filter(r => {
  const u = num(r['observed_usage_share']);
  return u !== null && u > 0;
});
const corrAuto = corrRows.map(r => num(r['automation_score']));
const corrUsage = corrRows.map(r => num(r['observed_usage_share']));
const r = pearson(corrAuto, corrUsage);
console.log(`\nCorrelation (automation_score vs observed_usage_share, n=${corrRows.length}): ${r !== null ? r.toFixed(4) : 'N/A'}`);

// Avg automation_score per cluster
const clusterAutoAvg = groupAvg(evidence, 'task_cluster_id', 'automation_score');
console.log('\nAvg automation_score per task_cluster_id:');
Object.entries(clusterAutoAvg).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([k,v]) => {
  console.log(`  ${k}: ${v.toFixed(4)}`);
});

// Avg observed_usage_share (nonzero) per cluster
const clusterUsageAvg = groupAvg(evidence, 'task_cluster_id', 'observed_usage_share', r => {
  const u = num(r['observed_usage_share']);
  return u !== null && u > 0;
});
console.log('\nAvg observed_usage_share (nonzero rows) per task_cluster_id:');
Object.entries(clusterUsageAvg).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([k,v]) => {
  console.log(`  ${k}: ${v.toFixed(4)}`);
});

// ============================================================
// 2. occupation_ors_structural_context.csv
// ============================================================
console.log('\n=== 2. occupation_ors_structural_context.csv ===\n');

const ors = parseCSV(path.join(BASE, 'occupation_ors_structural_context.csv'));
console.log(`Rows loaded: ${ors.length}`);

const fields = ['autonomy_intensity','interaction_intensity','review_intensity','supervising_others_share','human_constraint_index'];
console.log('\nOccupation structural context values:');
console.log(['occupation_id', ...fields].join('\t'));
for (const row of ors) {
  const vals = fields.map(f => {
    const v = num(row[f]);
    return v !== null ? v.toFixed(4) : 'N/A';
  });
  console.log([row['occupation_id'], ...vals].join('\t'));
}

// ============================================================
// 3. task_augmentation_automation_priors.csv
// ============================================================
console.log('\n=== 3. task_augmentation_automation_priors.csv ===\n');

const priors = parseCSV(path.join(BASE, 'task_augmentation_automation_priors.csv'));
console.log(`Rows loaded: ${priors.length}`);

const partialAvg = groupAvg(priors, 'task_cluster_id', 'partial_automation_likelihood');
const highAvg    = groupAvg(priors, 'task_cluster_id', 'high_automation_likelihood');

// Collect all cluster ids
const allClusters = new Set([...Object.keys(partialAvg), ...Object.keys(highAvg)]);

console.log('\nAvg partial_automation_likelihood and high_automation_likelihood per task_cluster_id:');
console.log('task_cluster_id\tpartial_automation_avg\thigh_automation_avg');
Array.from(allClusters).sort().forEach(k => {
  const p = partialAvg[k] !== undefined ? partialAvg[k].toFixed(4) : 'N/A';
  const h = highAvg[k]    !== undefined ? highAvg[k].toFixed(4)    : 'N/A';
  console.log(`${k}\t${p}\t${h}`);
});
