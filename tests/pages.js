/* Сборка в корне репозитория (ссылки вида sorta.html), открытая как файлы:
   каждая страница, переходы между главами, поиск, глубина чтения, «Продолжить», ленивые модели;
   карта кода CODE-MAP.md не врёт (функции на своих строках, события и ключи есть в коде).
   node tests/pages.js */
const fs = require('fs');
const path = require('path');
const { playwright, ok, done, watch, FILES, fileUrl, ROOT } = require('./lib');

// CODE-MAP.md, written by the build: every function it names stands on its line, every event and key is in the code
function codeMap() {
  const map = fs.readFileSync(path.join(ROOT, 'CODE-MAP.md'), 'utf8');
  const wrong = [];
  let n = 0;
  for (const line of map.split('\n')) {
    const m = line.match(/^- `((?:src|scripts)\/[^`]+\.js)`[^:]*: (.+)$/);
    if (!m) continue;
    const src = fs.readFileSync(path.join(ROOT, m[1]), 'utf8').split('\n');
    for (const [, name, ln] of m[2].matchAll(/`([A-Za-z_$][\w$]*)` (\d+)/g)) {
      n++;
      const at = src[+ln - 1] || '';
      if (!new RegExp(`(?:function|const)\\s+${name.replace(/\$/g, '\\$')}(?![\\w$])`).test(at)) wrong.push(`${m[1]}:${ln} ${name}`);
    }
  }
  const code = [...fs.readdirSync(path.join(ROOT, 'src'), { recursive: true })].filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n');
  const named = [...map.matchAll(/^- `(basil[:-][a-z-]+)`/gm)].map(x => x[1]);
  const missing = named.filter(k => !code.includes(`'${k}'`));
  return { n, wrong, named: named.length, missing };
}

(async () => {
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const errs = [];
  const page = await ctx.newPage();
  watch(page, errs);
  const at = () => page.url().replace(/^.*\//, '');

  for (const f of FILES) {
    await page.goto(fileUrl(f), { waitUntil: 'load' });
    await page.waitForTimeout(250);
    const st = await page.evaluate(() => ({
      t: document.title, views: document.querySelectorAll('[data-view]').length,
      active: !!document.querySelector('[data-view].is-active'),
      cur: (document.querySelector('#nav a[aria-current="page"]') || {}).textContent || '',
      panel: !!document.querySelector('.panel.is-active') || !document.querySelector('.panel'),
      // a chapter with pictures, or with models outside a closed «Глубже», brings its files with the page (defer
      // tags written by the build); any other file of models is fetched only when a model comes near the screen
      own: !!document.querySelector('script[src*="labs/"][defer]'),
      shows: !!document.querySelector('[data-view] [data-ill]') || [...document.querySelectorAll('.lab-tool')].some(e => !e.closest('details:not([open])')),
      labsTag: !!document.querySelector('script[src*="labs/"]:not([defer])'),
      near: [...document.querySelectorAll('.panel.is-active .lab-tool, .panel.is-active [data-ill], [data-view]:not(:has(.panel)) .lab-tool, [data-view]:not(:has(.panel)) [data-ill]')].some(e => { const r = e.getBoundingClientRect(); return r.width && r.top < innerHeight + 400; }),
      bad: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => !['#main', '#top'].includes(h) && !document.getElementById(h.slice(1)) && !document.querySelector(`[data-view="${h.slice(1)}"]`)).slice(0, 5)
    }));
    ok(st.views === 1 && st.active && st.panel && (!st.labsTag || st.near) && (!st.own || st.shows) && !st.bad.length && / — Гид по базилику$|^Гид по базилику$/.test(st.t),
      `${f}: «${st.t}» | nav «${st.cur}» | dangling ${JSON.stringify(st.bad)}${st.labsTag && !st.near ? ' | models loaded with nothing near' : ''}${st.own && !st.shows ? ' | files brought for nothing shown' : ''}`);
  }

  // the catalogue: every variety in exactly one type, a tap opens a type under its row, a filter keeps the matches
  await page.goto(fileUrl('sorta.html'), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const types = await page.evaluate(() => {
    const B = window.BASIL;
    return {
      lost: B.VARIETIES.filter(v => B.VARIETY_TYPES.filter(t => t.id === v.type).length !== 1).map(v => v.name),
      empty: B.VARIETY_TYPES.filter(t => !B.VARIETIES.some(v => v.type === t.id)).map(t => t.id),
      cards: document.querySelectorAll('#variety-grid .vtype').length, types: B.VARIETY_TYPES.length,
      rows: document.querySelectorAll('#variety-grid .variety').length, total: B.VARIETIES.length
    };
  });
  ok(!types.lost.length && !types.empty.length && types.cards === types.types && types.rows === types.total, 'variety types ' + JSON.stringify(types));
  await page.click('.vtype[data-t="purple"] .vt-toggle');
  await page.waitForTimeout(500);
  const opened = await page.evaluate(() => {
    const p = document.getElementById('vt-p-purple'), c = document.querySelector('.vtype[data-t="purple"]');
    return { shown: !p.hidden, below: p.getBoundingClientRect().top >= c.getBoundingClientRect().bottom - 1, drawn: [...p.querySelectorAll('[data-ill]')].every(e => e.dataset.drawn), open: [...document.querySelectorAll('.vt-panel')].filter(x => !x.hidden).length, exp: c.querySelector('.vt-toggle').getAttribute('aria-expanded') };
  });
  ok(opened.shown && opened.below && opened.drawn && opened.open === 1 && opened.exp === 'true', 'a type opens under its row ' + JSON.stringify(opened));
  await page.click('.vtype[data-t="genovese"] .vt-toggle');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.getElementById('vt-p-purple').hidden && !document.getElementById('vt-p-genovese').hidden), 'one type open at a time');
  await page.click('#variety-filters [data-filter="purple"]');
  await page.waitForTimeout(400);
  const fl = await page.evaluate(() => ({
    want: window.BASIL.VARIETIES.filter(v => v.tags.includes('purple')).map(v => v.name).sort().join(','),
    got: [...document.querySelectorAll('#variety-grid .variety')].filter(e => e.offsetParent).map(e => e.querySelector('.v-name').textContent).sort().join(','),
    count: document.getElementById('variety-count').textContent
  }));
  ok(fl.want === fl.got && /из 26/.test(fl.count), 'filter shows the matching varieties ' + JSON.stringify(fl));

  await page.goto(fileUrl('index.html#udobreniya-plan'), { waitUntil: 'load' });
  await page.waitForTimeout(700);
  ok(/udobreniya\.html#%D0%BF%D0%BB%D0%B0%D0%BD$/.test(page.url()) && await page.evaluate(() => document.getElementById('план').classList.contains('is-active')), 'old index.html#udobreniya-plan → ' + at());

  await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const kinds = await page.evaluate(() => {
    const s = window.BASIL_PAGES.stats;
    return { shown: [...document.querySelectorAll('#sh-kinds li b')].map(b => b.textContent).join(','), labs: s.labs, deep: s.deep };
  });
  ok(kinds.shown.split(',').includes(String(kinds.labs)) && kinds.shown.split(',').includes(String(kinds.deep)), 'home science counters ' + JSON.stringify(kinds));
  const hrefs = await page.evaluate(() => ({ tools: [...document.querySelectorAll('#tools-home a')].slice(0, 3).map(a => a.getAttribute('href')), ch: [...document.querySelectorAll('#chapters .toc-link')].slice(0, 2).map(a => a.getAttribute('href')) }));
  // «Мой базилик» lives on the home page itself; the other tools are on their chapters' pages
  ok(hrefs.tools.every(h => /\.html/.test(h) || h === '#moy') && hrefs.tools.some(h => /\.html/.test(h)) && hrefs.ch.every(h => /\.html$/.test(h)), 'home links point to pages ' + JSON.stringify(hrefs));

  // search from home into «Ещё глубже» on another page
  await page.keyboard.press('/');
  await page.waitForTimeout(300);
  await page.keyboard.type('Эстафета протонов');
  await page.waitForTimeout(500);
  const first = await page.evaluate(() => { const a = document.querySelector('.sr-item'); return a ? a.getAttribute('href') : null; });
  ok(first === 'udobreniya.html#deep-ec-glubzhe', 'search result url ' + first);
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  await page.waitForTimeout(1200);
  const dp = await page.evaluate(() => { const d = document.querySelector('#deep-ec .deeper'); return { deeper: d.open, deep: d.closest('details.deep').open, top: Math.round(document.getElementById('deep-ec-glubzhe').getBoundingClientRect().top) }; });
  ok(dp.deeper && dp.deep && dp.top > 0 && dp.top < 400, 'landed in «Ещё глубже» ' + JSON.stringify(dp));

  ok(await page.evaluate(() => !!document.querySelector('#deep-ec .deeper.is-found')), 'the place found lights up');

  // search understands word forms, the Latin keyboard, typos and synonyms; results come in groups
  await page.goto(fileUrl('uhod.html'), { waitUntil: 'load' });
  await page.keyboard.press('/');
  await page.waitForTimeout(400);
  const find = async q => {
    await page.fill('#search-input', q);
    await page.waitForTimeout(250);
    return page.evaluate(() => ({
      titles: [...document.querySelectorAll('.sr-item b')].map(b => b.textContent.trim()),
      marks: [...document.querySelectorAll('.sr-item mark')].map(m => m.textContent.toLowerCase()),
      groups: [...document.querySelectorAll('.sr-gh span:first-child')].map(g => g.textContent),
      note: (document.querySelector('.sr-note') || {}).textContent || ''
    }));
  };
  const yl = await find('желтые листья');
  ok(yl.titles.includes('Желтеют нижние листья') && yl.marks.includes('желтеют') && yl.groups.includes('Проблемы и симптомы') && yl.groups.includes('Разделы'), 'word forms: «желтые листья» finds «желтеют» ' + JSON.stringify(yl.groups));
  const lv = await find('листьев');
  ok(lv.marks.includes('листья') && lv.marks.includes('листьев'), 'one stem, many forms: «листьев» marks «листья»');
  const kb = await find('gjkbd');
  ok(/«полив»/.test(kb.note) && kb.titles.includes('Полив'), 'Latin keyboard: «gjkbd» → «полив» ' + kb.note);
  const ty = await find('пикеровка');
  ok(/«пикировка»/.test(ty.note) && ty.titles.some(t => /^Пикировка/.test(t)), 'typo: «пикеровка» → «пикировка» ' + ty.note);
  const sy = await find('фитолампа');
  ok(sy.marks.some(m => m.startsWith('досветк')), 'synonym: «фитолампа» finds «досветка»');
  const mo = await page.evaluate(() => { const b = document.querySelector('.sr-more'); if (!b) return null; const n = document.querySelectorAll('.sr-item').length; b.click(); return [n, document.querySelectorAll('.sr-item').length]; });
  ok(mo && mo[1] > mo[0], '«Ещё» opens the rest of a group ' + JSON.stringify(mo));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // search action on another page: element card opens
  await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
  await page.keyboard.press('/');
  await page.waitForTimeout(300);
  await page.keyboard.type('Молибден');
  await page.waitForTimeout(500);
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  await page.waitForTimeout(900);
  const el = await page.evaluate(() => (document.querySelector('.el-detail') || {}).textContent || '');
  ok(/udobreniya\.html#%D1%8D%D0%BB%D0%B5%D0%BC%D0%B5%D0%BD%D1%82%D1%8B$/.test(page.url()) && /Молибден/.test(el), 'element action from another page ' + at());

  // recipe science link to another chapter
  await page.goto(fileUrl('urozhay.html#рецепты'), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const link = await page.evaluate(() => { const a = document.querySelector('#r-pistou .rc-sci a'); return { href: a.getAttribute('href'), text: a.textContent.trim() }; });
  ok(link.href === 'vkus.html#deep-letuchest', 'recipe link ' + JSON.stringify(link));
  // it opens in the «Заглянуть» sheet (tests/peek.js); «Открыть в главе» goes there, the block open
  await page.evaluate(() => { document.getElementById('r-pistou').open = true; });
  await page.click('#r-pistou .rc-sci a');
  await page.waitForFunction(() => { const d = document.getElementById('sheet-peek'); return d.open && !d.classList.contains('is-loading'); }, null, { timeout: 10000 }).catch(() => {});
  await Promise.all([page.waitForNavigation(), page.click('#peek-go')]);
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => document.getElementById('deep-letuchest').open) && /vkus\.html#deep-letuchest$/.test(page.url()), 'cross-page deep link opens the block');

  // models: the Flavor chapter shows models in its tabs, so its files come with the page — the drawing libraries it
  // lists and its own file, each once, in that order, fingerprinted — and a model mounts when it scrolls near
  const tagsOf = () => page.evaluate(() => ({ tags: [...document.querySelectorAll('script[src*="labs/"]')].map(s => s.getAttribute('src').replace(/^.*\/js\//, '')), mounted: document.querySelectorAll('.lab-tool[data-ready]').length }));
  const want = v => page.evaluate(v => window.BASIL_PAGES.v.deps[v].map(x => 'lib-' + x).concat(v), v);
  const listed = (tags, w) => tags.length === w.length && tags.every((t, i) => new RegExp('^labs/' + w[i] + '\\.js\\?v=[0-9a-f]{8}$').test(t));
  await page.evaluate(() => { document.querySelector('.panel.is-active .lab-tool').scrollIntoView(); });
  await page.waitForTimeout(1200);
  const vk = await tagsOf();
  ok(listed(vk.tags, await want('vkus')) && vk.mounted > 0, 'a chapter with models on show brings its files with it ' + JSON.stringify(vk));
  // the Calendar's models are inside «Глубже»: nothing is fetched until one is opened and comes near
  await page.goto(fileUrl('kalendar.html'), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const calBefore = await tagsOf();
  await page.evaluate(() => { const d = document.querySelector('details.deep .lab-tool').closest('details'); d.open = true; d.querySelector('.lab-tool').scrollIntoView(); });
  await page.waitForTimeout(1500);
  const calAfter = await tagsOf();
  ok(calBefore.tags.length === 0 && listed(calAfter.tags, await want('kalendar')) && calAfter.mounted > 0, 'models inside «Глубже» load on demand ' + JSON.stringify({ before: calBefore.tags, after: calAfter }));

  // reading depth carries over
  await page.goto(fileUrl('sorta.html'), { waitUntil: 'load' });
  await page.click('#deep-toggle');
  await page.click('.depth-pop [data-depth-pick="2"]');
  await page.goto(fileUrl('uhod.html'), { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const dep = await page.evaluate(() => ({ d: document.documentElement.dataset.depth, all: [...document.querySelectorAll('details.deeper')].every(d => d.open) }));
  ok(dep.d === '2' && dep.all, 'depth carried to next page ' + JSON.stringify(dep));
  await page.click('#deep-toggle');
  await page.click('.depth-pop [data-depth-pick="0"]');

  // continue reading
  await page.goto(fileUrl('formirovka.html#цветение'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const cont = await page.evaluate(() => { const c = document.getElementById('continue'); return { hidden: c.hidden, href: c.getAttribute('href') }; });
  ok(!cont.hidden && cont.href === 'formirovka.html?resume=1#цветение', 'continue reading ' + JSON.stringify(cont));

  await page.goto(fileUrl('uhod.html'), { waitUntil: 'load' });
  const pg = await page.evaluate(() => [...document.querySelectorAll('.pager a')].map(a => a.getAttribute('href')));
  ok(pg.join() === 'kalendar.html,udobreniya.html', 'pager ' + pg.join());
  await page.click('.subnav a[href="#полив"]');
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => decodeURI(location.href).endsWith('uhod.html#полив') && document.getElementById('полив').classList.contains('is-active')), 'tab switch in page');

  const cm = codeMap();
  ok(cm.n > 300 && !cm.wrong.length, `CODE-MAP.md: ${cm.n} functions, each on its line${cm.wrong.length ? ' — not there: ' + cm.wrong.slice(0, 5).join(', ') : ''}`);
  ok(cm.named >= 15 && !cm.missing.length, `CODE-MAP.md: ${cm.named} events and storage keys, all in the code${cm.missing.length ? ' — missing: ' + cm.missing.join(', ') : ''}`);

  await browser.close();
  done(errs);
})();
