/* Гид по базилику — живые модели главы «Удобрения». Файл собирает scripts/build.py из src/labs/udobreniya/ — правьте там */
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

  const { micro, ill } = window.BasilLibs;
  { const st = document.createElement('style'); st.dataset.labs = "udobreniya"; st.textContent = "/* osmosis */\n.osm-svg { width: 100%; max-width: 420px; height: auto; }\n.osm-soil { fill: color-mix(in srgb, var(--soil) 18%, var(--surface)); }\n.osm-ion-a { fill: var(--ser-2); opacity: .8; }\n.osm-ion-b { fill: var(--ser-3); opacity: .8; }\n.osm-wall { fill: color-mix(in srgb, var(--leaf-soft) 70%, var(--surface)); stroke: var(--stem); stroke-width: 3; }\n.osm-vac { fill: var(--water-fill); stroke: var(--water-line); stroke-width: 1.5; transition: rx .6s, ry .6s; }\n.osm-nuc { fill: var(--opal); opacity: .6; }\n.osm-flow { stroke: var(--water-line); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 6 5; animation: flow-dash 1s linear infinite; }\n.osm-ah { fill: var(--water-line); }\n@keyframes flow-dash { to { stroke-dashoffset: -22; } }\n\n/* flows */\n.flows-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 300px); }\n@media (max-width: 760px) { .flows-grid { grid-template-columns: 1fr; } }\n.flows-svg .roots path { fill: none; stroke: var(--root); stroke-width: 2.4; stroke-linecap: round; }\n.xylem, .phloem { fill: none; stroke-width: 3.2; stroke-linecap: round; stroke-dasharray: 3 9; }\n.xylem { stroke: var(--ser-4); animation: flow-dash 1.3s linear infinite; }\n.phloem { stroke: var(--ser-3); animation: flow-dash 2s linear infinite reverse; }\n.fl-tag { font: 700 12px/1 var(--font-body); fill: var(--danger); }\n.chl-fig { margin: 0; display: grid; gap: 8px; justify-items: center; text-align: center; }\n.chl-fig svg { width: 100%; max-width: 230px; height: auto; }\n.chl-fig figcaption { font-size: .84rem; color: var(--ink-3); }\n.chl-ring path { fill: color-mix(in srgb, var(--leaf-soft) 70%, transparent); stroke: var(--stem); stroke-width: 2.2; stroke-linejoin: round; }\n.chl-ring .chl-bridge { fill: none; stroke-dasharray: 4 4; }\n.chl-bonds path { stroke: var(--stem); stroke-width: 2; }\n.chl-mg { fill: var(--sci-phys); }\n.chl-mg-t { font: 700 12px/1 var(--font-mono); fill: var(--surface); }\n.chl-n circle { fill: var(--surface); stroke: var(--ser-2); stroke-width: 2; }\n.chl-n-t text { font: 700 10px/1 var(--font-mono); fill: var(--ser-2); }\n.chl-tail { fill: none; stroke: var(--ink-3); stroke-width: 2; stroke-linecap: round; }\n\n\n/* the plant is drawn in a 440-wide box that shrinks on a phone: captions are set larger to stay readable */\n.flows-svg .tick { font-size: 16px; }\n/* barrel */\n.barrel-water { fill: var(--water-fill); }\n.barrel-wave { fill: none; stroke: var(--water-line); stroke-width: 2; }\n.stave { fill: var(--wood-a); stroke: color-mix(in srgb, var(--wood-a) 70%, var(--ink)); stroke-width: 1; cursor: ns-resize; transition: y .35s var(--ease-float), height .35s var(--ease-float); }\n.stave:nth-child(odd) { fill: var(--wood-b); }\n.stave.is-limit { fill: var(--danger); stroke: var(--danger); }\n.stave.is-sel { stroke: var(--ink); stroke-width: 2; }\n.stave-lbl { font: 700 11px/1 var(--font-mono); fill: var(--ink-2); }\n.lab-tool[data-lab=\"window\"] .lab-chart svg { overflow: hidden; }\n.stave-lbl.is-limit { fill: var(--danger); }\n.hoop { fill: var(--hoop); opacity: .85; }\n.barrel-spill { fill: none; stroke: var(--water-line); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 5 6; animation: flow-dash .8s linear infinite; }\n.barrel-verdict { margin: 0; font-size: .92rem; color: var(--ink-2); }\n.barrel-verdict b { display: block; margin-bottom: 4px; color: var(--danger); }\n\n/* nitrogen cycle */\n.nc-chart { border-radius: 18px; overflow: hidden; border: 1px solid var(--line); }\n.nc-air { fill: var(--mic-air); }\n.nc-surface { fill: none; stroke: var(--soil-top); stroke-width: 2.5; opacity: .6; }\n.nc-crumbs circle { fill: var(--soil-grain); opacity: .28; }\n.nc-water { fill: var(--water-fill); opacity: .55; }\n.nc-zone { font: 600 10.5px/1 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; fill: var(--ink-3); }\n.nc-root-draw { fill: none; stroke: var(--root); stroke-width: 3.2; stroke-linecap: round; opacity: .85; }\n.nc-stem { fill: none; stroke: var(--stem); stroke-width: 3; stroke-linecap: round; }\n.nc-node rect { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1.4; }\n.nc-root rect { fill: var(--leaf-soft); stroke: var(--stem); }\n.nc-n2 rect, .nc-leach rect { fill: var(--surface-2); stroke-dasharray: 4 3; }\n.nc-t { font: 700 15px/1 var(--font-mono); fill: var(--ink); }\n.nc-s { font: 500 11px/1 var(--font-body); fill: var(--ink-3); }\n.nc-edge { fill: none; stroke: var(--ink-3); stroke-width: 2; opacity: .7; }\n.nc-edge.is-off { opacity: .3; stroke-dasharray: 3 5; }\n.nc-edge.is-dash { stroke-dasharray: 5 5; }\n.nc-ah { fill: var(--ink-3); }\n.nc-flow { fill: none; stroke: var(--sci-chem); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 1 26; animation: nc-run var(--spd, 3s) linear infinite; animation-delay: var(--dl, 0s); }\n.nc-flow.is-loss { stroke: var(--danger); }\n@keyframes nc-run { to { stroke-dashoffset: -108; } }\n.nc-lbl { font: 600 11px/1 var(--font-mono); fill: var(--ink-2); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }\n.nc-lbl.is-bug { font-style: italic; font-family: var(--font-body); font-weight: 700; }\n.nc-lbl.is-off, .nc-bugs.is-off { opacity: .4; }\n.nc-bugs rect { fill: var(--sci-chem); opacity: .75; }\n.nc-plate rect { fill: var(--surface); stroke: color-mix(in srgb, var(--sci-chem) 45%, var(--line-strong)); stroke-width: 1.2; }\n.nc-plate.is-off { opacity: .45; }\n/* oxides */\n.lab-row { margin-bottom: 12px; }\n.ox-rows { display: grid; gap: 12px; margin-top: 16px; }\n.ox-row { display: grid; grid-template-columns: 110px minmax(0, 1fr) 84px; gap: 12px; align-items: center; }\n.ox-name { display: grid; }\n.ox-name small { font: 500 .7rem/1.2 var(--font-mono); color: var(--ink-3); }\n.ox-bars { display: grid; gap: 4px; }\n.ox-bars i { height: 9px; width: var(--w); border-radius: 0 5px 5px 0; transition: width .4s var(--ease-float); }\n.ox-pack { background: var(--ser-muted); }\n.ox-real.s1 { background: var(--ser-1); } .ox-real.s2 { background: var(--ser-2); } .ox-real.s3 { background: var(--ser-3); }\n.ox-val { display: grid; text-align: right; }\n.ox-val b { font: 600 .95rem/1.1 var(--font-mono); }\n.ox-val small { font: 500 .72rem/1.2 var(--font-mono); color: var(--ink-3); }\n@media (max-width: 460px) { .ox-row { grid-template-columns: 80px minmax(0, 1fr) 70px; gap: 8px; } }\n\n/* EC scale */\n.ec-chart { margin-top: 10px; }\n.ec-track { fill: var(--surface-2); stroke: var(--line); }\n.ec-zone { fill: var(--band-good); }\n.ec-zone.is-bad { fill: color-mix(in srgb, var(--danger) 16%, transparent); }\n.ec-name { font: 600 11px/1 var(--font-mono); fill: var(--ink-2); }\n.ec-name.is-bad { fill: var(--danger); }\n.ec-lead { stroke: var(--ink-3); stroke-width: 1; stroke-dasharray: 2 2; }\n.ec-tick { stroke: var(--ink-3); stroke-width: 1; }\n.ec-needle line { stroke: var(--k); stroke-width: 4; stroke-linecap: round; }\n.ec-needle circle { fill: var(--surface); stroke: var(--k); stroke-width: 2.5; }\n.ec-val { font: 700 12px/1 var(--font-mono); fill: var(--k); }\n"; document.head.appendChild(st); }
  /* @use ills */
  /* Pictures of the Fertilizers chapter: what the lack of every element looks like (data-ill="def:<symbol>",
     B.ELEMENTS). The plant shows where the symptom starts — on the old lower leaves when the element moves
     inside the plant, on the young top ones when it does not; next to it, one such leaf close up. */
  const Fd = ill.F, qd = ill.q;
  // old: the two lower pairs; young: the top pair and the growing tip
  const OLD = i => i <= 1, YOUNG = (i, n) => i >= n - 1;
  const DEF = {
    N: { where: 'old', plant: (i) => (i === 0 ? { chl: 'uniform', k: 0.95 } : i === 1 ? { chl: 'uniform', k: 0.55 } : { pale: true }), leaf: { chl: 'uniform', k: 0.95 } },
    P: { where: 'old', small: true, plant: (i) => (OLD(i) ? { purple: i ? 0.5 : 0.9 } : {}), leaf: { purple: 0.9, tone: 'deep' } },
    K: { where: 'old', plant: (i) => (OLD(i) ? { necro: 'edge', k: i ? 0.45 : 0.85, curl: i ? 0 : 0.3 } : {}), leaf: { necro: 'edge', k: 0.8, curl: 0.3 } },
    Ca: { where: 'young', plant: (i, n) => (YOUNG(i, n) ? { curl: 0.8, tip: 0.8 } : {}), leaf: { curl: 0.8, tip: 0.7, necro: 'edge', k: 0.2, wide: 0.85 } },
    Mg: { where: 'old', plant: (i) => (OLD(i) ? { chl: 'interveinal', k: i ? 0.5 : 0.95 } : {}), leaf: { chl: 'interveinal', k: 0.9, necro: 'spots', seed: 8 } },
    S: { where: 'young', plant: (i, n) => (YOUNG(i, n) ? { chl: 'uniform', k: 0.75 } : i === n - 2 ? { chl: 'uniform', k: 0.3 } : {}), leaf: { chl: 'uniform', k: 0.75 } },
    Fe: { where: 'young', plant: (i, n) => (YOUNG(i, n) ? { chl: 'interveinal', k: 1 } : i === n - 2 ? { chl: 'interveinal', k: 0.45 } : {}), leaf: { chl: 'interveinal', k: 1 } },
    Mn: { where: 'young', plant: (i, n) => (YOUNG(i, n) ? { chl: 'mottle', stipple: 40 } : {}), leaf: { chl: 'mottle', stipple: 110, seed: 6 } },
    Zn: { where: 'top', rosette: true, plant: (i, n) => (YOUNG(i, n) ? { s: 0.2, wide: 0.55, chl: 'interveinal', k: 0.5 } : {}), leaf: { wide: 0.55, s: 0.62, chl: 'interveinal', k: 0.55 } },
    B: { where: 'young', deadTip: true, plant: (i, n) => (i === n ? { color: ill.mix('brown-d', 'brown', 0.5), curl: 0.6 } : i === n - 1 ? { curl: 0.5, bubbly: 1, wide: 0.8 } : {}), leaf: { curl: 0.5, bubbly: 1, wide: 0.8, tip: 0.35 } },
    Cu: { where: 'young', plant: (i, n, side) => (YOUNG(i, n) ? { tone: 'deep', a: side * (i === n ? 150 : 128) } : {}), leaf: { tone: 'deep', curl: 0.45 }, droop: true },
    Mo: { where: 'old', plant: (i) => (OLD(i) ? { pale: true, chl: 'mottle', curl: 0.55 } : {}), leaf: { pale: true, chl: 'mottle', curl: 0.65, seed: 5 } }
  };
  const WORD = { old: 'старый лист', young: 'молодой лист', top: 'верхушка' };
  function defPic(sym) {
    const d = DEF[sym] || DEF.N, w = 260, hh = 140, base = 116, H = d.small ? 58 : 72, n = 4;
    let g = `<rect data-bg width="${w}" height="${hh}" rx="14" fill="${Fd('bg')}"/><path data-bg d="M0 128H${w}V126Q${w} ${hh} ${w - 14} ${hh}H14Q0 ${hh} 0 126Z" fill="${Fd('bg-2')}"/>`;
    g += ill.pot(66, 124, 56, 20);
    g += ill.plant({ x: 66, y: base + 2, h: H, nodes: n, leafScale: d.rosette ? 0.82 : 0.78, seed: 5, leaf: d.plant });
    // where it starts: a dashed ring on the plant and a line to the close-up
    const zy = d.where === 'old' ? base - H * 0.42 : base - H * 0.98, zr = d.where === 'old' ? [46, 24] : [34, 20];
    g += `<ellipse class="ill-zone" cx="66" cy="${qd(zy)}" rx="${zr[0]}" ry="${zr[1]}"/><path class="ill-zone" d="M${66 + zr[0]} ${qd(zy)}L${150} ${qd(zy < 70 ? 60 : 84)}"/>`;
    // the close-up; a limp leaf (copper) hangs from its stalk
    g += ill.leaf(Object.assign(d.droop ? { x: 166, y: 38, a: 135, s: 0.9 } : { x: 196, y: 128, a: 6, s: 0.92 }, { seed: 4 }, d.leaf));
    g += ill.label(194, 18, WORD[d.where]);
    const el = ((window.BASIL && window.BASIL.ELEMENTS) || []).find(e => e.sym === sym);
    return ill.svg(w, hh, g, el ? `Нехватка элемента «${el.name}»: ${el.def}` : '');
  }
  illustrate('def', sym => defPic(sym), () => Object.keys(DEF));

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
          <text class="tick" x="-12" y="94" text-anchor="end">ксилема ↑</text><text class="tick" x="12" y="94">флоэма ↕</text>
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
    // the nodes: title and subtitle; where they stand depends on the width (lay() below)
    const N = {
      org: ['Органика', 'опад, остатки'],
      nh4: ['NH₄⁺', 'аммоний'],
      no2: ['NO₂⁻', 'нитрит'],
      no3: ['NO₃⁻', 'нитрат'],
      root: ['Корни', 'базилика'],
      n2: ['N₂', 'в воздух'],
      leach: ['Вымывание', 'с поливом вглубь']
    };
    const nodeW = k => Math.max(88, N[k][1].length * 6.2 + 18), NH = 44;
    /* every caption stands beside its arrow, never on it; the bacteria sit on plates on their arrows.
       Narrow: the nitrification ladder on the right, organic matter and the roots on the left, the root
       along the left edge. Wide: the ladder runs along the top and turns down to nitrate. */
    function lay(w) {
      const narrow = w < 560;
      const at = narrow
        ? (() => { const L = Math.max(64, 0.205 * w), R = Math.min(0.75 * w, w - 78); return { org: [L, 120], nh4: [R, 120], no2: [R, 250], no3: [R, 380], root: [L, 380], n2: [R, 32], leach: [R, 486] }; })()
        : { org: [0.13 * w, 118], nh4: [0.45 * w, 118], no2: [0.78 * w, 118], no3: [0.78 * w, 262], root: [0.13 * w, 262], n2: [0.93 * w, 34], leach: [0.78 * w, 346] };
      const B = k => { const [x, y] = at[k], hw = nodeW(k) / 2; return { x, y, l: x - hw, r: x + hw, t: y - NH / 2, b: y + NH / 2 }; };
      const E = [];
      const edge = (a, b, key, cls, d, lbl, o = {}) => E.push(Object.assign({ a, b, key, cls, d, lbl }, o));
      const o = B('org'), n4 = B('nh4'), n2 = B('no2'), n3 = B('no3'), rt = B('root'), air = B('n2'), lc = B('leach');
      // organic matter → ammonium: the caption above the arrow, in the strip under the soil surface
      edge('org', 'nh4', 'amm', '', `M${r1(o.r + 4)} ${o.y}H${r1(n4.l - 6)}`, 'аммонификация', { lx: (o.r + n4.l) / 2, ly: o.t - 12, anchor: 'middle' });
      if (narrow) {
        edge('nh4', 'no2', 'nit', 'microbe', `M${r1(n4.x)} ${n4.b + 3}V${n2.t - 6}`, 'Nitrosomonas', { plate: [n4.x, (n4.b + n2.t) / 2], bugs: [n4.x - 22, n4.b + 14] });
        edge('no2', 'no3', 'nit', 'microbe', `M${r1(n2.x)} ${n2.b + 3}V${n3.t - 6}`, 'Nitrobacter', { plate: [n2.x, (n2.b + n3.t) / 2], bugs: [n2.x - 22, n2.b + 14] });
        // both kinds of uptake end in the roots: one caption under the row, where the two arrows meet
        edge('no3', 'root', 'up', '', `M${r1(n3.l - 4)} ${n3.y}H${r1(rt.r + 6)}`, 'поглощение', { lx: (rt.r + n3.l) / 2, ly: n3.b + 15, anchor: 'middle' });
        // ammonium is taken up too: straight across the gap between the columns, the gap kept free of captions
        edge('nh4', 'root', 'up2', '', `M${r1(n4.l + 6)} ${n4.b + 2}L${r1(rt.r - 6)} ${rt.t - 4}`, '');
        edge('root', 'org', 'fall', 'is-dash', `M${r1(rt.x)} ${rt.t - 3}V${o.b + 6}`, 'опад', { lx: rt.x - 9, ly: (o.b + rt.t) / 2 + 4, anchor: 'end' });
        edge('no3', 'leach', 'leach', 'is-loss', `M${r1(n3.x)} ${n3.b + 3}V${lc.t - 6}`, 'полив', { lx: n3.x - 9, ly: (n3.b + lc.t) / 2 + 4, anchor: 'end' });
        // nitrogen gas leaves along the right edge, up into the air
        const gx = n3.r + 13;
        edge('no3', 'n2', 'den', 'is-loss', `M${r1(n3.r + 2)} ${n3.y}H${r1(gx - 8)}Q${r1(gx)} ${n3.y} ${r1(gx)} ${n3.y - 8}V${air.y + 8}Q${r1(gx)} ${air.y} ${r1(gx - 8)} ${air.y}H${r1(air.r + 6)}`, 'денитрификация', { lx: gx + 11, ly: (n3.y + air.y) / 2, anchor: 'middle', rot: -90 });
      } else {
        edge('nh4', 'no2', 'nit', 'microbe', `M${r1(n4.r + 4)} ${n4.y}H${r1(n2.l - 6)}`, 'Nitrosomonas', { plate: [(n4.r + n2.l) / 2, n4.y], bugs: [(n4.r + n2.l) / 2, n4.y - 30] });
        edge('no2', 'no3', 'nit', 'microbe', `M${r1(n2.x)} ${n2.b + 3}V${n3.t - 6}`, 'Nitrobacter', { plate: [n2.x, (n2.b + n3.t) / 2], bugs: [n2.x - 64, (n2.b + n3.t) / 2 + 4] });
        edge('no3', 'root', 'up', '', `M${r1(n3.l - 4)} ${n3.y}H${r1(rt.r + 6)}`, 'поглощение', { lx: (rt.r + n3.l) / 2, ly: n3.y + 20, anchor: 'middle' });
        // the caption starts right of the line over its whole height: the line falls to the left
        const sx = n4.x - 30, sy = n4.b + 2, ex = rt.r + 2, ey = rt.t + 6, ly = (sy + ey) / 2 - 6, xAt = yy => sx + (ex - sx) * (yy - sy) / (ey - sy);
        edge('nh4', 'root', 'up2', '', `M${r1(sx)} ${r1(sy)}L${r1(ex)} ${r1(ey)}`, 'поглощение', { lx: xAt(ly - 12) + 10, ly, anchor: 'start' });
        edge('root', 'org', 'fall', 'is-dash', `M${r1(rt.x)} ${rt.t - 3}V${o.b + 6}`, 'опад', { lx: rt.x + 10, ly: (o.b + rt.t) / 2 + 4, anchor: 'start' });
        edge('no3', 'leach', 'leach', 'is-loss', `M${r1(n3.x)} ${n3.b + 3}V${lc.t - 6}`, 'полив', { lx: n3.x - 10, ly: (n3.b + lc.t) / 2 + 4, anchor: 'end' });
        const gx = air.x;
        edge('no3', 'n2', 'den', 'is-loss', `M${r1(n3.r + 2)} ${n3.y}H${r1(gx - 10)}Q${r1(gx)} ${n3.y} ${r1(gx)} ${n3.y - 10}V${air.b + 6}`, 'денитрификация', { lx: gx + 14, ly: (n3.y + air.b) / 2 + 10, anchor: 'middle', rot: -90 });
      }
      return { narrow, at, B, E };
    }
    const ch = h.chart($('#lab-nc-ch', el), {
      label: 'Схема круговорота азота в грунте',
      h: w => (w < 560 ? 540 : 380),
      draw(w, hh) {
        const rnd = (() => { let s = 9; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
        const { narrow, B, E } = lay(w);
        const q = Math.pow(2, (T - 25) / 10) * (T < 6 ? 0.35 : 1);
        const R = { amm: Math.pow(2, (T - 25) / 10), nit: q * (wet ? 0.15 : 1), up: 0.8, up2: 0.6, fall: 0.25, den: wet ? 0.7 : 0, leach: 0.35 };
        const soil = 64;
        let s = `<defs><marker id="lab-nc-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="nc-ah"/></marker>
          <linearGradient id="lab-nc-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--soil-top)" stop-opacity="${wet ? 0.5 : 0.34}"/><stop offset="1" stop-color="var(--soil)" stop-opacity="${wet ? 0.62 : 0.46}"/></linearGradient></defs>`;
        // air above, soil below with crumbs and, when waterlogged, water filling the pores
        s += `<rect data-bg class="nc-air" x="0" y="0" width="${w}" height="${soil}"/><rect data-bg x="0" y="${soil}" width="${w}" height="${hh - soil}" fill="url(#lab-nc-soil)"/>`;
        s += `<path data-bg class="nc-surface" d="M0 ${soil}${Array.from({ length: Math.ceil(w / 24) + 1 }, (_, i) => `L${i * 24} ${r1(soil + Math.sin(i * 1.7) * 2.2)}`).join('')}"/>`;
        let crumbs = '';
        for (let i = 0; i < w * hh / 2600; i++) crumbs += `<circle cx="${r1(rnd() * w)}" cy="${r1(soil + 8 + rnd() * (hh - soil - 12))}" r="${r1(1.2 + rnd() * 2.6)}"/>`;
        s += `<g class="nc-crumbs" data-bg>${crumbs}</g>`;
        if (wet) s += `<rect data-bg class="nc-water" x="0" y="${soil + 18}" width="${w}" height="${hh - soil - 18}"/>`;
        // the zone names next to the seedling, the root running down the left edge into the roots' box
        const rx = narrow ? 9 : Math.max(14, B('root').l - 34), rb = B('root');
        s += `<text class="nc-zone" x="${rx + 16}" y="20">воздух</text><text class="nc-zone" x="${rx + 16}" y="${soil + 20}">грунт</text>`;
        s += `<path class="nc-root-draw" d="M${r1(rx)} ${soil}V${r1(rb.y - 16)}Q${r1(rx)} ${r1(rb.y)} ${r1(rb.l - 2)} ${r1(rb.y)}M${r1(rb.x - 14)} ${r1(rb.b + 1)}C${r1(rb.x - 20)} ${r1(rb.b + 24)} ${r1(rb.x - 34)} ${r1(rb.b + 32)} ${r1(rb.x - 46)} ${r1(rb.b + 46)}M${r1(rb.x + 10)} ${r1(rb.b + 1)}C${r1(rb.x + 14)} ${r1(rb.b + 22)} ${r1(rb.x + 26)} ${r1(rb.b + 32)} ${r1(rb.x + 38)} ${r1(rb.b + 42)}"/>`;
        s += `<path class="nc-stem" d="M${r1(rx)} ${soil}V${soil - 26}M${r1(rx)} ${soil - 14}q-6 -4 -8 -14M${r1(rx)} ${soil - 20}q10 -3 14 -12"/>`;
        let labels = '';
        E.forEach((e, i) => {
          const rate = R[e.key], off = rate < 0.02;
          s += `<path class="nc-edge ${e.cls}${off ? ' is-off' : ''}" d="${e.d}" marker-end="url(#lab-nc-ah)"/>`;
          if (!off && !h.reduce.matches) s += `<path class="nc-flow ${e.cls}" d="${e.d}" style="--spd:${r1(clamp(2.2 / rate, 1.2, 40))}s;--dl:-${r1(i * 0.37)}s"/>`;
          if (e.plate) {
            // the bacteria doing the work: little rods beside their name, the name on a plate on the arrow
            const [px, py] = e.plate, tw = e.lbl.length * 6.6 + 16;
            if (e.bugs) labels += `<g class="nc-bugs${off ? ' is-off' : ''}">${[[-12, 0, 20], [0, -5, -30], [12, 1, 60]].map(([ox, oy, a2]) => `<rect x="${r1(e.bugs[0] + ox - 5)}" y="${r1(e.bugs[1] + oy - 2.2)}" width="10" height="4.4" rx="2.2" transform="rotate(${a2} ${r1(e.bugs[0] + ox)} ${r1(e.bugs[1] + oy)})"/>`).join('')}</g>`;
            labels += `<g class="nc-plate${off ? ' is-off' : ''}" data-fit="8"><rect x="${r1(px - tw / 2)}" y="${r1(py - 10)}" width="${r1(tw)}" height="20" rx="10"/><text class="nc-lbl is-bug" x="${r1(px)}" y="${r1(py + 4)}" text-anchor="middle">${e.lbl}</text></g>`;
          } else if (e.lbl) {
            labels += `<text class="nc-lbl${off ? ' is-off' : ''}" x="${r1(e.lx)}" y="${r1(e.ly)}" text-anchor="${e.anchor}"${e.rot ? ` transform="rotate(${e.rot} ${r1(e.lx)} ${r1(e.ly)})"` : ''}>${e.lbl}</text>`;
          }
        });
        s += labels;
        Object.keys(N).forEach(k => {
          const b = B(k), [t, sub2] = N[k];
          s += `<g class="nc-node nc-${k}"><rect x="${r1(b.l)}" y="${b.t}" width="${r1(b.r - b.l)}" height="${NH}" rx="14"/><text class="nc-t" x="${r1(b.x)}" y="${b.y - 3}" text-anchor="middle">${t}</text><text class="nc-s" x="${r1(b.x)}" y="${b.y + 13}" text-anchor="middle">${sub2}</text></g>`;
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
