  /* «Солёный огурец»: osmosis. A sprig in water keeps its turgor; in a salt solution the water leaves the cells for the side
     where more is dissolved. The model's line: the pull of the solution (agro.osmoticMPa) against a cell's own sap
     (agro.CELL_MPA) decides how fast the leaf goes limp */
  const OSMOS_FIRM = ['висит', 'мягкий', 'упругий', 'тугой'];
  register('exosmos', el => experiment(el, {
    id: 'osmos',
    note: 'Вода идёт туда, где растворено больше. Модель считает, с какой силой солёная вода тянет воду из клеток листа, и как скоро он сдастся.',
    cfg: [{ k: 'tsp', label: 'Соли на стакан 200 мл', unit: 'ч. л.', def: 1, min: 0.5, max: 3, step: 0.5 }],
    fields: [{ k: 'firm', label: 'Какой лист', type: 'scale', opts: OSMOS_FIRM }],
    photo: true,
    unit: 'h',
    y: { k: 'firm', lo: 0, hi: 3, ticks: [0, 1, 2, 3], fy: v => OSMOS_FIRM[v] || '', lab: '', pad: { l: 70 } },
    model(g, t, cfg) {
      if (g === 0) return 3;
      const drive = Math.max(0.1, agro.CELL_MPA - agro.osmoticMPa(30 * (cfg.tsp || 1)));
      return 3 * Math.exp(-t * drive / 6);
    },
    verdict(run) {
      const water = expSeries(run, 0, 'firm', 'h'), salt = expSeries(run, 1, 'firm', 'h');
      const psi = agro.osmoticMPa(30 * ((run.cfg && run.cfg.tsp) || 1));
      const pull = `Раствор тянет воду с силой около ${nfmt(psi)} МПа, а сок клетки — около ${nfmt(agro.CELL_MPA)} МПа: вода уходит из клетки наружу, и клетки опадают, как шарики, из которых выпустили воздух.`;
      if (!salt.length) return '<p>Запишите, какими листья были в начале, — и проверяйте их по шагам.</p>';
      const limp = salt.find(([, v]) => v <= 1);
      const wLast = water.length ? water[water.length - 1][1] : null;
      if (limp) return h.nb(`<p><b>Солёная вода забрала у листа упругость за ${nfmt(limp[0], limp[0] < 10 ? 1 : 0)} ч</b>${wLast !== null ? `, а в чистой воде он ${wLast >= 2 ? 'остался упругим' : 'тоже ослаб — возможно, веточка долго стояла без воды'}` : ''}. ${pull} Так же «обжигает» корни лишняя подкормка: грунт становится солонее корня, и куст вянет во влажной земле.</p>`);
      const lastT = salt[salt.length - 1][0];
      return h.nb(`<p>${lastT < 6 ? 'Пока лист в соли держится — осмос не мгновенный, проверьте через несколько часов.' : 'Лист в соли держится дольше, чем ждала модель: возможно, соли мало или стебель толстый и запасливый.'} ${pull}</p>`);
    }
  }));
