/* Гид по базилику — тактильный отклик на телефонах.
   Android: Vibration API. iPhone (iOS 18+): у Safari нет вибрации для сайтов, но системный
   переключатель <input type="checkbox" switch> при нажатии даёт лёгкий тактильный щелчок —
   его и «нажимаем» невидимо. На компьютерах и там, где ничего из этого нет, модуль молчит. */
window.BasilHaptics = (() => {
  'use strict';
  const KEY = 'basil-haptics';
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const vibrate = typeof navigator.vibrate === 'function';
  const ios = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const supported = touch && (vibrate || ios);
  let on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { /* private mode */ }

  // Android: milliseconds; iPhone has one strength, patterns are played as a single tick
  const PATTERN = { tick: 5, select: 9, impact: 16, success: [10, 70, 16] };
  const GAP = { tick: 45, select: 80, impact: 120, success: 300 };
  let last = 0;

  function iosTap() {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    label.remove();
  }

  function play(kind) {
    if (!supported || !on) return;
    const now = performance.now();
    if (now - last < GAP[kind]) return;
    last = now;
    try {
      if (vibrate) navigator.vibrate(PATTERN[kind]);
      else iosTap();
    } catch (e) { /* some browsers refuse outside a gesture — fine */ }
  }

  /* ---------------- automatic feedback ---------------- */
  // sliders: a tick per step, at most ~30 ticks across the whole range
  const rangeLast = new WeakMap();
  document.addEventListener('input', e => {
    const el = e.target;
    if (!el || el.type !== 'range') return;
    const min = +el.min || 0, max = el.max === '' ? 100 : +el.max, step = +el.step || 1;
    const every = Math.max(1, Math.round((max - min) / step / 30));
    const idx = Math.round((+el.value - min) / step / every);
    if (rangeLast.get(el) !== idx) { rangeLast.set(el, idx); play('tick'); }
  }, true);
  // switches, checkboxes, radios
  document.addEventListener('change', e => {
    const el = e.target;
    if (el && (el.type === 'checkbox' || el.type === 'radio') && e.isTrusted) play('select');
  }, true);
  // taps on controls that change something on the page
  const TAPS = 'button, summary, [role="button"], [data-v], [data-cat], [data-depth-pick], .subnav a, .deep-index a, .w-arc, select';
  document.addEventListener('click', e => {
    if (!e.isTrusted || !e.target.closest) return;
    const el = e.target.closest(TAPS);
    if (el && !el.disabled) play('select');
  }, true);
  // swipeable rows that snap to cards: a tick when the next card settles in
  function watchSnap(row) {
    let idx = -1, touching = false;
    row.addEventListener('touchstart', () => { touching = true; }, { passive: true });
    row.addEventListener('touchend', () => { setTimeout(() => { touching = false; }, 600); }, { passive: true });
    row.addEventListener('scroll', () => {
      const first = row.firstElementChild;
      if (!first) return;
      const w = first.getBoundingClientRect().width || 1;
      const i = Math.round(row.scrollLeft / w);
      if (i !== idx) { if (idx !== -1 && touching) play('tick'); idx = i; }
    }, { passive: true });
  }
  const initSnaps = () => {
    if (!supported) return;
    document.querySelectorAll('.facts, .journey, .rules, .tools, #tools-home, .diagram-pinch').forEach(row => {
      const s = getComputedStyle(row).scrollSnapType || '';
      if (s && s !== 'none') watchSnap(row);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSnaps); else initSnaps();

  // dragging over a chart or turning a model: a tick every `px` pixels of travel
  function dragTicker(px = 18) {
    let x0 = null, y0 = null;
    return {
      start(x, y) { x0 = x; y0 = y; },
      move(x, y) {
        if (x0 === null) { x0 = x; y0 = y; return; }
        if (Math.hypot(x - x0, y - y0) >= px) { x0 = x; y0 = y; play('tick'); }
      },
      end() { x0 = y0 = null; }
    };
  }

  return {
    supported,
    get enabled() { return on; },
    set(v) { on = !!v; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* private mode */ } if (on) play('select'); },
    tick: () => play('tick'),
    select: () => play('select'),
    impact: () => play('impact'),
    success: () => play('success'),
    dragTicker
  };
})();
