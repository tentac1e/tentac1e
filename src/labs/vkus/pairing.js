  /* @use food */
  // how much each molecule matters in the food's own aroma (1 — one of its key notes)
  const PA_W = {
    tomato: { hex: 1, lin: 0.5 }, strawberry: { mci: 0.8, lin: 0.7 }, lemon: { cit: 1, lin: 0.4 }, peach: { lin: 0.7 },
    coriander: { lin: 1 }, fennel: { est: 1 }, clove: { eug: 1, cin: 0.6 }, pepper: { car: 1 }, rosemary: { cin: 1, cam: 0.9 },
    mint: { cin: 0.6 }, cocoa: { lin: 0.5 }, olive: { hex: 0.6 }, cucumber: { hex: 0.5 }
  };
  // pairs that work by contrast: what does the work, and which basil it suits best
  const PA_LEVERS = {
    olive: [['жир', 'растворяет терпены и держит аромат']],
    cucumber: [['свежесть', 'холодная водянистая мякоть']],
    mozzarella: [['жир', 'растворяет и продлевает аромат'], ['молочная свежесть', 'оттеняет пряность']],
    parmesan: [['умами', 'глутамат выдержанного сыра'], ['соль', 'ярче слышен аромат'], ['жир', 'держит терпены']],
    garlic: [['сера', 'острота из аллицина'], ['масло', 'смягчает остроту']],
    chili: [['жгучесть', 'капсаицин'], ['кокосовый жир', 'держит эстрагол']]
  };
  const PA_FIT = {
    olive: { genovese: 1, greek: 0.95, purple: 0.9, clove: 0.9, lemon: 0.85, lime: 0.85, cinnamon: 0.8, thai: 0.75, tulsi: 0.7, african: 0.6 },
    cucumber: { lemon: 1, lime: 1, genovese: 0.9, greek: 0.85, cinnamon: 0.7, thai: 0.65, purple: 0.6, clove: 0.5, tulsi: 0.45, african: 0.4 },
    mozzarella: { genovese: 1, greek: 0.95, lemon: 0.8, lime: 0.75, purple: 0.7, cinnamon: 0.7, clove: 0.6, thai: 0.45, tulsi: 0.4, african: 0.35 },
    parmesan: { genovese: 1, greek: 0.9, purple: 0.8, clove: 0.7, cinnamon: 0.5, lemon: 0.5, lime: 0.45, thai: 0.3, tulsi: 0.35, african: 0.3 },
    garlic: { genovese: 1, greek: 0.9, purple: 0.9, clove: 0.8, thai: 0.7, tulsi: 0.6, cinnamon: 0.45, lemon: 0.5, lime: 0.5, african: 0.35 },
    chili: { thai: 1, tulsi: 0.9, lemon: 0.8, lime: 0.8, purple: 0.6, clove: 0.55, genovese: 0.45, greek: 0.45, cinnamon: 0.4, african: 0.3 }
  };
  const PA_HEX = 12; // green-leaf aldehydes burst out of any basil the moment it is cut

  register('pairing', el => {
    const V = h.CHEMO, P = h.PAIRS;
    const share = (v, m) => (m === 'hex' ? PA_HEX : V[v].p[m] || 0);
    const bridge = (v, m, w) => w * Math.min(1, Math.sqrt(share(v, m) / 40));
    // no shared molecules: the pair works by contrast (olive oil and cucumber only share a family of green notes)
    const contrast = f => !f.mols.length;
    const score = (v, f) => {
      if (contrast(f)) return (PA_FIT[f.id] || {})[V[v].id] || 0.5;
      return 1 - Object.entries(PA_W[f.id]).reduce((a, [m, w]) => a * (1 - 0.85 * bridge(v, m, w)), 1);
    };
    const word = (x, c) => c ? (x >= 0.8 ? 'отличный контраст' : x >= 0.55 ? 'хороший контраст' : 'спорно') : x >= 0.6 ? 'сильная связь' : x >= 0.35 ? 'заметная связь' : x >= 0.15 ? 'слабая связь' : 'почти нет';
    const vShort = n => n.replace('Африканский синий', 'Африк. синий');

    el.innerHTML = h.head('Лаборатория сочетаний', 'Выберите свой базилик — продукты выстроятся по силе связи с ним. Нажмите на продукт: мост покажет, какие молекулы их роднят или что работает на контрасте. Сила связи — качественная оценка по долям общих молекул.') +
      `<p class="lab-label">Ваш базилик</p>
       <div class="pa-varieties" id="lab-pa-v" role="group" aria-label="Сорт базилика">${V.map((v, i) => `<button type="button" class="chip pa-var" data-v="${i}" aria-pressed="${i === 0}"><svg viewBox="-34 -108 68 122" aria-hidden="true">${food.basil(v.id)}</svg>${vShort(v.name)}</button>`).join('')}</div>
       <p class="lab-label">С чем сочетать</p>
       <div class="pa-foods" id="lab-pa-f" role="group" aria-label="Продукты"></div>
       <div class="pa-stage">
         <p class="pa-title" id="lab-pa-title"></p>
         <div class="lab-chart pa-chart" id="lab-pa-ch"></div>
         <div class="pa-info" id="lab-pa-info" aria-live="polite"></div>
       </div>`;
    let v = 0, cur = P[0];
    const foods = $('#lab-pa-f', el);
    foods.innerHTML = P.map(f => `<button type="button" class="pa-food" data-id="${f.id}" aria-pressed="${f.id === cur.id}">${food.icon(f.id, 'pa-ico')}<span class="pa-name">${f.name}</span><span class="pa-meter"><i></i></span><span class="pa-word"></span></button>`).join('');

    /* the bridge: basil — molecules (or what works by contrast) — the food */
    const ch = h.chart($('#lab-pa-ch', el), {
      label: 'Мост ароматов между базиликом и выбранным продуктом',
      h: () => Math.max(190, 70 + ((PA_W[cur.id] ? Object.keys(PA_W[cur.id]).length : 0) + (PA_LEVERS[cur.id] || []).length) * 80),
      draw(w, hh) {
        const narrow = w < 520, cy = hh / 2 + 6;
        const Lx = narrow ? 40 : 88, Rx = w - (narrow ? 40 : 88), mx = w / 2;
        const W = PA_W[cur.id] || {};
        const mols = Object.keys(W);
        const levers = PA_LEVERS[cur.id] || [];
        const nodes = mols.map(m => ({ m, a: bridge(v, m, 1), b: W[m] })).concat(levers.map(([t, s]) => ({ lever: t, sub: s })));
        const n = nodes.length, gap = Math.min(78, (hh - 40) / Math.max(1, n));
        let s = '';
        nodes.forEach((d, i) => {
          const y = cy + (i - (n - 1) / 2) * gap;
          const col = d.m ? `var(--m-${d.m})` : 'var(--ink-3)';
          const wa = d.m ? 1.5 + 11 * d.a : 2, wb = d.m ? 1.5 + 11 * d.b : 2;
          const faint = d.m && d.a < 0.18;
          s += `<path class="pa-rib${d.lever || faint ? ' is-dash' : ''}" pathLength="1" d="M${Lx + (narrow ? 10 : 14)} ${r1(cy - 8)}C${r1((Lx + mx) / 2)} ${r1(cy - 8)} ${r1((Lx + mx) / 2)} ${r1(y)} ${r1(mx - 24)} ${r1(y)}" stroke="${col}" stroke-width="${r1(wa)}"/>`;
          s += `<path class="pa-rib${d.lever ? ' is-dash' : ''}" pathLength="1" d="M${r1(mx + 24)} ${r1(y)}C${r1((mx + Rx) / 2)} ${r1(y)} ${r1((mx + Rx) / 2)} ${r1(cy - 8)} ${Rx - (narrow ? 16 : 22)} ${r1(cy - 8)}" stroke="${col}" stroke-width="${r1(wb)}"/>`;
          if (d.m) {
            const r = 9 + 9 * Math.max(d.a, 0.15);
            s += `<circle class="pa-node${faint ? ' is-faint' : ''}" cx="${r1(mx)}" cy="${r1(y)}" r="${r1(r)}" fill="${col}" stroke="${col}"/>`;
            s += `<text class="pa-mol" x="${r1(mx)}" y="${r1(y + r + 13)}" text-anchor="middle">${d.m === 'hex' ? 'зелёные альдегиды' : h.molName(d.m).replace(/^1,8-|^α-|^β-/, '').toLowerCase()}</text>`;
            s += `<text class="pa-sub" x="${r1(mx)}" y="${r1(y + r + 25)}" text-anchor="middle">${d.m === 'hex' ? 'при разрезе листа' : faint ? 'в этом сорте почти нет' : `${share(v, d.m)} % масла`}</text>`;
          } else {
            const tw = d.lever.length * 7.4 + 22;
            s += `<rect class="pa-lever" x="${r1(mx - tw / 2)}" y="${r1(y - 13)}" width="${r1(tw)}" height="26" rx="13"/><text class="pa-mol" x="${r1(mx)}" y="${r1(y + 4.5)}" text-anchor="middle">${d.lever}</text>`;
            s += `<text class="pa-sub" x="${r1(mx)}" y="${r1(y + 27)}" text-anchor="middle">${d.sub}</text>`;
          }
        });
        s += `<g class="pa-end" transform="translate(${Lx} ${r1(cy + 26)})">${food.basil(V[v].id, narrow ? 0.5 : 0.62)}</g>`;
        s += `<g class="pa-end" transform="translate(${r1(Rx - (narrow ? 24 : 32))} ${r1(cy - 8 - (narrow ? 24 : 32))}) scale(${narrow ? 0.75 : 1})">${food.g(cur.id)}</g>`;
        return s;
      }
    });
    const drawIn = () => {
      const ribs = $$('.pa-rib', ch.svg);
      if (h.reduce.matches) return;
      ribs.forEach(p => { p.classList.remove('is-in'); });
      requestAnimationFrame(() => requestAnimationFrame(() => ribs.forEach((p, i) => { p.style.transitionDelay = `${(i % 2) * 0.28 + Math.floor(i / 2) * 0.06}s`; p.classList.add('is-in'); })));
    };

    const info = () => {
      const f = cur, x = score(v, f), c = contrast(f);
      const best = V.map((_, i) => [i, score(i, f)]).sort((a, b) => b[1] - a[1])[0];
      set(el, 'lab-pa-title', `<span>${V[v].name}</span><i>+</i><span>${f.name.toLowerCase()}</span>`);
      const kicker = f.mols.length ? 'Общие молекулы' : f.kin && f.kin.length ? 'Родство ароматов' : 'Работает контраст';
      $('#lab-pa-info', el).innerHTML = `<p class="lab-kicker">${kicker}</p>
        <p class="pa-verdict"><b>${word(x, c)}</b>${best[0] !== v ? ` · лучше всего — ${V[best[0]].name.toLowerCase()}` : ' · лучший выбор для этой пары'}</p>
        <p>${h.nb(f.why)}</p>
        <dl class="data-rows"><div><dt>Какой сорт</dt><dd>${f.variety}</dd></div><div><dt>Попробуйте</dt><dd>${f.dish}</dd></div></dl>`;
    };

    // cards: strongest first, contrast pairs after; they glide to their new places (FLIP)
    const order = () => {
      const cards = $$('.pa-food', foods);
      const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
      const rank = P.map(f => ({ f, x: score(v, f), c: contrast(f) })).sort((a, b) => (a.c - b.c) || (b.x - a.x));
      rank.forEach(({ f, x, c }) => {
        const card = $(`.pa-food[data-id="${f.id}"]`, foods);
        card.style.setProperty('--v', x.toFixed(2));
        card.classList.toggle('is-contrast', c);
        $('.pa-word', card).textContent = word(x, c);
        foods.appendChild(card);
      });
      if (h.reduce.matches) return;
      cards.forEach(c => {
        const a = first.get(c), b = c.getBoundingClientRect();
        const dx = a.left - b.left, dy = a.top - b.top;
        if (!dx && !dy) return;
        c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,.8,.26,1)' });
      });
    };
    const pick = () => {
      $$('.pa-food', foods).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === cur.id)));
      ch.redraw();
      drawIn();
      info();
    };
    foods.addEventListener('click', e => { const b = e.target.closest('.pa-food'); if (!b) return; cur = P.find(p => p.id === b.dataset.id); pick(); });
    $('#lab-pa-v', el).addEventListener('click', e => {
      const b = e.target.closest('.pa-var');
      if (!b) return;
      v = +b.dataset.v;
      $$('.pa-var', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      order();
      foods.scrollTo({ left: 0, behavior: h.reduce.matches ? 'auto' : 'smooth' });
      pick();
    });
    order();
    pick();
  });
