/* OPTES developers «Start in 3 steps» (2026-11-13): code tabs, copy buttons, pick a model -> the code uses it.
   No library, no network, no storage. Source: site-chrome/devstart-20261113/start.js */
(function () {
  var root = document.querySelector('[data-ds]');
  if (!root) return;
  root.classList.remove('ds-nojs');
  var L = root.getAttribute('data-l-copied') || 'Copied';
  var live = root.querySelector('[data-ds-live]');

  function say(t) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); } }

  function copy(text, btn) {
    function done() {
      var lab = btn.querySelector('span');
      var old = lab ? lab.textContent : '';
      btn.setAttribute('data-done', '');
      if (lab) lab.textContent = L;
      say(L);
      setTimeout(function () { btn.removeAttribute('data-done'); if (lab) lab.textContent = old; }, 1600);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else { fallback(text); done(); }
  }
  function fallback(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) { /* nothing else to try */ }
    document.body.removeChild(t);
  }

  // tabs (curl / Python / JavaScript)
  var tabs = [].slice.call(root.querySelectorAll('[role=tab]'));
  function pick(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { pick(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      else if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === 'Home') n = tabs[0];
      else if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); pick(n, true); }
    });
  });

  // copy the visible snippet / the base URL
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var what = b.getAttribute('data-copy');
    if (what === 'code') {
      var p = root.querySelector('.ds-pane:not([hidden])');
      if (p) copy(p.textContent.replace(/\s+$/, '') + '\n', b);
    } else {
      copy(what, b);
    }
  });

  // pick a model: every snippet now names it
  var cards = [].slice.call(root.querySelectorAll('[data-model]'));
  cards.forEach(function (c) {
    c.addEventListener('click', function () {
      var id = c.getAttribute('data-model');
      cards.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      [].forEach.call(root.querySelectorAll('[data-m]'), function (s) { s.textContent = id; });
      say((root.getAttribute('data-l-uses') || 'The code now uses') + ' ' + id);
    });
  });
})();
