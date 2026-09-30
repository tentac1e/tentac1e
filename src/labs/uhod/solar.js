  register('solar', el => {
    el.innerHTML = h.head('Солнечная энергия по месяцам', 'Суточная сумма на горизонтальную поверхность у верхней границы атмосферы, в процентах от лучшего месяца. Облака уменьшают её ещё сильнее.') +
      `<div class="lab-controls">${citiesChips('lab-sol-city', 55.8)}</div>
       <div class="lab-chart" id="lab-sol-ch"></div>` +
      h.readHtml([['Июнь к декабрю', 'lab-sol-r'], ['Солнце в полдень 21 декабря', 'lab-sol-a'], ['День 21 декабря', 'lab-sol-d']]);
    let lat = 55.8;
    const cur = new Date().getMonth();
    const ch = h.chart($('#lab-sol-ch', el), {
      label: 'Относительная солнечная энергия по месяцам',
      draw(w, hh) {
        const vals = h.DOY21.map(n => h.h0(lat, n));
        const mx = Math.max(...vals);
        const P = h.plot({ w, h: hh, x: [0, 12], y: [0, 105], yticks: [0, 25, 50, 75, 100], fy: v => v + '%' });
        let s = P.s;
        const bw = P.iw / 12 - 6;
        vals.forEach((v, i) => {
          const p = v / mx * 100;
          const x = P.X(i) + 3;
          s += `<path class="vbar ${i === cur ? 's1' : 'is-muted'}" d="M${r1(x)} ${P.Y(0)} V${r1(P.Y(p) + 4)} q0 -4 4 -4 H${r1(x + bw - 4)} q4 0 4 4 V${P.Y(0)} Z"/>`;
          if (w > 440 || i % 2 === 0) s += `<text class="tick" x="${r1(x + bw / 2)}" y="${hh - 18}" text-anchor="middle">${MONTHS[i]}</text>`;
          if (i === 5 || i === 11 || i === cur) s += `<text class="bar-lbl" x="${r1(x + bw / 2)}" y="${r1(P.Y(p) - 6)}" text-anchor="middle">${fmt0(p)}%</text>`;
        });
        return s;
      }
    });
    const upd = () => {
      const jun = h.h0(lat, 172), dec = h.h0(lat, 355);
      set(el, 'lab-sol-r', dec > 0.05 ? `в ${fmt(jun / dec)} раза больше` : 'в декабре солнца нет');
      const a = h.noonSun(lat, 355);
      set(el, 'lab-sol-a', a > 0 ? `${fmt(a)}° над горизонтом` : 'не поднимается');
      set(el, 'lab-sol-d', `${fmt(h.dayLength(lat, 355))} ч`);
      ch.redraw();
    };
    h.bindPick(el, 'lab-sol-city', v => { lat = +v; upd(); });
    upd();
  });
