// app.js — V2 application logic extracted from index.html
// State, questionnaire, formatting, engine access, rendering, and event wiring.

// ─── 1. State variables ──────────────────────────────────────────────────────

let selectedRole = null;
let selectedOccupationId = null;
let lastV2Result = null;
let v2EnginePromise = null;
let v2TaskBreakdownExpanded = false;
let v2OverviewTasksExpanded = false;
let v2RoleCompositionState = null;
let v2CustomDependencyEdges = [];
let v2CustomTaskFunctionLinks = [];
let v2GraphNodePositions = {};
let v2RoleGraphControllerPromise = null;
let v2GraphMode = 'move';
let v2RoleVariantPreference = { mode: 'auto', variantId: null };
let v2AdjustmentMode = null;
let v2RevealObserver = null;
let v2UpdateRequestId = 0;
let v2ResultsUnlocked = false;
let v2WasReadyForAnalysis = false;
let v2AnalysisStageActive = false;
let v2OccupationIndexPromise = null;
let v2StateModelControls = { demandBias: 0, investmentBias: 0, adoptionBias: 0, exposureBias: 0, stayingBias: 0 };
let v2StateControlUpdateTimer = null;
let v2OccupationLandscapeControls = { hierarchyLevel: 3, demandBias: 0, investmentBias: 0, adoptionBias: 0, exposureBias: 0, stayingBias: 0 };
let v2OccupationLandscapeUpdateTimer = null;
let v2OccupationForecastMatrixCache = new Map();
let v2OccupationLandscapeSnapshotCache = new Map();
let v2OccupationForecastMatrixRequestId = 0;

const ROLE_CATEGORY_ALIASES = Object.freeze({
    'data-analysis': 'data',
    'product-management': 'product_management',
    'content-writing': 'content',
    'sales-marketing': 'marketing',
    'sales/marketing': 'marketing',
    salesmarketing: 'marketing'
});

function normalizeRoleCategory(roleValue) {
    const raw = String(roleValue || '').trim();
    if (!raw) return '';
    return ROLE_CATEGORY_ALIASES[raw] || raw;
}

// ─── 1b. Card-based breakdown config ────────────────────────────────────────

const V2_BREAKDOWN_CARD_CONFIG = [
    {
        key: 'onet_tasks',
        title: 'Tasks from O*NET',
        description: 'These are the baseline occupation tasks pulled from O*NET and preselected for this run.'
    },
    {
        key: 'reviewed_job_posting_tasks',
        title: 'Tasks added from public job postings',
        description: 'These are reviewed additions we pulled from public job postings for this occupation.'
    },
    {
        key: 'reviewed_role_graph_tasks',
        title: 'Tasks added during role review',
        description: 'These are reviewed task additions we kept because they help explain the role but do not come directly from O*NET.'
    },
    {
        key: 'functions',
        title: 'Value-defining functions',
        description: 'These are the core functions we think define why this role exists, even if AI changes many of the tasks.'
    }
];

// ─── 2. Questionnaire schema ────────────────────────────────────────────────

const ACTIVE_REFINEMENT_FACTORS = [
    'ai_observability_of_work',
    'evidence_trail_strength',
    'review_signoff_clarity',
    'digital_workflow_readiness',
    'workflow_decomposability',
    'process_standardization',
    'exception_and_context_load',
    'feedback_loop_speed',
    'tacit_knowledge_load',
    'human_signoff_requirement',
    'external_trust_requirement',
    'organizational_adoption_readiness',
    'delegation_pressure',
    'workflow_integration_readiness'
];
const QUESTIONNAIRE_MODULES = [
    {
        title: 'AI Readiness',
        questions: [
            {
                id: 'ai_observability_of_work',
                title: 'Current AI performance',
                prompt: 'How well can AI already perform the core tasks in your role?',
                options: [
                    { value: 1, label: 'Very Poor' },
                    { value: 2, label: 'Limited' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Good' },
                    { value: 5, label: 'Near-Human' }
                ]
            },
            {
                id: 'evidence_trail_strength',
                title: 'Available examples of this work',
                prompt: 'How much example work exists for your role in training materials, online guides, industry case studies, or documentation?',
                options: [
                    { value: 1, label: 'Very Little' },
                    { value: 2, label: 'Limited' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Abundant' },
                    { value: 5, label: 'Very Abundant' }
                ]
            },
            {
                id: 'review_signoff_clarity',
                title: 'How measurable is success',
                prompt: 'How easily can someone tell whether your work is good?',
                options: [
                    { value: 1, label: 'Very Hard to Judge' },
                    { value: 2, label: 'Difficult' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Fairly Clear' },
                    { value: 5, label: 'Very Clear' }
                ]
            },
            {
                id: 'digital_workflow_readiness',
                title: 'Work digitization',
                prompt: 'What share of your work inputs and outputs exist in digital or text form?',
                options: [
                    { value: 1, label: '0–20%' },
                    { value: 2, label: '21–40%' },
                    { value: 3, label: '41–60%', checked: true },
                    { value: 4, label: '61–80%' },
                    { value: 5, label: '81–100%' }
                ]
            }
        ]
    },
    {
        title: 'How Your Work Is Structured',
        questions: [
            {
                id: 'workflow_decomposability',
                title: 'Task decomposability',
                prompt: 'Can your work be broken into discrete, measurable steps?',
                options: [
                    { value: 1, label: 'Very Complex' },
                    { value: 2, label: 'Complex' },
                    { value: 3, label: 'Mixed', checked: true },
                    { value: 4, label: 'Structured' },
                    { value: 5, label: 'Highly Structured' }
                ]
            },
            {
                id: 'process_standardization',
                title: 'Procedure standardization',
                prompt: 'How standardized are the procedures and workflows in your role?',
                options: [
                    { value: 1, label: 'Highly Variable' },
                    { value: 2, label: 'Variable' },
                    { value: 3, label: 'Somewhat Standard', checked: true },
                    { value: 4, label: 'Standardized' },
                    { value: 5, label: 'Highly Standardized' }
                ]
            },
            {
                id: 'exception_and_context_load',
                title: 'Context and judgment required',
                prompt: 'How much does doing this job well depend on reading the situation, knowing unwritten rules, or handling edge cases?',
                options: [
                    { value: 5, label: 'Critical' },
                    { value: 4, label: 'Very Important' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 2, label: 'Some Needed' },
                    { value: 1, label: 'Minimal' }
                ]
            },
            {
                id: 'feedback_loop_speed',
                title: 'Feedback loop speed',
                prompt: 'How quickly do you get feedback on whether your work was good?',
                options: [
                    { value: 1, label: 'Months / Years' },
                    { value: 2, label: 'Weeks' },
                    { value: 3, label: 'Days', checked: true },
                    { value: 4, label: 'Hours' },
                    { value: 5, label: 'Minutes / Instant' }
                ]
            },
            {
                id: 'tacit_knowledge_load',
                title: 'Tacit vs. documented knowledge',
                prompt: 'How much of your expertise was learned through experience rather than written procedures or manuals?',
                options: [
                    { value: 5, label: 'Mostly Tacit' },
                    { value: 4, label: 'Largely Tacit' },
                    { value: 3, label: 'Mixed', checked: true },
                    { value: 2, label: 'Largely Documented' },
                    { value: 1, label: 'Fully Documented' }
                ]
            }
        ]
    },
    {
        title: 'Relationships & Accountability',
        questions: [
            {
                id: 'human_signoff_requirement',
                title: 'Human judgment and relationships',
                prompt: 'How critical are human relationships, trust, and personal accountability in your role?',
                options: [
                    { value: 5, label: 'Essential' },
                    { value: 4, label: 'Very Important' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 2, label: 'Some Needed' },
                    { value: 1, label: 'Minimal' }
                ]
            },
            {
                id: 'external_trust_requirement',
                title: 'Physical presence',
                prompt: 'How much does your work require being physically present or on-site?',
                options: [
                    { value: 5, label: 'Essential' },
                    { value: 4, label: 'Very Important' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 2, label: 'Some' },
                    { value: 1, label: 'None' }
                ]
            }
        ]
    },
    {
        title: 'Your Organization',
        questions: [
            {
                id: 'organizational_adoption_readiness',
                title: 'Company AI adoption',
                prompt: 'How prepared is your organization to use AI in daily workflows, beyond early experiments?',
                options: [
                    { value: 1, label: 'Resistant' },
                    { value: 2, label: 'Cautious' },
                    { value: 3, label: 'Exploring', checked: true },
                    { value: 4, label: 'Adopting' },
                    { value: 5, label: 'Leading Edge' }
                ]
            },
            {
                id: 'delegation_pressure',
                title: 'Labor cost pressure',
                prompt: 'How much pressure is there to cut labor costs or do more with fewer people?',
                options: [
                    { value: 1, label: 'Not Sensitive' },
                    { value: 2, label: 'Somewhat' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Very Sensitive' },
                    { value: 5, label: 'Extremely Sensitive' }
                ]
            },
            {
                id: 'workflow_integration_readiness',
                title: 'Technical infrastructure',
                prompt: 'How modern are the tools and systems your work runs through?',
                options: [
                    { value: 1, label: 'Very Outdated' },
                    { value: 2, label: 'Outdated' },
                    { value: 3, label: 'Current', checked: true },
                    { value: 4, label: 'Modern' },
                    { value: 5, label: 'Cutting Edge' }
                ]
            }
        ]
    }
];


// ─── 3. Utility functions ────────────────────────────────────────────────────

function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
}

function smoothStep(value, edge0, edge1) {
    if (edge1 <= edge0) {
        return value >= edge1 ? 1 : 0;
    }
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - (2 * t));
}



function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

function formatProfileBand(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 'moderate';
    if (numeric >= 0.75) return 'high';
    if (numeric >= 0.4) return 'moderate';
    return 'low';
}

// ─── 4. Questionnaire functions ──────────────────────────────────────────────

function getRefinementValue(factorId) {
    const checked = document.querySelector(`input[name="rf-${factorId}"]:checked`);
    return checked ? parseFloat(checked.value) : 3;
}

function getCurrentRefinementResponses() {
    const responses = {};
    ACTIVE_REFINEMENT_FACTORS.forEach((factorId) => {
        responses[factorId] = getRefinementValue(factorId);
    });
    return responses;
}

function buildStructuredQuestionnaireProfile(responses, seniorityLevel) {
    const presets = window.WWILMJ_PRESETS;
    if (!presets || typeof presets.buildQuestionnaireProfileFromResponses !== 'function') {
        return null;
    }
    try {
        return presets.buildQuestionnaireProfileFromResponses(responses, seniorityLevel);
    } catch (error) {
        console.warn('[buildStructuredQuestionnaireProfile] Failed to build profile from current refinement responses', error);
        return null;
    }
}

function buildCurrentQuestionnaireProfile() {
    const responses = getCurrentRefinementResponses();
    const seniorityLevel = parseFloat(document.getElementById('hierarchy-select')?.value || '1');
    return buildStructuredQuestionnaireProfile(responses, seniorityLevel);
}

function setRoleVariantPreferenceAuto() {
    v2RoleVariantPreference = { mode: 'auto', variantId: null };
}

function setsMatch(leftValues, rightValues) {
    const left = Array.from(leftValues || []);
    const right = Array.from(rightValues || []);
    if (left.length !== right.length) {
        return false;
    }
    const rightLookup = new Set(right);
    return left.every((value) => rightLookup.has(value));
}

function isCompositionPristineForAutoMode(previousState, previousDependencies, previousTaskFunctionLinks) {
    if (!previousState?.raw) {
        return true;
    }
    const defaultTaskIds = previousState.raw.defaults?.task_ids || [];
    const defaultFunctionIds = previousState.raw.defaults?.function_ids || [];
    const shareOverrideCount = Object.keys(previousState.taskShareOverrides || {}).length;
    return setsMatch(previousState.selectedTaskIds, defaultTaskIds)
        && setsMatch(previousState.selectedFunctionIds, defaultFunctionIds)
        && shareOverrideCount === 0
        && (previousDependencies || []).length === 0
        && (previousTaskFunctionLinks || []).length === 0;
}

function renderQuestionnaireProfileSummary(profile) {
    const activeProfile = profile || {};
    const functionBand = formatProfileBand(activeProfile.function_centrality);
    const signoffBand = formatProfileBand(activeProfile.human_signoff_requirement);
    const workflowBand = formatProfileBand(activeProfile.workflow_decomposability);
    const adoptionBand = formatProfileBand(activeProfile.organizational_adoption_readiness);
    const pressureBand = formatProfileBand(activeProfile.substitution_risk_modifier);

    let summary = 'Answer the core questions to see how this version of the role is likely to retain function, sign-off, and substitution resistance.';
    if (profile) {
        const functionLead = functionBand === 'high'
            ? 'This answer pattern points to a strong human-retained core.'
            : functionBand === 'moderate'
                ? 'This answer pattern points to a mixed human-plus-AI role shape.'
                : 'This answer pattern points to a more execution-heavy role shape.';
        summary = `${functionLead} Sign-off looks ${signoffBand}, workflow split potential looks ${workflowBand}, adoption readiness looks ${adoptionBand}, and substitution pressure looks ${pressureBand}.`;
    }

    safeSetText('v2-refinement-summary', summary);
    safeSetText('v2-refinement-function', formatV2Label(functionBand));
    safeSetText('v2-refinement-signoff', formatV2Label(signoffBand));
    safeSetText('v2-refinement-workflow', `${formatV2Label(workflowBand)} split`);
    safeSetText('v2-refinement-adoption', formatV2Label(adoptionBand));
    safeSetText('v2-refinement-pressure', formatV2Label(pressureBand));
}

function refreshQuestionnaireProfileSummary() {
    const seniorityLevel = parseFloat(document.getElementById('hierarchy-select')?.value || '1');
    const responses = getCurrentRefinementResponses();
    const profile = buildStructuredQuestionnaireProfile(responses, seniorityLevel);
    renderQuestionnaireProfileSummary(profile);
    return profile;
}

function buildQuestionOption(factorId, option, optionIndex) {
    const radioOption = document.createElement('div');
    radioOption.className = 'radio-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `rf-${factorId}-${optionIndex + 1}`;
    input.name = `rf-${factorId}`;
    input.value = String(option.value);
    input.dataset.refinementId = factorId;
    if (option.checked) {
        input.checked = true;
    }

    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = option.label;

    radioOption.appendChild(input);
    radioOption.appendChild(label);
    return radioOption;
}

function buildQuestionNode(question) {
    const questionNode = document.createElement('div');
    questionNode.className = 'question';

    const heading = document.createElement('h5');
    heading.textContent = question.title;

    const prompt = document.createElement('p');
    prompt.textContent = question.prompt;

    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';
    question.options.forEach((option, index) => {
        radioGroup.appendChild(buildQuestionOption(question.id, option, index));
    });

    questionNode.appendChild(heading);
    questionNode.appendChild(prompt);
    questionNode.appendChild(radioGroup);
    return questionNode;
}

function applyQuestionPreset() {
    const presets = window.WWILMJ_PRESETS;
    if (!presets || typeof presets.buildRefinementPreset !== 'function') {
        console.warn('[applyQuestionPreset] WWILMJ_PRESETS.buildRefinementPreset missing');
        return;
    }
    if (!selectedRole) {
        console.warn('[applyQuestionPreset] No role selected');
        return;
    }

    const seniorityLevel = document.getElementById('hierarchy-select')?.value || '1';
    const responseMap = presets.buildRefinementPreset(selectedRole, parseInt(seniorityLevel));

    Object.entries(responseMap || {}).forEach(([factorId, value]) => {
        const radio = document.querySelector(`input[name="rf-${factorId}"][value="${value}"]`);
        if (radio) {
            radio.checked = true;
        }
    });
    refreshQuestionnaireProfileSummary();
}

function resetQuestionsToNeutral() {
    const presets = window.WWILMJ_PRESETS;
    const neutral = presets && presets.NEUTRAL_REFINEMENT_RESPONSES ? presets.NEUTRAL_REFINEMENT_RESPONSES : {};
    for (const factorId of ACTIVE_REFINEMENT_FACTORS) {
        const target = neutral[factorId] ?? 3;
        const radio = document.querySelector(`input[name="rf-${factorId}"][value="${target}"]`);
        if (radio) {
            radio.checked = true;
        }
    }
    refreshQuestionnaireProfileSummary();
}

function setAllRefinementQuestionsToDefault() {
    for (const module of QUESTIONNAIRE_MODULES) {
        for (const question of module.questions) {
            const defaultOption = question.options.find((option) => option.checked) || question.options[0];
            if (!defaultOption) {
                continue;
            }
            const radio = document.querySelector(`input[name="rf-${question.id}"][value="${defaultOption.value}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
    }
    refreshQuestionnaireProfileSummary();
}

function initializeRefinementLayout() {
    const coreGrid = document.getElementById('v2-core-refinement-grid');
    if (!coreGrid) {
        return;
    }

    coreGrid.innerHTML = '';

    QUESTIONNAIRE_MODULES.forEach((module) => {
        module.questions.forEach((question) => {
            coreGrid.appendChild(buildQuestionNode(question));
        });
    });

    refreshQuestionnaireProfileSummary();
}

// ─── 5. V2 Formatting helpers ────────────────────────────────────────────────

function formatV2Label(value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return String(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, function(match) { return match.toUpperCase(); });
}

function formatTaskFamilyLabel(value) {
    if (value === null || value === undefined || value === '') {
        return 'Mapped task family';
    }

    return String(value)
        .replace(/^cluster[_-]+/i, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, function(match) { return match.toUpperCase(); });
}

function formatConfidence(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return `${Math.round(numeric * 100)}%`;
}

function toMetricBand(value, thresholds = [0.35, 0.65], labels = ['Low', 'Moderate', 'Strong']) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    if (numeric >= thresholds[1]) {
        return labels[2];
    }
    if (numeric >= thresholds[0]) {
        return labels[1];
    }
    return labels[0];
}

function formatLabeledMetric(value, thresholds = [0.35, 0.65], labels = ['Low', 'Moderate', 'Strong']) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return `${toMetricBand(numeric, thresholds, labels)} · ${formatConfidence(numeric)}`;
}

function formatBandMetric(value, band, thresholds = [0.35, 0.65], labels = ['Low', 'Moderate', 'Strong']) {
    const tier = toMetricBand(value, thresholds, labels);
    const low = Number(band?.low);
    const high = Number(band?.high);
    if (!Number.isFinite(low) || !Number.isFinite(high)) {
        return tier;
    }
    return `${tier} · ${Math.round(low * 100)}-${Math.round(high * 100)}%`;
}

function formatCoverageMetric(directCount, fallbackCount) {
    const direct = Math.max(0, Number(directCount) || 0);
    const fallback = Math.max(0, Number(fallbackCount) || 0);
    const total = direct + fallback;
    if (!total) {
        return '-';
    }

    return `${Math.round((direct / total) * 100)}% direct · ${direct}/${total} tasks`;
}

function formatCompactNumber(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: numeric >= 1000000 ? 1 : 0
    }).format(numeric);
}

function formatCurrency(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(numeric);
}

function formatSignedPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }

    return `${numeric > 0 ? '+' : ''}${numeric.toFixed(1)}%`;
}

function formatPercentWhole(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }
    return `${Math.round(numeric * 100)}%`;
}

function formatPointDelta(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }
    const points = Math.round(numeric * 100);
    return `${points > 0 ? '+' : ''}${points} pts`;
}

function formatFrontierMargin(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '-';
    }
    const points = Math.round(numeric * 100);
    return `${points > 0 ? '+' : ''}${points} pts`;
}

function joinReadableList(items) {
    const cleaned = (items || []).map((item) => String(item || '').trim()).filter(Boolean);
    if (!cleaned.length) return '';
    if (cleaned.length === 1) return cleaned[0];
    if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
    return `${cleaned.slice(0, -1).join(', ')}, and ${cleaned[cleaned.length - 1]}`;
}

function formatTrajectoryBucket(bucket) {
    if (bucket === 'already_underway') return 'Already underway';
    if (bucket === 'range_1_3_years') return '~1-3 years';
    if (bucket === 'range_3_7_years') return '~3-7 years';
    if (bucket === 'range_7_plus_years') return '7+ years';
    return '-';
}

function formatTrajectoryStateLabel(state) {
    if (state === 'stable') return 'Stable';
    if (state === 'expanding') return 'Expanding';
    if (state === 'transforming') return 'Transforming';
    if (state === 'compressing') return 'Compressing';
    if (state === 'collapsing') return 'Collapsing';
    if (state === 'unsettled') return 'Unsettled';
    return '-';
}

function formatTrajectoryRoleShape(shape) {
    if (shape === 'oversight_heavy') return 'Oversight-heavy';
    if (shape === 'coordination_heavy') return 'Coordination-heavy';
    if (shape === 'compressed_seat') return 'Compressed seat';
    if (shape === 'split_role') return 'Split role';
    if (shape === 'dissolved_role') return 'Dissolved role';
    if (shape === 'mixed_shape') return 'Mixed shape';
    return '-';
}



function formatStateTrajectoryStateLabel(state) {
    if (state === 'retained') return 'Retained';
    if (state === 'complemented') return 'Complemented';
    if (state === 'demand_expanding') return 'Demand-expanding';
    if (state === 'rebalanced') return 'Rebalanced';
    if (state === 'compressed') return 'Compressed';
    if (state === 'bottleneck_fragile') return 'Bottleneck-fragile';
    if (state === 'displaced') return 'Displaced';
    if (state === 'indeterminate') return 'Indeterminate';
    return '-';
}

function formatForecastStateLabel(state) {
    if (state === 'retained') return 'Retained';
    if (state === 'complemented') return 'Complemented';
    if (state === 'compressed') return 'Compressed';
    if (state === 'rebundled') return 'Rebundled';
    if (state === 'displaced') return 'Displaced';
    return '-';
}

function simplifyForecastStateKey(state, point = null) {
    if (state === 'retained') return 'retained';
    if (state === 'complemented' || state === 'demand_expanding') return 'complemented';
    if (state === 'compressed') return 'compressed';
    if (state === 'rebalanced') return 'rebundled';
    if (state === 'displaced' || state === 'bottleneck_fragile') return 'displaced';
    // Numeric fallback: when the engine state is unrecognized, infer from
    // the continuous signals using thresholds derived from STATE_FORECAST_WEIGHTS.
    if (point) {
        const W = STATE_FORECAST_WEIGHTS;
        if (Number(point.bottleneck_risk) >= 0.54 && Number(point.firm_incentive) >= 0.5 && Number(point.role_integrity) < W.displaced_transformation_floor) return 'displaced';
        if (Number(point.role_integrity) >= 0.54 && Number(point.demand_offset) >= 0.38) return 'complemented';
        if (Number(point.transformed_share) >= 0.24 && Number(point.structural_support) >= 0.5) return 'rebundled';
        if (Number(point.transformed_share) >= 0.18) return 'compressed';
    }
    // Audit 2026-03-28: default to 'retained' rather than 'rebundled' so an
    // unrecognized state does not inflate a specific negative outcome.
    return 'retained';
}

function formatYearsApprox(year, decimals = 1) {
    const numeric = Number(year);
    if (!Number.isFinite(numeric) || numeric <= 0.15) return 'now';
    if (numeric >= 5) return '~5 years';
    return `~${numeric.toFixed(decimals)} years`;
}

function formatYearsWindow(centerYear) {
    const numeric = Number(centerYear);
    if (!Number.isFinite(numeric) || numeric <= 0.4) return 'now';
    const start = Math.max(0, numeric - 0.5);
    const end = Math.min(5, numeric + 0.5);
    if (end - start < 0.45) return formatYearsApprox(numeric);
    return `~${start.toFixed(1)}-${end.toFixed(1)} years`;
}

function formatContinuousStateAssumption(value, labels) {
    const numeric = Math.max(-1, Math.min(1, Number(value) || 0));
    let descriptor = labels.neutral;
    if (numeric <= -0.66) descriptor = labels.negativeStrong;
    else if (numeric <= -0.2) descriptor = labels.negativeSoft;
    else if (numeric >= 0.66) descriptor = labels.positiveStrong;
    else if (numeric >= 0.2) descriptor = labels.positiveSoft;
    return `${descriptor} (${numeric >= 0 ? '+' : ''}${numeric.toFixed(2)})`;
}

function formatLandscapeHierarchyLabel(value) {
    switch (String(value || '3')) {
        case '1': return 'Level 1 default · mostly execution-heavy';
        case '2': return 'Level 2 default · senior IC / lead';
        case '3': return 'Level 3 default · manager / principal';
        case '4': return 'Level 4 default · director / senior manager';
        case '5': return 'Level 5 default · executive / head of function';
        default: return 'Level 3 default · manager / principal';
    }
}

function buildOccupationLandscapeSettingsCopy() {
    return `These bottom charts use reviewed default questionnaire settings for each occupation at ${formatLandscapeHierarchyLabel(v2OccupationLandscapeControls.hierarchyLevel)}. They do not change the individual role forecast above.`;
}

function getStateTrajectoryTone(state) {
    if (state === 'retained') return { key: 'retained', color: '#55766f' };
    if (state === 'complemented') return { key: 'complemented', color: '#5d7d8e' };
    if (state === 'demand_expanding') return { key: 'demand-expanding', color: '#4c8b63' };
    if (state === 'rebalanced') return { key: 'rebalanced', color: '#8f6a49' };
    if (state === 'compressed') return { key: 'compressed', color: '#a3653e' };
    if (state === 'bottleneck_fragile') return { key: 'bottleneck-fragile', color: '#b15b4f' };
    if (state === 'displaced') return { key: 'displaced', color: '#8c4940' };
    return { key: 'indeterminate', color: '#7a7366' };
}











// ─── 6. V2 Engine access ────────────────────────────────────────────────────

async function getV2Engine() {
    if (!window.DLYJV2 || typeof window.DLYJV2.create !== 'function') {
        throw new Error('v2 engine runtime is unavailable.');
    }

    if (!v2EnginePromise) {
        v2EnginePromise = window.DLYJV2.create({ basePath: window.DLYJ_BASE_PATH || '' });
    }

    return v2EnginePromise;
}

async function waitForQuestionnairePresets(timeoutMs) {
    const timeout = Number.isFinite(timeoutMs) ? timeoutMs : 5000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeout) {
        if (
            window.WWILMJ_PRESETS &&
            typeof window.WWILMJ_PRESETS.buildQuestionnaireProfilePreset === 'function'
        ) {
            return window.WWILMJ_PRESETS;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 50));
    }

    throw new Error('Questionnaire presets did not initialize in time for the occupation landscape.');
}

function parseSimpleCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') {
                field += '"';
                i += 1;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n') {
            row.push(field.replace(/\r$/, ''));
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }

    if (field.length || row.length) {
        row.push(field.replace(/\r$/, ''));
        rows.push(row);
    }

    if (!rows.length) return [];
    const header = rows[0].map((column, index) => index === 0 ? String(column || '').replace(/^\uFEFF/, '') : column);
    return rows.slice(1)
        .filter((entry) => entry.some((value) => String(value || '').trim().length))
        .map((entry) => {
            const record = {};
            header.forEach((column, index) => {
                record[column] = entry[index] !== undefined ? entry[index] : '';
            });
            return record;
        });
}

async function fetchCsv(url, required = true) {
    const basePath = window.DLYJ_BASE_PATH || '';
    const normalizedUrl = String(url || '').startsWith('http')
        ? String(url)
        : `${basePath}/${String(url || '').replace(/^\/+/, '')}`;
    const response = await fetch(normalizedUrl, { cache: 'no-store' });
    if (!response.ok) {
        if (required) {
            throw new Error(`Failed to load ${normalizedUrl} (${response.status})`);
        }
        return [];
    }
    return parseSimpleCsv(await response.text());
}

async function getOccupationIndex() {
    if (!v2OccupationIndexPromise) {
        const basePath = window.DLYJ_BASE_PATH || '';
        v2OccupationIndexPromise = fetch(`${basePath}/data/normalized/occupations.csv`, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load occupations.csv (${response.status})`);
                }
                return response.text();
            })
            .then((text) => parseSimpleCsv(text))
            .then((rows) => rows
                .filter((row) => String(row.is_active || '1') !== '0')
                .map((row) => ({
                    occupation_id: row.occupation_id,
                    title: row.title,
                    title_short: row.title_short,
                    role_family: normalizeRoleCategory(row.role_family || ''),
                    selection_priority: Number(row.selection_priority) || 0
                })));
    }
    return v2OccupationIndexPromise;
}

async function populateOccupationCandidates(roleCategory, preserveCurrent = true) {
    roleCategory = normalizeRoleCategory(roleCategory);
    const topSelect = document.getElementById('top-occupation-select');
    const resultSelect = document.getElementById('occupation-match-select');
    const selects = [topSelect, resultSelect].filter(Boolean);
    if (!selects.length) return [];

    const setEmptyState = (label, disabled = true) => {
        selects.forEach((select) => {
            select.disabled = disabled;
            if (disabled) {
                select.setAttribute('disabled', 'disabled');
                select.setAttribute('aria-disabled', 'true');
            } else {
                select.removeAttribute('disabled');
                select.setAttribute('aria-disabled', 'false');
            }
            select.innerHTML = `<option value="">${label}</option>`;
            select.classList.remove('selected');
        });
    };

    if (!roleCategory || roleCategory === 'custom') {
        const label = roleCategory === 'custom'
            ? 'Choose the closest mapped category instead'
            : 'Select category first';
        setEmptyState(label, true);
        selectedOccupationId = null;
        return [];
    }

    let engine;
    try {
        engine = await getV2Engine();
    } catch (error) {
        console.error('[V2] Failed to load occupation candidates:', error);
        setEmptyState('V2 occupation data unavailable', true);
        selectedOccupationId = null;
        return [];
    }

    let candidates = engine.getOccupationCandidates(roleCategory, 5) || [];
    if (!candidates.length && typeof engine.listOccupations === 'function') {
        candidates = (engine.listOccupations() || [])
            .filter((occupation) => occupation.role_family === roleCategory)
            .sort((left, right) => (Number(right.selector_weight) || 0) - (Number(left.selector_weight) || 0))
            .slice(0, 5);
    }
    selects.forEach((select) => {
        select.innerHTML = '';
    });

    if (!candidates.length) {
        setEmptyState('No mapped occupations available', true);
        selectedOccupationId = null;
        return [];
    }

    candidates.forEach((occupation) => {
        selects.forEach((select) => {
            const option = document.createElement('option');
            option.value = occupation.occupation_id;
            option.textContent = occupation.title;
            select.appendChild(option);
        });
    });

    const candidateIds = new Set(candidates.map(item => item.occupation_id));
    const preferredId = preserveCurrent && selectedOccupationId && candidateIds.has(selectedOccupationId)
        ? selectedOccupationId
        : candidates[0].occupation_id;

    selects.forEach((select) => {
        select.disabled = false;
        select.removeAttribute('disabled');
        select.setAttribute('aria-disabled', 'false');
        select.value = preferredId;
        select.classList.add('selected');
    });
    selectedOccupationId = preferredId;
    return candidates;
}

