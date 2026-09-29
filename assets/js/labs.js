/* Гид по базилику — живые модели для разворотов «Глубже» и главы «Вкус» */
(() => {
  'use strict';
  const { register, api: h } = window.BasilScience;
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

  /* ================================================================== */
  /* ПОСАДКА                                                             */
  /* ================================================================== */
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
          const len = Math.max(w, hh);
          for (let k = 0; k < 5; k++) {
            const y0 = 0.95 + k * 0.3;
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

  /* ================================================================== */
  /* КАЛЕНДАРЬ                                                           */
  /* ================================================================== */
  register('daylen', el => {
    el.innerHTML = h.head('Длина дня за год', 'Астрономический расчёт с поправкой на рефракцию. Коснитесь графика, чтобы увидеть любой день.') +
      `<div class="lab-controls">${citiesChips('lab-dl-city', 55.8)}${h.rangeHtml('lab-dl-lat', 'Широта', 40, 70, 0.1, 55.8)}</div>
       <div class="lab-chart" id="lab-dl-ch"></div>` +
      h.readHtml([['Сегодня', 'lab-dl-t'], ['Самый длинный день', 'lab-dl-max'], ['Самый короткий', 'lab-dl-min']]);
    let lat = 55.8, hover = null;
    const today = doyToday();
    const series = () => { const a = []; for (let n = 1; n <= 365; n += 2) a.push([n, h.dayLength(lat, n)]); return a; };
    const MSTART = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
    const ch = h.chart($('#lab-dl-ch', el), {
      label: 'Длина дня по дням года',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [1, 365], y: [0, 24], xticks: w > 520 ? MSTART.map(v => v + 14) : [15, 105, 196, 288], fx: v => MONTHS[MSTART.findIndex(s => s + 14 === v)] || MONTHS[Math.floor((v - 1) / 30.5)], yticks: [0, 6, 12, 18, 24], ylab: 'часов',
          hbands: [{ y0: 14, y1: 16, cls: 'is-good', label: 'нужно под лампой' }],
          series: [{ pts: series(), cls: 's1', area: true }],
          marker: { x: today, dots: [{ y: h.dayLength(lat, today), cls: 's1' }] }, hover });
        let s = P.s + `<text class="tick" x="${P.X(today)}" y="${P.p.t - 8}" text-anchor="middle">сегодня</text>`;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 16, w, [doyLabel(hover), `${fmt(h.dayLength(lat, hover))} ч`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [1, 365], y: [0, 24] });
        hover = kind === 'leave' ? null : clamp(Math.round(P.inv(x)), 1, 365);
        ch.redraw();
      }
    });
    const upd = () => {
      set(el, 'lab-dl-t', `${fmt(h.dayLength(lat, today))} ч`);
      set(el, 'lab-dl-max', `${fmt(h.dayLength(lat, 172))} ч`);
      set(el, 'lab-dl-min', `${fmt(h.dayLength(lat, 355))} ч`);
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-dl-lat', v => `${fmt(v)}° с. ш.`, v => { lat = v; city.set(''); upd(); });
    const city = h.bindPick(el, 'lab-dl-city', v => { lat = +v; rng.input.value = v; $('#lab-dl-lat-v', el).textContent = `${fmt(+v)}° с. ш.`; upd(); });
    upd();
  });

  register('gdd', el => {
    el.innerHTML = h.head('Сколько ждать урожая', 'Базовая температура 10 °C; при 22 °C первая срезка — примерно через 7 недель. Выше 30 °C модель прибавки не даёт.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-gdd-t', 'Средняя температура суток', 12, 32, 0.5, 17)}</div>
       <div class="gdd-bars" id="lab-gdd-bars"></div>` +
      h.readHtml([['Градусо-дней в сутки', 'lab-gdd-d'], ['До первой срезки', 'lab-gdd-w'], ['По сравнению с 22 °C', 'lab-gdd-r']]);
    const weeks = T => T <= 10.5 ? Infinity : 588 / (7 * (Math.min(T, 30) - 10));
    const upd = T => {
      const wk = weeks(T), ref = weeks(22);
      const max = 20;
      $('#lab-gdd-bars', el).innerHTML = [['Ваше лето', wk, 's1'], ['Эталон, 22 °C', ref, 's3']].map(([n, v, c]) =>
        `<div class="gdd-row"><span>${n}</span><i class="${c}" style="--w:${clamp(v / max, 0.02, 1) * 100}%"></i><b>${isFinite(v) ? fmt(v) + ' нед.' : '—'}</b></div>`).join('');
      set(el, 'lab-gdd-d', fmt(Math.max(0, Math.min(T, 30) - 10)));
      set(el, 'lab-gdd-w', isFinite(wk) ? `≈ ${fmt(wk)} нед.` : 'рост стоит');
      set(el, 'lab-gdd-r', isFinite(wk) ? (wk > ref ? `в ${fmt(wk / ref)} раза медленнее` : `в ${fmt(ref / wk)} раза быстрее`) : '—');
    };
    h.bindRange(el, 'lab-gdd-t', v => `${fmt(v)} °C`, upd);
    upd(17);
  });

  /* ================================================================== */
  /* УХОД                                                                */
  /* ================================================================== */
  const gauss = (x, mu, sg, a) => a * Math.exp(-0.5 * Math.pow((x - mu) / sg, 2));
  const normed = f => { let m = 0; for (let x = 400; x <= 700; x++) m = Math.max(m, f(x)); return x => f(x) / m; };
  const CHLA = normed(x => gauss(x, 430, 14, 1) + gauss(x, 410, 16, 0.42) + gauss(x, 662, 11, 0.78) + gauss(x, 615, 18, 0.14) + gauss(x, 580, 30, 0.04));
  const CHLB = normed(x => gauss(x, 453, 13, 1) + gauss(x, 472, 12, 0.32) + gauss(x, 642, 11, 0.56) + gauss(x, 595, 24, 0.07));
  const CAR = normed(x => gauss(x, 424, 11, 0.62) + gauss(x, 449, 13, 1) + gauss(x, 478, 12, 0.86));
  const planck = (l, T) => { const lm = l * 1e-9; return 1 / (Math.pow(lm, 5) * (Math.exp(1.4388e-2 / (lm * T)) - 1)); };
  const LAMPS = {
    sun: x => planck(x, 5800) / planck(500, 5800),
    led: x => gauss(x, 450, 10, 0.62) + gauss(x, 600, 58, 0.95),
    fito: x => gauss(x, 450, 10, 0.75) + gauss(x, 660, 11, 1),
    none: () => 0
  };
  function wl2rgb(l) {
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
    const f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 680 ? 0.3 + 0.7 * (700 - l) / 20 + 0.3 : 1;
    return `rgb(${Math.round(255 * Math.pow(r * Math.min(1, f), 0.8))} ${Math.round(255 * Math.pow(g * Math.min(1, f), 0.8))} ${Math.round(255 * Math.pow(b * Math.min(1, f), 0.8))})`;
  }
  const colorName = l => l < 450 ? 'фиолетово-синий' : l < 490 ? 'синий' : l < 520 ? 'голубовато-зелёный' : l < 565 ? 'зелёный' : l < 590 ? 'жёлтый' : l < 625 ? 'оранжевый' : 'красный';

  register('spectrum', el => {
    el.innerHTML = h.head('Что поглощает лист', 'Спектры поглощения пигментов (схематично, по максимуму) и спектр источника света. Ведите по графику, чтобы увидеть значения.') +
      `<div class="lab-controls">${h.segHtml('lab-sp-l', 'Источник', [['sun', 'Солнце'], ['led', 'Белый LED'], ['fito', 'Красно-синий'], ['none', 'Без лампы']], 'led')}</div>
       <div class="lab-chart" id="lab-sp-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s1"></i>хлорофилл a</li><li><i class="k-s2"></i>хлорофилл b</li><li><i class="k-s3"></i>каротиноиды</li><li><i class="k-lamp"></i>спектр источника</li></ul>`;
    let lamp = 'led', hover = null;
    const P0 = { l: 38, r: 16, t: 22, b: 48 };
    const ch = h.chart($('#lab-sp-ch', el), {
      label: 'Спектры поглощения хлорофиллов и каротиноидов от 400 до 700 нанометров',
      draw(w, hh) {
        const pts = f => { const a = []; for (let x = 400; x <= 700; x += 2) a.push([x, f(x)]); return a; };
        const lampPts = pts(LAMPS[lamp]);
        const mx = Math.max(...lampPts.map(p => p[1])) || 1;
        const P = h.plot({ w, h: hh, pad: P0, x: [400, 700], y: [0, 1.08], xticks: [400, 450, 500, 550, 600, 650, 700], yticks: [0, 0.5, 1], fy: v => v === 0 ? '0' : v === 1 ? 'макс' : '', xlab: 'длина волны, нм',
          series: [{ pts: lampPts.map(p => [p[0], p[1] / mx]), cls: 'lamp', area: true }, { pts: pts(CAR), cls: 's3', label: 'каротиноиды', labelAt: 500, ldy: -4, anchor: 'start' }, { pts: pts(CHLB), cls: 's2', label: 'хл. b', labelAt: 642, ldy: -8 }, { pts: pts(CHLA), cls: 's1', label: 'хл. a', labelAt: 662, ldy: -8 }],
          hover });
        let s = `<defs><linearGradient id="lab-sp-grad" x1="0" x2="1">${[400, 430, 460, 490, 520, 550, 580, 610, 640, 670, 700].map((l, i) => `<stop offset="${i / 10}" stop-color="${wl2rgb(l)}"/>`).join('')}</linearGradient></defs>`;
        s += P.s + `<rect class="spec-band" x="${P.p.l}" y="${hh - P0.b + 24}" width="${P.iw}" height="8" rx="4" fill="url(#lab-sp-grad)"/>`;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${Math.round(hover)} нм · ${colorName(hover)}`, `хлорофилл a: ${pct(CHLA(hover))}`, `хлорофилл b: ${pct(CHLB(hover))}`, `каротиноиды: ${pct(CAR(hover))}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, pad: P0, x: [400, 700], y: [0, 1] });
        hover = kind === 'leave' ? null : clamp(P.inv(x), 400, 700);
        ch.redraw();
      }
    });
    h.bindPick(el, 'lab-sp-l', v => { lamp = v; ch.redraw(); });
  });

  register('lamp', el => {
    el.innerHTML = h.head('Лампа и расстояние', 'Точечный источник — обратный квадрат; панель 30×30 см — модель светящегося диска. Паспортный PPFD указан на 30 см.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.segHtml('lab-lamp-t', 'Лампа', [['point', 'Точечная'], ['panel', 'Панель 30×30']], 'panel')}${h.rangeHtml('lab-lamp-e', 'PPFD на 30 см', 100, 800, 10, 300)}${h.rangeHtml('lab-lamp-d', 'Расстояние до листьев', 10, 100, 1, 45)}${h.rangeHtml('lab-lamp-hr', 'Часов света', 10, 18, 1, 16)}</div>
        <div class="lab-chart" id="lab-lamp-ch"></div>
      </div>` + h.readHtml([['PPFD у листьев', 'lab-lamp-p'], ['Дневная сумма DLI', 'lab-lamp-dli'], ['Вывод', 'lab-lamp-v', 'is-wide']]);
    let type = 'panel', E30 = 300, d = 45, hrs = 16, hover = null;
    const R = 17;
    const E = (tp, x) => tp === 'point' ? E30 * Math.pow(30 / x, 2) : E30 * (R * R + 900) / (R * R + x * x);
    const ch = h.chart($('#lab-lamp-ch', el), {
      label: 'Освещённость в зависимости от расстояния до лампы',
      draw(w, hh) {
        const pts = tp => { const a = []; for (let x = 10; x <= 100; x += 1) a.push([x, E(tp, x)]); return a; };
        const ymax = Math.max(600, Math.min(1200, Math.ceil(E(type, 20) / 200) * 200));
        const P = h.plot({ w, h: hh, clip: true, x: [10, 100], y: [0, ymax], xticks: [10, 30, 50, 70, 100], yticks: [0, 200, 400, ymax].filter((v, i, a) => a.indexOf(v) === i), fx: v => v + ' см', ylab: 'мкмоль/м²·с',
          hbands: [{ y0: 200, y1: 400, cls: 'is-good', label: 'нужно базилику' }],
          series: [{ pts: pts(type === 'point' ? 'panel' : 'point'), cls: 'is-faint s2', label: type === 'point' ? 'панель' : 'точечная', labelAt: 85, ldy: -8 }, { pts: pts(type), cls: 's1', label: type === 'point' ? 'точечная' : 'панель', labelAt: 70, ldy: -10 }],
          marker: { x: d, dots: [{ y: Math.min(E(type, d), ymax), cls: 's1' }] }, hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${Math.round(hover)} см`, `точечная: ${fmt0(E('point', hover))}`, `панель: ${fmt0(E('panel', hover))}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [10, 100], y: [0, 1] });
        const v = clamp(Math.round(P.inv(x)), 10, 100);
        if (kind === 'set') { hover = null; dist.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const p = E(type, d), dli = p * hrs * 3600 / 1e6;
      set(el, 'lab-lamp-p', `${fmt0(p)} мкмоль/м²·с`);
      set(el, 'lab-lamp-dli', `${fmt(dli)} моль/м²`);
      set(el, 'lab-lamp-v', p > 900 ? 'Слишком близко: возможен ожог и перегрев верхних листьев.' : dli < 8 ? 'Мало света: базилик будет вытягиваться. Опустите лампу или добавьте часы.' : dli < 12 ? 'На грани: расти будет, но медленно и с бледным ароматом.' : dli <= 20 ? 'Хорошо: в диапазоне 12–17 моль/м² за сутки базилик растёт ароматным.' : 'Света с запасом: можно сократить часы или поднять лампу.');
      ch.redraw();
    };
    h.bindPick(el, 'lab-lamp-t', v => { type = v; upd(); });
    h.bindRange(el, 'lab-lamp-e', v => fmt0(v), v => { E30 = v; upd(); });
    const dist = h.bindRange(el, 'lab-lamp-d', v => `${v} см`, v => { d = v; upd(); });
    h.bindRange(el, 'lab-lamp-hr', v => `${v} ч`, v => { hrs = v; upd(); });
    upd();
  });

  const svp = T => 0.6108 * Math.exp(17.27 * T / (T + 237.3));
  const VPD_Z = [[0.4, 'z0', 'Слишком влажно', 'устьица почти не тянут воду, на листьях конденсат — раздолье для ложной мучнистой росы'], [0.8, 'z1', 'Влажно', 'хорошо для рассады и черенков без корней'], [1.2, 'z2', 'Оптимум', 'вода и питание идут к листьям ровно, лист не перегревается'], [1.6, 'z3', 'Сухо', 'растение пьёт много: поливайте чаще, следите за клещом'], [99, 'z4', 'Стресс', 'устьица закрываются, фотосинтез падает, края листьев сохнут']];
  const zoneOf = v => VPD_Z.find(z => v < z[0]);

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

  register('temp', el => {
    const Pt = T => { if (T <= 8 || T >= 42) return 0; return ((42 - T) / 15) * Math.pow((T - 8) / 19, 19 / 15); };
    const Rt = T => 0.16 * Math.pow(2, (T - 20) / 10);
    el.innerHTML = h.head('Фотосинтез, дыхание и прирост', 'Относительная модель: фотосинтез с оптимумом 27 °C, дыхание с Q₁₀ = 2. Прирост — их разница.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-tmp-t', 'Температура', 5, 42, 0.5, 30)}</div>
       <div class="lab-chart" id="lab-tmp-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s1"></i>фотосинтез</li><li><i class="k-s2"></i>прирост</li><li><i class="k-s3"></i>дыхание</li></ul>` +
      h.readHtml([['Фотосинтез', 'lab-tmp-p'], ['Дыхание', 'lab-tmp-r'], ['Прирост', 'lab-tmp-n'], ['Вывод', 'lab-tmp-v', 'is-wide']]);
    let T = 30, hover = null;
    const ch = h.chart($('#lab-tmp-ch', el), {
      label: 'Фотосинтез, дыхание и прирост в зависимости от температуры',
      draw(w, hh) {
        const pts = f => { const a = []; for (let t = 5; t <= 42; t += 0.5) a.push([t, f(t)]); return a; };
        const P = h.plot({ w, h: hh, clip: true, x: [5, 42], y: [-0.6, 1.1], xticks: [5, 10, 15, 20, 25, 30, 35, 40], yticks: [-0.5, 0, 0.5, 1], fx: v => v + '°', fy: v => v === 0 ? '0' : v === 1 ? 'макс' : v > 0 ? '½' : '−½', xlab: 'температура, °C',
          vbands: [{ x0: 20, x1: 28, cls: 'is-good', label: 'оптимум' }],
          series: [{ pts: pts(Pt), cls: 's1', label: 'фотосинтез', labelAt: 16, ldy: -8 }, { pts: pts(t => Pt(t) - Rt(t)), cls: 's2', label: 'прирост', labelAt: 12, ldy: 16 }, { pts: pts(Rt), cls: 's3', label: 'дыхание', labelAt: 38, ldy: -8 }],
          marker: { x: T, dots: [{ y: Pt(T), cls: 's1' }, { y: Pt(T) - Rt(T), cls: 's2' }, { y: Rt(T), cls: 's3' }] }, hover });
        let s = P.s + `<line class="zero" x1="${P.p.l}" x2="${P.p.l + P.iw}" y1="${P.Y(0)}" y2="${P.Y(0)}"/>`;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${fmt(hover)} °C`, `фотосинтез ${pct(Pt(hover))}`, `дыхание ${pct(Rt(hover))}`, `прирост ${pct(Pt(hover) - Rt(hover))}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [5, 42], y: [0, 1] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 5, 42);
        if (kind === 'set') { hover = null; rng.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const p = Pt(T), r = Rt(T), n = p - r;
      set(el, 'lab-tmp-p', pct(p)); set(el, 'lab-tmp-r', pct(r)); set(el, 'lab-tmp-n', pct(n));
      set(el, 'lab-tmp-v', n <= 0 ? 'Растение тратит больше, чем производит: рост остановлен, куст слабеет.' : T < 16 ? 'Холодно: фотосинтез медленный, рост почти стоит.' : T > 32 ? 'Жарко: дыхание съедает большую часть сахаров, куст торопится цвести.' : 'Хорошая зона: прирост близок к максимуму.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-tmp-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    upd();
  });

  const PH_X = [4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5];
  const PH_EL = [
    ['N', [0.35, 0.5, 0.75, 0.95, 1, 1, 0.95, 0.8, 0.6]], ['P', [0.25, 0.35, 0.55, 0.85, 1, 0.9, 0.6, 0.45, 0.4]], ['K', [0.4, 0.55, 0.75, 0.95, 1, 1, 1, 1, 0.95]],
    ['S', [0.4, 0.55, 0.75, 0.95, 1, 1, 1, 1, 1]], ['Ca', [0.3, 0.4, 0.55, 0.75, 0.9, 1, 1, 1, 1]], ['Mg', [0.3, 0.4, 0.55, 0.75, 0.9, 1, 1, 1, 0.95]],
    ['Fe', [1, 1, 1, 0.95, 0.85, 0.7, 0.5, 0.35, 0.3]], ['Mn', [1, 1, 1, 0.95, 0.85, 0.7, 0.5, 0.35, 0.3]], ['B', [0.6, 0.75, 0.9, 1, 1, 0.9, 0.7, 0.5, 0.45]],
    ['Cu', [0.9, 1, 1, 1, 0.95, 0.85, 0.7, 0.55, 0.5]], ['Zn', [0.9, 1, 1, 1, 0.95, 0.85, 0.65, 0.45, 0.4]], ['Mo', [0.2, 0.3, 0.45, 0.6, 0.75, 0.9, 1, 1, 1]]
  ];
  const phAv = (arr, ph) => { const t = clamp((ph - 4.5) / 0.5, 0, 8); const i = Math.min(7, Math.floor(t)); return lerp(arr[i], arr[i + 1], t - i); };

  register('ph', el => {
    el.innerHTML = h.head('Доступность элементов по pH', 'Толщина полосы — насколько элемент доступен корням. Упрощено по классической диаграмме Труога.') +
      `<div class="lab-controls">${h.rangeHtml('lab-ph-v', 'pH грунта', 4.5, 8.5, 0.1, 7.6)}</div>
       <div class="lab-chart" id="lab-ph-ch"></div>` + h.readHtml([['Хуже всего доступны', 'lab-ph-low', 'is-wide']]);
    let ph = 7.6;
    const ch = h.chart($('#lab-ph-ch', el), {
      label: 'Доступность двенадцати элементов питания в зависимости от pH',
      h: () => 12 * 26 + 56,
      draw(w, hh) {
        const P = h.plot({ w, h: hh, pad: { l: 40, r: 14, t: 26, b: 26 }, x: [4.5, 8.5], y: [0, 12], xticks: [4.5, 5.5, 6.5, 7.5, 8.5], fx: v => fmt(v), vbands: [{ x0: 6, x1: 7, cls: 'is-good' }] });
        let s = P.s;
        PH_EL.forEach(([sym, arr], i) => {
          const cy = P.Y(11.5 - i);
          const top = [], bot = [];
          for (let x = 4.5; x <= 8.51; x += 0.1) { const a = phAv(arr, x) * 10.5; top.push(`${P.X(x)},${r1(cy - a)}`); bot.unshift(`${P.X(x)},${r1(cy + a)}`); }
          const low = phAv(arr, ph) < 0.6;
          s += `<polygon class="ph-band${low ? ' is-low' : ''}" points="${top.join(' ')} ${bot.join(' ')}"/>`;
          s += `<text class="ph-sym${low ? ' is-low' : ''}" x="${P.p.l - 8}" y="${r1(cy + 4)}" text-anchor="end">${sym}</text>`;
        });
        s += `<line class="marker" x1="${P.X(ph)}" x2="${P.X(ph)}" y1="20" y2="${hh - 26}"/><text class="tick marker-lbl" x="${P.X(ph)}" y="13" text-anchor="middle">pH ${fmt(ph)}</text>`;
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        if (kind !== 'set') return;
        const P = h.plot({ w, h: hh, pad: { l: 40, r: 14, t: 26, b: 26 }, x: [4.5, 8.5], y: [0, 12] });
        rng.set(clamp(Math.round(P.inv(x) * 10) / 10, 4.5, 8.5));
      }
    });
    const upd = () => {
      const low = PH_EL.filter(([, a]) => phAv(a, ph) < 0.6).map(([s]) => s);
      set(el, 'lab-ph-low', low.length ? `${low.join(', ')}${ph > 7.2 ? ' — молодые листья желтеют между жилками' : ph < 5.8 ? ' — кислый грунт, раскислите доломитовой мукой' : ''}` : 'все элементы доступны хорошо');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-ph-v', v => fmt(v), v => { ph = v; upd(); });
    upd();
  });

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

  /* ================================================================== */
  /* УДОБРЕНИЯ                                                           */
  /* ================================================================== */
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

  register('flows', el => {
    el.innerHTML = h.head('Два потока и хлорофилл', 'Синие штрихи — ксилема с водой и ионами, жёлтые — флоэма с сахарами. Выберите группу элементов, чтобы увидеть, где проявится нехватка.') +
      `<div class="lab-controls">${h.segHtml('lab-fl-m', 'Элементы', [['mob', 'Подвижные: N, P, K, Mg'], ['imm', 'Неподвижные: Ca, Fe, B']], 'mob')}</div>
       <div class="lab-grid flows-grid">
        <div class="lab-stage"><svg class="lab-plant flows-svg" viewBox="-220 -300 440 400" role="img" aria-label="Растение с потоками ксилемы и флоэмы"><g id="lab-fl-g"></g>
          <g class="roots"><path d="M0 0 C -6 26 -30 40 -44 70 M0 0 C 4 30 26 46 40 76 M0 0 C 0 40 -8 60 -2 92 M-18 38 C -34 44 -52 44 -66 56 M16 44 C 34 50 48 50 64 62"/></g>
          <line class="soil-line" x1="-200" x2="200" y1="0" y2="0"/>
          <path class="xylem" d="M-3 90 C -4 40 -3 0 -3 -40 S -3 -160 -3 -250"/>
          <path class="phloem" d="M3 -250 C 3 -160 3 -60 3 0 S 4 50 5 90"/>
          <text class="tick" x="-14" y="60" text-anchor="end">ксилема ↑</text><text class="tick" x="14" y="44">флоэма ↕</text>
          <text class="tick fl-tag" id="lab-fl-tag" x="214" y="-250" text-anchor="end"></text>
        </svg></div>
        <figure class="chl-fig"><svg viewBox="0 0 220 220" role="img" aria-label="Схема молекулы хлорофилла: четыре пиррольных кольца вокруг иона магния">
          <g class="chl-ring">
            <path d="M110 44 L128 56 L122 78 L98 78 L92 56 Z"/><path d="M176 110 L164 128 L142 122 L142 98 L164 92 Z"/>
            <path d="M110 176 L92 164 L98 142 L122 142 L128 164 Z"/><path d="M44 110 L56 92 L78 98 L78 122 L56 128 Z"/>
            <path class="chl-bridge" d="M128 56 Q 158 62 164 92 M164 128 Q 158 158 128 164 M92 164 Q 62 158 56 128 M56 92 Q 62 62 92 56"/>
          </g>
          <g class="chl-bonds"><path d="M110 78 L110 98 M142 110 L122 110 M110 142 L110 122 M78 110 L98 110"/></g>
          <circle class="chl-mg" cx="110" cy="110" r="14"/><text class="chl-mg-t" x="110" y="115" text-anchor="middle">Mg</text>
          <g class="chl-n"><circle cx="110" cy="80" r="8"/><circle cx="140" cy="110" r="8"/><circle cx="110" cy="140" r="8"/><circle cx="80" cy="110" r="8"/></g>
          <g class="chl-n-t"><text x="110" y="84" text-anchor="middle">N</text><text x="140" y="114" text-anchor="middle">N</text><text x="110" y="144" text-anchor="middle">N</text><text x="80" y="114" text-anchor="middle">N</text></g>
          <path class="chl-tail" d="M110 176 C 112 188 100 194 106 204 S 118 214 112 220"/>
        </svg><figcaption>Хлорофилл: четыре кольца с азотом держат ион магния. Хвост из фитола закрепляет молекулу в мембране.</figcaption></figure>
       </div>`;
    const plant = S.Plant($('#lab-fl-g', el), S.basil({ nodes: 7, scale: 2.05, w: 9 }), { grown: true, leafScale: 0.72, sway: 0.5 });
    const upd = v => {
      const shoots = plant.shoots();
      shoots.forEach(s => s.leaves.forEach(lf => {
        const n = s.spec.internodes.length;
        const sick = v === 'mob' ? lf.node <= 1 : lf.node >= n - 3;
        lf.el.classList.toggle('is-sick', sick);
      }));
      const tag = $('#lab-fl-tag', el);
      tag.textContent = v === 'mob' ? 'голод виден снизу' : 'голод виден сверху';
      tag.setAttribute('y', v === 'mob' ? '-40' : '-240');
    };
    h.bindPick(el, 'lab-fl-m', upd);
    upd('mob');
  });

  const STAVES = [['light', 'Свет'], ['heat', 'Тепло'], ['water', 'Вода'], ['N', 'N'], ['P', 'P'], ['K', 'K'], ['Ca', 'Ca'], ['Mg', 'Mg'], ['Fe', 'Fe']];
  const BARREL_PRESETS = {
    summer: ['Лето на грядке', { light: 95, heat: 90, water: 82, N: 80, P: 85, K: 78, Ca: 90, Mg: 85, Fe: 90 }],
    winter: ['Зимний подоконник', { light: 22, heat: 82, water: 85, N: 90, P: 85, K: 80, Ca: 90, Mg: 85, Fe: 85 }],
    overN: ['Перекорм азотом', { light: 85, heat: 85, water: 80, N: 100, P: 70, K: 42, Ca: 78, Mg: 62, Fe: 80 }],
    cold: ['Холодная весна', { light: 72, heat: 28, water: 85, N: 70, P: 60, K: 80, Ca: 85, Mg: 80, Fe: 80 }],
    hard: ['Жёсткая вода', { light: 85, heat: 85, water: 80, N: 80, P: 72, K: 80, Ca: 96, Mg: 78, Fe: 30 }]
  };
  const BARREL_ADVICE = {
    light: 'Добавьте лампу или переставьте ближе к окну. Подкормки сейчас бесполезны: азот уйдёт в нитраты.',
    heat: 'Утеплите: в холодном грунте корни почти не берут азот и фосфор, органика не разлагается.',
    water: 'Наладьте полив: без воды не работают ни корни, ни устьица.',
    N: 'Подкормите азотом половинной дозой: листья светлеют снизу.',
    P: 'Нужен фосфор, особенно в холодном грунте: монокалийфосфат слабым раствором.',
    K: 'Не хватает калия: калийная селитра или сульфат калия.',
    Ca: 'Кальций: кальциевая селитра, проверьте испарение и влажность воздуха.',
    Mg: 'Магний: сульфат магния, раз в месяц.',
    Fe: 'Железо заблокировано: хелат железа и мягкая вода, проверьте pH.'
  };

  register('barrel', el => {
    el.innerHTML = h.head('Бочка Либиха', 'Вода держится до уровня самой короткой доски. Выберите ситуацию или тяните доски вверх и вниз.') +
      `<div class="lab-controls">${h.chipsHtml('lab-bar-p', 'Ситуация', Object.entries(BARREL_PRESETS).map(([k, v]) => [k, v[0]]), 'winter')}</div>
       <div class="lab-grid wide-stage">
        <div class="lab-chart" id="lab-bar-ch"></div>
        <div class="lab-controls">
          ${h.chipsHtml('lab-bar-s', 'Доска', STAVES.map(s => [s[0], s[1]]), 'light')}
          ${h.rangeHtml('lab-bar-v', 'Уровень доски', 5, 100, 1, 22)}
          <p class="barrel-verdict" id="lab-bar-out" aria-live="polite"></p>
        </div>
       </div>`;
    const vals = Object.assign({}, BARREL_PRESETS.winter[1]);
    let sel = 'light';
    const PAD = 20;
    const ch = h.chart($('#lab-bar-ch', el), {
      label: 'Бочка из девяти досок-факторов с уровнем воды',
      h: w => clamp(w * 0.7, 250, 330),
      draw(w, hh) {
        const bw = Math.min(w - PAD * 2, 380), x0 = (w - bw) / 2, top = 28, bottom = hh - 30;
        const sw = bw / STAVES.length;
        const Y = v => r1(bottom - (bottom - top) * v / 100);
        const min = Math.min(...STAVES.map(s => vals[s[0]]));
        const limit = STAVES.find(s => vals[s[0]] === min)[0];
        let s = `<clipPath id="lab-bar-clip"><rect x="${r1(x0)}" y="${top - 30}" width="${r1(bw)}" height="${r1(bottom - top + 30)}"/></clipPath>`;
        s += `<rect class="barrel-water" x="${r1(x0 + 2)}" y="${Y(min)}" width="${r1(bw - 4)}" height="${r1(bottom - Y(min))}" clip-path="url(#lab-bar-clip)"/>`;
        s += `<path class="barrel-wave" d="M${r1(x0 + 2)} ${Y(min)} q ${r1(sw / 2)} -5 ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw - 4)} 0"/>`;
        STAVES.forEach(([k, name], i) => {
          const x = x0 + i * sw;
          const isLim = k === limit, isSel = k === sel;
          s += `<rect class="stave${isLim ? ' is-limit' : ''}${isSel ? ' is-sel' : ''}" x="${r1(x + 1.5)}" y="${Y(vals[k])}" width="${r1(sw - 3)}" height="${r1(bottom - Y(vals[k]))}" rx="3" data-k="${k}"/>`;
          s += `<text class="stave-lbl${isLim ? ' is-limit' : ''}" x="${r1(x + sw / 2)}" y="${bottom + 16}" text-anchor="middle">${name}</text>`;
          if (isLim) s += `<path class="barrel-spill" d="M${r1(x + sw / 2)} ${Y(min) - 1} q 8 6 6 20 t -2 ${r1(bottom - Y(min) - 12)}"/>`;
        });
        [0.3, 0.72].forEach(f => { s += `<rect class="hoop" x="${r1(x0 - 3)}" y="${r1(bottom - (bottom - top) * f)}" width="${r1(bw + 6)}" height="6" rx="3"/>`; });
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        if (kind !== 'set') return;
        const bw = Math.min(w - PAD * 2, 380), x0 = (w - bw) / 2, top = 28, bottom = hh - 30;
        const i = Math.floor((x - x0) / (bw / STAVES.length));
        if (i < 0 || i >= STAVES.length) return;
        const k = STAVES[i][0];
        vals[k] = clamp(Math.round((bottom - y) / (bottom - top) * 100), 5, 100);
        sel = k; pickS.set(k); rng.input.value = vals[k]; $('#lab-bar-v-v', el).textContent = vals[k] + ' %';
        upd();
      }
    });
    const upd = () => {
      const min = Math.min(...STAVES.map(s => vals[s[0]]));
      const k = STAVES.find(s => vals[s[0]] === min);
      $('#lab-bar-out', el).innerHTML = `<b>Ограничивает: ${k[1] === 'N' || k[1].length < 3 ? k[1] : k[1].toLowerCase()} (${min} %).</b> ${BARREL_ADVICE[k[0]]}`;
      ch.redraw();
    };
    const pickS = h.bindPick(el, 'lab-bar-s', k => { sel = k; rng.input.value = vals[k]; $('#lab-bar-v-v', el).textContent = vals[k] + ' %'; ch.redraw(); });
    const rng = h.bindRange(el, 'lab-bar-v', v => v + ' %', v => { vals[sel] = v; upd(); });
    h.bindPick(el, 'lab-bar-p', k => { Object.assign(vals, BARREL_PRESETS[k][1]); rng.input.value = vals[sel]; $('#lab-bar-v-v', el).textContent = vals[sel] + ' %'; upd(); });
    upd();
  });

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

  register('oxide', el => {
    el.innerHTML = h.head('Пересчёт оксидов в элементы', 'Введите числа с упаковки и сколько граммов удобрения вы растворяете.') +
      `<div class="row-3 lab-row">
        <div class="field"><label for="lab-ox-n">N, %</label><input type="number" id="lab-ox-n" min="0" max="60" step="0.5" value="16" inputmode="decimal"></div>
        <div class="field"><label for="lab-ox-p">P₂O₅, %</label><input type="number" id="lab-ox-p" min="0" max="60" step="0.5" value="16" inputmode="decimal"></div>
        <div class="field"><label for="lab-ox-k">K₂O, %</label><input type="number" id="lab-ox-k" min="0" max="60" step="0.5" value="16" inputmode="decimal"></div>
      </div>
      <div class="field lab-field"><label for="lab-ox-g">Граммов удобрения</label><input type="number" id="lab-ox-g" min="0.1" max="1000" step="0.5" value="10" inputmode="decimal"></div>
      <div class="ox-rows" id="lab-ox-out" aria-live="polite"></div>`;
    const upd = () => {
      const n = +$('#lab-ox-n', el).value || 0, p = +$('#lab-ox-p', el).value || 0, k = +$('#lab-ox-k', el).value || 0, g = +$('#lab-ox-g', el).value || 0;
      const rows = [['Азот', 'N', n, n, 's1'], ['Фосфор', 'P₂O₅ → P', p, p * 0.436, 's2'], ['Калий', 'K₂O → K', k, k * 0.83, 's3']];
      const mx = Math.max(1, n, p, k);
      $('#lab-ox-out', el).innerHTML = rows.map(([name, lab, onPack, real, c]) => `
        <div class="ox-row"><span class="ox-name"><b>${name}</b><small>${lab}</small></span>
          <span class="ox-bars"><i class="ox-pack" style="--w:${onPack / mx * 100}%"></i><i class="ox-real ${c}" style="--w:${real / mx * 100}%"></i></span>
          <span class="ox-val"><b>${fmt(real)} %</b><small>${fmt(g * real / 100, 2)} г</small></span></div>`).join('') +
        `<p class="lab-foot">Серая полоса — цифра на упаковке, цветная — чистый элемент. В ${fmt(g)} г удобрения: ${fmt(g * n / 100, 2)} г N, ${fmt(g * p * 0.436 / 100, 2)} г P и ${fmt(g * k * 0.83 / 100, 2)} г K.</p>`;
    };
    $$('input', el).forEach(i => i.addEventListener('input', upd));
    upd();
  });

  register('ec', el => {
    el.innerHTML = h.head('EC, ppm и осмос', 'Переведите показания кондуктометра в шкалы TDS-метров и посмотрите, куда попадает раствор.') +
      `<div class="lab-controls">${h.rangeHtml('lab-ec-v', 'EC раствора', 0, 3, 0.05, 1.2)}</div>
       <div class="ec-scale" id="lab-ec-scale"><span class="ec-z" style="--a:13.3%;--b:26.7%">сеянцы</span><span class="ec-z" style="--a:33.3%;--b:53.3%">рост и срезки</span><span class="ec-z is-bad" style="--a:60%;--b:100%">риск ожога</span><i class="ec-mark" id="lab-ec-mark"></i></div>
       <p class="ec-ticks"><span>0</span><span>1</span><span>2</span><span>3 мС/см</span></p>` +
      h.readHtml([['Шкала 500', 'lab-ec-500'], ['Шкала 700', 'lab-ec-700'], ['Осмотический потенциал', 'lab-ec-psi']]);
    const upd = v => {
      set(el, 'lab-ec-500', `${fmt0(v * 500)} ppm`);
      set(el, 'lab-ec-700', `${fmt0(v * 700)} ppm`);
      set(el, 'lab-ec-psi', `${fmt(-0.036 * v, 3)} МПа`);
      $('#lab-ec-mark', el).style.left = `${v / 3 * 100}%`;
    };
    h.bindRange(el, 'lab-ec-v', v => `${fmt(v, 2)} мС/см`, upd);
    upd(1.2);
  });

  const DO_T = [[10, 11.29], [12, 10.77], [14, 10.29], [16, 9.86], [18, 9.47], [20, 9.09], [22, 8.74], [24, 8.42], [26, 8.11], [28, 7.83], [30, 7.56], [32, 7.3], [34, 7.06], [35, 6.95]];
  const doAt = t => { for (let i = 0; i < DO_T.length - 1; i++) if (t <= DO_T[i + 1][0]) return lerp(DO_T[i][1], DO_T[i + 1][1], (t - DO_T[i][0]) / (DO_T[i + 1][0] - DO_T[i][0])); return DO_T[DO_T.length - 1][1]; };
  const demand = t => 6.1 * Math.pow(2, (t - 20) / 10);

  register('o2', el => {
    el.innerHTML = h.head('Кислород против дыхания корней', 'Растворимость O₂ — справочные данные для пресной воды. Потребность корней — условная, с Q₁₀ = 2: важен не уровень, а момент, когда линии пересекаются.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-o2-t', 'Температура раствора', 10, 35, 0.5, 22)}</div>
       <div class="lab-chart" id="lab-o2-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s4"></i>кислород в воде</li><li><i class="k-s3"></i>потребность корней</li></ul>` +
      h.readHtml([['Растворено O₂', 'lab-o2-d'], ['Запас', 'lab-o2-m'], ['Вывод', 'lab-o2-v', 'is-wide']]);
    let T = 22, hover = null;
    const ch = h.chart($('#lab-o2-ch', el), {
      label: 'Растворённый кислород и потребность корней по температуре',
      draw(w, hh) {
        const pts = f => { const a = []; for (let t = 10; t <= 35; t += 0.5) a.push([t, f(t)]); return a; };
        const P = h.plot({ w, h: hh, clip: true, x: [10, 35], y: [2, 14], xticks: [10, 15, 20, 25, 30, 35], yticks: [2, 4, 6, 8, 10, 12, 14], fx: v => v + '°', ylab: 'мг O₂ на литр', xlab: 'температура раствора, °C',
          vbands: [{ x0: 18, x1: 22, cls: 'is-good', label: 'норма' }],
          series: [{ pts: pts(doAt), cls: 's4', label: 'O₂ в воде', labelAt: 13, ldy: -10 }, { pts: pts(demand), cls: 's3', label: 'потребность', labelAt: 31, ldy: -10 }],
          marker: { x: T, dots: [{ y: doAt(T), cls: 's4' }, { y: Math.min(14, demand(T)), cls: 's3' }] }, hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [`${fmt(hover)} °C`, `O₂: ${fmt(doAt(hover))} мг/л`, `потребность: ${fmt(demand(hover))}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [10, 35], y: [2, 14] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 10, 35);
        if (kind === 'set') { hover = null; rng.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const d = doAt(T), m = d - demand(T);
      set(el, 'lab-o2-d', `${fmt(d)} мг/л`);
      set(el, 'lab-o2-m', m >= 0 ? `+${fmt(m)}` : `−${fmt(-m)}`);
      set(el, 'lab-o2-v', m > 1.2 ? 'Кислорода с запасом: корни белые и плотные.' : m > 0 ? 'На грани: добавьте аэрацию или охладите раствор.' : 'Корням не хватает кислорода: риск питиума и бурых корней. Охладите раствор до 18–22 °C.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-o2-t', v => `${fmt(v)} °C`, v => { T = v; upd(); });
    upd();
  });

  /* ================================================================== */
  /* ПРИЩИПЫВАНИЕ                                                        */
  /* ================================================================== */
  register('auxin', el => {
    el.innerHTML = h.head('Что происходит после среза', 'Фиолетовые точки — ауксин, жёлтые — сахар, голубые — цитокинины из корней. Нажмите «Прищипнуть» и смотрите, как просыпаются почки.') +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage auxin-stage"><svg class="lab-plant" viewBox="-160 -330 320 350" role="img" aria-label="Стебель базилика с потоками гормонов"><line class="soil-line" x1="-160" x2="160" y1="2" y2="2"/><g id="lab-aux-g"></g><g class="fx" id="lab-aux-fx"></g></svg></div>
        <div class="lab-controls">
          <div class="lab-actions"><button class="btn btn-primary btn-small" type="button" id="lab-aux-cut">${h.icon('scissors')}Прищипнуть</button><button class="btn btn-ghost btn-small" type="button" id="lab-aux-reset">Сначала</button></div>
          <ol class="aux-steps" id="lab-aux-steps">
            <li class="is-on">Верхушка шлёт ауксин вниз — почки спят</li>
            <li>Срез: источник ауксина исчез</li>
            <li>Через часы: к почкам устремился сахар</li>
            <li>Сутки: из корней поднимаются цитокинины</li>
            <li>Неделя: две почки стали побегами</li>
          </ol>
        </div>
      </div>`;
    const g = $('#lab-aux-g', el), fx = $('#lab-aux-fx', el);
    const full = () => S.basil({ nodes: 7, scale: 1.4, w: 8 });
    const cut = () => { const s = S.basil({ nodes: 3, scale: 1.4, w: 8, apex: 'cut' }); s.internodes = full().internodes.slice(0, 3); s.leaves = full().leaves.slice(0, 3); return s; };
    const grown = () => { const s = cut(); s.children = [{ at: 2, spec: S.basil({ id: 'bL', nodes: 5, scale: 1, w: 5, angle: -0.5, flex: 1.4 }) }, { at: 2, spec: S.basil({ id: 'bR', nodes: 5, scale: 1, w: 5, angle: 0.5, flex: 1.4 }) }]; return s; };
    const plant = S.Plant(g, full(), { grown: true, leafScale: 0.55, sway: 0.6, growDur: 3.2 });
    let stage = 0, t0 = 0, raf = 0, visible = true;
    const parts = [];
    const steps = $$('#lab-aux-steps li', el);
    const setStep = k => steps.forEach((li, i) => li.classList.toggle('is-on', i === k));
    const along = (pts, u) => {
      if (pts.length < 2) return pts[0] || { x: 0, y: 0 };
      const segs = []; let L = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push(d); L += d; }
      let target = clamp(u, 0, 1) * L;
      for (let i = 0; i < segs.length; i++) { if (target <= segs[i] || i === segs.length - 1) { const f = segs[i] ? target / segs[i] : 0; return { x: lerp(pts[i].x, pts[i + 1].x, f), y: lerp(pts[i].y, pts[i + 1].y, f) }; } target -= segs[i]; }
      return pts[pts.length - 1];
    };
    function frame(ts) {
      raf = 0;
      if (!visible) return;
      const t = ts / 1000;
      const since = t0 ? t - t0 : 0;
      if (stage === 1 && since > 1.2) { stage = 2; setStep(2); }
      if (stage === 2 && since > 3) { stage = 3; setStep(3); }
      if (stage === 3 && since > 4.6) { stage = 4; setStep(4); plant.setSpec(grown()); }
      const pts = plant.points('r');
      if (!pts.length) { raf = requestAnimationFrame(frame); return; }
      const rev = pts.slice().reverse();
      const node2 = pts.length > 3 ? pts.slice(0, 4) : pts;
      if (stage === 0 && Math.random() < 0.12) parts.push({ k: 'aux', u: 0, sp: 0.16 + Math.random() * 0.05 });
      if (stage >= 2 && stage < 4 && Math.random() < 0.18) parts.push({ k: 'sug', u: 0, sp: 0.3 + Math.random() * 0.1 });
      if (stage >= 3 && stage < 4 && Math.random() < 0.12) parts.push({ k: 'cyt', u: 0, sp: 0.22 + Math.random() * 0.06 });
      let s = '';
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.u += p.sp * 0.016;
        if (p.u >= 1) { parts.splice(i, 1); continue; }
        const q = p.k === 'aux' ? along(rev, p.u) : along(node2, p.u);
        s += `<circle class="aux-${p.k}" cx="${r1(q.x + (p.k === 'aux' ? -2 : p.k === 'sug' ? 2.5 : 0))}" cy="${r1(q.y)}" r="${p.k === 'aux' ? 3.4 : 3}"/>`;
      }
      if (stage >= 2 && stage < 4 && pts[3]) s += `<circle class="aux-bud" cx="${r1(pts[3].x - 6)}" cy="${r1(pts[3].y - 3)}" r="${r1(3 + Math.min(3, since - 1.2))}"/><circle class="aux-bud" cx="${r1(pts[3].x + 6)}" cy="${r1(pts[3].y - 3)}" r="${r1(3 + Math.min(3, since - 1.2))}"/>`;
      fx.innerHTML = s;
      raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!raf && !h.reduce.matches) raf = requestAnimationFrame(frame); };
    $('#lab-aux-cut', el).addEventListener('click', () => {
      if (stage) return;
      stage = 1; t0 = performance.now() / 1000; setStep(1);
      plant.setSpec(cut());
      if (h.reduce.matches) { stage = 4; setStep(4); plant.setSpec(grown()); }
      wake();
    });
    $('#lab-aux-reset', el).addEventListener('click', () => { stage = 0; t0 = 0; parts.length = 0; setStep(0); plant.setSpec(full(), { regrow: false }); wake(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { visible = en.some(x => x.isIntersecting); if (visible) wake(); }).observe(el);
    wake();
  });

  register('branch', el => {
    el.innerHTML = h.head('Куст после n прищипываний', 'Каждый срез над узлом будит две почки. Сдвиньте ползунок — новые побеги вырастут на глазах.') +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage"><svg class="lab-plant" viewBox="-250 -350 500 370" role="img" aria-label="Куст базилика после нескольких прищипываний"><line class="soil-line" x1="-250" x2="250" y1="2" y2="2"/><g id="lab-br-g"></g></svg></div>
        <div class="lab-controls">${h.rangeHtml('lab-br-n', 'Прищипываний', 0, 4, 1, 2)}</div>
      </div>` + h.readHtml([['Верхушек', 'lab-br-t'], ['Листьев на кусте', 'lab-br-l'], ['Возраст куста', 'lab-br-w']]);
    const SC = [2.1, 1.85, 1.62, 1.42, 1.24];
    const spec = n => S.bush(n, { scale: SC[n], leaf: 1 });
    const plant = S.Plant($('#lab-br-g', el), spec(2), { grown: true, leafScale: 0.6, sway: 0.8, growDur: 1.8 });
    const upd = n => {
      plant.setSpec(spec(n));
      const leaves = plant.shoots().reduce((a, s) => a + s.spec.internodes.length * 2, 0);
      set(el, 'lab-br-t', String(Math.pow(2, n)));
      set(el, 'lab-br-l', `≈ ${leaves}`);
      set(el, 'lab-br-w', `≈ ${fmt(5 + 2.5 * n)} нед.`);
    };
    h.bindRange(el, 'lab-br-n', v => String(v), upd);
    upd(2);
  });

  /* ================================================================== */
  /* УРОЖАЙ                                                              */
  /* ================================================================== */
  register('diurnal', el => {
    const Tleaf = hr => 20.5 + 6.5 * Math.cos(2 * Math.PI * (hr - 15) / 24);
    const emit = T => Math.exp(10.6 * (1 - 471 / (T + 273.15)));
    const EMAX = emit(27);
    const turg = hr => hr < 7 || hr > 21 ? 1 : 1 - 0.42 * Math.pow(Math.sin(Math.PI * (hr - 7) / 14), 1.5);
    el.innerHTML = h.head('Летний день глазами листа', 'Температура листа — типичный ясный июльский день. Испарение линалоола считается по правилу Трутона, тургор — упрощённо.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-di-h', 'Время', 0, 23.5, 0.5, 7)}</div>
       <div class="lab-chart" id="lab-di-ch"></div>
       <ul class="legend legend-lines"><li><i class="k-s3"></i>аромат улетает</li><li><i class="k-s4"></i>тургор листа</li></ul>` +
      h.readHtml([['Температура листа', 'lab-di-t'], ['Испарение аромата, от пика', 'lab-di-e'], ['Тургор', 'lab-di-g'], ['Совет', 'lab-di-v', 'is-wide']]);
    let H = 7, hover = null;
    const hh2 = v => `${Math.floor(v)}:${v % 1 ? '30' : '00'}`;
    const ch = h.chart($('#lab-di-ch', el), {
      label: 'Потери аромата и тургор листа в течение суток',
      draw(w, hh) {
        const pts = f => { const a = []; for (let x = 0; x <= 24; x += 0.25) a.push([x, f(x)]); return a; };
        const P = h.plot({ w, h: hh, x: [0, 24], y: [0, 105], xticks: [0, 6, 12, 18, 24], yticks: [0, 50, 100], fx: v => v + ':00', fy: v => v + '%',
          vbands: [{ x0: 6, x1: 10, cls: 'is-good', label: 'лучший сбор' }],
          series: [{ pts: pts(x => emit(Tleaf(x)) / EMAX * 100), cls: 's3', label: 'аромат улетает', labelAt: 15, ldy: -10 }, { pts: pts(x => turg(x) * 100), cls: 's4', label: 'тургор', labelAt: 3, ldy: -8 }],
          marker: { x: H, dots: [{ y: emit(Tleaf(H)) / EMAX * 100, cls: 's3' }, { y: turg(H) * 100, cls: 's4' }] }, hover });
        let s = P.s;
        if (hover != null) s += h.tip(P.X(hover), P.p.t + 4, w, [hh2(hover), `лист ${fmt(Tleaf(hover))} °C`, `потери ${pct(emit(Tleaf(hover)) / EMAX)}`]);
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [0, 24], y: [0, 1] });
        const v = clamp(Math.round(P.inv(x) * 2) / 2, 0, 23.5);
        if (kind === 'set') { hover = null; rng.set(v); return; }
        hover = kind === 'leave' ? null : v;
        ch.redraw();
      }
    });
    const upd = () => {
      const T = Tleaf(H), e = emit(T) / EMAX, g = turg(H);
      set(el, 'lab-di-t', `${fmt(T)} °C`); set(el, 'lab-di-e', pct(e)); set(el, 'lab-di-g', pct(g));
      set(el, 'lab-di-v', H >= 6 && H <= 10 ? 'Хорошее время: листья упругие, аромат ещё не «выкипает».' : H > 10 && H < 18 ? 'Жарко: листья вялые, летучие вещества уходят быстрее всего. Отложите сбор.' : H >= 18 && H < 21 ? 'Вечером можно, но листья ещё не восстановили воду после дня.' : 'Ночью листья полны воды, но на них может быть роса — собирайте, когда она высохнет.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-di-h', v => hh2(v), v => { H = v; upd(); });
    upd();
  });

  const STORE_PTS = [[2, 1], [4, 2], [6, 3], [8, 4.5], [10, 6], [12, 8], [14, 9], [16, 8.6], [18, 7.2], [20, 6], [22, 5], [25, 4]];
  const storeAt = t => { for (let i = 0; i < STORE_PTS.length - 1; i++) if (t <= STORE_PTS[i + 1][0]) return lerp(STORE_PTS[i][1], STORE_PTS[i + 1][1], (t - STORE_PTS[i][0]) / (STORE_PTS[i + 1][0] - STORE_PTS[i][0])); return 4; };
  register('storage', el => {
    el.innerHTML = h.head('Сколько живёт срезанный базилик', 'Ориентир для стеблей в воде под свободным пакетом, упрощено по опытам хранения: ниже 10 °C срок режет холодовое повреждение, выше 18 °C — старение листа.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-st-t', 'Температура хранения', 2, 25, 1, 4)}</div>
       <div class="lab-chart" id="lab-st-ch"></div>` + h.readHtml([['До заметной порчи', 'lab-st-d'], ['Что происходит', 'lab-st-v', 'is-wide']]);
    let T = 4;
    const ch = h.chart($('#lab-st-ch', el), {
      label: 'Срок хранения срезанного базилика в зависимости от температуры',
      draw(w, hh) {
        const pts = []; for (let t = 2; t <= 25; t += 0.5) pts.push([t, storeAt(t)]);
        const P = h.plot({ w, h: hh, x: [2, 25], y: [0, 10], xticks: [2, 5, 10, 15, 20, 25], yticks: [0, 5, 10], fx: v => v + '°', ylab: 'дней',
          vbands: [{ x0: 2, x1: 10, cls: 'is-cold', label: 'холодовое повреждение' }, { x0: 12, x1: 15, cls: 'is-good', label: 'оптимум' }],
          series: [{ pts, cls: 's1', area: true }], marker: { x: T, dots: [{ y: storeAt(T), cls: 's1' }] } });
        return P.s;
      },
      onPointer(x, y, w, hh, kind) { if (kind !== 'set') return; const P = h.plot({ w, h: hh, x: [2, 25], y: [0, 10] }); rng.set(clamp(Math.round(P.inv(x)), 2, 25)); }
    });
    const upd = () => {
      set(el, 'lab-st-d', `≈ ${fmt(storeAt(T))} дн.`);
      set(el, 'lab-st-v', T < 10 ? 'Мембраны клеток «застывают», полифенолоксидаза встречается с полифенолами — появляются чёрные пятна.' : T <= 16 ? 'Мембраны жидкие, дыхание медленное: лист живёт дольше всего.' : 'Тепло: лист быстро тратит запасы, желтеет и вянет.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-st-t', v => `${v} °C`, v => { T = v; upd(); });
    upd();
  });

  register('pesto', el => {
    el.innerHTML = h.head('Песто-лаборатория', 'Качественная модель двух процессов: ферментативного потемнения и оливкования хлорофилла. Соберите свой рецепт и посмотрите цвет через сутки.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">
          ${h.segHtml('lab-pe-m', 'Чем растираем', [['mortar', 'Ступка'], ['blender', 'Блендер']], 'blender')}
          <div class="lab-seg-wrap"><span class="lab-label">Добавки и приёмы</span><div class="chips-row lab-chips" id="lab-pe-x">
            <button class="chip" type="button" data-x="blanch" aria-pressed="false">Бланшировать 10 с</button>
            <button class="chip" type="button" data-x="vitc" aria-pressed="false">Щепотка аскорбинки</button>
            <button class="chip" type="button" data-x="lemon" aria-pressed="false">Лимонный сок</button>
            <button class="chip" type="button" data-x="oil" aria-pressed="false">Слой масла сверху</button>
          </div></div>
          ${h.segHtml('lab-pe-s', 'Хранение', [['fridge', 'Холодильник'], ['room', 'Комната']], 'room')}
          ${h.rangeHtml('lab-pe-h', 'Прошло времени', 0, 72, 1, 24)}
        </div>
        <div class="pesto-out">
          <svg class="pesto-jar" viewBox="0 0 160 190" aria-hidden="true">
            <rect class="jar-lid" x="34" y="10" width="92" height="20" rx="6"/>
            <path class="jar-glass" d="M40 30 H120 Q132 30 132 46 V164 Q132 180 116 180 H44 Q28 180 28 164 V46 Q28 30 40 30 Z"/>
            <path id="lab-pe-fill" d="M31 70 Q80 62 129 70 V162 Q129 177 115 177 H45 Q31 177 31 162 Z"/>
            <path class="jar-oil" id="lab-pe-oil" d="M31 62 Q80 56 129 62 V72 Q80 64 31 72 Z"/>
            <path class="jar-shine" d="M42 50 V150"/>
          </svg>
          <p class="pesto-verdict" id="lab-pe-v"></p>
          <div class="pesto-bars" id="lab-pe-bars"></div>
        </div>
      </div>
      <ul class="ticks pesto-notes" id="lab-pe-notes"></ul>`;
    const st = { m: 'blender', s: 'room', t: 24, x: new Set() };
    const upd = () => {
      const X = st.x;
      let kE = 0.05, kO = 0.004;
      if (st.m === 'blender') { kE *= 1.6; kO *= 1.3; }
      if (X.has('blanch')) { kE *= 0.12; kO *= 1.5; }
      if (X.has('vitc')) kE *= 0.35;
      if (X.has('lemon')) { kE *= 0.7; kO *= 6; }
      if (X.has('oil')) kE *= 0.45;
      if (st.s === 'fridge') { kE *= 0.35; kO *= 0.4; }
      const E = 1 - Math.exp(-kE * st.t), O = 1 - Math.exp(-kO * st.t);
      const fresh = h.css('--pesto-fresh'), brown = h.css('--pesto-brown'), olive = h.css('--pesto-olive');
      const col = h.mix(h.mix(fresh, brown, E * 0.85), olive, O * 0.8);
      $('#lab-pe-fill', el).style.fill = col;
      $('#lab-pe-oil', el).style.opacity = X.has('oil') ? 1 : 0;
      const score = Math.max(E * 0.9, O * 0.85);
      $('#lab-pe-v', el).innerHTML = `<b>${score < 0.15 ? 'Изумрудное' : score < 0.35 ? 'Слегка потускнело' : score < 0.6 ? (O > E ? 'Оливковое' : 'Потемнело') : (O > E ? 'Оливково-бурое' : 'Бурое')}</b> через ${st.t} ч`;
      $('#lab-pe-bars', el).innerHTML = [['Ферментативное потемнение', E, 's3'], ['Оливкование хлорофилла', O, 's2']].map(([n, v, c]) => `<div class="gdd-row"><span>${n}</span><i class="${c}" style="--w:${clamp(v, 0.02, 1) * 100}%"></i><b>${pct(v)}</b></div>`).join('');
      const notes = [];
      notes.push(st.m === 'blender' ? 'Блендер греет и взбивает с воздухом — потемнение ускоряется. Охладите чашу и работайте импульсами.' : 'Ступка не греет массу и почти не вбивает воздух.');
      if (X.has('blanch')) notes.push('Бланширование разрушило полифенолоксидазу — главный виновник потемнения выключен. Аромат при этом чуть слабее.');
      if (X.has('vitc')) notes.push('Аскорбиновая кислота восстанавливает хиноны обратно, пока сама не израсходуется.');
      if (X.has('lemon')) notes.push('Кислота лимона немного тормозит фермент, но ускоряет оливкование: ион магния уходит из хлорофилла.');
      if (X.has('oil')) notes.push('Слой масла отрезает кислород сверху.');
      notes.push(st.s === 'fridge' ? 'Холод замедляет обе реакции примерно втрое.' : 'При комнатной температуре реакции идут быстро — песто лучше съесть сразу.');
      $('#lab-pe-notes', el).innerHTML = notes.map(n => `<li>${h.nb(n)}</li>`).join('');
    };
    h.bindPick(el, 'lab-pe-m', v => { st.m = v; upd(); });
    h.bindPick(el, 'lab-pe-s', v => { st.s = v; upd(); });
    h.bindRange(el, 'lab-pe-h', v => `${v} ч`, v => { st.t = v; upd(); });
    $('#lab-pe-x', el).addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      const on = !st.x.has(b.dataset.x);
      if (on) st.x.add(b.dataset.x); else st.x.delete(b.dataset.x);
      b.setAttribute('aria-pressed', String(on));
      upd();
    });
    upd();
    document.addEventListener('basil:theme', upd);
  });

  /* ================================================================== */
  /* РАЗМНОЖЕНИЕ                                                         */
  /* ================================================================== */
  register('roots', el => {
    el.innerHTML = h.head('Черенок в стакане', 'Модель укоренения: корешки появляются из погружённых узлов и растут примерно на полсантиметра в день в тепле.', true) +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage"><svg class="roots-svg" id="lab-rt-svg" viewBox="0 0 220 260" role="img" aria-label="Черенок базилика в стакане с водой"></svg></div>
        <div class="lab-controls">${h.rangeHtml('lab-rt-d', 'День', 0, 21, 1, 10)}${h.segHtml('lab-rt-t', 'Комната', [['18', '18 °C'], ['22', '22 °C'], ['26', '26 °C']], '22')}</div>
      </div>` + h.readHtml([['Длина корней', 'lab-rt-l'], ['Что делать', 'lab-rt-v', 'is-wide']]);
    const svg = $('#lab-rt-svg', el);
    let day = 10, temp = 22;
    const ON = { 18: 10, 22: 7, 26: 5 }, RATE = { 18: 0.35, 22: 0.5, 26: 0.6 };
    const ROOTS = [[-1, 0.9, 0], [1, 1, 1], [-1, 0.7, 2], [1, 0.8, 0.5], [-1, 0.6, 1.5], [1, 0.65, 2.5]];
    const leaf = (x, y, a, s) => `<use href="#pl-leaf" class="pl-leaf" style="fill:url(#pl-grad)" transform="translate(${x} ${y}) rotate(${a}) scale(${s})"/>`;
    const upd = () => {
      const L = Math.max(0, (day - ON[temp]) * RATE[temp]);
      let s = `<path class="rt-glass" d="M52 60 L60 246 Q61 252 68 252 H152 Q159 252 160 246 L168 60"/>`;
      s += `<path class="rt-water" d="M55.6 120 L60.6 245 Q61.4 249.5 68 249.5 H152 Q158.6 249.5 159.4 245 L164.4 120 Z"/>`;
      s += `<path class="rt-stem" d="M110 236 C 108 180 112 120 110 34"/>`;
      [[176, 1], [206, 0.8]].forEach(([y, k]) => {
        s += `<circle class="rt-node" cx="110" cy="${y}" r="3.2"/>`;
        ROOTS.forEach(([side, len, lag], i) => {
          const l = Math.max(0, L - lag * 0.25) * len * k * 11;
          if (l < 1) return;
          const cx = 110 + side * (6 + i * 1.5), ex = 110 + side * Math.min(44, l * 0.55 + 6), ey = y + Math.min(250 - y - 4, l * 0.85);
          s += `<path class="rt-root" d="M110 ${y} Q ${r1(cx + side * l * 0.3)} ${r1(y + l * 0.2)} ${r1(ex)} ${r1(ey)}"/>`;
        });
      });
      s += leaf(110, 96, -58, 0.42) + leaf(110, 96, 58, 0.42) + leaf(111, 64, -30, 0.3) + leaf(111, 64, 30, 0.3) + leaf(110, 38, -8, 0.18) + leaf(110, 38, 12, 0.16);
      s += `<line class="rt-wl" x1="56" x2="164" y1="120" y2="120"/>`;
      svg.innerHTML = s;
      set(el, 'lab-rt-l', L > 0 ? `${fmt(L)} см` : 'пока нет');
      set(el, 'lab-rt-v', day < ON[temp] - 2 ? 'Ждите: у основания идёт перестройка клеток, снаружи ничего не видно. Меняйте воду раз в 2–3 дня.' : L < 0.3 ? 'Вот-вот: в узлах набухают белые бугорки — зачатки корней.' : L < 2 ? 'Корешки растут. Сажать рано: подождите, пока будет 2–5 см.' : L <= 5 ? 'Пора сажать в грунт! 3–4 дня держите в тени под пакетом.' : 'Корни длинные и начинают путаться: сажайте, аккуратно расправив их.');
    };
    h.bindRange(el, 'lab-rt-d', v => `${v}-й`, v => { day = v; upd(); });
    h.bindPick(el, 'lab-rt-t', v => { temp = +v; upd(); });
    upd();
  });

  register('seedlife', el => {
    el.innerHTML = h.head('Срок жизни семян', 'Правила Харрингтона относительно хранения при 20 °C и влажности семян 10 %, когда базилик держит всхожесть около 4–5 лет.', true) +
      `<div class="lab-controls">${h.chipsHtml('lab-sl-p', 'Где храним', [['room', 'Шкаф в квартире'], ['fridge', 'Холодильник и силикагель'], ['warm', 'Тёплая кладовка']], 'room')}${h.rangeHtml('lab-sl-t', 'Температура', 0, 30, 1, 22)}${h.rangeHtml('lab-sl-m', 'Влажность семян', 5, 14, 0.5, 9)}</div>
       <div class="sl-scale"><i id="lab-sl-bar"></i><span style="left:0%">×¼</span><span style="left:25%">×1</span><span style="left:50%">×4</span><span style="left:75%">×16</span><span style="left:100%">×64</span></div>` +
      h.readHtml([['Множитель срока', 'lab-sl-x'], ['Примерно', 'lab-sl-y']]);
    let T = 22, M = 9;
    const P = { room: [22, 9], fridge: [5, 6], warm: [28, 12] };
    const upd = () => {
      const k = Math.pow(2, (20 - T) / 5) * Math.pow(2, 10 - M);
      $('#lab-sl-bar', el).style.width = `${clamp((Math.log2(k) + 2) / 8, 0.01, 1) * 100}%`;
      set(el, 'lab-sl-x', k >= 1 ? `× ${k >= 10 ? fmt0(k) : fmt(k)}` : `× ${fmt(k, 2)}`);
      const y = 4.5 * k;
      set(el, 'lab-sl-y', y > 50 ? 'десятки лет — условия семенного банка' : y < 1 ? `${fmt0(y * 12)} мес.` : `${fmt(y)} лет`);
    };
    const tr = h.bindRange(el, 'lab-sl-t', v => `${v} °C`, v => { T = v; upd(); });
    const mr = h.bindRange(el, 'lab-sl-m', v => `${fmt(v)} %`, v => { M = v; upd(); });
    h.bindPick(el, 'lab-sl-p', k => { tr.set(P[k][0]); mr.set(P[k][1]); });
    upd();
  });

  /* ================================================================== */
  /* ПРОБЛЕМЫ                                                            */
  /* ================================================================== */
  register('pigment', el => {
    el.innerHTML = h.head('Смешайте пигменты', 'Цвет листа по закону Бера — Ламберта: каждый пигмент поглощает свою часть спектра, отражённый остаток и есть цвет.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.chipsHtml('lab-pg-p', 'Пример', [['ok', 'Здоровый'], ['n', 'Нехватка азота'], ['p', 'Нехватка фосфора'], ['opal', 'Фиолетовый сорт'], ['old', 'Старый лист']], 'ok')}
          ${h.rangeHtml('lab-pg-c', 'Хлорофиллы', 0, 100, 1, 85)}${h.rangeHtml('lab-pg-k', 'Каротиноиды', 0, 100, 1, 60)}${h.rangeHtml('lab-pg-a', 'Антоцианы', 0, 100, 1, 5)}</div>
        <div class="pg-out"><svg viewBox="-60 -125 120 135" class="pg-leaf" aria-hidden="true"><use href="#pl-leaf" id="lab-pg-leaf" class="pl-leaf" transform="scale(1)"/></svg><p class="pg-verdict" id="lab-pg-v"></p></div>
      </div>`;
    const K = { c: [2.2, 0.55, 2.2], k: [0.02, 0.35, 1.8], a: [0.25, 2.2, 0.3] };
    const base = [0.47, 0.48, 0.44];
    const v = { c: 85, k: 60, a: 5 };
    const PRE = { ok: [85, 60, 5], n: [22, 55, 5], p: [70, 55, 55], opal: [60, 30, 100], old: [8, 42, 12] };
    const toS = x => { x = clamp(x, 0, 1); return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255); };
    const upd = () => {
      const rgb = [0, 1, 2].map(i => toS(base[i] * Math.exp(-(v.c / 100 * K.c[i] + v.k / 100 * K.k[i] + v.a / 100 * K.a[i]))));
      $('#lab-pg-leaf', el).style.fill = `rgb(${rgb.join(' ')})`;
      const verdict = v.c < 20 && v.k < 30 ? 'Ткань обесцвечена: так выглядит некроз или сильный ожог.' : v.a > 55 && v.c > 35 ? 'Фиолетовый оттенок: антоцианы. У зелёного сорта — сигнал холода или нехватки фосфора.' : v.c < 40 && v.k >= 30 ? 'Хлороз: хлорофилла мало, проступили жёлтые каротиноиды. Ищите нехватку азота (снизу), магния или железа (между жилками).' : 'Здоровый зелёный: хлорофилл маскирует остальные пигменты.';
      set(el, 'lab-pg-v', verdict);
    };
    const rc = h.bindRange(el, 'lab-pg-c', x => x + ' %', x => { v.c = x; upd(); });
    const rk = h.bindRange(el, 'lab-pg-k', x => x + ' %', x => { v.k = x; upd(); });
    const ra = h.bindRange(el, 'lab-pg-a', x => x + ' %', x => { v.a = x; upd(); });
    h.bindPick(el, 'lab-pg-p', k => { rc.set(PRE[k][0]); rk.set(PRE[k][1]); ra.set(PRE[k][2]); });
    upd();
  });

  register('dm', el => {
    el.innerHTML = h.head('Риск ложной мучнистой росы', 'Качественная оценка по трём условиям: ночная влажность для спороношения, мокрые листья для заражения и температура.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-dm-rh', 'Влажность воздуха ночью', 60, 100, 1, 90)}${h.rangeHtml('lab-dm-w', 'Листья мокрые', 0, 12, 0.5, 4)}${h.rangeHtml('lab-dm-t', 'Температура ночью', 10, 28, 1, 18)}</div>
        <div class="dm-out"><svg class="dm-gauge" viewBox="0 0 220 130" aria-hidden="true"><path class="g-track" d="M20 115 A90 90 0 0 1 200 115"/><path class="g-low" d="M20 115 A90 90 0 0 1 47.4 51.4"/><path class="g-mid" d="M47.4 51.4 A90 90 0 0 1 145 27.4"/><path class="g-high" d="M145 27.4 A90 90 0 0 1 200 115"/><line class="g-needle" id="lab-dm-n" x1="110" y1="115" x2="110" y2="36"/><circle class="g-hub" cx="110" cy="115" r="7"/></svg><p class="dm-level" id="lab-dm-l"></p></div>
      </div>` + h.readHtml([['Что делать', 'lab-dm-v', 'is-wide']]);
    const v = { rh: 90, w: 4, t: 18 };
    const upd = () => {
      const s = clamp((v.rh - 82) / 12, 0, 1), i = clamp(v.w / 3, 0, 1), tf = Math.exp(-Math.pow((v.t - 20) / 7, 2));
      const risk = clamp((s * 0.55 + i * 0.45) * tf * (s > 0 ? 1 : 0.4), 0, 1);
      $('#lab-dm-n', el).setAttribute('transform', `rotate(${r1(-90 + risk * 180)} 110 115)`);
      const lvl = risk < 0.25 ? ['Низкий', 'is-low'] : risk < 0.6 ? ['Умеренный', 'is-mid'] : ['Высокий', 'is-high'];
      set(el, 'lab-dm-l', `<span class="zone-pill ${lvl[1]}">${lvl[0]} риск</span>`);
      const tips = [];
      if (v.rh > 85) tips.push('проветривайте ночью или включите вентилятор');
      if (v.w > 2) tips.push('поливайте утром и под корень, чтобы листья успевали высохнуть');
      if (v.t >= 15 && v.t <= 25 && risk > 0.25) tips.push('осматривайте нижнюю сторону листьев каждые 2–3 дня');
      set(el, 'lab-dm-v', tips.length ? h.nb(tips.join('; ').replace(/^./, c => c.toUpperCase()) + '.') : 'Условия для болезни неблагоприятны. Продолжайте в том же духе.');
    };
    h.bindRange(el, 'lab-dm-rh', x => x + ' %', x => { v.rh = x; upd(); });
    h.bindRange(el, 'lab-dm-w', x => `${fmt(x)} ч`, x => { v.w = x; upd(); });
    h.bindRange(el, 'lab-dm-t', x => `${x} °C`, x => { v.t = x; upd(); });
    upd();
  });

  register('aphid', el => {
    el.innerHTML = h.head('Колония из одной тли', 'Модель при 20–25 °C: взрослеют за 8 дней, рожают по 3 личинки в день около трёх недель. Перекорм азотом ускоряет и то и другое.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-ap-d', 'День', 0, 28, 1, 14)}<div class="lab-seg-wrap"><span class="lab-label">Условия</span><div class="chips-row lab-chips" id="lab-ap-x"><button class="chip" type="button" data-x="n" aria-pressed="false">Перекорм азотом</button><button class="chip" type="button" data-x="soap" aria-pressed="false">Мыло на 10-й день</button></div></div></div>
       <div class="lab-chart" id="lab-ap-ch"></div>` + h.readHtml([['Тлей на кусте', 'lab-ap-n'], ['Вывод', 'lab-ap-v', 'is-wide']]);
    const st = { d: 14, n: false, soap: false };
    const sim = () => {
      const mat = st.n ? 7 : 8, fec = st.n ? 4 : 3, life = 20;
      let co = [{ age: mat + 1, n: 1 }];
      const tot = [1];
      for (let d = 1; d <= 28; d++) {
        const born = co.filter(c => c.age >= mat).reduce((a, c) => a + c.n * fec, 0);
        co.forEach(c => { c.age++; });
        co = co.filter(c => c.age < mat + life);
        co.push({ age: 0, n: born });
        if (st.soap && d === 10) co.forEach(c => { c.n *= 0.1; });
        tot.push(co.reduce((a, c) => a + c.n, 0));
      }
      return tot;
    };
    let data = sim();
    const ch = h.chart($('#lab-ap-ch', el), {
      label: 'Численность тли по дням, логарифмическая шкала',
      draw(w, hh) {
        const P = h.plot({ w, h: hh, x: [-0.5, 28.5], y: [0, 6], xticks: [0, 7, 14, 21, 28], yticks: [0, 1, 2, 3, 4, 5, 6], fx: v => v + ' д', fy: v => ['1', '10', '100', '1 тыс', '10 тыс', '100 тыс', '1 млн'][v], ylab: 'тлей' });
        let s = P.s;
        const bw = Math.max(2, P.iw / 29 - 3);
        data.forEach((v, d) => {
          const y = Math.log10(Math.max(1, v));
          const x = P.X(d) - bw / 2;
          s += `<rect class="vbar ${d === st.d ? 's1' : 'is-muted'}" x="${r1(x)}" y="${P.Y(y)}" width="${r1(bw)}" height="${r1(P.Y(0) - P.Y(y))}" rx="2"/>`;
        });
        const v = data[st.d];
        s += `<text class="bar-lbl" x="${P.X(st.d)}" y="${r1(P.Y(Math.log10(Math.max(1, v))) - 7)}" text-anchor="middle">${fmt0(v)}</text>`;
        return s;
      },
      onPointer(x, y, w, hh, kind) { if (kind !== 'set') return; const P = h.plot({ w, h: hh, x: [-0.5, 28.5], y: [0, 6] }); rng.set(clamp(Math.round(P.inv(x)), 0, 28)); }
    });
    const upd = () => {
      data = sim();
      const v = data[st.d];
      set(el, 'lab-ap-n', fmt0(v));
      set(el, 'lab-ap-v', v < 20 ? 'Пока единицы — смойте водой или снимите руками.' : v < 300 ? 'Колония растёт: мыльный раствор, повтор через 5–7 дней.' : 'Вспышка: обработка каждые 5 дней и срезка самых заселённых верхушек.');
      ch.redraw();
    };
    const rng = h.bindRange(el, 'lab-ap-d', x => `${x}-й`, x => { st.d = x; upd(); });
    $('#lab-ap-x', el).addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      st[b.dataset.x] = !st[b.dataset.x];
      b.setAttribute('aria-pressed', String(st[b.dataset.x]));
      upd();
    });
    upd();
  });

  /* ================================================================== */
  /* ВКУС                                                                */
  /* ================================================================== */
  register('trichome', el => {
    el.innerHTML = h.head('Лист под микроскопом', 'Поперечный разрез листа. Коснитесь железки или нажмите «Потереть лист»: масло под кутикулой вырвется наружу.') +
      `<div class="lab-actions"><button class="btn btn-primary btn-small" type="button" id="lab-tr-rub">${h.icon('nose')}Потереть лист</button><button class="btn btn-ghost btn-small" type="button" id="lab-tr-reset">Восстановить</button></div>
       <div class="tr-wrap"><div class="lab-scroll"><svg class="tr-svg" id="lab-tr-svg" viewBox="0 0 720 300" role="group" aria-label="Разрез листа базилика с железистыми волосками"></svg></div><div class="aroma-layer" id="lab-tr-aroma" aria-hidden="true"></div></div>
       <div class="lab-grid tr-grid">
         <div class="lab-controls">${h.rangeHtml('lab-tr-age', 'Лист', 0, 100, 1, 20)}<p class="lab-foot">Железки закладываются, пока лист крошечный. Когда лист растёт, их число почти не меняется, и на каждом квадратном миллиметре их становится меньше.</p></div>
         <div class="tr-top"><svg id="lab-tr-top" viewBox="0 0 200 200" role="img" aria-label="Вид сверху на участок листа с железками"></svg><p class="tick" id="lab-tr-cap"></p></div>
       </div>`;
    const svg = $('#lab-tr-svg', el);
    const GL = [[70, 'pel'], [200, 'cap'], [300, 'pel'], [430, 'pel'], [520, 'cap'], [566, 'hair']];
    const R = 572;
    let s = '';
    s += `<rect class="tr-air" x="0" y="0" width="${R}" height="84"/>`;
    s += `<path class="tr-cut" d="M0 84 H${R}"/>`;
    for (let x = 0; x < R - 20; x += 40) s += `<rect class="tr-epi" x="${x + 1}" y="86" width="38" height="22" rx="7"/>`;
    for (let x = 0; x < R - 12; x += 24) {
      s += `<rect class="tr-pal" x="${x + 2}" y="112" width="20" height="62" rx="9"/>`;
      for (let k = 0; k < 4; k++) s += `<ellipse class="tr-chl" cx="${x + 7 + (k % 2) * 10}" cy="${122 + k * 13}" rx="3.2" ry="2.2"/>`;
    }
    for (let i = 0; i < 22; i++) { const x = 16 + i * 27 + (i % 2) * 6, y = 196 + (i % 3) * 12; if (Math.abs(x - 470) > 30) s += `<ellipse class="tr-spo" cx="${x}" cy="${y}" rx="${14 + (i % 3) * 2}" ry="10"/>`; }
    s += `<ellipse class="tr-vein" cx="470" cy="204" rx="24" ry="17"/>`;
    for (let x = 0; x < R - 16; x += 36) if (x !== 252) s += `<rect class="tr-epi" x="${x + 1}" y="236" width="34" height="18" rx="6"/>`;
    s += `<g class="tr-stoma"><ellipse cx="261" cy="245" rx="8" ry="9"/><ellipse cx="279" cy="245" rx="8" ry="9"/></g>`;
    s += `<path class="tr-cut" d="M0 256 H${R}"/>`;
    GL.forEach(([x, k], i) => {
      if (k === 'pel') s += `<g class="tr-gland is-pel" data-i="${i}" tabindex="0" role="button" aria-label="Пельтатная железка с маслом"><rect class="tr-stalk" x="${x - 5}" y="72" width="10" height="14" rx="3"/><path class="tr-head" d="M${x - 17} 72 h34 v-8 h-34 z"/><path class="tr-oil" d="M${x - 19} 64 C ${x - 20} 36 ${x + 20} 36 ${x + 19} 64 Z"/></g>`;
      else if (k === 'cap') s += `<g class="tr-gland is-cap" data-i="${i}"><rect class="tr-stalk" x="${x - 3}" y="68" width="6" height="18" rx="3"/><circle class="tr-cap" cx="${x}" cy="62" r="8"/></g>`;
      else s += `<path class="tr-hair" d="M${x} 86 C ${x + 4} 60 ${x - 8} 40 ${x + 8} 22"/>`;
    });
    const L = (x1, y1, x2, y2, t, anchor = 'start') => `<line class="tr-lead" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text class="tr-lbl" x="${x2 + (anchor === 'end' ? -4 : 4)}" y="${y2 + 4}" text-anchor="${anchor}">${t}</text>`;
    s += L(300, 42, 332, 16, 'масло под кутикулой');
    s += L(200, 54, 150, 20, 'головчатый волосок', 'end');
    s += L(R - 4, 84, R + 8, 70, 'кутикула');
    s += L(R - 4, 97, R + 8, 100, 'эпидермис');
    s += L(R - 4, 143, R + 8, 143, 'столбчатая ткань');
    s += L(R - 4, 200, R + 8, 196, 'губчатая ткань');
    s += L(R - 4, 245, R + 8, 245, 'нижний эпидермис');
    s += L(270, 250, 300, 282, 'устьице');
    s += L(470, 218, 500, 282, 'жилка');
    svg.innerHTML = s;
    const layer = $('#lab-tr-aroma', el);
    const burst = g => {
      if (g.classList.contains('is-burst')) return;
      g.classList.add('is-burst');
      const r = g.getBoundingClientRect();
      S.aroma(layer, r.left + r.width / 2, r.top + r.height * 0.3);
    };
    svg.addEventListener('click', e => { const g = e.target.closest('.tr-gland.is-pel'); if (g) burst(g); });
    svg.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.tr-gland')) { e.preventDefault(); burst(e.target.closest('.tr-gland')); } });
    $('#lab-tr-rub', el).addEventListener('click', () => $$('.tr-gland.is-pel', svg).forEach((g, i) => setTimeout(() => burst(g), i * 260)));
    $('#lab-tr-reset', el).addEventListener('click', () => $$('.tr-gland', svg).forEach(g => g.classList.remove('is-burst')));
    const top = $('#lab-tr-top', el);
    const pts = Array.from({ length: 60 }, (_, i) => [(i * 71 % 97) / 97, (i * 43 % 89) / 89]);
    const age = a => {
      const scale = 1 + a / 100 * 3;
      const n = Math.round(60 / (scale * scale) * 3.2);
      let t = `<rect class="tr-surf" width="200" height="200" rx="14"/>`;
      for (let i = 0; i < 26; i++) t += `<path class="tr-cellline" d="M${(i * 37) % 200} 0 l ${10 + (i % 3) * 6} 200"/>`;
      pts.slice(0, Math.min(60, n)).forEach(([x, y]) => { t += `<circle class="tr-dot" cx="${r1(10 + x * 180)}" cy="${r1(10 + y * 180)}" r="${r1(5.5)}"/>`; });
      top.innerHTML = t;
      set(el, 'lab-tr-cap', `${a < 30 ? 'молодой верхний лист' : a < 70 ? 'лист среднего возраста' : 'старый нижний лист'}: ≈ ${Math.min(60, n)} железок на этом участке`);
    };
    h.bindRange(el, 'lab-tr-age', a => a < 30 ? 'молодой' : a < 70 ? 'средний' : 'старый', age);
    age(20);
  });

  register('pathway', el => {
    const NODES = {
      sug: [477, 30, 'Сахара фотосинтеза'], ipp: [290, 96, 'IPP и DMAPP · C₅'], gpp: [173, 170, 'ГДФ · C₁₀'], fpp: [410, 170, 'ФДФ · C₁₅'], ger: [285, 250, 'Гераниол'],
      phe: [664, 96, 'Фенилаланин'], cia: [664, 170, 'Коричная кислота'], con: [664, 250, 'Кониферилацетат'], chv: [535, 250, 'Хавикол']
    };
    const ENDS = {
      lin: [58, 250], cin: [173, 250], cit: [285, 330], car: [410, 250], est: [535, 330], mci: [817, 250], eug: [664, 330], meu: [664, 410]
    };
    const PATHS = {
      lin: ['sug', 'ipp', 'gpp', 'lin'], cin: ['sug', 'ipp', 'gpp', 'cin'], cit: ['sug', 'ipp', 'gpp', 'ger', 'cit'], car: ['sug', 'ipp', 'fpp', 'car'],
      est: ['sug', 'phe', 'cia', 'chv', 'est'], mci: ['sug', 'phe', 'cia', 'mci'], eug: ['sug', 'phe', 'cia', 'con', 'eug'], meu: ['sug', 'phe', 'cia', 'con', 'eug', 'meu']
    };
    const ENZ = { 'gpp-lin': 'LIS', 'gpp-cin': 'CinS', 'gpp-ger': 'GES', 'fpp-car': 'TPS', 'phe-cia': 'PAL', 'cia-mci': 'CCMT', 'chv-est': 'CVOMT', 'con-eug': 'EGS', 'eug-meu': 'EOMT', 'cia-chv': 'CVS' };
    const INFO = {
      lin: ['Линалоол', 'Линалоолсинтаза (LIS) превращает геранилдифосфат в линалоол одним шагом. Её активность — главное отличие европейских сортов.', 'генуэзский, греческий, фиолетовые'],
      cin: ['1,8-Цинеол', 'Цинеолсинтаза замыкает геранилдифосфат в бициклический эфир.', 'генуэзский, африканский синий'],
      cit: ['Цитраль', 'Гераниолсинтаза (GES) даёт гераниол, а дегидрогеназы окисляют его до альдегидов гераниаля и нераля — вместе это цитраль.', 'лимонный, лаймовый'],
      car: ['β-Кариофиллен', 'Сесквитерпенсинтазы сворачивают пятнадцатиуглеродный ФДФ в кольца.', 'тулси, лимонный'],
      est: ['Эстрагол', 'Хавикол-O-метилтрансфераза (CVOMT) пришивает метильную группу к хавиколу. Сильный фермент — анисовый тайский базилик.', 'тайский, фиолетовые'],
      mci: ['Метилциннамат', 'Метилтрансфераза коричной кислоты (CCMT) превращает её в метиловый эфир с запахом корицы и клубники.', 'коричный'],
      eug: ['Эвгенол', 'Эвгенолсинтаза (EGS) снимает ацетатную группу с кониферилацетата — получается эвгенол.', 'генуэзский, гвоздичный, тулси'],
      meu: ['Метилэвгенол', 'Эвгенол-O-метилтрансфераза (EOMT) метилирует эвгенол. Много её у тулси.', 'тулси']
    };
    el.innerHTML = h.head('Два конвейера аромата', 'Слева терпены из изопреновых «кирпичиков», справа фенилпропаноиды из аминокислоты фенилаланина. Выберите молекулу внизу схемы, чтобы подсветить её путь.') +
      `<div class="lab-scroll"><svg class="pw-svg" id="lab-pw-svg" viewBox="0 0 900 464" role="group" aria-label="Схема биосинтеза ароматических веществ базилика"></svg></div>
       <div class="pw-info" id="lab-pw-info" aria-live="polite"></div>`;
    const svg = $('#lab-pw-svg', el);
    const pos = id => NODES[id] || ENDS[id];
    const nw = k => NODES[k] ? Math.max(90, NODES[k][2].length * 8.3 + 20) : Math.max(96, h.molName(k).length * 8.6 + 24);
    const draw = sel => {
      const path = PATHS[sel] || [];
      const on = new Set(path);
      const edges = new Set(path.slice(1).map((b, i) => path[i] + '-' + b));
      let s = `<defs><marker id="lab-pw-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="pw-ah"/></marker></defs>`;
      s += `<text class="pw-zone" x="230" y="452" text-anchor="middle">терпеновый путь</text><text class="pw-zone" x="676" y="452" text-anchor="middle">фенилпропаноидный путь</text>`;
      const E = [['sug', 'ipp'], ['sug', 'phe'], ['ipp', 'gpp'], ['ipp', 'fpp'], ['gpp', 'lin'], ['gpp', 'cin'], ['gpp', 'ger'], ['ger', 'cit'], ['fpp', 'car'], ['phe', 'cia'], ['cia', 'mci'], ['cia', 'chv'], ['cia', 'con'], ['chv', 'est'], ['con', 'eug'], ['eug', 'meu']];
      E.forEach(([a, b]) => {
        const A = pos(a), B = pos(b);
        const hot = edges.has(a + '-' + b);
        let x1 = A[0], y1 = A[1] + 16, x2 = B[0], y2 = B[1] - 18;
        if (Math.abs(A[1] - B[1]) < 8) { x1 = A[0] + nw(a) / 2; y1 = A[1]; x2 = B[0] - nw(b) / 2 - 4; y2 = B[1]; }
        s += `<line class="pw-edge${hot ? ' is-hot' : ''}" x1="${r1(x1)}" y1="${y1}" x2="${r1(x2)}" y2="${y2}" marker-end="url(#lab-pw-ah)"/>`;
        const enz = ENZ[a + '-' + b];
        if (enz) s += `<text class="pw-enz${hot ? ' is-hot' : ''}" x="${r1((x1 + x2) / 2 + (x2 >= x1 ? 6 : -6))}" y="${r1((y1 + y2) / 2 + 2)}" text-anchor="${x2 >= x1 ? 'start' : 'end'}">${enz}</text>`;
      });
      Object.entries(NODES).forEach(([k, [x, y, t]]) => {
        const w = nw(k);
        s += `<g class="pw-node${on.has(k) ? ' is-hot' : ''}"><rect x="${r1(x - w / 2)}" y="${y - 15}" width="${r1(w)}" height="30" rx="15"/><text x="${x}" y="${y + 5}" text-anchor="middle">${t}</text></g>`;
      });
      Object.entries(ENDS).forEach(([k, [x, y]]) => {
        const name = h.molName(k);
        const w = nw(k);
        const fam = h.FAM[h.molFam(k)].cls;
        s += `<g class="pw-end ${fam}${k === sel ? ' is-sel' : ''}${on.has(k) ? ' is-hot' : ''}" data-k="${k}" tabindex="0" role="button" aria-pressed="${k === sel}" aria-label="${name}"><rect x="${r1(x - w / 2)}" y="${y - 16}" width="${r1(w)}" height="32" rx="10"/><text x="${x}" y="${y + 5}" text-anchor="middle">${name}</text></g>`;
      });
      svg.innerHTML = s;
      const inf = INFO[sel];
      $('#lab-pw-info', el).innerHTML = inf ? `<h5>${inf[0]}</h5><p>${h.nb(inf[1])}</p><p class="muted">Сорта: ${inf[2]}.</p>` : '';
    };
    const pick = e => { const g = e.target.closest('.pw-end'); if (g) draw(g.dataset.k); };
    svg.addEventListener('click', pick);
    svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
    draw('eug');
  });

  register('molecules', el => {
    const ids = Object.keys(h.MOLS).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
    el.innerHTML = `<div class="mol-lab">
      <div class="mol-view"><div class="mol-stage"><canvas class="mol-canvas" id="lab-mol-cv" role="img" aria-label="Трёхмерная модель молекулы"></canvas><span class="mol-hint hand" aria-hidden="true">покрутите</span></div>
        <p class="mol-key"><span><i class="mk-c"></i>углерод</span><span><i class="mk-o"></i>кислород</span><span class="muted">водороды скрыты</span></p></div>
      <div class="mol-card" id="lab-mol-card" aria-live="polite"></div>
    </div>
    <div class="chips-row lab-chips mol-chips" id="lab-mol-chips" role="group" aria-label="Молекулы">${ids.map(id => `<button class="chip" type="button" data-v="${id}" aria-pressed="${id === 'lin'}"><i class="fam-dot ${h.FAM[h.MOLS[id].fam].cls}"></i>${h.MOLS[id].name}</button>`).join('')}</div>
    <div class="vol-scale" aria-label="Шкала летучести по температуре кипения">
      <div class="vol-track">${ids.map((id, i) => { const m = h.MOLS[id]; return `<button type="button" class="vol-chip ${h.FAM[m.fam].cls}" data-v="${id}" style="--x:${((m.bp - 115) / 160 * 100).toFixed(1)}%"><b>${m.name.replace(/^\(Z\)-3-/, '')}</b><small>${m.bp} °C</small></button>`; }).join('')}</div>
      <div class="vol-axis"><span>верхние ноты · улетают первыми</span><span>сердце</span><span>база · держатся дольше</span></div>
    </div>
    <ul class="legend">${Object.values(h.FAM).map(f => `<li><i class="fam-dot ${f.cls}"></i>${f.name}</li>`).join('')}</ul>`;
    const viewer = h.MolViewer($('#lab-mol-cv', el), 'lin');
    const card = id => {
      const m = h.MOLS[id];
      $('#lab-mol-card', el).innerHTML = `<p class="lab-kicker">${m.cls}</p><h4 class="mol-name">${m.name}</h4>${m.alt ? `<p class="mol-alt">${m.alt}</p>` : ''}
        <p class="mol-formula">${h.sub(m.formula)} · кипит при ${m.bp} °C</p>
        <dl class="data-rows"><div><dt>Пахнет</dt><dd>${m.smell}</dd></div><div><dt>Есть также в</dt><dd>${m.where}</dd></div><div><dt>Сорта базилика</dt><dd>${m.basil}</dd></div></dl>
        <p>${h.nb(m.note)}</p>`;
      $$('[data-v]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === id)));
    };
    el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b || !el.contains(b)) return; viewer.set(b.dataset.v); card(b.dataset.v); });
    card('lin');
    const track = $('.vol-track', el);
    const layout = () => {
      const W = track.clientWidth;
      if (!W) return;
      const rows = [];
      $$('.vol-chip', track).forEach(c => {
        const w = c.offsetWidth, x = parseFloat(c.style.getPropertyValue('--x')) / 100 * W;
        const left = clamp(x - w / 2, 4, W - w - 4);
        let r = rows.findIndex(end => end + 6 < left);
        if (r < 0) { rows.push(0); r = rows.length - 1; }
        rows[r] = left + w;
        c.style.left = left + 'px';
        c.style.translate = '0 0';
        c.style.top = (8 + r * 42) + 'px';
      });
      track.style.height = (rows.length * 42 + 12) + 'px';
    };
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(track);
  });

  register('chemotype', el => {
    const cols = h.CHEMO_COLS;
    el.innerHTML = `<div class="lab-scroll"><table class="chemo" id="lab-ch-t"><caption class="sr-only">Доли ароматических веществ в эфирном масле сортов базилика, проценты</caption>
      <thead><tr><th scope="col">Сорт</th>${cols.map(c => `<th scope="col"><span>${h.molName(c).replace(/^1,8-/, '').replace(/^α-|^β-/, '')}</span></th>`).join('')}</tr></thead>
      <tbody>${h.CHEMO.map((r, i) => `<tr data-i="${i}"><th scope="row"><button type="button" class="chemo-row" data-i="${i}" aria-pressed="${i === 0}">${r.name}</button></th>${cols.map(c => {
        const v = r.p[c] || 0;
        return `<td>${v ? `<span class="bub ${h.FAM[h.molFam(c)].cls}" style="--s:${(Math.sqrt(v / 75) * 34).toFixed(1)}px" title="${h.molName(c)}: ${v} %"></span>${v >= 10 ? `<small>${v}</small>` : `<span class="sr-only">${v} %</span>`}` : '<span class="bub-none" aria-label="нет">·</span>'}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>
      <ul class="legend">${['mono', 'phen', 'sesq'].map(k => `<li><i class="fam-dot ${h.FAM[k].cls}"></i>${h.FAM[k].name}</li>`).join('')}<li class="muted">числа — доля в масле, %; ориентир по опубликованным анализам</li></ul>
      <div class="chemo-info" id="lab-ch-info" aria-live="polite"></div>`;
    const info = i => {
      const r = h.CHEMO[i];
      const top = Object.entries(r.p).sort((a, b) => b[1] - a[1]).slice(0, 3);
      $('#lab-ch-info', el).innerHTML = `<h5>${r.name}</h5><p>${h.nb(r.why)}</p><p class="chemo-top">${top.map(([k, v]) => `<span><i class="fam-dot ${h.FAM[h.molFam(k)].cls}"></i>${h.molName(k)} <b>${v} %</b></span>`).join('')}</p>`;
      $$('.chemo-row', el).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
      $$('tbody tr', el).forEach(tr => tr.classList.toggle('is-sel', +tr.dataset.i === i));
    };
    el.addEventListener('click', e => { const b = e.target.closest('.chemo-row'); if (b) info(+b.dataset.i); });
    info(0);
  });

  register('heat', el => {
    const VAR = [['genovese', 'Генуэзский'], ['thai', 'Тайский'], ['lemon', 'Лимонный'], ['cinnamon', 'Коричный']];
    el.innerHTML = h.head('Когда класть базилик', 'Модель открытой кастрюли: скорость потери каждой молекулы пропорциональна давлению её пара, оценённому по правилу Трутона. Внизу — что останется от аромата выбранного сорта.', true) +
      `<div class="lab-controls lab-row-wrap"><div class="lab-seg-wrap"><span class="lab-label">Сорт</span>${h.chipsHtml('lab-ht-v', 'Сорт', VAR, 'genovese')}</div>${h.segHtml('lab-ht-t', 'Нагрев', [['60', '60 °C'], ['80', '80 °C'], ['100', 'Кипение']], '100')}${h.rangeHtml('lab-ht-m', 'Время на огне', 0, 30, 0.5, 10)}</div>
       <div class="heat-rows" id="lab-ht-rows"></div>
       <ul class="legend">${Object.values(h.FAM).map(f => `<li><i class="fam-dot ${f.cls}"></i>${f.name}</li>`).join('')}<li><i class="fam-dot is-ghost"></i>было в свежем листе</li></ul>` +
      h.readHtml([['Осталось аромата', 'lab-ht-tot'], ['Характер', 'lab-ht-c', 'is-wide']]);
    const st = { v: 'genovese', T: 100, m: 10 };
    const upd = () => {
      const prof = Object.assign({ hex: 3 }, h.CHEMO.find(c => c.id === st.v).p);
      const ids = Object.keys(prof).filter(k => h.MOLS[k]).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
      const T = st.T + 273.15;
      const sum0 = ids.reduce((a, k) => a + prof[k], 0);
      let sum1 = 0; const rest = {};
      ids.forEach(k => { const P = Math.exp(10.6 * (1 - (h.MOLS[k].bp + 273.15) / T)); const f = Math.exp(-1.48 * P * st.m); rest[k] = f; sum1 += prof[k] * f; });
      const mx = Math.max(...ids.map(k => prof[k]));
      $('#lab-ht-rows', el).innerHTML = ids.map(k => {
        const m = h.MOLS[k];
        return `<div class="heat-row"><span class="heat-name"><b>${m.name.replace(/^\(Z\)-3-/, '')}</b><small>${m.bp} °C</small></span>
          <span class="heat-bar"><i class="heat-ghost" style="--w:${prof[k] / mx * 100}%"></i><i class="heat-fill ${h.FAM[m.fam].cls}" style="--w:${prof[k] * rest[k] / mx * 100}%"></i></span>
          <span class="heat-val">${pct(rest[k])}</span></div>`;
      }).join('');
      set(el, 'lab-ht-tot', pct(sum1 / sum0));
      const lost = k => rest[k] < 0.5;
      const tone = [];
      if (st.m === 0) tone.push('свежий лист: все ноты на месте');
      else {
        if (lost('lin') && prof.lin > 10) tone.push('цветочная нота линалоола ушла');
        if (lost('cin')) tone.push('исчез освежающий холодок цинеола');
        if (rest.eug > 0.6 && prof.eug > 5) tone.push('осталась тёплая гвоздика эвгенола');
        if (rest.est > 0.5 && prof.est > 20) tone.push('анис эстрагола держится');
        if (rest.mci > 0.6 && prof.mci) tone.push('корица метилциннамата стойкая');
        if (prof.cit && lost('cit')) tone.push('лимон цитраля заметно ослаб');
        if (!tone.length) tone.push('аромат почти не изменился');
      }
      set(el, 'lab-ht-c', h.nb(tone.join('; ').replace(/^./, c => c.toUpperCase()) + '.' + (st.m > 5 && st.T >= 80 ? ' Кладите свежий базилик в последние 1–2 минуты или прямо в тарелку.' : '')));
    };
    h.bindPick(el, 'lab-ht-v', v => { st.v = v; upd(); });
    h.bindPick(el, 'lab-ht-t', v => { st.T = +v; upd(); });
    h.bindRange(el, 'lab-ht-m', v => `${fmt(v)} мин`, v => { st.m = v; upd(); });
    upd();
  });

  const PH_NAMES = [[3, 'красный', 'катион флавилия: молекула заряжена положительно и поглощает зелёный свет'], [5.5, 'бледно-розовый', 'часть молекул перешла в бесцветную карбинольную форму'], [7.5, 'фиолетовый', 'хиноидное основание — нейтральная окрашенная форма'], [10.5, 'синий, сине-зелёный', 'анионное хиноидное основание'], [15, 'жёлто-зелёный', 'кольцо раскрылось в халкон — пигмент необратимо разрушается']];
  register('anthocyanin', el => {
    el.innerHTML = h.head('Фиолетовый базилик и pH', 'Настой фиолетового базилика — природный индикатор, как краснокочанная капуста. Добавьте кислоту или щёлочь.') +
      `<div class="lab-grid anth-grid">
        <svg class="anth-jar" viewBox="0 0 140 170" aria-hidden="true">
          <path class="jar-glass" d="M30 20 H110 V150 Q110 162 98 162 H42 Q30 162 30 150 Z"/>
          <path id="lab-an-liq" d="M33 60 Q70 54 107 60 V149 Q107 159 97 159 H43 Q33 159 33 149 Z"/>
          <use href="#pl-leaf" class="pl-leaf anth-leaf" style="fill:url(#pl-grad-purple)" transform="translate(58 140) rotate(-20) scale(.42)"/>
          <use href="#pl-leaf" class="pl-leaf anth-leaf" style="fill:url(#pl-grad-purple)" transform="translate(84 146) rotate(28) scale(.36)"/>
          <path class="jar-shine" d="M40 32 V140"/>
        </svg>
        <div class="lab-controls">${h.rangeHtml('lab-an-ph', 'pH', 1, 12, 0.1, 7)}${h.chipsHtml('lab-an-q', 'Добавить', [['2.2', 'Лимонный сок'], ['2.8', 'Уксус'], ['7', 'Вода'], ['8.3', 'Пищевая сода'], ['10.5', 'Мыльная вода']], '7')}
          <p class="anth-out" id="lab-an-out" aria-live="polite"></p></div>
      </div>`;
    const stops = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => h.css('--ph-' + n) || '#888');
    const upd = ph => {
      const col = h.ramp([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => h.css('--ph-' + n) || stops[n - 1]), (ph - 1) / 11);
      $('#lab-an-liq', el).style.fill = col;
      const nm = PH_NAMES.find(p => ph < p[0]);
      $('#lab-an-out', el).innerHTML = `<b>pH ${fmt(ph)}: ${nm[1]}.</b> ${h.nb(nm[2])}.`;
    };
    const rng = h.bindRange(el, 'lab-an-ph', v => fmt(v), upd);
    h.bindPick(el, 'lab-an-q', v => rng.set(+v));
    upd(7);
  });

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
})();
