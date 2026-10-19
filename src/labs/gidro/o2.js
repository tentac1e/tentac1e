  const DO_T = [[10, 11.29], [12, 10.77], [14, 10.29], [16, 9.86], [18, 9.47], [20, 9.09], [22, 8.74], [24, 8.42], [26, 8.11], [28, 7.83], [30, 7.56], [32, 7.3], [34, 7.06], [35, 6.95]];
  const doAt = t => { for (let i = 0; i < DO_T.length - 1; i++) if (t <= DO_T[i + 1][0]) return lerp(DO_T[i][1], DO_T[i + 1][1], (t - DO_T[i][0]) / (DO_T[i + 1][0] - DO_T[i][0])); return DO_T[DO_T.length - 1][1]; };
  const demand = t => 6.1 * Math.pow(2, (t - 20) / 10);

  register('o2', el => {
    el.innerHTML = h.head('Кислород против дыхания корней', 'Растворимость O₂ — справочные данные для пресной воды. Потребность корней — условная, с Q₁₀ = 2: важен не уровень, а момент, когда линии пересекаются.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-o2-t', 'Температура раствора', 10, 35, 0.5, 22)}</div>
       <div class="lab-chart" id="lab-o2-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s4"></i>кислород в воде</li><li><i class="k-s3"></i>потребность корней</li></ul>` +
      h.readHtml([['Растворено O₂', 'lab-o2-d'], ['Запас', 'lab-o2-m'], ['Вывод', 'lab-o2-v', 'is-wide']]);
    let T = 22, hover = null;
    const ch = h.chart($('#lab-o2-ch', el), {
      label: 'Растворённый кислород и потребность корней по температуре',
      draw(w, hh) {
        const pts = f => { const a = []; for (let t = 10; t <= 35; t += 0.5) a.push([t, f(t)]); return a; };
        const P = h.plot({ w, h: hh, clip: true, x: [10, 35], y: [2, 14], xticks: [10, 15, 20, 25, 30, 35], yticks: [2, 4, 6, 8, 10, 12, 14], fx: v => v + '°', ylab: 'мг O₂ на литр', xlab: 'температура раствора, °C',
          vbands: [{ x0: 18, x1: 22, cls: 'is-good', label: 'норма' }],
          series: [{ pts: pts(doAt), cls: 's4', label: 'O₂ в воде', labelAt: 13, ldy: -10 }, { pts: pts(demand), cls: 's3', label: 'потребность', labelAt: 31, ldy: -10 }],
          marker: { x: T, dots: [{ y: doAt(T), cls: 's4' }, { y: Math.min(14, demand(T)), cls: 's3' }] }, hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${fmt(hover)} °C`, `O₂: ${fmt(doAt(hover))} мг/л`, `потребность: ${fmt(demand(hover))}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [10, 35], y: [2, 14] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 10, 35);
        if (kind === 'set') { hover = null; rng.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const d = doAt(T), m = d - demand(T);
      set(el, 'lab-o2-d', `${fmt(d)} мг/л`);
      set(el, 'lab-o2-m', m >= 0 ? `+${fmt(m)}` : `−${fmt(-m)}`);
      set(el, 'lab-o2-v', m > 1.2 ? 'Кислорода с запасом: корни белые и плотные.' : m > 0 ? 'На грани: добавьте аэрацию или охладите раствор.' : 'Корням не хватает кислорода: риск питиума и бурых корней. Охладите раствор до 18–22 °C.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-o2-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    upd();
  });
