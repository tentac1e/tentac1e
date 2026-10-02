/* Гид по базилику — живые модели главы «Прищипывание». Файл собирает scripts/build.py из src/labs/formirovka/ — правьте там */
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
  window.BasilScience.styleFor("formirovka", "/* auxin */\n.auxin-stage .lab-plant { max-width: 340px; }\n.aux-aux { fill: var(--ser-2); }\n.aux-sug { fill: var(--ser-3); }\n.aux-cyt { fill: var(--ser-4); }\n.aux-bud { fill: var(--pl-c); stroke: var(--pl-a); stroke-width: 1.5; }\n.aux-steps { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; counter-reset: s; }\n.aux-steps li { counter-increment: s; display: grid; grid-template-columns: 28px 1fr; gap: 8px; align-items: center; padding: 8px 10px; border-radius: 12px; color: var(--ink-3); font-size: .9rem; transition: background-color .4s, color .4s; }\n.aux-steps li::before { content: counter(s); display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--line-strong); font: 600 .78rem/1 var(--font-mono); }\n.aux-steps li.is-on { background: var(--k-soft); color: var(--ink); font-weight: 600; }\n.aux-steps li.is-on::before { background: var(--k); border-color: var(--k); color: var(--surface); }\n\n");
  /* @use props */
  /* Pictures of the Pinching chapter: one shoot before the pinch, a week after it and two or three weeks
     later (data-ill="pinch:1…3"). */
  const Rf = props;
  const pinchP = (body, label) => ill.svg(160, 200, Rf.paper(160, 200) + Rf.ground(190, 160, 200) + ill.pot(80, 186, 64, 12) + body, label);
  const PINCH = {
    // four pairs; the cut goes over the second pair, where buds sit in the axils
    1: () => {
      const s = Rf.shoot(80, 180, 152, { pairs: 4, s: 0.42, buds: [1] });
      const [nx, ny] = s.nodes[1];
      return pinchP(s.svg + Rf.cutMark(nx, ny - 8, 34) + Rf.scissors(nx + 32, ny - 8, 196, 1, 0.8) + ill.label(nx + 34, ny - 24, 'срез', 'start'), 'Побег с четырьмя парами листьев; срез над второй парой');
    },
    // a week on: a short stub over the second pair, and both buds have started
    2: () => {
      const s = Rf.shoot(80, 180, 152, { pairs: 4, s: 0.42, stub: 1, shoots: { 1: { len: 22, pairs: 1, s: 0.16, a: 22 } } });
      const [nx, ny] = s.nodes[1];
      return pinchP(s.svg + Rf.arrow(36, 58, nx - 8, ny - 18, -10) + ill.label(10, 32, 'почки', 'start') + ill.label(10, 49, 'проснулись', 'start'), 'Через неделю из пазух второй пары пошли два побега');
    },
    // two or three weeks: two tops instead of one
    3: () => {
      const s = Rf.shoot(80, 180, 152, { pairs: 4, s: 0.42, stub: 1, shoots: { 1: { len: 84, pairs: 3, s: 0.3, a: 24 } } });
      return pinchP(s.svg, 'Через две-три недели — две верхушки вместо одной');
    }
  };
  illustrate('pinch', n => (PINCH[n] || PINCH[1])(), Object.keys(PINCH));

  register('auxin', el => {
    el.innerHTML = h.head('Что происходит после среза', 'Фиолетовые точки — ауксин, жёлтые — сахар, голубые — цитокинины из корней. Нажмите «Прищипнуть» и смотрите, как просыпаются почки.') +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage auxin-stage"><svg class="lab-plant" viewBox="-160 -330 320 350" role="img" aria-label="Стебель базилика с потоками гормонов"><line class="soil-line" x1="-160" x2="160" y1="2" y2="2"/><g id="lab-aux-g"></g><g class="fx" id="lab-aux-fx"></g></svg></div>
        <div class="lab-controls">
          <div class="lab-actions"><button class="btn btn-primary btn-small" type="button" id="lab-aux-cut">${h.icon('scissors')}Прищипнуть</button><button class="btn btn-ghost btn-small" type="button" id="lab-aux-reset">Сначала</button></div>
          <ol class="aux-steps" id="lab-aux-steps">
            <li class="is-on">Верхушка шлёт ауксин вниз — почки спят</li>
            <li>Срез: источник ауксина исчез</li>
            <li>Через часы: к почкам устремился сахар</li>
            <li>Сутки: из корней поднимаются цитокинины</li>
            <li>Неделя: две почки стали побегами</li>
          </ol>
        </div>
      </div>`;
    const g = $('#lab-aux-g', el), fx = $('#lab-aux-fx', el);
    const full = () => S.basil({ nodes: 7, scale: 1.4, w: 8 });
    const cut = () => { const s = S.basil({ nodes: 3, scale: 1.4, w: 8, apex: 'cut' }); s.internodes = full().internodes.slice(0, 3); s.leaves = full().leaves.slice(0, 3); return s; };
    const grown = () => { const s = cut(); s.children = [{ at: 2, spec: S.basil({ id: 'bL', nodes: 5, scale: 1, w: 5, angle: -0.5, flex: 1.4 }) }, { at: 2, spec: S.basil({ id: 'bR', nodes: 5, scale: 1, w: 5, angle: 0.5, flex: 1.4 }) }]; return s; };
    const plant = S.Plant(g, full(), { grown: true, leafScale: 0.55, sway: 0.6, growDur: 3.2 });
    let stage = 0, t0 = 0, raf = 0, visible = true;
    const parts = [];
    const steps = $$('#lab-aux-steps li', el);
    const setStep = k => steps.forEach((li, i) => li.classList.toggle('is-on', i === k));
    const along = (pts, u) => {
      if (pts.length < 2) return pts[0] || { x: 0, y: 0 };
      const segs = []; let L = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push(d); L += d; }
      let target = clamp(u, 0, 1) * L;
      for (let i = 0; i < segs.length; i++) { if (target <= segs[i] || i === segs.length - 1) { const f = segs[i] ? target / segs[i] : 0; return { x: lerp(pts[i].x, pts[i + 1].x, f), y: lerp(pts[i].y, pts[i + 1].y, f) }; } target -= segs[i]; }
      return pts[pts.length - 1];
    };
    function frame(ts) {
      raf = 0;
      if (!visible) return;
      const C = window.BasilScene && window.BasilScene.calm;
      if (C && C.state === 'sleep') { C.onWake(wake); return; }
      const t = ts / 1000;
      const since = t0 ? t - t0 : 0;
      if (stage === 1 && since > 1.2) { stage = 2; setStep(2); }
      if (stage === 2 && since > 3) { stage = 3; setStep(3); }
      if (stage === 3 && since > 4.6) { stage = 4; setStep(4); plant.setSpec(grown()); }
      const pts = plant.points('r');
      if (!pts.length) { raf = requestAnimationFrame(frame); return; }
      const rev = pts.slice().reverse();
      const node2 = pts.length > 3 ? pts.slice(0, 4) : pts;
      if (stage === 0 && Math.random() < 0.12) parts.push({ k: 'aux', u: 0, sp: 0.16 + Math.random() * 0.05 });
      if (stage >= 2 && stage < 4 && Math.random() < 0.18) parts.push({ k: 'sug', u: 0, sp: 0.3 + Math.random() * 0.1 });
      if (stage >= 3 && stage < 4 && Math.random() < 0.12) parts.push({ k: 'cyt', u: 0, sp: 0.22 + Math.random() * 0.06 });
      let s = '';
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.u += p.sp * 0.016;
        if (p.u >= 1) { parts.splice(i, 1); continue; }
        const q = p.k === 'aux' ? along(rev, p.u) : along(node2, p.u);
        s += `<circle class="aux-${p.k}" cx="${r1(q.x + (p.k === 'aux' ? -2 : p.k === 'sug' ? 2.5 : 0))}" cy="${r1(q.y)}" r="${p.k === 'aux' ? 3.4 : 3}"/>`;
      }
      if (stage >= 2 && stage < 4 && pts[3]) s += `<circle class="aux-bud" cx="${r1(pts[3].x - 6)}" cy="${r1(pts[3].y - 3)}" r="${r1(3 + Math.min(3, since - 1.2))}"/><circle class="aux-bud" cx="${r1(pts[3].x + 6)}" cy="${r1(pts[3].y - 3)}" r="${r1(3 + Math.min(3, since - 1.2))}"/>`;
      fx.innerHTML = s;
      raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!raf && !h.reduce.matches) raf = requestAnimationFrame(frame); };
    $('#lab-aux-cut', el).addEventListener('click', () => {
      if (stage) return;
      stage = 1; t0 = performance.now() / 1000; setStep(1);
      plant.setSpec(cut());
      if (h.reduce.matches) { stage = 4; setStep(4); plant.setSpec(grown()); }
      wake();
    });
    $('#lab-aux-reset', el).addEventListener('click', () => { stage = 0; t0 = 0; parts.length = 0; setStep(0); plant.setSpec(full(), { regrow: false }); wake(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { visible = en.some(x => x.isIntersecting); if (visible) wake(); }).observe(el);
    wake();
  });

  register('branch', el => {
    el.innerHTML = h.head('Куст после n прищипываний', 'Каждый срез над узлом будит две почки. Сдвиньте ползунок — новые побеги вырастут на глазах.') +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage"><svg class="lab-plant" viewBox="-250 -350 500 370" role="img" aria-label="Куст базилика после нескольких прищипываний"><line class="soil-line" x1="-250" x2="250" y1="2" y2="2"/><g id="lab-br-g"></g></svg></div>
        <div class="lab-controls">${h.rangeHtml('lab-br-n', 'Прищипываний', 0, 4, 1, 2)}</div>
      </div>` + h.readHtml([['Верхушек', 'lab-br-t'], ['Листьев на кусте', 'lab-br-l'], ['Возраст куста', 'lab-br-w']]);
    const SC = [2.1, 1.85, 1.62, 1.42, 1.24];
    const spec = n => S.bush(n, { scale: SC[n], leaf: 1 });
    const plant = S.Plant($('#lab-br-g', el), spec(2), { grown: true, leafScale: 0.6, sway: 0.8, growDur: 1.8 });
    const upd = n => {
      plant.setSpec(spec(n));
      const leaves = plant.shoots().reduce((a, s) => a + s.spec.internodes.length * 2, 0);
      set(el, 'lab-br-t', String(Math.pow(2, n)));
      set(el, 'lab-br-l', `≈ ${leaves}`);
      set(el, 'lab-br-w', `≈ ${fmt(5 + 2.5 * n)} нед.`);
    };
    h.bindRange(el, 'lab-br-n', v => String(v), upd);
    upd(2);
  });
})();
