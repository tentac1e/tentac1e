  /* The oxygen of a tank: what the air pump and the surface bring in against what the roots and microbes use.
     dC/dt = k·(Cs − C) − D. Cs — saturation at the temperature (doAt, o2.js); k — how fast air gets in (pump on:
     a few per hour, still water: a few hundredths); D — the use by the roots (grows with the bushes, Q10 = 2)
     and by the microbes in the water. */
  const O2B = {
    bucket: { name: 'Ведро 15 л, 4 куста', v: 15, n: 4, on: 4, off: 0.04 },
    jar: { name: 'Банка 3 л, 1 куст', v: 3, n: 1, on: 6, off: 0.06 }
  };
  register('o2box', el => {
    el.innerHTML = h.head('Если выключить компрессор', 'Зелёная линия — кислород в растворе, пока работает компрессор, жёлтая — после того, как его выключили в момент 0. Расход корнями — условный, растёт с размером кустов и с теплом (Q₁₀ = 2); насыщение — справочное, как в соседней модели.', true) +
      `<div class="lab-controls">
        ${h.segHtml('lab-o2b-box', 'Ёмкость', Object.keys(O2B).map(k => [k, O2B[k].name]), 'bucket')}
        ${h.rangeHtml('lab-o2b-t', 'Температура раствора', 16, 30, 0.5, 22)}
        ${h.rangeHtml('lab-o2b-w', 'Возраст кустов', 2, 10, 1, 6)}
      </div>
      <div class="lab-chart" id="lab-o2b-ch"></div>
      <ul class="legend legend-lines"><li><i class="k-s1"></i>компрессор работает</li><li><i class="k-s3"></i>компрессор выключили</li></ul>` +
      h.readHtml([['Предел при этой температуре', 'lab-o2b-s'], ['С компрессором', 'lab-o2b-on'], ['Без него до 4 мг/л', 'lab-o2b-t4'], ['Вывод', 'lab-o2b-v', 'is-wide']]);
    let box = 'bucket', T = 22, W = 6, hover = null;
    const use = () => {
      const b = O2B[box], q10 = Math.pow(2, (T - 20) / 10);
      // a bush's roots use about 0.03·weeks² mg of O₂ an hour at 20 °C; microbes 0.02 mg per litre an hour
      return (b.n * 0.03 * W * W * q10 + 0.02 * b.v * q10) / b.v;
    };
    const state = () => {
      const b = O2B[box], Cs = doAt(T), D = use(), Con = Math.max(0, Cs - D / b.on), Cinf = Cs - D / b.off;
      const at = t => Math.max(0, Cinf + (Con - Cinf) * Math.exp(-b.off * t));
      const t4 = Cinf >= 4 ? null : Con <= 4 ? 0 : -Math.log((4 - Cinf) / (Con - Cinf)) / b.off;
      return { Cs, D, Con, at, t4 };
    };
    const ch = h.chart($('#lab-o2b-ch', el), {
      label: 'Растворённый кислород за сутки: с компрессором и после его выключения',
      draw(w, hh) {
        const st = state(), pts = [];
        for (let t = 0; t <= 24; t += 0.25) pts.push([t, st.at(t)]);
        const P = h.plot({ w, h: hh, clip: true, x: [0, 24], y: [0, 12], xticks: [0, 4, 8, 12, 16, 20, 24], yticks: [0, 2, 4, 6, 8, 10, 12], fx: v => v + ' ч', ylab: 'мг O₂ на литр', xlab: 'часов после выключения',
          hbands: [{ y0: 0, y1: 4, cls: 'is-low', label: 'корням душно' }],
          series: [{ pts: [[0, st.Con], [24, st.Con]], cls: 's1', label: 'с компрессором', labelAt: 18, ldy: -10 }, { pts, cls: 's3', label: 'без него', labelAt: 9, ldy: 16 }],
          marker: st.t4 != null && st.t4 <= 24 ? { x: st.t4, dots: [{ y: 4, cls: 's3' }] } : null, hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`через ${fmt(hover)} ч`, `O₂: ${fmt(st.at(hover))} мг/л`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [0, 24], y: [0, 12] });
        hover = kind === 'leave' ? null : clamp(Math.round(P.inv(x) * 2) / 2, 0, 24);
        ch.redraw();
      }
    });
    const upd = () => {
      const st = state();
      set(el, 'lab-o2b-s', `${fmt(st.Cs)} мг/л`);
      set(el, 'lab-o2b-on', `${fmt(st.Con)} мг/л`);
      set(el, 'lab-o2b-t4', st.t4 == null ? 'не опустится' : st.t4 <= 0 ? 'уже ниже' : st.t4 > 24 ? 'больше суток' : `за ${h.nb(fmt(st.t4) + ' ч')}`);
      set(el, 'lab-o2b-v', st.t4 == null || st.t4 > 24 ? 'Кусты маленькие или вода прохладная: сутки без компрессора они переживут.'
        : st.t4 > 8 ? `Запас на ${fmt0(st.t4)} часов: ночь без электричества не страшна, но больше суток — уже риск.`
          : `Всего ${h.nb(fmt(st.t4) + ' ч')} — и корням душно. Большие кусты в тёплой воде без пузырей задыхаются за вечер: при отключении опустите уровень, чтобы верх корней оказался в воздухе.`);
      ch.redraw();
    };
    h.bindPick(el, 'lab-o2b-box', v => { box = v; upd(); });
    h.bindRange(el, 'lab-o2b-t', v => h.nb(`${fv(v)} °C`), v => { T = v; upd(); });
    h.bindRange(el, 'lab-o2b-w', v => `${fmt0(v)} ${h.plural(v, 'неделя', 'недели', 'недель')}`, v => { W = v; upd(); });
    upd();
  });
