  // Главная: роща — на старом пне в середине круга растёт базилик, над ним медленно кружит венок из веточек с белыми
  // ягодами омелы, вокруг падают листья, летают светлячки. Касание — руны на камнях вспыхивают, по кругу проходит порыв
  // ветра, и листья кружатся быстрее
  scene('druid', 'glavnaya', S => {
    const { R, T } = S;
    let gust = -99;
    const g = t => (t >= gust ? Math.max(0, 1 - (t - gust) / 1.6) : 0);
    return {
      look: [0, 1.25, 0], near: 5.2, rad: 5.4, still: 3,
      tap(t) { gust = t; },
      rune: t => 0.5 + 0.15 * Math.sin(t * 1.1) + g(t) * 1.1,
      gust: t => g(t),
      lights(t) { return [{ p: [0, 2.3, 0], col: [1, 0.84, 0.55], i: 0.85 + 0.08 * Math.sin(t * 3), fall: 0.7 }]; },
      draw(t) {
        const top = stump(R, T, 0, 0, 0.46, 0.5);
        bush(R, T, [0, top, 0], t, { s: 1.15 });
        wreath(R, T, [0, 2.45, 0], 0.5, t * 0.22);
        // leaves falling round the circle, faster in a gust
        const k = g(t);
        for (let i = 0; i < 8; i++) {
          const l = (i / 8 + t * 0.06) % 1, q = i * 1.9 + t * (0.2 + k * 2), r = 1.2 + (i % 3) * 0.7;
          leaf(R, [Math.cos(q) * r, 3.4 - l * 3.3, Math.sin(q) * r], norm([Math.cos(t + i), Math.sin(t * 1.3 + i), Math.sin(t + i * 2)]), 0.14, i % 2 ? T.leafLemon : T.leaf, { side: [Math.sin(t * 2 + i), 0.4, Math.cos(t * 2 + i)] });
        }
      },
      fx(t, F) { F.halo([0, 2.4, 0], 0.8, 'rgba(255,220,150,.16)', 'rgba(255,220,150,0)'); }
    };
  });
