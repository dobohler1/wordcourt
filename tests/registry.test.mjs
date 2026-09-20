// Agreement between the app's hashing (drills.js) and the private build script, plus content validation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadApp, root } from './harness/load.mjs';

const analystDir = process.env.WC_ANALYST_DIR || path.join(process.env.HOME || '', 'icloud/claude/SOTC/testPrep/analyst');
const script = path.join(analystDir, 'build_content.mjs');
const have = existsSync(script);

test('build script and app compute identical set and item hashes', { skip: !have && 'private build script not present' }, async () => {
  const B = await import(script);
  const src = readFileSync(path.join(root, 'drills_content.js'), 'utf8');
  const D = B.loadContent(src);
  const { get } = loadApp({ files: ['config.js', 'engine.js', 'drills_content.js', 'content_versions.js', 'drills.js'] });
  const setHash = get('Drills._setHash'), canon = get('Drills._canon');
  for (const s of D.sets) {
    const v = B.setVersion(s);
    assert.equal(await setHash(s), v.content_hash, `set hash differs for ${s.id}`);
    for (const it of (s.items || [])) assert.equal(B.canon(it), canon(it), `canon differs for ${s.id}/${it.id}`);
  }
});

test('content_registry.json contains the shipped versions', { skip: !have && 'private build script not present' }, async () => {
  const B = await import(script);
  const D = B.loadContent(readFileSync(path.join(root, 'drills_content.js'), 'utf8'));
  const reg = JSON.parse(readFileSync(path.join(root, 'content_registry.json'), 'utf8'));
  const have = new Set(reg.sets.map(s => s.set_id + '|' + s.content_hash));
  for (const s of D.sets) assert.ok(have.has(s.id + '|' + B.setVersion(s).content_hash), `registry lacks current version of ${s.id} (regenerate)`);
  const itemKeys = new Set(reg.items.map(i => i.item_id + '|' + i.content_hash));
  for (const s of reg.sets) for (const it of s.items) assert.ok(itemKeys.has(it.item_id + '|' + it.content_hash), 'every link resolves to an item');
});

test('validator rejects a file that does not evaluate, duplicate ids, and answers not among choices', { skip: !have && 'private build script not present' }, async () => {
  const B = await import(script);
  assert.throws(() => B.loadContent("window.WORDCOURT_DRILLS = { skills: {}, sets: [ { id: 'a', title: 'It's broken' } ] };"), /does not evaluate/);
  const dup = { skills: { k: 'K' }, sets: [{ id: 'a', title: 'A', items: [{ id: 'x', type: 'mc', skills: ['k'], answer: 'A', choices: [['A', '1'], ['B', '2']] }, { id: 'x', type: 'mc', skills: ['k'], answer: 'A', choices: [['A', '1'], ['B', '2']] }] }] };
  assert.ok(B.validate(dup).some(e => /duplicate item id/.test(e)));
  const bad = { skills: { k: 'K' }, sets: [{ id: 'a', title: 'A', items: [{ id: 'x', type: 'mc', skills: ['k'], answer: 'E', choices: [['A', '1'], ['B', '2']] }] }] };
  assert.ok(B.validate(bad).some(e => /not among choices/.test(e)));
  const unl = { skills: {}, sets: [{ id: 'a', title: 'A', items: [{ id: 'x', type: 'mc', skills: ['nope'], answer: 'A', choices: [['A', '1'], ['B', '2']] }] }] };
  assert.ok(B.validate(unl).some(e => /unlabeled skill/.test(e)));
  assert.deepEqual(B.validate(B.loadContent(readFileSync(path.join(root, 'drills_content.js'), 'utf8'))), [], 'shipped content validates');
});

test('hash is stable across whitespace and key order', { skip: !have && 'private build script not present' }, async () => {
  const B = await import(script);
  const a = B.sha256(B.canon({ b: 1, a: { d: [1, 2], c: 'x' } }));
  const b = B.sha256(B.canon(JSON.parse('{ "a" : { "c":"x", "d":[1,2] }, "b":1 }')));
  assert.equal(a, b);
});
