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
let v2StoryboardScene = 'seat';
let v2StoryboardSelectedNodeId = null;
let v2OccupationIndexPromise = null;
let v2StateModelControls = { demandBias: 0, investmentBias: 0 };
let v2StateControlUpdateTimer = null;

const V2_STORYBOARD_SCENES = Object.freeze([
    { id: 'seat', label: 'Seat intact' },
    { id: 'pressure', label: 'Pressure enters' },
    { id: 'breakdown', label: 'Seat breaks apart' },
    { id: 'recompose', label: 'Retained role reforms' },
    { id: 'timing', label: 'Timing overlay' }
]);

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
const CORE_REFINEMENT_FACTORS = [
    'ai_observability_of_work',
    'workflow_decomposability',
    'exception_and_context_load',
    'human_signoff_requirement',
    'organizational_adoption_readiness',
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
const REFINEMENT_MODULE_DESCRIPTIONS = {
    'AI Readiness': 'How well AI can already handle this type of work, and how much data exists to train on.',
    'How Your Work Is Structured': 'Whether the work breaks into clear steps or requires continuous judgment and context.',
    'Relationships & Accountability': 'How much the role depends on trust, relationships, and a human being personally accountable.',
    'Your Organization': 'How quickly your specific employer can convert AI tools into actual workflow change.'
};

// ─── 3. Utility functions ────────────────────────────────────────────────────

function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
}

