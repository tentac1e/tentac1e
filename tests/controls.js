/* Каждая кнопка на каждой вкладке каждой страницы — на телефоне и компьютере, с раскрытыми «Глубже»:
   нажимает кнопки, чипы и узлы схем, перебирает варианты списков, ставит ползунки в края и в середину,
   заполняет числа и даты, открывает и закрывает шторки. Провал — ошибка JS, что-то шире экрана после
   нажатий или (на телефоне) зона нажатия меньше 36 px у кнопки, чипа или ссылки-кнопки.
   node tests/controls.js [vkus.html,…] [--phone|--desktop]   (сборка в корне: python3 scripts/build.py) */
const { playwright, ok, done, watch, fileUrl, FILES } = require('./lib');

const args = process.argv.slice(2);
const only = (args.find(a => !a.startsWith('--')) || '').split(',').filter(Boolean);
const modes = args.includes('--phone') ? ['phone'] : args.includes('--desktop') ? ['desktop'] : ['phone', 'desktop'];
const MIN_TAP = 36;

// in the page: every control of the open tab gets a number
function mark() {
  const root = document.querySelector('[data-panel].is-active') || document.querySelector('[data-view]');
  const sel = 'button, [role="button"], .chip, summary, select, input[type="range"], input[type="number"], input[type="date"], input[type="checkbox"], input[type="radio"], input[type="text"]';
  const els = [...root.querySelectorAll(sel)].filter(e => !e.closest('.pager, .panel-next, [hidden]') && e.getClientRects().length && !e.disabled);
  document.querySelectorAll('[data-ctl]').forEach(e => e.removeAttribute('data-ctl'));
  els.forEach((e, i) => e.setAttribute('data-ctl', i));
  return els.length;
}
// in the page: use control number i the way a reader would
function press(i) {
  const e = document.querySelector(`[data-ctl="${i}"]`);
  if (!e || !e.isConnected || e.disabled || !e.getClientRects().length) return null;
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
  const tag = e.tagName.toLowerCase(), type = (e.type || '').toLowerCase();
  if (tag === 'select') { for (let k = 0; k < e.options.length; k++) { e.selectedIndex = k; fire(e, 'input'); fire(e, 'change'); } }
  else if (type === 'range') { for (const v of [e.min || 0, e.max || 100, ((+e.min || 0) + (+e.max || 100)) / 2]) { e.value = v; fire(e, 'input'); fire(e, 'change'); } }
  else if (type === 'number') { for (const v of [e.min || 0, e.max || 999, e.defaultValue]) { e.value = v; fire(e, 'input'); fire(e, 'change'); } }
  else if (type === 'date') { const d = new Date(); d.setDate(d.getDate() - 30); e.value = d.toISOString().slice(0, 10); fire(e, 'input'); fire(e, 'change'); }
  else if (type === 'text') { e.value = 'базилик'; fire(e, 'input'); }
  else if (typeof e.click === 'function') e.click();
  else e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return tag;
}
// in the page: anything wider than the screen outside a sideways scroller
function wide() {
  const vw = document.documentElement.clientWidth;
  const root = document.querySelector('[data-panel].is-active') || document.querySelector('[data-view]');
  return [...root.querySelectorAll('*')].filter(e => {
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') return false;
    if (e.closest('[aria-hidden="true"], [data-bg]')) return false;
    const r = e.getBoundingClientRect();
    if (!r.width || (r.right <= vw + 1 && r.left >= -1)) return false;
    for (let a = e.parentElement; a; a = a.parentElement) if (/(auto|scroll)/.test(getComputedStyle(a).overflowX)) return false;
    return true;
  }).slice(0, 4).map(e => `${(e.getAttribute('class') || e.tagName).split(' ')[0]} ${Math.round(e.getBoundingClientRect().left)}…${Math.round(e.getBoundingClientRect().right)}`);
}
// in the page: how tall the zone that answers a finger is — the box and whatever answers around it
// (a ::after that reaches further, a whole card that takes the tap); one of each kind per tab
function taps(min) {
  const root = document.querySelector('[data-panel].is-active') || document.querySelector('[data-view]');
  const seen = new Set(), small = [];
  root.querySelectorAll('button, [role="button"], .chip, summary, a.btn, .sci-note-link').forEach(e => {
    if (!e.getClientRects().length || e.closest('[hidden], .pager')) return;
    const kind = e.tagName + '.' + ((e.getAttribute('class') || '').split(' ')[0]);
    if (seen.has(kind)) return;
    const r = e.getBoundingClientRect();
    if (!r.width || r.top < 60 || r.bottom > innerHeight - 70) return; // measured when it stands on the screen
    seen.add(kind);
    const cx = r.left + Math.min(r.width / 2, 12), cy = (r.top + r.bottom) / 2;
    const mine = (x, y) => { const h = document.elementFromPoint(x, y); return h && (h === e || e.contains(h)); };
    if (!mine(cx, cy)) return; // covered by something else: not this check's business
    // the page's own chrome (header, tab row, bottom bar) floats over whatever scrolls under it: a zone that
    // reaches under it is measured at another scroll position
    const chrome = (x, y) => { const h = document.elementFromPoint(x, y); return h && h.closest('.topbar, .subnav-wrap, .tabbar, .to-top, .toast'); };
    if (chrome(cx, r.top - 24) || chrome(cx, r.bottom + 24)) { seen.delete(kind); return; }
    let up = 0, down = 0;
    while (up < 24 && mine(cx, r.top - up - 1)) up++;
    while (down < 24 && mine(cx, r.bottom + down + 1)) down++;
    const zone = Math.round(r.height + up + down);
    if (zone < min) small.push(`${kind} «${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}» ${zone} px`);
  });
  return small;
}

