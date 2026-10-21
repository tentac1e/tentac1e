/* Оформление «Гримуар» на телефоне и компьютере: включается свечой в шапке и запоминается, а пока выключено, его файл
   (assets/js/grimoire.js) не грузится. Каждая страница в нём открывается уже тёмной (data-skin и data-theme стоят
   к DOMContentLoaded), без ошибок и ничего не шире экрана: алтарь нарисован в шапке каждой главы и на главной, у каждой
   главы — своя сцена, и касание её меняет и ничего не ломает; склеп за страницей, оранжерея и её небо спрятаны,
   заголовки — шрифтом приставки. Рисунки — через пиксельный фильтр,
   подписи в них остаются вне фильтра; молекула рисуется в манере PS1 и крутится пальцем; экран ЭЛТ выключается
   в подвале и помнит это; в шторке «Заглянуть» — та же тема, но без алтаря и склепа. Выключили — всё как было,
   и тема, выбранная луной, вернулась. Проверяет сборку в корне репозитория. */
const { playwright, ok, done, watch, fileUrl, FILES } = require('./lib');

const ON = () => { try { localStorage.setItem('basil-skin', '"grimoire"'); } catch (e) { /* the theme stays off */ } };
// what a page in the theme shows, read in it
function state() {
  const root = document.documentElement, vis = el => !!el && getComputedStyle(el).display !== 'none';
  const stages = [...document.querySelectorAll('.psx-stage')];
  const h1 = document.querySelector('[data-view] h1');
  return {
    skin: root.dataset.skin || null, theme: root.dataset.theme || null, dcl: window.__dcl || null,
    loaded: !!window.BasilGrimoire, on: !!(window.BasilGrimoire && window.BasilGrimoire.on),
    heroes: document.querySelectorAll('.ch-hero').length + (document.querySelector('.view-home .hero-art') ? 1 : 0),
    stages: stages.length, drawn: stages.filter(s => s.classList.contains('is-drawn')).length,
    scene: stages.map(s => s.dataset.scene).join(','), view: (document.querySelector('[data-view]') || { dataset: {} }).dataset.view || null,
    crypt: !!document.getElementById('psx-crypt'), field: vis(document.getElementById('leaf-field')), art: vis(document.querySelector('.ch-hero-art')),
    face: h1 ? getComputedStyle(h1).fontFamily : '', wide: document.documentElement.scrollWidth - innerWidth,
    meta: document.querySelector('meta[name="theme-color"]').content, moon: vis(document.getElementById('theme-toggle'))
  };
}

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  for (const mode of ['phone', 'desktop']) {
    const opts = mode === 'phone' ? { ...devices['iPhone 13 Mini'], deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 900 } };
    const tag = s => `${mode.padEnd(7)} ${s}`;

    // off: the theme's file is never asked for; the candle switches it on, and it is remembered
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const r = document.documentElement; window.__dcl = { skin: r.dataset.skin || null, theme: r.dataset.theme || null, crt: r.classList.contains('no-crt') }; }); });
    const asked = [];
    ctx.on('request', r => { if (/grimoire\.js/.test(r.url())) asked.push(r.url()); });
    let page = await ctx.newPage();
    watch(page, errs);
    await page.goto(fileUrl('uhod.html'), { waitUntil: 'load' });
    await page.evaluate(() => localStorage.setItem('basil-theme', '"light"'));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(800);
    let s = await page.evaluate(state);
    ok(!s.skin && s.theme === 'light' && !asked.length && !s.loaded && s.field && s.art && s.moon, tag(`off: the theme's file is not fetched, the greenhouse and the chapter's art stand ${JSON.stringify(s)}`));
    await page.click('#skin-toggle');
    await page.waitForTimeout(1500);
    s = await page.evaluate(state);
    const saved = await page.evaluate(() => localStorage.getItem('basil-skin'));
    ok(s.skin === 'grimoire' && s.theme === 'dark' && asked.length === 1 && s.on && s.stages === s.heroes && s.crypt && !s.field && !s.art && !s.moon && saved === '"grimoire"' && s.meta === '#0B0910',
      tag(`the candle switches it on: dark, the scenes in place, the moon aside, remembered ${JSON.stringify({ ...s, asked: asked.length, saved })}`));
    await page.close();

    // every page opens in it: dark before the first paint, its scenes drawn, nothing wider than the screen;
    // every chapter has a scene of its own, and a tap on it changes the picture without an error
    const scenes = new Set();
    for (const f of FILES) {
      page = await ctx.newPage();
      watch(page, errs);
      await page.goto(fileUrl(f), { waitUntil: 'load' });
      await page.waitForTimeout(1300);
      s = await page.evaluate(state);
      ok(s.dcl && s.dcl.skin === 'grimoire' && s.dcl.theme === 'dark' && s.on && s.stages === s.heroes && s.heroes > 0 && s.drawn >= 1 && s.crypt && !s.field && /Tiny5/.test(s.face) && s.wide <= 0,
        tag(`${f}: in the theme from the start, ${s.stages} altar(s) drawn, the crypt behind ${JSON.stringify({ dcl: s.dcl, stages: s.stages, drawn: s.drawn, heroes: s.heroes, wide: s.wide })}`));
      const own = f === 'index.html' ? 'glavnaya' : s.view;
      scenes.add(s.scene);
      const tap = await page.evaluate(async () => {
        const st = document.querySelector('.psx-stage'), cv = st.querySelector('canvas'), r = st.getBoundingClientRect();
        const grab = () => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 7) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; };
        const at = { clientX: r.left + r.width * 0.6, clientY: r.top + Math.min(r.height, 250) * 0.45, bubbles: true, pointerId: 1 };
        const a = grab();
        st.dispatchEvent(new PointerEvent('pointerdown', at));
        dispatchEvent(new PointerEvent('pointerup', at));
        await new Promise(res => setTimeout(res, 700));
        return { changed: a !== grab() };
      });
      ok(s.scene === own && tap.changed, tag(`${f}: the scene of its own chapter (${s.scene}), a tap on it goes on drawing ${JSON.stringify(tap)}`));
      // the pictures: through the pixel filter, their captions outside it
      const pics = await page.evaluate(async () => {
        const list = [...document.querySelectorAll('.panel.is-active [data-ill], [data-view] > .wrap [data-ill]')].slice(0, 8);
        list.forEach(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await new Promise(r => setTimeout(r, 900));
        const svgs = [...document.querySelectorAll('svg.ill')].filter(s => s.getBoundingClientRect().width);
        const done = svgs.filter(s => s.dataset.psx && s.querySelector(':scope > .psx-g'));
        const filtered = done.filter(s => /url\(/.test(getComputedStyle(s.querySelector(':scope > .psx-g')).filter));
        const textIn = done.filter(s => s.querySelector('.psx-g text')).length;
        return { shown: svgs.length, done: done.length, filtered: filtered.length, textIn };
      });
      if (pics.shown) ok(pics.done === pics.shown && pics.filtered === pics.shown && !pics.textIn, tag(`${f}: ${pics.shown} drawings at the console's pixels, their captions sharp ${JSON.stringify(pics)}`));
      await page.close();
    }

    ok(scenes.size === FILES.length, tag(`a scene for each page: ${[...scenes].join(', ')}`));

    // the molecule: drawn by the theme, still turned by a finger or the mouse
    page = await ctx.newPage();
    watch(page, errs);
    await page.goto(fileUrl('vkus.html') + '#' + encodeURIComponent('молекулы'), { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const mol = await page.evaluate(async () => {
      const cv = [...document.querySelectorAll('canvas')].find(c => c.molView);
      if (!cv) return null;
      cv.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise(r => setTimeout(r, 900));
      const x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height).data;
      const colours = new Set();
      for (let i = 0; i < d.length; i += 4 * 97) colours.add(d[i] >> 4 << 8 | d[i + 1] >> 4 << 4 | d[i + 2] >> 4);
      const r = cv.getBoundingClientRect();
      return { colours: colours.size, x: r.left + r.width / 2, y: r.top + r.height / 2, turn: JSON.stringify(cv.molView.turn) };
    });
    if (mol) {
      await page.mouse.move(mol.x, mol.y);
      await page.mouse.down();
      await page.mouse.move(mol.x + 80, mol.y + 30, { steps: 6 });
      await page.mouse.up();
      const turned = await page.evaluate(() => JSON.stringify([...document.querySelectorAll('canvas')].find(c => c.molView).molView.turn));
      ok(mol.colours > 4 && turned !== mol.turn, tag(`the molecule is drawn by the theme (${mol.colours} colours) and turns under the mouse`));
    } else ok(false, tag('vkus.html: no molecule viewer'));

    // the CRT: off in the footer, remembered for the next page
    await page.evaluate(() => document.querySelector('[data-crt]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.click('[data-crt]');
    await page.waitForTimeout(200);
    const crt = await page.evaluate(() => ({ off: document.documentElement.classList.contains('no-crt'), shown: getComputedStyle(document.querySelector('.crt')).display, saved: localStorage.getItem('basil-crt'), checked: document.querySelector('[data-crt]').getAttribute('aria-checked') }));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(400);
    const crt2 = await page.evaluate(() => window.__dcl);
    ok(crt.off && crt.shown === 'none' && crt.saved === 'false' && crt.checked === 'false' && crt2 && crt2.crt, tag(`the CRT's lines go off in the footer and stay off ${JSON.stringify({ crt, crt2 })}`));
    await page.evaluate(() => document.querySelector('[data-crt]').click());

    // off again: everything as it was, and the moon's own choice back
    await page.evaluate(() => scrollTo(0, 0));
    await page.click('#skin-toggle');
    await page.waitForTimeout(900);
    s = await page.evaluate(state);
    ok(!s.skin && s.theme === 'light' && !s.on && !s.stages && !s.crypt && s.field && s.art && s.moon && await page.evaluate(() => !document.querySelector('.psx-g') || getComputedStyle(document.querySelector('.psx-g')).filter === 'none'),
      tag(`off again: the greenhouse and the art back, the light theme the moon chose ${JSON.stringify(s)}`));
    await page.close();
    await ctx.close();

    // the sheet «Заглянуть» shows its place in the theme, without an altar or a crypt of its own
    const ctx2 = await browser.newContext(opts);
    await ctx2.addInitScript(ON);
    page = await ctx2.newPage();
    watch(page, errs);
    await page.goto(fileUrl('vkus.html') + '#' + encodeURIComponent('рецепты'), { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const c = document.getElementById('r-bruschetta'); c.open = true; c.querySelector('.rc-sci a').scrollIntoView({ block: 'center', behavior: 'instant' }); });
    await page.waitForTimeout(400);
    await page.click('#r-bruschetta .rc-sci a');
    await page.waitForTimeout(1800);
    const fr = page.frames().find(x => /peek=1/.test(x.url()));
    const inside = fr ? await fr.evaluate(() => ({ skin: document.documentElement.dataset.skin, stages: document.querySelectorAll('.psx-stage').length, crypt: !!document.getElementById('psx-crypt') })) : null;
    ok(inside && inside.skin === 'grimoire' && !inside.stages && !inside.crypt, tag(`the sheet's page is in the theme, without scenes of its own ${JSON.stringify(inside)}`));
    await ctx2.close();

    // reduced motion: one still frame of the altar, no loop
    const ctx3 = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
    await ctx3.addInitScript(ON);
    page = await ctx3.newPage();
    watch(page, errs);
    await page.goto(fileUrl('posadka.html'), { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const still = await page.evaluate(async () => {
      const cv = document.querySelector('.psx-stage canvas');
      const grab = () => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 13) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; };
      const a = grab();
      await new Promise(r => setTimeout(r, 1200));
      return { drawn: document.querySelector('.psx-stage').classList.contains('is-drawn'), same: a === grab() };
    });
    ok(still.drawn && still.same, tag(`with reduced motion the altar is one still frame ${JSON.stringify(still)}`));
    await ctx3.close();
  }
  await browser.close();
  done(errs);
})();
