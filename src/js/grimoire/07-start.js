  /* ------------------------------------------------------------------ */
  /* on and off: the crypt, the altars, the screen of the CRT             */
  /* ------------------------------------------------------------------ */
  let started = false;
  const mounted = [];
  function start() {
    if (!skinOn()) { stop(); return; }
    if (started) return;
    started = true;
    // a page shown in the sheet of another (?peek=1) is only its place: no crypt, no altar, the molecules as here
    if (!root.classList.contains('is-peek')) {
      mounted.push(crypt());
      $$('.ch-hero').forEach(h => { const v = h.closest('[data-view]'); mounted.push(altar(h, v && v.dataset.view)); });
      const art = $('.view-home .hero-art');
      if (art) mounted.push(altar(art, 'glavnaya'));
    }
    $$('svg.ill').forEach(pixelate);
    illWatch.observe(doc.body, { childList: true, subtree: true });
    doc.addEventListener('toggle', onToggle, true);
    doc.addEventListener('basil:panel', onPanel);
    addEventListener('resize', onResize);
    root.classList.add('psx-on');
    $$('[data-crt]').forEach(b => b.setAttribute('aria-checked', String(!root.classList.contains('no-crt'))));
  }
  function stop() {
    if (!started) return;
    started = false;
    mounted.splice(0).forEach(m => m.destroy());
    illWatch.disconnect();
    doc.removeEventListener('toggle', onToggle, true);
    doc.removeEventListener('basil:panel', onPanel);
    removeEventListener('resize', onResize);
    root.classList.remove('psx-on');
  }
  // the lines of the CRT and the darker edges: a switch in the footer, remembered in this browser
  doc.addEventListener('click', e => {
    const b = e.target.closest('[data-crt]');
    if (!b) return;
    const on = root.classList.toggle('no-crt') === false;
    b.setAttribute('aria-checked', String(on));
    try { localStorage.setItem('basil-crt', JSON.stringify(on)); } catch (err) { /* the switch still works for this visit */ }
  });
  doc.addEventListener('basil:theme', () => { if (skinOn()) start(); else stop(); });

  const api = { start, stop, drawMol, get on() { return skinOn(); } };
