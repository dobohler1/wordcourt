/* WordCourt coach dashboard — one screen a parent can read in a minute. Depends on drills.js (data loaders) and engine.js (money). */
const Dashboard = (() => {
  const D = window.WORDCOURT_DRILLS;
  let sb = null, profile = null;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const dayOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = () => dayOf(new Date());
  const utcToday = () => new Date().toISOString().slice(0, 10);
  const addDays = (day, n) => { const x = new Date(day + 'T12:00:00'); x.setDate(x.getDate() + n); return dayOf(x); };
  const fmtDay = day => new Date(day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const fmtClock = s => `${Math.floor(s / 60)}:${pad(s % 60)}`;
  const pct = (c, n) => n ? Math.round(100 * c / n) : 0;
  const money = c => '$' + (c / 100).toFixed(2);
  const setById = id => D.sets.find(s => s.id === id);
  const skillLabel = k => k.startsWith('w:') ? `word: ${k.slice(2)}` : (D.skills[k] || k);

  // which Core Concepts lesson covers a skill (1–3 built, 4–7 planned)
  const LESSON = [
    [/^(reverse-percent|percent-chain|percent-of|percent)/, 1, 'Percent'],
    [/^prob-/, 2, 'Probability'],
    [/^stats-/, 3, 'Statistics'],
    [/^(scale-|cube-packing|similar)/, 4, 'Scaling'],
    [/^(function-notation|sequence-|sum-series)/, 5, 'Functions & sequences'],
    [/^(counting-|factors|lcm-|gcf|primes)/, 6, 'Counting & number properties'],
    [/^qc-/, 7, 'QC method'],
  ];
  const lessonFor = k => { for (const [re, n, t] of LESSON) if (re.test(k)) return { n, t }; return null; };

  function init(client, prof) { sb = client; profile = prof; }

  async function render(host) {
    host.innerHTML = '<div class="loading">gathering…</div>';
    const { data: fam, error } = await sb.from('wc_profiles').select('*').neq('id', profile.id).order('handle');
    if (error) { host.innerHTML = `<div class="card"><p class="flag">${esc(error.message)}</p></div>`; return; }
    host.innerHTML = '';
    const today = todayStr();
    const exam = fam?.find(s => s.exam_date)?.exam_date || profile.exam_date;
    const daysLeft = exam ? Math.round((new Date(exam + 'T12:00:00') - new Date(today + 'T12:00:00')) / 864e5) : null;
    const head = el('div', 'dash-head');
    head.append(el('div', null, `<h2>Dashboard</h2><p class="sub">${esc(fmtDay(today))}${daysLeft != null ? ` · <b>${daysLeft} days</b> to the ${esc(fmtDay(exam))} test` : ''}</p>`));
    const rb = el('button', 'btn ghost small-btn', 'Refresh'); rb.addEventListener('click', () => render(host)); head.append(rb);
    host.append(head);
    if (!fam?.length) { host.append(el('div', 'card', '<p class="sub">No students in your family yet.</p>')); return; }
    for (const s of fam) {
      const card = el('div', 'card coach-student');
      card.append(el('h2', null, esc(s.handle)));
      host.append(card);
      try { await studentCard(card, s, today); } catch (e) { card.append(el('p', 'flag', esc(e.message))); }
    }
  }

  async function studentCard(card, s, today) {
    const since = addDays(today, -21);
    const [runs, att, sessR, wsR, teachR, m] = await Promise.all([
      Drills._loadRuns(s.id), Drills._loadAttempts(s.id),
      sb.from('wc_sessions').select('day, xp, focus, kind, completed, duration_s').eq('user_id', s.id).gte('day', since).order('day', { ascending: false }),
      sb.from('wc_word_state').select('word_id, state, box, due_on, misses, correct_streak').eq('user_id', s.id),
      sb.from('wc_teach_entries').select('sentence, created_at').eq('user_id', s.id).order('created_at', { ascending: false }).limit(3),
      Engine.moneySummary(s.id).catch(() => null),
    ]);
    const sess = sessR.data || [], ws = wsR.data || [];
    const finished = runs.filter(r => r.finished_at);
    const localDay = iso => dayOf(new Date(iso));

    // ----- today strip -----
    const vocabToday = sess.find(x => x.completed && (x.day === today || x.day === utcToday()));
    const runsToday = finished.filter(r => localDay(r.started_at) === today);
    const scoredToday = runsToday.filter(r => setById(r.set_id)?.type !== 'card');
    const pendingLogs = finished.filter(r => r.n_wrong > 0 && !r.logs_complete);
    const inTraining = ws.filter(w => w.state === 'learning' || w.state === 'review');
    const due = inTraining.filter(w => w.due_on && w.due_on <= today);
    const stats = el('div', 'stat-row');
    stats.append(
      el('div', 'stat ' + (vocabToday ? 'good' : 'warn'), vocabToday
        ? `<b>✓</b><span>vocab today · ${vocabToday.xp ?? 0} xp${vocabToday.focus != null ? ` · focus ${Math.round(vocabToday.focus * 100)}%` : ''}</span>`
        : `<b>—</b><span>vocab today: not yet</span>`),
      el('div', 'stat ' + (runsToday.length ? 'good' : 'warn'), runsToday.length
        ? `<b>${runsToday.length}</b><span>drill set${runsToday.length > 1 ? 's' : ''} today${scoredToday.length ? ` · ${scoredToday.reduce((a, r) => a + r.n_correct, 0)}/${scoredToday.reduce((a, r) => a + r.n_items, 0)} right` : ''}</span>`
        : `<b>0</b><span>drill sets today</span>`),
      el('div', 'stat ' + (pendingLogs.length ? 'bad' : ''), `<b>${pendingLogs.length}</b><span>error log${pendingLogs.length === 1 ? '' : 's'} pending</span>`),
      el('div', 'stat', `<b>${due.length}</b><span>words due · ${inTraining.length} in training</span>`),
    );
    card.append(stats);

    // ----- do next -----
    const doneIds = new Set(finished.map(r => r.set_id));
    const open = D.sets.filter(x => (!x.availableFrom || x.availableFrom <= today) && !doneIds.has(x.id))
      .sort((a, b) => (a.availableFrom || '').localeCompare(b.availableFrom || '') || (a.order - b.order));
    card.append(el('h3', 'dash-h', 'Do next'));
    const ul = el('ul', 'next-list');
    if (!vocabToday) ul.append(el('li', null, `<span class="pill warn">vocab</span> Today's 15-minute session`));
    for (const r of pendingLogs) ul.append(el('li', null, `<span class="pill bad">log</span> Finish the error log for <b>${esc(setById(r.set_id)?.title || r.set_id)}</b> (${r.n_wrong} miss${r.n_wrong === 1 ? '' : 'es'})`));
    if (!finished.length && open.length) ul.append(el('li', null, `<span class="pill">drill</span> No drill sets started yet <i class="dim">· ${open.length} open</i>`));
    for (const x of (finished.length ? open : []).slice(0, 6)) {
      const late = x.availableFrom && x.availableFrom < today;
      ul.append(el('li', null, `<span class="pill${late ? ' warn' : ''}">${x.type === 'card' ? 'read' : 'drill'}</span> ${esc(x.title)} <i class="dim">· ${esc(x.day)}${late ? ' · carried over' : ''}</i>`));
    }
    if (finished.length && open.length > 6) ul.append(el('li', 'dim', `+${open.length - 6} more open sets`));
    if (!ul.children.length) ul.append(el('li', 'dim', 'All caught up.'));
    card.append(ul);

    // ----- skills: lesson candidates -----
    const skills = new Map();
    for (const a of att) {
      if (a.correct == null || !finished.some(r => r.id === a.run_id)) continue;
      for (const k of a.skills || []) {
        const v = skills.get(k) || { n: 0, c: 0, lastMiss: null };
        v.n++; if (a.correct) v.c++; else v.lastMiss = a.created_at; skills.set(k, v);
      }
    }
    const rows = [...skills.entries()].filter(([k]) => !k.startsWith('w:')).map(([k, v]) => ({ k, ...v, pct: v.c / v.n }));
    const lessonNow = rows.filter(r => r.n >= 3 && r.pct < 0.6);
    const watch = rows.filter(r => !lessonNow.includes(r) && r.n >= 2 && r.pct <= 0.5);
    const single = rows.filter(r => r.n === 1 && r.c === 0);
    if (rows.length) {
      card.append(el('h3', 'dash-h', 'Where to teach'));
      if (!lessonNow.length && !watch.length) card.append(el('p', 'sub', 'No skill is below the lesson trigger (under 60% with 3+ tries).'));
      const tbl = el('table', 'tbl');
      const rowHtml = (r, tag) => {
        const L = lessonFor(r.k);
        return `<tr><td>${esc(skillLabel(r.k))}${L ? ` <span class="dim">· Lesson ${L.n}</span>` : ''}</td><td class="num">${r.c}/${r.n}</td><td><div class="skbar"><div class="skfill ${r.pct < .6 ? 'bad' : r.pct < .8 ? 'warn' : 'good'}" style="width:${pct(r.c, r.n)}%"></div></div></td><td><span class="pill ${tag === 'lesson' ? 'bad' : 'warn'}">${tag}</span></td></tr>`;
      };
      for (const r of lessonNow.sort((a, b) => a.pct - b.pct || b.n - a.n)) tbl.insertAdjacentHTML('beforeend', rowHtml(r, 'lesson'));
      for (const r of watch.sort((a, b) => a.pct - b.pct || b.n - a.n)) tbl.insertAdjacentHTML('beforeend', rowHtml(r, 'watch'));
      if (tbl.children.length) card.append(tbl);
      if (single.length) card.append(el('p', 'dim small', `Missed once, not yet a pattern: ${esc(single.map(r => skillLabel(r.k)).join(' · '))}`));
      // lesson mastery checks
      const checks = D.sets.filter(x => /^lesson\d+_/.test(x.id));
      const chk = checks.map(x => { const r = finished.find(q => q.set_id === x.id); const n = x.title.match(/Lesson (\d+)/)?.[1]; return r ? `L${n}: <b class="${r.n_correct >= 4 ? 'ok' : 'no'}">${r.n_correct}/${r.n_items}</b>` : `L${n}: <span class="dim">not taken</span>`; });
      if (chk.length) card.append(el('p', 'small', `Mastery checks — ${chk.join(' · ')} <span class="dim">(4/5 = concept is in)</span>`));
    }

    // ----- drill score trend -----
    const scored = finished.filter(r => r.n_items > 0 && setById(r.set_id)?.type !== 'card' && r.scoring !== 'none').slice().reverse();
    if (scored.length) {
      card.append(el('h3', 'dash-h', 'Drill scores'));
      card.append(trendSvg(scored));
    }

    // ----- vocab -----
    card.append(el('h3', 'dash-h', 'Vocabulary'));
    const grid = el('div', 'grid14');
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      const x = sess.find(q => q.day === d && q.completed);
      const cell = el('div', 'gcell ' + (x ? (x.focus != null && x.focus < 0.7 ? 'rush' : 'on') : 'off'));
      cell.title = `${fmtDay(d)}${x ? ` · ${x.kind} · ${x.xp ?? 0} xp${x.focus != null ? ` · focus ${Math.round(x.focus * 100)}%` : ''}` : ' · no session'}`;
      cell.textContent = new Date(d + 'T12:00:00').getDate();
      grid.append(cell);
    }
    card.append(grid);
    const streak = (() => { let n = 0; for (let i = 0; i < 60; i++) { const d = addDays(today, -i); if (sess.some(q => q.day === d && q.completed)) n++; else if (i > 0) break; } return n; })();
    const counts = {}; for (const w of ws) counts[w.state] = (counts[w.state] || 0) + 1;
    const rushed = sess.filter(x => x.completed && x.focus != null && x.focus < 0.7).length;
    card.append(el('p', 'small', `Streak <b>${streak}</b> day${streak === 1 ? '' : 's'} · ${counts.learning || 0} learning · ${counts.review || 0} review · ${(counts.mastered || 0) + (counts.known || 0)} mastered${m ? ` · ${money(m.vested)} owed, ${money(m.provisional)} pending` : ''}${rushed ? ` · <span class="no">${rushed} rushed session${rushed > 1 ? 's' : ''}</span>` : ''}`));
    const trouble = ws.filter(w => w.misses >= 2 || (w.misses >= 1 && w.correct_streak === 0)).sort((a, b) => b.misses - a.misses);
    const drillWords = [...skills.entries()].filter(([k, v]) => k.startsWith('w:') && v.n - v.c > 0).map(([k]) => k.slice(2));
    if (trouble.length) {
      const { data: wn } = await sb.from('wc_words').select('id, word').in('id', trouble.map(w => w.word_id));
      const name = id => wn?.find(w => w.id === id)?.word || '?';
      card.append(el('p', 'small', `Words still slipping: ${trouble.map(w => `<span class="w">${esc(name(w.word_id))}</span>${w.misses > 1 ? ` ×${w.misses}` : ''}`).join(', ')}`));
    }
    if (drillWords.length) card.append(el('p', 'small', `Missed in drills: ${drillWords.map(w => `<span class="w">${esc(w)}</span>`).join(', ')}`));

    // ----- latest error log -----
    const logged = att.filter(a => a.error_log).sort((a, b) => b.created_at < a.created_at ? -1 : 1).slice(0, 5);
    if (logged.length) {
      card.append(el('h3', 'dash-h', 'Error log (latest)'));
      const ll = el('ul', 'miss-list');
      for (const a of logged) ll.append(el('li', null, `<span class="w">${esc((a.skills || []).filter(k => !k.startsWith('w:')).map(skillLabel).join(', ') || a.item_id)}</span> — “${esc(a.error_log)}” <i class="dim">${fmtDate(a.created_at)}</i>`));
      card.append(ll);
    }

    // ----- details -----
    const det = el('details', 'dash-details'); det.append(el('summary', null, 'All runs and sessions'));
    const tbl = el('table', 'tbl', '<tr><th>date</th><th>set</th><th>score</th><th>time</th><th>log</th></tr>');
    for (const r of finished) {
      const x = setById(r.set_id);
      const sc = x?.type === 'card' ? 'read' : r.scoring === 'ssat' ? `${r.n_correct}/${r.n_items} · raw ${r.raw_score}` : `${r.n_correct}/${r.n_items}`;
      tbl.insertAdjacentHTML('beforeend', `<tr><td>${fmtDate(r.started_at)}</td><td>${esc(x?.title || r.set_id)}</td><td>${sc}${r.n_blank ? ` · ${r.n_blank} blank` : ''}${r.timed_out ? ' ⏱' : ''}</td><td>${r.duration_s != null ? fmtClock(r.duration_s) : '—'}</td><td>${r.n_wrong === 0 ? '—' : r.logs_complete ? '✓' : 'pending'}</td></tr>`);
    }
    det.append(tbl);
    const st = el('table', 'tbl', '<tr><th>day</th><th>kind</th><th>xp</th><th>focus</th><th>time</th></tr>');
    for (const x of sess.slice(0, 14)) st.insertAdjacentHTML('beforeend', `<tr><td>${x.day}</td><td>${x.kind}${x.completed ? '' : ' (open)'}</td><td>${x.xp ?? '—'}</td><td>${x.focus != null ? Math.round(x.focus * 100) + '%' : '—'}</td><td>${x.duration_s != null ? fmtClock(x.duration_s) : '—'}</td></tr>`);
    det.append(st);
    if (teachR.data?.length) { const tl = el('ul', 'miss-list'); for (const t of teachR.data) tl.append(el('li', null, `“${esc(t.sentence)}”`)); det.append(el('p', 'small dim', 'Notebook sentences'), tl); }
    card.append(det);
  }

  function trendSvg(runs) {
    const W = 560, H = 120, padL = 28, padB = 22, bw = Math.max(8, Math.min(28, (W - padL - 10) / runs.length - 4));
    const x = i => padL + i * ((W - padL - 10) / runs.length);
    let s = `<svg class="trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="drill accuracy by set">`;
    for (const y of [60, 80, 100]) s += `<line class="ax" x1="${padL}" x2="${W - 4}" y1="${H - padB - y * (H - padB - 10) / 100}" y2="${H - padB - y * (H - padB - 10) / 100}"/><text class="tk" x="2" y="${H - padB - y * (H - padB - 10) / 100 + 4}">${y}</text>`;
    let lastDay = '';
    runs.forEach((r, i) => {
      const p = pct(r.n_correct, r.n_items), h = p * (H - padB - 10) / 100;
      const cls = p >= 80 ? 'good' : p >= 60 ? 'warn' : 'bad';
      const t = setById(r.set_id)?.title || r.set_id;
      s += `<rect class="tb ${cls}" x="${x(i)}" y="${H - padB - h}" width="${bw}" height="${h}" rx="2"><title>${esc(t)} · ${r.n_correct}/${r.n_items} (${p}%)${r.timed_out ? ' · timed out' : ''} · ${fmtDate(r.started_at)}</title></rect>`;
      const d = fmtDate(r.started_at);
      if (d !== lastDay) { s += `<text class="tk" x="${x(i)}" y="${H - 6}">${esc(d)}</text>`; lastDay = d; }
    });
    s += '</svg>';
    return el('div', 'trend-wrap', s);
  }

  return { init, render };
})();
