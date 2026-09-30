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
