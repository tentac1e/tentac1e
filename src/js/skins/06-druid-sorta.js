  // Сорта: пять сортов на пнях вокруг старого дуба. Выбранный стоит в столбе лунного света и светится; по кругу
  // выходит вперёд следующий
  scene('druid', 'sorta', S => {
    const { R, T } = S, N = 5, STEP = 6, RAD = 1.5, A = 0.75, O = [-Math.cos(A) * 0.5, 0, -Math.sin(A) * 0.5];
    const KINDS = [
      { tex: T.leaf, col: [84, 150, 56], leaf: 1.2 },                                       // «Генуэзский»: big leaves
      { tex: T.leafOpal, col: [98, 38, 96], stem: [96, 40, 98] },                           // «Тёмный опал»: purple
      { tex: T.leaf, col: [84, 150, 56], ball: true },                                      // «Греческий»: a ball of small leaves
      { tex: T.leafThai, col: [62, 124, 48], stem: [112, 48, 116], spike: true, leaf: 0.85 }, // «Тайский»: purple stem and flowers
      { tex: T.leafLemon, col: [156, 196, 84], w: 0.24, leaf: 1.05 }                        // «Лимонный»: narrow and pale
    ];
    const BALL = [...Array(20)].map((_, i) => { const y = 1 - (i + 0.5) / 20 * 1.6, r = Math.sqrt(Math.max(0, 1 - y * y)), q = i * 2.4; return norm([Math.cos(q) * r, y, Math.sin(q) * r]); });
    const SMALL = PAIRS.slice(0, 3).concat([[0.9, 0.2, -0.45]]);
    const glide = glider(1.6);
    let pos = 0, chosen = [0, 0, 0];
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      // the camera looks at the place in front where the chosen sort stands, the oak behind it
      orbit: [A, 0.4], rad: 4.6, near: 4.3, look: [Math.cos(A) * 0.6, 0.95, Math.sin(A) * 0.6], still: 1, clear: 2.1,
      tick(t) {
        const target = Math.floor(t / STEP);
        pos = glide(target, t);
      },
      lights() { return [{ p: [chosen[0], 1.9, chosen[2]], col: [0.75, 0.9, 1], i: 1.3, fall: 0.5 }]; },
      draw(t) {
        // the old oak in the middle of the ring, a little behind: a thick trunk, its roots, a dark crown above
        prism(R, O[0], O[2], 0, 2.9, 0.38, 0.26, 8, { tex: T.bark });
        [0, 1.3, 2.5, 3.8, 5.1].forEach(q => rod(R, [O[0] + Math.cos(q) * 0.4, 0.2, O[2] + Math.sin(q) * 0.4], [O[0] + Math.cos(q) * 0.9, -0.02, O[2] + Math.sin(q) * 0.9], 0.08, { col: [72, 52, 36] }, 5));
        [[0, 3.5, 0, 1.3], [0.8, 3.1, 0.4, 0.9], [-0.8, 3.2, -0.3, 0.95], [0.2, 3.3, -0.9, 0.85], [-0.3, 3.2, 0.9, 0.85]].forEach(([x, y, z, r], i) => egg(R, [O[0] + x, y, O[2] + z], [r, r * 0.7, r], i, { col: [28 + i * 3, 52 + i * 3, 34] }));
        KINDS.forEach((k, i) => {
          const d = wrap(i - pos), w = Math.max(0, 1 - Math.abs(d) * 1.4), q = A + d * Math.PI * 2 / N, sz = 0.78 + 0.22 * smooth(w);
          const x = O[0] + Math.cos(q) * RAD, z = O[2] + Math.sin(q) * RAD;
          if (w > 0.5) chosen = [x, 0, z];
          const flat = Math.abs(d) > 0.6 ? k.col : null;
          // every sort turns slowly on its stump at one speed (a turn by w·t would spin the one coming forward round in a moment)
          const top = stump(R, T, x, z, 0.26, 0.32 + smooth(w) * 0.06), b = [x, top, z], yaw = t * 0.35 + i * 1.3;
          if (k.ball) {
            rod(R, b, [x, top + 0.2, z], 0.02, { col: [70, 128, 48] });
            BALL.forEach((F, j) => leaf(R, add([x, top + 0.34 * sz, z], mul(F, 0.08 * sz)), norm(add(F, [Math.sin(t * 1.3 + j) * 0.08, 0, 0])), 0.16 * sz, T.leaf, { w: 0.46, flat }));
          } else {
            const tp = bush(R, T, b, t + i, { s: sz, tex: k.tex, stem: k.stem, leaf: k.leaf, w: k.w, yaw, pairs: SMALL, flat });
            if (k.spike) {
              prism(R, tp[0], tp[2], tp[1], tp[1] + 0.26, 0.035, 0.004, 5, { col: [150, 70, 176] });
              for (let j = 0; j < 4; j++) ball(R, [tp[0], tp[1] + 0.04 + j * 0.06, tp[2]], 0.035 - j * 0.005, { col: [196, 120, 220], lo: true });
            }
          }
        });
      },
      fx(t, F) {
        shaft(R, [chosen[0] + 0.5, 6, chosen[2] - 0.3], [chosen[0], 0, chosen[2]], 0.45, 0.16);
        F.halo([chosen[0], 0.9, chosen[2]], 0.7, 'rgba(190,230,255,.2)', 'rgba(190,230,255,0)');
        for (let i = 0; i < 12; i++) {
          const life = (i / 12 + t * 0.2) % 1, q = i * 2.4 + t;
          F.dot([chosen[0] + Math.cos(q) * 0.32, 0.4 + life * 2.2, chosen[2] + Math.sin(q) * 0.32], `rgba(214,240,255,${(1 - life) * 0.8})`, 1);
        }
      }
    };
  });
