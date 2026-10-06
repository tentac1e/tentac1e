  /* ================================================================== */
  /* HOME                                                                */
  /* ================================================================== */
  function showShort(name) {
    $$('[data-short]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.short === name)));
    $$('[data-short-pane]').forEach(p => { p.hidden = p.dataset.shortPane !== name; });
  }
  function initHome() {
    const quick = $('#quick');
    if (quick) quick.innerHTML = B.QUICK.map(q => `<a class="q-card" href="#${q.hash}"><span class="q-ico">${icon(q.icon)}</span><span><b>${q.title}</b><small>${q.desc}</small></span>${icon('chev-r')}</a>`).join('');

    // the chapters (#chapters) are the contents' list, written into the page by scripts/build.py: a row opens into the
    // chapter's sections
    const chapters = $('#chapters');
    if (chapters) chapters.addEventListener('click', e => {
      const tog = e.target.closest('.toc-tog');
      if (!tog) return;
      const li = tog.closest('.toc-item');
      tocFold(li, !li.classList.contains('is-open'));
      if (window.BasilHaptics) window.BasilHaptics.tick();
    });

    // the tools (scripts/build.py): a phone shows one group at a time
    $$('[data-tools]').forEach(b => b.addEventListener('click', () => {
      $$('[data-tools]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $$('#tools-home .tools-group').forEach(g => g.classList.toggle('is-on', g.id === 'tools-' + b.dataset.tools));
      if (window.BasilHaptics) window.BasilHaptics.tick();
    }));

    // «Научный слой» in one column: its heading, and one button opens the rest (08-home-science.css)
    const sci = $('.science-home'), sciOpen = $('.sh-open');
    if (sci && sciOpen) sciOpen.addEventListener('click', () => {
      const on = !sci.classList.contains('is-open');
      sci.classList.toggle('is-open', on);
      sciOpen.setAttribute('aria-expanded', String(on));
      if (window.BasilHaptics) window.BasilHaptics.tick();
    });

    // «Базилик коротко»: the passport, the figures, the path and the eight rules, one at a time
    $$('[data-short]').forEach(b => b.addEventListener('click', () => { showShort(b.dataset.short); if (window.BasilHaptics) window.BasilHaptics.tick(); }));

    const steps = [
      { t: 'Семя', s: 'день 0', plant: 'seed', hash: 'posadka-posev' },
      { t: 'Всходы', s: '5–10 дней', plant: 'seedling', hash: 'posadka-posev' },
      { t: 'Рассада', s: '3–6 недель', plant: 'transplant', hash: 'posadka-posev' },
      { t: 'Прищипка', s: '5–6 недель', plant: 'growth', hash: 'formirovka-osnovy' },
      { t: 'Урожай', s: 'с 6–8 недель', plant: 'harvest', hash: 'formirovka-sbor' },
      { t: 'Песто', s: 'в любой день', art: 'art-urozhay', hash: 'vkus-recepty' }
    ];
    const journey = $('#journey');
    if (journey) journey.innerHTML = steps.map(s => `
      <li><a href="#${s.hash}"><span class="j-art">${s.art ? `<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#${s.art}"/></svg>` : miniPlant(s.plant)}</span><b>${s.t}</b><small>${nb(s.s)}</small></a></li>`).join('');

    const m = today().getMonth();
    const tipText = $('#season-text');
    if (tipText) tipText.textContent = B.MONTH_TIPS[m];
    const tipHead = $('#season-h');
    if (tipHead) tipHead.textContent = `Сейчас, ${MONTHS_NOM[m]}`;
  }

