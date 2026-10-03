// The 15 behavioral requirements of docs/WordCourt_Adaptive_Planner_Sep20.html §9, each against a fixed fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import { plan, PLANNER_VERSION } from '../planner.js';

const KINDS = [
  { id: 'vocab_session', currency: 'scrap', coach_required: false, typical_minutes: 15 }, { id: 'word_expose', currency: 'scrap', coach_required: false, typical_minutes: 5 },
  { id: 'word_review', currency: 'scrap', coach_required: false, typical_minutes: 7 }, { id: 'drill', currency: 'scrap', coach_required: false, typical_minutes: 10 },
  { id: 'mastery_check', currency: 'scrap', coach_required: false, typical_minutes: 8 }, { id: 'pacing_set', currency: 'scrap', coach_required: false, typical_minutes: 12 },
  { id: 'card', currency: 'scrap', coach_required: false, typical_minutes: 3 }, { id: 'lesson', currency: 'block', coach_required: true, typical_minutes: 25 },
  { id: 'full_test', currency: 'block', coach_required: true, typical_minutes: 170 }, { id: 'probe', currency: 'scrap', coach_required: false, typical_minutes: 5 },
  { id: 'error_log', currency: 'scrap', coach_required: false, typical_minutes: 4 }, { id: 'platform_correction', currency: 'block', coach_required: true, typical_minutes: 30 },
];
const TARGETS = [{ test: 'ISEE', date: '2026-11-21', weight: 1, sections: [
  { section_id: 'ISEE:quantitative_reasoning', domains: [{ domain_id: 'qc', n_items: 19 }, { domain_id: 'qr-word-problems', n_items: 18 }] },
  { section_id: 'ISEE:mathematics_achievement', domains: [{ domain_id: 'math-data', n_items: 10 }, { domain_id: 'math-algebra', n_items: 13 }, { domain_id: 'math-number', n_items: 12 }] },
  { section_id: 'ISEE:verbal_reasoning', domains: [{ domain_id: 'synonyms', n_items: 19 }] },
] }];
const NODES = [
  { node_id: 'percent-change', domain_id: 'math-number', lesson_n: 1 }, { node_id: 'prob-mult', domain_id: 'math-data', lesson_n: 2 }, { node_id: 'prob-basic', domain_id: 'math-data' },
  { node_id: 'qc-cannot-determine', domain_id: 'qc', lesson_n: 7 }, { node_id: 'function-notation', domain_id: 'math-algebra', lesson_n: 5 }, { node_id: 'chart-read', domain_id: 'math-data' },
];
const st = (id, level, estimate) => ({ subject_type: 'skill', subject_id: id, level, estimate, status: 'estimated' });
const base = () => ({
  kinds: KINDS, targets: TARGETS, nodes: NODES,
  state: [st('percent-change', 'execution', 0.92), st('prob-mult', 'execution', 0.40), st('qc-cannot-determine', 'execution', 0.55), st('qc-cannot-determine', 'speed', 0.5), st('chart-read', 'execution', 0.70)],
  retention: { 'percent-change': { p_forget: 0.1 } }, lessons: {}, findings: [], proposals: [], pending: { logs: [] }, vocab: { due: 18, p_forget: 0.6, new_available: 20 },
  content: [{ set_id: 'pq1', kind_id: 'drill', node_ids: ['prob-mult', 'chart-read'], minutes: 8 }, { set_id: 'pace_qc_2', kind_id: 'pacing_set', node_ids: ['qc-cannot-determine', 'chart-read'], minutes: 12 }, { set_id: 'lesson7_qc_check', kind_id: 'mastery_check', node_ids: ['qc-cannot-determine'], minutes: 8 }],
  start_rates: {}, gate: {}, outcomes: [], declined: [],
});
const scrap = (over = {}) => ({ learner_id: 'u1', for_date: '2026-10-06', currency: 'scrap', minutes_available: 31, coach_present: false, now: '2026-10-06T00:00:00Z', policy_version: 'p1', ...over });
const block = (over = {}) => scrap({ currency: 'block', minutes_available: 90, coach_present: true, ...over });
const skippedFor = (p, nodeId, code) => p.skipped.find(s => s.target_node_ids.includes(nodeId) && s.reason_code === code);
const blocksOn = (p, nodeId) => p.blocks.filter(b => b.target_node_ids.includes(nodeId));

test('1 secure node gets no practice and is listed skipped: secure', () => {
  const p = plan(scrap(), base());
  assert.equal(blocksOn(p, 'percent-change').length, 0);
  assert.ok(skippedFor(p, 'percent-change', 'secure'));
});

