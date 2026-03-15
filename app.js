// app.js — V2 application logic extracted from index.html
// State, questionnaire, formatting, engine access, rendering, and event wiring.

// ─── 1. State variables ──────────────────────────────────────────────────────

let selectedRole = null;
let selectedOccupationId = null;
let lastV2Result = null;
let v2EnginePromise = null;
let v2TaskBreakdownExpanded = false;
let v2RoleCompositionState = null;
let v2CustomDependencyEdges = [];
let v2CustomTaskFunctionLinks = [];
let v2GraphNodePositions = {};
let v2RoleGraphControllerPromise = null;
let v2GraphMode = 'move';
let v2RoleVariantPreference = { mode: 'auto', variantId: null };
let v2AdjustmentMode = null;
let v2AdjustmentMode = null;

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
        title: 'Exposure And Evidence',
        questions: [
            {
                id: 'ai_observability_of_work',
                title: 'AI observability in this work',
                prompt: 'How visible and legible is the work to current AI systems through prompts, artifacts, outputs, or structured traces?',
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
                title: 'Evidence and work trail',
                prompt: 'How much role-relevant work trail exists for imitation, benchmarking, training, or structured review?',
                options: [
                    { value: 1, label: 'Very Limited' },
                    { value: 2, label: 'Limited' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Abundant' },
                    { value: 5, label: 'Very Abundant' }
                ]
            },
            {
                id: 'review_signoff_clarity',
                title: 'Human review and sign-off clarity',
                prompt: 'How clearly can a human reviewer tell whether the work is acceptable, and how formal is the review or approval burden?',
                options: [
                    { value: 1, label: 'Very Hard' },
                    { value: 2, label: 'Difficult' },
                    { value: 3, label: 'Moderate', checked: true },
                    { value: 4, label: 'Fairly Easy' },
                    { value: 5, label: 'Very Easy' }
                ]
            },
            {
                id: 'digital_workflow_readiness',
                title: 'Work digitization and machine readability',
                prompt: 'What share of the work inputs, context, and outputs already live in digital or system-readable form?',
                options: [
                    { value: 1, label: '0-20%' },
                    { value: 2, label: '21-40%' },
                    { value: 3, label: '41-60%', checked: true },
                    { value: 4, label: '61-80%' },
                    { value: 5, label: '81-100%' }
                ]
            }
        ]
    },
    {
        title: 'Role Structure',
        questions: [
            {
                id: 'workflow_decomposability',
                title: 'Workflow decomposability',
                prompt: 'Can the work be cleanly split into independent units, or does it need to stay bundled in a larger sequence?',
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
                prompt: 'How standardized are the procedures, templates, and workflow steps in this role?',
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
                title: 'Context and exception load',
                prompt: 'How much does good performance depend on local context, exception handling, unwritten norms, or situation-specific judgment?',
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
                title: 'Review loop speed',
                prompt: 'How quickly does the work get reviewed, corrected, or accepted in ways that AI systems could learn from?',
                options: [
                    { value: 1, label: 'Months/Years' },
                    { value: 2, label: 'Weeks' },
                    { value: 3, label: 'Days', checked: true },
                    { value: 4, label: 'Hours' },
                    { value: 5, label: 'Minutes/Instant' }
                ]
            },
            {
                id: 'tacit_knowledge_load',
                title: 'Tacit rules and unwritten context',
                prompt: 'How much of the expertise in this role is learned through experience rather than fully documented in explicit procedures?',
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
        title: 'Function And Authority',
        questions: [
            {
                id: 'human_signoff_requirement',
                title: 'Human sign-off and relationship ownership',
                prompt: 'How much does the role depend on trust, stakeholder ownership, negotiation, approval, or a human being accountable for the final call?',
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
                title: 'External trust or on-site dependence',
                prompt: 'How much does the role depend on physical presence, site-specific work, or trust-bearing interaction that cannot be fully abstracted away?',
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
        title: 'Adoption And Embedding',
        questions: [
            {
                id: 'organizational_adoption_readiness',
                title: 'Organization AI adoption readiness',
                prompt: 'How prepared is your organization to integrate AI into actual workflows, not just experiment with demos?',
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
                title: 'Pressure to delegate or compress work',
                prompt: 'How strong is the pressure to reduce labor cost, delegate execution, or increase output without adding headcount?',
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
                title: 'Workflow integration readiness',
                prompt: 'How ready is the organization to plug new AI systems into the tools, data, and review loops this work depends on?',
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
    'Exposure And Evidence': 'Use this module when the role depends heavily on machine-readable inputs, clear review trails, or abundant examples.',
    'Role Structure': 'Use this module to describe whether the work stays bundled in a sequence or breaks into separable pieces.',
    'Function And Authority': 'Use this module when sign-off, trust, liability, or relationship ownership still anchor the human role.',
    'Adoption And Embedding': 'Use this module to describe how quickly the organization can actually convert AI capability into workflow change.'
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
    } else {
        console.warn(`Element with ID '${elementId}' not found`);
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

async function populateOccupationCandidates(roleCategory, preserveCurrent = true) {
    const topSelect = document.getElementById('top-occupation-select');
    const resultSelect = document.getElementById('occupation-match-select');
    const selects = [topSelect, resultSelect].filter(Boolean);
    if (!selects.length) return [];

    const setEmptyState = (label, disabled = true) => {
        selects.forEach((select) => {
            select.disabled = disabled;
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

        const shareSelect = document.createElement('select');
        shareSelect.className = 'plane-dropdown v2-composition-share-select';
        shareSelect.dataset.action = 'share-weight';
        shareSelect.dataset.itemId = item.task_id;
        shareSelect.setAttribute('aria-label', `Adjust role share for ${item.task_statement || 'selected task'}`);

        const currentOverride = Number(v2RoleCompositionState?.taskShareOverrides?.[item.task_id]);
        const baselineShare = Math.round((Number(item.time_share_prior) || 0) * 100);
        [
            { value: '', label: `Baseline (${baselineShare}%)` },
            { value: '0.05', label: '5%' },
            { value: '0.10', label: '10%' },
            { value: '0.15', label: '15%' },
            { value: '0.20', label: '20%' },
            { value: '0.25', label: '25%' },
            { value: '0.30', label: '30%' }
        ].forEach((optionConfig) => {
            const option = document.createElement('option');
            option.value = optionConfig.value;
            option.textContent = optionConfig.label;
            shareSelect.appendChild(option);
        });
        shareSelect.value = Number.isFinite(currentOverride) ? currentOverride.toFixed(2) : '';

        shareLabel.appendChild(shareSelect);
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
    const panel = document.getElementById('v2-role-variant-panel');
    const headline = document.getElementById('v2-role-variant-headline');
    const summary = document.getElementById('v2-role-variant-summary');
    const select = document.getElementById('v2-role-variant-select');
    const note = document.getElementById('v2-role-variant-note');

    if (!panel || !headline || !summary || !select || !note) {
        return;
    }

    const variantSupport = composition?.variant_support;
    const variants = Array.isArray(composition?.variants) ? composition.variants : [];
    if (!variantSupport?.enabled || !variants.length) {
        panel.hidden = true;
        select.innerHTML = '<option value="">No reviewed role variants for this occupation yet</option>';
        note.textContent = '';
        summary.textContent = 'This occupation currently uses one occupation-wide baseline before you edit tasks and functions.';
        return;
    }

    panel.hidden = false;
    headline.textContent = 'Choose the closest reviewed version of this occupation';
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
    summary.textContent = `We start from ${onetCount} O*NET task${onetCount === 1 ? '' : 's'}, ${reviewedPostingCount} reviewed public-posting task${reviewedPostingCount === 1 ? '' : 's'}, ${reviewedManualCount} reviewed role-review task${reviewedManualCount === 1 ? '' : 's'}, and ${functionCount} value-defining function${functionCount === 1 ? '' : 's'}. ${composition.variant_support?.enabled ? `The current reviewed baseline is ${composition.variant_support.selected_variant_label}. ` : ''}Use the studio below to edit the task tree directly.`;
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
    if (Number.isFinite(confidence)) {
        parts.push(`${Math.round(confidence * 100)}% evidence`);
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
        secondary_label: task?.task_cluster_label || 'Mapped task family',
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
        let secondaryLabel = task?.task_cluster_label || 'Mapped task family';
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
        editDelta?.largest_metric_shift
            ? `${editDelta.largest_metric_shift.metric_label} ${editDelta.largest_metric_shift.direction} ${Math.abs(Math.round(Number(editDelta.largest_metric_shift.delta || 0) * 100))} pts`
            : (editDelta ? 'No material metric shift' : '-')
    );
    safeSetText(
        'v2-edit-impact-fate',
        editDelta
            ? (editDelta.role_fate_changed
                ? `${editDelta.baseline_role_fate_label} -> ${editDelta.current_role_fate_label}`
                : `No change · ${editDelta.current_role_fate_label || 'same fate label'}`)
            : '-'
    );
    safeSetText('v2-edit-impact-tasks', taskDetail || (editDelta ? 'No task add/remove change' : '-'));
    safeSetText('v2-edit-impact-functions', functionDetail || (editDelta ? 'No function add/remove change' : '-'));
    safeSetText('v2-edit-impact-evidence', evidenceMix);
    safeSetText(
        'v2-edit-impact-copy',
        editDelta?.summary
            ? editDelta.summary
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
    meta.appendChild(createV2TaskChip(task?.task_cluster_label || 'Unknown task family', 'accent'));
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

// ─── 8. V2 Result functions ─────────────────────────────────────────────────

function resetV2Results(message, detail) {
    v2TaskBreakdownExpanded = false;
    safeSetText('v2-role-state-label', message || 'Select a role to begin');
    safeSetText('v2-role-summary', detail || 'Choose a category, select the closest occupation, and optionally edit the role composition before scoring.');
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
    safeSetText('v2-map-subtitle', "This map starts from the current task mix, then shows which tasks hold bargaining power, face direct AI pressure, lose value through spillover, or remain central to the retained role.");
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
    renderV2ClusterList('v2-current-bundle', [], { emptyText: 'Choose a mapped occupation to populate the current bundle.' });
    renderV2ClusterList('v2-bargaining-bundle', [], { emptyText: 'Bargaining-power tasks appear once the role view is active.' });
    renderV2ClusterList('v2-direct-bundle', [], { emptyText: 'Direct pressure appears once the role view is active.' });
    renderV2ClusterList('v2-indirect-bundle', [], { emptyText: 'Spillover tasks appear once the role view is active.' });
    renderV2ClusterList('v2-residual-bundle', [], { emptyText: 'Retained-leverage tasks appear once the role view is active.' });
    renderV2TaskBreakdown(null, null);
    renderV2RoleComposition(v2RoleCompositionState?.raw || null);
    lastV2Result = null;
}

async function updateV2Results(options = {}) {
    const preserveSelection = options.preserveSelection !== false;
    const roleCategory = selectedRole;

    if (!roleCategory) {
        v2RoleCompositionState = null;
        renderV2RoleComposition(null);
        resetV2Results('Select a category to begin', 'Choose a category, select the closest occupation, and optionally edit the role composition before scoring.');
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

    const candidates = await populateOccupationCandidates(roleCategory, preserveSelection);
    if (!candidates.length || !selectedOccupationId) {
        v2RoleCompositionState = null;
        renderV2RoleComposition(null);
        resetV2Results('No occupation match available', 'This category does not yet have a launch occupation mapped into the transformation engine.');
        return null;
    }

    let engine;
    try {
        engine = await getV2Engine();
    } catch (error) {
        console.error('[V2] Engine initialization failed:', error);
        resetV2Results('V2 engine unavailable', 'The transformation model data could not be loaded on this page.');
        return null;
    }

    const responses = getCurrentRefinementResponses();
    const seniorityLevel = parseFloat(document.getElementById('hierarchy-select')?.value || '1');
    const questionnaireProfile = buildStructuredQuestionnaireProfile(responses, seniorityLevel);
    await populateV2RoleComposition(selectedOccupationId, preserveSelection);
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
            dependencyEdits: dependencyEdits
        };
        if (questionnaireProfile) {
            computeOptions.questionnaireProfile = questionnaireProfile;
        }
        result = engine.computeResult(computeOptions);
    } catch (error) {
        console.error('[V2] Failed to compute result:', error);
        resetV2Results('V2 result unavailable', 'The transformation engine could not resolve a result for this role yet.');
        return null;
    }

    lastV2Result = result;

    const roleFateMap = buildRoleFateMap(result.task_breakdown);
    const topDirectTask = roleFateMap.direct_pressure[0] || null;
    const topExposedLabel = topDirectTask?.label
        ? topDirectTask.label
        : (result.top_exposed_work?.label ? `${result.top_exposed_work.label} · ${result.top_exposed_work.wave_assignment} wave` : '-');

    const wt = result.wave_trajectory || {};
    const waveHeadline = `Primary displacement: ${result.primary_displacement_wave} wave`;

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
        safeSetText('v2-wave-' + waveName + '-retained', Math.round((ws.retained_share || 0) * 100) + '% retained');
        safeSetText('v2-wave-' + waveName + '-coherence', formatV2Label(ws.coherence_tier) + ' retained integrity');
    });
    safeSetText('v2-what-changing', result.narrative_summary?.why_this_role_changes || '-');
    safeSetText('v2-what-absorbed', result.narrative_summary?.what_is_under_pressure || '-');
    safeSetText('v2-what-remains', result.narrative_summary?.what_stays_core || '-');
    safeSetText('v2-who-benefits', result.narrative_summary?.personalization_fit_summary || '-');
    renderV2EvidenceSummary(result.evidence_summary);
    safeSetText(
        'v2-map-subtitle',
        `${result.selected_occupation_title}: current work comes first, then bargaining-power tasks, direct pressure, spillover, and retained leverage. After the next wave, ${Math.round((wt.next?.retained_share || 0) * 100)}% is retained with ${wt.next?.coherence_tier || '-'} retained integrity.`
    );
    safeSetText(
        'v2-task-note',
        `${result.selected_occupation_title} uses the edited role composition as the baseline. Each task updates live as your task/function edits and role-refinement answers change role share, direct pressure, spillover risk, and retained leverage.`
    );
    renderV2RecompositionSummary(result.recomposition_summary);
    renderV2OccupationAssignment(result.occupation_assignment);
    renderV2EditImpact(result.occupation_assignment?.selected_composition?.edit_delta || null);
    renderV2OccupationExplanation(result.occupation_explanation);
    renderV2AuditTrace(result.audit_trace);
    renderV2LaborMarketContext(result.labor_market_context, result.selected_occupation_title);
    renderV2ClusterList('v2-current-bundle', roleFateMap.current_role, {
        shareKey: 'signal_share',
        emptyText: 'No current task bundle available.'
    });
    renderV2ClusterList('v2-bargaining-bundle', roleFateMap.bargaining_power, {
        shareKey: 'signal_share',
        emptyText: 'No bargaining-power tasks exceeded the display threshold.'
    });
    renderV2ClusterList('v2-direct-bundle', roleFateMap.direct_pressure, {
        shareKey: 'signal_share',
        emptyText: 'No direct-pressure tasks exceeded the display threshold.'
    });
    renderV2ClusterList('v2-indirect-bundle', roleFateMap.indirect_spillover, {
        shareKey: 'signal_share',
        emptyText: 'No spillover tasks exceeded the display threshold.'
    });
    renderV2ClusterList('v2-residual-bundle', roleFateMap.retained_leverage, {
        shareKey: 'signal_share',
        emptyText: 'No retained-leverage tasks exceeded the display threshold.'
    });
    renderV2TaskBreakdown(result.task_breakdown, result.occupation_assignment);

    return result;
}

// ─── 9. Simplified analyzeRole ──────────────────────────────────────────────

function analyzeRole() {
    refreshQuestionnaireProfileSummary();
    if (!selectedRole) return;
    updateV2Results({ preserveSelection: true }).catch(function(error) {
        console.error('[V2] Failed to update transformation view:', error);
    });
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
    const hierarchySelect = document.getElementById('hierarchy-select');
    const prefillToggle = document.getElementById('prefill-questions');
    const resultsSection = document.getElementById('results-column');
    const explanationSection = document.getElementById('model-explanation-section');
    const legacyWizard = document.querySelector('.legacy-wizard');
    const occupationMatchSelect = document.getElementById('occupation-match-select');
    const v2TaskToggle = document.getElementById('v2-task-toggle');
    const compositionCards = document.getElementById('v2-composition-cards');
    const breakdownCards = document.getElementById('v2-breakdown-cards');
    const roleVariantSelect = document.getElementById('v2-role-variant-select');
    const auditCopyButton = document.getElementById('v2-audit-copy-button');
    const adjustGate = document.getElementById('v2-adjust-gate');
    const adjustShell = document.getElementById('v2-adjust-shell');
    const defaultAnalysisButton = document.getElementById('v2-default-analysis-button');
    const adjustAnalysisButton = document.getElementById('v2-adjust-analysis-button');
    const roleRefinementPanel = document.getElementById('v2-role-refinement-panel');

    const showBlock = (el) => el && el.classList.remove('hidden-block');
    const occupationSearchLookup = new Map();

    initializeRefinementLayout();

    function isReadyForAnalysis() {
        return !!(roleSelect?.value && hierarchySelect?.value && (selectedOccupationId || roleSelect?.value === 'custom'));
    }

    function updateAdjustmentMode(nextMode) {
        v2AdjustmentMode = nextMode;

        if (adjustGate) {
            adjustGate.classList.toggle('r-adjust-gate--chosen', !!nextMode);
        }
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
    }

    function syncSetupVisibility() {
        if (!legacyWizard) {
            return;
        }
        const ready = isReadyForAnalysis();
        legacyWizard.classList.toggle('hidden-block', !ready);
        if (!ready) {
            updateAdjustmentMode(null);
        }
    }

    function tryShowResults() {
        syncSetupVisibility();
        if (isReadyForAnalysis() && v2AdjustmentMode) {
            showBlock(resultsSection);
            showBlock(explanationSection);
        }
    }

    function setPrefillState() {
        if (!prefillToggle) return;
        const ready = !!(roleSelect?.value && hierarchySelect?.value && (selectedOccupationId || roleSelect?.value === 'custom'));
        if (!ready) {
            prefillToggle.checked = false;
            prefillToggle.disabled = true;
        } else {
            prefillToggle.disabled = false;
        }
    }

    function syncLegacyRoleCategory(roleVal) {
        selectedRole = roleVal || null;
        document.querySelectorAll('.preset-btn').forEach((button) => {
            button.classList.toggle('active', !!roleVal && button.dataset.role === roleVal);
        });
    }

    function syncSearchInputWithOccupation(occupationId) {
        if (!occupationSearchInput) return;
        if (!occupationId) {
            occupationSearchInput.value = '';
            return;
        }

        const matched = occupationSearchLookup.get(String(occupationId).toLowerCase());
        occupationSearchInput.value = matched ? matched.title : '';
    }

    async function initializeOccupationSearch() {
        if (!occupationSearchInput || !occupationSearchOptions) {
            return;
        }

        try {
            const engine = await getV2Engine();
            const occupations = engine.listOccupations() || [];
            occupationSearchLookup.clear();
            occupationSearchOptions.innerHTML = '';

            occupations.forEach((occupation) => {
                occupationSearchLookup.set(String(occupation.occupation_id).toLowerCase(), occupation);
                occupationSearchLookup.set(String(occupation.title || '').trim().toLowerCase(), occupation);

                const option = document.createElement('option');
                option.value = occupation.title;
                occupationSearchOptions.appendChild(option);
            });
        } catch (error) {
            console.error('[V2] Failed to initialize occupation search:', error);
        }
    }

    // v2 task toggle
    v2TaskToggle?.addEventListener('click', () => {
        v2TaskBreakdownExpanded = !v2TaskBreakdownExpanded;
        renderV2TaskBreakdown(lastV2Result?.task_breakdown || null, lastV2Result?.occupation_assignment || null);
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
                if (v2AdjustmentMode) {
                    return updateV2Results({ preserveSelection: true });
                }
                return null;
            })
            .catch(error => {
                console.error('[V2] Failed to rerender after occupation composition change:', error);
            });
    });

    // Top occupation select change handler
    topOccupationSelect?.addEventListener('change', () => {
        selectedOccupationId = topOccupationSelect.value || null;
        setRoleVariantPreferenceAuto();
        topOccupationSelect.classList.toggle('selected', !!selectedOccupationId);
        if (occupationMatchSelect && occupationMatchSelect.value !== selectedOccupationId) {
            occupationMatchSelect.value = selectedOccupationId || '';
        }
        syncSearchInputWithOccupation(selectedOccupationId);
        tryShowResults();
        setPrefillState();
        populateV2RoleComposition(selectedOccupationId, true)
            .then(() => {
                if (v2AdjustmentMode) {
                    return updateV2Results({ preserveSelection: true });
                }
                return null;
            })
            .catch(error => {
                console.error('[V2] Failed to rerender after top occupation composition change:', error);
            });
    });

    // Occupation search input change handler
    occupationSearchInput?.addEventListener('change', async () => {
        const query = String(occupationSearchInput.value || '').trim().toLowerCase();
        if (!query) {
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

        if (roleSelect) {
            roleSelect.value = matchedOccupation.role_family || '';
            roleSelect.classList.toggle('selected', !!roleSelect.value);
        }

        syncLegacyRoleCategory(matchedOccupation.role_family || '');

        try {
            await populateOccupationCandidates(matchedOccupation.role_family, false);
        } catch (error) {
            console.error('[V2] Failed to populate occupations from search selection:', error);
        }

        selectedOccupationId = matchedOccupation.occupation_id;
        setRoleVariantPreferenceAuto();

        if (topOccupationSelect) {
            topOccupationSelect.value = selectedOccupationId;
            topOccupationSelect.classList.add('selected');
        }
        if (occupationMatchSelect) {
            occupationMatchSelect.value = selectedOccupationId;
        }

        occupationSearchInput.value = matchedOccupation.title;
        tryShowResults();
        setPrefillState();
        populateV2RoleComposition(selectedOccupationId, false)
            .then(() => {
                if (v2AdjustmentMode) {
                    analyzeRole();
                }
            })
            .catch((error) => {
                console.error('[V2] Failed to update role composition from search selection:', error);
            });
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
                if (v2AdjustmentMode) {
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
        if (!(target instanceof HTMLSelectElement) || target.dataset.action !== 'share-weight' || !v2RoleCompositionState) {
            return;
        }

        const taskId = target.dataset.itemId || '';
        if (!taskId) {
            return;
        }

        if (!target.value) {
            delete v2RoleCompositionState.taskShareOverrides[taskId];
        } else {
            const value = Number(target.value);
            if (!Number.isFinite(value)) {
                delete v2RoleCompositionState.taskShareOverrides[taskId];
            } else {
                v2RoleCompositionState.taskShareOverrides[taskId] = value;
            }
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
        if (!(target instanceof HTMLSelectElement) || target.dataset.action !== 'share-weight' || !v2RoleCompositionState) {
            return;
        }
        const taskId = target.dataset.itemId || '';
        if (!taskId) return;

        if (!target.value) {
            delete v2RoleCompositionState.taskShareOverrides[taskId];
        } else {
            const value = Number(target.value);
            if (!Number.isFinite(value)) {
                delete v2RoleCompositionState.taskShareOverrides[taskId];
            } else {
                v2RoleCompositionState.taskShareOverrides[taskId] = value;
            }
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
    roleSelect?.addEventListener('change', async () => {
        const roleValue = roleSelect.value || '';
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
        if (v2AdjustmentMode) {
            analyzeRole();
        }

        if (prefillToggle?.checked) {
            applyQuestionPreset();
            if (v2AdjustmentMode) {
                analyzeRole();
            }
        }
    });

    // Hierarchy select change handler
    hierarchySelect?.addEventListener('change', () => {
        if (hierarchySelect.value) {
            hierarchySelect.classList.add('selected');
        }
        tryShowResults();
        setPrefillState();
        if (prefillToggle?.checked) {
            applyQuestionPreset();
            if (v2AdjustmentMode) {
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
        if (isReadyForAnalysis() && v2AdjustmentMode) {
            showBlock(resultsSection);
            showBlock(explanationSection);
        }
    });

    defaultAnalysisButton?.addEventListener('click', () => {
        if (!isReadyForAnalysis()) {
            return;
        }
        updateAdjustmentMode('default');
        if (prefillToggle) {
            prefillToggle.checked = true;
        }
        if (selectedRole && (selectedOccupationId || selectedRole === 'custom')) {
            applyQuestionPreset();
        } else {
            setAllRefinementQuestionsToDefault();
        }
        tryShowResults();
        analyzeRole();
        resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    adjustAnalysisButton?.addEventListener('click', () => {
        if (!isReadyForAnalysis()) {
            return;
        }
        updateAdjustmentMode('adjust');
        if (prefillToggle) {
            prefillToggle.checked = false;
        }
        if (roleRefinementPanel instanceof HTMLDetailsElement) {
            roleRefinementPanel.open = true;
        }
        tryShowResults();
        requestAnimationFrame(() => {
            adjustShell?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

            if (explanationSection) {
                setTimeout(() => {
                    explanationSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            }
        } else {
            resetQuestionsToNeutral();
        }
        if (v2AdjustmentMode) {
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
});

// ─── 13. Second DOMContentLoaded for init ───────────────────────────────────

window.addEventListener('DOMContentLoaded', function() {
    resetV2Results();
});
