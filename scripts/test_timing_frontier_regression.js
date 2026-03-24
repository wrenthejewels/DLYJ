const fs = require('fs');
const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

const SNAPSHOT_PATH = path.resolve(__dirname, 'fixtures', 'timing_frontier_regression_snapshot.json');
const ANCHOR_OCCUPATIONS = new Set([
  'occ_15_1252_00',
  'occ_11_1021_00',
  'occ_13_1111_00',
  'occ_23_1011_00',
  'occ_43_4051_00',
  'occ_15_2031_00',
  'occ_13_1081_00',
  'occ_13_2051_00'
]);

function stableStringify(value) {
  return JSON.stringify(value, null, 2);
}

function incrementCount(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function expectedFrontierWave(margins) {
  if (Number(margins?.current) >= 0) return 'current';
  if (Number(margins?.next) >= 0) return 'next';
  return 'distant';
}

function assertScenarioActivation(name, activation) {
  ['current', 'next', 'distant', 'ceiling'].forEach((key) => {
    const value = Number(activation?.[key]);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`${name}.${key} must be in [0, 1], received ${activation?.[key]}.`);
    }
  });
  if (activation.next < activation.current) {
    throw new Error(`${name}.next should be >= current.`);
  }
  if (activation.distant < activation.next) {
    throw new Error(`${name}.distant should be >= next.`);
  }
  if (activation.ceiling < activation.distant) {
    throw new Error(`${name}.ceiling should be >= distant.`);
  }
}

function assertTriggerConsistency(trigger, label) {
  if (!trigger?.scenario_margins) {
    throw new Error(`${label} should expose scenario_margins.`);
  }
  const expectedWave = expectedFrontierWave(trigger.scenario_margins);
  if (trigger.crossing_wave !== expectedWave) {
    throw new Error(`${label} expected crossing_wave=${expectedWave}, received ${trigger.crossing_wave}.`);
  }
}

async function main() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const occupations = engine.listOccupations();
  const primaryWaveCounts = {};
  const primaryConstraintCounts = {};
  const triggerCrossingWaveCounts = {
    assist: {},
    delegate: {},
    compress: {},
    structural_break: {}
  };
  const roleFateByPrimaryWave = {
    current: {},
    next: {},
    distant: {}
  };
  const anchors = [];

  occupations.forEach((occupation) => {
    const result = engine.computeResult({
      occupationId: occupation.occupation_id,
      userInputs: {}
    });

    const frontier = result.timing_frontier || {};
    assertScenarioActivation(`${occupation.title}.timing_frontier.scenario_activation`, frontier.scenario_activation);
    ['assist', 'delegate', 'compress', 'structural_break'].forEach((triggerId) => {
      const trigger = frontier.triggers?.[triggerId];
      assertTriggerConsistency(trigger, `${occupation.title}.timing_frontier.triggers.${triggerId}`);
      incrementCount(triggerCrossingWaveCounts[triggerId], trigger?.crossing_wave || 'none');
    });

    incrementCount(primaryWaveCounts, frontier.primary_displacement_wave || result.primary_displacement_wave || 'none');
    incrementCount(primaryConstraintCounts, frontier.primary_binding_constraint || 'none');
    incrementCount(roleFateByPrimaryWave[frontier.primary_displacement_wave || result.primary_displacement_wave || 'distant'], result.role_fate_state || 'none');

    if (ANCHOR_OCCUPATIONS.has(occupation.occupation_id)) {
      const compress = frontier.triggers?.compress || {};
      const structuralBreak = frontier.triggers?.structural_break || {};
      const topDriver = Array.isArray(frontier.cluster_drivers) && frontier.cluster_drivers.length
        ? frontier.cluster_drivers[0]
        : null;

      anchors.push({
        occupation_id: occupation.occupation_id,
        title: occupation.title,
        role_fate_state: result.role_fate_state,
        primary_displacement_wave: frontier.primary_displacement_wave || result.primary_displacement_wave,
        primary_binding_constraint: frontier.primary_binding_constraint || null,
        primary_wave_score: frontier.primary_wave_score,
        scenario_activation: frontier.scenario_activation,
        compress: {
          crossing_wave: compress.crossing_wave || null,
          current_margin: compress.scenario_margins?.current ?? null,
          next_margin: compress.scenario_margins?.next ?? null
        },
        structural_break: {
          crossing_wave: structuralBreak.crossing_wave || null,
          current_margin: structuralBreak.scenario_margins?.current ?? null,
          next_margin: structuralBreak.scenario_margins?.next ?? null
        },
        top_driver: topDriver ? {
          label: topDriver.label,
          crossing_wave: topDriver.crossing_wave,
          binding_constraint: topDriver.binding_constraint,
          current_margin: topDriver.current_margin,
          next_margin: topDriver.next_margin
        } : null
      });
    }
  });

  anchors.sort((left, right) => left.title.localeCompare(right.title));

  const actual = {
    total_occupations: occupations.length,
    primary_displacement_wave_counts: primaryWaveCounts,
    primary_binding_constraint_counts: primaryConstraintCounts,
    trigger_crossing_wave_counts: triggerCrossingWaveCounts,
    role_fate_by_primary_wave: roleFateByPrimaryWave,
    anchor_occupations: anchors
  };

  if (stableStringify(actual) !== stableStringify(snapshot)) {
    throw new Error(
      'Timing-frontier regression snapshot drifted.\n' +
      'Expected:\n' + stableStringify(snapshot) + '\n' +
      'Received:\n' + stableStringify(actual)
    );
  }

  console.log(JSON.stringify({
    status: 'ok',
    totalOccupations: actual.total_occupations,
    primaryWaveCounts: actual.primary_displacement_wave_counts,
    primaryConstraintCounts: actual.primary_binding_constraint_counts,
    triggerCrossingWaveCounts: actual.trigger_crossing_wave_counts,
    anchors: actual.anchor_occupations.map((row) => ({
      occupation: row.title,
      primaryWave: row.primary_displacement_wave,
      primaryConstraint: row.primary_binding_constraint,
      topDriver: row.top_driver?.label || null
    }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
