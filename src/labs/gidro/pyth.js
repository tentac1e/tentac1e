  /* Pythium at a root: zoospores swim in the solution and turn towards the root by the smell of what it gives out.
     The warmer the water, the more of them and the faster they swim; without the air pump the root is weaker.
     The risk is a curve through the trials of this chapter (no outbreaks below 18 °C, many above 24 °C): a scale, not a forecast. */
  register('pyth', el => {
    el.innerHTML = h.head('Споры у корня', 'Капельки со жгутиками — зооспоры питиума, бурые пятна — где они проросли в корень. Меняйте температуру раствора и включайте компрессор.', true) +
      `<div class="lab-controls">
        ${h.rangeHtml('lab-py-t', 'Температура раствора', 14, 30, 0.5, 24)}
        ${h.segHtml('lab-py-a', 'Компрессор', [['on', 'работает'], ['off', 'выключен']], 'on')}
      </div>
      <div class="lab-chart py-chart" id="lab-py-ch"></div>` +
      h.readHtml([['Кислород в растворе', 'lab-py-o'], ['Риск гнили', 'lab-py-r'], ['Что делать', 'lab-py-v', 'is-wide']]);
    const F = ill.F, q = ill.q, VW = 360, VH = 200, RX = 180;
    let T = 24, air = true, K = 1, OX = 0, OY = 0, dyn = null, last = 0;
    const risk = () => clamp(1 / (1 + Math.exp(-(T - 23 + (air ? 0 : 2.5)) / 1.3)), 0, 1);
    const DO = () => Math.max(0, doAt(T) - (air ? 0.3 : 3));
    const rnd = ill.rng(11);
    const spores = [], stuck = [];
    const spawn = s => { const left = rnd() < 0.5; Object.assign(s, { x: left ? 8 + rnd() * 60 : VW - 8 - rnd() * 60, y: 16 + rnd() * 168, a: rnd() * Math.PI * 2 }); return s; };
    for (let i = 0; i < 30; i++) { const s = spawn({}); s.x = 8 + rnd() * (VW - 16); spores.push(s); }
    const rootX = y => RX + Math.sin(y / 46) * 8;
    const step = dt => {
      const R = risk(), n = Math.round(4 + 26 * R), v = (18 + (T - 14) * 3) * dt, cap = Math.round(2 + 22 * R);
      for (let i = 0; i < n; i++) {
        const s = spores[i], dx = rootX(s.y) - s.x;
        // a random walk with a pull towards the root (chemotaxis)
        s.a += (rnd() - 0.5) * 1.2 + Math.sign(dx) * (Math.cos(s.a) * Math.sign(dx) < 0 ? 0.25 : 0);
        s.x += Math.cos(s.a) * v + Math.sign(dx) * v * (0.25 + 0.45 * R);
        s.y += Math.sin(s.a) * v;
        if (s.y < 12 || s.y > VH - 14) s.a = -s.a;
        s.y = clamp(s.y, 12, VH - 14);
        if (Math.abs(rootX(s.y) - s.x) < 6) {
          stuck.push({ y: s.y, side: Math.sign(-dx) || 1, age: 0 });
          spawn(s);
        }
      }
      stuck.forEach(p => { p.age += dt; });
      while (stuck.length > cap) stuck.shift();
    };
    const spore = s => {
      const x = s.x, y = s.y;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(s.a * 180 / Math.PI)})"><ellipse rx="4.2" ry="2.6" fill="${F('mold')}" stroke="${F('mold-d')}" stroke-width=".7"/><path d="M-3.6 0q-5 -3 -9 -1M-2 1.4q-4 4 -8 3" stroke="${F('mold-d')}" stroke-width=".8" fill="none"/></g>`;
    };
    const paint = () => {
      if (!dyn) return;
      const R = risk(), n = Math.round(4 + 26 * R);
      let g = '';
      // the cloud of what the root gives out: the spores follow it
      g += stuck.map(p => { const k = Math.min(1, p.age / 3); return `<ellipse cx="${q(rootX(p.y) + p.side * 1.5)}" cy="${q(p.y)}" rx="${q(3 + k * 4)}" ry="${q(4 + k * 7)}" fill="${F('rot')}" opacity="${q(0.45 + k * 0.45)}"/>`; }).join('');
      for (let i = 0; i < n; i++) g += spore(spores[i]);
      if (air) for (let i = 0; i < 14; i++) { const u = ((last / 1000) * 0.35 + i / 14) % 1, x = 300 + Math.sin(u * 8 + i) * 10 + (i % 3) * 6; g += `<circle cx="${q(x)}" cy="${q(VH - 10 - u * (VH - 30))}" r="${1.4 + (i % 3) * 0.5}" fill="${F('hi')}" fill-opacity=".35" stroke="${F('hi')}" stroke-width=".9"/>`; }
      dyn.innerHTML = `<g transform="translate(${q(OX)} ${q(OY)}) scale(${q(K)})">${g}</g>`;
    };
    const ch = h.chart($('#lab-py-ch', el), {
      label: 'Корень в растворе и зооспоры питиума вокруг него',
      h: w => Math.round(clamp(w * 0.5, 200, 300)),
      draw(w, hh) {
        K = Math.min(w / VW, hh / VH); OX = (w - VW * K) / 2; OY = (hh - VH * K) / 2;
        let d = 'M', hairs = '';
        for (let y = 0; y <= VH - 6; y += 6) d += `${y ? 'L' : ''}${q(rootX(y))} ${y}`;
        for (let y = 20; y < VH - 20; y += 9) { const x = rootX(y), sd = (y / 9) % 2 ? 1 : -1; hairs += `M${q(x + sd * 3)} ${y}l${sd * 9} ${q(3 + (y % 4))}`; }
        const g =
          `<path d="${d}" stroke="${F('root-d')}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${F('root')}" stroke-width="8.5" fill="none" stroke-linecap="round"/>` +
          `<path d="${hairs}" stroke="${F('root')}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
          (air ? `<rect x="292" y="${VH - 12}" width="26" height="6" rx="3" fill="${F('frame-d')}"/>` : '');
        return `<rect data-bg width="${w}" height="${hh}" rx="14" fill="${F('bg')}"/><rect data-bg width="${w}" height="${hh}" rx="14" fill="${F('water-c')}" opacity=".55"/><g data-bg transform="translate(${q(OX)} ${q(OY)}) scale(${q(K)})">${g}</g><g class="py-dyn"></g>` +
          `<text class="hs-lbl" data-on-picture x="${q(OX + (RX + 16) * K)}" y="${q(OY + 18 * K)}" text-anchor="start">корень</text>` +
          (air ? `<text class="hs-lbl" data-on-picture x="${q(OX + 330 * K)}" y="${q(OY + 26 * K)}" text-anchor="end">пузыри</text>` : '');
      }
    });
    new MutationObserver(() => { dyn = $('.py-dyn', ch.svg); paint(); }).observe(ch.svg, { childList: true });
    const loop = S.loop(ts => {
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0.016;
      last = ts; step(dt); paint(); loop.next();
    });
    const upd = () => {
      const R = risk(), o = DO();
      set(el, 'lab-py-o', h.nb(`${fmt(o)} мг/л`));
      set(el, 'lab-py-r', R < 0.2 ? 'низкий' : R < 0.55 ? 'заметный' : R < 0.85 ? 'высокий' : 'очень высокий');
      set(el, 'lab-py-v', R < 0.2 ? 'Прохладно и много кислорода: споры есть, но корень сильнее. Держите так.'
        : !air ? 'Включите компрессор: без пузырей кислорода меньше, корень слабеет, а спорам всё равно.'
          : R >= 0.55 ? 'Охладите раствор до 18–22 °C: уберите ёмкость от батареи и солнца, положите в ведро бутылку со льдом. При бурых корнях — смена раствора и мойка.'
            : 'На грани: следите за корнями и за температурой в жаркие дни, мойте ёмкость при каждой смене.');
      ch.redraw();
    };
    h.bindRange(el, 'lab-py-t', v => h.nb(`${fv(v)} °C`), v => { T = v; upd(); });
    h.bindPick(el, 'lab-py-a', v => { air = v === 'on'; upd(); });
    upd();
    if (h.reduce.matches) { for (let i = 0; i < 300; i++) step(0.05); dyn = $('.py-dyn', ch.svg); paint(); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { last = 0; loop.start(); } else loop.stop(); }).observe(el);
    else loop.start();
  });
