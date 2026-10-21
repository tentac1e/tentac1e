  // Проблемы: the bush on the altar under siege — beetles creep in round the circle towards it and are thrown back by
  // the ward with a red flash, a spider comes down on its thread and climbs back, one lower leaf has gone yellow with
  // brown spots. A tap raises the ward: every beetle is thrown back at once
  scene('grimoire', 'problemy', S => {
    const { R, T } = S, N = 6, OUT = 2.45, IN = 1.25, CRAWL = 9;
    let warded = -99, flash = 0, bugs = [], spider = [0.3, 3, 0.12];
    return {
      glow: [255, 44, 44], near: 4.8, still: 5.3,
      glowAdd(t) { return 0.3 + 0.18 * Math.sin(t * 1.4) + flash * 0.6; },
      tap(t) { warded = t; },
      tick(t) {
        // each beetle creeps in along a spiral and is flung back at the ward; a tap flings them all
        const l = (t - warded) / 1.4, push = l < 0 || l > 1 ? 0 : l < 0.15 ? l / 0.15 : 1 - (l - 0.15) / 0.85;
        flash = push;
        bugs = [...Array(N)].map((_, i) => {
          const k = ((t / CRAWL + i / N) % 1), r = OUT - (OUT - IN) * k * (1 - 0.85 * push);
          const q = i / N * Math.PI * 2 + t * 0.14 + k * 1.2;
          if (k > 0.95) flash = Math.max(flash, (k - 0.95) / 0.05);
          return { x: Math.cos(q) * r, z: Math.sin(q) * r, yaw: q + Math.PI / 2 + 0.35, k, i };
        });
        const d = 0.5 - 0.5 * Math.cos(t * 0.45);
        spider = [0.36, 3.15 - d * 0.75, 0.16];
      },
      lights() { return [{ p: [0, 0.6, 0], col: [1, 0.25, 0.2], i: 0.5 + flash * 1.6, fall: 0.25 }, { p: [spider[0] + 0.3, spider[1] + 0.2, spider[2] + 0.4], col: [0.7, 0.6, 1], i: 0.6, fall: 1.2 }]; },
      draw(t) {
        const top = altarStone(R, T), earth = pot(R, T, 0, 0, top);
        bush(R, T, [0, earth, 0], t, { texAt: k => (k === 0 ? T.leafSick : T.leaf) });
        // the beetles: a shell, a head, six legs walking
        bugs.forEach(b => {
          const c = [b.x, 0.1, b.z], f = [Math.cos(b.yaw), 0, Math.sin(b.yaw)], sd = [-f[2], 0, f[0]];
          egg(R, c, [0.21, 0.1, 0.14], b.yaw, { col: [128, 100, 160] });
          egg(R, add(c, mul(f, 0.2)), [0.075, 0.07, 0.075], b.yaw, { col: [70, 54, 84] });
          for (let j = 0; j < 6; j++) {
            const side = j < 3 ? 1 : -1, along = ((j % 3) - 1) * 0.09, st = Math.sin(t * 14 + j * 2.1 + b.i) * 0.04;
            const hip = add(add(c, mul(f, along)), mul(sd, side * 0.08)), foot = add(add(add(c, mul(f, along * 1.5 + st)), mul(sd, side * 0.22)), [0, -0.1, 0]);
            rod(R, hip, foot, 0.013, { col: [44, 32, 50] }, 3);
          }
        });
        // the spider on its thread
        rod(R, [spider[0], 4.4, spider[2]], spider, 0.005, { col: [210, 210, 220], emis: true }, 3);
        ball(R, spider, 0.08, { col: [90, 66, 110] });
        ball(R, add(spider, [0, 0.1, 0]), 0.05, { col: [70, 52, 86] });
        for (let j = 0; j < 8; j++) {
          const q = j / 8 * Math.PI * 2 + 0.2, kick = Math.sin(t * 6 + j) * 0.03;
          const knee = add(spider, [Math.cos(q) * 0.15, 0.09 + kick, Math.sin(q) * 0.15]), foot = add(spider, [Math.cos(q) * 0.24, -0.08, Math.sin(q) * 0.24]);
          rod(R, spider, knee, 0.01, { col: [60, 44, 72] }, 3);
          rod(R, knee, foot, 0.009, { col: [60, 44, 72] }, 3);
        }
      },
      fx(t, F) {
        // the beetles' red eyes, and the sparks where the ward strikes one
        bugs.forEach(b => {
          const f = [Math.cos(b.yaw), 0, Math.sin(b.yaw)];
          F.dot([b.x + f[0] * 0.27, 0.16, b.z + f[2] * 0.27], 'rgba(255,60,50,.95)', 2);
          if (b.k > 0.93) for (let i = 0; i < 10; i++) { const l = (b.k - 0.93) / 0.07, q = i * 0.63; F.spark([b.x + Math.cos(q) * l * 0.4, 0.1 + l * 0.5 * Math.abs(Math.sin(i)), b.z + Math.sin(q) * l * 0.4], l, true); }
        });
        F.dot(add(spider, [0.04, 0.03, 0.07]), 'rgba(255,60,50,.95)', 2);
        if (t - warded >= 0 && t - warded < 1.4) {
          const l = (t - warded) / 1.4;
          for (let i = 0; i < 40; i++) { const q = i / 40 * Math.PI * 2; F.spark([Math.cos(q) * (IN + l * 1.2), 0.05 + l * 0.3, Math.sin(q) * (IN + l * 1.2)], l, true); }
        }
      }
    };
  });
