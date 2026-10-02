import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, fakeClient } from './harness/load.mjs';
const plain = x => JSON.parse(JSON.stringify(x));

const profile = { id: 'u1', handle: 'dj', role: 'student', created_at: '2026-09-01T00:00:00Z', budget_cents: 5000 };
const words = n => Array.from({ length: n }, (_, i) => ({ id: i + 1, word: `w${i + 1}`, pos: 'noun', definition: `meaning ${i + 1}`, tier: 2, charge: '0', exams: ['ISEE'], tested: false, tested_synonyms: [], study: true, freq: 1 }));
const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString();
function mastered(id, { ago = 10, cents = 40, vested = false } = {}) {
  return { user_id: 'u1', word_id: id, state: 'mastered', box: 3, due_on: '2026-10-20', correct_streak: 3, formats_hit: ['flash', 'question'], misses: 0, earned_cents: cents, vested, updated_at: daysAgo(ago) };
}
async function setup(stateRows, { checkpoints = [], flags = { checkpoint: true } } = {}) {
  const tables = { wc_words: words(30), wc_questions: [], wc_clusters: [], wc_cluster_words: [], wc_word_state: stateRows, wc_skill_state: [], wc_teach_entries: [], wc_flags: [], wc_checkpoints: checkpoints, wc_ledger: [] };
  const client = fakeClient(tables);
  const { get } = loadApp({ files: ['config.js', 'engine.js'], client });
  const Engine = get('Engine');
  await Engine.init(client, profile, { strategy: null, deck: { newPerDay: 4, words: [] }, flags });
  return { Engine, client };
}

test('candidates: mastered, not vested, untouched for 7+ days, oldest first; max 10', async () => {
  const rows = [mastered(1, { ago: 20 }), mastered(2, { ago: 3 }), mastered(3, { ago: 9, vested: true }), mastered(4, { ago: 8 }),
    ...Array.from({ length: 12 }, (_, i) => mastered(10 + i, { ago: 30 + i }))];
  const { Engine } = await setup(rows);
  const c = Engine._checkpointCandidates();
  assert.ok(!c.some(w => w.id === 2), 'too recent is excluded');
  assert.ok(!c.some(w => w.id === 3), 'already vested is excluded');
  assert.equal(c[0].id, 21, 'oldest untouched first');
  const st = await Engine.checkpointStatus();
  assert.equal(st.available, true);
  assert.equal(st.words.length, 10);
  assert.equal(st.cents, 400);
});

test('one checkpoint per ISO week; off when the flag is off or nothing is due', async () => {
  const week = (await setup([mastered(1)])).Engine._dates.isoWeekStart((await setup([])).Engine._dates.todayStr());
  const done = await setup([mastered(1)], { checkpoints: [{ user_id: 'u1', week_start: week, retained: 3, sampled: 4 }] });
  const s1 = await done.Engine.checkpointStatus();
  assert.equal(s1.available, false); assert.equal(s1.reason, 'done'); assert.equal(s1.last.retained, 3);
  const off = await setup([mastered(1)], { flags: { checkpoint: false } });
  assert.equal((await off.Engine.checkpointStatus()).reason, 'off');
  const none = await setup([mastered(1, { vested: true })]);
  assert.equal((await none.Engine.checkpointStatus()).reason, 'nothing_due');
});

test('iso week starts on Monday', async () => {
  const { Engine } = await setup([]);
  const w = Engine._dates.isoWeekStart;
  assert.equal(w('2026-10-03'), '2026-09-28');   // Saturday -> Monday of that week
  assert.equal(w('2026-10-04'), '2026-09-28');   // Sunday stays in the same ISO week
  assert.equal(w('2026-10-05'), '2026-10-05');   // Monday
});

test('a correct probe vests the earnings; a miss reverts them and sends the word back to learning', async () => {
  const { Engine, client } = await setup([mastered(1, { cents: 40 }), mastered(2, { cents: 20 })]);
  const st = await Engine.checkpointStatus();
  const built = Engine.buildCheckpoint(st.words);
  assert.equal(built.kind, 'checkpoint'); assert.ok(built.items.every(i => i.probe && i.kind === 'flashcard'));
  const session = { id: 77, kind: 'checkpoint' };
  const ok = await Engine.processCheckpointAnswer(session, built.items.find(i => i.word.id === 1), { correct: true, latencyMs: 2500 });
  assert.equal(ok.vestedCents, 40);
  const miss = await Engine.processCheckpointAnswer(session, built.items.find(i => i.word.id === 2), { correct: false, latencyMs: 6000 });
  assert.equal(miss.revertedCents, 20);
  const ledger = client.log.filter(l => l.table === 'wc_ledger').map(l => l.rows[0]);
  assert.deepEqual(ledger.map(l => [l.kind, l.cents, l.word_id]), [['vest', 40, 1], ['revert', 20, 2]]);
  const answers = client.log.filter(l => l.table === 'wc_answers').map(l => l.rows[0]);
  assert.equal(answers.length, 2); assert.ok(answers.every(a => a.error_tag === 'probe' && a.counted === true));
  const s1 = Engine.state.get(1), s2 = Engine.state.get(2);
  assert.equal(s1.vested, true); assert.equal(s1.state, 'mastered');
  assert.equal(s2.state, 'learning'); assert.equal(s2.box, 0); assert.equal(s2.earned_cents, 0); assert.equal(s2.vested, false);
  await Engine.recordCheckpoint(session, { words: st.words, retained: 1, vestedCents: 40, revertedCents: 20 });
  const ck = client.log.find(l => l.table === 'wc_checkpoints').rows[0];
  assert.equal(ck.sampled, 2); assert.equal(ck.retained, 1); assert.equal(ck.kind, 'word'); assert.equal(ck.vested_cents, 40); assert.equal(ck.reverted_cents, 20);
  assert.deepEqual(plain(ck.sampled_words), [1, 2]);
  // money summary: vest moves cents from provisional to vested; revert removes them
  client.tables.wc_ledger = [{ user_id: 'u1', kind: 'provisional', cents: 40 }, { user_id: 'u1', kind: 'provisional', cents: 20 }, ...ledger.map(l => ({ user_id: 'u1', ...l }))];
  const m = await Engine.moneySummary();
  assert.equal(m.vested, 40); assert.equal(m.provisional, 0);
});
