import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, fakeClient } from './harness/load.mjs';
const plain = x => JSON.parse(JSON.stringify(x));

const engineOnly = client => loadApp({ files: ['config.js', 'engine.js'], client });

test('dates are local calendar days and survive month, DST and evening boundaries', () => {
  const { get } = engineOnly();
  const d = get('Engine._dates');
  assert.equal(d.dayOf(new Date(2026, 8, 17, 19, 53)), '2026-09-17');   // 7:53 pm local stays the 17th (UTC would say the 18th)
  assert.equal(d.dayOf(new Date(2026, 8, 17, 0, 5)), '2026-09-17');
  assert.equal(d.addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(d.addDays('2026-03-08', 1), '2026-03-09');                // spring-forward day
  assert.equal(d.addDays('2026-11-01', -1), '2026-10-31');               // fall-back day
  assert.equal(d.addDays('2026-01-01', -1), '2025-12-31');
  assert.match(d.todayStr(), /^\d{4}-\d{2}-\d{2}$/);
});

test('answer kinds map to the spellings the wc_answers constraint accepts', () => {
  const { get } = engineOnly();
  const K = get('Engine.ANSWER_KIND');
  assert.equal(K.analogies, 'analogy');
  assert.equal(K.synonyms, 'synonym');
  assert.equal(K.sentence_completion, 'sentence_completion');
  assert.equal(K.flashcard, 'flashcard');
  assert.equal(K.teach, 'teach');
});

// ---------- fixtures for session composition ----------
function words(n, { tier = 2, prefix = 'w' } = {}) {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1, word: `${prefix}${i + 1}`, pos: 'noun', definition: `meaning of ${prefix}${i + 1}`, tier, charge: '0', exams: ['ISEE'], tested: false, tested_synonyms: [], study: true, freq: 1 }));
}
function states(ids, { box = 1, due = '2000-01-01', state = 'learning' } = {}) {
  return ids.map(id => ({ user_id: 'u1', word_id: id, state, box: typeof box === 'function' ? box(id) : box, due_on: due, correct_streak: 0, formats_hit: [], misses: 0 }));
}
const profile = { id: 'u1', handle: 'dj', role: 'student', created_at: '2026-09-01T00:00:00Z', budget_cents: 5000 };
async function initWith({ nWords = 120, dueIds = [], boxOf = () => 1, flags = { vocab_review_first: true }, deck = { newPerDay: 4, words: [] } }) {
  const tables = {
    wc_words: words(nWords), wc_questions: [], wc_clusters: [], wc_cluster_words: [],
    wc_word_state: states(dueIds, { box: boxOf }), wc_skill_state: [], wc_teach_entries: [], wc_flags: [],
  };
  const client = fakeClient(tables);
  const { get } = engineOnly(client);
  const Engine = get('Engine');
  await Engine.init(client, profile, { strategy: null, deck, flags });
  return { Engine, client };
}

test('review-first: 84 due words → 14 reviews, highest box first, no new words', async () => {
  const due = Array.from({ length: 84 }, (_, i) => i + 1);
  const { Engine } = await initWith({ dueIds: due, boxOf: id => (id <= 18 ? 3 : id <= 34 ? 2 : id <= 73 ? 1 : 0) });
  const pick = Engine._pickSessionWords();
  assert.equal(pick.policy, 'review_first');
  assert.equal(pick.reviews.length, 14);
  assert.equal(pick.newWords.length, 0);
  assert.ok(pick.reviews.every(w => w.id <= 18), 'the 14 reviews are all box-3 words');
  assert.equal(pick.nDue, 84);
  const session = Engine.buildSession();
  assert.equal(session.items.filter(i => i.kind === 'flashcard').length, 14);
});

