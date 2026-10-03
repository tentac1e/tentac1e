/* Гид по базилику — живые модели главы «Мой базилик». Файл собирает scripts/build.py из src/labs/moy/ — правьте там */
(() => {
  'use strict';
  const { register, illustrate, api: h } = window.BasilScience;
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

  const { agro } = window.BasilLibs;
  window.BasilScience.styleFor("moy", "/* «Погода глазами листа»: the place, the week, 48 hours */\n.wx-body { display: grid; gap: 16px; }\n.wx-find { display: grid; gap: 8px; }\n.wx-find label { font: 700 .82rem/1.2 var(--font-body); color: var(--ink-2); }\n.wx-find-row { display: flex; flex-wrap: wrap; gap: 8px; }\n.wx-find-row input {\n  flex: 1 1 220px;\n  min-width: 0;\n  min-height: 46px;\n  padding: 11px 12px;\n  border: 1px solid var(--line-strong);\n  border-radius: var(--radius-sm);\n  background: var(--surface);\n  color: var(--ink);\n  font: 500 1rem/1.2 var(--font-body);\n}\n.wx-found { display: grid; gap: 6px; margin: 4px 0 0; padding: 0; list-style: none; }\n.wx-pick {\n  display: grid;\n  width: 100%;\n  min-height: 44px;\n  padding: 8px 12px;\n  border: 1px solid var(--line);\n  border-radius: 12px;\n  background: var(--surface-2);\n  color: var(--ink);\n  font: 600 .92rem/1.25 var(--font-body);\n  text-align: left;\n  cursor: pointer;\n}\n.wx-pick small { font-weight: 500; font-size: .78rem; color: var(--ink-3); }\n.wx-pick:hover { border-color: var(--basil); }\n.wx-msg { margin: 0; font-size: .86rem; color: var(--ink-2); }\n.wx-find .g-link { justify-self: start; }\n\n.wx-place { display: grid; gap: 2px; }\n.wx-place p { margin: 0; }\n.wx-place b { font: 600 1.25rem/1.2 var(--font-display); }\n.wx-place small { color: var(--ink-3); font-size: .82rem; }\n.wx-age { font-size: .8rem; color: var(--ink-3); }\n.wx-place-a { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 4px; }\n\n/* the week: a row of days that scrolls sideways on a phone */\n.wx-days { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(118px, 1fr); gap: 8px; margin: 0; padding: 0 0 4px; overflow-x: auto; list-style: none; scrollbar-width: thin; }\n.wx-day {\n  display: grid;\n  gap: 4px;\n  align-content: start;\n  padding: 10px;\n  border: 1px solid var(--line);\n  border-radius: 14px;\n  background: var(--surface);\n  font-size: .82rem;\n}\n.wx-dname { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 6px; font: 700 .86rem/1.2 var(--font-body); }\n.wx-dname small { font: 500 .72rem/1.4 var(--font-mono); color: var(--ink-3); }\n.wx-n, .wx-x { display: flex; justify-content: space-between; gap: 6px; font: 700 .92rem/1.2 var(--font-body); white-space: nowrap; }\n.wx-n small, .wx-x small { font: 500 .72rem/1.5 var(--font-body); color: var(--ink-3); }\n.wx-r, .wx-s { display: flex; align-items: center; gap: 4px; min-height: 18px; color: var(--ink-2); }\n.wx-r .ico, .wx-s .ico { width: 13px; height: 13px; flex: none; }\n.wx-r .ico { color: var(--wx-rain); }\n.wx-s .ico { color: var(--oil-bright); }\n.wx-vpd { justify-self: start; padding: 2px 7px; border-radius: 999px; font: 600 .72rem/1.4 var(--font-mono); color: var(--ink); }\n.wx-vpd.z0 { background: var(--z0); } .wx-vpd.z1 { background: var(--z1); } .wx-vpd.z2 { background: var(--z2); } .wx-vpd.z3 { background: var(--z3); } .wx-vpd.z4 { background: var(--z4); }\n.wx-day.is-cold { border-color: var(--wx-cold); background: var(--wx-cold-soft); }\n.wx-day.is-cold .wx-n { color: var(--wx-cold); }\n.wx-day.is-frost { border-color: var(--wx-frost); background: var(--wx-cold-soft); }\n.wx-day.is-frost .wx-n { color: var(--wx-frost); }\n.wx-day.is-hot { border-color: var(--wx-hot); }\n.wx-day.is-hot .wx-x { color: var(--wx-hot); }\n.wx-day.is-hot:not(.is-cold):not(.is-frost) { background: var(--wx-hot-soft); }\n\n/* what the day's air is for a leaf */\n.wx-leaf { padding: 14px 16px; border-radius: 16px; background: var(--sci-phys-soft); }\n.wx-leaf h4 { margin: 0 0 6px; font: 700 .9rem/1.25 var(--font-body); color: var(--sci-phys); }\n.wx-leaf p { margin: 0; font-size: .9rem; line-height: 1.5; color: var(--ink-2); }\n\n.wx-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 14px; }\n.wx-chart { margin: 0; min-width: 0; }\n.wx-chart figcaption { margin-bottom: 2px; font: 600 .8rem/1.3 var(--font-body); color: var(--ink-3); }\n.lab-svg .band.is-hot { fill: var(--wx-hot-soft); }\n.lab-svg .band.wx-z0 { fill: var(--z0); opacity: .35; } .lab-svg .band.wx-z1 { fill: var(--z1); opacity: .35; } .lab-svg .band.wx-z2 { fill: var(--z2); opacity: .35; }\n.lab-svg .band.wx-z3 { fill: var(--z3); opacity: .35; } .lab-svg .band.wx-z4 { fill: var(--z4); opacity: .35; }\n.wx-src { margin: 0; font-size: .76rem; color: var(--ink-3); }\n\n/* the tab's text under the model */\n.wx-about { margin-top: 26px; }\n\n");
  /* @use agro */
  /* The weather tab of «Мой базилик»: the place, the week ahead for a basil leaf, and 48 hours of the temperature and
     of the air's pull on the leaf (VPD, zones as in the model «VPD»). The forecast is fetched and kept by the
     interface (BasilGarden.weather): this model only shows it and asks for a fresh one. */
  register('weather', el => {
    const G = window.BasilGarden, W = G && G.weather, D = window.BASIL;
    el.innerHTML = h.head('Погода глазами листа', 'Неделя для вашего места: холодные ночи, жара, дождь и то, как сильно воздух тянет воду из листа.') + '<div class="wx-body" id="wx-body"></div>';
    const body = $('#wx-body', el);
    if (!W) { body.innerHTML = '<p class="muted">Погода появится, когда страница загрузится полностью.</p>'; return; }
    const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const dayOf = iso => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
    const src = '<p class="wx-src">Погода: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>, CC&nbsp;BY&nbsp;4.0. Наружу уходят только координаты места.</p>';
    let found = [], msg = '', changing = false, busy = false;

    // the place: by name, or where the phone is
    const findForm = () => `<form class="wx-find" id="wx-find" novalidate>
        <label for="wx-q">${W.place() ? 'Другое место' : 'Где растёт ваш базилик'}</label>
        <div class="wx-find-row"><input id="wx-q" type="search" autocomplete="off" maxlength="60" placeholder="Город или посёлок, например Воронеж" enterkeyhint="search">
          <button class="btn btn-primary btn-small" type="submit">Найти</button>
          <button class="btn btn-ghost btn-small" type="button" data-wx-here>${h.icon('home')}Где я</button></div>
        ${found.length ? `<ul class="wx-found">${found.map((x, i) => `<li><button type="button" class="wx-pick" data-wx-pick="${i}"><b>${esc(x.name)}</b><small>${esc(x.region)}</small></button></li>`).join('')}</ul>` : ''}
        ${msg ? `<p class="wx-msg" role="status">${msg}</p>` : ''}
        ${W.place() ? '<button class="g-link" type="button" data-wx-cancel>Оставить прежнее место</button>' : ''}
      </form>`;

    // a day for a leaf: the night, the day, rain, sun and the afternoon air
    const dayCard = (d, i) => {
      const z = d.vpd === null ? null : agro.zoneOf(d.vpd);
      const date = dayOf(d.d);
      const cls = [d.min < 0.5 ? 'is-frost' : d.min < 10 ? 'is-cold' : '', d.max >= 30 ? 'is-hot' : ''].filter(Boolean).join(' ');
      return `<li class="wx-day ${cls}">
          <b class="wx-dname">${i === 0 ? 'сегодня' : i === 1 ? 'завтра' : WD[date.getDay()]}<small>${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}</small></b>
          <span class="wx-n"><small>ночь</small>${W.t(d.min)}</span>
          <span class="wx-x"><small>день</small>${W.t(d.max)}</span>
          <span class="wx-r">${d.rain >= 0.5 ? `${h.icon('drop')}${fmt(d.rain, d.rain < 10 ? 1 : 0)} мм` : '&nbsp;'}</span>
          <span class="wx-s">${d.sun !== null ? `${h.icon('sun')}${fmt0(d.sun)} ч` : '&nbsp;'}</span>
          ${z ? `<span class="wx-vpd ${z[1]}" title="VPD днём: ${z[2].toLowerCase()}">VPD ${fmt(d.vpd)}</span>` : ''}
        </li>`;
    };

    const render = () => {
      const w = W.place(), c = W.get();
      if (!w || changing) { body.innerHTML = findForm() + src; return; }
      const days = c ? c.days : [];
      const t0 = days[0];
      const z = t0 && t0.vpd !== null ? agro.zoneOf(t0.vpd) : null;
      const zi = z ? agro.VPD_Z.indexOf(z) : -1;
      body.innerHTML = `<div class="wx-place">
          <p><b>${esc(w.name)}</b>${w.region ? ` <small>${esc(w.region)}</small>` : ''}</p>
          <p class="wx-age" role="status">${busy ? 'Обновляется…' : c ? 'Прогноз получен ' + W.age(c.at) : 'Прогноза пока нет: нужна сеть'}${msg ? ' · ' + msg : ''}</p>
          <div class="wx-place-a"><button class="g-link" type="button" data-wx-refresh>Обновить</button><button class="g-link" type="button" data-wx-change>Другое место</button></div>
        </div>
        ${days.length ? `<ol class="wx-days">${days.map(dayCard).join('')}</ol>` : ''}
        ${zi >= 0 ? `<div class="wx-leaf"><h4>Сегодня для листа: ${z[2].toLowerCase()}</h4><p>${h.nb(D.WEATHER.leaf[zi])}</p></div>` : ''}
        ${c && c.hours.length > 6 ? `<div class="wx-charts"><figure class="wx-chart"><figcaption>Температура, 48 часов</figcaption><div id="wx-ch-t"></div></figure><figure class="wx-chart"><figcaption>Как воздух тянет воду из листа (VPD), 48 часов</figcaption><div id="wx-ch-v"></div></figure></div>` : ''}
        ${src}`;
      if (c && c.hours.length > 6) charts(c.hours);
    };

    // hours along x; a tick at midnight (the day's name) and at noon, at 6 and 18 too on a wide screen
    function charts(hours) {
      const n = hours.length;
      const ticks = w => hours.map((x, i) => [i, x.t.slice(11, 13)]).filter(([, hh]) => (w < 480 ? ['00', '12'] : ['00', '06', '12', '18']).includes(hh)).map(([i]) => i);
      const fx = i => { const t = hours[i].t, hh = t.slice(11, 13); return hh === '00' ? WD[dayOf(t).getDay()] : hh + ':00'; };
      const lo = Math.floor(Math.min(...hours.map(x => x.T)) / 5) * 5 - 5, hi = Math.ceil(Math.max(...hours.map(x => x.T)) / 5) * 5 + 5;
      const ty = []; for (let v = lo; v <= hi; v += (hi - lo > 30 ? 10 : 5)) ty.push(v);
      h.chart($('#wx-ch-t', body), {
        label: 'Температура воздуха на 48 часов вперёд',
        h: w => (w < 480 ? 190 : 220),
        draw(w, hh) {
          const bands = [];
          if (lo < 10) bands.push({ y0: lo, y1: Math.min(10, hi), cls: 'is-cold', label: 'ниже +10 °C — рост встаёт' });
          if (hi > 30) bands.push({ y0: Math.max(30, lo), y1: hi, cls: 'is-hot', label: 'жара' });
          const P = h.plot({ w, h: hh, x: [0, n - 1], y: [lo, hi], xticks: ticks(w), yticks: ty, fx, fy: v => (v > 0 ? '+' : '') + h.minus(String(v)) + '°', ylab: '°C', hbands: bands, series: [{ pts: hours.map((x, i) => [i, x.T]), cls: 's1' }] });
          return P.s;
        }
      });
      const vmax = Math.max(2, Math.ceil(Math.max(...hours.map(x => x.vpd)) * 2) / 2);
      h.chart($('#wx-ch-v', body), {
        label: 'Дефицит давления пара для листа на 48 часов вперёд',
        h: w => (w < 480 ? 190 : 220),
        draw(w, hh) {
          const edges = [0, ...agro.VPD_Z.slice(0, 4).map(z => z[0]), vmax];
          const bands = agro.VPD_Z.map((z, i) => ({ y0: edges[i], y1: Math.min(edges[i + 1], vmax), cls: 'wx-' + z[1], label: i === 2 ? 'оптимум' : '' })).filter(b => b.y1 > b.y0);
          const yt = []; for (let v = 0; v <= vmax + 1e-9; v += vmax > 3 ? 1 : 0.5) yt.push(Math.round(v * 10) / 10);
          const P = h.plot({ w, h: hh, x: [0, n - 1], y: [0, vmax], xticks: ticks(w), yticks: yt, fx, fy: v => fmt(v), ylab: 'кПа', hbands: bands, series: [{ pts: hours.map((x, i) => [i, x.vpd]), cls: 's2' }] });
          return P.s;
        }
      });
    }

    body.addEventListener('submit', e => {
      if (e.target.id !== 'wx-find') return;
      e.preventDefault();
      const q = $('#wx-q', body).value.trim();
      if (q.length < 2) { $('#wx-q', body).focus(); return; }
      msg = 'Ищу…';
      render();
      W.search(q).then(list => { found = list; msg = list.length ? '' : 'Ничего не нашлось — попробуйте написать иначе или ближайший город'; render(); },
        () => { found = []; msg = 'Нет связи с сервисом погоды — попробуйте позже'; render(); });
    });
    body.addEventListener('click', e => {
      const t = e.target.closest('[data-wx-pick], [data-wx-here], [data-wx-refresh], [data-wx-change], [data-wx-cancel]');
      if (!t) return;
      if (t.matches('[data-wx-pick]')) {
        const p = found[+t.dataset.wxPick];
        if (!p) return;
        found = []; msg = ''; changing = false; busy = true;
        render();
        W.set(p).then(() => { busy = false; render(); });
      } else if (t.matches('[data-wx-here]')) {
        msg = 'Узнаю место…';
        render();
        W.here().then(p => { found = []; msg = ''; changing = false; busy = true; render(); return W.set(p); }).then(() => { busy = false; render(); },
          () => { busy = false; msg = 'Не удалось узнать место: разрешите геолокацию или найдите город по названию'; render(); });
      } else if (t.matches('[data-wx-refresh]')) {
        busy = true; msg = '';
        render();
        const before = W.get();
        W.refresh(true).then(c => { busy = false; if (!c || c === before) msg = navigator.onLine === false ? 'нет сети' : 'сервис не ответил'; render(); });
      } else if (t.matches('[data-wx-change]')) {
        changing = true; found = []; msg = '';
        render();
        const q = $('#wx-q', body);
        if (q) q.focus();
      } else if (t.matches('[data-wx-cancel]')) {
        changing = false; found = []; msg = '';
        render();
      }
    });
    W.on(() => { if (!busy) render(); });
    render();
    if (W.place()) W.refresh();
  });
})();
