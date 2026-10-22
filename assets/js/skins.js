/* Гид по базилику — оформления «Гримуар» и «Друид»: их сцены (склеп и лес за страницей, сцены в шапке глав и на главной, молекулы); страница грузит этот файл, только пока оформление включено. Файл собирает scripts/build.py из src/js/skins/ — правьте там */
window.BasilSkins = (() => {
  'use strict';
  /* ------------------------------------------------------------------ */
  /* the skins «Гримуар» and «Друид»: what every scene of them uses       */
  /* ------------------------------------------------------------------ */
  const doc = document, root = doc.documentElement;
  const $ = (s, r = doc) => r.querySelector(s), $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // the skin on the page (data-skin of <html>), if it is one of these
  const SKINS = ['grimoire', 'druid'];
  const skinNow = () => { const s = root.getAttribute('data-skin'); return SKINS.includes(s) ? s : null; };
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
  // one loop on the page's frame budget (scene.js): fps frames a second at most (lo on a touch screen or a page that
  // struggles), fewer when calm, none asleep; without scene.js — requestAnimationFrame at that pace
  function psxLoop(frame, fps = 30, lo = Math.min(fps, 20)) {
    const gate = SC && SC.gate ? SC.gate(fps, lo) : (() => { let p = 0; return ts => (ts - p >= 1000 / fps - 3 ? (p = ts, true) : false); })();
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
     dither between them — the console's look, nothing of it a shader. With smooth (the skin «Друид»): the canvas at
     the screen's own resolution (scale canvas pixels a CSS pixel), vertices where they fall, textures filtered, no
     dither — the same low polygons, lit and fogged, as a game of today draws them */
  class Raster {
    constructor(canvas, o) {
      Object.assign(this, { px: 3, maxW: 380, levels: 16, fog: [28, 17, 34], fogNear: 4, fogFar: 14, near: 0.2, amb: [0.16, 0.13, 0.2], key: null, lights: [], smooth: false, scale: 1, maxPx: 0 }, o);
      this.c = canvas;
      // the console's colour is cut down by reading the pixels back; a smooth picture is never read and stays on the GPU
      this.x = canvas.getContext('2d', this.smooth ? { alpha: false } : { willReadFrequently: true });
      this.W = this.H = 0;
      this.unit = 1;
    }
    // the canvas on the page: its CSS size divided into console pixels (3 px or more, at most maxW across), or, smooth,
    // scale canvas pixels a CSS pixel, but no more than maxPx in all (a wide head of a chapter is drawn a little under
    // the screen's resolution and drawn up smooth: the cost of a frame goes with its pixels). unit — the canvas pixels
    // of one console pixel (the size of a spark, a dot)
    size() {
      const cw = this.c.clientWidth || 300, ch = this.c.clientHeight || 200;
      if (this.smooth) {
        const s = this.maxPx ? Math.min(this.scale, Math.sqrt(this.maxPx / (cw * ch))) : this.scale;
        this.unit = 2.2 * s;
        return this.sizeTo(Math.round(cw * s), Math.round(ch * s));
      }
      const s = Math.max(this.px, cw / this.maxW);
      return this.sizeTo(Math.round(cw / s), Math.round(ch / s));
    }
    sizeTo(w, h) {
      this.W = Math.max(24, w); this.H = Math.max(20, h);
      if (this.c.width !== this.W || this.c.height !== this.H) { this.c.width = this.W; this.c.height = this.H; }
      this.x.imageSmoothingEnabled = this.smooth;
      return this;
    }
    cam(eye, target, focal, cx = 0.5, cy = 0.5) {
      const f = norm(sub(target, eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
      this.C = { eye, f, r, u, focal: focal * this.H, cx: cx * this.W, cy: cy * this.H };
      this.list = [];
    }
    view(p) { const C = this.C, d = sub(p, C.eye); return [dot(d, C.r), dot(d, C.u), dot(d, C.f)]; }
    proj(v) {
      const C = this.C, x = C.cx + v[0] * C.focal / v[2], y = C.cy - v[1] * C.focal / v[2];
      return this.smooth ? [x, y] : [Math.round(x), Math.round(y)];
    }
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
        // the inside of a hollow (a bowl, a well): its far wall is the one seen
        if (o.inv) n = mul(n, -1);
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
      const lay = o => (o.layer == null ? 1 : o.layer);
      this.list.sort((A, B) => lay(A.o) - lay(B.o) || B.z - A.z);
      for (const t of this.list) {
        const o = t.o, [a, b, c] = t.p;
        const f = o.nofog ? 0 : clamp((t.z - this.fogNear) / (this.fogFar - this.fogNear), 0, 1) ** 1.15;
        // the triangle grown by half a pixel: neighbours meet without cracks
        const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
        const g = q => { const dx = q[0] - cx, dy = q[1] - cy, L = Math.hypot(dx, dy) || 1; return [q[0] + dx / L * 0.6, q[1] + dy / L * 0.6]; };
        const A = g(a), B = g(b), C = g(c);
        if (o.tex) {
          // the texture's pixels onto the triangle: the affine map that takes its uv to the screen
          const w = o.tex.width, h = o.tex.height, uv = o.uv;
          const u0 = uv[0][0] * w, v0 = uv[0][1] * h, u1 = uv[1][0] * w, v1 = uv[1][1] * h, u2 = uv[2][0] * w, v2 = uv[2][1] * h;
          const det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
          if (det) {
            const ta = ((b[0] - a[0]) * (v2 - v0) - (c[0] - a[0]) * (v1 - v0)) / det, tb = ((b[1] - a[1]) * (v2 - v0) - (c[1] - a[1]) * (v1 - v0)) / det;
            const tc = ((c[0] - a[0]) * (u1 - u0) - (b[0] - a[0]) * (u2 - u0)) / det, td = ((c[1] - a[1]) * (u1 - u0) - (b[1] - a[1]) * (u2 - u0)) / det;
            const M = [ta, tb, tc, td, a[0] - ta * u0 - tc * v0, a[1] - tb * u0 - td * v0];
            // smooth: every texture lit and fogged ahead, in fine steps of light (a blend of multiplying over a large
            // face costs more than the rest of the frame where the canvas is drawn without the graphics card); the
            // console: only the cut-outs, the rest multiplied by its light here
            const ahead = this.smooth ? (o.cut || o.add == null) : o.cut;
            const src = ahead && (t.l || f > 0.01) ? shaded(o.tex, t.l, f, F, this.smooth ? 24 : 10) : o.tex;
            if (o.add != null) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = o.add; }
            x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.lineTo(C[0], C[1]); x.closePath();
            if (this.smooth) {
              // smooth: the triangle filled with its texture as a pattern laid onto it — no clip and no mask, many
              // times cheaper where the canvas is drawn without the graphics card
              const pat = src.psxPat || (src.psxPat = x.createPattern(src, 'repeat'));
              pat.setTransform(new DOMMatrix(M));
              x.fillStyle = pat;
              x.fill();
            } else {
              x.save();
              x.clip();
              x.setTransform(...M);
              x.drawImage(src, 0, 0);
              x.restore();
            }
            x.globalAlpha = 1;
            if (o.add == null && !ahead) {
              if (t.l) { x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${Math.min(255, t.l[0] * 255) | 0},${Math.min(255, t.l[1] * 255) | 0},${Math.min(255, t.l[2] * 255) | 0})`; x.fill(); }
              if (f > 0.01) { x.globalCompositeOperation = 'source-over'; x.fillStyle = `rgba(${F[0]},${F[1]},${F[2]},${f})`; x.fill(); }
            }
            x.globalCompositeOperation = 'source-over';
          }
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

  // a texture lit and fogged (a cut-out one — a leaf, a flame — keeps its outline), kept for the next triangle in the
  // same light: the light in k steps to one
  const SHADED = new Map();
  let texId = 0;
  function shaded(tx, l, f, F, k = 10) {
    const q = v => Math.round(Math.min(1.2, v) * k);
    if (!tx.psxId) tx.psxId = ++texId;
    const key = tx.psxId + ':' + k + ':' + (l ? l.map(q).join(',') : '-') + ',' + Math.round(f * 12);
    let c = SHADED.get(key);
    if (c) return c;
    if (SHADED.size > 900) SHADED.clear();
    c = doc.createElement('canvas');
    c.width = tx.width; c.height = tx.height;
    const x = c.getContext('2d');
    x.drawImage(tx, 0, 0);
    if (l) { x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${Math.min(255, q(l[0]) * 255 / k) | 0},${Math.min(255, q(l[1]) * 255 / k) | 0},${Math.min(255, q(l[2]) * 255 / k) | 0})`; x.fillRect(0, 0, c.width, c.height); }
    const ff = Math.round(f * 12) / 12;
    if (ff > 0) { x.globalCompositeOperation = 'source-over'; x.fillStyle = `rgba(${F[0]},${F[1]},${F[2]},${ff})`; x.fillRect(0, 0, c.width, c.height); }
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(tx, 0, 0);
    SHADED.set(key, c);
    return c;
  }

  // shapes: a quad (two triangles), a box, a prism (pot, candle), a low ball (an atom), an egg (a seed, a beetle),
  // a rod (a bond, a stem), a billboard; turned() — any of them turned about an axis
  function quad(R, a, b, c, d, o, u0 = 0, u1 = 1, v0 = 0, v1 = 1) {
    R.tri(a, b, c, { ...o, uv: [[u0, v1], [u1, v1], [u1, v0]] });
    R.tri(a, c, d, { ...o, uv: [[u0, v1], [u1, v0], [u0, v0]] });
  }
  function box(R, c, s, o) {
    const [x, y, z] = c, [a, b, d] = s;
    const v = [[x - a, y - b, z - d], [x + a, y - b, z - d], [x + a, y + b, z - d], [x - a, y + b, z - d], [x - a, y - b, z + d], [x + a, y - b, z + d], [x + a, y + b, z + d], [x - a, y + b, z + d]];
    [[0, 1, 2, 3, 1], [5, 4, 7, 6, 1], [4, 0, 3, 7, 0], [1, 5, 6, 2, 0], [3, 2, 6, 7, 0], [4, 5, 1, 0, 0]]
      // the front and the back (f[4]) carry texFront, read the right way round from their own side
      .forEach(f => quad(R, v[f[0]], v[f[1]], v[f[2]], v[f[3]], { ...o, tex: f[4] && o.texFront ? o.texFront : o.tex, ctr: c }, f[4] ? 1 : 0, f[4] ? 0 : 1));
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
  // eight faces instead of twenty (o.lo): a berry, a pebble, a pad of moss — small enough that nobody counts its faces
  const OCT = { v: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], f: [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [0, 4, 3], [4, 1, 3], [1, 5, 3], [5, 0, 3]] };
  function ball(R, c, r, o) { const M = o.lo ? OCT : ICO; M.f.forEach(([a, b, d]) => R.tri(add(c, mul(M.v[a], r)), add(c, mul(M.v[b], r)), add(c, mul(M.v[d], r)), { ...o, ctr: c })); }
  // a ball stretched along its own axes (r: three radii) and turned by yaw about the vertical
  function egg(R, c, r, yaw, o) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), M = o.lo ? OCT : ICO;
    const P = v => { const x = v[0] * r[0], z = v[2] * r[2]; return [c[0] + x * cy - z * sy, c[1] + v[1] * r[1], c[2] + x * sy + z * cy]; };
    M.f.forEach(([a, b, d]) => R.tri(P(M.v[a]), P(M.v[b]), P(M.v[d]), { ...o, ctr: c }));
  }
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
  // a stand-in for the rasterizer that turns every vertex about the axis ax through o first, then moves it by shift:
  // an hourglass turned over, a cut top falling, a page turned
  function turned(R, o, ax, ang, shift = [0, 0, 0]) {
    const k = norm(ax), c = Math.cos(ang), s = Math.sin(ang);
    const rot = v => add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
    const P = p => add(add(o, rot(sub(p, o))), shift);
    return { C: R.C, tri: (a, b, d, q) => R.tri(P(a), P(b), P(d), { ...q, ctr: q.ctr && P(q.ctr), axis: q.axis && [P(q.axis[0]), rot(q.axis[1])] }) };
  }
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
  // red — the colour of its lines, gold — of its runes
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
  // pal: the edge, the midrib, the veins, the blade; spots — the brown spots of a sick leaf with their yellow halo
  function leafTex(pal, spots, noise) {
    const [edgeC, midC, veinC, bladeC] = pal, R1 = rng(23);
    const dots = spots ? [...Array(5)].map(() => [8 + R1() * 16, 8 + R1() * 16, 1.4 + R1() * 1.6]) : [];
    return tex(32, 32, t => {
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const u = (x + 0.5) / 32, v = (y + 0.5) / 32;
        const s = v < 0.55 ? v / 0.55 * 0.5 : 0.5 + (v - 0.55) / 0.45 * 0.5;
        const hw = 0.5 * Math.pow(Math.sin(Math.PI * s), 0.7), du = Math.abs(u - 0.5);
        if (du > hw * 0.97) continue;
        const edge = hw - du < 0.05, mid = du < 0.035, vein = ((v + du * 1.2) * 6) % 1 < 0.14 && du < hw * 0.8;
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
  // a page of the grimoire: parchment, lines of writing, and a drawing — a leaf (right) or a circle of runes (left)
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

  /* The molecule viewer of the guide (MolViewer, science.js) draws through here while a skin is on (drawMol picks the
     skin's own way, MOLDRAW): the same molecule, turned the same way. In «Гримуар» rendered at a third of the size —
     atoms twenty flat faces, bonds four-sided rods, vertices snapped to the console's pixels — and drawn back up
     without smoothing */
  const MOLDRAW = {};
  function drawMol(ctx, mol, P, R3, W, H) { (MOLDRAW[skinNow()] || MOLDRAW.grimoire)(ctx, mol, P, R3, W, H); }
  const MOLBUF = new WeakMap();
  MOLDRAW.grimoire = function molCrypt(ctx, mol, P, R3, W, H) {
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
  };
  /* ------------------------------------------------------------------ */
  /* the stage at the head of every chapter and in the hero of the home  */
  /* page: the world of the skin around (05-grimoire.js, 06-druid.js) and */
  /* the chapter's own scene in the middle (05-grimoire-*.js,             */
  /* 06-druid-*.js)                                                       */
  /* ------------------------------------------------------------------ */
  /* A world is world(skin, { raster, textures(), key, sky, defaults, make(S, sc), post(R, t), overlay(holder, R) }):
     the options of its rasterizer, its textures, its key light, the three colours of its sky, what its scenes have
     unless they say otherwise, make — what stands round every scene of it ({ draw(t), lights(t), fx(t, F) }: a floor,
     candles, trees), post — what is done to the finished picture (the console's colours, a glow), overlay — what it
     lays over the canvas in the page (a layer of the glow, blended by the browser).
     A scene is scene(skin, view, S => ({ … })): S.R — the rasterizer, S.T — the textures, S.ang — where the camera
     stands (updated every frame). It gives draw(t) — its shapes at the time t, in seconds — and, if it needs them:
     tick(t) before anything is drawn (the state of the moment; the key light may be changed there), lights(t) — its
     point lights, fill — how strong the soft light from the camera's side is, fx(t, F) — sparks and halos over the
     picture (F.spark, F.halo, F.dot, F.streak), tap(t) — what a tap does; candles — its own candles; glow — the
     colour of the circle; glowAdd(t) — how bright it burns; look, rad, near — the camera (the point it looks at, how
     far it stands beside the text of a wide screen, how far in the middle of a narrow one); orbit [angle, swing] — a
     camera that swings in front of the scene instead of going round it; still — the moment shown when the reader asked
     for less motion; bare — it draws its whole world itself (the world's floor, its candles and the rest stay away);
     sky — its own three colours of the sky.
     The camera never goes all the way round: it swings slowly before the scene (orbit, by default [0.6, 0.35]), so that
     the whole picture never slides fast — at the frames a phone draws a fast slide judders */
  const WORLDS = {}, SCENES = {};
  const world = (skin, w) => { WORLDS[skin] = w; SCENES[skin] = SCENES[skin] || {}; };
  const scene = (skin, view, make) => { (SCENES[skin] = SCENES[skin] || {})[view] = make; };
  const smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  // a leaf of basil from its base B along F, its blade spread along S (across F when not given): four triangles of
  // the cut-out texture; o.w — how wide, o.curl — how much its tip bends down, o.flat — one colour instead of the
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
  // the bush: a stem and pairs of leaves, each pair a quarter turn from the one below. o: s — its size, tex — the
  // leaves (texAt(k) — of the k-th pair; flat — one colour), stem — its colour, lean [x, z] — where its top bends,
  // leaf — the leaves' length, w — their width, yaw — its turn, pairs — [height 0…1, length, pitch]. Gives the top
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

  // a sprout at the base b, grown g (0…1), of the size s: the hook, the two seed leaves opening, the first true pair,
  // the second
  function sprout(R, T, b, g, s, t) {
    if (g <= 0) return;
    const hook = 1 - smooth((g - 0.12) / 0.2), open = smooth((g - 0.3) / 0.2);
    const h = s * (0.06 + 0.28 * smooth(g / 0.45) + 0.24 * smooth((g - 0.5) / 0.5));
    const mid = [b[0], b[1] + h * 0.6, b[2]];
    // the hook: the top of the stem bent down, straightening as the seed leaves come out
    const bend = hook * 2.3, tip = add(mid, [Math.sin(bend) * h * 0.4, Math.cos(bend) * h * 0.4, 0]);
    rod(R, b, mid, 0.018 * s, { col: [150, 190, 96] });
    rod(R, mid, tip, 0.015 * s, { col: [150, 190, 96] });
    const sw = Math.sin(t * 1.4) * 0.06;
    for (let j = 0; j < 2; j++) {
      const yaw = j * Math.PI + 0.4 + sw, pitch = (1 - open) * 1.25 + hook * 1.6;
      const F = norm([Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch) * (hook > 0.5 ? -1 : 1), Math.sin(yaw) * Math.cos(pitch)]);
      leaf(R, tip, F, s * 0.12 * (0.5 + 0.5 * open), T.leafLemon, { w: 0.55, curl: 0 });
    }
    // the true leaves: the first pair across the seed leaves, the second across the first
    [[0.5, 0.2, 0], [0.78, 0.15, Math.PI / 2]].forEach(([g0, len, turn]) => {
      const k = smooth((g - g0) / 0.2);
      if (k <= 0) return;
      for (let j = 0; j < 2; j++) {
        const yaw = turn + j * Math.PI + 0.4 + Math.PI / 2 + sw;
        leaf(R, tip, norm([Math.cos(yaw), 0.35, Math.sin(yaw)]), s * len * k, T.leaf, { w: 0.4 });
      }
    });
  }

  // a molecule of the aroma, small and glowing: its atoms at the centre c, turned by yaw; a — how much of it is seen;
  // pal — its colours (the bonds, oxygen, carbon) and lo — atoms of eight faces: violet in «Гримуар», berries and twigs
  // in «Друид»
  const ESSENCE = { bond: [170, 120, 230], O: [240, 70, 60], C: [214, 190, 255] };
  function essence(R, mol, c, yaw, k = 1, a = null, pal = ESSENCE) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const MP = mol.P.map(p => { const q = [p[0] * ca + p[2] * sa, p[1], -p[0] * sa + p[2] * ca]; return [c[0] + q[0] * 0.15 * k, c[1] + q[1] * 0.135 * k + q[2] * 0.03 * k, c[2] + q[2] * 0.15 * k]; });
    mol.bonds.forEach(([i, j]) => rod(R, MP[i], MP[j], 0.012 * k, { col: pal.bond, emis: true, add: a }, 3));
    mol.atoms.split('').forEach((el, i) => ball(R, MP[i], (el === 'O' ? 0.06 : 0.045) * k, { col: el === 'O' ? pal.O : pal.C, emis: true, add: a, lo: pal.lo }));
  }

  // a value that goes over to each new target smoothly, starting slowly and stopping slowly (an easing by a part of the
  // way left each frame starts with its biggest step — a jerk): glide(target, t) gives where it is at the time t. A target
  // more than two steps away (many taps at once) is reached by its last step only, never spun through in a moment
  function glider(dur = 0.9) {
    let from = null, to = null, since = 0;
    return (target, t) => {
      if (to == null) { from = to = target; since = t; }
      if (target !== to) {
        from += (to - from) * smooth((t - since) / dur);
        if (Math.abs(target - from) > 2) from = target - Math.sign(target - from);
        to = target; since = t;
      }
      return reduce.matches ? to : from + (to - from) * smooth((t - since) / dur);
    };
  }

  // sparks and halos over the finished picture, in the raster's own pixels: square on the console, round when smooth
  function fxKit(R) {
    const x = R.x, u = R.unit, round = R.smooth;
    const put = (p, s, col) => {
      x.fillStyle = col;
      if (round) { x.beginPath(); x.arc(p[0], p[1], s * 0.5, 0, Math.PI * 2); x.fill(); } else x.fillRect(p[0], p[1], s, s);
    };
    return {
      halo(p3, r3, c0, c1) {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), r = R.C.focal * r3 / v[2], g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
        g.addColorStop(0, c0); g.addColorStop(1, c1);
        x.fillStyle = g; x.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
      },
      // a spark of fire (life 0…1 fades it)
      spark(p3, life, big) {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        put(R.proj(v), (big || v[2] < 4 ? 2 : 1) * u, `rgba(255,${150 + (life * 60) | 0},70,${(1 - life) * 0.9})`);
      },
      // a dot of any colour
      dot(p3, col, size = 0) {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        put(R.proj(v), (size || (v[2] < 4 ? 2 : 1)) * u, col);
      },
      // a streak: a drop falling
      streak(p3, len, col) {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), l = Math.max(2 * u, R.C.focal * len / v[2]);
        x.fillStyle = col;
        x.fillRect(p[0], p[1], Math.max(1, u * 0.7), l);
      }
    };
  }

  // backdrop: the scene as a background of its block (the home page) — no finger turns it, no tap; it goes on by itself
  function stage(host, view, skin, backdrop = false) {
    const W = WORLDS[skin], set = SCENES[skin];
    const holder = doc.createElement('div');
    holder.className = 'psx-stage' + (backdrop ? ' is-backdrop' : '');
    holder.dataset.scene = set[view] ? view : 'glavnaya';
    holder.dataset.skin = skin;
    holder.setAttribute('aria-hidden', 'true');
    // the home's scene is the ground under the words, like the paper of a picture (tests/overlap.js lets text lie on it)
    if (backdrop) holder.dataset.bg = '';
    const cv = doc.createElement('canvas');
    holder.appendChild(cv);
    host.insertBefore(holder, host.firstChild);
    const T = W.textures();
    const R = new Raster(cv, W.raster());
    // what the world lays over its canvas (a glow the page itself adds over it)
    if (W.overlay) W.overlay(holder, R);
    const S = { R, T, view, ang: 0.6 };
    const sc = { still: 0, look: [0, 1.45, 0], rad: 5.6, near: 5.6, fill: 0.6, orbit: [0.6, 0.35], ...W.defaults, ...(set[view] || set.glavnaya)(S) };
    const env = W.make(S, sc);
    // the reader turns the scene with a finger or the mouse; a tap does what the scene does (a puff of sparks by default)
    const ptr = { turn: 0, lift: 0, drag: null, puffs: [] };
    // the scene's own clock: it goes on by the frames drawn, a long frame or a pause (off the screen, asleep, another
    // tab) counts as a tenth of a second at most — the picture never jumps ahead when it wakes
    let now0 = null, time = 0;
    const tick = now => { if (now0 != null) time += clamp((now - now0) / 1000, 0, 0.1); now0 = now; return time; };
    const clock = () => (reduce.matches ? sc.still : time);
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
    if (!backdrop) {
      holder.addEventListener('pointerdown', onDown);
      addEventListener('pointermove', onMove, { passive: true });
      addEventListener('pointerup', onUp);
      addEventListener('pointercancel', onUp);
    }
    function frame(now) {
      // the clock of the scene: stands at its chosen moment when the reader asked for less motion
      const t = reduce.matches ? sc.still : tick(now);
      R.size();
      // wide: the chapter's text on the left, the scene to the right of it; else the scene in the middle, closer
      const wide = R.W > R.H * 1.45;
      const ang = sc.orbit[0] + Math.sin(t * 0.13) * sc.orbit[1] + ptr.turn;
      const look = sc.look, eyeY = look[1] + 1.1 + Math.sin(t * 0.3) * 0.15 + ptr.lift;
      const rad = wide ? sc.rad : sc.near;
      S.ang = ang;
      R.cam([look[0] + Math.cos(ang) * rad, eyeY, look[2] + Math.sin(ang) * rad], look, wide ? 1.25 : 1.05, wide ? 0.68 : 0.5, wide ? 0.44 : 0.4);
      R.key = W.key;
      if (sc.tick) sc.tick(t);
      R.lights = env.lights(t)
        .concat(sc.fill ? [{ p: [look[0] + Math.cos(ang) * 2.2, look[1] + 1.5, look[2] + Math.sin(ang) * 2.2], col: W.fillCol || [0.78, 0.62, 0.95], i: sc.fill, fall: 0.16 }] : [], sc.lights ? sc.lights(t) : []);
      const x = R.x, g = x.createLinearGradient(0, 0, 0, R.H), sky = sc.sky || W.sky;
      g.addColorStop(0, sky[0]); g.addColorStop(0.55, sky[1]); g.addColorStop(1, sky[2]);
      x.fillStyle = g; x.fillRect(0, 0, R.W, R.H);
      if (env.back) env.back(t, x);
      // a floor the world lays straight on the canvas, under every shape (a plane drawn row by row, true in perspective)
      if (env.floor) env.floor(t, x);
      env.draw(t);
      sc.draw(t);
      R.draw();
      // the halos and sparks, added before the picture is finished (the console's dither turns them into rings)
      x.globalCompositeOperation = 'lighter';
      const F = fxKit(R);
      env.fx(t, F);
      if (sc.fx) sc.fx(t, F);
      ptr.puffs = ptr.puffs.filter(p => t - p.t < 2.2 && t >= p.t);
      ptr.puffs.forEach(p => {
        const life = (t - p.t) / 2.2;
        for (let i = 0; i < 18; i++) {
          const q = i / 18 * Math.PI * 2, r = 0.2 + life * 0.9;
          F.spark([Math.cos(q) * r * 0.6, 2.1 + life * 1.3 + Math.sin(i * 7) * 0.1, Math.sin(q) * r * 0.6], life, true);
        }
      });
      x.globalCompositeOperation = 'source-over';
      W.post(R, t);
      holder.classList.add('is-drawn');
    }
    // runs while on the screen, by the page's frame budget; one still frame with reduced motion
    let seen = false;
    // as many frames on a phone as anywhere: at 20 the scenes judder
    const L = psxLoop(ts => { if (!seen || doc.hidden) { L.stop(); return; } frame(ts); if (reduce.matches && !ptr.drag) L.stop(); }, W.fps || 30, W.fps || 30);
    // a check that draws the scene frame by frame itself (tests/motion.js) sets window.BASIL_STAGES = [] before the page;
    // seek sets the scene's clock, a minute into the page in a moment
    if (Array.isArray(window.BASIL_STAGES)) window.BASIL_STAGES.push({ frame, R, stop: () => L.stop(), seek: s => { time = s; now0 = null; } });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { seen = es.some(e => e.isIntersecting); if (seen) L.start(); else L.stop(); }) : null;
    if (io) io.observe(holder); else { seen = true; L.start(); }
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
        holder.remove();
      }
    };
  }
  // Прищипка и сбор: a pot on an old stump, the top of the stem growing; a sickle circling it like a crescent moon
  // comes down and cuts the top above a pair of leaves; the top falls to the floor, and two new shoots come out of that
  // pair, so the bush grows wide instead of tall; then time goes back in a violet shimmer and it begins again. A tap
  // swings the sickle
  scene('grimoire', 'formirovka', S => {
    const { R, T } = S, CYCLE = 12, SW = 4.6, s = 1.15;
    let off = 0, cut = [0, 2.1, 0], sick = [1, 2.5, 0], tip = null, phase = 0;
    // the moment of the cycle: the sickle cuts at SW; a tap, once the top has grown, moves the cycle to the swing
    const at = t => (((t + off) % CYCLE) + CYCLE) % CYCLE;
    // the main stem: three nodes with their pairs, the cut above the third
    const NODES = [[0.2, 0.42, 0.12], [0.42, 0.36, 0], [0.62, 0.3, -0.12]];
    const pairAt = (b, h, len, pitch, k, t, g = 1) => {
      for (let j = 0; j < 2; j++) {
        const yaw = k * Math.PI / 2 + j * Math.PI + 0.3 + Math.sin(t * 1.3 + k + j) * 0.05;
        leaf(R, [b[0], b[1] + h, b[2]], norm([Math.cos(yaw) * Math.cos(pitch), -Math.sin(pitch) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pitch)]), len * s * g, T.leaf);
      }
    };
    // the top above the cut: a stem and two pairs, grown g
    const topShoot = (R2, c, g, t) => {
      if (g <= 0) return;
      const h = 0.34 * s * g;
      rod(R2, c, [c[0], c[1] + h, c[2]], 0.02 * s, { col: [86, 146, 56] });
      [[0.45, 0.26, -0.15, 3], [0.95, 0.16, -0.6, 4]].forEach(([f, len, pitch, k]) => {
        for (let j = 0; j < 2; j++) {
          const yaw = k * Math.PI / 2 + j * Math.PI + 0.3 + Math.sin(t * 1.3 + k + j) * 0.05;
          leaf(R2, [c[0], c[1] + h * f, c[2]], norm([Math.cos(yaw) * Math.cos(pitch), -Math.sin(pitch) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pitch)]), len * s * g, T.leaf);
        }
      });
    };
    return {
      glow: [176, 192, 255], near: 4.4, look: [0, 1.6, 0], still: 7.5,
      tap(t) { const u = at(t); if (u > 1.5 && u < SW - 0.6) off += SW - 0.6 - u; },
      tick(t) {
        const u = at(t);
        phase = u;
        // the sickle: round the altar, then down through the stem and away
        const idle = [Math.cos(t * 0.6) * 1.05, 2.55 + Math.sin(t * 1.1) * 0.08, Math.sin(t * 0.6) * 1.05];
        const w = smooth((u - SW + 0.9) / 0.6) * (1 - smooth((u - SW - 0.3) / 0.8)), k = smooth((u - SW + 0.3) / 0.6);
        const A = add(cut, [-0.5, 0.12, 0.05]), B = add(cut, [0.5, 0.02, -0.05]);
        sick = mix3(idle, mix3(A, B, k), w);
        // it turns as it circles and turns to its cut during the swing: to the whole turn nearest to where it stood when the
        // swing began (a turn by t·(1 − w) would spin it round dozens of times in the swing, a minute into the page)
        const turns = Math.round((t - u + SW - 0.9) * 1.4 / (Math.PI * 2)) * Math.PI * 2;
        tip = { w, spin: t * 1.4 * (1 - w) + turns * w };
      },
      lights() { return [{ p: add(sick, [0, 0.25, 0.2]), col: [0.75, 0.8, 1], i: 1.1, fall: 0.5 }]; },
      draw(t) {
        // a stump with its rings, the pot on it
        const top = 0.92;
        prism(R, 0, 0, 0, top, 0.66, 0.56, 9, { col: [86, 58, 40] });
        disc(R, 0, 0, top, 0.56, 9, { col: [176, 136, 92] });
        [0.18, 0.34, 0.48].forEach(r => ringTop(R, 0, 0, top + 0.002, r, r + 0.025, 9, { col: [128, 92, 60] }));
        [0, 1, 2, 3].forEach(i => { const q = i * 1.6 + 0.4; prism(R, Math.cos(q) * 0.6, Math.sin(q) * 0.6, 0, 0.14, 0.12, 0.05, 5, { col: [80, 54, 38] }); });
        const earth = pot(R, T, 0, 0, top), b = [0, earth, 0], u = phase;
        const H = 0.62 * 0.85 * s;
        cut = [0, earth + H + 0.02, 0];
        rod(R, b, cut, 0.03 * s, { col: [70, 128, 48] });
        NODES.forEach(([f, len, pitch], k) => pairAt(b, 0.85 * s * f, len, pitch, k, t));
        // the top: growing before the cut, falling after it, lying on the floor till time turns back
        if (u < SW) topShoot(R, cut, smooth(u / (SW - 0.8)), t);
        else if (u < 10.6) {
          const f = smooth((u - SW) / 1.6), land = [0.9, 0.06, 0.35];
          topShoot(turned(R, add(cut, [0, 0.15, 0]), [0.3, 0, 1], -f * 1.45, mul(sub(land, cut), f)), cut, 1, t);
        }
        // the two new shoots from the axils of the last pair
        const gs = u < SW ? 0 : u < 10.6 ? smooth((u - SW - 0.4) / 3.2) : 1 - smooth((u - 10.6) / 1.2);
        if (gs > 0) for (let j = 0; j < 2; j++) {
          const yaw = 2 * Math.PI / 2 + j * Math.PI + 0.3, d = norm([Math.cos(yaw) * 0.6, 0.8, Math.sin(yaw) * 0.6]);
          const base = [0, earth + 0.85 * s * 0.62, 0], end = add(base, mul(d, 0.34 * s * gs));
          rod(R, base, end, 0.018 * s, { col: [92, 150, 60] });
          for (let i = 0; i < 2; i++) {
            const q = yaw + Math.PI / 2 + i * Math.PI;
            leaf(R, end, norm([Math.cos(q), 0.25, Math.sin(q)]), 0.22 * s * gs, T.leaf);
          }
          leaf(R, end, norm(add(d, [0, 0.4, 0])), 0.12 * s * gs, T.leafLemon, { w: 0.4 });
        }
        // the sickle: a crescent of iron and its haft
        const q = tip.spin, U = [Math.cos(q), 0, Math.sin(q)], V = norm(mix3([0, 1, 0], [-Math.sin(q), 0, Math.cos(q)], tip.w * 0.85));
        const P = (a, r, off) => add(add(sick, mul(U, Math.cos(a) * r + off)), mul(V, Math.sin(a) * r));
        for (let i = 0; i < 9; i++) {
          const a0 = -0.4 + i / 9 * 2.9, a1 = -0.4 + (i + 1) / 9 * 2.9;
          quad(R, P(a0, 0.4, 0), P(a1, 0.4, 0), P(a1, 0.32, 0.09), P(a0, 0.32, 0.09), { col: [206, 208, 228], ds: true });
          // the edge: a line of cold light
          rod(R, P(a0, 0.4, 0), P(a1, 0.4, 0), 0.012, { col: [236, 240, 255], emis: true, nofog: true }, 3);
        }
        const end = P(2.5, 0.36, 0.045);
        rod(R, end, add(end, mul(norm(sub(end, P(2.3, 0.36, 0.045))), 0.3)), 0.032, { col: [120, 76, 42] });
      },
      fx(t, F) {
        const u = phase;
        F.halo(sick, 0.55, 'rgba(190,200,255,.3)', 'rgba(190,200,255,0)');
        // the cut: sap and bits of leaf flying
        if (u > SW - 0.05 && u < SW + 0.7) for (let i = 0; i < 14; i++) {
          const l = (u - SW + 0.05) / 0.75, q = i * 0.45;
          F.dot([cut[0] + Math.cos(q) * l * 0.5, cut[1] + Math.sin(i * 1.7) * l * 0.3 + l * 0.1, cut[2] + Math.sin(q) * l * 0.4], `rgba(170,230,110,${1 - l})`, 2);
        }
        // time going back
        if (u > 10.5) for (let i = 0; i < 22; i++) { const l = (u - 10.5) / 1.5, q = i * 0.9 + t * 2; F.dot([Math.cos(q) * (0.3 + l * 0.4), cut[1] - 0.3 + (i % 7) * 0.1, Math.sin(q) * (0.3 + l * 0.4)], `rgba(200,150,255,${0.9 * Math.sin(l * Math.PI)})`, 2); }
      }
    };
  });
  // Гидропоника: a glass tank of water with a cold light in it, the bush in a net cup on its lid, white roots hanging
  // down into the water and swaying like weed, bubbles rising from the stone of the air pump. A tap lets out a burst
  // of bubbles
  scene('grimoire', 'gidro', S => {
    const { R, T } = S, TOP = 0.92, LID = 1.12;
    const ROOTS = [...Array(9)].map((_, i) => ({ q: i / 9 * Math.PI * 2 + 0.3, r: 0.03 + (i % 3) * 0.035, len: 0.55 + ((i * 7) % 5) / 14, ph: i * 1.3 }));
    const BUB = [...Array(22)].map((_, i) => ({ a: (i * 0.618) % 1, s: 0.35 + (i % 5) / 9, dx: ((i * 37) % 11 - 5) / 70, dz: ((i * 23) % 11 - 5) / 90 }));
    let bursts = [];
    const glass = { col: [70, 110, 130], emis: true, nofog: true, add: 0.12, layer: 2 };
    return {
      glow: [70, 200, 255], near: 4.2, look: [0, 1.15, 0], still: 3,
      tap(t) { bursts.push(t); if (bursts.length > 3) bursts.shift(); },
      lights(t) { return [{ p: [0, 0.5, 0.1], col: [0.3, 0.8, 1], i: 1 + 0.15 * Math.sin(t * 2.1), fall: 0.7 }]; },
      draw(t) {
        // the water: its far walls first, then its near ones and its surface, light added to what is behind
        box(R, [0, TOP / 2 + 0.01, 0], [0.6, TOP / 2, 0.4], { col: [24, 90, 130], emis: true, nofog: true, add: 0.3, inv: true, layer: 2 });
        box(R, [0, TOP / 2 + 0.01, 0], [0.6, TOP / 2, 0.4], { col: [30, 110, 150], emis: true, nofog: true, add: 0.26, layer: 2 });
        box(R, [0, 0.55, 0], [0.63, 0.55, 0.43], glass);
        // the frame of the tank: its twelve edges
        const X = 0.63, Y = 1.1, Z = 0.43, E = { col: [150, 170, 180] };
        [[-X, -Z], [X, -Z], [X, Z], [-X, Z]].forEach(([x, z]) => rod(R, [x, 0, z], [x, Y, z], 0.014, E, 3));
        [0, Y].forEach(y => { rod(R, [-X, y, -Z], [X, y, -Z], 0.014, E, 3); rod(R, [-X, y, Z], [X, y, Z], 0.014, E, 3); rod(R, [-X, y, -Z], [-X, y, Z], 0.014, E, 3); rod(R, [X, y, -Z], [X, y, Z], 0.014, E, 3); });
        // the lid, the net cup with its clay pebbles, the bush
        box(R, [0, LID, 0], [0.66, 0.025, 0.46], { col: [44, 40, 52] });
        prism(R, 0, 0, LID - 0.2, LID + 0.06, 0.13, 0.17, 8, { col: [64, 62, 72] }, [150, 92, 60]);
        bush(R, T, [0, LID + 0.06, 0], t, { s: 1.1 });
        // the roots: white threads from the cup into the water, swaying
        ROOTS.forEach(r => {
          let p = [Math.cos(r.q) * r.r, LID - 0.2, Math.sin(r.q) * r.r];
          for (let j = 1; j <= 6; j++) {
            const f = j / 6, sw = Math.sin(t * 0.9 + r.ph + j * 0.7) * 0.045 * f;
            const q = [Math.cos(r.q) * (r.r + f * 0.16) + sw, LID - 0.2 - f * r.len, Math.sin(r.q) * (r.r + f * 0.12) + Math.cos(t * 0.7 + r.ph + j) * 0.03 * f];
            rod(R, p, q, 0.014 * (1.2 - f * 0.6), { col: [226, 216, 190] }, 3);
            p = q;
          }
        });
        // the air stone and its tube out to the pump on the floor
        box(R, [0.32, 0.04, 0.1], [0.07, 0.03, 0.05], { col: [110, 104, 116] });
        rod(R, [0.38, 0.05, 0.1], [0.58, 0.05, 0.1], 0.012, { col: [60, 140, 120] }, 3);
        rod(R, [0.58, 0.05, 0.1], [0.58, 1.16, 0.1], 0.012, { col: [60, 140, 120] }, 3);
        rod(R, [0.58, 1.16, 0.1], [1.05, 0.14, 0.4], 0.012, { col: [60, 140, 120] }, 3);
        box(R, [1.05, 0.1, 0.4], [0.16, 0.1, 0.1], { col: [56, 52, 66] });
      },
      fx(t, F) {
        const up = (b, k, x0) => [x0 + b.dx * (1 + Math.sin(t * 3 + b.a * 9)), 0.08 + k * (TOP - 0.12), 0.1 + b.dz];
        BUB.forEach(b => { const k = (b.a + t * b.s * 0.4) % 1; F.dot(up(b, k, 0.32), `rgba(210,245,255,${0.4 + 0.5 * k})`); });
        bursts = bursts.filter(s => t - s < 2.2 && t >= s);
        bursts.forEach(s => {
          for (let i = 0; i < 26; i++) {
            const k = (t - s) / 2 - (i % 8) * 0.04;
            if (k <= 0 || k >= 1) continue;
            F.dot([((i * 0.37) % 1 - 0.5) * 0.9, 0.1 + k * (TOP - 0.15), ((i * 0.61) % 1 - 0.5) * 0.5], 'rgba(230,250,255,.9)', 2);
          }
        });
        // the shimmer of the surface
        for (let i = 0; i < 10; i++) F.dot([Math.sin(i * 1.7 + t * 0.8) * 0.5, TOP, Math.cos(i * 2.3 + t * 0.6) * 0.32], 'rgba(170,230,255,.55)');
      }
    };
  });
  // Главная: плантация алхимика — грядки в каменных рамах под железными арками оранжереи, на ближних кустах —
  // стеклянные колпаки; в конце дорожки перегонный куб на печи, змеевик, приёмник с зелёным эликсиром. По медной трубе
  // от приёмника к грядкам бежит капля, и куст, к которому она пришла, вспыхивает. Над грядками висят знаки алхимии.
  // Круга, свечей и колонн нет: главная не похожа на главы. Касание — капля сейчас
  scene('grimoire', 'glavnaya', S => {
    const { R, T } = S;
    R.fog = [14, 10, 20]; R.fogNear = 3.5; R.fogFar = 12; R.amb = [0.22, 0.18, 0.28];
    const BEDS = [];
    for (const z of [1.45, 0.1, -1.25]) for (const x of [-1.1, 1.1]) BEDS.push({ x, z });
    const ARCH = [-2.05, -0.7, 0.65, 2.0];
    const GLYPH = [0, 1, 2, 3, 4, 5].map(k => glyphTex(k, [236, 196, 96]));
    const SMALLP = [[0.22, 0.4, 0.1], [0.5, 0.32, -0.05], [0.78, 0.22, -0.35], [0.95, 0.13, -0.6]];
    const FLASK = [0.98, 0.14, -1.9], EVERY = 1.5, RUN = 1.7;
    let taps = [], glow = BEDS.map(() => 0), drop = null, lastT = 0;
    // the way of a drop: from the receiver along the edge of the path to its bed, then into the earth
    const route = i => {
      const b = BEDS[i], ex = b.x < 0 ? -0.56 : 0.56;
      return [FLASK, [ex, 0.08, -1.9], [ex, 0.08, b.z], [b.x * 0.75, 0.3, b.z]];
    };
    const along = (pts, u) => {
      const L = pts.slice(1).map((p, k) => Math.hypot(...sub(p, pts[k]))), tot = L.reduce((a, b) => a + b, 0);
      let d = u * tot;
      for (let k = 0; k < L.length; k++) { if (d <= L[k]) return add(pts[k], mul(sub(pts[k + 1], pts[k]), d / L[k])); d -= L[k]; }
      return pts[pts.length - 1];
    };
    return {
      bare: true, fill: 0.8, orbit: [Math.PI / 2, 0.3], rad: 5.6, near: 5.2, look: [0, 0.75, -0.3], still: 2.2,
      sky: ['#05040A', '#120E1C', '#0C0912'],
      tap(t) { taps.push(t); if (taps.length > 4) taps.shift(); },
      tick(t) {
        const dt = Math.max(0, Math.min(0.2, t - lastT)); lastT = t;
        const n = Math.floor(t / EVERY), sends = [n * EVERY].concat(taps).filter(s => s <= t);
        drop = null;
        for (const s of sends) {
          const u = (t - s) / RUN, i = (taps.includes(s) ? taps.indexOf(s) * 5 + 3 + n : Math.round(s / EVERY)) % BEDS.length;
          if (u < 1 && !drop) drop = { p: along(route(i), smooth(u)), i };
          if (u >= 1 && u < 1 + dt / RUN + 0.02) glow[i] = 1;
        }
        glow = glow.map(g => (reduce.matches ? g : Math.max(0, g - dt * 0.9)));
        R.key = { dir: norm([0.2, 1, 0.4]), i: 0.5, col: [0.6, 0.65, 1] };
      },
      lights(t) {
        const L = [{ p: [0, 0.45, -1.85], col: [1, 0.55, 0.22], i: 1.3 + 0.2 * Math.sin(t * 9), fall: 0.5 }, { p: add(FLASK, [0, 0.25, 0]), col: [0.45, 1, 0.4], i: 0.9, fall: 1 }];
        if (drop) L.push({ p: drop.p, col: [0.5, 1, 0.4], i: 0.9, fall: 2 });
        glow.map((g, i) => [g, i]).sort((a, b) => b[0] - a[0]).slice(0, 2).forEach(([g, i]) => { if (g > 0.05) L.push({ p: [BEDS[i].x, 0.9, BEDS[i].z], col: [0.5, 1, 0.45], i: 1.4 * g, fall: 1.2 }); });
        return L;
      },
      draw(t) {
        // the ground of the greenhouse and its path of flags
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
          const x0 = -4 + i, z0 = -4 + j, v = ((i * 7 + j * 3) % 5) * 2;
          quad(R, [x0, 0, z0 + 1], [x0 + 1, 0, z0 + 1], [x0 + 1, 0, z0], [x0, 0, z0], { col: [30 + v, 22 + v, 26 + v], layer: 0, ds: true });
        }
        for (let k = 0; k < 6; k++) { const z0 = -2.2 + k * 0.82; quad(R, [-0.38, 0.004, z0 + 0.76], [0.38, 0.004, z0 + 0.76], [0.38, 0.004, z0], [-0.38, 0.004, z0], { tex: T.stone, layer: 0.5, ds: true }); }
        // the beds: a frame of stone, earth, two bushes each; the near ones under bell jars
        BEDS.forEach((b, i) => {
          box(R, [b.x, 0.14, b.z], [0.46, 0.14, 0.58], { tex: T.stone });
          quad(R, [b.x - 0.4, 0.285, b.z + 0.52], [b.x + 0.4, 0.285, b.z + 0.52], [b.x + 0.4, 0.285, b.z - 0.52], [b.x - 0.4, 0.285, b.z - 0.52], { tex: T.soil, ds: true });
          const far = b.z < -0.5;
          [-0.24, 0.24].forEach((dz, j) => {
            const base = [b.x, 0.285, b.z + dz];
            bush(R, T, base, t + i * 1.7 + j, { s: 0.62, pairs: SMALLP, flat: far ? [70, 128, 50] : null, yaw: i + j });
            if (b.z > 1) egg(R, add(base, [0, 0.3, 0]), [0.24, 0.36, 0.24], 0, { col: [120, 150, 170], emis: true, nofog: true, add: 0.12 });
          });
          // the sign over the bed
          billboard(R, [b.x, 1.55 + Math.sin(t * 1.2 + i) * 0.06, b.z], 0.1, 0.1, { tex: GLYPH[i], emis: true, nofog: true, cut: true });
        });
        // the iron arches of the greenhouse, their ridge, a little glass between them
        const arcP = (z, a) => [Math.cos(a) * 2.25, Math.sin(a) * 2.25, z];
        ARCH.forEach(z => { for (let k = 0; k < 8; k++) rod(R, arcP(z, k / 8 * Math.PI), arcP(z, (k + 1) / 8 * Math.PI), 0.03, { col: [58, 52, 70] }, 3); });
        [2, 4, 6].forEach(k => rod(R, arcP(ARCH[0], k / 8 * Math.PI), arcP(ARCH[3], k / 8 * Math.PI), 0.022, { col: [58, 52, 70] }, 3));
        for (let g = 0; g < 3; g++) for (let k = 1; k < 7; k++) quad(R, arcP(ARCH[g], k / 8 * Math.PI), arcP(ARCH[g + 1], k / 8 * Math.PI), arcP(ARCH[g + 1], (k + 1) / 8 * Math.PI), arcP(ARCH[g], (k + 1) / 8 * Math.PI), { col: [70, 90, 120], emis: true, nofog: true, add: 0.035, ds: true });
        // the still: a furnace with its fire, a copper pot, the swan's neck, the coil, the receiver
        box(R, [0, 0.32, -2.3], [0.42, 0.32, 0.4], { tex: T.stone });
        const fl = 0.8 + 0.2 * Math.sin(t * 13);
        quad(R, [-0.16, 0.06, -1.895], [0.16, 0.06, -1.895], [0.16, 0.34, -1.895], [-0.16, 0.34, -1.895], { col: [255, 130 * fl + 40, 40], emis: true, nofog: true });
        ball(R, [0, 0.95, -2.3], 0.36, { col: [196, 118, 64] });
        prism(R, 0, -2.3, 1.22, 1.62, 0.11, 0.05, 6, { col: [196, 118, 64] });
        rod(R, [0, 1.62, -2.3], [0.35, 1.72, -2.3], 0.035, { col: [196, 118, 64] }, 4);
        rod(R, [0.35, 1.72, -2.3], [0.92, 1.05, -2.3], 0.03, { col: [196, 118, 64] }, 4);
        prism(R, 0.98, -2.3, 0, 0.78, 0.22, 0.24, 8, { col: [112, 72, 44] }, [70, 46, 30]);
        for (let k = 0; k < 16; k++) { const a0 = k * 0.9, a1 = (k + 1) * 0.9, y0 = 1.02 - k * 0.045, y1 = y0 - 0.045; rod(R, [0.98 + Math.cos(a0) * 0.27, y0, -2.3 + Math.sin(a0) * 0.27], [0.98 + Math.cos(a1) * 0.27, y1, -2.3 + Math.sin(a1) * 0.27], 0.018, { col: [206, 128, 70] }, 3); }
        rod(R, [0.98, 0.3, -2.05], add(FLASK, [0, 0.14, 0]), 0.016, { col: [206, 128, 70] }, 3);
        ball(R, FLASK, 0.09, { col: [120, 255, 110], emis: true, nofog: true });
        ball(R, FLASK, 0.13, { col: [120, 150, 170], emis: true, nofog: true, add: 0.2 });
        // the pipe along the path, both sides
        [-0.56, 0.56].forEach(x => rod(R, [x, 0.08, -1.9], [x, 0.08, 1.9], 0.02, { col: [176, 104, 56] }, 3));
        if (drop) ball(R, drop.p, 0.04, { col: [150, 255, 120], emis: true, nofog: true });
      },
      fx(t, F) {
        F.halo([0, 0.25, -1.88], 0.5, 'rgba(255,140,50,.32)', 'rgba(255,120,40,0)');
        F.halo(FLASK, 0.35, 'rgba(120,255,110,.35)', 'rgba(120,255,110,0)');
        if (drop) F.halo(drop.p, 0.22, 'rgba(150,255,120,.5)', 'rgba(150,255,120,0)');
        BEDS.forEach((b, i) => {
          F.halo([b.x, 1.55, b.z], 0.2, 'rgba(255,210,110,.25)', 'rgba(255,210,110,0)');
          if (glow[i] > 0.05) for (let k = 0; k < 8; k++) { const l = (k / 8 + t * 0.6) % 1; F.dot([b.x + Math.sin(k * 2.3) * 0.3, 0.35 + l * 0.9, b.z + Math.cos(k * 1.7) * 0.4], `rgba(170,255,140,${glow[i] * (1 - l)})`); }
        });
        // steam over the pot
        for (let k = 0; k < 10; k++) { const l = (k / 10 + t * 0.25) % 1; F.dot([Math.sin(k + t) * 0.1 * l, 1.7 + l * 0.9, -2.3], `rgba(200,190,220,${0.5 * (1 - l)})`); }
      }
    };
  });
  // Мой базилик: your own bush on a sill under an arched window; outside it the sun goes over and the night comes with
  // its stars and moon; beside the pot an hourglass runs down the time to the next task and turns itself over. A tap
  // turns the hourglass now
  scene('grimoire', 'moy', S => {
    const { R, T } = S, DAY = 18, RUN = 7.8, FLIP = 0.8, EVERY = 9.2, SILL = 0.965, Z = -0.4;
    const HG = [0.5, 0.04];
    let off = 0, sun = [0, 1.6, Z + 0.02], day = 1, sand = 0, flip = 0;
    const at = t => (((t + off) % EVERY) + EVERY) % EVERY;
    return {
      glow: [230, 110, 200], orbit: [Math.PI / 2, 0.4], rad: 4.3, near: 3.6, look: [0, 1.5, 0], still: 4,
      tap(t) { const u = at(t); if (u < RUN) off += RUN - u; },
      tick(t) {
        const s = (t % DAY) / DAY, a = s < 0.6 ? s / 0.6 * Math.PI : (s - 0.6) / 0.4 * Math.PI;
        day = s < 0.6 ? Math.sin(a) : 0;
        sun = [-Math.cos(a) * 0.38, 1.35 + Math.sin(a) * 0.8, Z + 0.03];
        const u = at(t);
        sand = Math.min(1, u / RUN);
        flip = u < RUN ? 0 : smooth((u - RUN) / FLIP);
      },
      lights() { return [{ p: [sun[0], sun[1], 0.1], col: day > 0 ? [1, 0.8, 0.5] : [0.55, 0.65, 1], i: day > 0 ? 0.5 + 0.8 * day : 0.55, fall: 0.5 }]; },
      draw(t) {
        // the wall under the window, the sill, the posts and the arch
        box(R, [0, 0.45, Z + 0.05], [0.95, 0.45, 0.12], { tex: T.stone });
        box(R, [0, SILL - 0.035, -0.1], [1.0, 0.035, 0.34], { tex: T.stone });
        box(R, [-0.66, 1.62, Z + 0.05], [0.1, 0.66, 0.12], { tex: T.stone });
        box(R, [0.66, 1.62, Z + 0.05], [0.1, 0.66, 0.12], { tex: T.stone });
        const C = [0, 2.28, Z + 0.17], n = 7;
        for (let i = 0; i < n; i++) {
          const a0 = i / n * Math.PI, a1 = (i + 1) / n * Math.PI;
          const P = (a, r, dz) => [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r, C[2] + dz];
          quad(R, P(a0, 0.76, 0), P(a0, 0.56, 0), P(a1, 0.56, 0), P(a1, 0.76, 0), { tex: T.stone, ds: true }, 0, 1, i / n, (i + 1) / n);
          quad(R, P(a0, 0.56, 0), P(a0, 0.56, -0.24), P(a1, 0.56, -0.24), P(a1, 0.56, 0), { tex: T.stone, ds: true }, 0, 1, 0, 0.3);
          quad(R, P(a0, 0.76, 0), P(a1, 0.76, 0), P(a1, 0.76, -0.24), P(a0, 0.76, -0.24), { tex: T.stone, ds: true }, 0, 1, 0, 0.3);
        }
        // the sky in the window: the night, and the day added over it while the sun is up
        const sky = (o, lift = 0) => {
          quad(R, [-0.56, SILL, Z + lift], [0.56, SILL, Z + lift], [0.56, 2.28, Z + lift], [-0.56, 2.28, Z + lift], o, 0, 1, 0.35, 1);
          for (let i = 0; i < 6; i++) {
            const a0 = i / 6 * Math.PI, a1 = (i + 1) / 6 * Math.PI;
            R.tri([0, 2.28, Z + lift], [Math.cos(a0) * 0.56, 2.28 + Math.sin(a0) * 0.56, Z + lift], [Math.cos(a1) * 0.56, 2.28 + Math.sin(a1) * 0.56, Z + lift], { ...o, uv: [[0.5, 0.35], [0.5 + Math.cos(a0) / 2, 0.35 - Math.sin(a0) * 0.35], [0.5 + Math.cos(a1) / 2, 0.35 - Math.sin(a1) * 0.35]] });
          }
        };
        sky({ tex: T.sky, emis: true, nofog: true, ds: true });
        if (day > 0) sky({ col: [96, 120, 200], emis: true, nofog: true, ds: true, add: 0.75 * day }, 0.005);
        ball(R, sun, day > 0 ? 0.1 : 0.075, { col: day > 0 ? [255, 214, 120] : [214, 222, 255], emis: true, nofog: true });
        // the pot and its bush
        const earth = pot(R, T, -0.3, 0.02, SILL, 0.85);
        bush(R, T, [-0.3, earth, 0.02], t, { s: 0.95 });
        // the hourglass: two plates, three posts, the glass, the sand running down; turned over when it has run out
        const K = 1.5, y = v => SILL + v * K, M = [HG[0], y(0.21), HG[1]], H = turned(R, M, [0, 0, 1], flip * Math.PI);
        const [x, z] = HG, wood = { col: [112, 70, 42] }, f = flip > 0 ? 1 : sand;
        prism(H, x, z, y(0), y(0.025), 0.1 * K, 0.1 * K, 6, wood, [96, 60, 36]);
        prism(H, x, z, y(0.395), y(0.42), 0.1 * K, 0.1 * K, 6, wood, [96, 60, 36]);
        for (let i = 0; i < 3; i++) { const q = i / 3 * Math.PI * 2 + 0.5; rod(H, [x + Math.cos(q) * 0.082 * K, y(0.02), z + Math.sin(q) * 0.082 * K], [x + Math.cos(q) * 0.082 * K, y(0.4), z + Math.sin(q) * 0.082 * K], 0.012, wood, 3); }
        const gold = { col: [226, 180, 84] };
        if (f > 0.02) prism(H, x, z, y(0.025), y(0.025 + 0.15 * f), 0.062 * K, (0.062 * (1 - f) + 0.004) * K, 7, gold);
        if (f < 0.98) prism(H, x, z, y(0.215), y(0.215 + 0.15 * (1 - f)), 0.006 * K, (0.012 + 0.05 * (1 - f)) * K, 7, gold, [236, 196, 100]);
        if (!flip && f > 0 && f < 1) rod(H, [x, y(0.215), z], [x, y(0.03 + 0.15 * f), z], 0.005, { col: [236, 196, 100], emis: true }, 3);
        const glass = { col: [140, 150, 170], emis: true, nofog: true, add: 0.2, layer: 2 };
        prism(H, x, z, y(0.025), y(0.21), 0.075 * K, 0.012 * K, 7, glass);
        prism(H, x, z, y(0.21), y(0.395), 0.012 * K, 0.075 * K, 7, glass);
      },
      fx(t, F) {
        F.halo(sun, day > 0 ? 0.45 : 0.3, day > 0 ? `rgba(255,190,90,${0.2 + 0.25 * day})` : 'rgba(150,170,255,.24)', 'rgba(150,170,255,0)');
        // the stars in the window twinkle at night
        if (day < 0.3) for (let i = 0; i < 12; i++) {
          const x = ((i * 0.618) % 1 - 0.5) * 1, y = SILL + 0.35 + ((i * 0.37) % 1) * 1.4;
          if (Math.abs(x) < 0.5 && (y < 2.28 || Math.hypot(x, y - 2.28) < 0.5)) F.dot([x, y, Z + 0.02], `rgba(240,230,255,${(0.3 + 0.6 * Math.abs(Math.sin(t * 1.7 + i * 2.3))) * (1 - day / 0.3)})`, 1);
        }
      }
    };
  });
  // Посадка: a seed comes down glowing into a well of earth and sinks; a sprout comes up — the hook, the two seed
  // leaves opening, the first true pair, the second — then goes back to the earth as sparks. Around the well six cups
  // of peat with seedlings, each a step behind the other; a tap sows again
  scene('grimoire', 'posadka', S => {
    const { R, T } = S, CYCLE = 10, EARTH = 0.36;
    let sown = 0, seed = null, burst = -1;
    const CUPS = [...Array(6)].map((_, i) => { const q = i / 6 * Math.PI * 2 + 0.26; return [Math.cos(q) * 1.55, Math.sin(q) * 1.55]; });
    return {
      glow: [255, 150, 50], rad: 4.6, near: 3.7, look: [0, 0.6, 0], still: 6.2,
      tap(t) { sown = t; },
      // a warm light over the well, and the seed's own while it comes down
      lights() { return [{ p: [0.2, 1.3, 0.5], col: [1, 0.72, 0.42], i: 0.9, fall: 0.7 }].concat(seed ? [{ p: seed, col: [1, 0.8, 0.4], i: 0.8, fall: 2 }] : []); },
      draw(t) {
        // the well: a ring of stone filled with earth
        prism(R, 0, 0, 0, EARTH, 0.74, 0.7, 10, { tex: T.stone });
        ringTop(R, 0, 0, EARTH, 0.62, 0.7, 10, { tex: T.stone });
        prism(R, 0, 0, EARTH - 0.12, EARTH, 0.62, 0.62, 10, { col: [44, 34, 40], inv: true });
        disc(R, 0, 0, EARTH - 0.04, 0.62, 10, { tex: T.soil });
        const u = ((t - sown) % CYCLE + CYCLE) % CYCLE;
        // the seed: down in a spiral, then into the earth
        seed = null;
        if (u < 2.4) {
          const k = smooth(u / 1.8), q = u * 3.2, r = 0.45 * (1 - k);
          const y = u < 1.8 ? 2.9 - (2.9 - EARTH - 0.03) * k : EARTH + 0.03 - (u - 1.8) / 0.6 * 0.08;
          seed = [Math.cos(q) * r, y, Math.sin(q) * r];
          egg(R, seed, [0.05, 0.035, 0.035], q, { col: [120, 78, 44] });
        }
        const g = (u - 2.4) / 5.6;
        if (u < 9.5) sprout(R, T, [0, EARTH - 0.04, 0], Math.min(1, g), 1.7, t);
        burst = u >= 9.3 ? (u - 9.3) / 0.7 : -1;
        // the cups of peat around: each seedling a step behind the one before it
        CUPS.forEach(([x, z], i) => {
          prism(R, x, z, 0, 0.2, 0.15, 0.19, 6, { col: [110, 70, 44] }, [52, 34, 24]);
          sprout(R, T, [x, 0.19, z], ((t / CYCLE + i / 6) % 1) * 1.25, 0.75, t + i);
        });
      },
      fx(t, F) {
        if (seed) {
          F.halo(seed, 0.32, 'rgba(255,200,90,.4)', 'rgba(255,160,60,0)');
          for (let i = 0; i < 6; i++) F.spark([seed[0], seed[1] + 0.05 + i * 0.07, seed[2]], i / 6);
        }
        // a puff of earth as the seed goes in, the sprout going back to it as sparks
        const u = ((t - sown) % CYCLE + CYCLE) % CYCLE;
        if (u > 1.8 && u < 2.6) for (let i = 0; i < 10; i++) { const q = i * 0.63, l = (u - 1.8) / 0.8; F.dot([Math.cos(q) * l * 0.3, EARTH + Math.sin(l * Math.PI) * 0.15, Math.sin(q) * l * 0.3], 'rgba(150,104,64,.9)'); }
        if (burst >= 0) for (let i = 0; i < 24; i++) { const q = i * 0.9, l = burst; F.spark([Math.cos(q) * (0.1 + l * 0.5), EARTH + 0.1 + (i % 6) * 0.09 + l * 0.8, Math.sin(q) * (0.1 + l * 0.5)], l, true); }
      }
    };
  });
  // Проблемы: the bush on the altar under siege — beetles creep in round the circle towards it and are thrown back by
  // the ward with a red flash, a spider comes down on its thread and climbs back, one lower leaf has gone yellow with
  // brown spots. A tap raises the ward: every beetle is thrown back at once
  scene('grimoire', 'problemy', S => {
    const { R, T } = S, N = 6, OUT = 2.45, IN = 1.25, CRAWL = 9;
    let warded = -99, flash = 0, bugs = [], spider = [0.3, 3, 0.12];
    return {
      glow: [255, 44, 44], near: 4.8, still: 5.3,
      glowAdd(t) { return 0.3 + 0.18 * Math.sin(t * 1.4) + flash * 0.6; },
      tap(t) { warded = t; },
      tick(t) {
        // each beetle creeps in along a spiral and is flung back at the ward; a tap flings them all
        const l = (t - warded) / 1.4, push = l < 0 || l > 1 ? 0 : l < 0.15 ? l / 0.15 : 1 - (l - 0.15) / 0.85;
        flash = push;
        bugs = [...Array(N)].map((_, i) => {
          const k = ((t / CRAWL + i / N) % 1), r = OUT - (OUT - IN) * k * (1 - 0.85 * push);
          const q = i / N * Math.PI * 2 + t * 0.14 + k * 1.2;
          if (k > 0.95) flash = Math.max(flash, (k - 0.95) / 0.05);
          return { x: Math.cos(q) * r, z: Math.sin(q) * r, yaw: q + Math.PI / 2 + 0.35, k, i };
        });
        const d = 0.5 - 0.5 * Math.cos(t * 0.45);
        spider = [0.36, 3.15 - d * 0.75, 0.16];
      },
      lights() { return [{ p: [0, 0.6, 0], col: [1, 0.25, 0.2], i: 0.5 + flash * 1.6, fall: 0.25 }, { p: [spider[0] + 0.3, spider[1] + 0.2, spider[2] + 0.4], col: [0.7, 0.6, 1], i: 0.6, fall: 1.2 }]; },
      draw(t) {
        const top = altarStone(R, T), earth = pot(R, T, 0, 0, top);
        bush(R, T, [0, earth, 0], t, { texAt: k => (k === 0 ? T.leafSick : T.leaf) });
        // the beetles: a shell, a head, six legs walking
        bugs.forEach(b => {
          const c = [b.x, 0.1, b.z], f = [Math.cos(b.yaw), 0, Math.sin(b.yaw)], sd = [-f[2], 0, f[0]];
          egg(R, c, [0.21, 0.1, 0.14], b.yaw, { col: [128, 100, 160] });
          egg(R, add(c, mul(f, 0.2)), [0.075, 0.07, 0.075], b.yaw, { col: [70, 54, 84] });
          for (let j = 0; j < 6; j++) {
            const side = j < 3 ? 1 : -1, along = ((j % 3) - 1) * 0.09, st = Math.sin(t * 14 + j * 2.1 + b.i) * 0.04;
            const hip = add(add(c, mul(f, along)), mul(sd, side * 0.08)), foot = add(add(add(c, mul(f, along * 1.5 + st)), mul(sd, side * 0.22)), [0, -0.1, 0]);
            rod(R, hip, foot, 0.013, { col: [44, 32, 50] }, 3);
          }
        });
        // the spider on its thread
        rod(R, [spider[0], 4.4, spider[2]], spider, 0.005, { col: [210, 210, 220], emis: true }, 3);
        ball(R, spider, 0.08, { col: [90, 66, 110] });
        ball(R, add(spider, [0, 0.1, 0]), 0.05, { col: [70, 52, 86] });
        for (let j = 0; j < 8; j++) {
          const q = j / 8 * Math.PI * 2 + 0.2, kick = Math.sin(t * 6 + j) * 0.03;
          const knee = add(spider, [Math.cos(q) * 0.15, 0.09 + kick, Math.sin(q) * 0.15]), foot = add(spider, [Math.cos(q) * 0.24, -0.08, Math.sin(q) * 0.24]);
          rod(R, spider, knee, 0.01, { col: [60, 44, 72] }, 3);
          rod(R, knee, foot, 0.009, { col: [60, 44, 72] }, 3);
        }
      },
      fx(t, F) {
        // the beetles' red eyes, and the sparks where the ward strikes one
        bugs.forEach(b => {
          const f = [Math.cos(b.yaw), 0, Math.sin(b.yaw)];
          F.dot([b.x + f[0] * 0.27, 0.16, b.z + f[2] * 0.27], 'rgba(255,60,50,.95)', 2);
          if (b.k > 0.93) for (let i = 0; i < 10; i++) { const l = (b.k - 0.93) / 0.07, q = i * 0.63; F.spark([b.x + Math.cos(q) * l * 0.4, 0.1 + l * 0.5 * Math.abs(Math.sin(i)), b.z + Math.sin(q) * l * 0.4], l, true); }
        });
        F.dot(add(spider, [0.04, 0.03, 0.07]), 'rgba(255,60,50,.95)', 2);
        if (t - warded >= 0 && t - warded < 1.4) {
          const l = (t - warded) / 1.4;
          for (let i = 0; i < 40; i++) { const q = i / 40 * Math.PI * 2; F.spark([Math.cos(q) * (IN + l * 1.2), 0.05 + l * 0.3, Math.sin(q) * (IN + l * 1.2)], l, true); }
        }
      }
    };
  });
  // Сорта: five sorts on a turning table, as the screen where a game's hero is chosen — the chosen one comes to the
  // front, rises into a beam of light and turns itself; the table turns on to the next by itself, or at a tap
  scene('grimoire', 'sorta', S => {
    const { R, T } = S, N = 5, STEP = 6, RAD = 1.2;
    const KINDS = [
      { tex: T.leaf, col: [84, 150, 56], leaf: 1.2 },                                       // «Генуэзский»: big leaves
      { tex: T.leafOpal, col: [98, 38, 96], stem: [96, 40, 98] },                           // «Тёмный опал»: purple
      { tex: T.leaf, col: [84, 150, 56], ball: true },                                      // «Греческий»: a ball of small leaves
      { tex: T.leafThai, col: [62, 124, 48], stem: [112, 48, 116], spike: true, leaf: 0.85 }, // «Тайский»: purple stem and flowers
      { tex: T.leafLemon, col: [156, 196, 84], w: 0.24, leaf: 1.05 }                        // «Лимонный»: narrow and pale
    ];
    // the little leaves of the Greek one, spread over a ball
    const BALL = [...Array(20)].map((_, i) => { const y = 1 - (i + 0.5) / 20 * 1.6, r = Math.sqrt(Math.max(0, 1 - y * y)), q = i * 2.4; return norm([Math.cos(q) * r, y, Math.sin(q) * r]); });
    // a small bush has four pairs
    const SMALL = PAIRS.slice(0, 3).concat([[0.9, 0.2, -0.45]]);
    const glide = glider(1.6);
    let taps = 0, pos = 0, chosen = [0, 0, 0];
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      glow: [176, 110, 255], orbit: [0.75, 0.42], rad: 5, near: 4.2, look: [0, 1.15, 0], still: 1,
      tap() { taps++; },
      tick(t) {
        const target = Math.floor(t / STEP) + taps;
        pos = glide(target, t);
      },
      lights() { return [{ p: [chosen[0], 2.3, chosen[2]], col: [0.75, 0.62, 1], i: 1.4, fall: 0.35 }]; },
      draw(t) {
        KINDS.forEach((k, i) => {
          const d = wrap(i - pos), w = Math.max(0, 1 - Math.abs(d) * 1.4), q = S.ang + d * Math.PI * 2 / N;
          const x = Math.cos(q) * RAD, z = Math.sin(q) * RAD, lift = smooth(w) * 0.22;
          if (w > 0.5) chosen = [x, 0, z];
          // the ones at the back, small in the fog, have leaves of one colour
          const flat = Math.abs(d) > 0.6 ? k.col : null;
          box(R, [x, 0.2, z], [0.2, 0.2, 0.2], { tex: T.stone });
          // every sort turns slowly in its pot at one speed (a turn by w·t would spin the one coming forward round in a moment)
          const earth = pot(R, T, x, z, 0.4 + lift, 0.72, undefined, 6), b = [x, earth, z], yaw = t * 0.35 + i * 1.3;
          if (k.ball) {
            rod(R, b, [x, earth + 0.2, z], 0.02, { col: [70, 128, 48] });
            BALL.forEach((F, j) => leaf(R, add([x, earth + 0.34, z], mul(F, 0.08)), norm(add(F, [Math.sin(t * 1.3 + j) * 0.08, 0, 0])), 0.16, T.leaf, { w: 0.46, flat }));
          } else {
            const top = bush(R, T, b, t + i, { s: 0.74, tex: k.tex, stem: k.stem, leaf: k.leaf, w: k.w, yaw, pairs: SMALL, flat });
            if (k.spike) {
              prism(R, top[0], top[2], top[1], top[1] + 0.26, 0.035, 0.004, 5, { col: [150, 70, 176] });
              for (let j = 0; j < 4; j++) ball(R, [top[0], top[1] + 0.04 + j * 0.06, top[2]], 0.035 - j * 0.005, { col: [196, 120, 220] });
            }
          }
          // the beam over the chosen one
          if (w > 0.05) prism(R, x, z, 0.4, 3.4, 0.34, 0.1, 6, { col: [120, 86, 210], emis: true, nofog: true, add: 0.12 * w });
        });
      },
      fx(t, F) {
        F.halo([chosen[0], 1.2, chosen[2]], 0.6, 'rgba(160,120,255,.22)', 'rgba(160,120,255,0)');
        for (let i = 0; i < 14; i++) {
          const life = (i / 14 + t * 0.22) % 1, q = i * 2.4 + t;
          F.dot([chosen[0] + Math.cos(q) * 0.3, 0.5 + life * 2.4, chosen[2] + Math.sin(q) * 0.3], `rgba(214,190,255,${(1 - life) * 0.8})`);
        }
      }
    };
  });
  // Справка: the grimoire itself — open on a stone lectern, its pages turning one by one in their own time, runes of
  // light circling it, a quill in its inkpot beside. A tap turns the page now
  scene('grimoire', 'spravka', S => {
    const { R, T } = S, EVERY = 5, TURN = 1.5, TILT = 0.5, O = [0, 1.0, 0];
    let off = 0, phi = 0;
    const at = t => (((t + off) % EVERY) + EVERY) % EVERY;
    // a page from the spine: three strips, the outer ones lagging behind the turn, a little bow along it
    function pageStrips(B, ang, tex, flip) {
      let p = [0, 0, 0], q0 = 0;
      for (let i = 0; i < 3; i++) {
        const a = ang + (ang > 0 && ang < Math.PI ? Math.sin(ang) * 0.35 * (i / 2) : 0);
        const d = [Math.cos(a) * 0.16, Math.sin(a) * 0.16 + (i === 0 ? 0.012 : i === 2 ? -0.012 : 0), 0];
        const n = add(p, d), q1 = (i + 1) / 3;
        const u0 = flip ? 1 - q1 : q0, u1 = flip ? 1 - q0 : q1;
        quad(B, add(add(p, [0, 0.06, 0]), [0, 0, 0.33]), add(add(n, [0, 0.06, 0]), [0, 0, 0.33]), add(add(n, [0, 0.06, 0]), [0, 0, -0.33]), add(add(p, [0, 0.06, 0]), [0, 0, -0.33]), { tex, ds: true }, flip ? u1 : u0, flip ? u0 : u1, 0, 1);
        p = n; q0 = q1;
      }
    }
    return {
      glow: [240, 190, 90], orbit: [Math.PI / 2, 0.38], rad: 4.2, near: 3.5, look: [0, 1.25, 0], still: 3.9,
      tap(t) { const u = at(t); if (u < EVERY - TURN - 0.2) off += EVERY - TURN - u; },
      tick(t) { phi = Math.PI * smooth((at(t) - (EVERY - TURN)) / TURN); },
      lights(t) { return [{ p: [0, 1.7, 0.3], col: [1, 0.8, 0.45], i: 0.7 + 0.1 * Math.sin(t * 2), fall: 0.8 }]; },
      draw(t) {
        box(R, [0, 0.42, 0], [0.18, 0.42, 0.18], { tex: T.stone });
        box(R, [0, 0.06, 0], [0.34, 0.06, 0.34], { tex: T.stone });
        // the board, the book and its pages, turned to the slope of the lectern; the book's spine along its slope
        const Bk = turned(R, [0, 0, 0], [1, 0, 0], TILT, O);
        box(Bk, [0, -0.04, 0], [0.8, 0.03, 0.44], { tex: T.stone });
        box(Bk, [0, 0.005, 0], [0.54, 0.012, 0.37], { tex: T.leather });
        box(Bk, [-0.25, 0.035, 0], [0.24, 0.022, 0.335], { col: [214, 196, 152] });
        box(Bk, [0.25, 0.035, 0], [0.24, 0.022, 0.335], { col: [214, 196, 152] });
        pageStrips(Bk, Math.PI, T.pageL, true);
        pageStrips(Bk, 0, T.pageR, false);
        if (phi > 0 && phi < Math.PI) pageStrips(Bk, phi, phi < Math.PI / 2 ? T.pageR : T.pageL, phi >= Math.PI / 2);
        // the inkpot and its quill on the corner of the board
        prism(Bk, 0.66, 0.24, -0.01, 0.1, 0.07, 0.06, 6, { col: [34, 28, 44] }, [12, 8, 18]);
        const qb = [0.66, 0.08, 0.24], qt = [0.8, 0.5, 0.12];
        rod(Bk, qb, qt, 0.008, { col: [226, 214, 196] }, 3);
        leaf(Bk, add(qb, mul(sub(qt, qb), 0.35)), norm(sub(qt, qb)), 0.36, T.feather, { w: 0.22, curl: 0.1, side: [0, 0, 1] });
        // the runes round the book
        for (let k = 0; k < 8; k++) {
          const q = t * 0.35 + k / 8 * Math.PI * 2;
          billboard(R, [Math.cos(q) * 1, 1.5 + Math.sin(t * 1.1 + k) * 0.12, Math.sin(q) * 0.75], 0.065, 0.065, { tex: T.runes[k % 6], emis: true, nofog: true, cut: true });
        }
      },
      fx(t, F) {
        for (let k = 0; k < 8; k++) {
          const q = t * 0.35 + k / 8 * Math.PI * 2;
          F.halo([Math.cos(q) * 1, 1.5 + Math.sin(t * 1.1 + k) * 0.12, Math.sin(q) * 0.75], 0.16, 'rgba(255,200,110,.3)', 'rgba(255,200,110,0)');
        }
        // dust of gold off a turning page
        if (phi > 0 && phi < Math.PI) for (let i = 0; i < 12; i++) {
          const l = (i / 12 + t * 0.8) % 1;
          F.dot([Math.cos(phi) * 0.3 + Math.sin(i * 2) * 0.1, 1.15 + l * 0.6 + Math.sin(phi) * 0.15, 0.05 + Math.cos(i * 3) * 0.1], `rgba(255,214,130,${0.9 * (1 - l)})`);
        }
      }
    };
  });
  // Удобрения: three flasks of the elements, N, P and K, on their stones round the altar, bubbling. In turn each sends
  // a drop of its light in an arc into the pot; the light climbs the stem and the leaves take its colour. A tap sends
  // the next one now
  scene('grimoire', 'udobreniya', S => {
    const { R, T } = S, EVERY = 3.6, FLY = 1.3, CLIMB = 1.1;
    const COL = [[120, 140, 255], [255, 112, 64], [255, 206, 80]];
    const FL = [0, 1, 2].map(i => { const q = Math.PI / 2 + i / 3 * Math.PI * 2; return [Math.cos(q) * 1.15, Math.sin(q) * 1.15]; });
    let taps = [], drop = null, climb = null, earthY = 1.47;
    // the drop in flight: from the neck of its flask up and over into the earth
    const path = (k, u) => {
      const a = [FL[k][0], 1.12, FL[k][1]], b = [0, earthY + 0.02, 0], m = mul(add(a, b), 0.5);
      return [a[0] + (b[0] - a[0]) * u, m[1] + 0.95 - 0.95 * (2 * u - 1) ** 2 + (b[1] - a[1]) * (u - 0.5), a[2] + (b[2] - a[2]) * u];
    };
    return {
      glow: [140, 255, 96], near: 4.5, look: [0, 1.3, 0], still: 1.9,
      tap(t) { taps.push({ t, k: (taps.length + 1 + Math.floor(t / EVERY)) % 3 }); if (taps.length > 3) taps.shift(); },
      tick(t) {
        // the sends: one every few seconds by itself, in turn, and one at each tap
        const n = Math.floor(t / EVERY);
        const sends = [{ t: n * EVERY, k: n % 3 }, { t: (n - 1) * EVERY, k: (n + 2) % 3 }].concat(taps).filter(s => s.t <= t).sort((a, b) => b.t - a.t);
        drop = climb = null;
        for (const s of sends) {
          const u = t - s.t;
          if (!drop && u < FLY) drop = { k: s.k, p: path(s.k, smooth(u / FLY)) };
          else if (!climb && u >= FLY && u < FLY + CLIMB) climb = { k: s.k, f: (u - FLY) / CLIMB };
        }
      },
      lights(t) {
        const L = FL.map(([x, z], i) => ({ p: [x, 0.72, z], col: COL[i].map(v => v / 255), i: 0.55 + 0.1 * Math.sin(t * 3 + i), fall: 0.9 }));
        if (drop) L.push({ p: drop.p, col: COL[drop.k].map(v => v / 255), i: 1, fall: 0.8 });
        if (climb) L.push({ p: [0, earthY + 0.1 + climb.f * 0.9, 0.12], col: COL[climb.k].map(v => v / 255), i: 1.6 * Math.sin(climb.f * Math.PI), fall: 1.4 });
        return L;
      },
      draw(t) {
        const top = altarStone(R, T);
        earthY = pot(R, T, 0, 0, top);
        bush(R, T, [0, earthY, 0], t);
        FL.forEach(([x, z], i) => {
          box(R, [x, 0.25, z], [0.17, 0.25, 0.17], { tex: T.stone, texFront: T.letters[i] });
          // the flask: a bulb of glass round its glowing liquid, a neck
          ball(R, [x, 0.66, z], 0.12, { col: COL[i], emis: true });
          ball(R, [x, 0.7, z], 0.17, { col: [90, 110, 130], emis: true, nofog: true, add: 0.22, layer: 2 });
          prism(R, x, z, 0.83, 1.06, 0.05, 0.045, 6, { col: [90, 110, 130], emis: true, add: 0.25, layer: 2 });
          prism(R, x, z, 1.04, 1.1, 0.06, 0.06, 6, { col: [120, 84, 50] }, [80, 56, 34]);
        });
        if (drop) ball(R, drop.p, 0.06, { col: COL[drop.k], emis: true, nofog: true });
        if (climb) rod(R, [0, earthY, 0], [0, earthY + climb.f * 0.8, 0], 0.032, { col: COL[climb.k], emis: true, nofog: true });
      },
      fx(t, F) {
        FL.forEach(([x, z], i) => {
          F.halo([x, 0.68, z], 0.34, `rgba(${COL[i]},.26)`, `rgba(${COL[i]},0)`);
          for (let j = 0; j < 4; j++) { const k = (t * 0.7 + j / 4 + i * 0.3) % 1; F.dot([x + Math.sin(j * 2 + t * 3) * 0.05, 0.6 + k * 0.42, z], `rgba(255,255,255,${0.8 * (1 - k)})`, 1); }
        });
        if (drop) {
          F.halo(drop.p, 0.3, `rgba(${COL[drop.k]},.5)`, `rgba(${COL[drop.k]},0)`);
          for (let j = 1; j < 7; j++) F.dot(add(drop.p, [0, j * 0.03, 0]), `rgba(${COL[drop.k]},${0.7 - j * 0.1})`);
        }
        if (climb) F.halo([0, earthY + climb.f * 0.8, 0], 0.4, `rgba(${COL[climb.k]},.4)`, `rgba(${COL[climb.k]},0)`);
      }
    };
  });
  // Уход: the four the chapter is about. A sun crosses the vault and the bush turns after it, then a pale moon; a cloud
  // comes in and rains on the pot, the earth goes dark with the water and pales as it dries; the candles keep it
  // warm. A tap calls the rain now
  scene('grimoire', 'uhod', S => {
    const { R, T } = S, DAY = 24, RAIN = 5;
    let rainAt = -99, tapped = -99, orb = [0, 3, 0], day = 1, rise = 1, cloud = null, wet = 0, lean = [0, 0];
    const EARTH_DRY = [112, 82, 56], EARTH_WET = [34, 22, 18];
    const sky = t => {
      const s = (t % DAY) / DAY, a = s < 0.72 ? s / 0.72 * Math.PI : (s - 0.72) / 0.28 * Math.PI, up = Math.sin(a);
      day = s < 0.72 ? up : 0;
      // the sun and the moon go down into the horizon and come up out of it: small there, never jumping across
      rise = smooth(up / 0.3);
      // across the circle from east to west, a little behind the bush
      orb = [-Math.cos(a) * 2.3, 1.7 + up * 1.7, -0.7];
      return s < 0.72;
    };
    return {
      glow: [255, 196, 80], near: 4.6, look: [0, 1.7, 0], still: 4,
      tap(t) { tapped = t; },
      tick(t) {
        const sun = sky(t);
        // the light of the sky goes over from the moon's to the sun's and back without a jump
        R.key = { dir: norm(sub(orb, [0, 1.4, 0])), i: 0.22 + (sun ? 0.7 * day : 0.1 * rise), col: mix3([0.5, 0.6, 1], [1, 0.86, 0.6], sun ? smooth(day / 0.3) : 0) };
        // the bush leans after the sun, slowly, and stands up straight at night
        const want = sun ? [orb[0] * 0.09 * day, 0] : [0, 0];
        lean = mix3([lean[0], lean[1], 0], [want[0], want[1], 0], 0.04).slice(0, 2);
        if (reduce.matches) lean = want;
        // the rain: by itself once a day, or when tapped; the earth dries over the rest of the day
        const auto = Math.floor((t - 5) / DAY) * DAY + 5;
        rainAt = Math.max(auto, tapped);
        const r = t - rainAt;
        // the cloud comes in and goes, swelling out of nothing and melting away at the side
        cloud = r >= 0 && r < RAIN ? { x: r < 1.2 ? -2.6 * (1 - smooth(r / 1.2)) : r > RAIN - 1.2 ? 2.6 * smooth((r - RAIN + 1.2) / 1.2) : 0, k: smooth(r / 0.7) * (1 - smooth((r - RAIN + 0.7) / 0.7)), rain: r > 1 && r < RAIN - 1 } : null;
        wet = r < 0 ? 0 : r < RAIN ? Math.min(1, Math.max(0, r - 1.2) / 2) : Math.max(0, 1 - (r - RAIN) / 9);
      },
      lights() {
        return [{ p: orb, col: day > 0 ? [1, 0.82, 0.5] : [0.6, 0.7, 1], i: rise * (day > 0 ? 0.6 + day : 0.5), fall: 0.12 }];
      },
      draw(t) {
        box(R, [0, 0.36, 0], [0.46, 0.36, 0.46], { tex: T.stone, texFront: T.altar });
        const earth = pot(R, T, 0, 0, 0.72, 1.15, mix3(EARTH_DRY, EARTH_WET, wet).map(Math.round));
        bush(R, T, [0, earth, 0], t, { s: 1.2, lean });
        // the sun (or the moon) itself: it gives light, nothing lights it
        if (rise > 0.02) ball(R, orb, (day > 0 ? 0.2 : 0.14) * rise, { col: day > 0 ? [255, 214, 120] : [210, 220, 255], emis: true, nofog: true });
        if (cloud && cloud.k > 0.02) [[0, 0, 0.26], [0.22, -0.05, 0.2], [-0.24, -0.04, 0.2], [0.1, 0.1, 0.18], [-0.1, 0.08, 0.17]]
          .forEach(([dx, dy, r]) => ball(R, [cloud.x + dx * cloud.k, 2.85 + dy * cloud.k, dx * 0.3], r * cloud.k, { col: [78, 72, 104] }));
      },
      fx(t, F) {
        if (rise > 0.02) F.halo(orb, (day > 0 ? 1.1 : 0.6) * rise, day > 0 ? `rgba(255,190,90,${(0.2 + 0.25 * day) * rise})` : `rgba(150,170,255,${0.22 * rise})`, 'rgba(255,190,90,0)');
        if (cloud && cloud.rain) for (let i = 0; i < 30; i++) {
          const k = ((t * 1.6 + i * 0.37) % 1), x = cloud.x + ((i * 0.61) % 1 - 0.5) * 0.7, z = ((i * 0.43) % 1 - 0.5) * 0.5;
          F.streak([x, 2.7 - k * 1.2, z], 0.12, 'rgba(140,190,255,.85)');
        }
        // the splashes on the earth while it rains
        if (cloud && cloud.rain) for (let i = 0; i < 6; i++) { const q = i + t * 5; F.dot([Math.cos(q) * 0.3, 1.2, Math.sin(q * 1.3) * 0.3], 'rgba(190,220,255,.8)'); }
      }
    };
  });
  // Вкус и кухня: pesto made as a rite — a stone mortar on a kitchen table, the pestle grinding round in it, leaves of basil
  // falling into the green, garlic, pine nuts and a phial of oil beside it; out of the mortar rises the aroma, a
  // molecule of eugenol going up and fading. A tap throws in a handful of leaves
  scene('grimoire', 'vkus', S => {
    const { R, T } = S, mol = molShape('eug');
    let top = 1.08, hands = [];
    const FALL = [...Array(7)].map((_, i) => ({ a: i / 7, x: ((i * 0.61) % 1 - 0.5) * 0.5, z: ((i * 0.37) % 1 - 0.5) * 0.4, s: 0.7 + (i % 3) * 0.12 }));
    // a leaf tumbling down from above into the mortar, k — how far it has fallen
    const falling = (x, z, k, spin) => {
      const y = 3.1 - k * (3.1 - top - 0.28);
      const F = norm([Math.cos(spin), Math.sin(spin * 0.7) * 0.8, Math.sin(spin)]);
      leaf(R, [x * (1 - k * 0.6), y, z * (1 - k * 0.6)], F, 0.26, T.leaf, { side: [Math.sin(spin * 1.3), 0.5, Math.cos(spin * 1.3)] });
    };
    return {
      glow: [200, 236, 96], near: 4.4, look: [0, 1.7, 0], still: 2.4,
      tap(t) { hands.push(t); if (hands.length > 3) hands.shift(); },
      lights(t) { return [{ p: [0.2, top + 1.1, 0.5], col: [1, 0.8, 0.5], i: 1 + 0.1 * Math.sin(t * 2), fall: 0.6 }, { p: [0, top + 0.5, 0], col: [0.6, 1, 0.4], i: 0.5, fall: 2 }]; },
      draw(t) {
        // a kitchen table of old wood
        top = 1.06;
        box(R, [0, top - 0.04, 0], [0.88, 0.04, 0.58], { col: [124, 80, 46] });
        [[-0.74, -0.46], [0.74, -0.46], [0.74, 0.46], [-0.74, 0.46]].forEach(([x, z]) => box(R, [x, (top - 0.08) / 2, z], [0.06, (top - 0.08) / 2, 0.06], { col: [96, 60, 34] }));
        const y0 = top, y1 = top + 0.42;
        // the mortar: its outer wall, the rim, the far inner wall, the green inside
        prism(R, 0, 0, y0, y1, 0.36, 0.48, 10, { tex: T.stone });
        ringTop(R, 0, 0, y1, 0.38, 0.48, 10, { tex: T.stone });
        prism(R, 0, 0, y0 + 0.16, y1, 0.28, 0.38, 10, { col: [92, 82, 98], inv: true });
        disc(R, 0, 0, y0 + 0.2, 0.31, 10, { tex: T.paste });
        // the pestle grinding round
        const a = t * 1.7, b = [Math.cos(a) * 0.13, y0 + 0.25, Math.sin(a) * 0.13], q = [Math.cos(a) * 0.36, y0 + 0.92, Math.sin(a) * 0.36];
        rod(R, b, q, 0.05, { col: [184, 172, 160] }, 6);
        ball(R, b, 0.07, { col: [184, 172, 160] });
        // the garlic, the pine nuts, the oil
        [[0, 0, 0.07], [0.06, -0.01, 0.05], [-0.05, -0.01, 0.05], [0.01, 0.02, 0.05]].forEach(([dx, dz, r]) => egg(R, [0.66 + dx, top + r * 0.9, 0.3 + dz], [r, r * 1.1, r], 0, { col: [232, 222, 202] }));
        for (let i = 0; i < 6; i++) egg(R, [0.6 + (i % 3) * 0.06, top + 0.02, -0.34 + (i >> 1 & 1) * 0.06 + (i > 3 ? 0.06 : 0)], [0.028, 0.018, 0.016], i, { col: [228, 204, 150] });
        prism(R, -0.66, -0.26, top, top + 0.26, 0.09, 0.08, 6, { col: [196, 150, 40], emis: true, add: 0.6 });
        prism(R, -0.66, -0.26, top + 0.26, top + 0.38, 0.03, 0.028, 5, { col: [196, 150, 40], emis: true, add: 0.5 });
        prism(R, -0.66, -0.26, top + 0.37, top + 0.42, 0.035, 0.035, 5, { col: [110, 70, 40] }, [90, 56, 32]);
        // the leaves falling in: a steady few, and a handful at a tap
        FALL.forEach((f, i) => { const k = (f.a + t * 0.22) % 1; falling(f.x, f.z, smooth(k), t * f.s * 2 + i); });
        hands = hands.filter(h => t - h < 1.6 && t >= h);
        hands.forEach(h => { for (let i = 0; i < 6; i++) { const k = smooth(Math.min(1, (t - h) / 1.2 - i * 0.04)); if (k > 0) falling(Math.cos(i * 1.1) * 0.35, Math.sin(i * 1.1) * 0.3, k, t * 2 + i); } });
        // the aroma: the molecule going up out of the mortar and fading as it goes
        if (mol) {
          const k = (t * 0.11) % 1;
          essence(R, mol, [0, y1 + 0.35 + k * 1.2, 0], t * 0.6, 1.2, Math.sin(k * Math.PI) * 0.9);
        }
      },
      fx(t, F) {
        const k = (t * 0.11) % 1, my = top + 0.42 + 0.35 + k * 1.2;
        F.halo([0, my, 0], 0.5, `rgba(155,107,214,${0.26 * Math.sin(k * Math.PI)})`, 'rgba(155,107,214,0)');
        for (let i = 0; i < 16; i++) {
          const l = (i / 16 + t * 0.18) % 1, q = i * 2.4 + t * 0.5;
          F.dot([Math.cos(q) * (0.1 + l * 0.3), top + 0.5 + l * 1.4, Math.sin(q) * (0.1 + l * 0.3)], `rgba(${i % 2 ? '210,236,120' : '236,214,140'},${0.75 * (1 - l)})`);
        }
      }
    };
  });
  /* ------------------------------------------------------------------ */
  /* «Гримуар»: the crypt by candlelight round every scene — a circle of  */
  /* runes on the floor in the colour of the chapter, pillars in the dark, */
  /* seven candles on the points of the star; drawn at the console's      */
  /* resolution and cut down to its colours                               */
  /* ------------------------------------------------------------------ */
  world('grimoire', {
    raster: () => ({ px: 3, maxW: 400, levels: 16, fogNear: 3.5, fogFar: 15, amb: [0.13, 0.1, 0.17] }),
    textures: () => textures(),
    key: { dir: norm([-0.35, 0.85, -0.4]), i: 0.42, col: [0.55, 0.5, 0.85] },
    sky: ['#07050B', '#1C1122', '#120B17'],
    defaults: { glow: [255, 70, 50] },
    make(S, sc) {
      const { R, T } = S;
      const FLOOR = floorTex(sc.glow, false), GLOW = floorTex(sc.glow, true);
      // the candles and the pillars on the camera's side stay away: next to the lens they would stand big and dark at
      // the edge of the picture
      const off = q => Math.abs(((q - sc.orbit[0]) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      const ring = sc.bare ? [] : [...Array(7)].map((_, i) => { const q = -Math.PI / 2 + i / 7 * Math.PI * 2; return { q, x: Math.cos(q) * 2.95, z: Math.sin(q) * 2.95, h: 0.38 + ((i * 37) % 10) / 22, ph: i * 1.7 }; }).filter(c => off(c.q) > 0.8);
      const candles = ring.concat(sc.candles || []);
      const embers = [...Array(candles.length ? 46 : 0)].map((_, i) => ({ k: i % candles.length, a: (i * 0.37) % 1, s: 0.3 + (i * 13 % 10) / 22, dx: ((i * 29) % 11 - 5) / 60, dz: ((i * 17) % 11 - 5) / 60 }));
      const pillars = [...Array(8)].map((_, i) => { const q = 0.35 + i / 8 * Math.PI * 2; return { q, x: Math.cos(q) * 7.4, z: Math.sin(q) * 7.4, h: 1.6 + ((i * 53) % 10) / 4 }; }).filter(p => off(p.q) > 1.1);
      return {
        lights: t => candles.map(c => ({ p: [c.x, (c.top || 0) + c.h + 0.14, c.z], col: [1, 0.6, 0.28], i: 0.5 + 0.12 * Math.sin(t * 11 + c.ph) + 0.08 * Math.sin(t * 23 + c.ph * 2), fall: 0.55 })),
        draw(t) {
          if (!sc.bare) {
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
          }
          candles.forEach((c, i) => {
            const y0 = c.top || 0;
            prism(R, c.x, c.z, y0, y0 + c.h, 0.085, 0.075, 6, { tex: T.wax }, [236, 226, 200], i);
            const fl = 1 + 0.18 * Math.sin(t * 13 + c.ph) + 0.1 * Math.sin(t * 29 + c.ph);
            billboard(R, [c.x, y0 + c.h + 0.1 * fl, c.z], 0.05, 0.1 * fl, { tex: T.flame, emis: true, nofog: true, cut: true });
          });
        },
        // the halos of the flames and the sparks going up from them
        fx(t, F) {
          candles.forEach(c => F.halo([c.x, (c.top || 0) + c.h + 0.1, c.z], 0.42, 'rgba(255,150,60,.34)', 'rgba(255,120,40,0)'));
          embers.forEach(e => {
            const c = candles[e.k], life = (e.a + t * e.s * 0.25) % 1;
            F.spark([c.x + e.dx * life * 8, (c.top || 0) + c.h + 0.15 + life * 1.6, c.z + e.dz * life * 8], life);
          });
        }
      };
    },
    // the colour depth of the console
    post: R => R.post(16)
  });

  // the stone altar with its sigil: gives the height of its top
  function altarStone(R, T) {
    box(R, [0, 0.48, 0], [0.8, 0.48, 0.5], { tex: T.stone, texFront: T.altar });
    box(R, [0, 1.02, 0], [0.92, 0.06, 0.6], { tex: T.stone });
    return 1.08;
  }
  // the signs of alchemy, pixel by pixel (16 × 16, nothing around them): mercury, sulphur, salt, saturn, earth, air
  function glyphTex(kind, col) {
    return tex(16, 16, t => {
      const { put, line } = t;
      const ring = (cx, cy, r) => { for (let a = 0; a < 64; a++) { const q = a / 64 * Math.PI * 2; put(cx + Math.cos(q) * r, cy + Math.sin(q) * r, col); } };
      if (kind === 0) { ring(8, 7, 3.2); line(8, 11, 8, 15, col); line(6, 13, 10, 13, col); for (let a = 0; a < 20; a++) { const q = Math.PI + a / 20 * Math.PI; put(8 + Math.cos(q) * 3.5, 2.5 + Math.sin(q) * 1.8, col); } }
      if (kind === 1) { line(3, 9, 8, 1, col); line(8, 1, 13, 9, col); line(3, 9, 13, 9, col); line(8, 9, 8, 15, col); line(5, 12, 11, 12, col); }
      if (kind === 2) { ring(8, 8, 5.5); line(2, 8, 14, 8, col); }
      if (kind === 3) { line(6, 1, 6, 12, col); line(3, 4, 9, 4, col); line(6, 8, 10, 8, col); line(10, 8, 11, 12, col); line(11, 12, 9, 15, col); }
      if (kind === 4) { line(2, 3, 14, 3, col); line(2, 3, 8, 14, col); line(14, 3, 8, 14, col); line(4, 7, 12, 7, col); }
      if (kind === 5) { line(2, 13, 8, 2, col); line(8, 2, 14, 13, col); line(2, 13, 14, 13, col); line(4, 9, 12, 9, col); }
    });
  }
  // Прищипка и сбор: куст на старом пне, его верхушка растёт; золотой серп друида кружит рядом, как молодой месяц,
  // спускается и срезает верхушку над парой листьев. Верхушка падает в мох, а из пазух той пары выходят два побега —
  // куст растёт вширь, а не вверх. Потом мох забирает срезанное, и всё снова. Касание — взмах серпа
  scene('druid', 'formirovka', S => {
    const { R, T } = S, CYCLE = 12, SW = 4.6, s = 1.15;
    let off = 0, cut = [0, 1.6, 0], sick = [1, 2, 0], tip = null, phase = 0, top = 0.5;
    const at = t => (((t + off) % CYCLE) + CYCLE) % CYCLE;
    // the main stem: three nodes with their pairs, the cut above the third
    const NODES = [[0.2, 0.42, 0.12], [0.42, 0.36, 0], [0.62, 0.3, -0.12]];
    const pair = (R2, c, len, pitch, k, t, g = 1) => {
      for (let j = 0; j < 2; j++) {
        const yaw = k * Math.PI / 2 + j * Math.PI + 0.3 + Math.sin(t * 1.3 + k + j) * 0.05;
        leaf(R2, c, norm([Math.cos(yaw) * Math.cos(pitch), -Math.sin(pitch) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pitch)]), len * s * g, T.leaf);
      }
    };
    // the top above the cut: a stem and two pairs, grown g
    const topShoot = (R2, c, g, t) => {
      if (g <= 0) return;
      const h = 0.34 * s * g;
      rod(R2, c, [c[0], c[1] + h, c[2]], 0.02 * s, { col: [86, 146, 56] });
      pair(R2, [c[0], c[1] + h * 0.45, c[2]], 0.26, -0.15, 3, t, g);
      pair(R2, [c[0], c[1] + h * 0.95, c[2]], 0.16, -0.6, 4, t, g);
    };
    return {
      near: 4.4, look: [0, 1.15, 0], still: 7.5, clear: 1.6,
      tap(t) { const u = at(t); if (u > 1.5 && u < SW - 0.6) off += SW - 0.6 - u; },
      tick(t) {
        const u = at(t);
        phase = u;
        // the sickle: round the bush, then down through the stem and away
        const idle = [Math.cos(t * 0.6) * 1.05, cut[1] + 0.45 + Math.sin(t * 1.1) * 0.08, Math.sin(t * 0.6) * 1.05];
        const w = smooth((u - SW + 0.9) / 0.6) * (1 - smooth((u - SW - 0.3) / 0.8)), k = smooth((u - SW + 0.3) / 0.6);
        sick = mix3(idle, mix3(add(cut, [-0.5, 0.12, 0.05]), add(cut, [0.5, 0.02, -0.05]), k), w);
        // it turns as it circles and turns to its cut during the swing: to the whole turn nearest to where it stood when the
        // swing began (a turn by t·(1 − w) would spin it round dozens of times in the swing, a minute into the page)
        const turns = Math.round((t - u + SW - 0.9) * 1.4 / (Math.PI * 2)) * Math.PI * 2;
        tip = { w, spin: t * 1.4 * (1 - w) + turns * w };
      },
      lights() { return [{ p: add(sick, [0, 0.25, 0.2]), col: [1, 0.86, 0.5], i: 1.1, fall: 0.5 }]; },
      draw(t) {
        top = stump(R, T, 0, 0, 0.5, 0.5);
        disc(R, 0, 0, top + 0.004, 0.36, 9, { col: [58, 40, 28] });
        const b = [0, top, 0], u = phase;
        cut = [0, top + 0.62 * 0.85 * s + 0.02, 0];
        rod(R, b, cut, 0.03 * s, { col: [70, 128, 48] });
        NODES.forEach(([f, len, pitch], k) => pair(R, [0, top + 0.85 * s * f, 0], len, pitch, k, t));
        // the top: growing before the cut, falling after it, lying in the moss till the moss takes it
        if (u < SW) topShoot(R, cut, smooth(u / (SW - 0.8)), t);
        else if (u < 10.6) {
          const f = smooth((u - SW) / 1.6), land = [0.95, 0.06, 0.4];
          topShoot(turned(R, add(cut, [0, 0.15, 0]), [0.3, 0, 1], -f * 1.45, mul(sub(land, cut), f)), cut, 1 - smooth((u - 9.4) / 1.2), t);
        }
        // the two new shoots from the axils of the last pair
        const gs = u < SW ? 0 : u < 10.6 ? smooth((u - SW - 0.4) / 3.2) : 1 - smooth((u - 10.6) / 1.2);
        if (gs > 0) for (let j = 0; j < 2; j++) {
          const yaw = Math.PI + j * Math.PI + 0.3, d = norm([Math.cos(yaw) * 0.6, 0.8, Math.sin(yaw) * 0.6]);
          const base = [0, top + 0.85 * s * 0.62, 0], end = add(base, mul(d, 0.34 * s * gs));
          rod(R, base, end, 0.018 * s, { col: [92, 150, 60] });
          for (let i = 0; i < 2; i++) { const q = yaw + Math.PI / 2 + i * Math.PI; leaf(R, end, norm([Math.cos(q), 0.25, Math.sin(q)]), 0.22 * s * gs, T.leaf); }
          leaf(R, end, norm(add(d, [0, 0.4, 0])), 0.12 * s * gs, T.leafLemon, { w: 0.4 });
        }
        // the sickle: a crescent of gold, its edge bright, a haft of oak bound with a cord
        const q = tip.spin, U = [Math.cos(q), 0, Math.sin(q)], V = norm(mix3([0, 1, 0], [-Math.sin(q), 0, Math.cos(q)], tip.w * 0.85));
        const P = (a, r, o) => add(add(sick, mul(U, Math.cos(a) * r + o)), mul(V, Math.sin(a) * r));
        for (let i = 0; i < 9; i++) {
          const a0 = -0.4 + i / 9 * 2.9, a1 = -0.4 + (i + 1) / 9 * 2.9;
          quad(R, P(a0, 0.4, 0), P(a1, 0.4, 0), P(a1, 0.32, 0.09), P(a0, 0.32, 0.09), { col: [226, 180, 76], ds: true });
          rod(R, P(a0, 0.4, 0), P(a1, 0.4, 0), 0.012, { col: [255, 236, 170], emis: true, nofog: true }, 3);
        }
        const end = P(2.5, 0.36, 0.045), dir = norm(sub(end, P(2.3, 0.36, 0.045)));
        rod(R, end, add(end, mul(dir, 0.3)), 0.032, { col: [110, 78, 50] });
        rod(R, add(end, mul(dir, 0.04)), add(end, mul(dir, 0.1)), 0.036, { col: [196, 176, 132] });
      },
      fx(t, F) {
        const u = phase;
        F.halo(sick, 0.55, 'rgba(255,220,140,.3)', 'rgba(255,220,140,0)');
        // the cut: sap and bits of leaf flying
        if (u > SW - 0.05 && u < SW + 0.7) for (let i = 0; i < 14; i++) {
          const l = (u - SW + 0.05) / 0.75, q = i * 0.45;
          F.dot([cut[0] + Math.cos(q) * l * 0.5, cut[1] + Math.sin(i * 1.7) * l * 0.3 + l * 0.1, cut[2] + Math.sin(q) * l * 0.4], `rgba(190,240,120,${1 - l})`, 2);
        }
        // the moss taking the cut top: a cold light going up out of it
        if (u > 9.2 && u < 10.8) for (let i = 0; i < 14; i++) { const l = (u - 9.2) / 1.6, q = i * 0.9; F.dot([0.95 + Math.cos(q) * 0.2, 0.05 + l * 0.6 + (i % 4) * 0.05, 0.4 + Math.sin(q) * 0.2], `rgba(143,232,198,${Math.sin(l * Math.PI)})`, 1.6); }
      }
    };
  });
  // Гидропоника: родник между двух камней наполняет тихую заводь; посреди неё плавает коряга, на ней растёт куст, и его
  // белые корни висят в прозрачной воде. Со дна поднимаются пузырьки, по воде расходятся круги. Касание — круги
  // и пузырьки
  scene('druid', 'gidro', S => {
    const { R, T } = S, POOL = 1.15, SP = -2.5;
    // the spring: where the water falls in, the two stones on either side of it
    const IN = [Math.cos(SP) * POOL * 0.92, Math.sin(SP) * POOL * 0.92], TOP = [Math.cos(SP) * 1.42, 0.5, Math.sin(SP) * 1.42];
    const ROOTS = [...Array(9)].map((_, i) => ({ q: i * 2.4, r: 0.1 + (i % 3) * 0.09, d: 0.22 + (i % 4) * 0.06 }));
    let taps = [], y = 0.06;
    return {
      rad: 4.8, near: 4.5, look: [0, 0.7, 0], still: 3, clear: 1.8,
      noGrass: (x, z) => Math.hypot(x - TOP[0], z - TOP[2]) < 0.6,
      tap(t) { taps.push(t); if (taps.length > 3) taps.shift(); },
      lights() { return [{ p: [0, 0.3, 0], col: [0.5, 0.9, 1], i: 0.7, fall: 0.8 }]; },
      draw(t) {
        // the bottom of the pool seen through the water, the bank of stones round it, the face of the water
        disc(R, 0, 0, 0.004, POOL, 14, { col: [12, 34, 38], layer: 0.5 });
        disc(R, 0, 0, 0.008, POOL * 0.68, 14, { col: [20, 54, 58], layer: 0.55 });
        disc(R, 0, 0, 0.012, POOL, 14, { col: [70, 140, 150], emis: true, add: 0.12, layer: 0.6 });
        for (let i = 0; i < 18; i++) { const q = i / 18 * Math.PI * 2 + 0.2; egg(R, [Math.cos(q) * (POOL + 0.06), 0.03, Math.sin(q) * (POOL + 0.06)], [0.13, 0.07, 0.1], q, { col: [80 + (i % 3) * 8, 86 + (i % 3) * 8, 90] }); }
        [-0.32, 0.32].forEach((d, i) => { const q = SP + d; egg(R, [Math.cos(q) * 1.5, 0.28, Math.sin(q) * 1.5], [0.3, 0.42 - i * 0.08, 0.26], q, { col: [90, 94, 98] }); egg(R, [Math.cos(q) * 1.5, 0.56 - i * 0.08, Math.sin(q) * 1.5], [0.22, 0.1, 0.2], q, { col: [62, 98, 46] }); });
        // the stream of the spring falling from between the stones into the pool
        const sd = [-Math.sin(SP), 0, Math.cos(SP)], bot = [IN[0], 0.02, IN[1]];
        quad(R, add(TOP, mul(sd, -0.05)), add(TOP, mul(sd, 0.05)), add(bot, mul(sd, 0.08)), add(bot, mul(sd, -0.08)), { col: [150, 210, 224], emis: true, add: 0.4, ds: true, layer: 1.2 });
        // the rings on the water: two always going out from the driftwood, two more at each tap, small ones where the
        // spring falls in
        const rings = [(t * 0.3) % 1, (t * 0.3 + 0.5) % 1].concat(...taps.map(h => [(t - h) / 2.4, (t - h) / 2.4 - 0.2]));
        rings.forEach(k => { if (k <= 0 || k >= 1) return; const r = 0.5 + k * (POOL - 0.55); ringTop(R, 0, 0, 0.014, r, r + 0.025, 22, { col: [170, 230, 240], emis: true, add: 0.55 * (1 - k), layer: 0.65 }); });
        [(t * 0.9) % 1, (t * 0.9 + 0.5) % 1].forEach(k => { const r = 0.05 + k * 0.3; ringTop(R, IN[0], IN[1], 0.014, r, r + 0.02, 12, { col: [190, 236, 246], emis: true, add: 0.5 * (1 - k), layer: 0.65 }); });
        // the driftwood rocking on the water, a pad of moss on it, the bush, its roots hanging down into the clear water
        y = 0.06 + Math.sin(t * 1.1) * 0.022;
        const roll = Math.sin(t * 0.8) * 0.03, a = [-0.62, y - roll, -0.14], b = [0.62, y + roll, 0.14];
        rod(R, a, b, 0.1, { col: [104, 80, 58] }, 6);
        rod(R, [0.3, y + 0.02, 0.07], [0.52, y + 0.2, -0.12], 0.035, { col: [96, 74, 52] }, 4);
        egg(R, [0, y + 0.08, 0], [0.18, 0.05, 0.12], 0.2, { col: [64, 104, 46] });
        bush(R, T, [0, y + 0.1, 0], t, { s: 1 });
        ROOTS.forEach((r, i) => {
          const w = Math.sin(t * 0.9 + i) * 0.03, m = [Math.cos(r.q) * r.r * 0.5 + w, -r.d * 0.45, Math.sin(r.q) * r.r * 0.5];
          rod(R, [Math.cos(r.q) * 0.06, y - 0.06, Math.sin(r.q) * 0.06], m, 0.012, { col: [196, 214, 204] }, 3);
          rod(R, m, [Math.cos(r.q) * r.r + w * 2, -r.d, Math.sin(r.q) * r.r], 0.008, { col: [176, 204, 200] }, 3);
        });
      },
      fx(t, F) {
        // the bubbles rising from the bottom round the roots, many more after a tap; the shine of the moon on the water
        const more = taps.some(h => t >= h && t - h < 2) ? 26 : 10;
        for (let i = 0; i < more; i++) {
          const k = (t * (0.35 + (i % 4) * 0.08) + i * 0.37) % 1, q = i * 2.4, r = 0.15 + (i % 5) * 0.12;
          F.dot([Math.cos(q) * r + Math.sin(t * 2 + i) * 0.02, -0.32 + k * 0.33, Math.sin(q) * r], `rgba(210,250,255,${0.85 * (1 - k * 0.5)})`, 1.2);
        }
        F.halo([0.35, 0.02, 0.45], 0.45, 'rgba(200,230,255,.14)', 'rgba(200,230,255,0)');
        F.halo([IN[0], 0.1, IN[1]], 0.3, 'rgba(190,236,246,.22)', 'rgba(190,236,246,0)');
        for (let i = 0; i < 10; i++) { const k = (t * 1.4 + i / 10) % 1; F.streak(add(mix3(TOP, [IN[0], 0.02, IN[1]], k), [-Math.sin(SP) * ((i % 3) - 1) * 0.03, 0, Math.cos(SP) * ((i % 3) - 1) * 0.03]), 0.06, 'rgba(220,245,255,.6)'); }
      }
    };
  });
  // Главная, фоном всего первого экрана: роща — на старом пне в середине круга растёт базилик, над ним медленно кружит
  // венок из веточек с белыми ягодами омелы, вокруг падают листья, летают светлячки. Раз в четырнадцать секунд по кругу
  // проходит порыв ветра: руны на камнях вспыхивают, листья кружатся быстрее
  scene('druid', 'glavnaya', S => {
    const { R, T } = S, EVERY = 14;
    const g = t => { const u = (t % EVERY) - (EVERY - 1.6); return u > 0 ? 1 - u / 1.6 : 0; };
    return {
      look: [0, 1.25, 0], near: 5.2, rad: 5.4, still: 3,
      rune: t => 0.5 + 0.15 * Math.sin(t * 1.1) + g(t) * 1.1,
      gust: t => g(t),
      lights(t) { return [{ p: [0, 2.3, 0], col: [1, 0.84, 0.55], i: 0.85 + 0.08 * Math.sin(t * 3), fall: 0.7 }]; },
      draw(t) {
        const top = stump(R, T, 0, 0, 0.46, 0.5);
        bush(R, T, [0, top, 0], t, { s: 1.15 });
        wreath(R, T, [0, 2.45, 0], 0.5, t * 0.22);
        // leaves falling round the circle, faster in a gust
        const k = g(t);
        for (let i = 0; i < 8; i++) {
          const l = (i / 8 + t * 0.06) % 1, q = i * 1.9 + t * 0.2 + k * 0.9, r = 1.2 + (i % 3) * 0.7;
          leaf(R, [Math.cos(q) * r, 3.4 - l * 3.3, Math.sin(q) * r], norm([Math.cos(t + i), Math.sin(t * 1.3 + i), Math.sin(t + i * 2)]), 0.14, i % 2 ? T.leafLemon : T.leaf, { side: [Math.sin(t * 2 + i), 0.4, Math.cos(t * 2 + i)] });
        }
      },
      fx(t, F) { F.halo([0, 2.4, 0], 0.8, 'rgba(255,220,150,.16)', 'rgba(255,220,150,0)'); }
    };
  });
  // Мой базилик: куст читателя в горшке у плетня, на горшке — бирка. Над плетнём дугой лунный календарь, восемь фаз луны;
  // нынешняя больше и ярче всех, и куст стоит в её свете: в полнолуние светлее, в новолуние темнее. Фазы идут сами;
  // касание — следующая
  scene('druid', 'moy', S => {
    const { R, T } = S, N = 8, STEP = 4, FR = 1.15, A = 0.9, BACK = A + Math.PI;
    // the wattle: stakes on an arc behind the pot (on the far side from the camera), withies woven in and out of them
    const STAKES = [...Array(11)].map((_, i) => BACK - 1.05 + i / 10 * 2.1);
    const at = (q, r, y) => [Math.cos(q) * r, y, Math.sin(q) * r];
    const MOONS = [...Array(N)].map((_, i) => { const q = BACK - 0.95 + i / (N - 1) * 1.9, c = (i - (N - 1) / 2) / ((N - 1) / 2); return at(q, FR + 0.05, 1.42 + 0.22 * (1 - c * c)); });
    const glide = glider(1.4);
    let taps = 0, pos = 0, frac = 0;
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      orbit: [A, 0.35], near: 4.1, rad: 4.5, look: [0, 0.95, 0], still: 13, clear: 1.6,
      tap() { taps++; },
      tick(t) {
        const target = Math.floor(t / STEP) + taps;
        pos = glide(target, t);
        // the moonlight on the bush: as much as the moon of the moment is lit, going over smoothly to the next one
        frac = (1 - Math.cos(pos / N * Math.PI * 2)) / 2;
        R.key = { dir: R.key.dir, col: R.key.col, i: 0.25 + 0.65 * frac };
      },
      lights() { return [{ p: [0, 1.2, 0.3], col: [0.8, 0.92, 1], i: 0.3 + 0.7 * frac, fall: 0.7 }]; },
      draw(t) {
        STAKES.forEach((q, i) => rod(R, at(q, FR, -0.02), at(q, FR, 0.78 + (i % 2) * 0.06), 0.03, { col: [104, 78, 52] }, 5));
        [0.16, 0.32, 0.48, 0.64].forEach((y, row) => {
          for (let i = 0; i < STAKES.length - 1; i++) {
            const k = (i + row) % 2 ? 0.035 : -0.035;
            rod(R, at(STAKES[i], FR + k, y), at(STAKES[i + 1], FR - k, y + 0.02), 0.022, { col: [128 - row * 6, 98 - row * 4, 64] }, 4);
          }
        });
        // the pot with the reader's bush and its little wooden tag
        const earth = pot(R, T, 0, 0, 0, 1.1);
        bush(R, T, [0, earth, 0], t, { s: 1.1 });
        rod(R, [0.2, earth - 0.05, 0.12], [0.2, earth + 0.2, 0.12], 0.008, { col: [150, 116, 78] }, 3);
        box(R, [0.2, earth + 0.2, 0.12], [0.07, 0.035, 0.008], { col: [190, 156, 108] });
        // the moons of the calendar, the one of the moment big and bright
        MOONS.forEach((c, i) => {
          const w = Math.max(0, 1 - Math.abs(wrap(i - pos)) * 1.5);
          billboard(R, c, 0.09 + 0.07 * smooth(w), 0.09 + 0.07 * smooth(w), { tex: T.phases[i], emis: true, nofog: true, cut: true, add: 0.55 + 0.45 * w });
        });
      },
      fx(t, F) {
        MOONS.forEach((c, i) => {
          const w = Math.max(0, 1 - Math.abs(wrap(i - pos)) * 1.5);
          if (w > 0.05) F.halo(c, 0.42 * w, `rgba(200,230,240,${0.18 + 0.3 * frac})`, 'rgba(200,230,240,0)');
        });
        // the dew of the night on the leaves, more under a full moon
        for (let i = 0; i < 8; i++) { const q = i * 2.3, y = 0.72 + (i % 4) * 0.15; F.dot([Math.cos(q) * 0.28, y, Math.sin(q) * 0.28], `rgba(220,240,255,${frac * (0.4 + 0.4 * Math.sin(t * 2 + i))})`, 1); }
      }
    };
  });
  // Посадка: семя падает в лунку у корней старого пня и уходит в землю; из лунки поднимается росток —
  // крючок, две семядоли, первая пара настоящих листьев, вторая — и снова уходит в землю светом. Вокруг во мху всходы,
  // каждый на шаг позади другого. Касание — посеять снова
  scene('druid', 'posadka', S => {
    const { R, T } = S, CYCLE = 10;
    let sown = 0, seed = null, burst = -1;
    // the camera stands on one side; the old stump behind the hole, its roots going round it into the moss
    const A = 0.5, D = [Math.cos(A), 0, Math.sin(A)], ST = mul(D, -0.85);
    const KIDS = [...Array(5)].map((_, i) => { const q = A - 1.5 + i / 4 * 3; return [Math.cos(q) * 1.2, Math.sin(q) * 1.2]; });
    const ROOTS = [-1.1, -0.45, 0.5, 1.15].map(d => { const q = A + Math.PI + d; return [0, 1, 2, 3].map(k => { const r = 0.42 + k * 0.32, b = d * k * 0.12; return [ST[0] + Math.cos(q - b) * r, 0.07 - k * 0.03, ST[2] + Math.sin(q - b) * r]; }); });
    return {
      orbit: [A, 0.4], rad: 4.4, near: 3.9, look: [0, 0.5, 0], still: 6.2, clear: 1.9,
      tap(t) { sown = t; },
      lights() { return [{ p: [0.3, 1.2, 0.6], col: [1, 0.86, 0.6], i: 0.7, fall: 0.6 }].concat(seed ? [{ p: seed, col: [1, 0.86, 0.5], i: 1, fall: 2 }] : []); },
      draw(t) {
        // the hole: a ring of dark earth in the moss
        disc(R, 0, 0, 0.012, 0.36, 10, { col: [40, 28, 19], layer: 0.5 });
        ringTop(R, 0, 0, 0.03, 0.36, 0.48, 10, { col: [52, 38, 26] });
        stump(R, T, ST[0], ST[2], 0.42, 0.62);
        ROOTS.forEach(P => P.slice(1).forEach((p, k) => rod(R, P[k], p, 0.06 - k * 0.015, { col: [76 - k * 3, 56 - k * 2, 38] }, 5)));
        const u = ((t - sown) % CYCLE + CYCLE) % CYCLE;
        seed = null;
        if (u < 2.4) {
          const k = smooth(u / 1.8), q = u * 3, r = 0.5 * (1 - k);
          const y = u < 1.8 ? 3 - (3 - 0.06) * k : 0.06 - (u - 1.8) / 0.6 * 0.1;
          seed = [Math.cos(q) * r, y, Math.sin(q) * r];
          egg(R, seed, [0.05, 0.07, 0.05], q, { col: [150, 104, 52] });
          egg(R, add(seed, [0, 0.05, 0]), [0.055, 0.03, 0.055], q, { col: [96, 70, 40] });
        }
        if (u < 9.5) sprout(R, T, [0, 0.02, 0], Math.min(1, (u - 2.4) / 5.6), 1.8, t);
        burst = u >= 9.3 ? (u - 9.3) / 0.7 : -1;
        // the seedlings in the moss round the hole, each on its own little mound
        KIDS.forEach(([x, z], i) => {
          egg(R, [x, 0.0, z], [0.16, 0.05, 0.16], i, { col: [46, 34, 24] });
          sprout(R, T, [x, 0.04, z], ((t / CYCLE + i / 5) % 1) * 1.25, 0.8, t + i);
        });
      },
      fx(t, F) {
        if (seed) {
          F.halo(seed, 0.36, 'rgba(255,214,120,.42)', 'rgba(255,190,90,0)');
          for (let i = 0; i < 6; i++) F.dot([seed[0], seed[1] + 0.06 + i * 0.07, seed[2]], `rgba(255,220,140,${0.8 - i * 0.12})`, 1);
        }
        const u = ((t - sown) % CYCLE + CYCLE) % CYCLE;
        if (u > 1.8 && u < 2.6) for (let i = 0; i < 10; i++) { const q = i * 0.63, l = (u - 1.8) / 0.8; F.dot([Math.cos(q) * l * 0.3, 0.04 + Math.sin(l * Math.PI) * 0.15, Math.sin(q) * l * 0.3], 'rgba(150,110,70,.9)'); }
        if (burst >= 0) for (let i = 0; i < 24; i++) { const q = i * 0.9, l = burst; F.dot([Math.cos(q) * (0.1 + l * 0.5), 0.1 + (i % 6) * 0.09 + l * 0.8, Math.sin(q) * (0.1 + l * 0.5)], `rgba(170,255,200,${1 - l})`, 1.5); }
      }
    };
  });
  // Беды и защита: к кусту ползут слизни и жуки, но круг из ягод рябины их не пускает: у круга они останавливаются,
  // ягоды вспыхивают, и вредители поворачивают назад. На сухой ветке сидит ворон и вертит головой. Касание — ворон
  // взлетает и делает круг над поляной, а вредители разбегаются
  scene('druid', 'problemy', S => {
    const { R, T } = S, WARD = 0.82, Z = 1.4;
    const PERCH = [1.02, 1.62, -0.66], BUGS = [...Array(6)].map((_, i) => ({ q: i / 6 * Math.PI * 2 + 0.3, slug: i % 2 === 0, ph: i * 1.9 }));
    let scare = -99, shine = [];
    // the fright: up at once, held, going off slowly
    const fear = t => { const u = t - scare; return u < 0 ? 0 : u < 0.8 ? smooth(u / 0.8) : Math.max(0, 1 - (u - 0.8) / 3.5); };
    // how far a bug is from the middle: it comes up to the ring, stops, goes back, comes again
    const reach = (b, t) => WARD + 0.14 + smooth(0.5 + 0.5 * Math.cos(t * 0.42 + b.ph)) * 0.75 + fear(t) * 0.8;
    // where the raven is: on its branch, or on a round over the glade after a tap
    const raven = t => {
      const u = t - scare;
      if (u < 0 || u > 6.5) return { p: PERCH, fly: 0, dir: [-1, 0, 0.2] };
      const w = smooth(u / 0.9) * (1 - smooth((u - 5.4) / 1.1)), th = Math.atan2(PERCH[2], PERCH[0]) + u * 1.1;
      const P = v => mix3(PERCH, [Math.cos(th + v) * 2.1, 2.5 + Math.sin(u * 2) * 0.2, Math.sin(th + v) * 2.1], w);
      return { p: P(0), fly: w, dir: norm(sub(P(0.05), P(0))) };
    };
    return {
      rad: 4.6, near: 4.3, look: [0, 0.8, 0], still: 5, clear: 1.7,
      tap(t) { if (t - scare > 6.5) scare = t; },
      // the warm light of the ring lies on whatever comes up to it
      lights() { return [{ p: [0, 0.5, 0], col: [1, 0.62, 0.5], i: 1.5, fall: 0.6 }]; },
      draw(t) {
        const top = stump(R, T, 0, 0, 0.34, 0.26);
        disc(R, 0, 0, top + 0.004, 0.27, 9, { col: [58, 40, 28] });
        bush(R, T, [0, top, 0], t, { s: 1 });
        // the ring of rowan: clusters of red berries on the moss
        for (let i = 0; i < 20; i++) {
          const q = i / 20 * Math.PI * 2;
          for (let k = 0; k < 3; k++) ball(R, [Math.cos(q + k * 0.04) * (WARD + (k === 1 ? 0.04 : 0)), 0.035 + (k === 2 ? 0.04 : 0), Math.sin(q + k * 0.04) * (WARD + (k === 1 ? 0.04 : 0))], 0.035, { col: [210, 52, 34], lo: true });
        }
        // the slugs and the beetles, each facing the way it goes
        // the slugs and the beetles, each facing the way it goes; B — a point of the bug: f along it, w across, y up
        shine = [];
        BUGS.forEach(b => {
          const r = reach(b, t), r1 = reach(b, t + 0.05), out = r1 > r, q = b.q + Math.sin(t * 0.3 + b.ph) * 0.15;
          const c = [Math.cos(q) * r, 0, Math.sin(q) * r], yaw = q + (out ? 0 : Math.PI), d = [Math.cos(yaw), 0, Math.sin(yaw)], sd = [-d[2], 0, d[0]];
          const moving = Math.abs(r1 - r) > 0.002, B = (f, w, y) => add(c, add(add(mul(d, f * Z), mul(sd, w * Z)), [0, y * Z, 0]));
          if (b.slug) {
            const st = moving ? 1 + 0.12 * Math.sin(t * 5 + b.ph) : 1;
            egg(R, B(0, 0, 0.06), [0.2 * st * Z, 0.065 * Z, 0.085 * Z], yaw, { col: [186, 132, 72] });
            [-1, 1].forEach(k => { const h = B(0.16 * st, k * 0.03, 0.08), e = B(0.2 * st, k * 0.035, 0.17); rod(R, h, e, 0.009 * Z, { col: [196, 146, 86] }, 3); ball(R, e, 0.016 * Z, { col: [40, 30, 24], lo: true }); });
            shine.push(B(0.02, 0, 0.13));
          } else {
            egg(R, B(0, 0, 0.065), [0.12 * Z, 0.07 * Z, 0.09 * Z], yaw, { col: [52, 112, 96] });
            ball(R, B(0.12, 0, 0.055), 0.045 * Z, { col: [26, 34, 30] });
            for (let k = 0; k < 3; k++) for (const w of [-1, 1]) {
              const f = (k - 1) * 0.065, wig = moving ? Math.sin(t * 14 + k * 2 + w) * 0.025 : 0;
              rod(R, B(f, 0, 0.04), B(f * 2 + wig, w * 0.13, 0), 0.008 * Z, { col: [24, 28, 24] }, 3);
            }
            shine.push(B(-0.02, 0.03, 0.135));
          }
        });
        // the dead branch and the raven on it, or in the air
        rod(R, [1.3, -0.02, -0.72], [1.3, 1.5, -0.7], 0.05, { col: [96, 86, 76] }, 5);
        rod(R, [1.3, 1.36, -0.7], [0.9, 1.6, -0.64], 0.03, { col: [96, 86, 76] }, 4);
        rod(R, [1.3, 1.1, -0.7], [1.55, 1.35, -0.9], 0.02, { col: [96, 86, 76] }, 3);
        const rv = raven(t), d = rv.dir, side = norm(cross(d, [0, 1, 0])), p = add(rv.p, [0, 0.1, 0]), look = rv.fly ? 0 : Math.sin(t * 0.9) * 0.6;
        egg(R, p, [0.16, 0.09, 0.08], Math.atan2(d[2], d[0]), { col: [22, 24, 30] });
        const hd = add(add(p, mul(d, 0.15)), [0, 0.07, 0]), hl = norm(add(d, mul(side, look)));
        ball(R, hd, 0.06, { col: [26, 28, 34] });
        R.tri(add(hd, add(mul(hl, 0.04), [0, 0.012, 0])), add(hd, add(mul(hl, 0.04), [0, -0.016, 0])), add(hd, mul(hl, 0.13)), { col: [70, 70, 76], ds: true });
        R.tri(add(p, mul(d, -0.12)), add(add(p, mul(d, -0.3)), mul(side, 0.06)), add(add(p, mul(d, -0.3)), mul(side, -0.06)), { col: [18, 20, 26], ds: true });
        // the wings: folded along the body on the branch, beating in the air
        const flap = rv.fly ? Math.sin(t * 13) * 0.9 * rv.fly + 0.2 : -1.1;
        [-1, 1].forEach(sd => {
          const sh = add(p, [0, 0.04, 0]), out = add(mul(side, sd * Math.cos(flap) * 0.34), [0, Math.sin(flap) * 0.3, 0]);
          R.tri(add(sh, mul(d, 0.08)), add(sh, mul(d, -0.12)), add(add(sh, out), mul(d, -0.08)), { col: [28, 30, 38], ds: true });
        });
      },
      fx(t, F) {
        // the berries flaring where a bug has come up to the ring
        BUGS.forEach(b => {
          const near = 1 - (reach(b, t) - WARD - 0.14) / 0.3;
          if (near > 0) F.halo([Math.cos(b.q) * WARD, 0.08, Math.sin(b.q) * WARD], 0.28, `rgba(255,90,60,${0.5 * near})`, 'rgba(255,90,60,0)');
        });
        // the wet shine on the slugs' backs and the beetles' shells
        shine.forEach(p => F.dot(p, 'rgba(255,244,214,.55)', 1.3));
        const k = fear(t);
        if (k > 0) for (let i = 0; i < 20; i++) { const q = i / 20 * Math.PI * 2; F.dot([Math.cos(q) * WARD, 0.1 + k * 0.3, Math.sin(q) * WARD], `rgba(255,120,90,${k * 0.8})`, 1.4); }
      }
    };
  });
  // Сорта: пять сортов на пнях вокруг старого дуба. Выбранный стоит в столбе лунного света и светится; по кругу
  // выходит вперёд следующий — сам или по касанию
  scene('druid', 'sorta', S => {
    const { R, T } = S, N = 5, STEP = 6, RAD = 1.5, A = 0.75, O = [-Math.cos(A) * 0.5, 0, -Math.sin(A) * 0.5];
    const KINDS = [
      { tex: T.leaf, col: [84, 150, 56], leaf: 1.2 },                                       // «Генуэзский»: big leaves
      { tex: T.leafOpal, col: [98, 38, 96], stem: [96, 40, 98] },                           // «Тёмный опал»: purple
      { tex: T.leaf, col: [84, 150, 56], ball: true },                                      // «Греческий»: a ball of small leaves
      { tex: T.leafThai, col: [62, 124, 48], stem: [112, 48, 116], spike: true, leaf: 0.85 }, // «Тайский»: purple stem and flowers
      { tex: T.leafLemon, col: [156, 196, 84], w: 0.24, leaf: 1.05 }                        // «Лимонный»: narrow and pale
    ];
    const BALL = [...Array(20)].map((_, i) => { const y = 1 - (i + 0.5) / 20 * 1.6, r = Math.sqrt(Math.max(0, 1 - y * y)), q = i * 2.4; return norm([Math.cos(q) * r, y, Math.sin(q) * r]); });
    const SMALL = PAIRS.slice(0, 3).concat([[0.9, 0.2, -0.45]]);
    const glide = glider(1.6);
    let taps = 0, pos = 0, chosen = [0, 0, 0];
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      // the camera looks at the place in front where the chosen sort stands, the oak behind it
      orbit: [A, 0.4], rad: 4.6, near: 4.3, look: [Math.cos(A) * 0.6, 0.95, Math.sin(A) * 0.6], still: 1, clear: 2.1,
      tap() { taps++; },
      tick(t) {
        const target = Math.floor(t / STEP) + taps;
        pos = glide(target, t);
      },
      lights() { return [{ p: [chosen[0], 1.9, chosen[2]], col: [0.75, 0.9, 1], i: 1.3, fall: 0.5 }]; },
      draw(t) {
        // the old oak in the middle of the ring, a little behind: a thick trunk, its roots, a dark crown above
        prism(R, O[0], O[2], 0, 2.9, 0.38, 0.26, 8, { tex: T.bark });
        [0, 1.3, 2.5, 3.8, 5.1].forEach(q => rod(R, [O[0] + Math.cos(q) * 0.4, 0.2, O[2] + Math.sin(q) * 0.4], [O[0] + Math.cos(q) * 0.9, -0.02, O[2] + Math.sin(q) * 0.9], 0.08, { col: [72, 52, 36] }, 5));
        [[0, 3.5, 0, 1.3], [0.8, 3.1, 0.4, 0.9], [-0.8, 3.2, -0.3, 0.95], [0.2, 3.3, -0.9, 0.85], [-0.3, 3.2, 0.9, 0.85]].forEach(([x, y, z, r], i) => egg(R, [O[0] + x, y, O[2] + z], [r, r * 0.7, r], i, { col: [28 + i * 3, 52 + i * 3, 34] }));
        KINDS.forEach((k, i) => {
          const d = wrap(i - pos), w = Math.max(0, 1 - Math.abs(d) * 1.4), q = A + d * Math.PI * 2 / N, sz = 0.78 + 0.22 * smooth(w);
          const x = O[0] + Math.cos(q) * RAD, z = O[2] + Math.sin(q) * RAD;
          if (w > 0.5) chosen = [x, 0, z];
          const flat = Math.abs(d) > 0.6 ? k.col : null;
          // every sort turns slowly on its stump at one speed (a turn by w·t would spin the one coming forward round in a moment)
          const top = stump(R, T, x, z, 0.26, 0.32 + smooth(w) * 0.06), b = [x, top, z], yaw = t * 0.35 + i * 1.3;
          if (k.ball) {
            rod(R, b, [x, top + 0.2, z], 0.02, { col: [70, 128, 48] });
            BALL.forEach((F, j) => leaf(R, add([x, top + 0.34 * sz, z], mul(F, 0.08 * sz)), norm(add(F, [Math.sin(t * 1.3 + j) * 0.08, 0, 0])), 0.16 * sz, T.leaf, { w: 0.46, flat }));
          } else {
            const tp = bush(R, T, b, t + i, { s: sz, tex: k.tex, stem: k.stem, leaf: k.leaf, w: k.w, yaw, pairs: SMALL, flat });
            if (k.spike) {
              prism(R, tp[0], tp[2], tp[1], tp[1] + 0.26, 0.035, 0.004, 5, { col: [150, 70, 176] });
              for (let j = 0; j < 4; j++) ball(R, [tp[0], tp[1] + 0.04 + j * 0.06, tp[2]], 0.035 - j * 0.005, { col: [196, 120, 220], lo: true });
            }
          }
        });
      },
      fx(t, F) {
        shaft(R, [chosen[0] + 0.5, 6, chosen[2] - 0.3], [chosen[0], 0, chosen[2]], 0.45, 0.16);
        F.halo([chosen[0], 0.9, chosen[2]], 0.7, 'rgba(190,230,255,.2)', 'rgba(190,230,255,0)');
        for (let i = 0; i < 12; i++) {
          const life = (i / 12 + t * 0.2) % 1, q = i * 2.4 + t;
          F.dot([chosen[0] + Math.cos(q) * 0.32, 0.4 + life * 2.2, chosen[2] + Math.sin(q) * 0.32], `rgba(214,240,255,${(1 - life) * 0.8})`, 1);
        }
      }
    };
  });
  // Справка: высокий камень с огамической надписью вдоль ребра. Зарубки загораются одна за другой снизу вверх, как
  // строка, которую читают, и руны на камнях круга разгораются вместе с ней; строка прочитана — гаснет, и начинается
  // следующая. У подножия растёт куст. Касание — следующая строка
  scene('druid', 'spravka', S => {
    const { R, T } = S, H = 2.3, ANG = 0.7, STEP = 0.5, N = 9, DUR = N * STEP + 1.8;
    const r0 = 0.42, r1 = 0.26, rAt = y => r0 + (r1 - r0) * y / H;
    // the lines: letters of one to five strokes — on the face to the right of the edge (0), to the left (1), across the
    // edge (2), notches on the edge itself (3)
    const LINES = [...Array(4)].map((_, l) => { const r = rng(31 + l * 7); return [...Array(N)].map(() => ({ kind: r() * 4 | 0, n: 1 + (r() * 5 | 0) })); });
    const E = [Math.cos(ANG), 0, Math.sin(ANG)];
    const along = a => norm([Math.cos(ANG + a) - Math.cos(ANG), 0, Math.sin(ANG + a) - Math.sin(ANG)]);
    const FA = along(Math.PI / 2), FB = along(-Math.PI / 2);
    const OA = [Math.cos(ANG + Math.PI / 4), 0, Math.sin(ANG + Math.PI / 4)], OB = [Math.cos(ANG - Math.PI / 4), 0, Math.sin(ANG - Math.PI / 4)];
    let line = 0, start = 0, u = 0, read = 0;
    const edge = y => mul([E[0], y / rAt(y), E[2]], rAt(y));
    return {
      orbit: [ANG, 0.45], near: 4.6, rad: 5, look: [0, 1.2, 0], still: 4, clear: 1.4,
      rune: () => 0.35 + read * 0.6,
      tap(t) { line++; start = t; },
      tick(t) {
        while (t - start > DUR) { start += DUR; line++; }
        u = t - start;
        read = clamp(u / (N * STEP), 0, 1) * (1 - smooth((u - N * STEP - 1.2) / 0.6));
      },
      lights() { const y = 0.35 + Math.min(N - 1, Math.floor(u / STEP)) * 0.2; return [{ p: add(mul(E, 0.9), [0, y, 0]), col: [0.55, 1, 0.82], i: 0.9 * read + 0.2, fall: 1.2 }]; },
      draw(t) {
        prism(R, 0, 0, -0.05, H, r0, r1, 4, { tex: T.menhir }, [88, 92, 96], ANG);
        // the strokes, cut into the stone: dark, lit one letter after another
        const out = 1 - smooth((u - N * STEP - 1.2) / 0.6);
        LINES[line % LINES.length].forEach((L, j) => {
          const lit = clamp((u - j * STEP) / 0.3, 0, 1) * out, col = lit ? { col: mix3([46, 50, 54], [150, 255, 214], lit), emis: true, nofog: true } : { col: [46, 50, 54] };
          for (let k = 0; k < L.n; k++) {
            const y = 0.35 + j * 0.2 + (k - (L.n - 1) / 2) * 0.034, p = edge(y);
            if (L.kind === 0) rod(R, add(p, mul(OA, 0.012)), add(add(p, mul(FA, 0.11)), mul(OA, 0.012)), 0.01, col, 3);
            else if (L.kind === 1) rod(R, add(p, mul(OB, 0.012)), add(add(p, mul(FB, 0.11)), mul(OB, 0.012)), 0.01, col, 3);
            else if (L.kind === 2) rod(R, add(add(p, mul(FA, 0.08)), [0, 0.03, 0]), add(add(p, mul(FB, 0.08)), [0, -0.03, 0]), 0.01, col, 3);
            else ball(R, add(p, mul(E, 0.01)), 0.018, { ...col, lo: true });
          }
        });
        // the stem line of the writing along the edge
        rod(R, add(edge(0.2), mul(E, 0.008)), add(edge(0.35 + N * 0.2), mul(E, 0.008)), 0.006, { col: read ? mix3([46, 50, 54], [120, 220, 190], read) : [46, 50, 54], emis: !!read }, 3);
        // the bush at the foot of the stone, on its mound of earth
        const bq = ANG - 0.95, bx = Math.cos(bq) * 0.8, bz = Math.sin(bq) * 0.8;
        egg(R, [bx, 0, bz], [0.24, 0.08, 0.24], 0, { col: [56, 40, 28] });
        bush(R, T, [bx, 0.06, bz], t, { s: 0.85 });
      },
      fx(t, F) {
        LINES[line % LINES.length].forEach((L, j) => {
          const lit = clamp((u - j * STEP) / 0.3, 0, 1) * (1 - smooth((u - N * STEP - 1.2) / 0.6));
          if (lit > 0.05) F.halo(add(edge(0.35 + j * 0.2), mul(E, 0.04)), 0.16 + 0.06 * (j === Math.floor(u / STEP) ? 1 : 0), `rgba(143,232,198,${0.32 * lit})`, 'rgba(143,232,198,0)');
        });
      }
    };
  });
  // Удобрения: три котла на камнях вокруг куста, над каждым в пару висит его руна — ᚾ, ᛈ и ᚲ, азот, фосфор и калий.
  // По очереди котёл отдаёт свой свет земле: свет уходит под мох и бежит по корню к кусту, корень за ним светится,
  // потом свет поднимается по стеблю. Касание — следующий котёл сейчас
  scene('druid', 'udobreniya', S => {
    const { R, T } = S, EVERY = 3.8, FLOW = 1.5, CLIMB = 1.1, ROOT = [76, 56, 38];
    const COL = [[130, 196, 255], [255, 128, 82], [255, 210, 92]];
    const CA = [0, 1, 2].map(i => { const q = Math.PI / 2 + i / 3 * Math.PI * 2; return [Math.cos(q) * 1.4, Math.sin(q) * 1.4]; });
    // the root from the foot of a cauldron to the bush, just over the moss and bending a little: u 0…1 along it
    const root = (i, u) => {
      const [x, z] = CA[i], s = Math.sin(u * Math.PI) * 0.22 / 1.4, f = (1 - u) * 0.86;
      return [x * f - z * s, 0.025, z * f + x * s];
    };
    let taps = [], flow = null, climb = null, top = 0.3;
    return {
      rad: 5, near: 4.6, look: [0, 0.9, 0], still: 2.2, clear: 2,
      rune: t => 0.5 + 0.15 * Math.sin(t * 1.1) + (climb ? 0.6 * Math.sin(climb.f * Math.PI) : 0),
      tap(t) { taps.push({ t, k: (taps.length + 1 + Math.floor(t / EVERY)) % 3 }); if (taps.length > 3) taps.shift(); },
      tick(t) {
        // the sends: one every few seconds by itself, in turn, and one at each tap
        const n = Math.floor(t / EVERY);
        const sends = [{ t: n * EVERY, k: n % 3 }, { t: (n - 1) * EVERY, k: (n + 2) % 3 }].concat(taps).filter(s => s.t <= t).sort((a, b) => b.t - a.t);
        flow = climb = null;
        for (const s of sends) {
          const u = t - s.t;
          if (!flow && u < FLOW) flow = { k: s.k, f: u / FLOW };
          else if (!climb && u >= FLOW && u < FLOW + CLIMB) climb = { k: s.k, f: (u - FLOW) / CLIMB };
        }
      },
      lights(t) {
        const L = CA.map(([x, z], i) => ({ p: [x, 0.6, z], col: COL[i].map(v => v / 255), i: 0.4 + 0.08 * Math.sin(t * 3 + i), fall: 1.2 }));
        if (flow) L.push({ p: add(root(flow.k, flow.f), [0, 0.15, 0]), col: COL[flow.k].map(v => v / 255), i: 1, fall: 1.4 });
        if (climb) L.push({ p: [0, top + 0.1 + climb.f * 0.9, 0.12], col: COL[climb.k].map(v => v / 255), i: 1.6 * Math.sin(climb.f * Math.PI), fall: 1.4 });
        return L;
      },
      draw(t) {
        top = stump(R, T, 0, 0, 0.38, 0.3);
        disc(R, 0, 0, top + 0.004, 0.3, 9, { col: [58, 40, 28] });
        bush(R, T, [0, top, 0], t, { s: 1.05 });
        if (climb) rod(R, [0, top, 0], [0, top + climb.f * 0.8, 0], 0.03, { col: COL[climb.k], emis: true, nofog: true });
        CA.forEach(([x, z], i) => {
          // the root to the bush, lit behind the light running along it and going dark again
          for (let j = 0; j < 8; j++) {
            const u0 = j / 8, u1 = (j + 1) / 8, lit = flow && flow.k === i && flow.f >= u1 ? clamp(1 - (flow.f - u1) * 2, 0, 1) : 0;
            rod(R, root(i, u0), root(i, u1), 0.03 - j * 0.002, lit ? { col: mix3(ROOT, COL[i], lit), emis: true } : { col: ROOT }, 4);
          }
          // three stones under the cauldron, the embers between them
          for (let k = 0; k < 3; k++) { const q = k / 3 * Math.PI * 2 + i; egg(R, [x + Math.cos(q) * 0.2, 0.06, z + Math.sin(q) * 0.2], [0.09, 0.07, 0.08], q, { col: [88, 90, 94] }); }
          for (let k = 0; k < 4; k++) ball(R, [x + Math.cos(k * 1.7) * 0.07, 0.04, z + Math.sin(k * 1.7) * 0.07], 0.035, { col: [255, 120 + 40 * Math.sin(t * 6 + k) | 0, 40], emis: true, lo: true });
          // the cauldron: a belly of black iron, its rim, the liquid of its element; its rune floating in the steam
          prism(R, x, z, 0.12, 0.3, 0.13, 0.25, 9, { col: [38, 40, 44] });
          prism(R, x, z, 0.3, 0.44, 0.25, 0.21, 9, { col: [44, 46, 50] });
          ringTop(R, x, z, 0.44, 0.19, 0.235, 9, { col: [60, 62, 66] });
          disc(R, x, z, 0.42, 0.19, 9, { col: COL[i], emis: true });
          billboard(R, [x, 0.98 + Math.sin(t * 1.3 + i * 2) * 0.05, z], 0.13, 0.13, { tex: T.npk[i], emis: true, nofog: true, cut: true, add: flow && flow.k === i ? 1 : 0.6 });
        });
        if (flow) ball(R, root(flow.k, flow.f), 0.05, { col: COL[flow.k], emis: true, nofog: true });
      },
      fx(t, F) {
        CA.forEach(([x, z], i) => {
          F.halo([x, 0.46, z], 0.32, `rgba(${COL[i]},.3)`, `rgba(${COL[i]},0)`);
          F.halo([x, 0.98, z], 0.22, `rgba(${COL[i]},${flow && flow.k === i ? 0.45 : 0.2})`, `rgba(${COL[i]},0)`);
          for (let j = 0; j < 6; j++) { const k = (t * 0.5 + j / 6 + i * 0.3) % 1; F.dot([x + Math.sin(j * 2 + t * 1.5) * 0.08 * (1 + k), 0.46 + k * 0.5, z + Math.cos(j * 3 + t) * 0.06], `rgba(220,236,230,${0.5 * (1 - k)})`, 1.6); }
        });
        if (flow) F.halo(root(flow.k, flow.f), 0.3, `rgba(${COL[flow.k]},.55)`, `rgba(${COL[flow.k]},0)`);
        if (climb) F.halo([0, top + climb.f * 0.8, 0], 0.4, `rgba(${COL[climb.k]},.4)`, `rgba(${COL[climb.k]},0)`);
      }
    };
  });
  // Уход: над кругом камней идёт солнце, и куст поворачивается за ним, а его тень на мху — от солнца; потом луна.
  // Раз в день приходит туча и поливает куст, на листьях блестит роса. Касание — дождь сейчас
  scene('druid', 'uhod', S => {
    const { R, T } = S, DAY = 24, RAIN = 5;
    let tapped = -99, orb = [0, 3, 0], day = 1, rise = 1, cloud = null, wet = 0, lean = [0, 0];
    return {
      rad: 4.9, near: 4.6, look: [0, 1.2, 0], still: 4, shafts: false,
      tap(t) { tapped = t; },
      tick(t) {
        const s = (t % DAY) / DAY, sun = s < 0.72, a = sun ? s / 0.72 * Math.PI : (s - 0.72) / 0.28 * Math.PI, up = Math.sin(a);
        day = sun ? up : 0;
        // the sun and the moon go down into the horizon and come up out of it: small there, never jumping across; the
        // light of the sky goes over from the moon's to the sun's and back without a jump
        rise = smooth(up / 0.3);
        orb = [-Math.cos(a) * 2.6, 1.6 + up * 2, -0.9];
        R.key = { dir: norm(sub(orb, [0, 1, 0])), i: 0.3 + (sun ? 0.75 * day : 0.12 * rise), col: mix3([0.55, 0.7, 1], [1, 0.88, 0.66], sun ? smooth(day / 0.3) : 0) };
        const want = sun ? [orb[0] * 0.09 * day, 0] : [0, 0];
        lean = reduce.matches ? want : [lean[0] + (want[0] - lean[0]) * 0.04, 0];
        const rainAt = Math.max(Math.floor((t - 5) / DAY) * DAY + 5, tapped), r = t - rainAt;
        // the cloud comes in and goes, swelling out of nothing and melting away at the side
        cloud = r >= 0 && r < RAIN ? { x: r < 1.2 ? -2.8 * (1 - smooth(r / 1.2)) : r > RAIN - 1.2 ? 2.8 * smooth((r - RAIN + 1.2) / 1.2) : 0, k: smooth(r / 0.7) * (1 - smooth((r - RAIN + 0.7) / 0.7)), rain: r > 1 && r < RAIN - 1 } : null;
        wet = r < 0 ? 0 : r < RAIN ? Math.min(1, Math.max(0, r - 1.2) / 2) : Math.max(0, 1 - (r - RAIN) / 9);
      },
      lights() { return [{ p: orb, col: day > 0 ? [1, 0.86, 0.55] : [0.6, 0.72, 1], i: rise * (day > 0 ? 0.6 + day : 0.5), fall: 0.1 }]; },
      draw(t) {
        // the shadow of the bush on the moss, away from the sun
        const sh = [-orb[0] * 0.18, 0, -orb[2] * 0.18], k = day > 0 ? 0.6 * day : 0.2;
        for (let i = 0; i < 10; i++) { const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2; R.tri([sh[0], 0.01, sh[2]], [sh[0] + Math.cos(a0) * 0.7, 0.01, sh[2] + Math.sin(a0) * 0.4], [sh[0] + Math.cos(a1) * 0.7, 0.01, sh[2] + Math.sin(a1) * 0.4], { col: [10 * (1 - k) + 8, 16 * (1 - k) + 10, 12 * (1 - k) + 8], layer: 0.5, ds: true, emis: true }); }
        const top = stump(R, T, 0, 0, 0.42, 0.36);
        disc(R, 0, 0, top + 0.005, 0.3, 9, { col: [64 - wet * 30, 46 - wet * 22, 30 - wet * 14] });
        bush(R, T, [0, top, 0], t, { s: 1.2, lean });
        if (rise > 0.02) ball(R, orb, (day > 0 ? 0.22 : 0.16) * rise, { col: day > 0 ? [255, 222, 140] : [220, 230, 255], emis: true, nofog: true });
        if (cloud && cloud.k > 0.02) [[0, 0, 0.3], [0.26, -0.06, 0.24], [-0.28, -0.05, 0.24], [0.12, 0.12, 0.2], [-0.12, 0.1, 0.2]].forEach(([dx, dy, r]) => ball(R, [cloud.x + dx * cloud.k, 3 + dy * cloud.k, dx * 0.3], r * cloud.k, { col: [86, 96, 104] }));
      },
      fx(t, F) {
        if (rise > 0.02) F.halo(orb, (day > 0 ? 1.3 : 0.7) * rise, day > 0 ? `rgba(255,214,140,${(0.22 + 0.3 * day) * rise})` : `rgba(170,190,255,${0.24 * rise})`, 'rgba(255,214,140,0)');
        if (cloud && cloud.rain) for (let i = 0; i < 32; i++) {
          const k = (t * 1.6 + i * 0.37) % 1, x = cloud.x + ((i * 0.61) % 1 - 0.5) * 0.8, z = ((i * 0.43) % 1 - 0.5) * 0.6;
          F.streak([x, 2.85 - k * 1.5, z], 0.14, 'rgba(170,210,255,.7)');
        }
        // the dew on the leaves, brighter just after the rain
        if (wet > 0.05) for (let i = 0; i < 10; i++) { const q = i * 2.1 + 0.4, y = 0.55 + (i % 5) * 0.16; F.dot([Math.cos(q) * 0.3, y, Math.sin(q) * 0.3], `rgba(220,245,255,${wet * (0.5 + 0.5 * Math.sin(t * 3 + i))})`, 1); }
      }
    };
  });
  // Вкус и кухня: котёл на треноге над костром, в нём зелёное варево; в котёл падают листья базилика, из пара поднимается
  // аромат — молекула эвгенола, ягоды омелы и рябины на веточках — и тает. Касание — горсть листьев
  scene('druid', 'vkus', S => {
    const { R, T } = S, mol = molShape('eug'), RIM = 0.98;
    const PAL = { bond: [168, 124, 76], O: [236, 70, 52], C: [244, 240, 222], lo: true };
    const FALL = [...Array(6)].map((_, i) => ({ a: i / 6, x: ((i * 0.61) % 1 - 0.5) * 0.6, z: ((i * 0.37) % 1 - 0.5) * 0.5, s: 0.7 + (i % 3) * 0.12 }));
    let hands = [];
    // a leaf tumbling down from above into the cauldron, k — how far it has fallen
    const falling = (x, z, k, spin) => {
      const y = 3 - k * (3 - RIM - 0.02);
      leaf(R, [x * (1 - k * 0.7), y, z * (1 - k * 0.7)], norm([Math.cos(spin), Math.sin(spin * 0.7) * 0.8, Math.sin(spin)]), 0.24, T.leaf, { side: [Math.sin(spin * 1.3), 0.5, Math.cos(spin * 1.3)] });
    };
    return {
      near: 4.6, look: [0, 1.2, 0], still: 2.4, clear: 1.6, shafts: false,
      tap(t) { hands.push(t); if (hands.length > 3) hands.shift(); },
      lights(t) { return [{ p: [0, 0.4, 0.1], col: [1, 0.62, 0.3], i: 1.5 + 0.25 * Math.sin(t * 9) + 0.15 * Math.sin(t * 23), fall: 0.5 }, { p: [0, RIM + 0.3, 0], col: [0.6, 1, 0.5], i: 0.4, fall: 2 }]; },
      draw(t) {
        campfire(R, T, 0, 0, 1.25, t);
        // the tripod of three poles, the chain, the bail of the cauldron
        for (let k = 0; k < 3; k++) { const q = k / 3 * Math.PI * 2 + 0.5; rod(R, [Math.cos(q) * 0.85, -0.02, Math.sin(q) * 0.85], [Math.cos(q) * 0.05, 1.95, Math.sin(q) * 0.05], 0.035, { col: [90, 66, 44] }, 5); }
        rod(R, [0, 1.9, 0], [0, RIM + 0.26, 0], 0.01, { col: [80, 80, 84] }, 3);
        for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI, a1 = (k + 1) / 6 * Math.PI; rod(R, [Math.cos(a0) * 0.37, RIM + Math.sin(a0) * 0.26, 0], [Math.cos(a1) * 0.37, RIM + Math.sin(a1) * 0.26, 0], 0.012, { col: [70, 70, 74] }, 3); }
        // the cauldron of black iron and the green in it
        prism(R, 0, 0, 0.5, 0.74, 0.18, 0.4, 10, { col: [36, 38, 42] });
        prism(R, 0, 0, 0.74, RIM, 0.4, 0.34, 10, { col: [42, 44, 48] });
        ringTop(R, 0, 0, RIM, 0.31, 0.37, 10, { col: [62, 64, 68] });
        disc(R, 0, 0, RIM - 0.03, 0.32, 10, { tex: T.paste });
        // the leaves falling in: a steady few, and a handful at a tap
        FALL.forEach((f, i) => { const k = (f.a + t * 0.2) % 1; falling(f.x, f.z, smooth(k), t * f.s * 2 + i); });
        hands = hands.filter(h => t - h < 1.6 && t >= h);
        hands.forEach(h => { for (let i = 0; i < 6; i++) { const k = smooth(Math.min(1, (t - h) / 1.2 - i * 0.04)); if (k > 0) falling(Math.cos(i * 1.1) * 0.4, Math.sin(i * 1.1) * 0.35, k, t * 2 + i); } });
        // the aroma: the molecule going up out of the steam and fading as it goes
        if (mol) { const k = (t * 0.11) % 1; essence(R, mol, [0, RIM + 0.4 + k * 1.2, 0], t * 0.6, 1.25, Math.sin(k * Math.PI) * 0.95, PAL); }
      },
      fx(t, F) {
        const k = (t * 0.11) % 1;
        F.halo([0, RIM + 0.4 + k * 1.2, 0], 0.5, `rgba(255,236,190,${0.2 * Math.sin(k * Math.PI)})`, 'rgba(255,236,190,0)');
        F.halo([0, 0.3, 0], 0.9, 'rgba(255,150,70,.24)', 'rgba(255,150,70,0)');
        // the steam over the green, the sparks of the fire going up round the cauldron
        for (let i = 0; i < 14; i++) {
          const l = (i / 14 + t * 0.16) % 1, q = i * 2.4 + t * 0.5;
          F.dot([Math.cos(q) * (0.1 + l * 0.35), RIM + 0.05 + l * 1.3, Math.sin(q) * (0.1 + l * 0.35)], `rgba(214,232,220,${0.5 * (1 - l)})`, 2);
        }
        for (let i = 0; i < 10; i++) { const l = (i / 10 + t * 0.5) % 1, q = i * 1.7; F.spark([Math.cos(q) * (0.45 + l * 0.2), 0.3 + l * 1.4, Math.sin(q) * (0.45 + l * 0.2)], l); }
      }
    };
  });
  /* ------------------------------------------------------------------ */
  /* «Друид»: a night grove of a northern game round every scene — moss  */
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
    // the lines of the circle drawn smooth — strokes of the canvas, not pixels: close to the camera they stay lines, not
    // steps — on a canvas of its own (to glow, 512 pixels, nothing round them) or over the moss
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

  // the floor of the circle — the moss and the glowing lines on it — laid straight on the canvas, a few rows of the
  // screen at a time. The camera never leans, so along a row of the screen the ground lies at one depth: each strip
  // takes its texture by a single affine map — true in perspective, crisp, never bent at the seams of triangles. The
  // moss is lit once for the whole floor (the moon falls the same on all of it), the low lights of the scene lie on it as
  // pools of their colour, the fog goes by the depth of each strip; the glow only in the ring and in the middle
  const FL = 3.3;
  function mossFloor(R, T, x, glowA) {
    const C = R.C, fc = C.focal, W = R.W, H = R.H, F = R.fog, k = T.moss.width / (2 * FL);
    const key = R.key, kd = key ? Math.max(0, key.dir[1]) * key.i : 0;
    const moss = shaded(T.moss, [0, 1, 2].map(i => R.amb[i] + (key ? kd * key.col[i] : 0)), 0, F, 24);
    const pat = c => c.psxPat || (c.psxPat = x.createPattern(c, 'repeat'));
    const step = Math.max(2, Math.round(H / 120));
    // the ground under the screen's row y: the point Q under its middle (x = cx), S — how far one pixel along it goes,
    // s — its depth
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
    const span = (y, a0, a1) => { const p0 = Math.max(0, Math.floor(a0)), p1 = Math.min(W, Math.ceil(a1)); if (p1 > p0) x.fillRect(p0, y, p1 - p0, step); };
    x.save();
    for (let y = 0; y < H; y += step) {
      const ym = y + step / 2, g = row(ym), g1 = row(ym + 1);
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
      const pm = pat(moss);
      pm.setTransform(M);
      x.fillStyle = pm;
      span(y, c[0], c[1]);
      const f = clamp((g.s - R.fogNear) / (R.fogFar - R.fogNear), 0, 1) ** 1.15;
      if (f > 0.01) { x.fillStyle = `rgba(${F[0]},${F[1]},${F[2]},${f})`; span(y, c[0], c[1]); }
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
  // a standing stone with its rune on the side towards the middle; k — how bright the rune burns
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
      // where the camera stands (it swings about this angle, so far from the middle): stones, boulders and trees keep to
      // the far side and the flanks, the grass to the inside of the circle — nothing big and dark in front of the lens
      const CA = sc.orbit[0], CR = Math.min(sc.rad, sc.near);
      const off = q => Math.abs(((q - CA) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
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
      const GR = Math.max(clear + 0.6, Math.min(5.2, CR - 1.4));
      while (TUFTS.length < 90) {
        const r = clear + RR() * (GR - clear), q = RR() * Math.PI * 2, x = Math.cos(q) * r, z = Math.sin(q) * r;
        if ((sc.noGrass && sc.noGrass(x, z)) || (off(q) < 1.1 && r > 1.8)) continue;
        TUFTS.push({ x, z, y: groundY(x, z), h: 0.1 + RR() * 0.14, ph: RR() * 6, col: [50 + RR() * 30, 84 + RR() * 40, 38 + RR() * 18], yaw: RR() * 3 });
      }
      const STONES = sc.stones === false ? [] : [...Array(6)].map((_, i) => { const q = CA + Math.PI + (i / 5 - 0.5) * 2.7; return { x: Math.cos(q) * 3.05, z: Math.sin(q) * 3.05, q, h: 1.1 + ((i * 37) % 10) / 14 }; });
      const TREES = [...Array(14)].map((_, i) => { const q = CA + Math.PI + (i / 13 - 0.5) * 4.3 + ((i * 13) % 7) / 30, r = 6.2 + ((i * 29) % 10) / 3.2; return { x: Math.cos(q) * r, z: Math.sin(q) * r, birch: i % 4 === 1, h: 4.4 + (i % 5) * 0.55 }; });
      const ROCKS = [[0.5, 2.6, 0.32], [-0.6, 2.8, 0.26], [1.25, 2.4, 0.22], [-1.3, 2.5, 0.3]].map(([d, r, s]) => { const q = CA + Math.PI + d; return [Math.cos(q) * r, Math.sin(q) * r, s]; }).filter(([x, z]) => !(sc.noGrass && sc.noGrass(x, z)));
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

  /* The molecule viewer in «Друид»: the same molecule, turned the same way — carbon white berries of mistletoe,
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
  /* the grove behind the page of «Друид»: the night itself is a still   */
  /* gradient (28-druid.css), boughs of fir and a birch twig hang in from */
  /* the corners and stand still, ferns rise at the foot, fireflies      */
  /* wander and glow on a small canvas. Nothing follows the scroll: the   */
  /* page goes over a calm layer, and the fireflies rest with the rest    */
  /* of the page when it falls asleep                                     */
  /* ------------------------------------------------------------------ */
  function forest() {
    const el = doc.createElement('div');
    el.id = 'psx-forest';
    el.setAttribute('aria-hidden', 'true');
    el.dataset.bg = '';
    const R = rng(23), f = v => Math.round(v * 10) / 10;

    // a shoot of a fir from (x, y) heading at the angle a: it sags under its own weight a little more at every step,
    // short needles stand all along it like a bottle brush (shorter to the tip), side shoots leave it in turn and sag too
    function fir(x, y, a, len, sag, depth, out) {
      const N = Math.max(5, Math.round(len / 5)), pts = [];
      let d = `M${f(x)} ${f(y)}`;
      for (let i = 1; i <= N; i++) {
        a = Math.atan2(Math.sin(a) + sag, Math.cos(a));
        x += Math.cos(a) * len / N; y += Math.sin(a) * len / N;
        d += `L${f(x)} ${f(y)}`;
        pts.push([x, y, a, i / N]);
      }
      out.stems.push(`<path d="${d}" stroke-width="${f(depth ? 2.6 : 1.3)}"/>`);
      const nl = Math.min(13, 4 + len / 28);
      pts.forEach(([px, py, pa, u]) => {
        for (const s of [-1, 1]) {
          const q = pa + s * (0.75 + R() * 0.35), l = nl * (1 - u * 0.45) * (0.8 + R() * 0.4);
          out.needles.push(`M${f(px)} ${f(py)}l${f(Math.cos(q) * l)} ${f(Math.sin(q) * l + l * 0.25)}`);
        }
      });
      if (depth > 0) for (let i = 3, k = 0; i < N - 3; i += 3, k++) {
        const [px, py, pa, u] = pts[i], s = k % 2 ? 1 : -1;
        fir(px, py, pa + s * (0.6 + R() * 0.25), len * 0.36 * (1 - u * 0.6) + 10, sag * 1.6, depth - 1, out);
      }
    }
    const firSvg = (box, start) => {
      const out = { stems: [], needles: [] };
      fir(...start, 1, out);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"><g class="tw-wood">${out.stems.join('')}</g><path class="tw-needle" d="${out.needles.join('')}"/></svg>`;
    };
    // a birch twig hanging from the top: a thin wavering stem, leaves on short stalks to either side, two catkins
    const birchSvg = () => {
      let d = 'M60 0', x = 60, y = 0, leaves = '';
      for (let i = 1; i <= 14; i++) {
        x += Math.sin(i * 0.9) * 3 + 0.8; y += 16;
        d += `L${f(x)} ${f(y)}`;
        if (i > 1) {
          const s = i % 2 ? 1 : -1, sz = 15 + R() * 6 - i * 0.4, lx = x + s * 8, ly = y + 4, rot = 90 - s * (40 + R() * 25);
          d += `M${f(x)} ${f(y)}L${f(lx)} ${f(ly)}M${f(x)} ${f(y)}`;
          leaves += `<path transform="translate(${f(lx)} ${f(ly)}) rotate(${f(rot)}) scale(${f(sz / 12)})" d="M0 0C2-4 8-5 12 0C8 5 2 4 0 0Z"/>`;
        }
      }
      const cat = (cx, cy) => `<path d="M${cx} ${cy}q-2 9 1 20" stroke-width="3.2"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 244"><g class="tw-wood"><path d="${d}" stroke-width="2.2"/>${cat(64, 52)}${cat(70, 118)}</g><g class="tw-leaf">${leaves}</g></svg>`;
    };
    // ferns rising at the foot: each frond goes up from a bare stalk, arches out and droops at the tip under its weight;
    // its leaflets are longest in the middle and lean to the tip
    const fernSvg = () => {
      let stems = '', pinnae = '';
      [[34, -1.95, 150, 0.075], [52, -1.62, 170, 0.06], [66, -1.3, 150, 0.075], [44, -1.78, 110, 0.05], [80, -1.12, 120, 0.09]].forEach(([x, a, len, sag]) => {
        let y = 200, d = `M${x} ${y}`;
        const N = 22;
        for (let i = 1; i <= N; i++) {
          const u = i / N;
          a = Math.atan2(Math.sin(a) + sag, Math.cos(a));
          x += Math.cos(a) * len / N; y += Math.sin(a) * len / N;
          d += `L${f(x)} ${f(y)}`;
          if (u > 0.24) for (const s of [-1, 1]) {
            const pl = 15 * Math.sin(Math.PI * Math.min(1, (u - 0.2) / 0.85)) + 1.5, q = a + s * 0.95;
            pinnae += `M${f(x)} ${f(y)}l${f(Math.cos(q) * pl)} ${f(Math.sin(q) * pl + pl * 0.2)}`;
          }
        }
        stems += `<path d="${d}" stroke-width="1.7"/>`;
      });
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-86 20 276 180"><g class="tw-fern">${stems}<path d="${pinnae}" stroke-width="2.2"/></g></svg>`;
    };
    // each twig goes to the page as a picture (<img>): the browser keeps it drawn once, and the fireflies' frames above it
    // never make it draw those hundreds of needles again. Its colours are the skin's tokens, read now
    const css = getComputedStyle(root), tok = name => css.getPropertyValue(name).trim();
    const look = `<style>.tw-wood{fill:none;stroke:${tok('--forest-twig')};stroke-linecap:round;stroke-linejoin:round}.tw-needle{fill:none;stroke:${tok('--forest-needle')};stroke-width:1.5;stroke-linecap:round}.tw-leaf{fill:${tok('--forest-leaf')}}.tw-fern{fill:none;stroke:${tok('--forest-fern')};stroke-linecap:round}</style>`;
    const picture = svg => `<img alt="" decoding="async" src="data:image/svg+xml,${encodeURIComponent(svg.replace(/(<svg[^>]*>)/, '$1' + look))}">`;
    // where each twig hangs: its class (28-druid.css places it); the frame of each drawing holds all of it, the needles
    // over the stem and the fronds bending out of the screen
    const twigs = [
      ['tw-fir-tl', firSvg('0 -54 420 318', [0, 14, -0.05, 400, 0.016])],
      ['tw-fir-r', firSvg('0 -14 366 258', [360, 30, Math.PI + 0.06, 340, 0.018])],
      ['tw-birch', birchSvg()],
      ['tw-fern', fernSvg()]
    ].map(([cls, svg]) => `<div class="tw ${cls}">${picture(svg)}</div>`).join('');

    // the fireflies, on a canvas of their own: a CSS animation would make the browser restyle every one of them at each
    // frame the page draws (as many as 60 a second while it scrolls); the canvas is drawn at 20 a second, on the shared
    // budget of frames (15 when calm, none asleep), and only where a firefly was and is. Each one wanders on a path of
    // its own — across and up and down at two paces, never quite stopping — and glows up now and then; fewer on a narrow
    // screen. The clock goes by drawn frames, so after a pause nothing jumps. In «less motion» a few simply stand lit
    const cv = doc.createElement('canvas'), x = cv.getContext('2d');
    const n = innerWidth < 600 ? 14 : 26, flies = [];
    for (let i = 0; i < n; i++) {
      const tx = 9 + R() * 10, ty = 7 + R() * 8, b = 4 + R() * 5;
      flies.push({ x: 0.04 + R() * 0.92, y: 0.22 + R() * 0.74, dx: 24 + R() * 46, dy: 14 + R() * 30, tx, ty, b, px: R() * 6.3, py: R() * 6.3, pb: R(), still: i % 3 ? 0 : 0.8, was: null });
    }
    const RAD = 11;
    let k = 1, W = 0, H = 0, sprite = null, time = 0, last = null;
    function size() {
      // half the pixels of the page: a firefly is a soft light, and a small canvas costs the browser little to show
      k = 0.5;
      W = cv.width = Math.round(el.clientWidth * k); H = cv.height = Math.round(el.clientHeight * k);
      const css = getComputedStyle(root), r = Math.ceil(RAD * k);
      sprite = doc.createElement('canvas');
      sprite.width = sprite.height = r * 2;
      const sx = sprite.getContext('2d'), g = sx.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, css.getPropertyValue('--forest-fly').trim() || '#EEFFB0');
      g.addColorStop(0.12, css.getPropertyValue('--forest-fly').trim() || '#EEFFB0');
      g.addColorStop(0.34, css.getPropertyValue('--forest-fly-glow').trim() || 'rgba(196,240,120,.38)');
      g.addColorStop(1, 'rgba(196,240,120,0)');
      sx.fillStyle = g; sx.fillRect(0, 0, r * 2, r * 2);
      flies.forEach(fl => { fl.was = null; });
      x.clearRect(0, 0, W, H);
    }
    // how bright a firefly is at the time t: dark most of its round, then a glow that swells and fades
    const glow = (fl, t) => { const p = ((t / fl.b + fl.pb) % 1 + 1) % 1; return p < 0.4 || p > 0.9 ? 0 : Math.pow(Math.sin(Math.PI * (p - 0.4) / 0.5), 1.5); };
    function draw(t, still) {
      const r = Math.ceil(RAD * k);
      flies.forEach(fl => { if (fl.was) x.clearRect(fl.was[0] - r - 1, fl.was[1] - r - 1, r * 2 + 2, r * 2 + 2); });
      flies.forEach(fl => {
        const a = still ? fl.still : glow(fl, t);
        fl.was = null;
        if (a < 0.02) return;
        const T = Math.PI * 2;
        const px = fl.x * W + (still ? 0 : (Math.sin(T * t / fl.tx + fl.px) + 0.3 * Math.sin(T * t / (fl.tx * 0.43) + fl.py)) * fl.dx * k / 1.3);
        const py = fl.y * H + (still ? 0 : (Math.sin(T * t / fl.ty + fl.py) + 0.3 * Math.sin(T * t / (fl.ty * 0.57) + fl.px)) * fl.dy * k / 1.3);
        x.globalAlpha = a;
        x.drawImage(sprite, px - r, py - r);
        fl.was = [px, py];
      });
      x.globalAlpha = 1;
    }
    const L = psxLoop(now => {
      if (last != null) time += clamp((now - last) / 1000, 0, 0.1);
      last = now;
      draw(time, false);
    }, 20, 20);
    el.innerHTML = twigs;
    el.appendChild(cv);
    const page = $('.page');
    (page ? page.parentNode : doc.body).insertBefore(el, page);
    size();
    const motion = () => { if (reduce.matches) { L.stop(); draw(0, true); } else { last = null; L.start(); } };
    let rz = 0;
    // a phone's bars coming and going leave the layer as it was (it is as tall as the screen without them): nothing to do
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { if (Math.round(el.clientWidth * k) === W && Math.round(el.clientHeight * k) === H) return; size(); if (reduce.matches) draw(0, true); }, 150); };
    addEventListener('resize', onResize);
    reduce.addEventListener('change', motion);
    motion();
    return {
      destroy() {
        L.stop();
        clearTimeout(rz);
        removeEventListener('resize', onResize);
        reduce.removeEventListener('change', motion);
        el.remove();
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
  /* on and off: the background of the skin, the scenes, its drawings,   */
  /* the screen of the CRT                                                */
  /* ------------------------------------------------------------------ */
  // what stands behind the page in each skin
  const BACKS = { grimoire: () => crypt(), druid: () => forest() };
  let started = null;
  const mounted = [];
  function start() {
    const skin = skinNow();
    if (!skin) { stop(); return; }
    if (started === skin) return;
    if (started) stop();
    started = skin;
    // a page shown in the sheet of another (?peek=1) is only its place: no background, no scene, the molecules as here
    if (!root.classList.contains('is-peek')) {
      mounted.push(BACKS[skin]());
      $$('.ch-hero').forEach(h => { const v = h.closest('[data-view]'); mounted.push(stage(h, v && v.dataset.view, skin)); });
      // the home page: the scene is the background of its hero, by itself, without a finger
      const hero = $('.view-home .hero');
      if (hero) mounted.push(stage(hero, 'glavnaya', skin, true));
    }
    // the drawings of «Гримуар» go to the console's pixels; «Друид» keeps them smooth and only colours them
    if (skin === 'grimoire') {
      $$('svg.ill').forEach(pixelate);
      illWatch.observe(doc.body, { childList: true, subtree: true });
      doc.addEventListener('toggle', onToggle, true);
      doc.addEventListener('basil:panel', onPanel);
      addEventListener('resize', onResize);
    }
    root.classList.add('psx-on');
    $$('[data-crt]').forEach(b => b.setAttribute('aria-checked', String(!root.classList.contains('no-crt'))));
  }
  function stop() {
    if (!started) return;
    started = null;
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
  doc.addEventListener('basil:theme', () => { if (skinNow()) start(); else stop(); });

  const api = { start, stop, drawMol, get on() { return !!skinNow(); }, get skin() { return skinNow(); } };

  return api;
})();
