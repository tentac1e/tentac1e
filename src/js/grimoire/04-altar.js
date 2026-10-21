  /* ------------------------------------------------------------------ */
  /* the altar of every chapter: a circle of runes on the floor, pillars  */
  /* in the dark, seven candles on the points of the star — and in the    */
  /* middle the chapter's own scene (04-scene-*.js), at the head of every */
  /* chapter and in the hero of the home page                             */
  /* ------------------------------------------------------------------ */
  /* A scene is scene(view, S => ({ … })): S.R — the rasterizer, S.T — the textures, S.ang — where the camera stands
     (updated every frame). It gives draw(t) — its shapes at the time t, in seconds — and, if it needs them:
     tick(t) before anything is drawn (the state of the moment; the key light may be changed there), lights(t) — its
     point lights, fill — how strong the soft light from the camera's side is, fx(t, F) — sparks and halos over the picture (F.spark, F.halo, F.dot, F.streak), tap(t) — what
     a tap on the altar does; candles — its own candles; glow — the colour of the circle; glowAdd(t) — how bright it
     burns; look, rad, near — the camera (the point it looks at, how far it stands beside the text of a wide
     screen, how far in the middle of a narrow one);
     orbit [angle, swing] — a camera that swings in front of the scene instead of going round it; still — the
     moment shown when the reader asked for less motion */
  const SCENES = {};
  const scene = (view, make) => { SCENES[view] = make; };
  const smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  // a leaf of basil from its base B along F, its blade spread along S (across F when not given): four triangles of
  // the cut-out texture; o.w — how wide, o.curl — how much its tip bends down, o.flat — one colour instead of the
  // texture (a leaf far off in the fog, a kite of four flat triangles: cheaper)
  function leaf(R, B, F, len, tex, o = {}) {
    let S = o.side || cross(F, [0, 1, 0]);
    if (Math.hypot(S[0], S[1], S[2]) < 1e-3) S = [1, 0, 0];
    S = norm(S);
    const U = cross(S, F), w = o.w || 0.36, curl = o.curl == null ? 0.22 : o.curl;
    const Tp = add(add(B, mul(F, len)), mul(U, -len * curl)), M = add(add(B, mul(F, len * 0.5)), mul(U, len * 0.1));
    const Lf = add(add(B, mul(F, len * 0.42)), mul(S, -len * w)), Rt = add(add(B, mul(F, len * 0.42)), mul(S, len * w));
    const q = o.flat ? { col: o.flat, ds: true, layer: o.layer, add: o.add } : { tex, ds: true, cut: true, layer: o.layer, add: o.add };
    R.tri(B, Lf, M, { ...q, uv: [[0.5, 1], [0, 0.55], [0.5, 0.55]] });
    R.tri(Lf, Tp, M, { ...q, uv: [[0, 0.55], [0.5, 0], [0.5, 0.55]] });
    R.tri(B, M, Rt, { ...q, uv: [[0.5, 1], [0.5, 0.55], [1, 0.55]] });
    R.tri(M, Tp, Rt, { ...q, uv: [[0.5, 0.55], [0.5, 0], [1, 0.55]] });
  }
  // the bush: a stem and pairs of leaves, each pair a quarter turn from the one below. o: s — its size, tex — the
  // leaves (texAt(k) — of the k-th pair; flat — one colour), stem — its colour, lean [x, z] — where its top bends,
  // leaf — the leaves' length, w — their width, yaw — its turn, pairs — [height 0…1, length, pitch]. Gives the top
  // of the stem
  const PAIRS = [[0.18, 0.46, 0.15], [0.42, 0.4, 0.05], [0.65, 0.32, -0.1], [0.82, 0.24, -0.3], [0.95, 0.15, -0.6]];
  function bush(R, T, b, t, o = {}) {
    const s = o.s || 1, H = 0.85 * s, lean = o.lean || [0, 0];
    const sway = k => Math.sin(t * 1.3 + k) * 0.05;
    const top = [b[0] + Math.sin(t * 0.7) * 0.02 + lean[0] * H, b[1] + H, b[2] + lean[1] * H];
    // the stem bends towards its top: the lower part stands, the upper follows the lean
    const at = f => [b[0] + (top[0] - b[0]) * f * f, b[1] + H * f, b[2] + (top[2] - b[2]) * f * f];
    rod(R, b, at(0.5), 0.03 * s, { col: o.stem || [70, 128, 48] });
    rod(R, at(0.5), top, 0.022 * s, { col: o.stem || [80, 140, 52] });
    (o.pairs || PAIRS).forEach(([f, len, pitch], k) => {
      for (let j = 0; j < 2; j++) {
        const yaw = k * Math.PI / 2 + j * Math.PI + 0.3 + (o.yaw || 0) + sway(k + j), pt = pitch + sway(k * 2 + j) * 0.8;
        const F = norm([Math.cos(yaw) * Math.cos(pt), -Math.sin(pt) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pt)]);
        leaf(R, at(f), F, len * s * (o.leaf || 1), o.texAt ? o.texAt(k) : o.tex || T.leaf, { w: o.w, flat: o.flat });
      }
    });
    return top;
  }
  // a clay pot with its rim and earth (n sides): gives the height of the earth, where a bush stands
  function pot(R, T, x, z, y0, s = 1, earth = [46, 28, 22], n = 8) {
    prism(R, x, z, y0, y0 + 0.38 * s, 0.27 * s, 0.37 * s, n, { tex: T.pot });
    prism(R, x, z, y0 + 0.35 * s, y0 + 0.44 * s, 0.39 * s, 0.41 * s, n, { col: [120, 44, 32] }, earth);
    return y0 + 0.39 * s;
  }
  // the flat top of a ring (the rim of a well, a mortar): quads between the radii r0 and r1 at the height y
  function ringTop(R, cx, cz, y, r0, r1, n, o) {
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      const P = (a, r) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      quad(R, P(a0, r1), P(a1, r1), P(a1, r0), P(a0, r0), { ...o, ds: true }, i / n, (i + 1) / n, 0, 1);
    }
  }
  // a flat disc of earth or paste at the height y: a fan of the texture
  function disc(R, cx, cz, y, r, n, o) {
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      R.tri([cx, y, cz], [cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r], { ...o, ds: true, uv: [[0.5, 0.5], [0.5 + Math.cos(a0) / 2, 0.5 + Math.sin(a0) / 2], [0.5 + Math.cos(a1) / 2, 0.5 + Math.sin(a1) / 2]] });
    }
  }
  // the stone altar with its sigil: gives the height of its top
  function altarStone(R, T) {
    box(R, [0, 0.48, 0], [0.8, 0.48, 0.5], { tex: T.stone, texFront: T.altar });
    box(R, [0, 1.02, 0], [0.92, 0.06, 0.6], { tex: T.stone });
    return 1.08;
  }
  // a molecule of the aroma, small and glowing: its atoms at the centre c, turned by yaw; a — how much of it is seen
  function essence(R, mol, c, yaw, k = 1, a = null) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const MP = mol.P.map(p => { const q = [p[0] * ca + p[2] * sa, p[1], -p[0] * sa + p[2] * ca]; return [c[0] + q[0] * 0.15 * k, c[1] + q[1] * 0.135 * k + q[2] * 0.03 * k, c[2] + q[2] * 0.15 * k]; });
    mol.bonds.forEach(([i, j]) => rod(R, MP[i], MP[j], 0.012 * k, { col: [170, 120, 230], emis: true, add: a }, 3));
    mol.atoms.split('').forEach((el, i) => ball(R, MP[i], (el === 'O' ? 0.06 : 0.045) * k, { col: el === 'O' ? [240, 70, 60] : [214, 190, 255], emis: true, add: a }));
  }

  function altar(host, view) {
    const stage = doc.createElement('div');
    stage.className = 'psx-stage';
    stage.dataset.scene = SCENES[view] ? view : 'glavnaya';
    stage.setAttribute('aria-hidden', 'true');
    const cv = doc.createElement('canvas');
    stage.appendChild(cv);
    host.insertBefore(stage, host.firstChild);
    const T = textures();
    const R = new Raster(cv, { px: 3, maxW: 400, levels: 16, fogNear: 3.5, fogFar: 15, amb: [0.13, 0.1, 0.17] });
    const KEY = { dir: norm([-0.35, 0.85, -0.4]), i: 0.42, col: [0.55, 0.5, 0.85] };
    const S = { R, T, view, ang: 0.6 };
    const sc = { still: 0, look: [0, 1.45, 0], rad: 5.6, near: 5.6, fill: 0.6, glow: [255, 70, 50], ...(SCENES[view] || SCENES.glavnaya)(S) };
    const FLOOR = floorTex(sc.glow, false), GLOW = floorTex(sc.glow, true);
    const candles = [...Array(7)].map((_, i) => { const q = -Math.PI / 2 + i / 7 * Math.PI * 2; return { x: Math.cos(q) * 2.95, z: Math.sin(q) * 2.95, h: 0.38 + ((i * 37) % 10) / 22, ph: i * 1.7 }; }).concat(sc.candles || []);
    const embers = [...Array(46)].map((_, i) => ({ k: i % candles.length, a: (i * 0.37) % 1, s: 0.3 + (i * 13 % 10) / 22, dx: ((i * 29) % 11 - 5) / 60, dz: ((i * 17) % 11 - 5) / 60 }));
    const pillars = [...Array(8)].map((_, i) => { const q = 0.35 + i / 8 * Math.PI * 2; return { x: Math.cos(q) * 7.4, z: Math.sin(q) * 7.4, h: 1.6 + ((i * 53) % 10) / 4 }; });
    // the reader turns the altar with a finger or the mouse; a tap does what the scene does (a puff of sparks by default)
    const ptr = { turn: 0, lift: 0, drag: null, puffs: [] };
    const t0 = performance.now();
    const clock = () => (reduce.matches ? sc.still : (performance.now() - t0) / 1000);
    const onDown = e => { ptr.drag = { x: e.clientX, y: e.clientY, turn: ptr.turn, lift: ptr.lift, moved: false }; };
    const onMove = e => {
      if (!ptr.drag) return;
      const dx = e.clientX - ptr.drag.x, dy = e.clientY - ptr.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) ptr.drag.moved = true;
      ptr.turn = ptr.drag.turn + dx * 0.006;
      ptr.lift = clamp(ptr.drag.lift - dy * 0.004, -0.6, 0.9);
      L.start();
    };
    const onUp = () => {
      if (ptr.drag && !ptr.drag.moved) {
        if (sc.tap) sc.tap(clock());
        else { ptr.puffs.push({ t: clock() }); if (ptr.puffs.length > 4) ptr.puffs.shift(); }
        L.start();
      }
      ptr.drag = null;
    };
    stage.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    function frame(now) {
      // the clock of the scene: stands at its chosen moment when the reader asked for less motion
      const t = reduce.matches ? sc.still : (now - t0) / 1000;
      R.size();
      // wide: the chapter's text on the left, the scene to the right of it; else the scene in the middle, closer
      const wide = R.W > R.H * 1.45;
      const ang = (sc.orbit ? sc.orbit[0] + Math.sin(t * 0.13) * sc.orbit[1] : 0.6 + t * 0.11) + ptr.turn;
      const look = sc.look, eyeY = look[1] + 1.1 + Math.sin(t * 0.3) * 0.15 + ptr.lift;
      const rad = wide ? sc.rad : sc.near;
      S.ang = ang;
      R.cam([look[0] + Math.cos(ang) * rad, eyeY, look[2] + Math.sin(ang) * rad], look, wide ? 1.25 : 1.05, wide ? 0.68 : 0.5, wide ? 0.44 : 0.4);
      R.key = KEY;
      if (sc.tick) sc.tick(t);
      R.lights = candles.map(c => ({ p: [c.x, (c.top || 0) + c.h + 0.14, c.z], col: [1, 0.6, 0.28], i: 0.5 + 0.12 * Math.sin(t * 11 + c.ph) + 0.08 * Math.sin(t * 23 + c.ph * 2), fall: 0.55 }))
        .concat(sc.fill ? [{ p: [look[0] + Math.cos(ang) * 2.2, look[1] + 1.5, look[2] + Math.sin(ang) * 2.2], col: [0.78, 0.62, 0.95], i: sc.fill, fall: 0.16 }] : [], sc.lights ? sc.lights(t) : []);
      const x = R.x, g = x.createLinearGradient(0, 0, 0, R.H);
      g.addColorStop(0, '#07050B'); g.addColorStop(0.55, '#1C1122'); g.addColorStop(1, '#120B17');
      x.fillStyle = g; x.fillRect(0, 0, R.W, R.H);
      // the floor and its circle: a layer of their own, under everything
      const FL = 4.4, N = 2, glowA = sc.glowAdd ? sc.glowAdd(t) : 0.32 + 0.22 * Math.sin(t * 1.4);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x0 = -FL + i * FL * 2 / N, x1 = x0 + FL * 2 / N, z0 = -FL + j * FL * 2 / N, z1 = z0 + FL * 2 / N;
        quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: FLOOR, layer: 0, ds: true }, i / N, (i + 1) / N, j / N, (j + 1) / N);
        quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: GLOW, layer: 0, add: glowA, ds: true }, i / N, (i + 1) / N, j / N, (j + 1) / N);
      }
      for (let k = 0; k < 4; k++) {
        const q = k * Math.PI / 2, far = 16, s = [Math.cos(q), Math.sin(q)], tn = [-s[1], s[0]];
        const p = (a, b) => [s[0] * a + tn[0] * b, 0, s[1] * a + tn[1] * b];
        quad(R, p(FL, -FL), p(far, -far), p(far, far), p(FL, FL), { col: [30, 22, 36], layer: 0, ds: true });
      }
      pillars.forEach(p => box(R, [p.x, p.h / 2, p.z], [0.32, p.h / 2, 0.32], { tex: T.stone }));
      sc.draw(t);
      candles.forEach((c, i) => {
        const y0 = c.top || 0;
        prism(R, c.x, c.z, y0, y0 + c.h, 0.085, 0.075, 6, { tex: T.wax }, [236, 226, 200], i);
        const fl = 1 + 0.18 * Math.sin(t * 13 + c.ph) + 0.1 * Math.sin(t * 29 + c.ph);
        billboard(R, [c.x, y0 + c.h + 0.1 * fl, c.z], 0.05, 0.1 * fl, { tex: T.flame, emis: true, nofog: true, cut: true });
      });
      R.draw();
      // the halos of the flames, added before the colour is cut down: the dither turns them into rings
      x.globalCompositeOperation = 'lighter';
      const halo = (p3, r3, c0, c1) => {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), r = R.C.focal * r3 / v[2], gg = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
        gg.addColorStop(0, c0); gg.addColorStop(1, c1);
        x.fillStyle = gg; x.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
      };
      candles.forEach(c => halo([c.x, (c.top || 0) + c.h + 0.1, c.z], 0.42, 'rgba(255,150,60,.34)', 'rgba(255,120,40,0)'));
      // a spark of fire (life 0…1 fades it), a dot of any colour, a streak (a drop falling)
      const spark = (p3, life, big) => {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), s = big || v[2] < 4 ? 2 : 1;
        x.fillStyle = `rgba(255,${150 + (life * 60) | 0},70,${(1 - life) * 0.9})`;
        x.fillRect(p[0], p[1], s, s);
      };
      const dot = (p3, col, size = 0) => {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), s = size || (v[2] < 4 ? 2 : 1);
        x.fillStyle = col;
        x.fillRect(p[0], p[1], s, s);
      };
      const streak = (p3, len, col) => {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), l = Math.max(2, Math.round(R.C.focal * len / v[2]));
        x.fillStyle = col;
        x.fillRect(p[0], p[1], 1, l);
      };
      if (sc.fx) sc.fx(t, { halo, spark, dot, streak });
      embers.forEach(e => {
        const c = candles[e.k], life = (e.a + t * e.s * 0.25) % 1;
        spark([c.x + e.dx * life * 8, (c.top || 0) + c.h + 0.15 + life * 1.6, c.z + e.dz * life * 8], life);
      });
      ptr.puffs = ptr.puffs.filter(p => t - p.t < 2.2 && t >= p.t);
      ptr.puffs.forEach(p => {
        const life = (t - p.t) / 2.2;
        for (let i = 0; i < 18; i++) {
          const q = i / 18 * Math.PI * 2, r = 0.2 + life * 0.9;
          spark([Math.cos(q) * r * 0.6, 2.1 + life * 1.3 + Math.sin(i * 7) * 0.1, Math.sin(q) * r * 0.6], life, true);
        }
      });
      x.globalCompositeOperation = 'source-over';
      R.post(16);
      stage.classList.add('is-drawn');
    }
    // runs while on the screen, by the page's frame budget; one still frame with reduced motion
    let seen = false;
    const L = psxLoop(ts => { if (!seen || doc.hidden) { L.stop(); return; } frame(ts); if (reduce.matches && !ptr.drag) L.stop(); });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { seen = es.some(e => e.isIntersecting); if (seen) L.start(); else L.stop(); }) : null;
    if (io) io.observe(stage); else { seen = true; L.start(); }
    const vis = () => { if (!doc.hidden && seen) L.start(); };
    doc.addEventListener('visibilitychange', vis);
    return {
      destroy() {
        L.stop();
        if (io) io.disconnect();
        doc.removeEventListener('visibilitychange', vis);
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerup', onUp);
        removeEventListener('pointercancel', onUp);
        stage.remove();
      }
    };
  }

  // Главная: basil in a clay pot on the stone altar, two candles beside it, the molecule of linalool turning above
  scene('glavnaya', S => {
    const { R, T } = S, mol = molShape('lin');
    let my = 2.85;
    return {
      fill: 0.25,
      candles: [{ x: -0.74, z: 0.4, h: 0.26, ph: 4.2, top: 1.09 }, { x: 0.74, z: -0.4, h: 0.2, ph: 2.2, top: 1.09 }],
      draw(t) {
        const top = altarStone(R, T), earth = pot(R, T, 0, 0, top);
        bush(R, T, [0, earth, 0], t);
        my = 2.85 + Math.sin(t * 0.9) * 0.06;
        if (mol) essence(R, mol, [0, my, 0], 0.8 + t * 0.5);
      },
      fx(t, F) { F.halo([0, my, 0], 0.5, 'rgba(155,107,214,.26)', 'rgba(155,107,214,0)'); }
    };
  });
