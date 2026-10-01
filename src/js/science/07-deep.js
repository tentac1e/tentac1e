  /* ------------------------------------------------------------------ */
  /* deep blocks: reading time, chapter index, open-all switch           */
  /* ------------------------------------------------------------------ */
  const KIND = { chem: ['Химия', 'hex'], phys: ['Физика', 'wave'], bio: ['Биология', 'cell'], taste: ['Вкус', 'nose'] };
  const DEPTH_KEY = 'basil-depth';
  const DEPTHS = [
    ['Практика', 'только советы, развороты свёрнуты'],
    ['Наука', 'раскрыть все развороты «Глубже»'],
    ['Лаборатория', 'и ещё глубже: механизмы, формулы, источники']
  ];
  const store = {
    get() {
      try {
        const v = localStorage.getItem(DEPTH_KEY);
        if (v !== null) return clamp(parseInt(v, 10) || 0, 0, 2);
        return localStorage.getItem('basil-deep') === '1' ? 1 : 0;
      } catch (e) { return 0; }
    },
    set(v) { try { localStorage.setItem(DEPTH_KEY, String(v)); } catch (e) { /* private mode */ } }
  };

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

  function setDepth(level, announce) {
    level = clamp(level | 0, 0, 2);
    const root = document.documentElement;
    root.dataset.depth = String(level);
    root.classList.toggle('deep-on', level > 0);
    $$('details.deep').forEach(d => { d.open = level > 0; });
    $$('details.deeper').forEach(d => { d.open = level > 1; });
    const btn = $('#deep-toggle');
    if (btn) {
      btn.dataset.depth = String(level);
      btn.setAttribute('aria-label', `Глубина чтения: ${DEPTHS[level][0]}`);
      btn.setAttribute('aria-pressed', String(level > 0));
    }
    $$('[data-depth-pick]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.depthPick === level)));
    $$('.depth-pop [role="menuitemradio"]').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.depthPick === level)));
    if (announce && ctx.toast) {
      const n = $$('details.deep').length, m = $$('details.deeper').length;
      if (!n) ctx.toast(level === 0 ? 'Практика: научные развороты будут свёрнуты во всех главах' : level === 1 ? 'Наука: во всех главах развороты «Глубже» будут открыты' : 'Лаборатория: во всех главах открыто всё, вплоть до «Ещё глубже»');
      else ctx.toast(level === 0 ? 'Практика: научные развороты свёрнуты' : level === 1 ? `Наука: открыто ${n} ${plural(n, 'разворот', 'разворота', 'разворотов')}` : `Лаборатория: открыто всё, включая ${m} ${plural(m, 'раздел', 'раздела', 'разделов')} «Ещё глубже»`);
    }
  }

  function initDepthControl() {
    const btn = $('#deep-toggle');
    if (btn) {
      const pop = document.createElement('div');
      pop.className = 'depth-pop';
      pop.id = 'depth-pop';
      pop.setAttribute('role', 'menu');
      pop.setAttribute('aria-label', 'Глубина чтения');
      pop.hidden = true;
      pop.innerHTML = `<p class="depth-pop-h">Глубина чтения</p>` + DEPTHS.map(([name, note], i) =>
        `<button type="button" role="menuitemradio" aria-checked="false" data-depth-pick="${i}"><span class="depth-dots" aria-hidden="true">${'<i></i>'.repeat(i + 1)}</span><span><b>${name}</b><small>${note}</small></span></button>`).join('') +
        (window.BasilHaptics && window.BasilHaptics.supported ? `<button type="button" role="menuitemcheckbox" class="depth-hap" data-haptics aria-checked="${window.BasilHaptics.enabled}"><span class="hap-switch" aria-hidden="true"></span><span><b>Отклик вибрацией</b><small>лёгкие щелчки, когда крутите и переключаете</small></span></button>` : '');
      btn.after(pop);
      btn.setAttribute('aria-haspopup', 'menu');
      btn.setAttribute('aria-controls', 'depth-pop');
      const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      const place = () => {
        const r = btn.getBoundingClientRect();
        pop.style.top = Math.round(r.bottom + 10) + 'px';
        pop.style.right = Math.max(8, Math.round(window.innerWidth - r.right - 60)) + 'px';
        pop.style.setProperty('--arrow', Math.round(window.innerWidth - r.right + r.width / 2 - parseFloat(pop.style.right)) + 'px');
      };
      const openPop = () => {
        place();
        pop.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        const cur = $('[aria-checked="true"]', pop) || $('button', pop);
        cur.focus({ preventScroll: true });
      };
      btn.addEventListener('click', e => { e.stopPropagation(); if (pop.hidden) openPop(); else close(); });
      pop.addEventListener('click', e => {
        const hb = e.target.closest('[data-haptics]');
        if (hb) {
          const v = !window.BasilHaptics.enabled;
          window.BasilHaptics.set(v);
          hb.setAttribute('aria-checked', String(v));
          return;
        }
        const b = e.target.closest('[data-depth-pick]');
        if (!b) return;
        const v = +b.dataset.depthPick;
        store.set(v); setDepth(v, true); close(); btn.focus({ preventScroll: true });
      });
      pop.addEventListener('keydown', e => {
        const items = $$('button', pop), i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus({ preventScroll: true }); }
        if (e.key === 'ArrowUp') { e.preventDefault(); items[(i + items.length - 1) % items.length].focus({ preventScroll: true }); }
        if (e.key === 'Escape') { close(); btn.focus({ preventScroll: true }); }
      });
      document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) close(); });
      window.addEventListener('hashchange', close);
      window.addEventListener('resize', () => { if (!pop.hidden) place(); });
    }
    $$('.depth-seg [data-depth-pick]').forEach(b => b.addEventListener('click', () => { const v = +b.dataset.depthPick; store.set(v); setDepth(v, true); }));
    setDepth(store.get(), false);
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
      if (!list.length || !hero) return;
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
    initDepthControl();
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
    let started = false;
    const start = () => { if (started) return; started = true; mountAll(); paint(); };
    document.addEventListener('basil:view', start, { once: true });
    setTimeout(start, 2000);
  }
