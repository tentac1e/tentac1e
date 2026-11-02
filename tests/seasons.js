/* Гид в каждый месяц года: всё, что пишет сегодняшняя дата, — в двенадцать дней, 15-го числа каждого месяца,
   на телефоне и на компьютере. Остальные проверки видят только день, в который их запустили, а строка
   «Сейчас в саду» на главной, календарь посадки, план подкормок, модели солнца и длины дня у каждого месяца свои:
   длиннее совет месяца — выше главная (а она у самого предела), другая неделя плана — другие строки.
     главная      не выше пяти экранов (HOME_MAX в lib.js), совет месяца на месте и о своём месяце;
     вкладки      «Посадка · Сроки» (календарь, длина дня), «Удобрения · По стадиям» (план подкормок),
                  «Уход · По сезонам» (солнце): текст не на картинке, подписи схем не пересечены, ничего шире
                  экрана (audit из overlap.js), контраст, шрифт, строки, карточки, предлоги (audit из design.js);
     ошибки       ни одной ошибки скрипта.
   Дата подменяется только у Date (clock.setFixedTime): кадры и таймеры идут как обычно.

   node tests/seasons.js            все двенадцать месяцев
   node tests/seasons.js 1,7        только январь и июль
   Проверяет сборку в корне репозитория (python3 scripts/build.py). */
const { playwright, ok, done, watch, fileUrl, HOME_MAX, atDate } = require('./lib');
const overlap = require('./overlap');
const design = require('./design');

const args = process.argv.slice(2);
const only = (args.find(a => !a.startsWith('--')) || '').split(',').filter(Boolean).map(Number);
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(m => !only.length || only.includes(m));
const NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
// the tabs whose content comes from the date
const TABS = [['posadka.html', 'posadka-sroki'], ['udobreniya.html', 'udobreniya-stadii'], ['uhod.html', 'uhod-sezony']];

// one month on one screen: the home page, then the tabs of the date
async function month(browser, m, view, errs) {
  const iso = `2027-${String(m).padStart(2, '0')}-15`;
  const { devices } = playwright();
  const ctx = await browser.newContext({ ...(view === 'phone' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }), reducedMotion: 'reduce' });
  await atDate(ctx, iso);
  const out = [];
  const tag = `${NAMES[m - 1].padEnd(8)} ${view.padEnd(7)}`;
  const page = await ctx.newPage();
  watch(page, errs);

  await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const home = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight,
    head: ((document.getElementById('season-h') || {}).textContent || '').replace(/ /g, ' ').trim(),
    tip: ((document.getElementById('season-text') || {}).textContent || '').trim().length,
    wide: document.documentElement.scrollWidth > innerWidth
  }));
  const max = HOME_MAX[view];
  ok(home.h <= max && home.tip > 20 && !home.wide, `${tag} главная: ${home.h} px (≤ ${max}), «${home.head}», совет месяца ${home.tip} знаков`);
  out.push(...await measure(page, tag, 'index.html', null));

  for (const [f, id] of TABS) {
    await page.goto(fileUrl(f) + '#' + id, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    out.push(...await measure(page, tag, f, id));
  }
  await ctx.close();
  return out;
}

// the tab on the screen, its deep dives open and walked down so its models are built, then both audits
async function measure(page, tag, f, id) {
  const H = await page.evaluate(() => { document.querySelectorAll('details.deep, details.deeper').forEach(d => { d.open = true; }); return document.documentElement.scrollHeight; });
  for (let y = 0; y < H; y += 700) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(40); }
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  const a = await page.evaluate(overlap.audit);
  const d = await page.evaluate(design.audit, [design.SMALL_OK, design.LOOSE.source]);
  const bad = [...a.A.map(x => 'A ' + x), ...a.B.map(x => 'B ' + x), ...a.C.map(x => 'C ' + x),
    ...Object.entries(d).flatMap(([k, l]) => l.map(s => `${design.KINDS[k]}: ${s}`))];
  return [[!bad.length, `${tag} ${f}${id ? '#' + id : ''}${bad.length ? '\n    ' + bad.slice(0, 10).join('\n    ') + (bad.length > 10 ? `\n    … +${bad.length - 10}` : '') : ''}`]];
}

(async () => {
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  const jobs = [];
  for (const m of MONTHS) for (const view of ['phone', 'desktop']) jobs.push({ m, view });
  let next = 0;
  const worker = async () => { while (next < jobs.length) { const j = jobs[next++]; j.out = await month(browser, j.m, j.view, errs); } };
  await Promise.all([1, 2, 3, 4].map(worker));
  jobs.forEach(j => j.out.forEach(([good, msg]) => ok(good, msg)));
  await browser.close();
  done(errs);
})();
