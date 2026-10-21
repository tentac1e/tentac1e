/* Оформления гида — «Гримуар» и «Друид» — на телефоне и компьютере. Включаются в меню в шапке и запоминаются, а пока
   выключены, их файл (assets/js/skins.js) не грузится; одно сменяется другим сразу, без перезагрузки. Каждая страница
   в оформлении открывается уже тёмной (data-skin и data-theme стоят к DOMContentLoaded), без ошибок и ничего не шире
   экрана: сцена нарисована в шапке каждой главы и на главной, у каждой главы — своя, и касание её меняет и ничего
   не ломает; за страницей — свой фон оформления (склеп, лес), оранжерея и её небо спрятаны, заголовки — его шрифтом.
   «Гримуар»: рисунки — через пиксельный фильтр, подписи в них остаются вне фильтра, экран ЭЛТ выключается в подвале
   и помнит это. «Друид»: рисунки как есть, над сценой — слой свечения, выключателя ЭЛТ нет. Молекула рисуется
   по-своему и крутится пальцем; в шторке «Заглянуть» — то же оформление, но без сцены и фона; с «меньше движения» —
   один неподвижный кадр. Выключили — всё как было, и тема, выбранная луной, вернулась. Проверяет сборку в корне. */
const { playwright, ok, done, watch, fileUrl, FILES, SKINS, inSkin } = require('./lib');

