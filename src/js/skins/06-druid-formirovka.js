  // Прищипка и сбор: куст на старом пне, его верхушка растёт; золотой серп друида кружит рядом, как молодой месяц,
  // спускается и срезает верхушку над парой листьев. Верхушка падает в мох, а из пазух той пары выходят два побега —
  // куст растёт вширь, а не вверх. Потом мох забирает срезанное, и всё снова. Касание — взмах серпа
  scene('druid', 'formirovka', S => {
    const { R, T } = S, CYCLE = 12, SW = 4.6, s = 1.15;
    let off = 0, cut = [0, 1.6, 0], sick = [1, 2, 0], tip = null, phase = 0, top = 0.5;
    const at = t => (((t + off) % CYCLE) + CYCLE) % CYCLE;
    // the main stem: three nodes with their pairs, the cut above the third
    const NODES = [[0.2, 0.42, 0.12], [0.42, 0.36, 0], [0.62, 0.3, -0.12]];
    const pair = (R2, c, len, pitch, k, t, g = 1) => {
      for (let j = 0; j < 2; j++) {
        const yaw = k * Math.PI / 2 + j * Math.PI + 0.3 + Math.sin(t * 1.3 + k + j) * 0.05;
        leaf(R2, c, norm([Math.cos(yaw) * Math.cos(pitch), -Math.sin(pitch) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pitch)]), len * s * g, T.leaf);
      }
    };
    // the top above the cut: a stem and two pairs, grown g
    const topShoot = (R2, c, g, t) => {
      if (g <= 0) return;
      const h = 0.34 * s * g;
      rod(R2, c, [c[0], c[1] + h, c[2]], 0.02 * s, { col: [86, 146, 56] });
      pair(R2, [c[0], c[1] + h * 0.45, c[2]], 0.26, -0.15, 3, t, g);
      pair(R2, [c[0], c[1] + h * 0.95, c[2]], 0.16, -0.6, 4, t, g);
    };
    return {
      near: 4.4, look: [0, 1.15, 0], still: 7.5, clear: 1.6,
      tap(t) { const u = at(t); if (u > 1.5 && u < SW - 0.6) off += SW - 0.6 - u; },
      tick(t) {
        const u = at(t);
        phase = u;
        // the sickle: round the bush, then down through the stem and away
        const idle = [Math.cos(t * 0.6) * 1.05, cut[1] + 0.45 + Math.sin(t * 1.1) * 0.08, Math.sin(t * 0.6) * 1.05];
        const w = smooth((u - SW + 0.9) / 0.6) * (1 - smooth((u - SW - 0.3) / 0.8)), k = smooth((u - SW + 0.3) / 0.6);
        sick = mix3(idle, mix3(add(cut, [-0.5, 0.12, 0.05]), add(cut, [0.5, 0.02, -0.05]), k), w);
        // it turns as it circles and turns to its cut during the swing: to the whole turn nearest to where it stood when the
        // swing began (a turn by t·(1 − w) would spin it round dozens of times in the swing, a minute into the page)
        const turns = Math.round((t - u + SW - 0.9) * 1.4 / (Math.PI * 2)) * Math.PI * 2;
        tip = { w, spin: t * 1.4 * (1 - w) + turns * w };
      },
      lights() { return [{ p: add(sick, [0, 0.25, 0.2]), col: [1, 0.86, 0.5], i: 1.1, fall: 0.5 }]; },
      draw(t) {
        top = stump(R, T, 0, 0, 0.5, 0.5);
        disc(R, 0, 0, top + 0.004, 0.36, 9, { col: [58, 40, 28] });
        const b = [0, top, 0], u = phase;
        cut = [0, top + 0.62 * 0.85 * s + 0.02, 0];
        rod(R, b, cut, 0.03 * s, { col: [70, 128, 48] });
        NODES.forEach(([f, len, pitch], k) => pair(R, [0, top + 0.85 * s * f, 0], len, pitch, k, t));
        // the top: growing before the cut, falling after it, lying in the moss till the moss takes it
        if (u < SW) topShoot(R, cut, smooth(u / (SW - 0.8)), t);
        else if (u < 10.6) {
          const f = smooth((u - SW) / 1.6), land = [0.95, 0.06, 0.4];
          topShoot(turned(R, add(cut, [0, 0.15, 0]), [0.3, 0, 1], -f * 1.45, mul(sub(land, cut), f)), cut, 1 - smooth((u - 9.4) / 1.2), t);
        }
        // the two new shoots from the axils of the last pair
        const gs = u < SW ? 0 : u < 10.6 ? smooth((u - SW - 0.4) / 3.2) : 1 - smooth((u - 10.6) / 1.2);
        if (gs > 0) for (let j = 0; j < 2; j++) {
          const yaw = Math.PI + j * Math.PI + 0.3, d = norm([Math.cos(yaw) * 0.6, 0.8, Math.sin(yaw) * 0.6]);
          const base = [0, top + 0.85 * s * 0.62, 0], end = add(base, mul(d, 0.34 * s * gs));
          rod(R, base, end, 0.018 * s, { col: [92, 150, 60] });
          for (let i = 0; i < 2; i++) { const q = yaw + Math.PI / 2 + i * Math.PI; leaf(R, end, norm([Math.cos(q), 0.25, Math.sin(q)]), 0.22 * s * gs, T.leaf); }
          leaf(R, end, norm(add(d, [0, 0.4, 0])), 0.12 * s * gs, T.leafLemon, { w: 0.4 });
        }
        // the sickle: a crescent of gold, its edge bright, a haft of oak bound with a cord
        const q = tip.spin, U = [Math.cos(q), 0, Math.sin(q)], V = norm(mix3([0, 1, 0], [-Math.sin(q), 0, Math.cos(q)], tip.w * 0.85));
        const P = (a, r, o) => add(add(sick, mul(U, Math.cos(a) * r + o)), mul(V, Math.sin(a) * r));
        for (let i = 0; i < 9; i++) {
          const a0 = -0.4 + i / 9 * 2.9, a1 = -0.4 + (i + 1) / 9 * 2.9;
          quad(R, P(a0, 0.4, 0), P(a1, 0.4, 0), P(a1, 0.32, 0.09), P(a0, 0.32, 0.09), { col: [226, 180, 76], ds: true });
          rod(R, P(a0, 0.4, 0), P(a1, 0.4, 0), 0.012, { col: [255, 236, 170], emis: true, nofog: true }, 3);
        }
        const end = P(2.5, 0.36, 0.045), dir = norm(sub(end, P(2.3, 0.36, 0.045)));
        rod(R, end, add(end, mul(dir, 0.3)), 0.032, { col: [110, 78, 50] });
        rod(R, add(end, mul(dir, 0.04)), add(end, mul(dir, 0.1)), 0.036, { col: [196, 176, 132] });
      },
      fx(t, F) {
        const u = phase;
        F.halo(sick, 0.55, 'rgba(255,220,140,.3)', 'rgba(255,220,140,0)');
        // the cut: sap and bits of leaf flying
        if (u > SW - 0.05 && u < SW + 0.7) for (let i = 0; i < 14; i++) {
          const l = (u - SW + 0.05) / 0.75, q = i * 0.45;
          F.dot([cut[0] + Math.cos(q) * l * 0.5, cut[1] + Math.sin(i * 1.7) * l * 0.3 + l * 0.1, cut[2] + Math.sin(q) * l * 0.4], `rgba(190,240,120,${1 - l})`, 2);
        }
        // the moss taking the cut top: a cold light going up out of it
        if (u > 9.2 && u < 10.8) for (let i = 0; i < 14; i++) { const l = (u - 9.2) / 1.6, q = i * 0.9; F.dot([0.95 + Math.cos(q) * 0.2, 0.05 + l * 0.6 + (i % 4) * 0.05, 0.4 + Math.sin(q) * 0.2], `rgba(143,232,198,${Math.sin(l * Math.PI)})`, 1.6); }
      }
    };
  });
