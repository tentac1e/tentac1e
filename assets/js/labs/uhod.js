/* Гид по базилику — живые модели главы «Уход». Файл собирает scripts/build.py из src/labs/uhod/ — правьте там */
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

  const { micro, ill, props } = window.BasilLibs;
  { const st = document.createElement('style'); st.dataset.labs = "uhod"; st.textContent = "/* vpd */\n.vpd-map polygon { stroke: none; }\n.vpd-iso { fill: none; stroke: var(--surface); stroke-width: 1.5; opacity: .8; }\n.vpd-map .z0 { fill: var(--z0); } .vpd-map .z1 { fill: var(--z1); } .vpd-map .z2 { fill: var(--z2); } .vpd-map .z3 { fill: var(--z3); } .vpd-map .z4 { fill: var(--z4); }\n.vpd-dot { fill: none; stroke: var(--ink); stroke-width: 2.5; }\n.vpd-dot-in { fill: var(--ink); }\n.vpd-legend { display: grid; gap: 5px; margin: 0; padding: 0; list-style: none; font-size: .82rem; color: var(--ink-2); }\n.vpd-legend i { display: inline-block; width: 14px; height: 14px; margin-right: 8px; border-radius: 4px; vertical-align: -2px; }\n.vpd-legend .z0 { background: var(--z0); } .vpd-legend .z1 { background: var(--z1); } .vpd-legend .z2 { background: var(--z2); } .vpd-legend .z3 { background: var(--z3); } .vpd-legend .z4 { background: var(--z4); }\n.vpd-legend small { font-family: var(--font-mono); color: var(--ink-3); }\n\n/* ph bands */\n.ph-band { fill: var(--ser-1); opacity: .55; transition: opacity .3s; }\n.ph-band.is-low { fill: var(--ser-3); opacity: .75; }\n.ph-sym { font: 700 12px/1 var(--font-mono); fill: var(--ink-2); }\n.ph-sym.is-low { fill: var(--ser-3); }\n\n"; document.head.appendChild(st); }
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
      let g = `<path d="M90 76Q85 86 91 96" stroke="${Fw('kraft-d')}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      g += ill.pot(90, 56, 58, 22) + ill.plant({ x: 88, y: 50, h: 28, nodes: 3, leafScale: 0.42, seed: 9 });
      g += Rw.jar(90, 102, 52, 48, { fill: 'water-c', level: 0.48, open: true });
      return waterP(g, 'Горшок на банке с водой: фитиль из дренажного отверстия опущен в воду', 102);
    }
  };
  illustrate('water', k => (WATER[k] || WATER.when)(), Object.keys(WATER));

  const gauss = (x, mu, sg, a) => a * Math.exp(-0.5 * Math.pow((x - mu) / sg, 2));
  const normed = f => { let m = 0; for (let x = 400; x <= 700; x++) m = Math.max(m, f(x)); return x => f(x) / m; };
  const CHLA = normed(x => gauss(x, 430, 14, 1) + gauss(x, 410, 16, 0.42) + gauss(x, 662, 11, 0.78) + gauss(x, 615, 18, 0.14) + gauss(x, 580, 30, 0.04));
  const CHLB = normed(x => gauss(x, 453, 13, 1) + gauss(x, 472, 12, 0.32) + gauss(x, 642, 11, 0.56) + gauss(x, 595, 24, 0.07));
  const CAR = normed(x => gauss(x, 424, 11, 0.62) + gauss(x, 449, 13, 1) + gauss(x, 478, 12, 0.86));
  const planck = (l, T) => { const lm = l * 1e-9; return 1 / (Math.pow(lm, 5) * (Math.exp(1.4388e-2 / (lm * T)) - 1)); };
  const LAMPS = {
    sun: x => planck(x, 5800) / planck(500, 5800),
    led: x => gauss(x, 450, 10, 0.62) + gauss(x, 600, 58, 0.95),
    fito: x => gauss(x, 450, 10, 0.75) + gauss(x, 660, 11, 1),
    none: () => 0
  };
  function wl2rgb(l) {
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
    const f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 680 ? 0.3 + 0.7 * (700 - l) / 20 + 0.3 : 1;
    return `rgb(${Math.round(255 * Math.pow(r * Math.min(1, f), 0.8))} ${Math.round(255 * Math.pow(g * Math.min(1, f), 0.8))} ${Math.round(255 * Math.pow(b * Math.min(1, f), 0.8))})`;
  }
  const colorName = l => l < 450 ? 'фиолетово-синий' : l < 490 ? 'синий' : l < 520 ? 'голубовато-зелёный' : l < 565 ? 'зелёный' : l < 590 ? 'жёлтый' : l < 625 ? 'оранжевый' : 'красный';

  register('spectrum', el => {
    el.innerHTML = h.head('Что поглощает лист', 'Спектры поглощения пигментов (схематично, по максимуму) и спектр источника света. Ведите по графику, чтобы увидеть значения.') +
      `<div class="lab-controls">${h.chipsHtml('lab-sp-l', 'Источник', [['sun', 'Солнце'], ['led', 'Белый LED'], ['fito', 'Красно-синий'], ['none', 'Без лампы']], 'led')}</div>
       <div class="lab-chart" id="lab-sp-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s1"></i>хлорофилл a</li><li><i class="k-s2"></i>хлорофилл b</li><li><i class="k-s3"></i>каротиноиды</li><li><i class="k-lamp"></i>спектр источника</li></ul>`;
    let lamp = 'led', hover = null;
    const P0 = { l: 38, r: 16, t: 22, b: 48 };
    const ch = h.chart($('#lab-sp-ch', el), {
      label: 'Спектры поглощения хлорофиллов и каротиноидов от 400 до 700 нанометров',
      draw(w, hh) {
        const pts = f => { const a = []; for (let x = 400; x <= 700; x += 2) a.push([x, f(x)]); return a; };
        const lampPts = pts(LAMPS[lamp]);
        const mx = Math.max(...lampPts.map(p => p[1])) || 1;
        const P = h.plot({ w, h: hh, pad: P0, x: [400, 700], y: [0, 1.08], xticks: [400, 450, 500, 550, 600, 650, 700], yticks: [0, 0.5, 1], fy: v => v === 0 ? '0' : v === 1 ? 'макс' : '', xlab: 'длина волны, нм',
          series: [{ pts: lampPts.map(p => [p[0], p[1] / mx]), cls: 'lamp', area: true }, { pts: pts(CAR), cls: 's3', label: w >= 480 ? 'каротиноиды' : '', labelAt: 500, ldy: -4, anchor: 'start' }, { pts: pts(CHLB), cls: 's2', label: w >= 480 ? 'хл. b' : '', labelAt: 642, ldy: -8 }, { pts: pts(CHLA), cls: 's1', label: w >= 480 ? 'хл. a' : '', labelAt: 668, ldy: -8 }],
          hover });
        let s = `<defs><linearGradient id="lab-sp-grad" x1="0" x2="1">${[400, 430, 460, 490, 520, 550, 580, 610, 640, 670, 700].map((l, i) => `<stop offset="${i / 10}" stop-color="${wl2rgb(l)}"/>`).join('')}</linearGradient></defs>`;
        s += P.s + `<rect class="spec-band" x="${P.p.l}" y="${hh - P0.b + 24}" width="${P.iw}" height="8" rx="4" fill="url(#lab-sp-grad)"/>`;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${Math.round(hover)} нм · ${colorName(hover)}`, `хлорофилл a: ${pct(CHLA(hover))}`, `хлорофилл b: ${pct(CHLB(hover))}`, `каротиноиды: ${pct(CAR(hover))}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, pad: P0, x: [400, 700], y: [0, 1] });
        hover = kind === 'leave' ? null : clamp(P.inv(x), 400, 700);
        ch.redraw();
      }
    });
    h.bindPick(el, 'lab-sp-l', v => { lamp = v; ch.redraw(); });
  });

  register('lamp', el => {
    el.innerHTML = h.head('Лампа и расстояние', 'Точечный источник — обратный квадрат; панель 30×30 см — модель светящегося диска. Паспортный PPFD указан на 30 см.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.segHtml('lab-lamp-t', 'Лампа', [['point', 'Точечная'], ['panel', 'Панель 30×30']], 'panel')}${h.rangeHtml('lab-lamp-e', 'PPFD на 30 см', 100, 800, 10, 300)}${h.rangeHtml('lab-lamp-d', 'Расстояние до листьев', 10, 100, 1, 45)}${h.rangeHtml('lab-lamp-hr', 'Часов света', 10, 18, 1, 16)}</div>
        <div class="lab-chart" id="lab-lamp-ch"></div>
      </div>` + h.readHtml([['PPFD у листьев', 'lab-lamp-p'], ['Дневная сумма DLI', 'lab-lamp-dli'], ['Вывод', 'lab-lamp-v', 'is-wide']]);
    let type = 'panel', E30 = 300, d = 45, hrs = 16, hover = null;
    const R = 17;
    const E = (tp, x) => tp === 'point' ? E30 * Math.pow(30 / x, 2) : E30 * (R * R + 900) / (R * R + x * x);
    const ch = h.chart($('#lab-lamp-ch', el), {
      label: 'Освещённость в зависимости от расстояния до лампы',
      draw(w, hh) {
        const pts = tp => { const a = []; for (let x = 10; x <= 100; x += 1) a.push([x, E(tp, x)]); return a; };
        const ymax = Math.max(600, Math.min(1200, Math.ceil(E(type, 20) / 200) * 200));
        const P = h.plot({ w, h: hh, clip: true, x: [10, 100], y: [0, ymax], xticks: [10, 30, 50, 70, 100], yticks: [0, 200, 400, ymax].filter((v, i, a) => a.indexOf(v) === i), fx: v => v + ' см', ylab: 'мкмоль/м²·с',
          hbands: [{ y0: 200, y1: 400, cls: 'is-good', label: 'нужно базилику' }],
          series: [{ pts: pts(type === 'point' ? 'panel' : 'point'), cls: 'is-faint s2', label: type === 'point' ? 'панель' : 'точечная', labelAt: 85, ldy: -8 }, { pts: pts(type), cls: 's1', label: type === 'point' ? 'точечная' : 'панель', labelAt: 70, ldy: -10 }],
          marker: { x: d, dots: [{ y: Math.min(E(type, d), ymax), cls: 's1' }] }, hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${Math.round(hover)} см`, `точечная: ${fmt0(E('point', hover))}`, `панель: ${fmt0(E('panel', hover))}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [10, 100], y: [0, 1] });
        const v = clamp(Math.round(P.inv(x)), 10, 100);
        if (kind === 'set') { hover = null; dist.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const p = E(type, d), dli = p * hrs * 3600 / 1e6;
      set(el, 'lab-lamp-p', `${fmt0(p)} мкмоль/м²·с`);
      set(el, 'lab-lamp-dli', `${fmt(dli)} моль/м²`);
      set(el, 'lab-lamp-v', p > 900 ? 'Слишком близко: возможен ожог и перегрев верхних листьев.' : dli < 8 ? 'Мало света: базилик будет вытягиваться. Опустите лампу или добавьте часы.' : dli < 12 ? 'На грани: расти будет, но медленно и с бледным ароматом.' : dli <= 20 ? 'Хорошо: в диапазоне 12–17 моль/м² за сутки базилик растёт ароматным.' : 'Света с запасом: можно сократить часы или поднять лампу.');
      ch.redraw();
    };
    h.bindPick(el, 'lab-lamp-t', v => { type = v; upd(); });
    h.bindRange(el, 'lab-lamp-e', v => fmt0(v), v => { E30 = v; upd(); });
    const dist = h.bindRange(el, 'lab-lamp-d', v => `${v} см`, v => { d = v; upd(); });
    h.bindRange(el, 'lab-lamp-hr', v => `${v} ч`, v => { hrs = v; upd(); });
    upd();
  });

  const svp = T => 0.6108 * Math.exp(17.27 * T / (T + 237.3));
  const VPD_Z = [[0.4, 'z0', 'Слишком влажно', 'устьица почти не тянут воду, на листьях конденсат — раздолье для ложной мучнистой росы'], [0.8, 'z1', 'Влажно', 'хорошо для рассады и черенков без корней'], [1.2, 'z2', 'Оптимум', 'вода и питание идут к листьям ровно, лист не перегревается'], [1.6, 'z3', 'Сухо', 'растение пьёт много: поливайте чаще, следите за клещом'], [99, 'z4', 'Стресс', 'устьица закрываются, фотосинтез падает, края листьев сохнут']];
  const zoneOf = v => VPD_Z.find(z => v < z[0]);

  register('vpd', el => {
    el.innerHTML = h.head('VPD: воздух глазами листа', 'Дефицит давления пара для листа той же температуры, что воздух. Двигайте ползунки или ведите по карте.') +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-vpd-t', 'Температура воздуха', 10, 38, 0.5, 24)}${h.rangeHtml('lab-vpd-rh', 'Влажность', 20, 95, 1, 45)}
          <ul class="vpd-legend">${VPD_Z.map((z, i) => `<li><i class="${z[1]}"></i>${z[2]} <small>${i === 0 ? '< 0,4' : i === 4 ? '> 1,6' : `${fmt(VPD_Z[i - 1][0])}–${fmt(z[0])}`}</small></li>`).join('')}</ul>
        </div>
        <div class="lab-chart" id="lab-vpd-ch"></div>
      </div>` + h.readHtml([['VPD', 'lab-vpd-v'], ['Зона', 'lab-vpd-z'], ['Потенциал воды в воздухе', 'lab-vpd-psi'], ['Что происходит', 'lab-vpd-note', 'is-wide']]);
    let T = 24, RH = 45;
    const PAD = { l: 40, r: 12, t: 22, b: 36 };
    const ch = h.chart($('#lab-vpd-ch', el), {
      label: 'Карта дефицита давления пара по температуре и влажности',
      h: w => clamp(w * 0.66, 240, 340),
      draw(w, hh) {
        const P = h.plot({ w, h: hh, pad: PAD, x: [10, 38], y: [20, 95], xticks: [10, 15, 20, 25, 30, 35], yticks: [20, 40, 60, 80, 95], fx: v => v + '°', fy: v => v + '%', ylab: 'влажность', xlab: 'температура, °C' });
        const bound = v => { const a = []; for (let t = 10; t <= 38.001; t += 0.5) a.push([t, clamp(100 * (1 - v / svp(t)), 20, 95)]); return a; };
        const lines = [null, ...VPD_Z.slice(0, 4).map(z => bound(z[0])), null];
        let cells = '';
        VPD_Z.forEach((z, i) => {
          const top = lines[i] || bound(0).map(([t]) => [t, 95]);
          const bot = lines[i + 1] || bound(0).map(([t]) => [t, 20]);
          const pts = top.map(([t, r]) => `${P.X(t)},${P.Y(r)}`).concat(bot.slice().reverse().map(([t, r]) => `${P.X(t)},${P.Y(r)}`));
          cells += `<polygon class="${z[1]}" points="${pts.join(' ')}"/>`;
        });
        VPD_Z.slice(0, 4).forEach(z => { cells += `<path class="vpd-iso" d="${bound(z[0]).map(([t, r], i) => `${i ? 'L' : 'M'}${P.X(t)} ${P.Y(r)}`).join(' ')}"/>`; });
        return `<g class="vpd-map">${cells}</g>` + P.s.replace(/<line class="grid"[^>]*>/g, '') +
          `<circle class="vpd-dot" cx="${P.X(T)}" cy="${P.Y(RH)}" r="9"/><circle class="vpd-dot-in" cx="${P.X(T)}" cy="${P.Y(RH)}" r="3.5"/>`;
      },
      onPointer(x, y, w, hh, kind) {
        if (kind !== 'set') return;
        const P = h.plot({ w, h: hh, pad: PAD, x: [10, 38], y: [20, 95] });
        tr.set(clamp(Math.round(P.inv(x) * 2) / 2, 10, 38));
        rr.set(clamp(Math.round(P.invY(y)), 20, 95));
      }
    });
    const upd = () => {
      const es = svp(T), v = es * (1 - RH / 100), z = zoneOf(v);
      const psi = 8.314 * (T + 273.15) / 18.05e-6 * Math.log(RH / 100) / 1e6;
      set(el, 'lab-vpd-v', `${fmt(v, 2)} кПа`);
      set(el, 'lab-vpd-z', `<span class="zone-pill ${z[1]}">${z[2]}</span>`);
      set(el, 'lab-vpd-psi', `${fmt0(psi)} МПа`);
      set(el, 'lab-vpd-note', h.nb(`Давление насыщенного пара ${fmt(es, 2)} кПа: ${z[3]}.`));
      ch.redraw();
    };
    const tr = h.bindRange(el, 'lab-vpd-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    const rr = h.bindRange(el, 'lab-vpd-rh', v => `${v} %`, v => { RH = v; upd(); });
    upd();
  });

  register('temp', el => {
    const Pt = T => { if (T <= 8 || T >= 42) return 0; return ((42 - T) / 15) * Math.pow((T - 8) / 19, 19 / 15); };
    const Rt = T => 0.16 * Math.pow(2, (T - 20) / 10);
    el.innerHTML = h.head('Фотосинтез, дыхание и прирост', 'Относительная модель: фотосинтез с оптимумом 27 °C, дыхание с Q₁₀ = 2. Прирост — их разница.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-tmp-t', 'Температура', 5, 42, 0.5, 30)}</div>
       <div class="lab-chart" id="lab-tmp-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s1"></i>фотосинтез</li><li><i class="k-s2"></i>прирост</li><li><i class="k-s3"></i>дыхание</li></ul>` +
      h.readHtml([['Фотосинтез', 'lab-tmp-p'], ['Дыхание', 'lab-tmp-r'], ['Прирост', 'lab-tmp-n'], ['Вывод', 'lab-tmp-v', 'is-wide']]);
    let T = 30, hover = null;
    const ch = h.chart($('#lab-tmp-ch', el), {
      label: 'Фотосинтез, дыхание и прирост в зависимости от температуры',
      draw(w, hh) {
        const pts = f => { const a = []; for (let t = 5; t <= 42; t += 0.5) a.push([t, f(t)]); return a; };
        const P = h.plot({ w, h: hh, clip: true, x: [5, 42], y: [-0.6, 1.1], xticks: [5, 10, 15, 20, 25, 30, 35, 40], yticks: [-0.5, 0, 0.5, 1], fx: v => v + '°', fy: v => v === 0 ? '0' : v === 1 ? 'макс' : v > 0 ? '½' : '−½', xlab: 'температура, °C',
          vbands: [{ x0: 20, x1: 28, cls: 'is-good', label: 'оптимум' }],
          series: [{ pts: pts(Pt), cls: 's1', label: 'фотосинтез', labelAt: 16, ldy: -8 }, { pts: pts(t => Pt(t) - Rt(t)), cls: 's2', label: 'прирост', labelAt: 12, ldy: 16 }, { pts: pts(Rt), cls: 's3', label: 'дыхание', labelAt: 38, ldy: -8 }],
          marker: { x: T, dots: [{ y: Pt(T), cls: 's1' }, { y: Pt(T) - Rt(T), cls: 's2' }, { y: Rt(T), cls: 's3' }] }, hover });
        let s = P.s + `<line class="zero" x1="${P.p.l}" x2="${P.p.l + P.iw}" y1="${P.Y(0)}" y2="${P.Y(0)}"/>`;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${fmt(hover)} °C`, `фотосинтез ${pct(Pt(hover))}`, `дыхание ${pct(Rt(hover))}`, `прирост ${pct(Pt(hover) - Rt(hover))}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [5, 42], y: [0, 1] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 5, 42);
        if (kind === 'set') { hover = null; rng.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const p = Pt(T), r = Rt(T), n = p - r;
      set(el, 'lab-tmp-p', pct(p)); set(el, 'lab-tmp-r', pct(r)); set(el, 'lab-tmp-n', pct(n));
      set(el, 'lab-tmp-v', n <= 0 ? 'Растение тратит больше, чем производит: рост остановлен, куст слабеет.' : T < 16 ? 'Холодно: фотосинтез медленный, рост почти стоит.' : T > 32 ? 'Жарко: дыхание съедает большую часть сахаров, куст торопится цвести.' : 'Хорошая зона: прирост близок к максимуму.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-tmp-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    upd();
  });

  const PH_X = [4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5];
  const PH_EL = [
    ['N', [0.35, 0.5, 0.75, 0.95, 1, 1, 0.95, 0.8, 0.6]], ['P', [0.25, 0.35, 0.55, 0.85, 1, 0.9, 0.6, 0.45, 0.4]], ['K', [0.4, 0.55, 0.75, 0.95, 1, 1, 1, 1, 0.95]],
    ['S', [0.4, 0.55, 0.75, 0.95, 1, 1, 1, 1, 1]], ['Ca', [0.3, 0.4, 0.55, 0.75, 0.9, 1, 1, 1, 1]], ['Mg', [0.3, 0.4, 0.55, 0.75, 0.9, 1, 1, 1, 0.95]],
    ['Fe', [1, 1, 1, 0.95, 0.85, 0.7, 0.5, 0.35, 0.3]], ['Mn', [1, 1, 1, 0.95, 0.85, 0.7, 0.5, 0.35, 0.3]], ['B', [0.6, 0.75, 0.9, 1, 1, 0.9, 0.7, 0.5, 0.45]],
    ['Cu', [0.9, 1, 1, 1, 0.95, 0.85, 0.7, 0.55, 0.5]], ['Zn', [0.9, 1, 1, 1, 0.95, 0.85, 0.65, 0.45, 0.4]], ['Mo', [0.2, 0.3, 0.45, 0.6, 0.75, 0.9, 1, 1, 1]]
  ];
  const phAv = (arr, ph) => { const t = clamp((ph - 4.5) / 0.5, 0, 8); const i = Math.min(7, Math.floor(t)); return lerp(arr[i], arr[i + 1], t - i); };

  register('ph', el => {
    el.innerHTML = h.head('Доступность элементов по pH', 'Толщина полосы — насколько элемент доступен корням. Упрощено по классической диаграмме Труога.') +
      `<div class="lab-controls">${h.rangeHtml('lab-ph-v', 'pH грунта', 4.5, 8.5, 0.1, 7.6)}</div>
       <div class="lab-chart" id="lab-ph-ch"></div>` + h.readHtml([['Хуже всего доступны', 'lab-ph-low', 'is-wide']]);
    let ph = 7.6;
    const ch = h.chart($('#lab-ph-ch', el), {
      label: 'Доступность двенадцати элементов питания в зависимости от pH',
      h: () => 12 * 26 + 56,
      draw(w, hh) {
        const P = h.plot({ w, h: hh, pad: { l: 40, r: 14, t: 26, b: 26 }, x: [4.5, 8.5], y: [0, 12], xticks: [4.5, 5.5, 6.5, 7.5, 8.5], fx: v => fmt(v), vbands: [{ x0: 6, x1: 7, cls: 'is-good' }] });
        let s = P.s;
        PH_EL.forEach(([sym, arr], i) => {
          const cy = P.Y(11.5 - i);
          const top = [], bot = [];
          for (let x = 4.5; x <= 8.51; x += 0.1) { const a = phAv(arr, x) * 10.5; top.push(`${P.X(x)},${r1(cy - a)}`); bot.unshift(`${P.X(x)},${r1(cy + a)}`); }
          const low = phAv(arr, ph) < 0.6;
          s += `<polygon class="ph-band${low ? ' is-low' : ''}" points="${top.join(' ')} ${bot.join(' ')}"/>`;
          s += `<text class="ph-sym${low ? ' is-low' : ''}" x="${P.p.l - 8}" y="${r1(cy + 4)}" text-anchor="end">${sym}</text>`;
        });
        s += `<line class="marker" x1="${P.X(ph)}" x2="${P.X(ph)}" y1="20" y2="${hh - 26}"/><text class="tick marker-lbl" x="${P.X(ph)}" y="13" text-anchor="middle">pH ${fmt(ph)}</text>`;
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        if (kind !== 'set') return;
        const P = h.plot({ w, h: hh, pad: { l: 40, r: 14, t: 26, b: 26 }, x: [4.5, 8.5], y: [0, 12] });
        rng.set(clamp(Math.round(P.inv(x) * 10) / 10, 4.5, 8.5));
      }
    });
    const upd = () => {
      const low = PH_EL.filter(([, a]) => phAv(a, ph) < 0.6).map(([s]) => s);
      set(el, 'lab-ph-low', low.length ? `${low.join(', ')}${ph > 7.2 ? ' — молодые листья желтеют между жилками' : ph < 5.8 ? ' — кислый грунт, раскислите доломитовой мукой' : ''}` : 'все элементы доступны хорошо');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-ph-v', v => fmt(v), v => { ph = v; upd(); });
    upd();
  });

  register('solar', el => {
    el.innerHTML = h.head('Солнечная энергия по месяцам', 'Суточная сумма на горизонтальную поверхность у верхней границы атмосферы, в процентах от лучшего месяца. Облака уменьшают её ещё сильнее.') +
      `<div class="lab-controls">${citiesChips('lab-sol-city', 55.8)}</div>
       <div class="lab-chart" id="lab-sol-ch"></div>` +
      h.readHtml([['Июнь к декабрю', 'lab-sol-r'], ['Солнце в полдень 21 декабря', 'lab-sol-a'], ['День 21 декабря', 'lab-sol-d']]);
    let lat = 55.8;
    const cur = new Date().getMonth();
    const ch = h.chart($('#lab-sol-ch', el), {
      label: 'Относительная солнечная энергия по месяцам',
      draw(w, hh) {
        const vals = h.DOY21.map(n => h.h0(lat, n));
        const mx = Math.max(...vals);
        const P = h.plot({ w, h: hh, x: [0, 12], y: [0, 105], yticks: [0, 25, 50, 75, 100], fy: v => v + '%' });
        let s = P.s;
        const bw = P.iw / 12 - 6;
        vals.forEach((v, i) => {
          const p = v / mx * 100;
          const x = P.X(i) + 3;
          s += `<path class="vbar ${i === cur ? 's1' : 'is-muted'}" d="M${r1(x)} ${P.Y(0)} V${r1(P.Y(p) + 4)} q0 -4 4 -4 H${r1(x + bw - 4)} q4 0 4 4 V${P.Y(0)} Z"/>`;
          if (w > 440 || i % 2 === 0) s += `<text class="tick" x="${r1(x + bw / 2)}" y="${hh - 18}" text-anchor="middle">${MONTHS[i]}</text>`;
          if (i === 5 || i === 11 || i === cur) s += `<text class="bar-lbl" x="${r1(x + bw / 2)}" y="${r1(P.Y(p) - 6)}" text-anchor="middle">${fmt0(p)}%</text>`;
        });
        return s;
      }
    });
    const upd = () => {
      const jun = h.h0(lat, 172), dec = h.h0(lat, 355);
      set(el, 'lab-sol-r', dec > 0.05 ? `в ${fmt(jun / dec)} раза больше` : 'в декабре солнца нет');
      const a = h.noonSun(lat, 355);
      set(el, 'lab-sol-a', a > 0 ? `${fmt(a)}° над горизонтом` : 'не поднимается');
      set(el, 'lab-sol-d', `${fmt(h.dayLength(lat, 355))} ч`);
      ch.redraw();
    };
    h.bindPick(el, 'lab-sol-city', v => { lat = +v; upd(); });
    upd();
  });
})();
