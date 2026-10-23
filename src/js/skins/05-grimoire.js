  /* ------------------------------------------------------------------ */
  /* «Гримуар»: the crypt by candlelight round every scene — a circle of  */
  /* runes on the floor in the colour of the chapter, pillars in the dark, */
  /* seven candles on the points of the star; drawn at the console's      */
  /* resolution and cut down to its colours                               */
  /* ------------------------------------------------------------------ */
  world('grimoire', {
    raster: () => ({ px: 3, maxW: 400, levels: 16, fogNear: 3.5, fogFar: 15, amb: [0.13, 0.1, 0.17] }),
    textures: () => textures(),
    key: { dir: norm([-0.35, 0.85, -0.4]), i: 0.42, col: [0.55, 0.5, 0.85] },
    sky: ['#07050B', '#1C1122', '#120B17'],
    defaults: { glow: [255, 70, 50] },
    make(S, sc) {
      const { R, T } = S;
      const FLOOR = floorTex(sc.glow, false), GLOW = floorTex(sc.glow, true);
      // the candles and the pillars on the camera's side stay away: next to the lens they would stand big and dark at
      // the edge of the picture
      const off = q => Math.abs(((q - sc.orbit[0]) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      const ring = sc.bare ? [] : [...Array(7)].map((_, i) => { const q = -Math.PI / 2 + i / 7 * Math.PI * 2; return { q, x: Math.cos(q) * 2.95, z: Math.sin(q) * 2.95, h: 0.38 + ((i * 37) % 10) / 22, ph: i * 1.7 }; }).filter(c => off(c.q) > 0.8);
      const candles = ring.concat(sc.candles || []);
      const embers = [...Array(candles.length ? 46 : 0)].map((_, i) => ({ k: i % candles.length, a: (i * 0.37) % 1, s: 0.3 + (i * 13 % 10) / 22, dx: ((i * 29) % 11 - 5) / 60, dz: ((i * 17) % 11 - 5) / 60 }));
      const pillars = [...Array(8)].map((_, i) => { const q = 0.35 + i / 8 * Math.PI * 2; return { q, x: Math.cos(q) * 7.4, z: Math.sin(q) * 7.4, h: 1.6 + ((i * 53) % 10) / 4 }; }).filter(p => off(p.q) > 1.1);
      return {
        lights: t => candles.map(c => ({ p: [c.x, (c.top || 0) + c.h + 0.14, c.z], col: [1, 0.6, 0.28], i: 0.5 + 0.12 * Math.sin(t * 11 + c.ph) + 0.08 * Math.sin(t * 23 + c.ph * 2), fall: 0.55 })),
        draw(t) {
          if (!sc.bare) {
            // the floor and its circle: a layer of their own, under everything
            const FL = 4.4, N = 2, glowA = sc.glowAdd ? sc.glowAdd(t) : 0.32 + 0.22 * Math.sin(t * 1.4);
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
              const x0 = -FL + i * FL * 2 / N, x1 = x0 + FL * 2 / N, z0 = -FL + j * FL * 2 / N, z1 = z0 + FL * 2 / N;
              quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: FLOOR, layer: 0, ds: true }, i / N, (i + 1) / N, j / N, (j + 1) / N);
              quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: GLOW, layer: 0, add: glowA, ds: true }, i / N, (i + 1) / N, j / N, (j + 1) / N);
            }
            for (let k = 0; k < 4; k++) {
              const q = k * Math.PI / 2, far = 16, s = [Math.cos(q), Math.sin(q)], tn = [-s[1], s[0]];
              const p = (a, b) => [s[0] * a + tn[0] * b, 0, s[1] * a + tn[1] * b];
              quad(R, p(FL, -FL), p(far, -far), p(far, far), p(FL, FL), { col: [30, 22, 36], layer: 0, ds: true });
            }
            pillars.forEach(p => box(R, [p.x, p.h / 2, p.z], [0.32, p.h / 2, 0.32], { tex: T.stone }));
          }
          candles.forEach((c, i) => {
            const y0 = c.top || 0;
            prism(R, c.x, c.z, y0, y0 + c.h, 0.085, 0.075, 6, { tex: T.wax }, [236, 226, 200], i);
            const fl = 1 + 0.18 * Math.sin(t * 13 + c.ph) + 0.1 * Math.sin(t * 29 + c.ph);
            billboard(R, [c.x, y0 + c.h + 0.1 * fl, c.z], 0.05, 0.1 * fl, { tex: T.flame, emis: true, nofog: true, cut: true });
          });
        },
        // the halos of the flames and the sparks going up from them
        fx(t, F) {
          candles.forEach(c => F.halo([c.x, (c.top || 0) + c.h + 0.1, c.z], 0.42, 'rgba(255,150,60,.34)', 'rgba(255,120,40,0)'));
          embers.forEach(e => {
            const c = candles[e.k], life = (e.a + t * e.s * 0.25) % 1;
            F.spark([c.x + e.dx * life * 8, (c.top || 0) + c.h + 0.15 + life * 1.6, c.z + e.dz * life * 8], life);
          });
        }
      };
    },
    // the colour depth of the console
    post: R => R.post(16)
  });

  // the stone altar with its sigil: gives the height of its top
  function altarStone(R, T) {
    box(R, [0, 0.48, 0], [0.8, 0.48, 0.5], { tex: T.stone, texFront: T.altar, skip: 'top' });
    box(R, [0, 1.02, 0], [0.92, 0.06, 0.6], { tex: T.stone });
    return 1.08;
  }
  // the signs of alchemy, pixel by pixel (16 × 16, nothing around them): mercury, sulphur, salt, saturn, earth, air
  function glyphTex(kind, col) {
    return tex(16, 16, t => {
      const { put, line } = t;
      const ring = (cx, cy, r) => { for (let a = 0; a < 64; a++) { const q = a / 64 * Math.PI * 2; put(cx + Math.cos(q) * r, cy + Math.sin(q) * r, col); } };
      if (kind === 0) { ring(8, 7, 3.2); line(8, 11, 8, 15, col); line(6, 13, 10, 13, col); for (let a = 0; a < 20; a++) { const q = Math.PI + a / 20 * Math.PI; put(8 + Math.cos(q) * 3.5, 2.5 + Math.sin(q) * 1.8, col); } }
      if (kind === 1) { line(3, 9, 8, 1, col); line(8, 1, 13, 9, col); line(3, 9, 13, 9, col); line(8, 9, 8, 15, col); line(5, 12, 11, 12, col); }
      if (kind === 2) { ring(8, 8, 5.5); line(2, 8, 14, 8, col); }
      if (kind === 3) { line(6, 1, 6, 12, col); line(3, 4, 9, 4, col); line(6, 8, 10, 8, col); line(10, 8, 11, 12, col); line(11, 12, 9, 15, col); }
      if (kind === 4) { line(2, 3, 14, 3, col); line(2, 3, 8, 14, col); line(14, 3, 8, 14, col); line(4, 7, 12, 7, col); }
      if (kind === 5) { line(2, 13, 8, 2, col); line(8, 2, 14, 13, col); line(2, 13, 14, 13, col); line(4, 9, 12, 9, col); }
    });
  }
