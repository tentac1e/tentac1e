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
  // where this file came from (the worker of the scenes loads it again, 04-stage.js), and whether this is that worker:
  // then the page here is a stand-in — no document, canvases off the screen
  const SELF_SRC = (doc.currentScript && doc.currentScript.src) || '';
  const IN_WORKER = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
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
      // after a frame of a loop of thirty frames a second or fewer, the page sleeps until a refresh before the next
      const rest = 1000 / fps - 12;
      const L = SC.loop(ts => {
        if (!gate(ts)) { L.next(); return; }
        frame(ts);
        if (rest > 8 && L.later) L.later(rest); else L.next();
      });
      return L;
    }
    let raf = 0, on = false;
    const run = ts => { raf = 0; if (!on) return; raf = requestAnimationFrame(run); if (gate(ts)) frame(ts); };
    return { start() { on = true; if (!raf) raf = requestAnimationFrame(run); }, stop() { on = false; cancelAnimationFrame(raf); raf = 0; }, next() {}, get on() { return on; } };
  }
  /* ------------------------------------------------------------------ */
  /* a small rasterizer of the PS1 kind on a 2D canvas                    */
  /* ------------------------------------------------------------------ */
  /* Low resolution, textures mapped affinely per triangle (the swim), no filtering, the painter's order by layer and
     depth, fog, then a few levels a colour channel with an ordered dither between them (dither: levels) — the console's
     look, nothing of it a shader. With smooth (the skin «Друид»): the canvas at the screen's own resolution (scale
     canvas pixels a CSS pixel), textures filtered, no dither — the same low polygons, lit and fogged, as a game of today
     draws them. Both draw the same way: every texture lit and fogged ahead (shaded), a colour once a fill, the picture
     never read back (the graphics card keeps it where it has one); the vertices fall where they fall, so that a camera
     swinging slowly glides — snapped to whole pixels of the console, the picture went in steps of three points */
  class Raster {
    constructor(canvas, o) {
      Object.assign(this, { px: 3, maxW: 380, levels: 16, dither: 0, read: false, fog: [28, 17, 34], fogNear: 4, fogFar: 14, near: 0.2, amb: [0.16, 0.13, 0.2], key: null, lights: [], smooth: false, scale: 1, maxPx: 0 }, o);
      this.c = canvas;
      // a picture read back (post: the console's colours of a molecule) is kept where the script reads it; any other
      // stays where the browser draws it best
      this.x = canvas.getContext('2d', this.read ? { willReadFrequently: true } : undefined);
      this.W = this.H = 0;
      this.unit = 1;
      // the glow of what shines (glowTo): a small picture of its own, a part `bloom` of the size, laid over the scene
      this.B = null;
      // the fills of plain colours, by colour (a string, or with the console's dither a tile of it)
      this.fills = new Map();
    }
    // the style a plain colour is filled with: the string of it, or, with the console's colours, a tile of 4 × 4 of
    // its two nearest levels in the ordered pattern, laid on the canvas's own grid (what post did to a face of one
    // colour, done once for the colour)
    paint(r, g, b) {
      const d = this.dither;
      r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
      const key = d ? (Math.round(r / 4.05) << 12) | (Math.round(g / 4.05) << 6) | Math.round(b / 4.05) : ((r | 0) << 16) | ((g | 0) << 8) | (b | 0);
      const F = this.fills;
      let f = F.get(key);
      if (f !== undefined) return f;
      if (F.size > 4096) F.delete(F.keys().next().value);
      if (!d) f = `rgb(${r | 0},${g | 0},${b | 0})`;
      else {
        const c = doc.createElement('canvas');
        c.width = c.height = 4;
        const cx = c.getContext('2d'), img = cx.createImageData(4, 4), q = dith(d), v = [(key >> 12) * 4.05, (key >> 6 & 63) * 4.05, (key & 63) * 4.05];
        for (let i = 0; i < 16; i++) for (let ch = 0; ch < 3; ch++) img.data[i * 4 + ch] = q(v[ch], i & 3, i >> 2);
        for (let i = 0; i < 16; i++) img.data[i * 4 + 3] = 255;
        cx.putImageData(img, 0, 0);
        f = this.x.createPattern(c, 'repeat');
      }
      F.set(key, f);
      return f;
    }
    // the glow of the bright parts, drawn as the picture is: each shining triangle (emis) goes also into this small
    // canvas in its colour, raised to the cube so that only the bright stays (a texture as it is); what else shines —
    // the moon, the lines of a circle — the world adds itself through R.B. The picture is never read back for it
    glowTo(canvas, k) { this.B = { c: canvas, x: canvas.getContext('2d', { alpha: false }), k }; }
    glowStart() {
      const B = this.B;
      if (!B) return;
      const w = Math.max(8, Math.round(this.W * B.k)), h = Math.max(6, Math.round(this.H * B.k));
      if (B.c.width !== w || B.c.height !== h) { B.c.width = w; B.c.height = h; }
      const x = B.x;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
      // what is drawn into it from now on is in the picture's own pixels, added up
      x.setTransform(w / this.W, 0, 0, h / this.H, 0, 0);
      x.globalCompositeOperation = 'lighter';
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
      return [x, y];
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
      // a part of a thing drawn together (together()): it takes the depth of the thing's own point in the painter's order
      this.list.push({ p, z: (va[2] + vb[2] + vc[2]) / 3, gz: o.group ? this.view(o.gat)[2] : null, o, l: o.emis ? null : this.shade(n, m, o.ds) });
    }
    draw() {
      const x = this.x, F = this.fog, dz = this.dither;
      // the glow of plain shining triangles: those of one shape (a bubble, a ring) go into it as one path, one fill;
      // whatever solid stands in front (not a cut-out leaf, not added light) darkens it again where it hides what shines
      // — the ground the moon sets behind, a stump over the lines of the circle — the triangles in a row in one fill
      const bx = this.B && this.B.x, cube = v => Math.min(255, (v / 255) ** 3 * 255) | 0;
      const solid = o => !o.emis && !o.cut && o.add == null && o.occlude !== false;
      let run = null;
      const flush = () => {
        if (!run) return;
        bx.globalAlpha = run.a; bx.fillStyle = run.col;
        if (run.o === 'dark') { bx.globalCompositeOperation = 'source-over'; bx.fill(); bx.globalCompositeOperation = 'lighter'; } else bx.fill();
        bx.globalAlpha = 1; run = null;
      };
      const dark = (ax, ay, qx, qy, cx, cy) => { if (!run || run.o !== 'dark') { flush(); run = { o: 'dark', a: 1, col: '#000' }; bx.beginPath(); } bx.moveTo(ax, ay); bx.lineTo(qx, qy); bx.lineTo(cx, cy); bx.closePath(); };
      // the faces of one colour in a row of the painter's order: one path, one fill (the same picture — they are opaque —
      // and no seam between them); anything else drawn flushes it first
      let face = null;
      const paint = () => { if (face) { x.fillStyle = face; x.fill(); face = null; } };
      const lay = o => (o.layer == null ? 1 : o.layer), zOf = t => (t.gz == null ? t.z : t.gz);
      this.list.sort((A, B) => lay(A.o) - lay(B.o) || zOf(B) - zOf(A) || (A.o.group && A.o.group === B.o.group ? (A.o.ord || 0) - (B.o.ord || 0) || B.z - A.z : 0));
      for (const t of this.list) {
        const o = t.o, a = t.p[0], b = t.p[1], c = t.p[2];
        const f = o.nofog ? 0 : clamp((t.z - this.fogNear) / (this.fogFar - this.fogNear), 0, 1) ** 1.15;
        // the triangle grown by half a pixel: neighbours meet without cracks
        const mx = (a[0] + b[0] + c[0]) / 3, my = (a[1] + b[1] + c[1]) / 3;
        let dx = a[0] - mx, dy = a[1] - my, L = 0.6 / (Math.sqrt(dx * dx + dy * dy) || 1);
        const ax = a[0] + dx * L, ay = a[1] + dy * L;
        dx = b[0] - mx; dy = b[1] - my; L = 0.6 / (Math.sqrt(dx * dx + dy * dy) || 1);
        const qx = b[0] + dx * L, qy = b[1] + dy * L;
        dx = c[0] - mx; dy = c[1] - my; L = 0.6 / (Math.sqrt(dx * dx + dy * dy) || 1);
        const cx = c[0] + dx * L, cy = c[1] + dy * L;
        if (o.tex) {
          // the texture's pixels onto the triangle: the affine map that takes its uv to the screen
          const w = o.tex.width, h = o.tex.height, uv = o.uv;
          const u0 = uv[0][0] * w, v0 = uv[0][1] * h, u1 = uv[1][0] * w, v1 = uv[1][1] * h, u2 = uv[2][0] * w, v2 = uv[2][1] * h;
          const det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
          if (!det) continue;
          paint();
          const ta = ((b[0] - a[0]) * (v2 - v0) - (c[0] - a[0]) * (v1 - v0)) / det, tb = ((b[1] - a[1]) * (v2 - v0) - (c[1] - a[1]) * (v1 - v0)) / det;
          const tc = ((c[0] - a[0]) * (u1 - u0) - (b[0] - a[0]) * (u2 - u0)) / det, td = ((c[1] - a[1]) * (u1 - u0) - (b[1] - a[1]) * (u2 - u0)) / det;
          const M = new DOMMatrix([ta, tb, tc, td, a[0] - ta * u0 - tc * v0, a[1] - tb * u0 - td * v0]);
          // every texture lit and fogged ahead (a blend of multiplying over each face cost a fill more a triangle,
          // more than the rest of the frame where the canvas is drawn without the graphics card), but light added
          const ahead = o.cut || o.add == null;
          const src = ahead && (t.l || f > 0.01) ? shaded(o.tex, t.l, f, F, this.smooth ? 24 : 10, dz) : o.tex;
          if (o.add != null) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = o.add; }
          x.beginPath(); x.moveTo(ax, ay); x.lineTo(qx, qy); x.lineTo(cx, cy); x.closePath();
          // the triangle filled with its texture as a pattern laid onto it — no clip and no mask, many times cheaper
          // where the canvas is drawn without the graphics card
          const pat = src.psxPat || (src.psxPat = x.createPattern(src, 'repeat'));
          pat.setTransform(M);
          x.fillStyle = pat;
          x.fill();
          x.globalAlpha = 1;
          x.globalCompositeOperation = 'source-over';
          if (bx && solid(o)) dark(ax, ay, qx, qy, cx, cy);
          if (bx && o.emis) {
            flush();
            const bp = src.psxBPat || (src.psxBPat = bx.createPattern(src, 'repeat'));
            bp.setTransform(M);
            bx.globalAlpha = (o.add == null ? 1 : o.add) * (1 - f);
            bx.fillStyle = bp;
            bx.beginPath(); bx.moveTo(ax, ay); bx.lineTo(qx, qy); bx.lineTo(cx, cy); bx.closePath(); bx.fill();
            bx.globalAlpha = 1;
          }
        } else {
          const col = o.col, l = t.l || ONE;
          const r = col[0] * l[0] * (1 - f) + F[0] * f, gg = col[1] * l[1] * (1 - f) + F[1] * f, bb = col[2] * l[2] * (1 - f) + F[2] * f;
          if (o.add != null) {
            paint();
            x.globalCompositeOperation = 'lighter'; x.globalAlpha = o.add;
            x.fillStyle = `rgb(${Math.min(255, r) | 0},${Math.min(255, gg) | 0},${Math.min(255, bb) | 0})`;
            x.beginPath(); x.moveTo(ax, ay); x.lineTo(qx, qy); x.lineTo(cx, cy); x.closePath(); x.fill();
            x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
          } else {
            const st = this.paint(r, gg, bb);
            if (st !== face) { paint(); face = st; x.beginPath(); }
            x.moveTo(ax, ay); x.lineTo(qx, qy); x.lineTo(cx, cy); x.closePath();
          }
          if (bx && solid(o)) dark(ax, ay, qx, qy, cx, cy);
          else if (bx && o.emis) {
            if (!run || run.o !== o) { flush(); run = { o, a: (o.add == null ? 1 : o.add) * (1 - f), col: `rgb(${cube(r)},${cube(gg)},${cube(bb)})` }; bx.beginPath(); }
            bx.moveTo(ax, ay); bx.lineTo(qx, qy); bx.lineTo(cx, cy); bx.closePath();
          }
        }
      }
      paint();
      if (bx) flush();
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
  // same light: the light in k steps to one, its tint in eight (the light of «Друид» flickers — a fire, runes, the moon
  // behind a cloud — and goes with the fill light as the camera swings: a light in fine steps in each of three colours
  // asked for a few thousand copies over a minute, a new canvas every few triangles). The oldest go first when the
  // copies pass SHADED_PX points (a dozen megabytes). With the console's colours (levels) the copy is cut down to them
  // in its own pixels, with the ordered dither, in the script — the texture's pixels kept as they were drawn (psxData)
  const SHADED = new Map(), SHADED_PX = 3e6, ONE = [1, 1, 1];
  let texId = 0, shadedPx = 0;
  function shaded(tx, l, f, F, k = 10, levels = 0) {
    let lq = null, lk = '-';
    if (l) {
      const top = Math.max(l[0], l[1], l[2]);
      if (top > 0) {
        const n = Math.round(Math.min(1.2, top) * k), r = Math.round(l[0] / top * 8), g = Math.round(l[1] / top * 8), b = Math.round(l[2] / top * 8);
        lq = [n / k * r / 8, n / k * g / 8, n / k * b / 8];
        lk = n + ',' + r + ',' + g + ',' + b;
      } else { lq = [0, 0, 0]; lk = '0'; }
    }
    if (!tx.psxId) tx.psxId = ++texId;
    const ff = Math.round(f * 12) / 12;
    const key = tx.psxId + ':' + k + ':' + levels + ':' + lk + ':' + Math.round(f * 12);
    let c = SHADED.get(key);
    if (c) { SHADED.delete(key); SHADED.set(key, c); return c; }
    for (const [k0, c0] of SHADED) {
      if (shadedPx + tx.width * tx.height <= SHADED_PX) break;
      SHADED.delete(k0);
      shadedPx -= c0.width * c0.height;
    }
    shadedPx += tx.width * tx.height;
    c = doc.createElement('canvas');
    c.width = tx.width; c.height = tx.height;
    const x = c.getContext('2d'), L = lq ? lq.map(v => Math.min(1, v)) : ONE;
    if (levels) {
      // the console's: multiplied, fogged and cut down to its levels here, pixel by pixel
      const w = tx.width, h = tx.height, src = tx.psxData || (tx.psxData = tx.getContext('2d').getImageData(0, 0, w, h).data);
      const img = x.createImageData(w, h), d = img.data, q = dith(levels);
      for (let y = 0, i = 0; y < h; y++) for (let xx = 0; xx < w; xx++, i += 4) {
        if (!src[i + 3]) continue;
        d[i] = q(src[i] * L[0] * (1 - ff) + F[0] * ff, xx, y);
        d[i + 1] = q(src[i + 1] * L[1] * (1 - ff) + F[1] * ff, xx, y);
        d[i + 2] = q(src[i + 2] * L[2] * (1 - ff) + F[2] * ff, xx, y);
        d[i + 3] = src[i + 3];
      }
      x.putImageData(img, 0, 0);
    } else {
      x.drawImage(tx, 0, 0);
      if (lq) { x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${L[0] * 255 | 0},${L[1] * 255 | 0},${L[2] * 255 | 0})`; x.fillRect(0, 0, c.width, c.height); }
      if (ff > 0) { x.globalCompositeOperation = 'source-over'; x.fillStyle = `rgba(${F[0]},${F[1]},${F[2]},${ff})`; x.fillRect(0, 0, c.width, c.height); }
      x.globalCompositeOperation = 'destination-in';
      x.drawImage(tx, 0, 0);
    }
    SHADED.set(key, c);
    return c;
  }
  // a value of a colour channel cut down to `levels` with the ordered dither at the pixel (x, y): what post did
  const DITH = {};
  function dith(levels) {
    if (DITH[levels]) return DITH[levels];
    const step = 255 / (levels - 1), T = BAYER.map(v => (v / 16 - 0.47) * step);
    return (DITH[levels] = (v, x, y) => { const o = Math.round((v + T[(y & 3) * 4 + (x & 3)]) / step) * step; return o < 0 ? 0 : o > 255 ? 255 : o; });
  }

  // shapes: a quad (two triangles), a box, a prism (pot, candle), a low ball (an atom), an egg (a seed, a beetle),
  // a rod (a bond, a stem), a billboard; turned() — any of them turned about an axis
  function quad(R, a, b, c, d, o, u0 = 0, u1 = 1, v0 = 0, v1 = 1) {
    R.tri(a, b, c, { ...o, uv: [[u0, v1], [u1, v1], [u1, v0]] });
    R.tri(a, c, d, { ...o, uv: [[u0, v1], [u1, v0], [u0, v0]] });
  }
  // a face another part always covers (the top of an altar under its slab) is left out by name (o.skip: 'top'): the
  // painter does not know it is hidden, and drawn after what lies on it, it would cut a triangle out of that
  const FACES = ['back', 'front', 'left', 'right', 'top', 'bottom'];
  function box(R, c, s, o) {
    const [x, y, z] = c, [a, b, d] = s;
    const v = [[x - a, y - b, z - d], [x + a, y - b, z - d], [x + a, y + b, z - d], [x - a, y + b, z - d], [x - a, y - b, z + d], [x + a, y - b, z + d], [x + a, y + b, z + d], [x - a, y + b, z + d]];
    [[0, 1, 2, 3, 1], [5, 4, 7, 6, 1], [4, 0, 3, 7, 0], [1, 5, 6, 2, 0], [3, 2, 6, 7, 0], [4, 5, 1, 0, 0]]
      // the front and the back (f[4]) carry texFront, read the right way round from their own side
      .forEach((f, i) => { if (!(o.skip && o.skip.includes(FACES[i]))) quad(R, v[f[0]], v[f[1]], v[f[2]], v[f[3]], { ...o, tex: f[4] && o.texFront ? o.texFront : o.tex, ctr: c }, f[4] ? 1 : 0, f[4] ? 0 : 1); });
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
  // a thing made of parts lying almost in one plane (a book open on its lectern: the board, the cover, the block of
  // pages, the leaves): the painter's order by the depth of each triangle flips between such faces from frame to frame
  // and lets the board's big face through the pages. Drawn together, the thing takes its place in the order of the
  // frame as one, by the depth of its point at, and its parts go in the order asked — part(0) first, then part(1)…;
  // the triangles of one part by their own depth
  function together(R, at) {
    const g = {};
    return ord => ({ C: R.C, tri: (a, b, d, q) => R.tri(a, b, d, { ...q, group: g, gat: at, ord }) });
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
  /* «Друид»: the icons of the guide cut in wood — written by             */
  /* scripts/skin-icons.js from the icons of src/layout.html, not by hand  */
  /* (a stroke is a path of straight cuts; * — a filled lozenge or chip)  */
  /* ------------------------------------------------------------------ */
  const DRUID_ICONS = {
    'hex': ["M19.86 16.52L11.86 21.07L4 16.48L4.13 7.53L12.01 2.8L20.12 7.41Z","M8.53 11.91L9.6 9.6L12.15 8.6L14.5 9.73L15.48 11.93L14.4 14.26L11.98 15.34L9.56 14.43Z"],
    'wave': ["M2.03 11.94L3.41 9.27L4.79 8.65L9.61 15.47L14.04 8.75L15.64 9.21L16.97 11.91","M19 9.5L21.45 11.87L19.13 14.45"],
    'cell': ["M3.02 12.1L3.63 9.04L5.54 6.69L12.01 4.45L18.31 6.69L20.35 9.21L20.93 12.08L20.27 14.79L18.45 17.26L12.18 19.49L5.5 17.3L3.74 14.99Z","M7.92 10.88L8.7 9.12L10.61 8.35L12.5 9.2L12.96 10.94L12.35 12.87L10.52 13.67L8.5 12.86Z","M15.04 14.61L16.02 13.67L16.83 14.69L16.03 15.49Z","M6.29 15.01L7.12 14.25L7.7 14.98L6.92 15.68Z"],
    'nose': ["M7.51 20.98L10.41 14.08L7.66 6.61L7.8 4.05L8.85 3.1","M14 21L16.92 13.92L14.12 6.79L14.36 4L15.35 2.87"],
    'mortar': ["M20.63 11.48L19.86 14.67L17.94 17.25L12.17 19.54L8.62 18.91L5.89 17.2L3.99 14.52L3.47 11.49Z","M8.48 19.32L7.74 21.09L16.08 20.96L15.48 19.25","M13.55 11.3L19.58 3.66L20.82 3.37L21.85 5.53L15.69 11.83","M7.04 9.32L8.62 7.58L10.72 7.4"],
    'bowl': ["M21.1 11.02L20.35 14.17L18.33 16.96L15.4 18.97L12.1 19.61L8.72 18.85L5.76 17.04L3.72 14.19L2.93 11.04Z","M9.01 19.2L9.17 20.98L15 20.97L15.02 19.27","M8.02 8.16L8.87 4.4","M12.02 8.2L12.95 4.25","M16 8.01L16.96 4.37"],
    'glass': ["M18.05 3.58L16.21 20.09L15.14 20.97L8.37 20.79L6.01 3.49Z","M6.77 9.5L17.34 9.47","M14.46 3.64L17.24 1.49","M9.51 14.05L10.49 13.03L11.47 14L10.62 15.09Z","M12.76 16.76L13.42 16.01L14.39 16.74L13.5 17.56Z"],
    'cake': ["M4.07 20.6L19.97 20.52","M5.41 20.47L5.7 13.29L7.63 11.59L17.7 11.87L18.41 13.37L18.53 20.46","M5.46 15.37L7.14 16.18L10.55 14.48L13.55 16.18L16.69 14.57L18.29 15.32","M12.07 11.48L12.1 8.59","M9.77 4.81L11.55 5.92L12.01 8.47L13.97 7.26L14.27 5.47L13.68 5.04L12.3 6.29L12.12 8.46L11.05 8.01L9.87 6.91Z"],
    'bulb': ["M9.13 17.56L15.1 17.55","M10.04 20.49L14.16 20.53","M9.37 17.49L14.55 17.37L14.86 14.59L17.63 10.68L17.25 6.08L13.63 3.23L9.12 3.75L6.25 7.45L6.32 10.72L9.16 14.77Z","M12.11 7.26L11.88 10.31"],
    'sun': ["M8 12.19L9.02 9.32L11.88 8L14.69 9.04L16.13 11.82L14.77 14.9L12 15.99L9.47 15Z","M12.03 2.47L11.88 4.43","M12.05 19.76L12.07 21.46","M2.82 11.93L4.39 12.1","M19.84 12.13L21.34 11.98","M5.57 5.49L6.52 6.51","M17.32 17.37L18.46 18.63","M5.28 18.66L6.54 17.47","M17.3 6.68L18.61 5.51"],
    'candle': ["M12.02 2.81L9.67 7.11L10.12 8.59L11.9 9.7L13.47 9.07L14.29 7.33Z","M12.13 9.61L12.05 11.17","M9.19 20.99L9.48 11.19L14.91 11.29L14.86 20.84","M6.6 20.96L17.45 20.89","M14.78 14.54L13.91 15.41L13.65 16.73"],
    'skin': ["M20.07 8.19L18.18 5.74L15.36 4.01L11.74 3.37L8.44 4.36L5.51 6.34L3.94 9.06L4.34 15.49L7.76 19.4L12.78 20.41L13.88 18.76L12.86 15.09L19.2 13.37L20.49 11.1Z","M6.4 11.16L6.82 10.32L7.78 9.92L8.81 11.32L8.45 12.05L7.54 12.4L6.92 12.07Z","M9.19 7.31L9.62 6.53L10.7 6.18L11.69 7.3L11.4 8.24L10.34 8.56L9.6 8.3Z","M13.9 7.55L14.26 6.79L15.17 6.41L16.08 7.58L15.85 8.48L15.02 8.7L14.24 8.51Z"],
    'rune': ["M12.04 20.89L12.13 4","M12.07 11.46L6.63 5.72","M11.95 11.52L17.5 5.54","M8.58 15.43L12 18.2"],
    'moon': ["M9.44 3.98L7.34 9.49L9.68 14.53L14.75 16.72L20.08 14.59L15.85 18.63L9.81 18.74L5.33 14.72L5.12 8.54L6.76 5.93Z"],
    'drop': ["M11.99 3.2L7.48 9.7L6.05 13.94L7.63 18.27L11.88 20.05L16.26 18.31L17.86 14.09L16.45 9.64Z","M9.27 14.6L9.97 16.29L11.74 17.17"],
    'thermo': ["M12.06 2.97L13.94 4.47L14.03 13.78L15.93 17.18L15 20.02L12.11 21.26L9.18 20.14L7.95 17.06L10.01 13.78L10.04 4.55Z","M11.9 8.97L12 16.37"],
    'scissors': ["M3.34 6.45L4.2 4.63L5.98 3.92L7.89 4.73L8.61 6.38L7.82 8.32L5.89 9.13L4.03 8.27Z","M3.39 17.47L4.13 15.59L6.08 14.92L7.87 15.74L8.49 17.46L7.97 19.28L5.93 20.2L4.14 19.31Z","M8.14 8.02L19.93 17.34","M8.26 15.9L19.89 6.58"],
    'flower': ["M12.02 21.54L11.85 4.46","M8.75 5.15L10.93 5.86L11.98 7.44L14.1 6.82L15.23 5.18L13.16 5.8L11.98 7.37L9.97 6.84Z","M15.67 9.42L13.37 10.2L11.93 12L9.63 11.27L8.38 9.5L10.42 10.11L12.15 11.96L14.33 11.25Z","M15.95 13.65L13.37 14.51L11.88 16.47L9.37 15.69L8.09 13.74L10.63 14.51L11.95 16.6L14.52 15.6Z"],
    'flask': ["M9.09 2.96L15.02 3.12","M10.05 3.25L10.11 9.28L4.98 19.92L6.52 20.94L17.23 21.06L18.88 20.27L19.06 18.79L14 9.09L14.08 3.11","M7.18 15L16.56 15.06"],
    'leaf': ["M19.99 5.12L18.83 11.62L15.83 16.36L10.09 19.4L6.21 19.85L5.01 18.96L5.95 13.35L8.98 8.91L13.98 5.94Z","M5.11 18.96L13.44 10.5"],
    'pot': ["M19.99 9.44L17.89 20.75L5.99 20.63L4.08 9.58Z","M11.89 9.61L12.3 4.56L15.59 3.27L14.73 5.25L12.06 6.85L10.97 4.86L8.83 4.32L9.68 6.12L12.02 7.04"],
    'bug': ["M11.91 19.46L8.95 17.64L7.86 13.89L8.98 10.2L12.08 8.46L14.89 10.16L16.23 14.1L15.01 17.91Z","M11.94 8.45L12.06 19.51","M9.58 5.61L12.03 8.36L14.52 5.6","M7.61 11.46L4.78 10.12","M16.27 11.57L19.31 10.03","M7.66 15.58L4.04 15.56","M16.42 15.42L19.92 15.47","M8.35 18.9L5.57 20.49","M15.81 18.76L18.44 20.36"],
    'cal': ["M19.83 19.48L17.92 20.57L4.28 19.85L3.43 17.93L4.07 5.74L5.99 5.03L19.62 5.51L20.5 7.3Z","M3.51 9.98L20.47 9.92","M8.05 3.28L7.94 7.01","M16.11 3.17L16.06 7.06"],
    'seed': ["M11.95 20.41L9.22 15.6L8.39 10.9L9.37 6.89L12 3.64L14.67 6.76L15.68 10.91L14.52 15.77Z","M11.89 8.08L12.13 17.06"],
    'sprout': ["M11.89 20.97L12.01 12.63","M5.13 6.33L6.65 10.87L12 12.51L10.08 8.07Z","M11.98 10.07L14 5.9L19 4.39L17.1 8.91Z"],
    'camera': ["M20.6 18.85L3.56 19L3.51 8.5L6.91 8.51L8.86 5.9L15.16 5.88L16.88 8.49L20.39 8.57Z","M8.52 13.17L9.66 10.84L12.13 9.9L14.47 10.95L15.43 13.29L14.52 15.64L11.97 16.61L9.61 15.78Z"],
    'ruler': ["M20.45 8.31L8.42 20.32L3.63 15.66L15.7 3.69Z","M7.51 11.75L9.23 13.45","M10 9.18L11.24 10.43","M12.76 6.8L14.48 8.35","M4.77 14.4L5.93 15.67"],
    'share': ["M12.01 14.5L11.98 4.09","M8.09 7.61L12.02 3.85L15.76 7.41","M6.51 10.43L5.02 10.43L4.9 20.2L19.12 20.23L18.9 10.66L17.81 10.48"],
    'lamp': ["M19 4.52L16.17 9.42L7.83 9.53L5.01 4.5Z","M8.53 13.14L7.39 15.79","M12.03 12.96L12.07 16.87","M15.36 13L16.58 15.79"],
    'home': ["M19.88 19.94L4.05 20.07L4 10.99L12.04 4.68L19.9 10.96Z","M9.59 19.91L9.47 15.06L14.53 15.04L14.51 20"],
    'balcony': ["M3.54 11.91L20.62 12.05","M3.8 20.51L20.53 20.53","M6.07 12.25L5.96 20.5","M10.01 12.24L9.98 20.52","M14.06 12.28L13.9 20.57","M17.99 12.25L17.94 20.46","M7.54 12.08L7.57 4.12L16.6 3.89L16.56 11.98"],
    'garden': ["M2.49 20.02L21.49 20.03","M5.94 20.1L6.34 14.11L8.91 12.75L8.26 14.7L6.15 15.49","M11.92 19.97L12.34 11.56L13.76 9.66L15.57 9.71L14.72 12L12.23 13.02","M8.77 12.04L9.6 14.23L11.89 15.05L11.18 12.74Z","M18.02 19.94L17.7 13.98L15.02 12.57L15.83 14.76L17.8 15.4"],
    'greenhouse': ["M21 20.48L3 20.6L3.18 9.64L5.83 4.64L8.87 2.55L12.41 2.06L15.79 2.8L18.54 4.75L20.87 9.47Z","M12.11 1.94L12.01 20.51","M3.26 13.89L20.94 14.08","M7.51 4.81L7.53 20.47","M16.64 4.73L16.53 20.39"],
    'wind': ["M3.11 8.39L15 8.27L17 5.92L15.86 3.2L12.69 2.74L11.01 5.29","M3.11 15.53L18.3 15.57L20.32 18L19.22 21.08L16.05 21.26L14.59 18.6","M3.21 12.03L9.84 12.09"],
    'check': ["M4.94 12.6L9.68 16.84L18.97 7.52"],
    'snow': ["M12.16 2.48L11.97 21.59","M4.02 7.27L20.14 16.78","M20.07 7.31L3.88 16.81"],
    'alert': ["M12.06 3.38L2.85 19.59L21.07 19.49Z","M11.95 10.04L11.97 14.27"],
    'info': ["M2.92 11.98L3.72 8.69L5.58 5.77L8.6 3.71L11.93 2.87L15.31 3.62L18.4 5.57L20.14 8.51L21 12.06L20.46 15.41L18.48 18.25L15.47 20.29L11.94 21.1L8.58 20.41L5.8 18.37L3.76 15.5Z","M12.12 10.92L11.91 16.38"],
    'arrow-up': ["M12.05 18.85L12.09 5.08","M5.65 11.31L12.08 5.16L18.53 11.47"],
    'arrow-r': ["M5.03 12.04L18.99 12.01","M13.18 6.18L19.07 12L13.06 17.72"],
    'chev-r': ["M8.98 4.86L15.99 12.18L9.08 18.99"],
    'chev-l': ["M15 4.98L8.07 12.07L14.97 18.97"],
    'jar': ["M6.96 3.42L16.97 3.42","M7.95 3.79L7.96 6.55","M16 3.75L16.02 6.59","M5.83 6.68L18.17 6.72L18.43 18.79L17.84 20.58L7.52 21.01L6.09 20.3Z","M5.57 11.08L18.47 11.05"],
    'cup': ["M17.89 3.89L16.48 20.33L7.54 20.38L6.03 3.99Z","M6.65 11.95L16.99 12.04","M12 12.03L12.04 6.54","M11.98 7.39L12.74 5.68L14.64 4.82L14.27 6.68Z"],
    'list': ["M8.98 6.05L19.91 6.08","M9.17 11.94L19.98 11.98","M9.23 17.94L19.93 18.14","M3.57 6.11L4.44 5.11L5.54 5.92L4.61 7.09Z","M3.51 12.01L4.38 10.93L5.5 12.03L4.59 13.11Z","M3.52 17.99L4.4 17.08L5.53 18.03L4.52 18.9Z"],
    'tag': ["M3.8 3.75L12.22 3.5L20.64 12.05L20.62 13.14L13.09 20.6L11.83 20.61L3.54 12.21Z","M6.71 8.14L7.28 7.03L8.14 6.58L9.28 7.16L9.77 8.17L9.13 9.43L8.25 9.83L7.01 9.26Z"],
    'bag': ["M18.89 7.91L17.56 20.7L6.43 20.66L5.07 8.11Z","M8.87 10.02L9.2 5.22L11.82 3.51L14.68 5.14L14.89 9.83"],
    'search': ["M4 10.41L5.98 5.75L10.65 3.93L15.24 6.05L16.94 10.63L15.06 15.11L10.42 17.02L5.85 15.04Z","M15.42 15.5L20.5 20.39"],
    'clock': ["M3.46 12.08L4.23 8.75L6.01 5.96L8.75 4.13L11.96 3.46L15.35 4.2L18.08 6.09L19.91 8.69L20.49 11.95L19.79 15.4L17.79 18.12L15.09 19.82L11.95 20.55L8.61 19.77L6.04 18.03L4.21 15.18Z","M12 7.5L11.87 11.94L15.05 13.87"],
    'grid': ["M10.04 10.26L4.6 10.18L4.35 4.4L10 4.38Z","M19.59 10.05L13.95 10.05L14.08 4.27L19.64 4.31Z","M10.01 19.47L4.39 19.54L4.48 14.01L9.92 13.81Z","M19.52 19.63L14.13 19.54L14.05 13.9L19.55 13.94Z"],
    'tools': ["M4.08 6.96L12.96 7.14","M19.25 6.98L19.99 7.01","M4.34 16.94L6.12 17.04","M12.22 16.97L20 17.12","M13.43 7.04L14.19 5.17L15.99 4.53L17.82 5.41L18.55 6.96L17.81 8.85L16.19 9.52L14.26 8.82Z","M6.6 16.99L7.31 15.29L9 14.53L10.82 15.4L11.4 16.92L10.74 18.98L9.05 19.5L7.15 18.84Z"],
    'close': ["M5.92 6.11L17.75 17.87","M17.88 6.05L6.05 17.78"],
    'copy': ["M19.4 19.49L9.12 19.46L8.42 10.39L9.18 9.04L17.9 8.51L19.41 9.05Z","M15.52 8.4L15.48 5.4L14.12 4.07L4.64 4.69L4.11 14.08L5.37 15.38L8.27 15.56"],
    'book': ["M20.14 5.09L15.52 5.13L12.14 6.49L8.49 4.99L4.13 4.98L3.92 17.9L8.64 18.06L12.02 19.38L15.43 18.11L19.87 17.98Z","M11.98 6.48L12 19.61"],
    'ch-sorta': ["M17.22 20.26L7.46 20.44L6.18 19.69L5.91 6.11L7.51 3.97L8.98 5.91L10.45 4.03L12.1 5.93L13.37 4.01L14.89 6.08L16.58 3.94L18 5.99L18 19Z","M12.07 8.88L14.24 13.53L13.62 16.02L12.15 17.52L10.38 15.99L9.67 13.58Z","M12 17.36L11.89 11.43"],
    'ch-posadka': ["M18.63 13.56L5.46 13.44L5.51 11L18.37 11.07Z","M6.9 13.51L8.25 20.49L15.99 20.39L17.1 13.61","M12 10.89L12.03 6.52","M12.01 8.85L10.83 5.94L8.01 5.06L9.06 7.76Z","M16.07 3.93L14.92 6.4L11.86 7.36L13.18 4.67Z"],
    'ch-uhod': ["M17.15 10.48L16.71 18.87L9.44 19.15L8.99 10.48Z","M11.01 10.42L11.47 8.85L13.05 7.97L14.22 8.67L14.91 10.32","M17.03 11.96L19.4 12.68L20.25 14.51L19.55 16.82L17.23 17.52","M8.95 16.74L4.35 11.25","M2.98 12.38L5.68 10.01"],
    'ch-udobreniya': ["M7.19 8.38L4.63 13.51L5.33 18.83L7.72 20.47L14.37 20.01L16.43 16.02L14.97 10.14L13.6 8.39Z","M7.6 8.51L6.8 4.75L10.37 5.96L14.19 4.79L13.32 8.35","*M17.55 19.6L17.87 18.85L18.6 18.58L19.32 18.9L19.66 19.64L19.31 20.35L18.6 20.65L17.86 20.34Z","*M19.87 19.59L20.18 18.86L20.89 18.56L21.64 18.84L21.95 19.61L21.65 20.31L20.91 20.63L20.15 20.3Z","*M18.71 17.6L19.04 16.87L19.78 16.6L20.48 16.9L20.8 17.57L20.52 18.4L19.76 18.6L19.02 18.36Z"],
    'ch-gidro': ["M18.49 9.62L17.85 19.94L5.98 19.76L5.55 9.41Z","M5.48 14.51L8.72 15.37L18.31 14.5","M9.95 9.36L10.01 12.65","M11.99 9.59L11.98 15.21","M13.87 9.75L13.92 12.73","M12.05 9.49L12.05 6.17","M8.42 4.35L9.43 6.7L11.97 7.55L11 5.18Z","M12.04 6.6L12.98 4.07L15.56 3.37L14.59 5.71Z"],
    'ch-formirovka': ["M4.79 16.92L5.51 15.13L7.34 14.32L9.26 15.01L10.16 16.94L9.46 18.97L7.41 19.73L5.59 18.95Z","M13.83 17.06L14.59 15.17L16.69 14.35L18.47 15L19.26 17.01L18.6 18.94L16.51 19.66L14.73 18.85Z","M9.25 14.98L17.42 4.04","M14.6 14.93L6.42 3.95"],
    'ch-vkus': ["M19.5 12.04L17.32 17.24L12.1 19.29L6.6 17.22L4.45 11.93Z","M9.67 19.23L9.15 20.93L14.99 21.03L14.36 19.37","M13.32 11.91L19.97 3.9L21.16 5.82L15.84 11.75","M10.72 7.72L10.06 10.67L7.44 11.96L7.9 9.04Z"],
    'ch-problemy': ["M11.91 20.1L8.68 18.52L7.4 14.58L8.88 10.55L11.99 8.9L15.2 10.81L16.6 14.6L15.15 18.59Z","M9.64 9.69L10.06 8.2L11.83 7.2L13.56 7.78L14.47 9.54","M12.03 9.22L12.01 20.19","M7.6 12.4L4.63 11.15","M7.32 15.24L4.22 15.29","M7.94 18.2L5.58 19.97","M16.39 12.34L19.19 11","M16.58 15.25L19.78 15.3","M16.08 18.36L18.55 20.06","M10.58 7.61L9.24 5.47","M13.6 7.31L14.74 5.63"],
    'ch-spravka': ["M3.21 12.2L3.83 8.79L5.68 5.8L8.51 4.08L11.73 3.29L15.22 3.76L18.19 5.62L20.06 8.44L20.69 11.89L20.1 15.2L18.31 18.14L15.56 20.07L12.18 20.78L8.65 20.2L5.88 18.27L3.9 15.61Z","M9.5 9.59L11.55 7.77L14.47 9.22L14.42 11.1L11.97 14.15","*M10.91 17.14L11.25 16.36L11.99 16.04L12.74 16.36L13.03 17.09L12.74 17.84L12 18.17L11.26 17.84Z"],
  };
  /* ------------------------------------------------------------------ */
  /* «Гримуар»: the sprites drawn by hand, pixel by pixel — the chapters, */
  /* the book of the contents, the flower, the bed, the wind; each wins   */
  /* over the one scripts/skin-icons.js writes from the plain icon        */
  /* (02-icons-grimoire.js). The characters — PIX in 02-icons.js           */
  /* ------------------------------------------------------------------ */
  const GRIMOIRE_HAND = {
    'book': [
      '................',
      '................',
      '................',
      '.oooooo..oooooo.',
      'owwwwwwoo++++++o',
      'ow====w##+====+o',
      'owwwwww##++++++o',
      'ow===ww##+===++o',
      'owwwwww##++++++o',
      'ow====w##+====+o',
      'owwwwww##++++++o',
      'o######oo######o',
      '.oooooo..oooooo.',
      '................',
      '................',
      '................'
    ],
    'flower': [
      '.......oo.......',
      '......owwo......',
      '.......vv.......',
      '..oo..ovvo..oo..',
      '.owwo.ovvo.owwo.',
      '..owwoovvoowwo..',
      '...oowvvvvwoo...',
      '..oo..ovvo..oo..',
      '.owwo.ovvo.owwo.',
      '..owwoovvoowwo..',
      '...oowvvvvwoo...',
      '......ovvo......',
      '....oovvvvoo....',
      '...ovvvoovvvo...',
      '....oo.oo.oo....',
      '................'
    ],
    'garden': [
      '................',
      '................',
      '.......oo.......',
      '......ovvo......',
      '..oo.ovvvvo.oo..',
      '.ovvoovvvvoovvo.',
      '.ovvvoovvoovvvo.',
      '..oovvovvovvoo..',
      '....oovvvvoo....',
      '..oo..ovvo..oo..',
      '.o++oooooooo++o.',
      'o+############=o',
      'o+==+===+===+==o',
      'o==+===+===+===o',
      '.oooooooooooooo.',
      '................'
    ],
    'wind': [
      '................',
      '................',
      '..........ooo...',
      '.........o+##o..',
      '.oooooooo+oo#o..',
      'o+++++++++o.o#o.',
      '.oooooooo##o#o..',
      '.........oooo...',
      '.oooooooooooo...',
      'o++++++++++++o..',
      '.oooooooooo##=o.',
      '..........oo#=o.',
      '.....oooo..o#o..',
      '....o++++ooo#o..',
      '.....oooo##=o...',
      '..........ooo...'
    ],
    'ch-sorta': [
      '................',
      '..o.o.o.o.o.o...',
      '.o#o#o#o#o#o#o..',
      '.o###########o..',
      '.o#=========#o..',
      '.o#====vv===#o..',
      '.o#===vvvv==#o..',
      '.o#==vv+vvv=#o..',
      '.o#==vvv+vv=#o..',
      '.o#==vvvv+v=#o..',
      '.o#===vvvv==#o..',
      '.o#====vv===#o..',
      '.o#=====v===#o..',
      '.o###########o..',
      '..ooooooooooo...',
      '................'
    ],
    'ch-posadka': [
      '.........ooo....',
      '..ooo...ovvvo...',
      '.ovvvo.ovvvvo...',
      '.ovvvvoovvvo....',
      '..oovvvvvoo.....',
      '....oovvoo......',
      '......vv........',
      '.oooooovvoooooo.',
      'o+############=o',
      'o##############o',
      '.oooooooooooooo.',
      '..o+rrrrrrrrr=o.',
      '..o+rrrrrrrrr=o.',
      '...o+rrrrrrr=o..',
      '...o+rrrrrrr=o..',
      '....ooooooooo...'
    ],
    'ch-uhod': [
      '................',
      '................',
      '.......oooo.....',
      '......o####o....',
      '.....o#oooo#o...',
      'oo...o#o..o#o...',
      'o+o.oooooooooo..',
      '.o+o+########=o.',
      'b.o+++#######=o.',
      '...o++#######=o.',
      '.b..o+#######=o.',
      '....o+#######=o.',
      'b...o+#######=o.',
      '.....o=======o..',
      '......ooooooo...',
      '................'
    ],
    'ch-udobreniya': [
      '................',
      '......o..o......',
      '.....o#oo#o.....',
      '......o##o......',
      '.....oo##oo.....',
      '....o++++++o....',
      '...o++wwww++o...',
      '..o++w++++w+=o..',
      '..o+++++++++=o..',
      '.o++++++++++==o.',
      '.o++vv+gg+rr+=o.',
      '.o++vv+gg+rr+=o.',
      '.o+++++++++===o.',
      '..o==========o..',
      '...oooooooooo...',
      '................'
    ],
    'ch-gidro': [
      '.......oo.......',
      '..ooo.ovvo.ooo..',
      '.ovvvoovvoovvvo.',
      '..ovvvovvovvvo..',
      '...oo.ovvo.oo...',
      '.oooooo##oooooo.',
      'o+####o##o####=o',
      'o+==w==o==o====o',
      'o+bbbbbo++obbb=o',
      'o+bbbbb+bb+bbb=o',
      'o+bbbb+bbbb+bb=o',
      'o+bbwbb+bb+bbb=o',
      'o+bbbbbbbbbwbb=o',
      'o+bbbbbbbbbbbb=o',
      '.o============o.',
      '..oooooooooooo..'
    ],
    'ch-formirovka': [
      '.oo..........oo.',
      'o##o........o##o',
      '.o##o......o##o.',
      '..o##o....o##o..',
      '...o##o..o##o...',
      '....o##oo##o....',
      '.....o####o.....',
      '......o##o......',
      '.....o#oo#o.....',
      '..oooo#oo#oooo..',
      '.orrrrooo.orrrro',
      'orroorro.orroorr',
      'orr..orr.orr..or',
      'orroorro.orroorr',
      '.orrrro...orrrro',
      '..oooo.....oooo.'
    ],
    'ch-vkus': [
      '............oo..',
      '...........o++o.',
      '...oo.....o+#o..',
      '..ovvo...o+#o...',
      '.ovvvvo.o+#o....',
      '.ovv+vvo+#o.....',
      '..ovvvo+#o......',
      '.oooooo##oooooo.',
      'o+wwwwwwwwwwww=o',
      'o+++++++++++++=o',
      '.o+++++++++++=o.',
      '.o+++++++++++=o.',
      '..o+++++++++=o..',
      '...oo=====ooo...',
      '....o#####o.....',
      '....ooooooo.....'
    ],
    'ch-problemy': [
      '................',
      '...o.......o....',
      '....o.....o.....',
      '.....ooooo......',
      '....o#####o.....',
      '.o..oo###oo..o..',
      '..ooorrorrooo...',
      '...orrwrorrro...',
      'ooorrrrorrrrrooo',
      '...orroorrorro..',
      '...orrrrorrrro..',
      'ooorrorrorrorooo',
      '...orrrrorrrro..',
      '..oorrrrorrrroo.',
      '.o...ooooooo..o.',
      '................'
    ],
    'ch-spravka': [
      '................',
      '.....oooooo.....',
      '...oo++++++oo...',
      '..o+++oooo+++o..',
      '.o+++o####o++=o.',
      '.o++o##oo##o+=o.',
      '.o++oooo.##o==o.',
      '.o+++++o##o===o.',
      '.o++++o##o====o.',
      '.o++++o##o====o.',
      '.o+++++oo=====o.',
      '.o++++o##o====o.',
      '..o+++o##o===o..',
      '...oo==oo===oo..',
      '.....oooooo.....',
      '................'
    ],
  };
  /* ------------------------------------------------------------------ */
  /* «Гримуар»: the icons of the guide as sprites of the console —        */
  /* written by scripts/skin-icons.js from the icons of src/layout.html,  */
  /* not by hand (the characters: see PIX in 02-icons.js); a sprite drawn  */
  /* by hand is in 02-icons-grimoire-hand.js and wins over this one       */
  /* ------------------------------------------------------------------ */
  const GRIMOIRE_ICONS = {
    'hex': [
      '.......oo.......',
      '.....oo++oo.....',
      '....o++##++o....',
      '..oo+##==##+oo..',
      '.o++#======#++o.',
      '.o+#==####==##o.',
      '.o+==######==#o.',
      '.o+==##==##==#o.',
      '.o+==#===##==#o.',
      '.o+==######==#o.',
      '.o+#==####==##o.',
      '.o+##======###o.',
      '..oo+##==###oo..',
      '....o+#####o....',
      '.....oo+#oo.....',
      '.......oo.......'
    ],
    'wave': [
      '................',
      '................',
      '................',
      '................',
      '..oo.....oo.....',
      '.o++o...o++ooo..',
      'o+##+o.o+##+++o.',
      'o+oo+oo+#o+#=#+o',
      'o+oo++o+#oo+=##o',
      '.o.o+#+#o..o+#o.',
      '....o+#o....oo..',
      '.....oo.........',
      '................',
      '................',
      '................',
      '................'
    ],
    'cell': [
      '................',
      '......oooo......',
      '....oo++++oo....',
      '...o++####++o...',
      '..o+#======#+o..',
      '.o+#=####===#+o.',
      'o+#==####====#+o',
      'o+#=##==##===##o',
      'o+#==####=#==##o',
      'o+#=####=###=##o',
      '.o+###====####o.',
      '..o+#======##o..',
      '...o+#######o...',
      '....oo+###oo....',
      '......oooo......',
      '................'
    ],
    'nose': [
      '.....o...oo.....',
      '....o+o.o++o....',
      '...o+#o.o+#o....',
      '...o+#o.o+o.....',
      '...o+#o.o+o.....',
      '....o+o.o++o....',
      '....o++oo+#o....',
      '.....o+o.o++o...',
      '.....o++oo+#o...',
      '.....o+#o.o+o...',
      '.....o+o.o+#o...',
      '....o+#oo+#o....',
      '....o+o.o+#o....',
      '...o+#o.o+o.....',
      '....oo..o+o.....',
      '.........o......'
    ],
    'mortar': [
      '.............o..',
      '............o+o.',
      '...........o+#+o',
      '.....ooo..o+###o',
      '....o+++oo+####o',
      '...o+###oo+###o.',
      '..oo+oooo+###o..',
      '.o++#++++####+o.',
      '.o+###########o.',
      '.o+==========#o.',
      '.o+#========##o.',
      '..o+#======##o..',
      '...o+#######o...',
      '...o+######o....',
      '....o+#####o....',
      '.....oooooo.....'
    ],
    'bowl': [
      '................',
      '........o..o....',
      '.....ooo+oo+o...',
      '....o++o+o+#o...',
      '....o+=+#o+#o...',
      '..ooo+=##o+ooo..',
      '.o+++####+#+++o.',
      'o+############+o',
      'o+#==========##o',
      '.o+==========#o.',
      '.o+#========##o.',
      '..o+#======##o..',
      '...o+#######o...',
      '....o+#####o....',
      '.....o+###o.....',
      '......oooo......'
    ],
    'glass': [
      '....ooooooo+o...',
      '...o+++++++#o...',
      '..o+########+o..',
      '..o+#w=====##o..',
      '..o+#======##o..',
      '...o+#######o...',
      '...o+#######o...',
      '...o+rrrrrr#o...',
      '...o+rwwrrr#o...',
      '...o+#wwrr##o...',
      '...o+#wwww##o...',
      '...o+#rrww##o...',
      '...o+#rrrr##o...',
      '...o+#######o...',
      '....o+#####o....',
      '.....oooooo.....'
    ],
    'cake': [
      '................',
      '................',
      '......oooo......',
      '.....o++++o.....',
      '.....o+###o.....',
      '.....o+###o.....',
      '....ooo+#ooo....',
      '...o+++##+++o...',
      '..o+########+o..',
      '..o+++##++###o..',
      '..o+#########o..',
      '..o+#rrrr#rr#o..',
      '..o+rrrrrrrr#o..',
      '.o+##########+o.',
      '..o+#########o..',
      '...oooooooooo...'
    ],
    'bulb': [
      '......oooo......',
      '.....o++++o.....',
      '....o+####+o....',
      '...o+#wggg#+o...',
      '..o+#ggwwgg#+o..',
      '..o+#ggwwgg##o..',
      '..o+#ggwwgg##o..',
      '..o+#gggggg##o..',
      '...o+#gggg##o...',
      '....o+#gg##o....',
      '....o+#gg##o....',
      '....o+#####o....',
      '.....o+###o.....',
      '.....o+###o.....',
      '......o+##o.....',
      '.......ooo......'
    ],
    'sun': [
      '.......oo.......',
      '......oggo......',
      '...oo.oggo.oo...',
      '..oggo.oo.oggo..',
      '..oggooooooggo..',
      '...ooo++++ooo...',
      '.oo.o+#gg#+o.oo.',
      'oggoo+gggg#ooggo',
      'oggoo+gggg#ooggo',
      '.oo.o+#gg##o.oo.',
      '...ooo+###ooo...',
      '..oggooooooggo..',
      '..oggo.oo.oggo..',
      '...oo.oggo.oo...',
      '......oggo......',
      '.......oo.......'
    ],
    'candle': [
      '.......oo.......',
      '......oggo......',
      '......oggo......',
      '.....oggggo.....',
      '.....ogwwgo.....',
      '.....oggggo.....',
      '.....oggggo.....',
      '....o+####+o....',
      '....o+#++##o....',
      '....o+#++##o....',
      '....o+#+###o....',
      '....o+#+###o....',
      '....o+#++##o....',
      '...o+######+o...',
      '...o+#######o...',
      '....oooooooo....'
    ],
    'skin': [
      '.......oo.......',
      '.....oo++ooo....',
      '...oo++##+++o...',
      '..o++###==##+o..',
      '..o+####=##=#+o.',
      '.o+#=#########o.',
      '.o+=##===##==#o.',
      '.o+####======#o.',
      '.o+=##======##o.',
      '.o+=====#####o..',
      '.o+#====#oooo...',
      '..o+====#+o.....',
      '..o+##==##o.....',
      '...oo+####o.....',
      '.....ooooo......',
      '................'
    ],
    'rune': [
      '................',
      '.......oo.......',
      '....o.o++o.o....',
      '...o+oo+#oo+o...',
      '...o++o+#o+#o...',
      '....o++##+#o....',
      '.....o+###o.....',
      '......o+#o......',
      '......o+#o......',
      '.....oo+#o......',
      '....o++##o......',
      '.....o+##o......',
      '......o+#o......',
      '......o+#o......',
      '.......oo.......',
      '................'
    ],
    'moon': [
      '................',
      '.....oo.........',
      '....o++o........',
      '...o+##o........',
      '..o+##o.........',
      '..o+##o.........',
      '.o+###o.........',
      '.o+###o.........',
      '.o+#g#o.....oo..',
      '..o+g#+ooooo++o.',
      '..o+#g#+++++##o.',
      '...o+#gg#####o..',
      '....o+######o...',
      '.....oo+##oo....',
      '.......ooo......',
      '................'
    ],
    'drop': [
      '................',
      '.......oo.......',
      '......o++o......',
      '.....o+##+o.....',
      '....o+#rr#+o....',
      '....o+rrrr#o....',
      '...o+#rrrr#+o...',
      '...o+rrrrrr#o...',
      '..o+#rrrrrr#+o..',
      '..o+#wwrrrr##o..',
      '..o+#rwwrrr##o..',
      '...o+rwwrr##o...',
      '...o+##rr###o...',
      '....oo+###oo....',
      '......oooo......',
      '................'
    ],
    'thermo': [
      '.......oo.......',
      '......o++o......',
      '.....o+##+o.....',
      '.....o+rr#o.....',
      '.....o+rr#o.....',
      '.....o+rr#o.....',
      '.....o+rr#o.....',
      '.....o+rr#o.....',
      '.....o+rr#o.....',
      '....o+#rr#+o....',
      '....o+rrrr#o....',
      '....o+rrrr#o....',
      '....o+rrrr#o....',
      '....o+#####o....',
      '.....o+###o.....',
      '......oooo......'
    ],
    'scissors': [
      '................',
      '..oooo..........',
      '.o++++o.........',
      '.o+###o.....oo..',
      'o+#==#+o...o++o.',
      '.o+####o.oo+#o..',
      '..o+#o++o++#o...',
      '...oo.o++##o....',
      '...oo.o+###o....',
      '..o++o+#o+#+o...',
      '.o+##+#o.oo++o..',
      'o+#==#o....o++o.',
      '.o+###o.....oo..',
      '.o+###o.........',
      '..oooo..........',
      '................'
    ],
    'flower': [
      '................',
      '................',
      '.....oooooo.....',
      '....o++++++o....',
      '....o+####o.....',
      '.....o+###+o....',
      '....o+#####o....',
      '....o+#####o....',
      '....o+#####o....',
      '....o+#####o....',
      '....o+#####o....',
      '.....oo+#oo.....',
      '......o+#o......',
      '......o+#o......',
      '......o+#o......',
      '.......oo.......'
    ],
    'flask': [
      '......oooo......',
      '.....o++++o.....',
      '....o+####+o....',
      '.....o+w=#o.....',
      '.....o+==#o.....',
      '.....o+==#o.....',
      '.....o+==#o.....',
      '....o+#==#+o....',
      '...o+#====#+o...',
      '...o+#######o...',
      '..o+########+o..',
      '..o+#rrrrrr##o..',
      '.o+#rrrrrrrr#+o.',
      '..o+#########o..',
      '..o+#########o..',
      '...oooooooooo...'
    ],
    'leaf': [
      '................',
      '................',
      '........oooooo..',
      '......oo++++++o.',
      '.....o++##vv##o.',
      '....o+##vvvv##o.',
      '...o+#vv#vvv##o.',
      '...o+#v###vv##o.',
      '..o+#v###vv##o..',
      '..o+####vvv##o..',
      '..o+###vvv##o...',
      '..o+##vv###o....',
      '..o+######o.....',
      '..o+####oo......',
      '...ooooo........',
      '................'
    ],
    'pot': [
      '.........oo.....',
      '.....oooovvo....',
      '....ovvvvvvo....',
      '....ovvvvvvo....',
      '...ooovvvvooo...',
      '..o+++#vv#+++o..',
      '.o+##########+o.',
      '.o+#========##o.',
      '.o+#========##o.',
      '.o+#========##o.',
      '..o+========#o..',
      '..o+========#o..',
      '..o+#======##o..',
      '..o+#########o..',
      '...o+#######o...',
      '....oooooooo....'
    ],
    'bug': [
      '................',
      '................',
      '......o..o......',
      '.....o+oo+o.....',
      '.....o+++#o.....',
      '..oooo+###oooo..',
      '.o++++####++++o.',
      '..o+##r##r###o..',
      '...o+#r##r##o...',
      '..o+##r##r##+o..',
      '.o+###r##r###+o.',
      '..ooo+#####ooo..',
      '...o+######+o...',
      '..o+##o+#oo++o..',
      '...ooo.oo..oo...',
      '................'
    ],
    'cal': [
      '................',
      '....oooooooo....',
      '..oo++++++++oo..',
      '.o++########++o.',
      '.o+==#====#==#o.',
      '.o+==========#o.',
      '.o+###########o.',
      '.o+###########o.',
      '.o+==========#o.',
      '.o+==========#o.',
      '.o+==========#o.',
      '.o+==========#o.',
      '.o+==========#o.',
      '.o+###########o.',
      '..oo+#######oo..',
      '....oooooooo....'
    ],
    'seed': [
      '................',
      '.......oo.......',
      '......o++o......',
      '.....o+##+o.....',
      '....o+#gg#+o....',
      '....o+#####o....',
      '....o+g##g#o....',
      '....o+g##g#o....',
      '....o+#####o....',
      '....o+#####o....',
      '....o+#####o....',
      '.....o+###o.....',
      '.....o+###o.....',
      '......o+#o......',
      '.......oo.......',
      '................'
    ],
    'sprout': [
      '................',
      '..........ooo...',
      '...o.....ovvvo..',
      '..ovooo.ovvvvo..',
      '..ovvvvovvvvvo..',
      '..ovvvvvvvvvvo..',
      '..ovvvvvvvvvo...',
      '...ovvvvvvoo....',
      '....ovvv#o......',
      '.....oo+#o......',
      '......o+#o......',
      '......o+#o......',
      '......o+#o......',
      '......o+#o......',
      '.......oo.......',
      '................'
    ],
    'camera': [
      '................',
      '................',
      '.....oooooo.....',
      '....o++++++o....',
      '..ooo+#####ooo..',
      '.o+++#====#+++o.',
      '.o+##=####=###o.',
      '.o+==##=###==#o.',
      '.o+==##==##==#o.',
      '.o+==##==##==#o.',
      '.o+==######==#o.',
      '.o+====##====#o.',
      '.o+###########o.',
      '.o+###########o.',
      '..oooooooooooo..',
      '................'
    ],
    'ruler': [
      '................',
      '.........ooo....',
      '........o+++o...',
      '.......o+###+o..',
      '......o+##=##+o.',
      '.....o+###==##o.',
      '....o+##====##o.',
      '...o+#=#===##o..',
      '..o+###===##o...',
      '.o+#==#==##o....',
      '.o+##===##o.....',
      '.o+##==##o......',
      '..o+####o.......',
      '...o+##o........',
      '....ooo.........',
      '................'
    ],
    'share': [
      '................',
      '.......oo.......',
      '......o++o......',
      '.....o+##+o.....',
      '....o+####+o....',
      '...oo+=##=#oo...',
      '..o++==##==++o..',
      '..o+#==##==##o..',
      '..o+===##===#o..',
      '..o+===##===#o..',
      '..o+========#o..',
      '..o+========#o..',
      '..o+========#o..',
      '..o+#########o..',
      '...oooooooooo...',
      '................'
    ],
    'lamp': [
      '................',
      '...oooooooooo...',
      '..o++++++++++o..',
      '..o+#########o..',
      '..o+#======##o..',
      '...o+#######o...',
      '...o+#######o...',
      '....oooooooo....',
      '....ogoggogo....',
      '...oggoggoggo...',
      '...oggoggoggo...',
      '....oooggooo....',
      '.......oo.......',
      '................',
      '................',
      '................'
    ],
    'home': [
      '................',
      '.......oo.......',
      '......o++o......',
      '.....o+##+o.....',
      '....o+#==#+o....',
      '..oo+#====#+oo..',
      '.o++#======#++o.',
      '.o+#========##o.',
      '.o+==========#o.',
      '.o+===####===#o.',
      '.o+===####===#o.',
      '.o+===#==#===#o.',
      '.o+###########o.',
      '.o+###########o.',
      '..oooooooooooo..',
      '................'
    ],
    'balcony': [
      '................',
      '....oooooooo....',
      '...o++++++++o...',
      '...o+#######o...',
      '...o+#====##o...',
      '...o+#====##o...',
      '..oo+#====##oo..',
      '.o++########++o.',
      '.o+###########o.',
      '..o+#=#==#=##o..',
      '..o+#=#==#=##o..',
      '..o+#=#==#=##o..',
      '..o+#=#==#=##o..',
      '.o+##########+o.',
      '.o+###########o.',
      '..oooooooooooo..'
    ],
    'garden': [
      '................',
      '................',
      '................',
      '................',
      '................',
      '........ooo.....',
      '.....ooo+++o....',
      '....o+++###o....',
      '...o+######+o...',
      '..o+########+o..',
      '..o+##=##=###o..',
      '..o+#==##==##o..',
      '.o+##########+o.',
      'o+############+o',
      '.oooooooooooooo.',
      '................'
    ],
    'greenhouse': [
      '.....oooooo.....',
      '...oo++++++oo...',
      '..o++#w##=#++o..',
      '.o+###=##=###+o.',
      '.o+###=##=####o.',
      'o+#=##=##=##=#+o',
      'o+#=##=##=##=##o',
      'o+#=##=##=##=##o',
      'o+#############o',
      'o+#############o',
      'o+#=##=##=##=##o',
      'o+#=##=##=##=##o',
      'o+#=##=##=##=##o',
      'o+#############o',
      '.o+###########o.',
      '..oooooooooooo..'
    ],
    'wind': [
      '........ooo.....',
      '.......o+++o....',
      '......o+###+o...',
      '......o+oo+#o...',
      '.ooooooooo+#o...',
      'o+++++++++#o....',
      '.o+######oo.....',
      '.o+####oo.......',
      '.o+####ooooo....',
      '.o+####+++++oo..',
      'o+##########++o.',
      '.ooooooooooo+#o.',
      '........o+ooo+o.',
      '........o++++#o.',
      '.........o+##o..',
      '..........ooo...'
    ],
    'check': [
      '................',
      '................',
      '................',
      '............o...',
      '...........o+o..',
      '..........o+#o..',
      '.........o+#o...',
      '...oo...o+#o....',
      '..o++o.o+#o.....',
      '..o+#+o+#o......',
      '...o+#+#o.......',
      '....o+#o........',
      '.....oo.........',
      '................',
      '................',
      '................'
    ],
    'snow': [
      '.......oo.......',
      '......o++o......',
      '......o+#o......',
      '..oo..o+#o..oo..',
      '.o++o.o+#o.o++o.',
      '.o+#+oo+#oo+##o.',
      '..oo+++##++#oo..',
      '....oo+###oo....',
      '....oo+###oo....',
      '..oo++####++oo..',
      '.o++#oo+#oo+++o.',
      '.o+#o.o+#o.o+#o.',
      '..oo..o+#o..oo..',
      '......o+#o......',
      '......o+#o......',
      '.......oo.......'
    ],
    'alert': [
      '................',
      '.......oo.......',
      '......o++o......',
      '.....o+##+o.....',
      '.....o+###o.....',
      '....o+#==#+o....',
      '....o+#####o....',
      '...o+#=##=#+o...',
      '...o+==##==#o...',
      '..o+#==##==#+o..',
      '.o+#========#+o.',
      '.o+#========##o.',
      'o+############+o',
      'o+#############o',
      '.oooooooooooooo.',
      '................'
    ],
    'info': [
      '......oooo......',
      '....oo++++oo....',
      '...o++####++o...',
      '..o+#======#+o..',
      '.o+#========#+o.',
      '.o+==========#o.',
      'o+#==========#+o',
      'o+#====##====##o',
      'o+#====##====##o',
      'o+#====##====##o',
      '.o+====##====#o.',
      '.o+#========##o.',
      '..o+#======##o..',
      '...o+#######o...',
      '....oo+###oo....',
      '......oooo......'
    ],
    'arrow-up': [
      '................',
      '................',
      '.......oo.......',
      '......o++o......',
      '.....o+##+o.....',
      '....o+####+o....',
      '...o+#o+#o++o...',
      '..o+#oo+#oo++o..',
      '...oo.o+#o.oo...',
      '......o+#o......',
      '......o+#o......',
      '......o+#o......',
      '......o+#o......',
      '.......oo.......',
      '................',
      '................'
    ],
    'arrow-r': [
      '................',
      '................',
      '........o.......',
      '.......o+o......',
      '.......o++o.....',
      '........o++o....',
      '...ooooooo++o...',
      '..o+++++++##+o..',
      '..o+#########o..',
      '...ooooooo+#o...',
      '........o+#o....',
      '.......o+#o.....',
      '.......o+o......',
      '........o.......',
      '................',
      '................'
    ],
    'chev-r': [
      '................',
      '................',
      '.....oo.........',
      '....o++o........',
      '.....o++o.......',
      '......o++o......',
      '.......o++o.....',
      '........o++o....',
      '........o+#o....',
      '.......o+#o.....',
      '......o+#o......',
      '.....o+#o.......',
      '....o+#o........',
      '.....oo.........',
      '................',
      '................'
    ],
    'chev-l': [
      '................',
      '................',
      '.........oo.....',
      '........o++o....',
      '.......o+#o.....',
      '......o+#o......',
      '.....o+#o.......',
      '....o+#o........',
      '....o+#o........',
      '.....o++o.......',
      '......o++o......',
      '.......o++o.....',
      '........o++o....',
      '.........oo.....',
      '................',
      '................'
    ],
    'jar': [
      '.....oooooo.....',
      '....o++++++o....',
      '...o+######+o...',
      '...o+#######o...',
      '..o+########+o..',
      '..o+========#o..',
      '..o+#########o..',
      '..o+#########o..',
      '..o+wrrrrrrr#o..',
      '..o+rrrrrrrr#o..',
      '..o+rrrrrrrr#o..',
      '..o+rrrrrrrr#o..',
      '..o+rrrrrrrr#o..',
      '..o+#########o..',
      '...o+#######o...',
      '....oooooooo....'
    ],
    'cup': [
      '................',
      '...oooooooooo...',
      '..o++++++++++o..',
      '..o+#########o..',
      '..o+#==###=##o..',
      '..o+#==##==##o..',
      '...o+==##==#o...',
      '...o+#######o...',
      '...o+#######o...',
      '...o+gggggg#o...',
      '...o+#gggg##o...',
      '...o+#gggg##o...',
      '...o+#gggg##o...',
      '...o+#######o...',
      '....o+#####o....',
      '.....oooooo.....'
    ],
    'list': [
      '................',
      '................',
      '..oo..oooooooo..',
      '.o++oo++++++++o.',
      '.o+#oo+#######o.',
      '..oo..oooooooo..',
      '..oo..oooooooo..',
      '.o++oo++++++++o.',
      '.o+#oo+#######o.',
      '..oo..oooooooo..',
      '..oo..oooooooo..',
      '.o++oo++++++++o.',
      '.o+#oo+#######o.',
      '..oo..oooooooo..',
      '................',
      '................'
    ],
    'tag': [
      '...ooooo........',
      '..o+++++o.......',
      '.o+#####+o......',
      '.o+=====#+o.....',
      '.o+=###==#+o....',
      '.o+=###===#+o...',
      '.o+=###====#+o..',
      '.o+=========#+o.',
      '.o+#=========#+o',
      '..o+#=======##o.',
      '...o+#=====##o..',
      '....o+#===##o...',
      '.....o+#=##o....',
      '......o+##o.....',
      '.......o+o......',
      '........o.......'
    ],
    'bag': [
      '................',
      '......oooo......',
      '.....o++++o.....',
      '...oo+#==#+oo...',
      '..o++######++o..',
      '..o+#########o..',
      '..o+=##==##=#o..',
      '..o+========#o..',
      '..o+========#o..',
      '..o+#======##o..',
      '..o+#======##o..',
      '..o+#======##o..',
      '..o+#======##o..',
      '..o+#########o..',
      '...o+#######o...',
      '....oooooooo....'
    ],
    'search': [
      '................',
      '.....oooo.......',
      '...oo++++oo.....',
      '..o++####++o....',
      '..o+#w===##o....',
      '.o+#======#+o...',
      '.o+#======##o...',
      '.o+========#o...',
      '.o+#======##o...',
      '..o+======#o....',
      '..o+#######+o...',
      '...oo+###o+#+o..',
      '.....oooo.o+#+o.',
      '...........o+#o.',
      '............oo..',
      '................'
    ],
    'clock': [
      '................',
      '.....oooooo.....',
      '...oo++++++oo...',
      '..o++#====#++o..',
      '..o+#======##o..',
      '.o+#===##===#+o.',
      '.o+====##====#o.',
      '.o+====##====#o.',
      '.o+====###===#o.',
      '.o+======##==#o.',
      '.o+#========##o.',
      '..o+=======##o..',
      '..o+##====###o..',
      '...oo+#####oo...',
      '.....oooooo.....',
      '................'
    ],
    'grid': [
      '................',
      '..ooooo..ooooo..',
      '.o+++++oo+++++o.',
      '.o+####++#####o.',
      '.o+===####===#o.',
      '.o+===####===#o.',
      '.o+###########o.',
      '..o+###==####o..',
      '..o+###==####o..',
      '.o+##########+o.',
      '.o+===####===#o.',
      '.o+===####===#o.',
      '.o+###########o.',
      '.o+####oo+####o.',
      '..ooooo..ooooo..',
      '................'
    ],
    'tools': [
      '................',
      '..........oo....',
      '.........o++o...',
      '..ooooooo+##+o..',
      '.o+++++++#=##+o.',
      '..o+#########o..',
      '...oooooo+##o...',
      '.........ooo....',
      '....oooo........',
      '...o++++ooooo...',
      '..o+####+++++o..',
      '.o+##==######+o.',
      '..oo+###oooooo..',
      '....o+#o........',
      '.....oo.........',
      '................'
    ],
    'close': [
      '................',
      '................',
      '....o......o....',
      '...o+o....o+o...',
      '..o+#+o..o+#+o..',
      '...o+#+oo+##o...',
      '....o+#++##o....',
      '.....o+###o.....',
      '.....o+###o.....',
      '....o+####+o....',
      '...o+##oo+#+o...',
      '...o+#o..o+#o...',
      '...o+o....o+o...',
      '....o......o....',
      '................',
      '................'
    ],
    'copy': [
      '................',
      '...ooooooo......',
      '..o+++++++o.....',
      '.o+#######+o....',
      '.o+=======#oo...',
      '.o+===#####++o..',
      '.o+==########+o.',
      '.o+==#=======#o.',
      '.o+==#=======#o.',
      '.o+###=======#o.',
      '..o+##=======#o.',
      '...oo+=======#o.',
      '....o+########o.',
      '.....o+######o..',
      '......ooooooo...',
      '................'
    ],
    'book': [
      '................',
      '...ooo....ooo...',
      '..o+++oooo+++o..',
      '.o+###++++###+o.',
      '.o+++++##++++#o.',
      '.o+++++##++++#o.',
      '.o+++++##++++#o.',
      '.o+++++##++++#o.',
      '.o+++++##++++#o.',
      '.o+++++##++++#o.',
      '.o+++++##++++#o.',
      '.o+###########o.',
      '.o+###########o.',
      '..ooooo+#ooooo..',
      '.......oo.......',
      '................'
    ],
    'ch-sorta': [
      '................',
      '....oooooooo....',
      '...o++++++++o...',
      '..o+########+o..',
      '..o+##=#=#=##o..',
      '..o+#==##==##o..',
      '..o+#=####=##o..',
      '..o+#=####=##o..',
      '..o+#=####=##o..',
      '..o+#=####=##o..',
      '..o+#=####=##o..',
      '..o+#==##==##o..',
      '..o+#======##o..',
      '..o+#########o..',
      '...oo+#####oo...',
      '.....oooooo.....'
    ],
    'ch-posadka': [
      '................',
      '........ooo.....',
      '.....ooo+++o....',
      '....o+++###o....',
      '....o+#####o....',
      '....o+###ooo....',
      '...o+####+++o...',
      '..o+########+o..',
      '..o+#########o..',
      '..o+#########o..',
      '...o+#====##o...',
      '...o+#====##o...',
      '...o+#====##o...',
      '....o+#####o....',
      '....o+#####o....',
      '.....oooooo.....'
    ],
    'ch-uhod': [
      '................',
      '................',
      '................',
      '................',
      '.......ooo......',
      '...o..o+++oo....',
      '..o+oo+###++o...',
      '.o+#o+######+o..',
      'o+##+##====##+o.',
      '.ooo+##====#=#o.',
      '...o+##====#=#o.',
      '....o+#====###o.',
      '....o+######oo..',
      '.....o+####o....',
      '......ooooo.....',
      '................'
    ],
    'ch-udobreniya': [
      '................',
      '....o...........',
      '...o+ooooo......',
      '...o++++++o.....',
      '...o+#####o.....',
      '...o+#####o.....',
      '..o+######+o....',
      '..o+=====##o....',
      '.o+#======#+o...',
      '.o+#======##o...',
      '.o+#======##oo..',
      '.o+#======##ggo.',
      '..o+#====##ogo..',
      '..o+#######oggo.',
      '...oo+###oo.oo..',
      '.....oooo.......'
    ],
    'ch-gidro': [
      '..........o.....',
      '.....oo.oo+o....',
      '....o++o++#o....',
      '....o+#+###o....',
      '....o+####oo....',
      '...o+#####++o...',
      '..o+########+o..',
      '..o+==####==#o..',
      '..o+==####==#o..',
      '..o+#########o..',
      '..o+#########o..',
      '..o+wbbbbbbb#o..',
      '..o+bbbbbbbb#o..',
      '..o+#########o..',
      '...oo+#####oo...',
      '.....oooooo.....'
    ],
    'ch-formirovka': [
      '................',
      '....o......o....',
      '...o+o....o+o...',
      '...o++o..o+#o...',
      '....o++oo+#o....',
      '....o+#oo+#o....',
      '.....o+++#o.....',
      '......o+#o......',
      '...ooo+##+ooo...',
      '..o+++####+++o..',
      '.o+#=##==##=#+o.',
      '.o+#==####==##o.',
      '..o+###oo+###o..',
      '...o+#o..o+#o...',
      '....oo....oo....',
      '................'
    ],
    'ch-vkus': [
      '................',
      '............ooo.',
      '...........o+++o',
      '......o...o+###o',
      '.....o+o.o+####o',
      '....o+#+oo+###o.',
      '...o+###o+###o..',
      '..o+####+####o..',
      '.o+##########+o.',
      '.o+#========##o.',
      '..o+=======##o..',
      '..o+##====###o..',
      '...oo+#####oo...',
      '....o+#####o....',
      '.....o+###o.....',
      '......oooo......'
    ],
    'ch-problemy': [
      '................',
      '................',
      '.....oo..oo.....',
      '....o++oo++o....',
      '.....o+++#o.....',
      '.....o+###o.....',
      '..ooo+####+ooo..',
      '.o+++######+++o.',
      '..oo+#r##r##oo..',
      '..o+##r##r##+o..',
      '.o+###r##r###+o.',
      '..oo+#r##r##oo..',
      '..o+########o...',
      '..o+#o+###o++o..',
      '...oo.oooo.oo...',
      '................'
    ],
    'ch-spravka': [
      '......ooo.......',
      '....oo+++ooo....',
      '...o++###+++o...',
      '..o+##====##+o..',
      '.o+#===##===#+o.',
      '.o+#==####==##o.',
      '.o+===#==#===#o.',
      'o+#======#===#+o',
      'o+#=====##===##o',
      '.o+====##====#o.',
      '.o+==========#o.',
      '.o+#===##===##o.',
      '..o+##====###o..',
      '...o+#######o...',
      '....oo+##ooo....',
      '......ooo.......'
    ],
  };
  /* ------------------------------------------------------------------ */
  /* the icons of a skin: while it is on, every symbol of the sprite     */
  /* (layout.html) that the skin has its own for shows that instead —    */
  /* «Гримуар» a sprite of the console in pixels, «Друид» a cut in wood.  */
  /* Each <use> of the page follows its symbol by itself, those the       */
  /* scripts write later too; switched off, the symbols get their own     */
  /* drawing back                                                         */
  /* ------------------------------------------------------------------ */
  // a sprite of «Гримуар»: rows of 16 characters, a character a pixel — the colour of the icon (#), its light (+), its
  // shade (=), the dark of its outline (o), blood (r), gold (g), venom (v), the cold of water (b), the glint (w); a dot
  // is nothing. Pixels of one colour go into one path, a row of them into one run
  const PIX = { '#': 'currentColor', '+': 'var(--ico-h)', '=': 'var(--ico-s)', o: 'var(--ico-o)', r: 'var(--ico-r)', g: 'var(--ico-g)', v: 'var(--ico-v)', b: 'var(--ico-b)', w: 'var(--ico-w)' };
  function pixelSprite(rows) {
    const runs = {};
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const c = row[x];
        let n = 1;
        while (row[x + n] === c) n++;
        if (PIX[c]) (runs[c] = runs[c] || []).push(`M${x} ${y}h${n}v1h-${n}z`);
        x += n;
      }
    });
    return Object.keys(runs).map(c => `<path style="fill:${PIX[c]};stroke:none" d="${runs[c].join('')}"/>`).join('');
  }
  // a cut of «Друид»: its groove first — the dark under the cut, a little lower — then the cut itself
  function carvedIcon(shapes) {
    const cut = (s, sh) => (s[0] === '*'
      ? `<path d="${s.slice(1)}" style="fill:${sh ? 'var(--ico-k)' : 'currentColor'};stroke:none"/>`
      : `<path d="${s}"${sh ? ' style="stroke:var(--ico-k)"' : ''}/>`);
    return `<g class="ico-groove" transform="translate(.45 .7)">${shapes.map(s => cut(s, true)).join('')}</g>${shapes.map(s => cut(s, false)).join('')}`;
  }
  const ICON_SETS = {
    grimoire: () => Object.fromEntries(Object.entries({ ...GRIMOIRE_ICONS, ...GRIMOIRE_HAND }).map(([k, rows]) => [k, { box: '0 0 16 16', body: pixelSprite(rows) }])),
    druid: () => Object.fromEntries(Object.entries(DRUID_ICONS).map(([k, shapes]) => [k, { box: '0 0 24 24', body: carvedIcon(shapes) }]))
  };
  // the mark of the guide in the header and the footer: a leaf of basil — a sprite of the console, a leaf cut in wood
  const BRAND = {
    grimoire: () => ({ box: '0 0 16 16', body: pixelSprite([
      '.......oo.......',
      '......ovvo......',
      '.....ov+vvo.....',
      '....ov++vvvo....',
      '...ov++vvvvvo...',
      '...ov+vvgvvvo...',
      '..ov+vvvgvvvvo..',
      '..ovvvvvgvvvvo..',
      '..ovvvvvgvvv=o..',
      '..ovvvvgvvv==o..',
      '...ovvvgvv==o...',
      '....ovvgv==o....',
      '.....oogo=o.....',
      '.......go.......',
      '.......go.......',
      '........o.......'
    ]) }),
    druid: () => ({ box: '0 0 32 32', body: carvedIcon(['M16 30.5L16.2 9.5', 'M16 26L23.6 21.4L26.2 13.2L16.1 2.4L5.9 12.8L8.6 21.2Z', 'M16.1 19.6L21.4 15.2M16 14.4L11 10.4M16.1 10.6L19.4 7.8']) })
  };
  const iconCache = {};
  const plainIcons = new Map();
  function iconsOn(skin) {
    const set = iconCache[skin] || (iconCache[skin] = ICON_SETS[skin] ? ICON_SETS[skin]() : {});
    $$('symbol[id^="i-"]').forEach(sym => {
      const own = set[sym.id.slice(2)];
      if (!own) return;
      if (!plainIcons.has(sym)) plainIcons.set(sym, { box: sym.getAttribute('viewBox'), body: sym.innerHTML });
      sym.setAttribute('viewBox', own.box);
      sym.innerHTML = own.body;
      sym.dataset.skinIco = skin;
    });
    const mark = (iconCache[skin + ':brand'] = iconCache[skin + ':brand'] || (BRAND[skin] ? BRAND[skin]() : null));
    if (mark) $$('.brand svg').forEach(svg => {
      if (!plainIcons.has(svg)) plainIcons.set(svg, { box: svg.getAttribute('viewBox'), body: svg.innerHTML });
      svg.setAttribute('viewBox', mark.box);
      svg.innerHTML = mark.body;
      svg.dataset.skinIco = skin;
    });
  }
  function iconsOff() {
    plainIcons.forEach((p, sym) => { sym.setAttribute('viewBox', p.box); sym.innerHTML = p.body; delete sym.dataset.skinIco; });
    plainIcons.clear();
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
      runes: [...Array(6)].map((_, i) => tex(8, 12, t => runeGlyph(t, i))),
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
  // a leaf of n pixels square (32 for the console; «Друид» draws its own at 64, smooth): the blade's outline in its
  // alpha — round shoulders, a pointed tip — the midrib, the veins, spots if it is sick
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
    // the glow: which of its blocks of 8 × 8 hold a line (psxInk) — a cell of the floor over none of them adds nothing
    if (glow) {
      const d = c.getContext('2d').getImageData(0, 0, 128, 128).data, ink = new Uint8Array(256);
      for (let i = 3; i < d.length; i += 4) if (d[i]) { const q = (i - 3) / 4; ink[((q / 128 | 0) >> 3) * 16 + ((q % 128) >> 3)] = 1; }
      c.psxInk = ink;
    }
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
  // a rune of light (the glyphs that circle the book): a rune of the elder row — Fehu, Uruz, Thurisaz, Ansuz, Raidho,
  // Kaunan — its strokes a pixel wide on a stave of eleven, a glow of dark gold beside them so that it reads small
  const RUNE_STROKES = [
    [[1, 0, 1, 10], [1, 4, 5, 1], [1, 7, 5, 4]],
    [[1, 0, 1, 10], [1, 0, 5, 4], [5, 4, 5, 10]],
    [[1, 0, 1, 10], [1, 3, 4, 5], [4, 5, 1, 7]],
    [[1, 0, 1, 10], [1, 1, 5, 4], [1, 4, 5, 7]],
    [[1, 0, 1, 10], [1, 0, 5, 2], [5, 2, 1, 5], [1, 5, 5, 10]],
    [[5, 1, 1, 5], [1, 5, 5, 9]]
  ];
  function runeGlyph(t, i) {
    const g = [255, 210, 120], d = [120, 74, 24];
    RUNE_STROKES[i].forEach(([x0, y0, x1, y1]) => t.line(x0 + 2, y0 + 1, x1 + 2, y1 + 1, d));
    RUNE_STROKES[i].forEach(([x0, y0, x1, y1]) => t.line(x0 + 1, y0 + 1, x1 + 1, y1 + 1, g));
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
  function drawMol(ctx, mol, P, R3, W, H) {
    const skin = MOLDRAW[skinNow()] ? skinNow() : 'grimoire', wk = scenesWorker();
    if (wk) molAsk(wk, ctx, skin, mol, P, R3, W, H);
    else MOLDRAW[skin](ctx, mol, P, R3, W, H);
  }
  // where the scenes have a worker (04-stage.js), the molecule is drawn there too: the page sends the turn, the worker
  // sends the picture back (an ImageBitmap) and the page lays it on the viewer's canvas. One picture on the way at a
  // time for each canvas: a turn asked for meanwhile waits, and only the newest
  const MOLJOBS = new WeakMap();
  let molIds = 0;
  function molAsk(wk, ctx, skin, mol, P, R3, W, H) {
    let j = MOLJOBS.get(ctx.canvas);
    if (!j) {
      j = { id: 'mol' + (++molIds), busy: false, next: null };
      MOLJOBS.set(ctx.canvas, j);
      const send = m => { j.busy = true; sceneWorker.postMessage(m); };
      workerWaits.set(j.id, m => {
        if (m.type === 'failed') { j.busy = false; j.next = null; return; }
        if (m.type !== 'mol') return;
        if (skinNow()) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.drawImage(m.bmp, 0, 0, ctx.canvas.width, ctx.canvas.height); }
        if (m.bmp.close) m.bmp.close();
        j.busy = false;
        if (j.next && sceneWorker) { const n = j.next; j.next = null; send(n); }
      });
      j.send = send;
    }
    const job = { type: 'mol', id: j.id, skin, mol: { atoms: mol.atoms, bonds: mol.bonds }, P, R3, W, H, cw: ctx.canvas.width, ch: ctx.canvas.height };
    if (j.busy) j.next = job; else j.send(job);
  }
  const MOLBUF = new WeakMap();
  MOLDRAW.grimoire = function molCrypt(ctx, mol, P, R3, W, H) {
    let b = MOLBUF.get(ctx.canvas);
    if (!b) {
      const cv = doc.createElement('canvas');
      b = { cv, R: new Raster(cv, { levels: 18, read: true, fogNear: 9, fogFar: 17, amb: [0.2, 0.17, 0.24] }) };
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
  /* page — the background of its block, under the title, by itself: no   */
  /* finger turns it and nothing is tapped. The world of the skin around  */
  /* (05-grimoire.js, 06-druid.js) and the chapter's own scene in the     */
  /* middle (05-grimoire-*.js, 06-druid-*.js)                             */
  /* ------------------------------------------------------------------ */
  /* A world is world(skin, { raster, textures(), key, sky, defaults, make(S, sc), post(R, t), glow(canvas, R) }):
     the options of its rasterizer, its textures, its key light, the three colours of its sky, what its scenes have
     unless they say otherwise, make — what stands round every scene of it ({ draw(t), lights(t), fx(t, F) }: a floor,
     candles, trees), post — what is done to the finished picture, glow(canvas, R) — what it does with a small canvas of
     the glow of its bright parts (drawn into as the picture is, added to it at the end of the frame).
     A scene is scene(skin, view, S => ({ … })): S.R — the rasterizer, S.T — the textures, S.ang — where the camera
     stands (updated every frame). It gives draw(t) — its shapes at the time t, in seconds — and, if it needs them:
     tick(t) before anything is drawn (the state of the moment; the key light may be changed there), lights(t) — its
     point lights, fill — how strong the soft light from the camera's side is, fx(t, F) — sparks and halos over the
     picture (F.spark, F.halo, F.dot, F.streak), beat(t) and every — what the scene does by itself every few seconds of
     its clock (a ward flares, a handful of leaves falls in), as a loop; candles — its own candles; glow — the
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

  // a leaf of basil from its base B along F, its blade spread along S (across F when not given): eight triangles of
  // the cut-out texture, its outline the texture's; o.w — how wide, o.curl — how much its tip bends down, o.flat — one
  // colour instead of the texture (a leaf far off in the fog, a kite of four flat triangles: cheaper)
  function leaf(R, B, F, len, tex, o = {}) {
    let S = o.side || cross(F, [0, 1, 0]);
    if (Math.hypot(S[0], S[1], S[2]) < 1e-3) S = [1, 0, 0];
    S = norm(S);
    const U = cross(S, F), w = o.w || 0.36, curl = o.curl == null ? 0.22 : o.curl;
    const Tp = add(add(B, mul(F, len)), mul(U, -len * curl)), M = add(add(B, mul(F, len * 0.5)), mul(U, len * 0.1));
    const Lf = add(add(B, mul(F, len * 0.42)), mul(S, -len * w)), Rt = add(add(B, mul(F, len * 0.42)), mul(S, len * w));
    if (o.flat) {
      // one colour: the blade itself is the shape, a diamond of four triangles folded along the midrib
      const q = { col: o.flat, ds: true, layer: o.layer, add: o.add };
      R.tri(B, Lf, M, q); R.tri(Lf, Tp, M, q); R.tri(B, M, Rt, q); R.tri(M, Tp, Rt, q);
      return;
    }
    // a texture: each half of the blade covers its half of the picture whole, so the outline is the picture's — round
    // shoulders, a pointed tip — folded along the midrib, the tip curling; the corners outside the blade are clear
    const q = { tex, ds: true, cut: true, layer: o.layer, add: o.add }, side = mul(S, len * w);
    const BL = sub(B, side), TL = sub(Tp, side), BR = add(B, side), TR = add(Tp, side);
    R.tri(BL, B, M, { ...q, uv: [[0, 1], [0.5, 1], [0.5, 0.55]] });
    R.tri(BL, M, Lf, { ...q, uv: [[0, 1], [0.5, 0.55], [0, 0.55]] });
    R.tri(Lf, M, Tp, { ...q, uv: [[0, 0.55], [0.5, 0.55], [0.5, 0]] });
    R.tri(Lf, Tp, TL, { ...q, uv: [[0, 0.55], [0.5, 0], [0, 0]] });
    R.tri(B, BR, M, { ...q, uv: [[0.5, 1], [1, 1], [0.5, 0.55]] });
    R.tri(M, BR, Rt, { ...q, uv: [[0.5, 0.55], [1, 1], [1, 0.55]] });
    R.tri(M, Rt, Tp, { ...q, uv: [[0.5, 0.55], [1, 0.55], [0.5, 0]] });
    R.tri(Tp, Rt, TR, { ...q, uv: [[0.5, 0], [1, 0.55], [1, 0]] });
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
    // where the picture keeps a glow of its own (R.B, «Друид»), every halo, dot and spark shines into it too
    const x = R.x, u = R.unit, round = R.smooth, bx = R.B && R.B.x;
    const put = (p, s, col) => {
      x.fillStyle = col;
      if (round) { x.beginPath(); x.arc(p[0], p[1], s * 0.5, 0, Math.PI * 2); x.fill(); } else x.fillRect(Math.round(p[0]), Math.round(p[1]), s, s);
      if (bx) { bx.fillStyle = col; bx.beginPath(); bx.arc(p[0], p[1], s * 1.2, 0, Math.PI * 2); bx.fill(); }
    };
    return {
      halo(p3, r3, c0, c1) {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), r = R.C.focal * r3 / v[2];
        // the console's: a halo cut down to its levels, in rings, drawn once for its size and colours
        const sp = R.dither && haloArt(R, r, c0, c1);
        if (sp) { x.globalAlpha = sp.a; x.drawImage(sp.c, Math.round(p[0]) - sp.r, Math.round(p[1]) - sp.r); x.globalAlpha = 1; return; }
        const g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
        g.addColorStop(0, c0); g.addColorStop(1, c1);
        x.fillStyle = g; x.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
        if (bx) { bx.fillStyle = g; bx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); bx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); }
      },
      // a soft halo that only glows: into the glow where the picture has one (a wide one costs little there), else as halo
      soft(p3, r3, c0, c1) {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const y = bx || x, p = R.proj(v), r = R.C.focal * r3 / v[2], g = y.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
        g.addColorStop(0, c0); g.addColorStop(1, c1);
        y.fillStyle = g; y.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
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
        x.fillRect(round ? p[0] : Math.round(p[0]), round ? p[1] : Math.round(p[1]), Math.max(1, u * 0.7), l);
      }
    };
  }
  // a halo of the console: what the radial gradient from c0 to c1 (its alpha nothing) adds to the picture, cut down to the
  // raster's levels with the ordered dither — in rings, as the console's colours made of it — for its radius in whole
  // pixels; c0's own alpha is how strongly it is laid on (so a halo that breathes keeps its picture). Null for a halo
  // of another kind (an edge not clear): that one is drawn as a gradient
  const HALOS = new Map(), RGBA = new Map();
  const rgba = s => { let v = RGBA.get(s); if (!v) { const m = s.match(/[\d.]+/g); v = m && m.length >= 3 ? [+m[0], +m[1], +m[2], m.length > 3 ? +m[3] : 1] : [0, 0, 0, 0]; RGBA.set(s, v); } return v; };
  function haloArt(R, r, c0, c1) {
    const A = rgba(c0), B = rgba(c1), ri = Math.max(1, Math.round(r));
    if (B[3] !== 0 || ri > 160) return null;
    const key = ri + '|' + A[0] + ',' + A[1] + ',' + A[2] + '|' + B[0] + ',' + B[1] + ',' + B[2] + '|' + R.dither;
    let sp = HALOS.get(key);
    if (!sp) {
      if (HALOS.size > 256) HALOS.delete(HALOS.keys().next().value);
      const n = ri * 2, c = doc.createElement('canvas');
      c.width = c.height = n;
      const cx = c.getContext('2d'), img = cx.createImageData(n, n), d = img.data, q = dith(R.dither);
      for (let y = 0, i = 0; y < n; y++) for (let xx = 0; xx < n; xx++, i += 4) {
        const k = Math.hypot(xx + 0.5 - ri, y + 0.5 - ri) / ri;
        if (k >= 1) continue;
        const w = 1 - k;
        d[i] = q((A[0] + (B[0] - A[0]) * k) * w, xx, y); d[i + 1] = q((A[1] + (B[1] - A[1]) * k) * w, xx, y); d[i + 2] = q((A[2] + (B[2] - A[2]) * k) * w, xx, y);
        d[i + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
      sp = { c, r: ri };
      HALOS.set(key, sp);
    }
    return { c: sp.c, r: sp.r, a: A[3] };
  }

  // one scene on a canvas — its world round it, its clock, its frame — wherever it is drawn: on the page, or in the
  // worker of the scenes (below). Its glow, when the world has one (W.glow), is a small canvas of its own the scene
  // draws into as it goes and adds to the picture at the end; edges — how the picture fades out at its sides and darkens
  // round its middle (from the stage's CSS, edges())
  function sceneOn(cv, view, skin) {
    const W = WORLDS[skin], set = SCENES[skin];
    const T = W.textures();
    const R = new Raster(cv, W.raster());
    if (W.glow) W.glow(doc.createElement('canvas'), R);
    const S = { R, T, view, ang: 0.6 };
    const sc = { still: 0, look: [0, 1.45, 0], rad: 5.6, near: 5.6, fill: 0.6, orbit: [0.6, 0.35], ...W.defaults, ...(set[view] || set.glavnaya)(S) };
    const env = W.make(S, sc);
    // the scene's own clock: it goes on by the frames drawn, a long frame or a pause (off the screen, asleep, another
    // tab) counts as a tenth of a second at most — the picture never jumps ahead when it wakes
    let now0 = null, time = 0, beat = -1, E = EDGES, art = null;
    const tick = now => { if (now0 != null) time += clamp((now - now0) / 1000, 0, 0.1); now0 = now; return time; };
    // the end of the frame, in the picture itself: the glow drawn up and added, then the fade to nothing at the sides
    // and the dark round the middle in one pass, only where they change anything. The browser then lays one picture over
    // the page — a mask and a layer of glow blended in the page cost the whole head of the page again at every frame
    // where the page is put together without the graphics card (two thirds of the time of each frame of the screen)
    function finish() {
      const x = R.x, w = R.W, h = R.H;
      x.setTransform(1, 0, 0, 1, 0, 0);
      if (R.B) {
        x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.9; x.imageSmoothingEnabled = true;
        x.drawImage(R.B.c, 0, 0, w, h);
        x.globalAlpha = 1; x.imageSmoothingEnabled = R.smooth;
      }
      if (!art || art.w !== w || art.h !== h) art = edgeArt(w, h, E);
      // what the mask takes away, taken away (destination-in would clear all the canvas outside each band)
      x.globalCompositeOperation = 'destination-out';
      art.at.forEach(([rx, ry, rw, rh]) => { if (rw > 0 && rh > 0) x.drawImage(art.mask, rx, ry, rw, rh, rx, ry, rw, rh); });
      x.globalCompositeOperation = 'source-over';
    }
    function frame(now) {
      // the clock of the scene: stands at its chosen moment when the reader asked for less motion
      const t = reduce.matches ? sc.still : tick(now);
      R.size();
      // wide: the chapter's text on the left, the scene to the right of it; else the scene in the middle, closer
      const wide = R.W > R.H * 1.45;
      const ang = sc.orbit[0] + Math.sin(t * 0.13) * sc.orbit[1];
      const look = sc.look, eyeY = look[1] + 1.1 + Math.sin(t * 0.3) * 0.15;
      const rad = wide ? sc.rad : sc.near;
      S.ang = ang;
      R.cam([look[0] + Math.cos(ang) * rad, eyeY, look[2] + Math.sin(ang) * rad], look, wide ? 1.25 : 1.05, wide ? 0.68 : 0.5, wide ? 0.44 : 0.4);
      R.key = W.key;
      // what the scene does now and then, by itself: once for each round of `every` seconds of its clock
      if (sc.beat && sc.every && !reduce.matches) { const n = Math.floor(t / sc.every); if (n !== beat) { if (beat >= 0 || n > 0) sc.beat(n * sc.every); beat = n; } }
      if (sc.tick) sc.tick(t);
      R.lights = env.lights(t)
        .concat(sc.fill ? [{ p: [look[0] + Math.cos(ang) * 2.2, look[1] + 1.5, look[2] + Math.sin(ang) * 2.2], col: W.fillCol || [0.78, 0.62, 0.95], i: sc.fill, fall: 0.16 }] : [], sc.lights ? sc.lights(t) : []);
      const x = R.x, sky = sc.sky || W.sky;
      x.fillStyle = skyFill(R, sky); x.fillRect(0, 0, R.W, R.H);
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
      x.globalCompositeOperation = 'source-over';
      if (W.post) W.post(R, t);
      finish();
    }
    // a machine that cannot keep the beat: a smooth picture on half the pixels from then on, and on half of those if it
    // still cannot (the console's is few already)
    const low = () => { if (R.smooth && R.maxPx) R.maxPx = Math.round(R.maxPx / 2); };
    return { frame, R, seek: s => { time = s; now0 = null; beat = -1; }, edges: e => { E = e || EDGES; art = null; }, low };
  }
  // the edges of a stage: the fade from nothing to whole and back across (x) and down (y) — four points each, as parts
  // of the width and the height — and the dark round the middle (vig: a colour, its alpha how deep; none if empty), as
  // the stage's CSS gives them (--fade-x, --fade-y, --stage-vig: stageEdges)
  const EDGES = { x: [0, 0.22, 0.86, 1], y: [0, 0.12, 0.78, 1], vig: '' };
  function stageEdges(el) {
    const cs = getComputedStyle(el), four = (v, d) => { const n = String(v || '').trim().split(/[\s,]+/).map(Number); return n.length === 4 && n.every(isFinite) ? n : d; };
    return { x: four(cs.getPropertyValue('--fade-x'), EDGES.x), y: four(cs.getPropertyValue('--fade-y'), EDGES.y), vig: cs.getPropertyValue('--stage-vig').trim() };
  }
  // the mask of the edges for a canvas of w × h: the two fades multiplied, and the dark round the middle (an ellipse
  // 85 % × 95 % of the stage at 50 % 45 %, clear to 42 % of it, as deep as the alpha of vig) taken out of it as well —
  // the picture thins there over the page's own dark (the night of the grove behind it) instead of being darkened, so
  // that both are one pass — then turned over (what is taken away); at — the bands of the canvas outside the part the
  // mask leaves whole
  function edgeArt(w, h, E) {
    const mask = doc.createElement('canvas');
    mask.width = w; mask.height = h;
    const m = mask.getContext('2d'), ramp = (g, p) => { g.addColorStop(p[0], 'rgba(0,0,0,0)'); g.addColorStop(p[1], '#000'); g.addColorStop(p[2], '#000'); g.addColorStop(p[3], 'rgba(0,0,0,0)'); return g; };
    m.fillStyle = ramp(m.createLinearGradient(0, 0, w, 0), E.x); m.fillRect(0, 0, w, h);
    m.globalCompositeOperation = 'destination-in';
    m.fillStyle = ramp(m.createLinearGradient(0, 0, 0, h), E.y); m.fillRect(0, 0, w, h);
    let x0 = E.x[1] * w, x1 = E.x[2] * w, y0 = E.y[1] * h, y1 = E.y[2] * h;
    const deep = rgba(E.vig || 'rgba(0,0,0,0)')[3];
    if (deep > 0) {
      const rx = w * 0.85, ry = h * 0.95, g = m.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0.42, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${deep})`);
      m.globalCompositeOperation = 'destination-out';
      m.setTransform(rx, 0, 0, ry, w * 0.5, h * 0.45);
      m.fillStyle = g; m.fillRect(-w * 0.5 / rx, -h * 0.45 / ry, w / rx, h / ry);
      // the clear middle: the rectangle inside the ellipse at 42 %
      const cx = 0.42 * rx / Math.SQRT2, cy = 0.42 * ry / Math.SQRT2;
      x0 = Math.max(x0, w * 0.5 - cx); x1 = Math.min(x1, w * 0.5 + cx); y0 = Math.max(y0, h * 0.45 - cy); y1 = Math.min(y1, h * 0.45 + cy);
    }
    // turned over: how much of the picture goes at each point
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = 'xor';
    m.fillStyle = '#000'; m.fillRect(0, 0, w, h);
    const X0 = Math.floor(x0), X1 = Math.ceil(x1), Y0 = Math.floor(y0), Y1 = Math.ceil(y1);
    const at = X1 > X0 && Y1 > Y0 ? [[0, 0, w, Y0], [0, Y1, w, h - Y1], [0, Y0, X0, Y1 - Y0], [X1, Y0, w - X1, Y1 - Y0]] : [[0, 0, w, h]];
    return { w, h, mask, at };
  }
  // the sky of a scene: its three colours top to bottom; with the console's colours a strip of four pixels cut down to
  // its levels with the ordered dither, laid on the canvas's grid (the last few kept)
  const SKIES = new Map();
  function skyFill(R, sky) {
    if (!R.dither || !sky.every(v => /^#[0-9a-f]{6}$/i.test(v))) {
      const g = R.x.createLinearGradient(0, 0, 0, R.H);
      g.addColorStop(0, sky[0]); g.addColorStop(0.55, sky[1]); g.addColorStop(1, sky[2]);
      return g;
    }
    const key = R.H + '|' + sky.join() + '|' + R.dither;
    let f = SKIES.get(key);
    if (f && f.x === R.x) return f.pat;
    const H = R.H, c = doc.createElement('canvas');
    c.width = 4; c.height = H;
    const cx = c.getContext('2d'), img = cx.createImageData(4, H), q = dith(R.dither);
    const hex = v => [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)], S0 = hex(sky[0]), S1 = hex(sky[1]), S2 = hex(sky[2]);
    for (let y = 0; y < H; y++) {
      const u = (y + 0.5) / H, A = u < 0.55 ? S0 : S1, B = u < 0.55 ? S1 : S2, k = u < 0.55 ? u / 0.55 : (u - 0.55) / 0.45;
      for (let xx = 0; xx < 4; xx++) { const i = (y * 4 + xx) * 4; for (let ch = 0; ch < 3; ch++) img.data[i + ch] = q(A[ch] + (B[ch] - A[ch]) * k, xx, y); img.data[i + 3] = 255; }
    }
    cx.putImageData(img, 0, 0);
    if (SKIES.size > 6) SKIES.delete(SKIES.keys().next().value);
    f = { x: R.x, pat: R.x.createPattern(c, 'repeat') };
    SKIES.set(key, f);
    return f.pat;
  }

  /* The worker of the scenes. A scene costs: its shapes in script, then the browser rasterizing thousands of
     textured triangles — on a computer without the graphics card for the page, a scene ate the page's whole thread and
     the page scrolled in jerks. Where the browser can, the stage (and the crypt and the grove behind the page) hands its canvases to a worker
     (transferControlToOffscreen): the same file loaded there again over a stand-in of the page (workerBoot), the scene
     drawn there, the page only says where it is — its size, on the screen or not, the page awake, calm or asleep, less
     motion. Where it cannot (a page from file://, the book in one file, an older browser, a check that draws the frames
     itself through window.BASIL_STAGES) — on the page as before */
  function workerBoot(o) {
    const stub = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, setAttribute() {}, getAttribute: () => null, hasAttribute: () => false, appendChild() {}, insertBefore() {}, remove() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, querySelector: () => null, querySelectorAll: () => [] });
    const media = { matches: o.reduce, addEventListener() {}, removeEventListener() {} };
    self.window = self;
    self.devicePixelRatio = o.dpr;
    self.matchMedia = () => media;
    self.MutationObserver = function () { return { observe() {}, disconnect() {} }; };
    self.document = Object.assign(stub(), { documentElement: stub(), body: null, hidden: false, scripts: [], createElement: tag => (tag === 'canvas' ? new OffscreenCanvas(300, 150) : stub()) });
    self.psxMedia = media;
    importScripts(o.src);
  }
  // what the worker draws on a canvas the page sends: a scene, the crypt behind the page
  const sized = (m, s) => Object.assign(s, { size: q => { m.cv.clientWidth = q.w; m.cv.clientHeight = q.h; } });
  const OFF = {
    stage: m => { const r = sized(m, sceneOn(m.cv, m.view, m.skin)); r.edges(m.edges); return r; },
    crypt: m => sized(m, cryptOn(m.cv)),
    grove: m => groveOn({ fly: m.cv, ...m.extras }, m.C, m.lay)
  };
  // in the worker: the canvases the page sends, drawn by one clock — a beat thirty times a second (fifteen when the page
  // is calm, none asleep), each canvas on every beat or every second one (fps: a scene 30, the crypt and the grove 15),
  // so that what changes on the screen changes together: every canvas drawn apart from the others is one more time
  // the browser puts the whole screen together; none off the screen, a still frame with less motion. A machine that
  // cannot keep the beat (the frames of a scene come late) is told to the page once (low), and the scenes draw on fewer
  // pixels from then on
  function sceneHost() {
    const runs = new Map(), mols = new Map();
    let state = 'active', pending = false, prev = -1e9, beat = 0, ema = 0, warm = 0, lows = 0;
    const raf = self.requestAnimationFrame ? fn => self.requestAnimationFrame(fn) : fn => setTimeout(() => fn(performance.now()), 16);
    // a canvas wants frames while the page says it is seen; with less motion only one, when it is new or changed (fresh)
    const live = r => r.want && (r.fresh || !reduce.matches);
    function loop(now) {
      pending = false;
      if (state === 'sleep' || ![...runs.values()].some(live)) return;
      wake();
      const base = state === 'calm' ? 15 : 30, iv = now - prev;
      if (iv < 1000 / base * (state === 'calm' ? 0.75 : 1) - 3) return;
      prev = now;
      beat++;
      let staged = false;
      runs.forEach(r => {
        if (!live(r) || !(r.fresh || beat % Math.max(1, Math.round(base / Math.min(base, r.fps))) === 0)) return;
        r.fresh = false;
        r.s.frame(now);
        if (r.kind === 'stage') staged = true;
        if (!r.shown) { r.shown = true; postMessage({ type: 'drawn', id: r.id }); }
      });
      // the beat kept or not, while a scene is drawn and the page awake: late by half again for a while — low (and once
      // more, if it is still late on half the pixels)
      if (staged && state === 'active' && lows < 2 && iv < 1000) {
        if (warm < 60) { warm++; ema = iv; } else {
          ema += (Math.min(200, iv) - ema) * 0.05;
          if (ema > 48) { lows++; warm = 0; runs.forEach(r => { if (r.s.low) r.s.low(); }); postMessage({ type: 'low' }); }
        }
      }
    }
    const wake = () => { if (!pending && state !== 'sleep') { pending = true; raf(loop); } };
    self.onmessage = e => {
      const m = e.data, r = runs.get(m.id);
      if (m.type === 'canvas') {
        m.cv.clientWidth = m.w; m.cv.clientHeight = m.h;
        const q = { id: m.id, kind: m.kind, s: OFF[m.kind](m), want: false, fresh: true, shown: false, fps: m.fps };
        for (let i = 0; i < lows; i++) if (q.s.low) q.s.low();
        runs.set(m.id, q);
      } else if ((m.type === 'size' || m.type === 'lay' || m.type === 'edges') && r) {
        if (m.type === 'size' && r.s.size) r.s.size(m);
        if (m.type === 'lay' && r.s.lay) r.s.lay(m.lay);
        if (m.type === 'edges' && r.s.edges) r.s.edges(m.edges);
        r.fresh = true;
      }
      else if (m.type === 'run' && r) { r.want = m.on; if (m.on) { r.fresh = true; warm = 0; } }
      else if (m.type === 'drop') runs.delete(m.id);
      else if (m.type === 'mol') {
        // a molecule for the page's viewer: drawn on a canvas of its size here, sent back as a picture
        const c = mols.get(m.id) || new OffscreenCanvas(m.cw, m.ch);
        mols.set(m.id, c);
        if (c.width !== m.cw || c.height !== m.ch) { c.width = m.cw; c.height = m.ch; }
        MOLDRAW[m.skin](c.getContext('2d'), m.mol, m.P, m.R3, m.W, m.H);
        const bmp = c.transferToImageBitmap();
        postMessage({ type: 'mol', id: m.id, bmp }, [bmp]);
        return;
      }
      else if (m.type === 'state') { state = m.state; warm = 0; }
      else if (m.type === 'reduce') { self.psxMedia.matches = m.on; runs.forEach(q => { q.fresh = true; }); }
      wake();
    };
  }
  // on the page: the one worker of all its stages, made the first time a stage asks for it (null where it cannot be)
  let sceneWorker, stageIds = 0;
  const workerWaits = new Map();
  function scenesWorker() {
    if (sceneWorker !== undefined) return sceneWorker;
    sceneWorker = null;
    if (!SELF_SRC || location.protocol === 'file:' || Array.isArray(window.BASIL_STAGES) || !window.Worker || !window.OffscreenCanvas || !(HTMLCanvasElement.prototype.transferControlToOffscreen)) return null;
    try {
      const boot = `(${workerBoot})(${JSON.stringify({ src: SELF_SRC, dpr: Math.min(2, window.devicePixelRatio || 1), reduce: reduce.matches })});`;
      const w = new Worker(URL.createObjectURL(new Blob([boot], { type: 'text/javascript' })));
      w.onmessage = e => {
        // the worker cannot keep the beat of its scenes: the page struggles too (its glass loses its blur)
        if (e.data.type === 'low') { if (SC && SC.setLow) SC.setLow(); return; }
        const f = workerWaits.get(e.data.id);
        if (f) f(e.data);
      };
      // the worker failed (its file did not load): every stage it had draws on the page again, on fresh canvases
      w.onerror = () => { sceneWorker = null; w.terminate(); workerWaits.forEach(f => f({ type: 'failed' })); };
      const state = () => w.postMessage({ type: 'state', state: SC && SC.calm ? SC.calm.state : 'active' });
      doc.addEventListener('basil:calm', state);
      reduce.addEventListener('change', () => w.postMessage({ type: 'reduce', on: reduce.matches }));
      state();
      sceneWorker = w;
    } catch (e) { sceneWorker = null; }
    return sceneWorker;
  }

  // a canvas the worker draws: kind — what it draws there (OFF), o — what it needs to know of it, fps — its frames a
  // second; extras — more canvases of it by name (the glow of a scene, the panes of the grove); drawn() — called when its
  // first frame is there. The page sends the canvases once, then the size and whether it is wanted (on the screen, the tab
  // in front); post() — anything else it has to say. Gives null where there is no worker; again(canvas, extras) — how it
  // is drawn on the page if the worker fails after all, on fresh canvases in the old ones' places
  function offCanvas(cv, kind, o, fps, again, extras = {}, drawn) {
    const wk = scenesWorker();
    if (!wk) return null;
    const id = ++stageIds, post = (m, tr) => { if (sceneWorker) sceneWorker.postMessage({ ...m, id }, tr || []); };
    const names = Object.keys(extras).filter(n => extras[n]);
    const a = cv.transferControlToOffscreen(), more = {};
    names.forEach(n => { more[n] = extras[n].transferControlToOffscreen(); });
    post({ type: 'canvas', kind, ...o, fps, cv: a, extras: more, w: cv.clientWidth, h: cv.clientHeight }, [a, ...Object.values(more)]);
    [cv, ...names.map(n => extras[n])].forEach(c => { c.dataset.off = ''; });
    let seen = false, on = null, local = null;
    const wanted = () => seen && !doc.hidden;
    const run = () => { if (on !== wanted()) { on = wanted(); post({ type: 'run', on }); } };
    workerWaits.set(id, m => {
      if (m.type === 'drawn' && drawn) drawn();
      if (m.type === 'failed' && !local) {
        // the canvases are the worker's for good: fresh ones in their places
        const fresh = c => { const f = c.cloneNode(false); delete f.dataset.off; c.replaceWith(f); return f; };
        const fe = {};
        names.forEach(n => { fe[n] = fresh(extras[n]); });
        cv = fresh(cv);
        local = again(cv, fe);
      }
    });
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => post({ type: 'size', w: cv.clientWidth, h: cv.clientHeight })) : null;
    if (ro) ro.observe(cv);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { seen = es.some(e => e.isIntersecting); run(); }) : null;
    if (io) io.observe(cv); else { seen = true; run(); }
    doc.addEventListener('visibilitychange', run);
    return {
      post,
      destroy() {
        if (local) local.destroy();
        post({ type: 'drop' });
        workerWaits.delete(id);
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        doc.removeEventListener('visibilitychange', run);
        cv.remove();
      }
    };
  }

  // the scene as the background of its block (the head of a chapter, the hero of the home page): no finger turns it,
  // nothing is tapped; it goes on by itself. One canvas: its glow and its edges are drawn into it (sceneOn)
  function stage(host, view, skin) {
    const W = WORLDS[skin], set = SCENES[skin];
    const holder = doc.createElement('div');
    holder.className = 'psx-stage is-backdrop';
    holder.dataset.scene = set[view] ? view : 'glavnaya';
    holder.dataset.skin = skin;
    holder.setAttribute('aria-hidden', 'true');
    // the ground under the words, like the paper of a picture (tests/overlap.js lets text lie on it)
    holder.dataset.bg = '';
    const canvas = () => { holder.textContent = ''; const c = doc.createElement('canvas'); holder.appendChild(c); return c; };
    let cv = canvas();
    host.insertBefore(holder, host.firstChild);
    let seen = false;
    const wanted = () => seen && !doc.hidden;
    // the edges as the stage's CSS has them now (they change with the width of the screen)
    let edgesNow = stageEdges(holder), sOn = null;
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => {
      const e = stageEdges(holder);
      if (JSON.stringify(e) === JSON.stringify(edgesNow)) return;
      edgesNow = e;
      if (off) off.post({ type: 'edges', edges: e });
      if (sOn) sOn.edges(e);
    }) : null;
    if (ro) ro.observe(holder);

    // drawn by the worker where it can be; if it fails after all, on the page on a fresh canvas
    const off = offCanvas(cv, 'stage', { view, skin, edges: edgesNow }, W.fps || 30, () => { cv = canvas(); seen = true; const L = onPage(); L.start(); return { destroy() { L.stop(); } }; }, {}, () => holder.classList.add('is-drawn'));
    if (off) return { destroy() { if (ro) ro.disconnect(); off.destroy(); holder.remove(); } };

    // drawn on the page: runs while on the screen, by the page's frame budget; one still frame with reduced motion
    function onPage() {
      const s = sceneOn(cv, view, skin);
      s.edges(edgesNow);
      sOn = s;
      // the beat kept or not while the page is awake (as in the worker): late by half again for a while — the page
      // struggles, and the scene goes on fewer pixels
      let last = 0, ema = 0, warm = 0, lows = 0;
      const kept = ts => {
        const iv = ts - last;
        if (lows > 1 || !last || iv > 1000 || !SC || !SC.calm || SC.calm.state !== 'active') { warm = 0; last = ts; return; }
        last = ts;
        if (warm < 60) { warm++; ema = iv; return; }
        ema += (Math.min(200, iv) - ema) * 0.05;
        // still late on half the pixels: half of those again
        if (ema > 48) { lows++; warm = 0; s.low(); if (SC.setLow) SC.setLow(); }
      };
      // as many frames on a phone as anywhere: at 20 the scenes judder
      const L = psxLoop(ts => { if (!wanted()) { L.stop(); last = 0; return; } kept(ts); s.frame(ts); holder.classList.add('is-drawn'); if (reduce.matches) L.stop(); }, W.fps || 30, W.fps || 30);
      // a check that draws the scene frame by frame itself (tests/motion.js) sets window.BASIL_STAGES = [] before the
      // page; seek sets the scene's clock, a minute into the page in a moment
      if (Array.isArray(window.BASIL_STAGES)) window.BASIL_STAGES.push({ frame: s.frame, R: s.R, stop: () => L.stop(), seek: s.seek });
      return L;
    }
    const L = onPage();
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { seen = es.some(e => e.isIntersecting); if (seen) L.start(); else L.stop(); }) : null;
    if (io) io.observe(holder); else { seen = true; L.start(); }
    const vis = () => { if (wanted()) L.start(); };
    doc.addEventListener('visibilitychange', vis);
    return {
      destroy() {
        L.stop();
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        doc.removeEventListener('visibilitychange', vis);
        holder.remove();
      }
    };
  }

  // Прищипка и сбор: a pot on an old stump, the top of the stem growing; a sickle circling it like a crescent moon
  // comes down and cuts the top above a pair of leaves; the top falls to the floor, and two new shoots come out of that
  // pair, so the bush grows wide instead of tall; then time goes back in a violet shimmer and it begins again
  scene('grimoire', 'formirovka', S => {
    const { R, T } = S, CYCLE = 12, SW = 4.6, s = 1.15;
    let cut = [0, 2.1, 0], sick = [1, 2.5, 0], tip = null, phase = 0;
    // the moment of the cycle: the sickle cuts at SW
    const at = t => ((t % CYCLE) + CYCLE) % CYCLE;
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
  // down into the water and swaying like weed, bubbles rising from the stone of the air pump. Now and then it lets out a
  // burst of bubbles by itself
  scene('grimoire', 'gidro', S => {
    const { R, T } = S, TOP = 0.92, LID = 1.12;
    const ROOTS = [...Array(9)].map((_, i) => ({ q: i / 9 * Math.PI * 2 + 0.3, r: 0.03 + (i % 3) * 0.035, len: 0.55 + ((i * 7) % 5) / 14, ph: i * 1.3 }));
    const BUB = [...Array(22)].map((_, i) => ({ a: (i * 0.618) % 1, s: 0.35 + (i % 5) / 9, dx: ((i * 37) % 11 - 5) / 70, dz: ((i * 23) % 11 - 5) / 90 }));
    let bursts = [];
    const glass = { col: [70, 110, 130], emis: true, nofog: true, add: 0.12, layer: 2 };
    return {
      glow: [70, 200, 255], near: 4.2, look: [0, 1.15, 0], still: 3,
      every: 7, beat(t) { bursts.push(t); if (bursts.length > 3) bursts.shift(); },
      lights(t) { return [{ p: [0, 0.5, 0.1], col: [0.3, 0.8, 1], i: 1 + 0.15 * Math.sin(t * 2.1), fall: 0.7 }]; },
      draw(t) {
        // the water: its far walls first, then its near ones and its surface, light added to what is behind
        box(R, [0, TOP / 2 + 0.01, 0], [0.6, TOP / 2, 0.4], { col: [24, 90, 130], emis: true, nofog: true, add: 0.3, inv: true, layer: 2 });
        box(R, [0, TOP / 2 + 0.01, 0], [0.6, TOP / 2, 0.4], { col: [30, 110, 150], emis: true, nofog: true, add: 0.26, layer: 2 });
        box(R, [0, 0.55, 0], [0.63, 0.55, 0.43], glass);
        // the lid and what goes through it are drawn together: under it the top edges of the frame, the roots and the
        // cup below the lid, then the lid, then the cup above it and the bush — by depth alone the cup under the lid
        // showed through it as a ring
        const part = together(R, [0, LID, 0]), Under = part(0), Over = part(2);
        // the frame of the tank: its twelve edges
        const X = 0.63, Y = 1.1, Z = 0.43, E = { col: [150, 170, 180] };
        [[-X, -Z], [X, -Z], [X, Z], [-X, Z]].forEach(([x, z]) => rod(R, [x, 0, z], [x, Y, z], 0.014, E, 3));
        [[0, R], [Y, Under]].forEach(([y, P]) => { rod(P, [-X, y, -Z], [X, y, -Z], 0.014, E, 3); rod(P, [-X, y, Z], [X, y, Z], 0.014, E, 3); rod(P, [-X, y, -Z], [-X, y, Z], 0.014, E, 3); rod(P, [X, y, -Z], [X, y, Z], 0.014, E, 3); });
        // the lid, the net cup with its clay pebbles (its wall widening from 0.13 to 0.17, cut where it meets the top of
        // the lid), the bush
        const LT = LID + 0.025, rLT = 0.13 + 0.04 * (LT - (LID - 0.2)) / 0.26;
        box(part(1), [0, LID, 0], [0.66, 0.025, 0.46], { col: [44, 40, 52] });
        prism(Under, 0, 0, LID - 0.2, LT, 0.13, rLT, 8, { col: [64, 62, 72] });
        prism(Over, 0, 0, LT, LID + 0.06, rLT, 0.17, 8, { col: [64, 62, 72] }, [150, 92, 60]);
        bush(Over, T, [0, LID + 0.06, 0], t, { s: 1.1 });
        // the roots: white threads from the cup into the water, swaying
        ROOTS.forEach(r => {
          let p = [Math.cos(r.q) * r.r, LID - 0.2, Math.sin(r.q) * r.r];
          for (let j = 1; j <= 6; j++) {
            const f = j / 6, sw = Math.sin(t * 0.9 + r.ph + j * 0.7) * 0.045 * f;
            const q = [Math.cos(r.q) * (r.r + f * 0.16) + sw, LID - 0.2 - f * r.len, Math.sin(r.q) * (r.r + f * 0.12) + Math.cos(t * 0.7 + r.ph + j) * 0.03 * f];
            rod(Under, p, q, 0.014 * (1.2 - f * 0.6), { col: [226, 216, 190] }, 3);
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
  // Круга, свечей и колонн нет: главная не похожа на главы
  scene('grimoire', 'glavnaya', S => {
    const { R, T } = S;
    R.fog = [14, 10, 20]; R.fogNear = 3.5; R.fogFar = 12; R.amb = [0.22, 0.18, 0.28];
    const BEDS = [];
    for (const z of [1.45, 0.1, -1.25]) for (const x of [-1.1, 1.1]) BEDS.push({ x, z });
    const ARCH = [-2.05, -0.7, 0.65, 2.0];
    const GLYPH = [0, 1, 2, 3, 4, 5].map(k => glyphTex(k, [236, 196, 96]));
    const SMALLP = [[0.22, 0.4, 0.1], [0.5, 0.32, -0.05], [0.78, 0.22, -0.35], [0.95, 0.13, -0.6]];
    const FLASK = [0.98, 0.14, -1.9], EVERY = 1.5, RUN = 1.7;
    let glow = BEDS.map(() => 0), drop = null, lastT = 0;
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
      tick(t) {
        const dt = Math.max(0, Math.min(0.2, t - lastT)); lastT = t;
        const n = Math.floor(t / EVERY), sends = [n * EVERY];
        drop = null;
        for (const s of sends) {
          const u = (t - s) / RUN, i = Math.round(s / EVERY) % BEDS.length;
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
          // the frame round the earth, not a lid under it: a lid 0.005 under the earth, put in the painter's order by
          // its own depth, now and then covered the earth whole
          box(R, [b.x, 0.14, b.z], [0.46, 0.14, 0.58], { tex: T.stone, skip: 'top' });
          const rim = (x0, x1, z0, z1) => quad(R, [x0, 0.28, z1], [x1, 0.28, z1], [x1, 0.28, z0], [x0, 0.28, z0], { tex: T.stone, ctr: [b.x, 0.14, b.z] }, (x0 - b.x + 0.46) / 0.92, (x1 - b.x + 0.46) / 0.92, (z0 - b.z + 0.58) / 1.16, (z1 - b.z + 0.58) / 1.16);
          rim(b.x - 0.46, b.x + 0.46, b.z + 0.52, b.z + 0.58);
          rim(b.x - 0.46, b.x + 0.46, b.z - 0.58, b.z - 0.52);
          rim(b.x - 0.46, b.x - 0.4, b.z - 0.52, b.z + 0.52);
          rim(b.x + 0.4, b.x + 0.46, b.z - 0.52, b.z + 0.52);
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
        // the furnace and its mouth drawn together, the fire over the stone: by depth alone half the fire, a hair in front
        // of the stone, went behind it and showed a triangle. In the mouth: the glow of the coals, three tongues of flame
        const oven = together(R, [0, 0.32, -1.9]), fl = 0.8 + 0.2 * Math.sin(t * 13);
        box(oven(0), [0, 0.32, -2.3], [0.42, 0.32, 0.4], { tex: T.stone });
        quad(oven(1), [-0.17, 0.05, -1.895], [0.17, 0.05, -1.895], [0.17, 0.36, -1.895], [-0.17, 0.36, -1.895], { col: [40, 10, 6] });
        quad(oven(2), [-0.15, 0.06, -1.892], [0.15, 0.06, -1.892], [0.15, 0.16, -1.892], [-0.15, 0.16, -1.892], { col: [255, 110 * fl + 40, 30], emis: true, nofog: true });
        [-0.08, 0, 0.08].forEach((x, k) => {
          const h = (0.15 + 0.05 * Math.sin(t * (9 + k * 3) + k * 2)) * fl;
          quad(oven(3), [x - 0.055, 0.1, -1.889], [x + 0.055, 0.1, -1.889], [x + 0.055, 0.1 + h, -1.889], [x - 0.055, 0.1 + h, -1.889], { tex: T.flame, emis: true, nofog: true, cut: true }, 0, 1, 0, 1);
        });
        // the copper pot sits on the furnace, drawn after it
        ball(oven(4), [0, 0.98, -2.3], 0.36, { col: [196, 118, 64] });
        prism(oven(4), 0, -2.3, 1.25, 1.62, 0.11, 0.05, 6, { col: [196, 118, 64] });
        rod(R, [0, 1.62, -2.3], [0.35, 1.72, -2.3], 0.035, { col: [196, 118, 64] }, 4);
        rod(R, [0.35, 1.72, -2.3], [0.92, 1.05, -2.3], 0.03, { col: [196, 118, 64] }, 4);
        prism(R, 0.98, -2.3, 0, 0.78, 0.22, 0.24, 8, { col: [112, 72, 44] }, [70, 46, 30]);
        for (let k = 0; k < 16; k++) { const a0 = k * 0.9, a1 = (k + 1) * 0.9, y0 = 1.02 - k * 0.045, y1 = y0 - 0.045; rod(R, [0.98 + Math.cos(a0) * 0.27, y0, -2.3 + Math.sin(a0) * 0.27], [0.98 + Math.cos(a1) * 0.27, y1, -2.3 + Math.sin(a1) * 0.27], 0.018, { col: [206, 128, 70] }, 3); }
        rod(R, [0.98, 0.3, -2.05], add(FLASK, [0, 0.14, 0]), 0.016, { col: [206, 128, 70] }, 3);
        ball(R, FLASK, 0.09, { col: [120, 255, 110], emis: true, nofog: true });
        ball(R, FLASK, 0.13, { col: [120, 150, 170], emis: true, nofog: true, add: 0.2 });
        // the pipe along the path, both sides, in six lengths: one long face, put in the painter's order by its middle,
        // went under the side of a bed near the camera
        [-0.56, 0.56].forEach(x => { for (let k = 0; k < 6; k++) rod(R, [x, 0.08, -1.9 + k * 3.8 / 6], [x, 0.08, -1.9 + (k + 1) * 3.8 / 6], 0.02, { col: [176, 104, 56] }, 3); });
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
  // its stars and moon; beside the pot an hourglass runs down the time to the next task and turns itself over
  scene('grimoire', 'moy', S => {
    const { R, T } = S, DAY = 18, RUN = 7.8, FLIP = 0.8, EVERY = 9.2, SILL = 0.965, Z = -0.4;
    const HG = [0.5, 0.04];
    let sun = [0, 1.6, Z + 0.02], day = 1, sand = 0, flip = 0;
    const at = t => ((t % EVERY) + EVERY) % EVERY;
    return {
      glow: [230, 110, 200], orbit: [Math.PI / 2, 0.4], rad: 4.3, near: 3.6, look: [0, 1.5, 0], still: 4,
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
        // the wall under the window (its top, under the sill, left out), the sill, the posts and the arch
        box(R, [0, 0.45, Z + 0.05], [0.95, 0.45, 0.12], { tex: T.stone, skip: 'top' });
        // the sill: its top in two, the strip the posts stand on and the rest before them — one face under both, put
        // in the painter's order by its middle, went over the feet of the posts; it ends where the window begins
        box(R, [0, SILL - 0.035, -0.08], [1.0, 0.035, 0.32], { tex: T.stone, skip: 'top' });
        quad(R, [-1, SILL, -0.23], [1, SILL, -0.23], [1, SILL, -0.4], [-1, SILL, -0.4], { tex: T.stone }, 0, 1, 0, 0.27);
        // the rest of it in small stones, so that what stands on it (the pot, the hourglass) is put in order by its own
        for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
          const x0 = -1 + i / 4, z0 = -0.23 + j * 0.235;
          quad(R, [x0, SILL, z0 + 0.235], [x0 + 0.25, SILL, z0 + 0.235], [x0 + 0.25, SILL, z0], [x0, SILL, z0], { tex: T.stone }, i / 8, (i + 1) / 8, 0.27 + j * 0.365, 0.27 + (j + 1) * 0.365);
        }
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
        // the sky lies behind all that is in the window — the sun, the moon, the bush — on a layer of its own
        sky({ tex: T.sky, emis: true, nofog: true, ds: true, layer: 0.5 });
        if (day > 0) sky({ col: [96, 120, 200], emis: true, nofog: true, ds: true, add: 0.75 * day, layer: 0.5 }, 0.005);
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
  // of peat with seedlings, each a step behind the other
  scene('grimoire', 'posadka', S => {
    const { R, T } = S, CYCLE = 10, EARTH = 0.36;
    let seed = null, burst = -1;
    const CUPS = [...Array(6)].map((_, i) => { const q = i / 6 * Math.PI * 2 + 0.26; return [Math.cos(q) * 1.55, Math.sin(q) * 1.55]; });
    return {
      glow: [255, 150, 50], rad: 4.6, near: 3.7, look: [0, 0.6, 0], still: 6.2,
      // a warm light over the well, and the seed's own while it comes down
      lights() { return [{ p: [0.2, 1.3, 0.5], col: [1, 0.72, 0.42], i: 0.9, fall: 0.7 }].concat(seed ? [{ p: seed, col: [1, 0.8, 0.4], i: 0.8, fall: 2 }] : []); },
      draw(t) {
        // the well: a ring of stone filled with earth
        prism(R, 0, 0, 0, EARTH, 0.74, 0.7, 10, { tex: T.stone });
        ringTop(R, 0, 0, EARTH, 0.62, 0.7, 10, { tex: T.stone });
        prism(R, 0, 0, EARTH - 0.12, EARTH, 0.62, 0.62, 10, { col: [44, 34, 40], inv: true });
        disc(R, 0, 0, EARTH - 0.04, 0.62, 10, { tex: T.soil });
        const u = t % CYCLE;
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
        const u = t % CYCLE;
        if (u > 1.8 && u < 2.6) for (let i = 0; i < 10; i++) { const q = i * 0.63, l = (u - 1.8) / 0.8; F.dot([Math.cos(q) * l * 0.3, EARTH + Math.sin(l * Math.PI) * 0.15, Math.sin(q) * l * 0.3], 'rgba(150,104,64,.9)'); }
        if (burst >= 0) for (let i = 0; i < 24; i++) { const q = i * 0.9, l = burst; F.spark([Math.cos(q) * (0.1 + l * 0.5), EARTH + 0.1 + (i % 6) * 0.09 + l * 0.8, Math.sin(q) * (0.1 + l * 0.5)], l, true); }
      }
    };
  });
  // Проблемы: the bush on the altar under siege — beetles creep in round the circle towards it and are thrown back by
  // the ward with a red flash, a spider comes down on its thread and climbs back, one lower leaf has gone yellow with
  // brown spots. Every few seconds the ward flares up by itself: every beetle is thrown back at once
  scene('grimoire', 'problemy', S => {
    const { R, T } = S, N = 6, OUT = 2.45, IN = 1.25, CRAWL = 9;
    let warded = -99, flash = 0, bugs = [], spider = [0.3, 3, 0.12];
    return {
      glow: [255, 44, 44], near: 4.8, still: 5.3,
      glowAdd(t) { return 0.3 + 0.18 * Math.sin(t * 1.4) + flash * 0.6; },
      every: 8, beat(t) { warded = t; },
      tick(t) {
        // each beetle creeps in along a spiral and is flung back at the ward; the ward's flare flings them all
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
  // front, rises into a beam of light and turns itself; the table turns on to the next by itself
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
    let pos = 0, chosen = [0, 0, 0];
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      glow: [176, 110, 255], orbit: [0.75, 0.42], rad: 5, near: 4.2, look: [0, 1.15, 0], still: 1,
      tick(t) {
        const target = Math.floor(t / STEP);
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
  // light circling it, a quill in its inkpot beside
  scene('grimoire', 'spravka', S => {
    const { R, T } = S, EVERY = 5, TURN = 1.5, TILT = 0.5, O = [0, 1.0, 0];
    let phi = 0;
    const at = t => ((t % EVERY) + EVERY) % EVERY;
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
      tick(t) { phi = Math.PI * smooth((at(t) - (EVERY - TURN)) / TURN); },
      lights(t) { return [{ p: [0, 1.7, 0.3], col: [1, 0.8, 0.45], i: 0.7 + 0.1 * Math.sin(t * 2), fall: 0.8 }]; },
      draw(t) {
        // the lectern and its book are drawn together, part over part: the stone, the board, the cover, the blocks of
        // pages, the leaves, the leaf turning — the faces of the book lie almost on the board, and by depth alone they
        // would cut through one another
        const part = together(R, O);
        // the column stands on its base (from its top up, not through it: its foot inside the base showed over it)
        box(part(0), [0, 0.48, 0], [0.18, 0.36, 0.18], { tex: T.stone });
        box(part(0), [0, 0.06, 0], [0.34, 0.06, 0.34], { tex: T.stone });
        // the board, the book and its pages, turned to the slope of the lectern; the book's spine along its slope
        const Bk = k => turned(part(k), [0, 0, 0], [1, 0, 0], TILT, O);
        box(Bk(1), [0, -0.04, 0], [0.8, 0.03, 0.44], { tex: T.stone });
        box(Bk(2), [0, 0.005, 0], [0.54, 0.012, 0.37], { tex: T.leather });
        box(Bk(3), [-0.25, 0.035, 0], [0.24, 0.022, 0.335], { col: [214, 196, 152] });
        box(Bk(3), [0.25, 0.035, 0], [0.24, 0.022, 0.335], { col: [214, 196, 152] });
        pageStrips(Bk(4), Math.PI, T.pageL, true);
        pageStrips(Bk(4), 0, T.pageR, false);
        if (phi > 0 && phi < Math.PI) pageStrips(Bk(5), phi, phi < Math.PI / 2 ? T.pageR : T.pageL, phi >= Math.PI / 2);
        // the inkpot and its quill on the corner of the board
        prism(Bk(2), 0.66, 0.24, -0.01, 0.1, 0.07, 0.06, 6, { col: [34, 28, 44] }, [12, 8, 18]);
        const qb = [0.66, 0.08, 0.24], qt = [0.8, 0.5, 0.12];
        rod(Bk(2), qb, qt, 0.008, { col: [226, 214, 196] }, 3);
        leaf(Bk(2), add(qb, mul(sub(qt, qb), 0.35)), norm(sub(qt, qb)), 0.36, T.feather, { w: 0.22, curl: 0.1, side: [0, 0, 1] });
        // the runes round the book
        for (let k = 0; k < 8; k++) {
          const q = t * 0.35 + k / 8 * Math.PI * 2;
          billboard(R, [Math.cos(q) * 1, 1.5 + Math.sin(t * 1.1 + k) * 0.12, Math.sin(q) * 0.75], 0.062, 0.093, { tex: T.runes[k % 6], emis: true, nofog: true, cut: true });
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
  // a drop of its light in an arc into the pot; the light climbs the stem and the leaves take its colour
  scene('grimoire', 'udobreniya', S => {
    const { R, T } = S, EVERY = 3.6, FLY = 1.3, CLIMB = 1.1;
    const COL = [[120, 140, 255], [255, 112, 64], [255, 206, 80]];
    const FL = [0, 1, 2].map(i => { const q = Math.PI / 2 + i / 3 * Math.PI * 2; return [Math.cos(q) * 1.15, Math.sin(q) * 1.15]; });
    let drop = null, climb = null, earthY = 1.47;
    // the drop in flight: from the neck of its flask up and over into the earth
    const path = (k, u) => {
      const a = [FL[k][0], 1.12, FL[k][1]], b = [0, earthY + 0.02, 0], m = mul(add(a, b), 0.5);
      return [a[0] + (b[0] - a[0]) * u, m[1] + 0.95 - 0.95 * (2 * u - 1) ** 2 + (b[1] - a[1]) * (u - 0.5), a[2] + (b[2] - a[2]) * u];
    };
    return {
      glow: [140, 255, 96], near: 4.5, look: [0, 1.3, 0], still: 1.9,
      tick(t) {
        // the sends: one every few seconds, in turn
        const n = Math.floor(t / EVERY);
        const sends = [{ t: n * EVERY, k: n % 3 }, { t: (n - 1) * EVERY, k: (n + 2) % 3 }];
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
  // warm
  scene('grimoire', 'uhod', S => {
    const { R, T } = S, DAY = 24, RAIN = 5;
    let rainAt = -99, orb = [0, 3, 0], day = 1, rise = 1, cloud = null, wet = 0, lean = [0, 0];
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
      tick(t) {
        const sun = sky(t);
        // the light of the sky goes over from the moon's to the sun's and back without a jump
        R.key = { dir: norm(sub(orb, [0, 1.4, 0])), i: 0.22 + (sun ? 0.7 * day : 0.1 * rise), col: mix3([0.5, 0.6, 1], [1, 0.86, 0.6], sun ? smooth(day / 0.3) : 0) };
        // the bush leans after the sun, slowly, and stands up straight at night
        const want = sun ? [orb[0] * 0.09 * day, 0] : [0, 0];
        lean = mix3([lean[0], lean[1], 0], [want[0], want[1], 0], 0.04).slice(0, 2);
        if (reduce.matches) lean = want;
        // the rain: once a day; the earth dries over the rest of the day
        const auto = Math.floor((t - 5) / DAY) * DAY + 5;
        rainAt = auto;
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
  // molecule of eugenol going up and fading. Now and then a handful of leaves falls in
  scene('grimoire', 'vkus', S => {
    const { R, T } = S, mol = molShape('eug');
    let top = 1.08, hands = [];
    const FALL = [...Array(7)].map((_, i) => ({ a: i / 7, x: ((i * 0.61) % 1 - 0.5) * 0.5, z: ((i * 0.37) % 1 - 0.5) * 0.4, s: 0.7 + (i % 3) * 0.12 }));
    // a leaf tumbling down from above into the mortar, k — how far it has fallen
    const falling = (R, x, z, k, spin) => {
      const y = 3.1 - k * (3.1 - top - 0.28);
      const F = norm([Math.cos(spin), Math.sin(spin * 0.7) * 0.8, Math.sin(spin)]);
      leaf(R, [x * (1 - k * 0.6), y, z * (1 - k * 0.6)], F, 0.26, T.leaf, { side: [Math.sin(spin * 1.3), 0.5, Math.cos(spin * 1.3)] });
    };
    return {
      glow: [200, 236, 96], near: 4.4, look: [0, 1.7, 0], still: 2.4,
      every: 6, beat(t) { hands.push(t); if (hands.length > 3) hands.shift(); },
      lights(t) { return [{ p: [0.2, top + 1.1, 0.5], col: [1, 0.8, 0.5], i: 1 + 0.1 * Math.sin(t * 2), fall: 0.6 }, { p: [0, top + 0.5, 0], col: [0.6, 1, 0.4], i: 0.5, fall: 2 }]; },
      draw(t) {
        // a kitchen table of old wood, and all on it drawn together: the legs, the top, then what stands on it, each
        // by its own depth — the big face of the top, by its own depth, went over the inside of the mortar, and the
        // legs over its corners (the tops of the legs, under it, are left out)
        top = 1.06;
        const part = together(R, [0, top, 0]), On = part(2);
        box(part(1), [0, top - 0.04, 0], [0.88, 0.04, 0.58], { col: [124, 80, 46] });
        [[-0.74, -0.46], [0.74, -0.46], [0.74, 0.46], [-0.74, 0.46]].forEach(([x, z]) => box(part(0), [x, (top - 0.08) / 2, z], [0.06, (top - 0.08) / 2, 0.06], { col: [96, 60, 34], skip: 'top' }));
        const y0 = top, y1 = top + 0.42;
        // the mortar: its outer wall, the rim, the far inner wall, the green inside
        prism(On, 0, 0, y0, y1, 0.36, 0.48, 10, { tex: T.stone });
        ringTop(On, 0, 0, y1, 0.38, 0.48, 10, { tex: T.stone });
        prism(On, 0, 0, y0 + 0.16, y1, 0.28, 0.38, 10, { col: [92, 82, 98], inv: true });
        disc(On, 0, 0, y0 + 0.2, 0.31, 10, { tex: T.paste });
        // the pestle grinding round
        const a = t * 1.7, b = [Math.cos(a) * 0.13, y0 + 0.25, Math.sin(a) * 0.13], q = [Math.cos(a) * 0.36, y0 + 0.92, Math.sin(a) * 0.36];
        rod(On, b, q, 0.05, { col: [184, 172, 160] }, 6);
        ball(On, b, 0.07, { col: [184, 172, 160] });
        // the garlic, the pine nuts, the oil
        [[0, 0, 0.07], [0.06, -0.01, 0.05], [-0.05, -0.01, 0.05], [0.01, 0.02, 0.05]].forEach(([dx, dz, r]) => egg(On, [0.66 + dx, top + r * 0.9, 0.3 + dz], [r, r * 1.1, r], 0, { col: [232, 222, 202] }));
        for (let i = 0; i < 6; i++) egg(On, [0.6 + (i % 3) * 0.06, top + 0.02, -0.34 + (i >> 1 & 1) * 0.06 + (i > 3 ? 0.06 : 0)], [0.028, 0.018, 0.016], i, { col: [228, 204, 150] });
        prism(On, -0.66, -0.26, top, top + 0.26, 0.09, 0.08, 6, { col: [196, 150, 40], emis: true, add: 0.6 });
        prism(On, -0.66, -0.26, top + 0.26, top + 0.38, 0.03, 0.028, 5, { col: [196, 150, 40], emis: true, add: 0.5 });
        prism(On, -0.66, -0.26, top + 0.37, top + 0.42, 0.035, 0.035, 5, { col: [110, 70, 40] }, [90, 56, 32]);
        // the leaves falling in: a steady few, and a handful now and then
        FALL.forEach((f, i) => { const k = (f.a + t * 0.22) % 1; falling(On, f.x, f.z, smooth(k), t * f.s * 2 + i); });
        hands = hands.filter(h => t - h < 1.6 && t >= h);
        hands.forEach(h => { for (let i = 0; i < 6; i++) { const k = smooth(Math.min(1, (t - h) / 1.2 - i * 0.04)); if (k > 0) falling(On, Math.cos(i * 1.1) * 0.35, Math.sin(i * 1.1) * 0.3, k, t * 2 + i); } });
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
    // the console's resolution and its colours: sixteen levels a channel, dithered (in the colours and textures, never
    // read back from the picture)
    raster: () => ({ px: 3, maxW: 400, dither: 16, fogNear: 3.5, fogFar: 15, amb: [0.13, 0.1, 0.17] }),
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
            // a texture goes onto a triangle by an affine map, as on the console: where the floor runs from under the
            // camera into the distance, one big cell bent the lines of the circle into long streaks falling towards
            // the lens. A cell is cut in four, again and again, while the map would stray by more than a few pixels:
            // its size on the screen times its spread in depth (a cell off the screen is left whole, to be culled; one
            // that runs under the camera is cut only into a few, to find the part of it in front)
            const cell = (x0, x1, z0, z1, u0, u1, v0, v1, k) => {
              const vs = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([x, z]) => R.view([x, 0, z]));
              let split = k < 3;
              if (vs.every(v => v[2] > R.near)) {
                const zs = vs.map(v => v[2]), lo = Math.min(...zs), hi = Math.max(...zs);
                const ps = vs.map(v => R.proj(v)), X = ps.map(q => q[0]), Y = ps.map(q => q[1]);
                const seen = Math.max(...X) > 0 && Math.min(...X) < R.W && Math.max(...Y) > 0 && Math.min(...Y) < R.H;
                split = k < 5 && seen && Math.hypot(Math.max(...X) - Math.min(...X), Math.max(...Y) - Math.min(...Y)) * (hi - lo) / (hi + lo) > 8;
              }
              if (split) {
                const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
                cell(x0, xm, z0, zm, u0, um, v0, vm, k + 1); cell(xm, x1, z0, zm, um, u1, v0, vm, k + 1);
                cell(x0, xm, zm, z1, u0, um, vm, v1, k + 1); cell(xm, x1, zm, z1, um, u1, vm, v1, k + 1);
                return;
              }
              quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: FLOOR, layer: 0, ds: true }, u0, u1, v0, v1);
              if (inked(u0, u1, v0, v1)) quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: GLOW, layer: 0, add: glowA, ds: true }, u0, u1, v0, v1);
            };
            const inked = (u0, u1, v0, v1) => {
              for (let y = Math.floor(v0 * 16); y < Math.ceil(v1 * 16); y++) for (let x = Math.floor(u0 * 16); x < Math.ceil(u1 * 16); x++) if (GLOW.psxInk[y * 16 + x]) return true;
              return false;
            };
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
              const x0 = -FL + i * FL * 2 / N, z0 = -FL + j * FL * 2 / N;
              cell(x0, x0 + FL * 2 / N, z0, z0 + FL * 2 / N, i / N, (i + 1) / N, j / N, (j + 1) / N, 0);
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
    }
  });

  // the stone altar with its sigil: gives the height of its top
  function altarStone(R, T) {
    box(R, [0, 0.48, 0], [0.8, 0.48, 0.5], { tex: T.stone, texFront: T.altar, skip: 'top' });
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
  // куст растёт вширь, а не вверх. Потом мох забирает срезанное, и всё снова
  scene('druid', 'formirovka', S => {
    const { R, T } = S, CYCLE = 12, SW = 4.6, s = 1.15;
    let cut = [0, 1.6, 0], sick = [1, 2, 0], tip = null, phase = 0, top = 0.5;
    const at = t => ((t % CYCLE) + CYCLE) % CYCLE;
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
  // белые корни висят в прозрачной воде. Со дна поднимаются пузырьки, по воде расходятся круги, а время от времени —
  // россыпь кругов и пузырьков
  scene('druid', 'gidro', S => {
    const { R, T } = S, POOL = 1.15, SP = -2.5;
    // the spring: where the water falls in, the two stones on either side of it
    const IN = [Math.cos(SP) * POOL * 0.92, Math.sin(SP) * POOL * 0.92], TOP = [Math.cos(SP) * 1.42, 0.5, Math.sin(SP) * 1.42];
    const ROOTS = [...Array(9)].map((_, i) => ({ q: i * 2.4, r: 0.1 + (i % 3) * 0.09, d: 0.22 + (i % 4) * 0.06 }));
    let taps = [], y = 0.06;
    return {
      rad: 4.8, near: 4.5, look: [0, 0.7, 0], still: 3, clear: 1.8,
      noGrass: (x, z) => Math.hypot(x - TOP[0], z - TOP[2]) < 0.6,
      every: 7, beat(t) { taps.push(t); if (taps.length > 3) taps.shift(); },
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
        // the rings on the water: two always going out from the driftwood, two more now and then, small ones where the
        // spring falls in
        const rings = [(t * 0.3) % 1, (t * 0.3 + 0.5) % 1].concat(...taps.map(h => [(t - h) / 2.4, (t - h) / 2.4 - 0.2]));
        rings.forEach(k => { if (k <= 0 || k >= 1) return; const r = 0.5 + k * (POOL - 0.55); ringTop(R, 0, 0, 0.014, r, r + 0.025, 22, { col: [170, 230, 240], emis: true, add: 0.55 * (1 - k), layer: 0.65 }); });
        [(t * 0.9) % 1, (t * 0.9 + 0.5) % 1].forEach(k => { const r = 0.05 + k * 0.3; ringTop(R, IN[0], IN[1], 0.014, r, r + 0.02, 12, { col: [190, 236, 246], emis: true, add: 0.5 * (1 - k), layer: 0.65 }); });
        // the driftwood rocking on the water, a pad of moss on it, the bush, its roots hanging down into the clear water —
        // drawn together, part over part: the roots under the wood, the wood, the branch out of it (from its face, not
        // through it) and the moss on it, the bush; by depth alone the wood cut into the branch and the foot of the bush
        y = 0.06 + Math.sin(t * 1.1) * 0.022;
        const roll = Math.sin(t * 0.8) * 0.03, a = [-0.62, y - roll, -0.14], b = [0.62, y + roll, 0.14], part = together(R, [0, y, 0]);
        ROOTS.forEach((r, i) => {
          const w = Math.sin(t * 0.9 + i) * 0.03, m = [Math.cos(r.q) * r.r * 0.5 + w, -r.d * 0.45, Math.sin(r.q) * r.r * 0.5];
          rod(part(0), [Math.cos(r.q) * 0.06, y - 0.06, Math.sin(r.q) * 0.06], m, 0.012, { col: [196, 214, 204] }, 3);
          rod(part(0), m, [Math.cos(r.q) * r.r + w * 2, -r.d, Math.sin(r.q) * r.r], 0.008, { col: [176, 204, 200] }, 3);
        });
        rod(part(1), a, b, 0.1, { col: [104, 80, 58] }, 6);
        rod(part(2), [0.32, y + 0.08, 0.06], [0.52, y + 0.2, -0.12], 0.035, { col: [96, 74, 52] }, 4);
        egg(part(2), [0, y + 0.08, 0], [0.18, 0.05, 0.12], 0.2, { col: [64, 104, 46] });
        bush(part(3), T, [0, y + 0.1, 0], t, { s: 1 });
      },
      fx(t, F) {
        // the bubbles rising from the bottom round the roots, many more now and then; the shine of the moon on the water
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
  // нынешняя больше и ярче всех, и куст стоит в её свете: в полнолуние светлее, в новолуние темнее. Фазы идут
  // сами
  scene('druid', 'moy', S => {
    const { R, T } = S, N = 8, STEP = 4, FR = 1.15, A = 0.9, BACK = A + Math.PI;
    // the wattle: stakes on an arc behind the pot (on the far side from the camera), withies woven in and out of them
    const STAKES = [...Array(11)].map((_, i) => BACK - 1.05 + i / 10 * 2.1);
    const at = (q, r, y) => [Math.cos(q) * r, y, Math.sin(q) * r];
    const MOONS = [...Array(N)].map((_, i) => { const q = BACK - 0.95 + i / (N - 1) * 1.9, c = (i - (N - 1) / 2) / ((N - 1) / 2); return at(q, FR + 0.05, 1.42 + 0.22 * (1 - c * c)); });
    const glide = glider(1.4);
    let pos = 0, frac = 0;
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      orbit: [A, 0.35], near: 4.1, rad: 4.5, look: [0, 0.95, 0], still: 13, clear: 1.6,
      // the moon in the sky is the one of the moment of the calendar (its phases go from the new moon round)
      moonPhase: () => ((pos % N) + N) % N / N,
      tick(t) {
        const target = Math.floor(t / STEP);
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
  // каждый на шаг позади другого
  scene('druid', 'posadka', S => {
    const { R, T } = S, CYCLE = 10;
    let seed = null, burst = -1;
    // the camera stands on one side; the old stump behind the hole, its roots going round it into the moss
    const A = 0.5, D = [Math.cos(A), 0, Math.sin(A)], ST = mul(D, -0.85);
    const KIDS = [...Array(5)].map((_, i) => { const q = A - 1.5 + i / 4 * 3; return [Math.cos(q) * 1.2, Math.sin(q) * 1.2]; });
    const ROOTS = [-1.1, -0.45, 0.5, 1.15].map(d => { const q = A + Math.PI + d; return [0, 1, 2, 3].map(k => { const r = 0.42 + k * 0.32, b = d * k * 0.12; return [ST[0] + Math.cos(q - b) * r, 0.07 - k * 0.03, ST[2] + Math.sin(q - b) * r]; }); });
    return {
      orbit: [A, 0.4], rad: 4.4, near: 3.9, look: [0, 0.5, 0], still: 6.2, clear: 1.9,
      lights() { return [{ p: [0.3, 1.2, 0.6], col: [1, 0.86, 0.6], i: 0.7, fall: 0.6 }].concat(seed ? [{ p: seed, col: [1, 0.86, 0.5], i: 1, fall: 2 }] : []); },
      draw(t) {
        // the hole: a ring of dark earth in the moss
        disc(R, 0, 0, 0.012, 0.36, 10, { col: [40, 28, 19], layer: 0.5 });
        ringTop(R, 0, 0, 0.03, 0.36, 0.48, 10, { col: [52, 38, 26] });
        stump(R, T, ST[0], ST[2], 0.42, 0.62);
        ROOTS.forEach(P => P.slice(1).forEach((p, k) => rod(R, P[k], p, 0.06 - k * 0.015, { col: [76 - k * 3, 56 - k * 2, 38] }, 5)));
        const u = t % CYCLE;
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
        const u = t % CYCLE;
        if (u > 1.8 && u < 2.6) for (let i = 0; i < 10; i++) { const q = i * 0.63, l = (u - 1.8) / 0.8; F.dot([Math.cos(q) * l * 0.3, 0.04 + Math.sin(l * Math.PI) * 0.15, Math.sin(q) * l * 0.3], 'rgba(150,110,70,.9)'); }
        if (burst >= 0) for (let i = 0; i < 24; i++) { const q = i * 0.9, l = burst; F.dot([Math.cos(q) * (0.1 + l * 0.5), 0.1 + (i % 6) * 0.09 + l * 0.8, Math.sin(q) * (0.1 + l * 0.5)], `rgba(170,255,200,${1 - l})`, 1.5); }
      }
    };
  });
  // Беды и защита: к кусту ползут слизни и жуки, но круг из ягод рябины их не пускает: у круга они останавливаются,
  // ягоды вспыхивают, и вредители поворачивают назад. На сухой ветке сидит ворон и вертит головой. Время от времени
  // ворон взлетает и делает круг над поляной, а вредители разбегаются
  scene('druid', 'problemy', S => {
    const { R, T } = S, WARD = 0.82, Z = 1.4;
    const PERCH = [1.02, 1.62, -0.66], BUGS = [...Array(6)].map((_, i) => ({ q: i / 6 * Math.PI * 2 + 0.3, slug: i % 2 === 0, ph: i * 1.9 }));
    let scare = -99, shine = [];
    // the fright: up at once, held, going off slowly
    const fear = t => { const u = t - scare; return u < 0 ? 0 : u < 0.8 ? smooth(u / 0.8) : Math.max(0, 1 - (u - 0.8) / 3.5); };
    // how far a bug is from the middle: it comes up to the ring, stops, goes back, comes again
    const reach = (b, t) => WARD + 0.14 + smooth(0.5 + 0.5 * Math.cos(t * 0.42 + b.ph)) * 0.75 + fear(t) * 0.8;
    // where the raven is: on its branch, or on a round over the glade now and then
    const raven = t => {
      const u = t - scare;
      if (u < 0 || u > 6.5) return { p: PERCH, fly: 0, dir: [-1, 0, 0.2] };
      const w = smooth(u / 0.9) * (1 - smooth((u - 5.4) / 1.1)), th = Math.atan2(PERCH[2], PERCH[0]) + u * 1.1;
      const P = v => mix3(PERCH, [Math.cos(th + v) * 2.1, 2.5 + Math.sin(u * 2) * 0.2, Math.sin(th + v) * 2.1], w);
      return { p: P(0), fly: w, dir: norm(sub(P(0.05), P(0))) };
    };
    return {
      rad: 4.6, near: 4.3, look: [0, 0.8, 0], still: 5, clear: 1.7,
      every: 14, beat(t) { scare = t; },
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
  // выходит вперёд следующий
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
    let pos = 0, chosen = [0, 0, 0];
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      // the camera looks at the place in front where the chosen sort stands, the oak behind it
      orbit: [A, 0.4], rad: 4.6, near: 4.3, look: [Math.cos(A) * 0.6, 0.95, Math.sin(A) * 0.6], still: 1, clear: 2.1,
      tick(t) {
        const target = Math.floor(t / STEP);
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
  // следующая. У подножия растёт куст
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
  // потом свет поднимается по стеблю
  scene('druid', 'udobreniya', S => {
    const { R, T } = S, EVERY = 3.8, FLOW = 1.5, CLIMB = 1.1, ROOT = [76, 56, 38];
    const COL = [[130, 196, 255], [255, 128, 82], [255, 210, 92]];
    const CA = [0, 1, 2].map(i => { const q = Math.PI / 2 + i / 3 * Math.PI * 2; return [Math.cos(q) * 1.4, Math.sin(q) * 1.4]; });
    // the root from the foot of a cauldron to the bush, just over the moss and bending a little: u 0…1 along it
    const root = (i, u) => {
      const [x, z] = CA[i], s = Math.sin(u * Math.PI) * 0.22 / 1.4, f = (1 - u) * 0.86;
      return [x * f - z * s, 0.025, z * f + x * s];
    };
    let flow = null, climb = null, top = 0.3;
    return {
      rad: 5, near: 4.6, look: [0, 0.9, 0], still: 2.2, clear: 2,
      rune: t => 0.5 + 0.15 * Math.sin(t * 1.1) + (climb ? 0.6 * Math.sin(climb.f * Math.PI) : 0),
      tick(t) {
        // the sends: one every few seconds, in turn
        const n = Math.floor(t / EVERY);
        const sends = [{ t: n * EVERY, k: n % 3 }, { t: (n - 1) * EVERY, k: (n + 2) % 3 }];
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
  // Раз в день приходит туча и поливает куст, на листьях блестит роса
  scene('druid', 'uhod', S => {
    const { R, T } = S, DAY = 24, RAIN = 5;
    let orb = [0, 3, 0], day = 1, rise = 1, cloud = null, wet = 0, lean = [0, 0];
    return {
      rad: 4.9, near: 4.6, look: [0, 1.2, 0], still: 4, shafts: false,
      // its own sun and moon cross the sky: no moon of the world beside them
      moon: false,
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
        const rainAt = Math.floor((t - 5) / DAY) * DAY + 5, r = t - rainAt;
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
  // аромат — молекула эвгенола, ягоды омелы и рябины на веточках — и тает. Время от времени в котёл падает горсть листьев
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
      every: 6, beat(t) { hands.push(t); if (hands.length > 3) hands.shift(); },
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
        // the leaves falling in: a steady few, and a handful now and then
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
      // bark: ridges up and down between wandering dark grooves, soft blotches over them — drawn large enough to stay
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

  // the floor of the circle — the moss and the glowing lines on it — laid straight on the canvas, a few rows of the
  // screen at a time. The camera never leans, so along a row of the screen the ground lies at one depth: each strip
  // takes its texture by a single affine map — true in perspective, crisp, never bent at the seams of triangles. The
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
  // on a 2D canvas. On a stage the glow is a small canvas of its own at a sixth of the picture (glowLayer): what shines
  // is drawn into it as the picture is drawn (Raster.glowTo — the moon, the runes, the fire, the lines of the circle),
  // and it is drawn up and added to the picture at the end of the frame, with the dark edges (sceneOn, finish) — the
  // picture is never read back for it. The molecule viewer, a picture now and then, still takes its glow from the
  // picture itself (a picture at a sixth, its dark pressed down by multiplying it with itself, laid back over it)
  const BLOOM = new WeakMap();
  function glowLayer(c1, R) {
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
      // the far side and the flanks, the grass to the inside of the circle — nothing big and dark in front of the lens
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
    glow: glowLayer
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
  /* sparks drifting up. A small canvas drawn up smooth: dithered and     */
  /* drawn up square, its fog lay over the page as a coarse grid of dots  */
  /* ------------------------------------------------------------------ */
  // the crypt on a canvas: what it draws at the time now — on the page, or in the worker of the scenes (04-stage.js)
  function cryptOn(cv) {
    const R = new Raster(cv, { smooth: true }), x = R.x;
    const motes = [...Array(70)].map((_, i) => ({ x: (i * 0.618) % 1, y: (i * 0.37) % 1, s: 0.2 + (i % 7) / 10, ember: i % 9 === 0 }));
    const blobs = [[0.2, 0.3, '40,20,58'], [0.8, 0.2, '62,14,26'], [0.6, 0.8, '34,18,48'], [0.1, 0.9, '58,16,28']];
    const t0 = performance.now();
    // the size of the crypt's pixels: a third of the screen's, at most 520 across (sizeTo, not size: smooth, size
    // would draw it at the screen's resolution)
    const fit = () => { const cw = cv.clientWidth || 300, ch = cv.clientHeight || 200, s = Math.max(3, cw / 520); R.sizeTo(Math.round(cw / s), Math.round(ch / s)); };
    // the motes rise in their own time and stand still while the page scrolls: a background that rides the scroll
    // pulls at the eye (so the owner found the old forest of the druid)
    function frame(now) {
      const still = reduce.matches, t = (now - t0) / 1000;
      fit();
      const W = R.W, H = R.H;
      x.fillStyle = '#0B0910';
      x.fillRect(0, 0, W, H);
      blobs.forEach(([bx, by, c], i) => {
        const cx = (bx + (still ? 0 : Math.sin(t * 0.05 + i) * 0.08)) * W, cy = (by + (still ? 0 : Math.cos(t * 0.04 + i * 2) * 0.06)) * H, r = Math.max(W, H) * 0.55;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${c},.9)`); g.addColorStop(1, `rgba(${c},0)`);
        x.fillStyle = g; x.fillRect(0, 0, W, H);
      });
      motes.forEach(m => {
        const y = (((m.y - (still ? 0 : t * 0.006 * m.s)) % 1) + 1) % 1, xx = (m.x + (still ? 0 : Math.sin(t * 0.2 + m.y * 9) * 0.01)) * W;
        x.fillStyle = m.ember ? 'rgba(238,138,50,.8)' : 'rgba(181,168,141,.35)';
        x.fillRect(xx, y * H, 1, 1);
      });
    }
    return { frame, R };
  }
  function crypt() {
    const cv = doc.createElement('canvas');
    cv.id = 'psx-crypt';
    cv.setAttribute('aria-hidden', 'true');
    const page = $('.page');
    (page ? page.parentNode : doc.body).insertBefore(cv, page);
    // drawn by the worker of the scenes where it can be, 7.5 frames a second on every fourth beat of the scene (none
    // asleep or in another tab): its fog drifts and its ash rises by less than a point a frame even so, and every frame of
    // a layer as large as the screen is the whole screen put together again by the browser;
    // here otherwise, or if the worker fails after all
    const onPage = c => {
      const { frame } = cryptOn(c);
      const L = psxLoop(ts => { if (doc.hidden) { L.stop(); return; } frame(ts); if (reduce.matches) L.stop(); }, 7.5);
      L.start();
      const vis = () => { if (!doc.hidden) L.start(); };
      doc.addEventListener('visibilitychange', vis);
      let rz = 0;
      const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { if (reduce.matches) frame(performance.now()); }, 120); };
      addEventListener('resize', onResize);
      return {
        destroy() {
          L.stop();
          removeEventListener('resize', onResize);
          doc.removeEventListener('visibilitychange', vis);
          c.remove();
        }
      };
    };
    return offCanvas(cv, 'crypt', {}, 7.5, onPage) || onPage(cv);
  }
  /* ------------------------------------------------------------------ */
  /* the grove behind the page of «Друид»: the night is a still gradient  */
  /* (28-druid.css). At its edges stand still pictures — an old stump    */
  /* with its roots, moss and bracket fungi, a mossy fallen log with its */
  /* cut face, a gnarled branch reaching in at the top, a tangle of ivy  */
  /* along the top edge, ferns at the foot. Lianas hang from the branch  */
  /* and the ivy and sway slowly, runes carved in the stump and the log  */
  /* smoulder and kindle in turn, little mushrooms glow, fireflies       */
  /* wander. Nothing follows the scroll: the page goes over a calm layer, */
  /* and all of it rests with the rest of the page when it falls asleep  */
  /* ------------------------------------------------------------------ */
  function forest() {
    const el = doc.createElement('div');
    el.id = 'psx-forest';
    el.setAttribute('aria-hidden', 'true');
    el.dataset.bg = '';
    const R = rng(23), f = v => Math.round(v * 10) / 10;
    const css = getComputedStyle(root), tok = (name, or) => css.getPropertyValue(name).trim() || or;
    const C = {
      bark: tok('--forest-bark', '#17241B'), barkD: tok('--forest-bark-d', '#0D1610'), ring: tok('--forest-ring', '#25332A'),
      moss: tok('--forest-moss', '#1E3922'), mossL: tok('--forest-moss-l', '#294C2D'), fungus: tok('--forest-fungus', '#2A281D'),
      fungusL: tok('--forest-fungus-l', '#3A3626'), twig: tok('--forest-twig', '#16271B'), fern: tok('--forest-fern', '#1A2F1F'),
      vine: tok('--forest-vine', '#18301F'), leaf: tok('--forest-leaf', '#213826'), leafL: tok('--forest-leaf-l', '#28452E'),
      rune: tok('--forest-rune', '#8FE8C6'), cap: tok('--forest-cap', '#9EEAD2'), fly: tok('--forest-fly', '#EEFFB0'),
      flyGlow: tok('--forest-fly-glow', 'rgba(196,240,120,.38)')
    };
    // a smooth line through points (quadratic curves through the midpoints)
    const smooth = (pts, closed) => {
      let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
      for (let i = 1; i < pts.length - 1; i++) d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f((pts[i][0] + pts[i + 1][0]) / 2)} ${f((pts[i][1] + pts[i + 1][1]) / 2)}`;
      const l = pts[pts.length - 1];
      return d + `L${f(l[0])} ${f(l[1])}` + (closed ? 'Z' : '');
    };
    // a blob of moss: a lumpy ellipse
    const blob = (cx, cy, rx, ry, col) => {
      const p = [];
      for (let i = 0; i < 9; i++) { const q = i / 9 * Math.PI * 2, k = 0.8 + R() * 0.35; p.push([cx + Math.cos(q) * rx * k, cy + Math.sin(q) * ry * k]); }
      p.push(p[0]);
      return `<path fill="${col}" d="${smooth(p, true)}"/>`;
    };
    // the runes carved here, in unit squares: their strokes, as a carver would cut them
    const RUNE = {
      fehu: [[[0.25, 1], [0.25, 0]], [[0.25, 0.14], [0.8, 0]], [[0.25, 0.44], [0.8, 0.3]]],
      algiz: [[[0.5, 1], [0.5, 0]], [[0.5, 0.42], [0.08, 0]], [[0.5, 0.42], [0.92, 0]]],
      othala: [[[0.5, 0], [0.86, 0.34], [0.5, 0.68], [0.14, 0.34], [0.5, 0]], [[0.32, 0.51], [0.06, 1]], [[0.68, 0.51], [0.94, 1]]],
      raidho: [[[0.22, 1], [0.22, 0]], [[0.22, 0], [0.76, 0.22], [0.22, 0.48]], [[0.22, 0.48], [0.8, 1]]],
      ingwaz: [[[0.5, 0], [0.88, 0.5], [0.5, 1], [0.12, 0.5], [0.5, 0]]]
    };
    const carve = (name, x, y, w, h) => RUNE[name].map(s => s.map(([u, v]) => [x + u * w, y + v * h]));
    const grooves = strokes => strokes.map(s => `<path d="${'M' + s.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}"/>`).join('');

    // a loop of liana hanging between two points of a picture, with leaves along it: still, part of the picture
    const festoon = (a, b, sag) => {
      const mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + sag;
      let leaves = '';
      for (let u = 0.12; u < 0.95; u += 0.11 + R() * 0.06) {
        const x = (1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my + u * u * b[1];
        const sz = 9 + R() * 5, rot = (R() < 0.5 ? -1 : 1) * (20 + R() * 50);
        leaves += `<path fill="${R() < 0.4 ? C.leafL : C.leaf}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sz / 12)})" d="M0 1.4C3.6 -1.4 9.4 1.4 6 6.2Q3.6 9.4 0 12Q-3.6 9.4 -6 6.2C-9.4 1.4 -3.6 -1.4 0 1.4Z"/>`;
      }
      return `<path fill="none" stroke="${C.vine}" stroke-width="2.6" stroke-linecap="round" d="M${f(a[0])} ${f(a[1])}Q${f(mx)} ${f(my * 2 - (a[1] + b[1]) / 2)} ${f(b[0])} ${f(b[1])}"/>` + leaves;
    };

    // an old broken stump: roots spreading on the ground, the bark in deep grooves, moss on its jagged top and the
    // roots, a shelf of bracket fungi on its side, small mushrooms at its foot (they glow) and three runes cut into it
    function stumpPicture() {
      const W = 400, H = 380;
      const top = [[96, 150], [116, 128], [132, 146], [150, 110], [170, 140], [194, 122], [214, 150], [236, 116], [256, 140], [280, 124], [304, 138]];
      const topAt = x => { for (let i = 1; i < top.length; i++) if (x <= top[i][0]) { const a = top[i - 1], b = top[i], u = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } return 140; };
      const body = [[82, 382], [78, 330], [87, 280], [84, 230], [92, 188], ...top, [310, 182], [305, 232], [314, 282], [311, 332], [320, 382]];
      let roots = '';
      [[[96, 352], [40, 368], [-30, 378]], [[150, 368], [110, 380], [60, 390]], [[214, 374], [212, 384], [196, 392]], [[262, 366], [320, 380], [372, 388]], [[306, 350], [360, 360], [430, 372]]].forEach(c => {
        [[22, 1], [14, 0.78], [7, 0.52]].forEach(([w, k]) => {
          const e = [c[0][0] + (c[2][0] - c[0][0]) * k, c[0][1] + (c[2][1] - c[0][1]) * k];
          roots += `<path d="M${c[0][0]} ${c[0][1]}Q${c[1][0]} ${c[1][1]} ${f(e[0])} ${f(e[1])}" stroke-width="${w}"/>`;
        });
      });
      let lines = '';
      for (let i = 0; i < 9; i++) {
        const x0 = 104 + i * 23 + (R() - 0.5) * 8, p = [];
        for (let y = 372; y > topAt(x0) + 18; y -= 16) p.push([x0 + Math.sin(y * 0.045 + i * 1.7) * 4 + (R() - 0.5) * 2, y]);
        if (p.length > 1) lines += `<path d="${smooth(p)}" stroke-width="${f(2.6 + R() * 2)}"/>`;
      }
      let moss = '';
      top.forEach(([x, y], i) => { if (i % 2 === 0) moss += blob(x, y + 6, 14 + R() * 8, 6 + R() * 3, C.moss); });
      [[110, 356, 22, 8], [270, 360, 26, 9], [302, 300, 10, 22], [86, 250, 8, 18]].forEach(([x, y, a, b]) => { moss += blob(x, y, a, b, C.moss); });
      [[150, 140, 8, 3], [240, 136, 9, 3], [116, 354, 9, 3], [276, 356, 10, 3]].forEach(([x, y, a, b]) => { moss += blob(x, y, a, b, C.mossL); });
      let fungi = '';
      [[300, 214, 52, 16], [308, 238, 40, 13], [296, 258, 30, 10]].forEach(([x, y, w, h]) => {
        fungi += `<path fill="${C.fungus}" d="M${x} ${y}q${w * 0.5} ${-h} ${w} ${h * 0.35}q${-w * 0.45} ${h * 0.55} ${-w} ${-h * 0.35}z"/>`
          + `<path fill="none" stroke="${C.fungusL}" stroke-width="2" stroke-linecap="round" d="M${x + 3} ${y - 1}q${w * 0.5} ${-h * 0.9} ${w - 6} ${h * 0.3}"/>`;
      });
      const caps = [[128, 368, 7], [143, 372, 5], [284, 364, 6]];
      let shrooms = '';
      caps.forEach(([x, y, r]) => { shrooms += `<path fill="${C.ring}" d="M${x - 1.4} ${y}h2.8v${r * 1.4}h-2.8z"/><path fill="${C.fungusL}" d="M${x - r} ${y + 1}q${r} ${-r * 1.5} ${r * 2} 0z"/>`; });
      const runes = [carve('fehu', 186, 196, 26, 30), carve('algiz', 186, 240, 26, 30), carve('othala', 186, 284, 26, 32)];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`
        + `<g fill="none" stroke="${C.bark}" stroke-linecap="round">${roots}</g>`
        + `<path fill="${C.bark}" d="${smooth(body, true)}"/>`
        + `<path fill="${C.ring}" d="${smooth(top.map(([x, y]) => [x, y + 3]))}L304 150L96 160Z" opacity=".55"/>`
        + `<g fill="none" stroke="${C.barkD}" stroke-linecap="round">${lines}</g>`
        + `<g fill="none" stroke="${C.barkD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${runes.map(grooves).join('')}</g>`
        + moss + fungi + shrooms + '</svg>';
      return { svg, vb: [W, H], runes, caps };
    }

    // a fallen log, its cut end towards the page: rings and a crack on the face, bark in long grooves, moss along its
    // back with a sapling in it, mushrooms in a row at its foot, and a rune of the home cut across the rings
    function logPicture() {
      const W = 560, H = 240, ex = 120, ey = 140, rx = 56, ry = 70;
      const upper = [[ex, ey - ry], [200, ey - ry - 6], [290, ey - ry + 2], [380, ey - ry - 8], [470, ey - ry - 2], [W + 20, ey - ry - 10]];
      const lower = [[W + 20, ey + ry - 6], [460, ey + ry + 2], [360, ey + ry - 2], [250, ey + ry + 4], [ex, ey + ry]];
      let lines = '';
      for (let i = 0; i < 7; i++) {
        const y0 = ey - ry + 16 + i * 19, p = [];
        for (let x = ex + 40 + R() * 20; x < W + 10; x += 22) p.push([x, y0 + Math.sin(x * 0.03 + i) * 3 + (R() - 0.5) * 2]);
        lines += `<path d="${smooth(p)}" stroke-width="${f(2.4 + R() * 1.6)}"/>`;
      }
      let rings = '';
      for (let i = 1; i <= 5; i++) rings += `<ellipse cx="${ex}" cy="${ey}" rx="${f(rx * i / 6)}" ry="${f(ry * i / 6)}"/>`;
      let moss = '';
      for (let x = 160; x < W; x += 34 + R() * 18) moss += blob(x, ey - ry - 2 + Math.sin(x * 0.05) * 3, 18 + R() * 10, 6 + R() * 3, R() < 0.3 ? C.mossL : C.moss);
      moss += blob(ex + 8, ey - ry + 2, 22, 7, C.moss);
      const sprout = `<g fill="none" stroke="${C.mossL}" stroke-width="2.4" stroke-linecap="round"><path d="M336 ${ey - ry - 4}q-2 -16 4 -30"/></g>`
        + `<path fill="${C.leafL}" d="M340 ${ey - ry - 32}c8 -10 20 -8 24 -4c-8 8 -18 8 -24 4z"/><path fill="${C.leaf}" d="M338 ${ey - ry - 24}c-8 -8 -20 -6 -22 -2c8 6 16 6 22 2z"/>`;
      const caps = [[214, ey + ry - 2, 6], [228, ey + ry + 2, 8], [246, ey + ry + 1, 5], [410, ey + ry - 3, 6]];
      let shrooms = '';
      caps.forEach(([x, y, r]) => { shrooms += `<path fill="${C.ring}" d="M${x - 1.4} ${y - r * 0.2}h2.8v${r * 1.3}h-2.8z"/><path fill="${C.fungusL}" d="M${x - r} ${y}q${r} ${-r * 1.5} ${r * 2} 0z"/>`; });
      const runes = [carve('othala', ex - 18, ey - 26, 36, 52)];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`
        + `<path fill="${C.bark}" d="${smooth(upper)}L${W + 20} ${ey + ry - 6}${smooth(lower).replace(/^M/, 'L')}Z"/>`
        + `<g fill="none" stroke="${C.barkD}" stroke-linecap="round">${lines}</g>`
        + `<ellipse cx="${ex}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${C.ring}" stroke="${C.barkD}" stroke-width="7"/>`
        + `<g fill="none" stroke="${C.bark}" stroke-width="2">${rings}<path d="M${ex} ${ey}l${rx * 0.7} ${-ry * 0.3}" stroke-width="3"/></g>`
        + `<g fill="none" stroke="${C.barkD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${runes.map(grooves).join('')}</g>`
        + moss + sprout + shrooms + '</svg>';
      return { svg, vb: [W, H], runes, caps };
    }

    // a gnarled branch reaching in from the left edge at the top, thick at the root and thin at its tip, moss along its
    // back, knots and two twigs with leaves; lianas hang from its underside (anchors)
    function branchPicture() {
      const W = 600, H = 240, n = 40, up = [], lo = [];
      const at = t => { const x = -20 + t * 590, y = 64 + t * 40 + Math.sin(t * 7) * 10 + t * t * 20; return [x, y]; };
      for (let i = 0; i <= n; i++) {
        const t = i / n, [x, y] = at(t), [x2, y2] = at(Math.min(1, t + 0.01)), a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
        const w = 30 * Math.pow(1 - t, 0.8) + 2.6 + Math.sin(t * 23) * 2.4 * (1 - t) + Math.sin(t * 61) * 1.2 * (1 - t);
        up.push([x - Math.cos(a) * w, y - Math.sin(a) * w]); lo.push([x + Math.cos(a) * w, y + Math.sin(a) * w]);
      }
      let twigs = '';
      [[0.42, -0.9, 70], [0.7, -0.6, 52]].forEach(([t, a, len]) => {
        const [x, y] = at(t), ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
        twigs += `<path d="M${f(x)} ${f(y)}Q${f(x + len * 0.3)} ${f(y - len * 0.5)} ${f(ex)} ${f(ey)}" stroke-width="${t < 0.5 ? 5 : 3.5}"/>`;
        for (let k = 0; k < 3; k++) { const u = 0.5 + k * 0.22, lx = x + (ex - x) * u, ly = y + (ey - y) * u - len * 0.1; twigs += `<path fill="${k % 2 ? C.leafL : C.leaf}" stroke="none" d="M${f(lx)} ${f(ly)}c${k % 2 ? 8 : -8} -6 ${k % 2 ? 18 : -18} -2 ${k % 2 ? 20 : -20} 4c${k % 2 ? -8 : 8} 4 ${k % 2 ? -16 : 16} 2 ${k % 2 ? -20 : 20} -4z"/>`; }
      });
      let moss = '';
      for (let t = 0.04; t < 0.8; t += 0.07 + R() * 0.05) { const i = Math.round(t * n); moss += blob(up[i][0], up[i][1] + 2, 16 * (1 - t) + 6, 5 * (1 - t) + 2.5, R() < 0.3 ? C.mossL : C.moss); }
      let knots = '';
      [0.22, 0.5].forEach(t => { const [x, y] = at(t); knots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(8 * (1 - t) + 3)}" ry="${f(5 * (1 - t) + 2)}" fill="${C.barkD}"/>`; });
      // where lianas hang: on the underside, some long, some short, two of them side by side; [x, y, length as a share
      // of the picture's width]; and two loops of liana between points of it
      const anchors = [[0.1, 0.92], [0.15, 0.36], [0.3, 0.66], [0.47, 0.28], [0.56, 0.74], [0.74, 0.42], [0.86, 0.22]].map(([t, len]) => { const i = Math.round(t * n); return [lo[i][0], lo[i][1] - 2, len]; });
      const loops = festoon(lo[Math.round(0.2 * n)], lo[Math.round(0.4 * n)], 46) + festoon(lo[Math.round(0.62 * n)], lo[Math.round(0.8 * n)], 30);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`
        + `<g fill="none" stroke="${C.twig}" stroke-linecap="round">${twigs}</g>`
        + `<path fill="${C.bark}" d="${smooth(up)}${smooth(lo.slice().reverse()).replace(/^M/, 'L')}Z"/>`
        + `<path fill="none" stroke="${C.barkD}" stroke-width="2" stroke-linecap="round" d="${smooth(up.map(([x, y], i) => [x + 4, y + (lo[i][1] - y) * 0.45]).slice(0, 30))}"/>`
        + knots + moss + loops + '</svg>';
      return { svg, vb: [W, H], anchors };
    }

    // a tangle of ivy along the top edge in the right corner: three stems with their leaves; lianas drop from it
    function ivyPicture() {
      const W = 360, H = 130;
      let stems = '', leaves = '';
      [[8, 0.9], [22, 0.75], [36, 0.55]].forEach(([y0, len], s) => {
        const p = [];
        for (let x = W + 10; x > W * (1 - len); x -= 18) p.push([x, y0 + Math.sin(x * 0.05 + s * 2) * 7 + (W - x) * 0.04]);
        stems += `<path d="${smooth(p)}" stroke-width="${3.2 - s * 0.6}"/>`;
        p.forEach(([x, y], i) => {
          if (i % 2) return;
          const sz = 10 + R() * 6, side = i % 4 ? 1 : -1, a = 90 + side * (30 + R() * 30);
          leaves += `<path fill="${R() < 0.35 ? C.leafL : C.leaf}" transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(sz / 12)})" d="M0 0C3 -6 10 -7 12 -1C11 4 5 7 0 0Z"/>`;
        });
      });
      const anchors = [[48, 30, 0.7], [112, 36, 1.5], [150, 34, 0.5], [214, 30, 1.05], [262, 26, 0.38], [318, 20, 1.25]];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><g fill="none" stroke="${C.vine}" stroke-linecap="round">${stems}</g>${leaves}${festoon([70, 30], [190, 34], 54)}</svg>`;
      return { svg, vb: [W, H], anchors };
    }

    // ferns rising at the foot: each frond goes up from a bare stalk, arches out and droops at the tip under its weight;
    // its leaflets are longest in the middle and lean to the tip
    function fernPicture() {
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
      return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-86 20 276 180"><g fill="none" stroke="${C.fern}" stroke-linecap="round">${stems}<path d="${pinnae}" stroke-width="2.2"/></g></svg>`, vb: [276, 180] };
    }

    // each picture goes to the page as an <img>: the browser keeps it drawn once, and the frames of the canvases above
    // never make it draw those paths again. Its box holds its shape before the picture is decoded (aspect-ratio), so the
    // runes and lianas find their places at once; where it stands is its class (28-druid.css)
    const PIC = { fern: fernPicture(), stump: stumpPicture(), log: logPicture(), branch: branchPicture(), ivy: ivyPicture() };
    const boxes = {};
    Object.entries(PIC).forEach(([name, p]) => {
      const box = doc.createElement('div');
      box.className = `tw tw-${name}`;
      box.style.aspectRatio = `${p.vb[0]} / ${p.vb[1]}`;
      box.innerHTML = `<img alt="" decoding="async" src="data:image/svg+xml,${encodeURIComponent(p.svg)}">`;
      el.appendChild(box);
      boxes[name] = box;
    });

    // the canvases: one as large as the screen for the fireflies, a point of it to a point of the page (in half of them,
    // drawn up by the browser at every frame of theirs, it cost the browser twice as much where it puts the screen
    // together without the graphics card), and small ones only where something moves — the lianas of the branch and of
    // the ivy, the glow of the stump and of the log — at up to one and a half points a point, so a leaf stays a leaf.
    // Each is a layer of its own
    const fly = doc.createElement('canvas');
    fly.className = 'fly';
    el.appendChild(fly);
    const pane = cls => { const c = doc.createElement('canvas'); c.className = 'grove-pane ' + cls; el.appendChild(c); return c; };
    const panes = { branch: pane('gp-branch'), ivy: pane('gp-ivy'), stump: pane('gp-stump'), log: pane('gp-log') };

    // the fireflies: each wanders on a path of its own — across and up and down at two paces, never quite stopping —
    // and glows up now and then; fewer on a narrow screen. In «less motion» a few simply stand lit
    const nFly = innerWidth < 600 ? 14 : 26, flies = [];
    for (let i = 0; i < nFly; i++) {
      const tx = 9 + R() * 10, ty = 7 + R() * 8, b = 4 + R() * 5;
      flies.push({ x: 0.04 + R() * 0.92, y: 0.22 + R() * 0.74, dx: 24 + R() * 46, dy: 14 + R() * 30, tx, ty, b, px: R() * 6.3, py: R() * 6.3, pb: R(), still: i % 3 ? 0 : 0.8, was: null });
    }
    // where everything moving stands, read from the page: the fireflies' canvas, each pane over its picture (its place on
    // the page, its size in canvas points), each liana from its anchor, each glow on its rune or mushroom
    const rect = box => { const r = box.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; };
    function layout() {
      const kv = Math.min(1.5, window.devicePixelRatio || 1), narrow = innerWidth < 600;
      const lay = { W: el.clientWidth, H: el.clientHeight, panes: {}, vines: [], glows: [], flies };
      const place = (name, b) => {
        lay.panes[name] = { ...b, kv };
        Object.assign(panes[name].style, { left: b.l + 'px', top: b.t + 'px', width: b.w + 'px', height: b.h + 'px' });
      };
      // the lianas: from the anchors of the branch and of the ivy, as long as the picture is drawn wide (shorter on a
      // narrow screen, and only every other one)
      [['branch', 1], ['ivy', 2]].forEach(([name, seed]) => {
        const b = rect(boxes[name]), s = b.w / PIC[name].vb[0];
        const list = PIC[name].anchors.filter(([ax]) => !narrow || (name === 'ivy' ? ax * s > b.w - 90 : ax * s < 90));
        const made = list.map(([ax, ay, len], i) => ({ ax: b.l + ax * s, ay: b.t + ay * s, len: len * b.w * (narrow ? 0.32 : 0.6), seed: seed * 100 + i }));
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        made.forEach(v => { const reach = 24 + v.len * 0.1; x0 = Math.min(x0, v.ax - reach); x1 = Math.max(x1, v.ax + reach); y0 = Math.min(y0, v.ay - 6); y1 = Math.max(y1, v.ay + v.len + 30); });
        const box = { l: Math.floor(x0), t: Math.floor(y0), w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0) };
        place(name, box);
        made.forEach(v => lay.vines.push({ pane: name, x: v.ax - box.l, y: v.ay - box.t, len: v.len, seed: v.seed }));
      });
      // the runes and the mushrooms of the stump and the log: their glows, where the pictures put them
      ['stump', 'log'].forEach(name => {
        const b = rect(boxes[name]), s = b.w / PIC[name].vb[0];
        place(name, { l: Math.floor(b.l), t: Math.floor(b.t), w: Math.ceil(b.w), h: Math.ceil(b.h) });
        PIC[name].runes.forEach((st, i) => lay.glows.push({ pane: name, rune: st, s, P: 9 + i * 1.7, ph: i * 1.9 + (name === 'log' ? 3 : 0) }));
        PIC[name].caps.forEach(([cx, cy, r], i) => lay.glows.push({ pane: name, cap: [cx * s, cy * s, Math.max(10, r * s * 2.6)], P: 7 + i * 1.3, ph: i * 2.3 }));
      });
      return lay;
    }

    const page = $('.page');
    (page ? page.parentNode : doc.body).insertBefore(el, page);
    let rz = 0, seen = '';
    // drawn by the worker of the scenes where it can be (the page sends where things stand, again after a resize), 15
    // frames a second on every second beat of the scene in the head (so that both change on the screen together);
    // else here, as before
    let G = null, L = null;
    const local = (cvs, lay) => {
      G = groveOn(cvs, C, lay);
      L = psxLoop(now => { G.frame(now); }, 15, 15);
      const motion = () => { if (reduce.matches) { L.stop(); G.frame(0); } else L.start(); };
      reduce.addEventListener('change', motion);
      motion();
      return { destroy() { L.stop(); reduce.removeEventListener('change', motion); }, lay: l => { G.lay(l); if (reduce.matches) G.frame(0); } };
    };
    const lay0 = layout();
    const off = offCanvas(fly, 'grove', { C, lay: lay0 }, 15, (fresh, fp) => { Object.assign(panes, fp); return local({ fly: fresh, ...panes }, layout()); }, panes);
    const run = off || local({ fly, ...panes }, lay0);
    // a phone's bars coming and going leave the layer as it was (it is as tall as the screen without them): nothing to do
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { const key = `${el.clientWidth}x${el.clientHeight}`; if (key === seen) return; seen = key; const lay = layout(); if (off) off.post({ type: 'lay', lay }); else run.lay(lay); }, 150); };
    seen = `${el.clientWidth}x${el.clientHeight}`;
    addEventListener('resize', onResize);
    return {
      destroy() {
        run.destroy();
        clearTimeout(rz);
        removeEventListener('resize', onResize);
        el.remove();
      }
    };
  }

  // what moves in the grove, on its canvases (cvs: fly, branch, ivy, stump, log): the fireflies, the lianas, the glows of
  // the runes and the mushrooms — on the page, or in the worker of the scenes (04-stage.js). C — the colours of the
  // grove, lay — where everything stands (forest(), read from the page)
  function groveOn(cvs, C, lay) {
    const fx = cvs.fly.getContext('2d');
    const panes = {};
    ['branch', 'ivy', 'stump', 'log'].forEach(n => { panes[n] = { c: cvs[n], x: cvs[n].getContext('2d'), box: null }; });
    // a liana: a thin stem with ivy-like leaves on short stalks, in turns to either side, and now and then a tendril;
    // drawn once into three pieces, each hanging from the end of the one above, so it can bend as it sways
    function liana(len, seed, kv) {
      const r = rng(seed), segs = [], n = 3, pad = 22, spread = 22;
      for (let j = 0; j < n; j++) {
        const L = len / n, w = spread * 2 + 8, h = L + pad * 2;
        const c = doc.createElement('canvas');
        c.width = Math.ceil(w * kv); c.height = Math.ceil(h * kv);
        const x = c.getContext('2d');
        x.scale(kv, kv);
        const cx = w / 2, bow = (r() - 0.5) * 6;
        x.strokeStyle = C.vine; x.lineCap = 'round';
        x.lineWidth = 3 - j * 0.6;
        x.beginPath(); x.moveTo(cx, pad); x.quadraticCurveTo(cx + bow, pad + L / 2, cx, pad + L); x.stroke();
        for (let y = pad + 6 + r() * 8, s = r() < 0.5 ? -1 : 1; y < pad + L - 2; y += 15 + r() * 9, s = -s) {
          const u = (y - pad) / L, sx = cx + bow * 2 * u * (1 - u) * 2, sz = (13 + r() * 6) * (1 - j * 0.14), a = s * (0.75 + r() * 0.55);
          x.save(); x.translate(sx, y); x.rotate(a);
          x.strokeStyle = C.vine; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 4); x.stroke();
          x.translate(0, 3);
          x.fillStyle = r() < 0.4 ? C.leafL : C.leaf;
          x.beginPath(); x.moveTo(0, sz * 0.12);
          x.bezierCurveTo(sz * 0.3, -sz * 0.12, sz * 0.78, sz * 0.12, sz * 0.5, sz * 0.52);
          x.quadraticCurveTo(sz * 0.3, sz * 0.78, 0, sz);
          x.quadraticCurveTo(-sz * 0.3, sz * 0.78, -sz * 0.5, sz * 0.52);
          x.bezierCurveTo(-sz * 0.78, sz * 0.12, -sz * 0.3, -sz * 0.12, 0, sz * 0.12); x.fill();
          x.strokeStyle = C.vine; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, sz * 0.14); x.lineTo(0, sz * 0.8); x.stroke();
          x.restore();
          if (r() < 0.18) { x.strokeStyle = C.vine; x.lineWidth = 0.9; x.beginPath(); x.arc(sx - s * 5, y + 2, 3.2, 0, Math.PI * 1.6); x.stroke(); }
        }
        segs.push({ c, w, h, ox: cx, oy: pad, L });
      }
      return { segs, P: 9 + r() * 6, ph: r() * 6.3, A: 0.01 + r() * 0.008, len };
    }
    // a glow to lay over a carved rune: its strokes in light, softened, drawn once
    function glowOf(strokes, s, kv) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      strokes.flat().forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
      const pad = 10, w = (x1 - x0) * s + pad * 2, h = (y1 - y0) * s + pad * 2;
      const c = doc.createElement('canvas');
      c.width = Math.ceil(w * kv); c.height = Math.ceil(h * kv);
      const x = c.getContext('2d');
      x.scale(kv, kv); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = C.rune;
      const path = () => { x.beginPath(); strokes.forEach(st => st.forEach(([px, py], i) => (i ? x.lineTo : x.moveTo).call(x, (px - x0) * s + pad, (py - y0) * s + pad))); };
      [[7, 0.12], [4.5, 0.22], [2.4, 0.7], [1.3, 1]].forEach(([lw, a]) => { x.globalAlpha = a; x.lineWidth = lw * Math.max(0.6, s); path(); x.stroke(); });
      return { c, w, h, x: x0, y: y0, pad };
    }
    const capGlow = (() => {
      const r = 14, c = doc.createElement('canvas'), x = c.getContext('2d');
      c.width = c.height = r * 4;
      const g = x.createRadialGradient(r * 2, r * 2, 0, r * 2, r * 2, r * 2);
      g.addColorStop(0, C.cap); g.addColorStop(0.25, C.cap); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = 0.55; x.fillStyle = g; x.fillRect(0, 0, r * 4, r * 4);
      return c;
    })();

    const RAD = 11, k = 1;
    let W = 0, H = 0, sprite = null, time = 0, last = null, frameN = 0, vines = [], glows = [], flies = [];
    function setLay(l) {
      flies = l.flies.map(fl => ({ ...fl, was: null }));
      W = cvs.fly.width = l.W; H = cvs.fly.height = l.H;
      const r = Math.ceil(RAD * k);
      sprite = doc.createElement('canvas');
      sprite.width = sprite.height = r * 2;
      const sx = sprite.getContext('2d'), g = sx.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, C.fly); g.addColorStop(0.12, C.fly); g.addColorStop(0.34, C.flyGlow); g.addColorStop(1, 'rgba(196,240,120,0)');
      sx.fillStyle = g; sx.fillRect(0, 0, r * 2, r * 2);
      fx.clearRect(0, 0, W, H);
      Object.entries(l.panes).forEach(([n, b]) => { const p = panes[n]; p.box = b; p.c.width = Math.ceil(b.w * b.kv); p.c.height = Math.ceil(b.h * b.kv); });
      vines = l.vines.map(v => { const p = panes[v.pane]; return { pane: p, ax: v.x, ay: v.y, ...liana(v.len, v.seed, p.box.kv) }; });
      glows = l.glows.map(g0 => { const p = panes[g0.pane]; return g0.rune ? { pane: p, rune: glowOf(g0.rune, g0.s, p.box.kv), s: g0.s, P: g0.P, ph: g0.ph } : { pane: p, cap: g0.cap, P: g0.P, ph: g0.ph }; });
    }
    // how bright a firefly is at the time t: dark most of its round, then a glow that swells and fades
    const flyGlow = (fl, t) => { const p = ((t / fl.b + fl.pb) % 1 + 1) % 1; return p < 0.4 || p > 0.9 ? 0 : Math.pow(Math.sin(Math.PI * (p - 0.4) / 0.5), 1.5); };
    function drawFlies(t, still) {
      const r = Math.ceil(RAD * k);
      flies.forEach(fl => { if (fl.was) fx.clearRect(fl.was[0] - r - 1, fl.was[1] - r - 1, r * 2 + 2, r * 2 + 2); });
      flies.forEach(fl => {
        const a = still ? fl.still : flyGlow(fl, t);
        fl.was = null;
        if (a < 0.02) return;
        const T = Math.PI * 2;
        const px = fl.x * W + (still ? 0 : (Math.sin(T * t / fl.tx + fl.px) + 0.3 * Math.sin(T * t / (fl.tx * 0.43) + fl.py)) * fl.dx * k / 1.3);
        const py = fl.y * H + (still ? 0 : (Math.sin(T * t / fl.ty + fl.py) + 0.3 * Math.sin(T * t / (fl.ty * 0.57) + fl.px)) * fl.dy * k / 1.3);
        fx.globalAlpha = a;
        fx.drawImage(sprite, px - r, py - r);
        fl.was = [px, py];
      });
      fx.globalAlpha = 1;
    }
    // the lianas sway like pendulums hung one from another: each piece a little more and a little later than the one
    // above it, slowly (a round in 9–15 s), and a slower second breath under it — at rest in «less motion»
    function drawVines(t, still) {
      [panes.branch, panes.ivy].forEach(p => { p.x.setTransform(1, 0, 0, 1, 0, 0); p.x.clearRect(0, 0, p.c.width, p.c.height); });
      const T = Math.PI * 2;
      vines.forEach(v => {
        const x = v.pane.x, b = v.pane.box;
        x.setTransform(b.kv, 0, 0, b.kv, v.ax * b.kv, v.ay * b.kv);
        v.segs.forEach((sg, j) => {
          if (!still) x.rotate(v.A * (1 + 0.35 * j) * Math.sin(T * t / v.P + v.ph - j * 0.7) + v.A * 0.3 * Math.sin(T * t / (v.P * 2.3) + v.ph * 1.7));
          x.drawImage(sg.c, -sg.ox, -sg.oy, sg.w, sg.h);
          x.translate(0, sg.L);
        });
      });
    }
    // the runes smoulder and kindle one after another, each on a slow breath of its own; the mushrooms glow softly
    function drawGlows(t, still) {
      [panes.stump, panes.log].forEach(p => { p.x.setTransform(1, 0, 0, 1, 0, 0); p.x.clearRect(0, 0, p.c.width, p.c.height); });
      glows.forEach(g => {
        const x = g.pane.x, kv = g.pane.box.kv, breath = still ? 0.5 : 0.5 + 0.5 * Math.sin(Math.PI * 2 * t / g.P + g.ph);
        x.setTransform(kv, 0, 0, kv, 0, 0);
        if (g.rune) {
          x.globalAlpha = 0.18 + 0.72 * breath * breath;
          x.drawImage(g.rune.c, g.rune.x * g.s - g.rune.pad, g.rune.y * g.s - g.rune.pad, g.rune.w, g.rune.h);
        } else {
          const [cx, cy, r] = g.cap;
          x.globalAlpha = 0.35 + 0.45 * breath;
          x.drawImage(capGlow, cx - r, cy - r, r * 2, r * 2);
        }
      });
      [panes.stump, panes.log].forEach(p => { p.x.globalAlpha = 1; });
    }
    // the clock goes by drawn frames, so after a pause nothing jumps; the fireflies and the lianas move at every frame,
    // the glows at every second — slow enough not to need more. With less motion: all of it at rest
    function frame(now) {
      if (reduce.matches) { drawFlies(0, true); drawVines(0, true); drawGlows(0, true); return; }
      if (last != null) time += clamp((now - last) / 1000, 0, 0.1);
      last = now;
      drawFlies(time, false);
      drawVines(time, false);
      if (frameN % 2 === 0) drawGlows(time, false);
      frameN++;
    }
    setLay(lay);
    return { frame, lay: l => { setLay(l); frameN = 0; } };
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
  /* the words of each skin: the labels of the guide in its own tongue — */
  /* the grimoire's treatise, the grove's saga — and their meaning as     */
  /* plain as before. Only the frame of the guide speaks so (labels,      */
  /* buttons, the heads of its parts), never the text of a chapter. The   */
  /* plain words stay in data-plain: switched off, the guide gets them     */
  /* back, and the place of reading goes by them (22-reading-pos.js)       */
  /* ------------------------------------------------------------------ */
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const ORD = ['', 'первая', 'вторая', 'третья', 'четвёртая', 'пятая', 'шестая', 'седьмая', 'восьмая', 'девятая', 'десятая', 'одиннадцатая', 'двенадцатая'];
  const roman = n => ROMAN[n] || n, ord = n => ORD[n] || n;
  // the plain words (spaces as plain spaces) and the skin's; the numbered ones by pattern
  const WORDS = {
    grimoire: {
      'гид садовода': 'гримуар садовода',
      'Оглавление': 'Оглавление гримуара',
      'Инструменты': 'Приборы алхимика',
      'Растите с удовольствием и ешьте песто ✿': 'Растите с усердием и толките песто, как зелье ✠',
      'от семечка до песто': 'от семени до зелья песто',
      'С чего начать': 'С чего начать посвящение',
      'Все главы': 'Все главы трактата',
      'Продолжить чтение': 'Вернуться к закладке',
      'гида': 'гримуара',
      'Научный слой': 'Тайное знание',
      'Карманный агроном': 'Карманный гримуар',
      'Дальше в главе': 'Перевернуть страницу',
      'Готово →': 'Трактат прочитан →',
      'Для любопытных': 'Тайны для любопытных',
      'Раскрыть все': 'Раскрыть все тайны',
      'Свернуть все': 'Сокрыть все тайны',
      'Подробнее': 'Глубже в трактат',
      'Частые вопросы': 'Частые вопросы учеников',
      'Все частые вопросы': 'Все вопросы учеников',
      'Откуда это известно': 'Из каких книг это знание',
      'Свернуть разворот': 'Закрыть свиток',
      'Интерактив': 'Опыт алхимика',
      'Модель': 'Модель мироздания',
      'Вы остановились здесь': 'Здесь ваша закладка',
      'Вернуться к тексту': 'Вернуться к строке',
      'Открыть в главе': 'Открыть в гримуаре',
      'Связано с этим': 'Связанные страницы трактата',
      'Все развороты главы': 'Все тайны главы',
      'Все развороты': 'Все тайны гримуара'
    },
    druid: {
      'гид садовода': 'советы друида',
      'Оглавление': 'Карта рощи',
      'Инструменты': 'Утварь друида',
      'Растите с удовольствием и ешьте песто ✿': 'Растите в ладу с рощей и ешьте песто ᛉ',
      'от семечка до песто': 'от семечка до песто, по заветам рощи',
      'С чего начать': 'С чего начать путь',
      'Все главы': 'Все главы саги',
      'Продолжить чтение': 'Продолжить путь',
      'гида': 'саги',
      'Научный слой': 'Знание корней',
      'Карманный агроном': 'Карманный друид',
      'Дальше в главе': 'Дальше по тропе',
      'Готово →': 'Тропа пройдена →',
      'Для любопытных': 'Предания для любопытных',
      'Раскрыть все': 'Раскрыть все предания',
      'Свернуть все': 'Свернуть все предания',
      'Подробнее': 'Глубже, к корням',
      'Частые вопросы': 'О чём спрашивают у костра',
      'Все частые вопросы': 'Все вопросы у костра',
      'Откуда это известно': 'Откуда это знание',
      'Свернуть разворот': 'Свернуть предание',
      'Интерактив': 'Попробуйте сами',
      'Модель': 'Модель рощи',
      'Вы остановились здесь': 'Здесь вы сошли с тропы',
      'Вернуться к тексту': 'Вернуться на тропу',
      'Открыть в главе': 'Пойти туда',
      'Связано с этим': 'Тропы отсюда',
      'Все развороты главы': 'Все предания главы',
      'Все развороты': 'Все предания рощи'
    }
  };
  const PATTERNS = {
    grimoire: [
      [/^Глава (\d+)$/, (m, n) => `Глава ${roman(+n)}`],
      [/^← Глава (\d+)$/, (m, n) => `← Глава ${roman(+n)}`],
      [/^Глава (\d+) →$/, (m, n) => `Глава ${roman(+n)} →`],
      [/^Гид по выращиванию/, 'Гримуар выращивания']
    ],
    druid: [
      [/^Глава (\d+)$/, (m, n) => `Глава ${ord(+n)}`],
      [/^← Глава (\d+)$/, (m, n) => `← Глава ${ord(+n)}`],
      [/^Глава (\d+) →$/, (m, n) => `Глава ${ord(+n)} →`],
      [/^Гид по выращиванию/, 'Знание рощи о выращивании']
    ]
  };
  // where the skins put their words: the first words of each of these (written by the build or later by the page)
  const WORD_AT = ['.brand small', '#sheet-toc-h', '.toc-seg button', '.footer .hand', '.hero h1 em', '.hero .lead', '.hero-actions .btn',
    '#continue > span', '#glavy-h em', '#tools-h', '#nauka .eyebrow', '.ch-hero .eyebrow', '.pager small', '.panel-next small',
    '.deep-zone-label > span', '[data-deep-all]', '.deeper-k', '.faq-here h3', '.faq-more a', '.deep-src-h', '.deep-close',
    '.lab-kicker', '.resume-pill small', '.peek-go > span', '.related-h', '.deep-map'].join(', ');
  const PLACEHOLDER = {
    grimoire: 'Что ищем в гримуаре? Например, желтеют листья',
    druid: 'О чём спросить рощу? Например, желтеют листья'
  };

  // a label in the skin's words (the plain one when no skin is on, or it has no word for it)
  function say(text, skin = skinNow()) {
    if (!skin || !WORDS[skin]) return text;
    const t = text.trim(), key = t.replace(/ /g, ' '), w = WORDS[skin][key];
    if (w) return text.replace(t, w);
    for (const [re, to] of PATTERNS[skin]) if (re.test(key)) return text.replace(t, key.replace(re, to));
    return text;
  }
  const wordNode = el => [...el.childNodes].find(n => n.nodeType === 3 && n.data.trim());
  function putWords(el, skin) {
    const n = wordNode(el);
    if (!n) return;
    // already in the skin's words; else what stands there now is the plain one (the page may have written it again)
    if (el.dataset.plain != null && n.data === say(el.dataset.plain, skin)) return;
    const plain = n.data, w = say(plain, skin);
    if (w === plain) { delete el.dataset.plain; return; }
    el.dataset.plain = plain;
    n.data = w;
  }
  // what the page builds or writes again later (a lab's head, the pill of the reading place, «Раскрыть все» once
  // pressed) gets the words as it comes; drawings are passed by at once
  const wordWatch = new MutationObserver(records => {
    const skin = skinNow();
    if (!skin) return;
    for (const r of records) {
      const t = r.target;
      if (t.nodeType !== 1 || t instanceof SVGElement) continue;
      if (t.matches(WORD_AT)) putWords(t, skin);
      r.addedNodes.forEach(n => {
        if (n.nodeType !== 1 || n instanceof SVGElement) return;
        if (n.matches(WORD_AT)) putWords(n, skin);
        n.querySelectorAll(WORD_AT).forEach(e => putWords(e, skin));
      });
    }
  });
  function wordsOn(skin) {
    $$(WORD_AT).forEach(el => putWords(el, skin));
    const q = $('#search-input');
    if (q) { if (q.dataset.plainPh == null) q.dataset.plainPh = q.placeholder; q.placeholder = PLACEHOLDER[skin] || q.dataset.plainPh; }
    wordWatch.observe(doc.body, { childList: true, subtree: true });
  }
  function wordsOff() {
    wordWatch.disconnect();
    $$('[data-plain]').forEach(el => { const n = wordNode(el); if (n) n.data = el.dataset.plain; delete el.dataset.plain; });
    const q = $('#search-input');
    if (q && q.dataset.plainPh != null) { q.placeholder = q.dataset.plainPh; delete q.dataset.plainPh; }
  }
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
    // its words on the labels of the guide (08-words.js) and its own icons (02-icons.js), the sheet's page too
    wordsOn(skin);
    iconsOn(skin);
    // a page shown in the sheet of another (?peek=1) is only its place: no background, no scene, the molecules as here
    if (!root.classList.contains('is-peek')) {
      mounted.push(BACKS[skin]());
      // the scenes: the background of the head of each chapter and of the home page's hero, by themselves, without a finger
      $$('.ch-hero').forEach(h => { const v = h.closest('[data-view]'); mounted.push(stage(h, v && v.dataset.view, skin)); });
      const hero = $('.view-home .hero');
      if (hero) mounted.push(stage(hero, 'glavnaya', skin));
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
    wordsOff();
    iconsOff();
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

  const api = { start, stop, drawMol, say, get on() { return !!skinNow(); }, get skin() { return skinNow(); } };
  // loaded again in the worker of the scenes (04-stage.js): it only draws the stages the page sends it
  if (IN_WORKER) sceneHost();

  return api;
})();
