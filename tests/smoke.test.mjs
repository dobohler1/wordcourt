// Every script loads in index.html order against a stub DOM without a reference error.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './harness/load.mjs';

test('all scripts load and expose their globals', () => {
  const { get } = loadApp();
  assert.equal(get('typeof Engine.buildSession'), 'function');
  assert.equal(get('typeof Engine.reportError'), 'function');
  assert.equal(get('typeof Engine.flag'), 'function');
  assert.equal(get('typeof Drills.renderList'), 'function');
  assert.equal(get('typeof Drills.startSet'), 'function');
  assert.equal(get('typeof Dashboard.render'), 'function');
  assert.equal(get('typeof window.WORDCOURT_DRILLS.sets.length'), 'number');
  assert.equal(get('typeof window.WORDCOURT_CONTENT_VERSIONS.built'), 'string');
});

test('content has no unused skill labels and no checklist items', () => {
  const { get } = loadApp({ files: ['config.js', 'engine.js', 'drills_content.js'] });
  const D = get('window.WORDCOURT_DRILLS');
  const used = new Set();
  for (const s of D.sets) for (const i of (s.items || [])) { assert.notEqual(i.type, 'checklist'); for (const k of (i.skills || [])) used.add(k); }
  const unused = Object.keys(D.skills).filter(k => !used.has(k));
  assert.deepEqual(unused, [], `labels with no items: ${unused.join(', ')}`);
});
