  register('pathway', el => {
    // the tree as drawn on a wide screen: x as a share of the width, y in pixels
    const NODES = {
      sug: [0.53, 30, 'Сахара фотосинтеза'], ipp: [0.32, 100, 'IPP и DMAPP · C₅'], gpp: [0.19, 176, 'ГДФ · C₁₀'], fpp: [0.455, 176, 'ФДФ · C₁₅'], ger: [0.315, 256, 'Гераниол'],
      phe: [0.74, 100, 'Фенилаланин · C₉'], cia: [0.74, 176, 'Коричная кислота'], con: [0.74, 256, 'Кониферилацетат'], chv: [0.595, 256, 'Хавикол']
    };
    const ENDS = { lin: [0.07, 256], cin: [0.19, 256], cit: [0.315, 336], car: [0.455, 256], est: [0.595, 336], mci: [0.915, 256], eug: [0.74, 336], meu: [0.74, 416] };
    const PATHS = {
      lin: ['sug', 'ipp', 'gpp', 'lin'], cin: ['sug', 'ipp', 'gpp', 'cin'], cit: ['sug', 'ipp', 'gpp', 'ger', 'cit'], car: ['sug', 'ipp', 'fpp', 'car'],
      est: ['sug', 'phe', 'cia', 'chv', 'est'], mci: ['sug', 'phe', 'cia', 'mci'], eug: ['sug', 'phe', 'cia', 'con', 'eug'], meu: ['sug', 'phe', 'cia', 'con', 'eug', 'meu']
    };
    const ENZ = { 'gpp-lin': 'LIS', 'gpp-cin': 'CinS', 'gpp-ger': 'GES', 'ger-cit': 'ADH', 'fpp-car': 'TPS', 'phe-cia': 'PAL', 'cia-mci': 'CCMT', 'chv-est': 'CVOMT', 'con-eug': 'EGS', 'eug-meu': 'EOMT', 'cia-chv': '', 'cia-con': '' };
    const INFO = {
      lin: ['Линалоол', 'Линалоолсинтаза (LIS) превращает геранилдифосфат в линалоол одним шагом. Её активность — главное отличие европейских сортов.', 'генуэзский, греческий, фиолетовые, «Пурпурный шар»'],
      cin: ['1,8-Цинеол', 'Цинеолсинтаза (CinS) замыкает геранилдифосфат в бициклический эфир.', 'генуэзский, африканский синий'],
      cit: ['Цитраль', 'Гераниолсинтаза (GES) даёт гераниол, а дегидрогеназы (ADH) окисляют его до альдегидов гераниаля и нераля — вместе это цитраль.', 'лимонный, лаймовый'],
      car: ['β-Кариофиллен', 'Сесквитерпенсинтазы (TPS) сворачивают пятнадцатиуглеродный фарнезилдифосфат в кольца.', 'тулси, лимонный'],
      est: ['Эстрагол', 'Хавикол-O-метилтрансфераза (CVOMT) пришивает метильную группу к хавиколу. Сильный фермент — анисовый тайский базилик.', 'тайский, фиолетовые, «Арарат», «Анисовый восторг»'],
      mci: ['Метилциннамат', 'Метилтрансфераза коричной кислоты (CCMT) превращает её в метиловый эфир с запахом корицы и клубники.', 'коричный; по аромату — «Карамельный»'],
      eug: ['Эвгенол', 'Эвгенолсинтаза (EGS) снимает ацетатную группу с кониферилацетата — получается эвгенол.', 'генуэзский, гвоздичный, тулси, «Философ», «Василиск»'],
      meu: ['Метилэвгенол', 'Эвгенол-O-метилтрансфераза (EOMT) метилирует эвгенол. Много её у тулси.', 'тулси']
    };
    const TERP = ['lin', 'cin', 'cit', 'car'], PHEN = ['est', 'mci', 'eug', 'meu'];
    const short = k => h.molName(k).replace(/^1,8-|^β-/, '');
    el.innerHTML = h.head('Два конвейера аромата', 'Базилик собирает аромат на двух конвейерах: терпены — из пятиуглеродных «кирпичиков», фенилпропаноиды — из аминокислоты фенилаланина. Выберите молекулу, чтобы увидеть её путь и ферменты на каждом шаге.') +
      `<div class="pw-pick" id="lab-pw-pick" role="group" aria-label="Молекула">${TERP.concat(PHEN).map(k => `<button type="button" class="chip pw-chip" data-k="${k}" aria-pressed="false"><i style="background:var(--m-${k})"></i>${short(k)}</button>`).join('')}</div>
       <div class="lab-chart pw-chart" id="lab-pw-ch"></div>
       <div class="pw-info" id="lab-pw-info" aria-live="polite"></div>`;
    let sel = 'eug';
    const pill = (x, y, w, text, cls, k, mk) => `<g class="${cls}"${mk ? ` style="--mk:var(--m-${mk})"` : ''}${k ? ` data-k="${k}" tabindex="0" role="button" aria-label="${text}"` : ''}><rect x="${r1(x - w / 2)}" y="${y - 15}" width="${r1(w)}" height="30" rx="${k ? 10 : 15}"/><text x="${r1(x)}" y="${y + 4.5}" text-anchor="middle">${text}</text></g>`;
    const tw = (t, big) => t.length * (big ? 8.1 : 7.6) + 20;
    const arrow = (x1, y1, x2, y2, hot, enz, side = 1) => {
      let s = `<line class="pw-edge${hot ? ' is-hot' : ''}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" marker-end="url(#lab-pw-ah${hot ? '-hot' : ''})"/>`;
      if (enz) s += `<text class="pw-enz${hot ? ' is-hot' : ''}" x="${r1((x1 + x2) / 2 + side * 7)}" y="${r1((y1 + y2) / 2 + 4)}" text-anchor="${side > 0 ? 'start' : 'end'}">${enz}</text>`;
      return s;
    };
    const ch = h.chart($('#lab-pw-ch', el), {
      label: 'Схема биосинтеза ароматических веществ базилика',
      h: w => (w >= 700 ? 440 : 88 + 70 * (Math.max(TERP.includes(sel) ? PATHS[sel].length - 1 : 3, PHEN.includes(sel) ? PATHS[sel].length - 1 : 4) - 1) + 58),
      draw(w, hh) {
        const path = PATHS[sel], on = new Set(path), edges = new Set(path.slice(1).map((b, i) => path[i] + '-' + b));
        let s = `<defs>${['', '-hot'].map(k => `<marker id="lab-pw-ah${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="pw-ah${k ? ' is-hot' : ''}"/></marker>`).join('')}</defs>`;
        if (w >= 700) {
          const X = f => Math.round(f * w);
          const pos = k => (NODES[k] || ENDS[k]);
          const width = k => (NODES[k] ? tw(NODES[k][2]) : tw(short(k), true));
          const E = [['sug', 'ipp'], ['sug', 'phe'], ['ipp', 'gpp'], ['ipp', 'fpp'], ['gpp', 'lin'], ['gpp', 'cin'], ['gpp', 'ger'], ['ger', 'cit'], ['fpp', 'car'], ['phe', 'cia'], ['cia', 'mci'], ['cia', 'chv'], ['cia', 'con'], ['chv', 'est'], ['con', 'eug'], ['eug', 'meu']];
          s += `<rect class="pw-lane" x="6" y="62" width="${X(0.53) - 16}" height="${hh - 70}" rx="18"/><rect class="pw-lane is-phen" x="${X(0.53) + 6}" y="62" width="${w - X(0.53) - 12}" height="${hh - 70}" rx="18"/>`;
          s += `<text class="pw-zone" x="18" y="${hh - 18}">терпены</text><text class="pw-zone" x="${w - 18}" y="${hh - 18}" text-anchor="end">фенилпропаноиды</text>`;
          E.forEach(([a, b]) => {
            const A = pos(a), B = pos(b), hot = edges.has(a + '-' + b);
            let x1 = X(A[0]), y1 = A[1] + 16, x2 = X(B[0]), y2 = B[1] - 17;
            if (Math.abs(A[1] - B[1]) < 8) { x1 = X(A[0]) + width(a) / 2; y1 = A[1]; x2 = X(B[0]) - width(b) / 2 - 4; y2 = B[1]; }
            s += arrow(x1, y1, x2, y2, hot, ENZ[a + '-' + b], x2 >= x1 ? 1 : -1);
          });
          Object.entries(NODES).forEach(([k, [f, y, t]]) => { s += pill(X(f), y, width(k), t, `pw-node${on.has(k) ? ' is-hot' : ''}`); });
          Object.entries(ENDS).forEach(([k, [f, y]]) => { s += pill(Math.min(w - width(k) / 2 - 4, Math.max(width(k) / 2 + 4, X(f))), y, width(k), short(k), `pw-end${k === sel ? ' is-sel' : ''}${on.has(k) ? ' is-hot' : ''}`, k, k); });
          return s;
        }
        // phone: two conveyors side by side, each shows the chain that leads to the chosen molecule
        const cx = [w * 0.26, w * 0.74], cw = w * 0.46;
        s += `<rect class="pw-lane" x="2" y="52" width="${r1(w / 2 - 6)}" height="${hh - 56}" rx="16"/><rect class="pw-lane is-phen" x="${r1(w / 2 + 4)}" y="52" width="${r1(w / 2 - 6)}" height="${hh - 56}" rx="16"/>`;
        s += pill(w / 2, 24, tw('Сахара фотосинтеза'), 'Сахара фотосинтеза', 'pw-node is-hot');
        [[TERP, ['ipp', 'gpp', 'lin'], 'терпены'], [PHEN, ['phe', 'cia', 'con', 'eug'], 'фенилпропаноиды']].forEach(([group, fallback, name], c) => {
          const mine = group.includes(sel);
          const chain = mine ? PATHS[sel].slice(1) : fallback;
          const x = cx[c];
          s += arrow(w / 2 + (c ? 30 : -30), 40, x, 70, mine, '', 1);
          chain.forEach((k, i) => {
            const y = 88 + i * 70;
            const isEnd = !NODES[k];
            const text = isEnd ? short(k) : NODES[k][2].replace(' · ', ' ');
            s += pill(x, y, Math.min(cw - 8, tw(text, isEnd)), text, `${isEnd ? 'pw-end' : 'pw-node'}${mine ? ' is-hot' : ' is-idle'}${k === sel ? ' is-sel' : ''}`, isEnd && mine ? k : null, isEnd ? k : null);
            if (i < chain.length - 1) s += arrow(x, y + 16, x, y + 53, mine, ENZ[k + '-' + chain[i + 1]], 1);
          });
          s += `<text class="pw-zone" x="${r1(x)}" y="${hh - 12}" text-anchor="middle">${name}</text>`;
        });
        return s;
      }
    });
    const info = () => {
      const inf = INFO[sel];
      $('#lab-pw-info', el).innerHTML = `<p class="lab-kicker">${TERP.includes(sel) ? 'Терпеновый конвейер' : 'Фенилпропаноидный конвейер'}</p><h5>${inf[0]}</h5><p>${h.nb(inf[1])}</p><p class="pw-sorts">Много у сортов: ${inf[2]}</p>`;
      $$('.pw-chip', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === sel)));
    };
    const choose = k => { if (!k || !INFO[k]) return; sel = k; ch.redraw(); info(); };
    $('#lab-pw-pick', el).addEventListener('click', e => { const b = e.target.closest('.pw-chip'); if (b) choose(b.dataset.k); });
    ch.svg.addEventListener('click', e => { const g = e.target.closest('.pw-end[data-k]'); if (g) choose(g.dataset.k); });
    ch.svg.addEventListener('keydown', e => { const g = e.target.closest && e.target.closest('.pw-end[data-k]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(g.dataset.k); } });
    info();
  });
