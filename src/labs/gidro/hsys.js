  /* Six systems cut open, moving: where the water goes and where the roots get their air.
     The scene is drawn in a box of 360 × 200 and scaled to the width; its captions stay at their real size. */
  const HS = {
    kratky: { name: 'Кратки', air: 'Зазор над раствором растёт сам: куст пьёт, уровень падает, верх корней — в воздухе.', pow: 'не нужно', out: 'ничего не заметит', who: 'Один-два куста на окне, без шума и проводов. Самое простое начало.' },
    dwc: { name: 'DWC', air: 'Пузыри перемешивают раствор и всё время подносят к корням воду, насыщенную кислородом у поверхности.', pow: 'компрессор 2–5 Вт круглые сутки', out: 'через несколько часов корням станет душно', who: 'Три-шесть кустов и самый быстрый рост из простых систем.' },
    wick: { name: 'Фитиль', air: 'Раствор поднимается по шнуру в рыхлый субстрат, воздух остаётся в его порах.', pow: 'не нужно', out: 'ничего не заметит', who: 'Маленький куст и тот, кто часто уезжает. Большому кусту фитиль не успевает подавать воду.' },
    ebb: { name: 'Прилив-отлив', air: 'Насос затапливает лоток, вода уходит обратно, и в субстрат втягивается свежий воздух.', pow: 'насос 5–20 Вт по таймеру, по 15 минут несколько раз в день', out: 'субстрат держит воду: несколько часов без беды', who: 'Много горшков на одном лотке, сеянцы и черенки.' },
    nft: { name: 'NFT', air: 'По желобу течёт плёнка раствора в несколько миллиметров, верх корневого мата — в воздухе.', pow: 'насос круглые сутки', out: 'корни сохнут за несколько часов', who: 'Ряды кустов и вертикальные фермы. Нужен уклон 1–3 % и проток 1–2 л в минуту на желоб.' },
    drip: { name: 'Капельная', air: 'Капли поят субстрат, лишнее стекает в бак, поры субстрата остаются с воздухом.', pow: 'насос по таймеру', out: 'субстрат держит воду полдня', who: 'Крупные кусты в теплице и много горшков с одного бака.' }
  };

  register('hsys', el => {
    el.innerHTML = h.head('Шесть систем в разрезе', 'Голубое — раствор, белые кружки — пузыри воздуха, стрелки — куда течёт вода. Выберите систему и посмотрите, откуда корни берут воздух.') +
      h.chipsHtml('lab-hs-sys', 'Система', Object.keys(HS).map(k => [k, HS[k].name]), 'kratky') +
      `<div class="lab-chart hs-chart" id="lab-hs-ch"></div>` +
      h.readHtml([['Воздух корням', 'lab-hs-air', 'is-wide'], ['Электричество', 'lab-hs-pow'], ['Если отключат свет', 'lab-hs-out'], ['Кому подойдёт', 'lab-hs-who', 'is-wide']]);
    const F = ill.F, q = ill.q;
    let sys = 'kratky', K = 1, OX = 0, OY = 0, dyn = null, T = 0;
    const VW = 360, VH = 200;
    // captions: real pixels at a point of the scene
    const lbl = (x, y, text, anchor = 'middle') => `<text class="hs-lbl" data-on-picture x="${q(OX + x * K)}" y="${q(OY + y * K)}" text-anchor="${anchor}">${text}</text>`;
    const plant = (x, y, hgt, seed) => ill.bush({ x, y, h: hgt, nodes: 2, leaf: 0.15, spread: 0.85, seed });
    const roots = (x, y, len, n, seed, sp = 0.6) => props.roots(x, y, len, n, { seed, spread: sp, w: 1.5 });
    const pipe = d => `<path d="${d}" stroke="${F('frame-d')}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const water = (x, y, w, hh) => hh > 0 ? `<rect x="${q(x)}" y="${q(y)}" width="${q(w)}" height="${q(hh)}" fill="${F('water-c')}" opacity=".95"/>` : '';
    const wall = (x, y, w, hh, fill = 'glass') => `<rect x="${q(x)}" y="${q(y)}" width="${q(w)}" height="${q(hh)}" rx="6" fill="${F(fill)}" opacity="${fill === 'glass' ? 0.45 : 1}" stroke="${F(fill === 'glass' ? 'glass-d' : 'box-d')}" stroke-width="1.4"/>`;
    const pump = (x, y) => `<rect x="${x - 10}" y="${y - 12}" width="20" height="12" rx="3" fill="${F('dark')}"/><circle cx="${x}" cy="${y - 6}" r="2.6" fill="${F('frame-d')}"/>`;
    const arrowUp = (x, y, on) => `<path d="M${x} ${y}l-4 6h8z" fill="${F('dark')}" opacity="${on ? 0.85 : 0.15}"/>`;
    const bubbles = (cx, bottom, top, n, t, spread = 14, seed = 1) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const u = ((t * (0.32 + (i % 5) * 0.05) + i / n + seed * 0.13) % 1 + 1) % 1, y = bottom - u * (bottom - top);
        const x = cx + Math.sin(u * 7 + i * 2.3) * spread * (0.3 + u) + ((i * 37) % 11 - 5);
        s += `<circle cx="${q(x)}" cy="${q(y)}" r="${q(1.3 + (i % 3) * 0.5)}" fill="${F('hi')}" fill-opacity=".35" stroke="${F('hi')}" stroke-width=".9"/>`;
      }
      return s;
    };
    // a dashed line that flows along a path: the water's way
    const flow = (d, t, speed = 14, w = 2) => `<path d="${d}" stroke="${F('glass-d')}" stroke-width="${w}" fill="none" stroke-dasharray="5 7" stroke-dashoffset="${q(-t * speed % 12)}" stroke-linecap="round"/>`;
    const drop = (x, y) => `<path d="M${q(x)} ${q(y - 4)}c2 2.6 3.2 4 3.2 5.6a3.2 3.2 0 0 1 -6.4 0c0 -1.6 1.2 -3 3.2 -5.6z" fill="${F('water-c')}" stroke="${F('glass-d')}" stroke-width=".6"/>`;

    const SC = {
      kratky: {
        still() {
          let g = wall(120, 62, 120, 126);
          g += `<path d="M258 84V150" class="ill-arrow"/><path class="ill-arrow-head" d="M258 156l-5 -9h10z"/>`;
          return g;
        },
        move(t) {
          const u = (t % 14) / 14, lv = u < 0.86 ? 0.82 - 0.5 * (u / 0.86) : 0.32 + 0.5 * ((u - 0.86) / 0.14), yl = 184 - 114 * lv;
          let g = water(122, yl, 116, 184 - yl) + roots(180, 76, 106, 9, 5, 0.7);
          // the air roots: root hairs between the cup and the level
          let d = '';
          for (let y = 82; y < yl - 4; y += 5) { const sd = (y / 5) % 2 ? 1 : -1; d += `M${180 + sd * 3} ${q(y)}l${sd * (6 + (y % 3) * 2)} 2`; }
          g += `<path d="${d}" stroke="${F('root')}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
          g += `<rect x="114" y="56" width="132" height="10" rx="3" fill="${F('metal-d')}"/>` + hcup(180, 57, 26, 22, { fill: 'clay' }) + plant(180, 52, 32, 4);
          // the leaves breathe water out
          for (let i = 0; i < 3; i++) { const v = (t * 0.4 + i / 3) % 1; g += `<path d="M${152 + i * 28} ${q(26 - v * 12)}q3 -3 0 -6q-3 -3 0 -6" stroke="${F('glass-d')}" stroke-width="1.3" fill="none" opacity="${q(0.7 * (1 - v))}" stroke-linecap="round"/>`; }
          return { svg: g, labels: lbl(204, Math.min(yl - 8, 110), 'воздух', 'start') + lbl(180, 178, 'раствор') + lbl(270, 92, 'уровень', 'start') + lbl(270, 106, 'падает', 'start') };
        }
      },
      dwc: {
        still() {
          let g = wall(110, 64, 140, 124, 'box') + water(114, 84, 132, 100);
          [140, 180, 220].forEach((x, i) => { g += roots(x, 76, 88, 8, 3 + i, 0.32); });
          g += `<rect x="104" y="58" width="152" height="9" rx="3" fill="${F('box-d')}"/>`;
          [140, 180, 220].forEach((x, i) => { g += hcup(x, 59, 22, 18, { fill: 'clay' }) + plant(x, 55, 30, 6 + i); });
          g += `<rect x="168" y="178" width="24" height="6" rx="3" fill="${F('frame-d')}"/>`;
          g += pipe('M180 180V176Q180 172 184 172H236Q242 172 242 166V50Q242 40 252 40H282');
          g += `<rect x="282" y="30" width="44" height="22" rx="5" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1.4"/><circle cx="294" cy="41" r="3.2" fill="${F('frame-d')}"/><path d="M302 36h16M302 41h16M302 46h16" stroke="${F('frame-d')}" stroke-width="1"/>`;
          g += `<path d="M276 58H336" stroke="${F('wood-d')}" stroke-width="3" stroke-linecap="round"/>`;
          return g;
        },
        move(t) {
          let g = bubbles(180, 176, 88, 30, t, 16, 1);
          g += flow('M128 92Q120 140 132 176', t, 10, 1.6) + flow('M232 92Q240 140 228 176', t, 10, 1.6);
          return { svg: g, labels: lbl(304, 74, 'компрессор') + lbl(180, 196, 'распылитель') };
        }
      },
      wick: {
        still() {
          let g = wall(110, 140, 140, 48, 'box') + water(114, 152, 132, 32);
          g += `<path d="M126 74H234L224 136H136Z" fill="${F('plastic-hi')}"/>`;
          g += `<path d="M130 78H230L221 133H139Z" fill="${F('soil')}"/>`;
          for (let i = 0; i < 22; i++) g += `<circle cx="${q(138 + (i * 41) % 84)}" cy="${q(84 + (i * 17) % 46)}" r="1.3" fill="${F('perlite')}"/>`;
          g += roots(180, 82, 40, 7, 9, 0.9) + plant(180, 76, 40, 3);
          g += `<path d="M170 134C166 152 160 170 156 182M190 134C194 152 200 170 204 182" stroke="${F('kraft-d')}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
          return g;
        },
        move(t) {
          let g = '';
          [[170, 134, 156, 182], [190, 134, 204, 182]].forEach(([x0, y0, x1, y1], k) => {
            for (let i = 0; i < 4; i++) { const u = (t * 0.25 + i / 4 + k * 0.12) % 1, y = y1 - (y1 - y0) * u, x = x1 + (x0 - x1) * u; g += `<circle cx="${q(x)}" cy="${q(y)}" r="2" fill="${F('water-c')}" stroke="${F('glass-d')}" stroke-width=".7"/>`; }
          });
          return { svg: g, labels: lbl(118, 166, 'запас', 'end') + lbl(220, 160, 'фитиль', 'start') };
        }
      },
      ebb: {
        still() {
          let g = wall(110, 150, 140, 38, 'box');
          g += `<path d="M90 104H270V126H90Z" fill="${F('plastic')}"/><path d="M96 126V150M264 126V150" stroke="${F('plastic')}" stroke-width="4"/>`;
          g += pipe('M130 172V116') + pipe('M236 118V160');
          return g;
        },
        move(t) {
          const u = (t % 12) / 12, st = u < 0.25 ? 'fill' : u < 0.42 ? 'hold' : u < 0.67 ? 'drain' : 'dry';
          const lv = st === 'fill' ? u / 0.25 : st === 'hold' ? 1 : st === 'drain' ? 1 - (u - 0.42) / 0.25 : 0;
          let g = water(94, 124 - lv * 16, 172, lv * 16) + water(114, 158 + lv * 14, 132, 26 - lv * 14);
          [150, 196, 242].forEach((x, i) => { g += `<path d="M${x - 14} 92H${x + 14}L${x + 10} 124H${x - 10}Z" fill="${F('pot')}" opacity=".95"/>` + roots(x, 104, 16, 5, 4 + i, 0.8) + plant(x, 92, 30, 5 + i); });
          g += pump(130, 184) + arrowUp(130, 130, st === 'fill') + `<path d="M236 152l-4 -6h8z" fill="${F('dark')}" opacity="${st === 'drain' ? 0.85 : 0.15}"/>`;
          g += `<g transform="translate(300 60)"><circle r="12" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1.4"/><path d="M0 -7V0L${q(Math.cos(u * Math.PI * 2 - Math.PI / 2) * 7)} ${q(Math.sin(u * Math.PI * 2 - Math.PI / 2) * 7)}" stroke="${F('dark')}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
          const word = { fill: 'прилив', hold: 'затоплено', drain: 'отлив', dry: 'корни дышат' }[st];
          return { svg: g, labels: lbl(300, 90, 'таймер') + lbl(180, 144, word) };
        }
      },
      nft: {
        still() {
          let g = wall(130, 150, 120, 38, 'box') + water(134, 160, 112, 24);
          g += `<path d="M58 88L300 104L300 118L58 102Z" fill="${F('plastic')}"/>`;
          g += pump(160, 184) + pipe('M160 172V128Q160 120 152 120H64Q56 120 56 112V96') + pipe('M298 112Q306 112 306 122V136Q306 144 298 144H246');
          return g;
        },
        move(t) {
          let g = `<path d="M60 99.5L298 115.3L298 117L60 101.2Z" fill="${F('water-c')}"/>`;
          [110, 180, 250].forEach((x, i) => {
            const y = 88 + (x - 58) / 242 * 16;
            g += `<path d="M${x - 9} ${q(y - 1)}C${x + 6} ${q(y + 11)} ${x + 26} ${q(y + 12)} ${x + 40} ${q(y + 14)}" stroke="${F('root')}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
            g += hcup(x, y - 3, 20, 12) + plant(x, y - 7, 28, 2 + i);
          });
          g += flow('M62 100.5L296 116', t, 18, 1.6);
          for (let i = 0; i < 2; i++) { const v = (t * 0.9 + i / 2) % 1; g += drop(246, 146 + v * 10); }
          return { svg: g, labels: lbl(290, 136, 'уклон 1–3 %', 'end') + lbl(120, 136, 'плёнка раствора') };
        }
      },
      drip: {
        still() {
          let g = wall(250, 136, 90, 52, 'box') + water(254, 150, 82, 34);
          g += `<path d="M70 150H226V160H70Z" fill="${F('plastic')}"/>`;
          [110, 186].forEach((x, i) => {
            g += `<path d="M${x - 26} 98H${x + 26}L${x + 20} 150H${x - 20}Z" fill="${F('pot')}"/><path d="M${x - 23} 102H${x + 23}L${x + 18} 146H${x - 18}Z" fill="${F('kraft')}"/>`;
            g += roots(x, 106, 34, 7, 3 + i, 0.9) + plant(x, 100, 44, 7 + i);
          });
          g += pump(270, 184) + pipe('M270 172V52Q270 44 262 44H94Q86 44 86 52V60') + pipe('M162 52V60');
          g += pipe('M226 156H246');
          return g;
        },
        move(t) {
          let g = '';
          [[86, 0], [162, 0.5]].forEach(([x, ph]) => {
            g += `<rect x="${x - 3}" y="58" width="6" height="8" rx="2" fill="${F('grip')}"/>`;
            const v = (t * 0.7 + ph) % 1; if (v < 0.75) g += drop(x, 70 + v / 0.75 * 26);
          });
          g += flow('M226 156H246', t, 10, 1.4);
          return { svg: g, labels: lbl(60, 34, 'капельницы', 'start') + lbl(208, 176, 'сток в бак') };
        }
      }
    };

    const show = k => {
      sys = k;
      set(el, 'lab-hs-air', HS[k].air);
      set(el, 'lab-hs-pow', HS[k].pow);
      set(el, 'lab-hs-out', HS[k].out);
      set(el, 'lab-hs-who', HS[k].who);
      ch.redraw();
    };
    const paint = () => {
      if (!dyn) return;
      const m = SC[sys].move(T);
      dyn.innerHTML = `<g transform="translate(${q(OX)} ${q(OY)}) scale(${q(K)})">${m.svg}</g>${m.labels}`;
    };
    const ch = h.chart($('#lab-hs-ch', el), {
      label: 'Разрез гидропонной системы: ёмкость, раствор, корни и движение воды',
      h: w => Math.round(clamp(w * 0.56, 220, 330)),
      draw(w, hh) {
        K = Math.min(w / VW, (hh - 4) / VH);
        OX = (w - VW * K) / 2; OY = (hh - VH * K) / 2;
        const fy = q(OY + 188 * K);
        return `<rect data-bg width="${w}" height="${hh}" rx="14" fill="${F('bg')}"/><path data-bg d="M0 ${fy}H${w}V${hh - 14}Q${w} ${hh} ${w - 14} ${hh}H14Q0 ${hh} 0 ${hh - 14}Z" fill="${F('bg-2')}"/>` +
          `<g transform="translate(${q(OX)} ${q(OY)}) scale(${q(K)})">${SC[sys].still()}</g><g class="hs-dyn"></g>`;
      }
    });
    const grab = () => { dyn = $('.hs-dyn', ch.svg); paint(); };
    // the chart draws itself anew when it changes width: the moving layer is found again
    new MutationObserver(grab).observe(ch.svg, { childList: true });
    const loop = S.loop(ts => { T = ts / 1000; paint(); loop.next(); });
    h.bindPick(el, 'lab-hs-sys', show);
    show('kratky');
    if (h.reduce.matches) { T = 5; grab(); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) loop.start(); else loop.stop(); }).observe(el);
    else loop.start();
  });
