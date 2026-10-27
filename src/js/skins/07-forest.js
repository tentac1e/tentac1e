  /* ------------------------------------------------------------------ */
  /* the grove behind the page of «Друид»: the night is a still gradient  */
  /* (28-druid.css). At its edges stand still pictures — an old stump    */
  /* with its roots, moss and bracket fungi, a mossy fallen log with its */
  /* cut face, a gnarled branch reaching in at the top, a tangle of ivy  */
  /* along the top edge, ferns at the foot. Lianas hang from the branch  */
  /* and the ivy and sway slowly, runes carved in the stump and the log  */
  /* smoulder and kindle in turn, little mushrooms glow, fireflies       */
  /* wander. Nothing follows the scroll: the page goes over a calm layer, */
  /* and all of it rests with the rest of the page when it falls asleep  */
  /* ------------------------------------------------------------------ */
  function forest() {
    const el = doc.createElement('div');
    el.id = 'psx-forest';
    el.setAttribute('aria-hidden', 'true');
    el.dataset.bg = '';
    const R = rng(23), f = v => Math.round(v * 10) / 10;
    const css = getComputedStyle(root), tok = (name, or) => css.getPropertyValue(name).trim() || or;
    const C = {
      bark: tok('--forest-bark', '#17241B'), barkD: tok('--forest-bark-d', '#0D1610'), ring: tok('--forest-ring', '#25332A'),
      moss: tok('--forest-moss', '#1E3922'), mossL: tok('--forest-moss-l', '#294C2D'), fungus: tok('--forest-fungus', '#2A281D'),
      fungusL: tok('--forest-fungus-l', '#3A3626'), twig: tok('--forest-twig', '#16271B'), fern: tok('--forest-fern', '#1A2F1F'),
      vine: tok('--forest-vine', '#18301F'), leaf: tok('--forest-leaf', '#213826'), leafL: tok('--forest-leaf-l', '#28452E'),
      rune: tok('--forest-rune', '#8FE8C6'), cap: tok('--forest-cap', '#9EEAD2'), fly: tok('--forest-fly', '#EEFFB0'),
      flyGlow: tok('--forest-fly-glow', 'rgba(196,240,120,.38)')
    };
    // a smooth line through points (quadratic curves through the midpoints)
    const smooth = (pts, closed) => {
      let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
      for (let i = 1; i < pts.length - 1; i++) d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f((pts[i][0] + pts[i + 1][0]) / 2)} ${f((pts[i][1] + pts[i + 1][1]) / 2)}`;
      const l = pts[pts.length - 1];
      return d + `L${f(l[0])} ${f(l[1])}` + (closed ? 'Z' : '');
    };
    // a blob of moss: a lumpy ellipse
    const blob = (cx, cy, rx, ry, col) => {
      const p = [];
      for (let i = 0; i < 9; i++) { const q = i / 9 * Math.PI * 2, k = 0.8 + R() * 0.35; p.push([cx + Math.cos(q) * rx * k, cy + Math.sin(q) * ry * k]); }
      p.push(p[0]);
      return `<path fill="${col}" d="${smooth(p, true)}"/>`;
    };
    // the runes carved here, in unit squares: their strokes, as a carver would cut them
    const RUNE = {
      fehu: [[[0.25, 1], [0.25, 0]], [[0.25, 0.14], [0.8, 0]], [[0.25, 0.44], [0.8, 0.3]]],
      algiz: [[[0.5, 1], [0.5, 0]], [[0.5, 0.42], [0.08, 0]], [[0.5, 0.42], [0.92, 0]]],
      othala: [[[0.5, 0], [0.86, 0.34], [0.5, 0.68], [0.14, 0.34], [0.5, 0]], [[0.32, 0.51], [0.06, 1]], [[0.68, 0.51], [0.94, 1]]],
      raidho: [[[0.22, 1], [0.22, 0]], [[0.22, 0], [0.76, 0.22], [0.22, 0.48]], [[0.22, 0.48], [0.8, 1]]],
      ingwaz: [[[0.5, 0], [0.88, 0.5], [0.5, 1], [0.12, 0.5], [0.5, 0]]]
    };
    const carve = (name, x, y, w, h) => RUNE[name].map(s => s.map(([u, v]) => [x + u * w, y + v * h]));
    const grooves = strokes => strokes.map(s => `<path d="${'M' + s.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}"/>`).join('');

    // a loop of liana hanging between two points of a picture, with leaves along it: still, part of the picture
    const festoon = (a, b, sag) => {
      const mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + sag;
      let leaves = '';
      for (let u = 0.12; u < 0.95; u += 0.11 + R() * 0.06) {
        const x = (1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my + u * u * b[1];
        const sz = 9 + R() * 5, rot = (R() < 0.5 ? -1 : 1) * (20 + R() * 50);
        leaves += `<path fill="${R() < 0.4 ? C.leafL : C.leaf}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sz / 12)})" d="M0 1.4C3.6 -1.4 9.4 1.4 6 6.2Q3.6 9.4 0 12Q-3.6 9.4 -6 6.2C-9.4 1.4 -3.6 -1.4 0 1.4Z"/>`;
      }
      return `<path fill="none" stroke="${C.vine}" stroke-width="2.6" stroke-linecap="round" d="M${f(a[0])} ${f(a[1])}Q${f(mx)} ${f(my * 2 - (a[1] + b[1]) / 2)} ${f(b[0])} ${f(b[1])}"/>` + leaves;
    };

    // an old broken stump: roots spreading on the ground, the bark in deep grooves, moss on its jagged top and the
    // roots, a shelf of bracket fungi on its side, small mushrooms at its foot (they glow) and three runes cut into it
    function stumpPicture() {
      const W = 400, H = 380;
      const top = [[96, 150], [116, 128], [132, 146], [150, 110], [170, 140], [194, 122], [214, 150], [236, 116], [256, 140], [280, 124], [304, 138]];
      const topAt = x => { for (let i = 1; i < top.length; i++) if (x <= top[i][0]) { const a = top[i - 1], b = top[i], u = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } return 140; };
      const body = [[82, 382], [78, 330], [87, 280], [84, 230], [92, 188], ...top, [310, 182], [305, 232], [314, 282], [311, 332], [320, 382]];
      let roots = '';
      [[[96, 352], [40, 368], [-30, 378]], [[150, 368], [110, 380], [60, 390]], [[214, 374], [212, 384], [196, 392]], [[262, 366], [320, 380], [372, 388]], [[306, 350], [360, 360], [430, 372]]].forEach(c => {
        [[22, 1], [14, 0.78], [7, 0.52]].forEach(([w, k]) => {
          const e = [c[0][0] + (c[2][0] - c[0][0]) * k, c[0][1] + (c[2][1] - c[0][1]) * k];
          roots += `<path d="M${c[0][0]} ${c[0][1]}Q${c[1][0]} ${c[1][1]} ${f(e[0])} ${f(e[1])}" stroke-width="${w}"/>`;
        });
      });
      let lines = '';
      for (let i = 0; i < 9; i++) {
        const x0 = 104 + i * 23 + (R() - 0.5) * 8, p = [];
        for (let y = 372; y > topAt(x0) + 18; y -= 16) p.push([x0 + Math.sin(y * 0.045 + i * 1.7) * 4 + (R() - 0.5) * 2, y]);
        if (p.length > 1) lines += `<path d="${smooth(p)}" stroke-width="${f(2.6 + R() * 2)}"/>`;
      }
      let moss = '';
      top.forEach(([x, y], i) => { if (i % 2 === 0) moss += blob(x, y + 6, 14 + R() * 8, 6 + R() * 3, C.moss); });
      [[110, 356, 22, 8], [270, 360, 26, 9], [302, 300, 10, 22], [86, 250, 8, 18]].forEach(([x, y, a, b]) => { moss += blob(x, y, a, b, C.moss); });
      [[150, 140, 8, 3], [240, 136, 9, 3], [116, 354, 9, 3], [276, 356, 10, 3]].forEach(([x, y, a, b]) => { moss += blob(x, y, a, b, C.mossL); });
      let fungi = '';
      [[300, 214, 52, 16], [308, 238, 40, 13], [296, 258, 30, 10]].forEach(([x, y, w, h]) => {
        fungi += `<path fill="${C.fungus}" d="M${x} ${y}q${w * 0.5} ${-h} ${w} ${h * 0.35}q${-w * 0.45} ${h * 0.55} ${-w} ${-h * 0.35}z"/>`
          + `<path fill="none" stroke="${C.fungusL}" stroke-width="2" stroke-linecap="round" d="M${x + 3} ${y - 1}q${w * 0.5} ${-h * 0.9} ${w - 6} ${h * 0.3}"/>`;
      });
      const caps = [[128, 368, 7], [143, 372, 5], [284, 364, 6]];
      let shrooms = '';
      caps.forEach(([x, y, r]) => { shrooms += `<path fill="${C.ring}" d="M${x - 1.4} ${y}h2.8v${r * 1.4}h-2.8z"/><path fill="${C.fungusL}" d="M${x - r} ${y + 1}q${r} ${-r * 1.5} ${r * 2} 0z"/>`; });
      const runes = [carve('fehu', 186, 196, 26, 30), carve('algiz', 186, 240, 26, 30), carve('othala', 186, 284, 26, 32)];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`
        + `<g fill="none" stroke="${C.bark}" stroke-linecap="round">${roots}</g>`
        + `<path fill="${C.bark}" d="${smooth(body, true)}"/>`
        + `<path fill="${C.ring}" d="${smooth(top.map(([x, y]) => [x, y + 3]))}L304 150L96 160Z" opacity=".55"/>`
        + `<g fill="none" stroke="${C.barkD}" stroke-linecap="round">${lines}</g>`
        + `<g fill="none" stroke="${C.barkD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${runes.map(grooves).join('')}</g>`
        + moss + fungi + shrooms + '</svg>';
      return { svg, vb: [W, H], runes, caps };
    }

    // a fallen log, its cut end towards the page: rings and a crack on the face, bark in long grooves, moss along its
    // back with a sapling in it, mushrooms in a row at its foot, and a rune of the home cut across the rings
    function logPicture() {
      const W = 560, H = 240, ex = 120, ey = 140, rx = 56, ry = 70;
      const upper = [[ex, ey - ry], [200, ey - ry - 6], [290, ey - ry + 2], [380, ey - ry - 8], [470, ey - ry - 2], [W + 20, ey - ry - 10]];
      const lower = [[W + 20, ey + ry - 6], [460, ey + ry + 2], [360, ey + ry - 2], [250, ey + ry + 4], [ex, ey + ry]];
      let lines = '';
      for (let i = 0; i < 7; i++) {
        const y0 = ey - ry + 16 + i * 19, p = [];
        for (let x = ex + 40 + R() * 20; x < W + 10; x += 22) p.push([x, y0 + Math.sin(x * 0.03 + i) * 3 + (R() - 0.5) * 2]);
        lines += `<path d="${smooth(p)}" stroke-width="${f(2.4 + R() * 1.6)}"/>`;
      }
      let rings = '';
      for (let i = 1; i <= 5; i++) rings += `<ellipse cx="${ex}" cy="${ey}" rx="${f(rx * i / 6)}" ry="${f(ry * i / 6)}"/>`;
      let moss = '';
      for (let x = 160; x < W; x += 34 + R() * 18) moss += blob(x, ey - ry - 2 + Math.sin(x * 0.05) * 3, 18 + R() * 10, 6 + R() * 3, R() < 0.3 ? C.mossL : C.moss);
      moss += blob(ex + 8, ey - ry + 2, 22, 7, C.moss);
      const sprout = `<g fill="none" stroke="${C.mossL}" stroke-width="2.4" stroke-linecap="round"><path d="M336 ${ey - ry - 4}q-2 -16 4 -30"/></g>`
        + `<path fill="${C.leafL}" d="M340 ${ey - ry - 32}c8 -10 20 -8 24 -4c-8 8 -18 8 -24 4z"/><path fill="${C.leaf}" d="M338 ${ey - ry - 24}c-8 -8 -20 -6 -22 -2c8 6 16 6 22 2z"/>`;
      const caps = [[214, ey + ry - 2, 6], [228, ey + ry + 2, 8], [246, ey + ry + 1, 5], [410, ey + ry - 3, 6]];
      let shrooms = '';
      caps.forEach(([x, y, r]) => { shrooms += `<path fill="${C.ring}" d="M${x - 1.4} ${y - r * 0.2}h2.8v${r * 1.3}h-2.8z"/><path fill="${C.fungusL}" d="M${x - r} ${y}q${r} ${-r * 1.5} ${r * 2} 0z"/>`; });
      const runes = [carve('othala', ex - 18, ey - 26, 36, 52)];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`
        + `<path fill="${C.bark}" d="${smooth(upper)}L${W + 20} ${ey + ry - 6}${smooth(lower).replace(/^M/, 'L')}Z"/>`
        + `<g fill="none" stroke="${C.barkD}" stroke-linecap="round">${lines}</g>`
        + `<ellipse cx="${ex}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${C.ring}" stroke="${C.barkD}" stroke-width="7"/>`
        + `<g fill="none" stroke="${C.bark}" stroke-width="2">${rings}<path d="M${ex} ${ey}l${rx * 0.7} ${-ry * 0.3}" stroke-width="3"/></g>`
        + `<g fill="none" stroke="${C.barkD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${runes.map(grooves).join('')}</g>`
        + moss + sprout + shrooms + '</svg>';
      return { svg, vb: [W, H], runes, caps };
    }

    // a gnarled branch reaching in from the left edge at the top, thick at the root and thin at its tip, moss along its
    // back, knots and two twigs with leaves; lianas hang from its underside (anchors)
    function branchPicture() {
      const W = 600, H = 240, n = 40, up = [], lo = [];
      const at = t => { const x = -20 + t * 590, y = 64 + t * 40 + Math.sin(t * 7) * 10 + t * t * 20; return [x, y]; };
      for (let i = 0; i <= n; i++) {
        const t = i / n, [x, y] = at(t), [x2, y2] = at(Math.min(1, t + 0.01)), a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
        const w = 30 * Math.pow(1 - t, 0.8) + 2.6 + Math.sin(t * 23) * 2.4 * (1 - t) + Math.sin(t * 61) * 1.2 * (1 - t);
        up.push([x - Math.cos(a) * w, y - Math.sin(a) * w]); lo.push([x + Math.cos(a) * w, y + Math.sin(a) * w]);
      }
      let twigs = '';
      [[0.42, -0.9, 70], [0.7, -0.6, 52]].forEach(([t, a, len]) => {
        const [x, y] = at(t), ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
        twigs += `<path d="M${f(x)} ${f(y)}Q${f(x + len * 0.3)} ${f(y - len * 0.5)} ${f(ex)} ${f(ey)}" stroke-width="${t < 0.5 ? 5 : 3.5}"/>`;
        for (let k = 0; k < 3; k++) { const u = 0.5 + k * 0.22, lx = x + (ex - x) * u, ly = y + (ey - y) * u - len * 0.1; twigs += `<path fill="${k % 2 ? C.leafL : C.leaf}" stroke="none" d="M${f(lx)} ${f(ly)}c${k % 2 ? 8 : -8} -6 ${k % 2 ? 18 : -18} -2 ${k % 2 ? 20 : -20} 4c${k % 2 ? -8 : 8} 4 ${k % 2 ? -16 : 16} 2 ${k % 2 ? -20 : 20} -4z"/>`; }
      });
      let moss = '';
      for (let t = 0.04; t < 0.8; t += 0.07 + R() * 0.05) { const i = Math.round(t * n); moss += blob(up[i][0], up[i][1] + 2, 16 * (1 - t) + 6, 5 * (1 - t) + 2.5, R() < 0.3 ? C.mossL : C.moss); }
      let knots = '';
      [0.22, 0.5].forEach(t => { const [x, y] = at(t); knots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(8 * (1 - t) + 3)}" ry="${f(5 * (1 - t) + 2)}" fill="${C.barkD}"/>`; });
      // where lianas hang: on the underside, some long, some short, two of them side by side; [x, y, length as a share
      // of the picture's width]; and two loops of liana between points of it
      const anchors = [[0.1, 0.92], [0.15, 0.36], [0.3, 0.66], [0.47, 0.28], [0.56, 0.74], [0.74, 0.42], [0.86, 0.22]].map(([t, len]) => { const i = Math.round(t * n); return [lo[i][0], lo[i][1] - 2, len]; });
      const loops = festoon(lo[Math.round(0.2 * n)], lo[Math.round(0.4 * n)], 46) + festoon(lo[Math.round(0.62 * n)], lo[Math.round(0.8 * n)], 30);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`
        + `<g fill="none" stroke="${C.twig}" stroke-linecap="round">${twigs}</g>`
        + `<path fill="${C.bark}" d="${smooth(up)}${smooth(lo.slice().reverse()).replace(/^M/, 'L')}Z"/>`
        + `<path fill="none" stroke="${C.barkD}" stroke-width="2" stroke-linecap="round" d="${smooth(up.map(([x, y], i) => [x + 4, y + (lo[i][1] - y) * 0.45]).slice(0, 30))}"/>`
        + knots + moss + loops + '</svg>';
      return { svg, vb: [W, H], anchors };
    }

    // a tangle of ivy along the top edge in the right corner: three stems with their leaves; lianas drop from it
    function ivyPicture() {
      const W = 360, H = 130;
      let stems = '', leaves = '';
      [[8, 0.9], [22, 0.75], [36, 0.55]].forEach(([y0, len], s) => {
        const p = [];
        for (let x = W + 10; x > W * (1 - len); x -= 18) p.push([x, y0 + Math.sin(x * 0.05 + s * 2) * 7 + (W - x) * 0.04]);
        stems += `<path d="${smooth(p)}" stroke-width="${3.2 - s * 0.6}"/>`;
        p.forEach(([x, y], i) => {
          if (i % 2) return;
          const sz = 10 + R() * 6, side = i % 4 ? 1 : -1, a = 90 + side * (30 + R() * 30);
          leaves += `<path fill="${R() < 0.35 ? C.leafL : C.leaf}" transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(sz / 12)})" d="M0 0C3 -6 10 -7 12 -1C11 4 5 7 0 0Z"/>`;
        });
      });
      const anchors = [[48, 30, 0.7], [112, 36, 1.5], [150, 34, 0.5], [214, 30, 1.05], [262, 26, 0.38], [318, 20, 1.25]];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><g fill="none" stroke="${C.vine}" stroke-linecap="round">${stems}</g>${leaves}${festoon([70, 30], [190, 34], 54)}</svg>`;
      return { svg, vb: [W, H], anchors };
    }

    // ferns rising at the foot: each frond goes up from a bare stalk, arches out and droops at the tip under its weight;
    // its leaflets are longest in the middle and lean to the tip
    function fernPicture() {
      let stems = '', pinnae = '';
      [[34, -1.95, 150, 0.075], [52, -1.62, 170, 0.06], [66, -1.3, 150, 0.075], [44, -1.78, 110, 0.05], [80, -1.12, 120, 0.09]].forEach(([x, a, len, sag]) => {
        let y = 200, d = `M${x} ${y}`;
        const N = 22;
        for (let i = 1; i <= N; i++) {
          const u = i / N;
          a = Math.atan2(Math.sin(a) + sag, Math.cos(a));
          x += Math.cos(a) * len / N; y += Math.sin(a) * len / N;
          d += `L${f(x)} ${f(y)}`;
          if (u > 0.24) for (const s of [-1, 1]) {
            const pl = 15 * Math.sin(Math.PI * Math.min(1, (u - 0.2) / 0.85)) + 1.5, q = a + s * 0.95;
            pinnae += `M${f(x)} ${f(y)}l${f(Math.cos(q) * pl)} ${f(Math.sin(q) * pl + pl * 0.2)}`;
          }
        }
        stems += `<path d="${d}" stroke-width="1.7"/>`;
      });
      return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-86 20 276 180"><g fill="none" stroke="${C.fern}" stroke-linecap="round">${stems}<path d="${pinnae}" stroke-width="2.2"/></g></svg>`, vb: [276, 180] };
    }

    // each picture goes to the page as an <img>: the browser keeps it drawn once, and the frames of the canvases above
    // never make it draw those paths again. Its box holds its shape before the picture is decoded (aspect-ratio), so the
    // runes and lianas find their places at once; where it stands is its class (28-druid.css)
    const PIC = { fern: fernPicture(), stump: stumpPicture(), log: logPicture(), branch: branchPicture(), ivy: ivyPicture() };
    const boxes = {};
    Object.entries(PIC).forEach(([name, p]) => {
      const box = doc.createElement('div');
      box.className = `tw tw-${name}`;
      box.style.aspectRatio = `${p.vb[0]} / ${p.vb[1]}`;
      box.innerHTML = `<img alt="" decoding="async" src="data:image/svg+xml,${encodeURIComponent(p.svg)}">`;
      el.appendChild(box);
      boxes[name] = box;
    });

    // the canvases: one as large as the screen for the fireflies, a point of it to a point of the page (in half of them,
    // drawn up by the browser at every frame of theirs, it cost the browser twice as much where it puts the screen
    // together without the graphics card), and small ones only where something moves — the lianas of the branch and of
    // the ivy, the glow of the stump and of the log — at up to one and a half points a point, so a leaf stays a leaf.
    // Each is a layer of its own
    const fly = doc.createElement('canvas');
    fly.className = 'fly';
    el.appendChild(fly);
    const pane = cls => { const c = doc.createElement('canvas'); c.className = 'grove-pane ' + cls; el.appendChild(c); return c; };
    const panes = { branch: pane('gp-branch'), ivy: pane('gp-ivy'), stump: pane('gp-stump'), log: pane('gp-log') };

    // the fireflies: each wanders on a path of its own — across and up and down at two paces, never quite stopping —
    // and glows up now and then; fewer on a narrow screen. In «less motion» a few simply stand lit
    const nFly = innerWidth < 600 ? 14 : 26, flies = [];
    for (let i = 0; i < nFly; i++) {
      const tx = 9 + R() * 10, ty = 7 + R() * 8, b = 4 + R() * 5;
      flies.push({ x: 0.04 + R() * 0.92, y: 0.22 + R() * 0.74, dx: 24 + R() * 46, dy: 14 + R() * 30, tx, ty, b, px: R() * 6.3, py: R() * 6.3, pb: R(), still: i % 3 ? 0 : 0.8, was: null });
    }
    // where everything moving stands, read from the page: the fireflies' canvas, each pane over its picture (its place on
    // the page, its size in canvas points), each liana from its anchor, each glow on its rune or mushroom
    const rect = box => { const r = box.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; };
    function layout() {
      const kv = Math.min(1.5, window.devicePixelRatio || 1), narrow = innerWidth < 600;
      const lay = { W: el.clientWidth, H: el.clientHeight, panes: {}, vines: [], glows: [], flies };
      const place = (name, b) => {
        lay.panes[name] = { ...b, kv };
        Object.assign(panes[name].style, { left: b.l + 'px', top: b.t + 'px', width: b.w + 'px', height: b.h + 'px' });
      };
      // the lianas: from the anchors of the branch and of the ivy, as long as the picture is drawn wide (shorter on a
      // narrow screen, and only every other one)
      [['branch', 1], ['ivy', 2]].forEach(([name, seed]) => {
        const b = rect(boxes[name]), s = b.w / PIC[name].vb[0];
        const list = PIC[name].anchors.filter(([ax]) => !narrow || (name === 'ivy' ? ax * s > b.w - 90 : ax * s < 90));
        const made = list.map(([ax, ay, len], i) => ({ ax: b.l + ax * s, ay: b.t + ay * s, len: len * b.w * (narrow ? 0.32 : 0.6), seed: seed * 100 + i }));
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        made.forEach(v => { const reach = 24 + v.len * 0.1; x0 = Math.min(x0, v.ax - reach); x1 = Math.max(x1, v.ax + reach); y0 = Math.min(y0, v.ay - 6); y1 = Math.max(y1, v.ay + v.len + 30); });
        const box = { l: Math.floor(x0), t: Math.floor(y0), w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0) };
        place(name, box);
        made.forEach(v => lay.vines.push({ pane: name, x: v.ax - box.l, y: v.ay - box.t, len: v.len, seed: v.seed }));
      });
      // the runes and the mushrooms of the stump and the log: their glows, where the pictures put them
      ['stump', 'log'].forEach(name => {
        const b = rect(boxes[name]), s = b.w / PIC[name].vb[0];
        place(name, { l: Math.floor(b.l), t: Math.floor(b.t), w: Math.ceil(b.w), h: Math.ceil(b.h) });
        PIC[name].runes.forEach((st, i) => lay.glows.push({ pane: name, rune: st, s, P: 9 + i * 1.7, ph: i * 1.9 + (name === 'log' ? 3 : 0) }));
        PIC[name].caps.forEach(([cx, cy, r], i) => lay.glows.push({ pane: name, cap: [cx * s, cy * s, Math.max(10, r * s * 2.6)], P: 7 + i * 1.3, ph: i * 2.3 }));
      });
      return lay;
    }

    const page = $('.page');
    (page ? page.parentNode : doc.body).insertBefore(el, page);
    let rz = 0, seen = '';
    // drawn by the worker of the scenes where it can be (the page sends where things stand, again after a resize), 15
    // frames a second on every second beat of the scene in the head (so that both change on the screen together);
    // else here, as before
    let G = null, L = null;
    const local = (cvs, lay) => {
      G = groveOn(cvs, C, lay);
      L = psxLoop(now => { G.frame(now); }, 15, 15);
      const motion = () => { if (reduce.matches) { L.stop(); G.frame(0); } else L.start(); };
      reduce.addEventListener('change', motion);
      motion();
      return { destroy() { L.stop(); reduce.removeEventListener('change', motion); }, lay: l => { G.lay(l); if (reduce.matches) G.frame(0); } };
    };
    const lay0 = layout();
    const off = offCanvas(fly, 'grove', { C, lay: lay0 }, 15, (fresh, fp) => { Object.assign(panes, fp); return local({ fly: fresh, ...panes }, layout()); }, panes);
    const run = off || local({ fly, ...panes }, lay0);
    // a phone's bars coming and going leave the layer as it was (it is as tall as the screen without them): nothing to do
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { const key = `${el.clientWidth}x${el.clientHeight}`; if (key === seen) return; seen = key; const lay = layout(); if (off) off.post({ type: 'lay', lay }); else run.lay(lay); }, 150); };
    seen = `${el.clientWidth}x${el.clientHeight}`;
    addEventListener('resize', onResize);
    return {
      destroy() {
        run.destroy();
        clearTimeout(rz);
        removeEventListener('resize', onResize);
        el.remove();
      }
    };
  }

  // what moves in the grove, on its canvases (cvs: fly, branch, ivy, stump, log): the fireflies, the lianas, the glows of
  // the runes and the mushrooms — on the page, or in the worker of the scenes (04-stage.js). C — the colours of the
  // grove, lay — where everything stands (forest(), read from the page)
  function groveOn(cvs, C, lay) {
    const fx = cvs.fly.getContext('2d');
    const panes = {};
    ['branch', 'ivy', 'stump', 'log'].forEach(n => { panes[n] = { c: cvs[n], x: cvs[n].getContext('2d'), box: null }; });
    // a liana: a thin stem with ivy-like leaves on short stalks, in turns to either side, and now and then a tendril;
    // drawn once into three pieces, each hanging from the end of the one above, so it can bend as it sways
    function liana(len, seed, kv) {
      const r = rng(seed), segs = [], n = 3, pad = 22, spread = 22;
      for (let j = 0; j < n; j++) {
        const L = len / n, w = spread * 2 + 8, h = L + pad * 2;
        const c = doc.createElement('canvas');
        c.width = Math.ceil(w * kv); c.height = Math.ceil(h * kv);
        const x = c.getContext('2d');
        x.scale(kv, kv);
        const cx = w / 2, bow = (r() - 0.5) * 6;
        x.strokeStyle = C.vine; x.lineCap = 'round';
        x.lineWidth = 3 - j * 0.6;
        x.beginPath(); x.moveTo(cx, pad); x.quadraticCurveTo(cx + bow, pad + L / 2, cx, pad + L); x.stroke();
        for (let y = pad + 6 + r() * 8, s = r() < 0.5 ? -1 : 1; y < pad + L - 2; y += 15 + r() * 9, s = -s) {
          const u = (y - pad) / L, sx = cx + bow * 2 * u * (1 - u) * 2, sz = (13 + r() * 6) * (1 - j * 0.14), a = s * (0.75 + r() * 0.55);
          x.save(); x.translate(sx, y); x.rotate(a);
          x.strokeStyle = C.vine; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 4); x.stroke();
          x.translate(0, 3);
          x.fillStyle = r() < 0.4 ? C.leafL : C.leaf;
          x.beginPath(); x.moveTo(0, sz * 0.12);
          x.bezierCurveTo(sz * 0.3, -sz * 0.12, sz * 0.78, sz * 0.12, sz * 0.5, sz * 0.52);
          x.quadraticCurveTo(sz * 0.3, sz * 0.78, 0, sz);
          x.quadraticCurveTo(-sz * 0.3, sz * 0.78, -sz * 0.5, sz * 0.52);
          x.bezierCurveTo(-sz * 0.78, sz * 0.12, -sz * 0.3, -sz * 0.12, 0, sz * 0.12); x.fill();
          x.strokeStyle = C.vine; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, sz * 0.14); x.lineTo(0, sz * 0.8); x.stroke();
          x.restore();
          if (r() < 0.18) { x.strokeStyle = C.vine; x.lineWidth = 0.9; x.beginPath(); x.arc(sx - s * 5, y + 2, 3.2, 0, Math.PI * 1.6); x.stroke(); }
        }
        segs.push({ c, w, h, ox: cx, oy: pad, L });
      }
      return { segs, P: 9 + r() * 6, ph: r() * 6.3, A: 0.01 + r() * 0.008, len };
    }
    // a glow to lay over a carved rune: its strokes in light, softened, drawn once
    function glowOf(strokes, s, kv) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      strokes.flat().forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
      const pad = 10, w = (x1 - x0) * s + pad * 2, h = (y1 - y0) * s + pad * 2;
      const c = doc.createElement('canvas');
      c.width = Math.ceil(w * kv); c.height = Math.ceil(h * kv);
      const x = c.getContext('2d');
      x.scale(kv, kv); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = C.rune;
      const path = () => { x.beginPath(); strokes.forEach(st => st.forEach(([px, py], i) => (i ? x.lineTo : x.moveTo).call(x, (px - x0) * s + pad, (py - y0) * s + pad))); };
      [[7, 0.12], [4.5, 0.22], [2.4, 0.7], [1.3, 1]].forEach(([lw, a]) => { x.globalAlpha = a; x.lineWidth = lw * Math.max(0.6, s); path(); x.stroke(); });
      return { c, w, h, x: x0, y: y0, pad };
    }
    const capGlow = (() => {
      const r = 14, c = doc.createElement('canvas'), x = c.getContext('2d');
      c.width = c.height = r * 4;
      const g = x.createRadialGradient(r * 2, r * 2, 0, r * 2, r * 2, r * 2);
      g.addColorStop(0, C.cap); g.addColorStop(0.25, C.cap); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = 0.55; x.fillStyle = g; x.fillRect(0, 0, r * 4, r * 4);
      return c;
    })();

    const RAD = 11, k = 1;
    let W = 0, H = 0, sprite = null, time = 0, last = null, frameN = 0, vines = [], glows = [], flies = [];
    function setLay(l) {
      flies = l.flies.map(fl => ({ ...fl, was: null }));
      W = cvs.fly.width = l.W; H = cvs.fly.height = l.H;
      const r = Math.ceil(RAD * k);
      sprite = doc.createElement('canvas');
      sprite.width = sprite.height = r * 2;
      const sx = sprite.getContext('2d'), g = sx.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, C.fly); g.addColorStop(0.12, C.fly); g.addColorStop(0.34, C.flyGlow); g.addColorStop(1, 'rgba(196,240,120,0)');
      sx.fillStyle = g; sx.fillRect(0, 0, r * 2, r * 2);
      fx.clearRect(0, 0, W, H);
      Object.entries(l.panes).forEach(([n, b]) => { const p = panes[n]; p.box = b; p.c.width = Math.ceil(b.w * b.kv); p.c.height = Math.ceil(b.h * b.kv); });
      vines = l.vines.map(v => { const p = panes[v.pane]; return { pane: p, ax: v.x, ay: v.y, ...liana(v.len, v.seed, p.box.kv) }; });
      glows = l.glows.map(g0 => { const p = panes[g0.pane]; return g0.rune ? { pane: p, rune: glowOf(g0.rune, g0.s, p.box.kv), s: g0.s, P: g0.P, ph: g0.ph } : { pane: p, cap: g0.cap, P: g0.P, ph: g0.ph }; });
    }
    // how bright a firefly is at the time t: dark most of its round, then a glow that swells and fades
    const flyGlow = (fl, t) => { const p = ((t / fl.b + fl.pb) % 1 + 1) % 1; return p < 0.4 || p > 0.9 ? 0 : Math.pow(Math.sin(Math.PI * (p - 0.4) / 0.5), 1.5); };
    function drawFlies(t, still) {
      const r = Math.ceil(RAD * k);
      flies.forEach(fl => { if (fl.was) fx.clearRect(fl.was[0] - r - 1, fl.was[1] - r - 1, r * 2 + 2, r * 2 + 2); });
      flies.forEach(fl => {
        const a = still ? fl.still : flyGlow(fl, t);
        fl.was = null;
        if (a < 0.02) return;
        const T = Math.PI * 2;
        const px = fl.x * W + (still ? 0 : (Math.sin(T * t / fl.tx + fl.px) + 0.3 * Math.sin(T * t / (fl.tx * 0.43) + fl.py)) * fl.dx * k / 1.3);
        const py = fl.y * H + (still ? 0 : (Math.sin(T * t / fl.ty + fl.py) + 0.3 * Math.sin(T * t / (fl.ty * 0.57) + fl.px)) * fl.dy * k / 1.3);
        fx.globalAlpha = a;
        fx.drawImage(sprite, px - r, py - r);
        fl.was = [px, py];
      });
      fx.globalAlpha = 1;
    }
    // the lianas sway like pendulums hung one from another: each piece a little more and a little later than the one
    // above it, slowly (a round in 9–15 s), and a slower second breath under it — at rest in «less motion»
    function drawVines(t, still) {
      [panes.branch, panes.ivy].forEach(p => { p.x.setTransform(1, 0, 0, 1, 0, 0); p.x.clearRect(0, 0, p.c.width, p.c.height); });
      const T = Math.PI * 2;
      vines.forEach(v => {
        const x = v.pane.x, b = v.pane.box;
        x.setTransform(b.kv, 0, 0, b.kv, v.ax * b.kv, v.ay * b.kv);
        v.segs.forEach((sg, j) => {
          if (!still) x.rotate(v.A * (1 + 0.35 * j) * Math.sin(T * t / v.P + v.ph - j * 0.7) + v.A * 0.3 * Math.sin(T * t / (v.P * 2.3) + v.ph * 1.7));
          x.drawImage(sg.c, -sg.ox, -sg.oy, sg.w, sg.h);
          x.translate(0, sg.L);
        });
      });
    }
    // the runes smoulder and kindle one after another, each on a slow breath of its own; the mushrooms glow softly
    function drawGlows(t, still) {
      [panes.stump, panes.log].forEach(p => { p.x.setTransform(1, 0, 0, 1, 0, 0); p.x.clearRect(0, 0, p.c.width, p.c.height); });
      glows.forEach(g => {
        const x = g.pane.x, kv = g.pane.box.kv, breath = still ? 0.5 : 0.5 + 0.5 * Math.sin(Math.PI * 2 * t / g.P + g.ph);
        x.setTransform(kv, 0, 0, kv, 0, 0);
        if (g.rune) {
          x.globalAlpha = 0.18 + 0.72 * breath * breath;
          x.drawImage(g.rune.c, g.rune.x * g.s - g.rune.pad, g.rune.y * g.s - g.rune.pad, g.rune.w, g.rune.h);
        } else {
          const [cx, cy, r] = g.cap;
          x.globalAlpha = 0.35 + 0.45 * breath;
          x.drawImage(capGlow, cx - r, cy - r, r * 2, r * 2);
        }
      });
      [panes.stump, panes.log].forEach(p => { p.x.globalAlpha = 1; });
    }
    // the clock goes by drawn frames, so after a pause nothing jumps; the fireflies and the lianas move at every frame,
    // the glows at every second — slow enough not to need more. With less motion: all of it at rest
    function frame(now) {
      if (reduce.matches) { drawFlies(0, true); drawVines(0, true); drawGlows(0, true); return; }
      if (last != null) time += clamp((now - last) / 1000, 0, 0.1);
      last = now;
      drawFlies(time, false);
      drawVines(time, false);
      if (frameN % 2 === 0) drawGlows(time, false);
      frameN++;
    }
    setLay(lay);
    return { frame, lay: l => { setLay(l); frameN = 0; } };
  }
