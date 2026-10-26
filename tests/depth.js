/* Сцены оформлений нарисованы без ошибок порядка: художник рисует грани от дальней к ближней, и там, где детали лежат
   почти в одной плоскости (книга на пюпитре, плита на алтаре), дальняя грань может лечь поверх ближней — вырезанный
   треугольник, который стоит, пока стоит сцена, и которого не видит проверка рывков (motion.js ловит только то, что
   выскакивает на кадр). Здесь каждый кадр проходит ещё раз через буфер глубины: сплошные грани (не вырезанный лист, не
   прибавляемый свет; светящаяся, но непрозрачная грань — тоже сплошная: огонь в топке), в том порядке, в каком их положил художник, — точка, где дальняя легла поверх ближней, ошибка.
   Тонкая линия по шву двух деталей не видна; видно пятно: «ядро» — ошибочные точки, у которых все четыре соседа тоже
   ошибочны. И второе: текстура ложится на треугольник аффинно, как на приставке, и треугольник, у которого ближний угол
   много ближе дальнего, гнёт её рисунок (так линии круга на полу «Гримуара» стекали к камере струями) — насколько
   отображение уходит от верного, в точках холста шириной 400: размер треугольника на экране × разброс глубины.
   Восемь кадров каждой сцены, с минуты на странице; худший кадр — в выводе, его маска — tests/out/depth-<оформление>-
   <страница>.png (красное — ошибка порядка, жёлтое — согнутая текстура). Проверяет сборку в корне репозитория.
   node tests/depth.js [sorta,uhod] [--skin=druid] [--shots] */
const fs = require('fs');
const path = require('path');
const { playwright, ok, done, watch, fileUrl, FILES, SKINS, inSkin, OUT } = require('./lib');

const args = process.argv.slice(2);
const only = (args.find(a => !a.startsWith('--')) || '').split(',').filter(Boolean).map(f => (f.endsWith('.html') ? f : f + '.html'));
const skinArg = args.find(a => a.startsWith('--skin='));
const skins = skinArg ? [skinArg.slice(7)] : SKINS;
const shots = args.includes('--shots');
// the share of the scene's solid points in an error of order, at most (a thin line along a seam is no fault)
const SEAM = 1.2;
// the points of a spot of error (all four neighbours wrong too), in a thousand of the solid ones, at most
const CORE = 1.5;
// how much farther a point may be and still pass as the same: parts of a thing lie a few thousandths apart (the
// leaves of a book over its board), and the order between them is as wrong as any
const TOL = +((args.find(a => a.startsWith('--tol=')) || '--tol=0.003').slice(6));
// how far apart two faces' colours must be for the wrong one on top to show, of 255 in a channel
const TONE = 14;
// how far a texture's affine map may stray from the true one, in points of a canvas 400 across
const STRAY = 20;
const TIMES = [60, 61.5, 63, 64.5, 66, 67.5, 69, 70.5];

