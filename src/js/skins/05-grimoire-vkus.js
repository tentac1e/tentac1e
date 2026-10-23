  // Вкус и кухня: pesto made as a rite — a stone mortar on a kitchen table, the pestle grinding round in it, leaves of basil
  // falling into the green, garlic, pine nuts and a phial of oil beside it; out of the mortar rises the aroma, a
  // molecule of eugenol going up and fading. Now and then a handful of leaves falls in
  scene('grimoire', 'vkus', S => {
    const { R, T } = S, mol = molShape('eug');
    let top = 1.08, hands = [];
    const FALL = [...Array(7)].map((_, i) => ({ a: i / 7, x: ((i * 0.61) % 1 - 0.5) * 0.5, z: ((i * 0.37) % 1 - 0.5) * 0.4, s: 0.7 + (i % 3) * 0.12 }));
    // a leaf tumbling down from above into the mortar, k — how far it has fallen
    const falling = (R, x, z, k, spin) => {
      const y = 3.1 - k * (3.1 - top - 0.28);
      const F = norm([Math.cos(spin), Math.sin(spin * 0.7) * 0.8, Math.sin(spin)]);
      leaf(R, [x * (1 - k * 0.6), y, z * (1 - k * 0.6)], F, 0.26, T.leaf, { side: [Math.sin(spin * 1.3), 0.5, Math.cos(spin * 1.3)] });
    };
    return {
      glow: [200, 236, 96], near: 4.4, look: [0, 1.7, 0], still: 2.4,
      every: 6, beat(t) { hands.push(t); if (hands.length > 3) hands.shift(); },
      lights(t) { return [{ p: [0.2, top + 1.1, 0.5], col: [1, 0.8, 0.5], i: 1 + 0.1 * Math.sin(t * 2), fall: 0.6 }, { p: [0, top + 0.5, 0], col: [0.6, 1, 0.4], i: 0.5, fall: 2 }]; },
      draw(t) {
        // a kitchen table of old wood, and all on it drawn together: the legs, the top, then what stands on it, each
        // by its own depth — the big face of the top, by its own depth, went over the inside of the mortar, and the
        // legs over its corners (the tops of the legs, under it, are left out)
        top = 1.06;
        const part = together(R, [0, top, 0]), On = part(2);
        box(part(1), [0, top - 0.04, 0], [0.88, 0.04, 0.58], { col: [124, 80, 46] });
        [[-0.74, -0.46], [0.74, -0.46], [0.74, 0.46], [-0.74, 0.46]].forEach(([x, z]) => box(part(0), [x, (top - 0.08) / 2, z], [0.06, (top - 0.08) / 2, 0.06], { col: [96, 60, 34], skip: 'top' }));
        const y0 = top, y1 = top + 0.42;
        // the mortar: its outer wall, the rim, the far inner wall, the green inside
        prism(On, 0, 0, y0, y1, 0.36, 0.48, 10, { tex: T.stone });
        ringTop(On, 0, 0, y1, 0.38, 0.48, 10, { tex: T.stone });
        prism(On, 0, 0, y0 + 0.16, y1, 0.28, 0.38, 10, { col: [92, 82, 98], inv: true });
        disc(On, 0, 0, y0 + 0.2, 0.31, 10, { tex: T.paste });
        // the pestle grinding round
        const a = t * 1.7, b = [Math.cos(a) * 0.13, y0 + 0.25, Math.sin(a) * 0.13], q = [Math.cos(a) * 0.36, y0 + 0.92, Math.sin(a) * 0.36];
        rod(On, b, q, 0.05, { col: [184, 172, 160] }, 6);
        ball(On, b, 0.07, { col: [184, 172, 160] });
        // the garlic, the pine nuts, the oil
        [[0, 0, 0.07], [0.06, -0.01, 0.05], [-0.05, -0.01, 0.05], [0.01, 0.02, 0.05]].forEach(([dx, dz, r]) => egg(On, [0.66 + dx, top + r * 0.9, 0.3 + dz], [r, r * 1.1, r], 0, { col: [232, 222, 202] }));
        for (let i = 0; i < 6; i++) egg(On, [0.6 + (i % 3) * 0.06, top + 0.02, -0.34 + (i >> 1 & 1) * 0.06 + (i > 3 ? 0.06 : 0)], [0.028, 0.018, 0.016], i, { col: [228, 204, 150] });
        prism(On, -0.66, -0.26, top, top + 0.26, 0.09, 0.08, 6, { col: [196, 150, 40], emis: true, add: 0.6 });
        prism(On, -0.66, -0.26, top + 0.26, top + 0.38, 0.03, 0.028, 5, { col: [196, 150, 40], emis: true, add: 0.5 });
        prism(On, -0.66, -0.26, top + 0.37, top + 0.42, 0.035, 0.035, 5, { col: [110, 70, 40] }, [90, 56, 32]);
        // the leaves falling in: a steady few, and a handful now and then
        FALL.forEach((f, i) => { const k = (f.a + t * 0.22) % 1; falling(On, f.x, f.z, smooth(k), t * f.s * 2 + i); });
        hands = hands.filter(h => t - h < 1.6 && t >= h);
        hands.forEach(h => { for (let i = 0; i < 6; i++) { const k = smooth(Math.min(1, (t - h) / 1.2 - i * 0.04)); if (k > 0) falling(On, Math.cos(i * 1.1) * 0.35, Math.sin(i * 1.1) * 0.3, k, t * 2 + i); } });
        // the aroma: the molecule going up out of the mortar and fading as it goes
        if (mol) {
          const k = (t * 0.11) % 1;
          essence(R, mol, [0, y1 + 0.35 + k * 1.2, 0], t * 0.6, 1.2, Math.sin(k * Math.PI) * 0.9);
        }
      },
      fx(t, F) {
        const k = (t * 0.11) % 1, my = top + 0.42 + 0.35 + k * 1.2;
        F.halo([0, my, 0], 0.5, `rgba(155,107,214,${0.26 * Math.sin(k * Math.PI)})`, 'rgba(155,107,214,0)');
        for (let i = 0; i < 16; i++) {
          const l = (i / 16 + t * 0.18) % 1, q = i * 2.4 + t * 0.5;
          F.dot([Math.cos(q) * (0.1 + l * 0.3), top + 0.5 + l * 1.4, Math.sin(q) * (0.1 + l * 0.3)], `rgba(${i % 2 ? '210,236,120' : '236,214,140'},${0.75 * (1 - l)})`);
        }
      }
    };
  });
