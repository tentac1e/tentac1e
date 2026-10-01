/* Гид по базилику — живые модели главы «Сорта». Файл собирает scripts/build.py из src/labs/sorta/ — правьте там */
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

  /* ---------------- micro: drawing a leaf under the microscope ----------------
     Cells are soft superellipses with a little seeded wobble, so the section looks alive but is the
     same on every visit. Everything returns SVG markup; colours come from the --mic-* tokens. */
  const micro = (() => {
    const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const q = v => Math.round(v * 10) / 10;
    // closed Catmull-Rom spline through points → cubic Béziers
    const smooth = P => {
      const n = P.length;
      let d = `M${q(P[0][0])} ${q(P[0][1])}`;
      for (let i = 0; i < n; i++) {
        const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
        d += `C${q(p1[0] + (p2[0] - p0[0]) / 6)} ${q(p1[1] + (p2[1] - p0[1]) / 6)} ${q(p2[0] - (p3[0] - p1[0]) / 6)} ${q(p2[1] - (p3[1] - p1[1]) / 6)} ${q(p2[0])} ${q(p2[1])}`;
      }
      return d + 'Z';
    };
    // one cell: p — squareness (2 = ellipse, 5 = rounded box), j — wobble
    function cell(cx, cy, rx, ry, rnd, o = {}) {
      const n = o.n || 10, j = o.j == null ? 0.06 : o.j, p = o.p || 3.2, P = [];
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2 + (o.phase || 0), c = Math.cos(t), s = Math.sin(t);
        const r = 1 + (rnd() - 0.5) * 2 * j;
        P.push([cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * r, cy + ry * Math.sign(s) * Math.pow(Math.abs(s), 2 / p) * r]);
      }
      return smooth(P);
    }
    // many small ellipses (chloroplasts, nuclei) as one path: [cx, cy, rx, ry, angle°]
    function dots(list) {
      let d = '';
      list.forEach(([cx, cy, rx, ry, a = 0]) => {
        const t = a * Math.PI / 180, dx = rx * Math.cos(t), dy = rx * Math.sin(t);
        d += `M${q(cx - dx)} ${q(cy - dy)}A${rx} ${ry} ${a} 1 0 ${q(cx + dx)} ${q(cy + dy)}A${rx} ${ry} ${a} 1 0 ${q(cx - dx)} ${q(cy - dy)}Z`;
      });
      return d;
    }
    // chloroplasts lining the inside of a cell wall
    function lining(cx, cy, rx, ry, count, rnd, size = [3.1, 1.8]) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2 + rnd() * 0.5;
        out.push([cx + (rx - size[0] - 0.8) * Math.cos(t), cy + (ry - size[1] - 1.2) * Math.sin(t), size[0], size[1], t * 180 / Math.PI + 90]);
      }
      return out;
    }

    /* a leaf in cross-section, `w` pixels wide.
       o: { top, epi, pal: [layer heights], spo, lo, veins: [x], stomata: [x], seed, sel } → { svg, y: {…} } */
    function section(w, o) {
      const rnd = rng(o.seed || 7);
      const y = {};
      y.cut = o.top;
      y.epi = o.top + 1.5;
      y.pal = y.epi + o.epi;
      y.spo = y.pal + o.pal.reduce((a, b) => a + b, 0);
      y.lo = y.spo + o.spo;
      y.bot = y.lo + o.lo;
      const T = (t, body, extra = '') => `<g class="mic-t" data-t="${t}"${extra}>${body}</g>`;
      let s = `<rect class="mic-gasbg" x="0" y="${q(y.epi)}" width="${w}" height="${q(y.bot - y.epi)}"/>`;
      // upper epidermis
      let epi = '', nuc = [];
      for (let x = -rnd() * 20; x < w; ) {
        const cw = 26 + rnd() * 16;
        epi += `<path class="mic-epi" d="${cell(x + cw / 2, y.epi + o.epi / 2, cw / 2 - 0.8, o.epi / 2 - 0.9, rnd, { p: 4.2, j: 0.04 })}"/>`;
        if (rnd() < 0.35) nuc.push([x + cw * (0.3 + rnd() * 0.4), y.epi + o.epi - 5, 3.4, 2, 0]);
        x += cw;
      }
      epi += `<path class="mic-nuc" d="${dots(nuc)}"/>`;
      // cuticle: a waxy line with the faintest wave
      let cd = `M0 ${q(y.cut)}`;
      for (let x = 0; x <= w; x += 12) cd += `L${x} ${q(y.cut + Math.sin(x * 0.21) * 0.5)}`;
      epi += `<path class="mic-cut" d="${cd}"/>`;
      s += T('epi', epi);
      // palisade: tall cells packed with chloroplasts
      let pal = '', chl = [];
      nuc = [];
      let py = y.pal;
      o.pal.forEach((lh, k) => {
        for (let x = -rnd() * 12 - (k ? 8 : 0); x < w; ) {
          const cw = 14 + rnd() * 5, cx = x + cw / 2, cy = py + lh / 2, rx = cw / 2 - 1.2, ry = lh / 2 - 1.6;
          {
            pal += `<path class="mic-pal" d="${cell(cx, cy, rx, ry, rnd, { p: 5, j: 0.035, n: 12 })}"/>`;
            const nn = Math.round(lh / 6.5);
            for (let i = 0; i < nn; i++) {
              const yy = cy - ry + 4.5 + (i + 0.5) * ((ry * 2 - 9) / nn);
              if (rnd() > 0.12) chl.push([cx - rx + 3.3, yy, 3.2, 1.9, 90]);
              if (rnd() > 0.12) chl.push([cx + rx - 3.3, yy + 1.6, 3.2, 1.9, 90]);
            }
            if (rnd() > 0.35) chl.push([cx, cy - ry + 3, 2.9, 1.8, 0]);
            if (rnd() < 0.3) nuc.push([cx + (rnd() - 0.5) * 3, cy + (rnd() - 0.5) * lh * 0.4, 2.6, 3.4, 0]);
          }
          x += cw + 1.4;
        }
        py += lh;
      });
      pal += `<path class="mic-chl" d="${dots(chl)}"/><path class="mic-nuc" d="${dots(nuc)}"/>`;
      s += T('pal', pal);
      // veins and stomata make room in the spongy layer
      const veins = (o.veins || []).map(x => ({ x, y: y.spo + Math.min(40, o.spo * 0.42), rx: 40, ry: 31 }));
      const cavities = (o.stomata || []).map(x => ({ x, y: y.lo - 12, r: 20 }));
      let spo = '';
      chl = [];
      nuc = [];
      const rows = Math.max(2, Math.round(o.spo / 24));
      for (let r = 0; r < rows; r++) {
        const gy = y.spo + (r + 0.5) * (o.spo / rows);
        for (let x = (r % 2) * 13 - rnd() * 8; x < w + 14; x += 25 + rnd() * 6) {
          const cx = x + (rnd() - 0.5) * 6, cy = gy + (rnd() - 0.5) * 6, rx = 9 + rnd() * 4.5, ry = 6.5 + rnd() * 3.5;
          if (veins.some(v => ((cx - v.x) / (v.rx + rx)) ** 2 + ((cy - v.y) / (v.ry + ry)) ** 2 < 1)) continue;
          if (cavities.some(c => Math.hypot(cx - c.x, cy - c.y) < c.r + ry)) continue;
          spo += `<path class="mic-spo" d="${cell(cx, cy, rx, ry, rnd, { p: 2.3, j: 0.16, n: 8, phase: rnd() * 3 })}"/>`;
          lining(cx, cy, rx, ry, 3 + Math.round(rnd() * 2), rnd, [2.9, 1.7]).forEach(c => chl.push(c));
          if (rnd() < 0.2) nuc.push([cx, cy, 2.4, 2.4, 0]);
        }
      }
      spo += `<path class="mic-chl is-pale" d="${dots(chl)}"/><path class="mic-nuc" d="${dots(nuc)}"/>`;
      s += T('spo', spo);
      // veins: bundle sheath ring, xylem above, phloem below
      veins.forEach((v, vi) => {
        let g = `<ellipse class="mic-hit" cx="${q(v.x)}" cy="${q(v.y)}" rx="${v.rx + 4}" ry="${v.ry + 4}"/>`;
        const n = 13, sh = [];
        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2;
          g += `<path class="mic-sheath" d="${cell(v.x + (v.rx - 7) * Math.cos(t), v.y + (v.ry - 6) * Math.sin(t), 8.6, 7, rnd, { p: 2.4, j: 0.1, n: 8 })}"/>`;
          sh.push([v.x + (v.rx - 7) * Math.cos(t) + 2, v.y + (v.ry - 6) * Math.sin(t) - 1, 2.4, 1.5, rnd() * 180]);
        }
        g += `<path class="mic-chl is-pale" d="${dots(sh)}"/>`;
        g += `<ellipse class="mic-bundle" cx="${q(v.x)}" cy="${q(v.y)}" rx="${v.rx - 14}" ry="${v.ry - 12}"/>`;
        [[-13, -9, 5.4], [0, -12, 6.6], [13, -8, 5], [-6, 0, 3.8], [7, -1, 4.2], [-19, -1, 3]].forEach(([dx, dy, r]) => {
          g += `<circle class="mic-xyl" cx="${q(v.x + dx)}" cy="${q(v.y + dy)}" r="${r}"/>`;
        });
        const ph = [];
        for (let i = 0; i < 11; i++) {
          const t = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
          const cx = v.x + Math.cos(t) * rr * 17, cy = v.y + 10 + Math.sin(t) * rr * 5.5;
          g += `<circle class="mic-phl" cx="${q(cx)}" cy="${q(cy)}" r="${q(2.4 + rnd() * 1.4)}"/>`;
          if (rnd() < 0.6) ph.push([cx + 2.6, cy - 1.6, 1.1, 1.1, 0]);
        }
        g += `<path class="mic-comp" d="${dots(ph)}"/>`;
        s += T('vein', g, ` data-i="${vi}"`);
      });
      // lower epidermis with stomata
      let lo = '';
      nuc = [];
      const stoma = o.stomata || [];
      for (let x = -rnd() * 16; x < w; ) {
        const cw = 22 + rnd() * 14;
        const cx = x + cw / 2;
        if (!stoma.some(sx => Math.abs(cx - sx) < cw / 2 + 12)) {
          lo += `<path class="mic-epi" d="${cell(cx, y.lo + o.lo / 2, cw / 2 - 0.8, o.lo / 2 - 0.9, rnd, { p: 4.2, j: 0.04 })}"/>`;
          if (rnd() < 0.3) nuc.push([x + cw * (0.3 + rnd() * 0.4), y.lo + 4.6, 3, 1.8, 0]);
        }
        x += cw;
      }
      lo += `<path class="mic-nuc" d="${dots(nuc)}"/>`;
      let ld = `M0 ${q(y.bot)}`;
      for (let x = 0; x <= w; x += 12) ld += `L${x} ${q(y.bot + Math.sin(x * 0.19) * 0.5)}`;
      lo += `<path class="mic-cut" d="${ld}"/>`;
      s += T('loepi', lo);
      stoma.forEach((sx, si) => {
        const gy = y.lo + o.lo / 2;
        let g = `<rect class="mic-hit" x="${q(sx - 22)}" y="${q(y.lo - 30)}" width="44" height="${q(o.lo + 34)}"/>`;
        g += `<path class="mic-cavity" d="${cell(sx, y.lo - 11, 19, 14, rnd, { p: 2.2, j: 0.12, n: 9 })}"/>`;
        g += `<path class="mic-epi" d="${cell(sx - 21, gy, 7, o.lo / 2 - 1, rnd, { p: 3.6, j: 0.03 })}"/><path class="mic-epi" d="${cell(sx + 21, gy, 7, o.lo / 2 - 1, rnd, { p: 3.6, j: 0.03 })}"/>`;
        g += `<path class="mic-guard" d="${cell(sx - 7.6, gy, 6.2, o.lo / 2 + 0.6, rnd, { p: 2.3, j: 0.03 })}"/><path class="mic-guard" d="${cell(sx + 7.6, gy, 6.2, o.lo / 2 + 0.6, rnd, { p: 2.3, j: 0.03 })}"/>`;
        g += `<path class="mic-guard-wall" d="M${q(sx - 2.6)} ${q(gy - 5)} Q ${q(sx - 1.2)} ${q(gy)} ${q(sx - 2.6)} ${q(gy + 5)} M${q(sx + 2.6)} ${q(gy - 5)} Q ${q(sx + 1.2)} ${q(gy)} ${q(sx + 2.6)} ${q(gy + 5)}"/>`;
        g += `<path class="mic-chl" d="${dots([[sx - 9, gy - 2, 1.8, 1.2, 60], [sx - 8, gy + 3, 1.8, 1.2, 120], [sx + 9, gy - 2, 1.8, 1.2, 120], [sx + 8, gy + 3, 1.8, 1.2, 60]])}"/>`;
        s += T('stoma', g, ` data-i="${si}"`);
      });
      return { svg: s, y, rnd };
    }

    /* glands standing on a surface at height `base` (up: 1 grows up, -1 hangs down) */
    function peltate(x, base, o = {}) {
      const up = o.up == null ? 1 : o.up, R = o.r || 25, fill = o.fill == null ? 1 : o.fill, rnd = o.rnd || Math.random;
      const Y = v => base - up * v;
      let g = '';
      // basal cell sits in the epidermis, stalk cell above it, four secretory cells in a flat disc
      g += `<path class="mic-gl-base" d="${cell(x, Y(-6), 8, 5.4, rnd, { p: 3.4, j: 0.03 })}"/>`;
      g += `<path class="mic-gl-stalk" d="${cell(x, Y(4.2), 7.5, 4, rnd, { p: 4, j: 0.03 })}"/>`;
      const hy = Y(12.5), cw = (R * 2) / 4;
      for (let i = 0; i < 4; i++) g += `<path class="mic-sec" d="${cell(x - R + cw * (i + 0.5), hy, cw / 2 - 0.6, 4.6, rnd, { p: 3.6, j: 0.05 })}"/>`;
      g += `<path class="mic-nuc" d="${dots([0, 1, 2, 3].map(i => [x - R + cw * (i + 0.5), hy + up * 1, 1.9, 1.6, 0]))}"/>`;
      // oil under the lifted cuticle
      const D = 8 + 34 * fill, x0 = x - R - 4, x1 = x + R + 4, y0 = Y(16.5);
      const dome = `M${q(x0)} ${q(y0)}C${q(x0 - 1)} ${q(y0 - up * D * 1.3)} ${q(x1 + 1)} ${q(y0 - up * D * 1.3)} ${q(x1)} ${q(y0)}Z`;
      g += `<g class="mic-dome"><path class="mic-oil" d="${dome}"/><path class="mic-dome-cut" d="${dome}"/>`;
      g += `<ellipse class="mic-shine" cx="${q(x - R * 0.35)}" cy="${q(y0 - up * D * 0.72)}" rx="${q(R * 0.32)}" ry="${q(D * 0.16)}" transform="rotate(${up > 0 ? -18 : 18} ${q(x - R * 0.35)} ${q(y0 - up * D * 0.72)})"/></g>`;
      // after a rub: torn cuticle flaps and a film of oil
      g += `<g class="mic-torn"><path class="mic-oil is-film" d="M${q(x0 + 2)} ${q(y0)}Q ${q(x)} ${q(y0 - up * 5)} ${q(x1 - 2)} ${q(y0)}Z"/>`;
      g += `<path class="mic-dome-cut" d="M${q(x0)} ${q(y0)}q ${q(-2)} ${q(-up * 10)} ${q(9)} ${q(-up * 13)} M${q(x1)} ${q(y0)}q ${q(2)} ${q(-up * 9)} ${q(-8)} ${q(-up * 14)}"/></g>`;
      for (let i = 0; i < 7; i++) {
        const a = (-70 + i * 23) * Math.PI / 180, dist = 26 + rnd() * 30;
        g += `<circle class="mic-drop" cx="${q(x)}" cy="${q(y0 - up * D * 0.5)}" r="${q(1.6 + rnd() * 2.2)}" style="--dx:${q(Math.sin(a) * dist)}px;--dy:${q(-up * Math.cos(a) * dist)}px;--dl:${q(i * 0.03)}s"/>`;
      }
      return { g, top: y0 - up * D, w: R * 2 + 8 };
    }
    function capitate(x, base, o = {}) {
      const up = o.up == null ? 1 : o.up, rnd = o.rnd || Math.random;
      const Y = v => base - up * v;
      let g = `<path class="mic-gl-base" d="${cell(x, Y(-6), 6.5, 5, rnd, { p: 3.4, j: 0.03 })}"/>`;
      g += `<path class="mic-gl-stalk" d="${cell(x, Y(7), 4.2, 7.4, rnd, { p: 3.6, j: 0.03 })}"/>`;
      g += `<path class="mic-sec" d="${cell(x, Y(21.5), 8.4, 7.4, rnd, { p: 2.2, j: 0.03 })}"/>`;
      g += `<path class="mic-nuc" d="${dots([[x, Y(21.5), 2.2, 2, 0]])}"/>`;
      g += `<path class="mic-oil is-cap" d="M${q(x - 7)} ${q(Y(25))}Q ${q(x)} ${q(Y(33))} ${q(x + 7)} ${q(Y(25))}Q ${q(x)} ${q(Y(29.5))} ${q(x - 7)} ${q(Y(25))}Z"/>`;
      return { g, top: Y(33), w: 18 };
    }
    // a non-glandular hair: 3 cells in a row, tapering, with warty walls
    function hair(x, base, o = {}) {
      const up = o.up == null ? 1 : o.up, len = o.len || 62, bend = o.bend || 16, rnd = o.rnd || Math.random;
      const pt = t => [x + bend * t * t, base - up * len * t];
      const L = [], Rr = [], N = 16;
      for (let i = 0; i <= N; i++) {
        const t = i / N, [px, py] = pt(t);
        const [nx, ny] = pt(Math.min(1, t + 0.01)), dx = nx - px, dy = ny - py, l = Math.hypot(dx, dy) || 1;
        const hw = 5.2 * (1 - t) + 0.5;
        L.push([px - dy / l * hw, py + dx / l * hw]);
        Rr.unshift([px + dy / l * hw, py - dx / l * hw]);
      }
      const P = L.concat(Rr);
      let d = `M${q(P[0][0])} ${q(P[0][1])}` + P.slice(1).map(p => `L${q(p[0])} ${q(p[1])}`).join('') + 'Z';
      let g = `<path class="mic-gl-base" d="${cell(x, base + up * 6, 7, 5, rnd, { p: 3.4, j: 0.03 })}"/><path class="mic-hair" d="${d}"/>`;
      [0.3, 0.62].forEach(t => {
        const i = Math.round(t * N), a = L[i], b = Rr[N - i];
        g += `<path class="mic-hair-wall" d="M${q(a[0])} ${q(a[1])}L${q(b[0])} ${q(b[1])}"/>`;
      });
      const warts = [];
      for (let i = 2; i < N; i += 2) { const a = L[i]; warts.push([a[0], a[1], 0.9, 0.9, 0]); const b = Rr[N - i]; warts.push([b[0], b[1], 0.9, 0.9, 0]); }
      g += `<path class="mic-wart" d="${dots(warts)}"/>`;
      return { g, top: base - up * len, tx: x + bend, w: 12 };
    }

    /* captions on soft pills that never overlap: items [{x, y, text, to: [x, y]}] placed in rows */
    function labels(items, w, rows, o = {}) {
      const cw = o.cw || 6.9, pad = 7, used = rows.map(() => []);
      let s = '';
      items.forEach(it => {
        const tw = it.text.length * cw + pad * 2;
        let cx = Math.min(w - tw / 2 - 3, Math.max(tw / 2 + 3, it.x));
        let ri = rows.findIndex((ry, i) => !used[i].some(([a, b]) => cx + tw / 2 > a - 6 && cx - tw / 2 < b + 6));
        if (ri < 0) ri = rows.length - 1;
        used[ri].push([cx - tw / 2, cx + tw / 2]);
        const ry = rows[ri];
        if (it.to) {
          // beside the thing: the line leaves from the pill's side, otherwise from its top or bottom
          const side = Math.abs(it.to[1] - ry) < 14;
          const sx = side ? (it.to[0] < cx ? cx - tw / 2 : cx + tw / 2) : cx, sy = side ? ry : ry + (it.to[1] > ry ? 9 : -9);
          s += `<path class="mic-lead" d="M${q(sx)} ${q(sy)}L${q(it.to[0])} ${q(it.to[1])}"/>`;
        }
        s += `<g class="mic-label"${it.t ? ` data-for="${it.t}"` : ''}><rect class="mic-lbl-bg" x="${q(cx - tw / 2)}" y="${q(ry - 9)}" width="${q(tw)}" height="18" rx="9"/><text class="mic-lbl" x="${q(cx)}" y="${q(ry + 4)}" text-anchor="middle">${it.text}</text></g>`;
      });
      return s;
    }
    const pill = (x, yy, text, o = {}) => {
      const tw = text.length * (o.cw || 6.9) + 14;
      return `<g class="mic-label${o.cls ? ' ' + o.cls : ''}"${o.t ? ` data-for="${o.t}"` : ''}><rect class="mic-lbl-bg" x="${q(x)}" y="${q(yy - 9)}" width="${q(tw)}" height="18" rx="9"/><text class="mic-lbl" x="${q(x + 7)}" y="${q(yy + 4)}">${text}</text></g>`;
    };
    const scale = (x, yy, px, text) => `<g class="mic-scale"><line x1="${q(x - px)}" x2="${q(x)}" y1="${q(yy)}" y2="${q(yy)}"/><line x1="${q(x - px)}" x2="${q(x - px)}" y1="${q(yy - 4)}" y2="${q(yy + 4)}"/><line x1="${q(x)}" x2="${q(x)}" y1="${q(yy - 4)}" y2="${q(yy + 4)}"/><text x="${q(x - px / 2)}" y="${q(yy - 7)}" text-anchor="middle">${text}</text></g>`;

    return { rng, smooth, cell, dots, lining, section, peltate, capitate, hair, labels, pill, scale };
  })();

  /* ---------------- ills: plants, symptoms and pests for the illustrated guides ----------------
     A leaf is drawn in its own box: base at (0, 0), tip at (0, −104), about 64 wide; symptoms are
     layers clipped to its outline. Everything returns SVG markup; colours are the --ill-* tokens. */
  /* @use micro */
  const ill = (() => {
    const q = v => Math.round(v * 10) / 10;
    const F = n => `var(--ill-${n})`;
    let uid = 0;
    const id = p => `ill-${p}${++uid}`;
    const HW = s => (s <= 0 || s >= 1 ? 0 : 78.7 * Math.pow(s, 0.55) * Math.pow(1 - s, 0.9));
    const Ys = s => -4 - s * 100;
    const inside = (rnd, a = 0.12, b = 0.9, k = 0.78) => { const s = a + rnd() * (b - a); return [(rnd() * 2 - 1) * HW(s) * k, Ys(s), s]; };
    const mix = (a, b, t) => `color-mix(in srgb, ${F(a)} ${Math.round(t * 100)}%, ${F(b)})`;

    // ruffle: a frilly wavy margin; teeth: a toothed one. Both calm down at the base and the tip
    function outline(o) {
      const rf = o.ruffle || 0, th = o.teeth || 0;
      const n = rf || th ? 72 : 30, R = [], L = [], w = o.wide || 1, curl = o.curl || 0;
      const edge = (s, i, ph) => {
        const hw = HW(s) * w;
        if (!hw || (!rf && !th)) return hw;
        const env = Math.sin(Math.PI * Math.min(1, s * 1.12));
        return Math.max(0.5, hw + (rf * 5.6 * Math.sin(i / n * Math.PI * 14 + ph) * (0.7 + 0.3 * Math.sin(i * 0.9 + ph)) + th * 1.6 * ((i + (ph ? 1 : 0)) % 2 ? 1 : -1)) * env);
      };
      for (let i = 0; i <= n; i++) {
        const s = 0.015 + 0.985 * i / n;
        R.push([edge(s, i, 0) * (1 - curl * 0.55), Ys(s)]);
        L.push([-edge(s, i, 1.7), Ys(s)]);
      }
      return micro.smooth(R.concat(L.reverse()));
    }
    // leaf colours of the varieties: [blade, veins, margin, petiole]
    const TONE = {
      green: ['leaf', 'vein', 'leaf-d', 'stem'],
      deep: ['leaf-deep', 'vein-deep', 'leaf-deep-d', 'stem'],
      purple: ['leaf-purple', 'vein-purple', 'leaf-purple-d', 'stem-purple'],
      lime: ['leaf-lime', 'vein-lime', 'leaf-lime-d', 'stem'],
      thai: ['leaf', 'vein', 'leaf-d', 'stem-purple']
    };
    // secondary veins: [s, side] → path; ends are where the vein meets the margin
    const SEC = [0.13, 0.26, 0.39, 0.52, 0.65, 0.78];
    const veinEnd = (s, side, w = 1) => [side * HW(Math.min(0.97, s + 0.13)) * 0.86 * w, Ys(s + 0.13)];
    function veins(o) {
      const w = o.wide || 1;
      let d = 'M0 -3Q1.6 -52 0 -101';
      SEC.forEach(s => [-1, 1].forEach(side => {
        const [ex, ey] = veinEnd(s, side, side > 0 ? w * (1 - (o.curl || 0) * 0.55) : w);
        d += `M0 ${q(Ys(s))}Q${q(side * HW(s) * 0.5 * w)} ${q(Ys(s + 0.035))} ${q(ex)} ${q(ey)}`;
      }));
      return d;
    }
    // region between two secondary veins on one side (downy mildew patches keep to them)
    function bay(k, side, o) {
      const s0 = SEC[k], s1 = SEC[k + 1] || 0.92, w = o.wide || 1;
      const [ax, ay] = veinEnd(s0, side, w), [bx, by] = veinEnd(s1, side, w);
      return `M${side * 2} ${q(Ys(s0) - 2)}Q${q(side * HW(s0) * 0.5 * w)} ${q(Ys(s0 + 0.035) - 2)} ${q(ax)} ${q(ay - 1)}L${q(bx)} ${q(by + 2)}Q${q(side * HW(s1) * 0.5 * w)} ${q(Ys(s1 + 0.035) + 2)} ${side * 2} ${q(Ys(s1) + 2)}Z`;
    }

    /* one leaf. o: x, y, a (degrees), s (scale), seed, under (lower side), chl: uniform | interveinal | mottle,
       k (how far it went, 0–1), necro: edge | spots | bact | angular, fuzz, holes, stipple, silver, purple,
       mold, curl, wide, aphids, mites, web, whitefly, thrips, pale, tip (brown dead tip, 0–1);
       the look of a variety: tone (green | deep | purple | lime | thai), ruffle, teeth, bubbly (blistered
       blade), gloss, hairs; dim (0–1) — darker, for leaves at the back of a bush */
    function leaf(o = {}) {
      const rnd = micro.rng(o.seed || 3), k = o.k == null ? 1 : o.k;
      const out = outline(o), cid = id('c'), gid = id('g');
      const tone = TONE[o.tone] || TONE.green;
      const green = o.under ? 'under' : tone[0];
      let fill = F(green);
      if (o.chl === 'uniform') fill = mix('yellow', green, 0.25 + 0.7 * k);
      if (o.chl === 'interveinal') fill = mix('yellow-pale', green, 0.55 + 0.4 * k);
      if (o.pale) fill = mix('lime', green, 0.6);
      if (o.color) fill = o.color;
      let defs = `<clipPath id="${cid}"><path d="${out}"/></clipPath><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="-34" y1="0" x2="34" y2="0"><stop offset="0" stop-color="${F('spot')}" stop-opacity=".2"/><stop offset=".46" stop-color="${F('hi')}" stop-opacity=".14"/><stop offset=".54" stop-color="${F('hi')}" stop-opacity=".1"/><stop offset="1" stop-color="${F('spot')}" stop-opacity=".22"/></linearGradient>`;
      let body = `<path d="${out}" style="fill:${fill}"/>`;
      let top = '';
      if (o.chl === 'mottle') for (let i = 0; i < 9; i++) { const [x, y] = inside(rnd); body += `<path d="${micro.cell(x, y, 5 + rnd() * 6, 4 + rnd() * 5, rnd, { p: 2.2, j: 0.25, n: 8 })}" fill="${F('yellow-pale')}" opacity=".7"/>`; }
      if (o.purple) body += `<path d="${out}" fill="${F('purple')}" opacity="${q(0.3 + 0.4 * o.purple)}"/><path d="M-40 0H40V-40H-40Z" fill="${F('purple')}" opacity="${q(0.2 * o.purple)}"/>`;
      if (o.tip) {
        // the tip dies first: brown, with a yellow rim towards the living part
        const s0 = 1 - 0.3 * o.tip, y0 = Ys(s0), y1 = Ys(s0 + 0.07);
        body += `<path d="M-40 ${q(y0 + 7)}Q0 ${q(y0 - 5)} 40 ${q(y0 + 7)}V-120H-40Z" fill="${F('yellow')}" opacity=".85"/><path d="M-40 ${q(y1 + 4)}Q-10 ${q(y1 - 6)} 8 ${q(y1 - 1)}T40 ${q(y1 + 2)}V-120H-40Z" fill="${F('brown')}"/>`;
      }
      if (o.ruffle || o.bubbly) {
        // a blistered blade: little domes between the veins catch the light
        let hl = '', sh = '';
        const nb = 6 + Math.round(12 * Math.max(o.ruffle || 0, o.bubbly || 0));
        for (let i = 0; i < nb; i++) {
          const [x, y] = inside(rnd, 0.14, 0.86, 0.72), r = 3.5 + rnd() * 4;
          hl += `M${q(x - r)} ${q(y)}Q${q(x)} ${q(y - r)} ${q(x + r)} ${q(y)}`;
          sh += `M${q(x - r)} ${q(y + 1.3)}Q${q(x)} ${q(y + r * 0.6)} ${q(x + r)} ${q(y + 1.3)}`;
        }
        body += `<path d="${sh}" fill="none" stroke="${F('spot')}" stroke-width="1.7" opacity=".16" stroke-linecap="round"/><path d="${hl}" fill="none" stroke="${F('hi')}" stroke-width="1.5" opacity=".3" stroke-linecap="round"/>`;
      }
      if (o.necro === 'angular' || o.fuzz) {
        // patches bounded by veins: yellow on top, grey-violet down underneath
        const bays = o.bays || [[1, 1], [2, -1], [3, 1], [2, 1], [4, -1]];
        bays.slice(0, Math.max(1, Math.round(bays.length * k))).forEach(([b, side], i) => {
          body += `<path d="${bay(b, side, o)}" fill="${F(o.under ? 'fuzz' : 'yellow')}" opacity="${o.under ? 0.55 : 0.9}"/>`;
          if (!o.under && k > 0.6 && i % 2) body += `<path d="${bay(b, side, o)}" fill="${F('brown')}" opacity=".45" transform="translate(${side * 3} 1) scale(.82)"/>`;
          if (o.fuzz) {
            let fz = '';
            for (let t = 0; t < 70; t++) {
              const s = SEC[b] + rnd() * ((SEC[b + 1] || 0.92) - SEC[b]), x = side * (3 + rnd() * HW(s) * 0.8), y = Ys(s) - rnd() * 8;
              const a2 = rnd() * Math.PI * 2;
              fz += `M${q(x)} ${q(y)}l${q(Math.cos(a2) * 2.4)} ${q(Math.sin(a2) * 2.4)}`;
            }
            top += `<path d="${fz}" stroke="${F('fuzz')}" stroke-width=".9" stroke-linecap="round" opacity=".9" clip-path="url(#${cid})"/>`;
          }
        });
      }
      if (o.necro === 'edge') {
        body += `<path d="${out}" fill="none" stroke="${F('yellow')}" stroke-width="${q(14 + 8 * k)}" opacity=".85"/><path d="${out}" fill="none" stroke="${F('brown')}" stroke-width="${q(6 + 8 * k)}" stroke-dasharray="7 2 4 3" /><path d="${out}" fill="none" stroke="${F('brown-d')}" stroke-width="3"/>`;
      }
      if (o.necro === 'spots' || o.necro === 'bact') {
        const n = Math.round((o.necro === 'bact' ? 10 : 6) * (0.5 + k));
        for (let i = 0; i < n; i++) {
          const [x, y] = inside(rnd, 0.15, 0.85, 0.72), r = (o.necro === 'bact' ? 3 : 4.5) + rnd() * 4.5;
          if (o.necro === 'bact') {
            body += `<path d="${micro.cell(x, y, r + 3, r + 2.5, rnd, { p: 4.5, j: 0.18, n: 7 })}" fill="${F('yellow')}" opacity=".7"/><path d="${micro.cell(x, y, r, r * 0.85, rnd, { p: 4.5, j: 0.22, n: 7 })}" fill="${F('water')}" opacity=".9"/>`;
          } else {
            body += `<path d="${micro.cell(x, y, r * 1.35, r * 1.2, rnd, { p: 2.2, j: 0.3, n: 9 })}" fill="${F('brown')}" opacity=".55"/><path d="${micro.cell(x, y, r, r * 0.9, rnd, { p: 2.2, j: 0.3, n: 9 })}" fill="${F('spot')}"/>`;
          }
        }
      }
      if (o.mold) {
        const [mx, my] = o.moldAt || [8, -30];
        body += `<path d="${micro.cell(mx, my, 22, 16, rnd, { p: 2.2, j: 0.25, n: 10 })}" fill="${F('brown')}" opacity=".7"/>`;
        let fz = '';
        for (let t = 0; t < 140; t++) { const a2 = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 18; const x = mx + Math.cos(a2) * r, y = my + Math.sin(a2) * r * 0.75; fz += `M${q(x)} ${q(y)}l${q((rnd() - 0.5) * 5)} ${q(-2 - rnd() * 4)}`; }
        top += `<path d="${fz}" stroke="${F('mold')}" stroke-width="1" stroke-linecap="round"/>`;
        for (let t = 0; t < 26; t++) { const a2 = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 17; top += `<circle cx="${q(mx + Math.cos(a2) * r)}" cy="${q(my + Math.sin(a2) * r * 0.75 - 4)}" r="${q(1 + rnd() * 1.3)}" fill="${F('mold-d')}" opacity=".8"/>`; }
      }
      if (o.stipple) {
        let d = '';
        for (let i = 0; i < o.stipple; i++) { const [x, y] = inside(rnd, 0.1, 0.92, 0.85); d += `M${q(x)} ${q(y)}h.01`; }
        body += `<path d="${d}" stroke="${F('yellow-pale')}" stroke-width="1.9" stroke-linecap="round" opacity=".95"/>`;
      }
      if (o.silver) {
        let d = '', dots = '';
        for (let i = 0; i < o.silver; i++) { const [x, y] = inside(rnd, 0.15, 0.85, 0.7); const a2 = (rnd() - 0.5) * 1.2; d += `M${q(x)} ${q(y)}l${q(Math.sin(a2) * 7)} ${q(-Math.cos(a2) * 9)}`; }
        for (let i = 0; i < o.silver * 3; i++) { const [x, y] = inside(rnd, 0.15, 0.85, 0.7); dots += `M${q(x)} ${q(y)}h.01`; }
        body += `<path d="${d}" stroke="${F('silver')}" stroke-width="4.2" stroke-linecap="round" opacity=".85"/><path d="${dots}" stroke="${F('spot')}" stroke-width="1.5" stroke-linecap="round"/>`;
      }
      // veins: green bands keep their colour in interveinal chlorosis
      const vd = veins(o);
      if (o.chl === 'interveinal') body += `<path d="${vd}" fill="none" stroke="${F(green)}" stroke-width="${q(7 - 3 * k)}" stroke-linecap="round" opacity=".95"/>`;
      body += `<path d="${out}" fill="url(#${gid})"/>`;
      if (o.gloss) body += `<path d="M-6 -16C-22 -30 -24 -62 -8 -86C-14 -60 -12 -36 -6 -16Z" fill="${F('hi')}" opacity="${q(0.28 * o.gloss)}"/>`;
      if (o.dim) body += `<path d="${out}" fill="${F('spot')}" opacity="${q(0.42 * o.dim)}"/>`;
      const vc = o.under ? 'under-vein' : o.purple ? 'purple' : tone[1];
      body += `<path d="${vd}" fill="none" stroke="${F(vc)}" stroke-width="${o.under ? 1.8 : 1.3}" stroke-linecap="round" opacity="${o.under ? 0.95 : 0.7}"/>`;
      // holes are cut out; their rims turn brown
      let mask = '', rims = '';
      if (o.holes) {
        const mid = id('m');
        let hs = '';
        for (let i = 0; i < o.holes; i++) {
          const [x, y] = inside(rnd, 0.2, 0.85, 0.75), r = 4 + rnd() * 7;
          const d = micro.cell(x, y, r, r * (0.7 + rnd() * 0.4), rnd, { p: 2.1, j: 0.35, n: 9, phase: rnd() * 3 });
          hs += `<path d="${d}" fill="#000"/>`;
          rims += `<path d="${d}" fill="none" stroke="${F('brown')}" stroke-width="1.6" opacity=".8"/>`;
        }
        // a bite out of the margin
        hs += `<circle cx="${q(HW(0.55) * 1.02)}" cy="${q(Ys(0.55))}" r="9" fill="#000"/>`;
        rims += `<path d="M${q(HW(0.55) * 1.02 - 8)} ${q(Ys(0.55) - 4)}A9 9 0 0 0 ${q(HW(0.55) * 1.02 - 4)} ${q(Ys(0.55) + 8)}" fill="none" stroke="${F('brown')}" stroke-width="1.6" opacity=".8"/>`;
        defs += `<mask id="${mid}" maskUnits="userSpaceOnUse" x="-60" y="-120" width="120" height="140"><rect x="-60" y="-120" width="120" height="140" fill="#fff"/>${hs}</mask>`;
        mask = ` mask="url(#${mid})"`;
      }
      let edge = `<path d="${out}" fill="none" stroke="${F(o.under ? 'leaf' : tone[2])}" stroke-width="1.1" opacity=".8"/>`;
      if (o.hairs) {
        // a downy leaf (tulsi): short pale hairs stand out of the margin
        let d = '';
        for (let i = 2; i < 30; i++) { const s2 = i / 31, x = HW(s2) * (o.wide || 1), y = Ys(s2); [-1, 1].forEach(sd => { d += `M${q(sd * x)} ${q(y)}l${q(sd * 2.6)} ${q(-1.4 - rnd())}`; }); }
        edge += `<path d="${d}" stroke="${F('white')}" stroke-width=".8" stroke-linecap="round" opacity=".75"/>`;
      }
      if (o.curl) {
        // the rolled edge: a band of the paler underside with a fold line inside it
        const Rp = [], In = [];
        for (let i = 0; i <= 20; i++) {
          const s2 = 0.06 + 0.9 * i / 20, x = HW(s2) * (o.wide || 1) * (1 - o.curl * 0.55), y = Ys(s2);
          Rp.push([x, y]); In.push([x - o.curl * 9 * Math.sin(Math.PI * s2), y]);
        }
        const band = `M${Rp.map(p => p.map(q).join(' ')).join('L')}L${In.reverse().map(p => p.map(q).join(' ')).join('L')}Z`;
        edge += `<path d="${band}" fill="${F('under')}"/><path d="M${In.map(p => p.map(q).join(' ')).join('L')}" fill="none" stroke="${F('leaf-d')}" stroke-width="1.2" opacity=".7"/>`;
      }
      let bugs = '';
      if (o.aphids) for (let i = 0; i < o.aphids; i++) { const s = 0.08 + rnd() * 0.5, x = (rnd() - 0.5) * HW(s) * 0.5; bugs += aphid(x, Ys(s), rnd() * 360, 0.9 + rnd() * 0.5, rnd() < 0.15); }
      if (o.web) bugs += web(rnd);
      if (o.mites) for (let i = 0; i < o.mites; i++) { const [x, y] = inside(rnd, 0.2, 0.8, 0.7); bugs += mite(x, y, rnd() * 360, 0.35); }
      if (o.whitefly) for (let i = 0; i < o.whitefly; i++) { const [x, y] = inside(rnd, 0.15, 0.8, 0.7); bugs += whitefly(x, y, rnd() * 60 - 30, 0.45); }
      if (o.thrips) for (let i = 0; i < o.thrips; i++) { const [x, y] = inside(rnd, 0.2, 0.8, 0.6); bugs += thrips(x, y, rnd() * 360, 0.5); }
      const pet = `<path d="M0 -3V${o.petiole == null ? 16 : o.petiole}" stroke="${F(o.purple ? 'purple' : tone[3])}" stroke-width="2.6" stroke-linecap="round"/>`;
      return `<g transform="translate(${q(o.x || 0)} ${q(o.y || 0)}) rotate(${q(o.a || 0)}) scale(${o.s || 1})">${defs}${pet}<g${mask}><g clip-path="url(#${cid})">${body}</g>${top}${edge}${rims}</g>${bugs}</g>`;
    }

    /* insects, in their own box: 1 unit ≈ 0.05 mm at s = 1 */
    function aphid(x, y, a, s = 1, winged = false) {
      const c = F('aphid'), d = F('aphid-d');
      let g = `<path d="M-2.2 3L-5 7M2.2 3L5 7M-2.6 0.5L-6 1.5M2.6 0.5L6 1.5M-2 -2L-5 -4.5M2 -2L5 -4.5" stroke="${d}" stroke-width=".7" stroke-linecap="round"/>`;
      g += `<path d="M0 -5.5C3.4 -5.5 4.2 -1 3.8 2.5C3.4 6 1.8 8 0 8C-1.8 8 -3.4 6 -3.8 2.5C-4.2 -1 -3.4 -5.5 0 -5.5Z" fill="${c}"/>`;
      g += `<path d="M-1.6 6L-2.6 9.2M1.6 6L2.6 9.2" stroke="${d}" stroke-width="1" stroke-linecap="round"/>`;
      g += `<ellipse cx="0" cy="-6" rx="2" ry="1.6" fill="${d}"/><path d="M-1 -7Q-4 -11 -6 -13M1 -7Q4 -11 6 -13" stroke="${d}" stroke-width=".55" fill="none"/>`;
      g += `<ellipse cx="-1.2" cy="-1" rx="1" ry="2.2" fill="${F('hi')}" opacity=".3"/>`;
      if (winged) g += `<path d="M1 -3C6 -8 11 -6 12 -2C9 0 5 0 1 -1ZM-1 -3C-6 -8 -11 -6 -12 -2C-9 0 -5 0 -1 -1Z" fill="${F('wing')}" stroke="${d}" stroke-width=".3"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    function mite(x, y, a, s = 1) {
      const d = F('mite-d');
      let g = '';
      [-1, 1].forEach(side => [[-2.6, -1.4], [-1, 0], [0.8, 0.8], [2.4, 1.8]].forEach(([oy, k], i) => { g += `<path d="M${side * 2} ${oy}Q${side * (5 + i)} ${oy - 1.5 + k} ${side * (6.5 + i * 0.4)} ${oy + 2.5 + k * 0.6}" stroke="${d}" stroke-width=".55" fill="none"/>`; }));
      g += `<ellipse cx="0" cy="0" rx="3.2" ry="4.2" fill="${F('mite')}"/><ellipse cx="-1.6" cy="0.4" rx="1" ry="1.5" fill="${d}" opacity=".8"/><ellipse cx="1.6" cy="0.4" rx="1" ry="1.5" fill="${d}" opacity=".8"/>`;
      g += `<circle cx="-1" cy="-3.1" r=".45" fill="${F('eye')}"/><circle cx="1" cy="-3.1" r=".45" fill="${F('eye')}"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    function whitefly(x, y, a, s = 1) {
      // at rest the powdery wings lie like a roof over the body, slightly apart at the back
      let g = `<path d="M0 -3.4C3.4 -3.6 6 0 5.6 6.4C5.2 9.4 2.4 9.6 0.3 8.2ZM0 -3.4C-3.4 -3.6 -6 0 -5.6 6.4C-5.2 9.4 -2.4 9.6 -0.3 8.2Z" fill="${F('white')}" stroke="${F('mold')}" stroke-width=".35"/>`;
      g += `<path d="M0 -3V7" stroke="${F('mold')}" stroke-width=".35"/><ellipse cx="0" cy="-4.2" rx="1.9" ry="1.5" fill="${F('yellow-pale')}"/><circle cx="-1.1" cy="-4.6" r=".75" fill="${F('eye')}"/><circle cx="1.1" cy="-4.6" r=".75" fill="${F('eye')}"/><path d="M-.8 -5.4l-1.6 -2.4M.8 -5.4l1.6 -2.4" stroke="${F('mold')}" stroke-width=".35"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    function thrips(x, y, a, s = 1) {
      const c = F('thrips');
      let g = `<path d="M0 -7C1.4 -7 1.6 -4 1.4 0C1.3 4 1 8 0 10C-1 8 -1.3 4 -1.4 0C-1.6 -4 -1.4 -7 0 -7Z" fill="${c}"/>`;
      g += `<path d="M0.6 -2L4 7M-0.6 -2L-4 7" stroke="${F('mold')}" stroke-width="1.3" opacity=".6"/><path d="M-.6 -7L-2 -10M.6 -7L2 -10" stroke="${c}" stroke-width=".5"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    function web(rnd) {
      let d = '';
      const anchors = Array.from({ length: 7 }, () => inside(rnd, 0.3, 0.95, 0.95));
      anchors.forEach(([x, y], i) => { const [x2, y2] = anchors[(i + 2) % anchors.length]; d += `M${q(x)} ${q(y)}Q${q((x + x2) / 2 + (rnd() - 0.5) * 10)} ${q((y + y2) / 2 + 6)} ${q(x2)} ${q(y2)}`; });
      return `<path d="${d}" fill="none" stroke="${F('white')}" stroke-width=".55" opacity=".9"/>`;
    }

    // flower colours: white (sweet basil), purple (Thai, tulsi), pink (purple sorts, African blue)
    const FLOWER = { white: ['flower', 'flower-d'], purple: ['flower-purple', 'flower-purple-d'], pink: ['flower-pink', 'flower-pink-d'] };
    // a flower spike going up from (x, y): whorls of small two-lipped flowers, smaller towards the top
    function spike(x, y, len = 62, o = {}) {
      const [fc, fd] = FLOWER[o.flowers] || FLOWER.white, n = Math.max(3, Math.round(len / 10.5));
      let g = `<path d="M${q(x)} ${q(y)}q2 ${q(-len / 2)} 1 ${q(-len)}" stroke="${F(o.stemColor || 'stem')}" stroke-width="${o.thin ? 1.8 : 2.6}" fill="none"/>`;
      for (let i = 0; i < n; i++) {
        const fy = y - 10 - i * (len - 10) / n, fx = x + 1 + i * 0.2, r = (1 - i * 0.6 / n) * (o.thin ? 0.75 : 1);
        [-1, 1].forEach(sd => { g += `<path d="M${q(fx)} ${q(fy)}q${q(sd * 6 * r)} -1 ${q(sd * 8 * r)} -6q${q(-sd * 3)} 4 ${q(-sd * 8 * r)} 6Z" fill="${F(fc)}" stroke="${F(fd)}" stroke-width=".6"/>`; });
        g += `<ellipse cx="${q(fx)}" cy="${q(fy + 2)}" rx="${q(5 * r)}" ry="2" fill="${F(o.bracts || 'stem')}" opacity=".75"/>`;
      }
      return g;
    }
    /* a basil plant standing on (x, y). o: h, nodes, droop, lean, leggy, bolt, leaf(i, n, side) → leaf options,
       tone (leaf colour of the variety), flowers (colour of the spike), stemColor */
    function plant(o = {}) {
      const H = o.h || 150, n = o.nodes || 4, rnd = micro.rng(o.seed || 5);
      const lean = o.lean || 0;
      const w = [];
      for (let i = 0; i < n; i++) w.push(o.leggy ? 1 : 1.25 - i * 0.12);
      const tot = w.reduce((a, b) => a + b, 0);
      let yy = 0;
      const pts = [];
      const dr = o.droop || 0;
      for (let i = 0; i < n; i++) { yy += H * w[i] / tot; const t = yy / H; pts.push([lean * t * t * 30 + dr * t * t * t * 22, -yy + dr * t * t * t * 16]); }
      const stem = `M0 0Q${q(lean * 6 + dr * 4)} ${q(-H * 0.5)} ${q(pts[n - 1][0])} ${q(pts[n - 1][1])}`;
      let g = '';
      if (o.bolt) g += spike(pts[n - 1][0], -H, 62, { flowers: o.flowers, stemColor: o.stemColor, bracts: o.stemColor });
      g += `<path d="${stem}" stroke="${F(o.stemColor || 'stem')}" stroke-width="${o.leggy ? 2.6 : 3.6}" fill="none" stroke-linecap="round"/>`;
      pts.forEach(([px, py], i) => {
        const size = (o.leggy ? 0.36 : 0.62 - i * 0.09) * (o.leafScale || 1);
        [-1, 1].forEach(side => {
          const extra = o.leaf ? o.leaf(i, n, side) || {} : {};
          const droop = dr * (1 - i * 0.08);
          const a = side * (58 - i * 6 + droop * 100 + (rnd() - 0.5) * 8);
          g += leaf(Object.assign({ x: px, y: py, a, s: size, seed: 11 + i * 3 + (side > 0 ? 1 : 0), petiole: 12, tone: o.tone }, dr > 0.4 ? { wide: 0.82 } : {}, extra));
        });
      });
      // the growing tip
      const [tx, ty] = pts[n - 1];
      if (!o.bolt) [-1, 1].forEach(side => { g += leaf(Object.assign({ x: tx, y: ty, a: side * 24 + dr * 110, s: 0.2, seed: 40 + side, petiole: 4, tone: o.tone }, o.leaf ? o.leaf(n, n, side) || {} : {})); });
      return `<g transform="translate(${q(o.x || 0)} ${q(o.y || 0)})">${g}</g>`;
    }
    /* a pinched bush from the side: a main stem and a side shoot from every node, a pair of leaves on each
       node, flower spikes on the shoot tops if it blooms. o: x, y, h, nodes, leaf (leaf scale), spread,
       look of the variety (tone, wide, ruffle, teeth, bubbly, gloss, hairs), flowers, stemColor, seed */
    function bush(o = {}) {
      const H = o.h || 110, n = o.nodes || 3, rnd = micro.rng(o.seed || 9), L = o.leaf || 0.4, spread = o.spread == null ? 1 : o.spread;
      const look = { tone: o.tone, wide: o.wide, ruffle: o.ruffle, teeth: o.teeth, bubbly: o.bubbly, gloss: o.gloss, hairs: o.hairs };
      const stemC = o.stemColor || (o.tone === 'purple' || o.tone === 'thai' ? 'stem-purple' : 'stem');
      const shoots = [];
      for (let i = 0; i < n - 1; i++) {
        const y = -H * (0.16 + i * 0.22);
        [-1, 1].forEach(sd => shoots.push({ x: 0, y, a: sd * (50 - i * 10 + rnd() * 8) * spread, len: H * (0.66 - i * 0.12), s: L * (0.92 - i * 0.1), pairs: Math.max(2, n - i), dim: i === 0 ? 0.3 : 0.15 }));
      }
      shoots.push({ x: 0, y: 0, a: (rnd() - 0.5) * 6, len: H, s: L, pairs: n + 1, dim: 0 });
      let g = '';
      shoots.forEach((sh, k) => {
        const r = sh.a * Math.PI / 180;
        // the shoot leaves the stem at its angle and turns up towards the light
        const P0 = [sh.x, sh.y], P1 = [sh.x + Math.sin(r) * sh.len * 0.6, sh.y - Math.cos(r) * sh.len * 0.6], P2 = [sh.x + Math.sin(r) * sh.len * 0.72, sh.y - sh.len * 0.9];
        const at = t => [(1 - t) * (1 - t) * P0[0] + 2 * t * (1 - t) * P1[0] + t * t * P2[0], (1 - t) * (1 - t) * P0[1] + 2 * t * (1 - t) * P1[1] + t * t * P2[1]];
        const dir = t => { const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]); return Math.atan2(dx, -dy) * 180 / Math.PI; };
        g += `<path d="M${q(P0[0])} ${q(P0[1])}Q${q(P1[0])} ${q(P1[1])} ${q(P2[0])} ${q(P2[1])}" stroke="${F(stemC)}" stroke-width="${q(sh.dim ? 2.2 : 3.2)}" fill="none" stroke-linecap="round"/>`;
        for (let j = 0; j < sh.pairs; j++) {
          const t = 0.3 + 0.62 * j / Math.max(1, sh.pairs - 1), [px, py] = at(t), d = dir(t), size = sh.s * (1 - 0.42 * t);
          [-1, 1].forEach(side => { g += leaf(Object.assign({ x: px, y: py, a: d + side * (56 + (rnd() - 0.5) * 14), s: size, seed: 7 + k * 11 + j * 3 + side, petiole: 8, dim: sh.dim }, look)); });
        }
        if (o.flowers) g += spike(P2[0], P2[1], sh.dim ? 30 : 40, { flowers: o.flowers, stemColor: stemC, bracts: stemC, thin: true });
        else [-1, 1].forEach(side => { g += leaf(Object.assign({ x: P2[0], y: P2[1], a: dir(1) + side * 26, s: sh.s * 0.34, seed: 50 + k + side, petiole: 3, dim: sh.dim }, look)); });
      });
      return `<g transform="translate(${q(o.x || 0)} ${q(o.y || 0)})">${g}</g>`;
    }
    /* a small-leaved bush that grows into a ball by itself (the Greek bush basils): a dome of little leaves
       on short stems. o: x, y, r (radius), n (leaves), leaf (leaf scale), tone, wide, teeth, seed */
    function ballBush(o = {}) {
      const R = o.r || 40, rnd = micro.rng(o.seed || 7), n = o.n || 70, sL = o.leaf || 0.17, len = 104 * sL;
      const look = { tone: o.tone, wide: o.wide || 0.95, teeth: o.teeth };
      const stemC = o.tone === 'purple' ? 'stem-purple' : 'stem';
      const cy = -R * 0.9;
      let g = `<path d="M0 0V${q(cy * 0.5)}M0 ${q(cy * 0.2)}Q${q(-R * 0.2)} ${q(cy * 0.4)} ${q(-R * 0.36)} ${q(cy * 0.72)}M0 ${q(cy * 0.28)}Q${q(R * 0.2)} ${q(cy * 0.46)} ${q(R * 0.38)} ${q(cy * 0.76)}" stroke="${F(stemC)}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
      const items = [];
      for (let i = 0; items.length < n && i < n * 4; i++) {
        // the middle of every leaf falls anywhere in the ball but its bottom, where the stems come in;
        // leaves at the rim point outwards, the ones in the middle face us and point up
        const phi = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()), rho = (R - len * 0.5) * rr;
        if (rr > 0.45 && Math.sin(phi) < -0.55) continue;
        const out = rr > 0.4 ? 90 - phi * 180 / Math.PI + (rnd() - 0.5) * 40 : (rnd() - 0.5) * 120;
        const a = out * Math.PI / 180, x = Math.cos(phi) * rho - Math.sin(a) * len * 0.5, y = cy - Math.sin(phi) * rho * 0.92 + Math.cos(a) * len * 0.5;
        items.push({ x, y, a: out, depth: Math.min(1, rnd() * 0.7 + 0.45 * (1 - rr)), s: sL * (0.8 + 0.4 * rnd()), seed: 100 + i });
      }
      items.sort((a, b) => a.depth - b.depth).forEach(it => { g += leaf(Object.assign({ x: it.x, y: it.y, a: it.a, s: it.s, seed: it.seed, petiole: 4, dim: q(0.55 * (1 - it.depth)) }, look)); });
      return `<g transform="translate(${q(o.x || 0)} ${q(o.y || 0)})">${g}</g>`;
    }
    function pot(x, y, w = 70, hgt = 52, o = {}) {
      const t = w / 2, b = w * 0.36;
      let g = `<path d="M${q(-t)} 0L${q(-b)} ${hgt}H${q(b)}L${q(t)} 0Z" fill="${F('pot')}"/><path d="M${q(b * 0.3)} ${hgt}L${q(t * 0.72)} 0H${q(t)}L${q(b)} ${hgt}Z" fill="${F('pot-d')}" opacity=".35"/>`;
      g += `<rect x="${q(-t - 4)}" y="-8" width="${q(w + 8)}" height="12" rx="3" fill="${F('pot-hi')}"/><ellipse cx="0" cy="-7" rx="${q(t)}" ry="4" fill="${F(o.wet ? 'soil-d' : 'soil')}"/>`;
      if (o.crust) { let c = ''; for (let i = 0; i < 18; i++) c += `<ellipse cx="${q(-t * 0.85 + i * (t * 1.7 / 17))}" cy="${q(-7 + Math.sin(i * 2.1) * 1.8)}" rx="${q(3 + (i % 3))}" ry="1.4" fill="${F('crust')}"/>`; g += c + `<path d="M${q(-t)} 0L${q(-b)} ${hgt}" stroke="${F('crust')}" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>`; }
      return `<g transform="translate(${q(x)} ${q(y)})">${g}</g>`;
    }
    function seedling(x, y, hgt = 44, o = {}) {
      const rnd = micro.rng(o.seed || 2);
      if (o.fallen) {
        hgt = hgt || 40;
        const g = `<path d="M0 0Q2 -6 10 -8Q22 -10 ${hgt} -4" stroke="${F('stem')}" stroke-width="2.4" fill="none"/><path d="M-1 1Q0 -4 3 -6" stroke="${F('brown-d')}" stroke-width="3.2" fill="none" stroke-linecap="round"/>` +
          leaf({ x: hgt, y: -4, a: 105, s: 0.2, wide: 1.6, seed: 5, petiole: 2, pale: true }) + leaf({ x: hgt, y: -4, a: 60, s: 0.18, wide: 1.6, seed: 6, petiole: 2, pale: true });
        return `<g transform="translate(${q(x)} ${q(y)})">${g}</g>`;
      }
      const lean = (rnd() - 0.5) * 6;
      const g = `<path d="M0 0Q${q(lean)} ${q(-hgt / 2)} ${q(lean * 0.6)} ${q(-hgt)}" stroke="${F('stem')}" stroke-width="2.4" fill="none"/>` +
        leaf({ x: lean * 0.6, y: -hgt, a: -62, s: 0.2, wide: 1.6, seed: 3, petiole: 2 }) + leaf({ x: lean * 0.6, y: -hgt, a: 62, s: 0.2, wide: 1.6, seed: 4, petiole: 2 });
      return `<g transform="translate(${q(x)} ${q(y)})">${g}</g>`;
    }
    const label = (x, y, text, anchor = 'middle') => `<text class="ill-lbl" x="${q(x)}" y="${q(y)}" text-anchor="${anchor}">${text}</text>`;
    const scale = (x, y, px, text) => `<g class="ill-scale"><path d="M${q(x - px)} ${q(y - 3)}V${q(y + 3)}M${q(x - px)} ${q(y)}H${q(x)}M${q(x)} ${q(y - 3)}V${q(y + 3)}" fill="none" stroke="currentColor"/><line x1="${q(x - px)}" x2="${q(x)}" y1="${q(y)}" y2="${q(y)}"/><text x="${q(x - px / 2)}" y="${q(y - 6)}" text-anchor="middle">${text}</text></g>`;
    // wide pictures are shown small (two in a row): their captions are set larger in CSS (.ill-l)
    const svg = (w, hgt, body, label2) => `<svg class="ill ${w >= 200 ? 'ill-l' : 'ill-s'}" viewBox="0 0 ${w} ${hgt}" role="img"${label2 ? ` aria-label="${label2}"` : ' aria-hidden="true"'}>${body}</svg>`;
    return { F, q, rng: micro.rng, HW, Ys, leaf, plant, bush, ballBush, spike, pot, seedling, aphid, mite, whitefly, thrips, web, label, scale, svg, mix };
  })();

  /* @use ills */
  /* Pictures of the Varieties chapter: a portrait of every type (data-ill="vtype:<id>") and a sprig of every
     variety (data-ill="sort:<n>", n — its place in BASIL.VARIETIES), drawn from what the data says about it:
     leaf colour and form, look of the blade (ruffle, teeth, bubbly, gloss, hairs) and flowers. */
  const VS = (window.BASIL && window.BASIL.VARIETIES) || [];
  const VT = (window.BASIL && window.BASIL.VARIETY_TYPES) || [];
  const Fs = ill.F;
  function lookOf(v) {
    const w = (v.look || '').split(' ');
    return {
      tone: ['green', 'deep', 'purple', 'lime', 'thai'].includes(v.leaf) ? v.leaf : 'green',
      wide: { wide: 1.2, normal: 1, narrow: 0.6, small: 0.92 }[v.shape] || 1,
      ruffle: w.includes('ruffle') ? 1 : 0,
      teeth: w.includes('teeth') ? 1 : 0,
      bubbly: w.includes('bubbly') ? (v.shape === 'wide' ? 1 : 0.5) : 0,
      gloss: w.includes('gloss') ? 1 : 0,
      hairs: w.includes('hairs'),
      flowers: v.flowers || null
    };
  }
  const blade = L => ({ tone: L.tone, wide: L.wide, ruffle: L.ruffle, teeth: L.teeth, bubbly: L.bubbly, gloss: L.gloss, hairs: L.hairs });
  const stemOf = L => (L.tone === 'purple' || L.tone === 'thai' ? 'stem-purple' : 'stem');
  const paper = (w, hh) => `<rect width="${w}" height="${hh}" rx="14" fill="${Fs('bg')}"/>`;

  // the cut tip of a shoot: three pairs of leaves, then the growing tip or a flower spike
  function sprig(L, x, y, hgt, s) {
    let g = `<path d="M${x} ${y}Q${x + 2} ${ill.q(y - hgt * 0.5)} ${x} ${ill.q(y - hgt)}" stroke="${Fs(stemOf(L))}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    [[0.2, 1, 64], [0.56, 0.78, 52], [0.86, 0.52, 38]].forEach(([t, k, ang], j) => {
      [-1, 1].forEach(side => { g += ill.leaf(Object.assign({ x, y: y - hgt * t, a: side * ang, s: s * k, seed: 3 + j * 2 + side, petiole: 6 }, blade(L))); });
    });
    if (L.flowers) g += ill.spike(x, y - hgt, hgt * 0.62, { flowers: L.flowers, stemColor: stemOf(L), bracts: stemOf(L), thin: true });
    else [-1, 1].forEach(side => { g += ill.leaf(Object.assign({ x, y: y - hgt, a: side * 24, s: s * 0.26, seed: 30 + side, petiole: 2 }, blade(L))); });
    return g;
  }

  /* ---------- a variety ---------- */
  function sortPic(n) {
    const v = VS[n] || VS[0], L = lookOf(v), w = 100, hh = 110;
    let body;
    if (v.shape === 'small') body = ill.ballBush({ x: 50, y: 106, r: /Пистоу/.test(v.name) ? 40 : 46, n: 80, leaf: 0.16, tone: L.tone, teeth: L.teeth, seed: 7 + n });
    else body = sprig(L, 50, 106, L.flowers ? 52 : 72, v.shape === 'wide' ? 0.42 : v.shape === 'narrow' ? 0.46 : 0.43);
    return ill.svg(w, hh, paper(w, hh) + body, `Как выглядит «${v.name}»`);
  }
  illustrate('sort', n => sortPic(+n || 0), () => VS.map((_, i) => i));

  /* ---------- a type: its typical bush in a pot ---------- */
  const lead = id => VS.find(v => v.type === id) || VS[0];
  const TYPE_PIC = {
    genovese: () => ill.bush(Object.assign({ x: 80, y: 123, h: 96, nodes: 3, leaf: 0.42, spread: 0.9, seed: 4 }, blade(lookOf(lead('genovese'))))),
    small: () => ill.ballBush({ x: 80, y: 123, r: 58, n: 130, leaf: 0.16, tone: 'deep', seed: 5 }),
    clove: () => ill.bush({ x: 80, y: 123, h: 78, nodes: 3, leaf: 0.4, spread: 0.9, teeth: 1, bubbly: 0.6, seed: 6 }),
    purple: () => ill.bush({ x: 80, y: 123, h: 92, nodes: 3, leaf: 0.4, spread: 0.9, tone: 'purple', gloss: 1, flowers: 'pink', seed: 7 }),
    thai: () => ill.bush({ x: 80, y: 123, h: 80, nodes: 3, leaf: 0.44, spread: 0.9, tone: 'thai', wide: 0.62, flowers: 'purple', seed: 8 }),
    citrus: () => ill.bush({ x: 80, y: 123, h: 80, nodes: 3, leaf: 0.42, spread: 0.9, tone: 'lime', wide: 0.6, flowers: 'white', seed: 9 }),
    sweet: () => ill.bush({ x: 80, y: 123, h: 92, nodes: 3, leaf: 0.4, spread: 0.9, tone: 'thai', flowers: 'purple', seed: 10 }),
    species: () => ill.bush({ x: 80, y: 123, h: 92, nodes: 3, leaf: 0.4, spread: 0.9, tone: 'deep', wide: 0.66, hairs: true, flowers: 'purple', seed: 11 })
  };
  function typePic(id) {
    const t = VT.find(x => x.id === id) || VT[0], w = 160, hh = 150;
    return ill.svg(w, hh, paper(w, hh) + ill.pot(80, 129, 54, 16) + (TYPE_PIC[t.id] || TYPE_PIC.genovese)(), `Типичный куст: ${t.name.toLowerCase()}`);
  }
  illustrate('vtype', id => typePic(id), () => VT.map(t => t.id));
})();
