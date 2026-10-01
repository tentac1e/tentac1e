/* Текст не лезет на картинку — на каждой вкладке каждой страницы, на телефоне и на компьютере.
     A  текст страницы поверх рисунка (svg, img, canvas), который его не обрамляет;
     B  подпись в схеме или рисунке, которую пересекает линия или фигура;
     C  что-то шире экрана и не в горизонтальной прокрутке.
   Нарочная подпись на картинке помечается data-on-picture; подмостки схемы (сетка, полосы, фон,
   текстура) — классами grid, band, lane или атрибутом data-bg: их подписи пересекать могут.

   node tests/overlap.js                    все страницы, телефон и компьютер
   node tests/overlap.js vkus.html,uhod.html только эти
   node tests/overlap.js --phone | --desktop
   Проверяет сборку в корне репозитория (python3 scripts/build.py). */
const { playwright, ok, done, watch, fileUrl, FILES } = require('./lib');

const args = process.argv.slice(2);
const only = (args.find(a => !a.startsWith('--')) || '').split(',').filter(Boolean);
const modes = args.includes('--phone') ? ['phone'] : args.includes('--desktop') ? ['desktop'] : ['phone', 'desktop'];

// measured in the page
function audit() {
  const root = document.querySelector('[data-panel].is-active') || document.querySelector('[data-view]');
  const out = { A: [], B: [], C: [] };
  const vw = document.documentElement.clientWidth;
  const label = n => (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32);
  const cls = e => ((e.getAttribute && e.getAttribute('class')) || '').split(' ').filter(Boolean)[0] || e.tagName.toLowerCase();
  const where = e => {
    const lab = e.closest('[data-lab]'), ill = e.closest('[data-ill]');
    return lab ? 'модель ' + lab.dataset.lab : ill ? 'рисунок ' + ill.dataset.ill : cls(e.closest('[class]') || e);
  };
  const chrome = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  // inside a closed <details> (but not in its summary): not on the screen, though the browser still lays it out
  const folded = el => { for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) { const s = el.closest('summary'); if (!d.open && !(s && s.parentElement === d)) return true; } return false; };
  const visible = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };

  /* A: page text over a picture */
  const pics = [...root.querySelectorAll('svg, img, canvas')]
    .filter(g => !(g.parentElement && g.parentElement.closest('svg')) && !g.closest('[data-bg]'))
    .filter(g => { const r = g.getBoundingClientRect(); return r.width >= 10 && r.height >= 10 && !chrome(g) && !folded(g) && visible(g); });
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim() && !n.parentElement.closest('svg, script, style, [data-on-picture]')) ? 1 : 2 });
  const seenA = new Set();
  while (tw.nextNode()) {
    const n = tw.currentNode, pe = n.parentElement;
    if (chrome(pe) || folded(pe) || !visible(pe)) continue;
    const rg = document.createRange();
    rg.selectNodeContents(n);
    for (const rc of rg.getClientRects()) {
      if (rc.width < 2) continue;
      for (const g of pics) {
        if (g.contains(pe) || pe.contains(g)) continue;
        const gr = g.getBoundingClientRect();
        const w = Math.min(rc.right, gr.right) - Math.max(rc.left, gr.left), h = Math.min(rc.bottom, gr.bottom) - Math.max(rc.top, gr.top);
        if (w > 3 && h > 3 && w * h > 30) {
          const k = label(pe) + '|' + where(g);
          if (!seenA.has(k)) { seenA.add(k); out.A.push(`«${label(pe)}» на ${where(g)} (${Math.round(w)}×${Math.round(h)})`); }
        }
      }
    }
  }

  /* B: a caption in a drawing crossed by a line or a shape */
  const SCAFFOLD = /(^|\s)(grid|band|lane|pw-lane)(\s|$)/;
  const alphaOf = c => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 1; const p = m[1].split(/[\s,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };
  root.querySelectorAll('svg').forEach(svg => {
    if (svg.parentElement.closest('svg') || chrome(svg) || folded(svg) || !visible(svg)) return;
    const sb = svg.getBoundingClientRect();
    if (sb.width < 20 || sb.height < 20) return;
    const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('defs, clipPath, mask, marker, pattern, [data-on-picture]') && t.getBoundingClientRect().width > 2 && visible(t));
    if (!texts.length) return;
    const opacityOf = g => { let o = 1; for (let e = g; e && e !== svg.parentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
    const geos = [...svg.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect')].filter(g => {
      if (g.closest('defs, clipPath, mask, marker, pattern, [data-bg]')) return false;
      for (let e = g; e && e !== svg; e = e.parentElement) if (SCAFFOLD.test(e.getAttribute('class') || '')) return false;
      const r = g.getBoundingClientRect();
      if ((g.tagName === 'rect' || g.tagName === 'path') && r.width * r.height > 0.35 * sb.width * sb.height) return false; // the paper of the picture
      return visible(g) && opacityOf(g) >= 0.2;
    });
    const order = new Map(geos.map((g, i) => [g, i]));
    texts.forEach(t => {
      const tr = t.getBoundingClientRect();
      const box = { l: tr.left + 1, r: tr.right - 1, t: tr.top + 1.5, b: tr.bottom - 1.5 };
      if (box.r <= box.l || box.b <= box.t) return;
      const cands = geos.filter(g => { const gr = g.getBoundingClientRect(); return gr.right > box.l && gr.left < box.r && gr.bottom > box.t && gr.top < box.b; });
      if (!cands.length) return;
      const pts = [];
      for (let x = box.l; x <= box.r; x += 2.5) for (let y = box.t; y <= box.b; y += 2.5) pts.push([x, y]);
      const info = cands.map(g => {
        const s = getComputedStyle(g);
        const fill = s.fill !== 'none' && +s.fillOpacity > 0.12 && alphaOf(s.fill) > 0.12;
        const stroke = s.stroke !== 'none' && parseFloat(s.strokeWidth) > 0 && +s.strokeOpacity > 0.12 && alphaOf(s.stroke) > 0.12;
        let m = null;
        try { m = g.getScreenCTM().inverse(); } catch (e) { /* not drawn */ }
        return { g, s, fill, stroke, m, before: !!(g.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING), solid: fill && +s.fillOpacity * alphaOf(s.fill) * opacityOf(g) >= 0.6 };
      }).filter(c => c.m && (c.fill || c.stroke));
      const P = (c, x, y) => new DOMPoint(x, y).matrixTransform(c.m);
      // a solid shape under the whole caption (painted before it) is its background, a pill or a plate:
      // what is painted before that is hidden. Probed at the middle and the edge middles, so rounded
      // corners of a pill do not matter
      let floor = -1;
      const cx = (box.l + box.r) / 2, cy = (box.t + box.b) / 2;
      const probe = [[cx, cy], [box.l + 1, cy], [box.r - 1, cy], [cx, box.t + 1], [cx, box.b - 1]];
      const under = new Set();
      info.forEach(c => {
        if (!(c.fill && c.before && probe.every(([x, y]) => c.g.isPointInFill(P(c, x, y))))) return;
        under.add(c.g);
        if (c.solid) floor = Math.max(floor, order.get(c.g));
      });
      const hits = [];
      info.forEach(c => {
        if (under.has(c.g) || (c.before && order.get(c.g) <= floor)) return;
        let n = 0;
        pts.forEach(([x, y]) => { const q = P(c, x, y); if ((c.stroke && c.g.isPointInStroke(q)) || (c.fill && c.g.isPointInFill(q))) n++; });
        if (n / pts.length > 0.03) hits.push(`${cls(c.g)} ${Math.round(100 * n / pts.length)}%`);
      });
      if (hits.length) out.B.push(`${where(t)}: «${label(t)}» пересекает ${hits.slice(0, 4).join(', ')}`);
    });
  });

  /* C: wider than the screen and not in a scroller */
  root.querySelectorAll('*').forEach(e => {
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') return;
    if (e.closest('[data-bg], [aria-hidden="true"]') || chrome(e)) return;
    const r = e.getBoundingClientRect();
    if (!r.width || (r.right <= vw + 1 && r.left >= -1)) return;
    for (let a = e.parentElement; a; a = a.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(a).overflowX)) return; }
    out.C.push(`${cls(e)} ${Math.round(r.left)}…${Math.round(r.right)} при ширине ${vw}`);
  });
  out.C = [...new Set(out.C)].slice(0, 6);
  return out;
}

