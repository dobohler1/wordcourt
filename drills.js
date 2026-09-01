/* WordCourt Drills — booklet sections online, auto-graded, every answer stored by skill.
   Depends on drills_content.js (window.WORDCOURT_DRILLS) and a Supabase client passed in via init(). */
const Drills = (() => {
  const D = window.WORDCOURT_DRILLS;
  let sb = null, profile = null;
  let active = null;   // { set, items, run, startedAt, answers: Map(itemId -> {chosen, at, note}), notes: Map(passageId -> text), timer, host }

  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const typeset = node => { if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([node]).catch(() => {}); };

  function init(client, prof) { sb = client; profile = prof; }
  const isCoach = () => profile?.role === 'coach';
  const available = set => isCoach() || !set.availableFrom || todayStr() >= set.availableFrom;
  const setById = id => D.sets.find(s => s.id === id);
  const skillLabel = k => k.startsWith('w:') ? `word: ${k.slice(2)}` : (D.skills[k] || k);

  // ---------- numeric grading ----------
  function normNum(s) {
    let t = String(s ?? '').trim().toLowerCase().replace(/[−–]/g, '-').replace(/\s*to\s*/g, ':').replace(/^(times|by|×|x|\*)\s*/, '').replace(/[$,]/g, '');
    const mixed = t.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) { const sign = mixed[1] === '-' ? -1 : 1; return { val: sign * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4])) }; }
    t = t.replace(/\s+/g, '');
    let pct = false; if (t.endsWith('%')) { pct = true; t = t.slice(0, -1); }
    if (t.includes(':')) { const [a, b] = t.split(':').map(Number); if (isFinite(a) && isFinite(b) && b !== 0) return { ratio: reduce(a, b), val: a / b }; return { val: NaN }; }
    if (t.includes('/')) { const [a, b] = t.split('/').map(Number); if (isFinite(a) && isFinite(b) && b !== 0) return { frac: reduce(a, b), val: a / b }; return { val: NaN }; }
    const v = Number(t); return { val: isFinite(v) ? (pct ? v / 100 : v) : NaN };
  }
  function reduce(a, b) { const g = (x, y) => y ? g(y, x % y) : Math.abs(x); const d = g(a, b) || 1; return [a / d, b / d]; }
  function gradeNumeric(item, typed) {
    if (!typed || !typed.trim()) return null;
    const t = typed.trim().toLowerCase().replace(/\s+/g, ' ');
    if ([item.answer, ...(item.accept || [])].some(a => a.toLowerCase() === t)) return true;
    const a = normNum(item.answer), u = normNum(typed);
    if (a.ratio) return !!(u.ratio || u.frac) && (u.ratio || u.frac)[0] === a.ratio[0] && (u.ratio || u.frac)[1] === a.ratio[1];
    return isFinite(u.val) && Math.abs(u.val - a.val) < 1e-9;
  }
  function grade(item, chosen) {
    if (chosen == null || chosen === '') return null;
    if (item.type === 'numeric') return gradeNumeric(item, chosen);
    if (item.type === 'checklist') return chosen === 'ok';
    return chosen === item.answer;
  }

  // ---------- data ----------
  async function loadRuns(userId) {
    const { data, error } = await sb.from('wc_drill_runs').select('*').eq('user_id', userId).order('started_at', { ascending: false });
    if (error) throw error;
    // ignore runs a stray timer force-submitted instantly (0 s, every item unanswered)
    return (data || []).filter(r => !(r.finished_at && r.n_items > 0 && r.duration_s === 0 && r.n_blank === r.n_items));
  }
  async function loadAttempts(userId, runId) {
    let q = sb.from('wc_drill_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (runId) q = q.eq('run_id', runId);
    const { data, error } = await q; if (error) throw error;
    // one attempt per (run, item): a double-tapped Submit once saved duplicates — keep the first
    const seen = new Set();
    return (data || []).filter(a => { const k = a.run_id + '|' + a.item_id; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  async function buildItems(set, userId) {
    if (!set.dynamicFrom) return set.items;
    const sources = [].concat(set.dynamicFrom).map(setById).filter(Boolean);
    const runs = await loadRuns(userId);
    const out = [];
    for (const src of sources) {
      const latest = runs.find(r => r.set_id === src.id && r.finished_at);
      if (!latest) continue;
      const att = await loadAttempts(userId, latest.id);
      const missed = new Set(att.filter(a => a.correct === false).map(a => a.item_id));
      out.push(...src.items.filter(i => missed.has(i.id)).map(i => ({ ...i, id: i.id + '_sp', sourceItem: i.id })));
    }
    return out;
  }
  // question text plus, for quantitative comparisons, the two-column table
  function promptHtml(item) {
    if (item.type !== 'qc') return item.prompt;
    return `${item.prompt ? `<div class="qc-info">${item.prompt}</div>` : ''}<table class="qc-table"><tr><th>Column A</th><th>Column B</th></tr><tr><td>${item.colA}</td><td>${item.colB}</td></tr></table>`;
  }

  // ---------- list view ----------
  async function renderList(host) {
    host.innerHTML = '<div class="loading">loading drills…</div>';
    let runs = [];
    try { runs = await loadRuns(profile.id); } catch (e) { host.innerHTML = `<div class="card"><p class="flag">Could not load drills: ${esc(e.message)}</p></div>`; return; }
    host.innerHTML = '';
    const byDay = new Map();
    for (const s of [...D.sets].sort((a, b) => a.order - b.order)) { if (!byDay.has(s.day)) byDay.set(s.day, []); byDay.get(s.day).push(s); }
    const intro = el('div', 'card');
    intro.append(el('h2', null, 'Drills'), el('p', 'sub', 'The practice booklet, online. Everything is checked automatically; each miss asks for a one-line error log — <i>what got me</i> — before the set counts as finished.'));
    host.append(intro);
    for (const [day, sets] of byDay) {
      const card = el('div', 'card');
      const open = sets.some(available);
      card.append(el('h2', null, `${esc(day)}${open ? '' : ' <span class="drill-lock">🔒 opens ' + esc(sets[0].availableFrom) + '</span>'}`));
      const ul = el('ul', 'drill-list');
      for (const s of sets) {
        const mine = runs.filter(r => r.set_id === s.id && r.finished_at);
        const best = mine[0];
        let status = '<span class="drill-status todo">not started</span>';
        if (best) {
          const sc = best.scoring === 'ssat' ? `raw ${best.raw_score}` : `${best.n_correct}/${best.n_items}`;
          status = `<span class="drill-status ${best.logs_complete || best.n_wrong === 0 ? 'done' : 'pending'}">${s.type === 'card' ? 'read' : sc}${best.n_wrong && !best.logs_complete ? ' · error log pending' : ''}</span>`;
        }
        const li = el('li', null, `<div><b>${esc(s.title)}</b><div class="drill-sub">${esc(s.subtitle || '')}</div></div>`);
        const right = el('div', 'drill-right', status);
        const btn = el('button', 'btn small-btn' + (best ? '' : ' primary'), best ? (best.n_wrong && !best.logs_complete ? 'Finish log' : 'Redo') : (s.type === 'card' ? 'Read' : 'Start'));
        btn.disabled = !available(s);
        btn.addEventListener('click', () => (best && best.n_wrong && !best.logs_complete) ? reopenLogs(host, s, best) : startSet(host, s));
        right.append(btn); li.append(right); ul.append(li);
      }
      card.append(ul); host.append(card);
    }
  }

  // ---------- intro + start ----------
  async function startSet(host, set) {
    host.innerHTML = '<div class="loading">preparing…</div>';
    const items = await buildItems(set, profile.id);
    host.innerHTML = '';
    const card = el('div', 'card');
    card.append(el('div', 'item-kind', esc(set.day)), el('h2', null, esc(set.title)), el('p', 'sub', esc(set.subtitle || '')));
    if (set.type === 'card') {
      card.append(el('div', 'drill-card-body', set.html));
      const row = el('div', 'center-actions');
      const ok = el('button', 'btn primary', 'Read it — mark done');
      ok.addEventListener('click', async () => {
        ok.disabled = true;
        await sb.from('wc_drill_runs').insert({ user_id: profile.id, set_id: set.id, scoring: 'none', finished_at: new Date().toISOString(), n_items: 0, logs_complete: true });
        renderList(host);
      });
      const back = el('button', 'btn ghost', 'Back'); back.addEventListener('click', () => renderList(host));
      row.append(back, ok); card.append(row); host.append(card); typeset(card); return;
    }
    for (const b of set.intro || []) card.append(introBlock(b));
    if (set.dynamicFrom && !items.length) {
      card.append(el('p', 'flag', 'Nothing to redo — the source set has no ✗ marks (or has not been done yet).'));
      const back = el('button', 'btn ghost', 'Back'); back.addEventListener('click', () => renderList(host));
      card.append(el('div', 'center-actions')).append(back); host.append(card); return;
    }
    const row = el('div', 'center-actions');
    const back = el('button', 'btn ghost', 'Back'); back.addEventListener('click', () => renderList(host));
    const go = el('button', 'btn primary big', set.timeLimitS ? `Begin · ${Math.round(set.timeLimitS / 60)} min timer` : 'Begin');
    go.addEventListener('click', () => { if (go.disabled) return; go.disabled = true; go.textContent = 'Starting…'; beginRun(host, set, items); });
    row.append(back, go); card.append(row); host.append(card); typeset(card);
  }
  function introBlock(b) {
    if (b.type === 'directions') return el('div', 'drill-directions', b.html);
    if (b.type === 'reference') return el('div', 'scaffold', `<b>${esc(b.title)}</b><br>${b.html}`);
    if (b.type === 'example') return el('div', 'drill-example', `<div class="drill-exlabel">${esc(b.title)}</div>${b.html}`);
    return el('div', null, b.html);
  }

  async function beginRun(host, set, items) {
    const { data, error } = await sb.from('wc_drill_runs').insert({ user_id: profile.id, set_id: set.id, scoring: set.scoring || 'none', n_items: items.length }).select().single();
    if (error) { alert('Could not start: ' + error.message); return; }
    active = { set, items, run: data, startedAt: Date.now(), answers: new Map(), notes: new Map(), timer: null, host };
    $('#tabs').hidden = true;
    renderForm();
  }

  // ---------- the form ----------
  function renderForm() {
    const { set, items, host } = active;
    host.innerHTML = '';
    const hud = el('div', 'drill-hud');
    hud.append(el('div', null, `<b>${esc(set.title)}</b>`));
    const prog = el('div', 'drill-prog', `0 / ${items.length}`);
    const clock = el('div', 'drill-clock', set.timeLimitS ? fmtClock(set.timeLimitS) : '');
    hud.append(prog, clock); host.append(hud);
    active.prog = prog;

    const form = el('div', 'drill-form');
    if (set.passages) {
      for (const p of set.passages) {
        const wrap = el('div', 'card');
        wrap.append(el('div', 'drill-passage', p.html));
        const noteRow = el('div', 'drill-note');
        noteRow.append(el('label', null, 'The author\'s point is …'));
        const ta = el('textarea'); ta.rows = 2; ta.placeholder = 'one sentence, in your words — the questions open when it is written';
        const qs = el('div'); qs.hidden = true;
        ta.addEventListener('input', () => { active.notes.set(p.id, ta.value); qs.hidden = words(ta.value) < 5; });
        noteRow.append(ta); wrap.append(noteRow);
        items.filter(i => i.passage === p.id).forEach((it, idx) => qs.append(itemNode(it, items.indexOf(it) + 1)));
        wrap.append(qs); form.append(wrap);
      }
    } else {
      const wrap = el('div', 'card');
      items.forEach((it, i) => wrap.append(itemNode(it, i + 1)));
      form.append(wrap);
    }
    const row = el('div', 'center-actions');
    const submit = el('button', 'btn primary big', 'Submit section');
    submit.addEventListener('click', () => {
      const left = items.length - active.answers.size;
      if (left > 0 && !confirm(`${left} question${left > 1 ? 's' : ''} left blank. Submit anyway?`)) return;
      finishRun(false);
    });
    row.append(submit); form.append(row); host.append(form);
    typeset(form);
    if (set.timeLimitS) {
      const end = active.startedAt + set.timeLimitS * 1000;
      const myRun = active.run.id;
      const id = setInterval(() => {
        // a timer only ever acts on the run it was started for — never on a later set
        if (!active || active.run.id !== myRun) { clearInterval(id); return; }
        const left = Math.max(0, Math.round((end - Date.now()) / 1000));
        clock.textContent = fmtClock(left); clock.classList.toggle('warn', left <= 60);
        if (left <= 0) { clearInterval(id); finishRun(true); }
      }, 500);
      active.timer = id;
    }
    window.scrollTo(0, 0);
  }
  const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function record(item, chosen, extra) {
    if (chosen == null || chosen === '') active.answers.delete(item.id);
    else active.answers.set(item.id, { chosen, at: Date.now() - active.startedAt, ...(extra || {}) });
    active.prog.textContent = `${active.answers.size} / ${active.items.length}`;
  }
  function itemNode(item, n) {
    const node = el('div', 'drill-item');
    if (item.figure && D.figures[item.figure]) node.append(el('div', 'drill-figure', D.figures[item.figure]));
    node.append(el('div', 'drill-q', `<span class="drill-n">${n}.</span> ${promptHtml(item)}`));
    if (item.type === 'numeric') {
      const inp = el('input'); inp.type = 'text'; inp.placeholder = 'your answer'; inp.className = 'drill-num';
      inp.addEventListener('input', () => record(item, inp.value.trim()));
      node.append(inp);
    } else if (item.type === 'checklist') {
      const row = el('div', 'drill-check');
      const ok = el('button', 'btn small-btn', '✓ correct'), miss = el('button', 'btn small-btn', '✗ missed');
      ok.addEventListener('click', () => { ok.classList.add('picked-ok'); miss.classList.remove('picked-miss'); record(item, 'ok'); });
      miss.addEventListener('click', () => { miss.classList.add('picked-miss'); ok.classList.remove('picked-ok'); record(item, 'miss'); });
      row.append(ok, miss); node.append(row);
    } else {
      const choices = el('div', 'choices');
      for (const [letter, text] of item.choices) {
        const b = el('button', 'choice', `<span class="letter">${letter}</span>${text}`);
        b.addEventListener('click', () => {
          const was = b.classList.contains('picked');
          choices.querySelectorAll('.choice').forEach(x => x.classList.remove('picked'));
          if (!was) b.classList.add('picked');
          record(item, was ? null : letter, { note: node.querySelector('textarea')?.value || null });
        });
        choices.append(b);
      }
      if (item.type === 'analogy') {
        const br = el('div', 'drill-note');
        br.append(el('label', null, 'Bridge sentence first:'));
        const ta = el('textarea'); ta.rows = 1; ta.placeholder = 'e.g. "A ___ is by definition ___"';
        choices.hidden = true;
        ta.addEventListener('input', () => { choices.hidden = words(ta.value) < 4; });
        br.append(ta); node.append(br);
      }
      node.append(choices);
    }
    return node;
  }

  // ---------- grading + persistence ----------
  async function finishRun(timedOut) {
    if (!active || active.finishing) return;
    active.finishing = true;
    if (active.timer) clearInterval(active.timer);
    active.host.querySelectorAll('button').forEach(b => b.disabled = true);
    const { set, items, run, host } = active;
    const durationS = Math.round((Date.now() - active.startedAt) / 1000);
    const results = items.map(item => {
      const a = active.answers.get(item.id);
      const correct = a ? grade(item, a.chosen) : null;
      const note = item.passage ? (active.notes.get(item.passage) || null) : (a?.note || null);
      return { item, chosen: a?.chosen ?? null, correct, blank: correct == null, timed_out: !a && timedOut, latency_ms: a?.at ?? null, note };
    });
    const nCorrect = results.filter(r => r.correct === true).length, nWrong = results.filter(r => r.correct === false).length, nBlank = results.filter(r => r.blank).length;
    const raw = set.scoring === 'ssat' ? nCorrect - nWrong / 4 : nCorrect;
    const rows = results.map(r => ({
      run_id: run.id, user_id: profile.id, set_id: set.id, item_id: r.item.id, kind: r.item.type, skills: r.item.skills || [],
      chosen: r.chosen, correct: r.correct, blank: r.blank, timed_out: r.timed_out, latency_ms: r.latency_ms, note: r.note,
    }));
    const ins = await sb.from('wc_drill_attempts').insert(rows).select();
    if (ins.error) alert('Saving answers failed: ' + ins.error.message);
    const idByItem = new Map((ins.data || []).map(x => [x.item_id, x.id]));
    await sb.from('wc_drill_runs').update({ finished_at: new Date().toISOString(), duration_s: durationS, timed_out: timedOut, n_items: items.length, n_correct: nCorrect, n_wrong: nWrong, n_blank: nBlank, raw_score: raw, logs_complete: nWrong === 0 }).eq('id', run.id);
    const done = { ...run, duration_s: durationS, timed_out: timedOut, n_correct: nCorrect, n_wrong: nWrong, n_blank: nBlank, raw_score: raw };
    active = null; $('#tabs').hidden = false;
    renderResults(host, set, done, results.map(r => ({ ...r, attemptId: idByItem.get(r.item.id) })));
  }

  async function reopenLogs(host, set, run) {
    host.innerHTML = '<div class="loading">loading…</div>';
    const att = await loadAttempts(profile.id, run.id);
    const items = set.dynamicFrom ? (await buildItems(set, profile.id)) : set.items;
    const results = att.map(a => ({ item: items.find(i => i.id === a.item_id) || { id: a.item_id, type: a.kind, prompt: a.item_id, skills: a.skills }, chosen: a.chosen, correct: a.correct, blank: a.blank, timed_out: a.timed_out, attemptId: a.id, error_log: a.error_log }));
    renderResults(host, set, run, results);
  }

  function renderResults(host, set, run, results) {
    host.innerHTML = '';
    const card = el('div', 'card');
    card.append(el('div', 'item-kind', esc(set.day)), el('h2', null, `${esc(set.title)} — ${run.timed_out ? 'time expired' : 'submitted'}`));
    const stats = el('div', 'stat-row');
    stats.append(el('div', 'stat', `<b>${run.n_correct}</b><span>correct</span>`), el('div', 'stat', `<b>${run.n_wrong}</b><span>wrong</span>`), el('div', 'stat', `<b>${run.n_blank}</b><span>blank</span>`));
    if (set.scoring === 'ssat') stats.append(el('div', 'stat', `<b>${run.raw_score}</b><span>raw (−¼ per wrong)</span>`));
    if (run.duration_s != null) stats.append(el('div', 'stat', `<b>${fmtClock(run.duration_s)}</b><span>time</span>`));
    card.append(stats);
    const misses = results.filter(r => r.correct === false);
    if (misses.length) card.append(el('p', 'sub', `${misses.length} to log. For each miss, one line in your own words — <i>what got me</i>. The set is finished when every line is written.`));
    else card.append(el('p', 'sub', run.n_blank ? 'No misses. Blanks are not misses — but check the ones you skipped below.' : 'Clean sheet.'));
    host.append(card);

    const list = el('div', 'card');
    const logs = new Map();
    results.forEach((r, i) => {
      const it = r.item;
      const mark = r.correct === true ? '✓' : r.correct === false ? '✗' : (r.timed_out ? '⏱' : '—');
      const cls = r.correct === true ? 'good' : r.correct === false ? 'bad' : 'blank';
      const node = el('div', `drill-result ${cls}`);
      const yours = it.type === 'checklist' ? (r.chosen === 'ok' ? '✓' : r.chosen === 'miss' ? '✗' : 'unmarked') : (r.chosen ?? (r.timed_out ? 'not reached' : 'blank'));
      const right = it.type === 'checklist' ? '' : it.type === 'numeric' ? it.answer : it.answer;
      node.append(el('div', 'drill-q', `<span class="drill-n">${mark} ${i + 1}.</span> ${promptHtml(it)}`));
      if (it.type !== 'checklist') node.append(el('div', 'drill-ans', `Your answer: <b>${esc(yours)}</b>${r.correct === true ? '' : ` · Correct: <b>${esc(right)}</b>`}`));
      if (it.explain && (r.correct !== true || it.type === 'numeric')) node.append(el('div', 'drill-explain', it.explain));
      if (r.correct === false) {
        const lg = el('div', 'drill-note');
        lg.append(el('label', null, 'What got me:'));
        const ta = el('textarea'); ta.rows = 2; ta.placeholder = 'one line, your words (at least 4 words)'; ta.value = r.error_log || '';
        ta.addEventListener('input', () => logs.set(r.attemptId, ta.value));
        lg.append(ta); node.append(lg);
      }
      list.append(node);
    });
    const row = el('div', 'center-actions');
    if (misses.length) {
      const msg = el('p', 'form-msg', '');
      const save = el('button', 'btn primary', 'Save error log');
      save.addEventListener('click', async () => {
        const pending = misses.filter(m => words(logs.get(m.attemptId) ?? m.error_log) < 4);
        if (pending.length) { msg.textContent = `${pending.length} line${pending.length > 1 ? 's' : ''} still need at least 4 words.`; return; }
        save.disabled = true;
        for (const [id, text] of logs) await sb.from('wc_drill_attempts').update({ error_log: text.trim() }).eq('id', id);
        await sb.from('wc_drill_runs').update({ logs_complete: true }).eq('id', run.id);
        msg.textContent = ''; save.textContent = 'Saved ✓';
        setTimeout(() => renderList(host), 600);
      });
      row.append(save); list.append(msg);
    }
    const back = el('button', 'btn ghost', 'Back to drills'); back.addEventListener('click', () => renderList(host));
    row.append(back); list.append(row); host.append(list);
    typeset(host); window.scrollTo(0, 0);
  }

  // ---------- coach view ----------
  async function renderCoach(card, student) {
    const [runs, att] = await Promise.all([loadRuns(student.id), loadAttempts(student.id)]);
    const finished = runs.filter(r => r.finished_at);
    card.append(el('h2', null, 'Drills'));
    if (!finished.length) { card.append(el('p', 'sub', 'No drill sets completed yet.')); return; }
    const skills = new Map();
    for (const a of att) {
      if (a.correct == null) continue;
      for (const k of a.skills || []) {
        const s = skills.get(k) || { n: 0, c: 0, last: null, lastMiss: null };
        s.n++; if (a.correct) s.c++; else s.lastMiss = a.created_at; s.last = a.created_at; skills.set(k, s);
      }
    }
    const rowsSk = [...skills.entries()].map(([k, s]) => ({ k, ...s, pct: s.c / s.n })).filter(r => !r.k.startsWith('w:'));
    const weak = rowsSk.filter(r => r.n - r.c > 0).sort((a, b) => (a.pct - b.pct) || (b.n - a.n)).slice(0, 12);
    if (weak.length) {
      card.append(el('p', 'sub', 'Where the misses cluster (lowest accuracy first):'));
      const tbl = el('table', 'tbl', '<tr><th>skill</th><th>right</th><th>tries</th><th>last miss</th></tr>');
      for (const r of weak) tbl.insertAdjacentHTML('beforeend', `<tr><td>${esc(skillLabel(r.k))}</td><td>${r.c}</td><td>${r.n}</td><td>${fmtDate(r.lastMiss)}</td></tr>`);
      card.append(tbl);
    }
    const wordMiss = [...skills.entries()].filter(([k, s]) => k.startsWith('w:') && s.n - s.c > 0).map(([k]) => k.slice(2));
    if (wordMiss.length) card.append(el('p', 'flag', `Words missed in drills: ${esc(wordMiss.join(', '))}`));
    const tbl = el('table', 'tbl', '<tr><th>date</th><th>set</th><th>score</th><th>time</th><th>log</th></tr>');
    for (const r of finished.slice(0, 12)) {
      const s = setById(r.set_id);
      const sc = s?.type === 'card' ? 'read' : r.scoring === 'ssat' ? `${r.n_correct}/${r.n_items} · raw ${r.raw_score}` : `${r.n_correct}/${r.n_items}`;
      tbl.insertAdjacentHTML('beforeend', `<tr><td>${fmtDate(r.started_at)}</td><td>${esc(s?.title || r.set_id)}</td><td>${sc}${r.n_blank ? ` · ${r.n_blank} blank` : ''}${r.timed_out ? ' ⏱' : ''}</td><td>${r.duration_s != null ? fmtClock(r.duration_s) : '—'}</td><td>${r.n_wrong === 0 ? '—' : r.logs_complete ? '✓' : 'pending'}</td></tr>`);
    }
    card.append(tbl);
    const logged = att.filter(a => a.error_log).sort((a, b) => b.created_at < a.created_at ? -1 : 1).slice(0, 8);
    if (logged.length) {
      card.append(el('h2', null, 'Error log (latest)'));
      const ul = el('ul', 'miss-list');
      for (const a of logged) {
        const it = setById(a.set_id)?.items.find(i => i.id === a.item_id);
        ul.append(el('li', null, `<span class="w">${esc((a.skills || []).filter(k => !k.startsWith('w:')).map(skillLabel).join(', ') || a.item_id)}</span> — “${esc(a.error_log)}”${it?.type === 'checklist' ? ` <i>(${esc(it.prompt)})</i>` : ''}`));
      }
      card.append(ul);
    }
  }

  return { init, renderList, renderCoach, startSet, _grade: grade, _normNum: normNum };
})();
