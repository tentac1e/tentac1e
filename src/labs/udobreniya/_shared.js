  /* @use ills */
  /* Pictures of the Fertilizers chapter: what the lack of every element looks like (data-ill="def:<symbol>",
     B.ELEMENTS). The plant shows where the symptom starts — on the old lower leaves when the element moves
     inside the plant, on the young top ones when it does not; next to it, one such leaf close up. */
  const Fd = ill.F, qd = ill.q;
  // old: the two lower pairs; young: the top pair and the growing tip
  const OLD = i => i <= 1, YOUNG = (i, n) => i >= n - 1;
  const DEF = {
    N: { where: 'old', plant: (i) => (i === 0 ? { chl: 'uniform', k: 0.95 } : i === 1 ? { chl: 'uniform', k: 0.55 } : { pale: true }), leaf: { chl: 'uniform', k: 0.95 } },
    P: { where: 'old', small: true, plant: (i) => (OLD(i) ? { purple: i ? 0.5 : 0.9 } : {}), leaf: { purple: 0.9, tone: 'deep' } },
    K: { where: 'old', plant: (i) => (OLD(i) ? { necro: 'edge', k: i ? 0.45 : 0.85, curl: i ? 0 : 0.3 } : {}), leaf: { necro: 'edge', k: 0.8, curl: 0.3 } },
    Ca: { where: 'young', plant: (i, n) => (YOUNG(i, n) ? { curl: 0.8, tip: 0.8 } : {}), leaf: { curl: 0.8, tip: 0.7, necro: 'edge', k: 0.2, wide: 0.85 } },
    Mg: { where: 'old', plant: (i) => (OLD(i) ? { chl: 'interveinal', k: i ? 0.5 : 0.95 } : {}), leaf: { chl: 'interveinal', k: 0.9, necro: 'spots', seed: 8 } },
    S: { where: 'young', plant: (i, n) => (YOUNG(i, n) ? { chl: 'uniform', k: 0.75 } : i === n - 2 ? { chl: 'uniform', k: 0.3 } : {}), leaf: { chl: 'uniform', k: 0.75 } },
    Fe: { where: 'young', plant: (i, n) => (YOUNG(i, n) ? { chl: 'interveinal', k: 1 } : i === n - 2 ? { chl: 'interveinal', k: 0.45 } : {}), leaf: { chl: 'interveinal', k: 1 } },
    Mn: { where: 'young', plant: (i, n) => (YOUNG(i, n) ? { chl: 'mottle', stipple: 40 } : {}), leaf: { chl: 'mottle', stipple: 110, seed: 6 } },
    Zn: { where: 'top', rosette: true, plant: (i, n) => (YOUNG(i, n) ? { s: 0.2, wide: 0.55, chl: 'interveinal', k: 0.5 } : {}), leaf: { wide: 0.55, s: 0.62, chl: 'interveinal', k: 0.55 } },
    B: { where: 'young', deadTip: true, plant: (i, n) => (i === n ? { color: ill.mix('brown-d', 'brown', 0.5), curl: 0.6 } : i === n - 1 ? { curl: 0.5, bubbly: 1, wide: 0.8 } : {}), leaf: { curl: 0.5, bubbly: 1, wide: 0.8, tip: 0.35 } },
    Cu: { where: 'young', plant: (i, n, side) => (YOUNG(i, n) ? { tone: 'deep', a: side * (i === n ? 150 : 128) } : {}), leaf: { tone: 'deep', curl: 0.45 }, droop: true },
    Mo: { where: 'old', plant: (i) => (OLD(i) ? { pale: true, chl: 'mottle', curl: 0.55 } : {}), leaf: { pale: true, chl: 'mottle', curl: 0.65, seed: 5 } }
  };
  const WORD = { old: 'старый лист', young: 'молодой лист', top: 'верхушка' };
  function defPic(sym) {
    const d = DEF[sym] || DEF.N, w = 260, hh = 140, base = 116, H = d.small ? 58 : 72, n = 4;
    let g = `<rect width="${w}" height="${hh}" rx="14" fill="${Fd('bg')}"/><path d="M0 128H${w}V126Q${w} ${hh} ${w - 14} ${hh}H14Q0 ${hh} 0 126Z" fill="${Fd('bg-2')}"/>`;
    g += ill.pot(66, 124, 56, 20);
    g += ill.plant({ x: 66, y: base + 2, h: H, nodes: n, leafScale: d.rosette ? 0.82 : 0.78, seed: 5, leaf: d.plant });
    // where it starts: a dashed ring on the plant and a line to the close-up
    const zy = d.where === 'old' ? base - H * 0.42 : base - H * 0.98, zr = d.where === 'old' ? [46, 24] : [34, 20];
    g += `<ellipse class="ill-zone" cx="66" cy="${qd(zy)}" rx="${zr[0]}" ry="${zr[1]}"/><path class="ill-zone" d="M${66 + zr[0]} ${qd(zy)}L${150} ${qd(zy < 70 ? 60 : 84)}"/>`;
    // the close-up; a limp leaf (copper) hangs from its stalk
    g += ill.leaf(Object.assign(d.droop ? { x: 166, y: 38, a: 135, s: 0.9 } : { x: 196, y: 128, a: 6, s: 0.92 }, { seed: 4 }, d.leaf));
    g += ill.label(194, 18, WORD[d.where]);
    const el = ((window.BASIL && window.BASIL.ELEMENTS) || []).find(e => e.sym === sym);
    return ill.svg(w, hh, g, el ? `Нехватка элемента «${el.name}»: ${el.def}` : '');
  }
  illustrate('def', sym => defPic(sym), () => Object.keys(DEF));
