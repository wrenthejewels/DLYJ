const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/clayw/Test 8-22';

function readCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''); // strip BOM
  const lines = raw.split('\n').filter(l => l.trim());
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
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ============================================================
// STEP 1: job_exposure.csv vs our 34 occupations
// ============================================================
console.log('\n=== STEP 1: job_exposure.csv coverage of our 34 occupations ===\n');

const occupations = readCSV(path.join(BASE, 'data/normalized/occupations.csv'));
const jobExposure = readCSV(path.join(BASE, 'data/raw/anthropic_economic_index/labor_market_impacts/job_exposure.csv'));
const adoptionCtx = readCSV(path.join(BASE, 'data/normalized/occupation_demand_adoption_context.csv'));

// Build lookup: 6-digit SOC -> job_exposure row
const jobExpMap = {};
jobExposure.forEach(row => { jobExpMap[row.occ_code] = row; });

// Build lookup: occupation_id -> adoption context
const adoptionMap = {};
adoptionCtx.forEach(row => { adoptionMap[row.occupation_id] = row; });

console.log(`Our occupations: ${occupations.length}`);
console.log(`job_exposure.csv rows: ${jobExposure.length}`);

const step1Results = [];
let matched = 0;
let meaningfullyDifferent = 0;

occupations.forEach(occ => {
  // Convert "11-1021.00" -> "11-1021"
  const soc6 = occ.onet_soc_code ? occ.onet_soc_code.replace(/\.00$/, '') : '';
  const expRow = jobExpMap[soc6];
  const adCtx = adoptionMap[occ.occupation_id];

  const observedExposure = expRow ? parseFloat(expRow.observed_exposure) : null;
  const aiAdoptionCtx = adCtx ? parseFloat(adCtx.ai_adoption_context) : null;
  const adoptionRealization = adCtx ? parseFloat(adCtx.adoption_realization_context) : null;

  const found = expRow != null;
  if (found) matched++;

  let diff_vs_adoption = null;
  let diff_vs_realization = null;
  if (found && aiAdoptionCtx !== null) {
    diff_vs_adoption = Math.abs(observedExposure - aiAdoptionCtx);
  }
  if (found && adoptionRealization !== null) {
    diff_vs_realization = Math.abs(observedExposure - adoptionRealization);
  }

  // "meaningfully different" = >0.05 from ai_adoption_context
  if (found && diff_vs_adoption !== null && diff_vs_adoption > 0.05) meaningfullyDifferent++;

  step1Results.push({
    occupation_id: occ.occupation_id,
    title: occ.title,
    soc6,
    found,
    observed_exposure: observedExposure,
    ai_adoption_context: aiAdoptionCtx,
    adoption_realization_context: adoptionRealization,
    diff_vs_adoption: diff_vs_adoption !== null ? diff_vs_adoption.toFixed(4) : 'N/A',
    diff_vs_realization: diff_vs_realization !== null ? diff_vs_realization.toFixed(4) : 'N/A',
  });
});

console.log(`Matched in job_exposure.csv: ${matched} / ${occupations.length}`);
console.log(`NOT matched: ${occupations.length - matched}`);
console.log(`\nMeaningfully different from ai_adoption_context (>0.05): ${meaningfullyDifferent}`);

console.log('\nFull occupation match table:');
console.log('occupation_id | SOC6 | found | observed_exp | ai_adoption_ctx | diff_vs_adoption | diff_vs_realization');
step1Results.forEach(r => {
  const exp = r.observed_exposure !== null ? r.observed_exposure.toFixed(4) : 'N/A';
  const adopt = r.ai_adoption_context !== null ? r.ai_adoption_context.toFixed(4) : 'N/A';
  const flag = r.diff_vs_adoption !== 'N/A' && parseFloat(r.diff_vs_adoption) > 0.05 ? ' ***' : '';
  console.log(`${r.occupation_id.padEnd(25)} | ${r.soc6.padEnd(7)} | ${String(r.found).padEnd(5)} | ${exp.padEnd(12)} | ${adopt.padEnd(15)} | ${r.diff_vs_adoption.padEnd(16)} | ${r.diff_vs_realization}${flag}`);
});

console.log('\nNot matched:');
step1Results.filter(r => !r.found).forEach(r => console.log(`  ${r.occupation_id} (${r.soc6})`));

// ============================================================
// STEP 2: task_penetration.csv vs our task inventory
// ============================================================
console.log('\n=== STEP 2: task_penetration.csv coverage analysis ===\n');

