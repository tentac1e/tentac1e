  /* ------------------------------------------------------------------ */
  /* the grove behind the page of «Друид»: the night itself is a still   */
  /* gradient (28-druid.css), boughs of fir and a birch twig hang in from */
  /* the corners and stand still, ferns rise at the foot, fireflies      */
  /* wander and glow on a small canvas. Nothing follows the scroll: the   */
  /* page goes over a calm layer, and the fireflies rest with the rest    */
  /* of the page when it falls asleep                                     */
  /* ------------------------------------------------------------------ */
  function forest() {
    const el = doc.createElement('div');
    el.id = 'psx-forest';
    el.setAttribute('aria-hidden', 'true');
    el.dataset.bg = '';
    const R = rng(23), f = v => Math.round(v * 10) / 10;

    // a shoot of a fir from (x, y) heading at the angle a: it sags under its own weight a little more at every step,
    // short needles stand all along it like a bottle brush (shorter to the tip), side shoots leave it in turn and sag too
    function fir(x, y, a, len, sag, depth, out) {
      const N = Math.max(5, Math.round(len / 5)), pts = [];
      let d = `M${f(x)} ${f(y)}`;
      for (let i = 1; i <= N; i++) {
        a = Math.atan2(Math.sin(a) + sag, Math.cos(a));
        x += Math.cos(a) * len / N; y += Math.sin(a) * len / N;
        d += `L${f(x)} ${f(y)}`;
        pts.push([x, y, a, i / N]);
      }
      out.stems.push(`<path d="${d}" stroke-width="${f(depth ? 2.6 : 1.3)}"/>`);
      const nl = Math.min(13, 4 + len / 28);
      pts.forEach(([px, py, pa, u]) => {
        for (const s of [-1, 1]) {
          const q = pa + s * (0.75 + R() * 0.35), l = nl * (1 - u * 0.45) * (0.8 + R() * 0.4);
          out.needles.push(`M${f(px)} ${f(py)}l${f(Math.cos(q) * l)} ${f(Math.sin(q) * l + l * 0.25)}`);
        }
      });
      if (depth > 0) for (let i = 3, k = 0; i < N - 3; i += 3, k++) {
        const [px, py, pa, u] = pts[i], s = k % 2 ? 1 : -1;
        fir(px, py, pa + s * (0.6 + R() * 0.25), len * 0.36 * (1 - u * 0.6) + 10, sag * 1.6, depth - 1, out);
      }
    }
    const firSvg = (box, start) => {
      const out = { stems: [], needles: [] };
      fir(...start, 1, out);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"><g class="tw-wood">${out.stems.join('')}</g><path class="tw-needle" d="${out.needles.join('')}"/></svg>`;
    };
    // a birch twig hanging from the top: a thin wavering stem, leaves on short stalks to either side, two catkins
    const birchSvg = () => {
      let d = 'M60 0', x = 60, y = 0, leaves = '';
      for (let i = 1; i <= 14; i++) {
        x += Math.sin(i * 0.9) * 3 + 0.8; y += 16;
        d += `L${f(x)} ${f(y)}`;
        if (i > 1) {
          const s = i % 2 ? 1 : -1, sz = 15 + R() * 6 - i * 0.4, lx = x + s * 8, ly = y + 4, rot = 90 - s * (40 + R() * 25);
          d += `M${f(x)} ${f(y)}L${f(lx)} ${f(ly)}M${f(x)} ${f(y)}`;
          leaves += `<path transform="translate(${f(lx)} ${f(ly)}) rotate(${f(rot)}) scale(${f(sz / 12)})" d="M0 0C2-4 8-5 12 0C8 5 2 4 0 0Z"/>`;
        }
      }
      const cat = (cx, cy) => `<path d="M${cx} ${cy}q-2 9 1 20" stroke-width="3.2"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 244"><g class="tw-wood"><path d="${d}" stroke-width="2.2"/>${cat(64, 52)}${cat(70, 118)}</g><g class="tw-leaf">${leaves}</g></svg>`;
    };
    // ferns rising at the foot: each frond goes up from a bare stalk, arches out and droops at the tip under its weight;
    // its leaflets are longest in the middle and lean to the tip
    const fernSvg = () => {
      let stems = '', pinnae = '';
      [[34, -1.95, 150, 0.075], [52, -1.62, 170, 0.06], [66, -1.3, 150, 0.075], [44, -1.78, 110, 0.05], [80, -1.12, 120, 0.09]].forEach(([x, a, len, sag]) => {
        let y = 200, d = `M${x} ${y}`;
        const N = 22;
        for (let i = 1; i <= N; i++) {
          const u = i / N;
          a = Math.atan2(Math.sin(a) + sag, Math.cos(a));
          x += Math.cos(a) * len / N; y += Math.sin(a) * len / N;
          d += `L${f(x)} ${f(y)}`;
          if (u > 0.24) for (const s of [-1, 1]) {
            const pl = 15 * Math.sin(Math.PI * Math.min(1, (u - 0.2) / 0.85)) + 1.5, q = a + s * 0.95;
            pinnae += `M${f(x)} ${f(y)}l${f(Math.cos(q) * pl)} ${f(Math.sin(q) * pl + pl * 0.2)}`;
          }
        }
        stems += `<path d="${d}" stroke-width="1.7"/>`;
      });
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-86 20 276 180"><g class="tw-fern">${stems}<path d="${pinnae}" stroke-width="2.2"/></g></svg>`;
    };
    // each twig goes to the page as a picture (<img>): the browser keeps it drawn once, and the fireflies' frames above it
    // never make it draw those hundreds of needles again. Its colours are the skin's tokens, read now
    const css = getComputedStyle(root), tok = name => css.getPropertyValue(name).trim();
    const look = `<style>.tw-wood{fill:none;stroke:${tok('--forest-twig')};stroke-linecap:round;stroke-linejoin:round}.tw-needle{fill:none;stroke:${tok('--forest-needle')};stroke-width:1.5;stroke-linecap:round}.tw-leaf{fill:${tok('--forest-leaf')}}.tw-fern{fill:none;stroke:${tok('--forest-fern')};stroke-linecap:round}</style>`;
    const picture = svg => `<img alt="" decoding="async" src="data:image/svg+xml,${encodeURIComponent(svg.replace(/(<svg[^>]*>)/, '$1' + look))}">`;
    // where each twig hangs: its class (28-druid.css places it); the frame of each drawing holds all of it, the needles
    // over the stem and the fronds bending out of the screen
    const twigs = [
      ['tw-fir-tl', firSvg('0 -54 420 318', [0, 14, -0.05, 400, 0.016])],
      ['tw-fir-r', firSvg('0 -14 366 258', [360, 30, Math.PI + 0.06, 340, 0.018])],
      ['tw-birch', birchSvg()],
      ['tw-fern', fernSvg()]
    ].map(([cls, svg]) => `<div class="tw ${cls}">${picture(svg)}</div>`).join('');

    // the fireflies, on a canvas of their own: a CSS animation would make the browser restyle every one of them at each
    // frame the page draws (as many as 60 a second while it scrolls); the canvas is drawn at 20 a second, on the shared
    // budget of frames (15 when calm, none asleep), and only where a firefly was and is. Each one wanders on a path of
    // its own — across and up and down at two paces, never quite stopping — and glows up now and then; fewer on a narrow
    // screen. The clock goes by drawn frames, so after a pause nothing jumps. In «less motion» a few simply stand lit
    const cv = doc.createElement('canvas'), x = cv.getContext('2d');
    const n = innerWidth < 600 ? 14 : 26, flies = [];
    for (let i = 0; i < n; i++) {
      const tx = 9 + R() * 10, ty = 7 + R() * 8, b = 4 + R() * 5;
      flies.push({ x: 0.04 + R() * 0.92, y: 0.22 + R() * 0.74, dx: 24 + R() * 46, dy: 14 + R() * 30, tx, ty, b, px: R() * 6.3, py: R() * 6.3, pb: R(), still: i % 3 ? 0 : 0.8, was: null });
    }
    const RAD = 11;
    let k = 1, W = 0, H = 0, sprite = null, time = 0, last = null;
    function size() {
      // half the pixels of the page: a firefly is a soft light, and a small canvas costs the browser little to show
      k = 0.5;
      W = cv.width = Math.round(el.clientWidth * k); H = cv.height = Math.round(el.clientHeight * k);
      const css = getComputedStyle(root), r = Math.ceil(RAD * k);
      sprite = doc.createElement('canvas');
      sprite.width = sprite.height = r * 2;
      const sx = sprite.getContext('2d'), g = sx.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, css.getPropertyValue('--forest-fly').trim() || '#EEFFB0');
      g.addColorStop(0.12, css.getPropertyValue('--forest-fly').trim() || '#EEFFB0');
      g.addColorStop(0.34, css.getPropertyValue('--forest-fly-glow').trim() || 'rgba(196,240,120,.38)');
      g.addColorStop(1, 'rgba(196,240,120,0)');
      sx.fillStyle = g; sx.fillRect(0, 0, r * 2, r * 2);
      flies.forEach(fl => { fl.was = null; });
      x.clearRect(0, 0, W, H);
    }
    // how bright a firefly is at the time t: dark most of its round, then a glow that swells and fades
    const glow = (fl, t) => { const p = ((t / fl.b + fl.pb) % 1 + 1) % 1; return p < 0.4 || p > 0.9 ? 0 : Math.pow(Math.sin(Math.PI * (p - 0.4) / 0.5), 1.5); };
    function draw(t, still) {
      const r = Math.ceil(RAD * k);
      flies.forEach(fl => { if (fl.was) x.clearRect(fl.was[0] - r - 1, fl.was[1] - r - 1, r * 2 + 2, r * 2 + 2); });
      flies.forEach(fl => {
        const a = still ? fl.still : glow(fl, t);
        fl.was = null;
        if (a < 0.02) return;
        const T = Math.PI * 2;
        const px = fl.x * W + (still ? 0 : (Math.sin(T * t / fl.tx + fl.px) + 0.3 * Math.sin(T * t / (fl.tx * 0.43) + fl.py)) * fl.dx * k / 1.3);
        const py = fl.y * H + (still ? 0 : (Math.sin(T * t / fl.ty + fl.py) + 0.3 * Math.sin(T * t / (fl.ty * 0.57) + fl.px)) * fl.dy * k / 1.3);
        x.globalAlpha = a;
        x.drawImage(sprite, px - r, py - r);
        fl.was = [px, py];
      });
      x.globalAlpha = 1;
    }
    const L = psxLoop(now => {
      if (last != null) time += clamp((now - last) / 1000, 0, 0.1);
      last = now;
      draw(time, false);
    }, 20, 20);
    el.innerHTML = twigs;
    el.appendChild(cv);
    const page = $('.page');
    (page ? page.parentNode : doc.body).insertBefore(el, page);
    size();
    const motion = () => { if (reduce.matches) { L.stop(); draw(0, true); } else { last = null; L.start(); } };
    let rz = 0;
    // a phone's bars coming and going leave the layer as it was (it is as tall as the screen without them): nothing to do
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { if (Math.round(el.clientWidth * k) === W && Math.round(el.clientHeight * k) === H) return; size(); if (reduce.matches) draw(0, true); }, 150); };
    addEventListener('resize', onResize);
    reduce.addEventListener('change', motion);
    motion();
    return {
      destroy() {
        L.stop();
        clearTimeout(rz);
        removeEventListener('resize', onResize);
        reduce.removeEventListener('change', motion);
        el.remove();
      }
    };
  }
