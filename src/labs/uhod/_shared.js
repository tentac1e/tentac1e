  /* @use props */
  /* Pictures of the Care chapter, watering: when to water (the finger test) and how (under the root, the
     surplus out of the saucer) — data-ill="water:when|how"; too much and too little water side by side
     (water:over|under); a wick from a jar for a week away (water:wick). */
  const Fw = ill.F, qw = ill.q, Rw = props;
  const W = 180, H = 110;
  const waterP = (body, label, y = 98) => ill.svg(W, H, Rw.paper(W, H) + Rw.ground(y, W, H) + body, label);
  // a big pot cut open: dry soil on top (dry: how deep), damp below
  function potCut(x, y, w, h, dry) {
    const t = w / 2, b = w * 0.38, top = y - h, dy = top + 6 + dry, xb = (yy) => b + (t - b) * (y - yy) / h;
    let g = `<path d="M${qw(x - t)} ${qw(top)}H${qw(x + t)}L${qw(x + b)} ${qw(y)}H${qw(x - b)}Z" fill="${Fw('pot')}"/>`;
    g += `<path d="M${qw(x - xb(top + 6) + 4)} ${qw(top + 6)}H${qw(x + xb(top + 6) - 4)}L${qw(x + xb(dy) - 4)} ${qw(dy)}H${qw(x - xb(dy) + 4)}Z" fill="${Fw('soil')}"/>`;
    g += `<path d="M${qw(x - xb(dy) + 4)} ${qw(dy)}H${qw(x + xb(dy) - 4)}L${qw(x + b - 4)} ${qw(y - 4)}H${qw(x - b + 4)}Z" fill="${Fw('soil-d')}"/>`;
    g += `<rect x="${qw(x - t - 4)}" y="${qw(top - 4)}" width="${qw(w + 8)}" height="9" rx="3" fill="${Fw('pot-hi')}"/>`;
    return g;
  }
  const WATER = {
    when: () => {
      const dry = 12, top = 52;
      let g = potCut(80, 102, 92, 50, dry) + ill.plant({ x: 58, y: top + 6, h: 26, nodes: 2, leafScale: 0.42, seed: 4 });
      g += Rw.finger(98, top + 6 + dry - 3, 8, 0.8);
      g += `<g class="ill-scale"><path d="M136 ${top + 6}V${top + 6 + dry}M132 ${top + 6}H140M132 ${top + 6 + dry}H140" fill="none" stroke="currentColor" stroke-width="1.6"/></g>` + ill.label(150, top - 6, '1–2 см');
      return waterP(g, 'Палец в грунте: сверху сухо на 1–2 см — пора поливать');
    },
    how: () => {
      let g = `<ellipse cx="62" cy="98" rx="44" ry="6" fill="${Fw('plastic-hi')}"/><ellipse cx="62" cy="97" rx="36" ry="3.5" fill="${Fw('water-c')}"/>`;
      g += ill.pot(62, 68, 58, 26, { wet: true }) + ill.plant({ x: 56, y: 62, h: 30, nodes: 3, leafScale: 0.44, seed: 6 });
      g += Rw.can(120, 50, 0.7, { dir: -1, stream: 28 });
      g += ill.label(176, 96, '15 мин', 'end');
      return waterP(g, 'Полив под корень до стока в поддон; лишнюю воду сливают', 100);
    },
    over: () => {
      let g = `<ellipse cx="90" cy="98" rx="46" ry="6" fill="${Fw('plastic-hi')}"/><ellipse cx="90" cy="96" rx="40" ry="4" fill="${Fw('water-c')}"/>`;
      g += ill.pot(90, 66, 60, 28, { wet: true }) + ill.plant({ x: 88, y: 60, h: 40, nodes: 3, droop: 1, leafScale: 0.52, seed: 7, leaf: i => (i === 0 ? { chl: 'uniform', k: 0.9 } : {}) });
      g += [[132, 30, -12], [146, 46, 18], [40, 38, 8]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0C3 -5 9 -6 11 -3C8 0 3 1 0 0ZM0 0C-3 -5 -9 -6 -11 -3C-8 0 -3 1 0 0Z" fill="${Fw('wing')}" stroke="${Fw('gnat')}" stroke-width=".4"/><ellipse cx="0" cy="2" rx="1.5" ry="3.8" fill="${Fw('gnat')}"/></g>`).join('');
      return waterP(g, 'Перелив: грунт мокрый, листья вялые и желтеют снизу, мошки', 100);
    },
    under: () => {
      let g = ill.pot(90, 66, 60, 28) + ill.plant({ x: 88, y: 60, h: 40, nodes: 3, droop: 0.9, leafScale: 0.52, seed: 8, leaf: i => (i <= 1 ? { necro: 'edge', k: i ? 0.35 : 0.7, curl: 0.4 } : { curl: 0.3 }) });
      // dry soil comes away from the wall and cracks
      g += `<path d="M64 59L69 66M79 58L76 64M101 58L104 64M112 59L109 64" stroke="${Fw('crust')}" stroke-width="1.4" opacity=".8"/><path d="M61 57Q60 63 63 66" stroke="${Fw('dark')}" stroke-width="2.4" fill="none"/><path d="M119 57Q120 63 117 66" stroke="${Fw('dark')}" stroke-width="2.4" fill="none"/>`;
      g += Rw.sun(150, 22, 9);
      return waterP(g, 'Недолив: листья вялые с сухими краями, грунт отошёл от стенок', 100);
    },
    wick: () => {
      // the pot sits in the mouth of a jar of water; a cord from its drainage hole hangs into the water
      let g = ill.pot(90, 56, 58, 22) + ill.plant({ x: 88, y: 50, h: 28, nodes: 3, leafScale: 0.42, seed: 9 });
      g += Rw.jar(90, 102, 52, 48, { fill: 'water-c', level: 0.48, open: true });
      // the cord is the point of the picture: drawn over the glass, seen through it, not lost behind the water
      g += `<path d="M90 76Q85 86 91 97" stroke="${Fw('kraft-d')}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      return waterP(g, 'Горшок на банке с водой: фитиль из дренажного отверстия опущен в воду', 102);
    }
  };
  illustrate('water', k => (WATER[k] || WATER.when)(), Object.keys(WATER));
