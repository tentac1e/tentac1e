/* Версия для хостинга (dist/site) на локальном сервере с правилами .htaccess:
   русские адреса, старые ссылки, поиск, короткие якоря вкладок; кэш: страницы сверяются каждый раз, файлы с ?v= — неизменны.
   python3 scripts/build.py --clean --out dist/site && node tests/clean.js */
const { ROOT, playwright, server, ok, done } = require('./lib');

(async () => {
  const { chromium } = playwright();
  const srv = await server();
  const B = srv.base;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = [], failed = [];
  page.on('pageerror', e => errs.push(page.url() + ' ' + e.message));
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(B)) failed.push(r.status() + ' ' + r.url()); });
  const path = () => decodeURI(page.url().replace(B, ''));
  for (const p of ['/', '/сорта', '/посадка', '/календарь', '/уход', '/удобрения', '/прищипывание', '/урожай', '/вкус', '/размножение', '/проблемы', '/справка']) {
    await page.goto(B + encodeURI(p), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const st = await page.evaluate(() => ({ t: document.title, css: getComputedStyle(document.body).backgroundColor, nav: [...document.querySelectorAll('#nav a')].map(a => a.getAttribute('href')), html: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /\.html/.test(h)) }));
    ok(st.nav.every(h => !/\.html/.test(h)) && !st.html.length && st.css !== 'rgba(0, 0, 0, 0)', `${p}: ${st.t}`);
  }
  await page.goto(B + '/index.html#udobreniya-plan', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  ok(path() === '/удобрения#план', 'old /index.html#udobreniya-plan → ' + path());
  await page.goto(B + '/sorta.html#sorta-podbor', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  ok(path() === '/сорта#подбор' && await page.evaluate(() => document.getElementById('подбор').classList.contains('is-active')), 'old /sorta.html#sorta-podbor → ' + path());
  await page.goto(B + '/', { waitUntil: 'load' });
  await page.keyboard.press('/'); await page.waitForTimeout(300);
  await page.keyboard.type('Эстафета протонов'); await page.waitForTimeout(600);
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  await page.waitForTimeout(1200);
  ok(path() === '/удобрения#deep-ec-glubzhe' && await page.evaluate(() => document.querySelector('#deep-ec .deeper').open), 'search → ' + path());
  await page.goto(B + '/', { waitUntil: 'load' });
  await page.keyboard.press('/'); await page.waitForTimeout(300);
  await page.keyboard.type('Молибден'); await page.waitForTimeout(600);
  await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
  await page.waitForTimeout(1000);
  ok(path() === '/удобрения#элементы' && /Молибден/.test(await page.evaluate(() => document.querySelector('.el-detail').textContent)), 'search action → ' + path());
  await page.goto(B + '/urozhay#urozhay-recepty', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => { document.getElementById('r-pistou').open = true; });
  const href = await page.evaluate(() => document.querySelector('#r-pistou .rc-sci a').getAttribute('href'));
  await Promise.all([page.waitForNavigation(), page.click('#r-pistou .rc-sci a')]);
  await page.waitForTimeout(900);
  ok(href === 'вкус#deep-letuchest' && path() === '/вкус#deep-letuchest' && await page.evaluate(() => document.getElementById('deep-letuchest').open), 'recipe link ' + href + ' → ' + path());
  await page.goto(B + encodeURI('/уход'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const pg = await page.evaluate(() => [...document.querySelectorAll('.pager a')].map(a => a.getAttribute('href')).join());
  ok(pg === 'календарь,удобрения', 'pager ' + pg);
  await Promise.all([page.waitForNavigation(), page.click('a.brand')]);
  ok(path() === '/', 'logo → ' + path());
  await page.goto(B + encodeURI('/удобрения') + '#deep-ec', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  ok(await page.evaluate(() => !!document.querySelector('.lab-tool[data-ready]')), 'models load on /udobreniya');

  await page.goto(B + encodeURI('/удобрения') + '#udobreniya-plan', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  ok(path() === '/удобрения#план' && await page.evaluate(() => document.getElementById('план').classList.contains('is-active')), 'old long tab id on new page → ' + path());
  await page.goto(B + encodeURI('/уход'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.click('.subnav a[href="#полив"]');
  await page.waitForTimeout(400);
  ok(path() === '/уход#полив' && await page.evaluate(() => document.getElementById('полив').classList.contains('is-active') && document.title.includes('Полив')), 'tab click → ' + path());
  await page.goto(B + encodeURI('/прищипывание') + '#' + encodeURIComponent('цветение'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.goto(B + '/', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const cont = await page.evaluate(() => document.getElementById('continue').getAttribute('href'));
  ok(cont === 'прищипывание?resume=1#цветение', 'continue reading ' + cont);
  const tools = await page.evaluate(() => [...document.querySelectorAll('#tools-home a')].map(a => a.getAttribute('href')).slice(0, 5));
  ok(tools.includes('удобрения#план') || tools.some(h => /#[а-я]/.test(h)), 'home tool links ' + tools.join(' '));
  await page.goto(B + encodeURI('/удобрения') + '#' + encodeURIComponent('калькулятор'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => document.getElementById('калькулятор').classList.contains('is-active')), 'direct short anchor');
  await page.keyboard.press('/'); await page.waitForTimeout(300);
  await page.keyboard.type('План подкормок'); await page.waitForTimeout(500);
  const sr = await page.evaluate(() => document.querySelector('.sr-item').getAttribute('href'));
  await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  ok(path() === '/удобрения#план', 'same-page search ' + sr + ' → ' + path());
  const stale = await page.evaluate(() => [...document.querySelectorAll('a[href*="#"]')].map(a => a.getAttribute('href')).filter(h => /#(sorta|posadka|uhod|udobreniya|formirovka|urozhay|vkus|razmnozhenie|problemy|spravka)-[a-z]/.test(h) && !/-h\d+$/.test(h)));
  ok(!stale.length, 'no long tab ids left in links ' + stale.slice(0, 5));
  // the cache rules of the hosting (the same in .htaccess and serve.py): a page, the worker and the card are checked
  // on every visit; a file with a fingerprint never changes and is not asked about again
  await page.goto(B + '/', { waitUntil: 'load' });
  const css = await page.evaluate(() => document.querySelector('link[rel="stylesheet"][href*="style.css"]').getAttribute('href'));
  const cc = async u => (await fetch(B + u, { method: 'HEAD', redirect: 'manual' })).headers.get('cache-control') || '';
  const rules = { '/': await cc('/'), '/уход': await cc(encodeURI('/уход')), 'sw.js': await cc('/sw.js'), [css]: await cc('/' + css), 'manifest': await cc('/manifest.webmanifest') };
  ok(rules['/'] === 'no-cache' && rules['/уход'] === 'no-cache' && rules['sw.js'] === 'no-cache' && rules.manifest === 'no-cache' && /immutable/.test(rules[css]) && /max-age=31536000/.test(rules[css]),
    'cache headers ' + JSON.stringify(rules));
  const ht = require('fs').readFileSync(require('path').join(ROOT, 'dist/site/.htaccess'), 'utf8');
  ok(/ExpiresByType text\/html "access plus 0 seconds"/.test(ht) && /<FilesMatch "\\\.html\$">\s*Header set Cache-Control "no-cache"/.test(ht)
    && /<If "%\{QUERY_STRING\} =~ \/\(\^\|&\)v=\/">\s*Header set Cache-Control "public, max-age=31536000, immutable"/.test(ht),
    '.htaccess: pages no-cache, fingerprinted files immutable');
  const bad = failed.filter(u => !/favicon/.test(u));
  ok(!bad.length, 'no failed requests ' + JSON.stringify(bad));
  await browser.close();
  srv.stop();
  done(errs);
})();
