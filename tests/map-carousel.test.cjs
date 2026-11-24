const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { runInNewContext } = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const loopCode = stripTypeScriptTypes(readFileSync(join(__dirname, '../web/src/data/carouselLoop.ts'), 'utf8')).replace('export function', 'function');
const wrapCarouselPosition = runInNewContext(`${loopCode}\n;wrapCarouselPosition`);

// Exercise the actual screen's event handlers with deterministic React hooks and
// animation frames. Map tiles and geolocation are not needed for rail behaviour.
async function screenHarness(reducedMotion = false, university = 'all', recordCount = 3) {
  const { transformSync } = await import(pathToFileURL(join(__dirname, '../web/node_modules/rolldown/dist/utils-index.mjs')));
  const jsxRuntime = require('../web/node_modules/react/jsx-runtime');
  const records = require('../web/src/data/researchProperties.json').filter(item => Number.isFinite(item.latitude)).slice(0, recordCount);
  const state = [], refs = [], frames = new Map(), timers = new Map(), scrolls = [], layoutEffects = [];
  let stateIndex = 0, refIndex = 0, nextId = 0;
  const criteria = { universityId: university, area: '', region: '', maxRent: null, roomTypes: [], preferences: [] };
  const hooks = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useRef(initial) { const index = refIndex++; return refs[index] ??= { current: initial }; },
    useMemo: fn => fn(), useEffect() {}, useLayoutEffect(fn) { layoutEffects.push(fn); }
  };
  const selection = { ids: [], toggle(id) {
    this.ids = this.ids.includes(id) ? this.ids.filter(value => value !== id) : [...this.ids, id];
  } };
  const railNode = { clientWidth: 600, scrollLeft: 0,
    scrollTo: options => { scrolls.push(options); railNode.scrollLeft = options.left; }, querySelectorAll: () => [], querySelector: () => null };
  const data = {
    wrapCarouselPosition,
    readSearchCriteria: () => criteria, saveSearchCriteria() {},
    useResearchSelection: () => selection,
    matchesSelectedRoomTypes: () => true, parseRoomTypes: () => [], ROOM_TYPE_OPTIONS: [],
    researchImages: () => ['/images/p1.jpg'], researchFallbackImage: '/images/research-fallback.svg',
    researchPriceSummary: () => ({ label: 'R5,600' }), extractMinPrice: () => 5600,
    parseOfferings: () => ({ localityShort: 'Braamfontein', campusDistance: 'Campus area', roomTypes: [], keyOfferings: [] }),
    getPropertyReviews: () => ({ ratingFormatted: '4.5' }),
    matchResearchProperty: () => ({ score: null, matched: 0, total: 0 }),
    UNIVERSITIES: [], AREA_CENTRES: {}, getPropertyUniversities: () => [], isNearUniversity: () => true,
    distanceKm: () => 0, withinBounds: () => true,
    WITS_CAMPUSES: require('../web/src/data/witsCampuses.json').campuses
  };
  data.useNearbyLocation = () => ({ enabled: false, position: null, status: 'idle', nearby: false, locating: false, requestNearby() {}, browseAnywhere() {} });
  data.nearbyLocationMessage = () => '';
  const deps = module => {
    if (module === 'react') return hooks;
    if (module === 'react/jsx-runtime') return jsxRuntime;
    if (module === 'react-dom') return { createPortal: children => children };
    if (module === 'react-router-dom') return { useSearchParams: () => [new URLSearchParams(), () => {}] };
    if (module.endsWith('researchProperties.json')) return records;
    if (module === 'lucide-react') return new Proxy({}, { get: (_, name) => name });
    return data;
  };
  const file = join(__dirname, '../web/src/pages/ResearchMapSearch.tsx');
  const source = transformSync(file, readFileSync(file, 'utf8')).code
    .replace(/import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/g,
      (_, names, module) => `const {${names.replace(/\bas\b/g, ':')}} = load(${JSON.stringify(module)});`)
    .replace(/import\s+(\w+)\s+from\s+["']([^"']+)["'];?/g,
      (_, name, module) => `const ${name} = load(${JSON.stringify(module)});`)
    .replace(/import\s+["'][^"']+["'];?/g, '')
    .replace(/export function /g, 'function ');
  const screen = runInNewContext(`${source}\n;ResearchMapSearch`, {
    load: deps, URLSearchParams, navigator: {}, ResizeObserver: class { observe() {} disconnect() {} },
    document: { getElementById: () => ({ closest: () => ({ offsetLeft: 900, offsetWidth: 300 }) }) },
    window: {
      matchMedia: () => ({ matches: reducedMotion }),
      requestAnimationFrame(fn) { const id = ++nextId; frames.set(id, fn); return id; },
      cancelAnimationFrame(id) { frames.delete(id); },
      setTimeout(fn) { const id = ++nextId; timers.set(id, fn); return id; },
      clearTimeout(id) { timers.delete(id); }
    }
  });
  function render() {
    layoutEffects.length = 0;
    stateIndex = refIndex = 0;
    const tree = screen();
    const elements = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || !node.props) return;
      elements.push(node); visit(node.props.children);
    }
    visit(tree);
    const rail = elements.find(element => element.props.id === 'research-map-carousel');
    rail.props.ref.current = railNode;
    return {
      rail,
      toggle: elements.find(element => element.props['aria-controls'] === 'research-map-carousel'),
      campusToggle: elements.find(element => element.props['aria-label'] === 'Explore Wits campuses'),
      campusMenu: elements.find(element => element.props.id === 'wits-campus-menu'),
      educationCampus: elements.find(element => element.props['aria-label'] === 'Show Education Campus'),
      basemapToggle: elements.find(element => element.props.className?.includes('map-basemap-toggle')),
      universitySelect: elements.find(element => element.props.ariaLabel === 'Nearby University'),
      allCampuses: elements.find(element => element.props['aria-label'] === 'Show all Wits campuses'),
      pins: elements.find(element => element.type?.name === 'ResearchPins')
    };
  }
  return { render, records, scrolls, frames, selection, railNode,
    flushLayout() { layoutEffects.splice(0).forEach(fn => fn()); },
    flushTimers() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); },
    flushFrames() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()); } };
}

