  /* @use micro */
  const TR_INFO = {
    intro: ['Срез листа', 'Весь лист — около трети миллиметра. Сверху вниз: кутикула и эпидермис, столбчатая и губчатая ткани с хлоропластами, жилка, нижний эпидермис с устьицами. Аромат живёт снаружи — в железках на поверхности. Коснитесь любой части среза.', ''],
    epi: ['Эпидермис и кутикула', 'Один слой плоских прозрачных клеток без хлоропластов: свет проходит сквозь них вглубь листа. Сверху — кутикула, восковая плёнка, которая не выпускает воду. Из клеток эпидермиса вырастают все волоски и железки.', 'клетка — около 15–25 мкм в высоту, кутикула тоньше 3 мкм'],
    pal: ['Столбчатая ткань', 'Вытянутые клетки стоят плотным частоколом и набиты хлоропластами — здесь идёт большая часть фотосинтеза. Хлоропласты прижаты к стенкам, а на слишком ярком свету поворачиваются к нему ребром, чтобы не обгореть.', 'у листа на солнце — два слоя клеток, у листа в тени — один'],
    spo: ['Губчатая ткань', 'Рыхлые клетки неправильной формы, между ними — воздушные ходы. По ним углекислый газ от устьиц расходится по всему листу, а водяной пар уходит наружу. Хлоропластов меньше, поэтому нижняя сторона листа светлее верхней.', 'воздух занимает до трети объёма этого слоя'],
    vein: ['Жилка', 'Проводящий пучок в кольце клеток обкладки. Сверху — ксилема: мёртвые полые трубки с одревесневшими стенками (здесь они малиновые, как после окраски сафранином), по ним поднимается вода с ионами. Снизу — флоэма: живые ситовидные трубки, они уносят сахар из листа к корням, почкам и цветкам.', 'мелкая жилка — 60–80 мкм в поперечнике'],
    loepi: ['Нижний эпидермис', 'Такие же прозрачные клетки, но устьиц здесь больше, чем сверху. Железки тоже есть: нижняя сторона листа пахнет не хуже верхней.', ''],
    stoma: ['Устьице', 'Две замыкающие клетки и щель между ними. На свету клетки набирают воду, выгибаются, и щель открывается: внутрь идёт CO₂, наружу — пар. Над щелью — воздушная полость, от неё начинаются ходы губчатой ткани.', 'щель — несколько микрометров, на миллиметре листа их сотни'],
    pel: ['Пельтатная железка', 'Главное хранилище аромата. Четыре клетки головки выделяют эфирное масло в пространство под кутикулой, и она раздувается блестящим пузырём. В таких пузырях — почти весь линалоол, эвгенол и эстрагол листа. Пузырь лопается от лёгкого касания: поэтому потёртый лист пахнет сильнее.', 'пузырь — 60–90 мкм, под лупой виден как золотистая точка'],
    cap: ['Головчатая железка', 'Маленькая: ножка из одной-двух клеток и круглая головка. Выделяет понемногу масла и слизи, быстро опустошается и почти не добавляет аромата — главные здесь пельтатные.', 'около 20–30 мкм'],
    hair: ['Кроющий волосок', 'Несколько клеток в ряд, без масла, с бугорчатой оболочкой. Волоски рассеивают резкий свет, держат у поверхности слой влажного воздуха и мешают мелким насекомым.', 'до 100–200 мкм в длину']
  };
  register('trichome', el => {
    el.innerHTML = h.head('Лист под микроскопом', 'Поперечный срез листа базилика. Коснитесь любой ткани или железки, чтобы узнать, что она делает. «Потереть лист» — и пузыри масла лопнут.') +
      `<div class="lab-controls tr-controls">
         ${h.segHtml('lab-tr-light', 'Лист вырос', [['sun', 'на солнце'], ['shade', 'в тени']], 'sun')}
         <div class="lab-actions"><button class="btn btn-primary btn-small" type="button" id="lab-tr-rub">${h.icon('nose')}Потереть лист</button><button class="btn btn-ghost btn-small" type="button" id="lab-tr-reset">Заново</button></div>
       </div>
       <div class="tr-wrap"><div class="lab-chart tr-chart" id="lab-tr-ch"></div><div class="aroma-layer" id="lab-tr-aroma" aria-hidden="true"></div></div>
       <p class="lab-foot tr-light-note" id="lab-tr-note"></p>
       <div class="tr-info" id="lab-tr-info" aria-live="polite"></div>
       <div class="lab-grid tr-grid">
         <div class="lab-controls">${h.rangeHtml('lab-tr-age', 'Лист', 0, 100, 1, 20)}<p class="lab-foot">Вид сверху на один и тот же участок. Железки закладываются, пока лист крошечный; потом лист растягивается, а их число почти не меняется — на каждом квадратном миллиметре их становится меньше.</p></div>
         <div class="tr-top"><svg id="lab-tr-top" viewBox="0 0 200 200" role="img" aria-label="Вид сверху на участок листа с железками"></svg><p class="tick" id="lab-tr-cap"></p></div>
       </div>`;
    let light = 'sun', sel = null;
    const burst = new Set();
    const glands = [];
    const layer = $('#lab-tr-aroma', el);
    const ch = h.chart($('#lab-tr-ch', el), {
      label: 'Поперечный срез листа базилика с железками, жилкой и устьицами',
      // on a wide screen the section is drawn 1.3× larger: the same cells, easier to see
      h: w => (w < 520 ? 420 : 430 * 1.3),
      draw(W, HH) {
        const k = W < 520 ? 1 : 1.3, w = W / k, H = HH / k;
        const sun = light === 'sun';
        const TOP = 112;
        const pal = sun ? [44, 42] : [54];
        const spo = sun ? 100 : 84;
        const narrow = w < 520;
        const veinX = Math.round(w * (narrow ? 0.66 : 0.6));
        const stomata = narrow ? [Math.round(w * 0.3)] : [Math.round(w * 0.3), Math.round(w * 0.84)];
        const sec = micro.section(w, { top: TOP, epi: 22, pal, spo, lo: 17, veins: [veinX], stomata, seed: sun ? 11 : 12 });
        const y = sec.y, rnd = micro.rng(5);
        let s = `<defs><radialGradient id="mic-oil-grad" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="var(--mic-oil-hi)"/><stop offset=".45" stop-color="var(--mic-oil)"/><stop offset="1" stop-color="var(--mic-oil-deep)"/></radialGradient>
          <linearGradient id="lab-tr-air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mic-air)"/><stop offset="1" stop-color="var(--mic-air-2)"/></linearGradient></defs>`;
        s += `<rect x="0" y="0" width="${w}" height="${H}" fill="url(#lab-tr-air)"/>`;
        s += sec.svg;
        // glands on the upper side: where they stand depends on the width
        const up = narrow
          ? [['pel', 0.2], ['cap', 0.45], ['pel', 0.72], ['hair', 0.93]]
          : [['pel', 0.12], ['hair', 0.25], ['cap', 0.36], ['pel', 0.5], ['cap', 0.66], ['pel', 0.8], ['hair', 0.93]];
        const fill = sun ? 1 : 0.62;
        glands.length = 0;
        const items = [];
        let pi = 0;
        up.forEach(([k, f]) => {
          const x = Math.round(w * f);
          const d = k === 'pel' ? micro.peltate(x, y.cut, { fill, rnd, r: narrow ? 22 : 25 }) : k === 'cap' ? micro.capitate(x, y.cut, { rnd }) : micro.hair(x, y.cut, { rnd, len: 66, bend: 18 });
          const id = k === 'pel' ? pi++ : null;
          const state = id !== null && burst.has(id) ? ' is-burst is-done' : '';
          s += `<g class="mic-t tr-gl tr-${k}${state}" data-t="${k}"${id !== null ? ` data-i="${id}" tabindex="0" role="button" aria-label="Пельтатная железка: нажмите, чтобы она лопнула"` : ''}>${d.g}</g>`;
          if (id !== null) glands.push(id);
          items.push({ k, x: d.tx == null ? x : d.tx, top: d.top });
        });
        // one gland of each kind underneath too
        const lp = micro.peltate(Math.round(w * (narrow ? 0.5 : 0.56)), y.bot, { up: -1, fill: fill * 0.55, rnd, r: 18 });
        const lc = micro.capitate(Math.round(w * (narrow ? 0.12 : 0.18)), y.bot, { up: -1, rnd });
        const lid = pi++;
        s += `<g class="mic-t tr-gl tr-pel${burst.has(lid) ? ' is-burst is-done' : ''}" data-t="pel" data-i="${lid}">${lp.g}</g><g class="mic-t tr-gl tr-cap" data-t="cap">${lc.g}</g>`;
        glands.push(lid);
        // captions: glands above, tissues on pills at the left edge
        const names = { pel: 'пельтатная железка', cap: 'головчатая', hair: 'волосок' };
        const seen = {};
        const top = items.filter(it => { if (seen[it.k]) return false; seen[it.k] = 1; return true; })
          .map(it => ({ x: it.x, text: it.k === 'pel' ? 'масло под кутикулой' : names[it.k], to: [it.x, it.top - 3], t: it.k }));
        s += micro.labels(top, w, [18, 40]);
        const band = (yy, text, t) => micro.pill(6, yy, text, { t });
        s += band(y.epi + 11, 'эпидермис', 'epi');
        s += band(y.pal + (y.spo - y.pal) / 2, 'столбчатая ткань', 'pal');
        s += band(y.spo + spo * 0.62, 'губчатая ткань', 'spo');
        const vy = y.spo + Math.min(40, spo * 0.42);
        s += micro.labels([{ x: veinX + 72, text: 'жилка', to: [veinX + 42, vy], t: 'vein' }], w, [vy]);
        s += micro.labels([{ x: stomata[0], text: 'устьице', to: [stomata[0], y.bot + 2], t: 'stoma' }], w, [y.bot + 34]);
        s += micro.scale(w - 12, H - 14, 60, '50 мкм');
        return `<g class="tr-scene${sel ? ' has-sel' : ''}"${k !== 1 ? ` transform="scale(${k})"` : ''}>${s}</g>`;
      }
    });
    ch.svg.classList.add('tr-svg');
    const info = () => {
      const [t, text, size] = TR_INFO[sel || 'intro'];
      $('#lab-tr-info', el).innerHTML = `<p class="lab-kicker">${sel ? 'Что это' : 'Как читать срез'}</p><h5>${t}</h5><p>${h.nb(text)}</p>${size ? `<p class="tr-size">${h.nb(size)}</p>` : ''}`;
    };
    const mark = () => {
      const scene = $('.tr-scene', ch.svg);
      if (!scene) return;
      scene.classList.toggle('has-sel', !!sel);
      $$('.mic-t', scene).forEach(g => g.classList.toggle('is-sel', g.dataset.t === sel));
      $$('.mic-label', scene).forEach(g => g.classList.toggle('is-sel', g.dataset.for === sel));
    };
    const pop = g => {
      const i = +g.dataset.i;
      if (burst.has(i)) return;
      burst.add(i);
      g.classList.add('is-burst');
      const r = g.getBoundingClientRect();
      S.aroma(layer, r.left + r.width / 2, r.top + r.height * 0.25);
      if (window.BasilHaptics) window.BasilHaptics.impact();
    };
    ch.svg.addEventListener('click', e => {
      const g = e.target.closest('.mic-t');
      if (!g) { sel = null; mark(); info(); return; }
      if (g.dataset.t === 'pel') pop(g);
      sel = sel === g.dataset.t && g.dataset.t !== 'pel' ? null : g.dataset.t;
      mark();
      info();
    });
    ch.svg.addEventListener('keydown', e => {
      const g = e.target.closest && e.target.closest('.tr-pel');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sel = 'pel'; pop(g); mark(); info(); }
    });
    const redraw = () => { ch.redraw(); mark(); };
    $('#lab-tr-rub', el).addEventListener('click', () => {
      const all = $$('.tr-pel', ch.svg).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      all.forEach((g, i) => setTimeout(() => pop(g), 120 + i * 170));
    });
    $('#lab-tr-reset', el).addEventListener('click', () => { burst.clear(); redraw(); });
    const note = () => set(el, 'lab-tr-note', light === 'sun'
      ? 'Лист на солнце толще: два слоя столбчатой ткани, пузыри железок полны масла.'
      : 'Лист в тени тоньше: один слой столбчатой ткани, масла в железках меньше — и аромат слабее.');
    h.bindPick(el, 'lab-tr-light', v => { light = v; burst.clear(); redraw(); note(); age(ageV); });

    /* top view: jigsaw epidermis, glands as golden dots, stomata */
    const topSvg = $('#lab-tr-top', el);
    let ageV = 20;
    function age(a) {
      ageV = a;
      const k = 1 + a / 100 * 3;             // leaf has stretched k times
      const rnd = micro.rng(3);
      const cellPx = 17 * Math.sqrt(k);      // cells grow, but also still divide early on
      const cols = Math.ceil(200 / cellPx) + 2;
      const P = [];
      for (let r = 0; r <= cols; r++) for (let c = 0; c <= cols; c++) P.push([c * cellPx - cellPx + (rnd() - 0.5) * cellPx * 0.5, r * cellPx - cellPx + (rnd() - 0.5) * cellPx * 0.5]);
      const at = (c, r) => P[r * (cols + 1) + c];
      const wav = (a1, b1) => { const mx = (a1[0] + b1[0]) / 2, my = (a1[1] + b1[1]) / 2, dx = b1[0] - a1[0], dy = b1[1] - a1[1], n = (rnd() - 0.5) * 0.5; return `M${r1(a1[0])} ${r1(a1[1])}Q${r1(mx - dy * n)} ${r1(my + dx * n)} ${r1(mx)} ${r1(my)}T${r1(b1[0])} ${r1(b1[1])}`; };
      let walls = '';
      for (let r = 0; r < cols; r++) for (let c = 0; c < cols; c++) { walls += wav(at(c, r), at(c + 1, r)) + wav(at(c, r), at(c, r + 1)); }
      let t = `<defs><radialGradient id="lab-tr-dot" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="var(--mic-oil-hi)"/><stop offset=".5" stop-color="var(--mic-oil)"/><stop offset="1" stop-color="var(--mic-oil-deep)"/></radialGradient><clipPath id="lab-tr-clip"><rect width="200" height="200" rx="16"/></clipPath></defs>`;
      t += `<g clip-path="url(#lab-tr-clip)"><rect class="tr-surf" width="200" height="200"/><path class="tr-wall" d="${walls}"/>`;
      // stomata on the upper side are few; glands thin out as the leaf stretches
      const sunK = light === 'sun' ? 1 : 0.7;
      const n = Math.max(2, Math.round(26 * sunK / (k * k) * 3.2));
      const nCap = Math.max(1, Math.round(n * 0.8));
      const place = [];
      const spot = () => { for (let tries = 0; tries < 40; tries++) { const x = 12 + rnd() * 176, y = 12 + rnd() * 176; if (place.every(([px, py]) => Math.hypot(px - x, py - y) > 16)) { place.push([x, y]); return [x, y]; } } return [12 + rnd() * 176, 12 + rnd() * 176]; };
      for (let i = 0; i < 3; i++) { const [x, y] = spot(); t += `<g class="tr-sto" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rnd() * 180)})"><ellipse cx="-2.6" rx="2.6" ry="5.4"/><ellipse cx="2.6" rx="2.6" ry="5.4"/><path d="M0 -3.6V3.6"/></g>`; }
      for (let i = 0; i < nCap; i++) { const [x, y] = spot(); t += `<circle class="tr-capdot" cx="${r1(x)}" cy="${r1(y)}" r="2.6"/>`; }
      const R = 7.5 * Math.min(1.25, 0.9 + a / 250);
      for (let i = 0; i < n; i++) {
        const [x, y] = spot();
        t += `<g class="tr-peldot"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(R + 1.6)}" class="tr-pelrim"/><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(R)}" fill="url(#lab-tr-dot)"/><path d="M${r1(x - R * 0.7)} ${r1(y)}H${r1(x + R * 0.7)}M${r1(x)} ${r1(y - R * 0.7)}V${r1(y + R * 0.7)}" class="tr-pelx"/><ellipse cx="${r1(x - R * 0.35)}" cy="${r1(y - R * 0.4)}" rx="${r1(R * 0.3)}" ry="${r1(R * 0.18)}" class="tr-pelhi"/></g>`;
      }
      for (let i = 0; i < 2; i++) { const [x, y] = spot(); t += `<path class="tr-hairtop" d="M${r1(x)} ${r1(y)}q ${r1(14 + rnd() * 8)} ${r1(-4 - rnd() * 6)} ${r1(26 + rnd() * 8)} ${r1(-2)}"/>`; }
      t += '</g>';
      topSvg.innerHTML = t;
      set(el, 'lab-tr-cap', `${a < 30 ? 'молодой верхний лист' : a < 70 ? 'лист среднего возраста' : 'старый нижний лист'}: ≈ ${n} ${h.plural(n, 'пельтатная железка', 'пельтатные железки', 'пельтатных железок')} на этом участке`);
    }
    h.bindRange(el, 'lab-tr-age', a => a < 30 ? 'молодой' : a < 70 ? 'средний' : 'старый', age);
    note();
    info();
    age(20);
  });
