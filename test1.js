(function () {
    const state = {
        engine: null,
        occupations: [],
        selectedOccupation: null,
        selectedLevel: null,
        selectedRoleFamily: '',
        selectedVariantId: '__auto__',
        refinementResponses: {},
        compositionState: null,
        selectedTaskMapId: null,
        result: null,
        comparisonCache: new Map()
    };
    const sourceLabelMap = {
        src_openai_gpts_are_gpts_2023: 'OpenAI task benchmark',
        src_anthropic_ei_2026_01_15: 'Anthropic Economic Index',
        src_reviewed_task_scoring_2026_03: 'Reviewed task scoring'
    };
    const REFINEMENT_QUESTIONS = [
        {
            id: 'ai_observability_of_work',
            title: 'Current AI performance',
            prompt: 'How well can AI already perform the core tasks in this role?',
            options: ['Very poor', 'Limited', 'Moderate', 'Good', 'Near-human']
        },
        {
            id: 'workflow_decomposability',
            title: 'Task decomposability',
            prompt: 'Can the work be broken into discrete, measurable steps?',
            options: ['Very complex', 'Complex', 'Mixed', 'Structured', 'Highly structured']
        },
        {
            id: 'exception_and_context_load',
            title: 'Context and judgment required',
            prompt: 'How much does strong performance depend on reading context, exceptions, and unwritten rules?',
            options: ['Minimal', 'Some needed', 'Moderate', 'Very important', 'Critical'],
            reverseLabels: true
        },
        {
            id: 'human_signoff_requirement',
            title: 'Human sign-off',
            prompt: 'How critical are trust, relationships, and a human being personally accountable?',
            options: ['Minimal', 'Some needed', 'Moderate', 'Very important', 'Essential'],
            reverseLabels: true
        },
        {
            id: 'organizational_adoption_readiness',
            title: 'Company AI adoption',
            prompt: 'How prepared is the organization to turn AI into real workflow change?',
            options: ['Resistant', 'Cautious', 'Exploring', 'Adopting', 'Leading edge']
        },
        {
            id: 'workflow_integration_readiness',
            title: 'Technical infrastructure',
            prompt: 'How modern are the tools and systems this work runs through?',
            options: ['Very outdated', 'Outdated', 'Current', 'Modern', 'Cutting edge']
        }
    ];

    function byId(id) { return document.getElementById(id); }
    function formatPercentWhole(value) { return Math.round((Number(value) || 0) * 100) + '%'; }
    function formatRoleFamily(value) {
        return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, function (char) { return char.toUpperCase(); });
    }
    function trimSentence(text, maxLength) {
        const value = String(text || '').trim();
        const limit = maxLength || 132;
        if (!value) return '';
        if (value.length <= limit) return value;
        return value.slice(0, limit).replace(/[ ,;:.-]+$/, '') + '...';
    }
    function uniqueBy(items, keyFn) {
        const seen = new Set();
        return (items || []).filter(function (item) {
            const key = keyFn(item);
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    function sourceLabel(sourceId) {
        if (sourceLabelMap[sourceId]) return sourceLabelMap[sourceId];
        return String(sourceId || 'Source').replace(/^src_/, '').replace(/_/g, ' ');
    }
    function anchorLabel(anchor) {
        if (!anchor) return '';
        return anchor.public_label || anchor.task_cluster_label || anchor.role_summary || anchor.function_statement || '';
    }
    function getTopShrinkBundle(result) { return result?.seat_change_map?.shrinking_bundles?.[0] || null; }
    function getTopRetainedAnchor(result) {
        return result?.seat_change_map?.retained_bundles?.[0] || result?.function_metrics?.per_function_breakdown?.[0] || null;
    }
    function getTopEmergingBundle(result) {
        return result?.seat_change_map?.growing_bundles?.[0] || result?.task_accession_map?.accession_clusters?.[0] || null;
    }
    function presetsApi() {
        return window.WWILMJ_PRESETS || null;
    }
    function clampAnswer(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 3;
        return Math.max(1, Math.min(5, Math.round(numeric)));
    }
    function getNeutralResponses() {
        const api = presetsApi();
        return { ...(api?.NEUTRAL_REFINEMENT_RESPONSES || {}) };
    }
    function getActiveResponses() {
        return { ...getNeutralResponses(), ...(state.refinementResponses || {}) };
    }
    function getQuestionnaireProfile() {
        const api = presetsApi();
        if (!api?.buildQuestionnaireProfileFromResponses) return null;
        return api.buildQuestionnaireProfileFromResponses(getActiveResponses(), Number(state.selectedLevel || 3));
    }
    function getSelectedVariantId() {
        return state.selectedVariantId && state.selectedVariantId !== '__auto__' ? state.selectedVariantId : null;
    }
    function getFilteredOccupations() {
        const family = String(state.selectedRoleFamily || '').trim();
        if (!family) return state.occupations.slice();
        return state.occupations.filter(function (row) { return row.role_family === family; });
    }
    function searchVisibleOccupations(query, limit) {
        const list = getFilteredOccupations();
        const needle = String(query || '').trim().toLowerCase();
        if (!needle) return list.slice(0, limit || 8);
        return list.filter(function (row) {
            return String(row.title || '').toLowerCase().includes(needle);
        }).slice(0, limit || 8);
    }
    function truncateLabel(value, maxLength) {
        return trimSentence(value, maxLength || 88);
    }
    function getCompositionTaskBuckets(composition) {
        return [
            { key: 'onet_tasks', label: 'O*NET tasks' },
            { key: 'reviewed_job_posting_tasks', label: 'Reviewed posting tasks' },
            { key: 'reviewed_role_graph_tasks', label: 'Reviewed role-review tasks' }
        ].map(function (bucket) {
            return {
                key: bucket.key,
                label: bucket.label,
                rows: Array.isArray(composition?.[bucket.key]) ? composition[bucket.key] : []
            };
        });
    }
    function getAllCompositionTasks(composition) {
        return getCompositionTaskBuckets(composition).reduce(function (acc, bucket) {
            return acc.concat(bucket.rows);
        }, []);
    }
    function setsMatch(left, right) {
        const leftItems = Array.from(left || []);
        const rightItems = Array.from(right || []);
        if (leftItems.length !== rightItems.length) return false;
        const rightSet = new Set(rightItems);
        return leftItems.every(function (item) { return rightSet.has(item); });
    }
    function hasCompositionCustomization(compositionState) {
        if (!compositionState?.raw) return false;
        const defaultTaskIds = new Set(compositionState.raw.defaults?.task_ids || []);
        const defaultFunctionIds = new Set(compositionState.raw.defaults?.function_ids || []);
        return !setsMatch(compositionState.selectedTaskIds, defaultTaskIds)
            || !setsMatch(compositionState.selectedFunctionIds, defaultFunctionIds)
            || Object.keys(compositionState.taskShareOverrides || {}).length > 0
            || (compositionState.customDependencyEdges || []).length > 0;
    }
    function createCompositionState(composition, previousState) {
        const allTasks = getAllCompositionTasks(composition);
        const taskIds = new Set(allTasks.map(function (row) { return row.task_id; }));
        const functionIds = new Set((composition?.functions || []).map(function (row) { return row.function_id; }));
        const nextState = {
            occupationId: composition?.occupation_id || null,
            raw: composition,
            selectedTaskIds: new Set(composition?.defaults?.task_ids || []),
            selectedFunctionIds: new Set(composition?.defaults?.function_ids || []),
            taskShareOverrides: {},
            customDependencyEdges: []
        };
        if (!previousState || previousState.occupationId !== nextState.occupationId) {
            return nextState;
        }

        const preservedTaskIds = Array.from(previousState.selectedTaskIds || []).filter(function (taskId) {
            return taskIds.has(taskId);
        });
        const preservedFunctionIds = Array.from(previousState.selectedFunctionIds || []).filter(function (functionId) {
            return functionIds.has(functionId);
        });
        if (preservedTaskIds.length) nextState.selectedTaskIds = new Set(preservedTaskIds);
        if (preservedFunctionIds.length) nextState.selectedFunctionIds = new Set(preservedFunctionIds);
        nextState.taskShareOverrides = Object.fromEntries(
            Object.entries(previousState.taskShareOverrides || {}).filter(function (entry) {
                return taskIds.has(entry[0]) && Number.isFinite(Number(entry[1]));
            }).map(function (entry) {
                return [entry[0], Number(entry[1])];
            })
        );
        nextState.customDependencyEdges = (previousState.customDependencyEdges || []).filter(function (edge) {
            return taskIds.has(edge.from_task_id) && taskIds.has(edge.to_task_id) && edge.from_task_id !== edge.to_task_id;
        });
        return nextState;
    }
    function getCompositionEdits() {
        const compositionState = state.compositionState;
        if (!compositionState?.raw) {
            return {
                removed_task_ids: [],
                added_task_ids: [],
                removed_function_ids: [],
                added_function_ids: [],
                task_share_overrides: {}
            };
        }
        const defaultTaskIds = new Set(compositionState.raw.defaults?.task_ids || []);
        const defaultFunctionIds = new Set(compositionState.raw.defaults?.function_ids || []);
        const selectedTaskIds = Array.from(compositionState.selectedTaskIds || []);
        const selectedFunctionIds = Array.from(compositionState.selectedFunctionIds || []);
        return {
            removed_task_ids: Array.from(defaultTaskIds).filter(function (taskId) { return !compositionState.selectedTaskIds.has(taskId); }),
            added_task_ids: selectedTaskIds.filter(function (taskId) { return !defaultTaskIds.has(taskId); }),
            removed_function_ids: Array.from(defaultFunctionIds).filter(function (functionId) { return !compositionState.selectedFunctionIds.has(functionId); }),
            added_function_ids: selectedFunctionIds.filter(function (functionId) { return !defaultFunctionIds.has(functionId); }),
            task_share_overrides: Object.fromEntries(
                Object.entries(compositionState.taskShareOverrides || {}).filter(function (entry) {
                    return compositionState.selectedTaskIds.has(entry[0]) && Number.isFinite(Number(entry[1]));
                }).map(function (entry) {
                    return [entry[0], Number(entry[1])];
                })
            )
        };
    }
    function getDependencyEdits() {
        const edges = state.compositionState?.customDependencyEdges || [];
        return {
            added_edges: edges.map(function (edge) {
                return {
                    from_task_id: edge.from_task_id,
                    to_task_id: edge.to_task_id
                };
            })
        };
    }
    function getCompositionSummaryText() {
        const compositionState = state.compositionState;
        if (!compositionState?.raw) {
            return 'Select an occupation to load the editable role mix.';
        }
        const allTasks = getAllCompositionTasks(compositionState.raw);
        const selectedTasks = allTasks.filter(function (row) { return compositionState.selectedTaskIds.has(row.task_id); }).length;
        const selectedFunctions = (compositionState.raw.functions || []).filter(function (row) {
            return compositionState.selectedFunctionIds.has(row.function_id);
        }).length;
        const supportLinks = (compositionState.customDependencyEdges || []).length;
        const overrides = Object.keys(compositionState.taskShareOverrides || {}).length;
        const variantLabel = compositionState.raw.variant_support?.selected_variant_label;
        return selectedTasks + ' active tasks, ' + selectedFunctions + ' active functions'
            + (variantLabel ? ', starting from ' + variantLabel : '')
            + (supportLinks ? ', plus ' + supportLinks + ' custom support link' + (supportLinks === 1 ? '' : 's') : '')
            + (overrides ? ', with ' + overrides + ' role-share override' + (overrides === 1 ? '' : 's') : '')
            + '.';
    }

    function setHeroIntro() {
        byId('t1-hero-kicker').textContent = 'Role transformation';
        byId('t1-hero-title').textContent = 'What happens to this role next?';
        byId('t1-hero-summary').textContent = 'Pick a role and level. This page leads with consequence, keeps the model logic quiet, and opens deeper evidence only when you want it.';
        byId('t1-hero-context').textContent = 'Use the live model. Read the answer first.';
    }

    function updateSelectionCopy() {
        const copy = byId('t1-selection-copy');
        copy.textContent = state.selectedOccupation
            ? state.selectedOccupation.title + ' | ' + formatRoleFamily(state.selectedOccupation.role_family)
            : 'No role selected yet.';
    }

    function renderRoleFamilies() {
        const select = byId('t1-role-family');
        if (!select) return;
        const families = uniqueBy(state.occupations, function (row) { return row.role_family; })
            .map(function (row) { return row.role_family; })
            .filter(Boolean)
            .sort();
        select.innerHTML = '<option value="">All families</option>';
        families.forEach(function (family) {
            const option = document.createElement('option');
            option.value = family;
            option.textContent = formatRoleFamily(family);
            select.appendChild(option);
        });
        select.value = state.selectedRoleFamily || '';
    }

    function updateRunState(message) {
        const ready = !!(state.engine && state.selectedOccupation && state.selectedLevel);
        byId('t1-run-analysis').disabled = !ready;
        if (message) {
            byId('t1-status').textContent = message;
        } else if (!state.engine) {
            byId('t1-status').textContent = 'Loading the role model...';
        } else if (!state.selectedOccupation || !state.selectedLevel) {
            byId('t1-status').textContent = 'Select a role and level.';
        } else {
            byId('t1-status').textContent = 'Ready to run.';
        }
    }

    function renderOccupationResults(rows) {
        const container = byId('t1-occupation-results');
        container.innerHTML = '';
        if (!rows.length) {
            const empty = document.createElement('p');
            empty.className = 't1-selection-copy';
            empty.textContent = 'No occupations match that search yet.';
            container.appendChild(empty);
            return;
        }
        rows.slice(0, 8).forEach(function (row) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 't1-search-option';
            button.dataset.occupationId = row.occupation_id;
            button.innerHTML = '<strong>' + row.title + '</strong><span>' + formatRoleFamily(row.role_family) + '</span>';
            container.appendChild(button);
        });
    }

    function buildDefaultRefinementResponses() {
        const api = presetsApi();
        const roleKey = state.selectedOccupation?.role_family || 'custom';
        if (api?.buildRefinementPreset && state.selectedLevel) {
            return {
                ...getNeutralResponses(),
                ...api.buildRefinementPreset(roleKey, Number(state.selectedLevel))
            };
        }
        return getNeutralResponses();
    }

    function syncPrefillResponses(force) {
        if (!byId('t1-prefill-questions')?.checked && !force) return;
        state.refinementResponses = buildDefaultRefinementResponses();
    }

    function renderRefinementSummary() {
        const profile = getQuestionnaireProfile();
        if (!profile) {
            byId('t1-refinement-function').textContent = '-';
            byId('t1-refinement-signoff').textContent = '-';
            byId('t1-refinement-workflow').textContent = '-';
            byId('t1-refinement-adoption').textContent = '-';
            byId('t1-refinement-pressure').textContent = '-';
            byId('t1-refinement-summary').textContent = 'Use this only when the default role shape feels wrong.';
            return;
        }
        byId('t1-refinement-function').textContent = formatPercentWhole(profile.function_centrality);
        byId('t1-refinement-signoff').textContent = formatPercentWhole(profile.human_signoff_requirement);
        byId('t1-refinement-workflow').textContent = formatPercentWhole(profile.workflow_decomposability);
        byId('t1-refinement-adoption').textContent = formatPercentWhole(profile.organizational_adoption_readiness);
        byId('t1-refinement-pressure').textContent = formatPercentWhole(profile.substitution_risk_modifier);
        byId('t1-refinement-summary').textContent = 'These answers change the role mix the engine scores. Leave them alone unless the default role shape is off.';
    }

    function renderRefinementQuestions() {
        const grid = byId('t1-refinement-grid');
        const responses = getActiveResponses();
        grid.innerHTML = '';
        REFINEMENT_QUESTIONS.forEach(function (question) {
            const selectedValue = clampAnswer(responses[question.id] || 3);
            const card = document.createElement('article');
            card.className = 't1-question';
            const heading = document.createElement('h3');
            heading.textContent = question.title;
            const prompt = document.createElement('p');
            prompt.textContent = question.prompt;
            const optionRow = document.createElement('div');
            optionRow.className = 't1-option-row';
            question.options.forEach(function (label, index) {
                const answerValue = question.reverseLabels ? 5 - index : index + 1;
                const option = document.createElement('label');
                option.className = 't1-option';
                option.innerHTML =
                    '<input type="radio" name="t1-' + question.id + '" value="' + answerValue + '"' +
                    (selectedValue === answerValue ? ' checked' : '') + '>' +
                    '<span>' + label + '</span>';
                optionRow.appendChild(option);
            });
            card.appendChild(heading);
            card.appendChild(prompt);
            card.appendChild(optionRow);
            grid.appendChild(card);
        });
        renderRefinementSummary();
    }

    function renderVariantOptions(composition) {
        const select = byId('t1-variant-select');
        const note = byId('t1-variant-note');
        const variants = Array.isArray(composition?.variants) ? composition.variants : [];
        const support = composition?.variant_support;
        select.innerHTML = '<option value="__auto__">Recommended baseline</option>';
        if (!support?.enabled || !variants.length) {
            select.disabled = true;
            note.textContent = state.selectedOccupation
                ? 'No reviewed role variants are available for this occupation yet.'
                : 'Select an occupation first to see reviewed role variants.';
            state.selectedVariantId = '__auto__';
            return;
        }

        select.disabled = false;
        if (support.recommended_variant_label) {
            select.options[0].textContent = 'Recommended baseline: ' + support.recommended_variant_label;
        }
        variants.forEach(function (variant) {
            const option = document.createElement('option');
            option.value = variant.variant_id;
            option.textContent = variant.variant_label;
            select.appendChild(option);
        });

        select.value = getSelectedVariantId() || '__auto__';
        if (!Array.from(select.options).some(function (option) { return option.value === select.value; })) {
            select.value = '__auto__';
            state.selectedVariantId = '__auto__';
        }

        if (state.selectedVariantId !== '__auto__' && support.recommended_variant_label && support.selected_variant_label !== support.recommended_variant_label) {
            note.textContent = 'Using ' + support.selected_variant_label + '. The model would currently recommend ' + support.recommended_variant_label + '.';
            return;
        }

        note.textContent = support.selected_variant_summary
            ? support.selected_variant_label + ': ' + support.selected_variant_summary
            : 'Keep the recommended reviewed baseline unless this occupation clearly maps to a different variant.';
    }

    function refreshAdjustmentInputs() {
        if (!state.engine || !state.selectedOccupation) {
            renderVariantOptions(null);
            renderRefinementSummary();
            state.compositionState = null;
            renderCompositionEditor();
            return;
        }
        const composition = state.engine.getRoleComposition(state.selectedOccupation.occupation_id, {
            questionnaireProfile: getQuestionnaireProfile(),
            roleVariantId: getSelectedVariantId(),
            compositionEdits: state.compositionState?.occupationId === state.selectedOccupation.occupation_id ? getCompositionEdits() : undefined
        });
        renderVariantOptions(composition);
        renderRefinementSummary();
        const previousState = state.compositionState?.occupationId === state.selectedOccupation.occupation_id && hasCompositionCustomization(state.compositionState)
            ? state.compositionState
            : null;
        state.compositionState = createCompositionState(composition, previousState);
        renderCompositionEditor();
    }

    function createEditorItem(row, kind) {
        const item = document.createElement('article');
        item.className = 't1-editor-item';
        const body = document.createElement('div');
        body.className = 't1-editor-item-body';
        const title = document.createElement('strong');
        title.textContent = kind === 'function'
            ? truncateLabel(row.role_summary || row.function_statement || 'Unnamed function', 96)
            : truncateLabel(row.task_statement || 'Unnamed task', 108);
        const meta = document.createElement('p');
        meta.textContent = kind === 'function'
            ? Math.round((Number(row.function_weight) || 0) * 100) + '% function weight'
            : (row.task_family_label || 'Task') + ' | baseline ' + Math.round((Number(row.time_share_prior) || 0) * 100) + '% share';
        body.appendChild(title);
        body.appendChild(meta);

        if (kind !== 'function') {
            const shareLabel = document.createElement('label');
            shareLabel.className = 't1-inline-input';
            shareLabel.innerHTML = '<span>Role share</span>';
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '100';
            input.step = '1';
            input.dataset.action = 'share';
            input.dataset.taskId = row.task_id;
            const overrideValue = Number(state.compositionState?.taskShareOverrides?.[row.task_id]);
            if (Number.isFinite(overrideValue) && overrideValue > 0) {
                input.value = String(Math.round(overrideValue * 100));
            }
            input.placeholder = String(Math.round((Number(row.time_share_prior) || 0) * 100));
            shareLabel.appendChild(input);
            body.appendChild(shareLabel);
        }

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 't1-inline-button';
        remove.dataset.action = 'remove';
        remove.dataset.kind = kind;
        remove.dataset.itemId = kind === 'function' ? row.function_id : row.task_id;
        remove.textContent = 'Remove';

        item.appendChild(body);
        item.appendChild(remove);
        return item;
    }

    function renderEditorBucket(container, label, rows, kind) {
        const section = document.createElement('section');
        section.className = 't1-editor-card';
        const head = document.createElement('div');
        head.className = 't1-editor-card-head';
        head.innerHTML = '<h3>' + label + '</h3><p>' + (rows.length ? rows.length + ' active' : 'No active items') + '</p>';
        const list = document.createElement('div');
        list.className = 't1-editor-list';
        if (!rows.length) {
            list.innerHTML = '<p class="t1-selection-copy">No active items in this part of the role mix.</p>';
        }
        rows.forEach(function (row) {
            list.appendChild(createEditorItem(row, kind));
        });
        section.appendChild(head);
        section.appendChild(list);
        container.appendChild(section);
    }

    function populateEditorSelect(select, rows, kind) {
        select.innerHTML = '<option value="">' + (kind === 'function' ? 'Add function' : 'Add task') + '</option>';
        rows.forEach(function (row) {
            const option = document.createElement('option');
            option.value = kind === 'function' ? row.function_id : row.task_id;
            option.textContent = truncateLabel(kind === 'function' ? (row.role_summary || row.function_statement) : row.task_statement, 92);
            select.appendChild(option);
        });
        select.disabled = !rows.length;
    }

    function renderCompositionEditor() {
        const summary = byId('t1-composition-summary');
        const cards = byId('t1-composition-cards');
        const onetAdd = byId('t1-add-onet-task');
        const postingAdd = byId('t1-add-posting-task');
        const graphAdd = byId('t1-add-graph-task');
        const functionAdd = byId('t1-add-function');
        const supportSource = byId('t1-support-source');
        const supportTarget = byId('t1-support-target');
        const supportList = byId('t1-support-links');
        if (!summary || !cards) return;

        const compositionState = state.compositionState;
        summary.textContent = getCompositionSummaryText();
        cards.innerHTML = '';

        if (!compositionState?.raw) {
            cards.innerHTML = '<p class="t1-selection-copy">Select an occupation to load editable tasks and functions.</p>';
            [onetAdd, postingAdd, graphAdd, functionAdd, supportSource, supportTarget].forEach(function (el) {
                if (el) {
                    el.innerHTML = '<option value="">Select an occupation first</option>';
                    el.disabled = true;
                }
            });
            if (supportList) supportList.innerHTML = '<p class="t1-selection-copy">Support links appear after a role is loaded.</p>';
            return;
        }

        getCompositionTaskBuckets(compositionState.raw).forEach(function (bucket) {
            const selectedRows = bucket.rows.filter(function (row) { return compositionState.selectedTaskIds.has(row.task_id); });
            renderEditorBucket(cards, bucket.label, selectedRows, 'task');
        });
        const selectedFunctions = (compositionState.raw.functions || []).filter(function (row) {
            return compositionState.selectedFunctionIds.has(row.function_id);
        });
        renderEditorBucket(cards, 'Value-defining functions', selectedFunctions, 'function');

        populateEditorSelect(onetAdd, (compositionState.raw.onet_tasks || []).filter(function (row) {
            return !compositionState.selectedTaskIds.has(row.task_id);
        }), 'task');
        populateEditorSelect(postingAdd, (compositionState.raw.reviewed_job_posting_tasks || []).filter(function (row) {
            return !compositionState.selectedTaskIds.has(row.task_id);
        }), 'task');
        populateEditorSelect(graphAdd, (compositionState.raw.reviewed_role_graph_tasks || []).filter(function (row) {
            return !compositionState.selectedTaskIds.has(row.task_id);
        }), 'task');
        populateEditorSelect(functionAdd, (compositionState.raw.functions || []).filter(function (row) {
            return !compositionState.selectedFunctionIds.has(row.function_id);
        }), 'function');

        const selectedTasks = getAllCompositionTasks(compositionState.raw).filter(function (row) {
            return compositionState.selectedTaskIds.has(row.task_id);
        });
        populateEditorSelect(supportSource, selectedTasks, 'task');
        populateEditorSelect(supportTarget, selectedTasks, 'task');

        supportList.innerHTML = '';
        if (!(compositionState.customDependencyEdges || []).length) {
            supportList.innerHTML = '<p class="t1-selection-copy">No custom support links yet. Add one only when a selected task mainly exists to enable another selected task.</p>';
            return;
        }
        compositionState.customDependencyEdges.forEach(function (edge) {
            const sourceTask = selectedTasks.find(function (row) { return row.task_id === edge.from_task_id; });
            const targetTask = selectedTasks.find(function (row) { return row.task_id === edge.to_task_id; });
            const row = document.createElement('div');
            row.className = 't1-support-link';
            row.innerHTML = '<span>' + truncateLabel(sourceTask?.task_statement || 'Unknown task', 60) + ' supports ' + truncateLabel(targetTask?.task_statement || 'Unknown task', 60) + '</span>';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 't1-inline-button';
            button.dataset.action = 'remove-support';
            button.dataset.fromTaskId = edge.from_task_id;
            button.dataset.toTaskId = edge.to_task_id;
            button.textContent = 'Remove';
            row.appendChild(button);
            supportList.appendChild(row);
        });
    }

    function compositionSetForKind(kind) {
        return kind === 'function'
            ? state.compositionState?.selectedFunctionIds
            : state.compositionState?.selectedTaskIds;
    }

    function markPendingEdit() {
        if (!state.selectedOccupation || !state.selectedLevel) return;
        byId('t1-status').textContent = 'Edits are ready. Run analysis to update the verdict.';
    }

    function addCompositionItem(selectId, kind) {
        const select = byId(selectId);
        const itemId = select?.value;
        const set = compositionSetForKind(kind);
        if (!itemId || !set) return;
        set.add(itemId);
        renderCompositionEditor();
        markPendingEdit();
    }

    function removeCompositionItem(kind, itemId) {
        const set = compositionSetForKind(kind);
        if (!set || !itemId) return;
        set.delete(itemId);
        if (kind !== 'function') {
            delete state.compositionState.taskShareOverrides[itemId];
            state.compositionState.customDependencyEdges = (state.compositionState.customDependencyEdges || []).filter(function (edge) {
                return edge.from_task_id !== itemId && edge.to_task_id !== itemId;
            });
        }
        renderCompositionEditor();
        markPendingEdit();
    }

    function updateTaskShare(taskId, rawValue) {
        if (!state.compositionState || !taskId) return;
        if (!rawValue) {
            delete state.compositionState.taskShareOverrides[taskId];
        } else {
            const value = Number(rawValue);
            if (Number.isFinite(value) && value > 0) {
                state.compositionState.taskShareOverrides[taskId] = Math.min(100, value) / 100;
            }
        }
        markPendingEdit();
    }

    function addSupportLink() {
        const source = byId('t1-support-source')?.value;
        const target = byId('t1-support-target')?.value;
        if (!state.compositionState || !source || !target || source === target) return;
        const exists = (state.compositionState.customDependencyEdges || []).some(function (edge) {
            return edge.from_task_id === source && edge.to_task_id === target;
        });
        if (!exists) {
            state.compositionState.customDependencyEdges.push({ from_task_id: source, to_task_id: target });
        }
        renderCompositionEditor();
        markPendingEdit();
    }

    function selectOccupation(occupationId) {
        state.selectedOccupation = state.occupations.find(function (row) { return row.occupation_id === occupationId; }) || null;
        if (!state.selectedOccupation) return;
        byId('t1-occupation-search').value = state.selectedOccupation.title;
        if (state.selectedRoleFamily && state.selectedOccupation.role_family !== state.selectedRoleFamily) {
            state.selectedRoleFamily = state.selectedOccupation.role_family;
            byId('t1-role-family').value = state.selectedRoleFamily;
        }
        syncPrefillResponses(true);
        renderOccupationResults(searchVisibleOccupations(state.selectedOccupation.title, 6));
        updateSelectionCopy();
        renderRefinementQuestions();
        refreshAdjustmentInputs();
        updateRunState();
    }

    function setSelectedLevel(levelValue) {
        state.selectedLevel = String(levelValue || '');
        Array.from(document.querySelectorAll('.t1-level-option')).forEach(function (button) {
            button.classList.toggle('is-selected', button.dataset.level === state.selectedLevel);
        });
        syncPrefillResponses(false);
        renderRefinementQuestions();
        refreshAdjustmentInputs();
        updateRunState();
    }

    function buildHeroSummary(result) {
        const topShrink = anchorLabel(getTopShrinkBundle(result)) || 'Routine execution';
        const topRetain = anchorLabel(getTopRetainedAnchor(result)) || 'judgment and accountability';
        const topEmerging = anchorLabel(getTopEmergingBundle(result));
        const emergingConfidence = Number(result?.task_accession_map?.accession_confidence);
        const emergingSentence = topEmerging && emergingConfidence >= 0.45
            ? topEmerging + ' is the clearest next bundle.'
            : 'No clear next bundle is visible yet.';
        return trimSentence(topShrink + ' shrinks first. ' + topRetain + ' remains the human core. ' + emergingSentence, 220);
    }

    function renderHeroVerdict(result) {
        byId('t1-hero-kicker').textContent = 'Role transformation';
        byId('t1-hero-title').textContent = result.role_fate_label || result.role_outlook_label || 'Role outlook';
        byId('t1-hero-summary').textContent = buildHeroSummary(result);
        byId('t1-hero-context').textContent = (result.selected_occupation_title || 'This role') + ' at level ' + state.selectedLevel + '.';
    }

    function buildSplitRow(label, percent, description, chips) {
        const row = document.createElement('article');
        row.className = 't1-split-row';
        row.innerHTML = '<div class="t1-split-row-head"><h3>' + label + '</h3><strong>' + percent + '</strong></div><p>' + description + '</p>';
        const chipRow = document.createElement('div');
        chipRow.className = 't1-chip-row';
        (chips || []).forEach(function (chipLabel) {
            const chip = document.createElement('span');
            chip.className = 't1-chip';
            chip.textContent = trimSentence(chipLabel, 46);
            chipRow.appendChild(chip);
        });
        row.appendChild(chipRow);
        return row;
    }

    function renderSplit(result) {
        const seat = result.seat_change_map || {};
        const shrinkingPct = formatPercentWhole(seat.shrinking_share_estimate);
        const retainedPct = formatPercentWhole(seat.retained_share_estimate);
        const emergingPct = formatPercentWhole(seat.growing_share_estimate);
        const splitBar = byId('t1-split-bar');
        const splitLegend = byId('t1-split-legend');
        const splitRows = byId('t1-split-rows');
        const topShrinkLabels = uniqueBy(seat.shrinking_bundles || [], function (row) {
            return row.public_label || row.task_cluster_id;
        }).slice(0, 2).map(anchorLabel);
        const retainedLabels = uniqueBy(
            (seat.retained_bundles || []).concat(result.function_metrics?.per_function_breakdown || []),
            function (row) { return anchorLabel(row); }
        ).slice(0, 2).map(anchorLabel);
        const emergingRows = uniqueBy(
            (seat.growing_bundles || []).concat(result.task_accession_map?.accession_clusters || []),
            function (row) { return row.public_label || row.task_cluster_id; }
        ).slice(0, 2);
        const emergingVisible = emergingRows.length > 0 && Number(result?.task_accession_map?.accession_confidence) >= 0.45;

        byId('t1-split-summary').textContent = trimSentence(
            result.narrative_summary?.how_the_seat_rebalances || 'The role splits into shrinking, retained, and emerging work.',
            170
        );

        splitBar.innerHTML = '';
        [
            { label: shrinkingPct, value: Number(seat.shrinking_share_estimate) || 0, tone: 'shrinking' },
            { label: retainedPct, value: Number(seat.retained_share_estimate) || 0, tone: 'retained' },
            { label: emergingPct, value: Number(seat.growing_share_estimate) || 0, tone: 'emerging' }
        ].forEach(function (segment) {
            const node = document.createElement('div');
            node.className = 't1-split-segment t1-split-segment--' + segment.tone;
            node.style.flexBasis = Math.max(segment.value * 100, 6) + '%';
            node.textContent = segment.value >= 0.12 ? segment.label : '';
            splitBar.appendChild(node);
        });

        splitLegend.innerHTML = [
            'Shrinking ' + shrinkingPct,
            'Retained ' + retainedPct,
            'Emerging ' + emergingPct
        ].map(function (label) { return '<span>' + label + '</span>'; }).join('');

        splitRows.innerHTML = '';
        splitRows.appendChild(buildSplitRow(
            'Shrinking',
            shrinkingPct,
            trimSentence(result.narrative_summary?.what_is_under_pressure || 'AI can draft, standardize, or absorb more of this work first.', 140),
            topShrinkLabels.length ? topShrinkLabels : ['No clear shrinking bundle']
        ));
        splitRows.appendChild(buildSplitRow(
            'Retained',
            retainedPct,
            trimSentence(result.narrative_summary?.what_stays_core || 'This work still depends on judgment, accountability, or relationship context.', 140),
            retainedLabels.length ? retainedLabels : ['Human core still visible']
        ));
        splitRows.appendChild(buildSplitRow(
            'Emerging',
            emergingPct,
            emergingVisible
                ? trimSentence(result.narrative_summary?.how_the_work_rebundles || 'This is the work that grows as execution gets cheaper.', 140)
                : 'A clear next bundle is not visible in this run yet.',
            emergingVisible ? emergingRows.map(anchorLabel) : ['Emerging path is still unclear']
        ));
    }

    function shrinkTaskScore(task) {
        const waveBonus = task.wave_assignment === 'current' ? 0.14 : (task.wave_assignment === 'next' ? 0.08 : 0.03);
        return (Number(task.direct_exposure_pressure) || 0) * 0.5
            + (Number(task.exposed_share) || 0) * 0.25
            + (1 - (Number(task.automation_difficulty) || 0)) * 0.15
            + waveBonus;
    }

    function retainTaskScore(task) {
        return (Number(task.retained_leverage) || 0) * 0.55
            + (Number(task.retained_share) || 0) * 0.25
            + (Number(task.automation_difficulty) || 0) * 0.2;
    }

    function describeShrinkTask(task) {
        if (task.wave_assignment === 'current') return 'Current-wave pressure. Easier to standardize or delegate now.';
        if ((Number(task.direct_exposure_pressure) || 0) >= 0.6) return 'High pressure. AI can take more of the first pass here.';
        return 'Pressure rises as the workflow gets cheaper and easier to automate.';
    }

    function describeRetainTask(task) {
        const cluster = String(task.task_cluster_id || '');
        if (/decision|client|relationship|oversight|coordination/.test(cluster)) return 'Still carries judgment, trust, coordination, or sign-off.';
        if ((Number(task.automation_difficulty) || 0) >= 0.55) return 'Harder to substitute cleanly because the work is less standardized.';
        return 'Still helps anchor the role after routine work compresses.';
    }

    function describeEmergingBundle(bundle) {
        return trimSentence(
            bundle.accession_driver || bundle.public_summary || 'This looks like the work most likely to grow as thinner execution leaves the seat.',
            135
        );
    }

    function buildItemList(items, emptyText) {
        const wrapper = document.createElement('div');
        wrapper.className = 't1-item-list';
        if (!items.length) {
            wrapper.innerHTML = '<div class="t1-item"><strong>Unclear in this run</strong><p>' + emptyText + '</p></div>';
            return wrapper;
        }
        const initial = items.slice(0, 4);
        const extra = items.slice(4, 24);
        function appendItems(rows, container) {
            rows.forEach(function (item) {
                const node = document.createElement('article');
                node.className = 't1-item';
                node.innerHTML = '<strong>' + item.label + '</strong><p>' + item.description + '</p>';
                container.appendChild(node);
            });
        }
        appendItems(initial, wrapper);
        if (extra.length) {
            const detail = document.createElement('details');
            detail.className = 't1-inline-detail';
            detail.innerHTML = '<summary>Show ' + extra.length + ' more</summary>';
            const extraWrap = document.createElement('div');
            extraWrap.className = 't1-item-list';
            appendItems(extra, extraWrap);
            detail.appendChild(extraWrap);
            wrapper.appendChild(detail);
        }
        return wrapper;
    }

    function renderWorkChange(result) {
        const tasks = Array.isArray(result.task_breakdown?.tasks) ? result.task_breakdown.tasks.slice() : [];
        const shrinkingItems = uniqueBy(
            tasks.slice().sort(function (left, right) { return shrinkTaskScore(right) - shrinkTaskScore(left); }).map(function (task) {
                return { label: trimSentence(task.task_statement, 82), description: describeShrinkTask(task) };
            }),
            function (item) { return item.label; }
        ).slice(0, 24);
        const retainedItems = uniqueBy(
            tasks.slice().sort(function (left, right) { return retainTaskScore(right) - retainTaskScore(left); }).map(function (task) {
                return { label: trimSentence(task.task_statement, 82), description: describeRetainTask(task) };
            }),
            function (item) { return item.label; }
        ).slice(0, 24);
        const emergingItems = uniqueBy(
            (result.seat_change_map?.growing_bundles || []).concat(result.task_accession_map?.accession_clusters || []).map(function (bundle) {
                return { label: trimSentence(anchorLabel(bundle), 72), description: describeEmergingBundle(bundle) };
            }),
            function (item) { return item.label; }
        ).slice(0, 24);

        byId('t1-shrink-intro').textContent = trimSentence(
            result.narrative_summary?.what_is_under_pressure || 'These are the parts of the work most likely to thin out first.',
            140
        );
        byId('t1-retain-intro').textContent = trimSentence(
            result.narrative_summary?.what_stays_core || 'These are the parts that still require human ownership.',
            140
        );
        byId('t1-emerge-intro').textContent = getTopEmergingBundle(result)
            ? trimSentence(result.narrative_summary?.how_the_work_rebundles || 'This is the clearest next bundle in the role.', 140)
            : 'A clear next bundle is not visible in this run yet.';

        byId('t1-shrink-list').innerHTML = '';
        byId('t1-retain-list').innerHTML = '';
        byId('t1-emerge-list').innerHTML = '';
        byId('t1-shrink-list').appendChild(buildItemList(shrinkingItems, 'The model does not show a dominant early-loss bundle here.'));
        byId('t1-retain-list').appendChild(buildItemList(retainedItems, 'The role still looks broad rather than anchored by one obvious human core.'));
        byId('t1-emerge-list').appendChild(buildItemList(emergingItems, 'The emerging direction is still uncertain, so the page avoids inventing a next role shape.'));
    }

    function taskMapTone(task) {
        const mode = String(task?.likely_mode || '').toLowerCase();
        if (mode === 'shrinks') return { key: 'shrinks', label: 'Shrinking', color: 'oklch(0.66 0.13 55)' };
        if (mode === 'grows') return { key: 'grows', label: 'Emerging', color: 'var(--signal)' };
        return { key: 'stays', label: 'Retained', color: 'var(--ink-strong)' };
    }

    function renderTaskMapDetail(task) {
        const detail = byId('t1-taskmap-detail');
        if (!detail) return;
        if (!task) {
            detail.innerHTML = '<h3>Select a task</h3><p>Tap any bubble to see what is under pressure, what still anchors the role, and how strong the evidence looks.</p>';
            return;
        }
        const tone = taskMapTone(task);
        detail.innerHTML =
            '<div class="t1-taskmap-kicker">' + tone.label + ' task</div>' +
            '<h3>' + truncateLabel(task.task_statement || 'Unnamed task', 140) + '</h3>' +
            '<p>' + truncateLabel(task.public_task_cluster_label || task.task_cluster_label || 'Task cluster', 120) + '</p>' +
            '<div class="t1-taskmap-metrics">' +
                '<div><span>Role share</span><strong>' + formatPercentWhole(task.share_of_role) + '</strong></div>' +
                '<div><span>Direct pressure</span><strong>' + formatPercentWhole(task.direct_exposure_pressure) + '</strong></div>' +
                '<div><span>Retained leverage</span><strong>' + formatPercentWhole(task.retained_leverage) + '</strong></div>' +
                '<div><span>Spillover</span><strong>' + formatPercentWhole(task.indirect_dependency_pressure) + '</strong></div>' +
                '<div><span>Wave</span><strong>' + formatRoleFamily(task.wave_assignment || 'mixed') + '</strong></div>' +
                '<div><span>Evidence</span><strong>' + trimSentence(task.evidence_source || task.evidence_type || 'Runtime fallback', 28) + '</strong></div>' +
            '</div>';
    }

    function renderTaskMap(result) {
        const tasks = Array.isArray(result.task_breakdown?.tasks) ? result.task_breakdown.tasks.slice() : [];
        const points = byId('t1-taskmap-points');
        const legend = byId('t1-taskmap-legend');
        const caption = byId('t1-taskmap-caption');
        const summary = byId('t1-taskmap-summary');
        const list = byId('t1-taskmap-list');
        if (!points || !legend || !caption || !summary || !list) return;

        points.innerHTML = '';
        legend.innerHTML = '';
        list.innerHTML = '';
        if (!tasks.length) {
            caption.textContent = 'Run the role to see the task map.';
            summary.textContent = 'The map appears after analysis.';
            renderTaskMapDetail(null);
            return;
        }

        const xMedian = tasks.map(function (task) { return Number(task.direct_exposure_pressure) || 0; }).sort(function (a, b) { return a - b; })[Math.floor(tasks.length / 2)] || 0;
        const yMedian = tasks.map(function (task) { return Number(task.retained_leverage) || 0; }).sort(function (a, b) { return a - b; })[Math.floor(tasks.length / 2)] || 0;
        let selectedTask = tasks.find(function (task) { return task.task_id === state.selectedTaskMapId; }) || null;
        if (!selectedTask) {
            selectedTask = tasks.slice().sort(function (left, right) {
                return ((Number(right.direct_exposure_pressure) || 0) + (Number(right.share_of_role) || 0))
                    - ((Number(left.direct_exposure_pressure) || 0) + (Number(left.share_of_role) || 0));
            })[0] || tasks[0];
            state.selectedTaskMapId = selectedTask?.task_id || null;
        }

        tasks.forEach(function (task) {
            const tone = taskMapTone(task);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 't1-taskmap-point';
            if (task.task_id === state.selectedTaskMapId) button.classList.add('is-selected');
            button.style.left = ((Number(task.direct_exposure_pressure) || 0) * 100) + '%';
            button.style.top = (100 - ((Number(task.retained_leverage) || 0) * 100)) + '%';
            button.style.width = (18 + ((Number(task.share_of_role) || 0) * 44)) + 'px';
            button.style.height = (18 + ((Number(task.share_of_role) || 0) * 44)) + 'px';
            button.style.background = tone.color;
            button.title = (task.task_statement || 'Task') + ' | pressure ' + formatPercentWhole(task.direct_exposure_pressure) + ' | retained leverage ' + formatPercentWhole(task.retained_leverage);
            button.setAttribute('aria-label', button.title);
            button.addEventListener('click', function () {
                state.selectedTaskMapId = task.task_id;
                renderTaskMap(result);
            });
            points.appendChild(button);
        });

        [
            { label: 'Shrinking', color: 'oklch(0.66 0.13 55)' },
            { label: 'Retained', color: 'var(--ink-strong)' },
            { label: 'Emerging', color: 'var(--signal)' }
        ].forEach(function (entry) {
            const item = document.createElement('span');
            item.className = 't1-taskmap-legend-item';
            item.innerHTML = '<i style="background:' + entry.color + '"></i><span>' + entry.label + '</span>';
            legend.appendChild(item);
        });

        const exposedCount = tasks.filter(function (task) {
            return (Number(task.direct_exposure_pressure) || 0) >= xMedian && (Number(task.retained_leverage) || 0) < yMedian;
        }).length;
        caption.textContent = 'Each bubble is a task. Right means more pressure. Higher means more retained human leverage.';
        summary.textContent = exposedCount + ' of ' + tasks.length + ' tasks sit in the higher-pressure, lower-leverage corner of this role.';
        renderTaskMapDetail(selectedTask);

        const topRows = tasks.slice().sort(function (left, right) {
            return (Number(right.share_of_role) || 0) - (Number(left.share_of_role) || 0);
        });
        const initialRows = topRows.slice(0, 8);
        const extraRows = topRows.slice(8);
        function appendRows(rows, target) {
            rows.forEach(function (task) {
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 't1-taskmap-row';
                if (task.task_id === state.selectedTaskMapId) row.classList.add('is-selected');
                row.innerHTML =
                    '<strong>' + truncateLabel(task.task_statement || 'Unnamed task', 96) + '</strong>' +
                    '<span>' + formatPercentWhole(task.share_of_role) + ' role share | ' + formatPercentWhole(task.direct_exposure_pressure) + ' pressure | ' + formatPercentWhole(task.retained_leverage) + ' retained</span>';
                row.addEventListener('click', function () {
                    state.selectedTaskMapId = task.task_id;
                    renderTaskMap(result);
                });
                target.appendChild(row);
            });
        }
        appendRows(initialRows, list);
        if (extraRows.length) {
            const detail = document.createElement('details');
            detail.className = 't1-inline-detail';
            detail.innerHTML = '<summary>Show ' + extraRows.length + ' more tasks</summary>';
            const wrap = document.createElement('div');
            wrap.className = 't1-taskmap-list';
            appendRows(extraRows, wrap);
            detail.appendChild(wrap);
            list.appendChild(detail);
        }
    }

    function buildRecommendations(result) {
        const recommendations = [];
        const topShrink = anchorLabel(getTopShrinkBundle(result));
        const topRetain = anchorLabel(getTopRetainedAnchor(result));
        const topEmerging = getTopEmergingBundle(result);
        const emergingKind = String(topEmerging?.accession_kind || '').toLowerCase();
        const fragmentation = Number(result?.function_metrics?.role_fragmentation_risk) || 0;
        const fateState = String(result.role_fate_state || '').toLowerCase();

        if (topEmerging) {
            let lead = 'Move closer to the next visible bundle.';
            if (emergingKind === 'relationship') lead = 'Move closer to live stakeholder handling and negotiation.';
            if (emergingKind === 'governance') lead = 'Move closer to approval, policy, and sign-off.';
            if (emergingKind === 'review') lead = 'Move closer to review, quality gates, and exception handling.';
            if (emergingKind === 'integration') lead = 'Move closer to workflow design and cross-team coordination.';
            if (emergingKind === 'exception') lead = 'Move closer to exceptions, triage, and ambiguous cases.';
            recommendations.push({
                title: lead,
                body: trimSentence(anchorLabel(topEmerging) + ' is the clearest growth lane in this run.', 135)
            });
        }

        recommendations.push({
            title: 'Treat ' + (topShrink || 'routine execution') + ' as AI-assisted work.',
            body: 'Shift your value from first-pass throughput to review, exceptions, and decisions.'
        });

        if (fragmentation >= 0.5 || fateState === 'elevated' || fateState === 'split') {
            recommendations.push({
                title: 'Prepare for a more senior version of the role.',
                body: 'Visibility, judgment, escalation, and approval matter more than raw execution volume here.'
            });
        } else if (fateState === 'compressed') {
            recommendations.push({
                title: 'Own workflows, not just outputs.',
                body: 'Roles like this thin fastest when the value stays at execution only.'
            });
        } else if (fateState === 'expanded') {
            recommendations.push({
                title: 'Use AI to increase span, not just speed.',
                body: 'Demand is still holding, so the advantage is carrying more complex work per seat.'
            });
        } else {
            recommendations.push({
                title: 'Protect the human core of the seat.',
                body: trimSentence((topRetain || 'Judgment and accountability') + ' is still carrying the clearest human case for the role.', 135)
            });
        }

        return recommendations.slice(0, 3);
    }

    function renderRecommendations(result) {
        const container = byId('t1-recommendations');
        container.innerHTML = '';
        buildRecommendations(result).forEach(function (item) {
            const card = document.createElement('article');
            card.className = 't1-recommendation';
            card.innerHTML = '<strong>' + item.title + '</strong><p>' + item.body + '</p>';
            container.appendChild(card);
        });
    }

    function renderEvidence(result) {
        const evidence = result.evidence_summary || {};
        const metricContainer = byId('t1-evidence-metrics');
        metricContainer.innerHTML = '';
        [
            ['Task evidence', formatPercentWhole(evidence.task_evidence_confidence)],
            ['Occupation anchor', formatPercentWhole(evidence.occupation_anchor_confidence)],
            ['Personalization', formatPercentWhole(evidence.personalization_confidence)],
            ['Thin evidence guardrail', evidence.thin_evidence_guardrail?.active ? 'Active' : 'Inactive']
        ].forEach(function (entry) {
            const card = document.createElement('article');
            card.className = 't1-metric-card';
            card.innerHTML = '<span>' + entry[0] + '</span><strong>' + entry[1] + '</strong>';
            metricContainer.appendChild(card);
        });

        const notes = evidence.notes || [];
        byId('t1-evidence-copy').textContent = trimSentence(
            notes[0] || evidence.explanation_summary || 'This run combines direct task evidence, occupation anchors, and live model confidence checks.',
            220
        );

        const citations = result.audit_trace?.evidence_citations || [];
        const sourceList = byId('t1-source-list');
        sourceList.innerHTML = '';
        if (!citations.length) {
            sourceList.innerHTML = '<article class="t1-source-item"><strong>No direct citations in this run</strong><p>The role still has a modeled answer, but the page is not surfacing citation-level evidence here.</p></article>';
            return;
        }
        citations.slice(0, 6).forEach(function (citation) {
            const item = document.createElement('article');
            item.className = 't1-source-item';
            item.innerHTML =
                '<strong>' + trimSentence(citation.task_statement, 98) + '</strong>' +
                '<p>' + sourceLabel(citation.evidence_source_id) + ' | reliability ' + formatPercentWhole(citation.reliability) + '</p>' +
                '<span class="t1-source-meta">' + citation.task_source_label + '</span>';
            sourceList.appendChild(item);
        });
    }

    function renderMethod(result) {
        const evidence = result.evidence_summary || {};
        const methodGrid = byId('t1-method-grid');
        methodGrid.innerHTML = '';
        [
            ['Score shape', 'Task pressure plus retained human leverage', 'The verdict is a role transformation readout, not a raw exposure score.'],
            ['Task weighting', ((result.task_breakdown?.tasks || []).length || 0) + ' tasks in the active role mix', 'Each task keeps a share of role weight instead of counting equally.'],
            ['Support links', 'Dependency spillover is active', 'Pressure can propagate when one task mainly exists to support another.'],
            ['Fallback logic', evidence.thin_evidence_guardrail?.active ? 'Guardrail active' : 'Guardrail inactive', evidence.thin_evidence_guardrail?.note || 'When task evidence is thin, the model shrinks toward cluster and occupation priors instead of pretending certainty.']
        ].forEach(function (entry) {
            const card = document.createElement('article');
            card.className = 't1-method-card';
            card.innerHTML = '<span>' + entry[0] + '</span><strong>' + entry[1] + '</strong><p>' + entry[2] + '</p>';
            methodGrid.appendChild(card);
        });

        byId('t1-method-copy').textContent = trimSentence(
            result.audit_trace?.export_summary || evidence.explanation_summary || 'The model scores task pressure, support spillover, retained function, and role recomposition using the live occupation data.',
            260
        );
    }

    function classifyPercentile(percentile) {
        if (percentile >= 0.67) return 'upper';
        if (percentile <= 0.33) return 'lower';
        return 'middle';
    }

    function percentileOf(values, current) {
        if (!values.length) return 0.5;
        const sorted = values.slice().sort(function (left, right) { return left - right; });
        let count = 0;
        sorted.forEach(function (value) { if (value <= current) count += 1; });
        return count / sorted.length;
    }

    async function getComparisonMetrics(level) {
        const key = String(level || '1');
        if (state.comparisonCache.has(key)) return state.comparisonCache.get(key);
        const rows = state.occupations.map(function (occupation) {
            const result = state.engine.computeResult({
                occupationId: occupation.occupation_id,
                roleCategory: occupation.role_family,
                seniorityLevel: Number(key)
            });
            return {
                pressure: Number(result.diagnostics?.direct_exposure_pressure) || 0,
                leverage: Number(result.function_metrics?.retained_bargaining_power) || 0
            };
        });
        state.comparisonCache.set(key, rows);
        return rows;
    }

    async function renderComparison(result) {
        const currentPressure = Number(result.diagnostics?.direct_exposure_pressure) || 0;
        const currentLeverage = Number(result.function_metrics?.retained_bargaining_power) || 0;
        byId('t1-compare-summary').textContent = 'Calculating where this role sits against the full occupation set.';
        const rows = await getComparisonMetrics(state.selectedLevel);
        const pressureBand = classifyPercentile(percentileOf(rows.map(function (row) { return row.pressure; }), currentPressure));
        const leverageBand = classifyPercentile(percentileOf(rows.map(function (row) { return row.leverage; }), currentLeverage));
        let sentence = 'This role sits in the middle of the occupation set.';
        if (pressureBand === 'upper' && leverageBand === 'upper') sentence = 'This role faces higher-than-average pressure, but it still keeps above-average human leverage.';
        else if (pressureBand === 'upper' && leverageBand !== 'upper') sentence = 'This role sits closer to the exposed side of the occupation set than most.';
        else if (pressureBand !== 'upper' && leverageBand === 'upper') sentence = 'This role still looks more anchored than most roles in the model.';
        else if (pressureBand === 'lower' && leverageBand === 'lower') sentence = 'This role sits in a quieter part of the occupation set, without a strong human edge or strong immediate pressure.';
        byId('t1-compare-summary').textContent = sentence;
    }

    function syncUserResultToMap(result, occupationId) {
        let attempts = 0;
        function push() {
            if (typeof window.occupationMapSetUserResult === 'function') {
                window.occupationMapSetUserResult(result, occupationId);
                return;
            }
            if (attempts >= 30) return;
            attempts += 1;
            window.setTimeout(push, 180);
        }
        push();
    }

    function renderAll(result) {
        state.result = result;
        renderHeroVerdict(result);
        renderSplit(result);
        renderWorkChange(result);
        renderTaskMap(result);
        renderRecommendations(result);
        renderEvidence(result);
        renderMethod(result);
        byId('t1-results').hidden = false;
        syncUserResultToMap(result, state.selectedOccupation?.occupation_id);
        void renderComparison(result);
    }

    async function runAnalysis() {
        if (!state.engine || !state.selectedOccupation || !state.selectedLevel) return;
        byId('t1-run-analysis').disabled = true;
        byId('t1-status').textContent = 'Running analysis...';
        try {
            const result = state.engine.computeResult({
                occupationId: state.selectedOccupation.occupation_id,
                roleCategory: state.selectedOccupation.role_family,
                seniorityLevel: Number(state.selectedLevel),
                questionnaireProfile: getQuestionnaireProfile(),
                roleVariantId: getSelectedVariantId(),
                compositionEdits: getCompositionEdits(),
                dependencyEdits: getDependencyEdits()
            });
            renderAll(result);
            byId('t1-status').textContent = 'Analysis updated.';
        } catch (error) {
            console.error('[test1] Analysis failed', error);
            byId('t1-status').textContent = 'The role could not be analyzed on this page.';
        } finally {
            updateRunState(byId('t1-status').textContent);
        }
    }

    async function init() {
        const familySelect = byId('t1-role-family');
        const searchInput = byId('t1-occupation-search');
        const resultsEl = byId('t1-occupation-results');
        const runButton = byId('t1-run-analysis');
        const variantSelect = byId('t1-variant-select');
        const prefillToggle = byId('t1-prefill-questions');
        const compositionCards = byId('t1-composition-cards');

        Array.from(document.querySelectorAll('.t1-level-option')).forEach(function (button) {
            button.addEventListener('click', function () { setSelectedLevel(button.dataset.level); });
        });
        familySelect.addEventListener('change', function () {
            state.selectedRoleFamily = familySelect.value || '';
            if (state.selectedOccupation && state.selectedRoleFamily && state.selectedOccupation.role_family !== state.selectedRoleFamily) {
                state.selectedOccupation = null;
                state.selectedVariantId = '__auto__';
                searchInput.value = '';
                updateSelectionCopy();
                refreshAdjustmentInputs();
            }
            renderOccupationResults(searchVisibleOccupations(searchInput.value, 8));
            updateRunState();
        });
        resultsEl.addEventListener('click', function (event) {
            const target = event.target instanceof Element ? event.target.closest('.t1-search-option') : null;
            if (target) selectOccupation(target.dataset.occupationId);
        });
        searchInput.addEventListener('input', function () {
            if (!state.engine) return;
            renderOccupationResults(searchVisibleOccupations(searchInput.value, 8));
        });
        prefillToggle.addEventListener('change', function () {
            if (prefillToggle.checked) {
                syncPrefillResponses(true);
                renderRefinementQuestions();
                refreshAdjustmentInputs();
            }
        });
        variantSelect.addEventListener('change', function () {
            state.selectedVariantId = variantSelect.value || '__auto__';
            refreshAdjustmentInputs();
            markPendingEdit();
        });
        byId('t1-refinement-grid').addEventListener('change', function (event) {
            const target = event.target;
            if (!(target instanceof HTMLInputElement) || target.type !== 'radio') return;
            const questionId = String(target.name || '').replace(/^t1-/, '');
            if (!questionId) return;
            prefillToggle.checked = false;
            state.refinementResponses = { ...getActiveResponses(), [questionId]: clampAnswer(target.value) };
            renderRefinementQuestions();
            refreshAdjustmentInputs();
            markPendingEdit();
        });
        compositionCards.addEventListener('click', function (event) {
            const target = event.target instanceof Element ? event.target.closest('[data-action="remove"]') : null;
            if (!target) return;
            removeCompositionItem(target.dataset.kind, target.dataset.itemId);
        });
        compositionCards.addEventListener('change', function (event) {
            const target = event.target;
            if (!(target instanceof HTMLInputElement) || target.dataset.action !== 'share') return;
            updateTaskShare(target.dataset.taskId, target.value);
        });
        byId('t1-add-onet-button').addEventListener('click', function () { addCompositionItem('t1-add-onet-task', 'task'); });
        byId('t1-add-posting-button').addEventListener('click', function () { addCompositionItem('t1-add-posting-task', 'task'); });
        byId('t1-add-graph-button').addEventListener('click', function () { addCompositionItem('t1-add-graph-task', 'task'); });
        byId('t1-add-function-button').addEventListener('click', function () { addCompositionItem('t1-add-function', 'function'); });
        byId('t1-add-support-link').addEventListener('click', addSupportLink);
        byId('t1-support-links').addEventListener('click', function (event) {
            const target = event.target instanceof Element ? event.target.closest('[data-action="remove-support"]') : null;
            if (!target || !state.compositionState) return;
            state.compositionState.customDependencyEdges = (state.compositionState.customDependencyEdges || []).filter(function (edge) {
                return !(edge.from_task_id === target.dataset.fromTaskId && edge.to_task_id === target.dataset.toTaskId);
            });
            renderCompositionEditor();
            markPendingEdit();
        });
        byId('t1-rerun-edits').addEventListener('click', function () { void runAnalysis(); });
        runButton.addEventListener('click', function () { void runAnalysis(); });

        setHeroIntro();
        renderRefinementQuestions();
        renderCompositionEditor();
        updateRunState();

        try {
            state.engine = await window.DLYJV2.create({ basePath: '.' });
            state.occupations = state.engine.listOccupations();
            renderRoleFamilies();
            renderOccupationResults(searchVisibleOccupations('', 8));
            refreshAdjustmentInputs();
            updateRunState('Select a role and level.');
        } catch (error) {
            console.error('[test1] Engine failed to load', error);
            byId('t1-status').textContent = 'The role model could not load on this page.';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        void init();
    }
})();
