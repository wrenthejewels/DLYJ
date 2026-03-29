const fs = require('fs');
const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function uniqueCount(values) {
  return new Set(values.map((value) => Number(value).toFixed(3))).size;
}

function assertSourcePatternGuards() {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'v2_engine.js'), 'utf8');

  const reliabilityMatch = source.match(/function estimateTaskSourceEvidenceReliability[\s\S]*?return clamp\(([\s\S]*?)\);\s*}/);
  assert(reliabilityMatch, 'Could not locate estimateTaskSourceEvidenceReliability in source.');
  assert(
    !/evidenceWeight/.test(reliabilityMatch[1]),
    'Task-source reliability should not multiply evidenceWeight internally.'
  );

  assert(
    !/retained_bargaining_power[\s\S]*0\.5,\s*1/.test(source),
    'Timing frontier should not clamp retained_bargaining_power to [0.5, 1].'
  );
  assert(
    !/retained_accountability_strength[\s\S]*0\.5,\s*1/.test(source),
    'Timing frontier should not clamp retained_accountability_strength to [0.5, 1].'
  );
  assert(
    !/next_wave_retained:\s*waveResults\.next\.retained_share/.test(source),
    'Timing frontier should not read next_wave_retained from legacy waveResults.'
  );
  assert(
    !/residual_role_integrity:[\s\S]*waveResults\.next\.coherence/.test(source),
    'Timing frontier should not read residual_role_integrity from legacy waveResults.'
  );
  assert(
    /var initialClusterFrontier = buildClusterFrontierBundle\([\s\S]*?var taskGraphSummary = buildTaskRoleGraphBreakdown\(/.test(source),
    'Task-role graph diagnostics should be seeded from the shared cluster frontier bundle before graph scoring runs.'
  );
}

async function main() {
  assertSourcePatternGuards();

  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const occupations = engine.listOccupations();
  const currentWaveScores = [];
  const waveOrder = { current: 0, next: 1, distant: 2 };

  occupations.forEach((occupation) => {
    const result = engine.computeResult({
      occupationId: occupation.occupation_id,
      userInputs: {}
    });

    const frontier = result.timing_frontier || {};
    const checkpoints = result.state_trajectory?.checkpoints || {};
    const compatibilityNext = result.wave_trajectory?.next || {};
    const score = Number(frontier.primary_wave_score);
    assert(Number.isFinite(score) && score >= 0 && score <= 1, `${occupation.title} should expose a bounded primary_wave_score.`);

    const nextRetainedFromState = Number((1 - Number(checkpoints.next?.transformed_share || 0)).toFixed(3));
    const nextRetainedFromCompatibility = Number(Number(compatibilityNext.retained_share || 0).toFixed(3));
    assert(
      Math.abs(nextRetainedFromState - nextRetainedFromCompatibility) <= 0.001,
      `${occupation.title} should derive compatibility next-wave retained share from the continuous next checkpoint.`
    );

    const compressWave = frontier.triggers?.compress?.crossing_wave || 'distant';
    const structuralBreakWave = frontier.triggers?.structural_break?.crossing_wave || 'distant';
    const expectedPrimaryWave = waveOrder[structuralBreakWave] < waveOrder[compressWave]
      ? structuralBreakWave
      : compressWave;
    assert(
      frontier.primary_displacement_wave === expectedPrimaryWave,
      `${occupation.title} should expose the earliest displacement wave from compress/structural_break.`
    );

    const expectedPrimaryConstraint = waveOrder[structuralBreakWave] < waveOrder[compressWave]
      ? frontier.triggers?.structural_break?.binding_constraint
      : frontier.triggers?.compress?.binding_constraint;
    if (expectedPrimaryConstraint) {
      assert(
        frontier.primary_binding_constraint === expectedPrimaryConstraint,
        `${occupation.title} should expose the binding constraint from the trigger that sets the primary displacement wave.`
      );
    }

    if (frontier.primary_displacement_wave === 'current') {
      currentWaveScores.push(score);
    }
  });

  assert(currentWaveScores.length >= 3, 'Expected multiple current-wave occupations in the default map.');
  assert(
    uniqueCount(currentWaveScores) >= 3,
    `Expected the current-wave cohort to expose multiple continuous timing scores, received ${currentWaveScores.join(', ')}.`
  );

  console.log(JSON.stringify({
    status: 'ok',
    currentWaveCount: currentWaveScores.length,
    distinctCurrentWaveScores: uniqueCount(currentWaveScores)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
