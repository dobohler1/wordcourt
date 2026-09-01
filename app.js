/* WordCourt UI — views, session player, coach panel. Depends on engine.js. */
(() => {
  const cfg = window.WORDCOURT_CONFIG;
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = c => '$' + (c / 100).toFixed(2);

  let profile = null;
  let session = null;        // { row, paying, items, idx, xp, engaged, rushedCount, misses, startedAt, mastered, paid }
  let itemShownAt = 0;

  // ---------- auth ----------
  async function boot() {
    const { data: { session: authSession } } = await sb.auth.getSession();
    if (authSession) await enter(); else showLogin();
  }

  function showLogin() { $('#view-login').hidden = false; $('#view-shell').hidden = true; }

  async function enter() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return showLogin();
    let { data: prof } = await sb.from('wc_profiles').select('*').eq('id', user.id).maybeSingle();
    if (!prof) {
      const handle = (user.user_metadata?.handle || 'player').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'player';
      const role = user.user_metadata?.coach ? 'coach' : 'student';
      const ins = await sb.from('wc_profiles').insert({ id: user.id, handle, role }).select().single();
      if (ins.error) { alert('Profile setup failed: ' + ins.error.message); return; }
      prof = ins.data;
    }
    profile = prof;
    $('#view-login').hidden = true; $('#view-shell').hidden = false;
    $('#tab-coach').hidden = profile.role !== 'coach';
    await Engine.init(sb, profile);
    Engine.streak().then(n => { $('#streak-chip').textContent = '🔥 ' + n; });
    showTab('today');
  }

  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    $('#login-btn').disabled = true; $('#login-msg').textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email: $('#login-email').value.trim(), password: $('#login-pass').value });
    $('#login-btn').disabled = false;
    if (error) { $('#login-msg').textContent = error.message; return; }
    await enter();
  });

  $('#logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });

  // ---------- tabs ----------
  document.querySelectorAll('#tabs .tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  function showTab(name) {
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    for (const v of document.querySelectorAll('.tab-view')) v.hidden = true;
    $('#tab-view-' + name).hidden = false;
    if (name === 'today') renderToday();
    if (name === 'words') renderWords();
    if (name === 'money') renderMoney();
    if (name === 'coach') renderCoach();
  }

  // ---------- today ----------
  async function renderToday() {
    const c = Engine.wordCounts();
    const streakN = await Engine.streak();
    const host = $('#today-card'); host.innerHTML = '';
    const card = el('div', 'card');
    if (Engine.needsDiagnostic()) {
      card.append(
        el('h2', null, `Welcome, ${esc(profile.handle)} 👋`),
        el('p', 'sub', 'First up: a 15-minute scouting session. It maps which words you already own so we never waste your time on them. Fast honest answers — that\'s it.'),
      );
      const btn = el('button', 'btn primary big', 'Start the scouting session');
      btn.addEventListener('click', () => startSession('diagnostic'));
      const wrap = el('div', 'center-actions'); wrap.append(btn); card.append(wrap);
    } else {
      card.append(el('h2', null, `Hey ${esc(profile.handle)} — 🔥 ${streakN} day streak`));
      card.append(el('p', 'sub', `${c.mastered} mastered · ${c.learning + c.review} in training · ${c.untouched} waiting`));
      const btn = el('button', 'btn primary big', 'Start today\'s 15 minutes');
      btn.addEventListener('click', () => startSession('drill'));
      const wrap = el('div', 'center-actions'); wrap.append(btn); card.append(wrap);
    }
    host.append(card);
  }

  // ---------- session player ----------
  async function startSession(kind) {
    const { row, paying } = await Engine.openSession(kind);
    const built = kind === 'diagnostic' ? Engine.buildDiagnostic() : Engine.buildSession();
    session = { row, paying, kind, items: built.items, idx: 0, xp: 0, engaged: 0, answered: 0, rushedCount: 0, misses: [], mastered: [], paid: 0, startedAt: Date.now() };
    for (const v of document.querySelectorAll('.tab-view')) v.hidden = true;
    $('#tab-view-session').hidden = false;
    renderItem();
  }

  function updateHud() {
    $('#hud-progress').textContent = `${Math.min(session.idx + 1, session.items.length)}/${session.items.length}`;
    $('#hud-xp').textContent = `${session.xp} xp`;
    const focus = session.answered ? (session.answered - session.rushedCount) / session.answered : 1;
    $('#focus-fill').style.width = Math.round(focus * 100) + '%';
  }

  function renderItem() {
    updateHud();
    const stage = $('#item-stage'); stage.innerHTML = '';
    if (session.idx >= session.items.length) return finishSession();
    const item = session.items[session.idx];
    itemShownAt = Date.now();
    if (item.kind === 'flashcard') renderFlashcard(stage, item);
    else if (item.kind === 'teach') renderTeach(stage, item);
    else renderQuestion(stage, item);
  }

  function chargeChip(charge) {
    if (charge === '+') return '<span class="charge-chip pos">+ positive</span>';
    if (charge === '-') return '<span class="charge-chip neg">− negative</span>';
    return '<span class="charge-chip neu">0 neutral</span>';
  }

  function renderFlashcard(stage, item) {
    const card = el('div', 'item-card');
    card.append(el('div', 'item-kind', item.direction === 'word2def' ? 'Which meaning?' : 'Which word?'));
    card.append(el('div', 'big-word', esc(item.prompt)));
    if (item.direction === 'word2def' && item.cluster) {
      card.append(el('div', 'word-meta', `family: <b>${esc(item.cluster.name)}</b>`));
    }
    const choices = el('div', 'choices');
    item.options.forEach((o, i) => {
      const b = el('button', 'choice', `<span class="letter">${'ABCD'[i]}</span>${esc(o.text)}`);
      b.addEventListener('click', () => answerFlashcard(card, item, o, b));
      choices.append(b);
    });
    card.append(choices);
    stage.append(card);
  }

  async function answerFlashcard(card, item, opt, btn) {
    const latency = Date.now() - itemShownAt;
    card.querySelectorAll('.choice').forEach(b => b.disabled = true);
    const correct = opt.id === item.answerId;
    btn.classList.add(correct ? 'correct' : 'wrong');
    const res = session.kind === 'diagnostic'
      ? await diagnosticAnswer(item, correct, latency)
      : await Engine.processAnswer(session.row, item, { correct, latencyMs: latency });
    showFeedback(card, item.word, correct, res, {
      defLine: `<b>${esc(item.word.word)}</b> <i>(${esc(item.word.pos || '')})</i> — ${esc(item.word.definition)} ${chargeChip(item.word.charge)}`,
    });
  }

  async function diagnosticAnswer(item, correct, latencyMs) {
    session.answered++;
    Engine.logDiagnosticAnswer(session.row, item, { correct, latencyMs }).catch(() => {});
    await Engine.seedDiagnosticResult(item, correct, latencyMs);
    if (!correct) session.misses.push({ word: item.word, note: 'new word for your ladder' });
    session.xp += correct ? 2 : 1;
    return { counted: true, rushed: false, correct, masteredNow: false, paidCents: 0, alreadyKnown: false };
  }

  function renderQuestion(stage, item) {
    const card = el('div', 'item-card');
    const q = item.q;
    const kindLabel = { synonyms: 'Synonym', sentence_completion: 'Sentence completion', analogies: 'Analogy' }[q.section];
    card.append(el('div', 'item-kind', `${kindLabel} · ${q.exam}`));

    // scaffold layer
    if (item.scaffold >= 1) {
      const lesson = pickScaffold(q.section, item);
      if (lesson) card.append(el('div', 'scaffold', lesson));
    }

    // stem
    let stemHtml;
    if (q.section === 'synonyms') {
      stemHtml = `<span class="cap">${esc(q.stem.replace(':', ''))}</span> most nearly means…`;
    } else if (q.section === 'sentence_completion') {
      stemHtml = esc(q.stem).replace(/-{3,}/g, '<span class="blank">_____</span>');
      if (item.scaffold >= 1 && item.signal) {
        for (const s of item.signal) {
          const re = new RegExp(`\\b(${s.word.replace(/ /g, '\\s+')})\\b`, 'i');
          stemHtml = stemHtml.replace(re, `<span class="signal" title="${s.type} signal">$1</span>`);
        }
      }
    } else {
      stemHtml = esc(q.stem);
    }
    card.append(el('div', 'stem', stemHtml));

    const proceed = () => {
      const choices = el('div', 'choices');
      item.choices.forEach(c => {
        const b = el('button', 'choice', `<span class="letter">${c.letter}</span>${esc(c.text)}`);
        b.addEventListener('click', () => answerQuestion(card, item, c, b));
        choices.append(b);
      });
      card.append(choices);
    };

    // full scaffold (level 2): interactive strategy step before choices unlock
    if (item.scaffold === 2 && q.section === 'synonyms') {
      const row = el('div', 'predict-row');
      const inp = el('input'); inp.type = 'text'; inp.placeholder = 'your own synonym first…';
      const go = el('button', 'btn', 'Show choices');
      go.addEventListener('click', () => { row.remove(); proceed(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
      row.append(inp, go); card.append(row);
    } else if (item.scaffold === 2 && q.section === 'analogies') {
      card.append(el('div', 'word-meta', 'Step 1: what\'s the bridge?'));
      const opts = el('div', 'bridge-options');
      const types = ['synonyms', 'antonyms', 'degree', 'part-whole', 'category', 'characteristic', 'function', 'other'];
      types.forEach(t => {
        const b = el('button', 'bridge-opt', esc(t));
        b.addEventListener('click', () => {
          opts.querySelectorAll('.bridge-opt').forEach(x => x.classList.remove('picked'));
          b.classList.add('picked');
          item.pickedBridge = t;
          if (!card.querySelector('.choices')) proceed();
        });
        opts.append(b);
      });
      card.append(opts);
    } else {
      proceed();
    }
    stage.append(card);
  }

  function pickScaffold(section, item) {
    const S = Engine.strategy; if (!S) return null;
    const map = {
      synonyms: item.scaffold === 2 ? 'predict-first' : 'charge',
      sentence_completion: 'signal-words',
      analogies: item.scaffold === 2 ? 'bridge' : 'bridge-types',
    };
    const lesson = S.micro_lessons.find(l => l.id === map[section]);
    return lesson ? `<b>${esc(lesson.title)}:</b> ${esc(lesson.card)}` : null;
  }

  async function answerQuestion(card, item, choiceObj, btn) {
    const latency = Date.now() - itemShownAt;
    card.querySelectorAll('.choice').forEach(b => b.disabled = true);
    const q = item.q;
    const correct = choiceObj.letter === q.answer;
    btn.classList.add(correct ? 'correct' : 'wrong');
    if (!correct) {
      const right = [...card.querySelectorAll('.choice')].find(b => b.querySelector('.letter').textContent === q.answer);
      right?.classList.add('correct');
    }
    let errorTag = null;
    if (!correct && q.section === 'analogies' && item.pickedBridge && item.pickedBridge !== q.relationship) errorTag = 'wrong-bridge';
    session.answered++;
    if (session.kind === 'diagnostic') Engine.logDiagnosticAnswer(session.row, item, { correct, latencyMs: latency, chosen: choiceObj.letter }).catch(() => {});
    const res = session.kind === 'diagnostic'
      ? (session.xp += correct ? 3 : 1, { counted: true, rushed: false, correct, masteredNow: false, paidCents: 0 })
      : await Engine.processAnswer(session.row, item, { correct, latencyMs: latency, chosen: choiceObj.letter, errorTag });
    if (session.kind !== 'diagnostic') {
      if (res.rushed) session.rushedCount++;
      if (res.counted) { session.engaged++; session.xp += Engine.T.xpPerItem[q.section] ?? 6; }
    }
    let extra = '';
    if (q.section === 'analogies' && q.bridge) extra = `<div class="defline">bridge: ${esc(q.bridge)} <i>(${esc(q.relationship)})</i></div>`;
    const stemWord = q.section === 'synonyms' ? q.stem.replace(':', '').trim().toLowerCase() : null;
    const w = res.word || null;
    if (!correct) session.misses.push({ word: w, q, note: errorTag === 'wrong-bridge' ? 'bridge was ' + q.relationship : (stemWord ? null : 'review the choices') });
    showFeedback(card, w, correct, res, { defLine: (w ? `<b>${esc(w.word)}</b> — ${esc(w.definition)} ` : '') + extra });
  }

  function showFeedback(card, word, correct, res, { defLine }) {
    if (session.kind !== 'diagnostic' && !card.dataset.countedApplied) {
      card.dataset.countedApplied = '1';
      if (word && res.rushed !== undefined) {
        if (res.rushed) session.rushedCount++;
        else if (res.counted && card.querySelector('.big-word')) { session.engaged++; session.xp += Engine.T.xpPerItem.flashcard; }
      }
      if (!correct && word && !session.misses.some(m => m.word?.id === word.id)) session.misses.push({ word });
      if (res.masteredNow) { session.mastered.push(word); session.paid += res.paidCents; }
    }
    const cls = res.rushed ? 'rushed' : (correct ? 'good' : 'bad');
    const head = res.rushed ? '⚡ Too fast to count — slow down, it\'s not a race'
      : res.alreadyKnown ? '✓ You already own this one — it leaves your ladder (no pay for words you knew!)'
      : res.masteredNow ? `🏆 MASTERED${res.paidCents ? ' — +' + money(res.paidCents) + ' (vests at checkpoint)' : ''}`
      : correct ? '✓ Nice' : '✗ Not this time — it goes back in the ladder';
    const fb = el('div', 'feedback ' + cls, `<div>${head}</div><div class="defline">${defLine || ''}</div>`);
    card.append(fb);
    const row = el('div', 'next-row');
    const next = el('button', 'btn primary', 'Next →');
    next.addEventListener('click', () => { session.idx++; renderItem(); });
    row.append(next); card.append(row);
    next.focus();
  }

  // ---------- teach item ----------
  function renderTeach(stage, item) {
    const w = item.word;
    const card = el('div', 'item-card');
    card.append(el('div', 'item-kind', 'Teach it to own it'));
    card.append(el('div', 'big-word', esc(w.word)));
    card.append(el('div', 'word-meta', `${esc(w.definition)}`));
    card.append(el('p', null, 'Write one sentence of your own that uses this word so a friend would get what it means:'));
    const inp = el('input'); inp.type = 'text'; inp.placeholder = 'your sentence…';
    const msg = el('p', 'form-msg', '');
    const go = el('button', 'btn primary', 'Submit');
    go.addEventListener('click', async () => {
      const s = inp.value.trim();
      const okLen = s.split(/\s+/).length >= 5;
      const usesWord = s.toLowerCase().includes(w.word.slice(0, Math.max(4, w.word.length - 2)));
      const parrot = w.definition && s.toLowerCase().includes(w.definition.toLowerCase().slice(0, 20));
      if (!okLen || !usesWord) { msg.textContent = 'Use the word, and give me a real sentence (5+ words).'; return; }
      if (parrot) { msg.textContent = 'That\'s my definition 🙂 — say it your way.'; return; }
      go.disabled = true;
      await sb.from('wc_teach_entries').insert({ user_id: profile.id, word_id: w.id, sentence: s, passed: true });
      await Engine.processAnswer(session.row, { kind: 'teach', word: w }, { correct: true, latencyMs: Date.now() - itemShownAt });
      session.xp += Engine.T.xpPerItem.teach; session.engaged++; session.answered++;
      const fb = el('div', 'feedback good', '📓 Saved to your notebook — this sentence is what you\'ll see at review time.');
      card.append(fb);
      const row = el('div', 'next-row');
      const next = el('button', 'btn primary', 'Next →');
      next.addEventListener('click', () => { session.idx++; renderItem(); });
      row.append(next); card.append(row);
    });
    const rowIn = el('div', 'predict-row'); rowIn.append(inp, go);
    card.append(rowIn, msg);
    stage.append(card);
  }

  // ---------- wrap-up ----------
  async function finishSession() {
    const durationS = Math.round((Date.now() - session.startedAt) / 1000);
    const focus = session.answered ? (session.answered - session.rushedCount) / session.answered : 1;
    const xp = Math.round(session.xp * (0.5 + 0.5 * focus));
    await Engine.closeSession(session.row, { xp, focus: Math.round(focus * 1000) / 1000, durationS });
    for (const v of document.querySelectorAll('.tab-view')) v.hidden = true;
    $('#tab-view-wrap').hidden = false;
    const host = $('#wrap-card'); host.innerHTML = '';
    const card = el('div', 'card');
    card.append(el('h2', null, session.kind === 'diagnostic' ? 'Scouting complete 🗺️' : 'Session complete ✅'));
    const stats = el('div', 'stat-row');
    stats.append(
      el('div', 'stat', `<b>${xp}</b><span>xp</span>`),
      el('div', 'stat', `<b>${Math.round(focus * 100)}%</b><span>focus</span>`),
      el('div', 'stat', `<b>${session.mastered.length}</b><span>mastered</span>`),
    );
    if (session.paid) stats.append(el('div', 'stat money', `<b>+${money(session.paid)}</b><span>earned (vests at checkpoint)</span>`));
    card.append(stats);
    if (session.kind === 'diagnostic') {
      const c = Engine.wordCounts();
      card.append(el('p', null, `Your map: <b>${c.known}</b> words you already own · <b>${c.learning + c.review}</b> to conquer first · ${c.untouched} more waiting behind them. Tomorrow the real 15 minutes begin.`));
    }
    if (session.misses.length) {
      card.append(el('h2', null, 'What goes back in the ladder'));
      const ul = el('ul', 'miss-list');
      for (const m of session.misses.slice(0, 10)) {
        const label = m.word ? `<span class="w">${esc(m.word.word)}</span> — ${esc(m.word.definition || '')}` : esc(m.q?.stem?.slice(0, 60) || '');
        ul.append(el('li', null, `${label}${m.note ? ` <i>(${esc(m.note)})</i>` : ''}`));
      }
      card.append(ul);
    }
    const row = el('div', 'center-actions');
    const done = el('button', 'btn primary', 'Done for today');
    done.addEventListener('click', () => { session = null; showTab('today'); });
    row.append(done); card.append(row);
    host.append(card);
    Engine.streak().then(n => { $('#streak-chip').textContent = '🔥 ' + n; });
  }

  // ---------- words panel ----------
  function renderWords() {
    const host = $('#words-panel'); host.innerHTML = '';
    const card = el('div', 'card');
    const c = Engine.wordCounts();
    card.append(el('h2', null, 'My words'));
    card.append(el('p', 'sub', `${c.mastered} mastered · ${c.review} in review · ${c.learning} learning · ${c.known} already owned`));
    const ul = el('ul', 'word-rowlist');
    const rows = [...Engine.state.values()]
      .sort((a, b) => (a.state > b.state ? 1 : -1))
      .slice(0, 200);
    for (const s of rows) {
      const w = Engine.wordsById().get(s.word_id); if (!w) continue;
      ul.append(el('li', null, `<span><b>${esc(w.word)}</b> <i style="color:var(--muted)">${esc(w.definition || '')}</i></span><span class="state ${s.state}">${s.state}</span>`));
    }
    card.append(ul);
    host.append(card);
  }

  // ---------- money panel ----------
  async function renderMoney() {
    const host = $('#money-panel'); host.innerHTML = '<div class="loading">counting…</div>';
    const m = await Engine.moneySummary();
    host.innerHTML = '';
    const card = el('div', 'card');
    card.append(el('h2', null, 'Money'));
    card.append(el('div', 'money-big', money(m.vested)));
    card.append(el('div', 'money-sub', `vested (yours) · ${money(m.provisional)} pending checkpoint`));
    const ul = el('ul', 'ledger-list');
    for (const l of m.entries) {
      const label = { provisional: 'earned', vest: 'vested', revert: 'returned', bonus: 'bonus', settle: 'paid out' }[l.kind] || l.kind;
      ul.append(el('li', null, `<span>${esc(l.note || label)}</span><span class="${l.kind === 'vest' || l.kind === 'bonus' ? 'vested' : 'provisional'}">${l.cents >= 0 ? '+' : ''}${money(l.cents)} ${label}</span>`));
    }
    card.append(ul);
    host.append(card);
  }

  // ---------- coach panel ----------
  async function renderCoach() {
    const host = $('#coach-panel'); host.innerHTML = '<div class="loading">gathering…</div>';
    const { data: fam } = await sb.from('wc_profiles').select('*').neq('id', profile.id);
    host.innerHTML = '';
    if (!fam?.length) { host.append(el('div', 'card', '<h2>Coach</h2><p class="sub">No students in your family yet.</p>')); return; }
    for (const s of fam) {
      const card = el('div', 'card coach-student');
      card.append(el('h2', null, `${esc(s.handle)}`));
      const [ws, sess, m, teach] = await Promise.all([
        sb.from('wc_word_state').select('state').eq('user_id', s.id),
        sb.from('wc_sessions').select('day, xp, focus, kind, completed').eq('user_id', s.id).order('day', { ascending: false }).limit(14),
        Engine.moneySummary(s.id),
        sb.from('wc_teach_entries').select('sentence, created_at, word_id').eq('user_id', s.id).order('created_at', { ascending: false }).limit(5),
      ]);
      const counts = {};
      for (const r of ws.data || []) counts[r.state] = (counts[r.state] || 0) + 1;
      const stats = el('div', 'stat-row');
      stats.append(
        el('div', 'stat', `<b>${counts.mastered || 0}</b><span>mastered</span>`),
        el('div', 'stat', `<b>${(counts.learning || 0) + (counts.review || 0)}</b><span>in training</span>`),
        el('div', 'stat money', `<b>${money(m.provisional)}</b><span>pending</span>`),
        el('div', 'stat money', `<b>${money(m.vested)}</b><span>owed (vested)</span>`),
      );
      card.append(stats);
      const lowFocus = (sess.data || []).filter(x => x.completed && x.focus != null && x.focus < 0.7);
      if (lowFocus.length) card.append(el('p', 'flag', `⚠ ${lowFocus.length} recent session(s) with focus under 70% — rushing detected.`));
      const tbl = el('table', 'tbl', '<tr><th>day</th><th>kind</th><th>xp</th><th>focus</th></tr>');
      for (const x of (sess.data || []).slice(0, 7)) {
        tbl.insertAdjacentHTML('beforeend', `<tr><td>${x.day}</td><td>${x.kind}</td><td>${x.xp ?? '—'}</td><td>${x.focus != null ? Math.round(x.focus * 100) + '%' : '—'}</td></tr>`);
      }
      card.append(tbl);
      if (teach.data?.length) {
        card.append(el('h2', null, 'Notebook (latest)'));
        const ul = el('ul', 'miss-list');
        for (const t of teach.data) ul.append(el('li', null, `“${esc(t.sentence)}”`));
        card.append(ul);
      }
      host.append(card);
    }
  }

  boot();
})();
