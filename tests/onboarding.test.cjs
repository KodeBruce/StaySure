const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');

test('Find My Accommodation completes all four steps', () => {
  const screens = {};
  const state = { profile: {}, filters: {}, onboarded: false };
  let current;
  let destination;
  let saved = false;

  const S = {
    state,
    register: (name, screen) => { screens[name] = screen; },
    esc: (value) => String(value ?? ''),
    icon: () => '',
    note: () => '',
    save: () => { saved = true; },
    go: (route) => { destination = route; },
    toast: () => {},
    renderRoute: render
  };
  const context = { window: { SS: S }, setTimeout: () => {} };
  runInNewContext(readFileSync(join(__dirname, '../js/data.js'), 'utf8'), context);
  runInNewContext(readFileSync(join(__dirname, '../js/screens-a.js'), 'utf8'), context);

  function element(tag) {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
    for (const match of tag.matchAll(/\b(data-[\w-]+)(?=\s|>)/g)) attrs[match[1]] = '';
    return {
      attrs,
      handlers: {},
      classList: { contains: (name) => (attrs.class || '').split(' ').includes(name) },
      getAttribute: (name) => attrs[name],
      addEventListener(type, handler) { this.handlers[type] = handler; },
      click() { this.handlers.click?.(); }
    };
  }

  function render() {
    current = screens.onboarding();
    const buttons = [...current.html.matchAll(/<button\b[^>]*>/g)].map((match) => element(match[0]));
    const root = {
      querySelectorAll: (selector) => buttons.filter((button) => selector.slice(1, -1) in button.attrs),
      querySelector: (selector) => buttons.find((button) => selector.slice(1, -1) in button.attrs)
    };
    current.mount(root);
    return root;
  }

  let root = render();
  assert.match(current.html, /Step 1 of 4/);
  root.querySelector('[data-ob-next]').click();
  root = render();
  assert.match(current.html, /Step 2 of 4/);
  root.querySelector('[data-band]').click();
  root = render();
  root.querySelector('[data-ob-next]').click();
  root = render();
  assert.match(current.html, /Step 3 of 4/);
  assert.equal(root.querySelector('[data-opt]').getAttribute('data-opt'), 'nsfas');
  const selfFunded = root.querySelectorAll('[data-opt]').find((button) => button.getAttribute('data-opt') === 'self');
  selfFunded.click();
  root = render();
  assert.ok(!current.html.includes('data-ob-next disabled'));
  root.querySelector('[data-ob-next]').click();
  root = render();
  assert.match(current.html, /Step 4 of 4/);
  root.querySelectorAll('[data-opt]').find((button) => button.getAttribute('data-opt') === 'transport').click();
  root = render();
  root.querySelector('[data-ob-back]').click();
  root = render();
  assert.match(current.html, /Step 3 of 4/);
  assert.match(current.html, /data-opt="self"[^>]*aria-pressed="true"/);
  root.querySelector('[data-ob-next]').click();
  root = render();
  root.querySelector('[data-ob-next]').click();
  assert.equal(destination, '/results');
  assert.equal(state.profile.funding, 'self');
  assert.ok(state.profile.priorities.includes('transport'));
  assert.equal(state.onboarded, true);
  assert.equal(saved, true);
  assert.equal(typeof screens.results, 'function');
});
