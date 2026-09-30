  register('perched', el => {
    const SUBS = [['peat', 'Торф', 5], ['univ', 'Универсальный', 4], ['perl', 'С перлитом', 2.2], ['coco', 'Кокос', 3.5]];
    el.innerHTML = h.head('Где стоит вода в горшке', 'Высота насыщенного слоя задаётся порами грунта. Меняйте горшок, грунт и слой керамзита.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-per-h', 'Высота горшка', 8, 30, 1, 14)}<div class="lab-seg-wrap"><span class="lab-label">Грунт</span>${h.chipsHtml('lab-per-s', 'Грунт', SUBS.map(s => [s[0], s[1]]), 'univ')}</div>
          <div class="lab-seg-wrap"><span class="lab-label">Дренаж</span><div class="chips-row lab-chips"><button class="chip" type="button" id="lab-per-d" aria-pressed="false">Слой керамзита 3&nbsp;см</button></div></div>
        </div>
        <div class="lab-chart" id="lab-per-ch"></div>
      </div>` +
      h.readHtml([['Насыщенный слой', 'lab-per-z'], ['Доля грунта без воздуха', 'lab-per-p'], ['Воздушная зона', 'lab-per-a']]);
    let H = 14, sub = 'univ', drain = false;
    const pwt = () => SUBS.find(s => s[0] === sub)[2];
    const ch = h.chart($('#lab-per-ch', el), {
      label: 'Разрез горшка с насыщенным водой слоем',
      h: w => clamp(w * 0.66, 260, 400),
      draw(w, hh) {
        const sc = Math.min((hh - 34) / 31, (w - 150) / 22);
        const cx = r1((w - 110) / 2), base = hh - 16;
        const topW = 18 * sc, botW = 13 * sc, ph = H * sc;
        const xAt = (y, side) => cx + side * lerp(botW, topW, y / H) / 2;
        const Y = v => r1(base - v * sc);
        const poly = (y0, y1) => `${r1(xAt(y0, -1))},${Y(y0)} ${r1(xAt(y0, 1))},${Y(y0)} ${r1(xAt(y1, 1))},${Y(y1)} ${r1(xAt(y1, -1))},${Y(y1)}`;
        const d = drain ? Math.min(3, H - 2) : 0;
        const sat = Math.min(pwt(), H - d);
        let s = `<polygon class="per-soil" points="${poly(d, H - 0.6)}"/>`;
        if (drain) {
          s += `<polygon class="per-drain" points="${poly(0, d)}"/>`;
          for (let i = 0; i < 26; i++) {
            const yy = 0.3 + (i % 3) * (d - 0.6) / 2.2, xx = lerp(-0.42, 0.42, ((i * 37) % 26) / 25);
            s += `<circle class="per-pebble" cx="${r1(cx + xx * lerp(botW, topW, yy / H))}" cy="${Y(yy)}" r="${r1(sc * 0.42)}"/>`;
          }
        }
        s += `<polygon class="per-water" points="${poly(d, d + sat)}"/>`;
        s += `<path class="per-wave" d="M${r1(xAt(d + sat, -1))} ${Y(d + sat)} q ${r1(sc * 1.5)} -4 ${r1(sc * 3)} 0 t ${r1(sc * 3)} 0 t ${r1(sc * 3)} 0 t ${r1(sc * 3)} 0 t ${r1(sc * 3)} 0"/>`;
        s += `<polygon class="per-pot" points="${poly(0, H)}"/>`;
        s += `<rect class="per-rim" x="${r1(cx - topW / 2 - 6)}" y="${r1(Y(H) - 6)}" width="${r1(topW + 12)}" height="10" rx="3"/>`;
        const lx = r1(cx + topW / 2 + 16);
        const lab = (y, txt, cls) => `<line class="per-lead" x1="${r1(xAt(y, 1) + 4)}" x2="${lx - 4}" y1="${Y(y)}" y2="${Y(y)}"/><text class="tick ${cls || ''}" x="${lx}" y="${Y(y) + 4}">${txt}</text>`;
        s += lab(d + sat + (H - 0.6 - d - sat) / 2, 'воздух и вода');
        s += lab(d + sat / 2, `вода ${fmt(sat)} см`, 'is-water');
        if (drain) s += lab(d / 2, 'керамзит сухой');
        s += `<text class="tick" x="${r1(cx)}" y="${hh - 2}" text-anchor="middle">${H} см</text>`;
        return s;
      }
    });
    const upd = () => {
      const d = drain ? Math.min(3, H - 2) : 0;
      const soil = H - 0.6 - d;
      const sat = Math.min(pwt(), soil);
      set(el, 'lab-per-z', `${fmt(sat)} см${drain ? ', поднят на 3 см' : ''}`);
      set(el, 'lab-per-p', pct(sat / soil));
      set(el, 'lab-per-a', `верхние ${fmt(Math.max(0, soil - sat))} см`);
      ch.redraw();
    };
    h.bindRange(el, 'lab-per-h', v => `${v} см`, v => { H = v; upd(); });
    h.bindPick(el, 'lab-per-s', v => { sub = v; upd(); });
    const db = $('#lab-per-d', el);
    db.addEventListener('click', () => { drain = !drain; db.setAttribute('aria-pressed', String(drain)); upd(); });
    upd();
  });