test('review-first: 5 due words → 5 reviews plus 4 new deck words', async () => {
  const deck = { newPerDay: 4, words: ['w50', 'w51', 'w52', 'w53', 'w54', 'w55'] };
  const { Engine } = await initWith({ dueIds: [1, 2, 3, 4, 5], deck });
  const pick = Engine._pickSessionWords();
  assert.equal(pick.reviews.length, 5);
  assert.equal(pick.newWords.length, 4);
  assert.ok(pick.newWords.every(w => deck.words.includes(w.word)), 'deck words jump the queue');
});

test('review-first: exactly 10 due → no new words; 9 due → new words admitted', async () => {
  const a = await initWith({ dueIds: Array.from({ length: 10 }, (_, i) => i + 1) });
  assert.equal(a.Engine._pickSessionWords().newWords.length, 0);
  const b = await initWith({ dueIds: Array.from({ length: 9 }, (_, i) => i + 1) });
  assert.ok(b.Engine._pickSessionWords().newWords.length > 0);
});

test('flag off: legacy composition (6 oldest-due reviews + up to newPerDay new)', async () => {
  const due = Array.from({ length: 30 }, (_, i) => i + 1);
  const { Engine } = await initWith({ dueIds: due, flags: { vocab_review_first: false }, deck: { newPerDay: 8, words: ['w100', 'w101', 'w102', 'w103', 'w104', 'w105', 'w106', 'w107', 'w108'] } });
  const pick = Engine._pickSessionWords();
  assert.equal(pick.policy, 'legacy');
  assert.equal(pick.reviews.length, 6);
  assert.equal(pick.newWords.length, 8);
});

test('processAnswer stores kind analogy, scaffold level, options shown, local day; a failed insert is reported not thrown', async () => {
  const { Engine, client } = await initWith({ dueIds: [] });
  const q = { id: 9, section: 'analogies', stem: 'deft is to clumsy as', choices: { A: 'x', B: 'y', C: 'z', D: 'w' }, answer: 'B', relationship: 'antonyms' };
  const item = { kind: 'analogies', q, choices: [{ letter: 'C', text: 'z' }, { letter: 'A', text: 'x' }, { letter: 'B', text: 'y' }, { letter: 'D', text: 'w' }], scaffold: 2 };
  const res = await Engine.processAnswer({ id: 1, kind: 'drill', is_primary: true }, item, { correct: false, latencyMs: 9000, chosen: 'C' });
  const ins = client.log.find(l => l.table === 'wc_answers');
  assert.equal(ins.rows[0].kind, 'analogy');
  assert.equal(ins.rows[0].scaffold_level, 2);
  assert.deepEqual(plain(ins.rows[0].options_shown), { letters: ['C', 'A', 'B', 'D'] });
  assert.match(ins.rows[0].local_day, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(res.correct, false);
  // flashcards record the distractor word ids and the direction
  const w = client.tables.wc_words[0];
  const fc = { kind: 'flashcard', word: w, direction: 'word2def', options: [{ id: 1 }, { id: 7 }, { id: 8 }, { id: 9 }], answerId: 1 };
  await Engine.processAnswer({ id: 1, kind: 'drill', is_primary: true }, fc, { correct: true, latencyMs: 6000 });
  const ins2 = client.log.filter(l => l.table === 'wc_answers').at(-1);
  assert.deepEqual(plain(ins2.rows[0].options_shown), { direction: 'word2def', word_ids: [1, 7, 8, 9] });
});

test('closeSession writes an activity row for the session', async () => {
  const { Engine, client } = await initWith({ dueIds: [] });
  await Engine.closeSession({ id: 42, kind: 'drill', created_at: '2026-09-21T02:00:00Z' }, { xp: 100, focus: 1, durationS: 300 });
  const act = client.log.find(l => l.table === 'wc_activity_log');
  assert.ok(act, 'activity row inserted');
  assert.equal(act.rows[0].kind_id, 'vocab_session');
  assert.equal(act.rows[0].session_id, 42);
  assert.equal(act.rows[0].minutes, 5);
  assert.equal(act.rows[0].reported_by, 'app');
});