const taskPenetration = readCSV(path.join(BASE, 'data/raw/anthropic_economic_index/labor_market_impacts/task_penetration.csv'));
const occTasks = readCSV(path.join(BASE, 'data/normalized/occupation_tasks.csv'));
const taskExposureEvidence = readCSV(path.join(BASE, 'data/normalized/task_exposure_evidence.csv'));

console.log(`task_penetration.csv rows: ${taskPenetration.length}`);
console.log(`occupation_tasks.csv rows: ${occTasks.length}`);
console.log(`task_exposure_evidence.csv rows: ${taskExposureEvidence.length}`);

// Also check onet_task_statements.csv
let onetStatements = [];
const onetPath = path.join(BASE, 'data/raw/anthropic_economic_index/onet_task_statements.csv');
if (fs.existsSync(onetPath)) {
  onetStatements = readCSV(onetPath);
  console.log(`onet_task_statements.csv rows: ${onetStatements.length}`);
} else {
  console.log('onet_task_statements.csv: NOT FOUND');
}

// Build penetration lookup: exact task text -> penetration
const penetrationExactMap = {};
const penetrationLowerMap = {};
taskPenetration.forEach(row => {
  const t = row.task || '';
  penetrationExactMap[t] = parseFloat(row.penetration);
  penetrationLowerMap[t.toLowerCase()] = parseFloat(row.penetration);
});

// Our task statements from occupation_tasks.csv
const ourTasks = occTasks.map(r => ({
  task_id: r.onet_task_id,
  occupation_id: r.occupation_id,
  text: r.task_statement || ''
}));

// Unique task texts in our inventory
const uniqueTaskTexts = [...new Set(ourTasks.map(t => t.text))];
console.log(`\nUnique task texts in our inventory: ${uniqueTaskTexts.length}`);
console.log(`Unique task_ids in our inventory: ${[...new Set(ourTasks.map(t => t.task_id))].length}`);

// EXACT match
let exactMatches = 0;
let caseInsensitiveMatches = 0;
const matchedTaskTexts = new Set();
const matchedTaskTextsCaseInsensitive = new Set();

uniqueTaskTexts.forEach(text => {
  if (penetrationExactMap.hasOwnProperty(text)) {
    exactMatches++;
    matchedTaskTexts.add(text);
  }
  if (penetrationLowerMap.hasOwnProperty(text.toLowerCase())) {
    caseInsensitiveMatches++;
    matchedTaskTextsCaseInsensitive.add(text);
  }
});

console.log(`\nText match results (unique task texts):`);
console.log(`  Exact match: ${exactMatches}`);
console.log(`  Case-insensitive match: ${caseInsensitiveMatches}`);

// Now count at row level (occ x task rows)
let exactRowMatches = 0;
let ciRowMatches = 0;
ourTasks.forEach(t => {
  if (penetrationExactMap.hasOwnProperty(t.text)) exactRowMatches++;
  if (penetrationLowerMap.hasOwnProperty(t.text.toLowerCase())) ciRowMatches++;
});
console.log(`\nRow-level matches (occupation_tasks rows):`);
console.log(`  Exact: ${exactRowMatches} / ${ourTasks.length}`);
console.log(`  Case-insensitive: ${ciRowMatches} / ${ourTasks.length}`);

// Penetration score distribution for matched tasks (use case-insensitive)
const matchedPenetrations = [];
uniqueTaskTexts.forEach(text => {
  const key = text.toLowerCase();
  if (penetrationLowerMap.hasOwnProperty(key)) {
    matchedPenetrations.push(penetrationLowerMap[key]);
  }
});
matchedPenetrations.sort((a, b) => a - b);

