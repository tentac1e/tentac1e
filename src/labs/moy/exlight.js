  /* «Навигатор к свету»: phototropism. The top leans to the window over a day or two; the pot is turned at 48 h and the
     top comes round again. The model's line: the lean grows towards 35° with a time constant of a day, and after the
     turn starts from the other side */
  const LIGHT_TURN = 48, LIGHT_MAX = 35, LIGHT_TAU = 24;
  const lightModel = t => {
    if (t <= LIGHT_TURN) return LIGHT_MAX * (1 - Math.exp(-t / LIGHT_TAU));
    const at = LIGHT_MAX * (1 - Math.exp(-LIGHT_TURN / LIGHT_TAU));
    return -at + (at + LIGHT_MAX) * (1 - Math.exp(-(t - LIGHT_TURN) / LIGHT_TAU));
  };
  register('exlight', el => experiment(el, {
    id: 'light',
    note: 'Верхушка «видит» свет и растёт к нему: теневая сторона стебля вытягивается быстрее. Модель знает, как скоро она повернётся снова, если развернуть горшок.',
    fields: [{ k: 'deg', label: 'Наклон к окну (+) или от окна (−)', type: 'number', unit: '°', min: -90, max: 90, step: 5, short: 'наклон' }],
    photo: true,
    unit: 'h',
    y: { k: 'deg', lo: -60, hi: 60, ticks: [-60, -30, 0, 30, 60], fy: v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '°', lab: 'к окну' },
    model: (g, t) => lightModel(t),
    verdict(run) {
      const pts = expSeries(run, 0, 'deg', 'h');
      if (!pts.length) return '<p>Запишите наклон верхушки сейчас: прямо — 0°, к окну — со знаком плюс.</p>';
      const before = pts.filter(([t]) => t > 12 && t <= LIGHT_TURN + 1);
      const after = pts.filter(([t]) => t > LIGHT_TURN + 1);
      let s = '';
      if (before.length) { const [t, v] = before[before.length - 1]; s += `<p>За ${fmt0(t)} ч верхушка наклонилась на ${fmt0(v)}° ${v >= 0 ? 'к окну' : 'от окна'} — модель ждала около ${fmt0(lightModel(t))}°.</p>`; }
      const back = after.find(([, v]) => v >= 0);
      const mBack = LIGHT_TAU * Math.log((LIGHT_MAX * (1 - Math.exp(-LIGHT_TURN / LIGHT_TAU)) + LIGHT_MAX) / LIGHT_MAX);
      if (back) s += `<p><b>После поворота горшка верхушка снова встала к свету за ${fmt0(back[0] - LIGHT_TURN)} ч</b> — модель ждала около ${fmt0(mBack)}\u00a0ч. Свет ловит белок фототропин в кончике побега; гормон роста ауксин уходит на теневую сторону, и та растёт быстрее — стебель изгибается, как танк поворачивает, когда одна гусеница идёт быстрее другой.</p>`;
      else if (after.length) s += '<p>Верхушка ещё разворачивается — запишите наклон через несколько часов.</p>';
      else s += '<p>Через двое суток поверните горшок меткой от окна — и смотрите, как быстро верхушка найдёт свет снова.</p>';
      return h.nb(s);
    }
  }));
