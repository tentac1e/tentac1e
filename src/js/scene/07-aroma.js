  /* ------------------------------------------------------------------ */
  /* aroma puffs: tiny molecules rising from a rubbed leaf               */
  /* ------------------------------------------------------------------ */
  const NOTES = [
    ['линалоол', 'цветочная нота'], ['эвгенол', 'гвоздика'], ['1,8-цинеол', 'холодок, эвкалипт'],
    ['эстрагол', 'анис'], ['(Z)-3-гексеналь', 'запах срезанной травы'], ['α-бергамотен', 'чайная, древесная'], ['оцимен', 'сладкая зелень']
  ];
  let noteIdx = 0;
  function aroma(layer, clientX, clientY, opts = {}) {
    if (!layer) return;
    const box = layer.getBoundingClientRect();
    const x = clientX - box.left, y = clientY - box.top;
    const still = reduce.matches;
    const n = still ? 0 : 7;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'aroma-dot';
      p.style.setProperty('--x', x + 'px');
      p.style.setProperty('--y', y + 'px');
      p.style.setProperty('--dx', ((Math.random() - 0.5) * 70).toFixed(1) + 'px');
      p.style.setProperty('--dy', (-70 - Math.random() * 90).toFixed(1) + 'px');
      p.style.setProperty('--s', (0.5 + Math.random() * 0.9).toFixed(2));
      p.style.setProperty('--d', (1.6 + Math.random() * 1.2).toFixed(2) + 's');
      p.style.setProperty('--hue', i % 3);
      layer.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
    if (opts.label === false) return;
    const now2 = performance.now();
    if (layer._lastLabel && now2 - layer._lastLabel < 700) return;
    layer._lastLabel = now2;
    const [name, note] = NOTES[noteIdx++ % NOTES.length];
    const lb = document.createElement('span');
    lb.className = 'aroma-label';
    lb.style.setProperty('--x', x + 'px');
    lb.style.setProperty('--y', y + 'px');
    lb.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><circle cx="12" cy="12" r="3"/></svg><b>${name}</b><small>${note}</small>`;
    layer.appendChild(lb);
    lb.addEventListener('animationend', () => lb.remove(), { once: true });
    if (opts.onNote) opts.onNote(name, note);
  }
