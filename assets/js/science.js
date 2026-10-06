/* Гид по базилику — научный слой: развороты «Глубже», данные о молекулах и общие инструменты моделей. Файл собирает scripts/build.py из src/js/science/ — правьте там */
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
  const nb = s => String(s).replace(/([\d¼½¾]) (?=[^\s\d–—-]{1,6}(?=[\s,.;:)!?/]|$))/g, '$1 ').replace(/(\d)([–…])(?=[+−]?\d)/g, '$1$2\u2060').replace(/(^|[^а-яёa-z])([а-яё]{1,4}) (?=[+−≈~]?[\d¼½¾])/gi, '$1$2\u00a0').replace(/([а-яё²³])\/(?=[а-яё])/gi, '$1/\u2060').replace(/(\S) — /g, '$1\u00a0— ').replace(/(^|[^а-яёa-z\u00ad-])(в|с|к|у|о|а|и|я|во|со|ко|об|на|за|по|до|от|из|не|ни|но) (?=\S)/gi, '$1$2\u00a0');
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
  /* form controls — ids are stable so values survive a page refresh     */
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
  // a caption on its own plate (<g data-fit="padding"><rect/><text/></g>): the plate takes the width of the
  // text as drawn — a guess from the number of letters is off for wide letters and for the real font
  function fitLabels(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('g[data-fit]').forEach(g => {
      const r = g.querySelector('rect');
      let l = Infinity, rt = -Infinity;
      g.querySelectorAll('text').forEach(t => {
        let b;
        try { b = t.getBBox(); } catch (e) { return; }
        if (b.width) { l = Math.min(l, b.x); rt = Math.max(rt, b.x + b.width); }
      });
      if (!r || !isFinite(l)) return;
      const pad = +g.dataset.fit || 7;
      r.setAttribute('x', (l - pad).toFixed(1));
      r.setAttribute('width', (rt - l + pad * 2).toFixed(1));
    });
  }
  // and again whenever a font arrives: a caption drawn before its font came is narrower than it ends up
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => fitLabels(document));
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => fitLabels(document));
  }
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
      fitLabels(svg);
    };
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (host.clientWidth && host.clientWidth !== W) redraw(); }).observe(host);
    if (o.onPointer) {
      const fire = (e, kind) => { const r = svg.getBoundingClientRect(); o.onPointer(e.clientX - r.left, e.clientY - r.top, W, H, kind); };
      // dragging across a chart ticks like a dial
      const hap = window.BasilHaptics ? window.BasilHaptics.dragTicker(18) : null;
      svg.addEventListener('pointerdown', e => { if (hap) hap.start(e.clientX, e.clientY); fire(e, 'set'); });
      svg.addEventListener('pointermove', e => { if (hap && e.buttons) hap.move(e.clientX, e.clientY); fire(e, e.buttons ? 'set' : 'hover'); });
      svg.addEventListener('pointerup', () => { if (hap) hap.end(); });
      svg.addEventListener('pointerleave', e => { if (hap) hap.end(); fire(e, 'leave'); });
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
    // floating captions (bands, series) are placed at the end so none is clipped or lies on another
    const floats = [];
    const float = (cls, x, y, anchor, text, cw, rank) => floats.push({ cls, x, y, anchor, text, rank, w: String(text).replace(/<[^>]+>/g, '').length * cw + 4 });
    (o.hbands || []).forEach(b => {
      s += `<rect class="band ${b.cls || ''}" x="${p.l}" y="${Y(b.y1)}" width="${iw}" height="${r1(Y(b.y0) - Y(b.y1))}"/>`;
      if (b.label) float('band-lbl', p.l + iw - 6, Y(b.y1) + 13, 'end', b.label, 6.6, 2);
    });
    (o.vbands || []).forEach(b => {
      s += `<rect class="band ${b.cls || ''}" x="${X(b.x0)}" y="${p.t}" width="${r1(X(b.x1) - X(b.x0))}" height="${ih}"/>`;
      if (b.label) float('band-lbl', r1((X(b.x0) + X(b.x1)) / 2), p.t + 13, 'middle', b.label, 6.6, 1);
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
    // what the captions keep clear of: every line of the series, the marker line and its dots
    const segs = [[p.l, p.t + ih, p.l + iw, p.t + ih]], spots = []; // the axis is a line to keep clear of too
    (o.series || []).forEach(se => {
      const pts = se.pts.filter(pt => isFinite(pt[1]));
      if (!pts.length) return;
      const d = pts.map((pt, i) => `${i ? 'L' : 'M'}${X(pt[0])} ${YS(pt[1])}`).join(' ');
      for (let i = 1; i < pts.length; i++) segs.push([X(pts[i - 1][0]), YS(pts[i - 1][1]), X(pts[i][0]), YS(pts[i][1])]);
      if (se.area) s += `<path class="area ${se.cls}" d="${d} L${X(pts[pts.length - 1][0])} ${p.t + ih} L${X(pts[0][0])} ${p.t + ih} Z"/>`;
      s += `<path class="line ${se.cls}${se.dash ? ' is-dash' : ''}" d="${d}"/>`;
      if (se.label) {
        const at = se.labelAt != null ? pts.reduce((a, b) => Math.abs(b[0] - se.labelAt) < Math.abs(a[0] - se.labelAt) ? b : a) : pts[pts.length - 1];
        float('series-lbl', X(at[0]) + (se.ldx || 0), Y(at[1]) + (se.ldy || -8), se.anchor || 'middle', se.label, 7.2, 0);
      }
    });
    if (o.clip) s += '</g>';
    if (o.marker) {
      const m = o.marker;
      s += `<line class="marker" x1="${X(m.x)}" x2="${X(m.x)}" y1="${p.t}" y2="${p.t + ih}"/>`;
      segs.push([X(m.x), p.t, X(m.x), p.t + ih]);
      (m.dots || []).forEach(dt => { s += `<circle class="dot ${dt.cls}" cx="${X(m.x)}" cy="${Y(dt.y)}" r="5.5"/>`; spots.push([X(m.x) - 7, Y(dt.y) - 7, X(m.x) + 7, Y(dt.y) + 7]); });
    }
    if (o.hover != null) s += `<line class="hover-line" x1="${X(o.hover)}" x2="${X(o.hover)}" y1="${p.t}" y2="${p.t + ih}"/>`;
    // place captions: inside the picture, clear of the axis title and of each other
    const taken = [];
    if (o.ylab) taken.push([p.l - 7, p.t - 20, p.l - 7 + String(o.ylab).length * 6.6 + 6, p.t - 5]);
    const hit = b => taken.some(t => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
    (o.yticks || []).forEach(v => { const t = String((o.fy || String)(v)); taken.push([p.l - 9 - t.length * 6.6, Y(v) - 7, p.l - 5, Y(v) + 6]); });
    // a line crosses a caption's box (Liang–Barsky clipping of the segment)
    const crosses = ([x1, y1, x2, y2], [l, t, r, b]) => {
      let t0 = 0, t1 = 1;
      const dx = x2 - x1, dy = y2 - y1, P = [-dx, dx, -dy, dy], Q = [x1 - l, r - x1, y1 - t, b - y1];
      for (let i = 0; i < 4; i++) {
        if (P[i] === 0) { if (Q[i] < 0) return false; continue; }
        const u = Q[i] / P[i];
        if (P[i] < 0) { if (u > t1) return false; if (u > t0) t0 = u; } else { if (u < t0) return false; if (u < t1) t1 = u; }
      }
      return true;
    };
    const lines = b => segs.reduce((n, sg) => n + (crosses(sg, b) ? 1 : 0), 0) + spots.filter(t => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]).length;
    floats.sort((a, b) => a.rank - b.rank).forEach(f => {
      const base = f.anchor === 'end' ? f.x - f.w : f.anchor === 'middle' ? f.x - f.w / 2 : f.x;
      const lo = Math.min(p.l + 2, o.w - 2 - f.w), hi = o.w - 2 - f.w;
      // the nearest place that is clear of other captions and of the lines; failing that, the one with fewest crossings
      let best = null;
      for (const dx of [0, -0.5, 0.5, -1, 1]) {
        for (const dy of [0, 14, -14, 28, -28, 42, -42]) {
          const x0 = clamp(base + dx * f.w, lo, hi), yy = clamp(f.y + dy, 12, o.h - 4), box = [x0, yy - 10, x0 + f.w, yy + 3];
          if (hit(box)) continue;
          const cost = lines(box) * 100 + Math.abs(dy) / 14 + Math.abs(dx) * 3;
          if (!best || cost < best.cost) best = { x0, y: yy, cost };
        }
      }
      if (!best) best = { x0: clamp(base, lo, hi), y: clamp(f.y, 12, o.h - 4) };
      taken.push([best.x0, best.y - 10, best.x0 + f.w, best.y + 3]);
      s += `<text class="${f.cls}" x="${r1(best.x0 + 2)}" y="${r1(best.y)}" text-anchor="start">${f.text}</text>`;
    });
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
      smell: 'цветочный, лавандовый, свежий', where: 'лаванда, семена кориандра, бергамот, хмель', basil: 'генуэзский, греческий, фиолетовые, коричный, «Пурпурный шар»',
      note: 'Главная молекула европейского базилика. Её же много в семенах кориандра, поэтому базилик и кориандр так похожи по ощущению свежести.',
      atoms: 'CCCCCCCCCCO', bonds: [[0, 1, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6, 2], [6, 7], [2, 8], [6, 9], [2, 10]]
    },
    est: {
      name: 'Эстрагол', alt: 'метилхавикол', formula: 'C10H12O', fam: 'phen', cls: 'фенилпропаноид', bp: 216,
      smell: 'анис, эстрагон, лакрица', where: 'эстрагон, фенхель, анис', basil: 'тайский, фиолетовые, «Арарат», «Анисовый восторг»',
      note: 'Делает тайский базилик анисовым. Летучесть ниже, чем у линалоола, поэтому тайский базилик лучше держит аромат в горячем карри.',
      atoms: 'CCCCCCCCCOC', ring: [0, 1, 2, 3, 4, 5], bonds: RING6.concat([[0, 6], [6, 7], [7, 8, 2], [3, 9], [9, 10]])
    },
    eug: {
      name: 'Эвгенол', formula: 'C10H12O2', fam: 'phen', cls: 'фенилпропаноид', bp: 254,
      smell: 'гвоздика, тёплая пряность', where: 'гвоздика, лавровый лист, душистый перец', basil: 'генуэзский, гвоздичный, тулси, ереванский, «Философ», «Василиск»',
      note: 'Слегка немеет язык — эвгенол давно используют стоматологи как мягкий антисептик и обезболивающее. Самая стойкая нота базилика.',
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
      smell: 'корица, клубника, бальзам', where: 'клубника (многие сорта)', basil: 'коричный; по аромату — «Карамельный»',
      note: 'Корицей пахнет не коричный альдегид, как в самой корице, а родственный ему эфир. Он же есть в клубнике — отсюда пара «клубника и коричный базилик».',
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
  const EXTRA = { meu: { name: 'Метилэвгенол', fam: 'phen', smell: 'гвоздика с анисом, тёплый' }, ber: { name: 'α-Бергамотен', fam: 'sesq', smell: 'древесный, чайный, с бергамотом' } };
  const molName = id => (MOLS[id] || EXTRA[id]).name;
  const molFam = id => (MOLS[id] || EXTRA[id]).fam;

  const CHEMO = [
    { id: 'genovese', name: 'Генуэзский', p: { lin: 45, eug: 14, cin: 8, est: 4, ber: 7, car: 2, cam: 1 }, why: 'Цветочный линалоол и тёплый эвгенол почти без аниса — сладкий «итальянский» базилик. Цинеол добавляет свежести.' },
    { id: 'greek', name: 'Греческий', p: { lin: 42, eug: 12, cin: 10, est: 10, ber: 5, car: 2 }, why: 'Тот же аккорд, что у генуэзского, плюс заметная анисовая нота — вкус получается плотнее и пряней.' },
    { id: 'clove', name: 'Гвоздичный', p: { eug: 36, lin: 30, cin: 6, est: 3, ber: 4, car: 4 }, why: 'Эвгенола почти столько же, сколько линалоола, и гвоздика выходит на первый план. Хорош в маринадах: эвгенол стоек к нагреву.' },
    { id: 'purple', name: 'Фиолетовые', p: { lin: 38, est: 16, eug: 14, cin: 6, ber: 6, car: 3 }, why: 'Линалоол, эвгенол и эстрагол в сопоставимых долях: гвоздика, анис и перчинка. Отсюда пряный «кавказский» характер ереванского и опалового.' },
    { id: 'thai', name: 'Тайский', p: { est: 72, lin: 7, cin: 4, ber: 4, car: 2, eug: 1 }, why: 'Около трёх четвертей масла — эстрагол, поэтому тайский базилик пахнет анисом и лакрицей и не теряется в горячем карри.' },
    { id: 'lemon', name: 'Лимонный', p: { cit: 52, lin: 9, car: 5, est: 4, ber: 3 }, why: 'Цитраль — та же молекула, что в лемонграссе. Отсюда чистый лимонный запах без кислоты.' },
    { id: 'lime', name: 'Лаймовый', p: { cit: 45, lin: 12, car: 6, est: 2 }, why: 'Цитраль с большей долей линалоола и кариофиллена: цитрус с цветочной и перечной нотой.' },
    { id: 'cinnamon', name: 'Коричный', p: { mci: 50, lin: 26, cin: 4, ber: 3, eug: 2 }, why: 'Метилциннамат даёт корицу и клубнику, линалоол — цветочную мягкость. Идеален к ягодам и выпечке.' },
    { id: 'tulsi', name: 'Тулси', p: { eug: 42, car: 20, meu: 12, cin: 3, lin: 2 }, why: 'Эвгенол и метилэвгенол плюс перечный кариофиллен: гвоздика с перцем. Поэтому тулси чаще заваривают, чем кладут в салат.' },
    { id: 'african', name: 'Африканский синий', p: { cam: 36, lin: 24, cin: 16, eug: 3, car: 2 }, why: 'Камфора и цинеол дают «аптечный» холодящий запах. Красив и медонос, но для песто резковат.' }
  ];
  const CHEMO_COLS = ['lin', 'cin', 'cit', 'cam', 'est', 'eug', 'meu', 'mci', 'car', 'ber'];

  const PAIRS = [
    { id: 'tomato', name: 'Томат', mols: ['lin', 'hex'], variety: 'Генуэзский', dish: 'капрезе, маринара, пицца', why: 'Общие молекулы — линалоол и «зелёный» (Z)-3-гексеналь, один из главных запахов свежего томата. Плюс контраст: глутамат и кислота томата оттеняют сладкий аромат базилика.' },
    { id: 'strawberry', name: 'Клубника', mols: ['lin', 'mci'], variety: 'Коричный или лимонный', dish: 'клубника с бальзамиком, лимонады', why: 'В аромате многих сортов клубники есть линалоол и метилциннамат — главная молекула коричного базилика.' },
    { id: 'lemon', name: 'Лимон и лемонграсс', mols: ['cit', 'lin'], variety: 'Лимонный', dish: 'лимонады, рыба, заправки', why: 'Цитраль общий: лимонный базилик синтезирует ту же молекулу, что лемонграсс и лимонная цедра.' },
    { id: 'peach', name: 'Персик', mols: ['lin'], variety: 'Генуэзский или коричный', dish: 'салат с персиком и моцареллой, сорбет', why: 'Линалоол входит в аромат персика вместе со сливочными лактонами. Базилик подчёркивает цветочную сторону фрукта.' },
    { id: 'coriander', name: 'Кориандр', mols: ['lin'], variety: 'Генуэзский', dish: 'маринады, соусы, карри', why: 'Эфирное масло семян кориандра больше чем наполовину состоит из линалоола.' },
    { id: 'fennel', name: 'Фенхель, эстрагон', mols: ['est'], variety: 'Тайский', dish: 'рыба, бульоны, азиатские супы', why: 'Эстрагол — главная молекула эстрагона и заметная часть аромата фенхеля. Анисовые ноты усиливают друг друга.' },
    { id: 'clove', name: 'Гвоздика и лавр', mols: ['eug', 'cin'], variety: 'Гвоздичный или тулси', dish: 'маринады, томатные соусы, чай', why: 'Эвгенол — основа запаха гвоздики. В лавровом листе есть и цинеол, и эвгенол.' },
    { id: 'pepper', name: 'Чёрный перец', mols: ['car'], variety: 'Тулси или лимонный', dish: 'паста, мясо, сыр', why: 'β-кариофиллен — одна из главных молекул чёрного перца.' },
    { id: 'rosemary', name: 'Розмарин', mols: ['cin', 'cam'], variety: 'Африканский синий', dish: 'запечённые овощи, мясо', why: 'Цинеол и камфора общие, но розмарин сильнее и легко перебивает базилик: кладите его заметно меньше.' },
    { id: 'mint', name: 'Мята', mols: ['cin'], variety: 'Лимонный или генуэзский', dish: 'летние салаты, лимонады', why: 'Обе — яснотковые. В мяте тоже есть цинеол, но главная её молекула — ментол, который холодит сильнее.' },
    { id: 'cocoa', name: 'Тёмный шоколад', mols: ['lin'], variety: 'Коричный или генуэзский', dish: 'ганаш, трюфели', why: 'Линалоол отвечает за цветочные ноты тонкого какао. Базилик их подхватывает, а горечь шоколада гасит сладость.' },
    { id: 'olive', name: 'Оливковое масло', mols: [], kin: ['hex'], variety: 'Любой', dish: 'песто, заправки', why: 'Свежее масло пахнет зелёными альдегидами — родственниками гексеналя. А главное, жир растворяет и удерживает терпены базилика.' },
    { id: 'cucumber', name: 'Огурец, арбуз', mols: [], kin: ['hex'], variety: 'Лимонный или генуэзский', dish: 'холодные супы, салаты, лимонады', why: 'Их свежесть дают девятиуглеродные «зелёные» альдегиды — дальняя родня гексеналя, одна обонятельная семья.' },
    { id: 'mozzarella', name: 'Моцарелла, сливки', mols: [], variety: 'Генуэзский', dish: 'капрезе, сливочные соусы', why: 'Общих молекул почти нет — работает контраст: нейтральный жир растворяет аромат и продлевает его, молочная свежесть оттеняет пряность.' },
    { id: 'parmesan', name: 'Пармезан', mols: [], variety: 'Генуэзский', dish: 'песто', why: 'Глутамат выдержанного сыра даёт умами, соль усиливает восприятие аромата, жир его удерживает.' },
    { id: 'garlic', name: 'Чеснок', mols: [], variety: 'Генуэзский', dish: 'песто, писту', why: 'Контраст: острые серные соединения из аллицина против цветочных терпенов. Вместе — средиземноморский аккорд.' },
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

  /* the molecule's turn: a 3×3 matrix (rows), so that it goes over the top as far as the finger takes it */
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
  const mul = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  // thousands of small turns bend the matrix a little: it is squared up again after each one
  const ortho = R => {
    const n = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
    const a = n(R[0]), d = a[0] * R[1][0] + a[1] * R[1][1] + a[2] * R[1][2];
    const b = n(R[1].map((x, i) => x - d * a[i]));
    return [a, b, [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]];
  };
  // seen a little from above, it turns by itself as on a turntable: round the upright axis tipped by that look
  const TILT = rx(-0.35), UNTILT = rx(0.35);

  /* 3D ball-and-stick viewer on canvas: turns by itself; a finger or the mouse turns it any way — sideways round the
     screen's upright axis, up and down round its level axis, over the top as far as one likes. The canvas keeps the
     whole gesture (touch-action: none): the page is scrolled past it, and on a phone it is never more than 44 % of the
     screen high (06-lab-tools.css) */
  function MolViewer(canvas, id) {
    const ctx = canvas.getContext('2d');
    let mol = MOLS[id], P = shape(id);
    // R: the turn; spin: the turntable's speed (rad/s), wx: what is left of an up-or-down flick
    let R = mul(TILT, ry(0.6)), spin = 0.35, wx = 0, dpr = 1, W = 0, H = 0, raf = 0, last = 0, visible = true, drag = null;
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
      const maxR = Math.max(...P.map(p => Math.hypot(p[0], p[1], p[2]))) || 1;
      const scale = Math.min(W, H) * 0.44 / maxR;
      const f = maxR * 4;
      const [r0, r1, r2] = R;
      const Q = P.map(([x, y, z]) => {
        const x1 = r0[0] * x + r0[1] * y + r0[2] * z, y1 = r1[0] * x + r1[1] * y + r1[2] * z, z1 = r2[0] * x + r2[1] * y + r2[2] * z;
        const k = f / (f - z1);
        return { x: W / 2 + x1 * scale * k, y: H / 2 + y1 * scale * k, z: z1, k };
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
    const SC = window.BasilScene;
    const ready = SC && SC.gate ? SC.gate(60, 30) : () => true;
    function frame(ts) {
      raf = 0;
      if (!visible || document.hidden) return;
      // the page is left alone: the molecule stops turning until the reader comes back
      if (SC && SC.calm && SC.calm.state === 'sleep' && !drag) { SC.calm.onWake(wake); return; }
      raf = requestAnimationFrame(frame);
      if (!drag && !ready(ts)) return;
      const t = ts / 1000, dt = Math.min(0.05, t - (last || t));
      last = t;
      if (!drag) {
        // the turntable, and the rest of a flick: sideways it melts into the turntable's own speed, up or down it fades
        R = mul(TILT, mul(ry(spin * dt), mul(UNTILT, R)));
        if (Math.abs(wx) > 1e-3) R = mul(rx(wx * dt), R);
        R = ortho(R);
        spin += (0.35 - spin) * 0.02;
        wx -= wx * 0.04;
      }
      draw();
    }
    const wake = () => { if (reduce.matches) { draw(); return; } if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    const hap = window.BasilHaptics ? window.BasilHaptics.dragTicker(22) : null;
    // one finger turns it; a second one on the canvas is not a new turn from another place
    canvas.addEventListener('pointerdown', e => {
      if (drag) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      if (hap) hap.start(e.clientX, e.clientY);
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (hap) hap.move(e.clientX, e.clientY);
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      // the near side follows the finger: sideways round the upright axis, down round the level one
      const b = dx * 0.012, a = -dy * 0.012;
      R = ortho(mul(rx(a), mul(ry(b), R)));
      const dt = Math.max(16, performance.now() - drag.t) / 1000;
      spin = clamp(b / dt, -6, 6);
      wx = clamp(a / dt, -6, 6);
      drag = { id: drag.id, x: e.clientX, y: e.clientY, t: performance.now() };
      if (reduce.matches) draw();
    });
    // a finger that stood still before letting go puts the molecule down: no flick, the turntable comes back slowly
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (performance.now() - drag.t > 90) { spin = 0; wx = 0; }
      drag = null;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.style.touchAction = 'none';
    readPal(); size(); draw(); wake();
    if ('ResizeObserver' in window) new ResizeObserver(() => { size(); draw(); }).observe(canvas);
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { visible = en.some(x => x.isIntersecting); if (visible) wake(); }).observe(canvas);
    document.addEventListener('visibilitychange', wake);
    document.addEventListener('basil:theme', () => { readPal(); draw(); });
    const api = {
      set(nid) { mol = MOLS[nid]; P = shape(nid); spin = 1.6; draw(); wake(); },
      get id() { return Object.keys(MOLS).find(k => MOLS[k] === mol); },
      // the turn as it stands (tests/gestures.js reads it from the canvas)
      get turn() { return R.map(r => r.slice()); }
    };
    canvas.molView = api;
    return api;
  }

  /* ------------------------------------------------------------------ */
  /* registry: every <div class="lab-tool" data-lab="…"> gets its model  */
  /* when it first becomes visible (inside an opened «Глубже»)           */
  /* ------------------------------------------------------------------ */
  const labs = {};
  const register = (name, fn) => { labs[name] = fn; };
  /* models live in assets/js/labs/<chapter>.js (built from src/labs/<chapter>/); a page fetches
     its chapter's file only when the first model scrolls near */
  const SELF = document.currentScript && document.currentScript.src;
  const loads = {};
  // one script, once: assets/js/<path> with the fingerprint of its content
  const url = (path, v) => (SELF ? SELF.replace(/science\.js(\?.*)?$/, '') : 'assets/js/') + path + (v ? '?v=' + v : '');
  // the page's own scripts (a chapter with pictures brings its files with it): they have run, or will run before
  // DOMContentLoaded
  const own = src => [...document.scripts].some(t => t.src === src);
  const parsed = () => new Promise(r => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', r, { once: true }); else r(); });
  function script(key, path, v) {
    if (!loads[key] && own(url(path, v))) loads[key] = parsed();
    if (!loads[key]) {
      loads[key] = new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = url(path, v);
        // fetched side by side with the others asked for, run in the order they were asked for
        tag.async = false;
        tag.onload = resolve;
        tag.onerror = () => { loads[key] = null; reject(new Error(path)); };
        document.head.appendChild(tag);
      });
    }
    return loads[key];
  }
  // a chapter's models: the drawing libraries it needs (kept in the cache from chapter to chapter), then the
  // chapter's own file — all asked for at once, run in that order
  function ensureLabs(view) {
    const V = window.BASIL_PAGES && window.BASIL_PAGES.v;
    const libs = (V && V.deps && V.deps[view]) || [];
    return Promise.all(libs.map(x => script('lib-' + x, `labs/lib-${x}.js`, V && V.lib && V.lib[x]))
      .concat(script(view, `labs/${view}.js`, V && V.labs && V.labs[view])));
  }
  let ctx = {};
  // a chapter's model styles come in its file and go onto the page just before its first model is built
  const styles = {};
  const styleFor = (view, css) => { if (!(view in styles)) styles[view] = css; };
  function styleOn(el) {
    const host = el.closest('[data-view]'), v = host && host.dataset.view;
    if (!v || !styles[v]) return;
    const st = document.createElement('style');
    st.dataset.labs = v;
    st.textContent = styles[v];
    document.head.appendChild(st);
    styles[v] = '';
  }

  const failed = el => { el.innerHTML = '<p class="muted">Модель не загрузилась. Обновите страницу.</p>'; };

  /* what comes near the screen is built a piece at a time: up to ~8 ms of work per turn, the nearest to the
     middle of the screen first — scrolling and taps never wait for a whole row of pictures and models */
  const work = [];
  let working = false;
  const pause = () => (window.scheduler && typeof window.scheduler.yield === 'function' ? window.scheduler.yield() : new Promise(r => setTimeout(r, 0)));
  // top: where the element stands on the page (an observer entry gives it without measuring again);
  // the order is decided by those numbers alone — measuring between drawings would lay the page out each time
  function later(el, fn, top) {
    if (el._queued) return;
    el._queued = fn;
    el._top = top != null ? top : el.getBoundingClientRect().top + scrollY;
    work.push(el);
    // never in the task that asked: an observer callback or a script that just loaded ends first
    if (!working) { working = true; pause().then(drain); }
  }
  async function drain() {
    while (work.length) {
      view = { y: scrollY, h: innerHeight };
      const mid = view.y + view.h / 2;
      if (work.length > 1) work.sort((a, b) => Math.abs(a._top - mid) - Math.abs(b._top - mid));
      const t0 = performance.now();
      while (work.length && performance.now() - t0 < 8) {
        const el = work.shift(), fn = el._queued;
        el._queued = null;
        try { fn(el); } catch (err) { console.error('[basil]', err); }
      }
      view = null;
      if (work.length) await pause();
    }
    working = false;
  }
  function mount(el) {
    if (el.dataset.ready) return;
    const fn = labs[el.dataset.lab];
    if (!fn) {
      // not loaded yet: fetch the chapter's models once, then try again
      const host = el.closest('[data-view]');
      if (!host || el.dataset.loading) return;
      el.dataset.loading = '1';
      ensureLabs(host.dataset.view).then(() => { delete el.dataset.loading; if (labs[el.dataset.lab]) later(el, mount, el._top); else failed(el); }, () => { delete el.dataset.loading; failed(el); });
      return;
    }
    el.dataset.ready = '1';
    styleOn(el);
    try { fn(el, api); } catch (err) { console.error('[basil] lab ' + el.dataset.lab, err); failed(el); }
  }
  function mountAll() {
    const tools = $$('.lab-tool[data-lab]');
    if (!('IntersectionObserver' in window)) { tools.forEach(mount); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { later(en.target, mount, en.boundingClientRect.top + scrollY); io.unobserve(en.target); } }), { rootMargin: '200px 0px' });
    tools.forEach(t => io.observe(t));
  }

  /* illustrations: <span data-ill="painter:variant"> gets its picture from the chapter's model file
     (the painters register there with illustrate()); drawn when it comes near the screen.
     A painter may list its variants (an array or a function returning one): the tests and the
     gallery then draw the ones a page shows only after a tap */
  const ills = {};
  const illKeys = {};
  const illustrate = (name, fn, keys) => { ills[name] = fn; if (keys) illKeys[name] = keys; };
  const variants = () => Object.keys(illKeys).reduce((o, n) => { o[n] = (typeof illKeys[n] === 'function' ? illKeys[n]() : illKeys[n]).map(String); return o; }, {});
  // fit: false when a batch is drawn — all pictures first, then all captions fitted, one layout instead of one each
  function draw(el, fit = true) {
    const [name, arg = ''] = el.dataset.ill.split(':');
    const fn = ills[name];
    if (!fn) {
      const host = el.closest('[data-view]');
      if (!host || el.dataset.loading) return;
      el.dataset.loading = '1';
      ensureLabs(host.dataset.view).then(() => { delete el.dataset.loading; if (ills[name]) later(el, drawDue, el._top); }, () => { delete el.dataset.loading; });
      return;
    }
    try {
      el.innerHTML = fn(arg, el);
      el.dataset.drawn = el.dataset.ill;
      if (fit) fitIll(el);
      // drawn while the reader looks at its frame: it comes up out of its paper instead of popping in
      if (seen(el) && el.firstElementChild) el.firstElementChild.classList.add('ill-in');
    } catch (err) { console.error('[basil] illustration ' + el.dataset.ill, err); }
  }
  // a caption's plate takes the width of its text — which a picture in a hidden tab does not have yet:
  // fitted when the tab comes up
  // (hidden is told by the markup — asking the box would lay the whole page out right after a large picture went in)
  const HIDDEN = '[data-panel]:not(.is-active), details:not([open]) > :not(summary), [hidden], dialog:not([open])';
  const fitIll = el => { if (el.closest(HIDDEN)) el._unfit = true; else fitLabels(el); };
  // on the screen now, by the place the observer saw it at (no new measuring); a frame never measured is not,
  // and before the page's first paint nothing is: a picture ready by then is simply there
  let paintedYet = false;
  const painted = () => paintedYet || (paintedYet = !!performance.getEntriesByType && performance.getEntriesByType('paint').length > 0);
  // where the screen stands, read once before a batch of drawings: scrollY asked right after a picture went in
  // lays the whole page out again — once for every picture of the batch
  let view = null;
  const seen = el => {
    const y = view ? view.y : scrollY, h = view ? view.h : innerHeight;
    return el._top != null && el._top < y + h && el._top > y - 240 && painted();
  };
  // from the queue: drawn only if nothing drew it in the meantime (a tap, an eager paint)
  const drawDue = el => { if (el.isConnected && el.dataset.drawn !== el.dataset.ill) draw(el); };
  // scrollMargin: a tile in a row that scrolls sideways is drawn a little before it slides in (ignored where unknown)
  let illIO = null;
  // eager: draw now (a gallery the reader sees at once, or a picture replaced on a tap)
  function paint(root = document, eager = false) {
    const list = $$('[data-ill]', root).filter(el => el.dataset.drawn !== el.dataset.ill);
    if (root !== document && root.matches && root.matches('[data-ill]')) list.push(root);
    if (eager || !('IntersectionObserver' in window)) { list.forEach(draw); return; }
    if (!illIO) illIO = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { later(en.target, drawDue, en.boundingClientRect.top + scrollY); illIO.unobserve(en.target); } }), { rootMargin: '400px 0px', scrollMargin: '0px 300px' });
    // what already stands on the screen is drawn now when its painter is here (the interface builds a block of
    // pictures during start-up, and the queue waits for the start-up to end): all measured first, then all drawn,
    // then all their captions fitted — the reader looks at these, none of them waits a turn
    const vh = innerHeight, now = [], rest = [];
    list.forEach(el => {
      if (ills[el.dataset.ill.split(':')[0]] && el.getClientRects().length) {
        const r = el.getBoundingClientRect();
        // on the screen both ways: a row of tiles that scrolls sideways shows only its first few
        if (r.bottom > 0 && r.top < vh && r.right > 0 && r.left < innerWidth) { el._top = r.top + scrollY; now.push(el); return; }
      }
      rest.push(el);
    });
    // the ones off the screen wait until the interface has started: they are not what the reader looks at
    const watch = () => rest.forEach(el => illIO.observe(el));
    if (document.documentElement.classList.contains('is-ready')) watch(); else document.addEventListener('basil:ready', watch, { once: true });
    view = { y: scrollY, h: vh };
    now.forEach(el => draw(el, false));
    view = null;
    now.forEach(el => { if (el.dataset.drawn) fitIll(el); });
  }

  /* a tab coming up (the router says so before its first frame): what it shows on the screen is drawn now,
     and the captions of the pictures drawn ahead while it was hidden take the width of their text */
  document.addEventListener('basil:panel', e => {
    const panel = document.getElementById(e.detail && e.detail.id);
    if (!panel) return;
    $$('[data-ill]', panel).forEach(el => { if (el._unfit) { el._unfit = false; fitLabels(el); } });
    // a tap asked for this tab: all it shows is drawn before its first frame, none left blank for a turn
    paint(panel);
  });

  let stirred = 0;
  ['scroll', 'wheel', 'pointerdown', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => { stirred = performance.now(); }, { passive: true, capture: true }));
  /* once the interface has started, in idle moments: the page's other pictures — the rest of the open tab, then
     the hidden tabs — drawn ahead a few at a time, so a tab or a fast scroll finds them ready */
  function ahead() {
    const idle = window.requestIdleCallback || ((fn, o) => setTimeout(() => fn({ timeRemaining: () => 8 }), 120));
    const host = document.querySelector('[data-view].is-active') || document.querySelector('[data-view]');
    if (!host) return;
    const hidden = el => !!el.closest('[data-panel]:not(.is-active)');
    const list = $$('[data-ill]', host).filter(el => el.dataset.drawn !== el.dataset.ill && ills[el.dataset.ill.split(':')[0]]);
    list.sort((a, b) => hidden(a) - hidden(b));
    // one picture per idle moment, and only while the reader is still (no scrolling or tapping for 1.5 s):
    // a large one (a box of seedlings, a bush) is work that cannot be split, and must not land in the middle of a swipe
    const step = d => {
      if (performance.now() - stirred < 1500) { setTimeout(() => idle(step, { timeout: 4000 }), 800); return; }
      if (d.timeRemaining() > 8 || d.didTimeout) { const el = list.shift(); if (el.isConnected && el.dataset.drawn !== el.dataset.ill) draw(el); }
      if (list.length) idle(step, { timeout: 4000 });
    };
    if (list.length) idle(step, { timeout: 4000 });
  }
  // not while the page is starting: a reader who taps a tab before then gets its pictures drawn on the tap
  document.addEventListener('basil:ready', () => setTimeout(ahead, 2500), { once: true });

  /* a chapter with pictures brings its picture files with it (the build puts them after science.js): the
     pictures already on the screen are drawn at DOMContentLoaded, before the interface starts — not after the
     whole start-up and a turn in the queue */
  function early() {
    if (![...document.scripts].some(t => /\/labs\/[a-z]+\.js/.test(t.src))) return;
    parsed().then(() => {
      const host = document.querySelector('[data-view].is-active') || document.querySelector('[data-view]');
      if (!host) return;
      $$('[data-ill]', host).forEach(el => {
        const [name] = el.dataset.ill.split(':');
        if (!ills[name] || el.dataset.drawn === el.dataset.ill || !el.getClientRects().length) return;
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) { el._top = r.top + scrollY; draw(el); }
      });
    });
  }
  early();
  /* ------------------------------------------------------------------ */
  /* deep blocks: reading time, chapter index, a tab's «Раскрыть все»    */
  /* ------------------------------------------------------------------ */
  const KIND = { chem: ['Химия', 'hex'], phys: ['Физика', 'wave'], bio: ['Биология', 'cell'], taste: ['Вкус', 'nose'] };
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

  // «Раскрыть все» in a tab's «Глубже» line (the build writes it where there are two dives or more): every dive
  // of that zone at once, and «Свернуть все» once they all stand open
  function initDeepAll() {
    const zones = $$('.deep-zone').filter(z => $('[data-deep-all]', z));
    const sync = z => {
      const list = $$('details.deep', z), all = list.every(d => d.open);
      const b = $('[data-deep-all]', z);
      b.textContent = all ? 'Свернуть все' : 'Раскрыть все';
      b.setAttribute('aria-pressed', String(all));
    };
    zones.forEach(z => {
      $('[data-deep-all]', z).addEventListener('click', () => {
        const list = $$('details.deep', z), open = !list.every(d => d.open);
        list.forEach(d => { if (d.open !== open) animateDetails(d, open); });
        sync(z);
      });
      $$('details.deep', z).forEach(d => d.addEventListener('toggle', () => sync(z)));
      sync(z);
    });
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
      // the build writes the row into the page; a page without it (an old copy) gets it here
      if (!list.length || !hero || $('.deep-index', hero)) return;
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
    initDeepAll();
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
    $, $$, clamp, lerp, fmt, fmt0, f1, minus, nb, esc, css, icon, sub, plural, mix, ramp, parseColor, reduce,
    animateDetails, rangeHtml, segHtml, chipsHtml, bindRange, bindPick, readHtml, head, chart, plot, tip,
    dayLength, h0, noonSun, decl, DOY21, CITIES, MOLS, EXTRA, FAM, CHEMO, CHEMO_COLS, PAIRS, molName, molFam, MolViewer,
    ctx: () => ctx, mount
  };

  function init(context) {
    ctx = context || {};
    initDeep();
    initHomeMolecule();
    // models and pictures are looked for once the page stands where it opens: a link to a block far down
    // jumps there first (the router's first «basil:view»), and the ones above it are not built for nothing
    // pictures at once; the models (heavier, and below the first screen) once the interface has started
    let started = false;
    const models = () => { if (document.documentElement.classList.contains('is-ready')) mountAll(); else document.addEventListener('basil:ready', mountAll, { once: true }); };
    const start = () => { if (started) return; started = true; paint(); models(); };
    document.addEventListener('basil:view', start, { once: true });
    setTimeout(start, 2000);
  }

  return { init, register, illustrate, paint, variants, styleFor, api, MOLS, CHEMO, PAIRS, KIND };
})();
