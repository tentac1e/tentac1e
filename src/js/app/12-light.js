  /* ================================================================== */
  /* LIGHT (DLI)                                                         */
  /* ================================================================== */
  function initDli() {
    const ppfd = $('#dli-ppfd');
    const hours = $('#dli-hours');
    const out = $('#dli-out');
    if (!ppfd || !hours || !out) return;
    const chips = $$('#dli-presets .chip');
    const render = () => {
      const p = clamp(parseFloat(ppfd.value) || 0, 0, 2000);
      const h = clamp(parseFloat(hours.value) || 0, 0, 24);
      $('#dli-hours-val').textContent = String(h);
      chips.forEach(c => c.setAttribute('aria-pressed', String(+c.dataset.ppfd === p)));
      const dli = p * h * 0.0036;
      const pos = clamp(dli / 30, 0, 1) * 100;
      let verdict;
      if (dli < 8) verdict = 'Мало: базилик вытянется и не наберёт аромата.';
      else if (dli < 12) verdict = 'Маловато: растёт, но медленно и бледнеет.';
      else if (dli <= 17) verdict = 'Норма для базилика.';
      else if (dli <= 22) verdict = 'Много: отлично, если хватает воды и тепла.';
      else verdict = 'Очень много: следите за перегревом и поливом.';
      const need = p > 0 ? 14 / (p * 0.0036) : Infinity;
      let hint;
      if (need > 18) hint = 'Даже 18 часов не хватит до нормы: опустите лампу ближе или возьмите мощнее.';
      else hint = `Для DLI 14 (середина нормы) с этой лампой нужно около ${Math.round(need)}\u00a0${plural(Math.round(need), 'часа', 'часов', 'часов')} света в сутки.`;
      if (need < 10) hint += ' Можно поднять лампу выше или сократить время её работы.';
      out.innerHTML = `
        <div class="big">${fmtNum(dli, 1)}<small>моль/м² в сутки</small></div>
        <div class="dli-gauge" aria-hidden="true"><i style="left:${pos}%"></i></div>
        <div class="dli-scale" aria-hidden="true"><span>0</span><span>8</span><span>12</span><span>17</span><span>22</span><span>30</span></div>
        <p class="dli-verdict">${verdict}</p>
        <p class="dli-hint">${hint}</p>`;
    };
    chips.forEach(c => c.addEventListener('click', () => { ppfd.value = c.dataset.ppfd; render(); }));
    [ppfd, hours].forEach(el => el.addEventListener('input', render));
    render();
  }

