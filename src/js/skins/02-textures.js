  /* ------------------------------------------------------------------ */
  /* textures, drawn pixel by pixel: the circle on the floor, stone, the  */
  /* altar's sigil, the pot, wax, leaves of basil, a flame, earth, pages, */
  /* runes, letters, the night sky                                        */
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
  // the circle of the floor: two rings, a seven-pointed star, runes between the rings, the leaf of basil in the middle;
  // red — the colour of its lines, gold — of its runes
  function ritual(t, red, gold) {
    const { put, line, w } = t, c = w / 2;
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
    const leaf = (pal, spots) => leafTex(pal, spots, noise);
    TX = {
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
      // the leaves of the sorts: green, the purple of «Тёмный опал», the lemon's pale, the Thai's purple midrib, one sick
      // with brown spots, and a quill's feather of the same cut
      leaf: leaf([[38, 82, 30], [168, 224, 118], [128, 196, 86], [84, 150, 56]]),
      leafOpal: leaf([[34, 12, 36], [176, 96, 176], [134, 64, 136], [98, 38, 96]]),
      leafLemon: leaf([[78, 108, 30], [228, 244, 156], [196, 226, 116], [156, 196, 84]]),
      leafThai: leaf([[26, 64, 26], [176, 96, 186], [104, 170, 78], [62, 124, 48]]),
      leafSick: leaf([[112, 92, 30], [214, 204, 120], [200, 188, 96], [176, 164, 64]], true),
      feather: leaf([[150, 140, 132], [252, 246, 236], [222, 214, 200], [208, 200, 188]]),
      // earth with its crumbs, and the green of pesto in the mortar
      soil: tex(16, 16, t => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = R0(); t.put(x, y, r < 0.12 ? [96, 66, 42] : r < 0.24 ? [30, 20, 14] : [noise(58, 6), noise(38, 5), noise(26, 4)]); } }),
      paste: tex(16, 16, t => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = R0(); t.put(x, y, r < 0.14 ? [140, 190, 80] : r < 0.24 ? [228, 210, 150] : [noise(54, 6), noise(104, 8), noise(36, 5)]); } }),
      // the pages of the book: lines of a hand, a drawn leaf on the right one, a circle of runes on the left
      pageL: tex(24, 32, t => page(t, noise, false)),
      pageR: tex(24, 32, t => page(t, noise, true)),
      leather: tex(16, 16, t => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.put(x, y, x === 1 || y === 1 || x === 14 || y === 14 ? [176, 132, 58] : [noise(86, 8), noise(24, 4), noise(30, 4)]); }),
      // the night outside the window: violet going dark upwards, a few stars
      sky: tex(32, 32, t => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const k = y / 31; t.put(x, y, R0() < 0.025 && k < 0.7 ? [236, 226, 255] : [noise(14 + 44 * k, 3), noise(10 + 18 * k, 3), noise(34 + 40 * k, 4)]); } }),
      runes: [...Array(6)].map((_, i) => tex(8, 8, t => runeGlyph(t, i))),
      letters: ['N', 'P', 'K'].map(ch => tex(16, 16, t => letter(t, ch, noise))),
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
  // a leaf with its veins, cut out of the square: the diamond of two triangles shows a rounded blade.
  // pal: the edge, the midrib, the veins, the blade; spots — the brown spots of a sick leaf with their yellow halo
  // a leaf of n pixels square (32 for the console; «Друид» draws its own at 64, smooth): the blade's outline in its
  // alpha — round shoulders, a pointed tip — the midrib, the veins, spots if it is sick
  function leafTex(pal, spots, noise, n = 32) {
    const [edgeC, midC, veinC, bladeC] = pal, R1 = rng(23), z = n / 32;
    const dots = spots ? [...Array(5)].map(() => [(8 + R1() * 16) * z, (8 + R1() * 16) * z, (1.4 + R1() * 1.6) * z]) : [];
    return tex(n, n, t => {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const u = (x + 0.5) / n, v = (y + 0.5) / n;
        const s = v < 0.55 ? v / 0.55 * 0.5 : 0.5 + (v - 0.55) / 0.45 * 0.5;
        const hw = 0.5 * Math.pow(Math.sin(Math.PI * s), 0.7), du = Math.abs(u - 0.5);
        if (du > hw * 0.97) continue;
        const edge = hw - du < 0.05 / Math.sqrt(z), mid = du < 0.035 / Math.sqrt(z), vein = ((v + du * 1.2) * 6) % 1 < 0.14 && du < hw * 0.8;
        const k = 1 - Math.pow(du / (hw || 1), 2) * 0.28;
        const spot = dots.reduce((m, [sx, sy, r]) => Math.min(m, Math.hypot(x - sx, y - sy) / r), 9);
        t.put(x, y, spot < 1 ? [86, 52, 26] : spot < 1.6 ? [204, 178, 70] : edge ? edgeC : mid ? midC : vein ? veinC : [noise(bladeC[0] * k, 5), noise(bladeC[1] * k, 6), noise(bladeC[2] * k, 5)]);
      }
    });
  }
  // the floor of the circle and its glow, in the colour of a chapter (made once for each colour)
  const FLOORS = new Map();
  function floorTex(col, glow) {
    const key = col.join(',') + (glow ? '+' : '');
    if (FLOORS.has(key)) return FLOORS.get(key);
    const R2 = rng(11), noise = (v, a) => clamp(v + (R2() - 0.5) * 2 * a, 0, 255);
    const gold = col.map((v, i) => Math.min(255, Math.round(v * 0.4 + [255, 234, 100][i] * 0.6)));
    const c = tex(128, 128, t => {
      if (!glow) for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        const v = x % 32 === 0 || y % 32 === 0 ? 12 : 26;
        t.put(x, y, [noise(v, 5), noise(v * 0.78, 4), noise(v * 1.25, 6)]);
      }
      ritual(t, glow ? col : col.map(v => v * 0.55), glow ? gold : gold.map(v => v * 0.55));
    });
    FLOORS.set(key, c);
    return c;
  }
  // a page of the grimoire: parchment, lines of writing, and a drawing — a leaf (right) or a circle of runes (left)
  function page(t, noise, right) {
    const { put, line } = t, ink = [74, 46, 34];
    for (let y = 0; y < 32; y++) for (let x = 0; x < 24; x++) put(x, y, [noise(222 - y * 0.8, 6), noise(204 - y * 0.8, 6), noise(160 - y, 6)]);
    const R3 = rng(right ? 41 : 43);
    for (let y = 3; y < 30; y += 3) {
      if (right ? y > 9 && y < 22 : y > 15 && y < 27) continue;
      let x = 3;
      while (x < 21) { const l = 1 + (R3() * 5 | 0); line(x, y, Math.min(20, x + l), y, ink); x += l + 2; }
    }
    if (right) {
      for (let k = -5; k <= 5; k++) { const hw = Math.round(3.4 * Math.sin((k + 6) / 12 * Math.PI)); put(12 - hw, 16 + k, [60, 112, 46]); put(12 + hw, 16 + k, [60, 112, 46]); }
      line(12, 10, 12, 22, [60, 112, 46]);
    } else {
      for (let a = 0; a < 60; a++) { const q = a / 60 * Math.PI * 2; put(12 + Math.cos(q) * 5, 21 + Math.sin(q) * 5, [150, 30, 36]); }
      for (let i = 0; i < 5; i++) { const q = -Math.PI / 2 + i / 5 * Math.PI * 2, q2 = q + 4 * Math.PI / 5; line(12 + Math.cos(q) * 4, 21 + Math.sin(q) * 4, 12 + Math.cos(q2) * 4, 21 + Math.sin(q2) * 4, [150, 30, 36]); }
    }
  }
  // a rune of light (the glyphs that circle the book): a few strokes on a grid of three by four, nothing around them
  function runeGlyph(t, i) {
    const R4 = rng(61 + i * 7), g = [255, 204, 112], P = [[1, 1], [6, 1], [1, 6], [6, 6], [3, 1], [3, 6], [1, 3], [6, 3], [3, 3]];
    const n = 2 + (R4() * 2 | 0);
    for (let k = 0; k < n; k++) { const a = P[R4() * P.length | 0], b = P[R4() * P.length | 0]; t.line(a[0], a[1], b[0], b[1], g); }
    t.line(3, 1, 3, 6, g);
  }
  // a letter of gold carved into a stone: the element a flask holds
  const GLYPH = { N: ['1001', '1101', '1011', '1001', '1001'], P: ['1110', '1001', '1110', '1000', '1000'], K: ['1001', '1010', '1100', '1010', '1001'] };
  function letter(t, ch, noise) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.put(x, y, y === 0 || x === 0 || y === 15 || x === 15 ? [30, 25, 34] : [noise(70, 9), noise(62, 8), noise(78, 10)]);
    GLYPH[ch].forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) t.put(4 + x * 2 + dx, 3 + y * 2 + dy, [226, 182, 84]); }));
  }
