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
