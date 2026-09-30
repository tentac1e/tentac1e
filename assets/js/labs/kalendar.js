/* Гид по базилику — живые модели главы «Календарь». Файл собирает scripts/build.py из src/labs/kalendar/ — правьте там */
(() => {
  'use strict';
  const { register, api: h } = window.BasilScience;
  const S = window.BasilScene;
  const { $, $$, clamp, lerp, fmt, fmt0, esc } = h;
  const NS = 'http://www.w3.org/2000/svg';
  const r1 = v => Math.round(v * 10) / 10;
  const pct = v => `${fmt0(v * 100)} %`;
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const set = (root, id, html) => { const e = $('#' + id, root); if (e) e.innerHTML = html; };
  const doyToday = () => { const t = new Date(); return Math.round((t - new Date(t.getFullYear(), 0, 0)) / 864e5); };
  const doyLabel = n => { const d = new Date(2023, 0, n); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
  const citiesChips = (id, lat) => h.chipsHtml(id, 'Город', h.CITIES.map(([l, n]) => [l, n]), lat);

  register('daylen', el => {
    el.innerHTML = h.head('Длина дня за год', 'Астрономический расчёт с поправкой на рефракцию. Коснитесь графика, чтобы увидеть любой день.') +
      `<div class="lab-controls">${citiesChips('lab-dl-city', 55.8)}${h.rangeHtml('lab-dl-lat', 'Широта', 40, 70, 0.1, 55.8)}</div>
       <div class="lab-chart" id="lab-dl-ch"></div>` +
      h.readHtml([['Сегодня', 'lab-dl-t'], ['Самый длинный день', 'lab-dl-max'], ['Самый короткий', 'lab-dl-min']]);
    let lat = 55.8, hover = null;
    const today = doyToday();
    const series = () => { const a = []; for (let n = 1; n <= 365; n += 2) a.push([n, h.dayLength(lat, n)]); return a; };
    const MSTART = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
    const ch = h.chart($('#lab-dl-ch', el), {
      label: 'Длина дня по дням года',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [1, 365], y: [0, 24], xticks: w > 520 ? MSTART.map(v => v + 14) : [15, 105, 196, 288], fx: v => MONTHS[MSTART.findIndex(s => s + 14 === v)] || MONTHS[Math.floor((v - 1) / 30.5)], yticks: [0, 6, 12, 18, 24], ylab: 'часов',
          hbands: [{ y0: 14, y1: 16, cls: 'is-good', label: 'нужно под лампой' }],
          series: [{ pts: series(), cls: 's1', area: true }],
          marker: { x: today, dots: [{ y: h.dayLength(lat, today), cls: 's1' }] }, hover });
        let s = P.s + `<text class="tick" x="${P.X(today)}" y="${P.p.t - 8}" text-anchor="middle">сегодня</text>`;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 16, w, [doyLabel(hover), `${fmt(h.dayLength(lat, hover))} ч`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [1, 365], y: [0, 24] });
        hover = kind === 'leave' ? null : clamp(Math.round(P.inv(x)), 1, 365);
        ch.redraw();
      }
    });
    const upd = () => {
      set(el, 'lab-dl-t', `${fmt(h.dayLength(lat, today))} ч`);
      set(el, 'lab-dl-max', `${fmt(h.dayLength(lat, 172))} ч`);
      set(el, 'lab-dl-min', `${fmt(h.dayLength(lat, 355))} ч`);
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-dl-lat', v => `${fmt(v)}° с. ш.`, v => { lat = v; city.set(''); upd(); });
    const city = h.bindPick(el, 'lab-dl-city', v => { lat = +v; rng.input.value = v; $('#lab-dl-lat-v', el).textContent = `${fmt(+v)}° с. ш.`; upd(); });
    upd();
  });

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
})();
