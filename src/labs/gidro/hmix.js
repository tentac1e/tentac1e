  /* A nutrient solution from a concentrate: what the water already has (its own EC) is subtracted, the rest comes
     from the fertilizer. EC grows nearly in proportion to the dose at these strengths, so one line from the label —
     «so many ml per litre give EC so much» — is enough to scale. Check with the meter: labels and water vary. */
  const MIX_PARTS = { 2: ['A', 'B'], 1: ['удобрение'], 3: ['A', 'B', 'C'] };
  register('hmix', el => {
    el.innerHTML = h.head('Раствор для гидропоники', 'Объём, вода из крана и нужная EC — калькулятор скажет, сколько миллилитров каждой части налить. Доза с этикетки по умолчанию — типичная для удобрений для гидропоники; впишите свою.') +
      `<div class="lab-controls">
        <div class="row-3 lab-row hm-row">
          <div class="field"><label for="lab-hm-v">Воды, л</label><input type="number" id="lab-hm-v" min="0.5" max="200" step="0.5" value="10" inputmode="decimal"></div>
          <div class="field"><label for="lab-hm-d">По этикетке, мл на 1 л</label><input type="number" id="lab-hm-d" min="0.1" max="20" step="0.1" value="2" inputmode="decimal"></div>
          <div class="field"><label for="lab-hm-e">Эта доза даёт EC</label><input type="number" id="lab-hm-e" min="0.2" max="4" step="0.1" value="1" inputmode="decimal"></div>
        </div>
        ${h.segHtml('lab-hm-p', 'Удобрение', [['2', 'A + B'], ['1', 'одна часть'], ['3', 'A + B + C']], '2')}
        ${h.rangeHtml('lab-hm-w', 'EC воды из крана', 0, 1.2, 0.05, 0.4)}
        ${h.rangeHtml('lab-hm-t', 'Нужная EC', 0.4, 2, 0.05, 1.2)}
      </div>
      <div class="hm-out" id="lab-hm-out" aria-live="polite"></div>`;
    let parts = 2;
    const num = id => { const v = parseFloat(String($('#' + id, el).value).replace(',', '.')); return isFinite(v) && v > 0 ? v : 0; };
    const stage = t => t < 0.85 ? 'сеянцы' : t < 1.45 ? 'рост и срезки' : t <= 1.65 ? 'регулярные срезки' : 'крепко для базилика';
    let w = 0.4, t = 1.2;
    const upd = () => {
      const V = num('lab-hm-v'), dose = num('lab-hm-d'), ecL = num('lab-hm-e'), out = $('#lab-hm-out', el);
      if (!V || !dose || !ecL) { out.innerHTML = '<p class="lab-foot">Впишите объём и дозу с этикетки.</p>'; return; }
      const need = t - w;
      if (need <= 0.02) {
        out.innerHTML = `<p class="hm-warn">${h.nb(`Вода из крана уже даёт EC ${fmt(w, 2)} — столько, сколько нужно, или больше. Разбавьте её фильтрованной или бутилированной водой.`)}</p>`;
        return;
      }
      const perL = dose * need / ecL, total = perL * V, step = dose * 0.1 / ecL * V;
      const names = MIX_PARTS[parts];
      out.innerHTML = `<div class="hm-parts">${names.map((n, i) => `<div class="hm-part"><span class="hm-k">${parts > 1 ? 'Часть ' : ''}${n}</span><b>${h.nb(fmt(total, total < 10 ? 1 : 0) + ' мл')}</b><small>${h.nb(fmt(perL, 2) + ' мл на литр')}</small></div>`).join('')}</div>
        <ol class="hm-steps">
          <li>${h.nb(`${V % 1 ? fmt(V) : fmt0(V)} л воды комнатной температуры: её EC ≈ ${fmt(w, 2)}.`)}</li>
          ${names.map((n, i) => `<li>${h.nb(`${parts > 1 ? 'Часть ' + n : 'Удобрение'} — ${fmt(total, total < 10 ? 1 : 0)} мл${i < names.length - 1 ? ', перемешайте' : ', перемешайте и подождите 10–15 минут'}.`)}</li>`).join('')}
          <li>${h.nb(`Проверьте EC: должно быть около ${fmt(t, 2)} (${stage(t)}). Каждые +0,1 — ещё ≈ ${fmt(step, 1)} мл ${parts > 1 ? 'каждой части' : 'удобрения'}.`)}</li>
          <li>${h.nb('pH — последним: до 5,8–6,2, pH‑минус по капле, мешая и меряя через 5 минут.')}</li>
        </ol>
        ${w > 0.8 ? `<p class="hm-warn">${h.nb(`Вода жёсткая или солёная (EC ${fmt(w, 2)}): в ней много кальция и бикарбонатов, pH будет ползти вверх. Лучше смешать её пополам с фильтрованной.`)}</p>` : ''}
        ${t > 1.8 ? `<p class="hm-warn">${h.nb('Выше 1,8 базилику уже крепко: кончики листьев могут подгорать.')}</p>` : ''}`;
    };
    $$('input[type="number"]', el).forEach(i => i.addEventListener('input', upd));
    h.bindPick(el, 'lab-hm-p', v => { parts = +v; upd(); });
    h.bindRange(el, 'lab-hm-w', v => `${fmt(v, 2)} мС/см`, v => { w = v; upd(); });
    h.bindRange(el, 'lab-hm-t', v => `${fmt(v, 2)} · ${stage(v)}`, v => { t = v; upd(); });
    upd();
  });
