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
