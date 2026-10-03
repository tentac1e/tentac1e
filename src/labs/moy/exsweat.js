  /* «Растение потеет»: transpiration. The pot is weighed with its soil covered, so what it loses is what the leaves give
     to the air. Two charts: the weight over time, and how fast it falls against the air's pull on the leaf (VPD from the
     room's temperature and humidity, agro.vpd): the model is a straight line through zero */
  const sweatRates = run => {
    const pts = run.recs.filter(r => expVal(r, 'g') !== null).sort((a, b) => a.at - b.at);
    const vpdOf = r => (expVal(r, 't') !== null && expVal(r, 'rh') !== null ? agro.vpd(r.v.t, r.v.rh) : null);
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dt = (b.at - a.at) / 3600e3, loss = a.v.g - b.v.g;
      if (dt < 2 || loss < 0) continue; // a watering in between, or too short to tell
      const vs = [vpdOf(a), vpdOf(b)].filter(v => v !== null);
      out.push({ rate: loss / dt, vpd: vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : null, dt });
    }
    return out;
  };
  register('exsweat', el => experiment(el, {
    id: 'sweat',
    note: 'Лист испаряет воду, и сухой воздух тянет её сильнее. Если укрыть грунт, всё, что теряет горшок, — это вода, которую выпил и отдал воздуху куст.',
    fields: [
      { k: 'g', label: 'Вес горшка', type: 'number', unit: 'г', min: 0, max: 30000, step: 1, short: 'вес' },
      { k: 't', label: 'Температура в комнате', type: 'number', unit: '°C', min: -10, max: 45, step: 0.5, optional: true, short: 'воздух' },
      { k: 'rh', label: 'Влажность', type: 'number', unit: '%', min: 5, max: 100, step: 1, optional: true, short: 'влажность' }
    ],
    unit: 'h',
    legend: false,
    draw(host, run) {
      host.innerHTML = '<figcaption>Вес горшка</figcaption><div data-sw-a></div><figcaption>Как быстро уходит вода и как сух воздух</figcaption><div data-sw-b></div>';
      const w = expSeries(run, 0, 'g', 'h');
      const xMax = Math.max(96, ...w.map(p => p[0])) * 1.04;
      if (w.length) {
        const lo = Math.min(...w.map(p => p[1])), hi = Math.max(...w.map(p => p[1]));
        const span = Math.max(20, hi - lo), y0 = Math.floor((lo - span * 0.2) / 10) * 10, y1 = Math.ceil((hi + span * 0.2) / 10) * 10;
        const step = Math.max(10, Math.round((y1 - y0) / 4 / 10) * 10), yt = [];
        for (let v = y0; v <= y1; v += step) yt.push(v);
        expPlot($('[data-sw-a]', host), { label: 'Вес горшка по времени', pad: { l: 52 }, x: [0, xMax], y: [y0, y1], xticks: expTimeTicks(xMax, 'h'), yticks: yt, fx: expFx('h'), fy: v => fmt0(v), ylab: 'г', xlab: 'часов от начала', series: w.length > 1 ? [{ pts: w, cls: 's1' }] : [], dots: w.map(([x, v]) => [x, v, 's1']) });
      }
      const rates = sweatRates(run).filter(r => r.vpd !== null);
      if (rates.length) {
        const k = rates.reduce((s, r) => s + r.vpd * r.rate, 0) / rates.reduce((s, r) => s + r.vpd * r.vpd, 0);
        const vMax = Math.max(2, Math.ceil(Math.max(...rates.map(r => r.vpd)) * 2) / 2), rMax = Math.max(1, Math.ceil(Math.max(...rates.map(r => r.rate), k * vMax) * 1.15));
        const rt = []; for (let v = 0; v <= rMax + 1e-9; v += Math.max(1, Math.round(rMax / 4))) rt.push(v);
        const vt = []; for (let v = 0; v <= vMax + 1e-9; v += 0.5) vt.push(v);
        expPlot($('[data-sw-b]', host), { label: 'Скорость испарения в зависимости от VPD', x: [0, vMax], y: [0, rMax], xticks: vt, yticks: rt, fx: v => nfmt(v), fy: v => fmt0(v), ylab: 'г/ч', xlab: 'VPD, кПа', series: [{ pts: [[0, 0], [vMax, k * vMax]], cls: 's2', dash: true }], dots: rates.map(r => [r.vpd, r.rate, 's1']) });
      } else {
        $('[data-sw-b]', host).innerHTML = '<p class="exp-hint">Запишите вместе с весом температуру и влажность в комнате — и гид покажет, как скорость испарения зависит от сухости воздуха.</p>';
      }
    },
    verdict(run) {
      const w = expSeries(run, 0, 'g', 'h');
      if (w.length < 2) return '<p>Взвесьте горшок сейчас и потом утром и вечером — по разнице видно, сколько воды выпил и отдал воздуху куст.</p>';
      const rates = sweatRates(run);
      const hours = rates.reduce((s, r) => s + r.dt, 0), lost = rates.reduce((s, r) => s + r.rate * r.dt, 0);
      if (!hours) return '<p>Между взвешиваниями прошло мало времени или горшок полили — подождите хотя бы несколько часов.</p>';
      const perDay = lost / hours * 24;
      // «2 стакана», «5 стаканов», «2,5 стакана»
      const cups = n => { const r = Math.round(n * 10) / 10; return `${nfmt(r)} ${r % 1 ? 'стакана' : h.plural(r, 'стакан', 'стакана', 'стаканов')}`; };
      let s = `<p><b>Куст отдаёт воздуху около ${fmt0(perDay)} г воды в сутки</b> — это ${cups(perDay * 7 / 200)} по 200 мл в неделю. Почти вся вода, которую пьют корни, больше 95 %, уходит так: лист охлаждается испарением, как кожа потом, а уходящая вода тянет за собой следующую — от корней по стеблю, как сок по соломинке.</p>`;
      const dry = rates.filter(r => r.vpd !== null).sort((a, b) => a.vpd - b.vpd);
      if (dry.length >= 2 && dry[dry.length - 1].vpd - dry[0].vpd > 0.3) {
        const a = dry[0], b = dry[dry.length - 1];
        s += `<p>Чем суше воздух, тем быстрее: при VPD ${nfmt(a.vpd)} кПа куст терял ${nfmt(a.rate)} г в час, при ${nfmt(b.vpd)} — ${nfmt(b.rate)}. Поэтому у батареи, где воздух сухой, горшок сохнет заметно быстрее.</p>`;
      }
      return h.nb(s);
    }
  }));
