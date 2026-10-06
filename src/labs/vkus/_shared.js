  /* @use props */
  /* Pictures of the chapter «Вкус и кухня», tab «Хранение и заготовки»: the eight ways to keep basil (data-ill="store:<kind>") — a bouquet in
     water, the fridge, frozen in oil, blanched, dried, salt, oil, pesto. */
  const Fu = ill.F, qu = ill.q, Ru = props;
  const W = 180, H = 100;
  const storeP = (body, label) => ill.svg(W, H, `<rect data-bg width="${W}" height="${H}" rx="14" fill="${Fu('bg')}"/><path data-bg d="M0 88H${W}V86Q${W} ${H} ${W - 14} ${H}H14Q0 ${H} 0 86Z" fill="${Fu('bg-2')}"/>` + body, label);
  // a cut sprig: a stem with pairs of leaves; tone and look as in ills.leaf
  function cutSprig(x, y, len, a = 0, s = 0.26, o = {}) {
    const r = a * Math.PI / 180, ex = x + Math.sin(r) * len, ey = y - Math.cos(r) * len;
    let g = `<path d="M${qu(x)} ${qu(y)}L${qu(ex)} ${qu(ey)}" stroke="${Fu('stem')}" stroke-width="2" stroke-linecap="round"/>`;
    [0.45, 0.75, 1].forEach((t, i) => { const px = x + (ex - x) * t, py = y + (ey - y) * t; [-1, 1].forEach(sd => { g += ill.leaf(Object.assign({ x: px, y: py, a: a + sd * (i === 2 ? 24 : 58), s: s * (i === 2 ? 0.45 : 1 - i * 0.18), seed: 3 + i * 2 + sd + (o.seed || 0), petiole: 4 }, o)); }); });
    return g;
  }
  const STORE = {
    bouquet: () => {
      const stems = [-10, -3, 4, 11];
      const under = stems.map(dx => `<path d="M${90 + dx * 0.5} 86L${90 + dx * 0.9} 56" stroke="${Fu('stem')}" stroke-width="2" opacity=".85"/>`).join('');
      let g = Ru.glass(90, 88, 40, 50, { level: 0.62, inside: under });
      stems.forEach((dx, i) => { g += cutSprig(90 + dx * 0.9, 56, 26 + (i % 2) * 6, dx * 1.6, 0.22, { seed: i * 5 }); });
      g += Ru.bag(90, 60, 92, 50);
      return storeP(g, 'Пучок базилика в стакане воды под свободным пакетом');
    },
    fridge: () => {
      const f = Ru.fridge(90, 90, 120, 82);
      let g = f.svg;
      // on the shelf: leaves rolled in a dry paper towel, in a bag
      g += `<rect x="40" y="${qu(f.shelves[0] - 14)}" width="54" height="13" rx="6" fill="${Fu('paper')}" stroke="${Fu('paper-d')}" stroke-width="1"/>` + ill.leaf({ x: 92, y: f.shelves[0] - 7, a: 80, s: 0.16, seed: 4 }) + ill.leaf({ x: 92, y: f.shelves[0] - 8, a: 110, s: 0.13, seed: 5 });
      g += `<rect x="36" y="${qu(f.shelves[0] - 17)}" width="64" height="17" rx="7" fill="${Fu('film')}" opacity=".5" stroke="${Fu('glass-d')}" stroke-width=".8"/>`;
      g += Ru.thermo(58, f.shelves[1] - 2, 22, 0.55);
      return storeP(g, 'Листья в сухом полотенце и пакете на полке холодильника');
    },
    freeze: () => {
      let g = Ru.iceTray(80, 84, 110) + Ru.snow(156, 26, 11);
      // one cube already out
      g += `<rect x="140" y="62" width="20" height="20" rx="4" fill="${Fu('oil')}" stroke="${Fu('glass-d')}" stroke-width="1"/><ellipse cx="147" cy="70" rx="3" ry="1.6" fill="${Fu('leaf-deep')}"/><ellipse cx="153" cy="75" rx="2.6" ry="1.4" fill="${Fu('leaf-deep')}"/>`;
      return storeP(g, 'Формочка для льда с кубиками из базилика в масле');
    },
    blanch: () => {
      let g = Ru.saucepan(48, 88, 56, { steam: true }) + ill.leaf({ x: 48, y: 52, a: 170, s: 0.2, seed: 3 });
      g += Ru.arrow(84, 52, 110, 52, 10) + ill.label(97, 34, '3–5 с');
      g += Ru.bowl(140, 88, 64) + [126, 140, 152].map((x, i) => `<rect x="${x - 6}" y="${60 - (i % 2) * 2}" width="12" height="10" rx="2" fill="${Fu('ice')}" stroke="${Fu('glass-d')}" stroke-width="1" transform="rotate(${(i - 1) * 14} ${x} 65)"/>`).join('') + ill.leaf({ x: 142, y: 70, a: 70, s: 0.18, seed: 6 });
      return storeP(g, 'Листья на секунды в кипяток, затем в ледяную воду');
    },
    dry: () => {
      let g = `<path d="M10 14H170" stroke="${Fu('wood-d')}" stroke-width="3" stroke-linecap="round"/>`;
      g += Ru.bunch(38, 18, 0.95, { dry: true, seed: 3 }) + Ru.bunch(84, 18, 0.85, { dry: true, seed: 8 });
      g += Ru.thermo(156, 86, 34, 0.75) + ill.label(174, 40, '30–35 °C', 'end');
      return storeP(g, 'Пучки сушатся вниз листьями в тени');
    },
    salt: () => {
      let g = Ru.jar(70, 88, 46, 64, { fill: 'leaf-deep', level: 0.82, bands: 4 }) + ill.label(124, 50, '1 : 4', 'start');
      g += `<path d="M104 86C108 70 136 70 148 86Z" fill="${Fu('salt')}" stroke="${Fu('frame-d')}" stroke-width="1"/>` + [0, 1, 2, 3, 4].map(i => `<rect x="${112 + i * 7}" y="${80 - (i % 2) * 3}" width="3" height="3" fill="${Fu('frame-d')}" opacity=".45"/>`).join('');
      return storeP(g, 'Банка: слои соли и листьев базилика');
    },
    oil: () => {
      let g = Ru.bottle(70, 88, 34, 70, { fill: 'oil', label: false });
      g += ill.leaf({ x: 64, y: 82, a: -10, s: 0.2, seed: 3, tone: 'deep' }) + ill.leaf({ x: 74, y: 76, a: 20, s: 0.18, seed: 4, tone: 'deep' });
      g += Ru.snow(132, 48, 15);
      return storeP(g, 'Масло с базиликом держат только в холоде');
    },
    pesto: () => {
      let g = Ru.jar(62, 88, 46, 58, { fill: 'pesto', level: 0.78, layer: 5 }) + Ru.mortar(132, 88, 56);
      return storeP(g, 'Банка песто под слоем масла и ступка');
    }
  };
  illustrate('store', k => (STORE[k] || STORE.bouquet)(), Object.keys(STORE));
