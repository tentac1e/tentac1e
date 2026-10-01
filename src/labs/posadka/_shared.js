  /* @use props */
  /* Pictures of the Planting chapter: the steps of sowing (data-ill="sow:1…9"), of saving a pot of basil
     from the shop (shop:1…7 and shop:hero, the split), and the places to grow it (place:<id>, B.PLACES). */
  const Fp = ill.F, qp = ill.q, R = props;
  const paperP = R.paper, stepP = R.step;
  // a small basil plant of a few leaf pairs, standing on (x, y)
  const young = (x, y, h, pairs, o = {}) => R.sprout(x, y, h, Object.assign({ pairs, s: o.s || 1.25 }, o));

  /* ---------- sowing ---------- */
  const SOW = {
    1: () => {
      const t = R.tray(46, 102, 76, { cells: 3, perlite: true, wet: true });
      return stepP(R.bag(98, 102, 34, 46, { kind: 'paper' }) + `<ellipse cx="98" cy="57" rx="14" ry="3" fill="${Fp('soil-d')}"/>` + t.svg +
        [36, 46, 56].map(x => `<path d="M${x} 78q-4 -6 0 -12q4 -6 0 -12" stroke="${Fp('glass-d')}" stroke-width="1.5" fill="none" opacity=".7" stroke-linecap="round"/>`).join(''), 'Кассета с лёгким грунтом и перлитом');
    },
    2: () => {
      // a cell cut open: the seed lies half a centimetre under the surface
      const x0 = 18, x1 = 74, top = 52, rnd = ill.rng(4);
      let g = `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="50" fill="${Fp('soil')}"/>`;
      for (let i = 0; i < 26; i++) g += `<circle cx="${qp(x0 + 3 + rnd() * (x1 - x0 - 6))}" cy="${qp(top + 4 + rnd() * 44)}" r="${qp(0.7 + rnd() * 0.9)}" fill="${Fp(rnd() < 0.35 ? 'perlite' : 'soil-d')}"/>`;
      g += `<path d="M${x0} ${top}V102H${x1}V${top}" fill="none" stroke="${Fp('plastic')}" stroke-width="4"/>`;
      g += R.seed(36, top + 9, 20, true) + R.seed(56, top + 8, -30, true);
      g += `<g class="ill-scale"><path d="M${x0 - 7} ${top}V${top + 9}M${x0 - 11} ${top}H${x0 - 3}M${x0 - 11} ${top + 9}H${x0 - 3}" fill="none" stroke="currentColor" stroke-width="1.6"/></g>`;
      g += ill.label(x0 - 6, top - 8, '0,5 см', 'start');
      g += R.sprayer(98, 102, 0.95, { dir: -1 });
      return stepP(g, 'Семена под тонким слоем грунта и распылитель');
    },
    3: () => {
      const t = R.tray(52, 104, 84, { cells: 3, wet: true });
      return stepP(t.svg + t.tops.map(([x, y]) => R.seed(x - 4, y, 20, true) + R.seed(x + 5, y + 1, -40, true)).join('') + R.lid(52, 98, 88, 40) + R.thermo(106, 102, 44, 0.7) + ill.label(112, 24, '22–25 °C', 'end'), 'Кассета под прозрачной крышкой и термометр');
    },
    4: () => {
      const t = R.tray(60, 104, 92, { cells: 3, wet: true });
      return stepP(R.lamp(60, 14, 84, { reach: 60 }) + t.svg + t.tops.map(([x, y], i) => R.sprout(x - 5, y, 16 + i, { s: 1.05 }) + R.sprout(x + 6, y + 1, 14 + i, { s: 1, lean: 2 })).join(''), 'Всходы под лампой');
    },
    5: () => {
      const t = R.tray(30, 104, 44, { cells: 2, wet: true });
      const ys = R.cupSoil(104, 46);
      return stepP(t.svg + t.tops.map(([x, y]) => R.sprout(x, y, 18, { pairs: 1, s: 1 })).join('') +
        // the lifted seedling with its roots, on its way to a cup of its own
        R.roots(56, 54, 14, 5, { seed: 3, spread: 0.6 }) + R.sprout(56, 54, 20, { pairs: 1, s: 1 }) + R.arrow(46, 30, 84, 40, 12) +
        R.cup(94, 104, 34, 46, { roots: true }) + R.sprout(94, ys + 1, 12, { pairs: 1, s: 1 }), 'Сеянец пересаживают в свой стакан, заглубляя до семядолей');
    },
    6: () => {
      let g = `<rect x="10" y="96" width="100" height="9" rx="3" fill="${Fp('plastic-hi')}"/><rect x="13" y="96" width="94" height="4" rx="1.5" fill="${Fp('water-c')}"/>`;
      [28, 60, 92].forEach((x, i) => { const ys = R.cupSoil(98, 38); g += R.cup(x, 98, 26, 38) + young(x, ys, 30 + i * 2, 2, { s: 1.15, lean: 3 }); });
      g += `<path d="M24 24A12 6 0 1 0 40 20" class="ill-arrow"/><path class="ill-arrow-head" d="M40 20l-6 -3l1 6z"/>`;
      return stepP(g, 'Стаканы с рассадой в поддоне с водой: полив снизу');
    },
    7: () => {
      const ys = R.cupSoil(104, 40);
      return stepP(R.cup(54, 104, 34, 40) + young(54, ys, 64, 4, { s: 1.35, cut: 2 }) + R.scissors(80, 30, 200, 0.9, 0.8), 'Верхушку прищипывают над третьей парой листьев');
    },
    8: () => {
      let g = R.sun(100, 20, 9) + R.tree(30, 98, 0.95) + `<ellipse cx="34" cy="100" rx="30" ry="5" fill="${Fp('dark')}" opacity=".18"/>`;
      [44, 66].forEach((x, i) => { const ys = R.cupSoil(100, 26); g += R.cup(x, 100, 18, 26, { paper: true }) + young(x, ys, 24 + i * 3, 2, { s: 0.95 }); });
      g += ill.label(112, 52, '1–2 ч', 'end');
      return stepP(g, 'Рассада на улице в тени дерева', 100);
    },
    9: () => {
      let g = R.bed(4, 116, 92, { mulch: true });
      [30, 88].forEach((x, i) => { g += young(x, 93, 48 + i * 4, 3, { s: 1.15 }); });
      g += R.dim(30, 88, 22, '25–30 см');
      return stepP(g, 'Рассада на грядке через 25–30 см, полита и замульчирована', 94);
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

  /* ---------- places ---------- */
  const W = 320, H = 150;
  const placeP = (body, label, ground = 132) => ill.svg(W, H, paperP(W, H) + `<path data-bg d="M0 ${ground}H${W}V${H - 14}Q${W} ${H} ${W - 14} ${H}H14Q0 ${H} 0 ${H - 14}Z" fill="${Fp('bg-2')}"/>` + body, label);
  const basilBush = (x, y, h = 60, o = {}) => ill.bush(Object.assign({ x, y, h, nodes: 3, leaf: 0.3, spread: 0.9, seed: 4 }, o));
  const tomato = (x, y, h = 110) => {
    let g = `<path d="M${x + 8} ${y}V${y - h}" stroke="${Fp('wood')}" stroke-width="3"/><path d="M${x} ${y}Q${x + 6} ${y - h * 0.35} ${x - 2} ${y - h * 0.6}T${x + 4} ${y - h}" stroke="${Fp('stem')}" stroke-width="3" fill="none"/>`;
    [0.25, 0.45, 0.65, 0.85].forEach((t, i) => { const yy = y - h * t, sd = i % 2 ? 1 : -1; g += ill.leaf({ x: x + 1, y: yy, a: sd * 70, s: 0.32, tone: 'deep', wide: 0.75, seed: 3 + i, petiole: 6 }); if (i < 3) g += [0, 1, 2].map(k => `<circle cx="${qp(x - sd * (8 + k * 6))}" cy="${qp(yy + 10 + (k % 2) * 4)}" r="${4.2 - k * 0.5}" fill="${Fp(i === 2 ? 'lime' : 'tomato')}"/>`).join(''); });
    return g;
  };
  const PLACE = {
    sill: () => placeP(R.window(138, 102, 148, 92, { sun: true, rays: true, radiator: true }) + ill.pot(110, 102, 40, 26) + basilBush(110, 96, 56) + ill.pot(166, 102, 34, 22) + ill.ballBush({ x: 166, y: 96, r: 26, n: 46, leaf: 0.14, tone: 'deep', seed: 3 }) + R.lamp(282, 34, 56, { reach: 50 }) + ill.label(314, 104, 'досветка', 'end'), 'Подоконник: южное окно, батарея под ним, зимой лампа', 148),
    balcony: () => {
      let g = R.sun(282, 26, 12) + R.balcony(20, 300, 128, { box: [60, 200] });
      [84, 130, 176].forEach((x, i) => { g += basilBush(x, 64, 48, { leaf: 0.26, seed: 5 + i }); });
      g += ill.pot(250, 126, 46, 30) + basilBush(250, 120, 58, { seed: 9 }) + [0, 1, 2].map(i => `<path d="M${14 + i * 6} ${40 + i * 12}q20 -6 40 0" stroke="${Fp('glass-d')}" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>`).join('');
      return placeP(g, 'Балкон: ящик с кустами на перилах и ветер', 132);
    },
    garden: () => {
      let g = R.sun(290, 26, 13) + R.bed(14, 306, 122, { mulch: true, depth: 20 });
      [80, 160, 240].forEach((x, i) => { g += basilBush(x, 123, 70, { leaf: 0.34, seed: 3 + i }); });
      g += R.dim(80, 160, 26, '25–30 см');
      return placeP(g, 'Грядка: кусты через 25–30 см, мульча', 122);
    },
    greenhouse: () => {
      let g = R.greenhouse(160, 132, 270, 124, { vent: true }) + tomato(80, 132, 100) + tomato(240, 132, 104);
      [130, 190].forEach((x, i) => { g += basilBush(x, 132, 54, { seed: 6 + i }); });
      g += R.sun(296, 22, 10);
      return placeP(g, 'Теплица: базилик между томатами, форточка открыта', 132);
    },
    hydro: () => {
      let g = R.lamp(160, 18, 200, { reach: 80 }) + R.tank(160, 136, 180, 50, { pots: [-0.6, 0, 0.6] });
      [-0.6, 0, 0.6].forEach((k, i) => { g += basilBush(160 + k * 90, 82, 50, { leaf: 0.27, seed: 4 + i }); });
      return placeP(g, 'Гидропоника: корни в растворе, сверху лампа', 136);
    }
  };
  illustrate('place', id => (PLACE[id] || PLACE.sill)(), Object.keys(PLACE));
