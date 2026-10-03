/* Жесты: молекула крутится пальцем в любую сторону, страница под ней стоит; мимо молекулы страница листается.
     главная и «Вкус · Молекулы» на телефоне — настоящие касания (CDP), молекула сама не вертится (reduced motion):
       вертикальный свайп по ней — поворот вокруг горизонтальной оси, страница на месте;
       горизонтальный — вокруг вертикальной; два хода подряд — через «голову», без упора;
       свайп рядом с ней — страница листается;
     высота сцены на коротком телефоне — не больше 45 % экрана; компьютер — мышью вверх-вниз так же без упора.
   Подсветка под пальцем не залипает: в собранных стилях нет «:hover» вне @media (hover: hover); на телефоне
   наведение (включённое принудительно, как его ставит палец) не меняет вид строк оглавления, карточек и кнопок,
   на компьютере — меняет; подсветка нажатия у шторки и карточек прозрачная.
   node tests/gestures.js   (сборка в корне: python3 scripts/build.py) */
const fs = require('fs');
const path = require('path');
const { playwright, ok, done, watch, fileUrl, ROOT } = require('./lib');

// the style rules with «:hover» that no @media (hover: hover) holds: a finger leaves those lit on a phone
function bareHover(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [], bare = [];
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '"' || ch === "'") { const j = css.indexOf(ch, i + 1); i = j < 0 ? css.length : j; continue; }
    if (ch === '{') {
      const prelude = css.slice(start, i).trim();
      stack.push(prelude);
      if (!prelude.startsWith('@') && /:hover/.test(prelude) && !stack.some(p => /^@media[^{]*\(hover:\s*hover\)/.test(p)) && !stack.some(p => /^@(-webkit-)?keyframes/.test(p))) bare.push(prelude.replace(/\s+/g, ' '));
      start = i + 1;
    } else if (ch === '}') { stack.pop(); start = i + 1; } else if (ch === ';') start = i + 1;
  }
  return bare;
}

// the turn of B against A (rows of 3×3 matrices): the angle in degrees and the axis on the screen
function turned(A, B) {
  if (!A || !B) return { ang: 0, axis: [0, 0, 0] }; // a viewer without its turn: nothing to compare, the check fails
  const D = [0, 1, 2].map(i => [0, 1, 2].map(j => B[i][0] * A[j][0] + B[i][1] * A[j][1] + B[i][2] * A[j][2]));
  const ang = Math.acos(Math.max(-1, Math.min(1, (D[0][0] + D[1][1] + D[2][2] - 1) / 2))) * 180 / Math.PI;
  const ax = [D[2][1] - D[1][2], D[0][2] - D[2][0], D[1][0] - D[0][1]], l = Math.hypot(...ax) || 1;
  return { ang: Math.round(ang), axis: ax.map(v => +(v / l).toFixed(2)) };
}

