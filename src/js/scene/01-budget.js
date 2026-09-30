  /* ------------------------------------------------------------------ */
  /* frame budget shared by every animation on the page                  */
  /* 60 fps at most (120 Hz screens would otherwise draw twice as often),*/
  /* 30 fps on touch devices or once the page proves to be struggling    */
  /* ------------------------------------------------------------------ */
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const perf = { low: coarse, listeners: [] };
  function setLow() {
    if (perf.low) return;
    perf.low = true;
    perf.listeners.forEach(fn => fn());
  }
  function gate(hi = 60, lo = 30) {
    let prev = -1e9;
    return ts => {
      const fps = perf.low ? lo : hi;
      if (ts - prev < 1000 / fps - 3) return false;
      prev = ts;
      return true;
    };
  }

