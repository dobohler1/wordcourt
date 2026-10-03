/* WordCourt adaptive planner, v0.1 (shadow). Pure, deterministic: rows in, rows out. No model, no clock, no I/O.
   Not loaded by index.html in Phase 3; the private analyst script imports it to write wc_plans rows with shadow = true.
   Contract: docs/WordCourt_Adaptive_Planner_Sep20.html §6 (PlanRequest, Plan, PlanBlock, Skipped, ReasonCode); behaviors §9 are tests/planner.test.mjs. */

export const PLANNER_VERSION = '0.1-shadow';

const NEW_CONCEPT_KINDS = new Set(['lesson', 'word_expose']);
const HEAVY_TIMED = new Set(['pacing_set', 'section_timed', 'full_test']);
const SELF_SERVE = new Set(['vocab_session', 'word_expose', 'word_review', 'production', 'drill', 'mastery_check', 'pacing_set', 'card', 'probe', 'error_log', 'correction']);

export const DEFAULT_POLICY = {
  target: 0.90, secure_threshold: 0.90, retention_risk_threshold: 0.30, value_floor_per_minute: 0.02, min_block_minutes: 3,
  diagnose_confidence: 0.6, diagnose_cost_ratio: 1 / 3, prereq_confidence: 0.6, start_rate_floor: 0.4, declined_days: 7,
  taper_days: 10, consolidation_days: 21, voi_weight: 1.0, off_limits: [], vocab_floor_minutes: 0,
};

const byId = (arr, key = 'id') => Object.fromEntries((arr || []).map(x => [x[key], x]));
const sortKey = (c) => `${c.action}|${(c.target_node_ids || []).join(',')}|${c.candidate_id}`;

export function phaseFor(forDate, testDate, policy) {
  const days = Math.round((Date.parse(testDate) - Date.parse(forDate)) / 864e5);
  if (days <= policy.taper_days) return 'taper';
  if (days <= policy.consolidation_days) return 'consolidation';
  return 'acquisition';
}

function domainWeight(inputs, domainId) {
  let w = 0;
  for (const t of inputs.targets || []) for (const s of t.sections || []) for (const d of s.domains || []) if (d.domain_id === domainId) w += (d.n_items || 0) * (t.weight ?? 1);
  return w;
}

function template(code, args) {
  switch (code) {
    case 'GAP': return `${args.node_id} is at ${args.estimate.toFixed(2)} against ${args.target.toFixed(2)} and carries ${args.weight} items`;
    case 'VOI': return `the result decides between ${args.decides.join(' and ')}`;
    case 'DUE': return `${args.n} words due, ${(args.p_forget * 100).toFixed(0)}% likely to be forgotten before the next chance`;
    case 'GATE': return `${args.pending} pending ${args.what} on ${args.ref}`;
    case 'PREREQ': return `${args.dependent} is blocked by ${args.prereq}`;
    case 'RETENTION': return `${args.node_id} last seen ${args.last_exposure_at}, ${args.probes} probes`;
    case 'PHASE': return `${args.phase} phase`;
    case 'BEATS': return `outranked ${args.candidate} (${args.per_minute.toFixed(3)} points per minute)`;
    case 'FLOOR': return `coach floor: ${args.what}`;
    case 'CHECK_DUE': return `lesson ${args.lesson} delivered, check untaken`;
    case 'BINDING': return `binding constraint: ${args.binding}`;
    default: return code;
  }
}

function makeBlock(c, idx) {
  return {
    order: idx + 1, assignment_id: c.assignment_id ?? null, candidate_id: c.candidate_id, action: c.action, kind_id: c.kind_id, target_node_ids: c.target_node_ids,
    level_moved: c.level_moved, specific: c.specific || {}, est_minutes: c.est_minutes, currency: c.currency,
    value: { raw_points_mid: round3(c.value.raw_points_mid), p_survives: c.value.p_survives, voi: c.value.voi, per_minute: round3(c.value.per_minute) },
    reason_codes: c.reason_codes, reason: c.reason_codes.map(r => template(r.code, r.args)).join('; '),
    beat: c.beat || [], success_criterion: c.success_criterion, produces_evidence: c.produces_evidence, source: c.source, source_ref: c.source_ref ?? null,
  };
}
const round3 = x => Math.round(x * 1000) / 1000;

