  /* @use micro, ills */
  register('aphid', el => {
    el.innerHTML = h.head('Колония из одной тли', 'Модель при 20–25 °C: взрослеют за 8 дней, рожают по 3 личинки в день около трёх недель. Перекорм азотом ускоряет и то и другое.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-ap-d', 'День', 0, 28, 1, 14)}<div class="lab-seg-wrap"><span class="lab-label">Условия</span><div class="chips-row lab-chips" id="lab-ap-x"><button class="chip" type="button" data-x="n" aria-pressed="false">Перекорм азотом</button><button class="chip" type="button" data-x="soap" aria-pressed="false">Мыло на 10-й день</button></div></div></div>
       <div class="ap-grid"><div class="lab-chart" id="lab-ap-ch"></div><div class="ap-shoot" id="lab-ap-shoot" aria-hidden="true"></div></div>` + h.readHtml([['Тлей на кусте', 'lab-ap-n'], ['Вывод', 'lab-ap-v', 'is-wide']]);
    const st = { d: 14, n: false, soap: false };
    const sim = () => {
      const mat = st.n ? 7 : 8, fec = st.n ? 4 : 3, life = 20;
      let co = [{ age: mat + 1, n: 1 }];
      const tot = [1];
      for (let d = 1; d <= 28; d++) {
        const born = co.filter(c => c.age >= mat).reduce((a, c) => a + c.n * fec, 0);
        co.forEach(c => { c.age++; });
        co = co.filter(c => c.age < mat + life);
        co.push({ age: 0, n: born });
        if (st.soap && d === 10) co.forEach(c => { c.n *= 0.1; });
        tot.push(co.reduce((a, c) => a + c.n, 0));
      }
      return tot;
    };
    let data = sim();
    const ch = h.chart($('#lab-ap-ch', el), {
      label: 'Численность тли по дням, логарифмическая шкала',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [-0.5, 28.5], y: [0, 6], xticks: [0, 7, 14, 21, 28], yticks: [0, 1, 2, 3, 4, 5, 6], fx: v => v + ' д', fy: v => ['1', '10', '100', '1 тыс', '10 тыс', '100 тыс', '1 млн'][v], ylab: 'тлей' });
        let s = P.s;
        const bw = Math.max(2, P.iw / 29 - 3);
        data.forEach((v, d) => {
          const y = Math.log10(Math.max(1, v));
          const x = P.X(d) - bw / 2;
          s += `<rect class="vbar ${d === st.d ? 's1' : 'is-muted'}" x="${r1(x)}" y="${P.Y(y)}" width="${r1(bw)}" height="${r1(P.Y(0) - P.Y(y))}" rx="2"/>`;
        });
        const v = data[st.d];
        s += `<text class="bar-lbl" x="${P.X(st.d)}" y="${r1(P.Y(Math.log10(Math.max(1, v))) - 7)}" text-anchor="middle">${fmt0(v)}</text>`;
        return s;
      },
      onPointer(x, y, w, hh, kind) { if (kind !== 'set') return; const P = h.plot({ w, h: hh, x: [-0.5, 28.5], y: [0, 6] }); rng.set(clamp(Math.round(P.inv(x)), 0, 28)); }
    });
    const upd = () => {
      data = sim();
      const v = data[st.d];
      set(el, 'lab-ap-n', fmt0(v));
      // the shoot tip on that day: one drawn aphid stands for a growing crowd
      const n = clamp(Math.round(3.2 * Math.pow(Math.log10(v + 1), 1.7)), 0, 44);
      const on = (k, total) => Math.round(n * k / total);
      let g = `<rect width="150" height="170" rx="14" fill="${ill.F('bg')}"/><path d="M75 170V40" stroke="${ill.F('stem')}" stroke-width="5"/>`;
      g += ill.leaf({ x: 75, y: 112, a: 56, s: 0.62, aphids: on(3, 10), curl: v > 300 ? 0.5 : 0, seed: 3 }) + ill.leaf({ x: 75, y: 112, a: -56, s: 0.62, aphids: on(3, 10), curl: v > 300 ? 0.4 : 0, seed: 4 });
      g += ill.leaf({ x: 75, y: 44, a: 22, s: 0.36, aphids: on(1, 10), seed: 5 }) + ill.leaf({ x: 75, y: 44, a: -22, s: 0.36, aphids: on(1, 10), seed: 6 });
      for (let i = 0; i < on(2, 10); i++) g += ill.aphid(74 + (i % 2 ? 3.5 : -3.5), 50 + i * 5.5, i % 2 ? 90 : -90, 0.95);
      $('#lab-ap-shoot', el).innerHTML = ill.svg(150, 170, g);
      set(el, 'lab-ap-v', v < 20 ? 'Пока единицы — смойте водой или снимите руками.' : v < 300 ? 'Колония растёт: мыльный раствор, повтор через 5–7 дней.' : 'Вспышка: обработка каждые 5 дней и срезка самых заселённых верхушек.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-ap-d', x => `${x}-й`, x => { st.d = x; upd(); });
    $('#lab-ap-x', el).addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      st[b.dataset.x] = !st[b.dataset.x];
      b.setAttribute('aria-pressed', String(st[b.dataset.x]));
      upd();
    });
    upd();
  });
