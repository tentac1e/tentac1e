  /* @use props */
  /* Pictures of the Propagation chapter: the steps of rooting a cutting (data-ill="cut:1…5") and of saving
     your own seed (seed:1…6). */
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
      g += `<g class="ill-scale"><path d="M98 ${qr(ny + 6)}V12M94 ${qr(ny + 6)}H102M94 12H102" fill="none" stroke="currentColor" stroke-width="1.6"/></g><text class="ill-lbl" x="110" y="${my}" text-anchor="middle" transform="rotate(-90 110 ${my})">8–12 см</text>`;
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
      const c = cutting(44, 98, 84, { bare: 2, s: 0.26 });
      const under = Rr.roots(44, c.nodes[0][1], 14, 6, { seed: 4 }) + Rr.roots(44, c.nodes[1][1], 10, 4, { seed: 7 }) + c.svg;
      let g = Rr.glass(44, 104, 44, 56, { level: 0.72, inside: under });
      g += Rr.drop(98, 40, 1.5) + ill.label(116, 76, '2–3 дня', 'end');
      return Rr.step(g, 'Белые корешки на узлах в воде; воду меняют каждые 2–3 дня');
    },
    5: () => {
      const c = cutting(56, 80, 62, { bare: 2, s: 0.24 });
      let g = ill.pot(56, 84, 56, 24) + c.svg + Rr.bag(56, 82, 78, 76);
      return Rr.step(g, 'Укоренённый черенок в горшке под пакетом');
    }
  };
  illustrate('cut', n => (CUT[n] || CUT[1])(), Object.keys(CUT));

  const SEED = {
    1: () => Rr.step(ill.pot(52, 104, 52, 22) + ill.bush({ x: 52, y: 98, h: 64, nodes: 3, leaf: 0.3, spread: 0.85, flowers: 'white', seed: 5 }) + Rr.bee(98, 34, 1.1), 'Здоровый куст в цвету'),
    2: () => {
      let g = ill.pot(40, 104, 46, 20) + ill.bush({ x: 40, y: 98, h: 50, nodes: 2, leaf: 0.28, spread: 0.8, seed: 4 });
      g += Rr.seedSpike(40, 48, 36, { flowers: 'white' }) + Rr.bag(41, 50, 26, 42, { kind: 'mesh' });
      g += Rr.seedSpike(96, 104, 64, { flowers: 'purple' }) + Rr.bee(100, 30, 1);
      return Rr.step(g, 'Цветонос под сеточкой: пчела не принесёт пыльцу другого сорта');
    },
    3: () => Rr.step(Rr.seedSpike(34, 104, 86, { ripe: 0.55, flowers: 'white' }) + Rr.lens(80, 54, 30, Rr.calyx(0, 18, 0.95), 125), 'Нижние чашечки побурели, внутри — чёрные семена'),
    4: () => {
      let g = Rr.seedSpike(48, 60, 50, { dry: true }) + Rr.seedSpike(60, 60, 44, { dry: true }) + Rr.seedSpike(72, 60, 52, { dry: true });
      g += Rr.bag(60, 104, 62, 50, { kind: 'paper' });
      return Rr.step(g, 'Срезанные кисти досыхают в бумажном пакете');
    },
    5: () => {
      const rnd = ill.rng(6);
      let g = Rr.bowl(60, 104, 84, { seeds: true, chaff: true }) + `<g transform="rotate(-70 60 40)">${Rr.seedSpike(60, 40, 50, { dry: true })}</g>`;
      for (let i = 0; i < 7; i++) g += Rr.seed(46 + rnd() * 28, 50 + rnd() * 16, rnd() * 180);
      return Rr.step(g, 'Сухие кисти растирают над миской');
    },
    6: () => Rr.step(Rr.envelope(52, 98, 58, 72, { seeds: false }) + [0, 1, 2, 3, 4].map(i => Rr.seed(92 + (i % 3) * 7, 96 - Math.floor(i / 3) * 6, i * 50)).join(''), 'Семена в подписанном бумажном конверте')
  };
  illustrate('seed', n => (SEED[n] || SEED[1])(), Object.keys(SEED));
