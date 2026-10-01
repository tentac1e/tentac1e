/* Гид по базилику — живые модели главы «Вкус и аромат». Файл собирает scripts/build.py из src/labs/vkus/ — правьте там */
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

  /* ---------------- food: small illustrations of what basil goes with ----------------
     Every picture lives in a 64×64 box; colours are the --fd-* tokens. food.icon(id) — a ready <svg>,
     food.g(id) — the same drawing to put inside another SVG. */
  const food = (() => {
    const F = n => `var(--fd-${n})`;
    const hi = (cx, cy, rx, ry, a = -30, o = 0.4) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${F('hi')}" opacity="${o}" transform="rotate(${a} ${cx} ${cy})"/>`;
    const leaf = (cx, cy, s, a, c = 'leaf', vein = 'leaf-d') => `<g transform="translate(${cx} ${cy}) rotate(${a}) scale(${s})"><path d="M0 -14C9 -9 9 9 0 14C-9 9 -9 -9 0 -14Z" fill="${F(c)}"/><path d="M0 -12V12M0 -4L5 -8M0 2L-5 -3M0 7L4 4" stroke="${F(vein)}" stroke-width="1.1" fill="none" opacity=".6"/></g>`;
    const dots = (list, r, c) => list.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.35}" fill="${F(c)}"/>`).join('');
    const ART = {
      tomato: () =>
        `<ellipse cx="32" cy="38" rx="23" ry="19.5" fill="${F('tomato')}"/>` +
        `<path d="M10 40C14 54 50 54 54 40C50 58 14 58 10 40Z" fill="${F('tomato-d')}" opacity=".45"/>` +
        `<path d="M23 22C19 32 21 48 29 57M41 22C45 32 43 48 35 57" stroke="${F('tomato-d')}" stroke-width="1.4" fill="none" opacity=".35"/>` +
        hi(22, 30, 6.5, 3.4) +
        `<path d="M32 20L22 17L28 22L19 26L30 24.5L31 31L33.5 24.5L44 26L36 22L41 17Z" fill="${F('leaf')}"/>` +
        `<path d="M32 20Q33 13 38 10" stroke="${F('leaf-d')}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      strawberry: () =>
        `<path d="M32 58C18 50 10 37 13 27C16 19 26 18 32 22C38 18 48 19 51 27C54 37 46 50 32 58Z" fill="${F('straw')}"/>` +
        `<path d="M32 58C46 50 54 37 51 27C50 39 44 50 32 58Z" fill="${F('straw-d')}" opacity=".45"/>` +
        dots([[22, 31], [32, 29], [42, 31], [18, 39], [27, 38], [37, 38], [46, 39], [23, 46], [32, 46], [41, 46], [28, 53], [36, 53]], 1.1, 'seed') +
        hi(21, 32, 5, 2.8) +
        `<path d="M32 23L20 19L27 17L22 11L30 15L32 7L34 15L42 11L37 17L44 19Z" fill="${F('leaf')}"/>`,
      lemon: () =>
        `<path d="M9 35C11 23 22 15 34 16C46 17 55 25 57 34C55 45 44 53 32 53C20 53 11 46 9 35Z" fill="${F('lemon')}"/>` +
        `<path d="M6 35C7 33 9 33 10 35C9 37 7 37 6 35ZM57 34C58 32 60 32 61 34C60 36 58 36 57 34Z" fill="${F('lemon')}"/>` +
        `<path d="M11 40C16 50 44 55 55 40C50 51 38 55 30 54C20 53 13 48 11 40Z" fill="${F('lemon-d')}" opacity=".45"/>` +
        hi(24, 26, 7, 3) +
        dots([[36, 30], [42, 36], [30, 42], [46, 44], [22, 38]], 0.5, 'lemon-d') +
        `<path d="M40 17C44 9 52 7 58 9C55 15 48 19 40 17Z" fill="${F('leaf')}"/><path d="M41 16Q49 12 56 10" stroke="${F('leaf-d')}" stroke-width="1" fill="none" opacity=".6"/>`,
      peach: () =>
        `<circle cx="32" cy="37" r="21" fill="${F('peach')}"/>` +
        `<circle cx="39" cy="42" r="15" fill="${F('peach-b')}" opacity=".55"/>` +
        `<path d="M31 17C25 27 25 45 31 58" stroke="${F('peach-b')}" stroke-width="2" fill="none" opacity=".7"/>` +
        hi(22, 29, 5.5, 3) + leaf(40, 13, 0.62, 58),
      coriander: () =>
        [[19, 42, 6.5], [32, 46, 7], [45, 42, 6.5], [25, 55, 6], [39, 55, 6]].map(([x, y, r]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${F('cori')}"/><path d="M${x - r * 0.45} ${y - r * 0.85}Q${x - r * 0.75} ${y} ${x - r * 0.45} ${y + r * 0.85}M${x} ${y - r}V${y + r}M${x + r * 0.45} ${y - r * 0.85}Q${x + r * 0.75} ${y} ${x + r * 0.45} ${y + r * 0.85}" stroke="${F('cori-d')}" stroke-width=".9" fill="none" opacity=".7"/>` + hi(x - r * 0.35, y - r * 0.45, r * 0.3, r * 0.18, -30, 0.5)).join('') +
        `<path d="M32 36V26" stroke="${F('leaf-d')}" stroke-width="2"/>` +
        [[24, 20, 7], [32, 14, 7.5], [40, 20, 7], [32, 24, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${F('leaf')}"/>`).join('') +
        `<path d="M32 26L24 20M32 26L32 14M32 26L40 20" stroke="${F('leaf-d')}" stroke-width="1" opacity=".6"/>`,
      fennel: () =>
        [[22, 7], [32, 5], [42, 7]].map(([x, y]) => `<path d="M32 28L${x} ${y}" stroke="${F('fennel-g')}" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="M${x - 5} ${y + 1}L${x} ${y + 5}L${x + 5} ${y + 1}M${x - 4} ${y + 6}L${x} ${y + 9}L${x + 4} ${y + 6}" stroke="${F('fennel-g')}" stroke-width="1.2" fill="none"/>`).join('') +
        `<path d="M17 49C12 38 19 28 27 26H37C45 28 52 38 47 49C41 57 23 57 17 49Z" fill="${F('fennel')}"/>` +
        `<path d="M26 27C20 36 20 48 26 55M38 27C44 36 44 48 38 55M32 26V56" stroke="${F('fennel-d')}" stroke-width="1.6" fill="none"/>` +
        hi(24, 38, 3, 7, 10, 0.55),
      clove: () =>
        `<path d="M10 54C8 37 25 17 46 11C47 30 32 51 10 54Z" fill="${F('bay')}"/><path d="M11 53Q27 34 45 12" stroke="${F('leaf-d')}" stroke-width="1.3" fill="none" opacity=".6"/>` +
        [[46, 40, 20], [53, 51, -10]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 -2L1.8 13H-1.8Z" fill="${F('clove')}"/><circle cx="-3" cy="-4" r="2.6" fill="${F('clove')}"/><circle cx="3" cy="-4" r="2.6" fill="${F('clove')}"/><circle cx="0" cy="-8" r="2.6" fill="${F('clove')}"/><circle cx="0" cy="-3" r="2.2" fill="${F('clove')}"/></g>`).join(''),
      pepper: () =>
        [[22, 30, 7.5], [37, 25, 7], [46, 39, 7.5], [29, 44, 8], [42, 54, 6.5], [18, 52, 6]].map(([x, y, r]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${F('pepper')}"/><path d="M${x - r * 0.5} ${y - r * 0.2}q${r * 0.3} ${-r * 0.4} ${r * 0.6} 0M${x - r * 0.1} ${y + r * 0.35}q${r * 0.35} ${-r * 0.3} ${r * 0.6} ${r * 0.05}" stroke="${F('pepper-hi')}" stroke-width="1" fill="none"/>` + hi(x - r * 0.35, y - r * 0.45, r * 0.3, r * 0.17, -30, 0.35)).join(''),
      rosemary: () => {
        let s = `<path d="M14 58C22 44 34 26 52 8" stroke="${F('stem')}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
        for (let i = 0; i < 12; i++) {
          const t = 0.08 + i * 0.075, x = 14 + 38 * t + 6 * Math.sin(t * 3), y = 58 - 50 * t;
          s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(-9 + (i % 2) * 2).toFixed(1)} -3M${x.toFixed(1)} ${y.toFixed(1)}l6 7" stroke="${F('rosemary')}" stroke-width="3" stroke-linecap="round"/>`;
        }
        return s;
      },
      mint: () => `<path d="M32 58V30" stroke="${F('mint-d')}" stroke-width="2.4"/>` + leaf(21, 40, 1.05, -48, 'mint', 'mint-d') + leaf(43, 40, 1.05, 48, 'mint', 'mint-d') + leaf(32, 19, 1.15, 0, 'mint', 'mint-d'),
      cocoa: () =>
        `<path d="M10 16H54V50L46 54L40 49L33 55L10 55Z" fill="${F('choc')}"/>` +
        [0, 1, 2].map(c => [0, 1].map(r => `<rect x="${13 + c * 14}" y="${19 + r * 16}" width="11" height="13" rx="2" fill="${F('choc-hi')}" opacity="${r && c === 2 ? 0.55 : 1}"/><path d="M${14 + c * 14} ${31 + r * 16}V${20 + r * 16}H${23 + c * 14}" stroke="${F('hi')}" stroke-width="1" fill="none" opacity=".18"/>`).join('')).join(''),
      olive: () =>
        `<path d="M28 7C36 21 44 29 44 40C44 50 37 57 28 57C19 57 12 50 12 40C12 29 20 21 28 7Z" fill="${F('oil')}"/>` +
        `<path d="M44 40C44 50 37 57 28 57C35 53 40 47 40 38Z" fill="${F('oil-d')}" opacity=".5"/>` + hi(21, 36, 3.5, 7, 15, 0.5) +
        `<ellipse cx="49" cy="47" rx="7" ry="9.5" fill="${F('olive')}" transform="rotate(25 49 47)"/>` + hi(47, 43, 1.8, 3, 25, 0.45) + leaf(52, 30, 0.6, 30, 'bay'),
      cucumber: () =>
        `<path d="M22 12A22 22 0 0 0 58 34Z" fill="${F('melon')}" transform="rotate(8 40 23)"/>` +
        `<path d="M22 12A22 22 0 0 0 58 34" stroke="${F('rind')}" stroke-width="4.5" fill="none" transform="rotate(8 40 23)"/>` +
        dots([[38, 22], [44, 26], [36, 29]], 1, 'dark') +
        `<circle cx="22" cy="46" r="14" fill="${F('cuke-f')}" stroke="${F('cuke')}" stroke-width="3.5"/>` +
        [0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<ellipse cx="${(22 + Math.cos(a) * 5.5).toFixed(1)}" cy="${(46 + Math.sin(a) * 5.5).toFixed(1)}" rx="1.4" ry="2.2" fill="${F('fennel-d')}" transform="rotate(${i * 60 + 90} ${(22 + Math.cos(a) * 5.5).toFixed(1)} ${(46 + Math.sin(a) * 5.5).toFixed(1)})"/>`; }).join(''),
      mozzarella: () =>
        `<ellipse cx="32" cy="56" rx="24" ry="3.5" fill="${F('cheese-d')}" opacity=".6"/>` +
        `<circle cx="24" cy="38" r="15" fill="${F('cheese')}"/><path d="M11 42C14 54 34 56 38 44C34 53 16 53 11 42Z" fill="${F('cheese-d')}" opacity=".7"/>` + hi(18, 31, 5, 3, -30, 0.9) +
        `<circle cx="45" cy="44" r="11" fill="${F('cheese')}"/><path d="M35 47C38 56 52 56 55 47C51 54 39 54 35 47Z" fill="${F('cheese-d')}" opacity=".7"/>` + hi(41, 39, 3.6, 2.2, -30, 0.9) +
        leaf(44, 22, 0.75, 35),
      parmesan: () =>
        `<path d="M8 36L40 18L58 30L26 48Z" fill="${F('parm')}"/><path d="M8 36L26 48V57L8 45Z" fill="${F('parm-d')}"/><path d="M26 48L58 30V39L26 57Z" fill="${F('parm-d')}" opacity=".8"/>` +
        `<path d="M40 18L58 30V39" stroke="${F('rind-p')}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>` +
        dots([[24, 34], [33, 30], [30, 38], [40, 29], [18, 38]], 0.9, 'hi'),
      garlic: () =>
        `<path d="M32 9C34 16 46 22 50 34C54 48 44 56 32 56C20 56 10 48 14 34C18 22 30 16 32 9Z" fill="${F('garlic')}"/>` +
        `<path d="M32 12C26 22 22 40 26 55M32 12C38 22 42 40 38 55M32 12C18 24 14 42 20 53M32 12C46 24 50 42 44 53" stroke="${F('garlic-d')}" stroke-width="1.4" fill="none"/>` +
        `<path d="M22 44C24 50 28 53 30 54M42 44C40 50 36 53 34 54" stroke="${F('garlic-p')}" stroke-width="2" fill="none" opacity=".7"/>` +
        `<path d="M26 56l-3 5M30 57l-1 5M34 57l1 5M38 56l3 5" stroke="${F('garlic-d')}" stroke-width="1.2"/>` + hi(24, 30, 3, 6, 20, 0.7),
      chili: () =>
        `<path d="M8 38H46A19 19 0 0 1 8 38Z" fill="${F('coco')}"/><path d="M12 38H42A15 15 0 0 1 12 38Z" fill="${F('coco-f')}"/>` +
        `<ellipse cx="27" cy="38" rx="15" ry="3" fill="${F('coco-f')}" stroke="${F('coco')}" stroke-width="1.5"/>` +
        `<path d="M36 16C50 18 59 33 55 52C51 44 44 30 32 23Z" fill="${F('chili')}"/>` + hi(46, 26, 2, 6, -35, 0.5) +
        `<path d="M33 22C30 18 31 13 35 11" stroke="${F('leaf')}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
    };
    const has = id => !!ART[id];
    const g = id => (ART[id] ? ART[id]() : '');
    const icon = (id, cls = '') => `<svg class="fd ${cls}" viewBox="0 0 64 64" aria-hidden="true">${g(id)}</svg>`;
    // a basil leaf coloured like the variety
    const LEAF = { purple: 'purple', african: 'purple', thai: 'thai', lemon: 'lime', lime: 'lime' };
    // by a leaf colour of the catalogue (green, deep, purple, thai, lime) or by a chemotype id
    const basil = (variety, s = 1) => {
      const c = ['green', 'deep', 'purple', 'thai', 'lime'].includes(variety) ? variety : LEAF[variety] || 'green';
      return `<g transform="scale(${s})"><path d="M0 -4C22 -5 31 -24 30 -44C29 -66 13 -92 0 -104C-13 -92 -29 -66 -30 -44C-31 -24 -22 -5 0 -4Z" fill="var(--lf-${c})"/>` +
        `<path d="M0 -4C1 -40 1 -70 0 -100M0 -24Q12 -28 21 -41M0 -24Q-12 -28 -21 -41M0 -44Q11 -49 18 -62M0 -44Q-11 -49 -18 -62M0 -64Q8 -69 12 -80M0 -64Q-8 -69 -12 -80" stroke="var(--lf-${c}-vein)" stroke-width="2" fill="none" stroke-linecap="round"/>` +
        `<path d="M-4 -14C-19 -21 -24 -40 -21 -56C-18 -72 -9 -86 -2 -95C-7 -76 -10 -46 -4 -14Z" fill="var(--fd-hi)" opacity=".16"/><path d="M0 -4V10" stroke="var(--lf-${c}-vein)" stroke-width="3" stroke-linecap="round"/></g>`;
    };
    return { icon, g, has, basil };
  })();

  /* @use micro */
  const TR_INFO = {
    intro: ['Срез листа', 'Весь лист — около трети миллиметра. Сверху вниз: кутикула и эпидермис, столбчатая и губчатая ткани с хлоропластами, жилка, нижний эпидермис с устьицами. Аромат живёт снаружи — в железках на поверхности. Коснитесь любой части среза.', ''],
    epi: ['Эпидермис и кутикула', 'Один слой плоских прозрачных клеток без хлоропластов: свет проходит сквозь них вглубь листа. Сверху — кутикула, восковая плёнка, которая не выпускает воду. Из клеток эпидермиса вырастают все волоски и железки.', 'клетка — около 15–25 мкм в высоту, кутикула тоньше 3 мкм'],
    pal: ['Столбчатая ткань', 'Вытянутые клетки стоят плотным частоколом и набиты хлоропластами — здесь идёт большая часть фотосинтеза. Хлоропласты прижаты к стенкам, а на слишком ярком свету поворачиваются к нему ребром, чтобы не обгореть.', 'у листа на солнце — два слоя клеток, у листа в тени — один'],
    spo: ['Губчатая ткань', 'Рыхлые клетки неправильной формы, между ними — воздушные ходы. По ним углекислый газ от устьиц расходится по всему листу, а водяной пар уходит наружу. Хлоропластов меньше, поэтому нижняя сторона листа светлее верхней.', 'воздух занимает до трети объёма этого слоя'],
    vein: ['Жилка', 'Проводящий пучок в кольце клеток обкладки. Сверху — ксилема: мёртвые полые трубки с одревесневшими стенками (здесь они малиновые, как после окраски сафранином), по ним поднимается вода с ионами. Снизу — флоэма: живые ситовидные трубки, они уносят сахар из листа к корням, почкам и цветкам.', 'мелкая жилка — 60–80 мкм в поперечнике'],
    loepi: ['Нижний эпидермис', 'Такие же прозрачные клетки, но устьиц здесь больше, чем сверху. Железки тоже есть: нижняя сторона листа пахнет не хуже верхней.', ''],
    stoma: ['Устьице', 'Две замыкающие клетки и щель между ними. На свету клетки набирают воду, выгибаются, и щель открывается: внутрь идёт CO₂, наружу — пар. Над щелью — воздушная полость, от неё начинаются ходы губчатой ткани.', 'щель — несколько микрометров, на миллиметре листа их сотни'],
    pel: ['Пельтатная железка', 'Главное хранилище аромата. Четыре клетки головки выделяют эфирное масло в пространство под кутикулой, и она раздувается блестящим пузырём. В таких пузырях — почти весь линалоол, эвгенол и эстрагол листа. Пузырь лопается от лёгкого касания: поэтому потёртый лист пахнет сильнее.', 'пузырь — 60–90 мкм, под лупой виден как золотистая точка'],
    cap: ['Головчатая железка', 'Маленькая: ножка из одной-двух клеток и круглая головка. Выделяет понемногу масла и слизи, быстро опустошается и почти не добавляет аромата — главные здесь пельтатные.', 'около 20–30 мкм'],
    hair: ['Кроющий волосок', 'Несколько клеток в ряд, без масла, с бугорчатой оболочкой. Волоски рассеивают резкий свет, держат у поверхности слой влажного воздуха и мешают мелким насекомым.', 'до 100–200 мкм в длину']
  };
  register('trichome', el => {
    el.innerHTML = h.head('Лист под микроскопом', 'Поперечный срез листа базилика. Коснитесь любой ткани или железки, чтобы узнать, что она делает. «Потереть лист» — и пузыри масла лопнут.') +
      `<div class="lab-controls tr-controls">
         ${h.segHtml('lab-tr-light', 'Лист вырос', [['sun', 'на солнце'], ['shade', 'в тени']], 'sun')}
         <div class="lab-actions"><button class="btn btn-primary btn-small" type="button" id="lab-tr-rub">${h.icon('nose')}Потереть лист</button><button class="btn btn-ghost btn-small" type="button" id="lab-tr-reset">Заново</button></div>
       </div>
       <div class="tr-wrap"><div class="lab-chart tr-chart" id="lab-tr-ch"></div><div class="aroma-layer" id="lab-tr-aroma" aria-hidden="true"></div></div>
       <p class="lab-foot tr-light-note" id="lab-tr-note"></p>
       <div class="tr-info" id="lab-tr-info" aria-live="polite"></div>
       <div class="lab-grid tr-grid">
         <div class="lab-controls">${h.rangeHtml('lab-tr-age', 'Лист', 0, 100, 1, 20)}<p class="lab-foot">Вид сверху на один и тот же участок. Железки закладываются, пока лист крошечный; потом лист растягивается, а их число почти не меняется — на каждом квадратном миллиметре их становится меньше.</p></div>
         <div class="tr-top"><svg id="lab-tr-top" viewBox="0 0 200 200" role="img" aria-label="Вид сверху на участок листа с железками"></svg><p class="tick" id="lab-tr-cap"></p></div>
       </div>`;
    let light = 'sun', sel = null;
    const burst = new Set();
    const glands = [];
    const layer = $('#lab-tr-aroma', el);
    const ch = h.chart($('#lab-tr-ch', el), {
      label: 'Поперечный срез листа базилика с железками, жилкой и устьицами',
      // on a wide screen the section is drawn 1.3× larger: the same cells, easier to see
      h: w => (w < 520 ? 420 : 430 * 1.3),
      draw(W, HH) {
        const k = W < 520 ? 1 : 1.3, w = W / k, H = HH / k;
        const sun = light === 'sun';
        const TOP = 112;
        const pal = sun ? [44, 42] : [54];
        const spo = sun ? 100 : 84;
        const narrow = w < 520;
        const veinX = Math.round(w * (narrow ? 0.66 : 0.6));
        const stomata = narrow ? [Math.round(w * 0.3)] : [Math.round(w * 0.3), Math.round(w * 0.84)];
        const sec = micro.section(w, { top: TOP, epi: 22, pal, spo, lo: 17, veins: [veinX], stomata, seed: sun ? 11 : 12 });
        const y = sec.y, rnd = micro.rng(5);
        let s = `<defs><radialGradient id="mic-oil-grad" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="var(--mic-oil-hi)"/><stop offset=".45" stop-color="var(--mic-oil)"/><stop offset="1" stop-color="var(--mic-oil-deep)"/></radialGradient>
          <linearGradient id="lab-tr-air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mic-air)"/><stop offset="1" stop-color="var(--mic-air-2)"/></linearGradient></defs>`;
        s += `<rect x="0" y="0" width="${w}" height="${H}" fill="url(#lab-tr-air)"/>`;
        s += sec.svg;
        // glands on the upper side: where they stand depends on the width
        const up = narrow
          ? [['pel', 0.2], ['cap', 0.45], ['pel', 0.72], ['hair', 0.93]]
          : [['pel', 0.12], ['hair', 0.25], ['cap', 0.36], ['pel', 0.5], ['cap', 0.66], ['pel', 0.8], ['hair', 0.93]];
        const fill = sun ? 1 : 0.62;
        glands.length = 0;
        const items = [];
        let pi = 0;
        up.forEach(([k, f]) => {
          const x = Math.round(w * f);
          const d = k === 'pel' ? micro.peltate(x, y.cut, { fill, rnd, r: narrow ? 22 : 25 }) : k === 'cap' ? micro.capitate(x, y.cut, { rnd }) : micro.hair(x, y.cut, { rnd, len: 66, bend: 18 });
          const id = k === 'pel' ? pi++ : null;
          const state = id !== null && burst.has(id) ? ' is-burst is-done' : '';
          s += `<g class="mic-t tr-gl tr-${k}${state}" data-t="${k}"${id !== null ? ` data-i="${id}" tabindex="0" role="button" aria-label="Пельтатная железка: нажмите, чтобы она лопнула"` : ''}>${d.g}</g>`;
          if (id !== null) glands.push(id);
          items.push({ k, x: d.tx == null ? x : d.tx, top: d.top });
        });
        // one gland of each kind underneath too
        const lp = micro.peltate(Math.round(w * (narrow ? 0.5 : 0.56)), y.bot, { up: -1, fill: fill * 0.55, rnd, r: 18 });
        const lc = micro.capitate(Math.round(w * (narrow ? 0.12 : 0.18)), y.bot, { up: -1, rnd });
        const lid = pi++;
        s += `<g class="mic-t tr-gl tr-pel${burst.has(lid) ? ' is-burst is-done' : ''}" data-t="pel" data-i="${lid}">${lp.g}</g><g class="mic-t tr-gl tr-cap" data-t="cap">${lc.g}</g>`;
        glands.push(lid);
        // captions: glands above, tissues on pills at the left edge
        const names = { pel: 'пельтатная железка', cap: 'головчатая', hair: 'волосок' };
        const seen = {};
        const top = items.filter(it => { if (seen[it.k]) return false; seen[it.k] = 1; return true; })
          .map(it => ({ x: it.x, text: it.k === 'pel' ? 'масло под кутикулой' : names[it.k], to: [it.x, it.top - 3], t: it.k }));
        s += micro.labels(top, w, [18, 40]);
        const band = (yy, text, t) => micro.pill(6, yy, text, { t });
        s += band(y.epi + 11, 'эпидермис', 'epi');
        s += band(y.pal + (y.spo - y.pal) / 2, 'столбчатая ткань', 'pal');
        s += band(y.spo + spo * 0.62, 'губчатая ткань', 'spo');
        const vy = y.spo + Math.min(40, spo * 0.42);
        s += micro.labels([{ x: veinX + 72, text: 'жилка', to: [veinX + 42, vy], t: 'vein' }], w, [vy]);
        s += micro.labels([{ x: stomata[0], text: 'устьице', to: [stomata[0], y.bot + 2], t: 'stoma' }], w, [y.bot + 34]);
        s += micro.scale(w - 12, H - 14, 60, '50 мкм');
        return `<g class="tr-scene${sel ? ' has-sel' : ''}"${k !== 1 ? ` transform="scale(${k})"` : ''}>${s}</g>`;
      }
    });
    ch.svg.classList.add('tr-svg');
    const info = () => {
      const [t, text, size] = TR_INFO[sel || 'intro'];
      $('#lab-tr-info', el).innerHTML = `<p class="lab-kicker">${sel ? 'Что это' : 'Как читать срез'}</p><h5>${t}</h5><p>${h.nb(text)}</p>${size ? `<p class="tr-size">${h.nb(size)}</p>` : ''}`;
    };
    const mark = () => {
      const scene = $('.tr-scene', ch.svg);
      if (!scene) return;
      scene.classList.toggle('has-sel', !!sel);
      $$('.mic-t', scene).forEach(g => g.classList.toggle('is-sel', g.dataset.t === sel));
      $$('.mic-label', scene).forEach(g => g.classList.toggle('is-sel', g.dataset.for === sel));
    };
    const pop = g => {
      const i = +g.dataset.i;
      if (burst.has(i)) return;
      burst.add(i);
      g.classList.add('is-burst');
      const r = g.getBoundingClientRect();
      S.aroma(layer, r.left + r.width / 2, r.top + r.height * 0.25);
      if (window.BasilHaptics) window.BasilHaptics.impact();
    };
    ch.svg.addEventListener('click', e => {
      const g = e.target.closest('.mic-t');
      if (!g) { sel = null; mark(); info(); return; }
      if (g.dataset.t === 'pel') pop(g);
      sel = sel === g.dataset.t && g.dataset.t !== 'pel' ? null : g.dataset.t;
      mark();
      info();
    });
    ch.svg.addEventListener('keydown', e => {
      const g = e.target.closest && e.target.closest('.tr-pel');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sel = 'pel'; pop(g); mark(); info(); }
    });
    const redraw = () => { ch.redraw(); mark(); };
    $('#lab-tr-rub', el).addEventListener('click', () => {
      const all = $$('.tr-pel', ch.svg).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      all.forEach((g, i) => setTimeout(() => pop(g), 120 + i * 170));
    });
    $('#lab-tr-reset', el).addEventListener('click', () => { burst.clear(); redraw(); });
    const note = () => set(el, 'lab-tr-note', light === 'sun'
      ? 'Лист на солнце толще: два слоя столбчатой ткани, пузыри железок полны масла.'
      : 'Лист в тени тоньше: один слой столбчатой ткани, масла в железках меньше — и аромат слабее.');
    h.bindPick(el, 'lab-tr-light', v => { light = v; burst.clear(); redraw(); note(); age(ageV); });

    /* top view: jigsaw epidermis, glands as golden dots, stomata */
    const topSvg = $('#lab-tr-top', el);
    let ageV = 20;
    function age(a) {
      ageV = a;
      const k = 1 + a / 100 * 3;             // leaf has stretched k times
      const rnd = micro.rng(3);
      const cellPx = 17 * Math.sqrt(k);      // cells grow, but also still divide early on
      const cols = Math.ceil(200 / cellPx) + 2;
      const P = [];
      for (let r = 0; r <= cols; r++) for (let c = 0; c <= cols; c++) P.push([c * cellPx - cellPx + (rnd() - 0.5) * cellPx * 0.5, r * cellPx - cellPx + (rnd() - 0.5) * cellPx * 0.5]);
      const at = (c, r) => P[r * (cols + 1) + c];
      const wav = (a1, b1) => { const mx = (a1[0] + b1[0]) / 2, my = (a1[1] + b1[1]) / 2, dx = b1[0] - a1[0], dy = b1[1] - a1[1], n = (rnd() - 0.5) * 0.5; return `M${r1(a1[0])} ${r1(a1[1])}Q${r1(mx - dy * n)} ${r1(my + dx * n)} ${r1(mx)} ${r1(my)}T${r1(b1[0])} ${r1(b1[1])}`; };
      let walls = '';
      for (let r = 0; r < cols; r++) for (let c = 0; c < cols; c++) { walls += wav(at(c, r), at(c + 1, r)) + wav(at(c, r), at(c, r + 1)); }
      let t = `<defs><radialGradient id="lab-tr-dot" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="var(--mic-oil-hi)"/><stop offset=".5" stop-color="var(--mic-oil)"/><stop offset="1" stop-color="var(--mic-oil-deep)"/></radialGradient><clipPath id="lab-tr-clip"><rect width="200" height="200" rx="16"/></clipPath></defs>`;
      t += `<g clip-path="url(#lab-tr-clip)"><rect class="tr-surf" width="200" height="200"/><path class="tr-wall" d="${walls}"/>`;
      // stomata on the upper side are few; glands thin out as the leaf stretches
      const sunK = light === 'sun' ? 1 : 0.7;
      const n = Math.max(2, Math.round(26 * sunK / (k * k) * 3.2));
      const nCap = Math.max(1, Math.round(n * 0.8));
      const place = [];
      const spot = () => { for (let tries = 0; tries < 40; tries++) { const x = 12 + rnd() * 176, y = 12 + rnd() * 176; if (place.every(([px, py]) => Math.hypot(px - x, py - y) > 16)) { place.push([x, y]); return [x, y]; } } return [12 + rnd() * 176, 12 + rnd() * 176]; };
      for (let i = 0; i < 3; i++) { const [x, y] = spot(); t += `<g class="tr-sto" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rnd() * 180)})"><ellipse cx="-2.6" rx="2.6" ry="5.4"/><ellipse cx="2.6" rx="2.6" ry="5.4"/><path d="M0 -3.6V3.6"/></g>`; }
      for (let i = 0; i < nCap; i++) { const [x, y] = spot(); t += `<circle class="tr-capdot" cx="${r1(x)}" cy="${r1(y)}" r="2.6"/>`; }
      const R = 7.5 * Math.min(1.25, 0.9 + a / 250);
      for (let i = 0; i < n; i++) {
        const [x, y] = spot();
        t += `<g class="tr-peldot"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(R + 1.6)}" class="tr-pelrim"/><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(R)}" fill="url(#lab-tr-dot)"/><path d="M${r1(x - R * 0.7)} ${r1(y)}H${r1(x + R * 0.7)}M${r1(x)} ${r1(y - R * 0.7)}V${r1(y + R * 0.7)}" class="tr-pelx"/><ellipse cx="${r1(x - R * 0.35)}" cy="${r1(y - R * 0.4)}" rx="${r1(R * 0.3)}" ry="${r1(R * 0.18)}" class="tr-pelhi"/></g>`;
      }
      for (let i = 0; i < 2; i++) { const [x, y] = spot(); t += `<path class="tr-hairtop" d="M${r1(x)} ${r1(y)}q ${r1(14 + rnd() * 8)} ${r1(-4 - rnd() * 6)} ${r1(26 + rnd() * 8)} ${r1(-2)}"/>`; }
      t += '</g>';
      topSvg.innerHTML = t;
      set(el, 'lab-tr-cap', `${a < 30 ? 'молодой верхний лист' : a < 70 ? 'лист среднего возраста' : 'старый нижний лист'}: ≈ ${n} ${h.plural(n, 'пельтатная железка', 'пельтатные железки', 'пельтатных железок')} на этом участке`);
    }
    h.bindRange(el, 'lab-tr-age', a => a < 30 ? 'молодой' : a < 70 ? 'средний' : 'старый', age);
    note();
    info();
    age(20);
  });

  register('pathway', el => {
    // the tree as drawn on a wide screen: x as a share of the width, y in pixels
    const NODES = {
      sug: [0.53, 30, 'Сахара фотосинтеза'], ipp: [0.32, 100, 'IPP и DMAPP · C₅'], gpp: [0.19, 176, 'ГДФ · C₁₀'], fpp: [0.455, 176, 'ФДФ · C₁₅'], ger: [0.315, 256, 'Гераниол'],
      phe: [0.74, 100, 'Фенилаланин · C₉'], cia: [0.74, 176, 'Коричная кислота'], con: [0.74, 256, 'Кониферилацетат'], chv: [0.595, 256, 'Хавикол']
    };
    const ENDS = { lin: [0.07, 256], cin: [0.19, 256], cit: [0.315, 336], car: [0.455, 256], est: [0.595, 336], mci: [0.915, 256], eug: [0.74, 336], meu: [0.74, 416] };
    const PATHS = {
      lin: ['sug', 'ipp', 'gpp', 'lin'], cin: ['sug', 'ipp', 'gpp', 'cin'], cit: ['sug', 'ipp', 'gpp', 'ger', 'cit'], car: ['sug', 'ipp', 'fpp', 'car'],
      est: ['sug', 'phe', 'cia', 'chv', 'est'], mci: ['sug', 'phe', 'cia', 'mci'], eug: ['sug', 'phe', 'cia', 'con', 'eug'], meu: ['sug', 'phe', 'cia', 'con', 'eug', 'meu']
    };
    const ENZ = { 'gpp-lin': 'LIS', 'gpp-cin': 'CinS', 'gpp-ger': 'GES', 'ger-cit': 'ADH', 'fpp-car': 'TPS', 'phe-cia': 'PAL', 'cia-mci': 'CCMT', 'chv-est': 'CVOMT', 'con-eug': 'EGS', 'eug-meu': 'EOMT', 'cia-chv': '', 'cia-con': '' };
    const INFO = {
      lin: ['Линалоол', 'Линалоолсинтаза (LIS) превращает геранилдифосфат в линалоол одним шагом. Её активность — главное отличие европейских сортов.', 'генуэзский, греческий, фиолетовые, «Пурпурный шар»'],
      cin: ['1,8-Цинеол', 'Цинеолсинтаза (CinS) замыкает геранилдифосфат в бициклический эфир.', 'генуэзский, африканский синий'],
      cit: ['Цитраль', 'Гераниолсинтаза (GES) даёт гераниол, а дегидрогеназы (ADH) окисляют его до альдегидов гераниаля и нераля — вместе это цитраль.', 'лимонный, лаймовый'],
      car: ['β-Кариофиллен', 'Сесквитерпенсинтазы (TPS) сворачивают пятнадцатиуглеродный фарнезилдифосфат в кольца.', 'тулси, лимонный'],
      est: ['Эстрагол', 'Хавикол-O-метилтрансфераза (CVOMT) пришивает метильную группу к хавиколу. Сильный фермент — анисовый тайский базилик.', 'тайский, фиолетовые, «Арарат», «Анисовый восторг»'],
      mci: ['Метилциннамат', 'Метилтрансфераза коричной кислоты (CCMT) превращает её в метиловый эфир с запахом корицы и клубники.', 'коричный; по аромату — «Карамельный»'],
      eug: ['Эвгенол', 'Эвгенолсинтаза (EGS) снимает ацетатную группу с кониферилацетата — получается эвгенол.', 'генуэзский, гвоздичный, тулси, «Философ», «Василиск»'],
      meu: ['Метилэвгенол', 'Эвгенол-O-метилтрансфераза (EOMT) метилирует эвгенол. Много её у тулси.', 'тулси']
    };
    const TERP = ['lin', 'cin', 'cit', 'car'], PHEN = ['est', 'mci', 'eug', 'meu'];
    const short = k => h.molName(k).replace(/^1,8-|^β-/, '');
    el.innerHTML = h.head('Два конвейера аромата', 'Базилик собирает аромат на двух конвейерах: терпены — из пятиуглеродных «кирпичиков», фенилпропаноиды — из аминокислоты фенилаланина. Выберите молекулу, чтобы увидеть её путь и ферменты на каждом шаге.') +
      `<div class="pw-pick" id="lab-pw-pick" role="group" aria-label="Молекула">${TERP.concat(PHEN).map(k => `<button type="button" class="chip pw-chip" data-k="${k}" aria-pressed="false"><i style="background:var(--m-${k})"></i>${short(k)}</button>`).join('')}</div>
       <div class="lab-chart pw-chart" id="lab-pw-ch"></div>
       <div class="pw-info" id="lab-pw-info" aria-live="polite"></div>`;
    let sel = 'eug';
    const pill = (x, y, w, text, cls, k, mk) => `<g class="${cls}"${mk ? ` style="--mk:var(--m-${mk})"` : ''}${k ? ` data-k="${k}" tabindex="0" role="button" aria-label="${text}"` : ''}><rect x="${r1(x - w / 2)}" y="${y - 15}" width="${r1(w)}" height="30" rx="${k ? 10 : 15}"/><text x="${r1(x)}" y="${y + 4.5}" text-anchor="middle">${text}</text></g>`;
    const tw = (t, big) => t.length * (big ? 8.1 : 7.6) + 20;
    const arrow = (x1, y1, x2, y2, hot, enz, side = 1) => {
      let s = `<line class="pw-edge${hot ? ' is-hot' : ''}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" marker-end="url(#lab-pw-ah${hot ? '-hot' : ''})"/>`;
      if (enz) s += `<text class="pw-enz${hot ? ' is-hot' : ''}" x="${r1((x1 + x2) / 2 + side * 7)}" y="${r1((y1 + y2) / 2 + 4)}" text-anchor="${side > 0 ? 'start' : 'end'}">${enz}</text>`;
      return s;
    };
    const ch = h.chart($('#lab-pw-ch', el), {
      label: 'Схема биосинтеза ароматических веществ базилика',
      h: w => (w >= 700 ? 440 : 88 + 70 * (Math.max(TERP.includes(sel) ? PATHS[sel].length - 1 : 3, PHEN.includes(sel) ? PATHS[sel].length - 1 : 4) - 1) + 58),
      draw(w, hh) {
        const path = PATHS[sel], on = new Set(path), edges = new Set(path.slice(1).map((b, i) => path[i] + '-' + b));
        let s = `<defs>${['', '-hot'].map(k => `<marker id="lab-pw-ah${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="pw-ah${k ? ' is-hot' : ''}"/></marker>`).join('')}</defs>`;
        if (w >= 700) {
          const X = f => Math.round(f * w);
          const pos = k => (NODES[k] || ENDS[k]);
          const width = k => (NODES[k] ? tw(NODES[k][2]) : tw(short(k), true));
          const E = [['sug', 'ipp'], ['sug', 'phe'], ['ipp', 'gpp'], ['ipp', 'fpp'], ['gpp', 'lin'], ['gpp', 'cin'], ['gpp', 'ger'], ['ger', 'cit'], ['fpp', 'car'], ['phe', 'cia'], ['cia', 'mci'], ['cia', 'chv'], ['cia', 'con'], ['chv', 'est'], ['con', 'eug'], ['eug', 'meu']];
          s += `<rect class="pw-lane" x="6" y="62" width="${X(0.53) - 16}" height="${hh - 70}" rx="18"/><rect class="pw-lane is-phen" x="${X(0.53) + 6}" y="62" width="${w - X(0.53) - 12}" height="${hh - 70}" rx="18"/>`;
          s += `<text class="pw-zone" x="18" y="${hh - 18}">терпены</text><text class="pw-zone" x="${w - 18}" y="${hh - 18}" text-anchor="end">фенилпропаноиды</text>`;
          E.forEach(([a, b]) => {
            const A = pos(a), B = pos(b), hot = edges.has(a + '-' + b);
            let x1 = X(A[0]), y1 = A[1] + 16, x2 = X(B[0]), y2 = B[1] - 17;
            if (Math.abs(A[1] - B[1]) < 8) { x1 = X(A[0]) + width(a) / 2; y1 = A[1]; x2 = X(B[0]) - width(b) / 2 - 4; y2 = B[1]; }
            s += arrow(x1, y1, x2, y2, hot, ENZ[a + '-' + b], x2 >= x1 ? 1 : -1);
          });
          Object.entries(NODES).forEach(([k, [f, y, t]]) => { s += pill(X(f), y, width(k), t, `pw-node${on.has(k) ? ' is-hot' : ''}`); });
          Object.entries(ENDS).forEach(([k, [f, y]]) => { s += pill(Math.min(w - width(k) / 2 - 4, Math.max(width(k) / 2 + 4, X(f))), y, width(k), short(k), `pw-end${k === sel ? ' is-sel' : ''}${on.has(k) ? ' is-hot' : ''}`, k, k); });
          return s;
        }
        // phone: two conveyors side by side, each shows the chain that leads to the chosen molecule
        const cx = [w * 0.26, w * 0.74], cw = w * 0.46;
        s += `<rect class="pw-lane" x="2" y="52" width="${r1(w / 2 - 6)}" height="${hh - 56}" rx="16"/><rect class="pw-lane is-phen" x="${r1(w / 2 + 4)}" y="52" width="${r1(w / 2 - 6)}" height="${hh - 56}" rx="16"/>`;
        s += pill(w / 2, 24, tw('Сахара фотосинтеза'), 'Сахара фотосинтеза', 'pw-node is-hot');
        [[TERP, ['ipp', 'gpp', 'lin'], 'терпены'], [PHEN, ['phe', 'cia', 'con', 'eug'], 'фенилпропаноиды']].forEach(([group, fallback, name], c) => {
          const mine = group.includes(sel);
          const chain = mine ? PATHS[sel].slice(1) : fallback;
          const x = cx[c];
          s += arrow(w / 2 + (c ? 30 : -30), 40, x, 70, mine, '', 1);
          chain.forEach((k, i) => {
            const y = 88 + i * 70;
            const isEnd = !NODES[k];
            const text = isEnd ? short(k) : NODES[k][2].replace(' · ', ' ');
            s += pill(x, y, Math.min(cw - 8, tw(text, isEnd)), text, `${isEnd ? 'pw-end' : 'pw-node'}${mine ? ' is-hot' : ' is-idle'}${k === sel ? ' is-sel' : ''}`, isEnd && mine ? k : null, isEnd ? k : null);
            if (i < chain.length - 1) s += arrow(x, y + 16, x, y + 53, mine, ENZ[k + '-' + chain[i + 1]], 1);
          });
          s += `<text class="pw-zone" x="${r1(x)}" y="${hh - 12}" text-anchor="middle">${name}</text>`;
        });
        return s;
      }
    });
    const info = () => {
      const inf = INFO[sel];
      $('#lab-pw-info', el).innerHTML = `<p class="lab-kicker">${TERP.includes(sel) ? 'Терпеновый конвейер' : 'Фенилпропаноидный конвейер'}</p><h5>${inf[0]}</h5><p>${h.nb(inf[1])}</p><p class="pw-sorts">Много у сортов: ${inf[2]}</p>`;
      $$('.pw-chip', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === sel)));
    };
    const choose = k => { if (!k || !INFO[k]) return; sel = k; ch.redraw(); info(); };
    $('#lab-pw-pick', el).addEventListener('click', e => { const b = e.target.closest('.pw-chip'); if (b) choose(b.dataset.k); });
    ch.svg.addEventListener('click', e => { const g = e.target.closest('.pw-end[data-k]'); if (g) choose(g.dataset.k); });
    ch.svg.addEventListener('keydown', e => { const g = e.target.closest && e.target.closest('.pw-end[data-k]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(g.dataset.k); } });
    info();
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
      <div class="vol-track">${ids.map((id, i) => { const m = h.MOLS[id]; return `<button type="button" class="vol-chip ${h.FAM[m.fam].cls}" data-v="${id}" style="--x:${((m.bp - 115) / 160 * 100).toFixed(1)}%;--mc:var(--m-${id})"><b>${m.name.replace(/^\(Z\)-3-/, '')}</b><small>${m.bp} °C</small></button>`; }).join('')}</div>
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

  // the same order everywhere: families stay together, so a colour never jumps between charts
  const CH_ORDER = ['lin', 'cin', 'cit', 'cam', 'est', 'meu', 'eug', 'mci', 'car', 'ber'];
  // what the nose makes of each molecule: axis weights of the «character» chart
  const CH_AXES = [['floral', 'цветы'], ['lemon', 'лимон'], ['cool', 'холодок'], ['pepper', 'перец'], ['clove', 'гвоздика'], ['cinnamon', 'корица'], ['anise', 'анис']];
  const CH_NOTE = {
    lin: { floral: 1 }, cit: { lemon: 1 }, cin: { cool: 1 }, cam: { cool: 1, pepper: 0.25 },
    car: { pepper: 1 }, ber: { pepper: 0.8 }, eug: { clove: 1 }, meu: { clove: 0.6, anise: 0.5 },
    mci: { cinnamon: 1, floral: 0.2 }, est: { anise: 1 }
  };
  const chScore = p => CH_AXES.map(([a]) => Math.min(1, Math.sqrt(Object.entries(p).reduce((s, [m, v]) => s + v * ((CH_NOTE[m] || {})[a] || 0), 0) / 55)));
  const chShort = k => h.molName(k).replace(/^1,8-|^α-|^β-/, '').toLowerCase();

  register('chemotype', el => {
    const V = h.CHEMO;
    // the catalogue's sorts, each under its chemotype (window.BASIL comes from data.js)
    const SORTS = (window.BASIL && window.BASIL.VARIETIES) || [];
    const sortsOf = i => SORTS.map((v, k) => [v, k]).filter(([v]) => v.chem === V[i].id);
    const q2 = t => `«${t}»`;
    el.innerHTML = h.head('Химический отпечаток сорта', 'Кольцо — из чего состоит эфирное масло, паутинка — каким от этого получается запах. Доли — ориентир по опубликованным анализам: у каждого растения они свои и меняются с погодой.') +
      `<div class="chemo-grid">
        <div class="chemo-card">
          <div class="chemo-figs">
            <div class="chemo-fig"><div class="lab-chart" id="lab-ch-donut"></div><ol class="chemo-top" id="lab-ch-top"></ol></div>
            <div class="chemo-fig"><div class="lab-chart" id="lab-ch-radar"></div></div>
          </div>
          <div class="chemo-info" id="lab-ch-info" aria-live="polite"></div>
        </div>
        <div class="chemo-side">
          <p class="lab-label">Химотипы и сорта</p>
          <div class="chemo-list" id="lab-ch-list" role="group" aria-label="Химотипы и сорта базилика">${V.map((r, i) => `<div class="chemo-group"><button type="button" class="chemo-row" data-i="${i}" aria-pressed="${i === 0}"><span class="chemo-name">${r.name}</span><span class="chemo-bar">${CH_ORDER.filter(k => r.p[k]).map(k => `<i data-m="${k}" style="flex-grow:${r.p[k]};background:var(--m-${k})"></i>`).join('')}<i class="is-rest" style="flex-grow:${Math.max(0, 100 - CH_ORDER.reduce((a, k) => a + (r.p[k] || 0), 0))}"></i></span><b class="chemo-val"></b></button>${sortsOf(i).length ? `<div class="chemo-sorts">${sortsOf(i).map(([v, k]) => `<button type="button" class="chemo-sort lf-${v.leaf}" data-s="${k}" aria-pressed="false"><i></i>${v.name.replace(/, святой базилик$/, '')}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>
          <p class="lab-label">Молекулы</p>
          <div class="chemo-mols" id="lab-ch-mols" role="group" aria-label="Подсветить молекулу">${CH_ORDER.map(k => `<button type="button" class="chip chemo-mol" data-m="${k}" aria-pressed="false"><i style="background:var(--m-${k})"></i>${chShort(k)}</button>`).join('')}</div>
          <p class="lab-foot">зелёные — монотерпены, лиловые и коричные — фенилпропаноиды, золотистые — сесквитерпены; серое — остальные вещества</p>
        </div>
      </div>`;
    let cur = 0, mol = null, sort = null;
    const title = () => (sort != null ? SORTS[sort].name : V[cur].name);
    const shares = i => CH_ORDER.map(k => [k, V[i].p[k] || 0]);

    /* composition ring: every molecule has its own arc, so switching sorts slides the arcs */
    const donut = h.chart($('#lab-ch-donut', el), {
      label: 'Состав эфирного масла выбранного сорта',
      h: w => Math.min(w, 200),
      draw(w, hh) {
        const S0 = Math.min(w, hh), cx = w / 2, cy = hh / 2, r = S0 * 0.36, sw = S0 * 0.16;
        let s = `<circle class="chemo-ring-bg" cx="${cx}" cy="${cy}" r="${r1(r)}" stroke-width="${r1(sw)}"/>`;
        s += `<g transform="rotate(-90 ${r1(cx)} ${r1(cy)})">`;
        CH_ORDER.forEach(k => { s += `<circle class="chemo-seg" data-m="${k}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" stroke="var(--m-${k})" stroke-width="${r1(sw)}"/>`; });
        s += '</g>';
        s += `<text class="chemo-c1" id="lab-ch-c1" x="${r1(cx)}" y="${r1(cy - 4)}" text-anchor="middle"></text><text class="chemo-c2" id="lab-ch-c2" x="${r1(cx)}" y="${r1(cy + 16)}" text-anchor="middle"></text>`;
        return s;
      }
    });
    const paintDonut = () => {
      const c = $('.chemo-seg', donut.svg);
      if (!c) return;
      const R = +c.getAttribute('r'), C = 2 * Math.PI * R;
      let at = 0;
      shares(cur).forEach(([k, v]) => {
        const len = v / 100 * C, seg = $(`.chemo-seg[data-m="${k}"]`, donut.svg);
        seg.style.strokeDasharray = `${r1(Math.max(0, len - (len > 3 ? 2 : 0)))} ${r1(C)}`;
        seg.style.strokeDashoffset = r1(-at);
        seg.classList.toggle('is-dim', !!mol && mol !== k);
        at += len;
      });
      const [k, v] = mol ? [mol, V[cur].p[mol] || 0] : shares(cur).sort((a, b) => b[1] - a[1])[0];
      set(el, 'lab-ch-c1', `${v} %`);
      set(el, 'lab-ch-c2', chShort(k));
    };

    /* character of the smell: seven notes, the classic Genovese dashed for comparison */
    let shown = chScore(V[0].p), anim = 0, radarPt = null;
    const radar = h.chart($('#lab-ch-radar', el), {
      label: 'Характер запаха выбранного сорта по семи нотам',
      h: w => Math.min(260, Math.max(220, w * 0.72)),
      draw(w, hh) {
        const cx = w / 2, cy = hh / 2 + 4, R = Math.min(w / 2 - 60, hh / 2 - 28);
        const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / CH_AXES.length; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
        let s = '';
        [0.25, 0.5, 0.75, 1].forEach(g => { s += `<polygon class="chemo-web" points="${CH_AXES.map((_, i) => pt(i, g).map(r1).join(',')).join(' ')}"/>`; });
        CH_AXES.forEach(([, name], i) => {
          const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.16);
          s += `<line class="chemo-axis" x1="${r1(cx)}" y1="${r1(cy)}" x2="${r1(x)}" y2="${r1(y)}"/>`;
          const anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end';
          s += `<text class="chemo-ax" x="${r1(lx)}" y="${r1(ly + (ly > cy + 4 ? 10 : ly < cy - R * 0.9 ? -2 : 4))}" text-anchor="${anchor}">${name}</text>`;
        });
        s += `<polygon class="chemo-ref" id="lab-ch-ref" points=""/><polygon class="chemo-shape" id="lab-ch-shape" points=""/><g id="lab-ch-pts"></g>`;
        radarPt = pt;
        return s;
      }
    });
    const drawShape = vals => {
      const pt = radarPt;
      if (!pt || !radar) return;
      const shape = $('#lab-ch-shape', radar.svg), ref = $('#lab-ch-ref', radar.svg);
      shape.setAttribute('points', vals.map((v, i) => pt(i, Math.max(0.04, v)).map(r1).join(',')).join(' '));
      ref.setAttribute('points', cur ? chScore(V[0].p).map((v, i) => pt(i, Math.max(0.04, v)).map(r1).join(',')).join(' ') : '');
      $('#lab-ch-pts', radar.svg).innerHTML = vals.map((v, i) => { const [x, y] = pt(i, Math.max(0.04, v)); return `<circle class="chemo-pt" cx="${r1(x)}" cy="${r1(y)}" r="3.4"/>`; }).join('');
    };
    const tweenTo = target => {
      cancelAnimationFrame(anim);
      const from = shown.slice(), t0 = performance.now(), dur = h.reduce.matches ? 0 : 420;
      const step = t => {
        const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
        shown = from.map((v, i) => lerp(v, target[i], e));
        drawShape(shown);
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };

    const info = () => {
      const r = V[cur];
      const top = shares(cur).filter(([, v]) => v).sort((a, b) => b[1] - a[1]);
      $('#lab-ch-top', el).innerHTML = top.slice(0, 4).map(([k, v]) => `<li><i style="background:var(--m-${k})"></i><span>${chShort(k)}</span><b>${v}&nbsp;%</b></li>`).join('');
      if (mol) {
        const M = h.MOLS[mol] || h.EXTRA[mol];
        const best = V.map((x, i) => [i, x.p[mol] || 0]).sort((a, b) => b[1] - a[1])[0];
        const bestSorts = sortsOf(best[0]).map(([v]) => q2(v.name.replace(/, святой базилик$/, ''))).slice(0, 4);
        $('#lab-ch-info', el).innerHTML = `<p class="lab-kicker">Молекула</p><h5>${h.molName(mol)}</h5><p>${h.nb(`Пахнет: ${M.smell}. У сорта ${q2(title())} — ${r.p[mol] ? r.p[mol] + ' %' : 'почти нет'}; больше всего — у химотипа ${q2(V[best[0]].name)}, ${best[1]} %${bestSorts.length ? ': ' + bestSorts.join(', ') : ''}.`)}</p>`;
      } else {
        // where the numbers come from: an analysis of this type, or the sort is placed here by its descent or aroma
        const s = sort != null ? SORTS[sort] : null;
        const note = !s ? `Сорта этого химотипа: ${sortsOf(cur).map(([v]) => q2(v.name.replace(/, святой базилик$/, ''))).join(', ') || '—'}.`
          : s.chemBy === 'analysis' ? (s.name === r.name ? '' : `Состав — по анализам сортов группы ${q2(r.name)}.`)
          : `Отдельного анализа масла у этого сорта нет: состав показан по химотипу ${q2(r.name)}, к которому его относит ${s.chemBy === 'type' ? 'происхождение' : 'аромат'} — ${s.chemWhy}.`;
        $('#lab-ch-info', el).innerHTML = `<p class="lab-kicker">${s ? 'Почему так пахнет' : 'Химотип'}</p><h5>${title()}</h5>${s ? `<p class="chemo-aroma">${h.nb(s.aroma)}</p>` : ''}<p>${h.nb(r.why)}</p>${note ? `<p class="chemo-note">${h.nb(note)}</p>` : ''}${cur ? '<p class="chemo-cmp"><i></i>пунктир — генуэзский для сравнения</p>' : ''}`;
      }
    };
    const list = $('#lab-ch-list', el);
    const paintList = () => {
      list.dataset.m = mol || '';
      $$('.chemo-row', list).forEach(b => {
        const i = +b.dataset.i;
        b.setAttribute('aria-pressed', String(i === cur && sort == null));
        b.classList.toggle('is-cur', i === cur);
        $('.chemo-val', b).textContent = mol ? (V[i].p[mol] ? V[i].p[mol] + ' %' : '—') : '';
      });
      $$('.chemo-sort', list).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.s === sort)));
      $$('.chemo-mol', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === mol)));
    };
    const update = () => { paintDonut(); tweenTo(chScore(V[cur].p)); info(); paintList(); };
    list.addEventListener('click', e => {
      const sb = e.target.closest('.chemo-sort');
      if (sb) { sort = +sb.dataset.s; cur = V.findIndex(g => g.id === SORTS[sort].chem); update(); return; }
      const b = e.target.closest('.chemo-row');
      if (b) { cur = +b.dataset.i; sort = null; update(); }
    });
    $('#lab-ch-mols', el).addEventListener('click', e => { const b = e.target.closest('.chemo-mol'); if (b) { mol = mol === b.dataset.m ? null : b.dataset.m; update(); } });
    // charts rebuild on resize: put the current state back
    if ('ResizeObserver' in window) new ResizeObserver(() => { paintDonut(); drawShape(shown); }).observe(el);
    update();
  });

  register('heat', el => {
    // any sort of the catalogue; its oil is that of its chemotype
    const SORTS = ((window.BASIL && window.BASIL.VARIETIES) || []).filter(x => h.CHEMO.some(g => g.id === x.chem));
    // the list keeps the catalogue's types: a group per type, its varieties inside
    const TYPES = (window.BASIL && window.BASIL.VARIETY_TYPES) || [];
    const opt = (x, k) => `<option value="${k}">${x.name.replace(/, святой базилик$/, '')}</option>`;
    const sortOptions = () => {
      const pairs = SORTS.map((x, k) => [x, k]);
      const groups = TYPES.map(t => [t, pairs.filter(([x]) => x.type === t.id)]).filter(([, list]) => list.length);
      const rest = pairs.filter(([x]) => !TYPES.some(t => t.id === x.type));
      return groups.map(([t, list]) => `<optgroup label="${t.name}">${list.map(([x, k]) => opt(x, k)).join('')}</optgroup>`).join('') + rest.map(([x, k]) => opt(x, k)).join('');
    };
    el.innerHTML = h.head('Когда класть базилик', 'Модель открытой кастрюли: скорость потери каждой молекулы пропорциональна давлению её пара, оценённому по правилу Трутона. Внизу — что останется от аромата выбранного сорта.', true) +
      `<div class="lab-controls lab-row-wrap"><div class="field lab-field heat-sort"><label for="lab-ht-v">Сорт</label><select id="lab-ht-v">${sortOptions()}</select></div>${h.segHtml('lab-ht-t', 'Нагрев', [['60', '60 °C'], ['80', '80 °C'], ['100', 'Кипение']], '100')}${h.rangeHtml('lab-ht-m', 'Время на огне', 0, 30, 0.5, 10)}</div>
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
    $('#lab-ht-v', el).addEventListener('change', e => { st.v = (SORTS[+e.target.value] || {}).chem || 'genovese'; upd(); });
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

  /* @use food */
  // how much each molecule matters in the food's own aroma (1 — one of its key notes)
  const PA_W = {
    tomato: { hex: 1, lin: 0.5 }, strawberry: { mci: 0.8, lin: 0.7 }, lemon: { cit: 1, lin: 0.4 }, peach: { lin: 0.7 },
    coriander: { lin: 1 }, fennel: { est: 1 }, clove: { eug: 1, cin: 0.6 }, pepper: { car: 1 }, rosemary: { cin: 1, cam: 0.9 },
    mint: { cin: 0.6 }, cocoa: { lin: 0.5 }, olive: { hex: 0.6 }, cucumber: { hex: 0.5 }
  };
  // pairs that work by contrast: what does the work, and which basil it suits best
  const PA_LEVERS = {
    olive: [['жир', 'растворяет терпены и держит аромат']],
    cucumber: [['свежесть', 'холодная водянистая мякоть']],
    mozzarella: [['жир', 'растворяет и продлевает аромат'], ['молочная свежесть', 'оттеняет пряность']],
    parmesan: [['умами', 'глутамат выдержанного сыра'], ['соль', 'ярче слышен аромат'], ['жир', 'держит терпены']],
    garlic: [['сера', 'острота из аллицина'], ['масло', 'смягчает остроту']],
    chili: [['жгучесть', 'капсаицин'], ['кокосовый жир', 'держит эстрагол']]
  };
  const PA_FIT = {
    olive: { genovese: 1, greek: 0.95, purple: 0.9, clove: 0.9, lemon: 0.85, lime: 0.85, cinnamon: 0.8, thai: 0.75, tulsi: 0.7, african: 0.6 },
    cucumber: { lemon: 1, lime: 1, genovese: 0.9, greek: 0.85, cinnamon: 0.7, thai: 0.65, purple: 0.6, clove: 0.5, tulsi: 0.45, african: 0.4 },
    mozzarella: { genovese: 1, greek: 0.95, lemon: 0.8, lime: 0.75, purple: 0.7, cinnamon: 0.7, clove: 0.6, thai: 0.45, tulsi: 0.4, african: 0.35 },
    parmesan: { genovese: 1, greek: 0.9, purple: 0.8, clove: 0.7, cinnamon: 0.5, lemon: 0.5, lime: 0.45, thai: 0.3, tulsi: 0.35, african: 0.3 },
    garlic: { genovese: 1, greek: 0.9, purple: 0.9, clove: 0.8, thai: 0.7, tulsi: 0.6, cinnamon: 0.45, lemon: 0.5, lime: 0.5, african: 0.35 },
    chili: { thai: 1, tulsi: 0.9, lemon: 0.8, lime: 0.8, purple: 0.6, clove: 0.55, genovese: 0.45, greek: 0.45, cinnamon: 0.4, african: 0.3 }
  };
  const PA_HEX = 12; // green-leaf aldehydes burst out of any basil the moment it is cut

  register('pairing', el => {
    const V = h.CHEMO, P = h.PAIRS;
    // every sort of the catalogue; its chemotype decides the numbers
    const SORTS = ((window.BASIL && window.BASIL.VARIETIES) || []).filter(x => V.some(g => g.id === x.chem));
    const groupOf = k => Math.max(0, V.findIndex(g => g.id === SORTS[k].chem));
    const sortName = x => x.name.replace(/, святой базилик$/, '');
    const share = (v, m) => (m === 'hex' ? PA_HEX : V[v].p[m] || 0);
    const bridge = (v, m, w) => w * Math.min(1, Math.sqrt(share(v, m) / 40));
    // no shared molecules: the pair works by contrast (olive oil and cucumber only share a family of green notes)
    const contrast = f => !f.mols.length;
    const score = (v, f) => {
      if (contrast(f)) return (PA_FIT[f.id] || {})[V[v].id] || 0.5;
      return 1 - Object.entries(PA_W[f.id]).reduce((a, [m, w]) => a * (1 - 0.85 * bridge(v, m, w)), 1);
    };
    const word = (x, c) => c ? (x >= 0.8 ? 'отличный контраст' : x >= 0.55 ? 'хороший контраст' : 'спорно') : x >= 0.6 ? 'сильная связь' : x >= 0.35 ? 'заметная связь' : x >= 0.15 ? 'слабая связь' : 'почти нет';
    const vShort = n => n.replace('Африканский синий', 'Африк. синий');
    // the basil is chosen in two steps: its type (as in the catalogue), then a variety of that type
    const TYPES = ((window.BASIL && window.BASIL.VARIETY_TYPES) || []).filter(t => SORTS.some(x => x.type === t.id));
    let sk = 0, ty = SORTS[0] && SORTS[0].type;
    const leafIco = x => `<svg viewBox="-34 -108 68 122" aria-hidden="true">${food.basil(x.leaf)}</svg>`;
    const typeChips = () => TYPES.map(t => { const first = SORTS.find(x => x.type === t.id); return `<button type="button" class="chip pa-type" data-t="${t.id}" aria-pressed="${t.id === ty}">${leafIco(first)}${t.short}<small>${SORTS.filter(x => x.type === t.id).length}</small></button>`; }).join('');
    const sortChips = () => SORTS.map((x, k) => [x, k]).filter(([x]) => !TYPES.length || x.type === ty).map(([x, k]) => `<button type="button" class="chip pa-var" data-s="${k}" aria-pressed="${k === sk}">${leafIco(x)}${vShort(sortName(x))}</button>`).join('');

    el.innerHTML = h.head('Лаборатория сочетаний', 'Выберите свой базилик — продукты выстроятся по силе связи с ним. Нажмите на продукт: мост покажет, какие молекулы их роднят или что работает на контрасте. Сила связи — качественная оценка по долям общих молекул.') +
      `<p class="lab-label">Ваш базилик</p>
       ${TYPES.length ? `<div class="pa-types" id="lab-pa-t" role="group" aria-label="Тип базилика">${typeChips()}</div>` : ''}
       <div class="pa-varieties" id="lab-pa-v" role="group" aria-label="Сорт базилика">${sortChips()}</div>
       <p class="lab-label">С чем сочетать</p>
       <div class="pa-foods" id="lab-pa-f" role="group" aria-label="Продукты"></div>
       <div class="pa-stage">
         <p class="pa-title" id="lab-pa-title"></p>
         <div class="lab-chart pa-chart" id="lab-pa-ch"></div>
         <div class="pa-info" id="lab-pa-info" aria-live="polite"></div>
       </div>`;
    let v = groupOf(0), cur = P[0];
    const foods = $('#lab-pa-f', el);
    foods.innerHTML = P.map(f => `<button type="button" class="pa-food" data-id="${f.id}" aria-pressed="${f.id === cur.id}">${food.icon(f.id, 'pa-ico')}<span class="pa-name">${f.name}</span><span class="pa-meter"><i></i></span><span class="pa-word"></span></button>`).join('');

    /* the bridge: basil — molecules (or what works by contrast) — the food */
    const ch = h.chart($('#lab-pa-ch', el), {
      label: 'Мост ароматов между базиликом и выбранным продуктом',
      h: () => Math.max(190, 70 + ((PA_W[cur.id] ? Object.keys(PA_W[cur.id]).length : 0) + (PA_LEVERS[cur.id] || []).length) * 80),
      draw(w, hh) {
        const narrow = w < 520, cy = hh / 2 + 6;
        const Lx = narrow ? 40 : 88, Rx = w - (narrow ? 40 : 88), mx = w / 2;
        const W = PA_W[cur.id] || {};
        const mols = Object.keys(W);
        const levers = PA_LEVERS[cur.id] || [];
        const nodes = mols.map(m => ({ m, a: bridge(v, m, 1), b: W[m] })).concat(levers.map(([t, s]) => ({ lever: t, sub: s })));
        const n = nodes.length, gap = Math.min(78, (hh - 40) / Math.max(1, n));
        let s = '';
        nodes.forEach((d, i) => {
          const y = cy + (i - (n - 1) / 2) * gap;
          const col = d.m ? `var(--m-${d.m})` : 'var(--ink-3)';
          const wa = d.m ? 1.5 + 11 * d.a : 2, wb = d.m ? 1.5 + 11 * d.b : 2;
          const faint = d.m && d.a < 0.18;
          s += `<path class="pa-rib${d.lever || faint ? ' is-dash' : ''}" pathLength="1" d="M${Lx + (narrow ? 10 : 14)} ${r1(cy - 8)}C${r1((Lx + mx) / 2)} ${r1(cy - 8)} ${r1((Lx + mx) / 2)} ${r1(y)} ${r1(mx - 24)} ${r1(y)}" stroke="${col}" stroke-width="${r1(wa)}"/>`;
          s += `<path class="pa-rib${d.lever ? ' is-dash' : ''}" pathLength="1" d="M${r1(mx + 24)} ${r1(y)}C${r1((mx + Rx) / 2)} ${r1(y)} ${r1((mx + Rx) / 2)} ${r1(cy - 8)} ${Rx - (narrow ? 16 : 22)} ${r1(cy - 8)}" stroke="${col}" stroke-width="${r1(wb)}"/>`;
          if (d.m) {
            const r = 9 + 9 * Math.max(d.a, 0.15);
            s += `<circle class="pa-node${faint ? ' is-faint' : ''}" cx="${r1(mx)}" cy="${r1(y)}" r="${r1(r)}" fill="${col}" stroke="${col}"/>`;
            s += `<text class="pa-mol" x="${r1(mx)}" y="${r1(y + r + 13)}" text-anchor="middle">${d.m === 'hex' ? 'зелёные альдегиды' : h.molName(d.m).replace(/^1,8-|^α-|^β-/, '').toLowerCase()}</text>`;
            s += `<text class="pa-sub" x="${r1(mx)}" y="${r1(y + r + 25)}" text-anchor="middle">${d.m === 'hex' ? 'при разрезе листа' : faint ? 'в этом сорте почти нет' : `${share(v, d.m)} % масла`}</text>`;
          } else {
            const tw = d.lever.length * 7.4 + 22;
            s += `<rect class="pa-lever" x="${r1(mx - tw / 2)}" y="${r1(y - 13)}" width="${r1(tw)}" height="26" rx="13"/><text class="pa-mol" x="${r1(mx)}" y="${r1(y + 4.5)}" text-anchor="middle">${d.lever}</text>`;
            s += `<text class="pa-sub" x="${r1(mx)}" y="${r1(y + 27)}" text-anchor="middle">${d.sub}</text>`;
          }
        });
        s += `<g class="pa-end" transform="translate(${Lx} ${r1(cy + 26)})">${food.basil(SORTS[sk].leaf, narrow ? 0.5 : 0.62)}</g>`;
        s += `<g class="pa-end" transform="translate(${r1(Rx - (narrow ? 24 : 32))} ${r1(cy - 8 - (narrow ? 24 : 32))}) scale(${narrow ? 0.75 : 1})">${food.g(cur.id)}</g>`;
        return s;
      }
    });
    const drawIn = () => {
      const ribs = $$('.pa-rib', ch.svg);
      if (h.reduce.matches) return;
      ribs.forEach(p => { p.classList.remove('is-in'); });
      requestAnimationFrame(() => requestAnimationFrame(() => ribs.forEach((p, i) => { p.style.transitionDelay = `${(i % 2) * 0.28 + Math.floor(i / 2) * 0.06}s`; p.classList.add('is-in'); })));
    };

    const info = () => {
      const f = cur, x = score(v, f), c = contrast(f);
      const best = V.map((_, i) => [i, score(i, f)]).sort((a, b) => b[1] - a[1])[0];
      set(el, 'lab-pa-title', `<span>${sortName(SORTS[sk])}</span><i>+</i><span>${f.name.toLowerCase()}</span>`);
      const kicker = f.mols.length ? 'Общие молекулы' : f.kin && f.kin.length ? 'Родство ароматов' : 'Работает контраст';
      $('#lab-pa-info', el).innerHTML = `<p class="lab-kicker">${kicker}</p>
        <p class="pa-verdict"><b>${word(x, c)}</b>${best[0] !== v ? ` · лучше всего — ${SORTS.filter(y => y.chem === V[best[0]].id).slice(0, 3).map(y => `«${sortName(y)}»`).join(', ')}` : ' · лучший выбор для этой пары'}</p>
        ${SORTS[sk].chemBy !== 'analysis' ? `<p class="pa-note">${h.nb(`Связь посчитана по химотипу «${V[v].name}»: ${SORTS[sk].chemWhy}.`)}</p>` : ''}
        <p>${h.nb(f.why)}</p>
        <dl class="data-rows"><div><dt>Какой сорт</dt><dd>${f.variety}</dd></div><div><dt>Попробуйте</dt><dd>${f.dish}</dd></div></dl>`;
    };

    // cards: strongest first, contrast pairs after; they glide to their new places (FLIP)
    const order = () => {
      const cards = $$('.pa-food', foods);
      const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
      const rank = P.map(f => ({ f, x: score(v, f), c: contrast(f) })).sort((a, b) => (a.c - b.c) || (b.x - a.x));
      rank.forEach(({ f, x, c }) => {
        const card = $(`.pa-food[data-id="${f.id}"]`, foods);
        card.style.setProperty('--v', x.toFixed(2));
        card.classList.toggle('is-contrast', c);
        $('.pa-word', card).textContent = word(x, c);
        foods.appendChild(card);
      });
      if (h.reduce.matches) return;
      cards.forEach(c => {
        const a = first.get(c), b = c.getBoundingClientRect();
        const dx = a.left - b.left, dy = a.top - b.top;
        if (!dx && !dy) return;
        c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,.8,.26,1)' });
      });
    };
    const pick = () => {
      $$('.pa-food', foods).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === cur.id)));
      ch.redraw();
      drawIn();
      info();
    };
    foods.addEventListener('click', e => { const b = e.target.closest('.pa-food'); if (!b) return; cur = P.find(p => p.id === b.dataset.id); pick(); });
    const choose = k => {
      sk = k;
      v = groupOf(sk);
      $$('.pa-var', el).forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.s === sk)));
      order();
      foods.scrollTo({ left: 0, behavior: h.reduce.matches ? 'auto' : 'smooth' });
      pick();
    };
    $('#lab-pa-v', el).addEventListener('click', e => { const b = e.target.closest('.pa-var'); if (b) choose(+b.dataset.s); });
    // a type: its varieties take the second row, the first of them is chosen
    if (TYPES.length) $('#lab-pa-t', el).addEventListener('click', e => {
      const b = e.target.closest('.pa-type');
      if (!b || b.dataset.t === ty) return;
      ty = b.dataset.t;
      $$('.pa-type', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const row = $('#lab-pa-v', el);
      sk = SORTS.findIndex(x => x.type === ty);
      row.innerHTML = sortChips();
      row.scrollTo({ left: 0 });
      choose(sk);
    });
    order();
    pick();
  });
})();
