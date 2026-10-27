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
     candles, trees), post — what is done to the finished picture (the console's colours, a glow), glow(canvas, R) —
     what it does with a small canvas laid over the scene in the page (a layer of the glow, added by the browser).
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
      if (round) { x.beginPath(); x.arc(p[0], p[1], s * 0.5, 0, Math.PI * 2); x.fill(); } else x.fillRect(p[0], p[1], s, s);
      if (bx) { bx.fillStyle = col; bx.beginPath(); bx.arc(p[0], p[1], s * 1.2, 0, Math.PI * 2); bx.fill(); }
    };
    return {
      halo(p3, r3, c0, c1) {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), r = R.C.focal * r3 / v[2], g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
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
        x.fillRect(p[0], p[1], Math.max(1, u * 0.7), l);
      }
    };
  }

  // one scene on a canvas — its world round it, its clock, its frame — wherever it is drawn: on the page, or in the
  // worker of the scenes (below); glow — the small canvas the world's glow goes into, when it has one (W.glow)
  function sceneOn(cv, glow, view, skin) {
    const W = WORLDS[skin], set = SCENES[skin];
    const T = W.textures();
    const R = new Raster(cv, W.raster());
    if (glow && W.glow) W.glow(glow, R);
    const S = { R, T, view, ang: 0.6 };
    const sc = { still: 0, look: [0, 1.45, 0], rad: 5.6, near: 5.6, fill: 0.6, orbit: [0.6, 0.35], ...W.defaults, ...(set[view] || set.glavnaya)(S) };
    const env = W.make(S, sc);
    // the scene's own clock: it goes on by the frames drawn, a long frame or a pause (off the screen, asleep, another
    // tab) counts as a tenth of a second at most — the picture never jumps ahead when it wakes
    let now0 = null, time = 0, beat = -1;
    const tick = now => { if (now0 != null) time += clamp((now - now0) / 1000, 0, 0.1); now0 = now; return time; };
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
      x.globalCompositeOperation = 'source-over';
      W.post(R, t);
    }
    return { frame, R, seek: s => { time = s; now0 = null; beat = -1; } };
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
    stage: m => sized(m, sceneOn(m.cv, m.extras.glow, m.view, m.skin)),
    crypt: m => sized(m, cryptOn(m.cv)),
    grove: m => groveOn({ fly: m.cv, ...m.extras }, m.C, m.lay)
  };
  // in the worker: the canvases the page sends, drawn by one clock — each at its own frames a second (a scene 30, the
  // crypt 15), 15 at most when the page is calm, none asleep or off the screen; a still frame with less motion
  function sceneHost() {
    const runs = new Map(), mols = new Map();
    let state = 'active', pending = false;
    const raf = self.requestAnimationFrame ? fn => self.requestAnimationFrame(fn) : fn => setTimeout(() => fn(performance.now()), 16);
    function loop(now) {
      pending = false;
      if (state === 'sleep') return;
      let any = false;
      runs.forEach(r => {
        if (!r.on) return;
        any = true;
        const fps = state === 'calm' ? Math.min(15, r.fps) : r.fps;
        if (now - r.prev < 1000 / fps * (state === 'calm' ? 0.75 : 1) - 3) return;
        r.prev = now;
        r.s.frame(now);
        if (!r.drawn) { r.drawn = true; postMessage({ type: 'drawn', id: r.id }); }
        if (reduce.matches) r.on = false;
      });
      if (any) wake();
    }
    const wake = () => { if (!pending && state !== 'sleep') { pending = true; raf(loop); } };
    self.onmessage = e => {
      const m = e.data, r = runs.get(m.id);
      if (m.type === 'canvas') {
        m.cv.clientWidth = m.w; m.cv.clientHeight = m.h;
        runs.set(m.id, { id: m.id, s: OFF[m.kind](m), on: false, prev: -1e9, drawn: false, fps: m.fps });
      } else if ((m.type === 'size' || m.type === 'lay') && r) {
        if (m.type === 'size' && r.s.size) r.s.size(m);
        if (m.type === 'lay' && r.s.lay) r.s.lay(m.lay);
        if (reduce.matches) { r.prev = -1e9; r.on = true; }
      }
      else if (m.type === 'run' && r) { r.on = m.on; if (m.on) r.prev = -1e9; }
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
      else if (m.type === 'state') state = m.state;
      else if (m.type === 'reduce') { self.psxMedia.matches = m.on; runs.forEach(q => { q.prev = -1e9; }); }
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
      w.onmessage = e => { const f = workerWaits.get(e.data.id); if (f) f(e.data); };
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
  // nothing is tapped; it goes on by itself
  function stage(host, view, skin) {
    const W = WORLDS[skin], set = SCENES[skin];
    const holder = doc.createElement('div');
    holder.className = 'psx-stage is-backdrop';
    holder.dataset.scene = set[view] ? view : 'glavnaya';
    holder.dataset.skin = skin;
    holder.setAttribute('aria-hidden', 'true');
    // the ground under the words, like the paper of a picture (tests/overlap.js lets text lie on it)
    holder.dataset.bg = '';
    // the scene's canvas and, if its world lays a glow over it, the small canvas of the glow (the browser adds it)
    const canvases = () => {
      holder.textContent = '';
      const cv = doc.createElement('canvas');
      holder.appendChild(cv);
      let glow = null;
      if (W.glow) { glow = doc.createElement('canvas'); glow.className = 'psx-glow'; holder.appendChild(glow); }
      return { cv, glow };
    };
    let { cv, glow } = canvases();
    host.insertBefore(holder, host.firstChild);
    let seen = false;
    const wanted = () => seen && !doc.hidden;

    // drawn by the worker where it can be; if it fails after all, on the page on fresh canvases
    const off = offCanvas(cv, 'stage', { view, skin }, W.fps || 30, () => { ({ cv, glow } = canvases()); seen = true; const L = onPage(); L.start(); return { destroy() { L.stop(); } }; }, { glow }, () => holder.classList.add('is-drawn'));
    if (off) return { destroy() { off.destroy(); holder.remove(); } };

    // drawn on the page: runs while on the screen, by the page's frame budget; one still frame with reduced motion
    function onPage() {
      const s = sceneOn(cv, glow, view, skin);
      // as many frames on a phone as anywhere: at 20 the scenes judder
      const L = psxLoop(ts => { if (!wanted()) { L.stop(); return; } s.frame(ts); holder.classList.add('is-drawn'); if (reduce.matches) L.stop(); }, W.fps || 30, W.fps || 30);
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
        doc.removeEventListener('visibilitychange', vis);
        holder.remove();
      }
    };
  }

