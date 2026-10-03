/* «Карманный агроном»: погода для кустов (ответы Open-Meteo подменены заготовками, сеть не нужна).
   - без выбранного места ни одна страница не обращается к сервису погоды, даже с кустами на балконе и грядке;
   - вкладка «Погода»: поиск места, прогноз на неделю, два графика на 48 часов, «Сегодня для листа»;
     координаты уходят округлёнными; «Где я» — с точностью около 10 км;
   - погодные дела у кустов на улице (самая холодная ночь: балкону «занесите», грядке «укройте»; жара),
     совет про дождь у грядки, ни одного погодного дела у куста на окне; «Сделано» закрывает дело;
   - без сети виден прежний прогноз с его возрастом;
   - вкладка и карточки с погодой ничего не перекрывают и не шире экрана (аудит из overlap.js).
   python3 scripts/build.py && node tests/agronom.js */
const { playwright, ok, done, watch, fileUrl, FILES } = require('./lib');
const { audit } = require('./overlap');

const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// a week from today: rain today, the coldest night on day 2 (+4 °C), heat on day 4 (+33 °C)
const WEEK = { min: [9, 7, 4, 6, 12, 11, 10], max: [17, 15, 13, 20, 33, 26, 22], rain: [12, 0, 0.4, 0, 0, 3, 0], sun: [1, 2, 6, 8, 11, 9, 7] };
function forecast() {
  const daily = { time: [], temperature_2m_min: [], temperature_2m_max: [], precipitation_sum: [], sunshine_duration: [], daylight_duration: [] };
  const hourly = { time: [], temperature_2m: [], relative_humidity_2m: [] };
  for (let i = 0; i < 7; i++) {
    daily.time.push(iso(i));
    daily.temperature_2m_min.push(WEEK.min[i]);
    daily.temperature_2m_max.push(WEEK.max[i]);
    daily.precipitation_sum.push(WEEK.rain[i]);
    daily.sunshine_duration.push(WEEK.sun[i] * 3600);
    daily.daylight_duration.push(11 * 3600);
    for (let hh = 0; hh < 24; hh++) {
      const k = (1 - Math.cos((hh - 4) / 24 * 2 * Math.PI)) / 2; // coldest at 4, warmest at 16
      hourly.time.push(`${iso(i)}T${String(hh).padStart(2, '0')}:00`);
      hourly.temperature_2m.push(Math.round((WEEK.min[i] + (WEEK.max[i] - WEEK.min[i]) * k) * 10) / 10);
      hourly.relative_humidity_2m.push(Math.round(92 - 55 * k));
    }
  }
  return { latitude: 51.67, longitude: 39.18, timezone: 'Europe/Moscow', daily, hourly };
}
const PLACES = { results: [
  { name: 'Воронеж', latitude: 51.67204, longitude: 39.1843, admin1: 'Воронежская область', country: 'Россия', timezone: 'Europe/Moscow' },
  { name: 'Воронеж', latitude: 50.84, longitude: 37.53, admin1: 'Курская область', country: 'Россия', timezone: 'Europe/Moscow' }
] };
// experiments going on: [experiment, hours since the start, settings, records [hours, group, values], what the conclusion says]
const EXP_RUNS = [
  ['litmus', 0.3, {}, [[0.2, 0, { ph: 7 }], [0.2, 1, { ph: 3 }], [0.2, 2, { ph: 8 }]], /Работает как лакмус/],
  ['osmos', 7, { tsp: 1 }, [[0, 0, { firm: 3 }], [0, 1, { firm: 3 }], [1, 0, { firm: 3 }], [1, 1, { firm: 2 }], [3, 0, { firm: 3 }], [3, 1, { firm: 1 }]], /забрала у листа упругость за 3/],
  ['germ', 5 * 24, { tA: 24, tB: 17, n: 10 }, [[24, 0, { cnt: 0 }], [24, 1, { cnt: 0 }], [48, 0, { cnt: 1 }], [48, 1, { cnt: 0 }], [72, 0, { cnt: 4 }], [72, 1, { cnt: 0 }], [96, 0, { cnt: 8 }], [96, 1, { cnt: 1 }]], /половина семян проросла/],
  ['sweat', 50, {}, [[0, 0, { g: 812, t: 22, rh: 40 }], [12, 0, { g: 798, t: 24, rh: 35 }], [24, 0, { g: 790, t: 20, rh: 60 }], [36, 0, { g: 776, t: 25, rh: 30 }], [48, 0, { g: 770, t: 21, rh: 55 }]], /Куст отдаёт воздуху около \d+/],
  ['light', 80, {}, [[0, 0, { deg: 0 }], [24, 0, { deg: 20 }], [48, 0, { deg: 32 }], [60, 0, { deg: -10 }], [72, 0, { deg: 8 }]], /снова встала к свету за 24/],
  ['apex', 15 * 24, { plants: [null, null] }, [[0, 0, { tops: 1, hcm: 12 }], [0, 1, { tops: 1, hcm: 13 }], [168, 0, { tops: 2, hcm: 14 }], [168, 1, { tops: 1, hcm: 17 }], [336, 0, { tops: 2, hcm: 16 }], [336, 1, { tops: 1, hcm: 22 }]], /У прищипнутого куста 2 верхушки, у нетронутого — 1/],
  ['roots', 9 * 24, { tA: 24, tB: 18 }, [[48, 0, { mm: 0 }], [48, 1, { mm: 0 }], [96, 0, { mm: 0 }], [96, 1, { mm: 0 }], [144, 0, { mm: 5 }], [144, 1, { mm: 0 }], [192, 0, { mm: 15 }], [192, 1, { mm: 0 }]], /первые корешки — к 6-му дню/],
  ['dark', 6.5 * 24, {}, [[24, 0, { mm: 4, col: 2 }], [24, 1, { mm: 10, col: 0 }], [72, 0, { mm: 9 }], [72, 1, { mm: 30, col: 0 }], [120, 0, { mm: 18 }], [120, 1, { mm: 52, col: 0 }], [144, 1, { mm: 56, col: 1 }]], /В темноте ростки в 2,9 раза выше/]
];
const bushes = () => ({ v: 2, plants: [
  { id: 'b1', name: 'Балконный', variety: '', start: 'shop', place: 'balcony', preset: 'temperate', date: iso(-30), added: iso(-30), log: [] },
  { id: 'g1', name: 'На грядке', variety: '', start: 'seedling', place: 'garden', preset: 'temperate', date: iso(-30), added: iso(-30), log: [] },
  { id: 'h1', name: 'На окне', variety: '', start: 'seed', place: 'home', date: iso(-30), added: iso(-30), log: [] }
] });

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  for (const mode of ['phone', 'desktop']) {
    const M = mode.padEnd(7) + ' ';
    const ctx = await browser.newContext({ ...(mode === 'phone' ? devices['iPhone 13 Mini'] : { viewport: { width: 1280, height: 900 } }), reducedMotion: 'reduce', geolocation: { latitude: 55.7512, longitude: 37.6184 }, permissions: ['geolocation'] });
    const asked = [];
    let offline = false;
    await ctx.route(/open-meteo\.com/, route => {
      const u = route.request().url();
      asked.push(u);
      if (offline) return route.abort('internetdisconnected');
      return route.fulfill({ json: /geocoding/.test(u) ? PLACES : forecast() });
    });
    const page = await ctx.newPage();
    watch(page, errs);
    page.on('dialog', d => d.accept());
    const setStore = s => page.evaluate(v => { localStorage.setItem('basil-garden', JSON.stringify(v)); localStorage.removeItem('basil-weather'); }, s);

    // 1. no place chosen: nobody is asked, on any page
    await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
    await setStore(bushes());
    for (const f of FILES) {
      await page.goto(fileUrl(f), { waitUntil: 'load' });
      await page.waitForTimeout(f === 'moy.html' ? 2600 : 300);
    }
    const invite = await page.evaluate(() => (document.querySelector('#garden-page .g-wx-strip') || {}).textContent || '');
    ok(!asked.length && /Укажите город/.test(invite), M + `no place, no request to the weather service on ${FILES.length} pages (${asked.length}); the page invites to choose a place`);

    // 2. the weather tab: find the place, the week, two charts, the leaf today
    await page.evaluate(() => { location.hash = 'погода'; });
    await page.waitForSelector('#wx-q', { timeout: 8000 });
    await page.fill('#wx-q', 'Воронеж');
    await page.click('#wx-find button[type="submit"]');
    await page.waitForSelector('[data-wx-pick="0"]', { timeout: 5000 });
    const found = await page.evaluate(() => [...document.querySelectorAll('.wx-pick')].map(b => b.textContent.replace(/\s+/g, ' ').trim()));
    await page.click('[data-wx-pick="0"]');
    await page.waitForSelector('.wx-day', { timeout: 5000 });
    await page.waitForTimeout(300);
    const tab = await page.evaluate(() => ({
      days: document.querySelectorAll('.wx-day').length, cold: document.querySelectorAll('.wx-day.is-cold, .wx-day.is-frost').length, hot: document.querySelectorAll('.wx-day.is-hot').length,
      charts: document.querySelectorAll('.wx-charts svg .line').length, leaf: (document.querySelector('.wx-leaf h4') || {}).textContent || '', src: !!document.querySelector('.wx-src a[href^="https://open-meteo.com"]'),
      where: JSON.parse(localStorage.getItem('basil-garden')).where
    }));
    const fc = asked.filter(u => /\/v1\/forecast/.test(u)).pop() || '';
    ok(found.length === 2 && /Воронежская область/.test(found[0]) && tab.days === 7 && tab.cold === 4 && tab.hot === 1 && tab.charts === 2 && /^Сегодня для листа: /.test(tab.leaf) && tab.src &&
      tab.where && tab.where.lat === 51.67 && /latitude=51\.67&longitude=39\.18&/.test(fc),
    M + 'weather tab: a place found and kept, the week, two charts, the leaf today, rounded coordinates ' + JSON.stringify(Object.assign({}, tab, { where: tab.where && tab.where.name })));
    const r1 = await page.evaluate(audit);
    const bad1 = [...r1.A.map(x => 'A ' + x), ...r1.B.map(x => 'B ' + x), ...r1.C.map(x => 'C ' + x)];
    ok(!bad1.length, M + 'the weather tab lays out clean' + (bad1.length ? '\n    ' + bad1.slice(0, 8).join('\n    ') : ''));

    // 3. the tasks it brings: outdoors only, worded for the place; the rain for the bed; the strip over the bushes
    await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const cards = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#garden-home .g-card')].map(c => [c.dataset.plantCard, {
      wx: [...c.querySelectorAll('.g-task.is-wx')].map(t => t.querySelector('b').textContent + ' | ' + t.querySelector('small').textContent),
      advice: [...c.querySelectorAll('.g-wx')].map(a => a.textContent)
    }])));
    const strip = await page.evaluate(() => (document.querySelector('#garden-home .g-wx-strip') || {}).textContent || '');
    const b = cards.b1 || { wx: [], advice: [] }, g = cards.g1 || { wx: [], advice: [] }, hm = cards.h1 || { wx: [], advice: [] };
    ok(b.wx.some(t => /^Ночью до \+4\s°C — занесите на ночь \| .+ ночью$/.test(t)) && b.wx.some(t => /^Жара до \+33\s°C/.test(t)) &&
      g.wx.some(t => /укройте грядку/.test(t)) && g.advice.some(a => /^Дождь 12\sмм сегодня/.test(a)) && !b.advice.some(a => /Дождь/.test(a)) &&
      !hm.wx.length && /Воронеж: ночью \+9\s°C, днём до \+17\s°C, дождь 12\sмм/.test(strip),
    M + 'weather tasks for the bushes outdoors, none on the windowsill ' + JSON.stringify({ b: b.wx, g: g.wx, gAdvice: g.advice, home: hm.wx.length }));

    // «Сделано» on the cold night: gone, written in the diary
    await page.click('#garden-home [data-plant-card="b1"] .g-task.is-wx-chill .g-done');
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({ left: document.querySelectorAll('#garden-home [data-plant-card="b1"] .g-task.is-wx-chill').length, log: JSON.parse(localStorage.getItem('basil-garden')).plants.find(p => p.id === 'b1').log }));
    ok(!after.left && after.log.some(e => /^wx-chill-\d{4}-\d{2}-\d{2}$/.test(e.task)), M + '«Сделано» closes a weather task ' + JSON.stringify(after.log));

    // 4. no network: the kept forecast, with its age
    offline = true;
    await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('basil-weather')); c.at -= 5 * 3600e3; localStorage.setItem('basil-weather', JSON.stringify(c)); });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2600);
    const old = await page.evaluate(() => ({ strip: (document.querySelector('#garden-home .g-wx-strip') || {}).textContent || '', heat: document.querySelectorAll('#garden-home .g-task.is-wx-heat').length }));
    ok(/5\sч назад/.test(old.strip) && old.heat === 2, M + 'offline: the kept forecast with its age ' + JSON.stringify(old));
    offline = false;

    // 5. «Где я»: the phone's position, to about 10 km
    await page.goto(fileUrl('moy.html#погода'), { waitUntil: 'load' });
    await page.waitForSelector('[data-wx-change]', { timeout: 8000 });
    await page.click('[data-wx-change]');
    await page.click('[data-wx-here]');
    await page.waitForFunction(() => (JSON.parse(localStorage.getItem('basil-garden')).where || {}).name === 'Где я сейчас', null, { timeout: 8000 }).catch(() => {});
    const here = await page.evaluate(() => JSON.parse(localStorage.getItem('basil-garden')).where);
    ok(here && here.lat === 55.8 && here.lon === 37.6, M + '«Где я» keeps the position rounded to 0.1° ' + JSON.stringify(here));

    // the page of bushes with the weather: clean
    await page.goto(fileUrl('moy.html'), { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const r2 = await page.evaluate(audit);
    const bad2 = [...r2.A.map(x => 'A ' + x), ...r2.B.map(x => 'B ' + x), ...r2.C.map(x => 'C ' + x)];
    ok(!bad2.length, M + 'the bushes with the weather lay out clean' + (bad2.length ? '\n    ' + bad2.slice(0, 8).join('\n    ') : ''));

    // 6. the experiments, going on with records: each draws its chart and says what the numbers mean
    await page.evaluate(runs => {
      const H = 3600e3, now = Date.now(), p = n => String(n).padStart(2, '0');
      const iso = ms => { const d = new Date(ms); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
      const exps = runs.map(([exp, ago, cfg, recs], i) => { const t0 = now - ago * H; return { id: 'x' + i, exp, start: iso(t0), t0, cfg, done: [0], recs: recs.map(([h, g, v]) => ({ at: t0 + h * H + g, g, v })) }; });
      localStorage.setItem('basil-garden', JSON.stringify({ v: 2, plants: [], exps }));
    }, EXP_RUNS);
    // from another page: the same page with only a new anchor would not load again
    await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
    await page.goto(fileUrl('moy.html#опыты'), { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const opened = await page.evaluate(() => [...document.querySelectorAll('.exp-card[open]')].length);
    const seen = {};
    for (const [exp] of EXP_RUNS) {
      await page.evaluate(id => document.querySelector(`#opyt-${id} .lab-tool`).scrollIntoView({ block: 'center', behavior: 'instant' }), exp);
      await page.waitForFunction(id => document.querySelector(`#opyt-${id} .lab-tool[data-ready]`), exp, { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(250);
      seen[exp] = await page.evaluate(id => {
        const el = document.querySelector(`#opyt-${id} .lab-tool`);
        return { chart: el.querySelectorAll('svg.lab-svg circle').length + el.querySelectorAll('.exp-lt-sw').length, verdict: ((el.querySelector('.exp-verdict') || {}).textContent || '').replace(/\u00a0/g, ' '), steps: el.querySelectorAll('.exp-steps li').length };
      }, exp);
    }
    const missing = EXP_RUNS.filter(([exp, , , , says]) => !(seen[exp] && seen[exp].chart > 0 && seen[exp].steps > 0 && says.test(seen[exp].verdict))).map(([exp]) => `${exp}: ${JSON.stringify(seen[exp])}`);
    ok(opened === EXP_RUNS.length && !missing.length, M + `${EXP_RUNS.length} experiments going on: open, a chart each, a conclusion against the model` + (missing.length ? '\n    ' + missing.join('\n    ') : ''));
    const r3 = await page.evaluate(audit);
    const bad3 = [...r3.A.map(x => 'A ' + x), ...r3.B.map(x => 'B ' + x), ...r3.C.map(x => 'C ' + x)];
    ok(!bad3.length, M + 'the experiments tab lays out clean' + (bad3.length ? '\n    ' + bad3.slice(0, 8).join('\n    ') : ''));

    // a record through the form, then the end: the run goes into the history with its conclusion
    await page.evaluate(() => document.querySelector('#opyt-osmos .lab-tool').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.click('#opyt-osmos [data-f="firm"][data-g="0"][data-v="3"]');
    await page.click('#opyt-osmos [data-f="firm"][data-g="1"][data-v="0"]');
    await page.click('#opyt-osmos [data-ex-form] button[type="submit"]');
    await page.waitForTimeout(400);
    const rec = await page.evaluate(() => { const x = JSON.parse(localStorage.getItem('basil-garden')).exps.find(e => e.exp === 'osmos'); return { n: x.recs.length, done: x.done }; });
    await page.click('#opyt-osmos [data-ex-end]');
    await page.waitForTimeout(400);
    const ended = await page.evaluate(() => { const x = JSON.parse(localStorage.getItem('basil-garden')).exps.find(e => e.exp === 'osmos'); return { end: !!x.end, verdict: x.verdict || '', past: document.querySelectorAll('#opyt-osmos .exp-past-run').length, start: !!document.querySelector('#opyt-osmos [data-ex-start]') }; });
    ok(rec.n === EXP_RUNS.find(r => r[0] === 'osmos')[3].length + 2 && rec.done.length > 1 && ended.end && /упругость/.test(ended.verdict) && ended.past === 1 && ended.start,
      M + 'a record through the form marks the step; «Закончить» keeps the run with its conclusion ' + JSON.stringify({ rec, ended: Object.assign({}, ended, { verdict: ended.verdict.length }) }));

    // and the steps due now stand among the tasks on the home page
    await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const homeExp = await page.evaluate(() => [...document.querySelectorAll('#garden-home .g-exp-card .g-task')].map(t => t.querySelector('b').textContent));
    ok(homeExp.length >= 5 && homeExp.every(t => /^«.+»: /.test(t)), M + `the experiments' steps on the home page: ${homeExp.length}`);
    await page.evaluate(() => { localStorage.removeItem('basil-garden'); localStorage.removeItem('basil-weather'); });
    await ctx.close();
  }
  await browser.close();
  done(errs);
})();
