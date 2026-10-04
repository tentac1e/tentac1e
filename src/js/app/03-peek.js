  /* ================================================================== */
  /* «ЗАГЛЯНУТЬ»: a reference opens in a sheet over the text            */
  /* ================================================================== */
  /* A link from the text to another chapter or another tab, a chip of the chapter's «Глубже» row and a tool show
     their place in a sheet: the page of that chapter in a frame, in its peek mode (?peek=1, see markPeek) — only
     the place asked for, its models, pictures and calculators working as on their own page. Closing the sheet
     leaves the page where it was; «Открыть в главе» goes there, and the way back returns to the link.
     The frame and the page speak by messages only: a page opened from disk cannot look into another file */
  const peek = { d: null, frame: null, stack: [], from: null, pushed: false, popped: false, ignorePop: false, goAfter: null, files: null };
  const decodeSafe = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  // links that only go somewhere: the chapter's own path, the contents' chapters, the search, the home page's ways in
  const PEEK_SKIP = '.pager, .panel-next, .subnav, .tabbar, .topbar, .footer, .toc-chapters, .search-results, #chapters, #quick, #continue, .hero-actions, .resume-pill, [data-garden-link]';

  // where a link leads: the chapter and the place in it (an id, or a tab's short anchor), read against `base`
  function placeOf(href, base = here) {
    if (!href || !PAGES) return null;
    const i = href.indexOf('#');
    let path = i < 0 ? href : href.slice(0, i);
    const id = decodeSafe(i < 0 ? '' : href.slice(i + 1));
    path = decodeSafe(path.replace(/\?.*$/, '')).replace(/^\.?\//, '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return null; // another site
    if (!path) return { view: base, id };
    if (!peek.files) peek.files = Object.fromEntries(Object.entries(PAGES.files).map(([v, f]) => [decodeSafe(f).replace(/^\.?\//, ''), v]));
    const view = peek.files[path] || (path === 'index.html' ? 'glavnaya' : null);
    return view ? { view, id } : null;
  }
  const placeUrl = t => (t.view === here ? '#' + t.id : PAGES.files[t.view] + (t.id ? '#' + t.id : ''));
  const frameSrc = t => PAGES.files[t.view].replace(/^\.\/$/, './') + '?peek=1' + (t.id ? '#' + encodeURIComponent(t.id) : '');

  // what a click on this link should do: open its place in the sheet, scroll to it on this tab (near), or go
  function peekable(a) {
    if (!peek.d) return null;
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download') || a.closest(PEEK_SKIP)) return null;
    const pl = placeOf(href);
    if (!pl || pl.view === 'moy' || pl.view === 'glavnaya') return null;
    // a tool (home page, the contents' tools): in the sheet, wherever it lives
    if (a.closest('#tools-home, .toc-tools')) return { view: pl.view, id: a.dataset.peek || pl.id, tool: true, title: ($('b', a) || a).textContent.trim() };
    if (a.closest('dialog') || !a.closest('main')) return null;
    if (pl.view !== here) return pl.id ? pl : null; // a chapter as a whole is somewhere to go
    if (!pl.id) return null;
    const el = document.getElementById(pl.id) || document.getElementById(aliasOf(pl.id));
    if (!el || el.matches('[data-panel], [data-view]')) return null; // a tab of this chapter: its own way
    // the chapter's «Глубже» row: the dive in the sheet, the tab the reader is on stays
    if (a.closest('.deep-index')) return pl;
    const tab = el.closest('[data-panel]'), open = currentView && $('.panel.is-active', currentView);
    return tab && tab !== open ? pl : { ...pl, near: true };
  }

  function peekShow(t) {
    const { d } = peek;
    const ch = chapterById(t.view);
    d.classList.add('is-loading');
    $('#peek-h', d).textContent = t.title || '';
    $('#peek-where', d).textContent = t.where || (ch ? ch.title : '');
    const go = $('#peek-go', d);
    go.setAttribute('href', placeUrl(t));
    $('span', go).textContent = t.view === here ? 'Открыть на странице' : `Открыть в главе «${ch ? ch.title : ''}»`;
    $('[data-peek-back]', d).hidden = peek.stack.length < 2;
    peekLoad(t);
  }
  // the frame's first page comes in place of its blank one; later ones replace the page in it — the browser's
  // history gets no step of its own for them, so Back still closes the sheet
  function peekLoad(t) {
    const src = frameSrc(t), f = peek.frame;
    if (f.dataset.src === src) return;
    f.dataset.src = src;
    if (!f.dataset.used) { f.dataset.used = '1'; f.src = src; } else f.contentWindow.location.replace(src);
  }
  // a fresh frame for the next time: the page that was in it goes, with its models and timers
  function resetFrame() {
    const f = peek.frame, n = document.createElement('iframe');
    n.className = f.className;
    n.id = f.id;
    n.title = 'Отрывок из главы';
    f.replaceWith(n);
    peek.frame = n;
  }

  function openPeek(t, a) {
    $$('dialog.sheet[open]').forEach(x => { if (x !== peek.d) closeSheet(x, true); });
    // where the reader was: the way back from «Открыть в главе» leads there — to the link in the text, or, from the
    // contents or the chapter's head, to the place being read (the top of the chapter when nothing is read yet)
    const ch = chapterById(here) || (here === 'moy' ? { title: 'Мой базилик' } : null);
    let sp = a && a.closest('main') && !a.closest('.deep-index') ? spotOf(a) : null;
    if (!sp && ch) sp = bookmarkHere();
    peek.from = ch ? { spot: sp, label: [ch.title, sp && sp.label].filter(Boolean).join(' · ') } : null;
    peek.stack = [t];
    peekShow(t);
    if (!peek.d.open) openSheet('sheet-peek');
    if (!peek.pushed) {
      try { history.pushState({ peek: 1 }, '', location.href); peek.pushed = true; } catch (e) { /* sandboxed history */ }
    }
    HAP.tick();
  }
  function goToPlace(t) {
    const url = placeUrl(t);
    if (peek.from) saveDetour({ from: here, to: t.view, spot: peek.from.spot, label: peek.from.label });
    const near = t.view === here && peek.from;
    const spot = near ? peek.from.spot : null;
    const go = () => { location.href = url; if (spot) offerBack(spot); };
    if (!peek.d.open || !peek.pushed) { closeSheet(peek.d, true); go(); return; }
    // the sheet's step in the history goes first, then the page goes on: Back from there is the page, not the sheet
    peek.popped = true;
    peek.goAfter = go;
    peek.ignorePop = true;
    closeSheet(peek.d, true);
    history.back();
    setTimeout(() => { if (peek.goAfter) { const g = peek.goAfter; peek.goAfter = null; peek.ignorePop = false; g(); } }, 400);
  }
  // the router asks first on Back: the sheet closes, the page stays
  function peekPop() {
    if (peek.ignorePop) {
      peek.ignorePop = false;
      if (peek.goAfter) { const g = peek.goAfter; peek.goAfter = null; g(); }
      return true;
    }
    if (peek.d && peek.d.open) { peek.popped = true; closeSheet(peek.d); return true; }
    return false;
  }
  function onPeekClosed() {
    peek.stack = [];
    if (peek.pushed && !peek.popped) {
      peek.ignorePop = true;
      try { history.back(); } catch (e) { peek.ignorePop = false; }
    }
    peek.pushed = false;
    peek.popped = false;
    setTimeout(() => { if (!peek.d.open) resetFrame(); }, 60);
  }
  function sendTheme() {
    const w = peek.frame && peek.frame.contentWindow;
    if (w) w.postMessage({ basil: 'theme', theme: document.documentElement.getAttribute('data-theme') }, '*');
  }
  function onPeekMessage(e) {
    if (!peek.frame || e.source !== peek.frame.contentWindow) return;
    const m = e.data;
    if (!m || typeof m !== 'object') return;
    if (m.basil === 'peek-ready') {
      const top = peek.stack[peek.stack.length - 1];
      // a tool keeps its own name; any other place takes the one its page gives it
      if (top) { if (!top.tool || !top.title) top.title = m.title || top.title; top.where = m.where || top.where; }
      $('#peek-h', peek.d).textContent = (top && top.title) || '';
      $('#peek-where', peek.d).textContent = (top && top.where) || '';
      peek.frame.title = (top && top.title) || 'Отрывок из главы';
      peek.d.classList.remove('is-loading');
      sendTheme();
    } else if (m.basil === 'peek-link') {
      // a link inside the sheet: its place in the same sheet (← goes back), a whole chapter or a page — there
      const pl = placeOf(String(m.href || ''), m.view);
      if (!pl) return;
      if (pl.id && pl.view !== 'moy' && pl.view !== 'glavnaya') { peek.stack.push(pl); peekShow(pl); } else goToPlace(pl);
    } else if (m.basil === 'peek-close') closeSheet(peek.d);
  }

  function initPeek() {
    if (PEEK) { initPeekFrame(); return; }
    const d = $('#sheet-peek');
    // the one-file book has every chapter on its page: a link from the text goes there as before, and the way
    // back to the link waits (a frame would load the whole book once more)
    if (!PAGES) {
      document.addEventListener('click', e => {
        if (e.defaultPrevented || e.button !== 0) return;
        const a = e.target.closest('main a[href^="#"]');
        if (!a || a.closest(PEEK_SKIP + ', .deep-index')) return;
        const el = document.getElementById(decodeSafe(a.getAttribute('href').slice(1)));
        if (!el || el.matches('[data-panel], [data-view]')) return;
        const sp = spotOf(a);
        if (sp) setTimeout(() => offerBack(sp), 0);
      }, true);
      return;
    }
    if (!d) return;
    peek.d = d;
    peek.frame = $('#peek-frame', d);
    // a mouse on its way to a link: the place starts loading before the click
    document.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || d.open) return;
      const a = e.target.closest && e.target.closest('a[href]'), t = a && peekable(a);
      if (t && !t.near) peekLoad(t);
    }, { passive: true, capture: true });
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      const t = a && peekable(a);
      if (!t) return;
      // lower on this tab: the router scrolls there, and the way back to the link waits
      if (t.near) { const sp = spotOf(a); setTimeout(() => offerBack(sp), 0); return; }
      e.preventDefault();
      e.stopImmediatePropagation();
      openPeek(t, a);
    }, true);
    addEventListener('message', onPeekMessage);
    d.addEventListener('close', onPeekClosed);
    $('[data-peek-back]', d).addEventListener('click', () => {
      if (peek.stack.length < 2) return;
      peek.stack.pop();
      peekShow(peek.stack[peek.stack.length - 1]);
    });
    $('#peek-go', d).addEventListener('click', e => {
      e.preventDefault();
      const t = peek.stack[peek.stack.length - 1];
      if (t) goToPlace(t);
    });
    document.addEventListener('basil:theme', sendTheme);
  }

  /* ---- the page inside the sheet (?peek=1) ---- */
  const toParent = m => { try { window.parent.postMessage(m, '*'); } catch (e) { /* no parent */ } };
  // the place the frame shows: the target, its section when it is a heading, the tab, or the whole chapter;
  // it and the elements around it stay, everything beside them goes (25-peek.css). Nothing in the page moves
  function markPeek(r) {
    $$('[data-peek], [data-peek-up]').forEach(el => { el.removeAttribute('data-peek'); el.removeAttribute('data-peek-up'); });
    const t = r.target;
    let parts;
    if (t && t.matches('h2, h3, h4') && !t.closest('summary')) parts = sectionOf(t);
    else if (t && t.matches('summary')) parts = [t.parentElement];
    else parts = [t || r.panel || r.view];
    parts = parts.filter(n => n && n.nodeType === 1);
    if (!parts.length) return;
    parts.forEach(el => { el.setAttribute('data-peek', ''); if (el.matches('details')) el.open = true; });
    const main = $('#main');
    for (let up = parts[0].parentElement; up; up = up.parentElement) {
      up.setAttribute('data-peek-up', '');
      if (up === main) break;
    }
    // a dive asked for stands open whatever the depth of reading
    for (let box = parts[0].closest('details'); box; box = box.parentElement && box.parentElement.closest('details')) box.open = true;
    const el = parts[0], ch = chapterById(r.view.dataset.view), tab = el.closest('[data-panel]');
    let title, where = ch ? ch.title : '';
    if (el.matches('details.deep')) { title = labelOf(el); where += ' · Глубже'; }
    else if (el.matches('[data-panel]')) title = el.dataset.title;
    else if (el.matches('[data-view]')) title = ch ? ch.title : '';
    else {
      const h = el.matches('h2, h3, h4, summary') ? el : $('h2, h3, h4, summary', el);
      title = h ? labelOf(h) : (tab && tab.dataset.title) || '';
      if (tab && tab.dataset.title && tab.dataset.title !== title) where += ' · ' + tab.dataset.title;
    }
    const say = () => toParent({ basil: 'peek-ready', title: (title || '').replace(/\s+/g, ' ').trim(), where });
    if (document.documentElement.classList.contains('is-ready')) say(); else document.addEventListener('basil:ready', say, { once: true });
  }
  function initPeekFrame() {
    const root = document.documentElement;
    // every link here belongs to the page around the sheet: it decides (the same sheet, or there)
    document.addEventListener('click', e => {
      if (e.button !== 0) return;
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:)/i.test(href) && !href.startsWith(location.origin + '/')) { a.target = '_blank'; a.rel = 'noopener'; return; }
      e.preventDefault();
      e.stopImmediatePropagation();
      toParent({ basil: 'peek-link', view: here, href });
    }, true);
    // the dive or recipe the sheet was opened for does not fold away (the sheet would stand empty)
    document.addEventListener('click', e => {
      const sum = e.target.closest('summary');
      if (sum && sum.parentElement.matches('details[data-peek]')) e.preventDefault();
    }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$$('dialog[open]').length) toParent({ basil: 'peek-close' }); });
    addEventListener('message', e => {
      if (e.source !== window.parent || !e.data || e.data.basil !== 'theme') return;
      if (e.data.theme) root.setAttribute('data-theme', e.data.theme); else root.removeAttribute('data-theme');
    });
  }
