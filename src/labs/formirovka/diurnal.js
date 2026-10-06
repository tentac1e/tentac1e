  register('diurnal', el => {
    const Tleaf = hr => 20.5 + 6.5 * Math.cos(2 * Math.PI * (hr - 15) / 24);
    const emit = T => Math.exp(10.6 * (1 - 471 / (T + 273.15)));
    const EMAX = emit(27);
    const turg = hr => hr < 7 || hr > 21 ? 1 : 1 - 0.42 * Math.pow(Math.sin(Math.PI * (hr - 7) / 14), 1.5);
    el.innerHTML = h.head('Летний день глазами листа', 'Температура листа — типичный ясный июльский день. Испарение линалоола считается по правилу Трутона, тургор — упрощённо.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-di-h', 'Время', 0, 23.5, 0.5, 7)}</div>
       <div class="lab-chart" id="lab-di-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s3"></i>аромат улетает</li><li><i class="k-s4"></i>тургор листа</li></ul>` +
      h.readHtml([['Температура листа', 'lab-di-t'], ['Испарение аромата, от пика', 'lab-di-e'], ['Тургор', 'lab-di-g'], ['Совет', 'lab-di-v', 'is-wide']]);
    let H = 7, hover = null;
    const hh2 = v => `${Math.floor(v)}:${v % 1 ? '30' : '00'}`;
    const ch = h.chart($('#lab-di-ch', el), {
      label: 'Потери аромата и тургор листа в течение суток',
      draw(w, hh) {
        const pts = f => { const a = []; for (let x = 0; x <= 24; x += 0.25) a.push([x, f(x)]); return a; };
        const P = h.plot({ w, h: hh, x: [0, 24], y: [0, 105], xticks: [0, 6, 12, 18, 24], yticks: [0, 50, 100], fx: v => v + ':00', fy: v => v + '%',
          vbands: [{ x0: 6, x1: 10, cls: 'is-good', label: 'лучший сбор' }],
          series: [{ pts: pts(x => emit(Tleaf(x)) / EMAX * 100), cls: 's3', label: 'аромат улетает', labelAt: 15, ldy: -10 }, { pts: pts(x => turg(x) * 100), cls: 's4', label: 'тургор', labelAt: 3, ldy: -8 }],
          marker: { x: H, dots: [{ y: emit(Tleaf(H)) / EMAX * 100, cls: 's3' }, { y: turg(H) * 100, cls: 's4' }] }, hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [hh2(hover), `лист ${fmt(Tleaf(hover))} °C`, `потери ${pct(emit(Tleaf(hover)) / EMAX)}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [0, 24], y: [0, 1] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 0, 23.5);
        if (kind === 'set') { hover = null; rng.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const T = Tleaf(H), e = emit(T) / EMAX, g = turg(H);
      set(el, 'lab-di-t', `${fmt(T)} °C`); set(el, 'lab-di-e', pct(e)); set(el, 'lab-di-g', pct(g));
      set(el, 'lab-di-v', H >= 6 && H <= 10 ? 'Хорошее время: листья упругие, аромат ещё не «выкипает».' : H > 10 && H < 18 ? 'Жарко: листья вялые, летучие вещества уходят быстрее всего. Отложите сбор.' : H >= 18 && H < 21 ? 'Вечером можно, но листья ещё не восстановили воду после дня.' : 'Ночью листья полны воды, но на них может быть роса — собирайте, когда она высохнет.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-di-h', v => hh2(v), v => { H = v; upd(); });
    upd();
  });
