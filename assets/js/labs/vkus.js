/* Гид по базилику — живые модели главы «Вкус и аромат». Файл собирает scripts/build.py из src/labs/vkus/ — правьте там */
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

  register('pathway', el => {
    const NODES = {
      sug: [477, 30, 'Сахара фотосинтеза'], ipp: [290, 96, 'IPP и DMAPP · C₅'], gpp: [173, 170, 'ГДФ · C₁₀'], fpp: [410, 170, 'ФДФ · C₁₅'], ger: [285, 250, 'Гераниол'],
      phe: [664, 96, 'Фенилаланин'], cia: [664, 170, 'Коричная кислота'], con: [664, 250, 'Кониферилацетат'], chv: [535, 250, 'Хавикол']
    };
    const ENDS = {
      lin: [58, 250], cin: [173, 250], cit: [285, 330], car: [410, 250], est: [535, 330], mci: [817, 250], eug: [664, 330], meu: [664, 410]
    };
    const PATHS = {
      lin: ['sug', 'ipp', 'gpp', 'lin'], cin: ['sug', 'ipp', 'gpp', 'cin'], cit: ['sug', 'ipp', 'gpp', 'ger', 'cit'], car: ['sug', 'ipp', 'fpp', 'car'],
      est: ['sug', 'phe', 'cia', 'chv', 'est'], mci: ['sug', 'phe', 'cia', 'mci'], eug: ['sug', 'phe', 'cia', 'con', 'eug'], meu: ['sug', 'phe', 'cia', 'con', 'eug', 'meu']
    };
    const ENZ = { 'gpp-lin': 'LIS', 'gpp-cin': 'CinS', 'gpp-ger': 'GES', 'fpp-car': 'TPS', 'phe-cia': 'PAL', 'cia-mci': 'CCMT', 'chv-est': 'CVOMT', 'con-eug': 'EGS', 'eug-meu': 'EOMT', 'cia-chv': 'CVS' };
    const INFO = {
      lin: ['Линалоол', 'Линалоолсинтаза (LIS) превращает геранилдифосфат в линалоол одним шагом. Её активность — главное отличие европейских сортов.', 'генуэзский, греческий, фиолетовые'],
      cin: ['1,8-Цинеол', 'Цинеолсинтаза замыкает геранилдифосфат в бициклический эфир.', 'генуэзский, африканский синий'],
      cit: ['Цитраль', 'Гераниолсинтаза (GES) даёт гераниол, а дегидрогеназы окисляют его до альдегидов гераниаля и нераля — вместе это цитраль.', 'лимонный, лаймовый'],
      car: ['β-Кариофиллен', 'Сесквитерпенсинтазы сворачивают пятнадцатиуглеродный ФДФ в кольца.', 'тулси, лимонный'],
      est: ['Эстрагол', 'Хавикол-O-метилтрансфераза (CVOMT) пришивает метильную группу к хавиколу. Сильный фермент — анисовый тайский базилик.', 'тайский, фиолетовые'],
      mci: ['Метилциннамат', 'Метилтрансфераза коричной кислоты (CCMT) превращает её в метиловый эфир с запахом корицы и клубники.', 'коричный'],
      eug: ['Эвгенол', 'Эвгенолсинтаза (EGS) снимает ацетатную группу с кониферилацетата — получается эвгенол.', 'генуэзский, гвоздичный, тулси'],
      meu: ['Метилэвгенол', 'Эвгенол-O-метилтрансфераза (EOMT) метилирует эвгенол. Много её у тулси.', 'тулси']
    };
    el.innerHTML = h.head('Два конвейера аромата', 'Слева терпены из изопреновых «кирпичиков», справа фенилпропаноиды из аминокислоты фенилаланина. Выберите молекулу внизу схемы, чтобы подсветить её путь.') +
      `<div class="lab-scroll"><svg class="pw-svg" id="lab-pw-svg" viewBox="0 0 900 464" role="group" aria-label="Схема биосинтеза ароматических веществ базилика"></svg></div>
       <div class="pw-info" id="lab-pw-info" aria-live="polite"></div>`;
    const svg = $('#lab-pw-svg', el);
    const pos = id => NODES[id] || ENDS[id];
    const nw = k => NODES[k] ? Math.max(90, NODES[k][2].length * 8.3 + 20) : Math.max(96, h.molName(k).length * 8.6 + 24);
    const draw = sel => {
      const path = PATHS[sel] || [];
      const on = new Set(path);
      const edges = new Set(path.slice(1).map((b, i) => path[i] + '-' + b));
      let s = `<defs><marker id="lab-pw-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="pw-ah"/></marker></defs>`;
      s += `<text class="pw-zone" x="230" y="452" text-anchor="middle">терпеновый путь</text><text class="pw-zone" x="676" y="452" text-anchor="middle">фенилпропаноидный путь</text>`;
      const E = [['sug', 'ipp'], ['sug', 'phe'], ['ipp', 'gpp'], ['ipp', 'fpp'], ['gpp', 'lin'], ['gpp', 'cin'], ['gpp', 'ger'], ['ger', 'cit'], ['fpp', 'car'], ['phe', 'cia'], ['cia', 'mci'], ['cia', 'chv'], ['cia', 'con'], ['chv', 'est'], ['con', 'eug'], ['eug', 'meu']];
      E.forEach(([a, b]) => {
        const A = pos(a), B = pos(b);
        const hot = edges.has(a + '-' + b);
        let x1 = A[0], y1 = A[1] + 16, x2 = B[0], y2 = B[1] - 18;
        if (Math.abs(A[1] - B[1]) < 8) { x1 = A[0] + nw(a) / 2; y1 = A[1]; x2 = B[0] - nw(b) / 2 - 4; y2 = B[1]; }
        s += `<line class="pw-edge${hot ? ' is-hot' : ''}" x1="${r1(x1)}" y1="${y1}" x2="${r1(x2)}" y2="${y2}" marker-end="url(#lab-pw-ah)"/>`;
        const enz = ENZ[a + '-' + b];
        if (enz) s += `<text class="pw-enz${hot ? ' is-hot' : ''}" x="${r1((x1 + x2) / 2 + (x2 >= x1 ? 6 : -6))}" y="${r1((y1 + y2) / 2 + 2)}" text-anchor="${x2 >= x1 ? 'start' : 'end'}">${enz}</text>`;
      });
      Object.entries(NODES).forEach(([k, [x, y, t]]) => {
        const w = nw(k);
        s += `<g class="pw-node${on.has(k) ? ' is-hot' : ''}"><rect x="${r1(x - w / 2)}" y="${y - 15}" width="${r1(w)}" height="30" rx="15"/><text x="${x}" y="${y + 5}" text-anchor="middle">${t}</text></g>`;
      });
      Object.entries(ENDS).forEach(([k, [x, y]]) => {
        const name = h.molName(k);
        const w = nw(k);
        const fam = h.FAM[h.molFam(k)].cls;
        s += `<g class="pw-end ${fam}${k === sel ? ' is-sel' : ''}${on.has(k) ? ' is-hot' : ''}" data-k="${k}" tabindex="0" role="button" aria-pressed="${k === sel}" aria-label="${name}"><rect x="${r1(x - w / 2)}" y="${y - 16}" width="${r1(w)}" height="32" rx="10"/><text x="${x}" y="${y + 5}" text-anchor="middle">${name}</text></g>`;
      });
      svg.innerHTML = s;
      const inf = INFO[sel];
      $('#lab-pw-info', el).innerHTML = inf ? `<h5>${inf[0]}</h5><p>${h.nb(inf[1])}</p><p class="muted">Сорта: ${inf[2]}.</p>` : '';
    };
    const pick = e => { const g = e.target.closest('.pw-end'); if (g) draw(g.dataset.k); };
    svg.addEventListener('click', pick);
    svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
    draw('eug');
  });

  register('molecules', el => {
    const ids = Object.keys(h.MOLS).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
    el.innerHTML = `<div class="mol-lab">
      <div class="mol-view"><div class="mol-stage"><canvas class="mol-canvas" id="lab-mol-cv" role="img" aria-label="Трёхмерная модель молекулы"></canvas><span class="mol-hint hand" aria-hidden="true">покрутите</span></div>
        <p class="mol-key"><span><i class="mk-c"></i>углерод</span><span><i class="mk-o"></i>кислород</span><span class="muted">водороды скрыты</span></p></div>
      <div class="mol-card" id="lab-mol-card" aria-live="polite"></div>
    </div>
    <div class="chips-row lab-chips mol-chips" id="lab-mol-chips" role="group" aria-label="Молекулы">${ids.map(id => `<button class="chip" type="button" data-v="${id}" aria-pressed="${id === 'lin'}"><i class="fam-dot ${h.FAM[h.MOLS[id].fam].cls}"></i>${h.MOLS[id].name}</button>`).join('')}</div>
    <div class="vol-scale" aria-label="Шкала летучести по температуре кипения">
      <div class="vol-track">${ids.map((id, i) => { const m = h.MOLS[id]; return `<button type="button" class="vol-chip ${h.FAM[m.fam].cls}" data-v="${id}" style="--x:${((m.bp - 115) / 160 * 100).toFixed(1)}%"><b>${m.name.replace(/^\(Z\)-3-/, '')}</b><small>${m.bp} °C</small></button>`; }).join('')}</div>
      <div class="vol-axis"><span>верхние ноты · улетают первыми</span><span>сердце</span><span>база · держатся дольше</span></div>
    </div>
    <ul class="legend">${Object.values(h.FAM).map(f => `<li><i class="fam-dot ${f.cls}"></i>${f.name}</li>`).join('')}</ul>`;
    const viewer = h.MolViewer($('#lab-mol-cv', el), 'lin');
    const card = id => {
      const m = h.MOLS[id];
      $('#lab-mol-card', el).innerHTML = `<p class="lab-kicker">${m.cls}</p><h4 class="mol-name">${m.name}</h4>${m.alt ? `<p class="mol-alt">${m.alt}</p>` : ''}
        <p class="mol-formula">${h.sub(m.formula)} · кипит при ${m.bp} °C</p>
        <dl class="data-rows"><div><dt>Пахнет</dt><dd>${m.smell}</dd></div><div><dt>Есть также в</dt><dd>${m.where}</dd></div><div><dt>Сорта базилика</dt><dd>${m.basil}</dd></div></dl>
        <p>${h.nb(m.note)}</p>`;
      $$('[data-v]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === id)));
    };
    el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b || !el.contains(b)) return; viewer.set(b.dataset.v); card(b.dataset.v); });
    card('lin');
    const track = $('.vol-track', el);
    const layout = () => {
      const W = track.clientWidth;
      if (!W) return;
      const rows = [];
      $$('.vol-chip', track).forEach(c => {
        const w = c.offsetWidth, x = parseFloat(c.style.getPropertyValue('--x')) / 100 * W;
        const left = clamp(x - w / 2, 4, W - w - 4);
        let r = rows.findIndex(end => end + 6 < left);
        if (r < 0) { rows.push(0); r = rows.length - 1; }
        rows[r] = left + w;
        c.style.left = left + 'px';
        c.style.translate = '0 0';
        c.style.top = (8 + r * 42) + 'px';
      });
      track.style.height = (rows.length * 42 + 12) + 'px';
    };
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(track);
  });

  register('chemotype', el => {
    const cols = h.CHEMO_COLS;
    el.innerHTML = `<div class="lab-scroll"><table class="chemo" id="lab-ch-t"><caption class="sr-only">Доли ароматических веществ в эфирном масле сортов базилика, проценты</caption>
      <thead><tr><th scope="col">Сорт</th>${cols.map(c => `<th scope="col"><span>${h.molName(c).replace(/^1,8-/, '').replace(/^α-|^β-/, '')}</span></th>`).join('')}</tr></thead>
      <tbody>${h.CHEMO.map((r, i) => `<tr data-i="${i}"><th scope="row"><button type="button" class="chemo-row" data-i="${i}" aria-pressed="${i === 0}">${r.name}</button></th>${cols.map(c => {
        const v = r.p[c] || 0;
        return `<td>${v ? `<span class="bub ${h.FAM[h.molFam(c)].cls}" style="--s:${(Math.sqrt(v / 75) * 34).toFixed(1)}px" title="${h.molName(c)}: ${v} %"></span>${v >= 10 ? `<small>${v}</small>` : `<span class="sr-only">${v} %</span>`}` : '<span class="bub-none" aria-label="нет">·</span>'}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>
      <ul class="legend">${['mono', 'phen', 'sesq'].map(k => `<li><i class="fam-dot ${h.FAM[k].cls}"></i>${h.FAM[k].name}</li>`).join('')}<li class="muted">числа — доля в масле, %; ориентир по опубликованным анализам</li></ul>
      <div class="chemo-info" id="lab-ch-info" aria-live="polite"></div>`;
    const info = i => {
      const r = h.CHEMO[i];
      const top = Object.entries(r.p).sort((a, b) => b[1] - a[1]).slice(0, 3);
      $('#lab-ch-info', el).innerHTML = `<h5>${r.name}</h5><p>${h.nb(r.why)}</p><p class="chemo-top">${top.map(([k, v]) => `<span><i class="fam-dot ${h.FAM[h.molFam(k)].cls}"></i>${h.molName(k)} <b>${v} %</b></span>`).join('')}</p>`;
      $$('.chemo-row', el).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
      $$('tbody tr', el).forEach(tr => tr.classList.toggle('is-sel', +tr.dataset.i === i));
    };
    el.addEventListener('click', e => { const b = e.target.closest('.chemo-row'); if (b) info(+b.dataset.i); });
    info(0);
  });

  register('heat', el => {
    const VAR = [['genovese', 'Генуэзский'], ['thai', 'Тайский'], ['lemon', 'Лимонный'], ['cinnamon', 'Коричный']];
    el.innerHTML = h.head('Когда класть базилик', 'Модель открытой кастрюли: скорость потери каждой молекулы пропорциональна давлению её пара, оценённому по правилу Трутона. Внизу — что останется от аромата выбранного сорта.', true) +
      `<div class="lab-controls lab-row-wrap"><div class="lab-seg-wrap"><span class="lab-label">Сорт</span>${h.chipsHtml('lab-ht-v', 'Сорт', VAR, 'genovese')}</div>${h.segHtml('lab-ht-t', 'Нагрев', [['60', '60 °C'], ['80', '80 °C'], ['100', 'Кипение']], '100')}${h.rangeHtml('lab-ht-m', 'Время на огне', 0, 30, 0.5, 10)}</div>
       <div class="heat-rows" id="lab-ht-rows"></div>
       <ul class="legend">${Object.values(h.FAM).map(f => `<li><i class="fam-dot ${f.cls}"></i>${f.name}</li>`).join('')}<li><i class="fam-dot is-ghost"></i>было в свежем листе</li></ul>` +
      h.readHtml([['Осталось аромата', 'lab-ht-tot'], ['Характер', 'lab-ht-c', 'is-wide']]);
    const st = { v: 'genovese', T: 100, m: 10 };
    const upd = () => {
      const prof = Object.assign({ hex: 3 }, h.CHEMO.find(c => c.id === st.v).p);
      const ids = Object.keys(prof).filter(k => h.MOLS[k]).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
      const T = st.T + 273.15;
      const sum0 = ids.reduce((a, k) => a + prof[k], 0);
      let sum1 = 0; const rest = {};
      ids.forEach(k => { const P = Math.exp(10.6 * (1 - (h.MOLS[k].bp + 273.15) / T)); const f = Math.exp(-1.48 * P * st.m); rest[k] = f; sum1 += prof[k] * f; });
      const mx = Math.max(...ids.map(k => prof[k]));
      $('#lab-ht-rows', el).innerHTML = ids.map(k => {
        const m = h.MOLS[k];
        return `<div class="heat-row"><span class="heat-name"><b>${m.name.replace(/^\(Z\)-3-/, '')}</b><small>${m.bp} °C</small></span>
          <span class="heat-bar"><i class="heat-ghost" style="--w:${prof[k] / mx * 100}%"></i><i class="heat-fill ${h.FAM[m.fam].cls}" style="--w:${prof[k] * rest[k] / mx * 100}%"></i></span>
          <span class="heat-val">${pct(rest[k])}</span></div>`;
      }).join('');
      set(el, 'lab-ht-tot', pct(sum1 / sum0));
      const lost = k => rest[k] < 0.5;
      const tone = [];
      if (st.m === 0) tone.push('свежий лист: все ноты на месте');
      else {
        if (lost('lin') && prof.lin > 10) tone.push('цветочная нота линалоола ушла');
        if (lost('cin')) tone.push('исчез освежающий холодок цинеола');
        if (rest.eug > 0.6 && prof.eug > 5) tone.push('осталась тёплая гвоздика эвгенола');
        if (rest.est > 0.5 && prof.est > 20) tone.push('анис эстрагола держится');
        if (rest.mci > 0.6 && prof.mci) tone.push('корица метилциннамата стойкая');
        if (prof.cit && lost('cit')) tone.push('лимон цитраля заметно ослаб');
        if (!tone.length) tone.push('аромат почти не изменился');
      }
      set(el, 'lab-ht-c', h.nb(tone.join('; ').replace(/^./, c => c.toUpperCase()) + '.' + (st.m > 5 && st.T >= 80 ? ' Кладите свежий базилик в последние 1–2 минуты или прямо в тарелку.' : '')));
    };
    h.bindPick(el, 'lab-ht-v', v => { st.v = v; upd(); });
    h.bindPick(el, 'lab-ht-t', v => { st.T = +v; upd(); });
    h.bindRange(el, 'lab-ht-m', v => `${fmt(v)} мин`, v => { st.m = v; upd(); });
    upd();
  });

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

  register('pairing', el => {
    const left = Object.keys(h.MOLS).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
    el.innerHTML = `${h.chipsHtml('lab-pa-c', 'Продукт', h.PAIRS.map(p => [p.id, p.name]), 'tomato')}
      <div class="lab-grid pair-grid"><div class="lab-chart" id="lab-pa-ch"></div><div class="pair-info" id="lab-pa-info" aria-live="polite"></div></div>`;
    let cur = h.PAIRS[0];
    const ch = h.chart($('#lab-pa-ch', el), {
      label: 'Общие ароматические молекулы базилика и выбранного продукта',
      h: () => left.length * 30 + 30,
      draw(w, hh) {
        const lx = Math.min(150, w * 0.42), rx = w - 16, ry = hh / 2;
        let s = `<text class="axis-lbl" x="4" y="14">молекулы базилика</text>`;
        left.forEach((k, i) => {
          const y = 34 + i * 30;
          const hit = cur.mols.includes(k), kin = (cur.kin || []).includes(k);
          const fam = h.FAM[h.MOLS[k].fam].cls;
          if (hit || kin) s += `<path class="pair-link ${fam}${kin ? ' is-kin' : ''}" d="M${lx + 10} ${y} C ${r1(lx + (rx - lx) * 0.5)} ${y} ${r1(lx + (rx - lx) * 0.45)} ${r1(ry)} ${r1(rx - 60)} ${r1(ry)}"/>`;
          s += `<circle class="pair-dot ${fam}${hit || kin ? ' is-hot' : ''}" cx="${lx}" cy="${y}" r="6"/>`;
          s += `<text class="pair-name${hit || kin ? ' is-hot' : ''}" x="${lx - 12}" y="${y + 4}" text-anchor="end">${h.MOLS[k].name.replace(/^\(Z\)-3-/, '')}</text>`;
        });
        const none = !cur.mols.length && !(cur.kin || []).length;
        s += `<g class="pair-node${none ? ' is-contrast' : ''}"><circle cx="${r1(rx - 44)}" cy="${r1(ry)}" r="40"/><text x="${r1(rx - 44)}" y="${r1(ry + (cur.name.length > 10 ? -2 : 4))}" text-anchor="middle">${esc(cur.name.split(/[ ,]/)[0])}</text>${cur.name.length > 10 ? `<text x="${r1(rx - 44)}" y="${r1(ry + 13)}" text-anchor="middle" class="pair-node-s">${esc(cur.name.split(/[ ,]+/).slice(1).join(' '))}</text>` : ''}</g>`;
        if (none) s += `<text class="band-lbl" x="${r1(rx - 44)}" y="${r1(ry + 60)}" text-anchor="middle">контраст</text>`;
        return s;
      }
    });
    const info = () => {
      const shared = cur.mols.map(h.molName);
      $('#lab-pa-info', el).innerHTML = `<p class="lab-kicker">${shared.length ? 'Общие молекулы' : (cur.kin ? 'Родство ароматов' : 'Принцип контраста')}</p>
        <h5>Базилик + ${cur.name.toLowerCase()}</h5>
        ${shared.length ? `<p class="pair-mols">${cur.mols.map(k => `<span><i class="fam-dot ${h.FAM[h.molFam(k)].cls}"></i>${h.molName(k)}</span>`).join('')}</p>` : ''}
        <p>${h.nb(cur.why)}</p>
        <dl class="data-rows"><div><dt>Какой сорт</dt><dd>${cur.variety}</dd></div><div><dt>Попробуйте</dt><dd>${cur.dish}</dd></div></dl>`;
    };
    h.bindPick(el, 'lab-pa-c', id => { cur = h.PAIRS.find(p => p.id === id); ch.redraw(); info(); });
    info();
  });
})();
