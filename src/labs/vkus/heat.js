  register('heat', el => {
    // any sort of the catalogue; its oil is that of its chemotype
    const SORTS = ((window.BASIL && window.BASIL.VARIETIES) || []).filter(x => h.CHEMO.some(g => g.id === x.chem));
    el.innerHTML = h.head('Когда класть базилик', 'Модель открытой кастрюли: скорость потери каждой молекулы пропорциональна давлению её пара, оценённому по правилу Трутона. Внизу — что останется от аромата выбранного сорта.', true) +
      `<div class="lab-controls lab-row-wrap"><div class="field lab-field heat-sort"><label for="lab-ht-v">Сорт</label><select id="lab-ht-v">${SORTS.map((x, k) => `<option value="${k}">${x.name.replace(/, святой базилик$/, '')}</option>`).join('')}</select></div>${h.segHtml('lab-ht-t', 'Нагрев', [['60', '60 °C'], ['80', '80 °C'], ['100', 'Кипение']], '100')}${h.rangeHtml('lab-ht-m', 'Время на огне', 0, 30, 0.5, 10)}</div>
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
    $('#lab-ht-v', el).addEventListener('change', e => { st.v = (SORTS[+e.target.value] || {}).chem || 'genovese'; upd(); });
    h.bindPick(el, 'lab-ht-t', v => { st.T = +v; upd(); });
    h.bindRange(el, 'lab-ht-m', v => `${fmt(v)} мин`, v => { st.m = v; upd(); });
    upd();
  });
