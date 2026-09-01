/* WordCourt engine — session building, mastery, spacing, money, effort integrity.
   Pure logic + Supabase persistence; no DOM. */

const Engine = (() => {
  // ---------- tuning ----------
  const T = {
    latencyFloorMs: { flashcard: 2000, synonym: 4000, sentence_completion: 8000, analogy: 6000, verify: 2000 },
    fastKnownMs: { flashcard: 3500, synonym: 5000 },   // fast+first-try-perfect => already known
    boxIntervals: [0, 1, 3, 7, 16],                    // days per Leitner box
    masteryStreak: 3,
    masteryFormats: 2,
    wordItemsPerSession: 10,
    questionItemsPerSession: 6,
    newWordsMax: 6,
    xpPerItem: { flashcard: 4, synonym: 8, sentence_completion: 10, analogy: 10, verify: 4, teach: 6 },
    payCents: { 2: 20, 3: 40 },                        // tier -> base cents
    seasonMultipliers: [1.0, 0.75, 0.5, 0.35],         // by 3-week block since profile creation
    scaffoldOffAccuracy: 0.85,                         // fade scaffold when rolling acc >= this over >=10 attempts
    scaffoldHintAccuracy: 0.7,
    questionCooldownDays: 10,
    diagnosticProbes: 30,
  };

  let db = null;          // supabase client
  let me = null;          // profile row
  let words = [];         // content cache
  let wordsById = new Map();
  let wordsByWord = new Map();
  let questions = [];
  let questionsById = new Map();
  let clusters = [];
  let clusterOf = new Map();   // word_id -> cluster
  let state = new Map();       // word_id -> word_state row
  let skills = new Map();      // skill -> skill_state row
  let strategy = null;         // strategy_content (lessons + signal words) — fetched from static file

  const todayStr = () => new Date().toISOString().slice(0, 10);
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);

  // ---------- load ----------
  async function init(supabaseClient, profile) {
    db = supabaseClient; me = profile;
    const [w, q, c, cw, ws, sk, strat] = await Promise.all([
      db.from('wc_words').select('*').eq('study', true),
      db.from('wc_questions').select('*'),
      db.from('wc_clusters').select('*'),
      db.from('wc_cluster_words').select('*'),
      db.from('wc_word_state').select('*').eq('user_id', me.id),
      db.from('wc_skill_state').select('*').eq('user_id', me.id),
      fetch('strategy_content.json').then(r => r.json()).catch(() => null),
    ]);
    for (const r of [w, q, c, cw, ws, sk]) if (r.error) throw r.error;
    words = w.data; questions = q.data; clusters = c.data; strategy = strat;
    wordsById = new Map(words.map(x => [x.id, x]));
    wordsByWord = new Map(words.map(x => [x.word, x]));
    questionsById = new Map(questions.map(x => [x.id, x]));
    const clustersById = new Map(clusters.map(x => [x.id, x]));
    for (const row of cw.data) {
      if (!clusterOf.has(row.word_id)) clusterOf.set(row.word_id, []);
      clusterOf.get(row.word_id).push(clustersById.get(row.cluster_id));
    }
    state = new Map(ws.data.map(x => [x.word_id, x]));
    skills = new Map(sk.data.map(x => [x.skill, x]));
  }

  function needsDiagnostic() {
    return state.size === 0;
  }

  // ---------- priority ladder ----------
  function priorityScore(w) {
    let s = 0;
    if (w.tested) s += 40;
    if (w.exams.length === 2) s += 25;
    s += (w.tier || 1) * 10;
    s += Math.min(w.freq, 5) * 3;
    if ((w.tested_synonyms || []).length) s += 5;
    return s;
  }

  function newWordCandidates(n) {
    return words
      .filter(w => !state.has(w.id) && w.tier >= 2)
      .sort((a, b) => priorityScore(b) - priorityScore(a))
      .slice(0, n);
  }

  function dueReviews(n) {
    const t = todayStr();
    return [...state.values()]
      .filter(s => (s.state === 'learning' || s.state === 'review') && s.due_on <= t)
      .sort((a, b) => a.due_on.localeCompare(b.due_on))
      .slice(0, n)
      .map(s => wordsById.get(s.word_id))
      .filter(Boolean);
  }

  // ---------- item builders ----------
  function flashcardItem(w, direction) {
    // direction: 'def2word' | 'word2def'
    const pool = words.filter(x => x.id !== w.id && x.tier === w.tier && x.pos === w.pos && x.definition);
    const distractors = sample(pool.length >= 3 ? pool : words.filter(x => x.id !== w.id && x.definition), 3);
    const opts = shuffle([w, ...distractors]);
    return {
      kind: 'flashcard', word: w, direction,
      prompt: direction === 'word2def' ? w.word : w.definition,
      options: opts.map(o => ({ id: o.id, text: direction === 'word2def' ? o.definition : o.word })),
      answerId: w.id,
      cluster: (clusterOf.get(w.id) || [])[0] || null,
    };
  }

  function recentQuestionIds() {
    try {
      const raw = JSON.parse(localStorage.getItem('wc_recent_q_' + me.id) || '[]');
      const cutoff = Date.now() - T.questionCooldownDays * 864e5;
      return new Map(raw.filter(([, ts]) => ts > cutoff));
    } catch { return new Map(); }
  }
  function rememberQuestion(qid) {
    try {
      const m = recentQuestionIds(); m.set(qid, Date.now());
      localStorage.setItem('wc_recent_q_' + me.id, JSON.stringify([...m.entries()]));
    } catch {}
  }

  function skillFor(section) { return section; }
  function scaffoldLevel(skill) {
    const s = skills.get(skill);
    if (!s || s.attempts < 10) return 2;
    if (s.rolling_acc >= T.scaffoldOffAccuracy) return 0;
    if (s.rolling_acc >= T.scaffoldHintAccuracy) return 1;
    return 2;
  }

  function questionItem(q) {
    const choices = Object.entries(q.choices).map(([letter, text]) => ({ letter, text }));
    return {
      kind: q.section, q, choices: shuffle(choices),
      scaffold: scaffoldLevel(skillFor(q.section)),
      signal: q.section === 'sentence_completion' ? findSignals(q.stem) : null,
    };
  }

  function findSignals(stem) {
    if (!strategy) return [];
    const found = [];
    const lower = stem.toLowerCase();
    for (const [type, list] of Object.entries(strategy.signal_words)) {
      if (type === 'definition') continue;
      for (const s of list) {
        const re = new RegExp('\\b' + s.replace(/ /g, '\\s+') + '\\b', 'i');
        if (re.test(lower)) found.push({ word: s, type });
      }
    }
    return found;
  }

  function pickQuestions(n) {
    const recent = recentQuestionIds();
    const bySection = { synonyms: [], sentence_completion: [], analogies: [] };
    for (const q of questions) if (!recent.has(q.id)) bySection[q.section].push(q);
    // weight weakest skills higher
    const accs = Object.keys(bySection).map(s => ({ s, acc: (skills.get(s)?.rolling_acc ?? 0.5), n: skills.get(s)?.attempts ?? 0 }));
    accs.sort((a, b) => a.acc - b.acc);
    const counts = { [accs[0].s]: Math.ceil(n / 2), [accs[1].s]: Math.floor(n / 4), [accs[2].s]: 0 };
    counts[accs[2].s] = n - counts[accs[0].s] - counts[accs[1].s];
    const picked = [];
    for (const [sec, cnt] of Object.entries(counts)) {
      // prefer questions touching words currently in learning/review
      const active = new Set([...state.values()].filter(s => s.state !== 'mastered' && s.state !== 'known').map(s => wordsById.get(s.word_id)?.word));
      const pool = bySection[sec];
      const scored = pool.map(q => {
        let sc = Math.random();
        const stemWord = sec === 'synonyms' ? q.stem.replace(':', '').toLowerCase() : null;
        if (stemWord && active.has(stemWord)) sc += 2;
        return { q, sc };
      }).sort((a, b) => b.sc - a.sc);
      picked.push(...scored.slice(0, cnt).map(x => x.q));
    }
    return shuffle(picked);
  }

  // ---------- session assembly ----------
  function buildSession() {
    const reviews = dueReviews(T.wordItemsPerSession - 4);
    const newWords = newWordCandidates(Math.min(T.newWordsMax, T.wordItemsPerSession - reviews.length));
    const wordItems = shuffle([...reviews, ...newWords]).map((w, i) =>
      flashcardItem(w, i % 2 === 0 ? 'word2def' : 'def2word'));
    const qItems = pickQuestions(T.questionItemsPerSession).map(questionItem);
    // teach moment: one learning word gets a sentence prompt at the end
    const teachCandidates = [...state.values()].filter(s => s.state === 'learning' && s.correct_streak >= 1);
    const teach = teachCandidates.length ? [{ kind: 'teach', word: wordsById.get(sample(teachCandidates, 1)[0].word_id) }] : [];
    return { items: [...wordItems, ...qItems, ...teach], kind: 'drill' };
  }

  function buildDiagnostic() {
    // probe across tiers, priority order, mixed directions; plus 2 questions per section unscaffolded.
    // deterministic order + skip already-probed words so a mid-run refresh resumes cleanly.
    const probes = words
      .filter(w => w.tier >= 2 && !state.has(w.id))
      .sort((a, b) => (priorityScore(b) - priorityScore(a)) || a.word.localeCompare(b.word))
      .filter((_, i) => i % 3 === 0)                     // spread down the ladder
      .slice(0, T.diagnosticProbes)
      .map((w, i) => flashcardItem(w, i % 2 ? 'def2word' : 'word2def'));
    const qs = ['synonyms', 'sentence_completion', 'analogies']
      .flatMap(sec => sample(questions.filter(q => q.section === sec), 2))
      .map(q => ({ ...questionItem(q), scaffold: 0 }));
    return { items: [...probes, ...qs], kind: 'diagnostic' };
  }

  // ---------- money ----------
  function weekIndex() {
    const start = new Date(me.created_at);
    const weeks = Math.floor((Date.now() - start.getTime()) / (7 * 864e5));
    return Math.min(Math.floor(weeks / 3), T.seasonMultipliers.length - 1);
  }

  async function budgetRemaining() {
    const { data, error } = await db.from('wc_ledger').select('cents, kind').eq('user_id', me.id);
    if (error) throw error;
    const committed = data.filter(l => l.kind === 'provisional' || l.kind === 'bonus').reduce((s, l) => s + l.cents, 0)
      - data.filter(l => l.kind === 'revert').reduce((s, l) => s + l.cents, 0);
    return (me.budget_cents || 0) - committed;
  }

  async function payForMastery(w) {
    if (me.role !== 'student' || !me.budget_cents) return 0;
    const base = T.payCents[w.tier] || 0;
    if (!base) return 0;
    const cents = Math.round(base * T.seasonMultipliers[weekIndex()]);
    const remaining = await budgetRemaining();
    const pay = Math.max(0, Math.min(cents, remaining));
    if (pay > 0) {
      await db.from('wc_ledger').insert({ user_id: me.id, cents: pay, kind: 'provisional', word_id: w.id, note: w.word });
    }
    return pay;
  }

  // ---------- answer processing ----------
  function isRushed(kind, latencyMs) {
    return latencyMs < (T.latencyFloorMs[kind] ?? 2000);
  }

  async function upsertWordState(patch) {
    const existing = state.get(patch.word_id) || {
      user_id: me.id, word_id: patch.word_id, state: 'learning', box: 0,
      due_on: todayStr(), correct_streak: 0, formats_hit: [], misses: 0, earned_cents: 0, vested: false,
    };
    const merged = { ...existing, ...patch, updated_at: new Date().toISOString() };
    state.set(patch.word_id, merged);
    const { error } = await db.from('wc_word_state').upsert(merged);
    if (error) throw error;
    return merged;
  }

  async function bumpSkill(skill, correct) {
    const s = skills.get(skill) || { user_id: me.id, skill, scaffold: 2, rolling_acc: 0.5, attempts: 0 };
    const alpha = 0.15;
    s.rolling_acc = Math.round((s.rolling_acc * (1 - alpha) + (correct ? 1 : 0) * alpha) * 1000) / 1000;
    s.attempts += 1;
    s.scaffold = scaffoldLevel(skill);
    skills.set(skill, s);
    await db.from('wc_skill_state').upsert(s);
  }

  /** Process one answered item. Returns { counted, rushed, correct, masteredNow, paidCents, alreadyKnown } */
  async function processAnswer(sessionRow, item, { correct, latencyMs, chosen, errorTag }) {
    const kind = item.kind;
    const rushed = isRushed(kind, latencyMs);
    const counted = !rushed;
    const w = item.word || (kind === 'synonyms' ? wordsByWord.get(item.q.stem.replace(':', '').trim().toLowerCase()) : null);

    await db.from('wc_answers').insert({
      user_id: me.id, session_id: sessionRow.id, kind: kind === 'synonyms' ? 'synonym' : kind,
      word_id: w?.id ?? null, question_id: item.q?.id ?? null,
      correct, chosen: chosen ?? null, latency_ms: latencyMs, counted, rushed, error_tag: errorTag ?? null,
    });
    if (item.q) rememberQuestion(item.q.id);
    if (['synonyms', 'sentence_completion', 'analogies'].includes(kind) && counted) await bumpSkill(kind, correct);

    let masteredNow = false, paidCents = 0, alreadyKnown = false;
    if (w && counted && kind !== 'teach') {
      const st = state.get(w.id);
      const firstExposure = !st;
      if (correct) {
        if (firstExposure && latencyMs < (T.fastKnownMs[kind === 'flashcard' ? 'flashcard' : 'synonym'] ?? 4000) && sessionRow.kind !== 'checkpoint') {
          await upsertWordState({ word_id: w.id, state: 'known', box: 4, due_on: addDays(todayStr(), 30), correct_streak: 1, formats_hit: [kind] });
          alreadyKnown = true;
        } else {
          const cur = st || { correct_streak: 0, formats_hit: [], box: 0, state: 'learning', misses: 0 };
          const formats = [...new Set([...(cur.formats_hit || []), kind === 'flashcard' ? 'flash' : 'question'])];
          const streak = (cur.correct_streak || 0) + 1;
          const box = Math.min((cur.box || 0) + 1, T.boxIntervals.length - 1);
          const qualifies = streak >= T.masteryStreak && formats.length >= T.masteryFormats && box >= 3 && cur.state !== 'mastered' && cur.state !== 'known';
          const next = {
            word_id: w.id, correct_streak: streak, formats_hit: formats, box,
            due_on: addDays(todayStr(), T.boxIntervals[box]),
            state: qualifies ? 'mastered' : (box >= 2 ? 'review' : 'learning'),
            misses: cur.misses || 0,
          };
          if (qualifies) {
            masteredNow = true;
            paidCents = await payForMastery(w);
            next.earned_cents = (cur.earned_cents || 0) + paidCents;
          }
          await upsertWordState(next);
        }
      } else {
        const cur = st || { misses: 0 };
        await upsertWordState({
          word_id: w.id, state: 'learning', box: 0, due_on: todayStr(),
          correct_streak: 0, misses: (cur.misses || 0) + 1,
          formats_hit: cur.formats_hit || [],
        });
      }
    }
    return { counted, rushed, correct, masteredNow, paidCents, alreadyKnown, word: w };
  }

  async function logDiagnosticAnswer(sessionRow, item, { correct, latencyMs, chosen }) {
    // audit trail for diagnostics — same answers table as drills
    const kindMap = { flashcard: 'flashcard', synonyms: 'synonym', sentence_completion: 'sentence_completion', analogies: 'analogy' };
    await db.from('wc_answers').insert({
      user_id: me.id, session_id: sessionRow.id, kind: kindMap[item.kind] || 'flashcard',
      word_id: item.word?.id ?? null, question_id: item.q?.id ?? null,
      correct, chosen: chosen ?? null, latency_ms: latencyMs, counted: true, rushed: false,
    });
  }

  async function seedDiagnosticResult(item, correct, latencyMs) {
    // diagnostic: fast+correct = known; correct = review box 2; wrong = learning box 0
    const w = item.word; if (!w) return;
    if (correct && latencyMs < T.fastKnownMs.flashcard) {
      await upsertWordState({ word_id: w.id, state: 'known', box: 4, due_on: addDays(todayStr(), 30), correct_streak: 1, formats_hit: ['flash'] });
    } else if (correct) {
      await upsertWordState({ word_id: w.id, state: 'review', box: 2, due_on: addDays(todayStr(), T.boxIntervals[2]), correct_streak: 1, formats_hit: ['flash'] });
    } else {
      await upsertWordState({ word_id: w.id, state: 'learning', box: 0, due_on: todayStr(), correct_streak: 0, misses: 1, formats_hit: [] });
    }
  }

  // ---------- session lifecycle ----------
  async function openSession(kind) {
    const day = todayStr();
    const { data: existing } = await db.from('wc_sessions').select('*').eq('user_id', me.id).eq('day', day).eq('is_primary', true).maybeSingle();
    if (existing && existing.completed && kind === 'drill') {
      const { data, error } = await db.from('wc_sessions').insert({ user_id: me.id, day, is_primary: false, kind }).select().single();
      if (error) throw error; return { row: data, paying: false };
    }
    if (existing) return { row: existing, paying: existing.is_primary };
    const { data, error } = await db.from('wc_sessions').insert({ user_id: me.id, day, is_primary: true, kind }).select().single();
    if (error) throw error;
    return { row: data, paying: true };
  }

  async function closeSession(row, { xp, focus, durationS }) {
    const { error } = await db.from('wc_sessions').update({ xp, focus, duration_s: durationS, completed: true }).eq('id', row.id);
    if (error) throw error;
  }

  async function streak() {
    const { data, error } = await db.from('wc_sessions').select('day, focus').eq('user_id', me.id).eq('completed', true).eq('is_primary', true).order('day', { ascending: false }).limit(120);
    if (error) return 0;
    const days = data.filter(s => (s.focus ?? 1) >= 0.5).map(s => s.day);
    const set = new Set(days);
    let n = 0, d = todayStr();
    if (!set.has(d)) d = addDays(d, -1);
    while (set.has(d)) { n++; d = addDays(d, -1); }
    return n;
  }

  // ---------- summaries ----------
  function wordCounts() {
    const c = { mastered: 0, learning: 0, review: 0, known: 0, untouched: 0 };
    for (const s of state.values()) c[s.state] = (c[s.state] || 0) + 1;
    c.untouched = words.filter(w => w.tier >= 2).length - state.size;
    return c;
  }

  async function moneySummary(userId) {
    const uid = userId || me.id;
    const { data, error } = await db.from('wc_ledger').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (error) throw error;
    const sum = k => data.filter(l => l.kind === k).reduce((s, l) => s + l.cents, 0);
    return {
      provisional: sum('provisional') - sum('vest') - sum('revert'),
      vested: sum('vest') + sum('bonus') - sum('settle'),
      reverted: sum('revert'), settled: sum('settle'),
      entries: data.slice(0, 25),
    };
  }

  return {
    T, init, needsDiagnostic, buildSession, buildDiagnostic, openSession, closeSession,
    processAnswer, seedDiagnosticResult, logDiagnosticAnswer, streak, wordCounts, moneySummary,
    get me() { return me; }, get words() { return words; }, get state() { return state; },
    get skills() { return skills; }, get strategy() { return strategy; },
    clusterFor: id => (clusterOf.get(id) || [])[0] || null,
    wordsById: () => wordsById,
  };
})();
