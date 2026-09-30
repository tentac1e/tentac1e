  /* ================================================================== */
  /* NUTRIENTS: NPK decoder                                              */
  /* ================================================================== */
  function initNpk() {
    const inN = $('#npk-n'), inP = $('#npk-p'), inK = $('#npk-k');
    const out = $('#npk-out');
    const presets = $('#npk-presets');
    if (!inN || !out) return;
    presets.innerHTML = B.NPK_PRESETS.map(([label, name], i) => `<button class="chip" type="button" data-i="${i}" title="${name}">${label}</button>`).join('');
    const chips = $$('.chip', presets);
    const render = () => {
      const n = Math.max(0, parseFloat(String(inN.value).replace(',', '.')) || 0);
      const p = Math.max(0, parseFloat(String(inP.value).replace(',', '.')) || 0);
      const k = Math.max(0, parseFloat(String(inK.value).replace(',', '.')) || 0);
      chips.forEach((c, i) => { const v = B.NPK_PRESETS[i][2]; c.setAttribute('aria-pressed', String(v[0] === n && v[1] === p && v[2] === k)); });
      const sum = n + p + k;
      if (!sum) { out.innerHTML = '<p>Введите хотя бы одно число больше нуля.</p>'; return; }
      const sn = n / sum, sp = p / sum, sk = k / sum;
      let kind, text;
      if (sn >= 0.6) { kind = 'Азотное'; text = 'Для наращивания зелени в фазе активного роста. Не давайте его за 2 недели до сбора на заготовки.'; }
      else if (sk >= 0.6) { kind = 'Калийное'; text = 'Для аромата и плотного листа, в период срезок и в конце сезона.'; }
      else if (sp >= 0.45 && sn < 0.15) { kind = 'Фосфорно-калийное'; text = 'Для корней рассады, приживания после пересадки и цветения на семена.'; }
      else if (sp >= 0.45) { kind = 'Фосфорное'; text = 'Для корней и рассады. Для взрослого базилика фосфора слишком много.'; }
      else if (sn > 0.28 && sk > 0.28 && sp < 0.2) { kind = 'Азотно-калийное'; text = 'Отличный выбор для базилика в период роста и регулярных срезок.'; }
      else { kind = 'Сбалансированное'; text = 'Универсальное: подходит на большинстве стадий в половинной дозе.'; }
      const cos = st => {
        const d = Math.hypot(st.N, st.P, st.K) * Math.hypot(n, p, k);
        return d ? (st.N * n + st.P * p + st.K * k) / d : 0;
      };
      const ranked = B.STAGES.map((st, i) => ({ i, s: cos(st) })).filter(x => B.STAGES[x.i].N + B.STAGES[x.i].P + B.STAGES[x.i].K > 0).sort((a, b) => b.s - a.s).slice(0, 3);
      const seg = (cls, v, label) => `<span class="k-${cls}" style="flex-grow:${Math.max(v, 0.0001)}">${v / sum >= 0.14 ? label : ''}</span>`;
      out.innerHTML = `
        <div class="npk-stack" role="img" aria-label="Доли: N ${Math.round(sn * 100)}%, P ${Math.round(sp * 100)}%, K ${Math.round(sk * 100)}%">${seg('n', n, 'N ' + Math.round(sn * 100) + '%')}${seg('p', p, 'P ' + Math.round(sp * 100) + '%')}${seg('k', k, 'K ' + Math.round(sk * 100) + '%')}</div>
        <p class="npk-kind">${kind}</p>
        <p>${nb(text)}</p>
        <div><span class="muted">Ближе всего к стадиям:</span><div class="npk-match">${ranked.map((r, j) => `<span class="badge${j === 0 ? ' is-best' : ''}">${r.i + 1}. ${B.STAGES[r.i].short}</span>`).join('')}</div></div>
        <p class="muted">Фосфор и калий на упаковке указаны в пересчёте на оксиды P₂O₅ и K₂O — так принято, сравнивать удобрения удобно именно по этим числам.</p>`;
    };
    presets.addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      const v = B.NPK_PRESETS[+c.dataset.i][2];
      inN.value = v[0]; inP.value = v[1]; inK.value = v[2];
      render();
    });
    [inN, inP, inK].forEach(el => el.addEventListener('input', render));
    render();
  }

