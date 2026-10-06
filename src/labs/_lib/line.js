  /* ---------------- line: the things of the step-by-step pictures, drawn in one line ----------------
     The same things as props (a tray, a cup, a seedling, a lamp, a window, a bed, a greenhouse…) and the same
     calls, drawn the way the contents' icons are: a stroke the weight of the icons and the text, the same at any
     size (vector-effect in 00-ill.css), no fills. Things in front are filled with the paper, so they hide what is
     behind them. Objects take the ink (.ln), plants the green (.ln-g), soil, light and water a paler ink (.ln-s);
     where to cut stays a red dash (.ln-cut). Each thing stands on (x, y) — the middle of its bottom — unless said
     otherwise, and returns SVG markup. */
  /* @use ills */
  const line = (() => {
    const { q } = ill;
    const P = pts => 'M' + pts.map(p => p.map(q).join(' ')).join('L') + 'Z';
    const g = (cls, body) => `<g class="${cls}">${body}</g>`;
    const path = (d, cls) => `<path${cls ? ` class="${cls}"` : ''} d="${d}"/>`;

    /* ---------- the picture itself ---------- */
    // paper under the picture (follows the theme), and the line things stand on
    const paper = (w, h) => `<rect data-bg width="${w}" height="${h}" rx="14" fill="var(--ill-bg)"/>`;
    const floor = (y, w) => `<path data-bg class="ln-s" d="M${q(w * 0.07)} ${q(y)}H${q(w * 0.93)}"/>`;
    // a picture of one step: 120 × 120, things standing on y
    const step = (body, label, y = 104) => ill.svg(120, 120, paper(120, 120) + floor(y, 120) + body, label);
    // a wide picture: w × h, things standing on y
    const wide = (w, h, body, label, y) => ill.svg(w, h, paper(w, h) + floor(y, w) + body, label);

    /* ---------- leaves and plants ---------- */
    // a basil leaf from its base (x, y) towards angle a (degrees; 0 — up, + — to the right), L long; o: wide, p (stalk), rib
    function leaf(x, y, a, L, o = {}) {
      const W = L * 0.36 * (o.wide || 1), p = o.p == null ? L * 0.16 : o.p, b = -p;
      const d = `M0 0V${q(b)}C${q(-W)} ${q(b - L * 0.18)} ${q(-W * 1.08)} ${q(b - L * 0.72)} 0 ${q(b - L)}C${q(W * 1.08)} ${q(b - L * 0.72)} ${q(W)} ${q(b - L * 0.18)} 0 ${q(b)}Z`;
      const rib = o.rib === false || L < 9 ? '' : `<path d="M0 ${q(b)}V${q(b - L * 0.74)}"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)})"><path class="lnf" d="${d}"/>${rib}</g>`;
    }
    // a young plant: two round seed leaves, then pairs of true leaves. o: pairs, s (leaf scale), lean, cut (index of the pair above which a cut mark goes)
    function sprout(x, y, h = 30, o = {}) {
      const pairs = o.pairs || 0, s = o.s || 1, lean = o.lean || 0, tx = x + lean, ty = y - h;
      let lv = `<path d="M${q(x)} ${q(y)}Q${q(x + lean * 0.2)} ${q(y - h * 0.55)} ${q(tx)} ${q(ty)}"/>`;
      const cy = pairs ? y - h * 0.3 : ty, cx = x + lean * (pairs ? 0.1 : 1);
      [-1, 1].forEach(sd => { lv += leaf(cx, cy, sd * 74, 8 * s, { wide: 1.45, rib: false, p: 1.4 * s }); });
      const at = [];
      for (let i = 0; i < pairs; i++) {
        const t = (i + 1) / (pairs + 0.5), py = y - h * (0.3 + 0.7 * t), px = x + lean * t;
        at.push([px, py]);
        [-1, 1].forEach(sd => { lv += leaf(px, py, sd * (62 - i * 7), (15 - i * 1.3) * s); });
      }
      if (pairs) [-1, 1].forEach(sd => { lv += leaf(tx, ty, sd * 24, 5.5 * s, { rib: false }); });
      let out = g('ln-g', lv);
      if (o.cut != null && at[o.cut]) { const [px, py] = at[o.cut]; out += cutMark(px, py - 6 * s, 16); }
      return out;
    }
    // a grown basil bush from (x, y) up, h tall: a main stem and side shoots, leaves in pairs. o: nodes, leaf, spread, seed
    function bush(x, y, h = 60, o = {}) {
      const n = o.nodes || 3, L = (o.leaf || 0.3) * 80, rnd = ill.rng(o.seed || 9), spread = o.spread == null ? 1 : o.spread;
      const shoots = [];
      for (let i = 0; i < n - 1; i++) {
        const sy = -h * (0.18 + i * 0.24);
        [-1, 1].forEach(sd => shoots.push({ y: sy, a: sd * (48 - i * 10 + rnd() * 8) * spread, len: h * (0.62 - i * 0.12), s: L * (0.8 - i * 0.1), pairs: Math.max(1, n - 1 - i) }));
      }
      shoots.push({ y: 0, a: (rnd() - 0.5) * 6, len: h, s: L, pairs: n });
      let stems = '', leaves = '';
      shoots.forEach(sh => {
        const r = sh.a * Math.PI / 180;
        const P0 = [0, sh.y], P1 = [Math.sin(r) * sh.len * 0.6, sh.y - Math.cos(r) * sh.len * 0.6], P2 = [Math.sin(r) * sh.len * 0.72, sh.y - sh.len * 0.9];
        const at = t => [(1 - t) * (1 - t) * P0[0] + 2 * t * (1 - t) * P1[0] + t * t * P2[0], (1 - t) * (1 - t) * P0[1] + 2 * t * (1 - t) * P1[1] + t * t * P2[1]];
        const dir = t => { const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]); return Math.atan2(dx, -dy) * 180 / Math.PI; };
        stems += `<path d="M${q(P0[0])} ${q(P0[1])}Q${q(P1[0])} ${q(P1[1])} ${q(P2[0])} ${q(P2[1])}"/>`;
        for (let j = 0; j < sh.pairs; j++) {
          const t = 0.34 + 0.56 * j / Math.max(1, sh.pairs - 1), [px, py] = at(t), dd = dir(t), size = sh.s * (1 - 0.4 * t);
          [-1, 1].forEach(side => { leaves += leaf(px, py, dd + side * (58 + (rnd() - 0.5) * 12), size); });
        }
        [-1, 1].forEach(side => { leaves += leaf(P2[0], P2[1], dir(1) + side * 24, sh.s * 0.36, { rib: false }); });
      });
      return `<g class="ln-g" transform="translate(${q(x)} ${q(y)})">${stems}${leaves}</g>`;
    }
    // a bush of small leaves grown into a ball (the Greek basils): a scalloped dome on short stems; r — its radius
    function ballBush(x, y, r = 26) {
      const cy = y - r * 0.95;
      return g('ln-g', `<path d="M${q(x)} ${q(y)}V${q(cy + r * 0.5)}M${q(x)} ${q(y - r * 0.15)}l${q(-r * 0.3)} ${q(-r * 0.32)}M${q(x)} ${q(y - r * 0.2)}l${q(r * 0.3)} ${q(-r * 0.32)}"/>` +
        `<path class="lnf" d="${cloud(x, cy, r, r * 0.86, 11, 0.3)}"/>` +
        [[-0.42, -0.1, -30], [0.1, -0.42, 10], [0.45, 0.05, 40], [-0.05, 0.25, -5]].map(([dx, dy, a]) => leaf(x + dx * r, cy + dy * r + 5, a, r * 0.32, { rib: false, p: 0 })).join(''));
    }
    // a crown or a bush outline: n bumps around an ellipse; bump — how far they bulge (share of the step)
    function cloud(cx, cy, rx, ry, n = 9, bump = 0.35, from = 0, to = 2 * Math.PI) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = from + (to - from) * i / n; pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); }
      let d = `M${q(pts[0][0])} ${q(pts[0][1])}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], len = Math.hypot(x1 - x0, y1 - y0);
        d += `A${q(len * (0.5 + bump))} ${q(len * (0.5 + bump))} 0 0 1 ${q(x1)} ${q(y1)}`;
      }
      return d + 'Z';
    }
    // a seed; gel: the clear coat it grows in wet soil
    const seed = (x, y, a = 0, gel = false) => (gel ? `<circle class="ln-s" cx="${q(x)}" cy="${q(y)}" r="3.6"/>` : '') +
      `<ellipse class="ln-dot" cx="${q(x)}" cy="${q(y)}" rx="1.9" ry="1.25" transform="rotate(${q(a)} ${q(x)} ${q(y)})"/>`;
    // roots from a point downwards; o: seed, spread
    function roots(x, y, len = 20, n = 6, o = {}) {
      const rnd = ill.rng(o.seed || 3), sp = o.spread || 1;
      let d = '';
      for (let i = 0; i < n; i++) {
        const a = (i / (n - 1 || 1) - 0.5) * 1.5 * sp + (rnd() - 0.5) * 0.3, l = len * (0.55 + rnd() * 0.45);
        const ex = x + Math.sin(a) * l, ey = y + Math.cos(a) * l;
        d += `M${q(x)} ${q(y)}Q${q(x + Math.sin(a) * l * 0.35 + (rnd() - 0.5) * 5)} ${q(y + l * 0.55)} ${q(ex)} ${q(ey)}`;
      }
      return path(d, 'ln-s');
    }

    /* ---------- containers ---------- */
    // a seedling cassette seen a little from above: { svg, tops } — tops are the middles of the cells
    function tray(x, y, w = 110, o = {}) {
      const n = o.cells || 4, h = o.h || w * 0.24, d = o.depth || h * 0.5, x0 = x - w / 2, x1 = x + w / 2, yt = y - h, cw = w / n;
      let body = `<path class="lnf" d="${P([[x0, yt], [x1, yt], [x1 - 3, y], [x0 + 3, y]])}"/><path class="lnf" d="${P([[x0, yt - d], [x1, yt - d], [x1, yt], [x0, yt]])}"/>`;
      for (let i = 1; i < n; i++) body += `<path d="M${q(x0 + i * cw)} ${q(yt - d)}V${q(yt)}"/>`;
      const tops = [];
      let soil = '', grains = '';
      const rnd = ill.rng(o.seed || 5);
      for (let i = 0; i < n; i++) {
        const cx0 = x0 + i * cw + 3, cx1 = x0 + (i + 1) * cw - 3;
        soil += `M${q(cx0)} ${q(yt - d * 0.45)}Q${q((cx0 + cx1) / 2)} ${q(yt - d * 0.62)} ${q(cx1)} ${q(yt - d * 0.45)}`;
        if (o.perlite) for (let k = 0; k < 2; k++) grains += `M${q(cx0 + 2 + rnd() * (cx1 - cx0 - 4))} ${q(yt - d * 0.2)}h.1`;
        tops.push([(cx0 + cx1) / 2, yt - d / 2 + 1]);
      }
      return { svg: g('ln', body) + path(soil, 'ln-s') + (grains ? path(grains, 'ln-s ln-grain') : ''), tops };
    }
    // a plastic cup, or a paper one; plants go in at (x, top of soil) = cupSoil(…)
    const cupSoil = (y, h = 34, o = {}) => y - h * (o.soil == null ? 0.82 : o.soil);
    function cup(x, y, w = 30, h = 34, o = {}) {
      const t = w / 2, b = w * 0.38, sl = o.soil == null ? 0.82 : o.soil, ys = y - h * sl, tw = b + (t - b) * sl;
      let out = g('ln', `<path class="lnf" d="${P([[x - t, y - h], [x + t, y - h], [x + b, y], [x - b, y]])}"/>` + (o.paper ? `<path d="M${q(x - t * 0.94)} ${q(y - h * 0.82)}H${q(x + t * 0.94)}"/>` : ''));
      out += path(`M${q(x - tw + 1)} ${q(ys)}H${q(x + tw - 1)}`, 'ln-s');
      if (o.roots) out += roots(x, ys + 3, h * sl * 0.8, 6, { seed: 4, spread: 1.2 });
      return out;
    }
    // a clay pot standing on (x, y): w wide at the rim, h tall; soil at the rim
    function pot(x, y, w = 40, h = 26) {
      const t = w / 2, b = w * 0.36, rim = Math.max(4, h * 0.2);
      return g('ln', `<path class="lnf" d="${P([[x - t * 0.94, y - h + rim], [x + t * 0.94, y - h + rim], [x + b, y], [x - b, y]])}"/><rect class="lnf" x="${q(x - t)}" y="${q(y - h)}" width="${q(w)}" height="${q(rim)}" rx="2"/>`) +
        path(`M${q(x - t + 4)} ${q(y - h + rim * 0.5)}h${q(w - 8)}`, 'ln-s');
    }
    // a paper bag of soil, open
    function bag(x, y, w = 34, h = 46) {
      const t = w / 2;
      return g('ln', `<path class="lnf" d="M${q(x - t)} ${q(y)}V${q(y - h + 8)}L${q(x - t + 6)} ${q(y - h)}H${q(x + t - 6)}L${q(x + t)} ${q(y - h + 8)}V${q(y)}Z"/><path d="M${q(x - t)} ${q(y - h + 8)}H${q(x + t)}"/>`) +
        path(`M${q(x - t + 7)} ${q(y - h)}Q${q(x)} ${q(y - h - 5)} ${q(x + t - 7)} ${q(y - h)}`, 'ln-s');
    }

    /* ---------- tools ---------- */
    // a spray bottle with its mist towards dir (−1 left, 1 right)
    function sprayer(x, y, s = 1, o = {}) {
      const dir = o.dir || -1;
      let out = `<g class="ln" transform="translate(${q(x)} ${q(y)}) scale(${s})"><path class="lnf" d="M-10 0V-28Q-10 -34 -4 -35H4Q10 -34 10 -28V0Z"/><path class="lnf" d="M-5 -35V-41H5V-35Z"/>` +
        `<path class="lnf" d="M-5 -41H${dir * 15}V-46H-5Z"/><path d="M${-dir * 3} -40 ${-dir * 8} -31"/><path d="M-10 -14H10"/></g>`;
      if (o.mist !== false) { const sx = x + dir * 17 * s, sy = y - 43.5 * s; out += path([-0.35, 0, 0.35].map(a => `M${q(sx + dir * 3)} ${q(sy + a * 3)}l${q(dir * 11 * s)} ${q(a * 11 * s)}`).join(''), 'ln-s'); }
      return out;
    }
    // a hanging LED lamp and its light; (x, y) — the middle of the lamp
    function lamp(x, y, w = 70, o = {}) {
      const reach = o.reach || 60, x0 = x - w / 2, x1 = x + w / 2;
      const rays = [-0.5, -0.17, 0.17, 0.5].map(k => `M${q(x + k * w * 0.8)} ${q(y + 10)}L${q(x + k * (w * 0.8 + reach * 0.5))} ${q(y + reach)}`).join('');
      return path(rays, 'ln-s ln-dash') + g('ln', `<path d="M${q(x0 + 8)} ${q(y - 40)}V${q(y)}M${q(x1 - 8)} ${q(y - 40)}V${q(y)}"/><rect class="lnf" x="${q(x0)}" y="${q(y)}" width="${q(w)}" height="6" rx="3"/>`);
    }
    // a thermometer, level 0–1
    function thermo(x, y, h = 40, level = 0.6) {
      const top = y - h, ly = y - 9 - (h - 14) * level;
      return g('ln', `<path class="lnf" d="M${q(x - 3.5)} ${q(y - 8.5)}V${q(top + 3.5)}a3.5 3.5 0 0 1 7 0V${q(y - 8.5)}A5.5 5.5 0 1 1 ${q(x - 3.5)} ${q(y - 8.5)}Z"/><path d="M${q(x)} ${q(y - 6)}V${q(ly)}"/>` +
        [0.25, 0.5, 0.75].map(t => `<path d="M${q(x + 6)} ${q(y - 9 - (h - 14) * t)}h3"/>`).join(''));
    }
    // a clear dome lid over a tray, misted on the inside
    function lid(x, y, w, h, o = {}) {
      const x0 = x - w / 2, x1 = x + w / 2, r = Math.min(10, h * 0.4);
      const d = `M${q(x0)} ${q(y)}V${q(y - h + r)}Q${q(x0)} ${q(y - h)} ${q(x0 + r)} ${q(y - h)}H${q(x1 - r)}Q${q(x1)} ${q(y - h)} ${q(x1)} ${q(y - h + r)}V${q(y)}`;
      let drops = '';
      if (o.drops !== false) { const rnd = ill.rng(o.seed || 4); for (let i = 0; i < 6; i++) drops += `<circle cx="${q(x0 + 7 + rnd() * (w - 14))}" cy="${q(y - h + 6 + rnd() * h * 0.4)}" r="1.1"/>`; }
      return g('ln', `<path d="${d}"/><rect class="lnf" x="${q(x - 8)}" y="${q(y - h - 3)}" width="16" height="4" rx="2"/>`) + g('ln-s', drops + `<path d="M${q(x0 + 5)} ${q(y - h + 8)}Q${q(x0 + 4)} ${q(y - 10)} ${q(x0 + 6)} ${q(y - 5)}"/>`);
    }
    // garden snips with their pivot at (x, y), blades towards angle a (degrees, 0 — to the right)
    function scissors(x, y, a = 0, s = 1, open = 1) {
      const o = 5 * open;
      const body = `<path d="M-14 -${q(o + 3)}Q-3 -${q(o + 2)} 0 0M-14 ${q(o + 3)}Q-3 ${q(o + 2)} 0 0"/>` +
        `<ellipse class="lnf" cx="-19" cy="-${q(o + 5)}" rx="6.5" ry="4.6"/><ellipse class="lnf" cx="-19" cy="${q(o + 5)}" rx="6.5" ry="4.6"/>` +
        `<path class="lnf" d="M-1 -1.6L27 -${q(o + 3)}Q30 -${q(o + 2)} 28 -${q(o)}L0 2Z"/><path class="lnf" d="M-1 1.6L27 ${q(o + 3)}Q30 ${q(o + 2)} 28 ${q(o)}L0 -2Z"/><circle class="ln-dot" r="1.6"/>`;
      return `<g class="ln" transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${body}</g>`;
    }
    // where to cut: a short red dash across a stem
    const cutMark = (x, y, w = 18) => path(`M${q(x - w / 2)} ${q(y)}H${q(x + w / 2)}`, 'ln-cut');

    /* ---------- outdoors and places ---------- */
    const sun = (x, y, r = 10) => g('ln', `<circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}"/>` + `<path d="${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `M${q(x + Math.cos(a) * (r + 4))} ${q(y + Math.sin(a) * (r + 4))}L${q(x + Math.cos(a) * (r + 8))} ${q(y + Math.sin(a) * (r + 8))}`; }).join('')}"/>`);
    // a tree giving shade: a trunk and a scalloped crown
    function tree(x, y, s = 1) {
      return g('ln', `<path d="M${q(x)} ${q(y)}V${q(y - 46 * s)}M${q(x)} ${q(y - 30 * s)}l${q(-9 * s)} ${q(-10 * s)}M${q(x)} ${q(y - 38 * s)}l${q(8 * s)} ${q(-8 * s)}"/>`) +
        g('ln-g', `<path class="lnf" d="${cloud(x, y - 70 * s, 30 * s, 24 * s, 12, 0.28)}"/>`);
    }
    // a bed: soil from x0 to x1 with its top at y; mulch: straw on it
    function bed(x0, x1, y, o = {}) {
      const rnd = ill.rng(o.seed || 4), dep = o.depth || 16;
      let out = g('ln', `<path class="lnf" d="M${q(x0)} ${q(y + dep)}V${q(y + 2)}Q${q(x0 + 6)} ${q(y - 2)} ${q(x0 + 14)} ${q(y - 1)}H${q(x1 - 14)}Q${q(x1 - 6)} ${q(y - 2)} ${q(x1)} ${q(y + 2)}V${q(y + dep)}"/>`);
      let grains = '', d = '';
      for (let i = 0; i < (x1 - x0) / 9; i++) grains += `M${q(x0 + 8 + rnd() * (x1 - x0 - 16))} ${q(y + 5 + rnd() * (dep - 8))}h.1`;
      if (o.mulch) for (let i = 0; i < (x1 - x0) / 7; i++) { const sx = x0 + 6 + rnd() * (x1 - x0 - 14); d += `M${q(sx)} ${q(y - 1 + rnd() * 2)}l${q(4 + rnd() * 3)} ${q((rnd() - 0.5) * 2.5)}`; }
      return out + path(grains, 'ln-s ln-grain') + (d ? path(d, 'ln-s') : '');
    }
    // a window seen from the room: (x, y) — the middle of the sill; o: radiator under it, sun, rays
    function window_(x, y, w = 120, h = 100, o = {}) {
      const x0 = x - w / 2, top = y - h;
      let out = '';
      if (o.rays) out += path([0, 1, 2].map(i => `M${q(x0 + w * (0.66 + i * 0.1))} ${q(top + 6)}L${q(x0 + w * (0.26 + i * 0.12))} ${q(y - 2)}`).join(''), 'ln-s ln-dash');
      out += g('ln', `<rect x="${q(x0)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" rx="2"/><path d="M${q(x)} ${q(top)}V${q(y)}"/>` +
        (o.sun ? `<circle cx="${q(x0 + w * 0.78)}" cy="${q(top + h * 0.24)}" r="${q(h * 0.09)}"/>` : '') +
        `<rect class="lnf" x="${q(x0 - 10)}" y="${q(y)}" width="${q(w + 20)}" height="6" rx="2"/>`);
      if (o.radiator) {
        const ry = y + 14, fin = (w - 12) / 8;
        let r = '';
        for (let i = 0; i < 8; i++) r += `<rect x="${q(x0 + 6 + i * fin)}" y="${q(ry)}" width="${q(fin - 3)}" height="28" rx="3"/>`;
        out += g('ln', r) + path([0, 1, 2].map(i => `M${q(x - 20 + i * 18)} ${q(ry - 3)}q-4 -4 0 -8`).join(''), 'ln-s');
      }
      return out;
    }
    // a balcony: a railing across the picture and a box of soil hanging on it (box: [x0, x1])
    function balcony(x0, x1, y, o = {}) {
      let bars = '';
      for (let x = x0 + 10; x < x1 - 4; x += 14) bars += `M${q(x)} ${q(y - 44)}V${q(y)}`;
      let out = g('ln', `<path d="M${q(x0)} ${q(y - 46)}H${q(x1)}M${q(x0)} ${q(y)}H${q(x1)}"/>`) + path(bars, 'ln-s');
      if (o.box) { const [bx0, bx1] = o.box; out += g('ln', `<rect class="lnf" x="${q(bx0)}" y="${q(y - 62)}" width="${q(bx1 - bx0)}" height="20" rx="3"/><path d="M${q(bx0 + 8)} ${q(y - 42)}l-4 -6M${q(bx1 - 8)} ${q(y - 42)}l4 -6"/>`) + path(`M${q(bx0 + 4)} ${q(y - 57)}H${q(bx1 - 4)}`, 'ln-s'); }
      return out;
    }
    // a small greenhouse: arched frame and clear walls; (x, y) — the middle of its floor; vent: the top window open
    function greenhouse(x, y, w = 150, h = 100, o = {}) {
      const t = w / 2;
      const arch = `M${q(x - t)} ${q(y)}V${q(y - h * 0.55)}Q${q(x - t)} ${q(y - h)} ${q(x)} ${q(y - h)}Q${q(x + t)} ${q(y - h)} ${q(x + t)} ${q(y - h * 0.55)}V${q(y)}`;
      return path([-0.5, 0.5].map(k => `M${q(x + k * t)} ${q(y)}V${q(y - h * 0.9)}`).join('') + `M${q(x)} ${q(y)}V${q(y - h)}`, 'ln-s') +
        g('ln', `<path d="${arch}"/>` + (o.vent ? `<path d="M${q(x + t * 0.18)} ${q(y - h * 0.99)}l${q(t * 0.3)} -10l4 8"/>` : ''));
    }
    // a hydroponic tank, cut open: lid with net pots, roots in the solution, an air stone bubbling
    function tank(x, y, w = 110, h = 52, o = {}) {
      const t = w / 2, top = y - h, rnd = ill.rng(o.seed || 3), pots = o.pots || [-0.5, 0, 0.5];
      let out = g('ln', `<rect x="${q(x - t)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" rx="4"/>`);
      out += path(`M${q(x - t + 4)} ${q(top + 12)}q${q(w / 8)} -3 ${q(w / 4)} 0t${q(w / 4)} 0t${q(w / 4)} 0t${q(w / 4 - 8)} 0`, 'ln-s');
      pots.forEach((k, i) => { out += roots(x + k * t, top + 8, h - 16, 6, { seed: 20 + i, spread: 0.7 }); });
      let b = '';
      for (let i = 0; i < 6; i++) b += `<circle cx="${q(x + (rnd() - 0.5) * 16)}" cy="${q(y - 12 - rnd() * (h - 28))}" r="${q(1 + rnd())}"/>`;
      out += g('ln-s', b) + g('ln', `<rect class="lnf" x="${q(x - 7)}" y="${q(y - 8)}" width="14" height="4" rx="2"/><path d="M${q(x + 7)} ${q(y - 6)}Q${q(x + t - 8)} ${q(y - 6)} ${q(x + t - 6)} ${q(top + 4)}"/>` +
        `<rect class="lnf" x="${q(x - t - 3)}" y="${q(top - 4)}" width="${q(w + 6)}" height="7" rx="2"/>` +
        pots.map(k => `<path class="lnf" d="M${q(x + k * t - 8)} ${q(top - 4)}H${q(x + k * t + 8)}L${q(x + k * t + 6)} ${q(top + 9)}H${q(x + k * t - 6)}Z"/>`).join(''));
      return out;
    }

    /* ---------- marks that follow the theme (the same as props) ---------- */
    function arrow(x1, y1, x2, y2, bend = 0) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - bend, a = Math.atan2(y2 - my, x2 - mx), L = 7;
      return `<path class="ill-arrow" d="M${q(x1)} ${q(y1)}Q${q(mx)} ${q(my)} ${q(x2)} ${q(y2)}"/><path class="ill-arrow-head" d="M${q(x2)} ${q(y2)}L${q(x2 - Math.cos(a - 0.45) * L)} ${q(y2 - Math.sin(a - 0.45) * L)}L${q(x2 - Math.cos(a + 0.45) * L)} ${q(y2 - Math.sin(a + 0.45) * L)}Z"/>`;
    }
    const dim = (x1, x2, y, text, under = false) => `<g class="ill-scale"><path d="M${q(x1)} ${q(y - 4)}V${q(y + 4)}M${q(x2)} ${q(y - 4)}V${q(y + 4)}" fill="none" stroke="currentColor"/><line x1="${q(x1)}" x2="${q(x2)}" y1="${q(y)}" y2="${q(y)}"/><text x="${q((x1 + x2) / 2)}" y="${q(under ? y + 15 : y - 6)}" text-anchor="middle">${text}</text></g>`;

    return { paper, floor, step, wide, leaf, sprout, bush, ballBush, cloud, seed, roots, tray, cup, cupSoil, pot, bag, sprayer, lamp, thermo, lid, scissors, cutMark, sun, tree, bed, window: window_, balcony, greenhouse, tank, arrow, dim, g, path };
  })();
