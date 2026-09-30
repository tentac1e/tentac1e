  /* ================================================================== */
  /* SHEETS                                                              */
  /* ================================================================== */
  function openSheet(id) {
    const d = document.getElementById(id);
    if (!d) return;
    if (!d.open) {
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    }
    if (id === 'sheet-chapters') {
      $$('.sheet-link', d).forEach(l => l.classList.toggle('is-current', currentView && l.getAttribute('href') === '#' + currentView.dataset.view));
      const cur = $('.sheet-link.is-current', d);
      const panels = currentView ? $$('[data-panel]', currentView) : [];
      $$('.sheet-tabs', d).forEach(x => x.remove());
      if (cur && panels.length > 1) {
        const active = $('[data-panel].is-active', currentView);
        cur.insertAdjacentHTML('afterend', `<nav class="sheet-tabs chips-row" aria-label="Разделы этой главы">${panels.map(p => { const t = $(`.subnav a[href="#${p.id}"]`, currentView); return `<a class="chip" href="#${p.id}"${p === active ? ' aria-current="true"' : ''}>${esc(t ? t.textContent.trim() : p.dataset.title || '')}</a>`; }).join('')}</nav>`);
      }
    }
    if (id === 'sheet-search') {
      const input = $('#search-input');
      setTimeout(() => { input.focus(); input.select(); }, 30);
      loadSearch();
    }
  }
  function closeSheet(d) {
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }

  function initSheets() {
    const chList = $('#sheet-chapters-list');
    if (chList) {
      chList.innerHTML = `<a class="sheet-link" href="#glavnaya"><span class="sl-art">${icon('home')}</span><span><b>Главная</b><small>С чего начать, путь базилика, правила</small></span>${icon('chev-r')}</a>` +
        B.CHAPTERS.map(c => `<a class="sheet-link" href="#${c.id}"><span class="sl-art"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#${c.art}"/></svg></span><span><b>${c.num}. ${c.title}</b><small>${c.desc}</small></span>${icon('chev-r')}</a>`).join('');
    }
    const tList = $('#sheet-tools-list');
    if (tList) {
      tList.innerHTML = B.TOOLS.map(t => `<a class="sheet-link" href="#${t.hash}"><span class="sl-art">${icon(t.icon)}</span><span><b>${t.title}</b><small>${t.desc}</small></span>${icon('chev-r')}</a>`).join('');
    }
    $$('[data-open]').forEach(b => b.addEventListener('click', () => openSheet(b.dataset.open)));
    $$('dialog.sheet').forEach(d => {
      d.addEventListener('click', e => {
        if (e.target === d) closeSheet(d);
        if (e.target.closest('[data-close]')) closeSheet(d);
      });
    });
    document.addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        openSheet('sheet-search');
      }
    });
  }

