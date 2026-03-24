(function () {
    function parseCsv(text) {
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

        if (!rows.length) {
            return [];
        }

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

    function toNumber(value, fallback) {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        const numeric = Number(String(value).trim());
        return Number.isFinite(numeric) ? numeric : fallback;
    }

    function average(values, fallback) {
        const filtered = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
        if (!filtered.length) {
            return fallback;
        }
        return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
    }

    function metric(value) {
        const numeric = toNumber(value, null);
        return numeric === null ? null : Number(numeric.toFixed(3));
    }

    function median(values) {
        var sorted = values.slice().sort(function (a, b) { return a - b; });
        if (!sorted.length) { return 0.5; }
        var mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function buildLegendMarkup(fatePalette) {
        return Object.values(fatePalette).map((entry) => (
            '<span class="occupation-map-legend-item">' +
                '<span class="occupation-map-legend-swatch" style="background:' + entry.color + ';"></span>' +
                '<span>' + entry.label + '</span>' +
            '</span>'
        )).join('');
    }

    function extractMetricsFromResult(result) {
        var waveTrajectory = result && result.wave_trajectory ? result.wave_trajectory : {};
        var workflowCompression = metric(result && result.recomposition_summary ? result.recomposition_summary.workflow_compression : null);
        var organizationalConversion = metric(result && result.recomposition_summary ? result.recomposition_summary.organizational_conversion : null);
        var directExposurePressure = metric(result && result.diagnostics ? result.diagnostics.direct_exposure_pressure : null);
        var indirectDependencyPressure = metric(result && result.diagnostics ? result.diagnostics.indirect_dependency_pressure : null);
        var residualRoleIntegrity = metric(result && result.diagnostics ? result.diagnostics.residual_role_integrity : null);
        var retainedAccountability = metric(result && result.function_metrics ? result.function_metrics.retained_accountability_strength : null);
        var retainedBargaining = metric(result && result.function_metrics ? result.function_metrics.retained_bargaining_power : null);
        var roleFragmentationRisk = metric(result && result.function_metrics ? result.function_metrics.role_fragmentation_risk : null);
        var headcountDisplacementRisk = metric(result && result.function_metrics ? result.function_metrics.headcount_displacement_risk : null);
        var demandExpansionModifier = metric(result && result.diagnostics ? result.diagnostics.demand_expansion_modifier : null);
        var currentWaveRetained = metric(waveTrajectory.current ? waveTrajectory.current.retained_share : null);
        var currentWaveCoherence = metric(waveTrajectory.current ? waveTrajectory.current.coherence : null);
        var nextWaveRetained = metric(waveTrajectory.next ? waveTrajectory.next.retained_share : null);
        var nextWaveCoherence = metric(waveTrajectory.next ? waveTrajectory.next.coherence : null);
        var distantWaveRetained = metric(waveTrajectory.distant ? waveTrajectory.distant.retained_share : null);
        var distantWaveCoherence = metric(waveTrajectory.distant ? waveTrajectory.distant.coherence : null);
        return {
            pressure_index: metric(average([directExposurePressure, workflowCompression, headcountDisplacementRisk], 0.5)),
            workflow_compression: workflowCompression,
            direct_exposure_pressure: directExposurePressure,
            indirect_dependency_pressure: indirectDependencyPressure,
            headcount_displacement_risk: headcountDisplacementRisk,
            organizational_conversion: organizationalConversion,
            human_core_strength: metric(average([retainedAccountability, retainedBargaining, residualRoleIntegrity], 0.5)),
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

    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function fetchCsv(url, required) {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            if (required) {
                throw new Error('Failed to load ' + url + ' (' + response.status + ')');
            }
            return [];
        }
        return parseCsv(await response.text());
    }

    async function waitForGuideDeps(timeoutMs) {
        const timeout = typeof timeoutMs === 'number' ? timeoutMs : 5000;
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeout) {
            if (
                window.DLYJV2 &&
                typeof window.DLYJV2.create === 'function' &&
                window.WWILMJ_PRESETS &&
                typeof window.WWILMJ_PRESETS.buildQuestionnaireProfilePreset === 'function'
            ) {
                return true;
            }
            await wait(50);
        }
        return false;
    }

    async function initOccupationMap() {
        const plot = document.getElementById('occupation-map-plot');
        const pointsLayer = document.getElementById('occupation-map-points');
        const status = document.getElementById('occupation-map-status');
        const detail = document.getElementById('occupation-map-detail');
        const viewSelect = document.getElementById('occupation-map-view');
        const xSelect = document.getElementById('occupation-map-x');
        const ySelect = document.getElementById('occupation-map-y');
        const showLabelsToggle = document.getElementById('occupation-map-show-labels');
        const sizeEmploymentToggle = document.getElementById('occupation-map-size-employment');
        const xTitle = document.getElementById('occupation-map-x-title');
        const yTitle = document.getElementById('occupation-map-y-title');
        const caption = document.getElementById('occupation-map-caption');
        const midlineX = document.querySelector('.occupation-map-midline--x');
        const midlineY = document.querySelector('.occupation-map-midline--y');
        const legendContainer = document.getElementById('occupation-map-legend');

        const surface = plot ? plot.querySelector('.occupation-map-surface') : null;
        let mapZoom = 1, mapPanX = 0, mapPanY = 0;
        let isDragging = false, dragStartX = 0, dragStartY = 0, dragStartPanX = 0, dragStartPanY = 0;

        if (!plot || !pointsLayer || !status || !detail || !xSelect || !ySelect || !xTitle || !yTitle || !caption) {
            return;
        }

        plot.classList.add('is-loading');
        if (surface) {
            surface.style.transformOrigin = '0 0';
            surface.style.transform = 'translate(0px, 0px) scale(1)';
        }
        status.textContent = 'Loading occupation data\u2026';

        const depsReady = await waitForGuideDeps();
        if (!depsReady) {
            plot.classList.remove('is-loading');
            status.textContent = 'The live occupation map could not start because the guide dependencies did not load.';
            return;
        }

        const structuralAxes = [
            { key: 'pressure_index', label: 'Pressure index', description: 'Average of direct pressure, workflow compression, and headcount displacement risk.' },
            { key: 'workflow_compression', label: 'Workflow compression', description: 'How much of the role looks easier to compress as workflows get cheaper or faster.' },
            { key: 'direct_exposure_pressure', label: 'Direct task pressure', description: 'How much current AI can touch the work more directly.' },
            { key: 'indirect_dependency_pressure', label: 'Spillover pressure', description: 'How much nearby workflow compression weakens the work.' },
            { key: 'headcount_displacement_risk', label: 'Headcount displacement risk', description: 'How much of the pressure looks more likely to turn into fewer labor hours.' },
            { key: 'organizational_conversion', label: 'Organizational conversion', description: 'How readily technical pressure converts into workflow change inside the firm.' },
            { key: 'human_core_strength', label: 'Human core strength', description: 'Average of retained accountability, bargaining power, and residual role integrity.' },
            { key: 'retained_accountability_strength', label: 'Human accountability', description: 'How much real sign-off and authority still sits with the human role.' },
            { key: 'retained_bargaining_power', label: 'Bargaining leverage', description: 'How much scarce leverage the remaining work still gives the role.' },
            { key: 'residual_role_integrity', label: 'Residual role integrity', description: 'How coherent the human-owned role still looks after pressure is applied.' },
            { key: 'role_fragmentation_risk', label: 'Fragmentation risk', description: 'How likely the role is to split into execution and oversight tiers.' },
            { key: 'demand_expansion_modifier', label: 'Demand growth modifier', description: 'Late-stage BLS growth nudge used in the fate classifier.' }
        ];

        const fatePalette = {
            augmented: { color: '#7b8f58', label: 'Your role stays intact — AI assists, you still lead' },
            compressed: { color: '#a95f3f', label: 'The work survives, but fewer people will do it' },
            elevated: { color: '#6d7d9a', label: 'Execution is leaving this role. Judgment is what stays.' },
            split: { color: '#8a6bb1', label: 'Your role is splitting into two different seats' },
            expanded: { color: '#4d8a6c', label: 'Demand for this role is growing alongside AI' },
            collapsed: { color: '#8f4a42', label: 'The standalone seat here is weakening' },
            mixed_transition: { color: '#7a6d5d', label: 'The path forward for this role is still unsettled' }
        };
        const viewPresets = {
            pressure_vs_bargaining: {
                x: 'direct_exposure_pressure',
                y: 'retained_bargaining_power',
                quadrants: ['Anchored', 'Contested', 'Residual', 'Exposed']
            },
            pressure_vs_accountability: {
                x: 'direct_exposure_pressure',
                y: 'retained_accountability_strength',
                quadrants: ['Anchored', 'Contested', 'Residual', 'Exposed']
            },
            compression_vs_integrity: {
                x: 'workflow_compression',
                y: 'residual_role_integrity',
                quadrants: ['Stable core', 'Stressed core', 'Low-stakes work', 'Integrity risk']
            },
            fragmentation_vs_bargaining: {
                x: 'role_fragmentation_risk',
                y: 'retained_bargaining_power',
                quadrants: ['Anchored', 'Fragile anchor', 'Loose role', 'Split risk']
            },
            pressure_vs_conversion: {
                x: 'headcount_displacement_risk',
                y: 'organizational_conversion',
                quadrants: ['Slow change', 'Convertible risk', 'Latent risk', 'Fast conversion']
            }
        };

        function getActivePresetKey() {
            return viewSelect && viewPresets[viewSelect.value] ? viewSelect.value : 'pressure_vs_bargaining';
        }

        function getAxisMap() {
            return new Map(structuralAxes.map(function (axis) {
                return [axis.key, axis];
            }));
        }

        function populateAxisSelects() {
            var previousX = xSelect.value;
            var previousY = ySelect.value;
            var activeAxes = structuralAxes;
            xSelect.innerHTML = '';
            ySelect.innerHTML = '';

            activeAxes.forEach(function (axis) {
                var xOption = document.createElement('option');
                xOption.value = axis.key;
                xOption.textContent = axis.label;
                if ((previousX && activeAxes.some(function (entry) { return entry.key === previousX; }) && axis.key === previousX) || (!previousX && axis.key === 'direct_exposure_pressure')) {
                    xOption.selected = true;
                }
                xSelect.appendChild(xOption);

                var yOption = document.createElement('option');
                yOption.value = axis.key;
                yOption.textContent = axis.label;
                if ((previousY && activeAxes.some(function (entry) { return entry.key === previousY; }) && axis.key === previousY) || (!previousY && axis.key === 'retained_bargaining_power')) {
                    yOption.selected = true;
                }
                ySelect.appendChild(yOption);
            });

            if (!xSelect.value) {
                xSelect.value = 'direct_exposure_pressure';
            }
            if (!ySelect.value) {
                ySelect.value = 'retained_bargaining_power';
            }
        }

        function formatAxisValue(axis, value) {
            if (typeof value !== 'number' || Number.isNaN(value)) {
                return '-';
            }
            return value.toFixed(3);
        }

        function updateLegend() {
            if (!legendContainer) {
                return;
            }
            legendContainer.innerHTML = buildLegendMarkup(fatePalette);
        }

        populateAxisSelects();
        updateLegend();

        try {
            var basePath = window.location.pathname.replace(/\/+$/, '').split('/').pop() === 'guide' ? '..' : '.';
            const occupations = (await fetchCsv(basePath + '/data/normalized/occupations.csv', true))
                .filter((row) => String(row.is_active || '1') !== '0');
            const occupationCount = occupations.length;
            status.textContent = `Building the map for ${occupationCount} occupations\u2026`;

            const selectorRows = await fetchCsv(basePath + '/data/normalized/occupation_selector_index.csv', false);
            const selectorById = new Map(selectorRows.map((row) => [row.occupation_id, row]));
            const engine = await window.DLYJV2.create({ basePath: basePath });
            const questionnairePresets = window.WWILMJ_PRESETS;
            const hierarchyLevel = 3;
            const failures = [];
            const points = occupations.map((occupation) => {
                try {
                    const selector = selectorById.get(occupation.occupation_id) || {};
                    const questionnaireProfile = questionnairePresets.buildQuestionnaireProfilePreset(occupation.role_family, hierarchyLevel);
                    const result = engine.computeResult({
                        roleCategory: occupation.role_family,
                        occupationId: occupation.occupation_id,
                        seniorityLevel: hierarchyLevel,
                        questionnaireProfile: questionnaireProfile
                    });

                    return {
                        occupation_id: occupation.occupation_id,
                        title: occupation.title,
                        title_short: occupation.title_short,
                        role_family: occupation.role_family,
                        employment_us: toNumber(selector.employment_us, null),
                        median_wage_usd: toNumber(selector.median_wage_usd, null),
                        projection_growth_pct: toNumber(selector.projection_growth_pct, null),
                        role_fate_state: result && result.role_fate_state ? result.role_fate_state : 'mixed_transition',
                        role_fate_label: result && result.role_fate_label ? result.role_fate_label : 'The path forward for this role is still unsettled',
                        role_outlook: result && result.role_outlook ? result.role_outlook : '-',
                        primary_displacement_wave: result && result.primary_displacement_wave ? result.primary_displacement_wave : '-',
                        current_wave_state: result && result.wave_trajectory && result.wave_trajectory.current ? result.wave_trajectory.current.state : '-',
                        next_wave_state: result && result.wave_trajectory && result.wave_trajectory.next ? result.wave_trajectory.next.state : '-',
                        distant_wave_state: result && result.wave_trajectory && result.wave_trajectory.distant ? result.wave_trajectory.distant.state : '-',
                        top_exposed_work: result && result.top_exposed_work ? result.top_exposed_work.label : '-',
                        top_retained_function: result && result.audit_trace && result.audit_trace.top_retained_functions && result.audit_trace.top_retained_functions[0]
                            ? result.audit_trace.top_retained_functions[0].label
                            : '-',
                        selected_variant_label: result && result.occupation_assignment && result.occupation_assignment.selected_composition
                            ? (result.occupation_assignment.selected_composition.variant_label || 'No reviewed variant selected')
                            : 'No reviewed variant selected',
                        metrics: extractMetricsFromResult(result)
                    };
                } catch (error) {
                    failures.push({
                        occupation_id: occupation.occupation_id,
                        title: occupation.title,
                        message: error && error.message ? error.message : String(error)
                    });
                    return null;
                }
            }).filter(Boolean).sort((left, right) => left.title.localeCompare(right.title));

            if (!points.length) {
                throw new Error('No occupations could be rendered from the live engine.');
            }

            let selectedId = points[0] ? points[0].occupation_id : null;
            var userPoint = null;
            var userBaselinePoint = null;

            function sizeForPoint(point) {
                if (!sizeEmploymentToggle.checked || !point.employment_us) {
                    return 13;
                }
                const values = points.map((entry) => entry.employment_us).filter(Boolean);
                const low = Math.min.apply(null, values);
                const high = Math.max.apply(null, values);
                if (!Number.isFinite(low) || !Number.isFinite(high) || low === high) {
                    return 12;
                }
                const min = 10;
                const max = 24;
                const ratio = (Math.sqrt(point.employment_us) - Math.sqrt(low)) / (Math.sqrt(high) - Math.sqrt(low));
                return min + (ratio * (max - min));
            }

            function applyMapTransform() {
                if (!surface) return;
                surface.style.transformOrigin = '0 0';
                surface.style.transform = 'translate(' + mapPanX + 'px, ' + mapPanY + 'px) scale(' + mapZoom + ')';
                plot.classList.toggle('is-zoomed', mapZoom > 1);
            }

            function clampPan() {
                if (mapZoom <= 1) { mapPanX = 0; mapPanY = 0; return; }
                const w = plot.offsetWidth, h = plot.offsetHeight;
                mapPanX = Math.max(w - w * mapZoom, Math.min(0, mapPanX));
                mapPanY = Math.max(h - h * mapZoom, Math.min(0, mapPanY));
            }

            function zoomAt(factor, clientX, clientY) {
                const rect = plot.getBoundingClientRect();
                const px = clientX - rect.left, py = clientY - rect.top;
                const newZoom = Math.max(1, Math.min(10, mapZoom * factor));
                if (newZoom === mapZoom) return;
                const ratio = newZoom / mapZoom;
                mapPanX = px - ratio * (px - mapPanX);
                mapPanY = py - ratio * (py - mapPanY);
                mapZoom = newZoom;
                clampPan();
                applyMapTransform();
            }

            function resetMapZoom() {
                mapZoom = 1; mapPanX = 0; mapPanY = 0;
                applyMapTransform();
            }

            function selectRepresentativeIds(pts, xKey, yKey) {
                const result = new Set();
                for (let gx = 0; gx < 2; gx++) {
                    for (let gy = 0; gy < 2; gy++) {
                        const cx = (gx + 0.5) / 2, cy = (gy + 0.5) / 2;
                        let best = null, bestDist = Infinity;
                        pts.forEach(function(p) {
                            const x = p.metrics[xKey], y = p.metrics[yKey];
                            if (typeof x !== 'number' || typeof y !== 'number') return;
                            const d = Math.hypot(x - cx, y - cy);
                            if (d < bestDist) { bestDist = d; best = p; }
                        });
                        if (best) result.add(best.occupation_id);
                    }
                }
                return result;
            }

            function renderDetail(point, xAxis, yAxis, axisByKey) {
                if (!point) {
                    detail.innerHTML = '<h3>Select an occupation</h3><p>Hover or click a point to see the role fate, top exposed work, and current metric values.</p>';
                    return;
                }

                var isUser = point._isUser;
                var isBaseline = point._isBaseline;
                var prefix = isUser ? '<span style="color: var(--signal-text); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Your analysis</span>' :
                             isBaseline ? '<span style="color: var(--ink-tertiary); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Default baseline</span>' : '';
                var xAxisMeta = axisByKey.get(xAxis);
                var yAxisMeta = axisByKey.get(yAxis);

                detail.innerHTML =
                    prefix +
                    '<h3>' + point.title + '</h3>' +
                    '<p>' + point.role_fate_label + '. The current default read calls the role outlook <strong>' + String(point.role_outlook).toLowerCase() + '</strong>, with primary displacement pressure in the <strong>' + point.primary_displacement_wave + '</strong> wave.</p>' +
                    '<div class="occupation-map-meta">' +
                        '<div class="occupation-map-meta-row"><span>X-axis</span><strong>' + xAxisMeta.label + ': ' + formatAxisValue(xAxisMeta, point.metrics[xAxis]) + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>Y-axis</span><strong>' + yAxisMeta.label + ': ' + formatAxisValue(yAxisMeta, point.metrics[yAxis]) + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>Current wave</span><strong>' + point.current_wave_state + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>Next wave</span><strong>' + point.next_wave_state + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>Distant wave</span><strong>' + point.distant_wave_state + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>Top exposed work</span><strong>' + point.top_exposed_work + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>Top retained function</span><strong>' + point.top_retained_function + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>Reviewed variant</span><strong>' + point.selected_variant_label + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>U.S. employment</span><strong>' + (point.employment_us ? point.employment_us.toLocaleString() : '-') + '</strong></div>' +
                        '<div class="occupation-map-meta-row"><span>Median wage</span><strong>' + (point.median_wage_usd ? ('$' + point.median_wage_usd.toLocaleString()) : '-') + '</strong></div>' +
                    '</div>';
            }

            function renderPlot() {
                const axisByKey = getAxisMap();
                const xAxis = xSelect.value;
                const yAxis = ySelect.value;
                const repIds = selectRepresentativeIds(points, xAxis, yAxis);
                const xMeta = axisByKey.get(xAxis);
                const yMeta = axisByKey.get(yAxis);
                var preset = viewPresets[getActivePresetKey()] || viewPresets.pressure_vs_bargaining;
                xTitle.textContent = xMeta.label;
                yTitle.textContent = yMeta.label;
                caption.textContent = xMeta.label + ' on the x-axis, ' + yMeta.label + ' on the y-axis. ' + xMeta.description + ' ' + yMeta.description;
                var quadEls = plot.querySelectorAll('.occupation-map-quadrant');
                if (quadEls.length === 4 && preset.quadrants) {
                    quadEls[0].textContent = preset.quadrants[0];
                    quadEls[1].textContent = preset.quadrants[1];
                    quadEls[2].textContent = preset.quadrants[2];
                    quadEls[3].textContent = preset.quadrants[3];
                }
                pointsLayer.innerHTML = '';
                const compactLabels = window.matchMedia && window.matchMedia('(max-width: 960px)').matches;

                const plotRect = plot.getBoundingClientRect();
                const left = 72;
                const right = 22;
                const top = 18;
                const bottom = 52;
                const width = Math.max(100, plotRect.width - left - right);
                const height = Math.max(120, plotRect.height - top - bottom);

                var xValues = points.map(function (p) { return p.metrics[xAxis]; }).filter(function (v) { return typeof v === 'number'; });
                var yValues = points.map(function (p) { return p.metrics[yAxis]; }).filter(function (v) { return typeof v === 'number'; });
                var xMedian = median(xValues);
                var yMedian = median(yValues);
                if (midlineY) { midlineY.style.left = (left + (xMedian * width)) + 'px'; }
                if (midlineX) { midlineX.style.top = (top + ((1 - yMedian) * height)) + 'px'; }

                // Draw baseline occupation dots
                points.forEach((point) => {
                    const xValue = point.metrics[xAxis];
                    const yValue = point.metrics[yAxis];
                    if (typeof xValue !== 'number' || typeof yValue !== 'number') {
                        return;
                    }

                    const x = left + (xValue * width);
                    const y = top + ((1 - yValue) * height);
                    const size = sizeForPoint(point);
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'occupation-map-point';
                    if (point.occupation_id === selectedId) {
                        dot.classList.add('is-selected');
                    }
                    dot.style.left = x + 'px';
                    dot.style.top = y + 'px';
                    dot.style.width = size + 'px';
                    dot.style.height = size + 'px';
                    dot.style.background = (fatePalette[point.role_fate_state] || fatePalette.mixed_transition).color;
                    dot.setAttribute('aria-label', point.title + ': ' + point.role_fate_label);
                    dot.title = point.title + ' · ' + point.role_fate_label;
                    dot.addEventListener('mouseenter', function () {
                        selectedId = point.occupation_id;
                        renderPlot();
                    });
                    dot.addEventListener('focus', function () {
                        selectedId = point.occupation_id;
                        renderPlot();
                    });
                    dot.addEventListener('click', function () {
                        selectedId = point.occupation_id;
                        renderPlot();
                    });
                    pointsLayer.appendChild(dot);

                    if (showLabelsToggle.checked || point.occupation_id === selectedId || (!compactLabels && repIds.has(point.occupation_id))) {
                        const label = document.createElement('div');
                        label.className = 'occupation-map-label';
                        label.style.left = x + 'px';
                        label.style.top = y + 'px';
                        label.textContent = point.title_short || point.title;
                        pointsLayer.appendChild(label);
                    }
                });

                // Draw user baseline point (hollow ring)
                if (userBaselinePoint) {
                    var bx = userBaselinePoint.metrics[xAxis];
                    var by = userBaselinePoint.metrics[yAxis];
                    if (typeof bx === 'number' && typeof by === 'number') {
                        var bpx = left + (bx * width);
                        var bpy = top + ((1 - by) * height);
                        var baseDot = document.createElement('button');
                        baseDot.type = 'button';
                        baseDot.className = 'occupation-map-point occupation-map-point--baseline';
                        baseDot.style.left = bpx + 'px';
                        baseDot.style.top = bpy + 'px';
                        baseDot.style.width = '16px';
                        baseDot.style.height = '16px';
                        baseDot.setAttribute('aria-label', 'Default baseline: ' + userBaselinePoint.title);
                        baseDot.title = 'Default baseline · ' + userBaselinePoint.title;
                        baseDot.addEventListener('mouseenter', function () {
                            renderDetail(userBaselinePoint, xAxis, yAxis, axisByKey);
                        });
                        baseDot.addEventListener('focus', function () {
                            renderDetail(userBaselinePoint, xAxis, yAxis, axisByKey);
                        });
                        baseDot.addEventListener('click', function () {
                            renderDetail(userBaselinePoint, xAxis, yAxis, axisByKey);
                        });
                        pointsLayer.appendChild(baseDot);

                        var baseLabel = document.createElement('div');
                        baseLabel.className = 'occupation-map-label occupation-map-label--baseline';
                        baseLabel.style.left = bpx + 'px';
                        baseLabel.style.top = bpy + 'px';
                        baseLabel.textContent = 'Default';
                        pointsLayer.appendChild(baseLabel);
                    }
                }

                // Draw user custom point (large, prominent)
                if (userPoint) {
                    var ux = userPoint.metrics[xAxis];
                    var uy = userPoint.metrics[yAxis];
                    if (typeof ux === 'number' && typeof uy === 'number') {
                        var upx = left + (ux * width);
                        var upy = top + ((1 - uy) * height);
                        var userDot = document.createElement('button');
                        userDot.type = 'button';
                        userDot.className = 'occupation-map-point occupation-map-point--user';
                        userDot.style.left = upx + 'px';
                        userDot.style.top = upy + 'px';
                        userDot.setAttribute('aria-label', 'Your analysis: ' + userPoint.title);
                        userDot.title = 'Your analysis · ' + userPoint.title;
                        userDot.addEventListener('mouseenter', function () {
                            renderDetail(userPoint, xAxis, yAxis, axisByKey);
                        });
                        userDot.addEventListener('focus', function () {
                            renderDetail(userPoint, xAxis, yAxis, axisByKey);
                        });
                        userDot.addEventListener('click', function () {
                            renderDetail(userPoint, xAxis, yAxis, axisByKey);
                        });
                        pointsLayer.appendChild(userDot);

                        var userLabel = document.createElement('div');
                        userLabel.className = 'occupation-map-label occupation-map-label--user';
                        userLabel.style.left = upx + 'px';
                        userLabel.style.top = upy + 'px';
                        userLabel.textContent = 'Your role';
                        pointsLayer.appendChild(userLabel);

                        // Draw connector line between baseline and user point
                        if (userBaselinePoint) {
                            var blx = userBaselinePoint.metrics[xAxis];
                            var bly = userBaselinePoint.metrics[yAxis];
                            if (typeof blx === 'number' && typeof bly === 'number') {
                                var lpx = left + (blx * width);
                                var lpy = top + ((1 - bly) * height);
                                var line = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                line.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible;';
                                line.setAttribute('aria-hidden', 'true');
                                var path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                path.setAttribute('x1', lpx);
                                path.setAttribute('y1', lpy);
                                path.setAttribute('x2', upx);
                                path.setAttribute('y2', upy);
                                path.setAttribute('stroke', 'var(--ink-tertiary)');
                                path.setAttribute('stroke-width', '1.5');
                                path.setAttribute('stroke-dasharray', '4 3');
                                path.setAttribute('opacity', '0.6');
                                line.appendChild(path);
                                pointsLayer.appendChild(line);
                            }
                        }

                    }
                }
                var activePoint = points.find(function (point) { return point.occupation_id === selectedId; }) || points[0] || null;
                renderDetail(activePoint, xAxis, yAxis, axisByKey);
            }

            // Public API for app.js to push user results
            window.occupationMapSetUserResult = function (result, occupationId) {
                if (!result) {
                    userPoint = null;
                    userBaselinePoint = null;
                    selectedId = occupationId || (points[0] ? points[0].occupation_id : null);
                    resetMapZoom();
                    renderPlot();
                    return;
                }

                var baselineMatch = points.find(function (p) { return p.occupation_id === occupationId; });

                userPoint = {
                    _isUser: true,
                    occupation_id: occupationId,
                    title: result.selected_occupation_title || (baselineMatch ? baselineMatch.title : 'Your role'),
                    title_short: baselineMatch ? baselineMatch.title_short : (result.selected_occupation_title || 'Your role'),
                    role_family: baselineMatch ? baselineMatch.role_family : '',
                    employment_us: baselineMatch ? baselineMatch.employment_us : null,
                    median_wage_usd: baselineMatch ? baselineMatch.median_wage_usd : null,
                    projection_growth_pct: baselineMatch ? baselineMatch.projection_growth_pct : null,
                    role_fate_state: result.role_fate_state || 'mixed_transition',
                    role_fate_label: result.role_fate_label || 'The path forward for this role is still unsettled',
                    role_outlook: result.role_outlook || '-',
                    primary_displacement_wave: result.primary_displacement_wave || '-',
                    current_wave_state: result.wave_trajectory && result.wave_trajectory.current ? result.wave_trajectory.current.state : '-',
                    next_wave_state: result.wave_trajectory && result.wave_trajectory.next ? result.wave_trajectory.next.state : '-',
                    distant_wave_state: result.wave_trajectory && result.wave_trajectory.distant ? result.wave_trajectory.distant.state : '-',
                    top_exposed_work: result.top_exposed_work ? result.top_exposed_work.label : '-',
                    top_retained_function: result.audit_trace && result.audit_trace.top_retained_functions && result.audit_trace.top_retained_functions[0]
                        ? result.audit_trace.top_retained_functions[0].label : '-',
                    selected_variant_label: result.occupation_assignment && result.occupation_assignment.selected_composition
                        ? (result.occupation_assignment.selected_composition.variant_label || 'No reviewed variant selected')
                        : 'No reviewed variant selected',
                    metrics: extractMetricsFromResult(result)
                };

                if (baselineMatch) {
                    userBaselinePoint = Object.assign({}, baselineMatch, { _isBaseline: true });
                } else {
                    userBaselinePoint = null;
                }

                selectedId = occupationId || (points[0] ? points[0].occupation_id : null);
                resetMapZoom();
                renderPlot();
            };

            xSelect.addEventListener('change', function() { resetMapZoom(); renderPlot(); });
            ySelect.addEventListener('change', function() { resetMapZoom(); renderPlot(); });
            if (viewSelect) {
                viewSelect.addEventListener('change', function () {
                    resetMapZoom();
                    var preset = viewPresets[getActivePresetKey()] || viewPresets.pressure_vs_bargaining;
                    xSelect.value = preset.x;
                    ySelect.value = preset.y;
                    renderPlot();
                });
            }
            showLabelsToggle.addEventListener('change', renderPlot);
            sizeEmploymentToggle.addEventListener('change', renderPlot);
            window.addEventListener('resize', function() { clampPan(); applyMapTransform(); renderPlot(); });

            // Zoom: scroll wheel
            plot.addEventListener('wheel', function(e) {
                e.preventDefault();
                zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
            }, { passive: false });

            // Zoom: drag to pan
            plot.addEventListener('mousedown', function(e) {
                if (mapZoom <= 1 || e.button !== 0) return;
                isDragging = true;
                dragStartX = e.clientX; dragStartY = e.clientY;
                dragStartPanX = mapPanX; dragStartPanY = mapPanY;
                plot.classList.add('is-dragging');
                e.preventDefault();
            });
            window.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                mapPanX = dragStartPanX + (e.clientX - dragStartX);
                mapPanY = dragStartPanY + (e.clientY - dragStartY);
                clampPan();
                applyMapTransform();
            });
            window.addEventListener('mouseup', function() {
                if (!isDragging) return;
                isDragging = false;
                plot.classList.remove('is-dragging');
            });

            // Zoom: buttons
            var zoomInBtn = document.getElementById('occupation-map-zoom-in');
            var zoomOutBtn = document.getElementById('occupation-map-zoom-out');
            var zoomResetBtn = document.getElementById('occupation-map-zoom-reset');
            if (zoomInBtn) zoomInBtn.addEventListener('click', function() {
                var rect = plot.getBoundingClientRect();
                zoomAt(1.5, rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
            if (zoomOutBtn) zoomOutBtn.addEventListener('click', function() {
                var rect = plot.getBoundingClientRect();
                zoomAt(1 / 1.5, rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
            if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetMapZoom);

            status.textContent = failures.length
                ? ('Live view built for ' + points.length + ' occupations. ' + failures.length + ' occupations were skipped.')
                : ('Live view of all ' + points.length + ' launch occupations under one default setting.');
            resetMapZoom();
            renderPlot();
            requestAnimationFrame(function () {
                plot.classList.remove('is-loading');
            });
        } catch (error) {
            console.error('[Guide occupation map] Failed to build live occupation map', error);
            plot.classList.remove('is-loading');
            status.textContent = 'The live occupation map could not be built on this page.';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOccupationMap, { once: true });
    } else {
        initOccupationMap();
    }
})();
