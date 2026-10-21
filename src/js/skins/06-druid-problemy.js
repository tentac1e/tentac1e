  // Беды и защита: к кусту ползут слизни и жуки, но круг из ягод рябины их не пускает: у круга они останавливаются,
  // ягоды вспыхивают, и вредители поворачивают назад. На сухой ветке сидит ворон и вертит головой. Касание — ворон
  // взлетает и делает круг над поляной, а вредители разбегаются
  scene('druid', 'problemy', S => {
    const { R, T } = S, WARD = 0.82, Z = 1.4;
    const PERCH = [1.02, 1.62, -0.66], BUGS = [...Array(6)].map((_, i) => ({ q: i / 6 * Math.PI * 2 + 0.3, slug: i % 2 === 0, ph: i * 1.9 }));
    let scare = -99, shine = [];
    // the fright: up at once, held, going off slowly
    const fear = t => { const u = t - scare; return u < 0 ? 0 : u < 0.8 ? smooth(u / 0.8) : Math.max(0, 1 - (u - 0.8) / 3.5); };
    // how far a bug is from the middle: it comes up to the ring, stops, goes back, comes again
    const reach = (b, t) => WARD + 0.14 + smooth(0.5 + 0.5 * Math.cos(t * 0.42 + b.ph)) * 0.75 + fear(t) * 0.8;
    // where the raven is: on its branch, or on a round over the glade after a tap
    const raven = t => {
      const u = t - scare;
      if (u < 0 || u > 6.5) return { p: PERCH, fly: 0, dir: [-1, 0, 0.2] };
      const w = smooth(u / 0.9) * (1 - smooth((u - 5.4) / 1.1)), th = Math.atan2(PERCH[2], PERCH[0]) + u * 1.1;
      const P = v => mix3(PERCH, [Math.cos(th + v) * 2.1, 2.5 + Math.sin(u * 2) * 0.2, Math.sin(th + v) * 2.1], w);
      return { p: P(0), fly: w, dir: norm(sub(P(0.05), P(0))) };
    };
    return {
      rad: 4.6, near: 4.3, look: [0, 0.8, 0], still: 5, clear: 1.7,
      tap(t) { if (t - scare > 6.5) scare = t; },
      // the warm light of the ring lies on whatever comes up to it
      lights() { return [{ p: [0, 0.5, 0], col: [1, 0.62, 0.5], i: 1.5, fall: 0.6 }]; },
      draw(t) {
        const top = stump(R, T, 0, 0, 0.34, 0.26);
        disc(R, 0, 0, top + 0.004, 0.27, 9, { col: [58, 40, 28] });
        bush(R, T, [0, top, 0], t, { s: 1 });
        // the ring of rowan: clusters of red berries on the moss
        for (let i = 0; i < 20; i++) {
          const q = i / 20 * Math.PI * 2;
          for (let k = 0; k < 3; k++) ball(R, [Math.cos(q + k * 0.04) * (WARD + (k === 1 ? 0.04 : 0)), 0.035 + (k === 2 ? 0.04 : 0), Math.sin(q + k * 0.04) * (WARD + (k === 1 ? 0.04 : 0))], 0.035, { col: [210, 52, 34], lo: true });
        }
        // the slugs and the beetles, each facing the way it goes
        // the slugs and the beetles, each facing the way it goes; B — a point of the bug: f along it, w across, y up
        shine = [];
        BUGS.forEach(b => {
          const r = reach(b, t), r1 = reach(b, t + 0.05), out = r1 > r, q = b.q + Math.sin(t * 0.3 + b.ph) * 0.15;
          const c = [Math.cos(q) * r, 0, Math.sin(q) * r], yaw = q + (out ? 0 : Math.PI), d = [Math.cos(yaw), 0, Math.sin(yaw)], sd = [-d[2], 0, d[0]];
          const moving = Math.abs(r1 - r) > 0.002, B = (f, w, y) => add(c, add(add(mul(d, f * Z), mul(sd, w * Z)), [0, y * Z, 0]));
          if (b.slug) {
            const st = moving ? 1 + 0.12 * Math.sin(t * 5 + b.ph) : 1;
            egg(R, B(0, 0, 0.06), [0.2 * st * Z, 0.065 * Z, 0.085 * Z], yaw, { col: [186, 132, 72] });
            [-1, 1].forEach(k => { const h = B(0.16 * st, k * 0.03, 0.08), e = B(0.2 * st, k * 0.035, 0.17); rod(R, h, e, 0.009 * Z, { col: [196, 146, 86] }, 3); ball(R, e, 0.016 * Z, { col: [40, 30, 24], lo: true }); });
            shine.push(B(0.02, 0, 0.13));
          } else {
            egg(R, B(0, 0, 0.065), [0.12 * Z, 0.07 * Z, 0.09 * Z], yaw, { col: [52, 112, 96] });
            ball(R, B(0.12, 0, 0.055), 0.045 * Z, { col: [26, 34, 30] });
            for (let k = 0; k < 3; k++) for (const w of [-1, 1]) {
              const f = (k - 1) * 0.065, wig = moving ? Math.sin(t * 14 + k * 2 + w) * 0.025 : 0;
              rod(R, B(f, 0, 0.04), B(f * 2 + wig, w * 0.13, 0), 0.008 * Z, { col: [24, 28, 24] }, 3);
            }
            shine.push(B(-0.02, 0.03, 0.135));
          }
        });
        // the dead branch and the raven on it, or in the air
        rod(R, [1.3, -0.02, -0.72], [1.3, 1.5, -0.7], 0.05, { col: [96, 86, 76] }, 5);
        rod(R, [1.3, 1.36, -0.7], [0.9, 1.6, -0.64], 0.03, { col: [96, 86, 76] }, 4);
        rod(R, [1.3, 1.1, -0.7], [1.55, 1.35, -0.9], 0.02, { col: [96, 86, 76] }, 3);
        const rv = raven(t), d = rv.dir, side = norm(cross(d, [0, 1, 0])), p = add(rv.p, [0, 0.1, 0]), look = rv.fly ? 0 : Math.sin(t * 0.9) * 0.6;
        egg(R, p, [0.16, 0.09, 0.08], Math.atan2(d[2], d[0]), { col: [22, 24, 30] });
        const hd = add(add(p, mul(d, 0.15)), [0, 0.07, 0]), hl = norm(add(d, mul(side, look)));
        ball(R, hd, 0.06, { col: [26, 28, 34] });
        R.tri(add(hd, add(mul(hl, 0.04), [0, 0.012, 0])), add(hd, add(mul(hl, 0.04), [0, -0.016, 0])), add(hd, mul(hl, 0.13)), { col: [70, 70, 76], ds: true });
        R.tri(add(p, mul(d, -0.12)), add(add(p, mul(d, -0.3)), mul(side, 0.06)), add(add(p, mul(d, -0.3)), mul(side, -0.06)), { col: [18, 20, 26], ds: true });
        // the wings: folded along the body on the branch, beating in the air
        const flap = rv.fly ? Math.sin(t * 13) * 0.9 * rv.fly + 0.2 : -1.1;
        [-1, 1].forEach(sd => {
          const sh = add(p, [0, 0.04, 0]), out = add(mul(side, sd * Math.cos(flap) * 0.34), [0, Math.sin(flap) * 0.3, 0]);
          R.tri(add(sh, mul(d, 0.08)), add(sh, mul(d, -0.12)), add(add(sh, out), mul(d, -0.08)), { col: [28, 30, 38], ds: true });
        });
      },
      fx(t, F) {
        // the berries flaring where a bug has come up to the ring
        BUGS.forEach(b => {
          const near = 1 - (reach(b, t) - WARD - 0.14) / 0.3;
          if (near > 0) F.halo([Math.cos(b.q) * WARD, 0.08, Math.sin(b.q) * WARD], 0.28, `rgba(255,90,60,${0.5 * near})`, 'rgba(255,90,60,0)');
        });
        // the wet shine on the slugs' backs and the beetles' shells
        shine.forEach(p => F.dot(p, 'rgba(255,244,214,.55)', 1.3));
        const k = fear(t);
        if (k > 0) for (let i = 0; i < 20; i++) { const q = i / 20 * Math.PI * 2; F.dot([Math.cos(q) * WARD, 0.1 + k * 0.3, Math.sin(q) * WARD], `rgba(255,120,90,${k * 0.8})`, 1.4); }
      }
    };
  });
