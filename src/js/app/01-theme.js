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

