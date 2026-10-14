/* Гид по базилику — живые модели главы «Посадка». Файл собирает scripts/build.py из src/labs/posadka/ — правьте там */
(() => {
  'use strict';
  const { register, illustrate, api: h } = window.BasilScience;
  const S = window.BasilScene;
  const { $, $$, clamp, lerp, fmt, fmt0, esc } = h;
  const NS = 'http://www.w3.org/2000/svg';
  const r1 = v => Math.round(v * 10) / 10;
  const pct = v => `${fmt0(v * 100)} %`;
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const set = (root, id, html) => { const e = $('#' + id, root); if (e) e.innerHTML = html; };
  const doyToday = () => { const t = new Date(); return Math.round((t - new Date(t.getFullYear(), 0, 0)) / 864e5); };
  const doyLabel = n => { const d = new Date(2023, 0, n); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
  const citiesChips = (id, lat) => h.chipsHtml(id, 'Город', h.CITIES.map(([l, n]) => [l, n]), lat);

  const { micro, ill, props, agro } = window.BasilLibs;
  window.BasilScience.styleFor("posadka", "/* window */\n.win-room { fill: color-mix(in srgb, var(--surface-2) 70%, transparent); }\n.win-light { fill: var(--sun-light); }\n.win-ray { stroke: var(--sun-disc); stroke-width: 1.3; opacity: .45; stroke-dasharray: 5 6; }\n.win-sun { fill: var(--sun-disc); filter: drop-shadow(0 0 10px var(--sun-disc)); }\n.win-wall { fill: var(--line-strong); }\n.win-glass { fill: var(--sci-phys); opacity: .45; }\n.win-sill { fill: var(--ink-3); opacity: .6; }\n.win-pot { fill: var(--clay); }\n.win-leaf { fill: var(--leaf); }\n\n.win-tag { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1; }\n/* gdd: the bars are shared with the pesto model (src/css/lab/06-lab-tools.css) */\n/* germination */\n.germ-fig { margin: 0; display: grid; gap: 6px; }\n.germ-anim { width: 100%; max-width: 280px; height: auto; border-radius: 16px; background: color-mix(in srgb, var(--sci-phys-soft) 70%, transparent); }\n.germ-soil { fill: var(--soil); opacity: .85; }\n.germ-coat { fill: var(--germ-coat); }\n.germ-gel { fill: var(--germ-gel); stroke: color-mix(in srgb, var(--sci-phys) 40%, transparent); stroke-width: 1; transform-origin: 0 0; }\n.germ-root { fill: none; stroke: var(--root); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 40; stroke-dashoffset: 40; }\n.germ-hypo { fill: none; stroke: var(--stem); stroke-width: 3.2; stroke-linecap: round; stroke-dasharray: 60; stroke-dashoffset: 60; }\n.germ-coty ellipse { fill: var(--leaf); transform-origin: 0 0; }\n.germ-coty { transform-box: fill-box; }\n.germ-anim .germ-gel { animation: g-gel var(--dur, 6s) var(--ease-float) infinite; }\n.germ-anim .germ-root { animation: g-root var(--dur, 6s) ease-out infinite; }\n.germ-anim .germ-hypo { animation: g-hypo var(--dur, 6s) ease-out infinite; }\n.germ-anim .germ-coty { animation: g-coty var(--dur, 6s) var(--ease-float) infinite; }\n@keyframes g-gel { 0%, 8% { scale: .3; opacity: 0; } 25%, 88% { scale: 1; opacity: 1; } 100% { scale: 1; opacity: 0; } }\n@keyframes g-root { 0%, 30% { stroke-dashoffset: 40; } 55%, 92% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; opacity: 0; } }\n@keyframes g-hypo { 0%, 50% { stroke-dashoffset: 60; } 75%, 92% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; opacity: 0; } }\n@keyframes g-coty { 0%, 70% { opacity: 0; scale: .2; } 82%, 92% { opacity: 1; scale: 1; } 100% { opacity: 0; } }\n.germ-anim.is-stopped * { animation: none !important; }\n.germ-anim.is-stopped .germ-gel { opacity: 0; }\n.germ-phase { margin: 0; font-size: .84rem; color: var(--ink-3); }\n\n/* shade */\n.rfr { display: grid; gap: 6px; font: 500 .7rem/1.2 var(--font-mono); }\n.rfr i { position: relative; height: 12px; border-radius: 6px; background: linear-gradient(90deg, #B8312A, #6E1F2B); }\n.rfr i::after { content: \"\"; position: absolute; top: -4px; bottom: -4px; left: var(--p, 50%); width: 4px; margin-left: -2px; border-radius: 2px; background: var(--ink); box-shadow: 0 0 0 2px var(--surface); transition: left .4s var(--ease-float); }\n.rfr-r { color: var(--danger); }\n.rfr-fr { color: var(--ink-3); text-align: right; }\n.shade-stage .lab-plant { max-width: 320px; }\n\n/* perched water */\n.per-soil { fill: var(--soil); opacity: .78; }\n.per-drain { fill: color-mix(in srgb, var(--clay) 25%, var(--surface)); }\n.per-pebble { fill: var(--clay); opacity: .8; }\n.per-water { fill: var(--water-fill); }\n.per-wave { fill: none; stroke: var(--water-line); stroke-width: 2; }\n.per-pot { fill: none; stroke: var(--clay); stroke-width: 5; stroke-linejoin: round; }\n.per-rim { fill: var(--clay-rim); }\n.per-lead { stroke: var(--line-strong); stroke-width: 1; stroke-dasharray: 2 3; }\n.tick.is-water { fill: var(--water-line); font-weight: 700; }\n\n/* roots */\n.roots-svg { width: 100%; max-width: 250px; height: auto; }\n.rt-glass { fill: color-mix(in srgb, var(--surface-2) 50%, transparent); stroke: var(--glass-edge); stroke-width: 3; stroke-linejoin: round; }\n.rt-water { fill: var(--water-fill); }\n.rt-wl { stroke: var(--water-line); stroke-width: 1.5; }\n.rt-stem { fill: none; stroke: var(--stem); stroke-width: 5; stroke-linecap: round; }\n.rt-node { fill: var(--pl-a); }\n.rt-root { fill: none; stroke: var(--root); stroke-width: 2.2; stroke-linecap: round; }\n\n");
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
        [36, 46, 56].map(x => `<path d="M${x} 78q-4 -6 0 -12q4 -6 0 -12" stroke="${Fp('glass-d')}" stroke-width="1.5" fill="none" opacity=".7" stroke-linecap="round"/>`).join(''), 'Кассета с лёгким грунтом и перлитом');
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
      return stepP(g, 'Семена под тонким слоем грунта и распылитель');
    },
    3: () => {
      const t = R.tray(52, 104, 84, { cells: 3, wet: true });
      return stepP(t.svg + t.tops.map(([x, y]) => R.seed(x - 4, y, 20, true) + R.seed(x + 5, y + 1, -40, true)).join('') + R.lid(52, 98, 88, 40) + R.thermo(106, 102, 44, 0.7) + ill.label(112, 24, '22–25 °C', 'end'), 'Кассета под прозрачной крышкой и термометр');
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
        R.cup(94, 104, 34, 46, { roots: true }) + R.sprout(94, ys + 1, 12, { pairs: 1, s: 1 }), 'Сеянец пересаживают в свой стакан, заглубляя до семядолей');
    },
    6: () => {
      let g = `<rect x="10" y="96" width="100" height="9" rx="3" fill="${Fp('plastic-hi')}"/><rect x="13" y="96" width="94" height="4" rx="1.5" fill="${Fp('water-c')}"/>`;
      [28, 60, 92].forEach((x, i) => { const ys = R.cupSoil(98, 38); g += R.cup(x, 98, 26, 38) + young(x, ys, 30 + i * 2, 2, { s: 1.15, lean: 3 }); });
      g += `<path d="M24 24A12 6 0 1 0 40 20" class="ill-arrow"/><path class="ill-arrow-head" d="M40 20l-6 -3l1 6z"/>`;
      return stepP(g, 'Стаканы с рассадой в поддоне с водой: полив снизу');
    },
    7: () => {
      const ys = R.cupSoil(104, 40);
      return stepP(R.cup(54, 104, 34, 40) + young(54, ys, 64, 4, { s: 1.35, cut: 2 }) + R.scissors(80, 30, 200, 0.9, 0.8), 'Верхушку прищипывают над третьей парой листьев');
    },
    8: () => {
      let g = R.sun(100, 20, 9) + R.tree(30, 98, 0.95) + `<ellipse cx="34" cy="100" rx="30" ry="5" fill="${Fp('dark')}" opacity=".18"/>`;
      [44, 66].forEach((x, i) => { const ys = R.cupSoil(100, 26); g += R.cup(x, 100, 18, 26, { paper: true }) + young(x, ys, 24 + i * 3, 2, { s: 0.95 }); });
      g += ill.label(112, 52, '1–2 ч', 'end');
      return stepP(g, 'Рассада на улице в тени дерева', 100);
    },
    9: () => {
      let g = R.bed(4, 116, 92, { mulch: true });
      [30, 88].forEach((x, i) => { g += young(x, 93, 48 + i * 4, 3, { s: 1.15 }); });
      g += R.dim(30, 88, 22, '25–30 см');
      return stepP(g, 'Рассада на грядке через 25–30 см, полита и замульчирована', 94);
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
      return ill.svg(360, 150, paperP(360, 150) + `<path data-bg d="M0 136H360V136Q360 150 346 150H14Q0 150 0 136Z" fill="${Fp('bg-2')}"/>` + g, 'Магазинный горшок с десятками сеянцев делят на три-четыре горшка');
    },
    1: () => {
      const inner = ill.leaf({ x: 6, y: 34, a: 6, s: 0.62, under: true, aphids: 6, seed: 5 });
      return stepP(R.shopPot(42, 104, 54, 36) + R.crowd(42, 68, 46, 12, { h: 40, seed: 3 }) + R.lens(88, 46, 24, inner, 130), 'Под лупой — нижняя сторона листа с тлёй');
    },
    2: () => stepP([22, 60, 98].map(x => ill.pot(x, 82, 32, 22, { wet: true })).join('') + [22, 60, 98].map(x => R.drop(x, 112, 0.7)).join(''), 'Три горшка с влажным грунтом: лишняя вода уходит через отверстия'),
    3: () => {
      let g = R.rootball(56, 100, 84, 40, { split: 3, seed: 6 });
      [24, 56, 88].forEach((x, i) => { g += R.crowd(x, 62 + (i % 2 ? 3 : -2), 18, 4, { h: 34, seed: 9 + i }); });
      g += R.knife(76, 22, 120, 0.7);
      return stepP(g, 'Ком корней разломан на три части');
    },
    4: () => {
      let g = `<ellipse cx="50" cy="104" rx="34" ry="5" fill="${Fp('plastic-hi')}"/><ellipse cx="50" cy="103" rx="28" ry="3" fill="${Fp('water-c')}"/>` + ill.pot(50, 76, 46, 26, { wet: true }) + R.crowd(50, 70, 20, 4, { h: 40, seed: 5 });
      g += R.can(98, 46, 0.6, { dir: -1, stream: 18 });
      return stepP(g, 'Посаженный куст полит до стока воды в поддон', 106);
    },
    5: () => {
      let g = R.window(56, 84, 84, 70, { curtain: true, sun: true });
      g += ill.pot(42, 84, 26, 16) + R.crowd(42, 78, 12, 3, { h: 30, seed: 4 }) + R.thermo(106, 100, 40, 0.55) + ill.label(114, 114, '20–24 °C', 'end');
      return stepP(g, 'Горшок на окне за лёгкой занавеской, в полутени', 92);
    },
    6: () => stepP(ill.pot(46, 82, 40, 24) + young(46, 75, 60, 3, { s: 1.3, cut: 1 }) + R.scissors(72, 22, 200, 0.85, 0.8) + R.bowl(96, 104, 34) + ill.leaf({ x: 96, y: 86, a: 70, s: 0.16, seed: 4 }) + ill.leaf({ x: 92, y: 88, a: -50, s: 0.14, seed: 5 }), 'Верхушки срезают над второй-третьей парой листьев'),
    7: () => {
      let g = R.bottle(24, 102, 22, 54, { fill: 'box' }) + `<path d="M44 74h22l-3 22h-16z" fill="${Fp('glass')}" stroke="${Fp('glass-d')}" stroke-width="1"/><path d="M45.6 85h18.8l-1.5 11h-15.8z" fill="${Fp('box')}" opacity=".85"/>`;
      g += ill.pot(92, 80, 40, 24) + R.crowd(92, 73, 18, 4, { h: 40, seed: 8 }) + ill.label(56, 114, '½ дозы');
      return stepP(g, 'Половинная доза удобрения в мерном колпачке');
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
      return placeP(g, 'Балкон: ящик с кустами на перилах и ветер', 132);
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
      return placeP(g, 'Гидропоника: корни в растворе, сверху лампа', 136);
    }
  };
  illustrate('place', id => (PLACE[id] || PLACE.sill)(), Object.keys(PLACE));

  /* The steps of rooting a cutting (data-ill="cut:1…5"), the tab «Черенки» */
  const Fr = ill.F, qr = ill.q, Rr = props;
  // a cutting standing on (x, y): its own stem with pairs of leaves; bare — the lower nodes without leaves
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
      return Rr.step(g, 'С нижней трети черенка листья оборваны');
    },
    // the cutting goes in behind the glass wall: what is inside the glass is seen through it
    3: () => {
      const c = cutting(60, 98, 84, { bare: 2, s: 0.26 });
      return Rr.step(Rr.glass(60, 104, 44, 56, { level: 0.72, inside: c.svg }), 'Черенок в стакане: нижние узлы под водой');
    },
    4: () => {
      const c = cutting(40, 98, 84, { bare: 2, s: 0.26 });
      const under = Rr.roots(40, c.nodes[0][1], 14, 6, { seed: 4 }) + Rr.roots(40, c.nodes[1][1], 10, 4, { seed: 7 }) + c.svg;
      let g = Rr.glass(40, 104, 44, 56, { level: 0.72, inside: under });
      g += Rr.drop(98, 34, 1.5) + ill.label(117, 62, '2–3 дня', 'end');
      return Rr.step(g, 'Белые корешки на узлах в воде; воду меняют каждые 2–3 дня');
    },
    5: () => {
      const c = cutting(56, 80, 62, { bare: 2, s: 0.24 });
      let g = ill.pot(56, 84, 56, 24) + c.svg + Rr.bag(56, 82, 78, 76);
      return Rr.step(g, 'Укоренённый черенок в горшке под пакетом');
    }
  };
  illustrate('cut', n => (CUT[n] || CUT[1])(), Object.keys(CUT));

  register('window', el => {
    el.innerHTML = h.head('Солнце в полдень', 'Выберите город и месяц. Разрез показывает, как полуденные лучи входят в окно, выходящее на юг.') +
      `<div class="lab-controls">${citiesChips('lab-win-city', 55.8)}${h.rangeHtml('lab-win-m', 'Месяц', 1, 12, 1, 12)}</div>
       <div class="lab-chart" id="lab-win-ch"></div>` +
      h.readHtml([['Высота солнца', 'lab-win-h'], ['Длина дня', 'lab-win-d'], ['Поток на горизонталь', 'lab-win-e'], ['Пятно света на полу', 'lab-win-p']]);
    let lat = 55.8, m = 12;
    const ch = h.chart($('#lab-win-ch', el), {
      label: 'Разрез окна с полуденными лучами солнца',
      h: w => clamp(w * 0.46, 220, 300),
      draw(w, hh) {
        const n = h.DOY21[m - 1];
        const alt = h.noonSun(lat, n);
        const floorY = hh - 26, wallX = Math.round(w * 0.3);
        const sc = Math.min((w - wallX - 16) / 4.2, (floorY - 14) / 3);
        const X = v => r1(wallX + v * sc), Y = v => r1(floorY - v * sc);
        let s = `<rect class="win-room" x="${wallX}" y="${Y(3)}" width="${r1(4.2 * sc)}" height="${r1(3 * sc)}"/>`;
        if (alt > 0) {
          const t = Math.tan(alt * Math.PI / 180);
          const a = 0.85 / t, b = 2.2 / t;
          s += `<clipPath id="lab-win-clip"><rect x="${wallX}" y="${Y(3)}" width="${r1(4.2 * sc)}" height="${r1(3 * sc)}"/></clipPath>`;
          s += `<polygon class="win-light" clip-path="url(#lab-win-clip)" points="${wallX},${Y(2.2)} ${wallX},${Y(0.85)} ${X(a)},${floorY} ${X(b)},${floorY}"/>`;
          const rad = alt * Math.PI / 180;
          for (let k = 0; k < 5; k++) {
            const y0 = 0.95 + k * 0.3;
            const len = Math.min(wallX / Math.max(Math.cos(rad), 1e-3), Y(y0) / Math.max(Math.sin(rad), 1e-3));
            s += `<line class="win-ray" x1="${r1(wallX - Math.cos(rad) * len)}" y1="${r1(Y(y0) - Math.sin(rad) * len)}" x2="${wallX}" y2="${Y(y0)}"/>`;
          }
          const sx = clamp(wallX - Math.cos(rad) * wallX * 0.72, 18, wallX - 20), sy = clamp(Y(1.5) - Math.tan(rad) * (wallX - sx), 18, floorY - 18);
          s += `<circle class="win-sun" cx="${r1(sx)}" cy="${r1(sy)}" r="13"/>`;
          const tag = `${fmt0(alt)}°`, tw = tag.length * 7 + 12;
          s += `<rect class="win-tag" x="${r1(sx - tw / 2)}" y="${r1(sy + 18)}" width="${r1(tw)}" height="17" rx="8.5"/><text class="tick" x="${r1(sx)}" y="${r1(sy + 30)}" text-anchor="middle">${tag}</text>`;
        } else {
          s += `<text class="band-lbl" x="${r1(wallX / 2)}" y="${Y(1.6)}" text-anchor="middle">солнце</text><text class="band-lbl" x="${r1(wallX / 2)}" y="${Y(1.6) + 15}" text-anchor="middle">не встаёт</text>`;
        }
        s += `<rect class="win-wall" x="${wallX - 10}" y="${Y(3)}" width="10" height="${r1(0.8 * sc)}"/>`;
        s += `<rect class="win-wall" x="${wallX - 10}" y="${Y(0.85)}" width="10" height="${r1(0.85 * sc)}"/>`;
        s += `<rect class="win-glass" x="${wallX - 6}" y="${Y(2.2)}" width="3" height="${r1(1.35 * sc)}"/>`;
        s += `<rect class="win-sill" x="${wallX - 12}" y="${Y(0.85) - 4}" width="${r1(0.32 * sc + 12)}" height="5" rx="2"/>`;
        const px = X(0.16), py = Y(0.85) - 4, ps = sc * 0.1;
        s += `<path class="win-pot" d="M${r1(px - ps)} ${r1(py - ps * 1.2)} L${r1(px + ps)} ${r1(py - ps * 1.2)} L${r1(px + ps * 0.75)} ${py} L${r1(px - ps * 0.75)} ${py} Z"/>`;
        s += `<path class="win-leaf" d="M${px} ${r1(py - ps * 1.2)} q ${r1(-ps * 1.4)} ${r1(-ps * 0.8)} ${r1(-ps * 0.5)} ${r1(-ps * 2.4)} q ${r1(ps * 1.6)} ${r1(ps * 0.7)} ${r1(ps * 0.5)} ${r1(ps * 2.4)} q ${r1(ps * 0.2)} ${r1(-ps * 1.8)} ${r1(ps * 1.3)} ${r1(-ps * 2)} q ${r1(ps * 0.2)} ${r1(ps * 1.6)} ${r1(-ps * 1.3)} ${r1(ps * 2)} Z"/>`;
        s += `<line class="axis" x1="${wallX - 12}" x2="${X(4.2)}" y1="${floorY}" y2="${floorY}"/>`;
        [1, 2, 3, 4].forEach(v => { s += `<text class="tick" x="${X(v)}" y="${floorY + 16}" text-anchor="middle">${v} м</text>`; });
        return s;
      }
    });
    const upd = () => {
      const n = h.DOY21[m - 1];
      const alt = h.noonSun(lat, n);
      set(el, 'lab-win-h', alt > 0 ? `${fmt0(alt)}°` : 'ниже горизонта');
      set(el, 'lab-win-d', `${fmt(h.dayLength(lat, n))} ч`);
      set(el, 'lab-win-e', alt > 0 ? `${fmt0(Math.sin(alt * Math.PI / 180) * 100)} % от солнца в зените` : '0');
      if (alt <= 0) set(el, 'lab-win-p', 'нет');
      else {
        const t = Math.tan(alt * Math.PI / 180);
        const a = 0.85 / t, b = 2.2 / t;
        set(el, 'lab-win-p', a > 4.2 ? 'лучи уходят дальше 4 м' : `${fmt(a)}–${b > 4.2 ? '4+' : fmt(b)} м от стены`);
      }
      ch.redraw();
    };
    h.bindPick(el, 'lab-win-city', v => { lat = +v; upd(); });
    h.bindRange(el, 'lab-win-m', v => `21 ${MONTHS_GEN[v - 1]}`, v => { m = v; upd(); });
    upd();
  });

  register('daylen', el => {
    el.innerHTML = h.head('Длина дня за год', 'Астрономический расчёт с поправкой на рефракцию. Коснитесь графика, чтобы увидеть любой день.') +
      `<div class="lab-controls">${citiesChips('lab-dl-city', 55.8)}${h.rangeHtml('lab-dl-lat', 'Широта', 40, 70, 0.1, 55.8)}</div>
       <div class="lab-chart" id="lab-dl-ch"></div>` +
      h.readHtml([['Сегодня', 'lab-dl-t'], ['Самый длинный день', 'lab-dl-max'], ['Самый короткий', 'lab-dl-min']]);
    let lat = 55.8, hover = null;
    const today = doyToday();
    const series = () => { const a = []; for (let n = 1; n <= 365; n += 2) a.push([n, h.dayLength(lat, n)]); return a; };
    const MSTART = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
    const ch = h.chart($('#lab-dl-ch', el), {
      label: 'Длина дня по дням года',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [1, 365], y: [0, 24], xticks: w > 520 ? MSTART.map(v => v + 14) : [15, 105, 196, 288], fx: v => MONTHS[MSTART.findIndex(s => s + 14 === v)] || MONTHS[Math.floor((v - 1) / 30.5)], yticks: [0, 6, 12, 18, 24], ylab: 'часов',
          hbands: [{ y0: 14, y1: 16, cls: 'is-good', label: 'нужно под лампой' }],
          series: [{ pts: series(), cls: 's1', area: true }],
          marker: { x: today, dots: [{ y: h.dayLength(lat, today), cls: 's1' }] }, hover });
        let s = P.s + `<text class="tick" x="${P.X(today)}" y="${P.p.t - 8}" text-anchor="middle">сегодня</text>`;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 16, w, [doyLabel(hover), `${fmt(h.dayLength(lat, hover))} ч`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [1, 365], y: [0, 24] });
        hover = kind === 'leave' ? null : clamp(Math.round(P.inv(x)), 1, 365);
        ch.redraw();
      }
    });
    const upd = () => {
      set(el, 'lab-dl-t', `${fmt(h.dayLength(lat, today))} ч`);
      set(el, 'lab-dl-max', `${fmt(h.dayLength(lat, 172))} ч`);
      set(el, 'lab-dl-min', `${fmt(h.dayLength(lat, 355))} ч`);
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-dl-lat', v => `${fmt(v)}° с. ш.`, v => { lat = v; city.set(''); upd(); });
    const city = h.bindPick(el, 'lab-dl-city', v => { lat = +v; rng.input.value = v; $('#lab-dl-lat-v', el).textContent = `${fmt(+v)}° с. ш.`; upd(); });
    upd();
  });

  register('gdd', el => {
    el.innerHTML = h.head('Сколько ждать урожая', 'Базовая температура 10 °C; при 22 °C первая срезка — примерно через 7 недель. Выше 30 °C модель прибавки не даёт.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-gdd-t', 'Средняя температура суток', 12, 32, 0.5, 17)}</div>
       <div class="gdd-bars" id="lab-gdd-bars"></div>` +
      h.readHtml([['Градусо-дней в сутки', 'lab-gdd-d'], ['До первой срезки', 'lab-gdd-w'], ['По сравнению с 22 °C', 'lab-gdd-r']]);
    const weeks = T => T <= 10.5 ? Infinity : 588 / (7 * (Math.min(T, 30) - 10));
    const upd = T => {
      const wk = weeks(T), ref = weeks(22);
      const max = 20;
      $('#lab-gdd-bars', el).innerHTML = [['Ваше лето', wk, 's1'], ['Эталон, 22 °C', ref, 's3']].map(([n, v, c]) =>
        `<div class="gdd-row"><span>${n}</span><i class="${c}" style="--w:${clamp(v / max, 0.02, 1) * 100}%"></i><b>${isFinite(v) ? fmt(v) + ' нед.' : '—'}</b></div>`).join('');
      set(el, 'lab-gdd-d', fmt(Math.max(0, Math.min(T, 30) - 10)));
      set(el, 'lab-gdd-w', isFinite(wk) ? `≈ ${fmt(wk)} нед.` : 'рост стоит');
      set(el, 'lab-gdd-r', isFinite(wk) ? (wk > ref ? `в ${fmt(wk / ref)} раза медленнее` : `в ${fmt(ref / wk)} раза быстрее`) : '—');
    };
    h.bindRange(el, 'lab-gdd-t', v => `${fmt(v)} °C`, upd);
    upd(17);
  });

  /* @use agro */
  register('germ', el => {
    const { Tb, th } = agro.GERM;
    const days = agro.germDays;
    el.innerHTML = h.head('Сколько ждать всходов', 'Модель термального времени: семени нужно набрать около 52 градусо-дней выше базовых 10,5 °C. Выше 30 °C скорость снова падает.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-germ-t', 'Температура грунта', 8, 40, 0.5, 24)}
          <figure class="germ-fig" aria-hidden="true">
            <svg class="germ-anim" id="lab-germ-anim" viewBox="0 0 200 130">
              <rect class="germ-soil" x="0" y="72" width="200" height="58"/>
              <g class="germ-seed" transform="translate(100 96)">
                <circle class="germ-gel" r="20"/>
                <path class="germ-root" d="M4 4 C 8 16 2 26 6 34"/>
                <path class="germ-hypo" d="M-2 -4 C -6 -18 4 -30 0 -44"/>
                <g class="germ-coty" transform="translate(0 -44)"><ellipse cx="-9" cy="-3" rx="9" ry="4.5" transform="rotate(-18 -9 -3)"/><ellipse cx="9" cy="-3" rx="9" ry="4.5" transform="rotate(18 9 -3)"/></g>
                <ellipse class="germ-coat" rx="7" ry="4.4"/>
              </g>
            </svg>
            <figcaption class="germ-phase" id="lab-germ-phase"></figcaption>
          </figure>
        </div>
        <div class="lab-chart" id="lab-germ-ch"></div>
      </div>` +
      h.readHtml([['Корешок проклюнется', 'lab-germ-r'], ['Всходы над землёй', 'lab-germ-e'], ['Скорость от максимума', 'lab-germ-v']]);
    let T = 24, hover = null;
    const pts = f => { const a = []; for (let t = 11; t <= 41.5; t += 0.25) { const d = f(t); if (d <= 30) a.push([t, d]); } return a; };
    const ch = h.chart($('#lab-germ-ch', el), {
      label: 'Дни до прорастания в зависимости от температуры',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [8, 40], y: [0, 30], xticks: [10, 15, 20, 25, 30, 35, 40], yticks: [0, 10, 20, 30], fx: v => v + '°', ylab: 'дней', xlab: 'температура грунта, °C',
          vbands: [{ x0: 22, x1: 25, cls: 'is-good', label: 'совет гида' }],
          series: [{ pts: pts(t => days(t) * 1.8), cls: 's3', dash: true, label: 'всходы', labelAt: 16, ldy: -10 }, { pts: pts(days), cls: 's1', label: 'корешок', labelAt: 14.5, ldy: 16 }],
          marker: isFinite(days(T)) && days(T) <= 30 ? { x: T, dots: [{ y: days(T), cls: 's1' }].concat(days(T) * 1.8 <= 30 ? [{ y: days(T) * 1.8, cls: 's3' }] : []) } : { x: T },
          hover: hover });
        let s = P.s;
        if (hover != null) {
          const d = days(hover);
          s += h.tip(P.X(hover), P.p.t + 4, w, [`${fmt(hover)} °C`, isFinite(d) ? `корешок ${fmt(d)} дн.` : 'не прорастёт', isFinite(d) ? `всходы ${fmt(d * 1.8)} дн.` : '']);
        }
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [8, 40], y: [0, 30] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 8, 40);
        if (kind === 'set') { rng.set(v); hover = null; } else if (kind === 'hover') hover = v; else hover = null;
        ch.redraw();
      }
    });
    const anim = $('#lab-germ-anim', el);
    const upd = () => {
      const d = days(T);
      const ok = isFinite(d) && d < 60;
      set(el, 'lab-germ-r', ok ? `через ${fmt(d)} дн.` : 'не прорастёт');
      set(el, 'lab-germ-e', ok ? `через ${fmt(d * 1.8)} дн.` : '—');
      set(el, 'lab-germ-v', ok ? pct((th / 19.5) / d) : '0');
      anim.classList.toggle('is-stopped', !ok || h.reduce.matches);
      anim.style.setProperty('--dur', `${clamp(ok ? d * 0.9 : 6, 2.6, 14)}s`);
      set(el, 'lab-germ-phase', !ok ? (T <= Tb ? 'Слишком холодно: ферменты почти стоят, семя лежит сухим.' : 'Слишком жарко: белки зародыша повреждаются.') : 'Набухание → пробуждение ферментов → корешок → петля стебелька и семядоли');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-germ-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    upd();
  });

  register('shade', el => {
    el.innerHTML = h.head('Тень соседей', 'Чем больше сеянцев в горшке, тем меньше красного и больше дальнего красного света доходит до каждого. Модель показывает реакцию одного сеянца.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-shade-n', 'Сеянцев в горшке', 1, 30, 1, 20)}
          <div class="rfr" aria-hidden="true"><span class="rfr-r">красный 660&nbsp;нм</span><i id="lab-shade-bar"></i><span class="rfr-fr">дальний красный 730&nbsp;нм</span></div>
        </div>
        <div class="lab-stage shade-stage"><svg class="lab-plant" viewBox="-130 -290 260 310" aria-label="Сеянец базилика среди соседей" role="img"><g id="lab-shade-ghosts" class="ghosts"></g><line class="soil-line" x1="-130" x2="130" y1="2" y2="2"/><g id="lab-shade-g"></g></svg></div>
      </div>` +
      h.readHtml([['Отношение R:FR', 'lab-shade-r'], ['Длина стебля', 'lab-shade-s'], ['Размер листьев', 'lab-shade-l']]);
    const g = $('#lab-shade-g', el), ghosts = $('#lab-shade-ghosts', el);
    const spec = st => S.basil({ nodes: 5, scale: 1.25, stretch: st, w: 5.5 });
    const plant = S.Plant(g, spec(1), { grown: true, leafScale: 0.62, sway: 0.7 });
    const pos = Array.from({ length: 16 }, (_, i) => ((i * 97) % 31) / 31 * 220 - 110);
    const upd = n => {
      const rfr = 0.2 + 1.0 * Math.exp(-(n - 1) / 8);
      const st = 1 + 1.3 * (1 - (rfr - 0.2) / 1.0);
      plant.setSpec(spec(st));
      const k = Math.min(n - 1, 16);
      let s = '';
      for (let i = 0; i < k; i++) {
        const x = r1(pos[i]), hgt = r1((70 + (i % 5) * 16) * st * 0.95);
        if (Math.abs(x) < 16) continue;
        s += `<path d="M${x} 2 C ${r1(x + 4)} ${r1(-hgt * 0.4)} ${r1(x - 3)} ${r1(-hgt * 0.7)} ${r1(x + 2)} ${-hgt}"/><ellipse cx="${r1(x - 9)}" cy="${r1(-hgt * 0.62)}" rx="11" ry="5"/><ellipse cx="${r1(x + 10)}" cy="${r1(-hgt * 0.8)}" rx="10" ry="4.5"/>`;
      }
      ghosts.innerHTML = s;
      set(el, 'lab-shade-r', fmt(rfr, 2));
      set(el, 'lab-shade-s', `× ${fmt(st)}`);
      set(el, 'lab-shade-l', `−${fmt0((1 - 1 / Math.pow(st, 0.35)) * 100)} %`);
      $('#lab-shade-bar', el).style.setProperty('--p', `${clamp((rfr - 0.2) / 1.0, 0, 1) * 100}%`);
    };
    h.bindRange(el, 'lab-shade-n', v => String(v), upd);
    upd(20);
  });

  register('perched', el => {
    const SUBS = [['peat', 'Торф', 5], ['univ', 'Универсальный', 4], ['perl', 'С перлитом', 2.2], ['coco', 'Кокос', 3.5]];
    el.innerHTML = h.head('Где стоит вода в горшке', 'Высота насыщенного слоя задаётся порами грунта. Меняйте горшок, грунт и слой керамзита.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-per-h', 'Высота горшка', 8, 30, 1, 14)}<div class="lab-seg-wrap"><span class="lab-label">Грунт</span>${h.chipsHtml('lab-per-s', 'Грунт', SUBS.map(s => [s[0], s[1]]), 'univ')}</div>
          <div class="lab-seg-wrap"><span class="lab-label">Дренаж</span><div class="chips-row lab-chips"><button class="chip" type="button" id="lab-per-d" aria-pressed="false">Слой керамзита 3&nbsp;см</button></div></div>
        </div>
        <div class="lab-chart" id="lab-per-ch"></div>
      </div>` +
      h.readHtml([['Насыщенный слой', 'lab-per-z'], ['Доля грунта без воздуха', 'lab-per-p'], ['Воздушная зона', 'lab-per-a']]);
    let H = 14, sub = 'univ', drain = false;
    const pwt = () => SUBS.find(s => s[0] === sub)[2];
    const ch = h.chart($('#lab-per-ch', el), {
      label: 'Разрез горшка с насыщенным водой слоем',
      h: w => clamp(w * 0.66, 260, 400),
      draw(w, hh) {
        const sc = Math.min((hh - 34) / 31, (w - 150) / 22);
        const cx = r1((w - 110) / 2), base = hh - 16;
        const topW = 18 * sc, botW = 13 * sc, ph = H * sc;
        const xAt = (y, side) => cx + side * lerp(botW, topW, y / H) / 2;
        const Y = v => r1(base - v * sc);
        const poly = (y0, y1) => `${r1(xAt(y0, -1))},${Y(y0)} ${r1(xAt(y0, 1))},${Y(y0)} ${r1(xAt(y1, 1))},${Y(y1)} ${r1(xAt(y1, -1))},${Y(y1)}`;
        const d = drain ? Math.min(3, H - 2) : 0;
        const sat = Math.min(pwt(), H - d);
        let s = `<polygon class="per-soil" points="${poly(d, H - 0.6)}"/>`;
        if (drain) {
          s += `<polygon class="per-drain" points="${poly(0, d)}"/>`;
          for (let i = 0; i < 26; i++) {
            const yy = 0.3 + (i % 3) * (d - 0.6) / 2.2, xx = lerp(-0.42, 0.42, ((i * 37) % 26) / 25);
            s += `<circle class="per-pebble" cx="${r1(cx + xx * lerp(botW, topW, yy / H))}" cy="${Y(yy)}" r="${r1(sc * 0.42)}"/>`;
          }
        }
        s += `<polygon class="per-water" points="${poly(d, d + sat)}"/>`;
        s += `<path class="per-wave" d="M${r1(xAt(d + sat, -1))} ${Y(d + sat)} q ${r1(sc * 1.5)} -4 ${r1(sc * 3)} 0 t ${r1(sc * 3)} 0 t ${r1(sc * 3)} 0 t ${r1(sc * 3)} 0 t ${r1(sc * 3)} 0"/>`;
        s += `<polygon class="per-pot" points="${poly(0, H)}"/>`;
        s += `<rect class="per-rim" x="${r1(cx - topW / 2 - 6)}" y="${r1(Y(H) - 6)}" width="${r1(topW + 12)}" height="10" rx="3"/>`;
        const lx = r1(cx + topW / 2 + 16);
        const lab = (y, txt, cls) => `<line class="per-lead" x1="${r1(xAt(y, 1) + 4)}" x2="${lx - 4}" y1="${Y(y)}" y2="${Y(y)}"/><text class="tick ${cls || ''}" x="${lx}" y="${Y(y) + 4}">${txt}</text>`;
        s += lab(d + sat + (H - 0.6 - d - sat) / 2, 'воздух и вода');
        s += lab(d + sat / 2, `вода ${fmt(sat)} см`, 'is-water');
        if (drain) s += lab(d / 2, 'керамзит сухой');
        s += `<text class="tick" x="${r1(cx)}" y="${hh - 2}" text-anchor="middle">${H} см</text>`;
        return s;
      }
    });
    const upd = () => {
      const d = drain ? Math.min(3, H - 2) : 0;
      const soil = H - 0.6 - d;
      const sat = Math.min(pwt(), soil);
      set(el, 'lab-per-z', `${fmt(sat)} см${drain ? ', поднят на 3 см' : ''}`);
      set(el, 'lab-per-p', pct(sat / soil));
      set(el, 'lab-per-a', `верхние ${fmt(Math.max(0, soil - sat))} см`);
      ch.redraw();
    };
    h.bindRange(el, 'lab-per-h', v => `${v} см`, v => { H = v; upd(); });
    h.bindPick(el, 'lab-per-s', v => { sub = v; upd(); });
    const db = $('#lab-per-d', el);
    db.addEventListener('click', () => { drain = !drain; db.setAttribute('aria-pressed', String(drain)); upd(); });
    upd();
  });

  /* @use agro */
  register('roots', el => {
    el.innerHTML = h.head('Черенок в стакане', 'Модель укоренения: корешки появляются из погружённых узлов и растут примерно на полсантиметра в день в тепле.', true) +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage"><svg class="roots-svg" id="lab-rt-svg" viewBox="0 0 220 260" role="img" aria-label="Черенок базилика в стакане с водой"></svg></div>
        <div class="lab-controls">${h.rangeHtml('lab-rt-d', 'День', 0, 21, 1, 10)}${h.segHtml('lab-rt-t', 'Комната', [['18', '18 °C'], ['22', '22 °C'], ['26', '26 °C']], '22')}</div>
      </div>` + h.readHtml([['Длина корней', 'lab-rt-l'], ['Что делать', 'lab-rt-v', 'is-wide']]);
    const svg = $('#lab-rt-svg', el);
    let day = 10, temp = 22;
    const ON = { 18: agro.rootsOnset(18), 22: agro.rootsOnset(22), 26: agro.rootsOnset(26) }, RATE = { 18: agro.rootsRate(18), 22: agro.rootsRate(22), 26: agro.rootsRate(26) };
    const ROOTS = [[-1, 0.9, 0], [1, 1, 1], [-1, 0.7, 2], [1, 0.8, 0.5], [-1, 0.6, 1.5], [1, 0.65, 2.5]];
    const leaf = (x, y, a, s) => `<use href="#pl-leaf" class="pl-leaf" style="fill:url(#pl-grad)" transform="translate(${x} ${y}) rotate(${a}) scale(${s})"/>`;
    const upd = () => {
      const L = Math.max(0, (day - ON[temp]) * RATE[temp]);
      let s = `<path class="rt-glass" d="M52 60 L60 246 Q61 252 68 252 H152 Q159 252 160 246 L168 60"/>`;
      s += `<path class="rt-water" d="M55.6 120 L60.6 245 Q61.4 249.5 68 249.5 H152 Q158.6 249.5 159.4 245 L164.4 120 Z"/>`;
      s += `<path class="rt-stem" d="M110 236 C 108 180 112 120 110 34"/>`;
      [[176, 1], [206, 0.8]].forEach(([y, k]) => {
        s += `<circle class="rt-node" cx="110" cy="${y}" r="3.2"/>`;
        ROOTS.forEach(([side, len, lag], i) => {
          const l = Math.max(0, L - lag * 0.25) * len * k * 11;
          if (l < 1) return;
          const cx = 110 + side * (6 + i * 1.5), ex = 110 + side * Math.min(44, l * 0.55 + 6), ey = y + Math.min(250 - y - 4, l * 0.85);
          s += `<path class="rt-root" d="M110 ${y} Q ${r1(cx + side * l * 0.3)} ${r1(y + l * 0.2)} ${r1(ex)} ${r1(ey)}"/>`;
        });
      });
      s += leaf(110, 96, -58, 0.42) + leaf(110, 96, 58, 0.42) + leaf(111, 64, -30, 0.3) + leaf(111, 64, 30, 0.3) + leaf(110, 38, -8, 0.18) + leaf(110, 38, 12, 0.16);
      s += `<line class="rt-wl" x1="56" x2="164" y1="120" y2="120"/>`;
      svg.innerHTML = s;
      set(el, 'lab-rt-l', L > 0 ? `${fmt(L)} см` : 'пока нет');
      set(el, 'lab-rt-v', day < ON[temp] - 2 ? 'Ждите: у основания идёт перестройка клеток, снаружи ничего не видно. Меняйте воду раз в 2–3 дня.' : L < 0.3 ? 'Вот-вот: в узлах набухают белые бугорки — зачатки корней.' : L < 2 ? 'Корешки растут. Сажать рано: подождите, пока будет 2–5 см.' : L <= 5 ? 'Пора сажать в грунт! 3–4 дня держите в тени под пакетом.' : 'Корни длинные и начинают путаться: сажайте, аккуратно расправив их.');
    };
    h.bindRange(el, 'lab-rt-d', v => `${v}-й`, v => { day = v; upd(); });
    h.bindPick(el, 'lab-rt-t', v => { temp = +v; upd(); });
    upd();
  });
})();
