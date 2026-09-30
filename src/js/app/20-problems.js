  /* ================================================================== */
  /* PROBLEMS                                                            */
  /* ================================================================== */
  let selectSymptom = () => {};
  function initDiagnostics() {
    const groups = $('#diag-groups');
    const result = $('#diag-result');
    if (!groups || !result) return;
    const all = [];
    groups.innerHTML = B.DIAG.map(g => `
      <div class="diag-group">
        <h4>${g.group}</h4>
        <div class="chips">${g.items.map(it => { all.push(it); return `<button class="chip" type="button" data-id="${it.id}" aria-pressed="false">${it.title}</button>`; }).join('')}</div>
      </div>`).join('');
    const chips = $$('.chip', groups);
    selectSymptom = (id, scroll) => {
      const it = all.find(x => x.id === id) || all[0];
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id === it.id)));
      result.innerHTML = `
        <h3>${it.title}</h3>
        <p class="hint">${it.causes.length > 1 ? `${it.causes.length} ${plural(it.causes.length, 'возможная причина', 'возможные причины', 'возможных причин')}, от частой к редкой` : 'Наиболее вероятная причина'}</p>
        <ol class="causes">${it.causes.map(c => `
          <li class="cause">
            <header><h4>${c.name}</h4><span class="prob p-${c.p}">${B.P_LABEL[c.p]}</span></header>
            <p><b>Как проверить:</b> ${nb(c.check)}</p>
            <p><b>Что делать:</b> ${nb(c.fix)}</p>
          </li>`).join('')}</ol>`;
      if (scroll && window.matchMedia('(max-width: 940px)').matches) result.scrollIntoView({ block: 'start', behavior: smooth() });
    };
    chips.forEach(c => c.addEventListener('click', () => selectSymptom(c.dataset.id, true)));
    selectSymptom('low-yellow', false);

    const card = (d, i, kind) => `
      <article class="card ref-card" id="${kind}-${i}">
        <h4>${icon(kind === 'dis' ? 'alert' : 'bug')}${d.name}</h4>
        <span class="latin">${d.latin}</span>
        <dl>
          <div><dt>Признаки</dt><dd>${nb(d.sign)}</dd></div>
          <div><dt>Что делать</dt><dd>${nb(d.fix)}</dd></div>
          <div><dt>Профилактика</dt><dd>${nb(d.prevent)}</dd></div>
        </dl>
      </article>`;
    const dg = $('#disease-grid');
    if (dg) dg.innerHTML = B.DISEASES.map((d, i) => card(d, i, 'dis')).join('');
    const pg = $('#pest-grid');
    if (pg) pg.innerHTML = B.PESTS.map((d, i) => card(d, i, 'pest')).join('');
    const tt = $('#treat-table');
    if (tt) tt.innerHTML = `<thead><tr><th scope="col">Средство</th><th scope="col">От чего</th><th scope="col">Как работает</th></tr></thead><tbody>${B.TREATMENTS.map(([a, b, c]) => `<tr><td><b>${a}</b></td><td>${b}</td><td>${nb(c)}</td></tr>`).join('')}</tbody>`;
  }

