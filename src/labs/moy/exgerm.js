  /* «Батарейка семени»: germination by thermal time. Two batches, warm and cool; the model (agro.germDays, the same as
     «Сколько ждать всходов» in chapter Посадка) gives the day half of the seeds show a root at each temperature */
  const germT = (cfg, g) => (g ? cfg.tB : cfg.tA);
  register('exgerm', el => experiment(el, {
    id: 'germ',
    note: 'Семя копит тепло выше 10,5 °C, как батарейка заряд: около 52 градусо-дней — и показывается корешок. Модель знает, когда это случится в тепле и в прохладе.',
    cfg: [
      { k: 'tA', label: 'Температура в тепле', unit: '°C', def: 24, min: 12, max: 35, step: 0.5 },
      { k: 'tB', label: 'Температура в прохладе', unit: '°C', def: 17, min: 11, max: 30, step: 0.5 },
      { k: 'n', label: 'Семян в каждом контейнере', unit: 'шт.', def: 10, min: 3, max: 50 }
    ],
    fields: [{ k: 'cnt', label: 'С корешком', type: 'count', unit: 'шт.', min: 0, max: 50, short: 'с корешком' }],
    unit: 'd',
    y: { k: 'cnt', lo: 0, hi: 100, ticks: [0, 25, 50, 75, 100], fy: v => `${v} %`, lab: 'проросло', of: (v, run) => 100 * v / ((run.cfg && run.cfg.n) || 10) },
    // most fresh seeds come up, not all: the line rises to 90 % around the day of a half
    model(g, t, cfg) {
      const t50 = agro.germDays(germT(cfg, g));
      return isFinite(t50) ? 90 / (1 + Math.exp(-(t - t50) / (0.2 * t50))) : 0;
    },
    verdict(run) {
      const cfg = run.cfg || {}, n = cfg.n || 10;
      const part = g => {
        const T = germT(cfg, g), pts = expSeries(run, g, 'cnt', 'd').map(([x, v]) => [x, 100 * v / n]);
        const t50 = expCross(pts, 50), m50 = agro.germDays(T), last = pts.length ? pts[pts.length - 1][1] : null;
        return { T, pts, t50, m50, last };
      };
      const [A, B] = [part(0), part(1)];
      if (!A.pts.length && !B.pts.length) return '<p>Каждый день считайте семена с корешком в обоих контейнерах — гид сравнит с моделью.</p>';
      const one = (name, x) => (x.t50 !== null ? `${name} (${nfmt(x.T)} °C) половина семян проросла к ${nfmt(x.t50)}-му дню — модель ждала ${nfmt(x.m50)}` : `${name} (${nfmt(x.T)} °C) пока проросло ${fmt0(x.last || 0)} %, модель ждёт половину к ${nfmt(x.m50)}-му дню`);
      let s = `<p>${one('В тепле', A)}; ${one('в прохладе', B).replace(/^В /, 'в ')}.</p>`;
      if (A.t50 !== null && B.t50 !== null) s += `<p><b>Тепло ускорило прорастание в ${nfmt(B.t50 / A.t50)} раза</b>, по модели — в ${nfmt(B.m50 / A.m50)}: каждый день при ${nfmt(A.T)} °C даёт семени ${nfmt(A.T - agro.GERM.Tb)} градусо-дня, а при ${nfmt(B.T)} °C — только ${nfmt(Math.max(0, B.T - agro.GERM.Tb))}.</p>`;
      const top = Math.max(A.last || 0, B.last || 0);
      if (top >= 50) s += `<p>Всего проросло до ${fmt0(top)} %: ${top >= 70 ? 'семена свежие и сильные.' : 'семена, похоже, старые — с годами всхожесть падает.'}</p>`;
      return h.nb(s);
    }
  }));
