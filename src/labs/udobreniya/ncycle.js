  register('ncycle', el => {
    el.innerHTML = h.head('Круговорот азота', 'Точки бегут по стрелкам с той скоростью, с какой работают микробы. Нитрификация ускоряется вдвое на каждые 10 °C и почти стоит в холоде и без кислорода.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-nc-t', 'Температура грунта', 4, 30, 1, 10)}<div class="lab-seg-wrap"><span class="lab-label">Грунт</span><div class="chips-row lab-chips"><button class="chip" type="button" id="lab-nc-w" aria-pressed="false">Переувлажнён</button></div></div></div>
       <div class="lab-chart nc-chart" id="lab-nc-ch"></div>` +
      h.readHtml([['Нитрификация', 'lab-nc-r'], ['Что получает базилик', 'lab-nc-v', 'is-wide']]);
    let T = 10, wet = false;
    // node: [x share, y px] for a wide and a narrow screen, title, subtitle
    const N = {
      org: [[0.15, 118], [0.24, 116], 'Органика', 'опад, остатки'],
      nh4: [[0.47, 118], [0.62, 116], 'NH₄⁺', 'аммоний'],
      no2: [[0.8, 176], [0.62, 256], 'NO₂⁻', 'нитрит'],
      no3: [[0.62, 282], [0.62, 396], 'NO₃⁻', 'нитрат'],
      root: [[0.25, 262], [0.24, 396], 'Корни', 'базилика'],
      n2: [[0.93, 34], [0.85, 32], 'N₂', 'в воздух'],
      leach: [[0.42, 352], [0.62, 500], 'Вымывание', 'с поливом вглубь']
    };
    // edges; the last item places the caption on a narrow screen: [x share, y, anchor] (wide screens: at the curve)
    const E = [
      ['org', 'nh4', 'аммонификация', 'amm', '', [0.43, 80, 'middle']],
      ['nh4', 'no2', 'Nitrosomonas', 'nit', 'microbe', [0.585, 190, 'end']],
      ['no2', 'no3', 'Nitrobacter', 'nit', 'microbe', [0.585, 330, 'end']],
      ['no3', 'root', 'поглощение', 'up', '', [0.43, 438, 'middle']],
      ['nh4', 'root', 'поглощение', 'up2', '', [0.34, 292, 'middle']],
      ['root', 'org', 'опад', 'fall', 'is-dash', [0.28, 256, 'start']],
      ['no3', 'n2', 'денитрификация', 'den', 'is-loss', null],
      ['no3', 'leach', 'полив', 'leach', 'is-loss', [0.66, 452, 'start']]
    ];
    const ch = h.chart($('#lab-nc-ch', el), {
      label: 'Схема круговорота азота в грунте',
      h: w => (w < 560 ? 540 : 380),
      draw(w, hh) {
        const narrow = w < 560, L = narrow ? 1 : 0, rnd = (() => { let s = 9; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
        const P = k => [N[k][L][0] * w, N[k][L][1]];
        const q = Math.pow(2, (T - 25) / 10) * (T < 6 ? 0.35 : 1);
        const R = { amm: Math.pow(2, (T - 25) / 10), nit: q * (wet ? 0.15 : 1), up: 0.8, up2: 0.6, fall: 0.25, den: wet ? 0.7 : 0, leach: 0.35 };
        const soil = 64;
        let s = `<defs><marker id="lab-nc-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="nc-ah"/></marker>
          <linearGradient id="lab-nc-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--soil-top)" stop-opacity="${wet ? 0.5 : 0.34}"/><stop offset="1" stop-color="var(--soil)" stop-opacity="${wet ? 0.62 : 0.46}"/></linearGradient></defs>`;
        // air above, soil below with crumbs and, when waterlogged, water filling the pores
        s += `<rect class="nc-air" x="0" y="0" width="${w}" height="${soil}"/><rect x="0" y="${soil}" width="${w}" height="${hh - soil}" fill="url(#lab-nc-soil)"/>`;
        s += `<path class="nc-surface" d="M0 ${soil}${Array.from({ length: Math.ceil(w / 24) + 1 }, (_, i) => `L${i * 24} ${r1(soil + Math.sin(i * 1.7) * 2.2)}`).join('')}"/>`;
        let crumbs = '';
        for (let i = 0; i < w * hh / 2600; i++) crumbs += `<circle cx="${r1(rnd() * w)}" cy="${r1(soil + 8 + rnd() * (hh - soil - 12))}" r="${r1(1.2 + rnd() * 2.6)}"/>`;
        s += `<g class="nc-crumbs">${crumbs}</g>`;
        if (wet) s += `<rect class="nc-water" x="0" y="${soil + 18}" width="${w}" height="${hh - soil - 18}"/>`;
        s += `<text class="nc-zone" x="10" y="20">воздух</text><text class="nc-zone" x="10" y="${soil + 20}">грунт</text>`;
        // a root reaching in from the surface
        const [rx0, ry] = P('root'), rx = narrow ? w * 0.09 : rx0;
        s += `<path class="nc-root-draw" d="M${r1(rx)} ${soil}C${r1(rx - 6)} ${r1(soil + 60)} ${r1(rx0 + 6)} ${r1(ry - 80)} ${r1(rx0)} ${r1(ry - 26)}M${r1(rx0 - 2)} ${r1(ry + 22)}C${r1(rx0 - 10)} ${r1(ry + 48)} ${r1(rx0 - 26)} ${r1(ry + 56)} ${r1(rx0 - 40)} ${r1(ry + 72)}M${r1(rx0 + 2)} ${r1(ry + 22)}C${r1(rx0 + 8)} ${r1(ry + 46)} ${r1(rx0 + 22)} ${r1(ry + 58)} ${r1(rx0 + 34)} ${r1(ry + 68)}"/>`;
        s += `<path class="nc-stem" d="M${r1(rx)} ${soil}V${soil - 26}M${r1(rx)} ${soil - 14}q-12 -4 -16 -14M${r1(rx)} ${soil - 20}q10 -3 14 -12"/>`;
        E.forEach(([a, b, lbl, key, cls, spot], i) => {
          const [x1, y1] = P(a), [x2, y2] = P(b);
          const rate = R[key], off = rate < 0.02;
          let d, lx, ly, anchor = 'middle', rot = 0;
          if (key === 'den') {
            // nitrogen gas leaves along the right edge, up into the air
            const sx = x1 + 46, xr = x2, top = y2 + 22;
            d = `M${r1(sx)} ${r1(y1)}H${r1(xr - 14)}Q${r1(xr)} ${r1(y1)} ${r1(xr)} ${r1(y1 - 14)}V${r1(top)}`;
            lx = xr + (narrow ? 13 : 14); ly = (y1 + top) / 2; rot = -90;
          } else {
            const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
            const sx = x1 + ux * 46, sy = y1 + uy * 26, ex = x2 - ux * 48, ey = y2 - uy * 28;
            const bend = a === 'nh4' && b === 'root' ? -22 : narrow && Math.abs(dx) < 8 ? 0 : 16;
            const mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend;
            d = `M${r1(sx)} ${r1(sy)}Q${r1(mx)} ${r1(my)} ${r1(ex)} ${r1(ey)}`;
            lx = (sx + 2 * mx + ex) / 4; ly = (sy + 2 * my + ey) / 4 + 4;
            if (narrow && spot) { lx = spot[0] * w; ly = spot[1]; anchor = spot[2]; }
          }
          s += `<path class="nc-edge ${cls}${off ? ' is-off' : ''}" d="${d}" marker-end="url(#lab-nc-ah)"/>`;
          if (!off && !h.reduce.matches) s += `<path class="nc-flow ${cls}" d="${d}" style="--spd:${r1(clamp(2.2 / rate, 1.2, 40))}s;--dl:-${r1(i * 0.37)}s"/>`;
          if (cls === 'microbe') {
            // the bacteria doing the work: little rods next to their name
            const bx = anchor === 'end' ? lx - 44 : lx;
            s += `<g class="nc-bugs${off ? ' is-off' : ''}">${[[-18, -16, 20], [-6, -22, -30], [8, -15, 60]].map(([ox, oy, a2]) => `<rect x="${r1(bx + ox - 5)}" y="${r1(ly + oy - 6)}" width="10" height="4.4" rx="2.2" transform="rotate(${a2} ${r1(bx + ox)} ${r1(ly + oy - 4)})"/>`).join('')}</g>`;
          }
          s += `<text class="nc-lbl${off ? ' is-off' : ''}${cls === 'microbe' ? ' is-bug' : ''}" x="${r1(lx)}" y="${r1(ly)}" text-anchor="${anchor}"${rot ? ` transform="rotate(${rot} ${r1(lx)} ${r1(ly)})"` : ''}>${lbl}</text>`;
        });
        Object.keys(N).forEach(k => {
          const [x, y] = P(k), [, , t, sub2] = N[k];
          const nw = Math.max(88, sub2.length * 6.2 + 18);
          const bx = clamp(x - nw / 2, 4, w - nw - 4);
          s += `<g class="nc-node nc-${k}"><rect x="${r1(bx)}" y="${y - 24}" width="${r1(nw)}" height="44" rx="14"/><text class="nc-t" x="${r1(bx + nw / 2)}" y="${y - 3}" text-anchor="middle">${t}</text><text class="nc-s" x="${r1(bx + nw / 2)}" y="${y + 13}" text-anchor="middle">${sub2}</text></g>`;
        });
        return s;
      }
    });
    const upd = () => {
      const q = Math.pow(2, (T - 25) / 10) * (T < 6 ? 0.35 : 1), nit = q * (wet ? 0.15 : 1);
      ch.redraw();
      set(el, 'lab-nc-r', pct(Math.min(1, nit)) + ' от скорости при 25 °C');
      set(el, 'lab-nc-v', wet ? 'Без кислорода нитрификация стоит, а нитрат уходит в воздух: азотное голодание при мокром грунте.' : T < 10 ? 'Холодно: органика почти не разлагается. Если нужна подкормка — минеральная, с нитратным азотом.' : T < 18 ? 'Микробы работают вполсилы: органика даёт азот медленно.' : 'Тепло и воздух: органика превращается в нитрат быстро, базилику хватает азота.');
    };
    h.bindRange(el, 'lab-nc-t', v => `${v} °C`, v => { T = v; upd(); });
    const wb = $('#lab-nc-w', el);
    wb.addEventListener('click', () => { wet = !wet; wb.setAttribute('aria-pressed', String(wet)); upd(); });
    upd();
  });
