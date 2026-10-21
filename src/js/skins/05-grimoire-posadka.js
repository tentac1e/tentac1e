  // Посадка: a seed comes down glowing into a well of earth and sinks; a sprout comes up — the hook, the two seed
  // leaves opening, the first true pair, the second — then goes back to the earth as sparks. Around the well six cups
  // of peat with seedlings, each a step behind the other; a tap sows again
  scene('grimoire', 'posadka', S => {
    const { R, T } = S, CYCLE = 10, EARTH = 0.36;
    let sown = 0, seed = null, burst = -1;
    const CUPS = [...Array(6)].map((_, i) => { const q = i / 6 * Math.PI * 2 + 0.26; return [Math.cos(q) * 1.55, Math.sin(q) * 1.55]; });
    return {
      glow: [255, 150, 50], rad: 4.6, near: 3.7, look: [0, 0.6, 0], still: 6.2,
      tap(t) { sown = t; },
      // a warm light over the well, and the seed's own while it comes down
      lights() { return [{ p: [0.2, 1.3, 0.5], col: [1, 0.72, 0.42], i: 0.9, fall: 0.7 }].concat(seed ? [{ p: seed, col: [1, 0.8, 0.4], i: 0.8, fall: 2 }] : []); },
      draw(t) {
        // the well: a ring of stone filled with earth
        prism(R, 0, 0, 0, EARTH, 0.74, 0.7, 10, { tex: T.stone });
        ringTop(R, 0, 0, EARTH, 0.62, 0.7, 10, { tex: T.stone });
        prism(R, 0, 0, EARTH - 0.12, EARTH, 0.62, 0.62, 10, { col: [44, 34, 40], inv: true });
        disc(R, 0, 0, EARTH - 0.04, 0.62, 10, { tex: T.soil });
        const u = ((t - sown) % CYCLE + CYCLE) % CYCLE;
        // the seed: down in a spiral, then into the earth
        seed = null;
        if (u < 2.4) {
          const k = smooth(u / 1.8), q = u * 3.2, r = 0.45 * (1 - k);
          const y = u < 1.8 ? 2.9 - (2.9 - EARTH - 0.03) * k : EARTH + 0.03 - (u - 1.8) / 0.6 * 0.08;
          seed = [Math.cos(q) * r, y, Math.sin(q) * r];
          egg(R, seed, [0.05, 0.035, 0.035], q, { col: [120, 78, 44] });
        }
        const g = (u - 2.4) / 5.6;
        if (u < 9.5) sprout(R, T, [0, EARTH - 0.04, 0], Math.min(1, g), 1.7, t);
        burst = u >= 9.3 ? (u - 9.3) / 0.7 : -1;
        // the cups of peat around: each seedling a step behind the one before it
        CUPS.forEach(([x, z], i) => {
          prism(R, x, z, 0, 0.2, 0.15, 0.19, 6, { col: [110, 70, 44] }, [52, 34, 24]);
          sprout(R, T, [x, 0.19, z], ((t / CYCLE + i / 6) % 1) * 1.25, 0.75, t + i);
        });
      },
      fx(t, F) {
        if (seed) {
          F.halo(seed, 0.32, 'rgba(255,200,90,.4)', 'rgba(255,160,60,0)');
          for (let i = 0; i < 6; i++) F.spark([seed[0], seed[1] + 0.05 + i * 0.07, seed[2]], i / 6);
        }
        // a puff of earth as the seed goes in, the sprout going back to it as sparks
        const u = ((t - sown) % CYCLE + CYCLE) % CYCLE;
        if (u > 1.8 && u < 2.6) for (let i = 0; i < 10; i++) { const q = i * 0.63, l = (u - 1.8) / 0.8; F.dot([Math.cos(q) * l * 0.3, EARTH + Math.sin(l * Math.PI) * 0.15, Math.sin(q) * l * 0.3], 'rgba(150,104,64,.9)'); }
        if (burst >= 0) for (let i = 0; i < 24; i++) { const q = i * 0.9, l = burst; F.spark([Math.cos(q) * (0.1 + l * 0.5), EARTH + 0.1 + (i % 6) * 0.09 + l * 0.8, Math.sin(q) * (0.1 + l * 0.5)], l, true); }
      }
    };
  });
