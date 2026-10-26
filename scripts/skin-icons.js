#!/usr/bin/env node
/* Значки оформлений из значков спрайта (src/layout.html, символы i-*).

   «Друид» — резьба по дереву. Кривые и круги
   становятся несколькими прямыми надрезами, как у рун (круг — шестигранник, дуга — две-три засечки), с лёгкой
   неровностью руки; точки — ромбики. Тёмную канавку под надрезом и толщину рисует 02-icons.js и стиль оформления.
   «Гримуар» — спрайт приставки 16 × 16: линии значка в пиксель-два, то, что они замыкают, залито, сверху и слева
   у линий — свет, вокруг всего — тёмный контур, у некоторых частей свой цвет (SPRITE: пламя, кровь, яд, вода).
   Спрайт, нарисованный рукой (02-icons-grimoire-hand.js), сильнее этого.

     node scripts/skin-icons.js        → src/js/skins/02-icons-druid.js и 02-icons-grimoire.js

   Запускать после правки значков в layout.html: новый значок без резной пары в «Друиде» остаётся прежним. */
const fs = require('fs');
const path = require('path');
const { playwright } = require('../tests/lib');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'js', 'skins', '02-icons-druid.js');
const OUT_G = path.join(ROOT, 'src', 'js', 'skins', '02-icons-grimoire.js');
// an object of SPRITE with its functions, as the text the page evaluates
const toSrc = o => '{' + Object.entries(o).map(([k, v]) => `${k}: ${typeof v === 'function' ? v.toString() : JSON.stringify(v)}`).join(', ') + '}';
const layout = fs.readFileSync(path.join(ROOT, 'src', 'layout.html'), 'utf8');
const symbols = [...layout.matchAll(/<symbol id="(i-[a-z0-9-]+)" viewBox="0 0 24 24">([\s\S]*?)<\/symbol>/g)].map(m => [m[1], m[2]]);

// in the page: each shape of a symbol walked along its length, cut into straight strokes, a little uneven
function carve(list) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  document.body.appendChild(svg);
  // Ramer–Douglas–Peucker: the fewest points that stay within eps of the line
  const rdp = (pts, eps) => {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts[pts.length - 1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9;
    let far = 0, at = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], d = Math.hypot(dx, dy) < 1e-6 ? Math.hypot(p[0] - a[0], p[1] - a[1]) : Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / L;
      if (d > far) { far = d; at = i; }
    }
    if (far <= eps) return [a, b];
    return rdp(pts.slice(0, at + 1), eps).slice(0, -1).concat(rdp(pts.slice(at), eps));
  };
  // a closed loop has no ends to keep: it starts where it bends most, so its cuts fall evenly
  const loop = (pts, eps) => {
    const c = pts.reduce((m, p) => [m[0] + p[0] / pts.length, m[1] + p[1] / pts.length], [0, 0]);
    let k = 0, best = -1;
    pts.forEach((p, i) => { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d > best) { best = d; k = i; } });
    const r = pts.slice(k).concat(pts.slice(0, k), [pts[k]]);
    const s = rdp(r, eps);
    return s.slice(0, -1);
  };
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const f = v => +v.toFixed(2);
  return list.map(([id, body]) => {
    seed = [...id].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 7;
    svg.innerHTML = body;
    const out = [];
    for (const el of svg.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon')) {
      const filled = (el.getAttribute('fill') || 'none') !== 'none';
      const len = el.getTotalLength();
      const step = Math.min(0.25, len / 24);
      const pts = [];
      for (let s = 0; s <= len + 1e-6; s += step) { const p = el.getPointAtLength(Math.min(s, len)); pts.push([p.x, p.y]); }
      // the pieces of a path with more than one start
      const runs = [[pts[0]]];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) > step * 3) runs.push([b]); else runs[runs.length - 1].push(b);
      }
      for (const run of runs) {
        if (run.length < 2) continue;
        const [a, b] = [run[0], run[run.length - 1]];
        const closed = filled || Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5;
        // the size of the shape decides how coarse its cuts are: a dot is a lozenge, a big curve keeps its course
        const xs = run.map(p => p[0]), ys = run.map(p => p[1]), size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
        const eps = filled ? Math.max(0.25, size * 0.12) : Math.min(0.62, Math.max(0.3, size * 0.09));
        let v = closed ? loop(run, eps) : rdp(run, eps);
        // the hand: each corner moved a little, never far
        v = v.map(([x, y]) => { const q = rnd() * Math.PI * 2, r = rnd() * (filled ? 0.06 : 0.16); return [x + Math.cos(q) * r, y + Math.sin(q) * r]; });
        if (closed && v.length < 3) continue;
        const d = 'M' + v.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + (closed ? 'Z' : '');
        out.push(filled ? { d, fill: 1 } : { d });
      }
    }
    return [id, out];
  });
}

