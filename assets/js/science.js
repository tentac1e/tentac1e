/* Гид по базилику — научный слой: развороты «Глубже», данные о молекулах и общие инструменты моделей */
window.BasilScience = (() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const minus = x => x.replace(/^-/, '\u2212');
  const NF = {};
  const nf = d => NF[d] || (NF[d] = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: d }));
  const fmt = (v, d = 1) => minus(nf(d).format(Number(v)));
  const fmt0 = v => minus(nf(0).format(Math.round(v)));
  const nb = s => String(s).replace(/(\d) (?=[^\s\d–—-]{1,6}(?=[\s,.;:)!?/]|$))/g, '$1 ');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const f1 = v => (Math.round(v * 10) / 10);
  const icon = name => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const plural = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? many : b > 1 && b < 5 ? few : b === 1 ? one : many; };
  const sub = s => String(s).replace(/(\d+)/g, m => m.split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join(''));

  /* ------------------------------------------------------------------ */
  /* colours: hex/rgb parsing and mixing in OKLab (perceptually even)    */
  /* ------------------------------------------------------------------ */
  function parseColor(c) {
    c = String(c).trim();
    if (c.startsWith('#')) {
      let h = c.slice(1);
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) return m[1].split(/[ ,/]+/).slice(0, 3).map(Number);
    return [128, 128, 128];
  }
  const toLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const toSrgb = v => { v = clamp(v, 0, 1); return Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255); };
  function toOklab(rgb) {
    const [r, g, b] = rgb.map(toLin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function fromOklab([L, a, b]) {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(toSrgb);
  }
  const rgbStr = c => `rgb(${c[0]} ${c[1]} ${c[2]})`;
  function mix(c1, c2, t) {
    const a = toOklab(parseColor(c1)), b = toOklab(parseColor(c2));
    return rgbStr(fromOklab([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]));
  }
  function ramp(stops, t) {
    t = clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t));
    return mix(stops[i], stops[i + 1], t - i);
  }

  /* ------------------------------------------------------------------ */
  /* form controls — ids are stable so values survive a page refresh     */
  /* ------------------------------------------------------------------ */
  const rangeHtml = (id, label, min, max, step, value, extra = '') =>
    `<div class="field lab-field ${extra}"><label for="${id}">${label}: <b id="${id}-v"></b></label><input class="range" type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  const segHtml = (id, label, options, value) =>
    `<div class="lab-seg-wrap"><span class="lab-label" id="${id}-l">${label}</span><div class="seg lab-seg" role="group" aria-labelledby="${id}-l" id="${id}">${options.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(value)}">${t}</button>`).join('')}</div></div>`;
  const chipsHtml = (id, label, options, value) =>
    `<div class="chips-row lab-chips" role="group" aria-label="${label}" id="${id}">${options.map(([v, t]) => `<button class="chip" type="button" data-v="${v}" aria-pressed="${String(v) === String(value)}">${t}</button>`).join('')}</div>`;
  function bindRange(root, id, show, onChange) {
    const input = $('#' + id, root), out = $('#' + id + '-v', root);
    const upd = silent => { out.textContent = show(+input.value); if (!silent) onChange(+input.value); };
    input.addEventListener('input', () => upd());
    upd(true);
    return { input, get value() { return +input.value; }, set(v) { input.value = v; upd(); } };
  }
  function bindPick(root, id, onChange) {
    const group = $('#' + id, root);
    const set = v => $$('[data-v]', group).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    group.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      set(b.dataset.v);
      onChange(b.dataset.v);
    });
    return { set, get value() { const b = $('[aria-pressed="true"]', group); return b ? b.dataset.v : null; } };
  }
  const readHtml = items => `<dl class="lab-read">${items.map(([k, id, cls]) => `<div class="${cls || ''}"><dt>${k}</dt><dd id="${id}">—</dd></div>`).join('')}</dl>`;
  const head = (title, note, model) => `<div class="lab-head"><p class="lab-kicker">${model ? 'Модель' : 'Интерактив'}</p><h4 class="lab-title">${title}</h4>${note ? `<p class="lab-note">${note}</p>` : ''}</div>`;

  /* ------------------------------------------------------------------ */
  /* charts drawn at real pixel size, redrawn when the box resizes       */
  /* ------------------------------------------------------------------ */
  function chart(host, o) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'lab-svg');
    if (o.label) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', o.label); }
    host.appendChild(svg);
    let W = 0, H = 0;
    const redraw = () => {
      W = host.clientWidth;
      if (!W) return;
      H = o.h ? Math.round(o.h(W)) : Math.round(clamp(W * 0.5, 210, 320));
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.innerHTML = o.draw(W, H);
    };
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (host.clientWidth && host.clientWidth !== W) redraw(); }).observe(host);
    if (o.onPointer) {
      const fire = (e, kind) => { const r = svg.getBoundingClientRect(); o.onPointer(e.clientX - r.left, e.clientY - r.top, W, H, kind); };
      svg.addEventListener('pointerdown', e => { fire(e, 'set'); });
      svg.addEventListener('pointermove', e => { fire(e, e.buttons ? 'set' : 'hover'); });
      svg.addEventListener('pointerleave', e => fire(e, 'leave'));
      svg.style.cursor = 'crosshair';
    }
    redraw();
    return { redraw, svg, get w() { return W; }, get h() { return H; } };
  }

  const r1 = v => Math.round(v * 10) / 10;
  let clipN = 0;
  function plot(o) {
    const p = Object.assign({ l: 46, r: 18, t: 22, b: 36 }, o.pad || {});
    const iw = o.w - p.l - p.r, ih = o.h - p.t - p.b;
    const X = v => r1(p.l + (v - o.x[0]) / (o.x[1] - o.x[0]) * iw);
    const Y = v => r1(p.t + ih - (clamp(v, Math.min(o.y[0], o.y[1]), Math.max(o.y[0], o.y[1])) - o.y[0]) / (o.y[1] - o.y[0]) * ih);
    let s = '';
    (o.hbands || []).forEach(b => {
      s += `<rect class="band ${b.cls || ''}" x="${p.l}" y="${Y(b.y1)}" width="${iw}" height="${r1(Y(b.y0) - Y(b.y1))}"/>`;
      if (b.label) s += `<text class="band-lbl" x="${p.l + iw - 6}" y="${Y(b.y1) + 13}" text-anchor="end">${b.label}</text>`;
    });
    (o.vbands || []).forEach(b => {
      s += `<rect class="band ${b.cls || ''}" x="${X(b.x0)}" y="${p.t}" width="${r1(X(b.x1) - X(b.x0))}" height="${ih}"/>`;
      if (b.label) s += `<text class="band-lbl" x="${r1((X(b.x0) + X(b.x1)) / 2)}" y="${p.t + 13}" text-anchor="middle">${b.label}</text>`;
    });
    (o.yticks || []).forEach(v => {
      s += `<line class="grid" x1="${p.l}" x2="${p.l + iw}" y1="${Y(v)}" y2="${Y(v)}"/>`;
      s += `<text class="tick" x="${p.l - 7}" y="${Y(v) + 4}" text-anchor="end">${(o.fy || String)(v)}</text>`;
    });
    (o.xticks || []).forEach(v => { s += `<text class="tick" x="${X(v)}" y="${p.t + ih + 18}" text-anchor="middle">${(o.fx || String)(v)}</text>`; });
    s += `<line class="axis" x1="${p.l}" x2="${p.l + iw}" y1="${p.t + ih}" y2="${p.t + ih}"/>`;
    if (o.ylab) s += `<text class="axis-lbl" x="${p.l - 7}" y="${p.t - 9}" text-anchor="start">${o.ylab}</text>`;
    if (o.xlab) s += `<text class="axis-lbl" x="${p.l + iw}" y="${o.h - 3}" text-anchor="end">${o.xlab}</text>`;
    const Yr = v => r1(p.t + ih - (v - o.y[0]) / (o.y[1] - o.y[0]) * ih);
    const YS = o.clip ? Yr : Y;
    if (o.clip) { const id = 'lab-clip-' + (++clipN); s += `<clipPath id="${id}"><rect x="${p.l}" y="${p.t - 2}" width="${iw}" height="${ih + 4}"/></clipPath><g clip-path="url(#${id})">`; }
    (o.series || []).forEach(se => {
      const pts = se.pts.filter(pt => isFinite(pt[1]));
      if (!pts.length) return;
      const d = pts.map((pt, i) => `${i ? 'L' : 'M'}${X(pt[0])} ${YS(pt[1])}`).join(' ');
      if (se.area) s += `<path class="area ${se.cls}" d="${d} L${X(pts[pts.length - 1][0])} ${p.t + ih} L${X(pts[0][0])} ${p.t + ih} Z"/>`;
      s += `<path class="line ${se.cls}${se.dash ? ' is-dash' : ''}" d="${d}"/>`;
      if (se.label) {
        const at = se.labelAt != null ? pts.reduce((a, b) => Math.abs(b[0] - se.labelAt) < Math.abs(a[0] - se.labelAt) ? b : a) : pts[pts.length - 1];
        s += `<text class="series-lbl" x="${X(at[0]) + (se.ldx || 0)}" y="${Y(at[1]) + (se.ldy || -8)}" text-anchor="${se.anchor || 'middle'}">${se.label}</text>`;
      }
    });
    if (o.clip) s += '</g>';
    if (o.marker) {
      const m = o.marker;
      s += `<line class="marker" x1="${X(m.x)}" x2="${X(m.x)}" y1="${p.t}" y2="${p.t + ih}"/>`;
      (m.dots || []).forEach(dt => { s += `<circle class="dot ${dt.cls}" cx="${X(m.x)}" cy="${Y(dt.y)}" r="5.5"/>`; });
    }
    if (o.hover != null) s += `<line class="hover-line" x1="${X(o.hover)}" x2="${X(o.hover)}" y1="${p.t}" y2="${p.t + ih}"/>`;
    return { s, X, Y, p, iw, ih, inv: px => o.x[0] + (px - p.l) / iw * (o.x[1] - o.x[0]), invY: py => o.y[0] + (p.t + ih - py) / ih * (o.y[1] - o.y[0]) };
  }

  const tip = (x, y, w, lines) => {
    const bw = Math.max(...lines.map(l => l.length)) * 6.6 + 18;
    const bh = lines.length * 16 + 10;
    const tx = x + 12 + bw > w ? x - bw - 12 : x + 12;
    return `<g class="svg-tip"><rect x="${r1(tx)}" y="${r1(y)}" width="${r1(bw)}" height="${bh}" rx="8"/>${lines.map((l, i) => `<text x="${r1(tx + 9)}" y="${r1(y + 17 + i * 16)}">${esc(l)}</text>`).join('')}</g>`;
  };

  /* ------------------------------------------------------------------ */
  /* astronomy shared by several models                                  */
  /* ------------------------------------------------------------------ */
  const DOY21 = [21, 52, 80, 111, 141, 172, 202, 233, 264, 294, 325, 355];
  const decl = n => 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365);
  function dayLength(lat, n) {
    const phi = lat * Math.PI / 180, d = decl(n) * Math.PI / 180;
    const c = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d));
    if (c <= -1) return 24;
    if (c >= 1) return 0;
    return 2 * Math.acos(c) * 180 / Math.PI / 15;
  }
  function h0(lat, n) {
    const phi = lat * Math.PI / 180, d = decl(n) * Math.PI / 180;
    const dr = 1 + 0.033 * Math.cos(2 * Math.PI * n / 365);
    const c = clamp(-Math.tan(phi) * Math.tan(d), -1, 1);
    const ws = Math.acos(c);
    return Math.max(0, 37.6 * dr * (ws * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(ws)));
  }
  const noonSun = (lat, n) => 90 - lat + decl(n);
  const CITIES = [[43.6, 'Сочи'], [45, 'Краснодар'], [53.9, 'Минск'], [55.8, 'Москва'], [56.8, 'Екатеринбург'], [59.9, 'Петербург'], [69, 'Мурманск']];

  /* ------------------------------------------------------------------ */
  /* molecules: heavy atoms and bonds; 3D shape is relaxed at runtime    */
  /* ------------------------------------------------------------------ */
  const FAM = {
    mono: { name: 'монотерпены', cls: 's1' },
    phen: { name: 'фенилпропаноиды', cls: 's2' },
    sesq: { name: 'сесквитерпены', cls: 's3' },
    glv: { name: 'альдегиды зелёного листа', cls: 's4' }
  };
  const RING6 = [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1]];
  const MOLS = {
    lin: {
      name: 'Линалоол', formula: 'C10H18O', fam: 'mono', cls: 'монотерпеновый спирт', bp: 198,
      smell: 'цветочный, лавандовый, свежий', where: 'лаванда, семена кориандра, бергамот, хмель', basil: 'генуэзский, греческий, фиолетовые, коричный',
      note: 'Главная молекула европейского базилика. Её же много в семенах кориандра, поэтому базилик и кориандр так похожи по ощущению свежести.',
      atoms: 'CCCCCCCCCCO', bonds: [[0, 1, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6, 2], [6, 7], [2, 8], [6, 9], [2, 10]]
    },
    est: {
      name: 'Эстрагол', alt: 'метилхавикол', formula: 'C10H12O', fam: 'phen', cls: 'фенилпропаноид', bp: 216,
      smell: 'анис, эстрагон, лакрица', where: 'эстрагон, фенхель, анис', basil: 'тайский, фиолетовые',
      note: 'Делает тайский базилик анисовым. Летучесть ниже, чем у линалоола, поэтому тайский базилик лучше держит аромат в горячем карри.',
      atoms: 'CCCCCCCCCOC', ring: [0, 1, 2, 3, 4, 5], bonds: RING6.concat([[0, 6], [6, 7], [7, 8, 2], [3, 9], [9, 10]])
    },
    eug: {
      name: 'Эвгенол', formula: 'C10H12O2', fam: 'phen', cls: 'фенилпропаноид', bp: 254,
      smell: 'гвоздика, тёплая пряность', where: 'гвоздика, лавровый лист, душистый перец', basil: 'генуэзский, гвоздичный, тулси, ереванский',
      note: 'Слегка немеет язык — эвгенол давно используют стоматологи как мягкий антисептик и обезболивающее. Самая стойкая нота базилика.',
      atoms: 'CCCCCCOOCCCC', ring: [0, 1, 2, 3, 4, 5], bonds: RING6.concat([[0, 6], [1, 7], [7, 8], [3, 9], [9, 10], [10, 11, 2]])
    },
    cin: {
      name: '1,8-Цинеол', alt: 'эвкалиптол', formula: 'C10H18O', fam: 'mono', cls: 'монотерпеновый оксид', bp: 176,
      smell: 'эвкалипт, холодок', where: 'эвкалипт, розмарин, лавр, кардамон', basil: 'генуэзский, греческий, африканский синий',
      note: 'Даёт базилику лёгкий освежающий холодок. Одна из самых летучих его молекул: при варке уходит первой после «зелёных» альдегидов.',
      atoms: 'COCCCCCCCCC', bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [3, 6], [6, 7], [7, 0], [0, 8], [2, 9], [2, 10]]
    },
    cit: {
      name: 'Цитраль', alt: 'гераниаль и нераль', formula: 'C10H16O', fam: 'mono', cls: 'монотерпеновый альдегид', bp: 229,
      smell: 'лимон', where: 'лемонграсс, лимонная цедра, мелисса, вербена', basil: 'лимонный, лаймовый',
      note: 'Лимонный базилик пахнет лимоном потому, что синтезирует ту же молекулу, что и лемонграсс.',
      atoms: 'OCCCCCCCCCC', bonds: [[0, 1, 2], [1, 2], [2, 3, 2], [3, 4], [4, 5], [5, 6], [6, 7, 2], [7, 8], [3, 9], [7, 10]]
    },
    mci: {
      name: 'Метилциннамат', formula: 'C10H10O2', fam: 'phen', cls: 'эфир коричной кислоты', bp: 262,
      smell: 'корица, клубника, бальзам', where: 'клубника (многие сорта)', basil: 'коричный',
      note: 'Корицей пахнет не коричный альдегид, как в самой корице, а родственный ему эфир. Он же есть в клубнике — отсюда пара «клубника и коричный базилик».',
      atoms: 'CCCCCCCCCOOC', ring: [0, 1, 2, 3, 4, 5], bonds: RING6.concat([[0, 6], [6, 7, 2], [7, 8], [8, 9, 2], [8, 10], [10, 11]])
    },
    cam: {
      name: 'Камфора', formula: 'C10H16O', fam: 'mono', cls: 'монотерпеновый кетон', bp: 204,
      smell: 'камфора, смола, холод', where: 'розмарин, шалфей, камфорный лавр', basil: 'африканский синий, камфорный',
      note: 'У африканского синего базилика её много, поэтому он лучше подходит для чая и букетов, чем для песто.',
      atoms: 'CCCCCCCOCCC', bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [6, 3], [1, 7, 2], [0, 8], [6, 9], [6, 10]]
    },
    car: {
      name: 'β-Кариофиллен', formula: 'C15H24', fam: 'sesq', cls: 'сесквитерпен', bp: 262,
      smell: 'перечный, древесный', where: 'чёрный перец, гвоздика, хмель', basil: 'тулси, лимонный',
      note: 'Одно из немногих ароматических веществ, которые связываются с каннабиноидным рецептором CB2, без какого-либо психоактивного эффекта.',
      atoms: 'CCCCCCCCCCCCCCC', bonds: [[0, 1], [1, 2], [2, 3], [3, 4, 2], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0], [8, 9], [9, 10], [10, 0], [3, 11], [10, 12], [10, 13], [7, 14, 2]]
    },
    hex: {
      name: '(Z)-3-Гексеналь', formula: 'C6H10O', fam: 'glv', cls: 'альдегид зелёного листа', bp: 126,
      smell: 'свежескошенная трава, зелёный томат', where: 'срезанная трава, свежий томат, листья', basil: 'любой сорт в момент разреза',
      note: 'Появляется за секунды после повреждения клеток и быстро перестраивается в (E)-2-гексеналь с более резким запахом.',
      atoms: 'OCCCCCC', bonds: [[0, 1, 2], [1, 2], [2, 3], [3, 4, 2], [4, 5], [5, 6]]
    }
  };
  const EXTRA = { meu: { name: 'Метилэвгенол', fam: 'phen' }, ber: { name: 'α-Бергамотен', fam: 'sesq' } };
  const molName = id => (MOLS[id] || EXTRA[id]).name;
  const molFam = id => (MOLS[id] || EXTRA[id]).fam;

  const CHEMO = [
    { id: 'genovese', name: 'Генуэзский', p: { lin: 45, eug: 14, cin: 8, est: 4, ber: 7, car: 2, cam: 1 }, why: 'Цветочный линалоол и тёплый эвгенол почти без аниса — сладкий «итальянский» базилик. Цинеол добавляет свежести.' },
    { id: 'greek', name: 'Греческий', p: { lin: 42, eug: 12, cin: 10, est: 10, ber: 5, car: 2 }, why: 'Тот же аккорд, что у генуэзского, плюс заметная анисовая нота — вкус получается плотнее и пряней.' },
    { id: 'clove', name: 'Гвоздичный', p: { eug: 36, lin: 30, cin: 6, est: 3, ber: 4, car: 4 }, why: 'Эвгенола почти столько же, сколько линалоола, и гвоздика выходит на первый план. Хорош в маринадах: эвгенол стоек к нагреву.' },
    { id: 'purple', name: 'Фиолетовые', p: { lin: 38, est: 16, eug: 14, cin: 6, ber: 6, car: 3 }, why: 'Линалоол, эвгенол и эстрагол в сопоставимых долях: гвоздика, анис и перчинка. Отсюда пряный «кавказский» характер ереванского и опалового.' },
    { id: 'thai', name: 'Тайский', p: { est: 72, lin: 7, cin: 4, ber: 4, car: 2, eug: 1 }, why: 'Около трёх четвертей масла — эстрагол, поэтому тайский базилик пахнет анисом и лакрицей и не теряется в горячем карри.' },
    { id: 'lemon', name: 'Лимонный', p: { cit: 52, lin: 9, car: 5, est: 4, ber: 3 }, why: 'Цитраль — та же молекула, что в лемонграссе. Отсюда чистый лимонный запах без кислоты.' },
    { id: 'lime', name: 'Лаймовый', p: { cit: 45, lin: 12, car: 6, est: 2 }, why: 'Цитраль с большей долей линалоола и кариофиллена: цитрус с цветочной и перечной нотой.' },
    { id: 'cinnamon', name: 'Коричный', p: { mci: 50, lin: 26, cin: 4, ber: 3, eug: 2 }, why: 'Метилциннамат даёт корицу и клубнику, линалоол — цветочную мягкость. Идеален к ягодам и выпечке.' },
    { id: 'tulsi', name: 'Тулси', p: { eug: 42, car: 20, meu: 12, cin: 3, lin: 2 }, why: 'Эвгенол и метилэвгенол плюс перечный кариофиллен: гвоздика с перцем. Поэтому тулси чаще заваривают, чем кладут в салат.' },
    { id: 'african', name: 'Африканский синий', p: { cam: 36, lin: 24, cin: 16, eug: 3, car: 2 }, why: 'Камфора и цинеол дают «аптечный» холодящий запах. Красив и медонос, но для песто резковат.' }
  ];
  const CHEMO_COLS = ['lin', 'cin', 'cit', 'cam', 'est', 'eug', 'meu', 'mci', 'car', 'ber'];

  const PAIRS = [
    { id: 'tomato', name: 'Томат', mols: ['lin', 'hex'], variety: 'Генуэзский', dish: 'капрезе, маринара, пицца', why: 'Общие молекулы — линалоол и «зелёный» (Z)-3-гексеналь, один из главных запахов свежего томата. Плюс контраст: глутамат и кислота томата оттеняют сладкий аромат базилика.' },
    { id: 'strawberry', name: 'Клубника', mols: ['lin', 'mci'], variety: 'Коричный или лимонный', dish: 'клубника с бальзамиком, лимонады', why: 'В аромате многих сортов клубники есть линалоол и метилциннамат — главная молекула коричного базилика.' },
    { id: 'lemon', name: 'Лимон и лемонграсс', mols: ['cit', 'lin'], variety: 'Лимонный', dish: 'лимонады, рыба, заправки', why: 'Цитраль общий: лимонный базилик синтезирует ту же молекулу, что лемонграсс и лимонная цедра.' },
    { id: 'peach', name: 'Персик', mols: ['lin'], variety: 'Генуэзский или коричный', dish: 'салат с персиком и моцареллой, сорбет', why: 'Линалоол входит в аромат персика вместе со сливочными лактонами. Базилик подчёркивает цветочную сторону фрукта.' },
    { id: 'coriander', name: 'Кориандр', mols: ['lin'], variety: 'Генуэзский', dish: 'маринады, соусы, карри', why: 'Эфирное масло семян кориандра больше чем наполовину состоит из линалоола.' },
    { id: 'fennel', name: 'Фенхель, эстрагон', mols: ['est'], variety: 'Тайский', dish: 'рыба, бульоны, азиатские супы', why: 'Эстрагол — главная молекула эстрагона и заметная часть аромата фенхеля. Анисовые ноты усиливают друг друга.' },
    { id: 'clove', name: 'Гвоздика и лавр', mols: ['eug', 'cin'], variety: 'Гвоздичный или тулси', dish: 'маринады, томатные соусы, чай', why: 'Эвгенол — основа запаха гвоздики. В лавровом листе есть и цинеол, и эвгенол.' },
    { id: 'pepper', name: 'Чёрный перец', mols: ['car'], variety: 'Тулси или лимонный', dish: 'паста, мясо, сыр', why: 'β-кариофиллен — одна из главных молекул чёрного перца.' },
    { id: 'rosemary', name: 'Розмарин', mols: ['cin', 'cam'], variety: 'Африканский синий', dish: 'запечённые овощи, мясо', why: 'Цинеол и камфора общие, но розмарин сильнее и легко перебивает базилик: кладите его заметно меньше.' },
    { id: 'mint', name: 'Мята', mols: ['cin'], variety: 'Лимонный или генуэзский', dish: 'летние салаты, лимонады', why: 'Обе — яснотковые. В мяте тоже есть цинеол, но главная её молекула — ментол, который холодит сильнее.' },
    { id: 'cocoa', name: 'Тёмный шоколад', mols: ['lin'], variety: 'Коричный или генуэзский', dish: 'ганаш, трюфели', why: 'Линалоол отвечает за цветочные ноты тонкого какао. Базилик их подхватывает, а горечь шоколада гасит сладость.' },
    { id: 'olive', name: 'Оливковое масло', mols: [], kin: ['hex'], variety: 'Любой', dish: 'песто, заправки', why: 'Свежее масло пахнет зелёными альдегидами — родственниками гексеналя. А главное, жир растворяет и удерживает терпены базилика.' },
    { id: 'cucumber', name: 'Огурец, арбуз', mols: [], kin: ['hex'], variety: 'Лимонный или генуэзский', dish: 'холодные супы, салаты, лимонады', why: 'Их свежесть дают девятиуглеродные «зелёные» альдегиды — дальняя родня гексеналя, одна обонятельная семья.' },
    { id: 'mozzarella', name: 'Моцарелла, сливки', mols: [], variety: 'Генуэзский', dish: 'капрезе, сливочные соусы', why: 'Общих молекул почти нет — работает контраст: нейтральный жир растворяет аромат и продлевает его, молочная свежесть оттеняет пряность.' },
    { id: 'parmesan', name: 'Пармезан', mols: [], variety: 'Генуэзский', dish: 'песто', why: 'Глутамат выдержанного сыра даёт умами, соль усиливает восприятие аромата, жир его удерживает.' },
    { id: 'garlic', name: 'Чеснок', mols: [], variety: 'Генуэзский', dish: 'песто, писту', why: 'Контраст: острые серные соединения из аллицина против цветочных терпенов. Вместе — средиземноморский аккорд.' },
    { id: 'chili', name: 'Чили и кокос', mols: [], variety: 'Тайский или святой', dish: 'зелёное карри, пад кра пао', why: 'Контраст тайской кухни: жгучий капсаицин, жирное кокосовое молоко и анисовый эстрагол, который не боится горячего.' }
  ];

  /* seeded random for the molecule relaxation */
  const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

  function embed(mol) {
    const n = mol.atoms.length;
    const el = i => mol.atoms[i];
    const ring = new Set(mol.ring || []);
    const adj = Array.from({ length: n }, () => []);
    mol.bonds.forEach(([a, b, o = 1]) => { adj[a].push([b, o]); adj[b].push([a, o]); });
    const sp2 = i => ring.has(i) || adj[i].some(([, o]) => o >= 2);
    const bl = (a, b, o) => {
      const hasO = el(a) === 'O' || el(b) === 'O';
      if (o === 2) return hasO ? 1.22 : 1.34;
      if (ring.has(a) && ring.has(b)) return 1.4;
      return hasO ? 1.43 : 1.54;
    };
    const len = new Map();
    const cons = [];
    const near = Array.from({ length: n }, () => new Set());
    mol.bonds.forEach(([a, b, o = 1]) => {
      const d = bl(a, b, o);
      len.set(a + '-' + b, d); len.set(b + '-' + a, d);
      cons.push([a, b, d, 1, 0]);
      near[a].add(b); near[b].add(a);
    });
    for (let c = 0; c < n; c++) {
      const nbs = adj[c];
      for (let x = 0; x < nbs.length; x++) for (let y = x + 1; y < nbs.length; y++) {
        const a = nbs[x][0], b = nbs[y][0];
        const da = len.get(a + '-' + c), db = len.get(b + '-' + c);
        const th = (sp2(c) ? 120 : 109.5) * Math.PI / 180;
        cons.push([a, b, Math.sqrt(da * da + db * db - 2 * da * db * Math.cos(th)), 0.7, 0]);
        near[a].add(b); near[b].add(a);
      }
    }
    if (mol.ring) for (let k = 0; k < 3; k++) cons.push([mol.ring[k], mol.ring[k + 3], 2.8, 0.8, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (!near[i].has(j)) cons.push([i, j, 2.95, 0.35, 1]);
    const rnd = seeded(n * 7919 + mol.bonds.length * 104729);
    let best = null, bestE = Infinity;
    for (let r = 0; r < 6; r++) {
      const P = Array.from({ length: n }, () => [rnd() * 4 - 2, rnd() * 4 - 2, rnd() * 4 - 2]);
      for (let it = 0; it < 700; it++) {
        for (const [i, j, d, w, t] of cons) {
          const dx = P[j][0] - P[i][0], dy = P[j][1] - P[i][1], dz = P[j][2] - P[i][2];
          const L = Math.hypot(dx, dy, dz) || 1e-6;
          if (t === 1 && L >= d) continue;
          const k = (L - d) / L * 0.5 * w;
          P[i][0] += dx * k; P[i][1] += dy * k; P[i][2] += dz * k;
          P[j][0] -= dx * k; P[j][1] -= dy * k; P[j][2] -= dz * k;
        }
      }
      let E = 0;
      for (const [i, j, d, , t] of cons) {
        const L = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1], P[j][2] - P[i][2]);
        if (t === 1) { if (L < d) E += (d - L) * (d - L); } else E += (L - d) * (L - d);
      }
      if (E < bestE) { bestE = E; best = P; }
    }
    const c = [0, 1, 2].map(k => best.reduce((s, p) => s + p[k], 0) / n);
    return best.map(p => [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  }
  const embedCache = new Map();
  const shape = id => { if (!embedCache.has(id)) embedCache.set(id, embed(MOLS[id])); return embedCache.get(id); };

  /* 3D ball-and-stick viewer on canvas: drag to rotate, turns by itself */
  function MolViewer(canvas, id) {
    const ctx = canvas.getContext('2d');
    let mol = MOLS[id], P = shape(id);
    let yaw = 0.6, pitch = -0.35, vy = 0.35, dpr = 1, W = 0, H = 0, raf = 0, last = 0, visible = true, drag = null;
    let pal = {};
    const readPal = () => { pal = { c: css('--mol-c'), cHi: css('--mol-c-hi'), o: css('--mol-o'), oHi: css('--mol-o-hi'), bond: css('--mol-bond'), edge: css('--mol-edge') }; };
    function size() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    function draw() {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const maxR = Math.max(...P.map(p => Math.hypot(p[0], p[1], p[2]))) || 1;
      const scale = Math.min(W, H) * 0.44 / maxR;
      const f = maxR * 4;
      const Q = P.map(([x, y, z]) => {
        const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
        const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        const k = f / (f - z2);
        return { x: W / 2 + x1 * scale * k, y: H / 2 + y2 * scale * k, z: z2, k };
      });
      const items = [];
      mol.bonds.forEach(([a, b, o = 1]) => items.push({ t: 'b', a, b, o, z: (Q[a].z + Q[b].z) / 2 }));
      Q.forEach((q, i) => items.push({ t: 'a', i, z: q.z + 0.3 }));
      items.sort((u, v) => u.z - v.z);
      ctx.lineCap = 'round';
      for (const it of items) {
        if (it.t === 'b') {
          const A = Q[it.a], B = Q[it.b];
          const w = 5.2 * (A.k + B.k) / 2;
          const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
          const nx = -dy / L, ny = dx / L;
          const offs = it.o === 2 ? [-3.4, 3.4] : [0];
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          for (const off of offs) {
            ctx.lineWidth = it.o === 2 ? w * 0.62 : w;
            ctx.strokeStyle = mol.atoms[it.a] === 'O' ? pal.o : pal.bond;
            ctx.beginPath(); ctx.moveTo(A.x + nx * off, A.y + ny * off); ctx.lineTo(mx + nx * off, my + ny * off); ctx.stroke();
            ctx.strokeStyle = mol.atoms[it.b] === 'O' ? pal.o : pal.bond;
            ctx.beginPath(); ctx.moveTo(mx + nx * off, my + ny * off); ctx.lineTo(B.x + nx * off, B.y + ny * off); ctx.stroke();
          }
        } else {
          const q = Q[it.i];
          const isO = mol.atoms[it.i] === 'O';
          const r = (isO ? 13 : 11) * q.k * clamp(Math.min(W, H) / 300, 0.7, 1.3);
          const g = ctx.createRadialGradient(q.x - r * 0.35, q.y - r * 0.4, r * 0.1, q.x, q.y, r);
          g.addColorStop(0, isO ? pal.oHi : pal.cHi);
          g.addColorStop(1, isO ? pal.o : pal.c);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = pal.edge; ctx.stroke();
        }
      }
    }
    const ready = window.BasilScene && window.BasilScene.gate ? window.BasilScene.gate(60, 30) : () => true;
    function frame(ts) {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
      if (!drag && !ready(ts)) return;
      const t = ts / 1000, dt = Math.min(0.05, t - (last || t));
      last = t;
      if (!drag) { yaw += vy * dt; vy += (0.35 - vy) * 0.02; }
      draw();
    }
    const wake = () => { if (reduce.matches) { draw(); return; } if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, t: performance.now() }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      yaw += dx * 0.012; pitch = clamp(pitch + dy * 0.01, -1.4, 1.4);
      const dt = Math.max(16, performance.now() - drag.t) / 1000;
      vy = clamp(dx * 0.012 / dt, -6, 6);
      drag = { x: e.clientX, y: e.clientY, t: performance.now() };
      if (reduce.matches) draw();
    });
    const end = () => { drag = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.style.touchAction = 'pan-y';
    readPal(); size(); draw(); wake();
    if ('ResizeObserver' in window) new ResizeObserver(() => { size(); draw(); }).observe(canvas);
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { visible = en.some(x => x.isIntersecting); if (visible) wake(); }).observe(canvas);
    document.addEventListener('visibilitychange', wake);
    document.addEventListener('basil:theme', () => { readPal(); draw(); });
    return {
      set(nid) { mol = MOLS[nid]; P = shape(nid); vy = 1.6; draw(); wake(); },
      get id() { return Object.keys(MOLS).find(k => MOLS[k] === mol); }
    };
  }

  /* ------------------------------------------------------------------ */
  /* registry: every <div class="lab-tool" data-lab="…"> gets its model  */
  /* when it first becomes visible (inside an opened «Глубже»)           */
  /* ------------------------------------------------------------------ */
  const labs = {};
  const register = (name, fn) => { labs[name] = fn; };
  /* the 36 models live in labs.js; a page fetches it only when the first model scrolls near */
  const SELF = document.currentScript && document.currentScript.src;
  let labsLoad = null;
  function ensureLabs() {
    if (Object.keys(labs).length) return Promise.resolve();
    if (!labsLoad) {
      labsLoad = new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = SELF ? SELF.replace(/science\.js(\?.*)?$/, 'labs.js') : 'assets/js/labs.js';
        tag.onload = resolve;
        tag.onerror = () => { labsLoad = null; reject(new Error('labs.js')); };
        document.head.appendChild(tag);
      });
    }
    return labsLoad;
  }
  let ctx = {};

  function mount(el) {
    if (el.dataset.ready) return;
    if (!Object.keys(labs).length) { ensureLabs().then(() => mount(el), () => { el.innerHTML = '<p class="muted">Модель не загрузилась. Обновите страницу.</p>'; }); return; }
    const fn = labs[el.dataset.lab];
    if (!fn) return;
    el.dataset.ready = '1';
    try { fn(el, api); } catch (err) { console.error('[basil] lab ' + el.dataset.lab, err); el.innerHTML = '<p class="muted">Модель не загрузилась. Обновите страницу.</p>'; }
  }
  function mountAll() {
    const tools = $$('.lab-tool[data-lab]');
    if (!('IntersectionObserver' in window)) { tools.forEach(mount); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { mount(en.target); io.unobserve(en.target); } }), { rootMargin: '200px 0px' });
    tools.forEach(t => io.observe(t));
  }

  /* ------------------------------------------------------------------ */
  /* deep blocks: reading time, chapter index, open-all switch           */
  /* ------------------------------------------------------------------ */
  const KIND = { chem: ['Химия', 'hex'], phys: ['Физика', 'wave'], bio: ['Биология', 'cell'], taste: ['Вкус', 'nose'] };
  const DEPTH_KEY = 'basil-depth';
  const DEPTHS = [
    ['Практика', 'только советы, развороты свёрнуты'],
    ['Наука', 'раскрыть все развороты «Глубже»'],
    ['Лаборатория', 'и ещё глубже: механизмы, формулы, источники']
  ];
  const store = {
    get() {
      try {
        const v = localStorage.getItem(DEPTH_KEY);
        if (v !== null) return clamp(parseInt(v, 10) || 0, 0, 2);
        return localStorage.getItem('basil-deep') === '1' ? 1 : 0;
      } catch (e) { return 0; }
    },
    set(v) { try { localStorage.setItem(DEPTH_KEY, String(v)); } catch (e) { /* private mode */ } }
  };

  /* smooth open/close that works the same in every browser */
  const EASE = 'cubic-bezier(.22,.8,.26,1)';
  function animateDetails(d, open) {
    const body = Array.from(d.children).find(c => c.tagName !== 'SUMMARY');
    if (d._anim) { d._anim.cancel(); d._anim = null; }
    if (!body || !body.animate || reduce.matches) { d.open = open; return; }
    body.style.overflow = 'hidden';
    const done = () => { body.style.overflow = ''; d._anim = null; };
    if (open) {
      d.open = true;
      const h = body.scrollHeight;
      d._anim = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: Math.min(560, 240 + h / 8), easing: EASE });
      d._anim.onfinish = done;
      d._anim.oncancel = done;
    } else {
      const h = body.offsetHeight;
      d._anim = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: Math.min(380, 200 + h / 14), easing: 'ease-in' });
      d._anim.onfinish = () => { d.open = false; done(); };
      d._anim.oncancel = done;
    }
  }
  const ANIMATED = 'details.deep, details.deeper, details.recipe-card';

  function setDepth(level, announce) {
    level = clamp(level | 0, 0, 2);
    const root = document.documentElement;
    root.dataset.depth = String(level);
    root.classList.toggle('deep-on', level > 0);
    $$('details.deep').forEach(d => { d.open = level > 0; });
    $$('details.deeper').forEach(d => { d.open = level > 1; });
    const btn = $('#deep-toggle');
    if (btn) {
      btn.dataset.depth = String(level);
      btn.setAttribute('aria-label', `Глубина чтения: ${DEPTHS[level][0]}`);
      btn.setAttribute('aria-pressed', String(level > 0));
    }
    $$('[data-depth-pick]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.depthPick === level)));
    $$('.depth-pop [role="menuitemradio"]').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.depthPick === level)));
    if (announce && ctx.toast) {
      const n = $$('details.deep').length, m = $$('details.deeper').length;
      if (!n) ctx.toast(level === 0 ? 'Практика: научные развороты будут свёрнуты во всех главах' : level === 1 ? 'Наука: во всех главах развороты «Глубже» будут открыты' : 'Лаборатория: во всех главах открыто всё, вплоть до «Ещё глубже»');
      else ctx.toast(level === 0 ? 'Практика: научные развороты свёрнуты' : level === 1 ? `Наука: открыто ${n} ${plural(n, 'разворот', 'разворота', 'разворотов')}` : `Лаборатория: открыто всё, включая ${m} ${plural(m, 'раздел', 'раздела', 'разделов')} «Ещё глубже»`);
    }
  }

  function initDepthControl() {
    const btn = $('#deep-toggle');
    if (btn) {
      const pop = document.createElement('div');
      pop.className = 'depth-pop';
      pop.id = 'depth-pop';
      pop.setAttribute('role', 'menu');
      pop.setAttribute('aria-label', 'Глубина чтения');
      pop.hidden = true;
      pop.innerHTML = `<p class="depth-pop-h">Глубина чтения</p>` + DEPTHS.map(([name, note], i) =>
        `<button type="button" role="menuitemradio" aria-checked="false" data-depth-pick="${i}"><span class="depth-dots" aria-hidden="true">${'<i></i>'.repeat(i + 1)}</span><span><b>${name}</b><small>${note}</small></span></button>`).join('');
      btn.after(pop);
      btn.setAttribute('aria-haspopup', 'menu');
      btn.setAttribute('aria-controls', 'depth-pop');
      const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      const place = () => {
        const r = btn.getBoundingClientRect();
        pop.style.top = Math.round(r.bottom + 10) + 'px';
        pop.style.right = Math.max(8, Math.round(window.innerWidth - r.right - 60)) + 'px';
        pop.style.setProperty('--arrow', Math.round(window.innerWidth - r.right + r.width / 2 - parseFloat(pop.style.right)) + 'px');
      };
      const openPop = () => {
        place();
        pop.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        const cur = $('[aria-checked="true"]', pop) || $('button', pop);
        cur.focus();
      };
      btn.addEventListener('click', e => { e.stopPropagation(); if (pop.hidden) openPop(); else close(); });
      pop.addEventListener('click', e => {
        const b = e.target.closest('[data-depth-pick]');
        if (!b) return;
        const v = +b.dataset.depthPick;
        store.set(v); setDepth(v, true); close(); btn.focus();
      });
      pop.addEventListener('keydown', e => {
        const items = $$('button', pop), i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); items[(i + items.length - 1) % items.length].focus(); }
        if (e.key === 'Escape') { close(); btn.focus(); }
      });
      document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) close(); });
      window.addEventListener('hashchange', close);
      window.addEventListener('resize', () => { if (!pop.hidden) place(); });
    }
    $$('.depth-seg [data-depth-pick]').forEach(b => b.addEventListener('click', () => { const v = +b.dataset.depthPick; store.set(v); setDepth(v, true); }));
    setDepth(store.get(), false);
  }

  function initDeep() {
    const blocks = $$('details.deep');
    blocks.forEach(d => {
      const body = $('.deep-body', d);
      const words = (body.textContent.match(/\S+/g) || []).length;
      const tools = $$('.lab-tool', body).length;
      const t = $('.deep-time', d);
      if (t) t.textContent = `≈ ${Math.max(1, Math.ceil(words / 150))} мин`;
      if (tools && !$('.deep-tag', d)) $('.deep-meta', d).insertAdjacentHTML('afterbegin', '<span class="deep-tag">интерактив</span>');
      if ($('details.deeper', body)) $('.deep-meta', d).insertAdjacentHTML('afterbegin', '<span class="deep-tag is-deeper" title="Есть раздел «Ещё глубже»">+1 уровень</span>');
      const foot = document.createElement('div');
      foot.className = 'deep-foot';
      foot.innerHTML = `<button type="button" class="deep-close"><span aria-hidden="true">↑</span> Свернуть разворот</button>`;
      body.appendChild(foot);
      $('.deep-close', foot).addEventListener('click', () => {
        const top = d.getBoundingClientRect().top;
        const offset = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64) + 70;
        if (top < offset) window.scrollBy({ top: top - offset, behavior: 'auto' });
        animateDetails(d, false);
        $('summary', d).focus({ preventScroll: true });
      });
    });

    document.addEventListener('click', e => {
      const sm = e.target.closest('summary');
      if (!sm) return;
      const d = sm.parentElement;
      if (!d || !d.matches(ANIMATED)) return;
      e.preventDefault();
      animateDetails(d, !d.open);
    });

    $$('[data-view]').forEach(view => {
      const list = $$('details.deep', view);
      const hero = $('.ch-hero-text', view);
      if (!list.length || !hero) return;
      const deeper = $$('details.deeper', view).length;
      const nav = document.createElement('nav');
      nav.className = 'deep-index';
      nav.setAttribute('aria-label', 'Научные развороты главы');
      nav.innerHTML = `<span class="deep-index-label">${icon('hex')}Глубже <b>${list.length}${deeper ? ` · ещё глубже ${deeper}` : ''}</b></span>` +
        list.map(d => `<a href="#${d.id}" data-kind="${d.dataset.kind}">${icon(KIND[d.dataset.kind][1])}${esc(d.dataset.short)}</a>`).join('');
      hero.appendChild(nav);
    });

    const kinds = $('#sh-kinds');
    if (kinds) {
      // on the home page the chapters are other files: take the counts the build wrote down
      const st = window.BASIL_PAGES && window.BASIL_PAGES.stats;
      const count = k => st ? (st.kinds[k] || 0) : blocks.filter(d => d.dataset.kind === k).length;
      kinds.innerHTML = Object.entries(KIND).map(([k, [name, ic]]) => `<li data-kind="${k}">${icon(ic)}<b>${count(k)}</b><span>${name}</span></li>`).join('') +
        `<li class="is-total">${icon('grid')}<b>${st ? st.labs : $$('.lab-tool').length}</b><span>моделей</span></li><li class="is-total">${icon('book')}<b>${st ? st.deeper : $$('details.deeper').length}</b><span>«ещё глубже»</span></li>`;
    }
    initDepthControl();
  }

  function initHomeMolecule() {
    const cv = $('#home-molecule');
    if (!cv) return;
    const picks = [['lin', 'Линалоол'], ['eug', 'Эвгенол'], ['est', 'Эстрагол'], ['cit', 'Цитраль'], ['car', 'Кариофиллен']];
    const chips = $('#home-mol-chips');
    chips.innerHTML = picks.map(([id, n], i) => `<button class="chip" type="button" data-v="${id}" aria-pressed="${i === 0}">${n}</button>`).join('');
    let viewer = null;
    const note = { lin: 'цветочная нота генуэзского базилика', eug: 'гвоздика и тепло', est: 'анис тайского базилика', cit: 'лимон лимонного базилика', car: 'перец святого базилика' };
    const show = id => {
      $('#home-mol-name').textContent = MOLS[id].name;
      $('#home-mol-note').textContent = `${sub(MOLS[id].formula)} · ${note[id]}`;
      cv.setAttribute('aria-label', `Трёхмерная модель молекулы: ${MOLS[id].name}`);
      if (viewer) viewer.set(id);
    };
    const start = () => { if (!viewer) viewer = MolViewer(cv, 'lin'); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { start(); io.disconnect(); } });
      io.observe(cv);
    } else start();
    chips.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      $$('[data-v]', chips).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      start();
      show(b.dataset.v);
    });
  }

  const api = {
    $, $$, clamp, lerp, fmt, fmt0, f1, minus, nb, esc, css, icon, sub, mix, ramp, parseColor, reduce,
    animateDetails, rangeHtml, segHtml, chipsHtml, bindRange, bindPick, readHtml, head, chart, plot, tip,
    dayLength, h0, noonSun, decl, DOY21, CITIES, MOLS, EXTRA, FAM, CHEMO, CHEMO_COLS, PAIRS, molName, molFam, MolViewer,
    ctx: () => ctx, mount
  };

  function init(context) {
    ctx = context || {};
    initDeep();
    initHomeMolecule();
    mountAll();
  }

  return { init, register, api, MOLS, CHEMO, PAIRS, KIND };
})();
