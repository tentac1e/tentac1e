  /* ------------------------------------------------------------------ */
  /* «Друид»: a night grove of a northern game round every scene — moss  */
  /* with a ring of ogham, hills of the forest floor, grass in the wind,  */
  /* standing stones with runes of a cold light, firs and birches in the  */
  /* fog, shafts of moonlight, fireflies; drawn smooth at the screen's    */
  /* resolution, the bright parts glowing                                 */
  /* ------------------------------------------------------------------ */
  // the textures of the grove: moss with its ring of ogham and a triskele (and the same lines alone, to glow), bark of
  // oak and of birch, a standing stone with moss on its foot, runes of a cold light; the basil's own leaves beside them
  let GROVE = null;
  function groveTextures() {
    if (GROVE) return GROVE;
    const R0 = rng(77), noise = (v, a) => clamp(v + (R0() - 0.5) * 2 * a, 0, 255);
    const lines = (t, col) => {
      const { put, line, w } = t, c = w / 2;
      const ring = r => { for (let a = 0; a < 720; a++) { const q = a / 720 * Math.PI * 2; put(c + Math.cos(q) * r, c + Math.sin(q) * r, col); } };
      ring(c - 4); ring(c - 15); ring(c - 9.5);
      // ogham between the rings: groups of one to five strokes across the stem line
      const RR = rng(9);
      for (let i = 0; i < 40; i++) {
        const q = i / 40 * Math.PI * 2, n = 1 + (RR() * 5 | 0), kind = RR() * 3 | 0;
        for (let s = 0; s < n; s++) {
          const qq = q + (s - n / 2) * 0.022, r0 = kind === 0 ? c - 9.5 : c - 12, r1 = kind === 1 ? c - 7 : c - 9.5;
          line(c + Math.cos(qq) * r0, c + Math.sin(qq) * r0, c + Math.cos(qq) * r1, c + Math.sin(qq) * r1, col);
        }
      }
      // the triskele in the middle: three spirals out of one point
      for (let k = 0; k < 3; k++) for (let s = 0; s < 140; s++) {
        const f = s / 140, q = k / 3 * Math.PI * 2 + f * Math.PI * 2.2, r = 3 + f * 19;
        put(c + Math.cos(q) * r, c + Math.sin(q) * r, col);
      }
    };
    GROVE = {
      ...textures(),
      moss: tex(128, 128, t => {
        for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const r = R0(); t.put(x, y, r < 0.08 ? [74, 100, 44] : r < 0.14 ? [22, 32, 20] : [noise(38, 6), noise(56, 8), noise(32, 5)]); }
        lines(t, [92, 118, 76]);
      }),
      glowMoss: tex(128, 128, t => lines(t, [120, 255, 196])),
      // the cut of an old stump: pale wood, its rings, the dark edge of the bark; nothing outside the circle
      stumpTop: tex(32, 32, t => {
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          const r = Math.hypot(x - 15.5, y - 15.5) / 15.5;
          if (r > 1) continue;
          const ring = [0.3, 0.6, 0.84].some(k => Math.abs(r - k) < 0.045);
          t.put(x, y, r > 0.93 ? [72, 52, 36] : ring ? [112, 82, 56] : [noise(150, 6), noise(116, 6), noise(80, 5)]);
        }
      }),
      bark: tex(16, 32, t => { for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) { const s = (x * 7 + (y >> 2) * 3) % 5 === 0; t.put(x, y, s ? [34, 24, 18] : [noise(80, 10), noise(58, 8), noise(42, 6)]); } }),
      birch: tex(16, 32, t => { for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) { const d = (y * 5 + (x >> 2) * 11) % 9 === 0 && x % 8 < 5; t.put(x, y, d ? [30, 28, 26] : [noise(222, 8), noise(218, 8), noise(204, 8)]); } }),
      menhir: tex(32, 32, t => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const m = y > 23 || (R0() < 0.14 && y > 15); t.put(x, y, m ? [noise(54, 8), noise(82, 10), noise(42, 6)] : [noise(96, 10), noise(98, 10), noise(102, 10)]); } }),
      gRunes: [...Array(8)].map((_, i) => tex(16, 16, t => {
        const R4 = rng(91 + i * 5), g = [150, 255, 214], P = [[2, 2], [13, 2], [2, 13], [13, 13], [7, 2], [7, 13], [2, 7], [13, 7]];
        t.line(7, 1, 7, 14, g); t.line(8, 1, 8, 14, g);
        for (let k = 0; k < 2; k++) { const a = P[R4() * P.length | 0], y0 = 4 + k * 5; t.line(7, y0, a[0], a[1], g); t.line(8, y0, a[0] + 1, a[1], g); }
      })),
      // the runes of the three elements: ᚾ (naudiz) for N, ᛈ (perthro) for P, ᚲ (kaunan) for K, two pixels thick
      npk: [
        [[6, 1, 6, 14], [3, 5, 10, 10]],
        [[4, 1, 4, 14], [4, 1, 8, 5], [8, 5, 12, 1], [4, 14, 8, 10], [8, 10, 12, 14]],
        [[11, 2, 5, 7], [5, 7, 11, 12]]
      ].map((strokes, i) => tex(16, 16, t => strokes.forEach(([x0, y0, x1, y1]) => { const c = [[170, 214, 255], [255, 168, 120], [255, 226, 140]][i]; t.line(x0, y0, x1, y1, c); t.line(x0 + 1, y0, x1 + 1, y1, c); }))),
      // the moon in its eight phases, from the new one round to the waning crescent: the lit part pale with its seas,
      // the dark one in the faint light of the earth
      phases: [...Array(8)].map((_, i) => tex(32, 32, t => {
        const k = Math.cos(i / 8 * Math.PI * 2), wax = i <= 4;
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          const u = (x - 15.5) / 14, v = (y - 15.5) / 14;
          if (u * u + v * v > 1) continue;
          const w = Math.sqrt(1 - v * v), lit = wax ? u > k * w : u < -k * w, sea = Math.hypot(u + 0.25, v + 0.2) < 0.3 || Math.hypot(u - 0.3, v - 0.25) < 0.2;
          t.put(x, y, lit ? (sea ? [176, 190, 186] : [noise(230, 6), noise(236, 6), noise(226, 6)]) : [38, 52, 54]);
        }
      }))
    };
    return GROVE;
  }

  // a ring of the floor between the radii r0 and r1 (a disc when r0 is nought), its texture laid flat on it as on the
  // square of the floor, FL to either side of the middle
  const FL = 3.3;
  function flatRing(R, r0, r1, n, o) {
    const P = (a, r) => [Math.cos(a) * r, 0.001, Math.sin(a) * r], U = p => [0.5 + p[0] / (2 * FL), 0.5 + p[2] / (2 * FL)];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, A = P(a0, r1), B = P(a1, r1);
      if (!r0) { R.tri([0, 0.001, 0], A, B, { ...o, uv: [[0.5, 0.5], U(A), U(B)] }); continue; }
      const C = P(a1, r0), D = P(a0, r0);
      R.tri(A, B, C, { ...o, uv: [U(A), U(B), U(C)] });
      R.tri(A, C, D, { ...o, uv: [U(A), U(C), U(D)] });
    }
  }
  // the ground beyond the moss: hills of the forest floor rising away from the circle, the same at every visit
  const groundY = (x, z) => {
    const r = Math.hypot(x, z), q = Math.atan2(z, x);
    if (r < 3.3) return 0;
    const k = r - 3.3;
    return Math.pow(k, 1.25) * 0.13 + Math.sin(q * 3 + 1.2) * 0.16 * Math.min(1, k / 3) + Math.sin(q * 7 + r) * 0.05 * Math.min(1, k / 2);
  };
  // a fir: three tiers of cones on a trunk, dark blue-green in the fog
  function fir(R, x, z, h, s = 1) {
    const y = groundY(x, z);
    prism(R, x, z, y, y + h * 0.3, 0.12 * s, 0.09 * s, 4, { col: [58, 42, 30] });
    [[0.18, 0.62, 0.95], [0.42, 0.86, 0.75], [0.64, 1.06, 0.52]].forEach(([y0, y1, r], k) => prism(R, x, z, y + h * y0, y + h * y1, r * s, 0.02, 6, { col: [24 + k * 4, 46 + k * 6, 40 + k * 3] }, null, x + k));
  }
  // a birch: a white trunk with its black marks, a crown of small leaves gone pale in the moonlight
  function birchTree(R, T, x, z, h) {
    const y = groundY(x, z);
    prism(R, x, z, y, y + h, 0.13, 0.08, 6, { tex: T.birch });
    [[0, 0.82, 0, 0.7], [0.35, 0.7, 0.2, 0.5]].forEach(([dx, f, dz, r]) => egg(R, [x + dx, y + h * f, z + dz], [r, r * 0.8, r], x, { col: [66, 92, 46] }));
  }
  // a standing stone with its rune on the side towards the middle; k — how bright the rune burns
  function menhir(R, T, x, z, h, q, i, k) {
    const y = groundY(x, z);
    prism(R, x, z, y - 0.05, y + h, 0.3, 0.17, 5, { tex: T.menhir }, [88, 92, 96], q + 0.3);
    const d = [-Math.cos(q), 0, -Math.sin(q)], tg = [-Math.sin(q), 0, Math.cos(q)], c = add([x, y + h * 0.55, z], mul(d, 0.2)), a = 0.11;
    quad(R, add(sub(c, mul(tg, a)), [0, -a, 0]), add(add(c, mul(tg, a)), [0, -a, 0]), add(add(c, mul(tg, a)), [0, a, 0]), add(sub(c, mul(tg, a)), [0, a, 0]), { tex: T.gRunes[i % 8], emis: true, nofog: true, cut: true, ds: true, add: clamp(0.55 + k * 0.45, 0, 1) });
  }
  // an old stump with its rings and its moss: gives the height of its top
  function stump(R, T, x, z, r, h) {
    prism(R, x, z, -0.02, h, r * 1.18, r, 7, { tex: T.bark });
    quad(R, [x - r, h, z + r], [x + r, h, z + r], [x + r, h, z - r], [x - r, h, z - r], { tex: T.stumpTop, cut: true, ds: true });
    for (let k = 0; k < 3; k++) { const q = k * 2.1 + 0.3; egg(R, [x + Math.cos(q) * r, h - 0.02, z + Math.sin(q) * r], [r * 0.26, r * 0.1, r * 0.22], q, { col: [64, 104, 46], lo: true }); }
    [0, 2.1, 4.2].forEach(q => rod(R, [x + Math.cos(q) * r, 0.06, z + Math.sin(q) * r], [x + Math.cos(q) * (r + 0.35), -0.02, z + Math.sin(q) * (r + 0.35)], 0.05, { col: [70, 50, 34] }, 3));
    return h;
  }
  // a boulder with moss on its back
  function boulder(R, x, z, r, seed) {
    const y = groundY(x, z);
    egg(R, [x, y + r * 0.35, z], [r, r * 0.62, r * 0.85], seed, { col: [84, 88, 92] });
    egg(R, [x, y + r * 0.62, z], [r * 0.78, r * 0.3, r * 0.64], seed + 0.4, { col: [58, 92, 44], lo: true });
  }
  // a wreath of twigs bound in a ring, leaves, white berries of mistletoe; hung on four threads
  function wreath(R, T, c, r, yaw) {
    for (let k = 0; k < 12; k++) {
      const a0 = yaw + k / 12 * Math.PI * 2, a1 = yaw + (k + 1.3) / 12 * Math.PI * 2;
      rod(R, [c[0] + Math.cos(a0) * r, c[1], c[2] + Math.sin(a0) * r], [c[0] + Math.cos(a1) * r, c[1] + 0.02, c[2] + Math.sin(a1) * r], 0.02, { col: [110, 78, 48] }, 3);
      if (k % 2 === 0) leaf(R, [c[0] + Math.cos(a0) * r, c[1], c[2] + Math.sin(a0) * r], norm([Math.cos(a0 + 0.6), -0.4, Math.sin(a0 + 0.6)]), 0.16, T.leafLemon, { w: 0.34 });
      if (k % 3 === 0) ball(R, [c[0] + Math.cos(a0 + 0.2) * (r + 0.02), c[1] - 0.05, c[2] + Math.sin(a0 + 0.2) * (r + 0.02)], 0.032, { col: [240, 236, 220], lo: true });
    }
    for (let k = 0; k < 4; k++) { const a = yaw + k / 4 * Math.PI * 2; rod(R, [c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r], [c[0], c[1] + 1.6, c[2]], 0.004, { col: [180, 170, 150] }, 3); }
  }
  // a fire of logs with its flames: lights it gives are the scene's to add
  function campfire(R, T, x, z, s, t) {
    for (let k = 0; k < 5; k++) { const q = k / 5 * Math.PI * 2 + 0.3; rod(R, [x + Math.cos(q) * 0.32 * s, 0.03, z + Math.sin(q) * 0.32 * s], [x + Math.cos(q) * 0.04, 0.22 * s, z + Math.sin(q) * 0.04], 0.045 * s, { col: [74, 52, 34] }, 3); }
    for (let k = 0; k < 7; k++) { const q = k * 0.9; ball(R, [x + Math.cos(q) * 0.42 * s, 0.03, z + Math.sin(q) * 0.42 * s], 0.06 * s, { col: [92, 96, 98], lo: true }); }
    for (let k = 0; k < 3; k++) {
      const fl = 1 + 0.25 * Math.sin(t * 12 + k * 2) + 0.12 * Math.sin(t * 27 + k);
      billboard(R, [x + Math.cos(k * 2.1) * 0.06 * s, (0.2 + 0.14 * fl) * s, z + Math.sin(k * 2.1) * 0.06 * s], 0.11 * s, 0.24 * s * fl, { tex: T.flame, emis: true, nofog: true, cut: true });
    }
  }
  // a shaft of moonlight: a soft band from the sky down to the ground, added over the picture
  function shaft(R, top, foot, w, a) {
    const vt = R.view(top), vf = R.view(foot);
    if (vt[2] < 0.3 || vf[2] < 0.3) return;
    const p = R.proj(vt), q = R.proj(vf), wt = R.C.focal * w * 1.6 / vt[2], wf = R.C.focal * w / vf[2], x = R.x;
    const g = x.createLinearGradient(p[0], p[1], q[0], q[1]);
    g.addColorStop(0, `rgba(190,230,255,${a * 0.2})`); g.addColorStop(0.6, `rgba(190,230,255,${a})`); g.addColorStop(1, 'rgba(190,230,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(p[0] - wt, p[1]); x.lineTo(p[0] + wt, p[1]); x.lineTo(q[0] + wf, q[1]); x.lineTo(q[0] - wf, q[1]); x.closePath(); x.fill();
  }

  // the light of the bright parts spread round them (a picture at a sixth, its dark pressed down by multiplying it with
  // itself, laid back over the picture), and the edges sinking into the dark: the look of a game of today, on a 2D canvas.
  // On a stage the small picture is a canvas of its own over the scene (glowLayer), drawn up and added by the browser,
  // and the dark edges are the stage's CSS: two passes over the whole picture fewer every frame
  const BLOOM = new WeakMap();
  function glowLayer(holder, R) {
    const c1 = doc.createElement('canvas');
    c1.className = 'psx-glow';
    holder.appendChild(c1);
    const c2 = doc.createElement('canvas');
    BLOOM.set(R, { c1, c2, x1: c1.getContext('2d'), x2: c2.getContext('2d'), page: true });
  }
  function glowPost(R) {
    let b = BLOOM.get(R);
    if (!b) {
      const c1 = doc.createElement('canvas'), c2 = doc.createElement('canvas');
      b = { c1, c2, x1: c1.getContext('2d'), x2: c2.getContext('2d') };
      BLOOM.set(R, b);
    }
    const w = Math.max(16, Math.round(R.W / 6)), h = Math.max(12, Math.round(R.H / 6));
    [b.c1, b.c2].forEach(c => { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } });
    const { x1, x2 } = b, x = R.x;
    x1.imageSmoothingEnabled = x2.imageSmoothingEnabled = true;
    x1.globalCompositeOperation = 'copy'; x1.drawImage(R.c, 0, 0, w, h);
    x2.globalCompositeOperation = 'copy'; x2.drawImage(b.c1, 0, 0);
    x1.globalCompositeOperation = 'multiply'; x1.drawImage(b.c2, 0, 0); x1.drawImage(b.c2, 0, 0);
    if (b.page) return;
    x.save();
    x.imageSmoothingEnabled = true;
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.7;
    x.drawImage(b.c1, 0, 0, R.W, R.H);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    const v = x.createRadialGradient(R.W / 2, R.H * 0.45, Math.min(R.W, R.H) * 0.32, R.W / 2, R.H * 0.45, Math.max(R.W, R.H) * 0.78);
    v.addColorStop(0, 'rgba(2,6,4,0)'); v.addColorStop(1, 'rgba(2,6,4,.6)');
    x.fillStyle = v; x.fillRect(0, 0, R.W, R.H);
    x.restore();
  }

  world('druid', {
    raster: () => ({ smooth: true, scale: Math.min(1.5, window.devicePixelRatio || 1) * 0.72, maxPx: 170000, fog: [13, 25, 20], fogNear: 4.5, fogFar: 17, amb: [0.17, 0.21, 0.2] }),
    textures: () => groveTextures(),
    key: { dir: norm([-0.45, 0.85, 0.3]), i: 0.62, col: [0.62, 0.76, 0.95] },
    fillCol: [0.72, 0.86, 0.8],
    sky: ['#040A08', '#0D1C17', '#0A140F'],
    defaults: { glow: [143, 232, 198], fill: 0.5 },
    make(S, sc) {
      const { R, T } = S, RR = rng(404);
      const clear = sc.clear || 1.3;
      // the ground: rings of triangles from the moss out to the trees, each a little different in its green
      const RINGS = [3.2, 4.4, 5.8, 7.4, 9.4, 12], SEG = 16;
      const P = RINGS.map(r => [...Array(SEG)].map((_, i) => { const q = i / SEG * Math.PI * 2 + r * 0.17; const x = Math.cos(q) * r, z = Math.sin(q) * r; return [x, groundY(x, z), z]; }));
      const TRIS = [];
      for (let k = 0; k < RINGS.length - 1; k++) for (let i = 0; i < SEG; i++) {
        const a = P[k][i], b = P[k][(i + 1) % SEG], c = P[k + 1][(i + 1) % SEG], d = P[k + 1][i];
        const v = RR() * 10 - 5, col = [24 + v + k * 1.5, 40 + v + k * 1.2, 28 + v];
        TRIS.push([a, b, c, col], [a, c, d, [col[0] + 3, col[1] + 4, col[2] + 2]]);
      }
      // the grass: tufts of three blades, none in the middle where the scene stands
      const TUFTS = [];
      while (TUFTS.length < 90) {
        const r = clear + RR() * (5.2 - clear), q = RR() * Math.PI * 2, x = Math.cos(q) * r, z = Math.sin(q) * r;
        if (sc.noGrass && sc.noGrass(x, z)) continue;
        TUFTS.push({ x, z, y: groundY(x, z), h: 0.14 + RR() * 0.2, ph: RR() * 6, col: [50 + RR() * 30, 84 + RR() * 40, 38 + RR() * 18], yaw: RR() * 3 });
      }
      const STONES = sc.stones === false ? [] : [...Array(7)].map((_, i) => { const q = -Math.PI / 2 + i / 7 * Math.PI * 2 + 0.22; return { x: Math.cos(q) * 3.05, z: Math.sin(q) * 3.05, q, h: 1.1 + ((i * 37) % 10) / 14 }; });
      const TREES = [...Array(14)].map((_, i) => { const q = 0.2 + i / 14 * Math.PI * 2 + ((i * 13) % 7) / 18, r = 6.2 + ((i * 29) % 10) / 3.2; return { x: Math.cos(q) * r, z: Math.sin(q) * r, birch: i % 4 === 1, h: 4.4 + (i % 5) * 0.55 }; });
      const ROCKS = [[2.2, 1.9, 0.32], [-2.4, 1.4, 0.26], [1.4, -2.5, 0.22], [-1.7, -2.3, 0.3]].filter(([x, z]) => !(sc.noGrass && sc.noGrass(x, z)));
      const FLIES = [...Array(26)].map((_, i) => ({ a: i * 2.4, r: 1.2 + (i % 7) * 0.5, h: 0.3 + (i % 5) * 0.4, s: 0.18 + (i % 4) * 0.06 }));
      const MIST = [...Array(4)].map((_, i) => ({ q: i / 4 * Math.PI * 2 + 0.5, r: 2.4 + (i % 3) * 1.3 }));
      let rune = 0.5;
      return {
        // the moon over the trees, where it always is on the screen, and its light round it
        back(t, x) {
          const mx = R.W * 0.8, my = R.H * 0.17, mr = Math.max(4, R.H * 0.045);
          const g = x.createRadialGradient(mx, my, 0, mx, my, mr * 7);
          g.addColorStop(0, 'rgba(200,225,240,.34)'); g.addColorStop(1, 'rgba(200,225,240,0)');
          x.fillStyle = g; x.fillRect(mx - mr * 7, my - mr * 7, mr * 14, mr * 14);
          x.fillStyle = '#E6EEE8'; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
          x.fillStyle = 'rgba(150,170,170,.35)'; x.beginPath(); x.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.28, 0, Math.PI * 2); x.arc(mx + mr * 0.35, my + mr * 0.3, mr * 0.18, 0, Math.PI * 2); x.fill();
        },
        lights(t) {
          rune = (sc.rune ? sc.rune(t) : 0.5 + 0.15 * Math.sin(t * 1.1));
          return [{ p: [0, 0.35, 0], col: [0.45, 1, 0.82], i: 0.35 * rune, fall: 0.06 }];
        },
        draw(t) {
          // the moss and its circle; the glow of its lines laid only where they are — the ring of ogham and the triskele
          const glowA = sc.glowAdd ? sc.glowAdd(t) : 0.16 + 0.2 * rune, G = { tex: T.glowMoss, layer: 0, add: glowA, ds: true, emis: true };
          disc(R, 0, 0, 0, FL, 16, { tex: T.moss, layer: 0 });
          flatRing(R, FL * 0.74, FL * 0.95, 24, G);
          flatRing(R, 0, FL * 0.36, 8, G);
          TRIS.forEach(([a, b, c, col]) => R.tri(a, b, c, { col, layer: 0, ds: true }));
          // the grass bends with the wind, more in a gust
          const gust = sc.gust ? sc.gust(t) : 0;
          TUFTS.forEach(g => {
            const w = Math.sin(t * 1.7 + g.x * 0.9 + g.z * 0.7) * 0.07 + gust * 0.18;
            for (let k = 0; k < 3; k++) {
              const q = g.yaw + k * 2.1, bx = g.x + Math.cos(q) * 0.04, bz = g.z + Math.sin(q) * 0.04, sx = -Math.sin(q) * 0.028, sz = Math.cos(q) * 0.028, h = g.h * (0.75 + k * 0.15);
              R.tri([bx - sx, g.y, bz - sz], [bx + sx, g.y, bz + sz], [bx + Math.cos(q) * 0.05 + w * h * 2, g.y + h, bz + Math.sin(q) * 0.05 + w * h], { col: [g.col[0] + k * 6, g.col[1] + k * 8, g.col[2]], ds: true });
            }
          });
          STONES.forEach((s, i) => menhir(R, T, s.x, s.z, s.h, s.q, i, rune - 0.5));
          TREES.forEach(tr => (tr.birch ? birchTree(R, T, tr.x, tr.z, tr.h) : fir(R, tr.x, tr.z, tr.h, 1.15)));
          ROCKS.forEach(([x, z, r], i) => boulder(R, x, z, r, i * 1.7));
        },
        fx(t, F) {
          // the mist lying low, the shafts of moonlight, the fireflies, the glow of the runes
          MIST.forEach((m, i) => { const q = m.q + t * 0.02; F.halo([Math.cos(q) * m.r, 0.25, Math.sin(q) * m.r], 1.6, 'rgba(160,200,190,.05)', 'rgba(160,200,190,0)'); });
          if (sc.shafts !== false) [[-1.4, 0.6, 0.5], [0.9, -1.2, 0.4], [2.2, 1.1, 0.35]].forEach(([x, z, w], i) => shaft(R, [x + 2.4, 6.2, z - 1.6], [x, 0, z], w, 0.07 + 0.025 * Math.sin(t * 0.6 + i * 2)));
          FLIES.forEach((f, i) => {
            const q = f.a + t * f.s, blink = Math.max(0, Math.sin(t * 2.1 + i * 1.7));
            const p = [Math.cos(q) * f.r, f.h + Math.sin(t * 0.8 + i) * 0.25, Math.sin(q * 1.3) * f.r];
            if (blink > 0.15) { F.dot(p, `rgba(214,255,140,${blink})`, 1.2); if (i % 3 === 0) F.halo(p, 0.2, `rgba(200,255,140,${0.28 * blink})`, 'rgba(200,255,140,0)'); }
          });
          STONES.forEach(s => F.halo([s.x * 0.94, groundY(s.x, s.z) + s.h * 0.55, s.z * 0.94], 0.32, `rgba(143,232,198,${0.16 * rune})`, 'rgba(143,232,198,0)'));
        }
      };
    },
    post: R => glowPost(R),
    overlay: glowLayer
  });

  /* The molecule viewer in «Друид»: the same molecule, turned the same way — carbon white berries of mistletoe,
     oxygen red berries of rowan, the bonds twigs with a leaf on every other one; drawn smooth, a little under the
     screen's resolution, and glowing */
  const GROVEMOL = new WeakMap();
  MOLDRAW.druid = function molGrove(ctx, mol, P, R3, W, H) {
    let b = GROVEMOL.get(ctx.canvas);
    if (!b) {
      const cv = doc.createElement('canvas');
      b = { cv, R: new Raster(cv, { smooth: true, fog: [10, 18, 14], fogNear: 9, fogFar: 17, amb: [0.22, 0.26, 0.22] }) };
      b.R.key = { dir: norm([-0.5, 0.7, -0.6]), i: 0.95, col: [1, 0.96, 0.86] };
      b.R.lights = [{ p: [3, 3, -5], col: [0.55, 1, 0.75], i: 0.55, fall: 0.02 }];
      GROVEMOL.set(ctx.canvas, b);
    }
    const q = Math.min(2, window.devicePixelRatio || 1) * 0.8, T = groveTextures();
    const R = b.R.sizeTo(Math.round(W * q), Math.round(H * q)), w = R.W, h = R.H;
    R.cam([0, 0, -13], [0, 0, 0], 1.45 * Math.min(1, w / h));
    const x = R.x, g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, '#1C2B20'); g.addColorStop(1, '#070C09');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const [r0, r1, r2] = R3;
    const Q0 = P.map(([px, py, pz]) => [-(r0[0] * px + r0[1] * py + r0[2] * pz), -(r1[0] * px + r1[1] * py + r1[2] * pz), -(r2[0] * px + r2[1] * py + r2[2] * pz)]);
    const ext = Math.max(...Q0.map(p => Math.hypot(p[0], p[1], p[2]))) || 1, k = 3.6 / ext, Q = Q0.map(p => mul(p, k)), s = k / 1.2;
    // a whole berry or twig at a time, from the far side to the near one
    const items = mol.bonds.map(([a, c, o], n) => ({ z: (Q[a][2] + Q[c][2]) / 2, draw: o2 => {
      rod(R, Q[a], Q[c], (o === 2 ? 0.15 : 0.1) * s, { ...o2, col: [112, 78, 48] }, 5);
      if (n % 2 === 0) { const m = mul(add(Q[a], Q[c]), 0.5), d = norm(sub(Q[c], Q[a])), up = norm(cross(d, [0, 0, 1])); leaf(R, m, norm(add(up, mul(d, 0.3))), 0.72 * s, T.leaf, { ...o2, w: 0.4 }); }
    } })).concat(mol.atoms.split('').map((el, i) => ({ z: Q[i][2] - 0.3, draw: o2 => ball(R, Q[i], (el === 'O' ? 0.44 : 0.36) * s, { ...o2, col: el === 'O' ? [214, 54, 42] : [236, 232, 210] }) })));
    items.sort((u, v) => v.z - u.z).forEach((it, i) => it.draw({ layer: 2 + i }));
    R.draw();
    glowPost(R);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(b.cv, 0, 0, ctx.canvas.width, ctx.canvas.height);
  };
