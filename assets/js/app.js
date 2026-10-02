/* Гид по базилику — навигация и интерактив. Файл собирает scripts/build.py из src/js/app/ — правьте там */
(() => {
  'use strict';

  const B = window.BASIL;
  if (!B) return;

  /* ---------------- utils ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f1 = v => Math.round(v * 10) / 10;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    }
  };

  // number + short word → non-breaking space ("20 °C", "1 г/л", "3 пары")
  const nb = s => String(s).replace(/([\d¼½¾]) (?=[^\s\d–—-]{1,6}(?=[\s,.;:)!?/]|$))/g, '$1\u00a0').replace(/(\d)([–…])(?=[+−]?\d)/g, '$1$2\u2060').replace(/(^|[^а-яёa-z])([а-яё]{1,4}) (?=[+−≈~]?[\d¼½¾])/gi, '$1$2\u00a0').replace(/([а-яё²³])\/(?=[а-яё])/gi, '$1/\u2060').replace(/(\S) — /g, '$1\u00a0— ').replace(/(^|[^а-яёa-z\u00ad-])(в|с|к|у|о|а|и|я|во|со|ко|об|на|за|по|до|от|из|не|ни|но) (?=\S)/gi, '$1$2\u00a0');

  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };
  // one Intl formatter per precision: toLocaleString builds a new one on every call, which is slow
  const NF = {};
  const fmtNum = (v, digits = 1) => (NF[digits] || (NF[digits] = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: 0 }))).format(v);

  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  const fd = d => `${d.getDate()}\u00a0${MONTHS[d.getMonth()]}`;
  const fr = (a, b) => {
    if (!b || +a === +b) return fd(a);
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()}–${b.getDate()}\u00a0${MONTHS[a.getMonth()]}`;
    return `${fd(a)} – ${fd(b)}`;
  };
  const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromISO = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const dayDiff = (a, b) => Math.round((b - a) / 864e5);
  const icon = name => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const chapterById = id => B.CHAPTERS.find(c => c.id === id);
  const HAP = window.BasilHaptics || { tick() {}, select() {}, impact() {}, success() {}, supported: false };
  // pictures (data-ill) come from the chapter's model file: drawn when they near the screen, or at once (eager)
  const paintIll = (root, eager) => { if (window.BasilScience && window.BasilScience.paint) window.BasilScience.paint(root, eager); };

  /* ---------------- pages: every chapter is its own HTML file ---------------- */
  // BASIL_PAGES comes from scripts/build.py; without it (one-file build) all chapters share one page
  const PAGES = window.BASIL_PAGES || null;
  const here = (document.querySelector('[data-view]') || { dataset: {} }).dataset.view || 'glavnaya';
  const pageOf = id => {
    if (!PAGES || !id) return null;
    if (PAGES.files[id]) return id;
    if (PAGES.ids[id]) return PAGES.ids[id];
    for (const pre in PAGES.prefixes) if (id.startsWith(pre)) return PAGES.prefixes[pre];
    return null;
  };
  // tabs have short anchors (#план); data and old bookmarks use the long ids (#udobreniya-plan)
  const aliasOf = id => (PAGES && PAGES.alias && PAGES.alias[id]) || id;
  // «#id» → the address that really shows it: same page keeps the hash, another chapter gets «page#id»
  const urlFor = hash => {
    let id = String(hash || '').replace(/^#/, '');
    try { id = decodeURIComponent(id); } catch (e) { /* already plain */ }
    if (!PAGES || !id || id === 'main' || id === 'top' || id === here || document.getElementById(id)) return '#' + id;
    const pg = pageOf(id);
    if (!pg || pg === here) return '#' + aliasOf(id);
    if (PAGES.files[id]) return PAGES.files[id];
    return PAGES.files[pg] + '#' + aliasOf(id);
  };
  function fixLinks(root) {
    if (!PAGES || !root || !root.querySelectorAll) return;
    const list = root.matches && root.matches('a[href^="#"]') ? [root] : [];
    root.querySelectorAll('a[href^="#"]').forEach(a => list.push(a));
    list.forEach(a => {
      const h = a.getAttribute('href');
      const u = urlFor(h);
      if (u !== h) a.setAttribute('href', u);
    });
  }
  const smooth = () => (reduceMotion.matches ? 'auto' : 'smooth');

  let toastTimer = 0;
  function toast(text) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Скопировано');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      toast(ok ? 'Скопировано' : 'Не удалось скопировать — выделите текст вручную');
    }
  }

  /* ================================================================== */
  /* THEME                                                               */
  /* ================================================================== */
  function initTheme() {
    const root = document.documentElement;
    const btn = $('#theme-toggle');
    if (!root.lang) root.lang = 'ru';
    const saved = store.get('basil-theme', null);
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = () => root.getAttribute('data-theme') === 'dark' || (root.getAttribute('data-theme') !== 'light' && mq.matches);
    const sync = () => {
      const d = isDark();
      if (btn) {
        btn.setAttribute('aria-label', d ? 'Включить светлую тему' : 'Включить тёмную тему');
        btn.querySelector('use').setAttribute('href', d ? '#i-sun' : '#i-moon');
      }
      document.dispatchEvent(new CustomEvent('basil:theme'));
    };
    if (btn) btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('basil-theme', next);
    });
    if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    sync();
  }

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
    try { hash = decodeURIComponent(hash); } catch (e) { /* malformed — use as is */ }
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
    $$('#nav a').forEach(a => {
      const on = (a.dataset.nav || a.getAttribute('href').replace(/^#/, '')) === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
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
      store.set('basil-last', { view: id, panel: panelId || null, sub: sub && $$('[data-panel]', view).length > 1 ? sub : '' });
    }
    document.title = title;
  }

  // «auto» follows the page's smooth scroll-behavior (01-base.css): a jump on arrival has to say instant
  // itself, or the page glides down from the top and builds every model it passes on the way
  const jump = fn => {
    const st = document.documentElement.style, was = st.scrollBehavior;
    st.scrollBehavior = 'auto';
    try { fn(); } finally { st.scrollBehavior = was; }
  };
  function scrollAfter(r, changedView) {
    const behavior = changedView ? 'auto' : smooth();
    const go = fn => (changedView ? jump(fn) : fn());
    if (r.target) {
      const rc = r.target.closest('.recipe-card');
      if (rc && rc.hidden) { const all = $('.rb-filter [data-cat="all"]'); if (all) all.click(); }
      let opened = false;
      for (let box = r.target.closest('details'); box; box = box.parentElement && box.parentElement.closest('details')) {
        if (!box.open) { box.open = true; opened = true; }
      }
      go(() => r.target.scrollIntoView({ block: 'start', behavior }));
      // models above the target mount lazily and push it down — land again once they settle
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
    } catch (e) { /* sandboxed history — still route */ }
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
    window.addEventListener('popstate', () => route(location.hash));
    window.addEventListener('hashchange', () => route(location.hash));
    route(location.hash, { initial: true, top: ENTRY.top });
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

  /* ================================================================== */
  /* SHEETS                                                              */
  /* ================================================================== */
  // below this width a sheet is a bottom sheet that follows the finger (21-sheets.css)
  const phoneSheets = window.matchMedia('(max-width: 1279px)');
  function openSheet(id) {
    const d = document.getElementById(id);
    if (!d) return;
    // opened again while it was still leaving
    if (d.classList.contains('is-closing')) { clearTimeout(d._closing); d.classList.remove('is-closing'); }
    if (!d.open) {
      if (id === 'sheet-search') fitSearchPanel();
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    }
    if (id === 'sheet-chapters') {
      $$('.sheet-link', d).forEach(l => l.classList.toggle('is-current', currentView && l.getAttribute('href') === '#' + currentView.dataset.view));
      const cur = $('.sheet-link.is-current', d);
      const panels = currentView ? $$('[data-panel]', currentView) : [];
      $$('.sheet-tabs', d).forEach(x => x.remove());
      if (cur && panels.length > 1) {
        const active = $('[data-panel].is-active', currentView);
        cur.insertAdjacentHTML('afterend', `<nav class="sheet-tabs chips-row" aria-label="Разделы этой главы">${panels.map(p => { const t = $(`.subnav a[href="#${p.id}"]`, currentView); return `<a class="chip" href="#${p.id}"${p === active ? ' aria-current="true"' : ''}>${esc(t ? t.textContent.trim() : p.dataset.title || '')}</a>`; }).join('')}</nav>`);
      }
    }
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
  // the sheet leaves first (down on a phone, fading on a computer), then the dialog closes; now — at once
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
  // when the list is at its very top and the finger goes down — otherwise the list scrolls as usual.
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
      if (!phoneSheets.matches || e.touches.length !== 1 || d.classList.contains('is-closing')) return;
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

  function initSheets() {
    const chList = $('#sheet-chapters-list');
    if (chList) {
      chList.innerHTML = `<a class="sheet-link" href="#glavnaya"><span class="sl-art">${icon('home')}</span><span><b>Главная</b><small>С чего начать, путь базилика, правила.</small></span>${icon('chev-r')}</a>` +
        B.CHAPTERS.map(c => `<a class="sheet-link" href="#${c.id}"><span class="sl-art"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#${c.art}"/></svg></span><span><b>${c.num}. ${c.title}</b><small>${c.desc}</small></span>${icon('chev-r')}</a>`).join('');
    }
    const tList = $('#sheet-tools-list');
    if (tList) {
      tList.innerHTML = B.TOOLS.map(t => `<a class="sheet-link" href="#${t.hash}"><span class="sl-art">${icon(t.icon)}</span><span><b>${t.title}</b><small>${t.desc}</small></span>${icon('chev-r')}</a>`).join('');
    }
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
  /* ================================================================== */
  /* SEARCH: words — stems, the keyboard layout, typos, synonyms         */
  /* ================================================================== */
  const norm = s => String(s).toLowerCase().replace(/ё/g, 'е');
  // a letter or a digit of a word (after norm)
  const isWordChar = c => (c >= 'а' && c <= 'я') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9');

  // Snowball's Russian stemmer, made careful for search: an ending comes off only when a stem of three
  // letters or more is left — four for the gerund rule, or «полив» would turn into «пол»
  const stemRu = (() => {
    const PERF = /(?:([ая])(?:вшись|вши|в)|ившись|ывшись|ивши|ывши|ив|ыв)$/;
    const REFL = /(?:ся|сь)$/;
    const ADJ = /(?:ими|ыми|его|ого|ему|ому|ее|ие|ые|ое|ей|ий|ый|ой|ем|им|ым|ом|их|ых|ую|юю|ая|яя|ою|ею)$/;
    const PART = /(?:([ая])(?:ем|нн|вш|ющ|щ)|ивш|ывш|ующ)$/;
    const VERB = /(?:([ая])(?:ла|на|ете|йте|ли|й|л|ем|н|ло|но|ет|ют|ны|ть|ешь|нно)|ила|ыла|ена|ейте|уйте|ите|или|ыли|ей|уй|ил|ыл|им|ым|ен|ило|ыло|ено|ят|ует|уют|ит|ыт|ены|ить|ыть|ишь|ую|ю)$/;
    const NOUN = /(?:иями|ями|ами|ией|иям|ием|иях|ев|ов|ие|ье|еи|ии|ей|ой|ий|ям|ем|ам|ом|ах|ях|ию|ью|ия|ья|а|е|и|й|о|у|ы|ь|ю|я)$/;
    return w => {
      const v = /[аеиоуыэюя]/.exec(w);
      if (!v) return w;
      // the endings are looked for after the first vowel; «а» or «я» before some of them stays
      const pre = w.slice(0, v.index + 1);
      const cut = (rv, re, min) => {
        const r = rv.replace(re, (m, g) => (typeof g === 'string' ? g : ''));
        return r !== rv && pre.length + r.length >= min ? r : null;
      };
      let rv = w.slice(v.index + 1), r;
      if ((r = cut(rv, PERF, 4)) !== null) rv = r;
      else {
        if ((r = cut(rv, REFL, 3)) !== null) rv = r;
        if ((r = cut(rv, ADJ, 3)) !== null) { const p = cut(r, PART, 3); rv = p !== null ? p : r; }
        else if ((r = cut(rv, VERB, 3)) !== null) rv = r;
        else if ((r = cut(rv, NOUN, 3)) !== null) rv = r;
      }
      let out = pre + rv;
      if (out.length > 3 && out.endsWith('и')) out = out.slice(0, -1);
      if (/нн$/.test(out)) out = out.slice(0, -1);
      else if (/ейше?$/.test(out) && out.length > 6) out = out.replace(/ейше?$/, '').replace(/нн$/, 'н');
      else if (out.length > 3 && out.endsWith('ь')) out = out.slice(0, -1);
      return out;
    };
  })();

  // what a query word is looked for as: the stem, cut a little further for search — the verb endings
  // Snowball leaves («желтеют» → «желт»), the vowel before a verb ending («поливать» → «полив»),
  // and for «горшок», «черенок» also the stem without the fleeting vowel («горшк-», «черенк-»)
  // words that do not change (or must not be cut: «песто» is not «пёстрый»)
  const AS_IS = new Set(['песто', 'писту', 'капрезе', 'пюре', 'кешью', 'тофу', 'соте', 'фондю', 'кофе', 'какао', 'бенто']);
  function keysOf(w) {
    if (!/[а-я]/.test(w) || AS_IS.has(w)) return [w]; // Latin names and numbers: as typed
    let s = stemRu(w);
    const r = s.replace(/[еая]?(?:ют|ут|ет|ит|ят)$/, '');
    if (r !== s && r.length >= 4) s = r;
    if (/[аяе]$/.test(s) && s.length >= 5) s = s.slice(0, -1);
    if (/ост$/.test(s) && s.length >= 7) s = s.slice(0, -3); // «влажност» → «влажн»
    const keys = [s];
    const m = /^(.{2,}[^аеиоуыэюя])[ое]([кцн])$/.exec(s);
    if (m) keys.push(m[1] + m[2]);
    return keys;
  }

  // the Latin keyboard typed in Russian: «gjkbd» → «полив»
  const LAYOUT_EN = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`', LAYOUT_RU = 'йцукенгшщзхъфывапролджэячсмитьбюе';
  const fromLayout = s => s.replace(/[a-z[\];',.`]/g, c => LAYOUT_RU[LAYOUT_EN.indexOf(c)]);
  const latinTyped = w => /^[a-z[\];',.`]+$/.test(w);

  // a few words people use for the same thing; «forms» are the forms of one word the stem cannot join
  const SYNONYMS = [
    { forms: true, words: ['тля', 'тли', 'тлю', 'тлей'] },
    { forms: true, words: ['семя', 'семена', 'семян', 'семенам'] },
    { words: ['подкормка', 'удобрение', 'удобрять', 'подкормить', 'подкармливать'] },
    { words: ['лампа', 'досветка', 'фитолампа', 'подсветка', 'светильник'] },
    { words: ['вредители', 'вредитель', 'насекомые'] },
    { words: ['вянет', 'вянут', 'увядание', 'увядает', 'вялые', 'поникли'] },
    { words: ['мошки', 'мушки', 'мошкара', 'сциариды'] },
    { words: ['сушка', 'сушить', 'высушить', 'сушеный'] },
    { words: ['цветет', 'цветение', 'цветонос', 'бутоны', 'соцветие'] },
    { words: ['желтеют', 'желтые', 'пожелтение', 'желтизна', 'хлороз'] },
    { words: ['пересадка', 'пересадить', 'пересаживать'] },
    { words: ['полив', 'поливать', 'полейте'] },
    { words: ['посев', 'сеять', 'посеять'] },
    { words: ['черенки', 'черенкование', 'укоренение', 'укоренить'] },
    { words: ['прищипывание', 'прищипнуть', 'прищипка', 'обрезка', 'формировка'] },
    { words: ['заморозка', 'заморозить', 'морозилка', 'замораживать'] },
    { words: ['гниль', 'гниет', 'гниют', 'загнивание', 'гнилые'] },
    { words: ['плесень', 'налет'] },
    { words: ['рассада', 'сеянцы', 'всходы', 'проростки'] },
    { words: ['кислый', 'кислотность', 'ph'] },
    { words: ['горшок', 'кашпо', 'контейнер', 'емкость'] },
    { words: ['грунт', 'почва', 'субстрат'] }
  ].map(g => Object.assign(g, { keys: [...new Set([].concat(...g.words.map(w => keysOf(norm(w)))))].filter(k => g.forms || k.length >= 4) }));
  const sameKey = (a, b) => a === b || (a.length >= 4 && b.startsWith(a)) || (b.length >= 4 && a.startsWith(b));
  // what a query word may be found as: its own keys (weight 1), its synonyms' keys (weight 0.7)
  function altsOf(w) {
    const own = keysOf(w);
    const alts = own.map(k => ({ k, wt: 1 }));
    SYNONYMS.forEach(g => {
      if (!g.keys.some(gk => own.some(k => sameKey(k, gk)))) return;
      g.keys.forEach(gk => { if (!alts.some(a => a.k === gk)) alts.push({ k: gk, wt: g.forms ? 1 : 0.7 }); });
    });
    return alts;
  }

  // optimal string alignment distance (a swap of two neighbours is one step), given up past max
  function editDistance(a, b, max) {
    const n = b.length;
    let p2 = null, p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const c = [i];
      let low = i;
      for (let j = 1; j <= n; j++) {
        let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        c[j] = v;
        if (v < low) low = v;
      }
      if (low > max) return max + 1;
      p2 = p;
      p = c;
    }
    return p[n];
  }
  // the guide's word closest to one it does not have: a letter off, two for long words; the more
  // frequent wins a tie
  function nearestWord(w, vocab) {
    const max = w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0;
    if (!max) return null;
    let best = null, bd = max + 1, bn = 0;
    vocab.forEach((cnt, v) => {
      if (Math.abs(v.length - w.length) > max) return;
      const d = editDistance(w, v, max);
      if (d < bd || (d === bd && cnt > bn)) { best = v; bd = d; bn = cnt; }
    });
    return best;
  }
  /* ================================================================== */
  /* SEARCH                                                              */
  /* ================================================================== */
  const textOf = el => {
    const parts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
    return parts.join(' ').replace(/\s+/g, ' ').replace(/\s([.,;:!?)»])/g, '$1').trim();
  };
  let searchIndex = [];
  // results come in groups; equally good groups keep this order
  const SEARCH_GROUPS = [['sec', 'Разделы'], ['prob', 'Проблемы и симптомы'], ['var', 'Сорта'], ['el', 'Питание'], ['rec', 'Рецепты'], ['word', 'Словарь и вкус']];

  /* the one-file book has no index file: the page indexes itself by the rules of scripts/build.py */
  const SEARCH_SKIP = '#chapters, #quick, #tools-home, #journey, .diag-result, .el-detail, #variety-detail, .quiz, .plan-list, .timeline, .dose-out, .npk-out, .soil-out, .dli-out, .stage-body, .pager, .sim, #glossary, #disease-grid, #pest-grid, #diag-groups, #place-panel, #check-groups, .lab-tool, .deep-index, .recipe-book, .deep-src';
  const SEARCH_BOX = 'details, .card, .step, .pane, article, .rule, li';
  // what a heading titles: its box when it is the box's first heading, else itself and what follows it
  // up to the next heading
  function sectionOf(h) {
    const box = h.closest(SEARCH_BOX);
    if (box && box.querySelector('h3, h4, summary') === h) return [box];
    const out = [h];
    for (let n = h.nextSibling; n; n = n.nextSibling) {
      if (n.nodeType === 1 && (n.matches('h3, h4, summary') || n.querySelector('h3, h4, summary'))) break;
      out.push(n);
    }
    return out;
  }
  // the text of some nodes without the parts other entries own: every piece of text is indexed once
  function ownText(nodes, owned) {
    const parts = [];
    const walk = n => {
      if (n.nodeType === 3) { parts.push(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      for (let c = n.firstChild; c; c = c.nextSibling) if (!owned.has(c)) walk(c);
    };
    nodes.forEach(walk);
    return parts.join(' ').replace(/\s+/g, ' ').replace(/\s([.,;:!?)»])/g, '$1').trim();
  }
  function indexPage(add) {
    const list = []; // [entry, the nodes that hold its text, a node read first]
    let n = 0;
    $$('[data-view]').forEach(view => {
      const ch = chapterById(view.dataset.view);
      $$('[data-panel]', view).forEach(p => list.push([{ title: p.dataset.title || '', sub: ch ? ch.title : '', hash: p.id, icon: 'list' }, [p]]));
      $$('h3, h4, summary', view).forEach(h => {
        if (h.closest(SEARCH_SKIP)) return;
        const panel = h.closest('[data-panel]');
        const where = (ch ? ch.title : 'Главная') + (panel && panel.dataset.title ? ' · ' + panel.dataset.title : '');
        const parent = h.parentElement;
        if (h.tagName === 'SUMMARY' && parent.classList.contains('deeper')) {
          const host = h.closest('details.deep');
          if (!h.id) h.id = host ? host.id + '-glubzhe' : 's-' + (++n);
          const t = $('.deeper-t', h);
          list.push([{ title: (t || h).textContent.trim(), sub: 'Ещё глубже · ' + (host ? host.dataset.short : where), hash: h.id, icon: 'hex' }, [h.nextElementSibling]]);
          return;
        }
        if (h.tagName === 'SUMMARY' && parent.classList.contains('deep')) {
          const t = $('.deep-title', h);
          list.push([{ title: (t || h).textContent.trim(), sub: 'Глубже · ' + where, hash: parent.id, icon: 'hex' }, [$('.deep-body', parent)], $('.deep-sub', h)]);
          return;
        }
        if (!h.id) h.id = 's-' + (++n);
        const deep = h.closest('.deep');
        list.push([{ title: h.textContent.trim(), sub: where + (deep ? ' · Глубже' + (deep.dataset.short ? ': ' + deep.dataset.short : '') : ''), hash: h.id, icon: h.tagName === 'SUMMARY' ? 'info' : 'leaf' }, sectionOf(h), null, h]);
      });
    });
    const owned = new Set();
    list.forEach(([, nodes]) => nodes.forEach(x => { if (x) owned.add(x); }));
    list.forEach(([e, nodes, extra, head]) => {
      const mine = nodes.filter(Boolean);
      mine.forEach(x => owned.delete(x));
      // the heading itself is the entry's title, not its text
      if (head) owned.add(head);
      e.text = ((extra ? textOf(extra) + ' ' : '') + ownText(mine.filter(x => x !== head), owned)).trim();
      if (head) owned.delete(head);
      mine.forEach(x => owned.add(x));
      add(e);
    });
  }

  // pieces of text into one: a full stop only where a piece has none of its own
  const sentences = parts => parts.filter(Boolean).map(t => String(t).trim()).map(t => (/[.!?…]$/.test(t) ? t : t + '.')).join(' ');
  let searchVocab = null;
  function buildSearchIndex() {
    const idx = [];
    const add = e => { e.kind = e.kind || 'sec'; e.nt = norm(e.title); e.nw = e.nt.replace(/[^a-zа-я0-9]+/g, ' ').trim(); e.nx = norm(e.text || ''); idx.push(e); };
    B.CHAPTERS.forEach(c => add({ title: c.title, sub: `Глава ${c.num}`, text: c.desc, hash: c.id, icon: 'book' }));
    B.TOOLS.forEach(t => add({ title: t.title, sub: 'Инструмент', text: t.desc, hash: t.hash, icon: t.icon }));
    // the whole text of every chapter, indexed at build time (assets/js/search-index.js)
    if (window.BASIL_SEARCH) window.BASIL_SEARCH.forEach(e => add(Object.assign({}, e)));
    else indexPage(add);
    B.DIAG.forEach(g => g.items.forEach(it => add({ kind: 'prob', title: it.title, sub: 'Проблемы · Диагностика · ' + g.group, text: it.causes.map(c => `${c.name}. ${c.check} ${c.fix}`).join(' '), hash: 'problemy-diagnostika', icon: 'bug', act: 'sym:' + it.id, after: () => selectSymptom(it.id, true) })));
    B.DISEASES.forEach((d, i) => add({ kind: 'prob', title: d.name, sub: 'Проблемы · Болезни', text: sentences([d.latin, d.sign, d.fix, d.prevent]), hash: 'dis-' + i, icon: 'alert' }));
    B.PESTS.forEach((d, i) => add({ kind: 'prob', title: d.name, sub: 'Проблемы · Вредители', text: sentences([d.latin, d.sign, d.fix, d.prevent]), hash: 'pest-' + i, icon: 'bug' }));
    B.VARIETIES.forEach((v, i) => {
      const type = (B.VARIETY_TYPES || []).find(t => t.id === v.type);
      add({ kind: 'var', title: `Сорт «${v.name}»`, sub: 'Сорта · ' + (type ? type.name : 'Каталог'), text: `${v.latin}. Аромат: ${v.aroma}. ${v.desc} Для чего: ${v.use}. ${v.care} ${(v.labels || []).join(', ')}`, hash: 'sorta-katalog', icon: 'seed', act: 'var:' + i, after: () => openVariety(i) });
    });
    B.ELEMENTS.forEach((e, i) => add({ kind: 'el', title: `${e.name} (${e.sym})`, sub: 'Удобрения · Элементы', text: [e.role, 'Нехватка: ' + e.def, e.exc && 'Избыток: ' + e.exc, e.mineral && 'Чем дать: ' + e.mineral, e.organic, e.when].filter(Boolean).join(' '), hash: 'udobreniya-elementy', icon: 'flask', act: 'el:' + i, after: () => selectElement(i, true) }));
    if (B.RECIPES) {
      const catName = Object.fromEntries(B.RECIPE_CATS.map(([id, name, ic]) => [id, [name, ic]]));
      B.RECIPES.forEach(r => add({ kind: 'rec', title: r.title, sub: 'Рецепты · ' + catName[r.cat][0], text: sentences([r.orig, r.basil && 'Базилик: ' + r.basil, r.ing.map(x => x[0]).join(', ')].concat(r.steps || [], [r.sci && r.sci[0], r.tip])), hash: 'r-' + r.id, icon: catName[r.cat][1] }));
    }
    B.GLOSSARY.forEach(([t, d], i) => add({ kind: 'word', title: t, sub: 'Справка · Словарь', text: d, hash: 'g-' + i, icon: 'book' }));
    if (window.BasilScience) {
      Object.values(window.BasilScience.MOLS).forEach(m => add({ kind: 'word', title: m.name + (m.alt ? ` (${m.alt})` : ''), sub: 'Вкус · Молекулы аромата', text: `${m.cls}. Запах: ${m.smell}. Есть в: ${m.where}. Сорта: ${m.basil}. ${m.note}`, hash: 'vkus-molekuly', icon: 'hex' }));
      window.BasilScience.PAIRS.forEach(pr => add({ kind: 'word', title: `Базилик и ${pr.name.toLowerCase()}`, sub: 'Вкус · Сочетания', text: pr.why + ' ' + pr.dish, hash: 'vkus-sochetaniya', icon: 'nose' }));
    }
    idx.forEach(e => { if (!e.page) e.page = pageOf(e.hash) || here; });
    searchIndex = idx;
    searchVocab = null;
  }
  const entryUrl = e => {
    if (!PAGES || e.page === here) return '#' + aliasOf(e.hash);
    return PAGES.files[e.page] + (e.act ? '?do=' + encodeURIComponent(e.act) : '') + (PAGES.files[e.hash] ? '' : '#' + aliasOf(e.hash));
  };
  // the index of all chapters is a separate file: fetched the first time search opens
  let searchReady = null;
  function loadSearch() {
    if (searchReady) return searchReady;
    searchReady = new Promise(resolve => {
      if (!PAGES || window.BASIL_SEARCH) { resolve(); return; }
      const self = $('script[src*="/app.js"]');
      const tag = document.createElement('script');
      const v = PAGES && PAGES.v ? '?v=' + PAGES.v.search : '';
      tag.src = (self ? self.getAttribute('src').replace(/app\.js(\?.*)?$/, 'search-index.js') : 'assets/js/search-index.js') + v;
      tag.onload = tag.onerror = () => resolve();
      document.head.appendChild(tag);
    }).then(() => { buildSearchIndex(); document.dispatchEvent(new CustomEvent('basil:search-ready')); });
    return searchReady;
  }

  /* ---------------- matching ---------------- */
  // little words and the words of a question («как часто поливать» is about «поливать»)
  const SEARCH_STOP = new Set(('и в во не на с со по к ко у о об от до за из для при как что это а но ли же бы или то его ее их все уже так там где когда чем если без над под про через мне меня можно нужно надо ' +
    'часто сколько почему зачем какой какая какое какие каким нужен нужна нужны лучше правильно раз чтобы есть быть делать сделать мой моя мои свой свои очень этот эта эти').split(' '));
  // the query → its words with what each may be found as; stop words drop out unless nothing else is left.
  // The last word is still being typed unless a space follows it
  function parseQuery(q, typing) {
    const all = q.split(/[^a-zа-я0-9]+/).filter(Boolean);
    let words = all.filter(w => !SEARCH_STOP.has(w) && (w.length > 1 || /\d/.test(w)));
    if (!words.length) words = all;
    return words.map((w, i) => ({ w, typing: typing && i === words.length - 1 && w === all[all.length - 1], alts: altsOf(w) }));
  }
  // where a key stands in a text: a word that starts with it and ends soon after (an ending) is the best
  // place; a longer word is weaker («черенкование» for «черенок»), the middle of a word weaker still
  // («фитолампа» for «лампа»)
  function scanKey(hay, key, typing) {
    const mid = key.length >= 5 && /[а-я]/.test(key);
    let i = hay.indexOf(key), best = 0, at = -1, n = 0;
    while (i >= 0) {
      const start = i === 0 || !isWordChar(hay[i - 1]);
      if (start || mid) {
        let e = i + key.length;
        while (e < hay.length && isWordChar(hay[e])) e++;
        const tail = e - i - key.length;
        // a short stem takes a short ending only: «сея-ть», not «сея-нцы»
        let q = tail <= (key.length > 3 ? 3 : 2) ? 1 : tail <= 5 ? 0.55 : 0.3;
        if (typing && start) q = Math.max(q, 0.8); // the word being typed: any word it begins counts
        if (!start) q *= 0.45;
        n++;
        if (q > best) { best = q; at = i; }
        if (n >= 8 && best === 1) break;
      }
      i = hay.indexOf(key, i + 1);
    }
    return { q: best, at, n };
  }
  // the title counts most, then the text; the whole phrase above separate words, words close together
  // above words far apart; a whole tab gives way to the section that holds the words
  function scoreEntry(e, words, phrase) {
    let s = 0, hits = 0, mask = 0, inTitle = 0;
    const where = [];
    words.forEach((wd, wi) => {
      let t = 0, x = 0, cnt = 0, at = -1;
      wd.alts.forEach(a => {
        const st = scanKey(e.nt, a.k, wd.typing);
        if (st.q * a.wt > t) t = st.q * a.wt;
        const sx = scanKey(e.nx, a.k, wd.typing);
        if (sx.q * a.wt > x) { x = sx.q * a.wt; at = sx.at; }
        cnt += sx.n;
      });
      if (!t && !x) return;
      hits++;
      if (t) inTitle++;
      mask |= 1 << wi;
      s += t * 10 + x * 2.5 + Math.min(cnt, 6) * 0.35;
      if (at >= 0) where.push(at);
    });
    if (!hits) return null;
    if (words.length > 1 && phrase) { if (e.nt.includes(phrase)) s += 8; else if (e.nx.includes(phrase)) s += 4; }
    if (where.length > 1 && Math.max(...where) - Math.min(...where) < 90) s += 2.5;
    // a name typed in full leads to that very place («план подкормок» — the tab, not a heading inside it)
    if ((phrase && e.nt === phrase) || (searchWhole && e.nw === searchWhole)) s += 12;
    else {
      if (phrase && e.nt.startsWith(phrase)) s += 3;
      if (e.icon === 'list') s -= 1.5;
    }
    // the title has every word: the text is shown from its start, otherwise from the first word found
    return { e, s, hits, mask, at: inTitle === words.length || !where.length ? -1 : Math.min(...where) };
  }
  function matchAll(words, phrase) {
    let res = [];
    let cover = 0;
    searchIndex.forEach(e => { const r = scoreEntry(e, words, phrase); if (r) { res.push(r); cover |= r.mask; } });
    // two results that lead to the same place (a tool and its tab): the better one stays
    const seen = new Set();
    res = res.sort((a, b) => b.s - a.s).filter(r => { const k = r.e.page + '#' + r.e.hash + '|' + (r.e.act || ''); if (seen.has(k)) return false; seen.add(k); return true; });
    const full = res.filter(r => r.hits === words.length);
    return { full, res, cover };
  }
  function vocabulary() {
    if (searchVocab) return searchVocab;
    searchVocab = new Map();
    searchIndex.forEach(e => (e.nt + ' ' + e.nx).split(/[^a-zа-я0-9]+/).forEach(w => { if (w.length >= 3) searchVocab.set(w, (searchVocab.get(w) || 0) + 1); }));
    return searchVocab;
  }
  // the results for what was typed; when nothing has all the words: the Latin keyboard, typos fixed,
  // and failing that the places that have some of the words
  // the query word for word, little words included: «мой базилик» is the name of a place
  let searchWhole = '';
  function runSearch(raw, exact) {
    const q = norm(raw).replace(/\s+/g, ' ').trim();
    searchWhole = q.replace(/[^a-zа-я0-9]+/g, ' ').trim();
    const typing = !/\s$/.test(raw);
    const words = parseQuery(q, typing);
    const phraseOf = ws => ws.map(x => x.w).join(' ');
    if (!words.length) return { list: [], words };
    let r = matchAll(words, phraseOf(words));
    if (r.full.length || exact) return { list: r.full, words };
    if (/[a-z]/.test(q) && !/[а-я]/.test(q)) {
      const q2 = fromLayout(q), w2 = parseQuery(q2, typing);
      const r2 = w2.length ? matchAll(w2, phraseOf(w2)) : null;
      if (r2 && r2.full.length) return { list: r2.full, words: w2, fixed: q2 };
    }
    if (words.some((wd, i) => !(r.cover & (1 << i)))) {
      const vocab = vocabulary();
      let changed = false;
      const w3 = words.map((wd, i) => {
        if (r.cover & (1 << i)) return wd;
        const nw = nearestWord(wd.w, vocab);
        if (!nw || nw === wd.w) return wd;
        changed = true;
        return { w: nw, typing: false, alts: altsOf(nw) };
      });
      if (changed) {
        const r3 = matchAll(w3, phraseOf(w3));
        if (r3.full.length) return { list: r3.full, words: w3, fixed: phraseOf(w3) };
        r = r3.res.length ? r3 : r;
      }
    }
    if (words.length > 1 && r.res.length) return { list: r.res.sort((a, b) => b.hits - a.hits || b.s - a.s), words, some: true };
    return { list: [], words };
  }

  /* ---------------- showing ---------------- */
  // every word of the text that a key of the query begins (or holds, for longer keys) is marked
  function highlight(text, keys) {
    const t = String(text);
    let out = '', last = 0;
    t.replace(/[A-Za-zА-Яа-яЁё0-9]+/g, (tok, i) => {
      const n = norm(tok);
      if (keys.some(k => n.startsWith(k) || (k.length >= 5 && /[а-я]/.test(k) && n.includes(k)))) {
        out += esc(t.slice(last, i)) + '<mark>' + esc(tok) + '</mark>';
        last = i + tok.length;
      }
      return tok;
    });
    return out + esc(t.slice(last));
  }
  // a piece of the text around the first word found
  function snippet(text, at) {
    const t = String(text);
    if (t.length <= 160) return t;
    if (at < 0) return t.slice(0, 150).replace(/\s+\S*$/, '') + '…';
    let a = Math.max(0, at - 50);
    if (a > 0) { const sp = t.lastIndexOf(' ', a); if (sp > at - 90) a = sp + 1; }
    let b = Math.min(t.length, a + 160);
    if (b < t.length) { const sp = t.indexOf(' ', b); if (sp > 0 && sp < b + 24) b = sp; }
    return (a > 0 ? '…' : '') + t.slice(a, b) + (b < t.length ? '…' : '');
  }

  // the place a result leads to lights up for a moment once the page stands there (another page too)
  const FOUND_KEY = 'basil-found';
  function markFound(e) {
    if (e.act) return;
    try { sessionStorage.setItem(FOUND_KEY, JSON.stringify({ id: aliasOf(e.hash), t: Date.now() })); } catch (err) { /* private mode */ }
  }
  function flashFound() {
    let f = null;
    try { f = JSON.parse(sessionStorage.getItem(FOUND_KEY) || 'null'); sessionStorage.removeItem(FOUND_KEY); } catch (err) { return; }
    if (!f || Date.now() - f.t > 20000) return;
    const el = document.getElementById(f.id);
    if (!el || el.matches('[data-panel], [data-view]')) return;
    // a heading lights up with what it titles: its card, or itself when it heads a part of a longer text
    let box = el;
    if (el.matches('h3, h4, summary')) { const sec = sectionOf(el); box = sec.length === 1 && sec[0] !== el ? sec[0] : el; }
    setTimeout(() => {
      box.classList.remove('is-found');
      void box.offsetWidth;
      box.classList.add('is-found');
      setTimeout(() => box.classList.remove('is-found'), 2600);
    }, reduceMotion.matches ? 50 : 450);
  }

  // a phone: the panel stands where the visible area is — under the status bar, down to the keyboard,
  // and it stays there when the keyboard opens or the page under it would move
  const searchVV = window.visualViewport;
  function fitSearchPanel() {
    const d = $('#sheet-search');
    if (!d || !searchVV) return;
    d.style.setProperty('--vv-top', Math.round(searchVV.offsetTop) + 'px');
    d.style.setProperty('--vv-h', Math.round(searchVV.height) + 'px');
  }
  if (searchVV) {
    const refit = () => { const d = $('#sheet-search'); if (d && d.open) fitSearchPanel(); };
    searchVV.addEventListener('resize', refit);
    searchVV.addEventListener('scroll', refit);
  }

  const RECENT_KEY = 'basil-recent';
  function initSearch() {
    const input = $('#search-input');
    const box = $('#search-results');
    if (!input || !box) return;
    const scroller = box.closest('.sheet-inner') || box;
    const hints = ['желтеют листья', 'мошки', 'прищипывание', 'досветка', 'песто', 'черенки', 'магазинный горшок', 'рассада'];
    let found = [], active = 0, exact = false, last = '';
    const open = new Set(); // groups opened with «Ещё»

    const recentHtml = () => {
      const recent = store.get(RECENT_KEY, []);
      return recent.length ? `<div class="sr-group"><div class="sr-gh"><span>Недавние</span><button class="sr-clear" type="button">Очистить</button></div>${recent.map(r => `<button class="sr-recent" type="button" data-q="${esc(r)}">${icon('clock')}<span>${esc(r)}</span></button>`).join('')}</div>` : '';
    };
    const setActive = i => {
      const items = $$('.sr-item', box);
      if (!items.length) { input.removeAttribute('aria-activedescendant'); return; }
      active = (i + items.length) % items.length;
      items.forEach((it, k) => { it.classList.toggle('is-active', k === active); it.setAttribute('aria-selected', String(k === active)); });
      input.setAttribute('aria-activedescendant', items[active].id);
      return items[active];
    };

    const render = () => {
      const raw = input.value;
      const q = raw.trim();
      if (q !== last) { exact = false; open.clear(); scroller.scrollTop = 0; }
      last = q;
      found = [];
      active = 0;
      if (!q) {
        box.innerHTML = recentHtml() + `<div class="sr-group"><div class="sr-gh"><span>Часто ищут</span></div><div class="chips-row">${hints.map(h => `<button class="chip" type="button" data-q="${h}">${h}</button>`).join('')}</div></div><p class="sr-tip">Ищите по симптомам, элементам, сортам и советам. Слова можно писать в любой форме, с опечаткой или в английской раскладке.</p>`;
        setActive(0);
        return;
      }
      if (!searchIndex.length) { box.innerHTML = '<div class="sr-empty">Загружаю указатель…</div>'; return; }
      const r = runSearch(raw, exact);
      const keys = [...new Set([].concat(...r.words.map(wd => wd.alts.map(a => a.k))))];
      let note = '';
      if (r.fixed) note = `<p class="sr-note">Показано по запросу «<b>${esc(r.fixed)}</b>». <button type="button" data-exact>Искать «${esc(q)}»</button></p>`;
      else if (r.some) note = '<p class="sr-note">Нет мест, где есть все слова сразу, — показано, где есть часть из них.</p>';
      if (!r.list.length) {
        box.innerHTML = `<div class="sr-empty">Ничего не нашлось по запросу «${esc(q)}». Попробуйте другое слово, например «полив» или «удобрение».</div>`;
        setActive(0);
        return;
      }
      const groups = SEARCH_GROUPS.map(([k, name], gi) => ({ k, name, gi, list: r.list.filter(x => x.e.kind === k) })).filter(g => g.list.length);
      groups.sort((a, b) => b.list[0].s - a.list[0].s || a.gi - b.gi);
      const item = x => {
        const i = found.push(x.e) - 1;
        return `<a class="sr-item" href="${esc(entryUrl(x.e))}" data-i="${i}" id="sr-${i}" role="option" aria-selected="false">
          <span class="sr-ico">${icon(x.e.icon)}</span>
          <span><b>${highlight(x.e.title, keys)}</b><small>${esc(x.e.sub)}</small>${x.e.text ? `<span class="sr-snip">${highlight(nb(snippet(x.e.text, x.at)), keys)}</span>` : ''}</span>
        </a>`;
      };
      box.innerHTML = note + groups.map(g => {
        const all = open.has(g.k), shown = all ? g.list.slice(0, 40) : g.list.slice(0, 5), more = g.list.length - shown.length;
        return `<div class="sr-group" role="group" aria-label="${g.name}"><div class="sr-gh"><span>${g.name}</span><span>${g.list.length}</span></div>${shown.map(item).join('')}${more > 0 && !all ? `<button class="sr-more" type="button" data-more="${g.k}">Ещё ${more}</button>` : ''}</div>`;
      }).join('');
      setActive(0);
    };

    const go = i => {
      const e = found[i];
      if (!e) return;
      const q = input.value.trim();
      if (q) store.set(RECENT_KEY, [q].concat(store.get(RECENT_KEY, []).filter(x => x !== q)).slice(0, 6));
      markFound(e);
      closeSheet($('#sheet-search'));
      const u = entryUrl(e);
      if (!u.startsWith('#')) { location.href = u; return; }
      navigate(u);
      if (e.after) setTimeout(e.after, 60);
    };

    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const it = setActive(active + (e.key === 'ArrowDown' ? 1 : -1));
        if (it) it.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = $$('.sr-item', box)[active];
        if (it) go(+it.dataset.i);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSheet($('#sheet-search'));
      }
    });
    box.addEventListener('click', e => {
      const q = e.target.closest('[data-q]');
      if (q) { input.value = q.dataset.q; render(); input.focus({ preventScroll: true }); return; }
      if (e.target.closest('.sr-clear')) { store.set(RECENT_KEY, []); render(); input.focus({ preventScroll: true }); return; }
      const more = e.target.closest('[data-more]');
      if (more) { open.add(more.dataset.more); const y = scroller.scrollTop; render(); scroller.scrollTop = y; return; }
      if (e.target.closest('[data-exact]')) { exact = true; render(); return; }
      const item = e.target.closest('.sr-item');
      if (item) { e.preventDefault(); e.stopPropagation(); go(+item.dataset.i); }
    });
    box.addEventListener('pointermove', e => {
      const item = e.target.closest('.sr-item');
      if (item && e.pointerType === 'mouse') setActive($$('.sr-item', box).indexOf(item));
    });
    document.addEventListener('basil:search-ready', render);
    render();
  }
  /* ================================================================== */
  /* LIVING SCENE: greenhouse background, hero basil, hover light        */
  /* ================================================================== */
  function initScene() {
    const S = window.BasilScene;
    if (!S) { initLeafField(); return; }
    S.initBackground($('#leaf-field'));
    const g = $('#hero-plant-g');
    if (!g) return;
    const layer = $('#aroma-layer');
    const hint = $('#plant-hint');
    const spec = S.basil({ nodes: 8, scale: 1.95, w: 12 });
    spec.children = [
      { at: 1, spec: S.basil({ id: 'sL', nodes: 5, scale: 1.25, w: 7, angle: -0.72, flex: 1.3 }) },
      { at: 1, spec: S.basil({ id: 'sR', nodes: 5, scale: 1.25, w: 7, angle: 0.72, flex: 1.3 }) },
      { at: 3, spec: S.basil({ id: 'uL', nodes: 4, scale: 1, w: 5, angle: -0.5, flex: 1.5 }) },
      { at: 3, spec: S.basil({ id: 'uR', nodes: 4, scale: 1, w: 5, angle: 0.5, flex: 1.5 }) }
    ];
    S.Plant(g, spec, {
      leafScale: 0.8, interactive: true, growDur: 2.8, raster: true,
      onAroma: (x, y) => { S.aroma(layer, x, y); HAP.tick(); if (hint) hint.classList.add('is-used'); }
    });
  }

  function initHoverLight() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const sel = '.ch-card, .q-card, .tool, .rule, .deep > summary, .world-card, .lab-tool';
    // one style write per frame at most, however fast the mouse reports
    let pending = null, queued = false;
    const flush = () => {
      queued = false;
      const e = pending;
      const el = e.target.closest && e.target.closest(sel);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`);
      el.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`);
    };
    document.addEventListener('pointermove', e => {
      pending = e;
      if (!queued) { queued = true; requestAnimationFrame(flush); }
    }, { passive: true });
    $$('.ch-hero').forEach(hero => {
      const art = $('.ch-hero-art', hero);
      if (!art) return;
      let last = null, busy = false;
      hero.addEventListener('pointermove', e => {
        last = e;
        if (busy) return;
        busy = true;
        requestAnimationFrame(() => {
          busy = false;
          const r = art.getBoundingClientRect();
          const dx = clamp((last.clientX - (r.left + r.width / 2)) / 300, -1, 1), dy = clamp((last.clientY - (r.top + r.height / 2)) / 300, -1, 1);
          art.style.setProperty('--ry', `${f1(dx * 12)}deg`);
          art.style.setProperty('--rx', `${f1(-dy * 12)}deg`);
        });
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { art.style.setProperty('--ry', '0deg'); art.style.setProperty('--rx', '0deg'); });
    });
  }

  /* endless decorative animations stop while their block is off screen */
  function initOffscreenPause() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => entries.forEach(en => en.target.classList.toggle('is-off', !en.isIntersecting)), { rootMargin: '120px 0px' });
    $$('.lab-tool, .ch-hero-art, .season-mark, .halo, .passport, .hero-art, .plant-stage').forEach(el => io.observe(el));
  }

  function initLeafField() {
    const cv = $('#leaf-field');
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, colors = [], alpha = 0.4, leaves = [], raf = 0;
    const mouse = { x: -9999, y: -9999 };
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = ['--field-1', '--field-2', '--field-3'].map(v => cs.getPropertyValue(v).trim() || '#6FAE3F');
      alpha = parseFloat(cs.getPropertyValue('--field-alpha')) || 0.35;
    };
    const make = () => {
      const depth = 0.35 + Math.random() * 0.65;
      return {
        x: Math.random() * W, y: Math.random() * H,
        s: (10 + Math.random() * 20) * depth + 6,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.006,
        vy: -(0.12 + Math.random() * 0.3) * depth,
        ph: Math.random() * Math.PI * 2, vph: 0.004 + Math.random() * 0.006,
        c: Math.random() < 0.18 ? 2 : Math.random() < 0.5 ? 1 : 0,
        depth, ox: 0, oy: 0
      };
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = W < 700 ? 8 : 15;
      while (leaves.length < count) leaves.push(make());
      leaves.length = count;
    };
    const drawLeaf = l => {
      const sway = Math.sin(l.ph) * 22 * l.depth;
      const par = (window.scrollY * l.depth * 0.08) % (H + 120);
      let y = l.y - par + l.oy;
      y = ((y + 60) % (H + 120) + (H + 120)) % (H + 120) - 60;
      const x = l.x + sway + l.ox;
      const s = l.s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(l.r + Math.sin(l.ph) * 0.25);
      ctx.globalAlpha = alpha * (0.35 + l.depth * 0.65);
      ctx.fillStyle = colors[l.c];
      ctx.beginPath();
      ctx.moveTo(0, s * 0.12);
      ctx.bezierCurveTo(s * 0.62, -s * 0.2, s * 0.56, -s * 1.02, 0, -s * 1.42);
      ctx.bezierCurveTo(-s * 0.56, -s * 1.02, -s * 0.62, -s * 0.2, 0, s * 0.12);
      ctx.fill();
      ctx.globalAlpha *= 0.55;
      ctx.strokeStyle = colors[1];
      ctx.lineWidth = Math.max(0.6, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.quadraticCurveTo(s * 0.05, -s * 0.6, 0, -s * 1.3);
      ctx.stroke();
      ctx.restore();
      return { x, y };
    };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const l of leaves) {
        l.y += l.vy; l.r += l.vr; l.ph += l.vph;
        if (l.y < -60) { l.y += H + 120; l.x = Math.random() * W; }
        const p = drawLeaf(l);
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 140 && d > 0.1) {
          const f = (140 - d) / 140 * 1.6;
          l.ox += (dx / d) * f; l.oy += (dy / d) * f;
          l.vr += (Math.random() - 0.5) * 0.002;
        }
        l.ox *= 0.965; l.oy *= 0.965;
        l.vr = clamp(l.vr, -0.012, 0.012);
      }
      raf = requestAnimationFrame(frame);
    };
    const drawStatic = () => { ctx.clearRect(0, 0, W, H); leaves.forEach(drawLeaf); };
    const start = () => {
      cancelAnimationFrame(raf);
      if (reduceMotion.matches) drawStatic(); else raf = requestAnimationFrame(frame);
    };
    readColors(); resize(); start();
    window.addEventListener('resize', () => { resize(); if (reduceMotion.matches) drawStatic(); });
    window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    document.addEventListener('basil:theme', () => { readColors(); if (reduceMotion.matches) drawStatic(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else start(); });
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', start);
    if (reduceMotion.matches) window.addEventListener('scroll', drawStatic, { passive: true });
  }

  /* ================================================================== */
  /* MINI PLANTS (stages, journey)                                       */
  /* ================================================================== */
  function miniPlant(kind) {
    const leaf = (x, y, rot, s, sy) => `<use href="#leaf-shape" class="mini-leaf" transform="translate(${x} ${y}) rotate(${rot}) scale(${s} ${sy || s})"/>`;
    let g = '<line class="mini-ground" x1="6" y1="64" x2="56" y2="64"/>';
    if (kind === 'seed') {
      return `<svg viewBox="0 0 62 70" aria-hidden="true">${g}<ellipse class="mini-seed" cx="31" cy="58" rx="5" ry="3.2"/><path class="mini-stem" d="M31 60 Q 30 66 32 69" style="stroke-width:1.4"/><path class="mini-stem" d="M31 56 Q 29 49 34 46" style="stroke-width:1.6"/></svg>`;
    }
    const pair = (y, s, ang, fore) => leaf(31, y, -ang, fore ? s * 0.75 : s, s) + leaf(31, y, ang, fore ? s * 0.75 : s, s);
    const bush = () => {
      let out = '<path class="mini-stem" d="M31 64 L31 42 M31 42 Q 24 30 18 14 M31 42 Q 38 30 44 14"/>';
      out += pair(58, 0.26, 62) + pair(48, 0.22, 58, true);
      [[25, 30, -1], [37, 30, 1]].forEach(([x, y, sd]) => { out += leaf(x, y, sd * 70, 0.2) + leaf(x, y, sd * -20, 0.2); });
      out += leaf(19, 16, -30, 0.13) + leaf(19, 16, 8, 0.13) + leaf(43, 16, 30, 0.13) + leaf(43, 16, -8, 0.13);
      return out;
    };
    if (kind === 'seedling') {
      g += '<path class="mini-stem" d="M31 64 L31 42"/><ellipse cx="25" cy="49" rx="5" ry="2.6" class="mini-leaf" transform="rotate(-20 25 49)"/><ellipse cx="37" cy="49" rx="5" ry="2.6" class="mini-leaf" transform="rotate(20 37 49)"/>' + pair(42, 0.18, 30);
    } else if (kind === 'transplant') {
      g += '<path class="mini-stem" d="M31 64 L31 32"/>' + pair(56, 0.26, 62) + pair(44, 0.22, 52, true) + pair(33, 0.14, 24);
    } else if (kind === 'growth') {
      g += '<path class="mini-stem" d="M31 64 L31 16"/>' + pair(57, 0.3, 64) + pair(45, 0.27, 58, true) + pair(33, 0.23, 50) + pair(23, 0.17, 38, true) + pair(16, 0.1, 16);
    } else if (kind === 'harvest' || kind === 'end') {
      g += bush();
    } else if (kind === 'flower') {
      g += '<path class="mini-stem" d="M31 64 L31 6"/>' + pair(57, 0.3, 64) + pair(45, 0.26, 58, true) + pair(34, 0.2, 50);
      [26, 20, 14, 8].forEach((y, i) => { const w = 5 - i; g += `<ellipse class="mini-flower" cx="${31 - w}" cy="${y}" rx="${w * 0.7}" ry="1.8"/><ellipse class="mini-flower" cx="${31 + w}" cy="${y}" rx="${w * 0.7}" ry="1.8"/>`; });
    }
    return `<svg viewBox="0 0 62 70" aria-hidden="true">${g}</svg>`;
  }

  /* ================================================================== */
  /* HOME                                                                */
  /* ================================================================== */
  function initHome() {
    const quick = $('#quick');
    if (quick) quick.innerHTML = B.QUICK.map(q => `<a class="q-card" href="#${q.hash}"><span class="q-ico">${icon(q.icon)}</span><span><b>${q.title}</b><small>${q.desc}</small></span>${icon('chev-r')}</a>`).join('');

    const chapters = $('#chapters');
    if (chapters) chapters.innerHTML = B.CHAPTERS.map(c => `
      <a class="ch-card" href="#${c.id}">
        <span class="ch-art"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#${c.art}"/></svg></span>
        <span><span class="ch-num">Глава ${c.num}</span><h3>${c.title}</h3><p>${c.desc}</p></span>
      </a>`).join('');

    const steps = [
      { t: 'Семя', s: 'день 0', plant: 'seed', hash: 'posadka-posev' },
      { t: 'Всходы', s: '5–10 дней', plant: 'seedling', hash: 'posadka-posev' },
      { t: 'Рассада', s: '3–6 недель', plant: 'transplant', hash: 'posadka-posev' },
      { t: 'Прищипка', s: '5–6 недель', plant: 'growth', hash: 'formirovka-osnovy' },
      { t: 'Урожай', s: 'с 6–8 недель', plant: 'harvest', hash: 'urozhay-sbor' },
      { t: 'Песто', s: 'в любой день', art: 'art-urozhay', hash: 'urozhay-recepty' }
    ];
    const journey = $('#journey');
    if (journey) journey.innerHTML = steps.map(s => `
      <li><a href="#${s.hash}"><span class="j-art">${s.art ? `<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#${s.art}"/></svg>` : miniPlant(s.plant)}</span><b>${s.t}</b><small>${nb(s.s)}</small></a></li>`).join('');

    const tools = $('#tools-home');
    if (tools) tools.innerHTML = B.TOOLS.map(t => `<a class="tool" href="#${t.hash}"><span class="t-ico">${icon(t.icon)}</span><span><b>${t.title}</b><small>${t.desc}</small></span></a>`).join('');

    const m = today().getMonth();
    const tipText = $('#season-text');
    if (tipText) tipText.textContent = B.MONTH_TIPS[m];
    const tipHead = $('#season-h');
    if (tipHead) tipHead.textContent = `Сейчас, ${MONTHS_NOM[m]}`;
  }

  /* ================================================================== */
  /* VARIETIES + QUIZ                                                    */
  /* ================================================================== */
  function leafArt(v) {
    const sx = { wide: 1.2, normal: 1, narrow: 0.62, small: 0.85 }[v.shape] || 1;
    const s = v.shape === 'small' ? 0.62 : 0.78;
    const side = s * 0.78;
    return `<svg viewBox="-44 -80 88 84" aria-hidden="true"><g class="lf-${v.leaf}">
      <path d="M0 4 L0 -6" fill="none" stroke-width="2.4" stroke-linecap="round"/>
      <use href="#leaf-shape" transform="rotate(-44) scale(${f1(sx * side * 100) / 100} ${f1(side * 100) / 100})"/>
      <use href="#leaf-shape" transform="rotate(44) scale(${f1(sx * side * 100) / 100} ${f1(side * 100) / 100})"/>
      <use href="#leaf-shape" transform="scale(${f1(sx * s * 100) / 100} ${s})"/>
    </g></svg>`;
  }
  const labelCls = l => (/фиолет|декор/.test(l) ? 't-opal' : /устойчив|чай|цитрус|десерт|многолет|карлик/.test(l) ? 't-oil' : '');
  const meter = (n, max) => `<span class="meter" aria-hidden="true">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const EASY = { 1: 'легко', 2: 'средне', 3: 'капризный' };
  // the picture of a variety: a simple leaf until the chapter's drawings arrive (src/labs/sorta/_shared.js)
  const sortPic = i => `<span class="v-leaf" data-ill="sort:${i}">${leafArt(B.VARIETIES[i])}</span>`;
  let showVarietyType = () => {};

  function openVariety(i) {
    const v = B.VARIETIES[i];
    const box = $('#variety-detail');
    if (!v || !box) return;
    const where = v.pot >= 2 && v.garden >= 2 ? 'горшок и грядка' : v.pot >= 2 ? 'горшок, подоконник' : v.garden >= 2 ? 'грядка, большой горшок' : 'горшок или грядка';
    const resist = v.resist === 'dm' ? 'ложная мучнистая роса' : v.resist === 'fus' ? 'фузариоз' : '—';
    const type = B.VARIETY_TYPES.find(t => t.id === v.type);
    box.innerHTML = `
      <div class="vd-head">
        ${sortPic(i)}
        <div><h2 id="variety-h">${v.name}</h2><span class="v-latin">${v.latin}</span>${type ? `<span class="vd-type">${type.name}</span>` : ''}<ul class="tags">${v.labels.map(l => `<li class="${labelCls(l)}">${l}</li>`).join('')}</ul></div>
      </div>
      <p>${nb(v.desc)}</p>
      <dl class="vd-specs">
        <div><dt>Высота</dt><dd>${nb(v.height)}</dd></div>
        <div><dt>Первый срез</dt><dd>${nb(v.first)}</dd></div>
        <div><dt>Аромат</dt><dd>${v.aroma}</dd></div>
        <div><dt>Сложность</dt><dd>${meter(v.easy, 3)}${EASY[v.easy]}</dd></div>
        <div><dt>Где лучше</dt><dd>${where}</dd></div>
        <div><dt>Устойчивость</dt><dd>${resist}</dd></div>
      </dl>
      <p><b>Для чего:</b> ${v.use}</p>
      <div class="callout"><svg class="ico"><use href="#i-leaf"/></svg><p><b>Особенности ухода.</b> ${nb(v.care)}</p></div>
      <div class="hero-actions"><button class="btn btn-primary btn-small" type="button" data-garden-add="seed" data-variety="${esc(v.name)}">${icon('sprout')}Растёт у меня</button><a class="btn btn-ghost btn-small" href="#posadka-posev">${icon('seed')}Как посеять</a><a class="btn btn-ghost btn-small" href="#sorta-podbor">${icon('list')}Подобрать сорт</a></div>`;
    paintIll(box, true);
    showVarietyType(i);
    openSheet('sheet-variety');
  }

  /* the catalog: eight types with approximate values; a tap on a type opens its varieties under its row.
     One type at a time; a filter shows the types that have matching varieties, all open, with only those */
  function initVarieties() {
    const grid = $('#variety-grid');
    if (!grid) return;
    const chips = $$('#variety-filters .chip');
    const count = $('#variety-count');
    const TYPES = B.VARIETY_TYPES;
    const all = B.VARIETIES.length;
    const sortsOf = id => B.VARIETIES.map((v, i) => [v, i]).filter(([v]) => v.type === id);
    const sortCard = ([v, i]) => `
      <button class="variety" type="button" data-i="${i}" aria-haspopup="dialog">
        ${sortPic(i)}
        <span>
          <span class="v-name">${v.name}</span>
          <span class="v-latin">${v.latin}</span>
          <span class="v-line">${nb(v.height)} · срез ${nb(v.first)}</span>
          <span class="v-aroma">${v.aroma}</span>
          <ul class="tags">${v.labels.map(l => `<li class="${labelCls(l)}">${l}</li>`).join('')}</ul>
        </span>
      </button>`;
    const leafIco = v => `<svg viewBox="-24 -70 48 72" aria-hidden="true"><g class="lf-${v.leaf}"><use href="#leaf-shape"/></g></svg>`;
    grid.innerHTML = TYPES.map(t => {
      const list = sortsOf(t.id);
      return `
      <article class="vtype" data-t="${t.id}">
        <span class="vt-pic" data-ill="vtype:${t.id}"></span>
        <div class="vt-head">
          <h3 class="vt-name"><button class="vt-toggle" type="button" aria-expanded="false" aria-controls="vt-p-${t.id}">${t.name}</button></h3>
          <span class="vt-meta"><span class="vt-n">${list.length} ${plural(list.length, 'сорт', 'сорта', 'сортов')}</span> · ${meter(t.easy, 3)}${EASY[t.easy]}</span>
        </div>
        <p class="vt-desc">${nb(t.desc)}</p>
        <dl class="vt-specs">
          <div><dt>Аромат</dt><dd>${t.aroma}</dd></div>
          <div><dt>Высота</dt><dd>${nb(t.height)}</dd></div>
          <div><dt>Первый срез</dt><dd>${nb(t.first)}</dd></div>
          <div><dt>Для чего</dt><dd>${t.use}</dd></div>
          <div class="vt-wide"><dt>Где растить</dt><dd>${nb(t.where)}</dd></div>
        </dl>
        <div class="vt-foot" aria-hidden="true"><span class="vt-leaves">${list.map(([v]) => leafIco(v)).join('')}</span><span class="vt-more">Сорта</span><svg class="ico vt-chev"><use href="#i-chev-r"/></svg></div>
      </article>
      <div class="vt-panel" id="vt-p-${t.id}" data-t="${t.id}" role="region" aria-label="Сорта: ${t.name.toLowerCase()}" hidden>
        <p class="vt-panel-h"><b>${t.name}</b> · ${list.length} ${plural(list.length, 'сорт', 'сорта', 'сортов')} · нажмите на сорт, чтобы открыть подробности</p>
        <div class="vt-sorts">${list.map(sortCard).join('')}</div>
      </div>`;
    }).join('');
    const cards = $$('.vtype', grid);
    const panelOf = c => $(`#vt-p-${c.dataset.t}`, grid);
    let filter = 'all';
    const open = new Set();
    const match = v => filter === 'all' || (filter === 'resist' ? !!v.resist : v.tags.includes(filter));

    // an open type's varieties go under the row of its card, so the cards keep their places
    let cols = 0;
    function place() {
      cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      const shown = cards.filter(c => !c.hidden);
      const gx = grid.getBoundingClientRect().left;
      for (let r = 0; r < shown.length; r += cols) {
        const row = shown.slice(r, r + cols);
        let after = row[row.length - 1];
        row.forEach(c => {
          const p = panelOf(c);
          const on = open.has(c.dataset.t);
          c.classList.toggle('is-open', on);
          $('.vt-toggle', c).setAttribute('aria-expanded', String(on));
          $('.vt-more', c).textContent = on ? 'Свернуть' : 'Сорта';
          if (!on) { p.hidden = true; return; }
          if (after.nextElementSibling !== p) after.after(p);
          after = p;
          p.hidden = false;
          const b = c.getBoundingClientRect();
          p.style.setProperty('--ax', `${Math.round(b.left - gx + b.width / 2)}px`);
        });
      }
      cards.filter(c => c.hidden).forEach(c => { c.classList.remove('is-open'); panelOf(c).hidden = true; });
    }
    // the tapped card stays where it was on the screen while panels above it open and close
    function keep(card, fn) {
      const y0 = card.getBoundingClientRect().top;
      fn();
      const dy = card.getBoundingClientRect().top - y0;
      if (Math.abs(dy) > 1) window.scrollBy(0, dy);
    }
    function toggle(card, on) {
      const id = card.dataset.t;
      keep(card, () => {
        if (filter === 'all') open.clear();
        if (on) open.add(id); else open.delete(id);
        place();
      });
      if (!on) return;
      const p = panelOf(card);
      paintIll(p, true);
      const r = p.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.78) window.scrollBy({ top: r.top - window.innerHeight * 0.42, behavior: smooth() });
    }
    const apply = f => {
      filter = f;
      let n = 0;
      open.clear();
      cards.forEach(c => {
        const list = sortsOf(c.dataset.t), p = panelOf(c);
        let k = 0;
        $$('.variety', p).forEach(b => { const on = match(B.VARIETIES[+b.dataset.i]); b.hidden = !on; if (on) k++; });
        n += k;
        c.hidden = !k;
        $('.vt-n', c).textContent = f === 'all' ? `${list.length} ${plural(list.length, 'сорт', 'сорта', 'сортов')}` : `${k} из ${list.length}`;
        if (f !== 'all' && k) open.add(c.dataset.t);
      });
      if (count) count.textContent = f === 'all' ? `${all} ${plural(all, 'сорт', 'сорта', 'сортов')} в ${TYPES.length} типах` : `${n} ${plural(n, 'сорт', 'сорта', 'сортов')} из ${all}`;
      chips.forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.filter === f)));
      place();
      if (f !== 'all') paintIll(grid, true);
    };
    chips.forEach(ch => ch.addEventListener('click', () => apply(ch.dataset.filter)));
    grid.addEventListener('click', e => {
      const s = e.target.closest('.variety');
      if (s) { openVariety(+s.dataset.i); return; }
      const c = e.target.closest('.vtype');
      if (c) toggle(c, !open.has(c.dataset.t));
    });
    // the number of columns follows the width: move the open panels under their rows again
    if ('ResizeObserver' in window) new ResizeObserver(() => { const n = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1; if (n !== cols) place(); }).observe(grid);
    // a variety opened from search or the quiz: its type opens behind the sheet
    showVarietyType = i => {
      const v = B.VARIETIES[i];
      const card = v && cards.find(c => c.dataset.t === v.type);
      if (!card) return;
      if (!match(v)) apply('all');
      if (!open.has(v.type)) { if (filter === 'all') open.clear(); open.add(v.type); place(); paintIll(panelOf(card), true); }
    };
    apply('all');
  }

  function scoreVariety(v, a) {
    let s = 0;
    const why = [];
    const place = a.place === 'pot' ? v.pot : a.place === 'garden' ? v.garden : Math.min(2, (v.pot + v.garden) / 2 + (v.pot >= 1 ? 0.5 : 0));
    s += place * 2;
    if (place >= 2) why.push(a.place === 'pot' ? 'компактный, хорош в горшке' : a.place === 'garden' ? 'раскрывается на грядке' : 'подходит для балконного ящика');
    if (a.use === 'all') {
      if (v.universal) { s += 3; why.push('универсален на кухне'); }
    } else if (v.uses.includes(a.use)) {
      s += 4;
      why.push({ pesto: 'для песто и итальянской кухни', asian: 'для азиатской кухни', tea: 'для чая и десертов', decor: 'красив и нравится пчёлам' }[a.use]);
    }
    if (a.climate === 'hot' && v.heat) { s += 2.5; why.push('переносит жару'); }
    if (a.climate === 'damp' && v.resist) { s += 3; why.push(v.resist === 'dm' ? 'устойчив к ложной мучнистой росе' : 'устойчив к фузариозу'); }
    if (a.climate === 'damp' && v.easy === 3) s -= 1;
    if (a.exp === 'new') {
      if (v.easy === 1) { s += 1.5; why.push('прост для новичка'); }
      if (v.easy === 3) s -= 2;
    }
    return { s, why };
  }

  function initQuiz() {
    const box = $('#quiz');
    if (!box) return;
    let step = 0;
    let answers = {};
    const render = () => {
      if (step >= B.QUIZ.length) {
        const ranked = B.VARIETIES.map((v, i) => ({ v, i, ...scoreVariety(v, answers) })).sort((x, y) => y.s - x.s).slice(0, 3);
        box.innerHTML = `
          <div class="quiz-progress">${B.QUIZ.map(() => '<i class="on"></i>').join('')}</div>
          <span class="quiz-count">Результат</span>
          <h3>Вам подойдут</h3>
          <div class="quiz-results">${ranked.map((r, n) => `
            <button class="qr" type="button" data-i="${r.i}">
              <span class="qr-rank">${n + 1}</span>
              ${sortPic(r.i)}
              <span><span class="v-name">${r.v.name}</span><span class="qr-why">${r.why.length ? r.why.slice(0, 3).join(' · ') : 'хороший универсальный выбор'}</span><span class="qr-score"><i style="width:${Math.round(clamp(r.s / 12.5, 0.08, 1) * 100)}%"></i></span></span>
            </button>`).join('')}</div>
          <button class="btn btn-ghost btn-small quiz-back" type="button" data-restart>${icon('seed')}Пройти заново</button>`;
        paintIll(box, true);
        return;
      }
      const q = B.QUIZ[step];
      box.innerHTML = `
        <div class="quiz-progress">${B.QUIZ.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
        <div class="quiz-step">
          <span class="quiz-count">Вопрос ${step + 1} из ${B.QUIZ.length}</span>
          <h3>${q.q}</h3>
          <div class="quiz-options">${q.options.map(([v, t]) => `<button type="button" data-v="${v}">${t}</button>`).join('')}</div>
          ${step > 0 ? `<button class="btn btn-ghost btn-small quiz-back" type="button" data-back>${icon('chev-l')}Назад</button>` : ''}
        </div>`;
    };
    box.addEventListener('click', e => {
      const opt = e.target.closest('[data-v]');
      if (opt) { answers[B.QUIZ[step].id] = opt.dataset.v; step += 1; render(); return; }
      if (e.target.closest('[data-back]')) { step = Math.max(0, step - 1); render(); return; }
      if (e.target.closest('[data-restart]')) { step = 0; answers = {}; render(); return; }
      const r = e.target.closest('.qr');
      if (r) openVariety(+r.dataset.i);
    });
    render();
  }

  /* ================================================================== */
  /* PLACES                                                              */
  /* ================================================================== */
  function initPlaces() {
    const list = $('#place-tabs');
    const panel = $('#place-panel');
    if (!list || !panel) return;
    list.innerHTML = B.PLACES.map((p, i) => `<button class="tab" type="button" role="tab" id="tab-${p.id}" aria-controls="place-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${icon(p.icon)}${p.name}</button>`).join('');
    const tabs = $$('.tab', list);
    const render = (i, now) => {
      const p = B.PLACES[i];
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      panel.setAttribute('aria-labelledby', `tab-${p.id}`);
      panel.innerHTML = `
        <span class="place-ill" data-ill="place:${p.id}"></span>
        <div class="place-main">
          <h3>${p.name}</h3>
          <p class="lead">${nb(p.lead)}</p>
          <dl class="params">${p.params.map(([k, v]) => `<div><dt>${k}</dt><dd>${nb(v)}</dd></div>`).join('')}</dl>
        </div>
        <div class="place-side">
          <div><h4>${icon('check')}Советы</h4><ul class="ticks">${p.tips.map(t => `<li>${nb(t)}</li>`).join('')}</ul></div>
          <div><h4>${icon('alert')}Подводные камни</h4><ul class="ticks is-warn">${p.risks.map(t => `<li>${nb(t)}</li>`).join('')}</ul></div>
        </div>`;
      paintIll(panel, !!now);
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => render(i, true)));
    list.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      tabs[j].focus();
      render(j, true);
    });
    render(0);
  }

  /* ================================================================== */
  /* SOIL CALCULATOR                                                     */
  /* ================================================================== */
  function initSoil() {
    const sel = $('#soil-recipe');
    const vol = $('#soil-volume');
    const cnt = $('#soil-count');
    const out = $('#soil-out');
    if (!sel || !out) return;
    sel.innerHTML = B.SOIL_RECIPES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    const render = () => {
      const r = B.SOIL_RECIPES.find(x => x.id === sel.value) || B.SOIL_RECIPES[0];
      const v = clamp(parseFloat(String(vol.value).replace(',', '.')) || 0, 0, 1000);
      const n = clamp(parseInt(cnt.value, 10) || 0, 0, 1000);
      const total = v * n * 1.1;
      const parts = r.parts.reduce((s, p) => s + p[1], 0);
      out.innerHTML = `
        <div class="soil-bar" role="img" aria-label="Пропорции смеси">${r.parts.map(p => `<span class="mx-${p[2]}" style="flex:${p[1]}">${p[0]}<small>${p[1]}\u00a0${plural(p[1], 'часть', 'части', 'частей')}</small></span>`).join('')}</div>
        <ul class="soil-list">${r.parts.map(p => `<li><span><i class="mx-${p[2]}"></i>${p[0]}</span><b>${fmtNum(total * p[1] / parts, 1)}\u00a0л</b></li>`).join('')}</ul>
        <p class="soil-total">Всего ${fmtNum(total, 1)}\u00a0л смеси с запасом 10&nbsp;% на усадку. Керамзит для дренажа — около ${fmtNum(v * n * 0.1, 1)}\u00a0л.</p>
        <p class="muted">${nb(r.note)}</p>`;
    };
    [sel, vol, cnt].forEach(el => el.addEventListener('input', render));
    render();
  }

  /* ================================================================== */
  /* CALENDAR (wheel + timeline)                                         */
  /* ================================================================== */
  // the first autumn frost after the last spring one (lf): from the climate, or estimated from how late spring is
  function autumnFrostOf(lf, p) {
    if (p && p.af) return new Date(lf.getFullYear(), p.af[0] - 1, p.af[1]);
    const doy = dayDiff(new Date(lf.getFullYear(), 0, 1), lf);
    return addDays(lf, clamp(Math.round(300 - 2 * (doy - 60)), 90, 230));
  }
  // the frosts of a year in a climate (B.PRESETS); the calendar and «Мой базилик» count the season from them
  function seasonFrosts(id, year) {
    const p = B.PRESETS.find(x => x.id === id && x.lf) || B.PRESETS.find(x => x.id === 'temperate');
    const lf = new Date(year, p.lf[0] - 1, p.lf[1]);
    return { lf, af: autumnFrostOf(lf, p) };
  }
  function initCalendar() {
    const presetSel = $('#cal-preset');
    const dateIn = $('#cal-date');
    if (!presetSel || !dateIn) return;
    const presetField = $('#cal-preset-field');
    const dateLabel = $('#cal-date-label');
    const season = $('#cal-season');
    const wheel = $('#cal-wheel');
    const tip = $('#wheel-tip');
    const legend = $('#cal-legend');
    const cities = $('#cal-cities');
    const timeline = $('#cal-timeline');
    const modeBtns = $$('[data-mode]');

    presetSel.innerHTML = B.PRESETS.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const now = today();
    let mode = 'garden';
    let preset = 'temperate';
    let gardenDate = null;
    let homeDate = now;
    let plan = null;

    const presetLF = id => {
      const p = B.PRESETS.find(x => x.id === id);
      if (!p || !p.lf) return null;
      let d = new Date(now.getFullYear(), p.lf[0] - 1, p.lf[1]);
      if (addDays(d, -42) < now) d = new Date(now.getFullYear() + 1, p.lf[0] - 1, p.lf[1]);
      return d;
    };
    const autumnFrost = (lf, id) => autumnFrostOf(lf, B.PRESETS.find(x => x.id === id));
    const rel = (a, b) => {
      const end = b || a;
      if (end < now) return 'прошло';
      if (a <= now) return 'сейчас';
      const n = dayDiff(now, a);
      return `через ${n}\u00a0${plural(n, 'день', 'дня', 'дней')}`;
    };

    const gardenPlan = LF => {
      const S = addDays(LF, -49);
      const T = addDays(LF, 14);
      const AF = autumnFrost(LF, preset);
      return {
        events: [
          { a: addDays(LF, -56), b: addDays(LF, -42), icon: 'seed', key: true, title: 'Посев на рассаду', text: 'За 6–8 недель до последнего заморозка. Заделка 0,5 см, мини-парник при 22–25 °C.' },
          { a: addDays(S, 5), b: addDays(S, 10), icon: 'sprout', title: 'Всходы', text: 'Сразу снимите укрытие, свет 14–16 ч, температура 20–22 °C.' },
          { a: addDays(S, 14), b: addDays(S, 21), icon: 'pot', title: 'Пикировка', text: 'При 1–2 парах настоящих листьев — в стаканы по 200–300 мл.' },
          { a: addDays(S, 24), b: addDays(S, 28), icon: 'flask', title: 'Первая подкормка', text: 'Комплексное удобрение для рассады в ¼ дозы.' },
          { a: addDays(S, 35), b: addDays(S, 42), icon: 'scissors', title: 'Прищипывание рассады', text: 'При 3–4 парах листьев — над 2-й или 3-й парой.' },
          { a: addDays(T, -10), b: addDays(T, -1), icon: 'wind', title: 'Закаливание', text: 'Выносите на улицу, начиная с 1–2 часов в тени.' },
          { a: addDays(LF, 10), b: addDays(LF, 21), icon: 'garden', key: true, title: 'Высадка в грунт', text: 'Когда ночи теплее +10 °C, а почва прогрелась до +15 °C. В теплицу — на 1–2 недели раньше.' },
          { a: addDays(T, 10), b: addDays(T, 14), icon: 'flask', title: 'Подкормка после приживания', text: 'Монокалийфосфат или комплексное удобрение, половинная доза.' },
          { a: addDays(T, 21), b: addDays(T, 28), icon: 'leaf', key: true, title: 'Первый урожай', text: 'Срезайте верхушки над парой листьев, не больше трети куста.' },
          { a: addDays(T, 28), b: addDays(AF, -21), icon: 'scissors', title: 'Регулярные срезки', text: 'Каждые 1–2 недели. Удаляйте бутоны, подкармливайте после срезки.' },
          { a: addDays(AF, -35), b: addDays(AF, -21), icon: 'cup', title: 'Черенки на зиму', text: 'Укорените 3–5 верхушек в воде для подоконника.' },
          { a: addDays(AF, -14), b: AF, icon: 'snow', key: true, title: 'Финальный сбор и заготовки', text: 'До первых осенних заморозков срежьте всё. Дата заморозка ориентировочная.' }
        ],
        phases: [
          { cls: 'ph-seed', name: 'Проращивание', a: S, b: addDays(S, 8) },
          { cls: 'ph-young', name: 'Рассада', a: addDays(S, 8), b: addDays(T, -10) },
          { cls: 'ph-hard', name: 'Закаливание', a: addDays(T, -10), b: T },
          { cls: 'ph-grow', name: 'Рост', a: T, b: addDays(T, 21) },
          { cls: 'ph-cut', name: 'Урожай', a: addDays(T, 21), b: AF }
        ],
        head: `Сезон ${T.getFullYear()}: высадка около ${fd(T)}, урожай до ${fd(AF)}`,
        center: ['высадка', fd(T), `урожай до ${fd(AF)}`]
      };
    };

    const homePlan = S => {
      const H = addDays(S, 55);
      const dark = [S, addDays(S, 30), addDays(S, 60)].some(d => d.getMonth() >= 9 || d.getMonth() <= 2);
      return {
        events: [
          { a: S, icon: 'seed', key: true, title: 'Посев', text: '2–3 семени в горшок, заделка 0,5 см, под крышку при 22–25 °C.' },
          { a: addDays(S, 5), b: addDays(S, 10), icon: 'sprout', title: 'Всходы', text: 'Сразу под лампу или на самое светлое окно, 14–16 ч света.' },
          { a: addDays(S, 14), b: addDays(S, 21), icon: 'pot', title: 'Прореживание', text: 'Оставьте одно сильное растение на горшок 1,5–2 л или три на 3–5 л.' },
          { a: addDays(S, 24), b: addDays(S, 28), icon: 'flask', title: 'Первая подкормка', text: 'Комплексное удобрение в ¼ дозы, дальше — раз в 10–14 дней.' },
          { a: addDays(S, 35), b: addDays(S, 45), icon: 'scissors', key: true, title: 'Первое прищипывание', text: 'При 3–4 парах листьев — над 2-й или 3-й парой.' },
          { a: addDays(S, 35), b: addDays(S, 42), icon: 'seed', title: 'Подсев новой партии', text: 'Для непрерывного урожая сейте новый горшок каждые 4–6 недель.' },
          { a: addDays(S, 50), b: addDays(S, 60), icon: 'leaf', key: true, title: 'Первый урожай', text: 'Срезайте верхушки над парой листьев, не больше трети куста.' },
          { a: addDays(S, 60), b: addDays(S, 110), icon: 'scissors', title: 'Регулярные срезки', text: 'Каждые 1–2 недели. Подкормка после срезки, промывка грунта раз в месяц.' },
          { a: addDays(S, 100), b: addDays(S, 130), icon: 'cup', title: 'Обновление куста', text: 'Куст стареет и деревенеет: укорените черенки или пересейте.' }
        ],
        phases: [
          { cls: 'ph-seed', name: 'Проращивание', a: S, b: addDays(S, 8) },
          { cls: 'ph-young', name: 'Сеянцы', a: addDays(S, 8), b: addDays(S, 35) },
          { cls: 'ph-grow', name: 'Рост', a: addDays(S, 35), b: addDays(S, 55) },
          { cls: 'ph-cut', name: 'Урожай', a: addDays(S, 55), b: addDays(S, 120) }
        ],
        head: `Посев ${fd(S)} → первый урожай около ${fd(H)}` + (dark ? '. В эти месяцы без лампы не обойтись.' : ''),
        center: ['первый урожай', fd(H), `посев ${fd(S)}`]
      };
    };

    /* wheel geometry */
    const C = 160;
    const yearFrac = d => {
      const start = new Date(d.getFullYear(), 0, 1);
      const days = (new Date(d.getFullYear() + 1, 0, 1) - start) / 864e5;
      return ((d - start) / 864e5) / days;
    };
    const pt = (frac, r) => {
      const a = frac * Math.PI * 2 - Math.PI / 2;
      return [C + r * Math.cos(a), C + r * Math.sin(a)];
    };
    const arcPath = (a, b, r) => {
      const f0 = yearFrac(a);
      let sweep = dayDiff(a, b) / 365;
      sweep = clamp(sweep, 0.004, 0.995);
      const f1v = f0 + sweep;
      const [x0, y0] = pt(f0, r);
      const [x1, y1] = pt(f1v, r);
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };

    const drawWheel = () => {
      const R = 106;
      let s = `<circle class="w-track" cx="${C}" cy="${C}" r="${R}" stroke-width="24"/>`;
      for (let m = 0; m < 12; m++) {
        const f = m / 12;
        const [x0, y0] = pt(f, 122);
        const [x1, y1] = pt(f, 132);
        s += `<line class="w-tick" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>`;
        const [lx, ly] = pt(f + 1 / 24, 146);
        s += `<text class="w-month" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${MONTHS_SHORT[m]}</text>`;
      }
      plan.phases.forEach((p, i) => {
        s += `<path class="w-arc ${p.cls}-c" d="${arcPath(p.a, addDays(p.b, -1), R)}" stroke-width="24" data-i="${i}" tabindex="0" role="img" aria-label="${p.name}: ${fr(p.a, p.b)}"/>`;
      });
      plan.events.filter(e => e.key).forEach(e => {
        const [x, y] = pt(yearFrac(e.a), 127);
        s += `<circle class="w-ev is-key" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/>`;
      });
      const [tx, ty] = pt(yearFrac(now), 90);
      const [tx2, ty2] = pt(yearFrac(now), 134);
      s += `<line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" style="stroke: var(--danger)" stroke-width="2" stroke-linecap="round"/>`;
      s += `<circle class="w-today" cx="${tx2.toFixed(1)}" cy="${ty2.toFixed(1)}" r="5"><title>Сегодня, ${fd(now)}</title></circle>`;
      s += `<text class="w-center-a" x="${C}" y="${C - 22}" text-anchor="middle">${plan.center[0]}</text>`;
      s += `<text class="w-center-b" x="${C}" y="${C + 8}" text-anchor="middle">${plan.center[1]}</text>`;
      s += `<text class="w-center-c" x="${C}" y="${C + 30}" text-anchor="middle">${plan.center[2]}</text>`;
      wheel.innerHTML = s;
    };

    const showTip = (i, evt) => {
      const p = plan.phases[i];
      if (!p) return;
      const wrap = wheel.parentElement.getBoundingClientRect();
      const box = evt.target.getBoundingClientRect();
      const x = (evt.clientX || box.left + box.width / 2) - wrap.left;
      const y = (evt.clientY || box.top + box.height / 2) - wrap.top;
      tip.innerHTML = `<b>${p.name}</b><div>${fr(p.a, p.b)}</div><div class="muted">${dayDiff(p.a, p.b)}\u00a0${plural(dayDiff(p.a, p.b), 'день', 'дня', 'дней')}</div>`;
      tip.style.left = `${clamp(x, 70, wrap.width - 70)}px`;
      tip.style.top = `${y}px`;
      tip.hidden = false;
    };
    wheel.addEventListener('pointermove', e => { const a = e.target.closest('.w-arc'); if (a) showTip(+a.dataset.i, e); else tip.hidden = true; });
    wheel.addEventListener('pointerleave', () => { tip.hidden = true; });
    wheel.addEventListener('focusin', e => { const a = e.target.closest('.w-arc'); if (a) showTip(+a.dataset.i, e); });
    wheel.addEventListener('focusout', () => { tip.hidden = true; });

    const render = () => {
      const isGarden = mode === 'garden';
      presetField.hidden = !isGarden;
      const pr = B.PRESETS.find(x => x.id === preset);
      cities.textContent = pr && pr.cities ? 'Например, ' + pr.cities : '';
      cities.hidden = !cities.textContent;
      dateLabel.textContent = isGarden ? 'Последний весенний заморозок' : 'Дата посева';
      let base = isGarden ? gardenDate : homeDate;
      if (!base) base = isGarden ? presetLF(preset) : now;
      dateIn.value = toISO(base);
      plan = isGarden ? gardenPlan(base) : homePlan(base);
      plan.events.sort((x, y) => x.a - y.a);
      season.textContent = plan.head;
      drawWheel();
      legend.innerHTML = plan.phases.map(p => `<li><i class="${p.cls}"></i>${p.name}: ${fr(p.a, p.b)}</li>`).join('') + `<li><i class="today"></i>сегодня, ${fd(now)}</li>`;
      timeline.innerHTML = plan.events.map(ev => {
        const r = rel(ev.a, ev.b);
        return `
        <li class="${r === 'сейчас' ? 'is-now' : ''}">
          <div class="tl-date">${fr(ev.a, ev.b)}<small>${r}</small></div>
          <div class="tl-mark"><span class="tl-dot${ev.key ? ' is-key' : ''}">${icon(ev.icon)}</span></div>
          <div class="tl-body"><h4>${ev.title}</h4><p>${nb(ev.text)}</p></div>
        </li>`;
      }).join('');
    };

    modeBtns.forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      modeBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    presetSel.addEventListener('change', () => {
      preset = presetSel.value;
      if (preset !== 'custom') gardenDate = null;
      render();
    });
    dateIn.addEventListener('change', () => {
      const d = fromISO(dateIn.value);
      if (!d) return;
      if (mode === 'garden') { gardenDate = d; preset = 'custom'; presetSel.value = 'custom'; } else { homeDate = d; }
      render();
    });
    $('#cal-copy').addEventListener('click', () => {
      const text = plan.head + '\n\n' + plan.events.map(e => `• ${fr(e.a, e.b).replace(/\u00a0/g, ' ')} — ${e.title}. ${e.text}`).join('\n');
      copyText(text);
    });
    presetSel.value = preset;
    render();
  }

  /* ================================================================== */
  /* LIGHT (DLI)                                                         */
  /* ================================================================== */
  function initDli() {
    const ppfd = $('#dli-ppfd');
    const hours = $('#dli-hours');
    const out = $('#dli-out');
    if (!ppfd || !hours || !out) return;
    const chips = $$('#dli-presets .chip');
    const render = () => {
      const p = clamp(parseFloat(ppfd.value) || 0, 0, 2000);
      const h = clamp(parseFloat(hours.value) || 0, 0, 24);
      $('#dli-hours-val').textContent = String(h);
      chips.forEach(c => c.setAttribute('aria-pressed', String(+c.dataset.ppfd === p)));
      const dli = p * h * 0.0036;
      const pos = clamp(dli / 30, 0, 1) * 100;
      let verdict;
      if (dli < 8) verdict = 'Мало: базилик вытянется и не наберёт аромата.';
      else if (dli < 12) verdict = 'Маловато: растёт, но медленно и бледнеет.';
      else if (dli <= 17) verdict = 'Норма для базилика.';
      else if (dli <= 22) verdict = 'Много: отлично, если хватает воды и тепла.';
      else verdict = 'Очень много: следите за перегревом и поливом.';
      const need = p > 0 ? 14 / (p * 0.0036) : Infinity;
      let hint;
      if (need > 18) hint = 'Даже 18 часов не хватит до нормы: опустите лампу ближе или возьмите мощнее.';
      else hint = `Для DLI 14 (середина нормы) с этой лампой нужно около ${Math.round(need)}\u00a0${plural(Math.round(need), 'часа', 'часов', 'часов')} света в сутки.`;
      if (need < 10) hint += ' Можно поднять лампу выше или сократить время её работы.';
      out.innerHTML = `
        <div class="big">${fmtNum(dli, 1)}<small>моль/м² в сутки</small></div>
        <div class="dli-gauge" aria-hidden="true"><i style="left:${pos}%"></i></div>
        <div class="dli-scale" aria-hidden="true"><span>0</span><span>8</span><span>12</span><span>17</span><span>22</span><span>30</span></div>
        <p class="dli-verdict">${verdict}</p>
        <p class="dli-hint">${hint}</p>`;
    };
    chips.forEach(c => c.addEventListener('click', () => { ppfd.value = c.dataset.ppfd; render(); }));
    [ppfd, hours].forEach(el => el.addEventListener('input', render));
    render();
  }

  /* ================================================================== */
  /* NUTRIENTS: elements                                                 */
  /* ================================================================== */
  const GROUP_NAME = { macro: 'Макроэлемент', meso: 'Мезоэлемент', micro: 'Микроэлемент' };
  const MOB = {
    mobile: { arrow: '↓', text: 'Подвижный: симптомы на старых листьях' },
    immobile: { arrow: '↑', text: 'Неподвижный: симптомы на молодых листьях' },
    partial: { arrow: '↕', text: 'Частично подвижный' }
  };
  let selectElement = () => {};

  function initElements() {
    const grid = $('#el-grid');
    const detail = $('#el-detail');
    if (!grid || !detail) return;
    grid.innerHTML = B.ELEMENTS.map((e, i) => `
      <button class="el-tile" type="button" data-group="${e.group}" data-i="${i}" aria-pressed="false" aria-label="${e.name}, ${GROUP_NAME[e.group].toLowerCase()}">
        <span class="el-mob" aria-hidden="true">${MOB[e.mob].arrow}</span>
        <span class="el-sym">${e.sym}</span>
        <span class="el-name">${e.name}</span>
      </button>`).join('');
    const tiles = $$('.el-tile', grid);
    selectElement = (i, scroll) => {
      const e = B.ELEMENTS[i];
      tiles.forEach((t, j) => t.setAttribute('aria-pressed', String(i === j)));
      detail.innerHTML = `
        <header>
          <div class="el-big ${e.group === 'macro' ? '' : 'is-' + e.group}" aria-hidden="true">${e.sym}</div>
          <div><h3>${e.name}</h3><div class="el-badges"><span class="badge">${GROUP_NAME[e.group]}</span><span class="badge">${MOB[e.mob].arrow} ${MOB[e.mob].text}</span></div></div>
        </header>
        <div class="el-section"><h4>За что отвечает</h4><p>${nb(e.role)}</p></div>
        <div class="el-section is-def"><h4>Признаки нехватки</h4><span class="el-ill" data-ill="def:${e.sym}"></span><p>${nb(e.def)}</p></div>
        <div class="el-section is-exc"><h4>Признаки избытка</h4><p>${nb(e.exc)}</p></div>
        <div class="el-section"><h4>Где взять</h4><p><b>Минеральные:</b> ${nb(e.mineral)}.<br><b>Органические:</b> ${nb(e.organic)}.</p></div>
        <div class="el-section"><h4>Когда важнее всего</h4><p>${nb(e.when)}</p></div>`;
      // at start the tab may be closed: the picture waits until it is seen; after a tap it is drawn at once
      paintIll(detail, !!scroll);
      if (scroll && window.matchMedia('(max-width: 940px)').matches) detail.scrollIntoView({ block: 'start', behavior: smooth() });
    };
    tiles.forEach((t, i) => t.addEventListener('click', () => selectElement(i, true)));
    selectElement(0, false);
  }

  /* ================================================================== */
  /* NUTRIENTS: feeding curve + stages                                   */
  /* ================================================================== */
  function initStages() {
    const track = $('#stage-track');
    const svg = $('#feed-chart');
    const wrap = $('#feed-chart-wrap');
    const tip = $('#feed-tip');
    if (!track || !svg) return;
    const S = B.STAGES;
    const title = $('#stage-title'), days = $('#stage-days'), npk = $('#stage-npk'), ratio = $('#stage-ratio'), info = $('#stage-info'), tips = $('#stage-tips');
    const series = [['n', 'N', 'Азот', 'N'], ['p', 'P', 'Фосфор', 'P'], ['k', 'K', 'Калий', 'K']];
    let sel = 3;

    track.innerHTML = S.map((s, i) => `<button class="stage-btn" type="button" role="tab" aria-selected="false" data-i="${i}">${miniPlant(s.plant)}<span><i>${i + 1}</i>${s.short}</span></button>`).join('');
    const btns = $$('.stage-btn', track);
    npk.innerHTML = series.map(([c, s, n]) => `<div class="npk-row"><span class="lbl"><i class="k-${c}"></i>${s} · ${n}</span><span class="bar"><i class="k-${c}" id="bar-${c}"></i></span><span class="lvl" id="lvl-${c}"></span></div>`).join('');
    const table = $('#feed-table');
    if (table) table.innerHTML = `<thead><tr><th scope="col">Стадия</th><th scope="col">N</th><th scope="col">P</th><th scope="col">K</th><th scope="col">N : P : K</th></tr></thead><tbody>${S.map((s, i) => `<tr><td>${i + 1}. ${s.name}</td><td class="num">${s.N}</td><td class="num">${s.P}</td><td class="num">${s.K}</td><td class="num npk-ratio">${s.ratio}</td></tr>`).join('')}</tbody>`;
    const lvl = v => (v === 0 ? 'не нужно' : v < 30 ? 'низкая' : v < 60 ? 'средняя' : 'высокая');

    let geom = null;
    const draw = () => {
      const w = Math.round(wrap.clientWidth);
      if (!w) return;
      const narrow = w < 560;
      const h = narrow ? 230 : 280;
      const m = { l: narrow ? 30 : 40, r: narrow ? 26 : 34, t: 14, b: narrow ? 30 : 42 };
      const pw = w - m.l - m.r, ph = h - m.t - m.b;
      const x = i => m.l + (pw * i) / (S.length - 1);
      const y = v => m.t + (1 - v / 100) * ph;
      geom = { x, w, h };
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      let out = '';
      const step = pw / (S.length - 1);
      // the selected stage's column ends just under the axis, clear of the stage numbers below it
      out += `<rect class="fc-band" x="${x(sel) - step * 0.42}" y="${m.t - 6}" width="${step * 0.84}" height="${ph + 9}" rx="12"/>`;
      [0, 25, 50, 75, 100].forEach(v => {
        out += `<line class="fc-grid" x1="${m.l}" x2="${w - m.r}" y1="${y(v)}" y2="${y(v)}"/>`;
        out += `<text class="fc-axis" x="${m.l - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${v}</text>`;
      });
      series.forEach(([c, , , key]) => {
        const pts = S.map((s, i) => [x(i), y(s[key])]);
        const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
        out += `<path class="fc-area f-${c}" d="${line} L${x(S.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z"/>`;
      });
      series.forEach(([c, s, , key]) => {
        const pts = S.map((st, i) => [x(i), y(st[key])]);
        out += `<path class="fc-line l-${c}" d="${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')}"/>`;
        const last = pts[pts.length - 1];
        out += `<text class="fc-end" x="${last[0] + 8}" y="${last[1]}" dominant-baseline="middle">${s}</text>`;
      });
      series.forEach(([c, , , key]) => {
        out += `<circle class="fc-dot f-${c}" cx="${x(sel)}" cy="${y(S[sel][key])}" r="5"/>`;
      });
      S.forEach((s, i) => {
        out += `<text class="fc-xlabel${i === sel ? ' is-sel' : ''}" x="${x(i)}" y="${h - (narrow ? 8 : 16)}" text-anchor="middle">${narrow ? i + 1 : s.short}</text>`;
      });
      out += `<line class="fc-cross" id="fc-cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ph}" visibility="hidden"/>`;
      S.forEach((s, i) => {
        out += `<rect class="fc-hit" x="${x(i) - step / 2}" y="0" width="${step}" height="${h}" data-i="${i}" tabindex="0" role="button" aria-label="Стадия ${i + 1}: ${s.name}. N ${s.N}, P ${s.P}, K ${s.K}"/>`;
      });
      svg.innerHTML = out;
    };

    const hover = (i, show) => {
      const cross = $('#fc-cross', svg);
      if (!show || !geom) { tip.hidden = true; if (cross) cross.setAttribute('visibility', 'hidden'); return; }
      const s = S[i];
      const px = geom.x(i);
      if (cross) { cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible'); }
      tip.innerHTML = `<b>${i + 1}. ${s.name}</b>` + series.map(([c, sym, name, key]) => `<div class="row"><i class="k-${c}"></i><strong>${s[key]}</strong><span>${sym} · ${name.toLowerCase()}</span></div>`).join('');
      const scale = wrap.clientWidth / geom.w;
      tip.style.left = `${clamp(px * scale, 80, wrap.clientWidth - 80)}px`;
      tip.style.top = `${24 * scale + 40}px`;
      tip.hidden = false;
    };

    const show = (i, focusBtn) => {
      sel = i;
      const s = S[i];
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      if (focusBtn) btns[i].focus();
      title.textContent = `${i + 1}. ${s.name}`;
      days.textContent = s.days;
      series.forEach(([c, , , key]) => {
        $(`#bar-${c}`).style.width = `${s[key]}%`;
        $(`#lvl-${c}`).textContent = lvl(s[key]);
      });
      ratio.textContent = s.ratio;
      info.innerHTML = [['Чем кормить', s.feed], ['Как часто', s.freq], ['Доза', s.dose], ['EC для гидропоники', s.ec]]
        .map(([k, v]) => `<div><dt>${k}</dt><dd>${nb(v)}</dd></div>`).join('') + `<div class="is-avoid"><dt>Нельзя</dt><dd>${nb(s.avoid)}</dd></div>`;
      tips.innerHTML = s.tips.map(t => `<li>${nb(t)}</li>`).join('');
      const b = btns[i];
      track.scrollTo({ left: b.offsetLeft - track.clientWidth / 2 + b.offsetWidth / 2, behavior: smooth() });
      draw();
    };

    btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
    track.addEventListener('keydown', e => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(i + 1, btns.length - 1), true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(Math.max(i - 1, 0), true); }
    });
    svg.addEventListener('pointermove', e => { const r = e.target.closest('.fc-hit'); if (r) hover(+r.dataset.i, true); });
    svg.addEventListener('pointerleave', () => hover(0, false));
    svg.addEventListener('click', e => { const r = e.target.closest('.fc-hit'); if (r) show(+r.dataset.i); });
    svg.addEventListener('keydown', e => {
      const r = e.target.closest('.fc-hit');
      if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(+r.dataset.i); }
    });
    svg.addEventListener('focusin', e => { const r = e.target.closest('.fc-hit'); if (r) hover(+r.dataset.i, true); });
    svg.addEventListener('focusout', () => hover(0, false));
    if ('ResizeObserver' in window) new ResizeObserver(() => draw()).observe(wrap);
    else window.addEventListener('resize', draw);
    show(sel);
  }

  /* ================================================================== */
  /* NUTRIENTS: feeding plan                                             */
  /* ================================================================== */
  function initPlan() {
    const list = $('#plan-list');
    const dateIn = $('#plan-date');
    const weeks = $('#plan-weeks');
    if (!list || !dateIn || !weeks) return;
    const modeBtns = $$('[data-plan-mode]');
    let mode = 'pot';
    let items = [];
    dateIn.value = toISO(addDays(today(), -14));

    const build = (S, total) => {
      const end = addDays(S, total);
      const out = [];
      const push = (d, title, what, tag) => { if (d <= total) out.push({ date: addDays(S, d), title, what, tag }); };
      if (mode === 'hydro') {
        push(0, 'Проращивание', 'Кубики минваты или кокоса, чистая вода. Удобрения не нужны.', 'o');
        push(14, 'Перенос в систему', 'Раствор EC 0,6–0,8, pH 5,8–6,2. Корни наполовину в растворе.', 'p');
        push(28, 'Повышение концентрации', 'EC 1,0–1,2, pH 5,5–6,5. Проверяйте каждые 2–3 дня.', 'n');
        push(42, 'Активный рост', 'EC 1,2–1,4. Доливайте чистую воду, а не концентрат.', 'n');
        for (let d = 56; d <= total - 7; d += 14) push(d, 'Полная замена раствора', 'EC 1,2–1,6, pH 5,5–6,5, температура 18–22 °C.', 'k');
        return { out, end };
      }
      push(24, 'Первая подкормка', 'Комплексное удобрение для рассады, ¼ дозы с упаковки.', 'p');
      push(38, 'Вторая подкормка', 'Монокалийфосфат 0,3–0,5 г/л или комплексное ⅓ дозы — для корней.', 'p');
      const cycle = mode === 'pot'
        ? [['Подкормка для зелени', 'Комплексное удобрение «для зелени», ½ дозы.', 'n'], ['Подкормка для аромата', 'Калийная селитра 0,5 г/л.', 'k'], ['Органика', 'Жидкий биогумус по инструкции.', 'o']]
        : [['Подкормка для зелени', 'Нитроаммофоска 1–1,5 г/л или настой крапивы 1:10.', 'n'], ['Подкормка для аромата', 'Калийная селитра 1 г/л.', 'k'], ['Органика', 'Биогумус или настой крапивы 1:10.', 'o']];
      let startD, stepD;
      if (mode === 'garden') {
        const T = 56;
        push(T, 'Высадка в грунт', 'Только полив тёплой водой, без удобрений 7–10 дней.', 'o');
        push(T + 10, 'Подкормка для корней', 'Монокалийфосфат 1 г/л или гумат калия по инструкции.', 'p');
        startD = T + 24; stepD = 18;
      } else {
        startD = 52; stepD = 10;
      }
      let k = 0;
      for (let d = startD; d <= total - 16; d += stepD) {
        const c = cycle[k % cycle.length];
        push(d, c[0], c[1], c[2]);
        k += 1;
      }
      for (let d = mode === 'pot' ? 60 : 96; d <= total - 16; d += 30) {
        push(d + 3, mode === 'pot' ? 'Промывка и магний' : 'Магний по листу', mode === 'pot' ? 'Пролейте горшок чистой водой в объёме 2–3 горшков, через день — сульфат магния 1 г/л.' : 'Сульфат магния 1 г/л, опрыскивание вечером.', 'o');
      }
      push(total - 14, 'Финишная подкормка без азота', mode === 'pot' ? 'Сульфат калия 0,5 г/л — для аромата перед финальным сбором.' : 'Сульфат калия 1 г/л или зольный настой.', 'k');
      push(total, 'Финальный сбор', 'Срежьте всё для заготовок или укорените черенки для нового цикла.', 'o');
      out.sort((a, b) => a.date - b.date);
      return { out, end };
    };

    const TAG = { n: ['pt-n', 'азот'], k: ['pt-k', 'калий'], p: ['pt-p', 'фосфор, корни'], o: ['pt-o', 'уход'] };
    const render = () => {
      const S = fromISO(dateIn.value) || today();
      const total = clamp(parseInt(weeks.value, 10) || 20, 10, 30) * 7;
      $('#plan-weeks-val').textContent = String(Math.round(total / 7));
      const { out } = build(S, total);
      items = out;
      const now = today();
      let nextMarked = false;
      list.innerHTML = out.map(it => {
        const past = it.date < now;
        const next = !past && !nextMarked;
        if (next) nextMarked = true;
        const n = dayDiff(now, it.date);
        const rel = past ? 'прошло' : n === 0 ? 'сегодня' : `через ${n}\u00a0${plural(n, 'день', 'дня', 'дней')}`;
        return `<li class="plan-item${past ? ' is-past' : ''}${next ? ' is-next' : ''}">
          <div class="plan-date">${fd(it.date)}<small>${rel}</small></div>
          <div><h4>${it.title}<span class="plan-tag ${TAG[it.tag][0]}">${TAG[it.tag][1]}</span></h4><p>${nb(it.what)}</p></div>
        </li>`;
      }).join('');
    };
    modeBtns.forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.planMode;
      modeBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    [dateIn, weeks].forEach(el => el.addEventListener('input', render));
    $('#plan-copy').addEventListener('click', () => {
      copyText('План подкормок базилика\n\n' + items.map(it => `• ${fd(it.date).replace(/\u00a0/g, ' ')} — ${it.title}. ${it.what}`).join('\n'));
    });
    render();
  }

  /* ================================================================== */
  /* NUTRIENTS: NPK decoder                                              */
  /* ================================================================== */
  function initNpk() {
    const inN = $('#npk-n'), inP = $('#npk-p'), inK = $('#npk-k');
    const out = $('#npk-out');
    const presets = $('#npk-presets');
    if (!inN || !out) return;
    presets.innerHTML = B.NPK_PRESETS.map(([label, name], i) => `<button class="chip" type="button" data-i="${i}" title="${name}">${label}</button>`).join('');
    const chips = $$('.chip', presets);
    const render = () => {
      const n = Math.max(0, parseFloat(String(inN.value).replace(',', '.')) || 0);
      const p = Math.max(0, parseFloat(String(inP.value).replace(',', '.')) || 0);
      const k = Math.max(0, parseFloat(String(inK.value).replace(',', '.')) || 0);
      chips.forEach((c, i) => { const v = B.NPK_PRESETS[i][2]; c.setAttribute('aria-pressed', String(v[0] === n && v[1] === p && v[2] === k)); });
      const sum = n + p + k;
      if (!sum) { out.innerHTML = '<p>Введите хотя бы одно число больше нуля.</p>'; return; }
      const sn = n / sum, sp = p / sum, sk = k / sum;
      let kind, text;
      if (sn >= 0.6) { kind = 'Азотное'; text = 'Для наращивания зелени в фазе активного роста. Не давайте его за 2 недели до сбора на заготовки.'; }
      else if (sk >= 0.6) { kind = 'Калийное'; text = 'Для аромата и плотного листа, в период срезок и в конце сезона.'; }
      else if (sp >= 0.45 && sn < 0.15) { kind = 'Фосфорно-калийное'; text = 'Для корней рассады, приживания после пересадки и цветения на семена.'; }
      else if (sp >= 0.45) { kind = 'Фосфорное'; text = 'Для корней и рассады. Для взрослого базилика фосфора слишком много.'; }
      else if (sn > 0.28 && sk > 0.28 && sp < 0.2) { kind = 'Азотно-калийное'; text = 'Отличный выбор для базилика в период роста и регулярных срезок.'; }
      else { kind = 'Сбалансированное'; text = 'Универсальное: подходит на большинстве стадий в половинной дозе.'; }
      const cos = st => {
        const d = Math.hypot(st.N, st.P, st.K) * Math.hypot(n, p, k);
        return d ? (st.N * n + st.P * p + st.K * k) / d : 0;
      };
      const ranked = B.STAGES.map((st, i) => ({ i, s: cos(st) })).filter(x => B.STAGES[x.i].N + B.STAGES[x.i].P + B.STAGES[x.i].K > 0).sort((a, b) => b.s - a.s).slice(0, 3);
      const seg = (cls, v, label) => `<span class="k-${cls}" style="flex-grow:${Math.max(v, 0.0001)}">${v / sum >= 0.14 ? label : ''}</span>`;
      out.innerHTML = `
        <div class="npk-stack" role="img" aria-label="Доли: N ${Math.round(sn * 100)}%, P ${Math.round(sp * 100)}%, K ${Math.round(sk * 100)}%">${seg('n', n, 'N ' + Math.round(sn * 100) + '%')}${seg('p', p, 'P ' + Math.round(sp * 100) + '%')}${seg('k', k, 'K ' + Math.round(sk * 100) + '%')}</div>
        <p class="npk-kind">${kind}</p>
        <p>${nb(text)}</p>
        <div><span class="muted">Ближе всего к стадиям:</span><div class="npk-match">${ranked.map((r, j) => `<span class="badge${j === 0 ? ' is-best' : ''}">${r.i + 1}. ${B.STAGES[r.i].short}</span>`).join('')}</div></div>
        <p class="muted">Фосфор и калий на упаковке указаны в пересчёте на оксиды P₂O₅ и K₂O — так принято, сравнивать удобрения удобно именно по этим числам.</p>`;
    };
    presets.addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      const v = B.NPK_PRESETS[+c.dataset.i][2];
      inN.value = v[0]; inP.value = v[1]; inK.value = v[2];
      render();
    });
    [inN, inP, inK].forEach(el => el.addEventListener('input', render));
    render();
  }

  /* ================================================================== */
  /* NUTRIENTS: dose calculator                                          */
  /* ================================================================== */
  const FRACTIONS = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']];
  function spoonFraction(x) {
    let whole = Math.floor(x);
    const rest = x - whole;
    let best = FRACTIONS[0];
    FRACTIONS.forEach(f => { if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f; });
    let sym = best[1];
    if (best[0] === 1) { whole += 1; sym = ''; }
    if (!whole && !sym) sym = '⅛';
    return whole ? (sym ? `${whole}\u00a0${sym}` : `${whole}`) : sym;
  }
  function spoonText(tsp) {
    if (tsp < 0.09) return 'на кончике ложки — лучше взвесить';
    if (tsp >= 3) return `≈ ${spoonFraction(tsp / 3)}\u00a0ст.\u00a0л.`;
    return `≈ ${spoonFraction(tsp)}\u00a0ч.\u00a0л.`;
  }

  function initDose() {
    const form = $('#dose-form');
    const sel = $('#dose-fert');
    const water = $('#dose-water');
    const out = $('#dose-out');
    if (!form || !sel || !water || !out) return;
    sel.innerHTML = B.DOSE.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    sel.value = 'kno3';
    const render = () => {
      const f = B.DOSE.find(d => d.id === sel.value) || B.DOSE[0];
      const L = clamp(parseFloat(String(water.value).replace(',', '.')) || 0, 0, 1000);
      const sv = (form.querySelector('input[name="dose-strength"]:checked') || {}).value || '0.5';
      if (sv === 'foliar' && !f.foliar) {
        out.innerHTML = `<div class="spoons">Для опрыскивания это удобрение не используют.</div><p class="dose-note">${nb(f.note)}</p>`;
        return;
      }
      const k = sv === 'foliar' ? f.foliar : parseFloat(sv);
      const gL = f.gL * k;
      const grams = gL * L;
      const label = { '1': 'полная доза', '0.5': 'половина дозы', '0.25': 'четверть дозы', foliar: 'для опрыскивания' }[sv];
      out.innerHTML = `
        <div class="big">${fmtNum(grams, grams < 10 ? 1 : 0)}<small>г</small></div>
        <div class="spoons">${spoonText(grams / f.tsp)} на ${fmtNum(L, 2)}\u00a0л воды</div>
        <div class="meta">${fmtNum(gL, 2)}\u00a0г/л · ${label}</div>
        <p class="dose-note">${nb(f.note)}${sv === 'foliar' ? ' Опрыскивайте вечером или в пасмурную погоду.' : ' Вносите по влажному грунту.'}</p>`;
    };
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', e => e.preventDefault());
    render();
  }

  /* ================================================================== */
  /* PINCHING SIMULATOR                                                  */
  /* ================================================================== */
  function initSim() {
    const svg = $('#sim-svg');
    if (!svg) return;
    const ui = { week: $('#sim-week'), tips: $('#sim-tips'), leaves: $('#sim-leaves'), harvest: $('#sim-harvest'), aroma: $('#sim-aroma'), aromaBox: $('#sim-aroma-box'), msg: $('#sim-msg') };
    const MAX_DEPTH = 3;
    const MAX_NODES = [8, 6, 6, 6];
    const f2 = v => Math.round(v * 10) / 10;
    let stems = [], week = 5, harvested = 0, uid = 0, seen = new Set(), goalShown = false, focusAfter = false;

    const children = s => stems.filter(c => c.parent === s.id);
    const byId = id => stems.find(s => s.id === id);
    const leafCount = () => stems.reduce((a, s) => a + s.nodes * 2, 0);
    const tipsCount = () => stems.filter(s => s.state !== 'cut').length;
    const say = (text, tone) => { ui.msg.textContent = text; ui.msg.className = `sim-msg${tone && tone !== 'info' ? ' is-' + tone : ''}`; };

    const layout = () => {
      const geo = new Map();
      const place = (s, base, a0) => {
        const pts = [{ x: base.x, y: base.y, a: a0 }];
        let x = base.x, y = base.y;
        const L = (s.depth === 0 ? 31 : 25) * Math.pow(0.88, s.depth);
        for (let i = 1; i <= s.nodes; i++) {
          const a = a0 * Math.pow(0.8, i);
          const seg = L * Math.max(0.55, 1 - 0.07 * (i - 1));
          x += Math.sin(a) * seg;
          y -= Math.cos(a) * seg;
          pts.push({ x, y, a });
        }
        geo.set(s.id, pts);
        children(s).forEach(c => {
          const p = pts[c.at] || pts[pts.length - 1];
          place(c, p, clamp(p.a + c.side * (0.68 - 0.1 * s.depth), -1.25, 1.25));
        });
      };
      place(stems[0], { x: 0, y: -6 }, 0);
      return geo;
    };
    const fresh = key => { const isNew = !seen.has(key); seen.add(key); return isNew ? 'pop' : ''; };
    const recommended = s => {
      if (s.state === 'flower') return s.nodes >= 3 ? s.nodes - 1 : 2;
      if (s.state !== 'grow' || s.depth >= MAX_DEPTH) return 0;
      if (s.depth === 0) return s.nodes >= 4 ? 3 : 0;
      return s.nodes >= 4 ? 2 : 0;
    };

    const render = () => {
      const geo = layout();
      let minX = 0, maxX = 0, minY = 0;
      geo.forEach(pts => pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); }));
      const x0 = Math.min(-125, minX - 50), x1 = Math.max(125, maxX + 50);
      const y0 = Math.min(-225, minY - 70), y1 = 72;
      const size = Math.max(x1 - x0, y1 - y0);
      const cx = (x0 + x1) / 2;
      svg.setAttribute('viewBox', `${f2(cx - size / 2)} ${f2(y1 - size)} ${f2(size)} ${f2(size)}`);
      let stemsOut = '', leavesOut = '', tipsOut = '', nodesOut = '';
      const widths = [5.5, 4, 3, 2.4];
      stems.forEach(s => {
        const pts = geo.get(s.id);
        const last = pts[pts.length - 1];
        const deg = last.a * 180 / Math.PI;
        const ext = s.state === 'grow' ? 7 : s.state === 'cut' ? 3 : 0;
        const ex = last.x + Math.sin(last.a) * ext, ey = last.y - Math.cos(last.a) * ext;
        stemsOut += `<path class="s-stem" stroke-width="${widths[s.depth]}" d="M${pts.map(p => `${f2(p.x)} ${f2(p.y)}`).join(' L')} L${f2(ex)} ${f2(ey)}"/>`;
        const base = (s.depth === 0 ? 0.52 : 0.44) * Math.pow(0.92, s.depth);
        for (let i = 1; i <= s.nodes; i++) {
          const p = pts[i];
          const t = s.nodes - i;
          const k = s.state === 'grow' ? Math.min(1, 0.42 + 0.2 * t) : Math.min(1, 0.72 + 0.14 * t);
          const size2 = base * k;
          const fore = i % 2 === 0;
          const ang = fore ? 44 : 62;
          const pd = p.a * 180 / Math.PI;
          [-1, 1].forEach(side => {
            const key = `l${s.id}-${i}-${side}`;
            leavesOut += `<g transform="translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(pd + side * ang)})"><g class="${fresh(key)}"><use href="#leaf-shape" class="s-leaf" transform="scale(${f2(fore ? size2 * 0.74 * 100 : size2 * 100) / 100} ${f2(size2 * 100) / 100})"/></g></g>`;
          });
        }
        if (s.state === 'grow') {
          const bs = s.nodes === 0 ? 0.12 : 0.15;
          tipsOut += `<g transform="translate(${f2(ex)} ${f2(ey)}) rotate(${f2(deg)})"><g class="${fresh(`b${s.id}-${s.nodes}`)}"><use href="#leaf-shape" class="s-leaf" transform="rotate(-18) scale(${bs})"/><use href="#leaf-shape" class="s-leaf" transform="rotate(18) scale(${bs})"/></g></g>`;
        } else if (s.state === 'flower') {
          let fl = `<path class="s-stem" stroke-width="${Math.max(1.8, widths[s.depth] - 1)}" d="M0 0 L0 -40"/>`;
          for (let j = 1; j <= 4; j++) {
            const w = 7.5 - j * 1.3, y = -j * 9 + 2;
            fl += `<use href="#leaf-shape" class="s-bract" transform="translate(0 ${y + 2}) rotate(-75) scale(.09)"/><use href="#leaf-shape" class="s-bract" transform="translate(0 ${y + 2}) rotate(75) scale(.09)"/>`;
            fl += `<ellipse class="s-flower" cx="${f2(-w)}" cy="${y}" rx="${f2(w * 0.75)}" ry="2.6"/><ellipse class="s-flower" cx="${f2(w)}" cy="${y}" rx="${f2(w * 0.75)}" ry="2.6"/>`;
          }
          fl += '<circle class="s-flower" cx="0" cy="-42" r="2.4"/>';
          tipsOut += `<g transform="translate(${f2(last.x)} ${f2(last.y)}) rotate(${f2(deg)})"><g class="${fresh('f' + s.id)}">${fl}</g></g>`;
        } else if (s.state === 'cut') {
          tipsOut += `<g transform="translate(${f2(ex)} ${f2(ey)}) rotate(${f2(deg)})"><line class="s-stub" x1="-4" y1="0" x2="4" y2="0"/></g>`;
        }
        if (s.state !== 'cut') {
          const rec = recommended(s);
          for (let i = 1; i <= s.nodes; i++) {
            const p = pts[i];
            const pd = p.a * 180 / Math.PI;
            nodesOut += `<g class="s-node${i === rec ? ' is-rec' : ''}" tabindex="0" role="button" data-stem="${s.id}" data-node="${i}" aria-label="Срезать над ${i}-й парой листьев" transform="translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(pd)})"><circle class="hit" r="11"/><line class="cut" x1="-14" y1="-7" x2="14" y2="-7"/><circle class="dot" r="4"/></g>`;
          }
        }
      });
      const pot = '<path class="s-pot" d="M-62 2 L62 2 L50 66 L-50 66 Z"/><rect class="s-rim" x="-68" y="-8" width="136" height="14" rx="4"/><ellipse class="s-soil" cx="0" cy="-7" rx="60" ry="4.5"/>';
      svg.innerHTML = pot + stemsOut + leavesOut + tipsOut + nodesOut;
      const flowering = stems.some(s => s.state === 'flower');
      ui.week.textContent = `Неделя ${week} после всходов`;
      ui.tips.textContent = String(tipsCount());
      ui.leaves.textContent = String(leafCount());
      ui.harvest.textContent = String(harvested);
      ui.aroma.textContent = flowering ? 'горчит' : 'отличный';
      ui.aromaBox.classList.toggle('is-bad', flowering);
      if (focusAfter) {
        focusAfter = false;
        const n = svg.querySelector('.s-node.is-rec') || svg.querySelector('.s-node');
        if (n) n.focus();
      }
    };

    const checkGoal = () => {
      if (!goalShown && tipsCount() >= 8 && !stems.some(s => s.state === 'flower')) {
        goalShown = true;
        say('Готово: 8 верхушек роста — это уже настоящий куст! Дальше просто срезайте верхушки на урожай каждые 1–2 недели и не давайте ему цвести.', 'good');
      }
    };

    const pinch = (id, k) => {
      HAP.impact();
      const s = byId(id);
      if (!s || s.state === 'cut') return;
      if (k < 2) { say('Слишком низко: под срезом должно остаться минимум 2 пары листьев. Иначе новые побеги будут слабыми, а куст потеряет «фабрику питания».', 'warn'); return; }
      if (s.state === 'grow' && s.nodes < 3) { say('Рано: пусть побег наберёт хотя бы 3 пары листьев — тогда срез даст крепкие ветки.', 'warn'); return; }
      const before = leafCount();
      const wasFlower = s.state === 'flower';
      let removed = 2 * (s.nodes - k);
      const doomed = [];
      const collect = (p, minAt) => children(p).forEach(c => { if (minAt === null || c.at > minAt) { doomed.push(c); collect(c, null); } });
      collect(s, k);
      doomed.forEach(c => { removed += 2 * c.nodes; });
      stems = stems.filter(c => !doomed.includes(c));
      s.nodes = k;
      harvested += removed;
      let text, tone = wasFlower ? 'good' : 'info';
      const got = removed ? `Собрано листьев: ${removed}. ` : 'Прищипнута только верхушка. ';
      if (s.depth < MAX_DEPTH) {
        s.state = 'cut';
        stems.push({ id: ++uid, parent: s.id, at: k, side: -1, depth: s.depth + 1, nodes: 0, state: 'grow' }, { id: ++uid, parent: s.id, at: k, side: 1, depth: s.depth + 1, nodes: 0, state: 'grow' });
        text = `Срез над ${k}-й парой. ${wasFlower ? 'Соцветие удалено. ' : ''}${got}Из пазух под срезом пойдут 2 новых побега — нажмите «Неделя вперёд».`;
      } else {
        s.state = 'grow';
        text = `${wasFlower ? 'Соцветие удалено. ' : ''}${got}Куст уже густой: дальше в тренажёре ветвление не рисуем, срезки идут в урожай.`;
      }
      if (before > 0 && removed > before / 3) { text += ' Но это больше трети куста — растению понадобится время на восстановление.'; tone = 'warn'; }
      say(text, tone);
      render();
      checkGoal();
    };

    const nextWeek = () => {
      week += 1;
      const bloomed = [];
      stems.forEach(s => {
        if (s.state !== 'grow') return;
        if (s.nodes < MAX_NODES[s.depth]) s.nodes += 1; else { s.state = 'flower'; bloomed.push(s); }
      });
      const flowering = stems.filter(s => s.state === 'flower').length;
      const ready = stems.filter(s => s.state === 'grow' && s.depth < MAX_DEPTH && s.nodes >= 4).length;
      if (bloomed.length) say(`Зацвело побегов: ${bloomed.length}. Срежьте соцветия вместе с парой листьев под ними — нажмите на узел чуть ниже цветка.`, 'bad');
      else if (flowering) say('Куст цветёт — листья грубеют и горчат. Срежьте соцветия!', 'bad');
      else if (ready) say(`Готово к прищипыванию: ${ready} ${plural(ready, 'побег', 'побега', 'побегов')} с 4 парами листьев. Срезайте над 2–3-й парой — пульсирующая точка подскажет.`, 'info');
      else say('Куст растёт, новые побеги набирают листья.', 'info');
      render();
      checkGoal();
    };

    const reset = () => {
      uid = 0; week = 5; harvested = 0; goalShown = false; seen = new Set();
      stems = [{ id: ++uid, parent: null, at: 0, side: 0, depth: 0, nodes: 4, state: 'grow' }];
      say('Пятая неделя после всходов: у стебля 4 пары настоящих листьев. Самое время для первого прищипывания — срежьте над 2-й или 3-й парой.', 'info');
      render();
    };

    svg.addEventListener('click', e => { const n = e.target.closest('.s-node'); if (n) pinch(+n.dataset.stem, +n.dataset.node); });
    svg.addEventListener('keydown', e => {
      const n = e.target.closest && e.target.closest('.s-node');
      if (!n || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      focusAfter = true;
      pinch(+n.dataset.stem, +n.dataset.node);
    });
    $('#sim-week-btn').addEventListener('click', nextWeek);
    $('#sim-reset').addEventListener('click', reset);
    reset();
  }

  /* ================================================================== */
  /* SEEDS: germination test                                             */
  /* ================================================================== */
  function initGerm() {
    const r = $('#germ-count');
    const out = $('#germ-out');
    if (!r || !out) return;
    const render = () => {
      const v = +r.value;
      $('#germ-val').textContent = String(v);
      let text, cls = '';
      if (v >= 8) text = `Всхожесть ${v * 10}\u00a0% — отличные семена. Сейте как обычно, по 2–3 в ячейку.`;
      else if (v >= 5) { text = `Всхожесть ${v * 10}\u00a0% — средняя. Сейте гуще, по 3–4 семени в ячейку.`; cls = 'is-warn'; }
      else { text = `Всхожесть ${v * 10}\u00a0% — слабая. Лучше купить свежие семена, а ценный сорт сеять очень густо.`; cls = 'is-bad'; }
      out.textContent = text;
      out.className = 'germ-out' + (cls ? ' ' + cls : '');
    };
    r.addEventListener('input', render);
    render();
  }

  /* ================================================================== */
  /* PROBLEMS                                                            */
  /* ================================================================== */
  let selectSymptom = () => {};
  // pictures come from the chapter's model file (src/labs/problemy/_shared.js), drawn by BasilScience
  function initDiagnostics() {
    const groups = $('#diag-groups');
    const result = $('#diag-result');
    if (!groups || !result) return;
    const all = [];
    // a gallery of symptoms: every card shows what it looks like
    groups.innerHTML = B.DIAG.map(g => `
      <div class="diag-group">
        <h4>${g.group}</h4>
        <div class="diag-row">${g.items.map(it => { all.push(it); return `<button class="diag-card" type="button" data-id="${it.id}" aria-pressed="false"><span class="diag-ill" data-ill="sym:${it.id}" aria-hidden="true"></span><span class="diag-name">${it.title}</span></button>`; }).join('')}</div>
      </div>`).join('');
    const cards = $$('.diag-card', groups);
    selectSymptom = (id, scroll) => {
      const it = all.find(x => x.id === id) || all[0];
      cards.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id === it.id)));
      result.innerHTML = `
        <div class="diag-hero"><span class="diag-hero-ill" data-ill="sym:${it.id}"></span><div class="diag-hero-t"><p class="eyebrow">Симптом</p><h3>${it.title}</h3>
        <p class="hint">${it.causes.length > 1 ? `${it.causes.length} ${plural(it.causes.length, 'возможная причина', 'возможные причины', 'возможных причин')}, от частой к редкой` : 'Наиболее вероятная причина'}</p></div></div>
        <ol class="causes">${it.causes.map((c, i) => `
          <li class="cause">
            <header><span class="cause-n">${i + 1}</span><h4>${c.name}</h4><span class="prob p-${c.p}">${B.P_LABEL[c.p]}</span></header>
            <p><b>Как проверить:</b> ${nb(c.check)}</p>
            <p><b>Что делать:</b> ${nb(c.fix)}</p>
          </li>`).join('')}</ol>`;
      paintIll(result, true);
      if (scroll && window.matchMedia('(max-width: 940px)').matches) result.scrollIntoView({ block: 'start', behavior: smooth() });
    };
    cards.forEach(c => c.addEventListener('click', () => selectSymptom(c.dataset.id, true)));
    selectSymptom('low-yellow', false);
    // the tiles on the screen are drawn at once, the rest as they come near: not two dozen pictures in one go
    paintIll(groups);

    // diseases and pests: as seen on the plant and under a lens
    const card = (d, i, kind) => `
      <article class="card ref-card" id="${kind}-${i}">
        <div class="ref-ills">
          <figure><span class="ref-ill" data-ill="${kind}:${i}-plant"></span><figcaption>${kind === 'dis' && i === 4 ? 'здоровые корни' : 'на растении'}</figcaption></figure>
          <figure><span class="ref-ill" data-ill="${kind}:${i}-zoom"></span><figcaption>${kind === 'dis' && i === 4 ? 'при гнили' : 'под лупой'}</figcaption></figure>
        </div>
        <h4>${icon(kind === 'dis' ? 'alert' : 'bug')}${d.name}</h4>
        <span class="latin">${d.latin}</span>
        <dl>
          <div><dt>Признаки</dt><dd>${nb(d.sign)}</dd></div>
          <div><dt>Что делать</dt><dd>${nb(d.fix)}</dd></div>
          <div><dt>Профилактика</dt><dd>${nb(d.prevent)}</dd></div>
        </dl>
      </article>`;
    const dg = $('#disease-grid');
    if (dg) { dg.innerHTML = B.DISEASES.map((d, i) => card(d, i, 'dis')).join(''); paintIll(dg); }
    const pg = $('#pest-grid');
    if (pg) { pg.innerHTML = B.PESTS.map((d, i) => card(d, i, 'pest')).join(''); paintIll(pg); }
    const tt = $('#treat-table');
    if (tt) tt.innerHTML = `<thead><tr><th scope="col">Средство</th><th scope="col">От чего</th><th scope="col">Как работает</th></tr></thead><tbody>${B.TREATMENTS.map(([a, b, c]) => `<tr><td><b>${a}</b></td><td data-label="От чего">${b}</td><td data-label="Как работает">${nb(c)}</td></tr>`).join('')}</tbody>`;
  }
  /* ================================================================== */
  /* REFERENCE: glossary, checklist                                      */
  /* ================================================================== */
  function initGlossary() {
    const box = $('#glossary');
    const q = $('#gloss-q');
    if (!box) return;
    const sorted = B.GLOSSARY.map((g, i) => ({ t: g[0], d: g[1], i })).sort((a, b) => a.t.localeCompare(b.t, 'ru'));
    box.innerHTML = sorted.map(g => `<div class="gloss-item" id="g-${g.i}"><dt>${g.t}</dt><dd>${nb(g.d)}</dd></div>`).join('') + '<p class="gloss-empty" hidden>Такого термина нет. Попробуйте поиск по всему гиду.</p>';
    const items = $$('.gloss-item', box);
    const empty = $('.gloss-empty', box);
    if (q) q.addEventListener('input', () => {
      const v = norm(q.value.trim());
      let n = 0;
      items.forEach(it => { const show = !v || norm(it.textContent).includes(v); it.hidden = !show; if (show) n++; });
      empty.hidden = n > 0;
    });
  }

  function initChecklist() {
    const wrap = $('#check-groups');
    if (!wrap) return;
    const bar = $('#check-bar');
    const count = $('#check-count');
    const KEY = 'basil-checklist-v1';
    const state = store.get(KEY, {}) || {};
    wrap.innerHTML = B.CHECKLIST.map(g => `
      <div class="card check-group">
        <h4>${g.title}</h4>
        <ul>${g.items.map(([id, text]) => `
          <li><label class="check-item" for="ck-${id}">
            <input type="checkbox" id="ck-${id}" data-id="${id}"${state[id] ? ' checked' : ''}>
            <span class="check-box" aria-hidden="true">${icon('check')}</span>
            <span>${nb(text)}</span>
          </label></li>`).join('')}</ul>
      </div>`).join('');
    const boxes = $$('input[type="checkbox"]', wrap);
    const update = () => {
      const done = boxes.filter(b => b.checked).length;
      bar.style.width = `${Math.round(done / boxes.length * 100)}%`;
      count.textContent = done === boxes.length ? `Все ${boxes.length} шагов выполнены — отличный сезон!` : `Выполнено ${done} из ${boxes.length}`;
    };
    wrap.addEventListener('change', e => {
      const b = e.target;
      if (!b.dataset || !b.dataset.id) return;
      state[b.dataset.id] = b.checked;
      store.set(KEY, state);
      update();
      if (b.checked && boxes.every(x => x.checked)) setTimeout(() => HAP.success(), 120);
    });
    $('#check-reset').addEventListener('click', () => {
      boxes.forEach(b => { b.checked = false; state[b.dataset.id] = false; });
      store.set(KEY, state);
      update();
    });
    update();
  }

  function initRecipes() {
    const book = $('#recipe-book');
    if (!book || !B.RECIPES) return;
    const cats = Object.fromEntries(B.RECIPE_CATS.map(([id, name, ic]) => [id, { name, ic }]));
    const linkLabel = href => {
      const el = document.getElementById(href.slice(1));
      if (!el) return (PAGES && PAGES.titles && PAGES.titles[href.slice(1)]) || 'подробнее';
      if (el.classList.contains('deep')) return 'Глубже: ' + el.dataset.short;
      const ch = chapterById(el.closest('[data-view]').dataset.view);
      return `${ch ? ch.title : ''} · ${el.dataset.title}`;
    };
    const count = c => B.RECIPES.filter(r => c === 'all' || r.cat === c).length;
    const card = r => `
      <details class="recipe-card${r.feat ? ' is-feat' : ''}" id="r-${r.id}" data-cat="${r.cat}"${r.feat ? ' open' : ''}>
        <summary><span class="rc-sum">
          <span class="rc-ico" aria-hidden="true">${icon(cats[r.cat].ic)}</span>
          <span class="rc-head"><span class="rc-cat">${cats[r.cat].name}<span class="rc-time"> · ${nb(r.time)}</span></span><span class="rc-title">${r.title}</span><span class="rc-orig">${r.orig}</span></span>
          <span class="deep-plus" aria-hidden="true"></span>
        </span></summary>
        <div class="rc-body">
          <p class="rc-facts"><span>${icon('cal')}${nb(r.time)}</span><span>${icon('leaf')}${r.basil}</span></p>
          <div class="recipe-grid">
            <ul class="ingredients">${r.ing.map(([n, v]) => `<li><span>${n}</span>${v ? `<span>${nb(v)}</span>` : ''}</li>`).join('')}</ul>
            <ol class="rc-steps">${r.steps.map(x => `<li>${nb(x)}</li>`).join('')}</ol>
          </div>
          ${r.tip ? `<p class="rc-tip">${icon('info')}<span>${nb(r.tip)}</span></p>` : ''}
          <div class="rc-sci">
            <span class="rc-sci-k">${icon('hex')}Наука рецепта</span>
            <p>${nb(r.sci[0])}</p>
            <a href="${r.sci[1]}">${esc(linkLabel(r.sci[1]))} <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </details>`;
    book.innerHTML = `
      <div class="chips-row rb-filter" role="group" aria-label="Разделы книги рецептов">
        <button type="button" class="chip" data-cat="all" aria-pressed="true">Все <b>${count('all')}</b></button>
        ${B.RECIPE_CATS.map(([id, name, ic]) => `<button type="button" class="chip" data-cat="${id}" aria-pressed="false">${icon(ic)}${name} <b>${count(id)}</b></button>`).join('')}
      </div>
      <div class="rb-grid">${B.RECIPES.map(card).join('')}</div>`;
    const cards = $$('.recipe-card', book);
    $('.rb-filter', book).addEventListener('click', e => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      const c = b.dataset.cat;
      $$('.rb-filter [data-cat]', book).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      cards.forEach(el => { el.hidden = c !== 'all' && el.dataset.cat !== c; });
    });
  }

  /* ================================================================== */
  /* MY BASIL: the block on the home page and the sheet of one bush      */
  /* ================================================================== */
  const ago = (d, day) => { const n = dayDiff(d, day); return n <= 0 ? 'сегодня' : n === 1 ? 'вчера' : daysWord(n) + ' назад'; };
  // when a task is due, said shortly: «просрочено на 3 дня», «до 12 октября», «в четверг»
  const WEEKDAY = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
  function taskWhen(t, day) {
    if (t.state === 'late') return 'просрочено на ' + daysWord(dayDiff(t.once ? t.to : t.due, day));
    if (t.state === 'now') return !t.once || dayDiff(day, t.to) <= 0 ? 'сегодня' : dayDiff(t.from, t.to) > 40 ? 'в эти месяцы' : 'сейчас, до ' + fd(t.to);
    const n = dayDiff(day, t.due);
    return n === 1 ? 'завтра' : n < 7 ? WEEKDAY[t.due.getDay()] : fd(t.due);
  }
  const plantPic = (p, day) => { const v = gardenVariety(p); return `<span class="g-pic" data-leaf="${v ? v.leaf : 'green'}">${miniPlant(plantStage(p, day).pic)}</span>`; };
  const plantMeta = (p, day) => {
    const v = gardenVariety(p), st = plantStage(p, day);
    const start = B.GARDEN.starts.find(s => s.id === p.start);
    return [v && v.name !== p.name ? `«${esc(v.name)}»` : '', `${st.age + 1}-й день`, st.word, start ? start.short : ''].filter(Boolean).join(' · ');
  };
  function taskHtml(p, t, day) {
    return `<li class="g-task is-${t.state}">
      <div class="g-task-t"><b>${esc(t.title)}</b><small>${taskWhen(t, day)}</small><p>${nb(t.text)}</p></div>
      <div class="g-task-a"><a class="g-how" href="#${t.link}">Как?</a><button class="g-done" type="button" data-plant="${p.id}" data-task="${t.key}">${icon('check')}<span>Сделано</span></button></div>
    </li>`;
  }
  const notesHtml = p => `<div class="g-notes">${B.GARDEN.notes.map(n => `<button class="g-note" type="button" data-plant="${p.id}" data-note="${n.k}">${icon(n.icon)}<span>${n.name}</span></button>`).join('')}</div>`;
  // shared: the lamp is one for the whole windowsill, so on the home page it is asked once for all bushes
  const shared = t => /^light-/.test(t.key);
  function weekHtml(p, day, common) {
    const w = plantWeek(p, day);
    if (common) w.now = w.now.filter(t => !shared(t));
    const water = lastNote(p, 'water');
    return (w.now.length ? `<ul class="g-tasks">${w.now.map(t => taskHtml(p, t, day)).join('')}</ul>` : `<p class="g-free">На этой неделе дел по плану нет. Поливайте, когда верхние 1–2&nbsp;см грунта сухие.</p>`) +
      (w.next ? `<p class="g-next">Дальше: ${esc(w.next.title.charAt(0).toLowerCase() + w.next.title.slice(1))} — ${fd(w.next.due)}</p>` : '') +
      notesHtml(p) + `<p class="g-water">${water ? 'Полит ' + ago(water, day) + '.' : 'Полив ещё не отмечен.'} <a href="#uhod-poliv">Как понять, что пора</a></p>`;
  }
  function gardenCard(p, day) {
    return `<article class="g-card" data-plant-card="${p.id}">
      <div class="g-top">${plantPic(p, day)}<div class="g-id"><h3><button class="g-open" type="button" data-plant-open="${p.id}">${esc(p.name)}</button></h3><p>${plantMeta(p, day)}</p></div></div>
      ${weekHtml(p, day, true)}
    </article>`;
  }

  // the week of every bush, or an invitation to add the first one: on the home page (#garden-home) and on the
  // page «Мой базилик» (#garden-page), where the cover already says whose bushes these are
  function renderGardenBox(box, page) {
    const day = today(), [mon, sun] = weekOf(day);
    const { plants } = gardenLoad();
    const hid = page ? 'moy-page-h' : 'moy-h';
    const keep = `<p class="g-keep"><button type="button" class="g-link" data-garden-export>Сохранить копию</button><button type="button" class="g-link" data-garden-import>Загрузить копию</button><span>Кусты хранятся только в этом браузере. Safari стирает данные сайта, который не открывали неделю, — копия в файле их сбережёт.</span></p>`;
    // from the home page to the rest of it: the weather and the experiments live on the page
    const more = page ? '' : `<p class="g-more"><a class="g-link" href="#moy">Все кусты, погода и опыты${icon('arrow-r')}</a></p>`;
    if (!plants.length) {
      box.innerHTML = `<div class="g-empty card">
        <span class="g-pic g-pic-big" data-leaf="green">${miniPlant('harvest')}</span>
        <div><h2 id="${hid}">${page ? 'Ваш первый <em>куст</em>' : 'Мой <em>базилик</em>'}</h2>
        <p>Добавьте свой куст — гид подскажет, что делать с ним на этой неделе: когда прищипнуть, подкормить и срезать.</p>
        <div class="g-starts">${B.GARDEN.starts.filter(s => s.id !== 'seedling').map(s => `<button class="chip" type="button" data-garden-add="${s.id}">${icon(s.id === 'seed' ? 'seed' : s.id === 'shop' ? 'bag' : 'cup')}${s.id === 'shop' ? 'Купил горшок в магазине' : s.id === 'cutting' ? 'Укоренил черенок' : s.name}</button>`).join('')}</div>
        <p class="g-keep"><button type="button" class="g-link" data-garden-import>Загрузить копию</button></p>${more}</div>
      </div>`;
      fixLinks(box);
      return;
    }
    const common = plants.map(p => plantWeek(p, day).now.find(shared)).filter(Boolean)[0];
    box.innerHTML = `<div class="block-head"><h2 id="${hid}">${page ? 'На этой <em>неделе</em>' : 'Мой <em>базилик</em>'}</h2><p>${page ? fr(mon, sun) : 'На этой неделе · ' + fr(mon, sun)}</p></div>
      ${common ? `<ul class="g-tasks g-common">${taskHtml({ id: '*' }, Object.assign({}, common, { title: common.title + ' для всех кустов на окне' }), day)}</ul>` : ''}
      <div class="g-list">${plants.map(p => gardenCard(p, day)).join('')}</div>
      <div class="g-foot"><button class="btn btn-ghost btn-small" type="button" data-garden-add="seed">${icon('sprout')}Добавить куст</button>${keep}</div>${more}`;
    fixLinks(box);
  }
  // what is due this week over all the bushes (late ones too): the badge on the header button
  function gardenDue() {
    const day = today();
    const lists = gardenLoad().plants.map(p => plantWeek(p, day).now);
    const common = lists.some(l => l.some(shared));
    return lists.reduce((n, l) => n + l.filter(t => !shared(t)).length, 0) + (common ? 1 : 0);
  }
  function renderGardenHome() {
    const home = $('#garden-home'), page = $('#garden-page');
    if (home) renderGardenBox(home, false);
    if (page) renderGardenBox(page, true);
    const n = gardenDue();
    $$('.garden-badge').forEach(b => { b.textContent = n > 9 ? '9+' : String(n); b.hidden = !n; });
    $$('[data-garden-link]').forEach(a => a.setAttribute('aria-label', n ? `Мой базилик: ${n} ${plural(n, 'дело', 'дела', 'дел')} на неделе` : 'Мой базилик'));
  }

  /* ---------------- the sheet of one bush ---------------- */
  let gardenOpen = null; // { id } of the bush in the sheet, or { form, id? }
  function varietyOptions(sel) {
    return `<option value="">Не знаю</option>` + B.VARIETY_TYPES.map(t => {
      const vs = B.VARIETIES.filter(v => v.type === t.id);
      return vs.length ? `<optgroup label="${esc(t.name)}">${vs.map(v => `<option${v.name === sel ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</optgroup>` : '';
    }).join('');
  }
  function renderGardenForm(p) {
    const G = B.GARDEN;
    const seg = (name, list, cur) => `<div class="seg g-seg g-seg-${list.length}" role="group" aria-labelledby="g-${name}-l">${list.map(x => `<button type="button" data-g-${name}="${x.id}" aria-pressed="${x.id === cur}">${x.name}</button>`).join('')}</div>`;
    const startDef = G.starts.find(s => s.id === p.start) || G.starts[0];
    return `<form class="g-form" id="g-form" novalidate>
      <div class="field"><label for="g-name">Как назовём</label><input type="text" id="g-name" maxlength="40" autocomplete="off" value="${esc(p.name || '')}" placeholder="Например, гвоздичный на кухне"></div>
      <div class="field"><label for="g-variety">Сорт</label><select id="g-variety">${varietyOptions(p.variety)}</select></div>
      <div class="field"><span class="label" id="g-start-l">С чего начали</span>${seg('start', G.starts, p.start)}</div>
      <div class="field"><span class="label" id="g-place-l">Где растёт</span>${seg('place', G.places, p.place)}</div>
      <div class="field" id="g-preset-f"${p.place === 'home' ? ' hidden' : ''}><label for="g-preset">Климат — от него сроки высадки и осенних заморозков</label><select id="g-preset">${B.PRESETS.filter(x => x.lf).map(x => `<option value="${x.id}"${x.id === (p.preset || 'temperate') ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select><small class="field-note" id="g-cities">Например, ${esc(B.PRESETS.find(x => x.id === (p.preset || 'temperate')).cities)}</small></div>
      <div class="field"><label for="g-date" id="g-date-l">${startDef.date}</label><input type="date" id="g-date" value="${p.date || toISO(today())}" max="${toISO(addDays(today(), 60))}"></div>
      <div class="g-form-a"><button class="btn btn-primary btn-small" type="submit">${icon('check')}Сохранить</button><button class="btn btn-ghost btn-small" type="button" data-g-cancel>Отмена</button></div>
    </form>`;
  }
  const NOTE_NAMES = { water: 'Полил', feed: 'Подкормил', pinch: 'Прищипнул', cut: 'Срезал', buds: 'Убрал бутоны', flush: 'Промыл грунт', note: 'Заметка' };
  function renderGardenPlant(p) {
    const day = today(), v = gardenVariety(p);
    const all = plantTasks(p, day);
    const STATE = { done: 'сделано', before: 'до дневника', missed: 'пропущено', late: 'просрочено', now: 'сейчас', soon: '' };
    const plan = all.filter(t => t.once).map(t => `<li class="g-step is-${t.state}"><span class="g-step-d">${t.state === 'done' ? fd(t.done) : fr(t.from, t.to)}</span><span class="g-step-t">${esc(t.title)}${STATE[t.state] ? `<small>${STATE[t.state]}</small>` : ''}</span></li>`).join('') +
      all.filter(t => t.repeat).map(t => `<li class="g-step is-repeat"><span class="g-step-d">${fd(t.due)}</span><span class="g-step-t">${esc(t.title)}<small>и дальше по кругу</small></span></li>`).join('');
    const tasks = Object.fromEntries(all.map(t => [t.key, t.title]));
    const log = (p.log || []).map((e, i) => Object.assign({ i, date: fromISO(e.d) }, e)).filter(e => e.date).sort((a, b) => b.date - a.date || b.i - a.i);
    const grams = log.reduce((s, e) => s + (e.k === 'cut' && +e.g > 0 ? +e.g : 0), 0);
    const what = e => (e.k === 'task' ? 'Сделано: ' + esc((tasks[e.task] || 'дело по плану').toLowerCase()) : (NOTE_NAMES[e.k] || 'Заметка') + (e.task && tasks[e.task] ? ` (${esc(tasks[e.task].toLowerCase())})` : '')) + (e.k === 'cut' && +e.g > 0 ? `, ${+e.g} г` : '') + (e.t ? ` — ${esc(e.t)}` : '');
    return `<div class="g-sheet">
      <div class="g-top">${plantPic(p, day)}<div class="g-id"><h3>${esc(p.name)}</h3><p>${plantMeta(p, day)}</p></div><button class="btn btn-ghost btn-small g-edit" type="button" data-g-edit>Изменить</button></div>
      ${v ? `<div class="callout"><svg class="ico"><use href="#i-leaf"/></svg><p><b>«${esc(v.name)}».</b> ${nb(v.care)}</p></div>` : ''}
      <section class="g-sec"><h4>На этой неделе</h4>${weekHtml(p, day)}</section>
      <section class="g-sec"><h4>План куста</h4><ol class="g-plan">${plan}</ol></section>
      <section class="g-sec"><h4>Дневник${grams ? `<small>собрано ${grams} г</small>` : ''}</h4>
        <form class="g-log-form" id="g-log-form">
          <select id="g-log-k" aria-label="Что сделали">${['water', 'feed', 'pinch', 'cut', 'buds', 'flush', 'note'].map(k => `<option value="${k}">${NOTE_NAMES[k]}</option>`).join('')}</select>
          <input type="date" id="g-log-d" value="${toISO(day)}" max="${toISO(day)}" aria-label="Когда">
          <input type="number" id="g-log-g" min="0" max="5000" step="1" inputmode="numeric" placeholder="граммы" aria-label="Сколько граммов срезали" hidden>
          <input type="text" id="g-log-t" maxlength="120" placeholder="Заметка, если нужна" aria-label="Заметка">
          <button class="btn btn-ghost btn-small" type="submit">Записать</button>
        </form>
        ${log.length ? `<ul class="g-log">${log.map(e => `<li><span class="g-log-d">${fd(e.date)}</span><span>${what(e)}</span><button class="g-log-x" type="button" data-log-del="${e.i}" aria-label="Удалить запись">${icon('close')}</button></li>`).join('')}</ul>` : '<p class="muted g-log-empty">Записей пока нет: отмечайте «Сделано» и «Полил» — гид будет считать от них.</p>'}
      </section>
      <p class="g-del-row"><button class="g-link g-del" type="button" data-g-del>Удалить куст</button></p>
    </div>`;
  }
  function renderGardenSheet() {
    const box = $('#garden-detail'), title = $('#sheet-garden-h');
    if (!box || !gardenOpen) return;
    const { plants } = gardenLoad();
    const p = gardenOpen.id && plants.find(x => x.id === gardenOpen.id);
    if (gardenOpen.form) {
      title.textContent = p ? 'Изменить куст' : 'Новый куст';
      box.innerHTML = renderGardenForm(p || gardenOpen.draft);
    } else if (p) {
      title.textContent = 'Мой куст';
      box.innerHTML = renderGardenPlant(p);
    } else {
      gardenOpen = null;
      closeSheet($('#sheet-garden'));
      return;
    }
    fixLinks(box);
  }
  function openGarden(state) {
    // over another sheet (a variety card): that one goes away at once
    $$('dialog.sheet[open]').forEach(d => { if (d.id !== 'sheet-garden') closeSheet(d, true); });
    gardenOpen = state;
    renderGardenSheet();
    openSheet('sheet-garden');
    const sc = $('#sheet-garden .sheet-inner');
    if (sc) sc.scrollTop = 0;
  }

  /* ---------------- a copy in a file ---------------- */
  function exportGarden() {
    const data = JSON.stringify(Object.assign(gardenLoad(), { saved: toISO(today()) }), null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = `moy-bazilik-${toISO(today())}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('Копия сохранена в файл');
  }
  // a copy read back: only bushes that make sense, and only after a yes
  function importGarden(text) {
    let s = null;
    try { s = JSON.parse(text); } catch (e) { s = null; }
    const starts = B.GARDEN.starts.map(x => x.id), places = B.GARDEN.places.map(x => x.id);
    const plants = (s && Array.isArray(s.plants) ? s.plants : []).filter(p => p && fromISO(p.date) && starts.includes(p.start)).map(p => ({
      id: String(p.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(0, 24),
      name: String(p.name || 'Мой базилик').slice(0, 40), variety: String(p.variety || '').slice(0, 40),
      start: p.start, place: places.includes(p.place) ? p.place : 'home', preset: String(p.preset || 'temperate').slice(0, 16),
      date: p.date, added: fromISO(p.added) ? p.added : p.date,
      log: (Array.isArray(p.log) ? p.log : []).filter(e => e && fromISO(e.d) && typeof e.k === 'string').map(e => {
        const o = { d: e.d, k: e.k.slice(0, 12) };
        if (e.task) o.task = String(e.task).slice(0, 24);
        if (+e.g > 0) o.g = Math.min(5000, Math.round(+e.g));
        if (e.t) o.t = String(e.t).slice(0, 120);
        return o;
      })
    }));
    if (!plants.length) { toast('В файле нет кустов'); return; }
    const n = plants.length, mine = gardenLoad().plants.length;
    if (mine && !window.confirm(`Заменить ваши кусты (${mine}) кустами из копии (${n})?`)) return;
    gardenSave({ v: 1, plants });
    toast(`Загружено: ${n} ${plural(n, 'куст', 'куста', 'кустов')}`);
  }

  function initGarden() {
    // the page's own models (the weather, the experiments) read and write the bushes through this
    window.BasilGarden = {
      load: gardenLoad, save: gardenSave, tasks: plantTasks, week: plantWeek, stage: plantStage, open: openGarden,
      on: fn => document.addEventListener('basil:garden', fn)
    };
    renderGardenHome();
    document.addEventListener('basil:garden', () => { renderGardenHome(); if (gardenOpen && !gardenOpen.form && $('#sheet-garden').open) { const sc = $('#sheet-garden .sheet-inner'), y = sc ? sc.scrollTop : 0; renderGardenSheet(); if (sc) sc.scrollTop = y; } });
    // a day passed while the page stayed open: the week moves on
    document.addEventListener('visibilitychange', () => { if (!document.hidden) renderGardenHome(); });
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.hidden = true;
    document.body.appendChild(file);
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => importGarden(String(r.result));
      r.readAsText(f);
      file.value = '';
    });
    const findPlant = id => { const s = gardenLoad(); return { s, p: s.plants.find(x => x.id === id) }; };
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-garden-add], [data-plant-open], .g-done, .g-note, [data-garden-export], [data-garden-import], [data-g-edit], [data-g-del], [data-g-cancel], [data-log-del], [data-g-start], [data-g-place]');
      if (!t) return;
      if (t.matches('[data-garden-add]')) {
        openGarden({ form: true, draft: { start: t.dataset.gardenAdd || 'seed', variety: t.dataset.variety || '', place: 'home', name: '' } });
      } else if (t.matches('[data-plant-open]')) {
        openGarden({ id: t.dataset.plantOpen });
      } else if (t.matches('.g-done') && t.dataset.plant === '*') {
        // a task shared by the bushes on the windowsill: done for each that has it
        const s = gardenLoad();
        let title = '';
        s.plants.forEach(p => { const task = plantTasks(p, today()).find(x => x.key === t.dataset.task && x.state !== 'done'); if (task) { plantDone(p, task); title = task.title; } });
        if (!title) return;
        HAP.success();
        gardenSave(s);
        toast('Отмечено: ' + title.charAt(0).toLowerCase() + title.slice(1));
      } else if (t.matches('.g-done')) {
        const { s, p } = findPlant(t.dataset.plant);
        const task = p && plantTasks(p, today()).find(x => x.key === t.dataset.task);
        if (!task) return;
        plantDone(p, task);
        HAP.success();
        gardenSave(s);
        toast('Отмечено: ' + task.title.charAt(0).toLowerCase() + task.title.slice(1));
      } else if (t.matches('.g-note')) {
        const { s, p } = findPlant(t.dataset.plant);
        if (!p) return;
        plantNote(p, { k: t.dataset.note });
        gardenSave(s);
        toast('Записано: ' + NOTE_NAMES[t.dataset.note].toLowerCase());
      } else if (t.matches('[data-garden-export]')) {
        exportGarden();
      } else if (t.matches('[data-garden-import]')) {
        file.click();
      } else if (t.matches('[data-g-edit]')) {
        openGarden({ form: true, id: gardenOpen && gardenOpen.id });
      } else if (t.matches('[data-g-cancel]')) {
        if (gardenOpen && gardenOpen.id) openGarden({ id: gardenOpen.id }); else closeSheet($('#sheet-garden'));
      } else if (t.matches('[data-g-del]')) {
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p || !window.confirm(`Удалить «${p.name}» вместе с дневником?`)) return;
        s.plants = s.plants.filter(x => x !== p);
        gardenOpen = null;
        closeSheet($('#sheet-garden'));
        gardenSave(s);
      } else if (t.matches('[data-log-del]')) {
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p) return;
        p.log.splice(+t.dataset.logDel, 1);
        gardenSave(s);
      } else if (t.matches('[data-g-start], [data-g-place]')) {
        // the form's segmented choices
        const group = t.parentElement;
        $$('button', group).forEach(b => b.setAttribute('aria-pressed', String(b === t)));
        if (t.dataset.gStart) $('#g-date-l').textContent = B.GARDEN.starts.find(x => x.id === t.dataset.gStart).date;
        if (t.dataset.gPlace) $('#g-preset-f').hidden = t.dataset.gPlace === 'home';
      }
    });
    document.addEventListener('change', e => {
      if (e.target.id === 'g-log-k') $('#g-log-g').hidden = e.target.value !== 'cut';
      if (e.target.id === 'g-preset') $('#g-cities').textContent = 'Например, ' + B.PRESETS.find(x => x.id === e.target.value).cities;
    });
    document.addEventListener('submit', e => {
      if (e.target.id === 'g-form') {
        e.preventDefault();
        const pick = name => { const b = $(`#g-form [data-g-${name}][aria-pressed="true"]`); return b ? b.dataset['g' + name.charAt(0).toUpperCase() + name.slice(1)] : null; };
        const date = $('#g-date').value;
        if (!fromISO(date)) { $('#g-date').focus(); toast('Укажите дату'); return; }
        const variety = $('#g-variety').value;
        const s = gardenLoad();
        let p = gardenOpen && gardenOpen.id && s.plants.find(x => x.id === gardenOpen.id);
        if (!p) {
          p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), added: toISO(today()), log: [] };
          s.plants.push(p);
        }
        Object.assign(p, {
          name: ($('#g-name').value.trim() || variety || 'Мой базилик').slice(0, 40),
          variety, start: pick('start') || 'seed', place: pick('place') || 'home', preset: $('#g-preset').value || 'temperate', date
        });
        gardenOpen = { id: p.id };
        gardenSave(s);
        renderGardenSheet();
        HAP.success();
        if (!$('#garden-home') && !$('#garden-page')) toast('Куст добавлен — его дела на неделю теперь в «Моём базилике»');
      } else if (e.target.id === 'g-log-form') {
        e.preventDefault();
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p) return;
        const k = $('#g-log-k').value, d = fromISO($('#g-log-d').value) || today(), g = +$('#g-log-g').value, text = $('#g-log-t').value.trim();
        if (k === 'note' && !text) { $('#g-log-t').focus(); return; }
        const entry = { d: toISO(d), k };
        if (k === 'cut' && g > 0) entry.g = Math.min(5000, Math.round(g));
        if (text) entry.t = text.slice(0, 120);
        plantNote(p, entry);
        gardenSave(s);
      }
    });
  }
  /* ================================================================== */
  /* MY BASIL: one's own bushes and what each needs this week            */
  /* ================================================================== */
  // kept in this browser only:
  // { v: 1, plants: [{ id, name, variety, start, place, preset, date, added, log: [{ d, k, task?, g?, t? }] }] }
  const GARDEN_KEY = 'basil-garden';
  function gardenLoad() {
    const s = store.get(GARDEN_KEY, null);
    return s && Array.isArray(s.plants) ? s : { v: 1, plants: [] };
  }
  function gardenSave(s) {
    store.set(GARDEN_KEY, s);
    document.dispatchEvent(new CustomEvent('basil:garden'));
  }
  const gardenVariety = p => B.VARIETIES.find(v => v.name === p.variety) || null;
  // a week runs from Monday to Sunday
  const weekOf = d => { const m = addDays(d, -((d.getDay() + 6) % 7)); return [m, addDays(m, 6)]; };
  const later = (a, b) => (!a ? b : !b ? a : a > b ? a : b);
  const daysWord = n => `${n} ${plural(n, 'день', 'дня', 'дней')}`;

  // everything the guide asks of one bush. Steps once — from sowing to the first harvest, and the season
  // of a bush outdoors — and the ones that come again: feeding, cutting, buds, flushing the pot, fresh water
  // for a cutting, the lamp in winter. A step is done when the diary says so; a note of its kind
  // («Подкормил») closes it too. What was over before the diary began is not asked for
  function plantTasks(p, day) {
    const G = B.GARDEN;
    const S = fromISO(p.date) || day;
    const added = fromISO(p.added) || S;
    const age = dayDiff(S, day);
    const place = p.place || 'home';
    const log = (p.log || []).map(e => Object.assign({ date: fromISO(e.d) }, e)).filter(e => e.date).sort((a, b) => a.date - b.date);
    const last = k => log.reduce((m, e) => (e.k === k ? e.date : m), null);
    const out = [], byKey = {};
    const state = (from, to) => (to < day ? 'late' : from <= day ? 'now' : 'soon');
    const once = (st, from, to) => {
      const note = log.find(e => e.task === st.key) || (st.kind && log.find(e => e.k === st.kind && e.date >= addDays(from, -5) && e.date <= addDays(to, 30)));
      const t = { key: st.key, title: st.title, text: st.text, link: st.link, kind: st.kind, from, to, due: from, once: true };
      if (note) { t.state = 'done'; t.done = note.date; }
      else if (to < added) t.state = 'before';
      else if (dayDiff(to, day) > 21) t.state = 'missed';
      else t.state = state(from, to);
      out.push(t);
      byKey[st.key] = t;
      return t;
    };
    // from the last time it was done; never before the diary began
    const again = (key, def, next) => {
      if (!next) return;
      next = later(next, added);
      out.push({ key, title: def.title, text: def.text, link: def.link, kind: key, from: next, to: next, due: next, repeat: true, state: state(next, next) });
    };

    // outdoors the season counts from the frosts of the climate
    let lf = null, af = null;
    if (place !== 'home') {
      let fr = seasonFrosts(p.preset || 'temperate', S.getFullYear());
      if (S > fr.af) fr = seasonFrosts(p.preset || 'temperate', S.getFullYear() + 1);
      lf = fr.lf;
      af = fr.af;
    }
    const plantOut = place === 'garden' && (p.start === 'seed' || p.start === 'seedling');
    (G.steps[p.start] || G.steps.seed).forEach(st => {
      if (plantOut && st.key === 'plant') return; // a garden bush is planted out by the season
      let a = st.a, b = st.b;
      if (a === 'first') {
        // the variety's own weeks to the first cut, but never before the first pinch has grown back
        const v = gardenVariety(p), wk = v ? parseInt((String(v.first).match(/\d+/) || [])[0], 10) : 0;
        a = Math.max(wk ? wk * 7 : 0, 52);
        b = a + st.b;
      }
      let from = addDays(S, a), to = addDays(S, b);
      if (plantOut && st.key === 'harvest1' && addDays(lf, 35) > from) { from = addDays(lf, 35); to = addDays(from, 10); }
      once(st, from, to);
    });
    if (lf) {
      (place === 'garden' ? G.season : [G.balcony]).forEach(st => {
        if (st.starts && !(plantOut && st.starts.includes(p.start))) return;
        const base = st.from === 'lf' ? lf : af;
        let from = addDays(base, st.a), to = addDays(base, st.b);
        if (st.key === 'plantout' && to < S) { from = S; to = addDays(S, 3); } // bought after planting time: plant now
        if (to < S) return;
        once(st, from, to);
      });
    }

    // the season of a bush outdoors ends with the frost
    const over = place === 'garden' && af && (day > af || (byKey.final && byKey.final.state === 'done'));
    const R = G.repeat;
    const closed = t => t && (t.state === 'done' || t.state === 'before' || t.state === 'missed');
    const baseOf = t => (t.state === 'done' ? t.done : t.to);
    if (!over) {
      if (closed(byKey.feed1)) again('feed', R.feed, addDays(later(last('feed'), baseOf(byKey.feed1)), R.feed.every[place] || 10));
      if (closed(byKey.harvest1)) again('cut', R.cut, addDays(later(last('cut'), baseOf(byKey.harvest1)), R.cut.every));
      if (R.buds.months.includes(day.getMonth()) && age >= R.buds.age) { const b = last('buds'); again('buds', R.buds, b ? addDays(b, R.buds.every) : day); }
      if (R.flush.places.includes(place) && age >= R.flush.age) again('flush', R.flush, addDays(later(last('flush'), addDays(S, R.flush.age - R.flush.every)), R.flush.every));
    }
    if (p.start === 'cutting' && byKey.pot && !closed(byKey.pot)) again('water', R.water, addDays(later(last('water'), S), R.water.every));
    // the lamp: once a winter, at home (on the balcony once the bush has come in)
    const L = G.light;
    if (L.months.includes(day.getMonth()) && L.places.includes(place) && (place === 'home' || (af && day >= addDays(af, -10)))) {
      const sy = day.getMonth() >= 9 ? day.getFullYear() : day.getFullYear() - 1;
      once(Object.assign({}, L, { key: 'light-' + sy }), later(new Date(sy, 9, 1), added), new Date(sy + 1, 2, 31));
    }
    return out.sort((a, b) => a.due - b.due);
  }
  // what is left to do this week (with what is late), and what comes after it
  function plantWeek(p, day) {
    const end = weekOf(day)[1];
    const all = plantTasks(p, day);
    const open = all.filter(t => t.state === 'late' || t.state === 'now' || t.state === 'soon');
    return { all, now: open.filter(t => t.due <= end), next: open.filter(t => t.due > end)[0] || null };
  }
  // how the bush looks at its age: the picture of its stage and the word for it
  function plantStage(p, day) {
    const age = Math.max(0, dayDiff(fromISO(p.date) || day, day));
    const st = (B.GARDEN.stages[p.start] || B.GARDEN.stages.seed).find(s => age < s[0]);
    return { age, pic: st[1], word: st[2] };
  }
  // the diary: a task done, or a note («Полил», «Срезал 40 г»)
  function plantNote(p, entry) {
    p.log = p.log || [];
    p.log.push(Object.assign({ d: toISO(today()) }, entry));
  }
  function plantDone(p, t) {
    if (t.repeat) plantNote(p, { k: t.key });
    else plantNote(p, t.kind ? { k: t.kind, task: t.key } : { k: 'task', task: t.key });
  }
  const lastNote = (p, k) => (p.log || []).reduce((m, e) => { const d = e.k === k && fromISO(e.d); return d && (!m || d > m) ? d : m; }, null);
  /* ================================================================== */
  /* READING POSITION: pages open at the top; the spot you left is kept  */
  /* and offered back — on the chapter itself and from «Продолжить» home  */
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
  // only the reader's own scrolling moves the bookmark — not the jump to the top on arrival
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
      const to = () => window.scrollTo({ top: Math.max(0, t), behavior });
      if (behavior === 'auto') jump(to); else to();
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

  /* links to other chapters point at their pages — also those scripts add later */
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

  /* ================================================================== */
  /* BOOT                                                                */
  /* ================================================================== */
  const boot = () => {
    const science = function initScience() { if (window.BasilScience) window.BasilScience.init({ toast }); };
    // content first, decoration after: the animated background and bush start once the chapter is ready
    const steps = [initTheme, initHome, initVarieties, initQuiz, initPlaces, initSoil, initCalendar, initDli, initElements, initStages, initPlan, initNpk, initDose, initSim, initGerm, initDiagnostics, initGlossary, initChecklist, initRecipes, initGarden, science, initSheets, initPagers, initSearch, initScrollChrome, initRouter, initReadingPos, initLinks, initPageAction, initHoverLight, initOffscreenPause, initScene];
    // hand control back to the browser every ~40 ms so taps and scrolling never wait for start-up
    const pause = () => (window.scheduler && typeof window.scheduler.yield === 'function' ? window.scheduler.yield() : new Promise(r => setTimeout(r, 0)));
    (async () => {
      let t0 = performance.now();
      for (const fn of steps) {
        try { fn(); } catch (err) { console.error(`[basil] ${fn.name} failed`, err); }
        if (performance.now() - t0 > 40) { await pause(); t0 = performance.now(); }
      }
      document.documentElement.classList.add('is-ready');
      document.dispatchEvent(new CustomEvent('basil:ready'));
    })();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