function truncateV2TaskLabel(label, maxLength = 88) {
    const value = String(label || '').trim();
    if (!value) return 'Unknown task';
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function createCompositionSelectionState(composition) {
    return {
        occupationId: composition?.occupation_id || null,
        selectedTaskIds: new Set(composition?.defaults?.task_ids || []),
        selectedFunctionIds: new Set(composition?.defaults?.function_ids || []),
        taskShareOverrides: {},
        taskDisplayOrder: Array.from(composition?.defaults?.task_ids || [])
    };
}

function getCompositionEditsForEngine() {
    if (!v2RoleCompositionState?.raw) {
        return {
            removed_task_ids: [],
            added_task_ids: [],
            removed_function_ids: [],
            added_function_ids: [],
            task_share_overrides: {},
            task_function_links: []
        };
    }

    const defaultTaskIds = new Set(v2RoleCompositionState.raw.defaults?.task_ids || []);
    const defaultFunctionIds = new Set(v2RoleCompositionState.raw.defaults?.function_ids || []);
    const selectedTaskIds = Array.from(v2RoleCompositionState.selectedTaskIds || []);
    const selectedFunctionIds = Array.from(v2RoleCompositionState.selectedFunctionIds || []);

    return {
        removed_task_ids: Array.from(defaultTaskIds).filter((taskId) => !v2RoleCompositionState.selectedTaskIds.has(taskId)),
        added_task_ids: selectedTaskIds.filter((taskId) => !defaultTaskIds.has(taskId)),
        removed_function_ids: Array.from(defaultFunctionIds).filter((functionId) => !v2RoleCompositionState.selectedFunctionIds.has(functionId)),
        added_function_ids: selectedFunctionIds.filter((functionId) => !defaultFunctionIds.has(functionId)),
        task_share_overrides: Object.fromEntries(
            Object.entries(v2RoleCompositionState.taskShareOverrides || {}).filter(([taskId, value]) => {
                return v2RoleCompositionState.selectedTaskIds.has(taskId) && Number.isFinite(Number(value));
            }).map(([taskId, value]) => [taskId, Number(value)])
        ),
        task_function_links: (v2CustomTaskFunctionLinks || []).filter((link) => {
            return v2RoleCompositionState.selectedTaskIds.has(link.task_id) && v2RoleCompositionState.selectedFunctionIds.has(link.function_id);
        }).map((link) => ({
            task_id: link.task_id,
            function_id: link.function_id
        }))
    };
}

function getTaskFunctionLinks(task) {
    const selectedFunctions = v2RoleCompositionState?.selectedFunctionIds || new Set();
    const functionRows = v2RoleCompositionState?.raw?.functions || [];
    const functionLookup = new Map(functionRows.map((row) => [row.function_id, row]));
    const baseLinks = Array.isArray(task?.linked_functions)
        ? task.linked_functions.filter((entry) => selectedFunctions.has(entry.function_id))
        : [];
    const customLinks = (v2CustomTaskFunctionLinks || [])
        .filter((entry) => entry.task_id === task?.task_id && selectedFunctions.has(entry.function_id))
        .map((entry) => {
            const functionRow = functionLookup.get(entry.function_id) || {};
            return {
                function_id: entry.function_id,
                function_category: functionRow.function_category || null,
                role_summary: functionRow.role_summary || null,
                function_statement: functionRow.function_statement || null,
                task_to_function_weight: Number(functionRow.function_weight) || 0.6,
                is_custom: true
            };
        });
    const merged = new Map();
    baseLinks.concat(customLinks).forEach((entry) => {
        if (!entry?.function_id) {
            return;
        }
        const existing = merged.get(entry.function_id);
        if (!existing || Number(entry.task_to_function_weight) > Number(existing.task_to_function_weight)) {
            merged.set(entry.function_id, entry);
        }
    });
    return Array.from(merged.values()).sort((left, right) => (Number(right.task_to_function_weight) || 0) - (Number(left.task_to_function_weight) || 0));
}

function getSelectedFunctionSupportMap() {
    if (!v2RoleCompositionState?.raw) {
        return new Map();
    }

    const map = new Map();
    const allTasks = []
        .concat(v2RoleCompositionState.raw.onet_tasks || [])
        .concat(v2RoleCompositionState.raw.reviewed_job_posting_tasks || [])
        .concat(v2RoleCompositionState.raw.reviewed_role_graph_tasks || []);

    allTasks.forEach((task) => {
        if (!v2RoleCompositionState.selectedTaskIds.has(task.task_id)) {
            return;
        }

        getTaskFunctionLinks(task).forEach((entry) => {
            if (!entry?.function_id || !v2RoleCompositionState.selectedFunctionIds.has(entry.function_id)) {
                return;
            }
            if (!map.has(entry.function_id)) {
                map.set(entry.function_id, []);
            }
            map.get(entry.function_id).push({
                task_statement: task.task_statement,
                weight: Number(entry.task_to_function_weight) || 0
            });
        });
    });

    map.forEach((rows, functionId) => {
        rows.sort((left, right) => right.weight - left.weight);
        map.set(functionId, rows);
    });

    return map;
}

function getSelectedCompositionFunctions() {
    if (!v2RoleCompositionState?.raw) return [];
    return (v2RoleCompositionState.raw.functions || [])
        .filter((row) => v2RoleCompositionState.selectedFunctionIds.has(row.function_id))
        .sort((left, right) => (Number(right.function_weight) || 0) - (Number(left.function_weight) || 0));
}

function getAvailableCompositionTasks() {
    if (!v2RoleCompositionState?.raw) return [];
    return []
        .concat(v2RoleCompositionState.raw.onet_tasks || [])
        .concat(v2RoleCompositionState.raw.reviewed_job_posting_tasks || [])
        .concat(v2RoleCompositionState.raw.reviewed_role_graph_tasks || [])
        .filter((task) => !v2RoleCompositionState.selectedTaskIds.has(task.task_id));
}

function getAvailableCompositionFunctions() {
    if (!v2RoleCompositionState?.raw) return [];
    return (v2RoleCompositionState.raw.functions || [])
        .filter((row) => !v2RoleCompositionState.selectedFunctionIds.has(row.function_id));
}

function getEffectiveTaskShare(task) {
    const overrideValue = Number(v2RoleCompositionState?.taskShareOverrides?.[task?.task_id]);
    return Number.isFinite(overrideValue) ? overrideValue : (Number(task?.time_share_prior) || 0);
}

function sortTasksByDisplayOrder(tasks) {
    const order = Array.isArray(v2RoleCompositionState?.taskDisplayOrder) ? v2RoleCompositionState.taskDisplayOrder : [];
    const orderIndex = new Map(order.map((taskId, index) => [taskId, index]));
    return tasks.slice().sort((left, right) => {
        const leftIndex = orderIndex.has(left.task_id) ? orderIndex.get(left.task_id) : Number.MAX_SAFE_INTEGER;
        const rightIndex = orderIndex.has(right.task_id) ? orderIndex.get(right.task_id) : Number.MAX_SAFE_INTEGER;
        if (leftIndex !== rightIndex) {
            return leftIndex - rightIndex;
        }
        return getEffectiveTaskShare(right) - getEffectiveTaskShare(left);
    });
}

function getCombinedFlowEdges() {
    const composition = v2RoleCompositionState?.raw;
    if (!composition) {
        return [];
    }

    const selectedTaskLookup = new Set(Array.from(v2RoleCompositionState.selectedTaskIds || []));
    const edgeMap = new Map();

    (composition.dependency_edges || []).forEach((edge) => {
        if (!selectedTaskLookup.has(edge.from_task_id) || !selectedTaskLookup.has(edge.to_task_id)) {
            return;
        }
        const key = `${edge.from_task_id}__${edge.to_task_id}`;
        edgeMap.set(key, {
            from_task_id: edge.from_task_id,
            to_task_id: edge.to_task_id,
            dependency_strength: Number(edge.dependency_strength) || 0,
            edge_type: 'default'
        });
    });

    (v2CustomDependencyEdges || []).forEach((edge) => {
        if (!selectedTaskLookup.has(edge.from_task_id) || !selectedTaskLookup.has(edge.to_task_id)) {
            return;
        }
        const key = `${edge.from_task_id}__${edge.to_task_id}`;
        edgeMap.set(key, {
            from_task_id: edge.from_task_id,
            to_task_id: edge.to_task_id,
            dependency_strength: 0.65,
            edge_type: 'custom'
        });
    });

    return Array.from(edgeMap.values());
}

function buildWorkflowStages(selectedTasks, flowEdges) {
    const taskIds = selectedTasks.map((task) => task.task_id);
    const incomingCounts = new Map(taskIds.map((taskId) => [taskId, 0]));
    const outgoing = new Map(taskIds.map((taskId) => [taskId, []]));
    const levels = new Map();

    flowEdges.forEach((edge) => {
        if (!incomingCounts.has(edge.to_task_id) || !outgoing.has(edge.from_task_id)) return;
        incomingCounts.set(edge.to_task_id, (incomingCounts.get(edge.to_task_id) || 0) + 1);
        outgoing.get(edge.from_task_id).push(edge.to_task_id);
    });

    const queue = taskIds.filter((taskId) => (incomingCounts.get(taskId) || 0) === 0);
    queue.forEach((taskId) => levels.set(taskId, 0));

    while (queue.length) {
        const current = queue.shift();
        const nextLevel = (levels.get(current) || 0) + 1;
        (outgoing.get(current) || []).forEach((targetId) => {
            const priorLevel = levels.has(targetId) ? levels.get(targetId) : -1;
            if (nextLevel > priorLevel) {
                levels.set(targetId, nextLevel);
            }
            incomingCounts.set(targetId, (incomingCounts.get(targetId) || 0) - 1);
            if ((incomingCounts.get(targetId) || 0) <= 0) {
                queue.push(targetId);
            }
        });
    }

    taskIds.forEach((taskId) => {
        if (!levels.has(taskId)) {
            levels.set(taskId, 0);
        }
    });

    const stageMap = new Map();
    selectedTasks.forEach((task) => {
        const level = levels.get(task.task_id) || 0;
        if (!stageMap.has(level)) {
            stageMap.set(level, []);
        }
        stageMap.get(level).push(task);
    });

    return Array.from(stageMap.entries())
        .sort((left, right) => left[0] - right[0])
        .map(([level, tasks]) => ({
            level,
            tasks: sortTasksByDisplayOrder(tasks)
        }));
}

function renderStudioAddControls() {
    const taskAddSelect = document.getElementById('v2-task-add-select');
    const taskAddButton = document.getElementById('v2-task-add');
    const functionAddSelect = document.getElementById('v2-function-add-select');
    const functionAddButton = document.getElementById('v2-function-add');
    const availableTasks = getAvailableCompositionTasks();
    const availableFunctions = getAvailableCompositionFunctions();

    if (taskAddSelect) {
        taskAddSelect.innerHTML = '<option value=\"\">Add task from this occupation</option>';
        const groupedTasks = { 'O*NET': [], 'Public postings': [], 'Role review': [] };
        availableTasks.forEach((task) => {
            const sourceLabel = String(task.source_label || '').toLowerCase();
            if (sourceLabel.includes('public')) {
                groupedTasks['Public postings'].push(task);
            } else if (sourceLabel.includes('role review')) {
                groupedTasks['Role review'].push(task);
            } else {
                groupedTasks['O*NET'].push(task);
            }
        });
        Object.entries(groupedTasks).forEach(([label, rows]) => {
            if (!rows.length) return;
            const group = document.createElement('optgroup');
            group.label = label;
            rows.forEach((task) => {
                const option = document.createElement('option');
                option.value = task.task_id;
                option.textContent = truncateV2TaskLabel(task.task_statement, 94);
                group.appendChild(option);
            });
            taskAddSelect.appendChild(group);
        });
        taskAddSelect.disabled = !availableTasks.length;
    }
    if (taskAddButton) taskAddButton.disabled = !availableTasks.length;

    if (functionAddSelect) {
        functionAddSelect.innerHTML = '<option value=\"\">Add function from this occupation</option>';
        availableFunctions.forEach((fn) => {
            const option = document.createElement('option');
            option.value = fn.function_id;
            option.textContent = truncateV2TaskLabel(fn.role_summary || fn.function_statement || 'Unnamed function', 84);
            functionAddSelect.appendChild(option);
        });
        functionAddSelect.disabled = !availableFunctions.length;
    }
    if (functionAddButton) functionAddButton.disabled = !availableFunctions.length;
}

function getGraphNodeKey(kind, id) {
    return `${kind}:${id}`;
}

function buildRoleGraphLayout(selectedTasks, selectedFunctions, flowEdges) {
    const taskStages = buildWorkflowStages(selectedTasks, flowEdges);
    const positions = {};
    const stageGap = 280;
    const rowGap = 138;
    const taskBaseX = 60;
    const taskBaseY = 36;

    taskStages.forEach((stage, stageIndex) => {
        stage.tasks.forEach((task, taskIndex) => {
            positions[getGraphNodeKey('task', task.task_id)] = {
                x: taskBaseX + (stageIndex * stageGap),
                y: taskBaseY + (taskIndex * rowGap)
            };
        });
    });

    const maxStage = Math.max(taskStages.length - 1, 0);
    const functionX = taskBaseX + ((maxStage + 1) * stageGap) + 220;
    selectedFunctions.forEach((fn, index) => {
        positions[getGraphNodeKey('function', fn.function_id)] = {
            x: functionX,
            y: taskBaseY + (index * 154)
        };
    });

    return positions;
}

function getGraphNodePositions(selectedTasks, selectedFunctions, flowEdges) {
    const autoPositions = buildRoleGraphLayout(selectedTasks, selectedFunctions, flowEdges);
    const activeKeys = new Set(Object.keys(autoPositions));
    Object.keys(v2GraphNodePositions || {}).forEach((key) => {
        if (!activeKeys.has(key)) {
            delete v2GraphNodePositions[key];
        }
    });
    Object.entries(autoPositions).forEach(([key, position]) => {
        if (!v2GraphNodePositions[key]) {
            v2GraphNodePositions[key] = position;
        }
    });
    return v2GraphNodePositions;
}

function updateGraphModeButtons() {
    document.querySelectorAll('.v2-graph-mode-button').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.graphMode === v2GraphMode);
    });
}

async function getRoleGraphController() {
    const container = document.getElementById('v2-role-graph-editor');
    if (!container) {
        throw new Error('Role graph container not found.');
    }

    if (!v2RoleGraphControllerPromise) {
        v2RoleGraphControllerPromise = import('./assets/role-graph-editor.js').then((module) => {
            return module.mountRoleGraphEditor(container, {
                onTaskRemove(taskId) {
                    if (!v2RoleCompositionState) return;
                    v2RoleCompositionState.selectedTaskIds.delete(taskId);
                    delete v2RoleCompositionState.taskShareOverrides[taskId];
                    v2RoleCompositionState.taskDisplayOrder = (v2RoleCompositionState.taskDisplayOrder || []).filter((candidate) => candidate !== taskId);
                    v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => link.task_id !== taskId);
                    v2CustomDependencyEdges = v2CustomDependencyEdges.filter((edge) => edge.from_task_id !== taskId && edge.to_task_id !== taskId);
                    renderV2RoleComposition(v2RoleCompositionState.raw);
                    updateV2Results({ preserveSelection: true }).catch((error) => {
                        console.error('[V2] Failed to rerender after task removal from graph:', error);
                    });
                },
                onFunctionRemove(functionId) {
                    if (!v2RoleCompositionState) return;
                    v2RoleCompositionState.selectedFunctionIds.delete(functionId);
                    v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => link.function_id !== functionId);
                    renderV2RoleComposition(v2RoleCompositionState.raw);
                    updateV2Results({ preserveSelection: true }).catch((error) => {
                        console.error('[V2] Failed to rerender after function removal from graph:', error);
                    });
                },
                onTaskShareChange(taskId, rawValue) {
                    if (!v2RoleCompositionState) return;
                    if (!rawValue) {
                        delete v2RoleCompositionState.taskShareOverrides[taskId];
                    } else {
                        const value = Number(rawValue);
                        if (Number.isFinite(value)) {
                            v2RoleCompositionState.taskShareOverrides[taskId] = value;
                        }
                    }
                    updateV2Results({ preserveSelection: true }).catch((error) => {
                        console.error('[V2] Failed to rerender after graph share change:', error);
                    });
                },
                onTaskFunctionLinkRemove(taskId, functionId) {
                    v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => !(link.task_id === taskId && link.function_id === functionId));
                    if (v2RoleCompositionState) {
                        renderV2RoleComposition(v2RoleCompositionState.raw);
                    }
                    updateV2Results({ preserveSelection: true }).catch((error) => {
                        console.error('[V2] Failed to rerender after graph task/function link removal:', error);
                    });
                },
                onConnect(connection) {
                    const source = String(connection.source || '');
                    const target = String(connection.target || '');
                    if (!source || !target) return;
                    if (source.startsWith('task:') && target.startsWith('task:')) {
                        const fromTaskId = source.slice(5);
                        const toTaskId = target.slice(5);
                        if (fromTaskId && toTaskId && fromTaskId !== toTaskId) {
                            const alreadyExists = v2CustomDependencyEdges.some((edge) => edge.from_task_id === fromTaskId && edge.to_task_id === toTaskId);
                            if (!alreadyExists) {
                                v2CustomDependencyEdges.push({ from_task_id: fromTaskId, to_task_id: toTaskId });
                            }
                        }
                    } else if (source.startsWith('task:') && target.startsWith('function:')) {
                        const taskId = source.slice(5);
                        const functionId = target.slice(9);
                        if (taskId && functionId) {
                            const alreadyExists = v2CustomTaskFunctionLinks.some((link) => link.task_id === taskId && link.function_id === functionId);
                            if (!alreadyExists) {
                                v2CustomTaskFunctionLinks.push({ task_id: taskId, function_id: functionId });
                            }
                        }
                    }
                    if (v2RoleCompositionState) {
                        renderV2RoleComposition(v2RoleCompositionState.raw);
                    }
                    updateV2Results({ preserveSelection: true }).catch((error) => {
                        console.error('[V2] Failed to rerender after React Flow connection:', error);
                    });
                },
                onCustomEdgeRemove(edgeId) {
                    if (edgeId.startsWith('dep:')) {
                        const ids = edgeId.slice(4).split('->');
                        const [fromTaskId, toTaskId] = ids;
                        v2CustomDependencyEdges = v2CustomDependencyEdges.filter((edge) => !(edge.from_task_id === fromTaskId && edge.to_task_id === toTaskId));
                    }
                    if (edgeId.startsWith('fn:')) {
                        const ids = edgeId.slice(3).split('->');
                        const [taskId, functionId] = ids;
                        v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => !(link.task_id === taskId && link.function_id === functionId));
                    }
                    if (v2RoleCompositionState) {
                        renderV2RoleComposition(v2RoleCompositionState.raw);
                    }
                    updateV2Results({ preserveSelection: true }).catch((error) => {
                        console.error('[V2] Failed to rerender after custom edge removal:', error);
                    });
                },
                onNodePositionChange(nodeId, position) {
                    v2GraphNodePositions[nodeId] = {
                        x: Number(position.x) || 0,
                        y: Number(position.y) || 0
                    };
                }
            });
        }).catch((error) => {
            const helper = document.getElementById('v2-role-graph-helper');
            const containerNode = document.getElementById('v2-role-graph-editor');
            if (helper) {
                helper.textContent = 'The role graph failed to load on this page.';
            }
            if (containerNode) {
                containerNode.innerHTML = '<div class="v2-flow-empty">The role graph failed to load.</div>';
            }
            throw error;
        });
    }

    return v2RoleGraphControllerPromise;
}

// ─── Card-based breakdown helpers ────────────────────────────────────────────

function getBreakdownRowsForCard(cardKey) {
    const raw = v2RoleCompositionState?.raw;
    if (!raw) return [];
    return Array.isArray(raw[cardKey]) ? raw[cardKey] : [];
}

function getBreakdownSelectedIds(cardKey) {
    if (cardKey === 'functions') {
        return v2RoleCompositionState?.selectedFunctionIds || new Set();
    }
    return v2RoleCompositionState?.selectedTaskIds || new Set();
}

function createBreakdownChip(item, cardKey) {
    const chip = document.createElement('div');
    chip.className = 'v2-composition-chip';

    const body = document.createElement('div');
    body.className = 'v2-composition-chip-body';

    const title = document.createElement('div');
    title.className = 'v2-composition-chip-title';
    title.textContent = cardKey === 'functions'
        ? (item.role_summary || item.function_statement || 'Unnamed function')
        : truncateV2TaskLabel(item.task_statement, 120);
    title.title = cardKey === 'functions'
        ? (item.function_statement || item.role_summary || '')
        : (item.task_statement || '');

    const meta = document.createElement('div');
    meta.className = 'v2-composition-chip-meta';
    const supportMap = cardKey === 'functions' ? getSelectedFunctionSupportMap() : null;
    const detailNodes = [];
    let metaText = cardKey === 'functions'
        ? `${Math.round((Number(item.function_weight) || 0) * 100)}% function weight`
        : `${item.task_family_label || formatTaskFamilyLabel(item.task_family_id || 'task')} · ${Math.round((Number(item.time_share_prior) || 0) * 100)}% baseline share`;
    meta.textContent = metaText;

    if (cardKey !== 'functions' && Array.isArray(item.linked_functions) && item.linked_functions.length) {
        const functionRead = item.linked_functions
            .map((entry) => {
                const label = entry.role_summary || entry.function_statement || formatV2Label(entry.function_category || 'function');
                return `${truncateV2TaskLabel(label, 54)} (${Math.round((Number(entry.task_to_function_weight) || 0) * 100)}%)`;
            })
            .join(' · ');
        const supportLine = document.createElement('div');
        supportLine.className = 'v2-composition-linkline';
        supportLine.textContent = `Supports: ${functionRead}`;
        detailNodes.push(supportLine);
    }
    if (cardKey === 'functions') {
        const supportedBy = supportMap?.get(item.function_id) || [];
        if (supportedBy.length) {
            const supportLine = document.createElement('div');
            supportLine.className = 'v2-composition-linkline';
            supportLine.textContent = `Currently supported by: ${supportedBy.slice(0, 3).map((entry) => truncateV2TaskLabel(entry.task_statement, 42)).join(' · ')}`;
            detailNodes.push(supportLine);
        }
    }

    if (cardKey !== 'functions') {
        const shareControls = document.createElement('div');
        shareControls.className = 'v2-composition-share-row';

        const shareLabel = document.createElement('label');
        shareLabel.className = 'v2-composition-share-label';
        shareLabel.textContent = 'Role share';

        const currentOverride = Number(v2RoleCompositionState?.taskShareOverrides?.[item.task_id]);
        const baselineShare = Math.round((Number(item.time_share_prior) || 0) * 100);

        const shareInput = document.createElement('input');
        shareInput.type = 'number';
        shareInput.className = 'v2-composition-share-input';
        shareInput.dataset.action = 'share-weight';
        shareInput.dataset.itemId = item.task_id;
        shareInput.min = '1';
        shareInput.max = '100';
        shareInput.placeholder = `${baselineShare}`;
        shareInput.setAttribute('aria-label', `Adjust role share for ${item.task_statement || 'selected task'}`);
        if (Number.isFinite(currentOverride) && currentOverride > 0) {
            shareInput.value = Math.round(currentOverride * 100);
        }

        shareLabel.appendChild(shareInput);
        shareControls.appendChild(shareLabel);
        body.appendChild(shareControls);
    }

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'v2-composition-remove';
    remove.textContent = 'Remove';
    remove.dataset.action = 'remove';
    remove.dataset.card = cardKey;
    remove.dataset.itemId = cardKey === 'functions' ? item.function_id : item.task_id;

    body.appendChild(title);
    body.appendChild(meta);
    detailNodes.forEach((node) => body.appendChild(node));
    chip.appendChild(body);
    chip.appendChild(remove);
    return chip;
}

function renderBreakdownCard(cardConfig) {
    const card = document.getElementById(`v2-breakdown-${cardConfig.key}`);
    if (!card) return;

    const rows = getBreakdownRowsForCard(cardConfig.key);
    const selectedIds = getBreakdownSelectedIds(cardConfig.key);
    const selectedRows = rows.filter((row) => selectedIds.has(cardConfig.key === 'functions' ? row.function_id : row.task_id));
    const availableRows = rows.filter((row) => !selectedIds.has(cardConfig.key === 'functions' ? row.function_id : row.task_id));

    card.hidden = !selectedRows.length && !availableRows.length;
    if (card.hidden) return;

    const title = card.querySelector('[data-role="title"]');
    const description = card.querySelector('[data-role="description"]');
    const activeList = card.querySelector('[data-role="active-list"]');
    const addSelect = card.querySelector('[data-role="add-select"]');
    const addButton = card.querySelector('[data-role="add-button"]');

    if (title) title.textContent = cardConfig.title;
    if (description) description.textContent = cardConfig.description;
    if (activeList) {
        activeList.innerHTML = '';
        if (!selectedRows.length) {
            const empty = document.createElement('div');
            empty.className = 'v2-composition-empty';
            empty.textContent = cardConfig.key === 'functions'
                ? 'No active functions in this card.'
                : 'No active tasks in this card.';
            activeList.appendChild(empty);
        } else {
            selectedRows.forEach((row) => {
                activeList.appendChild(createBreakdownChip(row, cardConfig.key));
            });
        }
    }

    if (addSelect) {
        addSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = cardConfig.key === 'functions' ? 'Add function from this occupation' : 'Add task from this occupation';
        addSelect.appendChild(placeholder);

        availableRows.forEach((row) => {
            const option = document.createElement('option');
            option.value = cardConfig.key === 'functions' ? row.function_id : row.task_id;
            option.textContent = cardConfig.key === 'functions'
                ? truncateV2TaskLabel(row.role_summary || row.function_statement || 'Unnamed function', 80)
                : truncateV2TaskLabel(row.task_statement, 92);
            addSelect.appendChild(option);
        });
        addSelect.disabled = !availableRows.length;
    }

    if (addButton) {
        addButton.disabled = !availableRows.length;
    }
}

function renderV2BreakdownCards() {
    if (!v2RoleCompositionState?.raw) {
        document.querySelectorAll('#v2-breakdown-cards .v2-composition-card').forEach((card) => {
            card.hidden = true;
        });
        return;
    }
    V2_BREAKDOWN_CARD_CONFIG.forEach(renderBreakdownCard);
    renderV2ClassicDependencyEditor();
}

function renderV2ClassicDependencyEditor() {
    const sourceSelect = document.getElementById('v2-dependency-source-classic');
    const targetSelect = document.getElementById('v2-dependency-target-classic');
    const addButton = document.getElementById('v2-dependency-add-classic');
    const listContainer = document.getElementById('v2-dependency-list-classic');
    if (!sourceSelect || !targetSelect || !addButton || !listContainer) return;

    const selectedTasks = getSelectedCompositionTasks();

    sourceSelect.innerHTML = '';
    targetSelect.innerHTML = '';
    const sourcePlaceholder = document.createElement('option');
    sourcePlaceholder.value = '';
    sourcePlaceholder.textContent = 'Choose support task';
    sourceSelect.appendChild(sourcePlaceholder);
    const targetPlaceholder = document.createElement('option');
    targetPlaceholder.value = '';
    targetPlaceholder.textContent = 'Choose task it mainly supports';
    targetSelect.appendChild(targetPlaceholder);

    selectedTasks.forEach((task) => {
        const sOption = document.createElement('option');
        sOption.value = task.task_id;
        sOption.textContent = truncateV2TaskLabel(task.task_statement, 90);
        sourceSelect.appendChild(sOption);
        const tOption = document.createElement('option');
        tOption.value = task.task_id;
        tOption.textContent = truncateV2TaskLabel(task.task_statement, 90);
        targetSelect.appendChild(tOption);
    });

    listContainer.innerHTML = '';
    if (!v2CustomDependencyEdges.length) {
        const empty = document.createElement('div');
        empty.className = 'v2-composition-empty';
        empty.textContent = 'No custom support links added yet. Use this if one selected task mainly exists to support another selected task.';
        listContainer.appendChild(empty);
    } else {
        v2CustomDependencyEdges.forEach((edge) => {
            const sourceTask = selectedTasks.find((t) => t.task_id === edge.from_task_id);
            const targetTask = selectedTasks.find((t) => t.task_id === edge.to_task_id);
            if (!sourceTask || !targetTask) return;

            const row = document.createElement('div');
            row.className = 'v2-dependency-item';

            const label = document.createElement('div');
            label.className = 'v2-dependency-label';
            label.textContent = `${truncateV2TaskLabel(sourceTask?.task_statement || 'Unknown task', 72)} supports ${truncateV2TaskLabel(targetTask?.task_statement || 'Unknown task', 72)}`;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'v2-composition-remove';
            removeBtn.textContent = 'Remove';
            removeBtn.dataset.action = 'remove-dependency-link';
            removeBtn.dataset.fromTaskId = edge.from_task_id;
            removeBtn.dataset.toTaskId = edge.to_task_id;

            row.appendChild(label);
            row.appendChild(removeBtn);
            listContainer.appendChild(row);
        });
    }
}

// ─── Graph-based flow map ────────────────────────────────────────────────────

function renderV2RoleFlowMap() {
    const summary = document.getElementById('v2-flow-map-summary');
    const helper = document.getElementById('v2-role-graph-helper');
    if (!summary || !helper) return;

    const selectedTasks = sortTasksByDisplayOrder(getSelectedCompositionTasks());
    const selectedFunctions = getSelectedCompositionFunctions();
    const flowEdges = getCombinedFlowEdges();
    const supportMap = getSelectedFunctionSupportMap();
    const positions = getGraphNodePositions(selectedTasks, selectedFunctions, flowEdges);
    updateGraphModeButtons();

    if (!v2RoleCompositionState?.raw || (!selectedTasks.length && !selectedFunctions.length)) {
        summary.textContent = 'Select an occupation to load the role graph.';
        helper.textContent = 'The graph editor will appear once a mapped occupation is selected.';
        renderStudioAddControls();
        getRoleGraphController().then((controller) => {
            controller.render({ nodes: [], edges: [], mode: v2GraphMode });
        }).catch((error) => {
            console.error('[V2] Failed to render empty role graph:', error);
        });
        return;
    }

    summary.textContent = 'Edit the role as a live graph. Drag nodes, connect tasks to tasks or functions, and remove custom links without leaving the role map.';
    helper.textContent = v2GraphMode === 'remove-link'
        ? 'Click any custom edge to remove it from the model.'
        : 'Drag nodes to reorganize the view. Create links by dragging from a task handle into another task or a function.';

    const nodeState = [];
    selectedTasks.forEach((task) => {
        const currentOverride = Number(v2RoleCompositionState?.taskShareOverrides?.[task.task_id]);
        const functionLinks = getTaskFunctionLinks(task);
        nodeState.push({
            id: getGraphNodeKey('task', task.task_id),
            kind: 'task',
            position: positions[getGraphNodeKey('task', task.task_id)],
            taskId: task.task_id,
            title: task.task_statement || 'Unknown task',
            sourceLabel: task.source_label || 'Task',
            baselineShare: Math.round((Number(task.time_share_prior) || 0) * 100),
            shareOverride: Number.isFinite(currentOverride) ? currentOverride.toFixed(2) : '',
            taskLinkCount: flowEdges.filter((edge) => edge.from_task_id === task.task_id).length,
            functionLabels: functionLinks.map((entry) => ({
                functionId: entry.function_id,
                label: entry.role_summary || entry.function_statement || 'Function',
                isCustom: !!entry.is_custom
            }))
        });
    });
    selectedFunctions.forEach((fn) => {
        nodeState.push({
            id: getGraphNodeKey('function', fn.function_id),
            kind: 'function',
            position: positions[getGraphNodeKey('function', fn.function_id)],
            functionId: fn.function_id,
            title: fn.role_summary || fn.function_statement || 'Unnamed function',
            supportCount: (supportMap.get(fn.function_id) || []).length
        });
    });

    const edgeState = [];
    flowEdges.forEach((edge) => {
        edgeState.push({
            id: `dep:${edge.from_task_id}->${edge.to_task_id}`,
            source: getGraphNodeKey('task', edge.from_task_id),
            target: getGraphNodeKey('task', edge.to_task_id),
            kind: 'task',
            custom: edge.edge_type === 'custom'
        });
    });
    selectedTasks.forEach((task) => {
        getTaskFunctionLinks(task).forEach((entry) => {
            if (!selectedFunctions.some((fn) => fn.function_id === entry.function_id)) return;
            edgeState.push({
                id: `fn:${task.task_id}->${entry.function_id}`,
                source: getGraphNodeKey('task', task.task_id),
                target: getGraphNodeKey('function', entry.function_id),
                kind: 'function',
                custom: !!entry.is_custom
            });
        });
    });

    getRoleGraphController().then((controller) => {
        controller.render({
            nodes: nodeState,
            edges: edgeState,
            mode: v2GraphMode
        });
    }).catch((error) => {
        console.error('[V2] Failed to render React Flow graph:', error);
    });

    renderStudioAddControls();
}

function renderV2RoleVariantControls(composition) {
    const step = document.getElementById('v2-intake-step-variant');
    const panel = document.getElementById('v2-role-variant-panel');
    const headline = document.getElementById('v2-role-variant-headline');
    const summary = document.getElementById('v2-role-variant-summary');
    const select = document.getElementById('v2-role-variant-select');
    const note = document.getElementById('v2-role-variant-note');
    const stepCopy = document.getElementById('v2-role-variant-step-copy');

    if (!step || !panel || !headline || !summary || !select || !note || !stepCopy) {
        return;
    }

    const variantSupport = composition?.variant_support;
    const variants = Array.isArray(composition?.variants) ? composition.variants : [];
    if (!variantSupport?.enabled || !variants.length) {
        step.hidden = true;
        panel.hidden = true;
        select.innerHTML = '<option value="">No reviewed role variants for this occupation yet</option>';
        note.textContent = '';
        summary.textContent = 'This occupation currently uses one occupation-wide baseline before you edit tasks and functions.';
        return;
    }

    step.hidden = false;
    panel.hidden = false;
    headline.textContent = 'Optional: choose the closest reviewed version of this occupation';
    stepCopy.textContent = 'If reviewed versions exist for this occupation, you can keep the recommended baseline or choose the closest one here before you edit tasks and functions.';
    summary.textContent = variantSupport.selected_variant_summary
        ? `Current baseline: ${variantSupport.selected_variant_label}. ${variantSupport.selected_variant_summary}`
        : 'This occupation has reviewed role variants, and the model can start from the closest baseline before you edit tasks directly.';

    select.innerHTML = '';
    const autoOption = document.createElement('option');
    autoOption.value = '__auto__';
    autoOption.textContent = variantSupport.recommended_variant_label
        ? `Recommended baseline: ${variantSupport.recommended_variant_label}`
        : 'Recommended baseline';
    select.appendChild(autoOption);

    variants.forEach((variant) => {
        const option = document.createElement('option');
        option.value = variant.variant_id;
        option.textContent = variant.variant_label;
        select.appendChild(option);
    });
    select.value = v2RoleVariantPreference.mode === 'manual' && v2RoleVariantPreference.variantId
        ? v2RoleVariantPreference.variantId
        : '__auto__';

    if (v2RoleVariantPreference.mode === 'manual' && variantSupport.recommended_variant_label && variantSupport.recommended_variant_id !== variantSupport.selected_variant_id) {
        note.textContent = `You are using ${variantSupport.selected_variant_label}. Based on your questionnaire and current role mix, the model would currently recommend ${variantSupport.recommended_variant_label}.`;
        return;
    }

    const driverText = Array.isArray(variantSupport.recommendation_drivers) && variantSupport.recommendation_drivers.length
        ? variantSupport.recommendation_drivers.join(', ')
        : 'your questionnaire and current role mix';
    note.textContent = `The recommended baseline is inferred from ${driverText}. You can override it here, then keep editing tasks and functions directly.`;
}

function renderV2RoleComposition(composition) {
    const cards = document.getElementById('v2-composition-cards');
    const headline = document.getElementById('v2-composition-headline');
    const summary = document.getElementById('v2-composition-summary');

    if (!cards || !headline || !summary) return;

    if (!composition) {
        v2CustomDependencyEdges = [];
        headline.textContent = 'Select a mapped occupation to load the editable role composition.';
        summary.textContent = 'The model starts from the occupation baseline, then lets you edit tasks, workflow links, and functions in one studio before scoring.';
        renderV2RoleVariantControls(null);
        renderV2RoleFlowMap();
        renderV2DependencyEditor();
        renderV2BreakdownCards();
        return;
    }

    const onetCount = (composition.onet_tasks || []).filter((row) => v2RoleCompositionState.selectedTaskIds.has(row.task_id)).length;
    const reviewedPostingCount = (composition.reviewed_job_posting_tasks || []).filter((row) => v2RoleCompositionState.selectedTaskIds.has(row.task_id)).length;
    const reviewedManualCount = (composition.reviewed_role_graph_tasks || []).filter((row) => v2RoleCompositionState.selectedTaskIds.has(row.task_id)).length;
    const functionCount = (composition.functions || []).filter((row) => v2RoleCompositionState.selectedFunctionIds.has(row.function_id)).length;

    headline.textContent = 'This is the role composition the model will score next.';
    summary.textContent = `We start from ${onetCount} O*NET task${onetCount === 1 ? '' : 's'}, ${reviewedPostingCount} reviewed public-posting task${reviewedPostingCount === 1 ? '' : 's'}, ${reviewedManualCount} reviewed role-review task${reviewedManualCount === 1 ? '' : 's'}, and ${functionCount} value-defining function${functionCount === 1 ? '' : 's'}. ${composition.variant_support?.enabled ? `The current reviewed baseline is ${composition.variant_support.selected_variant_label}. ` : ''}Use the studio below only to correct what the default baseline gets wrong.`;
    renderV2RoleVariantControls(composition);
    renderV2RoleFlowMap();
    renderV2DependencyEditor();
    renderV2BreakdownCards();
}

async function populateV2RoleComposition(occupationId, preserveSelection = true) {
    if (!occupationId) {
        v2RoleCompositionState = null;
        renderV2RoleComposition(null);
        return null;
    }

    let engine;
    try {
        engine = await getV2Engine();
    } catch (error) {
        console.error('[V2] Failed to load role composition:', error);
        v2RoleCompositionState = null;
        renderV2RoleComposition(null);
        return null;
    }

    const previousState = preserveSelection && v2RoleCompositionState?.occupationId === occupationId
        ? v2RoleCompositionState
        : null;
    const previousDependencies = preserveSelection && v2RoleCompositionState?.occupationId === occupationId
        ? v2CustomDependencyEdges.slice()
        : [];
    const previousTaskFunctionLinks = preserveSelection && v2RoleCompositionState?.occupationId === occupationId
        ? v2CustomTaskFunctionLinks.slice()
        : [];
    const previousGraphPositions = preserveSelection && v2RoleCompositionState?.occupationId === occupationId
        ? { ...v2GraphNodePositions }
        : {};
    const recommendationEdits = previousState ? getCompositionEditsForEngine() : {};
    const composition = engine.getRoleComposition(occupationId, {
        roleVariantId: v2RoleVariantPreference.mode === 'manual' ? v2RoleVariantPreference.variantId : null,
        questionnaireProfile: buildCurrentQuestionnaireProfile(),
        compositionEdits: recommendationEdits
    });
    if (!composition) {
        v2RoleCompositionState = null;
        renderV2RoleComposition(null);
        return null;
    }

    v2RoleCompositionState = {
        raw: composition,
        ...createCompositionSelectionState(composition)
    };
    v2CustomDependencyEdges = [];
    v2CustomTaskFunctionLinks = [];
    v2GraphNodePositions = {};

    const shouldPreserveSelection = previousState && !(
        v2RoleVariantPreference.mode === 'auto' &&
        isCompositionPristineForAutoMode(previousState, previousDependencies, previousTaskFunctionLinks)
    );

    if (shouldPreserveSelection) {
        v2RoleCompositionState.selectedTaskIds = new Set(
            Array.from(previousState.selectedTaskIds || []).filter((taskId) => {
                return composition.onet_tasks.concat(composition.reviewed_job_posting_tasks, composition.reviewed_role_graph_tasks)
                    .some((row) => row.task_id === taskId);
            })
        );
        if (!v2RoleCompositionState.selectedTaskIds.size) {
            v2RoleCompositionState.selectedTaskIds = new Set(composition.defaults.task_ids || []);
        }
        v2RoleCompositionState.selectedFunctionIds = new Set(
            Array.from(previousState.selectedFunctionIds || []).filter((functionId) => {
                return (composition.functions || []).some((row) => row.function_id === functionId);
            })
        );
        if (!v2RoleCompositionState.selectedFunctionIds.size) {
            v2RoleCompositionState.selectedFunctionIds = new Set(composition.defaults.function_ids || []);
        }
        v2RoleCompositionState.taskShareOverrides = Object.fromEntries(
            Object.entries(previousState.taskShareOverrides || {}).filter(([taskId, value]) => {
                const exists = composition.onet_tasks.concat(composition.reviewed_job_posting_tasks, composition.reviewed_role_graph_tasks)
                    .some((row) => row.task_id === taskId);
                return exists && Number.isFinite(Number(value));
            }).map(([taskId, value]) => [taskId, Number(value)])
        );
        v2RoleCompositionState.taskDisplayOrder = Array.from(previousState.taskDisplayOrder || []).filter((taskId) => {
            return composition.onet_tasks.concat(composition.reviewed_job_posting_tasks, composition.reviewed_role_graph_tasks)
                .some((row) => row.task_id === taskId);
        });
        Array.from(v2RoleCompositionState.selectedTaskIds).forEach((taskId) => {
            if (!v2RoleCompositionState.taskDisplayOrder.includes(taskId)) {
                v2RoleCompositionState.taskDisplayOrder.push(taskId);
            }
        });
        v2CustomDependencyEdges = previousDependencies.filter((edge) => {
            return v2RoleCompositionState.selectedTaskIds.has(edge.from_task_id) && v2RoleCompositionState.selectedTaskIds.has(edge.to_task_id);
        });
        v2CustomTaskFunctionLinks = previousTaskFunctionLinks.filter((link) => {
            return v2RoleCompositionState.selectedTaskIds.has(link.task_id) && v2RoleCompositionState.selectedFunctionIds.has(link.function_id);
        });
        v2GraphNodePositions = { ...previousGraphPositions };
    }

    renderV2RoleComposition(composition);
    return composition;
}

