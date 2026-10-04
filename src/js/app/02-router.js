  /* ================================================================== */
  /* ROUTER: chapters are views, long chapters have sub-panels           */
  /* ================================================================== */
  const views = new Map($$('[data-view]').map(v => [v.dataset.view, v]));
  const lastPanel = new Map();
  let currentView = null;

  let stickyPx = null;
  function stickyOffset() {
    if (stickyPx !== null) return stickyPx;
    const top = getComputedStyle(document.documentElement).getPropertyValue('--sticky-top');
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;height:${top || '0px'}`;
    document.body.appendChild(probe);
    stickyPx = probe.offsetHeight;
    probe.remove();
    return stickyPx;
  }
  window.addEventListener('resize', () => { stickyPx = null; });

  const homeView = () => views.get('glavnaya') || views.values().next().value;
  const ENTRY = (() => {
    let type = 'navigate', resume = false;
    try { type = (performance.getEntriesByType('navigation')[0] || {}).type || 'navigate'; } catch (e) { /* old browser */ }
    try { resume = new URLSearchParams(location.search).has('resume'); } catch (e) { /* old browser */ }
    // pages open at the top: the browser does not put you back where you were, «Продолжить» does
    return { type, resume, top: resume || type === 'reload' || type === 'back_forward' };
  })();
  function resolve(raw) {
    let hash = String(raw || '').replace(/^#/, '');
    try { hash = decodeURIComponent(hash); } catch (e) { /* malformed — use as is */ }
    // an old long tab id on its own page: switch to the short anchor
    if (hash && !document.getElementById(hash) && aliasOf(hash) !== hash && document.getElementById(aliasOf(hash))) {
      hash = aliasOf(hash);
      try { history.replaceState(null, '', '#' + hash); } catch (e) { /* sandboxed */ }
    }
    if (!hash || hash === 'top') return { view: homeView() };
    if (views.has(hash)) return { view: views.get(hash), home: true };
    const el = document.getElementById(hash);
    const view = el && el.closest('[data-view]');
    if (view) {
      const panel = el.matches('[data-panel]') ? el : el.closest('[data-panel]');
      return { view, panel, target: el === panel ? null : el };
    }
    // lives in another chapter (also rescues old «index.html#…» bookmarks)
    const u = urlFor(hash);
    if (!u.startsWith('#')) return { external: u };
    return { view: homeView() };
  }

  function activatePanel(view, panel, animate) {
    const panels = $$('[data-panel]', view);
    if (!panels.length) return;
    const remembered = lastPanel.get(view.dataset.view);
    const target = panel || (remembered && document.getElementById(remembered)) || panels[0];
    panels.forEach(p => {
      const on = p === target;
      if (on && !p.classList.contains('is-active') && animate && !reduceMotion.matches) {
        p.classList.add('is-entering');
        p.addEventListener('animationend', () => p.classList.remove('is-entering'), { once: true });
      }
      p.classList.toggle('is-active', on);
    });
    lastPanel.set(view.dataset.view, target.id);
    const nav = $('.subnav', view);
    if (nav) {
      $$('a', nav).forEach(a => {
        const on = a.getAttribute('href') === '#' + target.id;
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        if (on) nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: smooth() });
      });
    }
    document.dispatchEvent(new CustomEvent('basil:panel', { detail: { id: target.id } }));
    return target;
  }

  function updateChrome(view) {
    const id = view.dataset.view;
    $$('.tab-item[data-tab="home"]').forEach(a => a.classList.toggle('is-active', id === 'glavnaya'));
    $$('[data-garden-link]').forEach(a => { a.classList.toggle('is-active', id === 'moy'); if (id === 'moy') a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const ch = chapterById(id);
    let title = 'Гид по базилику';
    // «Мой базилик» is not a chapter: its title, but not a place to «continue reading» from
    if (id === 'moy') {
      const panel = document.getElementById(lastPanel.get(id) || '');
      title = 'Мой базилик' + (panel && panel.dataset.title && $$('[data-panel]', view).length > 1 ? ' · ' + panel.dataset.title : '') + ' — Гид по базилику';
    } else if (ch) {
      const panelId = lastPanel.get(id);
      const panel = panelId && document.getElementById(panelId);
      const sub = panel && panel.dataset.title;
      title = `${ch.title}${sub && $$('[data-panel]', view).length > 1 ? ' · ' + sub : ''} — Гид по базилику`;
      // a page inside the «Заглянуть» sheet is not where the reader is: «Продолжить» stays as it was
      if (!PEEK) store.set('basil-last', { view: id, panel: panelId || null, sub: sub && $$('[data-panel]', view).length > 1 ? sub : '' });
    }
    document.title = title;
  }

  // «auto» follows the page's smooth scroll-behavior (01-base.css): a jump on arrival has to say instant
  // itself, or the page glides down from the top and builds every model it passes on the way
  // the browser may read scroll-behavior from the style it had before: once the page runs, the change is applied
  // before the scroll (the first route, while the page starts, has no style from before — and is not made to
  // work out the whole page's style one more time)
  let routerReady = false;
  const jump = fn => {
    const html = document.documentElement, st = html.style, was = st.scrollBehavior;
    st.scrollBehavior = 'auto';
    if (routerReady) void getComputedStyle(html).scrollBehavior;
    try { fn(); } finally { st.scrollBehavior = was; }
  };
  function scrollAfter(r, changedView) {
    const behavior = changedView ? 'auto' : smooth();
    const go = fn => (changedView ? jump(fn) : fn());
    if (r.target) {
      const rc = r.target.closest('.recipe-card');
      if (rc && rc.hidden) { const all = $('.rb-filter [data-cat="all"]'); if (all) all.click(); }
      // the home page's «Базилик коротко» shows one part at a time: the one the link leads into (a rule from the search)
      const sp = r.target.closest('[data-short-pane]');
      if (sp && sp.hidden) showShort(sp.dataset.shortPane);
      let opened = false;
      for (let box = r.target.closest('details'); box; box = box.parentElement && box.parentElement.closest('details')) {
        if (!box.open) { box.open = true; opened = true; }
      }
      go(() => r.target.scrollIntoView({ block: 'start', behavior }));
      // models above the target mount lazily and push it down — land again once they settle
      if (opened) {
        const target = r.target;
        const USER = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
        let touched = false;
        const stop = () => { touched = true; };
        USER.forEach(ev => window.addEventListener(ev, stop, { once: true, passive: true }));
        setTimeout(() => {
          USER.forEach(ev => window.removeEventListener(ev, stop));
          const want = stickyOffset() + 64;
          if (!touched && Math.abs(target.getBoundingClientRect().top - want) > 48) target.scrollIntoView({ block: 'start', behavior: smooth() });
        }, 700);
      }
      return;
    }
    const wrap = $('.subnav-wrap', r.view);
    if (r.panel && wrap) {
      const top = wrap.getBoundingClientRect().top + window.scrollY - stickyOffset();
      if (changedView || window.scrollY > top) go(() => window.scrollTo({ top: Math.max(0, top), behavior }));
      return;
    }
    if (changedView) jump(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  }

  function route(hash, opts = {}) {
    const r = resolve(hash);
    if (r.external) {
      if (opts.initial) location.replace(r.external); else location.href = r.external;
      return;
    }
    // a sheet opened while the page was still starting stays open: the first route is not a navigation
    if (!opts.initial) $$('dialog.sheet[open]').forEach(d => closeSheet(d));
    const changedView = r.view !== currentView;
    const apply = () => {
      if (changedView) {
        views.forEach(v => v.classList.toggle('is-active', v === r.view));
        currentView = r.view;
      }
      const panel = activatePanel(r.view, r.panel, !changedView);
      if (!r.panel && panel && !changedView && !r.home) r.panel = panel;
      updateChrome(r.view);
      if (opts.top) jump(() => window.scrollTo(0, 0));
      else if (r.home && !changedView) window.scrollTo({ top: 0, behavior: smooth() }); // the chapter's own link: back to its top
      else scrollAfter(r, changedView);
      flashFound();
      if (PEEK) markPeek(r);
      document.dispatchEvent(new CustomEvent('basil:view', { detail: { id: r.view.dataset.view } }));
    };
    if (changedView && !opts.initial && document.startViewTransition && !reduceMotion.matches) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

  function navigate(hash, { replace = false } = {}) {
    const h = hash.startsWith('#') ? hash : '#' + hash;
    try {
      if (replace) history.replaceState(null, '', h); else history.pushState(null, '', h);
    } catch (e) { /* sandboxed history — still route */ }
    route(h);
  }

  function initRouter() {
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      let hash = a.getAttribute('href');
      if (hash === '#main') return;
      e.preventDefault();
      const u = urlFor(hash);
      if (!u.startsWith('#')) { location.href = u; return; }
      hash = u;
      const dlg = a.closest('dialog');
      if (dlg && dlg.open) closeSheet(dlg);
      navigate(hash, { replace: !!a.closest('.subnav') });
    });
    // Back closes the «Заглянуть» sheet first: the page under it stays as it was
    window.addEventListener('popstate', e => { if (!peekPop(e)) route(location.hash); });
    window.addEventListener('hashchange', () => route(location.hash));
    route(location.hash, { initial: true, top: ENTRY.top });
    routerReady = true;
  }

  /* pager + continue reading */
  function initPagers() {
    const list = B.CHAPTERS;
    $$('[data-view]').forEach(view => {
      const pager = $('.pager', view);
      if (!pager) return;
      const i = list.findIndex(c => c.id === view.dataset.view);
      const prev = list[i - 1];
      const next = list[i + 1];
      // hy: the title with soft hyphens, for a word too long for half a phone screen
      const art = c => `<svg class="pg-art" viewBox="0 0 120 120" aria-hidden="true"><use href="#${c.art}"/></svg>`;
      pager.innerHTML =
        (prev ? `<a class="prev" href="#${prev.id}">${art(prev)}<span><small>← Глава ${prev.num}</small><b>${nb(prev.hy || prev.title)}</b></span></a>` : `<a class="prev" href="#glavnaya">${icon('home')}<span><small>← Начало</small><b>Главная</b></span></a>`) +
        (next ? `<a class="next" href="#${next.id}"><span><small>Глава ${next.num} →</small><b>${nb(next.hy || next.title)}</b></span>${art(next)}</a>` : `<a class="next" href="#glavnaya"><span><small>Готово →</small><b>На главную</b></span>${icon('home')}</a>`);
    });

    // the end of each tab points to the next one; the chapter pager follows the last tab
    $$('[data-view]').forEach(view => {
      const panels = $$('[data-panel]', view);
      panels.forEach((p, i) => {
        const next = panels[i + 1];
        if (!next || $('.panel-next', p)) return;
        p.insertAdjacentHTML('beforeend', `<a class="panel-next" href="#${next.id}"><span><small>Дальше в главе</small><b>${esc(next.dataset.title || '')}</b></span>${icon('arrow-r')}</a>`);
      });
    });

    const cont = $('#continue');
    const showContinue = () => {
      const last = store.get('basil-last', null);
      const ch = last && chapterById(last.view);
      if (!cont || !ch) return;
      const panel = last.panel && document.getElementById(last.panel);
      const sub = panel ? (panel.dataset.title && $$('[data-panel]', views.get(ch.id)).length > 1 ? panel.dataset.title : '') : last.sub;
      // short tab anchors repeat between chapters, so the chapter comes from the saved view
      const pos = readPos(last.view);
      cont.href = panel ? '#' + last.panel : PAGES ? PAGES.files[last.view] + '?resume=1' + (last.panel ? '#' + aliasOf(last.panel) : '') : urlFor('#' + ch.id);
      $('#continue-title').textContent = ch.title + (pos && pos.label ? ` · «${pos.label}»` : sub ? ' · ' + sub : '');
      cont.hidden = false;
    };
    showContinue();
    document.addEventListener('basil:view', e => { if (e.detail.id === 'glavnaya') showContinue(); });
  }

  /* header: progress, sticky subnav state, back to top */
  function initScrollChrome() {
    const bar = $('#progress-bar');
    const toTop = $('#to-top');
    let ticking = false, lastY = window.scrollY, idle = 0;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (toTop) {
        // «Наверх» shows when the reader scrolls back up far from the top and hides while reading on,
        // so it does not sit on the text being read
        const y = window.scrollY, dy = y - lastY;
        if (y < window.innerHeight * 1.5 || dy > 4) { toTop.classList.remove('is-shown'); clearTimeout(idle); }
        else if (dy < -4) {
          toTop.classList.add('is-shown');
          clearTimeout(idle);
          idle = setTimeout(() => toTop.classList.remove('is-shown'), 3200);
        }
        lastY = y;
      }
      const wrap = currentView && $('.subnav-wrap', currentView);
      if (wrap) wrap.classList.toggle('is-stuck', wrap.getBoundingClientRect().top <= stickyOffset() + 1 && window.scrollY > 40);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    document.addEventListener('basil:view', () => requestAnimationFrame(update));
    requestAnimationFrame(update); // measure together with the first frame's layout, not in the middle of start-up
    if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: smooth() }));
  }

