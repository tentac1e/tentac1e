  register('window', el => {
    el.innerHTML = h.head('Солнце в полдень', 'Выберите город и месяц. Разрез показывает, как полуденные лучи входят в окно, выходящее на юг.') +
      `<div class="lab-controls">${citiesChips('lab-win-city', 55.8)}${h.rangeHtml('lab-win-m', 'Месяц', 1, 12, 1, 12)}</div>
       <div class="lab-chart" id="lab-win-ch"></div>` +
      h.readHtml([['Высота солнца', 'lab-win-h'], ['Длина дня', 'lab-win-d'], ['Поток на горизонталь', 'lab-win-e'], ['Пятно света на полу', 'lab-win-p']]);
    let lat = 55.8, m = 12;
    const ch = h.chart($('#lab-win-ch', el), {
      label: 'Разрез окна с полуденными лучами солнца',
      h: w => clamp(w * 0.46, 220, 300),
      draw(w, hh) {
        const n = h.DOY21[m - 1];
        const alt = h.noonSun(lat, n);
        const floorY = hh - 26, wallX = Math.round(w * 0.3);
        const sc = Math.min((w - wallX - 16) / 4.2, (floorY - 14) / 3);
        const X = v => r1(wallX + v * sc), Y = v => r1(floorY - v * sc);
        let s = `<rect class="win-room" x="${wallX}" y="${Y(3)}" width="${r1(4.2 * sc)}" height="${r1(3 * sc)}"/>`;
        if (alt > 0) {
          const t = Math.tan(alt * Math.PI / 180);
          const a = 0.85 / t, b = 2.2 / t;
          s += `<clipPath id="lab-win-clip"><rect x="${wallX}" y="${Y(3)}" width="${r1(4.2 * sc)}" height="${r1(3 * sc)}"/></clipPath>`;
          s += `<polygon class="win-light" clip-path="url(#lab-win-clip)" points="${wallX},${Y(2.2)} ${wallX},${Y(0.85)} ${X(a)},${floorY} ${X(b)},${floorY}"/>`;
          const rad = alt * Math.PI / 180;
          for (let k = 0; k < 5; k++) {
            const y0 = 0.95 + k * 0.3;
            const len = Math.min(wallX / Math.max(Math.cos(rad), 1e-3), Y(y0) / Math.max(Math.sin(rad), 1e-3));
            s += `<line class="win-ray" x1="${r1(wallX - Math.cos(rad) * len)}" y1="${r1(Y(y0) - Math.sin(rad) * len)}" x2="${wallX}" y2="${Y(y0)}"/>`;
          }
          const sx = clamp(wallX - Math.cos(rad) * wallX * 0.72, 18, wallX - 20), sy = clamp(Y(1.5) - Math.tan(rad) * (wallX - sx), 18, floorY - 18);
          s += `<circle class="win-sun" cx="${r1(sx)}" cy="${r1(sy)}" r="13"/>`;
          const tag = `${fmt0(alt)}°`, tw = tag.length * 7 + 12;
          s += `<rect class="win-tag" x="${r1(sx - tw / 2)}" y="${r1(sy + 18)}" width="${r1(tw)}" height="17" rx="8.5"/><text class="tick" x="${r1(sx)}" y="${r1(sy + 30)}" text-anchor="middle">${tag}</text>`;
        } else {
          s += `<text class="band-lbl" x="${r1(wallX / 2)}" y="${Y(1.6)}" text-anchor="middle">солнце</text><text class="band-lbl" x="${r1(wallX / 2)}" y="${Y(1.6) + 15}" text-anchor="middle">не встаёт</text>`;
        }
        s += `<rect class="win-wall" x="${wallX - 10}" y="${Y(3)}" width="10" height="${r1(0.8 * sc)}"/>`;
        s += `<rect class="win-wall" x="${wallX - 10}" y="${Y(0.85)}" width="10" height="${r1(0.85 * sc)}"/>`;
        s += `<rect class="win-glass" x="${wallX - 6}" y="${Y(2.2)}" width="3" height="${r1(1.35 * sc)}"/>`;
        s += `<rect class="win-sill" x="${wallX - 12}" y="${Y(0.85) - 4}" width="${r1(0.32 * sc + 12)}" height="5" rx="2"/>`;
        const px = X(0.16), py = Y(0.85) - 4, ps = sc * 0.1;
        s += `<path class="win-pot" d="M${r1(px - ps)} ${r1(py - ps * 1.2)} L${r1(px + ps)} ${r1(py - ps * 1.2)} L${r1(px + ps * 0.75)} ${py} L${r1(px - ps * 0.75)} ${py} Z"/>`;
        s += `<path class="win-leaf" d="M${px} ${r1(py - ps * 1.2)} q ${r1(-ps * 1.4)} ${r1(-ps * 0.8)} ${r1(-ps * 0.5)} ${r1(-ps * 2.4)} q ${r1(ps * 1.6)} ${r1(ps * 0.7)} ${r1(ps * 0.5)} ${r1(ps * 2.4)} q ${r1(ps * 0.2)} ${r1(-ps * 1.8)} ${r1(ps * 1.3)} ${r1(-ps * 2)} q ${r1(ps * 0.2)} ${r1(ps * 1.6)} ${r1(-ps * 1.3)} ${r1(ps * 2)} Z"/>`;
        s += `<line class="axis" x1="${wallX - 12}" x2="${X(4.2)}" y1="${floorY}" y2="${floorY}"/>`;
        [1, 2, 3, 4].forEach(v => { s += `<text class="tick" x="${X(v)}" y="${floorY + 16}" text-anchor="middle">${v} м</text>`; });
        return s;
      }
    });
    const upd = () => {
      const n = h.DOY21[m - 1];
      const alt = h.noonSun(lat, n);
      set(el, 'lab-win-h', alt > 0 ? `${fmt0(alt)}°` : 'ниже горизонта');
      set(el, 'lab-win-d', `${fmt(h.dayLength(lat, n))} ч`);
      set(el, 'lab-win-e', alt > 0 ? `${fmt0(Math.sin(alt * Math.PI / 180) * 100)} % от солнца в зените` : '0');
      if (alt <= 0) set(el, 'lab-win-p', 'нет');
      else {
        const t = Math.tan(alt * Math.PI / 180);
        const a = 0.85 / t, b = 2.2 / t;
        set(el, 'lab-win-p', a > 4.2 ? 'лучи уходят дальше 4 м' : `${fmt(a)}–${b > 4.2 ? '4+' : fmt(b)} м от стены`);
      }
      ch.redraw();
    };
    h.bindPick(el, 'lab-win-city', v => { lat = +v; upd(); });
    h.bindRange(el, 'lab-win-m', v => `21 ${MONTHS_GEN[v - 1]}`, v => { m = v; upd(); });
    upd();
  });
