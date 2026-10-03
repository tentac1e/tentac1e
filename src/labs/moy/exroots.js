  /* «Регенерация»: adventitious roots of a cutting, warm against cool. The model (agro.rootsLength, the same as «Черенок в
     стакане» in chapter Размножение): the day the first roots show and how fast they grow at each temperature */
  const rootsT = (cfg, g) => (g ? cfg.tB : cfg.tA);
  register('exroots', el => experiment(el, {
    id: 'roots',
    note: 'Клетки у узла черенка «переучиваются» и становятся корнями. Тепло ускоряет эту перестройку: модель знает, на какой день покажутся корешки в тепле и в прохладе.',
    cfg: [
      { k: 'tA', label: 'Температура в тепле', unit: '°C', def: 24, min: 15, max: 32, step: 0.5 },
      { k: 'tB', label: 'Температура в прохладе', unit: '°C', def: 18, min: 12, max: 26, step: 0.5 }
    ],
    fields: [{ k: 'mm', label: 'Самый длинный корешок', type: 'number', unit: 'мм', min: 0, max: 300, step: 1, short: 'корешок' }],
    photo: true,
    unit: 'd',
    y: { k: 'mm', lo: 0, hi: 60, ticks: [0, 20, 40, 60], lab: 'мм' },
    model: (g, t, cfg) => Math.min(60, agro.rootsLength(t, rootsT(cfg, g)) * 10),
    verdict(run) {
      const cfg = run.cfg || {};
      const part = (g, name) => {
        const T = rootsT(cfg, g), pts = expSeries(run, g, 'mm', 'd'), first = pts.find(([, v]) => v > 0);
        return first ? `${name} (${nfmt(T)} °C) первые корешки — к ${fmt0(first[0])}-му дню, модель ждала ${nfmt(agro.rootsOnset(T))}` : `${name} (${nfmt(T)} °C) корешков пока нет, модель ждёт их к ${nfmt(agro.rootsOnset(T))}-му дню`;
      };
      if (!run.recs.length) return '<p>Каждые два дня меняйте воду и измеряйте самый длинный корешок (0 — если его нет).</p>';
      return h.nb(`<p>${part(0, 'В тепле')}; ${part(1, 'в прохладе')}.</p><p>Пока снаружи ничего не видно, у основания идёт главная работа: ауксин стекает к срезу, и клетки возле узла, которые были стеблем, начинают делиться заново и закладывают корни — как ящерица отращивает хвост. В тепле ферменты работают быстрее, поэтому корни появляются раньше.</p>`);
    }
  }));
