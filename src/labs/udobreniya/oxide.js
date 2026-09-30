  register('oxide', el => {
    el.innerHTML = h.head('Пересчёт оксидов в элементы', 'Введите числа с упаковки и сколько граммов удобрения вы растворяете.') +
      `<div class="row-3 lab-row">
        <div class="field"><label for="lab-ox-n">N, %</label><input type="number" id="lab-ox-n" min="0" max="60" step="0.5" value="16" inputmode="decimal"></div>
        <div class="field"><label for="lab-ox-p">P₂O₅, %</label><input type="number" id="lab-ox-p" min="0" max="60" step="0.5" value="16" inputmode="decimal"></div>
        <div class="field"><label for="lab-ox-k">K₂O, %</label><input type="number" id="lab-ox-k" min="0" max="60" step="0.5" value="16" inputmode="decimal"></div>
      </div>
      <div class="field lab-field"><label for="lab-ox-g">Граммов удобрения</label><input type="number" id="lab-ox-g" min="0.1" max="1000" step="0.5" value="10" inputmode="decimal"></div>
      <div class="ox-rows" id="lab-ox-out" aria-live="polite"></div>`;
    const upd = () => {
      const n = +$('#lab-ox-n', el).value || 0, p = +$('#lab-ox-p', el).value || 0, k = +$('#lab-ox-k', el).value || 0, g = +$('#lab-ox-g', el).value || 0;
      const rows = [['Азот', 'N', n, n, 's1'], ['Фосфор', 'P₂O₅ → P', p, p * 0.436, 's2'], ['Калий', 'K₂O → K', k, k * 0.83, 's3']];
      const mx = Math.max(1, n, p, k);
      $('#lab-ox-out', el).innerHTML = rows.map(([name, lab, onPack, real, c]) => `
        <div class="ox-row"><span class="ox-name"><b>${name}</b><small>${lab}</small></span>
          <span class="ox-bars"><i class="ox-pack" style="--w:${onPack / mx * 100}%"></i><i class="ox-real ${c}" style="--w:${real / mx * 100}%"></i></span>
          <span class="ox-val"><b>${fmt(real)} %</b><small>${fmt(g * real / 100, 2)} г</small></span></div>`).join('') +
        `<p class="lab-foot">Серая полоса — цифра на упаковке, цветная — чистый элемент. В ${fmt(g)} г удобрения: ${fmt(g * n / 100, 2)} г N, ${fmt(g * p * 0.436 / 100, 2)} г P и ${fmt(g * k * 0.83 / 100, 2)} г K.</p>`;
    };
    $$('input', el).forEach(i => i.addEventListener('input', upd));
    upd();
  });