// «Гримуар»: what is special in a sprite — the colour of a part's line (line), of what it holds (body, by the part
// that holds it), of what lies in a part of the picture (part: the centre of a held area in pixels of 16 → a colour),
// a glint in what is glass. The colours: # the icon's, + its light, = its shade, r blood, g gold, v venom (green), b the
// cold of water, w the glint
const SPRITE = {
  candle: { line: { 0: 'g' }, body: { 0: 'w', 2: '+' } },
  flask: { part: (x, y) => (y > 9.5 ? 'r' : null), glint: 1 },
  drop: { body: { 0: 'r' }, line: { 1: 'w' } },
  sun: { body: { 0: 'g' }, line: { 1: 'g' } },
  moon: { body: { 0: 'g' } },
  flower: { body: { 1: 'v' } },
  pot: { body: { 1: 'v' }, line: { 1: 'v' } },
  leaf: { body: { 0: 'v' } },
  seed: { body: { 0: 'g' } },
  sprout: { body: { 1: 'v' }, line: { 1: 'v' } },
  bug: { body: { 0: 'r' } },
  thermo: { body: { 0: 'r' }, line: { 1: 'r' } },
  glass: { part: (x, y) => (y > 6.5 ? 'r' : null), line: { 3: 'w', 4: 'w' }, glint: 1 },
  cake: { part: (x, y) => (y > 10.5 ? 'r' : y > 8 ? '+' : null), body: { 4: 'v' } },
  bulb: { body: { 1: 'g' }, line: { 2: 'w' }, glint: 1 },
  lamp: { line: { 1: 'g' } },
  jar: { part: (x, y) => (y > 7.6 ? 'r' : null), glint: 1 },
  cup: { part: (x, y) => (y > 8.2 ? 'g' : null), body: { 2: 'v' } },
  skin: { part: (x, y, k) => ({ 1: 'r', 2: 'g', 3: 'v' })[k] || null },
  book: { body: { 0: '+' } },
  garden: { body: { 1: 'v' } },
  greenhouse: { glint: 1 },
  search: { glint: 1 },
  'ch-sorta': { body: { 1: 'v' } },
  'ch-posadka': { body: { 3: 'v' } },
  'ch-gidro': { part: (x, y) => (y > 9.8 ? 'b' : null), body: { 4: 'v' }, glint: 1 },
  'ch-vkus': { body: { 3: 'v' } },
  'ch-problemy': { body: { 0: 'r' } },
  'ch-udobreniya': { line: { 2: 'g', 3: 'g', 4: 'g' } },
  'ch-uhod': { body: { 0: '=' } },
  'ch-spravka': { body: { 0: '=' } }
};
// in the page: each symbol drawn small on a grid of 16 — its lines a pixel or two, what they close filled, a light on
// the top and left of the lines, a dark outline round it all — and read back as rows of characters
function pixelate(list, SPR) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  document.body.appendChild(svg);
  const N = 16, K = N / 24;
  const cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const x = cv.getContext('2d', { willReadFrequently: true });
  const mask = draw => { x.clearRect(0, 0, N, N); x.save(); x.scale(K, K); draw(); x.restore(); const d = x.getImageData(0, 0, N, N).data; return Array.from({ length: N * N }, (_, i) => d[i * 4 + 3] / 255); };
  const parse = spr => Object.assign({ line: {}, body: {} }, spr ? eval('(' + spr + ')') : {});
  return list.map(([id, body, sprSrc]) => {
    const spr = parse(sprSrc);
    svg.innerHTML = body;
    const els = [...svg.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon')].map(el => {
      const filled = (el.getAttribute('fill') || 'none') !== 'none', len = el.getTotalLength(), step = Math.min(0.2, len / 30), pts = [];
      for (let s = 0; s <= len + 1e-6; s += step) { const p = el.getPointAtLength(Math.min(s, len)); pts.push([p.x, p.y]); }
      const runs = [[pts[0]]];
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > step * 3) runs.push([b]); else runs[runs.length - 1].push(b); }
      return { filled, runs };
    });
    const trace = r => { x.beginPath(); r.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); };
    // each part's line, and the area it closes (to know which part holds an area)
    const lines = els.map(e => mask(() => { x.lineWidth = 1.45 / K; x.lineCap = 'round'; x.lineJoin = 'round'; e.runs.forEach(r => { trace(r); if (e.filled) x.fill(); else x.stroke(); }); }));
    const holds = els.map(e => mask(() => { e.runs.forEach(r => { trace(r); x.closePath(); x.fill(); }); }));
    const own = Array(N * N).fill(-1);
    for (let i = 0; i < N * N; i++) { let best = 0.42; lines.forEach((m, k) => { if (m[i] > best) { best = m[i]; own[i] = k; } }); }
    // the outside: all that is not a line and is reached from the edge
    const out = Array(N * N).fill(false), q = [];
    for (let i = 0; i < N; i++) [i, N * (N - 1) + i, i * N, i * N + N - 1].forEach(k => { if (own[k] < 0 && !out[k]) { out[k] = true; q.push(k); } });
    while (q.length) { const k = q.pop(), cx = k % N, cy = (k / N) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = cx + dx, Y = cy + dy, j = Y * N + X; if (X >= 0 && Y >= 0 && X < N && Y < N && !out[j] && own[j] < 0) { out[j] = true; q.push(j); } }); }
    // the held areas, each by itself
    const comp = Array(N * N).fill(-1), comps = [];
    for (let i = 0; i < N * N; i++) {
      if (own[i] >= 0 || out[i] || comp[i] >= 0) continue;
      const c = { px: [] }, st = [i];
      comp[i] = comps.length;
      while (st.length) { const k = st.pop(); c.px.push(k); const cx = k % N, cy = (k / N) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = cx + dx, Y = cy + dy, j = Y * N + X; if (X >= 0 && Y >= 0 && X < N && Y < N && comp[j] < 0 && own[j] < 0 && !out[j]) { comp[j] = comps.length; st.push(j); } }); }
      // the part that holds it: the smallest closed part over it
      let by = -1, area = Infinity;
      holds.forEach((m, k) => { const cover = c.px.filter(p => m[p] > 0.5).length / c.px.length, a = m.reduce((s, v) => s + v, 0); if (cover > 0.6 && a < area) { area = a; by = k; } });
      const mx = c.px.reduce((s, p) => s + (p % N) + 0.5, 0) / c.px.length, my = c.px.reduce((s, p) => s + ((p / N) | 0) + 0.5, 0) / c.px.length;
      c.col = (spr.part && spr.part(mx, my, by)) || spr.body[by] || '=';
      comps.push(c);
    }
    const g = Array(N * N).fill('.');
    for (let i = 0; i < N * N; i++) {
      const cx = i % N, cy = (i / N) | 0;
      if (own[i] >= 0) {
        const lc = spr.line[own[i]] || '#';
        const lit = (cy > 0 && out[i - N]) || (cx > 0 && out[i - 1]);
        g[i] = lc === '#' && lit ? '+' : lc;
      } else if (comp[i] >= 0) g[i] = comps[comp[i]].col;
    }
    // a glint in glass: the first pixel of the biggest held area, at its top left
    if (spr.glint && comps.length) { const c = comps.slice().sort((a, b) => b.px.length - a.px.length)[0]; if (c.px.length >= 6) { const k = c.px.slice().sort((a, b) => (((a / N) | 0) + (a % N)) - (((b / N) | 0) + (b % N)))[0]; g[k] = 'w'; } }
    // the dark outline
    for (let i = 0; i < N * N; i++) {
      if (!out[i]) continue;
      const cx = i % N, cy = (i / N) | 0;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = cx + dx, Y = cy + dy; return X >= 0 && Y >= 0 && X < N && Y < N && !out[Y * N + X]; })) g[i] = 'o';
    }
    return [id, Array.from({ length: N }, (_, y) => g.slice(y * N, y * N + N).join(''))];
  });
}