test('loop starts surrounded by cards and wraps either way with the same highlighted residence', async () => {
  const app = await screenHarness();
  const view = app.render();
  const cards = view.rail.props.children.map((card, index) => ({
    offsetLeft: 150 + index * 310, offsetWidth: 300,
    dataset: { propertyId: card.props['data-property-id'], copy: card.props['data-loop-copy'] },
    primary: card.props['data-loop-primary'], anchor: card.props['data-loop-anchor']
  }));
  app.railNode.querySelectorAll = selector => selector.includes('data-loop-primary') ? cards.filter(c => c.primary) : cards;
  app.railNode.querySelector = selector => selector.includes('data-loop-anchor') ? cards.find(c => c.anchor)
    : cards.find(c => c.dataset.copy === Number(selector.match(/"(\d+)"/)[1]));
  app.flushLayout();
  assert.equal(app.railNode.scrollLeft, 1860, 'Initial position has two full copies to its left');
  for (const left of [2300, 2400, 1300, 1860, 2800, 900]) {
    app.railNode.scrollLeft = left;
    app.render().rail.props.onScroll();
    app.flushTimers();
    const expected = cards.reduce((best, card) => Math.abs(card.offsetLeft - left - 150) < Math.abs(best.offsetLeft - left - 150) ? card : best);
    assert.equal(app.render().pins.props.selectedId, expected.dataset.propertyId);
    assert.ok(app.railNode.scrollLeft >= 1395 && app.railNode.scrollLeft < 2325);
  }
});

test('three selected cards swipe to either end and back while updating the highlighted map price', async () => {
  const app = await screenHarness();
  const ids = app.records.map(item => item.id);
  ids.forEach(id => app.selection.toggle(id));
  app.railNode.querySelectorAll = () => ids.map((id, index) => ({
    offsetLeft: 150 + index * 310, offsetWidth: 300, dataset: { propertyId: id }
  }));
  for (const index of [1, 2, 1, 0, 1, 2, 0]) {
    app.railNode.scrollLeft = index * 310;
    app.render().rail.props.onPointerDown();
    app.render().rail.props.onScroll();
    app.flushTimers();
    const view = app.render();
    assert.equal(view.pins.props.selectedId, ids[index]);
    assert.equal(view.pins.props.items.length, 3);
    assert.equal(view.rail.props.children.filter(card => card.props['data-loop-primary']).length, 3);
  }
});