/** Build every candidate the rules and the accepted proposals generate, before feasibility or scoring. */
export function candidates(request, inputs, policy) {
  const out = [];
  const state = inputs.state || [];                       // [{subject_type, subject_id, level, estimate, status, params}]
  const exec = {}, speed = {}, knowledgeFailing = new Set(), teachWanted = new Set(), prereqBlocks = {};   // node -> estimate
  for (const r of state) if (r.subject_type === 'skill') { if (r.level === 'execution') exec[r.subject_id] = r.estimate; if (r.level === 'speed') speed[r.subject_id] = r.estimate; }
  const nodes = byId(inputs.nodes || [], 'node_id');       // [{node_id, domain_id, label, lesson_n, requires}]
  const lessons = inputs.lessons || {};                    // node_id -> {delivered, check_taken}
  const retention = inputs.retention || {};                // node_id -> {p_forget, last_exposure_at, probes}
  const content = inputs.content || [];                    // [{set_id, kind_id, node_ids, conditions, minutes}]
  const findings = (inputs.findings || []).filter(f => f.status === 'active');
  const met = new Set((inputs.outcomes || []).filter(o => o.outcome === 'met').flatMap(o => o.finding_ids || []));
  const metNodes = new Set((inputs.outcomes || []).filter(o => o.outcome === 'met').map(o => o.node_id));
  for (const f of findings) {
    if (met.has(f.id)) continue;
    if (f.finding_type === 'missing_concept') { teachWanted.add(f.subject_id); if (f.confidence >= policy.prereq_confidence) knowledgeFailing.add(f.subject_id); }
    if (f.finding_type === 'prerequisite_weakness' && f.confidence >= policy.prereq_confidence && f.detail?.mechanism?.prerequisite) prereqBlocks[f.subject_id] = f.detail.mechanism.prerequisite;
  }
  for (const [n, l] of Object.entries(lessons)) if (l.delivered === false) knowledgeFailing.add(n);
  const setsFor = (nodeId, kind) => content.filter(s => s.kind_id === kind && (s.node_ids || []).includes(nodeId));

  // 1. pending error logs, gating
  for (const p of inputs.pending?.logs || []) out.push({
    candidate_id: `rule:error_log:${p.run_id}`, action: 'error_log', kind_id: 'error_log', target_node_ids: p.node_ids || [], level_moved: 'strategy', currency: 'scrap',
    est_minutes: Math.max(2, 2 * (p.pending || 1)), source: 'rule', gating: true, specific: { run_id: p.run_id, set_id: p.set_id },
    value: { raw_points_mid: 0.5, p_survives: 1, voi: 0.5 }, reason_codes: [{ code: 'GATE', args: { pending: p.pending || 1, what: 'log lines', ref: p.set_id || p.run_id } }],
    success_criterion: { metric: 'accuracy', node_id: (p.node_ids || [])[0] || 'learner', level: 'strategy', threshold: 1, n_items: p.pending || 1, conditions: 'untimed', within_days: 2 }, produces_evidence: ['reflection'],
  });
  // 2. analyst proposals (status proposed or accepted; in shadow mode proposals are accepted-by-default)
  for (const p of inputs.proposals || []) {
    const isDiag = p.kind_id === 'probe' || p.urgency;
    out.push({
      candidate_id: `analyst:${p.assignment_id}`, assignment_id: p.assignment_id, action: p.action || (isDiag ? 'diagnose' : actionForKind(p.kind_id)), kind_id: p.kind_id,
      target_node_ids: p.target_node_ids || [], level_moved: p.level_moved || levelForKind(p.kind_id), currency: p.currency, coach_required: !!p.coach_required,
      est_minutes: p.est_minutes, source: 'analyst', source_ref: p.assignment_id, specific: p.specific || {}, urgency: p.urgency || null, confidence: p.confidence ?? 1, decides: p.decides || null,
      value: { raw_points_mid: p.expected_benefit?.raw_points_mid ?? 0, p_survives: p.expected_benefit?.p_survives_to_test ?? 0.8, voi: p.voi ?? 0 },
      reason_codes: [{ code: 'VOI', args: { decides: p.decides || ['the proposal'] } }].filter(() => (p.voi ?? 0) > 0).concat(p.target_node_ids?.[0] && exec[p.target_node_ids[0]] != null ? [{ code: 'GAP', args: { node_id: p.target_node_ids[0], estimate: exec[p.target_node_ids[0]], target: policy.target, weight: domainWeight(inputs, nodes[p.target_node_ids[0]]?.domain_id) } }] : []),
      success_criterion: p.success_criterion, if_fails: p.if_fails, for_finding_ids: p.for_finding_ids || [], produces_evidence: producesFor(p.kind_id),
    });
  }
  // 3. rule candidates per node with execution state
  for (const [nodeId, est] of Object.entries(exec).sort()) {
    const node = nodes[nodeId] || { node_id: nodeId };
    const weight = domainWeight(inputs, node.domain_id);
    const risk = retention[nodeId]?.p_forget ?? 0;
    const gap = { code: 'GAP', args: { node_id: nodeId, estimate: est, target: policy.target, weight } };
    if (metNodes.has(nodeId)) {
      if (request.phase !== 'acquisition') out.push(ruleCand('probe', 'probe', nodeId, 'retention', 'scrap', 4, { raw_points_mid: weight * 0.02, p_survives: 1, voi: 0.2 }, [{ code: 'RETENTION', args: { node_id: nodeId, last_exposure_at: retention[nodeId]?.last_exposure_at || 'recently', probes: retention[nodeId]?.probes || 0 } }], 'probe_pass', nodeId, 'retention', 2, 3, 'probe'));
      continue;
    }
    if (est >= policy.secure_threshold && risk < policy.retention_risk_threshold) {
      out.push({ candidate_id: `rule:none:${nodeId}`, action: 'no_work', kind_id: null, target_node_ids: [nodeId], est_minutes: 0, skip: 'secure', detail: `demonstrated ${est.toFixed(2)}, retention risk ${risk.toFixed(2)}`, value: { raw_points_mid: 0, p_survives: 1, voi: 0, per_minute: 0 } });
      continue;
    }
    const headroom = Math.max(0, Math.min(policy.target - est, 0.25));
    const prereq = prereqBlocks[nodeId];
    if (prereq) {
      out.push(ruleCand('remediate_prerequisite', 'drill', prereq, 'execution', 'scrap', 8, { raw_points_mid: weight * headroom * 0.8, p_survives: 0.8, voi: 0 }, [{ code: 'PREREQ', args: { dependent: nodeId, prereq } }, gap], 'accuracy', prereq, 'execution', 0.75, 4, 'drill'));
      out.push({ candidate_id: `rule:practice:${nodeId}`, action: 'targeted_practice', kind_id: 'drill', target_node_ids: [nodeId], est_minutes: 8, skip: 'blocked_by_prereq', detail: `blocked by ${prereq}`, value: { raw_points_mid: 0, p_survives: 0, voi: 0, per_minute: 0 } });
      continue;
    }
    if (knowledgeFailing.has(nodeId)) {
      const l = lessons[nodeId] || {};
      if (!l.delivered) {
        out.push(ruleCand('teach', 'lesson', nodeId, 'knowledge', 'block', 25, { raw_points_mid: weight * headroom, p_survives: 0.8, voi: 0 }, [gap, { code: 'BINDING', args: { binding: 'knowledge' } }], 'check_score', nodeId, 'execution', 4, 5, 'lesson', true));
        out.push({ candidate_id: `rule:practice:${nodeId}`, action: 'targeted_practice', kind_id: 'drill', target_node_ids: [nodeId], est_minutes: 8, skip: 'teach_first', detail: 'knowledge is the lowest failing level; no lesson delivered yet', value: { raw_points_mid: 0, p_survives: 0, voi: 0, per_minute: 0 } });
        out.push({ candidate_id: `rule:timed:${nodeId}`, action: 'timed_practice', kind_id: 'pacing_set', target_node_ids: [nodeId], est_minutes: 10, skip: 'teach_first', detail: 'knowledge is the lowest failing level', value: { raw_points_mid: 0, p_survives: 0, voi: 0, per_minute: 0 } });
        continue;
      }
      if (!l.check_taken) {
        out.push(ruleCand('mastery_check', 'mastery_check', nodeId, 'execution', 'scrap', 8, { raw_points_mid: weight * headroom * 0.6, p_survives: 0.9, voi: 0.5 }, [{ code: 'CHECK_DUE', args: { lesson: node.lesson_n ?? nodeId } }, gap], 'check_score', nodeId, 'execution', 4, 5, 'check'));
        out.push({ candidate_id: `rule:practice:${nodeId}`, action: 'targeted_practice', kind_id: 'drill', target_node_ids: [nodeId], est_minutes: 8, skip: 'teach_first', detail: 'lesson delivered; its check is untaken', value: { raw_points_mid: 0, p_survives: 0, voi: 0, per_minute: 0 } });
        continue;
      }
    }
    const l = lessons[nodeId];
    if (teachWanted.has(nodeId) && !(l && l.delivered)) {
      out.push(ruleCand('teach', 'lesson', nodeId, 'knowledge', 'block', 25, { raw_points_mid: weight * headroom, p_survives: 0.8, voi: 0 }, [gap, { code: 'BINDING', args: { binding: 'knowledge' } }], 'check_score', nodeId, 'execution', 4, 5, 'lesson', true));
    }
    if (l && l.delivered && !l.check_taken) {
      out.push(ruleCand('mastery_check', 'mastery_check', nodeId, 'execution', 'scrap', 8, { raw_points_mid: weight * headroom * 0.6, p_survives: 0.9, voi: 0.5 }, [{ code: 'CHECK_DUE', args: { lesson: node.lesson_n ?? nodeId } }, gap], 'check_score', nodeId, 'execution', 4, 5, 'check'));
    }
    if (est >= 0.5 && est < 0.85) {
      const sets = setsFor(nodeId, 'drill');
      out.push(ruleCand('targeted_practice', 'drill', nodeId, 'execution', 'scrap', sets[0]?.minutes || 8, { raw_points_mid: weight * headroom * 0.7, p_survives: 0.8, voi: 0.1 }, [gap], 'accuracy', nodeId, 'execution', 0.8, 6, 'drill', false, sets[0]?.set_id, sets.length === 0));
    }
    if (est >= 0.7 && (speed[nodeId] ?? 1) < 0.8) {
      const sets = setsFor(nodeId, 'pacing_set');
      out.push(ruleCand('timed_practice', 'pacing_set', nodeId, 'speed', 'scrap', sets[0]?.minutes || 10, { raw_points_mid: weight * Math.max(0, 0.8 - (speed[nodeId] ?? 0)) * 0.5, p_survives: 0.85, voi: 0.1 }, [gap, { code: 'BINDING', args: { binding: 'clock' } }], 'within_budget', nodeId, 'speed', 0.8, 8, 'pacing', false, sets[0]?.set_id, sets.length === 0));
    }
    if (est < 0.5 && !knowledgeFailing.has(nodeId)) {
      const probes = setsFor(nodeId, 'probe');
      out.push(ruleCand('diagnose', 'probe', nodeId, 'information', 'scrap', probes[0]?.minutes || 5, { raw_points_mid: weight * headroom * 0.3, p_survives: 1, voi: 0.6 }, [gap, { code: 'VOI', args: { decides: ['a card', 'a lesson'] } }], 'probe_pass', nodeId, 'execution', 2, 4, 'probe', false, probes[0]?.set_id, probes.length === 0));
    }
  }
  // 4. vocabulary
  const v = inputs.vocab || {};
  if ((v.due || 0) > 0) out.push(ruleCand('spaced_review', 'word_review', [], 'retention', 'scrap', Math.min(10, Math.max(3, Math.ceil((v.due || 0) / 3))), { raw_points_mid: (v.due || 0) * (v.p_forget ?? 0.5) * 0.05 * (v.weight ?? 1), p_survives: 0.9, voi: 0 }, [{ code: 'DUE', args: { n: v.due, p_forget: v.p_forget ?? 0.5 } }], 'accuracy', 'vocab', 'retention', 0.8, v.due, 'review'));
  if ((v.new_available || 0) > 0 && (v.due || 0) < 10) out.push(ruleCand('vocabulary_acquisition', 'word_expose', [], 'knowledge', 'scrap', 5, { raw_points_mid: 0.3 * (v.weight ?? 1), p_survives: 0.6, voi: 0 }, [{ code: 'PHASE', args: { phase: request.phase } }], 'accuracy', 'vocab', 'knowledge', 0.8, 4, 'expose'));
  // 5. full test, only through the gate
  if (inputs.gate?.full_test_requested) {
    if (inputs.gate.full_test_ok) out.push(ruleCand('full_test_simulation', 'full_test', [], 'test', 'block', 170, { raw_points_mid: 3, p_survives: 1, voi: 0.9 }, [{ code: 'GATE', args: { pending: 0, what: 'gate conditions', ref: 'full_test' } }], 'accuracy', 'learner', 'test', 0.9, 160, 'test', true));
    else out.push({ candidate_id: 'rule:full_test', action: 'full_test_simulation', kind_id: 'full_test', target_node_ids: [], est_minutes: 170, skip: 'gate', detail: inputs.gate.reason || 'gate rule unmet', value: { raw_points_mid: 3, p_survives: 1, voi: 0.9, per_minute: 0.02 } });
  }
  return out;
}

