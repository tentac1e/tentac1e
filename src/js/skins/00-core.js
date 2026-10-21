  /* ------------------------------------------------------------------ */
  /* the skins «Гримуар» and «Друид»: what every scene of them uses       */
  /* ------------------------------------------------------------------ */
  const doc = document, root = doc.documentElement;
  const $ = (s, r = doc) => r.querySelector(s), $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // the skin on the page (data-skin of <html>), if it is one of these
  const SKINS = ['grimoire', 'druid'];
  const skinNow = () => { const s = root.getAttribute('data-skin'); return SKINS.includes(s) ? s : null; };
  const SC = window.BasilScene;
  // a seeded random: the same scene at every visit
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // the ordered dither of the console: 4 × 4 thresholds
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  // one loop on the page's frame budget (scene.js): the console's 30 frames a second at most, fewer when calm,
  // none asleep; without scene.js — requestAnimationFrame at that pace
  function psxLoop(frame, fps = 30) {
    const gate = SC && SC.gate ? SC.gate(fps, Math.min(fps, 20)) : (() => { let p = 0; return ts => (ts - p >= 1000 / fps - 3 ? (p = ts, true) : false); })();
    if (SC && SC.loop) {
      const L = SC.loop(ts => { L.next(); if (gate(ts)) frame(ts); });
      return L;
    }
    let raf = 0, on = false;
    const run = ts => { raf = 0; if (!on) return; raf = requestAnimationFrame(run); if (gate(ts)) frame(ts); };
    return { start() { on = true; if (!raf) raf = requestAnimationFrame(run); }, stop() { on = false; cancelAnimationFrame(raf); raf = 0; }, next() {}, get on() { return on; } };
  }