(async () => {
  const { chromium } = playwright();
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.setContent('<!doctype html><body></body>');
  const carved = await page.evaluate(carve, symbols);
  const sprites = await page.evaluate(([list, f]) => eval('(' + f + ')')(list), [symbols.map(([id, body]) => [id, body, SPRITE[id.slice(2)] ? toSrc(SPRITE[id.slice(2)]) : '']), pixelate.toString()]);
  await b.close();
  const grim = `  /* ------------------------------------------------------------------ */
  /* «Гримуар»: the icons of the guide as sprites of the console —        */
  /* written by scripts/skin-icons.js from the icons of src/layout.html,  */
  /* not by hand (the characters: see PIX in 02-icons.js); a sprite drawn  */
  /* by hand is in 02-icons-grimoire-hand.js and wins over this one       */
  /* ------------------------------------------------------------------ */
  const GRIMOIRE_ICONS = {
${sprites.map(([id, rows]) => `    '${id.slice(2)}': [\n${rows.map(r => `      '${r}'`).join(',\n')}\n    ],`).join('\n')}
  };
`;
  fs.writeFileSync(OUT_G, grim);
  console.log(`${path.relative(ROOT, OUT_G)}: ${sprites.length} спрайтов`);
  const lines = carved.map(([id, shapes]) => `    '${id.slice(2)}': ${JSON.stringify(shapes.map(s => (s.fill ? '*' : '') + s.d))},`);
  const src = `  /* ------------------------------------------------------------------ */
  /* «Друид»: the icons of the guide cut in wood — written by             */
  /* scripts/skin-icons.js from the icons of src/layout.html, not by hand  */
  /* (a stroke is a path of straight cuts; * — a filled lozenge or chip)  */
  /* ------------------------------------------------------------------ */
  const DRUID_ICONS = {
${lines.join('\n')}
  };
`;
  fs.writeFileSync(OUT, src);
  console.log(`${path.relative(ROOT, OUT)}: ${carved.length} значков`);
})();