test('manual carousel interaction cancels the automatic reveal lock and campus focus', async () => {
  const app = await screenHarness(false, 'wits');
  app.render().allCampuses.props.onClick();
  app.render().rail.props.onWheel();
  assert.equal(app.render().pins.props.campusFocus, null);
  app.render().pins.props.onSelect(app.records[0].id);
  assert.equal(app.frames.size, 1);
  app.render().rail.props.onPointerDown();
  assert.equal(app.frames.size, 0);
  app.railNode.querySelectorAll = () => [{ offsetLeft: 150, offsetWidth: 300, dataset: { propertyId: app.records[2].id } }];
  app.render().rail.props.onScroll();
  app.flushTimers();
  assert.equal(app.render().pins.props.selectedId, app.records[2].id, 'A swipe immediately replaces the locked price selection');
});

test('three comparison choices hide other cards and removing one restores all choices', async () => {
  const app = await screenHarness(false, 'all', 4);
  const all = app.records.map(item => item.id);
  const cards = () => Array.from(app.render().rail.props.children.filter(card => card.props['data-loop-primary']), card => card.props['data-property-id']);
  app.render().pins.props.onSelect(all[3]);
  app.selection.toggle(all[0]);
  assert.deepEqual(cards(), all);
  app.selection.toggle(all[1]);
  assert.deepEqual(cards(), all, 'Two choices keep every card available');
  app.selection.toggle(all[2]);
  assert.deepEqual(cards(), all.slice(0, 3));
  assert.deepEqual(Array.from(app.render().pins.props.items, item => item.id), all.slice(0, 3), 'A stale active card cannot add a fourth map pin');
  app.selection.toggle(all[1]);
  assert.deepEqual(cards(), all, 'Unticking one immediately restores the other cards');
});

test('map shows only ticked residences and restores all prices when the last tick is removed', async () => {
  const app = await screenHarness();
  const ids = () => Array.from(app.render().pins.props.items, item => item.id);
  const all = app.records.map(item => item.id);
  assert.deepEqual(ids(), all);
  app.selection.toggle(all[0]);
  assert.deepEqual(ids(), [all[0]]);
  app.selection.toggle(all[2]);
  assert.deepEqual(ids(), [all[0], all[2]]);
  assert.equal(app.render().rail.props.children.filter(card => card.props['data-loop-primary']).length, 3, 'Other cards remain available to select');
  app.render().pins.props.onSelect(all[0]);
  assert.equal(app.render().pins.props.selectedId, all[0], 'The active card keeps its price highlighted');
  assert.equal(app.render().pins.props.focusSelected, false, 'Highlighting keeps the other ticked residences in view');
  app.selection.toggle(all[0]);
  assert.deepEqual(ids(), [all[0], all[2]], 'The active card remains visible alongside ticked residences');
  app.render().pins.props.onSelect(all[1]);
  assert.deepEqual(ids(), [all[1], all[2]], 'Changing the active card replaces only its preview pin');
  app.selection.toggle(all[2]);
  assert.deepEqual(ids(), all);
  app.selection.toggle('residence-outside-current-search');
  assert.deepEqual(ids(), [all[1]], 'Only the active preview is shown when comparison choices are outside the search');
});

test('map control hides cards and tapping a price reveals and centres its matching card', async () => {
  const app = await screenHarness();
  let view = app.render();
  assert.equal(view.rail.props.inert, false);
  assert.equal(view.toggle.props['aria-expanded'], true);
  view.toggle.props.onClick();
  view = app.render();
  assert.equal(view.rail.props.inert, true);
  assert.equal(view.rail.props['aria-hidden'], true);
  assert.equal(view.rail.props.tabIndex, -1);
  assert.match(view.toggle.props['aria-label'], /Show/);
  view.pins.props.onSelect(app.records[2].id);
  assert.equal(app.scrolls.length, 0, 'Scroll waits for the revealed screen to commit');
  view = app.render();
  assert.equal(view.rail.props.inert, false);
  assert.equal(view.rail.props.tabIndex, 0);
  assert.equal(view.pins.props.selectedId, app.records[2].id);
  app.flushFrames();
  assert.equal(app.scrolls[0].left, 750);
  assert.equal(app.scrolls[0].behavior, 'smooth');
  view.rail.props.onScroll();
  assert.equal(app.render().pins.props.selectedId, app.records[2].id);
});

