  // Справка: высокий камень с огамической надписью вдоль ребра. Зарубки загораются одна за другой снизу вверх, как
  // строка, которую читают, и руны на камнях круга разгораются вместе с ней; строка прочитана — гаснет, и начинается
  // следующая. У подножия растёт куст
  scene('druid', 'spravka', S => {
    const { R, T } = S, H = 2.3, ANG = 0.7, STEP = 0.5, N = 9, DUR = N * STEP + 1.8;
    const r0 = 0.42, r1 = 0.26, rAt = y => r0 + (r1 - r0) * y / H;
    // the lines: letters of one to five strokes — on the face to the right of the edge (0), to the left (1), across the
    // edge (2), notches on the edge itself (3)
    const LINES = [...Array(4)].map((_, l) => { const r = rng(31 + l * 7); return [...Array(N)].map(() => ({ kind: r() * 4 | 0, n: 1 + (r() * 5 | 0) })); });
    const E = [Math.cos(ANG), 0, Math.sin(ANG)];
    const along = a => norm([Math.cos(ANG + a) - Math.cos(ANG), 0, Math.sin(ANG + a) - Math.sin(ANG)]);
    const FA = along(Math.PI / 2), FB = along(-Math.PI / 2);
    const OA = [Math.cos(ANG + Math.PI / 4), 0, Math.sin(ANG + Math.PI / 4)], OB = [Math.cos(ANG - Math.PI / 4), 0, Math.sin(ANG - Math.PI / 4)];
    let line = 0, start = 0, u = 0, read = 0;
    const edge = y => mul([E[0], y / rAt(y), E[2]], rAt(y));
    return {
      orbit: [ANG, 0.45], near: 4.6, rad: 5, look: [0, 1.2, 0], still: 4, clear: 1.4,
      rune: () => 0.35 + read * 0.6,
      tick(t) {
        while (t - start > DUR) { start += DUR; line++; }
        u = t - start;
        read = clamp(u / (N * STEP), 0, 1) * (1 - smooth((u - N * STEP - 1.2) / 0.6));
      },
      lights() { const y = 0.35 + Math.min(N - 1, Math.floor(u / STEP)) * 0.2; return [{ p: add(mul(E, 0.9), [0, y, 0]), col: [0.55, 1, 0.82], i: 0.9 * read + 0.2, fall: 1.2 }]; },
      draw(t) {
        prism(R, 0, 0, -0.05, H, r0, r1, 4, { tex: T.menhir }, [88, 92, 96], ANG);
        // the strokes, cut into the stone: dark, lit one letter after another
        const out = 1 - smooth((u - N * STEP - 1.2) / 0.6);
        LINES[line % LINES.length].forEach((L, j) => {
          const lit = clamp((u - j * STEP) / 0.3, 0, 1) * out, col = lit ? { col: mix3([46, 50, 54], [150, 255, 214], lit), emis: true, nofog: true } : { col: [46, 50, 54] };
          for (let k = 0; k < L.n; k++) {
            const y = 0.35 + j * 0.2 + (k - (L.n - 1) / 2) * 0.034, p = edge(y);
            if (L.kind === 0) rod(R, add(p, mul(OA, 0.012)), add(add(p, mul(FA, 0.11)), mul(OA, 0.012)), 0.01, col, 3);
            else if (L.kind === 1) rod(R, add(p, mul(OB, 0.012)), add(add(p, mul(FB, 0.11)), mul(OB, 0.012)), 0.01, col, 3);
            else if (L.kind === 2) rod(R, add(add(p, mul(FA, 0.08)), [0, 0.03, 0]), add(add(p, mul(FB, 0.08)), [0, -0.03, 0]), 0.01, col, 3);
            else ball(R, add(p, mul(E, 0.01)), 0.018, { ...col, lo: true });
          }
        });
        // the stem line of the writing along the edge
        rod(R, add(edge(0.2), mul(E, 0.008)), add(edge(0.35 + N * 0.2), mul(E, 0.008)), 0.006, { col: read ? mix3([46, 50, 54], [120, 220, 190], read) : [46, 50, 54], emis: !!read }, 3);
        // the bush at the foot of the stone, on its mound of earth
        const bq = ANG - 0.95, bx = Math.cos(bq) * 0.8, bz = Math.sin(bq) * 0.8;
        egg(R, [bx, 0, bz], [0.24, 0.08, 0.24], 0, { col: [56, 40, 28] });
        bush(R, T, [bx, 0.06, bz], t, { s: 0.85 });
      },
      fx(t, F) {
        LINES[line % LINES.length].forEach((L, j) => {
          const lit = clamp((u - j * STEP) / 0.3, 0, 1) * (1 - smooth((u - N * STEP - 1.2) / 0.6));
          if (lit > 0.05) F.halo(add(edge(0.35 + j * 0.2), mul(E, 0.04)), 0.16 + 0.06 * (j === Math.floor(u / STEP) ? 1 : 0), `rgba(143,232,198,${0.32 * lit})`, 'rgba(143,232,198,0)');
        });
      }
    };
  });
