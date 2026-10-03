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

  /* the reader's attention: animations run smoothly while something happens (a touch, the mouse, scrolling,
     a key), calm down to a slow rate a few seconds after it stops and sleep after a while — no frames at all,
     the CSS sky stands still. The first touch, scroll or key wakes everything where it stopped.
     Tests set window.BASIL_CALM = [calm ms, sleep ms] before the page starts */
  const CALM = Array.isArray(window.BASIL_CALM) ? window.BASIL_CALM : [8000, 40000];
  const CALM_FPS = 15;
  const act = { state: 'active', last: performance.now(), timer: 0, wakers: new Set() };
  const html = document.documentElement;
  function setState(s) {
    if (act.state === s) return;
    act.state = s;
    html.classList.toggle('is-calm', s !== 'active');
    html.classList.toggle('is-asleep', s === 'sleep');
    if (s !== 'sleep') {
      const list = [...act.wakers];
      act.wakers.clear();
      list.forEach(fn => { try { fn(); } catch (e) { /* one loop failing must not stop the others */ } });
    }
    document.dispatchEvent(new CustomEvent('basil:calm', { detail: { state: s } }));
  }
  function check() {
    act.timer = 0;
    const idle = performance.now() - act.last;
    if (idle >= CALM[1]) { setState('sleep'); return; }
    if (idle >= CALM[0]) setState('calm');
    act.timer = setTimeout(check, (idle >= CALM[0] ? CALM[1] : CALM[0]) - idle + 30);
  }
  function poke() {
    act.last = performance.now();
    if (act.state !== 'active') setState('active');
    if (!act.timer) act.timer = setTimeout(check, CALM[0] + 30);
  }
  ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach(ev => window.addEventListener(ev, poke, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poke(); });
  act.timer = setTimeout(check, CALM[0] + 30);
  // a loop that has stopped for the night: called once on the next wake
  const onWake = fn => { if (act.state === 'sleep') act.wakers.add(fn); else fn(); };

  function gate(hi = 60, lo = 30) {
    let prev = -1e9;
    return ts => {
      if (act.state === 'sleep') return false;
      let fps = perf.low ? lo : hi;
      if (act.state === 'calm') fps = Math.min(fps, CALM_FPS);
      // a timer-paced calm frame may come a little early: three quarters of the interval is enough
      if (ts - prev < 1000 / fps * (act.state === 'calm' ? 0.75 : 1) - 3) return false;
      prev = ts;
      return true;
    };
  }

  /* the calm frames of every loop come together: one timer for all, so the page draws 15 frames a second when
     calm — two loops on timers of their own drifted apart and drew 30, as many as a phone draws while active */
  const calmQueue = new Set();
  let calmTimer = 0;
  function calmTick(fn) {
    calmQueue.add(fn);
    if (!calmTimer) calmTimer = setTimeout(() => {
      calmTimer = 0;
      const list = [...calmQueue];
      calmQueue.clear();
      list.forEach(f => f());
    }, 1000 / CALM_FPS - 12);
  }

  /* one animation loop on that budget: a frame per display refresh while active, by the shared timer when calm
     (no wake-ups 60 times a second for 15 frames), none while asleep — it starts again by itself.
     frame(ts) calls loop.next() to ask for the next one */
  function loop(frame) {
    let raf = 0, waiting = false, on = false;
    const run = ts => { raf = 0; if (on) frame(ts); };
    const go = () => { waiting = false; if (on && !raf) raf = requestAnimationFrame(run); };
    const next = () => {
      if (!on || raf || waiting) return;
      if (act.state === 'sleep') { act.wakers.add(next); return; }
      if (act.state === 'calm') { waiting = true; calmTick(go); }
      else raf = requestAnimationFrame(run);
    };
    return {
      start() { on = true; next(); },
      stop() { on = false; cancelAnimationFrame(raf); raf = 0; waiting = false; calmQueue.delete(go); act.wakers.delete(next); },
      next,
      get on() { return on; }
    };
  }
  const calm = { get state() { return act.state; }, poke, onWake, loop };