function ruleCand(action, kind, nodeIds, level, currency, minutes, value, codes, metric, scNode, scLevel, threshold, nItems, tag, coachRequired = false, setId = null, noContent = false) {
  const targets = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
  return { candidate_id: `rule:${tag}:${targets.join('+') || 'all'}`, action, kind_id: kind, target_node_ids: targets, level_moved: level, currency, coach_required: coachRequired, est_minutes: minutes,
    source: 'rule', value, reason_codes: codes, specific: setId ? { set_id: setId } : {}, no_content: noContent,
    success_criterion: { metric, node_id: scNode, level: scLevel, threshold, n_items: nItems, conditions: metric === 'within_budget' ? 'timed' : metric === 'probe_pass' ? 'probe' : 'untimed', within_days: 7 }, produces_evidence: producesFor(kind) };
}
function actionForKind(k) { return ({ lesson: 'teach', card: 'teach', probe: 'diagnose', drill: 'targeted_practice', pacing_set: 'pacing_intervention', mastery_check: 'mastery_check', correction: 'correct_previous_error', platform_correction: 'correct_previous_error', word_review: 'spaced_review', word_expose: 'vocabulary_acquisition', vocab_session: 'spaced_review', section_timed: 'timed_section', full_test: 'full_test_simulation', practice_set: 'targeted_practice', production: 'vocabulary_acquisition', error_log: 'error_log' })[k] || 'targeted_practice'; }
function levelForKind(k) { return ({ lesson: 'knowledge', card: 'strategy', probe: 'information', drill: 'execution', pacing_set: 'speed', mastery_check: 'execution', correction: 'knowledge', platform_correction: 'knowledge', word_review: 'retention', word_expose: 'knowledge', section_timed: 'test', full_test: 'test' })[k] || 'execution'; }
function producesFor(k) { return ({ probe: ['probe'], mastery_check: ['check_score'], pacing_set: ['attempts', 'run_pacing'], section_timed: ['attempts', 'run_pacing'], full_test: ['attempts'], word_review: ['answers'], word_expose: ['answers'], vocab_session: ['answers'], error_log: ['reflection'], lesson: ['check_score'] })[k] || ['attempts']; }

