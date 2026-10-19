  /* The oxygen of a tank once the air pump stops: dC/dt = k·(Cs − C) − D. Cs — saturation at the temperature
     (doAt, o2.js); k — how fast air gets in (pump on: a few per hour, still water: a few hundredths); D — the use
     by the roots (grows with the bushes, Q10 = 2) and by the microbes in the water. Shown as the tank itself:
     the blue dots are the oxygen, fewer as the hours go; beside it the hours it lasts and where it stands now. */
  const O2B = {
    bucket: { name: 'ведро, 4 куста', v: 15, n: 4, on: 4, off: 0.04 },
    jar: { name: 'банка, 1 куст', v: 3, n: 1, on: 6, off: 0.06 }
  };
  const O2B_AGE = { small: { name: 'сеянцы', w: 3 }, mid: { name: 'растут', w: 6 }, big: { name: 'большие кусты', w: 10 } };
  register('o2box', el => {
    el.innerHTML = h.head('Если выключить компрессор', 'Синие точки — кислород в растворе. Компрессор выключили: двигайте время или прокрутите сутки и смотрите, как его становится меньше. Расход корнями — условный, растёт с размером кустов и с теплом.', true) +
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
      return ill.svg(W, Hh, g, `Ведро в разрезе: ${on ? 'компрессор работает' : `компрессор выключен ${fmt(H)} ч`}, кислорода ${fmt(c)} мг на литр`);
    };
    let phase = 0;
    const paint = () => {
      const st = state(), c = st.at(H);
      $('#lab-o2b-pic', el).innerHTML = pic(c, phase);
      return { st, c };
    };
    const upd = () => {
      const { st, c } = paint();
      set(el, 'lab-o2b-hero', hyHero(st.t4 == null || st.t4 > 24 ? 'больше суток' : st.t4 <= 0 ? 'нет запаса' : h.nb(`≈ ${fmt0(Math.max(1, Math.round(st.t4)))} ч`), 'столько корни продержатся без пузырей, пока кислорода не станет совсем мало'));
      const s = c >= 6 ? 'good' : c >= 4 ? 'warn' : 'bad';
      set(el, 'lab-o2b-now', hyGauge({ label: H ? `Через ${h.nb(fv(H) + ' ч')}` : 'Сейчас', value: h.nb(`${fmt(c)} мг/л`), state: s, word: { good: 'корням хорошо', warn: 'на грани', bad: 'корням душно' }[s], v: c, max: 12, ticks: [4, 6] }));
      set(el, 'lab-o2b-v', h.nb(st.t4 == null || st.t4 > 24 ? 'Кусты маленькие или вода прохладная: сутки без компрессора они переживут.'
        : st.t4 > 8 ? 'Ночь без электричества не страшна. Если отключение дольше — опустите уровень раствора, чтобы верх корней оказался в воздухе.'
          : 'Запаса — на вечер. Большие кусты в тёплой воде без пузырей задыхаются быстро: при отключении опустите уровень, чтобы верх корней оказался в воздухе, и уберите ёмкость с тепла.'));
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
