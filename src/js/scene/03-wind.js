  /* ------------------------------------------------------------------ */
  /* shared wind: background leaves and plants sway to the same breeze  */
  /* ------------------------------------------------------------------ */
  const impulses = [];
  function gust(dir = 1, amp = 1) {
    impulses.push({ t0: now(), dir, amp });
    if (impulses.length > 6) impulses.shift();
  }
  function gustAt(t) {
    let s = 0;
    for (const g of impulses) {
      const d = t - g.t0;
      if (d >= 0 && d < 5) s += g.dir * g.amp * Math.exp(-d * 1.1) * Math.sin(Math.min(d * 5, Math.PI / 2));
    }
    return s;
  }
  function wind(t, x = 0) {
    const envelope = 0.62 + 0.38 * noise3(t * 0.11, 3.7, 1.1);
    const w = Math.sin(t * 0.37 + x * 0.0021) * 0.5 + Math.sin(t * 0.93 + 1.7 + x * 0.0043) * 0.24 + noise3(t * 0.55, x * 0.004, 5.3) * 0.4;
    return w * envelope + gustAt(t);
  }

