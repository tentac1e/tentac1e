/* Картинки (data-ill) на каждой вкладке каждой страницы.
   1. Сборка в корне, телефон и компьютер:
      - каждая картинка рисуется — непустой <svg> с viewBox, без ошибок; пустая рамка до отрисовки уже с фоном
        и того же размера (страница без файлов рисунков против страницы с ними);
      - картинка рисуется один раз: загрузка, прокрутка, вкладки, смена темы, поворот телефона её не перерисовывают;
      - в первом кадре после переключения вкладки картинки её первого экрана уже нарисованы;
      - после смены темы цвета картинки другие (вычисленный fill), сама она та же;
      - каждый вариант, который художник перечисляет в illustrate(), рисуется.
   2. Версия для хостинга (dist/site через scripts/serve.py), телефон: процессор ×4, сеть 70 мс и 6 Мбит/с:
      - картинки первого экрана готовы не позже 400 мс после DOMContentLoaded;
      - файлы рисунков главы запрашиваются вместе, а не по одному;
      - вёрстка при загрузке почти не сдвигается: CLS ≤ 0,05.
   node tests/ills.js [posadka.html,…] [--phone|--desktop] [--no-net]   (обе сборки: python3 scripts/build.py и --clean --out dist/site) */
const { playwright, ok, done, watch, fileUrl, FILES, SLUGS, server } = require('./lib');

const args = process.argv.slice(2);
const only = (args.find(a => !a.startsWith('--')) || '').split(',').filter(Boolean);
const modes = args.includes('--phone') ? ['phone'] : args.includes('--desktop') ? ['desktop'] : ['phone', 'desktop'];
const pages = FILES.filter(f => !only.length || only.includes(f));
const NET = { latency: 70, down: 6e6 / 8, up: 2e6 / 8 };
const DRAW_AFTER_DCL = 400, MAX_CLS = 0.05, SPREAD = 150;

const context = (b, mode, extra = {}) => b.newContext({ ...(mode === 'phone' ? { ...devicesOf().iPhone13 } : { viewport: { width: 1280, height: 900 } }), ...extra });
let DEV = null;
const devicesOf = () => DEV;

// in the page, before anything runs: every drawing of every picture is counted
function counter() {
  window.__ill = { n: new WeakMap(), redraws: [] };
  new MutationObserver(ms => ms.forEach(m => {
    const el = m.target;
    if (!el.dataset || !el.dataset.drawn) return;
    const seen = __ill.n.get(el) || {};
    seen[el.dataset.drawn] = (seen[el.dataset.drawn] || 0) + 1;
    if (seen[el.dataset.drawn] > 1) __ill.redraws.push(el.dataset.drawn);
    __ill.n.set(el, seen);
  })).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-drawn'] });
}
// in the page: the pictures of the open tab (and of a page without tabs) that stand on the screen now
function onScreen() {
  const vh = innerHeight;
  return [...document.querySelectorAll('[data-ill]')].filter(e => {
    if (!e.getClientRects().length || e.closest('#gallery')) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < innerWidth;
  });
}
// in the page: size and ground of every picture shown on the open tab, with «Глубже» open
function boxes() {
  document.querySelectorAll('details.deep, details.deeper').forEach(d => { d.open = true; });
  // the same picture may stand twice on a tab (a tile and the large result): told apart by their order
  const n = {};
  return [...document.querySelectorAll('[data-ill]')].filter(e => e.getClientRects().length && !e.closest('#gallery')).map(e => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    const key = e.dataset.ill + (n[e.dataset.ill] = (n[e.dataset.ill] || 0) + 1, n[e.dataset.ill] > 1 ? ' #' + n[e.dataset.ill] : '');
    let bg = cs.backgroundColor, a = e;
    // the paper may be the frame's: a transparent span inside a box that has the ground
    while (/rgba\(0, 0, 0, 0\)|transparent/.test(bg) && a.parentElement && a.parentElement.getBoundingClientRect().width <= r.width + 2) { a = a.parentElement; bg = getComputedStyle(a).backgroundColor; }
    return [key, Math.round(r.width), Math.round(r.height), !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)];
  });
}

