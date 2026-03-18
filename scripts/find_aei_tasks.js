// find_aei_tasks.js
// Finds tasks with meaningful AEI penetration but no current evidence entries,
// looks up context, and drafts new evidence rows.

const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/clayw/Test 8-22';

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
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
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function csvEscape(val) {
  if (val === null || val === undefined) val = '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function rowToCSV(row, headers) {
  return headers.map(h => csvEscape(row[h])).join(',');
}

// ── load files ────────────────────────────────────────────────────────────────

console.log('Loading files...');

const penetrationRows = parseCSV(path.join(BASE, 'data/raw/anthropic_economic_index/labor_market_impacts/task_penetration.csv'));
const evidenceRows    = parseCSV(path.join(BASE, 'data/normalized/task_exposure_evidence.csv'));
const occTaskRows        = parseCSV(path.join(BASE, 'data/normalized/occupation_tasks.csv'));
const clusterMemberRows  = parseCSV(path.join(BASE, 'data/normalized/task_cluster_membership.csv'));
const occupationRows     = parseCSV(path.join(BASE, 'data/normalized/occupations.csv'));
const priorsRows         = parseCSV(path.join(BASE, 'data/normalized/task_augmentation_automation_priors.csv'));

console.log(`  task_penetration rows: ${penetrationRows.length}`);
console.log(`  task_exposure_evidence rows: ${evidenceRows.length}`);
console.log(`  occupation_tasks rows: ${occTaskRows.length}`);
console.log(`  task_cluster_membership rows: ${clusterMemberRows.length}`);
console.log(`  occupations rows: ${occupationRows.length}`);
console.log(`  task_augmentation_automation_priors rows: ${priorsRows.length}`);

// ── Step 1: build lookup maps ─────────────────────────────────────────────────

// Penetration: exact task text → penetration value
const penetrationMap = new Map();
for (const r of penetrationRows) {
  const text = r['task'] ? r['task'].trim() : '';
  const val  = parseFloat(r['penetration']);
  if (text) penetrationMap.set(text, isNaN(val) ? 0 : val);
}

// Cluster membership: (occ_id, onet_task_id) → task_cluster_id
// occupation_tasks.csv has empty task_cluster_id for these tasks; use task_cluster_membership.csv instead
const clusterMemberMap = new Map(); // key: `${occ_id}|${task_id}` → cluster_id
for (const r of clusterMemberRows) {
  const key = `${r['occupation_id']}|${r['onet_task_id']}`;
  clusterMemberMap.set(key, r['task_cluster_id']);
}

// Evidence: set of onet_task_id values that already have evidence
const evidenceTaskIds = new Set(evidenceRows.map(r => r['onet_task_id'].trim()));
console.log(`\nDistinct onet_task_ids with evidence: ${evidenceTaskIds.size}`);

// Occupations: occupation_id → title
const occupationMap = new Map();
for (const r of occupationRows) {
  occupationMap.set(r['occupation_id'], r['title'] || r['title_short'] || '');
}

// Priors: (occupation_id, task_cluster_id) → priors row
// Also build cluster-only map (first match wins; priors are per-occ/cluster combo)
const priorsMap = new Map(); // key: `${occ_id}|${cluster_id}`
const clusterPriorsMap = new Map(); // key: cluster_id → first matching row
for (const r of priorsRows) {
  const key = `${r['occupation_id']}|${r['task_cluster_id']}`;
  priorsMap.set(key, r);
  if (!clusterPriorsMap.has(r['task_cluster_id'])) {
    clusterPriorsMap.set(r['task_cluster_id'], r);
  }
}

// Evidence: cluster augmentation averages (for augmentation_score)
// key: task_cluster_id → array of augmentation_score values
const clusterAugMap = new Map();
for (const r of evidenceRows) {
  const cid = r['task_cluster_id'];
  const aug = parseFloat(r['augmentation_score']);
  if (cid && !isNaN(aug)) {
    if (!clusterAugMap.has(cid)) clusterAugMap.set(cid, []);
    clusterAugMap.get(cid).push(aug);
  }
}
// Compute averages
const clusterAugAvg = new Map();
for (const [cid, vals] of clusterAugMap) {
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  clusterAugAvg.set(cid, avg);
}

// ── Step 2: find candidate tasks ──────────────────────────────────────────────

console.log('\n── Step 1: Finding tasks with penetration > 0.01 and no evidence ──');

const candidates = [];

for (const taskRow of occTaskRows) {
  const taskId    = taskRow['onet_task_id'] ? taskRow['onet_task_id'].trim() : '';
  const taskText  = taskRow['task_statement'] ? taskRow['task_statement'].trim() : '';
  const occId     = taskRow['occupation_id'] ? taskRow['occupation_id'].trim() : '';
  // Prefer task_cluster_id from occupation_tasks; fall back to task_cluster_membership
  const clusterId = (taskRow['task_cluster_id'] && taskRow['task_cluster_id'].trim())
    || clusterMemberMap.get(`${occId}|${taskId}`)
    || '';

  if (!taskId || !taskText) continue;

  // Check penetration by exact text match
  const penetration = penetrationMap.get(taskText);
  if (penetration === undefined || penetration <= 0.01) continue;

  // Check no evidence
  if (evidenceTaskIds.has(taskId)) continue;

  candidates.push({ taskId, taskText, occId, clusterId, penetration });
}

