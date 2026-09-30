  const PH_NAMES = [[3, 'красный', 'катион флавилия: молекула заряжена положительно и поглощает зелёный свет'], [5.5, 'бледно-розовый', 'часть молекул перешла в бесцветную карбинольную форму'], [7.5, 'фиолетовый', 'хиноидное основание — нейтральная окрашенная форма'], [10.5, 'синий, сине-зелёный', 'анионное хиноидное основание'], [15, 'жёлто-зелёный', 'кольцо раскрылось в халкон — пигмент необратимо разрушается']];

  register('anthocyanin', el => {
    el.innerHTML = h.head('Фиолетовый базилик и pH', 'Настой фиолетового базилика — природный индикатор, как краснокочанная капуста. Добавьте кислоту или щёлочь.') +
      `<div class="lab-grid anth-grid">
        <svg class="anth-jar" viewBox="0 0 140 170" aria-hidden="true">
          <path class="jar-glass" d="M30 20 H110 V150 Q110 162 98 162 H42 Q30 162 30 150 Z"/>
          <path id="lab-an-liq" d="M33 60 Q70 54 107 60 V149 Q107 159 97 159 H43 Q33 159 33 149 Z"/>
          <use href="#pl-leaf" class="pl-leaf anth-leaf" style="fill:url(#pl-grad-purple)" transform="translate(58 140) rotate(-20) scale(.42)"/>
          <use href="#pl-leaf" class="pl-leaf anth-leaf" style="fill:url(#pl-grad-purple)" transform="translate(84 146) rotate(28) scale(.36)"/>
          <path class="jar-shine" d="M40 32 V140"/>
        </svg>
        <div class="lab-controls">${h.rangeHtml('lab-an-ph', 'pH', 1, 12, 0.1, 7)}${h.chipsHtml('lab-an-q', 'Добавить', [['2.2', 'Лимонный сок'], ['2.8', 'Уксус'], ['7', 'Вода'], ['8.3', 'Пищевая сода'], ['10.5', 'Мыльная вода']], '7')}
          <p class="anth-out" id="lab-an-out" aria-live="polite"></p></div>
      </div>`;
    const stops = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => h.css('--ph-' + n) || '#888');
    const upd = ph => {
      const col = h.ramp([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => h.css('--ph-' + n) || stops[n - 1]), (ph - 1) / 11);
      $('#lab-an-liq', el).style.fill = col;
      const nm = PH_NAMES.find(p => ph < p[0]);
      $('#lab-an-out', el).innerHTML = `<b>pH ${fmt(ph)}: ${nm[1]}.</b> ${h.nb(nm[2])}.`;
    };
    const rng = h.bindRange(el, 'lab-an-ph', v => fmt(v), upd);
    h.bindPick(el, 'lab-an-q', v => rng.set(+v));
    upd(7);
  });
