/* «Заглянуть»: ссылка из текста в другую главу или на другую вкладку, кнопка строки «Глубже» в шапке главы и инструмент
   открывают своё место в шторке (03-peek.js), страница под ней не сдвигается; в шторке видно только это место
   (25-peek.css), его модели собраны; Esc, × и «Назад» закрывают шторку, не оставляя шага в истории. «Открыть в главе» —
   переход, там «← Вернуться», а «Назад» ставит к предложению со ссылкой; ссылка ниже на той же вкладке — прокрутка
   и «↑ Вернуться к тексту». Каждая ссылка, которую сайт отдаёт шторке, находит свою цель. Главная: всё на месте,
   короче прежнего, переключатели и раскрытие глав работают.
   python3 scripts/build.py && python3 scripts/build.py --clean --out dist/site && node tests/peek.js */
const fs = require('fs');
const path = require('path');
const { ROOT, playwright, server, ok, done, watch, landedAt, FILES, fileUrl } = require('./lib');

// what never goes to the sheet: read from the code, so that the audit below asks what the page does
const SKIP = /const PEEK_SKIP = '([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'src/js/app/03-peek.js'), 'utf8'))[1];

const sheet = page => page.evaluate(() => {
  const d = document.getElementById('sheet-peek');
  return { open: d.open, loading: d.classList.contains('is-loading'), h: document.getElementById('peek-h').textContent.trim(), where: document.getElementById('peek-where').textContent.trim() };
});
const ready = page => page.waitForFunction(() => { const d = document.getElementById('sheet-peek'); return d.open && !d.classList.contains('is-loading'); }, null, { timeout: 12000 }).then(() => true, () => false);
const shut = page => page.waitForFunction(() => !document.getElementById('sheet-peek').open, null, { timeout: 4000 }).then(() => true, () => false);
const frameOf = page => page.frames().find(f => /[?&]peek=1/.test(f.url()));
// the page in the frame: what it shows (the target and the way to it only) and whether its models stand built
const inFrame = f => f.evaluate(() => {
  const vis = el => !!el && el.getClientRects().length > 0;
  const t = document.querySelector('[data-peek]');
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  const stray = [...document.querySelectorAll('#main *')]
    .filter(el => vis(el) && !el.closest('[data-peek]') && !el.hasAttribute('data-peek-up') && !el.children.length && el.textContent.trim())
    .map(el => el.tagName.toLowerCase() + ': ' + el.textContent.trim().slice(0, 40));
  return {
    peek: document.documentElement.classList.contains('is-peek'), has: !!t, h: t ? t.offsetHeight : 0,
    inside: !target || !!(t && (t === target || t.contains(target) || (t.matches('[data-panel]') && t.contains(target)))),
    stray: stray.slice(0, 4), chrome: ['.topbar', '.ch-hero', '.subnav-wrap', '.pager', '.footer', '.tabbar', '.deep-index'].filter(s => vis(document.querySelector(s))),
    labs: t ? [...t.querySelectorAll('.lab-tool')].map(l => l.childElementCount) : [], theme: document.documentElement.getAttribute('data-theme')
  };
});
// the models of the place in the frame, scrolled to one by one (they are built as they come near): built or not
const built = f => f.evaluate(async () => {
  const out = [];
  for (const l of document.querySelectorAll('[data-peek] .lab-tool')) {
    l.scrollIntoView({ block: 'center', behavior: 'instant' });
    for (let i = 0; i < 20 && !l.childElementCount; i++) await new Promise(r => setTimeout(r, 100));
    out.push(l.dataset.lab + ':' + l.childElementCount);
  }
  scrollTo({ top: 0, behavior: 'instant' });
  return out;
});
const state = page => page.evaluate(() => ({ y: Math.round(scrollY), url: location.href, last: localStorage.getItem('basil-last'), pos: localStorage.getItem('basil-pos'), peekStep: !!(history.state && history.state.peek) }));

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];

  // ---------- a phone, the build in the root ----------
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  watch(page, errs);
  const toRecipe = async () => {
    await page.goto(fileUrl('urozhay.html') + '#' + encodeURIComponent('рецепты'), { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const c = document.getElementById('r-pistou'); c.open = true; c.querySelector('.rc-sci a').scrollIntoView({ block: 'center', behavior: 'instant' }); });
    await page.waitForTimeout(400);
  };
  await toRecipe();
  const link = await page.evaluate(() => document.querySelector('#r-pistou .rc-sci a').getAttribute('href'));
  ok(/vkus\.html#deep-letuchest$/.test(link), 'the recipe links to the dive on another page: ' + link);
  const before = await state(page);
  await page.click('#r-pistou .rc-sci a');
  ok(await ready(page), 'recipe link: the sheet opens and its place comes');
  let f = frameOf(page);
  ok(f && /vkus\.html\?peek=1#deep-letuchest$/.test(f.url()), 'the frame holds the chapter in its peek mode: ' + (f && f.url().replace(/^.*\//, '')));
  await page.waitForTimeout(900);
  let v = f ? await inFrame(f) : {};
  ok(v.peek && v.has && v.h > 200 && v.inside && !v.stray.length && !v.chrome.length, 'in the sheet: only the dive, open, without the page around it ' + JSON.stringify(v));
  let s = await sheet(page);
  ok(s.h.length > 8 && /Вкус и аромат · Глубже/.test(s.where), `the sheet says what and where: «${s.where}» / «${s.h}»`);
  let now = await state(page);
  ok(now.y === before.y && now.url === before.url && now.last === before.last && now.peekStep, `the page under it stays: y ${before.y}→${now.y}, address and «Продолжить» the same, one history step`);
  // Esc, the cross and Back close it; the history step goes with it
  for (const [how, close] of [['Esc', () => page.keyboard.press('Escape')], ['×', () => page.click('#sheet-peek [data-close]')], ['Back', () => page.evaluate(() => history.back())]]) {
    if (!(await sheet(page)).open) { await page.click('#r-pistou .rc-sci a'); await ready(page); }
    await close();
    const gone = await shut(page);
    await page.waitForTimeout(300);
    now = await state(page);
    ok(gone && Math.abs(now.y - before.y) <= 2 && now.url === before.url && !now.peekStep, `${how} closes the sheet; the page stands (${before.y}→${now.y}), no step left in the history`);
  }

  // «Открыть в главе»: there, the way back, and Back to the link's sentence
  const sentence = 'Писту не варят';
  for (const back of ['pill', 'Back']) {
    await page.click('#r-pistou .rc-sci a');
    await ready(page);
    await Promise.all([page.waitForNavigation(), page.click('#peek-go')]);
    await page.waitForTimeout(1300);
    const there = await page.evaluate(() => { const p = document.querySelector('.back-pill'); const d = document.getElementById('deep-letuchest'); return { url: decodeURIComponent(location.href.replace(/^.*\//, '')), pill: p && p.textContent.replace(/\s+/g, ' ').trim(), open: d && d.open, top: d && Math.round(d.getBoundingClientRect().top) }; });
    ok(/^vkus\.html#deep-letuchest/.test(there.url) && there.open && there.top < 300, `«Открыть в главе» goes to the dive itself ${JSON.stringify(there)}`);
    ok(/Вернуться/.test(there.pill || '') && /Урожай · Писту/.test(there.pill || ''), `there the way back says where to: «${there.pill}»`);
    if (back === 'pill') await Promise.all([page.waitForNavigation(), page.click('.back-pill .resume-go')]);
    else await page.goBack();
    await page.waitForTimeout(1500);
    const at = await landedAt(page);
    ok(page.url().includes('urozhay.html') && at && at.words.replace(/\u00a0/g, ' ').startsWith(sentence) && at.top > at.cover && at.top < at.vh / 2, `${back === 'pill' ? '«← Вернуться»' : 'Back'} returns to the link's sentence ${JSON.stringify(at)}`);
  }

  // the chapter's «Глубже» row: the dive of another tab in the sheet, the tab the reader is on stays
  await page.goto(fileUrl('uhod.html'), { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const tab0 = await page.evaluate(() => document.querySelector('.panel.is-active').id);
  await page.click('.deep-index a[href="#deep-vpd"]');
  ok(await ready(page), 'a chip of the «Глубже» row opens the sheet');
  f = frameOf(page);
  await page.waitForTimeout(700);
  v = f ? await inFrame(f) : {};
  const tab1 = await page.evaluate(() => document.querySelector('.panel.is-active').id);
  ok(f && /uhod\.html\?peek=1#deep-vpd$/.test(f.url()) && v.has && v.inside && !v.stray.length && tab1 === tab0, `the dive «VPD» in the sheet, the tab stays «${tab0}»→«${tab1}» ${JSON.stringify(v)}`);
  const labs = f ? await built(f) : [];
  ok(labs.length && labs.every(x => !x.endsWith(':0')), 'its models are built in the sheet as the reader comes to them ' + labs.join(', '));
  // a link inside the sheet opens its place in the same sheet, ← comes back
  const inner = f && await f.evaluate(() => { const a = [...document.querySelectorAll('[data-peek] a[href]')].find(x => /#deep-|#[а-я]/.test(x.getAttribute('href')) && x.offsetParent); return a ? a.getAttribute('href') : null; });
  if (inner) {
    await f.click(`[data-peek] a[href="${inner}"]`);
    await page.waitForTimeout(300);
    await ready(page);
    const back = await page.evaluate(() => !document.querySelector('#sheet-peek [data-peek-back]').hidden);
    ok(back && frameOf(page) && frameOf(page).url().includes('?peek=1'), `a link inside the sheet (${inner}) opens in the same sheet, with ← to the one before`);
    await page.click('#sheet-peek [data-peek-back]');
    await ready(page);
    await page.waitForTimeout(300);
    ok(/#deep-vpd$/.test(frameOf(page).url()) && (await page.evaluate(() => document.querySelector('#sheet-peek [data-peek-back]').hidden)), '← goes back to the dive');
  }
  await page.click('#sheet-peek [data-close]');
  await shut(page);

  // lower on the same tab: a scroll, and the way back up to the link
  await page.goto(fileUrl('uhod.html') + '#' + encodeURIComponent('свет'), { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const near = 'main .panel.is-active a[href="#deep-fotosintez"]:not(.deep-index a)';
  await page.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center', behavior: 'instant' }), near);
  await page.waitForTimeout(400);
  const y0 = (await state(page)).y;
  await page.click(near);
  await page.waitForTimeout(1200);
  const went = await page.evaluate(() => ({ y: Math.round(scrollY), sheet: document.getElementById('sheet-peek').open, pill: (document.querySelector('.back-pill') || {}).textContent }));
  ok(!went.sheet && went.y > y0 + 200 && /Вернуться к тексту/.test(went.pill || ''), `a link lower on the tab scrolls there (${y0}→${went.y}) and offers «${(went.pill || '').replace(/\s+/g, ' ').trim()}»`);
  await page.click('.back-pill .resume-go');
  await page.waitForTimeout(1400);
  const up = await page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); const m = document.querySelector('.resume-mark'); return { top: Math.round(r.top), H: innerHeight, mark: !!m }; }, near);
  ok(up.mark && up.top > 0 && up.top < up.H * 0.6, `«↑ Вернуться к тексту» brings the link's sentence back ${JSON.stringify(up)}`);

  // the home page: shorter, nothing gone, its switches and folds work
  const home = async (ctxOpt, max) => {
    const c = await browser.newContext(ctxOpt);
    const p = await c.newPage();
    watch(p, errs);
    await p.goto(fileUrl('index.html'), { waitUntil: 'load' });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const q = s => document.querySelectorAll(s).length;
      return { h: document.documentElement.scrollHeight, chapters: q('#chapters > .toc-item'), desc: q('#chapters .toc-d'), subs: q('#chapters .toc-sub a'), tools: q('#tools-home a.tool'),
        passport: q('#short-pasport dl > div'), facts: q('#short-cifry .facts li'), journey: q('#journey li'), rules: q('#rules .rule'), wide: document.documentElement.scrollWidth > innerWidth };
    });
    ok(r.h <= max && r.chapters === 11 && r.desc === 11 && r.subs > 30 && r.tools === 16 && r.passport === 5 && r.facts === 6 && r.journey === 6 && r.rules === 8 && !r.wide,
      `home ${ctxOpt.viewport.width} px: ${r.h} px tall (≤ ${max}), every chapter with its sections, 16 tools, the passport, figures, path and rules ${JSON.stringify(r)}`);
    await p.click('#chapters [data-toc="udobreniya"] .toc-tog');
    await p.waitForTimeout(350);
    const fold = await p.evaluate(() => { const li = document.querySelector('#chapters [data-toc="udobreniya"]'); const a = li.querySelector('.toc-sub a'); return li.classList.contains('is-open') && a.getBoundingClientRect().height > 30 && /udobreniya\.html#/.test(a.getAttribute('href')); });
    ok(fold, 'a chapter on the home page opens into its sections, each a link to it');
    for (const part of ['cifry', 'put', 'pravila', 'pasport']) {
      await p.click(`.short-seg [data-short="${part}"]`);
      const shown = await p.evaluate(x => [...document.querySelectorAll('[data-short-pane]')].filter(e => !e.hidden).map(e => e.dataset.shortPane).join(), part);
      ok(shown === part, `«Базилик коротко» → ${part}: only it shows (${shown})`);
    }
    const seg = await p.evaluate(() => getComputedStyle(document.querySelector('.tools-seg')).display !== 'none');
    if (seg) {
      for (const g of ['calc', 'know', 'plan']) {
        await p.click(`.tools-seg [data-tools="${g}"]`);
        const n = await p.evaluate(x => [...document.querySelectorAll('#tools-home .tool')].filter(a => a.offsetParent).map(a => a.closest('.tools-group').id), g);
        ok(n.length > 3 && n.every(id => id === 'tools-' + g), `the tools' switch → ${g}: ${n.length} of its tools, no other`);
      }
    } else ok((await p.evaluate(() => [...document.querySelectorAll('#tools-home .tool')].filter(a => a.offsetParent).length)) === 16, 'a computer shows all 16 tools at once');
    // the search leads to a rule: its part opens
    await p.goto(fileUrl('index.html') + '#glavnaya-h5', { waitUntil: 'load' });
    await p.waitForTimeout(900);
    const rule = await p.evaluate(() => { const h = document.getElementById('glavnaya-h5'); const r = h.getBoundingClientRect(); return !h.closest('[data-short-pane]').hidden && r.top >= 0 && r.top < innerHeight / 2; });
    ok(rule, 'a link to a rule opens «Правила» and stands at it');
    await c.close();
  };
  await home({ ...devices['iPhone 13'] }, 6200);
  await home({ viewport: { width: 1440, height: 900 } }, 4800);

  // every link the site gives the sheet finds its place: the target is there and only it shows
  const targets = new Map();
  for (const file of FILES.filter(x => x !== 'index.html' && x !== 'moy.html')) {
    await page.goto(fileUrl(file), { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const found = await page.evaluate(skip => {
      const files = window.BASIL_PAGES.files, byFile = Object.fromEntries(Object.entries(files).map(([v, f]) => [decodeURIComponent(f).replace(/^\.?\//, ''), v]));
      const here = document.querySelector('[data-view]').dataset.view, out = [];
      document.querySelectorAll('main a[href]').forEach(a => {
        if (a.closest(skip) || a.target === '_blank') return;
        const href = a.getAttribute('href'), i = href.indexOf('#');
        if (i < 0) return;
        const file = decodeURIComponent(href.slice(0, i)), id = decodeURIComponent(href.slice(i + 1));
        const view = file ? byFile[file] : here;
        if (!view || !id || view === 'moy' || view === 'glavnaya') return;
        if (view === here) {
          const el = document.getElementById(id);
          if (!el || el.matches('[data-panel], [data-view]')) return;
          if (!a.closest('.deep-index') && el.closest('[data-panel]') === a.closest('[data-panel]')) return; // near: a scroll
        }
        out.push({ view, id, from: here + ' «' + a.textContent.replace(/\s+/g, ' ').trim().slice(0, 30) + '»' });
      });
      return out;
    }, SKIP);
    found.forEach(t => { const k = t.view + '#' + t.id; if (!targets.has(k)) targets.set(k, t); });
  }
  const chips = [...targets.keys()].length;
  ok(chips > 45, `${chips} places the sheet is asked for across the chapters`);
  const audit = await browser.newContext({ ...devices['iPhone 13'] });
  await audit.addInitScript(() => { window.__ready = null; addEventListener('message', e => { if (e.data && e.data.basil === 'peek-ready') window.__ready = e.data; }); });
  const bad = [];
  const list = [...targets.values()];
  const files = { ...await page.evaluate(() => window.BASIL_PAGES.files) };
  await Promise.all([0, 1, 2, 3].map(async k => {
    const p = await audit.newPage();
    watch(p, errs);
    for (let i = k; i < list.length; i += 4) {
      const t = list[i];
      await p.goto(fileUrl(decodeURIComponent(files[t.view]).replace(/^\.?\//, '')) + '?peek=1#' + encodeURIComponent(t.id), { waitUntil: 'load' });
      await p.waitForFunction(() => window.__ready, null, { timeout: 8000 }).catch(() => {});
      const r = await inFrame(p.mainFrame());
      const said = await p.evaluate(() => window.__ready);
      if (!(r.has && r.h > 40 && r.inside && !r.stray.length && !r.chrome.length && said && said.title)) bad.push(`${t.view}#${t.id} from ${t.from}: ${JSON.stringify({ ...r, said })}`);
    }
    await p.close();
  }));
  ok(!bad.length, `each of them shows in the sheet with a title, alone${bad.length ? ':\n  ' + bad.slice(0, 8).join('\n  ') : ''}`);
  await audit.close();
  await ctx.close();

  // ---------- a computer: the tools from the home page, a panel on the right ----------
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desk.newPage();
  watch(dp, errs);
  await dp.goto(fileUrl('index.html'), { waitUntil: 'load' });
  await dp.waitForTimeout(900);
  await dp.evaluate(() => localStorage.setItem('basil-last', JSON.stringify({ view: 'uhod', panel: 'свет', sub: 'Свет' })));
  const keep = await state(dp);
  const tools = await dp.evaluate(() => [...document.querySelectorAll('#tools-home a.tool')].map(a => ({ href: a.getAttribute('href'), title: a.querySelector('b').textContent.trim() })));
  const toolBad = [];
  let geo = null;
  for (const t of tools) {
    await dp.click(`#tools-home a.tool[href="${t.href}"]`);
    if (!(await ready(dp))) { toolBad.push(t.title + ': not ready'); await dp.keyboard.press('Escape'); await shut(dp); continue; }
    await dp.waitForTimeout(500);
    const fr = frameOf(dp);
    const r = fr ? await inFrame(fr) : {};
    const s1 = await sheet(dp);
    if (!geo) geo = await dp.evaluate(() => { const r = document.getElementById('sheet-peek').getBoundingClientRect(); return { left: Math.round(r.left), w: Math.round(r.width), right: Math.round(innerWidth - r.right) }; });
    const controls = fr ? await fr.evaluate(() => document.querySelectorAll('[data-peek] input, [data-peek] select, [data-peek] button, [data-peek] canvas, [data-peek] .lab-tool > *').length) : 0;
    if (!(r.has && r.h > 120 && !r.stray.length && !r.chrome.length && s1.h === t.title && controls > 0)) toolBad.push(`${t.title}: ${JSON.stringify({ ...r, head: s1.h, controls })}`);
    await dp.click('#sheet-peek [data-close]');
    await shut(dp);
  }
  ok(!toolBad.length, `all ${tools.length} tools open in the sheet, under their own name, with their controls${toolBad.length ? ':\n  ' + toolBad.join('\n  ') : ''}`);
  ok(geo && geo.w >= 560 && geo.w <= 640 && geo.right <= 1 && geo.left > 700, 'on a computer the sheet is a panel on the right, the page beside it ' + JSON.stringify(geo));
  await dp.waitForTimeout(300);
  const after = await state(dp);
  // (the page scrolled to each tile: the clicks did that)
  ok(after.last === keep.last && after.pos === keep.pos && after.url === keep.url && !after.peekStep, '«Продолжить» and the reading places stay as they were after the tools, no step left in the history ' + JSON.stringify([keep, after].map(x => ({ ...x, url: x.url.replace(/^.*\//, '') }))));
  // a calculator works in the sheet: its answer follows its input
  await dp.click('#tools-home a.tool[href="udobreniya.html#калькулятор"]');
  if (await ready(dp)) {
    const fr = frameOf(dp);
    const moved = await fr.evaluate(async () => {
      const box = document.querySelector('[data-peek]');
      const before = box.innerText;
      const r = box.querySelector('input[type="range"], input[type="number"], select');
      if (!r) return 'no input';
      if (r.tagName === 'SELECT') r.selectedIndex = (r.selectedIndex + 1) % r.options.length;
      else r.value = String(Number(r.value) + Number(r.step || 1) * 3);
      r.dispatchEvent(new Event('input', { bubbles: true }));
      r.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(res => setTimeout(res, 200));
      return box.innerText !== before;
    });
    ok(moved === true, 'the solution calculator answers in the sheet: ' + moved);
    // the theme reaches the frame
    await dp.evaluate(() => document.getElementById('theme-toggle').click());
    await dp.waitForTimeout(300);
    const th = await dp.evaluate(() => document.documentElement.getAttribute('data-theme'));
    ok((await inFrame(fr)).theme === th, 'the theme switched on the page switches the sheet too: ' + th);
    await dp.click('#sheet-peek [data-close]');
  }
  await desk.close();

  // ---------- the hosting copy: Russian addresses, ?peek on them ----------
  const srv = await server();
  const U = p => srv.base + encodeURI(p);
  const hc = await browser.newContext({ ...devices['Pixel 7'] });
  const hp = await hc.newPage();
  watch(hp, errs);
  await hp.goto(U('/уход?peek=1#deep-vpd'), { waitUntil: 'load' });
  await hp.waitForTimeout(900);
  v = await inFrame(hp.mainFrame());
  ok(v.peek && v.has && v.inside && !v.chrome.length, 'the hosting copy: /уход?peek=1#deep-vpd is the dive alone ' + JSON.stringify(v));
  await hp.goto(U('/урожай#рецепты'), { waitUntil: 'load' });
  await hp.waitForTimeout(1200);
  await hp.evaluate(() => { const c = document.getElementById('r-pistou'); c.open = true; c.querySelector('.rc-sci a').scrollIntoView({ block: 'center', behavior: 'instant' }); });
  await hp.waitForTimeout(400);
  await hp.click('#r-pistou .rc-sci a');
  ok(await ready(hp), 'the hosting copy: the recipe link opens the sheet');
  f = frameOf(hp);
  ok(f && decodeURI(f.url()).endsWith('/вкус?peek=1#deep-letuchest'), 'its frame is /вкус?peek=1#deep-letuchest: ' + (f && decodeURI(f.url()).replace(srv.base, '')));
  await Promise.all([hp.waitForNavigation(), hp.click('#peek-go')]);
  await hp.waitForTimeout(1300);
  const hthere = await hp.evaluate(() => ({ url: decodeURI(location.pathname + location.hash), pill: (document.querySelector('.back-pill') || {}).textContent }));
  ok(hthere.url === '/вкус#deep-letuchest' && /Вернуться/.test(hthere.pill || ''), 'the hosting copy: «Открыть в главе» → ' + hthere.url);
  await hp.goBack();
  await hp.waitForTimeout(1500);
  const hat = await landedAt(hp);
  ok(decodeURI(hp.url()).includes('/урожай') && hat && hat.words.replace(/\u00a0/g, ' ').startsWith(sentence), 'the hosting copy: Back returns to the link\'s sentence: ' + JSON.stringify(hat));
  await hc.close();
  srv.stop();

  await browser.close();
  done(errs);
})().catch(e => { console.error(e); process.exit(1); });