async function tabs(page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-panel]')].map(p => p.id));
}
async function openTab(page, id) {
  // the way a reader does it: a tap on the tab in the row, or the address
  return page.evaluate(i => {
    const a = [...document.querySelectorAll('.subnav a')].find(x => (x.getAttribute('href') || '').slice(1) === i || decodeURIComponent((x.getAttribute('href') || '').split('#').pop()) === i);
    if (a) a.click(); else location.hash = i;
    return new Promise(res => requestAnimationFrame(() => {
      const vis = [...document.querySelectorAll('[data-ill]')].filter(e => {
        if (!e.getClientRects().length) return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      });
      res({ vis: vis.length, blank: vis.filter(e => !e.dataset.drawn).map(e => e.dataset.ill) });
    }));
  }, id);
}

async function rootChecks(b, mode, f, errs) {
  const out = [];
  // the empty frames: the page without its picture files
  const bare = await context(b, mode);
  await bare.route(/assets\/js\/labs\//, r => r.abort());
  const bp = await bare.newPage();
  await bp.goto(fileUrl(f), { waitUntil: 'load' });
  await bp.waitForTimeout(300);
  const empty = {};
  const bt = await tabs(bp);
  for (const id of bt.length ? bt : [null]) {
    if (id) { await bp.evaluate(i => { location.hash = i; }, id); await bp.waitForTimeout(150); }
    // both sides measured with the tab's own fonts in place: a caption font that comes later widens the text beside the frame
    await bp.evaluate(() => document.fonts.ready);
    (await bp.evaluate(boxes)).forEach(x => { empty[(id || '') + ' ' + x[0]] = x; });
  }
  await bare.close();

  const ctx = await context(b, mode);
  await ctx.addInitScript(counter);
  const page = await ctx.newPage();
  const mine = [];
  watch(page, mine);
  await page.goto(fileUrl(f), { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const ids = await tabs(page);
  const blankTabs = [];
  for (const [i, id] of ids.entries()) {
    if (i) {
      const r = await openTab(page, id);
      if (r.blank.length) blankTabs.push(`#${id} ${r.blank.length}/${r.vis} (${r.blank.slice(0, 2).join(', ')})`);
    }
    // read the tab down to the end, the way a reader scrolls
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } scrollTo(0, 0); });
    await page.waitForTimeout(500);
  }
  if (ids.length > 1) {
    // back to the first tab: everything there was drawn already
    const r = await openTab(page, ids[0]);
    if (r.blank.length) blankTabs.push(`#${ids[0]} again ${r.blank.length}/${r.vis}`);
  }
  out.push([!blankTabs.length, `${mode.padEnd(7)} ${f}: a tab opens with its pictures drawn${blankTabs.length ? ' — blank: ' + blankTabs.join('; ') : ''}`]);

  // theme and turning the phone: the colours change, the pictures stay
  const probe = await page.evaluate(() => {
    const s = [...document.querySelectorAll('[data-ill] svg [fill], [data-ill] svg path, [data-ill] svg rect')].find(e => e.getClientRects().length && getComputedStyle(e).fill !== 'none');
    return s ? (s.id = s.id || 'ill-probe', [s.id, getComputedStyle(s).fill]) : null;
  });
  await page.click('#theme-toggle').catch(() => {});
  await page.waitForTimeout(400);
  const after = probe ? await page.evaluate(id => getComputedStyle(document.getElementById(id)).fill, probe[0]) : null;
  const vp = page.viewportSize();
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await page.waitForTimeout(500);
  await page.setViewportSize(vp);
  await page.waitForTimeout(500);
  if (probe) out.push([after !== probe[1], `${mode.padEnd(7)} ${f}: the pictures take the other theme's colours (${probe[1]} → ${after})`]);

  // everything on the page, drawn: each once, each a real picture in the frame it was given
  await page.evaluate(() => { document.querySelectorAll('details.deep, details.deeper').forEach(d => { d.open = true; }); window.BasilScience.paint(document, true); });
  await page.waitForTimeout(400);
  const redraws = await page.evaluate(() => __ill.redraws);
  out.push([!redraws.length, `${mode.padEnd(7)} ${f}: each picture drawn once${redraws.length ? ' — again: ' + [...new Set(redraws)].slice(0, 6).join(', ') : ''}`]);
  const bad = [], moved = [], bareFrames = [];
  let total = 0;
  for (const id of ids.length ? ids : [null]) {
    if (id) { await page.evaluate(i => { location.hash = i; }, id); await page.waitForTimeout(120); }
    await page.evaluate(() => document.fonts.ready);
    const pics = await page.evaluate(() => [...document.querySelectorAll('[data-ill]')].filter(e => e.getClientRects().length).map(e => {
      const svg = e.querySelector('svg');
      return [e.dataset.ill, !!svg && !!svg.getAttribute('viewBox') && svg.querySelectorAll('path, rect, circle, ellipse, polygon, line, use, g').length > 2];
    }));
    pics.forEach(([k, good]) => { total++; if (!good) bad.push((id ? '#' + id + ' ' : '') + k); });
    (await page.evaluate(boxes)).forEach(([k, w, h]) => {
      const e = empty[(id || '') + ' ' + k];
      if (!e) return;
      if (Math.abs(e[1] - w) > 2 || Math.abs(e[2] - h) > 2) moved.push(`${k} ${e[1]}×${e[2]} → ${w}×${h}`);
      if (!e[3]) bareFrames.push(k);
    });
  }
  out.push([!bad.length, `${mode.padEnd(7)} ${f}: ${total} pictures, every one a drawing${bad.length ? ' — empty: ' + bad.slice(0, 6).join(', ') : ''}`]);
  out.push([!moved.length, `${mode.padEnd(7)} ${f}: a picture keeps the size of its empty frame${moved.length ? ' — ' + moved.slice(0, 4).join('; ') : ''}`]);
  out.push([!bareFrames.length, `${mode.padEnd(7)} ${f}: the empty frame already has its paper${bareFrames.length ? ' — bare: ' + [...new Set(bareFrames)].slice(0, 6).join(', ') : ''}`]);
  mine.forEach(e => errs.push(e));
  await ctx.close();
  return out;
}

