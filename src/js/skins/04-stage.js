  /* ------------------------------------------------------------------ */
  /* the stage at the head of every chapter and in the hero of the home  */
  /* page — the background of its block, under the title, by itself: no   */
  /* finger turns it and nothing is tapped. The world of the skin around  */
  /* (05-grimoire.js, 06-druid.js) and the chapter's own scene in the     */
  /* middle (05-grimoire-*.js, 06-druid-*.js)                             */
  /* ------------------------------------------------------------------ */
  /* A world is world(skin, { raster, textures(), key, sky, defaults, make(S, sc), post(R, t), glow(canvas, R) }):
     the options of its rasterizer, its textures, its key light, the three colours of its sky, what its scenes have
     unless they say otherwise, make — what stands round every scene of it ({ draw(t), lights(t), fx(t, F) }: a floor,
     candles, trees), post — what is done to the finished picture, glow(canvas, R) — what it does with a small canvas of
     the glow of its bright parts (drawn into as the picture is, added to it at the end of the frame).
     A scene is scene(skin, view, S => ({ … })): S.R — the rasterizer, S.T — the textures, S.ang — where the camera
     stands (updated every frame). It gives draw(t) — its shapes at the time t, in seconds — and, if it needs them:
     tick(t) before anything is drawn (the state of the moment; the key light may be changed there), lights(t) — its
     point lights, fill — how strong the soft light from the camera's side is, fx(t, F) — sparks and halos over the
     picture (F.spark, F.halo, F.dot, F.streak), beat(t) and every — what the scene does by itself every few seconds of
     its clock (a ward flares, a handful of leaves falls in), as a loop; candles — its own candles; glow — the
     colour of the circle; glowAdd(t) — how bright it burns; look, rad, near — the camera (the point it looks at, how
     far it stands beside the text of a wide screen, how far in the middle of a narrow one); orbit [angle, swing] — a
     camera that swings in front of the scene instead of going round it; still — the moment shown when the reader asked
     for less motion; bare — it draws its whole world itself (the world's floor, its candles and the rest stay away);
     sky — its own three colours of the sky.
     The camera never goes all the way round: it swings slowly before the scene (orbit, by default [0.6, 0.35]), so that
     the whole picture never slides fast — at the frames a phone draws a fast slide judders */
  const WORLDS = {}, SCENES = {};
  const world = (skin, w) => { WORLDS[skin] = w; SCENES[skin] = SCENES[skin] || {}; };
  const scene = (skin, view, make) => { (SCENES[skin] = SCENES[skin] || {})[view] = make; };
  const smooth = v => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  // a leaf of basil from its base B along F, its blade spread along S (across F when not given): eight triangles of
  // the cut-out texture, its outline the texture's; o.w — how wide, o.curl — how much its tip bends down, o.flat — one
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
    // a texture: each half of the blade covers its half of the picture whole, so the outline is the picture's — round
    // shoulders, a pointed tip — folded along the midrib, the tip curling; the corners outside the blade are clear
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

  // a molecule of the aroma, small and glowing: its atoms at the centre c, turned by yaw; a — how much of it is seen;
  // pal — its colours (the bonds, oxygen, carbon) and lo — atoms of eight faces: violet in «Гримуар», berries and twigs
  // in «Друид»
  const ESSENCE = { bond: [170, 120, 230], O: [240, 70, 60], C: [214, 190, 255] };
  function essence(R, mol, c, yaw, k = 1, a = null, pal = ESSENCE) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const MP = mol.P.map(p => { const q = [p[0] * ca + p[2] * sa, p[1], -p[0] * sa + p[2] * ca]; return [c[0] + q[0] * 0.15 * k, c[1] + q[1] * 0.135 * k + q[2] * 0.03 * k, c[2] + q[2] * 0.15 * k]; });
    mol.bonds.forEach(([i, j]) => rod(R, MP[i], MP[j], 0.012 * k, { col: pal.bond, emis: true, add: a }, 3));
    mol.atoms.split('').forEach((el, i) => ball(R, MP[i], (el === 'O' ? 0.06 : 0.045) * k, { col: el === 'O' ? pal.O : pal.C, emis: true, add: a, lo: pal.lo }));
  }

  // a value that goes over to each new target smoothly, starting slowly and stopping slowly (an easing by a part of the
  // way left each frame starts with its biggest step — a jerk): glide(target, t) gives where it is at the time t. A target
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
  // raster's levels with the ordered dither — in rings, as the console's colours made of it — for its radius in whole
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

  // one scene on a canvas — its world round it, its clock, its frame — wherever it is drawn: on the page, or in the
  // worker of the scenes (below). Its glow, when the world has one (W.glow), is a small canvas of its own the scene
  // draws into as it goes and adds to the picture at the end; edges — how the picture fades out at its sides and darkens
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
    // tab) counts as a tenth of a second at most — the picture never jumps ahead when it wakes
    let now0 = null, time = 0, beat = -1, E = EDGES, art = null;
    const tick = now => { if (now0 != null) time += clamp((now - now0) / 1000, 0, 0.1); now0 = now; return time; };
    // the end of the frame, in the picture itself: the glow drawn up and added, then the fade to nothing at the sides
    // and the dark round the middle in one pass, only where they change anything. The browser then lays one picture over
    // the page — a mask and a layer of glow blended in the page cost the whole head of the page again at every frame
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
  // the edges of a stage: the fade from nothing to whole and back across (x) and down (y) — four points each, as parts
  // of the width and the height — and the dark round the middle (vig: a colour, its alpha how deep; none if empty), as
  // the stage's CSS gives them (--fade-x, --fade-y, --stage-vig: stageEdges)
  const EDGES = { x: [0, 0.22, 0.86, 1], y: [0, 0.12, 0.78, 1], vig: '' };
  function stageEdges(el) {
    const cs = getComputedStyle(el), four = (v, d) => { const n = String(v || '').trim().split(/[\s,]+/).map(Number); return n.length === 4 && n.every(isFinite) ? n : d; };
    return { x: four(cs.getPropertyValue('--fade-x'), EDGES.x), y: four(cs.getPropertyValue('--fade-y'), EDGES.y), vig: cs.getPropertyValue('--stage-vig').trim() };
  }
  // the mask of the edges for a canvas of w × h: the two fades multiplied, and the dark round the middle (an ellipse
  // 85 % × 95 % of the stage at 50 % 45 %, clear to 42 % of it, as deep as the alpha of vig) taken out of it as well —
  // the picture thins there over the page's own dark (the night of the grove behind it) instead of being darkened, so
  // that both are one pass — then turned over (what is taken away); at — the bands of the canvas outside the part the
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
     textured triangles — on a computer without the graphics card for the page, a scene ate the page's whole thread and
     the page scrolled in jerks. Where the browser can, the stage (and the crypt and the grove behind the page) hands its canvases to a worker
     (transferControlToOffscreen): the same file loaded there again over a stand-in of the page (workerBoot), the scene
     drawn there, the page only says where it is — its size, on the screen or not, the page awake, calm or asleep, less
     motion. Where it cannot (a page from file://, the book in one file, an older browser, a check that draws the frames
     itself through window.BASIL_STAGES) — on the page as before */
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
  // in the worker: the canvases the page sends, drawn by one clock — a beat thirty times a second (fifteen when the page
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
      // the beat kept or not, while a scene is drawn and the page awake: late by half again for a while — low (and once
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

  // a canvas the worker draws: kind — what it draws there (OFF), o — what it needs to know of it, fps — its frames a
  // second; extras — more canvases of it by name (the glow of a scene, the panes of the grove); drawn() — called when its
  // first frame is there. The page sends the canvases once, then the size and whether it is wanted (on the screen, the tab
  // in front); post() — anything else it has to say. Gives null where there is no worker; again(canvas, extras) — how it
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
      // the beat kept or not while the page is awake (as in the worker): late by half again for a while — the page
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

