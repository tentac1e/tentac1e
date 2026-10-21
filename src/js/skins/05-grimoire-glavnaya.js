  // Главная: плантация алхимика — грядки в каменных рамах под железными арками оранжереи, на ближних кустах —
  // стеклянные колпаки; в конце дорожки перегонный куб на печи, змеевик, приёмник с зелёным эликсиром. По медной трубе
  // от приёмника к грядкам бежит капля, и куст, к которому она пришла, вспыхивает. Над грядками висят знаки алхимии.
  // Круга, свечей и колонн нет: главная не похожа на главы. Касание — капля сейчас
  scene('grimoire', 'glavnaya', S => {
    const { R, T } = S;
    R.fog = [14, 10, 20]; R.fogNear = 3.5; R.fogFar = 12; R.amb = [0.22, 0.18, 0.28];
    const BEDS = [];
    for (const z of [1.45, 0.1, -1.25]) for (const x of [-1.1, 1.1]) BEDS.push({ x, z });
    const ARCH = [-2.05, -0.7, 0.65, 2.0];
    const GLYPH = [0, 1, 2, 3, 4, 5].map(k => glyphTex(k, [236, 196, 96]));
    const SMALLP = [[0.22, 0.4, 0.1], [0.5, 0.32, -0.05], [0.78, 0.22, -0.35], [0.95, 0.13, -0.6]];
    const FLASK = [0.98, 0.14, -1.9], EVERY = 1.5, RUN = 1.7;
    let taps = [], glow = BEDS.map(() => 0), drop = null, lastT = 0;
    // the way of a drop: from the receiver along the edge of the path to its bed, then into the earth
    const route = i => {
      const b = BEDS[i], ex = b.x < 0 ? -0.56 : 0.56;
      return [FLASK, [ex, 0.08, -1.9], [ex, 0.08, b.z], [b.x * 0.75, 0.3, b.z]];
    };
    const along = (pts, u) => {
      const L = pts.slice(1).map((p, k) => Math.hypot(...sub(p, pts[k]))), tot = L.reduce((a, b) => a + b, 0);
      let d = u * tot;
      for (let k = 0; k < L.length; k++) { if (d <= L[k]) return add(pts[k], mul(sub(pts[k + 1], pts[k]), d / L[k])); d -= L[k]; }
      return pts[pts.length - 1];
    };
    return {
      bare: true, fill: 0.8, orbit: [Math.PI / 2, 0.3], rad: 5.6, near: 5.2, look: [0, 0.75, -0.3], still: 2.2,
      sky: ['#05040A', '#120E1C', '#0C0912'],
      tap(t) { taps.push(t); if (taps.length > 4) taps.shift(); },
      tick(t) {
        const dt = Math.max(0, Math.min(0.2, t - lastT)); lastT = t;
        const n = Math.floor(t / EVERY), sends = [n * EVERY].concat(taps).filter(s => s <= t);
        drop = null;
        for (const s of sends) {
          const u = (t - s) / RUN, i = (taps.includes(s) ? taps.indexOf(s) * 5 + 3 + n : Math.round(s / EVERY)) % BEDS.length;
          if (u < 1 && !drop) drop = { p: along(route(i), smooth(u)), i };
          if (u >= 1 && u < 1 + dt / RUN + 0.02) glow[i] = 1;
        }
        glow = glow.map(g => (reduce.matches ? g : Math.max(0, g - dt * 0.9)));
        R.key = { dir: norm([0.2, 1, 0.4]), i: 0.5, col: [0.6, 0.65, 1] };
      },
      lights(t) {
        const L = [{ p: [0, 0.45, -1.85], col: [1, 0.55, 0.22], i: 1.3 + 0.2 * Math.sin(t * 9), fall: 0.5 }, { p: add(FLASK, [0, 0.25, 0]), col: [0.45, 1, 0.4], i: 0.9, fall: 1 }];
        if (drop) L.push({ p: drop.p, col: [0.5, 1, 0.4], i: 0.9, fall: 2 });
        glow.map((g, i) => [g, i]).sort((a, b) => b[0] - a[0]).slice(0, 2).forEach(([g, i]) => { if (g > 0.05) L.push({ p: [BEDS[i].x, 0.9, BEDS[i].z], col: [0.5, 1, 0.45], i: 1.4 * g, fall: 1.2 }); });
        return L;
      },
      draw(t) {
        // the ground of the greenhouse and its path of flags
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
          const x0 = -4 + i, z0 = -4 + j, v = ((i * 7 + j * 3) % 5) * 2;
          quad(R, [x0, 0, z0 + 1], [x0 + 1, 0, z0 + 1], [x0 + 1, 0, z0], [x0, 0, z0], { col: [30 + v, 22 + v, 26 + v], layer: 0, ds: true });
        }
        for (let k = 0; k < 6; k++) { const z0 = -2.2 + k * 0.82; quad(R, [-0.38, 0.004, z0 + 0.76], [0.38, 0.004, z0 + 0.76], [0.38, 0.004, z0], [-0.38, 0.004, z0], { tex: T.stone, layer: 0.5, ds: true }); }
        // the beds: a frame of stone, earth, two bushes each; the near ones under bell jars
        BEDS.forEach((b, i) => {
          box(R, [b.x, 0.14, b.z], [0.46, 0.14, 0.58], { tex: T.stone });
          quad(R, [b.x - 0.4, 0.285, b.z + 0.52], [b.x + 0.4, 0.285, b.z + 0.52], [b.x + 0.4, 0.285, b.z - 0.52], [b.x - 0.4, 0.285, b.z - 0.52], { tex: T.soil, ds: true });
          const far = b.z < -0.5;
          [-0.24, 0.24].forEach((dz, j) => {
            const base = [b.x, 0.285, b.z + dz];
            bush(R, T, base, t + i * 1.7 + j, { s: 0.62, pairs: SMALLP, flat: far ? [70, 128, 50] : null, yaw: i + j });
            if (b.z > 1) egg(R, add(base, [0, 0.3, 0]), [0.24, 0.36, 0.24], 0, { col: [120, 150, 170], emis: true, nofog: true, add: 0.12 });
          });
          // the sign over the bed
          billboard(R, [b.x, 1.55 + Math.sin(t * 1.2 + i) * 0.06, b.z], 0.1, 0.1, { tex: GLYPH[i], emis: true, nofog: true, cut: true });
        });
        // the iron arches of the greenhouse, their ridge, a little glass between them
        const arcP = (z, a) => [Math.cos(a) * 2.25, Math.sin(a) * 2.25, z];
        ARCH.forEach(z => { for (let k = 0; k < 8; k++) rod(R, arcP(z, k / 8 * Math.PI), arcP(z, (k + 1) / 8 * Math.PI), 0.03, { col: [58, 52, 70] }, 3); });
        [2, 4, 6].forEach(k => rod(R, arcP(ARCH[0], k / 8 * Math.PI), arcP(ARCH[3], k / 8 * Math.PI), 0.022, { col: [58, 52, 70] }, 3));
        for (let g = 0; g < 3; g++) for (let k = 1; k < 7; k++) quad(R, arcP(ARCH[g], k / 8 * Math.PI), arcP(ARCH[g + 1], k / 8 * Math.PI), arcP(ARCH[g + 1], (k + 1) / 8 * Math.PI), arcP(ARCH[g], (k + 1) / 8 * Math.PI), { col: [70, 90, 120], emis: true, nofog: true, add: 0.035, ds: true });
        // the still: a furnace with its fire, a copper pot, the swan's neck, the coil, the receiver
        box(R, [0, 0.32, -2.3], [0.42, 0.32, 0.4], { tex: T.stone });
        const fl = 0.8 + 0.2 * Math.sin(t * 13);
        quad(R, [-0.16, 0.06, -1.895], [0.16, 0.06, -1.895], [0.16, 0.34, -1.895], [-0.16, 0.34, -1.895], { col: [255, 130 * fl + 40, 40], emis: true, nofog: true });
        ball(R, [0, 0.95, -2.3], 0.36, { col: [196, 118, 64] });
        prism(R, 0, -2.3, 1.22, 1.62, 0.11, 0.05, 6, { col: [196, 118, 64] });
        rod(R, [0, 1.62, -2.3], [0.35, 1.72, -2.3], 0.035, { col: [196, 118, 64] }, 4);
        rod(R, [0.35, 1.72, -2.3], [0.92, 1.05, -2.3], 0.03, { col: [196, 118, 64] }, 4);
        prism(R, 0.98, -2.3, 0, 0.78, 0.22, 0.24, 8, { col: [112, 72, 44] }, [70, 46, 30]);
        for (let k = 0; k < 16; k++) { const a0 = k * 0.9, a1 = (k + 1) * 0.9, y0 = 1.02 - k * 0.045, y1 = y0 - 0.045; rod(R, [0.98 + Math.cos(a0) * 0.27, y0, -2.3 + Math.sin(a0) * 0.27], [0.98 + Math.cos(a1) * 0.27, y1, -2.3 + Math.sin(a1) * 0.27], 0.018, { col: [206, 128, 70] }, 3); }
        rod(R, [0.98, 0.3, -2.05], add(FLASK, [0, 0.14, 0]), 0.016, { col: [206, 128, 70] }, 3);
        ball(R, FLASK, 0.09, { col: [120, 255, 110], emis: true, nofog: true });
        ball(R, FLASK, 0.13, { col: [120, 150, 170], emis: true, nofog: true, add: 0.2 });
        // the pipe along the path, both sides
        [-0.56, 0.56].forEach(x => rod(R, [x, 0.08, -1.9], [x, 0.08, 1.9], 0.02, { col: [176, 104, 56] }, 3));
        if (drop) ball(R, drop.p, 0.04, { col: [150, 255, 120], emis: true, nofog: true });
      },
      fx(t, F) {
        F.halo([0, 0.25, -1.88], 0.5, 'rgba(255,140,50,.32)', 'rgba(255,120,40,0)');
        F.halo(FLASK, 0.35, 'rgba(120,255,110,.35)', 'rgba(120,255,110,0)');
        if (drop) F.halo(drop.p, 0.22, 'rgba(150,255,120,.5)', 'rgba(150,255,120,0)');
        BEDS.forEach((b, i) => {
          F.halo([b.x, 1.55, b.z], 0.2, 'rgba(255,210,110,.25)', 'rgba(255,210,110,0)');
          if (glow[i] > 0.05) for (let k = 0; k < 8; k++) { const l = (k / 8 + t * 0.6) % 1; F.dot([b.x + Math.sin(k * 2.3) * 0.3, 0.35 + l * 0.9, b.z + Math.cos(k * 1.7) * 0.4], `rgba(170,255,140,${glow[i] * (1 - l)})`); }
        });
        // steam over the pot
        for (let k = 0; k < 10; k++) { const l = (k / 10 + t * 0.25) % 1; F.dot([Math.sin(k + t) * 0.1 * l, 1.7 + l * 0.9, -2.3], `rgba(200,190,220,${0.5 * (1 - l)})`); }
      }
    };
  });
