  /* ---------------- ills: plants, symptoms and pests for the illustrated guides ----------------
     A leaf is drawn in its own box: base at (0, 0), tip at (0, −104), about 64 wide; symptoms are
     layers clipped to its outline. Everything returns SVG markup; colours are the --ill-* tokens. */
  const ill = (() => {
    const q = v => Math.round(v * 10) / 10;
    const F = n => `var(--ill-${n})`;
    let uid = 0;
    const id = p => `ill-${p}${++uid}`;
    const HW = s => (s <= 0 || s >= 1 ? 0 : 78.7 * Math.pow(s, 0.55) * Math.pow(1 - s, 0.9));
    const Ys = s => -4 - s * 100;
    const inside = (rnd, a = 0.12, b = 0.9, k = 0.78) => { const s = a + rnd() * (b - a); return [(rnd() * 2 - 1) * HW(s) * k, Ys(s), s]; };
    const mix = (a, b, t) => `color-mix(in srgb, ${F(a)} ${Math.round(t * 100)}%, ${F(b)})`;

    function outline(o) {
      const n = 30, R = [], L = [], w = o.wide || 1, curl = o.curl || 0;
      for (let i = 0; i <= n; i++) {
        const s = 0.015 + 0.985 * i / n, hw = HW(s) * w;
        R.push([hw * (1 - curl * 0.55), Ys(s)]);
        L.push([-hw, Ys(s)]);
      }
      return micro.smooth(R.concat(L.reverse()));
    }
    // secondary veins: [s, side] → path; ends are where the vein meets the margin
    const SEC = [0.13, 0.26, 0.39, 0.52, 0.65, 0.78];
    const veinEnd = (s, side, w = 1) => [side * HW(Math.min(0.97, s + 0.13)) * 0.86 * w, Ys(s + 0.13)];
    function veins(o) {
      const w = o.wide || 1;
      let d = 'M0 -3Q1.6 -52 0 -101';
      SEC.forEach(s => [-1, 1].forEach(side => {
        const [ex, ey] = veinEnd(s, side, side > 0 ? w * (1 - (o.curl || 0) * 0.55) : w);
        d += `M0 ${q(Ys(s))}Q${q(side * HW(s) * 0.5 * w)} ${q(Ys(s + 0.035))} ${q(ex)} ${q(ey)}`;
      }));
      return d;
    }
    // region between two secondary veins on one side (downy mildew patches keep to them)
    function bay(k, side, o) {
      const s0 = SEC[k], s1 = SEC[k + 1] || 0.92, w = o.wide || 1;
      const [ax, ay] = veinEnd(s0, side, w), [bx, by] = veinEnd(s1, side, w);
      return `M${side * 2} ${q(Ys(s0) - 2)}Q${q(side * HW(s0) * 0.5 * w)} ${q(Ys(s0 + 0.035) - 2)} ${q(ax)} ${q(ay - 1)}L${q(bx)} ${q(by + 2)}Q${q(side * HW(s1) * 0.5 * w)} ${q(Ys(s1 + 0.035) + 2)} ${side * 2} ${q(Ys(s1) + 2)}Z`;
    }

    /* one leaf. o: x, y, a (degrees), s (scale), seed, under (lower side), chl: uniform | interveinal | mottle,
       k (how far it went, 0–1), necro: edge | spots | bact | angular, fuzz, holes, stipple, silver, purple,
       mold, curl, wide, aphids, mites, web, whitefly, thrips, pale */
    function leaf(o = {}) {
      const rnd = micro.rng(o.seed || 3), k = o.k == null ? 1 : o.k;
      const out = outline(o), cid = id('c'), gid = id('g');
      const green = o.under ? 'under' : 'leaf';
      let fill = F(green);
      if (o.chl === 'uniform') fill = mix('yellow', green, 0.25 + 0.7 * k);
      if (o.chl === 'interveinal') fill = mix('yellow-pale', green, 0.55 + 0.4 * k);
      if (o.pale) fill = mix('lime', green, 0.6);
      if (o.color) fill = o.color;
      let defs = `<clipPath id="${cid}"><path d="${out}"/></clipPath><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="-34" y1="0" x2="34" y2="0"><stop offset="0" stop-color="${F('spot')}" stop-opacity=".2"/><stop offset=".46" stop-color="${F('hi')}" stop-opacity=".14"/><stop offset=".54" stop-color="${F('hi')}" stop-opacity=".1"/><stop offset="1" stop-color="${F('spot')}" stop-opacity=".22"/></linearGradient>`;
      let body = `<path d="${out}" style="fill:${fill}"/>`;
      let top = '';
      if (o.chl === 'mottle') for (let i = 0; i < 9; i++) { const [x, y] = inside(rnd); body += `<path d="${micro.cell(x, y, 5 + rnd() * 6, 4 + rnd() * 5, rnd, { p: 2.2, j: 0.25, n: 8 })}" fill="${F('yellow-pale')}" opacity=".7"/>`; }
      if (o.purple) body += `<path d="${out}" fill="${F('purple')}" opacity="${q(0.3 + 0.4 * o.purple)}"/><path d="M-40 0H40V-40H-40Z" fill="${F('purple')}" opacity="${q(0.2 * o.purple)}"/>`;
      if (o.necro === 'angular' || o.fuzz) {
        // patches bounded by veins: yellow on top, grey-violet down underneath
        const bays = o.bays || [[1, 1], [2, -1], [3, 1], [2, 1], [4, -1]];
        bays.slice(0, Math.max(1, Math.round(bays.length * k))).forEach(([b, side], i) => {
          body += `<path d="${bay(b, side, o)}" fill="${F(o.under ? 'fuzz' : 'yellow')}" opacity="${o.under ? 0.55 : 0.9}"/>`;
          if (!o.under && k > 0.6 && i % 2) body += `<path d="${bay(b, side, o)}" fill="${F('brown')}" opacity=".45" transform="translate(${side * 3} 1) scale(.82)"/>`;
          if (o.fuzz) {
            let fz = '';
            for (let t = 0; t < 70; t++) {
              const s = SEC[b] + rnd() * ((SEC[b + 1] || 0.92) - SEC[b]), x = side * (3 + rnd() * HW(s) * 0.8), y = Ys(s) - rnd() * 8;
              const a2 = rnd() * Math.PI * 2;
              fz += `M${q(x)} ${q(y)}l${q(Math.cos(a2) * 2.4)} ${q(Math.sin(a2) * 2.4)}`;
            }
            top += `<path d="${fz}" stroke="${F('fuzz')}" stroke-width=".9" stroke-linecap="round" opacity=".9" clip-path="url(#${cid})"/>`;
          }
        });
      }
      if (o.necro === 'edge') {
        body += `<path d="${out}" fill="none" stroke="${F('yellow')}" stroke-width="${q(14 + 8 * k)}" opacity=".85"/><path d="${out}" fill="none" stroke="${F('brown')}" stroke-width="${q(6 + 8 * k)}" stroke-dasharray="7 2 4 3" /><path d="${out}" fill="none" stroke="${F('brown-d')}" stroke-width="3"/>`;
      }
      if (o.necro === 'spots' || o.necro === 'bact') {
        const n = Math.round((o.necro === 'bact' ? 10 : 6) * (0.5 + k));
        for (let i = 0; i < n; i++) {
          const [x, y] = inside(rnd, 0.15, 0.85, 0.72), r = (o.necro === 'bact' ? 3 : 4.5) + rnd() * 4.5;
          if (o.necro === 'bact') {
            body += `<path d="${micro.cell(x, y, r + 3, r + 2.5, rnd, { p: 4.5, j: 0.18, n: 7 })}" fill="${F('yellow')}" opacity=".7"/><path d="${micro.cell(x, y, r, r * 0.85, rnd, { p: 4.5, j: 0.22, n: 7 })}" fill="${F('water')}" opacity=".9"/>`;
          } else {
            body += `<path d="${micro.cell(x, y, r * 1.35, r * 1.2, rnd, { p: 2.2, j: 0.3, n: 9 })}" fill="${F('brown')}" opacity=".55"/><path d="${micro.cell(x, y, r, r * 0.9, rnd, { p: 2.2, j: 0.3, n: 9 })}" fill="${F('spot')}"/>`;
          }
        }
      }
      if (o.mold) {
        const [mx, my] = o.moldAt || [8, -30];
        body += `<path d="${micro.cell(mx, my, 22, 16, rnd, { p: 2.2, j: 0.25, n: 10 })}" fill="${F('brown')}" opacity=".7"/>`;
        let fz = '';
        for (let t = 0; t < 140; t++) { const a2 = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 18; const x = mx + Math.cos(a2) * r, y = my + Math.sin(a2) * r * 0.75; fz += `M${q(x)} ${q(y)}l${q((rnd() - 0.5) * 5)} ${q(-2 - rnd() * 4)}`; }
        top += `<path d="${fz}" stroke="${F('mold')}" stroke-width="1" stroke-linecap="round"/>`;
        for (let t = 0; t < 26; t++) { const a2 = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 17; top += `<circle cx="${q(mx + Math.cos(a2) * r)}" cy="${q(my + Math.sin(a2) * r * 0.75 - 4)}" r="${q(1 + rnd() * 1.3)}" fill="${F('mold-d')}" opacity=".8"/>`; }
      }
      if (o.stipple) {
        let d = '';
        for (let i = 0; i < o.stipple; i++) { const [x, y] = inside(rnd, 0.1, 0.92, 0.85); d += `M${q(x)} ${q(y)}h.01`; }
        body += `<path d="${d}" stroke="${F('yellow-pale')}" stroke-width="1.9" stroke-linecap="round" opacity=".95"/>`;
      }
      if (o.silver) {
        let d = '', dots = '';
        for (let i = 0; i < o.silver; i++) { const [x, y] = inside(rnd, 0.15, 0.85, 0.7); const a2 = (rnd() - 0.5) * 1.2; d += `M${q(x)} ${q(y)}l${q(Math.sin(a2) * 7)} ${q(-Math.cos(a2) * 9)}`; }
        for (let i = 0; i < o.silver * 3; i++) { const [x, y] = inside(rnd, 0.15, 0.85, 0.7); dots += `M${q(x)} ${q(y)}h.01`; }
        body += `<path d="${d}" stroke="${F('silver')}" stroke-width="4.2" stroke-linecap="round" opacity=".85"/><path d="${dots}" stroke="${F('spot')}" stroke-width="1.5" stroke-linecap="round"/>`;
      }
      // veins: green bands keep their colour in interveinal chlorosis
      const vd = veins(o);
      if (o.chl === 'interveinal') body += `<path d="${vd}" fill="none" stroke="${F(green)}" stroke-width="${q(7 - 3 * k)}" stroke-linecap="round" opacity=".95"/>`;
      body += `<path d="${out}" fill="url(#${gid})"/>`;
      const vc = o.under ? 'under-vein' : o.purple ? 'purple' : 'vein';
      body += `<path d="${vd}" fill="none" stroke="${F(vc)}" stroke-width="${o.under ? 1.8 : 1.3}" stroke-linecap="round" opacity="${o.under ? 0.95 : 0.7}"/>`;
      // holes are cut out; their rims turn brown
      let mask = '', rims = '';
      if (o.holes) {
        const mid = id('m');
        let hs = '';
        for (let i = 0; i < o.holes; i++) {
          const [x, y] = inside(rnd, 0.2, 0.85, 0.75), r = 4 + rnd() * 7;
          const d = micro.cell(x, y, r, r * (0.7 + rnd() * 0.4), rnd, { p: 2.1, j: 0.35, n: 9, phase: rnd() * 3 });
          hs += `<path d="${d}" fill="#000"/>`;
          rims += `<path d="${d}" fill="none" stroke="${F('brown')}" stroke-width="1.6" opacity=".8"/>`;
        }
        // a bite out of the margin
        hs += `<circle cx="${q(HW(0.55) * 1.02)}" cy="${q(Ys(0.55))}" r="9" fill="#000"/>`;
        rims += `<path d="M${q(HW(0.55) * 1.02 - 8)} ${q(Ys(0.55) - 4)}A9 9 0 0 0 ${q(HW(0.55) * 1.02 - 4)} ${q(Ys(0.55) + 8)}" fill="none" stroke="${F('brown')}" stroke-width="1.6" opacity=".8"/>`;
        defs += `<mask id="${mid}" maskUnits="userSpaceOnUse" x="-60" y="-120" width="120" height="140"><rect x="-60" y="-120" width="120" height="140" fill="#fff"/>${hs}</mask>`;
        mask = ` mask="url(#${mid})"`;
      }
      let edge = `<path d="${out}" fill="none" stroke="${F(o.under ? 'leaf' : 'leaf-d')}" stroke-width="1.1" opacity=".8"/>`;
      if (o.curl) {
        // the rolled edge: a band of the paler underside with a fold line inside it
        const Rp = [], In = [];
        for (let i = 0; i <= 20; i++) {
          const s2 = 0.06 + 0.9 * i / 20, x = HW(s2) * (o.wide || 1) * (1 - o.curl * 0.55), y = Ys(s2);
          Rp.push([x, y]); In.push([x - o.curl * 9 * Math.sin(Math.PI * s2), y]);
        }
        const band = `M${Rp.map(p => p.map(q).join(' ')).join('L')}L${In.reverse().map(p => p.map(q).join(' ')).join('L')}Z`;
        edge += `<path d="${band}" fill="${F('under')}"/><path d="M${In.map(p => p.map(q).join(' ')).join('L')}" fill="none" stroke="${F('leaf-d')}" stroke-width="1.2" opacity=".7"/>`;
      }
      let bugs = '';
      if (o.aphids) for (let i = 0; i < o.aphids; i++) { const s = 0.08 + rnd() * 0.5, x = (rnd() - 0.5) * HW(s) * 0.5; bugs += aphid(x, Ys(s), rnd() * 360, 0.9 + rnd() * 0.5, rnd() < 0.15); }
      if (o.web) bugs += web(rnd);
      if (o.mites) for (let i = 0; i < o.mites; i++) { const [x, y] = inside(rnd, 0.2, 0.8, 0.7); bugs += mite(x, y, rnd() * 360, 0.35); }
      if (o.whitefly) for (let i = 0; i < o.whitefly; i++) { const [x, y] = inside(rnd, 0.15, 0.8, 0.7); bugs += whitefly(x, y, rnd() * 60 - 30, 0.45); }
      if (o.thrips) for (let i = 0; i < o.thrips; i++) { const [x, y] = inside(rnd, 0.2, 0.8, 0.6); bugs += thrips(x, y, rnd() * 360, 0.5); }
      const pet = `<path d="M0 -3V${o.petiole == null ? 16 : o.petiole}" stroke="${F(o.purple ? 'purple' : 'stem')}" stroke-width="2.6" stroke-linecap="round"/>`;
      return `<g transform="translate(${q(o.x || 0)} ${q(o.y || 0)}) rotate(${q(o.a || 0)}) scale(${o.s || 1})">${defs}${pet}<g${mask}><g clip-path="url(#${cid})">${body}</g>${top}${edge}${rims}</g>${bugs}</g>`;
    }

    /* insects, in their own box: 1 unit ≈ 0.05 mm at s = 1 */
    function aphid(x, y, a, s = 1, winged = false) {
      const c = F('aphid'), d = F('aphid-d');
      let g = `<path d="M-2.2 3L-5 7M2.2 3L5 7M-2.6 0.5L-6 1.5M2.6 0.5L6 1.5M-2 -2L-5 -4.5M2 -2L5 -4.5" stroke="${d}" stroke-width=".7" stroke-linecap="round"/>`;
      g += `<path d="M0 -5.5C3.4 -5.5 4.2 -1 3.8 2.5C3.4 6 1.8 8 0 8C-1.8 8 -3.4 6 -3.8 2.5C-4.2 -1 -3.4 -5.5 0 -5.5Z" fill="${c}"/>`;
      g += `<path d="M-1.6 6L-2.6 9.2M1.6 6L2.6 9.2" stroke="${d}" stroke-width="1" stroke-linecap="round"/>`;
      g += `<ellipse cx="0" cy="-6" rx="2" ry="1.6" fill="${d}"/><path d="M-1 -7Q-4 -11 -6 -13M1 -7Q4 -11 6 -13" stroke="${d}" stroke-width=".55" fill="none"/>`;
      g += `<ellipse cx="-1.2" cy="-1" rx="1" ry="2.2" fill="${F('hi')}" opacity=".3"/>`;
      if (winged) g += `<path d="M1 -3C6 -8 11 -6 12 -2C9 0 5 0 1 -1ZM-1 -3C-6 -8 -11 -6 -12 -2C-9 0 -5 0 -1 -1Z" fill="${F('wing')}" stroke="${d}" stroke-width=".3"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    function mite(x, y, a, s = 1) {
      const d = F('mite-d');
      let g = '';
      [-1, 1].forEach(side => [[-2.6, -1.4], [-1, 0], [0.8, 0.8], [2.4, 1.8]].forEach(([oy, k], i) => { g += `<path d="M${side * 2} ${oy}Q${side * (5 + i)} ${oy - 1.5 + k} ${side * (6.5 + i * 0.4)} ${oy + 2.5 + k * 0.6}" stroke="${d}" stroke-width=".55" fill="none"/>`; }));
      g += `<ellipse cx="0" cy="0" rx="3.2" ry="4.2" fill="${F('mite')}"/><ellipse cx="-1.6" cy="0.4" rx="1" ry="1.5" fill="${d}" opacity=".8"/><ellipse cx="1.6" cy="0.4" rx="1" ry="1.5" fill="${d}" opacity=".8"/>`;
      g += `<circle cx="-1" cy="-3.1" r=".45" fill="${F('eye')}"/><circle cx="1" cy="-3.1" r=".45" fill="${F('eye')}"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    function whitefly(x, y, a, s = 1) {
      // at rest the powdery wings lie like a roof over the body, slightly apart at the back
      let g = `<path d="M0 -3.4C3.4 -3.6 6 0 5.6 6.4C5.2 9.4 2.4 9.6 0.3 8.2ZM0 -3.4C-3.4 -3.6 -6 0 -5.6 6.4C-5.2 9.4 -2.4 9.6 -0.3 8.2Z" fill="${F('white')}" stroke="${F('mold')}" stroke-width=".35"/>`;
      g += `<path d="M0 -3V7" stroke="${F('mold')}" stroke-width=".35"/><ellipse cx="0" cy="-4.2" rx="1.9" ry="1.5" fill="${F('yellow-pale')}"/><circle cx="-1.1" cy="-4.6" r=".75" fill="${F('eye')}"/><circle cx="1.1" cy="-4.6" r=".75" fill="${F('eye')}"/><path d="M-.8 -5.4l-1.6 -2.4M.8 -5.4l1.6 -2.4" stroke="${F('mold')}" stroke-width=".35"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    function thrips(x, y, a, s = 1) {
      const c = F('thrips');
      let g = `<path d="M0 -7C1.4 -7 1.6 -4 1.4 0C1.3 4 1 8 0 10C-1 8 -1.3 4 -1.4 0C-1.6 -4 -1.4 -7 0 -7Z" fill="${c}"/>`;
      g += `<path d="M0.6 -2L4 7M-0.6 -2L-4 7" stroke="${F('mold')}" stroke-width="1.3" opacity=".6"/><path d="M-.6 -7L-2 -10M.6 -7L2 -10" stroke="${c}" stroke-width=".5"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    function web(rnd) {
      let d = '';
      const anchors = Array.from({ length: 7 }, () => inside(rnd, 0.3, 0.95, 0.95));
      anchors.forEach(([x, y], i) => { const [x2, y2] = anchors[(i + 2) % anchors.length]; d += `M${q(x)} ${q(y)}Q${q((x + x2) / 2 + (rnd() - 0.5) * 10)} ${q((y + y2) / 2 + 6)} ${q(x2)} ${q(y2)}`; });
      return `<path d="${d}" fill="none" stroke="${F('white')}" stroke-width=".55" opacity=".9"/>`;
    }

    /* a basil plant standing on (x, y). o: h, nodes, droop, lean, leggy, bolt, leaf(i, n, side) → leaf options */
    function plant(o = {}) {
      const H = o.h || 150, n = o.nodes || 4, rnd = micro.rng(o.seed || 5);
      const lean = o.lean || 0;
      const w = [];
      for (let i = 0; i < n; i++) w.push(o.leggy ? 1 : 1.25 - i * 0.12);
      const tot = w.reduce((a, b) => a + b, 0);
      let yy = 0;
      const pts = [];
      const dr = o.droop || 0;
      for (let i = 0; i < n; i++) { yy += H * w[i] / tot; const t = yy / H; pts.push([lean * t * t * 30 + dr * t * t * t * 22, -yy + dr * t * t * t * 16]); }
      const stem = `M0 0Q${q(lean * 6 + dr * 4)} ${q(-H * 0.5)} ${q(pts[n - 1][0])} ${q(pts[n - 1][1])}`;
      let g = '';
      if (o.bolt) {
        // flower spike: whorls of small two-lipped flowers
        const top = [pts[n - 1][0], -H];
        g += `<path d="M${q(top[0])} ${q(top[1])}q2 -30 1 -62" stroke="${F('stem')}" stroke-width="2.6" fill="none"/>`;
        for (let i = 0; i < 6; i++) {
          const fy = top[1] - 10 - i * 10, fx = top[0] + 1 + i * 0.2, r = 1 - i * 0.1;
          [-1, 1].forEach(sd => { g += `<path d="M${q(fx)} ${q(fy)}q${q(sd * 6 * r)} -1 ${q(sd * 8 * r)} -6q${q(-sd * 3)} 4 ${q(-sd * 8 * r)} 6Z" fill="${F('flower')}" stroke="${F('flower-d')}" stroke-width=".6"/>`; });
          g += `<ellipse cx="${q(fx)}" cy="${q(fy + 2)}" rx="${q(5 * r)}" ry="2" fill="${F('stem')}" opacity=".7"/>`;
        }
      }
      g += `<path d="${stem}" stroke="${F(o.stemColor || 'stem')}" stroke-width="${o.leggy ? 2.6 : 3.6}" fill="none" stroke-linecap="round"/>`;
      pts.forEach(([px, py], i) => {
        const size = (o.leggy ? 0.36 : 0.62 - i * 0.09) * (o.leafScale || 1);
        [-1, 1].forEach(side => {
          const extra = o.leaf ? o.leaf(i, n, side) || {} : {};
          const droop = dr * (1 - i * 0.08);
          const a = side * (58 - i * 6 + droop * 100 + (rnd() - 0.5) * 8);
          g += leaf(Object.assign({ x: px, y: py, a, s: size, seed: 11 + i * 3 + (side > 0 ? 1 : 0), petiole: 12 }, dr > 0.4 ? { wide: 0.82 } : {}, extra));
        });
      });
      // the growing tip
      const [tx, ty] = pts[n - 1];
      if (!o.bolt) [-1, 1].forEach(side => { g += leaf(Object.assign({ x: tx, y: ty, a: side * 24 + dr * 110, s: 0.2, seed: 40 + side, petiole: 4 }, o.leaf ? o.leaf(n, n, side) || {} : {})); });
      return `<g transform="translate(${q(o.x || 0)} ${q(o.y || 0)})">${g}</g>`;
    }
    function pot(x, y, w = 70, hgt = 52, o = {}) {
      const t = w / 2, b = w * 0.36;
      let g = `<path d="M${q(-t)} 0L${q(-b)} ${hgt}H${q(b)}L${q(t)} 0Z" fill="${F('pot')}"/><path d="M${q(b * 0.3)} ${hgt}L${q(t * 0.72)} 0H${q(t)}L${q(b)} ${hgt}Z" fill="${F('pot-d')}" opacity=".35"/>`;
      g += `<rect x="${q(-t - 4)}" y="-8" width="${q(w + 8)}" height="12" rx="3" fill="${F('pot-hi')}"/><ellipse cx="0" cy="-7" rx="${q(t)}" ry="4" fill="${F(o.wet ? 'soil-d' : 'soil')}"/>`;
      if (o.crust) { let c = ''; for (let i = 0; i < 18; i++) c += `<ellipse cx="${q(-t * 0.85 + i * (t * 1.7 / 17))}" cy="${q(-7 + Math.sin(i * 2.1) * 1.8)}" rx="${q(3 + (i % 3))}" ry="1.4" fill="${F('crust')}"/>`; g += c + `<path d="M${q(-t)} 0L${q(-b)} ${hgt}" stroke="${F('crust')}" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>`; }
      return `<g transform="translate(${q(x)} ${q(y)})">${g}</g>`;
    }
    function seedling(x, y, hgt = 44, o = {}) {
      const rnd = micro.rng(o.seed || 2);
      if (o.fallen) {
        hgt = hgt || 40;
        const g = `<path d="M0 0Q2 -6 10 -8Q22 -10 ${hgt} -4" stroke="${F('stem')}" stroke-width="2.4" fill="none"/><path d="M-1 1Q0 -4 3 -6" stroke="${F('brown-d')}" stroke-width="3.2" fill="none" stroke-linecap="round"/>` +
          leaf({ x: hgt, y: -4, a: 105, s: 0.2, wide: 1.6, seed: 5, petiole: 2, pale: true }) + leaf({ x: hgt, y: -4, a: 60, s: 0.18, wide: 1.6, seed: 6, petiole: 2, pale: true });
        return `<g transform="translate(${q(x)} ${q(y)})">${g}</g>`;
      }
      const lean = (rnd() - 0.5) * 6;
      const g = `<path d="M0 0Q${q(lean)} ${q(-hgt / 2)} ${q(lean * 0.6)} ${q(-hgt)}" stroke="${F('stem')}" stroke-width="2.4" fill="none"/>` +
        leaf({ x: lean * 0.6, y: -hgt, a: -62, s: 0.2, wide: 1.6, seed: 3, petiole: 2 }) + leaf({ x: lean * 0.6, y: -hgt, a: 62, s: 0.2, wide: 1.6, seed: 4, petiole: 2 });
      return `<g transform="translate(${q(x)} ${q(y)})">${g}</g>`;
    }
    const label = (x, y, text, anchor = 'middle') => `<text class="ill-lbl" x="${q(x)}" y="${q(y)}" text-anchor="${anchor}">${text}</text>`;
    const scale = (x, y, px, text) => `<g class="ill-scale"><path d="M${q(x - px)} ${q(y - 3)}V${q(y + 3)}M${q(x - px)} ${q(y)}H${q(x)}M${q(x)} ${q(y - 3)}V${q(y + 3)}" fill="none" stroke="currentColor"/><line x1="${q(x - px)}" x2="${q(x)}" y1="${q(y)}" y2="${q(y)}"/><text x="${q(x - px / 2)}" y="${q(y - 6)}" text-anchor="middle">${text}</text></g>`;
    // wide pictures are shown small (two in a row): their captions are set larger in CSS (.ill-l)
    const svg = (w, hgt, body, label2) => `<svg class="ill ${w >= 200 ? 'ill-l' : 'ill-s'}" viewBox="0 0 ${w} ${hgt}" role="img"${label2 ? ` aria-label="${label2}"` : ' aria-hidden="true"'}>${body}</svg>`;
    return { F, q, rng: micro.rng, HW, Ys, leaf, plant, pot, seedling, aphid, mite, whitefly, thrips, web, label, scale, svg, mix };
  })();
