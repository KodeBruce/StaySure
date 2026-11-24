const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const { runInNewContext } = require('node:vm');
const code = stripTypeScriptTypes(readFileSync(require.resolve('../web/src/data/carouselLoop.ts'), 'utf8')).replace('export function', 'function');
const wrap = runInNewContext(`${code}\n;wrapCarouselPosition`);

test('loop wraps in both directions without changing the visible position within a cycle', () => {
  for (const cycle of [620, 930, 31400]) {
    const anchor = cycle * 2;
    for (let lap = -10; lap <= 10; lap++) {
      for (const offset of [-cycle * .49, 0, cycle * .49]) {
        assert.ok(Math.abs(wrap(anchor + offset + lap * cycle, anchor, cycle) - (anchor + offset)) < .00001);
      }
    }
    assert.equal(wrap(anchor - cycle / 2 - 10, anchor, cycle), anchor + cycle / 2 - 10);
    assert.equal(wrap(anchor + cycle / 2 + 10, anchor, cycle), anchor - cycle / 2 + 10);
  }
});

test('empty and single-card rails do not attempt to wrap', () => {
  for (const cycle of [0, -1, NaN, Infinity]) assert.equal(wrap(100, 0, cycle), 100);
});
