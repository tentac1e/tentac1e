  // Удобрения: three flasks of the elements, N, P and K, on their stones round the altar, bubbling. In turn each sends
  // a drop of its light in an arc into the pot; the light climbs the stem and the leaves take its colour. A tap sends
  // the next one now
  scene('udobreniya', S => {
    const { R, T } = S, EVERY = 3.6, FLY = 1.3, CLIMB = 1.1;
    const COL = [[120, 140, 255], [255, 112, 64], [255, 206, 80]];
    const FL = [0, 1, 2].map(i => { const q = Math.PI / 2 + i / 3 * Math.PI * 2; return [Math.cos(q) * 1.15, Math.sin(q) * 1.15]; });
    let taps = [], drop = null, climb = null, earthY = 1.47;
    // the drop in flight: from the neck of its flask up and over into the earth
    const path = (k, u) => {
      const a = [FL[k][0], 1.12, FL[k][1]], b = [0, earthY + 0.02, 0], m = mul(add(a, b), 0.5);
      return [a[0] + (b[0] - a[0]) * u, m[1] + 0.95 - 0.95 * (2 * u - 1) ** 2 + (b[1] - a[1]) * (u - 0.5), a[2] + (b[2] - a[2]) * u];
    };
    return {
      glow: [140, 255, 96], near: 4.5, look: [0, 1.3, 0], still: 1.9,
      tap(t) { taps.push({ t, k: (taps.length + 1 + Math.floor(t / EVERY)) % 3 }); if (taps.length > 3) taps.shift(); },
      tick(t) {
        // the sends: one every few seconds by itself, in turn, and one at each tap
        const n = Math.floor(t / EVERY);
        const sends = [{ t: n * EVERY, k: n % 3 }, { t: (n - 1) * EVERY, k: (n + 2) % 3 }].concat(taps).filter(s => s.t <= t).sort((a, b) => b.t - a.t);
        drop = climb = null;
        for (const s of sends) {
          const u = t - s.t;
          if (!drop && u < FLY) drop = { k: s.k, p: path(s.k, smooth(u / FLY)) };
          else if (!climb && u >= FLY && u < FLY + CLIMB) climb = { k: s.k, f: (u - FLY) / CLIMB };
        }
      },
      lights(t) {
        const L = FL.map(([x, z], i) => ({ p: [x, 0.72, z], col: COL[i].map(v => v / 255), i: 0.55 + 0.1 * Math.sin(t * 3 + i), fall: 0.9 }));
        if (drop) L.push({ p: drop.p, col: COL[drop.k].map(v => v / 255), i: 1, fall: 0.8 });
        if (climb) L.push({ p: [0, earthY + 0.1 + climb.f * 0.9, 0.12], col: COL[climb.k].map(v => v / 255), i: 1.6 * Math.sin(climb.f * Math.PI), fall: 1.4 });
        return L;
      },
      draw(t) {
        const top = altarStone(R, T);
        earthY = pot(R, T, 0, 0, top);
        bush(R, T, [0, earthY, 0], t);
        FL.forEach(([x, z], i) => {
          box(R, [x, 0.25, z], [0.17, 0.25, 0.17], { tex: T.stone, texFront: T.letters[i] });
          // the flask: a bulb of glass round its glowing liquid, a neck
          ball(R, [x, 0.66, z], 0.12, { col: COL[i], emis: true });
          ball(R, [x, 0.7, z], 0.17, { col: [90, 110, 130], emis: true, nofog: true, add: 0.22, layer: 2 });
          prism(R, x, z, 0.83, 1.06, 0.05, 0.045, 6, { col: [90, 110, 130], emis: true, add: 0.25, layer: 2 });
          prism(R, x, z, 1.04, 1.1, 0.06, 0.06, 6, { col: [120, 84, 50] }, [80, 56, 34]);
        });
        if (drop) ball(R, drop.p, 0.06, { col: COL[drop.k], emis: true, nofog: true });
        if (climb) rod(R, [0, earthY, 0], [0, earthY + climb.f * 0.8, 0], 0.032, { col: COL[climb.k], emis: true, nofog: true });
      },
      fx(t, F) {
        FL.forEach(([x, z], i) => {
          F.halo([x, 0.68, z], 0.34, `rgba(${COL[i]},.26)`, `rgba(${COL[i]},0)`);
          for (let j = 0; j < 4; j++) { const k = (t * 0.7 + j / 4 + i * 0.3) % 1; F.dot([x + Math.sin(j * 2 + t * 3) * 0.05, 0.6 + k * 0.42, z], `rgba(255,255,255,${0.8 * (1 - k)})`, 1); }
        });
        if (drop) {
          F.halo(drop.p, 0.3, `rgba(${COL[drop.k]},.5)`, `rgba(${COL[drop.k]},0)`);
          for (let j = 1; j < 7; j++) F.dot(add(drop.p, [0, j * 0.03, 0]), `rgba(${COL[drop.k]},${0.7 - j * 0.1})`);
        }
        if (climb) F.halo([0, earthY + climb.f * 0.8, 0], 0.4, `rgba(${COL[climb.k]},.4)`, `rgba(${COL[climb.k]},0)`);
      }
    };
  });
