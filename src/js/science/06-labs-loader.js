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
  // one script, once: assets/js/<path> with the fingerprint of its content
  const url = (path, v) => (SELF ? SELF.replace(/science\.js(\?.*)?$/, '') : 'assets/js/') + path + (v ? '?v=' + v : '');
  // the page's own scripts (a chapter with pictures brings its files with it): they have run, or will run before
  // DOMContentLoaded
  const own = src => [...document.scripts].some(t => t.src === src);
  const parsed = () => new Promise(r => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', r, { once: true }); else r(); });
  function script(key, path, v) {
    if (!loads[key] && own(url(path, v))) loads[key] = parsed();
    if (!loads[key]) {
      loads[key] = new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = url(path, v);
        // fetched side by side with the others asked for, run in the order they were asked for
        tag.async = false;
        tag.onload = resolve;
        tag.onerror = () => { loads[key] = null; reject(new Error(path)); };
        document.head.appendChild(tag);
      });
    }
    return loads[key];
  }
  // a chapter's models: the drawing libraries it needs (kept in the cache from chapter to chapter), then the
  // chapter's own file — all asked for at once, run in that order
  function ensureLabs(view) {
    const V = window.BASIL_PAGES && window.BASIL_PAGES.v;
    const libs = (V && V.deps && V.deps[view]) || [];
    return Promise.all(libs.map(x => script('lib-' + x, `labs/lib-${x}.js`, V && V.lib && V.lib[x]))
      .concat(script(view, `labs/${view}.js`, V && V.labs && V.labs[view])));
  }
  let ctx = {};
  // a chapter's model styles come in its file and go onto the page just before its first model is built
  const styles = {};
  const styleFor = (view, css) => { if (!(view in styles)) styles[view] = css; };
  function styleOn(el) {
    const host = el.closest('[data-view]'), v = host && host.dataset.view;
    if (!v || !styles[v]) return;
    const st = document.createElement('style');
    st.dataset.labs = v;
    st.textContent = styles[v];
    document.head.appendChild(st);
    styles[v] = '';
  }

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
      view = { y: scrollY, h: innerHeight };
      const mid = view.y + view.h / 2;
      if (work.length > 1) work.sort((a, b) => Math.abs(a._top - mid) - Math.abs(b._top - mid));
      const t0 = performance.now();
      while (work.length && performance.now() - t0 < 8) {
        const el = work.shift(), fn = el._queued;
        el._queued = null;
        try { fn(el); } catch (err) { console.error('[basil]', err); }
      }
      view = null;
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
    styleOn(el);
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
  // fit: false when a batch is drawn — all pictures first, then all captions fitted, one layout instead of one each
  function draw(el, fit = true) {
    const [name, arg = ''] = el.dataset.ill.split(':');
    const fn = ills[name];
    if (!fn) {
      const host = el.closest('[data-view]');
      if (!host || el.dataset.loading) return;
      el.dataset.loading = '1';
      ensureLabs(host.dataset.view).then(() => { delete el.dataset.loading; if (ills[name]) later(el, drawDue, el._top); }, () => { delete el.dataset.loading; });
      return;
    }
    try {
      el.innerHTML = fn(arg, el);
      el.dataset.drawn = el.dataset.ill;
      if (fit) fitIll(el);
      // drawn while the reader looks at its frame: it comes up out of its paper instead of popping in
      if (seen(el) && el.firstElementChild) el.firstElementChild.classList.add('ill-in');
    } catch (err) { console.error('[basil] illustration ' + el.dataset.ill, err); }
  }
  // a caption's plate takes the width of its text — which a picture in a hidden tab does not have yet:
  // fitted when the tab comes up
  // (hidden is told by the markup — asking the box would lay the whole page out right after a large picture went in)
  const HIDDEN = '[data-panel]:not(.is-active), details:not([open]) > :not(summary), [hidden], dialog:not([open])';
  const fitIll = el => { if (el.closest(HIDDEN)) el._unfit = true; else fitLabels(el); };
  // on the screen now, by the place the observer saw it at (no new measuring); a frame never measured is not,
  // and before the page's first paint nothing is: a picture ready by then is simply there
  let paintedYet = false;
  const painted = () => paintedYet || (paintedYet = !!performance.getEntriesByType && performance.getEntriesByType('paint').length > 0);
  // where the screen stands, read once before a batch of drawings: scrollY asked right after a picture went in
  // lays the whole page out again — once for every picture of the batch
  let view = null;
  const seen = el => {
    const y = view ? view.y : scrollY, h = view ? view.h : innerHeight;
    return el._top != null && el._top < y + h && el._top > y - 240 && painted();
  };
  // from the queue: drawn only if nothing drew it in the meantime (a tap, an eager paint)
  const drawDue = el => { if (el.isConnected && el.dataset.drawn !== el.dataset.ill) draw(el); };
  // scrollMargin: a tile in a row that scrolls sideways is drawn a little before it slides in (ignored where unknown)
  let illIO = null;
  // eager: draw now (a gallery the reader sees at once, or a picture replaced on a tap)
  function paint(root = document, eager = false) {
    const list = $$('[data-ill]', root).filter(el => el.dataset.drawn !== el.dataset.ill);
    if (root !== document && root.matches && root.matches('[data-ill]')) list.push(root);
    if (eager || !('IntersectionObserver' in window)) { list.forEach(draw); return; }
    if (!illIO) illIO = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { later(en.target, drawDue, en.boundingClientRect.top + scrollY); illIO.unobserve(en.target); } }), { rootMargin: '400px 0px', scrollMargin: '0px 300px' });
    // what already stands on the screen is drawn now when its painter is here (the interface builds a block of
    // pictures during start-up, and the queue waits for the start-up to end): all measured first, then all drawn,
    // then all their captions fitted — the reader looks at these, none of them waits a turn
    const vh = innerHeight, now = [], rest = [];
    list.forEach(el => {
      if (ills[el.dataset.ill.split(':')[0]] && el.getClientRects().length) {
        const r = el.getBoundingClientRect();
        // on the screen both ways: a row of tiles that scrolls sideways shows only its first few
        if (r.bottom > 0 && r.top < vh && r.right > 0 && r.left < innerWidth) { el._top = r.top + scrollY; now.push(el); return; }
      }
      rest.push(el);
    });
    // the ones off the screen wait until the interface has started: they are not what the reader looks at
    const watch = () => rest.forEach(el => illIO.observe(el));
    if (document.documentElement.classList.contains('is-ready')) watch(); else document.addEventListener('basil:ready', watch, { once: true });
    view = { y: scrollY, h: vh };
    now.forEach(el => draw(el, false));
    view = null;
    now.forEach(el => { if (el.dataset.drawn) fitIll(el); });
  }

  /* a tab coming up (the router says so before its first frame): what it shows on the screen is drawn now,
     and the captions of the pictures drawn ahead while it was hidden take the width of their text */
  document.addEventListener('basil:panel', e => {
    const panel = document.getElementById(e.detail && e.detail.id);
    if (!panel) return;
    $$('[data-ill]', panel).forEach(el => { if (el._unfit) { el._unfit = false; fitLabels(el); } });
    // a tap asked for this tab: all it shows is drawn before its first frame, none left blank for a turn
    paint(panel);
  });

  let stirred = 0;
  ['scroll', 'wheel', 'pointerdown', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => { stirred = performance.now(); }, { passive: true, capture: true }));
  /* once the interface has started, in idle moments: the page's other pictures — the rest of the open tab, then
     the hidden tabs — drawn ahead a few at a time, so a tab or a fast scroll finds them ready */
  function ahead() {
    const idle = window.requestIdleCallback || ((fn, o) => setTimeout(() => fn({ timeRemaining: () => 8 }), 120));
    const host = document.querySelector('[data-view].is-active') || document.querySelector('[data-view]');
    if (!host) return;
    const hidden = el => !!el.closest('[data-panel]:not(.is-active)');
    const list = $$('[data-ill]', host).filter(el => el.dataset.drawn !== el.dataset.ill && ills[el.dataset.ill.split(':')[0]]);
    list.sort((a, b) => hidden(a) - hidden(b));
    // one picture per idle moment, and only while the reader is still (no scrolling or tapping for 1.5 s):
    // a large one (a box of seedlings, a bush) is work that cannot be split, and must not land in the middle of a swipe
    const step = d => {
      if (performance.now() - stirred < 1500) { setTimeout(() => idle(step, { timeout: 4000 }), 800); return; }
      if (d.timeRemaining() > 8 || d.didTimeout) { const el = list.shift(); if (el.isConnected && el.dataset.drawn !== el.dataset.ill) draw(el); }
      if (list.length) idle(step, { timeout: 4000 });
    };
    if (list.length) idle(step, { timeout: 4000 });
  }
  // not while the page is starting: a reader who taps a tab before then gets its pictures drawn on the tap
  document.addEventListener('basil:ready', () => setTimeout(ahead, 2500), { once: true });

  /* a chapter with pictures brings its picture files with it (the build puts them after science.js): the
     pictures already on the screen are drawn at DOMContentLoaded, before the interface starts — not after the
     whole start-up and a turn in the queue */
  function early() {
    if (![...document.scripts].some(t => /\/labs\/[a-z]+\.js/.test(t.src))) return;
    parsed().then(() => {
      const host = document.querySelector('[data-view].is-active') || document.querySelector('[data-view]');
      if (!host) return;
      $$('[data-ill]', host).forEach(el => {
        const [name] = el.dataset.ill.split(':');
        if (!ills[name] || el.dataset.drawn === el.dataset.ill || !el.getClientRects().length) return;
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) { el._top = r.top + scrollY; draw(el); }
      });
    });
  }
  early();
