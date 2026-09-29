/* Гид по базилику — живая сцена: общий ветер, фон оранжереи и растения */
window.BasilScene = (() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const now = () => performance.now() / 1000;
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* ------------------------------------------------------------------ */
  /* value noise (seeded, so the scene looks the same on every visit)   */
  /* ------------------------------------------------------------------ */
  let seed = 20240517;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const perm = new Uint8Array(512);
  (() => {
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const h3 = (x, y, z) => perm[(perm[(perm[x & 255] + y) & 255] + z) & 255] / 127.5 - 1;
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
    return lerp(
      lerp(lerp(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), lerp(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v),
      lerp(lerp(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), lerp(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u), v),
      w);
  }

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

    function buildBeams() {
      beams = [];
      if (pal.night) return;
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
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
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

    function drawSky(t) {
      if (pal.night) {
        const g = ctx.createRadialGradient(W * 0.86, -H * 0.05, 0, W * 0.86, -H * 0.05, Math.max(W, H) * 0.7);
        g.addColorStop(0, pal.moon);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 0.2);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        return;
      }
      for (const b of beams) {
        ctx.globalAlpha = 0.22 + 0.4 * (0.5 + 0.5 * Math.sin(t * b.sp + b.ph));
        const sway = Math.sin(t * 0.07 + b.ph) * W * 0.012;
        ctx.drawImage(b.c, sway, 0, W, H);
      }
    }

    function render(t, dt) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSky(t);
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

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const t = ts / 1000;
      let dt = t - last;
      last = t;
      if (dt > 0.05) dt = 0.05;
      if (dt <= 0) return;
      const k = Math.pow(0.02, dt);
      ptr.vx *= k; ptr.vy *= k;
      render(t, dt);
    }

    function start() {
      cancelAnimationFrame(raf);
      if (reduce.matches) { render(now(), 0); return; }
      last = performance.now() / 1000;
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

  /* ------------------------------------------------------------------ */
  /* PLANT: a procedural basil in SVG. Shoots are a tree; each node has  */
  /* a pair of opposite leaves turned 90° from the pair below.           */
  /* ------------------------------------------------------------------ */
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const f2 = v => Math.round(v * 100) / 100;

  /* one straight stem with n nodes; sizes follow a real basil: big lower
     leaves, small young ones at the tip */
  function basil(o = {}) {
    const n = o.nodes || 7;
    const st = o.stretch || 1;
    const lens = [24, 30, 30, 27, 23, 18, 13, 9, 7, 5];
    const sizes = [0.78, 0.96, 1, 0.94, 0.82, 0.64, 0.44, 0.28, 0.18, 0.12];
    const internodes = [], leaves = [];
    for (let i = 0; i < n; i++) {
      const k = Math.round((i / Math.max(1, n - 1)) * 9);
      internodes.push(lens[k] * (o.scale || 1) * st);
      leaves.push(sizes[k] * (o.leaf || 1) / Math.pow(st, 0.35));
    }
    return { id: o.id || 'r', internodes, leaves, w0: (o.w || 7) / Math.sqrt(st), w1: 2, angle: o.angle || 0, apex: o.apex || 'bud', flex: o.flex || 1, children: o.children || [], purple: !!o.purple };
  }

  /* bush after `rounds` pinches: every pinch leaves 3 nodes and wakes
     the two buds in the axils of the top pair */
  function bush(rounds, o = {}) {
    const keep = 3;
    const grow = (id, depth, left, angle) => {
      const scale = Math.pow(0.8, depth) * (o.scale || 1);
      if (left > 0) {
        const s = basil({ id, nodes: keep, scale, leaf: Math.pow(0.86, depth) * (o.leaf || 1), w: 7 * Math.pow(0.78, depth), angle, apex: 'cut', flex: 1 + depth * 0.4 });
        const spread = (0.5 - depth * 0.05);
        s.children = [
          { at: keep - 1, spec: grow(id + '.' + depth + 'L', depth + 1, left - 1, -spread) },
          { at: keep - 1, spec: grow(id + '.' + depth + 'R', depth + 1, left - 1, spread) }
        ];
        return s;
      }
      return basil({ id, nodes: depth ? 5 : 7, scale, leaf: Math.pow(0.86, depth) * (o.leaf || 1), w: 7 * Math.pow(0.78, depth), angle, flex: 1 + depth * 0.4 });
    };
    return grow('r', 0, rounds, 0);
  }

  function Plant(svg, spec, o = {}) {
    const root = svg.ownerSVGElement || svg;
    const layers = {
      back: mk('g', { class: 'pl-back' }, svg),
      stems: mk('g', { class: 'pl-stems' }, svg),
      mid: mk('g', { class: 'pl-mid' }, svg),
      front: mk('g', { class: 'pl-front' }, svg)
    };
    const base = { x: o.x || 0, y: o.y || 0 };
    const growDur = o.growDur || 2.4;
    let shoots = [];
    let raf = 0, last = 0, visible = true, running = false;
    const ptr = { x: -9999, y: -9999, speed: 0, down: false, lastAroma: 0 };

    function build(sp, parent, at, keep) {
      const prev = keep && keep.get(sp.id);
      const s = {
        spec: sp, parent, at,
        grow: prev ? prev.grow : (o.grown ? 1 : 0),
        started: !!(prev && prev.started) || !parent,
        sw: 0, sv: 0, pts: [], tipA: 0,
        stem: mk('path', { class: 'pl-stem' + (sp.purple ? ' is-purple' : '') }, layers.stems),
        hl: mk('path', { class: 'pl-stem-hl' }, layers.stems),
        cap: sp.apex === 'cut' ? mk('circle', { class: 'pl-scar', r: 2.2 }, layers.stems) : null,
        leaves: []
      };
      const n = sp.internodes.length;
      sp.internodes.forEach((_, i) => {
        const size = sp.leaves[i];
        const young = i >= n - 2 && sp.apex !== 'cut';
        const fill = sp.purple ? 'url(#pl-grad-purple)' : young ? 'url(#pl-grad-young)' : 'url(#pl-grad)';
        const pairSide = i % 2 === 0;
        const spreadBase = 64 - 40 * Math.pow(i / Math.max(1, n - 1), 1.15);
        const mkLeaf = (layer, side, kind, extraFill) => {
          const e = mk('use', { href: '#pl-leaf', class: 'pl-leaf' + (kind === 'back' ? ' is-back' : '') }, layer);
          e.style.fill = extraFill || fill;
          s.leaves.push({ el: e, node: i, side, kind, size, spread: spreadBase, a: 0, v: 0, ph: Math.random() * TAU });
        };
        if (pairSide) {
          mkLeaf(layers.mid, -1, 'side');
          mkLeaf(layers.mid, 1, 'side');
        } else {
          const lean = (i % 4 === 1) ? 1 : -1;
          mkLeaf(layers.back, -lean, 'back', sp.purple ? 'url(#pl-grad-purple)' : 'url(#pl-grad-back)');
          mkLeaf(layers.front, lean, 'front');
        }
      });
      shoots.push(s);
      sp.children.forEach(ch => build(ch.spec, s, ch.at, keep));
      return s;
    }

    function setSpec(sp, opts = {}) {
      const keep = new Map(shoots.map(s => [s.spec.id, s]));
      Object.values(layers).forEach(l => { while (l.firstChild) l.firstChild.remove(); });
      shoots = [];
      build(sp, null, 0, opts.regrow ? null : keep);
      if (opts.regrow) shoots.forEach(s => { s.grow = 0; s.started = !s.parent; });
      if (reduce.matches || o.static) { shoots.forEach(s => { s.grow = 1; s.started = true; }); draw(now(), 0); }
      else wake();
    }

    const nodeE = (s, i) => {
      const n = s.spec.internodes.length;
      const x = s.grow * (n + 1.5) - i;
      return clamp(x / 1.5, 0, 1);
    };

    function layout(s, P, ang) {
      const sp = s.spec, n = sp.internodes.length;
      let x = P.x, y = P.y, a = ang + sp.angle * Math.min(1, s.grow * 3);
      s.pts[0] = { x, y, a };
      let wsum = 0;
      for (let i = 0; i < n; i++) wsum += Math.pow(i + 1, 1.3);
      for (let i = 0; i < n; i++) {
        a += s.bend * Math.pow(i + 1, 1.3) / wsum;
        const len = sp.internodes[i] * Math.max(0.001, nodeE(s, i));
        x += Math.sin(a) * len;
        y -= Math.cos(a) * len;
        s.pts[i + 1] = { x, y, a };
      }
      s.tipA = a;
    }

    function stemPath(s) {
      const pts = s.pts, n = pts.length - 1, sp = s.spec;
      const L = [], R = [];
      for (let i = 0; i <= n; i++) {
        const w = lerp(sp.w0, sp.w1, i / n) * (0.35 + 0.65 * Math.min(1, s.grow * 1.6)) / 2;
        const p = pts[i], cs = Math.cos(p.a), sn = Math.sin(p.a);
        L.push([p.x - cs * w, p.y - sn * w]);
        R.push([p.x + cs * w, p.y + sn * w]);
      }
      const seg = arr => {
        let d = '';
        for (let i = 1; i < arr.length - 1; i++) {
          const m = [(arr[i][0] + arr[i + 1][0]) / 2, (arr[i][1] + arr[i + 1][1]) / 2];
          d += ` Q${f2(arr[i][0])} ${f2(arr[i][1])} ${f2(m[0])} ${f2(m[1])}`;
        }
        const e = arr[arr.length - 1];
        return d + ` L${f2(e[0])} ${f2(e[1])}`;
      };
      const tip = pts[n];
      const rTip = lerp(sp.w0, sp.w1, 1) * 0.5;
      const Rr = R.slice().reverse();
      let d = `M${f2(L[0][0])} ${f2(L[0][1])}` + seg(L);
      d += ` Q${f2(tip.x + Math.sin(tip.a) * rTip * 1.4)} ${f2(tip.y - Math.cos(tip.a) * rTip * 1.4)} ${f2(Rr[0][0])} ${f2(Rr[0][1])}`;
      d += seg(Rr) + ' Z';
      s.stem.setAttribute('d', d);
      let h = '';
      for (let i = 0; i <= n; i++) {
        const w = lerp(sp.w0, sp.w1, i / n) * 0.2;
        const p = pts[i];
        h += (i ? ' L' : 'M') + f2(p.x - Math.cos(p.a) * w) + ' ' + f2(p.y - Math.sin(p.a) * w);
      }
      s.hl.setAttribute('d', h);
      s.hl.style.strokeWidth = Math.max(0.6, sp.w0 * 0.14);
      if (s.cap) { s.cap.setAttribute('cx', f2(tip.x)); s.cap.setAttribute('cy', f2(tip.y)); s.cap.style.opacity = s.grow > 0.9 ? 1 : 0; }
    }

    function draw(t, dt) {
      const w = o.static || reduce.matches ? 0 : wind(t, base.x);
      for (const s of shoots) {
        if (!s.started && s.parent && s.parent.grow * (s.parent.spec.internodes.length + 1.5) > s.at + 2) s.started = true;
        if (s.started && s.grow < 1 && dt > 0) s.grow = Math.min(1, s.grow + dt / (growDur * (s.parent ? 0.8 : 1)));
        if (!s.started) s.grow = 0;
        s.sv += (-38 * s.sw - 5 * s.sv) * dt;
        s.sw += s.sv * dt;
        s.bend = (w * 0.07 + Math.sin(t * 1.3 + s.spec.id.length) * 0.012) * s.spec.flex * (o.sway || 1) + s.sw;
      }
      for (const s of shoots) {
        if (!s.parent) layout(s, base, 0);
        else {
          const p = s.parent.pts[s.at + 1] || s.parent.pts[s.parent.pts.length - 1];
          layout(s, p, p.a);
        }
        stemPath(s);
        const vis = s.grow > 0.001;
        s.stem.style.display = vis ? '' : 'none';
        s.hl.style.display = vis ? '' : 'none';
      }
      for (const s of shoots) {
        for (const lf of s.leaves) {
          const e = nodeE(s, lf.node);
          const p = s.pts[lf.node + 1];
          if (!p || e <= 0.02) { lf.el.style.display = 'none'; continue; }
          lf.el.style.display = '';
          const g = Math.pow(Math.max(0, (e - 0.25) / 0.75), 0.8);
          const flutter = Math.sin(t * 2.2 + lf.ph) * 2.2 * (1 + Math.abs(w)) + w * 7;
          if (dt > 0) {
            lf.v += (-60 * lf.a - 7 * lf.v) * dt;
            lf.a += lf.v * dt;
          }
          let ang, sx, sy;
          const size = lf.size * (o.leafScale || 1);
          if (lf.kind === 'side') {
            ang = p.a * 180 / Math.PI + lf.side * lf.spread * (0.55 + 0.45 * g);
            sx = size * (0.25 + 0.75 * g);
            sy = size * g;
          } else if (lf.kind === 'front') {
            ang = p.a * 180 / Math.PI + lf.side * (lf.spread * 0.42);
            sx = size * (0.25 + 0.75 * g) * 0.92;
            sy = size * g * 0.74;
          } else {
            ang = p.a * 180 / Math.PI + lf.side * (lf.spread * 0.5);
            sx = size * (0.25 + 0.75 * g) * 0.86;
            sy = size * g * 0.7;
          }
          ang += flutter + lf.a;
          lf.tip = { x: p.x + Math.sin(ang * Math.PI / 180) * 60 * sy, y: p.y - Math.cos(ang * Math.PI / 180) * 60 * sy };
          lf.el.setAttribute('transform', `translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(ang)}) scale(${f2(sx)} ${f2(sy)})`);
        }
      }
    }

    function pushFromPointer() {
      if (ptr.x < -9000) return;
      for (const s of shoots) {
        for (const lf of s.leaves) {
          if (!lf.tip) continue;
          const dx = lf.tip.x - ptr.x, dy = lf.tip.y - ptr.y;
          const d = Math.hypot(dx, dy);
          const R = 64;
          if (d < R) {
            const f = 1 - d / R;
            lf.v += (dx > 0 ? 1 : -1) * f * f * (40 + ptr.speed * 0.25);
          }
        }
        const tip = s.pts[s.pts.length - 1];
        if (tip) {
          const d = Math.hypot(tip.x - ptr.x, tip.y - ptr.y);
          if (d < 90) s.sv += (tip.x > ptr.x ? 1 : -1) * (1 - d / 90) * (0.6 + ptr.speed * 0.004);
        }
      }
    }

    function nearestLeaf(x, y) {
      let best = null, bd = 46;
      for (const s of shoots) for (const lf of s.leaves) {
        if (!lf.tip || lf.el.style.display === 'none') continue;
        const d = Math.hypot(lf.tip.x - x, lf.tip.y - y);
        if (d < bd) { bd = d; best = lf; }
      }
      return best;
    }

    function frame(ts) {
      raf = 0;
      if (!visible || document.hidden) { running = false; return; }
      const t = ts / 1000;
      let dt = t - last;
      last = t;
      if (dt > 0.05) dt = 0.05;
      pushFromPointer();
      ptr.speed *= 0.85;
      draw(t, Math.max(0, dt));
      raf = requestAnimationFrame(frame);
    }
    function wake() {
      if (reduce.matches || o.static) { draw(now(), 0); return; }
      if (raf) return;
      running = true;
      last = performance.now() / 1000;
      raf = requestAnimationFrame(frame);
    }

    const toLocal = e => {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const p = root.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      return p.matrixTransform(m.inverse());
    };
    if (o.interactive) {
      root.addEventListener('pointermove', e => {
        const p = toLocal(e);
        if (!p) return;
        ptr.speed = Math.min(600, ptr.speed + Math.hypot(p.x - ptr.x, p.y - ptr.y) * (ptr.x < -9000 ? 0 : 1));
        ptr.x = p.x; ptr.y = p.y;
        if (ptr.down && o.onAroma && performance.now() - ptr.lastAroma > 160) {
          const lf = nearestLeaf(p.x, p.y);
          if (lf) { ptr.lastAroma = performance.now(); lf.v += 30; o.onAroma(e.clientX, e.clientY, lf); }
        }
        wake();
      });
      root.addEventListener('pointerleave', () => { ptr.x = ptr.y = -9999; ptr.down = false; });
      root.addEventListener('pointerdown', e => {
        const p = toLocal(e);
        if (!p) return;
        ptr.down = true;
        ptr.x = p.x; ptr.y = p.y;
        const lf = nearestLeaf(p.x, p.y);
        if (lf) {
          lf.v += 90 * (Math.random() < 0.5 ? -1 : 1);
          ptr.lastAroma = performance.now();
          if (o.onAroma) o.onAroma(e.clientX, e.clientY, lf);
        }
        wake();
      });
      window.addEventListener('pointerup', () => { ptr.down = false; });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries.some(en => en.isIntersecting);
        if (visible) wake();
      }).observe(root);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
    if (reduce.addEventListener) reduce.addEventListener('change', () => { shoots.forEach(s => { s.grow = 1; s.started = true; }); wake(); });

    setSpec(spec);
    return {
      setSpec,
      regrow: () => setSpec(shoots.length ? shoots[0].spec : spec, { regrow: true }),
      points: id => { const s = shoots.find(x => x.spec.id === id); return s ? s.pts : []; },
      shoots: () => shoots,
      poke: (amp = 1) => { shoots.forEach(s => { s.sv += (Math.random() - 0.5) * 2 * amp; }); wake(); },
      wake
    };
  }

  /* ------------------------------------------------------------------ */
  /* aroma puffs: tiny molecules rising from a rubbed leaf               */
  /* ------------------------------------------------------------------ */
  const NOTES = [
    ['линалоол', 'цветочная нота'], ['эвгенол', 'гвоздика'], ['1,8-цинеол', 'холодок, эвкалипт'],
    ['эстрагол', 'анис'], ['(Z)-3-гексеналь', 'запах срезанной травы'], ['α-бергамотен', 'чайная, древесная'], ['оцимен', 'сладкая зелень']
  ];
  let noteIdx = 0;
  function aroma(layer, clientX, clientY, opts = {}) {
    if (!layer) return;
    const box = layer.getBoundingClientRect();
    const x = clientX - box.left, y = clientY - box.top;
    const still = reduce.matches;
    const n = still ? 0 : 7;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'aroma-dot';
      p.style.setProperty('--x', x + 'px');
      p.style.setProperty('--y', y + 'px');
      p.style.setProperty('--dx', ((Math.random() - 0.5) * 70).toFixed(1) + 'px');
      p.style.setProperty('--dy', (-70 - Math.random() * 90).toFixed(1) + 'px');
      p.style.setProperty('--s', (0.5 + Math.random() * 0.9).toFixed(2));
      p.style.setProperty('--d', (1.6 + Math.random() * 1.2).toFixed(2) + 's');
      p.style.setProperty('--hue', i % 3);
      layer.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
    if (opts.label === false) return;
    const now2 = performance.now();
    if (layer._lastLabel && now2 - layer._lastLabel < 700) return;
    layer._lastLabel = now2;
    const [name, note] = NOTES[noteIdx++ % NOTES.length];
    const lb = document.createElement('span');
    lb.className = 'aroma-label';
    lb.style.setProperty('--x', x + 'px');
    lb.style.setProperty('--y', y + 'px');
    lb.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><circle cx="12" cy="12" r="3"/></svg><b>${name}</b><small>${note}</small>`;
    layer.appendChild(lb);
    lb.addEventListener('animationend', () => lb.remove(), { once: true });
    if (opts.onNote) opts.onNote(name, note);
  }

  return { wind, gust, noise3, initBackground, Plant, basil, bush, aroma, reduce };
})();
