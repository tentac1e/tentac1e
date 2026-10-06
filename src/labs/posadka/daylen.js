  register('daylen', el => {
    el.innerHTML = h.head('Длина дня за год', 'Астрономический расчёт с поправкой на рефракцию. Коснитесь графика, чтобы увидеть любой день.') +
      `<div class="lab-controls">${citiesChips('lab-dl-city', 55.8)}${h.rangeHtml('lab-dl-lat', 'Широта', 40, 70, 0.1, 55.8)}</div>
       <div class="lab-chart" id="lab-dl-ch"></div>` +
      h.readHtml([['Сегодня', 'lab-dl-t'], ['Самый длинный день', 'lab-dl-max'], ['Самый короткий', 'lab-dl-min']]);
    let lat = 55.8, hover = null;
    const today = doyToday();
    const series = () => { const a = []; for (let n = 1; n <= 365; n += 2) a.push([n, h.dayLength(lat, n)]); return a; };
    const MSTART = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
    const ch = h.chart($('#lab-dl-ch', el), {
      label: 'Длина дня по дням года',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [1, 365], y: [0, 24], xticks: w > 520 ? MSTART.map(v => v + 14) : [15, 105, 196, 288], fx: v => MONTHS[MSTART.findIndex(s => s + 14 === v)] || MONTHS[Math.floor((v - 1) / 30.5)], yticks: [0, 6, 12, 18, 24], ylab: 'часов',
          hbands: [{ y0: 14, y1: 16, cls: 'is-good', label: 'нужно под лампой' }],
          series: [{ pts: series(), cls: 's1', area: true }],
          marker: { x: today, dots: [{ y: h.dayLength(lat, today), cls: 's1' }] }, hover });
        let s = P.s + `<text class="tick" x="${P.X(today)}" y="${P.p.t - 8}" text-anchor="middle">сегодня</text>`;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 16, w, [doyLabel(hover), `${fmt(h.dayLength(lat, hover))} ч`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [1, 365], y: [0, 24] });
        hover = kind === 'leave' ? null : clamp(Math.round(P.inv(x)), 1, 365);
        ch.redraw();
      }
    });
    const upd = () => {
      set(el, 'lab-dl-t', `${fmt(h.dayLength(lat, today))} ч`);
      set(el, 'lab-dl-max', `${fmt(h.dayLength(lat, 172))} ч`);
      set(el, 'lab-dl-min', `${fmt(h.dayLength(lat, 355))} ч`);
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-dl-lat', v => `${fmt(v)}° с. ш.`, v => { lat = v; city.set(''); upd(); });
    const city = h.bindPick(el, 'lab-dl-city', v => { lat = +v; rng.input.value = v; $('#lab-dl-lat-v', el).textContent = `${fmt(+v)}° с. ш.`; upd(); });
    upd();
  });
