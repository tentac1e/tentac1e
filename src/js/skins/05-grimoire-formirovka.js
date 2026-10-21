  // Прищипка и сбор: a pot on an old stump, the top of the stem growing; a sickle circling it like a crescent moon
  // comes down and cuts the top above a pair of leaves; the top falls to the floor, and two new shoots come out of that
  // pair, so the bush grows wide instead of tall; then time goes back in a violet shimmer and it begins again. A tap
  // swings the sickle
  scene('grimoire', 'formirovka', S => {
    const { R, T } = S, CYCLE = 12, SW = 4.6, s = 1.15;
    let off = 0, cut = [0, 2.1, 0], sick = [1, 2.5, 0], tip = null, phase = 0;
    // the moment of the cycle: the sickle cuts at SW; a tap, once the top has grown, moves the cycle to the swing
    const at = t => (((t + off) % CYCLE) + CYCLE) % CYCLE;
    // the main stem: three nodes with their pairs, the cut above the third
    const NODES = [[0.2, 0.42, 0.12], [0.42, 0.36, 0], [0.62, 0.3, -0.12]];
    const pairAt = (b, h, len, pitch, k, t, g = 1) => {
      for (let j = 0; j < 2; j++) {
        const yaw = k * Math.PI / 2 + j * Math.PI + 0.3 + Math.sin(t * 1.3 + k + j) * 0.05;
        leaf(R, [b[0], b[1] + h, b[2]], norm([Math.cos(yaw) * Math.cos(pitch), -Math.sin(pitch) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pitch)]), len * s * g, T.leaf);
      }
    };
    // the top above the cut: a stem and two pairs, grown g
    const topShoot = (R2, c, g, t) => {
      if (g <= 0) return;
      const h = 0.34 * s * g;
      rod(R2, c, [c[0], c[1] + h, c[2]], 0.02 * s, { col: [86, 146, 56] });
      [[0.45, 0.26, -0.15, 3], [0.95, 0.16, -0.6, 4]].forEach(([f, len, pitch, k]) => {
        for (let j = 0; j < 2; j++) {
          const yaw = k * Math.PI / 2 + j * Math.PI + 0.3 + Math.sin(t * 1.3 + k + j) * 0.05;
          leaf(R2, [c[0], c[1] + h * f, c[2]], norm([Math.cos(yaw) * Math.cos(pitch), -Math.sin(pitch) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pitch)]), len * s * g, T.leaf);
        }
      });
    };
    return {
      glow: [176, 192, 255], near: 4.4, look: [0, 1.6, 0], still: 7.5,
      tap(t) { const u = at(t); if (u > 1.5 && u < SW - 0.6) off += SW - 0.6 - u; },
      tick(t) {
        const u = at(t);
        phase = u;
        // the sickle: round the altar, then down through the stem and away
        const idle = [Math.cos(t * 0.6) * 1.05, 2.55 + Math.sin(t * 1.1) * 0.08, Math.sin(t * 0.6) * 1.05];
        const w = smooth((u - SW + 0.9) / 0.6) * (1 - smooth((u - SW - 0.3) / 0.8)), k = smooth((u - SW + 0.3) / 0.6);
        const A = add(cut, [-0.5, 0.12, 0.05]), B = add(cut, [0.5, 0.02, -0.05]);
        sick = mix3(idle, mix3(A, B, k), w);
        tip = { w, spin: t * 1.4 * (1 - w) };
      },
      lights() { return [{ p: add(sick, [0, 0.25, 0.2]), col: [0.75, 0.8, 1], i: 1.1, fall: 0.5 }]; },
      draw(t) {
        // a stump with its rings, the pot on it
        const top = 0.92;
        prism(R, 0, 0, 0, top, 0.66, 0.56, 9, { col: [86, 58, 40] });
        disc(R, 0, 0, top, 0.56, 9, { col: [176, 136, 92] });
        [0.18, 0.34, 0.48].forEach(r => ringTop(R, 0, 0, top + 0.002, r, r + 0.025, 9, { col: [128, 92, 60] }));
        [0, 1, 2, 3].forEach(i => { const q = i * 1.6 + 0.4; prism(R, Math.cos(q) * 0.6, Math.sin(q) * 0.6, 0, 0.14, 0.12, 0.05, 5, { col: [80, 54, 38] }); });
        const earth = pot(R, T, 0, 0, top), b = [0, earth, 0], u = phase;
        const H = 0.62 * 0.85 * s;
        cut = [0, earth + H + 0.02, 0];
        rod(R, b, cut, 0.03 * s, { col: [70, 128, 48] });
        NODES.forEach(([f, len, pitch], k) => pairAt(b, 0.85 * s * f, len, pitch, k, t));
        // the top: growing before the cut, falling after it, lying on the floor till time turns back
        if (u < SW) topShoot(R, cut, smooth(u / (SW - 0.8)), t);
        else if (u < 10.6) {
          const f = smooth((u - SW) / 1.6), land = [0.9, 0.06, 0.35];
          topShoot(turned(R, add(cut, [0, 0.15, 0]), [0.3, 0, 1], -f * 1.45, mul(sub(land, cut), f)), cut, 1, t);
        }
        // the two new shoots from the axils of the last pair
        const gs = u < SW ? 0 : u < 10.6 ? smooth((u - SW - 0.4) / 3.2) : 1 - smooth((u - 10.6) / 1.2);
        if (gs > 0) for (let j = 0; j < 2; j++) {
          const yaw = 2 * Math.PI / 2 + j * Math.PI + 0.3, d = norm([Math.cos(yaw) * 0.6, 0.8, Math.sin(yaw) * 0.6]);
          const base = [0, earth + 0.85 * s * 0.62, 0], end = add(base, mul(d, 0.34 * s * gs));
          rod(R, base, end, 0.018 * s, { col: [92, 150, 60] });
          for (let i = 0; i < 2; i++) {
            const q = yaw + Math.PI / 2 + i * Math.PI;
            leaf(R, end, norm([Math.cos(q), 0.25, Math.sin(q)]), 0.22 * s * gs, T.leaf);
          }
          leaf(R, end, norm(add(d, [0, 0.4, 0])), 0.12 * s * gs, T.leafLemon, { w: 0.4 });
        }
        // the sickle: a crescent of iron and its haft
        const q = tip.spin, U = [Math.cos(q), 0, Math.sin(q)], V = norm(mix3([0, 1, 0], [-Math.sin(q), 0, Math.cos(q)], tip.w * 0.85));
        const P = (a, r, off) => add(add(sick, mul(U, Math.cos(a) * r + off)), mul(V, Math.sin(a) * r));
        for (let i = 0; i < 9; i++) {
          const a0 = -0.4 + i / 9 * 2.9, a1 = -0.4 + (i + 1) / 9 * 2.9;
          quad(R, P(a0, 0.4, 0), P(a1, 0.4, 0), P(a1, 0.32, 0.09), P(a0, 0.32, 0.09), { col: [206, 208, 228], ds: true });
          // the edge: a line of cold light
          rod(R, P(a0, 0.4, 0), P(a1, 0.4, 0), 0.012, { col: [236, 240, 255], emis: true, nofog: true }, 3);
        }
        const end = P(2.5, 0.36, 0.045);
        rod(R, end, add(end, mul(norm(sub(end, P(2.3, 0.36, 0.045))), 0.3)), 0.032, { col: [120, 76, 42] });
      },
      fx(t, F) {
        const u = phase;
        F.halo(sick, 0.55, 'rgba(190,200,255,.3)', 'rgba(190,200,255,0)');
        // the cut: sap and bits of leaf flying
        if (u > SW - 0.05 && u < SW + 0.7) for (let i = 0; i < 14; i++) {
          const l = (u - SW + 0.05) / 0.75, q = i * 0.45;
          F.dot([cut[0] + Math.cos(q) * l * 0.5, cut[1] + Math.sin(i * 1.7) * l * 0.3 + l * 0.1, cut[2] + Math.sin(q) * l * 0.4], `rgba(170,230,110,${1 - l})`, 2);
        }
        // time going back
        if (u > 10.5) for (let i = 0; i < 22; i++) { const l = (u - 10.5) / 1.5, q = i * 0.9 + t * 2; F.dot([Math.cos(q) * (0.3 + l * 0.4), cut[1] - 0.3 + (i % 7) * 0.1, Math.sin(q) * (0.3 + l * 0.4)], `rgba(200,150,255,${0.9 * Math.sin(l * Math.PI)})`, 2); }
      }
    };
  });
