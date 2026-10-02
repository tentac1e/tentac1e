  /* ================================================================== */
  /* PROBLEMS                                                            */
  /* ================================================================== */
  let selectSymptom = () => {};
  // pictures come from the chapter's model file (src/labs/problemy/_shared.js), drawn by BasilScience
  function initDiagnostics() {
    const groups = $('#diag-groups');
    const result = $('#diag-result');
    if (!groups || !result) return;
    const all = [];
    // a gallery of symptoms: every card shows what it looks like
    groups.innerHTML = B.DIAG.map(g => `
      <div class="diag-group">
        <h4>${g.group}</h4>
        <div class="diag-row">${g.items.map(it => { all.push(it); return `<button class="diag-card" type="button" data-id="${it.id}" aria-pressed="false"><span class="diag-ill" data-ill="sym:${it.id}" aria-hidden="true"></span><span class="diag-name">${it.title}</span></button>`; }).join('')}</div>
      </div>`).join('');
    const cards = $$('.diag-card', groups);
    selectSymptom = (id, scroll) => {
      const it = all.find(x => x.id === id) || all[0];
      cards.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id === it.id)));
      result.innerHTML = `
        <div class="diag-hero"><span class="diag-hero-ill" data-ill="sym:${it.id}"></span><div class="diag-hero-t"><p class="eyebrow">Симптом</p><h3>${it.title}</h3>
        <p class="hint">${it.causes.length > 1 ? `${it.causes.length} ${plural(it.causes.length, 'возможная причина', 'возможные причины', 'возможных причин')}, от частой к редкой` : 'Наиболее вероятная причина'}</p></div></div>
        <ol class="causes">${it.causes.map((c, i) => `
          <li class="cause">
            <header><span class="cause-n">${i + 1}</span><h4>${c.name}</h4><span class="prob p-${c.p}">${B.P_LABEL[c.p]}</span></header>
            <p><b>Как проверить:</b> ${nb(c.check)}</p>
            <p><b>Что делать:</b> ${nb(c.fix)}</p>
          </li>`).join('')}</ol>`;
      paintIll(result, true);
      if (scroll && window.matchMedia('(max-width: 940px)').matches) result.scrollIntoView({ block: 'start', behavior: smooth() });
    };
    cards.forEach(c => c.addEventListener('click', () => selectSymptom(c.dataset.id, true)));
    selectSymptom('low-yellow', false);
    // the tiles on the screen are drawn at once, the rest as they come near: not two dozen pictures in one go
    paintIll(groups);

    // diseases and pests: as seen on the plant and under a lens
    const card = (d, i, kind) => `
      <article class="card ref-card" id="${kind}-${i}">
        <div class="ref-ills">
          <figure><span class="ref-ill" data-ill="${kind}:${i}-plant"></span><figcaption>${kind === 'dis' && i === 4 ? 'здоровые корни' : 'на растении'}</figcaption></figure>
          <figure><span class="ref-ill" data-ill="${kind}:${i}-zoom"></span><figcaption>${kind === 'dis' && i === 4 ? 'при гнили' : 'под лупой'}</figcaption></figure>
        </div>
        <h4>${icon(kind === 'dis' ? 'alert' : 'bug')}${d.name}</h4>
        <span class="latin">${d.latin}</span>
        <dl>
          <div><dt>Признаки</dt><dd>${nb(d.sign)}</dd></div>
          <div><dt>Что делать</dt><dd>${nb(d.fix)}</dd></div>
          <div><dt>Профилактика</dt><dd>${nb(d.prevent)}</dd></div>
        </dl>
      </article>`;
    const dg = $('#disease-grid');
    if (dg) { dg.innerHTML = B.DISEASES.map((d, i) => card(d, i, 'dis')).join(''); paintIll(dg); }
    const pg = $('#pest-grid');
    if (pg) { pg.innerHTML = B.PESTS.map((d, i) => card(d, i, 'pest')).join(''); paintIll(pg); }
    const tt = $('#treat-table');
    if (tt) tt.innerHTML = `<thead><tr><th scope="col">Средство</th><th scope="col">От чего</th><th scope="col">Как работает</th></tr></thead><tbody>${B.TREATMENTS.map(([a, b, c]) => `<tr><td><b>${a}</b></td><td data-label="От чего">${b}</td><td data-label="Как работает">${nb(c)}</td></tr>`).join('')}</tbody>`;
  }
