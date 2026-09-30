/* Гид по базилику — живые модели главы «Урожай». Файл собирает scripts/build.py из src/labs/urozhay/ — правьте там */
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

  register('diurnal', el => {
    const Tleaf = hr => 20.5 + 6.5 * Math.cos(2 * Math.PI * (hr - 15) / 24);
    const emit = T => Math.exp(10.6 * (1 - 471 / (T + 273.15)));
    const EMAX = emit(27);
    const turg = hr => hr < 7 || hr > 21 ? 1 : 1 - 0.42 * Math.pow(Math.sin(Math.PI * (hr - 7) / 14), 1.5);
    el.innerHTML = h.head('Летний день глазами листа', 'Температура листа — типичный ясный июльский день. Испарение линалоола считается по правилу Трутона, тургор — упрощённо.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-di-h', 'Время', 0, 23.5, 0.5, 7)}</div>
       <div class="lab-chart" id="lab-di-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s3"></i>аромат улетает</li><li><i class="k-s4"></i>тургор листа</li></ul>` +
      h.readHtml([['Температура листа', 'lab-di-t'], ['Испарение аромата, от пика', 'lab-di-e'], ['Тургор', 'lab-di-g'], ['Совет', 'lab-di-v', 'is-wide']]);
    let H = 7, hover = null;
    const hh2 = v => `${Math.floor(v)}:${v % 1 ? '30' : '00'}`;
    const ch = h.chart($('#lab-di-ch', el), {
      label: 'Потери аромата и тургор листа в течение суток',
      draw(w, hh) {
        const pts = f => { const a = []; for (let x = 0; x <= 24; x += 0.25) a.push([x, f(x)]); return a; };
        const P = h.plot({ w, h: hh, x: [0, 24], y: [0, 105], xticks: [0, 6, 12, 18, 24], yticks: [0, 50, 100], fx: v => v + ':00', fy: v => v + '%',
          vbands: [{ x0: 6, x1: 10, cls: 'is-good', label: 'лучший сбор' }],
          series: [{ pts: pts(x => emit(Tleaf(x)) / EMAX * 100), cls: 's3', label: 'аромат улетает', labelAt: 15, ldy: -10 }, { pts: pts(x => turg(x) * 100), cls: 's4', label: 'тургор', labelAt: 3, ldy: -8 }],
          marker: { x: H, dots: [{ y: emit(Tleaf(H)) / EMAX * 100, cls: 's3' }, { y: turg(H) * 100, cls: 's4' }] }, hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [hh2(hover), `лист ${fmt(Tleaf(hover))} °C`, `потери ${pct(emit(Tleaf(hover)) / EMAX)}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [0, 24], y: [0, 1] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 0, 23.5);
        if (kind === 'set') { hover = null; rng.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const T = Tleaf(H), e = emit(T) / EMAX, g = turg(H);
      set(el, 'lab-di-t', `${fmt(T)} °C`); set(el, 'lab-di-e', pct(e)); set(el, 'lab-di-g', pct(g));
      set(el, 'lab-di-v', H >= 6 && H <= 10 ? 'Хорошее время: листья упругие, аромат ещё не «выкипает».' : H > 10 && H < 18 ? 'Жарко: листья вялые, летучие вещества уходят быстрее всего. Отложите сбор.' : H >= 18 && H < 21 ? 'Вечером можно, но листья ещё не восстановили воду после дня.' : 'Ночью листья полны воды, но на них может быть роса — собирайте, когда она высохнет.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-di-h', v => hh2(v), v => { H = v; upd(); });
    upd();
  });

  const STORE_PTS = [[2, 1], [4, 2], [6, 3], [8, 4.5], [10, 6], [12, 8], [14, 9], [16, 8.6], [18, 7.2], [20, 6], [22, 5], [25, 4]];
  const storeAt = t => { for (let i = 0; i < STORE_PTS.length - 1; i++) if (t <= STORE_PTS[i + 1][0]) return lerp(STORE_PTS[i][1], STORE_PTS[i + 1][1], (t - STORE_PTS[i][0]) / (STORE_PTS[i + 1][0] - STORE_PTS[i][0])); return 4; };

  register('storage', el => {
    el.innerHTML = h.head('Сколько живёт срезанный базилик', 'Ориентир для стеблей в воде под свободным пакетом, упрощено по опытам хранения: ниже 10 °C срок режет холодовое повреждение, выше 18 °C — старение листа.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-st-t', 'Температура хранения', 2, 25, 1, 4)}</div>
       <div class="lab-chart" id="lab-st-ch"></div>` + h.readHtml([['До заметной порчи', 'lab-st-d'], ['Что происходит', 'lab-st-v', 'is-wide']]);
    let T = 4;
    const ch = h.chart($('#lab-st-ch', el), {
      label: 'Срок хранения срезанного базилика в зависимости от температуры',
      draw(w, hh) {
        const pts = []; for (let t = 2; t <= 25; t += 0.5) pts.push([t, storeAt(t)]);
        const P = h.plot({ w, h: hh, x: [2, 25], y: [0, 10], xticks: [2, 5, 10, 15, 20, 25], yticks: [0, 5, 10], fx: v => v + '°', ylab: 'дней',
          vbands: [{ x0: 2, x1: 10, cls: 'is-cold', label: 'холодовое повреждение' }, { x0: 12, x1: 15, cls: 'is-good', label: 'оптимум' }],
          series: [{ pts, cls: 's1', area: true }], marker: { x: T, dots: [{ y: storeAt(T), cls: 's1' }] } });
        return P.s;
      },
      onPointer(x, y, w, hh, kind) { if (kind !== 'set') return; const P = h.plot({ w, h: hh, x: [2, 25], y: [0, 10] }); rng.set(clamp(Math.round(P.inv(x)), 2, 25)); }
    });
    const upd = () => {
      set(el, 'lab-st-d', `≈ ${fmt(storeAt(T))} дн.`);
      set(el, 'lab-st-v', T < 10 ? 'Мембраны клеток «застывают», полифенолоксидаза встречается с полифенолами — появляются чёрные пятна.' : T <= 16 ? 'Мембраны жидкие, дыхание медленное: лист живёт дольше всего.' : 'Тепло: лист быстро тратит запасы, желтеет и вянет.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-st-t', v => `${v} °C`, v => { T = v; upd(); });
    upd();
  });

  register('pesto', el => {
    el.innerHTML = h.head('Песто-лаборатория', 'Качественная модель двух процессов: ферментативного потемнения и оливкования хлорофилла. Соберите свой рецепт и посмотрите цвет через сутки.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">
          ${h.segHtml('lab-pe-m', 'Чем растираем', [['mortar', 'Ступка'], ['blender', 'Блендер']], 'blender')}
          <div class="lab-seg-wrap"><span class="lab-label">Добавки и приёмы</span><div class="chips-row lab-chips" id="lab-pe-x">
            <button class="chip" type="button" data-x="blanch" aria-pressed="false">Бланшировать 10 с</button>
            <button class="chip" type="button" data-x="vitc" aria-pressed="false">Щепотка аскорбинки</button>
            <button class="chip" type="button" data-x="lemon" aria-pressed="false">Лимонный сок</button>
            <button class="chip" type="button" data-x="oil" aria-pressed="false">Слой масла сверху</button>
          </div></div>
          ${h.segHtml('lab-pe-s', 'Хранение', [['fridge', 'Холодильник'], ['room', 'Комната']], 'room')}
          ${h.rangeHtml('lab-pe-h', 'Прошло времени', 0, 72, 1, 24)}
        </div>
        <div class="pesto-out">
          <svg class="pesto-jar" viewBox="0 0 160 190" aria-hidden="true">
            <rect class="jar-lid" x="34" y="10" width="92" height="20" rx="6"/>
            <path class="jar-glass" d="M40 30 H120 Q132 30 132 46 V164 Q132 180 116 180 H44 Q28 180 28 164 V46 Q28 30 40 30 Z"/>
            <path id="lab-pe-fill" d="M31 70 Q80 62 129 70 V162 Q129 177 115 177 H45 Q31 177 31 162 Z"/>
            <path class="jar-oil" id="lab-pe-oil" d="M31 62 Q80 56 129 62 V72 Q80 64 31 72 Z"/>
            <path class="jar-shine" d="M42 50 V150"/>
          </svg>
          <p class="pesto-verdict" id="lab-pe-v"></p>
          <div class="pesto-bars" id="lab-pe-bars"></div>
        </div>
      </div>
      <ul class="ticks pesto-notes" id="lab-pe-notes"></ul>`;
    const st = { m: 'blender', s: 'room', t: 24, x: new Set() };
    const upd = () => {
      const X = st.x;
      let kE = 0.05, kO = 0.004;
      if (st.m === 'blender') { kE *= 1.6; kO *= 1.3; }
      if (X.has('blanch')) { kE *= 0.12; kO *= 1.5; }
      if (X.has('vitc')) kE *= 0.35;
      if (X.has('lemon')) { kE *= 0.7; kO *= 6; }
      if (X.has('oil')) kE *= 0.45;
      if (st.s === 'fridge') { kE *= 0.35; kO *= 0.4; }
      const E = 1 - Math.exp(-kE * st.t), O = 1 - Math.exp(-kO * st.t);
      const fresh = h.css('--pesto-fresh'), brown = h.css('--pesto-brown'), olive = h.css('--pesto-olive');
      const col = h.mix(h.mix(fresh, brown, E * 0.85), olive, O * 0.8);
      $('#lab-pe-fill', el).style.fill = col;
      $('#lab-pe-oil', el).style.opacity = X.has('oil') ? 1 : 0;
      const score = Math.max(E * 0.9, O * 0.85);
      $('#lab-pe-v', el).innerHTML = `<b>${score < 0.15 ? 'Изумрудное' : score < 0.35 ? 'Слегка потускнело' : score < 0.6 ? (O > E ? 'Оливковое' : 'Потемнело') : (O > E ? 'Оливково-бурое' : 'Бурое')}</b> через ${st.t} ч`;
      $('#lab-pe-bars', el).innerHTML = [['Ферментативное потемнение', E, 's3'], ['Оливкование хлорофилла', O, 's2']].map(([n, v, c]) => `<div class="gdd-row"><span>${n}</span><i class="${c}" style="--w:${clamp(v, 0.02, 1) * 100}%"></i><b>${pct(v)}</b></div>`).join('');
      const notes = [];
      notes.push(st.m === 'blender' ? 'Блендер греет и взбивает с воздухом — потемнение ускоряется. Охладите чашу и работайте импульсами.' : 'Ступка не греет массу и почти не вбивает воздух.');
      if (X.has('blanch')) notes.push('Бланширование разрушило полифенолоксидазу — главный виновник потемнения выключен. Аромат при этом чуть слабее.');
      if (X.has('vitc')) notes.push('Аскорбиновая кислота восстанавливает хиноны обратно, пока сама не израсходуется.');
      if (X.has('lemon')) notes.push('Кислота лимона немного тормозит фермент, но ускоряет оливкование: ион магния уходит из хлорофилла.');
      if (X.has('oil')) notes.push('Слой масла отрезает кислород сверху.');
      notes.push(st.s === 'fridge' ? 'Холод замедляет обе реакции примерно втрое.' : 'При комнатной температуре реакции идут быстро — песто лучше съесть сразу.');
      $('#lab-pe-notes', el).innerHTML = notes.map(n => `<li>${h.nb(n)}</li>`).join('');
    };
    h.bindPick(el, 'lab-pe-m', v => { st.m = v; upd(); });
    h.bindPick(el, 'lab-pe-s', v => { st.s = v; upd(); });
    h.bindRange(el, 'lab-pe-h', v => `${v} ч`, v => { st.t = v; upd(); });
    $('#lab-pe-x', el).addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      const on = !st.x.has(b.dataset.x);
      if (on) st.x.add(b.dataset.x); else st.x.delete(b.dataset.x);
      b.setAttribute('aria-pressed', String(on));
      upd();
    });
    upd();
    document.addEventListener('basil:theme', upd);
  });
})();
