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
