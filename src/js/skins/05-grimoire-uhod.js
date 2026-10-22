  // Уход: the four the chapter is about. A sun crosses the vault and the bush turns after it, then a pale moon; a cloud
  // comes in and rains on the pot, the earth goes dark with the water and pales as it dries; the candles keep it
  // warm. A tap calls the rain now
  scene('grimoire', 'uhod', S => {
    const { R, T } = S, DAY = 24, RAIN = 5;
    let rainAt = -99, tapped = -99, orb = [0, 3, 0], day = 1, rise = 1, cloud = null, wet = 0, lean = [0, 0];
    const EARTH_DRY = [112, 82, 56], EARTH_WET = [34, 22, 18];
    const sky = t => {
      const s = (t % DAY) / DAY, a = s < 0.72 ? s / 0.72 * Math.PI : (s - 0.72) / 0.28 * Math.PI, up = Math.sin(a);
      day = s < 0.72 ? up : 0;
      // the sun and the moon go down into the horizon and come up out of it: small there, never jumping across
      rise = smooth(up / 0.3);
      // across the circle from east to west, a little behind the bush
      orb = [-Math.cos(a) * 2.3, 1.7 + up * 1.7, -0.7];
      return s < 0.72;
    };
    return {
      glow: [255, 196, 80], near: 4.6, look: [0, 1.7, 0], still: 4,
      tap(t) { tapped = t; },
      tick(t) {
        const sun = sky(t);
        // the light of the sky goes over from the moon's to the sun's and back without a jump
        R.key = { dir: norm(sub(orb, [0, 1.4, 0])), i: 0.22 + (sun ? 0.7 * day : 0.1 * rise), col: mix3([0.5, 0.6, 1], [1, 0.86, 0.6], sun ? smooth(day / 0.3) : 0) };
        // the bush leans after the sun, slowly, and stands up straight at night
        const want = sun ? [orb[0] * 0.09 * day, 0] : [0, 0];
        lean = mix3([lean[0], lean[1], 0], [want[0], want[1], 0], 0.04).slice(0, 2);
        if (reduce.matches) lean = want;
        // the rain: by itself once a day, or when tapped; the earth dries over the rest of the day
        const auto = Math.floor((t - 5) / DAY) * DAY + 5;
        rainAt = Math.max(auto, tapped);
        const r = t - rainAt;
        // the cloud comes in and goes, swelling out of nothing and melting away at the side
        cloud = r >= 0 && r < RAIN ? { x: r < 1.2 ? -2.6 * (1 - smooth(r / 1.2)) : r > RAIN - 1.2 ? 2.6 * smooth((r - RAIN + 1.2) / 1.2) : 0, k: smooth(r / 0.7) * (1 - smooth((r - RAIN + 0.7) / 0.7)), rain: r > 1 && r < RAIN - 1 } : null;
        wet = r < 0 ? 0 : r < RAIN ? Math.min(1, Math.max(0, r - 1.2) / 2) : Math.max(0, 1 - (r - RAIN) / 9);
      },
      lights() {
        return [{ p: orb, col: day > 0 ? [1, 0.82, 0.5] : [0.6, 0.7, 1], i: rise * (day > 0 ? 0.6 + day : 0.5), fall: 0.12 }];
      },
      draw(t) {
        box(R, [0, 0.36, 0], [0.46, 0.36, 0.46], { tex: T.stone, texFront: T.altar });
        const earth = pot(R, T, 0, 0, 0.72, 1.15, mix3(EARTH_DRY, EARTH_WET, wet).map(Math.round));
        bush(R, T, [0, earth, 0], t, { s: 1.2, lean });
        // the sun (or the moon) itself: it gives light, nothing lights it
        if (rise > 0.02) ball(R, orb, (day > 0 ? 0.2 : 0.14) * rise, { col: day > 0 ? [255, 214, 120] : [210, 220, 255], emis: true, nofog: true });
        if (cloud && cloud.k > 0.02) [[0, 0, 0.26], [0.22, -0.05, 0.2], [-0.24, -0.04, 0.2], [0.1, 0.1, 0.18], [-0.1, 0.08, 0.17]]
          .forEach(([dx, dy, r]) => ball(R, [cloud.x + dx * cloud.k, 2.85 + dy * cloud.k, dx * 0.3], r * cloud.k, { col: [78, 72, 104] }));
      },
      fx(t, F) {
        if (rise > 0.02) F.halo(orb, (day > 0 ? 1.1 : 0.6) * rise, day > 0 ? `rgba(255,190,90,${(0.2 + 0.25 * day) * rise})` : `rgba(150,170,255,${0.22 * rise})`, 'rgba(255,190,90,0)');
        if (cloud && cloud.rain) for (let i = 0; i < 30; i++) {
          const k = ((t * 1.6 + i * 0.37) % 1), x = cloud.x + ((i * 0.61) % 1 - 0.5) * 0.7, z = ((i * 0.43) % 1 - 0.5) * 0.5;
          F.streak([x, 2.7 - k * 1.2, z], 0.12, 'rgba(140,190,255,.85)');
        }
        // the splashes on the earth while it rains
        if (cloud && cloud.rain) for (let i = 0; i < 6; i++) { const q = i + t * 5; F.dot([Math.cos(q) * 0.3, 1.2, Math.sin(q * 1.3) * 0.3], 'rgba(190,220,255,.8)'); }
      }
    };
  });
