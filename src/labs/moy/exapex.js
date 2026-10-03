  /* «Начальник верхушки»: apical dominance on two of the reader's bushes. A is pinched at the start and again at day 21,
     B is left alone. The model's line is the rule of the pinching models (chapter Прищипывание): every cut over a node
     wakes the two buds below — 2, then 4 tops; the bush left alone keeps one leader for weeks */
  register('exapex', el => experiment(el, {
    id: 'apex',
    note: 'Верхушка — начальник, который велит почкам ниже ждать. Срежьте его — и почки пойдут в рост: модель ждёт 2 верхушки после первого среза и 4 после второго.',
    bushes: true,
    fields: [
      { k: 'tops', label: 'Растущих верхушек', type: 'count', unit: 'шт.', min: 0, max: 99, short: 'верхушек' },
      { k: 'hcm', label: 'Высота', type: 'number', unit: 'см', min: 0, max: 300, step: 0.5, short: 'высота' },
      { k: 'g', label: 'Урожай', type: 'number', unit: 'г', min: 0, max: 5000, optional: true, short: 'урожай' }
    ],
    unit: 'd',
    y: { k: 'tops', lo: 0, hi: 8, ticks: [0, 2, 4, 6, 8], lab: 'верхушек' },
    model: (g, t) => (g === 1 ? 1 : t < 5 ? 1 : t < 26 ? 2 : 4),
    // the measures of a bush from «Мой базилик» go into its diary as well
    diary: v => [v.tops || v.hcm ? { k: 'measure', n: v.tops || undefined, h: v.hcm || undefined } : null, v.g ? { k: 'cut', g: v.g } : null].filter(Boolean),
    verdict(run) {
      const last = (g, k) => { const p = expSeries(run, g, k, 'd'); return p.length ? p[p.length - 1][1] : null; };
      const sum = (g, k) => expSeries(run, g, k, 'd').reduce((s, p) => s + p[1], 0);
      const tA = last(0, 'tops'), tB = last(1, 'tops'), hA = last(0, 'hcm'), hB = last(1, 'hcm'), gA = sum(0, 'g'), gB = sum(1, 'g');
      if (tA === null && tB === null) return '<p>Запишите верхушки и высоту обоих кустов сразу после прищипки — это точка отсчёта.</p>';
      let s = '';
      if (tA !== null && tB !== null) s += `<p><b>У прищипнутого куста ${fmt0(tA)} ${h.plural(tA, 'верхушка', 'верхушки', 'верхушек')}, у нетронутого — ${fmt0(tB)}.</b> Модель: после одного среза — 2, после второго — 4, у нетронутого — одна. Пока верхушка на месте, она шлёт вниз ауксин, и почки в пазухах ждут, как заместители при начальнике; срез убирает сигнал, а цитокинины из корней — «бюджет» роста — достаются боковым почкам.</p>`;
      if (hA !== null && hB !== null) s += `<p>${hB > hA ? `Нетронутый куст выше на ${nfmt(hB - hA)} см — он тянется одним стеблем, а прищипнутый растёт вширь.` : 'Прищипнутый куст не уступает в высоте — значит, боковые побеги пошли сильно.'}</p>`;
      if (gA || gB) s += `<p>Урожай: с куста А — ${fmt0(gA)} г, с куста Б — ${fmt0(gB)} г.</p>`;
      return h.nb(s);
    }
  }));
