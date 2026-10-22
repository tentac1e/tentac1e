  // Мой базилик: your own bush on a sill under an arched window; outside it the sun goes over and the night comes with
  // its stars and moon; beside the pot an hourglass runs down the time to the next task and turns itself over
  scene('grimoire', 'moy', S => {
    const { R, T } = S, DAY = 18, RUN = 7.8, FLIP = 0.8, EVERY = 9.2, SILL = 0.965, Z = -0.4;
    const HG = [0.5, 0.04];
    let sun = [0, 1.6, Z + 0.02], day = 1, sand = 0, flip = 0;
    const at = t => ((t % EVERY) + EVERY) % EVERY;
    return {
      glow: [230, 110, 200], orbit: [Math.PI / 2, 0.4], rad: 4.3, near: 3.6, look: [0, 1.5, 0], still: 4,
      tick(t) {
        const s = (t % DAY) / DAY, a = s < 0.6 ? s / 0.6 * Math.PI : (s - 0.6) / 0.4 * Math.PI;
        day = s < 0.6 ? Math.sin(a) : 0;
        sun = [-Math.cos(a) * 0.38, 1.35 + Math.sin(a) * 0.8, Z + 0.03];
        const u = at(t);
        sand = Math.min(1, u / RUN);
        flip = u < RUN ? 0 : smooth((u - RUN) / FLIP);
      },
      lights() { return [{ p: [sun[0], sun[1], 0.1], col: day > 0 ? [1, 0.8, 0.5] : [0.55, 0.65, 1], i: day > 0 ? 0.5 + 0.8 * day : 0.55, fall: 0.5 }]; },
      draw(t) {
        // the wall under the window, the sill, the posts and the arch
        box(R, [0, 0.45, Z + 0.05], [0.95, 0.45, 0.12], { tex: T.stone });
        box(R, [0, SILL - 0.035, -0.1], [1.0, 0.035, 0.34], { tex: T.stone });
        box(R, [-0.66, 1.62, Z + 0.05], [0.1, 0.66, 0.12], { tex: T.stone });
        box(R, [0.66, 1.62, Z + 0.05], [0.1, 0.66, 0.12], { tex: T.stone });
        const C = [0, 2.28, Z + 0.17], n = 7;
        for (let i = 0; i < n; i++) {
          const a0 = i / n * Math.PI, a1 = (i + 1) / n * Math.PI;
          const P = (a, r, dz) => [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r, C[2] + dz];
          quad(R, P(a0, 0.76, 0), P(a0, 0.56, 0), P(a1, 0.56, 0), P(a1, 0.76, 0), { tex: T.stone, ds: true }, 0, 1, i / n, (i + 1) / n);
          quad(R, P(a0, 0.56, 0), P(a0, 0.56, -0.24), P(a1, 0.56, -0.24), P(a1, 0.56, 0), { tex: T.stone, ds: true }, 0, 1, 0, 0.3);
          quad(R, P(a0, 0.76, 0), P(a1, 0.76, 0), P(a1, 0.76, -0.24), P(a0, 0.76, -0.24), { tex: T.stone, ds: true }, 0, 1, 0, 0.3);
        }
        // the sky in the window: the night, and the day added over it while the sun is up
        const sky = (o, lift = 0) => {
          quad(R, [-0.56, SILL, Z + lift], [0.56, SILL, Z + lift], [0.56, 2.28, Z + lift], [-0.56, 2.28, Z + lift], o, 0, 1, 0.35, 1);
          for (let i = 0; i < 6; i++) {
            const a0 = i / 6 * Math.PI, a1 = (i + 1) / 6 * Math.PI;
            R.tri([0, 2.28, Z + lift], [Math.cos(a0) * 0.56, 2.28 + Math.sin(a0) * 0.56, Z + lift], [Math.cos(a1) * 0.56, 2.28 + Math.sin(a1) * 0.56, Z + lift], { ...o, uv: [[0.5, 0.35], [0.5 + Math.cos(a0) / 2, 0.35 - Math.sin(a0) * 0.35], [0.5 + Math.cos(a1) / 2, 0.35 - Math.sin(a1) * 0.35]] });
          }
        };
        sky({ tex: T.sky, emis: true, nofog: true, ds: true });
        if (day > 0) sky({ col: [96, 120, 200], emis: true, nofog: true, ds: true, add: 0.75 * day }, 0.005);
        ball(R, sun, day > 0 ? 0.1 : 0.075, { col: day > 0 ? [255, 214, 120] : [214, 222, 255], emis: true, nofog: true });
        // the pot and its bush
        const earth = pot(R, T, -0.3, 0.02, SILL, 0.85);
        bush(R, T, [-0.3, earth, 0.02], t, { s: 0.95 });
        // the hourglass: two plates, three posts, the glass, the sand running down; turned over when it has run out
        const K = 1.5, y = v => SILL + v * K, M = [HG[0], y(0.21), HG[1]], H = turned(R, M, [0, 0, 1], flip * Math.PI);
        const [x, z] = HG, wood = { col: [112, 70, 42] }, f = flip > 0 ? 1 : sand;
        prism(H, x, z, y(0), y(0.025), 0.1 * K, 0.1 * K, 6, wood, [96, 60, 36]);
        prism(H, x, z, y(0.395), y(0.42), 0.1 * K, 0.1 * K, 6, wood, [96, 60, 36]);
        for (let i = 0; i < 3; i++) { const q = i / 3 * Math.PI * 2 + 0.5; rod(H, [x + Math.cos(q) * 0.082 * K, y(0.02), z + Math.sin(q) * 0.082 * K], [x + Math.cos(q) * 0.082 * K, y(0.4), z + Math.sin(q) * 0.082 * K], 0.012, wood, 3); }
        const gold = { col: [226, 180, 84] };
        if (f > 0.02) prism(H, x, z, y(0.025), y(0.025 + 0.15 * f), 0.062 * K, (0.062 * (1 - f) + 0.004) * K, 7, gold);
        if (f < 0.98) prism(H, x, z, y(0.215), y(0.215 + 0.15 * (1 - f)), 0.006 * K, (0.012 + 0.05 * (1 - f)) * K, 7, gold, [236, 196, 100]);
        if (!flip && f > 0 && f < 1) rod(H, [x, y(0.215), z], [x, y(0.03 + 0.15 * f), z], 0.005, { col: [236, 196, 100], emis: true }, 3);
        const glass = { col: [140, 150, 170], emis: true, nofog: true, add: 0.2, layer: 2 };
        prism(H, x, z, y(0.025), y(0.21), 0.075 * K, 0.012 * K, 7, glass);
        prism(H, x, z, y(0.21), y(0.395), 0.012 * K, 0.075 * K, 7, glass);
      },
      fx(t, F) {
        F.halo(sun, day > 0 ? 0.45 : 0.3, day > 0 ? `rgba(255,190,90,${0.2 + 0.25 * day})` : 'rgba(150,170,255,.24)', 'rgba(150,170,255,0)');
        // the stars in the window twinkle at night
        if (day < 0.3) for (let i = 0; i < 12; i++) {
          const x = ((i * 0.618) % 1 - 0.5) * 1, y = SILL + 0.35 + ((i * 0.37) % 1) * 1.4;
          if (Math.abs(x) < 0.5 && (y < 2.28 || Math.hypot(x, y - 2.28) < 0.5)) F.dot([x, y, Z + 0.02], `rgba(240,230,255,${(0.3 + 0.6 * Math.abs(Math.sin(t * 1.7 + i * 2.3))) * (1 - day / 0.3)})`, 1);
        }
      }
    };
  });
