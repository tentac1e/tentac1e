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
