const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

const NEUTRAL_ANSWERS = {
  Q1: 3, Q2: 3, Q3: 3, Q4: 3, Q5: 3, Q6: 3,
  Q7: 3, Q8: 3, Q9: 3,
  Q11: 3, Q12: 3, Q13: 3, Q14: 3, Q16: 3
};

const EXPECTATIONS = [
  {
    occupationId: 'occ_15_1252_00',
    title: 'Software Developers',
    expectedRaw: 'Execution is leaving this role. Judgment is what stays.',
    expectedLegacy: 'The path forward for this role is still unsettled'
  },
  {
    occupationId: 'occ_11_1021_00',
    title: 'General and Operations Managers',
    expectedRaw: 'Your role stays intact — AI assists, you still lead',
    expectedLegacy: 'The path forward for this role is still unsettled'
  },
  {
    occupationId: 'occ_13_1111_00',
    title: 'Management Analysts',
    expectedRaw: 'Your role stays intact — AI assists, you still lead',
    expectedLegacy: 'Demand for this role is growing alongside AI'
  },
  {
    occupationId: 'occ_23_1011_00',
    title: 'Lawyers',
    expectedRaw: 'Your role stays intact — AI assists, you still lead',
    expectedLegacy: 'Your role stays intact — AI assists, you still lead'
  },
  {
    occupationId: 'occ_41_3091_00',
    title: 'Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel',
    expectedRaw: 'Your role stays intact — AI assists, you still lead',
    expectedLegacy: 'The path forward for this role is still unsettled'
  },
  {
    occupationId: 'occ_43_4051_00',
    title: 'Customer Service Representatives',
    expectedRaw: 'The work survives, but fewer people will do it',
    expectedLegacy: 'The path forward for this role is still unsettled'
  },
  {
    occupationId: 'occ_15_2031_00',
    title: 'Operations Research Analysts',
    expectedRaw: 'Your role stays intact — AI assists, you still lead',
    expectedLegacy: 'The path forward for this role is still unsettled'
  },
  {
    occupationId: 'occ_13_1081_00',
    title: 'Logisticians',
    expectedRaw: 'Your role stays intact — AI assists, you still lead',
    expectedLegacy: 'The path forward for this role is still unsettled'
  }
];

async function main() {
  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const results = [];
  for (const row of EXPECTATIONS) {
    const result = engine.computeResult({
      occupationId: row.occupationId,
      answers: NEUTRAL_ANSWERS,
      seniorityLevel: 3
    });

    if (result.role_fate_label !== row.expectedRaw) {
      throw new Error(`${row.title} expected raw fate ${row.expectedRaw} but received ${result.role_fate_label}.`);
    }
    if (result.legacy_role_fate_label !== row.expectedLegacy) {
      throw new Error(`${row.title} expected legacy fate ${row.expectedLegacy} but received ${result.legacy_role_fate_label}.`);
    }
    if (Math.abs(Number(result.role_fate_confidence) - Number(result.legacy_role_fate_confidence)) > 0.001) {
      throw new Error(`${row.title} should preserve classifier confidence across raw and legacy fate exports.`);
    }

    results.push({
      occupation: row.title,
      roleFate: result.role_fate_label,
      legacyRoleFate: result.legacy_role_fate_label,
      confidence: result.role_fate_confidence,
      directPressure: result.diagnostics.direct_exposure_pressure,
      spillover: result.diagnostics.indirect_dependency_pressure
    });
  }

  console.log(JSON.stringify({ status: 'ok', calibrated: results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
