const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

const NEUTRAL_ANSWERS = {
  Q1: 3, Q2: 3, Q3: 3, Q4: 3, Q5: 3, Q6: 3,
  Q7: 3, Q8: 3, Q9: 3,
  Q11: 3, Q12: 3, Q13: 3, Q14: 3, Q16: 3
};

const EXPECTATIONS = [
  { occupationId: 'occ_15_1252_00', title: 'Software Developers', expected: 'Same work, fewer people' },
  { occupationId: 'occ_11_1021_00', title: 'General and Operations Managers', expected: 'Less execution, more judgment' },
  { occupationId: 'occ_13_1111_00', title: 'Management Analysts', expected: 'Less execution, more judgment' },
  { occupationId: 'occ_23_1011_00', title: 'Lawyers', expected: 'AI-supported role stays intact' },
  { occupationId: 'occ_41_3091_00', title: 'Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel', expected: 'AI-supported role stays intact' },
  { occupationId: 'occ_43_4051_00', title: 'Customer Service Representatives', expected: 'Same work, fewer people' },
  { occupationId: 'occ_15_2031_00', title: 'Operations Research Analysts', expected: 'Mixed signals, path still unclear' },
  { occupationId: 'occ_13_1081_00', title: 'Logisticians', expected: 'Same work, fewer people' }
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

    if (result.role_fate_label !== row.expected) {
      throw new Error(`${row.title} expected ${row.expected} but received ${result.role_fate_label}.`);
    }

    results.push({
      occupation: row.title,
      roleFate: result.role_fate_label,
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
