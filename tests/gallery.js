/* Every illustration of a chapter on one sheet, to look at them together.
   node tests/gallery.js [problemy] [--dark]   → tests/out/gallery-<chapter>.png
   Uses the build in the repository root (python3 scripts/build.py). */
const path = require('path');
const fs = require('fs');
const { playwright, fileUrl, OUT, watch } = require('./lib');
const view = process.argv.slice(2).find(a => !a.startsWith('--')) || 'problemy';
const dark = process.argv.includes('--dark');
const FILE = { problemy: 'problemy.html' };
(async () => {
  const { chromium } = playwright();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: dark ? 'dark' : 'light', deviceScaleFactor: 1.5 });
  const errs = [];
  watch(p, errs);
  await p.goto(fileUrl(FILE[view] || view + '.html'), { waitUntil: 'load' });
  await p.waitForTimeout(600);
  const keys = await p.evaluate(() => {
    const B = window.BASIL, k = [];
    B.DIAG.forEach(g => g.items.forEach(it => k.push('sym:' + it.id)));
    B.DISEASES.forEach((d, i) => { k.push(`dis:${i}-plant`, `dis:${i}-zoom`); });
    B.PESTS.forEach((d, i) => { k.push(`pest:${i}-plant`, `pest:${i}-zoom`); });
    return k;
  });
  await p.evaluate(keys => {
    const sec = document.querySelector('[data-view]');
    const box = document.createElement('div');
    box.id = 'gallery';
    box.style.cssText = 'position:absolute;left:0;top:0;width:1200px;z-index:99999;background:var(--bg);display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:8px;font:11px monospace';
    box.innerHTML = keys.map(k => `<figure style="margin:0"><span data-ill="${k}" style="display:block"></span><figcaption>${k}</figcaption></figure>`).join('');
    sec.appendChild(box);
    window.scrollTo(0, 0);
    document.querySelectorAll('.topbar,.tabbar,.to-top').forEach(e => { e.style.visibility = 'hidden'; });
    window.BasilScience.paint(box);
  }, keys);
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelectorAll('#gallery [data-ill]').forEach(el => { if (!el.dataset.drawn) window.BasilScience.paint(el); }));
  await p.waitForTimeout(800);
  const missing = await p.evaluate(() => [...document.querySelectorAll('#gallery [data-ill]')].filter(el => !el.dataset.drawn).map(el => el.dataset.ill));
  fs.mkdirSync(OUT, { recursive: true });
  const el = await p.$('#gallery');
  await el.screenshot({ path: path.join(OUT, `gallery-${view}${dark ? '-dark' : ''}.png`) });
  console.log(keys.length, 'illustrations; not drawn:', JSON.stringify(missing), 'errors:', JSON.stringify(errs));
  await b.close();
})();
