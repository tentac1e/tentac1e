  /* A Kratky jar week by week: the bush drinks more as its leaves grow (about 0.012·e^(0.38·week) litres a day
     under a lamp, less on a window, more in the sun), the level falls and the air gap under the lid grows.
     Illustrative: a real bush drinks more in heat and dry air. Shown as the jar itself, how much is left in it
     and how long it lasts. */
  const KR_LIGHT = { window: { name: 'окно', k: 0.6 }, lamp: { name: 'лампа', k: 1 }, sun: { name: 'солнечный балкон', k: 1.5 } };
  register('kratky', el => {
    el.innerHTML = h.head('Хватит ли банки', 'Куст растёт и пьёт всё больше, уровень падает, воздушный зазор растёт. Модель условная; в жару и сухой воздух куст пьёт быстрее.', true) +
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
      return ill.svg(140, 190, Rh.paper(140, 190) + Rh.ground(y, 140, 190) + j.svg + plant, `Банка ${fv(V)} л на неделе ${fmt0(W)}: раствора ${fmt(left(W))} л`);
    };
    const upd = () => {
      $('#lab-kr-jar', el).innerHTML = jarSvg();
      const e = endWeek(), share = left(W) / fill();
      set(el, 'lab-kr-hero', hyHero(e == null || e > 8 ? 'на весь срок' : h.nb(`≈ ${fmt0(e)} ${h.plural(Math.round(e), 'неделю', 'недели', 'недель')}`), 'хватит этой банки при таком свете, без долива'));
      const s = share > 0.4 ? 'good' : share > 0.15 ? 'warn' : 'bad';
      set(el, 'lab-kr-now', hyGauge({ label: `Неделя ${W % 1 ? fmt(W, 2) : fmt0(W)}`, value: `осталось ${fmt0(share * 100)} %`, state: s, word: { good: 'хватает', warn: 'скоро кончится', bad: 'почти пусто' }[s], v: share, max: 1 }));
      set(el, 'lab-kr-tip', h.nb(e != null && e < 5
        ? `Банки не хватит до первого большого среза. Возьмите банку побольше — или, когда раствор опустится до трети, долейте раствор половинной крепости, только до половины банки.`
        : e != null && e < 8
          ? 'К концу срока банка опустеет. Тогда смените раствор целиком или переселите куст в ведро.'
          : 'Банки хватит на весь срок: просто смотрите, чтобы корни внизу оставались в растворе.'));
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