async function check(ctx, mode, f, errs) {
  const page = await ctx.newPage();
  const mine = [];
  watch(page, mine);
  page.on('dialog', d => d.dismiss().catch(() => {}));
  const out = [];
  await page.goto(fileUrl(f), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const panels = await page.evaluate(() => [...document.querySelectorAll('[data-panel]')].map(p => p.id));
  for (const id of panels.length ? panels : [null]) {
    const before = mine.length;
    if (id) { await page.evaluate(i => { location.hash = i; }, id); await page.waitForTimeout(250); }
    await page.evaluate(() => document.querySelectorAll('details.deep, details.deeper').forEach(d => { d.open = true; }));
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    const small = new Set();
    for (let y = 0; y < H; y += 500) {
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await page.waitForTimeout(40);
      if (mode === 'phone') (await page.evaluate(taps, MIN_TAP)).forEach(s => small.add(s));
    }
    await page.waitForTimeout(500);
    const n = await page.evaluate(mark);
    let pressed = 0;
    for (let i = 0; i < n; i++) {
      const r = await page.evaluate(press, i).catch(e => 'throw ' + e.message);
      if (r) pressed++;
      if (r && r.startsWith('throw')) mine.push(`${f}#${id}: ${r}`);
      // whatever a press opened (a sheet, a confirmation) is closed again
      await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    }
    await page.waitForTimeout(300);
    const w = await page.evaluate(wide);
    const bad = [...mine.slice(before).map(x => 'JS ' + x), ...w.map(x => 'wide ' + x), ...[...small].map(x => 'tap ' + x)];
    out.push([!bad.length, `${mode.padEnd(7)} ${f}${id ? '#' + id : ''}: ${pressed} controls${bad.length ? '\n    ' + bad.slice(0, 10).join('\n    ') : ''}`]);
  }
  await page.close();
  return out;
}

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  const ctx = {};
  for (const mode of modes) ctx[mode] = await browser.newContext({ ...(mode === 'phone' ? { ...devices['iPhone 13 Mini'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 900 } }), reducedMotion: 'reduce' });
  const jobs = [];
  for (const mode of modes) for (const f of FILES) if (!only.length || only.includes(f)) jobs.push({ mode, f });
  let next = 0;
  const worker = async () => { while (next < jobs.length) { const j = jobs[next++]; j.out = await check(ctx[j.mode], j.mode, j.f, errs); } };
  await Promise.all([1, 2, 3, 4].map(worker));
  jobs.forEach(j => j.out.forEach(([good, msg]) => ok(good, msg)));
  await browser.close();
  done(errs);
})();
