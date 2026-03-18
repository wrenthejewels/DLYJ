// extract_sep2025_aei_evidence.js
// Extracts Sep 2025 AEI task usage evidence for our 34 modeled occupations
// and appends to task_exposure_evidence.csv and task_source_evidence.csv

const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/clayw/Test 8-22';

// ── File paths ──────────────────────────────────────────────────────────────
const AEI_RAW    = path.join(BASE, 'data/raw/anthropic_economic_index/release_2025_09_15/data/intermediate/aei_raw_claude_ai_2025-08-04_to_2025-08-11.csv');
const ONET_STMTS = path.join(BASE, 'data/raw/anthropic_economic_index/onet_task_statements.csv');
const OCC_TASKS  = path.join(BASE, 'data/normalized/occupation_tasks.csv');
const TCM        = path.join(BASE, 'data/normalized/task_cluster_membership.csv');
const PRIORS     = path.join(BASE, 'data/normalized/task_augmentation_automation_priors.csv');
const EXPOSURE   = path.join(BASE, 'data/normalized/task_exposure_evidence.csv');
const SOURCE_EV  = path.join(BASE, 'data/normalized/task_source_evidence.csv');

// ── CSV parser (handles quoted fields with commas) ───────────────────────────
function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function toCSVField(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function rowToCSV(headers, obj) {
  return headers.map(h => toCSVField(obj[h] ?? '')).join(',');
}

// ── Load all files ───────────────────────────────────────────────────────────
console.log('Loading files...');

const aeiRaw    = parseCSV(fs.readFileSync(AEI_RAW, 'utf8'));
const onetStmts = parseCSV(fs.readFileSync(ONET_STMTS, 'utf8'));
const occTasks  = parseCSV(fs.readFileSync(OCC_TASKS, 'utf8'));
const tcm       = parseCSV(fs.readFileSync(TCM, 'utf8'));
const priors    = parseCSV(fs.readFileSync(PRIORS, 'utf8'));
const exposure  = parseCSV(fs.readFileSync(EXPOSURE, 'utf8'));
const sourceEv  = parseCSV(fs.readFileSync(SOURCE_EV, 'utf8'));

console.log(`  AEI raw rows:         ${aeiRaw.length}`);
console.log(`  O*NET statements:     ${onetStmts.length}`);
console.log(`  Occupation tasks:     ${occTasks.length}`);
console.log(`  Cluster membership:   ${tcm.length}`);
console.log(`  Priors:               ${priors.length}`);
console.log(`  Existing exposure ev: ${exposure.length}`);
console.log(`  Existing source ev:   ${sourceEv.length}`);

// ── Step 1a: Extract GLOBAL onet_task_count rows ─────────────────────────────
const globalTaskCounts = aeiRaw.filter(r =>
  r.geo_id === 'GLOBAL' &&
  r.facet === 'onet_task' &&
  r.variable === 'onet_task_count'
);
console.log(`\nGLOBAL onet_task_count rows: ${globalTaskCounts.length}`);

// Compute total global count (sum of all task counts)
const totalGlobalCount = globalTaskCounts.reduce((sum, r) => sum + parseFloat(r.value || 0), 0);
console.log(`Total global task count sum: ${totalGlobalCount.toFixed(0)}`);

// ── Step 1b: Build lookup: lowercase task description → numeric task ID ──────
// onet_task_statements columns: O*NET-SOC Code, Title, Task ID, Task, Task Type, ...
const stmtLookup = new Map(); // lowercase task text → set of numeric task IDs
for (const row of onetStmts) {
  const taskText = (row['Task'] || '').trim();
  const taskId   = (row['Task ID'] || '').trim();
  if (!taskText || !taskId) continue;
  const key = taskText.toLowerCase();
  if (!stmtLookup.has(key)) stmtLookup.set(key, new Set());
  stmtLookup.get(key).add(taskId);
}
console.log(`O*NET statement lookup entries: ${stmtLookup.size}`);

// ── Step 1c: Build inventory set: numeric task IDs in occupation_tasks.csv ───
// occupation_tasks columns: occupation_id, onet_task_id, task_statement, task_type, ...
const inventoryTaskIds = new Set(occTasks.map(r => r.onet_task_id));
console.log(`Inventory task IDs: ${inventoryTaskIds.size}`);

// ── Step 1d: Build already-covered set ───────────────────────────────────────
// task_exposure_evidence columns: occupation_id, onet_task_id, ...
const existingKeys = new Set(
  exposure.map(r => `${r.occupation_id}|${r.onet_task_id}`)
);
console.log(`Existing exposure evidence keys: ${existingKeys.size}`);

// ── Step 1e: Match AEI tasks → inventory tasks not yet covered ───────────────
// Build: taskId → AEI row (cluster_name = task description in this file)
const aeiByTaskId = new Map(); // numeric task ID → AEI count row

for (const row of globalTaskCounts) {
  // cluster_name holds the task description text in this dataset
  const taskDesc = (row.cluster_name || '').trim();
  const key = taskDesc.toLowerCase();
  const matchedIds = stmtLookup.get(key);
  if (!matchedIds) continue;
  for (const taskId of matchedIds) {
    if (!aeiByTaskId.has(taskId)) {
      aeiByTaskId.set(taskId, row);
    }
  }
}

console.log(`\nAEI tasks matched to O*NET IDs: ${aeiByTaskId.size}`);

// Filter to inventory tasks
const aeiInInventory = [];
for (const [taskId, aeiRow] of aeiByTaskId) {
  if (inventoryTaskIds.has(taskId)) {
    aeiInInventory.push({ taskId, aeiRow });
  }
}
console.log(`AEI tasks in our inventory: ${aeiInInventory.length}`);

// ── Step 1f: Find occupation_tasks rows for these task IDs ───────────────────
// occupation_tasks is keyed by (occupation_id, onet_task_id)
// Build lookup: taskId → array of occTask rows
const occTaskByTaskId = new Map();
for (const row of occTasks) {
  const tid = row.onet_task_id;
  if (!occTaskByTaskId.has(tid)) occTaskByTaskId.set(tid, []);
  occTaskByTaskId.get(tid).push(row);
}

// Expand to (occupation_id, onet_task_id) pairs not already covered
const newPairs = [];
for (const { taskId, aeiRow } of aeiInInventory) {
  const occRows = occTaskByTaskId.get(taskId) || [];
  for (const occRow of occRows) {
    const k = `${occRow.occupation_id}|${taskId}`;
    if (!existingKeys.has(k)) {
      newPairs.push({ occRow, taskId, aeiRow });
    }
  }
}
console.log(`New (occ, task) pairs to add: ${newPairs.length}`);

// ── Step 2: Compute evidence scores ─────────────────────────────────────────

// Build cluster membership: (occupation_id, onet_task_id) → task_cluster_id
const clusterByOccTask = new Map();
for (const row of tcm) {
  const k = `${row.occupation_id}|${row.onet_task_id}`;
  if (!clusterByOccTask.has(k)) {
    clusterByOccTask.set(k, row.task_cluster_id);
  }
}

// Also check occupation_tasks for task_cluster_id (some files have it inline)
// occupation_tasks columns from our earlier preview don't show cluster_id, so we rely on TCM

// Build priors lookup: (occupation_id, task_cluster_id) → prior row
const priorsLookup = new Map();
for (const row of priors) {
  const k = `${row.occupation_id}|${row.task_cluster_id}`;
  priorsLookup.set(k, row);
}

// Build cluster average augmentation from existing exposure evidence
// group by (occupation_id, task_cluster_id)
const clusterAugMap = new Map(); // key → { sum, count }
for (const row of exposure) {
  const clusterId = row.task_cluster_id;
  const occId = row.occupation_id;
  const aug = parseFloat(row.augmentation_score);
  if (!clusterId || isNaN(aug)) continue;
  const k = `${occId}|${clusterId}`;
  if (!clusterAugMap.has(k)) clusterAugMap.set(k, { sum: 0, count: 0 });
  clusterAugMap.get(k).sum += aug;
  clusterAugMap.get(k).count += 1;
}

// Get exposure evidence headers for appending
const exposureHeaders = Object.keys(exposure[0]);
const sourceEvHeaders = Object.keys(sourceEv[0]);

const newExposureRows = [];
const newSourceEvRows = [];

let skippedNoCluster = 0;
let skippedNoPriors = 0;

for (const { occRow, taskId, aeiRow } of newPairs) {
  const occupationId = occRow.occupation_id;
  const occTaskKey = `${occupationId}|${taskId}`;

  // Get cluster ID
  let clusterId = clusterByOccTask.get(occTaskKey);
  if (!clusterId) {
    // Try from occupation_tasks row if it has a task_cluster_id column
    clusterId = occRow.task_cluster_id || null;
  }
  if (!clusterId) {
    skippedNoCluster++;
    console.warn(`  WARN: no cluster for ${occTaskKey}`);
    continue;
  }

  // Get priors
  const priorKey = `${occupationId}|${clusterId}`;
  const prior = priorsLookup.get(priorKey);
  if (!prior) {
    skippedNoPriors++;
    console.warn(`  WARN: no priors for ${priorKey}`);
    continue;
  }

  const partialAuto = parseFloat(prior.partial_automation_likelihood) || 0;
  const highAuto    = parseFloat(prior.high_automation_likelihood)    || 0;

  const automationScore  = (partialAuto + highAuto) / 2;
  const exposureScore    = partialAuto;

  // Cluster average augmentation from existing evidence
  const augKey = `${occupationId}|${clusterId}`;
  const augData = clusterAugMap.get(augKey);
  const augmentationScore = augData ? (augData.sum / augData.count) : 0.30; // fallback

  // Observed usage share
  const taskCount = parseFloat(aeiRow.value) || 0;
  const observedUsageShare = totalGlobalCount > 0 ? taskCount / totalGlobalCount : 0;

  // Build exposure evidence row
  const expRow = {};
  expRow.occupation_id       = occupationId;
  expRow.onet_task_id        = taskId;
  expRow.task_cluster_id     = clusterId;
  expRow.source_id           = 'src_anthropic_ei_sep_2025_window';
  expRow.exposure_score      = exposureScore.toFixed(4);
  expRow.augmentation_score  = augmentationScore.toFixed(4);
  expRow.automation_score    = automationScore.toFixed(4);
  expRow.observed_usage_share= observedUsageShare.toFixed(6);
  expRow.evidence_type       = 'aei_task_usage_sep_2025';
  expRow.confidence          = '0.52';
  expRow.notes               = `aei_sep_2025|task_count=${taskCount}|global_share=${observedUsageShare.toFixed(6)}|cluster=${clusterId}`;

  newExposureRows.push(expRow);

  // Build source evidence row
  const taskFullId = `task_occ_${occupationId.replace('occ_', '')}_${taskId}`;
  const srcRow = {};
  srcRow.occupation_id       = occupationId;
  srcRow.task_id             = taskFullId;
  srcRow.source_id           = 'src_anthropic_ei_sep_2025_window';
  srcRow.source_role         = 'benchmark_task_label';
  srcRow.exposure_score      = exposureScore.toFixed(4);
  srcRow.augmentation_score  = augmentationScore.toFixed(4);
  srcRow.automation_score    = automationScore.toFixed(4);
  srcRow.evidence_weight     = '0.55';
  srcRow.confidence          = '0.52';
  srcRow.promotion_status    = 'active_supporting';
  srcRow.notes               = `aei_sep_2025|task_count=${taskCount}|global_share=${observedUsageShare.toFixed(6)}`;

  newSourceEvRows.push(srcRow);
}

console.log(`\nRows to append to task_exposure_evidence.csv: ${newExposureRows.length}`);
console.log(`Rows to append to task_source_evidence.csv:   ${newSourceEvRows.length}`);
if (skippedNoCluster > 0) console.log(`Skipped (no cluster):  ${skippedNoCluster}`);
if (skippedNoPriors  > 0) console.log(`Skipped (no priors):   ${skippedNoPriors}`);

// ── Step 3: Append to files ───────────────────────────────────────────────────
if (newExposureRows.length === 0) {
  console.log('\nNothing new to append — all Sep 2025 tasks already covered.');
  process.exit(0);
}

// Append to task_exposure_evidence.csv
const exposureAppend = newExposureRows.map(r => rowToCSV(exposureHeaders, r)).join('\n') + '\n';
fs.appendFileSync(EXPOSURE, exposureAppend, 'utf8');

// Append to task_source_evidence.csv
const sourceAppend = newSourceEvRows.map(r => rowToCSV(sourceEvHeaders, r)).join('\n') + '\n';
fs.appendFileSync(SOURCE_EV, sourceAppend, 'utf8');

// Verify line counts
const newExpCount = fs.readFileSync(EXPOSURE, 'utf8').split('\n').filter(l => l.trim()).length;
const newSrcCount = fs.readFileSync(SOURCE_EV, 'utf8').split('\n').filter(l => l.trim()).length;

console.log('\n── Summary ───────────────────────────────────────────────────────');
console.log(`task_exposure_evidence.csv: was ${exposure.length} data rows → now ${newExpCount - 1} data rows (+${newExposureRows.length} added)`);
console.log(`task_source_evidence.csv:   was ${sourceEv.length} data rows → now ${newSrcCount - 1} data rows (+${newSourceEvRows.length} added)`);

// Print occupation breakdown
const byOcc = {};
for (const r of newExposureRows) {
  byOcc[r.occupation_id] = (byOcc[r.occupation_id] || 0) + 1;
}
console.log('\nNew rows by occupation:');
for (const [occ, cnt] of Object.entries(byOcc).sort()) {
  console.log(`  ${occ}: ${cnt}`);
}

// Print sample rows
console.log('\nSample new exposure rows (first 3):');
for (const r of newExposureRows.slice(0, 3)) {
  console.log(`  occ=${r.occupation_id} task=${r.onet_task_id} cluster=${r.task_cluster_id} exposure=${r.exposure_score} aug=${r.augmentation_score} auto=${r.automation_score} share=${r.observed_usage_share}`);
}
