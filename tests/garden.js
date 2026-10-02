/* «Мой базилик» на телефоне и компьютере: пустой блок, куст через форму, дела на неделю, «Сделано»,
   отметки в дневнике, правка, копия в файле и обратно, «Растёт у меня» из листа сорта, и на главной
   с тремя кустами — ничего не налезает и не шире экрана (аудит из overlap.js).
   python3 scripts/build.py && node tests/garden.js */
const fs = require('fs');
const { playwright, ok, done, watch, fileUrl } = require('./lib');
const { audit } = require('./overlap');

const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  for (const mode of ['phone', 'desktop']) {
    const ctx = await browser.newContext({ ...(mode === 'phone' ? { ...devices['iPhone 13 Mini'] } : { viewport: { width: 1280, height: 900 } }), reducedMotion: 'reduce', acceptDownloads: true });
    const page = await ctx.newPage();
    watch(page, errs);
    page.on('dialog', d => d.accept());
    const M = mode.padEnd(7) + ' ';
    const plants = () => page.evaluate(() => (JSON.parse(localStorage.getItem('basil-garden') || '{"plants":[]}').plants));
    const card = () => page.evaluate(() => { const c = document.querySelector('.g-card'); return c ? { titles: [...c.querySelectorAll('.g-task b')].map(b => b.textContent), next: (c.querySelector('.g-next') || {}).textContent || '' } : null; });
    // the form: how it began, the variety, the date
    const fill = async (start, variety, daysAgo, name) => {
      await page.click(`#g-form [data-g-start="${start}"]`);
      if (variety) await page.selectOption('#g-variety', variety);
      if (name) await page.fill('#g-name', name);
      await page.fill('#g-date', iso(-daysAgo));
      await page.click('#g-form button[type="submit"]');
      await page.waitForTimeout(300);
    };
    const closeG = async () => { await page.click('#sheet-garden [data-close]'); await page.waitForTimeout(450); };

    await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
    await page.evaluate(() => localStorage.removeItem('basil-garden'));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);
    const empty = await page.evaluate(() => ({ starts: document.querySelectorAll('#garden-home .g-starts [data-garden-add]').length, h: (document.getElementById('moy-h') || {}).textContent }));
    ok(empty.starts === 3 && /Мой/.test(empty.h), M + 'empty block invites to add a bush ' + JSON.stringify(empty));

    // a clove basil sown 40 days ago: the first pinch is due now, feeding comes round
    await page.click('#garden-home [data-garden-add="seed"]');
    await page.waitForTimeout(450);
    await fill('seed', 'Гвоздичный', 40, 'Гвоздичный на кухне');
    const sheet = await page.evaluate(() => ({ open: document.getElementById('sheet-garden').open, text: document.getElementById('garden-detail').innerText }));
    ok(sheet.open && /Гвоздичный на кухне/.test(sheet.text) && /41-й день/.test(sheet.text) && /Первое прищипывание/.test(sheet.text), M + 'saved bush shows its plan in the sheet');
    await closeG();
    const c1 = await card();
    ok(c1 && c1.titles.includes('Первое прищипывание') && c1.titles.includes('Подкормка'), M + 'this week: pinch and feeding ' + JSON.stringify(c1));

    // «Сделано» on the pinch: gone from the week, written in the diary
    await page.click('.g-card .g-done[data-task="pinch1"]');
    await page.waitForTimeout(300);
    const c2 = await card();
    const p2 = (await plants())[0];
    ok(!c2.titles.includes('Первое прищипывание') && p2.log.some(e => e.task === 'pinch1' && e.d === iso(0)), M + '«Сделано» closes the task and writes the diary ' + JSON.stringify(p2.log));

    // «Подкормил»: the next feeding moves ten days on
    await page.click('.g-card .g-note[data-note="feed"]');
    await page.waitForTimeout(300);
    const c3 = await card();
    await page.click('.g-card [data-plant-open]');
    await page.waitForTimeout(450);
    const plan = await page.evaluate(() => [...document.querySelectorAll('.g-step.is-repeat')].map(li => li.textContent));
    const want = new Date(); want.setDate(want.getDate() + 10);
    const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const wantText = `${want.getDate()} ${MON[want.getMonth()]}Подкормка`;
    ok(!c3.titles.includes('Подкормка') && plan.some(t => t.startsWith(wantText)), M + '«Подкормил» moves the next feeding by 10 days ' + JSON.stringify(plan));

    // a harvest in the diary with grams
    await page.selectOption('#g-log-k', 'cut');
    await page.fill('#g-log-g', '35');
    await page.click('#g-log-form button[type="submit"]');
    await page.waitForTimeout(300);
    const grams = await page.evaluate(() => (document.querySelector('.g-sec h4 small') || {}).textContent || '');
    ok(/35/.test(grams), M + 'harvest grams are summed ' + grams);

    // edit
    await page.click('#garden-detail [data-g-edit]');
    await page.waitForTimeout(200);
    await page.fill('#g-name', 'Гвоздичный у окна');
    await page.click('#g-form button[type="submit"]');
    await page.waitForTimeout(300);
    await closeG();
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);
    const kept = await page.evaluate(() => [...document.querySelectorAll('.g-card h3')].map(h => h.textContent));
    ok(kept.length === 1 && kept[0] === 'Гвоздичный у окна', M + 'edited and kept after reload ' + JSON.stringify(kept));

    // a copy in a file, the bush deleted, the copy read back
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-garden-export]')]);
    const file = await dl.path();
    const copy = JSON.parse(fs.readFileSync(file, 'utf8'));
    await page.click('.g-card [data-plant-open]');
    await page.waitForTimeout(450);
    await page.click('#garden-detail [data-g-del]');
    await page.waitForTimeout(600);
    const gone = (await plants()).length;
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#garden-home [data-garden-import]')]);
    await chooser.setFiles(file);
    await page.waitForTimeout(500);
    const back = await plants();
    ok(copy.plants.length === 1 && gone === 0 && back.length === 1 && back[0].log.length === copy.plants[0].log.length && back[0].name === 'Гвоздичный у окна', M + 'copy to a file and back ' + JSON.stringify({ copy: copy.plants.length, gone, back: back.length }));

    // «Растёт у меня» from a variety card on another page
    await page.goto(fileUrl('sorta.html'), { waitUntil: 'load' });
    await page.waitForTimeout(600);
    await page.evaluate(() => { const t = [...document.querySelectorAll('.vtype')].find(x => x.dataset.t === 'purple') || document.querySelector('.vtype'); t.click(); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { const s = [...document.querySelectorAll('[data-i]')].find(x => /Пурпурный шар/.test(x.textContent)) || document.querySelector('.vt-panel [data-i]'); s.click(); });
    await page.waitForTimeout(500);
    await page.click('#sheet-variety [data-garden-add]');
    await page.waitForTimeout(500);
    const pre = await page.evaluate(() => ({ variety: document.getElementById('g-variety').value, other: document.getElementById('sheet-variety').open }));
    await fill('shop', null, 12);
    ok(pre.variety && !pre.other && (await plants()).some(p => p.variety === pre.variety && p.start === 'shop'), M + '«Растёт у меня» brings the variety ' + JSON.stringify(pre));
    await closeG();

    // the home page with three bushes: nothing on the pictures, nothing wider than the screen
    await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
    await page.evaluate(() => {
      const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
      const today = d(0);
      localStorage.setItem('basil-garden', JSON.stringify({ v: 1, plants: [
        { id: 'a', name: 'Гвоздичный на кухне', variety: 'Гвоздичный', start: 'seed', place: 'home', date: d(40), added: today, log: [] },
        { id: 'b', name: 'Пурпурный шар', variety: 'Пурпурный шар', start: 'shop', place: 'balcony', preset: 'temperate', date: d(12), added: today, log: [] },
        { id: 'c', name: 'Хлопец кучерявый', variety: 'Хлопец кучерявый', start: 'seed', place: 'garden', preset: 'temperate', date: d(120), added: d(30), log: [{ d: d(20), k: 'water' }] }
      ] }));
    });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(600);
    const three = await page.evaluate(() => document.querySelectorAll('.g-card').length);
    await page.evaluate(() => document.getElementById('moy-home').scrollIntoView());
    await page.waitForTimeout(300);
    const r = await page.evaluate(audit);
    const bad = [...r.A.map(x => 'A ' + x), ...r.B.map(x => 'B ' + x), ...r.C.map(x => 'C ' + x)];
    ok(three === 3 && !bad.length, M + 'home with three bushes lays out clean ' + (bad.length ? '\n    ' + bad.slice(0, 8).join('\n    ') : ''));

    // the page «Мой базилик»: the same three bushes, the badge on every page counts their week, the home block leads there
    const due = await page.evaluate(() => [...document.querySelectorAll('.g-card .g-task, .g-common .g-task')].length);
    const badge = await page.evaluate(() => [...document.querySelectorAll('.garden-badge')].filter(b => b.getClientRects().length).map(b => b.textContent));
    const more = await page.evaluate(() => (document.querySelector('#garden-home .g-more a') || {}).href || '');
    await page.goto(fileUrl('moy.html'), { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const pg = await page.evaluate(() => ({
      cards: document.querySelectorAll('#garden-page .g-card').length, h: (document.getElementById('moy-page-h') || {}).textContent,
      title: document.title, active: [...document.querySelectorAll('[data-garden-link]')].filter(a => a.getClientRects().length).map(a => a.classList.contains('is-active'))
    }));
    ok(due > 0 && badge.length === 1 && badge[0] === String(due) && /moy\.html/.test(more) && pg.cards === 3 && /неделе/.test(pg.h) && /^Мой базилик/.test(pg.title) && pg.active.length === 1 && pg.active[0],
      M + 'page «Мой базилик» and the badge ' + JSON.stringify({ due, badge, more: more.split('/').pop(), pg }));
    const r2 = await page.evaluate(audit);
    const bad2 = [...r2.A.map(x => 'A ' + x), ...r2.B.map(x => 'B ' + x), ...r2.C.map(x => 'C ' + x)];
    ok(!bad2.length, M + 'the page with three bushes lays out clean ' + (bad2.length ? '\n    ' + bad2.slice(0, 8).join('\n    ') : ''));
    await page.evaluate(() => localStorage.removeItem('basil-garden'));
    await ctx.close();
  }
  await browser.close();
  done(errs);
})();
