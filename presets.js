// Role and seniority presets for questionnaire refinement
// These are conservative priors grounded in domain tacit/physical/relational load
// and typical corporate QA requirements.

;(function(){
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const REFINEMENT_TO_LEGACY_QUESTION = {
    ai_observability_of_work: 'Q1',
    evidence_trail_strength: 'Q2',
    review_signoff_clarity: 'Q3',
    digital_workflow_readiness: 'Q4',
    workflow_decomposability: 'Q5',
    process_standardization: 'Q6',
    exception_and_context_load: 'Q7',
    feedback_loop_speed: 'Q8',
    tacit_knowledge_load: 'Q9',
    human_signoff_requirement: 'Q11',
    external_trust_requirement: 'Q12',
    organizational_adoption_readiness: 'Q13',
    delegation_pressure: 'Q14',
    workflow_integration_readiness: 'Q16',
  };

  // Baseline neutral refinement responses used by the live runtime.
  const NEUTRAL_REFINEMENT_RESPONSES = {
    ai_observability_of_work: 3,
    evidence_trail_strength: 3,
    review_signoff_clarity: 3,
    digital_workflow_readiness: 3,
    workflow_decomposability: 3,
    process_standardization: 3,
    exception_and_context_load: 3,
    feedback_loop_speed: 3,
    tacit_knowledge_load: 3,
    human_signoff_requirement: 3,
    external_trust_requirement: 3,
    organizational_adoption_readiness: 3,
    delegation_pressure: 3,
    workflow_integration_readiness: 3,
  };

  const NEUTRAL_PROFILE = {
    function_centrality: 0.50,
    human_signoff_requirement: 0.50,
    liability_and_regulatory_burden: 0.50,
    relationship_ownership: 0.50,
    exception_and_context_load: 0.50,
    workflow_decomposability: 0.50,
    organizational_adoption_readiness: 0.50,
    ai_observability_of_work: 0.50,
    dependency_bottleneck_strength: 0.50,
    handoff_and_coordination_complexity: 0.50,
    external_trust_requirement: 0.50,
    stakeholder_alignment_burden: 0.50,
    execution_vs_judgment_mix: 0.50,
    augmentation_fit: 0.50,
    substitution_risk_modifier: 0.50,
  };

  // Baseline per-role named refinement responses for the live runtime.
  const ROLE_REFINEMENT_PRESETS = {
    'software': {
      ai_observability_of_work: 5, evidence_trail_strength: 5, review_signoff_clarity: 4, digital_workflow_readiness: 5,
      workflow_decomposability: 4, process_standardization: 4, exception_and_context_load: 2, feedback_loop_speed: 3,
      tacit_knowledge_load: 2, human_signoff_requirement: 1, external_trust_requirement: 2,
      organizational_adoption_readiness: 4, delegation_pressure: 3, workflow_integration_readiness: 4,
    },
    'admin': {
      ai_observability_of_work: 3, evidence_trail_strength: 4, review_signoff_clarity: 3, digital_workflow_readiness: 4,
      workflow_decomposability: 4, process_standardization: 4, exception_and_context_load: 2, feedback_loop_speed: 4,
      tacit_knowledge_load: 2, human_signoff_requirement: 2, external_trust_requirement: 3,
      organizational_adoption_readiness: 3, delegation_pressure: 4, workflow_integration_readiness: 3,
    },
    'data-analysis': {
      ai_observability_of_work: 5, evidence_trail_strength: 5, review_signoff_clarity: 4, digital_workflow_readiness: 5,
      workflow_decomposability: 4, process_standardization: 4, exception_and_context_load: 2, feedback_loop_speed: 4,
      tacit_knowledge_load: 2, human_signoff_requirement: 1, external_trust_requirement: 2,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 4,
    },
    'finance': {
      ai_observability_of_work: 4, evidence_trail_strength: 4, review_signoff_clarity: 4, digital_workflow_readiness: 5,
      workflow_decomposability: 4, process_standardization: 4, exception_and_context_load: 2, feedback_loop_speed: 4,
      tacit_knowledge_load: 2, human_signoff_requirement: 1, external_trust_requirement: 4,
      organizational_adoption_readiness: 3, delegation_pressure: 4, workflow_integration_readiness: 3,
    },
    'sales': {
      ai_observability_of_work: 3, evidence_trail_strength: 3, review_signoff_clarity: 2, digital_workflow_readiness: 3,
      workflow_decomposability: 3, process_standardization: 2, exception_and_context_load: 4, feedback_loop_speed: 3,
      tacit_knowledge_load: 4, human_signoff_requirement: 3, external_trust_requirement: 3,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'creative': {
      ai_observability_of_work: 4, evidence_trail_strength: 3, review_signoff_clarity: 3, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 2, exception_and_context_load: 3, feedback_loop_speed: 3,
      tacit_knowledge_load: 3, human_signoff_requirement: 2, external_trust_requirement: 2,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'legal': {
      ai_observability_of_work: 3, evidence_trail_strength: 3, review_signoff_clarity: 3, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 3, exception_and_context_load: 4, feedback_loop_speed: 2,
      tacit_knowledge_load: 4, human_signoff_requirement: 2, external_trust_requirement: 5,
      organizational_adoption_readiness: 2, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'product-management': {
      ai_observability_of_work: 3, evidence_trail_strength: 3, review_signoff_clarity: 2, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 3, exception_and_context_load: 4, feedback_loop_speed: 3,
      tacit_knowledge_load: 4, human_signoff_requirement: 2, external_trust_requirement: 3,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'consulting': {
      ai_observability_of_work: 3, evidence_trail_strength: 3, review_signoff_clarity: 2, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 2, exception_and_context_load: 4, feedback_loop_speed: 3,
      tacit_knowledge_load: 4, human_signoff_requirement: 3, external_trust_requirement: 4,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'hr': {
      ai_observability_of_work: 3, evidence_trail_strength: 3, review_signoff_clarity: 3, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 3, exception_and_context_load: 3, feedback_loop_speed: 3,
      tacit_knowledge_load: 3, human_signoff_requirement: 3, external_trust_requirement: 4,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'content-writing': {
      ai_observability_of_work: 4, evidence_trail_strength: 4, review_signoff_clarity: 3, digital_workflow_readiness: 5,
      workflow_decomposability: 4, process_standardization: 3, exception_and_context_load: 2, feedback_loop_speed: 4,
      tacit_knowledge_load: 2, human_signoff_requirement: 1, external_trust_requirement: 2,
      organizational_adoption_readiness: 3, delegation_pressure: 4, workflow_integration_readiness: 3,
    },
    'journalism': {
      ai_observability_of_work: 4, evidence_trail_strength: 3, review_signoff_clarity: 3, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 3, exception_and_context_load: 3, feedback_loop_speed: 3,
      tacit_knowledge_load: 3, human_signoff_requirement: 2, external_trust_requirement: 3,
      organizational_adoption_readiness: 2, delegation_pressure: 4, workflow_integration_readiness: 3,
    },
    'engineering': {
      ai_observability_of_work: 4, evidence_trail_strength: 4, review_signoff_clarity: 4, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 3, exception_and_context_load: 3, feedback_loop_speed: 3,
      tacit_knowledge_load: 4, human_signoff_requirement: 3, external_trust_requirement: 4,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'operations': {
      ai_observability_of_work: 3, evidence_trail_strength: 3, review_signoff_clarity: 3, digital_workflow_readiness: 4,
      workflow_decomposability: 4, process_standardization: 4, exception_and_context_load: 3, feedback_loop_speed: 4,
      tacit_knowledge_load: 3, human_signoff_requirement: 2, external_trust_requirement: 3,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    // Audit 2026-03-27: marketing and communications were missing entirely.
    'marketing': {
      ai_observability_of_work: 4, evidence_trail_strength: 3, review_signoff_clarity: 3, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 3, exception_and_context_load: 3, feedback_loop_speed: 3,
      tacit_knowledge_load: 3, human_signoff_requirement: 2, external_trust_requirement: 3,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'communications': {
      ai_observability_of_work: 4, evidence_trail_strength: 3, review_signoff_clarity: 3, digital_workflow_readiness: 4,
      workflow_decomposability: 3, process_standardization: 2, exception_and_context_load: 3, feedback_loop_speed: 3,
      tacit_knowledge_load: 3, human_signoff_requirement: 2, external_trust_requirement: 4,
      organizational_adoption_readiness: 3, delegation_pressure: 3, workflow_integration_readiness: 3,
    },
    'custom': { ...NEUTRAL_REFINEMENT_RESPONSES },
  };

  // Audit 2026-03-27: app.js normalizes role_family keys from CSVs (e.g.
  // 'data-analysis' -> 'data'). Add aliases so lookups with the normalized
  // form still resolve to the correct preset.
  ROLE_REFINEMENT_PRESETS['data'] = ROLE_REFINEMENT_PRESETS['data-analysis'];
  ROLE_REFINEMENT_PRESETS['product_management'] = ROLE_REFINEMENT_PRESETS['product-management'];
  ROLE_REFINEMENT_PRESETS['content'] = ROLE_REFINEMENT_PRESETS['content-writing'];

  // Additive deltas by seniority level (Level 1..5 → Entry..Executive)
  const SENIORITY_REFINEMENT_DELTAS = {
    1: {},                   // Entry: neutral deltas
    2: {},                   // Mid: neutral deltas
    3: { exception_and_context_load: +1, tacit_knowledge_load: +1, external_trust_requirement: +1 },
    4: { exception_and_context_load: +1, tacit_knowledge_load: +1, external_trust_requirement: +1 },
    5: { exception_and_context_load: +2, tacit_knowledge_load: +2, external_trust_requirement: +2 },
  };

  const normalizeAnswer = (raw) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return 0.5;
    return clamp((value - 1) / 4, 0, 1);
  };

  const toLegacyAnswer = (value) => clamp(Math.round((clamp(value, 0, 1) * 4) + 1), 1, 5);

  function buildQuestionnaireProfileFromResponses(responses, seniorityLevel){
    const observability = normalizeAnswer(responses.ai_observability_of_work);
    const evidenceTrail = normalizeAnswer(responses.evidence_trail_strength);
    const reviewClarity = normalizeAnswer(responses.review_signoff_clarity);
    const digitalReadiness = normalizeAnswer(responses.digital_workflow_readiness);
    const decomposability = normalizeAnswer(responses.workflow_decomposability);
    const standardization = normalizeAnswer(responses.process_standardization);
    const exceptionLoad = normalizeAnswer(responses.exception_and_context_load);
    const feedbackSpeed = normalizeAnswer(responses.feedback_loop_speed);
    const tacitLoad = normalizeAnswer(responses.tacit_knowledge_load);
    const signoffRequirement = normalizeAnswer(responses.human_signoff_requirement);
    const externalTrust = normalizeAnswer(responses.external_trust_requirement);
    const adoptionReadiness = normalizeAnswer(responses.organizational_adoption_readiness);
    const delegationPressure = normalizeAnswer(responses.delegation_pressure);
    const workflowIntegration = normalizeAnswer(responses.workflow_integration_readiness);
    const seniority = clamp(((Number(seniorityLevel) || 3) - 1) / 4, 0, 1);

    return {
      function_centrality: clamp((signoffRequirement * 0.35) + (exceptionLoad * 0.25) + (tacitLoad * 0.20) + (seniority * 0.20), 0, 1),
      human_signoff_requirement: clamp((signoffRequirement * 0.65) + (reviewClarity * 0.15) + (seniority * 0.20), 0, 1),
      liability_and_regulatory_burden: clamp((signoffRequirement * 0.30) + (externalTrust * 0.25) + (exceptionLoad * 0.20) + ((1 - decomposability) * 0.10) + (seniority * 0.15), 0, 1),
      relationship_ownership: clamp((signoffRequirement * 0.35) + (externalTrust * 0.20) + (exceptionLoad * 0.20) + (tacitLoad * 0.10) + (seniority * 0.15), 0, 1),
      exception_and_context_load: clamp((exceptionLoad * 0.45) + (tacitLoad * 0.25) + ((1 - decomposability) * 0.20) + ((1 - standardization) * 0.10), 0, 1),
      workflow_decomposability: clamp((decomposability * 0.45) + (standardization * 0.25) + (digitalReadiness * 0.15) + (workflowIntegration * 0.15), 0, 1),
      organizational_adoption_readiness: clamp((adoptionReadiness * 0.50) + (workflowIntegration * 0.35) + (delegationPressure * 0.15), 0, 1),
      ai_observability_of_work: clamp((observability * 0.35) + (evidenceTrail * 0.20) + (reviewClarity * 0.15) + (digitalReadiness * 0.20) + (feedbackSpeed * 0.10), 0, 1),
      dependency_bottleneck_strength: clamp(((1 - decomposability) * 0.30) + (exceptionLoad * 0.25) + (signoffRequirement * 0.20) + (tacitLoad * 0.10) + (seniority * 0.15), 0, 1),
      handoff_and_coordination_complexity: clamp(((1 - decomposability) * 0.25) + (exceptionLoad * 0.20) + (signoffRequirement * 0.15) + (workflowIntegration * 0.10) + (seniority * 0.30), 0, 1),
      external_trust_requirement: clamp((externalTrust * 0.60) + (signoffRequirement * 0.20) + (exceptionLoad * 0.10) + (seniority * 0.10), 0, 1),
      stakeholder_alignment_burden: clamp((signoffRequirement * 0.30) + (exceptionLoad * 0.20) + (externalTrust * 0.15) + (delegationPressure * 0.10) + (seniority * 0.25), 0, 1),
      execution_vs_judgment_mix: clamp((decomposability * 0.25) + (standardization * 0.25) + ((1 - signoffRequirement) * 0.20) + ((1 - exceptionLoad) * 0.20) + (delegationPressure * 0.10), 0, 1),
      augmentation_fit: clamp((observability * 0.25) + (signoffRequirement * 0.20) + (exceptionLoad * 0.15) + (reviewClarity * 0.10) + ((1 - adoptionReadiness) * 0.10) + (seniority * 0.20), 0, 1),
      substitution_risk_modifier: clamp((delegationPressure * 0.30) + (observability * 0.20) + (digitalReadiness * 0.15) + (decomposability * 0.20) + (standardization * 0.10) + ((1 - signoffRequirement) * 0.05), 0, 1),
    };
  }

  function buildQuestionnaireProfileFromLegacyAnswers(answers, seniorityLevel){
    return buildQuestionnaireProfileFromResponses(mapLegacyAnswersToRefinementResponses(answers), seniorityLevel);
  }

  function mapLegacyAnswersToRefinementResponses(answers){
    const mapped = { ...NEUTRAL_REFINEMENT_RESPONSES };
    Object.entries(REFINEMENT_TO_LEGACY_QUESTION).forEach(([factorId, qid]) => {
      if (answers && answers[qid] !== undefined) {
        mapped[factorId] = clamp(Number(answers[qid]) || 3, 1, 5);
      }
    });
    return mapped;
  }

  function buildLegacyAnswersFromRefinementResponses(responses){
    return Object.entries(REFINEMENT_TO_LEGACY_QUESTION).reduce((acc, [factorId, qid]) => {
      acc[qid] = clamp(Number(responses?.[factorId]) || 3, 1, 5);
      return acc;
    }, {});
  }

  function buildLegacyAnswersFromQuestionnaireProfile(profile){
    const p = { ...NEUTRAL_PROFILE, ...(profile || {}) };
    const contextAndAuthority = clamp((p.exception_and_context_load * 0.45) + (p.function_centrality * 0.30) + (p.relationship_ownership * 0.25), 0, 1);
    const signoffAndTrust = clamp((p.human_signoff_requirement * 0.45) + (p.external_trust_requirement * 0.35) + (p.liability_and_regulatory_burden * 0.20), 0, 1);

    return {
      Q1: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.55) + (p.substitution_risk_modifier * 0.45), 0, 1)),
      Q2: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.75) + (p.workflow_decomposability * 0.25), 0, 1)),
      Q3: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.55) + ((1 - p.human_signoff_requirement) * 0.45), 0, 1)),
      Q4: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.65) + (p.workflow_decomposability * 0.35), 0, 1)),
      Q5: toLegacyAnswer(p.workflow_decomposability),
      Q6: toLegacyAnswer(clamp((p.workflow_decomposability * 0.75) + ((1 - p.exception_and_context_load) * 0.25), 0, 1)),
      Q7: toLegacyAnswer(contextAndAuthority),
      Q8: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.55) + ((1 - p.human_signoff_requirement) * 0.25) + ((1 - p.dependency_bottleneck_strength) * 0.20), 0, 1)),
      Q9: toLegacyAnswer(clamp((p.exception_and_context_load * 0.50) + (p.relationship_ownership * 0.20) + (p.function_centrality * 0.30), 0, 1)),
      Q11: toLegacyAnswer(signoffAndTrust),
      Q12: toLegacyAnswer(clamp((p.external_trust_requirement * 0.60) + (p.relationship_ownership * 0.20) + (p.liability_and_regulatory_burden * 0.20), 0, 1)),
      Q13: toLegacyAnswer(p.organizational_adoption_readiness),
      Q14: toLegacyAnswer(clamp((p.organizational_adoption_readiness * 0.45) + (p.substitution_risk_modifier * 0.35) + (p.workflow_decomposability * 0.20), 0, 1)),
      Q16: toLegacyAnswer(clamp((p.organizational_adoption_readiness * 0.60) + (p.workflow_decomposability * 0.25) + (p.ai_observability_of_work * 0.15), 0, 1)),
    };
  }

  function applyRoleHierarchyOverrides(preset, roleKey, seniorityLevel){
    const level = Number(seniorityLevel) || 1;

    // Avoid minutes/instant as default feedback speed
    if (preset.feedback_loop_speed && preset.feedback_loop_speed > 4) {
      preset.feedback_loop_speed = 4;
    }

    // Software/tech: days at entry, weeks at the highest hierarchy
    if (['software', 'engineering'].includes(roleKey)) {
      preset.feedback_loop_speed = level >= 5 ? 2 : 3;
    }

    // Finance execs: dial digitization to 61-80% (not 81-100%)
    if (roleKey === 'finance' && level >= 4) {
      preset.digital_workflow_readiness = 4;
    }

    // Senior journalists: heavy human judgment/relationships and tacit knowledge
    if (roleKey === 'journalism' && level >= 4) {
      preset.human_signoff_requirement = 5;
      preset.tacit_knowledge_load = 5;
    }

    // Consulting/strategy execs: moderate physical presence
    if (roleKey === 'consulting' && level >= 4) {
      preset.external_trust_requirement = 3;
    }

    // Final clamp to keep all answers within bounds
    Object.keys(preset).forEach(q => {
      preset[q] = clamp(preset[q], 1, 5);
    });

    return preset;
  }

  // Helper: build recommended answers for a role + seniority (clamped 1..5)
  function buildRefinementPreset(roleKey, seniorityLevel){
    const base = ROLE_REFINEMENT_PRESETS[roleKey] || ROLE_REFINEMENT_PRESETS.custom || NEUTRAL_REFINEMENT_RESPONSES;
    const deltas = SENIORITY_REFINEMENT_DELTAS[seniorityLevel] || {};
    const preset = {};

    for (const [factorId, baseVal] of Object.entries(base)) {
      const delta = deltas[factorId] || 0;
      const nextVal = Number.isFinite(baseVal) ? baseVal + delta : 3;
      preset[factorId] = clamp(nextVal, 1, 5);
    }

    return applyRoleHierarchyOverrides(preset, roleKey, seniorityLevel);
  }

  const ROLE_FACTOR_PRESETS = Object.keys(ROLE_REFINEMENT_PRESETS).reduce((acc, roleKey) => {
    acc[roleKey] = buildQuestionnaireProfileFromResponses(ROLE_REFINEMENT_PRESETS[roleKey], 3);
    return acc;
  }, {});

  function buildQuestionnaireProfilePreset(roleKey, seniorityLevel){
    const refinementPreset = buildRefinementPreset(roleKey, seniorityLevel);
    return buildQuestionnaireProfileFromResponses(refinementPreset, seniorityLevel);
  }

  const ROLE_QUESTION_PRESETS = Object.keys(ROLE_REFINEMENT_PRESETS).reduce((acc, roleKey) => {
    acc[roleKey] = buildLegacyAnswersFromRefinementResponses(ROLE_REFINEMENT_PRESETS[roleKey]);
    return acc;
  }, {});

  const NEUTRAL_ANSWERS = buildLegacyAnswersFromRefinementResponses(NEUTRAL_REFINEMENT_RESPONSES);

  const SENIORITY_Q_DELTAS = Object.keys(SENIORITY_REFINEMENT_DELTAS).reduce((acc, key) => {
    const entry = {};
    Object.entries(SENIORITY_REFINEMENT_DELTAS[key]).forEach(([factorId, delta]) => {
      const qid = REFINEMENT_TO_LEGACY_QUESTION[factorId];
      if (qid) {
        entry[qid] = delta;
      }
    });
    acc[key] = entry;
    return acc;
  }, {});

  window.WWILMJ_PRESETS = {
    ROLE_REFINEMENT_PRESETS,
    ROLE_QUESTION_PRESETS,
    ROLE_FACTOR_PRESETS,
    REFINEMENT_TO_LEGACY_QUESTION,
    SENIORITY_REFINEMENT_DELTAS,
    SENIORITY_Q_DELTAS,
    NEUTRAL_REFINEMENT_RESPONSES,
    NEUTRAL_ANSWERS,
    NEUTRAL_PROFILE,
    buildRefinementPreset,
    buildQuestionPreset: buildRefinementPreset,
    buildQuestionnaireProfilePreset,
    buildQuestionnaireProfileFromResponses,
    buildQuestionnaireProfileFromLegacyAnswers,
    buildLegacyAnswersFromRefinementResponses,
    buildLegacyAnswersFromQuestionnaireProfile,
  };
})();