test('2 knowledge failing: no practice or timed work before a lesson and its check exist', () => {
  const inp = base(); inp.findings = [{ id: 1, status: 'active', finding_type: 'missing_concept', subject_id: 'prob-mult', confidence: 0.7, detail: {} }];
  inp.state.push(st('prob-mult', 'speed', 0.3));
  let p = plan(scrap(), inp);
  assert.equal(blocksOn(p, 'prob-mult').filter(b => b.kind_id !== 'probe').length, 0);
  assert.ok(skippedFor(p, 'prob-mult', 'teach_first'));
  inp.lessons = { 'prob-mult': { delivered: true, check_taken: false } };
  p = plan(scrap(), inp);
  assert.ok(blocksOn(p, 'prob-mult').every(b => b.kind_id === 'mastery_check'));
  inp.lessons = { 'prob-mult': { delivered: true, check_taken: true } };
  p = plan(scrap(), inp);
  assert.ok(!skippedFor(p, 'prob-mult', 'teach_first'));
});

test('3 cheap diagnostic under confidence 0.6 outranks the lesson it decides: diagnose_first', () => {
  const inp = base(); inp.findings = [{ id: 2, status: 'active', finding_type: 'missing_concept', subject_id: 'function-notation', confidence: 0.45, detail: {} }];
  inp.state.push(st('function-notation', 'execution', 0.3));
  inp.proposals = [{ assignment_id: 11, kind_id: 'probe', target_node_ids: ['function-notation'], currency: 'scrap', est_minutes: 4, confidence: 0.45, voi: 0.6, decides: ['micro_card 5m', 'lesson 25m'],
    expected_benefit: { raw_points_mid: 1, p_survives_to_test: 1 }, success_criterion: { metric: 'probe_pass', node_id: 'function-notation', level: 'execution', threshold: 3, n_items: 4, conditions: 'untimed', within_days: 7 }, if_fails: { next_kind_id: 'lesson', note: '' } }];
  const p = plan(block(), inp);
  assert.ok(p.blocks.some(b => b.assignment_id === 11 && b.action === 'diagnose'));
  assert.ok(skippedFor(p, 'function-notation', 'diagnose_first'));
});

test('4 prerequisite finding at >= 0.6: work the prerequisite, skip the dependent: blocked_by_prereq', () => {
  const inp = base(); inp.findings = [{ id: 3, status: 'active', finding_type: 'prerequisite_weakness', subject_id: 'prob-mult', confidence: 0.65, detail: { mechanism: { prerequisite: 'prob-basic' } } }];
  inp.content.push({ set_id: 'pb1', kind_id: 'drill', node_ids: ['prob-basic'], minutes: 6 });
  const p = plan(scrap(), inp);
  assert.ok(p.blocks.some(b => b.target_node_ids.includes('prob-basic') && b.action === 'remediate_prerequisite'));
  assert.equal(blocksOn(p, 'prob-mult').length, 0);
  assert.ok(skippedFor(p, 'prob-mult', 'blocked_by_prereq'));
});

test('5 scrap has no coach-required kind; block with coach-required work has no vocabulary', () => {
  const inp = base(); inp.findings = [{ id: 4, status: 'active', finding_type: 'missing_concept', subject_id: 'prob-mult', confidence: 0.8, detail: {} }];
  const ps = plan(scrap(), inp);
  assert.ok(ps.blocks.every(b => !KINDS.find(k => k.id === b.kind_id)?.coach_required));
  assert.ok(ps.skipped.some(s => s.reason_code === 'wrong_currency'));
  const pb = plan(block(), inp);
  assert.ok(pb.blocks.some(b => b.kind_id === 'lesson'));
  assert.ok(pb.blocks.every(b => !['word_review', 'word_expose', 'vocab_session'].includes(b.kind_id)));
});

test('6 minutes with no candidate above the floor are returned and said so', () => {
  const inp = base(); inp.state = [st('percent-change', 'execution', 0.95)]; inp.vocab = { due: 0, new_available: 0 }; inp.content = [];
  const p = plan(scrap({ minutes_available: 20 }), inp);
  assert.equal(p.blocks.length, 0); assert.equal(p.minutes_returned, 20); assert.equal(p.minutes_planned, 0);
});

test('7 every block has a reason code, a success criterion, and a beaten alternative when one existed', () => {
  const p = plan(scrap(), base());
  assert.ok(p.blocks.length >= 2);
  for (const b of p.blocks) { assert.ok(b.reason_codes.length >= 1); assert.ok(b.success_criterion && b.success_criterion.metric); assert.ok(b.reason.length > 0); }
  const nonGating = p.blocks.filter(b => b.action !== 'error_log');
  assert.ok(nonGating.slice(0, -1).every(b => b.beat.length >= 1));
});

