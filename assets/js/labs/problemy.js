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
  const ill = (() => {
    const q = v => Math.round(v * 10) / 10;
    const F = n => `var(--ill-${n})`;
    let uid = 0;
    const id = p => `ill-${p}${++uid}`;
    const HW = s => (s <= 0 || s >= 1 ? 0 : 78.7 * Math.pow(s, 0.55) * Math.pow(1 - s, 0.9));
    const Ys = s => -4 - s * 100;
    const inside = (rnd, a = 0.12, b = 0.9, k = 0.78) => { const s = a + rnd() * (b - a); return [(rnd() * 2 - 1) * HW(s) * k, Ys(s), s]; };
    const mix = (a, b, t) => `color-mix(in srgb, ${F(a)} ${Math.round(t * 100)}%, ${F(b)})`;

    function outline(o) {
      const n = 30, R = [], L = [], w = o.wide || 1, curl = o.curl || 0;
      for (let i = 0; i <= n; i++) {
        const s = 0.015 + 0.985 * i / n, hw = HW(s) * w;
        R.push([hw * (1 - curl * 0.55), Ys(s)]);
        L.push([-hw, Ys(s)]);
      }
      return micro.smooth(R.concat(L.reverse()));
    }
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
       mold, curl, wide, aphids, mites, web, whitefly, thrips, pale */
    function leaf(o = {}) {
      const rnd = micro.rng(o.seed || 3), k = o.k == null ? 1 : o.k;
      const out = outline(o), cid = id('c'), gid = id('g');
      const green = o.under ? 'under' : 'leaf';
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
      const vc = o.under ? 'under-vein' : o.purple ? 'purple' : 'vein';
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
      let edge = `<path d="${out}" fill="none" stroke="${F(o.under ? 'leaf' : 'leaf-d')}" stroke-width="1.1" opacity=".8"/>`;
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
      const pet = `<path d="M0 -3V${o.petiole == null ? 16 : o.petiole}" stroke="${F(o.purple ? 'purple' : 'stem')}" stroke-width="2.6" stroke-linecap="round"/>`;
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

    /* a basil plant standing on (x, y). o: h, nodes, droop, lean, leggy, bolt, leaf(i, n, side) → leaf options */
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
      if (o.bolt) {
        // flower spike: whorls of small two-lipped flowers
        const top = [pts[n - 1][0], -H];
        g += `<path d="M${q(top[0])} ${q(top[1])}q2 -30 1 -62" stroke="${F('stem')}" stroke-width="2.6" fill="none"/>`;
        for (let i = 0; i < 6; i++) {
          const fy = top[1] - 10 - i * 10, fx = top[0] + 1 + i * 0.2, r = 1 - i * 0.1;
          [-1, 1].forEach(sd => { g += `<path d="M${q(fx)} ${q(fy)}q${q(sd * 6 * r)} -1 ${q(sd * 8 * r)} -6q${q(-sd * 3)} 4 ${q(-sd * 8 * r)} 6Z" fill="${F('flower')}" stroke="${F('flower-d')}" stroke-width=".6"/>`; });
          g += `<ellipse cx="${q(fx)}" cy="${q(fy + 2)}" rx="${q(5 * r)}" ry="2" fill="${F('stem')}" opacity=".7"/>`;
        }
      }
      g += `<path d="${stem}" stroke="${F(o.stemColor || 'stem')}" stroke-width="${o.leggy ? 2.6 : 3.6}" fill="none" stroke-linecap="round"/>`;
      pts.forEach(([px, py], i) => {
        const size = (o.leggy ? 0.36 : 0.62 - i * 0.09) * (o.leafScale || 1);
        [-1, 1].forEach(side => {
          const extra = o.leaf ? o.leaf(i, n, side) || {} : {};
          const droop = dr * (1 - i * 0.08);
          const a = side * (58 - i * 6 + droop * 100 + (rnd() - 0.5) * 8);
          g += leaf(Object.assign({ x: px, y: py, a, s: size, seed: 11 + i * 3 + (side > 0 ? 1 : 0), petiole: 12 }, dr > 0.4 ? { wide: 0.82 } : {}, extra));
        });
      });
      // the growing tip
      const [tx, ty] = pts[n - 1];
      if (!o.bolt) [-1, 1].forEach(side => { g += leaf(Object.assign({ x: tx, y: ty, a: side * 24 + dr * 110, s: 0.2, seed: 40 + side, petiole: 4 }, o.leaf ? o.leaf(n, n, side) || {} : {})); });
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
    return { F, q, rng: micro.rng, HW, Ys, leaf, plant, pot, seedling, aphid, mite, whitefly, thrips, web, label, scale, svg, mix };
  })();

  /* @use micro, ills */
  /* Illustrations of the Problems chapter: every symptom of the diagnostics, and each disease and pest
     twice — as you see it on the plant and under a lens. Pages ask for them with data-ill="sym:<id>",
     "dis:<n>-plant|zoom", "pest:<n>-plant|zoom". */
  const I = ill, Fi = I.F, qi = I.q;
  const W0 = 160, H0 = 140;
  const bg = (w = W0, hh = H0) => `<rect width="${w}" height="${hh}" rx="14" fill="${Fi('bg')}"/>`;
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
    const w = 240, hh = 196;
    const sec = micro.section(w, { top: 14, epi: 14, pal: [30], spo: 40, lo: 12, veins: [], stomata: [70, 170], seed: 21 });
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
    s += I.scale(w - 10, 18, 44, '50 мкм');
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
    s += I.scale(w - 10, 20, 44, '50 мкм');
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
    s += I.scale(w - 10, 20, 44, '5 мкм');
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
    s += I.label(190, 22, 'крылатая') + I.label(176, 146, 'личинка') + I.scale(58, 20, 44, '1 мм');
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
    s += I.label(194, 140, 'личинки') + I.scale(58, 20, 44, '1 мм');
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
