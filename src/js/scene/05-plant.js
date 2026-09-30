  /* ------------------------------------------------------------------ */
  /* PLANT: a procedural basil in SVG. Shoots are a tree; each node has  */
  /* a pair of opposite leaves turned 90° from the pair below.           */
  /* ------------------------------------------------------------------ */
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const f2 = v => Math.round(v * 100) / 100;

  /* one straight stem with n nodes; sizes follow a real basil: big lower
     leaves, small young ones at the tip */
  function basil(o = {}) {
    const n = o.nodes || 7;
    const st = o.stretch || 1;
    const lens = [24, 30, 30, 27, 23, 18, 13, 9, 7, 5];
    const sizes = [0.78, 0.96, 1, 0.94, 0.82, 0.64, 0.44, 0.28, 0.18, 0.12];
    const internodes = [], leaves = [];
    for (let i = 0; i < n; i++) {
      const k = Math.round((i / Math.max(1, n - 1)) * 9);
      internodes.push(lens[k] * (o.scale || 1) * st);
      leaves.push(sizes[k] * (o.leaf || 1) / Math.pow(st, 0.35));
    }
    return { id: o.id || 'r', internodes, leaves, w0: (o.w || 7) / Math.sqrt(st), w1: 2, angle: o.angle || 0, apex: o.apex || 'bud', flex: o.flex || 1, children: o.children || [], purple: !!o.purple };
  }

  /* bush after `rounds` pinches: every pinch leaves 3 nodes and wakes
     the two buds in the axils of the top pair */
  function bush(rounds, o = {}) {
    const keep = 3;
    const grow = (id, depth, left, angle) => {
      const scale = Math.pow(0.8, depth) * (o.scale || 1);
      if (left > 0) {
        const s = basil({ id, nodes: keep, scale, leaf: Math.pow(0.86, depth) * (o.leaf || 1), w: 7 * Math.pow(0.78, depth), angle, apex: 'cut', flex: 1 + depth * 0.4 });
        const spread = (0.5 - depth * 0.05);
        s.children = [
          { at: keep - 1, spec: grow(id + '.' + depth + 'L', depth + 1, left - 1, -spread) },
          { at: keep - 1, spec: grow(id + '.' + depth + 'R', depth + 1, left - 1, spread) }
        ];
        return s;
      }
      return basil({ id, nodes: depth ? 5 : 7, scale, leaf: Math.pow(0.86, depth) * (o.leaf || 1), w: 7 * Math.pow(0.78, depth), angle, flex: 1 + depth * 0.4 });
    };
    return grow('r', 0, rounds, 0);
  }

