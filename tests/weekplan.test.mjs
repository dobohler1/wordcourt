// Week plan (flag week_plan): done/pending/todo states are derived from runs, never written by the student.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './harness/load.mjs';

const { get } = loadApp();
const Drills = get('Drills');
const A = (id, kind, set, due, created = '2026-10-09T20:00:00Z', label = null) => ({ id, kind_id: kind, set_id: set, due_by: due, plan_order: id, created_at: created, reason_codes: label ? { label } : null });
const R = (set, finished, n_wrong, logs_complete) => ({ set_id: set, finished_at: finished, n_wrong, logs_complete });

test('error_log assignments are done only when every finished run of the set has its logs complete', () => {
  const plan = [A(1, 'error_log', 'pace_qc_1', '2026-10-11')];
  assert.equal(Drills.weekPlanStatus(plan, [R('pace_qc_1', '2026-09-12T19:00:00Z', 12, false)], '2026-10-10')[0].state, 'pending');
  assert.equal(Drills.weekPlanStatus(plan, [R('pace_qc_1', '2026-09-12T19:00:00Z', 12, true)], '2026-10-10')[0].state, 'done');
  assert.equal(Drills.weekPlanStatus(plan, [], '2026-10-10')[0].state, 'todo');
});

test('set work counts only runs finished after the assignment was made; a platform item is manual', () => {
  const plan = [A(2, 'pacing_set', 'pace_quant_2', '2026-10-10'), A(3, 'section_timed', null, '2026-10-12', undefined, 'Timed QR section on the platform')];
  const old = [R('pace_quant_2', '2026-09-07T19:00:00Z', 3, true)];
  let st = Drills.weekPlanStatus(plan, old, '2026-10-10');
  assert.equal(st[0].state, 'todo');
  assert.equal(st[1].state, 'manual'); assert.equal(st[1].label, 'Timed QR section on the platform');
  st = Drills.weekPlanStatus(plan, [...old, R('pace_quant_2', '2026-10-10T22:00:00Z', 1, true)], '2026-10-10');
  assert.equal(st[0].state, 'done');
  st = Drills.weekPlanStatus(plan, [...old, R('pace_quant_2', '2026-10-10T22:00:00Z', 2, false)], '2026-10-10');
  assert.equal(st[0].state, 'pending');
});

test('labels fall back to the set title; overdue is flagged; order is by due date then plan order', () => {
  const plan = [A(5, 'correction', 'isee4_correction_reading', '2026-10-11'), A(4, 'correction', 'isee4_correction_math', '2026-10-11'), A(1, 'pacing_set', 'pace_quant_2', '2026-10-10')];
  const st = Drills.weekPlanStatus(plan, [], '2026-10-12');
  assert.equal(JSON.stringify(st.map(x => x.id)), '[1,4,5]');   // vm-realm arrays are not reference-equal to ours
  assert.ok(st[1].label.startsWith('Correction A'));
  assert.ok(st.every(x => x.overdue));
});
