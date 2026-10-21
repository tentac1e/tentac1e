  /* ------------------------------------------------------------------ */
  /* the altar: basil in a clay pot on a stone altar, seven candles on    */
  /* the points of a star in a circle of runes, the molecule of the       */
  /* chapter turning above the bush — at the head of every chapter and    */
  /* in the hero of the home page                                         */
  /* ------------------------------------------------------------------ */
  // which molecule of the aroma rises above the bush in each chapter
  const ALTAR_MOL = { glavnaya: 'lin', sorta: 'est', posadka: 'cin', uhod: 'lin', udobreniya: 'eug', gidro: 'cin', formirovka: 'car', vkus: 'eug', problemy: 'est', spravka: 'lin', moy: 'lin' };
  function altar(host, view) {
    const stage = doc.createElement('div');
    stage.className = 'psx-stage';
    stage.setAttribute('aria-hidden', 'true');
    const cv = doc.createElement('canvas');
    stage.appendChild(cv);
    host.insertBefore(stage, host.firstChild);
    const T = textures();
    const R = new Raster(cv, { px: 3, maxW: 400, levels: 16, fogNear: 3.5, fogFar: 15, amb: [0.13, 0.1, 0.17] });
    R.key = { dir: norm([-0.35, 0.85, -0.4]), i: 0.42, col: [0.55, 0.5, 0.85] };
    const candles = [...Array(7)].map((_, i) => { const q = -Math.PI / 2 + i / 7 * Math.PI * 2; return { x: Math.cos(q) * 2.95, z: Math.sin(q) * 2.95, h: 0.38 + ((i * 37) % 10) / 22, ph: i * 1.7 }; });
    candles.push({ x: -0.74, z: 0.4, h: 0.26, ph: 4.2, top: 1.09 }, { x: 0.74, z: -0.4, h: 0.2, ph: 2.2, top: 1.09 });
    const embers = [...Array(46)].map((_, i) => ({ k: i % candles.length, a: (i * 0.37) % 1, s: 0.3 + (i * 13 % 10) / 22, dx: ((i * 29) % 11 - 5) / 60, dz: ((i * 17) % 11 - 5) / 60 }));
    const pillars = [...Array(8)].map((_, i) => { const q = 0.35 + i / 8 * Math.PI * 2; return { x: Math.cos(q) * 7.4, z: Math.sin(q) * 7.4, h: 1.6 + ((i * 53) % 10) / 4 }; });
    const mol = molShape(ALTAR_MOL[view] || 'lin') || molShape('lin');
    // the reader turns the altar with a finger or the mouse; a tap sends up a puff of sparks
    const ptr = { turn: 0, lift: 0, drag: null, puffs: [] };
    const t0 = performance.now();
    const onDown = e => { ptr.drag = { x: e.clientX, y: e.clientY, turn: ptr.turn, lift: ptr.lift, moved: false }; };
    const onMove = e => {
      if (!ptr.drag) return;
      const dx = e.clientX - ptr.drag.x, dy = e.clientY - ptr.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) ptr.drag.moved = true;
      ptr.turn = ptr.drag.turn + dx * 0.006;
      ptr.lift = clamp(ptr.drag.lift - dy * 0.004, -0.6, 0.9);
      L.start();
    };
    const onUp = () => {
      if (ptr.drag && !ptr.drag.moved) { ptr.puffs.push({ t: (performance.now() - t0) / 1000 }); if (ptr.puffs.length > 4) ptr.puffs.shift(); }
      ptr.drag = null;
    };
    stage.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    function frame(now) {
      const still = reduce.matches;
      const t = (now - t0) / 1000;
      R.size();
      const wide = R.W > R.H * 1.9;
      const ang = (still ? 0.6 : t * 0.11) + ptr.turn, eyeY = 2.55 + (still ? 0 : Math.sin(t * 0.3) * 0.15) + ptr.lift;
      const rad = wide ? 6.4 : 7.4;
      R.cam([Math.cos(ang) * rad, eyeY, Math.sin(ang) * rad], [0, 1.45, 0], wide ? 1.25 : 1.05, wide ? 0.68 : 0.5, wide ? 0.44 : 0.4);
      R.lights = candles.map(c => ({ p: [c.x, (c.top || 0) + c.h + 0.14, c.z], col: [1, 0.6, 0.28], i: 0.5 + (still ? 0 : 0.12 * Math.sin(t * 11 + c.ph) + 0.08 * Math.sin(t * 23 + c.ph * 2)), fall: 0.55 }));
      const x = R.x, g = x.createLinearGradient(0, 0, 0, R.H);
      g.addColorStop(0, '#07050B'); g.addColorStop(0.55, '#1C1122'); g.addColorStop(1, '#120B17');
      x.fillStyle = g; x.fillRect(0, 0, R.W, R.H);
      // the floor and its circle: a layer of their own, under everything
      const FL = 4.4, N = 2;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x0 = -FL + i * FL * 2 / N, x1 = x0 + FL * 2 / N, z0 = -FL + j * FL * 2 / N, z1 = z0 + FL * 2 / N;
        quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: T.floor, layer: 0, ds: true }, i / N, (i + 1) / N, j / N, (j + 1) / N);
        quad(R, [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], { tex: T.glow, layer: 0, add: still ? 0.4 : 0.32 + 0.22 * Math.sin(t * 1.4), ds: true }, i / N, (i + 1) / N, j / N, (j + 1) / N);
      }
      for (let k = 0; k < 4; k++) {
        const q = k * Math.PI / 2, far = 16, s = [Math.cos(q), Math.sin(q)], tn = [-s[1], s[0]];
        const p = (a, b) => [s[0] * a + tn[0] * b, 0, s[1] * a + tn[1] * b];
        quad(R, p(FL, -FL), p(far, -far), p(far, far), p(FL, FL), { col: [30, 22, 36], layer: 0, ds: true });
      }
      pillars.forEach(p => box(R, [p.x, p.h / 2, p.z], [0.32, p.h / 2, 0.32], { tex: T.stone }));
      box(R, [0, 0.48, 0], [0.8, 0.48, 0.5], { tex: T.stone, texFront: T.altar });
      box(R, [0, 1.02, 0], [0.92, 0.06, 0.6], { tex: T.stone });
      prism(R, 0, 0, 1.08, 1.46, 0.27, 0.37, 8, { tex: T.pot });
      prism(R, 0, 0, 1.43, 1.52, 0.39, 0.41, 8, { col: [120, 44, 32] }, [46, 28, 22]);
      // the bush: a stem and pairs of leaves, each pair a quarter turn from the one below
      const sway = k => still ? 0 : Math.sin(t * 1.3 + k) * 0.05;
      const top = [still ? 0 : Math.sin(t * 0.7) * 0.02, 2.32, 0];
      rod(R, [0, 1.47, 0], [top[0] * 0.5, 1.9, 0], 0.03, { col: [70, 128, 48] });
      rod(R, [top[0] * 0.5, 1.9, 0], top, 0.022, { col: [80, 140, 52] });
      [[1.62, 0.46, 0.15], [1.83, 0.4, 0.05], [2.02, 0.32, -0.1], [2.17, 0.24, -0.3], [2.28, 0.15, -0.6]].forEach(([y, len, pitch], k) => {
        for (let s = 0; s < 2; s++) {
          const yaw = k * Math.PI / 2 + s * Math.PI + 0.3 + sway(k + s), pt = pitch + sway(k * 2 + s) * 0.8;
          const Fn = norm([Math.cos(yaw) * Math.cos(pt), -Math.sin(pt) * 0.6 + 0.1, Math.sin(yaw) * Math.cos(pt)]);
          const Sd = norm(cross(Fn, [0, 1, 0])), U = cross(Sd, Fn);
          const B = [top[0] * (y - 1.47) / 0.85, y, 0];
          const Tp = add(add(B, mul(Fn, len)), mul(U, -len * 0.22)), M = add(add(B, mul(Fn, len * 0.5)), mul(U, len * 0.1));
          const Lf = add(add(B, mul(Fn, len * 0.42)), mul(Sd, -len * 0.36)), Rt = add(add(B, mul(Fn, len * 0.42)), mul(Sd, len * 0.36));
          const o = { tex: T.leaf, ds: true, cut: true };
          R.tri(B, Lf, M, { ...o, uv: [[0.5, 1], [0, 0.55], [0.5, 0.55]] });
          R.tri(Lf, Tp, M, { ...o, uv: [[0, 0.55], [0.5, 0], [0.5, 0.55]] });
          R.tri(B, M, Rt, { ...o, uv: [[0.5, 1], [0.5, 0.55], [1, 0.55]] });
          R.tri(M, Tp, Rt, { ...o, uv: [[0.5, 0.55], [0.5, 0], [1, 0.55]] });
        }
      });
      candles.forEach((c, i) => {
        const y0 = c.top || 0;
        prism(R, c.x, c.z, y0, y0 + c.h, 0.085, 0.075, 6, { tex: T.wax }, [236, 226, 200], i);
        const fl = still ? 1 : 1 + 0.18 * Math.sin(t * 13 + c.ph) + 0.1 * Math.sin(t * 29 + c.ph);
        billboard(R, [c.x, y0 + c.h + 0.1 * fl, c.z], 0.05, 0.1 * fl, { tex: T.flame, emis: true, nofog: true, cut: true });
      });
      // the essence above the bush: the chapter's molecule, slowly turning
      const my = 2.85 + (still ? 0 : Math.sin(t * 0.9) * 0.06), yaw = still ? 0.8 : t * 0.5, ca = Math.cos(yaw), sa = Math.sin(yaw);
      if (mol) {
        const MP = mol.P.map(p => { const q = [p[0] * ca + p[2] * sa, p[1], -p[0] * sa + p[2] * ca]; return [q[0] * 0.15, my + q[1] * 0.135 + q[2] * 0.03, q[2] * 0.15]; });
        mol.bonds.forEach(([a, b]) => rod(R, MP[a], MP[b], 0.012, { col: [170, 120, 230], emis: true }, 3));
        mol.atoms.split('').forEach((el, i) => ball(R, MP[i], el === 'O' ? 0.06 : 0.045, { col: el === 'O' ? [240, 70, 60] : [214, 190, 255], emis: true }));
      }
      R.draw();
      // the halos of the flames, added before the colour is cut down: the dither turns them into rings
      x.globalCompositeOperation = 'lighter';
      const halo = (p3, r3, c0, c1) => {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), r = R.C.focal * r3 / v[2], gg = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
        gg.addColorStop(0, c0); gg.addColorStop(1, c1);
        x.fillStyle = gg; x.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
      };
      candles.forEach(c => halo([c.x, (c.top || 0) + c.h + 0.1, c.z], 0.42, 'rgba(255,150,60,.34)', 'rgba(255,120,40,0)'));
      halo([0, my, 0], 0.5, 'rgba(155,107,214,.26)', 'rgba(155,107,214,0)');
      // sparks from the candles, and the reader's puffs from the bush
      const spark = (p3, life, big) => {
        const v = R.view(p3);
        if (v[2] < 0.3) return;
        const p = R.proj(v), s = big || v[2] < 4 ? 2 : 1;
        x.fillStyle = `rgba(255,${150 + (life * 60) | 0},70,${(1 - life) * 0.9})`;
        x.fillRect(p[0], p[1], s, s);
      };
      embers.forEach(e => {
        const c = candles[e.k], life = still ? e.a : (e.a + t * e.s * 0.25) % 1;
        spark([c.x + e.dx * life * 8, (c.top || 0) + c.h + 0.15 + life * 1.6, c.z + e.dz * life * 8], life);
      });
      ptr.puffs = ptr.puffs.filter(p => t - p.t < 2.2);
      ptr.puffs.forEach(p => {
        const life = (t - p.t) / 2.2;
        for (let i = 0; i < 18; i++) {
          const q = i / 18 * Math.PI * 2, r = 0.2 + life * 0.9;
          spark([Math.cos(q) * r * 0.6, 2.1 + life * 1.3 + Math.sin(i * 7) * 0.1, Math.sin(q) * r * 0.6], life, true);
        }
      });
      x.globalCompositeOperation = 'source-over';
      R.post(16);
      stage.classList.add('is-drawn');
    }
    // runs while on the screen, by the page's frame budget; one still frame with reduced motion
    let seen = false;
    const L = psxLoop(ts => { if (!seen || doc.hidden) { L.stop(); return; } frame(ts); if (reduce.matches && !ptr.drag) L.stop(); });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { seen = es.some(e => e.isIntersecting); if (seen) L.start(); else L.stop(); }) : null;
    if (io) io.observe(stage); else { seen = true; L.start(); }
    const vis = () => { if (!doc.hidden && seen) L.start(); };
    doc.addEventListener('visibilitychange', vis);
    return {
      destroy() {
        L.stop();
        if (io) io.disconnect();
        doc.removeEventListener('visibilitychange', vis);
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerup', onUp);
        removeEventListener('pointercancel', onUp);
        stage.remove();
      }
    };
  }