console.log(`\nTotal candidates found: ${candidates.length}`);

if (candidates.length === 0) {
  console.log('\nNo candidates found. Checking near-match sample...');
  // Debug: show first 5 occupation_tasks descriptions vs first 5 penetration keys
  const ptKeys = [...penetrationMap.keys()].slice(0, 5);
  const otTexts = occTaskRows.slice(0, 5).map(r => r['task_statement']);
  console.log('Sample penetration keys:', ptKeys);
  console.log('Sample occupation_tasks texts:', otTexts);
  process.exit(0);
}

// ── Step 3: enrich candidates ─────────────────────────────────────────────────

console.log('\n── Step 2: Enriched candidate list ──\n');

const enriched = candidates.map(c => {
  const occName   = occupationMap.get(c.occId) || '(unknown)';

  // Priors: try occ+cluster first, fallback to cluster only
  let priorRow = priorsMap.get(`${c.occId}|${c.clusterId}`) || clusterPriorsMap.get(c.clusterId);
  const partialAuto = priorRow ? parseFloat(priorRow['partial_automation_likelihood']) : NaN;
  const highAuto    = priorRow ? parseFloat(priorRow['high_automation_likelihood'])    : NaN;

  return { ...c, occName, partialAuto, highAuto };
});

// Print table
const header = [
  'task_id'.padEnd(10),
  'task_description (80 chars)'.padEnd(82),
  'occupation_id'.padEnd(18),
  'occupation_name'.padEnd(38),
  'task_cluster_id'.padEnd(28),
  'penetration'.padEnd(12),
  'partial_auto'.padEnd(13),
  'high_auto'
].join(' | ');

console.log(header);
console.log('─'.repeat(header.length));

for (const c of enriched) {
  const desc80 = c.taskText.slice(0, 80).padEnd(82);
  console.log([
    c.taskId.padEnd(10),
    desc80,
    c.occId.padEnd(18),
    c.occName.slice(0, 37).padEnd(38),
    (c.clusterId || '').padEnd(28),
    String(c.penetration.toFixed(4)).padEnd(12),
    (isNaN(c.partialAuto) ? 'N/A' : c.partialAuto.toFixed(3)).padEnd(13),
    (isNaN(c.highAuto)    ? 'N/A' : c.highAuto.toFixed(3))
  ].join(' | '));
}

// ── Step 4: draft evidence rows ───────────────────────────────────────────────

console.log('\n── Step 3: Drafted evidence CSV rows ──\n');

const evidenceHeaders = [
  'occupation_id','onet_task_id','task_cluster_id','source_id',
  'exposure_score','augmentation_score','automation_score',
  'observed_usage_share','evidence_type','confidence','notes'
];

console.log(evidenceHeaders.join(','));

const draftedRows = [];

for (const c of enriched) {
  const partialAuto = isNaN(c.partialAuto) ? 0.30 : c.partialAuto;
  const highAuto    = isNaN(c.highAuto)    ? 0.20 : c.highAuto;

  // exposure_score: approximate from partial_auto
  const exposureScore      = parseFloat(partialAuto.toFixed(3));
  // augmentation_score: cluster average from existing evidence, fallback to 0.20
  const augmentationScore  = clusterAugAvg.has(c.clusterId)
    ? parseFloat(clusterAugAvg.get(c.clusterId).toFixed(3))
    : 0.20;
  // automation_score: avg(partial_auto, high_auto)
  const automationScore    = parseFloat(((partialAuto + highAuto) / 2).toFixed(3));
  // observed_usage_share: penetration value directly
  const observedUsageShare = parseFloat(c.penetration.toFixed(4));

  const row = {
    occupation_id:        c.occId,
    onet_task_id:         c.taskId,
    task_cluster_id:      c.clusterId,
    source_id:            'src_aei_labor_market_2026_03',
    exposure_score:       exposureScore,
    augmentation_score:   augmentationScore,
    automation_score:     automationScore,
    observed_usage_share: observedUsageShare,
    evidence_type:        'aei_task_penetration',
    confidence:           0.45,
    notes:                `aei_labor_market_2026_03|penetration_score=${c.penetration.toFixed(4)}|economy_wide_signal`
  };

  draftedRows.push(row);
  console.log(rowToCSV(row, evidenceHeaders));
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n── Summary ──`);
console.log(`Tasks identified: ${candidates.length}`);
console.log(`Drafted evidence rows: ${draftedRows.length}`);

// Cluster breakdown
const clusterCount = {};
for (const c of enriched) {
  clusterCount[c.clusterId] = (clusterCount[c.clusterId] || 0) + 1;
}
console.log('\nBreakdown by cluster:');
for (const [k, v] of Object.entries(clusterCount).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}

// Penetration range
const pens = enriched.map(c => c.penetration);
console.log(`\nPenetration range: ${Math.min(...pens).toFixed(4)} – ${Math.max(...pens).toFixed(4)}`);
console.log(`Penetration mean:  ${(pens.reduce((a,b)=>a+b,0)/pens.length).toFixed(4)}`);
