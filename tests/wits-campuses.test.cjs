const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const { runInNewContext } = require('node:vm');
const data = require('../web/src/data/witsCampuses.json');
const source = require('../Res Data/wits-campus-source.json');

test('five campus footprints retain their sourced perimeter coordinates', () => {
  assert.deepEqual(data.campuses.map(campus => campus.id), ['east', 'west', 'education', 'health', 'management']);
  const points = new Set(source.elements.filter(item => item.type === 'node').map(node => `${node.lat},${node.lon}`));
  const ways = new Set(source.elements.filter(item => item.type === 'way').map(way => way.id));
  for (const campus of data.campuses) {
    assert.ok(ways.has(campus.sourceWay));
    assert.ok(campus.outline.length >= 5);
    assert.deepEqual(campus.outline[0], campus.outline.at(-1));
    assert.ok(campus.outline.every(point => points.has(point.join(','))), 'No invented perimeter vertices');
    assert.ok(campus.outline.every(([lat, lon]) => lat > -26.2 && lat < -26.16 && lon > 28.01 && lon < 28.06));
    assert.ok(campus.streets.length >= 2);
    assert.match(campus.officialMapUrl, /^https:\/\/www\.(?:wits|wbs)\.ac\.za\//);
  }
  assert.equal(data.source.license, 'ODbL-1.0');
  assert.deepEqual([...new Set(data.campuses.map(campus => campus.color))], ['#0ea5e9']);
});

test('campus outlines and labels remain separate from accommodation markers', () => {
  const polygons = [], markers = [], active = new Set(), events = new Map(), panes = {};
  let removed = false;
  const group = { addTo() { return this; }, addLayer(layer) { active.add(layer); return this; }, removeLayer(layer) { active.delete(layer); }, remove() { removed = true; } };
  const layer = (target, coords, options) => { const item = { coords, options, closePopup() {}, bindPopup(content) { this.popup = content; return this; } }; target.push(item); return item; };
  const map = {
    zoom: 13, createPane(name) { return panes[name] = { style: {} }; }, getZoom() { return this.zoom; },
    on(event, callback) { events.set(event, callback); }, off(event) { events.delete(event); }
  };
  const L = {
    layerGroup: () => group, polygon: (coords, options) => layer(polygons, coords, options),
    marker: (coords, options) => layer(markers, coords, options), divIcon: options => options
  };
  const document = { createElement: () => ({ children: [], style: { setProperty() {} }, append(...items) { this.children.push(...items); } }) };
  const file = join(__dirname, '../web/src/components/witsCampusLayer.ts');
  const code = stripTypeScriptTypes(readFileSync(file, 'utf8'))
    .replace(/^import .*;\s*$/mg, '')
    .replace('export function addWitsCampusLayer', 'function addWitsCampusLayer');
  const addLayer = runInNewContext(`${code}\n;addWitsCampusLayer`, { L, document, WITS_CAMPUSES: data.campuses, WITS_MAP_SOURCE: data.source });
  const controller = addLayer(map);
  assert.equal(polygons.length, 5);
  assert.equal(markers.length, 5);
  assert.equal(active.size, 5, 'Unselected universities show outlines only');
  assert.ok(polygons.every(polygon => polygon.options.interactive === false));
  controller.setLabelsVisible(true);
  assert.equal(active.size, 10, 'A Wits location search enables campus markers');
  assert.ok(Number(panes.witsCampusGrounds.style.zIndex) < 600);
  assert.ok(Number(panes.witsCampusNames.style.zIndex) < 600, 'Accommodation price pins remain on top');
  assert.ok(polygons.every(polygon => polygon.options.fillOpacity < .2), 'Street map remains readable');
  map.zoom = 10;
  events.get('zoomend')();
  assert.equal(active.size, 5);
  assert.ok(polygons.every(polygon => active.has(polygon)), 'Zooming out keeps campus grounds');
  map.zoom = 14;
  events.get('zoomend')();
  assert.equal(active.size, 10);
  controller.setLabelsVisible(false);
  assert.equal(active.size, 5);
  events.get('zoomend')();
  assert.equal(active.size, 5, 'Zooming must not restore campus markers outside a Wits search');
  controller.remove();
  assert.equal(removed, true);
  assert.equal(events.size, 0);
});
