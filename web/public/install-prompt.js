(function () {
  'use strict';

  const DISMISSED_KEY = 'staysure-install-dismissed';
  const INSTALLED_KEY = 'staysure-install-complete';
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  let installEvent = null;
  let dialog = null;
  let previousFocus = null;

  function read(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }

  function write(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) { /* Storage may be disabled. */ }
  }

  function isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true || read(INSTALLED_KEY) === 'true';
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function close(remember) {
    if (!dialog) return;
    if (remember) write(DISMISSED_KEY, String(Date.now()));
    dialog.remove();
    dialog = null;
    document.body.classList.remove('install-dialog-open');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  function updateAction() {
    if (!dialog) return;
    const action = dialog.querySelector('[data-install-action]');
    action.textContent = installEvent ? 'Install app' : 'How to install';
    if (installEvent) {
      delete action.dataset.installDone;
      dialog.querySelector('[data-install-instructions]').hidden = true;
    }
  }

  function showInstructions() {
    const instructions = dialog.querySelector('[data-install-instructions]');
    instructions.textContent = isIos()
      ? 'In Safari, tap Share, then Add to Home Screen.'
      : 'Open your browser menu and choose Install StaySure or Add to Home Screen.';
    instructions.hidden = false;
    dialog.querySelector('[data-install-action]').textContent = 'Got it';
    dialog.querySelector('[data-install-action]').dataset.installDone = 'true';
  }

  function show() {
    if (dialog || isInstalled() || !window.isSecureContext) return;
    const dismissed = Number(read(DISMISSED_KEY));
    if (dismissed && Date.now() - dismissed < WEEK) return;

    previousFocus = document.activeElement;
    dialog = document.createElement('div');
    dialog.className = 'install-dialog-backdrop';
    dialog.innerHTML = '<section class="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title" aria-describedby="install-dialog-description">' +
      '<button class="install-dialog-close" type="button" aria-label="Close install dialog" data-install-close>×</button>' +
      '<div class="install-dialog-icon"><img src="/icons/icon-192.png" alt="" width="58" height="58"></div>' +
      '<span class="install-dialog-eyebrow">STAYSURE ON YOUR PHONE</span>' +
      '<h2 id="install-dialog-title">Find your next home, faster.</h2>' +
      '<p id="install-dialog-description">Add StaySure to your home screen for quick access to accommodation, saved places and applications.</p>' +
      '<p class="install-dialog-instructions" data-install-instructions hidden></p>' +
      '<div class="install-dialog-actions"><button class="install-dialog-primary" type="button" data-install-action>Install app</button>' +
      '<button class="install-dialog-later" type="button" data-install-close>Maybe later</button></div>' +
      '</section>';

    dialog.addEventListener('click', async function (event) {
      if (event.target === dialog || event.target.closest('[data-install-close]')) {
        close(true);
        return;
      }
      const action = event.target.closest('[data-install-action]');
      if (!action) return;
      if (action.dataset.installDone === 'true') {
        close(true);
      } else if (installEvent) {
        const promptEvent = installEvent;
        installEvent = null;
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') write(INSTALLED_KEY, 'true');
        close(choice.outcome !== 'accepted');
      } else {
        showInstructions();
      }
    });

    document.body.appendChild(dialog);
    document.body.classList.add('install-dialog-open');
    updateAction();
    dialog.querySelector('[data-install-action]').focus();
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installEvent = event;
    updateAction();
  });
  window.addEventListener('appinstalled', function () {
    write(INSTALLED_KEY, 'true');
    close(false);
  });
  document.addEventListener('keydown', function (event) {
    if (!dialog) return;
    if (event.key === 'Escape') close(true);
    if (event.key === 'Tab') {
      const controls = Array.from(dialog.querySelectorAll('button'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('load', function () { window.setTimeout(show, 1600); });
})();
