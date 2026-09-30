/* Гид по базилику — живые модели главы «Посадка». Файл собирает scripts/build.py из src/labs/posadka/ — правьте там */
(() => {
  'use strict';
  const { register, illustrate, api: h } = window.BasilScience;
  const S = window.BasilScene;
  const { $, $$, clamp, lerp, fmt, fmt0, esc } = h;
  const NS = 'http://www.w3.org/2000/svg';
  const r1 = v => Math.round(v * 10) / 10;
  const pct = v => `${fmt0(v * 100)} %`;
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const set = (root, id, html) => { const e = $('#' + id, root); if (e) e.innerHTML = html; };
  const doyToday = () => { const t = new Date(); return Math.round((t - new Date(t.getFullYear(), 0, 0)) / 864e5); };
  const doyLabel = n => { const d = new Date(2023, 0, n); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
  const citiesChips = (id, lat) => h.chipsHtml(id, 'Город', h.CITIES.map(([l, n]) => [l, n]), lat);

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
          s += `<text class="tick" x="${r1(sx)}" y="${r1(sy + 30)}" text-anchor="middle">${fmt0(alt)}°</text>`;
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

  register('germ', el => {
    const Tb = 10.5, To = 30, Tc = 42, th = 52;
    const days = T => (T <= Tb || T >= Tc) ? Infinity : T <= To ? th / (T - Tb) : th / ((To - Tb) * (Tc - T) / (Tc - To));
    el.innerHTML = h.head('Сколько ждать всходов', 'Модель термального времени: семени нужно набрать около 52 градусо-дней выше базовых 10,5 °C. Выше 30 °C скорость снова падает.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-germ-t', 'Температура грунта', 8, 40, 0.5, 24)}
          <figure class="germ-fig" aria-hidden="true">
            <svg class="germ-anim" id="lab-germ-anim" viewBox="0 0 200 130">
              <rect class="germ-soil" x="0" y="72" width="200" height="58"/>
              <g class="germ-seed" transform="translate(100 96)">
                <circle class="germ-gel" r="20"/>
                <path class="germ-root" d="M4 4 C 8 16 2 26 6 34"/>
                <path class="germ-hypo" d="M-2 -4 C -6 -18 4 -30 0 -44"/>
                <g class="germ-coty" transform="translate(0 -44)"><ellipse cx="-9" cy="-3" rx="9" ry="4.5" transform="rotate(-18 -9 -3)"/><ellipse cx="9" cy="-3" rx="9" ry="4.5" transform="rotate(18 9 -3)"/></g>
                <ellipse class="germ-coat" rx="7" ry="4.4"/>
              </g>
            </svg>
            <figcaption class="germ-phase" id="lab-germ-phase"></figcaption>
          </figure>
        </div>
        <div class="lab-chart" id="lab-germ-ch"></div>
      </div>` +
      h.readHtml([['Корешок проклюнется', 'lab-germ-r'], ['Всходы над землёй', 'lab-germ-e'], ['Скорость от максимума', 'lab-germ-v']]);
    let T = 24, hover = null;
    const pts = f => { const a = []; for (let t = 11; t <= 41.5; t += 0.25) { const d = f(t); if (d <= 30) a.push([t, d]); } return a; };
    const ch = h.chart($('#lab-germ-ch', el), {
      label: 'Дни до прорастания в зависимости от температуры',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [8, 40], y: [0, 30], xticks: [10, 15, 20, 25, 30, 35, 40], yticks: [0, 10, 20, 30], fx: v => v + '°', ylab: 'дней', xlab: 'температура грунта, °C',
          vbands: [{ x0: 22, x1: 25, cls: 'is-good', label: 'совет гида' }],
          series: [{ pts: pts(t => days(t) * 1.8), cls: 's3', dash: true, label: 'всходы', labelAt: 16, ldy: -10 }, { pts: pts(days), cls: 's1', label: 'корешок', labelAt: 14.5, ldy: 16 }],
          marker: isFinite(days(T)) && days(T) <= 30 ? { x: T, dots: [{ y: days(T), cls: 's1' }].concat(days(T) * 1.8 <= 30 ? [{ y: days(T) * 1.8, cls: 's3' }] : []) } : { x: T },
          hover: hover });
        let s = P.s;
        if (hover != null) {
          const d = days(hover);
          s += h.tip(P.X(hover), P.p.t + 4, w, [`${fmt(hover)} °C`, isFinite(d) ? `корешок ${fmt(d)} дн.` : 'не прорастёт', isFinite(d) ? `всходы ${fmt(d * 1.8)} дн.` : '']);
        }
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [8, 40], y: [0, 30] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 8, 40);
        if (kind === 'set') { rng.set(v); hover = null; } else if (kind === 'hover') hover = v; else hover = null;
        ch.redraw();
      }
    });
    const anim = $('#lab-germ-anim', el);
    const upd = () => {
      const d = days(T);
      const ok = isFinite(d) && d < 60;
      set(el, 'lab-germ-r', ok ? `через ${fmt(d)} дн.` : 'не прорастёт');
      set(el, 'lab-germ-e', ok ? `через ${fmt(d * 1.8)} дн.` : '—');
      set(el, 'lab-germ-v', ok ? pct((th / 19.5) / d) : '0');
      anim.classList.toggle('is-stopped', !ok || h.reduce.matches);
      anim.style.setProperty('--dur', `${clamp(ok ? d * 0.9 : 6, 2.6, 14)}s`);
      set(el, 'lab-germ-phase', !ok ? (T <= Tb ? 'Слишком холодно: ферменты почти стоят, семя лежит сухим.' : 'Слишком жарко: белки зародыша повреждаются.') : 'Набухание → пробуждение ферментов → корешок → петля стебелька и семядоли');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-germ-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    upd();
  });

  register('shade', el => {
    el.innerHTML = h.head('Тень соседей', 'Чем больше сеянцев в горшке, тем меньше красного и больше дальнего красного света доходит до каждого. Модель показывает реакцию одного сеянца.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-shade-n', 'Сеянцев в горшке', 1, 30, 1, 20)}
          <div class="rfr" aria-hidden="true"><span class="rfr-r">красный 660&nbsp;нм</span><i id="lab-shade-bar"></i><span class="rfr-fr">дальний красный 730&nbsp;нм</span></div>
        </div>
        <div class="lab-stage shade-stage"><svg class="lab-plant" viewBox="-130 -290 260 310" aria-label="Сеянец базилика среди соседей" role="img"><g id="lab-shade-ghosts" class="ghosts"></g><line class="soil-line" x1="-130" x2="130" y1="2" y2="2"/><g id="lab-shade-g"></g></svg></div>
      </div>` +
      h.readHtml([['Отношение R:FR', 'lab-shade-r'], ['Длина стебля', 'lab-shade-s'], ['Размер листьев', 'lab-shade-l']]);
    const g = $('#lab-shade-g', el), ghosts = $('#lab-shade-ghosts', el);
    const spec = st => S.basil({ nodes: 5, scale: 1.25, stretch: st, w: 5.5 });
    const plant = S.Plant(g, spec(1), { grown: true, leafScale: 0.62, sway: 0.7 });
    const pos = Array.from({ length: 16 }, (_, i) => ((i * 97) % 31) / 31 * 220 - 110);
    const upd = n => {
      const rfr = 0.2 + 1.0 * Math.exp(-(n - 1) / 8);
      const st = 1 + 1.3 * (1 - (rfr - 0.2) / 1.0);
      plant.setSpec(spec(st));
      const k = Math.min(n - 1, 16);
      let s = '';
      for (let i = 0; i < k; i++) {
        const x = r1(pos[i]), hgt = r1((70 + (i % 5) * 16) * st * 0.95);
        if (Math.abs(x) < 16) continue;
        s += `<path d="M${x} 2 C ${r1(x + 4)} ${r1(-hgt * 0.4)} ${r1(x - 3)} ${r1(-hgt * 0.7)} ${r1(x + 2)} ${-hgt}"/><ellipse cx="${r1(x - 9)}" cy="${r1(-hgt * 0.62)}" rx="11" ry="5"/><ellipse cx="${r1(x + 10)}" cy="${r1(-hgt * 0.8)}" rx="10" ry="4.5"/>`;
      }
      ghosts.innerHTML = s;
      set(el, 'lab-shade-r', fmt(rfr, 2));
      set(el, 'lab-shade-s', `× ${fmt(st)}`);
      set(el, 'lab-shade-l', `−${fmt0((1 - 1 / Math.pow(st, 0.35)) * 100)} %`);
      $('#lab-shade-bar', el).style.setProperty('--p', `${clamp((rfr - 0.2) / 1.0, 0, 1) * 100}%`);
    };
    h.bindRange(el, 'lab-shade-n', v => String(v), upd);
    upd(20);
  });

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
})();
