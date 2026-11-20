const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const { runInNewContext } = require('node:vm');

function load() {
  const read = path => stripTypeScriptTypes(readFileSync(join(__dirname, path), 'utf8'))
    .replace(/^import .*;\s*$/mg, '').replace(/export /g, '');
  const distanceKm = runInNewContext(`${read('../web/src/data/mapLocations.ts')}\n;distanceKm`);
  return runInNewContext(`${read('../web/src/data/nearbyLocation.ts')}\n;({ createNearbyLocationStore, compareResidenceDistance, residenceDistance, residenceDistanceLabel })`, { distanceKm });
}
const { createNearbyLocationStore, compareResidenceDistance, residenceDistance, residenceDistanceLabel } = load();

function harness(enabled = true) {
  const requests = [], savedModes = [], updates = [];
  const store = createNearbyLocationStore(() => ({ getCurrentPosition(success, failure, options) { requests.push({ success, failure, options }); } }), enabled, value => savedModes.push(value));
  store.subscribe(() => updates.push(store.getSnapshot()));
  const locate = (index = 0) => requests[index].success({ coords: { latitude: -26.19, longitude: 28.03 } });
  return { store, requests, savedModes, updates, locate };
}

test('default requests location once, shares its result and reuses it when returning to nearby', () => {
  const { store, requests, locate, updates } = harness();
  store.ensureRequested();
  store.ensureRequested(); // Home/map mounts or Strict Mode must not duplicate a prompt.
  assert.equal(requests.length, 1);
  assert.equal(store.getSnapshot().status, 'locating');
  assert.equal(requests[0].options.timeout, 12000);
  locate();
  assert.equal(store.getSnapshot().enabled, true);
  assert.equal(store.getSnapshot().status, 'ready');
  assert.equal(store.getSnapshot().position[0], -26.19);
  store.browseAnywhere();
  assert.equal(store.getSnapshot().enabled, false);
  store.ensureRequested();
  assert.equal(requests.length, 1);
  store.requestNearby();
  assert.equal(store.getSnapshot().enabled, true);
  assert.equal(requests.length, 1, 'A recent location is shared across screens');
  assert.ok(updates.length >= 4);
});

test('manual location filters cancel pending auto detection and remain in control', () => {
  const { store, requests, locate, savedModes } = harness();
  store.ensureRequested();
  store.browseAnywhere();
  locate();
  requests[0].failure({ code: 1 });
  assert.equal(store.getSnapshot().enabled, false);
  assert.equal(store.getSnapshot().position, null);
  assert.equal(store.getSnapshot().status, 'idle');
  store.ensureRequested();
  assert.equal(requests.length, 1, 'Browsing elsewhere does not auto-prompt again');
  assert.deepEqual(savedModes, [true, false]);
  store.requestNearby();
  locate(1);
  assert.equal(store.getSnapshot().status, 'ready', 'Explicit near-me action can resume detection');
});

test('denied permission and timeout fall back without repeated automatic prompts', () => {
  for (const [code, status] of [[1, 'denied'], [2, 'unavailable'], [3, 'unavailable']]) {
    const { store, requests } = harness();
    store.ensureRequested();
    requests[0].failure({ code });
    assert.equal(store.getSnapshot().status, status);
    assert.equal(store.getSnapshot().position, null);
    store.ensureRequested();
    assert.equal(requests.length, 1);
  }
});

test('saved explore preference, missing geolocation, exceptions and invalid coordinates are handled', () => {
  const manual = harness(false);
  manual.store.ensureRequested();
  assert.equal(manual.requests.length, 0);
  for (const getLocation of [() => undefined, () => { throw new Error('unsupported'); }]) {
    const store = createNearbyLocationStore(getLocation);
    store.ensureRequested();
    assert.equal(store.getSnapshot().status, 'unavailable');
  }
  const { store, requests } = harness();
  store.ensureRequested();
  requests[0].success({ coords: { latitude: NaN, longitude: 28.03 } });
  assert.equal(store.getSnapshot().status, 'unavailable');
});

test('closest residences sort before distant and unknown points without a coverage cutoff', () => {
  const origin = [-26.19, 28.03];
  const close = { id: 'close', latitude: -26.191, longitude: 28.031 };
  const far = { id: 'far', latitude: -25.75, longitude: 28.23 };
  const missing = { id: 'missing', latitude: null, longitude: null };
  const invalid = { id: 'invalid', latitude: NaN, longitude: 0 };
  assert.deepEqual([missing, far, close].sort((a, b) => compareResidenceDistance(a, b, origin)).map(item => item.id), ['close', 'far', 'missing']);
  assert.equal(compareResidenceDistance(missing, invalid, origin), 0);
  assert.equal(residenceDistance(missing, origin), Infinity);
  assert.match(residenceDistanceLabel(close, origin), /m away/);
  assert.match(residenceDistanceLabel(far, origin), /km away/);
  assert.equal(residenceDistanceLabel(missing, origin), 'Distance unavailable');
  assert.equal(residenceDistanceLabel(close, null), '');
  assert.ok(compareResidenceDistance(close, far, [51.5, -.1]) !== 0, 'Students outside coverage still see the nearest known residences');
});