function getSelectedCompositionTasks() {
    if (!v2RoleCompositionState?.raw) return [];
    const allTasks = []
        .concat(v2RoleCompositionState.raw.onet_tasks || [])
        .concat(v2RoleCompositionState.raw.reviewed_job_posting_tasks || [])
        .concat(v2RoleCompositionState.raw.reviewed_role_graph_tasks || []);

    return allTasks
        .filter((task) => v2RoleCompositionState.selectedTaskIds.has(task.task_id))
        .sort((left, right) => getEffectiveTaskShare(right) - getEffectiveTaskShare(left));
}

function getDependencyEditsForEngine() {
    return {
        added_edges: (v2CustomDependencyEdges || []).map((edge) => ({
            from_task_id: edge.from_task_id,
            to_task_id: edge.to_task_id
        }))
    };
}

function renderV2DependencyEditor() {
    const sourceSelect = document.getElementById('v2-dependency-source');
    const targetSelect = document.getElementById('v2-dependency-target');
    const list = document.getElementById('v2-dependency-list');
    const addButton = document.getElementById('v2-dependency-add');

    if (!sourceSelect || !targetSelect || !list || !addButton) return;

    const selectedTasks = getSelectedCompositionTasks();
    const selectedTaskLookup = new Map(selectedTasks.map((task) => [task.task_id, task]));
    v2CustomDependencyEdges = v2CustomDependencyEdges.filter((edge) => selectedTaskLookup.has(edge.from_task_id) && selectedTaskLookup.has(edge.to_task_id));

    [sourceSelect, targetSelect].forEach((select, index) => {
        const priorValue = select.value || '';
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = index === 0 ? 'Choose support task' : 'Choose task it mainly supports';
        select.appendChild(placeholder);

        selectedTasks.forEach((task) => {
            const option = document.createElement('option');
            option.value = task.task_id;
            option.textContent = truncateV2TaskLabel(task.task_statement, 90);
            select.appendChild(option);
        });

        select.value = selectedTasks.some((task) => task.task_id === priorValue) ? priorValue : '';
        select.disabled = selectedTasks.length < 2;
    });

    list.innerHTML = '';
    if (!v2CustomDependencyEdges.length) {
        const empty = document.createElement('div');
        empty.className = 'v2-composition-empty';
        empty.textContent = 'No custom support links added yet. Use this if one selected task mainly exists to support another selected task.';
        list.appendChild(empty);
    } else {
        v2CustomDependencyEdges.forEach((edge, index) => {
            const row = document.createElement('div');
            row.className = 'v2-dependency-item';

            const label = document.createElement('div');
            label.className = 'v2-dependency-label';
            const sourceTask = selectedTaskLookup.get(edge.from_task_id);
            const targetTask = selectedTaskLookup.get(edge.to_task_id);
            label.textContent = `${truncateV2TaskLabel(sourceTask?.task_statement || 'Unknown task', 72)} supports ${truncateV2TaskLabel(targetTask?.task_statement || 'Unknown task', 72)}`;

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'v2-composition-remove';
            remove.textContent = 'Remove';
            remove.dataset.action = 'remove-dependency';
            remove.dataset.edgeIndex = String(index);

            row.appendChild(label);
            row.appendChild(remove);
            list.appendChild(row);
        });
    }

    addButton.disabled = selectedTasks.length < 2;
    renderV2RoleFlowMap();
}

// initializeOccupationSearch is defined inside the DOMContentLoaded handler
// because it references the occupationSearchLookup Map and DOM elements
// scoped to that closure.

// ─── 7. V2 Rendering functions ──────────────────────────────────────────────

let v2StateForecastChart = null;
let v2StateShareChart = null;
let v2StateTrajectoryChart = null;
let v2OccupationOutcomeChart = null;

function createClusterListItem(cluster, options = {}) {
    const shareKey = options.shareKey || 'share_of_role';
    const confidence = Number(cluster?.evidence_confidence);
    const share = Math.max(0, Math.min(1, Number(cluster?.[shareKey]) || 0));
    const sharePct = `${Math.round(share * 100)}%`;

    const item = document.createElement('div');
    item.className = 'v2-cluster-item';

    const topline = document.createElement('div');
    topline.className = 'v2-cluster-topline';

    const label = document.createElement('span');
    label.className = 'v2-cluster-label';
    label.textContent = cluster?.label || 'Unknown row';
    label.title = cluster?.full_label || cluster?.label || 'Unknown row';

    const shareEl = document.createElement('span');
    shareEl.className = 'v2-cluster-share';
    shareEl.textContent = sharePct;

    topline.appendChild(label);
    topline.appendChild(shareEl);

    const bar = document.createElement('div');
    bar.className = 'v2-cluster-bar';

    const fill = document.createElement('div');
    fill.className = 'v2-cluster-bar-fill';
    fill.style.width = sharePct;
    bar.appendChild(fill);

    const meta = document.createElement('div');
    meta.className = 'v2-cluster-meta';

    const parts = [];
    if (cluster?.secondary_label) {
        parts.push(cluster.secondary_label);
    }
    if (cluster?.likely_mode) {
        parts.push(formatV2Label(cluster.likely_mode));
    }
    if (cluster?.confidence_badge) {
        parts.push(cluster.confidence_badge);
    } else if (Number.isFinite(confidence)) {
        parts.push(`${Math.round(confidence * 100)}% evidence`);
    }
    if (cluster?.confidence_note) {
        parts.push(cluster.confidence_note);
    }
    if (cluster?.evidence_badge) {
        parts.push(cluster.evidence_badge);
    }
    meta.textContent = parts.join(' · ') || 'Role-weighted row';

    item.appendChild(topline);
    item.appendChild(bar);
    item.appendChild(meta);
    return item;
}



function buildRoleFateSignalRows(taskBreakdown, signal) {
    const rows = Array.isArray(taskBreakdown?.tasks) ? taskBreakdown.tasks.slice() : [];
    if (!rows.length) {
        return [];
    }

    const scoredRows = rows.map((task) => {
        let signalShare = 0;
        let secondaryLabel = task?.public_task_cluster_label || task?.task_cluster_label || 'Mapped task family';
        let likelyMode = task?.likely_mode || null;

        if (signal === 'current') {
            signalShare = Number(task?.share_of_role) || 0;
            secondaryLabel = `${secondaryLabel} · current role share`;
        } else if (signal === 'bargaining') {
            signalShare = (Number(task?.share_of_role) || 0) * Math.max(
                Number(task?.bargaining_power_weight) || 0,
                Number(task?.value_centrality) || 0
            );
            secondaryLabel = `${secondaryLabel} · bargaining leverage`;
        } else if (signal === 'direct') {
            signalShare = (Number(task?.share_of_role) || 0) * (Number(task?.direct_exposure_pressure) || 0);
            secondaryLabel = `${secondaryLabel} · direct AI pressure`;
            likelyMode = 'pressure';
        } else if (signal === 'indirect') {
            signalShare = (Number(task?.share_of_role) || 0) * (Number(task?.indirect_dependency_pressure) || 0);
            secondaryLabel = `${secondaryLabel} · spillover risk`;
            likelyMode = 'spillover';
        } else if (signal === 'retained') {
            signalShare = (Number(task?.retained_share) || 0) * (Number(task?.retained_leverage) || 0);
            secondaryLabel = `${secondaryLabel} · retained leverage`;
            likelyMode = 'retained';
        }

        if (task?.is_user_selected_critical) {
            secondaryLabel += ' · user-tagged core task';
        } else if (task?.is_user_selected_support_task) {
            secondaryLabel += ' · user-tagged support task';
        } else if (task?.is_user_selected_ai_support) {
            secondaryLabel += ' · user-tagged AI assist';
        }

        return {
            label: task?.task_statement || 'Unknown task',
            full_label: task?.task_statement || 'Unknown task',
            secondary_label: secondaryLabel,
            likely_mode: likelyMode,
            evidence_confidence: Number(task?.evidence_confidence) || 0,
            evidence_badge: task?.has_direct_evidence ? 'Direct evidence' : 'Fallback estimate',
            signal_share: Number(signalShare.toFixed(4)),
            share_of_role: Number(task?.share_of_role) || 0
        };
    });

    return scoredRows
        .filter((task) => task.signal_share >= 0.01)
        .sort((left, right) => {
            if (right.signal_share !== left.signal_share) {
                return right.signal_share - left.signal_share;
            }
            return right.share_of_role - left.share_of_role;
        })
        .slice(0, 5);
}

function buildRoleFateMap(taskBreakdown) {
    return {
        current_role: buildRoleFateSignalRows(taskBreakdown, 'current'),
        bargaining_power: buildRoleFateSignalRows(taskBreakdown, 'bargaining'),
        direct_pressure: buildRoleFateSignalRows(taskBreakdown, 'direct'),
        indirect_spillover: buildRoleFateSignalRows(taskBreakdown, 'indirect'),
        retained_leverage: buildRoleFateSignalRows(taskBreakdown, 'retained')
    };
}

function formatSignedShareDelta(delta) {
    const numeric = Number(delta) || 0;
    const whole = Math.round(Math.abs(numeric) * 100);
    return `${numeric >= 0 ? '+' : '-'}${whole}% share`;
}

function buildAccessionDisplayRows(taskAccessionMap, mode) {
    const rows = mode === 'shrinking'
        ? (taskAccessionMap?.shrinking_clusters || [])
        : (taskAccessionMap?.accession_clusters || []);

    return rows.map((row) => {
        if (mode === 'shrinking') {
            return {
                label: row.public_label || row.task_cluster_label || 'Unknown bundle',
                full_label: row.public_label || row.task_cluster_label || 'Unknown bundle',
                secondary_label: `${formatV2Label(row.primary_pressure || 'direct')} pressure`,
                likely_mode: 'shrinks',
                evidence_confidence: Number(row.confidence) || Number(taskAccessionMap?.accession_confidence) || 0,
                confidence_badge: row.confidence_label || null,
                confidence_note: row.confidence_reason || null,
                evidence_badge: formatSignedShareDelta(row.net_share_delta),
                signal_share: Number(row.shrink_score) || 0,
                share_of_role: Math.max(Number(row.shrink_score) || 0, 0)
            };
        }

        return {
            label: row.public_label || row.task_cluster_label || 'Unknown bundle',
            full_label: row.public_label || row.task_cluster_label || 'Unknown bundle',
            secondary_label: `${formatV2Label(row.accession_kind || 'integration')} work`,
            likely_mode: 'grows',
            evidence_confidence: Number(row.confidence) || Number(taskAccessionMap?.accession_confidence) || 0,
            confidence_badge: row.confidence_label || null,
            confidence_note: row.confidence_reason || null,
            evidence_badge: formatSignedShareDelta(row.net_share_delta),
            signal_share: Number(row.accession_score) || 0,
            share_of_role: Math.max(Number(row.accession_score) || 0, 0)
        };
    });
}

function renderV2TransitionTriggers(transitionTriggerMap) {
    const container = document.getElementById('v2-trigger-grid');
    if (!container) return;

    container.innerHTML = '';
    const rows = Array.isArray(transitionTriggerMap?.triggers) ? transitionTriggerMap.triggers.slice(0, 4) : [];
    if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'v2-cluster-item';
        empty.textContent = 'Transition thresholds appear once the role is scored.';
        container.appendChild(empty);
        return;
    }

    rows.forEach((row, index) => {
        const card = document.createElement('article');
        card.className = 'r-trigger-card';

        const topline = document.createElement('div');
        topline.className = 'r-trigger-topline';

        const stage = document.createElement('span');
        stage.className = 'r-trigger-stage';
        stage.textContent = `0${index + 1}`;

        const title = document.createElement('h4');
        title.className = 'r-trigger-title';
        title.textContent = row.trigger_label || 'Trigger';

        topline.appendChild(stage);
        topline.appendChild(title);

        const score = document.createElement('div');
        score.className = 'r-trigger-score';
        score.textContent = `${Math.round((Number(row.readiness_score) || 0) * 100)}% readiness`;

        const bar = document.createElement('div');
        bar.className = 'v2-cluster-bar';
        const fill = document.createElement('div');
        fill.className = 'v2-cluster-bar-fill';
        fill.style.width = `${Math.round((Number(row.readiness_score) || 0) * 100)}%`;
        bar.appendChild(fill);

        const meta = document.createElement('div');
        meta.className = 'r-trigger-meta';
        meta.appendChild(createV2TaskChip(row.readiness_label || 'Not there yet', 'accent'));
        if (row.confidence_label) {
            const tone = row.confidence_label === 'Strong evidence'
                ? 'success'
                : (row.confidence_label === 'Thin evidence' ? 'warning' : '');
            meta.appendChild(createV2TaskChip(row.confidence_label, tone));
        }

        const threshold = document.createElement('p');
        threshold.className = 'r-trigger-copy';
        threshold.textContent = row.threshold_summary || '-';

        const mechanism = document.createElement('p');
        mechanism.className = 'r-trigger-copy';
        mechanism.textContent = row.mechanism_summary || '-';

        const consequence = document.createElement('p');
        consequence.className = 'r-trigger-copy r-trigger-copy--muted';
        consequence.textContent = row.consequence_summary || '-';

        const confidence = document.createElement('p');
        confidence.className = 'r-trigger-copy r-trigger-copy--muted';
        confidence.textContent = row.confidence_reason
            ? `Confidence: ${row.confidence_reason}.`
            : `Confidence: ${row.confidence_label || 'Mixed evidence'}.`;

        card.appendChild(topline);
        card.appendChild(score);
        card.appendChild(bar);
        card.appendChild(meta);
        card.appendChild(threshold);
        card.appendChild(mechanism);
        card.appendChild(consequence);
        card.appendChild(confidence);
        container.appendChild(card);
    });
}


function renderV2ClusterList(containerId, clusters, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const rows = Array.isArray(clusters) ? clusters.slice(0, options.limit || 5) : [];
    if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'v2-cluster-item';
        empty.textContent = options.emptyText || 'No cluster evidence available yet.';
        container.appendChild(empty);
        return;
    }

    rows.forEach(cluster => {
        container.appendChild(createClusterListItem(cluster, options));
    });
}

function createV2TaskChip(text, tone = '') {
    const chip = document.createElement('span');
    chip.className = `v2-task-chip${tone ? ` v2-task-chip--${tone}` : ''}`;
    chip.textContent = text;
    return chip;
}

function describeV2TaskCausality(task) {
    if (!task) {
        return 'This task row is using the current role mix and fallback task-family structure.';
    }

    const reasons = [];
    const baselineSource = task.automation_difficulty_baseline_source || 'cluster_priors';
    const automationSource = task.automation_difficulty_source || 'cluster_model';
    const pressureSource = task.direct_pressure_source || 'cluster_model';

    if (baselineSource === 'task_first_resolved_evidence') {
        reasons.push('The baseline already starts from task-level evidence rather than a cluster prior.');
    } else if (baselineSource === 'task_first_cluster_evidence') {
        reasons.push('The baseline starts from a task-evidence-adjusted cluster prior.');
    } else {
        reasons.push('The baseline starts from the cluster fallback model for this task family.');
    }

    if (automationSource === 'task_first_resolved_evidence') {
        reasons.push('Reliable task evidence is strong enough to anchor automation difficulty directly.');
    } else if (automationSource === 'resolved_task_evidence') {
        reasons.push('Reliable task evidence is blending into the final automation difficulty.');
    }

    if (pressureSource === 'resolved_task_evidence') {
        reasons.push('The direct-pressure score is also being adjusted by resolved task evidence.');
    } else {
        reasons.push('The direct-pressure score still mostly follows the structural role model for this task family.');
    }

    if ((Number(task.direct_evidence_reliability) || 0) > 0.2) {
        reasons.push(`Direct evidence reliability is ${Math.round((Number(task.direct_evidence_reliability) || 0) * 100)}%.`);
    } else {
        reasons.push('Direct evidence reliability is below the live promotion threshold, so fallback structure still matters more.');
    }

    if ((Number(task.mapping_confidence) || 0) < 0.5) {
        reasons.push('Task mapping confidence is modest, so the model dampens how aggressively task evidence can override the fallback.');
    }

    return reasons.join(' ');
}

async function copyTextToClipboard(text) {
    if (!text) {
        return false;
    }

    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (error) {
        console.warn('[V2] Clipboard API write failed, falling back:', error);
    }

    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textArea);
        return !!copied;
    } catch (error) {
        console.warn('[V2] Legacy clipboard fallback failed:', error);
        return false;
    }
}


function createV2TaskBreakdownItem(task) {
    const item = document.createElement('div');
    item.className = `v2-task-item${task?.is_role_critical ? ' v2-task-item--critical' : ''}`;

    const topline = document.createElement('div');
    topline.className = 'v2-task-topline';

    const statement = document.createElement('div');
    statement.className = 'v2-task-statement';
    statement.textContent = task?.task_statement || 'Unknown task';

    const share = document.createElement('div');
    share.className = 'v2-task-share';
    share.textContent = `${Math.round((Number(task?.share_of_role) || 0) * 100)}% of role`;

    topline.appendChild(statement);
    topline.appendChild(share);

    const meter = document.createElement('div');
    meter.className = 'v2-task-meter';

    const shareFill = document.createElement('div');
    shareFill.className = 'v2-task-meter-share';
    shareFill.style.width = `${Math.max(0, Math.min(100, (Number(task?.share_of_role) || 0) * 100))}%`;

    const exposedFill = document.createElement('div');
    exposedFill.className = 'v2-task-meter-exposed';
    exposedFill.style.width = `${Math.max(0, Math.min(100, (Number(task?.exposed_share) || 0) * 100))}%`;

    meter.appendChild(shareFill);
    meter.appendChild(exposedFill);

    const meta = document.createElement('div');
    meta.className = 'v2-task-meta';
    meta.appendChild(createV2TaskChip(task?.public_task_cluster_label || task?.task_cluster_label || 'Unknown task family', 'accent'));
    meta.appendChild(createV2TaskChip(`${formatV2Label(task?.exposure_level)} exposure`, task?.exposure_level === 'high' ? 'warning' : (task?.exposure_level === 'moderate' ? 'accent' : '')));
    meta.appendChild(createV2TaskChip(formatV2Label(task?.likely_mode || 'mixed'), task?.likely_mode === 'automation' ? 'warning' : 'success'));
    meta.appendChild(createV2TaskChip(`${Math.round((Number(task?.direct_exposure_pressure) || 0) * 100)}% direct pressure`, 'warning'));
    meta.appendChild(createV2TaskChip(`${Math.round((Number(task?.indirect_dependency_pressure) || 0) * 100)}% spillover`, 'accent'));
    meta.appendChild(createV2TaskChip(`${Math.round((Number(task?.retained_leverage) || 0) * 100)}% retained leverage`, 'success'));
    meta.appendChild(createV2TaskChip(task?.has_direct_evidence ? 'Direct task evidence' : 'Task-family fallback'));

    if (task?.is_role_critical) {
        meta.appendChild(createV2TaskChip('Role-defining task', 'accent'));
    }
    if (task?.is_user_selected_dominant) {
        meta.appendChild(createV2TaskChip('Selected current task'));
    }
    if (task?.is_user_selected_critical) {
        meta.appendChild(createV2TaskChip('Selected bargaining-power task', 'accent'));
    }
    if (task?.is_user_selected_ai_support) {
        meta.appendChild(createV2TaskChip('Selected AI-assisted task', 'success'));
    }
    if (task?.is_user_selected_support_task) {
        meta.appendChild(createV2TaskChip('Selected spillover task', 'warning'));
    }

    const footnote = document.createElement('div');
    footnote.className = 'v2-task-footnote';
    const evidenceCitation = task?.resolved_evidence_source_role
        ? `Evidence: ${formatV2Label(task.resolved_evidence_source_role)}${task?.evidence_source ? ` (${task.evidence_source})` : ''}.`
        : `Evidence: ${task?.task_source_label || 'task-family fallback'}.`;
    footnote.textContent = `${Math.round((Number(task?.exposed_share) || 0) * 100)}% exposed share, ${Math.round((Number(task?.retained_share) || 0) * 100)}% retained after transformation, and ${Math.round((Number(task?.indirect_dependency_pressure) || 0) * 100)}% spillover pressure from linked work. ${task?.mapping_method ? `Mapped via ${String(task.mapping_method).replace(/_/g, ' ')}. ` : ''}${evidenceCitation} ${describeV2TaskCausality(task)}`;

    item.appendChild(topline);
    item.appendChild(meter);
    item.appendChild(meta);
    item.appendChild(footnote);
    return item;
}

function renderV2TaskBreakdown(taskBreakdown, assignment) {
    const container = document.getElementById('v2-task-breakdown');
    const toggle = document.getElementById('v2-task-toggle');
    const tableWrap = document.getElementById('v2-task-table-wrap');
    if (!container) return;

    container.innerHTML = '';

    const allRows = Array.isArray(taskBreakdown?.tasks) ? taskBreakdown.tasks : [];
    const rows = v2TaskBreakdownExpanded ? allRows : [];
    const directCount = Number(taskBreakdown?.direct_evidence_tasks) || 0;
    const fallbackCount = Number(taskBreakdown?.cluster_fallback_tasks) || 0;

    safeSetText('v2-task-total', allRows.length ? `${rows.length} of ${taskBreakdown.total_tasks_considered}` : '-');
    safeSetText('v2-task-direct', taskBreakdown ? formatCoverageMetric(directCount, fallbackCount) : '-');
    safeSetText(
        'v2-task-summary-copy',
        assignment
            ? `${assignment.selected_occupation_title} currently resolves to ${taskBreakdown.total_tasks_considered || 0} active role tasks. This list live-updates as your composition edits and role-refinement answers change role share, direct pressure, spillover pressure, and retained leverage. Use “Show model details” if you want the evidence and fallback notes.`
            : 'Choose a mapped occupation to load its task inventory and the live role read.'
    );

    if (toggle) {
        const canExpand = allRows.length > 0;
        toggle.hidden = !canExpand;
        toggle.textContent = v2TaskBreakdownExpanded ? 'Hide tasks' : `See all ${allRows.length} tasks`;
        toggle.setAttribute('aria-expanded', v2TaskBreakdownExpanded ? 'true' : 'false');
    }
    if (tableWrap) {
        tableWrap.hidden = !v2TaskBreakdownExpanded || !allRows.length;
    }

    if (!allRows.length) {
        if (toggle) {
            toggle.hidden = true;
        }
        const empty = document.createElement('div');
        empty.className = 'v2-task-item';
        empty.textContent = 'No mapped task-level rows are available for this occupation yet.';
        container.appendChild(empty);
        return;
    }

    if (!rows.length) {
        return;
    }

    rows.forEach((task) => {
        container.appendChild(createV2TaskBreakdownItem(task));
    });
}





function getSelectedCompositionTasksWithSource() {
    if (!v2RoleCompositionState?.raw) {
        return [];
    }

    const groups = [
        { sourceLabel: 'O*NET baseline', rows: v2RoleCompositionState.raw.onet_tasks || [] },
        { sourceLabel: 'Reviewed public-posting task', rows: v2RoleCompositionState.raw.reviewed_job_posting_tasks || [] },
        { sourceLabel: 'Reviewed role-review task', rows: v2RoleCompositionState.raw.reviewed_role_graph_tasks || [] }
    ];

    return groups.flatMap((group) => group.rows
        .filter((row) => v2RoleCompositionState.selectedTaskIds.has(row.task_id))
        .map((row) => ({
            ...row,
            __sourceLabel: group.sourceLabel
        }))
    );
}