test('8 pending logs on a finished set come first', () => {
  const inp = base(); inp.pending = { logs: [{ run_id: 'r1', set_id: 'pace_qc_2', pending: 2, node_ids: ['qc-cannot-determine'] }] };
  const p = plan(scrap(), inp);
  assert.equal(p.blocks[0].action, 'error_log'); assert.equal(p.blocks[0].reason_codes[0].code, 'GATE');
});

test('9 gate unmet: no full test regardless of value', () => {
  const inp = base(); inp.gate = { full_test_requested: true, full_test_ok: false, reason: 'ISEE #4 corrections unfinished' };
  const p = plan(block({ minutes_available: 180 }), inp);
  assert.ok(!p.blocks.some(b => b.kind_id === 'full_test'));
  assert.ok(p.skipped.some(s => s.action === 'full_test_simulation' && s.reason_code === 'gate'));
  inp.gate.full_test_ok = true;
  assert.ok(plan(block({ minutes_available: 400 }), inp).blocks.some(b => b.kind_id === 'full_test'));
});

test('10 a kind with a 0% start-rate in this currency is not planned in it', () => {
  const inp = base(); inp.start_rates = { word_review: { scrap: 0 } };
  const p = plan(scrap(), inp);
  assert.ok(!p.blocks.some(b => b.kind_id === 'word_review'));
  assert.ok(p.skipped.some(s => s.reason_code === 'low_start_rate'));
});

test('11 same inputs twice: identical plan', () => {
  const a = JSON.stringify(plan(scrap(), base())), b = JSON.stringify(plan(scrap(), base()));
  assert.equal(a, b);
});

test('12 new evidence changes only the blocks whose value changed; unchanged blocks keep assignment ids', () => {
  const inp = base();
  const first = plan(scrap(), inp);
  first.blocks.forEach((b, i) => { b.assignment_id = 100 + i; });
  const inp2 = { ...base(), previous_plan: first };
  inp2.state = inp2.state.map(r => r.subject_id === 'chart-read' && r.level === 'execution' ? { ...r, estimate: 0.95 } : r);
  const second = plan(scrap(), inp2);
  const kept = second.blocks.filter(b => first.blocks.some(f => f.candidate_id === b.candidate_id));
  assert.ok(kept.length >= 1);
  for (const b of kept) assert.equal(b.assignment_id, first.blocks.find(f => f.candidate_id === b.candidate_id).assignment_id);
  assert.ok(!second.blocks.some(b => b.target_node_ids.includes('chart-read')));
});

test('13 taper window: no new-concept candidate', () => {
  const inp = base(); inp.findings = [{ id: 5, status: 'active', finding_type: 'missing_concept', subject_id: 'prob-mult', confidence: 0.8, detail: {} }];
  const p = plan(block({ for_date: '2026-11-15' }), inp);
  assert.equal(p.phase, 'taper');
  assert.ok(!p.blocks.some(b => ['lesson', 'word_expose'].includes(b.kind_id)));
  assert.ok(p.skipped.some(s => s.reason_code === 'taper'));
});

test('14 met success criterion: the served finding is retired; the node gets a maintenance probe or nothing', () => {
  const inp = base(); inp.findings = [{ id: 6, status: 'active', finding_type: 'misconception', subject_id: 'chart-read', confidence: 0.7, detail: {} }];
  inp.outcomes = [{ assignment_id: 50, outcome: 'met', finding_ids: [6], node_id: 'chart-read' }];
  const pa = plan(scrap(), inp);
  assert.deepEqual(pa.retire, [6]);
  assert.ok(blocksOn(pa, 'chart-read').every(b => b.kind_id === 'probe'));
  const pc = plan(scrap({ for_date: '2026-11-05' }), inp);
  assert.equal(pc.phase, 'consolidation');
  assert.ok(blocksOn(pc, 'chart-read').every(b => b.kind_id === 'probe'));
});

test('15 unmet criterion with if_fails: the fallback appears as a proposed assignment within one tick', () => {
  const inp = base(); inp.outcomes = [{ assignment_id: 51, outcome: 'unmet', node_id: 'prob-mult', if_fails: { next_kind_id: 'lesson', target_node_ids: ['prob-mult'], note: 'Lesson 2 re-teach' } }];
  const p = plan(scrap(), inp);
  assert.equal(p.fallback_proposals.length, 1);
  assert.deepEqual(p.fallback_proposals[0], { from_assignment_id: 51, kind_id: 'lesson', target_node_ids: ['prob-mult'], note: 'Lesson 2 re-teach', status: 'proposed', made_by_kind: 'rule' });
  assert.equal(p.inputs.planner_version, PLANNER_VERSION);
});
