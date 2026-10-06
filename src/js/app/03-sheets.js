  /* ================================================================== */
  /* SHEETS                                                              */
  /* ================================================================== */
  // below this width a sheet is a bottom sheet that follows the finger (21-sheets.css)
  const phoneSheets = window.matchMedia('(max-width: 1279px)');
  // from this width the contents drop from their button in the header (24-toc.css)
  const tocDrop = window.matchMedia('(min-width: 900px)');
  function openSheet(id) {
    const d = document.getElementById(id);
    if (!d) return;
    // opened again while it was still leaving
    if (d.classList.contains('is-closing')) { clearTimeout(d._closing); d.classList.remove('is-closing'); }
    if (!d.open) {
      if (id === 'sheet-search') fitSearchPanel();
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    }
    if (id === 'sheet-toc') tocOpen(d);
    if (id === 'sheet-search') {
      // in the same tap, or the phone does not raise the keyboard
      const input = $('#search-input');
      input.focus({ preventScroll: true });
      input.select();
      loadSearch();
    } else {
      // the sheet takes the focus, not its first button: no ring on × after a tap
      d.focus({ preventScroll: true });
    }
  }
  // the sheet leaves first (down on a phone, fading on a computer), then the dialog closes; now — at once
  function closeSheet(d, now) {
    if (!d || !d.open) return;
    if (d.classList.contains('is-closing') && !now) return;
    const shut = () => {
      clearTimeout(d._closing);
      d.removeEventListener('transitionend', onEnd);
      d.classList.remove('is-closing', 'is-dragging', 'is-settling');
      d.style.translate = '';
      d.style.removeProperty('--sheet-fade');
      if (!d.open) return;
      if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
    };
    const onEnd = e => { if (e.target === d && !e.pseudoElement) shut(); };
    if (now || reduceMotion.matches) { shut(); return; }
    d.getAnimations().forEach(a => a.finish()); // still sliding in
    // from where the finger left it: the transition starts at the place last drawn
    d.style.translate = '';
    d.classList.remove('is-dragging', 'is-settling');
    d.classList.add('is-closing');
    d.addEventListener('transitionend', onEnd);
    d._closing = setTimeout(shut, 360);
  }

  // a bottom sheet follows the finger: by its head (the grabber and the title) at once; by the list only
  // when the list is at its very top and the finger goes down — otherwise the list scrolls as usual.
  // Down it goes 1:1, up a little and with resistance. Let go past 30 % of its height or flick it down,
  // and it closes; short of that it springs back. The page under the sheet never moves.
  function dragSheet(d) {
    const head = $('.sheet-top', d);
    // the search panel stands at the top of the screen: it never moves, but the page under it must not either
    const fixed = d.classList.contains('sheet-search');
    let g = null;
    const start = () => {
      d.getAnimations().forEach(a => a.finish()); // grabbed while it was still sliding in
      clearTimeout(d._settle);
      d.classList.remove('is-settling');
      d.classList.add('is-dragging');
    };
    d.addEventListener('touchstart', e => {
      g = null;
      if (!phoneSheets.matches || e.touches.length !== 1 || d.classList.contains('is-closing') || (d.id === 'sheet-toc' && tocDrop.matches)) return;
      const t = e.touches[0], r = d.getBoundingClientRect();
      // on the backdrop the finger moves nothing
      const mode = t.clientY < r.top ? 'still' : head && head.contains(e.target) ? 'sheet' : null;
      g = { x0: t.clientX, y0: t.clientY, h: r.height, y: 0, pts: [[t.clientY, e.timeStamp]], past: false, mode, moved: false };
      if (mode === 'sheet') start();
    }, { passive: true });
    d.addEventListener('touchmove', e => {
      if (!g || e.touches.length !== 1) return;
      const t = e.touches[0], dx = t.clientX - g.x0, dy = t.clientY - g.y0;
      if (!g.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) { if (g.mode && g.mode !== 'free' && e.cancelable) e.preventDefault(); return; }
      g.moved = true;
      if (g.mode === null) {
        const list = e.target.closest('.sheet-inner, .search-results');
        if (Math.abs(dx) > Math.abs(dy)) g.mode = 'free'; // a row of chips scrolled sideways
        else if (dy > 0 && (!list || list.scrollTop <= 0)) { if (fixed) g.mode = 'still'; else { g.mode = 'sheet'; g.y0 = t.clientY; start(); } }
        else if (list && list.scrollHeight > list.clientHeight + 1) g.mode = 'free';
        else g.mode = 'still';
      }
      if (g.mode === 'free') return;
      if (e.cancelable) e.preventDefault();
      if (g.mode !== 'sheet') return;
      const y = t.clientY - g.y0;
      g.y = y >= 0 ? y : -Math.min(24, Math.sqrt(-y) * 3);
      d.style.translate = `0 ${Math.round(g.y * 10) / 10}px`;
      d.style.setProperty('--sheet-fade', Math.max(0, 1 - Math.max(0, g.y) / g.h).toFixed(3));
      g.pts.push([t.clientY, e.timeStamp]);
      while (g.pts.length > 2 && e.timeStamp - g.pts[0][1] > 100) g.pts.shift();
      // a tick when letting go would close it
      const past = g.y > g.h * 0.3;
      if (past !== g.past) { g.past = past; if (past && window.BasilHaptics) window.BasilHaptics.tick(); }
    }, { passive: false });
    const end = e => {
      const s = g;
      g = null;
      if (!s || s.mode !== 'sheet') return;
      d.classList.remove('is-dragging');
      if (!s.moved) return;
      d._noClick = Date.now() + 400; // the tap that ends a drag is not a tap on what is under it
      // the speed of the last 120 ms: a finger held still before letting go is not a flick
      const pts = s.pts.filter(p => e.timeStamp - p[1] <= 120);
      const a = pts[0], b = pts[pts.length - 1];
      const v = pts.length > 1 && b[1] > a[1] ? (b[0] - a[0]) / (b[1] - a[1]) : 0; // px per ms, down is positive
      if (s.y > s.h * 0.3 || (v > 0.5 && s.y > 12)) { closeSheet(d); return; }
      d.classList.add('is-settling');
      d.style.translate = '';
      d.style.removeProperty('--sheet-fade');
      d._settle = setTimeout(() => d.classList.remove('is-settling'), 360);
    };
    d.addEventListener('touchend', end);
    d.addEventListener('touchcancel', end);
    d.addEventListener('click', e => { if (d._noClick && Date.now() < d._noClick) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* the contents («Оглавление», written into every page by scripts/build.py): the chapters, each opening into its
     sections, and the tools by what they are for. It opens on the reader's place: that chapter open, its section
     marked, the others folded */
  function tocFold(li, open) {
    li.classList.toggle('is-open', open);
    const b = $('.toc-tog', li);
    if (b) b.setAttribute('aria-expanded', String(open));
  }
  function tocPane(d, pane) {
    const toc = $('.toc', d);
    if (toc) toc.dataset.pane = pane;
    $$('[data-toc-pane]', d).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tocPane === pane)));
  }
  function tocOpen(d) {
    const id = currentView && currentView.dataset.view;
    const active = currentView && $('[data-panel].is-active', currentView);
    tocPane(d, 'ch');
    $$('.toc-item[data-toc]', d).forEach(li => {
      const on = li.dataset.toc === id, link = $('.toc-link', li);
      if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      tocFold(li, on && !!$('.toc-sub', li));
      // a section's link ends in its panel's anchor (the short Russian one on the pages, the long one in the book)
      $$('[data-p]', li).forEach(a => { if (on && active && decodeURIComponent(a.hash.slice(1)) === active.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    });
    // on a computer it drops from its button
    const btn = $('.topbar .toc-btn');
    if (btn && tocDrop.matches) d.style.setProperty('--toc-x', Math.round(btn.getBoundingClientRect().left) + 'px');
    // the reader's chapter in sight, under the home page and «Мой базилик» if it fits
    const sc = $('.sheet-inner', d), cur = $('.toc-item.is-open', d);
    if (sc) sc.scrollTop = 0;
    if (sc && cur) {
      const r = cur.getBoundingClientRect(), box = sc.getBoundingClientRect();
      // with the whole row above it, from its top edge
      const above = cur.previousElementSibling, top = above ? above.getBoundingClientRect().top : r.top;
      if (r.bottom > box.bottom) sc.scrollTop = Math.max(0, top - box.top - 4);
    }
  }
  // the header's button says where the reader is (in the one-file book it follows the chapter)
  function tocButton(id) {
    const btn = $('.topbar .toc-btn');
    if (!btn) return;
    const ch = chapterById(id);
    const place = ch ? `<span class="toc-btn-t">${esc(ch.short || ch.title)}</span>` : `<span class="toc-btn-t">${id === 'moy' ? 'Мой базилик' : 'Оглавление'}</span>`;
    const box = $('.toc-btn-p', btn);
    if (box && box.innerHTML !== place) box.innerHTML = place;
  }
  function initToc() {
    const d = $('#sheet-toc');
    if (!d) return;
    d.addEventListener('click', e => {
      const tog = e.target.closest('.toc-tog');
      if (tog) {
        const li = tog.closest('.toc-item');
        tocFold(li, !li.classList.contains('is-open'));
        if (window.BasilHaptics) window.BasilHaptics.tick();
        return;
      }
      const seg = e.target.closest('[data-toc-pane]');
      if (seg) tocPane(d, seg.dataset.tocPane);
    });
    document.addEventListener('basil:view', e => tocButton(e.detail.id));
    // the buttons that open it say whether it is open
    const btns = $$('[data-open="sheet-toc"]');
    const say = open => btns.forEach(b => b.setAttribute('aria-expanded', String(open)));
    say(false);
    d.addEventListener('close', () => say(false));
    btns.forEach(b => b.addEventListener('click', () => say(true)));
  }

  function initSheets() {
    initToc();
    $$('[data-open]').forEach(b => b.addEventListener('click', () => openSheet(b.dataset.open)));
    $$('dialog.sheet').forEach(d => {
      d.addEventListener('click', e => {
        if (e.target === d) closeSheet(d);
        if (e.target.closest('[data-close]')) closeSheet(d);
      });
      // Esc: the same way out as ×
      d.addEventListener('cancel', e => { e.preventDefault(); closeSheet(d); });
      dragSheet(d);
    });
    document.addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        openSheet('sheet-search');
      }
    });
  }
