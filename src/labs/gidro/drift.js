  /* Two weeks of a solution: every day the bushes drink water (more in heat and dry air) and take salts with it at
     their own «uptake EC». When that is below the solution's EC, the salts stay behind and EC climbs; above it,
     EC falls. Taking nitrate makes the roots give out OH⁻, so pH climbs in proportion to what they took
     (illustrative). Shown on two scales with their zones: where the solution was on day 0 and where it is now. */
  const DR_BOX = { jar: { name: 'банка 3 л, 1 куст', v: 3, n: 1 }, bucket: { name: 'ведро 15 л, 4 куста', v: 15, n: 4 } };
  const DR_AIR = { dry: { name: 'жарко и сухо', e: 1.5, c: 0.8 }, norm: { name: 'обычно', e: 1, c: 1.15 }, wet: { name: 'прохладно и сыро', e: 0.6, c: 1.6 } };
  const DR_TOP = { none: 'не доливать', water: 'водой', half: 'раствором ½', full: 'раствором той же EC' };
  const DR_EC = [[0, 0.8, 'warn', 'слабо'], [0.8, 1.8, 'good', 'норма'], [1.8, 3, 'bad', 'крепко']];
  const DR_PH = [[5, 5.5, 'warn'], [5.5, 6.5, 'good', 'норма'], [6.5, 7, 'warn'], [7, 8, 'bad', 'высоко']];
  register('drift', el => {
    el.innerHTML = h.head('Куда уплывёт раствор', 'Взрослые кусты каждый день пьют воду и берут соли. Кружок — где был раствор в день смены, точка — где он сейчас. Модель условная, но направление дрейфа она показывает верно.', true) +
      `<div class="lab-controls">
        ${pickHtml('lab-dr-b', 'Ёмкость', Object.keys(DR_BOX).map(k => [k, DR_BOX[k].name]), 'bucket')}
        ${pickHtml('lab-dr-a', 'Воздух', Object.keys(DR_AIR).map(k => [k, DR_AIR[k].name]), 'norm')}
        ${pickHtml('lab-dr-t', 'Каждый вечер доливать', Object.keys(DR_TOP).map(k => [k, DR_TOP[k]]), 'water')}
        ${h.rangeHtml('lab-dr-e', 'EC в день смены', 0.6, 2, 0.05, 1.2)}
        ${h.rangeHtml('lab-dr-d', 'День', 0, 14, 1, 14)}
        <div class="lab-actions"><button class="btn btn-ghost btn-small" type="button" id="lab-dr-play">▶ Прокрутить две недели</button></div>
      </div>
      <div class="dr-out" aria-live="polite">
        <div id="lab-dr-hero"></div>
        <div class="dr-scales"><div class="dr-scale"><p class="dr-h"><span>EC</span><b id="lab-dr-ev"></b></p><div id="lab-dr-ec"></div></div>
          <div class="dr-scale"><p class="dr-h"><span>pH</span><b id="lab-dr-pv"></b></p><div id="lab-dr-ph"></div></div></div>
        <ul class="hy-key"><li><i class="is-from"></i>в день смены</li><li><i class="is-to"></i>сейчас</li></ul>
        <p class="hy-verdict" id="lab-dr-v"></p>
      </div>`;
    let box = 'bucket', air = 'norm', top = 'water', ec0 = 1.2, day = 14;
    const run = () => {
      const b = DR_BOX[box], a = DR_AIR[air], E = b.n * 0.15 * a.e;
      let V = b.v, S = ec0 * b.v, pH = 6;
      const ec = [ec0], ph = [pH];
      let dry = null;
      for (let d = 1; d <= 14; d++) {
        const drink = Math.min(E, V * 0.9), took = Math.min(S, a.c * drink);
        V -= drink; S -= took;
        pH = Math.min(7.8, pH + took / ((V + drink / 2)) * 1.0);
        if (top === 'water') { pH = Math.min(7.8, pH + 0.02 * (b.v - V) / b.v); V = b.v; }
        else if (top === 'half' || top === 'full') { S += (b.v - V) * ec0 * (top === 'half' ? 0.5 : 1); V = b.v; }
        if (top === 'none' && V < b.v * 0.15 && dry == null) dry = d;
        ec.push(S / V); ph.push(pH);
      }
      const over = ph.findIndex(p => p > 6.5);
      return { ec, ph, dry, over: over > 0 ? over : null };
    };
    const upd = () => {
      const r = run(), e = r.ec[day], p = r.ph[day], de = r.ec[14] - ec0;
      set(el, 'lab-dr-ev', h.nb(`${fmt(ec0, 1)} → ${fmt(e, 1)}`));
      set(el, 'lab-dr-pv', h.nb(`6,0 → ${fmt(p, 1)}`));
      set(el, 'lab-dr-ec', hyScale({ min: 0, max: 3, zones: DR_EC, ticks: [0, 1, 2, 3], fmt: v => fmt0(v), from: ec0, to: e, state: hyZone(DR_EC, e), label: `EC: в день смены ${fmt(ec0, 1)}, на ${day}-й день ${fmt(e, 1)}` }));
      set(el, 'lab-dr-ph', hyScale({ min: 5, max: 8, zones: DR_PH, ticks: [5, 6, 7, 8], fmt: v => fmt0(v), from: 6, to: p, state: hyZone(DR_PH, p), label: `pH: в день смены 6,0, на ${day}-й день ${fmt(p, 1)}` }));
      set(el, 'lab-dr-hero', r.dry != null ? hyHero(`${r.dry}-й день`, 'и ёмкость почти пуста: без долива кусты выпьют её до дна')
        : r.over != null ? hyHero(`${r.over}-й день`, 'pH выйдет за 6,5 — пора опустить его pH-минусом')
          : hyHero('две недели', 'pH держится в норме — проверяйте раз в 2–3 дня'));
      set(el, 'lab-dr-v', h.nb(r.dry != null ? 'Без долива уровень падает быстрее, чем вырабатывается раствор: доливайте каждый вечер.'
        : de > 0.3 ? `EC растёт: кусты пьют воду быстрее, чем берут соли${top === 'none' ? ', и соли остаются в ёмкости' : ''}. Доливайте чистой водой, а раствор меняйте раз в 2–3 недели.`
          : de < -0.3 ? `EC падает: соли уходят с каждым днём, а долив их не возвращает. ${top === 'half' ? 'Доливайте раствором покрепче или меняйте раствор раньше' : 'Доливайте раствором половинной или той же крепости'}.`
            : 'EC держится: так и доливайте.'));
    };
    h.bindPick(el, 'lab-dr-b', v => { box = v; upd(); });
    h.bindPick(el, 'lab-dr-a', v => { air = v; upd(); });
    h.bindPick(el, 'lab-dr-t', v => { top = v; upd(); });
    h.bindRange(el, 'lab-dr-e', v => `${fmt(v, 2)} мС/см`, v => { ec0 = v; upd(); });
    const dd = h.bindRange(el, 'lab-dr-d', v => `${fmt0(v)}`, v => { day = v; upd(); });
    // the play button runs the two weeks by, a day in about a third of a second
    let t0 = 0;
    const play = S.loop(ts => {
      if (!t0) t0 = ts;
      const v = Math.min(14, Math.floor((ts - t0) / 330));
      if (v !== day) dd.set(v);
      if (v >= 14) { play.stop(); t0 = 0; return; }
      play.next();
    });
    $('#lab-dr-play', el).addEventListener('click', () => {
      if (play.on) { play.stop(); t0 = 0; return; }
      if (h.reduce.matches) { dd.set(14); return; }
      dd.set(0); t0 = 0; play.start();
    });
    upd();
  });
