  // Гидропоника: родник между двух камней наполняет тихую заводь; посреди неё плавает коряга, на ней растёт куст, и его
  // белые корни висят в прозрачной воде. Со дна поднимаются пузырьки, по воде расходятся круги, а время от времени —
  // россыпь кругов и пузырьков
  scene('druid', 'gidro', S => {
    const { R, T } = S, POOL = 1.15, SP = -2.5;
    // the spring: where the water falls in, the two stones on either side of it
    const IN = [Math.cos(SP) * POOL * 0.92, Math.sin(SP) * POOL * 0.92], TOP = [Math.cos(SP) * 1.42, 0.5, Math.sin(SP) * 1.42];
    const ROOTS = [...Array(9)].map((_, i) => ({ q: i * 2.4, r: 0.1 + (i % 3) * 0.09, d: 0.22 + (i % 4) * 0.06 }));
    let taps = [], y = 0.06;
    return {
      rad: 4.8, near: 4.5, look: [0, 0.7, 0], still: 3, clear: 1.8,
      noGrass: (x, z) => Math.hypot(x - TOP[0], z - TOP[2]) < 0.6,
      every: 7, beat(t) { taps.push(t); if (taps.length > 3) taps.shift(); },
      lights() { return [{ p: [0, 0.3, 0], col: [0.5, 0.9, 1], i: 0.7, fall: 0.8 }]; },
      draw(t) {
        // the bottom of the pool seen through the water, the bank of stones round it, the face of the water
        disc(R, 0, 0, 0.004, POOL, 14, { col: [12, 34, 38], layer: 0.5 });
        disc(R, 0, 0, 0.008, POOL * 0.68, 14, { col: [20, 54, 58], layer: 0.55 });
        disc(R, 0, 0, 0.012, POOL, 14, { col: [70, 140, 150], emis: true, add: 0.12, layer: 0.6 });
        for (let i = 0; i < 18; i++) { const q = i / 18 * Math.PI * 2 + 0.2; egg(R, [Math.cos(q) * (POOL + 0.06), 0.03, Math.sin(q) * (POOL + 0.06)], [0.13, 0.07, 0.1], q, { col: [80 + (i % 3) * 8, 86 + (i % 3) * 8, 90] }); }
        [-0.32, 0.32].forEach((d, i) => { const q = SP + d; egg(R, [Math.cos(q) * 1.5, 0.28, Math.sin(q) * 1.5], [0.3, 0.42 - i * 0.08, 0.26], q, { col: [90, 94, 98] }); egg(R, [Math.cos(q) * 1.5, 0.56 - i * 0.08, Math.sin(q) * 1.5], [0.22, 0.1, 0.2], q, { col: [62, 98, 46] }); });
        // the stream of the spring falling from between the stones into the pool
        const sd = [-Math.sin(SP), 0, Math.cos(SP)], bot = [IN[0], 0.02, IN[1]];
        quad(R, add(TOP, mul(sd, -0.05)), add(TOP, mul(sd, 0.05)), add(bot, mul(sd, 0.08)), add(bot, mul(sd, -0.08)), { col: [150, 210, 224], emis: true, add: 0.4, ds: true, layer: 1.2 });
        // the rings on the water: two always going out from the driftwood, two more now and then, small ones where the
        // spring falls in
        const rings = [(t * 0.3) % 1, (t * 0.3 + 0.5) % 1].concat(...taps.map(h => [(t - h) / 2.4, (t - h) / 2.4 - 0.2]));
        rings.forEach(k => { if (k <= 0 || k >= 1) return; const r = 0.5 + k * (POOL - 0.55); ringTop(R, 0, 0, 0.014, r, r + 0.025, 22, { col: [170, 230, 240], emis: true, add: 0.55 * (1 - k), layer: 0.65 }); });
        [(t * 0.9) % 1, (t * 0.9 + 0.5) % 1].forEach(k => { const r = 0.05 + k * 0.3; ringTop(R, IN[0], IN[1], 0.014, r, r + 0.02, 12, { col: [190, 236, 246], emis: true, add: 0.5 * (1 - k), layer: 0.65 }); });
        // the driftwood rocking on the water, a pad of moss on it, the bush, its roots hanging down into the clear water
        y = 0.06 + Math.sin(t * 1.1) * 0.022;
        const roll = Math.sin(t * 0.8) * 0.03, a = [-0.62, y - roll, -0.14], b = [0.62, y + roll, 0.14];
        rod(R, a, b, 0.1, { col: [104, 80, 58] }, 6);
        rod(R, [0.3, y + 0.02, 0.07], [0.52, y + 0.2, -0.12], 0.035, { col: [96, 74, 52] }, 4);
        egg(R, [0, y + 0.08, 0], [0.18, 0.05, 0.12], 0.2, { col: [64, 104, 46] });
        bush(R, T, [0, y + 0.1, 0], t, { s: 1 });
        ROOTS.forEach((r, i) => {
          const w = Math.sin(t * 0.9 + i) * 0.03, m = [Math.cos(r.q) * r.r * 0.5 + w, -r.d * 0.45, Math.sin(r.q) * r.r * 0.5];
          rod(R, [Math.cos(r.q) * 0.06, y - 0.06, Math.sin(r.q) * 0.06], m, 0.012, { col: [196, 214, 204] }, 3);
          rod(R, m, [Math.cos(r.q) * r.r + w * 2, -r.d, Math.sin(r.q) * r.r], 0.008, { col: [176, 204, 200] }, 3);
        });
      },
      fx(t, F) {
        // the bubbles rising from the bottom round the roots, many more now and then; the shine of the moon on the water
        const more = taps.some(h => t >= h && t - h < 2) ? 26 : 10;
        for (let i = 0; i < more; i++) {
          const k = (t * (0.35 + (i % 4) * 0.08) + i * 0.37) % 1, q = i * 2.4, r = 0.15 + (i % 5) * 0.12;
          F.dot([Math.cos(q) * r + Math.sin(t * 2 + i) * 0.02, -0.32 + k * 0.33, Math.sin(q) * r], `rgba(210,250,255,${0.85 * (1 - k * 0.5)})`, 1.2);
        }
        F.halo([0.35, 0.02, 0.45], 0.45, 'rgba(200,230,255,.14)', 'rgba(200,230,255,0)');
        F.halo([IN[0], 0.1, IN[1]], 0.3, 'rgba(190,236,246,.22)', 'rgba(190,236,246,0)');
        for (let i = 0; i < 10; i++) { const k = (t * 1.4 + i / 10) % 1; F.streak(add(mix3(TOP, [IN[0], 0.02, IN[1]], k), [-Math.sin(SP) * ((i % 3) - 1) * 0.03, 0, Math.cos(SP) * ((i % 3) - 1) * 0.03]), 0.06, 'rgba(220,245,255,.6)'); }
      }
    };
  });
