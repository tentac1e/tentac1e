  /* ------------------------------------------------------------------ */
  /* molecules: low polygons, the console's light                         */
  /* ------------------------------------------------------------------ */
  // the 3D shape for the altar's molecule: springs for the bonds and the angles between them, a push between the rest
  const SHAPES = {};
  function molShape(id) {
    if (SHAPES[id]) return SHAPES[id];
    const M = window.BasilScience && window.BasilScience.MOLS && window.BasilScience.MOLS[id];
    if (!M) return null;
    const atoms = M.atoms, bonds = M.bonds, n = atoms.length, R = rng(31 + n * 7);
    const P = [...Array(n)].map(() => [R() * 4 - 2, R() * 4 - 2, R() * 4 - 2]);
    const nbr = [...Array(n)].map(() => []);
    bonds.forEach(([a, b]) => { nbr[a].push(b); nbr[b].push(a); });
    const ring = new Set(M.ring || []);
    const pairs = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const bd = bonds.find(b => (b[0] === i && b[1] === j) || (b[0] === j && b[1] === i));
      const share = nbr[i].some(k => nbr[j].includes(k));
      const para = M.ring && ring.has(i) && ring.has(j) && Math.abs(M.ring.indexOf(i) - M.ring.indexOf(j)) === 3;
      if (bd) pairs.push([i, j, ring.has(i) && ring.has(j) ? 1.4 : bd[2] === 2 ? 1.34 : 1.52, 1, 0]);
      else if (share) pairs.push([i, j, 2.48, 0.6, 0]);
      else if (para) pairs.push([i, j, 2.8, 0.6, 0]);
      else pairs.push([i, j, 3.2, 0.15, 1]);
    }
    for (let it = 0; it < 900; it++) {
      const F = P.map(() => [0, 0, 0]);
      for (const [i, j, t, k, push] of pairs) {
        const d = sub(P[j], P[i]), L = Math.hypot(d[0], d[1], d[2]) || 1e-3;
        if (push && L > t) continue;
        const f = k * (L - t) / L;
        for (let a = 0; a < 3; a++) { F[i][a] += d[a] * f; F[j][a] -= d[a] * f; }
      }
      P.forEach((p, i) => { for (let a = 0; a < 3; a++) p[a] += F[i][a] * 0.06; });
    }
    const c = P.reduce((s, p) => add(s, p), [0, 0, 0]).map(v => v / n);
    SHAPES[id] = { atoms, bonds, P: P.map(p => sub(p, c)) };
    return SHAPES[id];
  }

  /* The molecule viewer of the guide (MolViewer, science.js) draws through here while a skin is on (drawMol picks the
     skin's own way, MOLDRAW): the same molecule, turned the same way. In «Гримуар» rendered at a third of the size —
     atoms twenty flat faces, bonds four-sided rods, vertices snapped to the console's pixels — and drawn back up
     without smoothing */
  const MOLDRAW = {};
  function drawMol(ctx, mol, P, R3, W, H) {
    const skin = MOLDRAW[skinNow()] ? skinNow() : 'grimoire', wk = scenesWorker();
    if (wk) molAsk(wk, ctx, skin, mol, P, R3, W, H);
    else MOLDRAW[skin](ctx, mol, P, R3, W, H);
  }
  // where the scenes have a worker (04-stage.js), the molecule is drawn there too: the page sends the turn, the worker
  // sends the picture back (an ImageBitmap) and the page lays it on the viewer's canvas. One picture on the way at a
  // time for each canvas: a turn asked for meanwhile waits, and only the newest
  const MOLJOBS = new WeakMap();
  let molIds = 0;
  function molAsk(wk, ctx, skin, mol, P, R3, W, H) {
    let j = MOLJOBS.get(ctx.canvas);
    if (!j) {
      j = { id: 'mol' + (++molIds), busy: false, next: null };
      MOLJOBS.set(ctx.canvas, j);
      const send = m => { j.busy = true; sceneWorker.postMessage(m); };
      workerWaits.set(j.id, m => {
        if (m.type === 'failed') { j.busy = false; j.next = null; return; }
        if (m.type !== 'mol') return;
        if (skinNow()) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.drawImage(m.bmp, 0, 0, ctx.canvas.width, ctx.canvas.height); }
        if (m.bmp.close) m.bmp.close();
        j.busy = false;
        if (j.next && sceneWorker) { const n = j.next; j.next = null; send(n); }
      });
      j.send = send;
    }
    const job = { type: 'mol', id: j.id, skin, mol: { atoms: mol.atoms, bonds: mol.bonds }, P, R3, W, H, cw: ctx.canvas.width, ch: ctx.canvas.height };
    if (j.busy) j.next = job; else j.send(job);
  }
  const MOLBUF = new WeakMap();
  MOLDRAW.grimoire = function molCrypt(ctx, mol, P, R3, W, H) {
    let b = MOLBUF.get(ctx.canvas);
    if (!b) {
      const cv = doc.createElement('canvas');
      b = { cv, R: new Raster(cv, { levels: 18, read: true, fogNear: 9, fogFar: 17, amb: [0.2, 0.17, 0.24] }) };
      b.R.key = { dir: norm([-0.5, 0.7, -0.6]), i: 0.95, col: [1, 0.95, 0.85] };
      MOLBUF.set(ctx.canvas, b);
    }
    const R = b.R.sizeTo(Math.round(W / 3), Math.round(H / 3)), w = R.W, h = R.H;
    R.cam([0, 0, -13], [0, 0, 0], 1.45 * Math.min(1, w / h));
    const x = R.x, g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, '#2A1A34'); g.addColorStop(1, '#0B0910');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const [r0, r1, r2] = R3;
    // the viewer's turn, seen from the side the viewer draws it: screen x and y and depth the same as its own
    const Q0 = P.map(([px, py, pz]) => [-(r0[0] * px + r0[1] * py + r0[2] * pz), -(r1[0] * px + r1[1] * py + r1[2] * pz), -(r2[0] * px + r2[1] * py + r2[2] * pz)]);
    const ext = Math.max(...Q0.map(p => Math.hypot(p[0], p[1], p[2]))) || 1, k = 3.6 / ext, Q = Q0.map(p => mul(p, k));
    const bondCol = [150, 132, 118], s = k / 1.2;
    // ball and stick, a whole atom or bond at a time from the far side to the near one (as the viewer draws them):
    // the painter's order of single triangles would let a long bond cut through an atom in front of it
    const items = mol.bonds.map(([a, c, o]) => ({ z: (Q[a][2] + Q[c][2]) / 2, draw: o2 => {
      if (o === 2) {
        const d = norm(sub(Q[c], Q[a])), off = mul(norm(cross(d, [0, 0, 1])), 0.13 * s);
        rod(R, add(Q[a], off), add(Q[c], off), 0.08 * s, { ...o2, col: bondCol });
        rod(R, sub(Q[a], off), sub(Q[c], off), 0.08 * s, { ...o2, col: bondCol });
      } else rod(R, Q[a], Q[c], 0.11 * s, { ...o2, col: bondCol });
    } })).concat(mol.atoms.split('').map((el, i) => ({ z: Q[i][2] - 0.3, draw: o2 => ball(R, Q[i], (el === 'O' ? 0.42 : 0.36) * s, { ...o2, col: el === 'O' ? [214, 52, 60] : [222, 208, 176] }) })));
    items.sort((u, v) => v.z - u.z).forEach((it, i) => it.draw({ layer: 2 + i }));
    R.draw();
    R.post(18);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(b.cv, 0, 0, ctx.canvas.width, ctx.canvas.height);
  };
