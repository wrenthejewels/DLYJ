(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.DLYJV2 = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var DATA_FILES = {
        occupations: 'data/normalized/occupations.csv',
        selector: 'data/normalized/occupation_selector_index.csv',
        occupationTaskClusters: 'data/normalized/occupation_task_clusters.csv',
        occupationTaskInventory: 'data/normalized/occupation_task_inventory.csv',
        roleVariants: 'data/normalized/occupation_role_variants.csv',
        taskDependencyEdges: 'data/normalized/task_dependency_edges.csv',
        occupationTaskRoleProfiles: 'data/normalized/occupation_task_role_profiles.csv',
        occupationAdaptationPriors: 'data/normalized/occupation_adaptation_priors.csv',
        roleFunctions: 'data/normalized/role_functions.csv',
        occupationFunctionMap: 'data/normalized/occupation_function_map.csv',
        functionAccountabilityProfiles: 'data/normalized/function_accountability_profiles.csv',
        taskFunctionEdges: 'data/normalized/task_function_edges.csv',
        taskMembership: 'data/normalized/task_cluster_membership.csv',
        taskEvidence: 'data/normalized/task_exposure_evidence.csv',
        taskSourceEvidence: 'data/normalized/task_source_evidence.csv',
        taskPriors: 'data/normalized/task_augmentation_automation_priors.csv',
        occupationPriors: 'data/normalized/occupation_exposure_priors.csv',
        laborContext: 'data/normalized/occupation_labor_market_context.csv',
        occupationDemandAdoptionContext: 'data/normalized/occupation_demand_adoption_context.csv',
        occupationIndividualAiUsageContext: 'data/normalized/occupation_individual_ai_usage_context.csv',
        occupationRecompositionContext: 'data/normalized/occupation_recomposition_context.csv',
        occupationFunctionContext: 'data/normalized/occupation_function_context.csv',
        unemploymentMonthly: 'data/normalized/occupation_unemployment_monthly.csv',
        uiRoleMap: 'data/metadata/ui_role_category_map.csv'
    };

    var ROLE_STATE_LABELS = {
        mostly_augmented: 'AI-assisted — you\'re still driving',
        routine_tasks_absorbed: 'Routine work is being absorbed',
        role_becomes_more_senior: 'This role is consolidating upward',
        role_narrows_but_remains_viable: 'Narrower, but still viable',
        role_fragments: 'This role is fragmenting',
        high_displacement_risk: 'Significant displacement risk'
    };

    var ROLE_FATE_LABELS = {
        augmented: 'Your role stays intact — AI assists, you still lead',
        compressed: 'The work survives, but fewer people will do it',
        elevated: 'Execution is leaving this role. Judgment is what stays.',
        split: 'Your role is splitting into two different seats',
        expanded: 'Demand for this role is growing alongside AI',
        collapsed: 'The standalone seat here is weakening',
        mixed_transition: 'The path forward for this role is still unsettled'
    };

    var ROLE_TRANSFORMATION_TYPE_LABELS = {
        limited_near_term_change: 'limited near-term change',
        augmented_core_role: 'augmented core role',
        workflow_recomposition: 'workflow recomposition',
        workflow_fragmentation: 'workflow fragmentation',
        delegated_but_retained_function: 'delegated but retained function',
        substitution_pressure: 'substitution pressure'
    };

    var ROLE_TRANSFORMATION_DRIVER_LABELS = {
        direct_task_pressure: 'direct task pressure',
        function_exposure_pressure: 'core-function pressure',
        indirect_dependency_pressure: 'dependency spillover',
        role_fragmentation_risk: 'workflow fragmentation',
        role_compressibility: 'workflow compressibility',
        headcount_displacement_risk: 'headcount displacement risk',
        delegation_likelihood: 'delegation pressure',
        demand_expansion_signal: 'demand expansion'
    };

    var ROLE_TRANSFORMATION_COUNTERWEIGHT_LABELS = {
        retained_function_strength: 'retained function',
        retained_accountability_strength: 'human accountability',
        retained_bargaining_power: 'bargaining leverage',
        demand_expansion_signal: 'demand expansion'
    };

    var ELEVATION_CLUSTERS = {
        cluster_coordination: true,
        cluster_qa_review: true,
        cluster_decision_support: true,
        cluster_oversight_strategy: true,
        cluster_relationship_management: true,
        cluster_client_interaction: true
    };

    var ACCESSION_KIND_BY_CLUSTER = {
        cluster_qa_review: 'review',
        cluster_decision_support: 'exception',
        cluster_research_synthesis: 'exception',
        cluster_coordination: 'integration',
        cluster_workflow_admin: 'integration',
        cluster_client_interaction: 'relationship',
        cluster_relationship_management: 'relationship',
        cluster_oversight_strategy: 'governance',
        cluster_documentation: 'governance',
        cluster_analysis: 'exception',
        cluster_drafting: 'integration'
    };

    var BUNDLE_LABEL_STOPWORDS = {
        a: true, about: true, across: true, adapt: true, after: true, against: true, all: true, an: true, and: true, answer: true,
        answers: true, any: true, applications: false, are: true, as: true, at: true, build: true, businesses: false, by: true,
        can: true, case: false, collect: true, complete: true, conformance: true, coordinate: true, current: true, customers: false,
        decision: false, decisions: false, develop: true, different: true, do: true, document: true, documents: false, does: true,
        draft: true, during: true, each: true, ensure: true, establish: true, explain: true, facts: false, files: false, for: true,
        form: true, formulate: true, from: true, gather: true, get: true, gets: true, give: true, guidance: true, handle: true,
        handling: true, help: true, helps: true, improve: true, individuals: false, information: false, initiate: true, input: true,
        interpret: true, into: true, issue: false, issues: false, keep: true, keeps: true, language: false, laws: false, maintain: true,
        make: true, many: true, meet: true, modify: true, monitor: true, more: true, move: true, moves: true, need: true, needs: true,
        new: true, obtain: true, of: true, on: true, operate: true, operations: false, options: false, or: true, order: false,
        orders: false, outside: true, own: true, owners: false, people: true, performance: false, person: true, policy: false,
        prepare: true, problem: false, problems: false, process: true, produce: true, product: false, products: false, provide: true,
        qualify: true, records: false, regulations: false, relationships: false, report: false, reporting: false, resolve: true,
        review: true, role: true, run: true, service: false, services: false, set: true, signoff: true, so: true, stakeholder: false,
        stakeholders: false, standard: true, support: true, system: false, systems: false, take: true, task: true, tasks: true,
        team: true, terms: false, that: true, the: true, their: true, them: true, these: true, they: true, this: true, through: true,
        to: true, track: true, turn: true, update: true, use: true, using: true, users: false, while: true, with: true, work: true,
        workflow: true, workflows: true
    };

    var BUNDLE_THEME_LEADING_WORDS = {
        analyze: true,
        architect: true,
        build: true,
        collect: true,
        coordinate: true,
        develop: true,
        document: true,
        explain: true,
        establish: true,
        follow: true,
        gather: true,
        interview: true,
        interpret: true,
        lead: true,
        maintain: true,
        manage: true,
        modify: true,
        monitor: true,
        own: true,
        prepare: true,
        qualify: true,
        recurring: true,
        resolve: true,
        run: true,
        trustworthy: true,
        update: true,
        work: true
    };

    var BUNDLE_LABEL_OVERRIDES = {
        'cluster_execution_routine:design software': 'Software implementation execution',
        'cluster_drafting:product user': 'Product interface drafting and development',
        'cluster_execution_routine:financial resource': 'Finance operations execution',
        'cluster_documentation:disclosure loan': 'Loan disclosure documentation',
        'cluster_analysis:borrower funnel': 'Borrower pipeline analysis',
        'cluster_execution_routine:record schedule': 'Calendar and records execution',
        'cluster_coordination:record schedule': 'Calendar and records coordination',
        'cluster_documentation:correspondence agenda': 'Correspondence and scheduling documentation',
        'cluster_coordination:ticket service': 'Service escalation coordination',
        'cluster_workflow_admin:legal matter': 'Legal case workflow follow-through',
        'cluster_workflow_admin:receive sort': 'Intake and routing workflow follow-through',
        'cluster_workflow_admin:account record': 'Account update workflow follow-through',
        'cluster_execution_routine:customer problem': 'Customer issue execution',
        'cluster_execution_routine:legal matter': 'Legal case execution',
        'cluster_execution_routine:match processe': 'Candidate matching execution',
        'cluster_execution_routine:create asset': 'Content asset execution',
        'cluster_decision_support:evaluate borrower': 'Borrower qualification judgment and exceptions',
        'cluster_decision_support:budget forecast': 'Budget forecasting judgment and exceptions',
        'cluster_analysis:reporting variance': 'Reporting variance analysis',
        'cluster_qa_review:design code': 'Code review and approval',
        'cluster_drafting:write audience': 'Audience-focused drafting and development',
        'cluster_coordination:calendar leader': 'Executive calendar coordination',
        'cluster_client_interaction:sale stakeholder': 'Sales stakeholder handling'
    };

    var HUMAN_ADVANTAGE_CLUSTERS = {
        cluster_client_interaction: 1.0,
        cluster_relationship_management: 1.0,
        cluster_oversight_strategy: 0.85,
        cluster_coordination: 0.65,
        cluster_decision_support: 0.55,
        cluster_qa_review: 0.45,
        cluster_research_synthesis: 0.35,
        cluster_analysis: 0.30,
        cluster_documentation: 0.20,
        cluster_drafting: 0.15,
        cluster_workflow_admin: 0.12,
        cluster_execution_routine: 0.05
    };

    var ROUTINE_REACHABILITY_CLUSTERS = {
        cluster_execution_routine: 1.00,
        cluster_workflow_admin: 0.92,
        cluster_documentation: 0.86,
        cluster_drafting: 0.48
    };

    var CLUSTER_FRICTION_PROFILES = {
        cluster_drafting: { exception_burden: 0.25, accountability_load: 0.35, judgment_requirement: 0.55, document_intensity: 1.00, tacit_context_dependence: 0.45 },
        cluster_analysis: { exception_burden: 0.45, accountability_load: 0.55, judgment_requirement: 0.55, document_intensity: 0.80, tacit_context_dependence: 0.35 },
        cluster_research_synthesis: { exception_burden: 0.60, accountability_load: 0.45, judgment_requirement: 0.55, document_intensity: 0.75, tacit_context_dependence: 0.40 },
        cluster_coordination: { exception_burden: 0.75, accountability_load: 0.55, judgment_requirement: 0.65, document_intensity: 0.35, tacit_context_dependence: 0.80 },
        cluster_client_interaction: { exception_burden: 0.70, accountability_load: 0.65, judgment_requirement: 0.85, document_intensity: 0.25, tacit_context_dependence: 0.85 },
        cluster_qa_review: { exception_burden: 0.40, accountability_load: 0.80, judgment_requirement: 0.55, document_intensity: 0.55, tacit_context_dependence: 0.35 },
        cluster_decision_support: { exception_burden: 0.65, accountability_load: 0.85, judgment_requirement: 0.80, document_intensity: 0.55, tacit_context_dependence: 0.60 },
        cluster_execution_routine: { exception_burden: 0.15, accountability_load: 0.35, judgment_requirement: 0.15, document_intensity: 0.35, tacit_context_dependence: 0.15 },
        cluster_oversight_strategy: { exception_burden: 0.70, accountability_load: 0.85, judgment_requirement: 0.90, document_intensity: 0.45, tacit_context_dependence: 0.80 },
        cluster_relationship_management: { exception_burden: 0.65, accountability_load: 0.55, judgment_requirement: 0.90, document_intensity: 0.20, tacit_context_dependence: 0.90 },
        cluster_documentation: { exception_burden: 0.25, accountability_load: 0.35, judgment_requirement: 0.55, document_intensity: 0.95, tacit_context_dependence: 0.45 },
        cluster_workflow_admin: { exception_burden: 0.20, accountability_load: 0.35, judgment_requirement: 0.18, document_intensity: 0.55, tacit_context_dependence: 0.12 }
    };

    var CLUSTER_DEPENDENCY_MATRIX = {
        cluster_drafting: { cluster_qa_review: 0.18, cluster_decision_support: 0.14, cluster_coordination: 0.10, cluster_client_interaction: 0.08 },
        cluster_analysis: { cluster_qa_review: 0.16, cluster_decision_support: 0.12, cluster_documentation: 0.06 },
        cluster_research_synthesis: { cluster_analysis: 0.12, cluster_decision_support: 0.12, cluster_qa_review: 0.10 },
        cluster_execution_routine: { cluster_workflow_admin: 0.12, cluster_qa_review: 0.08 },
        cluster_documentation: { cluster_qa_review: 0.08, cluster_coordination: 0.06 },
        cluster_workflow_admin: { cluster_coordination: 0.12, cluster_client_interaction: 0.08 },
        cluster_decision_support: { cluster_oversight_strategy: 0.12, cluster_client_interaction: 0.08 },
        cluster_coordination: { cluster_client_interaction: 0.12, cluster_relationship_management: 0.10, cluster_oversight_strategy: 0.12 },
        cluster_client_interaction: { cluster_relationship_management: 0.10, cluster_decision_support: 0.08 },
        cluster_oversight_strategy: { cluster_decision_support: 0.10, cluster_coordination: 0.10 }
    };

    // Wave thresholds partition clusters into automation waves by difficulty.
    // current_max: clusters with automation_difficulty <= 0.35 are already
    //   reachable by current AI (routine execution, simple drafting).
    // next_max: clusters between 0.35-0.65 enter the next wave (~1-3 years).
    // Clusters above 0.65 are distant-wave (judgment, oversight, relationships).
    // Calibrated against the 63-occupation launch set so that wave assignments
    // track the structural calibration timing targets (waveTimingCorrelation).
    var WAVE_THRESHOLDS = { current_max: 0.35, next_max: 0.65 };

    // Friction weights: how much each friction dimension contributes to a
    // cluster's intrinsic resistance to automation. Tacit knowledge and
    // judgment dominate (54% combined) because they represent the hardest
    // capabilities for AI to replicate. Document intensity is inverted
    // (more documentation = easier to automate) and carries the least weight
    // because it mainly gates data availability, not task difficulty.
    var FRICTION_WEIGHTS = {
        tacit_context_dependence: 0.28,
        judgment_requirement: 0.26,
        accountability_load: 0.18,
        exception_burden: 0.15,
        inverse_document_intensity: 0.13
    };

    // Automation difficulty composite: blends four independent signals into
    // a single 0-1 difficulty score per cluster. Additional adjustment terms
    // (bargaining, core share, AI support, etc.) are added on top before
    // clamping. The base weights sum to 1.0; adjustments are additive.
    var AUTOMATION_DIFFICULTY_WEIGHTS = {
        intrinsicFriction: 0.40,
        humanAdvantage: 0.25,
        empiricalResistance: 0.25,
        couplingProtection: 0.10
    };

    var COHERENCE_BONUSES = {
        clusterCountThreshold: 3,
        clusterCountBonus: 0.10,
        retainedShareThreshold: 0.45,
        retainedShareBonus: 0.10,
        // Smooth ramp half-widths: the bonus ramps from 0 to full over
        // [threshold - halfWidth, threshold + halfWidth] instead of jumping.
        clusterCountHalfWidth: 1.0,
        retainedShareHalfWidth: 0.12
    };

    var WAVE_STATE_LABELS = {
        stable: 'Stable',
        narrowed: 'Narrowed',
        transformed: 'Transformed',
        displaced: 'Displaced'
    };

    var SCORING_CONFIG = {
        criticalityBoost: 0.08,
        adoptionRealizationBase: 0.84,
        adoptionRealizationScale: 0.16,
        dependencyPenaltyScale: 1.10,
        recompositionCouplingPenalty: 0.20,
        directTaskEvidenceBlendThreshold: 0.20,
        maxDirectTaskEvidenceBlendWeight: 0.85,
        taskFirstTaskReliabilityThreshold: 0.45,
        maxTaskFirstTaskWeight: 1.00,
        taskFirstClusterCoverageThreshold: 0.35,
        taskFirstClusterReliabilityThreshold: 0.30,
        maxTaskFirstClusterWeight: 0.90,
        thinEvidenceDirectCoverageThreshold: 0.24,
        thinEvidenceHighSpecificityThreshold: 0.10,
        thinEvidenceTaskFirstThreshold: 0.08,
        thinEvidenceFallbackThreshold: 0.74,
        thinEvidenceReliabilityThreshold: 0.42
    };

    var COMPOSITION_DELTA_METRIC_LABELS = {
        direct_exposure_pressure: 'direct pressure',
        indirect_dependency_pressure: 'spillover pressure',
        retained_bargaining_power: 'bargaining power',
        retained_accountability_strength: 'human accountability',
        workflow_compression: 'workflow compression',
        organizational_conversion: 'organizational conversion'
    };

    var TRAJECTORY_DELTA_METRIC_LABELS = {
        next_compression: 'next-scenario compression',
        next_demand: 'next-scenario demand',
        next_viability: 'next-scenario viability',
        distant_viability: 'distant-scenario viability',
        structural_necessity: 'structural necessity'
    };

    // Audit 2026-03-28: guard against NaN propagation. Math.max/Math.min
    // pass NaN through silently, which would corrupt downstream scores.
    function clamp(value, min, max) {
        if (value !== value) return min; // NaN check
        return Math.max(min, Math.min(max, value));
    }

    // Smooth ramp from 0 to maxBonus centered on threshold.
    // Uses a clamped linear ramp over [threshold - halfWidth, threshold + halfWidth].
    // Replaces the old step-function bonus that created a discontinuity at threshold.
    function smoothBonus(value, threshold, halfWidth, maxBonus) {
        if (halfWidth <= 0) {
            return value >= threshold ? maxBonus : 0;
        }
        var t = clamp((value - (threshold - halfWidth)) / (2 * halfWidth), 0, 1);
        return maxBonus * t;
    }

    function average(values) {
        var filtered = values.filter(function (value) {
            return typeof value === 'number' && !isNaN(value);
        });

        if (!filtered.length) {
            return 0;
        }

        return filtered.reduce(function (sum, value) {
            return sum + value;
        }, 0) / filtered.length;
    }

    function sum(values) {
        return values.reduce(function (total, value) {
            return total + value;
        }, 0);
    }

    function weightedAverage(rows, valueSelector, weightSelector) {
        var weightedTotal = 0;
        var totalWeight = 0;

        rows.forEach(function (row) {
            var value = typeof valueSelector === 'function' ? valueSelector(row) : row[valueSelector];
            var weight = typeof weightSelector === 'function' ? weightSelector(row) : row[weightSelector];
            var normalizedValue = toNumber(value, null);
            var normalizedWeight = toNumber(weight, 0);

            if (normalizedValue === null || !isFinite(normalizedValue) || !normalizedWeight) {
                return;
            }

            weightedTotal += normalizedValue * normalizedWeight;
            totalWeight += normalizedWeight;
        });

        return totalWeight ? (weightedTotal / totalWeight) : 0;
    }

    function uniqueStrings(values) {
        return Array.from(new Set((values || []).filter(Boolean)));
    }

    function toLookup(values) {
        return (values || []).reduce(function (map, value) {
            if (value) {
                map[value] = true;
            }
            return map;
        }, {});
    }

    function shrinkTowardPrior(observedValue, priorValue, reliability, fallback) {
        var observed = toNumber(observedValue, fallback);
        var prior = toNumber(priorValue, fallback);
        var lambda = clamp(toNumber(reliability, 0), 0, 1);
        return (lambda * observed) + ((1 - lambda) * prior);
    }

    function parseNoteMetric(noteText, metricKey) {
        var notes = String(noteText || '');
        var pattern = new RegExp('(?:^|\\|)' + metricKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^|]+)');
        var match = notes.match(pattern);
        return match ? toNumber(match[1], null) : null;
    }

    function hasMaterialCompositionEdits(compositionEdits, addedDependencyEdges, customTaskFunctionLinks) {
        var shareOverrides = compositionEdits && compositionEdits.task_share_overrides
            ? Object.keys(compositionEdits.task_share_overrides)
            : [];
        return uniqueStrings(compositionEdits && compositionEdits.removed_task_ids || []).length > 0 ||
            uniqueStrings(compositionEdits && compositionEdits.added_task_ids || []).length > 0 ||
            uniqueStrings(compositionEdits && compositionEdits.removed_function_ids || []).length > 0 ||
            uniqueStrings(compositionEdits && compositionEdits.added_function_ids || []).length > 0 ||
            shareOverrides.length > 0 ||
            (Array.isArray(addedDependencyEdges) && addedDependencyEdges.length > 0) ||
            (Array.isArray(customTaskFunctionLinks) && customTaskFunctionLinks.length > 0);
    }

    function buildTrajectoryEditDelta(currentResult, baselineResult) {
        var currentTrajectory = currentResult && currentResult.trajectory ? currentResult.trajectory : null;
        var baselineTrajectory = baselineResult && baselineResult.trajectory ? baselineResult.trajectory : null;
        if (!currentTrajectory || !baselineTrajectory) {
            return null;
        }

        function metricEntry(key, currentValue, baselineValue) {
            var currentNumeric = toNumber(currentValue, null);
            var baselineNumeric = toNumber(baselineValue, null);
            var delta = currentNumeric === null || baselineNumeric === null
                ? null
                : Number((currentNumeric - baselineNumeric).toFixed(3));
            return {
                key: key,
                label: TRAJECTORY_DELTA_METRIC_LABELS[key] || slugToLabel(key),
                current: currentNumeric === null ? null : Number(currentNumeric.toFixed(3)),
                baseline: baselineNumeric === null ? null : Number(baselineNumeric.toFixed(3)),
                delta: delta
            };
        }

        var metricEntries = [
            metricEntry(
                'next_compression',
                currentTrajectory.scenarios && currentTrajectory.scenarios.next ? currentTrajectory.scenarios.next.compression : null,
                baselineTrajectory.scenarios && baselineTrajectory.scenarios.next ? baselineTrajectory.scenarios.next.compression : null
            ),
            metricEntry(
                'next_demand',
                currentTrajectory.scenarios && currentTrajectory.scenarios.next ? currentTrajectory.scenarios.next.demand : null,
                baselineTrajectory.scenarios && baselineTrajectory.scenarios.next ? baselineTrajectory.scenarios.next.demand : null
            ),
            metricEntry(
                'next_viability',
                currentTrajectory.scenarios && currentTrajectory.scenarios.next ? currentTrajectory.scenarios.next.viability : null,
                baselineTrajectory.scenarios && baselineTrajectory.scenarios.next ? baselineTrajectory.scenarios.next.viability : null
            ),
            metricEntry(
                'distant_viability',
                currentTrajectory.scenarios && currentTrajectory.scenarios.distant ? currentTrajectory.scenarios.distant.viability : null,
                baselineTrajectory.scenarios && baselineTrajectory.scenarios.distant ? baselineTrajectory.scenarios.distant.viability : null
            ),
            metricEntry(
                'structural_necessity',
                currentTrajectory.structural_necessity ? currentTrajectory.structural_necessity.score : null,
                baselineTrajectory.structural_necessity ? baselineTrajectory.structural_necessity.score : null
            )
        ];

        var largestShift = metricEntries
            .filter(function (entry) {
                return typeof entry.delta === 'number' && !isNaN(entry.delta);
            })
            .sort(function (left, right) {
                return Math.abs(right.delta) - Math.abs(left.delta);
            })[0] || null;

        var baselineTiming = baselineTrajectory.threshold_timing && baselineTrajectory.threshold_timing.role_restructuring
            ? baselineTrajectory.threshold_timing.role_restructuring.baseline
            : null;
        var currentTiming = currentTrajectory.threshold_timing && currentTrajectory.threshold_timing.role_restructuring
            ? currentTrajectory.threshold_timing.role_restructuring.baseline
            : null;
        var stateChanged = !!baselineTrajectory.state && !!currentTrajectory.state && baselineTrajectory.state !== currentTrajectory.state;
        var roleShapeChanged = !!baselineTrajectory.role_shape && !!currentTrajectory.role_shape && baselineTrajectory.role_shape !== currentTrajectory.role_shape;
        var summaryParts = [];

        if (stateChanged) {
            summaryParts.push(
                'Your edits changed the trajectory state from "' + trajectoryStateLabel(baselineTrajectory.state) +
                '" to "' + trajectoryStateLabel(currentTrajectory.state) + '".'
            );
        } else if (currentTrajectory.state) {
            summaryParts.push(
                'Your edits keep the same headline trajectory state at "' + trajectoryStateLabel(currentTrajectory.state) +
                '", but they still shift the underlying compression, demand, structure, or viability signals.'
            );
        }
        if (roleShapeChanged) {
            summaryParts.push(
                'They also changed the likely retained role shape from "' + slugToLabel(baselineTrajectory.role_shape) +
                '" to "' + slugToLabel(currentTrajectory.role_shape) + '".'
            );
        }
        if (largestShift) {
            var shiftPoints = Math.round(Math.abs(largestShift.delta) * 100);
            summaryParts.push(
                'The largest trajectory shift is ' + largestShift.label + ' ' +
                (largestShift.delta >= 0 ? 'up' : 'down') + ' by ' +
                shiftPoints + ' point' + (shiftPoints === 1 ? '' : 's') + '.'
            );
        }
        if (baselineTiming && currentTiming && baselineTiming !== currentTiming) {
            summaryParts.push('The baseline role-restructuring window also moved to a different timing bucket.');
        }

        return {
            baseline_state: baselineTrajectory.state || null,
            current_state: currentTrajectory.state || null,
            state_changed: stateChanged,
            baseline_role_shape: baselineTrajectory.role_shape || null,
            current_role_shape: currentTrajectory.role_shape || null,
            role_shape_changed: roleShapeChanged,
            baseline_role_restructuring_bucket: baselineTiming,
            current_role_restructuring_bucket: currentTiming,
            role_restructuring_bucket_changed: !!baselineTiming && !!currentTiming && baselineTiming !== currentTiming,
            metric_deltas: metricEntries.reduce(function (map, entry) {
                map[entry.key] = entry.delta;
                return map;
            }, {}),
            next_scenario_delta: {
                compression: metricEntries[0].delta,
                demand: metricEntries[1].delta,
                viability: metricEntries[2].delta
            },
            structural_necessity_delta: metricEntries[4].delta,
            largest_shift: largestShift ? {
                metric_key: largestShift.key,
                metric_label: largestShift.label,
                direction: largestShift.delta >= 0 ? 'up' : 'down',
                delta: largestShift.delta,
                current_value: largestShift.current,
                baseline_value: largestShift.baseline
            } : null,
            summary: summaryParts.join(' ')
        };
    }

    function buildCompositionEditDelta(currentResult, baselineResult, currentSelection) {
        if (!currentResult || !baselineResult || !currentSelection) {
            return null;
        }

        function buildTaskLabelMap(rows) {
            return (rows || []).reduce(function (map, row) {
                if (row && row.task_id) {
                    map[row.task_id] = row.task_statement || row.task_id;
                }
                return map;
            }, {});
        }

        function buildFunctionLabelMap(rows) {
            return (rows || []).reduce(function (map, row) {
                if (row && row.function_id) {
                    map[row.function_id] = row.role_summary || row.function_statement || row.function_id;
                }
                return map;
            }, {});
        }

        function countTaskBuckets(rows) {
            var counts = {
                onet_tasks: 0,
                reviewed_job_posting_tasks: 0,
                reviewed_role_graph_tasks: 0
            };
            (rows || []).forEach(function (row) {
                var bucket = row && row.task_source_bucket;
                if (counts[bucket] !== undefined) {
                    counts[bucket] += 1;
                }
            });
            return counts;
        }

        var metricEntries = [
            {
                key: 'direct_exposure_pressure',
                current: currentResult.diagnostics ? currentResult.diagnostics.direct_exposure_pressure : null,
                baseline: baselineResult.diagnostics ? baselineResult.diagnostics.direct_exposure_pressure : null
            },
            {
                key: 'indirect_dependency_pressure',
                current: currentResult.diagnostics ? currentResult.diagnostics.indirect_dependency_pressure : null,
                baseline: baselineResult.diagnostics ? baselineResult.diagnostics.indirect_dependency_pressure : null
            },
            {
                key: 'retained_bargaining_power',
                current: currentResult.function_metrics ? currentResult.function_metrics.retained_bargaining_power : null,
                baseline: baselineResult.function_metrics ? baselineResult.function_metrics.retained_bargaining_power : null
            },
            {
                key: 'retained_accountability_strength',
                current: currentResult.function_metrics ? currentResult.function_metrics.retained_accountability_strength : null,
                baseline: baselineResult.function_metrics ? baselineResult.function_metrics.retained_accountability_strength : null
            },
            {
                key: 'workflow_compression',
                current: currentResult.recomposition_summary ? currentResult.recomposition_summary.workflow_compression : null,
                baseline: baselineResult.recomposition_summary ? baselineResult.recomposition_summary.workflow_compression : null
            },
            {
                key: 'organizational_conversion',
                current: currentResult.recomposition_summary ? currentResult.recomposition_summary.organizational_conversion : null,
                baseline: baselineResult.recomposition_summary ? baselineResult.recomposition_summary.organizational_conversion : null
            }
        ].map(function (entry) {
            var currentValue = toNumber(entry.current, null);
            var baselineValue = toNumber(entry.baseline, null);
            var delta = currentValue === null || baselineValue === null
                ? null
                : Number((currentValue - baselineValue).toFixed(3));
            return {
                key: entry.key,
                label: COMPOSITION_DELTA_METRIC_LABELS[entry.key] || slugToLabel(entry.key),
                current: currentValue === null ? null : Number(currentValue.toFixed(3)),
                baseline: baselineValue === null ? null : Number(baselineValue.toFixed(3)),
                delta: delta
            };
        });

        var largestShift = metricEntries
            .filter(function (entry) {
                return typeof entry.delta === 'number' && !isNaN(entry.delta);
            })
            .sort(function (left, right) {
                return Math.abs(right.delta) - Math.abs(left.delta);
            })[0] || null;

        var currentTaskMap = buildTaskLabelMap(currentResult.task_breakdown && currentResult.task_breakdown.tasks);
        var baselineTaskMap = buildTaskLabelMap(baselineResult.task_breakdown && baselineResult.task_breakdown.tasks);
        var currentFunctionMap = buildFunctionLabelMap(currentResult.function_metrics && currentResult.function_metrics.per_function_breakdown);
        var baselineFunctionMap = buildFunctionLabelMap(baselineResult.function_metrics && baselineResult.function_metrics.per_function_breakdown);
        var addedTaskIds = Object.keys(currentTaskMap).filter(function (taskId) { return !baselineTaskMap[taskId]; });
        var removedTaskIds = Object.keys(baselineTaskMap).filter(function (taskId) { return !currentTaskMap[taskId]; });
        var addedFunctionIds = Object.keys(currentFunctionMap).filter(function (functionId) { return !baselineFunctionMap[functionId]; });
        var removedFunctionIds = Object.keys(baselineFunctionMap).filter(function (functionId) { return !currentFunctionMap[functionId]; });
        var baselineBucketCounts = countTaskBuckets(baselineResult.task_breakdown && baselineResult.task_breakdown.tasks);
        var currentBucketCounts = countTaskBuckets(currentResult.task_breakdown && currentResult.task_breakdown.tasks);
        var baselineDirectEvidenceCount = toNumber(baselineResult.task_breakdown && baselineResult.task_breakdown.direct_evidence_tasks, 0);
        var currentDirectEvidenceCount = toNumber(currentResult.task_breakdown && currentResult.task_breakdown.direct_evidence_tasks, 0);
        var baselineFallbackCount = toNumber(baselineResult.task_breakdown && baselineResult.task_breakdown.cluster_fallback_tasks, 0);
        var currentFallbackCount = toNumber(currentResult.task_breakdown && currentResult.task_breakdown.cluster_fallback_tasks, 0);

        var changedTaskCount =
            toNumber(currentSelection.added_task_count, 0) +
            toNumber(currentSelection.removed_task_count, 0);
        var changedFunctionCount =
            toNumber(currentSelection.added_function_count, 0) +
            toNumber(currentSelection.removed_function_count, 0);
        var roleFateChanged = !!baselineResult.role_fate_label && !!currentResult.role_fate_label &&
            baselineResult.role_fate_label !== currentResult.role_fate_label;
        var summaryParts = [];

        if (changedTaskCount || changedFunctionCount) {
            summaryParts.push(
                'Compared with the unedited baseline, this run changes ' +
                changedTaskCount + ' task' + (changedTaskCount === 1 ? '' : 's') +
                ' and ' + changedFunctionCount + ' function' + (changedFunctionCount === 1 ? '' : 's') + '.'
            );
        }
        if (toNumber(currentSelection.share_override_count, 0) > 0) {
            summaryParts.push(
                'You also changed role-share weights for ' +
                toNumber(currentSelection.share_override_count, 0) + ' task' +
                (toNumber(currentSelection.share_override_count, 0) === 1 ? '' : 's') + '.'
            );
        }
        if (toNumber(currentSelection.added_dependency_count, 0) > 0) {
            summaryParts.push(
                'Custom support links now change how spillover is propagated through the edited task graph.'
            );
        }
        if (toNumber(currentSelection.custom_function_link_count, 0) > 0) {
            summaryParts.push(
                'Custom task-to-function links now change which tasks count most toward the role\'s retained purpose.'
            );
        }
        if (largestShift) {
            summaryParts.push(
                'The largest measured shift is ' + largestShift.label + ' ' +
                (largestShift.delta >= 0 ? 'up' : 'down') + ' by ' +
                Math.round(Math.abs(largestShift.delta) * 100) + ' points.'
            );
        }
        if (roleFateChanged) {
            summaryParts.push(
                'The headline fate readout changed from "' + baselineResult.role_fate_label +
                '" to "' + currentResult.role_fate_label + '".'
            );
        } else if (baselineResult.role_fate_label && currentResult.role_fate_label) {
            summaryParts.push(
                'The headline fate label stayed at "' + currentResult.role_fate_label +
                '", but the underlying task/function balance changed.'
            );
        }

        return {
            has_user_edits: true,
            comparison_scope: 'same_occupation_same_variant_default_composition',
            baseline_variant_id: baselineResult.occupation_assignment && baselineResult.occupation_assignment.selected_composition
                ? baselineResult.occupation_assignment.selected_composition.variant_id
                : null,
            baseline_variant_label: baselineResult.occupation_assignment && baselineResult.occupation_assignment.selected_composition
                ? baselineResult.occupation_assignment.selected_composition.variant_label
                : null,
            baseline_task_count: baselineResult.task_breakdown ? baselineResult.task_breakdown.total_tasks_considered : null,
            baseline_function_count: baselineResult.occupation_assignment && baselineResult.occupation_assignment.selected_composition
                ? baselineResult.occupation_assignment.selected_composition.active_function_count
                : null,
            changed_task_count: changedTaskCount,
            changed_function_count: changedFunctionCount,
            added_task_labels: addedTaskIds.slice(0, 4).map(function (taskId) { return currentTaskMap[taskId]; }),
            removed_task_labels: removedTaskIds.slice(0, 4).map(function (taskId) { return baselineTaskMap[taskId]; }),
            added_function_labels: addedFunctionIds.slice(0, 4).map(function (functionId) { return currentFunctionMap[functionId]; }),
            removed_function_labels: removedFunctionIds.slice(0, 4).map(function (functionId) { return baselineFunctionMap[functionId]; }),
            share_override_count: toNumber(currentSelection.share_override_count, 0),
            added_dependency_count: toNumber(currentSelection.added_dependency_count, 0),
            custom_function_link_count: toNumber(currentSelection.custom_function_link_count, 0),
            source_mix_delta: {
                baseline_task_source_counts: baselineBucketCounts,
                current_task_source_counts: currentBucketCounts,
                baseline_direct_evidence_tasks: baselineDirectEvidenceCount,
                current_direct_evidence_tasks: currentDirectEvidenceCount,
                baseline_fallback_tasks: baselineFallbackCount,
                current_fallback_tasks: currentFallbackCount
            },
            trajectory_delta: buildTrajectoryEditDelta(currentResult, baselineResult),
            baseline_role_fate_label: baselineResult.role_fate_label || null,
            current_role_fate_label: currentResult.role_fate_label || null,
            role_fate_changed: roleFateChanged,
            metric_deltas: metricEntries.reduce(function (map, entry) {
                map[entry.key] = entry.delta;
                return map;
            }, {}),
            largest_metric_shift: largestShift ? {
                metric_key: largestShift.key,
                metric_label: largestShift.label,
                direction: largestShift.delta >= 0 ? 'up' : 'down',
                delta: largestShift.delta,
                current_value: largestShift.current,
                baseline_value: largestShift.baseline
            } : null,
            summary: summaryParts.join(' ')
        };
    }

    function buildAuditTrace(result) {
        if (!result) {
            return null;
        }

        var tasks = result.task_breakdown && Array.isArray(result.task_breakdown.tasks)
            ? result.task_breakdown.tasks.slice()
            : [];
        var functions = result.function_metrics && Array.isArray(result.function_metrics.per_function_breakdown)
            ? result.function_metrics.per_function_breakdown.slice()
            : [];
        var accessionClusters = result.task_accession_map && Array.isArray(result.task_accession_map.accession_clusters)
            ? result.task_accession_map.accession_clusters.slice()
            : [];
        var shrinkingClusters = result.task_accession_map && Array.isArray(result.task_accession_map.shrinking_clusters)
            ? result.task_accession_map.shrinking_clusters.slice()
            : [];

        function topTasks(scoreSelector) {
            return tasks
                .map(function (task) {
                    var score = clamp(toNumber(scoreSelector(task), 0), 0, 1);
                    return {
                        task_id: task.task_id,
                        task_statement: task.task_statement,
                        task_cluster_label: task.task_cluster_label,
                        task_source_label: task.task_source_label || task.task_source_bucket || 'Task row',
                        evidence_source_role: task.resolved_evidence_source_role || null,
                        evidence_source_id: task.evidence_source || null,
                        supporting_roles: task.resolved_evidence_supporting_roles || [],
                        score: Number(score.toFixed(3))
                    };
                })
                .sort(function (left, right) {
                    return right.score - left.score;
                })
                .filter(function (task) {
                    return task.score > 0.01;
                })
                .slice(0, 3);
        }

        function topFunctions(valueKey) {
            return functions
                .map(function (fn) {
                    return {
                        function_id: fn.function_id,
                        role_summary: fn.role_summary || fn.function_statement || fn.function_id,
                        function_category: fn.function_category || null,
                        score: Number(clamp(toNumber(fn[valueKey], 0), 0, 1).toFixed(3)),
                        supported_share: Number(clamp(toNumber(fn.supported_share, 0), 0, 1).toFixed(3))
                    };
                })
                .sort(function (left, right) {
                    return right.score - left.score;
                })
                .filter(function (fn) {
                    return fn.score > 0.01;
                })
                .slice(0, 3);
        }

        var evidenceCitations = tasks
            .filter(function (task) {
                return task.has_direct_evidence || task.has_live_task_evidence;
            })
            .map(function (task) {
                return {
                    task_id: task.task_id,
                    task_statement: task.task_statement,
                    task_source_label: task.task_source_label || task.task_source_bucket || 'Task row',
                    evidence_source_role: task.resolved_evidence_source_role || null,
                    evidence_source_id: task.evidence_source || null,
                    supporting_roles: task.resolved_evidence_supporting_roles || [],
                    reliability: Number(clamp(toNumber(task.direct_evidence_reliability, 0), 0, 1).toFixed(3))
                };
            })
            .sort(function (left, right) {
                return right.reliability - left.reliability;
            })
            .slice(0, 5);

        var exportLines = [];
        exportLines.push('Audit trace');
        exportLines.push('Pressure tasks: ' + (topTasks(function (task) {
            return (toNumber(task.share_of_role, 0) * toNumber(task.direct_exposure_pressure, 0));
        }).map(function (task) {
            return task.task_statement + ' [' + task.task_source_label + ']';
        }).join(' | ') || 'none'));
        exportLines.push('Spillover tasks: ' + (topTasks(function (task) {
            return (toNumber(task.share_of_role, 0) * toNumber(task.indirect_dependency_pressure, 0));
        }).map(function (task) {
            return task.task_statement + ' [' + task.task_source_label + ']';
        }).join(' | ') || 'none'));
        exportLines.push('Retained tasks: ' + (topTasks(function (task) {
            return (toNumber(task.retained_share, 0) * toNumber(task.retained_leverage, 0));
        }).map(function (task) {
            return task.task_statement + ' [' + task.task_source_label + ']';
        }).join(' | ') || 'none'));
        exportLines.push('Exposed functions: ' + (topFunctions('exposure_pressure').map(function (fn) {
            return fn.role_summary;
        }).join(' | ') || 'none'));
        exportLines.push('Retained functions: ' + (topFunctions('retained_strength').map(function (fn) {
            return fn.role_summary;
        }).join(' | ') || 'none'));
        exportLines.push('Shrinking clusters: ' + (shrinkingClusters.map(function (cluster) {
            return cluster.public_label || cluster.task_cluster_label;
        }).join(' | ') || 'none'));
        exportLines.push('Accession clusters: ' + (accessionClusters.map(function (cluster) {
            return (cluster.public_label || cluster.task_cluster_label) + ' [' + cluster.accession_kind + ']';
        }).join(' | ') || 'none'));
        exportLines.push('Evidence citations: ' + (evidenceCitations.map(function (row) {
            return row.task_statement + ' (' + (row.evidence_source_role || row.task_source_label) + (row.evidence_source_id ? ': ' + row.evidence_source_id : '') + ')';
        }).join(' | ') || 'none'));

        return {
            top_pressure_tasks: topTasks(function (task) {
                return (toNumber(task.share_of_role, 0) * toNumber(task.direct_exposure_pressure, 0));
            }),
            top_spillover_tasks: topTasks(function (task) {
                return (toNumber(task.share_of_role, 0) * toNumber(task.indirect_dependency_pressure, 0));
            }),
            top_retained_tasks: topTasks(function (task) {
                return (toNumber(task.retained_share, 0) * toNumber(task.retained_leverage, 0));
            }),
            top_exposed_functions: topFunctions('exposure_pressure'),
            top_retained_functions: topFunctions('retained_strength'),
            shrinking_clusters: shrinkingClusters,
            accession_clusters: accessionClusters,
            evidence_citations: evidenceCitations,
            export_summary: exportLines.join('\n')
        };
    }

    function deriveRoutineExecutionContext(adaptationPrior) {
        var notes = adaptationPrior && adaptationPrior.notes ? adaptationPrior.notes : '';
        var routineShareValue = parseNoteMetric(notes, 'routine_share');
        var peopleShareValue = parseNoteMetric(notes, 'people_share');
        var routineShare = clamp(routineShareValue !== null ? routineShareValue : 0.20, 0, 1);
        var peopleShare = clamp(peopleShareValue !== null ? peopleShareValue : 0.30, 0, 1);
        var jobZone = clamp(toNumber(adaptationPrior && adaptationPrior.job_zone, 3), 1, 5);
        var normalizedJobZone = (jobZone - 1) / 4;

        return clamp(
            (routineShare * 0.58) +
            ((1 - peopleShare) * 0.27) +
            ((1 - normalizedJobZone) * 0.15),
            0,
            1
        );
    }

    function deriveAdministrativeRoutineContext(adaptationPrior) {
        var notes = adaptationPrior && adaptationPrior.notes ? adaptationPrior.notes : '';
        var routineShareValue = parseNoteMetric(notes, 'routine_share');
        var peopleShareValue = parseNoteMetric(notes, 'people_share');
        var knowledgeShareValue = parseNoteMetric(notes, 'knowledge_share');
        var routineShare = clamp(routineShareValue !== null ? routineShareValue : 0.20, 0, 1);
        var peopleShare = clamp(peopleShareValue !== null ? peopleShareValue : 0.30, 0, 1);
        var knowledgeShare = clamp(knowledgeShareValue !== null ? knowledgeShareValue : 0.35, 0, 1);

        return clamp(
            (routineShare * 0.52) +
            ((1 - peopleShare) * 0.28) +
            ((1 - knowledgeShare) * 0.20),
            0,
            1
        );
    }

    function deriveClericalExecutionContext(taskInventoryRows, functionSummary) {
        var rows = Array.isArray(taskInventoryRows) ? taskInventoryRows : [];
        if (!rows.length || !functionSummary) {
            return 0;
        }

        var officeAdminShare = 0;
        rows.forEach(function (row) {
            var share = clamp(toNumber(row.time_share_prior, 0), 0, 1);
            if (row.task_family_id === 'cluster_workflow_admin') {
                officeAdminShare += share * 1.00;
            } else if (row.task_family_id === 'cluster_documentation') {
                officeAdminShare += share * 0.95;
            } else if (row.task_family_id === 'cluster_execution_routine') {
                officeAdminShare += share * 0.85;
            } else if (row.task_family_id === 'cluster_coordination') {
                officeAdminShare += share * 0.45;
            }
        });

        var lowAuthority = 1 - clamp(toNumber(functionSummary.human_authority_requirement, 0.5), 0, 1);
        var lowGuardrail = 1 - clamp(toNumber(functionSummary.delegability_guardrail, 0.5), 0, 1);
        var lowBargaining = 1 - clamp(toNumber(functionSummary.bargaining_power_retention, 0.5), 0, 1);

        return clamp(
            (clamp(officeAdminShare, 0, 1) * 0.62) +
            (lowAuthority * 0.18) +
            (lowGuardrail * 0.12) +
            (lowBargaining * 0.08),
            0,
            1
        );
    }

    function computeRoutineCompressionSignal(bundle, adaptationPrior) {
        var routineExecutionContext = deriveRoutineExecutionContext(adaptationPrior);
        var routineBundleSignal = weightedAverage((bundle || []).filter(function (row) {
            return !!ROUTINE_REACHABILITY_CLUSTERS[row.task_cluster_id];
        }), function (row) {
            return clamp(
                toNumber(row.direct_exposure_pressure, 0) *
                ROUTINE_REACHABILITY_CLUSTERS[row.task_cluster_id],
                0,
                1
            );
        }, 'share_of_role');

        return clamp(
            (routineExecutionContext * 0.65) +
            (routineBundleSignal * 0.35),
            0,
            1
        );
    }

    function estimatePriorReliability(prior) {
        var confidence = toNumber(prior && prior.evidence_confidence, 0.4);
        var sources = parsePipeList(prior && prior.primary_sources);
        var hasStub = sources.indexOf('src_internal_stub_2026_03') !== -1;
        var hasAnthropic = sources.indexOf('src_anthropic_ei_2026_03_24') !== -1 ||
            sources.indexOf('src_anthropic_ei_2026_01_15') !== -1 ||
            sources.indexOf('src_anthropic_ei_2025_03_27') !== -1;
        var sourcePenalty = hasStub ? (hasAnthropic ? 0.78 : 0.55) : 1.0;
        return clamp(confidence * sourcePenalty, 0.05, 0.98);
    }

    function anthropicSourcePriority(sourceId) {
        if (sourceId === 'src_anthropic_ei_2026_03_24') { return 3; }
        if (sourceId === 'src_anthropic_ei_2026_01_15') { return 2; }
        if (sourceId === 'src_anthropic_ei_2025_03_27') { return 1; }
        return 0;
    }

    function estimateTaskEvidenceReliability(evidence) {
        if (!evidence || !evidence.source_id || String(evidence.source_id).indexOf('src_internal_stub') === 0) {
            return 0;
        }

        var confidence = toNumber(evidence.confidence, 0.55);
        var taskCount = parseNoteMetric(evidence.notes, 'task_count');
        var countWeight = taskCount !== null ? (taskCount / (taskCount + 40)) : 0.35;
        return clamp(confidence * countWeight, 0.05, 0.98);
    }

    function taskSourceRolePriority(sourceRole) {
        switch (sourceRole) {
            case 'live_task_evidence': return 5;
            case 'reviewed_task_estimate': return 4;
            case 'benchmark_task_label': return 3;
            case 'cluster_prior_proxy': return 2;
            case 'fallback_task_proxy': return 1;
            default: return 0;
        }
    }

    function taskSourcePromotionPriority(promotionStatus) {
        switch (promotionStatus) {
            case 'active_live': return 4;
            case 'active_supporting': return 3;
            case 'backstop_only': return 2;
            case 'fallback_only': return 1;
            case 'benchmark_only': return 1;
            default: return 0;
        }
    }

    function taskSourceBlendMultiplier(sourceRole) {
        switch (sourceRole) {
            case 'live_task_evidence': return 1.00;
            case 'reviewed_task_estimate': return 0.88;
            case 'benchmark_task_label': return 0.74;
            case 'cluster_prior_proxy': return 0.22;
            case 'fallback_task_proxy': return 0.12;
            default: return 0.35;
        }
    }

    function isTaskLevelEvidenceSource(sourceRole) {
        return sourceRole === 'live_task_evidence' ||
            sourceRole === 'reviewed_task_estimate' ||
            sourceRole === 'benchmark_task_label';
    }

    function estimateTaskSourceEvidenceReliability(sourceEvidence, liveEvidence) {
        if (!sourceEvidence) {
            return 0;
        }

        var sourceRole = sourceEvidence.source_role || '';
        if (sourceRole === 'live_task_evidence' && liveEvidence) {
            return estimateTaskEvidenceReliability(liveEvidence);
        }

        var confidence = clamp(toNumber(sourceEvidence.confidence, 0.55), 0, 1);
        var roleFactor = sourceRole === 'reviewed_task_estimate'
            ? 0.88
            : sourceRole === 'benchmark_task_label'
                ? 0.76
                : sourceRole === 'cluster_prior_proxy'
                    ? 0.42
                    : sourceRole === 'fallback_task_proxy'
                        ? 0.25
                        : 0.55;
        var promotionFactor = sourceEvidence.promotion_status === 'active_live'
            ? 1.00
            : sourceEvidence.promotion_status === 'active_supporting'
                ? 0.90
                : sourceEvidence.promotion_status === 'backstop_only'
                    ? 0.55
                    : sourceEvidence.promotion_status === 'fallback_only'
                        ? 0.38
                        : 0.60;

        return clamp(confidence * roleFactor * promotionFactor, 0.02, 0.95);
    }

    function computeTaskEvidenceBlendWeight(reliability) {
        var threshold = clamp(toNumber(SCORING_CONFIG.directTaskEvidenceBlendThreshold, 0.20), 0, 0.95);
        var maxWeight = clamp(toNumber(SCORING_CONFIG.maxDirectTaskEvidenceBlendWeight, 0.85), 0, 1);
        var normalizedReliability = clamp(toNumber(reliability, 0), 0, 1);
        if (normalizedReliability <= threshold) {
            return 0;
        }
        return clamp(((normalizedReliability - threshold) / Math.max(0.0001, 1 - threshold)) * maxWeight, 0, maxWeight);
    }

    function computeDirectTaskEvidenceSignal(evidence, fallbackSignal) {
        if (!evidence) {
            return clamp(toNumber(fallbackSignal, 0), 0, 1);
        }

        var automationScore = toNumber(evidence.automation_score, null);
        var exposureScore = toNumber(evidence.exposure_score, null);
        var augmentationScore = toNumber(evidence.augmentation_score, null);
        var weightedTotal = 0;
        var totalWeight = 0;

        if (automationScore !== null) {
            weightedTotal += clamp(automationScore, 0, 1) * 0.50;
            totalWeight += 0.50;
        }
        if (exposureScore !== null) {
            weightedTotal += clamp(exposureScore, 0, 1) * 0.35;
            totalWeight += 0.35;
        }
        if (augmentationScore !== null) {
            weightedTotal += clamp(augmentationScore, 0, 1) * 0.15;
            totalWeight += 0.15;
        }

        var weightedSignal = totalWeight > 0 ? (weightedTotal / totalWeight) : null;

        if (weightedSignal === null || !isFinite(weightedSignal) || weightedSignal <= 0) {
            return clamp(toNumber(fallbackSignal, 0), 0, 1);
        }

        return clamp(weightedSignal, 0, 1);
    }

    function computeTaskEvidenceAutomationEase(evidence, fallbackEase) {
        if (!evidence) {
            return clamp(toNumber(fallbackEase, 0), 0, 1);
        }

        var automationScore = toNumber(evidence.automation_score, null);
        var exposureScore = toNumber(evidence.exposure_score, null);
        var augmentationScore = toNumber(evidence.augmentation_score, null);
        var weightedTotal = 0;
        var totalWeight = 0;

        if (automationScore !== null) {
            weightedTotal += clamp(automationScore, 0, 1) * 0.65;
            totalWeight += 0.65;
        }
        if (exposureScore !== null) {
            weightedTotal += clamp(exposureScore, 0, 1) * 0.25;
            totalWeight += 0.25;
        }
        if (augmentationScore !== null) {
            weightedTotal += clamp(augmentationScore, 0, 1) * 0.10;
            totalWeight += 0.10;
        }

        var weightedSignal = totalWeight > 0 ? (weightedTotal / totalWeight) : null;
        if (weightedSignal === null || !isFinite(weightedSignal)) {
            return clamp(toNumber(fallbackEase, 0), 0, 1);
        }

        return clamp(weightedSignal, 0, 1);
    }

    function resolveTaskEvidence(options) {
        var sourceRows = Array.isArray(options && options.taskSourceEvidenceRows)
            ? options.taskSourceEvidenceRows.slice()
            : [];
        var liveEvidence = options && options.liveEvidence ? options.liveEvidence : null;
        var baselineAutomationScore = clamp(toNumber(options && options.baselineAutomationScore, 0.5), 0, 1);
        var baselineExposureScore = clamp(toNumber(options && options.baselineExposureScore, baselineAutomationScore), 0, 1);
        var baselineAugmentationScore = clamp(toNumber(options && options.baselineAugmentationScore, 0.3), 0, 1);

        if (!sourceRows.length && liveEvidence) {
            sourceRows.push({
                source_id: liveEvidence.source_id,
                source_role: 'live_task_evidence',
                exposure_score: liveEvidence.exposure_score,
                augmentation_score: liveEvidence.augmentation_score,
                automation_score: liveEvidence.automation_score,
                evidence_weight: 1,
                confidence: liveEvidence.confidence,
                promotion_status: 'active_live',
                notes: liveEvidence.notes || ''
            });
        }

        var rankedRows = sourceRows.map(function (row) {
            var reliability = estimateTaskSourceEvidenceReliability(
                row,
                row && row.source_role === 'live_task_evidence' ? liveEvidence : null
            );
            var evidenceWeight = clamp(toNumber(row && row.evidence_weight, 0.5), 0.05, 1);
            var supportWeight = reliability * evidenceWeight * taskSourceBlendMultiplier(row && row.source_role);

            return {
                row: row,
                reliability: reliability,
                evidence_weight: evidenceWeight,
                support_weight: supportWeight,
                role_priority: taskSourceRolePriority(row && row.source_role),
                promotion_priority: taskSourcePromotionPriority(row && row.promotion_status)
            };
        }).sort(function (left, right) {
            if (right.role_priority !== left.role_priority) {
                return right.role_priority - left.role_priority;
            }
            if (right.promotion_priority !== left.promotion_priority) {
                return right.promotion_priority - left.promotion_priority;
            }
            if (right.reliability !== left.reliability) {
                return right.reliability - left.reliability;
            }
            return right.evidence_weight - left.evidence_weight;
        });

        var taskLevelRows = rankedRows.filter(function (entry) {
            return isTaskLevelEvidenceSource(entry.row && entry.row.source_role) && entry.support_weight > 0;
        });
        var primaryEntry = taskLevelRows[0] || rankedRows[0] || null;
        var resolvedFromTaskEvidence = taskLevelRows.length > 0;
        var resolvedSignals;
        var resolvedReliability = 0;

        if (resolvedFromTaskEvidence) {
            resolvedSignals = {
                automation_score: weightedAverage(taskLevelRows, function (entry) {
                    return toNumber(entry.row && entry.row.automation_score, baselineAutomationScore);
                }, 'support_weight'),
                exposure_score: weightedAverage(taskLevelRows, function (entry) {
                    return toNumber(entry.row && entry.row.exposure_score, baselineExposureScore);
                }, 'support_weight'),
                augmentation_score: weightedAverage(taskLevelRows, function (entry) {
                    return toNumber(entry.row && entry.row.augmentation_score, baselineAugmentationScore);
                }, 'support_weight')
            };
            resolvedReliability = clamp(weightedAverage(taskLevelRows, 'reliability', 'support_weight'), 0.02, 0.98);
        } else {
            resolvedSignals = primaryEntry ? {
                automation_score: toNumber(primaryEntry.row && primaryEntry.row.automation_score, baselineAutomationScore),
                exposure_score: toNumber(primaryEntry.row && primaryEntry.row.exposure_score, baselineExposureScore),
                augmentation_score: toNumber(primaryEntry.row && primaryEntry.row.augmentation_score, baselineAugmentationScore)
            } : {
                automation_score: baselineAutomationScore,
                exposure_score: baselineExposureScore,
                augmentation_score: baselineAugmentationScore
            };
        }

        return {
            has_task_level_evidence: resolvedFromTaskEvidence,
            has_live_task_evidence: rankedRows.some(function (entry) {
                return entry.row && entry.row.source_role === 'live_task_evidence';
            }),
            has_direct_evidence: resolvedFromTaskEvidence,
            direct_evidence_reliability: Number(resolvedReliability.toFixed(3)),
            evidence_blend_weight: Number((resolvedFromTaskEvidence ? computeTaskEvidenceBlendWeight(resolvedReliability) : 0).toFixed(3)),
            primary_source_id: primaryEntry && primaryEntry.row ? (primaryEntry.row.source_id || null) : null,
            primary_source_role: primaryEntry && primaryEntry.row ? (primaryEntry.row.source_role || null) : null,
            primary_promotion_status: primaryEntry && primaryEntry.row ? (primaryEntry.row.promotion_status || null) : null,
            source_count: rankedRows.length,
            task_level_source_count: taskLevelRows.length,
            source_roles: uniqueStrings(rankedRows.map(function (entry) {
                return entry.row && entry.row.source_role;
            })),
            task_level_source_roles: uniqueStrings(taskLevelRows.map(function (entry) {
                return entry.row && entry.row.source_role;
            })),
            supporting_source_ids: uniqueStrings(taskLevelRows.map(function (entry) {
                return entry.row && entry.row.source_id;
            })),
            evidence: {
                automation_score: Number(clamp(toNumber(resolvedSignals.automation_score, baselineAutomationScore), 0, 1).toFixed(3)),
                exposure_score: Number(clamp(toNumber(resolvedSignals.exposure_score, baselineExposureScore), 0, 1).toFixed(3)),
                augmentation_score: Number(clamp(toNumber(resolvedSignals.augmentation_score, baselineAugmentationScore), 0, 1).toFixed(3))
            }
        };
    }

    function summarizeResolvedTaskEvidenceByCluster(options) {
        var occupationId = options && options.occupationId ? options.occupationId : null;
        var taskInventoryRows = options && Array.isArray(options.taskInventoryRows) ? options.taskInventoryRows : [];
        var taskSourceEvidenceByTaskId = options && options.taskSourceEvidenceByTaskId ? options.taskSourceEvidenceByTaskId : {};
        var taskEvidenceByKey = options && options.taskEvidenceByKey ? options.taskEvidenceByKey : {};
        var buckets = {};

        taskInventoryRows.forEach(function (task) {
            var clusterId = task.task_family_id;
            if (!clusterId) {
                return;
            }

            if (!buckets[clusterId]) {
                buckets[clusterId] = {
                    task_cluster_id: clusterId,
                    total_share: 0,
                    resolved_share: 0,
                    reliability_numerator: 0,
                    ease_numerator: 0,
                    resolved_task_count: 0,
                    live_task_count: 0,
                    reviewed_task_count: 0,
                    benchmark_task_count: 0
                };
            }

            var bucket = buckets[clusterId];
            var share = Math.max(toNumber(task.time_share_prior, 0), 0.0001);
            var rowTaskId = task.task_id || taskKey(occupationId, task.onet_task_id);
            var key = taskKey(occupationId, task.onet_task_id);
            var liveEvidence = String(task.onet_task_id || '').indexOf('manual_') === 0
                ? null
                : (taskEvidenceByKey[key] || null);
            var sourceResolution = resolveTaskEvidence({
                taskSourceEvidenceRows: taskSourceEvidenceByTaskId[rowTaskId] || [],
                liveEvidence: liveEvidence,
                baselineAutomationScore: 0.5,
                baselineExposureScore: 0.5,
                baselineAugmentationScore: clamp(toNumber(task.ai_support_observability, 0.3), 0, 1)
            });

            bucket.total_share += share;
            if (!sourceResolution.has_direct_evidence || !sourceResolution.evidence) {
                return;
            }

            var reliability = clamp(toNumber(sourceResolution.direct_evidence_reliability, 0), 0, 1);
            var evidenceEase = computeTaskEvidenceAutomationEase(sourceResolution.evidence, 0.5);
            bucket.resolved_share += share;
            bucket.reliability_numerator += share * reliability;
            bucket.ease_numerator += share * evidenceEase;
            bucket.resolved_task_count += 1;

            if (sourceResolution.primary_source_role === 'live_task_evidence') {
                bucket.live_task_count += 1;
            } else if (sourceResolution.primary_source_role === 'reviewed_task_estimate') {
                bucket.reviewed_task_count += 1;
            } else if (sourceResolution.primary_source_role === 'benchmark_task_label') {
                bucket.benchmark_task_count += 1;
            }
        });

        return Object.keys(buckets).reduce(function (map, clusterId) {
            var bucket = buckets[clusterId];
            var resolvedShare = Math.max(bucket.resolved_share, 0);
            var totalShare = Math.max(bucket.total_share, 0.0001);
            var coverageRatio = resolvedShare / totalShare;
            var meanReliability = resolvedShare > 0 ? (bucket.reliability_numerator / resolvedShare) : 0;
            var taskEmpiricalEase = resolvedShare > 0 ? (bucket.ease_numerator / resolvedShare) : null;
            var taskFirstWeight = computeTaskFirstClusterWeight(coverageRatio, meanReliability);

            map[clusterId] = {
                task_cluster_id: clusterId,
                task_evidence_coverage_ratio: Number(clamp(coverageRatio, 0, 1).toFixed(3)),
                task_evidence_mean_reliability: Number(clamp(meanReliability, 0, 1).toFixed(3)),
                task_empirical_ease: taskEmpiricalEase === null ? null : Number(clamp(taskEmpiricalEase, 0, 1).toFixed(3)),
                task_first_weight: Number(clamp(taskFirstWeight, 0, 1).toFixed(3)),
                resolved_task_count: bucket.resolved_task_count,
                live_task_count: bucket.live_task_count,
                reviewed_task_count: bucket.reviewed_task_count,
                benchmark_task_count: bucket.benchmark_task_count
            };
            return map;
        }, {});
    }

    function waveAssignmentForDifficulty(difficulty) {
        var normalizedDifficulty = clamp(toNumber(difficulty, 0.5), 0, 1);
        if (normalizedDifficulty <= WAVE_THRESHOLDS.current_max) {
            return 'current';
        }
        if (normalizedDifficulty <= WAVE_THRESHOLDS.next_max) {
            return 'next';
        }
        return 'distant';
    }

    function deriveClusterFriction(signals, clusterId) {
        var profile = CLUSTER_FRICTION_PROFILES[clusterId] || {
            exception_burden: 0.40,
            accountability_load: 0.40,
            judgment_requirement: 0.40,
            document_intensity: 0.40,
            tacit_context_dependence: 0.40
        };
        var user = signals.frictionDimensions || {};

        // Adaptive user weight: a single answer shifted from neutral could be
        // noise or a misread question. Three or more friction dimensions all
        // deviating in the same direction is a credible signal that the user
        // is describing a genuinely atypical role for this cluster, so they
        // earn more influence over the cluster profile default.
        var FRICTION_DIM_KEYS = ['exception_burden', 'accountability_load', 'judgment_requirement', 'document_intensity', 'tacit_context_dependence'];
        var deviations = FRICTION_DIM_KEYS.map(function (k) { return toNumber(user[k], 0.5) - 0.5; });
        var posCount = deviations.filter(function (d) { return d > 0.15; }).length;
        var negCount = deviations.filter(function (d) { return d < -0.15; }).length;
        var consistentCount = Math.max(posCount, negCount);
        var w = consistentCount >= 5 ? 0.55 : consistentCount >= 3 ? 0.45 : 0.30;

        return {
            exception_burden: clamp(profile.exception_burden + (toNumber(user.exception_burden, 0.5) - 0.5) * w, 0, 1),
            accountability_load: clamp(profile.accountability_load + (toNumber(user.accountability_load, 0.5) - 0.5) * w, 0, 1),
            judgment_requirement: clamp(profile.judgment_requirement + (toNumber(user.judgment_requirement, 0.5) - 0.5) * w, 0, 1),
            document_intensity: clamp(profile.document_intensity + (toNumber(user.document_intensity, 0.5) - 0.5) * w, 0, 1),
            tacit_context_dependence: clamp(profile.tacit_context_dependence + (toNumber(user.tacit_context_dependence, 0.5) - 0.5) * w, 0, 1),
            user_weight: w
        };
    }

    function summarizeBundleFriction(bundleRows) {
        return {
            exception_burden: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.exception_burden;
            }, 'share_of_role'),
            accountability_load: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.accountability_load;
            }, 'share_of_role'),
            judgment_requirement: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.judgment_requirement;
            }, 'share_of_role'),
            document_intensity: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.document_intensity;
            }, 'share_of_role'),
            tacit_context_dependence: weightedAverage(bundleRows, function (row) {
                return row.friction_dimensions && row.friction_dimensions.tacit_context_dependence;
            }, 'share_of_role')
        };
    }

    function computeDependencyPenalty(bundleRows) {
        var rowsById = {};
        var bindings = [];
        var rawPenalty = 0;

        bundleRows.forEach(function (row) {
            rowsById[row.task_cluster_id] = row;
        });

        Object.keys(CLUSTER_DEPENDENCY_MATRIX).forEach(function (sourceId) {
            var source = rowsById[sourceId];
            if (!source) {
                return;
            }

            Object.keys(CLUSTER_DEPENDENCY_MATRIX[sourceId]).forEach(function (targetId) {
                var target = rowsById[targetId];
                if (!target) {
                    return;
                }

                var dependencyWeight = CLUSTER_DEPENDENCY_MATRIX[sourceId][targetId];
                var sourceResidual = 1 - clamp(toNumber(source.absorption_rate, 0), 0, 1);
                var targetResidual = 1 - clamp(toNumber(target.absorption_rate, 0), 0, 1);
                var pairPenalty = dependencyWeight * Math.min(toNumber(source.share_of_role, 0), toNumber(target.share_of_role, 0)) * sourceResidual * targetResidual;

                rawPenalty += pairPenalty;
                bindings.push({
                    source_cluster_id: sourceId,
                    source_label: source.label,
                    target_cluster_id: targetId,
                    target_label: target.label,
                    penalty: Number(pairPenalty.toFixed(4))
                });
            });
        });

        bindings.sort(function (left, right) {
            return right.penalty - left.penalty;
        });

        return {
            penalty: rawPenalty * SCORING_CONFIG.dependencyPenaltyScale,
            bindings: bindings.slice(0, 3)
        };
    }

    function normalizeWageLevel(medianWageUsd) {
        var wage = Math.max(toNumber(medianWageUsd, 0), 0);
        return clamp(Math.log(1 + wage) / Math.log(1 + 250000), 0, 1);
    }

    function frontierConstraintLabel(constraintId) {
        var labels = {
            capability_limited: 'Capability-limited',
            supervision_limited: 'Review-limited',
            economics_limited: 'Economics-limited',
            organization_limited: 'Retained-core-limited'
        };
        return labels[constraintId] || 'Mixed constraint';
    }

    function computeScenarioHurdleMargin(baseReadiness, activation, baselineActivation, hurdle, activationWeight, trajectoryWeight) {
        var normalizedBase = clamp(toNumber(baseReadiness, 0), 0, 1);
        var normalizedActivation = clamp(toNumber(activation, baselineActivation), 0, 1);
        var normalizedBaseline = clamp(toNumber(baselineActivation, 0), 0, 1);
        var normalizedHurdle = clamp(toNumber(hurdle, 0.5), 0, 1);
        var scenarioLift = Math.max(0, normalizedActivation - normalizedBaseline);
        var readiness = normalizedBase +
            (normalizedActivation * clamp(toNumber(activationWeight, 0.12), 0, 0.5)) +
            (scenarioLift * clamp(toNumber(trajectoryWeight, 0.16), 0, 0.5));
        return Number((readiness - normalizedHurdle).toFixed(3));
    }

    function buildScenarioActivationLevels(options) {
        var currentActivation = clamp(toNumber(options && options.current_activation, 0.35), 0, 1);
        var ceiling = clamp(
            toNumber(options && options.organizational_adoption_ceiling, Math.max(currentActivation, 0.55)),
            currentActivation,
            1
        );
        var nextLift = clamp(toNumber(options && options.next_scenario_lift, 0.45), 0, 1);
        var distantLift = clamp(toNumber(options && options.distant_scenario_lift, Math.max(nextLift, 0.72)), 0, 1);
        var nextActivation = clamp(
            currentActivation + ((ceiling - currentActivation) * nextLift),
            currentActivation,
            ceiling
        );
        var distantActivation = clamp(
            nextActivation + ((ceiling - nextActivation) * Math.max(distantLift, nextLift)),
            nextActivation,
            ceiling
        );

        return {
            current: Number(currentActivation.toFixed(3)),
            next: Number(nextActivation.toFixed(3)),
            distant: Number(distantActivation.toFixed(3)),
            ceiling: Number(ceiling.toFixed(3))
        };
    }

    function pickBindingConstraintFromReadiness(readinessByConstraint) {
        var order = ['capability_limited', 'supervision_limited', 'economics_limited', 'organization_limited'];
        var lowestId = order[0];
        var lowestValue = Infinity;

        order.forEach(function (constraintId) {
            var readiness = clamp(toNumber(readinessByConstraint[constraintId], 0), 0, 1);
            if (readiness < lowestValue) {
                lowestValue = readiness;
                lowestId = constraintId;
            }
        });

        return {
            binding_constraint: lowestId,
            binding_constraint_label: frontierConstraintLabel(lowestId),
            readiness: Number(clamp(lowestValue, 0, 1).toFixed(3))
        };
    }

    function computeClusterTimingFrontier(row, signals, options) {
        var friction = row.friction_dimensions || {};
        var scenarioActivations = buildScenarioActivationLevels(options);
        var currentActivation = scenarioActivations.current;
        var evidenceCoverage = clamp(toNumber(row.task_evidence_coverage_ratio, 0.35), 0, 1);
        var evidenceReliability = clamp(toNumber(row.task_evidence_mean_reliability, 0.35), 0, 1);
        var directExposure = clamp(toNumber(row.direct_exposure_pressure, 0), 0, 1);
        var demandExpansionModifier = clamp(toNumber(options && options.demand_expansion_modifier, 0.5), 0, 1);
        var capabilityReadiness = clamp(average([
            1 - clamp(toNumber(row.automation_difficulty, 0.5), 0, 1),
            directExposure,
            clamp(toNumber(row.evidence_confidence, 0.45), 0, 1),
            clamp(
                (evidenceCoverage * 0.80) +
                (evidenceReliability * 0.20),
                0,
                1
            ),
            clamp(toNumber(signals && signals.capabilitySignal, 0.5), 0, 1)
        ]), 0, 1);
        var supervisionReadiness = clamp(average([
            capabilityReadiness,
            clamp(toNumber(signals && signals.questionnaireProfile && signals.questionnaireProfile.workflow_decomposability, 0.5), 0, 1),
            clamp(toNumber(signals && signals.questionnaireProfile && signals.questionnaireProfile.ai_observability_of_work, 0.5), 0, 1),
            1 - clamp(toNumber(friction.accountability_load, 0.5), 0, 1),
            1 - clamp(toNumber(friction.exception_burden, 0.5), 0, 1)
        ]), 0, 1);
        var economicPressure = clamp(average([
            clamp(toNumber(row.share_of_role, 0) * 1.4, 0, 1),
            normalizeWageLevel(options && options.median_wage_usd),
            clamp(toNumber(row.direct_exposure_pressure, 0), 0, 1),
            clamp(toNumber(options && options.economic_pressure_context, 0.45), 0, 1),
            1 - clamp(toNumber(options && options.demand_expansion_modifier, 0.5), 0, 1)
        ]), 0, 1);
        var organizationalFriction = clamp(average([
            clamp(toNumber(friction.accountability_load, 0.5), 0, 1),
            clamp(toNumber(friction.judgment_requirement, 0.5), 0, 1),
            clamp(toNumber(friction.tacit_context_dependence, 0.5), 0, 1),
            clamp(toNumber(row.indirect_dependency_pressure, 0), 0, 1),
            clamp(toNumber(row.retained_leverage, 0.5), 0, 1),
            clamp(toNumber(signals && signals.functionRetention, 0.5), 0, 1),
            clamp(toNumber(signals && signals.questionnaireProfile && signals.questionnaireProfile.human_signoff_requirement, 0.5), 0, 1)
        ]), 0, 1);
        var organizationalReadiness = clamp(1 - organizationalFriction, 0, 1);
        var baseReadiness = clamp(
            (capabilityReadiness * 0.28) +
            (supervisionReadiness * 0.22) +
            (directExposure * 0.16) +
            (economicPressure * 0.14) +
            (organizationalReadiness * 0.10) +
            (evidenceCoverage * 0.06) +
            (evidenceReliability * 0.04) -
            (demandExpansionModifier * 0.08),
            0,
            1
        );

        function scenarioMargin(activation) {
            return computeScenarioHurdleMargin(
                baseReadiness,
                activation,
                currentActivation,
                0.56,
                0.12,
                0.18
            );
        }

        var readinessByConstraint = {
            capability_limited: capabilityReadiness,
            supervision_limited: supervisionReadiness,
            economics_limited: economicPressure,
            organization_limited: organizationalReadiness
        };
        var binding = pickBindingConstraintFromReadiness(readinessByConstraint);
        var scenarioMargins = {
            current: scenarioMargin(scenarioActivations.current),
            next: scenarioMargin(scenarioActivations.next),
            distant: scenarioMargin(scenarioActivations.distant)
        };
        var crossingWave = frontierWaveFromMargins(scenarioMargins);

        return {
            capability_readiness: Number(capabilityReadiness.toFixed(3)),
            supervision_readiness: Number(supervisionReadiness.toFixed(3)),
            economic_pressure: Number(economicPressure.toFixed(3)),
            organizational_friction: Number(organizationalFriction.toFixed(3)),
            scenario_activation: scenarioActivations,
            scenario_margins: scenarioMargins,
            crossing_wave: crossingWave,
            binding_constraint: binding.binding_constraint,
            binding_constraint_label: binding.binding_constraint_label
        };
    }

    function buildClusterFrontierBundle(bundleRows, signals, options) {
        // Half-width of the soft ramp window around the current/next wave boundary.
        // A cluster with current scenario margin >= +rampHalfWidth contributes its
        // full absorbed_share to current_wave_absorbed (weight 1.0). A cluster with
        // margin <= -rampHalfWidth contributes nothing (weight 0.0). Clusters within
        // the window get a linear interpolation, eliminating the hard cliff at margin=0.
        var CURRENT_WAVE_RAMP_HALF_WIDTH = 0.10;

        var normalizedBundle = (bundleRows || []).map(function (row) {
            var shareOfRole = clamp(toNumber(row.share_of_role, 0), 0, 1.25);
            var automationDifficulty = clamp(toNumber(row.automation_difficulty, 0.5), 0.02, 0.98);
            var absorbedShare = toNumber(row.absorbed_share, null);
            var inferredAbsorptionRate = shareOfRole > 0 && absorbedShare !== null
                ? (absorbedShare / Math.max(shareOfRole, 0.0001))
                : null;
            var absorptionRate = clamp(
                toNumber(row.absorption_rate, inferredAbsorptionRate === null ? 0 : inferredAbsorptionRate),
                0,
                0.98
            );
            var normalizedAbsorbedShare = absorbedShare === null
                ? (shareOfRole * absorptionRate)
                : clamp(absorbedShare, 0, 1.25);
            var retainedShare = toNumber(row.retained_share, null);
            var residualRelevance = toNumber(row.residual_relevance, retainedShare === null ? (shareOfRole - normalizedAbsorbedShare) : retainedShare);
            var frontier = computeClusterTimingFrontier(row, signals, options);

            return Object.assign({}, row, {
                share_of_role: Number(shareOfRole.toFixed(3)),
                automation_difficulty: Number(automationDifficulty.toFixed(3)),
                wave_assignment: frontier.crossing_wave,
                absorption_rate: Number(absorptionRate.toFixed(3)),
                absorbed_share: Number(clamp(normalizedAbsorbedShare, 0, 1.25).toFixed(3)),
                exposed_share: Number(clamp(toNumber(row.exposed_share, normalizedAbsorbedShare), 0, 1.25).toFixed(3)),
                retained_share: Number(clamp(retainedShare === null ? (shareOfRole - normalizedAbsorbedShare) : retainedShare, 0, 1.25).toFixed(3)),
                residual_relevance: Number(clamp(residualRelevance, 0, 1.25).toFixed(3)),
                elevation_boost: Number(clamp(toNumber(row.elevation_boost, 0), 0, 1.25).toFixed(3)),
                frontier_capability_readiness: frontier.capability_readiness,
                frontier_supervision_readiness: frontier.supervision_readiness,
                frontier_economic_pressure: frontier.economic_pressure,
                frontier_organizational_friction: frontier.organizational_friction,
                frontier_binding_constraint: frontier.binding_constraint,
                frontier_binding_constraint_label: frontier.binding_constraint_label,
                frontier_crossing_wave: frontier.crossing_wave,
                frontier_scenario_activation: frontier.scenario_activation,
                frontier_scenario_margins: frontier.scenario_margins,
                frontier_current_margin: Number(toNumber(frontier.scenario_margins && frontier.scenario_margins.current, 0).toFixed(3))
            });
        }).sort(function (left, right) {
            return right.share_of_role - left.share_of_role;
        });

        var waveGroups = { current: [], next: [], distant: [] };
        normalizedBundle.forEach(function (row) {
            waveGroups[row.wave_assignment].push(row);
        });

        var cumulativeAutomated = {};

        ['current', 'next', 'distant'].forEach(function (waveName) {
            waveGroups[waveName].forEach(function (cluster) {
                cluster.absorbed_share = Number(clamp(cluster.share_of_role * cluster.absorption_rate, 0, 1.25).toFixed(3));
                cluster.residual_relevance = Number(clamp(cluster.share_of_role * (1 - cluster.absorption_rate), 0, 1.25).toFixed(3));
                cumulativeAutomated[cluster.task_cluster_id] = true;
            });

            var remainingClusters = normalizedBundle.filter(function (cluster) {
                return !cumulativeAutomated[cluster.task_cluster_id];
            });
            var automatedClusters = normalizedBundle.filter(function (cluster) {
                return !!cumulativeAutomated[cluster.task_cluster_id];
            });
            var elevationBoosts = {};

            remainingClusters.forEach(function (cluster) {
                if (!ELEVATION_CLUSTERS[cluster.task_cluster_id]) {
                    return;
                }
                var elevationPull = 0;
                automatedClusters.forEach(function (automated) {
                    var deps = CLUSTER_DEPENDENCY_MATRIX[automated.task_cluster_id];
                    if (deps && deps[cluster.task_cluster_id]) {
                        elevationPull += deps[cluster.task_cluster_id] * automated.absorbed_share;
                    }
                });
                elevationBoosts[cluster.task_cluster_id] = elevationPull * (1 + (toNumber(signals && signals.seniority, 0) * 0.25));
            });

            if (waveName === 'next') {
                normalizedBundle.forEach(function (cluster) {
                    cluster.elevation_boost = Number((elevationBoosts[cluster.task_cluster_id] || 0).toFixed(3));
                    if (cumulativeAutomated[cluster.task_cluster_id]) {
                        cluster.residual_relevance = Number(clamp(cluster.share_of_role * (1 - cluster.absorption_rate), 0, 1.25).toFixed(3));
                    } else {
                        cluster.residual_relevance = Number(clamp(cluster.share_of_role + cluster.elevation_boost, 0, 1.25).toFixed(3));
                    }
                });
            }
        });

        var byId = {};
        normalizedBundle.forEach(function (cluster) {
            byId[cluster.task_cluster_id] = cluster;
        });

        return {
            current_bundle: normalizedBundle,
            by_id: byId,
            current_wave_absorbed: Number(sum(normalizedBundle.map(function (cluster) {
                var margin = toNumber(cluster.frontier_current_margin, 0);
                var weight = clamp((margin + CURRENT_WAVE_RAMP_HALF_WIDTH) / (2 * CURRENT_WAVE_RAMP_HALF_WIDTH), 0, 1);
                return clamp(toNumber(cluster.absorbed_share, 0), 0, 1.25) * weight;
            })).toFixed(3)),
            exposed_clusters: normalizedBundle.filter(function (cluster) {
                return cluster.wave_assignment === 'current' || cluster.wave_assignment === 'next';
            }).sort(function (left, right) {
                var rightExposed = toNumber(right.exposed_share, 0);
                var leftExposed = toNumber(left.exposed_share, 0);
                if (rightExposed !== leftExposed) {
                    return rightExposed - leftExposed;
                }
                return toNumber(right.direct_exposure_pressure, 0) - toNumber(left.direct_exposure_pressure, 0);
            }),
            retained_clusters: normalizedBundle.filter(function (cluster) {
                return toNumber(cluster.residual_relevance, 0) >= 0.055;
            }).sort(function (left, right) {
                return toNumber(right.residual_relevance, 0) - toNumber(left.residual_relevance, 0);
            }),
            elevated_clusters: normalizedBundle.filter(function (cluster) {
                return toNumber(cluster.elevation_boost, 0) >= 0.015;
            }).sort(function (left, right) {
                return toNumber(right.elevation_boost, 0) - toNumber(left.elevation_boost, 0);
            })
        };
    }

    function buildMetricBand(value, halfWidth) {
        var center = clamp(toNumber(value, 0), 0, 1);
        var width = clamp(toNumber(halfWidth, 0.12), 0.04, 0.30);
        return {
            low: Number(clamp(center - width, 0, 1).toFixed(3)),
            high: Number(clamp(center + width, 0, 1).toFixed(3))
        };
    }

    function confidenceLabel(score) {
        if (score >= 0.70) {
            return 'High';
        }
        if (score >= 0.45) {
            return 'Medium';
        }
        return 'Low';
    }

    function computeThinEvidenceGuardrail(options) {
        var totalTaskRows = Math.max(0, Math.round(toNumber(options.total_task_rows, 0)));
        var directCoverageRatio = clamp(toNumber(options.direct_coverage_ratio, 0), 0, 1);
        var fallbackShare = totalTaskRows
            ? clamp(toNumber(options.fallback_task_count, 0) / totalTaskRows, 0, 1)
            : 0;
        var taskFirstTaskShare = totalTaskRows
            ? clamp(toNumber(options.task_first_task_count, 0) / totalTaskRows, 0, 1)
            : 0;
        var highSpecificityEvidenceRows =
            Math.max(0, toNumber(options.live_task_evidence_rows, 0)) +
            Math.max(0, toNumber(options.reviewed_task_estimate_rows, 0));
        var highSpecificityEvidenceShare = totalTaskRows
            ? clamp(highSpecificityEvidenceRows / totalTaskRows, 0, 1)
            : 0;
        var meanDirectReliability = clamp(toNumber(options.mean_direct_reliability, 0), 0, 1);

        var active = totalTaskRows >= 5 && (
            (
                directCoverageRatio <= SCORING_CONFIG.thinEvidenceDirectCoverageThreshold &&
                highSpecificityEvidenceShare <= SCORING_CONFIG.thinEvidenceHighSpecificityThreshold &&
                fallbackShare >= SCORING_CONFIG.thinEvidenceFallbackThreshold
            ) ||
            (
                directCoverageRatio <= 0.18 &&
                taskFirstTaskShare <= SCORING_CONFIG.thinEvidenceTaskFirstThreshold &&
                fallbackShare >= 0.80 &&
                meanDirectReliability <= SCORING_CONFIG.thinEvidenceReliabilityThreshold
            )
        );

        var severity = active
            ? clamp(average([
                clamp((SCORING_CONFIG.thinEvidenceDirectCoverageThreshold - directCoverageRatio) / Math.max(SCORING_CONFIG.thinEvidenceDirectCoverageThreshold, 0.0001), 0, 1),
                clamp((SCORING_CONFIG.thinEvidenceHighSpecificityThreshold - highSpecificityEvidenceShare) / Math.max(SCORING_CONFIG.thinEvidenceHighSpecificityThreshold, 0.0001), 0, 1),
                clamp((fallbackShare - SCORING_CONFIG.thinEvidenceFallbackThreshold) / Math.max(1 - SCORING_CONFIG.thinEvidenceFallbackThreshold, 0.0001), 0, 1),
                clamp((SCORING_CONFIG.thinEvidenceTaskFirstThreshold - taskFirstTaskShare) / Math.max(SCORING_CONFIG.thinEvidenceTaskFirstThreshold, 0.0001), 0, 1),
                clamp((SCORING_CONFIG.thinEvidenceReliabilityThreshold - meanDirectReliability) / Math.max(SCORING_CONFIG.thinEvidenceReliabilityThreshold, 0.0001), 0, 1)
            ]), 0, 1)
            : 0;

        var note = active
            ? 'Very thin task evidence guardrail active: the current role mix leans heavily on proxy fallback structure, so fate and timing confidence are intentionally reduced.'
            : null;

        return {
            active: active,
            severity: Number(severity.toFixed(3)),
            direct_coverage_ratio: Number(directCoverageRatio.toFixed(3)),
            high_specificity_evidence_share: Number(highSpecificityEvidenceShare.toFixed(3)),
            task_first_task_share: Number(taskFirstTaskShare.toFixed(3)),
            fallback_share: Number(fallbackShare.toFixed(3)),
            mean_direct_reliability: Number(meanDirectReliability.toFixed(3)),
            note: note
        };
    }

    function buildRecompositionSummary(metrics, context) {
        var workflowCompression = clamp(toNumber(metrics.workflow_compression, 0), 0, 1);
        var organizationalConversion = clamp(toNumber(metrics.organizational_conversion, 0), 0, 1);
        var substitutionPotential = clamp(toNumber(metrics.substitution_potential, 0), 0, 1);
        var substitutionGap = clamp(toNumber(metrics.substitution_gap, 0), 0, 1);
        var summaryLabel = 'Mixed recomposition pressure';
        var summaryNote = 'The current bundle shows meaningful technical compression, but the role still carries enough coordination, augmentation, or retained-value work that not all exposed work cleanly converts into fewer labor hours.';
        var confidenceScore = context ? clamp(toNumber(context.confidence_score, 0.5), 0, 1) : 0.5;
        var confidenceBandWidth = context ? clamp(toNumber(context.band_half_width, 0.12), 0.04, 0.30) : 0.12;
        var dependencies = context && Array.isArray(context.binding_dependencies) ? context.binding_dependencies : [];
        var dependencyNote = dependencies.length
            ? (' The tightest remaining workflow bottlenecks are ' + dependencies.map(function (binding) {
                return binding.source_label + ' -> ' + binding.target_label;
            }).join(', ') + '.')
            : '';
        var confidenceNote = ' Current confidence is ' + confidenceLabel(confidenceScore).toLowerCase() + '; the displayed ranges widen when direct task coverage is thin or the occupation anchor is weak.';

        if (workflowCompression < 0.24) {
            summaryLabel = 'Limited recomposition pressure';
            summaryNote = 'Some tasks are exposed, but the current bundle does not compress enough to imply large workflow savings or immediate organizational substitution.';
        } else if (organizationalConversion >= 0.58 && substitutionPotential >= 0.22) {
            summaryLabel = 'Compression more likely to convert into substitution';
            summaryNote = 'The current adoption and workflow signals make it more plausible that technical compression converts into fewer labor hours instead of remaining inside a redesigned role.';
        } else if (substitutionGap >= 0.12) {
            summaryLabel = 'Exposure more likely to reorganize than remove work';
            summaryNote = 'A meaningful share of exposed work still looks more likely to be absorbed, redistributed, or redesigned inside the role than converted directly into labor reduction.';
        }

        return {
            workflow_compression: Number(workflowCompression.toFixed(3)),
            organizational_conversion: Number(organizationalConversion.toFixed(3)),
            substitution_potential: Number(substitutionPotential.toFixed(3)),
            substitution_gap: Number(substitutionGap.toFixed(3)),
            workflow_compression_band: buildMetricBand(workflowCompression, confidenceBandWidth),
            organizational_conversion_band: buildMetricBand(organizationalConversion, confidenceBandWidth * 0.9),
            substitution_potential_band: buildMetricBand(substitutionPotential, confidenceBandWidth * 0.85),
            substitution_gap_band: buildMetricBand(substitutionGap, confidenceBandWidth * 0.9),
            confidence_score: Number(confidenceScore.toFixed(3)),
            confidence_label: confidenceLabel(confidenceScore),
            dependency_penalty: Number((context ? toNumber(context.dependency_penalty, 0) : 0).toFixed(3)),
            binding_dependencies: dependencies,
            summary_label: summaryLabel,
            summary_note: summaryNote + dependencyNote + confidenceNote
        };
    }

    function normalizeAnswer(rawValue) {
        var value = Number(rawValue);
        if (!isFinite(value)) {
            return 0.5;
        }
        return clamp((value - 1) / 4, 0, 1);
    }

    function normalizeProfileMetric(rawValue, fallback) {
        return clamp(toNumber(rawValue, fallback), 0, 1);
    }

    function getDefaultQuestionnaireProfile() {
        return {
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
        };
    }

    function buildQuestionnaireProfileFromAnswers(answers, options) {
        var seniority = clamp((toNumber(options.seniorityLevel, 3) - 1) / 4, 0, 1);
        var q1 = normalizeAnswer(answers.Q1);
        var q2 = normalizeAnswer(answers.Q2);
        var q3 = normalizeAnswer(answers.Q3);
        var q4 = normalizeAnswer(answers.Q4);
        var q5 = normalizeAnswer(answers.Q5);
        var q6 = normalizeAnswer(answers.Q6);
        var q7 = normalizeAnswer(answers.Q7);
        var q8 = normalizeAnswer(answers.Q8);
        var q9 = normalizeAnswer(answers.Q9);
        var q11 = normalizeAnswer(answers.Q11);
        var q12 = normalizeAnswer(answers.Q12);
        var q13 = normalizeAnswer(answers.Q13);
        var q14 = normalizeAnswer(answers.Q14);
        var q16 = normalizeAnswer(answers.Q16);

        return {
            function_centrality: clamp((q11 * 0.35) + (q7 * 0.25) + (q9 * 0.20) + (seniority * 0.20), 0, 1),
            human_signoff_requirement: clamp((q11 * 0.50) + (q7 * 0.20) + (seniority * 0.30), 0, 1),
            liability_and_regulatory_burden: clamp((q11 * 0.35) + (q7 * 0.30) + ((1 - q5) * 0.20) + (seniority * 0.15), 0, 1),
            relationship_ownership: clamp((q11 * 0.45) + (q7 * 0.20) + (q9 * 0.20) + (seniority * 0.15), 0, 1),
            exception_and_context_load: clamp(((1 - q5) * 0.30) + ((1 - q6) * 0.15) + (q7 * 0.30) + (q9 * 0.25), 0, 1),
            workflow_decomposability: clamp((q5 * 0.40) + (q6 * 0.30) + (q4 * 0.30), 0, 1),
            organizational_adoption_readiness: clamp((q13 * 0.45) + (q14 * 0.20) + (q16 * 0.35), 0, 1),
            ai_observability_of_work: clamp((q1 * 0.25) + (q2 * 0.15) + (q3 * 0.15) + (q4 * 0.30) + (q8 * 0.15), 0, 1),
            dependency_bottleneck_strength: clamp(((1 - q5) * 0.30) + (q7 * 0.30) + (q11 * 0.25) + (seniority * 0.15), 0, 1),
            handoff_and_coordination_complexity: clamp(((1 - q5) * 0.25) + (q7 * 0.25) + (q11 * 0.20) + (seniority * 0.30), 0, 1),
            external_trust_requirement: clamp((q11 * 0.45) + (q12 * 0.15) + (q7 * 0.20) + (seniority * 0.20), 0, 1),
            stakeholder_alignment_burden: clamp((q11 * 0.35) + (q7 * 0.20) + (seniority * 0.45), 0, 1),
            execution_vs_judgment_mix: clamp((q5 * 0.25) + (q6 * 0.25) + ((1 - q11) * 0.25) + ((1 - q7) * 0.25), 0, 1),
            augmentation_fit: clamp((q1 * 0.35) + (q11 * 0.20) + (q7 * 0.20) + ((1 - q13) * 0.10) + (seniority * 0.15), 0, 1),
            substitution_risk_modifier: clamp((q1 * 0.30) + (q4 * 0.20) + (q5 * 0.20) + (q6 * 0.15) + ((1 - q11) * 0.15), 0, 1)
        };
    }

    function normalizeQuestionnaireProfile(questionnaireProfile, fallbackProfile) {
        var defaults = fallbackProfile || getDefaultQuestionnaireProfile();
        var profile = questionnaireProfile || {};
        var normalized = {};

        Object.keys(defaults).forEach(function (key) {
            normalized[key] = normalizeProfileMetric(profile[key], defaults[key]);
        });

        return normalized;
    }

    function hasProvidedQuestionnaireProfile(questionnaireProfile) {
        return !!(questionnaireProfile && typeof questionnaireProfile === 'object' && Object.keys(questionnaireProfile).length);
    }

    function toNumber(rawValue, fallback) {
        if (fallback === undefined) {
            fallback = 0;
        }

        if (rawValue === null || rawValue === undefined || rawValue === '') {
            return fallback;
        }

        var normalized = String(rawValue).replace(/[%,$]/g, '').trim();
        if (!normalized.length) {
            return fallback;
        }

        var value = Number(normalized);
        return isFinite(value) ? value : fallback;
    }

    function parsePipeList(rawValue) {
        if (!rawValue) {
            return [];
        }

        return String(rawValue)
            .split('|')
            .map(function (entry) { return entry.trim(); })
            .filter(Boolean);
    }

    function slugToLabel(taskClusterId) {
        return String(taskClusterId || '')
            .replace(/^cluster_/, '')
            .split('_')
            .map(function (part) {
                return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
            })
            .join(' ');
    }

    function taskKey(occupationId, onetTaskId) {
        return String(occupationId || '') + '|' + String(onetTaskId || '');
    }

    function computeTaskFirstClusterWeight(coverageRatio, meanReliability) {
        var coverageThreshold = clamp(toNumber(SCORING_CONFIG.taskFirstClusterCoverageThreshold, 0.35), 0, 0.95);
        var reliabilityThreshold = clamp(toNumber(SCORING_CONFIG.taskFirstClusterReliabilityThreshold, 0.30), 0, 0.95);
        var maxWeight = clamp(toNumber(SCORING_CONFIG.maxTaskFirstClusterWeight, 0.90), 0, 1);
        var coverage = clamp(toNumber(coverageRatio, 0), 0, 1);
        var reliability = clamp(toNumber(meanReliability, 0), 0, 1);

        if (coverage <= coverageThreshold || reliability <= reliabilityThreshold) {
            return 0;
        }

        var normalizedCoverage = (coverage - coverageThreshold) / Math.max(0.0001, 1 - coverageThreshold);
        var normalizedReliability = (reliability - reliabilityThreshold) / Math.max(0.0001, 1 - reliabilityThreshold);
        return clamp(
            ((normalizedCoverage * 0.60) + (normalizedReliability * 0.40)) * maxWeight,
            0,
            maxWeight
        );
    }

    function computeTaskFirstTaskWeight(reliability) {
        var sourceRole = arguments.length > 1 ? arguments[1] : null;
        var mappingConfidence = arguments.length > 2 ? arguments[2] : null;
        var baseThreshold = clamp(toNumber(SCORING_CONFIG.taskFirstTaskReliabilityThreshold, 0.45), 0, 0.95);
        var baseMaxWeight = clamp(toNumber(SCORING_CONFIG.maxTaskFirstTaskWeight, 1.00), 0, 1);
        var normalizedReliability = clamp(toNumber(reliability, 0), 0, 1);
        var normalizedMappingConfidence = clamp(toNumber(mappingConfidence, 0.45), 0, 1);
        var threshold = sourceRole === 'live_task_evidence'
            ? Math.max(0, baseThreshold - 0.07)
            : sourceRole === 'reviewed_task_estimate'
                ? Math.max(0, baseThreshold - 0.03)
                : sourceRole === 'benchmark_task_label'
                    ? Math.min(0.95, baseThreshold + 0.10)
                    : 0.99;
        var maxWeight = sourceRole === 'live_task_evidence'
            ? baseMaxWeight
            : sourceRole === 'reviewed_task_estimate'
                ? Math.min(baseMaxWeight, 0.95)
                : sourceRole === 'benchmark_task_label'
                    ? Math.min(baseMaxWeight, 0.65)
                    : 0;

        if (normalizedReliability <= threshold) {
            return 0;
        }

        return clamp(
            ((normalizedReliability - threshold) / Math.max(0.0001, 1 - threshold)) * maxWeight,
            0,
            maxWeight
        ) * (0.55 + (normalizedMappingConfidence * 0.45));
    }

    function dependencyEdgeKey(fromTaskId, toTaskId) {
        return String(fromTaskId || '') + '->' + String(toTaskId || '');
    }

    function taskSourceBucket(task) {
        var notes = String(task && task.notes || '').toLowerCase();
        if (notes.indexOf('seeded_from_job_description_expansion') !== -1) {
            return 'reviewed_job_posting_tasks';
        }
        if (notes.indexOf('seeded_from_manual_task_expansion') !== -1) {
            return 'reviewed_role_graph_tasks';
        }
        return 'onet_tasks';
    }

    function taskSourceLabel(task) {
        var bucket = taskSourceBucket(task);
        if (bucket === 'reviewed_job_posting_tasks') {
            return 'Reviewed public posting task';
        }
        if (bucket === 'reviewed_role_graph_tasks') {
            return 'Reviewed role-graph task';
        }
        return 'O*NET baseline task';
    }

    function rankTaskForDefaultSelection(task) {
        return average([
            toNumber(task && task.time_share_prior, 0),
            toNumber(task && task.bargaining_power_weight, 0),
            toNumber(task && task.value_centrality, 0)
        ]);
    }

    function defaultSelectedTaskIds(taskRows) {
        var onetRows = [];
        var selected = [];

        (taskRows || []).forEach(function (task) {
            var bucket = taskSourceBucket(task);
            if (bucket === 'onet_tasks') {
                onetRows.push(task);
            } else {
                selected.push(task.task_id);
            }
        });

        onetRows
            .slice()
            .sort(function (left, right) {
                return rankTaskForDefaultSelection(right) - rankTaskForDefaultSelection(left);
            })
            .slice(0, 8)
            .forEach(function (task) {
                selected.push(task.task_id);
            });

        return uniqueStrings(selected);
    }

    function defaultSelectedFunctionIds(functionRows) {
        return uniqueStrings((functionRows || []).map(function (row) {
            return row.function_id;
        }));
    }

    function splitPipeList(value) {
        return uniqueStrings(String(value || '').split('|').map(function (entry) {
            return String(entry || '').trim();
        }).filter(Boolean));
    }

    function questionnaireBandTarget(band) {
        var normalized = String(band || '').trim().toLowerCase();
        if (normalized === 'high') {
            return 0.80;
        }
        if (normalized === 'medium') {
            return 0.50;
        }
        if (normalized === 'low') {
            return 0.20;
        }
        return null;
    }

    function parseQuestionnaireSignature(signatureText) {
        return splitPipeList(signatureText).map(function (entry) {
            var parts = entry.split('=');
            var metricKey = String(parts[0] || '').trim();
            var band = String(parts[1] || '').trim();
            var target = questionnaireBandTarget(band);
            if (!metricKey || target === null) {
                return null;
            }
            return {
                metric_key: metricKey,
                band: band,
                target: target
            };
        }).filter(Boolean);
    }

    function normalizeRoleVariantRow(row) {
        return {
            occupation_id: row.occupation_id,
            variant_id: row.variant_id,
            variant_label: row.variant_label || slugToLabel(row.variant_id || 'role_variant'),
            variant_summary: row.variant_summary || '',
            variant_order: toNumber(row.variant_order, 99),
            is_default: String(row.is_default || '').trim() === '1',
            task_ids: splitPipeList(row.task_ids),
            function_ids: splitPipeList(row.function_ids),
            preferred_task_families: splitPipeList(row.preferred_task_families),
            preferred_function_ids: splitPipeList(row.preferred_function_ids),
            questionnaire_signature: parseQuestionnaireSignature(row.questionnaire_signature),
            source_mix: row.source_mix || '',
            notes: row.notes || ''
        };
    }

    function summarizeTaskFamilyShare(taskRows) {
        var familyShare = {};
        var totalShare = 0;

        (taskRows || []).forEach(function (row) {
            totalShare += Math.max(0, toNumber(row.time_share_prior, 0));
        });

        (taskRows || []).forEach(function (row) {
            var familyId = row.task_family_id;
            var share = totalShare > 0
                ? (Math.max(0, toNumber(row.time_share_prior, 0)) / totalShare)
                : ((taskRows || []).length ? (1 / taskRows.length) : 0);
            if (!familyId) {
                return;
            }
            familyShare[familyId] = (familyShare[familyId] || 0) + share;
        });

        return familyShare;
    }

    function scoreRoleVariant(variantRow, context) {
        var questionnaireProfile = context && context.questionnaireProfile ? context.questionnaireProfile : null;
        var taskFamilyShare = context && context.taskFamilyShare ? context.taskFamilyShare : {};
        var activeFunctionRows = context && context.activeFunctionRows ? context.activeFunctionRows : [];
        var functionWeightTotal = sum((activeFunctionRows || []).map(function (row) {
            return Math.max(0, toNumber(row.function_weight, 0));
        }));
        var questionnaireScore = null;
        var taskScore = null;
        var functionScore = null;
        var scoreParts = [];
        var recommendationDrivers = [];

        if (questionnaireProfile && variantRow.questionnaire_signature.length) {
            var metricScores = variantRow.questionnaire_signature.map(function (metricRow) {
                var profileValue = toNumber(questionnaireProfile[metricRow.metric_key], null);
                if (profileValue === null) {
                    return null;
                }
                return clamp(1 - Math.abs(profileValue - metricRow.target), 0, 1);
            }).filter(function (value) {
                return value !== null;
            });
            if (metricScores.length) {
                questionnaireScore = average(metricScores);
                scoreParts.push({ score: questionnaireScore, weight: 0.50 });
                if (questionnaireScore >= 0.62) {
                    recommendationDrivers.push('questionnaire profile');
                }
            }
        }

        if (variantRow.preferred_task_families.length) {
            taskScore = clamp(sum(variantRow.preferred_task_families.map(function (familyId) {
                return toNumber(taskFamilyShare[familyId], 0);
            })), 0, 1);
            scoreParts.push({ score: taskScore, weight: 0.35 });
            if (taskScore >= 0.34) {
                recommendationDrivers.push('task mix');
            }
        }

        if (variantRow.preferred_function_ids.length) {
            var matchedFunctionWeight = sum((activeFunctionRows || []).filter(function (row) {
                return variantRow.preferred_function_ids.indexOf(row.function_id) !== -1;
            }).map(function (row) {
                return Math.max(0, toNumber(row.function_weight, 0));
            }));
            functionScore = functionWeightTotal > 0
                ? clamp(matchedFunctionWeight / functionWeightTotal, 0, 1)
                : 0;
            scoreParts.push({ score: functionScore, weight: 0.15 });
            if (functionScore >= 0.30) {
                recommendationDrivers.push('function mix');
            }
        }

        var totalWeight = sum(scoreParts.map(function (part) {
            return part.weight;
        }));
        var recommendationScore = totalWeight
            ? (sum(scoreParts.map(function (part) {
                return part.score * part.weight;
            })) / totalWeight)
            : (variantRow.is_default ? 0.55 : 0.50);
        recommendationScore = clamp(recommendationScore + (variantRow.is_default ? 0.02 : 0), 0, 1);

        if (!recommendationDrivers.length && variantRow.is_default) {
            recommendationDrivers.push('reviewed default baseline');
        }

        return {
            variant_id: variantRow.variant_id,
            variant_label: variantRow.variant_label,
            variant_summary: variantRow.variant_summary,
            variant_order: variantRow.variant_order,
            is_default: variantRow.is_default,
            task_ids: variantRow.task_ids.slice(),
            function_ids: variantRow.function_ids.slice(),
            preferred_task_families: variantRow.preferred_task_families.slice(),
            preferred_function_ids: variantRow.preferred_function_ids.slice(),
            recommendation_score: Number(recommendationScore.toFixed(3)),
            questionnaire_alignment: questionnaireScore === null ? null : Number(questionnaireScore.toFixed(3)),
            task_alignment: taskScore === null ? null : Number(taskScore.toFixed(3)),
            function_alignment: functionScore === null ? null : Number(functionScore.toFixed(3)),
            recommendation_drivers: recommendationDrivers,
            source_mix: variantRow.source_mix || '',
            notes: variantRow.notes || ''
        };
    }

    function resolveCompositionSelection(defaultIds, edits, addKey, removeKey) {
        var selectedMap = toLookup(defaultIds || []);
        var added = uniqueStrings(edits && edits[addKey] || []);
        var removed = uniqueStrings(edits && edits[removeKey] || []);

        added.forEach(function (id) {
            selectedMap[id] = true;
        });
        removed.forEach(function (id) {
            delete selectedMap[id];
        });

        return Object.keys(selectedMap);
    }

    function buildEditableTaskRow(task, selectedTaskLookup, linkedFunctions) {
        return {
            task_id: task.task_id,
            onet_task_id: task.onet_task_id,
            task_statement: task.task_statement,
            task_family_id: task.task_family_id,
            task_family_label: slugToLabel(task.task_family_id || 'task'),
            task_type: task.task_type || '',
            time_share_prior: Number(toNumber(task.time_share_prior, 0).toFixed(4)),
            value_centrality: Number(toNumber(task.value_centrality, 0).toFixed(4)),
            bargaining_power_weight: Number(toNumber(task.bargaining_power_weight, 0).toFixed(4)),
            source_label: taskSourceLabel(task),
            source_confidence: Number(toNumber(task.source_confidence, 0.45).toFixed(3)),
            linked_functions: linkedFunctions || [],
            selected_by_default: !!selectedTaskLookup[task.task_id]
        };
    }

    function buildEditableFunctionRow(functionMapRow, roleFunctionRow, selectedFunctionLookup) {
        return {
            function_id: functionMapRow.function_id,
            function_category: roleFunctionRow ? roleFunctionRow.function_category : null,
            role_summary: roleFunctionRow ? roleFunctionRow.role_summary : null,
            function_statement: roleFunctionRow ? roleFunctionRow.function_statement : null,
            function_weight: Number(toNumber(functionMapRow.function_weight, 0).toFixed(4)),
            source_confidence: Number(toNumber(functionMapRow.source_confidence, 0.45).toFixed(3)),
            selected_by_default: !!selectedFunctionLookup[functionMapRow.function_id]
        };
    }

    function parseCsv(text) {
        var rows = [];
        var row = [];
        var field = '';
        var inQuotes = false;
        var i;

        text = String(text || '').replace(/^\uFEFF/, '');

        for (i = 0; i < text.length; i += 1) {
            var char = text[i];
            var next = text[i + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (char === ',' && !inQuotes) {
                row.push(field);
                field = '';
                continue;
            }

            if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && next === '\n') {
                    i += 1;
                }
                row.push(field);
                field = '';
                if (row.length > 1 || row[0] !== '') {
                    rows.push(row);
                }
                row = [];
                continue;
            }

            field += char;
        }

        if (field.length || row.length) {
            row.push(field);
            rows.push(row);
        }

        if (!rows.length) {
            return [];
        }

        var headers = rows[0];
        return rows.slice(1).map(function (values) {
            var output = {};
            headers.forEach(function (header, index) {
                output[header] = values[index] !== undefined ? values[index] : '';
            });
            return output;
        });
    }

    async function loadText(path) {
        var isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

        if (!isBrowser && typeof require === 'function') {
            var fs = require('fs');
            return fs.promises.readFile(path, 'utf8');
        }

        if (typeof fetch === 'function') {
            var response = await fetch(path);
            if (!response.ok) {
                throw new Error('Failed to load ' + path + ' (' + response.status + ')');
            }
            return response.text();
        }

        throw new Error('No available file-loading mechanism for ' + path);
    }

    async function loadCsv(path) {
        return parseCsv(await loadText(path));
    }

    function normalizePath(basePath, relativePath) {
        if (!basePath) {
            return relativePath;
        }

        return String(basePath).replace(/[\\\/]+$/, '') + '/' + relativePath;
    }

    function indexBy(rows, key) {
        return rows.reduce(function (map, row) {
            map[row[key]] = row;
            return map;
        }, {});
    }

    function groupBy(rows, key) {
        return rows.reduce(function (map, row) {
            if (!map[row[key]]) {
                map[row[key]] = [];
            }
            map[row[key]].push(row);
            return map;
        }, {});
    }

    function computeLaborStats(rows) {
        var values = Array.isArray(rows) ? rows : [];
        var growthValues = [];
        var openingsRates = [];

        values.forEach(function (row) {
            var growth = toNumber(row && row.projection_growth_pct, null);
            var employment = Math.max(toNumber(row && row.employment_us, 0), 1);
            var openings = toNumber(row && row.annual_openings, null);

            if (growth !== null) {
                growthValues.push(growth);
            }
            if (openings !== null) {
                openingsRates.push(openings / employment);
            }
        });

        var minGrowth = growthValues.length ? Math.min.apply(null, growthValues) : 0;
        var maxGrowth = growthValues.length ? Math.max.apply(null, growthValues) : 1;
        var minOpeningsRate = openingsRates.length ? Math.min.apply(null, openingsRates) : 0;
        var maxOpeningsRate = openingsRates.length ? Math.max.apply(null, openingsRates) : 0.0001;

        return {
            minGrowth: minGrowth,
            maxGrowth: maxGrowth,
            minOpeningsRate: minOpeningsRate,
            maxOpeningsRate: maxOpeningsRate,
            growthRange: Math.max(1, maxGrowth - minGrowth),
            openingsRange: Math.max(0.0001, maxOpeningsRate - minOpeningsRate)
        };
    }

    function groupRoleMap(rows) {
        return rows.reduce(function (map, row) {
            if (!map[row.ui_role_key]) {
                map[row.ui_role_key] = [];
            }
            map[row.ui_role_key].push(row);
            return map;
        }, {});
    }

    function pickOccupationPrior(rows) {
        if (!rows || !rows.length) {
            return null;
        }

        return rows.slice().sort(function (left, right) {
            return toNumber(right.confidence, 0) - toNumber(left.confidence, 0);
        })[0];
    }

    function normalizeTaskWeights(taskClusters, overrides) {
        var totalOverride = 0;
        var weights = {};
        var priorConfidence = average(taskClusters.map(function (cluster) {
            return toNumber(cluster.evidence_confidence, 0.4);
        }));
        var priorConcentration = 0.75 + (priorConfidence * 1.5);

        taskClusters.forEach(function (cluster) {
            var overrideValue = overrides && overrides[cluster.task_cluster_id] !== undefined
                ? toNumber(overrides[cluster.task_cluster_id], 0)
                : 0;
            weights[cluster.task_cluster_id] = Math.max(0, overrideValue);
            totalOverride += weights[cluster.task_cluster_id];
        });

        if (priorConcentration + totalOverride <= 0) {
            return taskClusters.map(function (cluster) {
                return {
                    task_cluster_id: cluster.task_cluster_id,
                    share_prior: 1 / Math.max(taskClusters.length, 1),
                    importance_prior: toNumber(cluster.importance_prior, 0.5),
                    evidence_confidence: toNumber(cluster.evidence_confidence, 0.4),
                    bundle_prior_concentration: priorConcentration,
                    source_mix: cluster.source_mix || '',
                    notes: cluster.notes || ''
                };
            });
        }

        // Audit 2026-03-27: normalize posterior shares to sum to 1.0 even when
        // prior base shares do not, preventing systematic downward bias in
        // retainedShare and other share-weighted downstream metrics.
        var posteriorResults = taskClusters.map(function (cluster) {
            var baseShare = clamp(toNumber(cluster.share_prior, 0), 0, 1);
            var posteriorMass = (priorConcentration * baseShare) + weights[cluster.task_cluster_id];
            return {
                task_cluster_id: cluster.task_cluster_id,
                raw_posterior: posteriorMass,
                importance_prior: toNumber(cluster.importance_prior, 0.5),
                evidence_confidence: toNumber(cluster.evidence_confidence, 0.4),
                bundle_prior_concentration: priorConcentration,
                source_mix: cluster.source_mix || '',
                notes: cluster.notes || ''
            };
        });
        var posteriorTotal = posteriorResults.reduce(function (sum, r) { return sum + r.raw_posterior; }, 0) || 1;
        return posteriorResults.map(function (r) {
            r.share_prior = r.raw_posterior / posteriorTotal;
            delete r.raw_posterior;
            return r;
        });
    }

    function mergeSourceMix(left, right) {
        var seen = {};
        var merged = [];
        parsePipeList(left).concat(parsePipeList(right)).forEach(function (entry) {
            if (!entry || seen[entry]) {
                return;
            }
            seen[entry] = true;
            merged.push(entry);
        });
        return merged.join('|');
    }

    function summarizeTaskInventoryByCluster(taskRows) {
        var clusterMap = {};

        (taskRows || []).forEach(function (row) {
            var clusterId = row.task_family_id;
            if (!clusterId) {
                return;
            }
            if (!clusterMap[clusterId]) {
                clusterMap[clusterId] = {
                    inventory_share: 0,
                    weighted_value_centrality: 0,
                    weighted_bargaining_power: 0,
                    weighted_ai_support: 0,
                    weighted_confidence: 0,
                    core_share: 0,
                    supporting_share: 0,
                    source_mix: ''
                };
            }

            var share = clamp(toNumber(row.time_share_prior, 0), 0, 1);
            var valueCentrality = clamp(toNumber(row.value_centrality, 0.5), 0, 1);
            var bargainingWeight = clamp(toNumber(row.bargaining_power_weight, 0.5), 0, 1);
            var aiSupport = clamp(toNumber(row.ai_support_observability, 0.3), 0, 1);
            var sourceConfidence = clamp(toNumber(row.source_confidence, 0.4), 0, 1);
            var bucket = clusterMap[clusterId];

            bucket.inventory_share += share;
            bucket.weighted_value_centrality += valueCentrality * share;
            bucket.weighted_bargaining_power += bargainingWeight * share;
            bucket.weighted_ai_support += aiSupport * share;
            bucket.weighted_confidence += sourceConfidence * share;
            if (row.role_criticality === 'core') {
                bucket.core_share += share;
            } else if (row.role_criticality === 'supporting') {
                bucket.supporting_share += share;
            }
            bucket.source_mix = mergeSourceMix(bucket.source_mix, row.source_mix || '');
        });

        Object.keys(clusterMap).forEach(function (clusterId) {
            var bucket = clusterMap[clusterId];
            var total = Math.max(bucket.inventory_share, 0.0001);
            bucket.mean_value_centrality = bucket.weighted_value_centrality / total;
            bucket.mean_bargaining_power_weight = bucket.weighted_bargaining_power / total;
            bucket.mean_ai_support_observability = bucket.weighted_ai_support / total;
            bucket.mean_source_confidence = bucket.weighted_confidence / total;
            bucket.core_share = bucket.core_share / total;
            bucket.supporting_share = bucket.supporting_share / total;
        });

        return clusterMap;
    }

    function applyTaskShareOverrides(taskRows, taskShareOverrides) {
        var overrides = taskShareOverrides || {};
        return (taskRows || []).map(function (row) {
            var overrideValue = overrides[row.task_id];
            if (overrideValue === undefined || overrideValue === null || overrideValue === '') {
                return row;
            }

            var normalizedOverride = clamp(toNumber(overrideValue, toNumber(row.time_share_prior, 0)), 0.005, 0.95);
            var clone = {};
            Object.keys(row).forEach(function (key) {
                clone[key] = row[key];
            });
            clone.time_share_prior = normalizedOverride;
            return clone;
        });
    }

    function mergeRuntimeTaskFunctionLinks(taskRows, activeFunctionRows, baselineLinksByTaskId, customTaskFunctionLinks) {
        var rows = Array.isArray(taskRows) ? taskRows : [];
        var functionRows = Array.isArray(activeFunctionRows) ? activeFunctionRows : [];
        var activeTaskLookup = toLookup(rows.map(function (row) { return row.task_id; }));
        var activeFunctionLookup = toLookup(functionRows.map(function (row) { return row.function_id; }));
        var merged = {};

        rows.forEach(function (row) {
            var baselineLinks = (baselineLinksByTaskId[row.task_id] || []).filter(function (link) {
                return !!activeFunctionLookup[link.function_id];
            });

            baselineLinks.forEach(function (link) {
                var key = row.task_id + '|' + link.function_id;
                merged[key] = {
                    task_id: row.task_id,
                    function_id: link.function_id,
                    task_to_function_weight: clamp(toNumber(link.task_to_function_weight, 0.5), 0.05, 0.98),
                    is_custom: false
                };
            });
        });

        (customTaskFunctionLinks || []).forEach(function (link) {
            if (!link || !activeTaskLookup[link.task_id] || !activeFunctionLookup[link.function_id]) {
                return;
            }

            var key = link.task_id + '|' + link.function_id;
            var customWeight = clamp(toNumber(link.task_to_function_weight, 0.85), 0.05, 0.98);
            var existing = merged[key];

            if (existing) {
                existing.task_to_function_weight = clamp(Math.max(existing.task_to_function_weight, customWeight), 0.05, 0.98);
                existing.is_custom = true;
            } else {
                merged[key] = {
                    task_id: link.task_id,
                    function_id: link.function_id,
                    task_to_function_weight: customWeight,
                    is_custom: true
                };
            }
        });

        return Object.keys(merged).map(function (key) {
            return merged[key];
        });
    }

    function applyTaskFunctionLinks(taskRows, taskFunctionLinks, activeFunctionRows, accountabilityByFunctionId) {
        var rows = Array.isArray(taskRows) ? taskRows : [];
        var links = Array.isArray(taskFunctionLinks) ? taskFunctionLinks : [];
        if (!rows.length || !links.length) {
            return rows;
        }

        var functionRowsById = indexBy(activeFunctionRows || [], 'function_id');
        var linksByTaskId = {};
        links.forEach(function (link) {
            if (!link || !link.task_id || !link.function_id || !functionRowsById[link.function_id]) {
                return;
            }
            if (!linksByTaskId[link.task_id]) {
                linksByTaskId[link.task_id] = [];
            }
            linksByTaskId[link.task_id].push(link);
        });

        return rows.map(function (row) {
            var taskLinks = linksByTaskId[row.task_id] || [];
            if (!taskLinks.length) {
                return row;
            }

            var totalWeight = sum(taskLinks.map(function (link) {
                var functionWeight = Math.max(toNumber(functionRowsById[link.function_id].function_weight, 0.2), 0.05);
                return functionWeight * clamp(toNumber(link.task_to_function_weight, 0.5), 0.05, 0.98);
            })) || taskLinks.length;

            var authority = 0;
            var bargaining = 0;
            var judgment = 0;
            var customLinkCount = 0;
            taskLinks.forEach(function (link) {
                var functionRow = functionRowsById[link.function_id];
                var accountability = accountabilityByFunctionId[link.function_id] || {};
                var functionWeight = Math.max(toNumber(functionRow.function_weight, 0.2), 0.05);
                var edgeWeight = clamp(toNumber(link.task_to_function_weight, 0.5), 0.05, 0.98);
                var weight = (functionWeight * edgeWeight) / totalWeight;
                authority += toNumber(accountability.human_authority_requirement, 0.6) * weight;
                bargaining += toNumber(accountability.bargaining_power_retention, 0.6) * weight;
                judgment += toNumber(accountability.judgment_requirement, 0.6) * weight;
                if (link.is_custom) {
                    customLinkCount += 1;
                }
            });

            var clone = {};
            Object.keys(row).forEach(function (key) {
                clone[key] = row[key];
            });
            clone.value_centrality = Number(clamp(
                (toNumber(row.value_centrality, 0.5) * 0.68) +
                (judgment * 0.18) +
                (authority * 0.14),
                0, 1
            ).toFixed(4));
            clone.bargaining_power_weight = Number(clamp(
                (toNumber(row.bargaining_power_weight, 0.5) * 0.64) +
                (bargaining * 0.20) +
                (authority * 0.16),
                0, 1
            ).toFixed(4));
            if (authority >= 0.62 || bargaining >= 0.66) {
                clone.role_criticality = 'core';
            }
            clone.function_link_count = taskLinks.length;
            clone.custom_function_link_count = customLinkCount;
            return clone;
        });
    }

    function buildTaskClustersFromInventory(taskRows) {
        var clusterMap = summarizeTaskInventoryByCluster(taskRows);
        var clusterIds = Object.keys(clusterMap);
        var totalInventoryShare = sum(clusterIds.map(function (clusterId) {
            return clusterMap[clusterId].inventory_share;
        })) || 1;

        return clusterIds.map(function (clusterId) {
            var cluster = clusterMap[clusterId];
            return {
                task_cluster_id: clusterId,
                share_prior: cluster.inventory_share / totalInventoryShare,
                importance_prior: cluster.mean_value_centrality,
                evidence_confidence: cluster.mean_source_confidence,
                source_mix: cluster.source_mix,
                notes: 'role_graph_inventory_fallback'
            };
        });
    }

    function mergeTaskClustersWithInventory(taskClusters, taskRows) {
        var baseRows = Array.isArray(taskClusters) ? taskClusters.slice() : [];
        var inventoryRows = Array.isArray(taskRows) ? taskRows : [];
        var inventoryClusters = buildTaskClustersFromInventory(inventoryRows);

        if (!baseRows.length) {
            return inventoryClusters;
        }
        if (!inventoryClusters.length) {
            return baseRows;
        }

        var baseById = indexBy(baseRows, 'task_cluster_id');
        var inventoryById = indexBy(inventoryClusters, 'task_cluster_id');
        var clusterIds = {};
        baseRows.forEach(function (row) { clusterIds[row.task_cluster_id] = true; });
        inventoryClusters.forEach(function (row) { clusterIds[row.task_cluster_id] = true; });

        var mergedRows = [];
        var totalShare = 0;
        Object.keys(clusterIds).forEach(function (clusterId) {
            var base = baseById[clusterId];
            var inventory = inventoryById[clusterId];
            var sharePrior = base && inventory
                ? ((toNumber(base.share_prior, 0) * 0.65) + (toNumber(inventory.share_prior, 0) * 0.35))
                : toNumber(base ? base.share_prior : inventory.share_prior, 0);
            totalShare += sharePrior;
            mergedRows.push({
                task_cluster_id: clusterId,
                share_prior: sharePrior,
                importance_prior: average([
                    base ? toNumber(base.importance_prior, null) : null,
                    inventory ? toNumber(inventory.importance_prior, null) : null
                ]),
                evidence_confidence: average([
                    base ? toNumber(base.evidence_confidence, null) : null,
                    inventory ? toNumber(inventory.evidence_confidence, null) : null
                ]),
                source_mix: mergeSourceMix(base ? base.source_mix : '', inventory ? inventory.source_mix : ''),
                notes: (base ? (base.notes || '') : 'inventory_only') + (inventory ? '|inventory_blend' : '')
            });
        });

        if (totalShare > 0) {
            mergedRows.forEach(function (row) {
                row.share_prior = row.share_prior / totalShare;
            });
        }

        return mergedRows;
    }

    function summarizeActiveFunctions(functionMapRows, accountabilityByFunctionId) {
        var rows = Array.isArray(functionMapRows) ? functionMapRows.slice() : [];
        if (!rows.length) {
            return null;
        }

        var totalWeight = sum(rows.map(function (row) {
            return Math.max(toNumber(row.function_weight, 0), 0);
        })) || rows.length;

        var normalizedRows = rows.map(function (row) {
            var accountability = accountabilityByFunctionId[row.function_id] || {};
            var weight = Math.max(toNumber(row.function_weight, 0), 0);
            return {
                function_id: row.function_id,
                function_weight: totalWeight > 0 ? (weight / totalWeight) : (1 / rows.length),
                delegability_guardrail: toNumber(row.delegability_guardrail, 0.55),
                judgment_requirement: toNumber(accountability.judgment_requirement, 0.6),
                trust_requirement: toNumber(accountability.trust_requirement, 0.6),
                regulatory_liability_weight: toNumber(accountability.regulatory_liability_weight, 0.6),
                human_authority_requirement: toNumber(accountability.human_authority_requirement, 0.6),
                bargaining_power_retention: toNumber(accountability.bargaining_power_retention, 0.6),
                source_confidence: average([
                    toNumber(row.source_confidence, null),
                    toNumber(accountability.source_confidence, null)
                ])
            };
        });

        return {
            function_count: normalizedRows.length,
            delegability_guardrail: weightedAverage(normalizedRows, 'delegability_guardrail', 'function_weight'),
            judgment_requirement: weightedAverage(normalizedRows, 'judgment_requirement', 'function_weight'),
            trust_requirement: weightedAverage(normalizedRows, 'trust_requirement', 'function_weight'),
            regulatory_liability_weight: weightedAverage(normalizedRows, 'regulatory_liability_weight', 'function_weight'),
            human_authority_requirement: weightedAverage(normalizedRows, 'human_authority_requirement', 'function_weight'),
            bargaining_power_retention: weightedAverage(normalizedRows, 'bargaining_power_retention', 'function_weight'),
            source_confidence: weightedAverage(normalizedRows, 'source_confidence', 'function_weight')
        };
    }

    function getRoleTransformationLabel(type) {
        return ROLE_TRANSFORMATION_TYPE_LABELS[type] || String(type || '').replace(/_/g, ' ');
    }

    function getConfidenceBandKey(value) {
        var score = clamp(toNumber(value, 0.5), 0, 1);
        if (score >= 0.72) {
            return 'high';
        }
        if (score >= 0.50) {
            return 'medium';
        }
        return 'low';
    }

    function classifyLiveRoleTransformationType(metrics) {
        var weightedDirectPressure = clamp(toNumber(metrics.direct_task_pressure, 0), 0, 1);
        var functionExposurePressure = clamp(toNumber(metrics.function_exposure_pressure, 0), 0, 1);
        var retainedFunctionStrength = clamp(toNumber(metrics.retained_function_strength, 0), 0, 1);
        var retainedAccountabilityStrength = clamp(toNumber(metrics.retained_accountability_strength, 0), 0, 1);
        var retainedBargainingPower = clamp(toNumber(metrics.retained_bargaining_power, 0), 0, 1);
        var roleFragmentationRisk = clamp(toNumber(metrics.role_fragmentation_risk, 0), 0, 1);
        var roleCompressibility = clamp(toNumber(metrics.role_compressibility, 0), 0, 1);
        var demandExpansionSignal = clamp(toNumber(metrics.demand_expansion_signal, 0), 0, 1);
        var delegationLikelihood = clamp(toNumber(metrics.delegation_likelihood, 0), 0, 1);
        var headcountDisplacementRisk = clamp(toNumber(metrics.headcount_displacement_risk, 0), 0, 1);

        if (headcountDisplacementRisk >= 0.68 && retainedFunctionStrength < 0.45) {
            return 'substitution_pressure';
        }
        if (weightedDirectPressure >= 0.55 && retainedFunctionStrength >= 0.58 && delegationLikelihood >= 0.55) {
            return 'augmented_core_role';
        }
        if (roleFragmentationRisk >= 0.60 && roleCompressibility >= 0.55) {
            return 'workflow_fragmentation';
        }
        if (functionExposurePressure >= 0.55 && retainedAccountabilityStrength >= 0.60) {
            return 'delegated_but_retained_function';
        }
        if (
            (weightedDirectPressure < 0.33 && retainedFunctionStrength >= 0.60 && headcountDisplacementRisk < 0.28) ||
            (retainedFunctionStrength >= 0.78 && retainedAccountabilityStrength >= 0.80 && headcountDisplacementRisk < 0.28) ||
            (retainedFunctionStrength >= 0.72 && retainedBargainingPower >= 0.74 && weightedDirectPressure < 0.32 && headcountDisplacementRisk < 0.24)
        ) {
            return 'limited_near_term_change';
        }
        return 'workflow_recomposition';
    }

    function buildLiveFunctionMetrics(options) {
        var taskRows = options && Array.isArray(options.taskRows) ? options.taskRows : [];
        var taskFunctionLinks = options && Array.isArray(options.taskFunctionLinks) ? options.taskFunctionLinks : [];
        var activeFunctionRows = options && Array.isArray(options.activeFunctionRows) ? options.activeFunctionRows : [];
        var roleFunctionsById = options && options.roleFunctionsById ? options.roleFunctionsById : {};
        var functionAccountabilityByFunctionId = options && options.functionAccountabilityByFunctionId ? options.functionAccountabilityByFunctionId : {};
        var functionSummary = options && options.functionSummary ? options.functionSummary : null;
        var signals = options && options.signals ? options.signals : {};
        var adaptationPrior = options && options.adaptationPrior ? options.adaptationPrior : null;
        var laborContext = options && options.laborContext ? options.laborContext : null;
        var laborStats = options && options.laborStats ? options.laborStats : null;
        var runtimeContext = options && options.runtimeContext ? options.runtimeContext : null;
        var functionContext = options && options.functionContext ? options.functionContext : null;
        var occupationAdaptive = clamp(toNumber(options && options.occupationAdaptive, 0.5), 0, 1);
        var linksByTaskId = groupBy(taskFunctionLinks, 'task_id');
        var functionRowsById = indexBy(activeFunctionRows, 'function_id');
        var weightedDirectPressure = 0;
        var weightedIndirectPressure = 0;
        var weightedFunctionPressure = 0;
        var functionWeightTotal = 0;
        var weightedBargaining = 0;
        var weightedRetainedLeverage = 0;
        var weightedAiSupport = 0;
        var supportHighPressureShare = 0;
        var routineHighPressureShare = 0;
        var adaptationNotes = adaptationPrior && adaptationPrior.notes ? adaptationPrior.notes : '';
        var knowledgeShare = clamp(
            parseNoteMetric(adaptationNotes, 'knowledge_share') !== null
                ? parseNoteMetric(adaptationNotes, 'knowledge_share')
                : 0.35,
            0,
            1
        );
        var peopleShare = clamp(
            parseNoteMetric(adaptationNotes, 'people_share') !== null
                ? parseNoteMetric(adaptationNotes, 'people_share')
                : 0.30,
            0,
            1
        );
        var codifiableKnowledgeShare = 0;
        var perFunction = {};

        if (!taskRows.length || !activeFunctionRows.length || !functionSummary) {
            return null;
        }

        taskRows.forEach(function (task) {
            var share = clamp(toNumber(task.share_of_role, 0), 0, 1);
            var directPressure = clamp(toNumber(task.direct_exposure_pressure, 0), 0, 1);
            var indirectPressure = clamp(toNumber(task.indirect_dependency_pressure, 0), 0, 1);
            var bargainingWeight = clamp(toNumber(task.bargaining_power_weight, 0.5), 0, 1);
            var aiSupportObservability = clamp(toNumber(task.ai_support_observability, 0.3), 0, 1);
            var retainedLeverage = clamp(toNumber(task.retained_leverage, 0.5), 0, 1);
            var links = (linksByTaskId[task.task_id] || []).filter(function (link) {
                return !!functionRowsById[link.function_id];
            });

            weightedDirectPressure += share * directPressure;
            weightedIndirectPressure += share * indirectPressure;
            weightedBargaining += share * bargainingWeight;
            weightedRetainedLeverage += share * retainedLeverage;
            weightedAiSupport += share * aiSupportObservability;

            if (task.role_criticality !== 'core' && directPressure >= 0.60) {
                supportHighPressureShare += share;
            }
            if (
                (task.task_cluster_id === 'cluster_execution_routine' ||
                task.task_cluster_id === 'cluster_workflow_admin' ||
                task.task_cluster_id === 'cluster_documentation') &&
                directPressure >= 0.55
            ) {
                routineHighPressureShare += share;
            }
            if (
                (task.task_cluster_id === 'cluster_drafting' ||
                task.task_cluster_id === 'cluster_documentation' ||
                task.task_cluster_id === 'cluster_research_synthesis') &&
                directPressure >= (knowledgeShare >= 0.56 && peopleShare <= 0.42 ? 0.46 : 0.52)
            ) {
                codifiableKnowledgeShare += share;
            }

            links.forEach(function (link) {
                var functionRow = functionRowsById[link.function_id];
                var functionWeight = Math.max(toNumber(functionRow.function_weight, 0.2), 0.05);
                var edgeWeight = clamp(toNumber(link.task_to_function_weight, 0.5), 0.05, 0.98);
                var combinedWeight = functionWeight * edgeWeight;
                var functionPressure = clamp((directPressure * 0.78) + (indirectPressure * 0.22), 0, 1);

                weightedFunctionPressure += combinedWeight * functionPressure;
                functionWeightTotal += combinedWeight;

                if (!perFunction[link.function_id]) {
                    perFunction[link.function_id] = {
                        function_id: link.function_id,
                        function_weight: functionWeight,
                        pressure_numerator: 0,
                        weight_total: 0,
                        retained_numerator: 0,
                        supported_share: 0,
                        exposed_share: 0,
                        custom_link_count: 0
                    };
                }

                perFunction[link.function_id].pressure_numerator += combinedWeight * functionPressure;
                perFunction[link.function_id].weight_total += combinedWeight;
                perFunction[link.function_id].retained_numerator += combinedWeight * retainedLeverage;
                perFunction[link.function_id].supported_share += share * edgeWeight;
                perFunction[link.function_id].exposed_share += share * directPressure * edgeWeight;
                if (link.is_custom) {
                    perFunction[link.function_id].custom_link_count += 1;
                }
            });
        });

        var functionExposurePressure = functionWeightTotal > 0
            ? clamp(weightedFunctionPressure / functionWeightTotal, 0, 1)
            : weightedDirectPressure;
        var weightedAugmentation = clamp(
            (weightedAiSupport * 0.45) + (clamp(toNumber(signals.augmentationFit, 0.5), 0, 1) * 0.55),
            0,
            1
        );
        routineHighPressureShare = clamp(routineHighPressureShare + (codifiableKnowledgeShare * 0.65), 0, 1);
        var learningIntensity = clamp(toNumber(adaptationPrior && adaptationPrior.learning_intensity_score, occupationAdaptive), 0, 1);
        var specializationContext = clamp(
            (knowledgeShare * 0.42) +
            (learningIntensity * 0.33) +
            (occupationAdaptive * 0.25),
            0,
            1
        );
        var guardrail = clamp(toNumber(functionSummary.delegability_guardrail, 0.55), 0, 1);
        var authorityRequirement = clamp(toNumber(functionSummary.human_authority_requirement, 0.6), 0, 1);
        var judgmentRequirement = clamp(toNumber(functionSummary.judgment_requirement, 0.6), 0, 1);
        var trustRequirement = clamp(toNumber(functionSummary.trust_requirement, 0.6), 0, 1);
        var liabilityRequirement = clamp(toNumber(functionSummary.regulatory_liability_weight, 0.6), 0, 1);
        var managerialOwnershipLift = clamp(
            (Math.max(0, peopleShare - 0.42) * 0.14) +
            (Math.max(0, authorityRequirement - 0.58) * 0.10) +
            (Math.max(0, trustRequirement - 0.58) * 0.06),
            0,
            0.12
        );
        var retainedFunctionStrength = clamp(
            ((1 - functionExposurePressure) * 0.42) +
            (guardrail * 0.42) +
            (weightedBargaining * 0.16),
            0,
            1
        );
        var authoredRetainedAccountabilityStrength = clamp(
            ((1 - functionExposurePressure) * 0.18) +
            (guardrail * 0.20) +
            (authorityRequirement * 0.22) +
            (judgmentRequirement * 0.16) +
            (trustRequirement * 0.10) +
            (liabilityRequirement * 0.08) +
            managerialOwnershipLift,
            0,
            1
        );
        var functionBargainingRetention = clamp(toNumber(functionSummary.bargaining_power_retention, guardrail), 0, 1);
        var authoredRetainedBargainingPower = clamp(
            (weightedRetainedLeverage * 0.34) +
            (functionBargainingRetention * 0.24) +
            (guardrail * 0.14) +
            (weightedBargaining * 0.12) +
            (authoredRetainedAccountabilityStrength * 0.08) +
            ((1 - weightedDirectPressure) * 0.08) +
            ((specializationContext - 0.50) * 0.22) +
            (Math.max(0, specializationContext - 0.72) * 0.22) -
            (supportHighPressureShare * 0.10) -
            (routineHighPressureShare * 0.08),
            0,
            1
        );
        var authoredRoleFragmentationRisk = clamp(
            (supportHighPressureShare * 0.34) +
            (weightedDirectPressure * 0.18) +
            (weightedIndirectPressure * 0.18) +
            ((1 - retainedFunctionStrength) * 0.16) +
            ((1 - authoredRetainedAccountabilityStrength) * 0.14),
            0,
            1
        );
        var accountabilityContext = functionContext ? clamp(toNumber(functionContext.accountability_context, null), 0, 1) : null;
        var bargainingContext = functionContext ? clamp(toNumber(functionContext.bargaining_power_context, null), 0, 1) : null;
        var fragmentationContext = functionContext ? clamp(toNumber(functionContext.fragmentation_context, null), 0, 1) : null;
        var accountabilityContextConfidence = functionContext ? clamp(toNumber(functionContext.accountability_context_confidence, 0.45), 0, 1) : 0;
        var bargainingContextConfidence = functionContext ? clamp(toNumber(functionContext.bargaining_context_confidence, 0.45), 0, 1) : 0;
        var fragmentationContextConfidence = functionContext ? clamp(toNumber(functionContext.fragmentation_context_confidence, 0.45), 0, 1) : 0;
        var accountabilityBlendWeight = accountabilityContext === null
            ? 0
            : (0.10 + (accountabilityContextConfidence * 0.18));
        var bargainingBlendWeight = bargainingContext === null
            ? 0
            : (0.10 + (bargainingContextConfidence * 0.18));
        var fragmentationBlendWeight = fragmentationContext === null
            ? 0
            : (0.08 + (fragmentationContextConfidence * 0.18));
        var retainedAccountabilityStrength = accountabilityBlendWeight > 0
            ? clamp(
                ((1 - accountabilityBlendWeight) * authoredRetainedAccountabilityStrength) +
                (accountabilityBlendWeight * accountabilityContext),
                0,
                1
            )
            : authoredRetainedAccountabilityStrength;
        var retainedBargainingPower = bargainingBlendWeight > 0
            ? clamp(
                ((1 - bargainingBlendWeight) * authoredRetainedBargainingPower) +
                (bargainingBlendWeight * bargainingContext),
                0,
                1
            )
            : authoredRetainedBargainingPower;
        var roleFragmentationRisk = fragmentationBlendWeight > 0
            ? clamp(
                ((1 - fragmentationBlendWeight) * authoredRoleFragmentationRisk) +
                (fragmentationBlendWeight * fragmentationContext),
                0,
                1
            )
            : authoredRoleFragmentationRisk;
        var roleCompressibility = clamp(
            (routineHighPressureShare * 0.34) +
            (supportHighPressureShare * 0.26) +
            (weightedDirectPressure * 0.18) +
            ((1 - retainedAccountabilityStrength) * 0.12) +
            ((1 - retainedBargainingPower) * 0.10),
            0,
            1
        );
        var adaptiveCapacity = adaptationPrior ? clamp(toNumber(adaptationPrior.adaptive_capacity_score, occupationAdaptive), 0, 1) : occupationAdaptive;
        var transferability = adaptationPrior ? clamp(toNumber(adaptationPrior.transferability_score, occupationAdaptive), 0, 1) : occupationAdaptive;
        // Reassign (not redeclare) for the demand-expansion context below
        learningIntensity = adaptationPrior ? clamp(toNumber(adaptationPrior.learning_intensity_score, occupationAdaptive), 0, 1) : occupationAdaptive;
        var growthNorm = 0.5;
        var openingsNorm = 0.5;
        var laborDemandContext = runtimeContext ? clamp(toNumber(runtimeContext.labor_demand_context, null), 0, 1) : null;
        var laborTightnessContext = runtimeContext ? clamp(toNumber(runtimeContext.labor_tightness_context, null), 0, 1) : null;
        var demandExpansionContext = runtimeContext ? clamp(toNumber(runtimeContext.demand_expansion_context, null), 0, 1) : null;
        var aiAdoptionContext = runtimeContext ? clamp(toNumber(runtimeContext.ai_adoption_context, null), 0, 1) : null;
        var adoptionRealizationContext = runtimeContext ? clamp(toNumber(runtimeContext.adoption_realization_context, null), 0, 1) : null;

        if (laborContext && laborStats) {
            growthNorm = clamp(
                (toNumber(laborContext.projection_growth_pct, laborStats.minGrowth) - laborStats.minGrowth) / laborStats.growthRange,
                0,
                1
            );
            openingsNorm = clamp(
                ((toNumber(laborContext.annual_openings, 0) / Math.max(1, toNumber(laborContext.employment_us, 0))) - laborStats.minOpeningsRate) / laborStats.openingsRange,
                0,
                1
            );
        }

        if (laborDemandContext === null) {
            laborDemandContext = clamp(
                (growthNorm * 0.55) +
                (openingsNorm * 0.25) +
                0.20,
                0,
                1
            );
        }
        if (laborTightnessContext === null) {
            laborTightnessContext = clamp(
                (openingsNorm * 0.60) +
                0.20,
                0,
                1
            );
        }
        if (demandExpansionContext === null) {
            demandExpansionContext = clamp(
                (laborDemandContext * 0.70) +
                (laborTightnessContext * 0.30),
                0,
                1
            );
        }
        if (aiAdoptionContext === null) {
            aiAdoptionContext = clamp(toNumber(signals.adoptionPressure, 0.5), 0, 1);
        }
        if (adoptionRealizationContext === null) {
            adoptionRealizationContext = aiAdoptionContext;
        }

        // demand_floor_suppression (0–1, default 1.0): scales adaptation terms in the demand
        // expansion signal for occupations where BLS projects strong decline but adaptive
        // capacity scores would otherwise create an unrealistic demand floor.
        var demandFloorSuppression = runtimeContext
            ? clamp(toNumber(runtimeContext.demand_floor_suppression, 1.0), 0, 1)
            : 1.0;
        var demandExpansionSignal = clamp(
            (adaptiveCapacity * 0.22 * demandFloorSuppression) +
            (transferability * 0.16 * demandFloorSuppression) +
            (learningIntensity * 0.12 * demandFloorSuppression) +
            (demandExpansionContext * 0.34) +
            (laborTightnessContext * 0.16),
            0,
            1
        );
        var delegationLikelihood = clamp(
            (functionExposurePressure * 0.34) +
            (weightedDirectPressure * 0.24) +
            (weightedAugmentation * 0.20) +
            ((1 - retainedAccountabilityStrength) * 0.12) +
            (supportHighPressureShare * 0.10),
            0,
            1
        );
        var headcountDisplacementRisk = clamp(
            (weightedDirectPressure * 0.18) +
            (weightedIndirectPressure * 0.12) +
            (roleFragmentationRisk * 0.22) +
            (roleCompressibility * 0.22) +
            ((1 - retainedFunctionStrength) * 0.18) +
            ((1 - demandExpansionSignal) * 0.08),
            0,
            1
        );
        var confidenceScore = clamp(average([
            clamp(toNumber(functionSummary.source_confidence, 0.6), 0, 1),
            clamp(toNumber(options.directCoverageRatio, 0.5), 0, 1),
            clamp(toNumber(options.recompositionConfidence, 0.5), 0, 1),
            average([
                accountabilityContextConfidence,
                bargainingContextConfidence,
                fragmentationContextConfidence
            ], null)
        ]), 0, 1);
        var roleTransformationType = classifyLiveRoleTransformationType({
            direct_task_pressure: weightedDirectPressure,
            function_exposure_pressure: functionExposurePressure,
            retained_function_strength: retainedFunctionStrength,
            retained_accountability_strength: retainedAccountabilityStrength,
            retained_bargaining_power: retainedBargainingPower,
            role_fragmentation_risk: roleFragmentationRisk,
            role_compressibility: roleCompressibility,
            demand_expansion_signal: demandExpansionSignal,
            delegation_likelihood: delegationLikelihood,
            headcount_displacement_risk: headcountDisplacementRisk
        });

        var perFunctionBreakdown = activeFunctionRows.map(function (functionRow) {
            var functionId = functionRow.function_id;
            var bucket = perFunction[functionId] || {
                pressure_numerator: 0,
                weight_total: 0,
                retained_numerator: 0,
                supported_share: 0,
                exposed_share: 0,
                custom_link_count: 0
            };
            var accountability = functionAccountabilityByFunctionId[functionId] || {};
            var functionPressure = bucket.weight_total > 0
                ? clamp(bucket.pressure_numerator / bucket.weight_total, 0, 1)
                : functionExposurePressure;
            var functionGuardrail = clamp(toNumber(functionRow.delegability_guardrail, guardrail), 0, 1);
            var retainedStrength = clamp(
                ((1 - functionPressure) * 0.42) +
                (functionGuardrail * 0.38) +
                (clamp(toNumber(accountability.bargaining_power_retention, 0.6), 0, 1) * 0.20),
                0,
                1
            );
            var roleFunction = roleFunctionsById[functionId] || {};

            return {
                function_id: functionId,
                function_category: roleFunction.function_category || null,
                role_summary: roleFunction.role_summary || null,
                function_statement: roleFunction.function_statement || null,
                function_weight: Number(toNumber(functionRow.function_weight, 0).toFixed(3)),
                exposure_pressure: Number(functionPressure.toFixed(3)),
                retained_strength: Number(retainedStrength.toFixed(3)),
                supported_share: Number(clamp(bucket.supported_share, 0, 1).toFixed(3)),
                exposed_share: Number(clamp(bucket.exposed_share, 0, 1).toFixed(3)),
                custom_link_count: bucket.custom_link_count
            };
        }).sort(function (left, right) {
            return right.function_weight - left.function_weight;
        });
        var functionCategorySignals = summarizeFunctionCategorySignals(perFunctionBreakdown);

        return {
            function_exposure_pressure: Number(functionExposurePressure.toFixed(3)),
            retained_function_strength: Number(retainedFunctionStrength.toFixed(3)),
            retained_accountability_strength: Number(retainedAccountabilityStrength.toFixed(3)),
            retained_bargaining_power: Number(retainedBargainingPower.toFixed(3)),
            role_fragmentation_risk: Number(roleFragmentationRisk.toFixed(3)),
            role_compressibility: Number(roleCompressibility.toFixed(3)),
            accountability_context: accountabilityContext === null ? null : Number(accountabilityContext.toFixed(3)),
            bargaining_power_context: bargainingContext === null ? null : Number(bargainingContext.toFixed(3)),
            fragmentation_context: fragmentationContext === null ? null : Number(fragmentationContext.toFixed(3)),
            accountability_context_confidence: Number(accountabilityContextConfidence.toFixed(3)),
            bargaining_context_confidence: Number(bargainingContextConfidence.toFixed(3)),
            fragmentation_context_confidence: Number(fragmentationContextConfidence.toFixed(3)),
            demand_expansion_signal: Number(demandExpansionSignal.toFixed(3)),
            demand_expansion_context: Number(demandExpansionContext.toFixed(3)),
            labor_demand_context: Number(laborDemandContext.toFixed(3)),
            labor_tightness_context: Number(laborTightnessContext.toFixed(3)),
            ai_adoption_context: Number(aiAdoptionContext.toFixed(3)),
            adoption_realization_context: Number(adoptionRealizationContext.toFixed(3)),
            delegation_likelihood: Number(delegationLikelihood.toFixed(3)),
            headcount_displacement_risk: Number(headcountDisplacementRisk.toFixed(3)),
            role_transformation_type: roleTransformationType,
            confidence_score: Number(confidenceScore.toFixed(3)),
            support_high_pressure_share: Number(clamp(supportHighPressureShare, 0, 1).toFixed(3)),
            routine_high_pressure_share: Number(clamp(routineHighPressureShare, 0, 1).toFixed(3)),
            function_category_signals: functionCategorySignals,
            per_function_breakdown: perFunctionBreakdown
        };
    }

    function buildLiveOccupationExplanation(options) {
        var occupation = options && options.occupation ? options.occupation : null;
        var functionMetrics = options && options.functionMetrics ? options.functionMetrics : null;
        var directCoverageRatio = clamp(toNumber(options && options.directCoverageRatio, 0.5), 0, 1);
        var activeFunctionRows = options && Array.isArray(options.activeFunctionRows) ? options.activeFunctionRows : [];
        var roleFunctionsById = options && options.roleFunctionsById ? options.roleFunctionsById : {};

        if (!occupation || !functionMetrics) {
            return null;
        }

        var metricValues = {
            direct_task_pressure: clamp(toNumber(options.directTaskPressure, 0), 0, 1),
            function_exposure_pressure: clamp(toNumber(functionMetrics.function_exposure_pressure, 0), 0, 1),
            indirect_dependency_pressure: clamp(toNumber(options.indirectDependencyPressure, 0), 0, 1),
            role_fragmentation_risk: clamp(toNumber(functionMetrics.role_fragmentation_risk, 0), 0, 1),
            role_compressibility: clamp(toNumber(functionMetrics.role_compressibility, 0), 0, 1),
            headcount_displacement_risk: clamp(toNumber(functionMetrics.headcount_displacement_risk, 0), 0, 1),
            delegation_likelihood: clamp(toNumber(functionMetrics.delegation_likelihood, 0), 0, 1),
            demand_expansion_signal: clamp(toNumber(functionMetrics.demand_expansion_signal, 0), 0, 1),
            retained_function_strength: clamp(toNumber(functionMetrics.retained_function_strength, 0), 0, 1),
            retained_accountability_strength: clamp(toNumber(functionMetrics.retained_accountability_strength, 0), 0, 1),
            retained_bargaining_power: clamp(toNumber(functionMetrics.retained_bargaining_power, 0), 0, 1)
        };
        var transformationType = functionMetrics.role_transformation_type;
        var driverKeys = transformationType === 'augmented_core_role'
            ? ['demand_expansion_signal', 'delegation_likelihood', 'direct_task_pressure', 'function_exposure_pressure']
            : transformationType === 'delegated_but_retained_function'
                ? ['delegation_likelihood', 'function_exposure_pressure', 'direct_task_pressure', 'indirect_dependency_pressure']
                : transformationType === 'workflow_fragmentation'
                    ? ['role_fragmentation_risk', 'indirect_dependency_pressure', 'function_exposure_pressure', 'direct_task_pressure']
                    : transformationType === 'substitution_pressure'
                        ? ['headcount_displacement_risk', 'role_compressibility', 'direct_task_pressure', 'function_exposure_pressure']
                        : transformationType === 'limited_near_term_change'
                            ? ['direct_task_pressure', 'function_exposure_pressure', 'role_compressibility', 'headcount_displacement_risk']
                            : ['role_compressibility', 'function_exposure_pressure', 'direct_task_pressure', 'headcount_displacement_risk'];
        var counterweightKeys = (transformationType === 'augmented_core_role')
            ? ['retained_function_strength', 'retained_accountability_strength', 'demand_expansion_signal', 'retained_bargaining_power']
            : (transformationType === 'delegated_but_retained_function')
                ? ['retained_accountability_strength', 'retained_function_strength', 'retained_bargaining_power', 'demand_expansion_signal']
                : (transformationType === 'limited_near_term_change')
                    ? ['retained_function_strength', 'retained_accountability_strength', 'retained_bargaining_power', 'demand_expansion_signal']
                    : ['retained_bargaining_power', 'retained_function_strength', 'retained_accountability_strength', 'demand_expansion_signal'];
        var topDrivers = driverKeys.map(function (key) {
            return { key: key, value: metricValues[key] };
        }).sort(function (left, right) {
            return right.value - left.value;
        }).slice(0, 2);
        var topCounterweight = counterweightKeys.map(function (key) {
            return { key: key, value: metricValues[key] };
        }).sort(function (left, right) {
            return right.value - left.value;
        })[0];
        var topFunctions = activeFunctionRows.slice().sort(function (left, right) {
            return toNumber(right.function_weight, 0) - toNumber(left.function_weight, 0);
        }).slice(0, 2);
        var functionSummary = topFunctions.map(function (functionRow) {
            var roleFunction = roleFunctionsById[functionRow.function_id] || {};
            return (roleFunction.function_category || slugToLabel(functionRow.function_id)) + ' (' + Math.round(toNumber(functionRow.function_weight, 0) * 100) + '%)';
        }).join('; ');
        var evidenceProfile = 'direct ' + Math.round(directCoverageRatio * 100) + '% | fallback ' + Math.round((1 - directCoverageRatio) * 100) + '% | active anchors ' + activeFunctionRows.length;
        var reviewPriority = directCoverageRatio < 0.45 || functionMetrics.confidence_score < 0.50
            ? 'high'
            : (directCoverageRatio < 0.62 || functionMetrics.confidence_score < 0.62 ? 'medium' : 'low');
        var summary = occupation.title + ' currently reads as ' + getRoleTransformationLabel(transformationType) + ' because ' +
            ROLE_TRANSFORMATION_DRIVER_LABELS[topDrivers[0].key] + ' and ' +
            ROLE_TRANSFORMATION_DRIVER_LABELS[topDrivers[1].key] + ' are the strongest live pressure signals, while ' +
            ROLE_TRANSFORMATION_COUNTERWEIGHT_LABELS[topCounterweight.key] + ' is the main counterweight. Function mix: ' +
            (functionSummary || 'no active function anchors') + '. Evidence mix: ' + evidenceProfile + '.';

        return {
            role_transformation_type: transformationType,
            function_anchor_count: activeFunctionRows.length,
            primary_driver: ROLE_TRANSFORMATION_DRIVER_LABELS[topDrivers[0].key],
            secondary_driver: ROLE_TRANSFORMATION_DRIVER_LABELS[topDrivers[1].key],
            primary_counterweight: ROLE_TRANSFORMATION_COUNTERWEIGHT_LABELS[topCounterweight.key],
            evidence_profile: evidenceProfile,
            confidence_band: getConfidenceBandKey(functionMetrics.confidence_score),
            review_priority: reviewPriority,
            explanation_summary: summary
        };
    }

    function classifyFunctionCategorySignals(functionCategory) {
        var category = String(functionCategory || '').toLowerCase();
        return {
            coordination: /coord|orchestration|integration|translation|enablement|flow|delivery|support_enablement|workflow_adoption/.test(category),
            oversight: /governance|assurance|signoff|advisory|quality|stewardship|leadership/.test(category),
            revenue: /revenue|market|commercial|sales|relationship|portfolio|advisory/.test(category),
            internal_overhead: /workflow_execution|admin|record|transaction|public_record|processing|reliable_execution|office|case_window|revenue_cycle/.test(category),
            compliance: /governance|assurance|integrity|policy|public_record|legal|control|risk|audit/.test(category),
            client: /revenue|sales|relationship|market|visitor|public_information|service/.test(category)
        };
    }

    function summarizeFunctionCategorySignals(perFunctionBreakdown) {
        var rows = Array.isArray(perFunctionBreakdown) ? perFunctionBreakdown : [];
        var totals = {
            coordination: 0,
            oversight: 0,
            revenue: 0,
            internal_overhead: 0,
            compliance: 0,
            client: 0
        };
        var authorityWeighted = 0;
        var coordinationWeighted = 0;
        var weightTotal = 0;

        rows.forEach(function (row) {
            var tags = classifyFunctionCategorySignals(row.function_category);
            var baseWeight = clamp(toNumber(row.function_weight, 0), 0, 1);
            var retainedStrength = clamp(toNumber(row.retained_strength, 0.5), 0, 1);
            var supportedShare = clamp(toNumber(row.supported_share, 0), 0, 1);
            var exposedShare = clamp(toNumber(row.exposed_share, 0), 0, 1);
            var effectiveWeight = Math.max(0.001, (baseWeight * 0.65) + (supportedShare * 0.20) + (retainedStrength * 0.15));
            weightTotal += effectiveWeight;

            Object.keys(totals).forEach(function (key) {
                if (tags[key]) {
                    totals[key] += effectiveWeight;
                }
            });

            authorityWeighted += effectiveWeight * clamp(
                (retainedStrength * 0.55) +
                ((1 - clamp(toNumber(row.exposure_pressure, 0.5), 0, 1)) * 0.25) +
                (Math.max(0, retainedStrength - exposedShare) * 0.20),
                0,
                1
            );
            coordinationWeighted += effectiveWeight * clamp(
                (tags.coordination ? 0.55 : 0.10) +
                (supportedShare * 0.25) +
                (retainedStrength * 0.20),
                0,
                1
            );
        });

        if (weightTotal <= 0) {
            return {
                shares: totals,
                decision_authority: 0.5,
                coordination_centrality: 0.5
            };
        }

        Object.keys(totals).forEach(function (key) {
            totals[key] = Number(clamp(totals[key] / weightTotal, 0, 1).toFixed(3));
        });

        return {
            shares: totals,
            decision_authority: Number(clamp(authorityWeighted / weightTotal, 0, 1).toFixed(3)),
            coordination_centrality: Number(clamp(coordinationWeighted / weightTotal, 0, 1).toFixed(3))
        };
    }

    function buildTaskRoleGraphBreakdown(options) {
        var occupationId = options.occupationId;
        var taskInventoryRows = options.taskInventoryRows || [];
        var dependencyEdges = options.dependencyEdges || [];
        var clusterResultsById = options.clusterResultsById || {};
        var taskSourceEvidenceByTaskId = options.taskSourceEvidenceByTaskId || {};
        var taskEvidenceByKey = options.taskEvidenceByKey || {};
        var taskMembershipByKey = options.taskMembershipByKey || {};
        var adaptationPrior = options.adaptationPrior || null;
        var functionSummary = options.functionSummary || null;
        var dominantTaskSet = toLookup(options.dominantTaskIds || []);
        var criticalTaskSet = toLookup(options.criticalTaskIds || []);
        var aiSupportTaskSet = toLookup(options.aiSupportTaskIds || []);
        var supportTaskSet = toLookup(options.supportTaskIds || []);

        if (!taskInventoryRows.length) {
            return null;
        }

        var adoptionRealization = clamp(toNumber(options.adoptionRealization, SCORING_CONFIG.adoptionRealizationBase), 0, 1.0);
        var routineExecutionContext = deriveRoutineExecutionContext(adaptationPrior);
        var administrativeRoutineContext = deriveAdministrativeRoutineContext(adaptationPrior);
        var clericalExecutionContext = deriveClericalExecutionContext(taskInventoryRows, functionSummary);
        var adaptationNotes = adaptationPrior && adaptationPrior.notes ? adaptationPrior.notes : '';
        var knowledgeShare = clamp(
            parseNoteMetric(adaptationNotes, 'knowledge_share') !== null
                ? parseNoteMetric(adaptationNotes, 'knowledge_share')
                : 0.35,
            0,
            1
        );
        var learningIntensity = clamp(toNumber(adaptationPrior && adaptationPrior.learning_intensity_score, 0.5), 0, 1);
        var clusterInventorySummary = summarizeTaskInventoryByCluster(taskInventoryRows);
        var rows = [];
        var rowsById = {};
        var directTaskEvidenceCount = 0;
        var fallbackTaskCount = 0;
        var taskEvidenceAdjustedCount = 0;
        var taskFirstTaskCount = 0;
        var sourceRoleCounts = {
            live_task_evidence: 0,
            reviewed_task_estimate: 0,
            benchmark_task_label: 0,
            cluster_prior_proxy: 0,
            fallback_task_proxy: 0
        };

        taskInventoryRows.forEach(function (task) {
            var clusterId = task.task_family_id;
            var clusterResult = clusterResultsById[clusterId];
            if (!clusterResult) {
                return;
            }

            var clusterInventoryShare = Math.max(toNumber(clusterInventorySummary[clusterId] && clusterInventorySummary[clusterId].inventory_share, 0), 0.0001);
            var taskWithinClusterShare = clamp(toNumber(task.time_share_prior, 0), 0, 1) / clusterInventoryShare;
            var taskShare = clusterResult.share_of_role * taskWithinClusterShare;
            var rowTaskId = task.task_id || taskKey(occupationId, task.onet_task_id);
            var isUserSelectedDominant = !!dominantTaskSet[rowTaskId];
            var isUserSelectedCritical = !!criticalTaskSet[rowTaskId];
            var isUserSelectedAiSupport = !!aiSupportTaskSet[rowTaskId];
            var isUserSelectedSupportTask = !!supportTaskSet[rowTaskId];
            var aiSupportObservability = clamp(
                toNumber(task.ai_support_observability, 0.3) + (isUserSelectedAiSupport ? 0.25 : 0),
                0, 1
            );
            var bargainingPowerWeight = clamp(
                toNumber(task.bargaining_power_weight, 0.5) + (isUserSelectedCritical ? 0.18 : 0),
                0, 1
            );
            var valueCentrality = clamp(
                toNumber(task.value_centrality, 0.5) + (isUserSelectedCritical ? 0.10 : 0),
                0, 1
            );
            var clusterSeedTaskDifficulty = clamp(toNumber(clusterResult.automation_difficulty, 0.5), 0, 1);
            var clusterSeedTaskEase = 1 - clusterSeedTaskDifficulty;
            var clusterSeedDirectPressure = clamp(
                ((1 - clusterSeedTaskDifficulty) * 0.68) +
                (clusterResult.absorption_rate * 0.20) +
                (aiSupportObservability * 0.12),
                0, 1
            );
            var shareMultiplier = 1 +
                (isUserSelectedDominant ? 0.40 : 0) +
                (isUserSelectedCritical ? 0.12 : 0) +
                (isUserSelectedSupportTask ? 0.18 : 0);

            var key = taskKey(occupationId, task.onet_task_id);
            var evidence = String(task.onet_task_id || '').indexOf('manual_') === 0 ? null : (taskEvidenceByKey[key] || null);
            var sourceResolution = resolveTaskEvidence({
                taskSourceEvidenceRows: taskSourceEvidenceByTaskId[rowTaskId] || [],
                liveEvidence: evidence,
                baselineAutomationScore: 1 - clusterSeedTaskDifficulty,
                baselineExposureScore: clusterSeedDirectPressure,
                baselineAugmentationScore: aiSupportObservability
            });
            var membership = taskMembershipByKey[key] || null;
            var hasDirectEvidence = !!sourceResolution.has_direct_evidence;
            var hasLiveTaskEvidence = !!sourceResolution.has_live_task_evidence;
            var taskEvidenceReliability = toNumber(sourceResolution.direct_evidence_reliability, 0);
            var resolvedEvidence = sourceResolution.evidence || null;
            var taskMappingConfidence = membership
                ? toNumber(membership.mapping_confidence, toNumber(task.source_confidence, 0.45))
                : toNumber(task.source_confidence, 0.45);
            var taskEvidenceDifficultySignal = hasDirectEvidence
                ? (1 - computeTaskEvidenceAutomationEase(resolvedEvidence, clusterSeedTaskEase))
                : null;
            var taskFirstTaskWeight = hasDirectEvidence
                ? computeTaskFirstTaskWeight(
                    taskEvidenceReliability,
                    sourceResolution.primary_source_role,
                    taskMappingConfidence
                )
                : 0;
            var baselineTaskDifficulty = taskFirstTaskWeight > 0
                ? clamp(
                    ((1 - taskFirstTaskWeight) * clusterSeedTaskDifficulty) +
                    (taskFirstTaskWeight * (taskEvidenceDifficultySignal === null ? clusterSeedTaskDifficulty : taskEvidenceDifficultySignal)),
                    0.02,
                    0.98
                )
                : clusterSeedTaskDifficulty;
            var baselineTaskEase = 1 - baselineTaskDifficulty;
            var taskAutomationEvidenceWeight = clamp(
                Math.max(0, toNumber(sourceResolution.evidence_blend_weight, 0) - taskFirstTaskWeight),
                0,
                1
            );
            var taskAutomationEaseSignal = hasDirectEvidence
                ? computeTaskEvidenceAutomationEase(resolvedEvidence, baselineTaskEase)
                : null;
            var taskAutomationDifficulty = clamp(
                ((1 - taskAutomationEvidenceWeight) * baselineTaskDifficulty) +
                (taskAutomationEvidenceWeight * (1 - (taskAutomationEaseSignal === null ? baselineTaskEase : taskAutomationEaseSignal))),
                0.02,
                0.98
            );
            var directTaskEvidenceSignal = hasDirectEvidence
                ? computeDirectTaskEvidenceSignal(resolvedEvidence, clusterSeedDirectPressure)
                : null;
            var directTaskEvidenceWeight = toNumber(sourceResolution.evidence_blend_weight, 0);
            var routineReachabilityWeight = toNumber(ROUTINE_REACHABILITY_CLUSTERS[task.task_family_id], 0);
            var routineCoreMultiplier = task.role_criticality === 'core'
                ? (
                    task.task_family_id === 'cluster_workflow_admin' || task.task_family_id === 'cluster_documentation'
                        ? 0.95
                        : 0.72
                )
                : 1.00;
            var routineReachabilityLift = routineReachabilityWeight > 0
                ? routineExecutionContext * routineReachabilityWeight * routineCoreMultiplier
                : 0;
            var administrativeRoutineLift = (
                task.task_family_id === 'cluster_workflow_admin' ||
                task.task_family_id === 'cluster_documentation'
            )
                ? administrativeRoutineContext * (task.role_criticality === 'core' ? 0.16 : 0.08)
                : task.task_family_id === 'cluster_execution_routine'
                    ? administrativeRoutineContext * (task.role_criticality === 'core' ? 0.10 : 0.06)
                    : 0;
            var clericalExecutionLift = (
                task.task_family_id === 'cluster_workflow_admin' ||
                task.task_family_id === 'cluster_documentation'
            )
                ? clericalExecutionContext * (task.role_criticality === 'core' ? 0.14 : 0.07)
                : task.task_family_id === 'cluster_execution_routine'
                    ? clericalExecutionContext * (task.role_criticality === 'core' ? 0.10 : 0.05)
                    : 0;
            var structuralRoutineDamp = routineReachabilityWeight > 0
                ? clamp(
                    routineExecutionContext * routineReachabilityWeight * (task.role_criticality === 'core' ? 0.35 : 0.20),
                    0,
                    0.28
                )
                : 0;
            var administrativeEvidenceDamp = (
                task.task_family_id === 'cluster_workflow_admin' ||
                task.task_family_id === 'cluster_documentation'
            )
                ? clamp(administrativeRoutineContext * (task.role_criticality === 'core' ? 0.12 : 0.06), 0, 0.18)
                : task.task_family_id === 'cluster_execution_routine'
                    ? clamp(administrativeRoutineContext * (task.role_criticality === 'core' ? 0.08 : 0.04), 0, 0.12)
                    : 0;
            var clericalExecutionEvidenceDamp = (
                task.task_family_id === 'cluster_workflow_admin' ||
                task.task_family_id === 'cluster_documentation'
            )
                ? clamp(clericalExecutionContext * (task.role_criticality === 'core' ? 0.09 : 0.05), 0, 0.16)
                : task.task_family_id === 'cluster_execution_routine'
                    ? clamp(clericalExecutionContext * (task.role_criticality === 'core' ? 0.06 : 0.03), 0, 0.10)
                    : 0;
            var knowledgeWorkDamp = (
                task.task_family_id === 'cluster_drafting' ||
                task.task_family_id === 'cluster_documentation' ||
                task.task_family_id === 'cluster_analysis'
            )
                ? clamp(
                    (knowledgeShare * (task.task_family_id === 'cluster_drafting' ? 0.08 : 0.05)) +
                    (learningIntensity * 0.05),
                    0,
                    0.12
                )
                : 0;
            var effectiveDirectTaskEvidenceWeight = clamp(
                directTaskEvidenceWeight * (1 - structuralRoutineDamp - administrativeEvidenceDamp - clericalExecutionEvidenceDamp),
                0,
                1
            );
            var baselineDirectPressure = clamp(
                ((1 - taskAutomationDifficulty) * 0.68) +
                (clusterResult.absorption_rate * 0.20) +
                (aiSupportObservability * 0.12) +
                (routineReachabilityLift * 0.18) +
                administrativeRoutineLift +
                clericalExecutionLift -
                knowledgeWorkDamp,
                0, 1
            );
            var directPressure = clamp(
                ((1 - effectiveDirectTaskEvidenceWeight) * baselineDirectPressure) +
                (effectiveDirectTaskEvidenceWeight * (directTaskEvidenceSignal === null ? baselineDirectPressure : directTaskEvidenceSignal)) -
                (isUserSelectedAiSupport ? 0.14 : 0) +
                (isUserSelectedSupportTask ? 0.03 : 0),
                0, 1
            );
            if (hasDirectEvidence) {
                directTaskEvidenceCount += 1;
            } else {
                fallbackTaskCount += 1;
            }
            if (sourceResolution.primary_source_role && sourceRoleCounts[sourceResolution.primary_source_role] !== undefined) {
                sourceRoleCounts[sourceResolution.primary_source_role] += 1;
            }
            if (taskFirstTaskWeight > 0) {
                taskFirstTaskCount += 1;
            }
            if (effectiveDirectTaskEvidenceWeight > 0) {
                taskEvidenceAdjustedCount += 1;
            }

            var row = {
                task_id: rowTaskId,
                onet_task_id: task.onet_task_id,
                task_statement: task.task_statement,
                task_type: task.task_type || '',
                task_source_bucket: taskSourceBucket(task),
                task_source_label: taskSourceLabel(task),
                task_cluster_id: clusterId,
                task_cluster_label: clusterResult.label,
                share_of_role: Number(taskShare.toFixed(4)),
                selection_multiplier: Number(shareMultiplier.toFixed(3)),
                automation_difficulty: Number(taskAutomationDifficulty.toFixed(3)),
                automation_difficulty_baseline: Number(baselineTaskDifficulty.toFixed(3)),
                automation_difficulty_baseline_source: taskFirstTaskWeight > 0
                    ? 'task_first_resolved_evidence'
                    : (clusterResult.baseline_difficulty_source || 'cluster_priors'),
                automation_difficulty_task_first_weight: Number(taskFirstTaskWeight.toFixed(3)),
                automation_difficulty_evidence_weight: Number(taskAutomationEvidenceWeight.toFixed(3)),
                automation_difficulty_source: taskFirstTaskWeight > 0
                    ? 'task_first_resolved_evidence'
                    : (taskAutomationEvidenceWeight > 0 ? 'resolved_task_evidence' : 'cluster_model'),
                wave_assignment: waveAssignmentForDifficulty(taskAutomationDifficulty),
                structural_wave: waveAssignmentForDifficulty(taskAutomationDifficulty),
                direct_exposure_pressure: Number(directPressure.toFixed(3)),
                direct_pressure_baseline: Number(baselineDirectPressure.toFixed(3)),
                direct_pressure_evidence_signal: directTaskEvidenceSignal === null ? null : Number(directTaskEvidenceSignal.toFixed(3)),
                direct_pressure_evidence_weight: Number(effectiveDirectTaskEvidenceWeight.toFixed(3)),
                direct_pressure_source: effectiveDirectTaskEvidenceWeight > 0 ? 'resolved_task_evidence' : 'cluster_model',
                indirect_dependency_pressure: 0,
                value_centrality: valueCentrality,
                bargaining_power_weight: bargainingPowerWeight,
                role_criticality: isUserSelectedCritical ? 'core' : (task.role_criticality || 'supporting'),
                ai_support_observability: aiSupportObservability,
                evidence_confidence: Number(average([
                    clusterResult.evidence_confidence,
                    toNumber(task.source_confidence, 0.45),
                    evidence ? toNumber(evidence.confidence, 0.55) : null,
                    resolvedEvidence ? average([
                        toNumber(resolvedEvidence.automation_score, null),
                        toNumber(resolvedEvidence.exposure_score, null),
                        toNumber(resolvedEvidence.augmentation_score, null)
                    ]) : null,
                    membership ? toNumber(membership.mapping_confidence, 0.45) : null
                ]).toFixed(3)),
                direct_evidence_reliability: Number(taskEvidenceReliability.toFixed(3)),
                mapping_method: membership ? membership.mapping_method : (String(task.onet_task_id || '').indexOf('manual_') === 0 ? 'manual_role_graph_review' : 'role_graph_inventory'),
                mapping_confidence: Number((membership ? toNumber(membership.mapping_confidence, 0.45) : toNumber(task.source_confidence, 0.45)).toFixed(3)),
                evidence_type: sourceResolution.primary_source_role || (evidence ? evidence.evidence_type : 'role_graph_inventory'),
                evidence_source: sourceResolution.primary_source_id || (evidence ? evidence.source_id : null),
                observed_usage_share: Number((evidence ? toNumber(evidence.observed_usage_share, 0) : 0).toFixed(4)),
                has_direct_evidence: hasDirectEvidence,
                has_live_task_evidence: hasLiveTaskEvidence,
                resolved_evidence_source_role: sourceResolution.primary_source_role,
                resolved_evidence_promotion_status: sourceResolution.primary_promotion_status,
                resolved_evidence_source_count: sourceResolution.source_count,
                resolved_evidence_task_source_count: sourceResolution.task_level_source_count,
                resolved_evidence_supporting_source_ids: sourceResolution.supporting_source_ids,
                resolved_evidence_supporting_roles: sourceResolution.task_level_source_roles,
                is_role_critical: isUserSelectedCritical || task.role_criticality === 'core',
                is_user_selected_dominant: isUserSelectedDominant,
                is_user_selected_critical: isUserSelectedCritical,
                is_user_selected_ai_support: isUserSelectedAiSupport,
                is_user_selected_support_task: isUserSelectedSupportTask,
                friction_dimensions: clusterResult.friction_dimensions,
                elevation_boost: 0,
                exposed_share: 0,
                retained_share: 0,
                retained_leverage: 0,
                likely_mode: 'mixed'
            };
            rows.push(row);
            rowsById[row.task_id] = row;
        });

        var boostedTotalShare = sum(rows.map(function (row) {
            return row.share_of_role * row.selection_multiplier;
        }));
        if (boostedTotalShare > 0) {
            rows.forEach(function (row) {
                row.share_of_role = Number(((row.share_of_role * row.selection_multiplier) / boostedTotalShare).toFixed(4));
            });
        }

        var bindings = [];
        var rawDependencyPenalty = 0;
        dependencyEdges.forEach(function (edge) {
            var source = rowsById[edge.from_task_id];
            var target = rowsById[edge.to_task_id];
            if (!source || !target) {
                return;
            }

            var dependencyStrength = clamp(toNumber(edge.dependency_strength, 0), 0, 1);
            var spillover = dependencyStrength * target.direct_exposure_pressure * Math.max(target.value_centrality, target.bargaining_power_weight);
            if (source.is_user_selected_support_task) {
                spillover += dependencyStrength * 0.08;
            }
            source.indirect_dependency_pressure = clamp(source.indirect_dependency_pressure + spillover, 0, 1);

            var pairPenalty = dependencyStrength * source.share_of_role * target.direct_exposure_pressure * Math.max(target.value_centrality, target.bargaining_power_weight);
            if (source.is_user_selected_support_task) {
                pairPenalty *= 1.15;
            }
            rawDependencyPenalty += pairPenalty;
            bindings.push({
                source_cluster_id: source.task_cluster_id,
                source_label: source.task_statement,
                target_cluster_id: target.task_cluster_id,
                target_label: target.task_statement,
                penalty: Number(pairPenalty.toFixed(4))
            });
        });

        rows.forEach(function (row) {
            var clusterResult = clusterResultsById[row.task_cluster_id];
            if (row.is_user_selected_support_task) {
                row.indirect_dependency_pressure = clamp(row.indirect_dependency_pressure + 0.12, 0, 1);
            }
            var elevationBoostShare = clusterResult && clusterResult.share_of_role > 0
                ? ((clusterResult.elevation_boost || 0) * (row.share_of_role / clusterResult.share_of_role))
                : 0;
            var absorbedRate = clamp(
                adoptionRealization *
                (1 - row.automation_difficulty * 0.30) *
                (0.92 + (row.ai_support_observability * 0.10) - ((row.role_criticality === 'core' ? 1 : 0) * 0.06)) *
                (1 - (toNumber(options.dependencyBottleneckStrength, 0.5) * 0.10)) *
                (1 - (toNumber(options.humanSignoffRequirement, 0.5) * 0.08)) *
                (0.55 + (row.direct_exposure_pressure * 0.45)) +
                (row.indirect_dependency_pressure * 0.20) -
                (row.is_user_selected_ai_support ? 0.06 : 0),
                0, 0.98
            );
            var taskAbsorbedShare = row.share_of_role * absorbedRate;
            var taskRetainedShare = Math.max(0, row.share_of_role - taskAbsorbedShare);
            var transformedTaskShare = Math.max(0, taskRetainedShare + elevationBoostShare);
            var retainedLeverage = clamp(
                (row.bargaining_power_weight * (1 - row.direct_exposure_pressure) * (1 - row.indirect_dependency_pressure)) +
                (row.is_role_critical ? 0.10 : 0) +
                (row.is_user_selected_critical ? 0.08 : 0) +
                (row.is_user_selected_ai_support ? 0.08 : 0) +
                (elevationBoostShare * 0.60),
                0, 1
            );

            row.elevation_boost = Number(elevationBoostShare.toFixed(4));
            row.exposed_share = Number(taskAbsorbedShare.toFixed(4));
            row.retained_share = Number(transformedTaskShare.toFixed(4));
            row.retained_leverage = Number(retainedLeverage.toFixed(3));
            row.exposure_score = Number(clamp((row.direct_exposure_pressure * 0.75) + (row.indirect_dependency_pressure * 0.25), 0, 1).toFixed(3));
            row.exposure_level = toTier(row.exposure_score, [0.40, 0.68], ['low', 'moderate', 'high']);
            row.likely_mode = row.is_user_selected_ai_support
                ? 'augmentation'
                : row.direct_exposure_pressure >= 0.68 && row.bargaining_power_weight < 0.55
                ? 'automation'
                : (row.ai_support_observability >= 0.45 || row.bargaining_power_weight >= 0.65 ? 'augmentation' : 'mixed');
            row.indirect_dependency_pressure = Number(row.indirect_dependency_pressure.toFixed(3));
        });

        rows.sort(function (left, right) {
            if (right.exposed_share !== left.exposed_share) {
                return right.exposed_share - left.exposed_share;
            }
            if (right.indirect_dependency_pressure !== left.indirect_dependency_pressure) {
                return right.indirect_dependency_pressure - left.indirect_dependency_pressure;
            }
            return right.share_of_role - left.share_of_role;
        });
        bindings.sort(function (left, right) {
            return right.penalty - left.penalty;
        });

        var directCoverageRatio = rows.length ? (directTaskEvidenceCount / rows.length) : 0.35;
        var directExposurePressure = weightedAverage(rows, 'direct_exposure_pressure', 'share_of_role');
        var indirectDependencyPressure = weightedAverage(rows, 'indirect_dependency_pressure', 'share_of_role');
        var retainedLeverageScore = weightedAverage(rows, 'retained_leverage', 'share_of_role');
        var exposedCoreShare = sum(rows.filter(function (row) {
            return row.role_criticality === 'core';
        }).map(function (row) {
            return row.share_of_role * Math.max(row.direct_exposure_pressure, row.indirect_dependency_pressure);
        }));
        var retainedCoreShare = sum(rows.filter(function (row) {
            return row.role_criticality === 'core';
        }).map(function (row) {
            return row.retained_share;
        }));
        var dependencyPenalty = clamp(rawDependencyPenalty * SCORING_CONFIG.dependencyPenaltyScale, 0, 0.5);
        var residualRoleIntegrity = clamp(
            (retainedLeverageScore * 0.40) +
            (Math.min(1, retainedCoreShare) * 0.35) +
            ((1 - indirectDependencyPressure) * 0.15) +
            ((1 - dependencyPenalty) * 0.10),
            0, 1
        );

        var exposedClusterScores = {};
        rows.forEach(function (row) {
            if (!exposedClusterScores[row.task_cluster_id]) {
                exposedClusterScores[row.task_cluster_id] = 0;
            }
            exposedClusterScores[row.task_cluster_id] += row.share_of_role * row.exposure_score * (row.is_role_critical ? 1.25 : 1);
        });

        var topExposedClusterId = null;
        var topExposedClusterScore = -1;
        Object.keys(exposedClusterScores).forEach(function (clusterId) {
            if (exposedClusterScores[clusterId] > topExposedClusterScore) {
                topExposedClusterScore = exposedClusterScores[clusterId];
                topExposedClusterId = clusterId;
            }
        });

        var clusterBuckets = {};
        rows.forEach(function (row) {
            var clusterId = row.task_cluster_id;
            var baseCluster = clusterResultsById[clusterId] || {};
            if (!clusterBuckets[clusterId]) {
                clusterBuckets[clusterId] = {
                    task_cluster_id: clusterId,
                    label: row.task_cluster_label || baseCluster.label || slugToLabel(clusterId),
                    share_of_role: 0,
                    direct_numerator: 0,
                    indirect_numerator: 0,
                    retained_numerator: 0,
                    evidence_numerator: 0,
                    difficulty_numerator: 0,
                    exposure_numerator: 0,
                    absorption_numerator: 0,
                    exposed_share: 0,
                    retained_share: 0,
                    elevation_boost: 0,
                    direct_evidence_task_count: 0,
                    task_first_task_count: 0,
                    task_evidence_adjusted_tasks: 0,
                    is_role_critical: !!baseCluster.is_role_critical,
                    primary_sources: baseCluster.primary_sources || [],
                    prior_reliability: toNumber(baseCluster.prior_reliability, 0),
                    baseline_difficulty_source: baseCluster.baseline_difficulty_source || 'cluster_priors',
                    task_first_weight: toNumber(baseCluster.task_first_weight, 0),
                    task_evidence_coverage_ratio: toNumber(baseCluster.task_evidence_coverage_ratio, 0),
                    task_evidence_mean_reliability: toNumber(baseCluster.task_evidence_mean_reliability, 0),
                    resolved_task_evidence_count: toNumber(baseCluster.resolved_task_evidence_count, 0),
                    friction_dimensions: baseCluster.friction_dimensions || null,
                    intrinsic_friction: toNumber(baseCluster.intrinsic_friction, 0),
                    empirical_resistance: toNumber(baseCluster.empirical_resistance, 0),
                    graph_core_share: toNumber(baseCluster.graph_core_share, 0),
                    graph_bargaining_weight: toNumber(baseCluster.graph_bargaining_weight, 0),
                    graph_ai_support: toNumber(baseCluster.graph_ai_support, 0),
                    source_mix: []
                };
            }

            var bucket = clusterBuckets[clusterId];
            var share = clamp(toNumber(row.share_of_role, 0), 0, 1.25);
            bucket.share_of_role += share;
            bucket.direct_numerator += share * clamp(toNumber(row.direct_exposure_pressure, 0), 0, 1);
            bucket.indirect_numerator += share * clamp(toNumber(row.indirect_dependency_pressure, 0), 0, 1);
            bucket.retained_numerator += share * clamp(toNumber(row.retained_leverage, 0), 0, 1);
            bucket.evidence_numerator += share * clamp(toNumber(row.evidence_confidence, 0), 0, 1);
            bucket.difficulty_numerator += share * clamp(toNumber(row.automation_difficulty, 0), 0, 1);
            bucket.exposure_numerator += share * clamp(toNumber(row.exposure_score, 0), 0, 1);
            bucket.absorption_numerator += clamp(toNumber(row.exposed_share, 0), 0, 1.25);
            bucket.exposed_share += clamp(toNumber(row.exposed_share, 0), 0, 1.25);
            bucket.retained_share += clamp(toNumber(row.retained_share, 0), 0, 1.25);
            bucket.elevation_boost += clamp(toNumber(row.elevation_boost, 0), 0, 1.25);
            if (row.has_direct_evidence) {
                bucket.direct_evidence_task_count += 1;
            }
            if (toNumber(row.automation_difficulty_task_first_weight, 0) > 0) {
                bucket.task_first_task_count += 1;
            }
            if (toNumber(row.direct_pressure_evidence_weight, 0) > 0) {
                bucket.task_evidence_adjusted_tasks += 1;
            }
            if (row.is_role_critical || row.role_criticality === 'core') {
                bucket.is_role_critical = true;
            }
            if (row.evidence_source && bucket.source_mix.indexOf(row.evidence_source) === -1) {
                bucket.source_mix.push(row.evidence_source);
            }
        });

        var clusterSummaryById = {};
        var clusterSummaryRows = Object.keys(clusterBuckets).map(function (clusterId) {
            var bucket = clusterBuckets[clusterId];
            var share = Math.max(bucket.share_of_role, 0.0001);
            var automationDifficulty = clamp(bucket.difficulty_numerator / share, 0, 1);
            var absorptionRate = clamp(bucket.absorption_numerator / share, 0, 0.98);
            var waveAssignment = waveAssignmentForDifficulty(automationDifficulty);

            var summary = {
                task_cluster_id: clusterId,
                label: bucket.label,
                share_of_role: Number(bucket.share_of_role.toFixed(3)),
                automation_difficulty: Number(automationDifficulty.toFixed(3)),
                automation_difficulty_source: bucket.task_first_task_count > 0
                    ? 'task_aggregated_task_first_resolved_evidence'
                    : (bucket.task_evidence_adjusted_tasks > 0 ? 'task_aggregated_resolved_task_evidence' : 'task_aggregated_cluster_model'),
                baseline_difficulty_source: bucket.baseline_difficulty_source,
                task_first_weight: Number(clamp(bucket.task_first_weight, 0, 1).toFixed(3)),
                task_evidence_coverage_ratio: Number(clamp(bucket.task_evidence_coverage_ratio, 0, 1).toFixed(3)),
                task_evidence_mean_reliability: Number(clamp(bucket.task_evidence_mean_reliability, 0, 1).toFixed(3)),
                resolved_task_evidence_count: Math.round(toNumber(bucket.resolved_task_evidence_count, 0)),
                wave_assignment: waveAssignment,
                wave_assignment_source: 'task_aggregated',
                absorption_rate: Number(absorptionRate.toFixed(3)),
                direct_exposure_pressure: Number(clamp(bucket.direct_numerator / share, 0, 1).toFixed(3)),
                indirect_dependency_pressure: Number(clamp(bucket.indirect_numerator / share, 0, 1).toFixed(3)),
                retained_leverage: Number(clamp(bucket.retained_numerator / share, 0, 1).toFixed(3)),
                evidence_confidence: Number(clamp(bucket.evidence_numerator / share, 0, 1).toFixed(3)),
                exposure_score: Number(clamp(bucket.exposure_numerator / share, 0, 1).toFixed(3)),
                exposure_level: toTier(clamp(bucket.exposure_numerator / share, 0, 1), [0.40, 0.68], ['low', 'moderate', 'high']),
                exposed_share: Number(clamp(bucket.exposed_share, 0, 1.25).toFixed(3)),
                retained_share: Number(clamp(bucket.retained_share, 0, 1.25).toFixed(3)),
                residual_relevance: Number(clamp(bucket.retained_share, 0, 1.25).toFixed(3)),
                elevation_boost: Number(clamp(bucket.elevation_boost, 0, 1.25).toFixed(3)),
                absorbed_share: Number(clamp(bucket.exposed_share, 0, 1.25).toFixed(3)),
                is_role_critical: bucket.is_role_critical,
                direct_evidence_task_count: bucket.direct_evidence_task_count,
                task_first_task_count: bucket.task_first_task_count,
                task_evidence_adjusted_tasks: bucket.task_evidence_adjusted_tasks,
                primary_sources: bucket.primary_sources,
                source_mix: bucket.source_mix,
                prior_reliability: Number(clamp(bucket.prior_reliability, 0, 1).toFixed(3)),
                friction_dimensions: bucket.friction_dimensions,
                intrinsic_friction: Number(clamp(bucket.intrinsic_friction, 0, 1).toFixed(3)),
                empirical_resistance: Number(clamp(bucket.empirical_resistance, 0, 1).toFixed(3)),
                graph_core_share: Number(clamp(bucket.graph_core_share, 0, 1).toFixed(3)),
                graph_bargaining_weight: Number(clamp(bucket.graph_bargaining_weight, 0, 1).toFixed(3)),
                graph_ai_support: Number(clamp(bucket.graph_ai_support, 0, 1).toFixed(3)),
                summary_source: 'task_aggregated'
            };
            clusterSummaryById[clusterId] = summary;
            return summary;
        });

        var taskDerivedCurrentBundle = clusterSummaryRows.slice().sort(function (left, right) {
            return right.share_of_role - left.share_of_role;
        });
        var taskDerivedExposedClusters = clusterSummaryRows.filter(function (cluster) {
            return cluster.wave_assignment === 'current' || cluster.wave_assignment === 'next';
        }).sort(function (left, right) {
            if (right.exposed_share !== left.exposed_share) {
                return right.exposed_share - left.exposed_share;
            }
            return right.direct_exposure_pressure - left.direct_exposure_pressure;
        });
        var taskDerivedRetainedClusters = clusterSummaryRows.filter(function (cluster) {
            return cluster.retained_share >= 0.055;
        }).sort(function (left, right) {
            return right.retained_share - left.retained_share;
        });
        var taskDerivedElevatedClusters = clusterSummaryRows.filter(function (cluster) {
            return cluster.elevation_boost >= 0.015;
        }).sort(function (left, right) {
            return right.elevation_boost - left.elevation_boost;
        });

        return {
            total_tasks_considered: rows.length,
            direct_evidence_tasks: directTaskEvidenceCount,
            cluster_fallback_tasks: fallbackTaskCount,
            direct_coverage_ratio: Number(directCoverageRatio.toFixed(3)),
            dependency_penalty: Number(dependencyPenalty.toFixed(3)),
            binding_dependencies: bindings.slice(0, 3),
            resolved_source_role_counts: sourceRoleCounts,
            direct_exposure_pressure: Number(directExposurePressure.toFixed(3)),
            indirect_dependency_pressure: Number(indirectDependencyPressure.toFixed(3)),
            retained_leverage_score: Number(retainedLeverageScore.toFixed(3)),
            residual_role_integrity: Number(residualRoleIntegrity.toFixed(3)),
            exposed_core_share: Number(clamp(exposedCoreShare, 0, 1).toFixed(3)),
            retained_core_share: Number(clamp(retainedCoreShare, 0, 1.25).toFixed(3)),
            task_first_task_count: taskFirstTaskCount,
            task_evidence_adjusted_tasks: taskEvidenceAdjustedCount,
            user_selected_task_count: uniqueStrings(
                (options.dominantTaskIds || [])
                    .concat(options.criticalTaskIds || [])
                    .concat(options.aiSupportTaskIds || [])
                    .concat(options.supportTaskIds || [])
            ).length,
            top_exposed_cluster_id: topExposedClusterId,
            cluster_summaries: {
                by_id: clusterSummaryById,
                current_bundle: taskDerivedCurrentBundle,
                exposed_clusters: taskDerivedExposedClusters,
                retained_clusters: taskDerivedRetainedClusters,
                elevated_clusters: taskDerivedElevatedClusters
            },
            tasks: rows
        };
    }

    function buildTaskOverrides(options) {
        var overrides = {};
        var explicit = options.taskFamilyWeights || {};

        Object.keys(explicit).forEach(function (clusterId) {
            overrides[clusterId] = toNumber(explicit[clusterId], 0);
        });

        (options.dominantTaskClusters || []).forEach(function (clusterId) {
            overrides[clusterId] = (overrides[clusterId] || 0) + 0.16;
        });

        (options.roleCriticalClusters || []).forEach(function (clusterId) {
            overrides[clusterId] = (overrides[clusterId] || 0) + 0.10;
        });

        return overrides;
    }

    function deriveQuestionnaireSignals(answers, options) {
        answers = answers || {};
        var seniority = clamp((toNumber(options.seniorityLevel, 3) - 1) / 4, 0, 1);
        var hasNativeProfile = hasProvidedQuestionnaireProfile(options.questionnaireProfile);
        var hasLegacyAnswers = Object.keys(answers).length > 0;
        var fallbackProfile = hasLegacyAnswers
            ? buildQuestionnaireProfileFromAnswers(answers || {}, options || {})
            : getDefaultQuestionnaireProfile();
        var questionnaireProfile = normalizeQuestionnaireProfile(options.questionnaireProfile, fallbackProfile);
        var profileSource = hasNativeProfile ? 'native_profile' : (hasLegacyAnswers ? 'legacy_answers' : 'default_profile');

        var q1 = normalizeAnswer(answers.Q1);
        var q2 = normalizeAnswer(answers.Q2);
        var q3 = normalizeAnswer(answers.Q3);
        var q4 = normalizeAnswer(answers.Q4);
        var q5 = normalizeAnswer(answers.Q5);
        var q6 = normalizeAnswer(answers.Q6);
        var q7 = normalizeAnswer(answers.Q7);
        var q8 = normalizeAnswer(answers.Q8);
        var q9 = normalizeAnswer(answers.Q9);
        var q11 = normalizeAnswer(answers.Q11);
        var q12 = normalizeAnswer(answers.Q12);
        var q13 = normalizeAnswer(answers.Q13);
        var q14 = normalizeAnswer(answers.Q14);
        var q16 = normalizeAnswer(answers.Q16);

        var functionRetention = average([
            questionnaireProfile.function_centrality,
            questionnaireProfile.human_signoff_requirement,
            questionnaireProfile.liability_and_regulatory_burden,
            questionnaireProfile.relationship_ownership
        ]);
        var capabilitySignal = average([
            questionnaireProfile.ai_observability_of_work,
            questionnaireProfile.workflow_decomposability,
            questionnaireProfile.substitution_risk_modifier
        ]);
        var couplingProtection = average([
            functionRetention,
            questionnaireProfile.exception_and_context_load,
            questionnaireProfile.dependency_bottleneck_strength,
            questionnaireProfile.external_trust_requirement
        ]);
        var adoptionPressure = profileSource === 'default_profile'
            ? 0.3
            : questionnaireProfile.organizational_adoption_readiness;
        var frictionDimensions = {
            exception_burden: questionnaireProfile.exception_and_context_load,
            accountability_load: average([
                questionnaireProfile.human_signoff_requirement,
                questionnaireProfile.liability_and_regulatory_burden,
                questionnaireProfile.function_centrality
            ]),
            judgment_requirement: average([
                questionnaireProfile.function_centrality,
                1 - questionnaireProfile.execution_vs_judgment_mix,
                questionnaireProfile.relationship_ownership
            ]),
            document_intensity: average([
                questionnaireProfile.ai_observability_of_work,
                questionnaireProfile.workflow_decomposability
            ]),
            tacit_context_dependence: average([
                questionnaireProfile.exception_and_context_load,
                questionnaireProfile.dependency_bottleneck_strength,
                questionnaireProfile.external_trust_requirement
            ])
        };

        return {
            seniority: seniority,
            capabilitySignal: capabilitySignal,
            couplingProtection: couplingProtection,
            adoptionPressure: adoptionPressure,
            functionRetention: functionRetention,
            augmentationFit: questionnaireProfile.augmentation_fit,
            substitutionRiskModifier: questionnaireProfile.substitution_risk_modifier,
            questionnaireProfile: questionnaireProfile,
            questionnaireProfileSource: profileSource,
            frictionDimensions: frictionDimensions,
            answers: {
                q1: q1, q2: q2, q3: q3, q4: q4, q5: q5, q6: q6, q7: q7, q8: q8, q9: q9,
                q11: q11, q12: q12, q13: q13, q14: q14, q16: q16
            }
        };
    }

    function toTier(value, thresholds, labels) {
        if (value >= thresholds[1]) {
            return labels[2];
        }
        if (value >= thresholds[0]) {
            return labels[1];
        }
        return labels[0];
    }

    function buildNarrative(result) {
        var stateTrajectory = result.state_trajectory || {};
        var nextCheckpoint = stateTrajectory.checkpoints && stateTrajectory.checkpoints.next ? stateTrajectory.checkpoints.next : null;
        var timingFrontier = result.timing_frontier || {};
        var decisiveTriggerId = result.transition_trigger_map && result.transition_trigger_map.decisive_trigger_id
            ? result.transition_trigger_map.decisive_trigger_id
            : null;
        var decisiveTrigger = decisiveTriggerId && timingFrontier.triggers
            ? timingFrontier.triggers[decisiveTriggerId]
            : null;
        var fateReadout = result.role_fate_readout || { organizational_fate: '', drivers: [], counterweights: [] };
        var seatMapN = result.seat_change_map || {};
        var shrinkBundles = (seatMapN.shrinking_bundles || []).slice(0, 2)
            .map(function(b) { return b.public_label || b.task_cluster_label || ''; })
            .filter(Boolean);
        var retainBundles = (seatMapN.retained_bundles || []).slice(0, 1)
            .map(function(b) { return b.public_label || b.task_cluster_label || ''; })
            .filter(Boolean);
        var topRetainLabel = retainBundles[0] || null;
        var criticalCluster = result.role_defining_work && result.role_defining_work.label
            ? result.role_defining_work.label.toLowerCase()
            : null;
        var shrinkShare = Math.round((seatMapN.shrinking_share_estimate || 0) * 100);

        // ── whyThisRoleChanges (verdict lede) ──────────────────────────────
        var whyThisRoleChanges;
        if (shrinkBundles.length >= 2) {
            whyThisRoleChanges = shrinkBundles[0] + ' and ' + shrinkBundles[1] + ' are where most of the automation pressure lands.';
        } else if (shrinkBundles.length === 1) {
            whyThisRoleChanges = shrinkBundles[0] + ' is where most of the automation pressure lands.';
        } else {
            whyThisRoleChanges = 'Automation pressure is building across this role without a single dominant target yet.';
        }
        var rdwRetainedShare = result.role_defining_work ? (result.role_defining_work.retained_share || 0) : 0;
        if (criticalCluster) {
            var mayDecompose = rdwRetainedShare < 0.18 && rdwRetainedShare > 0;
            whyThisRoleChanges += ' ' + criticalCluster.charAt(0).toUpperCase() + criticalCluster.slice(1) + ' is your strongest bargaining leverage right now';
            whyThisRoleChanges += mayDecompose
                ? ', but that may shift as AI capabilities improve.'
                : ' — that\'s what keeps this role yours.';
        } else if (topRetainLabel) {
            whyThisRoleChanges += ' ' + topRetainLabel + ' is where your hold on this role stays strongest.';
        }
        if (decisiveTrigger && decisiveTrigger.crossing_wave === 'current') {
            whyThisRoleChanges += decisiveTriggerId === 'assist'
                ? ' The pressure is already visible today, but it is still mostly assistive rather than seat-breaking.'
                : ' This pressure is active today, not hypothetical.';
        } else if (decisiveTrigger && decisiveTrigger.crossing_wave === 'next') {
            whyThisRoleChanges += ' The main structural shift arrives in the next scenario window, not just the distant tail.';
        }

        // ── whatIsUnderPressure ("Where AI hits first") ────────────────────
        var whatIsUnderPressure;
        if (shrinkBundles.length >= 2) {
            whatIsUnderPressure = shrinkBundles[0] + ' and ' + shrinkBundles[1] + ' are the easiest for AI to standardize and automate.';
            if (shrinkShare > 0) {
                whatIsUnderPressure += ' Together they make up about ' + shrinkShare + '% of this role today.';
            }
        } else if (shrinkBundles.length === 1) {
            whatIsUnderPressure = shrinkBundles[0] + ' is the clearest target for automation in this role.';
            if (shrinkShare > 0) {
                whatIsUnderPressure += ' It makes up about ' + shrinkShare + '% of this role today.';
            }
        } else {
            whatIsUnderPressure = 'No single part of your role is under concentrated pressure yet — exposure is more diffuse than targeted.';
        }
        if (nextCheckpoint) {
            var nextRetained = Math.round(checkpointRetainedShare(nextCheckpoint) * 100);
            whatIsUnderPressure += ' By the next checkpoint, about ' + nextRetained + '% of this role is expected to remain.';
        }

        // ── whatStaysCore ("What that means for you") ──────────────────────
        var whatStaysCore;
        if (topRetainLabel && shrinkBundles.length) {
            whatStaysCore = 'Your work shifts away from ' + shrinkBundles[0].toLowerCase() + ' and toward ' + topRetainLabel.toLowerCase() + '.';
            var anchor = criticalCluster && criticalCluster !== topRetainLabel.toLowerCase() ? criticalCluster : topRetainLabel.toLowerCase();
            whatStaysCore += ' ' + anchor.charAt(0).toUpperCase() + anchor.slice(1) + ' anchors the retained version of this role — it carries judgment or accountability that AI can\'t easily take.';
        } else if (topRetainLabel) {
            whatStaysCore = topRetainLabel + ' is what anchors the retained version of this role.';
            if (nextCheckpoint) {
                whatStaysCore += checkpointCoherenceTier(nextCheckpoint) === 'coherent'
                    ? ' By the next checkpoint, this bundle still holds together well.'
                    : ' How much holds together depends on whether enough judgment-heavy work stays bundled.';
            }
        } else {
            whatStaysCore = 'How much of this role holds together depends on whether enough judgment-heavy work stays bundled through the transition.';
        }

        var howTheWorkRebundles = result.task_accession_map && result.task_accession_map.net_role_rebundle_summary
            ? result.task_accession_map.net_role_rebundle_summary
            : 'As the exposed work gets cheaper to automate, the human-owned bundles start to carry more of the seat.';
        var whenTheRoleTurns = result.transition_trigger_map && result.transition_trigger_map.summary
            ? result.transition_trigger_map.summary
            : 'The key question is whether AI stays in an assistive role here or crosses into replacing headcount.';
        var howTheSeatRebalances = result.seat_change_map && result.seat_change_map.summary
            ? result.seat_change_map.summary
            : 'The seat is shifting — less execution volume, more judgment. How much depends on how fast the exposed layer thins.';

        var personalizationFitSummary;
        if (result.personalization_fit === 'strong') {
            personalizationFitSummary = 'Based on how you described your work, you\'re in the part of this role that survives the transition — you own the accountability and judgment that AI can\'t easily take.';
        } else if (result.personalization_fit === 'moderate') {
            personalizationFitSummary = 'Some of your day-to-day sits in the protected part of this role, but some of it is in the exposed layer. You\'re straddling both sides.';
        } else {
            personalizationFitSummary = 'Based on how you described your work, more of your day-to-day is in the part of this role that\'s under the most pressure right now.';
        }

        return {
            why_this_role_changes: whyThisRoleChanges,
            what_is_under_pressure: whatIsUnderPressure,
            what_stays_core: whatStaysCore,
            how_the_work_rebundles: howTheWorkRebundles,
            when_the_role_turns: whenTheRoleTurns,
            how_the_seat_rebalances: howTheSeatRebalances,
            personalization_fit_summary: personalizationFitSummary
        };
    }

    function classifyAccessionKind(clusterId) {
        return ACCESSION_KIND_BY_CLUSTER[clusterId] || 'integration';
    }

    function normalizeBundleToken(part) {
        var token = String(part || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!token) return '';
        if (token.length > 5 && /ies$/.test(token)) {
            token = token.slice(0, -3) + 'y';
        } else if (token.length > 4 && /ses$/.test(token) && !/sses$/.test(token)) {
            token = token.slice(0, -2);
        } else if (token.length > 4 && /s$/.test(token) && !/(ss|us|is)$/.test(token)) {
            token = token.slice(0, -1);
        }
        return token;
    }

    function tokenizeBundleText(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .map(function (part) { return normalizeBundleToken(part.trim()); })
            .filter(function (part) {
                return part &&
                    part.length >= 4 &&
                    !BUNDLE_LABEL_STOPWORDS[part];
            });
    }

    function buildBundlePhrases(text) {
        var tokens = tokenizeBundleText(text);
        var phrases = [];
        for (var index = 0; index < tokens.length - 1; index += 1) {
            if (tokens[index] !== tokens[index + 1]) {
                phrases.push(tokens[index] + ' ' + tokens[index + 1]);
            }
        }
        return phrases;
    }

    function toTitleCaseWords(text) {
        return String(text || '')
            .split(/\s+/)
            .map(function (part) {
                return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
            })
            .join(' ');
    }

    function buildBundleThemeTerms(topPhrase, topTerms) {
        var phraseParts = String(topPhrase || '')
            .split(/\s+/)
            .map(function (part) { return normalizeBundleToken(part); })
            .filter(Boolean);
        var merged = [];
        phraseParts.concat(Array.isArray(topTerms) ? topTerms : []).forEach(function (term) {
            var normalized = normalizeBundleToken(term);
            if (!normalized || BUNDLE_LABEL_STOPWORDS[normalized] || merged.indexOf(normalized) !== -1) {
                return;
            }
            merged.push(normalized);
        });
        return merged;
    }

    function bundleTermsContain(terms, candidates) {
        return candidates.some(function (candidate) {
            return terms.indexOf(candidate) !== -1;
        });
    }

    function buildReadableBundleTheme(topPhrase, topTerms) {
        var cleanedTheme = cleanBundleTheme(topPhrase, topTerms);
        if (cleanedTheme) {
            return toTitleCaseWords(cleanedTheme);
        }
        if (topTerms && topTerms.length) {
            return toTitleCaseWords(topTerms[0]);
        }
        return '';
    }

    function cleanBundleTheme(topPhrase, topTerms) {
        var parts = String(topPhrase || '')
            .split(/\s+/)
            .map(function (part) { return normalizeBundleToken(part); })
            .filter(Boolean);

        while (parts.length > 1 && BUNDLE_THEME_LEADING_WORDS[parts[0]]) {
            parts.shift();
        }

        var deduped = [];
        parts.forEach(function (part) {
            if (deduped.indexOf(part) === -1) {
                deduped.push(part);
            }
        });

        if (deduped.length < 2 && Array.isArray(topTerms)) {
            topTerms.forEach(function (term) {
                if (deduped.length >= 2) return;
                if (!term || BUNDLE_THEME_LEADING_WORDS[term] || deduped.indexOf(term) !== -1) return;
                deduped.push(term);
            });
        }

        return deduped.slice(0, 2).join(' ');
    }

    function buildPublicBundleLabel(clusterId, topPhrase, topTerms, topTasks, topFunctionSummaries) {
        var theme = '';
        if (topPhrase) {
            theme = toTitleCaseWords(cleanBundleTheme(topPhrase, topTerms));
        } else if (topTerms && topTerms.length >= 2) {
            theme = toTitleCaseWords(topTerms[0] + ' ' + topTerms[1]);
        } else if (topTerms && topTerms.length === 1) {
            theme = toTitleCaseWords(topTerms[0]);
        }

        if (!theme) {
            return slugToLabel(clusterId);
        }

        var overrideKey = clusterId + ':' + String(theme || '').toLowerCase();
        if (BUNDLE_LABEL_OVERRIDES[overrideKey]) {
            return BUNDLE_LABEL_OVERRIDES[overrideKey];
        }
        if (String(theme || '').toLowerCase() === 'sale stakeholder') {
            return 'Sales stakeholder handling';
        }

        var bundleTerms = buildBundleThemeTerms(topPhrase, topTerms);
        var supportText = ((Array.isArray(topTasks) ? topTasks : []).concat(Array.isArray(topFunctionSummaries) ? topFunctionSummaries : []).join(' ') || '').toLowerCase();
        var readableTheme = buildReadableBundleTheme(topPhrase, topTerms);
        var editorialTheme = bundleTermsContain(bundleTerms, ['content', 'copy', 'editorial', 'publication', 'story', 'article', 'readability', 'commentary', 'news', 'journalism']) ||
            /(editorial|copy|publication|publishable|manuscript|newsletter|article|story|readability|commentary|news|journal)/.test(supportText);
        var documentationTheme = bundleTermsContain(bundleTerms, ['documentation', 'manual', 'guide', 'release', 'readiness']) ||
            /(documentation|documented|manual|guide|knowledge|release|readiness|user[- ]ready)/.test(supportText);
        var softwareTheme = bundleTermsContain(bundleTerms, ['software', 'code', 'technical', 'system']) ||
            /(software|code|technical decisions?|working software|system needs?)/.test(supportText);
        var creativeTheme = bundleTermsContain(bundleTerms, ['creative', 'graphic', 'visual', 'asset', 'brand', 'layout', 'message']) ||
            /(creative|graphic|visual|asset|brand|layout|audience attention|message)/.test(supportText);
        var financialTheme = bundleTermsContain(bundleTerms, ['financial', 'finance', 'budget', 'forecast', 'account', 'audit', 'control', 'compliance']) ||
            /(financial|finance|audit|control|compliance|reporting|reconciliation|records?|forecast|budget|assurance)/.test(supportText);
        var customerTheme = bundleTermsContain(bundleTerms, ['customer', 'client', 'borrower', 'service', 'stakeholder', 'relationship', 'sale', 'sales']) ||
            /(customer|client|borrower|stakeholder|relationship|sales?|service)/.test(supportText);
        var operationsTheme = /(business problems?|operating|workflow|process|implementation|recommendations?|trackers?|follow[- ]through|exceptions)/.test(supportText);

        if (clusterId === 'cluster_drafting') {
            if (creativeTheme) return 'Creative asset development';
            if (editorialTheme) return 'Editorial content editing';
            if (documentationTheme) return 'Documentation authoring';
            if (softwareTheme) return 'Software development';
            if (customerTheme && bundleTermsContain(bundleTerms, ['proposal', 'pitch', 'marketing'])) return 'Sales and marketing content development';
            return (readableTheme || 'Content') + ' development';
        }
        if (clusterId === 'cluster_qa_review') {
            if (softwareTheme) return 'Code review and approval';
            if (documentationTheme) return 'Documentation review and approval';
            if (editorialTheme) return 'Editorial review and approval';
            if (financialTheme) return 'Controls review and approval';
            return (readableTheme || 'Quality') + ' review and approval';
        }
        if (clusterId === 'cluster_documentation') {
            if (documentationTheme) return 'Documentation upkeep';
            if (financialTheme) return 'Records and controls documentation';
            if (customerTheme) return 'Stakeholder and account documentation';
            return (readableTheme || 'Process') + ' documentation';
        }
        if (clusterId === 'cluster_workflow_admin') {
            if (documentationTheme) return 'Release and documentation workflow';
            if (financialTheme) return 'Account and reporting workflow';
            if (customerTheme) return 'Customer and stakeholder workflow';
            if (operationsTheme) return 'Operating workflow administration';
            return (readableTheme || 'Operational') + ' workflow administration';
        }
        if (clusterId === 'cluster_oversight_strategy') {
            if (softwareTheme) return 'Technical oversight';
            if (editorialTheme) return 'Editorial oversight';
            if (financialTheme) return 'Financial oversight';
            if (operationsTheme) return 'Operating model oversight';
            return (readableTheme || 'Strategic') + ' oversight';
        }
        if (clusterId === 'cluster_analysis') {
            if (financialTheme) return 'Financial analysis';
            if (customerTheme && bundleTermsContain(bundleTerms, ['market', 'audience', 'campaign'])) return 'Audience and market analysis';
            if (operationsTheme) return 'Business operations analysis';
            return (readableTheme || 'Structured') + ' analysis';
        }
        if (clusterId === 'cluster_research_synthesis') {
            if (customerTheme && bundleTermsContain(bundleTerms, ['market', 'audience'])) return 'Audience and market research';
            return (readableTheme || 'Research') + ' research and synthesis';
        }
        if (clusterId === 'cluster_decision_support') {
            if (financialTheme) return 'Financial judgment and exceptions';
            return (readableTheme || 'Decision') + ' judgment and exceptions';
        }
        if (clusterId === 'cluster_coordination') {
            if (documentationTheme) return 'Release coordination';
            if (editorialTheme) return 'Publication coordination';
            if (operationsTheme) return 'Operating model coordination';
            return (readableTheme || 'Cross-team') + ' coordination';
        }
        if (clusterId === 'cluster_execution_routine') {
            if (softwareTheme) return 'Software implementation execution';
            if (financialTheme) return 'Finance operations execution';
            if (editorialTheme) return 'Content production execution';
            return (readableTheme || 'Routine') + ' execution';
        }
        if (clusterId === 'cluster_client_interaction') {
            if (customerTheme) return (readableTheme || 'Stakeholder') + ' handling';
        }
        if (clusterId === 'cluster_relationship_management') {
            if (customerTheme) return (readableTheme || 'Relationship') + ' relationship management';
        }

        if (clusterId === 'cluster_documentation') return theme + ' documentation';
        if (clusterId === 'cluster_workflow_admin') return theme + ' workflow follow-through';
        if (clusterId === 'cluster_qa_review') return theme + ' review and approval';
        if (clusterId === 'cluster_decision_support') return theme + ' judgment and exceptions';
        if (clusterId === 'cluster_research_synthesis') return theme + ' research and synthesis';
        if (clusterId === 'cluster_analysis') return theme + ' analysis and interpretation';
        if (clusterId === 'cluster_coordination') return theme + ' coordination';
        if (clusterId === 'cluster_client_interaction') return theme + ' stakeholder handling';
        if (clusterId === 'cluster_relationship_management') return theme + ' relationship management';
        if (clusterId === 'cluster_oversight_strategy') return theme + ' oversight';
        if (clusterId === 'cluster_drafting') return theme + ' drafting and development';
        if (clusterId === 'cluster_execution_routine') return theme + ' execution';
        return theme + ' work';
    }

    function buildPublicBundleSummary(bundleLabel, topTasks) {
        var tasks = Array.isArray(topTasks) ? topTasks.filter(Boolean).slice(0, 2) : [];
        if (!tasks.length) {
            return bundleLabel + ' is the closest public label for this task bundle.';
        }
        return bundleLabel + ' here mainly refers to work like ' + tasks.join(' and ') + '.';
    }

    function applyPublicBundleMetadata(row, publicWorkBundles) {
        if (!row || !row.task_cluster_id) {
            return row;
        }
        var publicBundle = publicWorkBundles && publicWorkBundles[row.task_cluster_id]
            ? publicWorkBundles[row.task_cluster_id]
            : null;
        row.task_cluster_label = row.task_cluster_label || row.label || slugToLabel(row.task_cluster_id);
        row.public_label = publicBundle && publicBundle.public_label
            ? publicBundle.public_label
            : row.task_cluster_label;
        row.public_summary = publicBundle && publicBundle.public_summary
            ? publicBundle.public_summary
            : null;
        row.label = row.public_label;
        return row;
    }

    function computePublicWorkBundleMap(options) {
        var taskRows = Array.isArray(options.task_rows) ? options.task_rows.slice() : [];
        var taskFunctionLinks = Array.isArray(options.task_function_links) ? options.task_function_links.slice() : [];
        var activeFunctionRows = Array.isArray(options.active_function_rows) ? options.active_function_rows.slice() : [];
        var roleFunctionsById = options.role_functions_by_id || {};
        var functionSummaryById = {};
        var taskFunctionsByTaskId = {};
        var bundleMap = {};

        activeFunctionRows.forEach(function (row) {
            var roleFunction = roleFunctionsById[row.function_id] || {};
            functionSummaryById[row.function_id] = roleFunction.role_summary || roleFunction.function_statement || slugToLabel(roleFunction.function_category || row.function_id);
        });

        taskFunctionLinks.forEach(function (link) {
            if (!taskFunctionsByTaskId[link.task_id]) {
                taskFunctionsByTaskId[link.task_id] = [];
            }
            taskFunctionsByTaskId[link.task_id].push(link);
        });

        var tasksByCluster = {};
        taskRows.forEach(function (row) {
            if (!tasksByCluster[row.task_cluster_id]) {
                tasksByCluster[row.task_cluster_id] = [];
            }
            tasksByCluster[row.task_cluster_id].push(row);
        });

        Object.keys(tasksByCluster).forEach(function (clusterId) {
            var rows = tasksByCluster[clusterId].slice().sort(function (left, right) {
                return toNumber(right.share_of_role, 0) - toNumber(left.share_of_role, 0);
            });
            var tokenWeights = {};
            var phraseWeights = {};
            var linkedFunctionSummaries = [];
            rows.slice(0, 5).forEach(function (row) {
                var taskWeight = clamp(toNumber(row.share_of_role, 0), 0.01, 1) * (1 + (row.is_role_critical ? 0.20 : 0));
                tokenizeBundleText(row.task_statement).forEach(function (token) {
                    tokenWeights[token] = (tokenWeights[token] || 0) + taskWeight;
                });
                buildBundlePhrases(row.task_statement).forEach(function (phrase) {
                    phraseWeights[phrase] = (phraseWeights[phrase] || 0) + (taskWeight * 1.1);
                });
                (taskFunctionsByTaskId[row.task_id] || [])
                    .slice()
                    .sort(function (left, right) {
                        return toNumber(right.task_to_function_weight, 0) - toNumber(left.task_to_function_weight, 0);
                    })
                    .slice(0, 2)
                    .forEach(function (link) {
                        var functionSummary = functionSummaryById[link.function_id] || '';
                        if (functionSummary && linkedFunctionSummaries.indexOf(functionSummary) === -1) {
                            linkedFunctionSummaries.push(functionSummary);
                        }
                        var functionWeight = taskWeight * clamp(toNumber(link.task_to_function_weight, 0.5), 0.05, 1);
                        tokenizeBundleText(functionSummary).forEach(function (token) {
                            tokenWeights[token] = (tokenWeights[token] || 0) + (functionWeight * 1.35);
                        });
                        buildBundlePhrases(functionSummary).forEach(function (phrase) {
                            phraseWeights[phrase] = (phraseWeights[phrase] || 0) + (functionWeight * 1.15);
                        });
                    });
            });

            var topTerms = Object.keys(tokenWeights)
                .sort(function (left, right) {
                    return tokenWeights[right] - tokenWeights[left];
                })
                .slice(0, 2);
            var topPhrases = Object.keys(phraseWeights)
                .sort(function (left, right) {
                    return phraseWeights[right] - phraseWeights[left];
                });
            var publicLabel = buildPublicBundleLabel(clusterId, topPhrases[0], topTerms, rows.slice(0, 2).map(function (row) {
                return row.task_statement;
            }), linkedFunctionSummaries.slice(0, 3));
            var topTasks = rows.slice(0, 2).map(function (row) {
                return row.task_statement;
            });

            bundleMap[clusterId] = {
                task_cluster_id: clusterId,
                public_label: publicLabel,
                public_summary: buildPublicBundleSummary(publicLabel, topTasks),
                top_phrase: topPhrases[0] || '',
                top_terms: topTerms,
                top_tasks: topTasks
            };
        });

        return bundleMap;
    }

    function kindToLabel(kind) {
        if (kind === 'qa') {
            return 'QA';
        }
        return String(kind || '')
            .split('_')
            .map(function (part) {
                return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
            })
            .join(' ');
    }

    function buildAccessionDriver(cluster, kind, drivers) {
        var label = (cluster && (cluster.public_label || cluster.label) ? (cluster.public_label || cluster.label) : slugToLabel(cluster && cluster.task_cluster_id)) || 'this task bundle';
        if (kind === 'review') {
            return label + ' grows when AI-handled output creates more review, approval, and error-catching work.';
        }
        if (kind === 'exception') {
            return label + ' grows when standard cases get cheaper and the human role shifts toward exceptions, ambiguity, and judgment calls.';
        }
        if (kind === 'relationship') {
            return label + ' grows when human trust, negotiation, or live stakeholder handling matters more than routine execution.';
        }
        if (kind === 'governance') {
            return label + ' grows when the organization still needs sign-off, standards, traceability, or policy control after automation arrives.';
        }
        if (drivers && drivers.length) {
            return label + ' grows because exposed work upstream creates more integration work here.';
        }
        return label + ' grows when exposed work upstream still needs human coordination and integration to hold the role together.';
    }

    function frontierWaveFromMargins(margins) {
        if (toNumber(margins && margins.current, -1) >= 0) return 'current';
        if (toNumber(margins && margins.next, -1) >= 0) return 'next';
        return 'distant';
    }

    function frontierReadinessScore(margins) {
        var currentMargin = toNumber(margins && margins.current, -0.25);
        var nextMargin = toNumber(margins && margins.next, -0.25);
        var distantMargin = toNumber(margins && margins.distant, -0.25);

        if (currentMargin >= 0) {
            return Number(clamp(0.74 + (Math.min(currentMargin, 0.30) / 0.30) * 0.20, 0, 1).toFixed(3));
        }
        if (nextMargin >= 0) {
            return Number(clamp(0.52 + (Math.min(nextMargin, 0.30) / 0.30) * 0.18, 0, 0.86).toFixed(3));
        }
        if (distantMargin >= 0) {
            return Number(clamp(0.30 + (Math.min(distantMargin, 0.30) / 0.30) * 0.16, 0, 0.72).toFixed(3));
        }
        return Number(clamp(0.18 + (Math.max(distantMargin + 0.25, 0) / 0.25) * 0.12, 0.05, 0.42).toFixed(3));
    }

    function computeContinuousWaveTimingScore(triggerFrontier, scenarioActivation) {
        var assistReadiness = clamp(toNumber(triggerFrontier && triggerFrontier.assist && triggerFrontier.assist.readiness_score, 0.35), 0, 1);
        var delegateReadiness = clamp(toNumber(triggerFrontier && triggerFrontier.delegate && triggerFrontier.delegate.readiness_score, 0.35), 0, 1);
        var compressReadiness = clamp(toNumber(triggerFrontier && triggerFrontier.compress && triggerFrontier.compress.readiness_score, 0.35), 0, 1);
        var breakReadiness = clamp(toNumber(triggerFrontier && triggerFrontier.structural_break && triggerFrontier.structural_break.readiness_score, 0.35), 0, 1);
        var currentActivation = clamp(toNumber(scenarioActivation && scenarioActivation.current, 0.35), 0, 1);
        var nextActivation = clamp(toNumber(scenarioActivation && scenarioActivation.next, currentActivation), currentActivation, 1);
        var distantActivation = clamp(toNumber(scenarioActivation && scenarioActivation.distant, nextActivation), nextActivation, 1);
        var ceilingActivation = clamp(toNumber(scenarioActivation && scenarioActivation.ceiling, distantActivation), distantActivation, 1);
        var nextLift = clamp((nextActivation - currentActivation) / Math.max(1 - currentActivation, 0.0001), 0, 1);
        var distantLift = clamp((distantActivation - nextActivation) / Math.max(1 - nextActivation, 0.0001), 0, 1);
        var score = clamp(
            (compressReadiness * 0.30) +
            (breakReadiness * 0.24) +
            (delegateReadiness * 0.16) +
            (assistReadiness * 0.08) +
            (nextLift * 0.12) +
            (distantLift * 0.04) +
            (ceilingActivation * 0.06),
            0,
            1
        );

        return Number(clamp(score, 0, 1).toFixed(3));
    }

    function buildTimingFrontierSummary(options) {
        var currentBundle = Array.isArray(options.current_bundle) ? options.current_bundle : [];
        var diagnostics = options.diagnostics || {};
        var signals = options.signals || {};
        var functionMetrics = options.function_metrics || {};
        var scenarioActivation = buildScenarioActivationLevels({
            current_activation: average([
                clamp(toNumber(diagnostics.effective_adoption_pressure, 0.35), 0, 1),
                clamp(toNumber(diagnostics.workflow_compression, 0.35), 0, 1),
                clamp(toNumber(diagnostics.organizational_conversion, 0.35), 0, 1),
                clamp(toNumber(diagnostics.ai_adoption_context, diagnostics.effective_adoption_pressure), 0, 1),
                clamp(toNumber(diagnostics.adoption_realization_context, diagnostics.effective_adoption_pressure), 0, 1)
            ]),
            organizational_adoption_ceiling: toNumber(options.organizational_adoption_ceiling, null),
            next_scenario_lift: toNumber(options.next_scenario_lift, null),
            distant_scenario_lift: toNumber(options.distant_scenario_lift, null)
        });
        var capabilityReadiness = currentBundle.length
            ? weightedAverage(currentBundle, 'frontier_capability_readiness', 'share_of_role')
            : clamp(toNumber(signals.capabilitySignal, 0.5), 0, 1);
        var supervisionReadiness = currentBundle.length
            ? weightedAverage(currentBundle, 'frontier_supervision_readiness', 'share_of_role')
            : average([
                clamp(toNumber(signals.capabilitySignal, 0.5), 0, 1),
                clamp(toNumber(signals.questionnaireProfile && signals.questionnaireProfile.workflow_decomposability, 0.5), 0, 1),
                clamp(toNumber(signals.questionnaireProfile && signals.questionnaireProfile.ai_observability_of_work, 0.5), 0, 1)
            ]);
        var economicPressure = currentBundle.length
            ? weightedAverage(currentBundle, 'frontier_economic_pressure', 'share_of_role')
            : average([
                clamp(toNumber(diagnostics.direct_exposure_pressure, 0.35), 0, 1),
                1 - clamp(toNumber(diagnostics.demand_expansion_modifier, 0.5), 0, 1)
            ]);
        var organizationalFriction = currentBundle.length
            ? weightedAverage(currentBundle, 'frontier_organizational_friction', 'share_of_role')
            : average([
                clamp(toNumber(functionMetrics.retained_accountability_strength, diagnostics.retained_accountability_strength), 0, 1),
                clamp(toNumber(functionMetrics.retained_bargaining_power, diagnostics.retained_bargaining_power), 0, 1),
                clamp(toNumber(diagnostics.residual_role_integrity, 0.5), 0, 1)
            ]);
        var organizationalReadiness = clamp(1 - organizationalFriction, 0, 1);
        var observability = clamp(toNumber(signals.questionnaireProfile && signals.questionnaireProfile.ai_observability_of_work, 0.5), 0, 1);
        var decomposability = clamp(toNumber(signals.questionnaireProfile && signals.questionnaireProfile.workflow_decomposability, 0.5), 0, 1);
        var trustLoad = clamp(toNumber(signals.questionnaireProfile && signals.questionnaireProfile.external_trust_requirement, 0.5), 0, 1);
        var exceptionBurden = clamp(toNumber(diagnostics.exception_burden, 0.5), 0, 1);
        var accountabilityLoad = clamp(toNumber(diagnostics.accountability_load, 0.5), 0, 1);
        var directExposure = clamp(toNumber(diagnostics.direct_exposure_pressure, 0.35), 0, 1);
        var augmentationFit = clamp(toNumber(signals.augmentationFit, diagnostics.augmentation_fit), 0, 1);
        var workflowCompression = clamp(toNumber(diagnostics.workflow_compression, 0.35), 0, 1);
        var organizationalConversion = clamp(toNumber(diagnostics.organizational_conversion, 0.35), 0, 1);
        var demandExpansionModifier = clamp(toNumber(diagnostics.demand_expansion_modifier, 0.5), 0, 1);
        var retainedBargainingPower = clamp(toNumber(functionMetrics.retained_bargaining_power, diagnostics.retained_bargaining_power), 0, 1);
        var retainedAccountabilityStrength = clamp(toNumber(functionMetrics.retained_accountability_strength, diagnostics.retained_accountability_strength), 0, 1);
        var delegationLikelihood = clamp(toNumber(functionMetrics.delegation_likelihood, diagnostics.delegation_likelihood), 0, 1);
        var roleCompressibility = clamp(toNumber(functionMetrics.role_compressibility, diagnostics.role_compressibility), 0, 1);
        var headcountDisplacementRisk = clamp(toNumber(functionMetrics.headcount_displacement_risk, diagnostics.headcount_displacement_risk), 0, 1);
        var nextWaveRetained = clamp(toNumber(diagnostics.next_wave_retained, 0.6), 0, 1);
        var residualRoleIntegrity = clamp(toNumber(diagnostics.residual_role_integrity, 0.5), 0, 1);
        var currentActivation = scenarioActivation.current;

        function triggerMargins(triggerId) {
            // Positive weights sum to 1.00 (audit 2026-03-28: corrected from 0.90)
            function assistMargin(activation) {
                var assistBase = clamp(
                    (capabilityReadiness * 0.30) +
                    (augmentationFit * 0.16) +
                    (directExposure * 0.12) +
                    (economicPressure * 0.10) +
                    (observability * 0.10) +
                    (decomposability * 0.08) +
                    (organizationalReadiness * 0.08) +
                    (delegationLikelihood * 0.06) -
                    (exceptionBurden * 0.06) -
                    (accountabilityLoad * 0.05) -
                    (trustLoad * 0.05),
                    0,
                    1
                );
                return computeScenarioHurdleMargin(assistBase, activation, currentActivation, 0.42, 0.10, 0.10);
            }

            function delegateMargin(activation) {
                var delegateBase = clamp(
                    (capabilityReadiness * 0.22) +
                    (supervisionReadiness * 0.20) +
                    (directExposure * 0.12) +
                    (economicPressure * 0.08) +
                    (observability * 0.10) +
                    (decomposability * 0.10) +
                    (organizationalReadiness * 0.08) +
                    (delegationLikelihood * 0.05) +
                    (workflowCompression * 0.03) -
                    (accountabilityLoad * 0.06) -
                    (exceptionBurden * 0.04),
                    0,
                    1
                );
                return computeScenarioHurdleMargin(delegateBase, activation, currentActivation, 0.47, 0.12, 0.14);
            }

            function compressMargin(activation) {
                var compressBase = clamp(
                    (supervisionReadiness * 0.20) +
                    (economicPressure * 0.16) +
                    (workflowCompression * 0.14) +
                    (organizationalConversion * 0.10) +
                    (directExposure * 0.10) +
                    (headcountDisplacementRisk * 0.10) +
                    (roleCompressibility * 0.08) +
                    (delegationLikelihood * 0.05) +
                    (organizationalReadiness * 0.07) -
                    (demandExpansionModifier * 0.08) -
                    (retainedAccountabilityStrength * 0.06) -
                    (retainedBargainingPower * 0.04),
                    0,
                    1
                );
                return computeScenarioHurdleMargin(compressBase, activation, currentActivation, 0.48, 0.16, 0.20);
            }

            // Positive weights sum to 1.00 (audit 2026-03-28: corrected from 0.92)
            function structuralBreakMargin(activation) {
                var structuralBreakBase = clamp(
                    (economicPressure * 0.16) +
                    (organizationalConversion * 0.14) +
                    ((1 - residualRoleIntegrity) * 0.14) +
                    ((1 - nextWaveRetained) * 0.14) +
                    (headcountDisplacementRisk * 0.12) +
                    (roleCompressibility * 0.10) +
                    (directExposure * 0.10) +
                    (organizationalReadiness * 0.10) -
                    (demandExpansionModifier * 0.08) -
                    (retainedAccountabilityStrength * 0.08) -
                    (retainedBargainingPower * 0.06),
                    0,
                    1
                );
                return computeScenarioHurdleMargin(structuralBreakBase, activation, currentActivation, 0.50, 0.16, 0.22);
            }

            if (triggerId === 'assist') {
                return {
                    current: assistMargin(scenarioActivation.current),
                    next: assistMargin(scenarioActivation.next),
                    distant: assistMargin(scenarioActivation.distant)
                };
            }
            if (triggerId === 'delegate') {
                return {
                    current: delegateMargin(scenarioActivation.current),
                    next: delegateMargin(scenarioActivation.next),
                    distant: delegateMargin(scenarioActivation.distant)
                };
            }
            if (triggerId === 'compress') {
                return {
                    current: compressMargin(scenarioActivation.current),
                    next: compressMargin(scenarioActivation.next),
                    distant: compressMargin(scenarioActivation.distant)
                };
            }
            return {
                current: structuralBreakMargin(scenarioActivation.current),
                next: structuralBreakMargin(scenarioActivation.next),
                distant: structuralBreakMargin(scenarioActivation.distant)
            };
        }

        function triggerBindingConstraint(triggerId) {
            if (triggerId === 'assist') {
                return pickBindingConstraintFromReadiness({
                    capability_limited: capabilityReadiness,
                    supervision_limited: clamp(toNumber(signals.augmentationFit, diagnostics.augmentation_fit), 0, 1),
                    economics_limited: scenarioActivation.current,
                    organization_limited: 1 - average([
                        clamp(toNumber(diagnostics.exception_burden, 0.5), 0, 1),
                        clamp(toNumber(diagnostics.accountability_load, 0.5), 0, 1)
                    ])
                });
            }
            if (triggerId === 'delegate') {
                return pickBindingConstraintFromReadiness({
                    capability_limited: capabilityReadiness,
                    supervision_limited: supervisionReadiness,
                    economics_limited: scenarioActivation.current,
                    organization_limited: 1 - organizationalFriction
                });
            }
            if (triggerId === 'compress') {
                return pickBindingConstraintFromReadiness({
                    capability_limited: supervisionReadiness,
                    supervision_limited: clamp(toNumber(diagnostics.workflow_compression, 0.35), 0, 1),
                    economics_limited: economicPressure,
                    organization_limited: 1 - average([
                        organizationalFriction,
                        clamp(toNumber(functionMetrics.retained_bargaining_power, diagnostics.retained_bargaining_power), 0, 1),
                        clamp(toNumber(diagnostics.demand_expansion_modifier, 0.5), 0, 1)
                    ])
                });
            }
            return pickBindingConstraintFromReadiness({
                capability_limited: economicPressure,
                supervision_limited: clamp(toNumber(diagnostics.organizational_conversion, 0.35), 0, 1),
                economics_limited: 1 - clamp(toNumber(diagnostics.next_wave_retained, 0.6), 0, 1),
                organization_limited: 1 - average([
                    clamp(toNumber(functionMetrics.retained_accountability_strength, diagnostics.retained_accountability_strength), 0, 1),
                    clamp(toNumber(functionMetrics.retained_bargaining_power, diagnostics.retained_bargaining_power), 0, 1),
                    clamp(toNumber(diagnostics.residual_role_integrity, 0.5), 0, 1)
                ])
            });
        }

        var triggerFrontier = {
            assist: {
                scenario_margins: triggerMargins('assist')
            },
            delegate: {
                scenario_margins: triggerMargins('delegate')
            },
            compress: {
                scenario_margins: triggerMargins('compress')
            },
            structural_break: {
                scenario_margins: triggerMargins('structural_break')
            }
        };

        Object.keys(triggerFrontier).forEach(function (triggerId) {
            var entry = triggerFrontier[triggerId];
            var binding = triggerBindingConstraint(triggerId);
            entry.crossing_wave = frontierWaveFromMargins(entry.scenario_margins);
            entry.readiness_score = frontierReadinessScore(entry.scenario_margins);
            entry.binding_constraint = binding.binding_constraint;
            entry.binding_constraint_label = binding.binding_constraint_label;
        });

        var waveOrder = { current: 0, next: 1, distant: 2 };
        var primaryTriggerId = waveOrder[triggerFrontier.structural_break.crossing_wave] < waveOrder[triggerFrontier.compress.crossing_wave]
            ? 'structural_break'
            : 'compress';
        var primaryTrigger = triggerFrontier[primaryTriggerId] || triggerFrontier.compress;
        var primaryDisplacementWave = primaryTrigger && primaryTrigger.crossing_wave
            ? primaryTrigger.crossing_wave
            : frontierWaveFromMargins(triggerFrontier.compress.scenario_margins);
        var primaryWaveScore = computeContinuousWaveTimingScore(
            triggerFrontier,
            scenarioActivation
        );

        var clusterDrivers = currentBundle
            .slice()
            .sort(function (left, right) {
                var rightMargin = Math.max(
                    toNumber(right.frontier_scenario_margins && right.frontier_scenario_margins.current, -1),
                    toNumber(right.frontier_scenario_margins && right.frontier_scenario_margins.next, -1)
                );
                var leftMargin = Math.max(
                    toNumber(left.frontier_scenario_margins && left.frontier_scenario_margins.current, -1),
                    toNumber(left.frontier_scenario_margins && left.frontier_scenario_margins.next, -1)
                );
                if (rightMargin !== leftMargin) {
                    return rightMargin - leftMargin;
                }
                return toNumber(right.share_of_role, 0) - toNumber(left.share_of_role, 0);
            })
            .slice(0, 3)
            .map(function (row) {
                return {
                    task_cluster_id: row.task_cluster_id,
                    label: row.public_label || row.label,
                    crossing_wave: row.frontier_crossing_wave || row.wave_assignment,
                    binding_constraint: row.frontier_binding_constraint || null,
                    binding_constraint_label: row.frontier_binding_constraint_label || null,
                    current_margin: row.frontier_scenario_margins ? row.frontier_scenario_margins.current : null,
                    next_margin: row.frontier_scenario_margins ? row.frontier_scenario_margins.next : null
                };
            });

        return {
            capability_readiness: Number(clamp(capabilityReadiness, 0, 1).toFixed(3)),
            supervision_readiness: Number(clamp(supervisionReadiness, 0, 1).toFixed(3)),
            economic_pressure: Number(clamp(economicPressure, 0, 1).toFixed(3)),
            organizational_friction: Number(clamp(organizationalFriction, 0, 1).toFixed(3)),
            scenario_activation: scenarioActivation,
            triggers: triggerFrontier,
            cluster_drivers: clusterDrivers,
            primary_displacement_wave: primaryDisplacementWave,
            primary_wave_score: primaryWaveScore,
            primary_binding_constraint: primaryTrigger ? primaryTrigger.binding_constraint : triggerFrontier.compress.binding_constraint,
            primary_binding_constraint_label: primaryTrigger ? primaryTrigger.binding_constraint_label : triggerFrontier.compress.binding_constraint_label
        };
    }

    function triggerReadinessLabel(score) {
        if (score >= 0.68) return 'active now';
        if (score >= 0.48) return 'close if tooling improves';
        return 'not there yet';
    }

    function bundleConfidenceLabel(score, coverageRatio, directEvidenceTaskCount) {
        var composite = average([
            clamp(toNumber(score, 0.4), 0, 1),
            clamp(toNumber(coverageRatio, 0.35), 0, 1),
            directEvidenceTaskCount >= 3 ? 1 : directEvidenceTaskCount >= 1 ? 0.62 : 0.28
        ]);
        if (composite >= 0.68) return 'Strong evidence';
        if (composite >= 0.48) return 'Mixed evidence';
        return 'Thin evidence';
    }

    function bundleConfidenceReason(sourceMix, directEvidenceTaskCount, taskFirstTaskCount) {
        var sources = Array.isArray(sourceMix) ? sourceMix.slice() : parsePipeList(sourceMix || '');
        var hasReviewed = sources.some(function (sourceId) {
            return String(sourceId || '').indexOf('src_reviewed_task_scoring_') === 0;
        });
        var hasProxy = sources.some(function (sourceId) {
            return String(sourceId || '').indexOf('src_v2_cluster_prior_proxy_') === 0;
        });
        var hasBenchmark = sources.some(function (sourceId) {
            return String(sourceId || '').indexOf('src_openai_gpts_are_gpts_') === 0 || String(sourceId || '').indexOf('src_anthropic_ei_') === 0;
        });

        if (hasReviewed && directEvidenceTaskCount >= 1 && !hasProxy) {
            return 'Reviewed task-backed';
        }
        if (hasReviewed && hasProxy) {
            return 'Mixed reviewed and fallback';
        }
        if (hasBenchmark && directEvidenceTaskCount >= 2 && taskFirstTaskCount >= 1 && !hasProxy) {
            return 'Benchmark-task backed';
        }
        if (hasBenchmark && hasProxy) {
            return 'Mixed task evidence';
        }
        if (taskFirstTaskCount >= 1 && directEvidenceTaskCount >= 1) {
            return 'Task-evidence supported';
        }
        if (hasProxy || directEvidenceTaskCount === 0) {
            return 'Fallback-heavy';
        }
        return 'Limited direct evidence';
    }

    function buildTriggerRow(triggerId, score, options) {
        return {
            trigger_id: triggerId,
            trigger_label: options.trigger_label,
            readiness_score: Number(clamp(score, 0, 1).toFixed(3)),
            readiness_label: triggerReadinessLabel(score),
            frontier_margin: options.frontier_margin !== undefined && options.frontier_margin !== null
                ? Number(toNumber(options.frontier_margin, 0).toFixed(3))
                : null,
            crossing_wave: options.crossing_wave || null,
            binding_constraint: options.binding_constraint || null,
            binding_constraint_label: options.binding_constraint_label || null,
            threshold_summary: options.threshold_summary,
            mechanism_summary: options.mechanism_summary,
            consequence_summary: options.consequence_summary
        };
    }

    function triggerConfidenceLabel(score) {
        if (score >= 0.68) return 'Strong evidence';
        if (score >= 0.48) return 'Mixed evidence';
        return 'Thin evidence';
    }

    function triggerConfidenceReason(options) {
        var directCoverageRatio = clamp(toNumber(options.direct_coverage_ratio, 0.35), 0, 1);
        var accessionConfidence = clamp(toNumber(options.accession_confidence, 0.38), 0, 1);
        var contextConfidence = clamp(toNumber(options.context_confidence, 0.42), 0, 1);
        var recompositionConfidence = clamp(toNumber(options.recomposition_confidence, 0.42), 0, 1);
        var timingConfidence = clamp(toNumber(options.timing_confidence, 0.42), 0, 1);
        var triggerGap = clamp(toNumber(options.trigger_gap, 0), 0, 1);
        var thinEvidenceActive = !!options.thin_evidence_active;
        var thinEvidenceSeverity = clamp(toNumber(options.thin_evidence_severity, 0), 0, 1);

        if (thinEvidenceActive && (directCoverageRatio < 0.45 || thinEvidenceSeverity >= 0.52)) {
            return 'Thin task coverage';
        }
        if (accessionConfidence < 0.44) {
            return 'Rebundle evidence still thin';
        }
        if (contextConfidence < 0.45) {
            return 'Weak outer context support';
        }
        if (recompositionConfidence < 0.46 || timingConfidence < 0.45) {
            return 'Structural read still unstable';
        }
        if (directCoverageRatio >= 0.60 && accessionConfidence >= 0.58 && recompositionConfidence >= 0.56) {
            return 'Task-backed and context-aligned';
        }
        if (triggerGap < 0.035) {
            return 'Adjacent thresholds nearly tied';
        }
        if (triggerGap < 0.07) {
            return 'Threshold ordering still crowded';
        }
        if (directCoverageRatio < 0.48 || accessionConfidence < 0.45) {
            return 'Mixed task coverage';
        }
        return 'Mixed structural evidence';
    }

    function triggerConfidenceScore(options) {
        var directCoverageRatio = clamp(toNumber(options.direct_coverage_ratio, 0.35), 0, 1);
        var accessionConfidence = clamp(toNumber(options.accession_confidence, 0.38), 0, 1);
        var contextConfidence = clamp(toNumber(options.context_confidence, 0.42), 0, 1);
        var recompositionConfidence = clamp(toNumber(options.recomposition_confidence, 0.42), 0, 1);
        var timingConfidence = clamp(toNumber(options.timing_confidence, 0.42), 0, 1);
        var triggerGap = clamp(toNumber(options.trigger_gap, 0), 0, 1);
        var thinEvidenceActive = !!options.thin_evidence_active;
        var thinEvidenceSeverity = clamp(toNumber(options.thin_evidence_severity, 0), 0, 1);
        var confidence = average([
            directCoverageRatio,
            accessionConfidence,
            contextConfidence,
            recompositionConfidence,
            timingConfidence
        ]);

        if (triggerGap < 0.05) {
            confidence -= 0.14;
        } else if (triggerGap < 0.09) {
            confidence -= 0.08;
        }

        if (thinEvidenceActive) {
            confidence -= 0.10 + (thinEvidenceSeverity * 0.16);
        }

        return Number(clamp(confidence, 0.18, 0.92).toFixed(3));
    }

    function computeTransitionTriggerMap(options) {
        var functionMetrics = options.function_metrics || {};
        var diagnostics = options.diagnostics || {};
        var signals = options.signals || {};
        var taskAccessionMap = options.task_accession_map || {};
        var retainedClusters = Array.isArray(options.retained_clusters) ? options.retained_clusters.slice() : [];
        var publicWorkBundles = options.public_work_bundles || {};
        var roleFate = options.role_fate || {};
        var roleDefiningWork = options.role_defining_work || null;

        var topShrinking = taskAccessionMap.shrinking_clusters && taskAccessionMap.shrinking_clusters[0]
            ? taskAccessionMap.shrinking_clusters[0]
            : null;
        var topAccession = taskAccessionMap.accession_clusters && taskAccessionMap.accession_clusters[0]
            ? taskAccessionMap.accession_clusters[0]
            : null;
        var shrinkingLabel = topShrinking ? (topShrinking.public_label || topShrinking.task_cluster_label) : 'the exposed execution layer';
        var accessionLabel = topAccession ? (topAccession.public_label || topAccession.task_cluster_label) : null;
        var roleDefiningPublicLabel = roleDefiningWork && roleDefiningWork.task_cluster_id
            ? ((publicWorkBundles[roleDefiningWork.task_cluster_id] && publicWorkBundles[roleDefiningWork.task_cluster_id].public_label) || roleDefiningWork.label || null)
            : (roleDefiningWork && roleDefiningWork.label ? roleDefiningWork.label : null);
        var retainedLabel = roleDefiningPublicLabel ? roleDefiningPublicLabel.toLowerCase() : 'the retained human core';
        var distinctRetainedCandidates = retainedClusters
            .slice()
            .filter(function (cluster) {
                return cluster && cluster.task_cluster_id !== (topShrinking && topShrinking.task_cluster_id);
            })
            .sort(function (left, right) {
                return toNumber(right.retained_share, 0) - toNumber(left.retained_share, 0);
            });
        var topDistinctRetained = distinctRetainedCandidates[0] || null;
        var topDistinctRetainedLabel = topDistinctRetained
            ? ((publicWorkBundles[topDistinctRetained.task_cluster_id] && publicWorkBundles[topDistinctRetained.task_cluster_id].public_label) || topDistinctRetained.label || slugToLabel(topDistinctRetained.task_cluster_id))
            : null;
        var distinctRetainedCoreLabel = accessionLabel
            ? accessionLabel.toLowerCase()
            : (topDistinctRetainedLabel ? topDistinctRetainedLabel.toLowerCase() : (retainedLabel && retainedLabel !== shrinkingLabel.toLowerCase() ? retainedLabel : null));

        var directExposure = clamp(toNumber(diagnostics.direct_exposure_pressure, 0), 0, 1);
        var spilloverPressure = clamp(toNumber(diagnostics.indirect_dependency_pressure, 0), 0, 1);
        var effectiveAdoptionPressure = clamp(toNumber(diagnostics.effective_adoption_pressure, 0), 0, 1);
        var demandExpansionModifier = clamp(toNumber(diagnostics.demand_expansion_modifier, 0), 0, 1);
        var residualRoleIntegrity = clamp(toNumber(diagnostics.residual_role_integrity, 0.5), 0, 1);
        var workflowCompression = clamp(toNumber(diagnostics.workflow_compression, 0), 0, 1);
        var organizationalConversion = clamp(toNumber(diagnostics.organizational_conversion, 0), 0, 1);
        var nextWaveRetained = clamp(toNumber(diagnostics.next_wave_retained, 0), 0, 1);
        var capabilitySignal = clamp(toNumber(diagnostics.capability_signal, signals.capabilitySignal), 0, 1);
        var augmentationFit = clamp(toNumber(diagnostics.augmentation_fit, signals.augmentationFit), 0, 1);
        var observability = clamp(toNumber(signals.questionnaireProfile && signals.questionnaireProfile.ai_observability_of_work, 0.5), 0, 1);
        var decomposability = clamp(toNumber(signals.questionnaireProfile && signals.questionnaireProfile.workflow_decomposability, 0.5), 0, 1);
        var exceptionBurden = clamp(toNumber(diagnostics.exception_burden, signals.questionnaireProfile && signals.questionnaireProfile.exception_and_context_load), 0, 1);
        var accountabilityLoad = clamp(toNumber(diagnostics.accountability_load, signals.questionnaireProfile && signals.questionnaireProfile.human_signoff_requirement), 0, 1);
        var trustLoad = clamp(toNumber(signals.questionnaireProfile && signals.questionnaireProfile.external_trust_requirement, 0.5), 0, 1);
        var delegationLikelihood = clamp(toNumber(functionMetrics.delegation_likelihood, diagnostics.delegation_likelihood), 0, 1);
        var roleCompressibility = clamp(toNumber(functionMetrics.role_compressibility, diagnostics.role_compressibility), 0, 1);
        var headcountDisplacementRisk = clamp(toNumber(functionMetrics.headcount_displacement_risk, diagnostics.headcount_displacement_risk), 0, 1);
        var roleFragmentationRisk = clamp(toNumber(functionMetrics.role_fragmentation_risk, diagnostics.role_fragmentation_risk), 0, 1);
        var retainedAccountabilityStrength = clamp(toNumber(functionMetrics.retained_accountability_strength, diagnostics.retained_accountability_strength), 0, 1);
        var directCoverageRatio = clamp(toNumber(diagnostics.direct_coverage_ratio, 0.35), 0, 1);
        var accessionConfidence = clamp(toNumber(taskAccessionMap.accession_confidence, diagnostics.accession_confidence), 0, 1);
        var recompositionConfidence = clamp(toNumber(diagnostics.recomposition_confidence, 0.42), 0, 1);
        var timingConfidence = clamp(toNumber(diagnostics.timing_confidence, 0.42), 0, 1);
        var contextConfidence = average([
            clamp(toNumber(diagnostics.accountability_context_confidence, 0.42), 0, 1),
            clamp(toNumber(diagnostics.bargaining_context_confidence, 0.42), 0, 1),
            clamp(toNumber(diagnostics.fragmentation_context_confidence, 0.42), 0, 1)
        ]);
        var thinEvidenceActive = String(diagnostics.thin_evidence_guardrail_active || '') === '1' || !!diagnostics.thin_evidence_guardrail_active;
        var thinEvidenceSeverity = clamp(toNumber(diagnostics.thin_evidence_guardrail_severity, 0), 0, 1);
        var timingFrontier = options.timing_frontier || buildTimingFrontierSummary({
            current_bundle: options.current_bundle || [],
            diagnostics: diagnostics,
            signals: signals,
            function_metrics: functionMetrics,
            organizational_adoption_ceiling: options.organizational_adoption_ceiling,
            next_scenario_lift: options.next_scenario_lift,
            distant_scenario_lift: options.distant_scenario_lift
        });
        var assistFrontier = timingFrontier.triggers && timingFrontier.triggers.assist
            ? timingFrontier.triggers.assist
            : { readiness_score: 0.3, scenario_margins: { current: -0.1, next: -0.05, distant: 0.02 }, crossing_wave: 'distant' };
        var delegateFrontier = timingFrontier.triggers && timingFrontier.triggers.delegate
            ? timingFrontier.triggers.delegate
            : { readiness_score: 0.3, scenario_margins: { current: -0.1, next: -0.05, distant: 0.02 }, crossing_wave: 'distant' };
        var compressFrontier = timingFrontier.triggers && timingFrontier.triggers.compress
            ? timingFrontier.triggers.compress
            : { readiness_score: 0.3, scenario_margins: { current: -0.1, next: -0.05, distant: 0.02 }, crossing_wave: 'distant' };
        var structuralBreakFrontier = timingFrontier.triggers && timingFrontier.triggers.structural_break
            ? timingFrontier.triggers.structural_break
            : { readiness_score: 0.3, scenario_margins: { current: -0.1, next: -0.05, distant: 0.02 }, crossing_wave: 'distant' };
        var assistScore = clamp(toNumber(assistFrontier.readiness_score, 0.3), 0, 1);
        var delegationScore = clamp(toNumber(delegateFrontier.readiness_score, 0.3), 0, 1);
        var compressionScore = clamp(toNumber(compressFrontier.readiness_score, 0.3), 0, 1);
        var structuralBreakScore = clamp(toNumber(structuralBreakFrontier.readiness_score, 0.3), 0, 1);

        var triggers = [
            buildTriggerRow('assist', assistScore, {
                trigger_label: 'Assist trigger',
                threshold_summary: 'AI becomes good enough to speed up ' + shrinkingLabel.toLowerCase() + ' without removing human ownership.',
                mechanism_summary: 'This is the first threshold where copilots, draft tools, and workflow helpers start saving noticeable time in the exposed layer.',
                consequence_summary: 'The seat stays intact, but output expectations rise and the execution layer begins to lose scarcity.',
                frontier_margin: assistFrontier.scenario_margins && assistFrontier.scenario_margins.current,
                crossing_wave: assistFrontier.crossing_wave,
                binding_constraint: assistFrontier.binding_constraint,
                binding_constraint_label: assistFrontier.binding_constraint_label
            }),
            buildTriggerRow('delegate', delegationScore, {
                trigger_label: 'Delegation trigger',
                threshold_summary: 'AI becomes reliable and reviewable enough that ' + shrinkingLabel.toLowerCase() + ' can move to first-pass execution under human supervision.',
                mechanism_summary: 'Organizations stop treating the exposed layer as handcrafted work and start treating it as review, routing, or exception-handling work.',
                consequence_summary: accessionLabel
                    ? 'This is the point where time shifts away from ' + shrinkingLabel.toLowerCase() + ' and toward ' + accessionLabel.toLowerCase() + '.'
                    : 'This is the point where routine execution starts giving way to review, exception handling, and coordination.',
                frontier_margin: delegateFrontier.scenario_margins && delegateFrontier.scenario_margins.current,
                crossing_wave: delegateFrontier.crossing_wave,
                binding_constraint: delegateFrontier.binding_constraint,
                binding_constraint_label: delegateFrontier.binding_constraint_label
            }),
            buildTriggerRow('compress', compressionScore, {
                trigger_label: 'Compression trigger',
                threshold_summary: 'AI becomes cheap and trustworthy enough that teams no longer need today\'s staffing level for ' + shrinkingLabel.toLowerCase() + '.',
                mechanism_summary: 'Once the exposed layer is both delegable and easy to supervise, organizations can cover the same workflow with fewer people.',
                consequence_summary: accessionLabel
                    ? 'This is usually where bargaining power starts to fall: ' + shrinkingLabel.toLowerCase() + ' stops being scarce, while ' + accessionLabel.toLowerCase() + ' becomes the main retained source of leverage.'
                    : 'This is usually where bargaining power starts to fall: the exposed execution layer stops being scarce even though the role itself still exists.',
                frontier_margin: compressFrontier.scenario_margins && compressFrontier.scenario_margins.current,
                crossing_wave: compressFrontier.crossing_wave,
                binding_constraint: compressFrontier.binding_constraint,
                binding_constraint_label: compressFrontier.binding_constraint_label
            }),
            buildTriggerRow('structural_break', structuralBreakScore, {
                trigger_label: 'Structural break trigger',
                threshold_summary: 'Enough of the workflow crosses compression that the seat itself changes shape instead of just getting faster.',
                mechanism_summary: 'This only activates when the remaining human work no longer looks like today\'s blended job and instead centers on a narrower retained core.',
                consequence_summary: accessionLabel
                    ? 'If this threshold is crossed, the role reorganizes around ' + accessionLabel.toLowerCase() + ' and ' + retainedLabel + ', not around the old execution mix.'
                    : 'If this threshold is crossed, the role reorganizes around ' + retainedLabel + ' rather than the old execution mix.',
                frontier_margin: structuralBreakFrontier.scenario_margins && structuralBreakFrontier.scenario_margins.current,
                crossing_wave: structuralBreakFrontier.crossing_wave,
                binding_constraint: structuralBreakFrontier.binding_constraint,
                binding_constraint_label: structuralBreakFrontier.binding_constraint_label
            })
        ];

        triggers.sort(function (left, right) {
            var order = { assist: 0, delegate: 1, compress: 2, structural_break: 3 };
            return order[left.trigger_id] - order[right.trigger_id];
        });

        triggers.forEach(function (row, index) {
            var neighborScores = [];
            if (index > 0) {
                neighborScores.push(Math.abs(toNumber(row.readiness_score, 0) - toNumber(triggers[index - 1].readiness_score, 0)));
            }
            if (index < triggers.length - 1) {
                neighborScores.push(Math.abs(toNumber(row.readiness_score, 0) - toNumber(triggers[index + 1].readiness_score, 0)));
            }
            var triggerGap = neighborScores.length ? Math.min.apply(null, neighborScores) : 0.18;
            var confidence = triggerConfidenceScore({
                direct_coverage_ratio: directCoverageRatio,
                accession_confidence: accessionConfidence,
                context_confidence: contextConfidence,
                recomposition_confidence: recompositionConfidence,
                timing_confidence: timingConfidence,
                trigger_gap: triggerGap,
                thin_evidence_active: thinEvidenceActive,
                thin_evidence_severity: thinEvidenceSeverity
            });
            row.confidence = confidence;
            row.confidence_label = triggerConfidenceLabel(confidence);
            row.confidence_reason = triggerConfidenceReason({
                direct_coverage_ratio: directCoverageRatio,
                accession_confidence: accessionConfidence,
                context_confidence: contextConfidence,
                recomposition_confidence: recompositionConfidence,
                timing_confidence: timingConfidence,
                trigger_gap: triggerGap,
                thin_evidence_active: thinEvidenceActive,
                thin_evidence_severity: thinEvidenceSeverity
            });
        });

        var compressionDominant =
            roleFate.state === 'compressed' &&
            (
                compressionScore >= 0.44 ||
                !distinctRetainedCoreLabel ||
                compressionScore + 0.02 >= delegationScore
            );
        var decisiveTriggerId = 'assist';
        if (roleFate.state === 'expanded' || roleFate.state === 'augmented') {
            decisiveTriggerId = 'assist';
        } else if ((roleFate.state === 'split' || roleFate.state === 'collapsed') && structuralBreakScore >= 0.40) {
            decisiveTriggerId = 'structural_break';
        } else if (compressionDominant) {
            decisiveTriggerId = 'compress';
        } else if (delegationScore >= 0.44) {
            decisiveTriggerId = 'delegate';
        }
        var decisiveTrigger = triggers.filter(function (row) {
            return row.trigger_id === decisiveTriggerId;
        })[0] || triggers[0] || null;
        var bargainingCliffStage = compressionDominant || compressionScore >= 0.46 ? 'compress' : 'delegate';
        var bargainingCliffSummary = bargainingCliffStage === 'compress'
            ? (distinctRetainedCoreLabel
                ? 'Bargaining power starts to fall once ' + shrinkingLabel.toLowerCase() + ' becomes cheap enough to review instead of staff directly. It stabilizes only if ' + distinctRetainedCoreLabel + ' remains hard to standardize.'
                : 'Bargaining power starts to fall once ' + shrinkingLabel.toLowerCase() + ' becomes cheap enough to review instead of staff directly, because the role does not yet show a clearly separate retained core.')
            : (distinctRetainedCoreLabel
                ? 'The next leverage test is delegation, not headcount. If ' + shrinkingLabel.toLowerCase() + ' becomes first-pass AI work, the remaining bargaining power will come from ' + distinctRetainedCoreLabel + '.'
                : 'The next leverage test is delegation, not headcount. The exposed layer has to become reviewable before bargaining power falls materially.');

        var summary;
        if (roleFate.state === 'expanded') {
            summary = 'The first trigger is assistive, not displacement. The seat changes only if AI moves beyond productivity help and starts handling the exposed layer under review.';
        } else if (roleFate.state === 'augmented') {
            summary = distinctRetainedCoreLabel
                ? 'The role is still mostly in the assistive stage. The next real turn only starts if AI moves from helping on ' + shrinkingLabel.toLowerCase() + ' to delegated first-pass work, while ' + distinctRetainedCoreLabel + ' stays human-owned.'
                : 'The role is still mostly in the assistive stage. The next real turn only starts if AI moves from helping on ' + shrinkingLabel.toLowerCase() + ' to delegated first-pass work.';
        } else if (roleFate.state === 'mixed_transition') {
            summary = distinctRetainedCoreLabel
                ? 'The next visible threshold is delegation in ' + shrinkingLabel.toLowerCase() + ', but the organizational outcome still depends on whether ' + distinctRetainedCoreLabel + ' is strong enough to hold the seat together once that execution layer gets cheaper.'
                : 'The next visible threshold is delegation in ' + shrinkingLabel.toLowerCase() + ', but the role still lacks a clearly separate retained core, so the organizational path remains unsettled.';
        } else if (roleFate.state === 'elevated' && distinctRetainedCoreLabel) {
            summary = 'The role starts to turn once ' + shrinkingLabel.toLowerCase() + ' becomes first-pass AI work under review and more of the seat shifts into ' + distinctRetainedCoreLabel + '.';
        } else if (compressionDominant) {
            summary = distinctRetainedCoreLabel
                ? 'This still looks more like compression than full rebundling. Once AI can handle ' + shrinkingLabel.toLowerCase() + ' under review, organizations can cover the workflow with fewer seats and reserve more of the remaining work for ' + distinctRetainedCoreLabel + '.'
                : 'This still looks more like compression than rebundling. Once AI can handle ' + shrinkingLabel.toLowerCase() + ' under review, organizations can cover the same workflow with fewer seats without needing a clearly separate retained tier.';
        } else if (compressionScore >= 0.68) {
            summary = 'The live organizational risk is already in the compression stage. The key question is not whether AI helps here, but whether the exposed layer still justifies today\'s staffing level.';
        } else if (delegationScore >= 0.48) {
            summary = distinctRetainedCoreLabel
                ? 'The next meaningful break is delegation. Once AI can handle ' + shrinkingLabel.toLowerCase() + ' under review, the role starts reorganizing around ' + distinctRetainedCoreLabel + '.'
                : 'The next meaningful break is delegation. Once AI can handle ' + shrinkingLabel.toLowerCase() + ' under review, the seat starts to change, but the model still does not separate a clearly distinct retained core.';
        } else {
            summary = 'The role is mostly in the assistive stage for now. The bigger seat change waits on whether the exposed layer becomes reviewable and cheap enough to delegate.';
        }

        return {
            summary: summary,
            bargaining_cliff_summary: bargainingCliffSummary,
            bargaining_cliff_stage: bargainingCliffStage,
            decisive_trigger_id: decisiveTrigger ? decisiveTrigger.trigger_id : null,
            decisive_trigger_label: decisiveTrigger ? decisiveTrigger.trigger_label : null,
            primary_binding_constraint: timingFrontier.primary_binding_constraint || null,
            primary_binding_constraint_label: timingFrontier.primary_binding_constraint_label || null,
            confidence: decisiveTrigger ? decisiveTrigger.confidence : Number(clamp(average([
                directCoverageRatio,
                accessionConfidence,
                contextConfidence,
                recompositionConfidence
            ]), 0.18, 0.92).toFixed(3)),
            confidence_label: decisiveTrigger ? decisiveTrigger.confidence_label : triggerConfidenceLabel(average([
                directCoverageRatio,
                accessionConfidence,
                contextConfidence,
                recompositionConfidence
            ])),
            confidence_reason: decisiveTrigger ? decisiveTrigger.confidence_reason : 'Mixed structural evidence',
            timing_frontier: timingFrontier,
            triggers: triggers
        };
    }

    function seatEffectLabel(fateState) {
        if (fateState === 'expanded')   return 'Demand is outpacing automation — your seat grows';
        if (fateState === 'augmented')  return 'Your seat stays, with AI handling some execution';
        if (fateState === 'elevated')   return 'Execution work leaves; the senior layer stays yours';
        if (fateState === 'split')      return 'Your seat is splitting — which tier you land in matters';
        if (fateState === 'collapsed')  return 'This standalone seat is weakening';
        if (fateState === 'compressed') return 'Same function survives, but fewer people will cover it';
        return 'The seat shape here is still unsettled';
    }

    function computeSeatChangeMap(options) {
        var retainedClusters = Array.isArray(options.retained_clusters) ? options.retained_clusters.slice() : [];
        var taskAccessionMap = options.task_accession_map || {};
        var publicWorkBundles = options.public_work_bundles || {};
        var roleFate = options.role_fate || {};
        var roleDefiningWork = options.role_defining_work || null;

        var shrinkingBundles = (taskAccessionMap.shrinking_clusters || []).slice(0, 3);
        var growingBundles = (taskAccessionMap.accession_clusters || []).slice(0, 3);
        var shrinkingLookup = {};
        var growingLookup = {};
        shrinkingBundles.forEach(function (row) {
            shrinkingLookup[row.task_cluster_id] = true;
        });
        growingBundles.forEach(function (row) {
            growingLookup[row.task_cluster_id] = true;
        });
        var retainedCandidates = retainedClusters
            .slice()
            .sort(function (left, right) {
                return toNumber(right.retained_share, 0) - toNumber(left.retained_share, 0);
            });
        var distinctRetained = retainedCandidates.filter(function (cluster) {
            return !shrinkingLookup[cluster.task_cluster_id] && !growingLookup[cluster.task_cluster_id];
        });
        var nonShrinkingRetained = retainedCandidates.filter(function (cluster) {
            return !shrinkingLookup[cluster.task_cluster_id];
        });
        var retainedBundles = (distinctRetained.length ? distinctRetained : nonShrinkingRetained)
            .slice()
            .slice(0, 3)
            .map(function (cluster) {
                var publicBundle = publicWorkBundles[cluster.task_cluster_id] || {};
                var label = publicBundle.public_label || cluster.label || slugToLabel(cluster.task_cluster_id);
                return {
                    task_cluster_id: cluster.task_cluster_id,
                    task_cluster_label: cluster.label || slugToLabel(cluster.task_cluster_id),
                    public_label: label,
                    public_summary: publicBundle.public_summary || null,
                    retained_share: Number(clamp(toNumber(cluster.retained_share, 0), 0, 1.25).toFixed(3)),
                    evidence_confidence: Number(clamp(toNumber(cluster.evidence_confidence, 0.45), 0, 1).toFixed(3)),
                    confidence_label: bundleConfidenceLabel(
                        cluster.evidence_confidence,
                        cluster.task_evidence_coverage_ratio,
                        cluster.direct_evidence_task_count
                    ),
                    confidence_reason: bundleConfidenceReason(
                        cluster.source_mix,
                        cluster.direct_evidence_task_count,
                        cluster.task_first_task_count
                    )
                };
            });

        var shrinkingShareEstimate = clamp(sum(shrinkingBundles.map(function (row) {
            return Math.abs(toNumber(row.net_share_delta, 0));
        })), 0, 1);
        var growingShareEstimate = clamp(sum(growingBundles.map(function (row) {
            return Math.max(0, toNumber(row.net_share_delta, 0));
        })), 0, 1);
        var retainedShareEstimate = clamp(toNumber(options.retained_share_estimate, 0), 0, 1);

        var topShrink = shrinkingBundles[0] ? (shrinkingBundles[0].public_label || shrinkingBundles[0].task_cluster_label) : 'the exposed execution layer';
        var topRetained = retainedBundles[0] ? retainedBundles[0].public_label : null;
        var topGrow = growingBundles[0] ? (growingBundles[0].public_label || growingBundles[0].task_cluster_label) : null;
        var summary;
        if (!topRetained) {
            summary = 'The seat thins first around ' + topShrink.toLowerCase() + '. The model does not yet separate a clearly different retained human core from that same bundle, so this still reads more like compression than clean rebundling.';
        } else if (topGrow && topRetained.toLowerCase() === topGrow.toLowerCase()) {
            summary = 'The seat thins first around ' + topShrink.toLowerCase() + ', stays anchored in ' + topRetained.toLowerCase() + ', and that same retained bundle also takes over more of the role as execution work leaves.';
        } else {
            summary = 'The seat thins first around ' + topShrink.toLowerCase() + ', stays anchored in ' + topRetained.toLowerCase() + ', and ' +
                (topGrow
                    ? ('grows toward ' + topGrow.toLowerCase() + ' as execution work leaves.')
                    : 'does not yet show a strong enough accession signal to name the next growing bundle cleanly.');
        }

        return {
            summary: summary,
            net_seat_effect_label: seatEffectLabel(roleFate.state),
            shrinking_share_estimate: Number(shrinkingShareEstimate.toFixed(3)),
            retained_share_estimate: Number(retainedShareEstimate.toFixed(3)),
            growing_share_estimate: Number(growingShareEstimate.toFixed(3)),
            shrinking_bundles: shrinkingBundles,
            retained_bundles: retainedBundles,
            growing_bundles: growingBundles
        };
    }

    function computeTaskAccessionMap(options) {
        var currentBundle = Array.isArray(options.current_bundle) ? options.current_bundle.slice() : [];
        var exposedClusters = Array.isArray(options.exposed_clusters) ? options.exposed_clusters.slice() : [];
        var retainedClusters = Array.isArray(options.retained_clusters) ? options.retained_clusters.slice() : [];
        var elevatedClusters = Array.isArray(options.elevated_clusters) ? options.elevated_clusters.slice() : [];
        var publicWorkBundles = options.public_work_bundles || {};
        var functionMetrics = options.function_metrics || {};
        var demandExpansionModifier = clamp(toNumber(options.demand_expansion_modifier, 0), 0, 1);
        var directCoverageRatio = clamp(toNumber(options.direct_coverage_ratio, 0.35), 0, 1);
        var recompositionConfidence = clamp(toNumber(options.recomposition_confidence, 0.5), 0, 1);
        var topExposedWork = options.top_exposed_work || null;
        var byId = {};
        currentBundle.forEach(function (cluster) {
            byId[cluster.task_cluster_id] = cluster;
        });

        var accessionClusters = retainedClusters
            .map(function (cluster) {
                var clusterId = cluster.task_cluster_id;
                var kind = classifyAccessionKind(clusterId);
                var publicBundle = publicWorkBundles[clusterId] || {};
                var humanAdvantage = clamp(toNumber(HUMAN_ADVANTAGE_CLUSTERS[clusterId], 0.2), 0, 1);
                var demandSensitivity = (kind === 'relationship' || kind === 'integration')
                    ? 1.0
                    : (kind === 'governance' ? 0.85 : 0.70);
                var dependencyDrivers = exposedClusters
                    .filter(function (source) {
                        if (!source || source.task_cluster_id === clusterId) return false;
                        var deps = CLUSTER_DEPENDENCY_MATRIX[source.task_cluster_id];
                        return !!(deps && deps[clusterId]);
                    })
                    .map(function (source) {
                        var depWeight = clamp(toNumber(CLUSTER_DEPENDENCY_MATRIX[source.task_cluster_id][clusterId], 0), 0, 1);
                        return {
                            task_cluster_id: source.task_cluster_id,
                            label: source.label,
                            score: Number((depWeight * clamp(toNumber(source.absorbed_share, 0), 0, 1.25)).toFixed(3))
                        };
                    })
                    .sort(function (left, right) {
                        return right.score - left.score;
                    })
                    .filter(function (row) {
                        return row.score >= 0.03;
                    })
                    .slice(0, 2);
                if (!dependencyDrivers.length && topExposedWork && topExposedWork.task_cluster_id && topExposedWork.task_cluster_id !== clusterId) {
                    dependencyDrivers.push({
                        task_cluster_id: topExposedWork.task_cluster_id,
                        label: topExposedWork.label,
                        score: Number((clamp(toNumber(topExposedWork.share_of_role, 0), 0, 1) * 0.20).toFixed(3))
                    });
                }

                var spilloverGain = clamp(toNumber(cluster.indirect_dependency_pressure, 0), 0, 1) * (0.26 + (humanAdvantage * 0.18));
                var elevationGain = clamp(toNumber(cluster.elevation_boost, 0), 0, 1.25) * 0.90;
                var retainedGain = clamp(toNumber(cluster.retained_share, 0), 0, 1.25) * (0.28 + (humanAdvantage * 0.16));
                var accountabilityGain = clamp(toNumber(functionMetrics.retained_accountability_strength, 0), 0, 1) * (ELEVATION_CLUSTERS[clusterId] ? 0.18 : 0.10);
                var bargainingGain = clamp(toNumber(functionMetrics.retained_bargaining_power, 0), 0, 1) * clamp(toNumber(cluster.graph_bargaining_weight, 0), 0, 1) * 0.14;
                var demandGain = demandExpansionModifier * demandSensitivity * 0.18;
                var directPenalty = clamp(toNumber(cluster.direct_exposure_pressure, 0), 0, 1) * (0.32 + ((1 - humanAdvantage) * 0.22));
                var exposedPenalty = clamp(toNumber(cluster.exposed_share, 0), 0, 1.25) * 0.18;
                var accessionScore = clamp(
                    retainedGain +
                    elevationGain +
                    spilloverGain +
                    accountabilityGain +
                    bargainingGain +
                    demandGain -
                    directPenalty -
                    exposedPenalty,
                    0,
                    1
                );
                var netShareDelta = clamp(
                    (clamp(toNumber(cluster.elevation_boost, 0), 0, 1.25) * 0.95) +
                    (spilloverGain * 0.35) +
                    (demandGain * 0.45) -
                    (clamp(toNumber(cluster.exposed_share, 0), 0, 1.25) * 0.60),
                    -1,
                    1
                );
                return {
                    task_cluster_id: clusterId,
                    task_cluster_label: cluster.label || slugToLabel(clusterId),
                    public_label: publicBundle.public_label || cluster.label || slugToLabel(clusterId),
                    public_summary: publicBundle.public_summary || null,
                    accession_score: Number(accessionScore.toFixed(3)),
                    accession_kind: kind,
                    accession_driver: buildAccessionDriver(cluster, kind, dependencyDrivers),
                    derived_from_exposed_clusters: dependencyDrivers.map(function (row) {
                        return row.task_cluster_id;
                    }),
                    net_share_delta: Number(netShareDelta.toFixed(3)),
                    confidence_label: bundleConfidenceLabel(
                        cluster.evidence_confidence,
                        cluster.task_evidence_coverage_ratio,
                        cluster.direct_evidence_task_count
                    ),
                    confidence_reason: bundleConfidenceReason(
                        cluster.source_mix,
                        cluster.direct_evidence_task_count,
                        cluster.task_first_task_count
                    ),
                    confidence: Number(clamp(average([
                        directCoverageRatio,
                        recompositionConfidence,
                        clamp(toNumber(cluster.evidence_confidence, 0.45), 0, 1)
                    ]), 0.10, 0.92).toFixed(3))
                };
            })
            .filter(function (row) {
                return row.accession_score >= 0.16 && row.net_share_delta > -0.04;
            })
            .sort(function (left, right) {
                if (right.accession_score !== left.accession_score) {
                    return right.accession_score - left.accession_score;
                }
                return right.net_share_delta - left.net_share_delta;
            })
            .slice(0, 4);

        var shrinkingClusters = exposedClusters
            .map(function (cluster) {
                var publicBundle = publicWorkBundles[cluster.task_cluster_id] || {};
                var shrinkScore = clamp(
                    (clamp(toNumber(cluster.exposed_share, 0), 0, 1.25) * 0.52) +
                    (clamp(toNumber(cluster.direct_exposure_pressure, 0), 0, 1) * 0.24) +
                    (clamp(toNumber(cluster.absorption_rate, 0), 0, 1) * 0.14) -
                    (clamp(toNumber(cluster.elevation_boost, 0), 0, 1.25) * 0.20),
                    0,
                    1
                );
                var indirectPressure = clamp(toNumber(cluster.indirect_dependency_pressure, 0), 0, 1);
                var directPressure = clamp(toNumber(cluster.direct_exposure_pressure, 0), 0, 1);
                var primaryPressure = indirectPressure >= 0.12 &&
                    directPressure >= 0.42
                    ? 'mixed'
                    : indirectPressure >= 0.12
                        ? 'spillover'
                        : 'direct';
                var netShareDelta = clamp(
                    -(
                        (clamp(toNumber(cluster.exposed_share, 0), 0, 1.25) * 0.70) -
                        (clamp(toNumber(cluster.elevation_boost, 0), 0, 1.25) * 0.30)
                    ),
                    -1,
                    0.25
                );
                return {
                    task_cluster_id: cluster.task_cluster_id,
                    task_cluster_label: cluster.label || slugToLabel(cluster.task_cluster_id),
                    public_label: publicBundle.public_label || cluster.label || slugToLabel(cluster.task_cluster_id),
                    public_summary: publicBundle.public_summary || null,
                    shrink_score: Number(shrinkScore.toFixed(3)),
                    net_share_delta: Number(netShareDelta.toFixed(3)),
                    primary_pressure: primaryPressure,
                    confidence: Number(clamp(average([
                        directCoverageRatio,
                        recompositionConfidence,
                        clamp(toNumber(cluster.evidence_confidence, 0.45), 0, 1)
                    ]), 0.10, 0.92).toFixed(3)),
                    confidence_label: bundleConfidenceLabel(
                        cluster.evidence_confidence,
                        cluster.task_evidence_coverage_ratio,
                        cluster.direct_evidence_task_count
                    ),
                    confidence_reason: bundleConfidenceReason(
                        cluster.source_mix,
                        cluster.direct_evidence_task_count,
                        cluster.task_first_task_count
                    )
                };
            })
            .sort(function (left, right) {
                return right.shrink_score - left.shrink_score;
            })
            .slice(0, 4);

        var summary = 'The role still lacks a clear accession read.';
        if (shrinkingClusters.length && accessionClusters.length) {
            summary = 'AI pressure pulls share out of ' +
                shrinkingClusters.slice(0, 2).map(function (row) { return (row.public_label || row.task_cluster_label).toLowerCase(); }).join(' and ') +
                '. The likely human growth lands in ' +
                accessionClusters.slice(0, 2).map(function (row) { return (row.public_label || row.task_cluster_label).toLowerCase(); }).join(' and ') +
                ', so the role rebundles toward ' +
                accessionClusters.slice(0, 2).map(function (row) { return kindToLabel(row.accession_kind).toLowerCase(); }).join(' and ') +
                ' work rather than staying a pure execution seat.';
        } else if (shrinkingClusters.length) {
            summary = 'AI pressure mainly thins ' +
                shrinkingClusters.slice(0, 2).map(function (row) { return (row.public_label || row.task_cluster_label).toLowerCase(); }).join(' and ') +
                ', with limited evidence yet about which human bundles grow to replace that work.';
        } else if (accessionClusters.length) {
            summary = 'The strongest growth signal lands in ' +
                accessionClusters.slice(0, 2).map(function (row) { return (row.public_label || row.task_cluster_label).toLowerCase(); }).join(' and ') +
                ', which suggests the role may rebundle around the retained human layer rather than simply lose share.';
        }

        return {
            accession_clusters: accessionClusters,
            shrinking_clusters: shrinkingClusters,
            net_role_rebundle_summary: summary,
            accession_confidence: Number(clamp(average([
                directCoverageRatio,
                recompositionConfidence,
                accessionClusters.length ? average(accessionClusters.map(function (row) { return row.confidence; })) : 0.32
            ]), 0.10, 0.92).toFixed(3))
        };
    }

    // Score-per-fate classifier: each of the 7 fates receives a composite score
    // from weighted signal contributions. The highest score wins. This replaces
    // the earlier order-dependent if/else tree. The same input signals and
    // calibration thresholds are preserved, but expressed as additive/subtractive
    // contributions so the classifier degrades smoothly rather than flipping on
    // single threshold crossings.
    //
    // Each contribution uses a soft gate: clamp((signal - threshold) / ramp, 0, 1)
    // so the score ramps up over a range rather than jumping at the threshold.
    // The ramp width controls how sharp the transition is — smaller = sharper.

    var FATE_SCORE_RAMP_DEFAULT = 0.08;

    function fateGate(value, threshold, ramp) {
        var r = ramp || FATE_SCORE_RAMP_DEFAULT;
        return clamp((value - threshold) / r, 0, 1);
    }

    function fateGateBelow(value, threshold, ramp) {
        var r = ramp || FATE_SCORE_RAMP_DEFAULT;
        return clamp((threshold - value) / r, 0, 1);
    }

    function fateGateBand(value, low, high, ramp) {
        return Math.min(fateGate(value, low, ramp), fateGateBelow(value, high, ramp));
    }

    function classifyRoleFate(metrics) {
        var directExposure = toNumber(metrics.direct_exposure_pressure, 0);
        var indirectDependency = toNumber(metrics.indirect_dependency_pressure, 0);
        var retainedLeverage = toNumber(metrics.retained_leverage_score, 0);
        var residualRoleIntegrity = toNumber(metrics.residual_role_integrity, 0);
        var exposedCoreShare = toNumber(metrics.exposed_core_share, 0);
        var retainedCoreShare = toNumber(metrics.retained_core_share, 0);
        var nextCheckpointRetained = toNumber(metrics.next_checkpoint_retained_share, toNumber(metrics.next_wave_retained, 0));
        var nextCheckpointIntegrity = toNumber(metrics.next_checkpoint_role_integrity, toNumber(metrics.next_wave_integrity, 0));
        var demandExpansionModifier = toNumber(metrics.demand_expansion_modifier, 0);
        var retainedAccountabilityStrength = toNumber(metrics.retained_accountability_strength, 0);
        var retainedBargainingPower = toNumber(metrics.retained_bargaining_power, 0);
        var roleFragmentationRisk = toNumber(metrics.role_fragmentation_risk, 0);
        var roleCompressibility = toNumber(metrics.role_compressibility, 0);
        var delegationLikelihood = toNumber(metrics.delegation_likelihood, 0);
        var headcountDisplacementRisk = toNumber(metrics.headcount_displacement_risk, 0);
        var nextCheckpointState = metrics.next_checkpoint_state || metrics.next_wave_state || '';
        var roleState = metrics.role_state || '';
        var roleTransformationType = metrics.role_transformation_type || '';
        var functionCount = Math.max(0, Math.round(toNumber(metrics.function_count, 0)));
        var functionExposureSpread = toNumber(metrics.function_exposure_spread, 0);
        var functionRetainedStrengthSpread = toNumber(metrics.function_retained_strength_spread, 0);
        var timingCompressionMargin = toNumber(metrics.timing_frontier_compress_margin, 0);
        var timingPrimaryScore = clamp(
            toNumber(
                metrics.timing_frontier_primary_score,
                metrics.timing_frontier_primary_wave === 'current'
                    ? 0.82
                    : (metrics.timing_frontier_primary_wave === 'next' ? 0.58 : 0.28)
            ),
            0,
            1
        );
        var nextCheckpointTransitionSignal = Math.max(
            nextCheckpointState === 'rebalanced' ? 1 : 0,
            fateGate(nextCheckpointRetained, 0.24, 0.08) *
                fateGateBelow(nextCheckpointRetained, 0.76, 0.10) *
                fateGateBelow(nextCheckpointIntegrity, 0.58, 0.10)
        );

        // Derived composite signals (same logic as before, now reused across fates)
        var humanCoreStrength = Math.max(
            fateGate(retainedLeverage, 0.53),
            fateGate(retainedAccountabilityStrength, 0.60),
            fateGate(retainedBargainingPower, 0.50)
        );
        var retainedRoleStrength =
            fateGate(nextCheckpointRetained, 0.57, 0.06) *
            fateGate(residualRoleIntegrity, 0.54, 0.06);
        var compressionTimingStrength =
            fateGate(timingCompressionMargin, 0.20, 0.14) *
            fateGate(directExposure, 0.48, 0.06) *
            fateGate(timingPrimaryScore, 0.52, 0.16);
        // Soft gate on functionCount: full signal at 2+, partial (~0.25) at 1 (the
        // function layer may be thin even when the role genuinely bifurcates). Zero at 0.
        var splitFunctionGate = clamp((functionCount - 0.5) / 2.0, 0, 1);
        var splitStructuralSignal =
            splitFunctionGate *
            Math.max(
                roleTransformationType === 'workflow_fragmentation' ? 1 : 0,
                roleTransformationType === 'delegated_but_retained_function' ? 1 : 0,
                fateGate(roleFragmentationRisk, 0.58, 0.08) *
                    fateGate(roleCompressibility, 0.52, 0.08) *
                    fateGate(delegationLikelihood, 0.52, 0.08)
            ) *
            Math.max(
                fateGate(functionExposureSpread, 0.07, 0.04),
                fateGate(functionRetainedStrengthSpread, 0.14, 0.06) * fateGate(roleFragmentationRisk, 0.58, 0.08),
                fateGate(roleFragmentationRisk, 0.66, 0.08)
            ) *
            fateGate(directExposure, 0.42, 0.06) *
            fateGate(retainedCoreShare, 0.20, 0.06) *
            fateGate(residualRoleIntegrity, 0.38, 0.06);

        // ── Score each fate ──

        // EXPANDED: strong demand expansion with intact, low-risk role
        var expandedScore =
            fateGate(demandExpansionModifier, 0.70, 0.12) * 0.35 +
            fateGate(nextCheckpointRetained, 0.55, 0.10) * 0.15 +
            fateGate(residualRoleIntegrity, 0.50, 0.10) * 0.10 +
            fateGateBelow(headcountDisplacementRisk, 0.35, 0.08) * 0.15 +
            fateGateBand(directExposure, 0.40, 0.62) * 0.10 +
            fateGateBelow(roleFragmentationRisk, 0.42, 0.08) * 0.10 +
            fateGate(demandExpansionModifier, 0.76, 0.10) * 0.05;

        // ELEVATED: execution thins but judgment/accountability core survives
        var elevatedScore =
            humanCoreStrength * 0.25 +
            retainedRoleStrength * 0.18 +
            fateGate(retainedAccountabilityStrength, 0.55, 0.10) * 0.12 +
            fateGateBelow(headcountDisplacementRisk, 0.38, 0.08) * 0.12 +
            fateGateBand(directExposure, 0.36, 0.60) * 0.10 +
            fateGateBelow(roleFragmentationRisk, 0.38, 0.08) * 0.08 +
            (roleState === 'role_becomes_more_senior' ? 0.08 : 0) +
            (roleState === 'routine_tasks_absorbed' ? fateGate(demandExpansionModifier, 0.42, 0.10) * 0.05 : 0) +
            (fateGateBelow(timingPrimaryScore, 0.42, 0.14) * fateGate(retainedAccountabilityStrength, 0.60, 0.10) * 0.04) -
            fateGate(directExposure, 0.58, 0.08) * 0.10 -
            fateGate(roleFragmentationRisk, 0.50, 0.10) * 0.08;

        // AUGMENTED: role stays mostly intact, AI assists
        var augmentedScore =
            retainedRoleStrength * 0.22 +
            fateGateBelow(directExposure, 0.56, 0.08) * 0.15 +
            fateGateBelow(headcountDisplacementRisk, 0.35, 0.08) * 0.15 +
            fateGateBelow(roleFragmentationRisk, 0.42, 0.08) * 0.10 +
            humanCoreStrength * 0.10 +
            (roleState === 'mostly_augmented' ? 0.10 : 0) +
            (roleState === 'routine_tasks_absorbed' ? 0.06 : 0) +
            fateGate(retainedBargainingPower, 0.50, 0.10) * 0.06 +
            fateGate(demandExpansionModifier, 0.40, 0.10) * 0.04 -
            fateGate(directExposure, 0.56, 0.08) * 0.12 -
            compressionTimingStrength * 0.10;

        // SPLIT: role bifurcates into execution and oversight tiers
        var splitScore =
            splitStructuralSignal * 0.40 +
            fateGate(roleFragmentationRisk, 0.55, 0.10) * 0.12 +
            fateGate(headcountDisplacementRisk, 0.34, 0.08) * 0.08 +
            (nextCheckpointTransitionSignal * 0.08) +
            fateGateBelow(nextCheckpointIntegrity, 0.45, 0.10) * 0.06 +
            fateGate(delegationLikelihood, 0.50, 0.10) * 0.06 +
            splitFunctionGate * 0.06 -
            fateGate(demandExpansionModifier, 0.60, 0.10) * 0.08 -
            fateGateBelow(residualRoleIntegrity, 0.38, 0.08) * 0.10;

        // COMPRESSED: same work, fewer people
        var compressedScore =
            fateGate(headcountDisplacementRisk, 0.35, 0.10) * 0.18 +
            fateGate(directExposure, 0.50, 0.12) * 0.16 +
            compressionTimingStrength * 0.14 +
            fateGate(roleCompressibility, 0.45, 0.10) * 0.10 +
            fateGateBelow(nextCheckpointRetained, 0.55, 0.10) * 0.10 +
            fateGateBelow(residualRoleIntegrity, 0.55, 0.10) * 0.08 +
            fateGateBelow(demandExpansionModifier, 0.50, 0.10) * 0.06 +
            (roleState === 'role_narrows_but_remains_viable' ? 0.06 : 0) -
            fateGate(demandExpansionModifier, 0.60, 0.10) * 0.10 -
            humanCoreStrength * 0.08 -
            retainedRoleStrength * 0.06;

        // COLLAPSED: standalone seat weakens substantially
        var collapsedScore =
            fateGate(directExposure, 0.65, 0.10) * 0.22 +
            fateGate(exposedCoreShare, 0.18, 0.08) * 0.15 +
            fateGateBelow(residualRoleIntegrity, 0.40, 0.10) * 0.18 +
            fateGateBelow(nextCheckpointRetained, 0.25, 0.10) * 0.15 +
            fateGateBelow(retainedCoreShare, 0.15, 0.08) * 0.12 +
            fateGate(headcountDisplacementRisk, 0.45, 0.10) * 0.08 -
            fateGate(demandExpansionModifier, 0.40, 0.10) * 0.10 -
            humanCoreStrength * 0.10;

        // MIXED_TRANSITION: conflicting signals
        // Scores high when protective and destructive signals are both present,
        // creating genuine ambiguity. No fixed floor — the score must be earned
        // from actual signal conflict, not from absence of clarity elsewhere.
        var conflictSignal =
            fateGate(demandExpansionModifier, 0.55, 0.12) *
            fateGateBelow(headcountDisplacementRisk, 0.40, 0.08) *
            fateGate(nextCheckpointRetained, 0.65, 0.10) *
            fateGate(directExposure, 0.40, 0.08);
        // Cross-pressure: protective signals coexist with destructive ones
        var crossPressure =
            Math.min(fateGate(directExposure, 0.40, 0.10), fateGate(retainedLeverage, 0.45, 0.10)) * 0.18 +
            Math.min(fateGate(headcountDisplacementRisk, 0.30, 0.10), fateGate(nextCheckpointRetained, 0.50, 0.10)) * 0.14 +
            Math.min(fateGate(demandExpansionModifier, 0.40, 0.10), fateGate(roleCompressibility, 0.40, 0.10)) * 0.10;
        var mixedScore =
            crossPressure +
            conflictSignal * 0.20 +
            fateGateBand(residualRoleIntegrity, 0.35, 0.65) * 0.12 -
            fateGate(demandExpansionModifier, 0.70, 0.10) * 0.08 -
            retainedRoleStrength * 0.06 -
            fateGate(directExposure, 0.65, 0.08) * 0.06;

        // ── Pick the winner ──
        var fateScores = {
            expanded: expandedScore,
            elevated: elevatedScore,
            augmented: augmentedScore,
            split: splitScore,
            compressed: compressedScore,
            collapsed: collapsedScore,
            mixed_transition: mixedScore
        };

        var sortedFates = Object.keys(fateScores).sort(function (a, b) {
            return fateScores[b] - fateScores[a];
        });

        var state = sortedFates[0];
        var topScore = fateScores[state];
        var runnerUpScore = fateScores[sortedFates[1]];

        // Confidence blends three signals:
        // 1. Margin: how far ahead is the winning fate (classifier decisiveness)
        // 2. Signal decisiveness: how far from neutral are the input metrics
        // 3. Evidence quality: recomposition confidence from the evidence layer,
        //    so thin/low-quality evidence lowers confidence even when signals are clear
        var marginConfidence = clamp((topScore - runnerUpScore) / 0.20, 0, 1);
        var signalDecisiveness = average([
            Math.abs(directExposure - 0.5),
            Math.abs(indirectDependency - 0.35),
            Math.abs(retainedLeverage - 0.5),
            Math.abs(residualRoleIntegrity - 0.5),
            Math.abs(exposedCoreShare - 0.18)
        ]) * 1.6;
        var evidenceQuality = clamp(toNumber(metrics.evidence_quality, 0.5), 0, 1);
        var confidence =
            (marginConfidence * 0.40) +
            (signalDecisiveness * 0.30) +
            (evidenceQuality * 0.30);

        return {
            state: state,
            label: ROLE_FATE_LABELS[state],
            confidence: Number(clamp(confidence, 0.18, 0.92).toFixed(3)),
            _scores: fateScores
        };
    }

    function logisticCurve(k, t, midpoint) {
        var rate = clamp(toNumber(k, 0.85), 0.05, 5);
        var years = clamp(toNumber(t, 0), 0, 12);
        var center = clamp(toNumber(midpoint, 4), 0, 12);
        return 1 / (1 + Math.exp(-rate * (years - center)));
    }

    function trajectoryTimingBucket(years) {
        var value = years === null ? null : clamp(toNumber(years, 10), 0, 12);
        if (value === null) {
            return 'range_7_plus_years';
        }
        if (value <= 0.5) {
            return 'already_underway';
        }
        if (value <= 3) {
            return 'range_1_3_years';
        }
        if (value <= 7) {
            return 'range_3_7_years';
        }
        return 'range_7_plus_years';
    }

    function trajectoryStateLabel(state) {
        switch (state) {
            case 'stable': return 'Your role stays structurally necessary as AI pressure rises';
            case 'expanding': return 'Your role expands as demand outpaces automation';
            case 'transforming': return 'Your role transforms rather than collapses';
            case 'compressing': return 'Your role compresses as execution gets cheaper';
            case 'collapsing': return 'This standalone role weakens as AI absorbs the work';
            case 'unsettled': return 'Your role sits in an unsettled transition';
            default: return 'Your role is in transition';
        }
    }

    function shareForClusters(rows, clusterLookup) {
        return clamp(sum((rows || []).filter(function (row) {
            return !!clusterLookup[row.task_cluster_id];
        }).map(function (row) {
            return toNumber(row.share_of_role, 0);
        })), 0, 1);
    }

    function solveTrajectoryThresholdTime(taskRows, threshold, k, options) {
        var low = 0;
        var high = 10;
        var maxAtHigh = computeTrajectoryCompressionAtYear(taskRows, high, options, k);
        var mid;
        var iteration;

        if (maxAtHigh < threshold) {
            return null;
        }

        for (iteration = 0; iteration < 24; iteration += 1) {
            mid = (low + high) / 2;
            if (computeTrajectoryCompressionAtYear(taskRows, mid, options, k) >= threshold) {
                high = mid;
            } else {
                low = mid;
            }
        }

        return Number(high.toFixed(2));
    }

    function computeTrajectoryCompressionAtYear(taskRows, year, options, overrideK) {
        var rows = Array.isArray(taskRows) ? taskRows : [];
        return clamp(sum(rows.map(function (task) {
            return computeTrajectoryTaskContribution(task, year, options, overrideK).contribution;
        })), 0, 1);
    }

    function computeTrajectoryCompressionRateAtYear(taskRows, year, options, overrideK) {
        var lowYear = clamp(toNumber(year, 0) - 0.05, 0, 10);
        var highYear = clamp(toNumber(year, 0) + 0.05, 0, 10);

        if (highYear <= lowYear) {
            return 0;
        }

        return clamp(
            (computeTrajectoryCompressionAtYear(taskRows, highYear, options, overrideK) -
                computeTrajectoryCompressionAtYear(taskRows, lowYear, options, overrideK)) /
                (highYear - lowYear),
            0,
            5
        );
    }

    function computeTrajectoryTaskContribution(task, year, options, overrideK) {
        var workflowCompression = clamp(toNumber(options && options.workflowCompression, 0), 0, 1);
        var adoptionPressure = clamp(toNumber(options && options.effectiveAdoptionPressure, 0.3), 0, 1);
        var workflowDecomposability = clamp(toNumber(options && options.workflowDecomposability, 0.5), 0, 1);
        var clusterFrontierById = options && options.clusterFrontierById ? options.clusterFrontierById : {};
        var baselineK = clamp(toNumber(overrideK, options && options.kBaseline), 0.05, 5);
        var exposureBias = clamp(toNumber(options && options.exposureBias, 0), -1, 1);
        var clusterFrontier = clusterFrontierById[task.task_cluster_id] || null;
        var frontierWave = clusterFrontier && clusterFrontier.frontier_crossing_wave
            ? clusterFrontier.frontier_crossing_wave
            : (task.wave_assignment || 'next');
        var frontierOffset = frontierWave === 'current'
            ? 0
            : frontierWave === 'next'
                ? 1.5
                : 3.5;
        var ease = clamp(1 - toNumber(task.automation_difficulty, 0.5), 0, 1);
        var observability = clamp(toNumber(task.ai_support_observability, 0.3), 0, 1);
        var readiness = clamp(
            (ease * 0.45) +
            (observability * 0.20) +
            (workflowDecomposability * 0.20) +
            (adoptionPressure * 0.15),
            0,
            1
        );
        var midpoint = clamp(7 - (6 * readiness) + frontierOffset, 0, 9);
        var currentCapabilityReadiness = clamp(
            toNumber(clusterFrontier && clusterFrontier.frontier_capability_readiness, adoptionPressure),
            0,
            1
        );
        var currentSupervisionReadiness = clamp(
            toNumber(clusterFrontier && clusterFrontier.frontier_supervision_readiness, observability),
            0,
            1
        );
        var exposure = logisticCurve(baselineK, year, midpoint);
        var orgAbsorption = clamp(
            (clamp(toNumber(clusterFrontier && clusterFrontier.absorption_rate, toNumber(task.absorbed_share, 0)), 0, 1) * 0.50) +
            (workflowCompression * 0.30) +
            (adoptionPressure * 0.20),
            0,
            1
        );
        var directPressure = clamp(toNumber(task.direct_exposure_pressure, 0), 0, 1);
        var spilloverPressure = clamp(toNumber(task.indirect_dependency_pressure, 0), 0, 1);
        var basePressure = clamp(
            (directPressure * 0.62) +
            (spilloverPressure * 0.23) +
            (orgAbsorption * 0.15),
            0,
            1
        );
        var retainedLeverage = clamp(toNumber(task.retained_leverage, 0.5), 0, 1);
        var retainedShare = clamp(toNumber(task.retained_share, Math.min(1, toNumber(task.share_of_role, 0))), 0, 1);
        var accountabilityShield = clamp((retainedLeverage * 0.70) + (retainedShare * 0.30), 0, 1);
        var frontierHeadroom = clamp(1 - (basePressure * 1.10), 0, 1);
        var frontierSusceptibility = clamp(
            (ease * 0.30) +
            (observability * 0.18) +
            (workflowDecomposability * 0.18) +
            (orgAbsorption * 0.12) +
            (frontierHeadroom * 0.14) +
            (adoptionPressure * 0.08) -
            (retainedLeverage * 0.12) -
            (accountabilityShield * 0.08),
            0,
            1
        );
        var frontierUnlockMidpoint = clamp(
            6.7 - (3.4 * frontierSusceptibility) + (frontierOffset * 0.45) - (exposureBias * 1.15),
            0.5,
            9.5
        );
        var frontierUnlockRate = clamp(
            (0.45 + (0.30 * adoptionPressure) + (0.55 * frontierSusceptibility)) * (0.90 + (exposureBias * 0.25)),
            0.05,
            5
        );
        var frontierUnlock = logisticCurve(frontierUnlockRate, year, frontierUnlockMidpoint);
        var frontierCeiling = clamp(
            (0.18 + (0.32 * frontierSusceptibility) + (0.08 * adoptionPressure) + (0.10 * Math.max(0, exposureBias))) * frontierHeadroom,
            0,
            frontierHeadroom
        );
        var effectivePressure = clamp(basePressure + (frontierUnlock * frontierCeiling), 0, 1);
        var occupationUsageAnchor = options && options.currentUsageAnchor !== undefined && options.currentUsageAnchor !== null
            ? clamp(toNumber(options.currentUsageAnchor, 0), 0, 1)
            : null;
        var occupationUsageWeight = clamp(toNumber(options && options.currentUsageWeight, 0), 0, 1);
        var currentRealizationFloor = clamp(
            (directPressure * 0.24) +
            (spilloverPressure * 0.05) +
            (orgAbsorption * 0.18) +
            (observability * 0.12) +
            (currentCapabilityReadiness * 0.16) +
            (currentSupervisionReadiness * 0.07) +
            (adoptionPressure * 0.08) +
            (workflowCompression * 0.06) +
            (ease * 0.04) -
            (accountabilityShield * 0.10) -
            (retainedLeverage * 0.08),
            0,
            0.78
        );
        currentRealizationFloor = Math.max(
            currentRealizationFloor,
            clamp(
                (basePressure * 0.52) +
                (currentCapabilityReadiness * 0.16) +
                (orgAbsorption * 0.14) +
                (observability * 0.08) +
                (adoptionPressure * 0.06) +
                (workflowCompression * 0.04) -
                (accountabilityShield * 0.14) -
                (retainedLeverage * 0.10),
                0,
                0.88
            )
        );
        if (occupationUsageAnchor !== null && occupationUsageWeight > 0) {
            currentRealizationFloor = clamp(
                currentRealizationFloor +
                clamp(
                    occupationUsageAnchor *
                    occupationUsageWeight *
                    clamp(
                        (directPressure * 0.40) +
                        (observability * 0.25) +
                        (orgAbsorption * 0.20) +
                        (ease * 0.10) +
                        (adoptionPressure * 0.05) -
                        (accountabilityShield * 0.18) -
                        (retainedLeverage * 0.08),
                        0,
                        1
                    ),
                    0,
                    0.38
                ),
                0,
                0.88
            );
        }
        currentRealizationFloor = clamp(
            currentRealizationFloor +
            (Math.max(0, exposureBias) * 0.05) -
            (Math.max(0, -exposureBias) * 0.03),
            0,
            0.82
        );
        exposure = Math.max(exposure, currentRealizationFloor);

        return {
            contribution: clamp(toNumber(task.share_of_role, 0), 0, 1) * exposure * effectivePressure,
            base_pressure: Number(basePressure.toFixed(3)),
            effective_pressure: Number(effectivePressure.toFixed(3)),
            frontier_susceptibility: Number(frontierSusceptibility.toFixed(3)),
            frontier_unlock: Number(frontierUnlock.toFixed(3)),
            current_realization_floor: Number(currentRealizationFloor.toFixed(3))
        };
    }

    function normalizedTrajectoryProgress(year, rate, midpoint, horizon) {
        var t = clamp(toNumber(year, 0), 0, horizon);
        var k = clamp(toNumber(rate, 0.8), 0.05, 5);
        var m = clamp(toNumber(midpoint, horizon / 2), 0, horizon);
        var start = logisticCurve(k, 0, m);
        var end = logisticCurve(k, horizon, m);
        var current;

        if (Math.abs(end - start) < 0.000001) {
            return t >= horizon ? 1 : 0;
        }

        current = logisticCurve(k, t, m);
        return clamp((current - start) / (end - start), 0, 1);
    }

    function computeTrajectoryDemandAtYear(demandProfile, year) {
        var current = clamp(toNumber(demandProfile && demandProfile.current, 0), 0, 1);
        var distant = clamp(toNumber(demandProfile && demandProfile.distant, current), 0, 1);
        var horizon = clamp(toNumber(demandProfile && demandProfile.curve_horizon, 10), 1, 20);
        var progress = normalizedTrajectoryProgress(
            year,
            demandProfile && demandProfile.curve_rate,
            demandProfile && demandProfile.curve_midpoint,
            horizon
        );
        return clamp(current + ((distant - current) * progress), 0, 1);
    }

    function computeTrajectoryViabilityScore(compression, demand, structuralScore) {
        return clamp(
            (structuralScore * 0.60) +
            (demand * 0.40) -
            (compression * 0.70) +
            (0.15 * structuralScore * demand),
            0,
            1
        );
    }

    function buildTrajectoryTimeline(taskRows, demandProfile, structuralScore, compressionOptions, profileConfig) {
        var years = [];
        var index;
        var thresholdDefinitions = [
            { key: 'noticeable_change', label: '0.30 noticeable', value: 0.30 },
            { key: 'role_restructuring', label: '0.50 restructure', value: 0.50 },
            { key: 'major_transformation', label: '0.70 major', value: 0.70 }
        ];
        var baselineProfile = profileConfig && profileConfig.baseline ? profileConfig.baseline : {};
        var conservativeProfile = profileConfig && profileConfig.conservative ? profileConfig.conservative : {};
        var aggressiveProfile = profileConfig && profileConfig.aggressive ? profileConfig.aggressive : {};
        var baselineK = clamp(toNumber(baselineProfile.k, compressionOptions && compressionOptions.kBaseline), 0.05, 5);
        var conservativeK = clamp(toNumber(conservativeProfile.k, baselineK), 0.05, 5);
        var aggressiveK = clamp(toNumber(aggressiveProfile.k, baselineK), 0.05, 5);
        var baselinePoints;
        var bandPoints;
        var inflectionPoint;
        var thresholdMarkers;

        for (index = 0; index <= 100; index += 1) {
            years.push(Number((index * 0.1).toFixed(1)));
        }

        baselinePoints = years.map(function (year) {
            var compression = computeTrajectoryCompressionAtYear(taskRows, year, compressionOptions, baselineK);
            var demand = computeTrajectoryDemandAtYear(demandProfile, year);
            var dpDt = computeTrajectoryCompressionRateAtYear(taskRows, year, compressionOptions, baselineK);
            return {
                year: year,
                compression: Number(compression.toFixed(3)),
                transformed_share: Number(compression.toFixed(3)),
                demand: Number(demand.toFixed(3)),
                viability: Number(computeTrajectoryViabilityScore(compression, demand, structuralScore).toFixed(3)),
                dp_dt: Number(dpDt.toFixed(4))
            };
        });

        bandPoints = years.map(function (year) {
            var demand = computeTrajectoryDemandAtYear(demandProfile, year);
            var conservativeCompression = computeTrajectoryCompressionAtYear(taskRows, year, compressionOptions, conservativeK);
            var aggressiveCompression = computeTrajectoryCompressionAtYear(taskRows, year, compressionOptions, aggressiveK);
            var conservativeViability = computeTrajectoryViabilityScore(conservativeCompression, demand, structuralScore);
            var aggressiveViability = computeTrajectoryViabilityScore(aggressiveCompression, demand, structuralScore);
            return {
                year: year,
                conservative_compression: Number(conservativeCompression.toFixed(3)),
                conservative_transformed_share: Number(conservativeCompression.toFixed(3)),
                aggressive_compression: Number(aggressiveCompression.toFixed(3)),
                aggressive_transformed_share: Number(aggressiveCompression.toFixed(3)),
                lower_compression: Number(Math.min(conservativeCompression, aggressiveCompression).toFixed(3)),
                lower_transformed_share: Number(Math.min(conservativeCompression, aggressiveCompression).toFixed(3)),
                upper_compression: Number(Math.max(conservativeCompression, aggressiveCompression).toFixed(3)),
                upper_transformed_share: Number(Math.max(conservativeCompression, aggressiveCompression).toFixed(3)),
                conservative_viability: Number(conservativeViability.toFixed(3)),
                aggressive_viability: Number(aggressiveViability.toFixed(3)),
                lower_viability: Number(Math.min(conservativeViability, aggressiveViability).toFixed(3)),
                upper_viability: Number(Math.max(conservativeViability, aggressiveViability).toFixed(3))
            };
        });

        inflectionPoint = baselinePoints.reduce(function (best, point) {
            if (!best || toNumber(point.dp_dt, 0) > toNumber(best.dp_dt, 0)) {
                return point;
            }
            return best;
        }, null);

        thresholdMarkers = thresholdDefinitions.reduce(function (map, definition) {
            var crossingYear = solveTrajectoryThresholdTime(taskRows, definition.value, baselineK, compressionOptions);
            var markerYear = crossingYear === null ? 10 : crossingYear;
            var markerCompression = computeTrajectoryCompressionAtYear(taskRows, markerYear, compressionOptions, baselineK);
            var markerDemand = computeTrajectoryDemandAtYear(demandProfile, markerYear);
            map[definition.key] = {
                key: definition.key,
                label: definition.label,
                threshold: definition.value,
                year: crossingYear === null ? null : Number(crossingYear.toFixed(2)),
                marker_year: Number(markerYear.toFixed(2)),
                compression: Number(markerCompression.toFixed(3)),
                transformed_share: Number(markerCompression.toFixed(3)),
                demand: Number(markerDemand.toFixed(3)),
                viability: Number(computeTrajectoryViabilityScore(markerCompression, markerDemand, structuralScore).toFixed(3)),
                crossed: crossingYear !== null
            };
            return map;
        }, {});

        return {
            x_max_years: 10,
            y_metric: 'transformed_share',
            scenario_anchors: [
                { key: 'current', label: 'Current', year: 0 },
                { key: 'next', label: 'Next', year: 2 },
                { key: 'distant', label: 'Distant', year: 5 }
            ],
            baseline: {
                label: baselineProfile.label || 'Baseline',
                points: baselinePoints
            },
            band: {
                conservative_label: conservativeProfile.label || 'Conservative',
                aggressive_label: aggressiveProfile.label || 'Aggressive',
                points: bandPoints
            },
            markers: {
                inflection: inflectionPoint ? {
                    year: Number(inflectionPoint.year.toFixed(2)),
                    compression: inflectionPoint.compression,
                    transformed_share: inflectionPoint.transformed_share,
                    demand: inflectionPoint.demand,
                    viability: inflectionPoint.viability,
                    dp_dt: inflectionPoint.dp_dt
                } : null,
                thresholds: thresholdMarkers
            }
        };
    }

    function buildTrajectoryDemandProfile(options) {
        var currentBundle = Array.isArray(options && options.currentBundle) ? options.currentBundle : [];
        var runtimeContext = options && options.runtimeContext ? options.runtimeContext : null;
        var adaptationPrior = options && options.adaptationPrior ? options.adaptationPrior : null;
        var functionContext = options && options.functionContext ? options.functionContext : null;
        var functionMetrics = options && options.functionMetrics ? options.functionMetrics : null;
        var demandFloorSuppression = runtimeContext ? toNumber(runtimeContext.demand_floor_suppression, null) : null;
        var knowledgeShare = adaptationPrior ? parseNoteMetric(adaptationPrior.notes, 'knowledge_share') : null;
        var functionSignals = functionMetrics && functionMetrics.function_category_signals
            ? functionMetrics.function_category_signals
            : { shares: {}, decision_authority: 0.5, coordination_centrality: 0.5 };
        var clientRelationshipShare = shareForClusters(currentBundle, {
            cluster_client_interaction: true,
            cluster_relationship_management: true,
            cluster_coordination: true,
            cluster_oversight_strategy: true
        });
        var internalOverheadShare = shareForClusters(currentBundle, {
            cluster_workflow_admin: true,
            cluster_documentation: true,
            cluster_execution_routine: true
        });
        var baseMarket = clamp(
            (clamp(toNumber(runtimeContext && runtimeContext.demand_expansion_context, 0.35), 0, 1) * 0.24) +
            (clamp(toNumber(runtimeContext && runtimeContext.labor_demand_context, 0.35), 0, 1) * 0.16) +
            (clamp(toNumber(runtimeContext && runtimeContext.labor_tightness_context, 0.35), 0, 1) * 0.12),
            0,
            1
        );
        var adaptation = clamp(
            (clamp(toNumber(adaptationPrior && adaptationPrior.adaptive_capacity_score, 0.5), 0, 1) * 0.14) +
            (clamp(toNumber(adaptationPrior && adaptationPrior.learning_intensity_score, 0.5), 0, 1) * 0.12) +
            (clamp(toNumber(adaptationPrior && adaptationPrior.transferability_score, 0.5), 0, 1) * 0.10),
            0,
            1
        );
        var specialization = clamp(average([
            knowledgeShare,
            functionContext ? toNumber(functionContext.expert_scarcity_signal, null) : null,
            functionContext ? toNumber(functionContext.bargaining_power_context, null) : null
        ]), 0, 1) * 0.12;
        var latentDemand = clamp(average([
            runtimeContext ? toNumber(runtimeContext.demand_expansion_context, null) : null,
            runtimeContext ? toNumber(runtimeContext.labor_demand_context, null) : null,
            runtimeContext ? toNumber(runtimeContext.ai_adoption_context, null) : null,
            functionSignals.shares ? toNumber(functionSignals.shares.revenue, null) : null,
            functionSignals.shares ? toNumber(functionSignals.shares.client, null) : null
        ]), 0, 1);
        var baseHeadroom = clamp(
            1 - average([
                internalOverheadShare,
                functionSignals.shares ? toNumber(functionSignals.shares.internal_overhead, null) : null,
                functionSignals.shares ? toNumber(functionSignals.shares.compliance, null) : null
            ]),
            0,
            1
        );
        var satiationHeadroom = demandFloorSuppression === null
            ? baseHeadroom
            : clamp(baseHeadroom * clamp(demandFloorSuppression, 0, 1), 0, 1);
        var revenueLinkage = clamp(average([
            runtimeContext ? toNumber(runtimeContext.demand_expansion_context, null) : null,
            clientRelationshipShare,
            knowledgeShare,
            functionSignals.shares ? toNumber(functionSignals.shares.revenue, null) : null,
            functionSignals.shares ? toNumber(functionSignals.shares.client, null) : null
        ]), 0, 1);
        var epsilon = clamp(
            (0.40 * clamp(baseMarket + adaptation + specialization, 0, 1)) +
            (0.20 * latentDemand) +
            (0.15 * satiationHeadroom) +
            (0.25 * revenueLinkage),
            0,
            1
        );
        var adoptionRealizationContext = clamp(toNumber(runtimeContext && runtimeContext.adoption_realization_context, 0.30), 0, 1);
        var organizationalAdoptionCeiling = clamp(
            toNumber(options && options.organizationalAdoptionCeiling, adoptionRealizationContext),
            0,
            1
        );
        var demandSuppression = clamp(toNumber(demandFloorSuppression, 0.45), 0, 1);
        epsilon = clamp(
            epsilon +
            ((toNumber(functionSignals.shares && functionSignals.shares.revenue, 0) - 0.35) * 0.12) +
            ((toNumber(functionSignals.shares && functionSignals.shares.client, 0) - 0.30) * 0.08) -
            (toNumber(functionSignals.shares && functionSignals.shares.internal_overhead, 0) * 0.10) -
            (toNumber(functionSignals.shares && functionSignals.shares.compliance, 0) * 0.10),
            0,
            1
        );
        var current = clamp(epsilon * (0.70 + (0.30 * clamp(toNumber(runtimeContext && runtimeContext.ai_adoption_context, 0.25), 0, 1))), 0, 1);
        var next = clamp(epsilon * (0.80 + (0.20 * adoptionRealizationContext)), 0, 1);
        var distant = clamp(epsilon * (0.85 + (0.15 * organizationalAdoptionCeiling)), 0, 1);
        var curveRate = clamp(0.55 + (0.90 * adoptionRealizationContext) + (0.45 * epsilon) - (0.35 * demandSuppression), 0.25, 2.40);
        var curveMidpoint = clamp(3.2 - (1.6 * adoptionRealizationContext) - (0.8 * epsilon) + (0.6 * (1 - organizationalAdoptionCeiling)), 0.6, 5.5);
        var explanation = revenueLinkage >= Math.max(latentDemand, satiationHeadroom)
            ? 'More output still creates value here, so lower execution cost can expand demand.'
            : latentDemand >= Math.max(revenueLinkage, satiationHeadroom)
                ? 'There is real latent demand here, so cheaper execution can pull more work into the role.'
                : toNumber(functionSignals.shares && functionSignals.shares.compliance, 0) >= 0.22
                    ? 'Demand looks capped by governance, compliance, or institutional overhead, so Jevons effects stay weaker here.'
                : satiationHeadroom >= 0.55
                    ? 'Demand is not fully capped, so AI does not automatically translate into lower seat count.'
                    : 'Demand looks relatively capped or overhead-bound, so cheaper execution is less likely to offset compression.';

        return {
            epsilon: Number(epsilon.toFixed(3)),
            current: Number(current.toFixed(3)),
            next: Number(next.toFixed(3)),
            distant: Number(distant.toFixed(3)),
            curve_rate: Number(curveRate.toFixed(3)),
            curve_midpoint: Number(curveMidpoint.toFixed(3)),
            curve_horizon: 10,
            latent_demand: Number(latentDemand.toFixed(3)),
            satiation_headroom: Number(satiationHeadroom.toFixed(3)),
            revenue_linkage: Number(revenueLinkage.toFixed(3)),
            explanation: explanation
        };
    }

    function computeHierarchyPersistenceBonus(options) {
        var seniority = clamp(toNumber(options && options.seniority, 0), 0, 1);
        var retainedFunctionStrength = clamp(toNumber(options && options.retainedFunctionStrength, 0.5), 0, 1);
        var retainedAccountabilityStrength = clamp(toNumber(options && options.retainedAccountabilityStrength, 0.5), 0, 1);
        var couplingProtection = clamp(toNumber(options && options.couplingProtection, 0.5), 0, 1);
        var functionSignals = options && options.functionCategorySignals ? options.functionCategorySignals : null;
        var decisionAuthority = clamp(toNumber(functionSignals && functionSignals.decision_authority, retainedAccountabilityStrength), 0, 1);
        var coordinationCentrality = clamp(toNumber(functionSignals && functionSignals.coordination_centrality, couplingProtection), 0, 1);
        var seniorityActivation = clamp((seniority - 0.25) / 0.75, 0, 1);
        var ownershipStrength = clamp(average([
            retainedFunctionStrength,
            retainedAccountabilityStrength,
            decisionAuthority,
            coordinationCentrality,
            couplingProtection
        ]), 0, 1);
        var score = clamp(seniorityActivation * ownershipStrength, 0, 1);
        return {
            score: Number(score.toFixed(3)),
            bonus: Number((score * 0.08).toFixed(3))
        };
    }

    function buildTrajectoryStructuralNecessity(options) {
        var residualRoleIntegrity = clamp(toNumber(options && options.residualRoleIntegrity, 0.5), 0, 1);
        var retainedFunctionStrength = clamp(toNumber(options && options.retainedFunctionStrength, 0.5), 0, 1);
        var retainedAccountabilityStrength = clamp(toNumber(options && options.retainedAccountabilityStrength, 0.5), 0, 1);
        var retainedBargainingPower = clamp(toNumber(options && options.retainedBargainingPower, 0.5), 0, 1);
        var couplingProtection = clamp(toNumber(options && options.couplingProtection, 0.5), 0, 1);
        var fragmentationInverse = 1 - clamp(toNumber(options && options.roleFragmentationRisk, 0.5), 0, 1);
        var functionSignals = options && options.functionCategorySignals ? options.functionCategorySignals : null;
        var decisionAuthority = clamp(toNumber(functionSignals && functionSignals.decision_authority, retainedAccountabilityStrength), 0, 1);
        var coordinationCentrality = clamp(toNumber(functionSignals && functionSignals.coordination_centrality, couplingProtection), 0, 1);
        var hierarchyPersistence = computeHierarchyPersistenceBonus({
            seniority: options && options.seniority,
            retainedFunctionStrength: retainedFunctionStrength,
            retainedAccountabilityStrength: retainedAccountabilityStrength,
            couplingProtection: couplingProtection,
            functionCategorySignals: functionSignals
        });
        // Weights must sum to 1.00 (audit 2026-03-27: corrected from 1.10)
        var score = clamp(
            (residualRoleIntegrity * 0.20) +
            (retainedFunctionStrength * 0.14) +
            (retainedAccountabilityStrength * 0.14) +
            (retainedBargainingPower * 0.12) +
            (couplingProtection * 0.12) +
            (decisionAuthority * 0.10) +
            (coordinationCentrality * 0.09) +
            (fragmentationInverse * 0.09) +
            hierarchyPersistence.bonus,
            0,
            1
        );
        var explanation = hierarchyPersistence.score >= 0.52
            ? 'Higher-level ownership and coordination make the seat slower to dissolve even when execution work compresses.'
            : decisionAuthority >= 0.62 || retainedAccountabilityStrength >= 0.62 || retainedFunctionStrength >= 0.62
            ? 'The role still owns outcomes, judgment, or sign-off even after execution compresses.'
            : coordinationCentrality >= 0.58 || couplingProtection >= 0.58
                ? 'The role remains necessary because the workflow still depends on human coordination and context.'
                : 'Structural necessity is weaker here, so execution compression can translate more directly into seat loss.';

        return {
            score: Number(score.toFixed(3)),
            explanation: explanation,
            hierarchy_persistence: {
                score: hierarchyPersistence.score,
                bonus: hierarchyPersistence.bonus
            }
        };
    }

    function buildTrajectoryScenarioInterpretation(options) {
        var compression = clamp(toNumber(options && options.compression, 0), 0, 1);
        var demand = clamp(toNumber(options && options.demand, 0), 0, 1);
        var viability = clamp(toNumber(options && options.viability, 0), 0, 1);
        var structuralNecessity = clamp(toNumber(options && options.structuralNecessity, 0.5), 0, 1);

        if (demand - compression >= 0.08 && viability >= 0.58) {
            return 'Demand is keeping up with automation pressure, so the role still expands or holds.';
        }
        if (compression >= 0.50 && structuralNecessity >= 0.60) {
            return 'Execution compresses, but the role survives by shifting into a more retained human core.';
        }
        if (compression > demand + 0.10 && structuralNecessity < 0.40) {
            return 'Compression is outrunning demand while the retained core stays weak.';
        }
        if (compression > demand) {
            return 'Execution pressure is outpacing demand, so the seat starts to compress.';
        }
        return 'Signals are mixed: AI changes the work, but the final seat effect is still contested.';
    }

    function classifyTrajectoryState(metrics) {
        var pCurrent = clamp(toNumber(metrics && metrics.pCurrent, 0), 0, 1);
        var pNext = clamp(toNumber(metrics && metrics.pNext, 0), 0, 1);
        var pDistant = clamp(toNumber(metrics && metrics.pDistant, 0), 0, 1);
        var dCurrent = clamp(toNumber(metrics && metrics.dCurrent, 0), 0, 1);
        var dNext = clamp(toNumber(metrics && metrics.dNext, 0), 0, 1);
        var dDistant = clamp(toNumber(metrics && metrics.dDistant, 0), 0, 1);
        var lCurrent = clamp(toNumber(metrics && metrics.lCurrent, 0), 0, 1);
        var lNext = clamp(toNumber(metrics && metrics.lNext, 0), 0, 1);
        var lDistant = clamp(toNumber(metrics && metrics.lDistant, 0), 0, 1);
        var structural = clamp(toNumber(metrics && metrics.structuralNecessity, 0.5), 0, 1);
        var fragmentation = clamp(toNumber(metrics && metrics.roleFragmentationRisk, 0.5), 0, 1);
        var nextDemandLead = dNext - pNext;
        var distantDemandLead = dDistant - pDistant;
        var viabilityDrop = lCurrent - lDistant;

        if (lDistant < 0.10 && structural < 0.42 && (pDistant - dDistant) >= 0.14) {
            return 'collapsing';
        }
        if (nextDemandLead >= 0.24 && dNext >= 0.46 && Math.min(lCurrent, lNext) >= 0.58 && structural >= 0.58) {
            return 'expanding';
        }
        if (pDistant >= 0.22 && structural >= 0.62 && lNext >= 0.48 && (nextDemandLead < 0.24 || viabilityDrop >= 0.10)) {
            return 'transforming';
        }
        if (lNext < 0.42 && lDistant < 0.30 && structural < 0.60 && ((pDistant - dDistant) >= -0.02 || viabilityDrop >= 0.18)) {
            return 'compressing';
        }
        if (
            (pNext <= 0.08 && structural >= 0.54 && lNext >= 0.50 && lDistant >= 0.35) ||
            (Math.abs(nextDemandLead) < 0.12 && structural >= 0.62 && lNext >= 0.55 && distantDemandLead >= -0.05)
        ) {
            return 'stable';
        }
        if (fragmentation >= 0.60 && pCurrent < dCurrent && pNext > dNext) {
            return 'unsettled';
        }
        return 'unsettled';
    }

    function deriveTrajectoryRoleShape(options) {
        var state = options && options.state ? options.state : 'unsettled';
        var taskAccessionMap = options && options.taskAccessionMap ? options.taskAccessionMap : null;
        var functionExposureSpread = clamp(toNumber(options && options.functionExposureSpread, 0), 0, 1);
        var fragmentation = clamp(toNumber(options && options.roleFragmentationRisk, 0.5), 0, 1);
        var functionSignals = options && options.functionCategorySignals ? options.functionCategorySignals : null;
        var accessionClusters = taskAccessionMap && Array.isArray(taskAccessionMap.accession_clusters)
            ? taskAccessionMap.accession_clusters
            : [];
        var oversightShare = shareForClusters(accessionClusters, {
            cluster_qa_review: true,
            cluster_decision_support: true,
            cluster_oversight_strategy: true
        });
        var coordinationShare = shareForClusters(accessionClusters, {
            cluster_coordination: true,
            cluster_relationship_management: true,
            cluster_client_interaction: true
        });

        if (state === 'collapsing') {
            return 'dissolved_role';
        }
        if (state === 'compressing') {
            return 'compressed_seat';
        }
        if (state === 'transforming' && fragmentation >= 0.60 && functionExposureSpread >= 0.07) {
            return 'split_role';
        }
        // Audit 2026-03-27: added explicit parentheses to fix && / || precedence.
        // The function-signal check is an alternative path, not gated on the share
        // comparison, which is the intended behavior (function layer can override
        // cluster shares when it has strong signal).
        if (
            (oversightShare >= coordinationShare && oversightShare >= 0.18) ||
            (toNumber(functionSignals && functionSignals.shares && functionSignals.shares.oversight, 0) >= 0.30)
        ) {
            return 'oversight_heavy';
        }
        if (
            (coordinationShare > oversightShare && coordinationShare >= 0.18) ||
            (toNumber(functionSignals && functionSignals.shares && functionSignals.shares.coordination, 0) >= 0.30)
        ) {
            return 'coordination_heavy';
        }
        return 'mixed_shape';
    }

    function buildTrajectoryFunctionContributions(options) {
        var perFunctionBreakdown = Array.isArray(options && options.perFunctionBreakdown)
            ? options.perFunctionBreakdown
            : [];
        var functionCategorySignals = options && options.functionCategorySignals ? options.functionCategorySignals : null;
        var taskRows = Array.isArray(options && options.taskRows) ? options.taskRows : [];
        var rows = perFunctionBreakdown
            .filter(function (row) {
                return row && row.function_id;
            })
            .slice(0, 10)
            .map(function (row) {
                return {
                    function_id: row.function_id,
                    function_category: row.function_category || null,
                    label: row.role_summary || row.function_statement || slugToLabel(row.function_id),
                    function_weight: clamp(toNumber(row.function_weight, 0), 0, 1),
                    retained_strength: clamp(toNumber(row.retained_strength, 0), 0, 1),
                    supported_share: clamp(toNumber(row.supported_share, 0), 0, 1),
                    exposed_share: clamp(toNumber(row.exposed_share, 0), 0, 1),
                    exposure_pressure: clamp(toNumber(row.exposure_pressure, 0), 0, 1),
                    tags: classifyFunctionCategorySignals(row.function_category)
                };
            });
        var taskCandidates = taskRows
            .filter(function (row) {
                return row && row.task_id && row.task_statement;
            })
            .map(function (row) {
                return {
                    task_id: row.task_id,
                    label: row.task_statement,
                    share_of_role: clamp(toNumber(row.share_of_role, 0), 0, 1),
                    retained_share: clamp(toNumber(row.retained_share, 0), 0, 1),
                    retained_leverage: clamp(toNumber(row.retained_leverage, 0), 0, 1),
                    direct_exposure_pressure: clamp(toNumber(row.direct_exposure_pressure, 0), 0, 1),
                    is_role_critical: !!row.is_role_critical
                };
            })
            .sort(function (left, right) {
                return right.share_of_role - left.share_of_role;
            });

        function scoreItem(row, scoreBuilder, summaryBuilder) {
            return {
                function_id: row.function_id,
                label: row.label,
                function_category: row.function_category || null,
                score: Number(clamp(scoreBuilder(row), 0, 1).toFixed(3)),
                summary: summaryBuilder(row)
            };
        }

        function selectDistinctItems(config) {
            var usedIds = config && config.usedIds ? config.usedIds : {};
            var take = Math.max(1, toNumber(config && config.take, 2));
            var scoreBuilder = config && config.scoreBuilder ? config.scoreBuilder : function () { return 0; };
            var summaryBuilder = config && config.summaryBuilder ? config.summaryBuilder : function () { return ''; };
            var primaryFilter = config && config.primaryFilter ? config.primaryFilter : function () { return true; };
            var fallbackFilter = config && config.fallbackFilter ? config.fallbackFilter : function () { return true; };
            var minimumScore = toNumber(config && config.minimumScore, 0.05);
            var selected = [];

            function appendFrom(filterFn) {
                rows
                    .filter(function (row) {
                        return !usedIds[row.function_id] && filterFn(row);
                    })
                    .map(function (row) {
                        return scoreItem(row, scoreBuilder, summaryBuilder);
                    })
                    .filter(function (row) {
                        return row.score >= minimumScore;
                    })
                    .sort(function (left, right) {
                        return right.score - left.score;
                    })
                    .forEach(function (row) {
                        if (selected.length >= take || usedIds[row.function_id]) {
                            return;
                        }
                        usedIds[row.function_id] = true;
                        selected.push(row);
                    });
            }

            appendFrom(primaryFilter);
            if (selected.length < take) {
                appendFrom(fallbackFilter);
            }

            return selected;
        }

        var shares = functionCategorySignals && functionCategorySignals.shares ? functionCategorySignals.shares : {};
        var preferredRetainedTag = 'oversight';
        var preferredRetainedScore = clamp(toNumber(shares.oversight, 0), 0, 1);
        ['coordination', 'revenue', 'client'].forEach(function (tag) {
            var tagScore = clamp(toNumber(shares[tag], 0), 0, 1);
            if (tagScore > preferredRetainedScore) {
                preferredRetainedTag = tag;
                preferredRetainedScore = tagScore;
            }
        });

        var usedIds = {};
        var usedTaskIds = {};

        function appendTaskFallback(target, config) {
            var take = Math.max(0, toNumber(config && config.take, 0));
            var filterFn = config && config.filter ? config.filter : function () { return true; };
            var scoreBuilder = config && config.scoreBuilder ? config.scoreBuilder : function () { return 0; };
            var summary = config && config.summary ? config.summary : '';
            if (!take) {
                return target;
            }

            taskCandidates
                .filter(function (row) {
                    return !usedTaskIds[row.task_id] && filterFn(row);
                })
                .map(function (row) {
                    return {
                        task_id: row.task_id,
                        function_id: 'task:' + row.task_id,
                        label: row.label,
                        function_category: 'task_fallback',
                        score: Number(clamp(scoreBuilder(row), 0, 1).toFixed(3)),
                        summary: summary
                    };
                })
                .filter(function (row) {
                    return row.score >= 0.04;
                })
                .sort(function (left, right) {
                    return right.score - left.score;
                })
                .forEach(function (row) {
                    if (target.length >= take || usedTaskIds[row.task_id]) {
                        return;
                    }
                    usedTaskIds[row.task_id] = true;
                    target.push(row);
                });

            return target;
        }

        var holdingCore = selectDistinctItems({
            usedIds: usedIds,
            take: 2,
            primaryFilter: function (row) {
                return row.tags.coordination || row.tags.oversight || row.retained_strength >= 0.56;
            },
            fallbackFilter: function (row) {
                return row.retained_strength >= 0.48 || row.supported_share >= 0.08;
            },
            scoreBuilder: function (row) {
                return row.function_weight * clamp(
                    (row.retained_strength * 0.46) +
                    (row.supported_share * 0.20) +
                    ((row.tags.coordination ? 1 : 0) * 0.18) +
                    ((row.tags.oversight ? 1 : 0) * 0.16),
                    0,
                    1
                );
            },
            summaryBuilder: function (row) {
                return 'Still concentrates coordination, judgment, or sign-off.';
            }
        });
        appendTaskFallback(holdingCore, {
            take: 2,
            filter: function (row) {
                return row.is_role_critical || row.retained_leverage >= 0.58 || row.retained_share >= 0.05;
            },
            scoreBuilder: function (row) {
                return row.share_of_role * clamp(
                    (row.retained_leverage * 0.42) +
                    (row.retained_share * 0.28) +
                    ((row.is_role_critical ? 1 : 0) * 0.18) +
                    ((1 - row.direct_exposure_pressure) * 0.12),
                    0,
                    1
                );
            },
            summary: 'Judgment, coordination, or sign-off still concentrates here.'
        });
        var thinning = selectDistinctItems({
            usedIds: usedIds,
            take: 2,
            primaryFilter: function (row) {
                return row.tags.internal_overhead ||
                    ((!row.tags.coordination && !row.tags.oversight) &&
                        (row.exposure_pressure >= 0.44 || row.exposed_share >= 0.08));
            },
            fallbackFilter: function (row) {
                return row.exposure_pressure >= 0.38 || row.exposed_share >= 0.06;
            },
            scoreBuilder: function (row) {
                return row.function_weight * clamp(
                    (row.exposure_pressure * 0.42) +
                    (row.exposed_share * 0.26) +
                    ((1 - row.retained_strength) * 0.20) +
                    ((row.tags.internal_overhead ? 1 : 0) * 0.12),
                    0,
                    1
                );
            },
            summaryBuilder: function (row) {
                return 'Easier to standardize and compress first.';
            }
        });
        appendTaskFallback(thinning, {
            take: 2,
            filter: function (row) {
                return row.direct_exposure_pressure >= 0.52 && row.retained_leverage <= 0.56;
            },
            scoreBuilder: function (row) {
                return row.share_of_role * clamp(
                    (row.direct_exposure_pressure * 0.50) +
                    ((1 - row.retained_leverage) * 0.26) +
                    ((1 - row.retained_share) * 0.14) +
                    0.10,
                    0,
                    1
                );
            },
            summary: 'Execution-heavy work with weaker leverage is more likely to thin first.'
        });
        var retainedRole = selectDistinctItems({
            usedIds: usedIds,
            take: 2,
            primaryFilter: function (row) {
                return row.retained_strength >= 0.50 && row.supported_share >= 0.04;
            },
            fallbackFilter: function (row) {
                return row.retained_strength >= 0.44;
            },
            scoreBuilder: function (row) {
                return row.function_weight * clamp(
                    (row.retained_strength * 0.42) +
                    ((1 - row.exposure_pressure) * 0.20) +
                    (row.supported_share * 0.16) +
                    ((row.tags[preferredRetainedTag] ? 1 : 0) * 0.14) +
                    ((row.tags.oversight ? 1 : 0) * 0.08),
                    0,
                    1
                );
            },
            summaryBuilder: function (row) {
                return 'Most likely to remain inside the narrower human-owned seat.';
            }
        });
        appendTaskFallback(retainedRole, {
            take: 2,
            filter: function (row) {
                return (row.retained_share >= 0.03 && row.retained_leverage >= 0.46) || row.is_role_critical;
            },
            scoreBuilder: function (row) {
                return row.share_of_role * clamp(
                    (row.retained_share * 0.30) +
                    (row.retained_leverage * 0.34) +
                    ((1 - row.direct_exposure_pressure) * 0.18) +
                    ((row.is_role_critical ? 1 : 0) * 0.18),
                    0,
                    1
                );
            },
            summary: 'Likely to remain inside the narrower human-owned core.'
        });

        return {
            holding_core: holdingCore,
            thinning: thinning,
            retained_role: retainedRole
        };
    }

    function buildTrajectoryDrivers(options) {
        var demandExplanation = options && options.demandExplanation ? options.demandExplanation : '';
        var structuralExplanation = options && options.structuralExplanation ? options.structuralExplanation : '';
        var drivers = [
            {
                key: 'execution_compression',
                label: 'Execution compression',
                strength: Number(clamp(toNumber(options && options.pNext, 0), 0, 1).toFixed(3)),
                summary: 'Execution work absorbs faster when direct task pressure, spillover, and organizational uptake line up.'
            },
            {
                key: 'demand_response',
                label: 'Demand response',
                strength: Number(clamp(toNumber(options && options.dNext, 0), 0, 1).toFixed(3)),
                summary: demandExplanation || 'Demand can offset automation when cheaper output creates more consumption or revenue.'
            },
            {
                key: 'structural_necessity',
                label: 'Structural necessity',
                strength: Number(clamp(toNumber(options && options.structuralNecessity, 0), 0, 1).toFixed(3)),
                summary: structuralExplanation || 'The role survives when judgment, coordination, or accountability still need a human owner.'
            }
        ];

        return drivers.sort(function (left, right) {
            return right.strength - left.strength;
        }).slice(0, 3);
    }

    function mapTrajectoryToLegacyFate(trajectoryState, roleShape, fallbackConfidence) {
        var state = 'mixed_transition';
        if (trajectoryState === 'stable') {
            state = 'augmented';
        } else if (trajectoryState === 'expanding') {
            state = 'expanded';
        } else if (trajectoryState === 'transforming') {
            state = roleShape === 'split_role' ? 'split' : 'elevated';
        } else if (trajectoryState === 'compressing') {
            state = 'compressed';
        } else if (trajectoryState === 'collapsing') {
            state = 'collapsed';
        }

        return {
            state: state,
            label: ROLE_FATE_LABELS[state],
            confidence: Number(clamp(toNumber(fallbackConfidence, 0.55), 0.18, 0.92).toFixed(3))
        };
    }

    function effectiveWeightedCount(weights) {
        var raw = (weights || []).map(function (weight) {
            return Math.max(0, toNumber(weight, 0));
        });
        var total = sum(raw);
        var normalized = total > 0
            ? raw.map(function (weight) {
                return weight / total;
            })
            : [];
        var denominator = sum(normalized.map(function (weight) {
            return weight * weight;
        }));
        if (denominator <= 0) {
            return 0;
        }
        return 1 / denominator;
    }

    function stateTrajectoryLabel(state) {
        if (state === 'retained') return 'The role still holds as a broad human-owned seat';
        if (state === 'complemented') return 'AI helps this role by thinning lower-value execution first';
        if (state === 'demand_expanding') return 'AI may expand this role because output gets cheaper and demand can grow';
        if (state === 'rebalanced') return 'This role survives by rebuilding around a narrower retained core';
        if (state === 'compressed') return 'This role likely survives, but with fewer seats doing more';
        if (state === 'bottleneck_fragile') return 'One automatable bottleneck could destabilize this role quickly';
        if (state === 'displaced') return 'This role weakens once automation clears the core bottleneck';
        return 'This role is still structurally unsettled';
    }

    function stateTrajectoryStateShortLabel(state) {
        if (state === 'retained') return 'Retained';
        if (state === 'complemented') return 'Complemented';
        if (state === 'demand_expanding') return 'Demand-expanding';
        if (state === 'rebalanced') return 'Rebalanced';
        if (state === 'compressed') return 'Compressed';
        if (state === 'bottleneck_fragile') return 'Bottleneck-fragile';
        if (state === 'displaced') return 'Displaced';
        return 'Indeterminate';
    }

    function stateTrajectoryModeLabel(score) {
        var numeric = clamp(toNumber(score, 0), 0, 1);
        if (numeric >= 0.68) {
            return 'High';
        }
        if (numeric >= 0.40) {
            return 'Moderate';
        }
        return 'Low';
    }

    function buildStateTrajectoryInputs(options) {
        var taskRows = Array.isArray(options && options.taskRows) ? options.taskRows : [];
        var currentBundle = Array.isArray(options && options.currentBundle) ? options.currentBundle : [];
        var perFunctionBreakdown = options && options.functionMetrics && Array.isArray(options.functionMetrics.per_function_breakdown)
            ? options.functionMetrics.per_function_breakdown
            : [];
        var controls = options && options.stateModelControls ? options.stateModelControls : {};
        return {
            taskRows: taskRows,
            currentBundle: currentBundle,
            perFunctionBreakdown: perFunctionBreakdown,
            taskGraphSummary: options && options.taskGraphSummary ? options.taskGraphSummary : null,
            functionMetrics: options && options.functionMetrics ? options.functionMetrics : null,
            functionCategorySignals: options && options.functionCategorySignals ? options.functionCategorySignals : null,
            trajectory: options && options.trajectory ? options.trajectory : null,
            effectiveAdoptionPressure: clamp(toNumber(options && options.effectiveAdoptionPressure, 0.3), 0, 1),
            workflowCompression: clamp(toNumber(options && options.workflowCompression, 0), 0, 1),
            organizationalConversion: clamp(toNumber(options && options.organizationalConversion, 0), 0, 1),
            substitutionPotential: clamp(toNumber(options && options.substitutionPotential, 0), 0, 1),
            substitutionGap: clamp(toNumber(options && options.substitutionGap, 0), 0, 1),
            demandExpansionModifier: clamp(toNumber(options && options.demandExpansionModifier, 0), 0, 1),
            economicPressureContext: clamp(toNumber(options && options.economicPressureContext, 0.35), 0, 1),
            organizationalAdoptionCeiling: clamp(toNumber(options && options.organizationalAdoptionCeiling, 0.4), 0, 1),
            laborDemandContext: clamp(toNumber(options && options.laborDemandContext, 0.35), 0, 1),
            laborTightnessContext: clamp(toNumber(options && options.laborTightnessContext, 0.35), 0, 1),
            medianWageUsd: toNumber(options && options.medianWageUsd, null),
            seniority: clamp(toNumber(options && options.seniority, 0), 0, 1),
            topExposedWork: options && options.topExposedWork ? options.topExposedWork : null,
            roleDefiningWork: options && options.roleDefiningWork ? options.roleDefiningWork : null,
            controls: {
                demandBias: clamp(toNumber(controls.demandBias, 0), -1, 1),
                investmentBias: clamp(toNumber(controls.investmentBias, 0), -1, 1),
                adoptionBias: clamp(toNumber(controls.adoptionBias, 0), -1, 1),
                exposureBias: clamp(toNumber(controls.exposureBias, 0), -1, 1),
                stayingBias: clamp(toNumber(controls.stayingBias, 0), -1, 1)
            }
        };
    }

    function buildStateDimensionality(inputs) {
        var taskRows = inputs.taskRows || [];
        var currentBundle = inputs.currentBundle || [];
        var perFunctionBreakdown = inputs.perFunctionBreakdown || [];
        var taskBreadth = effectiveWeightedCount(taskRows.map(function (row) {
            return clamp(toNumber(row.share_of_role, 0), 0, 1);
        }));
        var clusterBreadth = effectiveWeightedCount(currentBundle.map(function (row) {
            return clamp(toNumber(row.share_of_role, 0), 0, 1);
        }));
        var functionBreadth = effectiveWeightedCount(perFunctionBreakdown.map(function (row) {
            return clamp(toNumber(row.function_weight, 0), 0, 1);
        }));
        var retainedTaskBreadth = effectiveWeightedCount(taskRows.map(function (row) {
            return clamp(
                clamp(toNumber(row.share_of_role, 0), 0, 1) *
                clamp(toNumber(row.retained_leverage, 0), 0, 1),
                0,
                1
            );
        }));
        var topTaskShare = Math.max.apply(null, [0].concat(taskRows.map(function (row) {
            return clamp(toNumber(row.share_of_role, 0), 0, 1);
        })));
        var topClusterShare = Math.max.apply(null, [0].concat(currentBundle.map(function (row) {
            return clamp(toNumber(row.share_of_role, 0), 0, 1);
        })));
        var taskBreadthScore = clamp((taskBreadth - 1) / 5, 0, 1);
        var clusterBreadthScore = clamp((clusterBreadth - 1) / 3, 0, 1);
        var functionBreadthScore = clamp((functionBreadth - 1) / 2.5, 0, 1);
        var retainedBreadthScore = clamp((retainedTaskBreadth - 1) / 4, 0, 1);
        var concentrationPenalty = clamp(((topTaskShare - 0.22) / 0.30), 0, 1) * 0.18 +
            clamp(((topClusterShare - 0.34) / 0.30), 0, 1) * 0.12;
        var score = clamp(
            (taskBreadthScore * 0.24) +
            (clusterBreadthScore * 0.26) +
            (functionBreadthScore * 0.24) +
            (retainedBreadthScore * 0.26) -
            concentrationPenalty,
            0,
            1
        );
        var explanation = score >= 0.64
            ? 'The role still depends on several complementary task and function anchors, so one automated task is less likely to erase the seat.'
            : score <= 0.36
                ? 'A small number of tasks or functions dominate the role, so clearing one bottleneck matters much more here.'
                : 'The role has some breadth, but a meaningful share of value still sits in a fairly concentrated core.';

        return {
            score: Number(score.toFixed(3)),
            task_effective_count: Number(taskBreadth.toFixed(2)),
            cluster_effective_count: Number(clusterBreadth.toFixed(2)),
            function_effective_count: Number(functionBreadth.toFixed(2)),
            retained_effective_count: Number(retainedTaskBreadth.toFixed(2)),
            top_task_share: Number(topTaskShare.toFixed(3)),
            top_cluster_share: Number(topClusterShare.toFixed(3)),
            explanation: explanation
        };
    }

    function buildStateBottleneckRisk(inputs, dimensionality) {
        var taskRows = (inputs.taskRows || []).slice();
        var roleDefiningWork = inputs.roleDefiningWork || null;
        var scoredTasks = taskRows.map(function (row) {
            var significance = clamp(
                (clamp(toNumber(row.share_of_role, 0), 0, 1) * 0.50) +
                (clamp(toNumber(row.retained_leverage, 0), 0, 1) * 0.28) +
                ((row.is_role_critical ? 1 : 0) * 0.14) +
                (clamp(toNumber(row.retained_share, 0), 0, 1) * 0.08),
                0,
                1
            );
            var exposure = clamp(
                (clamp(toNumber(row.direct_exposure_pressure, 0), 0, 1) * 0.76) +
                (clamp(toNumber(row.indirect_dependency_pressure, 0), 0, 1) * 0.24),
                0,
                1
            );
            return {
                label: row.task_statement || row.task_id || 'Core task',
                significance: significance,
                exposure: exposure
            };
        }).sort(function (left, right) {
            return right.significance - left.significance;
        });
        var topCore = scoredTasks[0] || null;
        var secondCore = scoredTasks[1] || null;
        var topTwoCoreShare = clamp(
            (topCore ? topCore.significance : 0) + (secondCore ? secondCore.significance : 0),
            0,
            1
        );
        var roleDefiningPressure = roleDefiningWork
            ? clamp(1 - toNumber(roleDefiningWork.automation_difficulty, 0.5), 0, 1)
            : 0;
        var score = clamp(
            ((1 - clamp(toNumber(dimensionality && dimensionality.score, 0.5), 0, 1)) * 0.34) +
            (topTwoCoreShare * 0.26) +
            ((topCore ? topCore.exposure : 0) * 0.24) +
            (roleDefiningPressure * 0.16),
            0,
            1
        );
        var explanation = score >= 0.68
            ? 'A small number of tasks now carry too much of the retained role, so automating one bottleneck could destabilize the seat quickly.'
            : score <= 0.34
                ? 'The retained role is spread across enough work that no single exposed bottleneck clearly threatens the whole seat.'
                : 'There is a visible bottleneck in the retained core, but it is not yet strong enough to make the whole role hinge on one task.';

        return {
            score: Number(score.toFixed(3)),
            top_core_label: topCore ? topCore.label : null,
            top_core_exposure: Number(clamp(toNumber(topCore && topCore.exposure, 0), 0, 1).toFixed(3)),
            top_two_core_share: Number(topTwoCoreShare.toFixed(3)),
            explanation: explanation
        };
    }

    function buildStateFocusReallocation(inputs, dimensionality, bottleneckRisk) {
        var trajectory = inputs.trajectory || null;
        var functionMetrics = inputs.functionMetrics || null;
        var nextCompression = clamp(toNumber(trajectory && trajectory.scenarios && trajectory.scenarios.next && trajectory.scenarios.next.compression, 0), 0, 1);
        var retainedFunctionStrength = clamp(toNumber(functionMetrics && functionMetrics.retained_function_strength, 0.5), 0, 1);
        var retainedAccountability = clamp(toNumber(functionMetrics && functionMetrics.retained_accountability_strength, 0.5), 0, 1);
        var routineShare = shareForClusters(inputs.currentBundle, {
            cluster_workflow_admin: true,
            cluster_documentation: true,
            cluster_execution_routine: true,
            cluster_drafting: true
        });
        // Positive weights sum to 1.00 (audit 2026-03-27: corrected from 1.04)
        var score = clamp(
            (routineShare * 0.32) +
            (nextCompression * 0.18) +
            (retainedFunctionStrength * 0.20) +
            (retainedAccountability * 0.16) +
            (clamp(toNumber(dimensionality && dimensionality.score, 0.5), 0, 1) * 0.14) -
            (clamp(toNumber(bottleneckRisk && bottleneckRisk.score, 0.5), 0, 1) * 0.18),
            0,
            1
        );
        var explanation = score >= 0.60
            ? 'AI is mostly stripping out lower-value execution first, which can let the human role concentrate on judgment, coordination, and exceptions.'
            : score <= 0.34
                ? 'There is not much evidence yet that automation frees enough time to make the remaining human work more valuable.'
                : 'Some execution work can peel away first, but the role does not yet show a strong focus-on-the-core benefit.';

        return {
            score: Number(score.toFixed(3)),
            routine_share: Number(routineShare.toFixed(3)),
            explanation: explanation
        };
    }

    function buildStateDemandOffset(inputs, trajectory) {
        var controls = inputs.controls || {};
        var baseScore = clamp(toNumber(trajectory && trajectory.demand_response && trajectory.demand_response.epsilon, inputs.demandExpansionModifier), 0, 1);
        var adjustedScore = clamp(baseScore + (controls.demandBias * 0.16), 0, 1);
        var explanation = adjustedScore >= 0.64
            ? 'Cheaper execution can plausibly expand output enough to offset at least part of the compression.'
            : adjustedScore <= 0.34
                ? 'Demand looks too capped or overhead-bound to offset much of the automation pressure.'
                : 'Demand can offset some of the pressure here, but not enough to assume headcount stays flat.';
        return {
            score: Number(adjustedScore.toFixed(3)),
            base_score: Number(baseScore.toFixed(3)),
            mode: stateTrajectoryModeLabel(adjustedScore),
            explanation: explanation
        };
    }

    function buildStateFirmIncentive(inputs, dimensionality, bottleneckRisk) {
        var controls = inputs.controls || {};
        var compressibility = clamp(toNumber(inputs.functionMetrics && inputs.functionMetrics.role_compressibility, 0.5), 0, 1);
        var headcountRisk = clamp(toNumber(inputs.functionMetrics && inputs.functionMetrics.headcount_displacement_risk, 0.5), 0, 1);
        var wagePressure = inputs.medianWageUsd === null || inputs.medianWageUsd === undefined
            ? 0.45
            : clamp((Math.log(Math.max(inputs.medianWageUsd, 1)) - Math.log(40000)) / (Math.log(160000) - Math.log(40000)), 0, 1);
        // Base weights sum to 1.00 (audit 2026-03-28: corrected from 1.06).
        // investmentBias is an additive slider term, not part of the base sum.
        var score = clamp(
            (clamp(toNumber(bottleneckRisk && bottleneckRisk.score, 0.5), 0, 1) * 0.28) +
            ((1 - clamp(toNumber(dimensionality && dimensionality.score, 0.5), 0, 1)) * 0.16) +
            (inputs.effectiveAdoptionPressure * 0.14) +
            (inputs.economicPressureContext * 0.10) +
            (inputs.organizationalConversion * 0.08) +
            (inputs.workflowCompression * 0.08) +
            (compressibility * 0.06) +
            (headcountRisk * 0.06) +
            (wagePressure * 0.04) +
            (controls.investmentBias * 0.18),
            0,
            1
        );
        var explanation = score >= 0.64
            ? 'If firms can clear the remaining bottleneck here, the payoff from finishing automation looks strong enough to speed investment.'
            : score <= 0.34
                ? 'Even if AI can help, firms still have weaker reason to spend aggressively to automate the whole seat.'
                : 'Firm incentive is real but still conditional on better tooling, integration, or a clearer cost payoff.';
        return {
            score: Number(score.toFixed(3)),
            mode: stateTrajectoryModeLabel(score),
            explanation: explanation
        };
    }

    function computeStateTransitionPressure(point, structuralScore, demandOffset, bottleneckRisk, firmIncentive, focusReallocation) {
        var compression = clamp(toNumber(point && (point.transformed_share || point.compression), 0), 0, 1);
        var demand = clamp(toNumber(point && point.demand, 0), 0, 1);
        var structural = clamp(toNumber(structuralScore, 0.5), 0, 1);
        return clamp(
            (compression * 0.38) +
            (clamp(toNumber(bottleneckRisk && bottleneckRisk.score, 0.5), 0, 1) * 0.22) +
            (clamp(toNumber(firmIncentive && firmIncentive.score, 0.5), 0, 1) * 0.18) -
            (clamp(toNumber(demandOffset && demandOffset.score, demand), 0, 1) * 0.14) -
            (clamp(toNumber(focusReallocation && focusReallocation.score, 0.5), 0, 1) * 0.08) -
            (structural * 0.08),
            0,
            1
        );
    }

    function computeStateStructuralSupportAtPoint(point, baseStructuralScore, dimensionalityScore, dynamicBottleneckRisk, focusReallocationScore, adjustedDemand) {
        var compression = clamp(toNumber(point && (point.transformed_share || point.compression), 0), 0, 1);
        var structural = clamp(toNumber(baseStructuralScore, 0.5), 0, 1);
        var dimensionality = clamp(toNumber(dimensionalityScore, 0.5), 0, 1);
        var bottleneck = clamp(toNumber(dynamicBottleneckRisk, 0.5), 0, 1);
        var focus = clamp(toNumber(focusReallocationScore, 0.5), 0, 1);
        var demand = clamp(toNumber(adjustedDemand, 0.5), 0, 1);

        return clamp(
            structural -
            (compression * (0.20 + (bottleneck * 0.24))) +
            (focus * 0.10) +
            (demand * 0.05) +
            (dimensionality * 0.03),
            0,
            1
        );
    }

    function computeStateRoleIntegrityPoint(point, options) {
        var compression = clamp(toNumber(point && (point.transformed_share || point.compression), 0), 0, 1);
        var year = Number(toNumber(point && point.year, 0).toFixed(1));
        var dimensionalityScore = clamp(toNumber(options && options.dimensionalityScore, 0.5), 0, 1);
        var baseStructuralScore = clamp(toNumber(options && options.structuralScore, 0.5), 0, 1);
        var baseBottleneckRisk = clamp(toNumber(options && options.bottleneckRisk, 0.5), 0, 1);
        var focusReallocationScore = clamp(toNumber(options && options.focusReallocationScore, 0.5), 0, 1);
        var baseDemandOffset = clamp(toNumber(options && options.baseDemandOffset, 0.5), 0, 1);
        var demandBiasDelta = clamp(toNumber(options && options.demandBiasDelta, 0), -1, 1);
        var baseFirmIncentive = clamp(toNumber(options && options.firmIncentive, 0.5), 0, 1);
        var hierarchyPersistenceScore = clamp(toNumber(options && options.hierarchyPersistenceScore, 0), 0, 1);
        var adoptionBias = clamp(toNumber(options && options.adoptionBias, 0), -1, 1);
        var stayingBias = clamp(toNumber(options && options.stayingBias, 0), -1, 1);
        var adoptionRamp = clamp(year / 10, 0, 1);
        var baselineDemand = clamp(toNumber(point && point.demand, 0), 0, 1);
        var adjustedDemand = clamp(baselineDemand + (demandBiasDelta * 0.80), 0, 1);
        var adjustedCompression = clamp(
            compression +
            (adoptionBias * adoptionRamp * 0.18) -
            (stayingBias * Math.max(0, adoptionRamp - 0.15) * 0.06),
            0,
            1
        );
        // Audit 2026-03-27: cap compression multiplier at 1.0 so additive
        // terms (dimensionality, focus reallocation) remain meaningful under
        // high compression instead of being drowned out by base saturation.
        var dynamicBottleneckRisk = clamp(
            (baseBottleneckRisk * Math.min(1.0, 0.48 + (0.92 * adjustedCompression))) +
            ((1 - dimensionalityScore) * 0.12) +
            (Math.max(0, adjustedCompression - adjustedDemand) * 0.16) -
            (focusReallocationScore * 0.12) +
            (adoptionBias * adoptionRamp * 0.08) -
            (stayingBias * 0.08),
            0,
            1
        );
        var dynamicFirmIncentive = clamp(
            (baseFirmIncentive * (0.42 + (0.88 * adjustedCompression))) +
            (dynamicBottleneckRisk * 0.16) -
            (adjustedDemand * 0.10) +
            (hierarchyPersistenceScore * -0.04) +
            (adoptionBias * 0.10) -
            (stayingBias * 0.06),
            0,
            1
        );
        var structuralSupport = computeStateStructuralSupportAtPoint(
            { transformed_share: adjustedCompression },
            baseStructuralScore,
            dimensionalityScore,
            dynamicBottleneckRisk,
            focusReallocationScore,
            adjustedDemand
        );
        structuralSupport = clamp(
            structuralSupport +
            (hierarchyPersistenceScore * (0.05 + (adoptionRamp * 0.05))) +
            (stayingBias * 0.18) -
            (adoptionBias * adoptionRamp * 0.04),
            0,
            1
        );
        var transitionPressure = computeStateTransitionPressure(
            { transformed_share: adjustedCompression, demand: adjustedDemand },
            structuralSupport,
            { score: adjustedDemand },
            { score: dynamicBottleneckRisk },
            { score: dynamicFirmIncentive },
            { score: focusReallocationScore }
        );
        transitionPressure = clamp(
            transitionPressure +
            (adoptionBias * 0.10) -
            (hierarchyPersistenceScore * (0.04 + (adjustedCompression * 0.04))) -
            (stayingBias * 0.12),
            0,
            1
        );
        // Audit 2026-03-27: rebalanced so positive weights sum to 1.00 at
        // best case (was 0.92) and compression asymmetry is reduced from 4.9x
        // to ~3x. A fully intact role can now reach 1.0 without stayingBias.
        var roleIntegrity = clamp(
            (structuralSupport * 0.46) +
            (dimensionalityScore * 0.16) +
            (focusReallocationScore * 0.13) +
            (adjustedDemand * 0.10) +
            (baseDemandOffset * 0.04) +
            ((1 - adjustedCompression) * 0.11) -
            (adjustedCompression * 0.30) -
            (dynamicBottleneckRisk * 0.12) -
            (dynamicFirmIncentive * 0.08) +
            (hierarchyPersistenceScore * 0.08) +
            (stayingBias * 0.08),
            0,
            1
        );
        var state = classifyStateTrajectoryCheckpoint({
            compression: adjustedCompression,
            structural: structuralSupport,
            dimensionality: dimensionalityScore,
            bottleneckRisk: dynamicBottleneckRisk,
            focusReallocation: focusReallocationScore,
            demandOffset: adjustedDemand,
            firmIncentive: dynamicFirmIncentive,
            roleIntegrity: roleIntegrity
        });

        return {
            year: year,
            role_integrity: Number(roleIntegrity.toFixed(3)),
            state: state,
            state_label: stateTrajectoryStateShortLabel(state),
            transformed_share: Number(adjustedCompression.toFixed(3)),
            demand_offset: Number(adjustedDemand.toFixed(3)),
            structural_support: Number(structuralSupport.toFixed(3)),
            bottleneck_risk: Number(dynamicBottleneckRisk.toFixed(3)),
            firm_incentive: Number(dynamicFirmIncentive.toFixed(3)),
            transition_pressure: Number(transitionPressure.toFixed(3))
        };
    }

    function compressStateRuns(points) {
        var runs = [];

        (points || []).forEach(function (point) {
            var lastRun = runs.length ? runs[runs.length - 1] : null;
            if (lastRun && lastRun.state === point.state) {
                lastRun.points.push(point);
                lastRun.end_year = point.year;
                return;
            }
            runs.push({
                state: point.state,
                points: [point],
                start_year: point.year,
                end_year: point.year
            });
        });

        return runs.map(function (run) {
            var firstPoint = run.points[0];
            var lastPoint = run.points[run.points.length - 1];
            var midpoint = run.points[Math.floor(run.points.length / 2)] || firstPoint;
            return {
                state: run.state,
                state_label: stateTrajectoryStateShortLabel(run.state),
                start_year: Number(toNumber(run.start_year, 0).toFixed(1)),
                end_year: Number(toNumber(run.end_year, run.start_year).toFixed(1)),
                duration_years: Number(Math.max(0.1, toNumber(run.end_year, 0) - toNumber(run.start_year, 0)).toFixed(1)),
                marker_year: Number(toNumber(midpoint && midpoint.year, run.start_year).toFixed(1)),
                start_role_integrity: Number(toNumber(firstPoint && firstPoint.role_integrity, 0).toFixed(3)),
                end_role_integrity: Number(toNumber(lastPoint && lastPoint.role_integrity, 0).toFixed(3))
            };
        });
    }

    function smoothCompressedStateRuns(runs) {
        var normalized = Array.isArray(runs) ? runs.map(function (run) { return Object.assign({}, run); }) : [];
        var merged = true;

        while (merged) {
            var index;
            merged = false;
            for (index = 0; index < normalized.length; index += 1) {
                var run = normalized[index];
                var prev = index > 0 ? normalized[index - 1] : null;
                var next = index < normalized.length - 1 ? normalized[index + 1] : null;
                if (!run || run.duration_years >= 0.6) {
                    continue;
                }
                if (prev && next && prev.state === next.state) {
                    prev.end_year = next.end_year;
                    prev.duration_years = Number((prev.end_year - prev.start_year).toFixed(1));
                    prev.marker_year = Number((((prev.start_year + prev.end_year) / 2)).toFixed(1));
                    prev.end_role_integrity = next.end_role_integrity;
                    normalized.splice(index, 2);
                    merged = true;
                    break;
                }
                if (prev && (!next || prev.duration_years >= next.duration_years)) {
                    prev.end_year = run.end_year;
                    prev.duration_years = Number((prev.end_year - prev.start_year).toFixed(1));
                    prev.marker_year = Number((((prev.start_year + prev.end_year) / 2)).toFixed(1));
                    prev.end_role_integrity = run.end_role_integrity;
                    normalized.splice(index, 1);
                    merged = true;
                    break;
                }
                if (next) {
                    next.start_year = run.start_year;
                    next.duration_years = Number((next.end_year - next.start_year).toFixed(1));
                    next.marker_year = Number((((next.start_year + next.end_year) / 2)).toFixed(1));
                    next.start_role_integrity = run.start_role_integrity;
                    normalized.splice(index, 1);
                    merged = true;
                    break;
                }
            }
        }

        return normalized;
    }

    function buildStateTrajectoryTimeline(trajectory, structuralScore, dimensionality, bottleneckRisk, focusReallocation, demandOffset, firmIncentive, hierarchyPersistence, controls) {
        var baselineSource = trajectory && trajectory.timeline && trajectory.timeline.baseline && Array.isArray(trajectory.timeline.baseline.points)
            ? trajectory.timeline.baseline.points
            : [];
        var bandSource = trajectory && trajectory.timeline && trajectory.timeline.band && Array.isArray(trajectory.timeline.band.points)
            ? trajectory.timeline.band.points
            : [];
        var options = {
            structuralScore: structuralScore,
            dimensionalityScore: dimensionality && dimensionality.score,
            bottleneckRisk: bottleneckRisk && bottleneckRisk.score,
            focusReallocationScore: focusReallocation && focusReallocation.score,
            baseDemandOffset: demandOffset && demandOffset.score,
            demandBiasDelta: clamp(toNumber(demandOffset && demandOffset.score, 0) - toNumber(demandOffset && demandOffset.base_score, 0), -1, 1),
            firmIncentive: firmIncentive && firmIncentive.score,
            hierarchyPersistenceScore: hierarchyPersistence && hierarchyPersistence.score,
            adoptionBias: controls && controls.adoptionBias,
            stayingBias: controls && controls.stayingBias
        };
        var baselinePoints = baselineSource.map(function (point) {
            return computeStateRoleIntegrityPoint(point, options);
        });
        var baselineDemandByYear = baselineSource.reduce(function (map, point) {
            map[String(Number(toNumber(point && point.year, 0).toFixed(1)))] = clamp(toNumber(point && point.demand, 0), 0, 1);
            return map;
        }, {});
        var bandPoints = bandSource.map(function (point) {
            var year = Number(toNumber(point && point.year, 0).toFixed(1));
            var demand = baselineDemandByYear[String(year)] !== undefined ? baselineDemandByYear[String(year)] : 0;
            var lowerMetrics = computeStateRoleIntegrityPoint({
                year: year,
                transformed_share: point && (point.lower_transformed_share || point.lower_compression),
                demand: demand
            }, options);
            var upperMetrics = computeStateRoleIntegrityPoint({
                year: year,
                transformed_share: point && (point.upper_transformed_share || point.upper_compression),
                demand: demand
            }, options);
            return {
                year: year,
                lower_role_integrity: Number(Math.min(lowerMetrics.role_integrity, upperMetrics.role_integrity).toFixed(3)),
                upper_role_integrity: Number(Math.max(lowerMetrics.role_integrity, upperMetrics.role_integrity).toFixed(3)),
                lower_transition_pressure: Number(Math.min(lowerMetrics.transition_pressure, upperMetrics.transition_pressure).toFixed(3)),
                upper_transition_pressure: Number(Math.max(lowerMetrics.transition_pressure, upperMetrics.transition_pressure).toFixed(3))
            };
        });
        var runs = smoothCompressedStateRuns(compressStateRuns(baselinePoints));
        var largestShift = baselinePoints.reduce(function (best, point, index) {
            var previous = index > 0 ? baselinePoints[index - 1] : null;
            var slope = previous ? (toNumber(point.role_integrity, 0) - toNumber(previous.role_integrity, 0)) / Math.max(0.1, toNumber(point.year, 0) - toNumber(previous.year, 0)) : 0;
            if (!best || slope < best.slope) {
                return {
                    point: point,
                    slope: slope
                };
            }
            return best;
        }, null);
        var stateTransitions = runs.slice(1).filter(function (run) {
            return run.state !== 'indeterminate';
        }).map(function (run) {
            return {
                year: run.start_year,
                state: run.state,
                state_label: run.state_label,
                role_integrity: run.start_role_integrity
            };
        });

        return {
            x_max_years: 10,
            y_metric: 'role_integrity',
            baseline: {
                label: 'Baseline',
                points: baselinePoints
            },
            band: {
                conservative_label: trajectory && trajectory.timeline && trajectory.timeline.band ? trajectory.timeline.band.conservative_label : 'Conservative',
                aggressive_label: trajectory && trajectory.timeline && trajectory.timeline.band ? trajectory.timeline.band.aggressive_label : 'Aggressive',
                points: bandPoints
            },
            state_runs: runs,
            markers: {
                largest_shift: largestShift ? {
                    year: Number(toNumber(largestShift.point && largestShift.point.year, 0).toFixed(2)),
                    role_integrity: Number(toNumber(largestShift.point && largestShift.point.role_integrity, 0).toFixed(3)),
                    slope: Number(toNumber(largestShift.slope, 0).toFixed(4)),
                    state: largestShift.point ? largestShift.point.state : null,
                    state_label: largestShift.point ? largestShift.point.state_label : null
                } : null,
                transitions: stateTransitions,
                floor: baselinePoints.reduce(function (best, point) {
                    if (!best || toNumber(point.role_integrity, 1) < toNumber(best.role_integrity, 1)) {
                        return point;
                    }
                    return best;
                }, null)
            }
        };
    }

    function classifyStateTrajectoryCheckpoint(metrics) {
        var compression = clamp(toNumber(metrics && metrics.compression, 0), 0, 1);
        var structural = clamp(toNumber(metrics && metrics.structural, 0.5), 0, 1);
        var dimensionality = clamp(toNumber(metrics && metrics.dimensionality, 0.5), 0, 1);
        var bottleneckRisk = clamp(toNumber(metrics && metrics.bottleneckRisk, 0.5), 0, 1);
        var focusReallocation = clamp(toNumber(metrics && metrics.focusReallocation, 0.5), 0, 1);
        var demandOffset = clamp(toNumber(metrics && metrics.demandOffset, 0.5), 0, 1);
        var firmIncentive = clamp(toNumber(metrics && metrics.firmIncentive, 0.5), 0, 1);
        var roleIntegrity = clamp(toNumber(metrics && metrics.roleIntegrity, structural), 0, 1);

        if (roleIntegrity >= 0.50 && compression < 0.12 && structural >= 0.62 && dimensionality >= 0.62 && bottleneckRisk < 0.46 && firmIncentive < 0.58) {
            return 'retained';
        }
        if (compression >= 0.52 && roleIntegrity < 0.18 && structural < 0.38 && demandOffset < 0.22 && firmIncentive >= 0.52 && (bottleneckRisk >= 0.56 || dimensionality <= 0.46)) {
            return 'displaced';
        }
        if (bottleneckRisk >= 0.56 && firmIncentive >= 0.50 && roleIntegrity < 0.34 && compression >= 0.22 && dimensionality <= 0.58) {
            return 'bottleneck_fragile';
        }
        if (demandOffset - compression >= 0.12 && roleIntegrity >= 0.46 && focusReallocation >= 0.40 && structural >= 0.56) {
            return 'demand_expanding';
        }
        if (
            focusReallocation >= 0.34 &&
            roleIntegrity >= 0.36 &&
            structural >= 0.60 &&
            dimensionality >= 0.56 &&
            bottleneckRisk < 0.50 &&
            compression >= 0.08 &&
            compression <= 0.44 &&
            demandOffset >= compression - 0.06
        ) {
            return 'complemented';
        }
        if (
            (compression >= 0.44 && roleIntegrity < 0.40) ||
            (compression > demandOffset + 0.10 && roleIntegrity < 0.46 && (structural < 0.66 || focusReallocation < 0.46))
        ) {
            return 'compressed';
        }
        if (compression >= 0.24 && compression <= 0.58 && roleIntegrity >= 0.28 && roleIntegrity < 0.48 && structural >= 0.52 && focusReallocation >= 0.32 && dimensionality >= 0.46) {
            return 'rebalanced';
        }
        if (roleIntegrity >= 0.38 && structural >= 0.60 && dimensionality >= 0.58 && bottleneckRisk < 0.46) {
            return compression < 0.18
                ? 'retained'
                : (focusReallocation >= 0.38 && demandOffset >= compression - 0.02 ? 'complemented' : (compression >= 0.40 ? 'compressed' : 'rebalanced'));
        }
        if (roleIntegrity >= 0.26 && structural >= 0.52 && dimensionality >= 0.50 && compression < 0.50) {
            return 'rebalanced';
        }
        if (compression >= 0.34 && roleIntegrity < 0.34) {
            return 'compressed';
        }
        return 'indeterminate';
    }

    function buildStateTransitionConditions(options) {
        var dimensionality = options && options.dimensionality ? options.dimensionality : null;
        var bottleneckRisk = options && options.bottleneckRisk ? options.bottleneckRisk : null;
        var focusReallocation = options && options.focusReallocation ? options.focusReallocation : null;
        var demandOffset = options && options.demandOffset ? options.demandOffset : null;
        var firmIncentive = options && options.firmIncentive ? options.firmIncentive : null;
        var rows = [];

        rows.push({
            key: 'dimensionality',
            score: clamp(toNumber(dimensionality && dimensionality.score, 0), 0, 1),
            label: 'Role breadth',
            summary: dimensionality && dimensionality.explanation ? dimensionality.explanation : 'The more complementary anchors remain, the harder it is to erase the seat.'
        });
        rows.push({
            key: 'bottleneck',
            score: clamp(toNumber(bottleneckRisk && bottleneckRisk.score, 0), 0, 1),
            label: 'Core bottleneck',
            summary: bottleneckRisk && bottleneckRisk.explanation ? bottleneckRisk.explanation : 'If one exposed bottleneck dominates the role, the seat gets much more fragile.'
        });
        rows.push({
            key: 'focus_reallocation',
            score: clamp(toNumber(focusReallocation && focusReallocation.score, 0), 0, 1),
            label: 'Retained-core lift',
            summary: focusReallocation && focusReallocation.explanation ? focusReallocation.explanation : 'Some roles get stronger when AI removes lower-value execution first.'
        });
        rows.push({
            key: 'demand_offset',
            score: clamp(toNumber(demandOffset && demandOffset.score, 0), 0, 1),
            label: 'Demand offset',
            summary: demandOffset && demandOffset.explanation ? demandOffset.explanation : 'Demand only offsets automation when cheaper output creates enough more work.'
        });
        rows.push({
            key: 'firm_incentive',
            score: clamp(toNumber(firmIncentive && firmIncentive.score, 0), 0, 1),
            label: 'Automation incentive',
            summary: firmIncentive && firmIncentive.explanation ? firmIncentive.explanation : 'Firms automate faster when clearing the next bottleneck collapses the seat.'
        });

        return rows.sort(function (left, right) {
            return right.score - left.score;
        }).slice(0, 3);
    }

    function buildStateTippingPoints(stateTimeline, checkpoints, context) {
        var points = stateTimeline && stateTimeline.baseline && Array.isArray(stateTimeline.baseline.points)
            ? stateTimeline.baseline.points
            : [];
        var transitions = stateTimeline && stateTimeline.markers && Array.isArray(stateTimeline.markers.transitions)
            ? stateTimeline.markers.transitions
            : [];
        var seenKeys = {};
        var tippingPoints = [];

        function pushPoint(key, label, sourcePoint, severity, summary) {
            if (!sourcePoint || seenKeys[key]) {
                return;
            }
            seenKeys[key] = true;
            tippingPoints.push({
                key: key,
                label: label,
                year: Number(toNumber(sourcePoint.year, 0).toFixed(2)),
                severity: Number(clamp(toNumber(severity, 0.5), 0, 1).toFixed(3)),
                state: sourcePoint.state || null,
                state_label: sourcePoint.state_label || null,
                summary: summary || label
            });
        }

        if (transitions.length) {
            pushPoint(
                'first_structural_shift',
                'First structural shift',
                transitions[0],
                checkpoints && checkpoints.next ? checkpoints.next.transition_pressure : 0.4,
                'The role first stops reading like today\'s structure here.'
            );
        }

        pushPoint(
            'retained_reorganization',
            'Role reorganizes around the retained core',
            points.filter(function (point) {
                return point.year >= 0.5 &&
                    (point.state === 'rebalanced' || point.state === 'complemented' || point.state === 'demand_expanding') &&
                    point.transformed_share >= 0.22 &&
                    point.role_integrity >= 0.34;
            })[0],
            context && context.focusReallocation ? context.focusReallocation.score : 0.45,
            'Execution is thinning enough that the surviving human core starts to define the role.'
        );

        pushPoint(
            'compression_overtakes_offset',
            'Compression starts outpacing the offset',
            points.filter(function (point) {
                return point.year >= 0.5 &&
                    point.transformed_share > point.demand_offset + 0.10 &&
                    point.transition_pressure >= 0.38;
            })[0],
            context && context.demandOffset ? 1 - context.demandOffset.score : 0.5,
            'Automation pressure stops being offset cleanly by demand or retained-core lift.'
        );

        pushPoint(
            'bottleneck_cliff',
            'A core bottleneck starts to clear',
            points.filter(function (point) {
                return point.year >= 0.75 &&
                    point.bottleneck_risk >= 0.62 &&
                    point.firm_incentive >= 0.50 &&
                    point.transition_pressure >= 0.42;
            })[0],
            context && context.bottleneckRisk ? context.bottleneckRisk.score : 0.6,
            'One exposed bottleneck begins to matter enough that the whole seat gets more fragile.'
        );

        pushPoint(
            'intactness_break',
            'Today\'s job is no longer mostly intact',
            points.filter(function (point) {
                return point.year >= 1 &&
                    point.role_integrity < 0.48 &&
                    (point.transformed_share >= 0.16 || point.transition_pressure >= 0.22);
            })[0],
            0.55,
            'The role now reads as more changed than intact.'
        );

        pushPoint(
            'displacement_plausible',
            'Displacement becomes plausible',
            points.filter(function (point) {
                return point.year >= 0.5 && (point.state === 'bottleneck_fragile' ||
                    point.state === 'displaced' ||
                    (point.role_integrity < 0.34 && point.bottleneck_risk >= 0.58 && point.firm_incentive >= 0.52));
            })[0],
            0.72,
            'The seat can now plausibly collapse rather than simply rebundle or compress.'
        );

        return tippingPoints.sort(function (left, right) {
            if (left.year !== right.year) {
                return left.year - right.year;
            }
            return right.severity - left.severity;
        });
    }

    function buildStateCurveFamily(options) {
        var likelyNextState = options && options.likelyNextState ? options.likelyNextState : 'indeterminate';
        var longRunState = options && options.longRunState ? options.longRunState : likelyNextState;
        var checkpoints = options && options.checkpoints ? options.checkpoints : {};
        var tippingPoints = Array.isArray(options && options.tippingPoints) ? options.tippingPoints : [];
        var focusReallocation = options && options.focusReallocation ? clamp(toNumber(options.focusReallocation.score, 0.5), 0, 1) : 0.5;
        var demandOffset = options && options.demandOffset ? clamp(toNumber(options.demandOffset.score, 0.5), 0, 1) : 0.5;
        var bottleneckRisk = options && options.bottleneckRisk ? clamp(toNumber(options.bottleneckRisk.score, 0.5), 0, 1) : 0.5;
        var hierarchyPersistence = options && options.hierarchyPersistence ? clamp(toNumber(options.hierarchyPersistence.score, 0), 0, 1) : 0;
        var currentIntegrity = clamp(toNumber(checkpoints.current && checkpoints.current.role_integrity, 0.5), 0, 1);
        var nextCompression = clamp(toNumber(checkpoints.next && checkpoints.next.transformed_share, 0), 0, 1);
        var nextIntegrity = clamp(toNumber(checkpoints.next && checkpoints.next.role_integrity, 0.5), 0, 1);
        var distantIntegrity = clamp(toNumber(checkpoints.distant && checkpoints.distant.role_integrity, nextIntegrity), 0, 1);
        var nextDemandOffset = clamp(toNumber(checkpoints.next && checkpoints.next.demand_offset, demandOffset), 0, 1);
        var bottleneckCliffYear = tippingPoints.filter(function (point) { return point.key === 'bottleneck_cliff'; })[0];
        var displacementYear = tippingPoints.filter(function (point) { return point.key === 'displacement_plausible'; })[0];
        var intactnessBreak = tippingPoints.filter(function (point) { return point.key === 'intactness_break'; })[0];
        var lateBreakYear = bottleneckCliffYear
            ? bottleneckCliffYear.year
            : (displacementYear
                ? displacementYear.year
                : (intactnessBreak ? intactnessBreak.year : null));
        var key;
        var label;
        var summary;

        if (
            longRunState === 'demand_expanding' ||
            (likelyNextState === 'demand_expanding' && nextDemandOffset >= Math.max(0.42, nextCompression - 0.02) && nextIntegrity >= 0.54) ||
            (demandOffset >= 0.66 && focusReallocation >= 0.34 && currentIntegrity >= 0.60 && nextCompression <= 0.20 && longRunState !== 'displaced' && longRunState !== 'bottleneck_fragile')
        ) {
            key = 'demand_expansion';
            label = 'Demand expansion';
            summary = 'AI changes the work, but the role increasingly benefits through expanded output or span rather than shrinking seats.';
        } else if (longRunState === 'complemented' && demandOffset >= 0.58) {
            key = 'complement_then_hold';
            label = 'Complement then hold';
            summary = 'The role shifts early into an AI-assisted form, then stabilizes around a retained human core.';
        } else if ((longRunState === 'rebalanced' || likelyNextState === 'rebalanced') && focusReallocation >= 0.42) {
            key = 'rebundle_then_hold';
            label = 'Rebundle then hold';
            summary = 'The role changes shape earlier than it loses viability, then settles into a narrower retained core.';
        } else if (
            lateBreakYear !== null &&
            lateBreakYear >= 5.2 &&
            currentIntegrity >= 0.52 &&
            nextIntegrity >= 0.50 &&
            nextCompression < 0.22 &&
            (
                longRunState === 'displaced' ||
                longRunState === 'bottleneck_fragile' ||
                (longRunState === 'compressed' && distantIntegrity >= 0.42 && demandOffset >= 0.28 && bottleneckRisk >= 0.34)
            )
        ) {
            key = 'late_cliff';
            label = 'Late cliff';
            summary = 'The role holds together for a while, then weakens sharply once a core bottleneck clears or seat logic breaks.';
        } else if (longRunState === 'compressed' && likelyNextState !== 'compressed' && likelyNextState !== 'bottleneck_fragile' && focusReallocation >= 0.36) {
            key = 'compression_then_break';
            label = 'Compression then break';
            summary = 'The role first absorbs pressure through narrowing and rebundling, then shifts into a harsher downside path later.';
        } else if (longRunState === 'compressed' || likelyNextState === 'compressed' || nextCompression >= 0.28 || bottleneckRisk >= 0.58) {
            key = 'early_compression';
            label = 'Early compression';
            summary = 'Execution pressure bites early, so downside risk rises sooner rather than staying delayed behind a long plateau.';
        } else if (hierarchyPersistence >= 0.52 || demandOffset >= 0.56) {
            key = 'stable_hold';
            label = 'Stable hold';
            summary = 'The role changes gradually and keeps enough structure to avoid a sharp break inside the horizon.';
        } else {
            key = 'complement_then_hold';
            label = 'Complement then hold';
            summary = 'The role changes meaningfully, but the retained seat still looks more likely to adapt than to break quickly.';
        }

        return {
            key: key,
            label: label,
            summary: summary
        };
    }

    function selectPrimaryTippingPoint(curveFamily, tippingPoints) {
        var familyKey = curveFamily && curveFamily.key ? curveFamily.key : 'stable_hold';
        var orderedKeys = familyKey === 'late_cliff'
            ? ['bottleneck_cliff', 'displacement_plausible', 'intactness_break', 'compression_overtakes_offset', 'first_structural_shift']
            : familyKey === 'compression_then_break'
                ? ['compression_overtakes_offset', 'bottleneck_cliff', 'displacement_plausible', 'intactness_break']
                : familyKey === 'early_compression'
                    ? ['compression_overtakes_offset', 'intactness_break', 'first_structural_shift']
                    : familyKey === 'rebundle_then_hold'
                        ? ['retained_reorganization', 'first_structural_shift', 'compression_overtakes_offset']
                        : familyKey === 'demand_expansion'
                            ? ['retained_reorganization', 'first_structural_shift']
                            : ['first_structural_shift', 'retained_reorganization', 'compression_overtakes_offset'];
        var selected = null;

        orderedKeys.some(function (key) {
            selected = (tippingPoints || []).filter(function (point) {
                return point.key === key;
            })[0] || null;
            return !!selected;
        });

        return selected;
    }

    function buildStateTrajectoryLayer(options) {
        var inputs = buildStateTrajectoryInputs(options);
        var trajectory = inputs.trajectory || {};
        var structuralScore = clamp(toNumber(trajectory && trajectory.structural_necessity && trajectory.structural_necessity.score, 0.5), 0, 1);
        var dimensionality = buildStateDimensionality(inputs);
        var bottleneckRisk = buildStateBottleneckRisk(inputs, dimensionality);
        var focusReallocation = buildStateFocusReallocation(inputs, dimensionality, bottleneckRisk);
        var demandOffset = buildStateDemandOffset(inputs, trajectory);
        var firmIncentive = buildStateFirmIncentive(inputs, dimensionality, bottleneckRisk);
        var hierarchyPersistence = computeHierarchyPersistenceBonus({
            seniority: inputs.seniority,
            retainedFunctionStrength: inputs.functionMetrics && inputs.functionMetrics.retained_function_strength,
            retainedAccountabilityStrength: inputs.functionMetrics && inputs.functionMetrics.retained_accountability_strength,
            couplingProtection: trajectory && trajectory.structural_necessity ? trajectory.structural_necessity.score : null,
            functionCategorySignals: inputs.functionCategorySignals
        });
        var checkpoints = {};
        var currentPoint = trajectory && trajectory.timeline && trajectory.timeline.baseline && trajectory.timeline.baseline.points
            ? trajectory.timeline.baseline.points[0]
            : { year: 0, transformed_share: trajectory.scenarios && trajectory.scenarios.current ? trajectory.scenarios.current.compression : 0, demand: trajectory.scenarios && trajectory.scenarios.current ? trajectory.scenarios.current.demand : 0 };
        var nextPoint = trajectory && trajectory.timeline && trajectory.timeline.baseline && trajectory.timeline.baseline.points
            ? trajectory.timeline.baseline.points.filter(function (row) { return Number(row.year) === 2; })[0]
            : { year: 2, transformed_share: trajectory.scenarios && trajectory.scenarios.next ? trajectory.scenarios.next.compression : 0, demand: trajectory.scenarios && trajectory.scenarios.next ? trajectory.scenarios.next.demand : 0 };
        var distantPoint = trajectory && trajectory.timeline && trajectory.timeline.baseline && trajectory.timeline.baseline.points
            ? trajectory.timeline.baseline.points.filter(function (row) { return Number(row.year) === 5; })[0]
            : { year: 5, transformed_share: trajectory.scenarios && trajectory.scenarios.distant ? trajectory.scenarios.distant.compression : 0, demand: trajectory.scenarios && trajectory.scenarios.distant ? trajectory.scenarios.distant.demand : 0 };
        var stateTimeline;
        var currentState;
        var nextState;
        var distantState;
        var likelyNextState;
        var headlineState;
        var longRunState;
        var transitionSummary;
        var drivers;
        var primaryRisk;
        var tippingPoints;
        var curveFamily;
        var primaryTippingPoint;

        function checkpointPayload(point) {
            var metrics = computeStateRoleIntegrityPoint(point, {
                structuralScore: structuralScore,
                dimensionalityScore: dimensionality.score,
                bottleneckRisk: bottleneckRisk.score,
                focusReallocationScore: focusReallocation.score,
                baseDemandOffset: demandOffset.score,
                demandBiasDelta: clamp(toNumber(demandOffset.score, 0) - toNumber(demandOffset.base_score, 0), -1, 1),
                firmIncentive: firmIncentive.score,
                hierarchyPersistenceScore: hierarchyPersistence.score,
                adoptionBias: inputs.controls.adoptionBias,
                stayingBias: inputs.controls.stayingBias
            });
            return {
                year: metrics.year,
                state: metrics.state,
                state_label: metrics.state_label,
                role_integrity: metrics.role_integrity,
                transformed_share: metrics.transformed_share,
                demand_offset: metrics.demand_offset,
                structural_support: metrics.structural_support,
                bottleneck_risk: metrics.bottleneck_risk,
                firm_incentive: metrics.firm_incentive,
                transition_pressure: metrics.transition_pressure
            };
        }

        checkpoints.current = checkpointPayload(currentPoint);
        checkpoints.next = checkpointPayload(nextPoint);
        checkpoints.distant = checkpointPayload(distantPoint);
        currentState = checkpoints.current.state;
        nextState = checkpoints.next.state;
        distantState = checkpoints.distant.state;
        stateTimeline = buildStateTrajectoryTimeline(
            trajectory,
            structuralScore,
            dimensionality,
            bottleneckRisk,
            focusReallocation,
            demandOffset,
            firmIncentive,
            hierarchyPersistence,
            inputs.controls
        );
        likelyNextState = stateTimeline && stateTimeline.markers && Array.isArray(stateTimeline.markers.transitions) && stateTimeline.markers.transitions.length
            ? stateTimeline.markers.transitions[0].state
            : (currentState !== nextState ? nextState : (nextState !== distantState ? distantState : nextState));
        longRunState = stateTimeline && stateTimeline.markers && stateTimeline.markers.floor && stateTimeline.markers.floor.state
            ? stateTimeline.markers.floor.state
            : distantState;
        tippingPoints = buildStateTippingPoints(stateTimeline, checkpoints, {
            dimensionality: dimensionality,
            bottleneckRisk: bottleneckRisk,
            focusReallocation: focusReallocation,
            demandOffset: demandOffset,
            firmIncentive: firmIncentive,
            hierarchyPersistence: hierarchyPersistence
        });
        curveFamily = buildStateCurveFamily({
            likelyNextState: likelyNextState,
            longRunState: longRunState,
            checkpoints: checkpoints,
            tippingPoints: tippingPoints,
            focusReallocation: focusReallocation,
            demandOffset: demandOffset,
            bottleneckRisk: bottleneckRisk,
            hierarchyPersistence: hierarchyPersistence
        });
        primaryTippingPoint = selectPrimaryTippingPoint(curveFamily, tippingPoints);
        headlineState = longRunState &&
            (longRunState === 'bottleneck_fragile' || longRunState === 'displaced') &&
            stateTimeline && stateTimeline.markers && stateTimeline.markers.floor &&
            toNumber(stateTimeline.markers.floor.year, 10) <= 10
            ? longRunState
            : likelyNextState;

        transitionSummary = stateTimeline && stateTimeline.markers && Array.isArray(stateTimeline.markers.transitions) && stateTimeline.markers.transitions.length
            ? 'The role starts as ' + stateTrajectoryStateShortLabel(currentState).toLowerCase() +
                ' and first shifts toward ' + stateTrajectoryStateShortLabel(likelyNextState).toLowerCase() +
                ' around year ' + Number(toNumber(stateTimeline.markers.transitions[0].year, 0)).toFixed(1) + '.'
            : 'The structural state stays broadly the same across the current read, but the transition pressure beneath it still changes.';

        if (primaryTippingPoint) {
            transitionSummary += ' The main tipping point is ' + primaryTippingPoint.label.toLowerCase() +
                ' around year ' + Number(toNumber(primaryTippingPoint.year, 0)).toFixed(1) + '.';
        }

        if (stateTimeline && stateTimeline.markers && stateTimeline.markers.floor &&
            stateTimeline.markers.floor.state &&
            stateTimeline.markers.floor.state !== likelyNextState &&
            (stateTimeline.markers.floor.state === 'bottleneck_fragile' || stateTimeline.markers.floor.state === 'displaced')) {
            transitionSummary += ' By year ' + Number(toNumber(stateTimeline.markers.floor.year, 10)).toFixed(0) +
                ', the graph trends toward ' + stateTrajectoryStateShortLabel(stateTimeline.markers.floor.state).toLowerCase() + '.';
        }

        drivers = buildStateTransitionConditions({
            dimensionality: dimensionality,
            bottleneckRisk: bottleneckRisk,
            focusReallocation: focusReallocation,
            demandOffset: demandOffset,
            firmIncentive: firmIncentive
        });
        primaryRisk = bottleneckRisk.score >= demandOffset.score && bottleneckRisk.score >= focusReallocation.score
            ? 'Bottleneck fragility'
            : demandOffset.score >= focusReallocation.score
                ? 'Demand offset'
                : 'Retained-core lift';

        return {
            headline: stateTrajectoryLabel(headlineState),
            summary: transitionSummary,
            current_state: currentState,
            likely_next_state: likelyNextState,
            distant_state: distantState,
            long_run_state: longRunState,
            dimensionality: Object.assign({}, dimensionality, {
                label: stateTrajectoryModeLabel(dimensionality.score)
            }),
            bottleneck_risk: Object.assign({}, bottleneckRisk, {
                label: stateTrajectoryModeLabel(bottleneckRisk.score)
            }),
            focus_reallocation: Object.assign({}, focusReallocation, {
                label: stateTrajectoryModeLabel(focusReallocation.score)
            }),
            demand_offset: demandOffset,
            firm_incentive: firmIncentive,
            hierarchy_persistence: Object.assign({}, hierarchyPersistence, {
                label: stateTrajectoryModeLabel(hierarchyPersistence.score),
                explanation: hierarchyPersistence.score >= 0.52
                    ? 'Higher-level ownership and coordination make the seat slower to dissolve once the role narrows.'
                    : hierarchyPersistence.score <= 0.20
                        ? 'Hierarchy adds little extra protection here beyond what the role already shows in retained ownership signals.'
                        : 'Hierarchy adds some seat persistence here, but only because the retained role still carries real ownership signals.'
            }),
            curve_family: curveFamily,
            tipping_points: tippingPoints,
            primary_tipping_point: primaryTippingPoint,
            checkpoints: checkpoints,
            timeline: stateTimeline,
            primary_risk: primaryRisk,
            transition_conditions: drivers,
            assumptions: {
                demand_bias: inputs.controls.demandBias,
                investment_bias: inputs.controls.investmentBias,
                adoption_bias: inputs.controls.adoptionBias,
                exposure_bias: inputs.controls.exposureBias,
                staying_bias: inputs.controls.stayingBias
            }
        };
    }

    function checkpointRetainedShare(point) {
        return clamp(1 - toNumber(point && point.transformed_share, 0), 0, 1);
    }

    function checkpointRoleIntegrity(point) {
        return clamp(toNumber(point && point.role_integrity, 0.5), 0, 1);
    }

    function checkpointCoherenceTier(point) {
        var integrity = checkpointRoleIntegrity(point);
        return integrity < 0.35 ? 'fragmented' : (integrity < 0.60 ? 'narrowed' : 'coherent');
    }

    function compatibilityWaveStateFromCheckpoint(point) {
        var transformedShare = clamp(toNumber(point && point.transformed_share, 0), 0, 1);
        var roleIntegrity = checkpointRoleIntegrity(point);
        var state = point && point.state ? point.state : '';

        if (state === 'displaced' || roleIntegrity < 0.28 || transformedShare >= 0.82) {
            return 'displaced';
        }
        if (state === 'compressed' || state === 'bottleneck_fragile' || transformedShare >= 0.48 || roleIntegrity < 0.42) {
            return 'transformed';
        }
        if (state === 'rebalanced' || transformedShare >= 0.24 || roleIntegrity < 0.60) {
            return 'narrowed';
        }
        return 'stable';
    }

    function buildWaveCompatibilityTrajectory(stateTrajectory) {
        var checkpoints = stateTrajectory && stateTrajectory.checkpoints ? stateTrajectory.checkpoints : {};

        function buildEntry(waveName, point) {
            var waveState = compatibilityWaveStateFromCheckpoint(point);
            return {
                wave: waveName,
                state: waveState,
                state_label: WAVE_STATE_LABELS[waveState],
                retained_share: Number(checkpointRetainedShare(point).toFixed(3)),
                coherence: Number(checkpointRoleIntegrity(point).toFixed(3)),
                coherence_tier: checkpointCoherenceTier(point),
                automated_clusters: [],
                remaining_clusters: [],
                elevation_boosts: {}
            };
        }

        return {
            current: buildEntry('current', checkpoints.current),
            next: buildEntry('next', checkpoints.next),
            distant: buildEntry('distant', checkpoints.distant)
        };
    }

    function deriveCompatibilityRoleState(stateTrajectory) {
        var currentState = stateTrajectory && stateTrajectory.current_state ? stateTrajectory.current_state : '';
        var nextState = stateTrajectory && stateTrajectory.likely_next_state ? stateTrajectory.likely_next_state : '';

        if (currentState === 'displaced') {
            return 'high_displacement_risk';
        }
        if (currentState === 'bottleneck_fragile') {
            return 'role_fragments';
        }
        if (currentState === 'demand_expanding' || nextState === 'demand_expanding') {
            return 'role_becomes_more_senior';
        }
        if ((currentState === 'retained' || currentState === 'complemented') &&
            (nextState === 'retained' || nextState === 'complemented')) {
            return 'mostly_augmented';
        }
        if (currentState === 'rebalanced' || nextState === 'rebalanced') {
            return 'routine_tasks_absorbed';
        }
        if (currentState === 'compressed' || nextState === 'compressed' || nextState === 'bottleneck_fragile' || nextState === 'displaced') {
            return 'role_narrows_but_remains_viable';
        }
        return 'routine_tasks_absorbed';
    }

    function computeTrajectoryPresentDayAnchor(taskRows, individualUsageContext, options) {
        var rows = Array.isArray(taskRows) ? taskRows : [];
        var usage = individualUsageContext || null;
        var workflowCompression = clamp(toNumber(options && options.workflowCompression, 0), 0, 1);
        var adoptionRealizationContext = clamp(toNumber(options && options.adoptionRealizationContext, 0), 0, 1);
        var directShare = clamp(sum(rows.map(function (task) {
            return clamp(toNumber(task && task.share_of_role, 0), 0, 1) * clamp(toNumber(task && task.direct_exposure_pressure, 0), 0, 1);
        })), 0, 1);
        var observabilityShare = clamp(sum(rows.map(function (task) {
            return clamp(toNumber(task && task.share_of_role, 0), 0, 1) * clamp(toNumber(task && task.ai_support_observability, 0), 0, 1);
        })), 0, 1);
        var retainedBrake = clamp(sum(rows.map(function (task) {
            var share = clamp(toNumber(task && task.share_of_role, 0), 0, 1);
            var retainedLeverage = clamp(toNumber(task && task.retained_leverage, 0), 0, 1);
            var retainedShare = clamp(toNumber(task && task.retained_share, share), 0, 1);
            return share * clamp((retainedLeverage * 0.70) + (retainedShare * 0.30), 0, 1);
        })), 0, 1);
        var observedExposure = usage && usage.observed_exposure !== ''
            ? clamp(toNumber(usage.observed_exposure, null), 0, 1)
            : null;
        var gapDirection = usage && usage.gap_direction ? usage.gap_direction : '';
        var calibrationFlag = usage && usage.calibration_flag ? usage.calibration_flag : '';
        var empiricalWeight = observedExposure === null
            ? 0
            : gapDirection === 'individual_higher'
                ? 0.58
                : gapDirection === 'aligned'
                    ? 0.46
                    : 0.32;
        if (calibrationFlag === 'watch') {
            empiricalWeight *= 0.90;
        } else if (calibrationFlag === 'review') {
            empiricalWeight *= gapDirection === 'individual_higher' ? 1.00 : 0.82;
        } else if (calibrationFlag !== 'ok' && calibrationFlag !== '') {
            empiricalWeight *= 0.75;
        }
        empiricalWeight = clamp(empiricalWeight, 0, 0.70);

        return {
            usage_anchor: observedExposure === null
                ? null
                : Number(clamp(
                    (observedExposure * 0.72) +
                    (adoptionRealizationContext * 0.18) +
                    (workflowCompression * 0.05) +
                    (directShare * 0.05),
                    0,
                    0.88
                ).toFixed(3)),
            structural_floor_basis: Number(clamp(
                (directShare * 0.46) +
                (observabilityShare * 0.18) +
                (workflowCompression * 0.12) +
                (adoptionRealizationContext * 0.10) -
                (retainedBrake * 0.20),
                0,
                0.72
            ).toFixed(3)),
            empirical_weight: Number(empiricalWeight.toFixed(3)),
            observed_exposure: observedExposure === null ? null : Number(observedExposure.toFixed(3)),
            gap_direction: gapDirection || null,
            calibration_flag: calibrationFlag || null
        };
    }

    function buildTrajectoryLayer(options) {
        var taskRows = Array.isArray(options && options.taskRows) ? options.taskRows : [];
        var currentBundle = Array.isArray(options && options.currentBundle) ? options.currentBundle : [];
        var controls = options && options.stateModelControls ? options.stateModelControls : {};
        var clusterFrontierById = currentBundle.reduce(function (map, row) {
            if (row && row.task_cluster_id) {
                map[row.task_cluster_id] = row;
            }
            return map;
        }, {});
        var effectiveAdoptionPressure = clamp(toNumber(options && options.effectiveAdoptionPressure, 0.3), 0, 1);
        var exposureBias = clamp(toNumber(controls.exposureBias, 0), -1, 1);
        var exposureBuildoutMultiplier = clamp(1 + (exposureBias * 0.18), 0.82, 1.18);
        var baselineK = 0.85 * (0.85 + (0.50 * effectiveAdoptionPressure)) * exposureBuildoutMultiplier;
        var conservativeK = 0.55 * (0.85 + (0.50 * effectiveAdoptionPressure)) * exposureBuildoutMultiplier;
        var aggressiveK = 1.15 * (0.85 + (0.50 * effectiveAdoptionPressure)) * exposureBuildoutMultiplier;
        var presentDayAnchor = computeTrajectoryPresentDayAnchor(taskRows, options && options.individualUsageContext, {
            workflowCompression: options && options.workflowCompression,
            adoptionRealizationContext: options && options.runtimeContext ? options.runtimeContext.adoption_realization_context : null
        });
        var compressionOptions = {
            workflowCompression: options && options.workflowCompression,
            effectiveAdoptionPressure: effectiveAdoptionPressure,
            workflowDecomposability: options && options.workflowDecomposability,
            clusterFrontierById: clusterFrontierById,
            kBaseline: baselineK,
            exposureBias: exposureBias,
            currentUsageAnchor: presentDayAnchor.usage_anchor,
            currentUsageWeight: presentDayAnchor.empirical_weight
        };
        var demandProfile = buildTrajectoryDemandProfile({
            currentBundle: currentBundle,
            runtimeContext: options && options.runtimeContext,
            adaptationPrior: options && options.adaptationPrior,
            functionContext: options && options.functionContext,
            functionMetrics: options && options.functionMetrics,
            organizationalAdoptionCeiling: options && options.organizationalAdoptionCeiling
        });
        var structuralNecessity = buildTrajectoryStructuralNecessity({
            residualRoleIntegrity: options && options.residualRoleIntegrity,
            retainedFunctionStrength: options && options.retainedFunctionStrength,
            retainedAccountabilityStrength: options && options.retainedAccountabilityStrength,
            retainedBargainingPower: options && options.retainedBargainingPower,
            couplingProtection: options && options.couplingProtection,
            roleFragmentationRisk: options && options.roleFragmentationRisk,
            functionCategorySignals: options && options.functionCategorySignals,
            seniority: options && options.seniority
        });
        var pCurrent = computeTrajectoryCompressionAtYear(taskRows, 0, compressionOptions, baselineK);
        var pNext = computeTrajectoryCompressionAtYear(taskRows, 2, compressionOptions, baselineK);
        var pDistant = computeTrajectoryCompressionAtYear(taskRows, 5, compressionOptions, baselineK);
        var lCurrent = clamp((structuralNecessity.score * 0.60) + (demandProfile.current * 0.40) - (pCurrent * 0.70) + (0.15 * structuralNecessity.score * demandProfile.current), 0, 1);
        var lNext = clamp((structuralNecessity.score * 0.60) + (demandProfile.next * 0.40) - (pNext * 0.70) + (0.15 * structuralNecessity.score * demandProfile.next), 0, 1);
        var lDistant = clamp((structuralNecessity.score * 0.60) + (demandProfile.distant * 0.40) - (pDistant * 0.70) + (0.15 * structuralNecessity.score * demandProfile.distant), 0, 1);
        var state = classifyTrajectoryState({
            pCurrent: pCurrent,
            pNext: pNext,
            pDistant: pDistant,
            dCurrent: demandProfile.current,
            dNext: demandProfile.next,
            dDistant: demandProfile.distant,
            lCurrent: lCurrent,
            lNext: lNext,
            lDistant: lDistant,
            structuralNecessity: structuralNecessity.score,
            roleFragmentationRisk: options && options.roleFragmentationRisk
        });
        var roleShape = deriveTrajectoryRoleShape({
            state: state,
            taskAccessionMap: options && options.taskAccessionMap,
            functionExposureSpread: options && options.functionExposureSpread,
            roleFragmentationRisk: options && options.roleFragmentationRisk,
            functionCategorySignals: options && options.functionCategorySignals
        });
        var timeline = buildTrajectoryTimeline(
            taskRows,
            demandProfile,
            structuralNecessity.score,
            compressionOptions,
            {
                conservative: { label: 'Conservative', k: conservativeK },
                baseline: { label: 'Baseline', k: baselineK },
                aggressive: { label: 'Aggressive', k: aggressiveK }
            }
        );
        var functionContributions = buildTrajectoryFunctionContributions({
            perFunctionBreakdown: options && options.functionMetrics ? options.functionMetrics.per_function_breakdown : null,
            taskRows: taskRows,
            functionCategorySignals: options && options.functionCategorySignals
        });
        var drivers = buildTrajectoryDrivers({
            pNext: pNext,
            dNext: demandProfile.next,
            structuralNecessity: structuralNecessity.score,
            demandExplanation: demandProfile.explanation,
            structuralExplanation: structuralNecessity.explanation
        });
        var summary = state === 'expanding'
            ? 'Demand response currently does more to absorb AI pressure than execution compression does to shrink the seat.'
            : state === 'stable'
                ? 'AI changes the work, but the role still survives because the retained human core stays structurally necessary.'
                : state === 'transforming'
                    ? 'Execution pressure rises materially, but the role survives by shifting into a narrower human-owned core.'
                    : state === 'compressing'
                        ? 'Execution compression is moving faster than demand response, so the seat thins even if the role itself survives.'
                        : state === 'collapsing'
                            ? 'Compression substantially outruns both demand response and structural retention, so the standalone seat weakens.'
                            : 'Compression, demand, and structural signals are mixed enough that the trajectory stays unsettled.';

        return {
            state: state,
            headline: trajectoryStateLabel(state),
            summary: summary,
            role_shape: roleShape,
            structural_necessity: structuralNecessity,
            scenarios: {
                current: {
                    compression: Number(pCurrent.toFixed(3)),
                    demand: Number(demandProfile.current.toFixed(3)),
                    viability: Number(lCurrent.toFixed(3)),
                    interpretation: buildTrajectoryScenarioInterpretation({
                        compression: pCurrent,
                        demand: demandProfile.current,
                        viability: lCurrent,
                        structuralNecessity: structuralNecessity.score
                    })
                },
                next: {
                    compression: Number(pNext.toFixed(3)),
                    demand: Number(demandProfile.next.toFixed(3)),
                    viability: Number(lNext.toFixed(3)),
                    interpretation: buildTrajectoryScenarioInterpretation({
                        compression: pNext,
                        demand: demandProfile.next,
                        viability: lNext,
                        structuralNecessity: structuralNecessity.score
                    })
                },
                distant: {
                    compression: Number(pDistant.toFixed(3)),
                    demand: Number(demandProfile.distant.toFixed(3)),
                    viability: Number(lDistant.toFixed(3)),
                    interpretation: buildTrajectoryScenarioInterpretation({
                        compression: pDistant,
                        demand: demandProfile.distant,
                        viability: lDistant,
                        structuralNecessity: structuralNecessity.score
                    })
                }
            },
            threshold_timing: {
                noticeable_change: {
                    conservative: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.30, conservativeK, compressionOptions)),
                    baseline: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.30, baselineK, compressionOptions)),
                    aggressive: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.30, aggressiveK, compressionOptions))
                },
                role_restructuring: {
                    conservative: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.50, conservativeK, compressionOptions)),
                    baseline: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.50, baselineK, compressionOptions)),
                    aggressive: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.50, aggressiveK, compressionOptions))
                },
                major_transformation: {
                    conservative: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.70, conservativeK, compressionOptions)),
                    baseline: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.70, baselineK, compressionOptions)),
                    aggressive: trajectoryTimingBucket(solveTrajectoryThresholdTime(taskRows, 0.70, aggressiveK, compressionOptions))
                }
            },
            demand_response: {
                epsilon: demandProfile.epsilon,
                latent_demand: demandProfile.latent_demand,
                satiation_headroom: demandProfile.satiation_headroom,
                revenue_linkage: demandProfile.revenue_linkage,
                explanation: demandProfile.explanation
            },
            present_day_anchor: presentDayAnchor,
            timeline: timeline,
            function_contributions: functionContributions,
            drivers: drivers
        };
    }

    function buildRoleFateReadout(result) {
        var diagnostics = result.diagnostics || {};
        var fateState = result.role_fate_state || 'mixed_transition';
        var directPressure = toNumber(diagnostics.direct_exposure_pressure, 0);
        var spilloverPressure = toNumber(diagnostics.indirect_dependency_pressure, 0);
        var retainedIntegrity = toNumber(diagnostics.residual_role_integrity, 0);
        var retainedStrength = toNumber(diagnostics.residual_role_strength_score, 0);
        var demandExpansion = toNumber(diagnostics.demand_expansion_modifier, 0);
        var nextCheckpoint = result.state_trajectory && result.state_trajectory.checkpoints
            ? result.state_trajectory.checkpoints.next
            : null;
        var nextWaveRetained = checkpointRetainedShare(nextCheckpoint);

        var drivers = [];
        var counterweights = [];

        if (directPressure >= 0.52) {
            drivers.push('A large share of current work faces direct AI pressure.');
        } else if (directPressure >= 0.38) {
            drivers.push('Meaningful parts of the role are under direct AI pressure.');
        } else {
            counterweights.push('Direct AI pressure stays limited on the main work bundle.');
        }

        if (spilloverPressure >= 0.10) {
            drivers.push('Support tasks lose value because they depend on more exposed work upstream.');
        } else {
            counterweights.push('Only a small part of the role loses value through task-to-task spillover.');
        }

        if (retainedIntegrity >= 0.58) {
            counterweights.push('The remaining work still holds together as a coherent higher-value bundle.');
        } else if (retainedIntegrity < 0.42) {
            drivers.push('The remaining work does not hold together cleanly once exposed tasks are removed.');
        }

        if (retainedStrength >= 0.58 || nextWaveRetained >= 0.62) {
            counterweights.push('Enough judgment, coordination, or relationship work remains to preserve bargaining power.');
        } else if (retainedStrength < 0.38) {
            drivers.push('Too little bargaining-power work remains in the retained role.');
        }

        if (demandExpansion >= 0.75) {
            counterweights.push('AI likely increases demand or span of control for the retained work.');
        } else if (demandExpansion <= 0.15) {
            drivers.push('Weak demand expansion makes labor compression more likely to convert into fewer seats.');
        }

        var organizationalFate;
        if (fateState === 'expanded') {
            organizationalFate = 'AI doesn\'t threaten this role. It feeds it. The core work resists automation, but AI tools multiply what each person can produce or oversee, so organizations want more of these workers, not fewer. Spreadsheets didn\'t kill accountants. They made every accountant dramatically more productive, which unlocked demand for accounting in places that couldn\'t previously afford it. Roles in this category have strong retained judgment work, high dependency complexity, and sit in markets where latent demand already exists. As AI capabilities grow, the bottleneck isn\'t the tool. It\'s finding enough qualified people to wield it.';
        } else if (fateState === 'augmented') {
            organizationalFate = 'The role stays essentially the same. AI slots in as a productivity layer, not a structural threat. Day-to-day tasks get faster, but the bundle of responsibilities that defines the job (the relationships, the context, the decisions) remains intact and still requires a human seat. This happens when the work AI can reach is real but peripheral: it shaves hours off the week without touching the core reason the role exists. Organizations may expect more output per person over time, but headcount pressure stays modest. The risk is complacency. If you stop developing the judgment-heavy parts of the role, you drift toward compression as capabilities advance.';
        } else if (fateState === 'elevated') {
            organizationalFate = 'The execution layer of this role gets substantially thinner as AI handles more routine production work, but a meaningful judgment-and-oversight core survives. In practice, the role becomes more senior in character. Fewer people do it. Each one handles a broader span, spending more time on exceptions, quality calls, and coordination. But this "promotion" is involuntary and structural: the organization doesn\'t need five people doing a mix of execution and judgment anymore. It needs two people doing almost pure judgment. For the individuals who land in the retained version, the job may be better. For everyone else, their slice of the role has been absorbed. This is the fate that looks like a compliment but hides a headcount cut.';
        } else if (fateState === 'split') {
            organizationalFate = 'The role fractures into two distinct tiers. One becomes cheaper, more templated, AI-assisted execution work. Still done by humans, but with lower skill requirements and lower pay. The other becomes a smaller, higher-judgment core: the people who handle exceptions, make the hard calls, and manage the AI-assisted workflow. The model only assigns this when it sees evidence that the role can actually separate into distinct function bundles rather than simply compressing the same job. In other words, this is not generic workflow change. It is a true bifurcation in what the role asks from people and what organizations will pay for.';
        } else if (fateState === 'collapsed') {
            organizationalFate = 'AI reaches deep enough into this role\'s core responsibilities that the fundamental justification for a dedicated human seat weakens. This doesn\'t mean the work vanishes overnight. It means the organizational logic for bundling these tasks into a standalone role erodes. The work gets absorbed into adjacent roles, distributed across AI-assisted workflows, or done at a fraction of the previous cost. What separates this from shrinking is severity: it\'s not "fewer people doing the same job" but "the job itself stops making sense as a distinct position." Roles here typically have high direct task exposure, weak retained integrity in the surviving task bundle, and limited bargaining-power work that would force organizations to keep the seat.';
        } else if (fateState === 'compressed') {
            organizationalFate = 'The work itself doesn\'t disappear. Organizations still need the function performed. But AI makes each worker productive enough that fewer people are needed to cover the same output. This is the most common displacement pattern: not dramatic role elimination, but a slow tightening where teams of eight become teams of five, hiring freezes replace layoffs, and attrition isn\'t backfilled. The role still shows up on org charts and job boards, but the total number of seats in the economy contracts. Individuals already in the role may barely notice at first. Their day-to-day changes only incrementally. But the labor market around them gets meaningfully more competitive. Wage pressure follows headcount pressure.';
        } else {
            organizationalFate = 'The model\'s signals conflict for this role. Some dimensions point toward compression, but counterweights like retained judgment work, accountability, or demand growth push back hard enough that the path is not clean. This isn\'t a cop-out. It reflects real ambiguity about how organizations will respond when AI can automate some core work but not enough to settle the organizational design question. The outcome will likely depend on factors outside the task structure: how aggressively a specific industry adopts AI tooling, whether regulatory or institutional barriers slow deployment, and how the labor market for adjacent roles shifts. If you land here, the honest read is that your trajectory is underdetermined, and individual positioning matters more than usual.';
        }

        return {
            organizational_fate: organizationalFate,
            drivers: drivers.slice(0, 3),
            counterweights: counterweights.slice(0, 3)
        };
    }

    function createEngine(store) {
        function resolveCandidates(roleCategory, limit) {
            var candidates = (store.uiRoleMapByRole[roleCategory] || [])
                .filter(function (row) { return row.onet_soc_code; })
                .sort(function (left, right) {
                    return toNumber(left.fit_rank, 99) - toNumber(right.fit_rank, 99);
                })
                .map(function (row) {
                    var occupation = store.occupationsBySoc[row.onet_soc_code];
                    return occupation ? occupation : null;
                })
                .filter(Boolean);

            return candidates.slice(0, limit || 3);
        }

        function resolveOccupation(input) {
            if (input.occupationId && store.occupationsById[input.occupationId]) {
                return store.occupationsById[input.occupationId];
            }

            if (input.onetSocCode && store.occupationsBySoc[input.onetSocCode]) {
                return store.occupationsBySoc[input.onetSocCode];
            }

            if (input.roleCategory) {
                return resolveCandidates(input.roleCategory, 1)[0] || null;
            }

            return null;
        }

        function getRoleComposition(occupationId, options) {
            var opts = options || {};
            var taskRows = (store.taskInventoryByOcc[occupationId] || []).slice();
            var functionMapRows = (store.occupationFunctionMapByOcc[occupationId] || []).slice();
            var baseDefaultTaskIds = defaultSelectedTaskIds(taskRows);
            var baseDefaultFunctionIds = defaultSelectedFunctionIds(functionMapRows);
            var recommendationTaskIds = resolveCompositionSelection(
                baseDefaultTaskIds,
                opts.compositionEdits || {},
                'added_task_ids',
                'removed_task_ids'
            );
            var recommendationFunctionIds = resolveCompositionSelection(
                baseDefaultFunctionIds,
                opts.compositionEdits || {},
                'added_function_ids',
                'removed_function_ids'
            );
            var recommendationTaskLookup = toLookup(recommendationTaskIds.length ? recommendationTaskIds : baseDefaultTaskIds);
            var recommendationFunctionLookup = toLookup(recommendationFunctionIds.length ? recommendationFunctionIds : baseDefaultFunctionIds);
            var recommendationTaskRows = taskRows.filter(function (row) {
                return !!recommendationTaskLookup[row.task_id];
            });
            var recommendationFunctionRows = functionMapRows.filter(function (row) {
                return !!recommendationFunctionLookup[row.function_id];
            });
            var roleVariants = (store.roleVariantsByOcc[occupationId] || []).slice().sort(function (left, right) {
                var orderDiff = toNumber(left.variant_order, 99) - toNumber(right.variant_order, 99);
                if (orderDiff !== 0) {
                    return orderDiff;
                }
                return String(left.variant_label || '').localeCompare(String(right.variant_label || ''));
            });
            var scoredVariants = roleVariants.map(function (row) {
                return scoreRoleVariant(row, {
                    questionnaireProfile: opts.questionnaireProfile || null,
                    taskFamilyShare: summarizeTaskFamilyShare(recommendationTaskRows),
                    activeFunctionRows: recommendationFunctionRows
                });
            }).sort(function (left, right) {
                if (right.recommendation_score !== left.recommendation_score) {
                    return right.recommendation_score - left.recommendation_score;
                }
                if ((right.is_default ? 1 : 0) !== (left.is_default ? 1 : 0)) {
                    return (right.is_default ? 1 : 0) - (left.is_default ? 1 : 0);
                }
                return toNumber(left.variant_order, 99) - toNumber(right.variant_order, 99);
            });
            var explicitVariantId = String(opts.roleVariantId || '').trim();
            var defaultVariant = scoredVariants.filter(function (row) {
                return !!row.is_default;
            })[0] || null;
            var hasCompositionSignal = !!(
                (opts.compositionEdits && opts.compositionEdits.added_task_ids && opts.compositionEdits.added_task_ids.length) ||
                (opts.compositionEdits && opts.compositionEdits.removed_task_ids && opts.compositionEdits.removed_task_ids.length) ||
                (opts.compositionEdits && opts.compositionEdits.added_function_ids && opts.compositionEdits.added_function_ids.length) ||
                (opts.compositionEdits && opts.compositionEdits.removed_function_ids && opts.compositionEdits.removed_function_ids.length)
            );
            var hasQuestionnaireSignal = hasProvidedQuestionnaireProfile(opts.questionnaireProfile);
            var hasRecommendationSignal = hasQuestionnaireSignal || hasCompositionSignal;
            var recommendedVariant = scoredVariants[0] || defaultVariant || null;
            var selectedVariant = explicitVariantId
                ? (scoredVariants.filter(function (row) {
                    return row.variant_id === explicitVariantId;
                })[0] || null)
                : null;
            if (!selectedVariant) {
                selectedVariant = hasRecommendationSignal
                    ? recommendedVariant
                    : (defaultVariant || recommendedVariant);
            }
            var selectionMode = selectedVariant
                ? (explicitVariantId
                    ? 'manual'
                    : (hasRecommendationSignal ? 'recommended' : 'default'))
                : 'none';
            var availableTaskLookup = toLookup(taskRows.map(function (row) {
                return row.task_id;
            }));
            var availableFunctionLookup = toLookup(functionMapRows.map(function (row) {
                return row.function_id;
            }));
            var defaultTaskIds = selectedVariant && selectedVariant.task_ids.length
                ? selectedVariant.task_ids.filter(function (taskId) {
                    return !!availableTaskLookup[taskId];
                })
                : baseDefaultTaskIds;
            var defaultFunctionIds = selectedVariant && selectedVariant.function_ids.length
                ? selectedVariant.function_ids.filter(function (functionId) {
                    return !!availableFunctionLookup[functionId];
                })
                : baseDefaultFunctionIds;
            if (!defaultTaskIds.length) {
                defaultTaskIds = baseDefaultTaskIds.slice();
            }
            if (!defaultFunctionIds.length) {
                defaultFunctionIds = baseDefaultFunctionIds.slice();
            }
            var selectedTaskLookup = toLookup(defaultTaskIds);
            var selectedFunctionLookup = toLookup(defaultFunctionIds);
            var groupedTasks = {
                onet_tasks: [],
                reviewed_job_posting_tasks: [],
                reviewed_role_graph_tasks: []
            };

            taskRows.forEach(function (task) {
                var bucket = taskSourceBucket(task);
                var linkedFunctions = (store.taskFunctionEdgesByTaskId[task.task_id] || [])
                    .slice()
                    .sort(function (left, right) {
                        return toNumber(right.task_to_function_weight, 0) - toNumber(left.task_to_function_weight, 0);
                    })
                    .slice(0, 2)
                    .map(function (edge) {
                        var roleFunction = store.roleFunctionsById[edge.function_id] || {};
                        return {
                            function_id: edge.function_id,
                            function_category: roleFunction.function_category || null,
                            role_summary: roleFunction.role_summary || null,
                            function_statement: roleFunction.function_statement || null,
                            task_to_function_weight: Number(toNumber(edge.task_to_function_weight, 0).toFixed(3))
                        };
                    });
                groupedTasks[bucket].push(buildEditableTaskRow(task, selectedTaskLookup, linkedFunctions));
            });

            Object.keys(groupedTasks).forEach(function (bucket) {
                groupedTasks[bucket].sort(function (left, right) {
                    var rightSelected = right.selected_by_default ? 1 : 0;
                    var leftSelected = left.selected_by_default ? 1 : 0;
                    if (rightSelected !== leftSelected) {
                        return rightSelected - leftSelected;
                    }
                    return rankTaskForDefaultSelection(right) - rankTaskForDefaultSelection(left);
                });
            });

            var functionRows = functionMapRows.map(function (row) {
                return buildEditableFunctionRow(row, store.roleFunctionsById[row.function_id] || null, selectedFunctionLookup);
            }).sort(function (left, right) {
                return toNumber(right.function_weight, 0) - toNumber(left.function_weight, 0);
            });

            return {
                occupation_id: occupationId,
                defaults: {
                    task_ids: defaultTaskIds,
                    function_ids: defaultFunctionIds,
                    role_variant_id: selectedVariant ? selectedVariant.variant_id : null
                },
                variants: scoredVariants.map(function (variantRow) {
                    return Object.assign({}, variantRow, {
                        is_selected: !!selectedVariant && selectedVariant.variant_id === variantRow.variant_id,
                        is_recommended: !!recommendedVariant && recommendedVariant.variant_id === variantRow.variant_id
                    });
                }),
                variant_support: {
                    enabled: scoredVariants.length > 0,
                    selection_mode: selectionMode,
                    selected_variant_id: selectedVariant ? selectedVariant.variant_id : null,
                    selected_variant_label: selectedVariant ? selectedVariant.variant_label : null,
                    selected_variant_summary: selectedVariant ? selectedVariant.variant_summary : null,
                    recommended_variant_id: recommendedVariant ? recommendedVariant.variant_id : null,
                    recommended_variant_label: recommendedVariant ? recommendedVariant.variant_label : null,
                    recommended_variant_summary: recommendedVariant ? recommendedVariant.variant_summary : null,
                    recommendation_score: recommendedVariant ? recommendedVariant.recommendation_score : null,
                    recommendation_inputs: {
                        questionnaire_profile_used: !!opts.questionnaireProfile,
                        composition_used: !!recommendationTaskRows.length
                    },
                    recommendation_drivers: recommendedVariant ? recommendedVariant.recommendation_drivers.slice() : []
                },
                onet_tasks: groupedTasks.onet_tasks,
                reviewed_job_posting_tasks: groupedTasks.reviewed_job_posting_tasks,
                reviewed_role_graph_tasks: groupedTasks.reviewed_role_graph_tasks,
                functions: functionRows,
                dependency_edges: (store.taskDependencyEdgesByOcc[occupationId] || []).map(function (edge) {
                    return {
                        from_task_id: edge.from_task_id,
                        to_task_id: edge.to_task_id,
                        dependency_strength: Number(toNumber(edge.dependency_strength, 0).toFixed(3)),
                        notes: edge.notes || ''
                    };
                })
            };
        }

        function computeResult(input) {
            var occupation = resolveOccupation(input || {});
            if (!occupation) {
                throw new Error('Unable to resolve an occupation for the v2 result.');
            }

            var occupationId = occupation.occupation_id;
            var roleCategory = input.roleCategory || input.selectedRoleCategory || occupation.role_family;
            var compositionEdits = input.compositionEdits || {};
            var hasAnsweredQuestionnaire = !!(input.answers && Object.keys(input.answers).length);
            var variantQuestionnaireProfile = input.questionnaireProfile || (hasAnsweredQuestionnaire
                ? deriveQuestionnaireSignals(input.answers || {}, input || {}).questionnaireProfile
                : null);
            var roleComposition = getRoleComposition(occupationId, {
                roleVariantId: input.roleVariantId,
                questionnaireProfile: variantQuestionnaireProfile,
                compositionEdits: compositionEdits
            });
            var activeTaskIds = resolveCompositionSelection(
                roleComposition.defaults.task_ids,
                compositionEdits,
                'added_task_ids',
                'removed_task_ids'
            );
            if (!activeTaskIds.length) {
                activeTaskIds = roleComposition.defaults.task_ids.slice(0, 1);
            }
            var activeTaskLookup = toLookup(activeTaskIds);
            var taskInventoryRows = (store.taskInventoryByOcc[occupationId] || []).filter(function (row) {
                return !!activeTaskLookup[row.task_id];
            });
            var taskShareOverrides = compositionEdits.task_share_overrides || {};
            taskInventoryRows = applyTaskShareOverrides(taskInventoryRows, taskShareOverrides);
            var dependencyEdges = (store.taskDependencyEdgesByOcc[occupationId] || []).filter(function (edge) {
                return activeTaskLookup[edge.from_task_id] && activeTaskLookup[edge.to_task_id];
            });
            var taskRoleProfile = store.taskRoleProfilesByOcc[occupationId] || null;
            var taskInventoryById = indexBy(taskInventoryRows, 'task_id');
            var activeFunctionIds = resolveCompositionSelection(
                roleComposition.defaults.function_ids,
                compositionEdits,
                'added_function_ids',
                'removed_function_ids'
            );
            if (!activeFunctionIds.length && roleComposition.defaults.function_ids.length) {
                activeFunctionIds = roleComposition.defaults.function_ids.slice(0, 1);
            }
            var activeFunctionLookup = toLookup(activeFunctionIds);
            var activeFunctionRows = (store.occupationFunctionMapByOcc[occupationId] || []).filter(function (row) {
                return !!activeFunctionLookup[row.function_id];
            });
            var customTaskFunctionLinks = Array.isArray(compositionEdits.task_function_links) ? compositionEdits.task_function_links.filter(function (link) {
                return !!link && !!activeTaskLookup[link.task_id] && !!activeFunctionLookup[link.function_id];
            }) : [];
            var taskFunctionLinks = mergeRuntimeTaskFunctionLinks(
                taskInventoryRows,
                activeFunctionRows,
                store.taskFunctionEdgesByTaskId,
                customTaskFunctionLinks
            );
            taskInventoryRows = applyTaskFunctionLinks(taskInventoryRows, taskFunctionLinks, activeFunctionRows, store.functionAccountabilityByFunctionId);
            var functionSummary = summarizeActiveFunctions(activeFunctionRows, store.functionAccountabilityByFunctionId);
            var dependencyEdits = input.dependencyEdits || {};
            var addedDependencyEdges = Array.isArray(dependencyEdits.added_edges) ? dependencyEdits.added_edges : [];
            if (addedDependencyEdges.length) {
                var dependencyEdgeMap = {};
                dependencyEdges.forEach(function (edge) {
                    dependencyEdgeMap[dependencyEdgeKey(edge.from_task_id, edge.to_task_id)] = edge;
                });
                addedDependencyEdges.forEach(function (edge) {
                    if (!edge || !activeTaskLookup[edge.from_task_id] || !activeTaskLookup[edge.to_task_id] || edge.from_task_id === edge.to_task_id) {
                        return;
                    }
                    var key = dependencyEdgeKey(edge.from_task_id, edge.to_task_id);
                    if (!dependencyEdgeMap[key]) {
                        dependencyEdgeMap[key] = {
                            occupation_id: occupationId,
                            from_task_id: edge.from_task_id,
                            to_task_id: edge.to_task_id,
                            dependency_strength: '0.65',
                            notes: 'user_declared_dependency'
                        };
                    }
                });
                dependencyEdges = Object.keys(dependencyEdgeMap).map(function (key) {
                    return dependencyEdgeMap[key];
                });
            }
            var dominantTaskIds = uniqueStrings(input.dominantTaskIds || []);
            var criticalTaskIds = uniqueStrings(input.criticalTaskIds || []);
            var aiSupportTaskIds = uniqueStrings(input.aiSupportTaskIds || []);
            var supportTaskIds = uniqueStrings(input.supportTaskIds || []);
            var derivedDominantTaskClusters = uniqueStrings(dominantTaskIds.concat(supportTaskIds).map(function (taskId) {
                return taskInventoryById[taskId] ? taskInventoryById[taskId].task_family_id : null;
            }));
            var derivedCriticalTaskClusters = uniqueStrings(criticalTaskIds.map(function (taskId) {
                return taskInventoryById[taskId] ? taskInventoryById[taskId].task_family_id : null;
            }));
            var dominantTaskClusters = uniqueStrings((input.dominantTaskClusters || []).concat(derivedDominantTaskClusters));
            var roleCriticalClusters = uniqueStrings((input.roleCriticalClusters || []).concat(derivedCriticalTaskClusters));
            var taskClusters = normalizeTaskWeights(
                mergeTaskClustersWithInventory(store.occupationTaskClustersByOcc[occupationId] || [], taskInventoryRows),
                buildTaskOverrides({
                    taskFamilyWeights: input.taskFamilyWeights || {},
                    dominantTaskClusters: dominantTaskClusters,
                    roleCriticalClusters: roleCriticalClusters
                })
            );
            var taskPriorsByCluster = indexBy(store.taskPriorsByOcc[occupationId] || [], 'task_cluster_id');
            var occupationPrior = pickOccupationPrior(store.occupationPriorsByOcc[occupationId] || []);
            var laborContext = store.laborByOcc[occupationId] || null;
            var runtimeContext = store.demandAdoptionContextByOcc[occupationId] || null;
            var individualUsageContext = store.individualAiUsageContextByOcc[occupationId] || null;
            var recompositionContext = store.recompositionContextByOcc[occupationId] || null;
            var functionContext = store.functionContextByOcc[occupationId] || null;
            var adaptationPrior = store.adaptationByOcc[occupationId] || null;
            var unemploymentSeries = laborContext && laborContext.unemployment_group_id
                ? (store.unemploymentByGroup[laborContext.unemployment_group_id] || [])
                : [];
            var signals = deriveQuestionnaireSignals(input.answers || {}, input || {});
            if (functionSummary) {
                signals.functionRetention = clamp(
                    (signals.functionRetention * 0.72) +
                    (functionSummary.human_authority_requirement * 0.14) +
                    (functionSummary.bargaining_power_retention * 0.14),
                    0, 1
                );
                signals.couplingProtection = clamp(
                    (signals.couplingProtection * 0.78) +
                    (functionSummary.delegability_guardrail * 0.10) +
                    (functionSummary.trust_requirement * 0.06) +
                    (functionSummary.judgment_requirement * 0.06),
                    0, 1
                );
                signals.augmentationFit = clamp(
                    (signals.augmentationFit * 0.80) +
                    (functionSummary.bargaining_power_retention * 0.10) +
                    (functionSummary.judgment_requirement * 0.10),
                    0, 1
                );
                signals.substitutionRiskModifier = clamp(
                    (signals.substitutionRiskModifier * 0.82) +
                    ((1 - functionSummary.delegability_guardrail) * 0.10) +
                    ((1 - functionSummary.human_authority_requirement) * 0.08),
                    0, 1
                );
                signals.frictionDimensions.accountability_load = clamp(
                    (signals.frictionDimensions.accountability_load * 0.75) +
                    (functionSummary.human_authority_requirement * 0.25),
                    0, 1
                );
                signals.frictionDimensions.judgment_requirement = clamp(
                    (signals.frictionDimensions.judgment_requirement * 0.75) +
                    (functionSummary.judgment_requirement * 0.25),
                    0, 1
                );
                signals.frictionDimensions.tacit_context_dependence = clamp(
                    (signals.frictionDimensions.tacit_context_dependence * 0.75) +
                    (functionSummary.trust_requirement * 0.25),
                    0, 1
                );
            }
            var roleCriticalSet = {};
            roleCriticalClusters.forEach(function (clusterId) {
                roleCriticalSet[clusterId] = true;
            });
            var occupationAutomation = occupationPrior ? toNumber(occupationPrior.automation_score, 0.25) : 0.25;
            var occupationAdaptive = adaptationPrior && adaptationPrior.adaptive_capacity_score
                ? toNumber(adaptationPrior.adaptive_capacity_score, 0.5)
                : (occupationPrior && occupationPrior.adaptive_capacity_score
                    ? toNumber(occupationPrior.adaptive_capacity_score, 0.5)
                    : 0.5);

            var currentBundle = [];
            var clusterResultsById = {};
            var roleDefiningWork = null;
            var clusterPriorReliabilities = [];
            var taskDirectReliabilities = [];
            var bundlePriorConcentration = taskClusters.length ? toNumber(taskClusters[0].bundle_prior_concentration, 1.35) : 1.35;
            var adoptionRealization = Math.min(1.0, SCORING_CONFIG.adoptionRealizationBase + (signals.adoptionPressure * SCORING_CONFIG.adoptionRealizationScale));
            var taskInventoryByCluster = summarizeTaskInventoryByCluster(taskInventoryRows);
            var resolvedTaskEvidenceByCluster = summarizeResolvedTaskEvidenceByCluster({
                occupationId: occupationId,
                taskInventoryRows: taskInventoryRows,
                taskSourceEvidenceByTaskId: store.taskSourceEvidenceByTaskId,
                taskEvidenceByKey: store.taskEvidenceByKey
            });
            var taskFirstClusterCount = 0;

            taskClusters.forEach(function (cluster) {
                var prior = taskPriorsByCluster[cluster.task_cluster_id] || {};
                var humanAdvantage = HUMAN_ADVANTAGE_CLUSTERS[cluster.task_cluster_id] || 0.25;
                var priorReliability = estimatePriorReliability(prior);
                var frictionDimensions = deriveClusterFriction(signals, cluster.task_cluster_id);
                var isRoleCritical = !!roleCriticalSet[cluster.task_cluster_id];
                var clusterShare = toNumber(cluster.share_prior, 0);
                var inventoryProfile = taskInventoryByCluster[cluster.task_cluster_id] || null;
                var resolvedTaskEvidenceCluster = resolvedTaskEvidenceByCluster[cluster.task_cluster_id] || null;
                var graphCoreShare = inventoryProfile ? toNumber(inventoryProfile.core_share, 0) : 0;
                var graphBargainingWeight = inventoryProfile ? toNumber(inventoryProfile.mean_bargaining_power_weight, 0.5) : 0.5;
                var graphAiSupport = inventoryProfile ? toNumber(inventoryProfile.mean_ai_support_observability, 0.3) : 0.3;
                var graphValueCentrality = inventoryProfile ? toNumber(inventoryProfile.mean_value_centrality, 0.5) : 0.5;
                clusterPriorReliabilities.push(priorReliability);

                var intrinsicFriction =
                    FRICTION_WEIGHTS.accountability_load * frictionDimensions.accountability_load +
                    FRICTION_WEIGHTS.judgment_requirement * frictionDimensions.judgment_requirement +
                    FRICTION_WEIGHTS.tacit_context_dependence * frictionDimensions.tacit_context_dependence +
                    FRICTION_WEIGHTS.exception_burden * frictionDimensions.exception_burden +
                    FRICTION_WEIGHTS.inverse_document_intensity * (1 - frictionDimensions.document_intensity);

                // Audit 2026-03-27: removed 0.35 pre-scaling that reduced effective
                // weight from declared 25% to 8.75%. AUTOMATION_DIFFICULTY_WEIGHTS
                // now carries the full intended weight.
                var humanAdvantageContribution = humanAdvantage;

                var empiricalEase = shrinkTowardPrior(
                    average([
                        toNumber(prior.partial_automation_likelihood, 0.25),
                        toNumber(prior.high_automation_likelihood, 0.12)
                    ]),
                    occupationAutomation,
                    priorReliability,
                    0.25
                );
                var taskFirstClusterWeight = resolvedTaskEvidenceCluster
                    ? clamp(toNumber(resolvedTaskEvidenceCluster.task_first_weight, 0), 0, 1)
                    : 0;
                if (taskFirstClusterWeight > 0) {
                    empiricalEase = shrinkTowardPrior(
                        resolvedTaskEvidenceCluster.task_empirical_ease,
                        empiricalEase,
                        taskFirstClusterWeight,
                        empiricalEase
                    );
                    taskFirstClusterCount += 1;
                }
                var empiricalResistance = 1 - empiricalEase;

                var automationDifficulty = clamp(
                    intrinsicFriction * AUTOMATION_DIFFICULTY_WEIGHTS.intrinsicFriction +
                    humanAdvantageContribution * AUTOMATION_DIFFICULTY_WEIGHTS.humanAdvantage +
                    empiricalResistance * AUTOMATION_DIFFICULTY_WEIGHTS.empiricalResistance +
                    signals.couplingProtection * AUTOMATION_DIFFICULTY_WEIGHTS.couplingProtection,
                    0.02, 0.98
                );
                automationDifficulty = clamp(
                    automationDifficulty +
                    (humanAdvantage * signals.functionRetention * 0.08) +
                    (signals.augmentationFit * 0.04) +
                    (graphBargainingWeight * 0.10) +
                    (graphCoreShare * 0.05) +
                    (Math.max(0, graphValueCentrality - 0.5) * 0.04) -
                    (graphAiSupport * 0.07) -
                    (signals.substitutionRiskModifier * 0.08),
                    0.02, 0.98
                );

                if (isRoleCritical) {
                    automationDifficulty = clamp(automationDifficulty + SCORING_CONFIG.criticalityBoost, 0.02, 0.98);
                }

                var waveAssignment;
                if (automationDifficulty <= WAVE_THRESHOLDS.current_max) {
                    waveAssignment = 'current';
                } else if (automationDifficulty <= WAVE_THRESHOLDS.next_max) {
                    waveAssignment = 'next';
                } else {
                    waveAssignment = 'distant';
                }

                // Floor lowered from 0.45 to 0.25 so high-friction clusters
                // (client interaction, oversight/strategy) can realistically show
                // minimal absorption when difficulty is high and adoption is low.
                var absorptionRate = clamp(
                    adoptionRealization *
                    (1 - automationDifficulty * 0.3) *
                    (0.92 + (graphAiSupport * 0.10) - (graphCoreShare * 0.06)) *
                    (1 - (signals.questionnaireProfile.dependency_bottleneck_strength * 0.10)) *
                    (1 - (signals.questionnaireProfile.human_signoff_requirement * 0.08)),
                    0.25, 0.95
                );

                var clusterResult = {
                    task_cluster_id: cluster.task_cluster_id,
                    label: slugToLabel(cluster.task_cluster_id),
                    share_of_role: clusterShare,
                    automation_difficulty: automationDifficulty,
                    wave_assignment: waveAssignment,
                    structural_wave: waveAssignment,
                    absorption_rate: absorptionRate,
                    absorbed_share: 0,
                    residual_relevance: clusterShare,
                    elevation_boost: 0,
                    evidence_confidence: average([
                        toNumber(cluster.evidence_confidence, 0.4),
                        priorReliability
                    ]),
                    primary_sources: parsePipeList(prior.primary_sources || cluster.source_mix || ''),
                    is_role_critical: isRoleCritical,
                    prior_reliability: priorReliability,
                    prior_partial_automation_likelihood: prior.partial_automation_likelihood != null ? Number(toNumber(prior.partial_automation_likelihood, 0).toFixed(3)) : null,
                    prior_high_automation_likelihood: prior.high_automation_likelihood != null ? Number(toNumber(prior.high_automation_likelihood, 0).toFixed(3)) : null,
                    baseline_difficulty_source: taskFirstClusterWeight > 0 ? 'task_first_cluster_evidence' : 'cluster_priors',
                    task_first_weight: Number(taskFirstClusterWeight.toFixed(3)),
                    task_evidence_coverage_ratio: resolvedTaskEvidenceCluster ? Number(toNumber(resolvedTaskEvidenceCluster.task_evidence_coverage_ratio, 0).toFixed(3)) : 0,
                    task_evidence_mean_reliability: resolvedTaskEvidenceCluster ? Number(toNumber(resolvedTaskEvidenceCluster.task_evidence_mean_reliability, 0).toFixed(3)) : 0,
                    resolved_task_evidence_count: resolvedTaskEvidenceCluster ? toNumber(resolvedTaskEvidenceCluster.resolved_task_count, 0) : 0,
                    friction_dimensions: frictionDimensions,
                    intrinsic_friction: intrinsicFriction,
                    empirical_resistance: empiricalResistance,
                    graph_core_share: Number(graphCoreShare.toFixed(3)),
                    graph_bargaining_weight: Number(graphBargainingWeight.toFixed(3)),
                    graph_ai_support: Number(graphAiSupport.toFixed(3))
                };

                currentBundle.push(clusterResult);
                clusterResultsById[cluster.task_cluster_id] = clusterResult;

                if (isRoleCritical) {
                    roleDefiningWork = clusterResult;
                }
            });

            if (!roleDefiningWork && currentBundle.length) {
                roleDefiningWork = currentBundle.slice().sort(function (left, right) {
                    var leftInventory = taskInventoryByCluster[left.task_cluster_id] || {};
                    var rightInventory = taskInventoryByCluster[right.task_cluster_id] || {};
                    var leftScore = left.share_of_role * average([
                        toNumber(leftInventory.mean_value_centrality, 0.5),
                        toNumber(leftInventory.mean_bargaining_power_weight, 0.5)
                    ]);
                    var rightScore = right.share_of_role * average([
                        toNumber(rightInventory.mean_value_centrality, 0.5),
                        toNumber(rightInventory.mean_bargaining_power_weight, 0.5)
                    ]);
                    return rightScore - leftScore;
                })[0] || null;
                if (roleDefiningWork) {
                    roleDefiningWork.is_role_critical = true;
                }
            }

            // --- Primary displacement wave ---
            var primaryDisplacementWave = 'distant';

            // --- Residual viability (anchored on next wave) ---
            var adoptionRealizationContext = runtimeContext
                ? clamp(toNumber(runtimeContext.adoption_realization_context, signals.adoptionPressure), 0, 1)
                : clamp(toNumber(signals.adoptionPressure, 0.5), 0, 1);
            var effectiveAdoptionPressure = clamp(
                (signals.adoptionPressure * 0.55) +
                (adoptionRealizationContext * 0.45),
                0,
                1
            );
            var workflowCompressionContext = recompositionContext
                ? clamp(toNumber(recompositionContext.workflow_compression_context, null), 0, 1)
                : null;
            var organizationalConversionContext = recompositionContext
                ? clamp(toNumber(recompositionContext.organizational_conversion_context, null), 0, 1)
                : null;
            var nextScenarioLift = recompositionContext
                ? clamp(toNumber(recompositionContext.next_scenario_lift, recompositionContext.wave_acceleration_context), 0, 1)
                : null;
            var distantScenarioLift = recompositionContext
                ? clamp(toNumber(recompositionContext.distant_scenario_lift, recompositionContext.displacement_wave_bias), 0, 1)
                : null;
            var organizationalAdoptionCeiling = recompositionContext
                ? clamp(toNumber(recompositionContext.organizational_adoption_ceiling, adoptionRealizationContext), effectiveAdoptionPressure, 1)
                : null;
            var economicPressureContext = recompositionContext
                ? clamp(toNumber(recompositionContext.economic_pressure_context, workflowCompressionContext), 0, 1)
                : null;
            var adoptionFriction = 1 - effectiveAdoptionPressure;
            var residualViabilityScore = 0;
            var roleState = '';
            var personalizationFitScore = 0;

            // --- Recomposition summary (derived from wave data) ---
            var selector = store.selectorByOcc[occupationId] || {};
            var bundleFriction = summarizeBundleFriction(currentBundle);
            var routineCompressionSignal = computeRoutineCompressionSignal(currentBundle, adaptationPrior);
            workflowCompressionContext = workflowCompressionContext === null ? routineCompressionSignal : workflowCompressionContext;
            organizationalConversionContext = organizationalConversionContext === null ? effectiveAdoptionPressure : organizationalConversionContext;
            nextScenarioLift = nextScenarioLift === null ? average([
                organizationalConversionContext,
                workflowCompressionContext,
                effectiveAdoptionPressure
            ]) : nextScenarioLift;
            distantScenarioLift = distantScenarioLift === null ? clamp(average([
                nextScenarioLift,
                organizationalConversionContext,
                1 - adoptionFriction
            ]), 0, 1) : distantScenarioLift;
            organizationalAdoptionCeiling = organizationalAdoptionCeiling === null
                ? clamp(Math.max(effectiveAdoptionPressure, average([
                    adoptionRealizationContext,
                    organizationalConversionContext,
                    workflowCompressionContext
                ])), effectiveAdoptionPressure, 1)
                : organizationalAdoptionCeiling;
            economicPressureContext = economicPressureContext === null
                ? average([
                    workflowCompressionContext,
                    1 - clamp(toNumber(runtimeContext && runtimeContext.demand_expansion_context, 0.5), 0, 1),
                    clamp(toNumber(laborContext && laborContext.median_wage_usd, 0) > 0
                        ? normalizeWageLevel(laborContext.median_wage_usd)
                        : 0.45, 0, 1)
                ])
                : economicPressureContext;
            var currentWaveAbsorbed = 0;
            var workflowCompression = 0;
            var organizationalConversion = 0;
            var substitutionPotential = 0;
            var substitutionGap = 0;
            var topExposed = null;
            var clusterFrontierOptions = {
                waveAccelerationContext: nextScenarioLift,
                current_activation: average([
                    effectiveAdoptionPressure,
                    workflowCompressionContext,
                    organizationalConversionContext
                ]),
                organizational_adoption_ceiling: organizationalAdoptionCeiling,
                next_scenario_lift: nextScenarioLift,
                distant_scenario_lift: distantScenarioLift,
                economic_pressure_context: economicPressureContext,
                demand_expansion_modifier: runtimeContext ? toNumber(runtimeContext.demand_expansion_context, 0.35) : 0.35,
                median_wage_usd: laborContext ? toNumber(laborContext.median_wage_usd, 0) : 0
            };
            var initialClusterFrontier = buildClusterFrontierBundle(
                currentBundle,
                signals,
                clusterFrontierOptions
            );
            currentBundle = initialClusterFrontier.current_bundle;
            clusterResultsById = initialClusterFrontier.by_id;
            if (roleDefiningWork && roleDefiningWork.task_cluster_id && clusterResultsById[roleDefiningWork.task_cluster_id]) {
                roleDefiningWork = clusterResultsById[roleDefiningWork.task_cluster_id];
            }

            var taskGraphSummary = buildTaskRoleGraphBreakdown({
                occupationId: occupationId,
                taskInventoryRows: taskInventoryRows,
                dependencyEdges: dependencyEdges,
                clusterResultsById: clusterResultsById,
                taskSourceEvidenceByTaskId: store.taskSourceEvidenceByTaskId,
                taskEvidenceByKey: store.taskEvidenceByKey,
                taskMembershipByKey: store.taskMembershipByKey,
                adaptationPrior: adaptationPrior,
                functionSummary: functionSummary,
                adoptionRealization: adoptionRealization,
                dependencyBottleneckStrength: signals.questionnaireProfile.dependency_bottleneck_strength,
                humanSignoffRequirement: signals.questionnaireProfile.human_signoff_requirement,
                dominantTaskIds: dominantTaskIds,
                criticalTaskIds: criticalTaskIds,
                aiSupportTaskIds: aiSupportTaskIds,
                supportTaskIds: supportTaskIds
            });
            var taskDerivedClusterSummaries = taskGraphSummary && taskGraphSummary.cluster_summaries
                ? taskGraphSummary.cluster_summaries
                : null;
            var finalWaveEngine = buildClusterFrontierBundle(
                taskDerivedClusterSummaries ? taskDerivedClusterSummaries.current_bundle : currentBundle,
                signals,
                clusterFrontierOptions
            );
            currentBundle = finalWaveEngine.current_bundle;
            currentWaveAbsorbed = finalWaveEngine.current_wave_absorbed;
            if (taskDerivedClusterSummaries) {
                taskDerivedClusterSummaries.by_id = finalWaveEngine.by_id;
                taskDerivedClusterSummaries.current_bundle = finalWaveEngine.current_bundle;
                taskDerivedClusterSummaries.exposed_clusters = finalWaveEngine.exposed_clusters;
                taskDerivedClusterSummaries.retained_clusters = finalWaveEngine.retained_clusters;
                taskDerivedClusterSummaries.elevated_clusters = finalWaveEngine.elevated_clusters;
            }

            bundleFriction = summarizeBundleFriction(currentBundle);
            routineCompressionSignal = computeRoutineCompressionSignal(currentBundle, adaptationPrior);
            workflowCompression = clamp(
                currentWaveAbsorbed *
                (1 - (signals.couplingProtection * SCORING_CONFIG.recompositionCouplingPenalty)) *
                (1 - (signals.functionRetention * 0.10)) +
                (routineCompressionSignal * 0.14),
                0, 1
            );
            workflowCompression = clamp(
                (workflowCompression * 0.68) +
                (workflowCompressionContext * 0.32),
                0, 1
            );
            organizationalConversion = clamp(
                effectiveAdoptionPressure * 0.30 +
                (1 - signals.couplingProtection) * 0.25 +
                currentWaveAbsorbed * 0.20 +
                (1 - bundleFriction.accountability_load) * 0.10 +
                (1 - bundleFriction.judgment_requirement) * 0.08 +
                bundleFriction.document_intensity * 0.07 -
                (signals.questionnaireProfile.human_signoff_requirement * 0.05) -
                (signals.questionnaireProfile.liability_and_regulatory_burden * 0.05),
                0, 1
            );
            organizationalConversion = clamp(
                (organizationalConversion * 0.72) +
                (organizationalConversionContext * 0.28),
                0, 1
            );
            substitutionPotential = clamp(workflowCompression * organizationalConversion, 0, 1);
            substitutionGap = clamp(workflowCompression - substitutionPotential, 0, 1);
            topExposed = currentBundle.slice().sort(function (left, right) {
                var leftScore = left.share_of_role * (1 - left.automation_difficulty) * (left.is_role_critical ? 1.35 : 1);
                var rightScore = right.share_of_role * (1 - right.automation_difficulty) * (right.is_role_critical ? 1.35 : 1);
                return rightScore - leftScore;
            })[0] || null;
            if (taskGraphSummary && taskGraphSummary.top_exposed_cluster_id) {
                if (taskDerivedClusterSummaries && taskDerivedClusterSummaries.by_id[taskGraphSummary.top_exposed_cluster_id]) {
                    topExposed = taskDerivedClusterSummaries.by_id[taskGraphSummary.top_exposed_cluster_id];
                } else if (clusterResultsById[taskGraphSummary.top_exposed_cluster_id]) {
                    topExposed = clusterResultsById[taskGraphSummary.top_exposed_cluster_id];
                }
            }
            if (taskGraphSummary) {
                workflowCompression = clamp(
                    (workflowCompression * 0.75) +
                    (taskGraphSummary.direct_exposure_pressure * 0.20) -
                    (taskGraphSummary.indirect_dependency_pressure * 0.05) +
                    (routineCompressionSignal * 0.10),
                    0, 1
                );
            workflowCompression = clamp(
                (workflowCompression * 0.40) +
                (workflowCompressionContext * 0.60),
                0, 1
            );
                organizationalConversion = clamp(
                    (organizationalConversion * 0.70) +
                    (taskGraphSummary.direct_exposure_pressure * 0.10) +
                    ((1 - taskGraphSummary.retained_leverage_score) * 0.10) +
                    (taskGraphSummary.exposed_core_share * 0.10),
                    0, 1
                );
            organizationalConversion = clamp(
                (organizationalConversion * 0.50) +
                (organizationalConversionContext * 0.50),
                0, 1
            );
                substitutionPotential = clamp(workflowCompression * organizationalConversion, 0, 1);
                substitutionGap = clamp(workflowCompression - substitutionPotential, 0, 1);
            }
            if (taskDerivedClusterSummaries && roleDefiningWork && taskDerivedClusterSummaries.by_id[roleDefiningWork.task_cluster_id]) {
                var roleDefiningSummary = taskDerivedClusterSummaries.by_id[roleDefiningWork.task_cluster_id];
                roleDefiningWork = Object.assign({}, roleDefiningWork, {
                    share_of_role: roleDefiningSummary.share_of_role,
                    residual_relevance: roleDefiningSummary.retained_share,
                    automation_difficulty: roleDefiningSummary.automation_difficulty,
                    wave_assignment: roleDefiningSummary.wave_assignment,
                    label: roleDefiningSummary.label,
                    is_role_critical: roleDefiningSummary.is_role_critical
                });
            }

            var viabilityTier = toTier(residualViabilityScore, [0.45, 0.68], ['weak', 'moderate', 'strong']);
            var personalizationTier = toTier(personalizationFitScore, [0.45, 0.68], ['weak', 'moderate', 'strong']);
            var exposureLevel = topExposed
                ? (topExposed.exposure_level || toTier(1 - topExposed.automation_difficulty, [0.40, 0.68], ['low', 'moderate', 'high']))
                : 'low';
            var occupationAnchorConfidence = average([
                occupationPrior ? toNumber(occupationPrior.confidence, 0.45) : 0.40,
                selector ? toNumber(selector.selector_weight, 0.50) : 0.50
            ]);
            var personalizationConfidence = average([
                signals.couplingProtection,
                signals.capabilitySignal,
                average((taskDerivedClusterSummaries ? taskDerivedClusterSummaries.current_bundle : currentBundle).map(function (cluster) {
                    return cluster.evidence_confidence;
                }))
            ]);
            var laborContextConfidence = laborContext
                ? toNumber(laborContext.labor_market_confidence, 0.55)
                : 0;

            // --- Derived lists ---
            var currentBundleForOutput = taskDerivedClusterSummaries ? taskDerivedClusterSummaries.current_bundle : currentBundle;
            var exposedClusters = taskDerivedClusterSummaries ? taskDerivedClusterSummaries.exposed_clusters : currentBundle.filter(function (c) {
                return c.wave_assignment === 'current' || c.wave_assignment === 'next';
            }).sort(function (left, right) {
                return left.automation_difficulty - right.automation_difficulty;
            });
            var retainedClusters = taskDerivedClusterSummaries ? taskDerivedClusterSummaries.retained_clusters : currentBundle.filter(function (c) {
                return c.residual_relevance >= 0.055;
            }).sort(function (left, right) {
                return right.residual_relevance - left.residual_relevance;
            });
            var elevatedClusters = taskDerivedClusterSummaries ? taskDerivedClusterSummaries.elevated_clusters : currentBundle.filter(function (c) {
                return c.elevation_boost >= 0.015;
            }).sort(function (left, right) {
                return right.elevation_boost - left.elevation_boost;
            });

            var exposedTaskShare = 0;
            if (taskGraphSummary) {
                exposedTaskShare = Number(clamp(taskGraphSummary.direct_exposure_pressure + (taskGraphSummary.indirect_dependency_pressure * 0.35), 0, 1).toFixed(3));
            }
            var demandExpansionModifier = runtimeContext
                ? clamp(toNumber(runtimeContext.demand_expansion_context, 0.35), 0, 1)
                : (laborContext
                    ? clamp((toNumber(laborContext.projection_growth_pct, 0) + 2) / 10, 0, 1)
                    : 0.35);
            var elevatedShare = sum(elevatedClusters.map(function (cluster) {
                return cluster.elevation_boost;
            }));
            var roleFate;
            var roleSummary;
            var roleFateReadout;
            var taskAccessionMap;
            var publicWorkBundleMap;
            var transitionTriggerMap;
            var seatChangeMap;
            var preStateResidualRoleIntegrity = taskGraphSummary
                ? clamp(toNumber(taskGraphSummary.residual_role_integrity, 0.5), 0, 1)
                : clamp(average([
                    functionMetrics ? toNumber(functionMetrics.retained_function_strength, 0.5) : 0.5,
                    functionMetrics ? toNumber(functionMetrics.retained_accountability_strength, 0.5) : 0.5,
                    functionMetrics ? toNumber(functionMetrics.retained_bargaining_power, 0.5) : 0.5
                ]), 0, 1);

            var taskBreakdownRows = taskGraphSummary ? taskGraphSummary.tasks : [];
            var directTaskEvidenceCount = taskGraphSummary ? taskGraphSummary.direct_evidence_tasks : 0;
            var fallbackTaskCount = taskGraphSummary ? taskGraphSummary.cluster_fallback_tasks : 0;
            taskBreakdownRows.forEach(function (row) {
                if (row.direct_evidence_reliability > 0) {
                    taskDirectReliabilities.push(row.direct_evidence_reliability);
                }
            });
            var totalTaskRows = directTaskEvidenceCount + fallbackTaskCount;
            var directCoverageRatio = taskGraphSummary ? taskGraphSummary.direct_coverage_ratio : (totalTaskRows ? (directTaskEvidenceCount / totalTaskRows) : 0.35);
            var thinEvidenceGuardrail = computeThinEvidenceGuardrail({
                total_task_rows: taskBreakdownRows.length,
                direct_coverage_ratio: directCoverageRatio,
                fallback_task_count: fallbackTaskCount,
                task_first_task_count: taskGraphSummary ? taskGraphSummary.task_first_task_count : 0,
                live_task_evidence_rows: taskGraphSummary && taskGraphSummary.resolved_source_role_counts ? (taskGraphSummary.resolved_source_role_counts.live_task_evidence || 0) : 0,
                reviewed_task_estimate_rows: taskGraphSummary && taskGraphSummary.resolved_source_role_counts ? (taskGraphSummary.resolved_source_role_counts.reviewed_task_estimate || 0) : 0,
                mean_direct_reliability: average(taskDirectReliabilities)
            });
            var dependencyRead = taskGraphSummary
                ? {
                    penalty: taskGraphSummary.dependency_penalty,
                    bindings: taskGraphSummary.binding_dependencies
                }
                : computeDependencyPenalty(currentBundle);
            var dependencyPenalty = clamp(dependencyRead.penalty, 0, 0.5);
            var bindingDependencies = dependencyRead.bindings;
            var recompositionConfidenceBase = clamp(average([
                average(currentBundleForOutput.map(function (cluster) {
                    return cluster.evidence_confidence;
                })),
                occupationAnchorConfidence,
                personalizationConfidence,
                directCoverageRatio
            ]), 0, 1);
            var recompositionConfidence = thinEvidenceGuardrail.active
                ? clamp(recompositionConfidenceBase - (0.10 + (thinEvidenceGuardrail.severity * 0.18)), 0.12, 1)
                : recompositionConfidenceBase;
            var recompositionBandHalfWidth = clamp(
                0.06 +
                ((1 - recompositionConfidence) * 0.18) +
                ((1 - directCoverageRatio) * 0.05) +
                ((1 - occupationAnchorConfidence) * 0.04) +
                (thinEvidenceGuardrail.active ? (0.03 + (thinEvidenceGuardrail.severity * 0.05)) : 0),
                0.06,
                0.24
            );
            var timingConfidenceBase = clamp(average([
                recompositionConfidenceBase,
                occupationAnchorConfidence,
                directCoverageRatio
            ]), 0.12, 0.92);
            var timingConfidence = thinEvidenceGuardrail.active
                ? clamp(timingConfidenceBase - (0.08 + (thinEvidenceGuardrail.severity * 0.18)), 0.10, 0.92)
                : timingConfidenceBase;
            var recompositionSummary = buildRecompositionSummary({
                workflow_compression: workflowCompression,
                organizational_conversion: organizationalConversion,
                substitution_potential: substitutionPotential,
                substitution_gap: substitutionGap
            }, {
                confidence_score: recompositionConfidence,
                band_half_width: recompositionBandHalfWidth,
                dependency_penalty: dependencyPenalty,
                binding_dependencies: bindingDependencies
            });
            var functionMetrics = buildLiveFunctionMetrics({
                taskRows: taskBreakdownRows,
                taskFunctionLinks: taskFunctionLinks,
                activeFunctionRows: activeFunctionRows,
                roleFunctionsById: store.roleFunctionsById,
                functionAccountabilityByFunctionId: store.functionAccountabilityByFunctionId,
                functionSummary: functionSummary,
                signals: signals,
                adaptationPrior: adaptationPrior,
                laborContext: laborContext,
                laborStats: store.laborStats,
                runtimeContext: runtimeContext,
                functionContext: functionContext,
                occupationAdaptive: occupationAdaptive,
                directCoverageRatio: directCoverageRatio,
                recompositionConfidence: recompositionConfidence
            });
            var functionBreakdown = Array.isArray(functionMetrics.per_function_breakdown)
                ? functionMetrics.per_function_breakdown
                : [];
            var functionExposureSpread = 0;
            var functionRetainedStrengthSpread = 0;
            if (functionBreakdown.length > 1) {
                var functionExposureValues = functionBreakdown.map(function (row) {
                    return clamp(toNumber(row.exposure_pressure, 0), 0, 1);
                });
                var functionRetainedStrengthValues = functionBreakdown.map(function (row) {
                    return clamp(toNumber(row.retained_strength, 0), 0, 1);
                });
                functionExposureSpread = Math.max.apply(null, functionExposureValues) - Math.min.apply(null, functionExposureValues);
                functionRetainedStrengthSpread = Math.max.apply(null, functionRetainedStrengthValues) - Math.min.apply(null, functionRetainedStrengthValues);
            }
            publicWorkBundleMap = computePublicWorkBundleMap({
                task_rows: taskBreakdownRows,
                task_function_links: taskFunctionLinks,
                active_function_rows: activeFunctionRows,
                role_functions_by_id: store.roleFunctionsById
            });
            taskBreakdownRows.forEach(function (row) {
                var publicBundle = publicWorkBundleMap[row.task_cluster_id] || null;
                row.public_task_cluster_label = publicBundle && publicBundle.public_label
                    ? publicBundle.public_label
                    : (row.task_cluster_label || slugToLabel(row.task_cluster_id));
                row.public_task_cluster_summary = publicBundle && publicBundle.public_summary
                    ? publicBundle.public_summary
                    : null;
            });
            currentBundleForOutput.forEach(function (row) {
                applyPublicBundleMetadata(row, publicWorkBundleMap);
            });
            exposedClusters.forEach(function (row) {
                applyPublicBundleMetadata(row, publicWorkBundleMap);
            });
            retainedClusters.forEach(function (row) {
                applyPublicBundleMetadata(row, publicWorkBundleMap);
            });
            elevatedClusters.forEach(function (row) {
                applyPublicBundleMetadata(row, publicWorkBundleMap);
            });
            if (topExposed) {
                applyPublicBundleMetadata(topExposed, publicWorkBundleMap);
            }
            if (roleDefiningWork) {
                applyPublicBundleMetadata(roleDefiningWork, publicWorkBundleMap);
            }
            taskAccessionMap = computeTaskAccessionMap({
                current_bundle: currentBundleForOutput,
                exposed_clusters: exposedClusters,
                retained_clusters: retainedClusters,
                elevated_clusters: elevatedClusters,
                public_work_bundles: publicWorkBundleMap,
                function_metrics: functionMetrics,
                demand_expansion_modifier: demandExpansionModifier,
                direct_coverage_ratio: directCoverageRatio,
                recomposition_confidence: recompositionConfidence,
                top_exposed_work: topExposed
            });
            var trajectory = buildTrajectoryLayer({
                taskRows: taskBreakdownRows,
                currentBundle: currentBundleForOutput,
                runtimeContext: runtimeContext,
                adaptationPrior: adaptationPrior,
                functionContext: functionContext,
                functionMetrics: functionMetrics,
                taskAccessionMap: taskAccessionMap,
                effectiveAdoptionPressure: effectiveAdoptionPressure,
                workflowCompression: workflowCompression,
                workflowDecomposability: signals.questionnaireProfile.workflow_decomposability,
                individualUsageContext: individualUsageContext,
                organizationalAdoptionCeiling: organizationalAdoptionCeiling,
                residualRoleIntegrity: preStateResidualRoleIntegrity,
                retainedFunctionStrength: functionMetrics ? toNumber(functionMetrics.retained_function_strength, null) : null,
                retainedAccountabilityStrength: functionMetrics ? toNumber(functionMetrics.retained_accountability_strength, null) : null,
                retainedBargainingPower: functionMetrics ? toNumber(functionMetrics.retained_bargaining_power, null) : null,
                couplingProtection: signals.couplingProtection,
                roleFragmentationRisk: functionMetrics ? toNumber(functionMetrics.role_fragmentation_risk, null) : null,
                functionExposureSpread: functionExposureSpread,
                functionCategorySignals: functionMetrics ? functionMetrics.function_category_signals : null,
                seniority: signals.seniority,
                stateModelControls: input && input.stateModelControls ? input.stateModelControls : null
            });
            var stateTrajectory = buildStateTrajectoryLayer({
                taskRows: taskBreakdownRows,
                currentBundle: currentBundleForOutput,
                taskGraphSummary: taskGraphSummary,
                functionMetrics: functionMetrics,
                functionCategorySignals: functionMetrics ? functionMetrics.function_category_signals : null,
                trajectory: trajectory,
                effectiveAdoptionPressure: effectiveAdoptionPressure,
                workflowCompression: workflowCompression,
                organizationalConversion: organizationalConversion,
                substitutionPotential: substitutionPotential,
                substitutionGap: substitutionGap,
                demandExpansionModifier: demandExpansionModifier,
                economicPressureContext: recompositionContext ? toNumber(recompositionContext.economic_pressure_context, null) : null,
                organizationalAdoptionCeiling: organizationalAdoptionCeiling,
                laborDemandContext: runtimeContext ? toNumber(runtimeContext.labor_demand_context, null) : null,
                laborTightnessContext: runtimeContext ? toNumber(runtimeContext.labor_tightness_context, null) : null,
                medianWageUsd: laborContext ? toNumber(laborContext.median_wage_usd, null) : null,
                topExposedWork: topExposed,
                roleDefiningWork: roleDefiningWork,
                seniority: signals.seniority,
                stateModelControls: input && input.stateModelControls ? input.stateModelControls : null
            });
            var compatibilityWaveTrajectory = buildWaveCompatibilityTrajectory(stateTrajectory);
            var currentCheckpoint = stateTrajectory && stateTrajectory.checkpoints ? stateTrajectory.checkpoints.current : null;
            var nextCheckpoint = stateTrajectory && stateTrajectory.checkpoints ? stateTrajectory.checkpoints.next : null;
            var distantCheckpoint = stateTrajectory && stateTrajectory.checkpoints ? stateTrajectory.checkpoints.distant : null;
            if (!taskGraphSummary) {
                exposedTaskShare = Number(clamp(
                    toNumber(nextCheckpoint && nextCheckpoint.transformed_share, currentWaveAbsorbed),
                    0,
                    1
                ).toFixed(3));
            }
            var timingFrontier = buildTimingFrontierSummary({
                current_bundle: currentBundleForOutput,
                diagnostics: {
                    direct_exposure_pressure: taskGraphSummary ? taskGraphSummary.direct_exposure_pressure : exposedTaskShare,
                    indirect_dependency_pressure: taskGraphSummary ? taskGraphSummary.indirect_dependency_pressure : dependencyPenalty,
                    effective_adoption_pressure: effectiveAdoptionPressure,
                    demand_expansion_modifier: demandExpansionModifier,
                    residual_role_integrity: taskGraphSummary ? taskGraphSummary.residual_role_integrity : checkpointRoleIntegrity(nextCheckpoint),
                    workflow_compression: workflowCompression,
                    organizational_conversion: organizationalConversion,
                    next_wave_retained: checkpointRetainedShare(nextCheckpoint),
                    ai_adoption_context: runtimeContext ? toNumber(runtimeContext.ai_adoption_context, null) : null,
                    adoption_realization_context: runtimeContext ? toNumber(runtimeContext.adoption_realization_context, null) : null,
                    exception_burden: bundleFriction.exception_burden,
                    accountability_load: bundleFriction.accountability_load,
                    retained_accountability_strength: functionMetrics.retained_accountability_strength,
                    retained_bargaining_power: functionMetrics.retained_bargaining_power
                },
                signals: signals,
                function_metrics: functionMetrics,
                organizational_adoption_ceiling: organizationalAdoptionCeiling,
                next_scenario_lift: nextScenarioLift,
                distant_scenario_lift: distantScenarioLift
            });
            primaryDisplacementWave = timingFrontier.primary_displacement_wave || primaryDisplacementWave;
            roleState = deriveCompatibilityRoleState(stateTrajectory);
            residualViabilityScore = clamp(
                checkpointRetainedShare(nextCheckpoint) * 0.45 +
                checkpointRoleIntegrity(nextCheckpoint) * 0.35 +
                signals.functionRetention * 0.10 +
                signals.questionnaireProfile.human_signoff_requirement * 0.05 +
                adoptionFriction * 0.05,
                0, 1
            );
            personalizationFitScore = clamp(
                average([
                    occupationAdaptive,
                    signals.functionRetention,
                    signals.couplingProtection,
                    signals.seniority * 0.30 + signals.capabilitySignal * 0.30 + signals.augmentationFit * 0.40,
                    checkpointRetainedShare(nextCheckpoint),
                    checkpointRoleIntegrity(nextCheckpoint)
                ]),
                0, 1
            );
            roleFate = classifyRoleFate({
                direct_exposure_pressure: taskGraphSummary ? taskGraphSummary.direct_exposure_pressure : exposedTaskShare,
                indirect_dependency_pressure: taskGraphSummary ? taskGraphSummary.indirect_dependency_pressure : dependencyPenalty,
                retained_leverage_score: taskGraphSummary ? taskGraphSummary.retained_leverage_score : residualViabilityScore,
                residual_role_integrity: taskGraphSummary ? taskGraphSummary.residual_role_integrity : checkpointRoleIntegrity(nextCheckpoint),
                exposed_core_share: taskGraphSummary ? taskGraphSummary.exposed_core_share : exposedTaskShare * 0.5,
                retained_core_share: taskGraphSummary ? taskGraphSummary.retained_core_share : checkpointRetainedShare(nextCheckpoint),
                next_checkpoint_retained_share: checkpointRetainedShare(nextCheckpoint),
                next_checkpoint_role_integrity: checkpointRoleIntegrity(nextCheckpoint),
                next_checkpoint_state: nextCheckpoint ? nextCheckpoint.state : '',
                next_wave_retained: checkpointRetainedShare(nextCheckpoint),
                next_wave_integrity: checkpointRoleIntegrity(nextCheckpoint),
                elevated_share: elevatedShare,
                demand_expansion_modifier: demandExpansionModifier,
                role_state: roleState,
                next_wave_state: compatibilityWaveTrajectory.next.state,
                exposed_task_share: exposedTaskShare,
                retained_accountability_strength: functionMetrics.retained_accountability_strength,
                retained_bargaining_power: functionMetrics.retained_bargaining_power,
                role_fragmentation_risk: functionMetrics.role_fragmentation_risk,
                role_compressibility: functionMetrics.role_compressibility,
                delegation_likelihood: functionMetrics.delegation_likelihood,
                headcount_displacement_risk: functionMetrics.headcount_displacement_risk,
                role_transformation_type: functionMetrics.role_transformation_type,
                function_count: functionBreakdown.length,
                function_exposure_spread: functionExposureSpread,
                function_retained_strength_spread: functionRetainedStrengthSpread,
                timing_frontier_compress_score: timingFrontier.triggers && timingFrontier.triggers.compress ? timingFrontier.triggers.compress.readiness_score : null,
                timing_frontier_compress_margin: timingFrontier.triggers && timingFrontier.triggers.compress && timingFrontier.triggers.compress.scenario_margins ? timingFrontier.triggers.compress.scenario_margins.current : null,
                timing_frontier_structural_break_score: timingFrontier.triggers && timingFrontier.triggers.structural_break ? timingFrontier.triggers.structural_break.readiness_score : null,
                timing_frontier_primary_score: timingFrontier.primary_wave_score,
                timing_frontier_primary_wave: timingFrontier.primary_displacement_wave,
                evidence_quality: recompositionConfidence
            });
            transitionTriggerMap = computeTransitionTriggerMap({
                function_metrics: functionMetrics,
                diagnostics: {
                    direct_exposure_pressure: taskGraphSummary ? taskGraphSummary.direct_exposure_pressure : exposedTaskShare,
                    indirect_dependency_pressure: taskGraphSummary ? taskGraphSummary.indirect_dependency_pressure : dependencyPenalty,
                    effective_adoption_pressure: effectiveAdoptionPressure,
                    demand_expansion_modifier: demandExpansionModifier,
                    residual_role_integrity: taskGraphSummary ? taskGraphSummary.residual_role_integrity : checkpointRoleIntegrity(nextCheckpoint),
                    workflow_compression: workflowCompression,
                    organizational_conversion: organizationalConversion,
                    next_wave_retained: checkpointRetainedShare(nextCheckpoint),
                    capability_signal: signals.capabilitySignal,
                    augmentation_fit: signals.augmentationFit,
                    exception_burden: bundleFriction.exception_burden,
                    accountability_load: bundleFriction.accountability_load,
                    direct_coverage_ratio: directCoverageRatio,
                    recomposition_confidence: recompositionConfidence,
                    timing_confidence: timingConfidence,
                    accountability_context_confidence: functionContext ? toNumber(functionContext.accountability_context_confidence, 0.42) : 0.42,
                    bargaining_context_confidence: functionContext ? toNumber(functionContext.bargaining_context_confidence, 0.42) : 0.42,
                    fragmentation_context_confidence: functionContext ? toNumber(functionContext.fragmentation_context_confidence, 0.42) : 0.42,
                    thin_evidence_guardrail_active: thinEvidenceGuardrail.active ? 1 : 0,
                    thin_evidence_guardrail_severity: thinEvidenceGuardrail.severity
                },
                signals: signals,
                task_accession_map: taskAccessionMap,
                retained_clusters: retainedClusters,
                public_work_bundles: publicWorkBundleMap,
                current_bundle: currentBundleForOutput,
                role_fate: roleFate,
                role_defining_work: roleDefiningWork,
                timing_frontier: timingFrontier,
                organizational_adoption_ceiling: organizationalAdoptionCeiling,
                next_scenario_lift: nextScenarioLift,
                distant_scenario_lift: distantScenarioLift
            });
            seatChangeMap = computeSeatChangeMap({
                retained_clusters: retainedClusters,
                task_accession_map: taskAccessionMap,
                public_work_bundles: publicWorkBundleMap,
                retained_share_estimate: checkpointRetainedShare(nextCheckpoint),
                role_fate: roleFate,
                role_defining_work: roleDefiningWork
            });
            if (thinEvidenceGuardrail.active) {
                roleFate.confidence = Number(clamp(
                    roleFate.confidence - (0.10 + (thinEvidenceGuardrail.severity * 0.20)),
                    0.10,
                    0.92
                ).toFixed(3));
            }
            roleFate = mapTrajectoryToLegacyFate(
                trajectory.state,
                trajectory.role_shape,
                roleFate.confidence
            );
            roleSummary = stateTrajectory.headline + '. ' + stateTrajectory.summary + ' In the next checkpoint, the role reads as ' + stateTrajectory.checkpoints.next.state_label.toLowerCase() + ', with ' + Math.round(stateTrajectory.checkpoints.next.transformed_share * 100) + '% of work transformed, demand offset at ' + Math.round(stateTrajectory.checkpoints.next.demand_offset * 100) + '%, and transition pressure at ' + Math.round(stateTrajectory.checkpoints.next.transition_pressure * 100) + '%.';
            if (roleDefiningWork) {
                roleSummary += ' The role-defining work in ' + roleDefiningWork.label.toLowerCase() + ' (' + roleDefiningWork.wave_assignment + ' wave) carries extra weight.';
            }
            if (taskGraphSummary) {
                roleSummary += ' Task-level spillover pressure is ' + toTier(taskGraphSummary.indirect_dependency_pressure, [0.25, 0.5], ['low', 'moderate', 'high']) + '.';
            }
            if (taskAccessionMap && taskAccessionMap.net_role_rebundle_summary) {
                roleSummary += ' ' + taskAccessionMap.net_role_rebundle_summary;
            }
            if (transitionTriggerMap && transitionTriggerMap.summary) {
                roleSummary += ' ' + transitionTriggerMap.summary;
            }
            if (seatChangeMap && seatChangeMap.summary) {
                roleSummary += ' ' + seatChangeMap.summary;
            }
            var liveOccupationExplanation = buildLiveOccupationExplanation({
                occupation: occupation,
                functionMetrics: functionMetrics,
                directTaskPressure: taskGraphSummary ? taskGraphSummary.direct_exposure_pressure : exposedTaskShare,
                indirectDependencyPressure: taskGraphSummary ? taskGraphSummary.indirect_dependency_pressure : dependencyPenalty,
                directCoverageRatio: directCoverageRatio,
                activeFunctionRows: activeFunctionRows,
                roleFunctionsById: store.roleFunctionsById
            });

            var categoryMappings = (store.uiRoleMapByRole[roleCategory] || [])
                .filter(function (row) { return row.onet_soc_code; })
                .slice()
                .sort(function (left, right) {
                    return toNumber(left.fit_rank, 99) - toNumber(right.fit_rank, 99);
                });
            var categoryCandidateRank = null;
            for (var categoryIndex = 0; categoryIndex < categoryMappings.length; categoryIndex += 1) {
                if (categoryMappings[categoryIndex].onet_soc_code === occupation.onet_soc_code) {
                    categoryCandidateRank = categoryIndex + 1;
                    break;
                }
            }

            var occupationAssignment = {
                role_category: roleCategory,
                role_category_label: slugToLabel(roleCategory),
                selected_occupation_id: occupationId,
                selected_occupation_title: occupation.title,
                onet_soc_code: occupation.onet_soc_code || null,
                selector_weight: Number(toNumber(selector.selector_weight, 0.5).toFixed(3)),
                anchor_confidence: Number(occupationAnchorConfidence.toFixed(3)),
                category_candidate_count: categoryMappings.length,
                category_candidate_rank: categoryCandidateRank,
                occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                assignment_method: input.occupationId
                    ? 'Using the occupation you explicitly selected from the mapped launch set.'
                    : 'Using the top mapped occupation for the selected launch category.',
                task_assignment_method: roleComposition.variant_support && roleComposition.variant_support.enabled
                    ? 'The model starts from the selected or recommended reviewed role variant for this occupation, then combines the active O*NET tasks, reviewed public-posting tasks, reviewed role-review tasks, and active function anchors from that baseline before it scores pressure, spillover, and retained leverage.'
                    : 'The model starts from the editable occupation composition, combining selected O*NET tasks, reviewed public-posting tasks, reviewed role-review tasks, and active function anchors before it scores pressure, spillover, and retained leverage.',
                dominant_task_clusters: dominantTaskClusters.map(function (clusterId) {
                    return {
                        task_cluster_id: clusterId,
                        label: slugToLabel(clusterId)
                    };
                }),
                selected_variant: roleComposition.variant_support && roleComposition.variant_support.enabled ? {
                    variant_id: roleComposition.variant_support.selected_variant_id,
                    variant_label: roleComposition.variant_support.selected_variant_label,
                    selection_mode: roleComposition.variant_support.selection_mode,
                    recommended_variant_id: roleComposition.variant_support.recommended_variant_id,
                    recommended_variant_label: roleComposition.variant_support.recommended_variant_label,
                    recommendation_score: roleComposition.variant_support.recommendation_score,
                    recommendation_drivers: roleComposition.variant_support.recommendation_drivers
                } : null,
                selected_task_inputs: {
                    dominant_task_ids: dominantTaskIds,
                    critical_task_ids: criticalTaskIds,
                    ai_support_task_ids: aiSupportTaskIds,
                    support_task_ids: supportTaskIds
                },
                role_defining_cluster: roleDefiningWork ? {
                    task_cluster_id: roleDefiningWork.task_cluster_id,
                    task_cluster_label: roleDefiningWork.task_cluster_label || slugToLabel(roleDefiningWork.task_cluster_id),
                    label: roleDefiningWork.public_label || roleDefiningWork.label,
                    public_summary: roleDefiningWork.public_summary || null
                } : null,
                selected_composition: {
                    variant_id: roleComposition.variant_support ? roleComposition.variant_support.selected_variant_id : null,
                    variant_label: roleComposition.variant_support ? roleComposition.variant_support.selected_variant_label : null,
                    variant_mode: roleComposition.variant_support ? roleComposition.variant_support.selection_mode : 'none',
                    active_task_count: taskInventoryRows.length,
                    active_function_count: activeFunctionRows.length,
                    added_dependency_count: addedDependencyEdges.length,
                    custom_function_link_count: customTaskFunctionLinks.length,
                    active_task_function_link_count: taskFunctionLinks.length,
                    share_override_count: Object.keys(taskShareOverrides).filter(function (taskId) {
                        return !!activeTaskLookup[taskId];
                    }).length,
                    removed_task_count: uniqueStrings(compositionEdits.removed_task_ids || []).length,
                    added_task_count: uniqueStrings(compositionEdits.added_task_ids || []).length,
                    removed_function_count: uniqueStrings(compositionEdits.removed_function_ids || []).length,
                    added_function_count: uniqueStrings(compositionEdits.added_function_ids || []).length,
                    edit_delta: null
                },
                direct_task_evidence_count: directTaskEvidenceCount,
                fallback_task_count: fallbackTaskCount,
                questionnaire_effect: roleComposition.variant_support && roleComposition.variant_support.enabled
                    ? 'Your role-refinement answers can help the model recommend which reviewed role variant is the best starting baseline for this occupation. Your composition edits still determine which tasks and functions are active in the run, and those answers also shape retained function, sign-off burden, substitution pressure, dependency drag, and the continuous timing/state trajectory.'
                    : 'Your composition edits determine which occupation tasks and functions are active in this run. Your role-refinement answers then shape retained function, sign-off burden, substitution pressure, dependency drag, and the continuous timing/state trajectory.'
            };
            if (thinEvidenceGuardrail.active) {
                roleSummary += ' This fate and timing read is less certain because the active role still relies heavily on fallback task structure rather than strong task-level evidence.';
            }

            var evidenceSummary = {
                task_evidence_confidence: average(currentBundleForOutput.map(function (cluster) {
                    return cluster.evidence_confidence;
                })),
                occupation_anchor_confidence: occupationAnchorConfidence,
                personalization_confidence: personalizationConfidence,
                labor_context_confidence: laborContextConfidence,
                friction_dimensions: {
                    exception_burden: Number(bundleFriction.exception_burden.toFixed(3)),
                    accountability_load: Number(bundleFriction.accountability_load.toFixed(3)),
                    judgment_requirement: Number(bundleFriction.judgment_requirement.toFixed(3)),
                    document_intensity: Number(bundleFriction.document_intensity.toFixed(3)),
                    tacit_context_dependence: Number(bundleFriction.tacit_context_dependence.toFixed(3))
                },
                questionnaire_profile_source: signals.questionnaireProfileSource,
                questionnaire_profile: {
                    function_centrality: Number(signals.questionnaireProfile.function_centrality.toFixed(3)),
                    human_signoff_requirement: Number(signals.questionnaireProfile.human_signoff_requirement.toFixed(3)),
                    liability_and_regulatory_burden: Number(signals.questionnaireProfile.liability_and_regulatory_burden.toFixed(3)),
                    relationship_ownership: Number(signals.questionnaireProfile.relationship_ownership.toFixed(3)),
                    exception_and_context_load: Number(signals.questionnaireProfile.exception_and_context_load.toFixed(3)),
                    workflow_decomposability: Number(signals.questionnaireProfile.workflow_decomposability.toFixed(3)),
                    organizational_adoption_readiness: Number(signals.questionnaireProfile.organizational_adoption_readiness.toFixed(3)),
                    ai_observability_of_work: Number(signals.questionnaireProfile.ai_observability_of_work.toFixed(3)),
                    dependency_bottleneck_strength: Number(signals.questionnaireProfile.dependency_bottleneck_strength.toFixed(3)),
                    external_trust_requirement: Number(signals.questionnaireProfile.external_trust_requirement.toFixed(3)),
                    augmentation_fit: Number(signals.questionnaireProfile.augmentation_fit.toFixed(3)),
                    substitution_risk_modifier: Number(signals.questionnaireProfile.substitution_risk_modifier.toFixed(3))
                },
                source_coverage: {
                    occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                    task_prior_rows: currentBundleForOutput.length,
                    exposed_cluster_rows: exposedClusters.length,
                    task_first_cluster_rows: taskFirstClusterCount,
                    task_first_task_rows: taskGraphSummary ? taskGraphSummary.task_first_task_count : 0,
                    direct_task_evidence_rows: directTaskEvidenceCount,
                    live_task_evidence_rows: taskGraphSummary && taskGraphSummary.resolved_source_role_counts ? (taskGraphSummary.resolved_source_role_counts.live_task_evidence || 0) : 0,
                    reviewed_task_estimate_rows: taskGraphSummary && taskGraphSummary.resolved_source_role_counts ? (taskGraphSummary.resolved_source_role_counts.reviewed_task_estimate || 0) : 0,
                    benchmark_task_label_rows: taskGraphSummary && taskGraphSummary.resolved_source_role_counts ? (taskGraphSummary.resolved_source_role_counts.benchmark_task_label || 0) : 0,
                    cluster_proxy_rows: taskGraphSummary && taskGraphSummary.resolved_source_role_counts ? (taskGraphSummary.resolved_source_role_counts.cluster_prior_proxy || 0) : 0,
                    task_evidence_adjusted_rows: taskGraphSummary ? taskGraphSummary.task_evidence_adjusted_tasks : 0,
                    fallback_task_rows: fallbackTaskCount,
                    role_graph_task_rows: taskBreakdownRows.length,
                    dependency_edge_rows: dependencyEdges.length,
                    labor_context_available: !!laborContext
                },
                thin_evidence_guardrail: thinEvidenceGuardrail,
                notes: [
                    occupationPrior ? ('Occupation prior source: ' + occupationPrior.source_id) : 'Occupation prior source: fallback heuristic',
                    'v2.1 task-derived wave model: the baseline difficulty path now promotes task-resolved evidence into cluster baselines when cluster-level task coverage and reliability are strong enough; otherwise cluster priors still seed the difficulty path. Resolved task-level evidence can also alter task difficulty and direct pressure before public wave assignment is recomputed from the task-derived cluster bundle.',
                    'Task-family friction scored across exception burden, accountability load, judgment requirement, document intensity, and tacit/context dependence.',
                    'Task-role graph scoring now adds task-level bargaining weights, default task-to-function bindings, custom task-to-function links, and dependency spillover between support work and exposed core work.',
                    'Cluster priors are still shrunk toward occupation-level priors using evidence confidence, but clusters with strong resolved task-evidence coverage now receive a task-first baseline blend before task rows are scored. `task_source_evidence.csv` continues to resolve reviewed task estimates, benchmark task labels, and live task evidence before proxy fallback at the task row.',
                    'Compatibility wave summary: current=' + compatibilityWaveTrajectory.current.state + ', next=' + compatibilityWaveTrajectory.next.state + ', distant=' + compatibilityWaveTrajectory.distant.state + '. Primary displacement wave: ' + primaryDisplacementWave + '.',
                    'Timing frontier: capability=' + timingFrontier.capability_readiness + ', supervision=' + timingFrontier.supervision_readiness + ', economics=' + timingFrontier.economic_pressure + ', friction=' + timingFrontier.organizational_friction + '.',
                    roleDefiningWork ? ('Role-defining task input: ' + roleDefiningWork.label + ' (wave: ' + roleDefiningWork.wave_assignment + ').') : 'No explicit role-defining task input selected.',
                    roleComposition.variant_support && roleComposition.variant_support.enabled
                        ? ('Role variant baseline: ' + roleComposition.variant_support.selected_variant_label + ' (' + roleComposition.variant_support.selection_mode + ' selection).')
                        : 'Role variant baseline: single occupation baseline.',
                    'Active composition: ' + taskInventoryRows.length + ' tasks and ' + activeFunctionRows.length + ' function anchors after user edits.',
                    'Capability signal=' + Number(signals.capabilitySignal.toFixed(2)) + '; function retention=' + Number(signals.functionRetention.toFixed(2)) + '; questionnaire adoption pressure=' + Number(signals.adoptionPressure.toFixed(2)) + '; effective adoption realization=' + Number(effectiveAdoptionPressure.toFixed(2)) + '.',
                    'Labor-market data is shown as context and does not drive the main role labels.',
                    laborContext ? ('Labor context includes employment=' + laborContext.employment_us + ', median_wage=' + laborContext.median_wage_usd + ', growth=' + laborContext.projection_growth_pct + '%.') : 'Labor context unavailable for this occupation.',
                    laborContext && laborContext.unemployment_group_label ? ('Latest official BLS unemployment for ' + laborContext.unemployment_group_label + ' is ' + laborContext.latest_unemployment_rate + '% (' + laborContext.latest_unemployment_period + ').') : 'No mapped BLS unemployment series for this occupation yet.',
                    runtimeContext ? ('Derived runtime context: demand=' + runtimeContext.demand_expansion_context + ', labor tightness=' + runtimeContext.labor_tightness_context + ', AI adoption=' + runtimeContext.ai_adoption_context + ', adoption realization=' + runtimeContext.adoption_realization_context + '.') : 'Derived runtime demand/adoption context unavailable for this occupation.',
                    recompositionContext ? ('Derived recomposition context: workflow compression=' + recompositionContext.workflow_compression_context + ', organizational conversion=' + recompositionContext.organizational_conversion_context + ', next lift=' + (recompositionContext.next_scenario_lift || recompositionContext.wave_acceleration_context) + ', distant lift=' + (recompositionContext.distant_scenario_lift || recompositionContext.displacement_wave_bias) + '.') : 'Derived recomposition/timing context unavailable for this occupation.',
                    functionContext ? ('Derived function context: accountability=' + functionContext.accountability_context + ', bargaining=' + functionContext.bargaining_power_context + ', fragmentation=' + functionContext.fragmentation_context + '.') : 'Derived function context unavailable for this occupation.'
                ]
            };
            if (thinEvidenceGuardrail.active && thinEvidenceGuardrail.note) {
                evidenceSummary.notes.push(thinEvidenceGuardrail.note);
            }
            if (functionMetrics) {
                evidenceSummary.function_metrics = functionMetrics;
            }
            if (liveOccupationExplanation) {
                evidenceSummary.explanation_summary = liveOccupationExplanation.explanation_summary || '';
                evidenceSummary.review_priority = liveOccupationExplanation.review_priority || null;
                evidenceSummary.evidence_profile = liveOccupationExplanation.evidence_profile || null;
                evidenceSummary.function_anchor_count = toNumber(liveOccupationExplanation.function_anchor_count, 0);
            }

            var result = {
                selected_role_category: roleCategory,
                selected_occupation_id: occupationId,
                selected_occupation_title: occupation.title,
                state_trajectory: stateTrajectory,
                trajectory: trajectory,
                role_outlook: roleState,
                role_outlook_label: ROLE_STATE_LABELS[roleState],
                role_fate_state: roleFate.state,
                role_fate_label: roleFate.label,
                role_fate_confidence: roleFate.confidence,
                role_fate_readout: null,
                fate_drivers: [],
                fate_counterweights: [],
                role_summary: roleSummary,
                occupation_explanation: liveOccupationExplanation,
                questionnaire_profile: evidenceSummary.questionnaire_profile,
                questionnaire_profile_source: signals.questionnaireProfileSource,
                occupation_assignment: occupationAssignment,
                primary_displacement_wave: primaryDisplacementWave,
                primary_displacement_wave_confidence: Number(timingConfidence.toFixed(3)),
                primary_displacement_wave_confidence_label: confidenceLabel(timingConfidence),
                wave_trajectory: compatibilityWaveTrajectory,
                top_exposed_work: topExposed ? {
                    task_cluster_id: topExposed.task_cluster_id,
                    task_cluster_label: topExposed.task_cluster_label || slugToLabel(topExposed.task_cluster_id),
                    label: topExposed.public_label || topExposed.label,
                    public_summary: topExposed.public_summary || null,
                    share_of_role: Number(topExposed.share_of_role.toFixed(3)),
                    automation_difficulty: Number(topExposed.automation_difficulty.toFixed(3)),
                    wave_assignment: topExposed.wave_assignment,
                    exposure_level: exposureLevel
                } : null,
                role_defining_work: roleDefiningWork ? {
                    task_cluster_id: roleDefiningWork.task_cluster_id,
                    task_cluster_label: roleDefiningWork.task_cluster_label || slugToLabel(roleDefiningWork.task_cluster_id),
                    label: roleDefiningWork.public_label || roleDefiningWork.label,
                    public_summary: roleDefiningWork.public_summary || null,
                    share_of_role: Number(roleDefiningWork.share_of_role.toFixed(3)),
                    retained_share: Number(roleDefiningWork.residual_relevance.toFixed(3)),
                    wave_assignment: roleDefiningWork.wave_assignment,
                    automation_difficulty: Number(roleDefiningWork.automation_difficulty.toFixed(3))
                } : null,
                exposed_task_share: Number(exposedTaskShare.toFixed(3)),
                residual_role_strength: viabilityTier,
                personalization_fit: personalizationTier,
                function_metrics: functionMetrics,
                timing_frontier: timingFrontier,
                recomposition_summary: recompositionSummary,
                task_accession_map: taskAccessionMap,
                transition_trigger_map: transitionTriggerMap,
                seat_change_map: seatChangeMap,
                transformation_map: {
                    current_bundle: currentBundleForOutput,
                    exposed_clusters: exposedClusters,
                    retained_clusters: retainedClusters,
                    elevated_clusters: elevatedClusters
                },
                task_breakdown: {
                    total_tasks_considered: taskBreakdownRows.length,
                    direct_evidence_tasks: directTaskEvidenceCount,
                    cluster_fallback_tasks: fallbackTaskCount,
                    user_selected_task_count: taskGraphSummary ? taskGraphSummary.user_selected_task_count : 0,
                    tasks: taskBreakdownRows
                },
                audit_trace: null,
                narrative_summary: null,
                evidence_summary: evidenceSummary,
                labor_market_context: laborContext ? {
                    employment_us: toNumber(laborContext.employment_us, 0),
                    annual_openings: toNumber(laborContext.annual_openings, 0),
                    median_wage_usd: toNumber(laborContext.median_wage_usd, 0),
                    wage_p25_usd: toNumber(laborContext.wage_p25_usd, 0),
                    wage_p75_usd: toNumber(laborContext.wage_p75_usd, 0),
                    projection_growth_pct: toNumber(laborContext.projection_growth_pct, 0),
                    unemployment_group_id: laborContext.unemployment_group_id || null,
                    unemployment_group_label: laborContext.unemployment_group_label || null,
                    unemployment_series_id: laborContext.unemployment_series_id || null,
                    latest_unemployment_rate: laborContext.latest_unemployment_rate !== undefined && laborContext.latest_unemployment_rate !== '' ? toNumber(laborContext.latest_unemployment_rate, null) : null,
                    latest_unemployment_period: laborContext.latest_unemployment_period || null,
                    demand_expansion_context: runtimeContext ? toNumber(runtimeContext.demand_expansion_context, null) : null,
                    labor_demand_context: runtimeContext ? toNumber(runtimeContext.labor_demand_context, null) : null,
                    labor_tightness_context: runtimeContext ? toNumber(runtimeContext.labor_tightness_context, null) : null,
                    ai_adoption_context: runtimeContext ? toNumber(runtimeContext.ai_adoption_context, null) : null,
                    adoption_realization_context: runtimeContext ? toNumber(runtimeContext.adoption_realization_context, null) : null,
                    context_confidence: runtimeContext ? toNumber(runtimeContext.context_confidence, null) : null,
                    btos_covered_sector_share: runtimeContext ? toNumber(runtimeContext.btos_covered_sector_share, null) : null,
                    workflow_compression_context: recompositionContext ? toNumber(recompositionContext.workflow_compression_context, null) : null,
                    organizational_conversion_context: recompositionContext ? toNumber(recompositionContext.organizational_conversion_context, null) : null,
                    next_scenario_lift: recompositionContext ? toNumber(recompositionContext.next_scenario_lift, null) : null,
                    distant_scenario_lift: recompositionContext ? toNumber(recompositionContext.distant_scenario_lift, null) : null,
                    organizational_adoption_ceiling: recompositionContext ? toNumber(recompositionContext.organizational_adoption_ceiling, null) : null,
                    economic_pressure_context: recompositionContext ? toNumber(recompositionContext.economic_pressure_context, null) : null,
                    wave_acceleration_context: recompositionContext ? toNumber(recompositionContext.wave_acceleration_context, null) : null,
                    displacement_wave_bias: recompositionContext ? toNumber(recompositionContext.displacement_wave_bias, null) : null,
                    recomposition_context_confidence: recompositionContext ? toNumber(recompositionContext.recomposition_context_confidence, null) : null,
                    monthly_unemployment_series: unemploymentSeries.map(function (row) {
                        return {
                            year: toNumber(row.year, 0),
                            month: toNumber(row.month, 0),
                            month_label: row.month_label,
                            unemployment_rate: row.unemployment_rate !== undefined && row.unemployment_rate !== '' ? toNumber(row.unemployment_rate, null) : null,
                            is_missing: String(row.is_missing || '') === '1'
                        };
                    })
                } : null,
                diagnostics: {
                    occupation_prior_source: occupationPrior ? occupationPrior.source_id : null,
                    occupation_prior_automation: Number(occupationAutomation.toFixed(3)),
                    occupation_prior_adaptive_capacity: Number(occupationAdaptive.toFixed(3)),
                    bundle_prior_concentration: Number(bundlePriorConcentration.toFixed(3)),
                    mean_cluster_prior_reliability: Number(average(clusterPriorReliabilities).toFixed(3)),
                    mean_task_direct_reliability: Number(average(taskDirectReliabilities).toFixed(3)),
                    task_first_cluster_count: taskFirstClusterCount,
                    task_first_task_count: taskGraphSummary ? taskGraphSummary.task_first_task_count : 0,
                    task_evidence_adjusted_tasks: taskGraphSummary ? taskGraphSummary.task_evidence_adjusted_tasks : 0,
                    workflow_compression: Number(workflowCompression.toFixed(3)),
                    organizational_conversion: Number(organizationalConversion.toFixed(3)),
                    substitution_potential: Number(substitutionPotential.toFixed(3)),
                    substitution_gap: Number(substitutionGap.toFixed(3)),
                    recomposition_confidence: Number(recompositionConfidence.toFixed(3)),
                    timing_confidence: Number(timingConfidence.toFixed(3)),
                    dependency_penalty: Number(dependencyPenalty.toFixed(3)),
                    role_fate_confidence: roleFate.confidence,
                    demand_expansion_modifier: Number(demandExpansionModifier.toFixed(3)),
                    adoption_pressure: Number(signals.adoptionPressure.toFixed(3)),
                    effective_adoption_pressure: Number(effectiveAdoptionPressure.toFixed(3)),
                    workflow_compression_context: recompositionContext ? Number(toNumber(recompositionContext.workflow_compression_context, 0).toFixed(3)) : null,
                    organizational_conversion_context: recompositionContext ? Number(toNumber(recompositionContext.organizational_conversion_context, 0).toFixed(3)) : null,
                    next_scenario_lift: recompositionContext ? Number(toNumber(recompositionContext.next_scenario_lift, 0).toFixed(3)) : null,
                    distant_scenario_lift: recompositionContext ? Number(toNumber(recompositionContext.distant_scenario_lift, 0).toFixed(3)) : null,
                    organizational_adoption_ceiling: recompositionContext ? Number(toNumber(recompositionContext.organizational_adoption_ceiling, 0).toFixed(3)) : null,
                    economic_pressure_context: recompositionContext ? Number(toNumber(recompositionContext.economic_pressure_context, 0).toFixed(3)) : null,
                    wave_acceleration_context: recompositionContext ? Number(toNumber(recompositionContext.wave_acceleration_context, 0).toFixed(3)) : null,
                    displacement_wave_bias: recompositionContext ? Number(toNumber(recompositionContext.displacement_wave_bias, 0).toFixed(3)) : null,
                    accountability_context: functionContext ? Number(toNumber(functionContext.accountability_context, 0).toFixed(3)) : null,
                    bargaining_power_context: functionContext ? Number(toNumber(functionContext.bargaining_power_context, 0).toFixed(3)) : null,
                    fragmentation_context: functionContext ? Number(toNumber(functionContext.fragmentation_context, 0).toFixed(3)) : null,
                    accountability_context_confidence: functionContext ? Number(toNumber(functionContext.accountability_context_confidence, 0).toFixed(3)) : null,
                    bargaining_context_confidence: functionContext ? Number(toNumber(functionContext.bargaining_context_confidence, 0).toFixed(3)) : null,
                    fragmentation_context_confidence: functionContext ? Number(toNumber(functionContext.fragmentation_context_confidence, 0).toFixed(3)) : null,
                    demand_expansion_context: runtimeContext ? Number(toNumber(runtimeContext.demand_expansion_context, 0).toFixed(3)) : null,
                    labor_demand_context: runtimeContext ? Number(toNumber(runtimeContext.labor_demand_context, 0).toFixed(3)) : null,
                    labor_tightness_context: runtimeContext ? Number(toNumber(runtimeContext.labor_tightness_context, 0).toFixed(3)) : null,
                    ai_adoption_context: runtimeContext ? Number(toNumber(runtimeContext.ai_adoption_context, 0).toFixed(3)) : null,
                    adoption_realization_context: runtimeContext ? Number(toNumber(runtimeContext.adoption_realization_context, 0).toFixed(3)) : null,
                    capability_signal: Number(signals.capabilitySignal.toFixed(3)),
                    coupling_protection: Number(signals.couplingProtection.toFixed(3)),
                    function_retention: Number(signals.functionRetention.toFixed(3)),
                    augmentation_fit: Number(signals.augmentationFit.toFixed(3)),
                    substitution_risk_modifier: Number(signals.substitutionRiskModifier.toFixed(3)),
                    direct_exposure_pressure: taskGraphSummary ? Number(taskGraphSummary.direct_exposure_pressure.toFixed(3)) : null,
                    indirect_dependency_pressure: taskGraphSummary ? Number(taskGraphSummary.indirect_dependency_pressure.toFixed(3)) : null,
                    residual_role_integrity: taskGraphSummary ? Number(taskGraphSummary.residual_role_integrity.toFixed(3)) : null,
                    retained_accountability_strength: functionMetrics ? Number(toNumber(functionMetrics.retained_accountability_strength, 0).toFixed(3)) : null,
                    retained_bargaining_power: functionMetrics ? Number(toNumber(functionMetrics.retained_bargaining_power, 0).toFixed(3)) : null,
                    role_fragmentation_risk: functionMetrics ? Number(toNumber(functionMetrics.role_fragmentation_risk, 0).toFixed(3)) : null,
                    role_compressibility: functionMetrics ? Number(toNumber(functionMetrics.role_compressibility, 0).toFixed(3)) : null,
                    delegation_likelihood: functionMetrics ? Number(toNumber(functionMetrics.delegation_likelihood, 0).toFixed(3)) : null,
                    headcount_displacement_risk: functionMetrics ? Number(toNumber(functionMetrics.headcount_displacement_risk, 0).toFixed(3)) : null,
                    role_transformation_type: functionMetrics ? String(functionMetrics.role_transformation_type || '') : null,
                    function_anchor_count: functionBreakdown.length,
                    function_exposure_spread: Number(functionExposureSpread.toFixed(3)),
                    function_retained_strength_spread: Number(functionRetainedStrengthSpread.toFixed(3)),
                    accession_confidence: taskAccessionMap ? Number(toNumber(taskAccessionMap.accession_confidence, 0).toFixed(3)) : null,
                    accession_cluster_count: taskAccessionMap ? taskAccessionMap.accession_clusters.length : 0,
                    shrinking_cluster_count: taskAccessionMap ? taskAccessionMap.shrinking_clusters.length : 0,
                    decisive_trigger_id: transitionTriggerMap ? transitionTriggerMap.decisive_trigger_id : null,
                    bargaining_cliff_stage: transitionTriggerMap ? transitionTriggerMap.bargaining_cliff_stage : null,
                    timing_frontier_primary_constraint: timingFrontier ? timingFrontier.primary_binding_constraint : null,
                    net_seat_effect_label: seatChangeMap ? seatChangeMap.net_seat_effect_label : null,
                    task_coverage_gap: taskRoleProfile ? (String(taskRoleProfile.coverage_gap_flag || '').toLowerCase() === 'true' ? 1 : 0) : null,
                    exception_burden: Number(bundleFriction.exception_burden.toFixed(3)),
                    accountability_load: Number(bundleFriction.accountability_load.toFixed(3)),
                    judgment_requirement: Number(bundleFriction.judgment_requirement.toFixed(3)),
                    document_intensity: Number(bundleFriction.document_intensity.toFixed(3)),
                    tacit_context_dependence: Number(bundleFriction.tacit_context_dependence.toFixed(3)),
                    thin_evidence_guardrail_active: thinEvidenceGuardrail.active ? 1 : 0,
                    thin_evidence_guardrail_severity: Number(thinEvidenceGuardrail.severity.toFixed(3)),
                    primary_displacement_wave: primaryDisplacementWave,
                    current_checkpoint_state: currentCheckpoint ? currentCheckpoint.state : null,
                    next_checkpoint_state: nextCheckpoint ? nextCheckpoint.state : null,
                    distant_checkpoint_state: distantCheckpoint ? distantCheckpoint.state : null,
                    current_checkpoint_retained_share: currentCheckpoint ? Number(checkpointRetainedShare(currentCheckpoint).toFixed(3)) : null,
                    next_checkpoint_retained_share: nextCheckpoint ? Number(checkpointRetainedShare(nextCheckpoint).toFixed(3)) : null,
                    distant_checkpoint_retained_share: distantCheckpoint ? Number(checkpointRetainedShare(distantCheckpoint).toFixed(3)) : null,
                    current_checkpoint_role_integrity: currentCheckpoint ? Number(checkpointRoleIntegrity(currentCheckpoint).toFixed(3)) : null,
                    next_checkpoint_role_integrity: nextCheckpoint ? Number(checkpointRoleIntegrity(nextCheckpoint).toFixed(3)) : null,
                    distant_checkpoint_role_integrity: distantCheckpoint ? Number(checkpointRoleIntegrity(distantCheckpoint).toFixed(3)) : null,
                    current_wave_state: compatibilityWaveTrajectory.current.state,
                    next_wave_state: compatibilityWaveTrajectory.next.state,
                    next_wave_retained: compatibilityWaveTrajectory.next.retained_share,
                    next_wave_coherence: compatibilityWaveTrajectory.next.coherence,
                    personalization_fit_score: Number(personalizationFitScore.toFixed(3)),
                    residual_role_strength_score: Number(residualViabilityScore.toFixed(3))
                },
                likely_role_state: roleState,
                likely_role_state_label: ROLE_STATE_LABELS[roleState],
                top_exposed_task_cluster: topExposed ? topExposed.label : 'Unknown',
                residual_role_viability: viabilityTier
            };
            roleFateReadout = buildRoleFateReadout(result);
            result.role_fate_readout = roleFateReadout;
            result.fate_drivers = roleFateReadout.drivers;
            result.fate_counterweights = roleFateReadout.counterweights;
            result.narrative_summary = buildNarrative(result);
            result.audit_trace = buildAuditTrace(result);
            if (!input._skipCompositionDeltaBaseline &&
                hasMaterialCompositionEdits(compositionEdits, addedDependencyEdges, customTaskFunctionLinks)) {
                var baselineInput = Object.assign({}, input, {
                    occupationId: occupationId,
                    roleCategory: roleCategory,
                    roleVariantId: roleComposition.variant_support ? roleComposition.variant_support.selected_variant_id : (input.roleVariantId || null),
                    compositionEdits: {},
                    dependencyEdits: {},
                    _skipCompositionDeltaBaseline: true
                });
                var baselineResult = computeResult(baselineInput);
                result.occupation_assignment.selected_composition.edit_delta = buildCompositionEditDelta(
                    result,
                    baselineResult,
                    result.occupation_assignment.selected_composition
                );
            }
            return result;
        }

        // ---------------------------------------------------------------------------
        // Input-perturbation sensitivity band
        //
        // computeResultWithBand runs the engine three times: once nominal, once with
        // all questionnaire answers shifted +1 Likert step (or profile values +0.25),
        // once shifted -1 step (or -0.25). The resulting spread on six key metrics is
        // returned as sensitivity_band on the nominal result. It is an input-sensitivity
        // band, not a probability interval — it shows how much the output moves when
        // the user's answers are off by one step, which is a realistic precision limit
        // for self-reported questionnaire data.
        // ---------------------------------------------------------------------------

        function perturbRawAnswers(answers, delta) {
            var out = {};
            Object.keys(answers).forEach(function (k) {
                var v = toNumber(answers[k], 3);
                out[k] = Math.max(1, Math.min(5, Math.round(v + delta)));
            });
            return out;
        }

        function perturbProfileValues(profile, delta) {
            if (!profile) { return profile; }
            var out = {};
            Object.keys(profile).forEach(function (k) {
                out[k] = clamp(toNumber(profile[k], 0.5) + delta, 0, 1);
            });
            return out;
        }

        function extractBandMetrics(result) {
            var d = result && result.diagnostics;
            return {
                residual_role_strength_score: d ? toNumber(d.residual_role_strength_score, null) : null,
                exposed_task_share: result ? toNumber(result.exposed_task_share, null) : null,
                next_checkpoint_role_integrity: d ? toNumber(d.next_checkpoint_role_integrity, null) : null,
                distant_checkpoint_role_integrity: d ? toNumber(d.distant_checkpoint_role_integrity, null) : null,
                next_checkpoint_retained_share: d ? toNumber(d.next_checkpoint_retained_share, null) : null,
                distant_checkpoint_retained_share: d ? toNumber(d.distant_checkpoint_retained_share, null) : null
            };
        }

        function computeResultWithBand(input) {
            var hasAnswers = !!(input.answers && Object.keys(input.answers).length);
            var hasProfile = !!input.questionnaireProfile;

            var upperInput = null;
            var lowerInput = null;

            if (hasAnswers) {
                upperInput = Object.assign({}, input, {
                    answers: perturbRawAnswers(input.answers, 1),
                    _skipCompositionDeltaBaseline: true
                });
                lowerInput = Object.assign({}, input, {
                    answers: perturbRawAnswers(input.answers, -1),
                    _skipCompositionDeltaBaseline: true
                });
            } else if (hasProfile) {
                upperInput = Object.assign({}, input, {
                    questionnaireProfile: perturbProfileValues(input.questionnaireProfile, 0.25),
                    _skipCompositionDeltaBaseline: true
                });
                lowerInput = Object.assign({}, input, {
                    questionnaireProfile: perturbProfileValues(input.questionnaireProfile, -0.25),
                    _skipCompositionDeltaBaseline: true
                });
            }

            var nominal = computeResult(input);

            if (!upperInput || !lowerInput) {
                nominal.sensitivity_band = null;
                return nominal;
            }

            var upper = null;
            var lower = null;
            try { upper = computeResult(upperInput); } catch (e) { upper = null; }
            try { lower = computeResult(lowerInput); } catch (e) { lower = null; }

            var nomMetrics = extractBandMetrics(nominal);
            var upperMetrics = upper ? extractBandMetrics(upper) : null;
            var lowerMetrics = lower ? extractBandMetrics(lower) : null;

            var band = {
                perturbation_step: hasAnswers ? 1 : 0.25,
                perturbation_unit: hasAnswers ? 'raw_answer_step' : 'profile_delta'
            };
            Object.keys(nomMetrics).forEach(function (key) {
                var values = [nomMetrics[key]];
                if (upperMetrics && upperMetrics[key] !== null) { values.push(upperMetrics[key]); }
                if (lowerMetrics && lowerMetrics[key] !== null) { values.push(lowerMetrics[key]); }
                values = values.filter(function (v) { return v !== null; });
                band[key + '_lo'] = values.length ? Number(Math.min.apply(null, values).toFixed(3)) : null;
                band[key + '_hi'] = values.length ? Number(Math.max.apply(null, values).toFixed(3)) : null;
            });

            nominal.sensitivity_band = band;
            return nominal;
        }

        return {
            getOccupationCandidates: function (roleCategory, limit) {
                return resolveCandidates(roleCategory, limit || 3);
            },
            listOccupations: function (limit) {
                var rows = Object.keys(store.occupationsById)
                    .map(function (occupationId) {
                        var occupation = store.occupationsById[occupationId];
                        var selector = store.selectorByOcc[occupationId] || {};

                        return {
                            occupation_id: occupation.occupation_id,
                            onet_soc_code: occupation.onet_soc_code,
                            title: occupation.title,
                            role_family: occupation.role_family,
                            selector_weight: toNumber(selector.selector_weight, 0.5),
                            search_blob: selector.search_blob || occupation.title.toLowerCase()
                        };
                    })
                    .sort(function (left, right) {
                        return right.selector_weight - left.selector_weight;
                    });

                return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
            },
            searchOccupations: function (query, limit, roleCategory) {
                var normalizedQuery = String(query || '').trim().toLowerCase();
                var rows = this.listOccupations();

                if (roleCategory) {
                    rows = rows.filter(function (row) {
                        return row.role_family === roleCategory;
                    });
                }

                if (!normalizedQuery) {
                    return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
                }

                rows = rows
                    .map(function (row) {
                        var title = String(row.title || '').toLowerCase();
                        var searchBlob = String(row.search_blob || '').toLowerCase();
                        var score = 0;

                        if (title === normalizedQuery) {
                            score += 100;
                        } else if (title.indexOf(normalizedQuery) === 0) {
                            score += 60;
                        } else if (title.indexOf(normalizedQuery) !== -1) {
                            score += 40;
                        }

                        if (searchBlob.indexOf(normalizedQuery) !== -1) {
                            score += 20;
                        }

                        score += row.selector_weight * 10;

                        return {
                            score: score,
                            row: row
                        };
                    })
                    .filter(function (entry) { return entry.score > 0; })
                    .sort(function (left, right) {
                        return right.score - left.score;
                    })
                    .map(function (entry) { return entry.row; });

                return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
            },
            getOccupationById: function (occupationId) {
                return store.occupationsById[occupationId] || null;
            },
            getTaskInventory: function (occupationId, limit) {
                var rows = (store.taskInventoryByOcc[occupationId] || []).slice().sort(function (left, right) {
                    var rightScore = average([
                        toNumber(right.time_share_prior, 0),
                        toNumber(right.bargaining_power_weight, 0),
                        toNumber(right.value_centrality, 0)
                    ]);
                    var leftScore = average([
                        toNumber(left.time_share_prior, 0),
                        toNumber(left.bargaining_power_weight, 0),
                        toNumber(left.value_centrality, 0)
                    ]);
                    return rightScore - leftScore;
                });

                return typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows;
            },
            getRoleComposition: function (occupationId, options) {
                return getRoleComposition(occupationId, options);
            },
            computeResult: computeResult,
            computeResultWithBand: computeResultWithBand,
            getDataSummary: function () {
                return {
                    occupations: Object.keys(store.occupationsById).length,
                    roleCategories: Object.keys(store.uiRoleMapByRole).length,
                    occupationTaskClusterRows: store.occupationTaskClusters.length,
                    taskPriorRows: store.taskPriors.length,
                    roleFunctionRows: store.roleFunctions.length,
                    roleVariantRows: sum(Object.keys(store.roleVariantsByOcc || {}).map(function (occupationKey) {
                        return (store.roleVariantsByOcc[occupationKey] || []).length;
                    }))
                };
            }
        };
    }

    async function create(options) {
        var opts = options || {};
        var basePath = opts.basePath || '';
        var loaded = {};
        var keys = Object.keys(DATA_FILES);

        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            loaded[key] = await loadCsv(normalizePath(basePath, DATA_FILES[key]));
        }

        var occupationsById = indexBy(loaded.occupations, 'occupation_id');
        var occupationsBySoc = loaded.occupations.reduce(function (map, row) {
            map[row.onet_soc_code] = row;
            return map;
        }, {});

        return createEngine({
            occupationsById: occupationsById,
            occupationsBySoc: occupationsBySoc,
            selectorByOcc: indexBy(loaded.selector, 'occupation_id'),
            occupationTaskClusters: loaded.occupationTaskClusters,
            occupationTaskClustersByOcc: groupBy(loaded.occupationTaskClusters, 'occupation_id'),
            taskInventoryByOcc: groupBy(loaded.occupationTaskInventory, 'occupation_id'),
            roleVariantsByOcc: groupBy(loaded.roleVariants.map(normalizeRoleVariantRow), 'occupation_id'),
            taskDependencyEdgesByOcc: groupBy(loaded.taskDependencyEdges, 'occupation_id'),
            taskRoleProfilesByOcc: indexBy(loaded.occupationTaskRoleProfiles, 'occupation_id'),
            roleFunctions: loaded.roleFunctions,
            roleFunctionsById: indexBy(loaded.roleFunctions, 'function_id'),
            occupationFunctionMapByOcc: groupBy(loaded.occupationFunctionMap, 'occupation_id'),
            functionAccountabilityByFunctionId: indexBy(loaded.functionAccountabilityProfiles, 'function_id'),
            taskFunctionEdgesByTaskId: groupBy(loaded.taskFunctionEdges, 'task_id'),
            taskSourceEvidenceByTaskId: groupBy(loaded.taskSourceEvidence, 'task_id'),
            taskMembershipByKey: loaded.taskMembership.reduce(function (map, row) {
                var key = taskKey(row.occupation_id, row.onet_task_id);
                var current = map[key];
                if (!current || toNumber(row.mapping_confidence, 0) >= toNumber(current.mapping_confidence, 0)) {
                    map[key] = row;
                }
                return map;
            }, {}),
            taskEvidenceByKey: loaded.taskEvidence.reduce(function (map, row) {
                var key = taskKey(row.occupation_id, row.onet_task_id);
                var current = map[key];
                var rowPriority = anthropicSourcePriority(row && row.source_id);
                var currentPriority = anthropicSourcePriority(current && current.source_id);
                if (!current ||
                    rowPriority > currentPriority ||
                    (rowPriority === currentPriority && toNumber(row.confidence, 0) >= toNumber(current.confidence, 0))) {
                    map[key] = row;
                }
                return map;
            }, {}),
            taskPriors: loaded.taskPriors,
            taskPriorsByOcc: groupBy(loaded.taskPriors, 'occupation_id'),
            occupationPriorsByOcc: groupBy(loaded.occupationPriors, 'occupation_id'),
            adaptationByOcc: indexBy(loaded.occupationAdaptationPriors, 'occupation_id'),
            laborByOcc: indexBy(loaded.laborContext, 'occupation_id'),
            demandAdoptionContextByOcc: indexBy(loaded.occupationDemandAdoptionContext, 'occupation_id'),
            individualAiUsageContextByOcc: indexBy(loaded.occupationIndividualAiUsageContext, 'occupation_id'),
            recompositionContextByOcc: indexBy(loaded.occupationRecompositionContext, 'occupation_id'),
            functionContextByOcc: indexBy(loaded.occupationFunctionContext, 'occupation_id'),
            laborStats: computeLaborStats(loaded.laborContext),
            unemploymentByGroup: groupBy(loaded.unemploymentMonthly, 'unemployment_group_id'),
            uiRoleMapByRole: groupRoleMap(loaded.uiRoleMap)
        });
    }

    return {
        create: create,
        ROLE_STATE_LABELS: ROLE_STATE_LABELS,
        ROLE_FATE_LABELS: ROLE_FATE_LABELS,
        WAVE_STATE_LABELS: WAVE_STATE_LABELS,
        DATA_FILES: DATA_FILES
    };
});
