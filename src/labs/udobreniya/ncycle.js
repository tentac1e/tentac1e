  register('ncycle', el => {
    el.innerHTML = h.head('Круговорот азота', 'Точки бегут по стрелкам с той скоростью, с какой работают микробы. Нитрификация ускоряется вдвое на каждые 10 °C и почти стоит в холоде и без кислорода.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-nc-t', 'Температура грунта', 4, 30, 1, 10)}<div class="lab-seg-wrap"><span class="lab-label">Грунт</span><div class="chips-row lab-chips"><button class="chip" type="button" id="lab-nc-w" aria-pressed="false">Переувлажнён</button></div></div></div>
       <div class="lab-scroll"><svg class="nc-svg" id="lab-nc-svg" viewBox="0 0 700 340" role="img" aria-label="Схема круговорота азота в грунте"></svg></div>` +
      h.readHtml([['Нитрификация', 'lab-nc-r'], ['Что получает базилик', 'lab-nc-v', 'is-wide']]);
    let T = 10, wet = false;
    const svg = $('#lab-nc-svg', el);
    const N = { org: [100, 70, 'Органика', 'белки, остатки'], nh4: [350, 50, 'NH₄⁺', 'аммоний'], no2: [590, 110, 'NO₂⁻', 'нитрит'], no3: [480, 240, 'NO₃⁻', 'нитрат'], root: [150, 235, 'Корни', 'базилика'], n2: [636, 300, 'N₂', 'в воздух'], leach: [330, 312, 'вымывание', ''] };
    const upd = () => {
      const q = Math.pow(2, (T - 25) / 10) * (T < 6 ? 0.35 : 1);
      const nit = q * (wet ? 0.15 : 1);
      const amm = Math.pow(2, (T - 25) / 10);
      const E = [
        ['org', 'nh4', 'аммонификация', amm, ''], ['nh4', 'no2', 'Nitrosomonas', nit, ''], ['no2', 'no3', 'Nitrobacter', nit, ''],
        ['no3', 'root', 'поглощение', 0.8, ''], ['nh4', 'root', 'поглощение', 0.6, ''], ['root', 'org', 'опад, остатки', 0.25, 'is-dash'],
        ['no3', 'n2', 'денитрификация', wet ? 0.7 : 0, 'is-loss'], ['no3', 'leach', 'полив', 0.35, 'is-loss']
      ];
      let s = `<defs><marker id="lab-nc-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="nc-ah"/></marker></defs>`;
      E.forEach(([a, b, lbl, rate, cls], i) => {
        const [x1, y1] = N[a], [x2, y2] = N[b];
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
        const ux = dx / L, uy = dy / L;
        const sx = x1 + ux * 44, sy = y1 + uy * 26, ex = x2 - ux * 46, ey = y2 - uy * 28;
        const mx = (sx + ex) / 2 - uy * 16, my = (sy + ey) / 2 + ux * 16;
        const d = `M${r1(sx)} ${r1(sy)} Q ${r1(mx)} ${r1(my)} ${r1(ex)} ${r1(ey)}`;
        const off = rate < 0.02;
        s += `<path class="nc-edge ${cls}${off ? ' is-off' : ''}" d="${d}" marker-end="url(#lab-nc-ah)"/>`;
        if (!off && !h.reduce.matches) s += `<path class="nc-flow ${cls}" d="${d}" style="--spd:${r1(clamp(2.2 / rate, 1.2, 40))}s;--dl:-${i * 0.37}s"/>`;
        s += `<text class="nc-lbl${off ? ' is-off' : ''}" x="${r1(mx)}" y="${r1(my - 4)}" text-anchor="middle">${lbl}</text>`;
      });
      Object.entries(N).forEach(([k, [x, y, t, sub2]]) => {
        s += `<g class="nc-node nc-${k}"><rect x="${x - 44}" y="${y - 24}" width="88" height="${sub2 ? 44 : 30}" rx="14"/><text class="nc-t" x="${x}" y="${y - 3}" text-anchor="middle">${t}</text>${sub2 ? `<text class="nc-s" x="${x}" y="${y + 13}" text-anchor="middle">${sub2}</text>` : ''}</g>`;
      });
      svg.innerHTML = s;
      set(el, 'lab-nc-r', pct(Math.min(1, nit)) + ' от скорости при 25 °C');
      set(el, 'lab-nc-v', wet ? 'Без кислорода нитрификация стоит, а нитрат уходит в воздух: азотное голодание при мокром грунте.' : T < 10 ? 'Холодно: органика почти не разлагается. Если нужна подкормка — минеральная, с нитратным азотом.' : T < 18 ? 'Микробы работают вполсилы: органика даёт азот медленно.' : 'Тепло и воздух: органика превращается в нитрат быстро, базилику хватает азота.');
    };
    h.bindRange(el, 'lab-nc-t', v => `${v} °C`, v => { T = v; upd(); });
    const wb = $('#lab-nc-w', el);
    wb.addEventListener('click', () => { wet = !wet; wb.setAttribute('aria-pressed', String(wet)); upd(); });
    upd();
  });
