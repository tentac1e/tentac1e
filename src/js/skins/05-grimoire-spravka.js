  // Справка: the grimoire itself — open on a stone lectern, its pages turning one by one in their own time, runes of
  // light circling it, a quill in its inkpot beside. A tap turns the page now
  scene('grimoire', 'spravka', S => {
    const { R, T } = S, EVERY = 5, TURN = 1.5, TILT = 0.5, O = [0, 1.0, 0];
    let off = 0, phi = 0;
    const at = t => (((t + off) % EVERY) + EVERY) % EVERY;
    // a page from the spine: three strips, the outer ones lagging behind the turn, a little bow along it
    function pageStrips(B, ang, tex, flip) {
      let p = [0, 0, 0], q0 = 0;
      for (let i = 0; i < 3; i++) {
        const a = ang + (ang > 0 && ang < Math.PI ? Math.sin(ang) * 0.35 * (i / 2) : 0);
        const d = [Math.cos(a) * 0.16, Math.sin(a) * 0.16 + (i === 0 ? 0.012 : i === 2 ? -0.012 : 0), 0];
        const n = add(p, d), q1 = (i + 1) / 3;
        const u0 = flip ? 1 - q1 : q0, u1 = flip ? 1 - q0 : q1;
        quad(B, add(add(p, [0, 0.06, 0]), [0, 0, 0.33]), add(add(n, [0, 0.06, 0]), [0, 0, 0.33]), add(add(n, [0, 0.06, 0]), [0, 0, -0.33]), add(add(p, [0, 0.06, 0]), [0, 0, -0.33]), { tex, ds: true }, flip ? u1 : u0, flip ? u0 : u1, 0, 1);
        p = n; q0 = q1;
      }
    }
    return {
      glow: [240, 190, 90], orbit: [Math.PI / 2, 0.38], rad: 4.2, near: 3.5, look: [0, 1.25, 0], still: 3.9,
      tap(t) { const u = at(t); if (u < EVERY - TURN - 0.2) off += EVERY - TURN - u; },
      tick(t) { phi = Math.PI * smooth((at(t) - (EVERY - TURN)) / TURN); },
      lights(t) { return [{ p: [0, 1.7, 0.3], col: [1, 0.8, 0.45], i: 0.7 + 0.1 * Math.sin(t * 2), fall: 0.8 }]; },
      draw(t) {
        box(R, [0, 0.42, 0], [0.18, 0.42, 0.18], { tex: T.stone });
        box(R, [0, 0.06, 0], [0.34, 0.06, 0.34], { tex: T.stone });
        // the board, the book and its pages, turned to the slope of the lectern; the book's spine along its slope
        const Bk = turned(R, [0, 0, 0], [1, 0, 0], TILT, O);
        box(Bk, [0, -0.04, 0], [0.8, 0.03, 0.44], { tex: T.stone });
        box(Bk, [0, 0.005, 0], [0.54, 0.012, 0.37], { tex: T.leather });
        box(Bk, [-0.25, 0.035, 0], [0.24, 0.022, 0.335], { col: [214, 196, 152] });
        box(Bk, [0.25, 0.035, 0], [0.24, 0.022, 0.335], { col: [214, 196, 152] });
        pageStrips(Bk, Math.PI, T.pageL, true);
        pageStrips(Bk, 0, T.pageR, false);
        if (phi > 0 && phi < Math.PI) pageStrips(Bk, phi, phi < Math.PI / 2 ? T.pageR : T.pageL, phi >= Math.PI / 2);
        // the inkpot and its quill on the corner of the board
        prism(Bk, 0.66, 0.24, -0.01, 0.1, 0.07, 0.06, 6, { col: [34, 28, 44] }, [12, 8, 18]);
        const qb = [0.66, 0.08, 0.24], qt = [0.8, 0.5, 0.12];
        rod(Bk, qb, qt, 0.008, { col: [226, 214, 196] }, 3);
        leaf(Bk, add(qb, mul(sub(qt, qb), 0.35)), norm(sub(qt, qb)), 0.36, T.feather, { w: 0.22, curl: 0.1, side: [0, 0, 1] });
        // the runes round the book
        for (let k = 0; k < 8; k++) {
          const q = t * 0.35 + k / 8 * Math.PI * 2;
          billboard(R, [Math.cos(q) * 1, 1.5 + Math.sin(t * 1.1 + k) * 0.12, Math.sin(q) * 0.75], 0.065, 0.065, { tex: T.runes[k % 6], emis: true, nofog: true, cut: true });
        }
      },
      fx(t, F) {
        for (let k = 0; k < 8; k++) {
          const q = t * 0.35 + k / 8 * Math.PI * 2;
          F.halo([Math.cos(q) * 1, 1.5 + Math.sin(t * 1.1 + k) * 0.12, Math.sin(q) * 0.75], 0.16, 'rgba(255,200,110,.3)', 'rgba(255,200,110,0)');
        }
        // dust of gold off a turning page
        if (phi > 0 && phi < Math.PI) for (let i = 0; i < 12; i++) {
          const l = (i / 12 + t * 0.8) % 1;
          F.dot([Math.cos(phi) * 0.3 + Math.sin(i * 2) * 0.1, 1.15 + l * 0.6 + Math.sin(phi) * 0.15, 0.05 + Math.cos(i * 3) * 0.1], `rgba(255,214,130,${0.9 * (1 - l)})`);
        }
      }
    };
  });
