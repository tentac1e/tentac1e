/* Гид по базилику — живые модели главы «Размножение». Файл собирает scripts/build.py из src/labs/razmnozhenie/ — правьте там */
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

  register('roots', el => {
    el.innerHTML = h.head('Черенок в стакане', 'Модель укоренения: корешки появляются из погружённых узлов и растут примерно на полсантиметра в день в тепле.', true) +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage"><svg class="roots-svg" id="lab-rt-svg" viewBox="0 0 220 260" role="img" aria-label="Черенок базилика в стакане с водой"></svg></div>
        <div class="lab-controls">${h.rangeHtml('lab-rt-d', 'День', 0, 21, 1, 10)}${h.segHtml('lab-rt-t', 'Комната', [['18', '18 °C'], ['22', '22 °C'], ['26', '26 °C']], '22')}</div>
      </div>` + h.readHtml([['Длина корней', 'lab-rt-l'], ['Что делать', 'lab-rt-v', 'is-wide']]);
    const svg = $('#lab-rt-svg', el);
    let day = 10, temp = 22;
    const ON = { 18: 10, 22: 7, 26: 5 }, RATE = { 18: 0.35, 22: 0.5, 26: 0.6 };
    const ROOTS = [[-1, 0.9, 0], [1, 1, 1], [-1, 0.7, 2], [1, 0.8, 0.5], [-1, 0.6, 1.5], [1, 0.65, 2.5]];
    const leaf = (x, y, a, s) => `<use href="#pl-leaf" class="pl-leaf" style="fill:url(#pl-grad)" transform="translate(${x} ${y}) rotate(${a}) scale(${s})"/>`;
    const upd = () => {
      const L = Math.max(0, (day - ON[temp]) * RATE[temp]);
      let s = `<path class="rt-glass" d="M52 60 L60 246 Q61 252 68 252 H152 Q159 252 160 246 L168 60"/>`;
      s += `<path class="rt-water" d="M55.6 120 L60.6 245 Q61.4 249.5 68 249.5 H152 Q158.6 249.5 159.4 245 L164.4 120 Z"/>`;
      s += `<path class="rt-stem" d="M110 236 C 108 180 112 120 110 34"/>`;
      [[176, 1], [206, 0.8]].forEach(([y, k]) => {
        s += `<circle class="rt-node" cx="110" cy="${y}" r="3.2"/>`;
        ROOTS.forEach(([side, len, lag], i) => {
          const l = Math.max(0, L - lag * 0.25) * len * k * 11;
          if (l < 1) return;
          const cx = 110 + side * (6 + i * 1.5), ex = 110 + side * Math.min(44, l * 0.55 + 6), ey = y + Math.min(250 - y - 4, l * 0.85);
          s += `<path class="rt-root" d="M110 ${y} Q ${r1(cx + side * l * 0.3)} ${r1(y + l * 0.2)} ${r1(ex)} ${r1(ey)}"/>`;
        });
      });
      s += leaf(110, 96, -58, 0.42) + leaf(110, 96, 58, 0.42) + leaf(111, 64, -30, 0.3) + leaf(111, 64, 30, 0.3) + leaf(110, 38, -8, 0.18) + leaf(110, 38, 12, 0.16);
      s += `<line class="rt-wl" x1="56" x2="164" y1="120" y2="120"/>`;
      svg.innerHTML = s;
      set(el, 'lab-rt-l', L > 0 ? `${fmt(L)} см` : 'пока нет');
      set(el, 'lab-rt-v', day < ON[temp] - 2 ? 'Ждите: у основания идёт перестройка клеток, снаружи ничего не видно. Меняйте воду раз в 2–3 дня.' : L < 0.3 ? 'Вот-вот: в узлах набухают белые бугорки — зачатки корней.' : L < 2 ? 'Корешки растут. Сажать рано: подождите, пока будет 2–5 см.' : L <= 5 ? 'Пора сажать в грунт! 3–4 дня держите в тени под пакетом.' : 'Корни длинные и начинают путаться: сажайте, аккуратно расправив их.');
    };
    h.bindRange(el, 'lab-rt-d', v => `${v}-й`, v => { day = v; upd(); });
    h.bindPick(el, 'lab-rt-t', v => { temp = +v; upd(); });
    upd();
  });

  register('seedlife', el => {
    el.innerHTML = h.head('Срок жизни семян', 'Правила Харрингтона относительно хранения при 20 °C и влажности семян 10 %, когда базилик держит всхожесть около 4–5 лет.', true) +
      `<div class="lab-controls">${h.chipsHtml('lab-sl-p', 'Где храним', [['room', 'Шкаф в квартире'], ['fridge', 'Холодильник и силикагель'], ['warm', 'Тёплая кладовка']], 'room')}${h.rangeHtml('lab-sl-t', 'Температура', 0, 30, 1, 22)}${h.rangeHtml('lab-sl-m', 'Влажность семян', 5, 14, 0.5, 9)}</div>
       <div class="sl-scale"><i id="lab-sl-bar"></i><span style="left:0%">×¼</span><span style="left:25%">×1</span><span style="left:50%">×4</span><span style="left:75%">×16</span><span style="left:100%">×64</span></div>` +
      h.readHtml([['Множитель срока', 'lab-sl-x'], ['Примерно', 'lab-sl-y']]);
    let T = 22, M = 9;
    const P = { room: [22, 9], fridge: [5, 6], warm: [28, 12] };
    const upd = () => {
      const k = Math.pow(2, (20 - T) / 5) * Math.pow(2, 10 - M);
      $('#lab-sl-bar', el).style.width = `${clamp((Math.log2(k) + 2) / 8, 0.01, 1) * 100}%`;
      set(el, 'lab-sl-x', k >= 1 ? `× ${k >= 10 ? fmt0(k) : fmt(k)}` : `× ${fmt(k, 2)}`);
      const y = 4.5 * k;
      set(el, 'lab-sl-y', y > 50 ? 'десятки лет — условия семенного банка' : y < 1 ? `${fmt0(y * 12)} мес.` : `${fmt(y)} лет`);
    };
    const tr = h.bindRange(el, 'lab-sl-t', v => `${v} °C`, v => { T = v; upd(); });
    const mr = h.bindRange(el, 'lab-sl-m', v => `${fmt(v)} %`, v => { M = v; upd(); });
    h.bindPick(el, 'lab-sl-p', k => { tr.set(P[k][0]); mr.set(P[k][1]); });
    upd();
  });
})();
