/**
 * calibrate_soft_ramp.js
 *
 * Validates the soft ramp change to current_wave_absorbed across all 61 occupations.
 * For each occupation:
 *   1. Runs computeResult with default (no questionnaire) profile
 *   2. Extracts per-cluster frontier_current_margin, absorbed_share, soft weight
 *   3. Computes what the OLD hard filter would have returned
 *   4. Flags any occupation where ≥1 cluster sits in the ±0.10 boundary zone
 *   5. Reports shifts in current_wave_absorbed and workflow_compression
 */

const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

const HALF_WIDTH = 0.10;

function softWeight(margin) {
  return Math.min(1, Math.max(0, (margin + HALF_WIDTH) / (2 * HALF_WIDTH)));
}

function hardWeight(margin) {
  return margin >= 0 ? 1 : 0;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

async function main() {
  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const occupations = engine.listOccupations();
  console.log(`Loaded ${occupations.length} occupations.\n`);

  const boundaryZone = [];    // clusters with |margin| < 0.10
  const allShifts = [];       // all occupation-level delta records
  let errors = 0;

  for (const occ of occupations) {
    let result;
    try {
      result = engine.computeResult({ occupationId: occ.occupation_id });
    } catch (err) {
      console.error(`  ERROR ${occ.occupation_id}: ${err.message}`);
      errors++;
      continue;
    }

    const bundle = result.transformation_map &&
                   result.transformation_map.current_bundle;
    if (!Array.isArray(bundle) || bundle.length === 0) continue;

    // Compute old (hard) and new (soft) current_wave_absorbed
    let hardSum = 0;
    let softSum = 0;
    const inBoundary = [];

    for (const cluster of bundle) {
      const margin = Number(cluster.frontier_current_margin) || 0;
      const share  = clamp(Number(cluster.absorbed_share) || 0, 0, 1.25);
      const sw = softWeight(margin);
      const hw = hardWeight(margin);
      softSum += share * sw;
      hardSum += share * hw;

      if (Math.abs(margin) < HALF_WIDTH) {
        inBoundary.push({
          cluster_id: cluster.cluster_id,
          margin: margin.toFixed(3),
          absorbed_share: share.toFixed(3),
          soft_weight: sw.toFixed(3),
          hard_weight: hw,
          soft_contribution: (share * sw).toFixed(3),
          hard_contribution: (share * hw).toFixed(3)
        });
      }
    }

    const newCWA = Math.round(softSum * 1000) / 1000;
    const oldCWA = Math.round(hardSum * 1000) / 1000;
    const delta  = Math.round((newCWA - oldCWA) * 1000) / 1000;

    const wc = result.recomposition_summary
               ? result.recomposition_summary.workflow_compression
               : null;
    const pdw = result.summary && result.summary.primary_displacement_wave;

    allShifts.push({
      occupation_id: occ.occupation_id,
      label: occ.label || occ.occupation_id,
      old_cwa: oldCWA,
      new_cwa: newCWA,
      delta: delta,
      workflow_compression: wc,
      primary_wave: pdw,
      boundary_clusters: inBoundary.length
    });

    if (inBoundary.length > 0) {
      boundaryZone.push({
        occupation_id: occ.occupation_id,
        label: occ.label || occ.occupation_id,
        old_cwa: oldCWA,
        new_cwa: newCWA,
        delta: delta,
        workflow_compression: wc,
        primary_wave: pdw,
        clusters: inBoundary
      });
    }
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const deltas = allShifts.map(r => r.delta);
  const maxDelta = Math.max(...deltas);
  const minDelta = Math.min(...deltas);
  const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const nonZero = deltas.filter(d => Math.abs(d) > 0.001).length;

  console.log('══════════════════════════════════════════════════════════');
  console.log('  SOFT RAMP CALIBRATION — current_wave_absorbed shift');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Occupations run    : ${allShifts.length}`);
  console.log(`  Errors             : ${errors}`);
  console.log(`  Affected (|Δ|>0.001): ${nonZero}`);
  console.log(`  In boundary zone   : ${boundaryZone.length}`);
  console.log(`  Δ range            : [${minDelta.toFixed(3)}, ${maxDelta.toFixed(3)}]`);
  console.log(`  Δ mean             : ${meanDelta.toFixed(4)}`);
  console.log('');

  if (boundaryZone.length === 0) {
    console.log('  No occupation has a cluster within ±0.10 of the current-wave boundary.');
    console.log('  The soft ramp has zero effect on the current dataset — safe to ship.\n');
  } else {
    console.log('  ── Boundary-zone occupations (|margin| < 0.10 in ≥1 cluster) ──\n');
    for (const rec of boundaryZone) {
      const arrow = rec.delta > 0.001 ? '▲' : rec.delta < -0.001 ? '▼' : '~';
      console.log(`  ${arrow} ${rec.label}`);
      console.log(`    old CWA=${rec.old_cwa.toFixed(3)}  new CWA=${rec.new_cwa.toFixed(3)}  Δ=${rec.delta.toFixed(3)}  wf_compression=${rec.workflow_compression != null ? rec.workflow_compression.toFixed(3) : 'n/a'}  wave=${rec.primary_wave || '?'}`);
      for (const cl of rec.clusters) {
        console.log(`      cluster ${cl.cluster_id}: margin=${cl.margin}  share=${cl.absorbed_share}  hard=${cl.hard_contribution}  soft=${cl.soft_contribution}  (w_soft=${cl.soft_weight})`);
      }
      console.log('');
    }
  }

  // ── Full table sorted by |delta| descending ───────────────────────────────
  console.log('  ── All occupations sorted by |Δ| ──\n');
  const sorted = [...allShifts].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  console.log('  occupation                                    old_CWA  new_CWA    Δ    wave');
  console.log('  ' + '─'.repeat(80));
  for (const rec of sorted) {
    if (Math.abs(rec.delta) < 0.001 && sorted.indexOf(rec) > 10) continue; // skip zero-delta tail after top-10
    const label = (rec.label || rec.occupation_id).substring(0, 44).padEnd(44);
    const oldC  = rec.old_cwa.toFixed(3).padStart(7);
    const newC  = rec.new_cwa.toFixed(3).padStart(7);
    const d     = (rec.delta >= 0 ? '+' : '') + rec.delta.toFixed(3);
    const wave  = (rec.primary_wave || '?').padEnd(8);
    console.log(`  ${label}  ${oldC}  ${newC}  ${d.padStart(7)}  ${wave}`);
  }

  console.log('\n  Done.\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
