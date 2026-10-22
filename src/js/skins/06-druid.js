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
    // the lines of the circle drawn smooth — strokes of the canvas, not pixels: close to the camera they stay lines, not
    // steps — on a canvas of its own (to glow, 512 pixels, nothing round them) or over the moss
    const glowLines = (w, col = 'rgb(120,255,196)', cv = null) => {
      if (!cv) { cv = doc.createElement('canvas'); cv.width = cv.height = w; }
      const x = cv.getContext('2d'), c = w / 2, sc = w / 128;
      x.strokeStyle = col; x.lineCap = 'round'; x.lineWidth = 1.2 * sc;
      [4, 15, 9.5].forEach(d => { x.beginPath(); x.arc(c, c, c - d * sc, 0, Math.PI * 2); x.stroke(); });
      const RR = rng(9);
      x.beginPath();
      for (let i = 0; i < 40; i++) {
        const q = i / 40 * Math.PI * 2, n = 1 + (RR() * 5 | 0), kind = RR() * 3 | 0;
        for (let s = 0; s < n; s++) {
          const qq = q + (s - n / 2) * 0.022, r0 = (kind === 0 ? c - 9.5 * sc : c - 12 * sc), r1 = (kind === 1 ? c - 7 * sc : c - 9.5 * sc);
          x.moveTo(c + Math.cos(qq) * r0, c + Math.sin(qq) * r0); x.lineTo(c + Math.cos(qq) * r1, c + Math.sin(qq) * r1);
        }
      }
      x.stroke();
      for (let j = 0; j < 3; j++) {
        x.beginPath();
        for (let s = 0; s <= 80; s++) { const f = s / 80, q = j / 3 * Math.PI * 2 + f * Math.PI * 2.2, r = (3 + f * 19) * sc; if (s) x.lineTo(c + Math.cos(q) * r, c + Math.sin(q) * r); else x.moveTo(c + Math.cos(q) * r, c + Math.sin(q) * r); }
        x.stroke();
      }
      return cv;
    };
    // soft blotches of the moss: noise in cells of a few pixels, smoothed, the same at every visit
    const blotch = (w, cell, seed) => {
      const n = Math.ceil(w / cell) + 2, R2 = rng(seed), G = [...Array(n * n)].map(() => R2());
      return (x, y) => {
        const gx = x / cell, gy = y / cell, ix = gx | 0, iy = gy | 0, fx = gx - ix, fy = gy - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const v = (i, j) => G[(iy + j) % n * n + (ix + i) % n];
        return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy;
      };
    };
    GROVE = {
      ...textures(),
      // the moss of the circle, 256 pixels across its 6.6 units: large soft blotches and small light tips, the lines of
      // the circle pressed into it, its edge going over into the green of the ground round it
      moss: glowLines(256, 'rgba(70,92,62,.85)', tex(256, 256, t => {
        const big = blotch(256, 22, 5), small = blotch(256, 6, 6);
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
          const r = Math.hypot(x - 127.5, y - 127.5) / 127.5;
          if (r > 1) continue;
          const b = big(x, y) * 0.65 + small(x, y) * 0.35, tip = R0() < 0.05;
          const col = tip ? [78, 104, 50] : [30 + b * 22, 46 + b * 30, 27 + b * 14];
          const e = clamp((r - 0.86) / 0.14, 0, 1);
          t.put(x, y, [col[0] + (26 - col[0]) * e, col[1] + (41 - col[1]) * e, col[2] + (29 - col[2]) * e]);
        }
      })),
      glowMoss: glowLines(512),
      // the leaves drawn smooth at twice the console's size: the edge of the blade stays clean close up
      leaf: leafTex([[38, 82, 30], [168, 224, 118], [128, 196, 86], [84, 150, 56]], false, noise, 64),
      leafOpal: leafTex([[34, 12, 36], [176, 96, 176], [134, 64, 136], [98, 38, 96]], false, noise, 64),
      leafLemon: leafTex([[78, 108, 30], [228, 244, 156], [196, 226, 116], [156, 196, 84]], false, noise, 64),
      leafThai: leafTex([[26, 64, 26], [176, 96, 186], [104, 170, 78], [62, 124, 48]], false, noise, 64),
      leafSick: leafTex([[112, 92, 30], [214, 204, 120], [200, 188, 96], [176, 164, 64]], true, noise, 64),
      // the cut of an old stump: pale wood, its rings, the dark edge of the bark; nothing outside the circle
      stumpTop: tex(32, 32, t => {
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          const r = Math.hypot(x - 15.5, y - 15.5) / 15.5;
          if (r > 1) continue;
          const ring = [0.3, 0.6, 0.84].some(k => Math.abs(r - k) < 0.045);
          t.put(x, y, r > 0.93 ? [72, 52, 36] : ring ? [112, 82, 56] : [noise(150, 6), noise(116, 6), noise(80, 5)]);
        }
      }),
      // bark: ridges up and down between wandering dark grooves, soft blotches over them — drawn large enough to stay
      // bark close up, not a grid of pixels
      bark: tex(64, 128, t => {
        const big = blotch(128, 16, 31), fine = blotch(128, 5, 32);
        for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) {
          const wob = Math.sin(y * 0.11 + x * 0.25) * 1.6 + big(x * 2, y) * 7, f = ((x + wob) % 16 + 16) % 16;
          const groove = f < 2.6 ? 1 - f / 2.6 : 0, b = fine(x * 2, y) * 0.55 + big(x * 2, y) * 0.45, k = 1 - groove * 0.62;
          t.put(x, y, [(58 + b * 36) * k, (41 + b * 25) * k, (29 + b * 17) * k]);
        }
      }),
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

  // the floor of the circle — the moss and the glowing lines on it — laid straight on the canvas, a few rows of the
  // screen at a time. The camera never leans, so along a row of the screen the ground lies at one depth: each strip
  // takes its texture by a single affine map — true in perspective, crisp, never bent at the seams of triangles. The
  // moss is lit once for the whole floor (the moon falls the same on all of it), the low lights of the scene lie on it as
  // pools of their colour, the fog goes by the depth of each strip; the glow only in the ring and in the middle
  const FL = 3.3;
  function mossFloor(R, T, x, glowA) {
    const C = R.C, fc = C.focal, W = R.W, H = R.H, F = R.fog, k = T.moss.width / (2 * FL);
    const key = R.key, kd = key ? Math.max(0, key.dir[1]) * key.i : 0;
    // the moss lit once, its fog baked in too (twelve steps of it, cached): one pass over the floor, not two
    const lit = [0, 1, 2].map(i => R.amb[i] + (key ? kd * key.col[i] : 0));
    const pat = c => c.psxPat || (c.psxPat = x.createPattern(c, 'repeat'));
    const step = Math.max(2, Math.round(H / 120));
    // the ground under the screen's row y: the point Q under its middle (x = cx), S — how far one pixel along it goes,
    // s — its depth
    const row = y => {
      const b = -(y - C.cy) / fc, dy = C.u[1] * b + C.f[1];
      if (dy > -1e-3) return null;
      const s = -C.eye[1] / dy;
      return { s, Q: [C.eye[0] + s * (C.u[0] * b + C.f[0]), C.eye[2] + s * (C.u[2] * b + C.f[2])], S: [s * C.r[0] / fc, s * C.r[2] / fc] };
    };
    // where along the row the ground is within the radius r: [x0, x1] on the screen, or null
    const chord = (g, r) => {
      const A2 = g.S[0] ** 2 + g.S[1] ** 2, B2 = 2 * (g.Q[0] * g.S[0] + g.Q[1] * g.S[1]), D = B2 * B2 - 4 * A2 * (g.Q[0] ** 2 + g.Q[1] ** 2 - r * r);
      if (D <= 0) return null;
      const q = Math.sqrt(D);
      return [C.cx + (-B2 - q) / (2 * A2), C.cx + (-B2 + q) / (2 * A2)];
    };
    let st = step;
    const span = (y, a0, a1) => { const p0 = Math.max(0, Math.floor(a0)), p1 = Math.min(W, Math.ceil(a1)); if (p1 > p0) x.fillRect(p0, y, p1 - p0, st); };
    x.save();
    // the strips are finer where the ground goes far and lies thin on the screen: the lines there stay whole, not dashes
    for (let y = 0; y < H; y += st) {
      const g0 = row(y + 0.5);
      st = !g0 ? step : g0.s > 6.5 ? 1 : g0.s > 5 ? Math.min(2, step) : step;
      const ym = y + st / 2, g = row(ym), g1 = row(ym + 1);
      if (!g || !g1) continue;
      const c = chord(g, FL);
      if (!c) continue;
      // the strip's map from the texture to the screen, taken at the middle of its chord
      const xm = (Math.max(0, c[0]) + Math.min(W, c[1])) / 2, a = xm - C.cx;
      const P = [g.Q[0] + a * g.S[0], g.Q[1] + a * g.S[1]], P1 = [g1.Q[0] + a * g1.S[0], g1.Q[1] + a * g1.S[1]];
      const j11 = g.S[0] * k, j21 = g.S[1] * k, j12 = (P1[0] - P[0]) * k, j22 = (P1[1] - P[1]) * k, det = j11 * j22 - j12 * j21;
      if (!det) continue;
      const Tu = (P[0] + FL) * k, Tv = (P[1] + FL) * k, i11 = j22 / det, i12 = -j12 / det, i21 = -j21 / det, i22 = j11 / det;
      const M = new DOMMatrix([i11, i21, i12, i22, xm - i11 * Tu - i12 * Tv, ym - i21 * Tu - i22 * Tv]);
      const f = clamp((g.s - R.fogNear) / (R.fogFar - R.fogNear), 0, 1) ** 1.15;
      const pm = pat(shaded(T.moss, lit, f, F, 24));
      pm.setTransform(M);
      x.fillStyle = pm;
      span(y, c[0], c[1]);
      if (glowA > 0) {
        const pg = pat(T.glowMoss), o = chord(g, FL * 0.96), i = chord(g, FL * 0.72), m = chord(g, FL * 0.37);
        pg.setTransform(M.scale(T.moss.width / T.glowMoss.width));
        x.globalCompositeOperation = 'lighter';
        x.globalAlpha = clamp(glowA * 1.4 * (1 - f * 0.6), 0, 1);
        x.fillStyle = pg;
        if (o) { if (i) { span(y, o[0], i[0]); span(y, i[1], o[1]); } else span(y, o[0], o[1]); }
        if (m) span(y, m[0], m[1]);
        x.globalCompositeOperation = 'source-over';
        x.globalAlpha = 1;
      }
    }
    // the lines of the circle glow: the same strips of them, as coarse as the glow's own pixels, into the glow
    if (R.B && glowA > 0) {
      const bx = R.B.x, bstep = Math.max(step, Math.round(1 / R.B.k)), pg = T.glowMoss.psxBPat || (T.glowMoss.psxBPat = bx.createPattern(T.glowMoss, 'repeat'));
      const bspan = (y, a0, a1) => { const p0 = Math.max(0, Math.floor(a0)), p1 = Math.min(W, Math.ceil(a1)); if (p1 > p0) bx.fillRect(p0, y, p1 - p0, bstep); };
      for (let y = 0; y < H; y += bstep) {
        const ym = y + bstep / 2, g = row(ym), g1 = row(ym + 1);
        if (!g || !g1) continue;
        const o = chord(g, FL * 0.96);
        if (!o) continue;
        const xm = (Math.max(0, o[0]) + Math.min(W, o[1])) / 2, a = xm - C.cx;
        const P = [g.Q[0] + a * g.S[0], g.Q[1] + a * g.S[1]], P1 = [g1.Q[0] + a * g1.S[0], g1.Q[1] + a * g1.S[1]];
        const j11 = g.S[0] * k, j21 = g.S[1] * k, j12 = (P1[0] - P[0]) * k, j22 = (P1[1] - P[1]) * k, det = j11 * j22 - j12 * j21;
        if (!det) continue;
        const Tu = (P[0] + FL) * k, Tv = (P[1] + FL) * k, i11 = j22 / det, i12 = -j12 / det, i21 = -j21 / det, i22 = j11 / det;
        pg.setTransform(new DOMMatrix([i11, i21, i12, i22, xm - i11 * Tu - i12 * Tv, ym - i21 * Tu - i22 * Tv]).scale(T.moss.width / T.glowMoss.width));
        const f = clamp((g.s - R.fogNear) / (R.fogFar - R.fogNear), 0, 1) ** 1.15, i = chord(g, FL * 0.72), m = chord(g, FL * 0.37);
        // far off the lines of the circle are thinner than a pixel of the glow and would break into dashes: they fade
        bx.globalAlpha = clamp(glowA * 1.6 * (1 - f * 0.6), 0, 1) * clamp((11 - g.s) / 5, 0, 1);
        bx.fillStyle = pg;
        if (i) { bspan(y, o[0], i[0]); bspan(y, i[1], o[1]); } else bspan(y, o[0], o[1]);
        if (m) bspan(y, m[0], m[1]);
      }
      bx.globalAlpha = 1;
    }
    // the pools of the low lights: a soft ellipse of each one's colour round the point under it, as wide as its light
    // reaches over the moss
    x.globalCompositeOperation = 'lighter';
    const fwd = norm([C.f[0], 0, C.f[2]]);
    R.lights.forEach(L => {
      const h = Math.max(0.15, L.p[1]), i0 = L.i / (1 + h * h * L.fall);
      if (L.p[1] > 2.8 || i0 < 0.05) return;
      let r = 0.3;
      while (r < 2.6 && L.i * (h / Math.hypot(r, h)) / (1 + (r * r + h * h) * L.fall) > i0 * 0.2) r += 0.1;
      const g = [L.p[0], 0, L.p[2]], vg = R.view(g), vf = R.view(add(g, mul(fwd, r))), vb = R.view(add(g, mul(fwd, -r)));
      if (vg[2] < 0.5 || vf[2] < 0.3 || vb[2] < 0.3) return;
      const c0 = R.proj(vg), rx = Math.abs(R.proj(R.view(add(g, mul(C.r, r))))[0] - c0[0]), ry = Math.abs(R.proj(vb)[1] - R.proj(vf)[1]) / 2;
      const col = L.col.map(v => Math.min(255, v * 150) | 0), al = Math.min(0.5, i0 * 0.35);
      x.save();
      x.translate(c0[0], c0[1]);
      x.scale(Math.max(1, rx), Math.max(1, ry));
      const gr = x.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, `rgba(${col},${al})`); gr.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = gr;
      x.fillRect(-1, -1, 2, 2);
      x.restore();
    });
    x.restore();
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
    for (let k = 0; k < 3; k++) { const q = k * 2.1 + 0.3; egg(R, [x + Math.cos(q) * r, h - 0.02, z + Math.sin(q) * r], [r * 0.26, r * 0.1, r * 0.22], q, { col: [64, 104, 46] }); }
    [0, 2.1, 4.2].forEach(q => rod(R, [x + Math.cos(q) * r, 0.06, z + Math.sin(q) * r], [x + Math.cos(q) * (r + 0.35), -0.02, z + Math.sin(q) * (r + 0.35)], 0.05, { col: [70, 50, 34] }, 3));
    return h;
  }
  // a boulder with moss on its back
  function boulder(R, x, z, r, seed) {
    const y = groundY(x, z);
    egg(R, [x, y + r * 0.35, z], [r, r * 0.62, r * 0.85], seed, { col: [84, 88, 92] });
    egg(R, [x, y + r * 0.62, z], [r * 0.78, r * 0.3, r * 0.64], seed + 0.4, { col: [58, 92, 44] });
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
    for (let k = 0; k < 7; k++) { const q = k * 0.9; ball(R, [x + Math.cos(q) * 0.42 * s, 0.03, z + Math.sin(q) * 0.42 * s], 0.06 * s, { col: [92, 96, 98] }); }
    for (let k = 0; k < 3; k++) {
      const fl = 1 + 0.25 * Math.sin(t * 12 + k * 2) + 0.12 * Math.sin(t * 27 + k);
      billboard(R, [x + Math.cos(k * 2.1) * 0.06 * s, (0.2 + 0.14 * fl) * s, z + Math.sin(k * 2.1) * 0.06 * s], 0.11 * s, 0.24 * s * fl, { tex: T.flame, emis: true, nofog: true, cut: true });
    }
  }
  // the phase of the moon today (0 the new moon, ½ the full one), from a new moon of 2000 and the length of the moon's
  // month; and the lit part of a moon at the phase p as a path (the right side lit while it waxes, as seen from the north)
  const PHASE_TODAY = (((Date.now() / 864e5 - Date.UTC(2000, 0, 6, 18, 14) / 864e5) / 29.530588853) % 1 + 1) % 1;
  function moonLit(x, cx, cy, r, p) {
    const k = Math.cos(p * Math.PI * 2), rx = Math.max(0.01, Math.abs(k) * r);
    x.beginPath();
    if (p < 0.5) { x.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false); x.ellipse(cx, cy, rx, r, 0, Math.PI / 2, -Math.PI / 2, k > 0); }
    else { x.arc(cx, cy, r, Math.PI / 2, Math.PI * 1.5, false); x.ellipse(cx, cy, rx, r, 0, Math.PI * 1.5, Math.PI / 2, k > 0); }
    x.closePath();
  }
  // a shaft of moonlight: a soft band from the sky down to the ground, added over the picture
  // soft light, so it goes into the glow where the picture has one: a big band filled at a sixth of the pixels
  function shaft(R, top, foot, w, a) {
    const vt = R.view(top), vf = R.view(foot);
    if (vt[2] < 0.3 || vf[2] < 0.3) return;
    const p = R.proj(vt), q = R.proj(vf), wt = R.C.focal * w * 1.6 / vt[2], wf = R.C.focal * w / vf[2], x = R.B ? R.B.x : R.x;
    if (R.B) a = Math.min(1, a * 1.15);
    const g = x.createLinearGradient(p[0], p[1], q[0], q[1]);
    g.addColorStop(0, `rgba(190,230,255,${a * 0.2})`); g.addColorStop(0.6, `rgba(190,230,255,${a})`); g.addColorStop(1, 'rgba(190,230,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(p[0] - wt, p[1]); x.lineTo(p[0] + wt, p[1]); x.lineTo(q[0] + wf, q[1]); x.lineTo(q[0] - wf, q[1]); x.closePath(); x.fill();
  }

  // the light of the bright parts spread round them, and the edges sinking into the dark: the look of a game of today,
  // on a 2D canvas. On a stage the glow is a small canvas of its own over the scene (glowLayer), drawn up and added by
  // the browser: what shines is drawn into it as the picture is drawn (Raster.glowTo — the moon, the runes, the fire,
  // the lines of the circle), so the picture is never read back from the graphics card for it, and the dark edges are
  // the stage's CSS. The molecule viewer, a picture now and then, still takes its glow from the picture itself (a
  // picture at a sixth, its dark pressed down by multiplying it with itself, laid back over it)
  const BLOOM = new WeakMap();
  function glowLayer(holder, R) {
    const c1 = doc.createElement('canvas');
    c1.className = 'psx-glow';
    holder.appendChild(c1);
    R.glowTo(c1, 1 / 6);
    BLOOM.set(R, { page: true });
  }
  function glowPost(R) {
    let b = BLOOM.get(R);
    if (b && b.page) return;
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
    // the screen's own pixels, up to two to a CSS pixel and 420 000 in all (a phone gets them all; the wide head of a
    // chapter on a computer about one to one)
    raster: () => ({ smooth: true, scale: Math.min(2, window.devicePixelRatio || 1), maxPx: 420000, fog: [13, 25, 20], fogNear: 4.5, fogFar: 17, amb: [0.17, 0.21, 0.2] }),
    textures: () => groveTextures(),
    key: { dir: norm([-0.45, 0.85, 0.3]), i: 0.62, col: [0.62, 0.76, 0.95] },
    fillCol: [0.72, 0.86, 0.8],
    sky: ['#040A08', '#0D1C17', '#0A140F'],
    defaults: { glow: [143, 232, 198], fill: 0.5 },
    make(S, sc) {
      const { R, T } = S, RR = rng(404);
      const clear = sc.clear || 1.3;
      // where the camera stands (it swings about this angle, so far from the middle): stones, boulders and trees keep to
      // the far side and the flanks, the grass to the inside of the circle — nothing big and dark in front of the lens
      const CA = sc.orbit[0], CR = Math.min(sc.rad, sc.near);
      const off = q => Math.abs(((q - CA) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      // the ground: rings of triangles from the moss out to the trees, each a little different in its green
      const RINGS = [3.2, 4.4, 5.8, 7.4, 9.4, 12], SEG = 16;
      const P = RINGS.map(r => [...Array(SEG)].map((_, i) => { const q = i / SEG * Math.PI * 2 + r * 0.17; const x = Math.cos(q) * r, z = Math.sin(q) * r; return [x, groundY(x, z), z]; }));
      const TRIS = [];
      for (let k = 0; k < RINGS.length - 1; k++) for (let i = 0; i < SEG; i++) {
        const a = P[k][i], b = P[k][(i + 1) % SEG], c = P[k + 1][(i + 1) % SEG], d = P[k + 1][i];
        // one shade for the two triangles of a patch, and little between patches: far off, their edges would read as
        // a dotted grid
        const v = RR() * 5 - 2.5, col = [24 + v + k * 1.5, 40 + v + k * 1.2, 28 + v];
        TRIS.push([a, b, c, col], [a, c, d, col]);
      }
      // the grass: tufts of three blades, none in the middle where the scene stands
      const TUFTS = [];
      const GR = Math.max(clear + 0.6, Math.min(5.2, CR - 1.4));
      while (TUFTS.length < 90) {
        const r = clear + RR() * (GR - clear), q = RR() * Math.PI * 2, x = Math.cos(q) * r, z = Math.sin(q) * r;
        if ((sc.noGrass && sc.noGrass(x, z)) || (off(q) < 1.1 && r > 1.8)) continue;
        TUFTS.push({ x, z, y: groundY(x, z), h: 0.1 + RR() * 0.14, ph: RR() * 6, col: [50 + RR() * 30, 84 + RR() * 40, 38 + RR() * 18], yaw: RR() * 3 });
      }
      const STONES = sc.stones === false ? [] : [...Array(6)].map((_, i) => { const q = CA + Math.PI + (i / 5 - 0.5) * 2.7; return { x: Math.cos(q) * 3.05, z: Math.sin(q) * 3.05, q, h: 1.1 + ((i * 37) % 10) / 14 }; });
      // the moon: far off in one direction of the world, so it goes across the sky as the camera turns, like everything
      // else, and does not hang glued to the screen: a little right of the scene as the camera sees it in the middle of
      // its swing, and low over the horizon (the camera looks a little down: only the lowest few degrees of the sky are
      // in the frame). It shows today's phase (a scene of its own phases shows the one of its moment: moonPhase; a scene
      // with a sun and a moon of its own goes without it: moon: false)
      const MOON = sc.moon === false ? null : Math.atan2(-Math.sin(CA), -Math.cos(CA)) + 0.16;
      // the trees on its side stand apart and leave it a clearing to shine through all the swing long: none where the
      // eye, wherever the swing takes it, would see one of them in front of the moon
      const clearing = (() => {
        if (MOON == null) return () => 0;
        const hx = Math.cos(MOON), hz = Math.sin(MOON), nx = -hz, nz = hx;
        let lo = Infinity, hi = -Infinity;
        [sc.rad, sc.near].forEach(rad => { for (let i = 0; i <= 24; i++) { const a = CA + (i / 12 - 1) * sc.orbit[1], o = Math.cos(a) * rad * nx + Math.sin(a) * rad * nz; lo = Math.min(lo, o); hi = Math.max(hi, o); } });
        // which way a tree at (x, z) has to go out of the way, or 0 when it stands clear of it
        return (x, z) => { const o = x * nx + z * nz; return x * hx + z * hz > 0 && o > lo - 1.5 && o < hi + 1.5 ? (o > (lo + hi) / 2 ? 1 : -1) : 0; };
      })();
      const TREES = [...Array(14)].map((_, i) => {
        let q = CA + Math.PI + (i / 13 - 0.5) * 4.3 + ((i * 13) % 7) / 30;
        const r = 6.2 + ((i * 29) % 10) / 3.2, side = clearing(Math.cos(q) * r, Math.sin(q) * r);
        if (side) while (clearing(Math.cos(q) * r, Math.sin(q) * r)) q += side * 0.04;
        return { x: Math.cos(q) * r, z: Math.sin(q) * r, birch: i % 4 === 1, h: 4.4 + (i % 5) * 0.55 };
      });
      const ROCKS = [[0.5, 2.6, 0.32], [-0.6, 2.8, 0.26], [1.25, 2.4, 0.22], [-1.3, 2.5, 0.3]].map(([d, r, s]) => { const q = CA + Math.PI + d; return [Math.cos(q) * r, Math.sin(q) * r, s]; }).filter(([x, z]) => !(sc.noGrass && sc.noGrass(x, z)));
      const FLIES = [...Array(26)].map((_, i) => ({ a: i * 2.4, r: 1.2 + (i % 7) * 0.5, h: 0.3 + (i % 5) * 0.4, s: 0.18 + (i % 4) * 0.06 }));
      const MIST = [...Array(4)].map((_, i) => ({ q: i / 4 * Math.PI * 2 + 0.5, r: 2.4 + (i % 3) * 1.3 }));
      let rune = 0.5;
      // how high the moon stands for this size of the stage: its lower edge just over the horizon, its upper one in the
      // frame while the camera bobs up and down
      const sky = { key: '', dir: null };
      const moonDir = wide => {
        const C = R.C, rad = wide ? sc.rad : sc.near, mr = Math.max(4, R.H * 0.045) / C.focal;
        const top = Math.atan(C.cy / C.focal) - Math.atan(1.1 / rad), el = Math.max(mr * 0.8, Math.min(top - mr * 1.6, mr + 0.004));
        return [Math.cos(MOON) * Math.cos(el), Math.sin(el), Math.sin(MOON) * Math.cos(el)];
      };
      return {
        // the moon in its place in the sky, its phase, its light round it and its glow
        back(t, x) {
          R.glowStart();
          if (MOON == null) return;
          const C = R.C, wide = R.W > R.H * 1.45, key = `${wide}:${R.W}x${R.H}`;
          if (sky.key !== key) { sky.key = key; sky.dir = moonDir(wide); }
          const d = sky.dir, vz = dot(d, C.f);
          if (vz < 0.1) return;
          const mx = C.cx + dot(d, C.r) * C.focal / vz, my = C.cy - dot(d, C.u) * C.focal / vz, mr = Math.max(4, R.H * 0.045);
          if (mx < -mr * 7 || mx > R.W + mr * 7 || my < -mr * 7 || my > R.H) return;
          const p = sc.moonPhase ? sc.moonPhase(t) : PHASE_TODAY, lit = (1 - Math.cos(p * Math.PI * 2)) / 2;
          const g = x.createRadialGradient(mx, my, 0, mx, my, mr * 7);
          g.addColorStop(0, `rgba(200,225,240,${0.06 + 0.28 * lit})`); g.addColorStop(1, 'rgba(200,225,240,0)');
          x.fillStyle = g; x.fillRect(mx - mr * 7, my - mr * 7, mr * 14, mr * 14);
          // the dark of it faintly seen, the lit part with its seas
          x.fillStyle = 'rgba(44,58,62,.6)'; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
          x.save();
          moonLit(x, mx, my, mr, p); x.clip();
          x.fillStyle = '#E6EEE8'; x.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
          x.fillStyle = 'rgba(150,170,170,.35)'; x.beginPath(); x.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.28, 0, Math.PI * 2); x.arc(mx + mr * 0.35, my + mr * 0.3, mr * 0.18, 0, Math.PI * 2); x.fill();
          x.restore();
          // its lit part glows (raised to the cube, as all of it); the ground in front darkens the glow again where it
          // hides the moon (Raster.draw)
          if (R.B) { const bx = R.B.x; bx.fillStyle = '#8E9A93'; moonLit(bx, mx, my, mr * 0.9, p); bx.fill(); }
        },
        lights(t) {
          rune = (sc.rune ? sc.rune(t) : 0.5 + 0.15 * Math.sin(t * 1.1));
          return [{ p: [0, 0.35, 0], col: [0.45, 1, 0.82], i: 0.35 * rune, fall: 0.06 }];
        },
        floor(t, x) { mossFloor(R, T, x, sc.glowAdd ? sc.glowAdd(t) : 0.16 + 0.2 * rune); },
        draw(t) {
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
          MIST.forEach((m, i) => { const q = m.q + t * 0.02; F.soft([Math.cos(q) * m.r, 0.25, Math.sin(q) * m.r], 1.6, 'rgba(160,200,190,.055)', 'rgba(160,200,190,0)'); });
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
