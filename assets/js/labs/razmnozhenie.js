/* Гид по базилику — живые модели главы «Размножение». Файл собирает scripts/build.py из src/labs/razmnozhenie/ — правьте там */
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
  { const st = document.createElement('style'); st.dataset.labs = "razmnozhenie"; st.textContent = "/* roots */\n.roots-svg { width: 100%; max-width: 250px; height: auto; }\n.rt-glass { fill: color-mix(in srgb, var(--surface-2) 50%, transparent); stroke: var(--glass-edge); stroke-width: 3; stroke-linejoin: round; }\n.rt-water { fill: var(--water-fill); }\n.rt-wl { stroke: var(--water-line); stroke-width: 1.5; }\n.rt-stem { fill: none; stroke: var(--stem); stroke-width: 5; stroke-linecap: round; }\n.rt-node { fill: var(--pl-a); }\n.rt-root { fill: none; stroke: var(--root); stroke-width: 2.2; stroke-linecap: round; }\n\n/* seeds */\n.sl-scale { position: relative; height: 34px; margin: 16px 0 26px; border-radius: 10px; background: linear-gradient(90deg, color-mix(in srgb, var(--danger) 18%, var(--surface-2)), var(--surface-2) 25%, var(--band-good)); border: 1px solid var(--line); }\n.sl-scale i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 10px 0 0 10px; background: color-mix(in srgb, var(--k) 45%, transparent); border-right: 3px solid var(--k); transition: width .4s var(--ease-float); }\n.sl-scale span { position: absolute; top: calc(100% + 6px); translate: -50% 0; font: 500 .7rem/1 var(--font-mono); color: var(--ink-3); }\n.sl-scale span:first-of-type { translate: 0 0; }\n.sl-scale span:last-of-type { translate: -100% 0; }\n\n"; document.head.appendChild(st); }
  /* @use props */
  /* Pictures of the Propagation chapter: the steps of rooting a cutting (data-ill="cut:1…5") and of saving
     your own seed (seed:1…6). */
  const Fr = ill.F, qr = ill.q, Rr = props;
  // a cutting standing on (x, y): its own stem with pairs of leaves; bare — the lower nodes without leaves
  const cutting = (x, y, h = 62, o = {}) => Rr.shoot(x, y, h, Object.assign({ pairs: 4, s: 0.27 }, o));
  const CUT = {
    1: () => {
      // a bush; the top 8–12 cm with three or four pairs is cut just under a node
      const sh = Rr.shoot(46, 100, 92, { pairs: 6, s: 0.3 });
      const [nx, ny] = sh.nodes[2];
      let g = ill.pot(46, 104, 50, 20) + sh.svg + Rr.cutMark(nx, ny + 6, 22) + Rr.scissors(nx + 22, ny + 6, 196, 0.85, 0.8);
      const my = qr((ny + 18) / 2);
      g += `<g class="ill-scale"><path d="M98 ${qr(ny + 6)}V12M94 ${qr(ny + 6)}H102M94 12H102" fill="none" stroke="currentColor" stroke-width="1.6"/></g><text class="ill-lbl" x="114" y="${my}" text-anchor="middle" transform="rotate(-90 114 ${my})">8–12 см</text>`;
      return Rr.step(g, 'Верхушку срезают чуть ниже узла');
    },
    2: () => {
      const c = cutting(54, 104, 84, { bare: 2, s: 0.28 });
      let g = c.svg;
      // the two lower pairs, torn off
      g += ill.leaf({ x: 92, y: 96, a: 110, s: 0.2, seed: 3 }) + ill.leaf({ x: 100, y: 78, a: 60, s: 0.2, seed: 5 }) + Rr.arrow(66, c.nodes[0][1] - 2, 84, 92, -6);
      return Rr.step(g, 'С нижней трети черенка листья оборваны');
    },
    // the cutting goes in behind the glass wall: what is inside the glass is seen through it
    3: () => {
      const c = cutting(60, 98, 84, { bare: 2, s: 0.26 });
      return Rr.step(Rr.glass(60, 104, 44, 56, { level: 0.72, inside: c.svg }), 'Черенок в стакане: нижние узлы под водой');
    },
    4: () => {
      const c = cutting(40, 98, 84, { bare: 2, s: 0.26 });
      const under = Rr.roots(40, c.nodes[0][1], 14, 6, { seed: 4 }) + Rr.roots(40, c.nodes[1][1], 10, 4, { seed: 7 }) + c.svg;
      let g = Rr.glass(40, 104, 44, 56, { level: 0.72, inside: under });
      g += Rr.drop(98, 34, 1.5) + ill.label(117, 62, '2–3 дня', 'end');
      return Rr.step(g, 'Белые корешки на узлах в воде; воду меняют каждые 2–3 дня');
    },
    5: () => {
      const c = cutting(56, 80, 62, { bare: 2, s: 0.24 });
      let g = ill.pot(56, 84, 56, 24) + c.svg + Rr.bag(56, 82, 78, 76);
      return Rr.step(g, 'Укоренённый черенок в горшке под пакетом');
    }
  };
  illustrate('cut', n => (CUT[n] || CUT[1])(), Object.keys(CUT));

  const SEED = {
    1: () => Rr.step(ill.pot(52, 104, 52, 22) + ill.bush({ x: 52, y: 98, h: 64, nodes: 3, leaf: 0.3, spread: 0.85, flowers: 'white', seed: 5 }) + Rr.bee(98, 34, 1.1), 'Здоровый куст в цвету'),
    2: () => {
      let g = ill.pot(40, 104, 46, 20) + ill.bush({ x: 40, y: 98, h: 50, nodes: 2, leaf: 0.28, spread: 0.8, seed: 4 });
      g += Rr.seedSpike(40, 48, 36, { flowers: 'white' }) + Rr.bag(41, 50, 26, 42, { kind: 'mesh' });
      g += Rr.seedSpike(96, 104, 64, { flowers: 'purple' }) + Rr.bee(100, 30, 1);
      return Rr.step(g, 'Цветонос под сеточкой: пчела не принесёт пыльцу другого сорта');
    },
    3: () => Rr.step(Rr.seedSpike(34, 104, 86, { ripe: 0.55, flowers: 'white' }) + Rr.lens(80, 54, 30, Rr.calyx(0, 18, 0.95), 125), 'Нижние чашечки побурели, внутри — чёрные семена'),
    4: () => {
      let g = Rr.seedSpike(48, 60, 50, { dry: true }) + Rr.seedSpike(60, 60, 44, { dry: true }) + Rr.seedSpike(72, 60, 52, { dry: true });
      g += Rr.bag(60, 104, 62, 50, { kind: 'paper' });
      return Rr.step(g, 'Срезанные кисти досыхают в бумажном пакете');
    },
    5: () => {
      const rnd = ill.rng(6);
      let g = Rr.bowl(60, 104, 84, { seeds: true, chaff: true }) + `<g transform="rotate(-70 60 40)">${Rr.seedSpike(60, 40, 50, { dry: true })}</g>`;
      for (let i = 0; i < 7; i++) g += Rr.seed(46 + rnd() * 28, 50 + rnd() * 16, rnd() * 180);
      return Rr.step(g, 'Сухие кисти растирают над миской');
    },
    6: () => Rr.step(Rr.envelope(52, 98, 58, 72, { seeds: false }) + [0, 1, 2, 3, 4].map(i => Rr.seed(92 + (i % 3) * 7, 96 - Math.floor(i / 3) * 6, i * 50)).join(''), 'Семена в подписанном бумажном конверте')
  };
  illustrate('seed', n => (SEED[n] || SEED[1])(), Object.keys(SEED));

  register('roots', el => {
    el.innerHTML = h.head('Черенок в стакане', 'Модель укоренения: корешки появляются из погружённых узлов и растут примерно на полсантиметра в день в тепле.', true) +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage"><svg class="roots-svg" id="lab-rt-svg" viewBox="0 0 220 260" role="img" aria-label="Черенок базилика в стакане с водой"></svg></div>
        <div class="lab-controls">${h.rangeHtml('lab-rt-d', 'День', 0, 21, 1, 10)}${h.segHtml('lab-rt-t', 'Комната', [['18', '18 °C'], ['22', '22 °C'], ['26', '26 °C']], '22')}</div>
      </div>` + h.readHtml([['Длина корней', 'lab-rt-l'], ['Что делать', 'lab-rt-v', 'is-wide']]);
    const svg = $('#lab-rt-svg', el);
    let day = 10, temp = 22;
    const ON = { 18: 10, 22: 7, 26: 5 }, RATE = { 18: 0.35, 22: 0.5, 26: 0.6 };
    const ROOTS = [[-1, 0.9, 0], [1, 1, 1], [-1, 0.7, 2], [1, 0.8, 0.5], [-1, 0.6, 1.5], [1, 0.65, 2.5]];
    const leaf = (x, y, a, s) => `<use href="#pl-leaf" class="pl-leaf" style="fill:url(#pl-grad)" transform="translate(${x} ${y}) rotate(${a}) scale(${s})"/>`;
    const upd = () => {
      const L = Math.max(0, (day - ON[temp]) * RATE[temp]);
      let s = `<path class="rt-glass" d="M52 60 L60 246 Q61 252 68 252 H152 Q159 252 160 246 L168 60"/>`;
      s += `<path class="rt-water" d="M55.6 120 L60.6 245 Q61.4 249.5 68 249.5 H152 Q158.6 249.5 159.4 245 L164.4 120 Z"/>`;
      s += `<path class="rt-stem" d="M110 236 C 108 180 112 120 110 34"/>`;
      [[176, 1], [206, 0.8]].forEach(([y, k]) => {
        s += `<circle class="rt-node" cx="110" cy="${y}" r="3.2"/>`;
        ROOTS.forEach(([side, len, lag], i) => {
          const l = Math.max(0, L - lag * 0.25) * len * k * 11;
          if (l < 1) return;
          const cx = 110 + side * (6 + i * 1.5), ex = 110 + side * Math.min(44, l * 0.55 + 6), ey = y + Math.min(250 - y - 4, l * 0.85);
          s += `<path class="rt-root" d="M110 ${y} Q ${r1(cx + side * l * 0.3)} ${r1(y + l * 0.2)} ${r1(ex)} ${r1(ey)}"/>`;
        });
      });
      s += leaf(110, 96, -58, 0.42) + leaf(110, 96, 58, 0.42) + leaf(111, 64, -30, 0.3) + leaf(111, 64, 30, 0.3) + leaf(110, 38, -8, 0.18) + leaf(110, 38, 12, 0.16);
      s += `<line class="rt-wl" x1="56" x2="164" y1="120" y2="120"/>`;
      svg.innerHTML = s;
      set(el, 'lab-rt-l', L > 0 ? `${fmt(L)} см` : 'пока нет');
      set(el, 'lab-rt-v', day < ON[temp] - 2 ? 'Ждите: у основания идёт перестройка клеток, снаружи ничего не видно. Меняйте воду раз в 2–3 дня.' : L < 0.3 ? 'Вот-вот: в узлах набухают белые бугорки — зачатки корней.' : L < 2 ? 'Корешки растут. Сажать рано: подождите, пока будет 2–5 см.' : L <= 5 ? 'Пора сажать в грунт! 3–4 дня держите в тени под пакетом.' : 'Корни длинные и начинают путаться: сажайте, аккуратно расправив их.');
    };
    h.bindRange(el, 'lab-rt-d', v => `${v}-й`, v => { day = v; upd(); });
    h.bindPick(el, 'lab-rt-t', v => { temp = +v; upd(); });
    upd();
  });

  register('seedlife', el => {
    el.innerHTML = h.head('Срок жизни семян', 'Правила Харрингтона относительно хранения при 20 °C и влажности семян 10 %, когда базилик держит всхожесть около 4–5 лет.', true) +
      `<div class="lab-controls">${h.chipsHtml('lab-sl-p', 'Где храним', [['room', 'Шкаф в квартире'], ['fridge', 'Холодильник и силикагель'], ['warm', 'Тёплая кладовка']], 'room')}${h.rangeHtml('lab-sl-t', 'Температура', 0, 30, 1, 22)}${h.rangeHtml('lab-sl-m', 'Влажность семян', 5, 14, 0.5, 9)}</div>
       <div class="sl-scale"><i id="lab-sl-bar"></i><span style="left:0%">×¼</span><span style="left:25%">×1</span><span style="left:50%">×4</span><span style="left:75%">×16</span><span style="left:100%">×64</span></div>` +
      h.readHtml([['Множитель срока', 'lab-sl-x'], ['Примерно', 'lab-sl-y']]);
    let T = 22, M = 9;
    const P = { room: [22, 9], fridge: [5, 6], warm: [28, 12] };
    const upd = () => {
      const k = Math.pow(2, (20 - T) / 5) * Math.pow(2, 10 - M);
      $('#lab-sl-bar', el).style.width = `${clamp((Math.log2(k) + 2) / 8, 0.01, 1) * 100}%`;
      set(el, 'lab-sl-x', k >= 1 ? `× ${k >= 10 ? fmt0(k) : fmt(k)}` : `× ${fmt(k, 2)}`);
      const y = 4.5 * k;
      set(el, 'lab-sl-y', y > 50 ? 'десятки лет — условия семенного банка' : y < 1 ? `${fmt0(y * 12)} мес.` : `${fmt(y)} лет`);
    };
    const tr = h.bindRange(el, 'lab-sl-t', v => `${v} °C`, v => { T = v; upd(); });
    const mr = h.bindRange(el, 'lab-sl-m', v => `${fmt(v)} %`, v => { M = v; upd(); });
    h.bindPick(el, 'lab-sl-p', k => { tr.set(P[k][0]); mr.set(P[k][1]); });
    upd();
  });
})();
