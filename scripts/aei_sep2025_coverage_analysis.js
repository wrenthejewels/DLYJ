// AEI Sep 2025 coverage analysis
// Step 1: Extract GLOBAL onet_task rows from Sep 2025 AEI file
// Step 2: Match against onet_task_statements.csv, check coverage in task_exposure_evidence.csv
// Step 3: Report top-20 new-coverage tasks by count

const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/clayw/Test 8-22';

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, ''); // strip BOM
  const lines = raw.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function percentile(sorted, p) {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── Step 1: Load AEI Sep 2025 ─────────────────────────────────────────────

console.log('=== STEP 1: GLOBAL onet_task entries from Sep 2025 AEI ===\n');

const aeiPath = path.join(BASE,
  'data/raw/anthropic_economic_index/release_2025_09_15/data/intermediate',
  'aei_raw_claude_ai_2025-08-04_to_2025-08-11.csv');

const aei = parseCSV(aeiPath);
console.log(`Total rows in AEI file: ${aei.length}`);

// Filter: geo_id == GLOBAL, facet == onet_task, variable == onet_task_count
const filtered = aei.filter(r =>
  r.geo_id === 'GLOBAL' &&
  r.facet === 'onet_task' &&
  r.variable === 'onet_task_count'
);
console.log(`Rows after filter (GLOBAL / onet_task / onet_task_count): ${filtered.length}`);

// Unique task descriptions (cluster_name) and their count values
// If a task appears more than once, sum counts
const taskMap = new Map(); // description (lowercase) → { description, count }
for (const r of filtered) {
  const desc = r.cluster_name.trim();
  const val = parseFloat(r.value) || 0;
  const key = desc.toLowerCase();
  if (!taskMap.has(key)) {
    taskMap.set(key, { description: desc, count: val });
  } else {
    taskMap.get(key).count += val;
  }
}

const uniqueTasks = Array.from(taskMap.values());
console.log(`\nUnique GLOBAL onet_task descriptions: ${uniqueTasks.length}`);

// Distribution of onet_task_count values
const counts = uniqueTasks.map(t => t.count).sort((a, b) => a - b);
console.log('\nDistribution of onet_task_count (per unique task):');
console.log(`  min : ${counts[0]}`);
console.log(`  p25 : ${percentile(counts, 25).toFixed(2)}`);
console.log(`  p50 : ${percentile(counts, 50).toFixed(2)}`);
console.log(`  p75 : ${percentile(counts, 75).toFixed(2)}`);
console.log(`  max : ${counts[counts.length - 1]}`);
console.log(`  total count sum: ${counts.reduce((a, b) => a + b, 0).toFixed(0)}`);

// ── Step 2: Match against onet_task_statements.csv ───────────────────────

console.log('\n=== STEP 2: MATCH AGAINST EXISTING COVERAGE ===\n');

const statementsPath = path.join(BASE,
  'data/raw/anthropic_economic_index/onet_task_statements.csv');
const statements = parseCSV(statementsPath);
console.log(`Rows in onet_task_statements.csv: ${statements.length}`);

// Detect column names
const sampleS = statements[0];
console.log('onet_task_statements columns:', Object.keys(sampleS).join(', '));

// Build lookup: lowercase task text → { task_id, task_text }
// Columns: 'Task ID' and 'Task' (from header preview)
const stmtLookup = new Map();
for (const s of statements) {
  const taskId = (s['Task ID'] || s['task_id'] || s['onet_task_id'] || '').trim();
  const taskText = (s['Task'] || s['task'] || s['task_description'] || s['task_text'] || '').trim();
  if (!taskText) continue;
  stmtLookup.set(taskText.toLowerCase(), { task_id: taskId, task_text: taskText });
}
console.log(`Unique task texts in onet_task_statements: ${stmtLookup.size}`);

// Load task_exposure_evidence.csv
const evidencePath = path.join(BASE,
  'data/normalized/task_exposure_evidence.csv');
const evidence = parseCSV(evidencePath);
console.log(`\nRows in task_exposure_evidence.csv: ${evidence.length}`);

// Build set of task IDs with existing evidence
const sampleE = evidence[0];
console.log('task_exposure_evidence columns:', Object.keys(sampleE).join(', '));

const coveredTaskIds = new Set(
  evidence.map(r => (r['onet_task_id'] || '').trim()).filter(Boolean)
);
console.log(`Unique onet_task_ids in task_exposure_evidence: ${coveredTaskIds.size}`);

// Match Sep 2025 tasks to O*NET task IDs
let matchedCount = 0;
let newCoverageCount = 0;
const newCoverageTasks = [];

for (const t of uniqueTasks) {
  const key = t.description.toLowerCase();
  const match = stmtLookup.get(key);
  if (match) {
    matchedCount++;
    t.task_id = match.task_id;
    if (!coveredTaskIds.has(match.task_id)) {
      newCoverageCount++;
      newCoverageTasks.push({ ...t, task_id: match.task_id });
    }
  } else {
    t.task_id = null;
  }
}

console.log(`\nSep 2025 tasks matched to O*NET task IDs (exact, case-insensitive): ${matchedCount} / ${uniqueTasks.length}`);
console.log(`Of matched tasks, NOT in task_exposure_evidence (new coverage): ${newCoverageCount}`);
console.log(`Of matched tasks, already in task_exposure_evidence: ${matchedCount - newCoverageCount}`);

// Also report unmatched
const unmatchedCount = uniqueTasks.length - matchedCount;
console.log(`Sep 2025 tasks with no O*NET match: ${unmatchedCount}`);

// ── Step 3: Top-20 new-coverage tasks ────────────────────────────────────

console.log('\n=== STEP 3: TOP 20 NEW-COVERAGE TASKS (sorted by count desc) ===\n');

newCoverageTasks.sort((a, b) => b.count - a.count);

const top20 = newCoverageTasks.slice(0, 20);
const colW = 75;
console.log('Rank  Task ID    Count    Description');
console.log('─'.repeat(100));
top20.forEach((t, i) => {
  const desc = t.description.length > colW
    ? t.description.slice(0, colW - 1) + '…'
    : t.description;
  console.log(
    `${String(i + 1).padStart(4)}  ${String(t.task_id).padEnd(10)} ${String(Math.round(t.count)).padStart(8)}    ${desc}`
  );
});

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Total unique GLOBAL onet_task descriptions in Sep 2025:  ${uniqueTasks.length}`);
console.log(`Matched to O*NET task IDs:                                ${matchedCount}`);
console.log(`Already covered in task_exposure_evidence:                ${matchedCount - newCoverageCount}`);
console.log(`NEW coverage (in Sep 2025 but no existing evidence):      ${newCoverageCount}`);
console.log(`Unmatched to any O*NET ID:                                ${unmatchedCount}`);
