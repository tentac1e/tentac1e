  /* ================================================================== */
  /* READING POSITION: pages open at the top; the spot you left is kept  */
  /* and offered back — on the chapter itself and from «Продолжить» home  */
  /* ================================================================== */
  /* The spot is a place in the text, not a number of pixels: the block that was being read and the start of its   */
  /* sentence. Going back there is like finding your place in a book — at the start of the sentence, with the lines */
  /* before it in sight, whatever the width of the screen now.                                                       */
  const POS_KEY = 'basil-pos';
  function readPos(view) {
    const all = store.get(POS_KEY, {}) || {};
    const p = all[view];
    return p && Date.now() - (p.t || 0) < 60 * 864e5 ? p : null;
  }
  const absTop = el => el.getBoundingClientRect().top + window.scrollY;
  const labelOf = el => {
    const t = el.matches('details.deep') ? $('.deep-title', el) : el.matches('.recipe-card') ? $('.rc-title', el)
      : el.matches('summary') && $('.deeper-t, .rc-title', el) ? $('.deeper-t, .rc-title', el) : el;
    const s = (t ? t.textContent : '').replace(/\s+/g, ' ').trim();
    return s.length > 56 ? s.slice(0, 54).trim() + '…' : s;
  };
  const READ_HEADS = 'h2[id], h3[id], h4[id], summary[id], details.deep[id], .recipe-card[id]';
  // the last heading (or deep dive) that has scrolled past the top edge
  function currentAnchor() {
    if (!currentView) return null;
    const scope = $('.panel.is-active', currentView) || currentView;
    const line = stickyOffset() + 90;
    let best = null;
    for (const el of $$(READ_HEADS, scope)) {
      if (!el.getClientRects().length) continue; // inside a closed block
      if (el.getBoundingClientRect().top <= line) best = el; else break;
    }
    return best;
  }
  // the heading a block of text stands under (or the deep dive it is in)
  function headingBefore(b, scope) {
    let best = null;
    for (const el of $$(READ_HEADS, scope)) {
      if (el !== b && !el.contains(b) && !(el.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
      if (el.getClientRects().length) best = el;
    }
    return best;
  }

  // blocks of text as a reader sees them; a model, a picture or a figure is one block — models write their own text
  const READ_WHOLE = '.lab-tool, figure, [data-ill]';
  const READ_BLOCK = `p, li, dt, dd, h2, h3, h4, h5, summary, blockquote, figcaption, tr, pre, .card, ${READ_WHOLE}`;
  const ownWords = el => [...el.childNodes].some(n => n.nodeType === 3 && n.data.trim());
  function readBlocks(scope) {
    return $$(READ_BLOCK, scope).filter(el => {
      const whole = el.parentElement && el.parentElement.closest(READ_WHOLE);
      if (whole && scope.contains(whole)) return false;
      return el.matches(READ_WHOLE) || !el.querySelector(READ_BLOCK) || ownWords(el);
    });
  }
  const normText = t => t.replace(/\s+/g, ' ').trim();
  // a sentence ends with . ! ? … (and a closing » or bracket); the next one starts with a capital, « or a digit
  const SENT_END = /[.!?…][»")\]]*[\s ]+(?=[«"(\[]?[A-ZА-ЯЁ0-9])/g;
  function sentenceStart(text, k) {
    let s = 0;
    SENT_END.lastIndex = 0;
    for (let m; (m = SENT_END.exec(text)) && m.index + m[0].length <= k;) s = m.index + m[0].length;
    return s;
  }
  function sentenceEnd(text, k) {
    SENT_END.lastIndex = k;
    const m = SENT_END.exec(text);
    return m ? m.index + m[0].replace(/[\s ]+$/, '').length : text.replace(/[\s ]+$/, '').length;
  }
  // the text node and offset of the k-th character of a block
  function pointIn(b, k) {
    const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    let last = null;
    for (let t; (t = w.nextNode());) {
      if (k < t.data.length) return { node: t, offset: k };
      k -= t.data.length;
      last = t;
    }
    return last ? { node: last, offset: last.data.length } : null;
  }
  function caretAt(x, y) {
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p && p.offsetNode ? { node: p.offsetNode, offset: p.offset } : null; }
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r ? { node: r.startContainer, offset: r.startOffset } : null; }
    return null;
  }
  // what covers the text at the top of the screen: the header and, stuck under it, the chapter's tabs
  function coverTop(stuck) {
    const wrap = currentView && $('.subnav-wrap', currentView);
    const top = stickyOffset();
    if (!wrap || !wrap.offsetHeight) return top;
    return stuck || wrap.getBoundingClientRect().top <= top + 1 ? top + wrap.offsetHeight : top;
  }
  // the spot lands this far below the covered edge: the lines before it stay in sight, as in a book
  const READ_LEAD = 48;
  // the block being read at the top of the screen, and the start of the sentence the top line is in
  function spotAt(scope) {
    const line = coverTop(false) + READ_LEAD;
    const blocks = readBlocks(scope);
    let b = null;
    for (const el of blocks) {
      const r = el.getBoundingClientRect();
      if (r.height && r.bottom > line + 6) { b = el; break; }
    }
    if (!b) return null;
    let ch = 0, dy = 0;
    const r = b.getBoundingClientRect();
    // the line fell between two blocks: the next one's first line stood that much lower, and it will again
    if (r.top >= line - 2) dy = Math.max(0, Math.min(Math.round(spotTop({ b, ch: 0 }) - window.scrollY - line), Math.round(window.innerHeight / 3)));
    else if (!b.matches(READ_WHOLE)) {
      const hit = caretAt(r.left + (parseFloat(getComputedStyle(b).paddingLeft) || 0) + 2, line + 8);
      if (hit && b.contains(hit.node)) {
        const set = new Set(blocks);
        let inner = hit.node.nodeType === 1 ? hit.node : hit.node.parentElement;
        inner = inner && inner.closest(READ_BLOCK);
        while (inner && !set.has(inner)) inner = inner.parentElement && inner.parentElement.closest(READ_BLOCK);
        if (inner && b.contains(inner)) b = inner;
        const rg = document.createRange();
        rg.setStart(b, 0);
        rg.setEnd(hit.node, hit.offset);
        ch = sentenceStart(b.textContent, rg.toString().length);
      }
    }
    return { b, n: blocks.indexOf(b), ch, dy };
  }
  // the place of an element in the text, as a bookmark: the block it stands in and the start of its sentence
  // (a link the reader followed: the way back leads to it)
  function spotOf(el) {
    const view = el.closest('[data-view]') || currentView;
    const panel = el.closest('[data-panel]');
    const scope = panel || view;
    if (!scope) return null;
    const blocks = readBlocks(scope);
    const set = new Set(blocks);
    let b = el.closest(READ_BLOCK);
    while (b && !set.has(b)) b = b.parentElement && b.parentElement.closest(READ_BLOCK);
    // a link on a line of its own after the text it belongs to: that text, from its start
    if (!b) b = blocks.filter(x => x.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
    if (!b) return null;
    let ch = 0;
    if (!b.matches(READ_WHOLE) && b !== el && b.contains(el)) {
      const rg = document.createRange();
      rg.setStart(b, 0);
      rg.setEndBefore(el);
      ch = sentenceStart(b.textContent, rg.toString().length);
    }
    const t = b.textContent, a = headingBefore(b, scope);
    return { panel: panel ? panel.id : null, anchor: a ? a.id : null, label: a ? labelOf(a) : (panel && panel.dataset.title) || '',
             n: blocks.indexOf(b), sig: normText(t).slice(0, 40), ch, ss: normText(t.slice(ch, ch + 40)).slice(0, 24), dy: 0, y: Math.round(window.scrollY), t: Date.now() };
  }
  // the saved spot in the blocks of today's page: by its number, checked by its first words; after an update of
  // the text, the nearest block with the same words; the sentence by its first words too
  function findSpot(pos, scope) {
    if (pos.sig == null || pos.n == null) return null;
    const blocks = readBlocks(scope);
    const same = el => normText(el.textContent).slice(0, 40) === pos.sig;
    let b = blocks[pos.n] && same(blocks[pos.n]) ? blocks[pos.n] : null;
    if (!b) {
      let best = Infinity;
      blocks.forEach((el, i) => { if (Math.abs(i - pos.n) < best && same(el)) { best = Math.abs(i - pos.n); b = el; } });
    }
    if (!b) return null;
    const ok = pos.ch > 0 && normText(b.textContent.slice(pos.ch, pos.ch + 40)).slice(0, 24) === pos.ss;
    return { b, ch: ok ? pos.ch : 0, dy: pos.dy || 0 };
  }
  // the first letter of the spot: past the spaces the sentence or the block begins with
  function firstLetter(s) {
    const t = s.b.textContent;
    let k = s.ch;
    while (k < t.length && /[\s\u00a0]/.test(t[k])) k++;
    return k < t.length ? k : s.ch;
  }
  // where on the page the spot's first line is
  function spotTop(s) {
    if (!s.b.matches(READ_WHOLE)) {
      const p = pointIn(s.b, firstLetter(s));
      if (p) {
        const rg = document.createRange();
        rg.setStart(p.node, p.offset);
        rg.setEnd(p.node, Math.min(p.offset + 1, p.node.data.length));
        const r = rg.getClientRects()[0];
        if (r && r.height) return r.top + window.scrollY;
      }
    }
    return absTop(s.b);
  }

  // the sentence lights up for a moment, like a line marked in a book; a model or a picture gets a bar at its edge
  let markEl = null;
  function markSpot(s) {
    if (markEl) markEl.remove();
    const el = markEl = document.createElement('div');
    el.className = 'resume-mark';
    el.setAttribute('aria-hidden', 'true');
    const lines = () => {
      if (s.b.matches(READ_WHOLE)) {
        const r = s.b.getBoundingClientRect();
        return [{ x: r.left - 12, y: r.top, w: 4, h: Math.min(r.height, 120), bar: true }];
      }
      const t = s.b.textContent;
      const a = pointIn(s.b, firstLetter(s)), z = pointIn(s.b, sentenceEnd(t, s.ch));
      if (!a || !z) return [];
      const rects = [];
      const w = document.createTreeWalker(s.b, NodeFilter.SHOW_TEXT);
      w.currentNode = a.node;
      for (let n = a.node; n; n = n === z.node ? null : w.nextNode()) {
        const rg = document.createRange();
        rg.setStart(n, n === a.node ? a.offset : 0);
        rg.setEnd(n, n === z.node ? z.offset : n.data.length);
        rects.push(...rg.getClientRects());
      }
      const out = [];
      for (const r of rects) {
        if (!r.width || !r.height) continue;
        const l = out.find(o => Math.abs(o.y - r.top) < r.height / 2);
        if (l) { const right = Math.max(l.x + l.w, r.right); l.x = Math.min(l.x, r.left); l.w = right - l.x; l.h = Math.max(l.h, r.height); }
        else if (out.length < 6) out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
      }
      // tall letters of one line reach into the next: the strokes meet, they do not overlap
      out.sort((p, q) => p.y - q.y).forEach((l, i) => { const nx = out[i + 1]; if (nx && l.y + l.h + 2 > nx.y - 1) l.h = Math.max(4, nx.y - l.y - 3); });
      return out;
    };
    const place = () => {
      el.innerHTML = lines().map(l => `<i${l.bar ? ' class="is-bar"' : ''} style="left:${Math.round(l.x + window.scrollX - (l.bar ? 0 : 3))}px;top:${Math.round(l.y + window.scrollY - 1)}px;width:${Math.round(l.w + (l.bar ? 0 : 6))}px;height:${Math.round(l.h + 2)}px"></i>`).join('');
    };
    place();
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); if (markEl === el) markEl = null; }, 2800);
    return place;
  }

  // only the reader's own scrolling moves the bookmark — not the jump to the top on arrival
  let userMoved = false;
  ['wheel', 'touchmove', 'keydown'].forEach(ev => window.addEventListener(ev, () => { userMoved = true; }, { passive: true }));
  const USER_INPUT = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  // a page that should open at the top stays there: a phone puts a page it kept for Back where it was in the first
  // frames after showing it, after the script jumped — for that moment a scroll nobody asked for goes back to the top.
  // The reader's touch, wheel or key and the page's own moves (a link to a section, a tab) end it at once
  const HOLD_ENDS = ['hashchange', 'popstate'];
  function holdTop(ms = 600) {
    let until = performance.now() + ms;
    const stop = () => { until = 0; off(); };
    const onScroll = () => {
      if (performance.now() > until) { off(); return; }
      if (window.scrollY > 0) jump(() => window.scrollTo(0, 0));
    };
    const off = () => {
      USER_INPUT.forEach(ev => window.removeEventListener(ev, stop, true));
      HOLD_ENDS.forEach(ev => window.removeEventListener(ev, stop, true));
      document.removeEventListener('basil:panel', stop);
      window.removeEventListener('scroll', onScroll);
    };
    USER_INPUT.forEach(ev => window.addEventListener(ev, stop, { passive: true, capture: true }));
    HOLD_ENDS.forEach(ev => window.addEventListener(ev, stop, true));
    document.addEventListener('basil:panel', stop);
    window.addEventListener('scroll', onScroll, { passive: true });
    setTimeout(off, ms);
  }
  // the bookmark of the place being read now (null near the top of the page: nothing read yet)
  function bookmarkHere() {
    if (!currentView) return null;
    const panel = $('.panel.is-active', currentView);
    const scope = panel || currentView;
    const y = Math.round(window.scrollY);
    if (y < 400) return null;
    const s = spotAt(scope);
    const a = s ? headingBefore(s.b, scope) : currentAnchor();
    const pos = { panel: panel ? panel.id : null, anchor: a ? a.id : null, label: a ? labelOf(a) : '', y, t: Date.now() };
    if (s) {
      const t = s.b.textContent;
      Object.assign(pos, { n: s.n, sig: normText(t).slice(0, 40), ch: s.ch, ss: normText(t.slice(s.ch, s.ch + 40)).slice(0, 24), dy: s.dy });
    }
    return pos;
  }
  function savePos() {
    if (!currentView || here === 'glavnaya' || !userMoved) return;
    const all = store.get(POS_KEY, {}) || {};
    const pos = bookmarkHere();
    if (pos) all[here] = pos; else delete all[here];
    store.set(POS_KEY, all);
  }
  function resumeTo(pos, behavior = 'auto') {
    if (!pos) return;
    const panel = pos.panel && document.getElementById(pos.panel);
    // in the one-file book a chapter not shown keeps its tab marked open: its chapter has to be the one shown too
    if (panel && (!panel.classList.contains('is-active') || panel.closest('[data-view]') !== currentView)) {
      try { history.replaceState(null, '', '#' + pos.panel); } catch (e) { /* sandboxed */ }
      route('#' + pos.panel, { top: true });
    }
    const scope = $('.panel.is-active', currentView) || currentView;
    let s = findSpot(pos, scope);
    if (!s) {
      // a bookmark from before (pixels under a heading): stand there, then back to the start of what is there
      const el = pos.anchor && document.getElementById(pos.anchor);
      if (el) for (let box = el.parentElement && el.parentElement.closest('details'); box; box = box.parentElement && box.parentElement.closest('details')) box.open = true;
      jump(() => window.scrollTo(0, Math.max(0, el ? absTop(el) + (pos.off || 0) : pos.y)));
      s = spotAt(scope);
    }
    if (!s) return;
    // open what the spot is inside — not the block whose closed title it is
    let box = s.b.closest('details');
    const head = box && box.querySelector(':scope > summary');
    if (head && head.contains(s.b)) box = box.parentElement && box.parentElement.closest('details');
    for (; box; box = box.parentElement && box.parentElement.closest('details')) box.open = true;
    const place = how => {
      const to = () => window.scrollTo({ top: Math.max(0, Math.round(spotTop(s) - coverTop(true) - READ_LEAD - s.dy)), behavior: how });
      if (how === 'auto') jump(to); else to();
    };
    place(behavior);
    // the mark once the page stands there: at once after a jump, after the glide otherwise
    let remark = null;
    const show = () => { if (!remark) remark = markSpot(s); };
    if (behavior === 'auto') show();
    else {
      if ('onscrollend' in window) window.addEventListener('scrollend', show, { once: true });
      setTimeout(show, 700);
    }
    // models above the spot mount lazily and push it down: land once more unless the reader moved
    let touched = false;
    const stop = () => { touched = true; };
    USER_INPUT.forEach(ev => window.addEventListener(ev, stop, { once: true, passive: true }));
    setTimeout(() => {
      USER_INPUT.forEach(ev => window.removeEventListener(ev, stop));
      if (touched) return;
      place('auto');
      show();
      remark();
    }, 800);
  }
  /* the ways back. «Открыть в главе» from the «Заглянуть» sheet keeps where the reader came from (sessionStorage):
     the page gone to offers the way back, and that page, come back to with Back, stands at the link's sentence */
  const DETOUR_KEY = 'basil-detour';
  function saveDetour(d) {
    try { sessionStorage.setItem(DETOUR_KEY, JSON.stringify(Object.assign({}, d, { t: Date.now() }))); } catch (e) { /* private mode */ }
  }
  function readDetour() {
    try {
      const d = JSON.parse(sessionStorage.getItem(DETOUR_KEY) || 'null');
      return d && d.from && Date.now() - (d.t || 0) < 30 * 60e3 ? d : null;
    } catch (e) { return null; }
  }
  const dropDetour = () => { try { sessionStorage.removeItem(DETOUR_KEY); } catch (e) { /* private mode */ } };
  // a pill at the bottom, like «Вы остановились здесь»: one at a time
  let backPill = null;
  function wayBack(small, label, go, arrow) {
    $$('.resume-pill').forEach(x => x.remove());
    pill = null;
    const el = backPill = document.createElement('div');
    el.className = 'resume-pill back-pill';
    el.setAttribute('role', 'status');
    el.innerHTML = `<button type="button" class="resume-go">${icon(arrow)}<span><small>${small}</small><b>${esc(label)}</b></span></button><button type="button" class="resume-x" aria-label="Скрыть">${icon('close')}</button>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-shown'));
    const hide = () => {
      if (backPill !== el) return;
      backPill = null;
      el.classList.remove('is-shown');
      setTimeout(() => el.remove(), 400);
    };
    $('.resume-go', el).addEventListener('click', () => { hide(); go(); });
    $('.resume-x', el).addEventListener('click', hide);
    setTimeout(hide, 20000);
  }
  // a link to a place lower on this tab: back up to the link's sentence
  function offerBack(spot) {
    if (!spot) return;
    wayBack('Вернуться к тексту', spot.label || 'к ссылке', () => { userMoved = true; resumeTo(spot, smooth()); }, 'arrow-up');
  }
  // come here from the «Заглянуть» sheet of another chapter: back there, to the link
  function offerReturn(d) {
    wayBack('Вернуться', d.label || 'к тексту', () => { history.back(); }, 'chev-l');
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
    const det = readDetour();
    if (det && det.from === here && ENTRY.type === 'back_forward' && det.spot) {
      // back from the chapter «Открыть в главе» led to: at the link, as the reader left it
      dropDetour();
      setTimeout(() => { userMoved = true; resumeTo(det.spot); }, 60);
    } else if (ENTRY.resume) {
      try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* sandboxed */ }
      if (pos) setTimeout(() => { userMoved = true; resumeTo(pos); }, 60);
    } else if (ENTRY.top || !location.hash) {
      holdTop();
      offerResume(pos);
    }
    if (det && det.to === here && det.from !== here && ENTRY.type === 'navigate' && !det.shown) {
      saveDetour(Object.assign({}, det, { shown: true }));
      setTimeout(() => offerReturn(det), 400);
    }
    let t = 0;
    window.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(savePos, 400); }, { passive: true });
    window.addEventListener('pagehide', savePos);
    document.addEventListener('visibilitychange', () => { if (document.hidden) savePos(); });
    // Safari and Chrome keep whole pages in memory for Back: those also open at the top — in one jump (the page's
    // scroll is smooth, and a glide up from the middle stops where a finger touches it), and they stay there
    window.addEventListener('pageshow', e => {
      if (!e.persisted) return;
      userMoved = false;
      clearTimeout(t);
      const back = readDetour();
      if (back && back.from === here && back.spot) { dropDetour(); userMoved = true; resumeTo(back.spot); return; }
      jump(() => window.scrollTo(0, 0));
      holdTop();
      offerResume(readPos(here));
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

