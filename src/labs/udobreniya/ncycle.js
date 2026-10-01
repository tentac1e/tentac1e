  register('ncycle', el => {
    el.innerHTML = h.head('Круговорот азота', 'Точки бегут по стрелкам с той скоростью, с какой работают микробы. Нитрификация ускоряется вдвое на каждые 10 °C и почти стоит в холоде и без кислорода.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-nc-t', 'Температура грунта', 4, 30, 1, 10)}<div class="lab-seg-wrap"><span class="lab-label">Грунт</span><div class="chips-row lab-chips"><button class="chip" type="button" id="lab-nc-w" aria-pressed="false">Переувлажнён</button></div></div></div>
       <div class="lab-chart nc-chart" id="lab-nc-ch"></div>` +
      h.readHtml([['Нитрификация', 'lab-nc-r'], ['Что получает базилик', 'lab-nc-v', 'is-wide']]);
    let T = 10, wet = false;
    // the nodes: title and subtitle; where they stand depends on the width (lay() below)
    const N = {
      org: ['Органика', 'опад, остатки'],
      nh4: ['NH₄⁺', 'аммоний'],
      no2: ['NO₂⁻', 'нитрит'],
      no3: ['NO₃⁻', 'нитрат'],
      root: ['Корни', 'базилика'],
      n2: ['N₂', 'в воздух'],
      leach: ['Вымывание', 'с поливом вглубь']
    };
    const nodeW = k => Math.max(88, N[k][1].length * 6.2 + 18), NH = 44;
    /* every caption stands beside its arrow, never on it; the bacteria sit on plates on their arrows.
       Narrow: the nitrification ladder on the right, organic matter and the roots on the left, the root
       along the left edge. Wide: the ladder runs along the top and turns down to nitrate. */
    function lay(w) {
      const narrow = w < 560;
      const at = narrow
        ? (() => { const L = Math.max(64, 0.205 * w), R = Math.min(0.75 * w, w - 78); return { org: [L, 120], nh4: [R, 120], no2: [R, 250], no3: [R, 380], root: [L, 380], n2: [R, 32], leach: [R, 486] }; })()
        : { org: [0.13 * w, 118], nh4: [0.45 * w, 118], no2: [0.78 * w, 118], no3: [0.78 * w, 262], root: [0.13 * w, 262], n2: [0.93 * w, 34], leach: [0.78 * w, 346] };
      const B = k => { const [x, y] = at[k], hw = nodeW(k) / 2; return { x, y, l: x - hw, r: x + hw, t: y - NH / 2, b: y + NH / 2 }; };
      const E = [];
      const edge = (a, b, key, cls, d, lbl, o = {}) => E.push(Object.assign({ a, b, key, cls, d, lbl }, o));
      const o = B('org'), n4 = B('nh4'), n2 = B('no2'), n3 = B('no3'), rt = B('root'), air = B('n2'), lc = B('leach');
      // organic matter → ammonium: the caption above the arrow, in the strip under the soil surface
      edge('org', 'nh4', 'amm', '', `M${r1(o.r + 4)} ${o.y}H${r1(n4.l - 6)}`, 'аммонификация', { lx: (o.r + n4.l) / 2, ly: o.t - 12, anchor: 'middle' });
      if (narrow) {
        edge('nh4', 'no2', 'nit', 'microbe', `M${r1(n4.x)} ${n4.b + 3}V${n2.t - 6}`, 'Nitrosomonas', { plate: [n4.x, (n4.b + n2.t) / 2], bugs: [n4.x - 22, n4.b + 14] });
        edge('no2', 'no3', 'nit', 'microbe', `M${r1(n2.x)} ${n2.b + 3}V${n3.t - 6}`, 'Nitrobacter', { plate: [n2.x, (n2.b + n3.t) / 2], bugs: [n2.x - 22, n2.b + 14] });
        // both kinds of uptake end in the roots: one caption under the row, where the two arrows meet
        edge('no3', 'root', 'up', '', `M${r1(n3.l - 4)} ${n3.y}H${r1(rt.r + 6)}`, 'поглощение', { lx: (rt.r + n3.l) / 2, ly: n3.b + 15, anchor: 'middle' });
        // ammonium is taken up too: straight across the gap between the columns, the gap kept free of captions
        edge('nh4', 'root', 'up2', '', `M${r1(n4.l + 6)} ${n4.b + 2}L${r1(rt.r - 6)} ${rt.t - 4}`, '');
        edge('root', 'org', 'fall', 'is-dash', `M${r1(rt.x)} ${rt.t - 3}V${o.b + 6}`, 'опад', { lx: rt.x - 9, ly: (o.b + rt.t) / 2 + 4, anchor: 'end' });
        edge('no3', 'leach', 'leach', 'is-loss', `M${r1(n3.x)} ${n3.b + 3}V${lc.t - 6}`, 'полив', { lx: n3.x - 9, ly: (n3.b + lc.t) / 2 + 4, anchor: 'end' });
        // nitrogen gas leaves along the right edge, up into the air
        const gx = n3.r + 13;
        edge('no3', 'n2', 'den', 'is-loss', `M${r1(n3.r + 2)} ${n3.y}H${r1(gx - 8)}Q${r1(gx)} ${n3.y} ${r1(gx)} ${n3.y - 8}V${air.y + 8}Q${r1(gx)} ${air.y} ${r1(gx - 8)} ${air.y}H${r1(air.r + 6)}`, 'денитрификация', { lx: gx + 11, ly: (n3.y + air.y) / 2, anchor: 'middle', rot: -90 });
      } else {
        edge('nh4', 'no2', 'nit', 'microbe', `M${r1(n4.r + 4)} ${n4.y}H${r1(n2.l - 6)}`, 'Nitrosomonas', { plate: [(n4.r + n2.l) / 2, n4.y], bugs: [(n4.r + n2.l) / 2, n4.y - 30] });
        edge('no2', 'no3', 'nit', 'microbe', `M${r1(n2.x)} ${n2.b + 3}V${n3.t - 6}`, 'Nitrobacter', { plate: [n2.x, (n2.b + n3.t) / 2], bugs: [n2.x - 64, (n2.b + n3.t) / 2 + 4] });
        edge('no3', 'root', 'up', '', `M${r1(n3.l - 4)} ${n3.y}H${r1(rt.r + 6)}`, 'поглощение', { lx: (rt.r + n3.l) / 2, ly: n3.y + 20, anchor: 'middle' });
        // the caption starts right of the line over its whole height: the line falls to the left
        const sx = n4.x - 30, sy = n4.b + 2, ex = rt.r + 2, ey = rt.t + 6, ly = (sy + ey) / 2 - 6, xAt = yy => sx + (ex - sx) * (yy - sy) / (ey - sy);
        edge('nh4', 'root', 'up2', '', `M${r1(sx)} ${r1(sy)}L${r1(ex)} ${r1(ey)}`, 'поглощение', { lx: xAt(ly - 12) + 10, ly, anchor: 'start' });
        edge('root', 'org', 'fall', 'is-dash', `M${r1(rt.x)} ${rt.t - 3}V${o.b + 6}`, 'опад', { lx: rt.x + 10, ly: (o.b + rt.t) / 2 + 4, anchor: 'start' });
        edge('no3', 'leach', 'leach', 'is-loss', `M${r1(n3.x)} ${n3.b + 3}V${lc.t - 6}`, 'полив', { lx: n3.x - 10, ly: (n3.b + lc.t) / 2 + 4, anchor: 'end' });
        const gx = air.x;
        edge('no3', 'n2', 'den', 'is-loss', `M${r1(n3.r + 2)} ${n3.y}H${r1(gx - 10)}Q${r1(gx)} ${n3.y} ${r1(gx)} ${n3.y - 10}V${air.b + 6}`, 'денитрификация', { lx: gx + 14, ly: (n3.y + air.b) / 2 + 10, anchor: 'middle', rot: -90 });
      }
      return { narrow, at, B, E };
    }
    const ch = h.chart($('#lab-nc-ch', el), {
      label: 'Схема круговорота азота в грунте',
      h: w => (w < 560 ? 540 : 380),
      draw(w, hh) {
        const rnd = (() => { let s = 9; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
        const { narrow, B, E } = lay(w);
        const q = Math.pow(2, (T - 25) / 10) * (T < 6 ? 0.35 : 1);
        const R = { amm: Math.pow(2, (T - 25) / 10), nit: q * (wet ? 0.15 : 1), up: 0.8, up2: 0.6, fall: 0.25, den: wet ? 0.7 : 0, leach: 0.35 };
        const soil = 64;
        let s = `<defs><marker id="lab-nc-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="nc-ah"/></marker>
          <linearGradient id="lab-nc-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--soil-top)" stop-opacity="${wet ? 0.5 : 0.34}"/><stop offset="1" stop-color="var(--soil)" stop-opacity="${wet ? 0.62 : 0.46}"/></linearGradient></defs>`;
        // air above, soil below with crumbs and, when waterlogged, water filling the pores
        s += `<rect data-bg class="nc-air" x="0" y="0" width="${w}" height="${soil}"/><rect data-bg x="0" y="${soil}" width="${w}" height="${hh - soil}" fill="url(#lab-nc-soil)"/>`;
        s += `<path data-bg class="nc-surface" d="M0 ${soil}${Array.from({ length: Math.ceil(w / 24) + 1 }, (_, i) => `L${i * 24} ${r1(soil + Math.sin(i * 1.7) * 2.2)}`).join('')}"/>`;
        let crumbs = '';
        for (let i = 0; i < w * hh / 2600; i++) crumbs += `<circle cx="${r1(rnd() * w)}" cy="${r1(soil + 8 + rnd() * (hh - soil - 12))}" r="${r1(1.2 + rnd() * 2.6)}"/>`;
        s += `<g class="nc-crumbs" data-bg>${crumbs}</g>`;
        if (wet) s += `<rect data-bg class="nc-water" x="0" y="${soil + 18}" width="${w}" height="${hh - soil - 18}"/>`;
        // the zone names next to the seedling, the root running down the left edge into the roots' box
        const rx = narrow ? 9 : Math.max(14, B('root').l - 34), rb = B('root');
        s += `<text class="nc-zone" x="${rx + 16}" y="20">воздух</text><text class="nc-zone" x="${rx + 16}" y="${soil + 20}">грунт</text>`;
        s += `<path class="nc-root-draw" d="M${r1(rx)} ${soil}V${r1(rb.y - 16)}Q${r1(rx)} ${r1(rb.y)} ${r1(rb.l - 2)} ${r1(rb.y)}M${r1(rb.x - 14)} ${r1(rb.b + 1)}C${r1(rb.x - 20)} ${r1(rb.b + 24)} ${r1(rb.x - 34)} ${r1(rb.b + 32)} ${r1(rb.x - 46)} ${r1(rb.b + 46)}M${r1(rb.x + 10)} ${r1(rb.b + 1)}C${r1(rb.x + 14)} ${r1(rb.b + 22)} ${r1(rb.x + 26)} ${r1(rb.b + 32)} ${r1(rb.x + 38)} ${r1(rb.b + 42)}"/>`;
        s += `<path class="nc-stem" d="M${r1(rx)} ${soil}V${soil - 26}M${r1(rx)} ${soil - 14}q-6 -4 -8 -14M${r1(rx)} ${soil - 20}q10 -3 14 -12"/>`;
        let labels = '';
        E.forEach((e, i) => {
          const rate = R[e.key], off = rate < 0.02;
          s += `<path class="nc-edge ${e.cls}${off ? ' is-off' : ''}" d="${e.d}" marker-end="url(#lab-nc-ah)"/>`;
          if (!off && !h.reduce.matches) s += `<path class="nc-flow ${e.cls}" d="${e.d}" style="--spd:${r1(clamp(2.2 / rate, 1.2, 40))}s;--dl:-${r1(i * 0.37)}s"/>`;
          if (e.plate) {
            // the bacteria doing the work: little rods beside their name, the name on a plate on the arrow
            const [px, py] = e.plate, tw = e.lbl.length * 6.6 + 16;
            if (e.bugs) labels += `<g class="nc-bugs${off ? ' is-off' : ''}">${[[-12, 0, 20], [0, -5, -30], [12, 1, 60]].map(([ox, oy, a2]) => `<rect x="${r1(e.bugs[0] + ox - 5)}" y="${r1(e.bugs[1] + oy - 2.2)}" width="10" height="4.4" rx="2.2" transform="rotate(${a2} ${r1(e.bugs[0] + ox)} ${r1(e.bugs[1] + oy)})"/>`).join('')}</g>`;
            labels += `<g class="nc-plate${off ? ' is-off' : ''}" data-fit="8"><rect x="${r1(px - tw / 2)}" y="${r1(py - 10)}" width="${r1(tw)}" height="20" rx="10"/><text class="nc-lbl is-bug" x="${r1(px)}" y="${r1(py + 4)}" text-anchor="middle">${e.lbl}</text></g>`;
          } else if (e.lbl) {
            labels += `<text class="nc-lbl${off ? ' is-off' : ''}" x="${r1(e.lx)}" y="${r1(e.ly)}" text-anchor="${e.anchor}"${e.rot ? ` transform="rotate(${e.rot} ${r1(e.lx)} ${r1(e.ly)})"` : ''}>${e.lbl}</text>`;
          }
        });
        s += labels;
        Object.keys(N).forEach(k => {
          const b = B(k), [t, sub2] = N[k];
          s += `<g class="nc-node nc-${k}"><rect x="${r1(b.l)}" y="${b.t}" width="${r1(b.r - b.l)}" height="${NH}" rx="14"/><text class="nc-t" x="${r1(b.x)}" y="${b.y - 3}" text-anchor="middle">${t}</text><text class="nc-s" x="${r1(b.x)}" y="${b.y + 13}" text-anchor="middle">${sub2}</text></g>`;
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
