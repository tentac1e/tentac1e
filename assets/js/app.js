/* Гид по базилику — навигация и интерактив */
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
  const nb = s => String(s).replace(/(\d) (?=[^\s\d–—-]{1,6}(?=[\s,.;:)!?/]|$))/g, '$1\u00a0');

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
  // «#id» → the address that really shows it: same page keeps the hash, another chapter gets «page.html#id»
  const urlFor = hash => {
    const id = decodeURIComponent(String(hash || '').replace(/^#/, ''));
    if (!PAGES || !id || id === 'main' || id === 'top' || id === here || document.getElementById(id)) return '#' + id;
    const pg = pageOf(id);
    if (!pg || pg === here) return '#' + id;
    if (PAGES.files[id]) return PAGES.files[id];
    return PAGES.files[pg] + '#' + id;
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
      toast(ok ? 'Скопировано' : 'Не удалось скопировать — выделите текст вручную');
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
  function resolve(raw) {
    const hash = decodeURIComponent(String(raw || '').replace(/^#/, ''));
    if (!hash || hash === 'top') return { view: homeView() };
    if (views.has(hash)) return { view: views.get(hash) };
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
    const ch = chapterById(id);
    let title = 'Гид по базилику';
    if (ch) {
      const panelId = lastPanel.get(id);
      const panel = panelId && document.getElementById(panelId);
      const sub = panel && panel.dataset.title;
      title = `${ch.title}${sub && $$('[data-panel]', view).length > 1 ? ' · ' + sub : ''} — Гид по базилику`;
      store.set('basil-last', { view: id, panel: panelId || null, sub: sub && $$('[data-panel]', view).length > 1 ? sub : '' });
    }
    document.title = title;
  }

  function scrollAfter(r, changedView) {
    const behavior = changedView ? 'auto' : smooth();
    if (r.target) {
      const rc = r.target.closest('.recipe-card');
      if (rc && rc.hidden) { const all = $('.rb-filter [data-cat="all"]'); if (all) all.click(); }
      let opened = false;
      for (let box = r.target.closest('details'); box; box = box.parentElement && box.parentElement.closest('details')) {
        if (!box.open) { box.open = true; opened = true; }
      }
      r.target.scrollIntoView({ block: 'start', behavior });
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
      if (changedView || window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior });
      return;
    }
    if (changedView) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function route(hash, opts = {}) {
    const r = resolve(hash);
    if (r.external) {
      if (opts.initial) location.replace(r.external); else location.href = r.external;
      return;
    }
    $$('dialog.sheet[open]').forEach(d => closeSheet(d));
    const changedView = r.view !== currentView;
    const apply = () => {
      if (changedView) {
        views.forEach(v => v.classList.toggle('is-active', v === r.view));
        currentView = r.view;
      }
      const panel = activatePanel(r.view, r.panel, !changedView);
      if (!r.panel && panel && !changedView) r.panel = panel;
      updateChrome(r.view);
      scrollAfter(r, changedView);
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
      const hash = a.getAttribute('href');
      if (hash === '#main') return;
      e.preventDefault();
      const u = urlFor(hash);
      if (!u.startsWith('#')) { location.href = u; return; }
      const dlg = a.closest('dialog');
      if (dlg && dlg.open) dlg.close();
      navigate(hash, { replace: !!a.closest('.subnav') });
    });
    window.addEventListener('popstate', () => route(location.hash));
    window.addEventListener('hashchange', () => route(location.hash));
    route(location.hash, { initial: true });
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
      const art = c => `<svg class="pg-art" viewBox="0 0 120 120" aria-hidden="true"><use href="#${c.art}"/></svg>`;
      pager.innerHTML =
        (prev ? `<a class="prev" href="#${prev.id}">${art(prev)}<span><small>← Глава ${prev.num}</small><b>${prev.title}</b></span></a>` : `<a class="prev" href="#glavnaya">${icon('home')}<span><small>← Начало</small><b>Главная</b></span></a>`) +
        (next ? `<a class="next" href="#${next.id}"><span><small>Глава ${next.num} →</small><b>${next.title}</b></span>${art(next)}</a>` : `<a class="next" href="#glavnaya"><span><small>Готово →</small><b>На главную</b></span>${icon('home')}</a>`);
    });

    const cont = $('#continue');
    const showContinue = () => {
      const last = store.get('basil-last', null);
      const ch = last && chapterById(last.view);
      if (!cont || !ch) return;
      const panel = last.panel && document.getElementById(last.panel);
      const sub = panel ? (panel.dataset.title && $$('[data-panel]', views.get(ch.id)).length > 1 ? panel.dataset.title : '') : last.sub;
      cont.href = urlFor('#' + (panel || (PAGES && last.panel) ? last.panel : ch.id));
      $('#continue-title').textContent = ch.title + (sub ? ' · ' + sub : '');
      cont.hidden = false;
    };
    showContinue();
    document.addEventListener('basil:view', e => { if (e.detail.id === 'glavnaya') showContinue(); });
  }

  /* header: progress, sticky subnav state, back to top */
  function initScrollChrome() {
    const bar = $('#progress-bar');
    const toTop = $('#to-top');
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (toTop) toTop.classList.toggle('is-shown', window.scrollY > 900);
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
  function openSheet(id) {
    const d = document.getElementById(id);
    if (!d) return;
    if (!d.open) {
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    }
    if (id === 'sheet-chapters') {
      $$('.sheet-link', d).forEach(l => l.classList.toggle('is-current', currentView && l.getAttribute('href') === '#' + currentView.dataset.view));
    }
    if (id === 'sheet-search') {
      const input = $('#search-input');
      setTimeout(() => { input.focus(); input.select(); }, 30);
      loadSearch();
    }
  }
  function closeSheet(d) {
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }

  function initSheets() {
    const chList = $('#sheet-chapters-list');
    if (chList) {
      chList.innerHTML = `<a class="sheet-link" href="#glavnaya"><span class="sl-art">${icon('home')}</span><span><b>Главная</b><small>С чего начать, путь базилика, правила</small></span>${icon('chev-r')}</a>` +
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
  /* SEARCH                                                              */
  /* ================================================================== */
  const norm = s => String(s).toLowerCase().replace(/ё/g, 'е');
  const textOf = el => {
    const parts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
    return parts.join(' ').replace(/\s+/g, ' ').replace(/\s([.,;:!?)»])/g, '$1').trim();
  };
  let searchIndex = [];

  function buildSearchIndex() {
    const idx = [];
    const add = e => idx.push(Object.assign({ n: norm(e.title + ' ' + (e.text || '')), nt: norm(e.title) }, e));
    B.CHAPTERS.forEach(c => add({ title: c.title, sub: `Глава ${c.num}`, text: c.desc, hash: c.id, icon: 'book' }));
    B.TOOLS.forEach(t => add({ title: t.title, sub: 'Инструмент', text: t.desc, hash: t.hash, icon: t.icon }));
    if (window.BASIL_SEARCH) window.BASIL_SEARCH.forEach(add); // text of every chapter, indexed at build time
    else $$('[data-panel]').forEach(p => {
      const ch = chapterById(p.closest('[data-view]').dataset.view);
      add({ title: p.dataset.title, sub: ch.title, text: textOf(p).slice(0, 400), hash: p.id, icon: 'list' });
    });
    let n = 0;
    const skip = '#chapters, #quick, #tools-home, #journey, .diag-result, .el-detail, #variety-detail, .quiz, .plan-list, .timeline, .dose-out, .npk-out, .soil-out, .dli-out, .stage-body, .pager, .sim, #glossary, #disease-grid, #pest-grid, #diag-groups, #place-panel, #check-groups, .lab-tool, .deep-index, .recipe-book, .deep-src';
    if (!window.BASIL_SEARCH) $$('[data-view] h3, [data-view] h4, [data-view] summary').forEach(h => {
      if (h.closest(skip)) return;
      const view = h.closest('[data-view]');
      const ch = chapterById(view.dataset.view);
      const panel = h.closest('[data-panel]');
      if (!h.id) h.id = h.parentElement.classList.contains('deeper') && h.closest('details.deep') ? h.closest('details.deep').id + '-glubzhe' : 's-' + (++n);
      const box = h.closest('details, .card, .step, .pane, article, .rule, li') || h.parentElement;
      const text = textOf(box);
      const deep = h.tagName === 'SUMMARY' && h.parentElement.classList.contains('deep') ? h.parentElement : null;
      if (h.tagName === 'SUMMARY' && h.parentElement.classList.contains('deeper')) {
        const host = h.closest('details.deep');
        add({ title: $('.deeper-t', h).textContent.trim(), sub: 'Ещё глубже · ' + (host ? host.dataset.short : where), text: textOf(h.nextElementSibling).slice(0, 420), hash: h.id, icon: 'hex' });
        return;
      }
      const where = (ch ? ch.title : 'Главная') + (panel && panel.dataset.title ? ' · ' + panel.dataset.title : '');
      if (deep) {
        add({ title: $('.deep-title', h).textContent.trim(), sub: 'Глубже · ' + where, text: textOf($('.deep-sub', h)) + ' ' + textOf($('.deep-body', deep)).slice(0, 420), hash: deep.id, icon: 'hex' });
        return;
      }
      add({ title: h.textContent.trim(), sub: where + (h.closest('.deep') ? ' · Глубже' : ''), text: text.slice(0, 360), hash: h.id, icon: h.tagName === 'SUMMARY' ? 'info' : 'leaf' });
    });
    B.DIAG.forEach(g => g.items.forEach(it => add({ title: it.title, sub: 'Проблемы · Диагностика', text: it.causes.map(c => c.name + '. ' + c.check).join(' '), hash: 'problemy-diagnostika', icon: 'bug', act: 'sym:' + it.id, after: () => selectSymptom(it.id, true) })));
    B.ELEMENTS.forEach((e, i) => add({ title: `${e.name} (${e.sym})`, sub: 'Удобрения · Элементы', text: e.role + ' ' + e.def, hash: 'udobreniya-elementy', icon: 'flask', act: 'el:' + i, after: () => selectElement(i, true) }));
    B.VARIETIES.forEach((v, i) => add({ title: `Сорт «${v.name}»`, sub: 'Сорта · Каталог', text: v.desc + ' ' + v.use, hash: 'sorta-katalog', icon: 'seed', act: 'var:' + i, after: () => openVariety(i) }));
    B.DISEASES.forEach((d, i) => add({ title: d.name, sub: 'Проблемы · Болезни', text: d.sign + ' ' + d.fix, hash: 'dis-' + i, icon: 'alert' }));
    B.PESTS.forEach((d, i) => add({ title: d.name, sub: 'Проблемы · Вредители', text: d.sign + ' ' + d.fix, hash: 'pest-' + i, icon: 'bug' }));
    if (B.RECIPES) {
      const catName = Object.fromEntries(B.RECIPE_CATS.map(([id, name, ic]) => [id, [name, ic]]));
      B.RECIPES.forEach(r => add({ title: r.title, sub: 'Рецепты · ' + catName[r.cat][0], text: `${r.orig}. ${r.ing.map(i => i[0]).join(', ')}. ${r.sci[0]}`, hash: 'r-' + r.id, icon: catName[r.cat][1] }));
    }
    B.GLOSSARY.forEach(([t, d], i) => add({ title: t, sub: 'Справка · Словарь', text: d, hash: 'g-' + i, icon: 'book' }));
    if (window.BasilScience) {
      Object.values(window.BasilScience.MOLS).forEach(m => add({ title: m.name + (m.alt ? ` (${m.alt})` : ''), sub: 'Вкус · Молекулы аромата', text: `${m.cls}. Запах: ${m.smell}. Есть в: ${m.where}. Сорта: ${m.basil}. ${m.note}`, hash: 'vkus-molekuly', icon: 'hex' }));
      window.BasilScience.PAIRS.forEach(pr => add({ title: `Базилик и ${pr.name.toLowerCase()}`, sub: 'Вкус · Сочетания', text: pr.why + ' ' + pr.dish, hash: 'vkus-sochetaniya', icon: 'nose' }));
    }
    idx.forEach(e => { if (!e.page) e.page = pageOf(e.hash) || here; });
    searchIndex = idx;
  }
  const entryUrl = e => {
    if (!PAGES || e.page === here) return '#' + e.hash;
    return PAGES.files[e.page] + (e.act ? '?do=' + encodeURIComponent(e.act) : '') + (PAGES.files[e.hash] ? '' : '#' + e.hash);
  };
  // the index of all chapters is a separate file: fetched the first time search opens
  let searchReady = null;
  function loadSearch() {
    if (searchReady) return searchReady;
    searchReady = new Promise(resolve => {
      if (!PAGES || window.BASIL_SEARCH) { resolve(); return; }
      const self = $('script[src$="app.js"]');
      const tag = document.createElement('script');
      tag.src = self ? self.getAttribute('src').replace(/app\.js$/, 'search-index.js') : 'assets/js/search-index.js';
      tag.onload = tag.onerror = () => resolve();
      document.head.appendChild(tag);
    }).then(() => { buildSearchIndex(); document.dispatchEvent(new CustomEvent('basil:search-ready')); });
    return searchReady;
  }

  function highlight(text, words) {
    let out = esc(text);
    words.forEach(w => {
      if (w.length < 2) return;
      const re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/е/g, '[её]') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  function snippet(text, word) {
    const t = String(text);
    const i = norm(t).indexOf(word);
    if (i < 0) return t.slice(0, 110) + (t.length > 110 ? '…' : '');
    const start = Math.max(0, i - 40);
    return (start > 0 ? '…' : '') + t.slice(start, start + 120) + (start + 120 < t.length ? '…' : '');
  }

  function initSearch() {
    const input = $('#search-input');
    const box = $('#search-results');
    if (!input || !box) return;
    let results = [];
    let active = 0;
    const hints = ['желтеют листья', 'азот', 'прищипывание', 'лампа', 'песто', 'черенки', 'магазин', 'рассада'];

    const render = () => {
      const q = norm(input.value.trim());
      if (!q) {
        box.innerHTML = `<div class="sr-hint">Ищите по симптомам, элементам, сортам и советам.<div class="chips-row">${hints.map(h => `<button class="chip" type="button" data-q="${h}">${h}</button>`).join('')}</div></div>`;
        results = [];
        return;
      }
      const words = q.split(/\s+/).filter(Boolean);
      results = searchIndex
        .map(e => {
          if (!words.every(w => e.n.includes(w))) return null;
          let s = 0;
          if (e.nt.includes(q)) s += 10;
          if (e.nt.startsWith(q)) s += 5;
          words.forEach(w => { if (e.nt.includes(w)) s += 3; });
          if (e.sub === 'Инструмент') s += 1;
          return { e, s };
        })
        .filter(Boolean)
        .sort((a, b) => b.s - a.s)
        .slice(0, 24)
        .map(x => x.e);
      active = 0;
      if (!results.length) {
        box.innerHTML = `<div class="sr-empty">Ничего не нашлось по запросу «${esc(input.value.trim())}». Попробуйте другое слово, например «полив» или «удобрение».</div>`;
        return;
      }
      box.innerHTML = results.map((e, i) => `
        <a class="sr-item${i === 0 ? ' is-active' : ''}" href="${esc(entryUrl(e))}" data-i="${i}" role="option" aria-selected="${i === 0}">
          <span class="sr-ico">${icon(e.icon)}</span>
          <span><b>${highlight(e.title, words)}</b><small>${esc(e.sub)}</small><span class="sr-snip">${highlight(snippet(e.text || '', words[0]), words)}</span></span>
        </a>`).join('');
    };

    const go = i => {
      const e = results[i];
      if (!e) return;
      closeSheet($('#sheet-search'));
      const u = entryUrl(e);
      if (!u.startsWith('#')) { location.href = u; return; }
      navigate('#' + e.hash);
      if (e.after) setTimeout(e.after, 60);
    };

    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      const items = $$('.sr-item', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((it, i) => { it.classList.toggle('is-active', i === active); it.setAttribute('aria-selected', String(i === active)); });
        items[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        go(active);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSheet($('#sheet-search'));
      }
    });
    box.addEventListener('click', e => {
      const chip = e.target.closest('[data-q]');
      if (chip) { input.value = chip.dataset.q; render(); input.focus(); return; }
      const item = e.target.closest('.sr-item');
      if (item) { e.preventDefault(); e.stopPropagation(); go(+item.dataset.i); }
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
      onAroma: (x, y) => { S.aroma(layer, x, y); if (hint) hint.classList.add('is-used'); }
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

  function openVariety(i) {
    const v = B.VARIETIES[i];
    const box = $('#variety-detail');
    if (!v || !box) return;
    const easy = { 1: 'легко', 2: 'средне', 3: 'капризный' }[v.easy];
    const where = v.pot >= 2 && v.garden >= 2 ? 'горшок и грядка' : v.pot >= 2 ? 'горшок, подоконник' : v.garden >= 2 ? 'грядка, большой горшок' : 'горшок или грядка';
    const resist = v.resist === 'dm' ? 'ложная мучнистая роса' : v.resist === 'fus' ? 'фузариоз' : '—';
    box.innerHTML = `
      <div class="vd-head">
        <div class="v-leaf">${leafArt(v)}</div>
        <div><h2 id="variety-h">${v.name}</h2><span class="v-latin">${v.latin}</span><ul class="tags">${v.labels.map(l => `<li class="${labelCls(l)}">${l}</li>`).join('')}</ul></div>
      </div>
      <p>${nb(v.desc)}</p>
      <dl class="vd-specs">
        <div><dt>Высота</dt><dd>${nb(v.height)}</dd></div>
        <div><dt>Первый срез</dt><dd>${nb(v.first)}</dd></div>
        <div><dt>Аромат</dt><dd>${v.aroma}</dd></div>
        <div><dt>Сложность</dt><dd>${meter(v.easy, 3)}${easy}</dd></div>
        <div><dt>Где лучше</dt><dd>${where}</dd></div>
        <div><dt>Устойчивость</dt><dd>${resist}</dd></div>
      </dl>
      <p><b>Для чего:</b> ${v.use}</p>
      <div class="callout"><svg class="ico"><use href="#i-leaf"/></svg><p><b>Особенности ухода.</b> ${nb(v.care)}</p></div>
      <div class="hero-actions"><a class="btn btn-primary btn-small" href="#posadka-posev">${icon('seed')}Как посеять</a><a class="btn btn-ghost btn-small" href="#sorta-podbor">${icon('list')}Подобрать сорт</a></div>`;
    openSheet('sheet-variety');
  }

  function initVarieties() {
    const grid = $('#variety-grid');
    if (!grid) return;
    const chips = $$('#variety-filters .chip');
    const count = $('#variety-count');
    grid.innerHTML = B.VARIETIES.map((v, i) => `
      <button class="variety" type="button" data-i="${i}" aria-haspopup="dialog">
        <span class="v-leaf">${leafArt(v)}</span>
        <span>
          <span class="v-name">${v.name}</span>
          <span class="v-latin">${v.latin}</span>
          <span class="v-line">${nb(v.height)} · срез ${nb(v.first)}</span>
          <ul class="tags">${v.labels.map(l => `<li class="${labelCls(l)}">${l}</li>`).join('')}</ul>
        </span>
      </button>`).join('');
    const cards = $$('.variety', grid);
    const apply = f => {
      let n = 0;
      cards.forEach((c, i) => {
        const v = B.VARIETIES[i];
        const show = f === 'all' || (f === 'resist' ? !!v.resist : v.tags.includes(f));
        c.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = `${n} ${plural(n, 'сорт', 'сорта', 'сортов')} из ${B.VARIETIES.length}`;
      chips.forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.filter === f)));
    };
    chips.forEach(ch => ch.addEventListener('click', () => apply(ch.dataset.filter)));
    grid.addEventListener('click', e => { const c = e.target.closest('.variety'); if (c) openVariety(+c.dataset.i); });
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
              <span class="v-leaf">${leafArt(r.v)}</span>
              <span><span class="v-name">${r.v.name}</span><span class="qr-why">${r.why.length ? r.why.slice(0, 3).join(' · ') : 'хороший универсальный выбор'}</span><span class="qr-score"><i style="width:${Math.round(clamp(r.s / 12.5, 0.08, 1) * 100)}%"></i></span></span>
            </button>`).join('')}</div>
          <button class="btn btn-ghost btn-small quiz-back" type="button" data-restart>${icon('seed')}Пройти заново</button>`;
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
    const render = i => {
      const p = B.PLACES[i];
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      panel.setAttribute('aria-labelledby', `tab-${p.id}`);
      panel.innerHTML = `
        <div>
          <h3>${p.name}</h3>
          <p class="lead">${nb(p.lead)}</p>
          <dl class="params">${p.params.map(([k, v]) => `<div><dt>${k}</dt><dd>${nb(v)}</dd></div>`).join('')}</dl>
        </div>
        <div class="place-side">
          <div><h4>${icon('check')}Советы</h4><ul class="ticks">${p.tips.map(t => `<li>${nb(t)}</li>`).join('')}</ul></div>
          <div><h4>${icon('alert')}Подводные камни</h4><ul class="ticks is-warn">${p.risks.map(t => `<li>${nb(t)}</li>`).join('')}</ul></div>
        </div>`;
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => render(i)));
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
      render(j);
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
        <div class="soil-bar" role="img" aria-label="Пропорции смеси">${r.parts.map(p => `<span class="mx-${p[2]}" style="flex:${p[1]}">${p[0]} · ${p[1]}</span>`).join('')}</div>
        <ul class="soil-list">${r.parts.map(p => `<li><span><i class="mx-${p[2]}"></i>${p[0]}</span><b>${fmtNum(total * p[1] / parts, 1)}\u00a0л</b></li>`).join('')}</ul>
        <p class="soil-total">Всего ${fmtNum(total, 1)}\u00a0л смеси с запасом 10&nbsp;% на усадку. Керамзит для дренажа — около ${fmtNum(v * n * 0.1, 1)}\u00a0л.</p>
        <p class="muted">${nb(r.note)}</p>`;
    };
    [sel, vol, cnt].forEach(el => el.addEventListener('input', render));
    render();
  }

  /* ================================================================== */
  /* CALENDAR (wheel + timeline)                                         */
  /* ================================================================== */
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
    const autumnFrost = (lf, id) => {
      const p = B.PRESETS.find(x => x.id === id);
      if (p && p.af) return new Date(lf.getFullYear(), p.af[0] - 1, p.af[1]);
      const doy = dayDiff(new Date(lf.getFullYear(), 0, 1), lf);
      return addDays(lf, clamp(Math.round(300 - 2 * (doy - 60)), 90, 230));
    };
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
          { a: addDays(S, 14), b: addDays(S, 21), icon: 'pot', title: 'Пикировка', text: 'При 1–2 парах настоящих листьев — в стаканы по 200–300 мл.' },
          { a: addDays(S, 24), b: addDays(S, 28), icon: 'flask', title: 'Первая подкормка', text: 'Комплексное удобрение для рассады в ¼ дозы.' },
          { a: addDays(S, 35), b: addDays(S, 42), icon: 'scissors', title: 'Прищипывание рассады', text: 'При 3–4 парах листьев — над 2-й или 3-й парой.' },
          { a: addDays(T, -10), b: addDays(T, -1), icon: 'wind', title: 'Закаливание', text: 'Выносите на улицу, начиная с 1–2 часов в тени.' },
          { a: addDays(LF, 10), b: addDays(LF, 21), icon: 'garden', key: true, title: 'Высадка в грунт', text: 'Когда ночи теплее +10 °C, а почва прогрелась до +15 °C. В теплицу — на 1–2 недели раньше.' },
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
          { a: addDays(S, 24), b: addDays(S, 28), icon: 'flask', title: 'Первая подкормка', text: 'Комплексное удобрение в ¼ дозы, дальше — раз в 10–14 дней.' },
          { a: addDays(S, 35), b: addDays(S, 45), icon: 'scissors', key: true, title: 'Первое прищипывание', text: 'При 3–4 парах листьев — над 2-й или 3-й парой.' },
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
        <div class="el-section is-def"><h4>Признаки нехватки</h4><p>${nb(e.def)}</p></div>
        <div class="el-section is-exc"><h4>Признаки избытка</h4><p>${nb(e.exc)}</p></div>
        <div class="el-section"><h4>Где взять</h4><p><b>Минеральные:</b> ${nb(e.mineral)}.<br><b>Органические:</b> ${nb(e.organic)}.</p></div>
        <div class="el-section"><h4>Когда важнее всего</h4><p>${nb(e.when)}</p></div>`;
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

    track.innerHTML = S.map((s, i) => `<button class="stage-btn" type="button" role="tab" aria-selected="false" data-i="${i}">${miniPlant(s.plant)}<span>${i + 1}. ${s.short}</span></button>`).join('');
    const btns = $$('.stage-btn', track);
    npk.innerHTML = series.map(([c, s, n]) => `<div class="npk-row"><span class="lbl"><i class="k-${c}"></i>${s} · ${n}</span><span class="bar"><i class="k-${c}" id="bar-${c}"></i></span><span class="lvl" id="lvl-${c}"></span></div>`).join('');
    const table = $('#feed-table');
    if (table) table.innerHTML = `<thead><tr><th scope="col">Стадия</th><th scope="col">N</th><th scope="col">P</th><th scope="col">K</th><th scope="col">N : P : K</th></tr></thead><tbody>${S.map((s, i) => `<tr><td>${i + 1}. ${s.name}</td><td class="num">${s.N}</td><td class="num">${s.P}</td><td class="num">${s.K}</td><td class="num">${s.ratio}</td></tr>`).join('')}</tbody>`;
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
      out += `<rect class="fc-band" x="${x(sel) - step * 0.42}" y="${m.t - 6}" width="${step * 0.84}" height="${ph + 12}" rx="12"/>`;
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
        out += `<text class="fc-xlabel${i === sel ? ' is-sel' : ''}" x="${x(i)}" y="${h - (narrow ? 10 : 16)}" text-anchor="middle">${narrow ? i + 1 : s.short}</text>`;
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
      push(38, 'Вторая подкормка', 'Монокалийфосфат 0,3–0,5 г/л или комплексное ⅓ дозы — для корней.', 'p');
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
        push(d + 3, mode === 'pot' ? 'Промывка и магний' : 'Магний по листу', mode === 'pot' ? 'Пролейте горшок чистой водой в объёме 2–3 горшков, через день — сульфат магния 1 г/л.' : 'Сульфат магния 1 г/л, опрыскивание вечером.', 'o');
      }
      push(total - 14, 'Финишная подкормка без азота', mode === 'pot' ? 'Сульфат калия 0,5 г/л — для аромата перед финальным сбором.' : 'Сульфат калия 1 г/л или зольный настой.', 'k');
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
        <p class="muted">Фосфор и калий на упаковке указаны в пересчёте на оксиды P₂O₅ и K₂O — так принято, сравнивать удобрения удобно именно по этим числам.</p>`;
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
    if (tsp < 0.09) return 'на кончике ложки — лучше взвесить';
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
        say('Готово: 8 верхушек роста — это уже настоящий куст! Дальше просто срезайте верхушки на урожай каждые 1–2 недели и не давайте ему цвести.', 'good');
      }
    };

    const pinch = (id, k) => {
      const s = byId(id);
      if (!s || s.state === 'cut') return;
      if (k < 2) { say('Слишком низко: под срезом должно остаться минимум 2 пары листьев. Иначе новые побеги будут слабыми, а куст потеряет «фабрику питания».', 'warn'); return; }
      if (s.state === 'grow' && s.nodes < 3) { say('Рано: пусть побег наберёт хотя бы 3 пары листьев — тогда срез даст крепкие ветки.', 'warn'); return; }
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
        text = `Срез над ${k}-й парой. ${wasFlower ? 'Соцветие удалено. ' : ''}${got}Из пазух под срезом пойдут 2 новых побега — нажмите «Неделя вперёд».`;
      } else {
        s.state = 'grow';
        text = `${wasFlower ? 'Соцветие удалено. ' : ''}${got}Куст уже густой: дальше в тренажёре ветвление не рисуем, срезки идут в урожай.`;
      }
      if (before > 0 && removed > before / 3) { text += ' Но это больше трети куста — растению понадобится время на восстановление.'; tone = 'warn'; }
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
      if (bloomed.length) say(`Зацвело побегов: ${bloomed.length}. Срежьте соцветия вместе с парой листьев под ними — нажмите на узел чуть ниже цветка.`, 'bad');
      else if (flowering) say('Куст цветёт — листья грубеют и горчат. Срежьте соцветия!', 'bad');
      else if (ready) say(`Готово к прищипыванию: ${ready} ${plural(ready, 'побег', 'побега', 'побегов')} с 4 парами листьев. Срезайте над 2–3-й парой — пульсирующая точка подскажет.`, 'info');
      else say('Куст растёт, новые побеги набирают листья.', 'info');
      render();
      checkGoal();
    };

    const reset = () => {
      uid = 0; week = 5; harvested = 0; goalShown = false; seen = new Set();
      stems = [{ id: ++uid, parent: null, at: 0, side: 0, depth: 0, nodes: 4, state: 'grow' }];
      say('Пятая неделя после всходов: у стебля 4 пары настоящих листьев. Самое время для первого прищипывания — срежьте над 2-й или 3-й парой.', 'info');
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
      if (v >= 8) text = `Всхожесть ${v * 10}\u00a0% — отличные семена. Сейте как обычно, по 2–3 в ячейку.`;
      else if (v >= 5) { text = `Всхожесть ${v * 10}\u00a0% — средняя. Сейте гуще, по 3–4 семени в ячейку.`; cls = 'is-warn'; }
      else { text = `Всхожесть ${v * 10}\u00a0% — слабая. Лучше купить свежие семена, а ценный сорт сеять очень густо.`; cls = 'is-bad'; }
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
  function initDiagnostics() {
    const groups = $('#diag-groups');
    const result = $('#diag-result');
    if (!groups || !result) return;
    const all = [];
    groups.innerHTML = B.DIAG.map(g => `
      <div class="diag-group">
        <h4>${g.group}</h4>
        <div class="chips">${g.items.map(it => { all.push(it); return `<button class="chip" type="button" data-id="${it.id}" aria-pressed="false">${it.title}</button>`; }).join('')}</div>
      </div>`).join('');
    const chips = $$('.chip', groups);
    selectSymptom = (id, scroll) => {
      const it = all.find(x => x.id === id) || all[0];
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id === it.id)));
      result.innerHTML = `
        <h3>${it.title}</h3>
        <p class="hint">${it.causes.length > 1 ? `${it.causes.length} ${plural(it.causes.length, 'возможная причина', 'возможные причины', 'возможных причин')}, от частой к редкой` : 'Наиболее вероятная причина'}</p>
        <ol class="causes">${it.causes.map(c => `
          <li class="cause">
            <header><h4>${c.name}</h4><span class="prob p-${c.p}">${B.P_LABEL[c.p]}</span></header>
            <p><b>Как проверить:</b> ${nb(c.check)}</p>
            <p><b>Что делать:</b> ${nb(c.fix)}</p>
          </li>`).join('')}</ol>`;
      if (scroll && window.matchMedia('(max-width: 940px)').matches) result.scrollIntoView({ block: 'start', behavior: smooth() });
    };
    chips.forEach(c => c.addEventListener('click', () => selectSymptom(c.dataset.id, true)));
    selectSymptom('low-yellow', false);

    const card = (d, i, kind) => `
      <article class="card ref-card" id="${kind}-${i}">
        <h4>${icon(kind === 'dis' ? 'alert' : 'bug')}${d.name}</h4>
        <span class="latin">${d.latin}</span>
        <dl>
          <div><dt>Признаки</dt><dd>${nb(d.sign)}</dd></div>
          <div><dt>Что делать</dt><dd>${nb(d.fix)}</dd></div>
          <div><dt>Профилактика</dt><dd>${nb(d.prevent)}</dd></div>
        </dl>
      </article>`;
    const dg = $('#disease-grid');
    if (dg) dg.innerHTML = B.DISEASES.map((d, i) => card(d, i, 'dis')).join('');
    const pg = $('#pest-grid');
    if (pg) pg.innerHTML = B.PESTS.map((d, i) => card(d, i, 'pest')).join('');
    const tt = $('#treat-table');
    if (tt) tt.innerHTML = `<thead><tr><th scope="col">Средство</th><th scope="col">От чего</th><th scope="col">Как работает</th></tr></thead><tbody>${B.TREATMENTS.map(([a, b, c]) => `<tr><td><b>${a}</b></td><td>${b}</td><td>${nb(c)}</td></tr>`).join('')}</tbody>`;
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
      count.textContent = done === boxes.length ? `Все ${boxes.length} шагов выполнены — отличный сезон!` : `Выполнено ${done} из ${boxes.length}`;
    };
    wrap.addEventListener('change', e => {
      const b = e.target;
      if (!b.dataset || !b.dataset.id) return;
      state[b.dataset.id] = b.checked;
      store.set(KEY, state);
      update();
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

  /* ================================================================== */
  /* BOOT                                                                */
  /* ================================================================== */
  const boot = () => {
    const science = function initScience() { if (window.BasilScience) window.BasilScience.init({ toast }); };
    // content first, decoration after: the animated background and bush start once the chapter is ready
    const steps = [initTheme, initHome, initVarieties, initQuiz, initPlaces, initSoil, initCalendar, initDli, initElements, initStages, initPlan, initNpk, initDose, initSim, initGerm, initDiagnostics, initGlossary, initChecklist, initRecipes, science, initSheets, initPagers, initSearch, initScrollChrome, initRouter, initLinks, initPageAction, initHoverLight, initOffscreenPause, initScene];
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
