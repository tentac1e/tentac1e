  /* @use agro */
  const { svp, VPD_Z, zoneOf } = agro;

  register('vpd', el => {
    el.innerHTML = h.head('VPD: воздух глазами листа', 'Дефицит давления пара для листа той же температуры, что воздух. Двигайте ползунки или ведите по карте.') +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-vpd-t', 'Температура воздуха', 10, 38, 0.5, 24)}${h.rangeHtml('lab-vpd-rh', 'Влажность', 20, 95, 1, 45)}
          <ul class="vpd-legend">${VPD_Z.map((z, i) => `<li><i class="${z[1]}"></i>${z[2]} <small>${i === 0 ? '< 0,4' : i === 4 ? '> 1,6' : `${fmt(VPD_Z[i - 1][0])}–${fmt(z[0])}`}</small></li>`).join('')}</ul>
        </div>
        <div class="lab-chart" id="lab-vpd-ch"></div>
      </div>` + h.readHtml([['VPD', 'lab-vpd-v'], ['Зона', 'lab-vpd-z'], ['Потенциал воды в воздухе', 'lab-vpd-psi'], ['Что происходит', 'lab-vpd-note', 'is-wide']]);
    let T = 24, RH = 45;
    const PAD = { l: 40, r: 12, t: 22, b: 36 };
    const ch = h.chart($('#lab-vpd-ch', el), {
      label: 'Карта дефицита давления пара по температуре и влажности',
      h: w => clamp(w * 0.66, 240, 340),
      draw(w, hh) {
        const P = h.plot({ w, h: hh, pad: PAD, x: [10, 38], y: [20, 95], xticks: [10, 15, 20, 25, 30, 35], yticks: [20, 40, 60, 80, 95], fx: v => v + '°', fy: v => v + '%', ylab: 'влажность', xlab: 'температура, °C' });
        const bound = v => { const a = []; for (let t = 10; t <= 38.001; t += 0.5) a.push([t, clamp(100 * (1 - v / svp(t)), 20, 95)]); return a; };
        const lines = [null, ...VPD_Z.slice(0, 4).map(z => bound(z[0])), null];
        let cells = '';
        VPD_Z.forEach((z, i) => {
          const top = lines[i] || bound(0).map(([t]) => [t, 95]);
          const bot = lines[i + 1] || bound(0).map(([t]) => [t, 20]);
          const pts = top.map(([t, r]) => `${P.X(t)},${P.Y(r)}`).concat(bot.slice().reverse().map(([t, r]) => `${P.X(t)},${P.Y(r)}`));
          cells += `<polygon class="${z[1]}" points="${pts.join(' ')}"/>`;
        });
        VPD_Z.slice(0, 4).forEach(z => { cells += `<path class="vpd-iso" d="${bound(z[0]).map(([t, r], i) => `${i ? 'L' : 'M'}${P.X(t)} ${P.Y(r)}`).join(' ')}"/>`; });
        return `<g class="vpd-map">${cells}</g>` + P.s.replace(/<line class="grid"[^>]*>/g, '') +
          `<circle class="vpd-dot" cx="${P.X(T)}" cy="${P.Y(RH)}" r="9"/><circle class="vpd-dot-in" cx="${P.X(T)}" cy="${P.Y(RH)}" r="3.5"/>`;
      },
      onPointer(x, y, w, hh, kind) {
        if (kind !== 'set') return;
        const P = h.plot({ w, h: hh, pad: PAD, x: [10, 38], y: [20, 95] });
        tr.set(clamp(Math.round(P.inv(x) * 2) / 2, 10, 38));
        rr.set(clamp(Math.round(P.invY(y)), 20, 95));
      }
    });
    const upd = () => {
      const es = svp(T), v = es * (1 - RH / 100), z = zoneOf(v);
      const psi = 8.314 * (T + 273.15) / 18.05e-6 * Math.log(RH / 100) / 1e6;
      set(el, 'lab-vpd-v', `${fmt(v, 2)} кПа`);
      set(el, 'lab-vpd-z', `<span class="zone-pill ${z[1]}">${z[2]}</span>`);
      set(el, 'lab-vpd-psi', `${fmt0(psi)} МПа`);
      set(el, 'lab-vpd-note', h.nb(`Давление насыщенного пара ${fmt(es, 2)} кПа: ${z[3]}.`));
      ch.redraw();
    };
    const tr = h.bindRange(el, 'lab-vpd-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    const rr = h.bindRange(el, 'lab-vpd-rh', v => `${v} %`, v => { RH = v; upd(); });
    upd();
  });
