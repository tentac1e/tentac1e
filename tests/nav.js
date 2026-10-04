/* Навигация на телефоне и компьютере: страница открывается сверху (и страница из памяти для «Назад» тоже, одним
   прыжком, и остаётся там), «Вы остановились здесь» и «Продолжить» с главной ведут к началу предложения, на котором
   остановились (и на другой ширине экрана), «Дальше» в конце вкладки, оглавление (главы раскрываются на разделы, своя глава открыта
   и отмечена; каждый инструмент ведёт туда, где, по его подписи, лежит), тактильный отклик.
   python3 scripts/build.py --clean --out dist/site && node tests/nav.js */
const { playwright, server, ok, done, landedAt } = require('./lib');

(async () => {
  const { chromium, devices } = playwright();
  const srv = await server();
  const B = srv.base, U = p => B + encodeURI(p);
  const browser = await chromium.launch();
  const errs = [];
  // ---------- phone ----------
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  await ctx.addInitScript(() => { window.__vib = 0; navigator.vibrate = () => { window.__vib++; return true; }; });
  // a browser that scrolls a page it has just opened down by itself (as a phone does with a page it remembers)
  await ctx.addInitScript(() => {
    if (!sessionStorage.getItem('late-scroll')) return;
    sessionStorage.removeItem('late-scroll');
    addEventListener('DOMContentLoaded', () => setTimeout(() => {
      scrollTo({ top: 2500, behavior: 'instant' });
      window.__late = Math.round(scrollY);
    }, 300));
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message));
  const path = () => decodeURI(page.url().replace(B, ''));
  const Y = () => page.evaluate(() => Math.round(scrollY));
  await page.goto(U('/уход'), { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  // read down the page like a person (not to its end: there the spot cannot come up under the tabs)
  await page.mouse.move(200, 400);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(60); }
  await page.waitForTimeout(900);
  const y1 = await Y();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('basil-pos') || '{}').uhod);
  ok(saved && saved.y > 2000 && saved.anchor && saved.sig && Number.isInteger(saved.n) && Number.isInteger(saved.ch) && saved.ss,
    `position saved at ${y1} as a place in the text: ${JSON.stringify(saved)}`);
  // where the page landed: the first marked line, what is covered above it, and the words it starts with
  const landed = () => landedAt(page);
  // the spot's first line two lines under the tabs (and the gap above it when it stood lower), lower only when the
  // page has no more to scroll
  const placed = (l, pos) => !!l && (Math.abs(l.top + 1 - (l.cover + 48 + (pos.dy || 0))) <= 12 || (l.end && l.top + 1 > l.cover + 36));
  const sameWords = (l, pos) => l.words.replace(/ /g, ' ').startsWith(pos.ss.replace(/ /g, ' ').slice(0, 12));
  const atSentence = (l, pos) => placed(l, pos) && sameWords(l, pos) && l.y <= pos.y + 4 && pos.y - l.y < l.vh * 0.6;
  const posNow = () => page.evaluate(() => JSON.parse(localStorage.getItem('basil-pos') || '{}').uhod);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const pill = await page.evaluate(() => { const p = document.querySelector('.resume-pill'); return p ? p.textContent.trim() : null; });
  ok(await Y() === 0 && pill, `reload opens at top (${await Y()}) and offers «${pill}»`);
  // the bookmark as the page kept it on leaving (models built meanwhile may have moved the text)
  const saved2 = await posNow();
  await page.tap('.resume-go');
  await page.waitForTimeout(1600);
  const l2 = await landed();
  ok(atSentence(l2, saved2), `the pill returns to the start of the sentence, two lines under the tabs: ${JSON.stringify(l2)} vs ${saved2.y} «${saved2.ss}» +${saved2.dy}`);
  await page.waitForTimeout(2600);
  ok(!(await page.evaluate(() => !!document.querySelector('.resume-mark'))), 'the mark goes out');
  // a page kept in memory for Back: it opens at the top in one jump, offers the spot and stays there
  await page.evaluate(() => scrollTo({ top: 2700, behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await page.waitForTimeout(50);
  const kept0 = await Y();
  // …and the browser putting it back where it was right after showing it (a phone does)
  await page.evaluate(() => scrollTo({ top: 2500, behavior: 'instant' }));
  await page.waitForTimeout(200);
  const kept1 = await Y();
  await page.waitForTimeout(1000);
  const keptPill = await page.evaluate(() => { const p = document.querySelector('.resume-pill'); return p && p.classList.contains('is-shown'); });
  ok(kept0 === 0 && kept1 === 0 && keptPill, `a page from memory for Back: top at once (${kept0}), stays there (${kept1}), the pill stays (${keptPill})`);
  await page.tap('.resume-x');
  // leave and come back with Back
  await page.goto(U('/удобрения'), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.goBack({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
  ok(await Y() === 0 && await page.evaluate(() => !!document.querySelector('.resume-pill')), `back opens at top (${await Y()}) with the pill`);
  // a link into the chapter, and the browser scrolling it down on its own a moment later: back to the top
  await page.goto(U('/удобрения'), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.evaluate(() => sessionStorage.setItem('late-scroll', '1'));
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => document.querySelector('#sheet-toc .toc-item[data-toc="uhod"] .toc-link').click())]);
  await page.waitForTimeout(900);
  const late = await page.evaluate(() => ({ y: Math.round(scrollY), late: window.__late, path: decodeURI(location.pathname) }));
  ok(late.path === '/уход' && late.late > 2000 && late.y === 0, 'a link opens the chapter at the top and keeps it there ' + JSON.stringify(late));
  // plain link into the chapter: top, pill
  const saved3 = await posNow();
  await page.goto(U('/'), { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const cont = await page.evaluate(() => { const c = document.getElementById('continue'); return { hidden: c.hidden, href: c.getAttribute('href'), t: document.getElementById('continue-title').textContent }; });
  ok(!cont.hidden && /^уход\?resume=1#/.test(cont.href) && /«/.test(cont.t), 'home continue ' + JSON.stringify(cont));
  await page.evaluate(() => document.getElementById('continue').scrollIntoView({ block: 'center' }));
  await Promise.all([page.waitForNavigation(), page.tap('#continue')]);
  await page.waitForTimeout(1800);
  const l3 = await landed();
  ok(atSentence(l3, saved3) && !/resume/.test(page.url()) && !(await page.evaluate(() => !!document.querySelector('.resume-pill'))),
    `continue lands at the start of the sentence: ${JSON.stringify(l3)} vs ${saved3.y} «${saved3.ss}», url ${path()}`);
  // a wider screen: the lines break elsewhere, the same sentence comes back
  await page.goto(U('/'), { waitUntil: 'load' });
  const contUrl = await posNow();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(U('/уход') + '?resume=1#' + encodeURIComponent(contUrl.panel), { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  const l4 = await landed();
  ok(placed(l4, contUrl) && sameWords(l4, contUrl),
    `on a wider screen the same sentence: ${JSON.stringify(l4)} «${contUrl.ss}»`);
  await page.setViewportSize(devices['Pixel 7'].viewport);
  // a bookmark kept before (pixels under a heading): back to the start of the block that stands there
  const legacy = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('basil-pos')).uhod;
    const a = document.getElementById(p.anchor);
    const old = { panel: p.panel, anchor: p.anchor, off: 300, y: Math.round(a.getBoundingClientRect().top + scrollY + 300), label: p.label, t: Date.now() };
    localStorage.setItem('basil-pos', JSON.stringify({ uhod: old }));
    return old;
  });
  await page.goto(U('/уход') + '?resume=1#' + encodeURIComponent(legacy.panel), { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  const l5 = await landed();
  ok(placed(l5, await posNow()) && l5.y <= legacy.y + 4 && legacy.y - l5.y < l5.vh, `an old bookmark lands at the start of what stands there:${JSON.stringify(l5)} vs ${legacy.y}`);
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
  // the contents open on the reader's place: this chapter open and marked, its tab marked, the others folded
  await page.tap('.tabbar [data-open="sheet-toc"]');
  await page.waitForTimeout(500);
  const toc = await page.evaluate(() => {
    const d = document.getElementById('sheet-toc'), items = [...d.querySelectorAll('.toc-item[data-toc]')];
    const open = items.filter(li => li.classList.contains('is-open')).map(li => li.dataset.toc);
    const mine = d.querySelector('.toc-item[data-toc="udobreniya"]');
    const subs = [...mine.querySelectorAll('.toc-sub a')].map(a => a.textContent);
    const tabs = [...document.querySelectorAll('.view.is-active .subnav a')].map(a => a.textContent);
    const cur = mine.querySelector('.toc-sub a[aria-current="true"]');
    return { n: items.length, open, subs, tabs, page: mine.querySelector('.toc-link').getAttribute('aria-current'), cur: cur && decodeURIComponent(cur.hash.slice(1)),
             active: document.querySelector('.panel.is-active').id, tools: d.querySelector('.toc-tools').offsetParent !== null,
             expanded: mine.querySelector('.toc-tog').getAttribute('aria-expanded'), shut: [...d.querySelectorAll('.toc-item:not(.is-open) .toc-sub ul')].every(u => getComputedStyle(u).visibility === 'hidden') };
  });
  ok(toc.n === 13 && toc.open.join() === 'udobreniya' && toc.page === 'page' && toc.expanded === 'true' && toc.shut && !toc.tools, `contents: ${toc.n} rows, open ${toc.open}, the others folded, chapters shown`);
  ok(toc.subs.join('|') === toc.tabs.join('|') && toc.cur === toc.active, `its sections are the chapter's tabs (${toc.subs.length}), «${toc.cur}» marked`);
  // another chapter opens into its sections; the switch shows the tools
  await page.tap('#sheet-toc .toc-item[data-toc="vkus"] .toc-tog');
  await page.waitForTimeout(450);
  const vk = await page.evaluate(() => { const li = document.querySelector('#sheet-toc .toc-item[data-toc="vkus"]'); const u = li.querySelector('.toc-sub ul'); return { open: li.classList.contains('is-open'), seen: getComputedStyle(u).visibility, h: Math.round(u.getBoundingClientRect().height), n: u.children.length }; });
  ok(vk.open && vk.seen === 'visible' && vk.h > vk.n * 36, 'a folded chapter opens into its sections ' + JSON.stringify(vk));
  await page.tap('#sheet-toc [data-toc-pane="tools"]');
  await page.waitForTimeout(250);
  const tl = await page.evaluate(() => { const d = document.getElementById('sheet-toc'); return { ch: d.querySelector('.toc-chapters').offsetParent !== null, tools: [...d.querySelectorAll('.toc-tool')].map(a => ({ href: a.href, t: a.querySelector('b').textContent, where: a.querySelector('small').textContent })) }; });
  ok(!tl.ch && tl.tools.length === 16 && tl.tools.every(t => t.where), `the tools: ${tl.tools.length}, each says where it leads`);
  await page.tap('#sheet-toc [data-toc-pane="ch"]');
  await page.tap('#sheet-toc .toc-item[data-toc="udobreniya"] .toc-sub li:nth-child(4) a');
  await page.waitForTimeout(800);
  ok(await page.evaluate(() => document.querySelector('.panel.is-active').id === 'план' && !document.getElementById('sheet-toc').open), 'a section of this chapter → ' + path());
  // every tool lands where its caption says: the chapter and the tab, the target itself on the page
  const wrong = [];
  for (const t of tl.tools) {
    const tp = await ctx.newPage();
    await tp.goto(t.href, { waitUntil: 'load' });
    await tp.waitForTimeout(400);
    const at = await tp.evaluate(() => {
      const view = document.querySelector('.view.is-active'), panel = document.querySelector('.panel.is-active');
      const tab = panel && view.querySelector(`.subnav a[href="#${panel.id}"]`);
      const id = decodeURIComponent(location.hash.slice(1)), el = id && document.getElementById(id);
      const seen = !el || el.closest('.panel') === null || el.closest('.panel') === panel;
      return { title: (view.getAttribute('aria-label') || '').trim(), tab: tab ? tab.textContent.trim() : '', seen };
    });
    // the same words: the page and the contents may tie a short word to the next one with a no-break space
    const flat = x => x.replace(/\u00a0/g, ' ');
    const said = at.tab ? `${at.title} · ${at.tab}` : at.title;
    if (flat(said) !== flat(t.where) || !at.seen) wrong.push(`${t.t}: «${t.where}» → «${said}»${at.seen ? '' : ' (not on the open tab)'}`);
    await tp.close();
  }
  ok(!wrong.length, `every tool opens where it says${wrong.length ? ': ' + wrong.join('; ') : ''}`);
  // a sheet follows the finger: by its grabber, by the list when the list is at its top; short of a third
  // it springs back, past it or on a flick it closes; the page under it never moves
  const cdp = await ctx.newCDPSession(page);
  let clock = 0;
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts, timestamp: clock });
  // the finger at its own pace: the event clock steps `ms` per move however slow the machine is
  const drag = async (x, y0, y1, steps = 8, ms = 40) => { clock = Date.now() / 1000; await send('touchStart', [{ x, y: y0 }]); for (let i = 1; i <= steps; i++) { clock += ms / 1000; await send('touchMove', [{ x, y: y0 + (y1 - y0) * i / steps }]); } };
  // let go after holding still, or at once (a flick keeps its speed)
  const lift = async (held = true) => { clock = held ? Math.max(clock + 0.5, Date.now() / 1000) : clock + 0.016; await send('touchEnd', []); };
  const sheet = () => page.evaluate(() => { const d = document.getElementById('sheet-toc'); const r = d.getBoundingClientRect(); return { open: d.open, top: Math.round(r.top), h: Math.round(r.height), fade: +getComputedStyle(d, '::backdrop').opacity, list: Math.round(d.querySelector('.sheet-inner').scrollTop), focus: document.activeElement === d, y: Math.round(scrollY) }; });
  const openCh = async () => { await page.tap('.tabbar [data-open="sheet-toc"]'); await page.waitForTimeout(600); return sheet(); };
  const s0 = await openCh();
  const grab = await page.evaluate(() => { const r = document.querySelector('#sheet-toc .sheet-grab').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await drag(grab[0], grab[1], grab[1] + 100);
  const s1 = await sheet();
  await lift();
  await page.waitForTimeout(450);
  const s2 = await sheet();
  ok(s0.open && s0.focus && Math.abs(s1.top - s0.top - 100) <= 2 && s1.fade < 0.9 && s2.open && s2.top === s0.top, 'sheet follows the grabber, springs back ' + JSON.stringify([s0, s1, s2]));
  await page.evaluate(() => { document.querySelector('#sheet-toc .sheet-inner').scrollTop = 300; });
  await drag(200, s0.top + 300, s0.top + 450, 10);
  await lift();
  await page.waitForTimeout(400);
  const s3 = await sheet();
  await page.evaluate(() => { document.querySelector('#sheet-toc .sheet-inner').scrollTop = 0; });
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
  await page.tap('#sheet-toc [data-close]');
  await page.waitForTimeout(500);
  ok(!(await sheet()).open, 'closes with ×');
  // search on a phone: a panel at the top of the visible area, down to the keyboard; it stays put
  // while the page under it is scrolled
  const panel = () => page.evaluate(() => { const d = document.getElementById('sheet-search'); const r = d.getBoundingClientRect(); return { open: d.open, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: Math.round(visualViewport.height), focus: document.activeElement && document.activeElement.id, y: Math.round(scrollY) }; });
  await page.tap('.tabbar [data-open="sheet-search"]');
  await page.waitForTimeout(500);
  const p0 = await panel();
  const vs = page.viewportSize();
  await page.setViewportSize({ width: vs.width, height: Math.round(vs.height / 2) });
  await page.waitForTimeout(300);
  const p1 = await panel();
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(300);
  const p2 = await panel();
  await page.setViewportSize(vs);
  await page.waitForTimeout(300);
  ok(p0.open && p0.top === 0 && p0.bottom === p0.vh && p0.focus === 'search-input' && p1.top === 0 && p1.bottom === p1.vh && p2.top === 0 && p2.bottom === p2.vh, 'search panel follows the visible area ' + JSON.stringify([p0, p1, p2]));
  await page.tap('#sheet-search .search-cancel');
  await page.waitForTimeout(400);
  ok(!(await panel()).open, '«Отмена» closes search');
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
  // down at once (the page scrolls smoothly, and a click in the middle of that would race it), then the link:
  // the smooth way up is waited for to its end — a page that stops short of the top still fails
  await d.evaluate(() => window.scrollTo({ top: 2500, behavior: 'instant' }));
  await d.waitForTimeout(300);
  // the header's button says where the reader is; the contents drop from it, chapters and tools side by side
  const btn = await d.evaluate(() => { const b = document.querySelector('.topbar .toc-btn'); return { text: b.textContent.replace(/\s+/g, ' ').trim(), x: Math.round(b.getBoundingClientRect().left), bottom: Math.round(b.getBoundingClientRect().bottom) }; });
  await d.click('.topbar .toc-btn');
  await d.waitForTimeout(400);
  const drop = await d.evaluate(() => { const s = document.getElementById('sheet-toc'), r = s.getBoundingClientRect(); return { open: s.open, x: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), both: ['.toc-chapters', '.toc-tools'].every(q => s.querySelector(q).offsetParent !== null), exp: document.querySelector('.topbar .toc-btn').getAttribute('aria-expanded') }; });
  ok(/Оглавление: 4 Уход/.test(btn.text) && drop.open && drop.exp === 'true' && Math.abs(drop.x - btn.x) <= 2 && drop.top > btn.bottom && drop.top - btn.bottom < 40 && drop.both, `contents drop from «${btn.text}» ` + JSON.stringify(drop));
  await d.keyboard.press('Escape');
  // the sheet closes with its animation: waited for, not timed (a busy machine takes longer)
  const shut = () => !document.getElementById('sheet-toc').open && document.querySelector('.topbar .toc-btn').getAttribute('aria-expanded') === 'false';
  await d.waitForFunction(shut, null, { timeout: 3000 }).catch(() => {});
  ok(await d.evaluate(shut), 'Esc closes the contents');
  await d.click('.topbar .toc-btn');
  await d.waitForTimeout(400);
  await d.click('#sheet-toc .toc-item[data-toc="uhod"] .toc-link');
  await d.waitForFunction(() => scrollY < 5, null, { timeout: 3000 }).catch(() => {});
  ok(await d.evaluate(() => scrollY < 5 && !document.getElementById('sheet-toc').open), 'own chapter link scrolls to top ' + await d.evaluate(() => scrollY));
  await d.click('#deep-toggle');
  ok(!(await d.evaluate(() => !!document.querySelector('[data-haptics]'))), 'no haptics switch on desktop');
  await browser.close();
  srv.stop();
  done(errs);
})();
