  /* Two weeks of a solution: every day the bushes drink water (more in heat and dry air) and take salts with it at
     their own «uptake EC». When that is below the solution's EC, the salts stay behind and EC climbs; above it, EC
     falls. Taking nitrate makes the roots give out OH⁻, so pH climbs in proportion to what they took (illustrative). */
  const DR_BOX = { jar: { name: 'банка 3 л, 1 куст', v: 3, n: 1 }, bucket: { name: 'ведро 15 л, 4 куста', v: 15, n: 4 } };
  const DR_AIR = { dry: { name: 'жарко и сухо', e: 1.5, c: 0.8 }, norm: { name: 'обычно', e: 1, c: 1.15 }, wet: { name: 'прохладно и сыро', e: 0.6, c: 1.6 } };
  const DR_TOP = { none: 'не доливать', water: 'водой', half: 'раствором ½', full: 'раствором той же EC' };
  register('drift', el => {
    el.innerHTML = h.head('Куда уплывёт раствор за две недели', 'Взрослые кусты. Каждый день они пьют воду и берут соли; синяя линия — EC, жёлтая — pH. Модель условная, но направление дрейфа она показывает верно.', true) +
      `<div class="lab-controls">
        ${pickHtml('lab-dr-b', 'Ёмкость', Object.keys(DR_BOX).map(k => [k, DR_BOX[k].name]), 'bucket')}
        ${pickHtml('lab-dr-a', 'Воздух', Object.keys(DR_AIR).map(k => [k, DR_AIR[k].name]), 'norm')}
        ${pickHtml('lab-dr-t', 'Каждый вечер доливать', Object.keys(DR_TOP).map(k => [k, DR_TOP[k]]), 'water')}
        ${h.rangeHtml('lab-dr-e', 'EC в начале', 0.6, 2, 0.05, 1.2)}
      </div>
      <div class="lab-chart" id="lab-dr-ec"></div>
      <div class="lab-chart" id="lab-dr-ph"></div>` +
      h.readHtml([['EC через 2 недели', 'lab-dr-e14'], ['pH через 2 недели', 'lab-dr-p14'], ['pH выйдет за 6,5', 'lab-dr-pd'], ['Вывод', 'lab-dr-v', 'is-wide']]);
    let box = 'bucket', air = 'norm', top = 'water', ec0 = 1.2, hover = null;
    const run = () => {
      const b = DR_BOX[box], a = DR_AIR[air], E = b.n * 0.15 * a.e;
      let V = b.v, S = ec0 * b.v, pH = 6;
      const ec = [[0, ec0]], ph = [[0, pH]];
      let dry = null;
      for (let d = 1; d <= 14; d++) {
        const drink = Math.min(E, V * 0.9), took = Math.min(S, a.c * drink);
        V -= drink; S -= took;
        pH = Math.min(7.8, pH + took / ((V + drink / 2)) * 1.0);
        if (top === 'water') { pH = Math.min(7.8, pH + 0.02 * (b.v - V) / b.v); V = b.v; }
        else if (top === 'half' || top === 'full') { S += (b.v - V) * ec0 * (top === 'half' ? 0.5 : 1); V = b.v; }
        if (top === 'none' && V < b.v * 0.15 && dry == null) dry = d;
        ec.push([d, S / V]); ph.push([d, pH]);
      }
      const over = ph.find(p => p[1] > 6.5);
      return { ec, ph, dry, over: over ? over[0] : null };
    };
    const mk = (id, kind) => h.chart($('#' + id, el), {
      label: kind === 'ec' ? 'EC раствора по дням' : 'pH раствора по дням',
      h: w => Math.round(clamp(w * 0.34, 170, 220)),
      draw(w, hh) {
        const r = run(), pts = kind === 'ec' ? r.ec : r.ph;
        const yr = kind === 'ec' ? [0, Math.max(2.4, Math.ceil(Math.max(...pts.map(p => p[1])) * 2) / 2)] : [5, 8];
        const yt = kind === 'ec' ? [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].filter(v => v <= yr[1]) : [5, 5.5, 6, 6.5, 7, 7.5, 8];
        const P = h.plot({ w, h: hh, clip: true, x: [0, 14], y: yr, xticks: [0, 2, 4, 6, 8, 10, 12, 14], yticks: yt, fx: v => v + ' д', fy: v => fmt(v), ylab: kind === 'ec' ? 'EC, мС/см' : 'pH', xlab: kind === 'ec' ? '' : 'дни',
          hbands: [kind === 'ec' ? { y0: 1, y1: 1.6, cls: 'is-good', label: 'норма' } : { y0: 5.5, y1: 6.5, cls: 'is-good', label: 'норма' }],
          series: [{ pts, cls: kind === 'ec' ? 's4' : 's3', label: kind === 'ec' ? 'EC' : 'pH', labelAt: 12, ldy: -10 }], hover });
        let s = P.s;
        if (hover != null) { const p = pts[Math.round(hover)]; s += h.tip(P.X(hover), P.p.t + 4, w, [`день ${hover}`, `${kind === 'ec' ? 'EC' : 'pH'}: ${fmt(p[1], 2)}`]); }
        return s;
      },
      onPointer(x, y, w, hh, k) {
        const P = h.plot({ w, h: hh, x: [0, 14], y: [0, 1] });
        hover = k === 'leave' ? null : clamp(Math.round(P.inv(x)), 0, 14);
        cEC.redraw(); cPH.redraw();
      }
    });
    const cEC = mk('lab-dr-ec', 'ec'), cPH = mk('lab-dr-ph', 'ph');
    const upd = () => {
      const r = run(), e14 = r.ec[14][1], p14 = r.ph[14][1], de = e14 - ec0;
      set(el, 'lab-dr-e14', `${fmt(e14, 2)} (${de >= 0 ? '+' : '−'}${fmt(Math.abs(de), 2)})`);
      set(el, 'lab-dr-p14', fmt(p14, 1));
      set(el, 'lab-dr-pd', r.over == null ? 'не выйдет' : `на ${r.over}-й день`);
      set(el, 'lab-dr-v', r.dry != null ? `Без долива ёмкость почти пуста к ${r.dry}-му дню: кусты выпьют раствор быстрее, чем он выработается.`
        : de > 0.3 ? `EC растёт: кусты пьют воду быстрее, чем берут соли${top === 'none' ? ', и соли остаются в банке' : ''}. ${top === 'water' ? 'Раствор пора менять' : 'Доливайте чистой водой'}, а раствор меняйте раз в 2–3 недели.`
          : de < -0.3 ? `EC падает: соли уходят с каждым днём, а долив их не возвращает. ${top === 'half' ? 'Доливайте раствором покрепче или меняйте раствор раньше' : 'Доливайте раствором половинной или той же крепости'}.`
            : `EC держится. ${r.over != null ? `А pH ползёт вверх и к ${r.over}-му дню выходит за 6,5 — поправьте его pH-минусом.` : 'pH почти стоит — проверяйте раз в 2–3 дня.'}`);
      cEC.redraw(); cPH.redraw();
    };
    h.bindPick(el, 'lab-dr-b', v => { box = v; upd(); });
    h.bindPick(el, 'lab-dr-a', v => { air = v; upd(); });
    h.bindPick(el, 'lab-dr-t', v => { top = v; upd(); });
    h.bindRange(el, 'lab-dr-e', v => `${fmt(v, 2)} мС/см`, v => { ec0 = v; upd(); });
    upd();
  });
