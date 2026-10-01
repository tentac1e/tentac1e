/* Навигация на телефоне и компьютере: страница открывается сверху, «Вы остановились здесь»,
   «Продолжить» с главной, «Дальше» в конце вкладки, вкладки в листе глав, тактильный отклик.
   python3 scripts/build.py --clean --out dist/site && node tests/nav.js */
const { playwright, server, ok, done } = require('./lib');

(async () => {
  const { chromium, devices } = playwright();
  const srv = await server();
  const B = srv.base, U = p => B + encodeURI(p);
  const browser = await chromium.launch();
  const errs = [];
  // ---------- phone ----------
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  await ctx.addInitScript(() => { window.__vib = 0; navigator.vibrate = () => { window.__vib++; return true; }; });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message));
  const path = () => decodeURI(page.url().replace(B, ''));
  const Y = () => page.evaluate(() => Math.round(scrollY));
  await page.goto(U('/уход'), { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  // read down the page like a person
  await page.mouse.move(200, 400);
  for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(60); }
  await page.waitForTimeout(900);
  const y1 = await Y();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('basil-pos') || '{}').uhod);
  ok(saved && saved.y > 2000 && saved.anchor, `position saved at ${y1}: ${JSON.stringify(saved)}`);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const pill = await page.evaluate(() => { const p = document.querySelector('.resume-pill'); return p ? p.textContent.trim() : null; });
  ok(await Y() === 0 && pill, `reload opens at top (${await Y()}) and offers «${pill}»`);
  await page.tap('.resume-go');
  await page.waitForTimeout(1600);
  const y2 = await Y();
  ok(Math.abs(y2 - y1) < 160, `pill returns to the spot: ${y2} vs ${y1}`);
  // leave and come back with Back
  await page.goto(U('/удобрения'), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.goBack({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
  ok(await Y() === 0 && await page.evaluate(() => !!document.querySelector('.resume-pill')), `back opens at top (${await Y()}) with the pill`);
  // plain link into the chapter: top, pill
  await page.goto(U('/'), { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const cont = await page.evaluate(() => { const c = document.getElementById('continue'); return { hidden: c.hidden, href: c.getAttribute('href'), t: document.getElementById('continue-title').textContent }; });
  ok(!cont.hidden && /^уход\?resume=1#/.test(cont.href) && /«/.test(cont.t), 'home continue ' + JSON.stringify(cont));
  await page.evaluate(() => document.getElementById('continue').scrollIntoView({ block: 'center' }));
  await Promise.all([page.waitForNavigation(), page.tap('#continue')]);
  await page.waitForTimeout(1800);
  const y3 = await Y();
  ok(Math.abs(y3 - y1) < 160 && !/resume/.test(page.url()) && !(await page.evaluate(() => !!document.querySelector('.resume-pill'))), `continue lands on the spot: ${y3} vs ${y1}, url ${path()}`);
  // next tab at the end of a tab
  await page.goto(U('/удобрения'), { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const nexts = await page.evaluate(() => [...document.querySelectorAll('[data-panel]')].map(p => !!p.querySelector('.panel-next')));
  ok(nexts.slice(0, -1).every(Boolean) && !nexts[nexts.length - 1], 'every tab but the last ends with «Дальше» ' + nexts.join());
  await page.evaluate(() => document.querySelector('.panel.is-active .panel-next').scrollIntoView({ block: 'center' }));
  await page.tap('.panel.is-active .panel-next');
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => ({ id: document.querySelector('.panel.is-active').id, sub: Math.round(document.querySelector('.subnav-wrap').getBoundingClientRect().top) }));
  ok(st.id === 'элементы' && st.sub < 140, 'next tab opens at its start ' + JSON.stringify(st) + ' ' + path());
  // chapters sheet shows this chapter's tabs
  await page.tap('.tabbar [data-open="sheet-chapters"]');
  await page.waitForTimeout(500);
  const chips = await page.evaluate(() => [...document.querySelectorAll('.sheet-tabs .chip')].map(a => a.textContent));
  ok(chips.length === 8, 'sheet tabs ' + chips.join(' | '));
  await page.tap('.sheet-tabs .chip:nth-child(4)');
  await page.waitForTimeout(800);
  ok(await page.evaluate(() => document.querySelector('.panel.is-active').id === 'план' && !document.getElementById('sheet-chapters').open), 'sheet tab chip → ' + path());
  // a sheet follows the finger: by its grabber, by the list when the list is at its top; short of a third
  // it springs back, past it or on a flick it closes; the page under it never moves
  const cdp = await ctx.newCDPSession(page);
  let clock = 0;
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts, timestamp: clock });
  // the finger at its own pace: the event clock steps `ms` per move however slow the machine is
  const drag = async (x, y0, y1, steps = 8, ms = 40) => { clock = Date.now() / 1000; await send('touchStart', [{ x, y: y0 }]); for (let i = 1; i <= steps; i++) { clock += ms / 1000; await send('touchMove', [{ x, y: y0 + (y1 - y0) * i / steps }]); } };
  // let go after holding still, or at once (a flick keeps its speed)
  const lift = async (held = true) => { clock = held ? Math.max(clock + 0.5, Date.now() / 1000) : clock + 0.016; await send('touchEnd', []); };
  const sheet = () => page.evaluate(() => { const d = document.getElementById('sheet-chapters'); const r = d.getBoundingClientRect(); return { open: d.open, top: Math.round(r.top), h: Math.round(r.height), fade: +getComputedStyle(d, '::backdrop').opacity, list: Math.round(d.querySelector('.sheet-inner').scrollTop), focus: document.activeElement === d, y: Math.round(scrollY) }; });
  const openCh = async () => { await page.tap('.tabbar [data-open="sheet-chapters"]'); await page.waitForTimeout(600); return sheet(); };
  const s0 = await openCh();
  const grab = await page.evaluate(() => { const r = document.querySelector('#sheet-chapters .sheet-grab').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await drag(grab[0], grab[1], grab[1] + 100);
  const s1 = await sheet();
  await lift();
  await page.waitForTimeout(450);
  const s2 = await sheet();
  ok(s0.open && s0.focus && Math.abs(s1.top - s0.top - 100) <= 2 && s1.fade < 0.9 && s2.open && s2.top === s0.top, 'sheet follows the grabber, springs back ' + JSON.stringify([s0, s1, s2]));
  await page.evaluate(() => { document.querySelector('#sheet-chapters .sheet-inner').scrollTop = 300; });
  await drag(200, s0.top + 300, s0.top + 450, 10);
  await lift();
  await page.waitForTimeout(400);
  const s3 = await sheet();
  await page.evaluate(() => { document.querySelector('#sheet-chapters .sheet-inner').scrollTop = 0; });
  await drag(200, s0.top + 300, s0.top + 420, 8);
  const s4 = await sheet();
  await lift();
  await page.waitForTimeout(450);
  ok(s3.open && s3.top === s0.top && s3.list < 300 && s4.top > s0.top + 60, 'the list scrolls, at its top the sheet goes ' + JSON.stringify([s3, s4]));
  await drag(grab[0], grab[1], grab[1] + s0.h * 0.45, 10);
  await lift();
  await page.waitForTimeout(500);
  const s5 = await sheet();
  await openCh();
  await drag(grab[0], grab[1], grab[1] + 60, 4, 12);
  await lift(false);
  await page.waitForTimeout(500);
  const s6 = await sheet();
  await openCh();
  await drag(200, 40, 300, 8);
  await lift();
  await page.waitForTimeout(300);
  const s7 = await sheet();
  ok(!s5.open && !s6.open && s7.open && s7.y === s0.y, 'closes past a third and on a flick; the backdrop does not scroll the page ' + JSON.stringify([s5.open, s6.open, s7]));
  await page.tap('#sheet-chapters [data-close]');
  await page.waitForTimeout(500);
  ok(!(await sheet()).open, 'closes with ×');
  // haptics: taps and sliders
  const v0 = await page.evaluate(() => window.__vib);
  await page.tap('.subnav a[href="#калькулятор"]');
  await page.waitForTimeout(300);
  const range = await page.$('.panel.is-active input[type="range"]');
  if (range) {
    const b = await range.boundingBox();
    await page.touchscreen.tap(b.x + 4, b.y + b.height / 2);
    await page.evaluate(el => { for (let v = +el.min; v <= +el.max; v += (+el.step || 1) * 3) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } }, range);
  }
  await page.waitForTimeout(200);
  const v1 = await page.evaluate(() => window.__vib);
  ok(v1 > v0, `vibration on tab tap and slider: ${v1 - v0} pulses`);
  const hap = await page.evaluate(() => ({ sup: window.BasilHaptics.supported, en: window.BasilHaptics.enabled }));
  await page.tap('#deep-toggle');
  await page.waitForTimeout(300);
  const hasSwitch = await page.evaluate(() => !!document.querySelector('.depth-pop [data-haptics]'));
  await page.tap('.depth-pop [data-haptics]');
  const off = await page.evaluate(() => ({ en: window.BasilHaptics.enabled, ls: localStorage.getItem('basil-haptics'), aria: document.querySelector('[data-haptics]').getAttribute('aria-checked') }));
  ok(hap.sup && hasSwitch && !off.en && off.ls === '0' && off.aria === 'false', 'haptics switch ' + JSON.stringify({ hap, off }));
  await page.tap('.depth-pop [data-haptics]');
  await ctx.close();
  // ---------- desktop: the chapter's own link goes to the top, no haptics UI ----------
  const d = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  d.on('pageerror', e => errs.push(e.message));
  await d.goto(U('/уход'), { waitUntil: 'load' });
  await d.waitForTimeout(900);
  await d.evaluate(() => window.scrollTo(0, 2500));
  await d.waitForTimeout(300);
  await d.click('#nav a[data-nav="uhod"]');
  await d.waitForTimeout(1200);
  ok(await d.evaluate(() => scrollY) < 5, 'own chapter link scrolls to top ' + await d.evaluate(() => scrollY));
  await d.click('#deep-toggle');
  ok(!(await d.evaluate(() => !!document.querySelector('[data-haptics]'))), 'no haptics switch on desktop');
  await browser.close();
  srv.stop();
  done(errs);
})();
