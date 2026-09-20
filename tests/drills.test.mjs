import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './harness/load.mjs';
const plain = x => JSON.parse(JSON.stringify(x));   // vm-realm objects have a different prototype; compare by value

const load = () => loadApp({ files: ['config.js', 'engine.js', 'drills_content.js', 'content_versions.js', 'drills.js'] });

test('numeric grader: equivalent forms, ratios, mixed numbers, percents, accept lists', () => {
  const { get } = load();
  const grade = get('Drills._grade');
  const num = (answer, extra = {}) => ({ type: 'numeric', answer, ...extra });
  assert.equal(grade(num('3/4'), '0.75'), true);
  assert.equal(grade(num('0.75'), '3/4'), true);
  assert.equal(grade(num('3/4'), '6/8'), true);
  assert.equal(grade(num('1 1/2'), '1.5'), true);
  assert.equal(grade(num('50%'), '0.5'), true);
  assert.equal(grade(num('3:4'), '6:8'), true);
  assert.equal(grade(num('3:4'), '0.75'), false, 'a ratio answer needs a ratio or fraction');
  assert.equal(grade(num('12'), '12.0'), true);
  assert.equal(grade(num('12'), '13'), false);
  assert.equal(grade(num('-7'), '−7'), true, 'unicode minus');
  assert.equal(grade(num('x^2', { accept: ['x²'] }), 'X²'), true);
  assert.equal(grade(num('12'), ''), null, 'blank is not graded');
  assert.equal(grade({ type: 'mc', answer: 'B' }, 'B'), true);
  assert.equal(grade({ type: 'mc', answer: 'B' }, 'C'), false);
  assert.equal(grade({ type: 'mc', answer: 'B' }, null), null);
});

test('dwell is measured on every set; over_cap only when a cap exists; first passage item gets the long cap', () => {
  const { get } = load();
  const dwellOf = get('Drills._dwellOf');
  assert.deepEqual(plain(dwellOf({ at: 45000, lastAnswerAt: 10000, capS: null })), { dwell_ms: 35000, over_cap: false });
  assert.deepEqual(plain(dwellOf({ at: 105000, lastAnswerAt: 10000, capS: 90 })), { dwell_ms: 95000, over_cap: true });
  assert.deepEqual(plain(dwellOf({ at: 100000, lastAnswerAt: 10000, capS: 90 })), { dwell_ms: 90000, over_cap: false });
  assert.deepEqual(plain(dwellOf({ at: 200000, lastAnswerAt: 0, capS: 90, firstCapS: null, firstOfPassage: true })), { dwell_ms: 200000, over_cap: false }, '3× cap for the first item of a passage');
  assert.deepEqual(plain(dwellOf({ at: 200000, lastAnswerAt: 0, capS: 90, firstCapS: 120, firstOfPassage: true })), { dwell_ms: 200000, over_cap: true });
});

test('run purpose and conditions snapshot', () => {
  const { get } = load();
  const purposeOf = get('Drills._purposeOf'), conditionsOf = get('Drills._conditionsOf');
  assert.equal(purposeOf({ id: 'lesson7_qc_check' }), 'check');
  assert.equal(purposeOf({ id: 'pace_qc_2', paceCapS: 60 }), 'pacing');
  assert.equal(purposeOf({ id: 'isee4_correction_math' }), 'correction');
  assert.equal(purposeOf({ id: 'pace_card', type: 'card' }), 'card');
  assert.equal(purposeOf({ id: 'sep1_d2_quant' }), 'practice');
  const c = conditionsOf({ id: 'pace_read_1', timeLimitS: 700, paceCapS: 90, scoring: 'isee', passages: [{ id: 'p1' }], noGate: true, intro: [{ type: 'directions' }] }, [1, 2, 3]);
  assert.equal(c.timed, true); assert.equal(c.time_limit_s, 700); assert.equal(c.cap_s, 90); assert.equal(c.first_cap_s, 270);
  assert.equal(c.blank_rule, 'never_blank'); assert.equal(c.gated, false); assert.equal(c.reference_before_run, false); assert.equal(c.n_items, 3);
  const s = conditionsOf({ id: 'sep1_d1_multistep', timeLimitS: 720, scoring: 'ssat', intro: [{ type: 'reference', title: 'x', html: '' }] }, []);
  assert.equal(s.blank_rule, 'quarter_penalty'); assert.equal(s.reference_before_run, true); assert.equal(s.cap_s, null);
});

test('canonical JSON sorts keys, drops undefined, and is whitespace-independent', async () => {
  const { get } = load();
  const canon = get('Drills._canon');
  assert.equal(canon({ b: 1, a: [3, { z: 1, y: undefined }] }), '{"a":[3,{"z":1}],"b":1}');
  assert.equal(canon({ a: 'x  y' }), '{"a":"x  y"}', 'string content is preserved verbatim');
  const setHash = get('Drills._setHash');
  const set = { id: 's', title: 'T', items: [{ id: 'i1', type: 'mc', skills: ['k'], answer: 'A', choices: [['A', '1'], ['B', '2']] }] };
  const h1 = await setHash(set);
  const h2 = await setHash({ ...set, items: [{ ...set.items[0], choices: [['A', '1'], ['B', '2']] }] });
  assert.equal(h1, h2);
  const h3 = await setHash({ ...set, title: 'T2' });
  assert.notEqual(h1, h3, 'a set-level change changes the set hash');
  const h4 = await setHash({ ...set, items: [{ ...set.items[0], answer: 'B' }] });
  assert.notEqual(h1, h4, 'an item change changes the set hash');
});

test('content_versions.js matches the shipped content (regenerate with build_content.mjs versions)', async () => {
  const { get } = load();
  const D = get('window.WORDCOURT_DRILLS'), V = get('window.WORDCOURT_CONTENT_VERSIONS');
  const setHash = get('Drills._setHash');
  assert.equal(Object.keys(V.sets).length, D.sets.length);
  for (const s of D.sets) assert.equal(V.sets[s.id], await setHash(s), `stale hash for ${s.id}`);
});

test('the dead checklist item type and coach view are gone', () => {
  const { get } = load();
  assert.equal(get('typeof Drills.renderCoach'), 'undefined');
  assert.ok(!get('Drills._grade').toString().includes('checklist'), 'grader has no checklist branch');
  assert.equal(get('Drills._grade')({ type: 'checklist', answer: 'ok' }, 'miss'), false, 'an unknown type grades by plain answer match');
});
