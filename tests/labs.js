/* Каждая модель на своей странице: запускается без ошибок, ничего не вылезает за край,
   подписи в схемах не обрезаны, не налезают друг на друга и не мельче 9 px.

   node tests/labs.js                       все модели, телефон и компьютер
   node tests/labs.js trichome,pairing      только эти
   node tests/labs.js --phone | --desktop   один размер экрана (телефон — iPhone 13 mini)
   node tests/labs.js --shots               ещё и снимки в tests/out/<экран>-<модель>.png
   node tests/labs.js --dark                тёмная тема
   Проверяет сборку в корне репозитория (python3 scripts/build.py). */
const fs = require('fs');
const path = require('path');
const { playwright, ok, done, watch, fileUrl, OUT, FILES } = require('./lib');

const args = process.argv.slice(2);
const only = (args.find(a => !a.startsWith('--')) || '').split(',').filter(Boolean);
const modes = args.includes('--phone') ? ['phone'] : args.includes('--desktop') ? ['desktop'] : ['phone', 'desktop'];
const shots = args.includes('--shots');
const dark = args.includes('--dark');

// what counts as broken, measured in the page
function audit(sel) {
  const el = document.querySelector(sel);
  const box = el.getBoundingClientRect();
  const out = { ready: el.matches('[data-ill]') ? !!el.dataset.drawn : !!el.dataset.ready && !el.querySelector(':scope > .muted'), over: [], clipped: [], overlap: [], tiny: [] };
  const scrolls = n => { for (let p = n.parentElement; p && p !== el; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX)) return true; } return false; };
  const shown = n => { for (let p = n; p && p !== el; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
  const label = n => (n.textContent || n.getAttribute('class') || n.tagName).trim().replace(/\s+/g, ' ').slice(0, 28);
  // anything wider than the card (not inside a deliberate horizontal scroller)
  el.querySelectorAll('*').forEach(n => {
    if (n.closest('svg') && n.tagName.toLowerCase() !== 'svg') return;
    const r = n.getBoundingClientRect();
    if (!r.width || !shown(n) || scrolls(n)) return;
    if (r.right > box.right + 1.5 || r.left < box.left - 1.5) out.over.push(`${n.tagName.toLowerCase()}.${String(n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className).split(' ')[0]} «${label(n)}» ${Math.round(r.left - box.left)}…${Math.round(r.right - box.left)}/${Math.round(box.width)}`);
  });
  // svg captions
  el.querySelectorAll('svg').forEach(svg => {
    const sb = svg.getBoundingClientRect();
    if (!sb.width || !shown(svg)) return;
    const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && shown(t) && !t.closest('defs, clipPath, mask, [aria-hidden="true"][data-deco]'));
    const rects = texts.map(t => ({ t, r: t.getBoundingClientRect() }));
    const scale = svg.getScreenCTM() ? Math.abs(svg.getScreenCTM().a) : 1;
    const hidden = svg.closest('[style*="overflow: visible"]') || getComputedStyle(svg).overflow === 'visible';
    const limit = hidden ? box : sb;
    rects.forEach(({ t, r }) => {
      if (r.left < limit.left - 1.5 || r.right > limit.right + 1.5 || r.top < limit.top - 1.5 || r.bottom > limit.bottom + 1.5) out.clipped.push(`«${label(t)}»`);
      const fs = parseFloat(getComputedStyle(t).fontSize) * scale;
      if (fs < 9) out.tiny.push(`«${label(t)}» ${fs.toFixed(1)}px`);
    });
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].r, b = rects[j].r;
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w <= 0 || h <= 0) continue;
        const small = Math.min(a.width * a.height, b.width * b.height) || 1;
        if (w * h / small > 0.2) out.overlap.push(`«${label(rects[i].t)}» × «${label(rects[j].t)}»`);
      }
    }
  });
  for (const k of ['over', 'clipped', 'overlap', 'tiny']) out[k] = [...new Set(out[k])];
  return out;
}

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  if (shots) fs.mkdirSync(OUT, { recursive: true });
  for (const mode of modes) {
    const ctx = await browser.newContext({
      ...(mode === 'phone' ? { ...devices['iPhone 13 Mini'], deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 900 } }),
      colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce'
    });
    const page = await ctx.newPage();
    watch(page, errs);
    for (const f of FILES) {
      await page.goto(fileUrl(f), { waitUntil: 'load' });
      await page.waitForTimeout(500);
      const labs = await page.evaluate(() => [...document.querySelectorAll('.lab-tool[data-lab]')].map(l => ({ lab: l.dataset.lab, panel: (l.closest('[data-panel]') || {}).id })));
      const mine = labs.filter(l => !only.length || only.includes(l.lab));
      if (!mine.length) continue;
      await page.addStyleTag({ content: '.tabbar,.to-top,.resume-pill,.topbar{visibility:hidden!important}' });
      for (const { lab, panel } of mine) {
        await page.evaluate(p => { if (p && location.hash !== '#' + p) location.hash = p; }, panel);
        await page.waitForTimeout(300);
        await page.evaluate(l => {
          const el = document.querySelector(`.lab-tool[data-lab="${l}"]`);
          for (let d = el.closest('details'); d; d = d.parentElement.closest('details')) d.open = true;
          el.scrollIntoView({ block: 'start' });
        }, lab);
        await page.waitForFunction(l => !!document.querySelector(`.lab-tool[data-lab="${l}"]`).dataset.ready, lab, { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(700);
        const r = await page.evaluate(audit, `.lab-tool[data-lab="${lab}"]`);
        const problems = ['over', 'clipped', 'overlap', 'tiny'].filter(k => r[k].length).map(k => `${k}: ${r[k].slice(0, 6).join(', ')}${r[k].length > 6 ? ` …+${r[k].length - 6}` : ''}`);
        ok(r.ready && !problems.length, `${mode.padEnd(7)} ${lab.padEnd(12)} ${r.ready ? '' : 'NOT MOUNTED '}${problems.join(' | ')}`);
        if (shots) {
          const el = await page.$(`.lab-tool[data-lab="${lab}"]`);
          await el.screenshot({ path: path.join(OUT, `${mode}${dark ? '-dark' : ''}-${lab}.png`) }).catch(e => console.log('  shot failed', e.message));
        }
      }
      // illustrations of the chapter (symptoms, diseases, pests): drawn, captions readable and inside
      const ills = only.length ? [] : await page.evaluate(() => [...document.querySelectorAll('[data-ill]')].map(e => ({ key: e.dataset.ill, panel: (e.closest('[data-panel]') || {}).id })));
      const seen = new Set();
      for (const { key, panel } of ills) {
        if (seen.has(key)) continue;
        seen.add(key);
        await page.evaluate(p => { if (p && location.hash !== '#' + p) location.hash = p; }, panel);
        await page.evaluate(k => { const e = document.querySelector(`[data-ill="${k}"]`); e.scrollIntoView({ block: 'center' }); window.BasilScience.paint(e, true); }, key);
        await page.waitForFunction(k => !!document.querySelector(`[data-ill="${k}"]`).dataset.drawn, key, { timeout: 5000 }).catch(() => {});
        const r = await page.evaluate(audit, `[data-ill="${key}"]`);
        const problems = ['clipped', 'overlap', 'tiny'].filter(k => r[k].length).map(k => `${k}: ${r[k].slice(0, 4).join(', ')}`);
        ok(r.ready && !problems.length, `${mode.padEnd(7)} ill ${key.padEnd(18)} ${r.ready ? '' : 'NOT DRAWN '}${problems.join(' | ')}`);
      }
    }
    await ctx.close();
  }
  await browser.close();
  done(errs);
})();
