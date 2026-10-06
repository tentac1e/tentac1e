  /* @use props, line */
  /* Pictures of the Planting chapter: the steps of sowing (data-ill="sow:1…9"), of saving a pot of basil
     from the shop (shop:1…7 and shop:hero, the split), and the places to grow it (place:<id>, B.PLACES). */
  const Fp = ill.F, qp = ill.q, R = props;
  const paperP = R.paper, stepP = R.step;
  // a small basil plant of a few leaf pairs, standing on (x, y)
  const young = (x, y, h, pairs, o = {}) => R.sprout(x, y, h, Object.assign({ pairs, s: o.s || 1.25 }, o));

  /* ---------- sowing: drawn in one line (line.js), like the contents' icons ---------- */
  const L = line;
  // a small basil plant of a few leaf pairs, standing on (x, y)
  const youngL = (x, y, h, pairs, o = {}) => L.sprout(x, y, h, Object.assign({ pairs, s: o.s || 1.25 }, o));
  const SOW = {
    1: () => {
      const t = L.tray(46, 102, 76, { cells: 3, perlite: true });
      return L.step(L.bag(98, 102, 34, 46) + t.svg + L.path([36, 46, 56].map(x => `M${x} 78q-4 -6 0 -12q4 -6 0 -12`).join(''), 'ln-s'), 'Кассета с лёгким грунтом и перлитом');
    },
    2: () => {
      // a cell cut open: the seed lies half a centimetre under the surface
      const x0 = 18, x1 = 74, top = 52, rnd = ill.rng(4);
      let grains = '';
      for (let i = 0; i < 9; i++) grains += `M${qp(x0 + 6 + rnd() * (x1 - x0 - 12))} ${qp(top + 18 + rnd() * 28)}h.1`;
      let g = L.g('ln', `<path class="lnf" d="M${x0} ${top - 6}V102H${x1}V${top - 6}"/>`) + L.path(`M${x0 + 2} ${top}H${x1 - 2}`, 'ln-s') + L.path(grains, 'ln-s ln-grain');
      g += L.seed(36, top + 9, 20, true) + L.seed(56, top + 8, -30, true);
      g += `<g class="ill-scale"><path d="M${x0 - 7} ${top}V${top + 9}M${x0 - 11} ${top}H${x0 - 3}M${x0 - 11} ${top + 9}H${x0 - 3}" fill="none" stroke="currentColor" stroke-width="1.6"/></g>`;
      g += ill.label(x0 - 6, top - 12, '0,5 см', 'start');
      g += L.sprayer(98, 102, 0.95, { dir: -1 });
      return L.step(g, 'Семена под тонким слоем грунта и распылитель');
    },
    3: () => {
      const t = L.tray(52, 104, 84, { cells: 3 });
      return L.step(t.svg + t.tops.map(([x, y]) => L.seed(x - 4, y, 20, true) + L.seed(x + 5, y + 1, -40, true)).join('') + L.lid(52, 98, 88, 40) + L.thermo(106, 102, 44, 0.7) + ill.label(112, 24, '22–25 °C', 'end'), 'Кассета под прозрачной крышкой и термометр');
    },
    4: () => {
      const t = L.tray(60, 104, 92, { cells: 3 });
      return L.step(L.lamp(60, 14, 84, { reach: 60 }) + t.svg + t.tops.map(([x, y], i) => L.sprout(x - 5, y, 16 + i, { s: 1.05 }) + L.sprout(x + 6, y + 1, 14 + i, { s: 1, lean: 2 })).join(''), 'Всходы под лампой');
    },
    5: () => {
      const t = L.tray(30, 104, 44, { cells: 2 });
      const ys = L.cupSoil(104, 46);
      return L.step(t.svg + t.tops.map(([x, y]) => L.sprout(x, y, 18, { pairs: 1, s: 1 })).join('') +
        // the lifted seedling with its roots, on its way to a cup of its own
        L.roots(56, 54, 14, 5, { seed: 3, spread: 0.6 }) + L.sprout(56, 54, 20, { pairs: 1, s: 1 }) + L.arrow(46, 30, 84, 40, 12) +
        L.cup(94, 104, 34, 46, { roots: true }) + L.sprout(94, ys + 1, 12, { pairs: 1, s: 1 }), 'Сеянец пересаживают в свой стакан, заглубляя до семядолей');
    },
    6: () => {
      let g = L.g('ln', '<rect class="lnf" x="10" y="96" width="100" height="8" rx="3"/>') + L.path('M14 99.5q6 -2 12 0t12 0t12 0t12 0t12 0t12 0t12 0', 'ln-s');
      [28, 60, 92].forEach((x, i) => { const ys = L.cupSoil(97, 38); g += L.cup(x, 97, 26, 38) + youngL(x, ys, 30 + i * 2, 2, { s: 1.15, lean: 3 }); });
      g += '<path d="M24 24A12 6 0 1 0 40 20" class="ill-arrow"/><path class="ill-arrow-head" d="M40 20l-6 -3l1 6z"/>';
      return L.step(g, 'Стаканы с рассадой в поддоне с водой: полив снизу');
    },
    7: () => {
      const ys = L.cupSoil(104, 40);
      return L.step(L.cup(54, 104, 34, 40) + youngL(54, ys, 64, 4, { s: 1.35, cut: 2 }) + L.scissors(80, 30, 200, 0.9, 0.8), 'Верхушку прищипывают над третьей парой листьев');
    },
    8: () => {
      let g = L.sun(100, 20, 8) + L.tree(30, 98, 0.95) + L.path('M6 101.5q28 -5 56 0', 'ln-s ln-dash');
      [44, 66].forEach((x, i) => { const ys = L.cupSoil(100, 26); g += L.cup(x, 100, 18, 26, { paper: true }) + youngL(x, ys, 24 + i * 3, 2, { s: 0.95 }); });
      g += ill.label(112, 54, '1–2 ч', 'end');
      return L.step(g, 'Рассада на улице в тени дерева', 100);
    },
    9: () => {
      let g = L.bed(4, 116, 92, { mulch: true });
      [30, 88].forEach((x, i) => { g += youngL(x, 93, 48 + i * 4, 3, { s: 1.15 }); });
      g += L.dim(30, 88, 22, '25–30 см');
      return L.step(g, 'Рассада на грядке через 25–30 см, полита и замульчирована', 94);
    }
  };
  illustrate('sow', n => (SOW[n] || SOW[1])(), Object.keys(SOW));

  /* ---------- the pot from the shop ---------- */
  const SHOP = {
    hero: () => {
      // one crowded pot → three roomy ones
      let g = R.shopPot(66, 136, 76, 50) + R.crowd(66, 86, 66, 18, { h: 58, pale: true, seed: 4 });
      g += R.arrow(126, 92, 182, 92, 16) + ill.label(154, 56, 'разделить');
      [222, 276, 330].forEach((x, i) => { g += ill.pot(x, 112, 44, 26) + R.crowd(x, 105, 20, 4, { h: 46, seed: 7 + i }); });
      return ill.svg(360, 150, paperP(360, 150) + `<path data-bg d="M0 136H360V136Q360 150 346 150H14Q0 150 0 136Z" fill="${Fp('bg-2')}"/>` + g, 'Магазинный горшок с десятками сеянцев делят на три-четыре горшка');
    },
    1: () => {
      const inner = ill.leaf({ x: 6, y: 34, a: 6, s: 0.62, under: true, aphids: 6, seed: 5 });
      return stepP(R.shopPot(42, 104, 54, 36) + R.crowd(42, 68, 46, 12, { h: 40, seed: 3 }) + R.lens(88, 46, 24, inner, 130), 'Под лупой — нижняя сторона листа с тлёй');
    },
    2: () => stepP([22, 60, 98].map(x => ill.pot(x, 82, 32, 22, { wet: true })).join('') + [22, 60, 98].map(x => R.drop(x, 112, 0.7)).join(''), 'Три горшка с влажным грунтом: лишняя вода уходит через отверстия'),
    3: () => {
      let g = R.rootball(56, 100, 84, 40, { split: 3, seed: 6 });
      [24, 56, 88].forEach((x, i) => { g += R.crowd(x, 62 + (i % 2 ? 3 : -2), 18, 4, { h: 34, seed: 9 + i }); });
      g += R.knife(76, 22, 120, 0.7);
      return stepP(g, 'Ком корней разломан на три части');
    },
    4: () => {
      let g = `<ellipse cx="50" cy="104" rx="34" ry="5" fill="${Fp('plastic-hi')}"/><ellipse cx="50" cy="103" rx="28" ry="3" fill="${Fp('water-c')}"/>` + ill.pot(50, 76, 46, 26, { wet: true }) + R.crowd(50, 70, 20, 4, { h: 40, seed: 5 });
      g += R.can(98, 46, 0.6, { dir: -1, stream: 18 });
      return stepP(g, 'Посаженный куст полит до стока воды в поддон', 106);
    },
    5: () => {
      let g = R.window(56, 84, 84, 70, { curtain: true, sun: true });
      g += ill.pot(42, 84, 26, 16) + R.crowd(42, 78, 12, 3, { h: 30, seed: 4 }) + R.thermo(106, 100, 40, 0.55) + ill.label(114, 114, '20–24 °C', 'end');
      return stepP(g, 'Горшок на окне за лёгкой занавеской, в полутени', 92);
    },
    6: () => stepP(ill.pot(46, 82, 40, 24) + young(46, 75, 60, 3, { s: 1.3, cut: 1 }) + R.scissors(72, 22, 200, 0.85, 0.8) + R.bowl(96, 104, 34) + ill.leaf({ x: 96, y: 86, a: 70, s: 0.16, seed: 4 }) + ill.leaf({ x: 92, y: 88, a: -50, s: 0.14, seed: 5 }), 'Верхушки срезают над второй-третьей парой листьев'),
    7: () => {
      let g = R.bottle(24, 102, 22, 54, { fill: 'box' }) + `<path d="M44 74h22l-3 22h-16z" fill="${Fp('glass')}" stroke="${Fp('glass-d')}" stroke-width="1"/><path d="M45.6 85h18.8l-1.5 11h-15.8z" fill="${Fp('box')}" opacity=".85"/>`;
      g += ill.pot(92, 80, 40, 24) + R.crowd(92, 73, 18, 4, { h: 40, seed: 8 }) + ill.label(56, 114, '½ дозы');
      return stepP(g, 'Половинная доза удобрения в мерном колпачке');
    }
  };
  illustrate('shop', n => (SHOP[n] || SHOP[1])(), Object.keys(SHOP));

  /* ---------- places: drawn in one line, like the sowing ---------- */
  const W = 320, H = 150;
  const placeP = (body, label, ground = 132) => L.wide(W, H, body, label, ground);
  // a clay pot with its rim at y (the way ill.pot stands), a bush grows at y − 6
  const potL = (x, y, w, h) => L.pot(x, y + h, w + 8, h + 8);
  const basilBush = (x, y, h = 60, o = {}) => L.bush(x, y, h, Object.assign({ nodes: 3, leaf: 0.3, spread: 0.9, seed: 4 }, o));
  const tomato = (x, y, h = 110) => {
    let lv = `<path d="M${x} ${y}Q${x + 6} ${y - h * 0.35} ${x - 2} ${y - h * 0.6}T${x + 4} ${y - h}"/>`, fruit = '';
    [0.25, 0.45, 0.65, 0.85].forEach((t, i) => { const yy = y - h * t, sd = i % 2 ? 1 : -1; lv += L.leaf(x + 1, yy, sd * 70, 24, { wide: 0.75 }); if (i < 3) fruit += [0, 1, 2].map(k => `<circle class="lnf" cx="${qp(x - sd * (8 + k * 6))}" cy="${qp(yy + 10 + (k % 2) * 4)}" r="${4.2 - k * 0.5}"/>`).join(''); });
    return L.path(`M${x + 8} ${y}V${y - h}`, 'ln-s') + L.g('ln-g', lv) + L.g('ln', fruit);
  };
  const PLACE = {
    sill: () => placeP(L.window(138, 102, 148, 92, { sun: true, rays: true, radiator: true }) + potL(110, 102, 40, 26) + basilBush(110, 96, 56) + potL(166, 102, 34, 22) + L.ballBush(166, 96, 26) + L.lamp(282, 34, 56, { reach: 50 }) + ill.label(314, 104, 'досветка', 'end'), 'Подоконник: южное окно, батарея под ним, зимой лампа', 148),
    balcony: () => {
      let g = L.sun(282, 26, 11) + L.balcony(20, 300, 128, { box: [60, 200] });
      [84, 130, 176].forEach((x, i) => { g += basilBush(x, 64, 48, { leaf: 0.26, seed: 5 + i }); });
      g += potL(250, 126, 46, 30) + basilBush(250, 120, 58, { seed: 9 }) + L.path([0, 1, 2].map(i => `M${14 + i * 6} ${40 + i * 12}q20 -6 40 0`).join(''), 'ln-s');
      return placeP(g, 'Балкон: ящик с кустами на перилах и ветер', 132);
    },
    garden: () => {
      let g = L.sun(290, 26, 12) + L.bed(14, 306, 122, { mulch: true, depth: 18 });
      [80, 160, 240].forEach((x, i) => { g += basilBush(x, 123, 70, { leaf: 0.34, seed: 3 + i }); });
      g += L.dim(80, 160, 26, '25–30 см');
      return placeP(g, 'Грядка: кусты через 25–30 см, мульча', 122);
    },
    greenhouse: () => {
      let g = L.greenhouse(160, 132, 270, 124, { vent: true }) + tomato(80, 132, 100) + tomato(240, 132, 104);
      [130, 190].forEach((x, i) => { g += basilBush(x, 132, 54, { seed: 6 + i }); });
      g += L.sun(296, 22, 9);
      return placeP(g, 'Теплица: базилик между томатами, форточка открыта', 132);
    },
    hydro: () => {
      let g = L.lamp(160, 18, 200, { reach: 80 }) + L.tank(160, 136, 180, 50, { pots: [-0.6, 0, 0.6] });
      [-0.6, 0, 0.6].forEach((k, i) => { g += basilBush(160 + k * 90, 82, 50, { leaf: 0.27, seed: 4 + i }); });
      return placeP(g, 'Гидропоника: корни в растворе, сверху лампа', 136);
    }
  };
  illustrate('place', id => (PLACE[id] || PLACE.sill)(), Object.keys(PLACE));

  /* The steps of rooting a cutting (data-ill="cut:1…5"), the tab «Черенки» */
  const Fr = ill.F, qr = ill.q, Rr = props;
  // a cutting standing on (x, y): its own stem with pairs of leaves; bare — the lower nodes without leaves
  const cutting = (x, y, h = 62, o = {}) => Rr.shoot(x, y, h, Object.assign({ pairs: 4, s: 0.27 }, o));
  const CUT = {
    1: () => {
      // a bush; the top 8–12 cm with three or four pairs is cut just under a node
      const sh = Rr.shoot(46, 100, 92, { pairs: 6, s: 0.3 });
      const [nx, ny] = sh.nodes[2];
      let g = ill.pot(46, 104, 50, 20) + sh.svg + Rr.cutMark(nx, ny + 6, 22) + Rr.scissors(nx + 22, ny + 6, 196, 0.85, 0.8);
      const my = qr((ny + 18) / 2);
      g += `<g class="ill-scale"><path d="M98 ${qr(ny + 6)}V12M94 ${qr(ny + 6)}H102M94 12H102" fill="none" stroke="currentColor" stroke-width="1.6"/></g><text class="ill-lbl" x="114" y="${my}" text-anchor="middle" transform="rotate(-90 114 ${my})">8–12 см</text>`;
      return Rr.step(g, 'Верхушку срезают чуть ниже узла');
    },
    2: () => {
      const c = cutting(54, 104, 84, { bare: 2, s: 0.28 });
      let g = c.svg;
      // the two lower pairs, torn off
      g += ill.leaf({ x: 92, y: 96, a: 110, s: 0.2, seed: 3 }) + ill.leaf({ x: 100, y: 78, a: 60, s: 0.2, seed: 5 }) + Rr.arrow(66, c.nodes[0][1] - 2, 84, 92, -6);
      return Rr.step(g, 'С нижней трети черенка листья оборваны');
    },
    // the cutting goes in behind the glass wall: what is inside the glass is seen through it
    3: () => {
      const c = cutting(60, 98, 84, { bare: 2, s: 0.26 });
      return Rr.step(Rr.glass(60, 104, 44, 56, { level: 0.72, inside: c.svg }), 'Черенок в стакане: нижние узлы под водой');
    },
    4: () => {
      const c = cutting(40, 98, 84, { bare: 2, s: 0.26 });
      const under = Rr.roots(40, c.nodes[0][1], 14, 6, { seed: 4 }) + Rr.roots(40, c.nodes[1][1], 10, 4, { seed: 7 }) + c.svg;
      let g = Rr.glass(40, 104, 44, 56, { level: 0.72, inside: under });
      g += Rr.drop(98, 34, 1.5) + ill.label(117, 62, '2–3 дня', 'end');
      return Rr.step(g, 'Белые корешки на узлах в воде; воду меняют каждые 2–3 дня');
    },
    5: () => {
      const c = cutting(56, 80, 62, { bare: 2, s: 0.24 });
      let g = ill.pot(56, 84, 56, 24) + c.svg + Rr.bag(56, 82, 78, 76);
      return Rr.step(g, 'Укоренённый черенок в горшке под пакетом');
    }
  };
  illustrate('cut', n => (CUT[n] || CUT[1])(), Object.keys(CUT));
