  /* ------------------------------------------------------------------ */
  /* form controls — ids are stable so values survive a page refresh     */
  /* ------------------------------------------------------------------ */
  const rangeHtml = (id, label, min, max, step, value, extra = '') =>
    `<div class="field lab-field ${extra}"><label for="${id}">${label}: <b id="${id}-v"></b></label><input class="range" type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  const segHtml = (id, label, options, value) =>
    `<div class="lab-seg-wrap"><span class="lab-label" id="${id}-l">${label}</span><div class="seg lab-seg" role="group" aria-labelledby="${id}-l" id="${id}">${options.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(value)}">${t}</button>`).join('')}</div></div>`;
  const chipsHtml = (id, label, options, value) =>
    `<div class="chips-row lab-chips" role="group" aria-label="${label}" id="${id}">${options.map(([v, t]) => `<button class="chip" type="button" data-v="${v}" aria-pressed="${String(v) === String(value)}">${t}</button>`).join('')}</div>`;
  function bindRange(root, id, show, onChange) {
    const input = $('#' + id, root), out = $('#' + id + '-v', root);
    const upd = silent => { out.textContent = show(+input.value); if (!silent) onChange(+input.value); };
    input.addEventListener('input', () => upd());
    upd(true);
    return { input, get value() { return +input.value; }, set(v) { input.value = v; upd(); } };
  }
  function bindPick(root, id, onChange) {
    const group = $('#' + id, root);
    const set = v => $$('[data-v]', group).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    group.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      set(b.dataset.v);
      onChange(b.dataset.v);
    });
    return { set, get value() { const b = $('[aria-pressed="true"]', group); return b ? b.dataset.v : null; } };
  }
  const readHtml = items => `<dl class="lab-read">${items.map(([k, id, cls]) => `<div class="${cls || ''}"><dt>${k}</dt><dd id="${id}">—</dd></div>`).join('')}</dl>`;
  const head = (title, note, model) => `<div class="lab-head"><p class="lab-kicker">${model ? 'Модель' : 'Интерактив'}</p><h4 class="lab-title">${title}</h4>${note ? `<p class="lab-note">${note}</p>` : ''}</div>`;

