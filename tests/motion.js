/* Сцены оформлений идут без рывков: каждая сцена каждой страницы в «Гримуаре» и «Друиде» — 8 секунд по 30 кадров,
   кадр за кадром на собственных часах сцены. Ничто не выскакивает на один кадр (вторая разность во времени средней
   яркости клеток сетки 32 × 18 — большая, где предмет прыгнул и вернулся, малая при любом плавном движении) и ничто не
   проносится слишком быстро (разница соседних кадров). Светлячок или искра на сетку почти не влияют: среднее берётся по
   всем точкам клетки. Худшие места каждой сцены — в выводе. Проверяет сборку в корне репозитория.
   node tests/motion.js [sorta,uhod] [--skin=druid] [--s=секунды] */
const { playwright, ok, done, watch, fileUrl, FILES, SKINS, inSkin } = require('./lib');

const args = process.argv.slice(2);
const only = (args.find(a => !a.startsWith('--')) || '').split(',').filter(Boolean).map(f => (f.endsWith('.html') ? f : f + '.html'));
const skinArg = args.find(a => a.startsWith('--skin='));
const skins = skinArg ? [skinArg.slice(7)] : SKINS;
const SEC = +((args.find(a => a.startsWith('--s=')) || '--s=8').slice(4));
// a pop: a cell of the grid away from both its neighbours in time, in the same direction, by this much of 255
const POP = 40;
// a slide: the biggest change of a cell from one frame to the next, in 95 frames of 100
const SLIDE = 40;

// in the page: the scene's frames one after another, as the loop would draw them at 30 a second
function measure(N) {
  const st = (window.BASIL_STAGES || [])[0];
  if (!st) return null;
  st.stop();
  const grid = () => {
    const W = st.R.W, H = st.R.H, d = st.R.x.getImageData(0, 0, W, H).data, o = new Float32Array(32 * 18), n = new Float32Array(32 * 18);
    for (let y = 0; y < H; y++) {
      const gy = (y * 18 / H) | 0;
      for (let x = 0; x < W; x++) { const k = (y * W + x) * 4, c = gy * 32 + ((x * 32 / W) | 0); o[c] += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; n[c]++; }
    }
    for (let i = 0; i < o.length; i++) o[i] /= n[i];
    return o;
  };
  // a second into the scene first, then the frames
  let now = 1e6;
  st.frame(now);
  for (let k = 0; k < 10; k++) st.frame(now += 100);
  const G = [], pops = [], slides = [];
  for (let i = 0; i < N; i++) {
    st.frame(now += 1000 / 30);
    G.push(grid());
    if (G.length > 3) G.shift();
    if (G.length >= 2) { let m = 0; const A = G[G.length - 1], B = G[G.length - 2]; for (let c = 0; c < A.length; c++) m = Math.max(m, Math.abs(A[c] - B[c])); slides.push(m); }
    if (G.length === 3) {
      let best = 0, at = 0;
      for (let c = 0; c < G[0].length; c++) {
        const d1 = G[1][c] - G[0][c], d2 = G[1][c] - G[2][c], v = Math.sign(d1) === Math.sign(d2) ? Math.min(Math.abs(d1), Math.abs(d2)) : 0;
        if (v > best) { best = v; at = c; }
      }
      pops.push({ frame: i - 1, v: Math.round(best), cell: [at % 32, (at / 32) | 0] });
    }
  }
  slides.sort((a, b) => a - b);
  pops.sort((a, b) => b.v - a.v);
  return { slide: Math.round(slides[(slides.length * 0.95) | 0]), worst: pops.slice(0, 3) };
}

(async () => {
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  for (const skin of skins) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(() => { window.BASIL_STAGES = []; });
    await inSkin(ctx, skin);
    for (const f of (only.length ? only : FILES)) {
      const page = await ctx.newPage();
      watch(page, errs);
      await page.goto(fileUrl(f), { waitUntil: 'load' });
      await page.waitForTimeout(1000);
      const r = await page.evaluate(measure, SEC * 30);
      ok(r && r.worst[0].v < POP && r.slide < SLIDE, `${skin.padEnd(8)} ${f.padEnd(16)} ${r ? `pop ${r.worst.map(p => `${p.v} (frame ${p.frame}, cell ${p.cell})`).join(', ')} · slide ${r.slide}` : 'no scene'}`);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  done(errs);
})();
