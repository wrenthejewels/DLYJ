const fs = require('fs');
const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

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

  const header = rows[0];
  return rows.slice(1).filter((entry) => entry.some((value) => String(value || '').trim().length)).map((entry) => {
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

function splitPipe(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function includeAccepted(raw, actual) {
  const values = splitPipe(raw);
  if (!actual || values.includes(actual)) {
    return raw || '';
  }
  values.push(actual);
  return values.join('|');
}

function updateRange(row, minKey, maxKey, actual, halfWidth) {
  const value = toNumber(actual, null);
  if (value === null) {
    return;
  }
  row[minKey] = Math.max(0, value - halfWidth).toFixed(3);
  row[maxKey] = Math.min(1, value + halfWidth).toFixed(3);
}

function checkAccepted(actual, acceptedRaw) {
  const accepted = splitPipe(acceptedRaw);
  if (!accepted.length) {
    return null;
  }
  return {
    pass: accepted.includes(actual),
    expected: accepted.join(' | '),
    actual
  };
}

function checkRange(actual, minRaw, maxRaw) {
  const min = toNumber(minRaw, null);
  const max = toNumber(maxRaw, null);
  if (min === null && max === null) {
    return null;
  }
  return {
    pass: (min === null || actual >= min) && (max === null || actual <= max),
    expected: `${min === null ? '-inf' : min} to ${max === null ? '+inf' : max}`,
    actual: Number(actual.toFixed(3))
  };
}

function renderMetricCell(result) {
  if (!result) {
    return 'n/a';
  }
  return result.pass ? 'pass' : `fail (${result.actual} vs ${result.expected})`;
}

function compatibility(result) {
  return result && result.compatibility_exports ? result.compatibility_exports : {};
}

function roleOutlook(result) {
  return compatibility(result).role_outlook || result?.state_trajectory?.current_state || null;
}

function primarySeatBreakScenario(result) {
  return result?.timing_frontier?.primary_displacement_wave || compatibility(result).primary_displacement_wave || null;
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const calibrationPath = path.join(repoRoot, 'data', 'metadata', 'v2_reviewed_calibration_set.csv');
  const reportPath = path.join(repoRoot, 'docs', 'data', 'v2_calibration_report.md');
  const strict = process.argv.includes('--strict');
  const updateTargets = process.argv.includes('--update-targets');

  const calibrationText = fs.readFileSync(calibrationPath, 'utf8');
  const header = calibrationText.split(/\r?\n/, 1)[0].split(',');
  const rows = parseCsv(calibrationText);
  const engine = await DLYJV2.create({ basePath: repoRoot });
  const evaluations = [];

  for (const row of rows) {
    const answers = {};
    var activeQs = [1,2,3,4,5,6,7,8,9,11,12,13,14,16];
    activeQs.forEach(function(index) {
      answers[`Q${index}`] = toNumber(row[`Q${index}`], 3);
    });

    const input = {
      roleCategory: row.role_category,
      occupationId: row.occupation_id,
      seniorityLevel: toNumber(row.seniority_level, 3),
      dominantTaskClusters: splitPipe(row.dominant_task_clusters),
      roleCriticalClusters: splitPipe(row.role_critical_clusters),
      answers
    };

    const result = engine.computeResult(input);

    if (updateTargets) {
      row.accepted_role_outlook = includeAccepted(row.accepted_role_outlook, roleOutlook(result));
      row.accepted_top_exposed_clusters = includeAccepted(
        row.accepted_top_exposed_clusters,
        result.top_exposed_work ? result.top_exposed_work.task_cluster_id : null
      );
      updateRange(row, 'min_exposed_task_share', 'max_exposed_task_share', result.exposed_task_share, 0.035);
      updateRange(row, 'min_workflow_compression', 'max_workflow_compression', result.recomposition_summary.workflow_compression, 0.04);
      updateRange(row, 'min_substitution_gap', 'max_substitution_gap', result.recomposition_summary.substitution_gap, 0.035);
    }

    const checks = {
      role_outlook: checkAccepted(roleOutlook(result), row.accepted_role_outlook),
      primary_displacement_wave: checkAccepted(primarySeatBreakScenario(result), row.accepted_primary_displacement_wave),
      residual_role_strength: checkAccepted(result.residual_role_strength, row.accepted_residual_role_strength),
      personalization_fit: checkAccepted(result.personalization_fit, row.accepted_personalization_fit),
      top_exposed_cluster: checkAccepted(result.top_exposed_work ? result.top_exposed_work.task_cluster_id : null, row.accepted_top_exposed_clusters),
      exposed_task_share: checkRange(result.exposed_task_share, row.min_exposed_task_share, row.max_exposed_task_share),
      workflow_compression: checkRange(result.recomposition_summary.workflow_compression, row.min_workflow_compression, row.max_workflow_compression),
      substitution_gap: checkRange(result.recomposition_summary.substitution_gap, row.min_substitution_gap, row.max_substitution_gap)
    };

    const applicableChecks = Object.values(checks).filter(Boolean);
    const passedChecks = applicableChecks.filter((entry) => entry.pass).length;
    const score = applicableChecks.length ? passedChecks / applicableChecks.length : 1;

    evaluations.push({
      caseId: row.case_id,
      occupation: result.selected_occupation_title,
      roleOutlook: roleOutlook(result),
      primaryDisplacementWave: primarySeatBreakScenario(result),
      residualRoleStrength: result.residual_role_strength,
      topExposedCluster: result.top_exposed_work ? result.top_exposed_work.task_cluster_id : null,
      exposedTaskShare: result.exposed_task_share,
      workflowCompression: result.recomposition_summary.workflow_compression,
      substitutionGap: result.recomposition_summary.substitution_gap,
      score,
      checks,
      notes: row.notes || ''
    });
  }

  const averageScore = evaluations.reduce((sum, entry) => sum + entry.score, 0) / Math.max(evaluations.length, 1);
  const failedCases = evaluations.filter((entry) => entry.score < 1);
  const metricSummary = ['compatibility_role_outlook', 'seat_break_scenario', 'residual_role_strength', 'personalization_fit', 'top_exposed_cluster', 'exposed_task_share', 'workflow_compression', 'substitution_gap']
    .map((metric) => {
      const checkKey = metric === 'compatibility_role_outlook'
        ? 'role_outlook'
        : (metric === 'seat_break_scenario' ? 'primary_displacement_wave' : metric);
      const applicable = evaluations.filter((entry) => entry.checks[checkKey]);
      const passed = applicable.filter((entry) => entry.checks[checkKey].pass).length;
      return { metric, passed, applicable: applicable.length };
    });

  const lines = [];
  lines.push('# V2 Calibration Report');
  lines.push('');
  lines.push('This report compares the live `v2_engine.js` output against the reviewed calibration set in `data/metadata/v2_reviewed_calibration_set.csv`.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- calibration cases: \`${evaluations.length}\``);
  lines.push(`- average score: \`${averageScore.toFixed(3)}\``);
  lines.push(`- perfect-match cases: \`${evaluations.filter((entry) => entry.score === 1).length}\``);
  lines.push(`- partial-mismatch cases: \`${failedCases.length}\``);
  lines.push('');
  lines.push('## Metric pass rates');
  lines.push('');
  metricSummary.forEach((entry) => {
    lines.push(`- \`${entry.metric}\`: \`${entry.passed}\` / \`${entry.applicable}\``);
  });
  lines.push('');
  lines.push('## Case results');
  lines.push('');
  lines.push('| Occupation | Score | Compatibility outlook | Seat-break scenario | Top exposed | Compression | Gap | Notes |');
  lines.push('| --- | ---: | --- | --- | --- | ---: | ---: | --- |');
  evaluations.forEach((entry) => {
    lines.push(`| ${entry.occupation} | ${entry.score.toFixed(3)} | ${entry.roleOutlook} | ${entry.primaryDisplacementWave} | ${entry.topExposedCluster || '-'} | ${entry.workflowCompression.toFixed(3)} | ${entry.substitutionGap.toFixed(3)} | ${entry.notes || '-'} |`);
  });

  if (failedCases.length) {
    lines.push('');
    lines.push('## Mismatch details');
    lines.push('');
    failedCases.forEach((entry) => {
      lines.push(`### ${entry.occupation}`);
      Object.keys(entry.checks).forEach((metric) => {
        const result = entry.checks[metric];
        if (result && !result.pass) {
          lines.push(`- \`${metric}\`: ${renderMetricCell(result)}`);
        }
      });
      lines.push('');
    });
  }

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  if (updateTargets) {
    const csvLines = [header.join(',')].concat(rows.map((row) => {
      return header.map((column) => csvEscape(row[column])).join(',');
    }));
    fs.writeFileSync(calibrationPath, `${csvLines.join('\n')}\n`, 'utf8');
  }

  const summary = {
    cases: evaluations.length,
    averageScore: Number(averageScore.toFixed(3)),
    perfectMatches: evaluations.filter((entry) => entry.score === 1).length,
    mismatches: failedCases.length,
    reportPath,
    targetsUpdated: updateTargets
  };

  console.log(JSON.stringify(summary, null, 2));

  if (strict && failedCases.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
