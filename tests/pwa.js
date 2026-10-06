/* Гид на экране телефона и без сети — на копии сборки для хостинга (dist/site), через scripts/serve.py.
     карточка — manifest.webmanifest: тип, имя, значки нужных размеров, ярлыки ведут на страницы;
     головы   — у каждой страницы карточка, значок для iPhone и пометка data-sw;
     работа без сети — service worker управляет страницей и сохранил каждый адрес из своего списка; без сети
              открываются главная, главы и «Мой базилик» со стилями, шрифтами и скриптами, модель главы
              грузится, поиск находит;
     новая версия — заменяет сохранённое: новая страница в кэше, старого кэша нет;
     выключатель (build.py --no-sw) — работник снимает себя и стирает копии; «Копии гида» на «Мой базилик»: размер,
     «Обновить» скачивает копии заново и не трогает кусты и фото, без сети оставляет прежние.
   node tests/pwa.js   (сборка: python3 scripts/build.py --clean --out dist/site) */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, OUT, playwright, serve, ok, done, watch, SLUGS, MOVED } = require('./lib');

const SITE = path.join(ROOT, 'dist/site');
const COPY = path.join(OUT, 'pwa-site');   // served and changed by the test: dist/site stays as built
const OFF = path.join(OUT, 'pwa-off');

