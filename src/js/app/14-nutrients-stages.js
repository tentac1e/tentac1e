  /* ================================================================== */
  /* NUTRIENTS: feeding curve + stages                                   */
  /* ================================================================== */
  function initStages() {
    const track = $('#stage-track');
    const svg = $('#feed-chart');
    const wrap = $('#feed-chart-wrap');
    const tip = $('#feed-tip');
    if (!track || !svg) return;
    const S = B.STAGES;
    const title = $('#stage-title'), days = $('#stage-days'), npk = $('#stage-npk'), ratio = $('#stage-ratio'), info = $('#stage-info'), tips = $('#stage-tips');
    const series = [['n', 'N', 'Азот', 'N'], ['p', 'P', 'Фосфор', 'P'], ['k', 'K', 'Калий', 'K']];
    let sel = 3;

    track.innerHTML = S.map((s, i) => `<button class="stage-btn" type="button" role="tab" aria-selected="false" data-i="${i}">${miniPlant(s.plant)}<span>${i + 1}. ${s.short}</span></button>`).join('');
    const btns = $$('.stage-btn', track);
    npk.innerHTML = series.map(([c, s, n]) => `<div class="npk-row"><span class="lbl"><i class="k-${c}"></i>${s} · ${n}</span><span class="bar"><i class="k-${c}" id="bar-${c}"></i></span><span class="lvl" id="lvl-${c}"></span></div>`).join('');
    const table = $('#feed-table');
    if (table) table.innerHTML = `<thead><tr><th scope="col">Стадия</th><th scope="col">N</th><th scope="col">P</th><th scope="col">K</th><th scope="col">N : P : K</th></tr></thead><tbody>${S.map((s, i) => `<tr><td>${i + 1}. ${s.name}</td><td class="num">${s.N}</td><td class="num">${s.P}</td><td class="num">${s.K}</td><td class="num">${s.ratio}</td></tr>`).join('')}</tbody>`;
    const lvl = v => (v === 0 ? 'не нужно' : v < 30 ? 'низкая' : v < 60 ? 'средняя' : 'высокая');

    let geom = null;
    const draw = () => {
      const w = Math.round(wrap.clientWidth);
      if (!w) return;
      const narrow = w < 560;
      const h = narrow ? 230 : 280;
      const m = { l: narrow ? 30 : 40, r: narrow ? 26 : 34, t: 14, b: narrow ? 30 : 42 };
      const pw = w - m.l - m.r, ph = h - m.t - m.b;
      const x = i => m.l + (pw * i) / (S.length - 1);
      const y = v => m.t + (1 - v / 100) * ph;
      geom = { x, w, h };
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      let out = '';
      const step = pw / (S.length - 1);
      out += `<rect class="fc-band" x="${x(sel) - step * 0.42}" y="${m.t - 6}" width="${step * 0.84}" height="${ph + 12}" rx="12"/>`;
      [0, 25, 50, 75, 100].forEach(v => {
        out += `<line class="fc-grid" x1="${m.l}" x2="${w - m.r}" y1="${y(v)}" y2="${y(v)}"/>`;
        out += `<text class="fc-axis" x="${m.l - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${v}</text>`;
      });
      series.forEach(([c, , , key]) => {
        const pts = S.map((s, i) => [x(i), y(s[key])]);
        const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
        out += `<path class="fc-area f-${c}" d="${line} L${x(S.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z"/>`;
      });
      series.forEach(([c, s, , key]) => {
        const pts = S.map((st, i) => [x(i), y(st[key])]);
        out += `<path class="fc-line l-${c}" d="${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')}"/>`;
        const last = pts[pts.length - 1];
        out += `<text class="fc-end" x="${last[0] + 8}" y="${last[1]}" dominant-baseline="middle">${s}</text>`;
      });
      series.forEach(([c, , , key]) => {
        out += `<circle class="fc-dot f-${c}" cx="${x(sel)}" cy="${y(S[sel][key])}" r="5"/>`;
      });
      S.forEach((s, i) => {
        out += `<text class="fc-xlabel${i === sel ? ' is-sel' : ''}" x="${x(i)}" y="${h - (narrow ? 10 : 16)}" text-anchor="middle">${narrow ? i + 1 : s.short}</text>`;
      });
      out += `<line class="fc-cross" id="fc-cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ph}" visibility="hidden"/>`;
      S.forEach((s, i) => {
        out += `<rect class="fc-hit" x="${x(i) - step / 2}" y="0" width="${step}" height="${h}" data-i="${i}" tabindex="0" role="button" aria-label="Стадия ${i + 1}: ${s.name}. N ${s.N}, P ${s.P}, K ${s.K}"/>`;
      });
      svg.innerHTML = out;
    };

    const hover = (i, show) => {
      const cross = $('#fc-cross', svg);
      if (!show || !geom) { tip.hidden = true; if (cross) cross.setAttribute('visibility', 'hidden'); return; }
      const s = S[i];
      const px = geom.x(i);
      if (cross) { cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible'); }
      tip.innerHTML = `<b>${i + 1}. ${s.name}</b>` + series.map(([c, sym, name, key]) => `<div class="row"><i class="k-${c}"></i><strong>${s[key]}</strong><span>${sym} · ${name.toLowerCase()}</span></div>`).join('');
      const scale = wrap.clientWidth / geom.w;
      tip.style.left = `${clamp(px * scale, 80, wrap.clientWidth - 80)}px`;
      tip.style.top = `${24 * scale + 40}px`;
      tip.hidden = false;
    };

    const show = (i, focusBtn) => {
      sel = i;
      const s = S[i];
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      if (focusBtn) btns[i].focus();
      title.textContent = `${i + 1}. ${s.name}`;
      days.textContent = s.days;
      series.forEach(([c, , , key]) => {
        $(`#bar-${c}`).style.width = `${s[key]}%`;
        $(`#lvl-${c}`).textContent = lvl(s[key]);
      });
      ratio.textContent = s.ratio;
      info.innerHTML = [['Чем кормить', s.feed], ['Как часто', s.freq], ['Доза', s.dose], ['EC для гидропоники', s.ec]]
        .map(([k, v]) => `<div><dt>${k}</dt><dd>${nb(v)}</dd></div>`).join('') + `<div class="is-avoid"><dt>Нельзя</dt><dd>${nb(s.avoid)}</dd></div>`;
      tips.innerHTML = s.tips.map(t => `<li>${nb(t)}</li>`).join('');
      const b = btns[i];
      track.scrollTo({ left: b.offsetLeft - track.clientWidth / 2 + b.offsetWidth / 2, behavior: smooth() });
      draw();
    };

    btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
    track.addEventListener('keydown', e => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(i + 1, btns.length - 1), true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(Math.max(i - 1, 0), true); }
    });
    svg.addEventListener('pointermove', e => { const r = e.target.closest('.fc-hit'); if (r) hover(+r.dataset.i, true); });
    svg.addEventListener('pointerleave', () => hover(0, false));
    svg.addEventListener('click', e => { const r = e.target.closest('.fc-hit'); if (r) show(+r.dataset.i); });
    svg.addEventListener('keydown', e => {
      const r = e.target.closest('.fc-hit');
      if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(+r.dataset.i); }
    });
    svg.addEventListener('focusin', e => { const r = e.target.closest('.fc-hit'); if (r) hover(+r.dataset.i, true); });
    svg.addEventListener('focusout', () => hover(0, false));
    if ('ResizeObserver' in window) new ResizeObserver(() => draw()).observe(wrap);
    else window.addEventListener('resize', draw);
    show(sel);
  }

