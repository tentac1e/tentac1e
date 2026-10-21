  /* ------------------------------------------------------------------ */
  /* textures, drawn pixel by pixel: the circle on the floor, stone, the  */
  /* altar's sigil, the pot, wax, a leaf of basil, a flame                */
  /* ------------------------------------------------------------------ */
  function tex(w, h, fn) {
    const c = doc.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d'), img = x.createImageData(w, h);
    const put = (px, py, col, a = 255) => {
      px |= 0; py |= 0;
      if (px < 0 || py < 0 || px >= w || py >= h) return;
      const k = (py * w + px) * 4;
      img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = a;
    };
    // Bresenham: the lines of a texture are pixels, never smoothed
    const line = (x0, y0, x1, y1, col) => {
      x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) {
        put(x0, y0, col);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
    };
    fn({ put, line, w, h });
    x.putImageData(img, 0, 0);
    return c;
  }
  // the circle of the floor: two rings, a seven-pointed star, runes between the rings, the leaf of basil in the middle
  function ritual(t, glow) {
    const { put, line, w } = t, c = w / 2;
    const red = glow ? [255, 70, 50] : [150, 28, 36], gold = glow ? [255, 170, 80] : [140, 104, 48];
    const ring = (r, col) => { for (let a = 0; a < 720; a++) { const q = a / 720 * Math.PI * 2; put(c + Math.cos(q) * r, c + Math.sin(q) * r, col); } };
    ring(c - 3, red); ring(c - 6, red); ring(c * 0.34, red);
    const P = [...Array(7)].map((_, i) => { const q = -Math.PI / 2 + i / 7 * Math.PI * 2; return [c + Math.cos(q) * (c - 18), c + Math.sin(q) * (c - 18)]; });
    for (let i = 0; i < 7; i++) { const a = P[i], b = P[(i + 3) % 7]; line(a[0], a[1], b[0], b[1], red); }
    const RR = rng(5);
    const STROKES = [[[0, 0], [0, 6]], [[0, 0], [3, 2]], [[3, 2], [0, 4]], [[0, 3], [3, 6]], [[3, 0], [3, 6]], [[0, 6], [3, 4]], [[0, 2], [3, 2]]];
    const rune = (q, r, s, col) => {
      const pick = STROKES.filter(() => RR() < 0.45).slice(0, 3);
      if (!pick.length) pick.push(STROKES[0]);
      const T = (gx, gy) => { const rad = r + (3 - gy) * s, tan = (gx - 1.5) * s; return [c + Math.cos(q) * rad - Math.sin(q) * tan, c + Math.sin(q) * rad + Math.cos(q) * tan]; };
      pick.forEach(([p0, p1]) => { const a = T(...p0), b = T(...p1); line(a[0], a[1], b[0], b[1], col); });
    };
    for (let i = 0; i < 28; i++) rune(i / 28 * Math.PI * 2, c - 12, 0.9, gold);
    for (let y = -14; y <= 14; y++) { const hw = Math.round(7 * Math.sin((y + 14) / 28 * Math.PI)); put(c - hw, c + y, gold); put(c + hw, c + y, gold); }
    line(c, c - 14, c, c + 18, gold);
  }
  let TX = null;
  function textures() {
    if (TX) return TX;
    const R0 = rng(11);
    const noise = (v, a) => clamp(v + (R0() - 0.5) * 2 * a, 0, 255);
    TX = {
      floor: tex(128, 128, t => {
        for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
          const v = x % 32 === 0 || y % 32 === 0 ? 12 : 26;
          t.put(x, y, [noise(v, 5), noise(v * 0.78, 4), noise(v * 1.25, 6)]);
        }
        ritual(t, false);
      }),
      glow: tex(128, 128, t => ritual(t, true)),
      stone: tex(32, 32, t => {
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          const row = y >> 4, joint = y % 16 === 0 || (x + (row ? 16 : 0)) % 32 === 8;
          t.put(x, y, joint ? [30, 25, 34] : [noise(74, 10), noise(66, 9), noise(82, 11)]);
        }
      }),
      altar: tex(64, 32, t => {
        for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
          const joint = y === 0 || y === 31 || x === 0 || x === 63;
          t.put(x, y, joint ? [30, 25, 34] : [noise(70, 9), noise(62, 8), noise(78, 10)]);
        }
        const g = [190, 146, 64];
        for (let a = 0; a < 200; a++) { const q = a / 200 * Math.PI * 2; t.put(32 + Math.cos(q) * 11, 16 + Math.sin(q) * 11, g); }
        for (let y = -8; y <= 8; y++) { const hw = Math.round(5 * Math.sin((y + 8) / 16 * Math.PI)); t.put(32 - hw, 16 + y, g); t.put(32 + hw, 16 + y, g); }
        t.line(32, 8, 32, 26, g);
        [[8, 8], [56, 8], [8, 24], [56, 24]].forEach(([x, y]) => { t.line(x - 3, y, x + 3, y, g); t.line(x, y - 3, x, y + 3, g); });
      }),
      pot: tex(32, 32, t => {
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          const band = y >= 4 && y <= 6, sh = 1 - y / 64;
          t.put(x, y, band ? [92, 30, 24] : [noise(150 * sh, 10), noise(64 * sh, 7), noise(42 * sh, 6)]);
        }
        for (let x = 2; x < 32; x += 8) { t.line(x, 12, x + 4, 12, [220, 200, 160]); t.line(x + 2, 10, x + 2, 16, [220, 200, 160]); }
      }),
      wax: tex(16, 32, t => {
        for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) t.put(x, y, [noise(222 - y * 2, 5), noise(208 - y * 2.2, 5), noise(176 - y * 2.4, 5)]);
        for (let i = 0; i < 4; i++) { const x = 1 + i * 4, l = 6 + (i * 7) % 11; t.line(x, 0, x, l, [246, 236, 210]); }
      }),
      // a leaf of basil with its veins, cut out of the square: the diamond of two triangles shows a rounded blade
      leaf: tex(32, 32, t => {
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          const u = (x + 0.5) / 32, v = (y + 0.5) / 32;
          const s = v < 0.55 ? v / 0.55 * 0.5 : 0.5 + (v - 0.55) / 0.45 * 0.5;
          const hw = 0.5 * Math.pow(Math.sin(Math.PI * s), 0.7), du = Math.abs(u - 0.5);
          if (du > hw * 0.97) continue;
          const edge = hw - du < 0.05, mid = du < 0.035, vein = ((v + du * 1.2) * 6) % 1 < 0.14 && du < hw * 0.8;
          const k = 1 - Math.pow(du / (hw || 1), 2) * 0.28;
          t.put(x, y, edge ? [38, 82, 30] : mid ? [168, 224, 118] : vein ? [128, 196, 86] : [noise(84 * k, 5), noise(150 * k, 6), noise(56 * k, 5)]);
        }
      }),
      flame: tex(16, 32, t => {
        for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
          const u = (x + 0.5) / 16, v = (y + 0.5) / 32, du = Math.abs(u - 0.5);
          const hw = 0.44 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.08)), 0.8) * Math.min(1, v * 1.6);
          if (du > hw) continue;
          t.put(x, y, v > 0.86 ? [120, 92, 210] : du < hw * 0.28 && v > 0.5 ? [255, 246, 214] : du < hw * 0.6 ? [255, 206, 96] : [240, 120, 40]);
        }
      })
    };
    return TX;
  }
