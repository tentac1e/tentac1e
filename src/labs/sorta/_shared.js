  /* @use ills, props */
  /* Pictures of the Varieties chapter: a portrait of every type (data-ill="vtype:<id>") and a sprig of every
     variety (data-ill="sort:<n>", n — its place in BASIL.VARIETIES), drawn from what the data says about it:
     leaf colour and form, look of the blade (ruffle, teeth, bubbly, gloss, hairs) and flowers. */
  const VS = (window.BASIL && window.BASIL.VARIETIES) || [];
  const VT = (window.BASIL && window.BASIL.VARIETY_TYPES) || [];
  const Fs = ill.F;
  function lookOf(v) {
    const w = (v.look || '').split(' ');
    return {
      tone: ['green', 'deep', 'purple', 'lime', 'thai'].includes(v.leaf) ? v.leaf : 'green',
      wide: { wide: 1.2, normal: 1, narrow: 0.6, small: 0.92 }[v.shape] || 1,
      ruffle: w.includes('ruffle') ? 1 : 0,
      teeth: w.includes('teeth') ? 1 : 0,
      bubbly: w.includes('bubbly') ? (v.shape === 'wide' ? 1 : 0.5) : 0,
      gloss: w.includes('gloss') ? 1 : 0,
      hairs: w.includes('hairs'),
      flowers: v.flowers || null
    };
  }
  const blade = L => ({ tone: L.tone, wide: L.wide, ruffle: L.ruffle, teeth: L.teeth, bubbly: L.bubbly, gloss: L.gloss, hairs: L.hairs });
  const stemOf = L => (L.tone === 'purple' || L.tone === 'thai' ? 'stem-purple' : 'stem');
  const paper = (w, hh) => `<rect data-bg width="${w}" height="${hh}" rx="14" fill="${Fs('bg')}"/>`;

  // the cut tip of a shoot: three pairs of leaves, then the growing tip or a flower spike
  function sprig(L, x, y, hgt, s) {
    let g = `<path d="M${x} ${y}Q${x + 2} ${ill.q(y - hgt * 0.5)} ${x} ${ill.q(y - hgt)}" stroke="${Fs(stemOf(L))}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    [[0.2, 1, 64], [0.56, 0.78, 52], [0.86, 0.52, 38]].forEach(([t, k, ang], j) => {
      [-1, 1].forEach(side => { g += ill.leaf(Object.assign({ x, y: y - hgt * t, a: side * ang, s: s * k, seed: 3 + j * 2 + side, petiole: 6 }, blade(L))); });
    });
    if (L.flowers) g += ill.spike(x, y - hgt, hgt * 0.62, { flowers: L.flowers, stemColor: stemOf(L), bracts: stemOf(L), thin: true });
    else [-1, 1].forEach(side => { g += ill.leaf(Object.assign({ x, y: y - hgt, a: side * 24, s: s * 0.26, seed: 30 + side, petiole: 2 }, blade(L))); });
    return g;
  }

  /* ---------- a variety ---------- */
  function sortPic(n) {
    const v = VS[n] || VS[0], L = lookOf(v), w = 100, hh = 110;
    let body;
    if (v.shape === 'small') body = ill.ballBush({ x: 50, y: 106, r: /Пистоу/.test(v.name) ? 40 : 46, n: 80, leaf: 0.16, tone: L.tone, teeth: L.teeth, seed: 7 + n });
    else body = sprig(L, 50, 106, L.flowers ? 52 : 72, v.shape === 'wide' ? 0.42 : v.shape === 'narrow' ? 0.46 : 0.43);
    return ill.svg(w, hh, paper(w, hh) + body, `Как выглядит «${v.name}»`);
  }
  illustrate('sort', n => sortPic(+n || 0), () => VS.map((_, i) => i));

  /* ---------- a type: its typical bush in a pot ---------- */
  const lead = id => VS.find(v => v.type === id) || VS[0];
  const TYPE_PIC = {
    genovese: () => ill.bush(Object.assign({ x: 80, y: 123, h: 96, nodes: 3, leaf: 0.42, spread: 0.9, seed: 4 }, blade(lookOf(lead('genovese'))))),
    small: () => ill.ballBush({ x: 80, y: 123, r: 58, n: 130, leaf: 0.16, tone: 'deep', seed: 5 }),
    clove: () => ill.bush({ x: 80, y: 123, h: 78, nodes: 3, leaf: 0.4, spread: 0.9, teeth: 1, bubbly: 0.6, seed: 6 }),
    purple: () => ill.bush({ x: 80, y: 123, h: 92, nodes: 3, leaf: 0.4, spread: 0.9, tone: 'purple', gloss: 1, flowers: 'pink', seed: 7 }),
    thai: () => ill.bush({ x: 80, y: 123, h: 80, nodes: 3, leaf: 0.44, spread: 0.9, tone: 'thai', wide: 0.62, flowers: 'purple', seed: 8 }),
    citrus: () => ill.bush({ x: 80, y: 123, h: 80, nodes: 3, leaf: 0.42, spread: 0.9, tone: 'lime', wide: 0.6, flowers: 'white', seed: 9 }),
    sweet: () => ill.bush({ x: 80, y: 123, h: 92, nodes: 3, leaf: 0.4, spread: 0.9, tone: 'thai', flowers: 'purple', seed: 10 }),
    species: () => ill.bush({ x: 80, y: 123, h: 92, nodes: 3, leaf: 0.4, spread: 0.9, tone: 'deep', wide: 0.66, hairs: true, flowers: 'purple', seed: 11 })
  };
  function typePic(id) {
    const t = VT.find(x => x.id === id) || VT[0], w = 160, hh = 150;
    return ill.svg(w, hh, paper(w, hh) + ill.pot(80, 129, 54, 16) + (TYPE_PIC[t.id] || TYPE_PIC.genovese)(), `Типичный куст: ${t.name.toLowerCase()}`);
  }
  illustrate('vtype', id => typePic(id), () => VT.map(t => t.id));

  /* The steps of saving your own seed (data-ill="seed:1…6"), the tab «Свои семена» */
  const Rr = props;
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
