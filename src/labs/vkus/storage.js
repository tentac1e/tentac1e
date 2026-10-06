  const STORE_PTS = [[2, 1], [4, 2], [6, 3], [8, 4.5], [10, 6], [12, 8], [14, 9], [16, 8.6], [18, 7.2], [20, 6], [22, 5], [25, 4]];
  const storeAt = t => { for (let i = 0; i < STORE_PTS.length - 1; i++) if (t <= STORE_PTS[i + 1][0]) return lerp(STORE_PTS[i][1], STORE_PTS[i + 1][1], (t - STORE_PTS[i][0]) / (STORE_PTS[i + 1][0] - STORE_PTS[i][0])); return 4; };

  register('storage', el => {
    el.innerHTML = h.head('Сколько живёт срезанный базилик', 'Ориентир для стеблей в воде под свободным пакетом, упрощено по опытам хранения: ниже 10 °C срок режет холодовое повреждение, выше 18 °C — старение листа.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-st-t', 'Температура хранения', 2, 25, 1, 4)}</div>
       <div class="lab-chart" id="lab-st-ch"></div>` + h.readHtml([['До заметной порчи', 'lab-st-d'], ['Что происходит', 'lab-st-v', 'is-wide']]);
    let T = 4;
    const ch = h.chart($('#lab-st-ch', el), {
      label: 'Срок хранения срезанного базилика в зависимости от температуры',
      draw(w, hh) {
        const pts = []; for (let t = 2; t <= 25; t += 0.5) pts.push([t, storeAt(t)]);
        const P = h.plot({ w, h: hh, x: [2, 25], y: [0, 10], xticks: [2, 5, 10, 15, 20, 25], yticks: [0, 5, 10], fx: v => v + '°', ylab: 'дней',
          vbands: [{ x0: 2, x1: 10, cls: 'is-cold', label: 'холодовое повреждение' }, { x0: 12, x1: 15, cls: 'is-good', label: 'оптимум' }],
          series: [{ pts, cls: 's1', area: true }], marker: { x: T, dots: [{ y: storeAt(T), cls: 's1' }] } });
        return P.s;
      },
      onPointer(x, y, w, hh, kind) { if (kind !== 'set') return; const P = h.plot({ w, h: hh, x: [2, 25], y: [0, 10] }); rng.set(clamp(Math.round(P.inv(x)), 2, 25)); }
    });
    const upd = () => {
      set(el, 'lab-st-d', `≈ ${fmt(storeAt(T))} дн.`);
      set(el, 'lab-st-v', T < 10 ? 'Мембраны клеток «застывают», полифенолоксидаза встречается с полифенолами — появляются чёрные пятна.' : T <= 16 ? 'Мембраны жидкие, дыхание медленное: лист живёт дольше всего.' : 'Тепло: лист быстро тратит запасы, желтеет и вянет.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-st-t', v => `${v} °C`, v => { T = v; upd(); });
    upd();
  });
