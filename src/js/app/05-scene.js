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
    const sel = '.q-card, .tool, .rule, .deep > summary, .world-card, .lab-tool';
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

