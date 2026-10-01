  /* ---------------- props: things for the step-by-step pictures ----------------
     Trays and cups, a seedling at any age, glass and water, tools, a lamp, a window, a balcony box, a bed,
     a greenhouse, a hydroponic tank, jars, bags and bottles. Each stands on (x, y) — the middle of its
     bottom — unless said otherwise, and returns SVG markup. Colours are the --ill-* tokens; arrows and
     dimension lines follow the theme (.ill-arrow, .ill-scale in 00-ill.css). */
  /* @use ills */
  const props = (() => {
    const { F, q } = ill;
    const P = pts => 'M' + pts.map(p => p.map(q).join(' ')).join('L') + 'Z';
    const shine = (x1, y1, x2, y2, w = 2.4, o = 0.5) => `<path d="M${q(x1)} ${q(y1)}L${q(x2)} ${q(y2)}" stroke="${F('hi')}" stroke-width="${w}" opacity="${o}" stroke-linecap="round"/>`;

    /* ---------- the picture itself ---------- */
    // paper under the picture (follows the theme) and the table or ground things stand on from y down
    const paper = (w, h) => `<rect width="${w}" height="${h}" rx="14" fill="${F('bg')}"/>`;
    const ground = (y, w, h) => `<path d="M0 ${q(y)}H${w}V${h - 14}Q${w} ${h} ${w - 14} ${h}H14Q0 ${h} 0 ${h - 14}Z" fill="${F('bg-2')}"/>`;
    // a picture of one step: 120 × 120, things standing on y
    const step = (body, label, y = 104) => ill.svg(120, 120, paper(120, 120) + ground(y, 120, 120) + body, label);

    /* ---------- growing ---------- */
    // a seedling cassette seen a little from above: { svg, tops } — tops are the middles of the cells
    function tray(x, y, w = 110, o = {}) {
      const n = o.cells || 4, h = o.h || w * 0.24, d = o.depth || h * 0.5, x0 = x - w / 2, x1 = x + w / 2, yt = y - h, cw = w / n;
      let g = `<path d="${P([[x0, yt], [x1, yt], [x1 - 3, y], [x0 + 3, y]])}" fill="${F('plastic')}"/>`;
      for (let i = 1; i < n; i++) g += `<path d="M${q(x0 + i * cw)} ${q(yt + 2)}V${q(y - 2)}" stroke="${F('plastic-hi')}" stroke-width="1.3" opacity=".7"/>`;
      g += `<path d="${P([[x0, yt], [x1, yt], [x1, yt - d], [x0, yt - d]])}" fill="${F('plastic-hi')}"/>`;
      const tops = [];
      const rnd = ill.rng(o.seed || 5);
      for (let i = 0; i < n; i++) {
        const cx0 = x0 + i * cw + 2.4, cx1 = x0 + (i + 1) * cw - 2.4;
        g += `<rect x="${q(cx0)}" y="${q(yt - d + 2)}" width="${q(cx1 - cx0)}" height="${q(d - 3.6)}" rx="2" fill="${F(o.wet ? 'soil-d' : 'soil')}"/>`;
        if (o.perlite) for (let k = 0; k < 4; k++) g += `<circle cx="${q(cx0 + 2.5 + rnd() * (cx1 - cx0 - 5))}" cy="${q(yt - d + 3.5 + rnd() * (d - 6.5))}" r="1.1" fill="${F('perlite')}"/>`;
        tops.push([(cx0 + cx1) / 2, yt - d / 2 + 1]);
      }
      g += `<path d="M${q(x0)} ${q(yt)}H${q(x1)}" stroke="${F('plastic-hi')}" stroke-width="1.6"/>`;
      return { svg: g, tops };
    }
    // a seed; gel: the clear coat it grows in wet soil
    const seed = (x, y, a = 0, gel = false) => `${gel ? `<ellipse cx="${q(x)}" cy="${q(y)}" rx="4" ry="3.3" fill="${F('gel')}" stroke="${F('glass-d')}" stroke-width=".5"/>` : ''}<ellipse cx="${q(x)}" cy="${q(y)}" rx="1.8" ry="1.2" transform="rotate(${q(a)} ${q(x)} ${q(y)})" fill="${F('seed')}"/>`;
    // a young plant: two round seed leaves, then pairs of true leaves. o: pairs, s (leaf scale), lean, pale, tone, cut (index of the pair above which a cut mark goes)
    function sprout(x, y, h = 30, o = {}) {
      const pairs = o.pairs || 0, s = o.s || 1, lean = o.lean || 0;
      const tx = x + lean, ty = y - h;
      let g = `<path d="M${q(x)} ${q(y)}Q${q(x + lean * 0.2)} ${q(y - h * 0.55)} ${q(tx)} ${q(ty)}" stroke="${F(o.pale ? 'lime' : 'stem')}" stroke-width="${q(1.4 + pairs * 0.4)}" fill="none" stroke-linecap="round"/>`;
      const cy = pairs ? y - h * 0.3 : ty, cx = x + lean * (pairs ? 0.1 : 1);
      [-1, 1].forEach(sd => { g += ill.leaf({ x: cx, y: cy, a: sd * 70, s: 0.09 * s, wide: 1.6, seed: 3 + sd, petiole: 2, pale: o.pale }); });
      const at = [];
      for (let i = 0; i < pairs; i++) {
        const t = (i + 1) / (pairs + 0.5), py = y - h * (0.3 + 0.7 * t), px = x + lean * t;
        at.push([px, py]);
        [-1, 1].forEach(sd => { g += ill.leaf({ x: px, y: py, a: sd * (60 - i * 7), s: (0.15 - i * 0.012) * s, seed: 7 + i * 2 + sd, petiole: 3, tone: o.tone, pale: o.pale }); });
      }
      if (pairs) [-1, 1].forEach(sd => { g += ill.leaf({ x: tx, y: ty, a: sd * 22, s: 0.055 * s, seed: 20 + sd, petiole: 1, tone: o.tone }); });
      if (o.cut != null && at[o.cut]) { const [px, py] = at[o.cut]; g += cutMark(px, py - 6 * s, 16); }
      return g;
    }
    // a stem with pairs of leaves from (x, y) up. o: pairs, s (scale of the lowest pair), lean, tone, bare (how many
    // lower nodes have lost their leaves), buds (nodes with buds in the axils), stub (cut just above this node),
    // shoots ({ node: { len, pairs, a } } — new side shoots from both axils), tip (the growing tip; default on).
    // Returns { svg, nodes } — nodes from the bottom
    function shoot(x, y, h = 80, o = {}) {
      const n = o.pairs || 4, s0 = o.s || 0.3, lean = o.lean || 0, nodes = [];
      for (let i = 0; i < n; i++) { const t = (i + 0.55) / (n + 0.35); nodes.push([x + lean * t * t, y - h * t]); }
      const cut = o.stub != null, topX = cut ? nodes[o.stub][0] : x + lean, topY = cut ? nodes[o.stub][1] - 6 : y - h;
      let g = `<path d="M${q(x)} ${q(y)}Q${q(x + lean * 0.25)} ${q((y + topY) / 2)} ${q(topX)} ${q(topY)}" stroke="${F(o.tone === 'purple' ? 'stem-purple' : 'stem')}" stroke-width="${q(Math.min(4.2, 2.2 + n * 0.3))}" fill="none" stroke-linecap="round"/>`;
      if (cut) g += `<path d="M${q(topX - 3)} ${q(topY)}h6" stroke="${F('stem-d')}" stroke-width="2.6" stroke-linecap="round"/>`;
      const lim = cut ? o.stub + 1 : n;
      for (let i = 0; i < lim; i++) {
        const [nx, ny] = nodes[i], sc = s0 * (1 - i * (0.45 / n));
        if (i < (o.bare || 0)) { g += `<path d="M${q(nx - 4)} ${q(ny)}h8" stroke="${F('stem-d')}" stroke-width="1.6" stroke-linecap="round"/>`; continue; }
        [-1, 1].forEach(sd => { g += ill.leaf({ x: nx, y: ny, a: sd * (62 - i * 5), s: sc, seed: 5 + i * 2 + sd, petiole: 5, tone: o.tone }); });
        if (o.buds && o.buds.includes(i)) [-1, 1].forEach(sd => { g += `<ellipse cx="${q(nx + sd * 5)}" cy="${q(ny - 6)}" rx="3.4" ry="5" fill="${F('leaf-hi')}" stroke="${F('stem-d')}" stroke-width=".8" transform="rotate(${sd * 24} ${q(nx + sd * 5)} ${q(ny - 6)})"/>`; });
      }
      Object.keys(o.shoots || {}).forEach(i => {
        const sh = o.shoots[i], [nx, ny] = nodes[i];
        [-1, 1].forEach(sd => { g += `<g transform="rotate(${q(sd * (sh.a || 26))} ${q(nx)} ${q(ny - 3)})">${shoot(nx, ny - 3, sh.len, { pairs: sh.pairs || 1, s: sh.s || s0 * 0.7, tone: o.tone }).svg}</g>`; });
      });
      if (!cut && o.tip !== false) [-1, 1].forEach(sd => { g += ill.leaf({ x: x + lean, y: y - h, a: sd * 22, s: s0 * 0.36, seed: 30 + sd, petiole: 2, tone: o.tone }); });
      return { svg: g, nodes };
    }
    // a plastic cup or a paper one, with soil; plants go in at (x, top of soil) = cupSoil(…)
    const cupSoil = (y, h = 34, o = {}) => y - h * (o.soil == null ? 0.82 : o.soil);
    function cup(x, y, w = 30, h = 34, o = {}) {
      const t = w / 2, b = w * 0.38, sl = o.soil == null ? 0.82 : o.soil, ys = y - h * sl, tw = b + (t - b) * sl;
      let g = `<path d="${P([[x - t, y - h], [x + t, y - h], [x + b, y], [x - b, y]])}" fill="${F(o.paper ? 'paper' : 'glass')}" stroke="${F(o.paper ? 'paper-d' : 'glass-d')}" stroke-width="1"/>`;
      if (!o.paper) g += `<path d="${P([[x - tw, ys], [x + tw, ys], [x + b - 0.8, y - 0.8], [x - b + 0.8, y - 0.8]])}" fill="${F('soil')}" opacity=".85"/>` + (o.roots ? roots(x, ys + 3, h * sl * 0.8, 7, { seed: 4, spread: 1.2 }) : '');
      g += `<ellipse cx="${q(x)}" cy="${q(ys)}" rx="${q(tw)}" ry="${q(Math.max(1.6, w * 0.07))}" fill="${F('soil-d')}"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t)}" ry="${q(Math.max(1.6, w * 0.07))}" fill="none" stroke="${F(o.paper ? 'paper-d' : 'glass-d')}" stroke-width="1.1"/>`;
      if (!o.paper) g += shine(x - t * 0.66, y - h * 0.86, x - b * 0.72, y - 3, 2, 0.45);
      return g;
    }
    // a plastic pot from the shop: thin black wall, sometimes many seedlings in it
    function shopPot(x, y, w = 56, h = 44, o = {}) {
      const t = w / 2, b = w * 0.36;
      let g = `<path d="${P([[x - t, y - h], [x + t, y - h], [x + b, y], [x - b, y]])}" fill="${F('plastic')}"/>`;
      g += `<path d="${P([[x - t - 2, y - h - 3], [x + t + 2, y - h - 3], [x + t + 1, y - h + 3], [x - t - 1, y - h + 3]])}" fill="${F('plastic-hi')}"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(y - h - 2)}" rx="${q(t)}" ry="3" fill="${F('soil-d')}"/>`;
      g += shine(x + t * 0.55, y - h * 0.8, x + b * 0.6, y - 4, 2, 0.18);
      return g;
    }
    // many thin seedlings crowded in one pot (the shop's way: 10–30 in a pot)
    function crowd(x, y, w = 50, n = 14, o = {}) {
      const rnd = ill.rng(o.seed || 9);
      let g = '';
      for (let i = 0; i < n; i++) {
        const bx = x - w / 2 + (i + 0.5) * w / n + (rnd() - 0.5) * 3, hh = (o.h || 50) * (0.75 + rnd() * 0.35), lean = (bx - x) * 0.35 + (rnd() - 0.5) * 6;
        g += sprout(bx, y, hh, { pairs: 2, s: 0.75, lean, pale: o.pale && rnd() < 0.5 });
      }
      return g;
    }
    // white roots from a point downwards; o: seed, spread (how far they fan out), w (thickness)
    function roots(x, y, len = 20, n = 6, o = {}) {
      const rnd = ill.rng(o.seed || 3), sp = o.spread || 1;
      let d = '', hairs = '';
      for (let i = 0; i < n; i++) {
        const a = (i / (n - 1 || 1) - 0.5) * 1.5 * sp + (rnd() - 0.5) * 0.3, l = len * (0.55 + rnd() * 0.45);
        const ex = x + Math.sin(a) * l, ey = y + Math.cos(a) * l;
        d += `M${q(x)} ${q(y)}Q${q(x + Math.sin(a) * l * 0.35 + (rnd() - 0.5) * 5)} ${q(y + l * 0.55)} ${q(ex)} ${q(ey)}`;
        for (let k = 1; k < 4; k++) { const t = k / 4, hx = x + (ex - x) * t, hy = y + (ey - y) * t, sd = k % 2 ? 1 : -1; hairs += `M${q(hx)} ${q(hy)}l${q(sd * 3)} ${q(2)}`; }
      }
      return `<path d="${d}" stroke="${F('root')}" stroke-width="${o.w || 1.4}" fill="none" stroke-linecap="round"/><path d="${hairs}" stroke="${F('root')}" stroke-width=".7" fill="none" opacity=".8"/>`;
    }
    // a lump of soil held together by roots, lifted out of a pot; split: into how many parts it is broken
    function rootball(x, y, w = 60, h = 44, o = {}) {
      const n = o.split || 1, gap = n > 1 ? 9 : 0, pw = (w - gap * (n - 1)) / n, rnd = ill.rng(o.seed || 6);
      let g = '';
      for (let i = 0; i < n; i++) {
        const cx = x - w / 2 + pw / 2 + i * (pw + gap), dy = n > 1 ? (i % 2 ? 3 : -2) : 0;
        g += `<path d="${micro.cell(cx, y - h / 2 + dy, pw / 2, h / 2, rnd, { p: 2.6, j: 0.08, n: 10 })}" fill="${F('soil')}"/>`;
        let d = '';
        for (let k = 0; k < 7; k++) { const sx = cx + (rnd() - 0.5) * pw * 0.8, sy = y - h + dy + 4 + rnd() * h * 0.7; d += `M${q(sx)} ${q(sy)}q${q((rnd() - 0.5) * 10)} ${q(4 + rnd() * 6)} ${q((rnd() - 0.5) * 14)} ${q(8 + rnd() * 8)}`; }
        g += `<path d="${d}" stroke="${F('root')}" stroke-width="1.2" fill="none" opacity=".9" stroke-linecap="round"/>`;
        g += roots(cx, y - 4 + dy, 10, 4, { seed: 11 + i, w: 1.1 });
      }
      return g;
    }
    // a spray bottle; mist: a cloud of droplets towards the left or right (dir)
    function sprayer(x, y, s = 1, o = {}) {
      const dir = o.dir || -1;
      let g = `<g transform="translate(${q(x)} ${q(y)}) scale(${s})">`;
      g += `<path d="M-11 0V-30Q-11 -36 -5 -37H5Q11 -36 11 -30V0Z" fill="${F('glass')}" stroke="${F('glass-d')}" stroke-width="1"/><path d="M-10 -1V-14H10V-1Z" fill="${F('water-c')}" opacity=".9"/>`;
      g += `<path d="M-6 -37V-43H6V-37Z" fill="${F('grip')}"/><path d="M-6 -43H${dir * 16}V-48H-6Z" fill="${F('grip')}"/><path d="M4 -42L10 -32" stroke="${F('grip')}" stroke-width="3" stroke-linecap="round"/>`;
      g += shine(-7, -31, -7, -5, 2, 0.5) + '</g>';
      if (o.mist !== false) { const rnd = ill.rng(3); for (let i = 0; i < 16; i++) { const t = rnd(), a = (rnd() - 0.5) * 0.7; g += `<circle cx="${q(x + dir * (16 * s + t * 26 * s))}" cy="${q(y - 45.5 * s + Math.sin(a) * t * 26 * s)}" r="${q(0.7 + rnd())}" fill="${F('water-c')}" opacity="${q(0.9 - t * 0.5)}"/>`; } }
      return g;
    }
    // a watering can pouring to the left (dir −1) or right; stream: how long the jet is
    function can(x, y, s = 1, o = {}) {
      const dir = o.dir || -1, st = o.stream == null ? 26 : o.stream;
      let g = `<g transform="translate(${q(x)} ${q(y)}) scale(${dir * -s} ${s})">`;
      g += `<path d="M-16 0V-26Q-16 -30 -12 -30H12Q16 -30 16 -26V0Z" fill="${F('box')}"/><path d="M-16 -26H16" stroke="${F('box-d')}" stroke-width="1.4"/>`;
      g += `<path d="M14 -28Q26 -42 10 -42Q-6 -42 -4 -30" fill="none" stroke="${F('box-d')}" stroke-width="3"/>`;
      g += `<path d="M-15 -8L-38 -30L-35 -33L-13 -15Z" fill="${F('box')}"/><path d="M-40 -34L-33 -27L-37 -26L-42 -31Z" fill="${F('box-d')}"/>`;
      g += shine(-10, -26, -10, -5, 2, 0.35) + '</g>';
      if (st) { const sx = x + dir * 39 * s, sy = y - 31 * s; g += `<path d="M${q(sx)} ${q(sy)}q${q(dir * 6)} ${q(st * 0.3)} ${q(dir * 8)} ${q(st)}" stroke="${F('water-c')}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`; }
      return g;
    }
    // a hanging LED lamp and its light; (x, y) — the middle of the lamp
    function lamp(x, y, w = 70, o = {}) {
      const reach = o.reach || 60, x0 = x - w / 2, x1 = x + w / 2, gid = ill.id('lmp');
      let g = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${F('light')}" stop-opacity=".8"/><stop offset="1" stop-color="${F('light')}" stop-opacity="0"/></linearGradient></defs>`;
      g += `<path d="${P([[x0 + 4, y + 6], [x1 - 4, y + 6], [x1 + reach * 0.3, y + reach], [x0 - reach * 0.3, y + reach]])}" fill="url(#${gid})"/>`;
      g += `<path d="M${q(x0 + 8)} ${q(y - 40)}V${q(y)}M${q(x1 - 8)} ${q(y - 40)}V${q(y)}" stroke="${F('metal-d')}" stroke-width="1"/>`;
      g += `<rect x="${q(x0)}" y="${q(y - 1)}" width="${q(w)}" height="8" rx="3" fill="${F('metal-d')}"/><rect x="${q(x0 + 3)}" y="${q(y + 5)}" width="${q(w - 6)}" height="3" rx="1.5" fill="${F('lamp')}"/>`;
      return g;
    }
    // a thermometer, level 0–1
    function thermo(x, y, h = 40, level = 0.6) {
      const top = y - h, ly = y - 8 - (h - 14) * level;
      return `<rect x="${q(x - 4)}" y="${q(top)}" width="8" height="${q(h - 4)}" rx="4" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1"/><path d="M${q(x)} ${q(y - 6)}V${q(ly)}" stroke="${F('cut')}" stroke-width="3" stroke-linecap="round"/><circle cx="${q(x)}" cy="${q(y - 5)}" r="5.5" fill="${F('cut')}"/>` +
        [0.25, 0.5, 0.75].map(t => `<path d="M${q(x + 4)} ${q(y - 8 - (h - 14) * t)}h3" stroke="${F('frame-d')}" stroke-width="1"/>`).join('');
    }
    // a clear dome lid over a tray, misted on the inside
    function lid(x, y, w, h, o = {}) {
      const x0 = x - w / 2, x1 = x + w / 2, r = Math.min(10, h * 0.4);
      const d = `M${q(x0)} ${q(y)}V${q(y - h + r)}Q${q(x0)} ${q(y - h)} ${q(x0 + r)} ${q(y - h)}H${q(x1 - r)}Q${q(x1)} ${q(y - h)} ${q(x1)} ${q(y - h + r)}V${q(y)}Z`;
      let g = `<path d="${d}" fill="${F('glass')}" opacity=".5" stroke="${F('glass-d')}" stroke-width="1.3"/>`;
      g += `<rect x="${q(x - 9)}" y="${q(y - h - 3)}" width="18" height="5" rx="2" fill="${F('glass-d')}" opacity=".85"/>`;
      if (o.drops !== false) { const rnd = ill.rng(o.seed || 4); for (let i = 0; i < 22; i++) g += `<circle cx="${q(x0 + 5 + rnd() * (w - 10))}" cy="${q(y - h + 5 + rnd() * h * 0.5)}" r="${q(0.8 + rnd() * 1.5)}" fill="${F('hi')}" opacity=".8"/>`; }
      g += `<path d="M${q(x0 + 5)} ${q(y - h + 7)}Q${q(x0 + 4)} ${q(y - 8)} ${q(x0 + 7)} ${q(y - 4)}" stroke="${F('hi')}" stroke-width="2.6" opacity=".55" fill="none"/>`;
      return g;
    }

    /* ---------- tools ---------- */
    // garden snips with their pivot at (x, y), blades towards angle a (degrees, 0 — to the right)
    function scissors(x, y, a = 0, s = 1, open = 1) {
      const o = 5 * open;
      let g = `<path d="M-14 -${q(o + 3)}Q-3 -${q(o + 2)} 0 0M-14 ${q(o + 3)}Q-3 ${q(o + 2)} 0 0" stroke="${F('grip')}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
      g += `<ellipse cx="-19" cy="-${q(o + 5)}" rx="7" ry="5" fill="none" stroke="${F('grip')}" stroke-width="3.4"/><ellipse cx="-19" cy="${q(o + 5)}" rx="7" ry="5" fill="none" stroke="${F('grip')}" stroke-width="3.4"/>`;
      g += `<path d="M-1 -1.6L27 -${q(o + 3)}Q30 -${q(o + 2)} 28 -${q(o)}L0 2Z" fill="${F('metal')}" stroke="${F('metal-d')}" stroke-width=".8"/><path d="M-1 1.6L27 ${q(o + 3)}Q30 ${q(o + 2)} 28 ${q(o)}L0 -2Z" fill="${F('metal')}" stroke="${F('metal-d')}" stroke-width=".8"/>`;
      g += `<circle r="2.2" fill="${F('metal-d')}"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    // where to cut: a short dashed red line across a stem
    const cutMark = (x, y, w = 18) => `<path d="M${q(x - w / 2)} ${q(y)}H${q(x + w / 2)}" stroke="${F('cut')}" stroke-width="2.2" stroke-dasharray="3.5 2.5" stroke-linecap="round"/>`;
    // a kitchen knife, edge down, tip towards angle a
    function knife(x, y, a = 0, s = 1) {
      const g = `<path d="M0 -3H30Q40 -2 44 3H0Z" fill="${F('metal')}" stroke="${F('metal-d')}" stroke-width=".8"/><rect x="-24" y="-4" width="25" height="8" rx="3" fill="${F('wood-d')}"/><circle cx="-16" cy="0" r="1.1" fill="${F('metal')}"/><circle cx="-7" cy="0" r="1.1" fill="${F('metal')}"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    // a magnifying glass: what is under it (inner, drawn in a 2r × 2r box centred on 0, 0) is shown bigger
    function lens(x, y, r = 24, inner = '', a = 40) {
      const cid = ill.id('lens');
      return `<defs><clipPath id="${cid}"><circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}"/></clipPath></defs><circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}" fill="${F('bg-2')}"/>` +
        `<g clip-path="url(#${cid})"><g transform="translate(${q(x)} ${q(y)})">${inner}</g></g>` +
        `<path d="M${q(x + Math.cos(a * Math.PI / 180) * r)} ${q(y + Math.sin(a * Math.PI / 180) * r)}l${q(Math.cos(a * Math.PI / 180) * 22)} ${q(Math.sin(a * Math.PI / 180) * 22)}" stroke="${F('wood-d')}" stroke-width="6" stroke-linecap="round"/>` +
        `<circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}" fill="none" stroke="${F('metal-d')}" stroke-width="3.2"/><path d="M${q(x - r * 0.6)} ${q(y - r * 0.35)}A${q(r * 0.7)} ${q(r * 0.7)} 0 0 1 ${q(x - r * 0.2)} ${q(y - r * 0.68)}" stroke="${F('hi')}" stroke-width="2.4" fill="none" opacity=".6" stroke-linecap="round"/>`;
    }
    // a bottle of liquid fertilizer or oil; fill: token of what is inside
    function bottle(x, y, w = 22, h = 50, o = {}) {
      const t = w / 2, nk = w * 0.22, sh = y - h * 0.62;
      let g = `<path d="M${q(x - t)} ${q(y)}V${q(sh + 6)}Q${q(x - t)} ${q(sh - 4)} ${q(x - nk)} ${q(sh - 10)}V${q(y - h + 6)}H${q(x + nk)}V${q(sh - 10)}Q${q(x + t)} ${q(sh - 4)} ${q(x + t)} ${q(sh + 6)}V${q(y)}Z" fill="${F(o.fill || 'glass')}" stroke="${F('glass-d')}" stroke-width="1"/>`;
      g += `<rect x="${q(x - nk - 1.5)}" y="${q(y - h)}" width="${q(nk * 2 + 3)}" height="7" rx="1.5" fill="${F(o.cap || 'grip')}"/>`;
      if (o.label !== false) g += `<rect x="${q(x - t + 2)}" y="${q(y - h * 0.45)}" width="${q(w - 4)}" height="${q(h * 0.28)}" rx="2" fill="${F('label')}"/><path d="M${q(x - t + 5)} ${q(y - h * 0.36)}h${q(w - 10)}M${q(x - t + 5)} ${q(y - h * 0.27)}h${q(w * 0.5)}" stroke="${F('paper-d')}" stroke-width="1.6"/>`;
      g += shine(x - t * 0.55, sh + 4, x - t * 0.55, y - 4, 2, 0.4);
      return g;
    }

    /* ---------- kitchen and storage ---------- */
    // a glass of water; inside: what is under the water (stems, roots), drawn behind the glass wall
    function glass(x, y, w = 40, h = 56, o = {}) {
      const t = w / 2, b = w * 0.42, lv = o.level == null ? 0.7 : o.level, yw = y - h * lv, tw = b + (t - b) * lv;
      let g = `<path d="${P([[x - tw, yw], [x + tw, yw], [x + b, y], [x - b, y]])}" fill="${F('water-c')}" opacity=".75"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(yw)}" rx="${q(tw)}" ry="${q(Math.max(1.5, w * 0.06))}" fill="${F('water-c')}" stroke="${F('glass-d')}" stroke-width=".6"/>`;
      if (o.inside) g += o.inside;
      g += `<path d="${P([[x - t, y - h], [x + t, y - h], [x + b, y], [x - b, y]])}" fill="${F('glass')}" opacity=".3" stroke="${F('glass-d')}" stroke-width="1.2"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t)}" ry="${q(Math.max(1.6, w * 0.07))}" fill="none" stroke="${F('glass-d')}" stroke-width="1.2"/>`;
      g += shine(x - t * 0.62, y - h * 0.88, x - b * 0.7, y - 4, 2.6, 0.55);
      return g;
    }
    // a jar with a lid (open: without); fill: token of the contents, level 0–1; layer: a band of oil on top; bands: salted leaves in layers
    function jar(x, y, w = 40, h = 50, o = {}) {
      const t = w / 2, lv = o.level == null ? 0.8 : o.level, yf = y - (h - 8) * lv;
      let g = `<rect x="${q(x - t)}" y="${q(y - h + 6)}" width="${q(w)}" height="${q(h - 6)}" rx="6" fill="${F('glass')}" opacity=".45" stroke="${F('glass-d')}" stroke-width="1.1"/>`;
      if (o.fill) g += `<path d="M${q(x - t + 2)} ${q(yf)}H${q(x + t - 2)}V${q(y - 6)}Q${q(x + t - 2)} ${q(y - 2)} ${q(x + t - 6)} ${q(y - 2)}H${q(x - t + 6)}Q${q(x - t + 2)} ${q(y - 2)} ${q(x - t + 2)} ${q(y - 6)}Z" fill="${F(o.fill)}"/>`;
      if (o.bands) { const n = o.bands, hh = (y - 3 - yf) / n; for (let i = 0; i < n; i++) g += `<rect x="${q(x - t + 3)}" y="${q(yf + i * hh)}" width="${q(w - 6)}" height="${q(hh * 0.45)}" rx="2" fill="${F('salt')}" opacity=".95"/>`; }
      if (o.layer) g += `<rect x="${q(x - t + 2)}" y="${q(yf - 1)}" width="${q(w - 4)}" height="${q(o.layer)}" fill="${F('oil')}" opacity=".95"/>`;
      if (o.bits) { const rnd = ill.rng(8); for (let i = 0; i < o.bits; i++) g += `<ellipse cx="${q(x - t + 5 + rnd() * (w - 10))}" cy="${q(yf + 4 + rnd() * (y - yf - 9))}" rx="${q(1.6 + rnd() * 1.6)}" ry="1.2" transform="rotate(${q(rnd() * 180)} ${q(x)} ${q(y)})" fill="${F('leaf-deep')}" opacity=".85"/>`; }
      if (!o.open) g += `<rect x="${q(x - t - 1)}" y="${q(y - h)}" width="${q(w + 2)}" height="8" rx="2.5" fill="${F(o.cap || 'metal-d')}"/>`;
      g += shine(x - t + 5, y - h + 12, x - t + 5, y - 8, 2.4, 0.45);
      return g;
    }
    // an ice cube tray seen a little from above; in every cube: chopped basil in oil (or in water: water)
    function iceTray(x, y, w = 100, o = {}) {
      const n = o.cells || 4, h = 12, d = 18, x0 = x - w / 2, cw = w / n, rnd = ill.rng(5);
      let g = `<path d="${P([[x0, y - h], [x0 + w, y - h], [x0 + w - 3, y], [x0 + 3, y]])}" fill="${F('ice')}" stroke="${F('glass-d')}" stroke-width="1"/>`;
      g += `<path d="${P([[x0, y - h], [x0 + w, y - h], [x0 + w, y - h - d], [x0, y - h - d]])}" fill="${F('ice')}" stroke="${F('glass-d')}" stroke-width="1"/>`;
      for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
        const cx0 = x0 + i * cw + 2.5, cy0 = y - h - d + 2 + r * (d / 2 - 1);
        g += `<rect x="${q(cx0)}" y="${q(cy0)}" width="${q(cw - 5)}" height="${q(d / 2 - 3)}" rx="2" fill="${F(o.water ? 'water-c' : 'oil')}" opacity=".9"/>`;
        for (let k = 0; k < 3; k++) g += `<ellipse cx="${q(cx0 + 3 + rnd() * (cw - 11))}" cy="${q(cy0 + 2 + rnd() * (d / 2 - 7))}" rx="2" ry="1.2" fill="${F('leaf-deep')}"/>`;
      }
      return g;
    }
    // a bunch of stems tied with string, hanging upside down from (x, y); dry: leaves gone olive and curled
    function bunch(x, y, s = 1, o = {}) {
      const rnd = ill.rng(o.seed || 7);
      let g = `<path d="M${q(x)} ${q(y - 14 * s)}V${q(y + 4 * s)}" stroke="${F('kraft-d')}" stroke-width="1.4"/>`;
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 9 + (rnd() - 0.5) * 4, r = a * Math.PI / 180, len = (48 + rnd() * 12) * s;
        const ex = x + Math.sin(r) * len, ey = y + Math.cos(r) * len;
        g += `<path d="M${q(x)} ${q(y)}L${q(ex)} ${q(ey)}" stroke="${F(o.dry ? 'stem-d' : 'stem')}" stroke-width="${q(1.8 * s)}" stroke-linecap="round"/>`;
        for (let k = 1; k <= 3; k++) {
          const t = 0.3 + k * 0.22, px = x + (ex - x) * t, py = y + (ey - y) * t;
          [-1, 1].forEach(sd => { g += ill.leaf({ x: px, y: py, a: 180 + a + sd * (60 + rnd() * 20), s: 0.15 * s * (1.1 - k * 0.12), seed: 30 + i * 7 + k * 2 + sd, petiole: 4, color: o.dry ? ill.mix('brown', 'leaf-deep', 0.35) : null, curl: o.dry ? 0.6 : 0, wide: o.dry ? 0.8 : 1 }); });
        }
      }
      g += `<path d="M${q(x - 5 * s)} ${q(y + 3 * s)}H${q(x + 5 * s)}" stroke="${F('kraft-d')}" stroke-width="${q(3 * s)}" stroke-linecap="round"/>`;
      return g;
    }
    // a paper envelope for seeds, with a label
    function envelope(x, y, w = 50, h = 64, o = {}) {
      const x0 = x - w / 2;
      let g = `<rect x="${q(x0)}" y="${q(y - h)}" width="${q(w)}" height="${q(h)}" rx="3" fill="${F('kraft')}"/><path d="M${q(x0)} ${q(y - h)}L${q(x)} ${q(y - h + h * 0.28)}L${q(x0 + w)} ${q(y - h)}" fill="${F('kraft-d')}" opacity=".55"/>`;
      g += `<rect x="${q(x0 + 6)}" y="${q(y - h * 0.55)}" width="${q(w - 12)}" height="${q(h * 0.36)}" rx="2" fill="${F('label')}"/>`;
      g += `<path d="M${q(x0 + 10)} ${q(y - h * 0.44)}h${q(w - 22)}M${q(x0 + 10)} ${q(y - h * 0.34)}h${q(w * 0.42)}M${q(x0 + 10)} ${q(y - h * 0.25)}h${q(w * 0.3)}" stroke="${F('paper-d')}" stroke-width="2" stroke-linecap="round"/>`;
      if (o.seeds) for (let i = 0; i < 5; i++) g += seed(x + (i - 2) * 6, y + 6 + (i % 2) * 3, i * 40);
      return g;
    }
    // a bowl from the side, with what is in it (seeds and chaff)
    function bowl(x, y, w = 70, o = {}) {
      const t = w / 2, h = w * 0.36, rnd = ill.rng(9);
      let g = `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t)}" ry="${q(h * 0.22)}" fill="${F('paper-d')}"/>`;
      if (o.seeds) for (let i = 0; i < 26; i++) g += seed(x + (rnd() - 0.5) * w * 0.8, y - h + (rnd() - 0.5) * h * 0.25, rnd() * 180);
      if (o.chaff) for (let i = 0; i < 9; i++) g += `<path d="M${q(x + (rnd() - 0.5) * w * 0.7)} ${q(y - h + (rnd() - 0.6) * h * 0.3)}l${q(4 + rnd() * 3)} ${q(-1 - rnd() * 2)}" stroke="${F('straw')}" stroke-width="1.6" stroke-linecap="round"/>`;
      g += `<path d="M${q(x - t)} ${q(y - h)}Q${q(x - t)} ${q(y)} ${q(x)} ${q(y)}Q${q(x + t)} ${q(y)} ${q(x + t)} ${q(y - h)}Q${q(x)} ${q(y - h + h * 0.3)} ${q(x - t)} ${q(y - h)}Z" fill="${F('paper')}" stroke="${F('paper-d')}" stroke-width="1"/>`;
      return g;
    }
    // a stone mortar with pesto and the pestle in it
    function mortar(x, y, w = 64) {
      const t = w / 2, h = w * 0.5;
      return `<path d="M${q(x + 4)} ${q(y - h + 2)}L${q(x + t + 8)} ${q(y - h - 26)}" stroke="${F('frame-d')}" stroke-width="9" stroke-linecap="round"/>` +
        `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t - 3)}" ry="${q(h * 0.2)}" fill="${F('pesto')}"/>` +
        `<path d="M${q(x - t)} ${q(y - h)}Q${q(x - t)} ${q(y)} ${q(x)} ${q(y)}Q${q(x + t)} ${q(y)} ${q(x + t)} ${q(y - h)}Q${q(x)} ${q(y - h + h * 0.4)} ${q(x - t)} ${q(y - h)}Z" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1.2"/>`;
    }
    // a saucepan of water; steam: it boils
    function saucepan(x, y, w = 60, o = {}) {
      const t = w / 2, h = w * 0.55;
      let g = `<rect x="${q(x - t)}" y="${q(y - h)}" width="${q(w)}" height="${q(h)}" rx="5" fill="${F('metal')}" stroke="${F('metal-d')}" stroke-width="1"/><rect x="${q(x - t - 12)}" y="${q(y - h + 4)}" width="12" height="5" rx="2" fill="${F('metal-d')}"/><rect x="${q(x + t)}" y="${q(y - h + 4)}" width="12" height="5" rx="2" fill="${F('metal-d')}"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t)}" ry="4" fill="${F('water-c')}"/>`;
      if (o.steam) g += [-1, 0, 1].map(i => `<path d="M${q(x + i * 12)} ${q(y - h - 6)}q-5 -7 0 -14q5 -7 0 -14" stroke="${F('glass-d')}" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>`).join('');
      return g;
    }
    // a clear bag loose over leaves, or a paper bag (kind: 'paper')
    function bag(x, y, w = 50, h = 60, o = {}) {
      const t = w / 2;
      if (o.kind === 'mesh') { let d = ''; for (let i = 1; i < 6; i++) d += `M${q(x - t + i * w / 6)} ${q(y)}V${q(y - h + 6)}`; for (let j = 1; j < 6; j++) d += `M${q(x - t)} ${q(y - j * h / 6)}H${q(x + t)}`; return `<path d="M${q(x - t)} ${q(y)}V${q(y - h + 10)}Q${q(x - t)} ${q(y - h)} ${q(x)} ${q(y - h)}Q${q(x + t)} ${q(y - h)} ${q(x + t)} ${q(y - h + 10)}V${q(y)}Z" fill="${F('film')}" opacity=".5" stroke="${F('frame-d')}" stroke-width="1"/><path d="${d}" stroke="${F('frame-d')}" stroke-width=".5" opacity=".7"/><path d="M${q(x - t)} ${q(y - 3)}H${q(x + t)}" stroke="${F('kraft-d')}" stroke-width="2"/>`; }
      if (o.kind === 'paper') return `<path d="M${q(x - t)} ${q(y)}V${q(y - h + 8)}L${q(x - t + 6)} ${q(y - h)}H${q(x + t - 6)}L${q(x + t)} ${q(y - h + 8)}V${q(y)}Z" fill="${F('kraft')}"/><path d="M${q(x - t + 6)} ${q(y - h)}V${q(y)}M${q(x + t - 6)} ${q(y - h)}V${q(y)}" stroke="${F('kraft-d')}" stroke-width="1" opacity=".6"/><path d="M${q(x - t)} ${q(y - h + 8)}H${q(x + t)}" stroke="${F('kraft-d')}" stroke-width="1.4"/>`;
      return `<path d="M${q(x - t)} ${q(y)}C${q(x - t - 4)} ${q(y - h * 0.6)} ${q(x - t * 0.6)} ${q(y - h)} ${q(x)} ${q(y - h)}C${q(x + t * 0.6)} ${q(y - h)} ${q(x + t + 4)} ${q(y - h * 0.6)} ${q(x + t)} ${q(y)}" fill="${F('film')}" opacity=".55" stroke="${F('glass-d')}" stroke-width="1"/>` + shine(x - t * 0.55, y - h * 0.72, x - t * 0.75, y - h * 0.25, 2.4, 0.6);
    }

    /* ---------- places ---------- */
    // a window seen from the room: (x, y) — the middle of the sill; o: radiator under it, curtain (light tulle), sun
    function window_(x, y, w = 120, h = 100, o = {}) {
      const x0 = x - w / 2, top = y - h, gid = ill.id('sky');
      let g = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${F('sky')}"/><stop offset="1" stop-color="${F('sky-2')}"/></linearGradient></defs>`;
      g += `<rect x="${q(x0)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" fill="url(#${gid})"/>`;
      if (o.sun) g += `<circle cx="${q(x0 + w * 0.76)}" cy="${q(top + h * 0.26)}" r="${q(h * 0.11)}" fill="${F('yellow')}" opacity=".95"/>`;
      if (o.rays) g += [0, 1, 2].map(i => `<path d="M${q(x0 + w * (0.62 + i * 0.1))} ${q(top)}L${q(x0 + w * (0.2 + i * 0.12))} ${q(y)}L${q(x0 + w * (0.3 + i * 0.12))} ${q(y)}L${q(x0 + w * (0.7 + i * 0.1))} ${q(top)}Z" fill="${F('light')}" opacity=".18"/>`).join('');
      g += `<rect x="${q(x0)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" fill="none" stroke="${F('frame')}" stroke-width="7"/><path d="M${q(x)} ${q(top)}V${q(y)}" stroke="${F('frame')}" stroke-width="5"/>`;
      g += `<rect x="${q(x0)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" fill="none" stroke="${F('frame-d')}" stroke-width="1"/>`;
      if (o.curtain) g += `<path d="M${q(x0 + 3)} ${q(top + 3)}H${q(x0 + w * 0.62)}Q${q(x0 + w * 0.56)} ${q(top + h * 0.5)} ${q(x0 + w * 0.64)} ${q(y - 3)}H${q(x0 + 3)}Z" fill="${F('film')}" opacity=".75"/>` + [0.15, 0.3, 0.45].map(t => `<path d="M${q(x0 + w * t)} ${q(top + 4)}V${q(y - 4)}" stroke="${F('frame-d')}" stroke-width=".8" opacity=".5"/>`).join('');
      g += `<rect x="${q(x0 - 10)}" y="${q(y)}" width="${q(w + 20)}" height="7" rx="2" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1"/>`;
      if (o.radiator) { const ry = y + 14; for (let i = 0; i < 8; i++) g += `<rect x="${q(x0 + 6 + i * (w - 12) / 8)}" y="${q(ry)}" width="${q((w - 12) / 8 - 3)}" height="30" rx="3" fill="${F('radiator')}" stroke="${F('frame-d')}" stroke-width=".8"/>`; g += [0, 1, 2].map(i => `<path d="M${q(x - 20 + i * 18)} ${q(ry - 2)}q-4 -5 0 -10" stroke="${F('cut')}" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>`).join(''); }
      return g;
    }
    // a balcony: a railing across the picture and a box of soil hanging on it
    function balcony(x0, x1, y, o = {}) {
      let g = `<path d="M${q(x0)} ${q(y - 46)}H${q(x1)}" stroke="${F('metal-d')}" stroke-width="4" stroke-linecap="round"/><path d="M${q(x0)} ${q(y)}H${q(x1)}" stroke="${F('metal-d')}" stroke-width="3"/>`;
      for (let x = x0 + 8; x < x1; x += 14) g += `<path d="M${q(x)} ${q(y - 46)}V${q(y)}" stroke="${F('metal-d')}" stroke-width="1.6" opacity=".8"/>`;
      if (o.box) { const [bx0, bx1] = o.box; g += `<rect x="${q(bx0)}" y="${q(y - 62)}" width="${q(bx1 - bx0)}" height="22" rx="3" fill="${F('box')}"/><rect x="${q(bx0 - 2)}" y="${q(y - 64)}" width="${q(bx1 - bx0 + 4)}" height="5" rx="2" fill="${F('box-d')}"/><ellipse cx="${q((bx0 + bx1) / 2)}" cy="${q(y - 62)}" rx="${q((bx1 - bx0) / 2 - 2)}" ry="2.5" fill="${F('soil-d')}"/><path d="M${q(bx0 + 8)} ${q(y - 40)}l-4 -8M${q(bx1 - 8)} ${q(y - 40)}l4 -8" stroke="${F('metal-d')}" stroke-width="2"/>`; }
      return g;
    }
    // a bed: a strip of soil from x0 to x1 with its top at y; mulch: straw on it
    function bed(x0, x1, y, o = {}) {
      const rnd = ill.rng(o.seed || 4), dep = o.depth || 18;
      let g = `<path d="M${q(x0)} ${q(y + dep)}V${q(y + 3)}Q${q(x0 + 6)} ${q(y - 2)} ${q(x0 + 14)} ${q(y - 1)}H${q(x1 - 14)}Q${q(x1 - 6)} ${q(y - 2)} ${q(x1)} ${q(y + 3)}V${q(y + dep)}Z" fill="${F('soil')}"/>`;
      g += `<path d="M${q(x0 + 8)} ${q(y + 4)}H${q(x1 - 8)}" stroke="${F('soil-d')}" stroke-width="1.5" stroke-dasharray="6 5" opacity=".7"/>`;
      if (o.mulch) { let d = ''; for (let i = 0; i < (x1 - x0) / 3; i++) { const sx = x0 + 6 + rnd() * (x1 - x0 - 12), sy = y - 1 + rnd() * 4; d += `M${q(sx)} ${q(sy)}l${q(5 + rnd() * 4)} ${q((rnd() - 0.5) * 3)}`; } g += `<path d="${d}" stroke="${F('straw')}" stroke-width="1.6" stroke-linecap="round"/>`; }
      return g;
    }
    // a small greenhouse: arched frame and clear walls, door open for air; (x, y) — the middle of its floor
    function greenhouse(x, y, w = 150, h = 100, o = {}) {
      const t = w / 2;
      const arch = `M${q(x - t)} ${q(y)}V${q(y - h * 0.55)}Q${q(x - t)} ${q(y - h)} ${q(x)} ${q(y - h)}Q${q(x + t)} ${q(y - h)} ${q(x + t)} ${q(y - h * 0.55)}V${q(y)}`;
      let g = `<path d="${arch}Z" fill="${F('film')}" opacity=".45"/>`;
      g += [-0.5, 0, 0.5].map(k => `<path d="M${q(x + k * t)} ${q(y)}V${q(y - h * (k ? 0.9 : 1))}" stroke="${F('frame-d')}" stroke-width="1.4" opacity=".8"/>`).join('');
      g += `<path d="${arch}" fill="none" stroke="${F('frame-d')}" stroke-width="2.6"/>`;
      if (o.vent) g += `<path d="M${q(x + t * 0.2)} ${q(y - h * 0.98)}l${q(t * 0.3)} -10l4 8" fill="${F('film')}" stroke="${F('frame-d')}" stroke-width="1.4"/>`;
      g += shine(x - t * 0.8, y - h * 0.6, x - t * 0.45, y - h * 0.9, 3, 0.45);
      return g;
    }
    // a hydroponic tank, cut open: lid with net pots, roots hanging in the solution, an air stone bubbling
    function tank(x, y, w = 110, h = 52, o = {}) {
      const t = w / 2, top = y - h, rnd = ill.rng(o.seed || 3), pots = o.pots || [-0.5, 0, 0.5];
      let g = `<rect x="${q(x - t)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" rx="4" fill="${F('dark')}"/>`;
      g += `<rect x="${q(x - t + 4)}" y="${q(top + 10)}" width="${q(w - 8)}" height="${q(h - 14)}" rx="2" fill="${F('water-c')}" opacity=".9"/>`;
      pots.forEach((k, i) => { g += roots(x + k * t, top + 6, h - 14, 7, { seed: 20 + i, spread: 0.7, w: 1.3 }); });
      g += `<rect x="${q(x - 8)}" y="${q(y - 8)}" width="16" height="5" rx="2" fill="${F('frame-d')}"/>`;
      for (let i = 0; i < 9; i++) g += `<circle cx="${q(x + (rnd() - 0.5) * 18)}" cy="${q(y - 12 - rnd() * (h - 26))}" r="${q(0.9 + rnd() * 1.4)}" fill="none" stroke="${F('hi')}" stroke-width=".9"/>`;
      g += `<path d="M${q(x + 6)} ${q(y - 6)}Q${q(x + t - 8)} ${q(y - 6)} ${q(x + t - 6)} ${q(top + 4)}" stroke="${F('frame-d')}" stroke-width="1.6" fill="none"/>`;
      g += `<rect x="${q(x - t - 3)}" y="${q(top - 4)}" width="${q(w + 6)}" height="8" rx="2" fill="${F('plastic-hi')}"/>`;
      pots.forEach(k => { g += `<path d="M${q(x + k * t - 8)} ${q(top - 4)}H${q(x + k * t + 8)}L${q(x + k * t + 6)} ${q(top + 8)}H${q(x + k * t - 6)}Z" fill="${F('plastic')}"/>`; });
      return g;
    }
    // a tree crown giving shade (hardening off starts there)
    function tree(x, y, s = 1) {
      return `<path d="M${q(x)} ${q(y)}V${q(y - 50 * s)}" stroke="${F('wood-d')}" stroke-width="${q(7 * s)}" stroke-linecap="round"/>` +
        [[0, -66, 30], [-20, -54, 22], [20, -52, 22], [-8, -84, 20], [12, -78, 18]].map(([dx, dy, r]) => `<circle cx="${q(x + dx * s)}" cy="${q(y + dy * s)}" r="${q(r * s)}" fill="${F('leaf-deep')}" opacity=".92"/>`).join('');
    }
    const sun = (x, y, r = 11) => `<g><circle cx="${q(x)}" cy="${q(y)}" r="${r}" fill="${F('yellow')}"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${q(x + Math.cos(a) * (r + 3))} ${q(y + Math.sin(a) * (r + 3))}L${q(x + Math.cos(a) * (r + 8))} ${q(y + Math.sin(a) * (r + 8))}" stroke="${F('yellow')}" stroke-width="2.2" stroke-linecap="round"/>`; }).join('')}</g>`;
    const moon = (x, y, r = 9) => `<path d="M${q(x + r * 0.3)} ${q(y - r)}A${r} ${r} 0 1 0 ${q(x + r * 0.3)} ${q(y + r)}A${q(r * 0.75)} ${q(r * 0.75)} 0 1 1 ${q(x + r * 0.3)} ${q(y - r)}Z" fill="${F('yellow-pale')}"/>`;
    // drops of water falling or standing
    const drop = (x, y, s = 1) => `<path d="M${q(x)} ${q(y - 5 * s)}c${q(2.5 * s)} ${q(3 * s)} ${q(4 * s)} ${q(5 * s)} ${q(4 * s)} ${q(7 * s)}a${q(4 * s)} ${q(4 * s)} 0 0 1 ${q(-8 * s)} 0c0 ${q(-2 * s)} ${q(1.5 * s)} ${q(-4 * s)} ${q(4 * s)} ${q(-7 * s)}Z" fill="${F('water-c')}" stroke="${F('glass-d')}" stroke-width=".6"/>`;

    /* ---------- seeds and flowers ---------- */
    // a flower spike going to seed from (x, y) upwards; ripe: the share of whorls from the bottom that are
    // brown and dry, flowers: the top still blooms (colour), dry: all brown, cut off
    function seedSpike(x, y, len = 60, o = {}) {
      const n = Math.max(3, Math.round(len / 9)), [fc, fd] = o.flowers === 'purple' ? ['flower-purple', 'flower-purple-d'] : ['flower', 'flower-d'];
      let g = `<path d="M${q(x)} ${q(y)}q2 ${q(-len / 2)} 1 ${q(-len)}" stroke="${F(o.dry ? 'stem-d' : 'stem')}" stroke-width="2" fill="none"/>`;
      for (let i = 0; i < n; i++) {
        const t = i / n, fy = y - 6 - t * (len - 8), fx = x + 1 + t * 0.6, r = 1 - t * 0.45;
        const brown = o.dry || t < (o.ripe || 0);
        [-1, 1].forEach(sd => { g += `<path d="M${q(fx)} ${q(fy)}q${q(sd * 5 * r)} 1 ${q(sd * 6.5 * r)} -4.5q${q(-sd * 2.5)} -2 ${q(-sd * 6.5 * r)} -0.5Z" fill="${F(brown ? 'brown' : 'stem')}" stroke="${F(brown ? 'brown-d' : 'stem-d')}" stroke-width=".5"/>`; });
        if (!brown && o.flowers && t > 0.55) [-1, 1].forEach(sd => { g += `<path d="M${q(fx)} ${q(fy - 2)}q${q(sd * 6 * r)} -1 ${q(sd * 8 * r)} -6q${q(-sd * 3)} 4 ${q(-sd * 8 * r)} 6Z" fill="${F(fc)}" stroke="${F(fd)}" stroke-width=".6"/>`; });
      }
      return g;
    }
    // a dry calyx torn open: four black seeds inside; (x, y) — its base
    function calyx(x, y, s = 1) {
      return `<g transform="translate(${q(x)} ${q(y)}) scale(${s})"><path d="M0 0C-14 -4 -20 -22 -16 -34L-6 -30L0 -38L6 -30L16 -34C20 -22 14 -4 0 0Z" fill="${F('brown')}" stroke="${F('brown-d')}" stroke-width="1"/>` +
        [[-6, -20], [5, -21], [-2, -12], [7, -11]].map(([sx, sy], i) => `<ellipse cx="${sx}" cy="${sy}" rx="3.6" ry="2.6" transform="rotate(${i * 40} ${sx} ${sy})" fill="${F('seed')}"/><ellipse cx="${sx - 1}" cy="${sy - 1}" rx="1.2" ry=".7" fill="${F('hi')}" opacity=".3"/>`).join('') + '</g>';
    }
    // a honey bee, facing right
    const bee = (x, y, s = 1) => `<g transform="translate(${q(x)} ${q(y)}) scale(${s})"><ellipse cx="-2" cy="-5" rx="5" ry="3.2" fill="${F('wing')}" stroke="${F('gnat')}" stroke-width=".4" transform="rotate(-25 -2 -5)"/><ellipse cx="3" cy="-5.5" rx="5" ry="3.2" fill="${F('wing')}" stroke="${F('gnat')}" stroke-width=".4" transform="rotate(25 3 -5.5)"/><ellipse cx="0" cy="0" rx="7" ry="4.6" fill="${F('oil')}"/><path d="M-2.6 -4.2V4.2M1.6 -4.4V4.4" stroke="${F('gnat')}" stroke-width="1.8"/><circle cx="7" cy="-.5" r="2.6" fill="${F('gnat')}"/><path d="M-7 0l-3 .6" stroke="${F('gnat')}" stroke-width="1.2"/></g>`;

    /* ---------- the kitchen, more ---------- */
    // a snowflake: kept frozen
    function snow(x, y, r = 8) {
      let d = '';
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, ux = Math.cos(a), uy = Math.sin(a), bx = x + ux * r * 0.58, by = y + uy * r * 0.58;
        d += `M${q(x)} ${q(y)}l${q(ux * r)} ${q(uy * r)}`;
        [-0.75, 0.75].forEach(t => { d += `M${q(bx)} ${q(by)}l${q(Math.cos(a + t) * r * 0.36)} ${q(Math.sin(a + t) * r * 0.36)}`; });
      }
      return `<path d="${d}" stroke="${F('glass-d')}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
    }
    // the inside of a fridge: two shelves and the door with its shelves on the right; { svg, shelves, door }
    function fridge(x, y, w = 100, h = 96) {
      const x0 = x - w / 2, top = y - h, dw = w * 0.24;
      let g = `<rect x="${q(x0)}" y="${q(top)}" width="${q(w - dw)}" height="${q(h)}" rx="5" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1.2"/>`;
      const shelves = [top + h * 0.38, top + h * 0.7];
      shelves.forEach(sy => { g += `<path d="M${q(x0 + 3)} ${q(sy)}H${q(x0 + w - dw - 3)}" stroke="${F('glass-d')}" stroke-width="2.2"/>`; });
      g += `<rect x="${q(x0 + w - dw + 2)}" y="${q(top - 4)}" width="${q(dw)}" height="${q(h + 8)}" rx="5" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1.2"/>`;
      const door = [top + h * 0.3, top + h * 0.62, top + h * 0.92];
      door.forEach(sy => { g += `<rect x="${q(x0 + w - dw + 4)}" y="${q(sy - 8)}" width="${q(dw - 4)}" height="9" rx="2" fill="${F('glass')}" stroke="${F('glass-d')}" stroke-width=".8"/>`; });
      g += `<rect x="${q(x0 + 6)}" y="${q(top + 5)}" width="${q(w - dw - 12)}" height="5" rx="2" fill="${F('lamp')}" opacity=".8"/>`;
      return { svg: g, shelves, door, inner: [x0 + 4, x0 + w - dw - 4] };
    }
    // a finger pushed into the soil up to (x, y), seen from the side
    const finger = (x, y, a = 0, s = 1) => `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})"><path d="M-7.5 -64V-7Q-7.5 0 0 0Q7.5 0 7.5 -7V-64Z" fill="${F('skin')}" stroke="${F('skin-d')}" stroke-width="1"/><path d="M-6 -24q6 2.5 12 0M-6 -42q6 2.5 12 0" stroke="${F('skin-d')}" stroke-width="1" fill="none" opacity=".8"/><path d="M3.2 -3Q6.2 -6 6.2 -13" stroke="${F('nail')}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;

    /* ---------- marks that follow the theme ---------- */
    // a curved arrow from (x1, y1) to (x2, y2); bend: how far the curve bows (+ up, − down)
    function arrow(x1, y1, x2, y2, bend = 0) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - bend, a = Math.atan2(y2 - my, x2 - mx), L = 7;
      return `<path class="ill-arrow" d="M${q(x1)} ${q(y1)}Q${q(mx)} ${q(my)} ${q(x2)} ${q(y2)}"/><path class="ill-arrow-head" d="M${q(x2)} ${q(y2)}L${q(x2 - Math.cos(a - 0.45) * L)} ${q(y2 - Math.sin(a - 0.45) * L)}L${q(x2 - Math.cos(a + 0.45) * L)} ${q(y2 - Math.sin(a + 0.45) * L)}Z"/>`;
    }
    // a dimension: a line with end ticks between x1 and x2 at y and its text above (or below: under)
    const dim = (x1, x2, y, text, under = false) => `<g class="ill-scale"><path d="M${q(x1)} ${q(y - 4)}V${q(y + 4)}M${q(x2)} ${q(y - 4)}V${q(y + 4)}" fill="none" stroke="currentColor"/><line x1="${q(x1)}" x2="${q(x2)}" y1="${q(y)}" y2="${q(y)}"/><text x="${q((x1 + x2) / 2)}" y="${q(under ? y + 15 : y - 6)}" text-anchor="middle">${text}</text></g>`;

    return { paper, ground, step, shoot, tray, seed, sprout, cup, cupSoil, shopPot, crowd, roots, rootball, sprayer, can, lamp, thermo, lid, scissors, cutMark, knife, lens, bottle, glass, jar, iceTray, bunch, envelope, bowl, mortar, saucepan, bag, window: window_, balcony, bed, greenhouse, tank, tree, sun, moon, drop, seedSpike, calyx, bee, snow, fridge, finger, arrow, dim };
  })();