function renderOverviewList(containerId, items, emptyText) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'r-analysis-list-item r-analysis-list-item--empty';
        empty.textContent = emptyText;
        container.appendChild(empty);
        return;
    }

    items.forEach((text) => {
        const item = document.createElement('div');
        item.className = 'r-analysis-list-item';
        item.textContent = text;
        container.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// New r-dx- render functions (results page overhaul)
// ═══════════════════════════════════════════════════════════════════════════

function syncStateTrajectoryControls(result = null) {
    const stateTrajectory = result?.state_trajectory || null;
    const demandBias = stateTrajectory?.assumptions?.demand_bias ?? v2StateModelControls.demandBias ?? 0;
    const investmentBias = stateTrajectory?.assumptions?.investment_bias ?? v2StateModelControls.investmentBias ?? 0;
    const adoptionBias = stateTrajectory?.assumptions?.adoption_bias ?? v2StateModelControls.adoptionBias ?? 0;
    const exposureBias = stateTrajectory?.assumptions?.exposure_bias ?? v2StateModelControls.exposureBias ?? 0;
    const stayingBias = stateTrajectory?.assumptions?.staying_bias ?? v2StateModelControls.stayingBias ?? 0;
    const demandSlider = document.getElementById('v2-state-demand-bias');
    const investmentSlider = document.getElementById('v2-state-investment-bias');
    const adoptionSlider = document.getElementById('v2-state-adoption-bias');
    const exposureSlider = document.getElementById('v2-state-exposure-bias');
    const stayingSlider = document.getElementById('v2-state-staying-bias');

    if (demandSlider) {
        demandSlider.value = String(Math.max(-1, Math.min(1, Number(demandBias) || 0)));
    }
    if (investmentSlider) {
        investmentSlider.value = String(Math.max(-1, Math.min(1, Number(investmentBias) || 0)));
    }
    if (adoptionSlider) {
        adoptionSlider.value = String(Math.max(-1, Math.min(1, Number(adoptionBias) || 0)));
    }
    if (exposureSlider) {
        exposureSlider.value = String(Math.max(-1, Math.min(1, Number(exposureBias) || 0)));
    }
    if (stayingSlider) {
        stayingSlider.value = String(Math.max(-1, Math.min(1, Number(stayingBias) || 0)));
    }

    safeSetText(
        'v2-state-demand-bias-value',
        formatContinuousStateAssumption(demandBias, {
            negativeStrong: 'Demand strongly capped',
            negativeSoft: 'Demand somewhat capped',
            neutral: 'Demand near baseline',
            positiveSoft: 'Demand somewhat expanding',
            positiveStrong: 'Demand strongly expanding'
        })
    );
    safeSetText(
        'v2-state-investment-bias-value',
        formatContinuousStateAssumption(investmentBias, {
            negativeStrong: 'Firms moving much slower',
            negativeSoft: 'Firms moving somewhat slower',
            neutral: 'Firms moving near baseline',
            positiveSoft: 'Firms pushing somewhat harder',
            positiveStrong: 'Firms pushing much harder'
        })
    );
    safeSetText(
        'v2-state-adoption-bias-value',
        formatContinuousStateAssumption(adoptionBias, {
            negativeStrong: 'Adoption much slower',
            negativeSoft: 'Adoption somewhat slower',
            neutral: 'Adoption near baseline',
            positiveSoft: 'Adoption somewhat faster',
            positiveStrong: 'Adoption much faster'
        })
    );
    safeSetText(
        'v2-state-exposure-bias-value',
        formatContinuousStateAssumption(exposureBias, {
            negativeStrong: 'Exposure expanding much slower',
            negativeSoft: 'Exposure expanding somewhat slower',
            neutral: 'Exposure expansion near baseline',
            positiveSoft: 'Exposure expanding somewhat faster',
            positiveStrong: 'Exposure expanding much faster'
        })
    );
    safeSetText(
        'v2-state-staying-bias-value',
        formatContinuousStateAssumption(stayingBias, {
            negativeStrong: 'Staying power much weaker',
            negativeSoft: 'Staying power somewhat weaker',
            neutral: 'Staying power near baseline',
            positiveSoft: 'Staying power somewhat stronger',
            positiveStrong: 'Staying power much stronger'
        })
    );
}

function syncOccupationLandscapeControls() {
    const controls = v2OccupationLandscapeControls;
    const hierarchySelect = document.getElementById('v2-occupation-landscape-hierarchy');
    const demandSlider = document.getElementById('v2-occupation-demand-bias');
    const investmentSlider = document.getElementById('v2-occupation-investment-bias');
    const adoptionSlider = document.getElementById('v2-occupation-adoption-bias');
    const exposureSlider = document.getElementById('v2-occupation-exposure-bias');
    const stayingSlider = document.getElementById('v2-occupation-staying-bias');

    if (hierarchySelect) {
        hierarchySelect.value = String(controls.hierarchyLevel || 3);
    }
    if (demandSlider) demandSlider.value = String(Math.max(-1, Math.min(1, Number(controls.demandBias) || 0)));
    if (investmentSlider) investmentSlider.value = String(Math.max(-1, Math.min(1, Number(controls.investmentBias) || 0)));
    if (adoptionSlider) adoptionSlider.value = String(Math.max(-1, Math.min(1, Number(controls.adoptionBias) || 0)));
    if (exposureSlider) exposureSlider.value = String(Math.max(-1, Math.min(1, Number(controls.exposureBias) || 0)));
    if (stayingSlider) stayingSlider.value = String(Math.max(-1, Math.min(1, Number(controls.stayingBias) || 0)));

    safeSetText('v2-occupation-landscape-hierarchy-value', formatLandscapeHierarchyLabel(controls.hierarchyLevel));
    safeSetText('v2-occupation-controls-copy', buildOccupationLandscapeSettingsCopy());
    safeSetText(
        'v2-occupation-demand-bias-value',
        formatContinuousStateAssumption(controls.demandBias, {
            negativeStrong: 'Demand strongly capped',
            negativeSoft: 'Demand somewhat capped',
            neutral: 'Demand near baseline',
            positiveSoft: 'Demand somewhat expanding',
            positiveStrong: 'Demand strongly expanding'
        })
    );
    safeSetText(
        'v2-occupation-investment-bias-value',
        formatContinuousStateAssumption(controls.investmentBias, {
            negativeStrong: 'Firms moving much slower',
            negativeSoft: 'Firms moving somewhat slower',
            neutral: 'Firms moving near baseline',
            positiveSoft: 'Firms pushing somewhat harder',
            positiveStrong: 'Firms pushing much harder'
        })
    );
    safeSetText(
        'v2-occupation-adoption-bias-value',
        formatContinuousStateAssumption(controls.adoptionBias, {
            negativeStrong: 'Adoption much slower',
            negativeSoft: 'Adoption somewhat slower',
            neutral: 'Adoption near baseline',
            positiveSoft: 'Adoption somewhat faster',
            positiveStrong: 'Adoption much faster'
        })
    );
    safeSetText(
        'v2-occupation-exposure-bias-value',
        formatContinuousStateAssumption(controls.exposureBias, {
            negativeStrong: 'Exposure expanding much slower',
            negativeSoft: 'Exposure expanding somewhat slower',
            neutral: 'Exposure expansion near baseline',
            positiveSoft: 'Exposure expanding somewhat faster',
            positiveStrong: 'Exposure expanding much faster'
        })
    );
    safeSetText(
        'v2-occupation-staying-bias-value',
        formatContinuousStateAssumption(controls.stayingBias, {
            negativeStrong: 'Staying power much weaker',
            negativeSoft: 'Staying power somewhat weaker',
            neutral: 'Staying power near baseline',
            positiveSoft: 'Staying power somewhat stronger',
            positiveStrong: 'Staying power much stronger'
        })
    );
}

function ensureTrajectorySectionsVisible() {
    [
        'v2-state-story',
        'v2-state-checkpoints',
        'v2-state-drivers',
        'v2-trajectory-why',
        'v2-trajectory-role-shape'
    ].forEach((id) => {
        const node = document.getElementById(id);
        if (node) {
            node.classList.add('is-visible');
        }
    });
}

function renderStateTrajectorySummary(result) {
    const stateTrajectory = result?.state_trajectory || null;
    syncStateTrajectoryControls(result);
    safeSetText('v2-state-headline', stateTrajectory?.headline || 'Structural state analysis will appear once the role is scored.');
    safeSetText('v2-state-current', formatStateTrajectoryStateLabel(stateTrajectory?.current_state));
    safeSetText('v2-state-next', formatStateTrajectoryStateLabel(stateTrajectory?.likely_next_state));
    safeSetText(
        'v2-state-long-run',
        formatStateTrajectoryStateLabel(stateTrajectory?.long_run_state)
    );
    safeSetText(
        'v2-state-bottleneck',
        stateTrajectory?.bottleneck_risk?.score !== undefined
            ? `${stateTrajectory.bottleneck_risk.label} · ${formatPercentWhole(stateTrajectory.bottleneck_risk.score)}`
            : '-'
    );
    safeSetText('v2-state-transition-headline', stateTrajectory?.primary_risk || '-');
    safeSetText(
        'v2-state-transition-copy',
        stateTrajectory
            ? `${stateTrajectory.dimensionality?.explanation || ''} ${stateTrajectory.bottleneck_risk?.explanation || ''}`.trim()
            : 'The transition read appears once the structural state model is available.'
    );
}

function renderStateExposureSummary(result) {
    const tasks = Array.isArray(result?.task_breakdown?.tasks) ? result.task_breakdown.tasks : [];
    const stateTimeline = result?.state_trajectory?.timeline?.baseline?.points || [];
    const year5Point = stateTimeline.reduce((best, entry) => (
        !best || Math.abs(Number(entry?.year) - 5) < Math.abs(Number(best?.year) - 5) ? entry : best
    ), null);
    const variantLabel = result?.occupation_assignment?.selected_composition?.variant_label || '';
    const questionnaireSource = result?.evidence_summary?.questionnaire_profile_source || '';
    const usesDefaultAnswers = !questionnaireSource || questionnaireSource === 'default_profile';
    const selectedComposition = result?.occupation_assignment?.selected_composition || {};
    const editedTasks = Number(selectedComposition.added_task_count || 0) + Number(selectedComposition.removed_task_count || 0);
    const editedFunctions = Number(selectedComposition.added_function_count || 0) + Number(selectedComposition.removed_function_count || 0);
    const hasRoleEdits = editedTasks > 0 || editedFunctions > 0;
    const directShare = clamp(tasks.reduce((sum, task) => sum + (Number(task?.share_of_role) || 0) * (Number(task?.direct_exposure_pressure) || 0), 0), 0, 1);
    const spilloverShare = clamp(tasks.reduce((sum, task) => sum + (Number(task?.share_of_role) || 0) * (Number(task?.indirect_dependency_pressure) || 0), 0), 0, 1);
    const retainedCore = clamp(Number(result?.seat_change_map?.retained_share_estimate), 0, 1);
    const year5Change = clamp(Number(year5Point?.transformed_share) || Number(result?.trajectory?.scenarios?.next?.compression) || 0, 0, 1);

    const basisCopyNode = document.getElementById('v2-state-basis-copy');
    if (basisCopyNode) {
        basisCopyNode.innerHTML = '';
        const basisParagraph = document.createElement('p');
        basisParagraph.textContent = `${variantLabel ? `The model starts from the reviewed ${variantLabel.toLowerCase()} baseline for this occupation` : 'The model starts from the reviewed occupation baseline'}, then adjusts for your hierarchy, ${usesDefaultAnswers ? 'the default role answers' : 'your role answers'}, and ${hasRoleEdits ? 'your task or function edits' : 'the current role mix'} before it rescales the forecast. The cards below show pressure on the work first; the chart below shows what that pressure means for the role.`;
        const explainerParagraph = document.createElement('p');
        explainerParagraph.textContent = 'The main chart shows how much of today’s role stays mostly intact, how much changes but still points toward a surviving seat, and how much reads as downside pressure over time. The smaller stacked chart below keeps the five public states visible underneath that balance, rather than treating them as task share or literal probability.';
        basisCopyNode.appendChild(basisParagraph);
        basisCopyNode.appendChild(explainerParagraph);
    }
    safeSetText('v2-state-exposure-direct', formatPercentWhole(directShare));
    safeSetText('v2-state-exposure-spillover', formatPercentWhole(spilloverShare));
    safeSetText('v2-state-exposure-year5', formatPercentWhole(year5Change));
    safeSetText('v2-state-exposure-core', formatPercentWhole(retainedCore));
}

function renderStateTrajectoryCheckpoints(result) {
    const container = document.getElementById('v2-state-summary-cards');
    const stateTrajectory = result?.state_trajectory || null;
    if (!container) return;
    container.innerHTML = '';

    const forecast = buildStateForecastData(stateTrajectory, 5);
    if (!stateTrajectory?.timeline || !forecast?.points?.length) {
        return;
    }

    const year5Point = forecast.year5Point?.point || null;
    const firstShiftLabel = forecast.firstShift
        ? `${formatForecastStateLabel(forecast.firstShift.dominantState)} ${formatYearsApprox(forecast.firstShift.year)}`
        : 'No major shift inside 5 years';
    const fastestLabel = forecast.fastestShiftYear !== null && forecast.fastestShiftYear !== undefined
        ? formatYearsWindow(forecast.fastestShiftYear)
        : 'Still gradual';
    const year5StateLabel = formatForecastStateLabel(forecast.dominantYear5State);
    const intactByYear5 = year5Point ? Math.round((Number(year5Point.role_integrity) || 0) * 100) : null;
    const displacedByYear5 = forecast.year5Point ? Math.round((Number(forecast.year5Point.shares.displaced) || 0) * 100) : null;

    [
        {
            label: 'First structural shift',
            value: firstShiftLabel,
            copy: 'The first point where the forecasted dominant state stops matching today.'
        },
        {
            label: 'Fastest transition period',
            value: fastestLabel,
            copy: 'Where the underlying role configuration changes fastest.'
        },
        {
            label: 'Dominant state by year 5',
            value: year5StateLabel,
            copy: 'The most likely occupational state at the practical five-year horizon.'
        },
        {
            label: 'Role mostly intact by year 5',
            value: intactByYear5 !== null ? `${intactByYear5}%` : '-',
            copy: 'How much of today’s job shape still holds together by year 5.'
        },
        {
            label: 'Displacement risk by year 5',
            value: displacedByYear5 !== null ? `${displacedByYear5}%` : '-',
            copy: 'The displaced-state share in the year-5 forecast, not a job-loss guarantee.'
        }
    ].forEach((item) => {
        const card = document.createElement('article');
        card.className = 'r-state-summary-card';
        card.innerHTML = `
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            <p>${item.copy}</p>
        `;
        container.appendChild(card);
    });
}

function renderStateTrajectoryDrivers(result) {
    const container = document.getElementById('v2-state-driver-grid');
    const stateTrajectory = result?.state_trajectory || null;
    if (!container) return;
    container.innerHTML = '';

    const drivers = Array.isArray(stateTrajectory?.transition_conditions)
        ? stateTrajectory.transition_conditions
        : [];

    drivers.forEach((driver, index) => {
        const card = document.createElement('article');
        card.className = 'r-analysis-column';
        card.innerHTML = `
            <div class="r-analysis-column-index">${String(index + 1).padStart(2, '0')}</div>
            <h3>${driver.label || '-'}</h3>
            <div class="r-analysis-column-body">
                <p class="r-analysis-column-note">${driver.summary || '-'}</p>
                <div class="r-analysis-column-list">
                    <div class="r-analysis-list-item">
                        <strong>${formatPercentWhole(driver.score)}</strong>
                        <span>Current state weight</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}



// State forecast share weights: map continuous engine signals into the five
// user-facing occupation states. Each row is one state; columns are the engine
// dimensions that contribute positively (+) or negatively (-) to that state's
// share. The dominant-state boost and per-state bonuses push the classified
// engine state into the lead so the chart's dominant color matches the engine's
// discrete classification even when the continuous signals are close.
//
// Calibration basis: tuned against the 63-occupation launch set so that
// year-0 shares agree with the engine's discrete state classification for
// >90% of occupations, and the year-5 dominant state tracks the engine's
// distant-scenario state for >85%.
const STATE_FORECAST_WEIGHTS = Object.freeze({
    retained: {
        role_integrity: 0.92,          // high integrity = more retained
        structural_support: 0.28,      // structural anchors help retention
        transformed_share: -0.42,      // more transformation = less retained
        transition_pressure: -0.24     // pressure erodes retention
    },
    complemented: {
        demand_offset: 0.52,           // demand growth is the main complement driver
        role_integrity: 0.26,          // intact roles can be complemented
        structural_support: 0.12,      // modest structural contribution
        transformed_share: -0.08       // slight drag from transformation
    },
    compressed: {
        transformed_share: 0.84,       // transformation is the primary compression signal
        transition_pressure: 0.56,     // pressure accelerates compression
        bottleneck_risk: 0.14,         // fragile bottlenecks add compression risk
        demand_offset: -0.22,          // demand offsets compression
        structural_support: -0.20      // structural anchors resist compression
    },
    rebundled: {
        structural_support: 0.34,      // structural anchors enable rebundling
        transformed_share: 0.34,       // transformation creates rebundling opportunity
        role_integrity: 0.18,          // some integrity needed to rebundle
        demand_offset: 0.08,           // slight demand contribution
        bottleneck_risk: -0.10         // fragile bottlenecks hinder rebundling
    },
    displaced: {
        inverse_integrity: 0.82,       // applied to (1 - integrity), not a point field; low integrity is the primary displacement signal
        bottleneck_risk: 0.52,         // fragile bottlenecks accelerate displacement
        firm_incentive: 0.44,          // firms with incentive push toward displacement
        excess_transformation: 0.70,   // transformation beyond 0.32 threshold
        demand_offset: -0.24,          // demand resists displacement
        structural_support: -0.18      // structural anchors resist displacement
    },
    // Displacement only counts transformation above this threshold
    displaced_transformation_floor: 0.32,
    // The engine's classified state gets this additive boost so the chart's
    // dominant color matches the discrete classification
    // Audit 2026-03-28: lowered from 0.42 to 0.24 so the continuous signals
    // (integrity, compression, demand, bottleneck) visibly compete in the
    // forecast chart rather than being overwhelmed by the discrete classification.
    dominant_state_boost: 0.24,
    // Per-state bonuses for specific engine states that would otherwise be
    // under-represented in the continuous mapping
    state_bonuses: Object.freeze({
        demand_expanding: { complemented: 0.12 },
        rebalanced: { rebundled: 0.14 },
        bottleneck_fragile: { compressed: 0.12 }
    })
});

function buildStateForecastData(stateTrajectory, maxYear = 10) {
    const timeline = stateTrajectory?.timeline || null;
    const baselinePoints = Array.isArray(timeline?.baseline?.points)
        ? timeline.baseline.points.filter((point) => Number(point.year) <= Number(maxYear) + 0.0001)
        : [];

    const W = STATE_FORECAST_WEIGHTS;

    const points = baselinePoints.map((point) => {
        const integrity = Number(point.role_integrity) || 0;
        const support = Number(point.structural_support) || 0;
        const transformed = Number(point.transformed_share) || 0;
        const pressure = Number(point.transition_pressure) || 0;
        const demand = Number(point.demand_offset) || 0;
        const bottleneck = Number(point.bottleneck_risk) || 0;
        const firmIncentive = Number(point.firm_incentive) || 0;

        const shares = {
            retained: Math.max(0,
                integrity * W.retained.role_integrity +
                support * W.retained.structural_support +
                transformed * W.retained.transformed_share +
                pressure * W.retained.transition_pressure),
            complemented: Math.max(0,
                demand * W.complemented.demand_offset +
                integrity * W.complemented.role_integrity +
                support * W.complemented.structural_support +
                transformed * W.complemented.transformed_share),
            compressed: Math.max(0,
                transformed * W.compressed.transformed_share +
                pressure * W.compressed.transition_pressure +
                bottleneck * W.compressed.bottleneck_risk +
                demand * W.compressed.demand_offset +
                support * W.compressed.structural_support),
            rebundled: Math.max(0,
                support * W.rebundled.structural_support +
                transformed * W.rebundled.transformed_share +
                integrity * W.rebundled.role_integrity +
                demand * W.rebundled.demand_offset +
                bottleneck * W.rebundled.bottleneck_risk),
            displaced: Math.max(0,
                (1 - integrity) * W.displaced.inverse_integrity +
                bottleneck * W.displaced.bottleneck_risk +
                firmIncentive * W.displaced.firm_incentive +
                Math.max(0, transformed - W.displaced_transformation_floor) * W.displaced.excess_transformation +
                demand * W.displaced.demand_offset +
                support * W.displaced.structural_support)
        };

        const simplified = simplifyForecastStateKey(point.state, point);
        shares[simplified] += W.dominant_state_boost;
        const bonuses = W.state_bonuses[point.state];
        if (bonuses) {
            Object.keys(bonuses).forEach((key) => { shares[key] += bonuses[key]; });
        }

        // Audit 2026-03-27: use consistent clamping in numerator and denominator
        // so shares always sum to exactly 1.0.
        const total = Object.values(shares).reduce((sum, value) => sum + Math.max(0, value), 0) || 0.0001;
        Object.keys(shares).forEach((key) => {
            shares[key] = Math.max(0, shares[key]) / total;
        });

        const dominantState = Object.entries(shares).sort((left, right) => right[1] - left[1])[0]?.[0] || 'retained';
        return { year: Number(point.year), point, shares, dominantState };
    });

    const firstPoint = points[0] || null;
    const firstShift = points.find((entry, index) => index > 0 && entry.dominantState !== firstPoint?.dominantState) || null;
    const year5Point = points.reduce((best, entry) => (!best || Math.abs(entry.year - 5) < Math.abs(best.year - 5) ? entry : best), null);
    // Audit 2026-03-27: single .find() per event (was double-scanning).
    // Year-5 marker is now exempt from proximity dedup since it is always relevant.
    const complementEntry = points.find((entry) => entry.shares.complemented >= 0.34);
    const compressionEntry = points.find((entry) => entry.shares.compressed >= 0.30);
    const coherenceEntry = points.find((entry) => Number(entry.point.role_integrity) < 0.5);
    const displacementEntry = points.find((entry) => entry.shares.displaced >= 0.18);
    const events = [
        complementEntry ? { key: 'complement', label: 'First meaningful AI complement', year: complementEntry.year } : null,
        compressionEntry ? { key: 'compression', label: 'Compression begins', year: compressionEntry.year } : null,
        coherenceEntry ? { key: 'coherence', label: 'Role no longer mostly intact', year: coherenceEntry.year } : null,
        displacementEntry ? { key: 'displacement', label: 'Displacement becomes plausible', year: displacementEntry.year } : null,
        year5Point ? { key: 'year5', label: 'Dominant state by year 5', year: 5 } : null
    ].filter(Boolean).reduce((rows, event) => {
        // Year-5 marker is always included; others dedup within 0.22 years
        if (event.key === 'year5' || !rows.some((existing) => existing.key !== 'year5' && Math.abs(existing.year - event.year) < 0.22)) {
            rows.push({ ...event, lane: rows.length % 2 });
        }
        return rows;
    }, []);

    return {
        points,
        firstShift,
        year5Point,
        dominantYear5State: year5Point?.dominantState || null,
        fastestShiftYear: timeline?.markers?.largest_shift?.year ?? null,
        markers: events,
        horizon: maxYear
    };
}

function buildStateOutcomeBalanceData(stateTrajectory, maxYear = 10) {
    const forecast = buildStateForecastData(stateTrajectory, maxYear);
    const curveFamily = stateTrajectory?.curve_family || { key: 'stable_hold', label: 'Stable hold', summary: '' };
    const primaryTippingPoint = stateTrajectory?.primary_tipping_point || null;
    const primaryTipYear = Number.isFinite(Number(primaryTippingPoint?.year)) ? Number(primaryTippingPoint.year) : null;
    const points = Array.isArray(forecast?.points)
        ? forecast.points.map((entry) => {
            const year = Number(entry.year);
            const progress = clamp(maxYear > 0 ? year / maxYear : 0, 0, 1);
            const tipProgress = primaryTipYear === null
                ? null
                : clamp(primaryTipYear / maxYear, 0, 1);
            const cliffProgress = tipProgress === null
                ? 0
                : smoothStep(progress, Math.max(0, tipProgress - 0.08), Math.min(1, tipProgress + 0.14));
            const roleIntegrity = clamp(Number(entry.point?.role_integrity || 0), 0, 1);
            const retainedShare = clamp(Number(entry.shares?.retained || 0), 0, 1);
            const complementedShare = clamp(Number(entry.shares?.complemented || 0), 0, 1);
            const compressedShare = clamp(Number(entry.shares?.compressed || 0), 0, 1);
            const rebundledShare = clamp(Number(entry.shares?.rebundled || 0), 0, 1);
            const displacedShare = clamp(Number(entry.shares?.displaced || 0), 0, 1);
            let mostlyIntact = clamp(
                (retainedShare * 0.74) +
                (complementedShare * 0.22) +
                (roleIntegrity * 0.22) -
                (compressedShare * 0.10) -
                (displacedShare * 0.18),
                0,
                1
            );
            let changedButRetained = clamp(
                (complementedShare * 0.62) +
                (rebundledShare * 0.72) +
                (retainedShare * 0.10) +
                ((1 - roleIntegrity) * 0.06),
                0,
                1
            );
            let downsideRisk = clamp(
                (compressedShare * 0.72) +
                (displacedShare * 0.95) +
                ((1 - roleIntegrity) * 0.14),
                0,
                1
            );

            switch (curveFamily.key) {
                case 'demand_expansion':
                    mostlyIntact += 0.06 * (1 - progress);
                    changedButRetained += 0.18 * (0.3 + (0.7 * progress)) + (0.08 * complementedShare);
                    downsideRisk -= 0.12;
                    break;
                case 'complement_then_hold':
                    mostlyIntact += (-0.06 * progress) + (0.03 * (1 - cliffProgress));
                    changedButRetained += 0.16 * (0.25 + (0.75 * progress)) + (0.12 * complementedShare) - (0.04 * cliffProgress);
                    downsideRisk += (-0.08 * (1 - progress)) + (0.02 * cliffProgress);
                    break;
                case 'rebundle_then_hold':
                    mostlyIntact += (-0.12 * (0.25 + (0.75 * progress))) - (0.04 * rebundledShare);
                    changedButRetained += 0.22 + (0.14 * rebundledShare) + (0.04 * cliffProgress);
                    downsideRisk -= 0.06 * (1 - progress);
                    break;
                case 'early_compression':
                    mostlyIntact -= 0.14 * (0.35 + (0.65 * progress));
                    changedButRetained += (-0.04) + (0.03 * rebundledShare);
                    downsideRisk += 0.16 * (0.25 + (0.75 * progress));
                    break;
                case 'compression_then_break':
                    mostlyIntact += (-0.08 * progress) - (0.18 * cliffProgress);
                    changedButRetained += (0.05 * (1 - cliffProgress)) + (0.03 * rebundledShare);
                    downsideRisk += (0.06 * progress) + (0.24 * cliffProgress);
                    break;
                case 'late_cliff':
                    mostlyIntact += (0.12 * (1 - cliffProgress)) - (0.24 * cliffProgress);
                    changedButRetained += (0.04 * (1 - cliffProgress)) + (0.04 * complementedShare);
                    downsideRisk += (-0.06 * (1 - cliffProgress)) + (0.30 * cliffProgress);
                    break;
                case 'stable_hold':
                default:
                    mostlyIntact += (0.10 * (1 - progress)) + (0.04 * retainedShare) - (0.03 * rebundledShare);
                    changedButRetained += 0.04 * complementedShare;
                    downsideRisk -= 0.10 * (1 - (progress * 0.6));
                    break;
            }

            mostlyIntact = clamp(mostlyIntact, 0, 1);
            changedButRetained = clamp(changedButRetained, 0, 1);
            downsideRisk = clamp(downsideRisk, 0, 1);
            const total = Math.max(0.0001, mostlyIntact + changedButRetained + downsideRisk);

            return {
                year,
                point: entry.point,
                dominantState: entry.dominantState,
                stateShares: entry.shares,
                transformedShare: clamp(Number(entry.point?.transformed_share || 0), 0, 1),
                mostlyIntact: Number((mostlyIntact / total).toFixed(3)),
                changedButRetained: Number((changedButRetained / total).toFixed(3)),
                downsideRisk: Number((downsideRisk / total).toFixed(3))
            };
        })
        : [];
    const year5Point = nearestForecastPoint(points, 5);
    const year10Point = nearestForecastPoint(points, 10);

    return {
        points,
        forecast,
        curveFamily,
        primaryTippingPoint,
        year5Point,
        year10Point
    };
}



function getOccupationLandscapeControlKey() {
    return [
        `h${Number(v2OccupationLandscapeControls.hierarchyLevel || 3)}`,
        Number(v2OccupationLandscapeControls.demandBias || 0).toFixed(2),
        Number(v2OccupationLandscapeControls.investmentBias || 0).toFixed(2),
        Number(v2OccupationLandscapeControls.adoptionBias || 0).toFixed(2),
        Number(v2OccupationLandscapeControls.exposureBias || 0).toFixed(2),
        Number(v2OccupationLandscapeControls.stayingBias || 0).toFixed(2)
    ].join('|');
}

function nearestForecastPoint(points, year) {
    return (Array.isArray(points) ? points : []).reduce((best, entry) => (
        !best || Math.abs(Number(entry.year) - year) < Math.abs(Number(best.year) - year) ? entry : best
    ), null);
}

function buildForecastPathLabel(yearlyPoints) {
    const states = (Array.isArray(yearlyPoints) ? yearlyPoints : [])
        .map((entry) => entry?.dominantState)
        .filter(Boolean);
    const collapsed = states.filter((state, index) => index === 0 || state !== states[index - 1]);
    return collapsed.map((state) => formatForecastStateLabel(state)).join(' -> ');
}

function forecastStateSeverity(state) {
    switch (String(state || '')) {
        case 'displaced': return 5;
        case 'compressed': return 4;
        case 'rebundled': return 3;
        case 'complemented': return 2;
        case 'retained': return 1;
        default: return 0;
    }
}

function normalizeOccupationLandscapeState(value) {
    switch (String(value || '')) {
        case 'retained':
            return 'retained';
        case 'complemented':
        case 'demand_expanding':
            return 'complemented';
        case 'rebalanced':
        case 'rebundled':
            return 'rebundled';
        case 'compressed':
        case 'bottleneck_fragile':
            return 'compressed';
        case 'displaced':
            return 'displaced';
        default:
            return 'indeterminate';
    }
}

function metricNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Number(numeric.toFixed(3)) : null;
}

function averageNumbers(values, fallback) {
    const valid = (Array.isArray(values) ? values : []).filter((value) => typeof value === 'number' && !Number.isNaN(value));
    if (!valid.length) {
        return fallback;
    }
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function extractOccupationLandscapeMetrics(result) {
    const waveTrajectory = result?.wave_trajectory || {};
    const workflowCompression = metricNumber(result?.recomposition_summary?.workflow_compression);
    const organizationalConversion = metricNumber(result?.recomposition_summary?.organizational_conversion);
    const directExposurePressure = metricNumber(result?.diagnostics?.direct_exposure_pressure);
    const indirectDependencyPressure = metricNumber(result?.diagnostics?.indirect_dependency_pressure);
    const residualRoleIntegrity = metricNumber(result?.diagnostics?.residual_role_integrity);
    const retainedAccountability = metricNumber(result?.function_metrics?.retained_accountability_strength);
    const retainedBargaining = metricNumber(result?.function_metrics?.retained_bargaining_power);
    const roleFragmentationRisk = metricNumber(result?.function_metrics?.role_fragmentation_risk);
    const headcountDisplacementRisk = metricNumber(result?.function_metrics?.headcount_displacement_risk);
    const demandExpansionModifier = metricNumber(result?.diagnostics?.demand_expansion_modifier);
    const currentWaveRetained = metricNumber(waveTrajectory?.current?.retained_share);
    const currentWaveCoherence = metricNumber(waveTrajectory?.current?.coherence);
    const nextWaveRetained = metricNumber(waveTrajectory?.next?.retained_share);
    const nextWaveCoherence = metricNumber(waveTrajectory?.next?.coherence);
    const distantWaveRetained = metricNumber(waveTrajectory?.distant?.retained_share);
    const distantWaveCoherence = metricNumber(waveTrajectory?.distant?.coherence);
    return {
        pressure_index: metricNumber(averageNumbers([directExposurePressure, workflowCompression, headcountDisplacementRisk], 0.5)),
        workflow_compression: workflowCompression,
        direct_exposure_pressure: directExposurePressure,
        indirect_dependency_pressure: indirectDependencyPressure,
        headcount_displacement_risk: headcountDisplacementRisk,
        organizational_conversion: organizationalConversion,
        human_core_strength: metricNumber(averageNumbers([retainedAccountability, retainedBargaining, residualRoleIntegrity], 0.5)),
        retained_accountability_strength: retainedAccountability,
        retained_bargaining_power: retainedBargaining,
        residual_role_integrity: residualRoleIntegrity,
        role_fragmentation_risk: roleFragmentationRisk,
        demand_expansion_modifier: demandExpansionModifier,
        current_wave_retained: currentWaveRetained,
        current_wave_coherence: currentWaveCoherence,
        next_wave_retained: nextWaveRetained,
        next_wave_coherence: nextWaveCoherence,
        distant_wave_retained: distantWaveRetained,
        distant_wave_coherence: distantWaveCoherence
    };
}

function publishOccupationLandscapeSnapshot(controlKey, snapshot) {
    window.__DLYJ_OCCUPATION_LANDSCAPE_SNAPSHOT__ = {
        controlKey,
        snapshot
    };
    window.dispatchEvent(new CustomEvent('dlyj:occupation-landscape-ready', {
        detail: {
            controlKey,
            snapshot
        }
    }));
}

async function computeOccupationLandscapeSnapshot() {
    const controlKey = getOccupationLandscapeControlKey();
    if (v2OccupationLandscapeSnapshotCache.has(controlKey)) {
        return v2OccupationLandscapeSnapshotCache.get(controlKey);
    }

    const computePromise = (async () => {
        const occupations = await getOccupationIndex();
        const engine = await getV2Engine();
        const selectorRows = await fetchCsv('data/normalized/occupation_selector_index.csv');
        const selectorById = new Map((Array.isArray(selectorRows) ? selectorRows : []).map((row) => [String(row.occupation_id || ''), row]));
        const presets = await waitForQuestionnairePresets(5000);
        const buildPreset = presets.buildQuestionnaireProfilePreset.bind(presets);
        const hierarchyLevel = Number(v2OccupationLandscapeControls.hierarchyLevel || 3);

        const rows = [];
        const mapPoints = [];
        for (let index = 0; index < occupations.length; index += 1) {
            const occupation = occupations[index];
            const questionnaireProfile = buildPreset(occupation.role_family, hierarchyLevel);
            const result = engine.computeResult({
                roleCategory: occupation.role_family,
                occupationId: occupation.occupation_id,
                seniorityLevel: hierarchyLevel,
                questionnaireProfile,
                stateModelControls: {
                    demandBias: v2OccupationLandscapeControls.demandBias,
                    investmentBias: v2OccupationLandscapeControls.investmentBias,
                    adoptionBias: v2OccupationLandscapeControls.adoptionBias,
                    exposureBias: v2OccupationLandscapeControls.exposureBias,
                    stayingBias: v2OccupationLandscapeControls.stayingBias
                }
            });
            const selector = selectorById.get(String(occupation.occupation_id || '')) || {};
            const forecast = buildStateForecastData(result?.state_trajectory || null, 10);
            const yearlyPoints = Array.from({ length: 11 }, (_, year) => nearestForecastPoint(forecast.points, year))
                .filter(Boolean)
                .map((point) => ({
                    year: Number(point.year),
                    dominantState: point.dominantState,
                    displacedShare: Number(point.shares?.displaced || 0),
                    intactness: Number(point.point?.role_integrity || 0)
                }));

            rows.push({
                occupation_id: occupation.occupation_id,
                title: occupation.title,
                title_short: occupation.title_short || occupation.title,
                role_family: occupation.role_family,
                currentState: forecast.points[0]?.dominantState || 'retained',
                year5State: forecast.dominantYear5State || yearlyPoints[5]?.dominantState || 'retained',
                year10State: yearlyPoints[10]?.dominantState || forecast.points[forecast.points.length - 1]?.dominantState || 'retained',
                firstShiftYear: forecast.firstShift?.year ?? null,
                displacedYear10: Number(yearlyPoints[10]?.displacedShare || 0),
                intactYear5: Number(nearestForecastPoint(forecast.points, 5)?.point?.role_integrity || 0),
                pathLabel: buildForecastPathLabel(yearlyPoints),
                yearlyPoints
            });

            mapPoints.push({
                occupation_id: occupation.occupation_id,
                title: occupation.title,
                title_short: occupation.title_short || occupation.title,
                role_family: occupation.role_family,
                employment_us: Number(selector.employment_us || 0) || null,
                median_wage_usd: Number(selector.median_wage_usd || 0) || null,
                projection_growth_pct: Number(selector.projection_growth_pct || 0) || null,
                current_state: normalizeOccupationLandscapeState(result?.state_trajectory?.current_state),
                likely_next_state: normalizeOccupationLandscapeState(result?.state_trajectory?.likely_next_state),
                long_run_state: normalizeOccupationLandscapeState(result?.state_trajectory?.long_run_state),
                top_exposed_work: result?.top_exposed_work?.label || '-',
                top_retained_function: result?.audit_trace?.top_retained_functions?.[0]?.label || '-',
                selected_variant_label: result?.occupation_assignment?.selected_composition?.variant_label || 'No reviewed variant selected',
                metrics: extractOccupationLandscapeMetrics(result)
            });

            if (index >= 0 && index % 3 === 2) {
                await new Promise((resolve) => window.setTimeout(resolve, 0));
            }
        }

        const snapshot = {
            hierarchyLevel,
            rows,
            mapPoints
        };
        publishOccupationLandscapeSnapshot(controlKey, snapshot);
        return snapshot;
    })();

    v2OccupationLandscapeSnapshotCache.set(controlKey, computePromise);
    try {
        return await computePromise;
    } catch (error) {
        v2OccupationLandscapeSnapshotCache.delete(controlKey);
        throw error;
    }
}

async function computeOccupationForecastMatrixRows() {
    const controlKey = getOccupationLandscapeControlKey();
    if (v2OccupationForecastMatrixCache.has(controlKey)) {
        return v2OccupationForecastMatrixCache.get(controlKey);
    }
    const computePromise = computeOccupationLandscapeSnapshot().then((snapshot) => snapshot.rows);
    v2OccupationForecastMatrixCache.set(controlKey, computePromise);
    try {
        return await computePromise;
    } catch (error) {
        v2OccupationForecastMatrixCache.delete(controlKey);
        throw error;
    }
}

function renderStateTrajectoryGraphNotes(balanceData) {
    const container = document.getElementById('v2-state-graph-notes');
    if (!container) return;
    container.innerHTML = '';

    const forecast = balanceData?.forecast || null;
    const curveFamily = balanceData?.curveFamily || null;
    const primaryTippingPoint = balanceData?.primaryTippingPoint || null;
    const year5Point = balanceData?.year5Point || null;
    const notes = [];

    if (primaryTippingPoint) {
        notes.push({
            label: '',
            value: `Today's job is no longer mostly intact by ${formatYearsApprox(primaryTippingPoint.year)}`,
            copy: primaryTippingPoint.summary || 'The main condition most likely to change the shape of the role path.'
        });
    }

    if (year5Point) {
        notes.push({
            label: 'AI-transformed work by year 5',
            value: `${Math.round((Number(year5Point.transformedShare) || 0) * 100)}%`,
            copy: 'Share of today\u2019s work likely to be materially transformed within five years.'
        });
        notes.push({
            label: 'Changed but retained by year 5',
            value: `${Math.round((Number(year5Point.changedButRetained) || 0) * 100)}%`,
            copy: 'Work that changes substantially but still points toward a surviving seat.'
        });
        notes.push({
            label: 'Downside risk by year 5',
            value: `${Math.round((Number(year5Point.downsideRisk) || 0) * 100)}%`,
            copy: 'The share of the role reading as compression or displacement pressure by year five.'
        });
    }

    if (forecast?.firstShift && !primaryTippingPoint) {
        notes.push({
            label: 'First structural shift',
            value: `${formatForecastStateLabel(forecast.firstShift.dominantState)} ${formatYearsApprox(forecast.firstShift.year)}`,
            copy: 'The first point where the role stops reading like today’s structure.'
        });
    }

    if (forecast?.fastestShiftYear !== null && forecast?.fastestShiftYear !== undefined) {
        notes.push({
            label: 'Fastest transition period',
            value: formatYearsWindow(forecast.fastestShiftYear),
            copy: 'Where the underlying role configuration changes fastest.'
        });
    }

    notes.forEach((note) => {
        const article = document.createElement('article');
        article.className = 'r-state-chart-note';
        article.innerHTML = `
            <span>${note.label}</span>
            <strong>${note.value}</strong>
            <p>${note.copy}</p>
        `;
        container.appendChild(article);
    });
}

function renderStateForecastChart(result) {
    const container = document.getElementById('v2-state-graph');
    const stateTrajectory = result?.state_trajectory || null;
    const outcomeBalance = buildStateOutcomeBalanceData(stateTrajectory, 10);
    const forecast = outcomeBalance?.forecast || null;
    if (!container) return;

    if (v2StateForecastChart) {
        v2StateForecastChart.destroy();
        v2StateForecastChart = null;
    }

    container.innerHTML = '';
    renderStateTrajectoryGraphNotes(null);

    if (!outcomeBalance?.points?.length) {
        container.innerHTML = '<div class="r-trajectory-graph-empty">Role outcome balance appears once the role is scored.</div>';
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'r-trajectory-graph-canvas';
    canvas.setAttribute('aria-label', 'Ten-year role outcome balance from the structural state model.');
    container.appendChild(canvas);

    const palette = {
        intact: '#6d8f63',
        retained: '#90a699',
        downside: '#a3653e',
        marker: '#5d7d8e'
    };
    const chartFont = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'Inter, sans-serif';
    const markerRows = [];
    if (outcomeBalance.primaryTippingPoint) {
        markerRows.push({ key: 'primary_tip', year: Number(outcomeBalance.primaryTippingPoint.year), label: outcomeBalance.primaryTippingPoint.label });
    }
    if (forecast.firstShift && !markerRows.some((row) => Math.abs(row.year - Number(forecast.firstShift.year)) < 0.2)) {
        markerRows.push({ key: 'shift', year: Number(forecast.firstShift.year), label: 'First shift' });
    }
    if (Number.isFinite(Number(forecast.fastestShiftYear)) && !markerRows.some((row) => Math.abs(row.year - Number(forecast.fastestShiftYear)) < 0.2)) {
        markerRows.push({ key: 'fastest', year: Number(forecast.fastestShiftYear), label: 'Fastest period' });
    }
    markerRows.push({ key: 'year5', year: 5, label: 'Year 5' });

    const datasets = [
        {
            label: 'Mostly intact',
            data: outcomeBalance.points.map((entry) => ({ x: entry.year, y: entry.mostlyIntact })),
            borderColor: palette.intact,
            backgroundColor: 'rgba(109, 143, 99, 0.84)',
            pointRadius: 0,
            fill: 'origin',
            stack: 'balance',
            borderWidth: 1.6,
            tension: 0.22,
            order: 1
        },
        {
            label: 'Changed but retained',
            data: outcomeBalance.points.map((entry) => ({ x: entry.year, y: entry.changedButRetained })),
            borderColor: palette.retained,
            backgroundColor: 'rgba(144, 166, 153, 0.74)',
            pointRadius: 0,
            fill: '-1',
            stack: 'balance',
            borderWidth: 1.6,
            tension: 0.22,
            order: 2
        },
        {
            label: 'Downside risk (compression & displacement pressure)',
            data: outcomeBalance.points.map((entry) => ({ x: entry.year, y: entry.downsideRisk })),
            borderColor: palette.downside,
            backgroundColor: 'rgba(163, 101, 62, 0.80)',
            pointRadius: 0,
            fill: '-1',
            stack: 'balance',
            borderWidth: 1.8,
            tension: 0.22,
            order: 3
        }
    ];

    const outcomeBalanceOverlayPlugin = {
        id: 'stateOutcomeBalanceOverlay',
        beforeDatasetsDraw(chart) {
            const markers = chart.options.plugins.stateOutcomeBalanceOverlay?.markers || [];
            const xScale = chart.scales.x;
            const area = chart.chartArea;
            const ctx = chart.ctx;
            if (!xScale || !area) return;

            ctx.save();
            markers.forEach((marker) => {
                const x = xScale.getPixelForValue(Number(marker.year));
                ctx.strokeStyle = marker.key === 'year5'
                    ? 'rgba(71, 66, 58, 0.34)'
                    : marker.key === 'primary_tip'
                        ? 'rgba(163, 101, 62, 0.30)'
                        : 'rgba(92, 120, 129, 0.20)';
                ctx.lineWidth = marker.key === 'year5' ? 1.6 : (marker.key === 'primary_tip' ? 1.8 : 1);
                ctx.setLineDash(marker.key === 'year5' ? [] : (marker.key === 'primary_tip' ? [2, 5] : [4, 7]));
                ctx.beginPath();
                ctx.moveTo(x, area.top + 6);
                ctx.lineTo(x, area.bottom - 6);
                ctx.stroke();
            });
            ctx.restore();
        }
    };

    v2StateForecastChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
                axis: 'x'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title(items) {
                            const year = Number(items?.[0]?.parsed?.x ?? 0);
                            return `Year ${Math.round(year)}`;
                        },
                        label(context) {
                            return `${context.dataset.label}: ${Math.round((Number(context.parsed?.y) || 0) * 100)}%`;
                        },
                        afterBody(items) {
                            const year = Number(items?.[0]?.parsed?.x ?? 0);
                            const point = outcomeBalance.points.reduce((best, entry) => (
                                !best || Math.abs(entry.year - year) < Math.abs(best.year - year) ? entry : best
                            ), null);
                            if (!point) return [];
                            return [
                                `AI-transformed work: ${Math.round((Number(point.transformedShare) || 0) * 100)}%`,
                                `Dominant state: ${formatForecastStateLabel(point.dominantState)}`,
                                outcomeBalance.curveFamily?.label ? `Curve family: ${outcomeBalance.curveFamily.label}` : null
                            ].filter(Boolean);
                        }
                    },
                    backgroundColor: 'rgba(33, 30, 26, 0.94)',
                    titleColor: '#f7f4ed',
                    bodyColor: '#f7f4ed',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    boxPadding: 4
                },
                stateOutcomeBalanceOverlay: {
                    markers: markerRows
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 10,
                    stacked: true,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        stepSize: 1,
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 11,
                            weight: '600'
                        },
                        callback(value) {
                            const numeric = Number(value);
                            return Number.isInteger(numeric) && numeric >= 0 && numeric <= 10 ? `${numeric}` : '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Years from now',
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 12,
                            weight: '700'
                        },
                        padding: { top: 10, bottom: 0 }
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    stacked: true,
                    grid: {
                        color: 'rgba(105, 98, 85, 0.10)',
                        lineWidth: 1
                    },
                    border: { display: false },
                    ticks: {
                        stepSize: 0.25,
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 11,
                            weight: '600'
                        },
                        callback(value) {
                            return `${Math.round(Number(value) * 100)}%`;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Share of today’s role',
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 12,
                            weight: '700'
                        },
                        padding: { top: 0, bottom: 10 }
                    }
                }
            }
        },
        plugins: [outcomeBalanceOverlayPlugin]
    });

    renderStateTrajectoryGraphNotes(outcomeBalance);
}

