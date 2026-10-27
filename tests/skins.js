/* Оформления гида — «Гримуар» и «Друид» — на телефоне и компьютере. Включаются в меню в шапке и запоминаются, а пока
   выключены, их файл (assets/js/skins.js) не грузится; одно сменяется другим сразу, без перезагрузки. Каждая страница
   в оформлении открывается уже тёмной (data-skin и data-theme стоят к DOMContentLoaded), без ошибок и ничего не шире
   экрана: сцена нарисована в шапке каждой главы, у каждой главы — своя; на главной и в каждой главе сцена — фон шапки
   за текстом, без рамки, её не крутят и не касаются, а она идёт сама; за страницей — свой фон оформления (склеп,
   роща), оранжерея и её небо спрятаны, заголовки — его шрифтом.
   «Гримуар»: рисунки — через пиксельный фильтр, подписи в них остаются вне фильтра, экран ЭЛТ выключается в подвале
   и помнит это. «Друид»: рисунки как есть, над сценой — слой свечения, выключателя ЭЛТ нет. Молекула рисуется
   по-своему и крутится пальцем; в шторке «Заглянуть» — то же оформление, но без сцены и фона; с «меньше движения» —
   один неподвижный кадр. Надписи гида — словами оформления, у каждого своими, а место чтения запоминается по обычным.
   Выключили — всё как было: слова, и тема, выбранная луной. Проверяет сборку в корне. */
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
    heroes: document.querySelectorAll('.ch-hero').length + (document.querySelector('.view-home .hero') ? 1 : 0),
    // the scene behind the head (the home page's hero, a chapter's head): no frame, the art of the page aside, nothing
    // to touch
    backdrop: (() => { const st = document.querySelector('.view-home .hero > .psx-stage, .ch-hero > .psx-stage'), art = document.querySelector('.view-home .hero-art, .ch-hero-art'); return st ? { on: st.classList.contains('is-backdrop'), events: getComputedStyle(st).pointerEvents, art: art ? getComputedStyle(art).display : null, frame: getComputedStyle(st.parentNode).borderTopWidth } : null; })(),
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
// some labels of the guide's frame as they read now, how many stand in a skin's words, what the skin calls the contents
const words = () => ({
  labels: ['.brand small', '.footer .hand', '.ch-hero .eyebrow', '.panel.is-active .deep-zone-label > span', '.panel.is-active .faq-here h3'].map(q => { const e = document.querySelector(q); return e ? e.textContent.trim() : null; }),
  marked: document.querySelectorAll('[data-plain]').length,
  say: window.BasilSkins && window.BasilSkins.on ? window.BasilSkins.say('Оглавление') : 'Оглавление'
});
// the first words the reading place keeps for the block of the line «Для любопытных» brought to the top of the screen
// (after a key pressed: it keeps only a place the reader went to)
const sigHere = async page => {
  await page.keyboard.press('Shift');
  // the line goes up the screen until the place is its block (where it lands depends on the heights over it)
  for (let off = 200; off > -40; off -= 4) {
    await page.evaluate(off => { const el = document.querySelector('.panel.is-active .deep-zone-label'); scrollTo({ top: el.getBoundingClientRect().top + scrollY - off, behavior: 'instant' }); }, off);
    await page.waitForTimeout(120);
    const sig = await page.evaluate(() => { dispatchEvent(new Event('pagehide')); return ((JSON.parse(localStorage.getItem('basil-pos') || '{}').uhod) || {}).sig || null; });
    if (/любопытных/.test(sig || '')) return sig;
  }
  return null;
};
// in the page: the icons of the sprite as the page has them now — how many symbols, how many of them a skin's own, what
// one of them is drawn with (pixels of «Гримуар»: paths with no stroke; the cuts of «Друид»: a groove under them); the
// frame of a window
const icons = () => {
  const syms = [...document.querySelectorAll('symbol[id^="i-"]')], book = document.getElementById('i-book');
  const card = document.querySelector('.card, .pane, .deep');
  return {
    n: syms.length, own: syms.filter(x => x.dataset.skinIco).length, box: book.getAttribute('viewBox'),
    pixels: book.querySelectorAll('path[style*="stroke:none"]').length, groove: !!book.querySelector('.ico-groove'), body: book.innerHTML.length,
    frame: card ? getComputedStyle(card).borderImageSource.slice(0, 40) : '',
    brand: [...document.querySelectorAll('.brand svg')].map(x => x.dataset.skinIco || '').join()
  };
};
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
    const plain = await page.evaluate(words), plainSig = await sigHere(page), plainIco = await page.evaluate(icons);
    const said = {};
    for (const sk of SKINS) {
      await pick(page, sk);
      await page.waitForTimeout(1500);
      s = await page.evaluate(state, BACKS);
      const saved = await page.evaluate(() => localStorage.getItem('basil-skin')), L = LOOK[sk];
      ok(s.skin === sk && s.theme === 'dark' && asked.length === 1 && s.on && s.stages === s.heroes && s.of === sk && s.backs.join() === L.back && !s.field && !s.art && !s.moon && saved === JSON.stringify(sk) && s.meta === L.meta,
        tag(`the menu switches on ${sk}: dark, its scenes and its ${L.back} in place, the moon aside, remembered ${JSON.stringify({ ...s, asked: asked.length, saved })}`));
      // its own words for the frame of the guide, each different from the plain one and from the other skin's; the
      // place of reading keeps going by the plain words
      const w = await page.evaluate(words), sig = await sigHere(page);
      said[sk] = w;
      ok(w.labels.every((t, i) => t && t !== plain.labels[i] && SKINS.every(o => o === sk || !said[o] || said[o].labels[i] !== t)) && w.marked >= w.labels.length && w.say !== plain.say && sig && sig === plainSig,
        tag(`${sk}: the guide's labels in its own words, the place of reading by the plain ones ${JSON.stringify({ plain: plain.labels, w: w.labels, say: w.say, sig, plainSig })}`));
      // its own icons in every symbol of the sprite (02-icons.js) and its own frame on the windows (26-skin-art.css)
      const ic = await page.evaluate(icons);
      ok(ic.own === ic.n && ic.n > 50 && ic.brand === sk && (sk === 'grimoire' ? ic.box === '0 0 16 16' && ic.pixels > 2 && !ic.groove : ic.box === '0 0 24 24' && ic.groove && !ic.pixels) && /svg/.test(ic.frame),
        tag(`${sk}: its own icons in all ${ic.n} symbols, its own mark of the guide and its own frame on the windows ${JSON.stringify(ic)}`));
    }
    await pick(page, '');
    await page.waitForTimeout(900);
    s = await page.evaluate(state, BACKS);
    ok(!s.skin && s.theme === 'light' && !s.on && !s.stages && !s.backs.length && s.field && s.art && s.moon && await page.evaluate(() => !document.querySelector('.psx-g') || getComputedStyle(document.querySelector('.psx-g')).filter === 'none'),
      tag(`off again: the greenhouse and the art back, the light theme the moon chose ${JSON.stringify(s)}`));
    const backIco = await page.evaluate(icons);
    ok(!backIco.own && !backIco.brand && backIco.box === plainIco.box && backIco.body === plainIco.body && backIco.frame === plainIco.frame, tag(`off again: the plain icons back ${JSON.stringify(backIco)}`));
    const back = await page.evaluate(words);
    ok(JSON.stringify(back.labels) === JSON.stringify(plain.labels) && !back.marked, tag(`off again: the plain words back ${JSON.stringify(back)}`));
    await page.close();
    await ctx.close();

    for (const sk of SKINS) {
      const L = LOOK[sk];
      const sctx = await browser.newContext(opts);
      await sctx.addInitScript(DCL);
      await inSkin(sctx, sk);

      // every page opens in it: dark before the first paint, its scenes drawn, nothing wider than the screen; every
      // chapter has a scene of its own, the background of its head, going on by itself
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
        const goes = await page.evaluate(async () => {
          const st = document.querySelector('.psx-stage'), cv = st.querySelector('canvas');
          const grab = () => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 4 * 7) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; };
          const a = grab();
          await new Promise(res => setTimeout(res, 700));
          return { changed: a !== grab() };
        });
        ok(s.scene === own && goes.changed && s.backdrop && s.backdrop.on && s.backdrop.events === 'none' && s.backdrop.art === 'none' && parseFloat(s.backdrop.frame) === 0,
          tag(`${sk} ${f}: the scene of its own page (${s.scene}) is the background of its head — no frame, the page's art aside, not to be touched — and goes on by itself ${JSON.stringify({ ...s.backdrop, ...goes })}`));
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

      // «Друид»: the grove behind the page is still pictures (a stump, a log, a branch, ivy, ferns) and canvases where
      // something moves — no CSS animation in it (a running one would restyle the page at every frame): the pictures
      // drawn, fireflies lit, the lianas swaying, the runes aglow, and the layer standing where it is while the page
      // scrolls under it
      if (sk === 'druid') {
        page = await sctx.newPage();
        watch(page, errs);
        await page.goto(fileUrl('uhod.html'), { waitUntil: 'load' });
        await page.waitForTimeout(1500);
        const grove = await page.evaluate(async () => {
          const el = document.getElementById('psx-forest'), cv = el.querySelector('canvas.fly');
          const lit = (c = cv) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; };
          const hash = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 3; i < d.length; i += 16) h = (h * 31 + d[i]) >>> 0; return h; };
          const vines = el.querySelector('canvas.gp-branch'), runes = el.querySelector('canvas.gp-stump');
          const a = lit(), v0 = hash(vines), top0 = el.getBoundingClientRect().top;
          scrollTo({ top: 1500, behavior: 'instant' });
          await new Promise(r => setTimeout(r, 1000));
          return { pictures: [...el.querySelectorAll('.tw img')].filter(i => i.complete && i.naturalWidth).length, anims: el.getAnimations({ subtree: true }).length, lit: a, lit2: lit(),
            sway: v0 !== hash(vines), leaves: lit(vines), runes: lit(runes), top0, top1: el.getBoundingClientRect().top, fixed: getComputedStyle(el).position };
        });
        ok(grove.pictures === 5 && !grove.anims && grove.lit > 0 && grove.lit2 > 0 && grove.sway && grove.leaves > 0 && grove.runes > 0 && grove.top0 === 0 && grove.top1 === 0 && grove.fixed === 'fixed',
          tag(`druid: the grove behind the page — five still pictures, fireflies lit, lianas swaying, runes aglow, no CSS animation, the layer stands while the page scrolls ${JSON.stringify(grove)}`));
        // with «less motion» a few fireflies stand lit, the lianas hang at rest, the runes glow evenly — nothing moves
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const still = await page.evaluate(async () => {
          const cvs = [...document.querySelectorAll('#psx-forest canvas')];
          const look = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0, n = 0; for (let i = 3; i < d.length; i += 4) { if (d[i] > 40) n++; h = (h * 31 + d[i]) >>> 0; } return [h, n]; };
          await new Promise(r => setTimeout(r, 300));
          const a = cvs.map(look);
          await new Promise(r => setTimeout(r, 1200));
          return { lit: a[0][1], all: a.every(x => x[1] > 0), same: cvs.every((cv, i) => look(cv)[0] === a[i][0]) };
        });
        ok(still.lit > 0 && still.all && still.same, tag(`druid: with reduced motion the grove stands still: fireflies lit, lianas at rest, runes aglow ${JSON.stringify(still)}`));
        await page.close();
      }

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

      // «Друид»: the chosen chip and segment wear a vine; no rune before the word, and no room kept for one — the
      // word of every chip stands in its middle (a rune there once lay over the first letter in the models)
      if (sk === 'druid') {
        await page.goto(fileUrl('vkus.html') + '#' + encodeURIComponent('кухня'), { waitUntil: 'load' });
        await page.waitForTimeout(800);
        const vine = await page.evaluate(async () => {
          for (const id of ['lab-ht-t', 'lab-an-q']) {
            document.querySelector(`.lab-tool:has(#${id}), .lab-tool[data-lab="${id === 'lab-ht-t' ? 'heat' : 'anthocyanin'}"]`).scrollIntoView({ block: 'center', behavior: 'instant' });
            await new Promise(r => setTimeout(r, 500));
          }
          const all = [...document.querySelectorAll('#lab-ht-t button, #lab-an-q .chip')];
          const chosen = all.filter(b => b.getAttribute('aria-pressed') === 'true');
          const off = all.map(b => {
            const cs = getComputedStyle(b), mark = getComputedStyle(b, '::before').content;
            const rg = document.createRange();
            rg.selectNodeContents(b);
            const t = rg.getBoundingClientRect(), r = b.getBoundingClientRect();
            return Math.max(Math.abs(parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), Math.abs((t.left + t.right) / 2 - (r.left + r.right) / 2)) + (mark !== 'none' && mark !== 'normal' ? 99 : 0);
          });
          return { n: all.length, chosen: chosen.length, vined: chosen.filter(b => /svg/.test(getComputedStyle(b).borderImageSource)).length, off: Math.max(...off).toFixed(1) };
        });
        ok(vine.n >= 8 && vine.chosen === 2 && vine.vined === 2 && +vine.off <= 1.5, tag(`druid: a vine round the chosen chip and segment, the word in the middle and no rune before it ${JSON.stringify(vine)}`));
      }

      // the CRT: off in the footer and remembered for the next page («Гримуар»); no CRT and no switch for it in the rest
      if (L.crt) {
        await page.evaluate(() => document.querySelector('[data-crt]').scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.click('[data-crt]');
        await page.waitForTimeout(200);
        const crt = await page.evaluate(() => ({ off: document.documentElement.classList.contains('no-crt'), shown: getComputedStyle(document.querySelector('.crt')).display, saved: localStorage.getItem('basil-crt'), checked: document.querySelector('[data-crt]').getAttribute('aria-checked') }));
        // the next page with what the switch saved: off before the first paint. Not by a reload — Chromium here now
        // and then loses a write to localStorage of a file:// page on its way to the next one (never over http)
        const next = await sctx.newPage();
        await next.addInitScript(v => localStorage.setItem('basil-crt', v), crt.saved);
        await next.goto(fileUrl('vkus.html'), { waitUntil: 'load' });
        const crt2 = await next.evaluate(() => window.__dcl);
        await next.close();
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
