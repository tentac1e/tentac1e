/* Сборка в корне репозитория (ссылки вида sorta.html), открытая как файлы:
   каждая страница, переходы между главами, поиск, глубина чтения, «Продолжить», ленивые модели.
   node tests/pages.js */
const { playwright, ok, done, watch, FILES, fileUrl } = require('./lib');

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
      labsTag: !!document.querySelector('script[src*="labs/"]'),
      bad: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => !['#main', '#top'].includes(h) && !document.getElementById(h.slice(1)) && !document.querySelector(`[data-view="${h.slice(1)}"]`)).slice(0, 5)
    }));
    ok(st.views === 1 && st.active && st.panel && (!st.labsTag || ['vkus.html', 'problemy.html'].includes(f)) && !st.bad.length && / — Гид по базилику$|^Гид по базилику$/.test(st.t),
      `${f}: «${st.t}» | nav «${st.cur}» | dangling ${JSON.stringify(st.bad)}`);
  }

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
  const hrefs = await page.evaluate(() => ({ tools: [...document.querySelectorAll('#tools-home a')].slice(0, 3).map(a => a.getAttribute('href')), ch: [...document.querySelectorAll('#chapters a')].slice(0, 2).map(a => a.getAttribute('href')) }));
  ok(hrefs.tools.every(h => /\.html/.test(h)) && hrefs.ch.every(h => /\.html$/.test(h)), 'home links point to pages ' + JSON.stringify(hrefs));

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
  await page.evaluate(() => { document.getElementById('r-pistou').open = true; });
  await Promise.all([page.waitForNavigation(), page.click('#r-pistou .rc-sci a')]);
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => document.getElementById('deep-letuchest').open) && /vkus\.html#deep-letuchest$/.test(page.url()), 'cross-page deep link opens the block');

  // models: this chapter's file only (the Flavor chapter starts with one, so it is already there), fetched when the first model scrolls near
  const before = await page.evaluate(() => [...document.querySelectorAll('script[src*="labs/"]')].length);
  await page.evaluate(() => { document.querySelector('.panel.is-active .lab-tool').scrollIntoView(); });
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => ({ tags: [...document.querySelectorAll('script[src*="labs/"]')].map(s => s.getAttribute('src').replace(/^.*\/js\//, '')), mounted: document.querySelectorAll('.lab-tool[data-ready]').length }));
  ok(before === 0 && after.tags.length === 1 && /^labs\/vkus\.js\?v=[0-9a-f]{8}$/.test(after.tags[0]) && after.mounted > 0, 'chapter models load on demand ' + JSON.stringify(after));

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

  await browser.close();
  done(errs);
})();
