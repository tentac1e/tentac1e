  /* @use micro, ills */
  register('pigment', el => {
    el.innerHTML = h.head('Смешайте пигменты', 'Цвет листа по закону Бера — Ламберта: каждый пигмент поглощает свою часть спектра, отражённый остаток и есть цвет.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.chipsHtml('lab-pg-p', 'Пример', [['ok', 'Здоровый'], ['n', 'Нехватка азота'], ['p', 'Нехватка фосфора'], ['opal', 'Фиолетовый сорт'], ['old', 'Старый лист']], 'ok')}
          ${h.rangeHtml('lab-pg-c', 'Хлорофиллы', 0, 100, 1, 85)}${h.rangeHtml('lab-pg-k', 'Каротиноиды', 0, 100, 1, 60)}${h.rangeHtml('lab-pg-a', 'Антоцианы', 0, 100, 1, 5)}</div>
        <div class="pg-out"><div class="pg-leaf" id="lab-pg-leaf" aria-hidden="true"></div><p class="pg-verdict" id="lab-pg-v"></p></div>
      </div>`;
    const K = { c: [2.2, 0.55, 2.2], k: [0.02, 0.35, 1.8], a: [0.25, 2.2, 0.3] };
    const base = [0.47, 0.48, 0.44];
    const v = { c: 85, k: 60, a: 5 };
    const PRE = { ok: [85, 60, 5], n: [22, 55, 5], p: [70, 55, 55], opal: [60, 30, 100], old: [8, 42, 12] };
    const toS = x => { x = clamp(x, 0, 1); return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255); };
    const upd = () => {
      const rgb = [0, 1, 2].map(i => toS(base[i] * Math.exp(-(v.c / 100 * K.c[i] + v.k / 100 * K.k[i] + v.a / 100 * K.a[i]))));
      // the same leaf as in the guides, painted in the mixed colour; antocyanins also colour the veins
      $('#lab-pg-leaf', el).innerHTML = ill.svg(160, 150, `<rect width="160" height="150" rx="16" fill="${ill.F('bg')}"/>` + ill.leaf({ x: 80, y: 140, s: 1.22, color: `rgb(${rgb.join(' ')})`, purple: v.a > 45 ? (v.a - 45) / 110 : 0, seed: 7 }));
      const verdict = v.c < 20 && v.k < 30 ? 'Ткань обесцвечена: так выглядит некроз или сильный ожог.' : v.a > 55 && v.c > 35 ? 'Фиолетовый оттенок: антоцианы. У зелёного сорта — сигнал холода или нехватки фосфора.' : v.c < 40 && v.k >= 30 ? 'Хлороз: хлорофилла мало, проступили жёлтые каротиноиды. Ищите нехватку азота (снизу), магния или железа (между жилками).' : 'Здоровый зелёный: хлорофилл маскирует остальные пигменты.';
      set(el, 'lab-pg-v', verdict);
    };
    const rc = h.bindRange(el, 'lab-pg-c', x => x + ' %', x => { v.c = x; upd(); });
    const rk = h.bindRange(el, 'lab-pg-k', x => x + ' %', x => { v.k = x; upd(); });
    const ra = h.bindRange(el, 'lab-pg-a', x => x + ' %', x => { v.a = x; upd(); });
    h.bindPick(el, 'lab-pg-p', k => { rc.set(PRE[k][0]); rk.set(PRE[k][1]); ra.set(PRE[k][2]); });
    upd();
  });
