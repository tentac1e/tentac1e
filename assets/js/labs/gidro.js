/* Гид по базилику — живые модели главы «Гидропоника». Файл собирает scripts/build.py из src/labs/gidro/ — правьте там */
(() => {
  'use strict';
  const { register, illustrate, api: h } = window.BasilScience;
  const S = window.BasilScene;
  const { $, $$, clamp, lerp, fmt, fmt0, esc } = h;
  const NS = 'http://www.w3.org/2000/svg';
  const r1 = v => Math.round(v * 10) / 10;
  const pct = v => `${fmt0(v * 100)} %`;
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const set = (root, id, html) => { const e = $('#' + id, root); if (e) e.innerHTML = html; };
  const doyToday = () => { const t = new Date(); return Math.round((t - new Date(t.getFullYear(), 0, 0)) / 864e5); };
  const doyLabel = n => { const d = new Date(2023, 0, n); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
  const citiesChips = (id, lat) => h.chipsHtml(id, 'Город', h.CITIES.map(([l, n]) => [l, n]), lat);

  const { micro, ill, props } = window.BasilLibs;
  window.BasilScience.styleFor("gidro", "/* captions inside the hydroponics schemes: a halo of the paper keeps them readable over water and walls */\n.hs-lbl { font: 600 11px/1 var(--font-mono); fill: var(--ink-2); letter-spacing: .02em; paint-order: stroke; stroke: var(--ill-bg); stroke-width: 3.5px; stroke-linejoin: round; }\n.hs-chart .lab-svg { display: block; border-radius: 14px; }\n.lab-svg .band.is-low { fill: var(--danger-soft); opacity: .75; }\n/* readings without a chart (hyGauge, hyScale, hyHero in _shared.js) */\n.hy-hero { display: grid; gap: 4px; margin: 0; }\n.hy-hero b { font: 700 3rem/1 var(--font-body); color: var(--ink); letter-spacing: -.01em; }\n.hy-hero span { font-size: .92rem; line-height: 1.4; color: var(--ink-2); }\n.hy-gauge { display: grid; gap: 8px; }\n.hy-gauge-h { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin: 0; }\n.hy-gauge-h span { font-size: .74rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); }\n.hy-gauge-h b { font: 600 1.1rem/1.2 var(--font-body); color: var(--ink); }\n.hy-state { padding: 2px 9px; border-radius: 999px; font: 600 .74rem/1.4 var(--font-body); font-style: normal; }\n.hy-state.is-good { background: var(--leaf-soft); color: var(--basil-deep); }\n.hy-state.is-warn { background: var(--oil-soft); color: var(--ink); }\n.hy-state.is-bad { background: var(--danger-soft); color: var(--danger); }\n.hy-mtrack { position: relative; display: block; height: 12px; border-radius: 6px; overflow: hidden; }\n.hy-mfill { display: block; height: 100%; border-radius: 0 6px 6px 0; transition: width .35s var(--ease-float); }\n.hy-meter.is-good .hy-mtrack { background: var(--leaf-soft); } .hy-meter.is-good .hy-mfill { background: var(--basil); }\n.hy-meter.is-warn .hy-mtrack { background: var(--oil-soft); } .hy-meter.is-warn .hy-mfill { background: var(--oil); }\n.hy-meter.is-bad .hy-mtrack { background: var(--danger-soft); } .hy-meter.is-bad .hy-mfill { background: var(--danger); }\n.hy-mtick { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: var(--surface); }\n.hy-scale { display: grid; gap: 5px; }\n.hy-znames, .hy-ticks { position: relative; height: 18px; }\n.hy-znames span, .hy-ticks span { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; font: 500 .74rem/18px var(--font-mono); color: var(--ink-3); }\n.hy-znames span { font: 600 .78rem/18px var(--font-body); color: var(--ink-2); }\n.hy-ticks span:first-child { transform: none; }\n.hy-ticks span:last-child { transform: translateX(-100%); }\n.hy-track { position: relative; height: 16px; }\n.hy-zones { position: absolute; inset: 0; border-radius: 8px; overflow: hidden; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); }\n.hy-zone { position: absolute; top: 0; bottom: 0; }\n.hy-zone.is-good { background: var(--leaf-soft); } .hy-zone.is-warn { background: var(--oil-soft); } .hy-zone.is-bad { background: var(--danger-soft); }\n.hy-link { position: absolute; top: 7px; height: 2px; background: var(--ink-3); transition: left .35s var(--ease-float), width .35s var(--ease-float); }\n.hy-mark { position: absolute; top: 50%; width: 16px; height: 16px; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 0 2px var(--surface); transition: left .35s var(--ease-float); }\n.hy-mark.is-from { background: var(--surface); border: 2px solid var(--ink-3); }\n.hy-mark.is-to.is-good { background: var(--basil); } .hy-mark.is-to.is-warn { background: var(--oil); } .hy-mark.is-to.is-bad { background: var(--danger); }\n.hy-key { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 6px 0 0; padding: 0; list-style: none; font-size: .8rem; color: var(--ink-3); }\n.hy-key li { display: flex; align-items: center; gap: 6px; }\n.hy-key i { width: 12px; height: 12px; border-radius: 50%; }\n.hy-key .is-from { background: var(--surface); border: 2px solid var(--ink-3); }\n.hy-key .is-to { background: var(--ink-2); }\n/* a model's picture beside its readings, one under the other on a phone */\n.hy-split { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(16px, 3vw, 28px); align-items: center; margin-top: 8px; }\n@media (max-width: 760px) { .hy-split { grid-template-columns: 1fr; } }\n.hy-pic .ill { display: block; width: 100%; height: auto; border-radius: 14px; }\n.hy-read { display: grid; gap: 18px; align-content: start; }\n.hy-verdict { margin: 0; color: var(--ink-2); }\n/* the share of growth that goes to the leaves and to the roots: one bar of two parts, a gap of the surface\n   between them */\n.al-split { display: grid; gap: 10px; }\n.al-row { display: grid; grid-template-columns: 84px minmax(0, 1fr) auto; gap: 10px; align-items: center; }\n.al-name { font-weight: 600; font-size: .9rem; }\n.al-bar { display: flex; gap: 2px; height: 14px; }\n.al-bar i { display: block; width: var(--w); border-radius: 4px; transition: width .4s var(--ease-float); }\n.al-leaf, .al-key-leaf { background: var(--ser-1); }\n.al-root, .al-key-root { background: var(--soil); }\n.al-val { font: 500 .78rem/1.2 var(--font-mono); color: var(--ink-3); text-align: right; white-space: nowrap; }\n@media (max-width: 460px) { .al-row { grid-template-columns: 70px minmax(0, 1fr) auto; gap: 8px; } }\n/* the jar beside its readings */\n.kr-split { grid-template-columns: minmax(0, 200px) minmax(0, 1fr); }\n.kr-stage .ill { max-width: 200px; margin-inline: auto; }\n@media (max-width: 760px) { .kr-split { grid-template-columns: 1fr; } .kr-stage .ill { max-width: 170px; } }\n.cap-stage .cap-svg { display: block; width: 100%; max-width: 360px; height: auto; margin-inline: auto; }\n/* the solution calculator: how much of each part, and the order */\n.hm-row { margin-bottom: 0; }\n.hm-out { display: grid; gap: 14px; margin-top: 16px; }\n.hm-parts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 10px; }\n.hm-part { display: grid; gap: 2px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }\n.hm-k { font: 600 .7rem/1.2 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }\n.hm-part b { font: 600 1.5rem/1.1 var(--font-display); color: var(--k); }\n.hm-part small { font: 500 .76rem/1.3 var(--font-mono); color: var(--ink-3); }\n.hm-steps { margin: 0; padding-left: 1.3em; display: grid; gap: 6px; color: var(--ink-2); }\n.hm-warn { margin: 0; padding: 10px 14px; border-radius: 12px; background: var(--oil-soft); color: var(--ink); font-size: .92rem; }\n.hm-row { grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); align-items: end; }\n/* oxygen in the water and what the roots ask for: two bars on one scale */\n.o2-out { display: grid; gap: 16px; margin-top: 14px; }\n.o2-bars { display: grid; gap: 10px; }\n.o2-row { display: grid; grid-template-columns: 116px minmax(0, 1fr) 82px; gap: 10px; align-items: center; }\n.o2-name { font-weight: 600; font-size: .9rem; }\n.o2-bar { display: block; height: 16px; border-radius: 4px; background: var(--surface-2); }\n.o2-bar i { display: block; height: 100%; border-radius: 0 4px 4px 0; transition: width .35s var(--ease-float); }\n.o2-bar .is-o2 { background: var(--ser-4); }\n.o2-bar .is-need { background: var(--ser-3); }\n.o2-val { font: 500 .82rem/1.2 var(--font-mono); color: var(--ink-2); text-align: right; }\n@media (max-width: 460px) { .o2-row { grid-template-columns: 96px minmax(0, 1fr) 72px; gap: 8px; } }\n/* the solution on two scales: EC and pH, where it was and where it is */\n.dr-out { display: grid; gap: 16px; margin-top: 8px; }\n.dr-scales { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 28px; }\n@media (max-width: 760px) { .dr-scales { grid-template-columns: 1fr; } }\n.dr-scale { display: grid; gap: 6px; }\n.dr-h { display: flex; align-items: baseline; gap: 10px; margin: 0; }\n.dr-h span { font-size: .74rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); }\n.dr-h b { font: 600 1.05rem/1.2 var(--font-body); color: var(--ink); }\n/* the check: what to do, worst first */\n.hc-list { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 8px; }\n.hc-item { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 12px; align-items: start; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }\n.hc-item b { display: block; font-size: .95rem; }\n.hc-item p { margin: 3px 0 0; font-size: .88rem; color: var(--ink-2); }\n.hc-st { justify-self: start; padding: 3px 9px; border-radius: 999px; font: 600 .7rem/1.4 var(--font-mono); letter-spacing: .06em; text-transform: uppercase; }\n.hc-item.is-bad { border-color: color-mix(in srgb, var(--danger) 45%, var(--line)); }\n.hc-item.is-bad .hc-st { background: var(--danger-soft); color: var(--danger); }\n.hc-item.is-warn .hc-st { background: var(--oil-soft); color: var(--ink); }\n.hc-item.is-ok .hc-st, .hc-item.is-all .hc-st { background: var(--leaf-soft); color: var(--basil-deep); }\n@media (max-width: 460px) { .hc-item { grid-template-columns: 1fr; gap: 6px; } }\n");
  /* @use props */
  /* Pictures of the Hydroponics chapter: the steps of a Kratky jar (data-ill="hyd:k1…k5") and of a bucket with an
     air pump, DWC (hyd:d1…d5), the tab «Своими руками». The jar and the bucket are drawn cut open where it helps. */
  const Fh = ill.F, qh = ill.q, Rh = props;

  // a glass jar on (x, y), cut open: level 0–1 of the solution, a lid with a net cup (cup: false — none), roots
  // reaching down from the cup (len, px), air: the upper roots are in the air and covered in hairs
  function hjar(x, y, w = 50, h = 66, o = {}) {
    const t = w / 2, top = y - h, lv = o.level == null ? 0.6 : o.level, yl = y - 4 - (h - 16) * lv;
    let g = `<rect x="${qh(x - t)}" y="${qh(top + 6)}" width="${qh(w)}" height="${qh(h - 6)}" rx="7" fill="${Fh('glass')}" opacity=".5" stroke="${Fh('glass-d')}" stroke-width="1.2"/>`;
    if (lv > 0) g += `<path d="M${qh(x - t + 2)} ${qh(yl)}H${qh(x + t - 2)}V${qh(y - 7)}Q${qh(x + t - 2)} ${qh(y - 2)} ${qh(x + t - 7)} ${qh(y - 2)}H${qh(x - t + 7)}Q${qh(x - t + 2)} ${qh(y - 2)} ${qh(x - t + 2)} ${qh(y - 7)}Z" fill="${Fh('water-c')}" opacity=".95"/>`;
    if (o.wrap) {
      // foil round the jar, with a slit to see the level through
      const wy = top + 14, sx = x + t * 0.45;
      g += `<path d="M${qh(x - t)} ${qh(wy)}H${qh(x + t)}V${qh(y - 6)}Q${qh(x + t)} ${qh(y)} ${qh(x + t - 6)} ${qh(y)}H${qh(x - t + 6)}Q${qh(x - t)} ${qh(y)} ${qh(x - t)} ${qh(y - 6)}Z" fill="${Fh('metal')}"/>`;
      g += [0.25, 0.5, 0.75].map(k => `<path d="M${qh(x - t + 3)} ${qh(wy + (y - wy) * k)}l${qh(w * 0.2)} -3l${qh(w * 0.18)} 4" stroke="${Fh('metal-d')}" stroke-width=".8" fill="none" opacity=".6"/>`).join('');
      g += `<rect x="${qh(sx - 2.5)}" y="${qh(wy + 4)}" width="5" height="${qh(y - wy - 10)}" rx="2" fill="${Fh('glass')}" stroke="${Fh('metal-d')}" stroke-width=".8"/>`;
      if (lv > 0) g += `<rect x="${qh(sx - 1.6)}" y="${qh(Math.max(yl, wy + 5))}" width="3.2" height="${qh(y - 7 - Math.max(yl, wy + 5))}" rx="1.4" fill="${Fh('water-c')}"/>`;
    }
    if (o.roots) {
      const cy = top + 14, air = Math.max(0, yl - cy);
      g += Rh.roots(x, cy, o.roots, 7, { seed: o.seed || 5, spread: 0.55, w: 1.5 });
      if (o.air && air > 8) {
        // the air roots: short, fuzzy with root hairs, above the solution
        let d = '';
        for (let i = 0; i < 16; i++) { const yy = cy + 3 + (air - 6) * (i / 15), sd = i % 2 ? 1 : -1; d += `M${qh(x + sd * (2 + (i % 4)))} ${qh(yy)}l${qh(sd * (5 + (i % 3) * 2))} ${qh(1.5)}`; }
        g += `<path d="${d}" stroke="${Fh('root')}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      }
    }
    g += `<path d="M${qh(x - t + 5)} ${qh(top + 14)}V${qh(y - 10)}" stroke="${Fh('hi')}" stroke-width="2.4" opacity=".45" stroke-linecap="round"/>`;
    if (o.lid !== false) g += `<rect x="${qh(x - t - 2)}" y="${qh(top)}" width="${qh(w + 4)}" height="8" rx="2.5" fill="${Fh(o.lidColor || 'metal-d')}"/>`;
    if (o.cup !== false && o.lid !== false) g += hcup(x, top + 1, 18, o.cupH || 16, o);
    return { svg: g, yl, top };
  }
  // a net cup hanging from a lid at (x, y): its rim on y. o.fill: 'cube' (rock wool and expanded clay), 'clay'
  function hcup(x, y, w = 18, h = 16, o = {}) {
    const t = w / 2, b = t * 0.72;
    let g = `<path d="M${qh(x - t)} ${qh(y)}H${qh(x + t)}L${qh(x + b)} ${qh(y + h)}H${qh(x - b)}Z" fill="${Fh('plastic')}" opacity=".9"/>`;
    g += `<path d="M${qh(x - t * 0.5)} ${qh(y + 2)}V${qh(y + h - 1)}M${qh(x)} ${qh(y + 2)}V${qh(y + h - 1)}M${qh(x + t * 0.5)} ${qh(y + 2)}V${qh(y + h - 1)}M${qh(x - t * 0.9)} ${qh(y + h * 0.45)}H${qh(x + t * 0.9)}" stroke="${Fh('plastic-hi')}" stroke-width="1.1"/>`;
    if (o.fill === 'cube' || o.fill === 'clay') {
      if (o.fill === 'cube') g += `<rect x="${qh(x - 5)}" y="${qh(y - 6)}" width="10" height="${qh(h * 0.7)}" rx="1.5" fill="${Fh('straw')}" stroke="${Fh('kraft-d')}" stroke-width=".7"/>`;
      [[-7, -3], [-3.4, -5.5], [7, -3], [3.6, -5.6], [0, -7.2]].forEach(([dx, dy], i) => { if (o.fill === 'cube' && Math.abs(dx) < 4) return; g += `<circle cx="${qh(x + dx)}" cy="${qh(y + dy + 2)}" r="${3.2 - (i % 2) * 0.4}" fill="${Fh('pot')}" stroke="${Fh('pot-d')}" stroke-width=".6"/>`; });
    }
    return g;
  }
  // a young basil standing in the cup: rim on (x, y)
  const hsprout = (x, y, hgt, pairs, s = 1.2) => Rh.sprout(x, y - 5, hgt, { pairs, s });

  const HYD = {
    k1: () => {
      const j = hjar(52, 104, 52, 70, { level: 0, wrap: true, cup: false, lid: false });
      // the roll of foil the jar is wrapped in
      const roll = `<rect x="86" y="80" width="26" height="22" rx="4" fill="${Fh('metal')}" stroke="${Fh('metal-d')}" stroke-width="1"/><ellipse cx="112" cy="91" rx="3.2" ry="11" fill="${Fh('metal-d')}" opacity=".7"/><path d="M86 98 Q76 100 70 96" stroke="${Fh('metal')}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      return Rh.step(j.svg + roll + ill.label(118, 30, 'щель', 'end'), 'Банка в фольге с узкой щелью, чтобы видеть уровень');
    },
    k2: () => {
      // the lid seen from above with a hole, and the net cup going into it
      let g = `<ellipse cx="56" cy="88" rx="38" ry="13" fill="${Fh('metal-d')}"/><ellipse cx="56" cy="86" rx="35" ry="11" fill="${Fh('metal')}"/>`;
      g += `<ellipse cx="56" cy="86" rx="11" ry="4" fill="${Fh('dark')}"/>`;
      g += hcup(56, 40, 22, 22);
      g += Rh.arrow(84, 50, 70, 76, -8);
      g += `<path d="M96 34 l10 -10 M100 38 l10 -10" stroke="${Fh('grip')}" stroke-width="3" stroke-linecap="round"/><path d="M90 40l6 -6l4 4l-6 6z" fill="${Fh('metal-d')}"/>`;
      return Rh.step(g, 'Отверстие в крышке под сетчатый стаканчик');
    },
    k3: () => {
      const j = hjar(46, 104, 54, 72, { level: 0.98, cupH: 24 });
      // the dimension: the cup's bottom stands 1–2 cm in the solution
      const cb = j.top + 25;
      const dimL = `<g class="ill-scale"><path d="M78 ${qh(j.yl)}H86M78 ${qh(cb)}H86M82 ${qh(j.yl)}V${qh(cb)}" fill="none" stroke="currentColor"/></g>`;
      return Rh.step(j.svg + dimL + ill.label(118, qh(cb + 18), '1–2 см', 'end'), 'Раствор налит так, что дно стаканчика стоит в нём на 1–2 см');
    },
    k4: () => {
      const j = hjar(60, 104, 54, 58, { level: 0.82, fill: 'cube', roots: 10 });
      return Rh.step(j.svg + hsprout(60, j.top - 2, 20, 2, 1.15), 'Сеянец в кубике минваты, вокруг керамзит');
    },
    k5: () => {
      const j = hjar(37, 106, 46, 66, { level: 0.36, fill: 'clay', roots: 48, air: true, seed: 7 });
      let g = j.svg + ill.bush({ x: 37, y: j.top - 4, h: 26, nodes: 2, leaf: 0.17, spread: 0.8, seed: 6 });
      g += ill.label(119, qh(j.top + 26), 'воздух', 'end') + ill.label(119, qh(j.yl + 18), 'раствор', 'end');
      return Rh.step(g, 'Уровень опустился: верх корней в воздухе, низ в растворе', 106);
    },
    d1: () => {
      // an opaque bucket with its lid and handle
      let g = `<path d="M30 46H90L84 104H36Z" fill="${Fh('box')}"/><path d="M80 46H90L84 104H76Z" fill="${Fh('box-d')}" opacity=".5"/>`;
      g += `<rect x="26" y="40" width="68" height="9" rx="3" fill="${Fh('box-d')}"/><path d="M30 50Q60 18 90 50" stroke="${Fh('metal-d')}" stroke-width="2" fill="none"/>`;
      g += `<path d="M40 56V96" stroke="${Fh('hi')}" stroke-width="3" opacity=".3" stroke-linecap="round"/>`;
      g += ill.label(60, 16, '10–20 л');
      return Rh.step(g, 'Непрозрачное ведро на 10–20 литров с крышкой');
    },
    d2: () => {
      let g = `<ellipse cx="60" cy="74" rx="46" ry="20" fill="${Fh('box-d')}"/><ellipse cx="60" cy="71" rx="43" ry="17" fill="${Fh('box')}"/>`;
      [[-24, -2], [0, -8], [24, -2], [0, 7]].forEach(([dx, dy]) => { g += `<ellipse cx="${60 + dx}" cy="${71 + dy}" rx="8" ry="3.4" fill="${Fh('dark')}"/>`; });
      g += `<circle cx="92" cy="74" r="2" fill="${Fh('dark')}"/>`;
      g += Rh.dim(36, 60, 40, '15–20 см');
      return Rh.step(g, 'Крышка с четырьмя отверстиями под стаканчики и одним для шланга');
    },
    d3: () => {
      let g = Rh.tank(52, 104, 74, 52, { pots: [] });
      // the pump stands higher than the water, its hose with a check valve goes in through the lid
      g += `<rect x="90" y="30" width="24" height="16" rx="4" fill="${Fh('frame')}" stroke="${Fh('frame-d')}" stroke-width="1.2"/><circle cx="97" cy="38" r="2.4" fill="${Fh('frame-d')}"/><path d="M102 32h8" stroke="${Fh('frame-d')}" stroke-width="1"/>`;
      g += `<path d="M96 46Q94 56 84 56H76Q72 56 72 48" stroke="${Fh('frame-d')}" stroke-width="1.8" fill="none"/>`;
      g += `<rect x="78" y="52.5" width="7" height="7" rx="1.5" fill="${Fh('grip')}"/>`;
      return Rh.step(g + ill.label(118, 22, 'выше воды', 'end'), 'Компрессор выше уровня воды, шланг с клапаном к камню на дне');
    },
    d4: () => {
      let g = Rh.tank(60, 104, 92, 56, { pots: [-0.52, 0.52], seed: 4 });
      [-0.52, 0.52].forEach((k, i) => { g += hsprout(60 + k * 46, 46, 18, 1, 1.1 - i * 0.05); });
      // the bubbles burst at the top and splash the cups
      [[30, 54], [38, 51], [82, 53], [90, 50], [60, 53]].forEach(([x, y]) => { g += `<circle cx="${x}" cy="${y}" r="1.4" fill="${Fh('water-c')}" stroke="${Fh('glass-d')}" stroke-width=".5"/>`; });
      return Rh.step(g, 'Раствор чуть ниже дна стаканчиков, пузыри брызгают на субстрат');
    },
    d5: () => {
      let g = Rh.tank(60, 104, 96, 58, { pots: [-0.55, 0, 0.55], seed: 8 });
      [-0.45, 0, 0.45].forEach((k, i) => { g += ill.bush({ x: 60 + k * 48, y: 44, h: 24, nodes: 2, leaf: 0.15, spread: 0.75, seed: 3 + i }); });
      g += `<g transform="translate(110 13)"><circle r="7" fill="${Fh('frame')}" stroke="${Fh('frame-d')}" stroke-width="1.2"/><path d="M0 -4V0L3 1.6" stroke="${Fh('dark')}" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>`;
      return Rh.step(g, 'Взрослые кусты, длинные корни в растворе, пузыри круглые сутки');
    }
  };
  illustrate('hyd', k => (HYD[k] || HYD.k1)(), Object.keys(HYD));

  // a choice with long names: chips that wrap to a new line, under a caption of their own
  const pickHtml = (id, label, options, value) => `<div class="lab-seg-wrap"><span class="lab-label" id="${id}-l">${label}</span>${h.chipsHtml(id, label, options, value)}</div>`;
  // a number with its tenths only when it has them: 24 °C, 24,5 °C
  const fv = v => Math.abs(v % 1) > 1e-9 ? fmt(v) : fmt0(v);

  /* Readings without a chart. A meter — one value against its limits, its fill in the colour of its state and its
     track a lighter step of it; a scale with zones on which a value goes from where it was (a ring) to where it
     is (a dot). Both are HTML laid out in percentages: their words keep their real size at any width, and the
     state is said in a word beside the colour, never by the colour alone. */
  const hyPc = (v, a, b) => clamp((v - a) / (b - a), 0, 1) * 100;
  const hyAt = (v, a, b) => hyPc(v, a, b).toFixed(1) + '%';
  const HY_STATE = { good: 'хорошо', warn: 'на грани', bad: 'плохо' };
  // a reading: its name, the value, the state in a word, and the meter under them. o: label, value, state, word,
  // v, max, min, ticks (values marked on the track)
  function hyGauge(o) {
    const min = o.min || 0;
    const ticks = (o.ticks || []).map(v => `<i class="hy-mtick" style="left:${hyAt(v, min, o.max)}"></i>`).join('');
    return `<div class="hy-gauge"><p class="hy-gauge-h"><span>${o.label}</span><b>${o.value}</b><em class="hy-state is-${o.state}">${o.word || HY_STATE[o.state]}</em></p>` +
      `<div class="hy-meter is-${o.state}" role="img" aria-label="${esc(o.label + ': ' + String(o.value).replace(/<[^>]+>/g, ''))}"><span class="hy-mtrack"><i class="hy-mfill" style="width:${hyAt(o.v, min, o.max)}"></i>${ticks}</span></div></div>`;
  }
  // a scale: zones [[from, to, state, name]], ticks under it, a value from → to (either may be left out)
  function hyScale(o) {
    const { min, max } = o, f = o.fmt || fmt;
    const zones = (o.zones || []).map(([a, b, st]) => `<i class="hy-zone is-${st}" style="left:${hyAt(a, min, max)};width:${(hyPc(b, min, max) - hyPc(a, min, max)).toFixed(1)}%"></i>`).join('');
    const names = (o.zones || []).filter(z => z[3]).map(([a, b, , name]) => `<span style="left:${((hyPc(a, min, max) + hyPc(b, min, max)) / 2).toFixed(1)}%">${name}</span>`).join('');
    let marks = '';
    if (o.from != null && o.to != null) {
      const a = hyPc(Math.min(o.from, o.to), min, max), b = hyPc(Math.max(o.from, o.to), min, max);
      marks += `<i class="hy-link" style="left:${a.toFixed(1)}%;width:${(b - a).toFixed(1)}%"></i>`;
    }
    if (o.from != null) marks += `<b class="hy-mark is-from" style="left:${hyAt(o.from, min, max)}"></b>`;
    if (o.to != null) marks += `<b class="hy-mark is-to is-${o.state || 'good'}" style="left:${hyAt(o.to, min, max)}"></b>`;
    const ticks = (o.ticks || []).map(v => `<span style="left:${hyAt(v, min, max)}">${f(v)}</span>`).join('');
    return `<div class="hy-scale" role="img" aria-label="${esc(o.label || '')}"><div class="hy-znames">${names}</div>` +
      `<div class="hy-track"><span class="hy-zones">${zones}</span>${marks}</div><div class="hy-ticks">${ticks}</div></div>`;
  }
  // the state of a value by the zones of its scale
  const hyZone = (Z, v) => (Z.find(([a, b]) => v >= a && v < b) || Z[v < Z[0][0] ? 0 : Z.length - 1])[2];
  // the one number a model leads with
  const hyHero = (value, text) => `<p class="hy-hero"><b>${value}</b><span>${text}</span></p>`;

  /* Six systems cut open, moving: where the water goes and where the roots get their air.
     The scene is drawn in a box of 360 × 200 and scaled to the width; its captions stay at their real size. */
  const HS = {
    kratky: { name: 'Кратки', air: 'Зазор над раствором растёт сам: куст пьёт, уровень падает, верх корней — в воздухе.', pow: 'не нужно', out: 'ничего не заметит', who: 'Один-два куста на окне, без шума и проводов. Самое простое начало.' },
    dwc: { name: 'DWC', air: 'Пузыри перемешивают раствор и всё время подносят к корням воду, насыщенную кислородом у поверхности.', pow: 'компрессор 2–5 Вт круглые сутки', out: 'через несколько часов корням станет душно', who: 'Три-шесть кустов и самый быстрый рост из простых систем.' },
    wick: { name: 'Фитиль', air: 'Раствор поднимается по шнуру в рыхлый субстрат, воздух остаётся в его порах.', pow: 'не нужно', out: 'ничего не заметит', who: 'Маленький куст и тот, кто часто уезжает. Большому кусту фитиль не успевает подавать воду.' },
    ebb: { name: 'Прилив-отлив', air: 'Насос затапливает лоток, вода уходит обратно, и в субстрат втягивается свежий воздух.', pow: 'насос 5–20 Вт по таймеру, по 15 минут несколько раз в день', out: 'субстрат держит воду: несколько часов без беды', who: 'Много горшков на одном лотке, сеянцы и черенки.' },
    nft: { name: 'NFT', air: 'По желобу течёт плёнка раствора в несколько миллиметров, верх корневого мата — в воздухе.', pow: 'насос круглые сутки', out: 'корни сохнут за несколько часов', who: 'Ряды кустов и вертикальные фермы. Нужен уклон 1–3 % и проток 1–2 л в минуту на желоб.' },
    drip: { name: 'Капельная', air: 'Капли поят субстрат, лишнее стекает в бак, поры субстрата остаются с воздухом.', pow: 'насос по таймеру', out: 'субстрат держит воду полдня', who: 'Крупные кусты в теплице и много горшков с одного бака.' }
  };

  register('hsys', el => {
    el.innerHTML = h.head('Шесть систем в разрезе', 'Голубое — раствор, белые кружки — пузыри воздуха, стрелки — куда течёт вода. Выберите систему и посмотрите, откуда корни берут воздух.') +
      h.chipsHtml('lab-hs-sys', 'Система', Object.keys(HS).map(k => [k, HS[k].name]), 'kratky') +
      `<div class="lab-chart hs-chart" id="lab-hs-ch"></div>` +
      h.readHtml([['Воздух корням', 'lab-hs-air', 'is-wide'], ['Электричество', 'lab-hs-pow'], ['Если отключат свет', 'lab-hs-out'], ['Кому подойдёт', 'lab-hs-who', 'is-wide']]);
    const F = ill.F, q = ill.q;
    let sys = 'kratky', K = 1, OX = 0, OY = 0, dyn = null, T = 0;
    const VW = 360, VH = 200;
    // captions: real pixels at a point of the scene
    const lbl = (x, y, text, anchor = 'middle') => `<text class="hs-lbl" data-on-picture x="${q(OX + x * K)}" y="${q(OY + y * K)}" text-anchor="${anchor}">${text}</text>`;
    const plant = (x, y, hgt, seed) => ill.bush({ x, y, h: hgt, nodes: 2, leaf: 0.15, spread: 0.85, seed });
    const roots = (x, y, len, n, seed, sp = 0.6) => props.roots(x, y, len, n, { seed, spread: sp, w: 1.5 });
    const pipe = d => `<path d="${d}" stroke="${F('frame-d')}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const water = (x, y, w, hh) => hh > 0 ? `<rect x="${q(x)}" y="${q(y)}" width="${q(w)}" height="${q(hh)}" fill="${F('water-c')}" opacity=".95"/>` : '';
    const wall = (x, y, w, hh, fill = 'glass') => `<rect x="${q(x)}" y="${q(y)}" width="${q(w)}" height="${q(hh)}" rx="6" fill="${F(fill)}" opacity="${fill === 'glass' ? 0.45 : 1}" stroke="${F(fill === 'glass' ? 'glass-d' : 'box-d')}" stroke-width="1.4"/>`;
    const pump = (x, y) => `<rect x="${x - 10}" y="${y - 12}" width="20" height="12" rx="3" fill="${F('dark')}"/><circle cx="${x}" cy="${y - 6}" r="2.6" fill="${F('frame-d')}"/>`;
    const arrowUp = (x, y, on) => `<path d="M${x} ${y}l-4 6h8z" fill="${F('dark')}" opacity="${on ? 0.85 : 0.15}"/>`;
    const bubbles = (cx, bottom, top, n, t, spread = 14, seed = 1) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const u = ((t * (0.32 + (i % 5) * 0.05) + i / n + seed * 0.13) % 1 + 1) % 1, y = bottom - u * (bottom - top);
        const x = cx + Math.sin(u * 7 + i * 2.3) * spread * (0.3 + u) + ((i * 37) % 11 - 5);
        s += `<circle cx="${q(x)}" cy="${q(y)}" r="${q(1.3 + (i % 3) * 0.5)}" fill="${F('hi')}" fill-opacity=".35" stroke="${F('hi')}" stroke-width=".9"/>`;
      }
      return s;
    };
    // a dashed line that flows along a path: the water's way
    const flow = (d, t, speed = 14, w = 2) => `<path d="${d}" stroke="${F('glass-d')}" stroke-width="${w}" fill="none" stroke-dasharray="5 7" stroke-dashoffset="${q(-t * speed % 12)}" stroke-linecap="round"/>`;
    const drop = (x, y) => `<path d="M${q(x)} ${q(y - 4)}c2 2.6 3.2 4 3.2 5.6a3.2 3.2 0 0 1 -6.4 0c0 -1.6 1.2 -3 3.2 -5.6z" fill="${F('water-c')}" stroke="${F('glass-d')}" stroke-width=".6"/>`;

    const SC = {
      kratky: {
        still() {
          let g = wall(120, 62, 120, 126);
          g += `<path d="M258 84V150" class="ill-arrow"/><path class="ill-arrow-head" d="M258 156l-5 -9h10z"/>`;
          return g;
        },
        move(t) {
          const u = (t % 14) / 14, lv = u < 0.86 ? 0.82 - 0.5 * (u / 0.86) : 0.32 + 0.5 * ((u - 0.86) / 0.14), yl = 184 - 114 * lv;
          let g = water(122, yl, 116, 184 - yl) + roots(180, 76, 106, 9, 5, 0.7);
          // the air roots: root hairs between the cup and the level
          let d = '';
          for (let y = 82; y < yl - 4; y += 5) { const sd = (y / 5) % 2 ? 1 : -1; d += `M${180 + sd * 3} ${q(y)}l${sd * (6 + (y % 3) * 2)} 2`; }
          g += `<path d="${d}" stroke="${F('root')}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
          g += `<rect x="114" y="56" width="132" height="10" rx="3" fill="${F('metal-d')}"/>` + hcup(180, 57, 26, 22, { fill: 'clay' }) + plant(180, 52, 32, 4);
          // the leaves breathe water out
          for (let i = 0; i < 3; i++) { const v = (t * 0.4 + i / 3) % 1; g += `<path d="M${152 + i * 28} ${q(26 - v * 12)}q3 -3 0 -6q-3 -3 0 -6" stroke="${F('glass-d')}" stroke-width="1.3" fill="none" opacity="${q(0.7 * (1 - v))}" stroke-linecap="round"/>`; }
          return { svg: g, labels: lbl(204, Math.min(yl - 8, 110), 'воздух', 'start') + lbl(180, 178, 'раствор') + lbl(270, 92, 'уровень', 'start') + lbl(270, 106, 'падает', 'start') };
        }
      },
      dwc: {
        still() {
          let g = wall(110, 64, 140, 124, 'box') + water(114, 84, 132, 100);
          [140, 180, 220].forEach((x, i) => { g += roots(x, 76, 88, 8, 3 + i, 0.32); });
          g += `<rect x="104" y="58" width="152" height="9" rx="3" fill="${F('box-d')}"/>`;
          [140, 180, 220].forEach((x, i) => { g += hcup(x, 59, 22, 18, { fill: 'clay' }) + plant(x, 55, 30, 6 + i); });
          g += `<rect x="168" y="178" width="24" height="6" rx="3" fill="${F('frame-d')}"/>`;
          g += pipe('M180 180V176Q180 172 184 172H236Q242 172 242 166V50Q242 40 252 40H282');
          g += `<rect x="282" y="30" width="44" height="22" rx="5" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1.4"/><circle cx="294" cy="41" r="3.2" fill="${F('frame-d')}"/><path d="M302 36h16M302 41h16M302 46h16" stroke="${F('frame-d')}" stroke-width="1"/>`;
          g += `<path d="M276 58H336" stroke="${F('wood-d')}" stroke-width="3" stroke-linecap="round"/>`;
          return g;
        },
        move(t) {
          let g = bubbles(180, 176, 88, 30, t, 16, 1);
          g += flow('M128 92Q120 140 132 176', t, 10, 1.6) + flow('M232 92Q240 140 228 176', t, 10, 1.6);
          return { svg: g, labels: lbl(304, 74, 'компрессор') + lbl(180, 196, 'распылитель') };
        }
      },
      wick: {
        still() {
          let g = wall(110, 140, 140, 48, 'box') + water(114, 152, 132, 32);
          g += `<path d="M126 74H234L224 136H136Z" fill="${F('plastic-hi')}"/>`;
          g += `<path d="M130 78H230L221 133H139Z" fill="${F('soil')}"/>`;
          for (let i = 0; i < 22; i++) g += `<circle cx="${q(138 + (i * 41) % 84)}" cy="${q(84 + (i * 17) % 46)}" r="1.3" fill="${F('perlite')}"/>`;
          g += roots(180, 82, 40, 7, 9, 0.9) + plant(180, 76, 40, 3);
          g += `<path d="M170 134C166 152 160 170 156 182M190 134C194 152 200 170 204 182" stroke="${F('kraft-d')}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
          return g;
        },
        move(t) {
          let g = '';
          [[170, 134, 156, 182], [190, 134, 204, 182]].forEach(([x0, y0, x1, y1], k) => {
            for (let i = 0; i < 4; i++) { const u = (t * 0.25 + i / 4 + k * 0.12) % 1, y = y1 - (y1 - y0) * u, x = x1 + (x0 - x1) * u; g += `<circle cx="${q(x)}" cy="${q(y)}" r="2" fill="${F('water-c')}" stroke="${F('glass-d')}" stroke-width=".7"/>`; }
          });
          return { svg: g, labels: lbl(118, 166, 'запас', 'end') + lbl(220, 160, 'фитиль', 'start') };
        }
      },
      ebb: {
        still() {
          let g = wall(110, 150, 140, 38, 'box');
          g += `<path d="M90 104H270V126H90Z" fill="${F('plastic')}"/><path d="M96 126V150M264 126V150" stroke="${F('plastic')}" stroke-width="4"/>`;
          g += pipe('M130 172V116') + pipe('M236 118V160');
          return g;
        },
        move(t) {
          const u = (t % 12) / 12, st = u < 0.25 ? 'fill' : u < 0.42 ? 'hold' : u < 0.67 ? 'drain' : 'dry';
          const lv = st === 'fill' ? u / 0.25 : st === 'hold' ? 1 : st === 'drain' ? 1 - (u - 0.42) / 0.25 : 0;
          let g = water(94, 124 - lv * 16, 172, lv * 16) + water(114, 158 + lv * 14, 132, 26 - lv * 14);
          [150, 196, 242].forEach((x, i) => { g += `<path d="M${x - 14} 92H${x + 14}L${x + 10} 124H${x - 10}Z" fill="${F('pot')}" opacity=".95"/>` + roots(x, 104, 16, 5, 4 + i, 0.8) + plant(x, 92, 30, 5 + i); });
          g += pump(130, 184) + arrowUp(130, 130, st === 'fill') + `<path d="M236 152l-4 -6h8z" fill="${F('dark')}" opacity="${st === 'drain' ? 0.85 : 0.15}"/>`;
          g += `<g transform="translate(300 60)"><circle r="12" fill="${F('frame')}" stroke="${F('frame-d')}" stroke-width="1.4"/><path d="M0 -7V0L${q(Math.cos(u * Math.PI * 2 - Math.PI / 2) * 7)} ${q(Math.sin(u * Math.PI * 2 - Math.PI / 2) * 7)}" stroke="${F('dark')}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
          const word = { fill: 'прилив', hold: 'затоплено', drain: 'отлив', dry: 'корни дышат' }[st];
          return { svg: g, labels: lbl(300, 90, 'таймер') + lbl(180, 144, word) };
        }
      },
      nft: {
        still() {
          let g = wall(130, 150, 120, 38, 'box') + water(134, 160, 112, 24);
          g += `<path d="M58 88L300 104L300 118L58 102Z" fill="${F('plastic')}"/>`;
          g += pump(160, 184) + pipe('M160 172V128Q160 120 152 120H64Q56 120 56 112V96') + pipe('M298 112Q306 112 306 122V136Q306 144 298 144H246');
          return g;
        },
        move(t) {
          let g = `<path d="M60 99.5L298 115.3L298 117L60 101.2Z" fill="${F('water-c')}"/>`;
          [110, 180, 250].forEach((x, i) => {
            const y = 88 + (x - 58) / 242 * 16;
            g += `<path d="M${x - 9} ${q(y - 1)}C${x + 6} ${q(y + 11)} ${x + 26} ${q(y + 12)} ${x + 40} ${q(y + 14)}" stroke="${F('root')}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
            g += hcup(x, y - 3, 20, 12) + plant(x, y - 7, 28, 2 + i);
          });
          g += flow('M62 100.5L296 116', t, 18, 1.6);
          for (let i = 0; i < 2; i++) { const v = (t * 0.9 + i / 2) % 1; g += drop(246, 146 + v * 10); }
          return { svg: g, labels: lbl(290, 136, 'уклон 1–3 %', 'end') + lbl(120, 136, 'плёнка раствора') };
        }
      },
      drip: {
        still() {
          let g = wall(250, 136, 90, 52, 'box') + water(254, 150, 82, 34);
          g += `<path d="M70 150H226V160H70Z" fill="${F('plastic')}"/>`;
          [110, 186].forEach((x, i) => {
            g += `<path d="M${x - 26} 98H${x + 26}L${x + 20} 150H${x - 20}Z" fill="${F('pot')}"/><path d="M${x - 23} 102H${x + 23}L${x + 18} 146H${x - 18}Z" fill="${F('kraft')}"/>`;
            g += roots(x, 106, 34, 7, 3 + i, 0.9) + plant(x, 100, 44, 7 + i);
          });
          g += pump(270, 184) + pipe('M270 172V52Q270 44 262 44H94Q86 44 86 52V60') + pipe('M162 52V60');
          g += pipe('M226 156H246');
          return g;
        },
        move(t) {
          let g = '';
          [[86, 0], [162, 0.5]].forEach(([x, ph]) => {
            g += `<rect x="${x - 3}" y="58" width="6" height="8" rx="2" fill="${F('grip')}"/>`;
            const v = (t * 0.7 + ph) % 1; if (v < 0.75) g += drop(x, 70 + v / 0.75 * 26);
          });
          g += flow('M226 156H246', t, 10, 1.4);
          return { svg: g, labels: lbl(60, 34, 'капельницы', 'start') + lbl(208, 176, 'сток в бак') };
        }
      }
    };

    const show = k => {
      sys = k;
      set(el, 'lab-hs-air', HS[k].air);
      set(el, 'lab-hs-pow', HS[k].pow);
      set(el, 'lab-hs-out', HS[k].out);
      set(el, 'lab-hs-who', HS[k].who);
      ch.redraw();
    };
    const paint = () => {
      if (!dyn) return;
      const m = SC[sys].move(T);
      dyn.innerHTML = `<g transform="translate(${q(OX)} ${q(OY)}) scale(${q(K)})">${m.svg}</g>${m.labels}`;
    };
    const ch = h.chart($('#lab-hs-ch', el), {
      label: 'Разрез гидропонной системы: ёмкость, раствор, корни и движение воды',
      h: w => Math.round(clamp(w * 0.56, 220, 330)),
      draw(w, hh) {
        K = Math.min(w / VW, (hh - 4) / VH);
        OX = (w - VW * K) / 2; OY = (hh - VH * K) / 2;
        const fy = q(OY + 188 * K);
        return `<rect data-bg width="${w}" height="${hh}" rx="14" fill="${F('bg')}"/><path data-bg d="M0 ${fy}H${w}V${hh - 14}Q${w} ${hh} ${w - 14} ${hh}H14Q0 ${hh} 0 ${hh - 14}Z" fill="${F('bg-2')}"/>` +
          `<g transform="translate(${q(OX)} ${q(OY)}) scale(${q(K)})">${SC[sys].still()}</g><g class="hs-dyn"></g>`;
      }
    });
    const grab = () => { dyn = $('.hs-dyn', ch.svg); paint(); };
    // the chart draws itself anew when it changes width: the moving layer is found again
    new MutationObserver(grab).observe(ch.svg, { childList: true });
    const loop = S.loop(ts => { T = ts / 1000; paint(); loop.next(); });
    h.bindPick(el, 'lab-hs-sys', show);
    show('kratky');
    if (h.reduce.matches) { T = 5; grab(); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) loop.start(); else loop.stop(); }).observe(el);
    else loop.start();
  });

  /* The oxygen of a tank once the air pump stops: dC/dt = k·(Cs − C) − D. Cs — saturation at the temperature
     (doAt, o2.js); k — how fast air gets in (pump on: a few per hour, still water: a few hundredths); D — the use
     by the roots (grows with the bushes, Q10 = 2) and by the microbes in the water. Shown as the tank itself:
     the blue dots are the oxygen, fewer as the hours go; beside it the hours it lasts and where it stands now. */
  const O2B = {
    bucket: { name: 'ведро, 4 куста', v: 15, n: 4, on: 4, off: 0.04 },
    jar: { name: 'банка, 1 куст', v: 3, n: 1, on: 6, off: 0.06 }
  };
  const O2B_AGE = { small: { name: 'сеянцы', w: 3 }, mid: { name: 'растут', w: 6 }, big: { name: 'большие кусты', w: 10 } };
  register('o2box', el => {
    el.innerHTML = h.head('Если выключить компрессор', 'Синие точки — кислород в растворе. Компрессор выключили: двигайте время или прокрутите сутки и смотрите, как его становится меньше. Расход корнями — условный, растёт с размером кустов и с теплом.', true) +
      `<div class="lab-controls">
        ${h.segHtml('lab-o2b-box', 'Ёмкость', Object.keys(O2B).map(k => [k, O2B[k].name]), 'bucket')}
        ${pickHtml('lab-o2b-age', 'Кусты', Object.keys(O2B_AGE).map(k => [k, O2B_AGE[k].name]), 'mid')}
        ${h.rangeHtml('lab-o2b-t', 'Температура раствора', 16, 30, 0.5, 22)}
        ${h.rangeHtml('lab-o2b-h', 'Без компрессора', 0, 24, 0.5, 0)}
        <div class="lab-actions"><button class="btn btn-ghost btn-small" type="button" id="lab-o2b-play">▶ Прокрутить сутки</button></div>
      </div>
      <div class="hy-split">
        <div class="hy-pic" id="lab-o2b-pic"></div>
        <div class="hy-read" aria-live="polite"><div id="lab-o2b-hero"></div><div id="lab-o2b-now"></div><p class="hy-verdict" id="lab-o2b-v"></p></div>
      </div>`;
    const F = ill.F, q = ill.q;
    let box = 'bucket', age = 'mid', T = 22, H = 0;
    const use = () => {
      const b = O2B[box], q10 = Math.pow(2, (T - 20) / 10), w = O2B_AGE[age].w;
      // a bush's roots use about 0.03·weeks² mg of O₂ an hour at 20 °C; microbes 0.02 mg per litre an hour
      return (b.n * 0.03 * w * w * q10 + 0.02 * b.v * q10) / b.v;
    };
    const state = () => {
      const b = O2B[box], Cs = doAt(T), D = use(), Con = Math.max(0, Cs - D / b.on), Cinf = Cs - D / b.off;
      const at = t => Math.max(0, Cinf + (Con - Cinf) * Math.exp(-b.off * t));
      const t4 = Cinf >= 4 ? null : Con <= 4 ? 0 : -Math.log((4 - Cinf) / (Con - Cinf)) / b.off;
      return { Cs, Con, at, t4 };
    };
    // the tank cut open: the cups and roots, the pump outside (grey once it is off), the oxygen as dots
    const pic = (c, phase) => {
      const W = 300, Hh = 190, x0 = 46, x1 = 214, top = 52, bot = 172, rnd = ill.rng(9), cups = box === 'jar' ? [130] : [76, 112, 148, 184];
      let g = Rh.paper(W, Hh) + Rh.ground(bot, W, Hh);
      g += `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${bot - top}" rx="8" fill="${F('box')}"/>`;
      g += `<rect x="${x0 + 6}" y="${top + 14}" width="${x1 - x0 - 12}" height="${bot - top - 20}" rx="4" fill="${F('water-c')}"/>`;
      cups.forEach((x, i) => { g += Rh.roots(x, top + 10, 70 + (O2B_AGE[age].w - 3) * 6, 7, { seed: 3 + i, spread: 0.35, w: 1.5 }); });
      // the oxygen: as many dots as milligrams in a litre, five to a milligram
      const n = Math.round(c * 5);
      for (let i = 0; i < 60; i++) {
        const x = x0 + 12 + rnd() * (x1 - x0 - 24), y = top + 20 + rnd() * (bot - top - 32), s = rnd();
        if (i >= n) continue;
        g += `<circle cx="${q(x + Math.sin(phase + i) * 2)}" cy="${q(y + Math.cos(phase * 0.7 + i) * 2)}" r="${q(2.2 + s)}" fill="${F('sky')}" stroke="${F('glass-d')}" stroke-width=".8"/>`;
      }
      g += `<rect x="${x0 - 4}" y="${top - 6}" width="${x1 - x0 + 8}" height="10" rx="3" fill="${F('box-d')}"/>`;
      cups.forEach((x, i) => { g += hcup(x, top - 5, 18, 14, { fill: 'clay' }) + ill.bush({ x, y: top - 8, h: 18 + O2B_AGE[age].w * 2.2, nodes: 2, leaf: 0.11 + O2B_AGE[age].w * 0.008, spread: 0.7, seed: 4 + i }); });
      // the pump: on a shelf, its hose down to the stone on the bottom
      const on = H === 0;
      g += `<path d="M232 70H286" stroke="${F('wood-d')}" stroke-width="3" stroke-linecap="round"/>`;
      g += `<rect x="238" y="50" width="42" height="20" rx="5" fill="${F(on ? 'frame' : 'radiator')}" stroke="${F('frame-d')}" stroke-width="1.2"/><circle cx="249" cy="60" r="3.2" fill="${F(on ? 'grip' : 'frame-d')}"/>`;
      g += `<path d="M238 62Q226 62 222 70V162Q222 168 214 168H140" stroke="${F('frame-d')}" stroke-width="2" fill="none"/><rect x="118" y="164" width="24" height="6" rx="3" fill="${F('frame-d')}"/>`;
      if (on) for (let i = 0; i < 16; i++) { const u = ((phase * 0.08 + i / 16) % 1 + 1) % 1; g += `<circle cx="${q(130 + Math.sin(u * 7 + i) * 7)}" cy="${q(162 - u * 96)}" r="${q(1.2 + (i % 3) * 0.5)}" fill="none" stroke="${F('hi')}" stroke-width="1"/>`; }
      g += `<text class="hs-lbl" data-on-picture x="259" y="88" text-anchor="middle">${on ? 'работает' : 'выключен'}</text>`;
      return ill.svg(W, Hh, g, `Ведро в разрезе: ${on ? 'компрессор работает' : `компрессор выключен ${fmt(H)} ч`}, кислорода ${fmt(c)} мг на литр`);
    };
    let phase = 0;
    const paint = () => {
      const st = state(), c = st.at(H);
      $('#lab-o2b-pic', el).innerHTML = pic(c, phase);
      return { st, c };
    };
    const upd = () => {
      const { st, c } = paint();
      set(el, 'lab-o2b-hero', hyHero(st.t4 == null || st.t4 > 24 ? 'больше суток' : st.t4 <= 0 ? 'нет запаса' : h.nb(`≈ ${fmt0(Math.max(1, Math.round(st.t4)))} ч`), 'столько корни продержатся без пузырей, пока кислорода не станет совсем мало'));
      const s = c >= 6 ? 'good' : c >= 4 ? 'warn' : 'bad';
      set(el, 'lab-o2b-now', hyGauge({ label: H ? `Через ${h.nb(fv(H) + ' ч')}` : 'Сейчас', value: h.nb(`${fmt(c)} мг/л`), state: s, word: { good: 'корням хорошо', warn: 'на грани', bad: 'корням душно' }[s], v: c, max: 12, ticks: [4, 6] }));
      set(el, 'lab-o2b-v', h.nb(st.t4 == null || st.t4 > 24 ? 'Кусты маленькие или вода прохладная: сутки без компрессора они переживут.'
        : st.t4 > 8 ? 'Ночь без электричества не страшна. Если отключение дольше — опустите уровень раствора, чтобы верх корней оказался в воздухе.'
          : 'Запаса — на вечер. Большие кусты в тёплой воде без пузырей задыхаются быстро: при отключении опустите уровень, чтобы верх корней оказался в воздухе, и уберите ёмкость с тепла.'));
    };
    h.bindPick(el, 'lab-o2b-box', v => { box = v; upd(); });
    h.bindPick(el, 'lab-o2b-age', v => { age = v; upd(); });
    h.bindRange(el, 'lab-o2b-t', v => h.nb(`${fv(v)} °C`), v => { T = v; upd(); });
    const hr = h.bindRange(el, 'lab-o2b-h', v => v ? h.nb(`${fv(v)} ч`) : 'компрессор работает', v => { H = v; upd(); });
    // the play button runs the day by: an hour in about a third of a second
    let t0 = 0;
    const play = S.loop(ts => {
      if (!t0) t0 = ts - H * 330;
      const v = Math.min(24, (ts - t0) / 330);
      phase = ts / 1000;
      hr.set(Math.round(v * 2) / 2);
      if (v >= 24) { play.stop(); t0 = 0; return; }
      play.next();
    });
    $('#lab-o2b-play', el).addEventListener('click', () => {
      if (play.on) { play.stop(); t0 = 0; return; }
      if (H >= 24) hr.set(0);
      if (h.reduce.matches) { hr.set(24); return; }
      t0 = 0; play.start();
    });
    upd();
  });

  /* Balanced growth (Brouwer): the plant shares its sugars between leaves and roots so that the roots bring in as
     much as the leaves can use. Light sets what a gram of leaf makes (sL), the root zone what a gram of root
     brings (sN); the share of leaves f = sN / (sL + sN). Growth is exponential while the leaves do not shade one
     another and linear after that (expolinear, from 40 g). All numbers are illustrative: the model is drawn as the
     two bushes themselves, their tops and roots in proportion to what each grew. */
  const AL_ROOT = { good: { name: 'хороший уход', n: 0.55 }, dry: { name: 'пересыхает', n: 0.3 } };
  const AL_LIGHT = { winter: { name: 'зимнее окно', dli: 5 }, window: { name: 'светлое окно', dli: 10 }, lamp: { name: 'лампа', dli: 15 }, sun: { name: 'солнечный балкон', dli: 25 } };
  const AL_HYDRO = 1.2;
  register('alloc', el => {
    el.innerHTML = h.head('Корни, листья и свет', 'Два одинаковых сеянца через 8 недель: в горшке и в растворе. Модель условная — она делит рост между корнями и листьями по правилу Брауэра и рисует, что получилось.', true) +
      `<div class="lab-controls">
        ${pickHtml('lab-al-l', 'Свет', Object.keys(AL_LIGHT).map(k => [k, AL_LIGHT[k].name]), 'lamp')}
        ${h.segHtml('lab-al-pot', 'Горшок', Object.keys(AL_ROOT).map(k => [k, AL_ROOT[k].name]), 'good')}
      </div>
      <div class="hy-split">
        <div class="hy-pic" id="lab-al-pic"></div>
        <div class="hy-read" aria-live="polite"><div id="lab-al-hero"></div><div class="al-split" id="lab-al-split"></div><p class="hy-verdict" id="lab-al-v"></p></div>
      </div>`;
    const F = ill.F, q = ill.q;
    let light = 'lamp', pot = 'good';
    const sL = d => 0.3 * d / (d + 12);
    const grow = (sN, dli) => {
      const L = sL(dli), f = sN / (L + sN), rgr = Math.max(0.005, L * f - 0.02), Mc = 40;
      let m = 0.5;
      for (let day = 0; day < 56; day++) m += m < Mc ? rgr * m : rgr * Mc;
      return { f, m, shoot: m * f, root: m * (1 - f) };
    };
    // the biggest each part can be here (in a solution under the sun): the drawing's scale
    const TOP = grow(AL_HYDRO, 30), ROOT = grow(AL_ROOT.dry.n, 30);
    const pic = (P, Hy) => {
      const W = 320, Hh = 210, gy = 110;
      let g = Rh.paper(W, Hh);
      // under the ground line: soil on the left, the solution on the right, cut open
      g += `<path data-bg d="M8 ${gy}H156V196Q156 202 150 202H14Q8 202 8 196Z" fill="${F('soil')}" opacity=".9"/>`;
      g += `<path data-bg d="M164 ${gy}H312V196Q312 202 306 202H170Q164 202 164 196Z" fill="${F('water-c')}"/>`;
      for (let i = 0; i < 26; i++) g += `<circle cx="${q(16 + (i * 53) % 132)}" cy="${q(gy + 10 + (i * 29) % 82)}" r="1.4" fill="${F('soil-d')}" opacity=".8"/>`;
      [[82, P], [238, Hy]].forEach(([x, r], k) => {
        const rl = 14 + 70 * Math.sqrt(r.root / ROOT.root), rn = 5 + Math.round(6 * Math.sqrt(r.root / ROOT.root));
        g += Rh.roots(x, gy + 2, rl, rn, { seed: 5 + k, spread: k ? 0.5 : 0.9, w: 1.6 });
        g += `<rect x="${x - 13}" y="${gy - 4}" width="26" height="8" rx="3" fill="${F(k ? 'plastic' : 'pot')}"/>`;
        // the same bush on both sides, only its size differs
        const hh = 16 + 74 * Math.pow(r.shoot / TOP.shoot, 0.75);
        g += hh < 34 ? Rh.sprout(x, gy - 4, hh, { pairs: 2, s: 1.1 }) : ill.bush({ x, y: gy - 4, h: hh, nodes: 3, leaf: 0.1 + 0.14 * hh / 90, spread: 0.85, seed: 6 });
      });
      g += `<text class="hs-lbl" data-on-picture x="82" y="198" text-anchor="middle">горшок</text><text class="hs-lbl" data-on-picture x="238" y="198" text-anchor="middle">раствор</text>`;
      return ill.svg(W, Hh, g, `Куст в горшке и в растворе через 8 недель: листья и корни в пропорции`);
    };
    const upd = () => {
      const d = AL_LIGHT[light].dli, Hy = grow(AL_HYDRO, d), P = grow(AL_ROOT[pot].n, d), k = Hy.shoot / P.shoot;
      $('#lab-al-pic', el).innerHTML = pic(P, Hy);
      set(el, 'lab-al-hero', hyHero(k < 1.15 ? 'почти поровну' : h.nb(`в ${fmt(k)} раза`), k < 1.15 ? 'зелени в растворе и в горшке: свет — узкое место' : 'больше зелени в растворе, чем в горшке'));
      $('#lab-al-split', el).innerHTML = [['Раствор', Hy.f], ['Горшок', P.f]].map(([n, f]) =>
        `<div class="al-row"><span class="al-name">${n}</span><span class="al-bar" role="img" aria-label="${n}: листьям ${fmt0(f * 100)} %, корням ${fmt0((1 - f) * 100)} % прироста"><i class="al-leaf" style="--w:${fmt0(f * 100)}%"></i><i class="al-root" style="--w:${fmt0((1 - f) * 100)}%"></i></span><span class="al-val">корням ${fmt0((1 - f) * 100)}&nbsp;%</span></div>`).join('') +
        `<ul class="hy-key"><li><i class="al-key-leaf"></i>листьям и стеблям</li><li><i class="al-key-root"></i>корням</li></ul>`;
      set(el, 'lab-al-v', h.nb(k < 1.15
        ? 'Света мало: куст растёт медленно и там, и там. Раствор почти ничего не прибавляет — сначала нужна лампа.'
        : pot === 'dry'
          ? 'В пересыхающем горшке корень забирает себе большую долю роста. В растворе её получают листья — и каждый новый лист сам делает сахара для следующих.'
          : 'Света хватает, а раствор позволяет держать меньше корней: больше сахаров уходит в листья, и прирост растёт как сложные проценты.'));
    };
    h.bindPick(el, 'lab-al-l', v => { light = v; upd(); });
    h.bindPick(el, 'lab-al-pot', v => { pot = v; upd(); });
    upd();
  });

  /* A Kratky jar week by week: the bush drinks more as its leaves grow (about 0.012·e^(0.38·week) litres a day
     under a lamp, less on a window, more in the sun), the level falls and the air gap under the lid grows.
     Illustrative: a real bush drinks more in heat and dry air. Shown as the jar itself, how much is left in it
     and how long it lasts. */
  const KR_LIGHT = { window: { name: 'окно', k: 0.6 }, lamp: { name: 'лампа', k: 1 }, sun: { name: 'солнечный балкон', k: 1.5 } };
  register('kratky', el => {
    el.innerHTML = h.head('Хватит ли банки', 'Куст растёт и пьёт всё больше, уровень падает, воздушный зазор растёт. Модель условная; в жару и сухой воздух куст пьёт быстрее.', true) +
      `<div class="lab-controls kr-controls">
        ${h.rangeHtml('lab-kr-v', 'Банка', 1, 5, 0.5, 2)}
        ${h.segHtml('lab-kr-l', 'Свет', Object.keys(KR_LIGHT).map(k => [k, KR_LIGHT[k].name]), 'lamp')}
        ${h.rangeHtml('lab-kr-w', 'Неделя', 0, 8, 0.25, 3)}
        <div class="lab-actions"><button class="btn btn-ghost btn-small" type="button" id="lab-kr-play">▶ Прокрутить 8 недель</button></div>
      </div>
      <div class="hy-split kr-split">
        <div class="hy-pic kr-stage" id="lab-kr-jar"></div>
        <div class="hy-read" aria-live="polite"><div id="lab-kr-hero"></div><div id="lab-kr-now"></div><p class="hy-verdict" id="lab-kr-tip"></p></div>
      </div>`;
    let V = 2, light = 'lamp', W = 3;
    // litres drunk from week 0 to week w
    const drunk = w => 0.012 * KR_LIGHT[light].k * 7 / 0.38 * (Math.exp(0.38 * w) - 1);
    const fill = () => V * 0.85;
    const left = w => Math.max(0, fill() - drunk(w));
    const endWeek = () => { const f = fill(); for (let w = 0; w <= 12; w += 0.05) if (drunk(w) >= f * 0.85) return w; return null; };
    const jarSvg = () => {
      const hj = 70 + V * 12, y = 176, lv = left(W) / V, rootLen = Math.min(hj - 18, 8 + W * 14);
      const j = hjar(70, y, 62, hj, { level: lv, fill: W < 0.5 ? 'cube' : 'clay', roots: W < 0.3 ? 0 : rootLen, air: true, seed: 6 });
      const plant = W < 1.5 ? Rh.sprout(70, j.top - 4, 18 + W * 10, { pairs: 1 + Math.round(W), s: 1.2 }) : ill.bush({ x: 70, y: j.top - 4, h: Math.min(78, 22 + W * 8), nodes: W < 4 ? 2 : 3, leaf: Math.min(0.26, 0.14 + W * 0.016), spread: 0.85, seed: 6 });
      return ill.svg(140, 190, Rh.paper(140, 190) + Rh.ground(y, 140, 190) + j.svg + plant, `Банка ${fv(V)} л на неделе ${fmt0(W)}: раствора ${fmt(left(W))} л`);
    };
    const upd = () => {
      $('#lab-kr-jar', el).innerHTML = jarSvg();
      const e = endWeek(), share = left(W) / fill();
      set(el, 'lab-kr-hero', hyHero(e == null || e > 8 ? 'на весь срок' : h.nb(`≈ ${fmt0(e)} ${h.plural(Math.round(e), 'неделю', 'недели', 'недель')}`), 'хватит этой банки при таком свете, без долива'));
      const s = share > 0.4 ? 'good' : share > 0.15 ? 'warn' : 'bad';
      set(el, 'lab-kr-now', hyGauge({ label: `Неделя ${W % 1 ? fmt(W, 2) : fmt0(W)}`, value: `осталось ${fmt0(share * 100)} %`, state: s, word: { good: 'хватает', warn: 'скоро кончится', bad: 'почти пусто' }[s], v: share, max: 1 }));
      set(el, 'lab-kr-tip', h.nb(e != null && e < 5
        ? `Банки не хватит до первого большого среза. Возьмите банку побольше — или, когда раствор опустится до трети, долейте раствор половинной крепости, только до половины банки.`
        : e != null && e < 8
          ? 'К концу срока банка опустеет. Тогда смените раствор целиком или переселите куст в ведро.'
          : 'Банки хватит на весь срок: просто смотрите, чтобы корни внизу оставались в растворе.'));
    };
    h.bindRange(el, 'lab-kr-v', v => h.nb(`${fv(v)} л`), v => { V = v; upd(); });
    h.bindPick(el, 'lab-kr-l', v => { light = v; upd(); });
    const wk = h.bindRange(el, 'lab-kr-w', v => v % 1 ? fmt(v, 2) : fmt0(v), v => { W = v; upd(); });
    // the play button runs the weeks by, a week in about three quarters of a second
    let t0 = 0;
    const play = S.loop(ts => {
      if (!t0) t0 = ts - W * 750;
      const w = Math.min(8, (ts - t0) / 750);
      wk.set(Math.round(w * 4) / 4);
      if (w >= 8) { play.stop(); t0 = 0; return; }
      play.next();
    });
    $('#lab-kr-play', el).addEventListener('click', () => {
      if (play.on) { play.stop(); t0 = 0; return; }
      if (W >= 8) wk.set(0);
      if (h.reduce.matches) { wk.set(8); return; }
      t0 = 0; play.start();
    });
    upd();
  });

  /* Capillary rise in a net cup: h = 2σ·cos θ / (ρ·g·r) for water (σ = 0.072 N/m, θ ≈ 0). The pore radius of each
     substrate is a typical one, so the heights are an estimate: they show the order, not a measurement. */
  const CAP = {
    clay: { name: 'керамзит', r: 1.5, note: 'щели между шариками в 1–2 мм' },
    perlite: { name: 'перлит', r: 0.4, note: 'зёрна 2–4 мм с порами' },
    coco: { name: 'кокос', r: 0.1, note: 'волокна и крошка' },
    wool: { name: 'минвата', r: 0.08, note: 'волокна в десятые доли миллиметра' },
    mix: { name: 'кубик + керамзит', r: 0.08, note: 'кубик минваты в середине, керамзит вокруг' }
  };
  register('capil', el => {
    el.innerHTML = h.head('Докуда поднимется вода', 'Стаканчик высотой 6 см стоит над раствором. Голубым — где субстрат мокрый. Радиус пор — типичный для каждого субстрата, высота подъёма — по закону Жюрена.', true) +
      `<div class="lab-controls">
        ${h.chipsHtml('lab-cap-s', 'Субстрат', Object.keys(CAP).map(k => [k, CAP[k].name]), 'mix')}
        ${h.rangeHtml('lab-cap-g', 'Дно стаканчика над раствором', 0, 4, 0.5, 1)}
      </div>
      <div class="lab-stage cap-stage" id="lab-cap-pic"></div>` +
      h.readHtml([['Подъём воды', 'lab-cap-h'], ['Мокро в стаканчике', 'lab-cap-w'], ['Что это значит', 'lab-cap-v', 'is-wide']]);
    const F = ill.F, q = ill.q;
    let sub = 'mix', gap = 1;
    const rise = r => 2 * 0.072 / (1000 * 9.81 * r / 1000) * 100; // cm
    const CM = 18, X0 = 100, X1 = 200, BOT = 150, CUP = 6;
    const draw = () => {
      const s = CAP[sub], wl = BOT + gap * CM, hr = rise(s.r), wetTop = Math.max(BOT - CUP * CM, wl - hr * CM);
      const rnd = ill.rng(7);
      const yTop = BOT - CUP * CM;
      let g = `<rect data-bg width="300" height="236" rx="14" fill="${F('bg')}"/>`;
      // the solution below, to the right of the ruler: its numbers stand on the paper
      g += `<rect x="78" y="${q(wl)}" width="182" height="${q(232 - wl)}" fill="${F('water-c')}" opacity=".9"/><path d="M78 ${q(wl)}H260" stroke="${F('glass-d')}" stroke-width="1.2"/>`;
      // the cup's walls (a section): the net
      const inner = `M${X0} ${yTop}L${X0 + 8} ${BOT}H${X1 - 8}L${X1} ${yTop}Z`;
      g += `<clipPath id="cap-clip"><path d="${inner}"/></clipPath><g clip-path="url(#cap-clip)">`;
      g += `<rect x="${X0}" y="${yTop}" width="${X1 - X0}" height="${CUP * CM}" fill="${F('bg-2')}"/>`;
      const balls = (x0, x1, r0) => {
        let b = '';
        for (let y = BOT - r0; y > yTop - r0; y -= r0 * 1.7) for (let x = x0 + r0 + ((y / r0) % 2 ? r0 * 0.8 : 0); x < x1; x += r0 * 2.05) {
          const r = r0 * (0.82 + rnd() * 0.3);
          b += `<circle cx="${q(x)}" cy="${q(y)}" r="${q(r)}" fill="${F('pot')}" stroke="${F('pot-d')}" stroke-width="1"/><circle cx="${q(x - r * 0.35)}" cy="${q(y - r * 0.35)}" r="${q(r * 0.25)}" fill="${F('pot-hi')}" opacity=".7"/>`;
        }
        return b;
      };
      const fibers = (x0, x1, col, n, len) => {
        let d = '';
        for (let i = 0; i < n; i++) { const x = x0 + rnd() * (x1 - x0), y = yTop + rnd() * CUP * CM, a = rnd() * Math.PI; d += `M${q(x)} ${q(y)}l${q(Math.cos(a) * len)} ${q(Math.sin(a) * len)}`; }
        return `<path d="${d}" stroke="${F(col)}" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`;
      };
      if (sub === 'clay') g += balls(X0, X1, 12);
      else if (sub === 'perlite') { for (let i = 0; i < 90; i++) g += `<circle cx="${q(X0 + 4 + rnd() * (X1 - X0 - 8))}" cy="${q(yTop + 3 + rnd() * (CUP * CM - 6))}" r="${q(2.5 + rnd() * 2)}" fill="${F('perlite')}" stroke="${F('frame-d')}" stroke-width=".6"/>`; }
      else if (sub === 'coco') g += fibers(X0, X1, 'kraft-d', 260, 7);
      else if (sub === 'wool') g += fibers(X0, X1, 'straw', 320, 10);
      else { g += balls(X0, 132, 12) + balls(168, X1, 12) + `<rect x="132" y="${yTop + 6}" width="36" height="${CUP * CM - 6}" fill="${F('straw')}" opacity=".55"/>` + fibers(132, 168, 'kraft-d', 90, 7); }
      // what is wet: from the water up to the height the pores lift it (the cube only, in the mix)
      const wet = (x0, x1) => wetTop < BOT ? `<rect x="${x0}" y="${q(wetTop)}" width="${x1 - x0}" height="${q(BOT - wetTop)}" fill="${F('water-c')}" opacity=".5"/>` : '';
      if (sub === 'mix') {
        const clayTop = Math.max(yTop, wl - rise(CAP.clay.r) * CM);
        g += clayTop < BOT ? `<rect x="${X0}" y="${q(clayTop)}" width="${X1 - X0}" height="${q(BOT - clayTop)}" fill="${F('water-c')}" opacity=".5"/>` : '';
        g += wet(132, 168);
      } else g += wet(X0, X1);
      g += '</g>';
      g += `<path d="${inner}" fill="none" stroke="${F('plastic')}" stroke-width="3"/>`;
      g += [0.33, 0.66].map(k => `<path d="M${q(X0 + 8 * k)} ${q(yTop + CUP * CM * k)}H${q(X1 - 8 * k)}" stroke="${F('plastic')}" stroke-width="1.2" opacity=".6"/>`).join('');
      // a ruler on the left: centimetres above the solution
      let r = `<g class="ill-scale"><path d="M70 ${q(wl)}V${yTop}" fill="none" stroke="currentColor"/>`;
      for (let c = 0; c <= 10; c++) { const y = wl - c * CM; if (y < yTop - 2) break; r += `<path d="M66 ${q(y)}H74" stroke="currentColor"/>`; if (c % 2 === 0) r += `<text x="62" y="${q(y + 4)}" text-anchor="end">${c}</text>`; }
      g += r + '</g>';
      g += `<text class="hs-lbl" data-on-picture x="250" y="${q(Math.min(224, wl + 18))}" text-anchor="end">раствор</text>`;
      g += `<text class="hs-lbl" data-on-picture x="62" y="${yTop - 8}" text-anchor="end">см</text>`;
      if (wetTop > yTop + 6) g += `<text class="hs-lbl" data-on-picture x="210" y="${q(yTop + 14)}" text-anchor="start">сухо</text>`;
      return `<svg class="cap-svg" viewBox="0 0 300 236" role="img" aria-label="Стаканчик с субстратом над раствором: где он мокрый">${g}</svg>`;
    };
    const upd = () => {
      const s = CAP[sub], hr = rise(s.r), wetCm = clamp(hr - gap, 0, CUP);
      $('#lab-cap-pic', el).innerHTML = draw();
      set(el, 'lab-cap-h', h.nb(hr >= 10 ? `≈ ${fmt0(hr)} см` : `≈ ${fmt(hr)} см`));
      set(el, 'lab-cap-w', h.nb(sub === 'mix' ? `кубик: ${fmt(wetCm)} из 6 см` : `${fmt(wetCm)} из 6 см`));
      set(el, 'lab-cap-v', sub === 'clay'
        ? (wetCm < 1 ? 'Керамзит почти не поднимает воду: сеянцу в нём нечего пить, пока корень не дорос до раствора. Поэтому сеют в кубик, а керамзитом только засыпают.' : 'Нижние шарики мокрые, верхние сухие: корень будет жить в мокрой полоске у дна.')
        : sub === 'mix' ? 'Так и задумано: кубик пропитан до верха и поит сеянец, а керамзит вокруг сухой и воздушный — не гниёт и не цветёт.'
          : sub === 'perlite' ? 'Перлит поднимает воду на несколько сантиметров — хорош для фитиля, но легко всплывает и пылит.'
            : `Мелкие поры (${s.note}) поднимают воду на весь стаканчик: сеянец не пересохнет, но и воздуха у стебля мало — поверх лучше насыпать керамзита.`);
    };
    h.bindPick(el, 'lab-cap-s', v => { sub = v; upd(); });
    h.bindRange(el, 'lab-cap-g', v => h.nb(`${fv(v)} см`), v => { gap = v; upd(); });
    upd();
  });

  /* A nutrient solution from a concentrate: what the water already has (its own EC) is subtracted, the rest comes
     from the fertilizer. EC grows nearly in proportion to the dose at these strengths, so one line from the label —
     «so many ml per litre give EC so much» — is enough to scale. Check with the meter: labels and water vary. */
  const MIX_PARTS = { 2: ['A', 'B'], 1: ['удобрение'], 3: ['A', 'B', 'C'] };
  register('hmix', el => {
    el.innerHTML = h.head('Раствор для гидропоники', 'Объём, вода из крана и нужная EC — калькулятор скажет, сколько миллилитров каждой части налить. Доза с этикетки по умолчанию — типичная для удобрений для гидропоники; впишите свою.') +
      `<div class="lab-controls">
        <div class="row-3 lab-row hm-row">
          <div class="field"><label for="lab-hm-v">Воды, л</label><input type="number" id="lab-hm-v" min="0.5" max="200" step="0.5" value="10" inputmode="decimal"></div>
          <div class="field"><label for="lab-hm-d">По этикетке, мл на 1 л</label><input type="number" id="lab-hm-d" min="0.1" max="20" step="0.1" value="2" inputmode="decimal"></div>
          <div class="field"><label for="lab-hm-e">Эта доза даёт EC</label><input type="number" id="lab-hm-e" min="0.2" max="4" step="0.1" value="1" inputmode="decimal"></div>
        </div>
        ${h.segHtml('lab-hm-p', 'Удобрение', [['2', 'A + B'], ['1', 'одна часть'], ['3', 'A + B + C']], '2')}
        ${h.rangeHtml('lab-hm-w', 'EC воды из крана', 0, 1.2, 0.05, 0.4)}
        ${h.rangeHtml('lab-hm-t', 'Нужная EC', 0.4, 2, 0.05, 1.2)}
      </div>
      <div class="hm-out" id="lab-hm-out" aria-live="polite"></div>`;
    let parts = 2;
    const num = id => { const v = parseFloat(String($('#' + id, el).value).replace(',', '.')); return isFinite(v) && v > 0 ? v : 0; };
    const stage = t => t < 0.85 ? 'сеянцы' : t < 1.45 ? 'рост и срезки' : t <= 1.65 ? 'регулярные срезки' : 'крепко для базилика';
    let w = 0.4, t = 1.2;
    const upd = () => {
      const V = num('lab-hm-v'), dose = num('lab-hm-d'), ecL = num('lab-hm-e'), out = $('#lab-hm-out', el);
      if (!V || !dose || !ecL) { out.innerHTML = '<p class="lab-foot">Впишите объём и дозу с этикетки.</p>'; return; }
      const need = t - w;
      if (need <= 0.02) {
        out.innerHTML = `<p class="hm-warn">${h.nb(`Вода из крана уже даёт EC ${fmt(w, 2)} — столько, сколько нужно, или больше. Разбавьте её фильтрованной или бутилированной водой.`)}</p>`;
        return;
      }
      const perL = dose * need / ecL, total = perL * V, step = dose * 0.1 / ecL * V;
      const names = MIX_PARTS[parts];
      out.innerHTML = `<div class="hm-parts">${names.map((n, i) => `<div class="hm-part"><span class="hm-k">${parts > 1 ? 'Часть ' : ''}${n}</span><b>${h.nb(fmt(total, total < 10 ? 1 : 0) + ' мл')}</b><small>${h.nb(fmt(perL, 2) + ' мл на литр')}</small></div>`).join('')}</div>
        <ol class="hm-steps">
          <li>${h.nb(`${V % 1 ? fmt(V) : fmt0(V)} л воды комнатной температуры: её EC ≈ ${fmt(w, 2)}.`)}</li>
          ${names.map((n, i) => `<li>${h.nb(`${parts > 1 ? 'Часть ' + n : 'Удобрение'} — ${fmt(total, total < 10 ? 1 : 0)} мл${i < names.length - 1 ? ', перемешайте' : ', перемешайте и подождите 10–15 минут'}.`)}</li>`).join('')}
          <li>${h.nb(`Проверьте EC: должно быть около ${fmt(t, 2)} (${stage(t)}). Каждые +0,1 — ещё ≈ ${fmt(step, 1)} мл ${parts > 1 ? 'каждой части' : 'удобрения'}.`)}</li>
          <li>${h.nb('pH — последним: до 5,8–6,2, pH‑минус по капле, мешая и меряя через 5 минут.')}</li>
        </ol>
        ${w > 0.8 ? `<p class="hm-warn">${h.nb(`Вода жёсткая или солёная (EC ${fmt(w, 2)}): в ней много кальция и бикарбонатов, pH будет ползти вверх. Лучше смешать её пополам с фильтрованной.`)}</p>` : ''}
        ${t > 1.8 ? `<p class="hm-warn">${h.nb('Выше 1,8 базилику уже крепко: кончики листьев могут подгорать.')}</p>` : ''}`;
    };
    $$('input[type="number"]', el).forEach(i => i.addEventListener('input', upd));
    h.bindPick(el, 'lab-hm-p', v => { parts = +v; upd(); });
    h.bindRange(el, 'lab-hm-w', v => `${fmt(v, 2)} мС/см`, v => { w = v; upd(); });
    h.bindRange(el, 'lab-hm-t', v => `${fmt(v, 2)} · ${stage(v)}`, v => { t = v; upd(); });
    upd();
  });

  const DO_T = [[10, 11.29], [12, 10.77], [14, 10.29], [16, 9.86], [18, 9.47], [20, 9.09], [22, 8.74], [24, 8.42], [26, 8.11], [28, 7.83], [30, 7.56], [32, 7.3], [34, 7.06], [35, 6.95]];
  const doAt = t => { for (let i = 0; i < DO_T.length - 1; i++) if (t <= DO_T[i + 1][0]) return lerp(DO_T[i][1], DO_T[i + 1][1], (t - DO_T[i][0]) / (DO_T[i + 1][0] - DO_T[i][0])); return DO_T[DO_T.length - 1][1]; };
  const demand = t => 6.1 * Math.pow(2, (t - 20) / 10);
  const O2_TZ = [[10, 18, 'warn', 'прохладно'], [18, 22, 'good', 'норма'], [22, 24, 'warn'], [24, 35, 'bad', 'опасно']];

  /* Oxygen against the roots' breathing at one temperature: two bars on one scale — what the water holds
     (reference data for fresh water) and what the roots ask for (illustrative, Q10 = 2) — and the margin between */
  register('o2', el => {
    el.innerHTML = h.head('Кислород против дыхания корней', 'Сколько кислорода держит вода при этой температуре и сколько просят корни. Растворимость — справочные данные для пресной воды, потребность корней — условная: важен не уровень, а запас между ними.', true) +
      `<div class="lab-controls">${h.rangeHtml('lab-o2-t', 'Температура раствора', 10, 35, 0.5, 22)}<div id="lab-o2-tz"></div></div>
       <div class="o2-out" aria-live="polite"><div id="lab-o2-hero"></div><div class="o2-bars" id="lab-o2-bars"></div><p class="hy-verdict" id="lab-o2-v"></p></div>`;
    let T = 22;
    const upd = () => {
      const d = doAt(T), n = demand(T), m = d - n, s = m > 1.2 ? 'good' : m > 0 ? 'warn' : 'bad';
      set(el, 'lab-o2-tz', hyScale({ min: 10, max: 35, zones: O2_TZ, ticks: [10, 20, 30], fmt: v => v + ' °C', to: T, state: hyZone(O2_TZ, T), label: `Температура раствора ${fv(T)} °C` }));
      set(el, 'lab-o2-hero', hyHero(h.nb(`${m >= 0 ? '+' : '−'}${fmt(Math.abs(m))} мг/л`), { good: 'запас кислорода сверх того, что просят корни', warn: 'запас почти кончился: корни на грани', bad: 'кислорода меньше, чем просят корни' }[s]));
      $('#lab-o2-bars', el).innerHTML = [['В воде', d, 'is-o2'], ['Нужно корням', Math.min(12, n), 'is-need']].map(([name, v, c]) =>
        `<div class="o2-row"><span class="o2-name">${name}</span><span class="o2-bar"><i class="${c}" style="width:${(v / 12 * 100).toFixed(1)}%"></i></span><span class="o2-val">${h.nb(fmt(v) + ' мг/л')}</span></div>`).join('');
      set(el, 'lab-o2-v', h.nb(s === 'good' ? 'Кислорода с запасом: корни белые и плотные.' : s === 'warn' ? 'На грани: добавьте аэрацию или охладите раствор.' : 'Корням не хватает кислорода: риск питиума и бурых корней. Охладите раствор до 18–22 °C.'));
    };
    h.bindRange(el, 'lab-o2-t', v => h.nb(`${fv(v)} °C`), v => { T = v; upd(); });
    upd();
  });

  /* Two weeks of a solution: every day the bushes drink water (more in heat and dry air) and take salts with it at
     their own «uptake EC». When that is below the solution's EC, the salts stay behind and EC climbs; above it,
     EC falls. Taking nitrate makes the roots give out OH⁻, so pH climbs in proportion to what they took
     (illustrative). Shown on two scales with their zones: where the solution was on day 0 and where it is now. */
  const DR_BOX = { jar: { name: 'банка 3 л, 1 куст', v: 3, n: 1 }, bucket: { name: 'ведро 15 л, 4 куста', v: 15, n: 4 } };
  const DR_AIR = { dry: { name: 'жарко и сухо', e: 1.5, c: 0.8 }, norm: { name: 'обычно', e: 1, c: 1.15 }, wet: { name: 'прохладно и сыро', e: 0.6, c: 1.6 } };
  const DR_TOP = { none: 'не доливать', water: 'водой', half: 'раствором ½', full: 'раствором той же EC' };
  const DR_EC = [[0, 0.8, 'warn', 'слабо'], [0.8, 1.8, 'good', 'норма'], [1.8, 3, 'bad', 'крепко']];
  const DR_PH = [[5, 5.5, 'warn'], [5.5, 6.5, 'good', 'норма'], [6.5, 7, 'warn'], [7, 8, 'bad', 'высоко']];
  register('drift', el => {
    el.innerHTML = h.head('Куда уплывёт раствор', 'Взрослые кусты каждый день пьют воду и берут соли. Кружок — где был раствор в день смены, точка — где он сейчас. Модель условная, но направление дрейфа она показывает верно.', true) +
      `<div class="lab-controls">
        ${pickHtml('lab-dr-b', 'Ёмкость', Object.keys(DR_BOX).map(k => [k, DR_BOX[k].name]), 'bucket')}
        ${pickHtml('lab-dr-a', 'Воздух', Object.keys(DR_AIR).map(k => [k, DR_AIR[k].name]), 'norm')}
        ${pickHtml('lab-dr-t', 'Каждый вечер доливать', Object.keys(DR_TOP).map(k => [k, DR_TOP[k]]), 'water')}
        ${h.rangeHtml('lab-dr-e', 'EC в день смены', 0.6, 2, 0.05, 1.2)}
        ${h.rangeHtml('lab-dr-d', 'День', 0, 14, 1, 14)}
        <div class="lab-actions"><button class="btn btn-ghost btn-small" type="button" id="lab-dr-play">▶ Прокрутить две недели</button></div>
      </div>
      <div class="dr-out" aria-live="polite">
        <div id="lab-dr-hero"></div>
        <div class="dr-scales"><div class="dr-scale"><p class="dr-h"><span>EC</span><b id="lab-dr-ev"></b></p><div id="lab-dr-ec"></div></div>
          <div class="dr-scale"><p class="dr-h"><span>pH</span><b id="lab-dr-pv"></b></p><div id="lab-dr-ph"></div></div></div>
        <ul class="hy-key"><li><i class="is-from"></i>в день смены</li><li><i class="is-to"></i>сейчас</li></ul>
        <p class="hy-verdict" id="lab-dr-v"></p>
      </div>`;
    let box = 'bucket', air = 'norm', top = 'water', ec0 = 1.2, day = 14;
    const run = () => {
      const b = DR_BOX[box], a = DR_AIR[air], E = b.n * 0.15 * a.e;
      let V = b.v, S = ec0 * b.v, pH = 6;
      const ec = [ec0], ph = [pH];
      let dry = null;
      for (let d = 1; d <= 14; d++) {
        const drink = Math.min(E, V * 0.9), took = Math.min(S, a.c * drink);
        V -= drink; S -= took;
        pH = Math.min(7.8, pH + took / ((V + drink / 2)) * 1.0);
        if (top === 'water') { pH = Math.min(7.8, pH + 0.02 * (b.v - V) / b.v); V = b.v; }
        else if (top === 'half' || top === 'full') { S += (b.v - V) * ec0 * (top === 'half' ? 0.5 : 1); V = b.v; }
        if (top === 'none' && V < b.v * 0.15 && dry == null) dry = d;
        ec.push(S / V); ph.push(pH);
      }
      const over = ph.findIndex(p => p > 6.5);
      return { ec, ph, dry, over: over > 0 ? over : null };
    };
    const upd = () => {
      const r = run(), e = r.ec[day], p = r.ph[day], de = r.ec[14] - ec0;
      set(el, 'lab-dr-ev', h.nb(`${fmt(ec0, 1)} → ${fmt(e, 1)}`));
      set(el, 'lab-dr-pv', h.nb(`6,0 → ${fmt(p, 1)}`));
      set(el, 'lab-dr-ec', hyScale({ min: 0, max: 3, zones: DR_EC, ticks: [0, 1, 2, 3], fmt: v => fmt0(v), from: ec0, to: e, state: hyZone(DR_EC, e), label: `EC: в день смены ${fmt(ec0, 1)}, на ${day}-й день ${fmt(e, 1)}` }));
      set(el, 'lab-dr-ph', hyScale({ min: 5, max: 8, zones: DR_PH, ticks: [5, 6, 7, 8], fmt: v => fmt0(v), from: 6, to: p, state: hyZone(DR_PH, p), label: `pH: в день смены 6,0, на ${day}-й день ${fmt(p, 1)}` }));
      set(el, 'lab-dr-hero', r.dry != null ? hyHero(`${r.dry}-й день`, 'и ёмкость почти пуста: без долива кусты выпьют её до дна')
        : r.over != null ? hyHero(`${r.over}-й день`, 'pH выйдет за 6,5 — пора опустить его pH‑минусом')
          : hyHero('две недели', 'pH держится в норме — проверяйте раз в 2–3 дня'));
      set(el, 'lab-dr-v', h.nb(r.dry != null ? 'Без долива уровень падает быстрее, чем вырабатывается раствор: доливайте каждый вечер.'
        : de > 0.3 ? `EC растёт: кусты пьют воду быстрее, чем берут соли${top === 'none' ? ', и соли остаются в ёмкости' : ''}. Доливайте чистой водой, а раствор меняйте раз в 2–3 недели.`
          : de < -0.3 ? `EC падает: соли уходят с каждым днём, а долив их не возвращает. ${top === 'half' ? 'Доливайте раствором покрепче или меняйте раствор раньше' : 'Доливайте раствором половинной или той же крепости'}.`
            : 'EC держится: так и доливайте.'));
    };
    h.bindPick(el, 'lab-dr-b', v => { box = v; upd(); });
    h.bindPick(el, 'lab-dr-a', v => { air = v; upd(); });
    h.bindPick(el, 'lab-dr-t', v => { top = v; upd(); });
    h.bindRange(el, 'lab-dr-e', v => `${fmt(v, 2)} мС/см`, v => { ec0 = v; upd(); });
    const dd = h.bindRange(el, 'lab-dr-d', v => `${fmt0(v)}`, v => { day = v; upd(); });
    // the play button runs the two weeks by, a day in about a third of a second
    let t0 = 0;
    const play = S.loop(ts => {
      if (!t0) t0 = ts;
      const v = Math.min(14, Math.floor((ts - t0) / 330));
      if (v !== day) dd.set(v);
      if (v >= 14) { play.stop(); t0 = 0; return; }
      play.next();
    });
    $('#lab-dr-play', el).addEventListener('click', () => {
      if (play.on) { play.stop(); t0 = 0; return; }
      if (h.reduce.matches) { dd.set(14); return; }
      dd.set(0); t0 = 0; play.start();
    });
    upd();
  });

  /* The check every two or three days: the numbers off the meters → what to do now, worst first. The limits are
     those of this chapter: solution 18–22 °C (24 °C — the rot threshold), pH 5.5–6.5, EC within a third of where it
     started, a fresh solution every 2–3 weeks in a bucket and every 6–8 weeks in a jar. */
  register('hcheck', el => {
    el.innerHTML = h.head('Проверка за две минуты', 'Впишите, что показали приборы, — инструмент скажет, что делать, начиная с самого срочного.') +
      `<div class="lab-controls">
        ${h.segHtml('lab-hc-s', 'Система', [['dwc', 'ведро DWC'], ['kratky', 'банка Кратки']], 'dwc')}
        <div class="lab-row-wrap">
          ${h.rangeHtml('lab-hc-e0', 'EC при смене раствора', 0.4, 2, 0.05, 1.2)}
          ${h.rangeHtml('lab-hc-e', 'EC сейчас', 0, 3, 0.05, 1.4)}
        </div>
        <div class="lab-row-wrap">
          ${h.rangeHtml('lab-hc-p', 'pH сейчас', 4.5, 8, 0.1, 6.6)}
          ${h.rangeHtml('lab-hc-t', 'Температура раствора', 12, 32, 0.5, 23)}
        </div>
        ${h.rangeHtml('lab-hc-d', 'Дней со смены раствора', 0, 60, 1, 12)}
      </div>
      <ol class="hc-list" id="lab-hc-out" aria-live="polite"></ol>`;
    const v = { s: 'dwc', e0: 1.2, e: 1.4, p: 6.6, t: 23, d: 12 };
    const RANK = { bad: 0, warn: 1, ok: 2 };
    const check = () => {
      const out = [], add = (st, title, text) => out.push({ st, title, text });
      // temperature
      if (v.t > 24) add('bad', `Раствор ${fv(v.t)} °C — тепло для корней`, 'Выше 24 °C мало кислорода и раздолье для питиума. Уберите ёмкость от батареи и солнца, оберните светлым, положите в ведро замороженную бутылку воды; проверьте, работает ли компрессор.');
      else if (v.t > 22) add('warn', `Раствор ${fv(v.t)} °C — на верхней границе`, 'Пока терпимо, но следите за корнями: белые и упругие — хорошо, бурые и слизистые — меняйте раствор.');
      else if (v.t < 16) add('warn', `Раствор ${fv(v.t)} °C — холодно`, 'Корни берут питание медленнее, рост встаёт. Уберите ёмкость с холодного подоконника, подложите пенопласт.');
      else add('ok', `Температура ${fv(v.t)} °C — хорошо`, 'Кислорода в растворе достаточно, питиуму прохладно.');
      // pH
      if (v.p > 7) add('bad', `pH ${fmt(v.p, 1)} — высоко`, 'Железо, марганец и фосфор уходят из раствора: скоро пожелтеют молодые листья. pH‑минус по капле до 5,8–6,2.');
      else if (v.p > 6.5) add('warn', `pH ${fmt(v.p, 1)} — выше нормы`, 'Так ведёт себя раствор с нитратным азотом: корни подщелачивают его. Опустите до 5,8–6,2 pH‑минусом, по капле на литр.');
      else if (v.p < 5.2) add('bad', `pH ${fmt(v.p, 1)} — кисло`, 'Кальций и магний становятся недоступны, корни страдают. pH‑плюс по капле или свежий раствор; проверьте, не перелили ли кислоты.');
      else if (v.p < 5.5) add('warn', `pH ${fmt(v.p, 1)} — чуть кисловато`, 'Поднимите до 5,8 pH‑плюсом или долейте водопроводной воды: в ней есть бикарбонаты.');
      else add('ok', `pH ${fmt(v.p, 1)} — в норме`, 'Все элементы доступны. Следующий замер — через 2–3 дня.');
      // EC against where it started
      const r = v.e / v.e0;
      if (v.e > 2.2) add('bad', `EC ${fmt(v.e, 2)} — крепко для базилика`, 'Кончики листьев начнут подгорать. Долейте чистой воды до EC 1,2–1,6 или смените раствор.');
      else if (r > 1.3) add('warn', `EC выросла на ${fmt0((r - 1) * 100)} %`, 'Кусты пьют воду быстрее, чем берут соли, — так бывает в жару. Доливайте чистой водой, а не раствором.');
      else if (r < 0.7) add('warn', `EC упала на ${fmt0((1 - r) * 100)} %`, 'Соли вырабатываются быстрее воды. Долейте раствором половинной крепости или смените раствор.');
      else add('ok', `EC ${fmt(v.e, 2)} — держится`, 'Раствор работает: в нём столько солей, сколько нужно.');
      // age of the solution
      const life = v.s === 'dwc' ? [14, 21] : [42, 56];
      if (v.d > life[1]) add(v.s === 'dwc' ? 'bad' : 'warn', `Раствору ${v.d} ${h.plural(v.d, 'день', 'дня', 'дней')} — пора менять`, `В старом растворе копятся одни ионы и кончаются другие, а приборы этого не видят. Смените целиком и вымойте ёмкость.`);
      else if (v.d > life[0]) add('warn', `Раствору ${v.d} ${h.plural(v.d, 'день', 'дня', 'дней')}`, `Смена — в ближайшие ${life[1] - v.d} ${h.plural(life[1] - v.d, 'день', 'дня', 'дней')}.`);
      else add('ok', `Раствору ${v.d} ${h.plural(v.d, 'день', 'дня', 'дней')} — свежий`, `Менять через ${life[1] - v.d} ${h.plural(life[1] - v.d, 'день', 'дня', 'дней')}.`);
      return out.sort((a, b) => RANK[a.st] - RANK[b.st]);
    };
    const WORD = { bad: 'срочно', warn: 'скоро', ok: 'в порядке' };
    const upd = () => {
      const list = check();
      $('#lab-hc-out', el).innerHTML = list.map(x => `<li class="hc-item is-${x.st}"><span class="hc-st">${WORD[x.st]}</span><div><b>${h.nb(x.title)}</b><p>${h.nb(x.text)}</p></div></li>`).join('') +
        (list.every(x => x.st === 'ok') ? `<li class="hc-item is-all"><span class="hc-st">итог</span><div><b>Всё в порядке</b><p>${h.nb('Следующая проверка — через 2–3 дня.')}</p></div></li>` : '');
    };
    h.bindPick(el, 'lab-hc-s', x => { v.s = x; upd(); });
    h.bindRange(el, 'lab-hc-e0', x => `${fmt(x, 2)} мС/см`, x => { v.e0 = x; upd(); });
    h.bindRange(el, 'lab-hc-e', x => `${fmt(x, 2)} мС/см`, x => { v.e = x; upd(); });
    h.bindRange(el, 'lab-hc-p', x => fmt(x, 1), x => { v.p = x; upd(); });
    h.bindRange(el, 'lab-hc-t', x => h.nb(`${fv(x)} °C`), x => { v.t = x; upd(); });
    h.bindRange(el, 'lab-hc-d', x => `${fmt0(x)}`, x => { v.d = x; upd(); });
    upd();
  });

  /* Pythium at a root: zoospores swim in the solution and turn towards the root by the smell of what it gives out.
     The warmer the water, the more of them and the faster they swim; without the air pump the root is weaker.
     The risk is a curve through the trials of this chapter (no outbreaks below 18 °C, many above 24 °C): a scale, not a forecast. */
  register('pyth', el => {
    el.innerHTML = h.head('Споры у корня', 'Капельки со жгутиками — зооспоры питиума, бурые пятна — где они проросли в корень. Меняйте температуру раствора и включайте компрессор.', true) +
      `<div class="lab-controls">
        ${h.rangeHtml('lab-py-t', 'Температура раствора', 14, 30, 0.5, 24)}
        ${h.segHtml('lab-py-a', 'Компрессор', [['on', 'работает'], ['off', 'выключен']], 'on')}
      </div>
      <div class="lab-chart py-chart" id="lab-py-ch"></div>` +
      h.readHtml([['Кислород в растворе', 'lab-py-o'], ['Риск гнили', 'lab-py-r'], ['Что делать', 'lab-py-v', 'is-wide']]);
    const F = ill.F, q = ill.q, VW = 360, VH = 200, RX = 180;
    let T = 24, air = true, K = 1, OX = 0, OY = 0, dyn = null, last = 0;
    const risk = () => clamp(1 / (1 + Math.exp(-(T - 23 + (air ? 0 : 2.5)) / 1.3)), 0, 1);
    const DO = () => Math.max(0, doAt(T) - (air ? 0.3 : 3));
    const rnd = ill.rng(11);
    const spores = [], stuck = [];
    const spawn = s => { const left = rnd() < 0.5; Object.assign(s, { x: left ? 8 + rnd() * 60 : VW - 8 - rnd() * 60, y: 16 + rnd() * 168, a: rnd() * Math.PI * 2 }); return s; };
    for (let i = 0; i < 30; i++) { const s = spawn({}); s.x = 8 + rnd() * (VW - 16); spores.push(s); }
    const rootX = y => RX + Math.sin(y / 46) * 8;
    const step = dt => {
      const R = risk(), n = Math.round(4 + 26 * R), v = (18 + (T - 14) * 3) * dt, cap = Math.round(2 + 22 * R);
      for (let i = 0; i < n; i++) {
        const s = spores[i], dx = rootX(s.y) - s.x;
        // a random walk with a pull towards the root (chemotaxis)
        s.a += (rnd() - 0.5) * 1.2 + Math.sign(dx) * (Math.cos(s.a) * Math.sign(dx) < 0 ? 0.25 : 0);
        s.x += Math.cos(s.a) * v + Math.sign(dx) * v * (0.25 + 0.45 * R);
        s.y += Math.sin(s.a) * v;
        if (s.y < 12 || s.y > VH - 14) s.a = -s.a;
        s.y = clamp(s.y, 12, VH - 14);
        if (Math.abs(rootX(s.y) - s.x) < 6) {
          stuck.push({ y: s.y, side: Math.sign(-dx) || 1, age: 0 });
          spawn(s);
        }
      }
      stuck.forEach(p => { p.age += dt; });
      while (stuck.length > cap) stuck.shift();
    };
    const spore = s => {
      const x = s.x, y = s.y;
      return `<g transform="translate(${q(x)} ${q(y)}) rotate(${q(s.a * 180 / Math.PI)})"><ellipse rx="4.2" ry="2.6" fill="${F('mold')}" stroke="${F('mold-d')}" stroke-width=".7"/><path d="M-3.6 0q-5 -3 -9 -1M-2 1.4q-4 4 -8 3" stroke="${F('mold-d')}" stroke-width=".8" fill="none"/></g>`;
    };
    const paint = () => {
      if (!dyn) return;
      const R = risk(), n = Math.round(4 + 26 * R);
      let g = '';
      // the cloud of what the root gives out: the spores follow it
      g += stuck.map(p => { const k = Math.min(1, p.age / 3); return `<ellipse cx="${q(rootX(p.y) + p.side * 1.5)}" cy="${q(p.y)}" rx="${q(3 + k * 4)}" ry="${q(4 + k * 7)}" fill="${F('rot')}" opacity="${q(0.45 + k * 0.45)}"/>`; }).join('');
      for (let i = 0; i < n; i++) g += spore(spores[i]);
      if (air) for (let i = 0; i < 14; i++) { const u = ((last / 1000) * 0.35 + i / 14) % 1, x = 300 + Math.sin(u * 8 + i) * 10 + (i % 3) * 6; g += `<circle cx="${q(x)}" cy="${q(VH - 10 - u * (VH - 30))}" r="${1.4 + (i % 3) * 0.5}" fill="${F('hi')}" fill-opacity=".35" stroke="${F('hi')}" stroke-width=".9"/>`; }
      dyn.innerHTML = `<g transform="translate(${q(OX)} ${q(OY)}) scale(${q(K)})">${g}</g>`;
    };
    const ch = h.chart($('#lab-py-ch', el), {
      label: 'Корень в растворе и зооспоры питиума вокруг него',
      h: w => Math.round(clamp(w * 0.5, 200, 300)),
      draw(w, hh) {
        K = Math.min(w / VW, hh / VH); OX = (w - VW * K) / 2; OY = (hh - VH * K) / 2;
        let d = 'M', hairs = '';
        for (let y = 0; y <= VH - 6; y += 6) d += `${y ? 'L' : ''}${q(rootX(y))} ${y}`;
        for (let y = 20; y < VH - 20; y += 9) { const x = rootX(y), sd = (y / 9) % 2 ? 1 : -1; hairs += `M${q(x + sd * 3)} ${y}l${sd * 9} ${q(3 + (y % 4))}`; }
        const g =
          `<path d="${d}" stroke="${F('root-d')}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${F('root')}" stroke-width="8.5" fill="none" stroke-linecap="round"/>` +
          `<path d="${hairs}" stroke="${F('root')}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
          (air ? `<rect x="292" y="${VH - 12}" width="26" height="6" rx="3" fill="${F('frame-d')}"/>` : '');
        return `<rect data-bg width="${w}" height="${hh}" rx="14" fill="${F('bg')}"/><rect data-bg width="${w}" height="${hh}" rx="14" fill="${F('water-c')}" opacity=".55"/><g data-bg transform="translate(${q(OX)} ${q(OY)}) scale(${q(K)})">${g}</g><g class="py-dyn"></g>` +
          `<text class="hs-lbl" data-on-picture x="${q(OX + (RX + 16) * K)}" y="${q(OY + 18 * K)}" text-anchor="start">корень</text>` +
          (air ? `<text class="hs-lbl" data-on-picture x="${q(OX + 330 * K)}" y="${q(OY + 26 * K)}" text-anchor="end">пузыри</text>` : '');
      }
    });
    new MutationObserver(() => { dyn = $('.py-dyn', ch.svg); paint(); }).observe(ch.svg, { childList: true });
    const loop = S.loop(ts => {
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0.016;
      last = ts; step(dt); paint(); loop.next();
    });
    const upd = () => {
      const R = risk(), o = DO();
      set(el, 'lab-py-o', h.nb(`${fmt(o)} мг/л`));
      set(el, 'lab-py-r', R < 0.2 ? 'низкий' : R < 0.55 ? 'заметный' : R < 0.85 ? 'высокий' : 'очень высокий');
      set(el, 'lab-py-v', R < 0.2 ? 'Прохладно и много кислорода: споры есть, но корень сильнее. Держите так.'
        : !air ? 'Включите компрессор: без пузырей кислорода меньше, корень слабеет, а спорам всё равно.'
          : R >= 0.55 ? 'Охладите раствор до 18–22 °C: уберите ёмкость от батареи и солнца, положите в ведро бутылку со льдом. При бурых корнях — смена раствора и мойка.'
            : 'На грани: следите за корнями и за температурой в жаркие дни, мойте ёмкость при каждой смене.');
      ch.redraw();
    };
    h.bindRange(el, 'lab-py-t', v => h.nb(`${fv(v)} °C`), v => { T = v; upd(); });
    h.bindPick(el, 'lab-py-a', v => { air = v === 'on'; upd(); });
    upd();
    if (h.reduce.matches) { for (let i = 0; i < 300; i++) step(0.05); dyn = $('.py-dyn', ch.svg); paint(); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { last = 0; loop.start(); } else loop.stop(); }).observe(el);
    else loop.start();
  });
})();
