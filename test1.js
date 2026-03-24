(function () {
    const state = { engine: null, occupations: [], selectedOccupation: null, selectedLevel: null, comparisonCache: new Map() };
    const sourceLabelMap = {
        src_openai_gpts_are_gpts_2023: 'OpenAI task benchmark',
        src_anthropic_ei_2026_01_15: 'Anthropic Economic Index',
        src_reviewed_task_scoring_2026_03: 'Reviewed task scoring'
    };

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

    function selectOccupation(occupationId) {
        state.selectedOccupation = state.occupations.find(function (row) { return row.occupation_id === occupationId; }) || null;
        if (!state.selectedOccupation) return;
        byId('t1-occupation-search').value = state.selectedOccupation.title;
        renderOccupationResults(state.engine.searchOccupations(state.selectedOccupation.title, 6));
        updateSelectionCopy();
        updateRunState();
    }

    function setSelectedLevel(levelValue) {
        state.selectedLevel = String(levelValue || '');
        Array.from(document.querySelectorAll('.t1-level-option')).forEach(function (button) {
            button.classList.toggle('is-selected', button.dataset.level === state.selectedLevel);
        });
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
                seniorityLevel: Number(state.selectedLevel)
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
        const searchInput = byId('t1-occupation-search');
        const resultsEl = byId('t1-occupation-results');
        const runButton = byId('t1-run-analysis');

        Array.from(document.querySelectorAll('.t1-level-option')).forEach(function (button) {
            button.addEventListener('click', function () { setSelectedLevel(button.dataset.level); });
        });
        resultsEl.addEventListener('click', function (event) {
            const target = event.target instanceof Element ? event.target.closest('.t1-search-option') : null;
            if (target) selectOccupation(target.dataset.occupationId);
        });
        searchInput.addEventListener('input', function () {
            if (!state.engine) return;
            const query = searchInput.value.trim();
            renderOccupationResults(query ? state.engine.searchOccupations(query, 8) : state.occupations.slice(0, 8));
        });
        runButton.addEventListener('click', function () { void runAnalysis(); });

        setHeroIntro();
        updateRunState();

        try {
            state.engine = await window.DLYJV2.create({ basePath: '.' });
            state.occupations = state.engine.listOccupations();
            renderOccupationResults(state.occupations.slice(0, 8));
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