function toScore(raw) {
    if (typeof raw !== 'number' || Number.isNaN(raw)) return 2;
    if (raw >= 1 && raw <= 5) {
        return Math.max(0, Math.min(4, raw - 1));
    }
    return Math.max(0, Math.min(4, raw));
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

function buildAdvancedModuleNode(module) {
    const category = document.createElement('div');
    category.className = 'category';

    const header = document.createElement('div');
    header.className = 'category-header';

    const title = document.createElement('div');
    title.className = 'category-title';
    title.append(document.createTextNode(module.title));

    const count = document.createElement('span');
    count.className = 'category-count';
    count.textContent = `${module.questions.length} question${module.questions.length === 1 ? '' : 's'}`;
    title.appendChild(count);

    const toggle = document.createElement('div');
    toggle.className = 'category-toggle';
    toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    header.appendChild(title);
    header.appendChild(toggle);

    const content = document.createElement('div');
    content.className = 'category-content';

    const moduleDescription = document.createElement('p');
    moduleDescription.className = 'card-description';
    moduleDescription.style.marginBottom = '14px';
    moduleDescription.textContent = REFINEMENT_MODULE_DESCRIPTIONS[module.title] || '';
    if (moduleDescription.textContent) {
        content.appendChild(moduleDescription);
    }

    const grid = document.createElement('div');
    grid.className = 'question-grid';
    module.questions.forEach((question) => {
        grid.appendChild(buildQuestionNode(question));
    });
    content.appendChild(grid);

    category.appendChild(header);
    category.appendChild(content);
    return category;
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

function formatWaveCoherencePlain(coherenceTier) {
    if (coherenceTier === 'coherent') {
        return 'A clear core of the role still hangs together as one job.';
    }
    if (coherenceTier === 'narrowed') {
        return 'Part of the role still hangs together, but in a thinner form.';
    }
    if (coherenceTier === 'fragmented') {
        return 'The remaining work breaks into smaller fragments rather than one stable seat.';
    }
    return '-';
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

function formatTrajectoryThresholdShort(key) {
    if (key === 'noticeable_change') return '0.30 change';
    if (key === 'role_restructuring') return '0.50 restructure';
    if (key === 'major_transformation') return '0.70 major';
    return formatV2Label(key);
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

function formatStateAssumptionBias(value, negativeLabel, neutralLabel, positiveLabel) {
    const numeric = Number(value);
    if (numeric <= -0.5) return negativeLabel;
    if (numeric >= 0.5) return positiveLabel;
    return neutralLabel;
}

function getTrajectoryPhaseForPoint(point, structuralScore) {
    const compression = clamp(Number(point?.transformed_share ?? point?.compression ?? 0), 0, 1);
    const demand = clamp(Number(point?.demand ?? 0), 0, 1);
    const viability = clamp(Number(point?.viability ?? 0), 0, 1);
    const structural = clamp(Number(structuralScore ?? 0), 0, 1);
    const demandLead = demand - compression;

    if (compression >= 0.7 && viability < 0.32 && structural < 0.42) {
        return {
            key: 'weakens',
            label: 'Seat weakens',
            note: 'Compression is outrunning both demand and structural support.'
        };
    }
    if (compression >= 0.5 && structural >= 0.58 && viability >= 0.42) {
        return {
            key: 'rebuilds',
            label: 'Rebuilds around core',
            note: 'A lot changes, but the seat still holds around judgment and coordination.'
        };
    }
    if (demandLead >= 0.08 && viability >= 0.58) {
        return {
            key: 'offsets',
            label: 'Demand offsets change',
            note: 'Demand expansion is absorbing a meaningful share of the buildout.'
        };
    }
    if (compression > demand + 0.1 && viability < 0.5) {
        return {
            key: 'compresses',
            label: 'Compresses',
            note: 'Execution leaves faster than demand and structure can offset it.'
        };
    }
    if (compression < 0.3 && viability >= 0.52) {
        return {
            key: 'holds',
            label: 'Holds together',
            note: 'The seat is still largely intact while pressure remains limited.'
        };
    }
    return {
        key: 'transitioning',
        label: 'Transitioning',
        note: 'The seat is shifting, but the end-state is not fully settled yet.'
    };
}

function buildTrajectoryPhaseSegments(points, structuralScore) {
    const rows = Array.isArray(points) ? points : [];
    if (!rows.length) {
        return [];
    }

    const segments = [];
    rows.forEach((point, index) => {
        const phase = getTrajectoryPhaseForPoint(point, structuralScore);
        const year = Number(point?.year ?? index);
        const existing = segments[segments.length - 1];

        if (existing && existing.key === phase.key) {
            existing.end = year;
            existing.note = phase.note;
            return;
        }

        segments.push({
            key: phase.key,
            label: phase.label,
            note: phase.note,
            start: year,
            end: year
        });
    });

    const totalRange = Math.max(0.1, Number(rows[rows.length - 1]?.year ?? 10));
    return segments.map((segment) => ({
        ...segment,
        widthPct: Math.max(6, (((segment.end - segment.start) || 0.1) / totalRange) * 100)
    }));
}

function renderTrajectoryOutcomeRail(points, structuralScore) {
    const container = document.getElementById('v2-trajectory-outcome-rail');
    if (!container) return;
    container.innerHTML = '';

    const segments = buildTrajectoryPhaseSegments(points, structuralScore);
    if (!segments.length) {
        return;
    }

    const label = document.createElement('div');
    label.className = 'r-trajectory-outcome-label';
    label.textContent = 'Seat read over time';

    const track = document.createElement('div');
    track.className = 'r-trajectory-outcome-track';

    segments.forEach((segment) => {
        const item = document.createElement('div');
        item.className = `r-trajectory-outcome-segment r-trajectory-outcome-segment--${segment.key}`;
        item.style.flexBasis = `${segment.widthPct}%`;
        item.title = `${segment.label} · years ${segment.start.toFixed(1)}-${segment.end.toFixed(1)}. ${segment.note}`;
        item.innerHTML = `
            <span>${segment.label}</span>
            <small>${segment.start.toFixed(1)}-${segment.end.toFixed(1)}y</small>
        `;
        track.appendChild(item);
    });

    container.appendChild(label);
    container.appendChild(track);
}

function trajectoryBucketRank(bucket) {
    if (bucket === 'already_underway') return 0;
    if (bucket === 'range_1_3_years') return 1;
    if (bucket === 'range_3_7_years') return 2;
    if (bucket === 'range_7_plus_years') return 3;
    return 3;
}

function summarizeTrajectoryBucketRange(buckets) {
    const valid = (buckets || []).filter(Boolean);
    if (!valid.length) return '-';
    const ranks = valid.map(trajectoryBucketRank);
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    const minBucket = ['already_underway', 'range_1_3_years', 'range_3_7_years', 'range_7_plus_years'][minRank];
    const maxBucket = ['already_underway', 'range_1_3_years', 'range_3_7_years', 'range_7_plus_years'][maxRank];
    if (minRank === maxRank) {
        return formatTrajectoryBucket(minBucket);
    }
    return `${formatTrajectoryBucket(minBucket)} to ${formatTrajectoryBucket(maxBucket)}`;
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

let v2UnemploymentChart = null;
let v2TrajectoryChart = null;

function renderV2UnemploymentChart(laborContext) {
    const canvas = document.getElementById('v2-unemployment-chart');
    const emptyState = document.getElementById('v2-unemployment-empty');
    if (!canvas || !emptyState) {
        return;
    }

    if (v2UnemploymentChart) {
        v2UnemploymentChart.destroy();
        v2UnemploymentChart = null;
    }

    const series = Array.isArray(laborContext?.monthly_unemployment_series)
        ? laborContext.monthly_unemployment_series
        : [];

    if (!series.length) {
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    canvas.style.display = 'block';
    emptyState.style.display = 'none';

    v2UnemploymentChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: series.map(point => point.month_label),
            datasets: [{
                label: 'Unemployment rate',
                data: series.map(point => point.unemployment_rate),
                borderColor: '#2a5298',
                backgroundColor: 'rgba(42, 82, 152, 0.12)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 4,
                spanGaps: false,
                tension: 0.25,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y;
                            return Number.isFinite(value) ? `${value.toFixed(1)}%` : 'Data unavailable';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 6
                    },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        callback: (value) => `${value}%`
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

function renderV2LaborMarketContext(laborContext, occupationTitle) {
    safeSetText('v2-employment', laborContext ? formatCompactNumber(laborContext.employment_us) : '-');
    safeSetText('v2-openings', laborContext ? formatCompactNumber(laborContext.annual_openings) : '-');
    safeSetText('v2-wage', laborContext ? formatCurrency(laborContext.median_wage_usd) : '-');
    safeSetText('v2-growth', laborContext ? formatSignedPercent(laborContext.projection_growth_pct) : '-');
    safeSetText('v2-unemployment-latest', laborContext && laborContext.latest_unemployment_rate !== null
        ? `${Number(laborContext.latest_unemployment_rate).toFixed(1)}%`
        : '-');
    safeSetText('v2-unemployment-series-label', laborContext?.unemployment_group_label || 'No mapped unemployment series');
    safeSetText(
        'v2-unemployment-note',
        laborContext?.unemployment_group_label
            ? `${occupationTitle} is mapped to the official BLS ${laborContext.unemployment_group_label.toLowerCase()} monthly unemployment series.`
            : 'This occupation does not have an official BLS unemployment series mapped yet.'
    );
    renderV2UnemploymentChart(laborContext);
}

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

function buildTaskDrivenMapRows(taskBreakdown, shareKey) {
    const rows = Array.isArray(taskBreakdown?.tasks) ? taskBreakdown.tasks.slice() : [];
    if (!rows.length) {
        return [];
    }

    const ranked = rows
        .filter((task) => (Number(task?.[shareKey]) || 0) >= 0.012)
        .sort((left, right) => {
            const rightValue = Number(right?.[shareKey]) || 0;
            const leftValue = Number(left?.[shareKey]) || 0;
            if (rightValue !== leftValue) {
                return rightValue - leftValue;
            }
            return (Number(right?.share_of_role) || 0) - (Number(left?.share_of_role) || 0);
        });

    const selected = (ranked.length ? ranked : rows.slice().sort((left, right) => {
        const rightValue = Number(right?.[shareKey]) || 0;
        const leftValue = Number(left?.[shareKey]) || 0;
        return rightValue - leftValue;
    })).slice(0, 5);

    return selected.map((task) => ({
        label: task?.task_statement || 'Unknown task',
        full_label: task?.task_statement || 'Unknown task',
        secondary_label: task?.public_task_cluster_label || task?.task_cluster_label || 'Mapped task family',
        likely_mode: task?.likely_mode || null,
        evidence_confidence: Number(task?.evidence_confidence) || 0,
        evidence_badge: task?.has_direct_evidence ? 'Direct evidence' : 'Fallback estimate',
        share_of_role: Number(task?.share_of_role) || 0,
        exposed_share: Number(task?.exposed_share) || 0,
        residual_relevance: Number(task?.retained_share) || 0
    }));
}

function buildTaskDrivenTransformationMap(taskBreakdown) {
    return {
        current_bundle: buildTaskDrivenMapRows(taskBreakdown, 'share_of_role'),
        exposed_clusters: buildTaskDrivenMapRows(taskBreakdown, 'exposed_share'),
        retained_clusters: buildTaskDrivenMapRows(taskBreakdown, 'retained_share')
    };
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

function buildSeatChangeDisplayRows(seatChangeMap, mode) {
    const rows = mode === 'shrinks'
        ? (seatChangeMap?.shrinking_bundles || [])
        : mode === 'stays'
            ? (seatChangeMap?.retained_bundles || [])
            : (seatChangeMap?.growing_bundles || []);

    return rows.map((row) => {
        if (mode === 'shrinks') {
            return {
                label: row.public_label || row.task_cluster_label || 'Unknown bundle',
                full_label: row.public_label || row.task_cluster_label || 'Unknown bundle',
                secondary_label: 'Leaves the seat first',
                likely_mode: 'shrinks',
                evidence_confidence: Number(row.confidence) || Number(seatChangeMap?.shrinking_share_estimate) || 0,
                confidence_badge: row.confidence_label || null,
                confidence_note: row.confidence_reason || null,
                evidence_badge: formatSignedShareDelta(row.net_share_delta),
                signal_share: Math.max(Number(row.shrink_score) || 0, 0),
                share_of_role: Math.max(Number(row.shrink_score) || 0, 0)
            };
        }
        if (mode === 'stays') {
            return {
                label: row.public_label || row.task_cluster_label || 'Unknown bundle',
                full_label: row.public_label || row.task_cluster_label || 'Unknown bundle',
                secondary_label: 'Retained human core',
                likely_mode: 'stays',
                evidence_confidence: Number(row.evidence_confidence) || 0,
                confidence_badge: row.confidence_label || null,
                confidence_note: row.confidence_reason || null,
                evidence_badge: `${Math.round((Number(row.retained_share) || 0) * 100)}% retained`,
                signal_share: Math.max(Number(row.retained_share) || 0, 0),
                share_of_role: Math.max(Number(row.retained_share) || 0, 0)
            };
        }
        return {
            label: row.public_label || row.task_cluster_label || 'Unknown bundle',
            full_label: row.public_label || row.task_cluster_label || 'Unknown bundle',
            secondary_label: 'Expands inside the seat',
            likely_mode: 'grows',
            evidence_confidence: Number(row.confidence) || 0,
            confidence_badge: row.confidence_label || null,
            confidence_note: row.confidence_reason || null,
            evidence_badge: formatSignedShareDelta(row.net_share_delta),
            signal_share: Math.max(Number(row.accession_score) || 0, 0),
            share_of_role: Math.max(Number(row.accession_score) || 0, 0)
        };
    });
}

function renderV2EvidenceSummary(summary) {
    const directRows = Number(summary?.source_coverage?.direct_task_evidence_rows) || 0;
    const fallbackRows = Number(summary?.source_coverage?.fallback_task_rows) || 0;
    const totalRows = directRows + fallbackRows;
    const coverageNote = totalRows
        ? `${Math.round((directRows / totalRows) * 100)}% of the mapped task rows use direct Anthropic task evidence; the remaining ${fallbackRows} rows fall back to task-family estimates.`
        : 'Task-row coverage appears once a mapped occupation is loaded.';
    const questionnaireProfile = summary?.questionnaire_profile;
    const profileSource = summary?.questionnaire_profile_source === 'native_profile'
        ? 'Native role-refinement profile'
        : summary?.questionnaire_profile_source === 'structured_profile'
            ? 'Structured role-refinement profile'
            : summary?.questionnaire_profile_source === 'default_profile'
                ? 'Default role-refinement profile'
                : 'Legacy-answer compatibility profile';
    const profileNote = questionnaireProfile
        ? `${profileSource}: function retention ${formatProfileBand(questionnaireProfile.function_centrality)}, sign-off ${formatProfileBand(questionnaireProfile.human_signoff_requirement)}, adoption readiness ${formatProfileBand(questionnaireProfile.organizational_adoption_readiness)}, augmentation fit ${formatProfileBand(questionnaireProfile.augmentation_fit)}, and substitution pressure ${formatProfileBand(questionnaireProfile.substitution_risk_modifier)}.`
        : '';
    const frictionNote = summary
        ? 'The model now scores task-family friction explicitly through exception burden, accountability load, judgment requirement, document intensity, and tacit/context dependence.'
        : '';

    safeSetText('v2-task-confidence', summary ? formatLabeledMetric(summary.task_evidence_confidence) : '-');
    safeSetText('v2-prior-confidence', summary ? formatLabeledMetric(summary.personalization_confidence) : '-');
    safeSetText(
        'v2-evidence-notes',
        summary
            ? `Evidence strength is the average source strength across the role-specific task families used in this result after sparse task rows are shrunk toward broader priors. ${coverageNote} ${frictionNote} ${profileNote} Personalization signal strength combines retained-function protection, substitution pressure, and evidence strength.`
            : 'Choose a mapped occupation to see how evidence strength and personalization signal are scored.'
    );
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

function renderV2OccupationAssignment(assignment) {
    const directCount = Number(assignment?.direct_task_evidence_count) || 0;
    const fallbackCount = Number(assignment?.fallback_task_count) || 0;
    const totalCount = directCount + fallbackCount;
    const directCoveragePct = totalCount ? Math.round((directCount / totalCount) * 100) : 0;

    safeSetText('v2-assignment-category', assignment ? assignment.role_category_label || '-' : '-');
    safeSetText('v2-assignment-anchor', assignment ? assignment.selected_occupation_title || '-' : '-');
    safeSetText(
        'v2-assignment-match',
        assignment
            ? formatLabeledMetric(assignment.anchor_confidence)
            : '-'
    );
    safeSetText(
        'v2-assignment-coverage',
        assignment
            ? formatCoverageMetric(directCount, fallbackCount)
            : '-'
    );

    const parts = [];
    if (assignment?.onet_soc_code) {
        parts.push(`${assignment.selected_occupation_title} is anchored to O*NET/SOC ${assignment.onet_soc_code}.`);
    }
    if (assignment) {
        parts.push(`Occupation anchor strength combines the occupation-prior confidence with the launch selector anchor${assignment.category_candidate_rank ? `; this occupation is candidate ${assignment.category_candidate_rank} of ${assignment.category_candidate_count} inside the selected category` : ''}.`);
    }
    if (assignment && totalCount) {
        parts.push(`Task coverage means ${directCoveragePct}% of the ${totalCount} mapped role tasks have direct Anthropic task evidence; the remaining ${fallbackCount} rows use task-family fallback estimates.`);
    }
    if (assignment?.selected_composition) {
        if (assignment.selected_composition.variant_label) {
            parts.push(`This run starts from the reviewed ${assignment.selected_composition.variant_label.toLowerCase()} baseline for this occupation${assignment.selected_composition.variant_mode === 'manual' ? ', because you selected it explicitly' : ', because the model currently recommends it from your questionnaire and role mix'}.`);
        }
        parts.push(`This run currently scores ${assignment.selected_composition.active_task_count} active tasks and ${assignment.selected_composition.active_function_count} active functions after your composition edits.`);
        if (Number(assignment.selected_composition.added_dependency_count) > 0) {
            parts.push(`You also added ${assignment.selected_composition.added_dependency_count} custom support link${assignment.selected_composition.added_dependency_count === 1 ? '' : 's'} on top of the default dependency graph.`);
        }
        if (Number(assignment.selected_composition.custom_function_link_count) > 0) {
            parts.push(`You also added ${assignment.selected_composition.custom_function_link_count} custom task-to-function link${assignment.selected_composition.custom_function_link_count === 1 ? '' : 's'} that now raise the importance of those tasks inside the role.`);
        }
        if (Number(assignment.selected_composition.share_override_count) > 0) {
            parts.push(`You adjusted the role-share weight for ${assignment.selected_composition.share_override_count} task${assignment.selected_composition.share_override_count === 1 ? '' : 's'}, so the task mix was renormalized before scoring.`);
        }
    }
    if (assignment?.questionnaire_effect) {
        parts.push(assignment.questionnaire_effect);
    }
    if (assignment?.role_defining_cluster?.label) {
        parts.push(`The role-defining task family is currently ${assignment.role_defining_cluster.label.toLowerCase()}.`);
    }

    safeSetText(
        'v2-assignment-copy',
        parts.length
            ? parts.join(' ')
            : 'Choose a mapped occupation to see how your role is assigned to the underlying O*NET, Anthropic, and BLS occupation data.'
    );
}

function renderV2OccupationExplanation(explanation) {
    safeSetText('v2-explanation-driver', explanation ? [explanation.primary_driver, explanation.secondary_driver].filter(Boolean).join(' + ') : '-');
    safeSetText('v2-explanation-counterweight', explanation ? explanation.primary_counterweight || '-' : '-');
    safeSetText('v2-explanation-evidence', explanation ? explanation.evidence_profile || '-' : '-');
    safeSetText('v2-explanation-review', explanation ? formatV2Label(explanation.review_priority) : '-');
    safeSetText(
        'v2-explanation-copy',
        explanation?.explanation_summary
            ? `${explanation.explanation_summary} This summary is generated from the current live role run.`
            : 'Choose a mapped occupation to see the plain-English summary for the current live role readout.'
    );
}

function renderV2EditImpact(editDelta) {
    const trajectoryDelta = editDelta?.trajectory_delta || null;
    const taskDetail = editDelta
        ? [
            Array.isArray(editDelta.added_task_labels) && editDelta.added_task_labels.length
                ? `Added: ${editDelta.added_task_labels.slice(0, 2).join(' · ')}`
                : '',
            Array.isArray(editDelta.removed_task_labels) && editDelta.removed_task_labels.length
                ? `Removed: ${editDelta.removed_task_labels.slice(0, 2).join(' · ')}`
                : ''
        ].filter(Boolean).join(' / ')
        : '-';
    const functionDetail = editDelta
        ? [
            Array.isArray(editDelta.added_function_labels) && editDelta.added_function_labels.length
                ? `Added: ${editDelta.added_function_labels.slice(0, 2).join(' · ')}`
                : '',
            Array.isArray(editDelta.removed_function_labels) && editDelta.removed_function_labels.length
                ? `Removed: ${editDelta.removed_function_labels.slice(0, 2).join(' · ')}`
                : ''
        ].filter(Boolean).join(' / ')
        : '-';
    const evidenceMix = editDelta?.source_mix_delta
        ? `${editDelta.source_mix_delta.current_direct_evidence_tasks}/${editDelta.source_mix_delta.baseline_direct_evidence_tasks} direct-evidence tasks · ${editDelta.source_mix_delta.current_fallback_tasks}/${editDelta.source_mix_delta.baseline_fallback_tasks} fallback`
        : '-';
    const trajectoryChange = trajectoryDelta
        ? (trajectoryDelta.state_changed
            ? `${formatTrajectoryStateLabel(trajectoryDelta.baseline_state)} -> ${formatTrajectoryStateLabel(trajectoryDelta.current_state)}`
            : `No change · ${formatTrajectoryStateLabel(trajectoryDelta.current_state)}`)
        : (editDelta
            ? (editDelta.role_fate_changed
                ? `${editDelta.baseline_role_fate_label} -> ${editDelta.current_role_fate_label}`
                : `No change · ${editDelta.current_role_fate_label || 'same fate label'}`)
            : '-');
    const nextScenarioDelta = trajectoryDelta?.next_scenario_delta
        ? [
            `Compression ${formatPointDelta(trajectoryDelta.next_scenario_delta.compression)}`,
            `Demand ${formatPointDelta(trajectoryDelta.next_scenario_delta.demand)}`,
            `Viability ${formatPointDelta(trajectoryDelta.next_scenario_delta.viability)}`
        ].join(' · ')
        : '-';
    const structureDelta = trajectoryDelta
        ? [
            `Structure ${formatPointDelta(trajectoryDelta.structural_necessity_delta)}`,
            trajectoryDelta.role_shape_changed
                ? `${formatTrajectoryRoleShape(trajectoryDelta.baseline_role_shape)} -> ${formatTrajectoryRoleShape(trajectoryDelta.current_role_shape)}`
                : formatTrajectoryRoleShape(trajectoryDelta.current_role_shape)
        ].filter(Boolean).join(' · ')
        : '-';
    const timingDelta = trajectoryDelta
        ? (trajectoryDelta.role_restructuring_bucket_changed
            ? `${formatTrajectoryBucket(trajectoryDelta.baseline_role_restructuring_bucket)} -> ${formatTrajectoryBucket(trajectoryDelta.current_role_restructuring_bucket)}`
            : `No change · ${formatTrajectoryBucket(trajectoryDelta.current_role_restructuring_bucket)}`)
        : '-';

    safeSetText(
        'v2-edit-impact-baseline',
        editDelta
            ? (editDelta.baseline_variant_label
                ? `${editDelta.baseline_variant_label} baseline`
                : 'Occupation default baseline')
            : '-'
    );
    safeSetText(
        'v2-edit-impact-counts',
        editDelta
            ? `${editDelta.changed_task_count} task change${editDelta.changed_task_count === 1 ? '' : 's'} · ${editDelta.changed_function_count} function change${editDelta.changed_function_count === 1 ? '' : 's'}`
            : '-'
    );
    safeSetText(
        'v2-edit-impact-largest',
        trajectoryDelta?.largest_shift
            ? `${trajectoryDelta.largest_shift.metric_label} ${trajectoryDelta.largest_shift.direction} ${Math.abs(Math.round(Number(trajectoryDelta.largest_shift.delta || 0) * 100))} pts`
            : editDelta?.largest_metric_shift
            ? `${editDelta.largest_metric_shift.metric_label} ${editDelta.largest_metric_shift.direction} ${Math.abs(Math.round(Number(editDelta.largest_metric_shift.delta || 0) * 100))} pts`
            : (editDelta ? 'No material metric shift' : '-')
    );
    safeSetText('v2-edit-impact-fate', trajectoryChange);
    safeSetText('v2-edit-impact-trajectory', nextScenarioDelta);
    safeSetText('v2-edit-impact-structure', structureDelta);
    safeSetText('v2-edit-impact-timing', timingDelta);
    safeSetText('v2-edit-impact-tasks', taskDetail || (editDelta ? 'No task add/remove change' : '-'));
    safeSetText('v2-edit-impact-functions', functionDetail || (editDelta ? 'No function add/remove change' : '-'));
    safeSetText('v2-edit-impact-evidence', evidenceMix);
    safeSetText(
        'v2-edit-impact-copy',
        trajectoryDelta?.summary || editDelta?.summary
            ? [trajectoryDelta?.summary, editDelta?.summary].filter(Boolean).join(' ')
            : 'Edit tasks, functions, or task weights to compare your current run to the unedited baseline for this occupation.'
    );
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

function renderV2AuditTrace(auditTrace) {
    const pressureTasks = Array.isArray(auditTrace?.top_pressure_tasks)
        ? auditTrace.top_pressure_tasks.slice(0, 2).map((task) => task.task_statement).join(' · ')
        : '';
    const spilloverTasks = Array.isArray(auditTrace?.top_spillover_tasks)
        ? auditTrace.top_spillover_tasks.slice(0, 2).map((task) => task.task_statement).join(' · ')
        : '';
    const retainedTasks = Array.isArray(auditTrace?.top_retained_tasks)
        ? auditTrace.top_retained_tasks.slice(0, 2).map((task) => task.task_statement).join(' · ')
        : '';
    const exposedFunctions = Array.isArray(auditTrace?.top_exposed_functions)
        ? auditTrace.top_exposed_functions.slice(0, 2).map((fn) => fn.role_summary).join(' · ')
        : '';
    const retainedFunctions = Array.isArray(auditTrace?.top_retained_functions)
        ? auditTrace.top_retained_functions.slice(0, 2).map((fn) => fn.role_summary).join(' · ')
        : '';
    const citations = Array.isArray(auditTrace?.evidence_citations)
        ? auditTrace.evidence_citations.slice(0, 2).map((row) => `${row.task_statement} (${formatV2Label(row.evidence_source_role || 'evidence')})`).join(' · ')
        : '';

    safeSetText('v2-audit-pressure', pressureTasks || (auditTrace ? 'No pressure tasks above threshold' : '-'));
    safeSetText('v2-audit-spillover', spilloverTasks || (auditTrace ? 'No spillover tasks above threshold' : '-'));
    safeSetText('v2-audit-retained', retainedTasks || (auditTrace ? 'No retained tasks above threshold' : '-'));
    safeSetText('v2-audit-functions', exposedFunctions || (auditTrace ? 'No exposed functions above threshold' : '-'));
    safeSetText('v2-audit-retained-functions', retainedFunctions || (auditTrace ? 'No retained functions above threshold' : '-'));
    safeSetText('v2-audit-citations', citations || (auditTrace ? 'No direct-evidence citations in this run' : '-'));
    safeSetText(
        'v2-audit-copy',
        auditTrace
            ? 'This trace names the main pressure tasks, spillover tasks, retained tasks, exposed and retained functions, and the direct-evidence rows that most credibly anchor the current readout.'
            : 'The live audit trace will show which tasks, functions, and evidence rows are driving the current readout.'
    );

    const copyButton = document.getElementById('v2-audit-copy-button');
    if (copyButton instanceof HTMLButtonElement) {
        copyButton.disabled = !auditTrace?.export_summary;
    }
}

function renderV2RecompositionSummary(summary) {
    safeSetText('v2-recomposition-label', summary ? summary.summary_label || '-' : '-');
    safeSetText('v2-recomposition-compression', summary ? formatBandMetric(summary.workflow_compression, summary.workflow_compression_band, [0.25, 0.5], ['Low', 'Moderate', 'High']) : '-');
    safeSetText('v2-recomposition-conversion', summary ? formatBandMetric(summary.organizational_conversion, summary.organizational_conversion_band, [0.25, 0.5], ['Low', 'Moderate', 'High']) : '-');
    safeSetText('v2-recomposition-substitution', summary ? formatBandMetric(summary.substitution_potential, summary.substitution_potential_band, [0.2, 0.4], ['Low', 'Moderate', 'High']) : '-');
    safeSetText('v2-recomposition-gap', summary ? formatBandMetric(summary.substitution_gap, summary.substitution_gap_band, [0.12, 0.25], ['Low', 'Moderate', 'High']) : '-');
    safeSetText(
        'v2-recomposition-note',
        summary?.summary_note
            ? `Workflow compression is the technically compressible share of the role. Organizational conversion is the current read on how much of that compression looks likely to convert into fewer labor hours. Substitution potential is compression multiplied by conversion. Recomposition gap is exposed work that still looks more likely to be reorganized than removed. These readouts now include uncertainty ranges rather than a single point estimate. ${summary.summary_note}`
            : 'This panel separates technically compressible work from the share that currently looks more likely to convert into fewer labor hours.'
    );
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
    if (!container) return;

    container.innerHTML = '';

    const allRows = Array.isArray(taskBreakdown?.tasks) ? taskBreakdown.tasks : [];
    const rows = v2TaskBreakdownExpanded ? allRows : allRows.slice(0, 10);
    const directCount = Number(taskBreakdown?.direct_evidence_tasks) || 0;
    const fallbackCount = Number(taskBreakdown?.cluster_fallback_tasks) || 0;

    safeSetText('v2-task-total', allRows.length ? `${rows.length} of ${taskBreakdown.total_tasks_considered}` : '-');
    safeSetText('v2-task-direct', taskBreakdown ? formatCoverageMetric(directCount, fallbackCount) : '-');
    safeSetText('v2-task-fallback', taskBreakdown ? String(taskBreakdown.cluster_fallback_tasks || 0) : '-');
    safeSetText('v2-task-ordering', allRows.length ? (v2TaskBreakdownExpanded ? 'All tasks' : 'Top exposed share') : '-');
    safeSetText(
        'v2-task-summary-copy',
        assignment
            ? `${assignment.selected_occupation_title} currently resolves to ${taskBreakdown.total_tasks_considered || 0} active role tasks. This list live-updates as your composition edits and role-refinement answers change role share, direct pressure, spillover pressure, and retained leverage. Use “Show model details” if you want the evidence and fallback notes.`
            : 'Choose a mapped occupation to load its task inventory and the blended role-fate view.'
    );

    if (toggle) {
        const canExpand = allRows.length > 10;
        toggle.hidden = !canExpand;
        toggle.textContent = v2TaskBreakdownExpanded ? 'Show top 10 tasks' : `Show all ${allRows.length} tasks`;
        toggle.setAttribute('aria-expanded', v2TaskBreakdownExpanded ? 'true' : 'false');
    }

    if (!rows.length) {
        if (toggle) {
            toggle.hidden = true;
        }
        const empty = document.createElement('div');
        empty.className = 'v2-task-item';
        empty.textContent = 'No mapped task-level rows are available for this occupation yet.';
        container.appendChild(empty);
        return;
    }

    rows.forEach((task) => {
        container.appendChild(createV2TaskBreakdownItem(task));
    });
}

function setContainerHTML(elementId, html) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = html;
}

function countSelectedRows(rows, idKey) {
    if (!Array.isArray(rows) || !idKey || !v2RoleCompositionState) return 0;
    const selectedIds = idKey === 'function_id'
        ? v2RoleCompositionState.selectedFunctionIds
        : v2RoleCompositionState.selectedTaskIds;
    return rows.filter((row) => selectedIds?.has(row[idKey])).length;
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

function buildTaskStoryExplanation(task, scoredTask, linkedFunctions) {
    const functionList = joinReadableList(linkedFunctions.map((entry) => entry.role_summary || entry.function_statement).filter(Boolean));
    const sourceCopy = task?.__sourceLabel ? `I kept this from the ${task.__sourceLabel.toLowerCase()}.` : 'I kept this in the active role mix.';
    const shareCopy = Number.isFinite(Number(task?.time_share_prior))
        ? `It represents about ${Math.round((Number(task.time_share_prior) || 0) * 100)}% of the default role mix.`
        : '';
    const functionCopy = functionList
        ? `It mainly supports ${functionList}.`
        : 'It currently has only a weak visible function link in the selected role mix.';

    if (!scoredTask) {
        return `${sourceCopy} ${shareCopy} ${functionCopy} This row has not resolved into a scored task yet, so it is still waiting on the live task model.`;
    }

    const directPressure = Number(scoredTask.direct_exposure_pressure) || 0;
    const spillover = Number(scoredTask.indirect_dependency_pressure) || 0;
    const retained = Number(scoredTask.retained_leverage) || 0;
    const evidenceCopy = scoredTask.has_direct_evidence
        ? `This row is using direct task evidence from ${scoredTask.task_source_label || 'the live evidence stack'}.`
        : 'This row is still leaning on fallback task-family structure because direct task evidence is sparse here.';

    let outcomeCopy = 'This task currently sits in the middle of the role.';
    if (directPressure >= 0.5) {
        outcomeCopy = 'This is one of the first parts of the role likely to get standardized, drafted, or delegated.';
    } else if (spillover >= 0.35) {
        outcomeCopy = 'This task is less about direct automation and more about becoming smaller once the surrounding workflow gets thinner.';
    } else if (retained >= 0.45) {
        outcomeCopy = 'This task still sits close to the human-retained core of the role.';
    }

    return `${sourceCopy} ${shareCopy} ${functionCopy} ${evidenceCopy} ${outcomeCopy}`;
}

function renderV2TaskStory(result) {
    const container = document.getElementById('v2-task-layer-list');
    if (!container) return;

    container.innerHTML = '';

    const selectedTasks = getSelectedCompositionTasksWithSource();
    if (!result || !selectedTasks.length) {
        const empty = document.createElement('div');
        empty.className = 'r-function-empty';
        empty.textContent = 'The task story appears here once the role has been rebuilt and scored.';
        container.appendChild(empty);
        return;
    }

    const scoredLookup = new Map((result.task_breakdown?.tasks || []).map((task) => [task.task_id, task]));
    const rankedTasks = sortTasksByDisplayOrder(selectedTasks)
        .sort((left, right) => getEffectiveTaskShare(right) - getEffectiveTaskShare(left))
        .slice(0, 6);

    rankedTasks.forEach((task, index) => {
        const scoredTask = scoredLookup.get(task.task_id) || null;
        const linkedFunctions = getTaskFunctionLinks(task).slice(0, 2);
        const article = document.createElement('article');
        article.className = 'r-task-story-item';

        const functionCopy = joinReadableList(linkedFunctions.map((entry) => entry.role_summary || entry.function_statement).filter(Boolean)) || 'Mapped function pending';
        const sourceBucket = task.__sourceLabel || 'Mapped task';
        const evidenceBucket = scoredTask?.task_source_label || sourceBucket;

        article.innerHTML = `
            <div class="r-task-story-index">${String(index + 1).padStart(2, '0')}</div>
            <div class="r-task-story-content">
                <div class="r-task-story-top">
                    <div>
                        <div class="r-section-label">Task ${index + 1}</div>
                        <h3>${task.task_statement || 'Unnamed task'}</h3>
                    </div>
                    <div class="r-task-story-badges">
                        <span class="v2-task-chip">${sourceBucket}</span>
                        <span class="v2-task-chip v2-task-chip--accent">${formatPercentWhole(getEffectiveTaskShare(task))} of role</span>
                    </div>
                </div>
                <p class="r-task-story-copy">${buildTaskStoryExplanation(task, scoredTask, linkedFunctions)}</p>
                <div class="r-task-story-meta">
                    <div class="r-task-story-meta-item">
                        <span>Feeds into</span>
                        <strong>${functionCopy}</strong>
                    </div>
                    <div class="r-task-story-meta-item">
                        <span>Evidence source</span>
                        <strong>${evidenceBucket}</strong>
                    </div>
                    <div class="r-task-story-meta-item">
                        <span>Direct pressure</span>
                        <strong>${formatPercentWhole(scoredTask?.direct_exposure_pressure)}</strong>
                    </div>
                    <div class="r-task-story-meta-item">
                        <span>Retained leverage</span>
                        <strong>${formatPercentWhole(scoredTask?.retained_leverage)}</strong>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(article);
    });

    refreshScrollRevealTargets();
}

function renderV2FunctionDiagram() {
    const container = document.getElementById('v2-function-diagram');
    if (!container) return;
    container.innerHTML = '';

    const selectedFunctions = getSelectedCompositionFunctions();
    const supportMap = getSelectedFunctionSupportMap();

    if (!selectedFunctions.length) {
        const empty = document.createElement('div');
        empty.className = 'r-function-empty';
        empty.textContent = 'Function anchors will appear here once the role has a mapped composition.';
        container.appendChild(empty);
        return;
    }

    const lead = document.createElement('div');
    lead.className = 'r-function-lead';
    lead.innerHTML = '<span>Selected tasks</span><span aria-hidden="true">→</span><span>Reviewed purpose anchors</span><span aria-hidden="true">→</span><span>Human-retained core</span>';
    container.appendChild(lead);

    const grid = document.createElement('div');
    grid.className = 'r-function-grid';

    selectedFunctions.slice(0, 4).forEach((fn) => {
        const card = document.createElement('article');
        card.className = 'r-function-card';

        const supportTasks = (supportMap.get(fn.function_id) || [])
            .slice(0, 2)
            .map((row) => row.task_statement)
            .join(' · ');

        const header = document.createElement('div');
        header.className = 'r-function-card-top';
        header.innerHTML = `<span>${formatV2Label(fn.function_category || 'function')}</span><strong>${fn.role_summary || fn.function_statement || 'Unnamed function'}</strong>`;

        const note = document.createElement('p');
        note.className = 'r-function-card-note';
        note.textContent = supportTasks
            ? `Built mainly from tasks like ${supportTasks}.`
            : 'This function currently has no selected support tasks above the display threshold.';

        const meta = document.createElement('div');
        meta.className = 'r-function-card-meta';
        meta.appendChild(createV2TaskChip(`${Math.round((Number(fn.function_weight) || 0) * 100)}% default weight`, 'accent'));
        meta.appendChild(createV2TaskChip(`${(supportMap.get(fn.function_id) || []).length} supporting task${(supportMap.get(fn.function_id) || []).length === 1 ? '' : 's'}`));

        card.appendChild(header);
        card.appendChild(note);
        card.appendChild(meta);
        grid.appendChild(card);
    });

    container.appendChild(grid);
    refreshScrollRevealTargets();
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
    const demandSlider = document.getElementById('v2-state-demand-bias');
    const investmentSlider = document.getElementById('v2-state-investment-bias');

    if (demandSlider) {
        demandSlider.value = String(Math.max(-1, Math.min(1, Number(demandBias) || 0)));
    }
    if (investmentSlider) {
        investmentSlider.value = String(Math.max(-1, Math.min(1, Number(investmentBias) || 0)));
    }

    safeSetText(
        'v2-state-demand-bias-value',
        formatStateAssumptionBias(demandBias, 'Demand capped', 'Demand neutral', 'Demand expands')
    );
    safeSetText(
        'v2-state-investment-bias-value',
        formatStateAssumptionBias(investmentBias, 'Firms move slowly', 'Firms move normally', 'Firms push hard')
    );
}

function ensureTrajectorySectionsVisible() {
    [
        'v2-state-story',
        'v2-state-checkpoints',
        'v2-state-drivers',
        'v2-storyboard',
        'v2-trajectory-when',
        'v2-trajectory-scenarios',
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
    safeSetText('v2-state-summary', stateTrajectory?.summary || 'This layer treats the role as a state transition problem instead of mapping everything through wave timing.');
    safeSetText('v2-state-current', formatStateTrajectoryStateLabel(stateTrajectory?.current_state));
    safeSetText('v2-state-next', formatStateTrajectoryStateLabel(stateTrajectory?.likely_next_state));
    safeSetText(
        'v2-state-dimensionality',
        stateTrajectory?.dimensionality?.score !== undefined
            ? `${stateTrajectory.dimensionality.label} · ${formatPercentWhole(stateTrajectory.dimensionality.score)}`
            : '-'
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

function renderStateTrajectoryCheckpoints(result) {
    const container = document.getElementById('v2-state-checkpoint-grid');
    const stateTrajectory = result?.state_trajectory || null;
    if (!container) return;
    container.innerHTML = '';

    if (!stateTrajectory?.checkpoints) {
        return;
    }

    function metricRow(label, value, modifier) {
        const width = `${Math.max(0, Math.min(100, (Number(value) || 0) * 100))}%`;
        return `
            <div class="r-trajectory-scenario-row">
                <span>${label}</span>
                <div class="r-trajectory-scenario-meter">
                    <div class="r-trajectory-scenario-meter-fill ${modifier}" style="width:${width}"></div>
                </div>
                <strong>${Math.round((Number(value) || 0) * 100)}%</strong>
            </div>
        `;
    }

    [
        ['current', 'Year 0', 'Starting state'],
        ['next', 'Year 2', 'Likely next state'],
        ['distant', 'Year 5', 'Later state']
    ].forEach(([key, title, anchor]) => {
        const checkpoint = stateTrajectory.checkpoints[key];
        const card = document.createElement('article');
        card.className = 'r-trajectory-scenario-card r-state-checkpoint-card';
        card.innerHTML = `
            <div class="r-trajectory-scenario-top">
                <div>
                    <div class="r-section-label">${anchor}</div>
                    <h3>${title}</h3>
                </div>
                <strong class="r-trajectory-scenario-chip">${formatStateTrajectoryStateLabel(checkpoint?.state)}</strong>
            </div>
            <div class="r-trajectory-scenario-metrics">
                ${metricRow('Transformed share', checkpoint?.transformed_share, 'r-trajectory-scenario-meter-fill--compression')}
                ${metricRow('Demand offset', checkpoint?.demand_offset, 'r-trajectory-scenario-meter-fill--demand')}
                ${metricRow('Transition pressure', checkpoint?.transition_pressure, 'r-trajectory-scenario-meter-fill--viability')}
            </div>
            <div class="r-state-checkpoint-note">${formatStateTrajectoryStateLabel(checkpoint?.state)} is the dominant state read at this checkpoint.</div>
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

function renderTrajectoryGraph(result) {
    const container = document.getElementById('v2-trajectory-graph');
    const readout = document.getElementById('v2-trajectory-graph-readout');
    const trajectory = result?.trajectory || null;
    const timeline = trajectory?.timeline || null;
    if (!container) return;

    if (v2TrajectoryChart) {
        v2TrajectoryChart.destroy();
        v2TrajectoryChart = null;
    }

    container.innerHTML = '';

    const baselinePoints = timeline?.baseline?.points;
    const bandPoints = timeline?.band?.points;
    const inflection = timeline?.markers?.inflection || null;
    const thresholds = timeline?.markers?.thresholds || null;
    if (!Array.isArray(baselinePoints) || !baselinePoints.length) {
        container.innerHTML = '<div class="r-trajectory-graph-empty">Trajectory graph will appear once the role is scored.</div>';
        renderTrajectoryOutcomeRail([], null);
        if (readout) {
            readout.textContent = 'The graph readout appears once the role is scored.';
        }
        return;
    }

    const roleRestructuring = thresholds?.role_restructuring || null;
    const lastPoint = baselinePoints[baselinePoints.length - 1] || null;
    const structuralScore = trajectory?.structural_necessity?.score;
    const plateauThreshold = Math.max(0.008, Number(inflection?.dp_dt || 0) * 0.18);
    const plateauPoint = baselinePoints.find((point) => Number(point.year) >= Number(inflection?.year || 0) && Number(point.dp_dt || 0) <= plateauThreshold) || null;
    const startPhase = getTrajectoryPhaseForPoint(baselinePoints[0], structuralScore);
    const endPhase = getTrajectoryPhaseForPoint(lastPoint, structuralScore);
    const plateauCopy = plateauPoint
        ? `The curve starts to flatten around year ${plateauPoint.year.toFixed(1)} and settles near ${Math.round((Number(lastPoint?.transformed_share ?? lastPoint?.compression ?? 0) || 0) * 100)}% transformed by year ${Number(lastPoint?.year || 10).toFixed(0)}.`
        : `The curve is still climbing at year ${Number(lastPoint?.year || 10).toFixed(0)}, reaching about ${Math.round((Number(lastPoint?.transformed_share ?? lastPoint?.compression ?? 0) || 0) * 100)}% transformed.`;
    const accessibleSummary = [
        roleRestructuring?.baseline ? `The curve reaches 50% transformed in ${formatTrajectoryBucket(roleRestructuring.baseline)}.` : null,
        inflection ? `Buildout is fastest around year ${Number(inflection.year).toFixed(1)}.` : null,
        startPhase && endPhase ? `The seat starts as ${startPhase.label.toLowerCase()} and trends toward ${endPhase.label.toLowerCase()} by year ${Number(lastPoint?.year || 10).toFixed(0)}.` : null,
        plateauCopy
    ].filter(Boolean).join(' ');

    const canvas = document.createElement('canvas');
    canvas.className = 'r-trajectory-graph-canvas';
    canvas.setAttribute('aria-label', 'Continuous transformed share over time from the live task model, with a conservative-to-aggressive scenario range and threshold crossings.');
    canvas.setAttribute('aria-describedby', 'v2-trajectory-graph-readout');
    container.appendChild(canvas);

    const baselineData = baselinePoints.map((point) => ({
        x: Number(point.year),
        y: Number(point.transformed_share ?? point.compression ?? 0)
    }));
    const upperBandData = Array.isArray(bandPoints) ? bandPoints.map((point) => ({
        x: Number(point.year),
        y: Number(point.upper_transformed_share ?? point.upper_compression ?? 0)
    })) : [];
    const lowerBandData = Array.isArray(bandPoints) ? bandPoints.map((point) => ({
        x: Number(point.year),
        y: Number(point.lower_transformed_share ?? point.lower_compression ?? 0)
    })) : [];

    const thresholdColorByKey = {
        noticeable_change: '#4b9a79',
        role_restructuring: getComputedStyle(document.documentElement).getPropertyValue('--trajectory-baseline').trim() || '#b4642f',
        major_transformation: '#b15b4f'
    };

    const trajectoryOverlayPlugin = {
        id: 'trajectoryOverlay',
        beforeDatasetsDraw(chart) {
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            const area = chart.chartArea;
            const ctx = chart.ctx;

            if (!xScale || !yScale || !area) {
                return;
            }

            ctx.save();
            [0.3, 0.5, 0.7].forEach((value) => {
                const y = yScale.getPixelForValue(value);
                ctx.strokeStyle = 'rgba(105, 98, 85, 0.18)';
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
            const pluginThresholds = chart.options.plugins.trajectoryOverlay?.thresholds || {};
            const pluginInflection = chart.options.plugins.trajectoryOverlay?.inflection || null;
            const pluginPlateau = chart.options.plugins.trajectoryOverlay?.plateau || null;
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            const area = chart.chartArea;
            const ctx = chart.ctx;

            if (!xScale || !yScale || !area) {
                return;
            }

            ctx.save();
            ctx.textBaseline = 'alphabetic';

            Object.keys(pluginThresholds).forEach((thresholdKey) => {
                const threshold = pluginThresholds[thresholdKey];
                if (!threshold) {
                    return;
                }
                const x = xScale.getPixelForValue(Number(threshold.marker_year ?? xScale.max));
                const y = yScale.getPixelForValue(Number(threshold.transformed_share ?? threshold.compression ?? 0));
                const color = thresholdColorByKey[thresholdKey] || '#5c5850';

                ctx.setLineDash([]);
                ctx.lineWidth = 1.8;
                ctx.strokeStyle = color;
                ctx.fillStyle = '#f7f4ed';
                ctx.globalAlpha = threshold.crossed ? 1 : 0.55;

                if (thresholdKey === 'noticeable_change') {
                    ctx.beginPath();
                    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                } else if (thresholdKey === 'role_restructuring') {
                    if (typeof ctx.roundRect === 'function') {
                        ctx.beginPath();
                        ctx.roundRect(x - 5.5, y - 5.5, 11, 11, 2);
                        ctx.fill();
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.rect(x - 5.5, y - 5.5, 11, 11);
                        ctx.fill();
                        ctx.stroke();
                    }
                } else {
                    ctx.beginPath();
                    ctx.moveTo(x, y - 7);
                    ctx.lineTo(x + 7, y);
                    ctx.lineTo(x, y + 7);
                    ctx.lineTo(x - 7, y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            });

            if (pluginInflection) {
                const x = xScale.getPixelForValue(Number(pluginInflection.year));
                const y = yScale.getPixelForValue(Number(pluginInflection.transformed_share ?? pluginInflection.compression ?? 0));
                ctx.globalAlpha = 1;
                ctx.setLineDash([]);
                ctx.fillStyle = '#f7f4ed';
                ctx.strokeStyle = '#5b7f94';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.arc(x, y, 6.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#426574';
                ctx.font = `700 11px ${chartFont}`;
                const preferredX = x + 12;
                const label = 'Fastest buildout';
                const measured = ctx.measureText(label).width;
                const clampedX = Math.min(preferredX, area.right - measured - 4);
                const clampedY = Math.max(area.top + 14, y - 12);
                ctx.fillText(label, clampedX, clampedY);
            }

            if (pluginPlateau && pluginPlateau.point) {
                const x = xScale.getPixelForValue(Number(pluginPlateau.point.year));
                const y = yScale.getPixelForValue(Number(pluginPlateau.point.transformed_share ?? pluginPlateau.point.compression ?? 0));
                const label = pluginPlateau.label || 'Plateau';
                ctx.fillStyle = '#6a6255';
                ctx.font = `600 11px ${chartFont}`;
                ctx.textBaseline = 'middle';
                const textWidth = ctx.measureText(label).width;
                const targetX = Math.min(area.right - textWidth - 8, x + 12);
                const targetY = Math.min(area.bottom - 10, Math.max(area.top + 12, y + 12));
                ctx.fillText(label, targetX, targetY);
            }

            ctx.restore();
        }
    };

    const chartFont = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'Inter, sans-serif';
    const baselineColor = getComputedStyle(document.documentElement).getPropertyValue('--trajectory-baseline').trim() || '#b4642f';
    const fillColor = 'rgba(214, 169, 131, 0.18)';
    const bandColor = 'rgba(170, 188, 176, 0.22)';

    v2TrajectoryChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Scenario upper',
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
                    label: 'Scenario lower',
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
                    label: 'Transformed share',
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
                    displayColors: false,
                    backgroundColor: 'rgba(26, 25, 23, 0.92)',
                    titleColor: '#f7f4ed',
                    bodyColor: '#f7f4ed',
                    padding: 10,
                    callbacks: {
                        title(items) {
                            const point = items && items[0] ? items[0].parsed : null;
                            return point ? `Year ${Number(point.x).toFixed(1)}` : '';
                        },
                        label(context) {
                            const point = context.parsed || {};
                            return `Transformed share: ${Math.round((Number(point.y) || 0) * 100)}%`;
                        },
                        afterLabel(context) {
                            const point = baselinePoints.find((row) => Number(row.year) === Number(context.parsed.x));
                            if (!point) {
                                return '';
                            }
                            const phase = getTrajectoryPhaseForPoint(point, structuralScore);
                            return [
                                `Seat read: ${phase.label}`,
                                `Demand response: ${Math.round((Number(point.demand) || 0) * 100)}%`,
                                `Buildout rate: ${((Number(point.dp_dt) || 0) * 100).toFixed(1)} pts/yr`
                            ];
                        }
                    }
                },
                trajectoryOverlay: {
                    thresholds: thresholds,
                    inflection: inflection,
                    plateau: {
                        point: plateauPoint || lastPoint,
                        label: plateauPoint ? `Plateaus by ~${plateauPoint.year.toFixed(1)}y` : 'Still rising at 10y'
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: Number(timeline?.x_max_years) || 10,
                    grid: {
                        color: 'rgba(105, 98, 85, 0.12)',
                        borderDash: [4, 8]
                    },
                    border: {
                        display: false
                    },
                    afterBuildTicks(scale) {
                        scale.ticks = [0, 1, 2, 3, 5, 7, 10].map((value) => ({ value }));
                    },
                    ticks: {
                        color: 'rgba(105, 98, 85, 0.82)',
                        font: { family: chartFont, size: 11 },
                        callback(value) {
                            return Number(value) === 10 ? '10+' : String(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Years',
                        color: 'rgba(92, 88, 80, 0.9)',
                        font: { family: chartFont, size: 12, weight: '600' }
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    grid: {
                        color: 'rgba(105, 98, 85, 0.12)'
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(105, 98, 85, 0.82)',
                        font: { family: chartFont, size: 11 },
                        callback(value) {
                            return `${Math.round((Number(value) || 0) * 100)}%`;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Transformed share',
                        color: 'rgba(92, 88, 80, 0.9)',
                        font: { family: chartFont, size: 12, weight: '600' }
                    }
                }
            },
            elements: {
                line: {
                    capBezierPoints: true
                }
            }
        },
        plugins: [trajectoryOverlayPlugin]
    });

    if (readout) {
        readout.textContent = accessibleSummary;
    }

    renderTrajectoryOutcomeRail(baselinePoints, structuralScore);
}

function ensureTrajectoryLandscapePlacement() {
    const host = document.getElementById('v2-landscape-host');
    const landscape = document.getElementById('v2-landscape');
    if (host && landscape && landscape.parentElement !== host) {
        host.appendChild(landscape);
    }
}

function renderTrajectorySummary(result) {
    const trajectory = result?.trajectory || null;
    safeSetText('v2-trajectory-headline', trajectory?.headline || result?.role_fate_label || '-');
    safeSetText('v2-trajectory-summary', trajectory?.summary || result?.role_summary || '-');
    safeSetText('v2-trajectory-state', formatTrajectoryStateLabel(trajectory?.state));
    safeSetText('v2-trajectory-role-shape-chip', formatTrajectoryRoleShape(trajectory?.role_shape));
    safeSetText(
        'v2-trajectory-structural-score',
        trajectory?.structural_necessity?.score !== undefined
            ? formatLabeledMetric(trajectory.structural_necessity.score)
            : '-'
    );

    const primaryThreshold = trajectory?.threshold_timing?.role_restructuring || null;
    const primaryThresholdLabel = primaryThreshold ? formatTrajectoryBucket(primaryThreshold.baseline) : null;
    const primaryThresholdCopy = primaryThreshold
        ? `50% transformed · ${primaryThresholdLabel}`
        : '-';
    safeSetText('v2-trajectory-primary-threshold', primaryThresholdCopy);
}

function renderTrajectoryThresholds(result) {
    const container = document.getElementById('v2-trajectory-threshold-grid');
    const copyEl = document.getElementById('v2-trajectory-threshold-copy');
    const trajectory = result?.trajectory || null;
    if (!container) return;
    container.innerHTML = '';

    if (!trajectory?.threshold_timing) {
        if (copyEl) {
            copyEl.textContent = 'Threshold timing will appear once the trajectory layer is available.';
        }
        return;
    }

    const thresholdRows = [
        ['noticeable_change', '~30% transformed', 'Noticeable shift'],
        ['role_restructuring', '~50% transformed', 'Role restructures'],
        ['major_transformation', '~70% transformed', 'Major transformation']
    ];
    if (copyEl) {
        copyEl.textContent = 'The line tracks transformed share. The seat-read rail underneath shows what that buildout means for the role over time.';
    }

    thresholdRows.forEach(([key, title, subtitle]) => {
        const threshold = trajectory.threshold_timing[key];
        const card = document.createElement('div');
        card.className = 'r-trajectory-threshold-card';
        card.innerHTML = `
            <span>${subtitle}</span>
            <strong>${title}</strong>
            <p>${summarizeTrajectoryBucketRange([threshold?.aggressive, threshold?.baseline, threshold?.conservative])}</p>
        `;
        container.appendChild(card);
    });

    const accelerationCard = document.createElement('div');
    accelerationCard.className = 'r-trajectory-threshold-card r-trajectory-threshold-card--accent';
    accelerationCard.innerHTML = `
        <span>Buildout peak</span>
        <strong>Transformation builds fastest</strong>
        <p>${formatTrajectoryBucket(trajectory?.timeline?.markers?.inflection ? (
            trajectory.timeline.markers.inflection.year <= 0.5
                ? 'already_underway'
                : trajectory.timeline.markers.inflection.year <= 3
                    ? 'range_1_3_years'
                    : trajectory.timeline.markers.inflection.year <= 7
                        ? 'range_3_7_years'
                        : 'range_7_plus_years'
        ) : 'range_7_plus_years')}</p>
    `;
    container.appendChild(accelerationCard);
}

function renderTrajectoryScenarios(result) {
    const container = document.getElementById('v2-trajectory-scenario-grid');
    const trajectory = result?.trajectory || null;
    if (!container) return;
    container.innerHTML = '';

    if (!trajectory?.scenarios) {
        return;
    }

    const scenarioMeta = {
        current: { title: 'Year 0', anchor: 'Starting point' },
        next: { title: 'Year 2', anchor: 'Buildout check' },
        distant: { title: 'Year 5', anchor: 'Later state' }
    };
    const structuralSupport = trajectory?.structural_necessity?.score;

    function metricRow(label, value, modifier) {
        const width = `${Math.max(0, Math.min(100, (Number(value) || 0) * 100))}%`;
        return `
            <div class="r-trajectory-scenario-row">
                <span>${label}</span>
                <div class="r-trajectory-scenario-meter">
                    <div class="r-trajectory-scenario-meter-fill ${modifier}" style="width:${width}"></div>
                </div>
                <strong>${Math.round((Number(value) || 0) * 100)}%</strong>
            </div>
        `;
    }

    ['current', 'next', 'distant'].forEach((scenarioKey) => {
        const scenario = trajectory.scenarios[scenarioKey];
        const meta = scenarioMeta[scenarioKey] || { title: formatV2Label(scenarioKey), anchor: '' };
        const card = document.createElement('article');
        card.className = 'r-trajectory-scenario-card';
        card.innerHTML = `
            <div class="r-trajectory-scenario-top">
                <div>
                    <div class="r-section-label">${meta.anchor}</div>
                    <h3>${meta.title}</h3>
                </div>
                <strong class="r-trajectory-scenario-chip">${Math.round((Number(scenario?.compression) || 0) * 100)}% transformed</strong>
            </div>
            <div class="r-trajectory-scenario-metrics">
                ${metricRow('Transformed share', scenario?.compression, 'r-trajectory-scenario-meter-fill--compression')}
                ${metricRow('Demand response', scenario?.demand, 'r-trajectory-scenario-meter-fill--demand')}
                ${metricRow('Structural support', structuralSupport, 'r-trajectory-scenario-meter-fill--viability')}
            </div>
            <details class="r-trajectory-scenario-detail">
                <summary>Interpretation</summary>
                <p>${scenario?.interpretation || '-'}</p>
            </details>
        `;
        container.appendChild(card);
    });
}

function renderTrajectoryDrivers(result) {
    const container = document.getElementById('v2-trajectory-driver-grid');
    const trajectory = result?.trajectory || null;
    if (!container) return;
    container.innerHTML = '';

    const drivers = Array.isArray(trajectory?.drivers) ? trajectory.drivers.slice(0, 3) : [];
    drivers.forEach((driver, index) => {
        const card = document.createElement('article');
        card.className = 'r-analysis-column';
        card.innerHTML = `
            <div class="r-analysis-column-index">${String(index + 1).padStart(2, '0')}</div>
            <h3>${driver.label || formatV2Label(driver.key)}</h3>
            <div class="r-analysis-column-body">
                <p class="r-analysis-column-note">${driver.summary || '-'}</p>
                <div class="r-analysis-column-list">
                    <div class="r-analysis-list-item">Strength: ${formatLabeledMetric(driver.strength)}</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderTrajectoryRoleShape(result) {
    const trajectory = result?.trajectory || null;
    const primaryThreshold = trajectory?.threshold_timing?.role_restructuring || null;
    const roleShapeSummary = primaryThreshold
        ? `Read this as the transformed-share curve reaching 50% in ${formatTrajectoryBucket(primaryThreshold.baseline)}.`
        : (trajectory?.structural_necessity?.explanation || '-');
    safeSetText('v2-trajectory-role-shape-headline', formatTrajectoryRoleShape(trajectory?.role_shape));
    safeSetText('v2-trajectory-role-shape-summary', roleShapeSummary);
    safeSetText(
        'v2-trajectory-role-shape-copy',
        trajectory?.structural_necessity?.explanation || trajectory?.demand_response?.explanation || trajectory?.summary || '-'
    );
    safeSetText(
        'v2-trajectory-role-shape-compression',
        trajectory?.scenarios?.next ? formatPercentWhole(trajectory.scenarios.next.compression) : '-'
    );
    safeSetText(
        'v2-trajectory-role-shape-demand',
        trajectory?.scenarios?.next ? formatPercentWhole(trajectory.scenarios.next.demand) : '-'
    );
    safeSetText(
        'v2-trajectory-role-shape-viability',
        trajectory?.structural_necessity?.score !== undefined ? formatPercentWhole(trajectory.structural_necessity.score) : '-'
    );
}

function renderTrajectoryFunctionContributions(result) {
    const container = document.getElementById('v2-trajectory-function-grid');
    const trajectory = result?.trajectory || null;
    if (!container) return;
    container.innerHTML = '';

    const groups = [
        {
            key: 'holding_core',
            title: 'Holding the seat together',
            note: 'Coordination, accountability, and judgment that still keep the seat necessary.'
        },
        {
            key: 'thinning',
            title: 'Thinning first',
            note: 'Standardizable execution that is more likely to shrink first.'
        },
        {
            key: 'retained_role',
            title: 'Becoming the retained core',
            note: 'The narrower, higher-leverage responsibilities most likely to remain.'
        }
    ];

    groups.forEach((group, index) => {
        const items = Array.isArray(trajectory?.function_contributions?.[group.key])
            ? trajectory.function_contributions[group.key]
            : [];
        const card = document.createElement('article');
        card.className = 'r-analysis-column';
        const listMarkup = items.length
            ? items.map((item) => `<div class="r-analysis-list-item"><strong>${item.label}</strong>${item.summary ? `<span>${item.summary}</span>` : ''}</div>`).join('')
            : '<div class="r-analysis-list-item">No clear anchor surfaced in this group.</div>';
        card.innerHTML = `
            <div class="r-analysis-column-index">${String(index + 1).padStart(2, '0')}</div>
            <h3>${group.title}</h3>
            <div class="r-analysis-column-body">
                <p class="r-analysis-column-note">${group.note}</p>
                <div class="r-analysis-column-list">${listMarkup}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderVerdict(result) {
    const fateLabel = result.role_fate_label || result.role_outlook_label || '-';
    const fateLabelEl = document.getElementById('v2-fate-label');
    if (fateLabelEl) {
        fateLabelEl.innerHTML = '';
        const words = fateLabel.split(/\s+/);
        words.forEach((word, i) => {
            const span = document.createElement('span');
            span.className = 'r-dx-fate-word';
            span.textContent = word + (i < words.length - 1 ? '\u00A0' : '');
            span.style.animationDelay = `${i * 80}ms`;
            fateLabelEl.appendChild(span);
        });
    }
    safeSetText('v2-fate-why', result.narrative_summary?.why_this_role_changes || '-');

    // Verdict meta strip
    const wave = result.primary_displacement_wave || '-';
    const waveConf = result.primary_displacement_wave_confidence_label || '';
    safeSetText('v2-stat-wave', `${formatV2Label(wave)} wave${waveConf ? ' (' + waveConf + ')' : ''}`);
    safeSetText('v2-stat-strength', formatV2Label(result.residual_role_strength));
    safeSetText('v2-stat-confidence', `${Math.round((Number(result.role_fate_confidence) || 0) * 100)}%`);

    // Drivers and counterweights
    const driversEl = document.getElementById('v2-fate-drivers');
    const cwEl = document.getElementById('v2-fate-counterweights');

    if (driversEl) {
        driversEl.innerHTML = '';
        const drivers = (result.fate_drivers || []).slice(0, 2);
        drivers.forEach((d, i) => {
            const chip = document.createElement('span');
            chip.className = 'r-dx-force-chip r-dx-force-chip--driver';
            chip.textContent = formatV2Label(d);
            chip.style.animationDelay = `${900 + i * 60}ms`;
            chip.classList.add('is-animated');
            driversEl.appendChild(chip);
        });
    }

    if (cwEl) {
        cwEl.innerHTML = '';
        const cws = (result.fate_counterweights || []).slice(0, 2);
        cws.forEach((c, i) => {
            const chip = document.createElement('span');
            chip.className = 'r-dx-force-chip r-dx-force-chip--counterweight';
            chip.textContent = formatV2Label(c);
            chip.style.animationDelay = `${900 + i * 60}ms`;
            chip.classList.add('is-animated');
            cwEl.appendChild(chip);
        });
    }

    // Edit delta callout
    const editDelta = result.occupation_assignment?.selected_composition?.edit_delta;
    const editCallout = document.getElementById('v2-edit-delta-callout');
    if (editCallout && editDelta?.role_fate_changed) {
        editCallout.hidden = false;
        editCallout.removeAttribute('aria-hidden');
        safeSetText('v2-edit-delta-text',
            `Your edits shifted the outcome from ${formatV2Label(editDelta.baseline_role_fate_label)} to ${formatV2Label(editDelta.current_role_fate_label)}.`
        );
    } else if (editCallout) {
        editCallout.hidden = true;
        editCallout.setAttribute('aria-hidden', 'true');
    }

    // Analysis basis band
    const tasks = result.task_breakdown?.tasks || [];
    const directEvidenceCount = tasks.filter(t => t.has_direct_evidence).length;
    const evidencePct = tasks.length ? Math.round((directEvidenceCount / tasks.length) * 100) : 0;
    const occupationTitle = result.selected_occupation_title || '';
    const variantLabel = result.occupation_assignment?.selected_composition?.variant_label || '';
    safeSetText('v2-basis-tasks', `${tasks.length} tasks analyzed`);
    safeSetText('v2-basis-evidence', `${evidencePct}% with direct evidence`);
    safeSetText('v2-basis-occupation', variantLabel ? `${occupationTitle} · ${variantLabel}` : occupationTitle);
}

function normalizeStoryboardKey(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function buildStoryboardMetric(label, value, tone = '') {
    const item = document.createElement('div');
    item.className = `r-dx-story-metric${tone ? ` r-dx-story-metric--${tone}` : ''}`;

    const labelNode = document.createElement('span');
    labelNode.textContent = label;

    const valueNode = document.createElement('strong');
    valueNode.textContent = value;

    item.appendChild(labelNode);
    item.appendChild(valueNode);
    return item;
}

function buildStoryboardClusterAggregates(tasks) {
    const map = new Map();
    (Array.isArray(tasks) ? tasks : []).forEach((task) => {
        const label = task?.public_task_cluster_label || task?.task_cluster_label || task?.task_statement || task?.task_id || 'Other work';
        const key = normalizeStoryboardKey(label);
        const share = Math.max(Number(task?.share_of_role) || 0, 0.01);
        const entry = map.get(key) || {
            key,
            label,
            share: 0,
            pressure: 0,
            leverage: 0,
            difficulty: 0,
            evidence: 0,
            taskCount: 0
        };
        entry.share += share;
        entry.pressure += (Number(task?.direct_exposure_pressure) || 0) * share;
        entry.leverage += (Number(task?.retained_leverage) || 0) * share;
        entry.difficulty += (Number(task?.automation_difficulty) || 0) * share;
        entry.evidence += (Number(task?.evidence_confidence) || (task?.has_direct_evidence ? 0.8 : 0.4)) * share;
        entry.taskCount += 1;
        map.set(key, entry);
    });

    map.forEach((entry) => {
        const weight = entry.share || 1;
        entry.pressure = clamp(entry.pressure / weight);
        entry.leverage = clamp(entry.leverage / weight);
        entry.difficulty = clamp(entry.difficulty / weight);
        entry.evidence = clamp(entry.evidence / weight);
    });

    return map;
}

function buildStoryboardNodes(result) {
    const seatMap = result?.seat_change_map || {};
    const clusterAggregates = buildStoryboardClusterAggregates(result?.task_breakdown?.tasks || []);
    const bucketRows = [
        ...buildSeatChangeDisplayRows(seatMap, 'shrinks').slice(0, 2).map((row) => ({ ...row, storyGroup: 'shrink' })),
        ...buildSeatChangeDisplayRows(seatMap, 'stays').slice(0, 3).map((row) => ({ ...row, storyGroup: 'retain' })),
        ...buildSeatChangeDisplayRows(seatMap, 'grows').slice(0, 2).map((row) => ({ ...row, storyGroup: 'grow' }))
    ];

    const fallbackCurrent = (result?.transformation_map?.current_bundle || []).slice(0, 3).map((row) => ({
        label: row.public_label || row.task_cluster_label || 'Current work',
        full_label: row.public_label || row.task_cluster_label || 'Current work',
        storyGroup: 'retain',
        signal_share: Number(row.share_of_role) || 0.1,
        evidence_confidence: 0.5,
        secondary_label: 'Current role bundle'
    }));

    const sourceRows = bucketRows.length ? bucketRows : fallbackCurrent;
    const totalShare = sourceRows.reduce((sum, row) => sum + Math.max(Number(row.signal_share) || Number(row.share_of_role) || 0.05, 0.05), 0) || 1;
    const counts = {
        shrink: sourceRows.filter((row) => row.storyGroup === 'shrink').length || 1,
        retain: sourceRows.filter((row) => row.storyGroup === 'retain').length || 1,
        grow: sourceRows.filter((row) => row.storyGroup === 'grow').length || 1
    };
    const laneOffsets = { shrink: 0, retain: 0, grow: 0 };
    const seatCount = Math.max(sourceRows.length, 1);
    const pressureMinX = 12;
    const pressureMaxX = 58;
    const pressureMinY = 18;
    const pressureMaxY = 64;
    const laneX = { shrink: 18, retain: 41, grow: 64 };
    const laneXRecompose = { shrink: 16, retain: 42, grow: 57 };

    return sourceRows
        .map((row, index) => {
            const label = row.full_label || row.label || 'Work bundle';
            const key = normalizeStoryboardKey(label);
            const aggregate = clusterAggregates.get(key);
            const group = row.storyGroup || 'retain';
            const share = Math.max(Number(row.signal_share) || Number(row.share_of_role) || Number(aggregate?.share) || 0.06, 0.04);
            const pressure = Number.isFinite(Number(aggregate?.pressure))
                ? Number(aggregate.pressure)
                : group === 'shrink' ? 0.76 : (group === 'grow' ? 0.48 : 0.32);
            const leverage = Number.isFinite(Number(aggregate?.leverage))
                ? Number(aggregate.leverage)
                : group === 'retain' ? 0.78 : (group === 'grow' ? 0.62 : 0.34);
            const difficulty = Number.isFinite(Number(aggregate?.difficulty))
                ? Number(aggregate.difficulty)
                : group === 'retain' ? 0.72 : 0.44;
            const evidence = Number.isFinite(Number(aggregate?.evidence))
                ? Number(aggregate.evidence)
                : clamp(Number(row.evidence_confidence) || 0.5);
            const laneIndex = laneOffsets[group];
            laneOffsets[group] += 1;
            const laneCount = counts[group];
            const laneY = 26 + ((laneIndex + 1) / (laneCount + 1)) * 38;
            const seatY = 20 + ((index + 1) / (seatCount + 1)) * 38;
            const seatX = 28 + (group === 'grow' ? 3 : (group === 'shrink' ? -3 : 0));
            const summaryLabel = row.secondary_label || (group === 'shrink'
                ? 'Leaves first'
                : group === 'grow'
                    ? 'Grows inside the seat'
                    : 'Retained human core');

            return {
                id: `${group}-${index}-${key || 'bundle'}`,
                label,
                group,
                share,
                pressure,
                leverage,
                difficulty,
                evidence,
                secondary: summaryLabel,
                confidence: row.confidence_badge || row.confidence_label || '',
                seatX: `${seatX}%`,
                seatY: `${seatY}%`,
                pressureX: `${pressureMinX + clamp(pressure) * (pressureMaxX - pressureMinX)}%`,
                pressureY: `${pressureMaxY - clamp(leverage) * (pressureMaxY - pressureMinY)}%`,
                breakdownX: `${laneX[group]}%`,
                breakdownY: `${laneY}%`,
                recomposeX: `${laneXRecompose[group]}%`,
                recomposeY: `${group === 'shrink' ? laneY + 4 : laneY - 1}%`,
                shareBar: clamp(share / totalShare, 0.14, 1),
                shareLabel: `${Math.round(share * 100)}%`
            };
        })
        .sort((left, right) => right.share - left.share);
}

function getStoryboardNodeForScene(sceneId, nodes, result) {
    if (!nodes.length) return null;
    if (v2StoryboardSelectedNodeId) {
        const selected = nodes.find((node) => node.id === v2StoryboardSelectedNodeId);
        if (selected) return selected;
    }
    if (sceneId === 'pressure') {
        return nodes.slice().sort((left, right) => (right.pressure - right.leverage) - (left.pressure - left.leverage))[0] || nodes[0];
    }
    if (sceneId === 'breakdown') {
        return nodes.find((node) => node.group === 'shrink') || nodes[0];
    }
    if (sceneId === 'recompose') {
        return nodes.find((node) => node.group === 'grow') || nodes.find((node) => node.group === 'retain') || nodes[0];
    }
    if (sceneId === 'timing') {
        const driverLabel = result?.timing_frontier?.cluster_drivers?.[0]?.label;
        if (driverLabel) {
            const matched = nodes.find((node) => normalizeStoryboardKey(node.label) === normalizeStoryboardKey(driverLabel));
            if (matched) return matched;
        }
        return nodes.find((node) => node.group === 'retain') || nodes[0];
    }
    return nodes[0];
}

function buildStoryboardSceneContent(sceneId, result, node) {
    const seatMap = result?.seat_change_map || {};
    const frontier = result?.timing_frontier || {};
    const triggerMap = result?.transition_trigger_map || {};
    const shrinking = `${Math.round((Number(seatMap.shrinking_share_estimate) || 0) * 100)}%`;
    const retained = `${Math.round((Number(seatMap.retained_share_estimate) || 0) * 100)}%`;
    const growing = `${Math.round((Number(seatMap.growing_share_estimate) || 0) * 100)}%`;
    const topShrink = seatMap?.shrinking_bundles?.[0]?.public_label || seatMap?.shrinking_bundles?.[0]?.task_cluster_label || 'Shrinking work';
    const topRetain = seatMap?.retained_bundles?.[0]?.public_label || seatMap?.retained_bundles?.[0]?.task_cluster_label || 'Retained work';
    const topGrow = seatMap?.growing_bundles?.[0]?.public_label || seatMap?.growing_bundles?.[0]?.task_cluster_label || 'Growing work';
    const decisiveTrigger = triggerMap?.triggers?.find((trigger) => trigger.trigger_id === triggerMap.decisive_trigger_id) || triggerMap?.triggers?.[0] || null;
    const primaryWave = formatV2Label(result?.primary_displacement_wave || frontier.primary_displacement_wave || 'distant');
    const bindingConstraint = formatV2Label(frontier.primary_binding_constraint_label || frontier.primary_binding_constraint || 'mixed constraint');
    const occupationTitle = result?.selected_occupation_title || 'This role';

    const baseInspector = node
        ? `${node.label} carries ${Math.round(node.share * 100)}% of the visible story set, with ${Math.round(node.pressure * 100)}% direct pressure and ${Math.round(node.leverage * 100)}% retained leverage.`
        : 'The role story becomes interactive once a scored role is available.';
    const baseMeta = node
        ? [
            ['Bundle', node.label],
            ['Direction', formatV2Label(node.group)],
            ['Direct pressure', `${Math.round(node.pressure * 100)}%`],
            ['Retained leverage', `${Math.round(node.leverage * 100)}%`],
            ['Evidence', `${Math.round(node.evidence * 100)}%`]
        ]
        : [['Role status', 'Waiting for a scored role']];

    if (sceneId === 'pressure') {
        return {
            headline: 'Pressure does not hit the whole seat at once.',
            copy: result?.narrative_summary?.what_is_under_pressure || `The work shifts into a pressure field first. Bundles move right as substitution pressure rises and upward as the work keeps more human leverage.`,
            inspectorKicker: 'Pressure field',
            inspectorTitle: node?.label || 'Pressure arrives unevenly',
            inspectorCopy: node
                ? `${node.label} is one of the clearer early pressure points. The stage uses actual pressure and leverage scores instead of generic categories.`
                : baseInspector,
            inspectorMeta: baseMeta,
            summary: [
                ['Most exposed', topShrink],
                ['Anchored core', topRetain],
                ['Directly exposed share', `${Math.round((Number(result?.exposed_task_share) || 0) * 100)}%`]
            ],
            overlayTitle: 'Pressure scene',
            overlayCopy: 'This scene reuses the pressure-map math, but keeps it inside the main story instead of forcing you into a separate report section.',
            overlayMetrics: [
                ['Pressure', `${Math.round((Number(node?.pressure) || 0) * 100)}%`],
                ['Leverage', `${Math.round((Number(node?.leverage) || 0) * 100)}%`]
            ]
        };
    }

    if (sceneId === 'breakdown') {
        return {
            headline: 'Then the seat breaks into three directions.',
            copy: result?.narrative_summary?.how_the_seat_rebalances || `Some work leaves the seat first, some remains human-owned, and some grows because cheaper execution frees time for higher-leverage work.`,
            inspectorKicker: 'Seat split',
            inspectorTitle: node?.label || 'The seat changes shape',
            inspectorCopy: node
                ? `${node.label} is currently reading as ${formatV2Label(node.group)} work in the new seat composition.`
                : baseInspector,
            inspectorMeta: baseMeta,
            summary: [
                ['Shrinking', shrinking],
                ['Retained', retained],
                ['Growing', growing]
            ],
            overlayTitle: 'Seat split',
            overlayCopy: `${topShrink} leaves first. ${topRetain} still anchors the retained role, and ${topGrow} is the main growth lane.`,
            overlayMetrics: [
                ['Leaves first', topShrink],
                ['Net effect', seatMap?.net_seat_effect_label || '-']
            ]
        };
    }

    if (sceneId === 'recompose') {
        return {
            headline: 'What remains does not stay static. It recomposes.',
            copy: result?.narrative_summary?.how_the_work_rebundles || `The retained version of the role gets denser around the bundles that still own judgment, coordination, trust, or outcome responsibility.`,
            inspectorKicker: 'Retained role',
            inspectorTitle: node?.label || topRetain,
            inspectorCopy: node
                ? `${node.label} is part of the work that becomes more central once thinner execution work is removed.`
                : baseInspector,
            inspectorMeta: baseMeta,
            summary: [
                ['Main retained bundle', topRetain],
                ['Main growth lane', topGrow],
                ['Residual strength', formatV2Label(result?.residual_role_strength)]
            ],
            overlayTitle: 'Role after recomposition',
            overlayCopy: `The surviving seat is less about raw execution volume and more about the bundles that still justify human ownership.`,
            overlayMetrics: [
                ['Retained core', topRetain],
                ['Growth lane', topGrow]
            ]
        };
    }

    if (sceneId === 'timing') {
        return {
            headline: `${primaryWave} wave is the first structural crossing.`,
            copy: result?.narrative_summary?.when_the_role_turns || `The visual split is not the same as immediate labor change. Timing still waits on the frontier and the decisive trigger.`,
            inspectorKicker: 'Timing frontier',
            inspectorTitle: decisiveTrigger?.trigger_label || 'Decisive trigger',
            inspectorCopy: decisiveTrigger
                ? `${formatV2Label(decisiveTrigger.trigger_label)} is the main threshold deciding when this role turns from pressure into actual seat change.`
                : `The main blocker right now is ${bindingConstraint.toLowerCase()}.`,
            inspectorMeta: [
                ['Primary wave', `${primaryWave} wave`],
                ['Binding constraint', bindingConstraint],
                ['Decisive trigger', formatV2Label(decisiveTrigger?.trigger_label || 'mixed trigger')],
                ['Current activation', formatPercentWhole(frontier?.scenario_activation?.current)],
                ['Adoption ceiling', formatPercentWhole(frontier?.scenario_activation?.ceiling)]
            ],
            summary: [
                ['Wave', `${primaryWave} wave`],
                ['Constraint', bindingConstraint],
                ['Decisive trigger', formatV2Label(decisiveTrigger?.trigger_label || 'mixed trigger')]
            ],
            overlayTitle: 'Timing overlay',
            overlayCopy: `Scenario activation rises from ${formatPercentWhole(frontier?.scenario_activation?.current)} now to ${formatPercentWhole(frontier?.scenario_activation?.next)} in the next wave. The current blocker is ${bindingConstraint.toLowerCase()}.`,
            overlayMetrics: [
                ['Current', formatPercentWhole(frontier?.scenario_activation?.current)],
                ['Next', formatPercentWhole(frontier?.scenario_activation?.next)],
                ['Distant', formatPercentWhole(frontier?.scenario_activation?.distant)],
                ['Ceiling', formatPercentWhole(frontier?.scenario_activation?.ceiling)]
            ]
        };
    }

    return {
        headline: `${occupationTitle} still holds together as one seat.`,
        copy: result?.narrative_summary?.why_this_role_changes || result?.role_summary || `The story starts with the full role before pressure, separation, and recomposition are shown.`,
        inspectorKicker: 'Role today',
        inspectorTitle: node?.label || 'Visible work bundles',
        inspectorCopy: node ? `${node.label} is one of the bundles currently helping the seat hold together before it splits.` : baseInspector,
        inspectorMeta: baseMeta,
        summary: [
            ['Tasks analyzed', `${(result?.task_breakdown?.tasks || []).length}`],
            ['Direct evidence', `${Math.round((((result?.task_breakdown?.tasks || []).filter((task) => task.has_direct_evidence).length) / Math.max((result?.task_breakdown?.tasks || []).length, 1)) * 100)}%`],
            ['Current core', topRetain]
        ],
        overlayTitle: 'Role today',
        overlayCopy: 'The same bundles you see here will move across every later scene. Nothing new gets invented just for the animation.',
        overlayMetrics: [
            ['Shrinking', shrinking],
            ['Retained', retained],
            ['Growing', growing]
        ]
    };
}

function renderRoleStoryboard(result) {
    const container = document.getElementById('v2-bundle-strip');
    const summary = document.getElementById('v2-story-summary');

    if (container) container.innerHTML = '';
    if (summary) summary.innerHTML = '';

    if (!result || !container) return;

    const nodes = buildStoryboardNodes(result);
    const groups = [
        { id: 'shrink', label: 'Leaves the seat' },
        { id: 'retain', label: 'Retained core' },
        { id: 'grow',   label: 'Grows inside the seat' }
    ];

    groups.forEach(function({ id, label }) {
        const groupNodes = nodes.filter(function(n) { return n.group === id; });
        if (!groupNodes.length) return;

        const section = document.createElement('div');
        section.className = 'r-dx-bundle-group r-dx-bundle-group--' + id;

        const header = document.createElement('div');
        header.className = 'r-dx-bundle-group-header';
        const labelEl = document.createElement('span');
        labelEl.className = 'r-dx-bundle-group-label';
        labelEl.textContent = label;
        header.appendChild(labelEl);
        section.appendChild(header);

        groupNodes.forEach(function(node) {
            const row = document.createElement('div');
            row.className = 'r-dx-bundle-row';

            const name = document.createElement('span');
            name.className = 'r-dx-bundle-row-name';
            name.textContent = node.label;

            const share = document.createElement('span');
            share.className = 'r-dx-bundle-row-share';
            share.textContent = node.shareLabel + ' of role';

            const bar = document.createElement('div');
            bar.className = 'r-dx-bundle-row-bar';
            const fill = document.createElement('div');
            fill.className = 'r-dx-bundle-row-bar-fill';
            fill.style.setProperty('--bar-width', String(node.shareBar));
            bar.appendChild(fill);

            const reason = document.createElement('p');
            reason.className = 'r-dx-bundle-row-reason';
            reason.textContent = node.secondary;

            row.appendChild(name);
            row.appendChild(share);
            row.appendChild(bar);
            row.appendChild(reason);
            section.appendChild(row);
        });

        container.appendChild(section);
    });

    // Populate summary strip with key metrics
    if (summary) {
        const seatMap = result.seat_change_map || {};
        const frontier = result.timing_frontier || {};
        var metrics = [
            ['Shrinking', Math.round((Number(seatMap.shrinking_share_estimate) || 0) * 100) + '% of role'],
            ['Retained', Math.round((Number(seatMap.retained_share_estimate) || 0) * 100) + '% of role']
        ];
        if (frontier.current_readiness_label) {
            metrics.push(['Frontier readiness', formatV2Label(frontier.current_readiness_label)]);
        }
        metrics.forEach(function([label, value], i) {
            summary.appendChild(buildStoryboardMetric(label, value, i === 0 ? 'accent' : ''));
        });
    }
}


function renderSeatShift(result) {
    const seatMap = result.seat_change_map || {};
    const currentBundle = result.transformation_map?.current_bundle || [];

    // Seat share percentages (animated counter)
    const shrinkPct = Math.round((Number(seatMap.shrinking_share_estimate) || 0) * 100);
    const retainPct = Math.round((Number(seatMap.retained_share_estimate) || 0) * 100);
    const growPct = Math.round((Number(seatMap.growing_share_estimate) || 0) * 100);

    animateCounter('v2-seat-pct-shrink', shrinkPct, '%');
    animateCounter('v2-seat-pct-retain', retainPct, '%');
    animateCounter('v2-seat-pct-grow', growPct, '%');

    safeSetText('v2-seat-shift-summary', result.narrative_summary?.how_the_seat_rebalances || '-');
    safeSetText('v2-seat-rebalance-text', result.narrative_summary?.how_the_work_rebundles || result.task_accession_map?.net_role_rebundle_summary || '-');

    // Build "today" stacked bar from current bundle
    const barToday = document.getElementById('v2-bar-today');
    const barAfter = document.getElementById('v2-bar-after');

    if (barToday) {
        barToday.innerHTML = '';
        currentBundle.forEach(b => {
            const seg = document.createElement('div');
            seg.className = 'r-dx-bar-segment r-dx-bar-segment--retain';
            seg.style.flexBasis = `${(Number(b.share_of_role) || 0) * 100}%`;
            seg.title = b.public_label || b.task_cluster_label || '';
            barToday.appendChild(seg);
        });
    }

    // Build "after" bar from seat_change_map
    if (barAfter) {
        barAfter.innerHTML = '';
        const shrinks = seatMap.shrinking_bundles || [];
        const stays = seatMap.retained_bundles || [];
        const grows = seatMap.growing_bundles || [];

        const allBundles = [
            ...shrinks.map(b => ({ ...b, fate: 'shrink' })),
            ...stays.map(b => ({ ...b, fate: 'retain' })),
            ...grows.map(b => ({ ...b, fate: 'grow' }))
        ];

        allBundles.forEach(b => {
            const share = Number(b.share_of_role) || Number(b.shrink_score) || Number(b.accession_score) || 0.05;
            const seg = document.createElement('div');
            seg.className = `r-dx-bar-segment r-dx-bar-segment--${b.fate}`;
            seg.style.flexBasis = `${share * 100}%`;
            seg.title = b.public_label || b.task_cluster_label || '';
            barAfter.appendChild(seg);
        });
    }

    // Bundle lists (today = top 3, after = top 3 notable)
    renderBundleList('v2-bundles-today', currentBundle.slice(0, 3), 'retain');
    const afterBundles = [
        ...(seatMap.shrinking_bundles || []).slice(0, 1).map(b => ({ ...b, fate: 'shrink' })),
        ...(seatMap.retained_bundles || []).slice(0, 1).map(b => ({ ...b, fate: 'retain' })),
        ...(seatMap.growing_bundles || []).slice(0, 1).map(b => ({ ...b, fate: 'grow' }))
    ];
    renderBundleList('v2-bundles-after', afterBundles, null);
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
    wave: {
        key: 'wave_assignment',
        colors: {
            current: 'rgba(28, 27, 24, 0.78)',
            next: 'oklch(0.62 0.10 85 / 0.75)',
            distant: 'oklch(0.55 0.09 145 / 0.65)'
        },
        labels: { current: 'Current wave', next: 'Next wave', distant: 'Distant wave' }
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
        title: 'High pressure, low leverage',
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
        title: 'Low pressure, high leverage',
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
        title: 'High pressure, high leverage',
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
        title: 'Low pressure, low leverage',
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
        copy.textContent = 'The map stays quiet until you reach it. Then the role reveals itself one quadrant at a time, starting with the tasks most exposed to pressure.';
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

function _pmapDescribeTaskPosition(task, xKey, yKey, xMeta, yMeta, medians) {
    var xVal = Number(task[xKey]) || 0;
    var yVal = Number(task[yKey]) || 0;
    var xHigh = xVal >= medians.x;
    var yHigh = yVal >= medians.y;
    var xPhrase = xHigh ? 'high ' + xMeta.shortLabel : 'lower ' + xMeta.shortLabel;
    var yPhrase = yHigh ? 'high ' + yMeta.shortLabel : 'lower ' + yMeta.shortLabel;
    return 'This task sits at ' + xPhrase + ' and ' + yPhrase + ' relative to the rest of the role.';
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

function _pmapLegendTone(task, scheme, activeTaskId) {
    var taskId = _pmapTaskKey(task, -1);
    if (activeTaskId && taskId === activeTaskId) return 'active';
    if (!_pmapTaskMatchesFilter(task, scheme)) return 'filtered';
    return 'normal';
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
    var scheme = PMAP_COLOR_SCHEMES[colorSelect && colorSelect.value ? colorSelect.value : 'wave'] || PMAP_COLOR_SCHEMES.wave;
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
            statusParts.push('Revealing ' + explainerStage.title.toLowerCase());
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
        status.textContent = statusParts.join(' · ') + '. Hover a bubble for task detail and use the steps on the right to revisit each quadrant.';
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
    var scheme = PMAP_COLOR_SCHEMES[colorSelect && colorSelect.value ? colorSelect.value : 'wave'] || PMAP_COLOR_SCHEMES.wave;
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
        status.textContent = 'Hover a bubble to inspect it and use the steps on the right to revisit each quadrant.';
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

function renderFrictionBars(result) {
    const container = document.getElementById('v2-friction-bars');
    if (!container) return;
    container.innerHTML = '';

    const friction = result.evidence_summary?.friction_dimensions || {};
    const dimensions = [
        { key: 'tacit_context', label: 'Tacit knowledge' },
        { key: 'judgment_complexity', label: 'Judgment complexity' },
        { key: 'accountability_weight', label: 'Accountability' },
        { key: 'exception_burden', label: 'Exception burden' },
        { key: 'document_intensity', label: 'Document intensity' }
    ];

    const total = dimensions.reduce((sum, d) => sum + (Number(friction[d.key + '_weight']) || 0.2), 0);

    dimensions.forEach((dim, i) => {
        const value = Number(friction[dim.key]) || 0;
        const weight = Number(friction[dim.key + '_weight']) || 0.2;
        const weightPct = Math.round((weight / total) * 100);

        const row = document.createElement('div');
        row.className = 'r-dx-friction-row';

        const label = document.createElement('span');
        label.className = 'r-dx-friction-label';
        label.innerHTML = `${dim.label} <span class="r-dx-friction-label-weight">(${weightPct}%)</span>`;

        const track = document.createElement('div');
        track.className = 'r-dx-friction-track';
        const fill = document.createElement('div');
        fill.className = 'r-dx-friction-fill';
        fill.style.width = '0';
        track.appendChild(fill);

        const valSpan = document.createElement('span');
        valSpan.className = 'r-dx-friction-value';
        valSpan.textContent = `${Math.round(value * 100)}%`;

        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(valSpan);
        container.appendChild(row);

        // Animate
        requestAnimationFrame(() => {
            fill.classList.add('is-animated');
            fill.style.transitionDelay = `${i * 60}ms`;
            fill.style.width = `${value * 100}%`;
        });
    });
}

function renderTaskTable(result) {
    const container = document.getElementById('v2-task-breakdown');
    const toggleBtn = document.getElementById('v2-task-toggle');
    const tableWrap = document.getElementById('v2-task-table-wrap');
    if (!container) return;
    container.innerHTML = '';

    const tasks = result?.task_breakdown?.tasks || [];
    safeSetText('v2-task-total', String(tasks.length));
    safeSetText('v2-task-direct', String(tasks.filter(t => t.has_direct_evidence).length));

    // Header row
    const header = document.createElement('div');
    header.className = 'r-dx-task-row r-dx-task-row--header';
    ['Task', 'Share', 'Pressure', 'Leverage', 'Evidence', 'Wave'].forEach(col => {
        const cell = document.createElement('div');
        cell.className = 'r-dx-task-cell';
        cell.textContent = col;
        header.appendChild(cell);
    });
    container.appendChild(header);

    tasks.forEach(t => {
        const row = document.createElement('div');
        row.className = 'r-dx-task-row';

        const statement = document.createElement('div');
        statement.className = 'r-dx-task-cell r-dx-task-cell--statement';
        statement.textContent = t.task_statement || '-';

        const share = document.createElement('div');
        share.className = 'r-dx-task-cell';
        share.textContent = `${Math.round((Number(t.share_of_role) || 0) * 100)}%`;

        const pressure = document.createElement('div');
        pressure.className = 'r-dx-task-cell';
        pressure.textContent = `${Math.round((Number(t.direct_exposure_pressure) || 0) * 100)}%`;

        const leverage = document.createElement('div');
        leverage.className = 'r-dx-task-cell';
        leverage.textContent = `${Math.round((Number(t.retained_leverage) || 0) * 100)}%`;

        const evidence = document.createElement('div');
        evidence.className = 'r-dx-task-cell';
        const evChip = document.createElement('span');
        evChip.className = 'r-dx-task-chip';
        evChip.textContent = t.evidence_tier || t.evidence_source || '-';
        evidence.appendChild(evChip);

        const wave = document.createElement('div');
        wave.className = 'r-dx-task-cell';
        const waveChip = document.createElement('span');
        waveChip.className = 'r-dx-task-chip';
        waveChip.textContent = formatV2Label(t.wave_assignment || '-');
        wave.appendChild(waveChip);

        row.appendChild(statement);
        row.appendChild(share);
        row.appendChild(pressure);
        row.appendChild(leverage);
        row.appendChild(evidence);
        row.appendChild(wave);
        container.appendChild(row);
    });

    // Toggle button
    if (toggleBtn && tableWrap) {
        toggleBtn.hidden = false;
        toggleBtn.onclick = () => {
            const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', String(!isOpen));
            tableWrap.hidden = isOpen;
            toggleBtn.textContent = isOpen ? 'See all tasks' : 'Hide tasks';
        };
    }
}

function renderWaveTimeline(result) {
    const wt = result.wave_trajectory || {};
    const primary = result.primary_displacement_wave || 'distant';

    ['current', 'next', 'distant'].forEach((waveName, i) => {
        const ws = wt[waveName];
        const stop = document.getElementById('v2-wave-' + waveName);
        if (!ws || !stop) return;

        if (waveName === primary) {
            stop.classList.add('r-dx-wave-stop--primary');
        }

        safeSetText('v2-wave-' + waveName + '-state', ws.state_label || formatV2Label(ws.state));
        safeSetText('v2-wave-' + waveName + '-retained', `${Math.round((ws.retained_share || 0) * 100)}% retained`);
        safeSetText('v2-wave-' + waveName + '-coherence', formatWaveCoherencePlain(ws.coherence_tier));

        stop.style.animationDelay = `${i * 200}ms`;
        stop.classList.add('is-animated');
    });
}

function describeFrontierStep(currentMargin, nextMargin, crossingWave) {
    const current = Number(currentMargin);
    const next = Number(nextMargin);

    if (crossingWave === 'current' && Number.isFinite(current)) {
        return `Already clears the current hurdle by ${formatFrontierMargin(current)}.`;
    }
    if (crossingWave === 'next' && Number.isFinite(current) && Number.isFinite(next)) {
        return `Misses current by ${formatFrontierMargin(Math.abs(current))}, but clears next by ${formatFrontierMargin(next)}.`;
    }
    if (crossingWave === 'distant' && Number.isFinite(next)) {
        return `Still misses the next hurdle by ${formatFrontierMargin(Math.abs(next))}, so this waits on a later scenario.`;
    }
    return 'The frontier margin is still unresolved.';
}

function buildFrontierMetricCard(label, value, description, tone = '') {
    const card = document.createElement('article');
    card.className = `r-dx-frontier-metric${tone ? ` r-dx-frontier-metric--${tone}` : ''}`;

    const labelNode = document.createElement('span');
    labelNode.className = 'r-dx-frontier-metric-label';
    labelNode.textContent = label;

    const valueNode = document.createElement('strong');
    valueNode.className = 'r-dx-frontier-metric-value';
    valueNode.textContent = formatLabeledMetric(value);

    const descNode = document.createElement('p');
    descNode.className = 'r-dx-frontier-metric-copy';
    descNode.textContent = description;

    card.appendChild(labelNode);
    card.appendChild(valueNode);
    card.appendChild(descNode);
    return card;
}

function renderTimingFrontier(result) {
    const frontier = result?.timing_frontier || {};
    const metricsContainer = document.getElementById('v2-frontier-metrics');
    const driverContainer = document.getElementById('v2-frontier-driver-list');
    if (!metricsContainer || !driverContainer) {
        return;
    }

    metricsContainer.innerHTML = '';
    driverContainer.innerHTML = '';

    const scenarioActivation = frontier.scenario_activation || {};
    const primaryWave = frontier.primary_displacement_wave || result?.primary_displacement_wave || 'distant';
    const primaryConstraint = frontier.primary_binding_constraint_label || frontier.primary_binding_constraint || 'Mixed constraint';
    const currentActivation = Number(scenarioActivation.current);
    const nextActivation = Number(scenarioActivation.next);
    const distantActivation = Number(scenarioActivation.distant);
    const ceiling = Number(scenarioActivation.ceiling);

    safeSetText('v2-frontier-headline', `${formatV2Label(primaryWave)} wave is the first structural crossing`);
    safeSetText(
        'v2-frontier-summary',
        `The current blocker is ${String(primaryConstraint).toLowerCase()}. Activation runs ${formatPercentWhole(currentActivation)} now, ${formatPercentWhole(nextActivation)} next, and ${formatPercentWhole(distantActivation)} distant, with a ceiling near ${formatPercentWhole(ceiling)}.`
    );
    safeSetText('v2-frontier-constraint', formatV2Label(primaryConstraint));
    safeSetText('v2-frontier-current-activation', formatPercentWhole(currentActivation));
    safeSetText('v2-frontier-next-activation', formatPercentWhole(nextActivation));
    safeSetText('v2-frontier-distant-activation', formatPercentWhole(distantActivation));
    safeSetText('v2-frontier-ceiling', formatPercentWhole(ceiling));
    safeSetText(
        'v2-frontier-driver-copy',
        'These bundles explain the current blocker and the next structural crossing.'
    );

    [
        buildFrontierMetricCard(
            'Capability readiness',
            frontier.capability_readiness,
            'How much of the work is technically reachable with today’s evidence and task structure.'
        ),
        buildFrontierMetricCard(
            'Supervision readiness',
            frontier.supervision_readiness,
            'How reviewable and delegable the work becomes once a human stays in the loop.',
            'accent'
        ),
        buildFrontierMetricCard(
            'Economic pressure',
            frontier.economic_pressure,
            'How much wage context, role share, and direct pressure push organizations to convert capability into change.'
        ),
        buildFrontierMetricCard(
            'Organizational friction',
            frontier.organizational_friction,
            'How much retained judgment, dependency, and human ownership still slow the seat from crossing sooner.',
            'warning'
        )
    ].forEach((card) => metricsContainer.appendChild(card));

    const clusterDrivers = Array.isArray(frontier.cluster_drivers) ? frontier.cluster_drivers.slice(0, 3) : [];
    if (!clusterDrivers.length) {
        const empty = document.createElement('div');
        empty.className = 'r-dx-frontier-driver-empty';
        empty.textContent = 'Bundle-level timing drivers appear once the role is scored.';
        driverContainer.appendChild(empty);
        return;
    }

    clusterDrivers.forEach((driver) => {
        const card = document.createElement('article');
        card.className = 'r-dx-frontier-driver-card';

        const header = document.createElement('div');
        header.className = 'r-dx-frontier-driver-header';

        const title = document.createElement('h4');
        title.className = 'r-dx-frontier-driver-title';
        title.textContent = driver.label || 'Unnamed bundle';

        const chips = document.createElement('div');
        chips.className = 'r-dx-frontier-driver-chips';
        chips.appendChild(createV2TaskChip(`${formatV2Label(driver.crossing_wave || 'distant')} wave`, 'accent'));
        if (driver.binding_constraint_label || driver.binding_constraint) {
            chips.appendChild(createV2TaskChip(driver.binding_constraint_label || formatV2Label(driver.binding_constraint), 'warning'));
        }

        header.appendChild(title);
        header.appendChild(chips);

        const marginRow = document.createElement('div');
        marginRow.className = 'r-dx-frontier-driver-margins';
        marginRow.innerHTML = `
            <span>Current <strong>${formatFrontierMargin(driver.current_margin)}</strong></span>
            <span>Next <strong>${formatFrontierMargin(driver.next_margin)}</strong></span>
        `;

        const copy = document.createElement('p');
        copy.className = 'r-dx-frontier-driver-copy';
        copy.textContent = describeFrontierStep(driver.current_margin, driver.next_margin, driver.crossing_wave);

        card.appendChild(header);
        card.appendChild(marginRow);
        card.appendChild(copy);
        driverContainer.appendChild(card);
    });
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
                <span>${formatV2Label(trigger.crossing_wave || triggerFrontier.crossing_wave || 'distant')} wave crossing</span>
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

function renderDepthTabs() {
    const tabBar = document.querySelector('.r-dx-tab-bar');
    if (!tabBar) return;

    tabBar.addEventListener('click', (e) => {
        const tab = e.target.closest('.r-dx-tab');
        if (!tab) return;

        tabBar.querySelectorAll('.r-dx-tab').forEach(t => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');

        const panelId = tab.getAttribute('aria-controls');
        document.querySelectorAll('.r-dx-tab-panel').forEach(p => {
            p.hidden = p.id !== panelId;
        });
    });
}

function renderLandscapeStat(result) {
    const statEl = document.getElementById('v2-landscape-stat');
    if (!statEl || !window.occupationMapGetAllResults) return;

    const allResults = window.occupationMapGetAllResults();
    if (!allResults || !allResults.length) return;

    const pressureValues = allResults
        .map((entry) => Number(entry?.metrics?.direct_exposure_pressure))
        .filter((value) => Number.isFinite(value))
        .sort((left, right) => left - right);
    const leverageValues = allResults
        .map((entry) => Number(entry?.metrics?.retained_bargaining_power))
        .filter((value) => Number.isFinite(value))
        .sort((left, right) => left - right);
    if (!pressureValues.length || !leverageValues.length) return;

    const userPressure = Number(result?.direct_exposure_pressure);
    const userLeverage = Number(result?.retained_bargaining_power);
    const pressureMedian = pressureValues[Math.floor(pressureValues.length / 2)];
    const leverageMedian = leverageValues[Math.floor(leverageValues.length / 2)];
    const pressureBand = Number.isFinite(userPressure) && userPressure >= pressureMedian + 0.08
        ? 'high-pressure'
        : Number.isFinite(userPressure) && userPressure <= pressureMedian - 0.08
            ? 'lower-pressure'
            : 'mid-pressure';
    const leverageBand = Number.isFinite(userLeverage) && userLeverage >= leverageMedian + 0.08
        ? 'higher-leverage'
        : Number.isFinite(userLeverage) && userLeverage <= leverageMedian - 0.08
            ? 'lower-leverage'
            : 'mid-leverage';
    const implication = result?.trajectory?.state === 'transforming'
        ? 'Execution can thin without fully dissolving the seat.'
        : result?.trajectory?.state === 'compressing'
            ? 'Execution is likely to leave faster than demand can offset it.'
            : result?.trajectory?.state === 'collapsing'
                ? 'The retained core stays weak relative to the pressure.'
                : 'The seat still has enough core strength to hold or adapt.';

    statEl.textContent = `This role sits in a ${pressureBand}, ${leverageBand} cluster. ${implication}`;
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
    safeSetText('v2-role-build-copy', 'Rebuilding the task layer from the mapped occupation and reviewed role data now.');
    safeSetText('v2-role-build-note', 'The model is resolving the current role mix before pressure and retained human core are rendered.');
    if (!hasPriorResult) {
        safeSetText('v2-state-headline', 'Resolving the structural state read now.');
        safeSetText('v2-state-summary', 'Rebuilding dimensionality, bottleneck fragility, demand offset, and automation incentive on top of the live task model.');
        safeSetText('v2-state-current', '-');
        safeSetText('v2-state-next', '-');
        safeSetText('v2-state-dimensionality', '-');
        safeSetText('v2-state-bottleneck', '-');
        safeSetText('v2-state-transition-headline', '-');
        safeSetText('v2-state-transition-copy', '-');
        syncStateTrajectoryControls();
        safeSetText('v2-trajectory-headline', 'Resolving the trajectory read now.');
        safeSetText('v2-trajectory-summary', 'Rebuilding compression, demand response, structural necessity, and role viability across scenarios.');
        safeSetText('v2-trajectory-state', '-');
        safeSetText('v2-trajectory-role-shape-chip', '-');
        safeSetText('v2-trajectory-structural-score', '-');
        safeSetText('v2-trajectory-primary-threshold', '-');
        safeSetText('v2-trajectory-threshold-copy', 'Threshold timing is shown as ranges only, not point forecasts.');
        safeSetText('v2-trajectory-role-shape-summary', '-');
        safeSetText('v2-trajectory-role-shape-headline', '-');
        safeSetText('v2-trajectory-role-shape-copy', '-');
        safeSetText('v2-trajectory-role-shape-compression', '-');
        safeSetText('v2-trajectory-role-shape-demand', '-');
        safeSetText('v2-trajectory-role-shape-viability', '-');
        safeSetText('v2-current-role-copy', 'Rebuilding the current task mix for this occupation.');
        safeSetText('v2-function-build-copy', 'Rebuilding the purpose layer from the active task mix.');
        safeSetText('v2-function-why-copy', 'The model is regrouping tasks into the durable role purposes that explain why the seat exists.');
        safeSetText('v2-function-origin-copy', 'Task sources and reviewed anchors are being merged into the current role recipe.');
        safeSetText('v2-function-map-copy', 'Task-to-function links are being resolved for the current role.');
        safeSetText('v2-task-layer-copy', 'Rebuilding task share, support links, and function roll-up now.');
        safeSetText('v2-task-layer-note', 'The task walkthrough will appear once the rebuilt role is scored.');
        safeSetText('v2-map-subtitle', 'Rebuilding direct pressure and spillover from the current role mix.');
        safeSetText('v2-what-absorbed', 'Resolving the first pressure points in the role.');
        safeSetText('v2-what-remains', 'Resolving the human-retained core of the role.');
        safeSetText('v2-what-changing', 'Rebuilding the role outcome now.');
        safeSetText('v2-rebundle-summary', 'Resolving which work bundles shrink first and which ones grow as the role rebundles.');
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
        safeSetText('v2-seat-summary', 'Resolving which work leaves the seat, which work remains human-owned, and which work grows into the retained version.');
        safeSetText('v2-seat-effect', 'Resolving the net seat effect now.');
        safeSetText('v2-role-summary', 'Rebuilding the current analysis from your selected occupation and role settings.');
        safeSetText('v2-outlook-summary-copy', 'Rebuilding the current analysis from your selected occupation and role settings.');
        safeSetText('v2-explanation-copy', 'Rebuilding the explanation layer now.');
        safeSetText('v2-evidence-notes', 'Recomputing evidence strength, fallback usage, and personalization signal.');
        safeSetText('v2-assignment-copy', 'Refreshing the occupation assignment and selected role composition.');
        safeSetText('v2-task-summary-copy', 'Rebuilding the live task inventory and role-fate breakdown.');
        safeSetText('v2-audit-copy', 'Refreshing the live audit trace.');
        renderV2ClusterList('v2-current-bundle', [], { emptyText: 'Loading current role mix...' });
        renderV2ClusterList('v2-bargaining-bundle', [], { emptyText: 'Loading bargaining-power tasks...' });
        renderV2ClusterList('v2-direct-bundle', [], { emptyText: 'Loading direct-pressure tasks...' });
        renderV2ClusterList('v2-indirect-bundle', [], { emptyText: 'Loading spillover tasks...' });
        renderV2ClusterList('v2-residual-bundle', [], { emptyText: 'Loading retained-human tasks...' });
        renderV2ClusterList('v2-shrinking-bundle', [], { emptyText: 'Loading shrinking work bundles...' });
        renderV2ClusterList('v2-accession-bundle', [], { emptyText: 'Loading growing work bundles...' });
        renderV2ClusterList('v2-seat-shrinks', [], { emptyText: 'Loading the shrinking part of the seat...' });
        renderV2ClusterList('v2-seat-stays', [], { emptyText: 'Loading the retained human core...' });
        renderV2ClusterList('v2-seat-grows', [], { emptyText: 'Loading the growing part of the retained seat...' });
        renderV2TransitionTriggers(null);
        renderV2TaskStory(null);
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
    v2StoryboardScene = 'seat';
    v2StoryboardSelectedNodeId = null;
    safeSetText('v2-role-build-copy', 'Once the purpose layer is set, I rebuild the tasks underneath it from baseline occupation tasks, reviewed public postings, and reviewed role additions.');
    safeSetText('v2-source-onet', '-');
    safeSetText('v2-source-postings', '-');
    safeSetText('v2-source-review', '-');
    safeSetText('v2-source-functions', '-');
    safeSetText('v2-role-build-anchor', '-');
    safeSetText('v2-role-build-variant', '-');
    safeSetText('v2-role-build-note', 'The role recipe will appear here once the model has a mapped occupation to score.');
    safeSetText('v2-current-role-copy', 'This is the current task mix the model believes it is scoring.');
    safeSetText('v2-function-build-copy', 'I start with the purpose layer: what this seat is meant to do even if the day-to-day tasks change.');
    safeSetText('v2-function-why-copy', 'Functions matter because job loss does not happen task by task. It happens when exposed tasks stop being the main reason the seat exists.');
    safeSetText('v2-function-origin-copy', 'I cultivate these functions by starting with the occupation baseline, adding reviewed tasks from public postings and role review, then grouping that work into a smaller set of durable role purposes.');
    safeSetText('v2-function-map-copy', 'Each selected task maps into one or more functions. The strongest links tell me whether the role mainly exists to execute, coordinate, approve, translate, sell, or own outcomes.');
    safeSetText('v2-task-layer-copy', 'Each task keeps a share of the role. Support links let pressure travel through connected work. Then those task signals roll back up into the function layer.');
    safeSetText('v2-task-layer-note', 'The cards below show the work mix one task at a time: where it came from, which function it supports, and whether the score is driven by direct evidence or fallback structure.');
    safeSetText('v2-pressure-secondary-copy', 'These tasks often lose value because the workflow around them compresses first.');
    safeSetText('v2-state-headline', message || 'Select a role to begin');
    safeSetText('v2-state-summary', detail || 'The structural state layer will show dimensionality, bottleneck risk, retained-core lift, and automation incentive once the role is scored.');
    safeSetText('v2-state-current', '-');
    safeSetText('v2-state-next', '-');
    safeSetText('v2-state-dimensionality', '-');
    safeSetText('v2-state-bottleneck', '-');
    safeSetText('v2-state-transition-headline', '-');
    safeSetText('v2-state-transition-copy', 'This layer tests a new state-transition model on top of the existing scorer.');
    syncStateTrajectoryControls();
    safeSetText('v2-trajectory-headline', message || 'Select a role to begin');
    safeSetText('v2-trajectory-summary', detail || 'The trajectory layer will show compression, demand response, structural necessity, and viability once the role is scored.');
    safeSetText('v2-trajectory-state', '-');
    safeSetText('v2-trajectory-role-shape-chip', '-');
    safeSetText('v2-trajectory-structural-score', '-');
    safeSetText('v2-trajectory-primary-threshold', '-');
    safeSetText('v2-trajectory-threshold-copy', 'Threshold timing will appear once the trajectory layer is available.');
    safeSetText('v2-trajectory-role-shape-summary', '-');
    safeSetText('v2-trajectory-role-shape-headline', '-');
    safeSetText('v2-trajectory-role-shape-copy', '-');
    safeSetText('v2-trajectory-role-shape-compression', '-');
    safeSetText('v2-trajectory-role-shape-demand', '-');
    safeSetText('v2-trajectory-role-shape-viability', '-');
    safeSetText('v2-role-state-label', message || 'Select a role to begin');
    safeSetText('v2-role-summary', detail || 'Choose a category, select the closest occupation, optionally pick a reviewed role version, and then edit the role composition only if needed before scoring.');
    safeSetText('v2-outlook-summary-copy', detail || 'This briefing is built from your selected occupation, your task mix, and empirical task-level evidence.');
    safeSetText('v2-role-state-card', '-');
    safeSetText('v2-score-role-outlook', '-');
    safeSetText('v2-top-cluster', '-');
    safeSetText('v2-balance', '-');
    safeSetText('v2-score-mode', '-');
    safeSetText('v2-viability', '-');
    safeSetText('v2-score-residual', '-');
    safeSetText('v2-adaptation', '-');
    safeSetText('v2-score-fit', '-');
    safeSetText('v2-what-changing', '-');
    safeSetText('v2-what-absorbed', '-');
    safeSetText('v2-what-remains', '-');
    safeSetText('v2-rebundle-summary', '-');
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
    safeSetText('v2-seat-summary', '-');
    safeSetText('v2-seat-effect', '-');
    safeSetText('v2-who-benefits', '-');
    safeSetText('v2-task-confidence', '-');
    safeSetText('v2-prior-confidence', '-');
    safeSetText('v2-evidence-notes', 'Choose a mapped occupation to see how evidence strength, personalization signal, occupation anchoring, and task coverage are scored.');
    safeSetText('v2-explanation-driver', '-');
    safeSetText('v2-explanation-counterweight', '-');
    safeSetText('v2-explanation-evidence', '-');
    safeSetText('v2-explanation-review', '-');
    safeSetText('v2-explanation-copy', 'Choose a mapped occupation to see the plain-English audit summary for the current role readout.');
    safeSetText('v2-edit-impact-baseline', '-');
    safeSetText('v2-edit-impact-counts', '-');
    safeSetText('v2-edit-impact-largest', '-');
    safeSetText('v2-edit-impact-fate', '-');
    safeSetText('v2-edit-impact-trajectory', '-');
    safeSetText('v2-edit-impact-structure', '-');
    safeSetText('v2-edit-impact-timing', '-');
    safeSetText('v2-edit-impact-tasks', '-');
    safeSetText('v2-edit-impact-functions', '-');
    safeSetText('v2-edit-impact-evidence', '-');
    safeSetText('v2-edit-impact-copy', 'Edit tasks, functions, or task weights to compare your current run to the unedited baseline for this occupation.');
    safeSetText('v2-audit-pressure', '-');
    safeSetText('v2-audit-spillover', '-');
    safeSetText('v2-audit-retained', '-');
    safeSetText('v2-audit-functions', '-');
    safeSetText('v2-audit-retained-functions', '-');
    safeSetText('v2-audit-citations', '-');
    safeSetText('v2-audit-copy', 'The live audit trace will show which tasks, functions, and evidence rows are driving the current readout.');
    const auditCopyButton = document.getElementById('v2-audit-copy-button');
    if (auditCopyButton instanceof HTMLButtonElement) {
        auditCopyButton.disabled = true;
    }
    safeSetText('v2-map-subtitle', 'The model separates direct pressure from spillover, so support work can weaken even when AI is not directly doing the task itself.');
    safeSetText('v2-task-note', 'This view reorders the edited role composition as your selected tasks/functions and role-refinement answers change role share, pressure, spillover, and retained leverage.');
    safeSetText('v2-recomposition-conversion', '-');
    ['current', 'next', 'distant'].forEach(function (w) {
        safeSetText('v2-wave-' + w + '-state', '-');
        safeSetText('v2-wave-' + w + '-retained', '-');
        safeSetText('v2-wave-' + w + '-coherence', '-');
    });
    renderV2LaborMarketContext(null, '');
    renderV2OccupationAssignment(null);
    renderV2OccupationExplanation(null);
    renderV2AuditTrace(null);
    renderV2Walkthrough(null);
    renderV2TaskStory(null);
    renderV2ClusterList('v2-current-bundle', [], { emptyText: 'Choose a mapped occupation to populate the current bundle.' });
    renderV2ClusterList('v2-bargaining-bundle', [], { emptyText: 'Bargaining-power tasks appear once the role view is active.' });
    renderV2ClusterList('v2-direct-bundle', [], { emptyText: 'Direct pressure appears once the role view is active.' });
    renderV2ClusterList('v2-indirect-bundle', [], { emptyText: 'Spillover tasks appear once the role view is active.' });
    renderV2ClusterList('v2-residual-bundle', [], { emptyText: 'Retained-leverage tasks appear once the role view is active.' });
    renderV2ClusterList('v2-shrinking-bundle', [], { emptyText: 'Shrinking work bundles appear once the role is scored.' });
    renderV2ClusterList('v2-accession-bundle', [], { emptyText: 'Growing work bundles appear once the role is scored.' });
    renderV2ClusterList('v2-seat-shrinks', [], { emptyText: 'The shrinking part of the seat appears once the role is scored.' });
    renderV2ClusterList('v2-seat-stays', [], { emptyText: 'A distinct retained human core appears once the role is scored.' });
    renderV2ClusterList('v2-seat-grows', [], { emptyText: 'The growing part of the retained seat appears once the role is scored.' });
    renderV2TransitionTriggers(null);
    renderTimingFrontier(null);
    renderRoleStoryboard(null);
    renderV2TaskBreakdown(null, null);
    renderV2RoleComposition(v2RoleCompositionState?.raw || null);
    const trajectoryThresholdGrid = document.getElementById('v2-trajectory-threshold-grid');
    const trajectoryGraph = document.getElementById('v2-trajectory-graph');
    const trajectoryScenarioGrid = document.getElementById('v2-trajectory-scenario-grid');
    const trajectoryDriverGrid = document.getElementById('v2-trajectory-driver-grid');
    const trajectoryFunctionGrid = document.getElementById('v2-trajectory-function-grid');
    const stateCheckpointGrid = document.getElementById('v2-state-checkpoint-grid');
    const stateDriverGrid = document.getElementById('v2-state-driver-grid');
    if (trajectoryGraph) trajectoryGraph.innerHTML = '';
    if (trajectoryThresholdGrid) trajectoryThresholdGrid.innerHTML = '';
    if (trajectoryScenarioGrid) trajectoryScenarioGrid.innerHTML = '';
    if (trajectoryDriverGrid) trajectoryDriverGrid.innerHTML = '';
    if (trajectoryFunctionGrid) trajectoryFunctionGrid.innerHTML = '';
    if (stateCheckpointGrid) stateCheckpointGrid.innerHTML = '';
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
                investmentBias: v2StateModelControls.investmentBias
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

    const roleFateMap = buildRoleFateMap(result.task_breakdown);
    const topDirectTask = roleFateMap.direct_pressure[0] || null;
    const topPressureTask = result?.audit_trace?.top_pressure_tasks?.[0]?.task_statement || topDirectTask?.label || '';
    const topRetainedTask = result?.audit_trace?.top_retained_tasks?.[0]?.task_statement || '';
    const topExposedLabel = topDirectTask?.label
        ? topDirectTask.label
        : (result.top_exposed_work?.label ? `${result.top_exposed_work.label} · ${result.top_exposed_work.wave_assignment} wave` : '-');

    const wt = result.wave_trajectory || {};
    const waveHeadline = `Primary displacement: ${result.primary_displacement_wave} wave`;
    const directLeadCopy = topDirectTask?.label
        ? `${topDirectTask.label} is the clearest early pressure point in this role. These are the tasks current AI can draft, standardize, or delegate most easily first.`
        : (result.narrative_summary?.what_is_under_pressure || '-');

    safeSetText('v2-role-state-label', `${result.selected_occupation_title} · ${result.role_fate_label || result.role_outlook_label}`);
    const roleSummaryCopy = result.role_summary
        ? `${result.role_summary} Confidence: ${Math.round((Number(result.role_fate_confidence) || 0) * 100)}%.`
        : 'The role-fate model ranks current work, pressure, spillover, and retained leverage across current, next, and distant waves.';
    safeSetText('v2-role-summary', roleSummaryCopy);
    safeSetText('v2-outlook-summary-copy', roleSummaryCopy);
    safeSetText('v2-role-state-card', result.role_fate_label || result.role_outlook_label || '-');
    safeSetText('v2-score-role-outlook', result.role_fate_label || result.role_outlook_label || '-');
    safeSetText('v2-top-cluster', topExposedLabel);
    safeSetText('v2-balance', waveHeadline);
    safeSetText('v2-score-mode', waveHeadline);
    safeSetText('v2-viability', formatV2Label(result.residual_role_strength));
    safeSetText('v2-score-residual', formatV2Label(result.residual_role_strength));
    safeSetText('v2-adaptation', formatV2Label(result.personalization_fit));
    safeSetText('v2-score-fit', formatV2Label(result.personalization_fit));

    // Wave trajectory cards
    ['current', 'next', 'distant'].forEach(function (waveName) {
        var ws = wt[waveName];
        if (!ws) return;
        safeSetText('v2-wave-' + waveName + '-state', ws.state_label || formatV2Label(ws.state));
        safeSetText('v2-wave-' + waveName + '-retained', `${Math.round((ws.retained_share || 0) * 100)}% of the role still remains`);
        safeSetText('v2-wave-' + waveName + '-coherence', formatWaveCoherencePlain(ws.coherence_tier));
    });
    safeSetText('v2-what-changing', result.narrative_summary?.why_this_role_changes || '-');
    safeSetText('v2-what-absorbed', directLeadCopy);
    safeSetText('v2-what-remains', result.narrative_summary?.what_stays_core || '-');
    safeSetText('v2-rebundle-summary', result.narrative_summary?.how_the_work_rebundles || result.task_accession_map?.net_role_rebundle_summary || '-');
    safeSetText('v2-trigger-summary', result.narrative_summary?.when_the_role_turns || result.transition_trigger_map?.summary || '-');
    safeSetText('v2-bargaining-cliff-summary', result.transition_trigger_map?.bargaining_cliff_summary || '-');
    safeSetText('v2-seat-summary', result.narrative_summary?.how_the_seat_rebalances || result.seat_change_map?.summary || '-');
    safeSetText('v2-seat-effect', result.seat_change_map?.net_seat_effect_label || '-');
    safeSetText('v2-who-benefits', result.narrative_summary?.personalization_fit_summary || '-');
    safelyRunV2Render('evidence summary', () => renderV2EvidenceSummary(result.evidence_summary));
    safeSetText(
        'v2-map-subtitle',
        `${result.selected_occupation_title}: I separate work AI can touch directly from work that gets smaller after the surrounding workflow changes. ${topPressureTask ? `Pressure starts with tasks like "${topPressureTask}". ` : ''}${topRetainedTask ? `The strongest human core is still tied to work like "${topRetainedTask}".` : ''}`
    );
    safeSetText(
        'v2-task-note',
        `${result.selected_occupation_title} uses the edited role composition as the baseline. Each task updates live as your task/function edits and role-refinement answers change role share, direct pressure, spillover risk, and retained leverage.`
    );
    safelyRunV2Render('recomposition summary', () => renderV2RecompositionSummary(result.recomposition_summary));
    safelyRunV2Render('occupation assignment', () => renderV2OccupationAssignment(result.occupation_assignment));
    safelyRunV2Render('edit impact', () => renderV2EditImpact(result.occupation_assignment?.selected_composition?.edit_delta || null));
    safelyRunV2Render('occupation explanation', () => renderV2OccupationExplanation(result.occupation_explanation));
    safelyRunV2Render('audit trace', () => renderV2AuditTrace(result.audit_trace));
    safelyRunV2Render('labor context', () => renderV2LaborMarketContext(result.labor_market_context, result.selected_occupation_title));
    safelyRunV2Render('current bundle', () => renderV2ClusterList('v2-current-bundle', roleFateMap.current_role, {
        shareKey: 'signal_share',
        emptyText: 'No current task bundle available.'
    }));
    safelyRunV2Render('bargaining bundle', () => renderV2ClusterList('v2-bargaining-bundle', roleFateMap.bargaining_power, {
        shareKey: 'signal_share',
        emptyText: 'No bargaining-power tasks exceeded the display threshold.'
    }));
    safelyRunV2Render('direct bundle', () => renderV2ClusterList('v2-direct-bundle', roleFateMap.direct_pressure, {
        shareKey: 'signal_share',
        emptyText: 'No direct-pressure tasks exceeded the display threshold.'
    }));
    safelyRunV2Render('indirect bundle', () => renderV2ClusterList('v2-indirect-bundle', roleFateMap.indirect_spillover, {
        shareKey: 'signal_share',
        emptyText: 'No spillover tasks exceeded the display threshold.'
    }));
    safelyRunV2Render('retained bundle', () => renderV2ClusterList('v2-residual-bundle', roleFateMap.retained_leverage, {
        shareKey: 'signal_share',
        emptyText: 'No retained-leverage tasks exceeded the display threshold.'
    }));
    safelyRunV2Render('shrinking bundle', () => renderV2ClusterList('v2-shrinking-bundle', buildAccessionDisplayRows(result.task_accession_map, 'shrinking'), {
        shareKey: 'signal_share',
        emptyText: 'No shrinking work bundles exceeded the display threshold.'
    }));
    safelyRunV2Render('accession bundle', () => renderV2ClusterList('v2-accession-bundle', buildAccessionDisplayRows(result.task_accession_map, 'accession'), {
        shareKey: 'signal_share',
        emptyText: 'No growing work bundles exceeded the display threshold.'
    }));
    safelyRunV2Render('transition triggers', () => renderV2TransitionTriggers(result.transition_trigger_map));
    safelyRunV2Render('seat shrinks', () => renderV2ClusterList('v2-seat-shrinks', buildSeatChangeDisplayRows(result.seat_change_map, 'shrinks'), {
        shareKey: 'signal_share',
        emptyText: 'No shrinking seat bundles exceeded the display threshold.'
    }));
    safelyRunV2Render('seat stays', () => renderV2ClusterList('v2-seat-stays', buildSeatChangeDisplayRows(result.seat_change_map, 'stays'), {
        shareKey: 'signal_share',
        emptyText: 'No clearly separate retained human bundle is strong enough to show yet.'
    }));
    safelyRunV2Render('seat grows', () => renderV2ClusterList('v2-seat-grows', buildSeatChangeDisplayRows(result.seat_change_map, 'grows'), {
        shareKey: 'signal_share',
        emptyText: 'No growing retained bundles exceeded the display threshold.'
    }));
    safelyRunV2Render('task breakdown', () => renderV2TaskBreakdown(result.task_breakdown, result.occupation_assignment));
    safelyRunV2Render('walkthrough', () => renderV2Walkthrough(result));

    // New r-dx- section renders
    safelyRunV2Render('state trajectory summary', () => renderStateTrajectorySummary(result));
    safelyRunV2Render('state trajectory checkpoints', () => renderStateTrajectoryCheckpoints(result));
    safelyRunV2Render('state trajectory drivers', () => renderStateTrajectoryDrivers(result));
    safelyRunV2Render('trajectory summary', () => renderTrajectorySummary(result));
    safelyRunV2Render('trajectory graph', () => renderTrajectoryGraph(result));
    safelyRunV2Render('trajectory thresholds', () => renderTrajectoryThresholds(result));
    safelyRunV2Render('trajectory scenarios', () => renderTrajectoryScenarios(result));
    safelyRunV2Render('trajectory drivers', () => renderTrajectoryDrivers(result));
    safelyRunV2Render('trajectory role shape', () => renderTrajectoryRoleShape(result));
    safelyRunV2Render('trajectory function contributions', () => renderTrajectoryFunctionContributions(result));
    safelyRunV2Render('trajectory section visibility', () => ensureTrajectorySectionsVisible());
    safelyRunV2Render('landscape placement', () => ensureTrajectoryLandscapePlacement());
    safelyRunV2Render('seat shift', () => renderSeatShift(result));
    safelyRunV2Render('pressure scatter', () => renderPressureScatter(result));
    safelyRunV2Render('friction bars', () => renderFrictionBars(result));
    safelyRunV2Render('task table', () => renderTaskTable(result));
    safelyRunV2Render('wave timeline', () => renderWaveTimeline(result));
    safelyRunV2Render('timing frontier', () => renderTimingFrontier(result));
    safelyRunV2Render('trigger gauges', () => renderTriggerGauges(result));
    safelyRunV2Render('landscape stat', () => renderLandscapeStat(result));

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
    const auditCopyButton = document.getElementById('v2-audit-copy-button');
    const storyOpenDetailsButton = document.getElementById('v2-story-open-details');
    const supportingDetails = document.getElementById('v2-supporting-details');
    const stateDemandBias = document.getElementById('v2-state-demand-bias');
    const stateInvestmentBias = document.getElementById('v2-state-investment-bias');
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
    renderDepthTabs();
    ensureTrajectoryLandscapePlacement();
    syncStateTrajectoryControls();

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
                return 'Pick the closest level to show how much of your role is execution versus authority.';
        }
    }

    function syncHierarchyControl() {
        const selectedValue = String(hierarchySelect?.value || '');
        hierarchyOptions.forEach((button) => {
            button.classList.toggle('is-selected', button.dataset.value === selectedValue);
            button.setAttribute('aria-pressed', button.dataset.value === selectedValue ? 'true' : 'false');
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

    function scrollToNextTarget() {
        const targets = getProgressionTargets();
        if (!targets.length) {
            return;
        }

        const viewportTop = window.scrollY + 120;
        const nextTarget = targets.find((target) => target.offsetTop > viewportTop + 24) || targets[targets.length - 1];
        nextTarget?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function unlockResultsAndAnalyze({ scroll = true } = {}) {
        v2ResultsUnlocked = true;
        setAnalysisStageActive(true);
        tryShowResults();
        analyzeRole();
        if (scroll) {
            requestAnimationFrame(() => {
                const overviewHero = resultsSection?.querySelector('.r-story-step--overview .r-analysis-hero');
                overviewHero?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    // v2 task toggle
    v2TaskToggle?.addEventListener('click', () => {
        v2TaskBreakdownExpanded = !v2TaskBreakdownExpanded;
        renderV2TaskBreakdown(lastV2Result?.task_breakdown || null, lastV2Result?.occupation_assignment || null);
    });

    overviewTaskToggle?.addEventListener('click', () => {
        v2OverviewTasksExpanded = !v2OverviewTasksExpanded;
        renderV2Walkthrough(lastV2Result);
    });

    auditCopyButton?.addEventListener('click', async () => {
        const exportSummary = lastV2Result?.audit_trace?.export_summary || '';
        if (!exportSummary) {
            safeSetText('v2-audit-copy', 'No audit trace is available to copy yet.');
            return;
        }
        const copied = await copyTextToClipboard(exportSummary);
        safeSetText(
            'v2-audit-copy',
            copied
                ? 'Copied the current audit trace summary. You can paste it into notes, a review doc, or a bug report.'
                : 'Copy failed in this browser context. The audit trace is still visible in the panel.'
        );
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
                const overviewHero = resultsSection?.querySelector('.r-story-step--overview .r-analysis-hero');
                overviewHero?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
