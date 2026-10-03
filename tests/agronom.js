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
    await page.evaluate(() => { localStorage.removeItem('basil-garden'); localStorage.removeItem('basil-weather'); });
    await ctx.close();
  }
  await browser.close();
  done(errs);
})();