// every variant a painter lists, drawn in a scratch box: the ones a page shows only after a tap
async function variantChecks(b, f, errs) {
  const ctx = await context(b, 'desktop');
  const page = await ctx.newPage();
  const mine = [];
  watch(page, mine);
  await page.goto(fileUrl(f), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const s = document.createElement('span'); s.dataset.ill = '-:-'; document.querySelector('[data-view]').appendChild(s); window.BasilScience.paint(s, true); });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const v = window.BasilScience.variants();
    const keys = Object.keys(v).flatMap(n => v[n].map(x => n + ':' + x));
    const box = document.createElement('div');
    box.id = 'gallery';
    box.style.cssText = 'position:absolute;left:0;top:0;width:900px;display:grid;grid-template-columns:repeat(4,1fr)';
    box.innerHTML = keys.map(k => `<span data-ill="${k}" style="display:block"></span>`).join('');
    document.querySelector('[data-view]').appendChild(box);
    window.BasilScience.paint(box, true);
    const bad = [...box.querySelectorAll('[data-ill]')].filter(e => { const s = e.querySelector('svg'); return !s || !s.getAttribute('viewBox') || s.querySelectorAll('path, rect, circle, ellipse, polygon, line, use').length < 3; }).map(e => e.dataset.ill);
    box.remove();
    return { n: keys.length, bad };
  });
  mine.forEach(e => errs.push(e));
  await ctx.close();
  return r.n ? [[!r.bad.length, `variants ${f}: ${r.n} listed variants draw${r.bad.length ? ' — empty: ' + r.bad.slice(0, 6).join(', ') : ''}`]] : [];
}

