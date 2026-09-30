/* Гид по базилику — живые модели главы «Удобрения». Файл собирает scripts/build.py из src/labs/udobreniya/ — правьте там */
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
        const bw = Math.min(w - PAD * 2, 380), x0 = (w - bw) / 2, top = 28;
        const sw = bw / STAVES.length, two = sw < 36, bottom = hh - (two ? 44 : 30);
        // narrow staves: names in two staggered rows instead of shrinking the letters
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
          s += `<text class="stave-lbl${isLim ? ' is-limit' : ''}" x="${r1(x + sw / 2)}" y="${bottom + 16 + (two && i % 2 ? 14 : 0)}" text-anchor="middle">${name}</text>`;
          if (isLim) s += `<path class="barrel-spill" d="M${r1(x + sw / 2)} ${Y(min) - 1} q 8 6 6 20 t -2 ${r1(bottom - Y(min) - 12)}"/>`;
        });
        [0.3, 0.72].forEach(f => { s += `<rect class="hoop" x="${r1(x0 - 3)}" y="${r1(bottom - (bottom - top) * f)}" width="${r1(bw + 6)}" height="6" rx="3"/>`; });
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        if (kind !== 'set') return;
        const bw = Math.min(w - PAD * 2, 380), x0 = (w - bw) / 2, top = 28, bottom = hh - (bw / STAVES.length < 36 ? 44 : 30);
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
    el.innerHTML = h.head('Круговорот азота', 'Точки бегут по стрелкам с той скоростью, с какой работают микробы. Нитрификация ускоряется вдвое на каждые 10 °C и почти стоит в холоде и без кислорода.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-nc-t', 'Температура грунта', 4, 30, 1, 10)}<div class="lab-seg-wrap"><span class="lab-label">Грунт</span><div class="chips-row lab-chips"><button class="chip" type="button" id="lab-nc-w" aria-pressed="false">Переувлажнён</button></div></div></div>
       <div class="lab-chart nc-chart" id="lab-nc-ch"></div>` +
      h.readHtml([['Нитрификация', 'lab-nc-r'], ['Что получает базилик', 'lab-nc-v', 'is-wide']]);
    let T = 10, wet = false;
    // node: [x share, y px] for a wide and a narrow screen, title, subtitle
    const N = {
      org: [[0.15, 118], [0.24, 116], 'Органика', 'опад, остатки'],
      nh4: [[0.47, 118], [0.62, 116], 'NH₄⁺', 'аммоний'],
      no2: [[0.8, 176], [0.62, 256], 'NO₂⁻', 'нитрит'],
      no3: [[0.62, 282], [0.62, 396], 'NO₃⁻', 'нитрат'],
      root: [[0.25, 262], [0.24, 396], 'Корни', 'базилика'],
      n2: [[0.93, 34], [0.85, 32], 'N₂', 'в воздух'],
      leach: [[0.42, 352], [0.62, 500], 'Вымывание', 'с поливом вглубь']
    };
    // edges; the last item places the caption on a narrow screen: [x share, y, anchor] (wide screens: at the curve)
    const E = [
      ['org', 'nh4', 'аммонификация', 'amm', '', [0.43, 80, 'middle']],
      ['nh4', 'no2', 'Nitrosomonas', 'nit', 'microbe', [0.585, 190, 'end']],
      ['no2', 'no3', 'Nitrobacter', 'nit', 'microbe', [0.585, 330, 'end']],
      ['no3', 'root', 'поглощение', 'up', '', [0.43, 438, 'middle']],
      ['nh4', 'root', 'поглощение', 'up2', '', [0.34, 292, 'middle']],
      ['root', 'org', 'опад', 'fall', 'is-dash', [0.28, 256, 'start']],
      ['no3', 'n2', 'денитрификация', 'den', 'is-loss', null],
      ['no3', 'leach', 'полив', 'leach', 'is-loss', [0.66, 452, 'start']]
    ];
    const ch = h.chart($('#lab-nc-ch', el), {
      label: 'Схема круговорота азота в грунте',
      h: w => (w < 560 ? 540 : 380),
      draw(w, hh) {
        const narrow = w < 560, L = narrow ? 1 : 0, rnd = (() => { let s = 9; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
        const P = k => [N[k][L][0] * w, N[k][L][1]];
        const q = Math.pow(2, (T - 25) / 10) * (T < 6 ? 0.35 : 1);
        const R = { amm: Math.pow(2, (T - 25) / 10), nit: q * (wet ? 0.15 : 1), up: 0.8, up2: 0.6, fall: 0.25, den: wet ? 0.7 : 0, leach: 0.35 };
        const soil = 64;
        let s = `<defs><marker id="lab-nc-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="nc-ah"/></marker>
          <linearGradient id="lab-nc-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--soil-top)" stop-opacity="${wet ? 0.5 : 0.34}"/><stop offset="1" stop-color="var(--soil)" stop-opacity="${wet ? 0.62 : 0.46}"/></linearGradient></defs>`;
        // air above, soil below with crumbs and, when waterlogged, water filling the pores
        s += `<rect class="nc-air" x="0" y="0" width="${w}" height="${soil}"/><rect x="0" y="${soil}" width="${w}" height="${hh - soil}" fill="url(#lab-nc-soil)"/>`;
        s += `<path class="nc-surface" d="M0 ${soil}${Array.from({ length: Math.ceil(w / 24) + 1 }, (_, i) => `L${i * 24} ${r1(soil + Math.sin(i * 1.7) * 2.2)}`).join('')}"/>`;
        let crumbs = '';
        for (let i = 0; i < w * hh / 2600; i++) crumbs += `<circle cx="${r1(rnd() * w)}" cy="${r1(soil + 8 + rnd() * (hh - soil - 12))}" r="${r1(1.2 + rnd() * 2.6)}"/>`;
        s += `<g class="nc-crumbs">${crumbs}</g>`;
        if (wet) s += `<rect class="nc-water" x="0" y="${soil + 18}" width="${w}" height="${hh - soil - 18}"/>`;
        s += `<text class="nc-zone" x="10" y="20">воздух</text><text class="nc-zone" x="10" y="${soil + 20}">грунт</text>`;
        // a root reaching in from the surface
        const [rx0, ry] = P('root'), rx = narrow ? w * 0.09 : rx0;
        s += `<path class="nc-root-draw" d="M${r1(rx)} ${soil}C${r1(rx - 6)} ${r1(soil + 60)} ${r1(rx0 + 6)} ${r1(ry - 80)} ${r1(rx0)} ${r1(ry - 26)}M${r1(rx0 - 2)} ${r1(ry + 22)}C${r1(rx0 - 10)} ${r1(ry + 48)} ${r1(rx0 - 26)} ${r1(ry + 56)} ${r1(rx0 - 40)} ${r1(ry + 72)}M${r1(rx0 + 2)} ${r1(ry + 22)}C${r1(rx0 + 8)} ${r1(ry + 46)} ${r1(rx0 + 22)} ${r1(ry + 58)} ${r1(rx0 + 34)} ${r1(ry + 68)}"/>`;
        s += `<path class="nc-stem" d="M${r1(rx)} ${soil}V${soil - 26}M${r1(rx)} ${soil - 14}q-12 -4 -16 -14M${r1(rx)} ${soil - 20}q10 -3 14 -12"/>`;
        E.forEach(([a, b, lbl, key, cls, spot], i) => {
          const [x1, y1] = P(a), [x2, y2] = P(b);
          const rate = R[key], off = rate < 0.02;
          let d, lx, ly, anchor = 'middle', rot = 0;
          if (key === 'den') {
            // nitrogen gas leaves along the right edge, up into the air
            const sx = x1 + 46, xr = x2, top = y2 + 22;
            d = `M${r1(sx)} ${r1(y1)}H${r1(xr - 14)}Q${r1(xr)} ${r1(y1)} ${r1(xr)} ${r1(y1 - 14)}V${r1(top)}`;
            lx = xr + (narrow ? 13 : 14); ly = (y1 + top) / 2; rot = -90;
          } else {
            const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
            const sx = x1 + ux * 46, sy = y1 + uy * 26, ex = x2 - ux * 48, ey = y2 - uy * 28;
            const bend = a === 'nh4' && b === 'root' ? -22 : narrow && Math.abs(dx) < 8 ? 0 : 16;
            const mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend;
            d = `M${r1(sx)} ${r1(sy)}Q${r1(mx)} ${r1(my)} ${r1(ex)} ${r1(ey)}`;
            lx = (sx + 2 * mx + ex) / 4; ly = (sy + 2 * my + ey) / 4 + 4;
            if (narrow && spot) { lx = spot[0] * w; ly = spot[1]; anchor = spot[2]; }
          }
          s += `<path class="nc-edge ${cls}${off ? ' is-off' : ''}" d="${d}" marker-end="url(#lab-nc-ah)"/>`;
          if (!off && !h.reduce.matches) s += `<path class="nc-flow ${cls}" d="${d}" style="--spd:${r1(clamp(2.2 / rate, 1.2, 40))}s;--dl:-${r1(i * 0.37)}s"/>`;
          if (cls === 'microbe') {
            // the bacteria doing the work: little rods next to their name
            const bx = anchor === 'end' ? lx - 44 : lx;
            s += `<g class="nc-bugs${off ? ' is-off' : ''}">${[[-18, -16, 20], [-6, -22, -30], [8, -15, 60]].map(([ox, oy, a2]) => `<rect x="${r1(bx + ox - 5)}" y="${r1(ly + oy - 6)}" width="10" height="4.4" rx="2.2" transform="rotate(${a2} ${r1(bx + ox)} ${r1(ly + oy - 4)})"/>`).join('')}</g>`;
          }
          s += `<text class="nc-lbl${off ? ' is-off' : ''}${cls === 'microbe' ? ' is-bug' : ''}" x="${r1(lx)}" y="${r1(ly)}" text-anchor="${anchor}"${rot ? ` transform="rotate(${rot} ${r1(lx)} ${r1(ly)})"` : ''}>${lbl}</text>`;
        });
        Object.keys(N).forEach(k => {
          const [x, y] = P(k), [, , t, sub2] = N[k];
          const nw = Math.max(88, sub2.length * 6.2 + 18);
          const bx = clamp(x - nw / 2, 4, w - nw - 4);
          s += `<g class="nc-node nc-${k}"><rect x="${r1(bx)}" y="${y - 24}" width="${r1(nw)}" height="44" rx="14"/><text class="nc-t" x="${r1(bx + nw / 2)}" y="${y - 3}" text-anchor="middle">${t}</text><text class="nc-s" x="${r1(bx + nw / 2)}" y="${y + 13}" text-anchor="middle">${sub2}</text></g>`;
        });
        return s;
      }
    });
    const upd = () => {
      const q = Math.pow(2, (T - 25) / 10) * (T < 6 ? 0.35 : 1), nit = q * (wet ? 0.15 : 1);
      ch.redraw();
      set(el, 'lab-nc-r', pct(Math.min(1, nit)) + ' от скорости при 25 °C');
      set(el, 'lab-nc-v', wet ? 'Без кислорода нитрификация стоит, а нитрат уходит в воздух: азотное голодание при мокром грунте.' : T < 10 ? 'Холодно: органика почти не разлагается. Если нужна подкормка — минеральная, с нитратным азотом.' : T < 18 ? 'Микробы работают вполсилы: органика даёт азот медленно.' : 'Тепло и воздух: органика превращается в нитрат быстро, базилику хватает азота.');
    };
    h.bindRange(el, 'lab-nc-t', v => `${v} °C`, v => { T = v; upd(); });
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
})();
