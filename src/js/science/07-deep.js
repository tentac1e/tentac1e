  /* ------------------------------------------------------------------ */
  /* deep blocks: reading time, chapter index, a tab's «Раскрыть все»    */
  /* ------------------------------------------------------------------ */
  const KIND = { chem: ['Химия', 'hex'], phys: ['Физика', 'wave'], bio: ['Биология', 'cell'], taste: ['Вкус', 'nose'] };
  /* smooth open/close that works the same in every browser */
  const EASE = 'cubic-bezier(.22,.8,.26,1)';
  function animateDetails(d, open) {
    const body = Array.from(d.children).find(c => c.tagName !== 'SUMMARY');
    if (d._anim) { d._anim.cancel(); d._anim = null; }
    if (!body || !body.animate || reduce.matches) { d.open = open; return; }
    body.style.overflow = 'hidden';
    const done = () => { body.style.overflow = ''; d._anim = null; };
    if (open) {
      d.open = true;
      const h = body.scrollHeight;
      d._anim = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: Math.min(560, 240 + h / 8), easing: EASE });
      d._anim.onfinish = done;
      d._anim.oncancel = done;
    } else {
      const h = body.offsetHeight;
      d._anim = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: Math.min(380, 200 + h / 14), easing: 'ease-in' });
      d._anim.onfinish = () => { d.open = false; done(); };
      d._anim.oncancel = done;
    }
  }
  const ANIMATED = 'details.deep, details.deeper, details.recipe-card';

  // «Раскрыть все» in a tab's «Глубже» line (the build writes it where there are two dives or more): every dive
  // of that zone at once, and «Свернуть все» once they all stand open
  function initDeepAll() {
    const zones = $$('.deep-zone').filter(z => $('[data-deep-all]', z));
    const sync = z => {
      const list = $$('details.deep', z), all = list.every(d => d.open);
      const b = $('[data-deep-all]', z);
      b.textContent = all ? 'Свернуть все' : 'Раскрыть все';
      b.setAttribute('aria-pressed', String(all));
    };
    zones.forEach(z => {
      $('[data-deep-all]', z).addEventListener('click', () => {
        const list = $$('details.deep', z), open = !list.every(d => d.open);
        list.forEach(d => { if (d.open !== open) animateDetails(d, open); });
        sync(z);
      });
      $$('details.deep', z).forEach(d => d.addEventListener('toggle', () => sync(z)));
      sync(z);
    });
  }

  function initDeep() {
    const blocks = $$('details.deep');
    blocks.forEach(d => {
      const body = $('.deep-body', d);
      const words = (body.textContent.match(/\S+/g) || []).length;
      const tools = $$('.lab-tool', body).length;
      const t = $('.deep-time', d);
      if (t) t.textContent = `≈ ${Math.max(1, Math.ceil(words / 150))} мин`;
      if (tools && !$('.deep-tag', d)) $('.deep-meta', d).insertAdjacentHTML('afterbegin', '<span class="deep-tag">интерактив</span>');
      if ($('details.deeper', body)) $('.deep-meta', d).insertAdjacentHTML('afterbegin', '<span class="deep-tag is-deeper" title="Есть раздел «Ещё глубже»">+1 уровень</span>');
      const foot = document.createElement('div');
      foot.className = 'deep-foot';
      foot.innerHTML = `<button type="button" class="deep-close"><span aria-hidden="true">↑</span> Свернуть разворот</button>`;
      body.appendChild(foot);
      $('.deep-close', foot).addEventListener('click', () => {
        const top = d.getBoundingClientRect().top;
        const offset = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64) + 70;
        if (top < offset) window.scrollBy({ top: top - offset, behavior: 'auto' });
        animateDetails(d, false);
        $('summary', d).focus({ preventScroll: true });
      });
    });

    document.addEventListener('click', e => {
      const sm = e.target.closest('summary');
      if (!sm) return;
      const d = sm.parentElement;
      if (!d || !d.matches(ANIMATED)) return;
      e.preventDefault();
      animateDetails(d, !d.open);
    });

    $$('[data-view]').forEach(view => {
      const list = $$('details.deep', view);
      const hero = $('.ch-hero-text', view);
      // the build writes the row into the page; a page without it (an old copy) gets it here
      if (!list.length || !hero || $('.deep-index', hero)) return;
      const deeper = $$('details.deeper', view).length;
      const nav = document.createElement('nav');
      nav.className = 'deep-index';
      nav.setAttribute('aria-label', 'Научные развороты главы');
      nav.innerHTML = `<span class="deep-index-label">${icon('hex')}Глубже <b>${list.length}${deeper ? ` · ещё глубже ${deeper}` : ''}</b></span>` +
        list.map(d => `<a href="#${d.id}" data-kind="${d.dataset.kind}">${icon(KIND[d.dataset.kind][1])}${esc(d.dataset.short)}</a>`).join('');
      hero.appendChild(nav);
    });

    const kinds = $('#sh-kinds');
    if (kinds) {
      // on the home page the chapters are other files: take the counts the build wrote down
      const st = window.BASIL_PAGES && window.BASIL_PAGES.stats;
      const count = k => st ? (st.kinds[k] || 0) : blocks.filter(d => d.dataset.kind === k).length;
      kinds.innerHTML = Object.entries(KIND).map(([k, [name, ic]]) => `<li data-kind="${k}">${icon(ic)}<b>${count(k)}</b><span>${name}</span></li>`).join('') +
        `<li class="is-total">${icon('grid')}<b>${st ? st.labs : $$('.lab-tool').length}</b><span>моделей</span></li><li class="is-total">${icon('book')}<b>${st ? st.deeper : $$('details.deeper').length}</b><span>«ещё глубже»</span></li>`;
    }
    initDeepAll();
  }

  function initHomeMolecule() {
    const cv = $('#home-molecule');
    if (!cv) return;
    const picks = [['lin', 'Линалоол'], ['eug', 'Эвгенол'], ['est', 'Эстрагол'], ['cit', 'Цитраль'], ['car', 'Кариофиллен']];
    const chips = $('#home-mol-chips');
    chips.innerHTML = picks.map(([id, n], i) => `<button class="chip" type="button" data-v="${id}" aria-pressed="${i === 0}">${n}</button>`).join('');
    let viewer = null;
    const note = { lin: 'цветочная нота генуэзского базилика', eug: 'гвоздика и тепло', est: 'анис тайского базилика', cit: 'лимон лимонного базилика', car: 'перец святого базилика' };
    const show = id => {
      $('#home-mol-name').textContent = MOLS[id].name;
      $('#home-mol-note').textContent = `${sub(MOLS[id].formula)} · ${note[id]}`;
      cv.setAttribute('aria-label', `Трёхмерная модель молекулы: ${MOLS[id].name}`);
      if (viewer) viewer.set(id);
    };
    const start = () => { if (!viewer) viewer = MolViewer(cv, 'lin'); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { start(); io.disconnect(); } });
      io.observe(cv);
    } else start();
    chips.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      $$('[data-v]', chips).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      start();
      show(b.dataset.v);
    });
  }

  const api = {
    $, $$, clamp, lerp, fmt, fmt0, f1, minus, nb, esc, css, icon, sub, plural, mix, ramp, parseColor, reduce,
    animateDetails, rangeHtml, segHtml, chipsHtml, bindRange, bindPick, readHtml, head, chart, plot, tip,
    dayLength, h0, noonSun, decl, DOY21, CITIES, MOLS, EXTRA, FAM, CHEMO, CHEMO_COLS, PAIRS, molName, molFam, MolViewer,
    ctx: () => ctx, mount
  };

  function init(context) {
    ctx = context || {};
    initDeep();
    initHomeMolecule();
    // models and pictures are looked for once the page stands where it opens: a link to a block far down
    // jumps there first (the router's first «basil:view»), and the ones above it are not built for nothing
    // pictures at once; the models (heavier, and below the first screen) once the interface has started
    let started = false;
    const models = () => { if (document.documentElement.classList.contains('is-ready')) mountAll(); else document.addEventListener('basil:ready', mountAll, { once: true }); };
    const start = () => { if (started) return; started = true; paint(); models(); };
    document.addEventListener('basil:view', start, { once: true });
    setTimeout(start, 2000);
  }
