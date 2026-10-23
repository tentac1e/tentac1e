  /* ------------------------------------------------------------------ */
  /* the crypt behind the page: fog of old blood and violet, ash and      */
  /* sparks drifting up. A small canvas drawn up smooth: dithered and     */
  /* drawn up square, its fog lay over the page as a coarse grid of dots  */
  /* ------------------------------------------------------------------ */
  function crypt() {
    const cv = doc.createElement('canvas');
    cv.id = 'psx-crypt';
    cv.setAttribute('aria-hidden', 'true');
    const page = $('.page');
    (page ? page.parentNode : doc.body).insertBefore(cv, page);
    const R = new Raster(cv, { smooth: true }), x = R.x;
    const motes = [...Array(70)].map((_, i) => ({ x: (i * 0.618) % 1, y: (i * 0.37) % 1, s: 0.2 + (i % 7) / 10, ember: i % 9 === 0 }));
    const blobs = [[0.2, 0.3, '40,20,58'], [0.8, 0.2, '62,14,26'], [0.6, 0.8, '34,18,48'], [0.1, 0.9, '58,16,28']];
    const t0 = performance.now();
    // the size of the crypt's pixels: a third of the screen's, at most 520 across (sizeTo, not size: smooth, size
    // would draw it at the screen's resolution)
    const fit = () => { const cw = cv.clientWidth || 300, ch = cv.clientHeight || 200, s = Math.max(3, cw / 520); R.sizeTo(Math.round(cw / s), Math.round(ch / s)); };
    // the motes rise in their own time and stand still while the page scrolls: a background that rides the scroll
    // pulls at the eye (so the owner found the old forest of the druid)
    function frame(now) {
      const still = reduce.matches, t = (now - t0) / 1000;
      fit();
      const W = R.W, H = R.H;
      x.fillStyle = '#0B0910';
      x.fillRect(0, 0, W, H);
      blobs.forEach(([bx, by, c], i) => {
        const cx = (bx + (still ? 0 : Math.sin(t * 0.05 + i) * 0.08)) * W, cy = (by + (still ? 0 : Math.cos(t * 0.04 + i * 2) * 0.06)) * H, r = Math.max(W, H) * 0.55;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${c},.9)`); g.addColorStop(1, `rgba(${c},0)`);
        x.fillStyle = g; x.fillRect(0, 0, W, H);
      });
      motes.forEach(m => {
        const y = (((m.y - (still ? 0 : t * 0.006 * m.s)) % 1) + 1) % 1, xx = (m.x + (still ? 0 : Math.sin(t * 0.2 + m.y * 9) * 0.01)) * W;
        x.fillStyle = m.ember ? 'rgba(238,138,50,.8)' : 'rgba(181,168,141,.35)';
        x.fillRect(xx, y * H, 1, 1);
      });
    }
    const L = psxLoop(ts => { if (doc.hidden) { L.stop(); return; } frame(ts); if (reduce.matches) L.stop(); }, 15);
    L.start();
    const vis = () => { if (!doc.hidden) L.start(); };
    doc.addEventListener('visibilitychange', vis);
    let rz = 0;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { if (reduce.matches) frame(performance.now()); }, 120); };
    addEventListener('resize', onResize);
    return {
      destroy() {
        L.stop();
        removeEventListener('resize', onResize);
        doc.removeEventListener('visibilitychange', vis);
        cv.remove();
      }
    };
  }
