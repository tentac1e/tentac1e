  /* ------------------------------------------------------------------ */
  /* a small rasterizer of the PS1 kind on a 2D canvas                    */
  /* ------------------------------------------------------------------ */
  /* Low resolution, vertices snapped to whole pixels (the wobble), textures mapped affinely per triangle (the swim),
     no filtering, the painter's order by layer and depth, fog, then a few levels a colour channel with an ordered
     dither between them — the console's look, nothing of it a shader. With smooth (the skin «Друид»): the canvas at
     the screen's own resolution (scale canvas pixels a CSS pixel), vertices where they fall, textures filtered, no
     dither — the same low polygons, lit and fogged, as a game of today draws them */
  class Raster {
    constructor(canvas, o) {
      Object.assign(this, { px: 3, maxW: 380, levels: 16, fog: [28, 17, 34], fogNear: 4, fogFar: 14, near: 0.2, amb: [0.16, 0.13, 0.2], key: null, lights: [], smooth: false, scale: 1, maxPx: 0 }, o);
      this.c = canvas;
      // the console's colour is cut down by reading the pixels back; a smooth picture is never read and stays on the GPU
      this.x = canvas.getContext('2d', this.smooth ? { alpha: false } : { willReadFrequently: true });
      this.W = this.H = 0;
      this.unit = 1;
      // the glow of what shines (glowTo): a small picture of its own, a part `bloom` of the size, laid over the scene
      this.B = null;
    }
    // the glow of the bright parts, drawn as the picture is: each shining triangle (emis) goes also into this small
    // canvas in its colour, raised to the cube so that only the bright stays (a texture as it is); what else shines —
    // the moon, the lines of a circle — the world adds itself through R.B. The picture is never read back for it
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
    // the screen's resolution and drawn up smooth: the cost of a frame goes with its pixels). unit — the canvas pixels
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
      // a part of a thing drawn together (together()): it takes the depth of the thing's own point in the painter's order
      this.list.push({ p, z: (va[2] + vb[2] + vc[2]) / 3, gz: o.group ? this.view(o.gat)[2] : null, o, l: o.emis ? null : this.shade(n, m, o.ds) });
    }
    draw() {
      const x = this.x, F = this.fog;
      // the glow of plain shining triangles: those of one shape (a bubble, a ring) go into it as one path, one fill;
      // whatever solid stands in front (not a cut-out leaf, not added light) darkens it again where it hides what shines
      // — the ground the moon sets behind, a stump over the lines of the circle — the triangles in a row in one fill
      const bx = this.B && this.B.x, cube = v => Math.min(255, (v / 255) ** 3 * 255) | 0;
      const solid = o => !o.emis && !o.cut && o.add == null && o.occlude !== false;
      const dark = (A, B, C) => { if (!run || run.o !== 'dark') { flush(); run = { o: 'dark', a: 1, col: '#000' }; bx.beginPath(); } bx.moveTo(A[0], A[1]); bx.lineTo(B[0], B[1]); bx.lineTo(C[0], C[1]); bx.closePath(); };
      let run = null;
      const flush = () => {
        if (!run) return;
        bx.globalAlpha = run.a; bx.fillStyle = run.col;
        if (run.o === 'dark') { bx.globalCompositeOperation = 'source-over'; bx.fill(); bx.globalCompositeOperation = 'lighter'; } else bx.fill();
        bx.globalAlpha = 1; run = null;
      };
      const lay = o => (o.layer == null ? 1 : o.layer), zOf = t => (t.gz == null ? t.z : t.gz);
      this.list.sort((A, B) => lay(A.o) - lay(B.o) || zOf(B) - zOf(A) || (A.o.group && A.o.group === B.o.group ? (A.o.ord || 0) - (B.o.ord || 0) || B.z - A.z : 0));
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
            // the triangle filled with its texture as a pattern laid onto it — no clip and no mask, many times cheaper
            // where the canvas is drawn without the graphics card
            const pat = src.psxPat || (src.psxPat = x.createPattern(src, 'repeat'));
            pat.setTransform(new DOMMatrix(M));
            x.fillStyle = pat;
            x.fill();
            x.globalAlpha = 1;
            if (bx && solid(o)) dark(A, B, C);
            if (bx && o.emis) {
              flush();
              const bp = src.psxBPat || (src.psxBPat = bx.createPattern(src, 'repeat'));
              bp.setTransform(new DOMMatrix(M));
              bx.globalAlpha = (o.add == null ? 1 : o.add) * (1 - f);
              bx.fillStyle = bp;
              bx.beginPath(); bx.moveTo(A[0], A[1]); bx.lineTo(B[0], B[1]); bx.lineTo(C[0], C[1]); bx.closePath(); bx.fill();
              bx.globalAlpha = 1;
            }
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
          if (bx && solid(o)) dark(A, B, C);
          else if (bx && o.emis) {
            if (!run || run.o !== o) { flush(); run = { o, a: (o.add == null ? 1 : o.add) * (1 - f), col: `rgb(${cube(r)},${cube(gg)},${cube(bb)})` }; bx.beginPath(); }
            bx.moveTo(A[0], A[1]); bx.lineTo(B[0], B[1]); bx.lineTo(C[0], C[1]); bx.closePath();
          }
        }
      }
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

  // a texture lit and fogged (a cut-out one — a leaf, a flame — keeps its outline), kept for the next triangle in the
  // same light: the light in k steps to one. The light of «Друид» flickers (a fire, runes, the moon behind a cloud) and
  // a scene asks for a few thousand of them over a minute: the oldest go first when the copies pass SHADED_PX points
  // (a dozen megabytes) — a cache emptied all at once at 900 copies was made again from nothing, 400 canvases a second
  const SHADED = new Map(), SHADED_PX = 3e6;
  let texId = 0, shadedPx = 0;
  function shaded(tx, l, f, F, k = 10) {
    const q = v => Math.round(Math.min(1.2, v) * k);
    if (!tx.psxId) tx.psxId = ++texId;
    const key = tx.psxId + ':' + k + ':' + (l ? l.map(q).join(',') : '-') + ',' + Math.round(f * 12);
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
  // a rod (a bond, a stem), a billboard; turned() — any of them turned about an axis
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
  // eight faces instead of twenty (o.lo): a berry, a pebble, a pad of moss — small enough that nobody counts its faces
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
  // frame as one, by the depth of its point at, and its parts go in the order asked — part(0) first, then part(1)…;
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