test('rail can be shown manually and repeated price taps respect reduced motion', async () => {
  const app = await screenHarness(true);
  app.render().toggle.props.onClick();
  app.render().toggle.props.onClick();
  assert.equal(app.render().rail.props['aria-hidden'], false);
  const view = app.render();
  view.pins.props.onSelect(app.records[1].id);
  view.pins.props.onSelect(app.records[2].id);
  assert.equal(app.frames.size, 1, 'Only the most recent map selection should scroll');
  app.render();
  app.flushFrames();
  assert.equal(app.scrolls.length, 1);
  assert.equal(app.scrolls[0].behavior, 'auto');
  assert.equal(app.render().pins.props.selectedId, app.records[2].id);
});

test('hiding before the reveal frame cancels pending carousel movement', async () => {
  const app = await screenHarness();
  app.render().pins.props.onSelect(app.records[2].id);
  app.render().toggle.props.onClick();
  app.flushFrames();
  assert.equal(app.scrolls.length, 0);
  assert.equal(app.render().rail.props.inert, true);
});

test('campus navigation focuses all five campuses or an individual campus independently of prices', async () => {
  const app = await screenHarness(false, 'wits');
  app.render().pins.props.onSelect(app.records[0].id);
  assert.equal(app.frames.size, 1);
  app.render().allCampuses.props.onClick();
  assert.equal(app.frames.size, 0, 'Campus navigation cancels a pending accommodation reveal');
  let view = app.render();
  assert.equal(view.pins.props.campusFocus.id, 'all');
  assert.equal(view.pins.props.selectedId, null);
  assert.equal(view.campusToggle.props['aria-expanded'], false);
  assert.equal(view.campusMenu.props.inert, true);
  view.campusToggle.props.onClick();
  view = app.render();
  assert.equal(view.campusToggle.props['aria-expanded'], true);
  assert.equal(view.campusMenu.props.inert, false);
  view.educationCampus.props.onClick();
  view = app.render();
  assert.equal(view.pins.props.campusFocus.id, 'education');
  assert.equal(view.campusToggle.props['aria-expanded'], false, 'Selection collapses campus choices');
  const request = view.pins.props.campusFocus.request;
  view.allCampuses.props.onClick();
  assert.ok(app.render().pins.props.campusFocus.request > request);
  app.render().pins.props.onSelect(app.records[1].id);
  view = app.render();
  assert.equal(view.pins.props.campusFocus, null);
  assert.equal(view.pins.props.selectedId, app.records[1].id);
});

test('campus controls and campus markers appear only for a Wits location search', async () => {
  const app = await screenHarness();
  assert.equal(app.render().campusToggle, undefined);
  assert.equal(app.render().allCampuses, undefined);
  assert.equal(app.render().pins.props.showWitsCampuses, false);
  app.render().universitySelect.props.onChange('wits');
  assert.ok(app.render().campusToggle);
  assert.equal(app.render().pins.props.showWitsCampuses, true);
  app.render().universitySelect.props.onChange('uj');
  assert.equal(app.render().campusToggle, undefined);
  assert.equal(app.render().pins.props.showWitsCampuses, false);
});

test('aerial control switches both ways while preserving the selected price and hidden carousel', async () => {
  const app = await screenHarness();
  app.render().pins.props.onSelect(app.records[1].id);
  app.render().toggle.props.onClick();
  let view = app.render();
  assert.equal(view.pins.props.mapView, 'street');
  view.basemapToggle.props.onClick();
  view = app.render();
  assert.equal(view.pins.props.mapView, 'aerial');
  assert.equal(view.basemapToggle.props['aria-pressed'], true);
  assert.match(view.basemapToggle.props['aria-label'], /grey street/);
  assert.equal(view.pins.props.selectedId, app.records[1].id);
  assert.equal(view.rail.props.inert, true);
  view.basemapToggle.props.onClick();
  assert.equal(app.render().pins.props.mapView, 'street');
});
