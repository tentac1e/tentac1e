  /* ================================================================== */
  /* SOIL CALCULATOR                                                     */
  /* ================================================================== */
  function initSoil() {
    const sel = $('#soil-recipe');
    const vol = $('#soil-volume');
    const cnt = $('#soil-count');
    const out = $('#soil-out');
    if (!sel || !out) return;
    sel.innerHTML = B.SOIL_RECIPES.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    const render = () => {
      const r = B.SOIL_RECIPES.find(x => x.id === sel.value) || B.SOIL_RECIPES[0];
      const v = clamp(parseFloat(String(vol.value).replace(',', '.')) || 0, 0, 1000);
      const n = clamp(parseInt(cnt.value, 10) || 0, 0, 1000);
      const total = v * n * 1.1;
      const parts = r.parts.reduce((s, p) => s + p[1], 0);
      out.innerHTML = `
        <div class="soil-bar" role="img" aria-label="Пропорции смеси">${r.parts.map(p => `<span class="mx-${p[2]}" style="flex:${p[1]}">${p[0]} · ${p[1]}</span>`).join('')}</div>
        <ul class="soil-list">${r.parts.map(p => `<li><span><i class="mx-${p[2]}"></i>${p[0]}</span><b>${fmtNum(total * p[1] / parts, 1)}\u00a0л</b></li>`).join('')}</ul>
        <p class="soil-total">Всего ${fmtNum(total, 1)}\u00a0л смеси с запасом 10&nbsp;% на усадку. Керамзит для дренажа — около ${fmtNum(v * n * 0.1, 1)}\u00a0л.</p>
        <p class="muted">${nb(r.note)}</p>`;
    };
    [sel, vol, cnt].forEach(el => el.addEventListener('input', render));
    render();
  }

