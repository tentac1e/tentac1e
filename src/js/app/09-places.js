  /* ================================================================== */
  /* PLACES                                                              */
  /* ================================================================== */
  function initPlaces() {
    const list = $('#place-tabs');
    const panel = $('#place-panel');
    if (!list || !panel) return;
    list.innerHTML = B.PLACES.map((p, i) => `<button class="tab" type="button" role="tab" id="tab-${p.id}" aria-controls="place-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${icon(p.icon)}${p.name}</button>`).join('');
    const tabs = $$('.tab', list);
    const render = (i, now) => {
      const p = B.PLACES[i];
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      panel.setAttribute('aria-labelledby', `tab-${p.id}`);
      panel.innerHTML = `
        <span class="place-ill" data-ill="place:${p.id}"></span>
        <div class="place-main">
          <h3>${p.name}</h3>
          <p class="lead">${nb(p.lead)}</p>
          <dl class="params">${p.params.map(([k, v]) => `<div><dt>${k}</dt><dd>${nb(v)}</dd></div>`).join('')}</dl>
        </div>
        <div class="place-side">
          <div><h4>${icon('check')}Советы</h4><ul class="ticks">${p.tips.map(t => `<li>${nb(t)}</li>`).join('')}</ul></div>
          <div><h4>${icon('alert')}Подводные камни</h4><ul class="ticks is-warn">${p.risks.map(t => `<li>${nb(t)}</li>`).join('')}</ul></div>
        </div>`;
      paintIll(panel, !!now);
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => render(i, true)));
    list.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      tabs[j].focus();
      render(j, true);
    });
    render(0);
  }

