  /* ------------------------------------------------------------------ */
  /* the forest behind the page of «Друид»: a night sky with the moon,   */
  /* three rows of firs going into the fog, the nearer moving more with  */
  /* the scroll, mist and fireflies; at a third of the resolution, drawn  */
  /* back up smooth                                                       */
  /* ------------------------------------------------------------------ */
  function forest() {
    const cv = doc.createElement('canvas');
    cv.id = 'psx-forest';
    cv.setAttribute('aria-hidden', 'true');
    const page = $('.page');
    (page ? page.parentNode : doc.body).insertBefore(cv, page);
    const x = cv.getContext('2d');
    // the rows of firs: drawn once for each size of the screen, wider than it, so that they can slide
    const ROWS = [{ k: 0.04, base: 0.62, col: '#13261F', fog: 0.5, n: 26, h: 0.2 }, { k: 0.09, base: 0.74, col: '#0D1C16', fog: 0.3, n: 20, h: 0.28 }, { k: 0.16, base: 0.88, col: '#070F0B', fog: 0, n: 14, h: 0.4 }];
    const FLIES = [...Array(50)].map((_, i) => ({ x: (i * 0.618) % 1, y: 0.45 + ((i * 0.37) % 1) * 0.5, s: 0.4 + (i % 7) / 7, ph: i * 1.7 }));
    let W = 0, H = 0, layers = [];
    function build() {
      W = Math.max(60, Math.round(innerWidth / 3)); H = Math.max(60, Math.round(innerHeight / 3));
      cv.width = W; cv.height = H;
      const R1 = rng(17);
      layers = ROWS.map(row => {
        const c = doc.createElement('canvas'), w = Math.round(W * 1.4);
        c.width = w; c.height = H;
        const lx = c.getContext('2d');
        lx.fillStyle = row.col;
        lx.fillRect(0, H * row.base, w, H);
        // the trees of one stretch (a period of 0.4 of the screen), drawn again and again along the row: it slides seamlessly
        const per = W * 0.4, n = Math.max(3, Math.round(row.n * 0.4));
        for (let i = 0; i < n; i++) {
          const tx0 = (i + R1() * 0.6) / n * per, th = H * row.h * (0.7 + R1() * 0.6), tw = th * 0.34, ty = H * row.base + 2;
          for (let m = -1; m < 5; m++) for (let k = 0; k < 4; k++) {
            const tx = tx0 + m * per, y0 = ty - th * (k / 4), y1 = ty - th * ((k + 1.35) / 4), hw = tw * (1 - k * 0.2);
            lx.beginPath(); lx.moveTo(tx - hw, y0); lx.lineTo(tx + hw, y0); lx.lineTo(tx, y1); lx.closePath(); lx.fill();
          }
        }
        return { c, row };
      });
    }
    let scroll0 = scrollY;
    const t0 = performance.now();
    function frame(now) {
      const still = reduce.matches, t = still ? 4 : (now - t0) / 1000;
      if (cv.width !== Math.max(60, Math.round(innerWidth / 3))) build();
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#040A08'); g.addColorStop(0.5, '#0C1915'); g.addColorStop(1, '#0B120D');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // the moon and its light
      const mx = W * 0.78, my = H * 0.16, mr = Math.max(3, H * 0.035), mg = x.createRadialGradient(mx, my, 0, mx, my, mr * 9);
      mg.addColorStop(0, 'rgba(200,225,240,.28)'); mg.addColorStop(1, 'rgba(200,225,240,0)');
      x.fillStyle = mg; x.fillRect(0, 0, W, H);
      x.fillStyle = '#DCE6E0'; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
      // the rows of firs, each with the fog in front of it
      const sc = still ? 0 : (scrollY - scroll0) / Math.max(1, innerHeight);
      layers.forEach(({ c, row }, i) => {
        const off = ((sc * row.k * W + t * (i + 1) * 0.4) % (W * 0.4) + W * 0.4) % (W * 0.4);  // the row slides, a period at a time
        x.drawImage(c, -off, -Math.min(H * 0.2, sc * row.k * H * 0.5));
        if (row.fog) { const f = x.createLinearGradient(0, H * (row.base - 0.25), 0, H); f.addColorStop(0, 'rgba(40,64,54,0)'); f.addColorStop(0.5, `rgba(40,64,54,${row.fog * 0.5})`); f.addColorStop(1, 'rgba(40,64,54,0)'); x.fillStyle = f; x.fillRect(0, 0, W, H); }
      });
      // the fireflies over the forest floor
      FLIES.forEach(f => {
        const b = Math.max(0, Math.sin(t * 1.3 + f.ph));
        if (b < 0.2) return;
        const px = ((f.x + Math.sin(t * 0.1 * f.s + f.ph) * 0.03) % 1) * W, py = (((f.y - t * 0.003 * f.s) % 1) + 1) % 1 * H;
        x.fillStyle = `rgba(210,255,130,${b * 0.85})`;
        x.beginPath(); x.arc(px, py, 0.7, 0, Math.PI * 2); x.fill();
      });
    }
    build();
    const L = psxLoop(ts => { if (doc.hidden) { L.stop(); return; } frame(ts); if (reduce.matches) L.stop(); }, 15);
    L.start();
    const onScroll = () => { if (!L.on && !reduce.matches) L.start(); };
    const vis = () => { if (!doc.hidden) { scroll0 = scrollY; L.start(); } };
    let rz = 0;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { build(); frame(performance.now()); }, 120); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    doc.addEventListener('visibilitychange', vis);
    return {
      destroy() {
        L.stop();
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', onResize);
        doc.removeEventListener('visibilitychange', vis);
        cv.remove();
      }
    };
  }
