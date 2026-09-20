// Loads the app's scripts into a vm context with a stub DOM and a fake Supabase client, in index.html order.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function elStub() {
  const e = {
    addEventListener() {}, querySelectorAll() { return []; }, querySelector() { return null; },
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    style: {}, dataset: {}, children: [], hidden: false, disabled: false, value: '', textContent: '', innerHTML: '',
    append() {}, remove() {}, insertAdjacentHTML() {}, focus() {}, click() {},
  };
  return e;
}
export function domStub() {
  return { querySelector: () => elStub(), querySelectorAll: () => [], createElement: () => elStub(), body: elStub() };
}
export function memStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}

// A fake supabase-js client: `tables` is { name: rows[] }; every write is appended to `log`.
export function fakeClient(tables = {}, log = []) {
  const client = {
    tables, log,
    auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }), signInWithPassword: async () => ({ error: null }), signOut: async () => ({}) },
  };
  client.from = name => {
    const q = { op: 'select', filters: [], rows: null, single: false, head: false, limit: null, returning: false };
    const b = {
      select(cols, opts) { if (q.op === 'select') q.head = !!opts?.head; q.returning = true; return b; },
      insert(rows) {
        q.op = 'insert'; q.rows = Array.isArray(rows) ? rows : [rows];
        tables[name] ||= [];
        q.inserted = q.rows.map(r => { const row = { id: tables[name].length + 1, created_at: new Date().toISOString(), ...r }; tables[name].push(row); return row; });
        log.push({ table: name, op: 'insert', rows: q.rows }); return b;
      },
      update(patch) { q.op = 'update'; q.patch = patch; log.push({ table: name, op: 'update', patch }); return b; },
      upsert(row) { q.op = 'upsert'; log.push({ table: name, op: 'upsert', row }); return b; },
      eq(k, v) { q.filters.push(r => r[k] === v); return b; },
      neq(k, v) { q.filters.push(r => r[k] !== v); return b; },
      gte(k, v) { q.filters.push(r => r[k] >= v); return b; },
      in(k, vs) { q.filters.push(r => vs.includes(r[k])); return b; },
      not() { return b; }, order() { return b; },
      limit(n) { q.limit = n; return b; },
      maybeSingle() { q.single = true; return b; }, single() { q.single = true; return b; },
      then(res, rej) {
        let data = null, count = null;
        if (q.op === 'select') {
          data = (tables[name] || []).filter(r => q.filters.every(f => f(r)));
          if (q.limit) data = data.slice(0, q.limit);
          if (q.head) { count = data.length; data = null; }
        } else if (q.op === 'insert') data = q.returning ? q.inserted : null;
        if (q.single && Array.isArray(data)) data = data[0] ?? null;
        return Promise.resolve({ data, error: null, count }).then(res, rej);
      },
    };
    return b;
  };
  return client;
}

export function loadApp({ files = ['config.js', 'engine.js', 'drills_content.js', 'content_versions.js', 'drills.js', 'dashboard.js', 'app.js'], client } = {}) {
  const sb = client || fakeClient();
  const window = { supabase: { createClient: () => sb }, MathJax: null, scrollTo() {}, location: { reload() {} }, crypto: globalThis.crypto };
  const ctx = {
    window, document: domStub(), localStorage: memStorage(), crypto: globalThis.crypto, TextEncoder, Intl, console,
    setInterval, clearInterval, setTimeout, clearTimeout, alert() {}, confirm() { return true; },
    fetch: () => Promise.reject(new Error('no fetch in tests')), Date, Math, JSON, Promise, Map, Set, Object, Array, String, Number, RegExp, Error,
  };
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(readFileSync(path.join(root, f), 'utf8') + '\n;', ctx, { filename: f });
  return { ctx, sb, get: name => vm.runInContext(name, ctx) };
}
