const fs = require('fs');
const path = require('path');

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Expected ${label} to include ${needle}`);
  }
}

function assertExcludes(haystack, needle, label) {
  if (haystack.includes(needle)) {
    throw new Error(`Expected ${label} to exclude ${needle}`);
  }
}

function main() {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

  [
    'v2-intake-step-variant',
    'v2-composition-headline',
    'v2-composition-summary',
    'v2-role-variant-panel',
    'v2-role-variant-select',
    'v2-role-variant-note',
    'v2-task-add-select',
    'v2-task-add',
    'v2-function-add-select',
    'v2-function-add',
    'v2-role-graph-editor',
    'v2-role-graph-helper',
    'v2-graph-mode-group',
    'v2-dependency-source',
    'v2-dependency-target',
    'v2-dependency-add',
    'v2-dependency-list',
    'v2-state-exposure-grid',
    'v2-state-graph',
    'v2-state-summary-cards',
    'v2-state-share-graph',
    'v2-state-timing-ranges',
    'v2-pressure-map',
    'v2-frontier-metrics',
    'v2-frontier-driver-list',
    'v2-trigger-grid',
    'v2-occupation-forecast-grid'
  ].forEach((id) => {
    assertIncludes(html, `id="${id}"`, 'index.html');
  });

  [
    'populateV2RoleComposition',
    'renderV2RoleComposition',
    'renderV2RoleVariantControls',
    'renderV2DependencyEditor',
    'getDependencyEditsForEngine',
    'getCompositionEditsForEngine',
    'buildRoleGraphLayout',
    'buildRoleFateMap',
    'QUESTIONNAIRE_MODULES',
    'buildQuestionNode',
    'renderStateExposureSummary',
    'renderStateForecastChart',
    'renderStateShareForecastChart',
    'renderTimingFrontierSummary',
    'renderOccupationForecastMatrix'
  ].forEach((token) => {
    assertIncludes(app, token, 'app.js');
  });

  assertExcludes(html, 'id="q1-1"', 'index.html');
  [
    'id="v2-task-primary"',
    'id="v2-task-secondary"',
    'id="v2-task-critical"',
    'id="v2-task-supported"',
    'id="v2-task-spillover"',
    'id="v2-current-bundle"',
    'id="v2-bargaining-bundle"',
    'id="v2-direct-bundle"',
    'id="v2-indirect-bundle"',
    'id="v2-residual-bundle"',
    'id="v2-explanation-driver"',
    'id="v2-explanation-counterweight"',
    'id="v2-explanation-evidence"',
    'id="v2-explanation-review"',
    'id="v2-explanation-copy"'
  ].forEach((needle) => {
    assertExcludes(html, needle, 'index.html');
  });

  console.log(JSON.stringify({
    status: 'ok',
    checked: {
      unifiedRoleStudio: true,
      dependencyEditor: true,
      structuralStateSurface: true,
      timingFrontierInspector: true,
      questionnaireRenderedFromSchema: true
    }
  }, null, 2));
}

main();
