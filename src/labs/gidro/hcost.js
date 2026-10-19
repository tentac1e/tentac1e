  /* What a pot and a hydroponic system cost to start and to keep, and what their leaves would cost in a shop.
     Prices are a guide from the big marketplaces in autumn 2026, the harvest is a typical one for a bush under good
     light (hydroponics a third more); both are assumptions, and the reader can put in their own start and tariff. */
  const HC_SYS = {
    kratky: { name: 'банки Кратки', shared: 2300, unit: 1, unitCost: 140, pump: 0, solution: 7.5 },
    dwc: { name: 'ведро DWC', shared: 3100, unit: 4, unitCost: 1950, pump: 3, solution: 12 },
    farm: { name: 'готовая ферма', shared: 2300, unit: 8, unitCost: 12000, pump: 2, solution: 10, lamp: 24 }
  };
  const HC_LIGHT = { lamp: { name: 'лампа 14–16 часов', pot: 60, hydro: 80 }, sun: { name: 'солнечное окно, без лампы', pot: 70, hydro: 90 } };
  register('hcost', el => {
    el.innerHTML = h.head('Во что обойдётся и когда окупится', 'Старт, расходы в месяц и цена 100 г зелени — горшок, гидропоника и магазин. Цены — ориентир по крупным маркетплейсам осенью 2026 года, урожай — типичный для куста при хорошем свете; впишите свои цифры.') +
      `<div class="lab-controls">
        ${pickHtml('lab-hc-sys', 'Гидропоника', Object.keys(HC_SYS).map(k => [k, HC_SYS[k].name]), 'dwc')}
        ${pickHtml('lab-hc-l', 'Свет', Object.keys(HC_LIGHT).map(k => [k, HC_LIGHT[k].name]), 'lamp')}
        ${h.rangeHtml('lab-hc-n', 'Кустов', 1, 12, 1, 4)}
        <div class="hcost-row">
          <div class="field"><label for="lab-hc-start">Старт гидропоники, ₽</label><input type="number" id="lab-hc-start" min="0" max="200000" step="100" inputmode="numeric"></div>
          <div class="field"><label for="lab-hc-tar">Тариф, ₽ за кВт·ч</label><input type="number" id="lab-hc-tar" min="0" max="50" step="0.1" value="8.9" inputmode="decimal"></div>
          <div class="field"><label for="lab-hc-shop">Базилик в магазине, ₽ за 100 г</label><input type="number" id="lab-hc-shop" min="0" max="5000" step="10" value="400" inputmode="numeric"></div>
        </div>
        <p class="lab-foot" id="lab-hc-own" hidden>Старт — ваша цифра. <button class="chip" type="button" id="lab-hc-reset">Вернуть ориентир</button></p>
      </div>
      <div class="hcost-cols" id="lab-hc-cols" aria-live="polite"></div>
      <div class="lab-chart" id="lab-hc-ch"></div>
      <ul class="legend legend-lines"><li><i class="k-s1"></i>гидропоника</li><li><i class="k-s2"></i>горшок</li><li><i class="k-s3"></i>та же зелень из магазина</li></ul>` +
      h.readHtml([['Окупится против магазина', 'lab-hc-pay'], ['Вывод', 'lab-hc-v', 'is-wide']]);
    let sys = 'dwc', light = 'lamp', N = 4, own = false, hover = null;
    const num = id => { const v = parseFloat(String($('#' + id, el).value).replace(',', '.')); return isFinite(v) && v >= 0 ? v : 0; };
    const lampW = () => light === 'lamp' ? Math.max(20, N * 8) : 0;
    const autoStart = () => { const s = HC_SYS[sys]; return s.shared + Math.ceil(N / s.unit) * s.unitCost + (light === 'lamp' && !s.lamp ? lampPrice() : 0); };
    const lampPrice = () => 1000 + 60 * lampW();
    const calc = () => {
      const s = HC_SYS[sys], L = HC_LIGHT[light], tar = num('lab-hc-tar'), shop = num('lab-hc-shop'), units = Math.ceil(N / s.unit);
      const kwh = w => w * 30 / 1000;
      // the lamp burns 15 hours a day for a pot and for a system alike; a farm has its own
      const lampKwh = light === 'lamp' ? kwh(lampW() * 15) : 0;
      const hydroLamp = s.lamp ? kwh(s.lamp * units * 15) : lampKwh;
      const hydroMonth = (hydroLamp + kwh(s.pump * units * 24)) * tar + N * s.solution * 4;
      const potMonth = lampKwh * tar + N * (15 + 25);
      const potStart = 300 + N * 250 + (light === 'lamp' ? lampPrice() : 0);
      const hydroStart = num('lab-hc-start');
      const gHydro = N * L.hydro, gPot = N * L.pot;
      // the first month goes to growing: leaves from the second on
      const spend = (start, month) => Array.from({ length: 13 }, (_, m) => [m, start + month * m]);
      const shopLine = Array.from({ length: 13 }, (_, m) => [m, Math.max(0, m - 1) * gHydro / 100 * shop]);
      const per100 = (start, month, g) => (start + month * 12) / (g * 11 / 100);
      const gain = gHydro / 100 * shop - hydroMonth;
      const pay = gain > 0 ? 1 + hydroStart / gain : null;
      return { hydroMonth, potMonth, potStart, hydroStart, gHydro, gPot, shop, hydro: spend(hydroStart, hydroMonth), pot: spend(potStart, potMonth), shopLine,
        p100h: per100(hydroStart, hydroMonth, gHydro), p100p: per100(potStart, potMonth, gPot), pay, kwhMonth: hydroLamp + kwh(s.pump * units * 24) };
    };
    const money = v => h.nb(`${fmt0(Math.round(v / 10) * 10)} ₽`);
    const ch = h.chart($('#lab-hc-ch', el), {
      label: 'Сколько денег уйдёт за год: гидропоника, горшок и та же зелень из магазина',
      draw(w, hh) {
        const r = calc(), mx = Math.max(...r.hydro.map(p => p[1]), ...r.pot.map(p => p[1]), ...r.shopLine.map(p => p[1]), 1000);
        const st = [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000].find(x => mx / x <= 5) || 200000, top = Math.ceil(mx * 1.05 / st) * st;
        const yt = []; for (let v = 0; v <= top; v += st) yt.push(v);
        const P = h.plot({ w, h: hh, clip: true, x: [0, 12], y: [0, top], pad: { l: 54 }, xticks: [0, 2, 4, 6, 8, 10, 12], yticks: yt, fx: v => String(v), fy: v => v >= 1000 ? fv(v / 1000) + ' тыс' : fmt0(v), ylab: 'рублей всего', xlab: 'месяцев',
          series: [{ pts: r.hydro, cls: 's1', label: 'гидропоника', labelAt: 9, ldy: -10 }, { pts: r.pot, cls: 's2', label: 'горшок', labelAt: 11, ldy: 16 }, { pts: r.shopLine, cls: 's3', label: 'магазин', labelAt: 6, ldy: -10 }], hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${hover} мес`, `гидропоника: ${fmt0(r.hydro[hover][1])} ₽`, `горшок: ${fmt0(r.pot[hover][1])} ₽`, `магазин: ${fmt0(r.shopLine[hover][1])} ₽`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, pad: { l: 54 }, x: [0, 12], y: [0, 1] });
        hover = kind === 'leave' ? null : clamp(Math.round(P.inv(x)), 0, 12);
        ch.redraw();
      }
    });
    const startIn = $('#lab-hc-start', el);
    const fillStart = () => { if (!own) startIn.value = String(autoStart()); $('#lab-hc-own', el).hidden = !own; };
    const upd = () => {
      fillStart();
      const r = calc();
      $('#lab-hc-cols', el).innerHTML = [['Горшок', r.potStart, r.potMonth, r.gPot, r.p100p, 's2'], ['Гидропоника', r.hydroStart, r.hydroMonth, r.gHydro, r.p100h, 's1']].map(([n, st, mo, g, p, c]) =>
        `<div class="hcost-col ${c}"><p class="hcost-h">${n}</p><dl>
          <div><dt>Старт</dt><dd>${money(st)}</dd></div>
          <div><dt>В месяц</dt><dd>${money(mo)}</dd></div>
          <div><dt>Зелени в месяц</dt><dd>${h.nb(`≈ ${fmt0(g)} г`)}</dd></div>
          <div><dt>100 г в первый год</dt><dd>${money(p)}</dd></div></dl></div>`).join('') +
        `<div class="hcost-col s3"><p class="hcost-h">Магазин</p><dl><div><dt>100 г</dt><dd>${money(r.shop)}</dd></div><div><dt>Столько же зелени в месяц</dt><dd>${money(r.gHydro / 100 * r.shop)}</dd></div></dl></div>`;
      set(el, 'lab-hc-pay', r.pay == null ? 'не окупится' : r.pay > 24 ? 'больше двух лет' : h.nb(`за ≈ ${fmt0(Math.ceil(r.pay))} ${h.plural(Math.ceil(r.pay), 'месяц', 'месяца', 'месяцев')}`));
      set(el, 'lab-hc-v', h.nb(r.pay == null
        ? 'Свет и раствор стоят дороже зелени, которую дают кусты: для такого числа кустов выгоднее горшок или магазин.'
        : `Электричество — ≈ ${fmt(r.kwhMonth, 1)} кВт·ч в месяц${light === 'lamp' ? ', почти всё — лампа: её тратит и горшок' : ''}. ` +
          (r.p100h < r.p100p ? 'Гидропоника даёт 100 г зелени дешевле горшка: больше урожая на те же лампу и место.' : 'В первый год 100 г из горшка дешевле: старт гидропоники окупается урожаем, но не сразу. На второй год, когда приборы и бак уже куплены, разница сходит на нет.')));
      ch.redraw();
    };
    startIn.addEventListener('input', () => { own = true; upd(); });
    $('#lab-hc-reset', el).addEventListener('click', () => { own = false; upd(); });
    $$('#lab-hc-tar, #lab-hc-shop', el).forEach(i => i.addEventListener('input', upd));
    h.bindPick(el, 'lab-hc-sys', v => { sys = v; upd(); });
    h.bindPick(el, 'lab-hc-l', v => { light = v; upd(); });
    h.bindRange(el, 'lab-hc-n', v => `${fmt0(v)}`, v => { N = v; upd(); });
    upd();
  });
