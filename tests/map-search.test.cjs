const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');

test('map search locates the student and filters approximate nearby listings', () => {
  const context = { window: {}, navigator: { geolocation: {
    getCurrentPosition(success) {
      success({ coords: { latitude: -26.192, longitude: 28.032, accuracy: 35 } });
    }
  } } };
  runInNewContext(readFileSync(join(__dirname, '../js/data.js'), 'utf8'), context);
  runInNewContext(readFileSync(join(__dirname, '../js/map-search.js'), 'utf8'), context);
  const map = context.window.SSMap;
  const properties = context.window.SSData.PROPERTIES;
  assert.ok(properties.every((property) => map.position(property)));
  assert.equal(properties.filter(map.matches).length, properties.length);

  let located = false;
  map.locate((success) => { located = success; });
  assert.equal(located, true);
  assert.equal(map.state.accuracy, 35);
  assert.equal(map.state.nearby, true);
  assert.equal(map.state.province, '');
  map.state.radius = 1;
  const nearby = properties.filter(map.matches);
  assert.ok(nearby.length > 0);
  assert.ok(nearby.length < properties.length);
  assert.ok(nearby.every((property) => map.distance(map.position(property), map.state.position) <= 1));

  map.state.bounds = { south: -26.193, north: -26.190, west: 28.030, east: 28.035 };
  assert.ok(properties.filter(map.matches).every((property) => {
    const point = map.position(property);
    return point[0] >= map.state.bounds.south && point[0] <= map.state.bounds.north &&
      point[1] >= map.state.bounds.west && point[1] <= map.state.bounds.east;
  }));

  map.state.nearby = false;
  map.state.bounds = null;
  map.state.province = 'Western Cape';
  assert.equal(properties.filter(map.matches).length, 0);
});

test('location denial leaves manual search available', () => {
  const context = { window: {}, navigator: { geolocation: {
    getCurrentPosition(_success, error) { error({ code: 1 }); }
  } } };
  runInNewContext(readFileSync(join(__dirname, '../js/map-search.js'), 'utf8'), context);
  let located = true;
  context.window.SSMap.locate((success) => { located = success; });
  assert.equal(located, false);
  assert.equal(context.window.SSMap.state.nearby, false);
  assert.match(context.window.SSMap.state.message, /province, university or area/);
});
