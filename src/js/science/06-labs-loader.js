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

  /* what comes near the screen is built a piece at a time: up to ~8 ms of work per turn, the nearest to the
     middle of the screen first — scrolling and taps never wait for a whole row of pictures and models */
  const work = [];
  let working = false;
  const pause = () => (window.scheduler && typeof window.scheduler.yield === 'function' ? window.scheduler.yield() : new Promise(r => setTimeout(r, 0)));
  // top: where the element stands on the page (an observer entry gives it without measuring again);
  // the order is decided by those numbers alone — measuring between drawings would lay the page out each time
  function later(el, fn, top) {
    if (el._queued) return;
    el._queued = fn;
    el._top = top != null ? top : el.getBoundingClientRect().top + scrollY;
    work.push(el);
    // never in the task that asked: an observer callback or a script that just loaded ends first
    if (!working) { working = true; pause().then(drain); }
  }
  async function drain() {
    while (work.length) {
      const mid = scrollY + innerHeight / 2;
      if (work.length > 1) work.sort((a, b) => Math.abs(a._top - mid) - Math.abs(b._top - mid));
      const t0 = performance.now();
      while (work.length && performance.now() - t0 < 8) {
        const el = work.shift(), fn = el._queued;
        el._queued = null;
        try { fn(el); } catch (err) { console.error('[basil]', err); }
      }
      if (work.length) await pause();
    }
    working = false;
  }
  function mount(el) {
    if (el.dataset.ready) return;
    const fn = labs[el.dataset.lab];
    if (!fn) {
      // not loaded yet: fetch the chapter's models once, then try again
      const host = el.closest('[data-view]');
      if (!host || el.dataset.loading) return;
      el.dataset.loading = '1';
      ensureLabs(host.dataset.view).then(() => { delete el.dataset.loading; if (labs[el.dataset.lab]) later(el, mount, el._top); else failed(el); }, () => { delete el.dataset.loading; failed(el); });
      return;
    }
    el.dataset.ready = '1';
    try { fn(el, api); } catch (err) { console.error('[basil] lab ' + el.dataset.lab, err); failed(el); }
  }
  function mountAll() {
    const tools = $$('.lab-tool[data-lab]');
    if (!('IntersectionObserver' in window)) { tools.forEach(mount); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { later(en.target, mount, en.boundingClientRect.top + scrollY); io.unobserve(en.target); } }), { rootMargin: '200px 0px' });
    tools.forEach(t => io.observe(t));
  }

  /* illustrations: <span data-ill="painter:variant"> gets its picture from the chapter's model file
     (the painters register there with illustrate()); drawn when it comes near the screen.
     A painter may list its variants (an array or a function returning one): the tests and the
     gallery then draw the ones a page shows only after a tap */
  const ills = {};
  const illKeys = {};
  const illustrate = (name, fn, keys) => { ills[name] = fn; if (keys) illKeys[name] = keys; };
  const variants = () => Object.keys(illKeys).reduce((o, n) => { o[n] = (typeof illKeys[n] === 'function' ? illKeys[n]() : illKeys[n]).map(String); return o; }, {});
  function draw(el) {
    const [name, arg = ''] = el.dataset.ill.split(':');
    const fn = ills[name];
    if (!fn) {
      const host = el.closest('[data-view]');
      if (!host || el.dataset.loading) return;
      el.dataset.loading = '1';
      ensureLabs(host.dataset.view).then(() => { delete el.dataset.loading; if (ills[name]) later(el, drawDue, el._top); }, () => { delete el.dataset.loading; });
      return;
    }
    try { el.innerHTML = fn(arg, el); el.dataset.drawn = el.dataset.ill; fitLabels(el); } catch (err) { console.error('[basil] illustration ' + el.dataset.ill, err); }
  }
  // from the queue: drawn only if nothing drew it in the meantime (a tap, an eager paint)
  const drawDue = el => { if (el.isConnected && el.dataset.drawn !== el.dataset.ill) draw(el); };
  let illIO = null;
  // eager: draw now (a gallery the reader sees at once, or a picture replaced on a tap)
  function paint(root = document, eager = false) {
    const list = $$('[data-ill]', root).filter(el => el.dataset.drawn !== el.dataset.ill);
    if (root !== document && root.matches && root.matches('[data-ill]')) list.push(root);
    if (eager || !('IntersectionObserver' in window)) { list.forEach(draw); return; }
    if (!illIO) illIO = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { later(en.target, drawDue, en.boundingClientRect.top + scrollY); illIO.unobserve(en.target); } }), { rootMargin: '400px 0px' });
    list.forEach(el => illIO.observe(el));
  }

