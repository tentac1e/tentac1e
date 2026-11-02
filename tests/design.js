/* Как страница читается — на каждой вкладке каждой страницы, в светлой и тёмной теме и в обоих оформлениях,
   на телефоне и на компьютере (то, что нашёл аудит сайта глазами и что не должно вернуться):
     контраст   текст на сплошном фоне — не меньше 4,5 (крупный, от 18,5 px или от 14 px жирным, — 3);
     шрифт      ни одной подписи мельче 11,5 px (.72rem), кроме числа на значке «Моего базилика» в шапке;
     строка     абзац или пункт длиннее 160 знаков — не больше 95 знаков в строке (72ch в стилях: около 85 знаков
                в шрифте сайта, до 91 — в узком шрифте «Друида»; без ограничения строка шла по 120–130);
     ряд        в сетке из трёх колонок и больше последняя карточка не стоит в ряду одна;
     предлог    короткий предлог («в», «на», «по»…) не отрывается от слова после него: и в тексте страниц (typeset
                в build.py), и в том, что пишет скрипт (tieIn в 00-core.js), и в словах оформлений (say в 08-words.js).
   Сплошной фон — цвета блоков до первого непрозрачного; текст над картинкой, градиентом или холстом сцены
   контраст не проверяет (его обрамление — дело overlap.js и снимков).

   node tests/design.js                       все страницы, все темы, телефон и компьютер
   node tests/design.js vkus.html,uhod.html   только эти
   node tests/design.js --phone | --desktop
   node tests/design.js --look=light,druid    только эти темы (light, dark, grimoire, druid)
   node tests/design.js --date=2027-01-15     в этот день
   Проверяет сборку в корне репозитория (python3 scripts/build.py). */
const { playwright, ok, done, watch, fileUrl, FILES, SKINS, dateArg, atDate } = require('./lib');

const args = process.argv.slice(2);
const only = (args.find(a => !a.startsWith('--')) || '').split(',').filter(Boolean);
const views = args.includes('--phone') ? ['phone'] : args.includes('--desktop') ? ['desktop'] : ['phone', 'desktop'];
const lookArg = args.find(a => a.startsWith('--look='));
const looks = lookArg ? lookArg.slice(7).split(',') : ['light', 'dark', ...SKINS];
// what may be small: the count of this week's tasks on the badge of «Мой базилик» (a number in a 19 px circle)
const SMALL_OK = '.garden-badge';
// short words that never end a line (the same list as typeset in scripts/build.py and nb in 00-core.js)
const LOOSE = /(^|[^а-яёa-z­-])(в|с|к|у|о|а|и|я|во|со|ко|об|на|за|по|до|от|из|не|ни|но) (?=\S)/i;

// measured in the page: each finding once, as «what: where «words»»
function audit([SMALL_OK, LOOSE_SRC]) {
  const LOOSE = new RegExp(LOOSE_SRC, 'i');
  const out = { contrast: [], small: [], line: [], row: [], loose: [] };
  const root = document.querySelector('[data-panel].is-active') || document.querySelector('[data-view]') || document.body;
  const rgb = s => {
    if (/^color\(srgb/.test(s)) { const m = s.match(/-?[\d.]+/g).map(Number); return [m[0] * 255, m[1] * 255, m[2] * 255, m.length > 3 ? m[3] : 1]; }
    const m = /^rgba?\(/.test(s) && s.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2], m.length > 3 ? +m[3] : 1] : null;
  };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const over = (top, under) => { const a = top[3]; return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1]; };
  // the solid colour behind an element, or null when a picture, a gradient or a see-through block lies there
  const behind = el => {
    const stack = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none' || (e !== el && cs.opacity !== '1')) return null;
      const c = rgb(cs.backgroundColor);
      if (!c) return null;
      if (c[3] > 0) { stack.push(c); if (c[3] >= 0.99) break; }
    }
    let col = rgb(getComputedStyle(document.body).backgroundColor);
    if (!col || col[3] < 0.99) return null;
    for (let i = stack.length - 1; i >= 0; i--) col = over(stack[i], col);
    return col;
  };
  // on the screen: laid out, not hidden, not inside a closed <details> (its summary aside)
  const shown = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || el.closest('[hidden], [aria-hidden="true"], .sr-only')) return false;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.05) return false; }
    for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) { const s = el.closest('summary'); if (!d.open && !(s && s.parentElement === d)) return false; }
    return true;
  };
  const name = el => {
    const c = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '';
    const lab = el.closest('[data-lab]');
    return (lab ? 'модель ' + lab.dataset.lab + ' › ' : '') + el.tagName.toLowerCase() + (el.id ? '#' + el.id : c);
  };
  const words = el => `«${el.textContent.replace(/\s+/g, ' ').trim().slice(0, 36)}»`;
  const push = (k, s) => { if (!out[k].includes(s)) out[k].push(s); };

  // every element with words of its own
  const own = new Set();
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.data.trim().length > 1 && !n.parentElement.closest('svg, script, style')) own.add(n.parentElement);
  own.forEach(el => {
    if (!shown(el)) return;
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
    if (fs > 0 && fs < 11.5 && !el.closest(SMALL_OK)) push('small', `${fs.toFixed(1)} px ${name(el)} ${words(el)}`);
    const bg = behind(el), fg0 = rgb(cs.color);
    if (!bg || !fg0 || el.closest('button[disabled], [aria-disabled="true"], [disabled]')) return;
    const fg = over(fg0, bg), a = lum(fg), b = lum(bg), cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const big = fs >= 18.5 || (fs >= 14 && +cs.fontWeight >= 700);
    if (cr < (big ? 3 : 4.5)) push('contrast', `${cr.toFixed(2)} ${name(el)} ${words(el)}`);
  });

  // long lines: letters in a line of a long paragraph or item, by the width of its own letters
  const cv = document.createElement('canvas').getContext('2d');
  root.querySelectorAll('p, li').forEach(el => {
    const t = el.textContent.replace(/\s+/g, ' ').trim();
    if (t.length < 160 || !shown(el) || el.closest('table, .chips, .deep-src')) return;
    const cs = getComputedStyle(el);
    cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const cpl = Math.round(el.getBoundingClientRect().width / (cv.measureText(t).width / t.length));
    if (cpl > 95) push('line', `${cpl} знаков ${name(el)} ${words(el)}`);
  });

  // a grid of three columns and more: the last card alone in its row (rows told apart by offsetTop: the cards rise
  // into the screen with a transform)
  root.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display !== 'grid' || !shown(el)) return;
    const kids = [...el.children].filter(k => shown(k) && getComputedStyle(k).position !== 'absolute');
    const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length;
    if (kids.length < 4 || cols < 3 || kids.some(k => getComputedStyle(k).gridColumnEnd === '-1')) return;
    const tops = kids.map(k => k.offsetTop), last = Math.max(...tops);
    if (tops.filter(t => Math.abs(t - last) < 3).length === 1 && tops.filter(t => Math.abs(t - tops[0]) < 3).length === cols) push('row', `${name(el)}: ${kids.length} в ${cols} колонки, последняя одна`);
  });

  // a short word at the end of a line: everything the reader can see, the frame of the guide included
  const all = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = all.nextNode(); n; n = all.nextNode()) {
    const el = n.parentElement;
    if (!el || el.closest('script, style, svg, textarea, code, pre, [contenteditable], .sprite')) continue;
    const m = LOOSE.exec(n.data);
    if (m) push('loose', `${name(el)} «…${n.data.slice(Math.max(0, m.index - 16), m.index + 22).replace(/\s+/g, ' ')}…»`);
  }
  return out;
}

