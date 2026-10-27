/* Картинки, которые рисует свой поток: на хостинге (http) холст листьев и неба без оформления, сцена в шапке, склеп
   «Гримуара», роща «Друида» и молекулы оформлений отдаются потоку (transferControlToOffscreen; 04-background.js и
   skins/04-stage.js), и страница только говорит ему, что происходит. По file:// и в книге одним файлом всё рисует
   страница, как прежде, — это проверяют остальные наборы. Здесь, на сборке для хостинга:
     — каждый такой холст отдан потоку (data-off), его кадр нарисован, на экране не пусто, ошибок нет;
     — молекула оформления нарисована его кистью и крутится мышью;
     — главный поток в покое почти свободен: процессор замедлен в 4 раза, а страница с работающими сценами занята
       не больше чем на BUSY % (до потока — 40–120 %).
   node tests/offscreen.js   (сборка: python3 scripts/build.py --clean --out dist/site) */
const { playwright, ok, done, watch, server } = require('./lib');

// the share of the page's own thread busy while it stands, CPU four times slower, at most (the pictures of a chapter
// still being drawn ahead in the idle time on the first visit stay under it)
const BUSY = 25;
const CASES = [
  { skin: '', page: '/вкус', canvases: ['#leaf-field', '.sky-layer canvas'] },
  { skin: 'grimoire', page: '/вкус', canvases: ['.psx-stage canvas', '#psx-crypt'] },
  { skin: 'druid', page: '/вкус', canvases: ['.psx-stage canvas', '#psx-forest canvas.fly', '#psx-forest .gp-branch', '#psx-forest .gp-stump'] },
  { skin: 'grimoire', page: '/', canvases: ['.psx-stage canvas', '#psx-crypt'] },
  { skin: 'druid', page: '/', canvases: ['.psx-stage canvas', '#psx-forest canvas.fly'] }
];

(async () => {
  const { chromium } = playwright();
  const srv = await server();
  const browser = await chromium.launch();
  const errs = [];
  for (const c of CASES) {
    const tag = `${(c.skin || 'plain').padEnd(8)} ${c.page.padEnd(6)}`;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(s => { if (s) localStorage.setItem('basil-skin', JSON.stringify(s)); }, c.skin);
    const page = await ctx.newPage();
    watch(page, errs);
    page.on('worker', w => w.on('console', m => { if (m.type() === 'error') errs.push(`${tag} worker: ${m.text()}`); }));
    await page.goto(srv.base + encodeURI(c.page), { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    // every canvas of it given to the worker, and the frames there: what the screen shows over it is not one colour
    const st = await page.evaluate(sel => sel.map(s => { const el = document.querySelector(s); return { s, there: !!el, off: !!el && 'off' in el.dataset }; }), c.canvases);
    const stage = await page.evaluate(() => [...document.querySelectorAll('.psx-stage')].map(h => h.classList.contains('is-drawn')));
    const shot = await page.screenshot({ clip: { x: 760, y: 120, width: 520, height: 420 } });
    const colours = await page.evaluate(async b64 => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
      const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height).data, set = new Set();
      for (let i = 0; i < d.length; i += 4 * 53) set.add(d[i] >> 3 << 10 | d[i + 1] >> 3 << 5 | d[i + 2] >> 3);
      return set.size;
    }, shot.toString('base64'));
    ok(st.every(x => x.there && x.off) && stage.every(Boolean) && colours > 20, `${tag} drawn by the worker: ${st.map(x => `${x.s} ${x.off ? 'off' : x.there ? 'ON THE PAGE' : 'MISSING'}`).join(', ')}; scenes drawn ${JSON.stringify(stage)}; ${colours} colours on the screen`);

    // the molecule of a skin: from the worker too, turned by the mouse
    if (c.skin && c.page === '/вкус') {
      await page.goto(srv.base + encodeURI('/вкус#молекулы'), { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      const at = await page.evaluate(async () => {
        const cv = [...document.querySelectorAll('canvas')].find(x => x.molView);
        if (!cv) return null;
        cv.scrollIntoView({ block: 'center', behavior: 'instant' });
        await new Promise(r => setTimeout(r, 1200));
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, set = new Set();
        for (let i = 0; i < d.length; i += 4 * 97) set.add(d[i] >> 4 << 8 | d[i + 1] >> 4 << 4 | d[i + 2] >> 4);
        const r = cv.getBoundingClientRect();
        return { colours: set.size, x: r.left + r.width / 2, y: r.top + r.height / 2, turn: JSON.stringify(cv.molView.turn) };
      });
      if (at) {
        await page.mouse.move(at.x, at.y); await page.mouse.down(); await page.mouse.move(at.x + 80, at.y + 30, { steps: 6 }); await page.mouse.up();
        const turned = await page.evaluate(() => JSON.stringify([...document.querySelectorAll('canvas')].find(x => x.molView).molView.turn));
        ok(at.colours > 4 && turned !== at.turn, `${tag} the molecule comes from the worker in the skin's manner (${at.colours} colours) and turns under the mouse`);
      } else ok(false, `${tag} no molecule viewer`);
      await page.goto(srv.base + encodeURI(c.page), { waitUntil: 'load' });
      await page.waitForTimeout(2500);
    }

    // the page's own thread while it stands with all of it running, the CPU four times slower
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Performance.enable');
    const task = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'TaskDuration').value;
    await page.waitForTimeout(1500);
    const t0 = await task();
    for (let i = 0; i < 4; i++) { await page.mouse.move(700 + i * 4, 450); await page.waitForTimeout(1000); }
    const busy = Math.round((await task() - t0) / 4 * 100);
    ok(busy <= BUSY, `${tag} the page's thread busy ${busy} % while it stands (≤ ${BUSY}, CPU ×4)`);
    await ctx.close();
  }
  await browser.close();
  srv.stop();
  done(errs);
})();
