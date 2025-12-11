// Role and seniority presets for domain friction and reliability
// These are conservative priors grounded in domain tacit/physical/relational load
// and typical corporate QA requirements. They do not change METR doubling.

;(function(){
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Base per-role recommendations
  const ROLE_PRESETS = {
    'software':              { friction: 1.05, reliabilityBase: 0.92 },
    'admin':                 { friction: 1.10, reliabilityBase: 0.90 },
    'data-analysis':         { friction: 1.10, reliabilityBase: 0.93 },
    'finance':               { friction: 1.35, reliabilityBase: 0.97 },
    'sales':                 { friction: 1.25, reliabilityBase: 0.90 },
    'creative':              { friction: 1.20, reliabilityBase: 0.88 },
    'legal':                 { friction: 1.45, reliabilityBase: 0.98 },
    'product-management':    { friction: 1.30, reliabilityBase: 0.95 },
    'consulting':            { friction: 1.35, reliabilityBase: 0.96 },
    'hr':                    { friction: 1.30, reliabilityBase: 0.94 },
    'content-writing':       { friction: 1.10, reliabilityBase: 0.88 },
    'journalism':            { friction: 1.20, reliabilityBase: 0.90 },
    'engineering':           { friction: 1.50, reliabilityBase: 0.98 },
    'operations':            { friction: 1.80, reliabilityBase: 0.92 },
    'custom':                { friction: 1.20, reliabilityBase: 0.92 },
  };

  // Baseline (neutral) answers for all 19 questions
  const NEUTRAL_ANSWERS = {
    Q1: 3, Q2: 3, Q3: 3, Q4: 3, Q5: 3,
    Q6: 3, Q7: 3, Q8: 3, Q9: 3, Q10: 3,
    Q11: 3, Q12: 3, Q13: 3, Q14: 3, Q15: 3,
    Q16: 3, Q17: 3, Q18: 3, Q19: 3,
  };

  // Baseline per-role answers for Q1-Q19 (derived from role_preset_template.md)
  const ROLE_QUESTION_PRESETS = {
    'software': {
      Q1: 5, Q2: 5, Q3: 4, Q4: 5, Q5: 4, Q6: 4, Q7: 2, Q8: 3, Q9: 2, Q10: 2,
      Q11: 1, Q12: 2, Q13: 4, Q14: 3, Q15: 3, Q16: 4, Q17: 4, Q18: 3, Q19: 3,
    },
    'admin': {
      Q1: 3, Q2: 4, Q3: 3, Q4: 4, Q5: 4, Q6: 4, Q7: 2, Q8: 4, Q9: 2, Q10: 3,
      Q11: 2, Q12: 3, Q13: 3, Q14: 4, Q15: 3, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'data-analysis': {
      Q1: 5, Q2: 5, Q3: 4, Q4: 5, Q5: 4, Q6: 4, Q7: 2, Q8: 4, Q9: 2, Q10: 2,
      Q11: 1, Q12: 2, Q13: 3, Q14: 3, Q15: 3, Q16: 4, Q17: 4, Q18: 3, Q19: 3,
    },
    'finance': {
      Q1: 4, Q2: 4, Q3: 4, Q4: 5, Q5: 4, Q6: 4, Q7: 2, Q8: 4, Q9: 2, Q10: 2,
      Q11: 1, Q12: 4, Q13: 3, Q14: 4, Q15: 3, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'sales': {
      Q1: 3, Q2: 3, Q3: 2, Q4: 3, Q5: 3, Q6: 2, Q7: 4, Q8: 3, Q9: 4, Q10: 4,
      Q11: 3, Q12: 3, Q13: 3, Q14: 3, Q15: 3, Q16: 3, Q17: 4, Q18: 4, Q19: 3,
    },
    'creative': {
      Q1: 4, Q2: 3, Q3: 3, Q4: 4, Q5: 3, Q6: 2, Q7: 3, Q8: 3, Q9: 3, Q10: 3,
      Q11: 2, Q12: 2, Q13: 3, Q14: 3, Q15: 3, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'legal': {
      Q1: 3, Q2: 3, Q3: 3, Q4: 4, Q5: 3, Q6: 3, Q7: 4, Q8: 2, Q9: 4, Q10: 4,
      Q11: 2, Q12: 5, Q13: 2, Q14: 3, Q15: 4, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'product-management': {
      Q1: 3, Q2: 3, Q3: 2, Q4: 4, Q5: 3, Q6: 3, Q7: 4, Q8: 3, Q9: 4, Q10: 4,
      Q11: 2, Q12: 3, Q13: 3, Q14: 3, Q15: 3, Q16: 3, Q17: 4, Q18: 4, Q19: 3,
    },
    'consulting': {
      Q1: 3, Q2: 3, Q3: 2, Q4: 4, Q5: 3, Q6: 2, Q7: 4, Q8: 3, Q9: 4, Q10: 5,
      Q11: 3, Q12: 4, Q13: 3, Q14: 3, Q15: 3, Q16: 3, Q17: 4, Q18: 4, Q19: 3,
    },
    'hr': {
      Q1: 3, Q2: 3, Q3: 3, Q4: 4, Q5: 3, Q6: 3, Q7: 3, Q8: 3, Q9: 3, Q10: 4,
      Q11: 3, Q12: 4, Q13: 3, Q14: 3, Q15: 3, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'content-writing': {
      Q1: 4, Q2: 4, Q3: 3, Q4: 5, Q5: 4, Q6: 3, Q7: 2, Q8: 4, Q9: 2, Q10: 2,
      Q11: 1, Q12: 2, Q13: 3, Q14: 4, Q15: 3, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'journalism': {
      Q1: 4, Q2: 3, Q3: 3, Q4: 4, Q5: 3, Q6: 3, Q7: 3, Q8: 3, Q9: 3, Q10: 3,
      Q11: 2, Q12: 3, Q13: 2, Q14: 4, Q15: 3, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'engineering': {
      Q1: 4, Q2: 4, Q3: 4, Q4: 4, Q5: 3, Q6: 3, Q7: 3, Q8: 3, Q9: 4, Q10: 3,
      Q11: 3, Q12: 4, Q13: 3, Q14: 3, Q15: 3, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'operations': {
      Q1: 3, Q2: 3, Q3: 3, Q4: 4, Q5: 4, Q6: 4, Q7: 3, Q8: 4, Q9: 3, Q10: 3,
      Q11: 2, Q12: 3, Q13: 3, Q14: 3, Q15: 3, Q16: 3, Q17: 3, Q18: 3, Q19: 3,
    },
    'custom': { ...NEUTRAL_ANSWERS },
  };

  // Additive deltas by seniority level (Level 1..5 → Entry..Executive)
  const SENIORITY_Q_DELTAS = {
    1: { Q10: +1, Q17: -1 }, // Entry: easier to reallocate, slightly lower transferability
    2: {},                   // Mid: neutral deltas
    3: { Q7: +1, Q9: +1, Q10: -1, Q12: +1, Q17: 0 }, // Senior: more context/tacit/trust, harder to reallocate
    4: { Q7: +1, Q9: +1, Q10: 0,  Q12: +1, Q17: 0 }, // Lead: harder to reallocate
    5: { Q7: +2, Q9: +2, Q10: 0,  Q12: +2, Q17: 0 }, // Executive: hardest to reallocate, high context/tacit/trust
  };

  // Additive reliability adjustments by seniority index (1..5 -> 0..4)
  // Entry -0.05, Mid 0.00, Senior +0.03, Lead +0.04, Exec +0.05
  const SENIORITY_R_DELTAS = [-0.05, 0.00, 0.03, 0.04, 0.05];

  // Helper: compute recommended reliability for a role + seniority (clamped 0.80..0.99)
  function recommendReliability(roleKey, seniorityLevel){
    const base = (ROLE_PRESETS[roleKey] && ROLE_PRESETS[roleKey].reliabilityBase) || 0.92;
    const idx = Math.max(0, Math.min(4, (Number(seniorityLevel) || 1) - 1));
    const adj = SENIORITY_R_DELTAS[idx] || 0;
    return clamp(base + adj, 0.80, 0.99);
  }

  function applyRoleHierarchyOverrides(preset, roleKey, seniorityLevel){
    const level = Number(seniorityLevel) || 1;

    // Avoid minutes/instant as default feedback speed
    if (preset.Q8 && preset.Q8 > 4) {
      preset.Q8 = 4;
    }

    // Software/tech: days at entry, weeks at the highest hierarchy
    if (['software', 'engineering'].includes(roleKey)) {
      preset.Q8 = level >= 5 ? 2 : 3;
    }

    // Finance execs: dial digitization to 61-80% (not 81-100%)
    if (roleKey === 'finance' && level >= 4) {
      preset.Q4 = 4;
    }

    // Senior journalists: heavy human judgment/relationships and tacit knowledge
    if (roleKey === 'journalism' && level >= 4) {
      preset.Q11 = 5; // Essential
      preset.Q9 = 5;  // Mostly tacit
    }

    // Final clamp to keep all answers within bounds
    Object.keys(preset).forEach(q => {
      preset[q] = clamp(preset[q], 1, 5);
    });

    return preset;
  }

  // Helper: build recommended Q1-Q19 answers for a role + seniority (clamped 1..5)
  function buildQuestionPreset(roleKey, seniorityLevel){
    const base = ROLE_QUESTION_PRESETS[roleKey] || ROLE_QUESTION_PRESETS.custom || NEUTRAL_ANSWERS;
    const deltas = SENIORITY_Q_DELTAS[seniorityLevel] || {};
    const preset = {};

    for (const [qid, baseVal] of Object.entries(base)) {
      const delta = deltas[qid] || 0;
      const nextVal = Number.isFinite(baseVal) ? baseVal + delta : 3;
      preset[qid] = clamp(nextVal, 1, 5);
    }

    return applyRoleHierarchyOverrides(preset, roleKey, seniorityLevel);
  }

  window.WWILMJ_PRESETS = {
    ROLE_PRESETS,
    ROLE_QUESTION_PRESETS,
    SENIORITY_Q_DELTAS,
    SENIORITY_R_DELTAS,
    NEUTRAL_ANSWERS,
    recommendReliability,
    buildQuestionPreset,
  };
})();