const KINDS = { contrast: 'контраст', small: 'мелкий шрифт', line: 'длинная строка', row: 'одна в ряду', loose: 'предлог в конце строки' };

// one page in one look and one screen: every tab opened, its deep dives open, walked down so its models are built
async function check(ctx, tag, f, errs) {
  const page = await ctx.newPage();
  watch(page, errs);
  const res = [];
  await page.goto(fileUrl(f), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const panels = await page.evaluate(() => [...document.querySelectorAll('[data-panel]')].map(p => p.id));
  for (const id of panels.length ? panels : [null]) {
    if (id) { await page.evaluate(i => { location.hash = i; }, id); await page.waitForTimeout(300); }
    const H = await page.evaluate(() => { document.querySelectorAll('details.deep, details.deeper').forEach(d => { d.open = true; }); return document.documentElement.scrollHeight; });
    for (let y = 0; y < H; y += 700) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(40); }
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    const r = await page.evaluate(audit, [SMALL_OK, LOOSE.source]);
    const bad = Object.entries(r).flatMap(([k, l]) => l.map(s => `${KINDS[k]}: ${s}`));
    res.push([!bad.length, `${tag} ${f}${id ? '#' + id : ''}${bad.length ? '\n    ' + bad.slice(0, 12).join('\n    ') + (bad.length > 12 ? `\n    … +${bad.length - 12}` : '') : ''}`]);
  }
  await page.close();
  return res;
}

// other checks measure their own pages with the same audit: require('./design').audit, with [SMALL_OK, LOOSE.source]
module.exports = { audit, KINDS, SMALL_OK, LOOSE };
if (require.main === module) (async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  const jobs = [];
  for (const look of looks) for (const view of views) {
    const ctx = await browser.newContext({
      ...(view === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1440, height: 900 } }),
      colorScheme: look === 'light' ? 'light' : 'dark', reducedMotion: 'reduce'
    });
    // the theme the moon chooses, or a skin from the menu in the header
    await ctx.addInitScript(l => {
      try { localStorage.setItem(l === 'grimoire' || l === 'druid' ? 'basil-skin' : 'basil-theme', JSON.stringify(l)); } catch (e) { /* the default look */ }
    }, look);
    await atDate(ctx, dateArg(args));
    const tag = `${look.padEnd(8)} ${view.padEnd(7)}`;
    for (const f of FILES) if (!only.length || only.includes(f)) jobs.push({ ctx, tag, f });
  }
  // four pages at a time; the lines come out in the usual order
  let next = 0;
  const worker = async () => { while (next < jobs.length) { const j = jobs[next++]; j.out = await check(j.ctx, j.tag, j.f, errs); } };
  await Promise.all([1, 2, 3, 4].map(worker));
  jobs.forEach(j => j.out.forEach(([good, msg]) => ok(good, msg)));
  await browser.close();
  done(errs);
})();
