  /* ================================================================== */
  /* READING POSITION: pages open at the top; the spot you left is kept  */
  /* and offered back — on the chapter itself and from «Продолжить» home  */
  /* ================================================================== */
  const POS_KEY = 'basil-pos';
  function readPos(view) {
    const all = store.get(POS_KEY, {}) || {};
    const p = all[view];
    return p && Date.now() - (p.t || 0) < 60 * 864e5 ? p : null;
  }
  const absTop = el => el.getBoundingClientRect().top + window.scrollY;
  const labelOf = el => {
    const t = el.matches('details.deep') ? $('.deep-title', el) : el.matches('summary') && $('.deeper-t, .rc-title', el) ? $('.deeper-t, .rc-title', el) : el;
    const s = (t ? t.textContent : '').replace(/\s+/g, ' ').trim();
    return s.length > 56 ? s.slice(0, 54).trim() + '…' : s;
  };
  // the last heading (or deep dive) that has scrolled past the top edge
  function currentAnchor() {
    if (!currentView) return null;
    const scope = $('.panel.is-active', currentView) || currentView;
    const line = stickyOffset() + 90;
    let best = null;
    for (const el of $$('h2[id], h3[id], h4[id], summary[id], details.deep[id], .recipe-card[id]', scope)) {
      if (!el.getClientRects().length) continue; // inside a closed block
      if (el.getBoundingClientRect().top <= line) best = el; else break;
    }
    return best;
  }
  // only the reader's own scrolling moves the bookmark — not the jump to the top on arrival
  let userMoved = false;
  ['wheel', 'touchmove', 'keydown'].forEach(ev => window.addEventListener(ev, () => { userMoved = true; }, { passive: true }));
  function savePos() {
    if (!currentView || here === 'glavnaya' || !userMoved) return;
    const all = store.get(POS_KEY, {}) || {};
    const panel = $('.panel.is-active', currentView);
    const y = Math.round(window.scrollY);
    if (y < 400) { delete all[here]; store.set(POS_KEY, all); return; }
    const a = currentAnchor();
    all[here] = { panel: panel ? panel.id : null, anchor: a ? a.id : null, off: a ? Math.round(y - absTop(a)) : 0, y, label: a ? labelOf(a) : '', t: Date.now() };
    store.set(POS_KEY, all);
  }
  function resumeTo(pos, behavior = 'auto') {
    if (!pos) return;
    const panel = pos.panel && document.getElementById(pos.panel);
    if (panel && !panel.classList.contains('is-active')) {
      try { history.replaceState(null, '', '#' + pos.panel); } catch (e) { /* sandboxed */ }
      route('#' + pos.panel, { top: true });
    }
    const el = pos.anchor && document.getElementById(pos.anchor);
    const place = () => {
      const t = el ? absTop(el) + pos.off : pos.y;
      window.scrollTo({ top: Math.max(0, t), behavior });
    };
    if (el) for (let box = el.parentElement && el.parentElement.closest('details'); box; box = box.parentElement && box.parentElement.closest('details')) box.open = true;
    place();
    // models above the spot mount lazily and push it down: land once more unless the reader moved
    let touched = false;
    const stop = () => { touched = true; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => window.addEventListener(ev, stop, { once: true, passive: true }));
    setTimeout(() => { if (!touched) { behavior = 'auto'; place(); } }, 800);
  }
  let pill = null;
  function offerResume(pos) {
    if (!pos || pos.y < 900 || pill) return;
    const panel = pos.panel && document.getElementById(pos.panel);
    const where = pos.label || (panel && panel.dataset.title) || 'место, где вы остановились';
    pill = document.createElement('div');
    pill.className = 'resume-pill';
    pill.setAttribute('role', 'status');
    pill.innerHTML = `<button type="button" class="resume-go">${icon('arrow-r')}<span><small>Вы остановились здесь</small><b>${esc(where)}</b></span></button><button type="button" class="resume-x" aria-label="Скрыть">${icon('close')}</button>`;
    document.body.appendChild(pill);
    requestAnimationFrame(() => pill && pill.classList.add('is-shown'));
    const hide = () => {
      if (!pill) return;
      const el = pill;
      pill = null;
      el.classList.remove('is-shown');
      setTimeout(() => el.remove(), 400);
      window.removeEventListener('scroll', onScroll);
    };
    const y0 = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - y0) > 500) hide(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    $('.resume-go', pill).addEventListener('click', () => { hide(); userMoved = true; resumeTo(pos, smooth()); });
    $('.resume-x', pill).addEventListener('click', hide);
    setTimeout(hide, 12000);
  }
  function initReadingPos() {
    if (!PAGES || here === 'glavnaya') return;
    const pos = readPos(here);
    if (ENTRY.resume) {
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* sandboxed */ }
      if (pos) setTimeout(() => { userMoved = true; resumeTo(pos); }, 60);
    } else if (ENTRY.top || !location.hash) {
      offerResume(pos);
    }
    let t = 0;
    window.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(savePos, 400); }, { passive: true });
    window.addEventListener('pagehide', savePos);
    document.addEventListener('visibilitychange', () => { if (document.hidden) savePos(); });
    // Safari and Chrome keep whole pages in memory for Back: those also open at the top
    window.addEventListener('pageshow', e => {
      if (!e.persisted) return;
      userMoved = false;
      const p = readPos(here);
      window.scrollTo(0, 0);
      offerResume(p);
    });
  }

  /* links to other chapters point at their pages — also those scripts add later */
  function initLinks() {
    if (!PAGES) return;
    fixLinks(document.body);
    if ('MutationObserver' in window) {
      new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) fixLinks(n); })))
        .observe(document.body, { childList: true, subtree: true });
    }
  }
  /* a search hit on another page arrives as «page.html?do=…#…»: open the symptom, element or variety it named */
  function initPageAction() {
    let act = null;
    try { act = new URLSearchParams(location.search).get('do'); } catch (e) { /* old browser */ }
    if (!act) return;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* sandboxed */ }
    const [kind, arg] = act.split(':');
    setTimeout(() => {
      if (kind === 'sym') selectSymptom(arg, true);
      else if (kind === 'el') selectElement(+arg, true);
      else if (kind === 'var') openVariety(+arg);
    }, 60);
  }

