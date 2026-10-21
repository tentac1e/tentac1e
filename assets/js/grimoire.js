/* Гид по базилику — оформление «Гримуар»: сцены в манере PS1 (склеп за страницей, алтарь с кустом, молекулы); страница грузит этот файл, только пока тема включена. Файл собирает scripts/build.py из src/js/grimoire/ — правьте там */
window.BasilGrimoire = (() => {
  'use strict';
  /* ------------------------------------------------------------------ */
  /* the theme «Гримуар»: what every scene of it uses                    */
  /* ------------------------------------------------------------------ */
  const doc = document, root = doc.documentElement;
  const $ = (s, r = doc) => r.querySelector(s), $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const skinOn = () => root.getAttribute('data-skin') === 'grimoire';
  const SC = window.BasilScene;
  // a seeded random: the same scene at every visit
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // the ordered dither of the console: 4 × 4 thresholds
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  // one loop on the page's frame budget (scene.js): the console's 30 frames a second at most, fewer when calm,
  // none asleep; without scene.js — requestAnimationFrame at that pace
  function psxLoop(frame, fps = 30) {
    const gate = SC && SC.gate ? SC.gate(fps, Math.min(fps, 20)) : (() => { let p = 0; return ts => (ts - p >= 1000 / fps - 3 ? (p = ts, true) : false); })();
    if (SC && SC.loop) {
      const L = SC.loop(ts => { L.next(); if (gate(ts)) frame(ts); });
      return L;
    }
    let raf = 0, on = false;
    const run = ts => { raf = 0; if (!on) return; raf = requestAnimationFrame(run); if (gate(ts)) frame(ts); };
    return { start() { on = true; if (!raf) raf = requestAnimationFrame(run); }, stop() { on = false; cancelAnimationFrame(raf); raf = 0; }, next() {}, get on() { return on; } };
  }
  /* ------------------------------------------------------------------ */
  /* a small rasterizer of the PS1 kind on a 2D canvas                    */
  /* ------------------------------------------------------------------ */
  /* Low resolution, vertices snapped to whole pixels (the wobble), textures mapped affinely per triangle (the swim),
     no filtering, the painter's order by layer and depth, fog, then a few levels a colour channel with an ordered
     dither between them — the console's look, nothing of it a shader */
  class Raster {
    constructor(canvas, o) {
      this.c = canvas;
      this.x = canvas.getContext('2d', { willReadFrequently: true });
      Object.assign(this, { px: 3, maxW: 380, levels: 16, fog: [28, 17, 34], fogNear: 4, fogFar: 14, near: 0.2, amb: [0.16, 0.13, 0.2], key: null, lights: [] }, o);
      this.W = this.H = 0;
    }
    // the canvas on the page: its CSS size divided into console pixels (3 px or more, at most maxW across)
    size() {
      const cw = this.c.clientWidth || 300, ch = this.c.clientHeight || 200, s = Math.max(this.px, cw / this.maxW);
      return this.sizeTo(Math.round(cw / s), Math.round(ch / s));
    }
    sizeTo(w, h) {
      this.W = Math.max(24, w); this.H = Math.max(20, h);
      if (this.c.width !== this.W || this.c.height !== this.H) { this.c.width = this.W; this.c.height = this.H; }
      this.x.imageSmoothingEnabled = false;
      return this;
    }
    cam(eye, target, focal, cx = 0.5, cy = 0.5) {
      const f = norm(sub(target, eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
      this.C = { eye, f, r, u, focal: focal * this.H, cx: cx * this.W, cy: cy * this.H };
      this.list = [];
    }
    view(p) { const C = this.C, d = sub(p, C.eye); return [dot(d, C.r), dot(d, C.u), dot(d, C.f)]; }
    proj(v) { const C = this.C; return [Math.round(C.cx + v[0] * C.focal / v[2]), Math.round(C.cy - v[1] * C.focal / v[2])]; }
    shade(n, m, ds) {
      let [r, g, b] = this.amb;
      if (this.key) {
        let k = dot(n, this.key.dir);
        if (ds) k = Math.abs(k);
        k = Math.max(0, k) * this.key.i;
        r += k * this.key.col[0]; g += k * this.key.col[1]; b += k * this.key.col[2];
      }
      for (const L of this.lights) {
        const d = sub(L.p, m), dist = Math.hypot(d[0], d[1], d[2]) || 1;
        let k = dot(n, d) / dist;
        if (ds) k = Math.abs(k);
        k = Math.max(0, k) * L.i / (1 + dist * dist * L.fall);
        r += k * L.col[0]; g += k * L.col[1]; b += k * L.col[2];
      }
      return [Math.min(1.25, r), Math.min(1.25, g), Math.min(1.25, b)];
    }
    // one triangle in the world: culled when it faces away (solids say where their inside is: ctr or an axis)
    tri(a, b, c, o) {
      let n = norm(cross(sub(b, a), sub(c, a)));
      const m = mul(add(add(a, b), c), 1 / 3);
      if (o.ctr || o.axis) {
        let out;
        if (o.axis) { const w = sub(m, o.axis[0]); out = sub(w, mul(o.axis[1], dot(w, o.axis[1]))); } else out = sub(m, o.ctr);
        if (dot(n, out) < 0) n = mul(n, -1);
        if (dot(n, sub(this.C.eye, m)) <= 0) return;
      }
      const va = this.view(a), vb = this.view(b), vc = this.view(c);
      if (va[2] < this.near || vb[2] < this.near || vc[2] < this.near) return;
      const p = [this.proj(va), this.proj(vb), this.proj(vc)];
      const xs = [p[0][0], p[1][0], p[2][0]], ys = [p[0][1], p[1][1], p[2][1]];
      if (Math.max(...xs) < 0 || Math.min(...xs) > this.W || Math.max(...ys) < 0 || Math.min(...ys) > this.H) return;
      this.list.push({ p, z: (va[2] + vb[2] + vc[2]) / 3, o, l: o.emis ? null : this.shade(n, m, o.ds) });
    }
    draw() {
      const x = this.x, F = this.fog;
      this.list.sort((A, B) => (A.o.layer || 1) - (B.o.layer || 1) || B.z - A.z);
      for (const t of this.list) {
        const o = t.o, [a, b, c] = t.p;
        const f = o.nofog ? 0 : clamp((t.z - this.fogNear) / (this.fogFar - this.fogNear), 0, 1) ** 1.15;
        // the triangle grown by half a pixel: neighbours meet without cracks
        const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
        const g = q => { const dx = q[0] - cx, dy = q[1] - cy, L = Math.hypot(dx, dy) || 1; return [q[0] + dx / L * 0.6, q[1] + dy / L * 0.6]; };
        const A = g(a), B = g(b), C = g(c);
        if (o.tex) {
          x.save();
          x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.lineTo(C[0], C[1]); x.closePath(); x.clip();
          const w = o.tex.width, h = o.tex.height, uv = o.uv;
          const u0 = uv[0][0] * w, v0 = uv[0][1] * h, u1 = uv[1][0] * w, v1 = uv[1][1] * h, u2 = uv[2][0] * w, v2 = uv[2][1] * h;
          const det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
          if (det) {
            const ta = ((b[0] - a[0]) * (v2 - v0) - (c[0] - a[0]) * (v1 - v0)) / det, tb = ((b[1] - a[1]) * (v2 - v0) - (c[1] - a[1]) * (v1 - v0)) / det;
            const tc = ((c[0] - a[0]) * (u1 - u0) - (b[0] - a[0]) * (u2 - u0)) / det, td = ((c[1] - a[1]) * (u1 - u0) - (b[1] - a[1]) * (u2 - u0)) / det;
            if (o.add != null) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = o.add; }
            x.setTransform(ta, tb, tc, td, a[0] - ta * u0 - tc * v0, a[1] - tb * u0 - td * v0);
            x.drawImage(o.cut && (t.l || f > 0.01) ? shaded(o.tex, t.l, f, F) : o.tex, 0, 0);
            x.setTransform(1, 0, 0, 1, 0, 0);
            x.globalAlpha = 1;
            if (o.add == null && !o.cut) {
              if (t.l) { x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${Math.min(255, t.l[0] * 255) | 0},${Math.min(255, t.l[1] * 255) | 0},${Math.min(255, t.l[2] * 255) | 0})`; x.fill(); }
              if (f > 0.01) { x.globalCompositeOperation = 'source-over'; x.fillStyle = `rgba(${F[0]},${F[1]},${F[2]},${f})`; x.fill(); }
            }
            x.globalCompositeOperation = 'source-over';
          }
          x.restore();
        } else {
          const col = o.col, l = t.l || [1, 1, 1];
          const r = col[0] * l[0] * (1 - f) + F[0] * f, gg = col[1] * l[1] * (1 - f) + F[1] * f, bb = col[2] * l[2] * (1 - f) + F[2] * f;
          if (o.add != null) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = o.add; }
          x.fillStyle = `rgb(${Math.min(255, r) | 0},${Math.min(255, gg) | 0},${Math.min(255, bb) | 0})`;
          x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.lineTo(C[0], C[1]); x.closePath(); x.fill();
          x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
        }
      }
    }
    // the colour depth of the console: a few levels a channel, an ordered (Bayer) dither between them
    post(levels = this.levels) {
      const img = this.x.getImageData(0, 0, this.W, this.H), d = img.data, W = this.W, step = 255 / (levels - 1);
      for (let y = 0, i = 0; y < this.H; y++) for (let xx = 0; xx < W; xx++, i += 4) {
        const t = (BAYER[(y & 3) * 4 + (xx & 3)] / 16 - 0.47) * step;
        d[i] = Math.round((d[i] + t) / step) * step;
        d[i + 1] = Math.round((d[i + 1] + t) / step) * step;
        d[i + 2] = Math.round((d[i + 2] + t) / step) * step;
      }
      this.x.putImageData(img, 0, 0);
    }
  }

  // a cut-out texture (a leaf, a flame) lit and fogged, kept for the next triangle in the same light
  const SHADED = new Map();
  let texId = 0;
  function shaded(tx, l, f, F) {
    const q = v => Math.round(Math.min(1.2, v) * 10);
    if (!tx.psxId) tx.psxId = ++texId;
    const key = tx.psxId + ':' + (l ? l.map(q).join(',') : '-') + ',' + Math.round(f * 12);
    let c = SHADED.get(key);
    if (c) return c;
    if (SHADED.size > 600) SHADED.clear();
    c = doc.createElement('canvas');
    c.width = tx.width; c.height = tx.height;
    const x = c.getContext('2d');
    x.drawImage(tx, 0, 0);
    if (l) { x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${Math.min(255, q(l[0]) * 25.5) | 0},${Math.min(255, q(l[1]) * 25.5) | 0},${Math.min(255, q(l[2]) * 25.5) | 0})`; x.fillRect(0, 0, c.width, c.height); }
    const ff = Math.round(f * 12) / 12;
    if (ff > 0) { x.globalCompositeOperation = 'source-over'; x.fillStyle = `rgba(${F[0]},${F[1]},${F[2]},${ff})`; x.fillRect(0, 0, c.width, c.height); }
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(tx, 0, 0);
    SHADED.set(key, c);
    return c;
  }

  // shapes: a quad (two triangles), a box, a prism (pot, candle), a low ball (an atom), a rod (a bond, a stem), a billboard
  function quad(R, a, b, c, d, o, u0 = 0, u1 = 1, v0 = 0, v1 = 1) {
    R.tri(a, b, c, { ...o, uv: [[u0, v1], [u1, v1], [u1, v0]] });
    R.tri(a, c, d, { ...o, uv: [[u0, v1], [u1, v0], [u0, v0]] });
  }
  function box(R, c, s, o) {
    const [x, y, z] = c, [a, b, d] = s;
    const v = [[x - a, y - b, z - d], [x + a, y - b, z - d], [x + a, y + b, z - d], [x - a, y + b, z - d], [x - a, y - b, z + d], [x + a, y - b, z + d], [x + a, y + b, z + d], [x - a, y + b, z + d]];
    [[0, 1, 2, 3, 1], [5, 4, 7, 6, 1], [4, 0, 3, 7, 0], [1, 5, 6, 2, 0], [3, 2, 6, 7, 0], [4, 5, 1, 0, 0]]
      .forEach(f => quad(R, v[f[0]], v[f[1]], v[f[2]], v[f[3]], { ...o, tex: f[4] && o.texFront ? o.texFront : o.tex, ctr: c }));
  }
  function prism(R, cx, cz, y0, y1, r0, r1, n, o, cap, rot = 0) {
    const ctr = [cx, (y0 + y1) / 2, cz];
    for (let i = 0; i < n; i++) {
      const a0 = rot + i / n * Math.PI * 2, a1 = rot + (i + 1) / n * Math.PI * 2;
      const p00 = [cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0], p10 = [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0];
      const p01 = [cx + Math.cos(a0) * r1, y1, cz + Math.sin(a0) * r1], p11 = [cx + Math.cos(a1) * r1, y1, cz + Math.sin(a1) * r1];
      quad(R, p00, p10, p11, p01, { ...o, axis: [[cx, y0, cz], [0, 1, 0]] }, i / n, (i + 1) / n, 0, 1);
      if (cap) R.tri([cx, y1, cz], p01, p11, { col: cap, ctr });
    }
  }
  const ICO = (() => {
    const t = (1 + Math.sqrt(5)) / 2;
    const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
    const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    return { v, f };
  })();
  function ball(R, c, r, o) { ICO.f.forEach(([a, b, d]) => R.tri(add(c, mul(ICO.v[a], r)), add(c, mul(ICO.v[b], r)), add(c, mul(ICO.v[d], r)), { ...o, ctr: c })); }
  function rod(R, p, q, r, o, n = 4) {
    const d = norm(sub(q, p)), up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const s = norm(cross(d, up)), t = cross(d, s);
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2 + 0.4, a1 = (i + 1) / n * Math.PI * 2 + 0.4;
      const o0 = add(mul(s, Math.cos(a0) * r), mul(t, Math.sin(a0) * r)), o1 = add(mul(s, Math.cos(a1) * r), mul(t, Math.sin(a1) * r));
      R.tri(add(p, o0), add(p, o1), add(q, o1), { ...o, axis: [p, d] });
      R.tri(add(p, o0), add(q, o1), add(q, o0), { ...o, axis: [p, d] });
    }
  }
  function billboard(R, c, w, h, o) {
    const r = mul(R.C.r, w), u = mul(R.C.u, h);
    quad(R, sub(sub(c, r), u), sub(add(c, r), u), add(add(c, r), u), add(sub(c, r), u), o);
  }
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
  /* ------------------------------------------------------------------ */
  /* molecules: low polygons, the console's light                         */
  /* ------------------------------------------------------------------ */
  // the 3D shape for the altar's molecule: springs for the bonds and the angles between them, a push between the rest
  const SHAPES = {};
  function molShape(id) {
    if (SHAPES[id]) return SHAPES[id];
    const M = window.BasilScience && window.BasilScience.MOLS && window.BasilScience.MOLS[id];
    if (!M) return null;
    const atoms = M.atoms, bonds = M.bonds, n = atoms.length, R = rng(31 + n * 7);
    const P = [...Array(n)].map(() => [R() * 4 - 2, R() * 4 - 2, R() * 4 - 2]);
    const nbr = [...Array(n)].map(() => []);
    bonds.forEach(([a, b]) => { nbr[a].push(b); nbr[b].push(a); });
    const ring = new Set(M.ring || []);
    const pairs = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const bd = bonds.find(b => (b[0] === i && b[1] === j) || (b[0] === j && b[1] === i));
      const share = nbr[i].some(k => nbr[j].includes(k));
      const para = M.ring && ring.has(i) && ring.has(j) && Math.abs(M.ring.indexOf(i) - M.ring.indexOf(j)) === 3;
      if (bd) pairs.push([i, j, ring.has(i) && ring.has(j) ? 1.4 : bd[2] === 2 ? 1.34 : 1.52, 1, 0]);
      else if (share) pairs.push([i, j, 2.48, 0.6, 0]);
      else if (para) pairs.push([i, j, 2.8, 0.6, 0]);
      else pairs.push([i, j, 3.2, 0.15, 1]);
    }
    for (let it = 0; it < 900; it++) {
      const F = P.map(() => [0, 0, 0]);
      for (const [i, j, t, k, push] of pairs) {
        const d = sub(P[j], P[i]), L = Math.hypot(d[0], d[1], d[2]) || 1e-3;
        if (push && L > t) continue;
        const f = k * (L - t) / L;
        for (let a = 0; a < 3; a++) { F[i][a] += d[a] * f; F[j][a] -= d[a] * f; }
      }
      P.forEach((p, i) => { for (let a = 0; a < 3; a++) p[a] += F[i][a] * 0.06; });
    }
    const c = P.reduce((s, p) => add(s, p), [0, 0, 0]).map(v => v / n);
    SHAPES[id] = { atoms, bonds, P: P.map(p => sub(p, c)) };
    return SHAPES[id];
  }

  /* The molecule viewer of the guide (MolViewer, science.js) draws through here while the theme is on: the same
     molecule, turned the same way, rendered at a third of the size — atoms twenty flat faces, bonds four-sided rods,
     vertices snapped to the console's pixels — and drawn back up without smoothing */
  const MOLBUF = new WeakMap();
  function drawMol(ctx, mol, P, R3, W, H) {
    let b = MOLBUF.get(ctx.canvas);
    if (!b) {
      const cv = doc.createElement('canvas');
      b = { cv, R: new Raster(cv, { levels: 18, fogNear: 9, fogFar: 17, amb: [0.2, 0.17, 0.24] }) };
      b.R.key = { dir: norm([-0.5, 0.7, -0.6]), i: 0.95, col: [1, 0.95, 0.85] };
      MOLBUF.set(ctx.canvas, b);
    }
    const R = b.R.sizeTo(Math.round(W / 3), Math.round(H / 3)), w = R.W, h = R.H;
    R.cam([0, 0, -13], [0, 0, 0], 1.45 * Math.min(1, w / h));
    const x = R.x, g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, '#2A1A34'); g.addColorStop(1, '#0B0910');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const [r0, r1, r2] = R3;
    // the viewer's turn, seen from the side the viewer draws it: screen x and y and depth the same as its own
    const Q0 = P.map(([px, py, pz]) => [-(r0[0] * px + r0[1] * py + r0[2] * pz), -(r1[0] * px + r1[1] * py + r1[2] * pz), -(r2[0] * px + r2[1] * py + r2[2] * pz)]);
    const ext = Math.max(...Q0.map(p => Math.hypot(p[0], p[1], p[2]))) || 1, k = 3.6 / ext, Q = Q0.map(p => mul(p, k));
    const bondCol = [150, 132, 118], s = k / 1.2;
    // ball and stick, a whole atom or bond at a time from the far side to the near one (as the viewer draws them):
    // the painter's order of single triangles would let a long bond cut through an atom in front of it
    const items = mol.bonds.map(([a, c, o]) => ({ z: (Q[a][2] + Q[c][2]) / 2, draw: o2 => {
      if (o === 2) {
        const d = norm(sub(Q[c], Q[a])), off = mul(norm(cross(d, [0, 0, 1])), 0.13 * s);
        rod(R, add(Q[a], off), add(Q[c], off), 0.08 * s, { ...o2, col: bondCol });
        rod(R, sub(Q[a], off), sub(Q[c], off), 0.08 * s, { ...o2, col: bondCol });
      } else rod(R, Q[a], Q[c], 0.11 * s, { ...o2, col: bondCol });
    } })).concat(mol.atoms.split('').map((el, i) => ({ z: Q[i][2] - 0.3, draw: o2 => ball(R, Q[i], (el === 'O' ? 0.42 : 0.36) * s, { ...o2, col: el === 'O' ? [214, 52, 60] : [222, 208, 176] }) })));
    items.sort((u, v) => v.z - u.z).forEach((it, i) => it.draw({ layer: 2 + i }));
    R.draw();
    R.post(18);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(b.cv, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  /* ------------------------------------------------------------------ */
  /* the altar: basil in a clay pot on a stone altar, seven candles on    */
  /* the points of a star in a circle of runes, the molecule of the       */
  /* chapter turning above the bush — at the head of every chapter and    */
  /* in the hero of the home page                                         */
  /* ------------------------------------------------------------------ */
  // which molecule of the aroma rises above the bush in each chapter
  const ALTAR_MOL = { glavnaya: 'lin', sorta: 'est', posadka: 'cin', uhod: 'lin', udobreniya: 'eug', gidro: 'cin', formirovka: 'car', vkus: 'eug', problemy: 'est', spravka: 'lin', moy: 'lin' };
  function altar(host, view) {
    const stage = doc.createElement('div');
    stage.className = 'psx-stage';
    stage.setAttribute('aria-hidden', 'true');
    const cv = doc.createElement('canvas');
    stage.appendChild(cv);
    host.insertBefore(stage, host.firstChild);
    const T = textures();
    const R = new Raster(cv, { px: 3, maxW: 400, levels: 16, fogNear: 3.5, fogFar: 15, amb: [0.13, 0.1, 0.17] });
    R.key = { dir: norm([-0.35, 0.85, -0.4]), i: 0.42, col: [0.55, 0.5, 0.85] };
    const candles = [...Array(7)].map((_, i) => { const q = -Math.PI / 2 + i / 7 * Math.PI * 2; return { x: Math.cos(q) * 2.95, z: Math.sin(q) * 2.95, h: 0.38 + ((i * 37) % 10) / 22, ph: i * 1.7 }; });
    candles.push({ x: -0.74, z: 0.4, h: 0.26, ph: 4.2, top: 1.09 }, { x: 0.74, z: -0.4, h: 0.2, ph: 2.2, top: 1.09 });
    const embers = [...Array(46)].map((_, i) => ({ k: i % candles.length, a: (i * 0.37) % 1, s: 0.3 + (i * 13 % 10) / 22, dx: ((i * 29) % 11 - 5) / 60, dz: ((i * 17) % 11 - 5) / 60 }));
    const pillars = [...Array(8)].map((_, i) => { const q = 0.35 + i / 8 * Math.PI * 2; return { x: Math.cos(q) * 7.4, z: Math.sin(q) * 7.4, h: 1.6 + ((i * 53) % 10) / 4 }; });
    const mol = molShape(ALTAR_MOL[view] || 'lin') || molShape('lin');
    // the reader turns the altar with a finger or the mouse; a tap sends up a puff of sparks
    const ptr = { turn: 0, lift: 0, drag: null, puffs: [] };
    const t0 = performance.now();
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
      if (ptr.drag && !ptr.drag.moved) { ptr.puffs.push({ t: (performance.now() - t0) / 1000 }); if (ptr.puffs.length > 4) ptr.puffs.shift(); }
      ptr.drag = null;
    };
    stage.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    function frame(now) {
      const still = reduce.matches;
      const t = (now - t0) / 1000;
      R.size();
      const wide = R.W > R.H * 1.9;
      const ang = (still ? 0.6 : t * 0.11) + ptr.turn, eyeY = 2.55 + (still ? 0 : Math.sin(t * 0.3) * 0.15) + ptr.lift;
      const rad = wide ? 6.4 : 7.4;
      R.cam([Math.cos(ang) * rad, eyeY, Math.sin(ang) * rad], [0, 1.45, 0], wide ? 1.25 : 1.05, wide ? 0.68 : 0.5, wide ? 0.44 : 0.4);
      R.lights = candles.map(c => ({ p: [c.x, (c.top || 0) + c.h + 0.14, c.z], col: [1, 0.6, 0.28], i: 0.5 + (still ? 0 : 0.12 * Math.sin(t * 11 + c.ph) + 0.08 * Math.sin(t * 23 + c.ph * 2)), fall: 0.55 }));
      const x = R.x, g = x.createLinearGradient(0, 0, 0, R.H);
      g.addColorStop(0, '#07050B'); g.addColorStop(0.55, '#1C1122'); g.addColorStop(1, '#120B17');
      x.fillStyle = g; x.fillRect(0, 0, R.W, R.H);
      // the floor and its circle: a layer of their own, under everything
      const FL = 4.4, N = 2;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x0 = -FL + i * FL * 2 / N, x1 = x0 + FL * 2 / N, z0 = -FL + j * FL * 2 / N, z1 = z0 + FL * 2 / N;
        quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: T.floor, layer: 0, ds: true }, i / N, (i + 1) / N, j / N, (j + 1) / N);
        quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: T.glow, layer: 0, add: still ? 0.4 : 0.32 + 0.22 * Math.sin(t * 1.4), ds: true }, i / N, (i + 1) / N, j / N, (j + 1) / N);
      }
      for (let k = 0; k < 4; k++) {
        const q = k * Math.PI / 2, far = 16, s = [Math.cos(q), Math.sin(q)], tn = [-s[1], s[0]];
        const p = (a, b) => [s[0] * a + tn[0] * b, 0, s[1] * a + tn[1] * b];
        quad(R, p(FL, -FL), p(far, -far), p(far, far), p(FL, FL), { col: [30, 22, 36], layer: 0, ds: true });
      }
      pillars.forEach(p => box(R, [p.x, p.h / 2, p.z], [0.32, p.h / 2, 0.32], { tex: T.stone }));
      box(R, [0, 0.48, 0], [0.8, 0.48, 0.5], { tex: T.stone, texFront: T.altar });
      box(R, [0, 1.02, 0], [0.92, 0.06, 0.6], { tex: T.stone });
      prism(R, 0, 0, 1.08, 1.46, 0.27, 0.37, 8, { tex: T.pot });
      prism(R, 0, 0, 1.43, 1.52, 0.39, 0.41, 8, { col: [120, 44, 32] }, [46, 28, 22]);
      // the bush: a stem and pairs of leaves, each pair a quarter turn from the one below
      const sway = k => still ? 0 : Math.sin(t * 1.3 + k) * 0.05;
      const top = [still ? 0 : Math.sin(t * 0.7) * 0.02, 2.32, 0];
      rod(R, [0, 1.47, 0], [top[0] * 0.5, 1.9, 0], 0.03, { col: [70, 128, 48] });
      rod(R, [top[0] * 0.5, 1.9, 0], top, 0.022, { col: [80, 140, 52] });
      [[1.62, 0.46, 0.15], [1.83, 0.4, 0.05], [2.02, 0.32, -0.1], [2.17, 0.24, -0.3], [2.28, 0.15, -0.6]].forEach(([y, len, pitch], k) => {
        for (let s = 0; s < 2; s++) {
          const yaw = k * Math.PI / 2 + s * Math.PI + 0.3 + sway(k + s), pt = pitch + sway(k * 2 + s) * 0.8;
          const Fn = norm([Math.cos(yaw) * Math.cos(pt), -Math.sin(pt) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pt)]);
          const Sd = norm(cross(Fn, [0, 1, 0])), U = cross(Sd, Fn);
          const B = [top[0] * (y - 1.47) / 0.85, y, 0];
          const Tp = add(add(B, mul(Fn, len)), mul(U, -len * 0.22)), M = add(add(B, mul(Fn, len * 0.5)), mul(U, len * 0.1));
          const Lf = add(add(B, mul(Fn, len * 0.42)), mul(Sd, -len * 0.36)), Rt = add(add(B, mul(Fn, len * 0.42)), mul(Sd, len * 0.36));
          const o = { tex: T.leaf, ds: true, cut: true };
          R.tri(B, Lf, M, { ...o, uv: [[0.5, 1], [0, 0.55], [0.5, 0.55]] });
          R.tri(Lf, Tp, M, { ...o, uv: [[0, 0.55], [0.5, 0], [0.5, 0.55]] });
          R.tri(B, M, Rt, { ...o, uv: [[0.5, 1], [0.5, 0.55], [1, 0.55]] });
          R.tri(M, Tp, Rt, { ...o, uv: [[0.5, 0.55], [0.5, 0], [1, 0.55]] });
        }
      });
      candles.forEach((c, i) => {
        const y0 = c.top || 0;
        prism(R, c.x, c.z, y0, y0 + c.h, 0.085, 0.075, 6, { tex: T.wax }, [236, 226, 200], i);
        const fl = still ? 1 : 1 + 0.18 * Math.sin(t * 13 + c.ph) + 0.1 * Math.sin(t * 29 + c.ph);
        billboard(R, [c.x, y0 + c.h + 0.1 * fl, c.z], 0.05, 0.1 * fl, { tex: T.flame, emis: true, nofog: true, cut: true });
      });
      // the essence above the bush: the chapter's molecule, slowly turning
      const my = 2.85 + (still ? 0 : Math.sin(t * 0.9) * 0.06), yaw = still ? 0.8 : t * 0.5, ca = Math.cos(yaw), sa = Math.sin(yaw);
      if (mol) {
        const MP = mol.P.map(p => { const q = [p[0] * ca + p[2] * sa, p[1], -p[0] * sa + p[2] * ca]; return [q[0] * 0.15, my + q[1] * 0.135 + q[2] * 0.03, q[2] * 0.15]; });
        mol.bonds.forEach(([a, b]) => rod(R, MP[a], MP[b], 0.012, { col: [170, 120, 230], emis: true }, 3));
        mol.atoms.split('').forEach((el, i) => ball(R, MP[i], el === 'O' ? 0.06 : 0.045, { col: el === 'O' ? [240, 70, 60] : [214, 190, 255], emis: true }));
      }
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
      halo([0, my, 0], 0.5, 'rgba(155,107,214,.26)', 'rgba(155,107,214,0)');
      // sparks from the candles, and the reader's puffs from the bush
      const spark = (p3, life, big) => {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), s = big || v[2] < 4 ? 2 : 1;
        x.fillStyle = `rgba(255,${150 + (life * 60) | 0},70,${(1 - life) * 0.9})`;
        x.fillRect(p[0], p[1], s, s);
      };
      embers.forEach(e => {
        const c = candles[e.k], life = still ? e.a : (e.a + t * e.s * 0.25) % 1;
        spark([c.x + e.dx * life * 8, (c.top || 0) + c.h + 0.15 + life * 1.6, c.z + e.dz * life * 8], life);
      });
      ptr.puffs = ptr.puffs.filter(p => t - p.t < 2.2);
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
  /* ------------------------------------------------------------------ */
  /* the crypt behind the page: fog of old blood and violet, ash and      */
  /* sparks drifting up, at a fifth of the resolution                     */
  /* ------------------------------------------------------------------ */
  function crypt() {
    const cv = doc.createElement('canvas');
    cv.id = 'psx-crypt';
    cv.setAttribute('aria-hidden', 'true');
    const page = $('.page');
    (page ? page.parentNode : doc.body).insertBefore(cv, page);
    const x = cv.getContext('2d', { willReadFrequently: true });
    const R = new Raster(cv, { px: 5, maxW: 320, levels: 20 });
    const motes = [...Array(70)].map((_, i) => ({ x: (i * 0.618) % 1, y: (i * 0.37) % 1, s: 0.2 + (i % 7) / 10, ember: i % 9 === 0 }));
    const blobs = [[0.2, 0.3, '40,20,58'], [0.8, 0.2, '62,14,26'], [0.6, 0.8, '34,18,48'], [0.1, 0.9, '58,16,28']];
    const t0 = performance.now();
    let scroll = scrollY;
    function frame(now) {
      const still = reduce.matches, t = (now - t0) / 1000;
      R.size();
      const W = R.W, H = R.H, drift = still ? 0 : (scrollY - scroll) / innerHeight * 0.15;
      x.fillStyle = '#0B0910';
      x.fillRect(0, 0, W, H);
      blobs.forEach(([bx, by, c], i) => {
        const cx = (bx + (still ? 0 : Math.sin(t * 0.05 + i) * 0.08)) * W, cy = (by + (still ? 0 : Math.cos(t * 0.04 + i * 2) * 0.06)) * H, r = Math.max(W, H) * 0.55;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${c},.9)`); g.addColorStop(1, `rgba(${c},0)`);
        x.fillStyle = g; x.fillRect(0, 0, W, H);
      });
      motes.forEach(m => {
        const y = (((m.y - (still ? 0 : t * 0.006 * m.s) - drift * m.s) % 1) + 1) % 1, xx = (m.x + (still ? 0 : Math.sin(t * 0.2 + m.y * 9) * 0.01)) * W;
        x.fillStyle = m.ember ? 'rgba(238,138,50,.8)' : 'rgba(181,168,141,.35)';
        x.fillRect(xx | 0, (y * H) | 0, 1, 1);
      });
      R.post(20);
    }
    const L = psxLoop(ts => { if (doc.hidden) { L.stop(); return; } frame(ts); if (reduce.matches) L.stop(); }, 15);
    L.start();
    const onScroll = () => { if (!L.on && !reduce.matches) L.start(); };
    const vis = () => { if (!doc.hidden) { scroll = scrollY; L.start(); } };
    addEventListener('scroll', onScroll, { passive: true });
    doc.addEventListener('visibilitychange', vis);
    let rz = 0;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { if (reduce.matches) frame(performance.now()); }, 120); };
    addEventListener('resize', onResize);
    return {
      destroy() {
        L.stop();
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', onResize);
        doc.removeEventListener('visibilitychange', vis);
        cv.remove();
      }
    };
  }
  /* ------------------------------------------------------------------ */
  /* the drawings of the guide at the console's resolution               */
  /* ------------------------------------------------------------------ */
  /* Everything of a drawing but its captions goes into one group under a pixel filter (a sample every cell, an ordered
     dither, eight levels a channel); the captions — and a group that holds one — stay as they are, sharp enough to
     read. The cell is about 4 px on the screen whatever the size the drawing is shown at: a filter for each size of
     cell in the drawing's own units, made once. A drawing painted later (a picture coming near the screen, a model
     drawing again) is caught as it is added; the cell is fitted again when a tab or a dive opens and on a resize */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const KEEP = 'text, .ill-lbl, .ill-scale, [data-fit]';
  const CELL_PX = 4;
  const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
  const BAYER_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAPElEQVR42mNgAIIOIFACglVAwECGwBkgcAGCd0CQBgTkCBgDwW4gEASCmUBAjsB/ICgHgrtAEAoEZAgAAPqUf4F4u+hGAAAAAElFTkSuQmCC';
  let filterDefs = null;
  const made = new Set();
  function cellFilter(c) {
    const id = 'psx-cell-' + String(c).replace('.', '_');
    if (made.has(id)) return id;
    if (!filterDefs) {
      const host = doc.createElementNS(SVGNS, 'svg');
      host.setAttribute('aria-hidden', 'true');
      host.setAttribute('focusable', 'false');
      host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      filterDefs = doc.createElementNS(SVGNS, 'defs');
      host.appendChild(filterDefs);
      doc.body.appendChild(host);
    }
    const levels = '0 .14 .29 .43 .57 .71 .86 1';
    const f = doc.createElementNS(SVGNS, 'filter');
    f.id = id;
    f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML = `<feFlood x="${c / 4}" y="${c / 4}" width="${c / 2}" height="${c / 2}" flood-color="#000" result="dot"/>`
      + `<feComposite in="dot" x="0" y="0" width="${c}" height="${c}" result="cell"/><feTile in="cell" result="grid"/>`
      + `<feComposite in="SourceGraphic" in2="grid" operator="in" result="sample"/><feMorphology in="sample" operator="dilate" radius="${c / 2}" result="pix"/>`
      + `<feImage x="0" y="0" width="${c * 4}" height="${c * 4}" preserveAspectRatio="none" href="${BAYER_PNG}" result="bayer"/><feTile in="bayer" result="bayers"/>`
      + `<feComposite in="pix" in2="bayers" operator="arithmetic" k1="0" k2="1" k3="0.14" k4="-0.07" result="dith"/>`
      + `<feComponentTransfer in="dith"><feFuncR type="discrete" tableValues="${levels}"/><feFuncG type="discrete" tableValues="${levels}"/><feFuncB type="discrete" tableValues="${levels}"/><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>`;
    filterDefs.appendChild(f);
    made.add(id);
    return id;
  }
  // the cell, in the drawing's units, that comes out about CELL_PX on the screen
  function fitCell(g) {
    const svg = g.ownerSVGElement, vb = svg && svg.viewBox && svg.viewBox.baseVal;
    if (!vb || !vb.width) return;
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const ppu = Math.min(r.width / vb.width, r.height / vb.height), want = CELL_PX / ppu;
    const c = STEPS.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    const v = `url(#${cellFilter(c)})`;
    if (g.style.getPropertyValue('--psx-f') !== v) g.style.setProperty('--psx-f', v);
  }
  function pixelate(svg) {
    if (svg.dataset.psx) return;
    svg.dataset.psx = '1';
    const g = doc.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'psx-g');
    // the grid of the filter starts at the drawing's origin: an empty mark there keeps the origin inside the group's
    // box, so the first cell is never cut off (a drawing whose shapes all lie away from 0,0 would come out blank)
    const anchor = doc.createElementNS(SVGNS, 'rect');
    anchor.setAttribute('width', '1'); anchor.setAttribute('height', '1'); anchor.setAttribute('fill', 'none');
    g.appendChild(anchor);
    const labels = [];
    [...svg.children].forEach(n => {
      const tag = n.tagName.toLowerCase();
      if (tag === 'defs' || tag === 'title' || tag === 'desc' || tag === 'style') return;
      if (n.matches(KEEP) || n.querySelector('text')) labels.push(n); else g.appendChild(n);
    });
    svg.appendChild(g);
    labels.forEach(n => svg.appendChild(n));
    fitCell(g);
  }
  const pixelateIn = n => {
    if (n.nodeType !== 1) return;
    if (n.matches('svg.ill')) pixelate(n);
    else if (n.firstElementChild) n.querySelectorAll('svg.ill').forEach(pixelate);
  };
  const illWatch = new MutationObserver(list => { for (const m of list) m.addedNodes.forEach(pixelateIn); });
  // fitted again where something comes into view: a tab, a dive, a turned or resized screen
  let refitTimer = 0;
  const refit = (within = doc) => { clearTimeout(refitTimer); refitTimer = setTimeout(() => { $$('.psx-g', within.querySelectorAll ? within : doc).forEach(fitCell); }, 60); };
  const onToggle = e => { if (e.target.matches && e.target.matches('details')) refit(e.target); };
  const onPanel = () => refit();
  const onResize = () => refit();
  /* ------------------------------------------------------------------ */
  /* on and off: the crypt, the altars, the screen of the CRT             */
  /* ------------------------------------------------------------------ */
  let started = false;
  const mounted = [];
  function start() {
    if (!skinOn()) { stop(); return; }
    if (started) return;
    started = true;
    // a page shown in the sheet of another (?peek=1) is only its place: no crypt, no altar, the molecules as here
    if (!root.classList.contains('is-peek')) {
      mounted.push(crypt());
      $$('.ch-hero').forEach(h => { const v = h.closest('[data-view]'); mounted.push(altar(h, v && v.dataset.view)); });
      const art = $('.view-home .hero-art');
      if (art) mounted.push(altar(art, 'glavnaya'));
    }
    $$('svg.ill').forEach(pixelate);
    illWatch.observe(doc.body, { childList: true, subtree: true });
    doc.addEventListener('toggle', onToggle, true);
    doc.addEventListener('basil:panel', onPanel);
    addEventListener('resize', onResize);
    root.classList.add('psx-on');
    $$('[data-crt]').forEach(b => b.setAttribute('aria-checked', String(!root.classList.contains('no-crt'))));
  }
  function stop() {
    if (!started) return;
    started = false;
    mounted.splice(0).forEach(m => m.destroy());
    illWatch.disconnect();
    doc.removeEventListener('toggle', onToggle, true);
    doc.removeEventListener('basil:panel', onPanel);
    removeEventListener('resize', onResize);
    root.classList.remove('psx-on');
  }
  // the lines of the CRT and the darker edges: a switch in the footer, remembered in this browser
  doc.addEventListener('click', e => {
    const b = e.target.closest('[data-crt]');
    if (!b) return;
    const on = root.classList.toggle('no-crt') === false;
    b.setAttribute('aria-checked', String(on));
    try { localStorage.setItem('basil-crt', JSON.stringify(on)); } catch (err) { /* the switch still works for this visit */ }
  });
  doc.addEventListener('basil:theme', () => { if (skinOn()) start(); else stop(); });

  const api = { start, stop, drawMol, get on() { return skinOn(); } };

  return api;
})();
