const fs = require('fs');
const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

const SNAPSHOT_PATH = path.resolve(__dirname, 'fixtures', 'role_map_regression_snapshot.json');

function stableStringify(value) {
  return JSON.stringify(value, null, 2);
}

async function main() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const occupations = engine.listOccupations();
  const counts = {};
  const byId = {};

  occupations.forEach((occupation) => {
    const result = engine.computeResult({
      occupationId: occupation.occupation_id,
      userInputs: {}
    });

    counts[result.role_fate_state] = (counts[result.role_fate_state] || 0) + 1;
    byId[occupation.occupation_id] = {
      title: occupation.title,
      role_fate_state: result.role_fate_state,
      decisive_trigger_id: result.transition_trigger_map?.decisive_trigger_id || null,
      trigger_confidence_label: result.transition_trigger_map?.confidence_label || null
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
  });

  console.log(JSON.stringify({
    status: 'ok',
    totalOccupations: occupations.length,
    roleFateCounts: counts,
    anchors: snapshot.anchor_occupations.map((row) => ({
      occupation: row.title,
      roleFate: byId[row.occupation_id].role_fate_state,
      decisiveTrigger: byId[row.occupation_id].decisive_trigger_id,
      triggerConfidence: byId[row.occupation_id].trigger_confidence_label
    }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
