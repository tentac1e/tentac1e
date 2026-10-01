/* Скорость на телефоне с процессором, замедленным в 4 раза: каждая страница.
     старт   — блокировка до готовности (сумма длинных задач сверх 50 мс), самая длинная задача;
     прокрутка через всю страницу — ни одной задачи дольше 200 мс, не больше трёх кадров дольше 100 мс;
     покой   — на главной, «Уходе» и «Вкусе»: в спокойном состоянии процессор занят меньше, чем при
               действиях, во сне — почти ноль (сроки покоя сокращены через BASIL_CALM).
   Пороги с запасом: тест ловит провалы, а не колебания машины.
   node tests/perf.js [index.html,…]   (сборка в корне: python3 scripts/build.py) */
const { playwright, ok, done, fileUrl, FILES } = require('./lib');

const only = (process.argv[2] || '').split(',').filter(Boolean);
const TBT = { 'index.html': 1100 }, TBT_DEFAULT = 750;
const SLEEP_PAGES = ['index.html', 'uhod.html', 'vkus.html'];

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  for (const f of FILES) {
    if (only.length && !only.includes(f)) continue;
    const ctx = await browser.newContext({ ...devices['iPhone 13 Mini'] });
    await ctx.addInitScript(() => {
      window.BASIL_CALM = [3000, 7000];
      window.__lt = [];
      try { new PerformanceObserver(l => l.getEntries().forEach(e => __lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) { /* no long task timing */ }
    });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(f + ': ' + e.message));
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Performance.enable');
    const busy = async ms => {
      const get = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'TaskDuration').value;
      const a = await get(); await page.waitForTimeout(ms); return (await get() - a) / (ms / 1000);
    };
    await page.goto(fileUrl(f), { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    const load = await page.evaluate(() => __lt.slice());
    const tbt = load.reduce((s, d) => s + Math.max(0, d - 50), 0);
    const budget = TBT[f] || TBT_DEFAULT;
    ok(tbt <= budget, `start ${f.padEnd(17)} blocking ${tbt} ms (≤ ${budget}), longest ${Math.max(0, ...load)} ms`);

    // the whole page scrolled through like a reader skimming it
    const n0 = load.length;
    const sc = await page.evaluate(async () => {
      const gaps = []; let last = performance.now(), on = true;
      const tick = t => { gaps.push(t - last); last = t; if (on) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      const H = document.documentElement.scrollHeight;
      for (let y = 0; y < H; y += 350) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 110)); }
      await new Promise(r => setTimeout(r, 600));
      on = false;
      return gaps.filter(g => g > 100).length;
    });
    const scrollLT = (await page.evaluate(() => __lt.slice())).slice(n0);
    const worst = Math.max(0, ...scrollLT);
    ok(worst <= 200 && sc <= 3, `scroll ${f.padEnd(16)} longest task ${worst} ms (≤ 200), frames over 100 ms: ${sc} (≤ 3)`);

    if (SLEEP_PAGES.includes(f)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.mouse.move(120, 300);
      const active = await busy(1500);
      await page.waitForTimeout(2000); // calm after 3 s without input
      const calm = await busy(1500);
      await page.waitForTimeout(3500); // asleep after 7 s, and a second for the page to settle into it
      const sleep = await busy(2000);
      const cls = await page.evaluate(() => document.documentElement.className);
      await page.mouse.move(200, 320);
      await page.waitForTimeout(400);
      const woke = await page.evaluate(() => !document.documentElement.classList.contains('is-asleep'));
      ok(calm < active * 0.8 && sleep < 0.03 && /is-asleep/.test(cls) && woke, `rest  ${f.padEnd(17)} busy: active ${(active * 100).toFixed(0)} %, calm ${(calm * 100).toFixed(0)} %, asleep ${(sleep * 100).toFixed(1)} % (< 3), wakes on a move: ${woke}`);
    }
    await ctx.close();
  }
  await browser.close();
  done(errs);
})();
