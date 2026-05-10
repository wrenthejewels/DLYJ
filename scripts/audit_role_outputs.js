const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function main() {
  const format = process.argv.includes('--json') ? 'json' : 'csv';
  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const rows = engine.listOccupations().map((occupation) => {
    const result = engine.computeResult({
      occupationId: occupation.occupation_id,
      userInputs: {}
    });
    const topShrink = (result.task_accession_map?.shrinking_clusters || [])[0] || null;
    const topGrow = (result.task_accession_map?.accession_clusters || [])[0] || null;

    return {
      occupation_id: occupation.occupation_id,
      title: occupation.title,
      current_state: result.state_trajectory?.current_state || '',
      long_run_state: result.state_trajectory?.long_run_state || '',
      state_headline: result.state_trajectory?.headline || '',
      decisive_trigger_id: result.transition_trigger_map?.decisive_trigger_id || '',
      trigger_confidence_label: result.transition_trigger_map?.confidence_label || '',
      trigger_confidence_reason: result.transition_trigger_map?.confidence_reason || '',
      net_seat_effect_label: result.seat_change_map?.net_seat_effect_label || '',
      top_shrinking_bundle: topShrink?.public_label || topShrink?.task_cluster_label || '',
      top_growing_bundle: topGrow?.public_label || topGrow?.task_cluster_label || ''
    };
  });

  if (format === 'json') {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const headers = Object.keys(rows[0] || {});
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(','));
  });
  console.log(lines.join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
