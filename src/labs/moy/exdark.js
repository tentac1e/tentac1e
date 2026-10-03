  /* «Без света»: etiolation. Seedlings in the dark stretch on the seed's reserves and stay yellow-white; on the light they
     turn green within a day or two (chlorophyll is finished only in light). The model's lines are qualitative: about
     4 mm a day in light, 11 mm a day in the dark until the reserves run out */
  const DARK_COL = ['жёлто-белые', 'бледно-зелёные', 'зелёные'];
  register('exdark', el => experiment(el, {
    id: 'dark',
    note: 'В темноте росток тратит запас семени на рывок вверх и не строит хлорофилл. Модель здесь качественная: в темноте ростки вытягиваются в 2–3 раза быстрее.',
    fields: [
      { k: 'mm', label: 'Высота ростков', type: 'number', unit: 'мм', min: 0, max: 300, step: 1, short: 'высота' },
      { k: 'col', label: 'Цвет', type: 'scale', opts: DARK_COL }
    ],
    photo: true,
    unit: 'd',
    y: { k: 'mm', lo: 0, hi: 80, ticks: [0, 20, 40, 60, 80], lab: 'мм' },
    model: (g, t) => (g === 0 ? 4 * t : t <= 5 ? 11 * t : 55 + 3 * (t - 5)),
    verdict(run) {
      const last = (g, k, upTo = Infinity) => { const p = expSeries(run, g, k, 'd').filter(([t]) => t <= upTo); return p.length ? p[p.length - 1] : null; };
      const L = last(0, 'mm', 5.5), D = last(1, 'mm', 5.5);
      if (!L && !D) return '<p>Каждый день измеряйте ростки в обеих чашках и отмечайте их цвет.</p>';
      let s = '';
      if (L && D && L[1] > 0) s += `<p><b>В темноте ростки ${D[1] > L[1] ? `в ${nfmt(D[1] / L[1])} раза выше` : 'не выше'}, чем на свету</b> (${fmt0(D[1])} и ${fmt0(L[1])} мм). Без света росток бросает весь запас семени на рывок вверх, как человек в тёмном коридоре бежит к выходу, а не обустраивается.</p>`;
      const dCol = expSeries(run, 1, 'col', 'd'), darkCol = dCol.filter(([t]) => t <= 5.5).pop(), lightCol = dCol.filter(([t]) => t > 5.5);
      if (darkCol) s += `<p>В темноте они были ${DARK_COL[darkCol[1]]}: последний шаг сборки хлорофилла идёт только на свету — как завод, который не собирает солнечные панели, пока нет солнца.</p>`;
      const green = lightCol.find(([, v]) => v >= 2) || lightCol.find(([, v]) => v >= 1);
      if (green) s += `<p>На свету бывшие тёмные ростки ${green[1] >= 2 ? 'позеленели' : 'начали зеленеть'} за ${nfmt(green[0] - 5)} сут.</p>`;
      return h.nb(s);
    }
  }));
