  // Уход: над кругом камней идёт солнце, и куст поворачивается за ним, а его тень на мху — от солнца; потом луна.
  // Раз в день приходит туча и поливает куст, на листьях блестит роса
  scene('druid', 'uhod', S => {
    const { R, T } = S, DAY = 24, RAIN = 5;
    let orb = [0, 3, 0], day = 1, rise = 1, cloud = null, wet = 0, lean = [0, 0];
    return {
      rad: 4.9, near: 4.6, look: [0, 1.2, 0], still: 4, shafts: false,
      tick(t) {
        const s = (t % DAY) / DAY, sun = s < 0.72, a = sun ? s / 0.72 * Math.PI : (s - 0.72) / 0.28 * Math.PI, up = Math.sin(a);
        day = sun ? up : 0;
        // the sun and the moon go down into the horizon and come up out of it: small there, never jumping across; the
        // light of the sky goes over from the moon's to the sun's and back without a jump
        rise = smooth(up / 0.3);
        orb = [-Math.cos(a) * 2.6, 1.6 + up * 2, -0.9];
        R.key = { dir: norm(sub(orb, [0, 1, 0])), i: 0.3 + (sun ? 0.75 * day : 0.12 * rise), col: mix3([0.55, 0.7, 1], [1, 0.88, 0.66], sun ? smooth(day / 0.3) : 0) };
        const want = sun ? [orb[0] * 0.09 * day, 0] : [0, 0];
        lean = reduce.matches ? want : [lean[0] + (want[0] - lean[0]) * 0.04, 0];
        const rainAt = Math.floor((t - 5) / DAY) * DAY + 5, r = t - rainAt;
        // the cloud comes in and goes, swelling out of nothing and melting away at the side
        cloud = r >= 0 && r < RAIN ? { x: r < 1.2 ? -2.8 * (1 - smooth(r / 1.2)) : r > RAIN - 1.2 ? 2.8 * smooth((r - RAIN + 1.2) / 1.2) : 0, k: smooth(r / 0.7) * (1 - smooth((r - RAIN + 0.7) / 0.7)), rain: r > 1 && r < RAIN - 1 } : null;
        wet = r < 0 ? 0 : r < RAIN ? Math.min(1, Math.max(0, r - 1.2) / 2) : Math.max(0, 1 - (r - RAIN) / 9);
      },
      lights() { return [{ p: orb, col: day > 0 ? [1, 0.86, 0.55] : [0.6, 0.72, 1], i: rise * (day > 0 ? 0.6 + day : 0.5), fall: 0.1 }]; },
      draw(t) {
        // the shadow of the bush on the moss, away from the sun
        const sh = [-orb[0] * 0.18, 0, -orb[2] * 0.18], k = day > 0 ? 0.6 * day : 0.2;
        for (let i = 0; i < 10; i++) { const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2; R.tri([sh[0], 0.01, sh[2]], [sh[0] + Math.cos(a0) * 0.7, 0.01, sh[2] + Math.sin(a0) * 0.4], [sh[0] + Math.cos(a1) * 0.7, 0.01, sh[2] + Math.sin(a1) * 0.4], { col: [10 * (1 - k) + 8, 16 * (1 - k) + 10, 12 * (1 - k) + 8], layer: 0.5, ds: true, emis: true }); }
        const top = stump(R, T, 0, 0, 0.42, 0.36);
        disc(R, 0, 0, top + 0.005, 0.3, 9, { col: [64 - wet * 30, 46 - wet * 22, 30 - wet * 14] });
        bush(R, T, [0, top, 0], t, { s: 1.2, lean });
        if (rise > 0.02) ball(R, orb, (day > 0 ? 0.22 : 0.16) * rise, { col: day > 0 ? [255, 222, 140] : [220, 230, 255], emis: true, nofog: true });
        if (cloud && cloud.k > 0.02) [[0, 0, 0.3], [0.26, -0.06, 0.24], [-0.28, -0.05, 0.24], [0.12, 0.12, 0.2], [-0.12, 0.1, 0.2]].forEach(([dx, dy, r]) => ball(R, [cloud.x + dx * cloud.k, 3 + dy * cloud.k, dx * 0.3], r * cloud.k, { col: [86, 96, 104] }));
      },
      fx(t, F) {
        if (rise > 0.02) F.halo(orb, (day > 0 ? 1.3 : 0.7) * rise, day > 0 ? `rgba(255,214,140,${(0.22 + 0.3 * day) * rise})` : `rgba(170,190,255,${0.24 * rise})`, 'rgba(255,214,140,0)');
        if (cloud && cloud.rain) for (let i = 0; i < 32; i++) {
          const k = (t * 1.6 + i * 0.37) % 1, x = cloud.x + ((i * 0.61) % 1 - 0.5) * 0.8, z = ((i * 0.43) % 1 - 0.5) * 0.6;
          F.streak([x, 2.85 - k * 1.5, z], 0.14, 'rgba(170,210,255,.7)');
        }
        // the dew on the leaves, brighter just after the rain
        if (wet > 0.05) for (let i = 0; i < 10; i++) { const q = i * 2.1 + 0.4, y = 0.55 + (i % 5) * 0.16; F.dot([Math.cos(q) * 0.3, y, Math.sin(q) * 0.3], `rgba(220,245,255,${wet * (0.5 + 0.5 * Math.sin(t * 3 + i))})`, 1); }
      }
    };
  });
