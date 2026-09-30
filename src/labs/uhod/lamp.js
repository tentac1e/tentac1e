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
