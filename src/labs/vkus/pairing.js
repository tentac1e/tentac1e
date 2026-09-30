  register('pairing', el => {
    const left = Object.keys(h.MOLS).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
    el.innerHTML = `${h.chipsHtml('lab-pa-c', 'Продукт', h.PAIRS.map(p => [p.id, p.name]), 'tomato')}
      <div class="lab-grid pair-grid"><div class="lab-chart" id="lab-pa-ch"></div><div class="pair-info" id="lab-pa-info" aria-live="polite"></div></div>`;
    let cur = h.PAIRS[0];
    const ch = h.chart($('#lab-pa-ch', el), {
      label: 'Общие ароматические молекулы базилика и выбранного продукта',
      h: () => left.length * 30 + 30,
      draw(w, hh) {
        const lx = Math.min(150, w * 0.42), rx = w - 16, ry = hh / 2;
        let s = `<text class="axis-lbl" x="4" y="14">молекулы базилика</text>`;
        left.forEach((k, i) => {
          const y = 34 + i * 30;
          const hit = cur.mols.includes(k), kin = (cur.kin || []).includes(k);
          const fam = h.FAM[h.MOLS[k].fam].cls;
          if (hit || kin) s += `<path class="pair-link ${fam}${kin ? ' is-kin' : ''}" d="M${lx + 10} ${y} C ${r1(lx + (rx - lx) * 0.5)} ${y} ${r1(lx + (rx - lx) * 0.45)} ${r1(ry)} ${r1(rx - 60)} ${r1(ry)}"/>`;
          s += `<circle class="pair-dot ${fam}${hit || kin ? ' is-hot' : ''}" cx="${lx}" cy="${y}" r="6"/>`;
          s += `<text class="pair-name${hit || kin ? ' is-hot' : ''}" x="${lx - 12}" y="${y + 4}" text-anchor="end">${h.MOLS[k].name.replace(/^\(Z\)-3-/, '')}</text>`;
        });
        const none = !cur.mols.length && !(cur.kin || []).length;
        s += `<g class="pair-node${none ? ' is-contrast' : ''}"><circle cx="${r1(rx - 44)}" cy="${r1(ry)}" r="40"/><text x="${r1(rx - 44)}" y="${r1(ry + (cur.name.length > 10 ? -2 : 4))}" text-anchor="middle">${esc(cur.name.split(/[ ,]/)[0])}</text>${cur.name.length > 10 ? `<text x="${r1(rx - 44)}" y="${r1(ry + 13)}" text-anchor="middle" class="pair-node-s">${esc(cur.name.split(/[ ,]+/).slice(1).join(' '))}</text>` : ''}</g>`;
        if (none) s += `<text class="band-lbl" x="${r1(rx - 44)}" y="${r1(ry + 60)}" text-anchor="middle">контраст</text>`;
        return s;
      }
    });
    const info = () => {
      const shared = cur.mols.map(h.molName);
      $('#lab-pa-info', el).innerHTML = `<p class="lab-kicker">${shared.length ? 'Общие молекулы' : (cur.kin ? 'Родство ароматов' : 'Принцип контраста')}</p>
        <h5>Базилик + ${cur.name.toLowerCase()}</h5>
        ${shared.length ? `<p class="pair-mols">${cur.mols.map(k => `<span><i class="fam-dot ${h.FAM[h.molFam(k)].cls}"></i>${h.molName(k)}</span>`).join('')}</p>` : ''}
        <p>${h.nb(cur.why)}</p>
        <dl class="data-rows"><div><dt>Какой сорт</dt><dd>${cur.variety}</dd></div><div><dt>Попробуйте</dt><dd>${cur.dish}</dd></div></dl>`;
    };
    h.bindPick(el, 'lab-pa-c', id => { cur = h.PAIRS.find(p => p.id === id); ch.redraw(); info(); });
    info();
  });