// one page in one mode: every tab walked through, then measured; the lines it reports
async function check(ctx, mode, f, errs) {
  // a fresh tab for every page: one tab walked through all of them stalls after a while
  const page = await ctx.newPage();
  watch(page, errs);
  const out = [];
  await page.goto(fileUrl(f), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const panels = await page.evaluate(() => [...document.querySelectorAll('[data-panel]')].map(p => p.id));
  for (const id of panels.length ? panels : [null]) {
    if (id) { await page.evaluate(i => { location.hash = i; }, id); await page.waitForTimeout(300); }
    // every deep dive open, the whole tab walked through: models and pictures appear near the screen
    const H = await page.evaluate(() => { document.querySelectorAll('details.deep, details.deeper').forEach(d => { d.open = true; }); return document.documentElement.scrollHeight; });
    for (let y = 0; y < H; y += 700) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(40); }
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    const r = await page.evaluate(audit);
    const bad = [...r.A.map(x => 'A ' + x), ...r.B.map(x => 'B ' + x), ...r.C.map(x => 'C ' + x)];
    out.push([!bad.length, `${mode.padEnd(7)} ${f}${id ? '#' + id : ''}${bad.length ? '\n    ' + bad.slice(0, 14).join('\n    ') + (bad.length > 14 ? `\n    … +${bad.length - 14}` : '') : ''}`]);
  }
  await page.close();
  return out;
}

// other checks measure their own pages with the same audit: require('./overlap').audit
module.exports = { audit };
if (require.main === module) (async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];
  const ctx = {};
  for (const mode of modes) ctx[mode] = await browser.newContext({ ...(mode === 'phone' ? { ...devices['iPhone 13 Mini'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 900 } }), reducedMotion: 'reduce' });
  const jobs = [];
  for (const mode of modes) for (const f of FILES) if (!only.length || only.includes(f)) jobs.push({ mode, f });
  // four pages at a time; the lines come out in the usual order
  let next = 0;
  const worker = async () => { while (next < jobs.length) { const j = jobs[next++]; j.out = await check(ctx[j.mode], j.mode, j.f, errs); } };
  await Promise.all([1, 2, 3, 4].map(worker));
  jobs.forEach(j => j.out.forEach(([good, msg]) => ok(good, msg)));
  await browser.close();
  done(errs);
})();
