  // Мой базилик: куст читателя в горшке у плетня, на горшке — бирка. Над плетнём дугой лунный календарь, восемь фаз луны;
  // нынешняя больше и ярче всех, и куст стоит в её свете: в полнолуние светлее, в новолуние темнее. Фазы идут сами;
  // касание — следующая
  scene('druid', 'moy', S => {
    const { R, T } = S, N = 8, STEP = 3, FR = 1.15, A = 0.9, BACK = A + Math.PI;
    // the wattle: stakes on an arc behind the pot (on the far side from the camera), withies woven in and out of them
    const STAKES = [...Array(11)].map((_, i) => BACK - 1.05 + i / 10 * 2.1);
    const at = (q, r, y) => [Math.cos(q) * r, y, Math.sin(q) * r];
    const MOONS = [...Array(N)].map((_, i) => { const q = BACK - 0.95 + i / (N - 1) * 1.9, c = (i - (N - 1) / 2) / ((N - 1) / 2); return at(q, FR + 0.05, 1.42 + 0.22 * (1 - c * c)); });
    let taps = 0, pos = 0, last = null, frac = 0;
    const wrap = v => ((v % N) + N + N / 2) % N - N / 2;
    return {
      orbit: [A, 0.35], near: 4.1, rad: 4.5, look: [0, 0.95, 0], still: 13, clear: 1.6,
      tap() { taps++; },
      tick(t) {
        const target = Math.floor(t / STEP) + taps;
        pos = last == null || reduce.matches ? target : pos + (target - pos) * Math.min(1, (t - last) * 3);
        last = t;
        // the moonlight on the bush: as much as the moon of the moment is lit
        const p = ((Math.round(pos) % N) + N) % N;
        frac = (1 - Math.cos(p / N * Math.PI * 2)) / 2;
        R.key = { dir: R.key.dir, col: R.key.col, i: 0.25 + 0.65 * frac };
      },
      lights() { return [{ p: [0, 1.2, 0.3], col: [0.8, 0.92, 1], i: 0.3 + 0.7 * frac, fall: 0.7 }]; },
      draw(t) {
        STAKES.forEach((q, i) => rod(R, at(q, FR, -0.02), at(q, FR, 0.78 + (i % 2) * 0.06), 0.03, { col: [104, 78, 52] }, 5));
        [0.16, 0.32, 0.48, 0.64].forEach((y, row) => {
          for (let i = 0; i < STAKES.length - 1; i++) {
            const k = (i + row) % 2 ? 0.035 : -0.035;
            rod(R, at(STAKES[i], FR + k, y), at(STAKES[i + 1], FR - k, y + 0.02), 0.022, { col: [128 - row * 6, 98 - row * 4, 64] }, 4);
          }
        });
        // the pot with the reader's bush and its little wooden tag
        const earth = pot(R, T, 0, 0, 0, 1.1);
        bush(R, T, [0, earth, 0], t, { s: 1.1 });
        rod(R, [0.2, earth - 0.05, 0.12], [0.2, earth + 0.2, 0.12], 0.008, { col: [150, 116, 78] }, 3);
        box(R, [0.2, earth + 0.2, 0.12], [0.07, 0.035, 0.008], { col: [190, 156, 108] });
        // the moons of the calendar, the one of the moment big and bright
        MOONS.forEach((c, i) => {
          const w = Math.max(0, 1 - Math.abs(wrap(i - pos)) * 1.5);
          billboard(R, c, 0.09 + 0.07 * smooth(w), 0.09 + 0.07 * smooth(w), { tex: T.phases[i], emis: true, nofog: true, cut: true, add: 0.55 + 0.45 * w });
        });
      },
      fx(t, F) {
        MOONS.forEach((c, i) => {
          const w = Math.max(0, 1 - Math.abs(wrap(i - pos)) * 1.5);
          if (w > 0.05) F.halo(c, 0.42 * w, `rgba(200,230,240,${0.18 + 0.3 * frac})`, 'rgba(200,230,240,0)');
        });
        // the dew of the night on the leaves, more under a full moon
        for (let i = 0; i < 8; i++) { const q = i * 2.3, y = 0.72 + (i % 4) * 0.15; F.dot([Math.cos(q) * 0.28, y, Math.sin(q) * 0.28], `rgba(220,240,255,${frac * (0.4 + 0.4 * Math.sin(t * 2 + i))})`, 1); }
      }
    };
  });
