  /* @use ills */
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
  const paper = (w, hh) => `<rect width="${w}" height="${hh}" rx="14" fill="${Fs('bg')}"/>`;

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
