  register('ec', el => {
    el.innerHTML = h.head('EC, ppm и осмос', 'Переведите показания кондуктометра в шкалы TDS-метров и посмотрите, куда попадает раствор.') +
      `<div class="lab-controls">${h.rangeHtml('lab-ec-v', 'EC раствора', 0, 3, 0.05, 1.2)}</div>
       <div class="lab-chart ec-chart" id="lab-ec-ch"></div>` +
      h.readHtml([['Шкала 500', 'lab-ec-500'], ['Шкала 700', 'lab-ec-700'], ['Осмотический потенциал', 'lab-ec-psi']]);
    const ZONES = [[0.4, 0.8, 'сеянцы', ''], [1, 1.6, 'рост и срезки', ''], [1.8, 3, 'риск ожога', 'is-bad']];
    let v = 1.2;
    const ch = h.chart($('#lab-ec-ch', el), {
      label: 'Шкала электропроводности раствора с зонами для базилика',
      h: () => 118,
      draw(w) {
        const l = 14, r = w - 14, X = x => r1(l + (r - l) * x / 3), top = 50, bh = 22;
        let s = `<rect class="ec-track" x="${l}" y="${top}" width="${r - l}" height="${bh}" rx="11"/>`;
        // zone names sit above their stretch; one that does not fit goes a row higher
        const used = [];
        ZONES.forEach(([a, b, name, cls]) => {
          s += `<rect class="ec-zone ${cls}" x="${X(a)}" y="${top + 3}" width="${r1(X(b) - X(a))}" height="${bh - 6}" rx="8"/>`;
          const tw = name.length * 6.6 + 4, cx = clamp((X(a) + X(b)) / 2, l + tw / 2, r - tw / 2);
          const row = used.some(([x0, x1]) => cx - tw / 2 < x1 + 6 && cx + tw / 2 > x0 - 6) ? 1 : 0;
          used.push([cx - tw / 2, cx + tw / 2]);
          const ly = top - 8 - row * 16;
          s += `<text class="ec-name ${cls}" x="${r1(cx)}" y="${ly}" text-anchor="middle">${name}</text>`;
          if (row) s += `<line class="ec-lead" x1="${r1(cx)}" y1="${ly + 3}" x2="${r1(cx)}" y2="${top + 2}"/>`;
        });
        [0, 0.5, 1, 1.5, 2, 2.5, 3].forEach(t => {
          s += `<line class="ec-tick" x1="${X(t)}" x2="${X(t)}" y1="${top + bh + 2}" y2="${top + bh + (t % 1 ? 5 : 9)}"/>`;
          if (t % 1 === 0) s += `<text class="tick" x="${X(t)}" y="${top + bh + 22}" text-anchor="${t === 0 ? 'start' : t === 3 ? 'end' : 'middle'}">${t === 3 ? '3 мС/см' : t}</text>`;
        });
        const mx = X(v);
        s += `<g class="ec-needle"><line x1="${mx}" x2="${mx}" y1="${top - 4}" y2="${top + bh + 4}"/><circle cx="${mx}" cy="${top + bh / 2}" r="5"/></g>`;
        s += `<text class="ec-val" x="${r1(clamp(mx, l + 34, r - 34))}" y="${top + bh + 40}" text-anchor="middle">${fmt(v, 2)} мС/см · ${fmt0(v * 500)} ppm</text>`;
        return s;
      }
    });
    const upd = x => {
      v = x;
      set(el, 'lab-ec-500', `${fmt0(v * 500)} ppm`);
      set(el, 'lab-ec-700', `${fmt0(v * 700)} ppm`);
      set(el, 'lab-ec-psi', `${fmt(-0.036 * v, 3)} МПа`);
      ch.redraw();
    };
    h.bindRange(el, 'lab-ec-v', x => `${fmt(x, 2)} мС/см`, upd);
    upd(1.2);
  });
