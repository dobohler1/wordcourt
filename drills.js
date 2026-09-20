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
  // soft tones for pacing sets (created on the Begin click so the browser allows audio)
  let audio = null;
  function tone(freq, dur) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, audio.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + dur + 0.05);
    } catch {}
  }

  const tzName = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; } };
  const report = (site, e, detail) => { try { Engine.reportError(site, e, detail); } catch { console.warn(site, e); } };

  // ---------- content registry: name the exact content a run showed ----------
  // canonical JSON (sorted keys, no whitespace) + SHA-256, byte-identical to analyst/build_content.mjs
  const canon = v => {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    const keys = Object.keys(v).filter(k => v[k] !== undefined).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  };
  async function sha256(s) {
    try { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
    catch { return null; }
  }
  async function setHash(set) {
    const { items, _remote, ...rest } = set;
    const ih = [];
    for (const it of (items || [])) { const h = await sha256(canon(it)); if (!h) return null; ih.push(h); }
    return sha256(canon({ set: rest, items: ih }));
  }
  // set version id + item version ids for the content in hand; nulls when the registry has not been synced yet
  async function registryFor(set) {
    const out = { hash: null, setVersionId: null, itemVersionIds: new Map() };
    try {
      out.hash = await setHash(set);
      let row = null;
      if (out.hash) { const r = await sb.from('wc_set_versions').select('id').eq('set_id', set.id).eq('content_hash', out.hash).maybeSingle(); if (r.error) throw r.error; row = r.data; }
      if (!row && set._remote) { const r = await sb.from('wc_set_versions').select('id').eq('set_id', set.id).eq('source', 'remote').order('valid_from', { ascending: false }).limit(1).maybeSingle(); if (r.error) throw r.error; row = r.data; }
      if (row) {
        out.setVersionId = row.id;
        const r = await sb.from('wc_set_version_items').select('item_version_id, wc_item_versions(item_id)').eq('set_version_id', row.id);
        if (r.error) throw r.error;
        for (const x of (r.data || [])) if (x.wc_item_versions?.item_id) out.itemVersionIds.set(x.wc_item_versions.item_id, x.item_version_id);
      }
    } catch (e) { report('registry.lookup', e, { set_id: set.id }); }
    return out;
  }
  // conditions of observation, frozen on the run row so later edits to the set cannot rewrite history
  const BLANK_RULE = { isee: 'never_blank', ssat: 'quarter_penalty' };
  function purposeOf(set) {
    if (set.type === 'card') return 'card';
    if (/^lesson\d+_/.test(set.id)) return 'check';
    if (set.paceCapS) return 'pacing';
    if (/correction/.test(set.id)) return 'correction';
    return 'practice';
  }
  function conditionsOf(set, items) {
    return {
      timed: !!set.timeLimitS, time_limit_s: set.timeLimitS ?? null,
      cap_s: set.paceCapS ?? null, first_cap_s: set.paceCapS ? (set.paceFirstCapS || set.paceCapS * 3) : null,
      scoring: set.scoring || 'none', blank_rule: BLANK_RULE[set.scoring] ?? null,
      gated: !!(set.passages && !set.noGate), recall_prompt: !!set.recallPrompt,
      reference_before_run: (set.intro || []).some(b => b.type === 'reference' || b.type === 'example'),
      dynamic: !!set.dynamicFrom, remote: !!set._remote, n_items: (items || []).length,
    };
  }
  const ACTIVITY_KIND = { card: 'card', check: 'mastery_check', pacing: 'pacing_set', correction: 'correction', practice: 'drill' };

  let remote = null;   // rows already merged from wc_drill_sets (null = not loaded yet)
  function init(client, prof) { sb = client; profile = prof; remote = null; }
  const isCoach = () => profile?.role === 'coach';
  // done = Set of finished set ids for this user; a set with `requires` opens only after that set is finished
  const available = (set, done) => isCoach() || ((!set.availableFrom || todayStr() >= set.availableFrom) && (!set.requires || !!done?.has(set.requires)));
  // sets restricted to named student handles are hidden from everyone else (the server enforces this too)
  const visible = set => !set.forHandles || isCoach() || set.forHandles.includes(profile?.handle);

  // ---------- sets stored in the database ----------
  // Some sets live in wc_drill_sets rather than drills_content.js — passages under copyright must not sit in the
  // public repo. Rows are merged into D.sets once per login; RLS returns only the rows this user may see.
  async function ensureRemote() {
    if (remote) return remote;
    try {
      const { data, error } = await sb.from('wc_drill_sets').select('set_id, set');
      if (error) throw error;
      for (const row of data || []) {
        const set = { ...row.set, id: row.set_id };
        Object.defineProperty(set, '_remote', { value: true, enumerable: false });   // not part of the hashed content
        if (set.skills) Object.assign(D.skills, set.skills);
        const i = D.sets.findIndex(s => s.id === set.id);
        if (i >= 0) D.sets[i] = set; else D.sets.push(set);
      }
      remote = data || [];
    } catch (e) { console.warn('remote drill sets unavailable:', e.message); remote = []; }
    return remote;
  }
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
    return chosen === item.answer;
  }

  // ---------- data ----------
  async function loadRuns(userId) {
    const { data, error } = await sb.from('wc_drill_runs').select('*').eq('user_id', userId).order('started_at', { ascending: false });
    if (error) throw error;
    // runs a stray timer force-submitted instantly (Sept 1 bug) are flagged is_junk in the database, never deleted
    return (data || []).filter(r => !r.is_junk);
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
    await ensureRemote();
    try { runs = await loadRuns(profile.id); } catch (e) { host.innerHTML = `<div class="card"><p class="flag">Could not load drills: ${esc(e.message)}</p></div>`; return; }
    host.innerHTML = '';
    const byDay = new Map();
    for (const s of [...D.sets].filter(visible).sort((a, b) => a.order - b.order)) { if (!byDay.has(s.day)) byDay.set(s.day, []); byDay.get(s.day).push(s); }
    const intro = el('div', 'card');
    intro.append(el('h2', null, 'Drills'), el('p', 'sub', 'The practice booklet, online. Everything is checked automatically; each miss asks for a one-line error log — <i>what got me</i> — before the set counts as finished.'));
    host.append(intro);
    const done = new Set(runs.filter(r => r.finished_at).map(r => r.set_id));
    for (const [day, sets] of byDay) {
      const card = el('div', 'card');
      const open = sets.some(s => available(s, done));
      card.append(el('h2', null, `${esc(day)}${open ? '' : ' <span class="drill-lock">🔒 opens ' + esc(sets[0].availableFrom) + '</span>'}`));
      const ul = el('ul', 'drill-list');
      for (const s of sets) {
        const mine = runs.filter(r => r.set_id === s.id && r.finished_at);
        const best = mine[0];
        let status = '<span class="drill-status todo">not started</span>';
        if (!best && s.requires && !done.has(s.requires) && !isCoach()) status = `<span class="drill-status todo">🔒 ${esc(s.requiresLabel || 'locked')}</span>`;
        if (best) {
          const sc = best.scoring === 'ssat' ? `raw ${best.raw_score}` : `${best.n_correct}/${best.n_items}`;
          status = `<span class="drill-status ${best.logs_complete || best.n_wrong === 0 ? 'done' : 'pending'}">${s.type === 'card' ? 'read' : sc}${best.n_wrong && !best.logs_complete ? ' · error log pending' : ''}</span>`;
        }
        const li = el('li', null, `<div><b>${esc(s.title)}</b><div class="drill-sub">${esc(s.subtitle || '')}</div></div>`);
        const right = el('div', 'drill-right', status);
        const btn = el('button', 'btn small-btn' + (best ? '' : ' primary'), best ? (best.n_wrong && !best.logs_complete ? 'Finish log' : 'Redo') : (s.type === 'card' ? 'Read' : 'Start'));
        btn.disabled = !available(s, done);
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
        const reg = await registryFor(set);
        const now = new Date().toISOString();
        const ins = await sb.from('wc_drill_runs').insert({
          user_id: profile.id, set_id: set.id, scoring: 'none', finished_at: now, n_items: 0, logs_complete: true,
          purpose: 'card', conditions: conditionsOf(set, []), tz: tzName(), local_day: todayStr(), set_version_id: reg.setVersionId, set_content_hash: reg.hash,
        }).select().single();
        if (ins.error) report('wc_drill_runs.insert(card)', ins.error, { set_id: set.id });
        else {
          const act = await sb.from('wc_activity_log').insert({ user_id: profile.id, kind_id: 'card', started_at: now, ended_at: now, minutes: 1, targets: [], run_id: ins.data.id, outcome: { read: true }, reported_by: 'app', created_by: profile.id });
          if (act.error) report('wc_activity_log.insert(card)', act.error, { set_id: set.id });
        }
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
    const reg = await registryFor(set);
    const { data, error } = await sb.from('wc_drill_runs').insert({
      user_id: profile.id, set_id: set.id, scoring: set.scoring || 'none', n_items: items.length,
      purpose: purposeOf(set), conditions: conditionsOf(set, items), tz: tzName(), local_day: todayStr(),
      set_version_id: reg.setVersionId, set_content_hash: reg.hash,
    }).select().single();
    if (error) { report('wc_drill_runs.insert', error, { set_id: set.id }); alert('Could not start: ' + error.message); return; }
    active = { set, items, run: data, startedAt: Date.now(), answers: new Map(), notes: new Map(), timer: null, host,
      lastAnswerAt: 0, passagesSeen: new Set(), paceToned: false, warned: false,
      proc: new Map(), events: [], registry: reg };   // proc: per-item process facts that survive a cleared answer
    if (set.paceCapS) tone(660, 0.15);   // unlocks audio for the later chimes
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
    hud.append(prog);
    let pace = null, banner = null;
    if (set.paceCapS) {
      // pacing sets: a per-question dwell clock (time since the previous answer) with a soft chime at the cap
      pace = el('div', 'drill-pace', 'this question 0:00');
      hud.append(pace);
      banner = el('div', 'drill-banner'); banner.hidden = true;
    }
    hud.append(clock); host.append(hud);
    if (banner) host.append(banner);
    active.prog = prog; active.pace = pace; active.banner = banner;

    const form = el('div', 'drill-form');
    if (set.passages) {
      for (const p of set.passages) {
        const wrap = el('div', 'card');
        wrap.append(el('div', 'drill-passage', p.html));
        const qs = el('div');
        if (!set.noGate) {   // house rule for the booklet drills; standardized-test-format sets set noGate: true
          const noteRow = el('div', 'drill-note');
          noteRow.append(el('label', null, 'The author\'s point is …'));
          const ta = el('textarea'); ta.rows = 2; ta.placeholder = 'one sentence, in your words — the questions open when it is written';
          qs.hidden = true;
          ta.addEventListener('input', () => { active.notes.set(p.id, ta.value); qs.hidden = words(ta.value) < 5; });
          noteRow.append(ta); wrap.append(noteRow);
        }
        items.filter(i => i.passage === p.id).forEach((it, idx) => qs.append(itemNode(it, items.indexOf(it) + 1)));
        wrap.append(qs); form.append(wrap);
      }
      const rest = items.filter(i => !i.passage);   // e.g. chapter-recall questions after the passage block
      if (rest.length) {
        const wrap = el('div', 'card');
        const qs = el('div');
        if (set.recallPrompt) {
          const noteRow = el('div', 'drill-note');
          noteRow.append(el('label', null, set.recallPrompt));
          const ta = el('textarea'); ta.rows = 2; ta.placeholder = 'one sentence, in your words';
          qs.hidden = true;
          ta.addEventListener('input', () => { active.notes.set('_recall', ta.value); qs.hidden = words(ta.value) < 5; });
          noteRow.append(ta); wrap.append(noteRow);
        }
        rest.forEach(it => qs.append(itemNode(it, items.indexOf(it) + 1)));
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
        if (set.paceCapS) {
          const dwell = Math.floor((Date.now() - active.startedAt - active.lastAnswerAt) / 1000);
          const over = dwell > set.paceCapS;
          pace.textContent = over ? `this question ${fmtClock(dwell)} · bubble your best guess and move on` : `this question ${fmtClock(dwell)}`;
          pace.classList.toggle('over', over);
          if (over && !active.paceToned) { active.paceToned = true; tone(880, 0.35); }
          if (left <= 60 && !active.warned) { active.warned = true; tone(440, 1.2); banner.hidden = false; }
          if (!banner.hidden) {
            const n = items.length - active.answers.size;
            banner.innerHTML = n ? `<b>One minute.</b> Fill every remaining answer now — <b>${n}</b> still blank.` : `<b>One minute.</b> Every question has an answer. Check the ones you circled.`;
          }
        }
        if (left <= 0) { clearInterval(id); finishRun(true); }
      }, 500);
      active.timer = id;
    }
    window.scrollTo(0, 0);
  }
  const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  // dwell = time since the previous item's first pick; the first question of a passage carries the reading time, so it gets the longer cap.
  // Measured on every set (Phase 1); over_cap is only meaningful when the set has a cap.
  function dwellOf({ at, lastAnswerAt, capS, firstCapS, firstOfPassage }) {
    const dwell_ms = at - lastAnswerAt;
    let cap = capS || null;
    if (cap && firstOfPassage) cap = firstCapS || cap * 3;
    return { dwell_ms, over_cap: cap ? dwell_ms > cap * 1000 : false };
  }
  function record(item, chosen, extra, opts = {}) {
    const at = Date.now() - active.startedAt;
    const prev = active.answers.get(item.id);
    const proc = active.proc.get(item.id) || { first_answer_ms: null, dwell_ms: null, over_cap: false, n_changes: 0 };
    if (chosen == null || chosen === '') {
      if (prev) { active.answers.delete(item.id); if (!opts.typing) { proc.n_changes++; active.events.push({ item_id: item.id, at_ms: at, event: 'clear', value: null }); } }
    } else {
      if (!prev && proc.first_answer_ms == null) {
        // first commitment on this item: dwell clock resets here (unchanged from the pacing-set behavior)
        const firstOfPassage = !!(item.passage && !active.passagesSeen.has(item.passage));
        if (firstOfPassage) active.passagesSeen.add(item.passage);
        Object.assign(proc, dwellOf({ at, lastAnswerAt: active.lastAnswerAt, capS: active.set.paceCapS, firstCapS: active.set.paceFirstCapS, firstOfPassage }), { first_answer_ms: at });
        active.lastAnswerAt = at; active.paceToned = false;
        if (active.pace) { active.pace.classList.remove('over'); active.pace.textContent = 'this question 0:00'; }
        if (!opts.typing) { proc.picked = true; active.events.push({ item_id: item.id, at_ms: at, event: 'pick', value: String(chosen) }); }
      } else if (!opts.typing && (!proc.picked || !prev || prev.chosen !== chosen)) {
        // n_changes counts changes of a standing answer plus clears; a first commit or a re-pick after a clear is a 'pick'
        const isChange = proc.picked && !!prev;
        if (isChange) proc.n_changes++;
        proc.picked = true;
        active.events.push({ item_id: item.id, at_ms: at, event: isChange ? 'change' : 'pick', value: String(chosen) });
      }
      active.answers.set(item.id, { chosen, at, ...(extra || {}) });
    }
    active.proc.set(item.id, proc);
    active.prog.textContent = `${active.answers.size} / ${active.items.length}`;
  }
  function itemNode(item, n) {
    const node = el('div', 'drill-item');
    if (item.figure && D.figures[item.figure]) node.append(el('div', 'drill-figure', D.figures[item.figure]));
    node.append(el('div', 'drill-q', `<span class="drill-n">${n}.</span> ${promptHtml(item)}`));
    if (item.type === 'numeric') {
      const inp = el('input'); inp.type = 'text'; inp.placeholder = 'your answer'; inp.className = 'drill-num';
      // keystrokes update the answer silently; a committed value (blur or Enter) is the event that counts
      inp.addEventListener('input', () => record(item, inp.value.trim(), null, { typing: true }));
      inp.addEventListener('change', () => record(item, inp.value.trim()));
      node.append(inp);
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
    const results = items.map((item, idx) => {
      const a = active.answers.get(item.id);
      const p = active.proc.get(item.id) || {};
      const correct = a ? grade(item, a.chosen) : null;
      const note = item.passage ? (active.notes.get(item.passage) || null) : (set.recallPrompt ? (active.notes.get('_recall') || null) : (a?.note || null));
      return { item, position: idx + 1, chosen: a?.chosen ?? null, correct, blank: correct == null, timed_out: !a && timedOut, latency_ms: a?.at ?? null, note,
        dwell_ms: a ? (p.dwell_ms ?? null) : null, over_cap: !!(a && p.over_cap), first_answer_ms: a ? (p.first_answer_ms ?? null) : null, n_changes: p.n_changes || 0 };
    });
    const nCorrect = results.filter(r => r.correct === true).length, nWrong = results.filter(r => r.correct === false).length, nBlank = results.filter(r => r.blank).length;
    const raw = set.scoring === 'ssat' ? nCorrect - nWrong / 4 : nCorrect;
    const reg = active.registry || { itemVersionIds: new Map() };
    const rows = results.map(r => ({
      run_id: run.id, user_id: profile.id, set_id: set.id, item_id: r.item.id, kind: r.item.type, skills: r.item.skills || [],
      chosen: r.chosen, correct: r.correct, blank: r.blank, timed_out: r.timed_out, latency_ms: r.latency_ms, note: r.note,
      dwell_ms: r.dwell_ms, over_cap: r.over_cap,
      item_version_id: reg.itemVersionIds.get(r.item.sourceItem || r.item.id) ?? null, position: r.position,
      first_answer_ms: r.first_answer_ms, n_changes: r.n_changes, reference_visible: false,
    }));
    const nOverCap = set.paceCapS ? results.filter(r => r.over_cap).length : null;
    const events = active.events.map(e => ({ ...e, run_id: run.id, user_id: profile.id }));
    const isJunk = items.length > 0 && durationS <= 1 && nBlank === items.length;   // the Sept 1 timer-bug signature, kept as a guard
    const ins = await sb.from('wc_drill_attempts').insert(rows).select();
    if (ins.error) { report('wc_drill_attempts.insert', ins.error, { run_id: run.id, n: rows.length }); alert('Saving answers failed: ' + ins.error.message); }
    const idByItem = new Map((ins.data || []).map(x => [x.item_id, x.id]));
    const upd = await sb.from('wc_drill_runs').update({ finished_at: new Date().toISOString(), duration_s: durationS, timed_out: timedOut, n_items: items.length, n_correct: nCorrect, n_wrong: nWrong, n_blank: nBlank, raw_score: raw, logs_complete: nWrong === 0, n_over_cap: nOverCap, n_unreached: nBlank, is_junk: isJunk }).eq('id', run.id);
    if (upd.error) report('wc_drill_runs.update', upd.error, { run_id: run.id });
    // evidence written beside the attempts: interaction events, the student's own lines, and the activity row
    if (events.length) { const ev = await sb.from('wc_answer_events').insert(events); if (ev.error) report('wc_answer_events.insert', ev.error, { run_id: run.id, n: events.length }); }
    const refl = [];
    for (const p of (set.passages || [])) { const t = active.notes.get(p.id); if (t && t.trim()) refl.push({ user_id: profile.id, kind: 'author_point', run_id: run.id, passage_id: p.id, text: t.trim() }); }
    if (set.recallPrompt && active.notes.get('_recall')?.trim()) refl.push({ user_id: profile.id, kind: 'recall', run_id: run.id, passage_id: '_recall', text: active.notes.get('_recall').trim() });
    for (const r of results) if (r.item.type === 'analogy' && r.note && r.note.trim() && idByItem.get(r.item.id)) refl.push({ user_id: profile.id, kind: 'bridge', run_id: run.id, attempt_id: idByItem.get(r.item.id), text: r.note.trim() });
    if (refl.length) { const rf = await sb.from('wc_reflections').insert(refl); if (rf.error) report('wc_reflections.insert(run)', rf.error, { run_id: run.id, n: refl.length }); }
    if (!isJunk) {
      const targets = [...new Set(items.flatMap(i => i.skills || []).filter(k => !k.startsWith('w:')))];
      const act = await sb.from('wc_activity_log').insert({
        user_id: profile.id, kind_id: ACTIVITY_KIND[purposeOf(set)] || 'drill', started_at: run.started_at || new Date(active.startedAt).toISOString(), ended_at: new Date().toISOString(),
        minutes: Math.max(1, Math.round(durationS / 60)), targets, run_id: run.id,
        outcome: { n_items: items.length, n_correct: nCorrect, n_wrong: nWrong, n_blank: nBlank, n_over_cap: nOverCap, timed_out: timedOut }, reported_by: 'app', created_by: profile.id,
      });
      if (act.error) report('wc_activity_log.insert(run)', act.error, { run_id: run.id });
    }
    const done = { ...run, duration_s: durationS, timed_out: timedOut, n_correct: nCorrect, n_wrong: nWrong, n_blank: nBlank, raw_score: raw, n_over_cap: nOverCap, n_unreached: nBlank };
    active = null; $('#tabs').hidden = false;
    renderResults(host, set, done, results.map(r => ({ ...r, attemptId: idByItem.get(r.item.id) })));
  }

  async function reopenLogs(host, set, run) {
    host.innerHTML = '<div class="loading">loading…</div>';
    const att = await loadAttempts(profile.id, run.id);
    const items = set.dynamicFrom ? (await buildItems(set, profile.id)) : set.items;
    const results = att.map(a => ({ item: items.find(i => i.id === a.item_id) || { id: a.item_id, type: a.kind, prompt: a.item_id, skills: a.skills }, chosen: a.chosen, correct: a.correct, blank: a.blank, timed_out: a.timed_out, attemptId: a.id, error_log: a.error_log, dwell_ms: a.dwell_ms, over_cap: a.over_cap }));
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
    if (set.paceCapS) {
      const over = run.n_over_cap ?? results.filter(r => r.over_cap).length;
      stats.append(el('div', 'stat ' + (over ? 'bad' : 'good'), `<b>${over}</b><span>over ${set.paceCapS} s</span>`));
      stats.append(el('div', 'stat ' + (run.n_blank ? 'bad' : 'good'), `<b>${run.n_blank}</b><span>unanswered</span>`));
      card.append(stats);
      card.append(el('p', 'sub', `The two numbers that matter on a pacing set: <b>${over}</b> over the cap and <b>${run.n_blank}</b> unanswered. The target is zero and zero.`));
    } else card.append(stats);
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
      const yours = r.chosen ?? (r.timed_out ? 'not reached' : 'blank');
      const right = it.answer;
      node.append(el('div', 'drill-q', `<span class="drill-n">${mark} ${i + 1}.</span> ${promptHtml(it)}`));
      // the dwell readout stays a pacing-set feature on screen; dwell is stored for every set
      const dwell = set.paceCapS && r.dwell_ms != null ? ` · <span class="${r.over_cap ? 'pace-over' : 'dim'}">⏱ ${fmtClock(Math.round(r.dwell_ms / 1000))}${r.over_cap ? ' — over the cap' : ''}</span>` : '';
      node.append(el('div', 'drill-ans', `Your answer: <b>${esc(yours)}</b>${r.correct === true ? '' : ` · Correct: <b>${esc(right)}</b>`}${dwell}`));
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
        // dual write (Phase 1): the legacy column keeps the UI working; wc_reflections keeps every version of every line
        const ids = [...logs.keys()].filter(Boolean);
        let latest = new Map();
        if (ids.length) {
          const prev = await sb.from('wc_reflections').select('id, attempt_id, created_at').eq('kind', 'error_log').in('attempt_id', ids).order('created_at', { ascending: true });
          if (prev.error) report('wc_reflections.select', prev.error, { run_id: run.id });
          for (const p of (prev.data || [])) latest.set(p.attempt_id, p.id);
        }
        for (const [id, text] of logs) {
          if (!id) continue;
          const t = text.trim();
          const u = await sb.from('wc_drill_attempts').update({ error_log: t }).eq('id', id);
          if (u.error) report('wc_drill_attempts.update(error_log)', u.error, { attempt_id: id });
          const r = await sb.from('wc_reflections').insert({ user_id: profile.id, kind: 'error_log', attempt_id: id, run_id: run.id, text: t, supersedes_id: latest.get(id) ?? null });
          if (r.error) report('wc_reflections.insert(error_log)', r.error, { attempt_id: id });
        }
        const u2 = await sb.from('wc_drill_runs').update({ logs_complete: true }).eq('id', run.id);
        if (u2.error) report('wc_drill_runs.update(logs_complete)', u2.error, { run_id: run.id });
        msg.textContent = ''; save.textContent = 'Saved ✓';
        setTimeout(() => renderList(host), 600);
      });
      row.append(save); list.append(msg);
    }
    const back = el('button', 'btn ghost', 'Back to drills'); back.addEventListener('click', () => renderList(host));
    row.append(back); list.append(row); host.append(list);
    typeset(host); window.scrollTo(0, 0);
  }

  return { init, renderList, startSet, ensureRemote, _grade: grade, _normNum: normNum, _loadRuns: loadRuns, _loadAttempts: loadAttempts,
    // exposed for tests and the coach panel
    _canon: canon, _setHash: setHash, _dwellOf: dwellOf, _conditionsOf: conditionsOf, _purposeOf: purposeOf };
})();
