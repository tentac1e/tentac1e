  register('gdd', el => {
    el.innerHTML = h.head('Сколько ждать урожая', 'Базовая температура 10 °C; при 22 °C первая срезка — примерно через 7 недель. Выше 30 °C модель прибавки не даёт.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-gdd-t', 'Средняя температура суток', 12, 32, 0.5, 17)}</div>
       <div class="gdd-bars" id="lab-gdd-bars"></div>` +
      h.readHtml([['Градусо-дней в сутки', 'lab-gdd-d'], ['До первой срезки', 'lab-gdd-w'], ['По сравнению с 22 °C', 'lab-gdd-r']]);
    const weeks = T => T <= 10.5 ? Infinity : 588 / (7 * (Math.min(T, 30) - 10));
    const upd = T => {
      const wk = weeks(T), ref = weeks(22);
      const max = 20;
      $('#lab-gdd-bars', el).innerHTML = [['Ваше лето', wk, 's1'], ['Эталон, 22 °C', ref, 's3']].map(([n, v, c]) =>
        `<div class="gdd-row"><span>${n}</span><i class="${c}" style="--w:${clamp(v / max, 0.02, 1) * 100}%"></i><b>${isFinite(v) ? fmt(v) + ' нед.' : '—'}</b></div>`).join('');
      set(el, 'lab-gdd-d', fmt(Math.max(0, Math.min(T, 30) - 10)));
      set(el, 'lab-gdd-w', isFinite(wk) ? `≈ ${fmt(wk)} нед.` : 'рост стоит');
      set(el, 'lab-gdd-r', isFinite(wk) ? (wk > ref ? `в ${fmt(wk / ref)} раза медленнее` : `в ${fmt(ref / wk)} раза быстрее`) : '—');
    };
    h.bindRange(el, 'lab-gdd-t', v => `${fmt(v)} °C`, upd);
    upd(17);
  });
