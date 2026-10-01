  /* @use props */
  /* Pictures of the Pinching chapter: one shoot before the pinch, a week after it and two or three weeks
     later (data-ill="pinch:1…3"). */
  const Rf = props;
  const pinchP = (body, label) => ill.svg(160, 200, Rf.paper(160, 200) + Rf.ground(190, 160, 200) + ill.pot(80, 186, 64, 12) + body, label);
  const PINCH = {
    // four pairs; the cut goes over the second pair, where buds sit in the axils
    1: () => {
      const s = Rf.shoot(80, 180, 152, { pairs: 4, s: 0.42, buds: [1] });
      const [nx, ny] = s.nodes[1];
      return pinchP(s.svg + Rf.cutMark(nx, ny - 8, 34) + Rf.scissors(nx + 32, ny - 8, 196, 1, 0.8) + ill.label(nx + 34, ny - 24, 'срез', 'start'), 'Побег с четырьмя парами листьев; срез над второй парой');
    },
    // a week on: a short stub over the second pair, and both buds have started
    2: () => {
      const s = Rf.shoot(80, 180, 152, { pairs: 4, s: 0.42, stub: 1, shoots: { 1: { len: 22, pairs: 1, s: 0.16, a: 22 } } });
      const [nx, ny] = s.nodes[1];
      return pinchP(s.svg + Rf.arrow(36, 58, nx - 8, ny - 18, -10) + ill.label(10, 40, 'почки', 'start') + ill.label(10, 54, 'проснулись', 'start'), 'Через неделю из пазух второй пары пошли два побега');
    },
    // two or three weeks: two tops instead of one
    3: () => {
      const s = Rf.shoot(80, 180, 152, { pairs: 4, s: 0.42, stub: 1, shoots: { 1: { len: 84, pairs: 3, s: 0.3, a: 24 } } });
      return pinchP(s.svg, 'Через две-три недели — две верхушки вместо одной');
    }
  };
  illustrate('pinch', n => (PINCH[n] || PINCH[1])(), Object.keys(PINCH));
