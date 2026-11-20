const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const { runInNewContext } = require('node:vm');
const source = stripTypeScriptTypes(readFileSync(join(__dirname, '../web/src/components/mapZoom.ts'), 'utf8'))
  .replace(/export /g, '');
const { MAP_ZOOM_OPTIONS, bindMapZoomGestures } = runInNewContext(`${source}\n;({ MAP_ZOOM_OPTIONS, bindMapZoomGestures })`);

test('desktop wheel, pinch and keyboard zoom are enabled on the map', () => {
  assert.equal(MAP_ZOOM_OPTIONS.scrollWheelZoom, true);
  assert.equal(MAP_ZOOM_OPTIONS.touchZoom, true);
  assert.equal(MAP_ZOOM_OPTIONS.keyboard, true);
});

test('map-focused browser zoom gestures operate on the map and leave other shortcuts alone', () => {
  const listeners = new Map();
  let zoomIn = 0, zoomOut = 0, prevented = 0, stopped = 0;
  const container = {
    addEventListener(type, handler, options) { listeners.set(type, { handler, options }); },
    removeEventListener(type) { listeners.delete(type); }
  };
  const cleanup = bindMapZoomGestures({ getContainer: () => container, zoomIn() { zoomIn++; }, zoomOut() { zoomOut++; } });
  const event = (key, extra = {}) => ({ key, ctrlKey: true, target: { closest: () => null }, preventDefault() { prevented++; }, stopPropagation() { stopped++; }, ...extra });
  assert.equal(listeners.get('wheel').options.passive, false);
  listeners.get('wheel').handler(event('', { deltaY: -120 }));
  assert.equal(prevented, 1, 'A trackpad pinch must not zoom the whole app');
  listeners.get('keydown').handler(event('+'));
  listeners.get('keydown').handler(event('-', { ctrlKey: false, metaKey: true }));
  assert.equal(zoomIn, 1);
  assert.equal(zoomOut, 1);
  assert.equal(stopped, 2);
  const before = prevented;
  listeners.get('keydown').handler(event('s'));
  listeners.get('keydown').handler(event('+', { target: { closest: () => ({ tagName: 'INPUT' }) } }));
  listeners.get('wheel').handler(event('', { ctrlKey: false }));
  assert.equal(prevented, before, 'Text fields, unrelated shortcuts and normal wheel remain with their handlers');
  cleanup();
  assert.equal(listeners.size, 0);
});