function renderStateShareForecastChart(result) {
    const container = document.getElementById('v2-state-share-graph');
    const readout = document.getElementById('v2-state-share-readout');
    const stateTrajectory = result?.state_trajectory || null;
    const forecast = buildStateForecastData(stateTrajectory, 10);
    if (!container) return;

    if (v2StateShareChart) {
        v2StateShareChart.destroy();
        v2StateShareChart = null;
    }

    container.innerHTML = '';

    if (!forecast?.points?.length) {
        container.innerHTML = '<div class="r-trajectory-graph-empty">State-share forecast appears once the role is scored.</div>';
        if (readout) {
            readout.textContent = 'This support chart shows how strongly each public state fits at each year.';
        }
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'r-trajectory-graph-canvas';
    canvas.setAttribute('aria-label', 'Ten-year state-share forecast from the structural state model.');
    canvas.setAttribute('aria-describedby', 'v2-state-share-readout');
    container.appendChild(canvas);

    const palette = {
        retained: '#55766f',
        complemented: '#5d7d8e',
        compressed: '#a3653e',
        rebundled: '#8f6a49',
        displaced: '#8c4940'
    };
    const chartFont = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'Inter, sans-serif';
    const datasetOrder = ['retained', 'complemented', 'compressed', 'rebundled', 'displaced'];
    const datasets = datasetOrder.map((key, index) => ({
        label: formatForecastStateLabel(key),
        data: forecast.points.map((entry) => ({ x: entry.year, y: Number(entry.shares[key] || 0) })),
        borderColor: palette[key],
        backgroundColor: key === 'retained'
            ? 'rgba(85, 118, 111, 0.84)'
            : key === 'complemented'
                ? 'rgba(93, 125, 142, 0.78)'
                : key === 'compressed'
                    ? 'rgba(163, 101, 62, 0.74)'
                    : key === 'rebundled'
                        ? 'rgba(143, 106, 73, 0.66)'
                        : 'rgba(140, 73, 64, 0.82)',
        pointRadius: 0,
        pointHoverRadius: 3,
        pointHitRadius: 10,
        fill: index === 0 ? 'origin' : '-1',
        stack: 'forecast',
        borderWidth: 1.4,
        tension: 0.22,
        order: index + 1
    }));

    v2StateShareChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title(items) {
                            const year = Number(items?.[0]?.parsed?.x ?? 0);
                            return `Year ${Math.round(year)}`;
                        },
                        label(context) {
                            return `${context.dataset.label}: ${Math.round((Number(context.parsed?.y) || 0) * 100)}%`;
                        },
                        afterBody(items) {
                            const year = Number(items?.[0]?.parsed?.x ?? 0);
                            const point = forecast.points.reduce((best, entry) => (
                                !best || Math.abs(entry.year - year) < Math.abs(best.year - year) ? entry : best
                            ), null);
                            if (!point) return [];
                            return [
                                `Best fit: ${formatForecastStateLabel(point.dominantState)}`,
                                `Role coherence: ${Math.round((Number(point.point?.role_integrity) || 0) * 100)}%`
                            ];
                        }
                    },
                    backgroundColor: 'rgba(33, 30, 26, 0.94)',
                    titleColor: '#f7f4ed',
                    bodyColor: '#f7f4ed',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    boxPadding: 4
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 10,
                    stacked: true,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        stepSize: 1,
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 11,
                            weight: '600'
                        },
                        callback(value) {
                            const numeric = Number(value);
                            return Number.isInteger(numeric) && numeric >= 0 && numeric <= 10 ? `${numeric}` : '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Years from now',
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 12,
                            weight: '700'
                        },
                        padding: { top: 10, bottom: 0 }
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    stacked: true,
                    grid: {
                        color: 'rgba(105, 98, 85, 0.10)',
                        lineWidth: 1
                    },
                    border: { display: false },
                    ticks: {
                        stepSize: 0.25,
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 11,
                            weight: '600'
                        },
                        callback(value) {
                            return `${Math.round(Number(value) * 100)}%`;
                        }
                    },
                    title: {
                        display: true,
                        text: 'State fit',
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 12,
                            weight: '700'
                        },
                        padding: { top: 0, bottom: 10 }
                    }
                }
            }
        }
    });

    if (readout) {
        const year5Point = nearestForecastPoint(forecast.points, 5);
        const year10Point = nearestForecastPoint(forecast.points, 10);
        readout.textContent = `By year 5 the strongest fit is ${formatForecastStateLabel(year5Point?.dominantState).toLowerCase()}, while by year 10 it reads most strongly as ${formatForecastStateLabel(year10Point?.dominantState).toLowerCase()}.`;
    }
}

function renderStateTrajectoryGraph(result) {
    const container = document.getElementById('v2-state-integrity-graph');
    const readout = document.getElementById('v2-state-integrity-readout');
    const stateTrajectory = result?.state_trajectory || null;
    const timeline = stateTrajectory?.timeline || null;
    const baselinePoints = timeline?.baseline?.points;
    const bandPoints = timeline?.band?.points;
    const transitions = Array.isArray(timeline?.markers?.transitions) ? timeline.markers.transitions.slice(0, 4) : [];
    const largestShift = timeline?.markers?.largest_shift || null;
    if (!container) return;

    if (v2StateTrajectoryChart) {
        v2StateTrajectoryChart.destroy();
        v2StateTrajectoryChart = null;
    }

    container.innerHTML = '';

    if (!Array.isArray(baselinePoints) || !baselinePoints.length) {
        container.innerHTML = '<div class="r-trajectory-graph-empty">Role coherence appears once the role is scored.</div>';
        if (readout) {
            readout.textContent = 'This secondary chart explains how intact today’s job remains as the forecast shifts state above.';
        }
        return;
    }

    const baselineData = baselinePoints.map((point) => ({
        x: Number(point.year),
        y: Number(point.role_integrity ?? 0)
    }));
    const upperBandData = Array.isArray(bandPoints) ? bandPoints.map((point) => ({
        x: Number(point.year),
        y: Number(point.upper_role_integrity ?? 0)
    })) : [];
    const lowerBandData = Array.isArray(bandPoints) ? bandPoints.map((point) => ({
        x: Number(point.year),
        y: Number(point.lower_role_integrity ?? 0)
    })) : [];
    const lastPoint = baselinePoints[baselinePoints.length - 1] || null;
    const currentState = baselinePoints[0]?.state;
    const endState = lastPoint?.state;
    const transitionCopy = transitions.length
        ? transitions.map((transition) => `${formatStateTrajectoryStateLabel(transition.state)} by ~${Number(transition.year).toFixed(1)}y`).join(', ')
        : 'No major state transition appears across the 10-year read.';
    const shiftCopy = largestShift
        ? `The role narrows fastest around year ${Number(largestShift.year).toFixed(1)}.`
        : null;
    const readableSummary = [
        currentState ? `The seat starts as ${formatStateTrajectoryStateLabel(currentState).toLowerCase()}.` : null,
        transitionCopy,
        endState ? `By year ${Number(lastPoint?.year ?? 10).toFixed(0)}, it reads as ${formatStateTrajectoryStateLabel(endState).toLowerCase()} with ${Math.round((Number(lastPoint?.role_integrity ?? 0) || 0) * 100)}% role integrity.` : null,
        shiftCopy
    ].filter(Boolean).join(' ');

    const canvas = document.createElement('canvas');
    canvas.className = 'r-trajectory-graph-canvas';
    canvas.setAttribute('aria-label', 'Role coherence over time from the structural state model.');
    canvas.setAttribute('aria-describedby', 'v2-state-integrity-readout');
    container.appendChild(canvas);

    const chartFont = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'Inter, sans-serif';
    const baselineColor = getComputedStyle(document.documentElement).getPropertyValue('--state-trajectory-line').trim() || '#486a74';
    const bandColor = getComputedStyle(document.documentElement).getPropertyValue('--state-trajectory-band').trim() || 'rgba(96, 134, 150, 0.18)';
    const fillColor = getComputedStyle(document.documentElement).getPropertyValue('--state-trajectory-fill').trim() || 'rgba(118, 160, 176, 0.14)';

    const stateOverlayPlugin = {
        id: 'stateTrajectoryOverlay',
        beforeDatasetsDraw(chart) {
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            const area = chart.chartArea;
            const ctx = chart.ctx;
            if (!xScale || !yScale || !area) return;

            ctx.save();
            [0.2, 0.4, 0.6, 0.8].forEach((value) => {
                const y = yScale.getPixelForValue(value);
                ctx.strokeStyle = 'rgba(105, 98, 85, 0.14)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 7]);
                ctx.beginPath();
                ctx.moveTo(area.left, y);
                ctx.lineTo(area.right, y);
                ctx.stroke();
            });
            ctx.restore();
        },
        afterDatasetsDraw(chart) {
            const pluginTransitions = chart.options.plugins.stateTrajectoryOverlay?.transitions || [];
            const pluginLargestShift = chart.options.plugins.stateTrajectoryOverlay?.largestShift || null;
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            const area = chart.chartArea;
            const ctx = chart.ctx;
            if (!xScale || !yScale || !area) return;

            ctx.save();
            ctx.font = `600 11px ${chartFont}`;
            ctx.textBaseline = 'middle';

            pluginTransitions.forEach((transition, index) => {
                const x = xScale.getPixelForValue(Number(transition.year));
                const y = yScale.getPixelForValue(Number(transition.role_integrity ?? 0));
                const tone = getStateTrajectoryTone(transition.state);

                ctx.fillStyle = '#f7f4ed';
                ctx.strokeStyle = tone.color;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.moveTo(x, area.top + 10);
                ctx.lineTo(x, area.bottom - 10);
                ctx.strokeStyle = 'rgba(94, 121, 130, 0.18)';
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.strokeStyle = tone.color;
                ctx.beginPath();
                ctx.arc(x, y, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });

            if (pluginLargestShift) {
                const x = xScale.getPixelForValue(Number(pluginLargestShift.year));
                const y = yScale.getPixelForValue(Number(pluginLargestShift.role_integrity ?? 0));

                ctx.fillStyle = '#f7f4ed';
                ctx.strokeStyle = '#a3653e';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(x, y - 7);
                ctx.lineTo(x + 7, y);
                ctx.lineTo(x, y + 7);
                ctx.lineTo(x - 7, y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        }
    };

    v2StateTrajectoryChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Assumption upper',
                    data: upperBandData,
                    borderColor: 'transparent',
                    backgroundColor: bandColor,
                    borderWidth: 0,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: { target: 1, above: bandColor, below: bandColor },
                    tension: 0.28,
                    order: 1
                },
                {
                    label: 'Assumption lower',
                    data: lowerBandData,
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: false,
                    tension: 0.28,
                    order: 1
                },
                {
                    label: 'Role integrity',
                    data: baselineData,
                    borderColor: baselineColor,
                    backgroundColor: fillColor,
                    borderWidth: 4.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHitRadius: 12,
                    fill: 'origin',
                    tension: 0.28,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    filter(context) {
                        return context.datasetIndex === 2;
                    },
                    callbacks: {
                        title(items) {
                            const year = Number(items?.[0]?.parsed?.x ?? 0);
                            return year >= 10 ? 'Year 10+' : `Year ${year.toFixed(1)}`;
                        },
                        label(context) {
                            const point = baselinePoints[context.dataIndex] || {};
                            return [
                                `Role integrity: ${Math.round((Number(point.role_integrity) || 0) * 100)}%`,
                                `State: ${formatStateTrajectoryStateLabel(point.state)}`,
                                `Transformed share: ${Math.round((Number(point.transformed_share) || 0) * 100)}%`,
                                `Transition pressure: ${Math.round((Number(point.transition_pressure) || 0) * 100)}%`
                            ];
                        }
                    },
                    backgroundColor: 'rgba(33, 30, 26, 0.94)',
                    titleColor: '#f7f4ed',
                    bodyColor: '#f7f4ed',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                },
                stateTrajectoryOverlay: {
                    transitions,
                    largestShift
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 5,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        stepSize: 1,
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 11,
                            weight: '600'
                        },
                        callback(value) {
                            const numeric = Number(value);
                            if ([0, 1, 2, 3, 4, 5].includes(numeric)) {
                                return `${numeric}`;
                            }
                            return '';
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        stepSize: 0.2,
                        color: '#6f685c',
                        font: {
                            family: chartFont,
                            size: 11,
                            weight: '600'
                        },
                        callback(value) {
                            return `${Math.round(Number(value) * 100)}%`;
                        }
                    }
                }
            }
        },
        plugins: [stateOverlayPlugin]
    });

    if (readout) {
        readout.textContent = `This line shows how intact today's version of the job remains while the role outcome balance above shifts. ${readableSummary}`;
    }
}

function ensureTrajectoryLandscapePlacement() {
    const host = document.getElementById('v2-landscape-host');
    const landscape = document.getElementById('v2-landscape');
    if (!host || !landscape) {
        return;
    }

    if (landscape.parentElement !== host) {
        host.appendChild(landscape);
    }

    // This section is moved after the reveal observer has already scanned the
    // original DOM position. Force it visible so the whole occupation block
    // cannot remain at opacity:0 after scoring.
    landscape.classList.add('is-visible');
}


























function renderBundleList(containerId, bundles, defaultFate) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    bundles.forEach((b, i) => {
        const fate = b.fate || defaultFate || 'retain';
        const arrows = { shrink: '\u2193', retain: '\u2192', grow: '\u2191' };
        const item = document.createElement('div');
        item.className = 'r-dx-bundle-item';
        item.style.animationDelay = `${i * 60}ms`;
        item.classList.add('is-animated');

        const arrow = document.createElement('span');
        arrow.className = `r-dx-bundle-arrow r-dx-bundle-arrow--${fate}`;
        arrow.textContent = arrows[fate] || '\u2192';

        const label = document.createElement('span');
        label.className = 'r-dx-bundle-label';
        label.textContent = b.public_label || b.task_cluster_label || 'Unknown bundle';

        item.appendChild(arrow);
        item.appendChild(label);

        if (b.confidence_label) {
            const badge = document.createElement('span');
            badge.className = 'r-dx-bundle-badge';
            badge.textContent = b.confidence_label;
            item.appendChild(badge);
        }

        if (b.accession_kind) {
            const kind = document.createElement('span');
            kind.className = 'r-dx-bundle-badge';
            kind.textContent = formatV2Label(b.accession_kind);
            item.appendChild(kind);
        }

        container.appendChild(item);
    });
}

function animateCounter(elementId, targetValue, suffix) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = targetValue + (suffix || '');
        return;
    }

    const duration = 500;
    const start = performance.now();
    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(progress * targetValue);
        el.textContent = current + (suffix || '');
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ─── Pressure Map (interactive HTML plot) ─────────────────────────────────

var _pmapState = {
    tasks: [],
    selectedIdx: -1,
    selectedTaskId: null,
    hoveredTaskId: null,
    legendFilter: null,
    result: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartPanX: 0,
    dragStartPanY: 0,
    pinchStartDistance: 0,
    pinchStartZoom: 1,
    pinchStartCenterX: 0,
    pinchStartCenterY: 0,
    pinchStartPanX: 0,
    pinchStartPanY: 0,
    suppressNextTap: false,
    pointPositions: {},
    sectionVisible: false,
    sectionObserver: null,
    revealStageIndex: -1,
    revealCompleted: false,
    revealTimer: null,
    renderVersion: 0
};

var PMAP_AXIS_OPTIONS = [
    { key: 'direct_exposure_pressure', label: 'Direct exposure pressure', shortLabel: 'pressure', description: 'Higher values mean the task is under more immediate substitution or compression pressure.' },
    { key: 'retained_leverage', label: 'Retained leverage', shortLabel: 'leverage', description: 'Higher values mean the task keeps more human advantage through context, trust, or decision rights.' },
    { key: 'share_of_role', label: 'Share of role', shortLabel: 'role share', description: 'Higher values mean the task occupies more of the role.' },
    { key: 'automation_difficulty', label: 'Automation difficulty', shortLabel: 'difficulty', description: 'Higher values mean the task is harder for AI systems to execute cleanly.' },
    { key: 'indirect_dependency_pressure', label: 'Spillover pressure', shortLabel: 'spillover', description: 'Higher values mean adjacent task automation is pulling this task along through workflow dependencies.' },
    { key: 'bargaining_power_weight', label: 'Bargaining weight', shortLabel: 'bargaining', description: 'Higher values mean the task sits closer to the scarce or value-defining core of the role.' },
    { key: 'evidence_confidence', label: 'Evidence confidence', shortLabel: 'evidence', description: 'Higher values mean the runtime is leaning on stronger task-level evidence rather than weaker fallback proxies.' }
];

var PMAP_VIEWS = {
    pressure_vs_leverage: {
        x: 'retained_leverage', y: 'direct_exposure_pressure',
        xLabel: 'Retained leverage', yLabel: 'Direct exposure pressure',
        desc: 'Tasks in the lower-right keep stronger human leverage while facing less pressure. Upper-left tasks have the weakest anchors.',
        quadrants: ['Exposed', 'Contested', 'Residual', 'Anchored']
    },
    pressure_vs_share: {
        x: 'direct_exposure_pressure', y: 'share_of_role',
        xLabel: 'Direct exposure pressure', yLabel: 'Share of role',
        desc: 'Large bubbles at the right edge are high-share tasks under heavy pressure.',
        quadrants: ['Low stake', 'Critical exposure', 'Minor task', 'High-share risk']
    },
    difficulty_vs_leverage: {
        x: 'automation_difficulty', y: 'retained_leverage',
        xLabel: 'Automation difficulty', yLabel: 'Retained leverage',
        desc: 'Tasks that are hard to automate and keep high leverage are the most durable. Lower-left tasks have weak anchors on both dimensions.',
        quadrants: ['Hard + anchored', 'Hard + weak anchor', 'Easy + anchored', 'Vulnerable']
    },
    share_vs_leverage: {
        x: 'share_of_role', y: 'retained_leverage',
        xLabel: 'Share of role', yLabel: 'Retained leverage',
        desc: 'How much of the role each task occupies versus how much leverage it retains.',
        quadrants: ['Minor + anchored', 'Core work', 'Minor + loose', 'Heavy + loose']
    },
    pressure_vs_difficulty: {
        x: 'direct_exposure_pressure', y: 'automation_difficulty',
        xLabel: 'Direct exposure pressure', yLabel: 'Automation difficulty',
        desc: 'Tasks in the lower-right are easier to automate and under heavier pressure. Upper-left tasks resist both.',
        quadrants: ['Hard to touch', 'Hard but pressured', 'Easy + quiet', 'Easy target']
    }
};

var PMAP_COLOR_SCHEMES = {
    pressure: {
        key: 'exposure_level',
        colors: {
            high: 'oklch(0.55 0.12 40 / 0.74)',
            moderate: 'oklch(0.62 0.10 85 / 0.72)',
            low: 'oklch(0.55 0.09 145 / 0.68)'
        },
        labels: { high: 'High pressure', moderate: 'Moderate pressure', low: 'Lower pressure' }
    },
    mode: {
        key: 'likely_mode',
        colors: {
            automation: 'oklch(0.55 0.12 40 / 0.70)',
            augmentation: 'oklch(0.55 0.09 145 / 0.65)',
            mixed: 'oklch(0.62 0.10 85 / 0.65)'
        },
        labels: { automation: 'Automation', augmentation: 'Augmentation', mixed: 'Mixed' }
    },
    evidence: {
        key: 'evidence_type',
        colors: {
            live_task_evidence: 'oklch(0.55 0.09 145 / 0.75)',
            reviewed_task_estimate: 'oklch(0.62 0.10 85 / 0.65)',
            benchmark_task_label: 'rgba(28, 27, 24, 0.55)',
            cluster_prior_proxy: 'rgba(28, 27, 24, 0.30)',
            fallback_task_proxy: 'rgba(28, 27, 24, 0.18)'
        },
        labels: {
            live_task_evidence: 'Live evidence',
            reviewed_task_estimate: 'Reviewed estimate',
            benchmark_task_label: 'Benchmark',
            cluster_prior_proxy: 'Cluster proxy',
            fallback_task_proxy: 'Fallback proxy'
        }
    },
    cluster: { key: 'task_cluster_label', colors: {}, labels: {} }
};

var PMAP_REVEAL_STAGES = [
    {
        key: 'exposed',
        title: 'What shrinks first',
        kicker: 'What shrinks first',
        note: 'These tasks sit in the high-pressure, low-leverage corner. They are the easiest parts of the role to standardize, delegate, or absorb first.',
        roleMeaning: 'This is the work most likely to leave the seat before the role itself disappears.',
        quadrantMatch: function (task, medians) {
            return (Number(task.direct_exposure_pressure) || 0) >= medians.pressure
                && (Number(task.retained_leverage) || 0) < medians.leverage;
        }
    },
    {
        key: 'anchored',
        title: 'What holds the seat',
        kicker: 'What remains human',
        note: 'These tasks sit in the low-pressure, high-leverage corner. They keep more judgment, approval, relationship ownership, or context-dependent work.',
        roleMeaning: 'This is the human core that still anchors why the role exists.',
        quadrantMatch: function (task, medians) {
            return (Number(task.direct_exposure_pressure) || 0) < medians.pressure
                && (Number(task.retained_leverage) || 0) >= medians.leverage;
        }
    },
    {
        key: 'contested',
        title: 'What changes form',
        kicker: 'What gets contested',
        note: 'These tasks are pressured, but they still retain meaningful human leverage. They often shift toward review, exception handling, and oversight rather than vanishing cleanly.',
        roleMeaning: 'This is where the role changes form more than it simply gets removed.',
        quadrantMatch: function (task, medians) {
            return (Number(task.direct_exposure_pressure) || 0) >= medians.pressure
                && (Number(task.retained_leverage) || 0) >= medians.leverage;
        }
    },
    {
        key: 'residual',
        title: 'What stays quieter',
        kicker: 'What stays quieter',
        note: 'These tasks are not the first source of pressure, but they also do not strongly anchor the future shape of the role.',
        roleMeaning: 'This work matters less to the next bundle unless it connects into stronger human-owned functions nearby.',
        quadrantMatch: function (task, medians) {
            return (Number(task.direct_exposure_pressure) || 0) < medians.pressure
                && (Number(task.retained_leverage) || 0) < medians.leverage;
        }
    }
];

function _pmapTaskKey(task, idx) {
    return task && task.task_id ? task.task_id : 'task-' + idx;
}

function _pmapPercent(value) {
    return Math.round((Number(value) || 0) * 100) + '%';
}

function _pmapAxisMap() {
    return new Map(PMAP_AXIS_OPTIONS.map(function (axis) {
        return [axis.key, axis];
    }));
}

function _pmapMedian(values) {
    var sorted = values
        .filter(function (value) { return typeof value === 'number' && !Number.isNaN(value); })
        .slice()
        .sort(function (left, right) { return left - right; });
    if (!sorted.length) return 0.5;
    var middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function _pmapPopulateAxisSelect(select) {
    if (!select || select.dataset.pmapAxesLoaded === 'true') return;
    PMAP_AXIS_OPTIONS.forEach(function (axis) {
        var option = document.createElement('option');
        option.value = axis.key;
        option.textContent = axis.label;
        select.appendChild(option);
    });
    select.dataset.pmapAxesLoaded = 'true';
}

function _pmapApplyPreset(viewKey) {
    var preset = PMAP_VIEWS[viewKey];
    var xSelect = document.getElementById('r-dx-pmap-x');
    var ySelect = document.getElementById('r-dx-pmap-y');
    if (!preset || !xSelect || !ySelect) return;
    xSelect.value = preset.x;
    ySelect.value = preset.y;
}

function _pmapFindPresetKey(xKey, yKey) {
    return Object.keys(PMAP_VIEWS).find(function (key) {
        return PMAP_VIEWS[key].x === xKey && PMAP_VIEWS[key].y === yKey;
    }) || null;
}

function _pmapSyncViewSelect() {
    var xSelect = document.getElementById('r-dx-pmap-x');
    var ySelect = document.getElementById('r-dx-pmap-y');
    var viewSelect = document.getElementById('r-dx-pmap-view');
    if (!xSelect || !ySelect || !viewSelect) return null;

    var presetKey = _pmapFindPresetKey(xSelect.value, ySelect.value);
    var customOption = viewSelect.querySelector('option[value="custom"]');
    if (presetKey) {
        if (customOption) customOption.remove();
        viewSelect.value = presetKey;
        return presetKey;
    }
    if (!customOption) {
        customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = 'Custom axes';
        viewSelect.appendChild(customOption);
    }
    viewSelect.value = 'custom';
    return 'custom';
}

function _pmapGetActiveView(axisMap) {
    var xSelect = document.getElementById('r-dx-pmap-x');
    var ySelect = document.getElementById('r-dx-pmap-y');
    var xKey = xSelect && axisMap.has(xSelect.value) ? xSelect.value : 'direct_exposure_pressure';
    var yKey = ySelect && axisMap.has(ySelect.value) ? ySelect.value : 'retained_leverage';
    var presetKey = _pmapFindPresetKey(xKey, yKey);
    var xMeta = axisMap.get(xKey) || PMAP_AXIS_OPTIONS[0];
    var yMeta = axisMap.get(yKey) || PMAP_AXIS_OPTIONS[1];

    if (presetKey) {
        return {
            key: presetKey,
            preset: true,
            x: xKey,
            y: yKey,
            xMeta: xMeta,
            yMeta: yMeta,
            xLabel: PMAP_VIEWS[presetKey].xLabel,
            yLabel: PMAP_VIEWS[presetKey].yLabel,
            desc: PMAP_VIEWS[presetKey].desc,
            quadrants: PMAP_VIEWS[presetKey].quadrants
        };
    }

    return {
        key: 'custom',
        preset: false,
        x: xKey,
        y: yKey,
        xMeta: xMeta,
        yMeta: yMeta,
        xLabel: xMeta.label,
        yLabel: yMeta.label,
        desc: xMeta.label + ' on the x-axis, ' + yMeta.label + ' on the y-axis. ' + xMeta.description + ' ' + yMeta.description,
        quadrants: [
            'Low ' + xMeta.shortLabel + ' / high ' + yMeta.shortLabel,
            'High ' + xMeta.shortLabel + ' / high ' + yMeta.shortLabel,
            'Low ' + xMeta.shortLabel + ' / low ' + yMeta.shortLabel,
            'High ' + xMeta.shortLabel + ' / low ' + yMeta.shortLabel
        ]
    };
}

function _pmapClearRevealTimer() {
    if (_pmapState.revealTimer) {
        clearTimeout(_pmapState.revealTimer);
        _pmapState.revealTimer = null;
    }
}

function _pmapDefaultMedians(tasks) {
    return {
        pressure: _pmapMedian((tasks || []).map(function (task) { return Number(task.direct_exposure_pressure) || 0; })),
        leverage: _pmapMedian((tasks || []).map(function (task) { return Number(task.retained_leverage) || 0; }))
    };
}

function _pmapStageRows(tasks, stageKey) {
    var stage = PMAP_REVEAL_STAGES.find(function (entry) { return entry.key === stageKey; }) || PMAP_REVEAL_STAGES[0];
    var medians = _pmapDefaultMedians(tasks);
    return (tasks || []).filter(function (task) {
        return stage.quadrantMatch(task, medians);
    });
}

function _pmapVisibleStageKeys() {
    if (_pmapState.revealCompleted || _pmapState.revealStageIndex >= PMAP_REVEAL_STAGES.length - 1) {
        return new Set(PMAP_REVEAL_STAGES.map(function (stage) { return stage.key; }));
    }
    if (_pmapState.revealStageIndex < 0) return new Set();
    return new Set(PMAP_REVEAL_STAGES.slice(0, _pmapState.revealStageIndex + 1).map(function (stage) { return stage.key; }));
}

function _pmapTaskStageKey(task, medians) {
    var matched = PMAP_REVEAL_STAGES.find(function (stage) {
        return stage.quadrantMatch(task, medians);
    });
    return matched ? matched.key : 'residual';
}

function _pmapShouldShowTask(task, medians) {
    if (_pmapState.revealCompleted) return true;
    var visibleStages = _pmapVisibleStageKeys();
    if (!visibleStages.size) return false;
    return visibleStages.has(_pmapTaskStageKey(task, medians));
}

function _pmapSetExplainerState(stageIndex) {
    var kicker = document.getElementById('r-dx-pmap-explainer-kicker');
    var title = document.getElementById('r-dx-pmap-explainer-title');
    var copy = document.getElementById('r-dx-pmap-explainer-copy');
    var share = document.getElementById('r-dx-pmap-explainer-share');
    var note = document.getElementById('r-dx-pmap-explainer-note');
    var tasksLine = document.getElementById('r-dx-pmap-explainer-tasks');
    var steps = document.getElementById('r-dx-pmap-steps');
    var tasks = _pmapState.tasks || [];

    if (!kicker || !title || !copy || !share || !note || !tasksLine || !steps) return;

    steps.innerHTML = '';
    PMAP_REVEAL_STAGES.forEach(function (stage, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'r-dx-pmap-step';
        if (index === stageIndex) button.classList.add('is-active');
        button.textContent = stage.title;
        button.addEventListener('click', function () {
            _pmapClearRevealTimer();
            _pmapState.revealCompleted = true;
            _pmapState.revealStageIndex = index;
            _pmapSetExplainerState(index);
            _pmapRenderPlot();
        });
        steps.appendChild(button);
    });

    if (stageIndex < 0 || !tasks.length) {
        kicker.textContent = 'Pressure map';
        title.textContent = 'Scroll here to load the task map';
        copy.textContent = 'The map stays quiet until you reach it. Then it opens in passes: what shrinks first, what still anchors the seat, and where the role is most contested.';
        share.textContent = '-';
        note.textContent = 'The first reveal highlights the work under the most pressure with the weakest human leverage.';
        tasksLine.textContent = '';
        return;
    }

    var stage = PMAP_REVEAL_STAGES[stageIndex] || PMAP_REVEAL_STAGES[0];
    var rows = _pmapStageRows(tasks, stage.key)
        .slice()
        .sort(function (left, right) { return (Number(right.share_of_role) || 0) - (Number(left.share_of_role) || 0); });
    var shareValue = rows.reduce(function (sum, task) { return sum + (Number(task.share_of_role) || 0); }, 0);
    kicker.textContent = stage.kicker;
    title.textContent = stage.title;
    copy.textContent = stage.note;
    share.textContent = _pmapPercent(shareValue);
    note.textContent = stage.roleMeaning;
    tasksLine.textContent = '';
}

function _pmapRenderDormantState() {
    var pointsLayer = document.getElementById('r-dx-pmap-points');
    var legend = document.getElementById('r-dx-pmap-legend');
    var status = document.getElementById('r-dx-pmap-status');
    var caption = document.getElementById('r-dx-pmap-caption');
    if (pointsLayer) pointsLayer.innerHTML = '';
    if (legend) legend.innerHTML = '';
    if (status) status.textContent = 'Scroll down to activate the task map.';
    if (caption) caption.textContent = 'The task map stays blank until this section enters view.';
    _pmapSetExplainerState(-1);
    _pmapRenderDetail(null, null, null);
}

function _pmapStartRevealSequence() {
    if (!_pmapState.tasks.length) return;
    _pmapClearRevealTimer();
    _pmapState.revealCompleted = true;
    _pmapState.revealStageIndex = 0;
    _pmapSetExplainerState(0);
    _pmapRenderPlot();
}

function _pmapEnsureSectionObserver() {
    if (_pmapState.sectionObserver || !('IntersectionObserver' in window)) return;
    var section = document.getElementById('v2-pressure-map');
    if (!section) return;
    _pmapState.sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.target !== section) return;
            _pmapState.sectionVisible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
            if (_pmapState.sectionVisible && _pmapState.tasks.length && _pmapState.revealStageIndex < 0) {
                _pmapStartRevealSequence();
            }
        });
    }, { threshold: [0.25, 0.45, 0.7] });
    _pmapState.sectionObserver.observe(section);
}

function _pmapDefaultSelectionIndex(tasks) {
    var bestIdx = 0;
    var bestShare = -1;
    tasks.forEach(function (task, idx) {
        var share = Number(task && task.share_of_role) || 0;
        if (share > bestShare) {
            bestShare = share;
            bestIdx = idx;
        }
    });
    return bestIdx;
}

function _pmapRepresentativeTaskIds(tasks, xKey, yKey) {
    var ids = new Set();
    for (var gx = 0; gx < 2; gx++) {
        for (var gy = 0; gy < 2; gy++) {
            var cx = (gx + 0.5) / 2;
            var cy = (gy + 0.5) / 2;
            var bestIdx = -1;
            var bestDistance = Infinity;
            tasks.forEach(function (task, idx) {
                var xVal = Number(task[xKey]);
                var yVal = Number(task[yKey]);
                if (!Number.isFinite(xVal) || !Number.isFinite(yVal)) return;
                var distance = Math.hypot(xVal - cx, yVal - cy);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIdx = idx;
                }
            });
            if (bestIdx >= 0) ids.add(_pmapTaskKey(tasks[bestIdx], bestIdx));
        }
    }
    return ids;
}

function _pmapClampPan() {
    var plot = document.getElementById('r-dx-pmap-plot');
    if (!plot) return;
    if (_pmapState.zoom <= 1) {
        _pmapState.panX = 0;
        _pmapState.panY = 0;
        return;
    }
    var width = plot.offsetWidth;
    var height = plot.offsetHeight;
    _pmapState.panX = Math.max(width - (width * _pmapState.zoom), Math.min(0, _pmapState.panX));
    _pmapState.panY = Math.max(height - (height * _pmapState.zoom), Math.min(0, _pmapState.panY));
}

function _pmapApplyTransform() {
    var plot = document.getElementById('r-dx-pmap-plot');
    var surface = plot ? plot.querySelector('.r-dx-pmap-surface') : null;
    if (!plot || !surface) return;
    surface.style.transformOrigin = '0 0';
    surface.style.transform = 'translate(' + _pmapState.panX + 'px, ' + _pmapState.panY + 'px) scale(' + _pmapState.zoom + ')';
    plot.classList.toggle('is-zoomed', _pmapState.zoom > 1);
}

