  register('osmos', el => {
    el.innerHTML = h.head('Клетка корня и почвенный раствор', 'Базовая подкормка даёт раствор около 1,2 мС/см. Когда грунт сохнет, соли остаются, а воды меньше.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.segHtml('lab-osm-d', 'Доза', [['0.5', '½'], ['1', 'Норма'], ['2', '×2'], ['4', '×4']], '1')}${h.segHtml('lab-osm-s', 'Грунт', [['1', 'Влажный'], ['3', 'Подсох'], ['8', 'Сухой']], '1')}</div>
        <div class="lab-stage"><svg class="osm-svg" id="lab-osm-svg" viewBox="0 0 320 200" role="img" aria-label="Клетка корня в почвенном растворе"></svg></div>
      </div>` + h.readHtml([['EC у корня', 'lab-osm-ec'], ['Потенциал раствора', 'lab-osm-psi'], ['Клеточный сок', 'lab-osm-root'], ['Вода', 'lab-osm-dir', 'is-wide']]);
    let dose = 1, dry = 1;
    const svg = $('#lab-osm-svg', el);
    const ions = Array.from({ length: 90 }, (_, i) => [((i * 53) % 97) / 97 * 300 + 10, ((i * 29) % 89) / 89 * 180 + 10, i % 2]);
    const upd = () => {
      const ec = 1.2 * dose * dry, psi = -0.036 * ec, root = -0.7;
      const turg = clamp((psi + 1.25) / 0.6, 0.62, 1);
      const inflow = psi > root + 0.12 ? 'in' : psi > root - 0.05 ? 'stop' : 'out';
      const nIons = Math.round(clamp(8 + ec * 2.2, 8, 90));
      let s = '<rect class="osm-soil" x="0" y="0" width="320" height="200" rx="16"/>';
      ions.slice(0, nIons).forEach(([x, y, k]) => { if (Math.hypot((x - 160) / 90, (y - 100) / 60) > 1.08) s += `<circle class="${k ? 'osm-ion-a' : 'osm-ion-b'}" cx="${r1(x)}" cy="${r1(y)}" r="3"/>`; });
      s += `<ellipse class="osm-wall" cx="160" cy="100" rx="86" ry="56"/>`;
      s += `<ellipse class="osm-vac" cx="160" cy="100" rx="${r1(74 * turg)}" ry="${r1(46 * turg)}"/>`;
      s += `<circle class="osm-nuc" cx="${r1(160 - 40 * turg)}" cy="96" r="9"/>`;
      const arrows = inflow === 'stop' ? '' : [[30, 100, 68, 100], [290, 100, 252, 100], [160, 20, 160, 40], [160, 180, 160, 160]].map(([x1, y1, x2, y2]) => {
        const [a, b, c, d] = inflow === 'in' ? [x1, y1, x2, y2] : [x2, y2, x1, y1];
        return `<line class="osm-flow" x1="${a}" y1="${b}" x2="${c}" y2="${d}" marker-end="url(#lab-osm-ah)"/>`;
      }).join('');
      s = `<defs><marker id="lab-osm-ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="osm-ah"/></marker></defs>` + s + `<g class="osm-flows is-${inflow}">${arrows}</g>`;
      svg.innerHTML = s;
      set(el, 'lab-osm-ec', `${fmt(ec)} мС/см`);
      set(el, 'lab-osm-psi', `${fmt(psi, 2)} МПа`);
      set(el, 'lab-osm-root', `${fmt(root, 1)} МПа`);
      set(el, 'lab-osm-dir', inflow === 'in' ? 'Входит в корень: раствор слабее клеточного сока.' : inflow === 'stop' ? 'Почти не входит: раствор сравнялся с соком клетки, корень «пьёт» с трудом.' : 'Уходит из корня: клетка теряет тургор, кончики корней обгорают.');
    };
    h.bindPick(el, 'lab-osm-d', v => { dose = +v; upd(); });
    h.bindPick(el, 'lab-osm-s', v => { dry = +v; upd(); });
    upd();
  });