// the width and height of a PNG from its header
const pngSize = buf => (buf.slice(1, 4).toString() === 'PNG' ? [buf.readUInt32BE(16), buf.readUInt32BE(20)] : null);
const precacheOf = dir => JSON.parse(fs.readFileSync(path.join(dir, 'sw.js'), 'utf8').match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
const versionOf = dir => fs.readFileSync(path.join(dir, 'sw.js'), 'utf8').match(/const VERSION = "([0-9a-f]+)"/)[1];

// waits until an async check in the page comes true (waitForFunction does not wait for a promise: it is truthy at once)
async function until(page, fn, arg, ms = 30000) {
  for (const end = Date.now() + ms; Date.now() < end; await page.waitForTimeout(300)) {
    if (await page.evaluate(fn, arg).catch(() => false)) return true;
  }
  return false;
}

(async () => {
  if (!fs.existsSync(path.join(SITE, 'sw.js'))) throw new Error('Нет dist/site/sw.js: python3 scripts/build.py --clean --out dist/site');
  fs.rmSync(COPY, { recursive: true, force: true });
  fs.cpSync(SITE, COPY, { recursive: true });
  let srv = await serve(COPY);
  const base = srv.base;
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  try {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
    const req = ctx.request;

    // the app's card
    const mr = await req.get(base + '/manifest.webmanifest');
    ok(mr.ok() && /application\/manifest\+json/.test(mr.headers()['content-type'] || ''), `manifest.webmanifest: ${mr.status()} ${mr.headers()['content-type']}`);
    const m = JSON.parse(await mr.text());
    ok(m.name === 'Гид по базилику' && m.short_name === 'Базилик' && m.display === 'standalone' && m.lang === 'ru', `карточка: «${m.name}», «${m.short_name}», ${m.display}`);
    ok(new URL(m.start_url, base + '/manifest.webmanifest').pathname === '/' && /^#[0-9A-F]{6}$/i.test(m.theme_color) && /^#[0-9A-F]{6}$/i.test(m.background_color), `start_url ${m.start_url}, цвета ${m.theme_color} / ${m.background_color}`);
    const sizes = [];
    for (const ic of m.icons) {
      const r = await req.get(new URL(ic.src, base + '/').href);
      const wh = r.ok() ? pngSize(await r.body()) : null;
      sizes.push(`${ic.sizes} ${ic.purpose}`);
      ok(wh && `${wh[0]}x${wh[1]}` === ic.sizes && r.headers()['content-type'] === 'image/png', `значок ${ic.src}: ${wh ? wh.join('×') : r.status()} (${ic.purpose})`);
    }
    ok(sizes.includes('192x192 any') && sizes.includes('512x512 any') && sizes.includes('512x512 maskable'), 'значки 192 и 512, есть маскируемый');
    for (const s of m.shortcuts) {
      const r = await req.get(new URL(s.url, base + '/').href);
      ok(r.ok() && s.name && s.description, `ярлык «${s.name}» → /${s.url}: ${r.status()}`);
    }

    // every page's head
    const keep = precacheOf(COPY);
    let heads = 0, touch = null;
    for (const slug of Object.values(SLUGS)) {
      const html = await (await req.get(`${base}/${encodeURI(slug)}`)).text();
      if (/<link rel="manifest" href="manifest\.webmanifest" data-sw>/.test(html) && /<meta name="apple-mobile-web-app-title" content="Базилик">/.test(html)) heads++;
      touch = touch || (html.match(/<link rel="apple-touch-icon" href="([^"]+)"/) || [])[1];
      ok(keep.includes(slug || './'), `/${slug} в списке работника`);
    }
    ok(heads === Object.keys(SLUGS).length, `карточка в голове ${heads} из ${Object.keys(SLUGS).length} страниц`);
    const tr = touch && await req.get(`${base}/${touch}`);
    const twh = tr && tr.ok() ? pngSize(await tr.body()) : null;
    ok(twh && twh[0] === 180 && twh[1] === 180, `значок для iPhone ${touch}: ${twh ? twh.join('×') : '—'}`);
    const swr = await req.get(base + '/sw.js');
    ok(swr.ok() && /javascript/.test(swr.headers()['content-type'] || ''), `sw.js: ${swr.status()} ${swr.headers()['content-type']}`);
    const ht = fs.readFileSync(path.join(COPY, '.htaccess'), 'utf8');
    ok(/AddType application\/manifest\+json \.webmanifest/.test(ht) && /Header set Cache-Control "no-cache"/.test(ht), '.htaccess: тип карточки и no-cache для sw.js');

    // the worker takes the page and keeps every address of its list
    const page = await ctx.newPage();
    watch(page, errs);
    await page.goto(base + '/', { waitUntil: 'load' });
    const t0 = Date.now();
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 30000 });
    const v1 = versionOf(COPY);
    const kept = await page.evaluate(async () => {
      const names = await caches.keys();
      const shell = names.find(n => /^basil-[0-9a-f]+$/.test(n));
      return { names, n: shell ? (await (await caches.open(shell)).keys()).length : 0 };
    });
    ok(kept.names.includes('basil-' + v1) && kept.n >= keep.length, `работник за ${((Date.now() - t0) / 1000).toFixed(1)} с: кэш basil-${v1}, ${kept.n} из ${keep.length} адресов`);

    // without the network
    await ctx.setOffline(true);
    const missing = await page.evaluate(async list => {
      const out = [];
      for (const u of list) { try { if (!(await fetch(u)).ok) out.push(u); } catch (e) { out.push(u); } }
      return out;
    }, keep.filter(u => u.startsWith('assets/')));
    ok(!missing.length, `без сети отдаётся каждый файл списка${missing.length ? ': нет ' + missing.slice(0, 5).join(', ') : ''}`);
    for (const slug of Object.values(SLUGS)) {
      const res = await page.goto(`${base}/${encodeURI(slug)}`, { waitUntil: 'load' }).catch(e => null);
      await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 15000 }).catch(() => {});
      const r = await page.evaluate(async () => {
        await document.fonts.ready;
        return {
          h1: (document.querySelector('h1') || {}).textContent || '',
          styled: getComputedStyle(document.querySelector('.topbar')).position !== 'static',
          app: !!(window.BasilGarden && window.BasilScience),
          font: [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Manrope' && f.status === 'loaded'),
          sw: !!navigator.serviceWorker.controller
        };
      });
      ok(res && res.ok() && r.h1.trim() && r.styled && r.app && r.font && r.sw, `без сети /${slug}: «${r.h1.trim().slice(0, 40)}»${r.styled ? '' : ' БЕЗ СТИЛЕЙ'}${r.app ? '' : ' БЕЗ СКРИПТОВ'}${r.font ? '' : ' без Manrope'}`);
    }
    // the address of a chapter merged into others works without the network too: its page is kept and sends on
    for (const slug of Object.values(MOVED)) ok(keep.includes(slug), `/${slug} (глава слита с другими) в списке работника`);
    await page.goto(`${base}/${encodeURI('урожай')}#${encodeURI('рецепты')}`, { waitUntil: 'load' }).catch(() => null);
    await page.waitForTimeout(1200);
    ok(decodeURI(page.url().replace(base, '')) === '/вкус#рецепты', `без сети старый адрес /урожай#рецепты → ${decodeURI(page.url().replace(base, ''))}`);
    // a chapter's models come from the saved copy
    await page.goto(`${base}/${encodeURI('уход')}`, { waitUntil: 'load' });
    const lab = await page.evaluate(() => {
      const el = document.querySelector('.lab-tool[data-lab]');
      for (let d = el.closest('details'); d; d = d.parentElement.closest('details')) d.open = true;
      const p = el.closest('[data-panel]');
      if (p && location.hash !== '#' + p.id) location.hash = p.id;
      return el.dataset.lab;
    });
    await page.waitForTimeout(300);
    await page.evaluate(l => document.querySelector(`.lab-tool[data-lab="${l}"]`).scrollIntoView({ block: 'center' }), lab);
    const mounted = await page.waitForFunction(l => !!document.querySelector(`.lab-tool[data-lab="${l}"]`).dataset.ready, lab, { timeout: 10000 }).then(() => true, () => false);
    ok(mounted, `без сети модель «${lab}» в «Уходе» построилась`);
    // the search index too
    await page.evaluate(() => document.querySelector('[data-search-open], .search-btn, #search-btn') && document.querySelector('[data-search-open], .search-btn, #search-btn').click());
    const found = await page.evaluate(() => new Promise(resolve => {
      if (window.BASIL_SEARCH) return resolve(window.BASIL_SEARCH.length);
      const s = document.createElement('script');
      s.src = document.querySelector('script[src*="/app.js"]').src.replace(/app\.js.*$/, 'search-index.js') + '?v=' + window.BASIL_PAGES.v.search;
      s.onload = () => resolve(window.BASIL_SEARCH ? window.BASIL_SEARCH.length : 0);
      s.onerror = () => resolve(0);
      document.head.appendChild(s);
    }));
    ok(found > 100, `без сети поисковый индекс: ${found} записей`);
    // the weather never goes through the worker: no network, no answer, no copy from the cache
    const wx = await page.evaluate(() => fetch('https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.62&daily=temperature_2m_min').then(() => 'ответ', () => 'нет сети'));
    ok(wx === 'нет сети', `Open-Meteo без сети: ${wx}`);
    // «Заглянуть» without the network: the frame's page (?peek=1) is the saved copy of its chapter
    await page.goto(`${base}/${encodeURI('вкус')}#${encodeURI('рецепты')}`, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.evaluate(() => { const c = document.getElementById('r-bruschetta'); c.open = true; c.querySelector('.rc-sci a').scrollIntoView({ block: 'center', behavior: 'instant' }); });
    await page.waitForTimeout(300);
    await page.click('#r-bruschetta .rc-sci a');
    const peeked = await page.waitForFunction(() => { const d = document.getElementById('sheet-peek'); return d.open && !d.classList.contains('is-loading'); }, null, { timeout: 10000 }).then(() => true, () => false);
    const pf = page.frames().find(f => /[?&]peek=1/.test(f.url()));
    const shown = pf ? await pf.evaluate(() => { const t = document.querySelector('[data-peek]'); return !!t && t.id === 'deep-osmos' && t.offsetHeight > 200; }).catch(() => false) : false;
    ok(peeked && shown, `без сети шторка «Заглянуть» показывает разворот из сохранённой копии: ${pf ? decodeURI(pf.url()).replace(base, '') : 'нет рамки'}`);
    await ctx.setOffline(false);

    // «Установить» on the page «Мой базилик»: only when the browser offers it (headless Chromium never does — the
    // test hands the page the browser's event), «Не сейчас» hides it for good; on an iPhone — how to do it by hand
    const moy = `${base}/${encodeURI('мой-базилик')}`;
    await page.goto(moy, { waitUntil: 'load' });
    const before = await page.evaluate(() => document.getElementById('garden-install').hidden);
    await page.evaluate(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => { window.__asked = (window.__asked || 0) + 1; };
      e.userChoice = Promise.resolve({ outcome: 'accepted' });
      dispatchEvent(e);
    });
    const box = await page.evaluate(() => {
      const b = document.getElementById('garden-install'), btns = [...b.querySelectorAll('button')];
      return { shown: !b.hidden && b.getBoundingClientRect().height > 40, pic: !!b.querySelector('img.g-install-pic'),
               text: b.textContent.replace(/\s+/g, ' ').trim(), small: btns.filter(x => x.getBoundingClientRect().height < 36).map(x => x.textContent.trim()) };
    });
    ok(before && box.shown && box.pic && /Установить/.test(box.text) && !box.small.length, `«Установить»: ${box.shown ? 'видна' : 'НЕ ВИДНА'} после вопроса браузера${box.small.length ? ', мелкие кнопки: ' + box.small.join(', ') : ''}`);
    await page.click('#garden-install [data-install]');
    const asked = await page.evaluate(() => new Promise(r => setTimeout(() => r({ n: window.__asked || 0, hidden: document.getElementById('garden-install').hidden }), 100)));
    ok(asked.n === 1 && asked.hidden, `«Установить» задаёт вопрос браузера один раз (${asked.n}) и прячется`);
    await page.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => {}; e.userChoice = Promise.resolve({}); dispatchEvent(e); });
    await page.click('#garden-install [data-install-off]');
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => {}; e.userChoice = Promise.resolve({}); dispatchEvent(e); });
    ok(await page.evaluate(() => document.getElementById('garden-install').hidden), '«Не сейчас»: после перезагрузки не предлагается');
    // «Копии гида»: how much they take; «Обновить» fetches them afresh and keeps the reader's own things —
    // without the network it keeps the old copies
    await page.waitForFunction(() => { const c = document.getElementById('garden-copies'); return c && !c.hidden && /\d\s*МБ/.test(c.textContent); }, null, { timeout: 20000 }).catch(() => {});
    const copies = await page.evaluate(() => { const c = document.getElementById('garden-copies'); return { hidden: c.hidden, text: c.textContent.replace(/\s+/g, ' ').trim() }; });
    const mbOf = t => parseFloat(((t.match(/([\d,]+)\s*МБ/) || [])[1] || '0').replace(',', '.'));
    ok(!copies.hidden && mbOf(copies.text) > 1 && /кусты и фото останутся/.test(copies.text), `«Копии гида»: ${copies.text}`);
    const mine = await page.evaluate(async () => {
      localStorage.setItem('basil-test-own', 'куст');
      const own = Object.keys(localStorage).sort().join();
      const dbs = indexedDB.databases ? (await indexedDB.databases()).map(d => d.name).sort().join() : '';
      const shell = (await caches.keys()).find(n => /^basil-[0-9a-f]+$/.test(n));
      return { own, dbs, shell };
    });
    const toastAfter = async () => page.waitForFunction(() => { const t = document.getElementById('toast'); return t && /Копии|сети/.test(t.textContent) && t.textContent; }, null, { timeout: 60000 }).then(h => h.jsonValue(), () => '');
    await page.click('#garden-copies [data-copies]');
    const said = await toastAfter();
    const refreshed = await page.evaluate(async () => {
      const names = await caches.keys(), shell = names.find(n => /^basil-[0-9a-f]+$/.test(n));
      return { names, n: shell ? (await (await caches.open(shell)).keys()).length : 0, own: Object.keys(localStorage).sort().join(), dbs: indexedDB.databases ? (await indexedDB.databases()).map(d => d.name).sort().join() : '',
               btn: document.querySelector('#garden-copies [data-copies]').textContent };
    });
    ok(/Копии обновлены/.test(said) && refreshed.names.includes(mine.shell) && refreshed.n >= keep.length && refreshed.own === mine.own && refreshed.dbs === mine.dbs && refreshed.btn === 'Обновить',
      `«Обновить»: «${said}», кэш ${refreshed.n} из ${keep.length} адресов, свои данные на месте`);
    await ctx.setOffline(true);
    const offPage = await page.goto(`${base}/${encodeURI('уход')}`, { waitUntil: 'load' }).then(r => r && r.ok(), () => false);
    await ctx.setOffline(false);
    await page.goto(moy, { waitUntil: 'load' }).catch(() => {});
    await page.waitForFunction(() => { const c = document.getElementById('garden-copies'); return c && !c.hidden; }, null, { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.textContent = ''; });
    // the worker's own requests do not obey the browser's offline switch: the server itself goes away for a moment
    srv.stop();
    await page.waitForTimeout(300);
    await page.click('#garden-copies [data-copies]').catch(() => {});
    const saidOff = await toastAfter();
    const kept2 = await page.evaluate(async () => { const s = (await caches.keys()).find(n => /^basil-[0-9a-f]+$/.test(n)); return s ? (await (await caches.open(s)).keys()).length : 0; });
    srv = await serve(COPY, new URL(base).port);
    ok(offPage && /Нет сети/.test(saidOff) && kept2 >= keep.length, `после «Обновить» глава без сети открывается; без сети «${saidOff}», копий ${kept2}`);
    await page.evaluate(() => localStorage.removeItem('basil-test-own'));
    const ictx = await browser.newContext({ ...devices['iPhone 13 Mini'], reducedMotion: 'reduce' });
    const ip = await ictx.newPage();
    watch(ip, errs);
    await ip.goto(moy, { waitUntil: 'load' });
    await ip.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 15000 }).catch(() => {});
    const ios = await ip.evaluate(() => { const b = document.getElementById('garden-install'); return { shown: !b.hidden, text: b.textContent.replace(/\s+/g, ' ').trim() }; });
    ok(ios.shown && /«Поделиться».*«На экран „Домой“»/.test(ios.text) && !/Установить/.test(ios.text), `iPhone: подсказка «${(ios.text.match(/Нажмите[^.]*\./) || [''])[0]}»`);
    await ip.locator('#garden-install').screenshot({ path: path.join(OUT, 'pwa-install-iphone.png') }).catch(() => {});
    await ictx.close();

    // a new version: the browser finds the new sw.js, fetches the new copies and drops the old ones
    const MARK = '<!-- pwa-test: new version -->';
    fs.appendFileSync(path.join(COPY, 'sorta.html'), MARK + '\n');
    const v2 = (parseInt(v1.slice(0, 8), 16) ^ 1).toString(16).padStart(8, '0') + v1.slice(8);
    fs.writeFileSync(path.join(COPY, 'sw.js'), fs.readFileSync(path.join(COPY, 'sw.js'), 'utf8').replace(`"${v1}"`, `"${v2}"`));
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    const swapped = await until(page, ([a, b]) => caches.keys().then(k => k.includes('basil-' + b) && !k.includes('basil-' + a) && !k.includes('basil-rt-' + a)), [v1, v2]);
    const fresh = swapped && await page.evaluate(async b => {
      const c = await caches.open('basil-' + b);
      const r = await c.match(new URL('сорта', location.href).href);
      return r ? (await r.text()).includes('pwa-test') : false;
    }, v2);
    ok(swapped && fresh, `новая версия ${v2}: старый кэш снят, в новом — новая страница «Сорта»`);

    // the switch: build.py --no-sw, put over the same address — the worker removes itself and the copies
    execFileSync('python3', [path.join(ROOT, 'scripts/build.py'), '--clean', '--out', OFF, '--no-sw'], { stdio: 'ignore' });
    for (const f of fs.readdirSync(OFF)) fs.cpSync(path.join(OFF, f), path.join(COPY, f), { recursive: true, force: true });
    ok(!/data-sw/.test(fs.readFileSync(path.join(COPY, 'index.html'), 'utf8')), 'выключатель: у страниц нет пометки data-sw');
    await page.goto(base + '/', { waitUntil: 'load' });
    const gone = await until(page, () => Promise.all([caches.keys(), navigator.serviceWorker.getRegistrations()])
      .then(([k, r]) => !k.some(n => n.startsWith('basil-')) && !r.length));
    ok(gone, 'выключатель: работник снят, сохранённых копий нет');
    await ctx.setOffline(true);
    const after = await page.goto(`${base}/${encodeURI('сорта')}`).then(() => 'открылась', () => 'нет сети');
    ok(after === 'нет сети', `после выключателя без сети страница не из кэша: ${after}`);
    await ctx.close();
  } finally {
    await browser.close();
    srv.stop();
    fs.rmSync(COPY, { recursive: true, force: true });
    fs.rmSync(OFF, { recursive: true, force: true });
  }
  done(errs);
})().catch(e => { console.error(e); process.exit(1); });
