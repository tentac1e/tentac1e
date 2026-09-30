  /* ------------------------------------------------------------------ */
  /* registry: every <div class="lab-tool" data-lab="…"> gets its model  */
  /* when it first becomes visible (inside an opened «Глубже»)           */
  /* ------------------------------------------------------------------ */
  const labs = {};
  const register = (name, fn) => { labs[name] = fn; };
  /* models live in assets/js/labs/<chapter>.js (built from src/labs/<chapter>/); a page fetches
     its chapter's file only when the first model scrolls near */
  const SELF = document.currentScript && document.currentScript.src;
  const loads = {};
  function ensureLabs(view) {
    if (!loads[view]) {
      loads[view] = new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        const vs = window.BASIL_PAGES && window.BASIL_PAGES.v && window.BASIL_PAGES.v.labs;
        const v = vs && vs[view] ? '?v=' + vs[view] : '';
        tag.src = (SELF ? SELF.replace(/science\.js(\?.*)?$/, '') : 'assets/js/') + `labs/${view}.js` + v;
        tag.onload = resolve;
        tag.onerror = () => { loads[view] = null; reject(new Error(`labs/${view}.js`)); };
        document.head.appendChild(tag);
      });
    }
    return loads[view];
  }
  let ctx = {};

  const failed = el => { el.innerHTML = '<p class="muted">Модель не загрузилась. Обновите страницу.</p>'; };
  function mount(el) {
    if (el.dataset.ready) return;
    const fn = labs[el.dataset.lab];
    if (!fn) {
      // not loaded yet: fetch the chapter's models once, then try again
      const host = el.closest('[data-view]');
      if (!host || el.dataset.loading) return;
      el.dataset.loading = '1';
      ensureLabs(host.dataset.view).then(() => { delete el.dataset.loading; if (labs[el.dataset.lab]) mount(el); else failed(el); }, () => { delete el.dataset.loading; failed(el); });
      return;
    }
    el.dataset.ready = '1';
    try { fn(el, api); } catch (err) { console.error('[basil] lab ' + el.dataset.lab, err); failed(el); }
  }
  function mountAll() {
    const tools = $$('.lab-tool[data-lab]');
    if (!('IntersectionObserver' in window)) { tools.forEach(mount); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { mount(en.target); io.unobserve(en.target); } }), { rootMargin: '200px 0px' });
    tools.forEach(t => io.observe(t));
  }

