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
  const appSource = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8');

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
  assert(
    /first_transition_state:\s*likelyNextState/.test(source),
    'State trajectory should expose an explicit first_transition_state field.'
  );
  assert(
    /first_transition_year:\s*firstTransitionYear/.test(source),
    'State trajectory should expose an explicit first_transition_year field.'
  );
  assert(
    /next_checkpoint_state:\s*nextCheckpoint \? nextCheckpoint\.state : ''/.test(source),
    'Role-fate classification inputs should carry the continuous next checkpoint state.'
  );
  assert(
    /timing_frontier_primary_score:\s*timingFrontier\.primary_wave_score/.test(source),
    'Role-fate classification inputs should carry the continuous primary timing score.'
  );
  assert(
    /role_fate_scores:\s*roleFate\._scores \|\| null/.test(source),
    'Top-level results should expose raw role-fate score diagnostics.'
  );
  assert(
    /legacy_role_fate_state:\s*legacyRoleFate\.state/.test(source),
    'Top-level results should expose the legacy compatibility fate separately from the raw classifier fate.'
  );
  assert(
    /first_transition_state/.test(appSource),
    'App state consumers should recognize first_transition_state.'
  );
  assert(
    !/current_wave_retained|current_wave_coherence|next_wave_coherence|distant_wave_retained|distant_wave_coherence/.test(appSource),
    'Occupation-landscape snapshot metrics should not expose checkpoint fields under wave-shaped names.'
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
  const residualTierCounts = {};
  const personalizationTierCounts = {};
  let legacyFateDivergenceCount = 0;
  let transitionVsCheckpointDivergenceCount = 0;

  function incrementCount(map, key) {
    map[key] = (map[key] || 0) + 1;
  }

  occupations.forEach((occupation) => {
    const result = engine.computeResult({
      occupationId: occupation.occupation_id,
      userInputs: {}
    });

    const frontier = result.timing_frontier || {};
    const stateTrajectory = result.state_trajectory || {};
    const checkpoints = stateTrajectory.checkpoints || {};
    const compatibilityNext = result.wave_trajectory?.next || {};
    const score = Number(frontier.primary_wave_score);
    const firstTransitionState = String(stateTrajectory.first_transition_state || '');
    const firstTransitionYear = stateTrajectory.first_transition_year;
    const transitionMarker = Array.isArray(stateTrajectory.timeline?.markers?.transitions)
      ? stateTrajectory.timeline.markers.transitions[0] || null
      : null;
    incrementCount(residualTierCounts, result.residual_role_strength || 'none');
    incrementCount(personalizationTierCounts, result.personalization_fit || 'none');
    assert(Number.isFinite(score) && score >= 0 && score <= 1, `${occupation.title} should expose a bounded primary_wave_score.`);
    assert(result.role_fate_scores && Object.keys(result.role_fate_scores).length === 7, `${occupation.title} should expose all 7 role-fate scores.`);
    assert(firstTransitionState, `${occupation.title} should expose first_transition_state.`);
    assert(
      stateTrajectory.likely_next_state === firstTransitionState,
      `${occupation.title} should keep likely_next_state as a compatibility alias to first_transition_state.`
    );
    if (transitionMarker) {
      assert(
        firstTransitionState === String(transitionMarker.state || ''),
        `${occupation.title} should align first_transition_state with the first timeline transition marker.`
      );
      assert(
        Math.abs(Number(firstTransitionYear) - Number(transitionMarker.year)) <= 0.001,
        `${occupation.title} should align first_transition_year with the first timeline transition marker year.`
      );
    } else {
      assert(
        firstTransitionYear === null,
        `${occupation.title} should use null first_transition_year when no future state transition marker exists.`
      );
    }

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

    if (result.role_fate_state !== result.legacy_role_fate_state) {
      legacyFateDivergenceCount += 1;
      assert(
        Math.abs(Number(result.role_fate_confidence) - Number(result.legacy_role_fate_confidence)) <= 0.001,
        `${occupation.title} should preserve classifier confidence across raw and legacy fate exports.`
      );
    }

    if (firstTransitionState && checkpoints.next?.state && firstTransitionState !== checkpoints.next.state) {
      transitionVsCheckpointDivergenceCount += 1;
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
  assert(
    ((residualTierCounts.moderate || 0) + (residualTierCounts.strong || 0)) > 0,
    'Residual role strength tiers should not collapse to all weak.'
  );
  assert(
    ((personalizationTierCounts.moderate || 0) + (personalizationTierCounts.strong || 0)) > 0,
    'Personalization-fit tiers should not collapse to all weak.'
  );
  assert(legacyFateDivergenceCount > 0, 'Expected at least one occupation where raw role fate differs from the legacy compatibility fate.');
  assert(
    transitionVsCheckpointDivergenceCount > 0,
    'Expected at least one occupation where first_transition_state differs from the fixed next checkpoint state.'
  );

  console.log(JSON.stringify({
    status: 'ok',
    currentWaveCount: currentWaveScores.length,
    distinctCurrentWaveScores: uniqueCount(currentWaveScores),
    residualTierCounts,
    personalizationTierCounts,
    legacyFateDivergenceCount,
    transitionVsCheckpointDivergenceCount
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
