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
