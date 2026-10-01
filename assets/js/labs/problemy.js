/* Гид по базилику — живые модели главы «Проблемы». Файл собирает scripts/build.py из src/labs/problemy/ — правьте там */
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
  { const st = document.createElement('style'); st.dataset.labs = "problemy"; st.textContent = "/* pigments */\n.pg-out { display: grid; gap: 10px; justify-items: center; text-align: center; }\n.pg-verdict { margin: 0; max-width: 34ch; font-size: .95rem; color: var(--ink-2); }\n\n.pg-leaf { width: min(100%, 240px); margin: 0 auto; filter: drop-shadow(0 10px 18px rgb(var(--shadow-rgb) / .18)); }\n/* downy mildew gauge */\n.dm-out { display: grid; gap: 8px; justify-items: center; }\n.dm-gauge { width: 100%; max-width: 280px; height: auto; }\n.dm-gauge path { fill: none; stroke-width: 16; }\n.g-track { stroke: var(--line); }\n.g-low { stroke: var(--z2); } .g-mid { stroke: var(--z3); } .g-high { stroke: var(--z4); }\n.g-needle { stroke: var(--ink); stroke-width: 4; stroke-linecap: round; transition: transform .6s var(--ease-float); }\n.g-hub { fill: var(--ink); }\n.dm-level { margin: 0; }\n\n\n.dm-leaf { width: min(100%, 300px); margin: 12px auto 0; }\n.dm-leaf .ill-lbl { font-size: 10px; }\n.dm-cap { margin: 6px 0 0; font-size: .86rem; color: var(--ink-3); text-align: center; }\n/* aphid colony */\n.ap-grid { display: grid; grid-template-columns: minmax(0, 1fr) 160px; gap: 14px; align-items: center; }\n@media (max-width: 560px) { .ap-grid { grid-template-columns: 1fr; } .ap-shoot { width: 170px; margin: 0 auto; } }\n"; document.head.appendChild(st); }
  /* @use micro, ills */
  /* Illustrations of the Problems chapter: every symptom of the diagnostics, and each disease and pest
     twice — as you see it on the plant and under a lens. Pages ask for them with data-ill="sym:<id>",
     "dis:<n>-plant|zoom", "pest:<n>-plant|zoom". */
  const I = ill, Fi = I.F, qi = I.q;
  const W0 = 160, H0 = 140;
  const bg = (w = W0, hh = H0) => `<rect data-bg width="${w}" height="${hh}" rx="14" fill="${Fi('bg')}"/>`;
  const ground = (y, w = W0, wet = false) => `<path d="M0 ${y}H${w}V${H0}H0Z" fill="${Fi(wet ? 'soil-d' : 'soil')}" opacity=".85"/><path d="M0 ${y}${Array.from({ length: 9 }, (_, i) => `L${i * 20} ${qi(y + Math.sin(i * 1.9) * 1.5)}`).join('')}L${w} ${y}" stroke="${Fi('soil-d')}" stroke-width="2" fill="none"/>`;
  const sun = (x, y, r = 11) => `<g opacity=".95"><circle cx="${x}" cy="${y}" r="${r}" fill="${Fi('yellow')}"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${qi(x + Math.cos(a) * (r + 3))} ${qi(y + Math.sin(a) * (r + 3))}L${qi(x + Math.cos(a) * (r + 8))} ${qi(y + Math.sin(a) * (r + 8))}" stroke="${Fi('yellow')}" stroke-width="2.2" stroke-linecap="round"/>`; }).join('')}</g>`;
  const drop = (x, y, s = 1) => `<path d="M${x} ${y}c${2.5 * s} ${3 * s} ${4 * s} ${5 * s} ${4 * s} ${7 * s}a${4 * s} ${4 * s} 0 0 1 ${-8 * s} 0c0 ${-2 * s} ${1.5 * s} ${-4 * s} ${4 * s} ${-7 * s}Z" fill="${Fi('water')}" opacity=".35"/>`;
  const gnat = (x, y, a = 0, s = 1) => `<g transform="translate(${qi(x)} ${qi(y)}) rotate(${a}) scale(${s})"><path d="M0 0C3 -5 9 -6 11 -3C8 0 3 1 0 0ZM0 0C-3 -5 -9 -6 -11 -3C-8 0 -3 1 0 0Z" fill="${Fi('wing')}" stroke="${Fi('gnat')}" stroke-width=".3"/><ellipse cx="0" cy="2" rx="1.4" ry="3.6" fill="${Fi('gnat')}"/><circle cx="0" cy="-2" r="1.3" fill="${Fi('gnat')}"/><path d="M-1 3l-4 5M1 3l4 5M-.8 1l-5 2M.8 1l5 2M-.5 -3l-2 -5M.5 -3l2 -5" stroke="${Fi('gnat')}" stroke-width=".4"/></g>`;
  const Sc = (body, label, w = W0, hh = H0) => I.svg(w, hh, bg(w, hh) + body, label);

  /* ---------- symptoms ---------- */
  const SYM = {
    'low-yellow': () => Sc(I.pot(80, 112, 60, 26) + I.plant({ x: 80, y: 103, h: 60, nodes: 4, leafScale: 0.78, leaf: (i) => (i === 0 ? { chl: 'uniform', k: 0.95 } : i === 1 ? { chl: 'uniform', k: 0.4 } : {}) }), 'Куст с пожелтевшими нижними листьями'),
    'young-yellow': () => Sc(I.pot(80, 112, 60, 26) + I.plant({ x: 80, y: 103, h: 60, nodes: 4, leafScale: 0.78, leaf: (i, n) => (i >= n - 1 ? { chl: 'interveinal', k: 0.95 } : i === n - 2 ? { chl: 'interveinal', k: 0.45 } : {}) }), 'Молодые листья жёлтые с зелёными жилками'),
    'brown-edges': () => Sc(I.leaf({ x: 56, y: 128, a: -14, s: 1.05, necro: 'edge', k: 0.9, seed: 4 }) + I.leaf({ x: 110, y: 130, a: 16, s: 0.9, necro: 'edge', k: 0.45, seed: 8 }), 'Листья с бурыми сухими краями'),
    'black-spots': () => Sc(I.leaf({ x: 62, y: 130, a: -12, s: 1.08, necro: 'spots', k: 0.9, seed: 5 }) + I.leaf({ x: 112, y: 128, a: 18, s: 0.82, necro: 'spots', k: 0.3, seed: 9 }), 'Лист с чёрными пятнами'),
    downy: () => Sc(I.leaf({ x: 48, y: 130, a: -10, s: 1, necro: 'angular', k: 0.9, seed: 6 }) + I.leaf({ x: 116, y: 130, a: 10, s: 1, under: true, fuzz: true, k: 0.9, seed: 6 }) + I.label(48, 16, 'сверху') + I.label(116, 16, 'снизу'), 'Жёлтые пятна сверху и серый налёт на нижней стороне листа'),
    curl: () => Sc(I.leaf({ x: 62, y: 130, a: -18, s: 1, curl: 0.9, seed: 7, aphids: 4 }) + I.leaf({ x: 112, y: 126, a: 24, s: 0.8, curl: 0.6, seed: 12 }), 'Скрученные деформированные листья'),
    purple: () => Sc(I.leaf({ x: 58, y: 130, a: -12, s: 1.05, purple: 0.8, seed: 3 }) + I.leaf({ x: 112, y: 128, a: 16, s: 0.85, purple: 0.45, seed: 10 }), 'Фиолетовый оттенок на листьях зелёного сорта'),
    holes: () => Sc(I.leaf({ x: 70, y: 132, a: -6, s: 1.15, holes: 6, seed: 9 }) + `<path d="M104 128C120 120 128 106 138 100" stroke="${Fi('slime')}" stroke-width="5" fill="none" stroke-linecap="round"/>`, 'Лист с дырками и слизистым следом'),
    damping: () => Sc(ground(106) + I.seedling(26, 106, 50) + I.seedling(58, 106, 44) + I.seedling(84, 106, 0, { fallen: true }) + I.seedling(116, 106, 0, { fallen: true, seed: 5 }), 'Сеянцы полегли, стебелёк у земли тёмный и тонкий'),
    'wilt-wet': () => Sc(I.pot(80, 112, 60, 26, { wet: true }) + I.plant({ x: 76, y: 103, h: 64, nodes: 4, droop: 1, leafScale: 0.78, seed: 7 }) + drop(118, 118) + drop(46, 120, 0.8), 'Растение вянет при мокром грунте'),
    'wilt-day': () => Sc(sun(132, 24) + I.pot(72, 112, 60, 26) + I.plant({ x: 70, y: 103, h: 64, nodes: 4, droop: 0.65, leafScale: 0.78, seed: 8 }), 'Растение вянет днём на солнце'),
    'grey-mold': () => Sc(`<path d="M80 140C82 100 78 60 82 8" stroke="${Fi('stem')}" stroke-width="5" fill="none"/>` + I.leaf({ x: 81, y: 74, a: 56, s: 0.72, mold: true, moldAt: [0, -12], seed: 4 }) + I.leaf({ x: 81, y: 74, a: -58, s: 0.7, seed: 5 }) + `<ellipse cx="81" cy="80" rx="9" ry="12" fill="${Fi('brown')}" opacity=".7"/>` + Array.from({ length: 40 }, (_, i) => `<path d="M${qi(74 + (i * 37 % 15))} ${qi(70 + (i * 23 % 22))}l${qi(((i * 7) % 5) - 2.5)} -4" stroke="${Fi('mold')}" stroke-width="1"/>`).join(''), 'Серый пушистый налёт на стебле и листе'),
    gnats: () => Sc(I.pot(80, 102, 110, 38) + gnat(52, 50, -10, 1.3) + gnat(96, 36, 15, 1.1) + gnat(118, 64, -25, 1.2) + gnat(72, 74, 8, 1) + `<g opacity=".85">${[[60, 96], [92, 97], [108, 95]].map(([x, y]) => `<path d="M${x} ${y}q4 -2 8 0" stroke="${Fi('larva')}" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="${x + 8}" cy="${y}" r="1.2" fill="${Fi('gnat')}"/>`).join('')}</g>`, 'Мошки над влажным грунтом'),
    leggy: () => Sc(`<g opacity=".5">${[0, 1, 2].map(i => `<path d="M160 ${20 + i * 22}L${104 - i * 6} ${46 + i * 22}" stroke="${Fi('yellow')}" stroke-width="7" opacity=".35"/>`).join('')}</g>` + I.pot(62, 118, 56, 22) + I.plant({ x: 62, y: 110, h: 100, nodes: 5, leggy: true, lean: 1.1, seed: 9, leaf: () => ({ pale: true }) }), 'Вытянувшийся бледный стебель тянется к свету'),
    slow: () => Sc(I.pot(80, 112, 50, 24) + I.plant({ x: 80, y: 104, h: 36, nodes: 3, leafScale: 0.55, seed: 3 }), 'Маленький куст с мелкими листьями'),
    bolting: () => Sc(I.pot(80, 118, 56, 22) + I.plant({ x: 80, y: 110, h: 40, nodes: 3, bolt: true, leafScale: 0.72, seed: 4 }), 'Куст выпустил цветонос'),
    bitter: () => Sc(sun(132, 24) + I.pot(72, 118, 56, 22) + I.plant({ x: 72, y: 110, h: 40, nodes: 3, bolt: true, leafScale: 0.72, seed: 6, leaf: () => ({ pale: true }) }), 'Цветущий куст на жаре'),
    crust: () => Sc(I.pot(80, 60, 120, 70, { crust: true }) + I.plant({ x: 80, y: 52, h: 36, nodes: 2, leafScale: 0.7, seed: 2 }), 'Белая корка на грунте и краях горшка'),
    sticky: () => Sc(I.leaf({ x: 74, y: 132, a: -6, s: 1.12, aphids: 16, seed: 3 }) + [[46, 76], [96, 62], [66, 52]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.8" fill="${Fi('hi')}" opacity=".7"/>`).join(''), 'Тля на листе и липкие капли'),
    mites: () => Sc(I.leaf({ x: 74, y: 132, a: -6, s: 1.12, stipple: 170, web: true, mites: 6, seed: 4 }), 'Светлые точки, паутинка и клещи на листе'),
    thrips: () => Sc(I.leaf({ x: 74, y: 132, a: -6, s: 1.12, silver: 12, thrips: 4, seed: 5 }), 'Серебристые штрихи и чёрные точки на листе')
  };
  illustrate('sym', id => (SYM[id] || SYM['low-yellow'])());

  /* ---------- close-ups ---------- */
  // Peronospora: branched sporangiophores leave through the stomata underneath
  function downyZoom() {
    // the frame it is shown in is 240 × 170: the section is drawn thinner so the spores fit under it
    const w = 240, hh = 170;
    const sec = micro.section(w, { top: 26, epi: 14, pal: [26], spo: 32, lo: 10, veins: [], stomata: [70, 170], seed: 21 });
    const y = sec.y, rnd = micro.rng(9);
    let s = `<g class="ill-micro">${sec.svg}</g>`;
    // hyphae between the cells
    let hy = '';
    for (let i = 0; i < 6; i++) { const x0 = 20 + i * 38; hy += `M${x0} ${qi(y.spo + 6)}C${x0 + 14} ${qi(y.spo + 20)} ${x0 + 4} ${qi(y.spo + 30)} ${x0 + 26} ${qi(y.lo - 4)}`; }
    s += `<path d="${hy}" stroke="${Fi('hypha')}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".95"/><path d="${hy}" stroke="${Fi('fuzz')}" stroke-width=".7" fill="none" opacity=".8"/>`;
    [70, 170].forEach(sx => {
      let g = `<path d="M${sx} ${qi(y.lo + 6)}V${qi(y.bot + 12)}" stroke="${Fi('hypha')}" stroke-width="3" stroke-linecap="round"/><path d="M${sx} ${qi(y.lo + 6)}V${qi(y.bot + 12)}" stroke="${Fi('fuzz')}" stroke-width=".8"/>`;
      const tips = [];
      const branch = (x, yy, a, len, d) => {
        const x2 = x + Math.sin(a) * len, y2 = yy + Math.cos(a) * len;
        g += `<path d="M${qi(x)} ${qi(yy)}L${qi(x2)} ${qi(y2)}" stroke="${Fi('hypha')}" stroke-width="${qi(2.6 - d * 0.5)}" stroke-linecap="round"/>`;
        if (d >= 3) { tips.push([x2, y2, a]); return; }
        branch(x2, y2, a - 0.42 - rnd() * 0.1, len * 0.72, d + 1);
        branch(x2, y2, a + 0.42 + rnd() * 0.1, len * 0.72, d + 1);
      };
      branch(sx, y.bot + 12, 0, 13, 0);
      tips.forEach(([x, yy, a]) => { g += `<ellipse cx="${qi(x + Math.sin(a) * 4)}" cy="${qi(yy + Math.cos(a) * 4)}" rx="2.8" ry="3.8" transform="rotate(${qi(-a * 180 / Math.PI)} ${qi(x + Math.sin(a) * 4)} ${qi(yy + Math.cos(a) * 4)})" fill="${Fi('spore')}" opacity=".9"/>`; });
      s += g;
    });
    s += I.scale(w - 20, 22, 44, '50 мкм');
    return I.svg(w, hh, bg(w, hh) + s, 'Под микроскопом: спороносцы ложной мучнистой росы выходят из устьиц нижней стороны листа');
  }
  // Botrytis: tall conidiophores with bunches of spores, like grapes
  function greyZoom() {
    const w = 240, hh = 170, rnd = micro.rng(4);
    let s = `<path d="M0 ${hh - 26}H${w}V${hh}H0Z" fill="${Fi('brown')}" opacity=".55"/>`;
    for (let i = 0; i < 7; i++) {
      const x = 22 + i * 32 + rnd() * 8, top = 40 + rnd() * 30;
      s += `<path d="M${qi(x)} ${hh - 26}C${qi(x - 4)} ${qi(hh - 70)} ${qi(x + 4)} ${qi(top + 30)} ${qi(x)} ${qi(top)}" stroke="${Fi('mold-d')}" stroke-width="2" fill="none"/>`;
      for (let b = 0; b < 4; b++) {
        const a = -1.2 + b * 0.8, bx = x + Math.sin(a) * 10, by = top - Math.cos(a) * 8;
        s += `<path d="M${qi(x)} ${qi(top)}L${qi(bx)} ${qi(by)}" stroke="${Fi('mold-d')}" stroke-width="1.2"/>`;
        for (let c = 0; c < 7; c++) s += `<circle cx="${qi(bx + (rnd() - 0.5) * 9)}" cy="${qi(by + (rnd() - 0.5) * 8)}" r="${qi(2 + rnd())}" fill="${Fi('mold')}" stroke="${Fi('mold-d')}" stroke-width=".5"/>`;
      }
    }
    s += I.scale(w - 20, 22, 44, '50 мкм');
    return I.svg(w, hh, bg(w, hh) + s, 'Под микроскопом: спороношение серой гнили — грозди спор на ветвистых ножках');
  }
  // Fusarium: the vessel ring of the stem turns brown
  function fusZoom() {
    const w = 240, hh = 170, cx = 120, cy = 86;
    let s = `<circle cx="${cx}" cy="${cy}" r="64" fill="${Fi('stem')}"/><circle cx="${cx}" cy="${cy}" r="58" fill="${Fi('under')}"/><circle cx="${cx}" cy="${cy}" r="30" fill="${Fi('bg-2')}"/>`;
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5, bx = cx + Math.cos(a) * 42, by = cy + Math.sin(a) * 42, sick = i % 3 !== 2;
      s += `<ellipse cx="${qi(bx)}" cy="${qi(by)}" rx="8" ry="11" transform="rotate(${qi(a * 180 / Math.PI + 90)} ${qi(bx)} ${qi(by)})" fill="${Fi(sick ? 'brown' : 'leaf-d')}"/>`;
      s += `<circle cx="${qi(bx)}" cy="${qi(by)}" r="3" fill="${Fi(sick ? 'brown-d' : 'vein')}"/>`;
    }
    
    return I.svg(w, hh, bg(w, hh) + s, 'Срез стебля при фузариозе: проводящие пучки побурели');
  }
  function rootsZoom(healthy) {
    const w = 240, hh = 170, rnd = micro.rng(healthy ? 3 : 8);
    let s = `<path d="M0 22H${w}V${hh}H0Z" fill="${Fi('soil')}" opacity=".6"/>`;
    const root = (x, y, a, len, d) => {
      const x2 = x + Math.sin(a) * len, y2 = y + Math.cos(a) * len;
      s += `<path d="M${qi(x)} ${qi(y)}L${qi(x2)} ${qi(y2)}" stroke="${Fi(healthy ? 'root' : 'rot')}" stroke-width="${qi(Math.max(1, 5 - d * 1.2))}" stroke-linecap="round" opacity="${healthy ? 1 : 0.9}"/>`;
      if (healthy && d >= 2) for (let k = 0; k < 5; k++) { const t = k / 5; s += `<path d="M${qi(x + (x2 - x) * t)} ${qi(y + (y2 - y) * t)}l${qi((rnd() - 0.5) * 8)} ${qi(3 + rnd() * 3)}" stroke="${Fi('root')}" stroke-width=".6"/>`; }
      if (d >= 3) return;
      root(x2, y2, a - 0.5 - rnd() * 0.3, len * 0.7, d + 1);
      root(x2, y2, a + 0.4 + rnd() * 0.3, len * 0.72, d + 1);
    };
    [70, 170].forEach(x => { s += `<path d="M${x} 0V22" stroke="${Fi('stem')}" stroke-width="5"/>`; root(x, 22, (rnd() - 0.5) * 0.3, 40, 0); });
    if (!healthy) s += [[60, 90], [150, 110], [184, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="${Fi('rot')}" opacity=".6"/>`).join('');
    
    return I.svg(w, hh, bg(w, hh) + s, healthy ? 'Здоровые белые корни' : 'Корни с гнилью: бурые и мягкие');
  }
  function dampZoom() {
    const w = 240, hh = 170, rnd = micro.rng(6);
    let s = `<path d="M0 104H${w}V${hh}H0Z" fill="${Fi('soil')}" opacity=".85"/>`;
    s += `<path d="M120 170V104" stroke="${Fi('root')}" stroke-width="5"/><path d="M120 104C120 70 118 40 120 14" stroke="${Fi('stem')}" stroke-width="12" stroke-linecap="round" fill="none"/>`;
    s += `<path d="M114 118C112 108 113 98 115 88H125C127 98 128 108 126 118Z" fill="${Fi('brown-d')}"/><path d="M114 96H126" stroke="${Fi('water')}" stroke-width="6" opacity=".6"/>`;
    let hy = '';
    for (let i = 0; i < 14; i++) { const x = 60 + rnd() * 120, y = 110 + rnd() * 50; hy += `M${qi(x)} ${qi(y)}c${qi((rnd() - 0.5) * 30)} ${qi(-8)} ${qi((rnd() - 0.5) * 30)} ${qi(-6)} ${qi(114 + rnd() * 12 - x)} ${qi(104 - y + rnd() * 10)}`; }
    s += `<path d="${hy}" stroke="${Fi('hypha')}" stroke-width="1" fill="none" opacity=".85"/>`;
    s += I.label(132, 94, 'перетяжка', 'start').replace('class="ill-lbl"', 'class="ill-lbl" style="font-size:15px"');
    return I.svg(w, hh, bg(w, hh) + s, 'Чёрная ножка вблизи: перетяжка стебелька у земли и нити грибницы в грунте');
  }
  function bactZoom() {
    const w = 240, hh = 170, rnd = micro.rng(12);
    let s = `<circle cx="120" cy="86" r="66" fill="${Fi('water')}" opacity=".25"/><circle cx="120" cy="86" r="66" fill="none" stroke="${Fi('mold-d')}" stroke-width="1"/>`;
    for (let i = 0; i < 38; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 56, x = 120 + Math.cos(a) * r, y = 86 + Math.sin(a) * r, t = rnd() * 180;
      s += `<rect x="${qi(x - 5)}" y="${qi(y - 1.8)}" width="10" height="3.6" rx="1.8" transform="rotate(${qi(t)} ${qi(x)} ${qi(y)})" fill="${Fi('bact')}"/>`;
      if (i % 3 === 0) s += `<path d="M${qi(x + 5)} ${qi(y)}q4 2 7 0" stroke="${Fi('bact')}" stroke-width=".6" fill="none" transform="rotate(${qi(t)} ${qi(x)} ${qi(y)})"/>`;
    }
    s += I.scale(w - 20, 22, 44, '5 мкм');
    return I.svg(w, hh, bg(w, hh) + s, 'Под микроскопом: палочковидные бактерии в капле воды');
  }
  const DIS = [
    { plant: () => Sc(ground(104, 240) + I.seedling(50, 104, 36) + I.seedling(84, 104, 30) + I.seedling(120, 104, 0, { fallen: true }) + I.seedling(160, 104, 0, { fallen: true, seed: 4 }) + I.seedling(206, 104, 34), 'Сеянцы полегли от чёрной ножки', 240, H0), zoom: dampZoom },
    { plant: () => Sc(I.pot(120, 114, 64, 24) + I.plant({ x: 118, y: 106, h: 64, nodes: 4, droop: 0.9, leafScale: 0.8, seed: 9, stemColor: 'stem-d', leaf: i => (i < 2 ? { chl: 'uniform', k: 0.6 } : {}) }) + `<path d="M118.5 100V74" stroke="${Fi('brown')}" stroke-width="2.4" stroke-dasharray="5 3"/>`, 'Растение вянет, на стебле бурые полосы', 240, H0), zoom: fusZoom },
    { plant: () => Sc(I.leaf({ x: 70, y: 132, a: -10, s: 1.05, necro: 'angular', k: 0.9, seed: 6 }) + I.leaf({ x: 168, y: 132, a: 10, s: 1.05, under: true, fuzz: true, k: 0.9, seed: 6 }) + I.label(70, 20, 'сверху') + I.label(168, 20, 'снизу'), 'Ложная мучнистая роса: жёлтые пятна сверху, налёт снизу', 240, H0), zoom: downyZoom },
    { plant: () => Sc(`<path d="M120 140C122 100 118 60 122 8" stroke="${Fi('stem')}" stroke-width="6" fill="none"/>` + I.leaf({ x: 121, y: 74, a: 58, s: 0.8, mold: true, moldAt: [0, -14], seed: 4 }) + I.leaf({ x: 121, y: 74, a: -58, s: 0.78, seed: 5 }) + `<ellipse cx="121" cy="84" rx="10" ry="16" fill="${Fi('brown')}" opacity=".75"/>` + Array.from({ length: 60 }, (_, i) => `<path d="M${qi(112 + (i * 37 % 19))} ${qi(70 + (i * 23 % 30))}l${qi(((i * 7) % 5) - 2.5)} -4" stroke="${Fi('mold')}" stroke-width="1"/>`).join(''), 'Серая гниль на стебле и листе', 240, H0), zoom: greyZoom },
    { plant: () => rootsZoom(true), zoom: () => rootsZoom(false) },
    { plant: () => Sc(I.leaf({ x: 90, y: 132, a: -8, s: 1.1, necro: 'bact', k: 0.9, seed: 7 }) + I.leaf({ x: 170, y: 130, a: 14, s: 0.85, necro: 'bact', k: 0.4, seed: 3 }), 'Бактериальная пятнистость: угловатые тёмные пятна', 240, H0), zoom: bactZoom }
  ];
  // what each picture shows: goes under it (a long caption inside a small picture would be unreadable)
  const CAP = {
    dis: [['Сеянцы полегли', 'Перетяжка у земли, грибница в грунте'], ['Вянет при влажной земле', 'Срез стебля: побуревшие сосуды'], ['Пятна сверху, налёт снизу', 'Спороносцы выходят из устьиц'],
      ['Налёт на стебле и листе', 'Грозди спор на ножках'], ['Здоровые: белые, с волосками', 'Гниль: бурые, мягкие'], ['Угловатые тёмные пятна', 'Бактерии в капле воды']],
    pest: [['Колония на верхушке', 'Самка, личинка и крылатая'], ['Светлые точки и паутинка', 'Клещ: 8 ног, два тёмных пятна'], ['На нижней стороне листа', 'Взрослая в белой пыльце'],
      ['Серебристые штрихи', 'Узкое тело, крылья с бахромой'], ['Крупные дыры, следы слизи', 'Слизень и его след'], ['Мошки над влажным грунтом', 'Комарик и его личинка']]
  };
  const caption = (el, kind, n, which) => {
    const cap = el && el.closest('figure') && el.closest('figure').querySelector('figcaption');
    const t = CAP[kind] && CAP[kind][n] && CAP[kind][n][which === 'zoom' ? 1 : 0];
    if (cap && t) cap.textContent = t;
  };
  illustrate('dis', (arg, el) => { const [n, kind] = arg.split('-'); const d = DIS[+n] || DIS[0]; caption(el, 'dis', +n, kind); return (d[kind] || d.plant)(); });

  /* ---------- pests, big ---------- */
  function aphidBig() {
    const w = 240, hh = 170;
    let s = I.aphid(92, 90, 8, 8) + I.aphid(176, 108, -20, 3.4) + I.aphid(186, 64, 40, 3.8, true);
    s += I.label(190, 22, 'крылатая') + I.label(176, 158, 'личинка') + I.scale(58, 20, 44, '1 мм');
    return I.svg(w, hh, bg(w, hh) + s, 'Тля крупно: бескрылая самка, личинка и крылатая особь');
  }
  function miteBig() {
    const w = 240, hh = 170;
    let s = `<path d="M10 30Q80 60 150 20M30 150Q120 110 230 140M20 90Q120 70 230 96" stroke="${Fi('white')}" stroke-width="1" fill="none" opacity=".9"/>`;
    s += I.mite(104, 86, -12, 10) + I.mite(196, 120, 30, 4);
    s += [[176, 48], [188, 44], [182, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${Fi('hi')}" stroke="${Fi('mold')}" stroke-width=".6" opacity=".9"/>`).join('');
    s += I.label(186, 30, 'яйца') + I.scale(58, 20, 44, '0,2 мм');
    return I.svg(w, hh, bg(w, hh) + s, 'Паутинный клещ крупно: восемь ног, два тёмных пятна, яйца и паутинки');
  }
  function whiteflyBig() {
    const w = 240, hh = 170;
    let s = I.whitefly(100, 84, -8, 8.5) + [[188, 70], [206, 96], [180, 110]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.6" fill="${Fi('yellow-pale')}" stroke="${Fi('mold')}" stroke-width=".7" opacity=".9"/>`).join('');
    s += I.label(196, 152, 'личинки') + I.scale(58, 20, 44, '1 мм');
    return I.svg(w, hh, bg(w, hh) + s, 'Белокрылка крупно и её плоские личинки');
  }
  function thripsBig() {
    const w = 240, hh = 170;
    // fringed wings like feathers
    let fr = '';
    [-1, 1].forEach(sd => { for (let i = 0; i < 24; i++) { const t = i / 23, x = 118 + sd * (6 + t * 56), y = 70 + t * 30; fr += `M${qi(x)} ${qi(y)}l${qi(sd * 2)} 7`; } });
    let s = `<path d="${fr}" stroke="${Fi('mold-d')}" stroke-width=".8" opacity=".75"/><path d="M122 70L180 100M114 70L56 100" stroke="${Fi('mold-d')}" stroke-width="2.6" opacity=".6"/>`;
    s += I.thrips(118, 82, 0, 7.5);
    s += I.scale(58, 20, 44, '0,5 мм');
    return I.svg(w, hh, bg(w, hh) + s, 'Трипс крупно: узкое тело и крылья с бахромой');
  }
  function slugBig() {
    const w = 240, hh = 170;
    let s = `<path d="M10 128C60 118 100 124 150 120" stroke="${Fi('slime')}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M40 126C40 104 70 92 110 92C150 92 190 96 206 112C214 120 208 128 196 128Z" fill="${Fi('slug')}"/><path d="M110 92C130 90 158 94 170 104C150 104 124 102 110 100Z" fill="${Fi('slug-d')}" opacity=".6"/>`;
    s += `<path d="M196 110L212 80M188 108L198 84M204 118L218 112M200 122L214 124" stroke="${Fi('slug-d')}" stroke-width="3" stroke-linecap="round"/><circle cx="212" cy="80" r="3" fill="${Fi('slug-d')}"/><circle cx="198" cy="84" r="2.6" fill="${Fi('slug-d')}"/>`;
    s += Array.from({ length: 14 }, (_, i) => `<path d="M${50 + i * 10} 124q4 -6 8 0" stroke="${Fi('slug-d')}" stroke-width="1" fill="none" opacity=".5"/>`).join('');
    s += I.scale(70, 22, 50, '1 см');
    return I.svg(w, hh, bg(w, hh) + s, 'Слизень и слизистый след');
  }
  function gnatBig() {
    const w = 240, hh = 170;
    let s = gnat(90, 76, -6, 5.5);
    s += `<path d="M150 136q20 -10 40 0q10 4 16 0" stroke="${Fi('larva')}" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="208" cy="134" r="4.6" fill="${Fi('gnat')}"/>`;
    s += `<path d="M0 150H${w}V${hh}H0Z" fill="${Fi('soil')}" opacity=".7"/>`;
    s += I.label(180, 114, 'личинка') + I.scale(58, 20, 44, '1 мм');
    return I.svg(w, hh, bg(w, hh) + s, 'Грибной комар крупно и его личинка');
  }
  const PEST = [
    { plant: () => Sc(`<path d="M120 140V20" stroke="${Fi('stem')}" stroke-width="5"/>` + I.leaf({ x: 120, y: 70, a: 52, s: 0.8, curl: 0.5, aphids: 10, seed: 3 }) + I.leaf({ x: 120, y: 70, a: -52, s: 0.8, curl: 0.4, aphids: 6, seed: 4 }) + I.leaf({ x: 120, y: 24, a: 20, s: 0.36, aphids: 5, seed: 5 }) + I.leaf({ x: 120, y: 24, a: -20, s: 0.36, aphids: 4, seed: 6 }) + Array.from({ length: 10 }, (_, i) => I.aphid(119 + (i % 2 ? 3 : -3), 40 + i * 9, i % 2 ? 90 : -90, 0.8)).join(''), 'Колония тли на верхушке', 240, H0), zoom: aphidBig },
    { plant: () => Sc(I.leaf({ x: 120, y: 134, a: -4, s: 1.14, stipple: 190, web: true, mites: 7, seed: 4 }), 'Паутинный клещ: светлые точки и паутинка', 240, H0), zoom: miteBig },
    { plant: () => Sc(I.leaf({ x: 120, y: 134, a: -4, s: 1.12, under: true, whitefly: 9, seed: 5 }), 'Белокрылки на нижней стороне листа', 240, H0), zoom: whiteflyBig },
    { plant: () => Sc(I.leaf({ x: 120, y: 134, a: -4, s: 1.12, silver: 14, thrips: 5, seed: 6 }), 'Трипсы: серебристые штрихи и чёрные точки', 240, H0), zoom: thripsBig },
    { plant: () => Sc(I.leaf({ x: 110, y: 134, a: -6, s: 1.14, holes: 7, seed: 9 }) + `<path d="M150 130C170 120 186 104 206 100" stroke="${Fi('slime')}" stroke-width="6" fill="none" stroke-linecap="round"/>`, 'Слизни: крупные дыры и следы', 240, H0), zoom: slugBig },
    { plant: () => Sc(I.pot(120, 96, 140, 44) + gnat(84, 46, -10, 1.4) + gnat(140, 30, 15, 1.2) + gnat(170, 58, -25, 1.3) + gnat(108, 68, 8, 1.1), 'Грибные комары над грунтом', 240, H0), zoom: gnatBig }
  ];
  illustrate('pest', (arg, el) => { const [n, kind] = arg.split('-'); const d = PEST[+n] || PEST[0]; caption(el, 'pest', +n, kind); return (d[kind] || d.plant)(); });

  /* @use micro, ills */
  register('pigment', el => {
    el.innerHTML = h.head('Смешайте пигменты', 'Цвет листа по закону Бера — Ламберта: каждый пигмент поглощает свою часть спектра, отражённый остаток и есть цвет.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.chipsHtml('lab-pg-p', 'Пример', [['ok', 'Здоровый'], ['n', 'Нехватка азота'], ['p', 'Нехватка фосфора'], ['opal', 'Фиолетовый сорт'], ['old', 'Старый лист']], 'ok')}
          ${h.rangeHtml('lab-pg-c', 'Хлорофиллы', 0, 100, 1, 85)}${h.rangeHtml('lab-pg-k', 'Каротиноиды', 0, 100, 1, 60)}${h.rangeHtml('lab-pg-a', 'Антоцианы', 0, 100, 1, 5)}</div>
        <div class="pg-out"><div class="pg-leaf" id="lab-pg-leaf" aria-hidden="true"></div><p class="pg-verdict" id="lab-pg-v"></p></div>
      </div>`;
    const K = { c: [2.2, 0.55, 2.2], k: [0.02, 0.35, 1.8], a: [0.25, 2.2, 0.3] };
    const base = [0.47, 0.48, 0.44];
    const v = { c: 85, k: 60, a: 5 };
    const PRE = { ok: [85, 60, 5], n: [22, 55, 5], p: [70, 55, 55], opal: [60, 30, 100], old: [8, 42, 12] };
    const toS = x => { x = clamp(x, 0, 1); return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255); };
    const upd = () => {
      const rgb = [0, 1, 2].map(i => toS(base[i] * Math.exp(-(v.c / 100 * K.c[i] + v.k / 100 * K.k[i] + v.a / 100 * K.a[i]))));
      // the same leaf as in the guides, painted in the mixed colour; antocyanins also colour the veins
      $('#lab-pg-leaf', el).innerHTML = ill.svg(160, 150, `<rect width="160" height="150" rx="16" fill="${ill.F('bg')}"/>` + ill.leaf({ x: 80, y: 140, s: 1.22, color: `rgb(${rgb.join(' ')})`, purple: v.a > 45 ? (v.a - 45) / 110 : 0, seed: 7 }));
      const verdict = v.c < 20 && v.k < 30 ? 'Ткань обесцвечена: так выглядит некроз или сильный ожог.' : v.a > 55 && v.c > 35 ? 'Фиолетовый оттенок: антоцианы. У зелёного сорта — сигнал холода или нехватки фосфора.' : v.c < 40 && v.k >= 30 ? 'Хлороз: хлорофилла мало, проступили жёлтые каротиноиды. Ищите нехватку азота (снизу), магния или железа (между жилками).' : 'Здоровый зелёный: хлорофилл маскирует остальные пигменты.';
      set(el, 'lab-pg-v', verdict);
    };
    const rc = h.bindRange(el, 'lab-pg-c', x => x + ' %', x => { v.c = x; upd(); });
    const rk = h.bindRange(el, 'lab-pg-k', x => x + ' %', x => { v.k = x; upd(); });
    const ra = h.bindRange(el, 'lab-pg-a', x => x + ' %', x => { v.a = x; upd(); });
    h.bindPick(el, 'lab-pg-p', k => { rc.set(PRE[k][0]); rk.set(PRE[k][1]); ra.set(PRE[k][2]); });
    upd();
  });

  /* @use micro, ills */
  register('dm', el => {
    el.innerHTML = h.head('Риск ложной мучнистой росы', 'Качественная оценка по трём условиям: ночная влажность для спороношения, мокрые листья для заражения и температура.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-dm-rh', 'Влажность воздуха ночью', 60, 100, 1, 90)}${h.rangeHtml('lab-dm-w', 'Листья мокрые', 0, 12, 0.5, 4)}${h.rangeHtml('lab-dm-t', 'Температура ночью', 10, 28, 1, 18)}</div>
        <div class="dm-out"><svg class="dm-gauge" viewBox="0 0 220 130" aria-hidden="true"><path class="g-track" d="M20 115 A90 90 0 0 1 200 115"/><path class="g-low" d="M20 115 A90 90 0 0 1 47.4 51.4"/><path class="g-mid" d="M47.4 51.4 A90 90 0 0 1 145 27.4"/><path class="g-high" d="M145 27.4 A90 90 0 0 1 200 115"/><line class="g-needle" id="lab-dm-n" x1="110" y1="115" x2="110" y2="36"/><circle class="g-hub" cx="110" cy="115" r="7"/></svg><p class="dm-level" id="lab-dm-l"></p><div class="dm-leaf" id="lab-dm-leaf" aria-hidden="true"></div><p class="dm-cap" id="lab-dm-cap"></p></div>
      </div>` + h.readHtml([['Что делать', 'lab-dm-v', 'is-wide']]);
    const v = { rh: 90, w: 4, t: 18 };
    const upd = () => {
      const s = clamp((v.rh - 82) / 12, 0, 1), i = clamp(v.w / 3, 0, 1), tf = Math.exp(-Math.pow((v.t - 20) / 7, 2));
      const risk = clamp((s * 0.55 + i * 0.45) * tf * (s > 0 ? 1 : 0.4), 0, 1);
      $('#lab-dm-n', el).setAttribute('transform', `rotate(${r1(-90 + risk * 180)} 110 115)`);
      const lvl = risk < 0.25 ? ['Низкий', 'is-low'] : risk < 0.6 ? ['Умеренный', 'is-mid'] : ['Высокий', 'is-high'];
      set(el, 'lab-dm-l', `<span class="zone-pill ${lvl[1]}">${lvl[0]} риск</span>`);
      // what a leaf would look like in a week of such nights: upper side and the fuzz underneath
      const k2 = clamp((risk - 0.15) / 0.75, 0, 1);
      $('#lab-dm-leaf', el).innerHTML = ill.svg(200, 130, `<rect width="200" height="130" rx="14" fill="${ill.F('bg')}"/>` +
        ill.leaf({ x: 58, y: 122, a: -8, s: 1.02, necro: k2 > 0.05 ? 'angular' : null, k: k2, seed: 6 }) +
        ill.leaf({ x: 146, y: 122, a: 8, s: 1.02, under: true, fuzz: k2 > 0.05, k: k2, seed: 6 }) + ill.label(58, 16, 'сверху') + ill.label(146, 16, 'снизу'));
      set(el, 'lab-dm-cap', k2 < 0.05 ? 'Лист чистый: спорам негде прорасти.' : k2 < 0.5 ? 'Через неделю таких ночей: первые жёлтые пятна и налёт снизу.' : 'Через неделю: пятна по всему листу, густой серо-фиолетовый налёт.');
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

  /* @use micro, ills */
  register('aphid', el => {
    el.innerHTML = h.head('Колония из одной тли', 'Модель при 20–25 °C: взрослеют за 8 дней, рожают по 3 личинки в день около трёх недель. Перекорм азотом ускоряет и то и другое.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-ap-d', 'День', 0, 28, 1, 14)}<div class="lab-seg-wrap"><span class="lab-label">Условия</span><div class="chips-row lab-chips" id="lab-ap-x"><button class="chip" type="button" data-x="n" aria-pressed="false">Перекорм азотом</button><button class="chip" type="button" data-x="soap" aria-pressed="false">Мыло на 10-й день</button></div></div></div>
       <div class="ap-grid"><div class="lab-chart" id="lab-ap-ch"></div><div class="ap-shoot" id="lab-ap-shoot" aria-hidden="true"></div></div>` + h.readHtml([['Тлей на кусте', 'lab-ap-n'], ['Вывод', 'lab-ap-v', 'is-wide']]);
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
      // the shoot tip on that day: one drawn aphid stands for a growing crowd
      const n = clamp(Math.round(3.2 * Math.pow(Math.log10(v + 1), 1.7)), 0, 44);
      const on = (k, total) => Math.round(n * k / total);
      let g = `<rect width="150" height="170" rx="14" fill="${ill.F('bg')}"/><path d="M75 170V40" stroke="${ill.F('stem')}" stroke-width="5"/>`;
      g += ill.leaf({ x: 75, y: 112, a: 56, s: 0.62, aphids: on(3, 10), curl: v > 300 ? 0.5 : 0, seed: 3 }) + ill.leaf({ x: 75, y: 112, a: -56, s: 0.62, aphids: on(3, 10), curl: v > 300 ? 0.4 : 0, seed: 4 });
      g += ill.leaf({ x: 75, y: 44, a: 22, s: 0.36, aphids: on(1, 10), seed: 5 }) + ill.leaf({ x: 75, y: 44, a: -22, s: 0.36, aphids: on(1, 10), seed: 6 });
      for (let i = 0; i < on(2, 10); i++) g += ill.aphid(74 + (i % 2 ? 3.5 : -3.5), 50 + i * 5.5, i % 2 ? 90 : -90, 0.95);
      $('#lab-ap-shoot', el).innerHTML = ill.svg(150, 170, g);
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
})();
