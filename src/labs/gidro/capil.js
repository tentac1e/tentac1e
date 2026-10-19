  /* Capillary rise in a net cup: h = 2σ·cos θ / (ρ·g·r) for water (σ = 0.072 N/m, θ ≈ 0). The pore radius of each
     substrate is a typical one, so the heights are an estimate: they show the order, not a measurement. */
  const CAP = {
    clay: { name: 'керамзит', r: 1.5, note: 'щели между шариками в 1–2 мм' },
    perlite: { name: 'перлит', r: 0.4, note: 'зёрна 2–4 мм с порами' },
    coco: { name: 'кокос', r: 0.1, note: 'волокна и крошка' },
    wool: { name: 'минвата', r: 0.08, note: 'волокна в десятые доли миллиметра' },
    mix: { name: 'кубик + керамзит', r: 0.08, note: 'кубик минваты в середине, керамзит вокруг' }
  };
  register('capil', el => {
    el.innerHTML = h.head('Докуда поднимется вода', 'Стаканчик высотой 6 см стоит над раствором. Голубым — где субстрат мокрый. Радиус пор — типичный для каждого субстрата, высота подъёма — по закону Жюрена.', true) +
      `<div class="lab-controls">
        ${h.chipsHtml('lab-cap-s', 'Субстрат', Object.keys(CAP).map(k => [k, CAP[k].name]), 'mix')}
        ${h.rangeHtml('lab-cap-g', 'Дно стаканчика над раствором', 0, 4, 0.5, 1)}
      </div>
      <div class="lab-stage cap-stage" id="lab-cap-pic"></div>` +
      h.readHtml([['Подъём воды', 'lab-cap-h'], ['Мокро в стаканчике', 'lab-cap-w'], ['Что это значит', 'lab-cap-v', 'is-wide']]);
    const F = ill.F, q = ill.q;
    let sub = 'mix', gap = 1;
    const rise = r => 2 * 0.072 / (1000 * 9.81 * r / 1000) * 100; // cm
    const CM = 18, X0 = 100, X1 = 200, BOT = 150, CUP = 6;
    const draw = () => {
      const s = CAP[sub], wl = BOT + gap * CM, hr = rise(s.r), wetTop = Math.max(BOT - CUP * CM, wl - hr * CM);
      const rnd = ill.rng(7);
      const yTop = BOT - CUP * CM;
      let g = `<rect data-bg width="300" height="236" rx="14" fill="${F('bg')}"/>`;
      // the solution below
      g += `<rect x="40" y="${q(wl)}" width="220" height="${q(232 - wl)}" fill="${F('water-c')}" opacity=".9"/><path d="M40 ${q(wl)}H260" stroke="${F('glass-d')}" stroke-width="1.2"/>`;
      // the cup's walls (a section): the net
      const inner = `M${X0} ${yTop}L${X0 + 8} ${BOT}H${X1 - 8}L${X1} ${yTop}Z`;
      g += `<clipPath id="cap-clip"><path d="${inner}"/></clipPath><g clip-path="url(#cap-clip)">`;
      g += `<rect x="${X0}" y="${yTop}" width="${X1 - X0}" height="${CUP * CM}" fill="${F('bg-2')}"/>`;
      const balls = (x0, x1, r0) => {
        let b = '';
        for (let y = BOT - r0; y > yTop - r0; y -= r0 * 1.7) for (let x = x0 + r0 + ((y / r0) % 2 ? r0 * 0.8 : 0); x < x1; x += r0 * 2.05) {
          const r = r0 * (0.82 + rnd() * 0.3);
          b += `<circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}" fill="${F('pot')}" stroke="${F('pot-d')}" stroke-width="1"/><circle cx="${q(x - r * 0.35)}" cy="${q(y - r * 0.35)}" r="${q(r * 0.25)}" fill="${F('pot-hi')}" opacity=".7"/>`;
        }
        return b;
      };
      const fibers = (x0, x1, col, n, len) => {
        let d = '';
        for (let i = 0; i < n; i++) { const x = x0 + rnd() * (x1 - x0), y = yTop + rnd() * CUP * CM, a = rnd() * Math.PI; d += `M${q(x)} ${q(y)}l${q(Math.cos(a) * len)} ${q(Math.sin(a) * len)}`; }
        return `<path d="${d}" stroke="${F(col)}" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`;
      };
      if (sub === 'clay') g += balls(X0, X1, 12);
      else if (sub === 'perlite') { for (let i = 0; i < 90; i++) g += `<circle cx="${q(X0 + 4 + rnd() * (X1 - X0 - 8))}" cy="${q(yTop + 3 + rnd() * (CUP * CM - 6))}" r="${q(2.5 + rnd() * 2)}" fill="${F('perlite')}" stroke="${F('frame-d')}" stroke-width=".6"/>`; }
      else if (sub === 'coco') g += fibers(X0, X1, 'kraft-d', 260, 7);
      else if (sub === 'wool') g += fibers(X0, X1, 'straw', 320, 10);
      else { g += balls(X0, 132, 12) + balls(168, X1, 12) + `<rect x="132" y="${yTop + 6}" width="36" height="${CUP * CM - 6}" fill="${F('straw')}" opacity=".55"/>` + fibers(132, 168, 'kraft-d', 90, 7); }
      // what is wet: from the water up to the height the pores lift it (the cube only, in the mix)
      const wet = (x0, x1) => wetTop < BOT ? `<rect x="${x0}" y="${q(wetTop)}" width="${x1 - x0}" height="${q(BOT - wetTop)}" fill="${F('water-c')}" opacity=".5"/>` : '';
      if (sub === 'mix') {
        const clayTop = Math.max(yTop, wl - rise(CAP.clay.r) * CM);
        g += clayTop < BOT ? `<rect x="${X0}" y="${q(clayTop)}" width="${X1 - X0}" height="${q(BOT - clayTop)}" fill="${F('water-c')}" opacity=".5"/>` : '';
        g += wet(132, 168);
      } else g += wet(X0, X1);
      g += '</g>';
      g += `<path d="${inner}" fill="none" stroke="${F('plastic')}" stroke-width="3"/>`;
      g += [0.33, 0.66].map(k => `<path d="M${q(X0 + 8 * k)} ${q(yTop + CUP * CM * k)}H${q(X1 - 8 * k)}" stroke="${F('plastic')}" stroke-width="1.2" opacity=".6"/>`).join('');
      // a ruler on the left: centimetres above the solution
      let r = `<g class="ill-scale"><path d="M70 ${q(wl)}V${yTop}" fill="none" stroke="currentColor"/>`;
      for (let c = 0; c <= 10; c++) { const y = wl - c * CM; if (y < yTop - 2) break; r += `<path d="M66 ${q(y)}H74" stroke="currentColor"/>`; if (c % 2 === 0) r += `<text x="62" y="${q(y + 4)}" text-anchor="end">${c}</text>`; }
      g += r + '</g>';
      g += `<text class="hs-lbl" data-on-picture x="250" y="${q(Math.min(224, wl + 18))}" text-anchor="end">раствор</text>`;
      g += `<text class="hs-lbl" data-on-picture x="62" y="${yTop - 8}" text-anchor="end">см</text>`;
      if (wetTop > yTop + 6) g += `<text class="hs-lbl" data-on-picture x="210" y="${q(yTop + 14)}" text-anchor="start">сухо</text>`;
      return `<svg class="cap-svg" viewBox="0 0 300 236" role="img" aria-label="Стаканчик с субстратом над раствором: где он мокрый">${g}</svg>`;
    };
    const upd = () => {
      const s = CAP[sub], hr = rise(s.r), wetCm = clamp(hr - gap, 0, CUP);
      $('#lab-cap-pic', el).innerHTML = draw();
      set(el, 'lab-cap-h', h.nb(hr >= 10 ? `≈ ${fmt0(hr)} см` : `≈ ${fmt(hr)} см`));
      set(el, 'lab-cap-w', h.nb(sub === 'mix' ? `кубик: ${fmt(wetCm)} из 6 см` : `${fmt(wetCm)} из 6 см`));
      set(el, 'lab-cap-v', sub === 'clay'
        ? (wetCm < 1 ? 'Керамзит почти не поднимает воду: сеянцу в нём нечего пить, пока корень не дорос до раствора. Поэтому сеют в кубик, а керамзитом только засыпают.' : 'Нижние шарики мокрые, верхние сухие: корень будет жить в мокрой полоске у дна.')
        : sub === 'mix' ? 'Так и задумано: кубик пропитан до верха и поит сеянец, а керамзит вокруг сухой и воздушный — не гниёт и не цветёт.'
          : sub === 'perlite' ? 'Перлит поднимает воду на несколько сантиметров — хорош для фитиля, но легко всплывает и пылит.'
            : `Мелкие поры (${s.note}) поднимают воду на весь стаканчик: сеянец не пересохнет, но и воздуха у стебля мало — поверх лучше насыпать керамзита.`);
    };
    h.bindPick(el, 'lab-cap-s', v => { sub = v; upd(); });
    h.bindRange(el, 'lab-cap-g', v => h.nb(`${fv(v)} см`), v => { gap = v; upd(); });
    upd();
  });
