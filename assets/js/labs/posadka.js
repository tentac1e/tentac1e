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
    // ids of clip paths and gradients: every chapter file carries its own copy of the library, and the
    // one-file book loads them all on one page, so each copy marks its ids with a tag of its own
    let uid = 0;
    const tag = Math.random().toString(36).slice(2, 6);
    const id = p => `ill-${tag}${p}${++uid}`;
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
    return { F, q, id, rng: micro.rng, HW, Ys, leaf, plant, bush, ballBush, spike, pot, seedling, aphid, mite, whitefly, thrips, web, label, scale, svg, mix };
  })();

  /* ---------------- props: things for the step-by-step pictures ----------------
     Trays and cups, a seedling at any age, glass and water, tools, a lamp, a window, a balcony box, a bed,
     a greenhouse, a hydroponic tank, jars, bags and bottles. Each stands on (x, y) — the middle of its
     bottom — unless said otherwise, and returns SVG markup. Colours are the --ill-* tokens; arrows and
     dimension lines follow the theme (.ill-arrow, .ill-scale in 00-ill.css). */
  /* @use ills */
  const props = (() => {
    const { F, q } = ill;
    const P = pts => 'M' + pts.map(p => p.map(q).join(' ')).join('L') + 'Z';
    const shine = (x1, y1, x2, y2, w = 2.4, o = 0.5) => `<path d="M${q(x1)} ${q(y1)}L${q(x2)} ${q(y2)}" stroke="${F('hi')}" stroke-width="${w}" opacity="${o}" stroke-linecap="round"/>`;

    /* ---------- growing ---------- */
    // a seedling cassette seen a little from above: { svg, tops } — tops are the middles of the cells
    function tray(x, y, w = 110, o = {}) {
      const n = o.cells || 4, h = o.h || w * 0.24, d = o.depth || h * 0.5, x0 = x - w / 2, x1 = x + w / 2, yt = y - h, cw = w / n;
      let g = `<path d="${P([[x0, yt], [x1, yt], [x1 - 3, y], [x0 + 3, y]])}" fill="${F('plastic')}"/>`;
      for (let i = 1; i < n; i++) g += `<path d="M${q(x0 + i * cw)} ${q(yt + 2)}V${q(y - 2)}" stroke="${F('plastic-hi')}" stroke-width="1.3" opacity=".7"/>`;
      g += `<path d="${P([[x0, yt], [x1, yt], [x1, yt - d], [x0, yt - d]])}" fill="${F('plastic-hi')}"/>`;
      const tops = [];
      const rnd = ill.rng(o.seed || 5);
      for (let i = 0; i < n; i++) {
        const cx0 = x0 + i * cw + 2.4, cx1 = x0 + (i + 1) * cw - 2.4;
        g += `<rect x="${q(cx0)}" y="${q(yt - d + 2)}" width="${q(cx1 - cx0)}" height="${q(d - 3.6)}" rx="2" fill="${F(o.wet ? 'soil-d' : 'soil')}"/>`;
        if (o.perlite) for (let k = 0; k < 4; k++) g += `<circle cx="${q(cx0 + 2.5 + rnd() * (cx1 - cx0 - 5))}" cy="${q(yt - d + 3.5 + rnd() * (d - 6.5))}" r="1.1" fill="${F('perlite')}"/>`;
        tops.push([(cx0 + cx1) / 2, yt - d / 2 + 1]);
      }
      g += `<path d="M${q(x0)} ${q(yt)}H${q(x1)}" stroke="${F('plastic-hi')}" stroke-width="1.6"/>`;
      return { svg: g, tops };
    }
    // a seed; gel: the clear coat it grows in wet soil
    const seed = (x, y, a = 0, gel = false) => `${gel ? `<ellipse cx="${q(x)}" cy="${q(y)}" rx="4" ry="3.3" fill="${F('gel')}" stroke="${F('glass-d')}" stroke-width=".5"/>` : ''}<ellipse cx="${q(x)}" cy="${q(y)}" rx="1.8" ry="1.2" transform="rotate(${q(a)} ${q(x)} ${q(y)})" fill="${F('seed')}"/>`;
    // a young plant: two round seed leaves, then pairs of true leaves. o: pairs, s (leaf scale), lean, pale, tone, cut (index of the pair above which a cut mark goes)
    function sprout(x, y, h = 30, o = {}) {
      const pairs = o.pairs || 0, s = o.s || 1, lean = o.lean || 0;
      const tx = x + lean, ty = y - h;
      let g = `<path d="M${q(x)} ${q(y)}Q${q(x + lean * 0.2)} ${q(y - h * 0.55)} ${q(tx)} ${q(ty)}" stroke="${F(o.pale ? 'lime' : 'stem')}" stroke-width="${q(1.4 + pairs * 0.4)}" fill="none" stroke-linecap="round"/>`;
      const cy = pairs ? y - h * 0.3 : ty, cx = x + lean * (pairs ? 0.1 : 1);
      [-1, 1].forEach(sd => { g += ill.leaf({ x: cx, y: cy, a: sd * 70, s: 0.09 * s, wide: 1.6, seed: 3 + sd, petiole: 2, pale: o.pale }); });
      const at = [];
      for (let i = 0; i < pairs; i++) {
        const t = (i + 1) / (pairs + 0.5), py = y - h * (0.3 + 0.7 * t), px = x + lean * t;
        at.push([px, py]);
        [-1, 1].forEach(sd => { g += ill.leaf({ x: px, y: py, a: sd * (60 - i * 7), s: (0.15 - i * 0.012) * s, seed: 7 + i * 2 + sd, petiole: 3, tone: o.tone, pale: o.pale }); });
      }
      if (pairs) [-1, 1].forEach(sd => { g += ill.leaf({ x: tx, y: ty, a: sd * 22, s: 0.055 * s, seed: 20 + sd, petiole: 1, tone: o.tone }); });
      if (o.cut != null && at[o.cut]) { const [px, py] = at[o.cut]; g += cutMark(px, py - 6 * s, 16); }
      return g;
    }
    // a plastic cup or a paper one, with soil; plants go in at (x, top of soil) = cupSoil(…)
    const cupSoil = (y, h = 34, o = {}) => y - h * (o.soil == null ? 0.82 : o.soil);
    function cup(x, y, w = 30, h = 34, o = {}) {
      const t = w / 2, b = w * 0.38, sl = o.soil == null ? 0.82 : o.soil, ys = y - h * sl, tw = b + (t - b) * sl;
      let g = `<path d="${P([[x - t, y - h], [x + t, y - h], [x + b, y], [x - b, y]])}" fill="${F(o.paper ? 'paper' : 'glass')}" stroke="${F(o.paper ? 'paper-d' : 'glass-d')}" stroke-width="1"/>`;
      if (!o.paper) g += `<path d="${P([[x - tw, ys], [x + tw, ys], [x + b - 0.8, y - 0.8], [x - b + 0.8, y - 0.8]])}" fill="${F('soil')}" opacity=".85"/>` + (o.roots ? roots(x, ys + 3, h * sl * 0.8, 7, { seed: 4, spread: 1.2 }) : '');
      g += `<ellipse cx="${q(x)}" cy="${q(ys)}" rx="${q(tw)}" ry="${q(Math.max(1.6, w * 0.07))}" fill="${F('soil-d')}"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t)}" ry="${q(Math.max(1.6, w * 0.07))}" fill="none" stroke="${F(o.paper ? 'paper-d' : 'glass-d')}" stroke-width="1.1"/>`;
      if (!o.paper) g += shine(x - t * 0.66, y - h * 0.86, x - b * 0.72, y - 3, 2, 0.45);
      return g;
    }
    // a plastic pot from the shop: thin black wall, sometimes many seedlings in it
    function shopPot(x, y, w = 56, h = 44, o = {}) {
      const t = w / 2, b = w * 0.36;
      let g = `<path d="${P([[x - t, y - h], [x + t, y - h], [x + b, y], [x - b, y]])}" fill="${F('plastic')}"/>`;
      g += `<path d="${P([[x - t - 2, y - h - 3], [x + t + 2, y - h - 3], [x + t + 1, y - h + 3], [x - t - 1, y - h + 3]])}" fill="${F('plastic-hi')}"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(y - h - 2)}" rx="${q(t)}" ry="3" fill="${F('soil-d')}"/>`;
      g += shine(x + t * 0.55, y - h * 0.8, x + b * 0.6, y - 4, 2, 0.18);
      return g;
    }
    // many thin seedlings crowded in one pot (the shop's way: 10–30 in a pot)
    function crowd(x, y, w = 50, n = 14, o = {}) {
      const rnd = ill.rng(o.seed || 9);
      let g = '';
      for (let i = 0; i < n; i++) {
        const bx = x - w / 2 + (i + 0.5) * w / n + (rnd() - 0.5) * 3, hh = (o.h || 50) * (0.75 + rnd() * 0.35), lean = (bx - x) * 0.35 + (rnd() - 0.5) * 6;
        g += sprout(bx, y, hh, { pairs: 2, s: 0.75, lean, pale: o.pale && rnd() < 0.5 });
      }
      return g;
    }
    // white roots from a point downwards; o: seed, spread (how far they fan out), w (thickness)
    function roots(x, y, len = 20, n = 6, o = {}) {
      const rnd = ill.rng(o.seed || 3), sp = o.spread || 1;
      let d = '', hairs = '';
      for (let i = 0; i < n; i++) {
        const a = (i / (n - 1 || 1) - 0.5) * 1.5 * sp + (rnd() - 0.5) * 0.3, l = len * (0.55 + rnd() * 0.45);
        const ex = x + Math.sin(a) * l, ey = y + Math.cos(a) * l;
        d += `M${q(x)} ${q(y)}Q${q(x + Math.sin(a) * l * 0.35 + (rnd() - 0.5) * 5)} ${q(y + l * 0.55)} ${q(ex)} ${q(ey)}`;
        for (let k = 1; k < 4; k++) { const t = k / 4, hx = x + (ex - x) * t, hy = y + (ey - y) * t, sd = k % 2 ? 1 : -1; hairs += `M${q(hx)} ${q(hy)}l${q(sd * 3)} ${q(2)}`; }
      }
      return `<path d="${d}" stroke="${F('root')}" stroke-width="${o.w || 1.4}" fill="none" stroke-linecap="round"/><path d="${hairs}" stroke="${F('root')}" stroke-width=".7" fill="none" opacity=".8"/>`;
    }
    // a lump of soil held together by roots, lifted out of a pot; split: into how many parts it is broken
    function rootball(x, y, w = 60, h = 44, o = {}) {
      const n = o.split || 1, gap = n > 1 ? 9 : 0, pw = (w - gap * (n - 1)) / n, rnd = ill.rng(o.seed || 6);
      let g = '';
      for (let i = 0; i < n; i++) {
        const cx = x - w / 2 + pw / 2 + i * (pw + gap), dy = n > 1 ? (i % 2 ? 3 : -2) : 0;
        g += `<path d="${micro.cell(cx, y - h / 2 + dy, pw / 2, h / 2, rnd, { p: 2.6, j: 0.08, n: 10 })}" fill="${F('soil')}"/>`;
        let d = '';
        for (let k = 0; k < 7; k++) { const sx = cx + (rnd() - 0.5) * pw * 0.8, sy = y - h + dy + 4 + rnd() * h * 0.7; d += `M${q(sx)} ${q(sy)}q${q((rnd() - 0.5) * 10)} ${q(4 + rnd() * 6)} ${q((rnd() - 0.5) * 14)} ${q(8 + rnd() * 8)}`; }
        g += `<path d="${d}" stroke="${F('root')}" stroke-width="1.2" fill="none" opacity=".9" stroke-linecap="round"/>`;
        g += roots(cx, y - 4 + dy, 10, 4, { seed: 11 + i, w: 1.1 });
      }
      return g;
    }
    // a spray bottle; mist: a cloud of droplets towards the left or right (dir)
    function sprayer(x, y, s = 1, o = {}) {
      const dir = o.dir || -1;
      let g = `<g transform="translate(${q(x)} ${q(y)}) scale(${s})">`;
      g += `<path d="M-11 0V-30Q-11 -36 -5 -37H5Q11 -36 11 -30V0Z" fill="${F('glass')}" stroke="${F('glass-d')}" stroke-width="1"/><path d="M-10 -1V-14H10V-1Z" fill="${F('water-c')}" opacity=".9"/>`;
      g += `<path d="M-6 -37V-43H6V-37Z" fill="${F('grip')}"/><path d="M-6 -43H${dir * 16}V-48H-6Z" fill="${F('grip')}"/><path d="M4 -42L10 -32" stroke="${F('grip')}" stroke-width="3" stroke-linecap="round"/>`;
      g += shine(-7, -31, -7, -5, 2, 0.5) + '</g>';
      if (o.mist !== false) { const rnd = ill.rng(3); for (let i = 0; i < 16; i++) { const t = rnd(), a = (rnd() - 0.5) * 0.7; g += `<circle cx="${q(x + dir * (16 * s + t * 26 * s))}" cy="${q(y - 45.5 * s + Math.sin(a) * t * 26 * s)}" r="${q(0.7 + rnd())}" fill="${F('water-c')}" opacity="${q(0.9 - t * 0.5)}"/>`; } }
      return g;
    }
    // a watering can pouring to the left (dir −1) or right; stream: how long the jet is
    function can(x, y, s = 1, o = {}) {
      const dir = o.dir || -1, st = o.stream == null ? 26 : o.stream;
      let g = `<g transform="translate(${q(x)} ${q(y)}) scale(${dir * -s} ${s})">`;
      g += `<path d="M-16 0V-26Q-16 -30 -12 -30H12Q16 -30 16 -26V0Z" fill="${F('box')}"/><path d="M-16 -26H16" stroke="${F('box-d')}" stroke-width="1.4"/>`;
      g += `<path d="M14 -28Q26 -42 10 -42Q-6 -42 -4 -30" fill="none" stroke="${F('box-d')}" stroke-width="3"/>`;
      g += `<path d="M-15 -8L-38 -30L-35 -33L-13 -15Z" fill="${F('box')}"/><path d="M-40 -34L-33 -27L-37 -26L-42 -31Z" fill="${F('box-d')}"/>`;
      g += shine(-10, -26, -10, -5, 2, 0.35) + '</g>';
      if (st) { const sx = x + dir * 39 * s, sy = y - 31 * s; g += `<path d="M${q(sx)} ${q(sy)}q${q(dir * 6)} ${q(st * 0.3)} ${q(dir * 8)} ${q(st)}" stroke="${F('water-c')}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`; }
      return g;
    }
    // a hanging LED lamp and its light; (x, y) — the middle of the lamp
    function lamp(x, y, w = 70, o = {}) {
      const reach = o.reach || 60, x0 = x - w / 2, x1 = x + w / 2, gid = ill.id('lmp');
      let g = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${F('light')}" stop-opacity=".8"/><stop offset="1" stop-color="${F('light')}" stop-opacity="0"/></linearGradient></defs>`;
      g += `<path d="${P([[x0 + 4, y + 6], [x1 - 4, y + 6], [x1 + reach * 0.3, y + reach], [x0 - reach * 0.3, y + reach]])}" fill="url(#${gid})"/>`;
      g += `<path d="M${q(x0 + 8)} ${q(y - 40)}V${q(y)}M${q(x1 - 8)} ${q(y - 40)}V${q(y)}" stroke="${F('metal-d')}" stroke-width="1"/>`;
      g += `<rect x="${q(x0)}" y="${q(y - 1)}" width="${q(w)}" height="8" rx="3" fill="${F('metal-d')}"/><rect x="${q(x0 + 3)}" y="${q(y + 5)}" width="${q(w - 6)}" height="3" rx="1.5" fill="${F('lamp')}"/>`;
      return g;
    }
    // a thermometer, level 0–1
    function thermo(x, y, h = 40, level = 0.6) {
      const top = y - h, ly = y - 8 - (h - 14) * level;
      return `<rect x="${q(x - 4)}" y="${q(top)}" width="8" height="${q(h - 4)}" rx="4" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1"/><path d="M${q(x)} ${q(y - 6)}V${q(ly)}" stroke="${F('cut')}" stroke-width="3" stroke-linecap="round"/><circle cx="${q(x)}" cy="${q(y - 5)}" r="5.5" fill="${F('cut')}"/>` +
        [0.25, 0.5, 0.75].map(t => `<path d="M${q(x + 4)} ${q(y - 8 - (h - 14) * t)}h3" stroke="${F('frame-d')}" stroke-width="1"/>`).join('');
    }
    // a clear dome lid over a tray, misted on the inside
    function lid(x, y, w, h, o = {}) {
      const x0 = x - w / 2, x1 = x + w / 2, r = Math.min(10, h * 0.4);
      const d = `M${q(x0)} ${q(y)}V${q(y - h + r)}Q${q(x0)} ${q(y - h)} ${q(x0 + r)} ${q(y - h)}H${q(x1 - r)}Q${q(x1)} ${q(y - h)} ${q(x1)} ${q(y - h + r)}V${q(y)}Z`;
      let g = `<path d="${d}" fill="${F('glass')}" opacity=".5" stroke="${F('glass-d')}" stroke-width="1.3"/>`;
      g += `<rect x="${q(x - 9)}" y="${q(y - h - 3)}" width="18" height="5" rx="2" fill="${F('glass-d')}" opacity=".85"/>`;
      if (o.drops !== false) { const rnd = ill.rng(o.seed || 4); for (let i = 0; i < 22; i++) g += `<circle cx="${q(x0 + 5 + rnd() * (w - 10))}" cy="${q(y - h + 5 + rnd() * h * 0.5)}" r="${q(0.8 + rnd() * 1.5)}" fill="${F('hi')}" opacity=".8"/>`; }
      g += `<path d="M${q(x0 + 5)} ${q(y - h + 7)}Q${q(x0 + 4)} ${q(y - 8)} ${q(x0 + 7)} ${q(y - 4)}" stroke="${F('hi')}" stroke-width="2.6" opacity=".55" fill="none"/>`;
      return g;
    }

    /* ---------- tools ---------- */
    // garden snips with their pivot at (x, y), blades towards angle a (degrees, 0 — to the right)
    function scissors(x, y, a = 0, s = 1, open = 1) {
      const o = 5 * open;
      let g = `<path d="M-14 -${q(o + 3)}Q-3 -${q(o + 2)} 0 0M-14 ${q(o + 3)}Q-3 ${q(o + 2)} 0 0" stroke="${F('grip')}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
      g += `<ellipse cx="-19" cy="-${q(o + 5)}" rx="7" ry="5" fill="none" stroke="${F('grip')}" stroke-width="3.4"/><ellipse cx="-19" cy="${q(o + 5)}" rx="7" ry="5" fill="none" stroke="${F('grip')}" stroke-width="3.4"/>`;
      g += `<path d="M-1 -1.6L27 -${q(o + 3)}Q30 -${q(o + 2)} 28 -${q(o)}L0 2Z" fill="${F('metal')}" stroke="${F('metal-d')}" stroke-width=".8"/><path d="M-1 1.6L27 ${q(o + 3)}Q30 ${q(o + 2)} 28 ${q(o)}L0 -2Z" fill="${F('metal')}" stroke="${F('metal-d')}" stroke-width=".8"/>`;
      g += `<circle r="2.2" fill="${F('metal-d')}"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    // where to cut: a short dashed red line across a stem
    const cutMark = (x, y, w = 18) => `<path d="M${q(x - w / 2)} ${q(y)}H${q(x + w / 2)}" stroke="${F('cut')}" stroke-width="2.2" stroke-dasharray="3.5 2.5" stroke-linecap="round"/>`;
    // a kitchen knife, edge down, tip towards angle a
    function knife(x, y, a = 0, s = 1) {
      const g = `<path d="M0 -3H30Q40 -2 44 3H0Z" fill="${F('metal')}" stroke="${F('metal-d')}" stroke-width=".8"/><rect x="-24" y="-4" width="25" height="8" rx="3" fill="${F('wood-d')}"/><circle cx="-16" cy="0" r="1.1" fill="${F('metal')}"/><circle cx="-7" cy="0" r="1.1" fill="${F('metal')}"/>`;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(a)}) scale(${s})">${g}</g>`;
    }
    // a magnifying glass: what is under it (inner, drawn in a 2r × 2r box centred on 0, 0) is shown bigger
    function lens(x, y, r = 24, inner = '', a = 40) {
      const cid = ill.id('lens');
      return `<defs><clipPath id="${cid}"><circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}"/></clipPath></defs><circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}" fill="${F('bg-2')}"/>` +
        `<g clip-path="url(#${cid})"><g transform="translate(${q(x)} ${q(y)})">${inner}</g></g>` +
        `<path d="M${q(x + Math.cos(a * Math.PI / 180) * r)} ${q(y + Math.sin(a * Math.PI / 180) * r)}l${q(Math.cos(a * Math.PI / 180) * 22)} ${q(Math.sin(a * Math.PI / 180) * 22)}" stroke="${F('wood-d')}" stroke-width="6" stroke-linecap="round"/>` +
        `<circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}" fill="none" stroke="${F('metal-d')}" stroke-width="3.2"/><path d="M${q(x - r * 0.6)} ${q(y - r * 0.35)}A${q(r * 0.7)} ${q(r * 0.7)} 0 0 1 ${q(x - r * 0.2)} ${q(y - r * 0.68)}" stroke="${F('hi')}" stroke-width="2.4" fill="none" opacity=".6" stroke-linecap="round"/>`;
    }
    // a bottle of liquid fertilizer or oil; fill: token of what is inside
    function bottle(x, y, w = 22, h = 50, o = {}) {
      const t = w / 2, nk = w * 0.22, sh = y - h * 0.62;
      let g = `<path d="M${q(x - t)} ${q(y)}V${q(sh + 6)}Q${q(x - t)} ${q(sh - 4)} ${q(x - nk)} ${q(sh - 10)}V${q(y - h + 6)}H${q(x + nk)}V${q(sh - 10)}Q${q(x + t)} ${q(sh - 4)} ${q(x + t)} ${q(sh + 6)}V${q(y)}Z" fill="${F(o.fill || 'glass')}" stroke="${F('glass-d')}" stroke-width="1"/>`;
      g += `<rect x="${q(x - nk - 1.5)}" y="${q(y - h)}" width="${q(nk * 2 + 3)}" height="7" rx="1.5" fill="${F(o.cap || 'grip')}"/>`;
      if (o.label !== false) g += `<rect x="${q(x - t + 2)}" y="${q(y - h * 0.45)}" width="${q(w - 4)}" height="${q(h * 0.28)}" rx="2" fill="${F('label')}"/><path d="M${q(x - t + 5)} ${q(y - h * 0.36)}h${q(w - 10)}M${q(x - t + 5)} ${q(y - h * 0.27)}h${q(w * 0.5)}" stroke="${F('paper-d')}" stroke-width="1.6"/>`;
      g += shine(x - t * 0.55, sh + 4, x - t * 0.55, y - 4, 2, 0.4);
      return g;
    }

    /* ---------- kitchen and storage ---------- */
    // a glass of water; inside: what is under the water (stems, roots), drawn behind the glass wall
    function glass(x, y, w = 40, h = 56, o = {}) {
      const t = w / 2, b = w * 0.42, lv = o.level == null ? 0.7 : o.level, yw = y - h * lv, tw = b + (t - b) * lv;
      let g = `<path d="${P([[x - tw, yw], [x + tw, yw], [x + b, y], [x - b, y]])}" fill="${F('water-c')}" opacity=".75"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(yw)}" rx="${q(tw)}" ry="${q(Math.max(1.5, w * 0.06))}" fill="${F('water-c')}" stroke="${F('glass-d')}" stroke-width=".6"/>`;
      if (o.inside) g += o.inside;
      g += `<path d="${P([[x - t, y - h], [x + t, y - h], [x + b, y], [x - b, y]])}" fill="${F('glass')}" opacity=".3" stroke="${F('glass-d')}" stroke-width="1.2"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t)}" ry="${q(Math.max(1.6, w * 0.07))}" fill="none" stroke="${F('glass-d')}" stroke-width="1.2"/>`;
      g += shine(x - t * 0.62, y - h * 0.88, x - b * 0.7, y - 4, 2.6, 0.55);
      return g;
    }
    // a jar with a lid; fill: token of the contents, level 0–1; layer: a band of oil on top; bands: salted leaves in layers
    function jar(x, y, w = 40, h = 50, o = {}) {
      const t = w / 2, lv = o.level == null ? 0.8 : o.level, yf = y - (h - 8) * lv;
      let g = `<rect x="${q(x - t)}" y="${q(y - h + 6)}" width="${q(w)}" height="${q(h - 6)}" rx="6" fill="${F('glass')}" opacity=".45" stroke="${F('glass-d')}" stroke-width="1.1"/>`;
      if (o.fill) g += `<path d="M${q(x - t + 2)} ${q(yf)}H${q(x + t - 2)}V${q(y - 6)}Q${q(x + t - 2)} ${q(y - 2)} ${q(x + t - 6)} ${q(y - 2)}H${q(x - t + 6)}Q${q(x - t + 2)} ${q(y - 2)} ${q(x - t + 2)} ${q(y - 6)}Z" fill="${F(o.fill)}"/>`;
      if (o.bands) { const n = o.bands, hh = (y - 3 - yf) / n; for (let i = 0; i < n; i++) g += `<rect x="${q(x - t + 3)}" y="${q(yf + i * hh)}" width="${q(w - 6)}" height="${q(hh * 0.45)}" rx="2" fill="${F('salt')}" opacity=".95"/>`; }
      if (o.layer) g += `<rect x="${q(x - t + 2)}" y="${q(yf - 1)}" width="${q(w - 4)}" height="${q(o.layer)}" fill="${F('oil')}" opacity=".95"/>`;
      if (o.bits) { const rnd = ill.rng(8); for (let i = 0; i < o.bits; i++) g += `<ellipse cx="${q(x - t + 5 + rnd() * (w - 10))}" cy="${q(yf + 4 + rnd() * (y - yf - 9))}" rx="${q(1.6 + rnd() * 1.6)}" ry="1.2" transform="rotate(${q(rnd() * 180)} ${q(x)} ${q(y)})" fill="${F('leaf-deep')}" opacity=".85"/>`; }
      g += `<rect x="${q(x - t - 1)}" y="${q(y - h)}" width="${q(w + 2)}" height="8" rx="2.5" fill="${F(o.cap || 'metal-d')}"/>`;
      g += shine(x - t + 5, y - h + 12, x - t + 5, y - 8, 2.4, 0.45);
      return g;
    }
    // an ice cube tray seen a little from above; in every cube: chopped basil in oil (or in water: water)
    function iceTray(x, y, w = 100, o = {}) {
      const n = o.cells || 4, h = 12, d = 18, x0 = x - w / 2, cw = w / n, rnd = ill.rng(5);
      let g = `<path d="${P([[x0, y - h], [x0 + w, y - h], [x0 + w - 3, y], [x0 + 3, y]])}" fill="${F('ice')}" stroke="${F('glass-d')}" stroke-width="1"/>`;
      g += `<path d="${P([[x0, y - h], [x0 + w, y - h], [x0 + w, y - h - d], [x0, y - h - d]])}" fill="${F('ice')}" stroke="${F('glass-d')}" stroke-width="1"/>`;
      for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
        const cx0 = x0 + i * cw + 2.5, cy0 = y - h - d + 2 + r * (d / 2 - 1);
        g += `<rect x="${q(cx0)}" y="${q(cy0)}" width="${q(cw - 5)}" height="${q(d / 2 - 3)}" rx="2" fill="${F(o.water ? 'water-c' : 'oil')}" opacity=".9"/>`;
        for (let k = 0; k < 3; k++) g += `<ellipse cx="${q(cx0 + 3 + rnd() * (cw - 11))}" cy="${q(cy0 + 2 + rnd() * (d / 2 - 7))}" rx="2" ry="1.2" fill="${F('leaf-deep')}"/>`;
      }
      return g;
    }
    // a bunch of stems tied with string, hanging upside down from (x, y); dry: leaves gone olive and curled
    function bunch(x, y, s = 1, o = {}) {
      const rnd = ill.rng(o.seed || 7);
      let g = `<path d="M${q(x)} ${q(y - 14 * s)}V${q(y + 4 * s)}" stroke="${F('kraft-d')}" stroke-width="1.4"/>`;
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 9 + (rnd() - 0.5) * 4, r = a * Math.PI / 180, len = (48 + rnd() * 12) * s;
        const ex = x + Math.sin(r) * len, ey = y + Math.cos(r) * len;
        g += `<path d="M${q(x)} ${q(y)}L${q(ex)} ${q(ey)}" stroke="${F(o.dry ? 'stem-d' : 'stem')}" stroke-width="${q(1.8 * s)}" stroke-linecap="round"/>`;
        for (let k = 1; k <= 3; k++) {
          const t = 0.3 + k * 0.22, px = x + (ex - x) * t, py = y + (ey - y) * t;
          [-1, 1].forEach(sd => { g += ill.leaf({ x: px, y: py, a: 180 + a + sd * (60 + rnd() * 20), s: 0.15 * s * (1.1 - k * 0.12), seed: 30 + i * 7 + k * 2 + sd, petiole: 4, color: o.dry ? ill.mix('brown', 'leaf-deep', 0.35) : null, curl: o.dry ? 0.6 : 0, wide: o.dry ? 0.8 : 1 }); });
        }
      }
      g += `<path d="M${q(x - 5 * s)} ${q(y + 3 * s)}H${q(x + 5 * s)}" stroke="${F('kraft-d')}" stroke-width="${q(3 * s)}" stroke-linecap="round"/>`;
      return g;
    }
    // a paper envelope for seeds, with a label
    function envelope(x, y, w = 50, h = 64, o = {}) {
      const x0 = x - w / 2;
      let g = `<rect x="${q(x0)}" y="${q(y - h)}" width="${q(w)}" height="${q(h)}" rx="3" fill="${F('kraft')}"/><path d="M${q(x0)} ${q(y - h)}L${q(x)} ${q(y - h + h * 0.28)}L${q(x0 + w)} ${q(y - h)}" fill="${F('kraft-d')}" opacity=".55"/>`;
      g += `<rect x="${q(x0 + 6)}" y="${q(y - h * 0.55)}" width="${q(w - 12)}" height="${q(h * 0.36)}" rx="2" fill="${F('label')}"/>`;
      g += `<path d="M${q(x0 + 10)} ${q(y - h * 0.44)}h${q(w - 22)}M${q(x0 + 10)} ${q(y - h * 0.34)}h${q(w * 0.42)}M${q(x0 + 10)} ${q(y - h * 0.25)}h${q(w * 0.3)}" stroke="${F('paper-d')}" stroke-width="2" stroke-linecap="round"/>`;
      if (o.seeds) for (let i = 0; i < 5; i++) g += seed(x + (i - 2) * 6, y + 6 + (i % 2) * 3, i * 40);
      return g;
    }
    // a bowl from the side, with what is in it (seeds and chaff)
    function bowl(x, y, w = 70, o = {}) {
      const t = w / 2, h = w * 0.36, rnd = ill.rng(9);
      let g = `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t)}" ry="${q(h * 0.22)}" fill="${F('paper-d')}"/>`;
      if (o.seeds) for (let i = 0; i < 26; i++) g += seed(x + (rnd() - 0.5) * w * 0.8, y - h + (rnd() - 0.5) * h * 0.25, rnd() * 180);
      if (o.chaff) for (let i = 0; i < 9; i++) g += `<path d="M${q(x + (rnd() - 0.5) * w * 0.7)} ${q(y - h + (rnd() - 0.6) * h * 0.3)}l${q(4 + rnd() * 3)} ${q(-1 - rnd() * 2)}" stroke="${F('straw')}" stroke-width="1.6" stroke-linecap="round"/>`;
      g += `<path d="M${q(x - t)} ${q(y - h)}Q${q(x - t)} ${q(y)} ${q(x)} ${q(y)}Q${q(x + t)} ${q(y)} ${q(x + t)} ${q(y - h)}Q${q(x)} ${q(y - h + h * 0.3)} ${q(x - t)} ${q(y - h)}Z" fill="${F('paper')}" stroke="${F('paper-d')}" stroke-width="1"/>`;
      return g;
    }
    // a stone mortar with pesto and the pestle in it
    function mortar(x, y, w = 64) {
      const t = w / 2, h = w * 0.5;
      return `<path d="M${q(x + 4)} ${q(y - h + 2)}L${q(x + t + 8)} ${q(y - h - 26)}" stroke="${F('frame-d')}" stroke-width="9" stroke-linecap="round"/>` +
        `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t - 3)}" ry="${q(h * 0.2)}" fill="${F('pesto')}"/>` +
        `<path d="M${q(x - t)} ${q(y - h)}Q${q(x - t)} ${q(y)} ${q(x)} ${q(y)}Q${q(x + t)} ${q(y)} ${q(x + t)} ${q(y - h)}Q${q(x)} ${q(y - h + h * 0.4)} ${q(x - t)} ${q(y - h)}Z" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1.2"/>`;
    }
    // a saucepan of water; steam: it boils
    function saucepan(x, y, w = 60, o = {}) {
      const t = w / 2, h = w * 0.55;
      let g = `<rect x="${q(x - t)}" y="${q(y - h)}" width="${q(w)}" height="${q(h)}" rx="5" fill="${F('metal')}" stroke="${F('metal-d')}" stroke-width="1"/><rect x="${q(x - t - 12)}" y="${q(y - h + 4)}" width="12" height="5" rx="2" fill="${F('metal-d')}"/><rect x="${q(x + t)}" y="${q(y - h + 4)}" width="12" height="5" rx="2" fill="${F('metal-d')}"/>`;
      g += `<ellipse cx="${q(x)}" cy="${q(y - h)}" rx="${q(t)}" ry="4" fill="${F('water-c')}"/>`;
      if (o.steam) g += [-1, 0, 1].map(i => `<path d="M${q(x + i * 12)} ${q(y - h - 6)}q-5 -7 0 -14q5 -7 0 -14" stroke="${F('glass-d')}" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>`).join('');
      return g;
    }
    // a clear bag loose over leaves, or a paper bag (kind: 'paper')
    function bag(x, y, w = 50, h = 60, o = {}) {
      const t = w / 2;
      if (o.kind === 'paper') return `<path d="M${q(x - t)} ${q(y)}V${q(y - h + 8)}L${q(x - t + 6)} ${q(y - h)}H${q(x + t - 6)}L${q(x + t)} ${q(y - h + 8)}V${q(y)}Z" fill="${F('kraft')}"/><path d="M${q(x - t + 6)} ${q(y - h)}V${q(y)}M${q(x + t - 6)} ${q(y - h)}V${q(y)}" stroke="${F('kraft-d')}" stroke-width="1" opacity=".6"/><path d="M${q(x - t)} ${q(y - h + 8)}H${q(x + t)}" stroke="${F('kraft-d')}" stroke-width="1.4"/>`;
      return `<path d="M${q(x - t)} ${q(y)}C${q(x - t - 4)} ${q(y - h * 0.6)} ${q(x - t * 0.6)} ${q(y - h)} ${q(x)} ${q(y - h)}C${q(x + t * 0.6)} ${q(y - h)} ${q(x + t + 4)} ${q(y - h * 0.6)} ${q(x + t)} ${q(y)}" fill="${F('film')}" opacity=".55" stroke="${F('glass-d')}" stroke-width="1"/>` + shine(x - t * 0.55, y - h * 0.72, x - t * 0.75, y - h * 0.25, 2.4, 0.6);
    }

    /* ---------- places ---------- */
    // a window seen from the room: (x, y) — the middle of the sill; o: radiator under it, curtain (light tulle), sun
    function window_(x, y, w = 120, h = 100, o = {}) {
      const x0 = x - w / 2, top = y - h, gid = ill.id('sky');
      let g = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${F('sky')}"/><stop offset="1" stop-color="${F('sky-2')}"/></linearGradient></defs>`;
      g += `<rect x="${q(x0)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" fill="url(#${gid})"/>`;
      if (o.sun) g += `<circle cx="${q(x0 + w * 0.76)}" cy="${q(top + h * 0.26)}" r="${q(h * 0.11)}" fill="${F('yellow')}" opacity=".95"/>`;
      if (o.rays) g += [0, 1, 2].map(i => `<path d="M${q(x0 + w * (0.62 + i * 0.1))} ${q(top)}L${q(x0 + w * (0.2 + i * 0.12))} ${q(y)}L${q(x0 + w * (0.3 + i * 0.12))} ${q(y)}L${q(x0 + w * (0.7 + i * 0.1))} ${q(top)}Z" fill="${F('light')}" opacity=".18"/>`).join('');
      g += `<rect x="${q(x0)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" fill="none" stroke="${F('frame')}" stroke-width="7"/><path d="M${q(x)} ${q(top)}V${q(y)}" stroke="${F('frame')}" stroke-width="5"/>`;
      g += `<rect x="${q(x0)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" fill="none" stroke="${F('frame-d')}" stroke-width="1"/>`;
      if (o.curtain) g += `<path d="M${q(x0 + 3)} ${q(top + 3)}H${q(x0 + w * 0.62)}Q${q(x0 + w * 0.56)} ${q(top + h * 0.5)} ${q(x0 + w * 0.64)} ${q(y - 3)}H${q(x0 + 3)}Z" fill="${F('film')}" opacity=".75"/>` + [0.15, 0.3, 0.45].map(t => `<path d="M${q(x0 + w * t)} ${q(top + 4)}V${q(y - 4)}" stroke="${F('frame-d')}" stroke-width=".8" opacity=".5"/>`).join('');
      g += `<rect x="${q(x0 - 10)}" y="${q(y)}" width="${q(w + 20)}" height="7" rx="2" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1"/>`;
      if (o.radiator) { const ry = y + 14; for (let i = 0; i < 8; i++) g += `<rect x="${q(x0 + 6 + i * (w - 12) / 8)}" y="${q(ry)}" width="${q((w - 12) / 8 - 3)}" height="30" rx="3" fill="${F('radiator')}" stroke="${F('frame-d')}" stroke-width=".8"/>`; g += [0, 1, 2].map(i => `<path d="M${q(x - 20 + i * 18)} ${q(ry - 2)}q-4 -5 0 -10" stroke="${F('cut')}" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>`).join(''); }
      return g;
    }
    // a balcony: a railing across the picture and a box of soil hanging on it
    function balcony(x0, x1, y, o = {}) {
      let g = `<path d="M${q(x0)} ${q(y - 46)}H${q(x1)}" stroke="${F('metal-d')}" stroke-width="4" stroke-linecap="round"/><path d="M${q(x0)} ${q(y)}H${q(x1)}" stroke="${F('metal-d')}" stroke-width="3"/>`;
      for (let x = x0 + 8; x < x1; x += 14) g += `<path d="M${q(x)} ${q(y - 46)}V${q(y)}" stroke="${F('metal-d')}" stroke-width="1.6" opacity=".8"/>`;
      if (o.box) { const [bx0, bx1] = o.box; g += `<rect x="${q(bx0)}" y="${q(y - 62)}" width="${q(bx1 - bx0)}" height="22" rx="3" fill="${F('box')}"/><rect x="${q(bx0 - 2)}" y="${q(y - 64)}" width="${q(bx1 - bx0 + 4)}" height="5" rx="2" fill="${F('box-d')}"/><ellipse cx="${q((bx0 + bx1) / 2)}" cy="${q(y - 62)}" rx="${q((bx1 - bx0) / 2 - 2)}" ry="2.5" fill="${F('soil-d')}"/><path d="M${q(bx0 + 8)} ${q(y - 40)}l-4 -8M${q(bx1 - 8)} ${q(y - 40)}l4 -8" stroke="${F('metal-d')}" stroke-width="2"/>`; }
      return g;
    }
    // a bed: a strip of soil from x0 to x1 with its top at y; mulch: straw on it
    function bed(x0, x1, y, o = {}) {
      const rnd = ill.rng(o.seed || 4), dep = o.depth || 18;
      let g = `<path d="M${q(x0)} ${q(y + dep)}V${q(y + 3)}Q${q(x0 + 6)} ${q(y - 2)} ${q(x0 + 14)} ${q(y - 1)}H${q(x1 - 14)}Q${q(x1 - 6)} ${q(y - 2)} ${q(x1)} ${q(y + 3)}V${q(y + dep)}Z" fill="${F('soil')}"/>`;
      g += `<path d="M${q(x0 + 8)} ${q(y + 4)}H${q(x1 - 8)}" stroke="${F('soil-d')}" stroke-width="1.5" stroke-dasharray="6 5" opacity=".7"/>`;
      if (o.mulch) { let d = ''; for (let i = 0; i < (x1 - x0) / 3; i++) { const sx = x0 + 6 + rnd() * (x1 - x0 - 12), sy = y - 1 + rnd() * 4; d += `M${q(sx)} ${q(sy)}l${q(5 + rnd() * 4)} ${q((rnd() - 0.5) * 3)}`; } g += `<path d="${d}" stroke="${F('straw')}" stroke-width="1.6" stroke-linecap="round"/>`; }
      return g;
    }
    // a small greenhouse: arched frame and clear walls, door open for air; (x, y) — the middle of its floor
    function greenhouse(x, y, w = 150, h = 100, o = {}) {
      const t = w / 2;
      const arch = `M${q(x - t)} ${q(y)}V${q(y - h * 0.55)}Q${q(x - t)} ${q(y - h)} ${q(x)} ${q(y - h)}Q${q(x + t)} ${q(y - h)} ${q(x + t)} ${q(y - h * 0.55)}V${q(y)}`;
      let g = `<path d="${arch}Z" fill="${F('film')}" opacity=".45"/>`;
      g += [-0.5, 0, 0.5].map(k => `<path d="M${q(x + k * t)} ${q(y)}V${q(y - h * (k ? 0.9 : 1))}" stroke="${F('frame-d')}" stroke-width="1.4" opacity=".8"/>`).join('');
      g += `<path d="${arch}" fill="none" stroke="${F('frame-d')}" stroke-width="2.6"/>`;
      if (o.vent) g += `<path d="M${q(x + t * 0.2)} ${q(y - h * 0.98)}l${q(t * 0.3)} -10l4 8" fill="${F('film')}" stroke="${F('frame-d')}" stroke-width="1.4"/>`;
      g += shine(x - t * 0.8, y - h * 0.6, x - t * 0.45, y - h * 0.9, 3, 0.45);
      return g;
    }
    // a hydroponic tank, cut open: lid with net pots, roots hanging in the solution, an air stone bubbling
    function tank(x, y, w = 110, h = 52, o = {}) {
      const t = w / 2, top = y - h, rnd = ill.rng(o.seed || 3), pots = o.pots || [-0.5, 0, 0.5];
      let g = `<rect x="${q(x - t)}" y="${q(top)}" width="${q(w)}" height="${q(h)}" rx="4" fill="${F('dark')}"/>`;
      g += `<rect x="${q(x - t + 4)}" y="${q(top + 10)}" width="${q(w - 8)}" height="${q(h - 14)}" rx="2" fill="${F('water-c')}" opacity=".9"/>`;
      pots.forEach((k, i) => { g += roots(x + k * t, top + 6, h - 14, 7, { seed: 20 + i, spread: 0.7, w: 1.3 }); });
      g += `<rect x="${q(x - 8)}" y="${q(y - 8)}" width="16" height="5" rx="2" fill="${F('frame-d')}"/>`;
      for (let i = 0; i < 9; i++) g += `<circle cx="${q(x + (rnd() - 0.5) * 18)}" cy="${q(y - 12 - rnd() * (h - 26))}" r="${q(0.9 + rnd() * 1.4)}" fill="none" stroke="${F('hi')}" stroke-width=".9"/>`;
      g += `<path d="M${q(x + 6)} ${q(y - 6)}Q${q(x + t - 8)} ${q(y - 6)} ${q(x + t - 6)} ${q(top + 4)}" stroke="${F('frame-d')}" stroke-width="1.6" fill="none"/>`;
      g += `<rect x="${q(x - t - 3)}" y="${q(top - 4)}" width="${q(w + 6)}" height="8" rx="2" fill="${F('plastic-hi')}"/>`;
      pots.forEach(k => { g += `<path d="M${q(x + k * t - 8)} ${q(top - 4)}H${q(x + k * t + 8)}L${q(x + k * t + 6)} ${q(top + 8)}H${q(x + k * t - 6)}Z" fill="${F('plastic')}"/>`; });
      return g;
    }
    // a tree crown giving shade (hardening off starts there)
    function tree(x, y, s = 1) {
      return `<path d="M${q(x)} ${q(y)}V${q(y - 50 * s)}" stroke="${F('wood-d')}" stroke-width="${q(7 * s)}" stroke-linecap="round"/>` +
        [[0, -66, 30], [-20, -54, 22], [20, -52, 22], [-8, -84, 20], [12, -78, 18]].map(([dx, dy, r]) => `<circle cx="${q(x + dx * s)}" cy="${q(y + dy * s)}" r="${q(r * s)}" fill="${F('leaf-deep')}" opacity=".92"/>`).join('');
    }
    const sun = (x, y, r = 11) => `<g><circle cx="${q(x)}" cy="${q(y)}" r="${r}" fill="${F('yellow')}"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${q(x + Math.cos(a) * (r + 3))} ${q(y + Math.sin(a) * (r + 3))}L${q(x + Math.cos(a) * (r + 8))} ${q(y + Math.sin(a) * (r + 8))}" stroke="${F('yellow')}" stroke-width="2.2" stroke-linecap="round"/>`; }).join('')}</g>`;
    const moon = (x, y, r = 9) => `<path d="M${q(x + r * 0.3)} ${q(y - r)}A${r} ${r} 0 1 0 ${q(x + r * 0.3)} ${q(y + r)}A${q(r * 0.75)} ${q(r * 0.75)} 0 1 1 ${q(x + r * 0.3)} ${q(y - r)}Z" fill="${F('yellow-pale')}"/>`;
    // drops of water falling or standing
    const drop = (x, y, s = 1) => `<path d="M${q(x)} ${q(y - 5 * s)}c${q(2.5 * s)} ${q(3 * s)} ${q(4 * s)} ${q(5 * s)} ${q(4 * s)} ${q(7 * s)}a${q(4 * s)} ${q(4 * s)} 0 0 1 ${q(-8 * s)} 0c0 ${q(-2 * s)} ${q(1.5 * s)} ${q(-4 * s)} ${q(4 * s)} ${q(-7 * s)}Z" fill="${F('water-c')}" stroke="${F('glass-d')}" stroke-width=".6"/>`;

    /* ---------- marks that follow the theme ---------- */
    // a curved arrow from (x1, y1) to (x2, y2); bend: how far the curve bows (+ up, − down)
    function arrow(x1, y1, x2, y2, bend = 0) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - bend, a = Math.atan2(y2 - my, x2 - mx), L = 7;
      return `<path class="ill-arrow" d="M${q(x1)} ${q(y1)}Q${q(mx)} ${q(my)} ${q(x2)} ${q(y2)}"/><path class="ill-arrow-head" d="M${q(x2)} ${q(y2)}L${q(x2 - Math.cos(a - 0.45) * L)} ${q(y2 - Math.sin(a - 0.45) * L)}L${q(x2 - Math.cos(a + 0.45) * L)} ${q(y2 - Math.sin(a + 0.45) * L)}Z"/>`;
    }
    // a dimension: a line with end ticks between x1 and x2 at y and its text above (or below: under)
    const dim = (x1, x2, y, text, under = false) => `<g class="ill-scale"><path d="M${q(x1)} ${q(y - 4)}V${q(y + 4)}M${q(x2)} ${q(y - 4)}V${q(y + 4)}" fill="none" stroke="currentColor"/><line x1="${q(x1)}" x2="${q(x2)}" y1="${q(y)}" y2="${q(y)}"/><text x="${q((x1 + x2) / 2)}" y="${q(under ? y + 15 : y - 6)}" text-anchor="middle">${text}</text></g>`;

    return { tray, seed, sprout, cup, cupSoil, shopPot, crowd, roots, rootball, sprayer, can, lamp, thermo, lid, scissors, cutMark, knife, lens, bottle, glass, jar, iceTray, bunch, envelope, bowl, mortar, saucepan, bag, window: window_, balcony, bed, greenhouse, tank, tree, sun, moon, drop, arrow, dim };
  })();

  /* @use props */
  /* Pictures of the Planting chapter: the steps of sowing (data-ill="sow:1…9"), of saving a pot of basil
     from the shop (shop:1…7 and shop:hero, the split), and the places to grow it (place:<id>, B.PLACES). */
  const Fp = ill.F, qp = ill.q, R = props;
  const paperP = (w, hh) => `<rect width="${w}" height="${hh}" rx="14" fill="${Fp('bg')}"/>`;
  // the table or the ground the things stand on
  const tableP = (y, w = 120, hh = 120) => `<path d="M0 ${y}H${w}V${hh - 14}Q${w} ${hh} ${w - 14} ${hh}H14Q0 ${hh} 0 ${hh - 14}Z" fill="${Fp('bg-2')}"/>`;
  const stepP = (body, label, y = 104) => ill.svg(120, 120, paperP(120, 120) + tableP(y) + body, label);
  // a small basil plant of a few leaf pairs, standing on (x, y)
  const young = (x, y, h, pairs, o = {}) => R.sprout(x, y, h, Object.assign({ pairs, s: o.s || 1.25 }, o));

  /* ---------- sowing ---------- */
  const SOW = {
    1: () => {
      const t = R.tray(46, 102, 76, { cells: 3, perlite: true, wet: true });
      return stepP(R.bag(98, 102, 34, 46, { kind: 'paper' }) + `<ellipse cx="98" cy="57" rx="14" ry="3" fill="${Fp('soil-d')}"/>` + t.svg +
        [36, 46, 56].map(x => `<path d="M${x} 78q-4 -6 0 -12q4 -6 0 -12" stroke="${Fp('glass-d')}" stroke-width="1.5" fill="none" opacity=".7" stroke-linecap="round"/>`).join(''), 'Кассета с лёгким грунтом и перлитом');
    },
    2: () => {
      // a cell cut open: the seed lies half a centimetre under the surface
      const x0 = 18, x1 = 74, top = 52, rnd = ill.rng(4);
      let g = `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="50" fill="${Fp('soil')}"/>`;
      for (let i = 0; i < 26; i++) g += `<circle cx="${qp(x0 + 3 + rnd() * (x1 - x0 - 6))}" cy="${qp(top + 4 + rnd() * 44)}" r="${qp(0.7 + rnd() * 0.9)}" fill="${Fp(rnd() < 0.35 ? 'perlite' : 'soil-d')}"/>`;
      g += `<path d="M${x0} ${top}V102H${x1}V${top}" fill="none" stroke="${Fp('plastic')}" stroke-width="4"/>`;
      g += R.seed(36, top + 9, 20, true) + R.seed(56, top + 8, -30, true);
      g += `<g class="ill-scale"><path d="M${x0 - 7} ${top}V${top + 9}M${x0 - 11} ${top}H${x0 - 3}M${x0 - 11} ${top + 9}H${x0 - 3}" fill="none" stroke="currentColor" stroke-width="1.6"/></g>`;
      g += ill.label(x0 - 6, top - 8, '0,5 см', 'start');
      g += R.sprayer(98, 102, 0.95, { dir: -1 });
      return stepP(g, 'Семена под тонким слоем грунта и распылитель');
    },
    3: () => {
      const t = R.tray(52, 104, 84, { cells: 3, wet: true });
      return stepP(t.svg + t.tops.map(([x, y]) => R.seed(x - 4, y, 20, true) + R.seed(x + 5, y + 1, -40, true)).join('') + R.lid(52, 98, 88, 40) + R.thermo(106, 102, 44, 0.7) + ill.label(112, 24, '22–25 °C', 'end'), 'Кассета под прозрачной крышкой и термометр');
    },
    4: () => {
      const t = R.tray(60, 104, 92, { cells: 3, wet: true });
      return stepP(R.lamp(60, 14, 84, { reach: 60 }) + t.svg + t.tops.map(([x, y], i) => R.sprout(x - 5, y, 16 + i, { s: 1.05 }) + R.sprout(x + 6, y + 1, 14 + i, { s: 1, lean: 2 })).join(''), 'Всходы под лампой');
    },
    5: () => {
      const t = R.tray(30, 104, 44, { cells: 2, wet: true });
      const ys = R.cupSoil(104, 46);
      return stepP(t.svg + t.tops.map(([x, y]) => R.sprout(x, y, 18, { pairs: 1, s: 1 })).join('') +
        // the lifted seedling with its roots, on its way to a cup of its own
        R.roots(56, 54, 14, 5, { seed: 3, spread: 0.6 }) + R.sprout(56, 54, 20, { pairs: 1, s: 1 }) + R.arrow(46, 30, 84, 40, 12) +
        R.cup(94, 104, 34, 46, { roots: true }) + R.sprout(94, ys + 1, 12, { pairs: 1, s: 1 }), 'Сеянец пересаживают в свой стакан, заглубляя до семядолей');
    },
    6: () => {
      let g = `<rect x="10" y="96" width="100" height="9" rx="3" fill="${Fp('plastic-hi')}"/><rect x="13" y="96" width="94" height="4" rx="1.5" fill="${Fp('water-c')}"/>`;
      [28, 60, 92].forEach((x, i) => { const ys = R.cupSoil(98, 38); g += R.cup(x, 98, 26, 38) + young(x, ys, 30 + i * 2, 2, { s: 1.15, lean: 3 }); });
      g += `<path d="M24 24A12 6 0 1 0 40 20" class="ill-arrow"/><path class="ill-arrow-head" d="M40 20l-6 -3l1 6z"/>`;
      return stepP(g, 'Стаканы с рассадой в поддоне с водой: полив снизу');
    },
    7: () => {
      const ys = R.cupSoil(104, 40);
      return stepP(R.cup(54, 104, 34, 40) + young(54, ys, 64, 4, { s: 1.35, cut: 2 }) + R.scissors(80, 30, 200, 0.9, 0.8), 'Верхушку прищипывают над третьей парой листьев');
    },
    8: () => {
      let g = R.sun(100, 20, 9) + R.tree(30, 98, 0.95) + `<ellipse cx="34" cy="100" rx="30" ry="5" fill="${Fp('dark')}" opacity=".18"/>`;
      [44, 66].forEach((x, i) => { const ys = R.cupSoil(100, 26); g += R.cup(x, 100, 18, 26, { paper: true }) + young(x, ys, 24 + i * 3, 2, { s: 0.95 }); });
      g += ill.label(112, 52, '1–2 ч', 'end');
      return stepP(g, 'Рассада на улице в тени дерева', 100);
    },
    9: () => {
      let g = R.bed(4, 116, 92, { mulch: true });
      [30, 88].forEach((x, i) => { g += young(x, 93, 48 + i * 4, 3, { s: 1.15 }); });
      g += R.dim(30, 88, 22, '25–30 см');
      return stepP(g, 'Рассада на грядке через 25–30 см, полита и замульчирована', 94);
    }
  };
  illustrate('sow', n => (SOW[n] || SOW[1])(), Object.keys(SOW));

  /* ---------- the pot from the shop ---------- */
  const SHOP = {
    hero: () => {
      // one crowded pot → three roomy ones
      let g = R.shopPot(66, 136, 76, 50) + R.crowd(66, 86, 66, 18, { h: 58, pale: true, seed: 4 });
      g += R.arrow(126, 92, 182, 92, 16) + ill.label(154, 64, 'разделить');
      [222, 276, 330].forEach((x, i) => { g += ill.pot(x, 112, 44, 26) + R.crowd(x, 105, 20, 4, { h: 46, seed: 7 + i }); });
      return ill.svg(360, 150, paperP(360, 150) + `<path d="M0 136H360V136Q360 150 346 150H14Q0 150 0 136Z" fill="${Fp('bg-2')}"/>` + g, 'Магазинный горшок с десятками сеянцев делят на три-четыре горшка');
    },
    1: () => {
      const inner = ill.leaf({ x: 6, y: 34, a: 6, s: 0.62, under: true, aphids: 6, seed: 5 });
      return stepP(R.shopPot(42, 104, 54, 36) + R.crowd(42, 68, 46, 12, { h: 40, seed: 3 }) + R.lens(88, 46, 24, inner, 130), 'Под лупой — нижняя сторона листа с тлёй');
    },
    2: () => stepP([22, 60, 98].map(x => ill.pot(x, 82, 32, 22, { wet: true })).join('') + [22, 60, 98].map(x => R.drop(x, 112, 0.7)).join(''), 'Три горшка с влажным грунтом: лишняя вода уходит через отверстия'),
    3: () => {
      let g = R.rootball(56, 100, 84, 40, { split: 3, seed: 6 });
      [24, 56, 88].forEach((x, i) => { g += R.crowd(x, 62 + (i % 2 ? 3 : -2), 18, 4, { h: 34, seed: 9 + i }); });
      g += R.knife(76, 22, 120, 0.7);
      return stepP(g, 'Ком корней разломан на три части');
    },
    4: () => {
      let g = `<ellipse cx="50" cy="104" rx="34" ry="5" fill="${Fp('plastic-hi')}"/><ellipse cx="50" cy="103" rx="28" ry="3" fill="${Fp('water-c')}"/>` + ill.pot(50, 76, 46, 26, { wet: true }) + R.crowd(50, 70, 20, 4, { h: 40, seed: 5 });
      g += R.can(98, 46, 0.6, { dir: -1, stream: 18 });
      return stepP(g, 'Посаженный куст полит до стока воды в поддон', 106);
    },
    5: () => {
      let g = R.window(56, 84, 84, 70, { curtain: true, sun: true });
      g += ill.pot(42, 84, 26, 16) + R.crowd(42, 78, 12, 3, { h: 30, seed: 4 }) + R.thermo(106, 100, 40, 0.55) + ill.label(114, 114, '20–24 °C', 'end');
      return stepP(g, 'Горшок на окне за лёгкой занавеской, в полутени', 92);
    },
    6: () => stepP(ill.pot(46, 82, 40, 24) + young(46, 75, 60, 3, { s: 1.3, cut: 1 }) + R.scissors(72, 22, 200, 0.85, 0.8) + R.bowl(96, 104, 34) + ill.leaf({ x: 96, y: 86, a: 70, s: 0.16, seed: 4 }) + ill.leaf({ x: 92, y: 88, a: -50, s: 0.14, seed: 5 }), 'Верхушки срезают над второй-третьей парой листьев'),
    7: () => {
      let g = R.bottle(24, 102, 22, 54, { fill: 'box' }) + `<path d="M44 74h22l-3 22h-16z" fill="${Fp('glass')}" stroke="${Fp('glass-d')}" stroke-width="1"/><path d="M45.6 85h18.8l-1.5 11h-15.8z" fill="${Fp('box')}" opacity=".85"/>`;
      g += ill.pot(92, 80, 40, 24) + R.crowd(92, 73, 18, 4, { h: 40, seed: 8 }) + ill.label(56, 114, '½ дозы');
      return stepP(g, 'Половинная доза удобрения в мерном колпачке');
    }
  };
  illustrate('shop', n => (SHOP[n] || SHOP[1])(), Object.keys(SHOP));

  /* ---------- places ---------- */
  const W = 320, H = 150;
  const placeP = (body, label, ground = 132) => ill.svg(W, H, paperP(W, H) + `<path d="M0 ${ground}H${W}V${H - 14}Q${W} ${H} ${W - 14} ${H}H14Q0 ${H} 0 ${H - 14}Z" fill="${Fp('bg-2')}"/>` + body, label);
  const basilBush = (x, y, h = 60, o = {}) => ill.bush(Object.assign({ x, y, h, nodes: 3, leaf: 0.3, spread: 0.9, seed: 4 }, o));
  const tomato = (x, y, h = 110) => {
    let g = `<path d="M${x + 8} ${y}V${y - h}" stroke="${Fp('wood')}" stroke-width="3"/><path d="M${x} ${y}Q${x + 6} ${y - h * 0.35} ${x - 2} ${y - h * 0.6}T${x + 4} ${y - h}" stroke="${Fp('stem')}" stroke-width="3" fill="none"/>`;
    [0.25, 0.45, 0.65, 0.85].forEach((t, i) => { const yy = y - h * t, sd = i % 2 ? 1 : -1; g += ill.leaf({ x: x + 1, y: yy, a: sd * 70, s: 0.32, tone: 'deep', wide: 0.75, seed: 3 + i, petiole: 6 }); if (i < 3) g += [0, 1, 2].map(k => `<circle cx="${qp(x - sd * (8 + k * 6))}" cy="${qp(yy + 10 + (k % 2) * 4)}" r="${4.2 - k * 0.5}" fill="${Fp(i === 2 ? 'lime' : 'tomato')}"/>`).join(''); });
    return g;
  };
  const PLACE = {
    sill: () => placeP(R.window(150, 102, 170, 92, { sun: true, rays: true, radiator: true }) + ill.pot(118, 102, 40, 26) + basilBush(118, 96, 56) + ill.pot(178, 102, 34, 22) + ill.ballBush({ x: 178, y: 96, r: 26, n: 46, leaf: 0.14, tone: 'deep', seed: 3 }) + R.lamp(270, 34, 60, { reach: 50 }) + ill.label(270, 112, 'досветка'), 'Подоконник: южное окно, батарея под ним, зимой лампа', 148),
    balcony: () => {
      let g = R.sun(282, 26, 12) + R.balcony(20, 300, 128, { box: [60, 200] });
      [84, 130, 176].forEach((x, i) => { g += basilBush(x, 64, 48, { leaf: 0.26, seed: 5 + i }); });
      g += ill.pot(250, 126, 46, 30) + basilBush(250, 120, 58, { seed: 9 }) + [0, 1, 2].map(i => `<path d="M${14 + i * 6} ${40 + i * 12}q20 -6 40 0" stroke="${Fp('glass-d')}" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>`).join('');
      return placeP(g, 'Балкон: ящик с кустами на перилах и ветер', 132);
    },
    garden: () => {
      let g = R.sun(290, 26, 13) + R.bed(14, 306, 122, { mulch: true, depth: 20 });
      [80, 160, 240].forEach((x, i) => { g += basilBush(x, 123, 70, { leaf: 0.34, seed: 3 + i }); });
      g += R.dim(80, 160, 26, '25–30 см');
      return placeP(g, 'Грядка: кусты через 25–30 см, мульча', 122);
    },
    greenhouse: () => {
      let g = R.greenhouse(160, 132, 270, 124, { vent: true }) + tomato(80, 132, 100) + tomato(240, 132, 104);
      [130, 190].forEach((x, i) => { g += basilBush(x, 132, 54, { seed: 6 + i }); });
      g += R.sun(296, 22, 10);
      return placeP(g, 'Теплица: базилик между томатами, форточка открыта', 132);
    },
    hydro: () => {
      let g = R.lamp(160, 18, 200, { reach: 80 }) + R.tank(160, 136, 180, 50, { pots: [-0.6, 0, 0.6] });
      [-0.6, 0, 0.6].forEach((k, i) => { g += basilBush(160 + k * 90, 82, 50, { leaf: 0.27, seed: 4 + i }); });
      return placeP(g, 'Гидропоника: корни в растворе, сверху лампа', 136);
    }
  };
  illustrate('place', id => (PLACE[id] || PLACE.sill)(), Object.keys(PLACE));

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
