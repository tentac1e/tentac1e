  /* ================================================================== */
  /* THEME and the theme «Гримуар»                                       */
  /* ================================================================== */
  /* «Гримуар» (data-skin="grimoire") lies over the dark theme: with it on, the page is dark whatever the reader chose
     for the moon button, which steps aside; with it off, that choice comes back. The inline script in <head> (layout.html)
     puts both before the first paint. Its scenes (assets/js/grimoire.js) are fetched only while it is on */
  const SKIN = 'grimoire';
  function initTheme() {
    const root = document.documentElement;
    const btn = $('#theme-toggle'), skinBtn = $('#skin-toggle');
    if (!root.lang) root.lang = 'ru';
    const meta = $('meta[name="theme-color"]'), metaColor = meta ? meta.content : '';
    const skinOn = () => root.getAttribute('data-skin') === SKIN;
    const saved = store.get('basil-theme', null);
    if (!skinOn() && (saved === 'light' || saved === 'dark')) root.setAttribute('data-theme', saved);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = () => root.getAttribute('data-theme') === 'dark' || (root.getAttribute('data-theme') !== 'light' && mq.matches);
    const sync = () => {
      const d = isDark(), g = skinOn();
      if (btn) {
        btn.setAttribute('aria-label', d ? 'Включить светлую тему' : 'Включить тёмную тему');
        btn.querySelector('use').setAttribute('href', d ? '#i-sun' : '#i-moon');
      }
      if (skinBtn) {
        skinBtn.setAttribute('aria-pressed', String(g));
        skinBtn.setAttribute('aria-label', g ? 'Выключить оформление «Гримуар»' : 'Включить оформление «Гримуар»');
      }
      if (meta) meta.content = g ? '#0B0910' : metaColor;
      if (g) loadGrimoire();
      document.dispatchEvent(new CustomEvent('basil:theme'));
    };
    if (btn) btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('basil-theme', next);
    });
    if (skinBtn) skinBtn.addEventListener('click', () => {
      const on = !skinOn();
      store.set('basil-skin', on ? SKIN : null);
      if (on) { root.setAttribute('data-skin', SKIN); root.setAttribute('data-theme', 'dark'); return; }
      root.removeAttribute('data-skin');
      const t = store.get('basil-theme', null);
      if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    });
    if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-skin'] });
    sync();
  }

  // the theme's scenes: one script, once, with the fingerprint pages.js gives it (the one-file book carries it inline)
  let grimoireLoad = null;
  function loadGrimoire() {
    if (window.BasilGrimoire) { window.BasilGrimoire.start(); return; }
    if (grimoireLoad) return;
    const v = PAGES && PAGES.v && PAGES.v.grimoire;
    const app = [...document.scripts].find(s => /assets\/js\/app\.js/.test(s.src));
    const tag = document.createElement('script');
    tag.src = (app ? app.src.replace(/app\.js(\?.*)?$/, '') : 'assets/js/') + 'grimoire.js' + (v ? '?v=' + v : '');
    tag.onload = () => { if (window.BasilGrimoire) window.BasilGrimoire.start(); };
    tag.onerror = () => { grimoireLoad = null; };
    grimoireLoad = tag;
    document.head.appendChild(tag);
  }
