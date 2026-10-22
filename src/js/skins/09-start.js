  /* ------------------------------------------------------------------ */
  /* on and off: the background of the skin, the scenes, its drawings,   */
  /* the screen of the CRT                                                */
  /* ------------------------------------------------------------------ */
  // what stands behind the page in each skin
  const BACKS = { grimoire: () => crypt(), druid: () => forest() };
  let started = null;
  const mounted = [];
  function start() {
    const skin = skinNow();
    if (!skin) { stop(); return; }
    if (started === skin) return;
    if (started) stop();
    started = skin;
    // its words on the labels of the guide (08-words.js), the sheet's page too
    wordsOn(skin);
    // a page shown in the sheet of another (?peek=1) is only its place: no background, no scene, the molecules as here
    if (!root.classList.contains('is-peek')) {
      mounted.push(BACKS[skin]());
      // the scenes: the background of the head of each chapter and of the home page's hero, by themselves, without a finger
      $$('.ch-hero').forEach(h => { const v = h.closest('[data-view]'); mounted.push(stage(h, v && v.dataset.view, skin)); });
      const hero = $('.view-home .hero');
      if (hero) mounted.push(stage(hero, 'glavnaya', skin));
    }
    // the drawings of «Гримуар» go to the console's pixels; «Друид» keeps them smooth and only colours them
    if (skin === 'grimoire') {
      $$('svg.ill').forEach(pixelate);
      illWatch.observe(doc.body, { childList: true, subtree: true });
      doc.addEventListener('toggle', onToggle, true);
      doc.addEventListener('basil:panel', onPanel);
      addEventListener('resize', onResize);
    }
    root.classList.add('psx-on');
    $$('[data-crt]').forEach(b => b.setAttribute('aria-checked', String(!root.classList.contains('no-crt'))));
  }
  function stop() {
    if (!started) return;
    started = null;
    mounted.splice(0).forEach(m => m.destroy());
    wordsOff();
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
  doc.addEventListener('basil:theme', () => { if (skinNow()) start(); else stop(); });

  const api = { start, stop, drawMol, say, get on() { return !!skinNow(); }, get skin() { return skinNow(); } };
