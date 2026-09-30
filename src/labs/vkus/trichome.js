  register('trichome', el => {
    el.innerHTML = h.head('Лист под микроскопом', 'Поперечный разрез листа. Коснитесь железки или нажмите «Потереть лист»: масло под кутикулой вырвется наружу.') +
      `<div class="lab-actions"><button class="btn btn-primary btn-small" type="button" id="lab-tr-rub">${h.icon('nose')}Потереть лист</button><button class="btn btn-ghost btn-small" type="button" id="lab-tr-reset">Восстановить</button></div>
       <div class="tr-wrap"><div class="lab-scroll"><svg class="tr-svg" id="lab-tr-svg" viewBox="0 0 720 300" role="group" aria-label="Разрез листа базилика с железистыми волосками"></svg></div><div class="aroma-layer" id="lab-tr-aroma" aria-hidden="true"></div></div>
       <div class="lab-grid tr-grid">
         <div class="lab-controls">${h.rangeHtml('lab-tr-age', 'Лист', 0, 100, 1, 20)}<p class="lab-foot">Железки закладываются, пока лист крошечный. Когда лист растёт, их число почти не меняется, и на каждом квадратном миллиметре их становится меньше.</p></div>
         <div class="tr-top"><svg id="lab-tr-top" viewBox="0 0 200 200" role="img" aria-label="Вид сверху на участок листа с железками"></svg><p class="tick" id="lab-tr-cap"></p></div>
       </div>`;
    const svg = $('#lab-tr-svg', el);
    const GL = [[70, 'pel'], [200, 'cap'], [300, 'pel'], [430, 'pel'], [520, 'cap'], [566, 'hair']];
    const R = 572;
    let s = '';
    s += `<rect class="tr-air" x="0" y="0" width="${R}" height="84"/>`;
    s += `<path class="tr-cut" d="M0 84 H${R}"/>`;
    for (let x = 0; x < R - 20; x += 40) s += `<rect class="tr-epi" x="${x + 1}" y="86" width="38" height="22" rx="7"/>`;
    for (let x = 0; x < R - 12; x += 24) {
      s += `<rect class="tr-pal" x="${x + 2}" y="112" width="20" height="62" rx="9"/>`;
      for (let k = 0; k < 4; k++) s += `<ellipse class="tr-chl" cx="${x + 7 + (k % 2) * 10}" cy="${122 + k * 13}" rx="3.2" ry="2.2"/>`;
    }
    for (let i = 0; i < 22; i++) { const x = 16 + i * 27 + (i % 2) * 6, y = 196 + (i % 3) * 12; if (Math.abs(x - 470) > 30) s += `<ellipse class="tr-spo" cx="${x}" cy="${y}" rx="${14 + (i % 3) * 2}" ry="10"/>`; }
    s += `<ellipse class="tr-vein" cx="470" cy="204" rx="24" ry="17"/>`;
    for (let x = 0; x < R - 16; x += 36) if (x !== 252) s += `<rect class="tr-epi" x="${x + 1}" y="236" width="34" height="18" rx="6"/>`;
    s += `<g class="tr-stoma"><ellipse cx="261" cy="245" rx="8" ry="9"/><ellipse cx="279" cy="245" rx="8" ry="9"/></g>`;
    s += `<path class="tr-cut" d="M0 256 H${R}"/>`;
    GL.forEach(([x, k], i) => {
      if (k === 'pel') s += `<g class="tr-gland is-pel" data-i="${i}" tabindex="0" role="button" aria-label="Пельтатная железка с маслом"><rect class="tr-stalk" x="${x - 5}" y="72" width="10" height="14" rx="3"/><path class="tr-head" d="M${x - 17} 72 h34 v-8 h-34 z"/><path class="tr-oil" d="M${x - 19} 64 C ${x - 20} 36 ${x + 20} 36 ${x + 19} 64 Z"/></g>`;
      else if (k === 'cap') s += `<g class="tr-gland is-cap" data-i="${i}"><rect class="tr-stalk" x="${x - 3}" y="68" width="6" height="18" rx="3"/><circle class="tr-cap" cx="${x}" cy="62" r="8"/></g>`;
      else s += `<path class="tr-hair" d="M${x} 86 C ${x + 4} 60 ${x - 8} 40 ${x + 8} 22"/>`;
    });
    const L = (x1, y1, x2, y2, t, anchor = 'start') => `<line class="tr-lead" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text class="tr-lbl" x="${x2 + (anchor === 'end' ? -4 : 4)}" y="${y2 + 4}" text-anchor="${anchor}">${t}</text>`;
    s += L(300, 42, 332, 16, 'масло под кутикулой');
    s += L(200, 54, 150, 20, 'головчатый волосок', 'end');
    s += L(R - 4, 84, R + 8, 70, 'кутикула');
    s += L(R - 4, 97, R + 8, 100, 'эпидермис');
    s += L(R - 4, 143, R + 8, 143, 'столбчатая ткань');
    s += L(R - 4, 200, R + 8, 196, 'губчатая ткань');
    s += L(R - 4, 245, R + 8, 245, 'нижний эпидермис');
    s += L(270, 250, 300, 282, 'устьице');
    s += L(470, 218, 500, 282, 'жилка');
    svg.innerHTML = s;
    const layer = $('#lab-tr-aroma', el);
    const burst = g => {
      if (g.classList.contains('is-burst')) return;
      g.classList.add('is-burst');
      const r = g.getBoundingClientRect();
      S.aroma(layer, r.left + r.width / 2, r.top + r.height * 0.3);
    };
    svg.addEventListener('click', e => { const g = e.target.closest('.tr-gland.is-pel'); if (g) burst(g); });
    svg.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.tr-gland')) { e.preventDefault(); burst(e.target.closest('.tr-gland')); } });
    $('#lab-tr-rub', el).addEventListener('click', () => $$('.tr-gland.is-pel', svg).forEach((g, i) => setTimeout(() => burst(g), i * 260)));
    $('#lab-tr-reset', el).addEventListener('click', () => $$('.tr-gland', svg).forEach(g => g.classList.remove('is-burst')));
    const top = $('#lab-tr-top', el);
    const pts = Array.from({ length: 60 }, (_, i) => [(i * 71 % 97) / 97, (i * 43 % 89) / 89]);
    const age = a => {
      const scale = 1 + a / 100 * 3;
      const n = Math.round(60 / (scale * scale) * 3.2);
      let t = `<rect class="tr-surf" width="200" height="200" rx="14"/>`;
      for (let i = 0; i < 26; i++) t += `<path class="tr-cellline" d="M${(i * 37) % 200} 0 l ${10 + (i % 3) * 6} 200"/>`;
      pts.slice(0, Math.min(60, n)).forEach(([x, y]) => { t += `<circle class="tr-dot" cx="${r1(10 + x * 180)}" cy="${r1(10 + y * 180)}" r="${r1(5.5)}"/>`; });
      top.innerHTML = t;
      set(el, 'lab-tr-cap', `${a < 30 ? 'молодой верхний лист' : a < 70 ? 'лист среднего возраста' : 'старый нижний лист'}: ≈ ${Math.min(60, n)} железок на этом участке`);
    };
    h.bindRange(el, 'lab-tr-age', a => a < 30 ? 'молодой' : a < 70 ? 'средний' : 'старый', age);
    age(20);
  });
