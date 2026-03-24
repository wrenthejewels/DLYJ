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

    incrementCount(counts, result.role_fate_state);
    incrementCount(waveCounts, result.primary_displacement_wave || 'none');
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
      role_fate_state: result.role_fate_state,
      decisive_trigger_id: result.transition_trigger_map?.decisive_trigger_id || null,
      trigger_confidence_label: result.transition_trigger_map?.confidence_label || null,
      primary_displacement_wave: result.primary_displacement_wave || null,
      primary_binding_constraint: result.timing_frontier?.primary_binding_constraint || null,
      assist_wave: result.timing_frontier?.triggers?.assist?.crossing_wave || null,
      delegate_wave: result.timing_frontier?.triggers?.delegate?.crossing_wave || null,
      compress_wave: result.timing_frontier?.triggers?.compress?.crossing_wave || null,
      structural_break_wave: result.timing_frontier?.triggers?.structural_break?.crossing_wave || null,
      primary_wave_score: result.timing_frontier?.primary_wave_score ?? null
    };
  });

  if (occupations.length !== snapshot.total_occupations) {
    throw new Error(`Expected ${snapshot.total_occupations} occupations in the default map, received ${occupations.length}.`);
  }

  if (stableStringify(counts) !== stableStringify(snapshot.role_fate_counts)) {
    throw new Error(
      'Default role-fate distribution drifted.\n' +
      'Expected:\n' + stableStringify(snapshot.role_fate_counts) + '\n' +
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
    if (actual.role_fate_state !== row.role_fate_state) {
      throw new Error(`${row.title} expected fate ${row.role_fate_state} but received ${actual.role_fate_state}.`);
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
    roleFateCounts: counts,
    primaryDisplacementWaveCounts: waveCounts,
    decisiveTriggerCounts,
    primaryBindingConstraintCounts,
    triggerCrossingWaveCounts,
    anchors: snapshot.anchor_occupations.map((row) => ({
      occupation: row.title,
      roleFate: byId[row.occupation_id].role_fate_state,
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
