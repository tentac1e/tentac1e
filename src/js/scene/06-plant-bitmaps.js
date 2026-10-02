  /* ------------------------------------------------------------------ */
  /* leaf bitmaps: the hero bush moves ~40 leaves every frame; drawing  */
  /* ready-made pictures is far cheaper than re-painting vector leaves  */
  /* with gradients and veins, and looks the same                       */
  /* ------------------------------------------------------------------ */
  const LEAF_D = { pet: 'M0 1 L0 -12', blade: 'M0 -10 C 22 -11 31 -30 30 -50 C 29 -72 13 -98 0 -110 C -13 -98 -29 -72 -30 -50 C -31 -30 -22 -11 0 -10 Z', fold: 'M0 -10 C 22 -11 31 -30 30 -50 C 29 -72 13 -98 0 -110 Z', shine: 'M-4 -20 C -19 -27 -24 -46 -21 -62 C -18 -78 -9 -92 -2 -101 C -7 -82 -10 -52 -4 -20 Z', vein: 'M0 -11 Q 1.6 -58 0 -105 M0.4 -28 Q 12 -32 21 -45 M0.4 -28 Q -12 -32 -21 -45 M0.6 -46 Q 11 -51 18 -64 M0.6 -46 Q -11 -51 -18 -64 M0.5 -64 Q 8 -69 12 -80 M0.5 -64 Q -8 -69 -12 -80 M0.4 -80 Q 5 -85 7 -93 M0.4 -80 Q -5 -85 -7 -93' };
  const LEAF_BOX = { x: -33, y: -112, w: 66, h: 116 };
  const LEAF_FILLS = { 'url(#pl-grad)': ['--pl-a', '--pl-b'], 'url(#pl-grad-young)': ['--pl-b', '--pl-c'], 'url(#pl-grad-back)': ['--pl-back-a', '--pl-back-b'], 'url(#pl-grad-purple)': ['--pl-pa', '--pl-pb'] };
  let leafArt = null, leafArtTheme = '';
  const themeKey = () => ['--pl-a', '--pl-b', '--pl-c', '--pl-back-a', '--pl-pa', '--pl-vein'].map(css).join('|');
  function leafBitmaps() {
    const theme = themeKey();
    if (leafArt && leafArtTheme === theme) return leafArt;
    leafArtTheme = theme;
    const R = clamp(Math.ceil((window.devicePixelRatio || 1) * 1.6), 2, 4);
    const B = LEAF_BOX;
    leafArt = Promise.all(Object.entries(LEAF_FILLS).map(([fill, [a, b]]) => new Promise(resolve => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${B.w * R}" height="${B.h * R}" viewBox="${B.x} ${B.y} ${B.w} ${B.h}">` +
        `<defs><linearGradient id="g" x1="0" y1="1" x2="0.25" y2="0"><stop offset="0" stop-color="${css(a)}"/><stop offset="1" stop-color="${css(b)}"/></linearGradient></defs>` +
        `<path d="${LEAF_D.pet}" fill="none" stroke="${css('--pl-pet')}" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="${LEAF_D.blade}" fill="url(#g)"/><path d="${LEAF_D.fold}" fill="${css('--pl-fold')}"/><path d="${LEAF_D.shine}" fill="${css('--pl-shine')}"/>` +
        `<path d="${LEAF_D.vein}" fill="none" stroke="${css('--pl-vein')}" stroke-width="1.4" stroke-linecap="round"/></svg>`;
      const img = new Image();
      img.onload = () => {
        try {
          const c = makeCanvas(B.w * R, B.h * R);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          if (c.toBlob && window.URL && URL.createObjectURL) c.toBlob(b => resolve([fill, b ? URL.createObjectURL(b) : c.toDataURL('image/png')]), 'image/png');
          else resolve([fill, c.toDataURL('image/png')]);
        } catch (e) { resolve([fill, null]); }
      };
      img.onerror = () => resolve([fill, null]);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }))).then(list => Object.fromEntries(list.filter(x => x[1])));
    return leafArt;
  }

  function Plant(svg, spec, o = {}) {
    const root = svg.ownerSVGElement || svg;
    const layers = {
      back: mk('g', { class: 'pl-back' }, svg),
      stems: mk('g', { class: 'pl-stems' }, svg),
      mid: mk('g', { class: 'pl-mid' }, svg),
      front: mk('g', { class: 'pl-front' }, svg)
    };
    const base = { x: o.x || 0, y: o.y || 0 };
    const growDur = o.growDur || 2.4;
    let shoots = [];
    let last = 0, visible = true, running = false;
    // the breeze on the plant: 1 while the reader does something, dies down to 0 when the page is left alone
    let breeze = 1;
    const ptr = { x: -9999, y: -9999, speed: 0, down: false, lastAroma: 0 };
    let bitmaps = null;
    // o.raster: swap vector leaves for bitmaps once they are drawn (and again after a theme change)
    function applyBitmaps(map) {
      bitmaps = map;
      for (const sh of shoots) for (const lf of sh.leaves) {
        const art = map[lf.fill];
        if (!art) continue;
        if (lf.el.tagName.toLowerCase() === 'image') { lf.el.setAttribute('href', art); continue; }
        const img = mk('image', { href: art, class: lf.el.getAttribute('class'), x: LEAF_BOX.x, y: LEAF_BOX.y, width: LEAF_BOX.w, height: LEAF_BOX.h });
        const tr = lf.el.getAttribute('transform');
        if (tr) img.setAttribute('transform', tr);
        img.style.display = lf.el.style.display;
        lf.el.replaceWith(img);
        lf.el = img;
      }
    }
    // back to vector leaves (coloured by the stylesheet), until bitmaps in the colours of now are drawn
    function applyVector() {
      bitmaps = null;
      for (const sh of shoots) for (const lf of sh.leaves) {
        if (lf.el.tagName.toLowerCase() !== 'image') continue;
        const u = mk('use', { href: '#pl-leaf', class: lf.el.getAttribute('class') });
        const tr = lf.el.getAttribute('transform');
        if (tr) u.setAttribute('transform', tr);
        u.style.display = lf.el.style.display;
        u.style.fill = lf.fill;
        lf.el.replaceWith(u);
        lf.el = u;
      }
    }
    if (o.raster) {
      leafBitmaps().then(applyBitmaps);
      // a theme change: the leaves take the new colours at once, as vector, and the bitmaps of those colours come
      // after — never a frame of last theme's leaves on this theme's stems (on a slow phone that was a second);
      // bitmaps that come late for a theme already left are not put on
      document.addEventListener('basil:theme', () => {
        applyVector();
        const want = themeKey();
        setTimeout(() => leafBitmaps().then(map => { if (themeKey() === want) applyBitmaps(map); }), 60);
      });
    }

    function build(sp, parent, at, keep) {
      const prev = keep && keep.get(sp.id);
      const s = {
        spec: sp, parent, at,
        grow: prev ? prev.grow : (o.grown ? 1 : 0),
        started: !!(prev && prev.started) || !parent,
        sw: 0, sv: 0, pts: [], tipA: 0,
        stem: mk('path', { class: 'pl-stem' + (sp.purple ? ' is-purple' : '') }, layers.stems),
        hl: mk('path', { class: 'pl-stem-hl' }, layers.stems),
        cap: sp.apex === 'cut' ? mk('circle', { class: 'pl-scar', r: 2.2 }, layers.stems) : null,
        leaves: []
      };
      const n = sp.internodes.length;
      sp.internodes.forEach((_, i) => {
        const size = sp.leaves[i];
        const young = i >= n - 2 && sp.apex !== 'cut';
        const fill = sp.purple ? 'url(#pl-grad-purple)' : young ? 'url(#pl-grad-young)' : 'url(#pl-grad)';
        const pairSide = i % 2 === 0;
        const spreadBase = 64 - 40 * Math.pow(i / Math.max(1, n - 1), 1.15);
        const mkLeaf = (layer, side, kind, extraFill) => {
          const f = extraFill || fill;
          const cls = 'pl-leaf' + (kind === 'back' ? ' is-back' : '');
          const art = bitmaps && bitmaps[f];
          const e = art ? mk('image', { href: art, class: cls, x: LEAF_BOX.x, y: LEAF_BOX.y, width: LEAF_BOX.w, height: LEAF_BOX.h }, layer) : mk('use', { href: '#pl-leaf', class: cls }, layer);
          if (!art) e.style.fill = f;
          s.leaves.push({ el: e, fill: f, node: i, side, kind, size, spread: spreadBase, a: 0, v: 0, ph: Math.random() * TAU });
        };
        if (pairSide) {
          mkLeaf(layers.mid, -1, 'side');
          mkLeaf(layers.mid, 1, 'side');
        } else {
          const lean = (i % 4 === 1) ? 1 : -1;
          mkLeaf(layers.back, -lean, 'back', sp.purple ? 'url(#pl-grad-purple)' : 'url(#pl-grad-back)');
          mkLeaf(layers.front, lean, 'front');
        }
      });
      shoots.push(s);
      sp.children.forEach(ch => build(ch.spec, s, ch.at, keep));
      return s;
    }

    function setSpec(sp, opts = {}) {
      const keep = new Map(shoots.map(s => [s.spec.id, s]));
      Object.values(layers).forEach(l => { while (l.firstChild) l.firstChild.remove(); });
      shoots = [];
      build(sp, null, 0, opts.regrow ? null : keep);
      if (opts.regrow) shoots.forEach(s => { s.grow = 0; s.started = !s.parent; });
      if (reduce.matches || o.static) { shoots.forEach(s => { s.grow = 1; s.started = true; }); draw(now(), 0); }
      else wake();
    }

    const nodeE = (s, i) => {
      const n = s.spec.internodes.length;
      const x = s.grow * (n + 1.5) - i;
      return clamp(x / 1.5, 0, 1);
    };

    function layout(s, P, ang) {
      const sp = s.spec, n = sp.internodes.length;
      let x = P.x, y = P.y, a = ang + sp.angle * Math.min(1, s.grow * 3);
      s.pts[0] = { x, y, a };
      let wsum = 0;
      for (let i = 0; i < n; i++) wsum += Math.pow(i + 1, 1.3);
      for (let i = 0; i < n; i++) {
        a += s.bend * Math.pow(i + 1, 1.3) / wsum;
        const len = sp.internodes[i] * Math.max(0.001, nodeE(s, i));
        x += Math.sin(a) * len;
        y -= Math.cos(a) * len;
        s.pts[i + 1] = { x, y, a };
      }
      s.tipA = a;
    }

    function stemPath(s) {
      const pts = s.pts, n = pts.length - 1, sp = s.spec;
      const L = [], R = [];
      for (let i = 0; i <= n; i++) {
        const w = lerp(sp.w0, sp.w1, i / n) * (0.35 + 0.65 * Math.min(1, s.grow * 1.6)) / 2;
        const p = pts[i], cs = Math.cos(p.a), sn = Math.sin(p.a);
        L.push([p.x - cs * w, p.y - sn * w]);
        R.push([p.x + cs * w, p.y + sn * w]);
      }
      const seg = arr => {
        let d = '';
        for (let i = 1; i < arr.length - 1; i++) {
          const m = [(arr[i][0] + arr[i + 1][0]) / 2, (arr[i][1] + arr[i + 1][1]) / 2];
          d += ` Q${f2(arr[i][0])} ${f2(arr[i][1])} ${f2(m[0])} ${f2(m[1])}`;
        }
        const e = arr[arr.length - 1];
        return d + ` L${f2(e[0])} ${f2(e[1])}`;
      };
      const tip = pts[n];
      const rTip = lerp(sp.w0, sp.w1, 1) * 0.5;
      const Rr = R.slice().reverse();
      let d = `M${f2(L[0][0])} ${f2(L[0][1])}` + seg(L);
      d += ` Q${f2(tip.x + Math.sin(tip.a) * rTip * 1.4)} ${f2(tip.y - Math.cos(tip.a) * rTip * 1.4)} ${f2(Rr[0][0])} ${f2(Rr[0][1])}`;
      d += seg(Rr) + ' Z';
      s.stem.setAttribute('d', d);
      let h = '';
      for (let i = 0; i <= n; i++) {
        const w = lerp(sp.w0, sp.w1, i / n) * 0.2;
        const p = pts[i];
        h += (i ? ' L' : 'M') + f2(p.x - Math.cos(p.a) * w) + ' ' + f2(p.y - Math.sin(p.a) * w);
      }
      s.hl.setAttribute('d', h);
      if (!s._sw) { s._sw = 1; s.hl.style.strokeWidth = Math.max(0.6, sp.w0 * 0.14); }
      if (s.cap) {
        s.cap.setAttribute('cx', f2(tip.x)); s.cap.setAttribute('cy', f2(tip.y));
        const op = s.grow > 0.9 ? 1 : 0;
        if (s._cap !== op) { s._cap = op; s.cap.style.opacity = op; }
      }
    }

    function draw(t, dt) {
      if (dt > 0) breeze += ((calm.state === 'active' ? 1 : 0) - breeze) * Math.min(1, dt * 1.5);
      const b = o.static || reduce.matches ? 0 : breeze;
      const w = b ? wind(t, base.x) * b : 0;
      for (const s of shoots) {
        if (!s.started && s.parent && s.parent.grow * (s.parent.spec.internodes.length + 1.5) > s.at + 2) s.started = true;
        if (s.started && s.grow < 1 && dt > 0) s.grow = Math.min(1, s.grow + dt / (growDur * (s.parent ? 0.8 : 1)));
        if (!s.started) s.grow = 0;
        s.sv += (-38 * s.sw - 5 * s.sv) * dt;
        s.sw += s.sv * dt;
        s.bend = (w * 0.07 + Math.sin(t * 1.3 + s.spec.id.length) * 0.012 * b) * s.spec.flex * (o.sway || 1) + s.sw;
      }
      for (const s of shoots) {
        if (!s.parent) layout(s, base, 0);
        else {
          const p = s.parent.pts[s.at + 1] || s.parent.pts[s.parent.pts.length - 1];
          layout(s, p, p.a);
        }
        stemPath(s);
        const vis = s.grow > 0.001;
        if (s._vis !== vis) {
          s._vis = vis;
          s.stem.style.display = vis ? '' : 'none';
          s.hl.style.display = vis ? '' : 'none';
        }
      }
      for (const s of shoots) {
        for (const lf of s.leaves) {
          const e = nodeE(s, lf.node);
          const p = s.pts[lf.node + 1];
          if (!p || e <= 0.02) { if (lf._vis !== false) { lf._vis = false; lf.el.style.display = 'none'; } continue; }
          if (lf._vis !== true) { lf._vis = true; lf.el.style.display = ''; }
          const g = Math.pow(Math.max(0, (e - 0.25) / 0.75), 0.8);
          const flutter = Math.sin(t * 2.2 + lf.ph) * 2.2 * b * (1 + Math.abs(w)) + w * 7;
          if (dt > 0) {
            lf.v += (-60 * lf.a - 7 * lf.v) * dt;
            lf.a += lf.v * dt;
          }
          let ang, sx, sy;
          const size = lf.size * (o.leafScale || 1);
          if (lf.kind === 'side') {
            ang = p.a * 180 / Math.PI + lf.side * lf.spread * (0.55 + 0.45 * g);
            sx = size * (0.25 + 0.75 * g);
            sy = size * g;
          } else if (lf.kind === 'front') {
            ang = p.a * 180 / Math.PI + lf.side * (lf.spread * 0.42);
            sx = size * (0.25 + 0.75 * g) * 0.92;
            sy = size * g * 0.74;
          } else {
            ang = p.a * 180 / Math.PI + lf.side * (lf.spread * 0.5);
            sx = size * (0.25 + 0.75 * g) * 0.86;
            sy = size * g * 0.7;
          }
          ang += flutter + lf.a;
          lf.tip = { x: p.x + Math.sin(ang * Math.PI / 180) * 60 * sy, y: p.y - Math.cos(ang * Math.PI / 180) * 60 * sy };
          lf.el.setAttribute('transform', `translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(ang)}) scale(${f2(sx)} ${f2(sy)})`);
        }
      }
    }

    function pushFromPointer() {
      if (ptr.x < -9000) return;
      for (const s of shoots) {
        for (const lf of s.leaves) {
          if (!lf.tip) continue;
          const dx = lf.tip.x - ptr.x, dy = lf.tip.y - ptr.y;
          const d = Math.hypot(dx, dy);
          const R = 64;
          if (d < R) {
            const f = 1 - d / R;
            lf.v += (dx > 0 ? 1 : -1) * f * f * (40 + ptr.speed * 0.25);
          }
        }
        const tip = s.pts[s.pts.length - 1];
        if (tip) {
          const d = Math.hypot(tip.x - ptr.x, tip.y - ptr.y);
          if (d < 90) s.sv += (tip.x > ptr.x ? 1 : -1) * (1 - d / 90) * (0.6 + ptr.speed * 0.004);
        }
      }
    }

    function nearestLeaf(x, y) {
      let best = null, bd = 46;
      for (const s of shoots) for (const lf of s.leaves) {
        if (!lf.tip || lf.el.style.display === 'none') continue;
        const d = Math.hypot(lf.tip.x - x, lf.tip.y - y);
        if (d < bd) { bd = d; best = lf; }
      }
      return best;
    }

    // growth and touch get up to 60 fps; the slow sway in the breeze looks the same at 20
    const fast = gate(60, 30), slow = gate(20, 20);
    // nothing moves any more: no growth, no touch, the breeze has died down, every leaf at rest
    const settled = () => breeze < 0.01 && ptr.x < -9000 && shoots.every(sh => sh.grow >= 1 && Math.abs(sh.sv) < 0.01 && Math.abs(sh.sw) < 0.003 && sh.leaves.every(lf => Math.abs(lf.v) < 0.4 && Math.abs(lf.a) < 0.15));
    const L = loop(frame);
    function frame(ts) {
      if (!visible || document.hidden) { running = false; L.stop(); return; }
      L.next();
      const active = ptr.x > -9000 || ptr.speed > 2 || shoots.some(sh => sh.grow < 1 || Math.abs(sh.sv) > 0.02);
      if (!(active ? fast(ts) : slow(ts))) return;
      const t = ts / 1000;
      let dt = t - last;
      last = t;
      if (dt > 0.05) dt = 0.05;
      pushFromPointer();
      ptr.speed *= 0.85;
      draw(t, Math.max(0, dt));
      // the plant stands still: no frames until the reader comes back
      if (calm.state !== 'active' && settled()) { L.stop(); running = false; calm.onWake(wake); }
    }
    function wake() {
      if (reduce.matches || o.static) { draw(now(), 0); return; }
      if (L.on) return;
      running = true;
      last = performance.now() / 1000;
      L.start();
    }

    const toLocal = e => {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const p = root.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      return p.matrixTransform(m.inverse());
    };
    if (o.interactive) {
      root.addEventListener('pointermove', e => {
        const p = toLocal(e);
        if (!p) return;
        ptr.speed = Math.min(600, ptr.speed + Math.hypot(p.x - ptr.x, p.y - ptr.y) * (ptr.x < -9000 ? 0 : 1));
        ptr.x = p.x; ptr.y = p.y;
        if (ptr.down && o.onAroma && performance.now() - ptr.lastAroma > 160) {
          const lf = nearestLeaf(p.x, p.y);
          if (lf) { ptr.lastAroma = performance.now(); lf.v += 30; o.onAroma(e.clientX, e.clientY, lf); }
        }
        wake();
      });
      root.addEventListener('pointerleave', () => { ptr.x = ptr.y = -9999; ptr.down = false; });
      root.addEventListener('pointerdown', e => {
        const p = toLocal(e);
        if (!p) return;
        ptr.down = true;
        ptr.x = p.x; ptr.y = p.y;
        const lf = nearestLeaf(p.x, p.y);
        if (lf) {
          lf.v += 90 * (Math.random() < 0.5 ? -1 : 1);
          ptr.lastAroma = performance.now();
          if (o.onAroma) o.onAroma(e.clientX, e.clientY, lf);
        }
        wake();
      });
      window.addEventListener('pointerup', () => { ptr.down = false; });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries.some(en => en.isIntersecting);
        if (visible) wake();
      }).observe(root);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
    if (reduce.addEventListener) reduce.addEventListener('change', () => { shoots.forEach(s => { s.grow = 1; s.started = true; }); wake(); });

    setSpec(spec);
    return {
      setSpec,
      regrow: () => setSpec(shoots.length ? shoots[0].spec : spec, { regrow: true }),
      points: id => { const s = shoots.find(x => x.spec.id === id); return s ? s.pts : []; },
      shoots: () => shoots,
      poke: (amp = 1) => { shoots.forEach(s => { s.sv += (Math.random() - 0.5) * 2 * amp; }); wake(); },
      wake
    };
  }

