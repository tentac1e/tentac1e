  register('chemotype', el => {
    const cols = h.CHEMO_COLS;
    el.innerHTML = `<div class="lab-scroll"><table class="chemo" id="lab-ch-t"><caption class="sr-only">Доли ароматических веществ в эфирном масле сортов базилика, проценты</caption>
      <thead><tr><th scope="col">Сорт</th>${cols.map(c => `<th scope="col"><span>${h.molName(c).replace(/^1,8-/, '').replace(/^α-|^β-/, '')}</span></th>`).join('')}</tr></thead>
      <tbody>${h.CHEMO.map((r, i) => `<tr data-i="${i}"><th scope="row"><button type="button" class="chemo-row" data-i="${i}" aria-pressed="${i === 0}">${r.name}</button></th>${cols.map(c => {
        const v = r.p[c] || 0;
        return `<td>${v ? `<span class="bub ${h.FAM[h.molFam(c)].cls}" style="--s:${(Math.sqrt(v / 75) * 34).toFixed(1)}px" title="${h.molName(c)}: ${v} %"></span>${v >= 10 ? `<small>${v}</small>` : `<span class="sr-only">${v} %</span>`}` : '<span class="bub-none" aria-label="нет">·</span>'}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>
      <ul class="legend">${['mono', 'phen', 'sesq'].map(k => `<li><i class="fam-dot ${h.FAM[k].cls}"></i>${h.FAM[k].name}</li>`).join('')}<li class="muted">числа — доля в масле, %; ориентир по опубликованным анализам</li></ul>
      <div class="chemo-info" id="lab-ch-info" aria-live="polite"></div>`;
    const info = i => {
      const r = h.CHEMO[i];
      const top = Object.entries(r.p).sort((a, b) => b[1] - a[1]).slice(0, 3);
      $('#lab-ch-info', el).innerHTML = `<h5>${r.name}</h5><p>${h.nb(r.why)}</p><p class="chemo-top">${top.map(([k, v]) => `<span><i class="fam-dot ${h.FAM[h.molFam(k)].cls}"></i>${h.molName(k)} <b>${v} %</b></span>`).join('')}</p>`;
      $$('.chemo-row', el).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
      $$('tbody tr', el).forEach(tr => tr.classList.toggle('is-sel', +tr.dataset.i === i));
    };
    el.addEventListener('click', e => { const b = e.target.closest('.chemo-row'); if (b) info(+b.dataset.i); });
    info(0);
  });
