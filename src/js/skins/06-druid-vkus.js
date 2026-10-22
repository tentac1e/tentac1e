  // Вкус и кухня: котёл на треноге над костром, в нём зелёное варево; в котёл падают листья базилика, из пара поднимается
  // аромат — молекула эвгенола, ягоды омелы и рябины на веточках — и тает. Время от времени в котёл падает горсть листьев
  scene('druid', 'vkus', S => {
    const { R, T } = S, mol = molShape('eug'), RIM = 0.98;
    const PAL = { bond: [168, 124, 76], O: [236, 70, 52], C: [244, 240, 222], lo: true };
    const FALL = [...Array(6)].map((_, i) => ({ a: i / 6, x: ((i * 0.61) % 1 - 0.5) * 0.6, z: ((i * 0.37) % 1 - 0.5) * 0.5, s: 0.7 + (i % 3) * 0.12 }));
    let hands = [];
    // a leaf tumbling down from above into the cauldron, k — how far it has fallen
    const falling = (x, z, k, spin) => {
      const y = 3 - k * (3 - RIM - 0.02);
      leaf(R, [x * (1 - k * 0.7), y, z * (1 - k * 0.7)], norm([Math.cos(spin), Math.sin(spin * 0.7) * 0.8, Math.sin(spin)]), 0.24, T.leaf, { side: [Math.sin(spin * 1.3), 0.5, Math.cos(spin * 1.3)] });
    };
    return {
      near: 4.6, look: [0, 1.2, 0], still: 2.4, clear: 1.6, shafts: false,
      every: 6, beat(t) { hands.push(t); if (hands.length > 3) hands.shift(); },
      lights(t) { return [{ p: [0, 0.4, 0.1], col: [1, 0.62, 0.3], i: 1.5 + 0.25 * Math.sin(t * 9) + 0.15 * Math.sin(t * 23), fall: 0.5 }, { p: [0, RIM + 0.3, 0], col: [0.6, 1, 0.5], i: 0.4, fall: 2 }]; },
      draw(t) {
        campfire(R, T, 0, 0, 1.25, t);
        // the tripod of three poles, the chain, the bail of the cauldron
        for (let k = 0; k < 3; k++) { const q = k / 3 * Math.PI * 2 + 0.5; rod(R, [Math.cos(q) * 0.85, -0.02, Math.sin(q) * 0.85], [Math.cos(q) * 0.05, 1.95, Math.sin(q) * 0.05], 0.035, { col: [90, 66, 44] }, 5); }
        rod(R, [0, 1.9, 0], [0, RIM + 0.26, 0], 0.01, { col: [80, 80, 84] }, 3);
        for (let k = 0; k < 6; k++) { const a0 = k / 6 * Math.PI, a1 = (k + 1) / 6 * Math.PI; rod(R, [Math.cos(a0) * 0.37, RIM + Math.sin(a0) * 0.26, 0], [Math.cos(a1) * 0.37, RIM + Math.sin(a1) * 0.26, 0], 0.012, { col: [70, 70, 74] }, 3); }
        // the cauldron of black iron and the green in it
        prism(R, 0, 0, 0.5, 0.74, 0.18, 0.4, 10, { col: [36, 38, 42] });
        prism(R, 0, 0, 0.74, RIM, 0.4, 0.34, 10, { col: [42, 44, 48] });
        ringTop(R, 0, 0, RIM, 0.31, 0.37, 10, { col: [62, 64, 68] });
        disc(R, 0, 0, RIM - 0.03, 0.32, 10, { tex: T.paste });
        // the leaves falling in: a steady few, and a handful now and then
        FALL.forEach((f, i) => { const k = (f.a + t * 0.2) % 1; falling(f.x, f.z, smooth(k), t * f.s * 2 + i); });
        hands = hands.filter(h => t - h < 1.6 && t >= h);
        hands.forEach(h => { for (let i = 0; i < 6; i++) { const k = smooth(Math.min(1, (t - h) / 1.2 - i * 0.04)); if (k > 0) falling(Math.cos(i * 1.1) * 0.4, Math.sin(i * 1.1) * 0.35, k, t * 2 + i); } });
        // the aroma: the molecule going up out of the steam and fading as it goes
        if (mol) { const k = (t * 0.11) % 1; essence(R, mol, [0, RIM + 0.4 + k * 1.2, 0], t * 0.6, 1.25, Math.sin(k * Math.PI) * 0.95, PAL); }
      },
      fx(t, F) {
        const k = (t * 0.11) % 1;
        F.halo([0, RIM + 0.4 + k * 1.2, 0], 0.5, `rgba(255,236,190,${0.2 * Math.sin(k * Math.PI)})`, 'rgba(255,236,190,0)');
        F.halo([0, 0.3, 0], 0.9, 'rgba(255,150,70,.24)', 'rgba(255,150,70,0)');
        // the steam over the green, the sparks of the fire going up round the cauldron
        for (let i = 0; i < 14; i++) {
          const l = (i / 14 + t * 0.16) % 1, q = i * 2.4 + t * 0.5;
          F.dot([Math.cos(q) * (0.1 + l * 0.35), RIM + 0.05 + l * 1.3, Math.sin(q) * (0.1 + l * 0.35)], `rgba(214,232,220,${0.5 * (1 - l)})`, 2);
        }
        for (let i = 0; i < 10; i++) { const l = (i / 10 + t * 0.5) % 1, q = i * 1.7; F.spark([Math.cos(q) * (0.45 + l * 0.2), 0.3 + l * 1.4, Math.sin(q) * (0.45 + l * 0.2)], l); }
      }
    };
  });
