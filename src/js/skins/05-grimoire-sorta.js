  // Сорта: five sorts on a turning table, as the screen where a game's hero is chosen — the chosen one comes to the
  // front, rises into a beam of light and turns itself; the table turns on to the next by itself, or at a tap
  scene('grimoire', 'sorta', S => {
    const { R, T } = S, N = 5, STEP = 3.6, RAD = 1.2;
    const KINDS = [
      { tex: T.leaf, col: [84, 150, 56], leaf: 1.2 },                                       // «Генуэзский»: big leaves
      { tex: T.leafOpal, col: [98, 38, 96], stem: [96, 40, 98] },                           // «Тёмный опал»: purple
      { tex: T.leaf, col: [84, 150, 56], ball: true },                                      // «Греческий»: a ball of small leaves
      { tex: T.leafThai, col: [62, 124, 48], stem: [112, 48, 116], spike: true, leaf: 0.85 }, // «Тайский»: purple stem and flowers
      { tex: T.leafLemon, col: [156, 196, 84], w: 0.24, leaf: 1.05 }                        // «Лимонный»: narrow and pale
    ];
    // the little leaves of the Greek one, spread over a ball
    const BALL = [...Array(20)].map((_, i) => { const y = 1 - (i + 0.5) / 20 * 1.6, r = Math.sqrt(Math.max(0, 1 - y * y)), q = i * 2.4; return norm([Math.cos(q) * r, y, Math.sin(q) * r]); });
    // a small bush has four pairs
    const SMALL = PAIRS.slice(0, 3).concat([[0.9, 0.2, -0.45]]);
    let taps = 0, pos = 0, last = null, chosen = [0, 0, 0];
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      glow: [176, 110, 255], orbit: [0.75, 0.42], rad: 5, near: 4.2, look: [0, 1.15, 0], still: 1,
      tap() { taps++; },
      tick(t) {
        const target = Math.floor(t / STEP) + taps;
        pos = last == null || reduce.matches ? target : pos + (target - pos) * Math.min(1, (t - last) * 3.2);
        last = t;
      },
      lights() { return [{ p: [chosen[0], 2.3, chosen[2]], col: [0.75, 0.62, 1], i: 1.4, fall: 0.35 }]; },
      draw(t) {
        KINDS.forEach((k, i) => {
          const d = wrap(i - pos), w = Math.max(0, 1 - Math.abs(d) * 1.4), q = S.ang + d * Math.PI * 2 / N;
          const x = Math.cos(q) * RAD, z = Math.sin(q) * RAD, lift = smooth(w) * 0.22;
          if (w > 0.5) chosen = [x, 0, z];
          // the ones at the back, small in the fog, have leaves of one colour
          const flat = Math.abs(d) > 0.6 ? k.col : null;
          box(R, [x, 0.2, z], [0.2, 0.2, 0.2], { tex: T.stone });
          const earth = pot(R, T, x, z, 0.4 + lift, 0.72, undefined, 6), b = [x, earth, z], yaw = w * t * 0.9;
          if (k.ball) {
            rod(R, b, [x, earth + 0.2, z], 0.02, { col: [70, 128, 48] });
            BALL.forEach((F, j) => leaf(R, add([x, earth + 0.34, z], mul(F, 0.08)), norm(add(F, [Math.sin(t * 1.3 + j) * 0.08, 0, 0])), 0.16, T.leaf, { w: 0.46, flat }));
          } else {
            const top = bush(R, T, b, t + i, { s: 0.74, tex: k.tex, stem: k.stem, leaf: k.leaf, w: k.w, yaw, pairs: SMALL, flat });
            if (k.spike) {
              prism(R, top[0], top[2], top[1], top[1] + 0.26, 0.035, 0.004, 5, { col: [150, 70, 176] });
              for (let j = 0; j < 4; j++) ball(R, [top[0], top[1] + 0.04 + j * 0.06, top[2]], 0.035 - j * 0.005, { col: [196, 120, 220] });
            }
          }
          // the beam over the chosen one
          if (w > 0.05) prism(R, x, z, 0.4, 3.4, 0.34, 0.1, 6, { col: [120, 86, 210], emis: true, nofog: true, add: 0.12 * w });
        });
      },
      fx(t, F) {
        F.halo([chosen[0], 1.2, chosen[2]], 0.6, 'rgba(160,120,255,.22)', 'rgba(160,120,255,0)');
        for (let i = 0; i < 14; i++) {
          const life = (i / 14 + t * 0.22) % 1, q = i * 2.4 + t;
          F.dot([chosen[0] + Math.cos(q) * 0.3, 0.5 + life * 2.4, chosen[2] + Math.sin(q) * 0.3], `rgba(214,190,255,${(1 - life) * 0.8})`);
        }
      }
    };
  });
