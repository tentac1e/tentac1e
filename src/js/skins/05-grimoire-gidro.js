  // Гидропоника: a glass tank of water with a cold light in it, the bush in a net cup on its lid, white roots hanging
  // down into the water and swaying like weed, bubbles rising from the stone of the air pump. A tap lets out a burst
  // of bubbles
  scene('grimoire', 'gidro', S => {
    const { R, T } = S, TOP = 0.92, LID = 1.12;
    const ROOTS = [...Array(9)].map((_, i) => ({ q: i / 9 * Math.PI * 2 + 0.3, r: 0.03 + (i % 3) * 0.035, len: 0.55 + ((i * 7) % 5) / 14, ph: i * 1.3 }));
    const BUB = [...Array(22)].map((_, i) => ({ a: (i * 0.618) % 1, s: 0.35 + (i % 5) / 9, dx: ((i * 37) % 11 - 5) / 70, dz: ((i * 23) % 11 - 5) / 90 }));
    let bursts = [];
    const glass = { col: [70, 110, 130], emis: true, nofog: true, add: 0.12, layer: 2 };
    return {
      glow: [70, 200, 255], near: 4.2, look: [0, 1.15, 0], still: 3,
      tap(t) { bursts.push(t); if (bursts.length > 3) bursts.shift(); },
      lights(t) { return [{ p: [0, 0.5, 0.1], col: [0.3, 0.8, 1], i: 1 + 0.15 * Math.sin(t * 2.1), fall: 0.7 }]; },
      draw(t) {
        // the water: its far walls first, then its near ones and its surface, light added to what is behind
        box(R, [0, TOP / 2 + 0.01, 0], [0.6, TOP / 2, 0.4], { col: [24, 90, 130], emis: true, nofog: true, add: 0.3, inv: true, layer: 2 });
        box(R, [0, TOP / 2 + 0.01, 0], [0.6, TOP / 2, 0.4], { col: [30, 110, 150], emis: true, nofog: true, add: 0.26, layer: 2 });
        box(R, [0, 0.55, 0], [0.63, 0.55, 0.43], glass);
        // the frame of the tank: its twelve edges
        const X = 0.63, Y = 1.1, Z = 0.43, E = { col: [150, 170, 180] };
        [[-X, -Z], [X, -Z], [X, Z], [-X, Z]].forEach(([x, z]) => rod(R, [x, 0, z], [x, Y, z], 0.014, E, 3));
        [0, Y].forEach(y => { rod(R, [-X, y, -Z], [X, y, -Z], 0.014, E, 3); rod(R, [-X, y, Z], [X, y, Z], 0.014, E, 3); rod(R, [-X, y, -Z], [-X, y, Z], 0.014, E, 3); rod(R, [X, y, -Z], [X, y, Z], 0.014, E, 3); });
        // the lid, the net cup with its clay pebbles, the bush
        box(R, [0, LID, 0], [0.66, 0.025, 0.46], { col: [44, 40, 52] });
        prism(R, 0, 0, LID - 0.2, LID + 0.06, 0.13, 0.17, 8, { col: [64, 62, 72] }, [150, 92, 60]);
        bush(R, T, [0, LID + 0.06, 0], t, { s: 1.1 });
        // the roots: white threads from the cup into the water, swaying
        ROOTS.forEach(r => {
          let p = [Math.cos(r.q) * r.r, LID - 0.2, Math.sin(r.q) * r.r];
          for (let j = 1; j <= 6; j++) {
            const f = j / 6, sw = Math.sin(t * 0.9 + r.ph + j * 0.7) * 0.045 * f;
            const q = [Math.cos(r.q) * (r.r + f * 0.16) + sw, LID - 0.2 - f * r.len, Math.sin(r.q) * (r.r + f * 0.12) + Math.cos(t * 0.7 + r.ph + j) * 0.03 * f];
            rod(R, p, q, 0.014 * (1.2 - f * 0.6), { col: [226, 216, 190] }, 3);
            p = q;
          }
        });
        // the air stone and its tube out to the pump on the floor
        box(R, [0.32, 0.04, 0.1], [0.07, 0.03, 0.05], { col: [110, 104, 116] });
        rod(R, [0.38, 0.05, 0.1], [0.58, 0.05, 0.1], 0.012, { col: [60, 140, 120] }, 3);
        rod(R, [0.58, 0.05, 0.1], [0.58, 1.16, 0.1], 0.012, { col: [60, 140, 120] }, 3);
        rod(R, [0.58, 1.16, 0.1], [1.05, 0.14, 0.4], 0.012, { col: [60, 140, 120] }, 3);
        box(R, [1.05, 0.1, 0.4], [0.16, 0.1, 0.1], { col: [56, 52, 66] });
      },
      fx(t, F) {
        const up = (b, k, x0) => [x0 + b.dx * (1 + Math.sin(t * 3 + b.a * 9)), 0.08 + k * (TOP - 0.12), 0.1 + b.dz];
        BUB.forEach(b => { const k = (b.a + t * b.s * 0.4) % 1; F.dot(up(b, k, 0.32), `rgba(210,245,255,${0.4 + 0.5 * k})`); });
        bursts = bursts.filter(s => t - s < 2.2 && t >= s);
        bursts.forEach(s => {
          for (let i = 0; i < 26; i++) {
            const k = (t - s) / 2 - (i % 8) * 0.04;
            if (k <= 0 || k >= 1) continue;
            F.dot([((i * 0.37) % 1 - 0.5) * 0.9, 0.1 + k * (TOP - 0.15), ((i * 0.61) % 1 - 0.5) * 0.5], 'rgba(230,250,255,.9)', 2);
          }
        });
        // the shimmer of the surface
        for (let i = 0; i < 10; i++) F.dot([Math.sin(i * 1.7 + t * 0.8) * 0.5, TOP, Math.cos(i * 2.3 + t * 0.6) * 0.32], 'rgba(170,230,255,.55)');
      }
    };
  });