(async () => {
  const { chromium, devices } = playwright();
  const browser = await chromium.launch();
  const errs = [];

  // ---------- phone: real touches ----------
  const ctx = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  watch(page, errs);
  const cdp = await ctx.newCDPSession(page);
  let clock = 0;
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts, timestamp: clock });
  // a finger from one point to another at its own pace, then off
  const swipe = async (x0, y0, x1, y1, steps = 10, ms = 16) => {
    clock = Date.now() / 1000;
    await send('touchStart', [{ x: x0, y: y0 }]);
    for (let i = 1; i <= steps; i++) { clock += ms / 1000; await send('touchMove', [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps }]); }
    clock += 0.016;
    await send('touchEnd', []);
    await page.waitForTimeout(250);
  };
  const state = sel => page.evaluate(s => { const c = document.querySelector(s); const r = c.getBoundingClientRect(); return { turn: c.molView && c.molView.turn, y: Math.round(scrollY), cx: r.left + r.width / 2, cy: r.top + r.height / 2, top: r.top, h: r.height, left: r.left }; }, sel);

  // the home page's molecule in the middle of the screen
  await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('home-molecule').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction(() => !!document.getElementById('home-molecule').molView, null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
  const H = '#home-molecule';
  let s0 = await state(H);
  ok(!!s0.turn, 'the home molecule is built');
  // up and down on it: it turns round the level axis, the page stays
  await swipe(s0.cx, s0.cy + 70, s0.cx, s0.cy - 90);
  let s1 = await state(H), t = turned(s0.turn, s1.turn);
  ok(Math.abs(s1.y - s0.y) <= 1 && t.ang > 60 && Math.abs(t.axis[0]) > 0.9, `up on the molecule: turned ${t.ang}° round ${t.axis}, the page moved ${s1.y - s0.y} px`);
  // sideways: round the upright axis
  await swipe(s1.cx - 80, s1.cy, s1.cx + 80, s1.cy);
  let s2 = await state(H);
  t = turned(s1.turn, s2.turn);
  ok(Math.abs(s2.y - s1.y) <= 1 && t.ang > 60 && Math.abs(t.axis[1]) > 0.9, `sideways: turned ${t.ang}° round ${t.axis}, the page moved ${s2.y - s1.y} px`);
  // two long moves down: over the top, no stop at 80°
  await swipe(s2.cx, s2.cy - 75, s2.cx, s2.cy + 75);
  await swipe(s2.cx, s2.cy - 75, s2.cx, s2.cy + 75);
  const s3 = await state(H);
  t = turned(s2.turn, s3.turn);
  ok(Math.abs(s3.y - s2.y) <= 1 && t.ang > 130, `two moves down: ${t.ang}° in all (over the top), the page moved ${s3.y - s2.y} px`);
  // beside it, in the page's margin: the page scrolls
  await swipe(Math.max(4, s3.left / 2), s3.cy + 120, Math.max(4, s3.left / 2), s3.cy - 180, 10, 16);
  await page.waitForTimeout(400);
  const s4 = await state(H);
  t = turned(s3.turn, s4.turn);
  ok(s4.y - s3.y > 100 && t.ang < 2, `a swipe beside it scrolls the page ${s4.y - s3.y} px, the molecule stays (${t.ang}°)`);

  // the model «Молекулы аромата» in Вкус
  await page.goto(fileUrl('vkus.html') + '#молекулы', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const el = document.querySelector('.lab-tool[data-lab="molecules"]');
    for (let d = el.closest('details'); d; d = d.parentElement.closest('details')) d.open = true;
    el.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await page.waitForFunction(() => { const c = document.getElementById('lab-mol-cv'); return c && c.molView; }, null, { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.getElementById('lab-mol-cv').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(400);
  const L = '#lab-mol-cv';
  const v0 = await state(L);
  if (ok(!!v0.turn, 'the model «Молекулы аромата» is built')) {
    await swipe(v0.cx, v0.cy - 70, v0.cx, v0.cy + 90);
    const v1 = await state(L);
    t = turned(v0.turn, v1.turn);
    ok(Math.abs(v1.y - v0.y) <= 1 && t.ang > 60 && Math.abs(t.axis[0]) > 0.9, `Вкус: down on the molecule turned it ${t.ang}° round ${t.axis}, the page moved ${v1.y - v0.y} px`);
  }
  await ctx.close();

  // ---------- the stage leaves room to scroll on a short phone ----------
  for (const [name, opt] of [['375×667', { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['iPhone 13 mini', devices['iPhone 13 Mini']]]) {
    const c = await browser.newContext({ ...opt, reducedMotion: 'reduce' });
    const p = await c.newPage();
    watch(p, errs);
    const share = async (file, sel, prep) => {
      await p.goto(fileUrl(file), { waitUntil: 'load' });
      await p.waitForTimeout(500);
      if (prep) await p.evaluate(prep);
      return p.evaluate(s => { const e = document.querySelector(s); return e ? Math.round(100 * e.getBoundingClientRect().height / innerHeight) : null; }, sel);
    };
    const home = await share('index.html', H);
    const lab = await share('vkus.html#молекулы', '.lab-tool[data-lab="molecules"] .mol-canvas, ' + L, () => {
      const el = document.querySelector('.lab-tool[data-lab="molecules"]');
      for (let d = el.closest('details'); d; d = d.parentElement.closest('details')) d.open = true;
      el.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    await p.waitForFunction(() => !!document.getElementById('lab-mol-cv'), null, { timeout: 10000 }).catch(() => {});
    const lab2 = lab || await p.evaluate(() => { const e = document.getElementById('lab-mol-cv'); return e ? Math.round(100 * e.getBoundingClientRect().height / innerHeight) : null; });
    ok(home && home <= 45 && lab2 && lab2 <= 45, `${name}: the stage takes ${home} % of the screen on the home page, ${lab2} % in Вкус`);
    await c.close();
  }

  // ---------- a computer: the mouse up and down, over the top as well ----------
  const d = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  watch(d, errs);
  await d.goto(fileUrl('index.html'), { waitUntil: 'load' });
  await d.waitForTimeout(600);
  await d.evaluate(() => document.getElementById('home-molecule').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await d.waitForFunction(() => !!document.getElementById('home-molecule').molView, null, { timeout: 8000 }).catch(() => {});
  const m0 = await d.evaluate(() => { const c = document.getElementById('home-molecule'), r = c.getBoundingClientRect(); return { turn: c.molView && c.molView.turn, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await d.mouse.move(m0.x, m0.y - 100);
  await d.mouse.down();
  for (let i = 1; i <= 20; i++) await d.mouse.move(m0.x, m0.y - 100 + i * 10);
  await d.mouse.up();
  const m1 = await d.evaluate(() => { const c = document.getElementById('home-molecule'); return c.molView && c.molView.turn; });
  t = turned(m0.turn, m1);
  ok(t.ang > 90 && Math.abs(t.axis[0]) > 0.9, `mouse down the molecule: ${t.ang}° round ${t.axis}`);

  // ---------- the finger does not leave things lit ----------
  // every style the site sends: the two sheets and each chapter's model styles (styleFor in its file)
  const sheets = ['style.css', 'lab.css'].map(n => [n, fs.readFileSync(path.join(ROOT, 'assets/css', n), 'utf8')]);
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/js/labs')).filter(x => x.endsWith('.js'))) {
    const js = fs.readFileSync(path.join(ROOT, 'assets/js/labs', f), 'utf8');
    for (const m of js.matchAll(/styleFor\("[a-z]+", ("(?:[^"\\]|\\.)*")\)/g)) sheets.push([f, JSON.parse(m[1])]);
  }
  const bare = sheets.flatMap(([n, css]) => bareHover(css).map(s => `${n}: ${s}`));
  ok(sheets.length > 8 && !bare.length, `every «:hover» is held by @media (hover: hover) — ${sheets.length} style sheets${bare.length ? `; ${bare.length} not: ${bare.slice(0, 4).join(' | ')}` : ''}`);

  // a finger puts «hover» on what it lands on (a phone does; the emulator does not, so it is forced here):
  // on a phone it changes nothing, with a mouse it still lights things up
  const LOOK = ['background-color', 'border-color', 'color', 'transform', 'translate', 'rotate', 'box-shadow'];
  const TARGETS = {
    'udobreniya.html': ['#sheet-toc .toc-item[data-toc="sorta"] .toc-link', '#sheet-toc .toc-item[data-toc="udobreniya"] .toc-sub li:nth-child(2) a', '#sheet-toc .toc-item[data-toc="vkus"] .toc-tog', '.subnav a:nth-child(3)'],
    'index.html': ['#tools-home .tool', '#theme-toggle', '#home-mol-chips .chip[aria-pressed="false"]']
  };
  const hovered = async (mode, opt) => {
    const c = await browser.newContext({ ...opt, reducedMotion: 'reduce' });
    const p = await c.newPage();
    watch(p, errs);
    const cdp = await c.newCDPSession(p);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const out = [];
    for (const [file, sels] of Object.entries(TARGETS)) {
      await p.goto(fileUrl(file), { waitUntil: 'load' });
      await p.waitForTimeout(700);
      if (file === 'udobreniya.html') {
        await p.click(mode === 'phone' ? '.tabbar [data-open="sheet-toc"]' : '.topbar .toc-btn');
        await p.waitForTimeout(600);
      }
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      for (const sel of sels) {
        const look = () => p.evaluate(([s, props]) => { const e = document.querySelector(s); if (!e) return null; const cs = getComputedStyle(e); return props.map(k => cs.getPropertyValue(k)).join(' | '); }, [sel, LOOK]);
        const before = await look();
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
        if (!before || !nodeId) { out.push({ sel, missing: true }); continue; }
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
        await p.waitForTimeout(500);
        const after = await look();
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
        out.push({ sel, changed: before !== after });
      }
    }
    const tap = mode === 'phone' && await p.evaluate(() => ['#sheet-toc', '.tools-group', '.sh-mol', 'main'].map(s => [s, getComputedStyle(document.querySelector(s)).webkitTapHighlightColor]));
    await c.close();
    return { out, tap };
  };
  const ph = await hovered('phone', devices['Pixel 7']);
  const lit = ph.out.filter(x => x.missing || x.changed).map(x => x.sel + (x.missing ? ' (not found)' : ''));
  ok(!lit.length, `phone: a finger's «hover» leaves ${ph.out.length} menu rows, tabs, cards and buttons as they were${lit.length ? ' — lit: ' + lit.join(', ') : ''}`);
  const flash = ph.tap.filter(([, c]) => c !== 'rgba(0, 0, 0, 0)');
  ok(!flash.length, `phone: no tap flash on the sheet, the tool groups, the molecule's stage, the page${flash.length ? ' — ' + flash.map(([s, c]) => `${s} ${c}`).join(', ') : ''}`);
  const dk = await hovered('desktop', { viewport: { width: 1280, height: 900 } });
  const dull = dk.out.filter(x => x.missing || !x.changed).map(x => x.sel + (x.missing ? ' (not found)' : ''));
  ok(!dull.length, `computer: the mouse still lights up ${dk.out.length} rows, tabs, cards and buttons${dull.length ? ' — not: ' + dull.join(', ') : ''}`);

  // a tap is not a keyboard: an arc of the season wheel or a node of the pinching trainer (focusable for Tab) gets the
  // focus from a finger, and Safari draws its own blue frame round it — its stylesheet still rings «:focus». Chromium's
  // does not, so the test puts Safari's rule on the page; the site's own rule must win over it. With Tab the ring stays
  const SAFARI = ':focus { outline: auto 5px -webkit-focus-ring-color; }';
  const fc = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
  const fp = await fc.newPage();
  watch(fp, errs);
  const rings = [];
  for (const [file, sel] of [['kalendar.html', '.w-arc'], ['formirovka.html#тренажер', '.s-node']]) {
    await fp.goto(fileUrl(file), { waitUntil: 'load' });
    await fp.waitForTimeout(800);
    await fp.evaluate(css => { const st = document.createElement('style'); st.textContent = css; document.head.prepend(st); }, SAFARI);
    await fp.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
    await fp.waitForTimeout(300);
    const box = await fp.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
    // a point of the shape itself (an arc's box is mostly empty): the first of a grid that hits it
    const at = await fp.evaluate(([s, b]) => {
      const el = document.querySelector(s), r = el.getBoundingClientRect();
      for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
        const x = r.left + r.width * i / 12, y = r.top + r.height * j / 12, hit = document.elementFromPoint(x, y);
        if (hit && hit.closest(s) === el) return { x, y };
      }
      return b;
    }, [sel, box]);
    await fp.touchscreen.tap(at.x, at.y);
    await fp.waitForTimeout(200);
    const r = await fp.evaluate(s => { const a = document.activeElement; return { mine: !!(a && a.closest(s)), ring: a ? getComputedStyle(a).outlineStyle : '' }; }, sel);
    rings.push(`${sel} ${r.mine ? 'focused' : 'not focused'}, outline ${r.ring}`);
    if (r.mine && r.ring !== 'none') rings.push('LIT');
  }
  ok(!rings.includes('LIT') && rings.some(x => / focused/.test(x)), `a tap on the season wheel and on the trainer leaves no focus frame: ${rings.filter(x => x !== 'LIT').join('; ')}`);
  await fc.close();
  const kp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await kp.goto(fileUrl('kalendar.html'), { waitUntil: 'load' });
  await kp.waitForTimeout(500);
  await kp.keyboard.press('Tab');
  const kring = await kp.evaluate(() => { const a = document.activeElement; return a ? `${a.className || a.tagName} ${getComputedStyle(a).outlineStyle} ${getComputedStyle(a).outlineWidth}` : ''; });
  ok(/ solid 3px$/.test(kring), `with Tab the focus ring is there: ${kring}`);
  await kp.close();

  await browser.close();
  done(errs);
})().catch(e => { console.error(e); process.exit(1); });
