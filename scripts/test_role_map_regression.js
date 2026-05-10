const fs = require('fs');
const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

const SNAPSHOT_PATH = path.resolve(__dirname, 'fixtures', 'role_map_regression_snapshot.json');

function stableStringify(value) {
  return JSON.stringify(value, null, 2);
}

function incrementCount(map, key) {
  map[key] = (map[key] || 0) + 1;
}

async function main() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const updateSnapshot = process.argv.includes('--update');
  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const occupations = engine.listOccupations();
  const counts = {};
  const waveCounts = {};
  const decisiveTriggerCounts = {};
  const primaryBindingConstraintCounts = {};
  const triggerCrossingWaveCounts = {
    assist: {},
    delegate: {},
    compress: {},
    structural_break: {}
  };
  const byId = {};

  occupations.forEach((occupation) => {
    const result = engine.computeResult({
      occupationId: occupation.occupation_id,
      userInputs: {}
    });

    const state = result.state_trajectory?.long_run_state || result.state_trajectory?.current_state || 'none';
    const primaryWave = result.timing_frontier?.primary_displacement_wave || 'none';
    incrementCount(counts, state);
    incrementCount(waveCounts, primaryWave);
    incrementCount(decisiveTriggerCounts, result.transition_trigger_map?.decisive_trigger_id || 'none');
    incrementCount(primaryBindingConstraintCounts, result.timing_frontier?.primary_binding_constraint || 'none');
    ['assist', 'delegate', 'compress', 'structural_break'].forEach((triggerId) => {
      incrementCount(
        triggerCrossingWaveCounts[triggerId],
        result.timing_frontier?.triggers?.[triggerId]?.crossing_wave || 'none'
      );
    });

    byId[occupation.occupation_id] = {
      title: occupation.title,
      long_run_state: state,
      current_state: result.state_trajectory?.current_state || null,
      decisive_trigger_id: result.transition_trigger_map?.decisive_trigger_id || null,
      trigger_confidence_label: result.transition_trigger_map?.confidence_label || null,
      primary_displacement_wave: primaryWave,
      primary_binding_constraint: result.timing_frontier?.primary_binding_constraint || null,
      assist_wave: result.timing_frontier?.triggers?.assist?.crossing_wave || null,
      delegate_wave: result.timing_frontier?.triggers?.delegate?.crossing_wave || null,
      compress_wave: result.timing_frontier?.triggers?.compress?.crossing_wave || null,
      structural_break_wave: result.timing_frontier?.triggers?.structural_break?.crossing_wave || null,
      primary_wave_score: result.timing_frontier?.primary_wave_score ?? null
    };
  });

  if (updateSnapshot) {
    const nextSnapshot = {
      total_occupations: occupations.length,
      state_counts: counts,
      primary_displacement_wave_counts: waveCounts,
      decisive_trigger_counts: decisiveTriggerCounts,
      primary_binding_constraint_counts: primaryBindingConstraintCounts,
      trigger_crossing_wave_counts: triggerCrossingWaveCounts,
      anchor_occupations: snapshot.anchor_occupations.map((row) => {
        const actual = byId[row.occupation_id];
        if (!actual) {
          throw new Error(`Cannot update snapshot: missing anchor occupation ${row.occupation_id}.`);
        }
        return {
          occupation_id: row.occupation_id,
          title: actual.title,
          long_run_state: actual.long_run_state,
          current_state: actual.current_state,
          decisive_trigger_id: actual.decisive_trigger_id,
          trigger_confidence_label: actual.trigger_confidence_label,
          primary_displacement_wave: actual.primary_displacement_wave,
          primary_binding_constraint: actual.primary_binding_constraint,
          assist_wave: actual.assist_wave,
          delegate_wave: actual.delegate_wave,
          compress_wave: actual.compress_wave,
          structural_break_wave: actual.structural_break_wave,
          primary_wave_score: actual.primary_wave_score
        };
      })
    };
    fs.writeFileSync(SNAPSHOT_PATH, `${stableStringify(nextSnapshot)}\n`, 'utf8');
    console.log(JSON.stringify({ status: 'updated', snapshotPath: SNAPSHOT_PATH }, null, 2));
    return;
  }

  if (occupations.length !== snapshot.total_occupations) {
    throw new Error(`Expected ${snapshot.total_occupations} occupations in the default map, received ${occupations.length}.`);
  }

  if (stableStringify(counts) !== stableStringify(snapshot.state_counts)) {
    throw new Error(
      'Default trajectory-state distribution drifted.\n' +
      'Expected:\n' + stableStringify(snapshot.state_counts) + '\n' +
      'Received:\n' + stableStringify(counts)
    );
  }
  if (stableStringify(waveCounts) !== stableStringify(snapshot.primary_displacement_wave_counts)) {
    throw new Error(
      'Default timing-wave distribution drifted.\n' +
      'Expected:\n' + stableStringify(snapshot.primary_displacement_wave_counts) + '\n' +
      'Received:\n' + stableStringify(waveCounts)
    );
  }
  if (stableStringify(decisiveTriggerCounts) !== stableStringify(snapshot.decisive_trigger_counts)) {
    throw new Error(
      'Default decisive-trigger distribution drifted.\n' +
      'Expected:\n' + stableStringify(snapshot.decisive_trigger_counts) + '\n' +
      'Received:\n' + stableStringify(decisiveTriggerCounts)
    );
  }
  if (stableStringify(primaryBindingConstraintCounts) !== stableStringify(snapshot.primary_binding_constraint_counts)) {
    throw new Error(
      'Default frontier-constraint distribution drifted.\n' +
      'Expected:\n' + stableStringify(snapshot.primary_binding_constraint_counts) + '\n' +
      'Received:\n' + stableStringify(primaryBindingConstraintCounts)
    );
  }
  if (stableStringify(triggerCrossingWaveCounts) !== stableStringify(snapshot.trigger_crossing_wave_counts)) {
    throw new Error(
      'Default trigger crossing-wave distribution drifted.\n' +
      'Expected:\n' + stableStringify(snapshot.trigger_crossing_wave_counts) + '\n' +
      'Received:\n' + stableStringify(triggerCrossingWaveCounts)
    );
  }

  snapshot.anchor_occupations.forEach((row) => {
    const actual = byId[row.occupation_id];
    if (!actual) {
      throw new Error(`Expected anchor occupation ${row.occupation_id} to exist in the default map output.`);
    }
    if (actual.long_run_state !== row.long_run_state) {
      throw new Error(`${row.title} expected long-run state ${row.long_run_state} but received ${actual.long_run_state}.`);
    }
    if (actual.decisive_trigger_id !== row.decisive_trigger_id) {
      throw new Error(`${row.title} expected decisive trigger ${row.decisive_trigger_id} but received ${actual.decisive_trigger_id}.`);
    }
    if (actual.trigger_confidence_label !== row.trigger_confidence_label) {
      throw new Error(`${row.title} expected trigger confidence ${row.trigger_confidence_label} but received ${actual.trigger_confidence_label}.`);
    }
    if (actual.primary_displacement_wave !== row.primary_displacement_wave) {
      throw new Error(`${row.title} expected primary wave ${row.primary_displacement_wave} but received ${actual.primary_displacement_wave}.`);
    }
    if (actual.primary_binding_constraint !== row.primary_binding_constraint) {
      throw new Error(`${row.title} expected primary frontier constraint ${row.primary_binding_constraint} but received ${actual.primary_binding_constraint}.`);
    }
    ['assist_wave', 'delegate_wave', 'compress_wave', 'structural_break_wave'].forEach((key) => {
      if (actual[key] !== row[key]) {
        throw new Error(`${row.title} expected ${key}=${row[key]} but received ${actual[key]}.`);
      }
    });
    if (typeof row.primary_wave_score === 'number') {
      const actualScore = typeof actual.primary_wave_score === 'number' ? actual.primary_wave_score : NaN;
      if (Math.abs(actualScore - row.primary_wave_score) > 0.001) {
        throw new Error(`${row.title} expected primary_wave_score ${row.primary_wave_score} but received ${actual.primary_wave_score}.`);
      }
    }
  });

  console.log(JSON.stringify({
    status: 'ok',
    totalOccupations: occupations.length,
    stateCounts: counts,
    primaryDisplacementWaveCounts: waveCounts,
    decisiveTriggerCounts,
    primaryBindingConstraintCounts,
    triggerCrossingWaveCounts,
    anchors: snapshot.anchor_occupations.map((row) => ({
      occupation: row.title,
      longRunState: byId[row.occupation_id].long_run_state,
      decisiveTrigger: byId[row.occupation_id].decisive_trigger_id,
      triggerConfidence: byId[row.occupation_id].trigger_confidence_label,
      primaryWave: byId[row.occupation_id].primary_displacement_wave,
      primaryConstraint: byId[row.occupation_id].primary_binding_constraint
    }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