/** Feasibility filters, then scoring, then packing. Returns the Plan. */
export function plan(request, inputs, policyIn = {}) {
  const policy = { ...DEFAULT_POLICY, ...policyIn };
  const kinds = byId(inputs.kinds || []);
  const nextTest = (inputs.targets || []).map(t => t.date).sort()[0];
  const phase = request.phase || (nextTest ? phaseFor(request.for_date, nextTest, policy) : 'acquisition');
  const req = { ...request, phase };
  const all = candidates(req, inputs, policy);
  const declined = new Set((inputs.declined || []).filter(d => d.days_ago == null || d.days_ago < policy.declined_days).map(d => `${d.kind_id}:${(d.target_node_ids || []).join('+')}`));
  const startRates = inputs.start_rates || {};
  const prev = byId((inputs.previous_plan?.blocks || []), 'candidate_id');
  const skipped = [], feasible = [];
  for (const c of all) {
    if (c.skip) { skipped.push(skipRow(c, c.skip, c.detail)); continue; }
    const kind = kinds[c.kind_id] || {};
    const coachRequired = c.coach_required || !!kind.coach_required;
    const kindCurrency = kind.currency || (coachRequired ? 'block' : 'either');
    if (request.currency === 'scrap' && (coachRequired || kindCurrency === 'block' || c.currency === 'block')) { skipped.push(skipRow(c, 'wrong_currency', 'needs the coach or a block')); continue; }
    if (c.no_content) { skipped.push(skipRow(c, 'no_content', 'no set or probe registered for these nodes and conditions; item spec requested')); continue; }
    if (phase === 'taper' && NEW_CONCEPT_KINDS.has(c.kind_id)) { skipped.push(skipRow(c, 'taper', 'no new concepts inside the taper window')); continue; }
    if (declined.has(`${c.kind_id}:${c.target_node_ids.join('+')}`)) { skipped.push(skipRow(c, 'declined_recently', 'declined by the coach within 7 days')); continue; }
    const sr = startRates[c.kind_id]?.[request.currency];
    if (sr === 0) { skipped.push(skipRow(c, 'low_start_rate', `0% start rate for ${c.kind_id} in ${request.currency} over 14 days`)); continue; }
    if (policy.off_limits.some(n => c.target_node_ids.includes(n))) { skipped.push(skipRow(c, 'secure', 'off-limits by coach policy')); continue; }
    if (c.action === 'timed_practice' && c.target_node_ids[0] && (inputs.state || []).some(r => r.subject_type === 'skill' && r.level === 'execution' && r.subject_id === c.target_node_ids[0] && r.estimate < 0.7)) { skipped.push(skipRow(c, 'gate', 'execution under 0.7; timed work would be noise')); continue; }
    const discount = sr != null && sr < policy.start_rate_floor ? sr : 1;
    const minutes = Math.max(1, c.est_minutes);
    const v = (c.value.raw_points_mid * (c.value.p_survives ?? 1) + policy.voi_weight * (c.value.voi ?? 0)) * discount;
    c.value = { ...c.value, per_minute: v / minutes };
    if (discount < 1) c.reason_codes = [...c.reason_codes, { code: 'FLOOR', args: { what: `start rate ${(sr * 100).toFixed(0)}% discounts this ${c.kind_id}` } }];
    feasible.push(c);
  }
  // diagnose-before-teach: a diagnostic cheaper than a third of the lesson it decides, with confidence < 0.6, outranks the lesson
  for (const d of feasible.filter(c => c.action === 'diagnose')) {
    for (const t of feasible.filter(c => c.action === 'teach' && c.target_node_ids.some(n => d.target_node_ids.includes(n)))) {
      if ((d.confidence ?? 0.5) < policy.diagnose_confidence && d.est_minutes <= policy.diagnose_cost_ratio * t.est_minutes) { t.skip = 'diagnose_first'; t.detail = `${d.candidate_id} costs ${d.est_minutes} min and decides whether this ${t.est_minutes}-min lesson is needed`; }
    }
  }
  // block currency with coach-required work above the floor: vocabulary and other self-serve work is suppressed
  if (request.currency === 'block' && request.coach_present) {
    const needsCoach = feasible.filter(c => !c.skip && (c.coach_required || kinds[c.kind_id]?.coach_required) && c.value.per_minute >= policy.value_floor_per_minute);
    if (needsCoach.length) for (const c of feasible) if (!c.skip && (c.kind_id === 'word_review' || c.kind_id === 'word_expose' || c.kind_id === 'vocab_session')) { c.skip = 'wrong_currency'; c.detail = 'never spend a block on scrap work'; }
  }
  const ranked = feasible.filter(c => !c.skip).sort((a, b) => (b.value.per_minute - a.value.per_minute) || sortKey(a).localeCompare(sortKey(b)));
  for (const c of feasible.filter(c => c.skip)) skipped.push(skipRow(c, c.skip, c.detail));
  // packing
  let left = request.minutes_available; const chosen = []; let heavy = 0;
  const gating = ranked.filter(c => c.gating || c.urgency === 'before_next_block');
  const rest = ranked.filter(c => !(c.gating || c.urgency === 'before_next_block'));
  for (const c of [...gating, ...rest]) {
    const isGate = c.gating || c.urgency === 'before_next_block';
    if (!isGate && c.value.per_minute < policy.value_floor_per_minute) { skipped.push(skipRow(c, 'below_floor', `${c.value.per_minute.toFixed(3)} per minute is under the floor`)); continue; }
    if (c.est_minutes > left || c.est_minutes < policy.min_block_minutes && !isGate) { skipped.push(skipRow(c, 'does_not_fit', `${c.est_minutes} min does not fit in the ${left} left`)); continue; }
    if (request.currency === 'scrap' && HEAVY_TIMED.has(c.kind_id) && heavy >= 1) { skipped.push(skipRow(c, 'does_not_fit', 'at most one heavy timed block per scrap session')); continue; }
    if (HEAVY_TIMED.has(c.kind_id)) heavy++;
    c.beat = rest.filter(o => o !== c && !o.gating && o.value.per_minute < c.value.per_minute).slice(0, 3).map(o => ({ candidate_id: o.candidate_id, action: o.action, per_minute: round3(o.value.per_minute) }));
    if (c.beat.length) c.reason_codes = [...c.reason_codes, { code: 'BEATS', args: { candidate: c.beat[0].candidate_id, per_minute: c.beat[0].per_minute } }];
    if (!c.reason_codes.length) c.reason_codes = [{ code: 'PHASE', args: { phase } }];
    chosen.push(c); left -= c.est_minutes;
  }
  // ordering: gating first; heavy timed after short retrieval work
  const ordered = [...chosen.filter(c => c.gating || c.urgency === 'before_next_block'), ...chosen.filter(c => !(c.gating || c.urgency === 'before_next_block') && !HEAVY_TIMED.has(c.kind_id)), ...chosen.filter(c => !(c.gating || c.urgency === 'before_next_block') && HEAVY_TIMED.has(c.kind_id))];
  const blocks = ordered.map((c, i) => { const b = makeBlock(c, i); if (b.assignment_id == null && prev[c.candidate_id]?.assignment_id != null) b.assignment_id = prev[c.candidate_id].assignment_id; return b; });
  const planned = blocks.reduce((s, b) => s + b.est_minutes, 0);
  const retire = (inputs.outcomes || []).filter(o => o.outcome === 'met').flatMap(o => o.finding_ids || []);
  const fallbacks = (inputs.outcomes || []).filter(o => o.outcome === 'unmet' && o.if_fails?.next_kind_id).map(o => ({ from_assignment_id: o.assignment_id, kind_id: o.if_fails.next_kind_id, target_node_ids: o.if_fails.target_node_ids || [o.node_id].filter(Boolean), note: o.if_fails.note || '', status: 'proposed', made_by_kind: 'rule' }));
  return {
    plan_id: null, learner_id: request.learner_id, for_date: request.for_date, currency: request.currency, minutes_available: request.minutes_available, minutes_planned: planned,
    minutes_returned: request.minutes_available - planned, phase, blocks,
    skipped: skipped.sort((a, b) => (b.per_minute - a.per_minute) || a.candidate_id.localeCompare(b.candidate_id)),
    expected: { raw_points_mid: round3(blocks.reduce((s, b) => s + b.value.raw_points_mid * b.value.p_survives, 0)), voi: round3(blocks.reduce((s, b) => s + b.value.voi, 0)) },
    inputs: { state_watermark: request.state_watermark || null, findings_used: (inputs.findings || []).filter(f => f.status === 'active').map(f => f.id), proposals_used: (inputs.proposals || []).map(p => p.assignment_id), policy_version: request.policy_version || null, planner_version: PLANNER_VERSION },
    retire, fallback_proposals: fallbacks, created_at: request.now,
  };
}
function skipRow(c, code, detail) { return { candidate_id: c.candidate_id, action: c.action, target_node_ids: c.target_node_ids || [], est_minutes: c.est_minutes, per_minute: round3(c.value?.per_minute ?? 0), reason_code: code, detail: detail || '' }; }
