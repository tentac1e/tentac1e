  /* ------------------------------------------------------------------ */
  /* BACKGROUND: tumbling leaves at three depths, sun shafts and pollen  */
  /* by day, moonlight and fireflies at night                            */
  /* ------------------------------------------------------------------ */
  const SPR_L = 110;

  function leafPath(g, L) {
    const w = L * 0.62;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(w * 0.36, -L * 0.01, w * 0.53, -L * 0.2, w * 0.5, -L * 0.42);
    g.bezierCurveTo(w * 0.47, -L * 0.64, w * 0.22, -L * 0.88, 0, -L);
    g.bezierCurveTo(-w * 0.22, -L * 0.88, -w * 0.47, -L * 0.64, -w * 0.5, -L * 0.42);
    g.bezierCurveTo(-w * 0.53, -L * 0.2, -w * 0.36, -L * 0.01, 0, 0);
    g.closePath();
  }

  function paintLeaf(g, L, face, c1, c2) {
    const w = L * 0.62;
    g.lineCap = 'round';
    g.strokeStyle = c1;
    g.lineWidth = L * 0.04;
    g.beginPath(); g.moveTo(0, L * 0.11); g.lineTo(0, -L * 0.02); g.stroke();
    leafPath(g, L);
    const grd = g.createLinearGradient(0, 0, w * 0.2, -L);
    grd.addColorStop(0, c1);
    grd.addColorStop(1, c2);
    g.fillStyle = grd;
    g.fill();
    g.save();
    leafPath(g, L);
    g.clip();
    g.fillStyle = 'rgba(0,0,0,.15)';
    g.fillRect(0, -L, w, L);
    const rg = g.createRadialGradient(-w * 0.16, -L * 0.56, 0, -w * 0.16, -L * 0.56, L * 0.5);
    rg.addColorStop(0, face === 'top' ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.2)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(-w, -L, w * 2, L);
    if (face === 'under') { g.fillStyle = 'rgba(232,244,222,.34)'; g.fillRect(-w, -L, w * 2, L); }
    g.restore();
    g.strokeStyle = face === 'top' ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.6)';
    g.lineWidth = L * (face === 'top' ? 0.013 : 0.022);
    g.beginPath();
    g.moveTo(0, -L * 0.02);
    g.quadraticCurveTo(L * 0.014, -L * 0.5, 0, -L * 0.94);
    [[0.17, 0.36], [0.33, 0.34], [0.49, 0.28], [0.64, 0.2], [0.78, 0.11]].forEach(([t, len]) => {
      const y0 = -L * t;
      [1, -1].forEach(s => { g.moveTo(0, y0); g.quadraticCurveTo(s * w * len * 0.5, y0 - L * 0.03, s * w * len, y0 - L * 0.13); });
    });
    g.stroke();
    leafPath(g, L);
    g.strokeStyle = 'rgba(0,0,0,.2)';
    g.lineWidth = L * 0.011;
    g.stroke();
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  /* blur by rendering small and scaling up — works in every browser */
  function sprite(draw, w, h, k) {
    const small = makeCanvas(w * k, h * k);
    const g = small.getContext('2d');
    g.scale(k, k);
    draw(g);
    if (k === 1) return small;
    const big = makeCanvas(w, h);
    const bg = big.getContext('2d');
    bg.imageSmoothingEnabled = true;
    bg.imageSmoothingQuality = 'high';
    bg.drawImage(small, 0, 0, w, h);
    return big;
  }

  function initBackground(canvas) {
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0;
    let pal = null, sprites = [], sheens = [], glow = null, flyGlow = null, beams = [];
    let leaves = [], motes = [], flies = [], sparks = [];
    const ptr = { x: -9999, y: -9999, vx: 0, vy: 0, seen: 0 };
    let lastScroll = window.scrollY;
    const BLUR = [1, 0.36, 0.2];
    const SPR_W = SPR_L * 0.72 + 8, SPR_H = SPR_L * 1.14 + 8;

    function readPalette() {
      pal = {
        leaves: [['--sc-g1', '--sc-g2'], ['--sc-d1', '--sc-d2'], ['--sc-l1', '--sc-l2'], ['--sc-p1', '--sc-p2']].map(p => p.map(n => css(n) || '#5E9F3E')),
        alpha: parseFloat(css('--sc-alpha')) || 0.5,
        ray: css('--sc-ray') || 'rgba(255,246,214,.5)',
        mote: css('--sc-mote') || '#FFF3C4',
        fly: css('--sc-firefly') || '#E3F77A',
        moon: css('--sc-moon') || 'rgba(190,220,255,.12)',
        night: css('--sc-night') === '1'
      };
    }

    function buildSprites() {
      sprites = pal.leaves.map(([c1, c2]) => BLUR.map(k => ({
        top: sprite(g => { g.translate(SPR_W / 2, 4 + SPR_L); paintLeaf(g, SPR_L, 'top', c1, c2); }, SPR_W, SPR_H, k),
        under: sprite(g => { g.translate(SPR_W / 2, 4 + SPR_L); paintLeaf(g, SPR_L, 'under', c1, c2); }, SPR_W, SPR_H, k)
      })));
      sheens = BLUR.map(k => sprite(g => {
        g.translate(SPR_W / 2, 4 + SPR_L);
        leafPath(g, SPR_L);
        const lg = g.createLinearGradient(-SPR_L * 0.3, 0, SPR_L * 0.3, -SPR_L * 0.4);
        lg.addColorStop(0, 'rgba(255,255,255,.95)');
        lg.addColorStop(0.55, 'rgba(255,255,255,.25)');
        lg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = lg;
        g.fill();
      }, SPR_W, SPR_H, k));
      const radial = (color, size, core) => {
        const c = makeCanvas(size, size);
        const g = c.getContext('2d');
        const r = size / 2;
        const gr = g.createRadialGradient(r, r, 0, r, r, r);
        gr.addColorStop(0, color);
        gr.addColorStop(core, color);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.globalAlpha = 1;
        g.fillRect(0, 0, size, size);
        return c;
      };
      glow = radial(pal.mote, 32, 0.12);
      flyGlow = radial(pal.fly, 64, 0.06);
    }

    /* sky: light beams by day, moon glow by night — composited CSS layers, not per-frame canvas work */
    const sky = document.createElement('div');
    sky.className = 'sky-layer';
    sky.setAttribute('aria-hidden', 'true');
    canvas.parentNode.insertBefore(sky, canvas);
    function buildSky() {
      sky.textContent = '';
      if (pal.night) {
        const moon = document.createElement('div');
        moon.className = 'sky-moon';
        sky.appendChild(moon);
        return;
      }
      for (const b of beams) {
        const wrap = document.createElement('div');
        wrap.className = 'sky-beam';
        wrap.style.animationDelay = `${(-b.ph / 0.07).toFixed(1)}s`;
        b.c.style.animationDuration = `${(Math.PI / b.sp).toFixed(1)}s`;
        b.c.style.animationDelay = `${(-b.ph / b.sp).toFixed(1)}s`;
        wrap.appendChild(b.c);
        sky.appendChild(wrap);
      }
    }

    function buildBeams() {
      beams = [];
      if (pal.night) { buildSky(); return; }
      const q = 0.25;
      const defs = [[0.1, 0.22, 0.34], [0.42, 0.14, 0.3], [0.78, 0.18, 0.36]];
      defs.forEach(([fx, fw, tilt], i) => {
        const c = makeCanvas(W * q, H * q);
        const g = c.getContext('2d');
        g.scale(q, q);
        const x0 = W * fx - H * 0.12, w0 = W * fw * 0.35, w1 = W * fw;
        const x1 = x0 + Math.tan(tilt) * H;
        const nx = Math.cos(tilt), ny = -Math.sin(tilt);
        const lg = g.createLinearGradient(x0 - nx * w1, 0 - ny * w1, x0 + nx * w1, 0 + ny * w1);
        lg.addColorStop(0, 'rgba(255,255,255,0)');
        lg.addColorStop(0.28, 'rgba(255,255,255,0)');
        lg.addColorStop(0.5, pal.ray);
        lg.addColorStop(0.72, 'rgba(255,255,255,0)');
        lg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = lg;
        g.beginPath();
        g.moveTo(x0 - w0, -10); g.lineTo(x0 + w0, -10); g.lineTo(x1 + w1, H); g.lineTo(x1 - w1, H);
        g.closePath();
        g.fill();
        g.globalCompositeOperation = 'destination-out';
        const fade = g.createLinearGradient(0, 0, 0, H);
        fade.addColorStop(0, 'rgba(0,0,0,0)');
        fade.addColorStop(0.55, 'rgba(0,0,0,.5)');
        fade.addColorStop(1, 'rgba(0,0,0,1)');
        g.fillStyle = fade;
        g.fillRect(0, 0, W, H);
        beams.push({ c, ph: i * 1.7, sp: 0.12 + i * 0.03, fx, tilt, x0, w1 });
      });
      buildSky();
    }

    const beamAt = (x, y, t) => {
      let s = 0;
      for (const b of beams) {
        const cx = b.x0 + Math.tan(b.tilt) * y;
        const d = (x - cx) * Math.cos(b.tilt);
        s += Math.exp(-(d * d) / (b.w1 * b.w1 * 0.18)) * (0.55 + 0.45 * Math.sin(t * b.sp + b.ph)) * clamp(y / H + 0.15, 0, 1);
      }
      return Math.min(1, s);
    };

    const pickVariant = () => { const r = Math.random(); return r < 0.12 ? 3 : r < 0.3 ? 2 : r < 0.55 ? 1 : 0; };
    function makeLeaf(anywhere) {
      const z = Math.random();
      const layer = z < 0.42 ? 2 : z < 0.8 ? 1 : 0;
      const size = layer === 2 ? 10 + Math.random() * 9 : layer === 1 ? 17 + Math.random() * 12 : 30 + Math.random() * 22;
      return {
        x: Math.random() * W, y: anywhere ? Math.random() * H : -size * 1.6,
        z, layer, size, v: pickVariant(),
        rot: Math.random() * TAU, flip: Math.random() * TAU,
        vflip: (0.5 + Math.random() * 1.1) * (Math.random() < 0.5 ? -1 : 1),
        ph: Math.random() * TAU, vph: 0.45 + Math.random() * 0.65, amp: 10 + Math.random() * 22,
        fall: (5 + Math.random() * 9) * (0.55 + z * 0.8), vx: 0, vy: 0, seed: Math.random() * 50
      };
    }
    const makeMote = anywhere => ({ x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, z: Math.random(), r: 0.7 + Math.random() * 1.7, ph: Math.random() * TAU, sp: 0.6 + Math.random() * 1.6, seed: Math.random() * 40, vx: 0, vy: 0 });
    /* fireflies keep to the margins and the lower part of the screen, glow softly and rarely */
    const sideX = () => { const r = Math.random(); if (W < 900 || r > 0.8) return Math.random() * W; const m = Math.max(40, (W - 1100) / 2 + 60); return r < 0.4 ? Math.random() * m : W - Math.random() * m; };
    const makeFly = () => ({ x: sideX(), y: H * (0.45 + Math.random() * 0.5), vx: 0, vy: 0, seed: Math.random() * 40, period: 6 + Math.random() * 5, on: 2 + Math.random() * 1.2, off: Math.random() * 10, size: 12 + Math.random() * 9 });

    function populate() {
      const small = W < 700;
      const nLeaves = small ? 11 : 19;
      const nMotes = pal.night ? 0 : small ? 30 : 64;
      const nFlies = pal.night ? (small ? 4 : 8) : 0;
      while (leaves.length < nLeaves) leaves.push(makeLeaf(true));
      leaves.length = nLeaves;
      leaves.sort((a, b) => a.z - b.z);
      while (motes.length < nMotes) motes.push(makeMote(true));
      motes.length = nMotes;
      while (flies.length < nFlies) flies.push(makeFly());
      flies.length = nFlies;
    }

    function resize() {
      // soft background leaves do not need retina pixels; 1–1.5x keeps them crisp enough at a third of the cost
      dpr = Math.min(window.devicePixelRatio || 1, perf.low ? 1 : 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      buildBeams();
      populate();
    }

    const curl = (x, y, t, s) => {
      const e = 0.35;
      const nx = x * s, ny = y * s, nt = t * 0.045;
      return [
        (noise3(nx, ny + e, nt) - noise3(nx, ny - e, nt)) / (2 * e),
        -(noise3(nx + e, ny, nt) - noise3(nx - e, ny, nt)) / (2 * e)
      ];
    };

    function pointerForce(o, dt, R, push, swirl, drag) {
      const dx = o.x - ptr.x, dy = o.y - ptr.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > R * R) return 0;
      const d = Math.sqrt(d2) || 1;
      const f = 1 - d / R;
      const f2 = f * f;
      o.vx += ((dx / d) * push * f2 - (dy / d) * swirl * f2 + ptr.vx * drag * f) * dt;
      o.vy += ((dy / d) * push * f2 + (dx / d) * swirl * f2 + ptr.vy * drag * f) * dt;
      return f;
    }

    function stepLeaf(l, t, dt) {
      l.ph += l.vph * dt;
      const swing = Math.sin(l.ph);
      const depth = 0.35 + l.z * 0.65;
      const [fx, fy] = curl(l.x, l.y, t + l.seed, 0.0019);
      const w = wind(t, l.x) * 30 * depth;
      const vx = fx * 16 * depth + w + Math.cos(l.ph) * l.amp * depth;
      const vy = fy * 12 * depth + l.fall * (0.5 + 0.5 * Math.abs(swing));
      const f = pointerForce(l, dt, 190, 260, 170, 1.4);
      if (f) l.vflip += (Math.abs(ptr.vx) + Math.abs(ptr.vy)) * 0.0022 * f * Math.sign(l.vflip || 1);
      const k = Math.pow(0.3, dt);
      l.vx *= k; l.vy *= k;
      l.x += (vx + l.vx) * dt;
      l.y += (vy + l.vy) * dt;
      l.rot += (swing * 0.5 + l.vx * 0.004) * dt;
      l.flip += l.vflip * dt;
      const base = Math.sign(l.vflip || 1) * (0.5 + l.z * 0.8);
      l.vflip += (base - l.vflip) * 0.6 * dt;
      const m = l.size * 1.8;
      if (l.y > H + m) { Object.assign(l, makeLeaf(false), { z: l.z, layer: l.layer, size: l.size }); }
      if (l.y < -m * 4) l.y = H + m;
      if (l.x < -m) l.x = W + m;
      if (l.x > W + m) l.x = -m;
    }

    const LAYER_ALPHA = [1, 0.74, 0.5];
    function drawLeaf(l) {
      const set = sprites[l.v][l.layer];
      const fc = Math.cos(l.flip);
      const spr = fc >= 0 ? set.top : set.under;
      const sc = l.size / SPR_L;
      const sx = Math.max(0.1, Math.abs(fc)) * sc;
      const sy = sc * (0.84 + 0.16 * Math.cos(l.flip * 0.5 + l.ph));
      const r = l.rot + Math.sin(l.ph) * 0.42;
      const cs = Math.cos(r), sn = Math.sin(r);
      ctx.setTransform(dpr * cs * sx, dpr * sn * sx, -dpr * sn * sy, dpr * cs * sy, dpr * l.x, dpr * l.y);
      const a = pal.alpha * LAYER_ALPHA[l.layer];
      ctx.globalAlpha = a;
      ctx.drawImage(spr, -SPR_W / 2, -(4 + SPR_L * 0.5));
      const sheen = Math.pow(Math.max(0, Math.sin(l.flip + 0.7)), 10);
      if (sheen > 0.04 && l.layer < 2) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = a * sheen * (pal.night ? 0.25 : 0.55);
        ctx.drawImage(sheens[l.layer], -SPR_W / 2, -(4 + SPR_L * 0.5));
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    function stepMote(m, t, dt) {
      m.ph += m.sp * dt;
      const [fx, fy] = curl(m.x, m.y, t * 0.7 + m.seed, 0.004);
      pointerForce(m, dt, 140, 180, 220, 0.9);
      const k = Math.pow(0.25, dt);
      m.vx *= k; m.vy *= k;
      m.x += (fx * 9 + wind(t, m.x) * 10 + m.vx) * dt;
      m.y += (fy * 7 - 3 * (0.4 + m.z) + m.vy) * dt;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      if (m.y > H + 12) m.y = -8;
      if (m.x < -10) m.x = W + 10;
      if (m.x > W + 10) m.x = -10;
    }
    function drawMote(m, t) {
      const lit = 0.18 + beamAt(m.x, m.y, t) * 1.2;
      const tw = 0.55 + 0.45 * Math.sin(m.ph);
      const s = m.r * (4 + m.z * 3);
      ctx.globalAlpha = clamp(lit * tw * (0.5 + m.z * 0.5), 0, 1);
      ctx.drawImage(glow, m.x - s / 2, m.y - s / 2, s, s);
    }

    function stepFly(f, t, dt) {
      const ang = noise3(f.seed, t * 0.1, 0.5) * TAU * 1.5;
      let ax = Math.cos(ang) * 9, ay = Math.sin(ang) * 6 - 1;
      const dx = ptr.x - f.x, dy = ptr.y - f.y, d = Math.hypot(dx, dy);
      if (d < 220 && d > 40) { ax += dx / d * 8 - dy / d * 8; ay += dy / d * 8 + dx / d * 8; }
      if (W > 900) { const half = Math.min(560, W / 2 - 60), off = f.x - W / 2; if (Math.abs(off) < half) ax += Math.sign(off || 1) * 10 * (1 - Math.abs(off) / half); }
      if (f.y < H * 0.35) ay += 8;
      const k = Math.pow(0.4, dt);
      f.vx = f.vx * k + ax * dt * 2;
      f.vy = f.vy * k + ay * dt * 2;
      f.x += (f.vx + wind(t, f.x) * 8) * dt;
      f.y += f.vy * dt;
      if (f.x < -40) f.x = W + 40;
      if (f.x > W + 40) f.x = -40;
      if (f.y < H * 0.05) f.vy += 30 * dt;
      if (f.y > H + 30) f.y = -20;
    }
    function drawFly(f, t) {
      const local = ((t + f.off) % f.period + f.period) % f.period;
      const pulse = local < f.on ? Math.pow(Math.sin(Math.PI * local / f.on), 3) : 0;
      const s = f.size * (0.8 + pulse * 0.35);
      ctx.globalAlpha = 0.03 + pulse * 0.22;
      ctx.drawImage(flyGlow, f.x - s / 2, f.y - s / 2, s, s);
      ctx.globalAlpha = 0.12 + pulse * 0.3;
      ctx.drawImage(flyGlow, f.x - 1.5, f.y - 1.5, 3, 3);
    }

    function render(t, dt) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const moving = dt > 0;
      let i = 0;
      for (; i < leaves.length && leaves[i].layer === 2; i++) {
        if (moving) stepLeaf(leaves[i], t, dt);
        drawLeaf(leaves[i]);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const m of motes) { if (moving) stepMote(m, t, dt); drawMote(m, t); }
      if (flies.length) {
        ctx.globalCompositeOperation = 'screen';
        for (const f of flies) { if (moving) stepFly(f, t, dt); drawFly(f, t); }
        ctx.globalCompositeOperation = 'source-over';
      }
      for (let s = sparks.length - 1; s >= 0; s--) {
        const p = sparks[s];
        p.life -= dt;
        if (p.life <= 0) { sparks.splice(s, 1); continue; }
        p.vx *= Math.pow(0.2, dt); p.vy = p.vy * Math.pow(0.2, dt) - 8 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const s2 = p.r * 6;
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1) * (pal.night ? 0.35 : 0.9);
        ctx.drawImage(pal.night ? flyGlow : glow, p.x - s2 / 2, p.y - s2 / 2, s2, s2);
      }
      for (; i < leaves.length; i++) {
        if (moving) stepLeaf(leaves[i], t, dt);
        drawLeaf(leaves[i]);
      }
      ctx.globalAlpha = 1;
    }

    const ready = gate(60, 30);
    let prevTs = 0, ema = 16.7, warm = 0;
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      // watch the real frame rate: if the device keeps missing frames, drop the whole page to 30 fps
      if (prevTs) {
        const iv = Math.min(100, ts - prevTs);
        if (warm < 90) warm++;
        else { ema += (iv - ema) * 0.05; if (ema > 24) setLow(); }
      }
      prevTs = ts;
      if (!ready(ts)) return;
      const t = ts / 1000;
      let dt = t - last;
      last = t;
      if (dt > 0.05) dt = 0.05;
      if (dt <= 0) return;
      const k = Math.pow(0.02, dt);
      ptr.vx *= k; ptr.vy *= k;
      render(t, dt);
    }
    perf.listeners.push(() => { resize(); });

    function start() {
      cancelAnimationFrame(raf);
      if (reduce.matches) { render(now(), 0); return; }
      last = performance.now() / 1000;
      prevTs = 0;
      raf = requestAnimationFrame(frame);
    }

    function burst(x, y) {
      for (const l of leaves) {
        const dx = l.x - x, dy = l.y - y, d = Math.hypot(dx, dy) || 1;
        if (d < 360) {
          const f = (1 - d / 360) * 420 * (0.4 + l.z);
          l.vx += dx / d * f; l.vy += dy / d * f;
          l.vflip += Math.sign(l.vflip || 1) * (1 - d / 360) * 6;
        }
      }
      const n = W < 700 ? 10 : 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.random() * 0.4;
        const sp = 60 + Math.random() * 120;
        sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 0.9 + Math.random() * 1.6, life: 1 + Math.random() * 0.8, max: 1.8 });
      }
      gust(x < W / 2 ? 1 : -1, 1.1);
    }

    readPalette();
    buildSprites();
    resize();
    start();

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); if (reduce.matches) render(now(), 0); }, 120);
    });
    window.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && !e.isPrimary) return;
      const t = performance.now();
      if (ptr.seen && t - ptr.seen < 80) {
        const dt = (t - ptr.seen) / 1000 || 0.016;
        ptr.vx = lerp(ptr.vx, (e.clientX - ptr.x) / dt, 0.5);
        ptr.vy = lerp(ptr.vy, (e.clientY - ptr.y) / dt, 0.5);
      }
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.seen = t;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { ptr.x = ptr.y = -9999; });
    window.addEventListener('pointerup', e => { if (e.pointerType === 'touch') setTimeout(() => { ptr.x = ptr.y = -9999; }, 400); }, { passive: true });
    window.addEventListener('pointerdown', e => {
      if (reduce.matches || e.button > 0) return;
      if (e.target.closest('a, button, input, select, textarea, label, summary, dialog, canvas, svg, [role="button"], .pane, .card, .lab-tool, .deep')) return;
      burst(e.clientX, e.clientY);
    }, { passive: true });
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const d = clamp(y - lastScroll, -160, 160);
      lastScroll = y;
      if (reduce.matches) return;
      for (const l of leaves) { l.y -= d * (0.05 + l.z * 0.2); if (Math.abs(d) > 30) l.vflip += Math.sign(l.vflip || 1) * 0.3; }
      for (const m of motes) m.y -= d * (0.04 + m.z * 0.1);
      for (const f of flies) f.y -= d * 0.06;
    }, { passive: true });
    document.addEventListener('basil:theme', () => {
      readPalette();
      buildSprites();
      buildBeams();
      motes = []; flies = [];
      populate();
      if (reduce.matches) render(now(), 0);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else start(); });
    if (reduce.addEventListener) reduce.addEventListener('change', start);
    return { burst };
  }

