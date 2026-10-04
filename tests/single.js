/* Книга одним файлом (python3 scripts/build.py --single …): все главы на одной странице, переходы по #id,
   калькуляторы, поиск, модели. node tests/single.js */
const path = require('path');
const { execFileSync } = require('child_process');
const { playwright, ok, done, ROOT, OUT } = require('./lib');

(async () => {
  const file = path.join(OUT, 'single.html');
  execFileSync('python3', [path.join(ROOT, 'scripts/build.py'), '--single', file], { stdio: 'ignore' });
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/CERT|fonts/.test(m.text())) errs.push(m.text()); });
  await page.goto('file://' + file, { waitUntil: 'load' });
  const state = async () => page.evaluate(() => ({ hash: location.hash, view: document.querySelector('.view.is-active').dataset.view, panel: document.querySelector('.view.is-active .panel.is-active')?.id || null }));
  // each step: where the page should be now
  const log = async (label, view, panel) => { const st = await state(); ok(st.view === view && st.panel === panel, label + ' ' + JSON.stringify(st)); };
  const says = async (label, sel, re) => { const t = (await page.textContent(sel) || '').replace(/\s+/g, ' '); ok(re.test(t), `${label}: ${t.slice(0, 70)}`); };
  await log('start', 'glavnaya', null);
  await page.click('.q-card[href="#posadka-magazin"]'); await page.waitForTimeout(200); await log('quick → magazin', 'posadka', 'posadka-magazin');
  await page.click('.view.is-active .subnav a[href="#posadka-gorshok"]'); await page.waitForTimeout(200); await log('subnav → gorshok', 'posadka', 'posadka-gorshok');
  await says('soil', '#soil-out', /Перлит/);
  await page.click('.view.is-active .pager a.next'); await page.waitForTimeout(200); await log('pager next', 'kalendar', null);
  await page.goBack(); await page.waitForTimeout(250); await log('back', 'posadka', 'posadka-gorshok');
  await page.goBack(); await page.waitForTimeout(250); await log('back again', 'glavnaya', null);
  // search
  await page.keyboard.press('/'); await page.fill('#search-input', 'паутин'); await page.waitForTimeout(100);
  ok((await page.$$eval('.sr-item b', els => els.map(e => e.textContent))).includes('Паутинный клещ'), 'search results');
  await page.keyboard.press('Enter'); await page.waitForTimeout(300); await log('search enter', 'problemy', 'problemy-diagnostika');
  await says('diag selected', '#diag-result h3', /Паутинка/);
  // element via search
  await page.keyboard.press('/'); await page.fill('#search-input', 'магний'); await page.waitForTimeout(100); await page.keyboard.press('Enter'); await page.waitForTimeout(300); await log('search магний', 'udobreniya', 'udobreniya-elementy');
  await says('element', '#el-detail h3', /Магний/);
  // variety sheet
  await page.evaluate(() => { location.hash = 'sorta-katalog'; }); await page.waitForTimeout(200);
  await page.click('#variety-filters [data-filter="resist"]'); await says('resist filter', '#variety-count', /из \d+/);
  await page.click('#variety-grid .variety:not([hidden])'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.getElementById('sheet-variety').open), 'variety sheet opens');
  await page.click('#sheet-variety a[href="#posadka-posev"]'); await page.waitForTimeout(250); await log('sheet link', 'posadka', 'posadka-posev');
  ok(await page.evaluate(() => !document.getElementById('sheet-variety').open), 'sheet closes on link');
  // calendar
  await page.evaluate(() => { location.hash = 'kalendar'; }); await page.waitForTimeout(200);
  await page.selectOption('#cal-preset', 'warm'); await says('calendar warm', '#cal-season', /высадка/);
  await page.click('#cal-mode-home'); await says('calendar home', '#cal-season', /урожай/);
  ok(await page.$$eval('#cal-wheel .w-arc', a => a.length) > 2, 'wheel arcs');
  // DLI
  await page.evaluate(() => { location.hash = 'dli'; }); await page.waitForTimeout(200);
  await page.click('#dli-presets [data-ppfd="100"]'); await says('dli', '#dli-out', /моль/);
  // stages / chart
  await page.evaluate(() => { location.hash = 'udobreniya-stadii'; }); await page.waitForTimeout(300);
  ok(await page.$$eval('#feed-chart .fc-hit', a => a.length) === 7, 'feed chart hits');
  await page.click('#feed-chart .fc-hit[data-i="5"]'); await says('stage', '#stage-title', /Бутонизация/);
  // plan
  await page.evaluate(() => { location.hash = 'udobreniya-plan'; }); await page.waitForTimeout(200);
  for (const m of ['pot', 'garden', 'hydro']) { await page.click(`[data-plan-mode="${m}"]`); ok(await page.$$eval('#plan-list li', l => l.length) >= 8, 'plan ' + m); }
  // npk
  await page.evaluate(() => { location.hash = 'npk'; }); await page.waitForTimeout(200);
  for (const i of [1, 2, 4]) { await page.click(`#npk-presets [data-i="${i}"]`); await says('npk ' + i, '.npk-kind', /ное/); }
  // dose
  await page.evaluate(() => { location.hash = 'udobreniya-kalkulyator'; }); await page.waitForTimeout(200);
  await page.check('#dose-s-quarter', { force: true }); await says('dose', '#dose-out', /четверть дозы/);
  // sim
  await page.evaluate(() => { location.hash = 'formirovka-trenazher'; }); await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.s-node[data-stem="1"][data-node="3"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  for (let i = 0; i < 4; i++) await page.click('#sim-week-btn');
  await says('pinching simulator', '#sim-msg', /\S/);
  // germ
  await page.evaluate(() => { location.hash = 'razmnozhenie-semena'; }); await page.waitForTimeout(200);
  await page.fill('#germ-count', '4'); await page.dispatchEvent('#germ-count', 'input'); await says('germination', '#germ-out', /40 %/);
  // glossary
  await page.evaluate(() => { location.hash = 'spravka-slovar'; }); await page.waitForTimeout(200);
  await page.fill('#gloss-q', 'хлор'); ok((await page.$$eval('.gloss-item:not([hidden]) dt', d => d.map(x => x.textContent))).join() === 'Хлороз,Хлорофилл', 'glossary filter');
  // checklist
  await page.evaluate(() => { location.hash = 'spravka-chek-list'; }); await page.waitForTimeout(200);
  await page.click('label[for="ck-sow"]'); await says('checklist', '#check-count', /Выполнено 1 из/);
  // continue reading on home
  await page.evaluate(() => { location.hash = 'glavnaya'; }); await page.waitForTimeout(200);
  ok(await page.evaluate(() => !document.getElementById('continue').hidden), 'continue reading on home');
  // quiz
  await page.evaluate(() => { location.hash = 'sorta-podbor'; }); await page.waitForTimeout(200);
  for (const v of ['garden', 'asian', 'hot', 'pro']) await page.click(`#quiz [data-v="${v}"]`);
  ok((await page.$$eval('.qr .v-name', n => n.map(x => x.textContent))).includes('Тайский'), 'quiz: asian → Тайский');
  await page.click('#quiz [data-restart]');
  for (const v of ['balcony', 'decor', 'damp', 'new']) await page.click(`#quiz [data-v="${v}"]`);
  ok((await page.$$eval('.qr .v-name', n => n.map(x => x.textContent))).length === 3, 'quiz again');
  // models: every chapter's file is inlined, so a model mounts without fetching anything
  await page.evaluate(() => { location.hash = 'vkus-aromat'; }); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.lab-tool[data-lab="trichome"]').scrollIntoView()); await page.waitForTimeout(900);
  ok(await page.evaluate(() => !!document.querySelector('.lab-tool[data-lab="trichome"][data-ready]') && !document.querySelector('script[src*="labs/"]')), 'models are inline and mount');
  await page.evaluate(() => { location.hash = 'problemy-bolezni'; }); await page.waitForTimeout(300);
  await page.evaluate(() => { const d = document.querySelector('#deep-lmr, .lab-tool[data-lab="dm"]'); for (let p = d.closest('details'); p; p = p.parentElement.closest('details')) p.open = true; document.querySelector('.lab-tool[data-lab="dm"]').scrollIntoView(); }); await page.waitForTimeout(900);
  ok(await page.evaluate(() => !!document.querySelector('.lab-tool[data-lab="dm"][data-ready]')), 'a model from another chapter mounts too');
  // a link from the text to another chapter: the book has no «Заглянуть» sheet (a frame would load the whole book once
  // more) — it jumps on the page and offers the way back to the link
  await page.evaluate(() => { location.hash = 'urozhay-recepty'; }); await page.waitForTimeout(300);
  await page.evaluate(() => { const c = document.getElementById('r-pistou'); c.open = true; c.querySelector('.rc-sci a').scrollIntoView({ block: 'center', behavior: 'instant' }); });
  await page.waitForTimeout(300);
  await page.click('#r-pistou .rc-sci a'); await page.waitForTimeout(500);
  const jumped = await page.evaluate(() => ({ view: document.querySelector('.view.is-active').dataset.view, sheet: document.getElementById('sheet-peek').open, pill: ((document.querySelector('.back-pill') || {}).textContent || '').replace(/\s+/g, ' ').trim() }));
  ok(jumped.view === 'vkus' && !jumped.sheet && /Вернуться к тексту/.test(jumped.pill), 'a recipe\'s link jumps to the dive, no sheet, the way back offered ' + JSON.stringify(jumped));
  await page.click('.back-pill .resume-go'); await page.waitForTimeout(900);
  const backAt = await page.evaluate(() => { const r = document.querySelector('#r-pistou .rc-sci a').getBoundingClientRect(); return { view: document.querySelector('.view.is-active').dataset.view, top: Math.round(r.top), H: innerHeight }; });
  ok(backAt.view === 'urozhay' && backAt.top > 0 && backAt.top < backAt.H, '«↑ Вернуться к тексту» brings the recipe back ' + JSON.stringify(backAt));
  await browser.close();
  done(errs);
})();
