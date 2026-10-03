  /* ================================================================== */
  /* HOME                                                                */
  /* ================================================================== */
  function initHome() {
    const quick = $('#quick');
    if (quick) quick.innerHTML = B.QUICK.map(q => `<a class="q-card" href="#${q.hash}"><span class="q-ico">${icon(q.icon)}</span><span><b>${q.title}</b><small>${q.desc}</small></span>${icon('chev-r')}</a>`).join('');

    const chapters = $('#chapters');
    if (chapters) chapters.innerHTML = B.CHAPTERS.map(c => `
      <a class="ch-card" href="#${c.id}">
        <span class="ch-art"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#${c.art}"/></svg></span>
        <span><span class="ch-num">Глава ${c.num}</span><h3>${c.title}</h3><p>${c.desc}</p></span>
      </a>`).join('');

    const steps = [
      { t: 'Семя', s: 'день 0', plant: 'seed', hash: 'posadka-posev' },
      { t: 'Всходы', s: '5–10 дней', plant: 'seedling', hash: 'posadka-posev' },
      { t: 'Рассада', s: '3–6 недель', plant: 'transplant', hash: 'posadka-posev' },
      { t: 'Прищипка', s: '5–6 недель', plant: 'growth', hash: 'formirovka-osnovy' },
      { t: 'Урожай', s: 'с 6–8 недель', plant: 'harvest', hash: 'urozhay-sbor' },
      { t: 'Песто', s: 'в любой день', art: 'art-urozhay', hash: 'urozhay-recepty' }
    ];
    const journey = $('#journey');
    if (journey) journey.innerHTML = steps.map(s => `
      <li><a href="#${s.hash}"><span class="j-art">${s.art ? `<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#${s.art}"/></svg>` : miniPlant(s.plant)}</span><b>${s.t}</b><small>${nb(s.s)}</small></a></li>`).join('');

    // the tools (#tools-home) are written into the page by scripts/build.py, by what they are for

    const m = today().getMonth();
    const tipText = $('#season-text');
    if (tipText) tipText.textContent = B.MONTH_TIPS[m];
    const tipHead = $('#season-h');
    if (tipHead) tipHead.textContent = `Сейчас, ${MONTHS_NOM[m]}`;
  }

