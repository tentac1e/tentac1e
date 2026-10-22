  // Удобрения: три котла на камнях вокруг куста, над каждым в пару висит его руна — ᚾ, ᛈ и ᚲ, азот, фосфор и калий.
  // По очереди котёл отдаёт свой свет земле: свет уходит под мох и бежит по корню к кусту, корень за ним светится,
  // потом свет поднимается по стеблю. Касание — следующий котёл сейчас
  scene('druid', 'udobreniya', S => {
    const { R, T } = S, EVERY = 3.8, FLOW = 1.5, CLIMB = 1.1, ROOT = [76, 56, 38];
    const COL = [[130, 196, 255], [255, 128, 82], [255, 210, 92]];
    const CA = [0, 1, 2].map(i => { const q = Math.PI / 2 + i / 3 * Math.PI * 2; return [Math.cos(q) * 1.4, Math.sin(q) * 1.4]; });
    // the root from the foot of a cauldron to the bush, just over the moss and bending a little: u 0…1 along it
    const root = (i, u) => {
      const [x, z] = CA[i], s = Math.sin(u * Math.PI) * 0.22 / 1.4, f = (1 - u) * 0.86;
      return [x * f - z * s, 0.025, z * f + x * s];
    };
    let taps = [], flow = null, climb = null, top = 0.3;
    return {
      rad: 5, near: 4.6, look: [0, 0.9, 0], still: 2.2, clear: 2,
      rune: t => 0.5 + 0.15 * Math.sin(t * 1.1) + (climb ? 0.6 * Math.sin(climb.f * Math.PI) : 0),
      tap(t) { taps.push({ t, k: (taps.length + 1 + Math.floor(t / EVERY)) % 3 }); if (taps.length > 3) taps.shift(); },
      tick(t) {
        // the sends: one every few seconds by itself, in turn, and one at each tap
        const n = Math.floor(t / EVERY);
        const sends = [{ t: n * EVERY, k: n % 3 }, { t: (n - 1) * EVERY, k: (n + 2) % 3 }].concat(taps).filter(s => s.t <= t).sort((a, b) => b.t - a.t);
        flow = climb = null;
        for (const s of sends) {
          const u = t - s.t;
          if (!flow && u < FLOW) flow = { k: s.k, f: u / FLOW };
          else if (!climb && u >= FLOW && u < FLOW + CLIMB) climb = { k: s.k, f: (u - FLOW) / CLIMB };
        }
      },
      lights(t) {
        const L = CA.map(([x, z], i) => ({ p: [x, 0.6, z], col: COL[i].map(v => v / 255), i: 0.4 + 0.08 * Math.sin(t * 3 + i), fall: 1.2 }));
        if (flow) L.push({ p: add(root(flow.k, flow.f), [0, 0.15, 0]), col: COL[flow.k].map(v => v / 255), i: 1, fall: 1.4 });
        if (climb) L.push({ p: [0, top + 0.1 + climb.f * 0.9, 0.12], col: COL[climb.k].map(v => v / 255), i: 1.6 * Math.sin(climb.f * Math.PI), fall: 1.4 });
        return L;
      },
      draw(t) {
        top = stump(R, T, 0, 0, 0.38, 0.3);
        disc(R, 0, 0, top + 0.004, 0.3, 9, { col: [58, 40, 28] });
        bush(R, T, [0, top, 0], t, { s: 1.05 });
        if (climb) rod(R, [0, top, 0], [0, top + climb.f * 0.8, 0], 0.03, { col: COL[climb.k], emis: true, nofog: true });
        CA.forEach(([x, z], i) => {
          // the root to the bush, lit behind the light running along it and going dark again
          for (let j = 0; j < 8; j++) {
            const u0 = j / 8, u1 = (j + 1) / 8, lit = flow && flow.k === i && flow.f >= u1 ? clamp(1 - (flow.f - u1) * 2, 0, 1) : 0;
            rod(R, root(i, u0), root(i, u1), 0.03 - j * 0.002, lit ? { col: mix3(ROOT, COL[i], lit), emis: true } : { col: ROOT }, 4);
          }
          // three stones under the cauldron, the embers between them
          for (let k = 0; k < 3; k++) { const q = k / 3 * Math.PI * 2 + i; egg(R, [x + Math.cos(q) * 0.2, 0.06, z + Math.sin(q) * 0.2], [0.09, 0.07, 0.08], q, { col: [88, 90, 94] }); }
          for (let k = 0; k < 4; k++) ball(R, [x + Math.cos(k * 1.7) * 0.07, 0.04, z + Math.sin(k * 1.7) * 0.07], 0.035, { col: [255, 120 + 40 * Math.sin(t * 6 + k) | 0, 40], emis: true, lo: true });
          // the cauldron: a belly of black iron, its rim, the liquid of its element; its rune floating in the steam
          prism(R, x, z, 0.12, 0.3, 0.13, 0.25, 9, { col: [38, 40, 44] });
          prism(R, x, z, 0.3, 0.44, 0.25, 0.21, 9, { col: [44, 46, 50] });
          ringTop(R, x, z, 0.44, 0.19, 0.235, 9, { col: [60, 62, 66] });
          disc(R, x, z, 0.42, 0.19, 9, { col: COL[i], emis: true });
          billboard(R, [x, 0.98 + Math.sin(t * 1.3 + i * 2) * 0.05, z], 0.13, 0.13, { tex: T.npk[i], emis: true, nofog: true, cut: true, add: flow && flow.k === i ? 1 : 0.6 });
        });
        if (flow) ball(R, root(flow.k, flow.f), 0.05, { col: COL[flow.k], emis: true, nofog: true });
      },
      fx(t, F) {
        CA.forEach(([x, z], i) => {
          F.halo([x, 0.46, z], 0.32, `rgba(${COL[i]},.3)`, `rgba(${COL[i]},0)`);
          F.halo([x, 0.98, z], 0.22, `rgba(${COL[i]},${flow && flow.k === i ? 0.45 : 0.2})`, `rgba(${COL[i]},0)`);
          for (let j = 0; j < 6; j++) { const k = (t * 0.5 + j / 6 + i * 0.3) % 1; F.dot([x + Math.sin(j * 2 + t * 1.5) * 0.08 * (1 + k), 0.46 + k * 0.5, z + Math.cos(j * 3 + t) * 0.06], `rgba(220,236,230,${0.5 * (1 - k)})`, 1.6); }
        });
        if (flow) F.halo(root(flow.k, flow.f), 0.3, `rgba(${COL[flow.k]},.55)`, `rgba(${COL[flow.k]},0)`);
        if (climb) F.halo([0, top + climb.f * 0.8, 0], 0.4, `rgba(${COL[climb.k]},.4)`, `rgba(${COL[climb.k]},0)`);
      }
    };
  });