// the hosting copy on a slow phone: when the first screen's pictures come, how the picture files are asked for,
// how much the page jumps while it loads
async function netChecks(b, s, f, errs) {
  const slug = SLUGS[f === 'index.html' ? 'glavnaya' : f.replace('.html', '')];
  const ctx = await context(b, 'phone');
  await ctx.addInitScript(() => {
    window.__n = { cls: 0, shifts: [], dcl: 0, at: new WeakMap() };
    new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) { __n.cls += e.value; __n.shifts.push(Math.round(e.startTime) + ':' + e.value.toFixed(3)); } })).observe({ type: 'layout-shift', buffered: true });
    addEventListener('DOMContentLoaded', () => { __n.dcl = performance.now(); });
    // the moment each picture is drawn, written down by the page itself: a question from outside would wait
    // behind the start-up's own turns and come late
    new MutationObserver(ms => ms.forEach(m => { if (m.target.dataset && m.target.dataset.drawn && !__n.at.has(m.target)) __n.at.set(m.target, performance.now()); })).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-drawn'] });
  });
  const page = await ctx.newPage();
  const mine = [];
  watch(page, mine);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NET.latency, downloadThroughput: NET.down, uploadThroughput: NET.up });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(s.base + '/' + (slug ? encodeURIComponent(slug) : ''), { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  // the first screen's pictures: when the last of them was drawn, after DOMContentLoaded
  const first = await page.evaluate(() => {
    const vis = [...document.querySelectorAll('[data-ill]')].filter(e => { if (!e.getClientRects().length) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; });
    const t = vis.map(e => __n.at.get(e));
    return { n: vis.length, blank: t.filter(x => x == null).length, at: t.some(x => x == null) ? Infinity : Math.max(0, ...t) - __n.dcl };
  });
  const r = await page.evaluate(() => ({ cls: __n.cls, shifts: __n.shifts, labs: performance.getEntriesByType('resource').filter(e => /\/labs\//.test(e.name)).map(e => [e.name.split('/').pop().split('?')[0], Math.round(e.startTime)]) }));
  const out = [];
  if (first.n) out.push([first.at <= DRAW_AFTER_DCL, `net     ${f}: ${first.n} first-screen pictures drawn ${Number.isFinite(first.at) ? Math.round(first.at) + ' ms' : 'not at all (' + first.blank + ' blank)'} after DOMContentLoaded (≤ ${DRAW_AFTER_DCL})`]);
  if (r.labs.length > 1) {
    const starts = r.labs.map(x => x[1]);
    const spread = Math.max(...starts) - Math.min(...starts);
    out.push([spread <= SPREAD, `net     ${f}: picture files asked for together (${r.labs.map(x => x[0] + '@' + x[1]).join(' ')}; spread ${spread} ms ≤ ${SPREAD})`]);
  }
  out.push([r.cls <= MAX_CLS, `net     ${f}: layout shift while loading ${r.cls.toFixed(3)} ≤ ${MAX_CLS}${r.cls > MAX_CLS ? ' (' + r.shifts.join(' ') + ')' : ''}`]);
  mine.forEach(e => errs.push(e));
  await ctx.close();
  return out;
}

(async () => {
  const { chromium, devices } = playwright();
  DEV = { iPhone13: { ...devices['iPhone 13 Mini'], deviceScaleFactor: 1 } };
  const b = await chromium.launch();
  const errs = [];
  const jobs = [];
  for (const mode of modes) for (const f of pages) jobs.push(() => rootChecks(b, mode, f, errs));
  for (const f of pages) jobs.push(() => variantChecks(b, f, errs));
  const results = [];
  let next = 0;
  await Promise.all([1, 2, 3, 4].map(async () => { while (next < jobs.length) { const i = next++; results[i] = await jobs[i](); } }));
  results.forEach(list => list.forEach(([good, msg]) => ok(good, msg)));
  if (!args.includes('--no-net')) {
    // one page at a time: the network and processor limits are the browser's, shared by its pages
    const s = await server();
    try { for (const f of pages) (await netChecks(b, s, f, errs)).forEach(([good, msg]) => ok(good, msg)); } finally { s.stop(); }
  }
  await b.close();
  done(errs);
})();
