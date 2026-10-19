  const DO_T = [[10, 11.29], [12, 10.77], [14, 10.29], [16, 9.86], [18, 9.47], [20, 9.09], [22, 8.74], [24, 8.42], [26, 8.11], [28, 7.83], [30, 7.56], [32, 7.3], [34, 7.06], [35, 6.95]];
  const doAt = t => { for (let i = 0; i < DO_T.length - 1; i++) if (t <= DO_T[i + 1][0]) return lerp(DO_T[i][1], DO_T[i + 1][1], (t - DO_T[i][0]) / (DO_T[i + 1][0] - DO_T[i][0])); return DO_T[DO_T.length - 1][1]; };
  const demand = t => 6.1 * Math.pow(2, (t - 20) / 10);
  const O2_TZ = [[10, 18, 'warn', 'прохладно'], [18, 22, 'good', 'норма'], [22, 24, 'warn'], [24, 35, 'bad', 'опасно']];

  /* Oxygen against the roots' breathing at one temperature: two bars on one scale — what the water holds
     (reference data for fresh water) and what the roots ask for (illustrative, Q10 = 2) — and the margin between */
  register('o2', el => {
    el.innerHTML = h.head('Кислород против дыхания корней', 'Сколько кислорода держит вода при этой температуре и сколько просят корни. Растворимость — справочные данные для пресной воды, потребность корней — условная: важен не уровень, а запас между ними.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-o2-t', 'Температура раствора', 10, 35, 0.5, 22)}<div id="lab-o2-tz"></div></div>
       <div class="o2-out" aria-live="polite"><div id="lab-o2-hero"></div><div class="o2-bars" id="lab-o2-bars"></div><p class="hy-verdict" id="lab-o2-v"></p></div>`;
    let T = 22;
    const upd = () => {
      const d = doAt(T), n = demand(T), m = d - n, s = m > 1.2 ? 'good' : m > 0 ? 'warn' : 'bad';
      set(el, 'lab-o2-tz', hyScale({ min: 10, max: 35, zones: O2_TZ, ticks: [10, 20, 30], fmt: v => v + ' °C', to: T, state: hyZone(O2_TZ, T), label: `Температура раствора ${fv(T)} °C` }));
      set(el, 'lab-o2-hero', hyHero(h.nb(`${m >= 0 ? '+' : '−'}${fmt(Math.abs(m))} мг/л`), { good: 'запас кислорода сверх того, что просят корни', warn: 'запас почти кончился: корни на грани', bad: 'кислорода меньше, чем просят корни' }[s]));
      $('#lab-o2-bars', el).innerHTML = [['В воде', d, 'is-o2'], ['Нужно корням', Math.min(12, n), 'is-need']].map(([name, v, c]) =>
        `<div class="o2-row"><span class="o2-name">${name}</span><span class="o2-bar"><i class="${c}" style="width:${(v / 12 * 100).toFixed(1)}%"></i></span><span class="o2-val">${h.nb(fmt(v) + ' мг/л')}</span></div>`).join('');
      set(el, 'lab-o2-v', h.nb(s === 'good' ? 'Кислорода с запасом: корни белые и плотные.' : s === 'warn' ? 'На грани: добавьте аэрацию или охладите раствор.' : 'Корням не хватает кислорода: риск питиума и бурых корней. Охладите раствор до 18–22 °C.'));
    };
    h.bindRange(el, 'lab-o2-t', v => h.nb(`${fv(v)} °C`), v => { T = v; upd(); });
    upd();
  });
