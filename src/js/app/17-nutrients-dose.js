  /* ================================================================== */
  /* NUTRIENTS: dose calculator                                          */
  /* ================================================================== */
  const FRACTIONS = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']];
  function spoonFraction(x) {
    let whole = Math.floor(x);
    const rest = x - whole;
    let best = FRACTIONS[0];
    FRACTIONS.forEach(f => { if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f; });
    let sym = best[1];
    if (best[0] === 1) { whole += 1; sym = ''; }
    if (!whole && !sym) sym = '⅛';
    return whole ? (sym ? `${whole}\u00a0${sym}` : `${whole}`) : sym;
  }
  function spoonText(tsp) {
    if (tsp < 0.09) return 'на кончике ложки — лучше взвесить';
    if (tsp >= 3) return `≈ ${spoonFraction(tsp / 3)}\u00a0ст.\u00a0л.`;
    return `≈ ${spoonFraction(tsp)}\u00a0ч.\u00a0л.`;
  }

  function initDose() {
    const form = $('#dose-form');
    const sel = $('#dose-fert');
    const water = $('#dose-water');
    const out = $('#dose-out');
    if (!form || !sel || !water || !out) return;
    sel.innerHTML = B.DOSE.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    sel.value = 'kno3';
    const render = () => {
      const f = B.DOSE.find(d => d.id === sel.value) || B.DOSE[0];
      const L = clamp(parseFloat(String(water.value).replace(',', '.')) || 0, 0, 1000);
      const sv = (form.querySelector('input[name="dose-strength"]:checked') || {}).value || '0.5';
      if (sv === 'foliar' && !f.foliar) {
        out.innerHTML = `<div class="spoons">Для опрыскивания это удобрение не используют.</div><p class="dose-note">${nb(f.note)}</p>`;
        return;
      }
      const k = sv === 'foliar' ? f.foliar : parseFloat(sv);
      const gL = f.gL * k;
      const grams = gL * L;
      const label = { '1': 'полная доза', '0.5': 'половина дозы', '0.25': 'четверть дозы', foliar: 'для опрыскивания' }[sv];
      out.innerHTML = `
        <div class="big">${fmtNum(grams, grams < 10 ? 1 : 0)}<small>г</small></div>
        <div class="spoons">${spoonText(grams / f.tsp)} на ${fmtNum(L, 2)}\u00a0л воды</div>
        <div class="meta">${fmtNum(gL, 2)}\u00a0г/л · ${label}</div>
        <p class="dose-note">${nb(f.note)}${sv === 'foliar' ? ' Опрыскивайте вечером или в пасмурную погоду.' : ' Вносите по влажному грунту.'}</p>`;
    };
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', e => e.preventDefault());
    render();
  }