// in the page: each frame of the scene through a depth buffer, and how far its textures are bent
function audit({ times, L }) {
  const st = (window.BASIL_STAGES || [])[0];
  if (!st) return null;
  st.stop();
  const R = st.R, tri0 = R.tri.bind(R), draw0 = R.draw.bind(R), TONES = new Map();
  const toneOf = tx => {
    if (!TONES.has(tx)) {
      const d = tx.getContext('2d').getImageData(0, 0, tx.width, tx.height).data, m = [0, 0, 0];
      let n = 0;
      for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; m[0] += d[i] * a; m[1] += d[i + 1] * a; m[2] += d[i + 2] * a; n += a; }
      TONES.set(tx, m.map(v => v / Math.max(1, n)));
    }
    return TONES.get(tx);
  };
  R.tri = (a, b, c, o) => {
    const n = R.list.length;
    tri0(a, b, c, o);
    if (R.list.length > n) R.list[n].zs = [R.view(a)[2], R.view(b)[2], R.view(c)[2]];
  };
  let last = null;
  R.draw = (...a) => {
    // the list in the painter's order is the list after drawing
    const out = draw0(...a);
    const k = R.smooth ? Math.min(1, 480 / R.W) : 1, W = Math.ceil(R.W * k), H = Math.ceil(R.H * k);
    const depth = new Float32Array(W * H).fill(Infinity), who = new Int32Array(W * H), bad = new Uint8Array(W * H), bent = new Uint8Array(W * H);
    // the colour a face shows (its own or its texture's, in its light and its fog): a face over another of the same
    // colour (the tiers of one fir far in the mist) hides nothing that could be seen
    const tones = R.list.map(t => {
      const c = t.o.tex ? toneOf(t.o.tex) : t.o.col || [0, 0, 0], l = t.l || [1, 1, 1];
      const f = t.o.nofog ? 0 : Math.min(1, Math.max(0, (t.z - R.fogNear) / (R.fogFar - R.fogNear))) ** 1.15;
      return c.map((v, j) => Math.min(255, v * l[j]) * (1 - f) + R.fog[j] * f);
    });
    const differ = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])) > L.tone;
    let stray = 0, solid = 0, seam = 0, core = 0;
    R.list.forEach((t, ti) => {
      const o = t.o;
      if (!t.zs) return;
      const [A, B, C] = t.p.map(q => [q[0] * k, q[1] * k]), [za, zb, zc] = t.zs;
      const x0 = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const y0 = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
      if (Math.abs(d) < 1e-6 || x1 < x0 || y1 < y0) return;
      // a texture bent by the affine map: the size of the triangle's part on the canvas times its spread in depth
      let bend = false;
      if (o.tex && !o.cut) {
        const lo = Math.min(za, zb, zc), hi = Math.max(za, zb, zc), s = Math.hypot(x1 - x0, y1 - y0) / k * 400 / R.W * (hi - lo) / (hi + lo);
        if (s > stray) stray = s;
        bend = s > L.stray;
      }
      const isSolid = !o.cut && o.add == null && (o.layer == null ? 1 : o.layer) >= 1;
      if (!isSolid && !bend) return;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const l1 = ((B[1] - C[1]) * (px - C[0]) + (C[0] - B[0]) * (py - C[1])) / d, l2 = ((C[1] - A[1]) * (px - C[0]) + (A[0] - C[0]) * (py - C[1])) / d, l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue;
        const i = y * W + x;
        if (bend) bent[i] = 1;
        if (!isSolid) continue;
        const z = 1 / (l1 / za + l2 / zb + l3 / zc);
        if (depth[i] !== Infinity && z > depth[i] * (1 + L.tol) + L.tol && differ(tones[ti], tones[who[i]])) bad[i] = 1;
        depth[i] = z;
        who[i] = ti;
      }
    });
    for (let i = 0; i < W * H; i++) {
      if (depth[i] !== Infinity) solid++;
      if (!bad[i]) continue;
      seam++;
      const x = i % W;
      if (x > 0 && x < W - 1 && i >= W && i < W * (H - 1) && bad[i - 1] && bad[i + 1] && bad[i - W] && bad[i + W]) core++;
    }
    last = { seam: seam / Math.max(1, solid) * 100, core: core / Math.max(1, solid) * 1000, stray, W, H, bad, bent };
    return out;
  };
  let now = 1e6, worst = null;
  const frames = [];
  for (const t of times) {
    st.seek(t);
    st.frame(now += 33);
    st.frame(now += 33);
    const f = { t, seam: +last.seam.toFixed(2), core: +last.core.toFixed(2), stray: Math.round(last.stray) };
    frames.push(f);
    const score = f.core / L.core + f.seam / L.seam + f.stray / L.stray;
    if (!worst || score > worst.score) worst = { ...f, score, bad: last.bad, bent: last.bent, W: last.W, H: last.H };
  }
  // the worst frame again, its faults over it: red — an error of order, yellow — a bent texture
  st.seek(worst.t);
  st.frame(now += 33);
  st.frame(now += 33);
  const cv = R.c, ov = document.createElement('canvas');
  ov.width = cv.width; ov.height = cv.height;
  const x = ov.getContext('2d'), s = cv.width / worst.W;
  x.drawImage(cv, 0, 0);
  for (let i = 0; i < worst.W * worst.H; i++) {
    if (!worst.bad[i] && !worst.bent[i]) continue;
    x.fillStyle = worst.bad[i] ? 'rgba(255,0,0,.85)' : 'rgba(255,220,0,.45)';
    x.fillRect((i % worst.W) * s, Math.floor(i / worst.W) * s, Math.ceil(s), Math.ceil(s));
  }
  const max = key => Math.max(...frames.map(f => f[key]));
  return { seam: max('seam'), core: max('core'), stray: max('stray'), worst: { t: worst.t, seam: worst.seam, core: worst.core, stray: worst.stray }, png: ov.toDataURL() };
}

(async () => {
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  for (const skin of skins) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
    await ctx.addInitScript(() => { window.BASIL_STAGES = []; });
    await inSkin(ctx, skin);
    for (const f of (only.length ? only : FILES)) {
      const page = await ctx.newPage();
      watch(page, errs);
      await page.goto(fileUrl(f), { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      const r = await page.evaluate(audit, { times: TIMES, L: { seam: SEAM, core: CORE, stray: STRAY, tol: TOL, tone: TONE } });
      const name = `depth-${skin}-${f.replace('.html', '')}.png`;
      if (r && (shots || r.seam > SEAM || r.core > CORE || r.stray > STRAY)) fs.writeFileSync(path.join(OUT, name), Buffer.from(r.png.split(',')[1], 'base64'));
      ok(r && r.seam <= SEAM && r.core <= CORE && r.stray <= STRAY, `${skin.padEnd(8)} ${f.padEnd(16)} ${r ? `order ${r.seam}% of the solid, spots ${r.core}‰, texture bent by ${r.stray} · worst at ${r.worst.t} s (${r.worst.seam}%, ${r.worst.core}‰, ${r.worst.stray})` : 'no scene'}`);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  done(errs);
})();
