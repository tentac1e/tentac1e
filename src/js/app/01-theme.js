  /* ================================================================== */
  /* THEME and the skins «Гримуар» and «Друид»                           */
  /* ================================================================== */
  /* A skin (data-skin on <html>: grimoire, druid) dresses the whole guide and lies over the dark theme: with one on, the
     page is dark whatever the reader chose for the moon button, which steps aside; with none, that choice comes back.
     The inline script in <head> (layout.html) puts both before the first paint. The reader picks the skin in the menu
     of the button in the header (#skin-btn, #skin-menu: «Обычное · Гримуар · Друид»); it is kept in basil-skin. The
     scenes of the skins (assets/js/skins.js) are fetched only while one is on */
  const SKINS = { grimoire: { name: '«Гримуар»', color: '#0B0910', ico: '#i-candle' }, druid: { name: '«Друид»', color: '#0B120D', ico: '#i-rune' } };
  function initTheme() {
    const root = document.documentElement;
    const btn = $('#theme-toggle'), skinBtn = $('#skin-btn'), menu = $('#skin-menu');
    if (!root.lang) root.lang = 'ru';
    const meta = $('meta[name="theme-color"]'), metaColor = meta ? meta.content : '';
    const skinNow = () => { const s = root.getAttribute('data-skin'); return SKINS[s] ? s : null; };
    const saved = store.get('basil-theme', null);
    if (!skinNow() && (saved === 'light' || saved === 'dark')) root.setAttribute('data-theme', saved);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = () => root.getAttribute('data-theme') === 'dark' || (root.getAttribute('data-theme') !== 'light' && mq.matches);
    const sync = () => {
      const d = isDark(), s = skinNow();
      if (btn) {
        btn.setAttribute('aria-label', d ? 'Включить светлую тему' : 'Включить тёмную тему');
        btn.querySelector('use').setAttribute('href', d ? '#i-sun' : '#i-moon');
      }
      if (skinBtn) {
        skinBtn.setAttribute('aria-label', 'Оформление гида: ' + (s ? SKINS[s].name : 'обычное'));
        skinBtn.querySelector('use').setAttribute('href', s ? SKINS[s].ico : '#i-skin');
      }
      if (menu) $$('[role="menuitemradio"]', menu).forEach(b => b.setAttribute('aria-checked', String((b.dataset.skin || null) === s)));
      if (meta) meta.content = s ? SKINS[s].color : metaColor;
      if (s) loadSkins();
      document.dispatchEvent(new CustomEvent('basil:theme'));
    };
    if (btn) btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('basil-theme', next);
    });
    const setSkin = s => {
      if (!SKINS[s]) s = null;
      store.set('basil-skin', s);
      if (s) { root.setAttribute('data-skin', s); root.setAttribute('data-theme', 'dark'); return; }
      root.removeAttribute('data-skin');
      const t = store.get('basil-theme', null);
      if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    };
    // the menu: opens under its button, an item picks the skin and closes it; Esc, a click aside or Tab away close it too
    if (skinBtn && menu) {
      const items = () => $$('[role="menuitemradio"]', menu);
      const open = () => {
        menu.hidden = false;
        skinBtn.setAttribute('aria-expanded', 'true');
        (items().find(b => b.getAttribute('aria-checked') === 'true') || items()[0]).focus();
      };
      const close = (back = false) => {
        if (menu.hidden) return;
        menu.hidden = true;
        skinBtn.setAttribute('aria-expanded', 'false');
        if (back) skinBtn.focus();
      };
      skinBtn.addEventListener('click', () => (menu.hidden ? open() : close()));
      menu.addEventListener('click', e => {
        const b = e.target.closest('[role="menuitemradio"]');
        if (!b) return;
        setSkin(b.dataset.skin || null);
        close(true);
      });
      menu.addEventListener('keydown', e => {
        const list = items(), i = list.indexOf(document.activeElement);
        if (e.key === 'Escape') { e.preventDefault(); close(true); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus(); }
        else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); list[e.key === 'Home' ? 0 : list.length - 1].focus(); }
        else if (e.key === 'Tab') close();
      });
      document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('.skin-pick')) close(); });
    }
    if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-skin'] });
    sync();
  }

  // the skins' scenes: one script, once, with the fingerprint pages.js gives it (the one-file book carries it inline)
  let skinsLoad = null;
  function loadSkins() {
    if (window.BasilSkins) { window.BasilSkins.start(); return; }
    if (skinsLoad) return;
    const v = PAGES && PAGES.v && PAGES.v.skins;
    const app = [...document.scripts].find(s => /assets\/js\/app\.js/.test(s.src));
    const tag = document.createElement('script');
    tag.src = (app ? app.src.replace(/app\.js(\?.*)?$/, '') : 'assets/js/') + 'skins.js' + (v ? '?v=' + v : '');
    tag.onload = () => { if (window.BasilSkins) window.BasilSkins.start(); };
    tag.onerror = () => { skinsLoad = null; };
    skinsLoad = tag;
    document.head.appendChild(tag);
  }