// what each skin shows: the colour of the browser's bar, the canvas behind the page, the face of the titles, pictures
// at the console's pixels, the switch of the CRT, a layer of glow over its scenes
const LOOK = {
  grimoire: { meta: '#0B0910', back: 'psx-crypt', face: /Cormorant Unicase/, pixel: true, crt: true, glow: false },
  druid: { meta: '#0B120D', back: 'psx-forest', face: /Underdog/, pixel: false, crt: false, glow: true }
};
const BACKS = Object.values(LOOK).map(l => l.back);
// what a page in a skin shows, read in it
function state(backs) {
  const root = document.documentElement, vis = el => !!el && getComputedStyle(el).display !== 'none';
  const stages = [...document.querySelectorAll('.psx-stage')];
  const h1 = document.querySelector('[data-view] h1');
  return {
    skin: root.dataset.skin || null, theme: root.dataset.theme || null, dcl: window.__dcl || null,
    loaded: !!window.BasilSkins, on: !!(window.BasilSkins && window.BasilSkins.on),
    heroes: document.querySelectorAll('.ch-hero').length + (document.querySelector('.view-home .hero-art') ? 1 : 0),
    stages: stages.length, drawn: stages.filter(s => s.classList.contains('is-drawn')).length,
    scene: stages.map(s => s.dataset.scene).join(','), of: [...new Set(stages.map(s => s.dataset.skin))].join(','),
    glows: stages.filter(s => s.querySelector('.psx-glow')).length,
    view: (document.querySelector('[data-view]') || { dataset: {} }).dataset.view || null,
    backs: backs.filter(id => document.getElementById(id)),
    field: vis(document.getElementById('leaf-field')), art: vis(document.querySelector('.ch-hero-art')),
    face: h1 ? getComputedStyle(h1).fontFamily : '', wide: document.documentElement.scrollWidth - innerWidth,
    meta: document.querySelector('meta[name="theme-color"]').content, moon: vis(document.getElementById('theme-toggle')),
    crt: vis(document.querySelector('.crt')), crtRow: vis(document.querySelector('.crt-row'))
  };
}
const DCL = () => { document.addEventListener('DOMContentLoaded', () => { const r = document.documentElement; window.__dcl = { skin: r.dataset.skin || null, theme: r.dataset.theme || null, crt: r.classList.contains('no-crt') }; }); };
const pick = async (page, skin) => { await page.click('#skin-btn'); await page.click(`#skin-menu [data-skin="${skin}"]`); };

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  for (const mode of ['phone', 'desktop']) {
    const opts = mode === 'phone' ? { ...devices['iPhone 13 Mini'], deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 900 } };
    const tag = s => `${mode.padEnd(7)} ${s}`;

    // off: the skins' file is never asked for; the menu switches one on, another one in its place, and off again —
    // each remembered, and the moon's own theme back at the end
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(DCL);
    const asked = [];
    ctx.on('request', r => { if (/skins\.js/.test(r.url())) asked.push(r.url()); });
    let page = await ctx.newPage();
    watch(page, errs);
    await page.goto(fileUrl('uhod.html'), { waitUntil: 'load' });
    await page.evaluate(() => localStorage.setItem('basil-theme', '"light"'));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(800);
    let s = await page.evaluate(state, BACKS);
    ok(!s.skin && s.theme === 'light' && !asked.length && !s.loaded && s.field && s.art && s.moon && !s.crtRow, tag(`off: the skins' file is not fetched, the greenhouse and the chapter's art stand ${JSON.stringify(s)}`));
    for (const sk of SKINS) {
      await pick(page, sk);
      await page.waitForTimeout(1500);
      s = await page.evaluate(state, BACKS);
      const saved = await page.evaluate(() => localStorage.getItem('basil-skin')), L = LOOK[sk];
      ok(s.skin === sk && s.theme === 'dark' && asked.length === 1 && s.on && s.stages === s.heroes && s.of === sk && s.backs.join() === L.back && !s.field && !s.art && !s.moon && saved === JSON.stringify(sk) && s.meta === L.meta,
        tag(`the menu switches on ${sk}: dark, its scenes and its ${L.back} in place, the moon aside, remembered ${JSON.stringify({ ...s, asked: asked.length, saved })}`));
    }
    await pick(page, '');
    await page.waitForTimeout(900);
    s = await page.evaluate(state, BACKS);
    ok(!s.skin && s.theme === 'light' && !s.on && !s.stages && !s.backs.length && s.field && s.art && s.moon && await page.evaluate(() => !document.querySelector('.psx-g') || getComputedStyle(document.querySelector('.psx-g')).filter === 'none'),
      tag(`off again: the greenhouse and the art back, the light theme the moon chose ${JSON.stringify(s)}`));
    await page.close();
    await ctx.close();

    for (const sk of SKINS) {
      const L = LOOK[sk];
      const sctx = await browser.newContext(opts);
      await sctx.addInitScript(DCL);
      await inSkin(sctx, sk);

      // every page opens in it: dark before the first paint, its scenes drawn, nothing wider than the screen; every
      // chapter has a scene of its own, and a tap on it changes the picture without an error
      const scenes = new Set();
      for (const f of FILES) {
        page = await sctx.newPage();
        watch(page, errs);
        await page.goto(fileUrl(f), { waitUntil: 'load' });
        await page.waitForTimeout(1300);
        s = await page.evaluate(state, BACKS);
        ok(s.dcl && s.dcl.skin === sk && s.dcl.theme === 'dark' && s.on && s.stages === s.heroes && s.heroes > 0 && s.drawn >= 1 && s.backs.join() === L.back && !s.field && L.face.test(s.face) && s.wide <= 0 && s.glows === (L.glow ? s.stages : 0),
          tag(`${sk} ${f}: in the skin from the start, ${s.stages} scene(s) drawn, its ${L.back} behind ${JSON.stringify({ dcl: s.dcl, stages: s.stages, drawn: s.drawn, heroes: s.heroes, glows: s.glows, wide: s.wide, face: s.face.slice(0, 30) })}`));
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
        ok(s.scene === own && tap.changed, tag(`${sk} ${f}: the scene of its own chapter (${s.scene}), a tap on it goes on drawing ${JSON.stringify(tap)}`));
        // the pictures: through the pixel filter with their captions outside it («Гримуар»), or as they are
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
        if (pics.shown) ok(L.pixel ? pics.done === pics.shown && pics.filtered === pics.shown && !pics.textIn : !pics.filtered,
          tag(`${sk} ${f}: ${pics.shown} drawings ${L.pixel ? "at the console's pixels, their captions sharp" : 'as they are'} ${JSON.stringify(pics)}`));
        await page.close();
      }
      ok(scenes.size === FILES.length, tag(`${sk}: a scene for each page: ${[...scenes].join(', ')}`));

      // the molecule: drawn by the skin, still turned by a finger or the mouse
      page = await sctx.newPage();
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
        ok(mol.colours > 4 && turned !== mol.turn, tag(`${sk}: the molecule is drawn by the skin (${mol.colours} colours) and turns under the mouse`));
      } else ok(false, tag(`${sk} vkus.html: no molecule viewer`));

      // the CRT: off in the footer and remembered for the next page («Гримуар»); no CRT and no switch for it in the rest
      if (L.crt) {
        await page.evaluate(() => document.querySelector('[data-crt]').scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.click('[data-crt]');
        await page.waitForTimeout(200);
        const crt = await page.evaluate(() => ({ off: document.documentElement.classList.contains('no-crt'), shown: getComputedStyle(document.querySelector('.crt')).display, saved: localStorage.getItem('basil-crt'), checked: document.querySelector('[data-crt]').getAttribute('aria-checked') }));
        await page.reload({ waitUntil: 'load' });
        await page.waitForTimeout(400);
        const crt2 = await page.evaluate(() => window.__dcl);
        ok(crt.off && crt.shown === 'none' && crt.saved === 'false' && crt.checked === 'false' && crt2 && crt2.crt, tag(`${sk}: the CRT's lines go off in the footer and stay off ${JSON.stringify({ crt, crt2 })}`));
        await page.evaluate(() => document.querySelector('[data-crt]').click());
      } else {
        s = await page.evaluate(state, BACKS);
        ok(!s.crt && !s.crtRow, tag(`${sk}: no CRT over the page and no switch for it ${JSON.stringify({ crt: s.crt, crtRow: s.crtRow })}`));
      }
      await page.close();

      // the sheet «Заглянуть» shows its place in the skin, without a scene or a background of its own
      page = await sctx.newPage();
      watch(page, errs);
      await page.goto(fileUrl('vkus.html') + '#' + encodeURIComponent('рецепты'), { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      await page.evaluate(() => { const c = document.getElementById('r-bruschetta'); c.open = true; c.querySelector('.rc-sci a').scrollIntoView({ block: 'center', behavior: 'instant' }); });
      await page.waitForTimeout(400);
      await page.click('#r-bruschetta .rc-sci a');
      await page.waitForTimeout(1800);
      const fr = page.frames().find(x => /peek=1/.test(x.url()));
      const inside = fr ? await fr.evaluate(backs => ({ skin: document.documentElement.dataset.skin, stages: document.querySelectorAll('.psx-stage').length, backs: backs.filter(id => document.getElementById(id)) }), BACKS) : null;
      ok(inside && inside.skin === sk && !inside.stages && !inside.backs.length, tag(`${sk}: the sheet's page is in the skin, without scenes or a background of its own ${JSON.stringify(inside)}`));
      await sctx.close();

      // reduced motion: one still frame of the scene, no loop
      const ctx3 = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
      await inSkin(ctx3, sk);
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
      ok(still.drawn && still.same, tag(`${sk}: with reduced motion the scene is one still frame ${JSON.stringify(still)}`));
      await ctx3.close();
    }
  }
  await browser.close();
  done(errs);
})();