function percentile(arr, p) {
  if (!arr.length) return null;
  const idx = (p / 100) * (arr.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
}

console.log(`\nPenetration score distribution for matched tasks (${matchedPenetrations.length} tasks):`);
console.log(`  Min: ${matchedPenetrations[0]}`);
console.log(`  P25: ${percentile(matchedPenetrations, 25).toFixed(6)}`);
console.log(`  P50: ${percentile(matchedPenetrations, 50).toFixed(6)}`);
console.log(`  P75: ${percentile(matchedPenetrations, 75).toFixed(6)}`);
console.log(`  Max: ${matchedPenetrations[matchedPenetrations.length - 1]}`);
console.log(`  Nonzero: ${matchedPenetrations.filter(x => x > 0).length}`);

// Compare penetration vs observed_usage_share in task_exposure_evidence.csv
// task_exposure_evidence has: occupation_id, onet_task_id, observed_usage_share
// Build map: task text -> [observed_usage_shares]
const evidenceByTaskId = {};
taskExposureEvidence.forEach(row => {
  const id = row.onet_task_id;
  if (!evidenceByTaskId[id]) evidenceByTaskId[id] = [];
  evidenceByTaskId[id].push(parseFloat(row.observed_usage_share));
});

// Build map: onet_task_id -> task text (from occupation_tasks)
const taskTextById = {};
occTasks.forEach(r => { taskTextById[r.onet_task_id] = r.task_statement; });

// For tasks that match in penetration, check if they have evidence
let matchedWithEvidence = 0;
let matchedWithoutEvidence = 0;
let highPenNoEvidence = []; // penetration > 0.01 and no evidence

uniqueTaskTexts.forEach(text => {
  const key = text.toLowerCase();
  if (!penetrationLowerMap.hasOwnProperty(key)) return;

  // Find task_id(s) for this text
  const taskIds = occTasks.filter(r => r.task_statement.toLowerCase() === key).map(r => r.onet_task_id);
  const uniqueIds = [...new Set(taskIds)];
  const hasEvidence = uniqueIds.some(id => evidenceByTaskId[id] && evidenceByTaskId[id].length > 0);

  if (hasEvidence) matchedWithEvidence++;
  else {
    matchedWithoutEvidence++;
    const pen = penetrationLowerMap[key];
    if (pen > 0.01) {
      highPenNoEvidence.push({ text: text.substring(0, 80), penetration: pen, task_ids: uniqueIds });
    }
  }
});

console.log(`\nOf tasks matched to penetration scores:`);
console.log(`  Have existing AEI evidence in task_exposure_evidence.csv: ${matchedWithEvidence}`);
console.log(`  No existing AEI evidence: ${matchedWithoutEvidence}`);
console.log(`  High penetration (>0.01) with no evidence: ${highPenNoEvidence.length}`);

if (highPenNoEvidence.length > 0) {
  console.log(`\nTop 20 high-penetration tasks with no existing evidence:`);
  highPenNoEvidence.sort((a, b) => b.penetration - a.penetration).slice(0, 20).forEach(t => {
    console.log(`  pen=${t.penetration.toFixed(4)} ids=${t.task_ids.join(',')} "${t.text}"`);
  });
}

// Compare penetration vs observed_usage_share for overlapping tasks
console.log('\n--- Comparing penetration vs observed_usage_share (overlapping tasks) ---');
const comparisonData = [];
uniqueTaskTexts.forEach(text => {
  const key = text.toLowerCase();
  if (!penetrationLowerMap.hasOwnProperty(key)) return;
  const pen = penetrationLowerMap[key];
  const taskIds = [...new Set(occTasks.filter(r => r.task_statement.toLowerCase() === key).map(r => r.onet_task_id))];
  taskIds.forEach(id => {
    if (evidenceByTaskId[id]) {
      evidenceByTaskId[id].forEach(ous => {
        comparisonData.push({ pen, ous });
      });
    }
  });
});

if (comparisonData.length > 0) {
  console.log(`Tasks with both penetration and observed_usage_share: ${comparisonData.length} pairs`);
  // Simple correlation check
  const n = comparisonData.length;
  const meanPen = comparisonData.reduce((s, d) => s + d.pen, 0) / n;
  const meanOus = comparisonData.reduce((s, d) => s + d.ous, 0) / n;
  const cov = comparisonData.reduce((s, d) => s + (d.pen - meanPen) * (d.ous - meanOus), 0) / n;
  const stdPen = Math.sqrt(comparisonData.reduce((s, d) => s + (d.pen - meanPen)**2, 0) / n);
  const stdOus = Math.sqrt(comparisonData.reduce((s, d) => s + (d.ous - meanOus)**2, 0) / n);
  const corr = (stdPen > 0 && stdOus > 0) ? cov / (stdPen * stdOus) : 0;
  console.log(`Pearson correlation (penetration vs observed_usage_share): ${corr.toFixed(4)}`);

  // Distribution of both
  const pens = comparisonData.map(d => d.pen).sort((a,b)=>a-b);
  const ouss = comparisonData.map(d => d.ous).sort((a,b)=>a-b);
  console.log(`Penetration: mean=${meanPen.toFixed(4)} min=${pens[0].toFixed(4)} max=${pens[pens.length-1].toFixed(4)}`);
  console.log(`Obs usage share: mean=${meanOus.toFixed(4)} min=${ouss[0].toFixed(4)} max=${ouss[ouss.length-1].toFixed(4)}`);
} else {
  console.log('No overlapping tasks found between penetration and observed_usage_share.');
}

// ============================================================
// STEP 3: Integration value summary
// ============================================================
console.log('\n=== STEP 3: Integration value summary ===\n');

// Q1: Meaningful diff from ai_adoption_context
console.log(`Q1: Occupations with observed_exposure differing >0.05 from ai_adoption_context: ${meaningfullyDifferent} / ${matched} matched`);

// Also check against adoption_realization_context
let meaningfullyDiffRealization = 0;
step1Results.forEach(r => {
  if (r.diff_vs_realization !== 'N/A' && parseFloat(r.diff_vs_realization) > 0.05) meaningfullyDiffRealization++;
});
console.log(`   vs adoption_realization_context >0.05: ${meaningfullyDiffRealization} / ${matched} matched`);

// Q2: Task rows that could get penetration score they don't have
// "don't currently have" = task has no row in task_exposure_evidence OR has row but no penetration field
// We'll interpret as: our occupation_tasks rows that match in penetration but have no existing evidence
let taskRowsGainPenetration = 0;
ourTasks.forEach(t => {
  const key = t.text.toLowerCase();
  if (!penetrationLowerMap.hasOwnProperty(key)) return;
  const hasEvidence = evidenceByTaskId[t.task_id] && evidenceByTaskId[t.task_id].length > 0;
  if (!hasEvidence) taskRowsGainPenetration++;
});
console.log(`\nQ2: occupation_tasks rows that match penetration & have no current evidence: ${taskRowsGainPenetration}`);

// Total occupation_tasks rows that match penetration (regardless of evidence)
let totalRowsMatchPenetration = 0;
ourTasks.forEach(t => {
  if (penetrationLowerMap.hasOwnProperty(t.text.toLowerCase())) totalRowsMatchPenetration++;
});
console.log(`   Total occupation_tasks rows matching penetration: ${totalRowsMatchPenetration}`);

// Q3: Is penetration a different signal?
console.log(`\nQ3: Signal comparison`);
console.log(`   observed_usage_share = fraction of AEI task usage attributed to this specific task (work-share)`);
console.log(`   penetration = fraction of AI interactions involving this task type across the economy`);
console.log(`   These are different: usage_share is occupation-specific relative weight;`);
console.log(`   penetration is an absolute economy-wide prevalence signal.`);
if (comparisonData.length > 0) {
  const n = comparisonData.length;
  const meanPen = comparisonData.reduce((s, d) => s + d.pen, 0) / n;
  const meanOus = comparisonData.reduce((s, d) => s + d.ous, 0) / n;
  const cov = comparisonData.reduce((s, d) => s + (d.pen - meanPen) * (d.ous - meanOus), 0) / n;
  const stdPen = Math.sqrt(comparisonData.reduce((s, d) => s + (d.pen - meanPen)**2, 0) / n);
  const stdOus = Math.sqrt(comparisonData.reduce((s, d) => s + (d.ous - meanOus)**2, 0) / n);
  const corr = (stdPen > 0 && stdOus > 0) ? cov / (stdPen * stdOus) : 0;
  console.log(`   Correlation between the two: ${corr.toFixed(4)} — ${Math.abs(corr) < 0.3 ? 'LOW (complementary signals)' : Math.abs(corr) < 0.6 ? 'MODERATE' : 'HIGH (redundant)'}`);
}

// Distribution of all penetration values for context
const allPen = taskPenetration.map(r => parseFloat(r.penetration)).filter(x => !isNaN(x));
allPen.sort((a,b)=>a-b);
const nonzeroPen = allPen.filter(x => x > 0);
console.log(`\n--- Full task_penetration.csv stats ---`);
console.log(`Total rows: ${allPen.length}`);
console.log(`Zero penetration: ${allPen.filter(x => x === 0).length}`);
console.log(`Nonzero: ${nonzeroPen.length}`);
console.log(`P50 nonzero: ${percentile(nonzeroPen, 50).toFixed(6)}`);
console.log(`P90 nonzero: ${percentile(nonzeroPen, 90).toFixed(6)}`);
console.log(`Max: ${allPen[allPen.length-1]}`);