function _pmapZoomAt(factor, clientX, clientY) {
    var plot = document.getElementById('r-dx-pmap-plot');
    if (!plot) return;
    var rect = plot.getBoundingClientRect();
    var px = clientX - rect.left;
    var py = clientY - rect.top;
    var newZoom = Math.max(1, Math.min(10, _pmapState.zoom * factor));
    if (newZoom === _pmapState.zoom) return;
    var ratio = newZoom / _pmapState.zoom;
    _pmapState.panX = px - (ratio * (px - _pmapState.panX));
    _pmapState.panY = py - (ratio * (py - _pmapState.panY));
    _pmapState.zoom = newZoom;
    _pmapClampPan();
    _pmapApplyTransform();
}

function _pmapResetZoom() {
    _pmapState.zoom = 1;
    _pmapState.panX = 0;
    _pmapState.panY = 0;
    _pmapApplyTransform();
}

function _pmapActiveTaskId() {
    return _pmapState.selectedTaskId;
}

function _pmapCurrentFilterValue(scheme) {
    if (!scheme || !_pmapState.legendFilter) return null;
    return _pmapState.legendFilter.schemeKey === scheme.key ? _pmapState.legendFilter.value : null;
}

function _pmapTaskMatchesFilter(task, scheme) {
    var activeFilter = _pmapCurrentFilterValue(scheme);
    if (!activeFilter) return true;
    return String(task && task[scheme.key] ? task[scheme.key] : 'other') === activeFilter;
}

function _pmapLabelPlacement(xVal, yVal, xMedian, yMedian) {
    return {
        dx: xVal >= xMedian ? -12 : 10,
        dy: yVal >= yMedian ? 12 : -16,
        align: xVal >= xMedian ? 'left' : 'right'
    };
}

function _pmapEstimateLabelBox(px, py, text, placement) {
    var width = Math.min(140, Math.max(48, (String(text || '').length * 6.3) + 16));
    var height = 16;
    var x = placement.align === 'left' ? px + placement.dx - width : px + placement.dx;
    var y = py + placement.dy - (height / 2);
    return { x: x, y: y, width: width, height: height };
}

function _pmapBoxesOverlap(leftBox, rightBox) {
    return !(
        leftBox.x + leftBox.width < rightBox.x ||
        rightBox.x + rightBox.width < leftBox.x ||
        leftBox.y + leftBox.height < rightBox.y ||
        rightBox.y + rightBox.height < leftBox.y
    );
}

function _pmapTouchDistance(firstTouch, secondTouch) {
    return Math.hypot(secondTouch.clientX - firstTouch.clientX, secondTouch.clientY - firstTouch.clientY);
}

function _pmapTouchCenter(firstTouch, secondTouch) {
    return {
        x: (firstTouch.clientX + secondTouch.clientX) / 2,
        y: (firstTouch.clientY + secondTouch.clientY) / 2
    };
}

function _pmapCenterTaskAtIndex(idx, boostZoom) {
    var plot = document.getElementById('r-dx-pmap-plot');
    var tasks = _pmapState.tasks || [];
    if (!plot || idx < 0 || !tasks[idx]) return;

    var axisMap = _pmapAxisMap();
    var axes = _pmapGetActiveView(axisMap);
    var task = tasks[idx];
    var rect = plot.getBoundingClientRect();
    var left = 72;
    var right = 22;
    var top = 18;
    var bottom = 52;
    var width = Math.max(100, rect.width - left - right);
    var height = Math.max(120, rect.height - top - bottom);
    var targetZoom = boostZoom ? Math.max(_pmapState.zoom, 1.6) : _pmapState.zoom;
    var xVal = Number(task[axes.x]) || 0;
    var yVal = Number(task[axes.y]) || 0;
    var pointX = left + (xVal * width);
    var pointY = top + ((1 - yVal) * height);

    _pmapState.zoom = targetZoom;
    _pmapState.panX = (rect.width / 2) - (pointX * targetZoom);
    _pmapState.panY = (rect.height / 2) - (pointY * targetZoom);
    _pmapClampPan();
    _pmapApplyTransform();
}

function renderPressureScatter(result) {
    var tasks = result && result.task_breakdown && result.task_breakdown.tasks ? result.task_breakdown.tasks : [];
    var plot = document.getElementById('r-dx-pmap-plot');
    var pointsLayer = document.getElementById('r-dx-pmap-points');
    var status = document.getElementById('r-dx-pmap-status');
    var xSelect = document.getElementById('r-dx-pmap-x');
    var ySelect = document.getElementById('r-dx-pmap-y');
    var viewSelect = document.getElementById('r-dx-pmap-view');
    if (!plot || !pointsLayer || !xSelect || !ySelect) return;

    _pmapState.tasks = tasks;
    _pmapState.result = result;
    _pmapState.renderVersion += 1;
    _pmapState.selectedIdx = -1;
    _pmapState.isDragging = false;
    _pmapState.suppressNextTap = false;
    _pmapState.pointPositions = {};
    _pmapState.revealStageIndex = -1;
    _pmapState.revealCompleted = false;
    _pmapClearRevealTimer();
    plot.classList.remove('is-dragging');

    if (!tasks.length) {
        pointsLayer.innerHTML = '';
        if (status) status.textContent = 'No task breakdown is available for this role yet.';
        _pmapSetExplainerState(-1);
        _pmapClearSelection();
        return;
    }

    var axisMap = _pmapAxisMap();
    var axesJustLoaded = xSelect.dataset.pmapAxesLoaded !== 'true' || ySelect.dataset.pmapAxesLoaded !== 'true';
    _pmapPopulateAxisSelect(xSelect);
    _pmapPopulateAxisSelect(ySelect);
    if (axesJustLoaded) {
        _pmapApplyPreset(viewSelect && PMAP_VIEWS[viewSelect.value] ? viewSelect.value : 'pressure_vs_leverage');
    } else if (!axisMap.has(xSelect.value) || !axisMap.has(ySelect.value)) {
        _pmapApplyPreset(viewSelect && PMAP_VIEWS[viewSelect.value] ? viewSelect.value : 'pressure_vs_leverage');
    }
    _pmapSyncViewSelect();
    _pmapEnsureSectionObserver();

    if (_pmapState.selectedTaskId) {
        var matchedIdx = tasks.findIndex(function (task, idx) {
            return _pmapTaskKey(task, idx) === _pmapState.selectedTaskId;
        });
        if (matchedIdx < 0) _pmapState.selectedTaskId = null;
    }
    if (!_pmapActiveTaskId()) {
        var defaultIdx = _pmapDefaultSelectionIndex(tasks);
        _pmapState.selectedTaskId = _pmapTaskKey(tasks[defaultIdx], defaultIdx);
    }

    // Build cluster color palette dynamically
    var clusterIds = Array.from(new Set(tasks.map(function (task) {
        return task.task_cluster_label || 'Other';
    })));
    var clusterHues = [145, 40, 85, 200, 320, 260, 170, 20];
    PMAP_COLOR_SCHEMES.cluster.colors = {};
    PMAP_COLOR_SCHEMES.cluster.labels = {};
    clusterIds.forEach(function (id, idx) {
        var hue = clusterHues[idx % clusterHues.length];
        PMAP_COLOR_SCHEMES.cluster.colors[id] = 'oklch(0.55 0.09 ' + hue + ' / 0.65)';
        PMAP_COLOR_SCHEMES.cluster.labels[id] = id;
    });

    var colorSelect = document.getElementById('r-dx-pmap-color');
    var labelsToggle = document.getElementById('r-dx-pmap-labels');
    var sizeToggle = document.getElementById('r-dx-pmap-size-share');

    if (!plot._pmapWired) {
        plot._pmapWired = true;
        if (viewSelect) {
            viewSelect.addEventListener('change', function () {
                if (this.value !== 'custom') _pmapApplyPreset(this.value);
                _pmapResetZoom();
                _pmapState.revealCompleted = true;
                _pmapRenderPlot();
            });
        }
        [xSelect, ySelect].forEach(function (select) {
            select.addEventListener('change', function () {
                _pmapSyncViewSelect();
                _pmapResetZoom();
                _pmapState.revealCompleted = true;
                _pmapRenderPlot();
            });
        });
        if (colorSelect) {
            colorSelect.addEventListener('change', function () {
                _pmapState.legendFilter = null;
                _pmapState.revealCompleted = true;
                _pmapRenderPlot();
            });
        }
        [labelsToggle, sizeToggle].forEach(function (control) {
            if (control) control.addEventListener('change', function () {
                _pmapState.revealCompleted = true;
                _pmapRenderPlot();
            });
        });
        window.addEventListener('resize', function () {
            _pmapClampPan();
            _pmapApplyTransform();
            _pmapDebouncedRender();
        });
        plot.addEventListener('wheel', function (event) {
            event.preventDefault();
            _pmapZoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15, event.clientX, event.clientY);
        }, { passive: false });
        plot.addEventListener('mousedown', function (event) {
            if (_pmapState.zoom <= 1 || event.button !== 0) return;
            _pmapState.isDragging = true;
            _pmapState.dragStartX = event.clientX;
            _pmapState.dragStartY = event.clientY;
            _pmapState.dragStartPanX = _pmapState.panX;
            _pmapState.dragStartPanY = _pmapState.panY;
            plot.classList.add('is-dragging');
            event.preventDefault();
        });
        plot.addEventListener('mouseleave', function () {
            _pmapState.hoveredTaskId = null;
            _pmapRenderDetail(null, null, null);
        });
        window.addEventListener('mousemove', function (event) {
            if (!_pmapState.isDragging) return;
            _pmapState.panX = _pmapState.dragStartPanX + (event.clientX - _pmapState.dragStartX);
            _pmapState.panY = _pmapState.dragStartPanY + (event.clientY - _pmapState.dragStartY);
            _pmapClampPan();
            _pmapApplyTransform();
        });
        window.addEventListener('mouseup', function () {
            if (!_pmapState.isDragging) return;
            _pmapState.isDragging = false;
            plot.classList.remove('is-dragging');
        });
        var zoomInBtn = document.getElementById('r-dx-pmap-zoom-in');
        var zoomOutBtn = document.getElementById('r-dx-pmap-zoom-out');
        var zoomResetBtn = document.getElementById('r-dx-pmap-zoom-reset');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', function () {
                var rect = plot.getBoundingClientRect();
                _pmapZoomAt(1.5, rect.left + (rect.width / 2), rect.top + (rect.height / 2));
            });
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', function () {
                var rect = plot.getBoundingClientRect();
                _pmapZoomAt(1 / 1.5, rect.left + (rect.width / 2), rect.top + (rect.height / 2));
            });
        }
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', _pmapResetZoom);
        var focusBtn = document.getElementById('r-dx-pmap-center-selected');
        if (focusBtn) {
            focusBtn.addEventListener('click', function () {
                _pmapCenterTaskAtIndex(_pmapState.selectedIdx, true);
            });
        }

        plot.addEventListener('touchstart', function (event) {
            if (!event.touches || !event.touches.length) return;
            _pmapState.suppressNextTap = false;
            if (event.touches.length >= 2) {
                var center = _pmapTouchCenter(event.touches[0], event.touches[1]);
                _pmapState.isDragging = false;
                _pmapState.pinchStartDistance = _pmapTouchDistance(event.touches[0], event.touches[1]);
                _pmapState.pinchStartZoom = _pmapState.zoom;
                _pmapState.pinchStartCenterX = center.x;
                _pmapState.pinchStartCenterY = center.y;
                _pmapState.pinchStartPanX = _pmapState.panX;
                _pmapState.pinchStartPanY = _pmapState.panY;
                plot.classList.add('is-dragging');
                return;
            }
            if (_pmapState.zoom <= 1) return;
            _pmapState.isDragging = true;
            _pmapState.dragStartX = event.touches[0].clientX;
            _pmapState.dragStartY = event.touches[0].clientY;
            _pmapState.dragStartPanX = _pmapState.panX;
            _pmapState.dragStartPanY = _pmapState.panY;
            plot.classList.add('is-dragging');
        }, { passive: true });

        plot.addEventListener('touchmove', function (event) {
            if (!event.touches || !event.touches.length) return;
            if (event.touches.length >= 2 && _pmapState.pinchStartDistance > 0) {
                event.preventDefault();
                var center = _pmapTouchCenter(event.touches[0], event.touches[1]);
                var distance = _pmapTouchDistance(event.touches[0], event.touches[1]);
                var rect = plot.getBoundingClientRect();
                var px = center.x - rect.left;
                var py = center.y - rect.top;
                var newZoom = Math.max(1, Math.min(10, _pmapState.pinchStartZoom * (distance / _pmapState.pinchStartDistance)));
                var ratio = newZoom / _pmapState.pinchStartZoom;
                var startPx = _pmapState.pinchStartCenterX - rect.left;
                var startPy = _pmapState.pinchStartCenterY - rect.top;
                _pmapState.zoom = newZoom;
                _pmapState.panX = px - (ratio * (startPx - _pmapState.pinchStartPanX));
                _pmapState.panY = py - (ratio * (startPy - _pmapState.pinchStartPanY));
                _pmapState.suppressNextTap = true;
                _pmapClampPan();
                _pmapApplyTransform();
                return;
            }
            if (!_pmapState.isDragging || _pmapState.zoom <= 1) return;
            event.preventDefault();
            _pmapState.panX = _pmapState.dragStartPanX + (event.touches[0].clientX - _pmapState.dragStartX);
            _pmapState.panY = _pmapState.dragStartPanY + (event.touches[0].clientY - _pmapState.dragStartY);
            if (Math.abs(event.touches[0].clientX - _pmapState.dragStartX) > 4 || Math.abs(event.touches[0].clientY - _pmapState.dragStartY) > 4) {
                _pmapState.suppressNextTap = true;
            }
            _pmapClampPan();
            _pmapApplyTransform();
        }, { passive: false });

        plot.addEventListener('touchend', function (event) {
            if (event.touches && event.touches.length >= 2) return;
            if (event.touches && event.touches.length === 1 && _pmapState.zoom > 1) {
                _pmapState.isDragging = true;
                _pmapState.dragStartX = event.touches[0].clientX;
                _pmapState.dragStartY = event.touches[0].clientY;
                _pmapState.dragStartPanX = _pmapState.panX;
                _pmapState.dragStartPanY = _pmapState.panY;
                _pmapState.pinchStartDistance = 0;
                return;
            }
            _pmapState.isDragging = false;
            _pmapState.pinchStartDistance = 0;
            plot.classList.remove('is-dragging');
        });
    }

    _pmapResetZoom();
    if (_pmapState.sectionVisible || !('IntersectionObserver' in window)) {
        _pmapStartRevealSequence();
    } else {
        _pmapRenderDormantState();
    }
}

var _pmapRenderTimer = null;
function _pmapDebouncedRender() {
    clearTimeout(_pmapRenderTimer);
    _pmapRenderTimer = setTimeout(_pmapRenderPlot, 120);
}

function _pmapRenderPlot() {
    var tasks = _pmapState.tasks;
    var plot = document.getElementById('r-dx-pmap-plot');
    var pointsLayer = document.getElementById('r-dx-pmap-points');
    var legend = document.getElementById('r-dx-pmap-legend');
    var caption = document.getElementById('r-dx-pmap-caption');
    var status = document.getElementById('r-dx-pmap-status');
    var xTitle = document.getElementById('r-dx-pmap-x-title');
    var yTitle = document.getElementById('r-dx-pmap-y-title');
    if (!plot || !pointsLayer || !tasks.length) return;

    var axisMap = _pmapAxisMap();
    var colorSelect = document.getElementById('r-dx-pmap-color');
    var labelsToggle = document.getElementById('r-dx-pmap-labels');
    var sizeToggle = document.getElementById('r-dx-pmap-size-share');

    var axes = _pmapGetActiveView(axisMap);
    var showLabels = labelsToggle ? labelsToggle.checked : true;
    var sizeByShare = sizeToggle ? sizeToggle.checked : true;
    var scheme = PMAP_COLOR_SCHEMES[colorSelect && colorSelect.value ? colorSelect.value : 'mode'] || PMAP_COLOR_SCHEMES.mode;
    var activeFilterValue = _pmapCurrentFilterValue(scheme);
    var defaultMedians = _pmapDefaultMedians(tasks);
    var explainerStage = _pmapState.revealStageIndex >= 0 ? PMAP_REVEAL_STAGES[_pmapState.revealStageIndex] : null;
    var activeStage = !_pmapState.revealCompleted && explainerStage ? explainerStage : null;

    // Update axis titles and caption
    if (xTitle) xTitle.textContent = axes.xLabel;
    if (yTitle) yTitle.textContent = axes.yLabel;
    if (caption) caption.textContent = '';

    var quadEls = plot.querySelectorAll('.r-dx-pmap-quadrant');
    if (quadEls.length === 4) {
        quadEls[0].textContent = axes.quadrants[0];
        quadEls[1].textContent = axes.quadrants[1];
        quadEls[2].textContent = axes.quadrants[2];
        quadEls[3].textContent = axes.quadrants[3];
    }

    // Compute layout
    pointsLayer.innerHTML = '';
    _pmapState.pointPositions = {};
    var plotRect = plot.getBoundingClientRect();
    var left = 72, right = 22, top = 18, bottom = 52;
    var width = Math.max(100, plotRect.width - left - right);
    var height = Math.max(120, plotRect.height - top - bottom);

    var xMedian = _pmapMedian(tasks.map(function (task) { return Number(task[axes.x]); }));
    var yMedian = _pmapMedian(tasks.map(function (task) { return Number(task[axes.y]); }));
    var medians = { x: xMedian, y: yMedian };

    var midlineY = plot.querySelector('.r-dx-pmap-midline--x');
    var midlineX = plot.querySelector('.r-dx-pmap-midline--y');
    if (midlineY) midlineY.style.left = (left + (xMedian * width)) + 'px';
    if (midlineX) midlineX.style.top = (top + ((1 - yMedian) * height)) + 'px';

    var activeTaskId = _pmapActiveTaskId();
    var selectedIdx = tasks.findIndex(function (task, idx) {
        return _pmapTaskKey(task, idx) === activeTaskId;
    });
    if (selectedIdx >= 0 && !_pmapShouldShowTask(tasks[selectedIdx], defaultMedians)) {
        selectedIdx = -1;
    }
    if (selectedIdx < 0) {
        selectedIdx = tasks.findIndex(function (task) { return _pmapShouldShowTask(task, defaultMedians); });
    }
    if (selectedIdx < 0) {
        selectedIdx = _pmapDefaultSelectionIndex(tasks);
    }
    _pmapState.selectedTaskId = _pmapTaskKey(tasks[selectedIdx], selectedIdx);
    activeTaskId = _pmapState.selectedTaskId;
    _pmapState.selectedIdx = selectedIdx;

    var compactLabels = window.matchMedia && window.matchMedia('(max-width: 960px)').matches;
    var representativeIds = _pmapRepresentativeTaskIds(tasks, axes.x, axes.y);
    var topShareIds = tasks
        .map(function (task, idx) {
            return { id: _pmapTaskKey(task, idx), share: Number(task.share_of_role) || 0 };
        })
        .sort(function (leftEntry, rightEntry) { return rightEntry.share - leftEntry.share; })
        .slice(0, compactLabels ? 1 : 3)
        .map(function (entry) { return entry.id; });
    var labelIds = new Set(topShareIds);
    representativeIds.forEach(function (id) { labelIds.add(id); });
    labelIds.add(activeTaskId);

    var placedLabelBoxes = [];

    // Place dots
    tasks.forEach(function (task, idx) {
        var xVal = Number(task[axes.x]) || 0;
        var yVal = Number(task[axes.y]) || 0;
        var share = Number(task.share_of_role) || 0;
        var stageKey = _pmapTaskStageKey(task, defaultMedians);
        if (!_pmapShouldShowTask(task, defaultMedians)) {
            return;
        }

        var px = left + (xVal * width);
        var py = top + ((1 - yVal) * height);

        var baseSize = sizeByShare ? Math.max(8, Math.min(34, 8 + (Math.sqrt(share) * 40))) : 12;
        var colorVal = task[scheme.key] || 'other';
        var bg = scheme.colors[colorVal] || 'rgba(28, 27, 24, 0.3)';
        var taskKey = _pmapTaskKey(task, idx);
        _pmapState.pointPositions[taskKey] = { x: px, y: py };

        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'r-dx-pmap-point';
        dot.dataset.taskIndex = String(idx);
        dot.dataset.stageKey = stageKey;
        dot.style.left = px + 'px';
        dot.style.top = py + 'px';
        dot.style.width = baseSize + 'px';
        dot.style.height = baseSize + 'px';
        dot.style.background = bg;
        dot.setAttribute('aria-label', (task.task_statement || 'Task') + ': ' + axes.xLabel + ' ' + _pmapPercent(task[axes.x]) + ', ' + axes.yLabel + ' ' + _pmapPercent(task[axes.y]));
        dot.title = (task.task_statement || 'Task') + ' - ' + axes.xLabel + ' ' + _pmapPercent(task[axes.x]) + ' - ' + axes.yLabel + ' ' + _pmapPercent(task[axes.y]);

        if (selectedIdx === idx) {
            dot.classList.add('is-selected');
        }
        if (activeStage && stageKey === activeStage.key) {
            dot.classList.add('is-stage-focus');
        } else if (activeStage) {
            dot.classList.add('is-stage-muted');
        }
        if (!_pmapTaskMatchesFilter(task, scheme) && selectedIdx !== idx) {
            dot.classList.add('is-filtered');
        }

        dot.addEventListener('mouseenter', function () {
            _pmapState.hoveredTaskId = taskKey;
            _pmapSelectTask(idx, axes, medians);
        });
        dot.addEventListener('focus', function () {
            _pmapState.hoveredTaskId = taskKey;
            _pmapSelectTask(idx, axes, medians);
        });
        dot.addEventListener('blur', function () {
            _pmapState.hoveredTaskId = null;
            _pmapRenderDetail(null, null, null);
        });
        pointsLayer.appendChild(dot);

        if (labelIds.has(taskKey) && (showLabels || selectedIdx === idx)) {
            var labelText = truncateV2TaskLabel(task.task_statement || 'Unnamed task', compactLabels ? 28 : 40);
            var placement = _pmapLabelPlacement(xVal, yVal, xMedian, yMedian);
            var labelBox = _pmapEstimateLabelBox(px, py, labelText, placement);
            var forceLabel = taskKey === activeTaskId;
            var overlaps = placedLabelBoxes.some(function (existingBox) {
                return _pmapBoxesOverlap(existingBox, labelBox);
            });
            if (!forceLabel && overlaps) {
                return;
            }
            var label = document.createElement('div');
            label.className = 'r-dx-pmap-label';
            label.dataset.taskIndex = String(idx);
            label.dataset.stageKey = stageKey;
            label.classList.toggle('r-dx-pmap-label--left', placement.align === 'left');
            label.style.left = px + 'px';
            label.style.top = py + 'px';
            label.style.transform = 'translate(' + placement.dx + 'px, ' + placement.dy + 'px)';
            label.textContent = labelText;
            if (selectedIdx === idx) label.classList.add('is-selected');
            if (activeStage && stageKey === activeStage.key) {
                label.classList.add('is-stage-focus');
            } else if (activeStage) {
                label.classList.add('is-stage-muted');
            }
            if (!_pmapTaskMatchesFilter(task, scheme) && selectedIdx !== idx) label.classList.add('is-filtered');
            pointsLayer.appendChild(label);
            placedLabelBoxes.push(labelBox);
        }
    });

    // Build legend
    if (legend) {
        legend.innerHTML = '';
        var seen = new Set();
        tasks.forEach(function (task) {
            var val = task[scheme.key] || 'other';
            if (seen.has(val)) return;
            seen.add(val);
            var color = scheme.colors[val] || 'rgba(28, 27, 24, 0.3)';
            var lbl = scheme.labels[val] || formatV2Label(val);
            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'r-dx-pmap-legend-item';
            if (activeFilterValue === val) item.classList.add('is-active');
            item.innerHTML = '<span class="r-dx-pmap-legend-swatch" style="background:' + color + '"></span><span>' + lbl + '</span>';
            item.addEventListener('click', function () {
                _pmapClearRevealTimer();
                _pmapState.revealCompleted = true;
                if (_pmapState.legendFilter && _pmapState.legendFilter.schemeKey === scheme.key && _pmapState.legendFilter.value === val) {
                    _pmapState.legendFilter = null;
                } else {
                    _pmapState.legendFilter = { schemeKey: scheme.key, value: val, label: lbl };
                    var matchingIdx = tasks.findIndex(function (task, idx) {
                        return _pmapTaskKey(task, idx) === _pmapActiveTaskId() && _pmapTaskMatchesFilter(task, scheme);
                    });
                    if (matchingIdx < 0) {
                        var fallbackIdx = tasks.findIndex(function (task) {
                            return String(task && task[scheme.key] ? task[scheme.key] : 'other') === val;
                        });
                        if (fallbackIdx >= 0) {
                            _pmapState.selectedTaskId = _pmapTaskKey(tasks[fallbackIdx], fallbackIdx);
                        }
                    }
                }
                _pmapRenderPlot();
            });
            legend.appendChild(item);
        });
    }

    var directEvidenceCount = tasks.filter(function (task) { return !!task.has_direct_evidence; }).length;
    var proxyHeavy = directEvidenceCount === 0 || _pmapMedian(tasks.map(function (task) { return Number(task.evidence_confidence); })) < 0.4;
    var visibleCount = tasks.filter(function (task) { return _pmapShouldShowTask(task, defaultMedians) && _pmapTaskMatchesFilter(task, scheme); }).length;
    if (explainerStage) {
        safeSetText('v2-pressure-map-sub', explainerStage.note);
    } else {
        safeSetText('v2-pressure-map-sub', axes.desc);
    }
    if (status) {
        var statusParts = [];
        if (!_pmapState.revealCompleted && explainerStage) {
            statusParts.push('Highlighting ' + explainerStage.title.toLowerCase());
        } else {
            statusParts.push('Showing ' + visibleCount + ' of ' + tasks.length + ' tasks');
        }
        if (_pmapState.legendFilter && _pmapState.legendFilter.schemeKey === scheme.key) {
            statusParts.push('filtered to ' + _pmapState.legendFilter.label);
        }
        if (tasks.length <= 4) {
            statusParts.push('the map is sparse for this role');
        } else if (proxyHeavy) {
            statusParts.push('this view is still fairly proxy-backed');
        }
        status.textContent = statusParts.join(' · ') + '. Hover a bubble for task detail and use the steps on the right to revisit each task lens.';
    }

    _pmapClampPan();
    _pmapApplyTransform();
    _pmapSelectTask(selectedIdx, axes, medians);
}

function _pmapRenderDetail(task, axes, medians) {
    var detail = document.getElementById('r-dx-pmap-detail');
    if (!detail) return;

    if (!task || !axes || !medians) {
        detail.hidden = true;
        detail.innerHTML = '<h3>Select a task</h3><p>Hover a bubble to inspect the task.</p>';
        return;
    }

    var taskId = _pmapTaskKey(task, _pmapState.selectedIdx);
    var plotWrap = document.querySelector('.r-dx-pmap-plot-wrap');
    var plot = document.getElementById('r-dx-pmap-plot');
    var point = _pmapState.pointPositions[taskId];
    detail.hidden = false;
    if (plotWrap && plot && point) {
        var cardWidth = Math.min(320, Math.max(260, plot.offsetWidth * 0.42));
        detail.style.width = cardWidth + 'px';
        detail.style.left = Math.max(12, Math.min(point.x + 18, plot.offsetWidth - cardWidth - 12)) + 'px';
        detail.style.top = Math.max(12, Math.min(point.y + 18, plot.offsetHeight - 170)) + 'px';
    }

    detail.innerHTML =
        '<h3>' + (task.task_statement || 'Unnamed task') + '</h3>' +
        '<div class="r-dx-pmap-meta">' +
            '<div class="r-dx-pmap-meta-row"><span>X-axis</span><strong>' + axes.xLabel + ': ' + _pmapPercent(task[axes.x]) + '</strong></div>' +
            '<div class="r-dx-pmap-meta-row"><span>Y-axis</span><strong>' + axes.yLabel + ': ' + _pmapPercent(task[axes.y]) + '</strong></div>' +
            '<div class="r-dx-pmap-meta-row"><span>Role share</span><strong>' + _pmapPercent(task.share_of_role) + '</strong></div>' +
            '<div class="r-dx-pmap-meta-row"><span>Direct pressure</span><strong>' + _pmapPercent(task.direct_exposure_pressure) + '</strong></div>' +
            '<div class="r-dx-pmap-meta-row"><span>Spillover pressure</span><strong>' + _pmapPercent(task.indirect_dependency_pressure) + '</strong></div>' +
            '<div class="r-dx-pmap-meta-row"><span>Retained leverage</span><strong>' + _pmapPercent(task.retained_leverage) + '</strong></div>' +
            '<div class="r-dx-pmap-meta-row"><span>Automation difficulty</span><strong>' + _pmapPercent(task.automation_difficulty) + '</strong></div>' +
            '<div class="r-dx-pmap-meta-row"><span>Role criticality</span><strong>' + formatV2Label(task.role_criticality || '-') + '</strong></div>' +
        '</div>';
}

function _pmapSelectTask(idx, axes, medians) {
    _pmapState.selectedIdx = idx;
    var t = _pmapState.tasks[idx];
    var pointsLayer = document.getElementById('r-dx-pmap-points');
    var status = document.getElementById('r-dx-pmap-status');
    var colorSelect = document.getElementById('r-dx-pmap-color');
    var scheme = PMAP_COLOR_SCHEMES[colorSelect && colorSelect.value ? colorSelect.value : 'mode'] || PMAP_COLOR_SCHEMES.mode;
    if (!t) return;

    var taskKey = _pmapTaskKey(t, idx);
    _pmapState.selectedTaskId = taskKey;

    // Highlight selected, dim others
    var dots = pointsLayer ? pointsLayer.querySelectorAll('.r-dx-pmap-point') : [];
    dots.forEach(function (d) {
        var isSelected = Number(d.dataset.taskIndex) === idx;
        var task = _pmapState.tasks[Number(d.dataset.taskIndex)];
        var matchesFilter = _pmapTaskMatchesFilter(task, scheme);
        d.classList.toggle('is-selected', isSelected);
        d.classList.toggle('is-filtered', !matchesFilter && !isSelected);
        d.classList.toggle('is-dimmed', false);
    });

    var labels = pointsLayer ? pointsLayer.querySelectorAll('.r-dx-pmap-label') : [];
    labels.forEach(function (label) {
        var isSelected = Number(label.dataset.taskIndex) === idx;
        var task = _pmapState.tasks[Number(label.dataset.taskIndex)];
        var matchesFilter = _pmapTaskMatchesFilter(task, scheme);
        label.classList.toggle('is-selected', isSelected);
        label.classList.toggle('is-filtered', !matchesFilter && !isSelected);
        label.classList.toggle('is-dimmed', false);
    });

    if (_pmapState.hoveredTaskId === taskKey) {
        _pmapRenderDetail(t, axes, medians);
    } else {
        _pmapRenderDetail(null, null, null);
    }

    if (status) {
        status.textContent = 'Hover a bubble to inspect it and use the steps on the right to revisit each task lens.';
    }
}

function _pmapClearSelection() {
    _pmapState.selectedIdx = -1;
    _pmapState.selectedTaskId = null;
    _pmapState.hoveredTaskId = null;
    var dots = document.querySelectorAll('.r-dx-pmap-point');
    dots.forEach(function (d) {
        d.classList.remove('is-selected', 'is-dimmed');
    });
    var labels = document.querySelectorAll('.r-dx-pmap-label');
    labels.forEach(function (label) {
        label.classList.remove('is-selected', 'is-dimmed');
    });
    _pmapRenderDetail(null, null, null);
}

