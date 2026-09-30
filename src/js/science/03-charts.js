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
    (o.series || []).forEach(se => {
      const pts = se.pts.filter(pt => isFinite(pt[1]));
      if (!pts.length) return;
      const d = pts.map((pt, i) => `${i ? 'L' : 'M'}${X(pt[0])} ${YS(pt[1])}`).join(' ');
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
      (m.dots || []).forEach(dt => { s += `<circle class="dot ${dt.cls}" cx="${X(m.x)}" cy="${Y(dt.y)}" r="5.5"/>`; });
    }
    if (o.hover != null) s += `<line class="hover-line" x1="${X(o.hover)}" x2="${X(o.hover)}" y1="${p.t}" y2="${p.t + ih}"/>`;
    // place captions: inside the picture, clear of the axis title and of each other
    const taken = [];
    if (o.ylab) taken.push([p.l - 7, p.t - 20, p.l - 7 + String(o.ylab).length * 6.6 + 6, p.t - 5]);
    const hit = b => taken.some(t => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
    (o.yticks || []).forEach(v => { const t = String((o.fy || String)(v)); taken.push([p.l - 9 - t.length * 6.6, Y(v) - 7, p.l - 5, Y(v) + 6]); });
    floats.sort((a, b) => a.rank - b.rank).forEach(f => {
      let x0 = f.anchor === 'end' ? f.x - f.w : f.anchor === 'middle' ? f.x - f.w / 2 : f.x;
      x0 = clamp(x0, Math.min(p.l + 2, o.w - 2 - f.w), o.w - 2 - f.w);
      let y = clamp(f.y, 12, o.h - 4);
      for (const dy of [0, 14, -14, 28, -28, 42]) {
        const yy = clamp(f.y + dy, 12, o.h - 4);
        if (!hit([x0, yy - 10, x0 + f.w, yy + 3])) { y = yy; break; }
      }
      taken.push([x0, y - 10, x0 + f.w, y + 3]);
      s += `<text class="${f.cls}" x="${r1(x0 + 2)}" y="${r1(y)}" text-anchor="start">${f.text}</text>`;
    });
    return { s, X, Y, p, iw, ih, inv: px => o.x[0] + (px - p.l) / iw * (o.x[1] - o.x[0]), invY: py => o.y[0] + (p.t + ih - py) / ih * (o.y[1] - o.y[0]) };
  }

  const tip = (x, y, w, lines) => {
    const bw = Math.max(...lines.map(l => l.length)) * 6.6 + 18;
    const bh = lines.length * 16 + 10;
    const tx = x + 12 + bw > w ? x - bw - 12 : x + 12;
    return `<g class="svg-tip"><rect x="${r1(tx)}" y="${r1(y)}" width="${r1(bw)}" height="${bh}" rx="8"/>${lines.map((l, i) => `<text x="${r1(tx + 9)}" y="${r1(y + 17 + i * 16)}">${esc(l)}</text>`).join('')}</g>`;
  };

