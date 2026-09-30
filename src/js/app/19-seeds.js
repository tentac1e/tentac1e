  /* ================================================================== */
  /* SEEDS: germination test                                             */
  /* ================================================================== */
  function initGerm() {
    const r = $('#germ-count');
    const out = $('#germ-out');
    if (!r || !out) return;
    const render = () => {
      const v = +r.value;
      $('#germ-val').textContent = String(v);
      let text, cls = '';
      if (v >= 8) text = `Всхожесть ${v * 10}\u00a0% — отличные семена. Сейте как обычно, по 2–3 в ячейку.`;
      else if (v >= 5) { text = `Всхожесть ${v * 10}\u00a0% — средняя. Сейте гуще, по 3–4 семени в ячейку.`; cls = 'is-warn'; }
      else { text = `Всхожесть ${v * 10}\u00a0% — слабая. Лучше купить свежие семена, а ценный сорт сеять очень густо.`; cls = 'is-bad'; }
      out.textContent = text;
      out.className = 'germ-out' + (cls ? ' ' + cls : '');
    };
    r.addEventListener('input', render);
    render();
  }