function renderTriggerGauges(result) {
    const triggerMap = result.transition_trigger_map || {};
    const timingFrontier = result.timing_frontier || {};
    const container = document.getElementById('v2-trigger-grid');
    if (!container) return;
    container.innerHTML = '';

    safeSetText('v2-trigger-summary', result.narrative_summary?.when_the_role_turns || triggerMap.summary || '-');
    safeSetText('v2-bargaining-cliff-summary', triggerMap.bargaining_cliff_summary || '-');

    const triggers = triggerMap.triggers || [];
    const decisiveId = triggerMap.decisive_trigger_id || '';

    triggers.forEach((trigger, i) => {
        const triggerFrontier = timingFrontier.triggers && timingFrontier.triggers[trigger.trigger_id]
            ? timingFrontier.triggers[trigger.trigger_id]
            : {};
        const card = document.createElement('div');
        card.className = 'r-dx-trigger-card';
        if (trigger.trigger_id === decisiveId) {
            card.classList.add('r-dx-trigger-card--decisive');
        }

        const readiness = Math.round((Number(trigger.readiness_score) || 0) * 100);
        const angleDeg = (readiness / 100) * 360;

        card.innerHTML = `
            <div class="r-dx-trigger-header">
                <span class="r-dx-trigger-label">${formatV2Label(trigger.trigger_label || trigger.trigger_id || '')}</span>
                <div class="r-dx-trigger-gauge" style="background: conic-gradient(var(--signal) 0deg, var(--signal) ${angleDeg}deg, var(--rule-light) ${angleDeg}deg);">
                    <div class="r-dx-trigger-gauge-inner">${readiness}%</div>
                </div>
            </div>
            <span class="r-dx-trigger-readiness">${trigger.readiness_label || '-'}</span>
            <div class="r-dx-trigger-frontier">
                <span>${formatV2Label(trigger.crossing_wave || triggerFrontier.crossing_wave || 'distant')} scenario crossing</span>
                <span>${trigger.binding_constraint_label || triggerFrontier.binding_constraint_label || 'Mixed constraint'}</span>
                <span>Current margin ${formatFrontierMargin(trigger.frontier_margin ?? (triggerFrontier.scenario_margins && triggerFrontier.scenario_margins.current))}</span>
            </div>
            <div class="r-dx-trigger-detail">
                <div class="r-dx-trigger-detail-inner">
                    ${trigger.threshold_summary ? `<p><strong>Threshold:</strong> ${trigger.threshold_summary}</p>` : ''}
                    ${trigger.mechanism_summary ? `<p><strong>Mechanism:</strong> ${trigger.mechanism_summary}</p>` : ''}
                    ${trigger.consequence_summary ? `<p><strong>Consequence:</strong> ${trigger.consequence_summary}</p>` : ''}
                    ${triggerFrontier.scenario_margins ? `<p><strong>Scenario margins:</strong> current ${formatFrontierMargin(triggerFrontier.scenario_margins.current)}, next ${formatFrontierMargin(triggerFrontier.scenario_margins.next)}, distant ${formatFrontierMargin(triggerFrontier.scenario_margins.distant)}.</p>` : ''}
                    ${trigger.confidence_reason ? `<p><strong>Confidence:</strong> ${trigger.confidence_reason}</p>` : ''}
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            card.classList.toggle('is-expanded');
        });

        container.appendChild(card);

        // Pulse the decisive trigger card
        if (trigger.trigger_id === decisiveId) {
            setTimeout(() => card.classList.add('is-pulsed'), 800 + i * 100);
        }
    });
}

function renderLandscapeStat(result, rows) {
    const statEl = document.getElementById('v2-landscape-stat');
    const copyEl = document.getElementById('v2-occupation-forecast-copy');
    if (!statEl) return;

    const list = Array.isArray(rows) ? rows : [];
    const hierarchyCopy = formatLandscapeHierarchyLabel(v2OccupationLandscapeControls.hierarchyLevel);
    if (!list.length) {
        statEl.textContent = `How your role compares to others across the modeled occupation set using reviewed default questionnaire settings at ${hierarchyCopy}.`;
        if (copyEl) {
            copyEl.textContent = `Each row shows the dominant occupational state at each year from 0 to 10 at ${hierarchyCopy}.`;
        }
        return;
    }

    const selectedId = String(result?.selected_occupation_id || result?.occupation_id || selectedOccupationId || '');
    const selectedRow = list.find((row) => String(row.occupation_id) === selectedId) || null;
    const year5CompressedOrWorse = list.filter((row) => forecastStateSeverity(row.year5State) >= forecastStateSeverity('compressed')).length;
    const year10Displaced = list.filter((row) => row.year10State === 'displaced').length;
    const firstShift = selectedRow?.firstShiftYear !== null && selectedRow?.firstShiftYear !== undefined
        ? formatYearsApprox(selectedRow.firstShiftYear)
        : 'after year 10';

    statEl.textContent = selectedRow
        ? `${selectedRow.title} currently tracks ${formatForecastStateLabel(selectedRow.currentState).toLowerCase()}, first shifts ${firstShift}, and reads ${formatForecastStateLabel(selectedRow.year5State).toLowerCase()} by year 5.`
        : `All ${list.length} modeled occupations are shown on the same 0-10 year scale at ${hierarchyCopy}.`;

    if (copyEl) {
        copyEl.textContent = `${year5CompressedOrWorse} of ${list.length} roles read as compressed or displaced by year 5, while ${year10Displaced} read as displaced by year 10 at ${hierarchyCopy}.`;
    }
}

function renderOccupationOutcomeChart(result, rows) {
    const container = document.getElementById('v2-occupation-outcome-chart');
    const readout = document.getElementById('v2-occupation-outcome-readout');
    if (!container) return;

    if (v2OccupationOutcomeChart) {
        v2OccupationOutcomeChart.destroy();
        v2OccupationOutcomeChart = null;
    }

    container.innerHTML = '';

    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
        container.innerHTML = '<div class="r-trajectory-graph-empty">The occupation outcome map appears once the role is scored.</div>';
        if (readout) {
            readout.textContent = 'This chart will compare all modeled occupations by first structural shift and year-10 displacement share.';
        }
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'r-trajectory-graph-canvas';
    canvas.setAttribute('aria-label', 'Occupation outcome map from the structural state model.');
    canvas.setAttribute('aria-describedby', 'v2-occupation-outcome-readout');
    container.appendChild(canvas);

    const selectedId = String(result?.selected_occupation_id || result?.occupation_id || selectedOccupationId || '');
    const chartFont = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'Inter, sans-serif';
    const palette = {
        retained: '#55766f',
        complemented: '#5d7d8e',
        compressed: '#a3653e',
        rebundled: '#8f6a49',
        displaced: '#8c4940',
        indeterminate: '#7a6d5d'
    };
    const stateOrder = ['retained', 'complemented', 'rebundled', 'compressed', 'displaced', 'indeterminate'];
    const datasets = stateOrder.map((state) => ({
        label: formatForecastStateLabel(state === 'indeterminate' ? 'rebundled' : state),
        data: list
            .filter((row) => {
                const rowState = palette[row.year10State] ? row.year10State : 'indeterminate';
                return rowState === state;
            })
            .map((row) => ({
                x: row.firstShiftYear !== null && row.firstShiftYear !== undefined ? Number(row.firstShiftYear) : 10.2,
                y: Number(row.displacedYear10 || 0),
                occupationId: row.occupation_id,
                title: row.title,
                pathLabel: row.pathLabel,
                year5State: row.year5State,
                year10State: row.year10State,
                selected: String(row.occupation_id) === selectedId
            })),
        backgroundColor: palette[state],
        borderColor: '#f7f4ed',
        borderWidth: 1.2,
        pointRadius(context) {
            return context.raw?.selected ? 7 : 4.5;
        },
        pointHoverRadius: 7,
        pointHitRadius: 12
    }));

    v2OccupationOutcomeChart = new Chart(canvas.getContext('2d'), {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title(items) {
                            return items?.[0]?.raw?.title || 'Occupation';
                        },
                        label(context) {
                            const x = Number(context.raw?.x || 0);
                            const shiftCopy = x > 10 ? 'No dominant shift before year 10' : `First structural shift: ${formatYearsApprox(x)}`;
                            return [
                                shiftCopy,
                                `Year 10 displacement: ${Math.round((Number(context.raw?.y) || 0) * 100)}%`,
                                `Year 5 state: ${formatForecastStateLabel(context.raw?.year5State)}`,
                                `Year 10 state: ${formatForecastStateLabel(context.raw?.year10State)}`,
                                context.raw?.pathLabel || ''
                            ];
                        }
                    },
                    backgroundColor: 'rgba(33, 30, 26, 0.94)',
                    titleColor: '#f7f4ed',
                    bodyColor: '#f7f4ed',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 10.5,
                    grid: { color: 'rgba(105, 98, 85, 0.10)' },
                    border: { display: false },
                    title: {
                        display: true,
                        text: 'First structural shift (years)',
                        color: '#6f685c',
                        font: { family: chartFont, size: 11, weight: '700' }
                    },
                    ticks: {
                        stepSize: 1,
                        color: '#6f685c',
                        font: { family: chartFont, size: 11, weight: '600' },
                        callback(value) {
                            const numeric = Number(value);
                            return Number.isInteger(numeric) && numeric >= 0 && numeric <= 10 ? `${numeric}` : '';
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    grid: { color: 'rgba(105, 98, 85, 0.10)' },
                    border: { display: false },
                    title: {
                        display: true,
                        text: 'Year-10 displacement share',
                        color: '#6f685c',
                        font: { family: chartFont, size: 11, weight: '700' }
                    },
                    ticks: {
                        stepSize: 0.25,
                        color: '#6f685c',
                        font: { family: chartFont, size: 11, weight: '600' },
                        callback(value) {
                            return `${Math.round(Number(value) * 100)}%`;
                        }
                    }
                }
            }
        }
    });

    const selectedRow = list.find((row) => String(row.occupation_id) === selectedId) || null;
    if (readout) {
        readout.textContent = selectedRow
            ? `${selectedRow.title} first shifts ${selectedRow.firstShiftYear !== null && selectedRow.firstShiftYear !== undefined ? formatYearsApprox(selectedRow.firstShiftYear) : 'after year 10'}, reaches ${Math.round(selectedRow.displacedYear10 * 100)}% year-10 displacement, and currently follows ${selectedRow.pathLabel}.`
            : 'Earlier shifts sit left, higher long-run displacement rises upward, and color shows the likely year-10 dominant state.';
    }
}

async function renderOccupationForecastMatrix(result) {
    const grid = document.getElementById('v2-occupation-forecast-grid');
    const status = document.getElementById('v2-occupation-forecast-status');
    const outcomeContainer = document.getElementById('v2-occupation-outcome-chart');
    if (!grid) return;

    const requestId = ++v2OccupationForecastMatrixRequestId;
    const cacheHit = v2OccupationForecastMatrixCache.has(getOccupationLandscapeControlKey());
    const hierarchyCopy = formatLandscapeHierarchyLabel(v2OccupationLandscapeControls.hierarchyLevel);

    if (status) {
        status.textContent = cacheHit
            ? `Updating the occupation comparison set under ${hierarchyCopy}…`
            : `Building 0-10 default paths for all modeled occupations at ${hierarchyCopy}…`;
    }
    if (!grid.children.length) {
        grid.innerHTML = '<div class="r-trajectory-graph-empty">Building the occupation landscape…</div>';
    }
    if (outcomeContainer && !outcomeContainer.children.length) {
        outcomeContainer.innerHTML = '<div class="r-trajectory-graph-empty">Building the occupation outcome map…</div>';
    }

    try {
        const rows = await computeOccupationForecastMatrixRows();
        if (requestId !== v2OccupationForecastMatrixRequestId) {
            return;
        }

        const selectedId = String(result?.selected_occupation_id || result?.occupation_id || selectedOccupationId || '');
        const orderedRows = rows.slice().sort((left, right) => {
            const leftSelected = String(left.occupation_id) === selectedId ? 1 : 0;
            const rightSelected = String(right.occupation_id) === selectedId ? 1 : 0;
            if (leftSelected !== rightSelected) {
                return rightSelected - leftSelected;
            }
            const year5SeverityDelta = forecastStateSeverity(right.year5State) - forecastStateSeverity(left.year5State);
            if (year5SeverityDelta !== 0) {
                return year5SeverityDelta;
            }
            const shiftLeft = Number.isFinite(left.firstShiftYear) ? left.firstShiftYear : 99;
            const shiftRight = Number.isFinite(right.firstShiftYear) ? right.firstShiftYear : 99;
            if (shiftLeft !== shiftRight) {
                return shiftLeft - shiftRight;
            }
            return String(left.title).localeCompare(String(right.title));
        });

        grid.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'r-occupation-forecast-row r-occupation-forecast-row--header';
        header.innerHTML = `
            <div class="r-occupation-forecast-role">Occupation</div>
            <div class="r-occupation-forecast-track-head">
                ${Array.from({ length: 11 }, (_, year) => `<span>${year}</span>`).join('')}
            </div>
            <div class="r-occupation-forecast-path-head">Dominant path</div>
        `;
        grid.appendChild(header);

        orderedRows.forEach((row) => {
            const article = document.createElement('article');
            article.className = 'r-occupation-forecast-row';
            if (String(row.occupation_id) === selectedId) {
                article.classList.add('is-selected');
            }

            const trackMarkup = row.yearlyPoints.map((point) => `
                <span class="r-occupation-forecast-cell r-occupation-forecast-cell--${point.dominantState}"
                    title="Year ${Math.round(point.year)} · ${formatForecastStateLabel(point.dominantState)} · ${Math.round(point.displacedShare * 100)}% displaced share">
                </span>
            `).join('');

            article.innerHTML = `
                <div class="r-occupation-forecast-role">
                    <strong>${row.title}</strong>
                    <span>${formatForecastStateLabel(row.year5State)} by year 5</span>
                </div>
                <div class="r-occupation-forecast-track" aria-label="${row.title} dominant state path from year 0 to year 10">
                    ${trackMarkup}
                </div>
                <div class="r-occupation-forecast-path">
                    <strong>${row.pathLabel}</strong>
                    <span>${row.firstShiftYear !== null && row.firstShiftYear !== undefined ? `First shift ${formatYearsApprox(row.firstShiftYear)}` : 'No dominant shift before year 10'}</span>
                </div>
            `;
            grid.appendChild(article);
        });

        renderOccupationOutcomeChart(result, orderedRows);
        renderLandscapeStat(result, orderedRows);
        if (status) {
            status.textContent = `Showing ${orderedRows.length} modeled occupations on a shared 0-10 year scale using reviewed default questionnaire settings at ${hierarchyCopy}.`;
        }
    } catch (error) {
        if (requestId !== v2OccupationForecastMatrixRequestId) {
            return;
        }
        if (status) {
            status.textContent = 'The occupation forecast matrix could not be built from the current live engine.';
        }
        grid.innerHTML = '<div class="r-trajectory-graph-empty">Occupation forecast matrix unavailable.</div>';
        renderOccupationOutcomeChart(result, []);
        console.error('[V2] occupation forecast matrix render failed:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════

function renderV2Walkthrough(result) {
    const jobTitle = result?.selected_occupation_title || 'your role';
    const selectedFunctions = getSelectedCompositionFunctions();
    const selectedTasks = sortTasksByDisplayOrder(getSelectedCompositionTasksWithSource());
    const scoredTasks = result?.task_breakdown?.tasks || [];
    const directEvidenceCount = scoredTasks.filter((task) => task.has_direct_evidence).length;
    const functionList = selectedFunctions
        .slice(0, 5)
        .map((fn) => fn.role_summary || fn.function_statement)
        .filter(Boolean);
    const visibleTaskRows = v2OverviewTasksExpanded ? selectedTasks : selectedTasks.slice(0, 6);
    const taskList = visibleTaskRows.map((task) => task.task_statement || 'Unnamed task').filter(Boolean);
    const scoringList = [
        `${selectedTasks.length || 0} active tasks are weighted by how much of the role they occupy.`,
        `${directEvidenceCount || 0} of those tasks currently resolve from direct task evidence; the rest use structured fallback.`,
        'Support links let pressure travel through connected work instead of staying isolated on one task.',
        `${selectedFunctions.length || 0} function anchors receive the roll-up, so the model can see whether the seat still has a durable purpose.`
    ];

    safeSetText('v2-analysis-headline', 'How we analyze your role');
    safeSetText('v2-overview-job-title', jobTitle);
    safeSetText(
        'v2-overview-function-note',
        functionList.length
            ? `${jobTitle} still exists because these functions keep owning judgment, coordination, sign-off, or outcome responsibility.`
            : 'Functions capture why the seat exists, not just what fills the calendar.'
    );
    safeSetText(
        'v2-overview-task-note',
        selectedTasks.length
            ? 'These tasks are customizable if your day-to-day role differs from the occupation baseline.'
            : 'These tasks will appear once the role has a mapped task mix.'
    );
    safeSetText(
        'v2-overview-scoring-note',
        result
            ? 'This is where task share, evidence strength, support links, and function roll-up turn into the live role readout.'
            : 'This is where task share, evidence strength, support links, and function roll-up turn into the live role readout.'
    );

    renderOverviewList(
        'v2-overview-function-list',
        functionList,
        'Function anchors will appear here once the role has a mapped composition.'
    );
    renderOverviewList(
        'v2-overview-task-list',
        taskList,
        'Task rows will appear here once the role has a mapped composition.'
    );
    renderOverviewList(
        'v2-overview-scoring-list',
        scoringList,
        'Scoring logic will appear here once the role has been rebuilt.'
    );

    const toggle = document.getElementById('v2-overview-task-toggle');
    if (toggle) {
        const hasOverflow = selectedTasks.length > 6;
        toggle.hidden = !hasOverflow;
        toggle.textContent = v2OverviewTasksExpanded ? 'Show fewer tasks' : 'See all tasks';
    }

    safeSetText(
        'v2-pressure-secondary-copy',
        result?.audit_trace?.top_spillover_tasks?.length
            ? 'These tasks are usually not the first things AI does directly. They become smaller when nearby prep, coordination, or documentation work compresses.'
            : 'These tasks often lose value because the workflow around them compresses first.'
    );
}

function setV2LoadingState() {
    const hasPriorResult = !!lastV2Result;
    if (!hasPriorResult) {
        safeSetText('v2-state-headline', 'Resolving the structural state read now.');
        safeSetText('v2-state-current', '-');
        safeSetText('v2-state-next', '-');
        safeSetText('v2-state-long-run', '-');
        safeSetText('v2-state-bottleneck', '-');
        safeSetText('v2-state-transition-headline', '-');
        safeSetText('v2-state-transition-copy', '-');
        safeSetText('v2-state-basis-copy', 'This top readout will explain which reviewed baseline the forecast starts from and how hierarchy, role answers, and edits are being used.');
        safeSetText('v2-state-exposure-direct', '-');
        safeSetText('v2-state-exposure-spillover', '-');
        safeSetText('v2-state-exposure-year5', '-');
        safeSetText('v2-state-exposure-core', '-');
        safeSetText('v2-state-integrity-readout', 'The secondary role-coherence chart appears once the role is scored.');
        safeSetText('v2-state-share-readout', 'The secondary state-share forecast appears once the role is scored.');
        safeSetText('v2-state-exposure-bias-value', 'Buildout near baseline');
        syncStateTrajectoryControls();
        safeSetText('v2-trigger-summary', 'Resolving the next organizational thresholds for assistive use, delegation, compression, and structural seat change.');
        safeSetText('v2-frontier-headline', 'Resolving the timing model now.');
        safeSetText('v2-frontier-summary', 'Resolving the blocker, scenario activation, and bundle-level timing drivers now.');
        safeSetText('v2-frontier-constraint', '-');
        safeSetText('v2-frontier-current-activation', '-');
        safeSetText('v2-frontier-next-activation', '-');
        safeSetText('v2-frontier-distant-activation', '-');
        safeSetText('v2-frontier-ceiling', '-');
        safeSetText('v2-frontier-driver-copy', 'Resolving which bundles are setting the timing read now.');
        safeSetText('v2-bargaining-cliff-summary', 'Resolving when the exposed work stops carrying bargaining power.');
        renderV2TransitionTriggers(null);
    }
}

function safelyRunV2Render(label, renderFn) {
    try {
        renderFn();
    } catch (error) {
        console.error(`[V2] ${label} render failed:`, error);
    }
}

// ─── 8. V2 Result functions ─────────────────────────────────────────────────

function resetV2Results(message, detail) {
    v2TaskBreakdownExpanded = false;
    v2OverviewTasksExpanded = false;
    v2OccupationForecastMatrixRequestId += 1;
    safeSetText('v2-state-headline', message || 'Select a role to begin');
    safeSetText('v2-state-current', '-');
    safeSetText('v2-state-next', '-');
    safeSetText('v2-state-long-run', '-');
    safeSetText('v2-state-bottleneck', '-');
    safeSetText('v2-state-transition-headline', '-');
    safeSetText('v2-state-transition-copy', 'This layer tests a new state-transition model on top of the existing scorer.');
    safeSetText('v2-state-basis-copy', 'This top readout will explain which reviewed baseline the forecast starts from and how hierarchy, role answers, and edits are being used.');
    safeSetText('v2-state-exposure-direct', '-');
    safeSetText('v2-state-exposure-spillover', '-');
    safeSetText('v2-state-exposure-year5', '-');
    safeSetText('v2-state-exposure-core', '-');
    safeSetText('v2-state-integrity-readout', 'The secondary role-coherence chart will show how intact today’s version of the job remains over time.');
    safeSetText('v2-state-share-readout', 'The secondary state-share chart will show how strongly each public role state fits at each year.');
    safeSetText('v2-state-exposure-bias-value', 'Buildout near baseline');
    safeSetText('v2-occupation-outcome-readout', 'The occupation outcome map appears once the role is scored.');
    safeSetText('v2-occupation-forecast-copy', `Each row will show the dominant occupational state at each year from 0 to 10 at ${formatLandscapeHierarchyLabel(v2OccupationLandscapeControls.hierarchyLevel)}.`);
    safeSetText('v2-occupation-forecast-status', 'The occupation forecast matrix appears once the role is scored.');
    syncStateTrajectoryControls();
    safeSetText('v2-trigger-summary', '-');
    safeSetText('v2-frontier-headline', '-');
    safeSetText('v2-frontier-summary', '-');
    safeSetText('v2-frontier-constraint', '-');
    safeSetText('v2-frontier-current-activation', '-');
    safeSetText('v2-frontier-next-activation', '-');
    safeSetText('v2-frontier-distant-activation', '-');
    safeSetText('v2-frontier-ceiling', '-');
    safeSetText('v2-frontier-driver-copy', '-');
    safeSetText('v2-bargaining-cliff-summary', '-');
    ['current', 'next', 'distant'].forEach(function (w) {
        safeSetText('v2-wave-' + w + '-state', '-');
        safeSetText('v2-wave-' + w + '-retained', '-');
        safeSetText('v2-wave-' + w + '-coherence', '-');
    });
    renderV2Walkthrough(null);
    renderV2TransitionTriggers(null);
    renderV2TaskBreakdown(null, null);
    renderV2RoleComposition(v2RoleCompositionState?.raw || null);
    const trajectoryGraph = document.getElementById('v2-trajectory-graph');
    const stateGraph = document.getElementById('v2-state-graph');
    const stateIntegrityGraph = document.getElementById('v2-state-integrity-graph');
    const stateShareGraph = document.getElementById('v2-state-share-graph');
    const occupationOutcomeGraph = document.getElementById('v2-occupation-outcome-chart');
    const stateGraphNotes = document.getElementById('v2-state-graph-notes');
    const statePath = document.getElementById('v2-state-forecast-path');
    const occupationForecastGrid = document.getElementById('v2-occupation-forecast-grid');
    const trajectoryDriverGrid = document.getElementById('v2-trajectory-driver-grid');
    const stateSummaryGrid = document.getElementById('v2-state-summary-cards');
    const stateDriverGrid = document.getElementById('v2-state-driver-grid');
    if (v2StateForecastChart) {
        v2StateForecastChart.destroy();
        v2StateForecastChart = null;
    }
    if (v2StateShareChart) {
        v2StateShareChart.destroy();
        v2StateShareChart = null;
    }
    if (v2StateTrajectoryChart) {
        v2StateTrajectoryChart.destroy();
        v2StateTrajectoryChart = null;
    }
    if (v2OccupationOutcomeChart) {
        v2OccupationOutcomeChart.destroy();
        v2OccupationOutcomeChart = null;
    }
    if (trajectoryGraph) trajectoryGraph.innerHTML = '';
    if (stateGraph) stateGraph.innerHTML = '';
    if (stateIntegrityGraph) stateIntegrityGraph.innerHTML = '';
    if (stateShareGraph) stateShareGraph.innerHTML = '';
    if (occupationOutcomeGraph) occupationOutcomeGraph.innerHTML = '';
    if (stateGraphNotes) stateGraphNotes.innerHTML = '';
    if (statePath) statePath.innerHTML = '';
    if (occupationForecastGrid) occupationForecastGrid.innerHTML = '';
    if (trajectoryDriverGrid) trajectoryDriverGrid.innerHTML = '';
    if (stateSummaryGrid) stateSummaryGrid.innerHTML = '';
    if (stateDriverGrid) stateDriverGrid.innerHTML = '';
    lastV2Result = null;
}

async function updateV2Results(options = {}) {
    const requestId = ++v2UpdateRequestId;
    const preserveCompositionSelection = options.preserveSelection !== false;
    const roleCategory = selectedRole;
    const anchoredOccupationId = selectedOccupationId;
    const isStaleRequest = () => requestId !== v2UpdateRequestId;

    if (!roleCategory) {
        v2RoleCompositionState = null;
        renderV2RoleComposition(null);
        resetV2Results('Select a category to begin', 'Choose a category, select the closest occupation, optionally pick a reviewed role version, and then edit the role composition only if needed before scoring.');
        return null;
    }

    if (roleCategory === 'custom') {
        const select = document.getElementById('occupation-match-select');
        if (select) {
            select.disabled = true;
            select.innerHTML = '<option value="">Choose the closest mapped category instead</option>';
        }
        selectedOccupationId = null;
        v2RoleCompositionState = null;
        renderV2RoleComposition(null);
        resetV2Results(
            'Choose the closest mapped category',
            'The empirical 2.0 briefing only runs on mapped launch occupations. Choose the closest supported category and occupation before scoring.'
        );
        return null;
    }

    // Refresh the hidden legacy shortlist without letting rerenders silently
    // swap the active occupation out from under the visible intake flow.
    const candidates = await populateOccupationCandidates(roleCategory, true);
    if (anchoredOccupationId) {
        selectedOccupationId = anchoredOccupationId;
    }
    if (!candidates.length || !selectedOccupationId) {
        v2RoleCompositionState = null;
        renderV2RoleComposition(null);
        resetV2Results('No occupation match available', 'This category does not yet have a launch occupation mapped into the transformation engine.');
        return null;
    }

    setV2LoadingState();

    let engine;
    try {
        engine = await getV2Engine();
    } catch (error) {
        if (isStaleRequest()) {
            return null;
        }
        console.error('[V2] Engine initialization failed:', error);
        resetV2Results('V2 engine unavailable', 'The transformation model data could not be loaded on this page.');
        return null;
    }
    if (isStaleRequest()) {
        return null;
    }

    const responses = getCurrentRefinementResponses();
    const seniorityLevel = parseFloat(document.getElementById('hierarchy-select')?.value || '1');
    const questionnaireProfile = buildStructuredQuestionnaireProfile(responses, seniorityLevel);
    await populateV2RoleComposition(selectedOccupationId, preserveCompositionSelection);
    if (isStaleRequest()) {
        return null;
    }
    const compositionEdits = getCompositionEditsForEngine();
    const dependencyEdits = getDependencyEditsForEngine();

    let result;
    try {
        const computeOptions = {
            roleCategory: roleCategory,
            occupationId: selectedOccupationId,
            seniorityLevel: seniorityLevel,
            roleVariantId: v2RoleVariantPreference.mode === 'manual' ? v2RoleVariantPreference.variantId : null,
            compositionEdits: compositionEdits,
            dependencyEdits: dependencyEdits,
            stateModelControls: {
                demandBias: v2StateModelControls.demandBias,
                investmentBias: v2StateModelControls.investmentBias,
                adoptionBias: v2StateModelControls.adoptionBias,
                exposureBias: v2StateModelControls.exposureBias,
                stayingBias: v2StateModelControls.stayingBias
            }
        };
        if (questionnaireProfile) {
            computeOptions.questionnaireProfile = questionnaireProfile;
        }
        result = engine.computeResult(computeOptions);
    } catch (error) {
        if (isStaleRequest()) {
            return null;
        }
        console.error('[V2] Failed to compute result:', error);
        resetV2Results('V2 result unavailable', 'The transformation engine could not resolve a result for this role yet.');
        return null;
    }
    if (isStaleRequest()) {
        return null;
    }

    lastV2Result = result;

    // Push user's custom analysis to the occupation map
    if (window.occupationMapSetUserResult) {
        window.occupationMapSetUserResult(result, selectedOccupationId);
    }

    safeSetText('v2-trigger-summary', result.narrative_summary?.when_the_role_turns || result.transition_trigger_map?.summary || '-');
    safeSetText('v2-bargaining-cliff-summary', result.transition_trigger_map?.bargaining_cliff_summary || '-');
    safelyRunV2Render('transition triggers', () => renderV2TransitionTriggers(result.transition_trigger_map));
    safelyRunV2Render('task breakdown', () => renderV2TaskBreakdown(result.task_breakdown, result.occupation_assignment));
    safelyRunV2Render('walkthrough', () => renderV2Walkthrough(result));

    // New r-dx- section renders
    safelyRunV2Render('state trajectory summary', () => renderStateTrajectorySummary(result));
    safelyRunV2Render('state exposure summary', () => renderStateExposureSummary(result));
    safelyRunV2Render('state path graph', () => renderStateForecastChart(result));
    safelyRunV2Render('state trajectory checkpoints', () => renderStateTrajectoryCheckpoints(result));
    safelyRunV2Render('state share graph', () => renderStateShareForecastChart(result));
    safelyRunV2Render('state trajectory graph', () => renderStateTrajectoryGraph(result));
    safelyRunV2Render('state trajectory drivers', () => renderStateTrajectoryDrivers(result));
    safelyRunV2Render('trajectory section visibility', () => ensureTrajectorySectionsVisible());
    safelyRunV2Render('landscape placement', () => ensureTrajectoryLandscapePlacement());
    renderOccupationForecastMatrix(result).catch((error) => {
        console.error('[V2] occupation forecast matrix render failed:', error);
    });
    safelyRunV2Render('pressure scatter', () => renderPressureScatter(result));
    safelyRunV2Render('trigger gauges', () => renderTriggerGauges(result));

    safelyRunV2Render('scroll reveal refresh', () => refreshScrollRevealTargets());

    return result;
}

function initScrollRevealObserver() {
    const revealSelector = '.r-story-step, .r-function-card, .r-task-story-item, .r-dx-section';
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll(revealSelector).forEach((node) => {
            node.classList.add('is-visible');
        });
        return;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll(revealSelector).forEach((node) => {
            node.classList.add('is-visible');
        });
        return;
    }

    if (v2RevealObserver) {
        return;
    }

    v2RevealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                v2RevealObserver.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.12
    });
}

function refreshScrollRevealTargets() {
    initScrollRevealObserver();
    if (!v2RevealObserver) {
        return;
    }

    document.querySelectorAll('.r-story-step, .r-function-card, .r-task-story-item, .r-dx-section').forEach((node) => {
        if (!node.classList.contains('is-visible')) {
            v2RevealObserver.observe(node);
        }
    });
}

// ─── 9. Simplified analyzeRole ──────────────────────────────────────────────

function analyzeRole() {
    refreshQuestionnaireProfileSummary();
    if (!selectedRole) return;
    updateV2Results({ preserveSelection: true }).catch(function(error) {
        console.error('[V2] Failed to update transformation view:', error);
    });
}

function scheduleStateTrajectoryControlUpdate() {
    if (v2StateControlUpdateTimer) {
        window.clearTimeout(v2StateControlUpdateTimer);
    }
    v2StateControlUpdateTimer = window.setTimeout(() => {
        v2StateControlUpdateTimer = null;
        analyzeRole();
    }, 120);
}

function scheduleOccupationLandscapeControlUpdate() {
    if (v2OccupationLandscapeUpdateTimer) {
        window.clearTimeout(v2OccupationLandscapeUpdateTimer);
    }
    v2OccupationLandscapeUpdateTimer = window.setTimeout(() => {
        v2OccupationLandscapeUpdateTimer = null;
        syncOccupationLandscapeControls();
        if (!lastV2Result) {
            return;
        }
        renderOccupationForecastMatrix(lastV2Result).catch((error) => {
            console.error('[V2] Failed to update occupation landscape:', error);
        });
    }, 120);
}

// ─── 10. Category toggle ────────────────────────────────────────────────────

function toggleCategory(header) {
    const content = header.nextElementSibling;
    const toggle = header.querySelector('.category-toggle');
    content.classList.toggle('hidden');
    toggle.classList.toggle('open');
}

// ─── 11. Event handlers — radio buttons ─────────────────────────────────────

document.addEventListener('change', function(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
        return;
    }
    if (target.type !== 'radio') {
        return;
    }
    if (!/^rf-/.test(target.name || '')) {
        return;
    }
    analyzeRole();
});

// ─── 12. Main DOMContentLoaded handler ──────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
    const roleSelect = document.getElementById('role-select');
    const topOccupationSelect = document.getElementById('top-occupation-select');
    const occupationSearchInput = document.getElementById('occupation-search-input');
    const occupationSearchOptions = document.getElementById('occupation-search-options');
    const occupationList = document.getElementById('v2-occupation-list');
    const occupationListCount = document.getElementById('v2-occupation-list-count');
    const occupationSelectionCopy = document.getElementById('v2-occupation-selection-copy');
    const hierarchySelect = document.getElementById('hierarchy-select');
    const hierarchyScale = document.getElementById('v2-hierarchy-scale');
    const hierarchyOptions = Array.from(document.querySelectorAll('.r-hierarchy-option'));
    const hierarchySelectionCopy = document.getElementById('v2-hierarchy-selection-copy');
    const prefillToggle = document.getElementById('prefill-questions');
    const intakeShell = document.getElementById('progression');
    const analysisSummary = document.getElementById('v2-analysis-summary');
    const analysisSummaryTitle = document.getElementById('v2-analysis-summary-title');
    const analysisSummaryHierarchy = document.getElementById('v2-analysis-summary-hierarchy');
    const analysisSummaryMode = document.getElementById('v2-analysis-summary-mode');
    const editSelectionsButton = document.getElementById('v2-edit-selections-button');
    const resultsSection = document.getElementById('results-column');
    const explanationSection = document.getElementById('model-explanation-section');
    const legacyWizard = document.querySelector('.legacy-wizard');
    const occupationMatchSelect = document.getElementById('occupation-match-select');
    const v2TaskToggle = document.getElementById('v2-task-toggle');
    const overviewTaskToggle = document.getElementById('v2-overview-task-toggle');
    const compositionCards = document.getElementById('v2-composition-cards');
    const breakdownCards = document.getElementById('v2-breakdown-cards');
    const roleVariantSelect = document.getElementById('v2-role-variant-select');
    const storyOpenDetailsButton = document.getElementById('v2-story-open-details');
    const supportingDetails = document.getElementById('v2-supporting-details');
    const stateDemandBias = document.getElementById('v2-state-demand-bias');
    const stateInvestmentBias = document.getElementById('v2-state-investment-bias');
    const stateAdoptionBias = document.getElementById('v2-state-adoption-bias');
    const stateExposureBias = document.getElementById('v2-state-exposure-bias');
    const stateStayingBias = document.getElementById('v2-state-staying-bias');
    const occupationLandscapeHierarchy = document.getElementById('v2-occupation-landscape-hierarchy');
    const occupationDemandBias = document.getElementById('v2-occupation-demand-bias');
    const occupationInvestmentBias = document.getElementById('v2-occupation-investment-bias');
    const occupationAdoptionBias = document.getElementById('v2-occupation-adoption-bias');
    const occupationExposureBias = document.getElementById('v2-occupation-exposure-bias');
    const occupationStayingBias = document.getElementById('v2-occupation-staying-bias');
    const adjustGate = document.getElementById('v2-adjust-gate');
    const adjustShell = document.getElementById('v2-adjust-shell');
    const defaultAnalysisButton = document.getElementById('v2-default-analysis-button');
    const adjustAnalysisButton = document.getElementById('v2-adjust-analysis-button');
    const roleRefinementPanel = document.getElementById('v2-role-refinement-panel');
    const analysisContinueButton = document.getElementById('v2-analysis-continue-button');
    const occupationStep = document.getElementById('v2-intake-step-occupation');
    const hierarchyStep = document.getElementById('v2-intake-step-hierarchy');
    const stageNextButtons = Array.from(document.querySelectorAll('.r-stage-next[data-next-target]'));

    const showBlock = (el) => el && el.classList.remove('hidden-block');
    const hideBlock = (el) => el && el.classList.add('hidden-block');
    const occupationSearchLookup = new Map();
    let allOccupations = [];
    let filteredOccupationList = [];

    initializeRefinementLayout();
    initScrollRevealObserver();
    ensureTrajectoryLandscapePlacement();
    syncStateTrajectoryControls();
    syncOccupationLandscapeControls();

    function isReadyForAnalysis() {
        return !!(selectedOccupationId && hierarchySelect?.value);
    }

    function getSelectedOccupationTitle() {
        if (!selectedOccupationId) return '';
        return occupationSearchLookup.get(String(selectedOccupationId).toLowerCase())?.title || '';
    }

    function getHierarchyLabel() {
        const selectedOption = hierarchySelect?.selectedOptions?.[0];
        return selectedOption ? selectedOption.textContent.trim() : '';
    }

    function getHierarchyExplanation(value) {
        switch (String(value || '')) {
            case '1':
                return 'Level 1 means the model assumes the role is mostly execution work, with more standardized tasks and less formal sign-off.';
            case '2':
                return 'Level 2 means the role still skews execution-heavy, but with some coordination or review responsibility.';
            case '3':
                return 'Level 3 means the role mixes execution with meaningful coordination, judgment, or stakeholder handling.';
            case '4':
                return 'Level 4 means the model gives more weight to domain leadership, review, and higher-consequence decisions.';
            case '5':
                return 'Level 5 means the role is treated as highly owner-shaped, with more authority, sign-off, and function-level responsibility.';
            default:
                return '';
        }
    }

    function syncHierarchyControl() {
        const selectedValue = String(hierarchySelect?.value || '');
        hierarchyOptions.forEach((button) => {
            button.classList.toggle('is-selected', button.dataset.value === selectedValue);
            button.setAttribute('aria-checked', button.dataset.value === selectedValue ? 'true' : 'false');
        });
        if (hierarchySelectionCopy) {
            hierarchySelectionCopy.textContent = getHierarchyExplanation(selectedValue);
        }
    }

    function syncAnalysisSummary(result = null) {
        const occupationTitle = result?.selected_occupation_title || getSelectedOccupationTitle() || 'Role analysis';
        if (analysisSummaryTitle) {
            analysisSummaryTitle.textContent = occupationTitle;
        }
        if (analysisSummaryHierarchy) {
            analysisSummaryHierarchy.textContent = getHierarchyLabel() || 'Hierarchy not set';
        }
        if (analysisSummaryMode) {
            analysisSummaryMode.textContent = v2AdjustmentMode === 'adjust' ? 'Adjusted role analysis' : 'Default role analysis';
        }
    }

    function animateHideBlock(el) {
        if (!el || el.classList.contains('hidden-block')) {
            return;
        }
        el.classList.add('r-stage-leaving');
        window.setTimeout(() => {
            el.classList.add('hidden-block');
            el.classList.remove('r-stage-leaving');
        }, 260);
    }

    function animateShowBlock(el) {
        if (!el) {
            return;
        }
        el.classList.remove('hidden-block');
        el.classList.add('r-stage-entering');
        window.setTimeout(() => {
            el.classList.remove('r-stage-entering');
        }, 460);
    }

    function setAnalysisStageActive(isActive, result = null) {
        v2AnalysisStageActive = !!isActive;
        document.body.classList.toggle('r-analysis-active', v2AnalysisStageActive);

        if (v2AnalysisStageActive) {
            syncAnalysisSummary(result);
            animateShowBlock(analysisSummary);
            if (v2AdjustmentMode === 'default') {
                animateHideBlock(legacyWizard);
            } else if (legacyWizard) {
                legacyWizard.classList.remove('r-stage-leaving');
                legacyWizard.classList.remove('hidden-block');
            }
            return;
        }

        if (analysisSummary) {
            analysisSummary.classList.add('hidden-block');
            analysisSummary.classList.remove('r-stage-entering');
        }
        if (intakeShell) {
            intakeShell.classList.remove('r-stage-leaving');
            intakeShell.classList.remove('hidden-block');
        }
        if (legacyWizard && isReadyForAnalysis()) {
            legacyWizard.classList.remove('r-stage-leaving');
            legacyWizard.classList.remove('hidden-block');
        }
    }

    function updateAdjustmentMode(nextMode) {
        v2AdjustmentMode = nextMode;

        if (defaultAnalysisButton instanceof HTMLButtonElement) {
            defaultAnalysisButton.classList.toggle('is-active', nextMode === 'default');
        }
        if (adjustAnalysisButton instanceof HTMLButtonElement) {
            adjustAnalysisButton.classList.toggle('is-active', nextMode === 'adjust');
        }
        if (adjustShell) {
            adjustShell.classList.toggle('hidden-block', nextMode !== 'adjust');
            adjustShell.classList.toggle('r-adjust-shell--visible', nextMode === 'adjust');
        }
        if (roleRefinementPanel instanceof HTMLDetailsElement && nextMode === 'default') {
            roleRefinementPanel.open = false;
        }
        syncAnalysisSummary(lastV2Result);
    }

    function applyDefaultAdjustmentPreset() {
        updateAdjustmentMode('default');
        if (prefillToggle) {
            prefillToggle.checked = true;
        }
        if (selectedRole && selectedOccupationId) {
            applyQuestionPreset();
        } else {
            setAllRefinementQuestionsToDefault();
        }
    }

    function syncSetupVisibility() {
        if (!legacyWizard) {
            return;
        }
        const ready = isReadyForAnalysis();
        legacyWizard.classList.toggle('hidden-block', !ready);

        // Enable/disable the analysis CTA buttons based on readiness
        if (defaultAnalysisButton) defaultAnalysisButton.disabled = !ready;
        if (adjustAnalysisButton) adjustAnalysisButton.disabled = !ready;

        if (!ready) {
            v2ResultsUnlocked = false;
            v2WasReadyForAnalysis = false;
            updateAdjustmentMode(null);
            setAnalysisStageActive(false);
            hideBlock(resultsSection);
            hideBlock(explanationSection);
            return;
        }

        if (!v2AdjustmentMode) {
            applyDefaultAdjustmentPreset();
        }

        // Auto-run default analysis (no scroll) when inputs are first completed
        if (!v2WasReadyForAnalysis && v2AdjustmentMode === 'default') {
            v2WasReadyForAnalysis = true;
            unlockResultsAndAnalyze({ scroll: false });
            return;
        }

        v2WasReadyForAnalysis = true;
    }

    function tryShowResults() {
        syncSetupVisibility();
        if (isReadyForAnalysis() && v2AdjustmentMode && v2ResultsUnlocked) {
            showBlock(resultsSection);
        } else {
            hideBlock(resultsSection);
        }
    }

    function getProgressionTargets() {
        const targets = [];
        if (occupationStep) targets.push(occupationStep);
        if (hierarchyStep) targets.push(hierarchyStep);
        if (legacyWizard && !legacyWizard.classList.contains('hidden-block')) {
            if (adjustShell && !adjustShell.classList.contains('hidden-block')) {
                targets.push(adjustShell);
            }
        }
        if (resultsSection && !resultsSection.classList.contains('hidden-block')) {
            targets.push(...Array.from(resultsSection.querySelectorAll('.r-story-step')));
            const appendix = document.querySelector('.r-details--appendix');
            if (appendix) targets.push(appendix);
        }
        return targets.filter(Boolean);
    }



    function unlockResultsAndAnalyze({ scroll = true } = {}) {
        v2ResultsUnlocked = true;
        setAnalysisStageActive(true);
        tryShowResults();
        analyzeRole();
        if (scroll) {
            requestAnimationFrame(() => {
                const metricsGrid = document.getElementById('v2-state-exposure-grid');
                metricsGrid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    function setPrefillState() {
        if (!prefillToggle) return;
        const ready = !!(roleSelect?.value && hierarchySelect?.value && (selectedOccupationId || roleSelect?.value === 'custom'));
        const occupationReady = !!(selectedOccupationId && hierarchySelect?.value);
        if (!ready) {
            prefillToggle.checked = false;
            prefillToggle.disabled = true;
        } else {
            prefillToggle.disabled = !occupationReady;
        }
    }

function syncLegacyRoleCategory(roleVal) {
        selectedRole = normalizeRoleCategory(roleVal) || null;
        document.querySelectorAll('.preset-btn').forEach((button) => {
            const buttonRole = normalizeRoleCategory(button.dataset.role);
            button.classList.toggle('active', !!selectedRole && buttonRole === selectedRole);
        });
    }

    function syncSearchInputWithOccupation(occupationId) {
        if (!occupationSearchInput) return;
        if (!occupationId) {
            occupationSearchInput.value = '';
            if (occupationSelectionCopy) {
                occupationSelectionCopy.textContent = 'No occupation selected yet.';
            }
            return;
        }

        const matched = occupationSearchLookup.get(String(occupationId).toLowerCase());
        occupationSearchInput.value = matched ? matched.title : '';
        if (occupationSelectionCopy) {
            occupationSelectionCopy.textContent = matched
                ? `${matched.title} · ${formatV2Label(matched.role_family || 'mapped role family')}`
                : 'Mapped occupation selected.';
        }
    }

    function renderOccupationList(items) {
        if (!occupationList) {
            return;
        }

        occupationList.innerHTML = '';
        const rows = Array.isArray(items) ? items : [];

        if (occupationListCount) {
            occupationListCount.textContent = '';
        }

        if (!rows.length) {
            const empty = document.createElement('div');
            empty.className = 'r-occupation-empty';
            empty.textContent = 'No mapped occupations match that search yet.';
            occupationList.appendChild(empty);
            return;
        }

        rows.forEach((occupation) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'r-occupation-option';
            button.dataset.occupationId = occupation.occupation_id;
            button.classList.toggle('is-selected', occupation.occupation_id === selectedOccupationId);
            button.innerHTML = `
                <strong>${occupation.title}</strong>
                <span>${formatV2Label(occupation.role_family || 'mapped role family')}</span>
            `;
            occupationList.appendChild(button);
        });
    }

    async function selectMappedOccupation(occupation, options = {}) {
        if (!occupation) {
            return;
        }

        const preserveSelection = options.preserveSelection !== false;
        const nextRoleFamily = normalizeRoleCategory(occupation.role_family || '');

        selectedRole = nextRoleFamily || null;
        selectedOccupationId = occupation.occupation_id || null;

        if (roleSelect) {
            roleSelect.value = nextRoleFamily;
            roleSelect.classList.toggle('selected', !!nextRoleFamily);
        }
        syncLegacyRoleCategory(nextRoleFamily);

        try {
            await populateOccupationCandidates(nextRoleFamily, true);
        } catch (error) {
            console.error('[V2] Failed to populate hidden occupation selects from mapped occupation:', error);
        }

        selectedOccupationId = occupation.occupation_id || null;

        if (topOccupationSelect) {
            topOccupationSelect.value = selectedOccupationId || '';
            topOccupationSelect.classList.toggle('selected', !!selectedOccupationId);
        }
        if (occupationMatchSelect) {
            occupationMatchSelect.value = selectedOccupationId || '';
        }

        syncSearchInputWithOccupation(selectedOccupationId);
        renderOccupationList(filteredOccupationList.length ? filteredOccupationList : allOccupations);
        syncAnalysisSummary();
        v2ResultsUnlocked = false;
        tryShowResults();
        setPrefillState();

        try {
            await populateV2RoleComposition(selectedOccupationId, preserveSelection);
        } catch (error) {
            console.error('[V2] Failed to populate role composition from mapped occupation selection:', error);
            safeSetText('v2-composition-headline', 'Something went wrong loading the role composition. Try selecting the occupation again.');
        }

        // Always re-run after population when both occupation and hierarchy are set.
        // This handles re-selection (v2WasReadyForAnalysis was already true so
        // syncSetupVisibility skipped the auto-run) and first-run confirmation.
        if (isReadyForAnalysis() && v2AdjustmentMode) {
            v2ResultsUnlocked = true;
            setAnalysisStageActive(true);
            tryShowResults();
            analyzeRole();
        }
    }

    function filterOccupations(query) {
        const needle = String(query || '').trim().toLowerCase();
        if (!needle) {
            filteredOccupationList = allOccupations.slice();
            renderOccupationList(filteredOccupationList);
            return filteredOccupationList;
        }

        filteredOccupationList = allOccupations.filter((occupation) => {
            return String(occupation.title || '').toLowerCase().includes(needle)
                || String(occupation.role_family || '').toLowerCase().includes(needle)
                || String(occupation.occupation_id || '').toLowerCase().includes(needle);
        });
        renderOccupationList(filteredOccupationList);
        return filteredOccupationList;
    }

    async function initializeOccupationSearch() {
        if (!occupationSearchInput || !occupationSearchOptions) {
            return;
        }

        try {
            let occupations = [];
            try {
                occupations = await getOccupationIndex();
            } catch (indexError) {
                console.error('[V2] Static occupation index unavailable, falling back to engine list:', indexError);
                const engine = await getV2Engine();
                occupations = engine.listOccupations() || [];
            }
            allOccupations = occupations
                .sort((left, right) => String(left.title || '').localeCompare(String(right.title || '')));
            filteredOccupationList = allOccupations.slice();
            occupationSearchLookup.clear();
            occupationSearchOptions.innerHTML = '';

            allOccupations.forEach((occupation) => {
                occupationSearchLookup.set(String(occupation.occupation_id).toLowerCase(), occupation);
                occupationSearchLookup.set(String(occupation.title || '').trim().toLowerCase(), occupation);

                const option = document.createElement('option');
                option.value = occupation.title;
                occupationSearchOptions.appendChild(option);
            });
            renderOccupationList(filteredOccupationList);
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    getV2Engine().catch((error) => {
                        console.error('[V2] Failed to warm the engine after occupation search init:', error);
                    });
                });
            } else {
                window.setTimeout(() => {
                    getV2Engine().catch((error) => {
                        console.error('[V2] Failed to warm the engine after occupation search init:', error);
                    });
                }, 0);
            }
        } catch (error) {
            console.error('[V2] Failed to initialize occupation search:', error);
        }
    }

    if (stateDemandBias instanceof HTMLInputElement) {
        stateDemandBias.addEventListener('input', () => {
            v2StateModelControls.demandBias = Number(stateDemandBias.value || 0);
            syncStateTrajectoryControls();
        });
        stateDemandBias.addEventListener('change', () => {
            v2StateModelControls.demandBias = Number(stateDemandBias.value || 0);
            scheduleStateTrajectoryControlUpdate();
        });
    }

    if (stateInvestmentBias instanceof HTMLInputElement) {
        stateInvestmentBias.addEventListener('input', () => {
            v2StateModelControls.investmentBias = Number(stateInvestmentBias.value || 0);
            syncStateTrajectoryControls();
        });
        stateInvestmentBias.addEventListener('change', () => {
            v2StateModelControls.investmentBias = Number(stateInvestmentBias.value || 0);
            scheduleStateTrajectoryControlUpdate();
        });
    }

    if (stateAdoptionBias instanceof HTMLInputElement) {
        stateAdoptionBias.addEventListener('input', () => {
            v2StateModelControls.adoptionBias = Number(stateAdoptionBias.value || 0);
            syncStateTrajectoryControls();
        });
        stateAdoptionBias.addEventListener('change', () => {
            v2StateModelControls.adoptionBias = Number(stateAdoptionBias.value || 0);
            scheduleStateTrajectoryControlUpdate();
        });
    }

    if (stateExposureBias instanceof HTMLInputElement) {
        stateExposureBias.addEventListener('input', () => {
            v2StateModelControls.exposureBias = Number(stateExposureBias.value || 0);
            syncStateTrajectoryControls();
        });
        stateExposureBias.addEventListener('change', () => {
            v2StateModelControls.exposureBias = Number(stateExposureBias.value || 0);
            scheduleStateTrajectoryControlUpdate();
        });
    }

    if (stateStayingBias instanceof HTMLInputElement) {
        stateStayingBias.addEventListener('input', () => {
            v2StateModelControls.stayingBias = Number(stateStayingBias.value || 0);
            syncStateTrajectoryControls();
        });
        stateStayingBias.addEventListener('change', () => {
            v2StateModelControls.stayingBias = Number(stateStayingBias.value || 0);
            scheduleStateTrajectoryControlUpdate();
        });
    }

    if (occupationLandscapeHierarchy instanceof HTMLSelectElement) {
        occupationLandscapeHierarchy.addEventListener('change', () => {
            v2OccupationLandscapeControls.hierarchyLevel = Number(occupationLandscapeHierarchy.value || 3) || 3;
            syncOccupationLandscapeControls();
            scheduleOccupationLandscapeControlUpdate();
        });
    }

    if (occupationDemandBias instanceof HTMLInputElement) {
        occupationDemandBias.addEventListener('input', () => {
            v2OccupationLandscapeControls.demandBias = Number(occupationDemandBias.value || 0);
            syncOccupationLandscapeControls();
        });
        occupationDemandBias.addEventListener('change', () => {
            v2OccupationLandscapeControls.demandBias = Number(occupationDemandBias.value || 0);
            scheduleOccupationLandscapeControlUpdate();
        });
    }

    if (occupationInvestmentBias instanceof HTMLInputElement) {
        occupationInvestmentBias.addEventListener('input', () => {
            v2OccupationLandscapeControls.investmentBias = Number(occupationInvestmentBias.value || 0);
            syncOccupationLandscapeControls();
        });
        occupationInvestmentBias.addEventListener('change', () => {
            v2OccupationLandscapeControls.investmentBias = Number(occupationInvestmentBias.value || 0);
            scheduleOccupationLandscapeControlUpdate();
        });
    }

    if (occupationAdoptionBias instanceof HTMLInputElement) {
        occupationAdoptionBias.addEventListener('input', () => {
            v2OccupationLandscapeControls.adoptionBias = Number(occupationAdoptionBias.value || 0);
            syncOccupationLandscapeControls();
        });
        occupationAdoptionBias.addEventListener('change', () => {
            v2OccupationLandscapeControls.adoptionBias = Number(occupationAdoptionBias.value || 0);
            scheduleOccupationLandscapeControlUpdate();
        });
    }

    if (occupationExposureBias instanceof HTMLInputElement) {
        occupationExposureBias.addEventListener('input', () => {
            v2OccupationLandscapeControls.exposureBias = Number(occupationExposureBias.value || 0);
            syncOccupationLandscapeControls();
        });
        occupationExposureBias.addEventListener('change', () => {
            v2OccupationLandscapeControls.exposureBias = Number(occupationExposureBias.value || 0);
            scheduleOccupationLandscapeControlUpdate();
        });
    }

    if (occupationStayingBias instanceof HTMLInputElement) {
        occupationStayingBias.addEventListener('input', () => {
            v2OccupationLandscapeControls.stayingBias = Number(occupationStayingBias.value || 0);
            syncOccupationLandscapeControls();
        });
        occupationStayingBias.addEventListener('change', () => {
            v2OccupationLandscapeControls.stayingBias = Number(occupationStayingBias.value || 0);
            scheduleOccupationLandscapeControlUpdate();
        });
    }

    // v2 task toggle
    v2TaskToggle?.addEventListener('click', () => {
        v2TaskBreakdownExpanded = !v2TaskBreakdownExpanded;
        renderV2TaskBreakdown(lastV2Result?.task_breakdown || null, lastV2Result?.occupation_assignment || null);
        if (v2TaskBreakdownExpanded) {
            document.getElementById('v2-task-breakdown')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    overviewTaskToggle?.addEventListener('click', () => {
        v2OverviewTasksExpanded = !v2OverviewTasksExpanded;
        renderV2Walkthrough(lastV2Result);
    });

    storyOpenDetailsButton?.addEventListener('click', () => {
        if (supportingDetails instanceof HTMLDetailsElement) {
            supportingDetails.open = true;
            supportingDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // Category header click binding
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function() {
            toggleCategory(this);
        });
    });

    // Occupation match select change handler
    occupationMatchSelect?.addEventListener('change', () => {
        selectedOccupationId = occupationMatchSelect.value || null;
        setRoleVariantPreferenceAuto();
        if (topOccupationSelect && topOccupationSelect.value !== selectedOccupationId) {
            topOccupationSelect.value = selectedOccupationId || '';
            topOccupationSelect.classList.toggle('selected', !!selectedOccupationId);
        }
        syncSearchInputWithOccupation(selectedOccupationId);
        tryShowResults();
        setPrefillState();
        populateV2RoleComposition(selectedOccupationId, true)
            .then(() => {
                if (v2AdjustmentMode && v2ResultsUnlocked) {
                    return updateV2Results({ preserveSelection: true });
                }
                return null;
            })
            .catch(error => {
                console.error('[V2] Failed to rerender after occupation composition change:', error);
            });
    });

    // Top occupation select change handler
    topOccupationSelect?.addEventListener('change', async () => {
        const occupation = occupationSearchLookup.get(String(topOccupationSelect.value || '').toLowerCase()) || null;
        setRoleVariantPreferenceAuto();
        if (occupation) {
            await selectMappedOccupation(occupation, { preserveSelection: true });
        }
    });

    // Occupation search input change handler
    occupationSearchInput?.addEventListener('change', async () => {
        const query = String(occupationSearchInput.value || '').trim().toLowerCase();
        if (!query) {
            filterOccupations('');
            return;
        }

        let matchedOccupation = occupationSearchLookup.get(query) || null;

        if (!matchedOccupation) {
            try {
                const engine = await getV2Engine();
                matchedOccupation = (engine.searchOccupations(query, 1) || [])[0] || null;
            } catch (error) {
                console.error('[V2] Failed to search occupations:', error);
            }
        }

        if (!matchedOccupation) {
            return;
        }
        setRoleVariantPreferenceAuto();
        await selectMappedOccupation(matchedOccupation, { preserveSelection: false });
    });

    occupationSearchInput?.addEventListener('input', () => {
        filterOccupations(occupationSearchInput.value || '');
    });

    occupationList?.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        const button = target.closest('.r-occupation-option');
        if (!(button instanceof HTMLButtonElement)) {
            return;
        }
        const occupation = occupationSearchLookup.get(String(button.dataset.occupationId || '').toLowerCase()) || null;
        if (!occupation) {
            return;
        }
        setRoleVariantPreferenceAuto();
        await selectMappedOccupation(occupation, { preserveSelection: false });
    });

    roleVariantSelect?.addEventListener('change', () => {
        const value = roleVariantSelect.value || '';
        if (value && value !== '__auto__') {
            v2RoleVariantPreference = { mode: 'manual', variantId: value };
        } else {
            setRoleVariantPreferenceAuto();
        }
        populateV2RoleComposition(selectedOccupationId, false)
            .then(() => {
                if (v2AdjustmentMode && v2ResultsUnlocked) {
                    return updateV2Results({ preserveSelection: false });
                }
                return null;
            })
            .catch((error) => {
                console.error('[V2] Failed to rerender after role variant change:', error);
            });
    });

    compositionCards?.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        if (target.dataset.action === 'remove-task-function-link') {
            const taskId = target.dataset.taskId || '';
            const functionId = target.dataset.functionId || '';
            v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => !(link.task_id === taskId && link.function_id === functionId));
            renderV2RoleComposition(v2RoleCompositionState?.raw || null);
            updateV2Results({ preserveSelection: true }).catch((error) => {
                console.error('[V2] Failed to rerender after task/function link removal:', error);
            });
            return;
        }

        if (target.dataset.action === 'remove-dependency-link') {
            const fromTaskId = target.dataset.fromTaskId || '';
            const toTaskId = target.dataset.toTaskId || '';
            v2CustomDependencyEdges = v2CustomDependencyEdges.filter((edge) => !(edge.from_task_id === fromTaskId && edge.to_task_id === toTaskId));
            renderV2RoleComposition(v2RoleCompositionState?.raw || null);
            updateV2Results({ preserveSelection: true }).catch((error) => {
                console.error('[V2] Failed to rerender after dependency removal:', error);
            });
            return;
        }

        if (target.dataset.action === 'remove') {
            const cardKey = target.dataset.card;
            const itemId = target.dataset.itemId;
            if (!cardKey || !itemId || !v2RoleCompositionState) return;
            const selectionSet = cardKey === 'functions' ? v2RoleCompositionState.selectedFunctionIds : v2RoleCompositionState.selectedTaskIds;
            selectionSet.delete(itemId);
            if (cardKey !== 'functions' && v2RoleCompositionState.taskShareOverrides) {
                delete v2RoleCompositionState.taskShareOverrides[itemId];
                v2RoleCompositionState.taskDisplayOrder = (v2RoleCompositionState.taskDisplayOrder || []).filter((taskId) => taskId !== itemId);
                v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => link.task_id !== itemId);
                v2CustomDependencyEdges = v2CustomDependencyEdges.filter((edge) => edge.from_task_id !== itemId && edge.to_task_id !== itemId);
            } else if (cardKey === 'functions') {
                v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => link.function_id !== itemId);
            }
            renderV2RoleComposition(v2RoleCompositionState.raw);
            updateV2Results({ preserveSelection: true }).catch((error) => {
                console.error('[V2] Failed to rerender after composition removal:', error);
            });
            return;
        }

        if (target.dataset.action === 'add') {
            const cardKey = target.dataset.card;
            const select = cardKey === 'functions'
                ? document.getElementById('v2-function-add-select')
                : document.getElementById('v2-task-add-select');
            const itemId = select?.value || '';
            if (!cardKey || !itemId || !v2RoleCompositionState) return;
            const selectionSet = cardKey === 'functions' ? v2RoleCompositionState.selectedFunctionIds : v2RoleCompositionState.selectedTaskIds;
            selectionSet.add(itemId);
            if (cardKey !== 'functions' && !v2RoleCompositionState.taskDisplayOrder.includes(itemId)) {
                v2RoleCompositionState.taskDisplayOrder.push(itemId);
            }
            renderV2RoleComposition(v2RoleCompositionState.raw);
            updateV2Results({ preserveSelection: true }).catch((error) => {
                console.error('[V2] Failed to rerender after composition add:', error);
            });
        }
    });

    compositionCards?.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || target.dataset.action !== 'share-weight' || !v2RoleCompositionState) {
            return;
        }

        const taskId = target.dataset.itemId || '';
        if (!taskId) {
            return;
        }

        const pct = Number(target.value);
        if (!target.value || !Number.isFinite(pct) || pct <= 0) {
            delete v2RoleCompositionState.taskShareOverrides[taskId];
        } else {
            v2RoleCompositionState.taskShareOverrides[taskId] = Math.min(pct, 100) / 100;
        }

        updateV2Results({ preserveSelection: true }).catch((error) => {
            console.error('[V2] Failed to rerender after task share change:', error);
        });
    });

    document.getElementById('v2-graph-mode-group')?.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement) || !target.dataset.graphMode) {
            return;
        }
        v2GraphMode = target.dataset.graphMode;
        renderV2RoleFlowMap();
    });

    document.getElementById('v2-dependency-add')?.addEventListener('click', () => {
        const sourceSelect = document.getElementById('v2-dependency-source');
        const targetSelect = document.getElementById('v2-dependency-target');
        const fromTaskId = sourceSelect?.value || '';
        const toTaskId = targetSelect?.value || '';
        if (!fromTaskId || !toTaskId || fromTaskId === toTaskId) {
            return;
        }

        const alreadyExists = v2CustomDependencyEdges.some((edge) => edge.from_task_id === fromTaskId && edge.to_task_id === toTaskId);
        if (alreadyExists) {
            return;
        }

        v2CustomDependencyEdges.push({ from_task_id: fromTaskId, to_task_id: toTaskId });
        renderV2DependencyEditor();
        renderV2BreakdownCards();
        updateV2Results({ preserveSelection: true }).catch((error) => {
            console.error('[V2] Failed to rerender after dependency add:', error);
        });
    });

    // ── Card-based breakdown event listeners ──────────────────────────────────

    breakdownCards?.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;

        if (target.dataset.action === 'remove') {
            const cardKey = target.dataset.card;
            const itemId = target.dataset.itemId;
            if (!cardKey || !itemId || !v2RoleCompositionState) return;
            const selectionSet = cardKey === 'functions' ? v2RoleCompositionState.selectedFunctionIds : v2RoleCompositionState.selectedTaskIds;
            selectionSet.delete(itemId);
            if (cardKey !== 'functions' && v2RoleCompositionState.taskShareOverrides) {
                delete v2RoleCompositionState.taskShareOverrides[itemId];
                v2RoleCompositionState.taskDisplayOrder = (v2RoleCompositionState.taskDisplayOrder || []).filter((taskId) => taskId !== itemId);
                v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => link.task_id !== itemId);
                v2CustomDependencyEdges = v2CustomDependencyEdges.filter((edge) => edge.from_task_id !== itemId && edge.to_task_id !== itemId);
            } else if (cardKey === 'functions') {
                v2CustomTaskFunctionLinks = v2CustomTaskFunctionLinks.filter((link) => link.function_id !== itemId);
            }
            renderV2RoleComposition(v2RoleCompositionState.raw);
            updateV2Results({ preserveSelection: true }).catch((error) => {
                console.error('[V2] Failed to rerender after breakdown removal:', error);
            });
            return;
        }

        if (target.dataset.action === 'add') {
            const cardKey = target.dataset.card;
            const select = target.closest('.v2-composition-card')?.querySelector('[data-role="add-select"]');
            const itemId = select?.value || '';
            if (!cardKey || !itemId || !v2RoleCompositionState) return;
            const selectionSet = cardKey === 'functions' ? v2RoleCompositionState.selectedFunctionIds : v2RoleCompositionState.selectedTaskIds;
            selectionSet.add(itemId);
            if (cardKey !== 'functions' && !v2RoleCompositionState.taskDisplayOrder.includes(itemId)) {
                v2RoleCompositionState.taskDisplayOrder.push(itemId);
            }
            renderV2RoleComposition(v2RoleCompositionState.raw);
            updateV2Results({ preserveSelection: true }).catch((error) => {
                console.error('[V2] Failed to rerender after breakdown add:', error);
            });
        }

        if (target.dataset.action === 'remove-dependency-link') {
            const fromTaskId = target.dataset.fromTaskId || '';
            const toTaskId = target.dataset.toTaskId || '';
            v2CustomDependencyEdges = v2CustomDependencyEdges.filter((edge) => !(edge.from_task_id === fromTaskId && edge.to_task_id === toTaskId));
            renderV2RoleComposition(v2RoleCompositionState?.raw || null);
            updateV2Results({ preserveSelection: true }).catch((error) => {
                console.error('[V2] Failed to rerender after classic dependency removal:', error);
            });
        }
    });

    breakdownCards?.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || target.dataset.action !== 'share-weight' || !v2RoleCompositionState) {
            return;
        }
        const taskId = target.dataset.itemId || '';
        if (!taskId) return;

        const pct = Number(target.value);
        if (!target.value || !Number.isFinite(pct) || pct <= 0) {
            delete v2RoleCompositionState.taskShareOverrides[taskId];
        } else {
            v2RoleCompositionState.taskShareOverrides[taskId] = Math.min(pct, 100) / 100;
        }
        updateV2Results({ preserveSelection: true }).catch((error) => {
            console.error('[V2] Failed to rerender after breakdown share change:', error);
        });
    });

    document.getElementById('v2-dependency-add-classic')?.addEventListener('click', () => {
        const sourceSelect = document.getElementById('v2-dependency-source-classic');
        const targetSelect = document.getElementById('v2-dependency-target-classic');
        const fromTaskId = sourceSelect?.value || '';
        const toTaskId = targetSelect?.value || '';
        if (!fromTaskId || !toTaskId || fromTaskId === toTaskId) return;

        const alreadyExists = v2CustomDependencyEdges.some((edge) => edge.from_task_id === fromTaskId && edge.to_task_id === toTaskId);
        if (alreadyExists) return;

        v2CustomDependencyEdges.push({ from_task_id: fromTaskId, to_task_id: toTaskId });
        renderV2RoleComposition(v2RoleCompositionState?.raw || null);
        updateV2Results({ preserveSelection: true }).catch((error) => {
            console.error('[V2] Failed to rerender after classic dependency add:', error);
        });
    });

    document.getElementById('v2-dependency-list')?.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement) || target.dataset.action !== 'remove-dependency') {
            return;
        }
        const edgeIndex = Number(target.dataset.edgeIndex);
        if (!Number.isInteger(edgeIndex) || edgeIndex < 0) {
            return;
        }
        v2CustomDependencyEdges.splice(edgeIndex, 1);
        renderV2DependencyEditor();
        updateV2Results({ preserveSelection: true }).catch((error) => {
            console.error('[V2] Failed to rerender after dependency removal:', error);
        });
    });

    // Role select change handler
    async function handleRoleCategoryChange() {
        if (roleSelect?.closest('.visually-hidden')) {
            return;
        }
        const roleValue = normalizeRoleCategory(roleSelect.value || '');
        if (roleSelect && roleSelect.value !== roleValue) {
            roleSelect.value = roleValue;
        }
        roleSelect.classList.toggle('selected', !!roleValue);
        syncLegacyRoleCategory(roleValue);

        selectedOccupationId = null;
        setRoleVariantPreferenceAuto();

        try {
            await populateOccupationCandidates(roleValue, false);
        } catch (error) {
            console.error('[V2] Failed to populate occupations from category change:', error);
        }

        try {
            await populateV2RoleComposition(selectedOccupationId, false);
        } catch (error) {
            console.error('[V2] Failed to populate role composition from category change:', error);
            safeSetText('v2-composition-headline', 'Something went wrong loading the role composition. Try selecting the occupation again.');
        }

        syncSearchInputWithOccupation(selectedOccupationId);

        if (!roleValue) {
            resetV2Results('Select a category to begin', 'Choose a category, select the closest occupation, and complete the role refinement to generate the transformation briefing.');
        }

        tryShowResults();
        setPrefillState();
        if (v2AdjustmentMode && v2ResultsUnlocked) {
            analyzeRole();
        }

        if (prefillToggle?.checked) {
            applyQuestionPreset();
            if (v2AdjustmentMode && v2ResultsUnlocked) {
                analyzeRole();
            }
        }
    }

    roleSelect?.addEventListener('change', handleRoleCategoryChange);
    roleSelect?.addEventListener('input', handleRoleCategoryChange);

    async function ensureOccupationOptionsReady() {
        if (!selectedRole || selectedRole === 'custom') {
            return;
        }
        const optionCount = topOccupationSelect?.options?.length || 0;
        if (topOccupationSelect?.disabled || optionCount <= 1) {
            try {
                await populateOccupationCandidates(selectedRole, true);
            } catch (error) {
                console.error('[V2] Failed to repopulate occupation candidates on demand:', error);
            }
        }
    }

    topOccupationSelect?.addEventListener('focus', ensureOccupationOptionsReady);
    topOccupationSelect?.addEventListener('pointerdown', ensureOccupationOptionsReady);

    // Hierarchy select change handler
    hierarchySelect?.addEventListener('change', () => {
        if (hierarchySelect.value) {
            hierarchySelect.classList.add('selected');
        }
        syncHierarchyControl();
        syncAnalysisSummary();
        v2WasReadyForAnalysis = false;
        v2ResultsUnlocked = false;
        tryShowResults();
        setPrefillState();
        if (prefillToggle?.checked) {
            applyQuestionPreset();
            if (v2AdjustmentMode && v2ResultsUnlocked) {
                analyzeRole();
            }
        }
    });

    // Step open survey click handler
    document.getElementById('step-open-survey')?.addEventListener('click', () => {
        syncSetupVisibility();
        if (legacyWizard && isReadyForAnalysis()) {
            legacyWizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    defaultAnalysisButton?.addEventListener('click', () => {
        if (!isReadyForAnalysis()) {
            return;
        }
        if (v2AdjustmentMode === 'default' && v2ResultsUnlocked) {
            // Already running default - just scroll to results
            requestAnimationFrame(() => {
                const metricsGrid = document.getElementById('v2-state-exposure-grid');
                metricsGrid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            return;
        }
        v2ResultsUnlocked = false;
        applyDefaultAdjustmentPreset();
        unlockResultsAndAnalyze({ scroll: true });
    });

    hierarchyOptions.forEach((button) => {
        button.addEventListener('click', () => {
            if (!hierarchySelect) return;
            hierarchySelect.value = button.dataset.value || '';
            hierarchySelect.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });

    adjustAnalysisButton?.addEventListener('click', () => {
        if (!isReadyForAnalysis()) {
            return;
        }
        updateAdjustmentMode('adjust');
        // Pre-check prefill with defaults when entering adjust mode
        if (prefillToggle && !prefillToggle.disabled) {
            prefillToggle.checked = true;
            applyQuestionPreset();
        }
        // Run analysis with results visible, then scroll to the adjust shell
        unlockResultsAndAnalyze({ scroll: false });
        requestAnimationFrame(() => {
            adjustShell?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    editSelectionsButton?.addEventListener('click', () => {
        v2ResultsUnlocked = false;
        setAnalysisStageActive(false);
        hideBlock(resultsSection);
        syncSetupVisibility();
        requestAnimationFrame(() => {
            intakeShell?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            occupationSearchInput?.focus();
        });
    });


    stageNextButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selector = button.getAttribute('data-next-target');
            if (!selector) return;
            const target = document.querySelector(selector);
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Prefill toggle change handler
    prefillToggle?.addEventListener('change', () => {
        if (prefillToggle.disabled) return;
        if (prefillToggle.checked) {
            if (!selectedRole || (!selectedOccupationId && selectedRole !== 'custom')) {
                alert('Pick a category, occupation, and hierarchy level first.');
                prefillToggle.checked = false;
                return;
            }
            applyQuestionPreset();

        } else {
            resetQuestionsToNeutral();
        }
        if (v2AdjustmentMode && v2ResultsUnlocked) {
            analyzeRole();
        }
    });

    // Navigation buttons (Guide/Methodology)
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.getAttribute('data-page');
            if (page) {
                window.location.href = page;
            }
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Initialize occupation search
    initializeOccupationSearch();
    populateV2RoleComposition(selectedOccupationId, false).catch((error) => {
        console.error('[V2] Failed to initialize role composition:', error);
    });
    syncHierarchyControl();

    // Step cards navigation
    document.querySelectorAll('.step-card').forEach(card => {
        const page = card.getAttribute('data-page');
        if (!page) return;
        card.addEventListener('click', () => {
            window.location.href = page;
        });
    });

    // Set initial prefill state
    setPrefillState();
    syncSetupVisibility();
    refreshScrollRevealTargets();
});

// ─── 13. Second DOMContentLoaded for init ───────────────────────────────────

window.addEventListener('DOMContentLoaded', function() {
    resetV2Results();
});
