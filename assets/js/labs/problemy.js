/* Гид по базилику — живые модели главы «Проблемы». Файл собирает scripts/build.py из src/labs/problemy/ — правьте там */
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

  register('pigment', el => {
    el.innerHTML = h.head('Смешайте пигменты', 'Цвет листа по закону Бера — Ламберта: каждый пигмент поглощает свою часть спектра, отражённый остаток и есть цвет.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.chipsHtml('lab-pg-p', 'Пример', [['ok', 'Здоровый'], ['n', 'Нехватка азота'], ['p', 'Нехватка фосфора'], ['opal', 'Фиолетовый сорт'], ['old', 'Старый лист']], 'ok')}
          ${h.rangeHtml('lab-pg-c', 'Хлорофиллы', 0, 100, 1, 85)}${h.rangeHtml('lab-pg-k', 'Каротиноиды', 0, 100, 1, 60)}${h.rangeHtml('lab-pg-a', 'Антоцианы', 0, 100, 1, 5)}</div>
        <div class="pg-out"><svg viewBox="-60 -125 120 135" class="pg-leaf" aria-hidden="true"><use href="#pl-leaf" id="lab-pg-leaf" class="pl-leaf" transform="scale(1)"/></svg><p class="pg-verdict" id="lab-pg-v"></p></div>
      </div>`;
    const K = { c: [2.2, 0.55, 2.2], k: [0.02, 0.35, 1.8], a: [0.25, 2.2, 0.3] };
    const base = [0.47, 0.48, 0.44];
    const v = { c: 85, k: 60, a: 5 };
    const PRE = { ok: [85, 60, 5], n: [22, 55, 5], p: [70, 55, 55], opal: [60, 30, 100], old: [8, 42, 12] };
    const toS = x => { x = clamp(x, 0, 1); return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255); };
    const upd = () => {
      const rgb = [0, 1, 2].map(i => toS(base[i] * Math.exp(-(v.c / 100 * K.c[i] + v.k / 100 * K.k[i] + v.a / 100 * K.a[i]))));
      $('#lab-pg-leaf', el).style.fill = `rgb(${rgb.join(' ')})`;
      const verdict = v.c < 20 && v.k < 30 ? 'Ткань обесцвечена: так выглядит некроз или сильный ожог.' : v.a > 55 && v.c > 35 ? 'Фиолетовый оттенок: антоцианы. У зелёного сорта — сигнал холода или нехватки фосфора.' : v.c < 40 && v.k >= 30 ? 'Хлороз: хлорофилла мало, проступили жёлтые каротиноиды. Ищите нехватку азота (снизу), магния или железа (между жилками).' : 'Здоровый зелёный: хлорофилл маскирует остальные пигменты.';
      set(el, 'lab-pg-v', verdict);
    };
    const rc = h.bindRange(el, 'lab-pg-c', x => x + ' %', x => { v.c = x; upd(); });
    const rk = h.bindRange(el, 'lab-pg-k', x => x + ' %', x => { v.k = x; upd(); });
    const ra = h.bindRange(el, 'lab-pg-a', x => x + ' %', x => { v.a = x; upd(); });
    h.bindPick(el, 'lab-pg-p', k => { rc.set(PRE[k][0]); rk.set(PRE[k][1]); ra.set(PRE[k][2]); });
    upd();
  });

  register('dm', el => {
    el.innerHTML = h.head('Риск ложной мучнистой росы', 'Качественная оценка по трём условиям: ночная влажность для спороношения, мокрые листья для заражения и температура.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-dm-rh', 'Влажность воздуха ночью', 60, 100, 1, 90)}${h.rangeHtml('lab-dm-w', 'Листья мокрые', 0, 12, 0.5, 4)}${h.rangeHtml('lab-dm-t', 'Температура ночью', 10, 28, 1, 18)}</div>
        <div class="dm-out"><svg class="dm-gauge" viewBox="0 0 220 130" aria-hidden="true"><path class="g-track" d="M20 115 A90 90 0 0 1 200 115"/><path class="g-low" d="M20 115 A90 90 0 0 1 47.4 51.4"/><path class="g-mid" d="M47.4 51.4 A90 90 0 0 1 145 27.4"/><path class="g-high" d="M145 27.4 A90 90 0 0 1 200 115"/><line class="g-needle" id="lab-dm-n" x1="110" y1="115" x2="110" y2="36"/><circle class="g-hub" cx="110" cy="115" r="7"/></svg><p class="dm-level" id="lab-dm-l"></p></div>
      </div>` + h.readHtml([['Что делать', 'lab-dm-v', 'is-wide']]);
    const v = { rh: 90, w: 4, t: 18 };
    const upd = () => {
      const s = clamp((v.rh - 82) / 12, 0, 1), i = clamp(v.w / 3, 0, 1), tf = Math.exp(-Math.pow((v.t - 20) / 7, 2));
      const risk = clamp((s * 0.55 + i * 0.45) * tf * (s > 0 ? 1 : 0.4), 0, 1);
      $('#lab-dm-n', el).setAttribute('transform', `rotate(${r1(-90 + risk * 180)} 110 115)`);
      const lvl = risk < 0.25 ? ['Низкий', 'is-low'] : risk < 0.6 ? ['Умеренный', 'is-mid'] : ['Высокий', 'is-high'];
      set(el, 'lab-dm-l', `<span class="zone-pill ${lvl[1]}">${lvl[0]} риск</span>`);
      const tips = [];
      if (v.rh > 85) tips.push('проветривайте ночью или включите вентилятор');
      if (v.w > 2) tips.push('поливайте утром и под корень, чтобы листья успевали высохнуть');
      if (v.t >= 15 && v.t <= 25 && risk > 0.25) tips.push('осматривайте нижнюю сторону листьев каждые 2–3 дня');
      set(el, 'lab-dm-v', tips.length ? h.nb(tips.join('; ').replace(/^./, c => c.toUpperCase()) + '.') : 'Условия для болезни неблагоприятны. Продолжайте в том же духе.');
    };
    h.bindRange(el, 'lab-dm-rh', x => x + ' %', x => { v.rh = x; upd(); });
    h.bindRange(el, 'lab-dm-w', x => `${fmt(x)} ч`, x => { v.w = x; upd(); });
    h.bindRange(el, 'lab-dm-t', x => `${x} °C`, x => { v.t = x; upd(); });
    upd();
  });

  register('aphid', el => {
    el.innerHTML = h.head('Колония из одной тли', 'Модель при 20–25 °C: взрослеют за 8 дней, рожают по 3 личинки в день около трёх недель. Перекорм азотом ускоряет и то и другое.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-ap-d', 'День', 0, 28, 1, 14)}<div class="lab-seg-wrap"><span class="lab-label">Условия</span><div class="chips-row lab-chips" id="lab-ap-x"><button class="chip" type="button" data-x="n" aria-pressed="false">Перекорм азотом</button><button class="chip" type="button" data-x="soap" aria-pressed="false">Мыло на 10-й день</button></div></div></div>
       <div class="lab-chart" id="lab-ap-ch"></div>` + h.readHtml([['Тлей на кусте', 'lab-ap-n'], ['Вывод', 'lab-ap-v', 'is-wide']]);
    const st = { d: 14, n: false, soap: false };
    const sim = () => {
      const mat = st.n ? 7 : 8, fec = st.n ? 4 : 3, life = 20;
      let co = [{ age: mat + 1, n: 1 }];
      const tot = [1];
      for (let d = 1; d <= 28; d++) {
        const born = co.filter(c => c.age >= mat).reduce((a, c) => a + c.n * fec, 0);
        co.forEach(c => { c.age++; });
        co = co.filter(c => c.age < mat + life);
        co.push({ age: 0, n: born });
        if (st.soap && d === 10) co.forEach(c => { c.n *= 0.1; });
        tot.push(co.reduce((a, c) => a + c.n, 0));
      }
      return tot;
    };
    let data = sim();
    const ch = h.chart($('#lab-ap-ch', el), {
      label: 'Численность тли по дням, логарифмическая шкала',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [-0.5, 28.5], y: [0, 6], xticks: [0, 7, 14, 21, 28], yticks: [0, 1, 2, 3, 4, 5, 6], fx: v => v + ' д', fy: v => ['1', '10', '100', '1 тыс', '10 тыс', '100 тыс', '1 млн'][v], ylab: 'тлей' });
        let s = P.s;
        const bw = Math.max(2, P.iw / 29 - 3);
        data.forEach((v, d) => {
          const y = Math.log10(Math.max(1, v));
          const x = P.X(d) - bw / 2;
          s += `<rect class="vbar ${d === st.d ? 's1' : 'is-muted'}" x="${r1(x)}" y="${P.Y(y)}" width="${r1(bw)}" height="${r1(P.Y(0) - P.Y(y))}" rx="2"/>`;
        });
        const v = data[st.d];
        s += `<text class="bar-lbl" x="${P.X(st.d)}" y="${r1(P.Y(Math.log10(Math.max(1, v))) - 7)}" text-anchor="middle">${fmt0(v)}</text>`;
        return s;
      },
      onPointer(x, y, w, hh, kind) { if (kind !== 'set') return; const P = h.plot({ w, h: hh, x: [-0.5, 28.5], y: [0, 6] }); rng.set(clamp(Math.round(P.inv(x)), 0, 28)); }
    });
    const upd = () => {
      data = sim();
      const v = data[st.d];
      set(el, 'lab-ap-n', fmt0(v));
      set(el, 'lab-ap-v', v < 20 ? 'Пока единицы — смойте водой или снимите руками.' : v < 300 ? 'Колония растёт: мыльный раствор, повтор через 5–7 дней.' : 'Вспышка: обработка каждые 5 дней и срезка самых заселённых верхушек.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-ap-d', x => `${x}-й`, x => { st.d = x; upd(); });
    $('#lab-ap-x', el).addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      st[b.dataset.x] = !st[b.dataset.x];
      b.setAttribute('aria-pressed', String(st[b.dataset.x]));
      upd();
    });
    upd();
  });
})();
