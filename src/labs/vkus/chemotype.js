  // the same order everywhere: families stay together, so a colour never jumps between charts
  const CH_ORDER = ['lin', 'cin', 'cit', 'cam', 'est', 'meu', 'eug', 'mci', 'car', 'ber'];
  // what the nose makes of each molecule: axis weights of the «character» chart
  const CH_AXES = [['floral', 'цветы'], ['lemon', 'лимон'], ['cool', 'холодок'], ['pepper', 'перец'], ['clove', 'гвоздика'], ['cinnamon', 'корица'], ['anise', 'анис']];
  const CH_NOTE = {
    lin: { floral: 1 }, cit: { lemon: 1 }, cin: { cool: 1 }, cam: { cool: 1, pepper: 0.25 },
    car: { pepper: 1 }, ber: { pepper: 0.8 }, eug: { clove: 1 }, meu: { clove: 0.6, anise: 0.5 },
    mci: { cinnamon: 1, floral: 0.2 }, est: { anise: 1 }
  };
  const chScore = p => CH_AXES.map(([a]) => Math.min(1, Math.sqrt(Object.entries(p).reduce((s, [m, v]) => s + v * ((CH_NOTE[m] || {})[a] || 0), 0) / 55)));
  const chShort = k => h.molName(k).replace(/^1,8-|^α-|^β-/, '').toLowerCase();

  register('chemotype', el => {
    const V = h.CHEMO;
    el.innerHTML = h.head('Химический отпечаток сорта', 'Кольцо — из чего состоит эфирное масло, паутинка — каким от этого получается запах. Доли — ориентир по опубликованным анализам: у каждого растения они свои и меняются с погодой.') +
      `<div class="chemo-grid">
        <div class="chemo-card">
          <div class="chemo-figs">
            <div class="chemo-fig"><div class="lab-chart" id="lab-ch-donut"></div><ol class="chemo-top" id="lab-ch-top"></ol></div>
            <div class="chemo-fig"><div class="lab-chart" id="lab-ch-radar"></div></div>
          </div>
          <div class="chemo-info" id="lab-ch-info" aria-live="polite"></div>
        </div>
        <div class="chemo-side">
          <p class="lab-label">Сорта</p>
          <div class="chemo-list" id="lab-ch-list" role="group" aria-label="Сорта базилика">${V.map((r, i) => `<button type="button" class="chemo-row" data-i="${i}" aria-pressed="${i === 0}"><span class="chemo-name">${r.name}</span><span class="chemo-bar">${CH_ORDER.filter(k => r.p[k]).map(k => `<i data-m="${k}" style="flex-grow:${r.p[k]};background:var(--m-${k})"></i>`).join('')}<i class="is-rest" style="flex-grow:${Math.max(0, 100 - CH_ORDER.reduce((a, k) => a + (r.p[k] || 0), 0))}"></i></span><b class="chemo-val"></b></button>`).join('')}</div>
          <p class="lab-label">Молекулы</p>
          <div class="chemo-mols" id="lab-ch-mols" role="group" aria-label="Подсветить молекулу">${CH_ORDER.map(k => `<button type="button" class="chip chemo-mol" data-m="${k}" aria-pressed="false"><i style="background:var(--m-${k})"></i>${chShort(k)}</button>`).join('')}</div>
          <p class="lab-foot">зелёные — монотерпены, лиловые и коричные — фенилпропаноиды, золотистые — сесквитерпены; серое — остальные вещества</p>
        </div>
      </div>`;
    let cur = 0, mol = null;
    const shares = i => CH_ORDER.map(k => [k, V[i].p[k] || 0]);

    /* composition ring: every molecule has its own arc, so switching sorts slides the arcs */
    const donut = h.chart($('#lab-ch-donut', el), {
      label: 'Состав эфирного масла выбранного сорта',
      h: w => Math.min(w, 200),
      draw(w, hh) {
        const S0 = Math.min(w, hh), cx = w / 2, cy = hh / 2, r = S0 * 0.36, sw = S0 * 0.16;
        let s = `<circle class="chemo-ring-bg" cx="${cx}" cy="${cy}" r="${r1(r)}" stroke-width="${r1(sw)}"/>`;
        s += `<g transform="rotate(-90 ${r1(cx)} ${r1(cy)})">`;
        CH_ORDER.forEach(k => { s += `<circle class="chemo-seg" data-m="${k}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" stroke="var(--m-${k})" stroke-width="${r1(sw)}"/>`; });
        s += '</g>';
        s += `<text class="chemo-c1" id="lab-ch-c1" x="${r1(cx)}" y="${r1(cy - 4)}" text-anchor="middle"></text><text class="chemo-c2" id="lab-ch-c2" x="${r1(cx)}" y="${r1(cy + 16)}" text-anchor="middle"></text>`;
        return s;
      }
    });
    const paintDonut = () => {
      const c = $('.chemo-seg', donut.svg);
      if (!c) return;
      const R = +c.getAttribute('r'), C = 2 * Math.PI * R;
      let at = 0;
      shares(cur).forEach(([k, v]) => {
        const len = v / 100 * C, seg = $(`.chemo-seg[data-m="${k}"]`, donut.svg);
        seg.style.strokeDasharray = `${r1(Math.max(0, len - (len > 3 ? 2 : 0)))} ${r1(C)}`;
        seg.style.strokeDashoffset = r1(-at);
        seg.classList.toggle('is-dim', !!mol && mol !== k);
        at += len;
      });
      const [k, v] = mol ? [mol, V[cur].p[mol] || 0] : shares(cur).sort((a, b) => b[1] - a[1])[0];
      set(el, 'lab-ch-c1', `${v} %`);
      set(el, 'lab-ch-c2', chShort(k));
    };

    /* character of the smell: seven notes, the classic Genovese dashed for comparison */
    let shown = chScore(V[0].p), anim = 0, radarPt = null;
    const radar = h.chart($('#lab-ch-radar', el), {
      label: 'Характер запаха выбранного сорта по семи нотам',
      h: w => Math.min(260, Math.max(220, w * 0.72)),
      draw(w, hh) {
        const cx = w / 2, cy = hh / 2 + 4, R = Math.min(w / 2 - 60, hh / 2 - 28);
        const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / CH_AXES.length; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
        let s = '';
        [0.25, 0.5, 0.75, 1].forEach(g => { s += `<polygon class="chemo-web" points="${CH_AXES.map((_, i) => pt(i, g).map(r1).join(',')).join(' ')}"/>`; });
        CH_AXES.forEach(([, name], i) => {
          const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.16);
          s += `<line class="chemo-axis" x1="${r1(cx)}" y1="${r1(cy)}" x2="${r1(x)}" y2="${r1(y)}"/>`;
          const anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end';
          s += `<text class="chemo-ax" x="${r1(lx)}" y="${r1(ly + (ly > cy + 4 ? 10 : ly < cy - R * 0.9 ? -2 : 4))}" text-anchor="${anchor}">${name}</text>`;
        });
        s += `<polygon class="chemo-ref" id="lab-ch-ref" points=""/><polygon class="chemo-shape" id="lab-ch-shape" points=""/><g id="lab-ch-pts"></g>`;
        radarPt = pt;
        return s;
      }
    });
    const drawShape = vals => {
      const pt = radarPt;
      if (!pt || !radar) return;
      const shape = $('#lab-ch-shape', radar.svg), ref = $('#lab-ch-ref', radar.svg);
      shape.setAttribute('points', vals.map((v, i) => pt(i, Math.max(0.04, v)).map(r1).join(',')).join(' '));
      ref.setAttribute('points', cur ? chScore(V[0].p).map((v, i) => pt(i, Math.max(0.04, v)).map(r1).join(',')).join(' ') : '');
      $('#lab-ch-pts', radar.svg).innerHTML = vals.map((v, i) => { const [x, y] = pt(i, Math.max(0.04, v)); return `<circle class="chemo-pt" cx="${r1(x)}" cy="${r1(y)}" r="3.4"/>`; }).join('');
    };
    const tweenTo = target => {
      cancelAnimationFrame(anim);
      const from = shown.slice(), t0 = performance.now(), dur = h.reduce.matches ? 0 : 420;
      const step = t => {
        const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
        shown = from.map((v, i) => lerp(v, target[i], e));
        drawShape(shown);
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };

    const info = () => {
      const r = V[cur];
      const top = shares(cur).filter(([, v]) => v).sort((a, b) => b[1] - a[1]);
      $('#lab-ch-top', el).innerHTML = top.slice(0, 4).map(([k, v]) => `<li><i style="background:var(--m-${k})"></i><span>${chShort(k)}</span><b>${v}&nbsp;%</b></li>`).join('');
      if (mol) {
        const M = h.MOLS[mol] || h.EXTRA[mol];
        const best = V.map((x, i) => [i, x.p[mol] || 0]).sort((a, b) => b[1] - a[1])[0];
        $('#lab-ch-info', el).innerHTML = `<p class="lab-kicker">Молекула</p><h5>${h.molName(mol)}</h5><p>${h.nb(`Пахнет: ${M.smell}. У сорта «${r.name}» — ${r.p[mol] ? r.p[mol] + ' %' : 'почти нет'}; больше всего — у сорта «${V[best[0]].name}», ${best[1]} %.`)}</p>`;
      } else {
        $('#lab-ch-info', el).innerHTML = `<p class="lab-kicker">Почему так пахнет</p><h5>${r.name}</h5><p>${h.nb(r.why)}</p>${cur ? '<p class="chemo-cmp"><i></i>пунктир — генуэзский для сравнения</p>' : ''}`;
      }
    };
    const list = $('#lab-ch-list', el);
    const paintList = () => {
      list.dataset.m = mol || '';
      $$('.chemo-row', list).forEach(b => {
        const i = +b.dataset.i;
        b.setAttribute('aria-pressed', String(i === cur));
        $('.chemo-val', b).textContent = mol ? (V[i].p[mol] ? V[i].p[mol] + ' %' : '—') : '';
      });
      $$('.chemo-mol', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === mol)));
    };
    const update = () => { paintDonut(); tweenTo(chScore(V[cur].p)); info(); paintList(); };
    list.addEventListener('click', e => { const b = e.target.closest('.chemo-row'); if (b) { cur = +b.dataset.i; update(); } });
    $('#lab-ch-mols', el).addEventListener('click', e => { const b = e.target.closest('.chemo-mol'); if (b) { mol = mol === b.dataset.m ? null : b.dataset.m; update(); } });
    // charts rebuild on resize: put the current state back
    if ('ResizeObserver' in window) new ResizeObserver(() => { paintDonut(); drawShape(shown); }).observe(el);
    update();
  });
