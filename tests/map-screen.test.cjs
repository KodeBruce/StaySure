const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');

test('search and results use the current full-screen map and carousel', () => {
  const screens = {};
  const context = { window: {} };
  runInNewContext(readFileSync(join(__dirname, '../js/data.js'), 'utf8'), context);
  runInNewContext(readFileSync(join(__dirname, '../js/map-search.js'), 'utf8'), context);
  const data = context.window.SSData;
  context.window.SS = {
    state: { profile: { budget: 3500, funding: 'nsfas', priorities: [] }, filters: data.defaultFilters() },
    esc: (value) => String(value ?? ''),
    icon: () => '',
    register: (name, screen) => { screens[name] = screen; }
  };
  runInNewContext(readFileSync(join(__dirname, '../js/map-screen.js'), 'utf8'), context);
  assert.equal(screens.search, screens.results);
  const screen = screens.search();
  assert.match(screen.html, /map-fullscreen-canvas/);
  assert.match(screen.html, /map-carousel/);
  assert.match(screen.html, /data-map-open-search/);
  assert.match(screen.html, /data-map-province/);
  assert.match(screen.html, /data-map-university/);
  assert.match(screen.html, /Braam Student Village/);
  assert.doesNotMatch(screen.html, /search-panel/);
});
