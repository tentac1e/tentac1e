  /* @use props */
  /* Pictures of the Hydroponics chapter: the steps of a Kratky jar (data-ill="hyd:k1…k5") and of a bucket with an
     air pump, DWC (hyd:d1…d5), the tab «Своими руками». The jar and the bucket are drawn cut open where it helps. */
  const Fh = ill.F, qh = ill.q, Rh = props;

  // a glass jar on (x, y), cut open: level 0–1 of the solution, a lid with a net cup (cup: false — none), roots
  // reaching down from the cup (len, px), air: the upper roots are in the air and covered in hairs
  function hjar(x, y, w = 50, h = 66, o = {}) {
    const t = w / 2, top = y - h, lv = o.level == null ? 0.6 : o.level, yl = y - 4 - (h - 16) * lv;
    let g = `<rect x="${qh(x - t)}" y="${qh(top + 6)}" width="${qh(w)}" height="${qh(h - 6)}" rx="7" fill="${Fh('glass')}" opacity=".5" stroke="${Fh('glass-d')}" stroke-width="1.2"/>`;
    if (lv > 0) g += `<path d="M${qh(x - t + 2)} ${qh(yl)}H${qh(x + t - 2)}V${qh(y - 7)}Q${qh(x + t - 2)} ${qh(y - 2)} ${qh(x + t - 7)} ${qh(y - 2)}H${qh(x - t + 7)}Q${qh(x - t + 2)} ${qh(y - 2)} ${qh(x - t + 2)} ${qh(y - 7)}Z" fill="${Fh('water-c')}" opacity=".95"/>`;
    if (o.wrap) {
      // foil round the jar, with a slit to see the level through
      const wy = top + 14, sx = x + t * 0.45;
      g += `<path d="M${qh(x - t)} ${qh(wy)}H${qh(x + t)}V${qh(y - 6)}Q${qh(x + t)} ${qh(y)} ${qh(x + t - 6)} ${qh(y)}H${qh(x - t + 6)}Q${qh(x - t)} ${qh(y)} ${qh(x - t)} ${qh(y - 6)}Z" fill="${Fh('metal')}"/>`;
      g += [0.25, 0.5, 0.75].map(k => `<path d="M${qh(x - t + 3)} ${qh(wy + (y - wy) * k)}l${qh(w * 0.2)} -3l${qh(w * 0.18)} 4" stroke="${Fh('metal-d')}" stroke-width=".8" fill="none" opacity=".6"/>`).join('');
      g += `<rect x="${qh(sx - 2.5)}" y="${qh(wy + 4)}" width="5" height="${qh(y - wy - 10)}" rx="2" fill="${Fh('glass')}" stroke="${Fh('metal-d')}" stroke-width=".8"/>`;
      if (lv > 0) g += `<rect x="${qh(sx - 1.6)}" y="${qh(Math.max(yl, wy + 5))}" width="3.2" height="${qh(y - 7 - Math.max(yl, wy + 5))}" rx="1.4" fill="${Fh('water-c')}"/>`;
    }
    if (o.roots) {
      const cy = top + 14, air = Math.max(0, yl - cy);
      g += Rh.roots(x, cy, o.roots, 7, { seed: o.seed || 5, spread: 0.55, w: 1.5 });
      if (o.air && air > 8) {
        // the air roots: short, fuzzy with root hairs, above the solution
        let d = '';
        for (let i = 0; i < 16; i++) { const yy = cy + 3 + (air - 6) * (i / 15), sd = i % 2 ? 1 : -1; d += `M${qh(x + sd * (2 + (i % 4)))} ${qh(yy)}l${qh(sd * (5 + (i % 3) * 2))} ${qh(1.5)}`; }
        g += `<path d="${d}" stroke="${Fh('root')}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      }
    }
    g += `<path d="M${qh(x - t + 5)} ${qh(top + 14)}V${qh(y - 10)}" stroke="${Fh('hi')}" stroke-width="2.4" opacity=".45" stroke-linecap="round"/>`;
    if (o.lid !== false) g += `<rect x="${qh(x - t - 2)}" y="${qh(top)}" width="${qh(w + 4)}" height="8" rx="2.5" fill="${Fh(o.lidColor || 'metal-d')}"/>`;
    if (o.cup !== false && o.lid !== false) g += hcup(x, top + 1, 18, o.cupH || 16, o);
    return { svg: g, yl, top };
  }
  // a net cup hanging from a lid at (x, y): its rim on y. o.fill: 'cube' (rock wool and expanded clay), 'clay'
  function hcup(x, y, w = 18, h = 16, o = {}) {
    const t = w / 2, b = t * 0.72;
    let g = `<path d="M${qh(x - t)} ${qh(y)}H${qh(x + t)}L${qh(x + b)} ${qh(y + h)}H${qh(x - b)}Z" fill="${Fh('plastic')}" opacity=".9"/>`;
    g += `<path d="M${qh(x - t * 0.5)} ${qh(y + 2)}V${qh(y + h - 1)}M${qh(x)} ${qh(y + 2)}V${qh(y + h - 1)}M${qh(x + t * 0.5)} ${qh(y + 2)}V${qh(y + h - 1)}M${qh(x - t * 0.9)} ${qh(y + h * 0.45)}H${qh(x + t * 0.9)}" stroke="${Fh('plastic-hi')}" stroke-width="1.1"/>`;
    if (o.fill === 'cube' || o.fill === 'clay') {
      if (o.fill === 'cube') g += `<rect x="${qh(x - 5)}" y="${qh(y - 6)}" width="10" height="${qh(h * 0.7)}" rx="1.5" fill="${Fh('straw')}" stroke="${Fh('kraft-d')}" stroke-width=".7"/>`;
      [[-7, -3], [-3.4, -5.5], [7, -3], [3.6, -5.6], [0, -7.2]].forEach(([dx, dy], i) => { if (o.fill === 'cube' && Math.abs(dx) < 4) return; g += `<circle cx="${qh(x + dx)}" cy="${qh(y + dy + 2)}" r="${3.2 - (i % 2) * 0.4}" fill="${Fh('pot')}" stroke="${Fh('pot-d')}" stroke-width=".6"/>`; });
    }
    return g;
  }
  // a young basil standing in the cup: rim on (x, y)
  const hsprout = (x, y, hgt, pairs, s = 1.2) => Rh.sprout(x, y - 5, hgt, { pairs, s });

  const HYD = {
    k1: () => {
      const j = hjar(52, 104, 52, 70, { level: 0, wrap: true, cup: false, lid: false });
      // the roll of foil the jar is wrapped in
      const roll = `<rect x="86" y="80" width="26" height="22" rx="4" fill="${Fh('metal')}" stroke="${Fh('metal-d')}" stroke-width="1"/><ellipse cx="112" cy="91" rx="3.2" ry="11" fill="${Fh('metal-d')}" opacity=".7"/><path d="M86 98 Q76 100 70 96" stroke="${Fh('metal')}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      return Rh.step(j.svg + roll + ill.label(118, 30, 'щель', 'end'), 'Банка в фольге с узкой щелью, чтобы видеть уровень');
    },
    k2: () => {
      // the lid seen from above with a hole, and the net cup going into it
      let g = `<ellipse cx="56" cy="88" rx="38" ry="13" fill="${Fh('metal-d')}"/><ellipse cx="56" cy="86" rx="35" ry="11" fill="${Fh('metal')}"/>`;
      g += `<ellipse cx="56" cy="86" rx="11" ry="4" fill="${Fh('dark')}"/>`;
      g += hcup(56, 40, 22, 22);
      g += Rh.arrow(84, 50, 70, 76, -8);
      g += `<path d="M96 34 l10 -10 M100 38 l10 -10" stroke="${Fh('grip')}" stroke-width="3" stroke-linecap="round"/><path d="M90 40l6 -6l4 4l-6 6z" fill="${Fh('metal-d')}"/>`;
      return Rh.step(g, 'Отверстие в крышке под сетчатый стаканчик');
    },
    k3: () => {
      const j = hjar(46, 104, 54, 72, { level: 0.98, cupH: 24 });
      // the dimension: the cup's bottom stands 1–2 cm in the solution
      const cb = j.top + 25;
      const dimL = `<g class="ill-scale"><path d="M78 ${qh(j.yl)}H86M78 ${qh(cb)}H86M82 ${qh(j.yl)}V${qh(cb)}" fill="none" stroke="currentColor"/></g>`;
      return Rh.step(j.svg + dimL + ill.label(118, qh(cb + 18), '1–2 см', 'end'), 'Раствор налит так, что дно стаканчика стоит в нём на 1–2 см');
    },
    k4: () => {
      const j = hjar(60, 104, 54, 58, { level: 0.82, fill: 'cube', roots: 10 });
      return Rh.step(j.svg + hsprout(60, j.top - 2, 20, 2, 1.15), 'Сеянец в кубике минваты, вокруг керамзит');
    },
    k5: () => {
      const j = hjar(37, 106, 46, 66, { level: 0.36, fill: 'clay', roots: 48, air: true, seed: 7 });
      let g = j.svg + ill.bush({ x: 37, y: j.top - 4, h: 26, nodes: 2, leaf: 0.17, spread: 0.8, seed: 6 });
      g += ill.label(119, qh(j.top + 26), 'воздух', 'end') + ill.label(119, qh(j.yl + 18), 'раствор', 'end');
      return Rh.step(g, 'Уровень опустился: верх корней в воздухе, низ в растворе', 106);
    },
    d1: () => {
      // an opaque bucket with its lid and handle
      let g = `<path d="M30 46H90L84 104H36Z" fill="${Fh('box')}"/><path d="M80 46H90L84 104H76Z" fill="${Fh('box-d')}" opacity=".5"/>`;
      g += `<rect x="26" y="40" width="68" height="9" rx="3" fill="${Fh('box-d')}"/><path d="M30 50Q60 18 90 50" stroke="${Fh('metal-d')}" stroke-width="2" fill="none"/>`;
      g += `<path d="M40 56V96" stroke="${Fh('hi')}" stroke-width="3" opacity=".3" stroke-linecap="round"/>`;
      g += ill.label(60, 16, '10–20 л');
      return Rh.step(g, 'Непрозрачное ведро на 10–20 литров с крышкой');
    },
    d2: () => {
      let g = `<ellipse cx="60" cy="74" rx="46" ry="20" fill="${Fh('box-d')}"/><ellipse cx="60" cy="71" rx="43" ry="17" fill="${Fh('box')}"/>`;
      [[-24, -2], [0, -8], [24, -2], [0, 7]].forEach(([dx, dy]) => { g += `<ellipse cx="${60 + dx}" cy="${71 + dy}" rx="8" ry="3.4" fill="${Fh('dark')}"/>`; });
      g += `<circle cx="92" cy="74" r="2" fill="${Fh('dark')}"/>`;
      g += Rh.dim(36, 60, 40, '15–20 см');
      return Rh.step(g, 'Крышка с четырьмя отверстиями под стаканчики и одним для шланга');
    },
    d3: () => {
      let g = Rh.tank(52, 104, 74, 52, { pots: [] });
      // the pump stands higher than the water, its hose with a check valve goes in through the lid
      g += `<rect x="90" y="30" width="24" height="16" rx="4" fill="${Fh('frame')}" stroke="${Fh('frame-d')}" stroke-width="1.2"/><circle cx="97" cy="38" r="2.4" fill="${Fh('frame-d')}"/><path d="M102 32h8" stroke="${Fh('frame-d')}" stroke-width="1"/>`;
      g += `<path d="M96 46Q94 56 84 56H76Q72 56 72 48" stroke="${Fh('frame-d')}" stroke-width="1.8" fill="none"/>`;
      g += `<rect x="78" y="52.5" width="7" height="7" rx="1.5" fill="${Fh('grip')}"/>`;
      return Rh.step(g + ill.label(118, 22, 'выше воды', 'end'), 'Компрессор выше уровня воды, шланг с клапаном к камню на дне');
    },
    d4: () => {
      let g = Rh.tank(60, 104, 92, 56, { pots: [-0.52, 0.52], seed: 4 });
      [-0.52, 0.52].forEach((k, i) => { g += hsprout(60 + k * 46, 46, 18, 1, 1.1 - i * 0.05); });
      // the bubbles burst at the top and splash the cups
      [[30, 54], [38, 51], [82, 53], [90, 50], [60, 53]].forEach(([x, y]) => { g += `<circle cx="${x}" cy="${y}" r="1.4" fill="${Fh('water-c')}" stroke="${Fh('glass-d')}" stroke-width=".5"/>`; });
      return Rh.step(g, 'Раствор чуть ниже дна стаканчиков, пузыри брызгают на субстрат');
    },
    d5: () => {
      let g = Rh.tank(60, 104, 96, 58, { pots: [-0.55, 0, 0.55], seed: 8 });
      [-0.45, 0, 0.45].forEach((k, i) => { g += ill.bush({ x: 60 + k * 48, y: 44, h: 24, nodes: 2, leaf: 0.15, spread: 0.75, seed: 3 + i }); });
      g += `<g transform="translate(110 13)"><circle r="7" fill="${Fh('frame')}" stroke="${Fh('frame-d')}" stroke-width="1.2"/><path d="M0 -4V0L3 1.6" stroke="${Fh('dark')}" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>`;
      return Rh.step(g, 'Взрослые кусты, длинные корни в растворе, пузыри круглые сутки');
    }
  };
  illustrate('hyd', k => (HYD[k] || HYD.k1)(), Object.keys(HYD));

  // a choice with long names: chips that wrap to a new line, under a caption of their own
  const pickHtml = (id, label, options, value) => `<div class="lab-seg-wrap"><span class="lab-label" id="${id}-l">${label}</span>${h.chipsHtml(id, label, options, value)}</div>`;
  // a number with its tenths only when it has them: 24 °C, 24,5 °C
  const fv = v => Math.abs(v % 1) > 1e-9 ? fmt(v) : fmt0(v);

  /* Readings without a chart. A meter — one value against its limits, its fill in the colour of its state and its
     track a lighter step of it; a scale with zones on which a value goes from where it was (a ring) to where it
     is (a dot). Both are HTML laid out in percentages: their words keep their real size at any width, and the
     state is said in a word beside the colour, never by the colour alone. */
  const hyPc = (v, a, b) => clamp((v - a) / (b - a), 0, 1) * 100;
  const hyAt = (v, a, b) => hyPc(v, a, b).toFixed(1) + '%';
  const HY_STATE = { good: 'хорошо', warn: 'на грани', bad: 'плохо' };
  // a reading: its name, the value, the state in a word, and the meter under them. o: label, value, state, word,
  // v, max, min, ticks (values marked on the track)
  function hyGauge(o) {
    const min = o.min || 0;
    const ticks = (o.ticks || []).map(v => `<i class="hy-mtick" style="left:${hyAt(v, min, o.max)}"></i>`).join('');
    return `<div class="hy-gauge"><p class="hy-gauge-h"><span>${o.label}</span><b>${o.value}</b><em class="hy-state is-${o.state}">${o.word || HY_STATE[o.state]}</em></p>` +
      `<div class="hy-meter is-${o.state}" role="img" aria-label="${esc(o.label + ': ' + String(o.value).replace(/<[^>]+>/g, ''))}"><span class="hy-mtrack"><i class="hy-mfill" style="width:${hyAt(o.v, min, o.max)}"></i>${ticks}</span></div></div>`;
  }
  // a scale: zones [[from, to, state, name]], ticks under it, a value from → to (either may be left out)
  function hyScale(o) {
    const { min, max } = o, f = o.fmt || fmt;
    const zones = (o.zones || []).map(([a, b, st]) => `<i class="hy-zone is-${st}" style="left:${hyAt(a, min, max)};width:${(hyPc(b, min, max) - hyPc(a, min, max)).toFixed(1)}%"></i>`).join('');
    const names = (o.zones || []).filter(z => z[3]).map(([a, b, , name]) => `<span style="left:${((hyPc(a, min, max) + hyPc(b, min, max)) / 2).toFixed(1)}%">${name}</span>`).join('');
    let marks = '';
    if (o.from != null && o.to != null) {
      const a = hyPc(Math.min(o.from, o.to), min, max), b = hyPc(Math.max(o.from, o.to), min, max);
      marks += `<i class="hy-link" style="left:${a.toFixed(1)}%;width:${(b - a).toFixed(1)}%"></i>`;
    }
    if (o.from != null) marks += `<b class="hy-mark is-from" style="left:${hyAt(o.from, min, max)}"></b>`;
    if (o.to != null) marks += `<b class="hy-mark is-to is-${o.state || 'good'}" style="left:${hyAt(o.to, min, max)}"></b>`;
    const ticks = (o.ticks || []).map(v => `<span style="left:${hyAt(v, min, max)}">${f(v)}</span>`).join('');
    return `<div class="hy-scale" role="img" aria-label="${esc(o.label || '')}"><div class="hy-znames">${names}</div>` +
      `<div class="hy-track"><span class="hy-zones">${zones}</span>${marks}</div><div class="hy-ticks">${ticks}</div></div>`;
  }
  // the state of a value by the zones of its scale
  const hyZone = (Z, v) => (Z.find(([a, b]) => v >= a && v < b) || Z[v < Z[0][0] ? 0 : Z.length - 1])[2];
  // the one number a model leads with
  const hyHero = (value, text) => `<p class="hy-hero"><b>${value}</b><span>${text}</span></p>`;
