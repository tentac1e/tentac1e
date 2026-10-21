  // Посадка: семя падает в лунку у корней старого пня и уходит в землю; из лунки поднимается росток —
  // крючок, две семядоли, первая пара настоящих листьев, вторая — и снова уходит в землю светом. Вокруг во мху всходы,
  // каждый на шаг позади другого. Касание — посеять снова
  scene('druid', 'posadka', S => {
    const { R, T } = S, CYCLE = 10;
    let sown = 0, seed = null, burst = -1;
    // the camera stands on one side; the old stump behind the hole, its roots going round it into the moss
    const A = 0.5, D = [Math.cos(A), 0, Math.sin(A)], ST = mul(D, -0.85);
    const KIDS = [...Array(5)].map((_, i) => { const q = A - 1.5 + i / 4 * 3; return [Math.cos(q) * 1.2, Math.sin(q) * 1.2]; });
    const ROOTS = [-1.1, -0.45, 0.5, 1.15].map(d => { const q = A + Math.PI + d; return [0, 1, 2, 3].map(k => { const r = 0.42 + k * 0.32, b = d * k * 0.12; return [ST[0] + Math.cos(q - b) * r, 0.07 - k * 0.03, ST[2] + Math.sin(q - b) * r]; }); });
    return {
      orbit: [A, 0.4], rad: 4.4, near: 3.9, look: [0, 0.5, 0], still: 6.2, clear: 1.9,
      tap(t) { sown = t; },
      lights() { return [{ p: [0.3, 1.2, 0.6], col: [1, 0.86, 0.6], i: 0.7, fall: 0.6 }].concat(seed ? [{ p: seed, col: [1, 0.86, 0.5], i: 1, fall: 2 }] : []); },
      draw(t) {
        // the hole: a ring of dark earth in the moss
        disc(R, 0, 0, 0.012, 0.36, 10, { col: [40, 28, 19], layer: 0.5 });
        ringTop(R, 0, 0, 0.03, 0.36, 0.48, 10, { col: [52, 38, 26] });
        stump(R, T, ST[0], ST[2], 0.42, 0.62);
        ROOTS.forEach(P => P.slice(1).forEach((p, k) => rod(R, P[k], p, 0.06 - k * 0.015, { col: [76 - k * 3, 56 - k * 2, 38] }, 5)));
        const u = ((t - sown) % CYCLE + CYCLE) % CYCLE;
        seed = null;
        if (u < 2.4) {
          const k = smooth(u / 1.8), q = u * 3, r = 0.5 * (1 - k);
          const y = u < 1.8 ? 3 - (3 - 0.06) * k : 0.06 - (u - 1.8) / 0.6 * 0.1;
          seed = [Math.cos(q) * r, y, Math.sin(q) * r];
          egg(R, seed, [0.05, 0.07, 0.05], q, { col: [150, 104, 52] });
          egg(R, add(seed, [0, 0.05, 0]), [0.055, 0.03, 0.055], q, { col: [96, 70, 40] });
        }
        if (u < 9.5) sprout(R, T, [0, 0.02, 0], Math.min(1, (u - 2.4) / 5.6), 1.8, t);
        burst = u >= 9.3 ? (u - 9.3) / 0.7 : -1;
        // the seedlings in the moss round the hole, each on its own little mound
        KIDS.forEach(([x, z], i) => {
          egg(R, [x, 0.0, z], [0.16, 0.05, 0.16], i, { col: [46, 34, 24], lo: true });
          sprout(R, T, [x, 0.04, z], ((t / CYCLE + i / 5) % 1) * 1.25, 0.8, t + i);
        });
      },
      fx(t, F) {
        if (seed) {
          F.halo(seed, 0.36, 'rgba(255,214,120,.42)', 'rgba(255,190,90,0)');
          for (let i = 0; i < 6; i++) F.dot([seed[0], seed[1] + 0.06 + i * 0.07, seed[2]], `rgba(255,220,140,${0.8 - i * 0.12})`, 1);
        }
        const u = ((t - sown) % CYCLE + CYCLE) % CYCLE;
        if (u > 1.8 && u < 2.6) for (let i = 0; i < 10; i++) { const q = i * 0.63, l = (u - 1.8) / 0.8; F.dot([Math.cos(q) * l * 0.3, 0.04 + Math.sin(l * Math.PI) * 0.15, Math.sin(q) * l * 0.3], 'rgba(150,110,70,.9)'); }
        if (burst >= 0) for (let i = 0; i < 24; i++) { const q = i * 0.9, l = burst; F.dot([Math.cos(q) * (0.1 + l * 0.5), 0.1 + (i % 6) * 0.09 + l * 0.8, Math.sin(q) * (0.1 + l * 0.5)], `rgba(170,255,200,${1 - l})`, 1.5); }
      }
    };
  });
