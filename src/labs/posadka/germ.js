  register('germ', el => {
    const Tb = 10.5, To = 30, Tc = 42, th = 52;
    const days = T => (T <= Tb || T >= Tc) ? Infinity : T <= To ? th / (T - Tb) : th / ((To - Tb) * (Tc - T) / (Tc - To));
    el.innerHTML = h.head('Сколько ждать всходов', 'Модель термального времени: семени нужно набрать около 52 градусо-дней выше базовых 10,5 °C. Выше 30 °C скорость снова падает.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-germ-t', 'Температура грунта', 8, 40, 0.5, 24)}
          <figure class="germ-fig" aria-hidden="true">
            <svg class="germ-anim" id="lab-germ-anim" viewBox="0 0 200 130">
              <rect class="germ-soil" x="0" y="72" width="200" height="58"/>
              <g class="germ-seed" transform="translate(100 96)">
                <circle class="germ-gel" r="20"/>
                <path class="germ-root" d="M4 4 C 8 16 2 26 6 34"/>
                <path class="germ-hypo" d="M-2 -4 C -6 -18 4 -30 0 -44"/>
                <g class="germ-coty" transform="translate(0 -44)"><ellipse cx="-9" cy="-3" rx="9" ry="4.5" transform="rotate(-18 -9 -3)"/><ellipse cx="9" cy="-3" rx="9" ry="4.5" transform="rotate(18 9 -3)"/></g>
                <ellipse class="germ-coat" rx="7" ry="4.4"/>
              </g>
            </svg>
            <figcaption class="germ-phase" id="lab-germ-phase"></figcaption>
          </figure>
        </div>
        <div class="lab-chart" id="lab-germ-ch"></div>
      </div>` +
      h.readHtml([['Корешок проклюнется', 'lab-germ-r'], ['Всходы над землёй', 'lab-germ-e'], ['Скорость от максимума', 'lab-germ-v']]);
    let T = 24, hover = null;
    const pts = f => { const a = []; for (let t = 11; t <= 41.5; t += 0.25) { const d = f(t); if (d <= 30) a.push([t, d]); } return a; };
    const ch = h.chart($('#lab-germ-ch', el), {
      label: 'Дни до прорастания в зависимости от температуры',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [8, 40], y: [0, 30], xticks: [10, 15, 20, 25, 30, 35, 40], yticks: [0, 10, 20, 30], fx: v => v + '°', ylab: 'дней', xlab: 'температура грунта, °C',
          vbands: [{ x0: 22, x1: 25, cls: 'is-good', label: 'совет гида' }],
          series: [{ pts: pts(t => days(t) * 1.8), cls: 's3', dash: true, label: 'всходы', labelAt: 16, ldy: -10 }, { pts: pts(days), cls: 's1', label: 'корешок', labelAt: 14.5, ldy: 16 }],
          marker: isFinite(days(T)) && days(T) <= 30 ? { x: T, dots: [{ y: days(T), cls: 's1' }].concat(days(T) * 1.8 <= 30 ? [{ y: days(T) * 1.8, cls: 's3' }] : []) } : { x: T },
          hover: hover });
        let s = P.s;
        if (hover != null) {
          const d = days(hover);
          s += h.tip(P.X(hover), P.p.t + 4, w, [`${fmt(hover)} °C`, isFinite(d) ? `корешок ${fmt(d)} дн.` : 'не прорастёт', isFinite(d) ? `всходы ${fmt(d * 1.8)} дн.` : '']);
        }
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [8, 40], y: [0, 30] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 8, 40);
        if (kind === 'set') { rng.set(v); hover = null; } else if (kind === 'hover') hover = v; else hover = null;
        ch.redraw();
      }
    });
    const anim = $('#lab-germ-anim', el);
    const upd = () => {
      const d = days(T);
      const ok = isFinite(d) && d < 60;
      set(el, 'lab-germ-r', ok ? `через ${fmt(d)} дн.` : 'не прорастёт');
      set(el, 'lab-germ-e', ok ? `через ${fmt(d * 1.8)} дн.` : '—');
      set(el, 'lab-germ-v', ok ? pct((th / 19.5) / d) : '0');
      anim.classList.toggle('is-stopped', !ok || h.reduce.matches);
      anim.style.setProperty('--dur', `${clamp(ok ? d * 0.9 : 6, 2.6, 14)}s`);
      set(el, 'lab-germ-phase', !ok ? (T <= Tb ? 'Слишком холодно: ферменты почти стоят, семя лежит сухим.' : 'Слишком жарко: белки зародыша повреждаются.') : 'Набухание → пробуждение ферментов → корешок → петля стебелька и семядоли');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-germ-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    upd();
  });
