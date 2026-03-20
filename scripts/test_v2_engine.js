const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

function assertBounded(name, value) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a bounded number in [0, 1], received ${value}`);
  }
}

async function main() {
  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const result = engine.computeResult({
    roleCategory: 'software',
    questionnaireProfile: {
      function_centrality: 0.54,
      human_signoff_requirement: 0.33,
      liability_and_regulatory_burden: 0.36,
      relationship_ownership: 0.29,
      exception_and_context_load: 0.36,
      workflow_decomposability: 0.72,
      organizational_adoption_readiness: 0.72,
      ai_observability_of_work: 0.83,
      dependency_bottleneck_strength: 0.43,
      handoff_and_coordination_complexity: 0.49,
      external_trust_requirement: 0.14,
      stakeholder_alignment_burden: 0.44,
      execution_vs_judgment_mix: 0.59,
      augmentation_fit: 0.54,
      substitution_risk_modifier: 0.68
    },
    seniorityLevel: 3,
    dominantTaskClusters: ['cluster_drafting', 'cluster_qa_review'],
    roleCriticalClusters: ['cluster_oversight_strategy']
  });

  const taskInventory = engine.getTaskInventory(result.selected_occupation_id, 6);
  if (!taskInventory.length) {
    throw new Error('Expected getTaskInventory to return seeded role tasks for the selected occupation.');
  }

  const roleComposition = engine.getRoleComposition(result.selected_occupation_id);
  if (!roleComposition) {
    throw new Error('Expected getRoleComposition to return editable role composition data.');
  }
  if (!Array.isArray(roleComposition.onet_tasks) || !Array.isArray(roleComposition.functions)) {
    throw new Error('Expected getRoleComposition to expose task buckets and functions.');
  }
  if (!roleComposition.defaults?.task_ids?.length) {
    throw new Error('Expected default selected task ids in role composition.');
  }
  if (!roleComposition.defaults?.function_ids?.length) {
    throw new Error('Expected default selected function ids in role composition.');
  }
  if (!roleComposition.defaults?.function_ids?.includes('fn_occ_15_1252_00_system_reliability')) {
    throw new Error('Expected Software Developers defaults to include the reviewed system-reliability function anchor.');
  }
  if (!Array.isArray(roleComposition.functions) || roleComposition.functions.length < 2) {
    throw new Error('Expected Software Developers to expose at least two reviewed function anchors after structural expansion.');
  }
  const graphicDesignerComposition = engine.getRoleComposition('occ_27_1024_00');
  if (!graphicDesignerComposition.defaults?.function_ids?.includes('fn_occ_27_1024_00_production_execution')) {
    throw new Error('Expected Graphic Designers defaults to include the reviewed production-execution function anchor.');
  }
  if (!Array.isArray(graphicDesignerComposition.functions) || graphicDesignerComposition.functions.length < 2) {
    throw new Error('Expected Graphic Designers to expose at least two reviewed function anchors after structural expansion.');
  }
  const paralegalComposition = engine.getRoleComposition('occ_23_2011_00');
  if (!paralegalComposition.defaults?.function_ids?.includes('fn_occ_23_2011_00_procedural_execution')) {
    throw new Error('Expected Paralegals defaults to include the reviewed procedural-execution function anchor.');
  }
  if (!Array.isArray(paralegalComposition.functions) || paralegalComposition.functions.length < 3) {
    throw new Error('Expected Paralegals to expose at least three reviewed function anchors after structural expansion.');
  }
  const complianceOfficerComposition = engine.getRoleComposition('occ_13_1041_00');
  if (!complianceOfficerComposition.defaults?.function_ids?.includes('fn_occ_13_1041_00_issue_remediation')) {
    throw new Error('Expected Compliance Officers defaults to include the reviewed issue-remediation function anchor.');
  }
  if (!Array.isArray(complianceOfficerComposition.functions) || complianceOfficerComposition.functions.length < 3) {
    throw new Error('Expected Compliance Officers to expose at least three reviewed function anchors after structural expansion.');
  }
  const trainingDevelopmentComposition = engine.getRoleComposition('occ_13_1151_00');
  if (!trainingDevelopmentComposition.defaults?.function_ids?.includes('fn_occ_13_1151_00_learning_content_enablement')) {
    throw new Error('Expected Training and Development Specialists defaults to include the reviewed learning-content-enablement function anchor.');
  }
  if (!Array.isArray(trainingDevelopmentComposition.functions) || trainingDevelopmentComposition.functions.length < 2) {
    throw new Error('Expected Training and Development Specialists to expose at least two reviewed function anchors after structural expansion.');
  }
  const mechanicalEngineerComposition = engine.getRoleComposition('occ_17_2141_00');
  if (!mechanicalEngineerComposition.defaults?.function_ids?.includes('fn_occ_17_2141_00_validation_integration')) {
    throw new Error('Expected Mechanical Engineers defaults to include the reviewed validation-integration function anchor.');
  }
  if (!Array.isArray(mechanicalEngineerComposition.functions) || mechanicalEngineerComposition.functions.length < 2) {
    throw new Error('Expected Mechanical Engineers to expose at least two reviewed function anchors after structural expansion.');
  }
  const businessOpsComposition = engine.getRoleComposition('occ_13_1199_00');
  if (!businessOpsComposition.defaults?.function_ids?.includes('fn_occ_13_1199_00_operational_followthrough')) {
    throw new Error('Expected Business Operations Specialists defaults to include the reviewed operational-followthrough function anchor.');
  }
  if (!Array.isArray(businessOpsComposition.functions) || businessOpsComposition.functions.length < 2) {
    throw new Error('Expected Business Operations Specialists to expose at least two reviewed function anchors after structural expansion.');
  }
  const systemsAnalystComposition = engine.getRoleComposition('occ_15_1211_00');
  if (!systemsAnalystComposition.defaults?.function_ids?.includes('fn_occ_15_1211_00_implementation_enablement')) {
    throw new Error('Expected Computer Systems Analysts defaults to include the reviewed implementation-enablement function anchor.');
  }
  if (!Array.isArray(systemsAnalystComposition.functions) || systemsAnalystComposition.functions.length < 3) {
    throw new Error('Expected Computer Systems Analysts to expose at least three reviewed function anchors after structural expansion.');
  }
  const executiveAssistantComposition = engine.getRoleComposition('occ_43_6011_00');
  if (!executiveAssistantComposition.defaults?.function_ids?.includes('fn_occ_43_6011_00_executive_coordination')) {
    throw new Error('Expected Executive Secretaries defaults to include the reviewed executive-coordination function anchor.');
  }
  if (!Array.isArray(executiveAssistantComposition.functions) || executiveAssistantComposition.functions.length < 2) {
    throw new Error('Expected Executive Secretaries to expose at least two reviewed function anchors after structural expansion.');
  }
  const hrSpecialistComposition = engine.getRoleComposition('occ_13_1071_00');
  if (!hrSpecialistComposition.defaults?.function_ids?.includes('fn_occ_13_1071_00_people_process_admin')) {
    throw new Error('Expected Human Resources Specialists defaults to include the reviewed people-process-admin function anchor.');
  }
  if (!Array.isArray(hrSpecialistComposition.functions) || hrSpecialistComposition.functions.length < 3) {
    throw new Error('Expected Human Resources Specialists to expose at least three reviewed function anchors after structural expansion.');
  }
  const bookkeepingComposition = engine.getRoleComposition('occ_43_3031_00');
  if (!bookkeepingComposition.defaults?.function_ids?.includes('fn_occ_43_3031_00_transaction_processing')) {
    throw new Error('Expected Bookkeeping Clerks defaults to include the reviewed transaction-processing function anchor.');
  }
  if (!Array.isArray(bookkeepingComposition.functions) || bookkeepingComposition.functions.length < 2) {
    throw new Error('Expected Bookkeeping Clerks to expose at least two reviewed function anchors after structural expansion.');
  }
  const customerServiceComposition = engine.getRoleComposition('occ_43_4051_00');
  if (!customerServiceComposition.defaults?.function_ids?.includes('fn_occ_43_4051_00_case_queue_execution')) {
    throw new Error('Expected Customer Service Representatives defaults to include the reviewed case-queue-execution function anchor.');
  }
  if (!Array.isArray(customerServiceComposition.functions) || customerServiceComposition.functions.length < 2) {
    throw new Error('Expected Customer Service Representatives to expose at least two reviewed function anchors after structural expansion.');
  }
  const statisticalAssistantComposition = engine.getRoleComposition('occ_43_9111_00');
  if (!statisticalAssistantComposition.defaults?.function_ids?.includes('fn_occ_43_9111_00_data_preparation_execution')) {
    throw new Error('Expected Statistical Assistants defaults to include the reviewed data-preparation-execution function anchor.');
  }
  if (!Array.isArray(statisticalAssistantComposition.functions) || statisticalAssistantComposition.functions.length < 2) {
    throw new Error('Expected Statistical Assistants to expose at least two reviewed function anchors after structural expansion.');
  }
  const serviceSalesComposition = engine.getRoleComposition('occ_41_3091_00');
  if (!serviceSalesComposition.defaults?.function_ids?.includes('fn_occ_41_3091_00_deal_orchestration')) {
    throw new Error('Expected Sales Representatives of Services defaults to include the reviewed deal-orchestration function anchor.');
  }
  if (!Array.isArray(serviceSalesComposition.functions) || serviceSalesComposition.functions.length < 3) {
    throw new Error('Expected Sales Representatives of Services to expose at least three reviewed function anchors after structural expansion.');
  }
  const secretaryComposition = engine.getRoleComposition('occ_43_6014_00');
  if (!secretaryComposition.defaults?.function_ids?.includes('fn_occ_43_6014_00_admin_coordination')) {
    throw new Error('Expected Secretaries and Administrative Assistants defaults to include the reviewed admin-coordination function anchor.');
  }
  if (!Array.isArray(secretaryComposition.functions) || secretaryComposition.functions.length < 2) {
    throw new Error('Expected Secretaries and Administrative Assistants to expose at least two reviewed function anchors after structural expansion.');
  }
  const sampleLinkedTask = roleComposition.onet_tasks.find((task) => Array.isArray(task.linked_functions) && task.linked_functions.length);
  if (!sampleLinkedTask) {
    throw new Error('Expected at least one editable task to expose linked function explanations.');
  }
  if (String(sampleLinkedTask.task_family_label || '').toLowerCase().includes('cluster')) {
    throw new Error('Expected editable task rows to expose plain-English task family labels.');
  }
  if (roleComposition.variant_support?.enabled) {
    throw new Error('Did not expect Software Developers to expose reviewed role variants in the baseline engine scenario.');
  }

  const managementAnalystExecutionProfile = {
    function_centrality: 0.46,
    human_signoff_requirement: 0.38,
    liability_and_regulatory_burden: 0.34,
    relationship_ownership: 0.29,
    exception_and_context_load: 0.34,
    workflow_decomposability: 0.82,
    organizational_adoption_readiness: 0.71,
    ai_observability_of_work: 0.79,
    dependency_bottleneck_strength: 0.35,
    handoff_and_coordination_complexity: 0.41,
    external_trust_requirement: 0.24,
    stakeholder_alignment_burden: 0.46,
    execution_vs_judgment_mix: 0.78,
    augmentation_fit: 0.59,
    substitution_risk_modifier: 0.66
  };
  const managementAnalystAdvisoryProfile = {
    function_centrality: 0.82,
    human_signoff_requirement: 0.76,
    liability_and_regulatory_burden: 0.64,
    relationship_ownership: 0.58,
    exception_and_context_load: 0.63,
    workflow_decomposability: 0.38,
    organizational_adoption_readiness: 0.52,
    ai_observability_of_work: 0.51,
    dependency_bottleneck_strength: 0.68,
    handoff_and_coordination_complexity: 0.74,
    external_trust_requirement: 0.52,
    stakeholder_alignment_burden: 0.86,
    execution_vs_judgment_mix: 0.24,
    augmentation_fit: 0.66,
    substitution_risk_modifier: 0.33
  };
  const managementAnalystVariantsExecution = engine.getRoleComposition('occ_13_1111_00', {
    questionnaireProfile: managementAnalystExecutionProfile
  });
  const managementAnalystVariantsAdvisory = engine.getRoleComposition('occ_13_1111_00', {
    questionnaireProfile: managementAnalystAdvisoryProfile
  });
  if (!managementAnalystVariantsExecution.variant_support?.enabled || !managementAnalystVariantsExecution.variants?.length) {
    throw new Error('Expected Management Analysts to expose reviewed role variants.');
  }
  if (managementAnalystVariantsExecution.variant_support.selected_variant_id !== 'diagnostic_analyst') {
    throw new Error(`Expected execution-heavy management-analyst profile to recommend diagnostic_analyst, received ${managementAnalystVariantsExecution.variant_support.selected_variant_id}.`);
  }
  if (managementAnalystVariantsAdvisory.variant_support.selected_variant_id !== 'change_enablement_advisor') {
    throw new Error(`Expected advisory-heavy management-analyst profile to recommend change_enablement_advisor, received ${managementAnalystVariantsAdvisory.variant_support.selected_variant_id}.`);
  }
  const manualVariantComposition = engine.getRoleComposition('occ_13_1111_00', {
    questionnaireProfile: managementAnalystExecutionProfile,
    roleVariantId: 'change_enablement_advisor'
  });
  if (manualVariantComposition.variant_support.selection_mode !== 'manual') {
    throw new Error('Expected explicit roleVariantId to force manual variant selection mode.');
  }
  if (!manualVariantComposition.defaults?.function_ids?.includes('fn_occ_13_1111_00_change_enablement')) {
    throw new Error('Expected change_enablement_advisor defaults to include the reviewed change-enablement function anchor.');
  }
  if (!manualVariantComposition.defaults?.task_ids?.includes('task_occ_13_1111_00_jd_ma_03')) {
    throw new Error('Expected manual change_enablement_advisor variant defaults to include change-enablement tasks.');
  }
  if (!manualVariantComposition.defaults?.task_ids?.includes('task_occ_13_1111_00_7283')) {
    throw new Error('Expected manual change_enablement_advisor variant defaults to include the reviewed training-and-rollout task 7283.');
  }
  const manualMarketingOpsComposition = engine.getRoleComposition('occ_13_1161_00', {
    roleVariantId: 'marketing_ops_analyst'
  });
  if (!manualMarketingOpsComposition.defaults?.function_ids?.includes('fn_occ_13_1161_00_marketing_ops')) {
    throw new Error('Expected marketing_ops_analyst defaults to include the reviewed marketing-operations function anchor.');
  }
  if (manualMarketingOpsComposition.variant_support?.selection_mode !== 'manual') {
    throw new Error('Expected explicit marketing_ops_analyst selection to force manual variant mode.');
  }
  const manualAnchorProducerComposition = engine.getRoleComposition('occ_27_3023_00', {
    roleVariantId: 'anchor_producer'
  });
  if (!manualAnchorProducerComposition.defaults?.function_ids?.includes('fn_occ_27_3023_00_broadcast_orchestration')) {
    throw new Error('Expected anchor_producer defaults to include the reviewed broadcast-orchestration function anchor.');
  }
  const manualReleaseEnablementComposition = engine.getRoleComposition('occ_27_3042_00', {
    roleVariantId: 'release_enablement_writer'
  });
  if (!manualReleaseEnablementComposition.defaults?.function_ids?.includes('fn_occ_27_3042_00_release_enablement')) {
    throw new Error('Expected release_enablement_writer defaults to include the reviewed release-enablement function anchor.');
  }
  if (!manualReleaseEnablementComposition.defaults?.task_ids?.includes('task_occ_27_3042_00_manual_tw_02')) {
    throw new Error('Expected release_enablement_writer defaults to include the reviewed release-planning task manual_tw_02.');
  }
  const manualManagingEditorComposition = engine.getRoleComposition('occ_27_3041_00', {
    roleVariantId: 'managing_editor'
  });
  if (!manualManagingEditorComposition.defaults?.function_ids?.includes('fn_occ_27_3041_00_publication_orchestration')) {
    throw new Error('Expected managing_editor defaults to include the reviewed publication-orchestration function anchor.');
  }
  if (!manualManagingEditorComposition.defaults?.task_ids?.includes('task_occ_27_3041_00_jd_ed_03')) {
    throw new Error('Expected managing_editor defaults to include the reviewed editorial-calendar task jd_ed_03.');
  }
  const financialAnalystComposition = engine.getRoleComposition('occ_13_2051_00');
  if (!financialAnalystComposition.defaults?.function_ids?.includes('fn_occ_13_2051_00_stakeholder_translation')) {
    throw new Error('Expected Financial and Investment Analysts defaults to include the reviewed stakeholder-translation function anchor.');
  }
  if (!Array.isArray(financialAnalystComposition.functions) || financialAnalystComposition.functions.length < 2) {
    throw new Error('Expected Financial and Investment Analysts to expose at least two reviewed function anchors.');
  }
  const operationsResearchComposition = engine.getRoleComposition('occ_15_2031_00');
  if (!operationsResearchComposition.defaults?.function_ids?.includes('fn_occ_15_2031_00_decision_translation')) {
    throw new Error('Expected Operations Research Analysts defaults to include the reviewed decision-translation function anchor.');
  }
  if (!Array.isArray(operationsResearchComposition.functions) || operationsResearchComposition.functions.length < 2) {
    throw new Error('Expected Operations Research Analysts to expose at least two reviewed function anchors.');
  }
  const accountantReportingProfile = {
    function_centrality: 0.48,
    human_signoff_requirement: 0.34,
    liability_and_regulatory_burden: 0.42,
    relationship_ownership: 0.18,
    exception_and_context_load: 0.36,
    workflow_decomposability: 0.82,
    organizational_adoption_readiness: 0.74,
    ai_observability_of_work: 0.84,
    dependency_bottleneck_strength: 0.39,
    handoff_and_coordination_complexity: 0.42,
    external_trust_requirement: 0.24,
    stakeholder_alignment_burden: 0.52,
    execution_vs_judgment_mix: 0.78,
    augmentation_fit: 0.63,
    substitution_risk_modifier: 0.67
  };
  const accountantAuditProfile = {
    function_centrality: 0.66,
    human_signoff_requirement: 0.58,
    liability_and_regulatory_burden: 0.82,
    relationship_ownership: 0.20,
    exception_and_context_load: 0.56,
    workflow_decomposability: 0.48,
    organizational_adoption_readiness: 0.55,
    ai_observability_of_work: 0.58,
    dependency_bottleneck_strength: 0.52,
    handoff_and_coordination_complexity: 0.50,
    external_trust_requirement: 0.46,
    stakeholder_alignment_burden: 0.44,
    execution_vs_judgment_mix: 0.52,
    augmentation_fit: 0.61,
    substitution_risk_modifier: 0.44
  };
  const accountantVariantsReporting = engine.getRoleComposition('occ_13_2011_00', {
    questionnaireProfile: accountantReportingProfile
  });
  const accountantVariantsAudit = engine.getRoleComposition('occ_13_2011_00', {
    questionnaireProfile: accountantAuditProfile
  });
  if (!accountantVariantsReporting.variant_support?.enabled || !accountantVariantsReporting.variants?.length) {
    throw new Error('Expected Accountants and Auditors to expose reviewed role variants.');
  }
  if (accountantVariantsReporting.variant_support.selected_variant_id !== 'financial_reporting_accountant') {
    throw new Error(`Expected reporting-heavy accountant profile to recommend financial_reporting_accountant, received ${accountantVariantsReporting.variant_support.selected_variant_id}.`);
  }
  if (accountantVariantsAudit.variant_support.selected_variant_id !== 'audit_controls_specialist') {
    throw new Error(`Expected audit-heavy accountant profile to recommend audit_controls_specialist, received ${accountantVariantsAudit.variant_support.selected_variant_id}.`);
  }
  const manualAuditAccountantComposition = engine.getRoleComposition('occ_13_2011_00', {
    roleVariantId: 'audit_controls_specialist'
  });
  if (!manualAuditAccountantComposition.defaults?.function_ids?.includes('fn_occ_13_2011_00_audit_assurance')) {
    throw new Error('Expected audit_controls_specialist defaults to include the reviewed audit-assurance function anchor.');
  }
  if (!manualAuditAccountantComposition.defaults?.task_ids?.includes('task_occ_13_2011_00_jd_acc_03')) {
    throw new Error('Expected audit_controls_specialist defaults to include the reviewed audit-support task jd_acc_03.');
  }

  if (!result.recomposition_summary) {
    throw new Error('Expected recomposition_summary in result payload.');
  }

  if (result.questionnaire_profile_source !== 'native_profile') {
    throw new Error(`Expected native questionnaire profile path, received ${result.questionnaire_profile_source}.`);
  }
  if (!result.questionnaire_profile) {
    throw new Error('Expected questionnaire_profile in result payload.');
  }
  ['function_centrality', 'human_signoff_requirement', 'organizational_adoption_readiness', 'augmentation_fit', 'substitution_risk_modifier'].forEach((key) => {
    assertBounded(`questionnaire_profile.${key}`, result.questionnaire_profile[key]);
  });

  assertBounded('recomposition_summary.workflow_compression', result.recomposition_summary.workflow_compression);
  assertBounded('recomposition_summary.organizational_conversion', result.recomposition_summary.organizational_conversion);
  assertBounded('recomposition_summary.substitution_potential', result.recomposition_summary.substitution_potential);
  assertBounded('recomposition_summary.substitution_gap', result.recomposition_summary.substitution_gap);
  assertBounded('recomposition_summary.confidence_score', result.recomposition_summary.confidence_score);
  assertBounded('recomposition_summary.dependency_penalty', result.recomposition_summary.dependency_penalty);

  ['workflow_compression_band', 'organizational_conversion_band', 'substitution_potential_band', 'substitution_gap_band'].forEach((key) => {
    if (!result.recomposition_summary[key]) {
      throw new Error(`Expected ${key} in recomposition_summary.`);
    }
    assertBounded(`${key}.low`, result.recomposition_summary[key].low);
    assertBounded(`${key}.high`, result.recomposition_summary[key].high);
    if (result.recomposition_summary[key].low > result.recomposition_summary[key].high) {
      throw new Error(`${key}.low cannot exceed ${key}.high.`);
    }
  });

  if (result.recomposition_summary.substitution_potential > result.recomposition_summary.workflow_compression) {
    throw new Error('substitution_potential cannot exceed workflow_compression.');
  }

  if (!result.evidence_summary?.friction_dimensions) {
    throw new Error('Expected friction_dimensions in evidence_summary.');
  }

  ['exception_burden', 'accountability_load', 'judgment_requirement', 'document_intensity', 'tacit_context_dependence'].forEach((key) => {
    assertBounded(`evidence_summary.friction_dimensions.${key}`, result.evidence_summary.friction_dimensions[key]);
  });

  if (!result.wave_trajectory) {
    throw new Error('Expected wave_trajectory in result payload.');
  }
  ['current', 'next', 'distant'].forEach((wave) => {
    if (!result.wave_trajectory[wave]) {
      throw new Error(`Expected wave_trajectory.${wave} in result payload.`);
    }
    assertBounded(`wave_trajectory.${wave}.retained_share`, result.wave_trajectory[wave].retained_share);
    assertBounded(`wave_trajectory.${wave}.coherence`, result.wave_trajectory[wave].coherence);
  });

  if (!result.primary_displacement_wave) {
    throw new Error('Expected primary_displacement_wave in result payload.');
  }

  if (!result.task_breakdown?.tasks?.length) {
    throw new Error('Expected populated task_breakdown.tasks in result payload.');
  }

  result.task_breakdown.tasks.slice(0, 10).forEach((task, index) => {
    assertBounded(`task_breakdown.tasks[${index}].automation_difficulty`, task.automation_difficulty);
    assertBounded(`task_breakdown.tasks[${index}].automation_difficulty_baseline`, task.automation_difficulty_baseline);
    assertBounded(`task_breakdown.tasks[${index}].automation_difficulty_task_first_weight`, task.automation_difficulty_task_first_weight);
    assertBounded(`task_breakdown.tasks[${index}].automation_difficulty_evidence_weight`, task.automation_difficulty_evidence_weight);
    if (!['cluster_priors', 'task_first_cluster_evidence', 'task_first_resolved_evidence'].includes(task.automation_difficulty_baseline_source)) {
      throw new Error(`Expected task_breakdown.tasks[${index}].automation_difficulty_baseline_source to expose the live baseline path.`);
    }
    assertBounded(`task_breakdown.tasks[${index}].direct_exposure_pressure`, task.direct_exposure_pressure);
    assertBounded(`task_breakdown.tasks[${index}].direct_pressure_baseline`, task.direct_pressure_baseline);
    assertBounded(`task_breakdown.tasks[${index}].indirect_dependency_pressure`, task.indirect_dependency_pressure);
    assertBounded(`task_breakdown.tasks[${index}].retained_leverage`, task.retained_leverage);
    assertBounded(`task_breakdown.tasks[${index}].direct_pressure_evidence_weight`, task.direct_pressure_evidence_weight);
    if (task.direct_pressure_evidence_signal !== null) {
      assertBounded(`task_breakdown.tasks[${index}].direct_pressure_evidence_signal`, task.direct_pressure_evidence_signal);
    }
  });

  const evidenceAdjustedTasks = result.task_breakdown.tasks.filter((task) => Number(task.direct_pressure_evidence_weight) > 0);
  if (!evidenceAdjustedTasks.length) {
    throw new Error('Expected at least one task to receive direct task-evidence pressure blending.');
  }
  evidenceAdjustedTasks.forEach((task, index) => {
    if (task.direct_pressure_source !== 'resolved_task_evidence') {
      throw new Error(`Expected evidence-adjusted task ${index} to be labeled as resolved_task_evidence.`);
    }
  });
  const materiallyShiftedTask = evidenceAdjustedTasks.find((task) => {
    return Math.abs(Number(task.direct_exposure_pressure) - Number(task.direct_pressure_baseline)) >= 0.01;
  });
  if (!materiallyShiftedTask) {
    throw new Error('Expected direct task evidence blending to materially shift at least one task direct pressure.');
  }
  const automationAdjustedTasks = result.task_breakdown.tasks.filter((task) => Number(task.automation_difficulty_evidence_weight) > 0);
  if (!automationAdjustedTasks.length) {
    throw new Error('Expected at least one task to receive direct task-evidence difficulty blending.');
  }
  automationAdjustedTasks.forEach((task, index) => {
    if (!['resolved_task_evidence', 'task_first_resolved_evidence'].includes(task.automation_difficulty_source)) {
      throw new Error(`Expected automation-adjusted task ${index} to be labeled as a task-evidence-driven source.`);
    }
  });
  const materiallyShiftedDifficultyTask = automationAdjustedTasks.find((task) => {
    return Math.abs(Number(task.automation_difficulty) - Number(task.automation_difficulty_baseline)) >= 0.01;
  });
  if (!materiallyShiftedDifficultyTask) {
    throw new Error('Expected direct task evidence blending to materially shift at least one task automation difficulty.');
  }
  const benchmarkResolvedTask = result.task_breakdown.tasks.find((task) => {
    return task.resolved_evidence_source_role === 'benchmark_task_label' &&
      Number(task.automation_difficulty_evidence_weight) > 0;
  });
  if (!benchmarkResolvedTask) {
    throw new Error('Expected benchmark task labels to participate in the task-evidence resolver for at least one active task.');
  }
  if (result.task_breakdown.tasks.some((task) =>
    task.resolved_evidence_source_role === 'benchmark_task_label' &&
    task.automation_difficulty_baseline_source === 'task_first_resolved_evidence')) {
    throw new Error('Expected benchmark task labels to remain below the stricter task-first task-baseline gate in the software-developer scenario.');
  }
  if ((result.diagnostics.task_first_task_count || 0) < 1) {
    throw new Error('Expected diagnostics.task_first_task_count to report at least one task-first task baseline.');
  }
  if ((result.evidence_summary?.source_coverage?.task_first_task_rows || 0) < 1) {
    throw new Error('Expected source_coverage.task_first_task_rows to report task-first task baseline usage.');
  }
  if (!result.task_breakdown.tasks.some((task) => task.automation_difficulty_baseline_source === 'task_first_resolved_evidence')) {
    throw new Error('Expected at least one task row to use task_first_resolved_evidence as its baseline source.');
  }

  assertBounded('diagnostics.direct_exposure_pressure', result.diagnostics.direct_exposure_pressure);
  assertBounded('diagnostics.indirect_dependency_pressure', result.diagnostics.indirect_dependency_pressure);
  assertBounded('diagnostics.residual_role_integrity', result.diagnostics.residual_role_integrity);
  assertBounded('diagnostics.demand_expansion_modifier', result.diagnostics.demand_expansion_modifier);
  assertBounded('diagnostics.effective_adoption_pressure', result.diagnostics.effective_adoption_pressure);
  assertBounded('diagnostics.timing_confidence', result.diagnostics.timing_confidence);
  assertBounded('diagnostics.thin_evidence_guardrail_severity', result.diagnostics.thin_evidence_guardrail_severity);
  assertBounded('result.primary_displacement_wave_confidence', result.primary_displacement_wave_confidence);
  ['demand_expansion_context', 'labor_demand_context', 'labor_tightness_context', 'ai_adoption_context', 'adoption_realization_context'].forEach((key) => {
    assertBounded(`diagnostics.${key}`, result.diagnostics[key]);
  });
  ['workflow_compression_context', 'organizational_conversion_context', 'wave_acceleration_context', 'displacement_wave_bias'].forEach((key) => {
    assertBounded(`diagnostics.${key}`, result.diagnostics[key]);
  });
  ['accountability_context', 'bargaining_power_context', 'fragmentation_context', 'accountability_context_confidence', 'bargaining_context_confidence', 'fragmentation_context_confidence'].forEach((key) => {
    assertBounded(`diagnostics.${key}`, result.diagnostics[key]);
  });
  if ((result.diagnostics.task_evidence_adjusted_tasks || 0) < 1) {
    throw new Error('Expected diagnostics.task_evidence_adjusted_tasks to report at least one adjusted task.');
  }
  if (!result.labor_market_context) {
    throw new Error('Expected labor_market_context in result payload.');
  }
  ['demand_expansion_context', 'labor_demand_context', 'labor_tightness_context', 'ai_adoption_context', 'adoption_realization_context', 'context_confidence', 'btos_covered_sector_share'].forEach((key) => {
    assertBounded(`labor_market_context.${key}`, result.labor_market_context[key]);
  });
  ['workflow_compression_context', 'organizational_conversion_context', 'wave_acceleration_context', 'displacement_wave_bias', 'recomposition_context_confidence'].forEach((key) => {
    assertBounded(`labor_market_context.${key}`, result.labor_market_context[key]);
  });
  if (Math.abs(Number(result.diagnostics.demand_expansion_modifier) - Number(result.labor_market_context.demand_expansion_context)) > 0.001) {
    throw new Error('Expected demand_expansion_modifier to follow the derived runtime demand context when available.');
  }
  if (!result.evidence_summary?.thin_evidence_guardrail) {
    throw new Error('Expected evidence_summary.thin_evidence_guardrail in result payload.');
  }
  ['severity', 'direct_coverage_ratio', 'high_specificity_evidence_share', 'task_first_task_share', 'fallback_share', 'mean_direct_reliability'].forEach((key) => {
    assertBounded(`evidence_summary.thin_evidence_guardrail.${key}`, result.evidence_summary.thin_evidence_guardrail[key]);
  });

  if (!result.role_fate_label) {
    throw new Error('Expected role_fate_label in result payload.');
  }
  ['accountability_context', 'bargaining_power_context', 'fragmentation_context', 'accountability_context_confidence', 'bargaining_context_confidence', 'fragmentation_context_confidence'].forEach((key) => {
    assertBounded(`function_metrics.${key}`, result.function_metrics[key]);
  });

  if (!result.transformation_map?.current_bundle?.length) {
    throw new Error('Expected transformation_map.current_bundle in result payload.');
  }
  const sampleCluster = result.transformation_map.current_bundle[0];
  [
    'share_of_role',
    'automation_difficulty',
    'absorption_rate',
    'direct_exposure_pressure',
    'indirect_dependency_pressure',
    'retained_leverage',
    'exposed_share',
    'retained_share'
  ].forEach((key) => {
    assertBounded(`transformation_map.current_bundle[0].${key}`, sampleCluster[key]);
  });
  if (sampleCluster.summary_source !== 'task_aggregated') {
    throw new Error('Expected transformation_map cluster summaries to be task_aggregated.');
  }
  if (!['cluster_priors', 'task_first_cluster_evidence'].includes(sampleCluster.baseline_difficulty_source)) {
    throw new Error('Expected transformation_map cluster summaries to expose the baseline difficulty source.');
  }
  assertBounded('transformation_map.current_bundle[0].task_first_weight', sampleCluster.task_first_weight);
  if (typeof sampleCluster.task_first_task_count !== 'number' || sampleCluster.task_first_task_count < 0) {
    throw new Error('Expected transformation_map cluster summaries to expose task_first_task_count.');
  }
  if (sampleCluster.wave_assignment_source !== 'task_aggregated') {
    throw new Error('Expected transformation_map cluster wave assignments to be task_aggregated.');
  }
  if (!String(sampleCluster.automation_difficulty_source || '').startsWith('task_aggregated')) {
    throw new Error('Expected transformation_map cluster automation difficulty to be task-aggregated.');
  }
  if (![
    'task_aggregated_cluster_model',
    'task_aggregated_resolved_task_evidence',
    'task_aggregated_task_first_resolved_evidence'
  ].includes(sampleCluster.automation_difficulty_source)) {
    throw new Error('Expected transformation_map cluster automation difficulty source to expose the live task-derived source path.');
  }
  if (result.top_exposed_work && !result.transformation_map.exposed_clusters.some((cluster) => cluster.task_cluster_id === result.top_exposed_work.task_cluster_id)) {
    throw new Error('Expected top_exposed_work to come from the task-derived exposed cluster summaries.');
  }

  if (!result.occupation_explanation) {
    throw new Error('Expected occupation_explanation in result payload.');
  }
  if (!result.occupation_explanation.explanation_summary) {
    throw new Error('Expected occupation_explanation.explanation_summary in result payload.');
  }
  if (!result.task_breakdown.tasks.every((task) => typeof task.task_source_bucket === 'string' && typeof task.task_source_label === 'string')) {
    throw new Error('Expected task rows to expose task_source_bucket and task_source_label.');
  }
  if (!result.audit_trace) {
    throw new Error('Expected audit_trace in result payload.');
  }
  if (!Array.isArray(result.audit_trace.top_pressure_tasks) || !Array.isArray(result.audit_trace.top_retained_tasks)) {
    throw new Error('Expected audit_trace task arrays in result payload.');
  }
  if (!Array.isArray(result.audit_trace.top_exposed_functions) || !Array.isArray(result.audit_trace.evidence_citations)) {
    throw new Error('Expected audit_trace function and evidence arrays in result payload.');
  }
  if (typeof result.audit_trace.export_summary !== 'string' || !result.audit_trace.export_summary.length) {
    throw new Error('Expected audit_trace.export_summary in result payload.');
  }
  if (!result.evidence_summary?.explanation_summary) {
    throw new Error('Expected evidence_summary.explanation_summary in result payload.');
  }
  if (!result.function_metrics) {
    throw new Error('Expected function_metrics in result payload.');
  }
  [
    'function_exposure_pressure',
    'retained_function_strength',
    'retained_accountability_strength',
    'retained_bargaining_power',
    'delegation_likelihood',
    'headcount_displacement_risk',
    'confidence_score'
  ].forEach((key) => {
    assertBounded(`function_metrics.${key}`, result.function_metrics[key]);
  });
  if (!Array.isArray(result.function_metrics.per_function_breakdown) || !result.function_metrics.per_function_breakdown.length) {
    throw new Error('Expected function_metrics.per_function_breakdown in result payload.');
  }

  const taskDrivenResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: result.questionnaire_profile,
    seniorityLevel: 3,
    compositionEdits: {
      removed_task_ids: roleComposition.defaults.task_ids.slice(0, 2),
      removed_function_ids: roleComposition.defaults.function_ids.slice(1)
    }
  });

  if (taskDrivenResult.task_breakdown.total_tasks_considered >= result.task_breakdown.total_tasks_considered) {
    throw new Error('Expected composition edits to shrink the active task set.');
  }
  const activeFunctionCount = taskDrivenResult.occupation_assignment?.selected_composition?.active_function_count || 0;
  if (roleComposition.defaults.function_ids.length > 1 && activeFunctionCount >= roleComposition.defaults.function_ids.length) {
    throw new Error('Expected composition edits to shrink the active function set when multiple function anchors exist.');
  }
  if (activeFunctionCount < 1) {
    throw new Error('Expected at least one active function after composition edits.');
  }
  if (!taskDrivenResult.occupation_assignment?.selected_composition?.edit_delta) {
    throw new Error('Expected selected_composition.edit_delta when composition edits materially change the run.');
  }
  if ((taskDrivenResult.occupation_assignment.selected_composition.edit_delta.changed_task_count || 0) < 1) {
    throw new Error('Expected selected_composition.edit_delta to count changed tasks.');
  }
  if (!Array.isArray(taskDrivenResult.occupation_assignment.selected_composition.edit_delta.removed_task_labels)) {
    throw new Error('Expected selected_composition.edit_delta to expose removed task labels.');
  }
  if (!taskDrivenResult.occupation_assignment.selected_composition.edit_delta.source_mix_delta) {
    throw new Error('Expected selected_composition.edit_delta to expose source_mix_delta.');
  }
  assertBounded('taskDrivenResult.role_fate_confidence', taskDrivenResult.role_fate_confidence);
  if ((taskDrivenResult.occupation_explanation?.function_anchor_count || 0) !== activeFunctionCount) {
    throw new Error('Expected live occupation explanation to reflect the edited active function count.');
  }

  const reviewedEvidenceResult = engine.computeResult({
    occupationId: 'occ_13_1199_00',
    seniorityLevel: 3
  });
  const reviewedResolvedTask = reviewedEvidenceResult.task_breakdown.tasks.find((task) => {
    return task.resolved_evidence_source_role === 'reviewed_task_estimate' &&
      Number(task.automation_difficulty_evidence_weight) > 0 &&
      ['resolved_task_evidence', 'task_first_resolved_evidence'].includes(task.automation_difficulty_source);
  });
  if (!reviewedResolvedTask) {
    throw new Error('Expected reviewed task estimates to participate in the task-evidence resolver for reviewed-gap occupations.');
  }
  if ((reviewedEvidenceResult.evidence_summary?.source_coverage?.reviewed_task_estimate_rows || 0) < 1) {
    throw new Error('Expected source_coverage.reviewed_task_estimate_rows to report reviewed task evidence usage.');
  }
  if ((reviewedEvidenceResult.diagnostics?.task_first_cluster_count || 0) < 1) {
    throw new Error('Expected diagnostics.task_first_cluster_count to report at least one task-first cluster baseline.');
  }
  if ((reviewedEvidenceResult.evidence_summary?.source_coverage?.task_first_cluster_rows || 0) < 1) {
    throw new Error('Expected source_coverage.task_first_cluster_rows to report task-first cluster baseline usage.');
  }
  if (!reviewedEvidenceResult.transformation_map.current_bundle.some((cluster) => cluster.baseline_difficulty_source === 'task_first_cluster_evidence')) {
    throw new Error('Expected reviewed evidence scenario to expose at least one task_first_cluster_evidence cluster baseline.');
  }
  if (!reviewedEvidenceResult.task_breakdown.tasks.some((task) => ['task_first_cluster_evidence', 'task_first_resolved_evidence'].includes(task.automation_difficulty_baseline_source))) {
    throw new Error('Expected reviewed evidence scenario to project a task-first baseline onto at least one task row.');
  }
  if ((reviewedEvidenceResult.diagnostics?.task_first_task_count || 0) < 1) {
    throw new Error('Expected diagnostics.task_first_task_count to report at least one task-first task baseline in the reviewed evidence scenario.');
  }
  if (!reviewedEvidenceResult.task_breakdown.tasks.some((task) => task.automation_difficulty_baseline_source === 'task_first_resolved_evidence')) {
    throw new Error('Expected reviewed evidence scenario to promote at least one task into the task-first task baseline path.');
  }
  if (!reviewedEvidenceResult.task_breakdown.tasks.some((task) =>
    task.resolved_evidence_source_role === 'reviewed_task_estimate' &&
    task.automation_difficulty_baseline_source === 'task_first_resolved_evidence')) {
    throw new Error('Expected reviewed task estimates to clear the source-aware task-first task-baseline gate.');
  }
  if (!reviewedEvidenceResult.transformation_map.current_bundle.some((cluster) => cluster.automation_difficulty_source === 'task_aggregated_task_first_resolved_evidence')) {
    throw new Error('Expected reviewed evidence scenario to expose task_aggregated_task_first_resolved_evidence at the cluster summary layer.');
  }

  const shareOverrideTaskId = roleComposition.defaults.task_ids[0];
  const baseTaskRow = result.task_breakdown.tasks.find((task) => task.task_id === shareOverrideTaskId);
  const shareDrivenResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: result.questionnaire_profile,
    seniorityLevel: 3,
    compositionEdits: {
      task_share_overrides: {
        [shareOverrideTaskId]: 0.30
      }
    }
  });
  const shareTaskRow = shareDrivenResult.task_breakdown.tasks.find((task) => task.task_id === shareOverrideTaskId);
  if (!baseTaskRow || !shareTaskRow) {
    throw new Error('Expected task share override scenario to find the target task in both runs.');
  }
  if (shareTaskRow.share_of_role <= baseTaskRow.share_of_role) {
    throw new Error('Expected task share override to increase the task share_of_role.');
  }
  if ((shareDrivenResult.occupation_assignment?.selected_composition?.share_override_count || 0) !== 1) {
    throw new Error('Expected task share override count to register in the selected composition summary.');
  }
  if ((shareDrivenResult.occupation_assignment?.selected_composition?.edit_delta?.share_override_count || 0) !== 1) {
    throw new Error('Expected selected_composition.edit_delta to register task share overrides.');
  }
  if (!shareDrivenResult.occupation_assignment?.selected_composition?.edit_delta?.source_mix_delta) {
    throw new Error('Expected share-driven edit delta to keep source mix diagnostics.');
  }

  const functionLinkedResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: result.questionnaire_profile,
    seniorityLevel: 3,
    compositionEdits: {
      task_function_links: [
        {
          task_id: roleComposition.defaults.task_ids[0],
          function_id: roleComposition.defaults.function_ids[0]
        }
      ]
    }
  });
  if ((functionLinkedResult.occupation_assignment?.selected_composition?.custom_function_link_count || 0) !== 1) {
    throw new Error('Expected task-to-function link count to register in the selected composition summary.');
  }
  if ((functionLinkedResult.occupation_assignment?.selected_composition?.active_task_function_link_count || 0) < 1) {
    throw new Error('Expected active task-to-function link count to be tracked in the selected composition summary.');
  }
  if ((functionLinkedResult.occupation_assignment?.selected_composition?.edit_delta?.custom_function_link_count || 0) !== 1) {
    throw new Error('Expected selected_composition.edit_delta to register custom task-to-function links.');
  }
  if (!Array.isArray(functionLinkedResult.occupation_assignment?.selected_composition?.edit_delta?.added_function_labels)) {
    throw new Error('Expected selected_composition.edit_delta to expose function label arrays.');
  }

  const dependencyDrivenResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: result.questionnaire_profile,
    seniorityLevel: 3,
    dependencyEdits: {
      added_edges: roleComposition.defaults.task_ids.length >= 2
        ? [{ from_task_id: roleComposition.defaults.task_ids[0], to_task_id: roleComposition.defaults.task_ids[1] }]
        : []
    }
  });
  if ((dependencyDrivenResult.occupation_assignment?.selected_composition?.added_dependency_count || 0) !== 1) {
    throw new Error('Expected dependency edits to register in the selected composition summary.');
  }
  if ((dependencyDrivenResult.occupation_assignment?.selected_composition?.edit_delta?.added_dependency_count || 0) !== 1) {
    throw new Error('Expected selected_composition.edit_delta to register custom dependency edits.');
  }
  if (!dependencyDrivenResult.occupation_assignment?.selected_composition?.edit_delta?.largest_metric_shift) {
    throw new Error('Expected selected_composition.edit_delta to expose the largest metric shift.');
  }
  assertBounded('dependencyDrivenResult.diagnostics.indirect_dependency_pressure', dependencyDrivenResult.diagnostics.indirect_dependency_pressure);

  const businessOps = engine.computeResult({
    occupationId: 'occ_13_1199_00',
    roleCategory: 'consulting',
    questionnaireProfile: {
      function_centrality: 0.5,
      human_signoff_requirement: 0.5,
      liability_and_regulatory_burden: 0.5,
      relationship_ownership: 0.5,
      exception_and_context_load: 0.5,
      workflow_decomposability: 0.5,
      organizational_adoption_readiness: 0.5,
      ai_observability_of_work: 0.5,
      dependency_bottleneck_strength: 0.5,
      handoff_and_coordination_complexity: 0.5,
      external_trust_requirement: 0.5,
      stakeholder_alignment_burden: 0.5,
      execution_vs_judgment_mix: 0.5,
      augmentation_fit: 0.5,
      substitution_risk_modifier: 0.5
    },
    seniorityLevel: 3
  });

  if (businessOps.selected_occupation_id !== 'occ_13_1199_00') {
    throw new Error('Expected explicit occupationId to resolve Business Operations Specialists, All Other.');
  }
  if (!businessOps.task_breakdown?.tasks?.length) {
    throw new Error('Expected task breakdown for Business Operations Specialists, All Other.');
  }
  assertBounded('businessOps.diagnostics.direct_exposure_pressure', businessOps.diagnostics.direct_exposure_pressure);
  assertBounded('businessOps.diagnostics.indirect_dependency_pressure', businessOps.diagnostics.indirect_dependency_pressure);

  const lawyerResult = engine.computeResult({
    occupationId: 'occ_23_1011_00',
    seniorityLevel: 3
  });
  const officeClerkResult = engine.computeResult({
    occupationId: 'occ_43_9061_00',
    seniorityLevel: 3
  });
  if (Number(lawyerResult.function_metrics?.retained_bargaining_power || 0) <= Number(officeClerkResult.function_metrics?.retained_bargaining_power || 0)) {
    throw new Error('Expected Lawyers to retain more bargaining power than Office Clerks, General in the live scoring path.');
  }
  if (Number(officeClerkResult.function_metrics?.retained_bargaining_power || 1) >= 0.50) {
    throw new Error('Expected Office Clerks, General to stay below the bargaining-power overstatement threshold.');
  }
  if (Number(officeClerkResult.recomposition_summary?.workflow_compression || 0) <= 0.25) {
    throw new Error('Expected Office Clerks, General to retain the stronger routine-compression signal in the live scoring path.');
  }
  if (Number(officeClerkResult.diagnostics?.direct_exposure_pressure || 0) <= 0.57) {
    throw new Error('Expected Office Clerks, General to retain the stronger clerical-execution direct-pressure signal in the live scoring path.');
  }
  const secretaryResult = engine.computeResult({
    occupationId: 'occ_43_6014_00',
    seniorityLevel: 3
  });
  const bookkeepingClerkRoutineResult = engine.computeResult({
    occupationId: 'occ_43_3031_00',
    seniorityLevel: 3
  });
  if (Number(secretaryResult.diagnostics?.direct_exposure_pressure || 0) <= 0.49) {
    throw new Error('Expected Secretaries and Administrative Assistants to retain the stronger routine/admin direct-pressure signal in the live scoring path.');
  }
  if (Number(bookkeepingClerkRoutineResult.diagnostics?.direct_exposure_pressure || 0) <= 0.53) {
    throw new Error('Expected Bookkeeping, Accounting, and Auditing Clerks to retain the stronger routine/admin direct-pressure signal in the live scoring path.');
  }
  const customerServiceResult = engine.computeResult({
    occupationId: 'occ_43_4051_00',
    seniorityLevel: 3
  });
  const bookkeepingClerkResult = engine.computeResult({
    occupationId: 'occ_43_3031_00',
    seniorityLevel: 3
  });
  const statisticalAssistantResult = engine.computeResult({
    occupationId: 'occ_43_9111_00',
    seniorityLevel: 3
  });
  const dataScientistResult = engine.computeResult({
    occupationId: 'occ_15_2051_00',
    seniorityLevel: 3
  });
  const softwareDeveloperResult = engine.computeResult({
    occupationId: 'occ_15_1252_00',
    seniorityLevel: 3
  });
  if (Number(customerServiceResult.function_metrics?.retained_bargaining_power || 1) >= 0.50) {
    throw new Error('Expected Customer Service Representatives to stay below the bargaining-power overstatement threshold.');
  }
  if (Number(bookkeepingClerkResult.function_metrics?.retained_bargaining_power || 1) >= 0.48) {
    throw new Error('Expected Bookkeeping, Accounting, and Auditing Clerks to stay below the bargaining-power overstatement threshold.');
  }
  if (Number(statisticalAssistantResult.function_metrics?.retained_bargaining_power || 1) >= 0.48) {
    throw new Error('Expected Statistical Assistants to stay below the bargaining-power overstatement threshold.');
  }
  if (Number(dataScientistResult.function_metrics?.retained_bargaining_power || 0) <= Number(customerServiceResult.function_metrics?.retained_bargaining_power || 0)) {
    throw new Error('Expected Data Scientists to retain more bargaining power than Customer Service Representatives in the live scoring path.');
  }
  if (Number(dataScientistResult.function_metrics?.retained_bargaining_power || 0) <= Number(bookkeepingClerkResult.function_metrics?.retained_bargaining_power || 0)) {
    throw new Error('Expected Data Scientists to retain more bargaining power than Bookkeeping, Accounting, and Auditing Clerks in the live scoring path.');
  }
  if (Number(dataScientistResult.function_metrics?.retained_bargaining_power || 0) <= Number(statisticalAssistantResult.function_metrics?.retained_bargaining_power || 0)) {
    throw new Error('Expected Data Scientists to retain more bargaining power than Statistical Assistants in the live scoring path.');
  }
  if (Number(softwareDeveloperResult.function_metrics?.retained_bargaining_power || 0) <= Number(customerServiceResult.function_metrics?.retained_bargaining_power || 0)) {
    throw new Error('Expected Software Developers to retain more bargaining power than Customer Service Representatives in the live scoring path.');
  }

  const structuredProfileResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: {
      function_centrality: 0.72,
      human_signoff_requirement: 0.68,
      liability_and_regulatory_burden: 0.61,
      relationship_ownership: 0.48,
      exception_and_context_load: 0.63,
      workflow_decomposability: 0.71,
      organizational_adoption_readiness: 0.67,
      ai_observability_of_work: 0.83,
      dependency_bottleneck_strength: 0.58,
      handoff_and_coordination_complexity: 0.54,
      external_trust_requirement: 0.46,
      stakeholder_alignment_burden: 0.59,
      execution_vs_judgment_mix: 0.43,
      augmentation_fit: 0.77,
      substitution_risk_modifier: 0.64
    },
    seniorityLevel: 3
  });

  if (structuredProfileResult.questionnaire_profile_source !== 'native_profile') {
    throw new Error(`Expected native questionnaire profile path, received ${structuredProfileResult.questionnaire_profile_source}.`);
  }
  assertBounded('structuredProfileResult.role_fate_confidence', structuredProfileResult.role_fate_confidence);
  assertBounded('structuredProfileResult.diagnostics.function_retention', structuredProfileResult.diagnostics.function_retention);
  assertBounded('structuredProfileResult.diagnostics.augmentation_fit', structuredProfileResult.diagnostics.augmentation_fit);
  assertBounded('structuredProfileResult.diagnostics.substitution_risk_modifier', structuredProfileResult.diagnostics.substitution_risk_modifier);

  const legacyCompatibilityResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    answers: {
      Q1: 4, Q2: 4, Q3: 4, Q4: 5, Q5: 4, Q6: 3,
      Q7: 3, Q8: 4, Q9: 2,
      Q11: 2, Q12: 1, Q13: 4, Q14: 3, Q16: 4
    },
    seniorityLevel: 3
  });

  if (legacyCompatibilityResult.questionnaire_profile_source !== 'legacy_answers') {
    throw new Error(`Expected explicit legacy fallback path, received ${legacyCompatibilityResult.questionnaire_profile_source}.`);
  }

  const managementAnalystResult = engine.computeResult({
    roleCategory: 'consulting',
    occupationId: 'occ_13_1111_00',
    roleVariantId: 'change_enablement_advisor',
    questionnaireProfile: managementAnalystAdvisoryProfile,
    seniorityLevel: 4
  });
  if (managementAnalystResult.occupation_assignment?.selected_variant?.variant_id !== 'change_enablement_advisor') {
    throw new Error('Expected computeResult to expose the selected reviewed role variant in occupation_assignment.');
  }
  if (managementAnalystResult.occupation_assignment?.selected_composition?.variant_mode !== 'manual') {
    throw new Error('Expected computeResult selected_composition.variant_mode to report manual role variant selection.');
  }
  if ((managementAnalystResult.occupation_assignment?.selected_composition?.active_function_count || 0) < 2) {
    throw new Error('Expected change_enablement_advisor baseline to activate both reviewed function anchors.');
  }
  const marketingOpsResult = engine.computeResult({
    roleCategory: 'business',
    occupationId: 'occ_13_1161_00',
    roleVariantId: 'marketing_ops_analyst',
    seniorityLevel: 3
  });
  if (marketingOpsResult.occupation_assignment?.selected_variant?.variant_id !== 'marketing_ops_analyst') {
    throw new Error('Expected computeResult to expose the manual marketing_ops_analyst reviewed role variant.');
  }
  if ((marketingOpsResult.occupation_assignment?.selected_composition?.active_function_count || 0) < 2) {
    throw new Error('Expected marketing_ops_analyst baseline to activate both reviewed function anchors.');
  }
  const anchorProducerResult = engine.computeResult({
    roleCategory: 'creative',
    occupationId: 'occ_27_3023_00',
    roleVariantId: 'anchor_producer',
    seniorityLevel: 3
  });
  if (anchorProducerResult.occupation_assignment?.selected_variant?.variant_id !== 'anchor_producer') {
    throw new Error('Expected computeResult to expose the manual anchor_producer reviewed role variant.');
  }
  if ((anchorProducerResult.occupation_assignment?.selected_composition?.active_function_count || 0) < 2) {
    throw new Error('Expected anchor_producer baseline to activate both reviewed function anchors.');
  }
  const releaseEnablementResult = engine.computeResult({
    roleCategory: 'creative',
    occupationId: 'occ_27_3042_00',
    roleVariantId: 'release_enablement_writer',
    seniorityLevel: 3
  });
  if (releaseEnablementResult.occupation_assignment?.selected_variant?.variant_id !== 'release_enablement_writer') {
    throw new Error('Expected computeResult to expose the manual release_enablement_writer reviewed role variant.');
  }
  if ((releaseEnablementResult.occupation_assignment?.selected_composition?.active_function_count || 0) < 2) {
    throw new Error('Expected release_enablement_writer baseline to activate both reviewed function anchors.');
  }
  const managingEditorResult = engine.computeResult({
    roleCategory: 'creative',
    occupationId: 'occ_27_3041_00',
    roleVariantId: 'managing_editor',
    seniorityLevel: 3
  });
  if (managingEditorResult.occupation_assignment?.selected_variant?.variant_id !== 'managing_editor') {
    throw new Error('Expected computeResult to expose the manual managing_editor reviewed role variant.');
  }
  if ((managingEditorResult.occupation_assignment?.selected_composition?.active_function_count || 0) < 2) {
    throw new Error('Expected managing_editor baseline to activate both reviewed function anchors.');
  }
  console.log(JSON.stringify({
    summary: {
      occupation: result.selected_occupation_title,
      roleOutlook: result.role_outlook_label,
      roleFate: result.role_fate_label,
      primaryDisplacementWave: result.primary_displacement_wave,
      topExposed: result.top_exposed_work?.label || null,
      topExposedWave: result.top_exposed_work?.wave_assignment || null,
      residualRoleStrength: result.residual_role_strength,
      personalizationFit: result.personalization_fit,
      recompositionRead: result.recomposition_summary.summary_label
    },
    waveTrajectory: {
      current: result.wave_trajectory.current.state + ' (' + result.wave_trajectory.current.retained_share + ')',
      next: result.wave_trajectory.next.state + ' (' + result.wave_trajectory.next.retained_share + ')',
      distant: result.wave_trajectory.distant.state + ' (' + result.wave_trajectory.distant.retained_share + ')'
    },
    counts: {
      currentBundle: result.transformation_map.current_bundle.length,
      exposedClusters: result.transformation_map.exposed_clusters.length,
      retainedClusters: result.transformation_map.retained_clusters.length,
      elevatedClusters: result.transformation_map.elevated_clusters.length
    },
    recomposition: {
      workflowCompression: result.recomposition_summary.workflow_compression,
      workflowCompressionBand: result.recomposition_summary.workflow_compression_band,
      substitutionPotential: result.recomposition_summary.substitution_potential,
      substitutionGap: result.recomposition_summary.substitution_gap,
      confidence: result.recomposition_summary.confidence_label
    },
    roleGraph: {
      directExposurePressure: result.diagnostics.direct_exposure_pressure,
      indirectDependencyPressure: result.diagnostics.indirect_dependency_pressure,
      residualRoleIntegrity: result.diagnostics.residual_role_integrity
    },
    taskSelection: {
      inventoryRows: taskInventory.length,
      roleFate: taskDrivenResult.role_fate_label,
      selectedTaskCount: taskDrivenResult.task_breakdown.user_selected_task_count
    },
    businessOps: {
      occupation: businessOps.selected_occupation_title,
      taskCount: businessOps.task_breakdown.total_tasks_considered,
      topExposed: businessOps.top_exposed_work?.label || null
    },
    structuredProfile: {
      roleFate: structuredProfileResult.role_fate_label,
      functionRetention: structuredProfileResult.diagnostics.function_retention,
      substitutionRiskModifier: structuredProfileResult.diagnostics.substitution_risk_modifier
    }
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
