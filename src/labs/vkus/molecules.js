  register('molecules', el => {
    const ids = Object.keys(h.MOLS).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
    el.innerHTML = `<div class="mol-lab">
      <div class="mol-view"><div class="mol-stage"><canvas class="mol-canvas" id="lab-mol-cv" role="img" aria-label="Трёхмерная модель молекулы"></canvas><span class="mol-hint hand" aria-hidden="true">покрутите</span></div>
        <p class="mol-key"><span><i class="mk-c"></i>углерод</span><span><i class="mk-o"></i>кислород</span><span class="muted">водороды скрыты</span></p></div>
      <div class="mol-card" id="lab-mol-card" aria-live="polite"></div>
    </div>
    <div class="chips-row lab-chips mol-chips" id="lab-mol-chips" role="group" aria-label="Молекулы">${ids.map(id => `<button class="chip" type="button" data-v="${id}" aria-pressed="${id === 'lin'}"><i class="fam-dot ${h.FAM[h.MOLS[id].fam].cls}"></i>${h.MOLS[id].name}</button>`).join('')}</div>
    <div class="vol-scale" aria-label="Шкала летучести по температуре кипения">
      <div class="vol-track">${ids.map((id, i) => { const m = h.MOLS[id]; return `<button type="button" class="vol-chip ${h.FAM[m.fam].cls}" data-v="${id}" style="--x:${((m.bp - 115) / 160 * 100).toFixed(1)}%"><b>${m.name.replace(/^\(Z\)-3-/, '')}</b><small>${m.bp} °C</small></button>`; }).join('')}</div>
      <div class="vol-axis"><span>верхние ноты · улетают первыми</span><span>сердце</span><span>база · держатся дольше</span></div>
    </div>
    <ul class="legend">${Object.values(h.FAM).map(f => `<li><i class="fam-dot ${f.cls}"></i>${f.name}</li>`).join('')}</ul>`;
    const viewer = h.MolViewer($('#lab-mol-cv', el), 'lin');
    const card = id => {
      const m = h.MOLS[id];
      $('#lab-mol-card', el).innerHTML = `<p class="lab-kicker">${m.cls}</p><h4 class="mol-name">${m.name}</h4>${m.alt ? `<p class="mol-alt">${m.alt}</p>` : ''}
        <p class="mol-formula">${h.sub(m.formula)} · кипит при ${m.bp} °C</p>
        <dl class="data-rows"><div><dt>Пахнет</dt><dd>${m.smell}</dd></div><div><dt>Есть также в</dt><dd>${m.where}</dd></div><div><dt>Сорта базилика</dt><dd>${m.basil}</dd></div></dl>
        <p>${h.nb(m.note)}</p>`;
      $$('[data-v]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === id)));
    };
    el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b || !el.contains(b)) return; viewer.set(b.dataset.v); card(b.dataset.v); });
    card('lin');
    const track = $('.vol-track', el);
    const layout = () => {
      const W = track.clientWidth;
      if (!W) return;
      const rows = [];
      $$('.vol-chip', track).forEach(c => {
        const w = c.offsetWidth, x = parseFloat(c.style.getPropertyValue('--x')) / 100 * W;
        const left = clamp(x - w / 2, 4, W - w - 4);
        let r = rows.findIndex(end => end + 6 < left);
        if (r < 0) { rows.push(0); r = rows.length - 1; }
        rows[r] = left + w;
        c.style.left = left + 'px';
        c.style.translate = '0 0';
        c.style.top = (8 + r * 42) + 'px';
      });
      track.style.height = (rows.length * 42 + 12) + 'px';
    };
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(track);
  });
