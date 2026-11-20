const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const { runInNewContext } = require('node:vm');
const data = require('../web/src/data/universityCampuses.json');
const source = require('../Res Data/uj-up-campus-source.json');

test('UJ and Tuks grounds use sourced closed boundaries and the requested colours', () => {
  assert.equal(data.campuses.filter(c => c.universityId === 'uj').length, 4);
  assert.equal(data.campuses.filter(c => c.universityId === 'up').length, 3);
  const nodes = new Set(source.elements.filter(e => e.type === 'node').map(e => `${e.lat},${e.lon}`));
  for (const campus of data.campuses) {
    assert.equal(campus.color, campus.universityId === 'uj' ? '#f97316' : '#dc2626');
    assert.ok(source.elements.some(e => e.type === campus.sourceType && e.id === campus.sourceId));
    for (const ring of campus.outlines) {
      assert.ok(ring.length >= 4);
      assert.deepEqual(ring[0], ring.at(-1));
      assert.ok(ring.every(p => nodes.has(p.join(','))), 'Every vertex must come from the mapped boundary');
    }
  }
});

test('campus grounds remain beneath accommodation pins and clean up on unmount', () => {
  const polygons = [], panes = {};
  let removed = false;
  const group = { addTo() { return this; }, remove() { removed = true; } };
  const L = { layerGroup: () => group, polygon: (coords, options) => {
    polygons.push({ coords, options }); return { addTo(target) { assert.equal(target, group); } };
  } };
  const code = stripTypeScriptTypes(readFileSync(require.resolve('../web/src/components/universityCampusLayer.ts'), 'utf8'))
    .replace(/^import .*;\s*$/mg, '').replace('export function', 'function');
  const add = runInNewContext(`${code}\n;addUniversityCampusLayer`, { L, data });
  const layer = add({ createPane(name) { return panes[name] = { style: {} }; } });
  assert.equal(polygons.length, 7);
  assert.ok(polygons.every(p => !p.options.interactive && p.options.fillOpacity < .2));
  assert.equal(panes.universityCampusGrounds.style.zIndex, '390');
  layer.remove();
  assert.equal(removed, true);
});
