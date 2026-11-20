const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const { runInNewContext } = require('node:vm');

test('changing basemaps swaps only tiles without moving the camera or removing overlays', () => {
  const overlay = { type: 'campuses and price pins' };
  const active = new Set([overlay]);
  const tiles = [];
  const L = { tileLayer(url, options) {
    const layer = { url, options, addTo() { active.add(this); return this; }, remove() { active.delete(this); } };
    tiles.push(layer);
    return layer;
  } };
  const path = join(__dirname, '../web/src/components/mapBasemap.ts');
  const source = stripTypeScriptTypes(readFileSync(path, 'utf8'))
    .replace(/^import .*;\s*$/mg, '').replace(/export /g, '');
  const addBasemap = runInNewContext(`${source}\n;addMapBasemap`, { L });
  // No camera methods are supplied: tile switching must never call them.
  const basemap = addBasemap({});
  assert.equal(active.size, 2);
  assert.ok(active.has(tiles[0]));
  basemap.setView('aerial');
  assert.ok(active.has(tiles[1]));
  assert.ok(!active.has(tiles[0]));
  assert.match(tiles[1].url, /World_Imagery.*\{z\}\/\{y\}\/\{x\}/);
  assert.match(tiles[1].options.attribution, /Esri/);
  basemap.setView('aerial');
  assert.equal(active.size, 2, 'Repeated selection cannot duplicate layers');
  basemap.setView('street');
  assert.ok(active.has(tiles[0]));
  assert.ok(!active.has(tiles[1]));
  assert.ok(active.has(overlay));
  basemap.remove();
  assert.deepEqual([...active], [overlay]);
});
