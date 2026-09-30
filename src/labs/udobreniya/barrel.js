  const STAVES = [['light', 'Свет'], ['heat', 'Тепло'], ['water', 'Вода'], ['N', 'N'], ['P', 'P'], ['K', 'K'], ['Ca', 'Ca'], ['Mg', 'Mg'], ['Fe', 'Fe']];
  const BARREL_PRESETS = {
    summer: ['Лето на грядке', { light: 95, heat: 90, water: 82, N: 80, P: 85, K: 78, Ca: 90, Mg: 85, Fe: 90 }],
    winter: ['Зимний подоконник', { light: 22, heat: 82, water: 85, N: 90, P: 85, K: 80, Ca: 90, Mg: 85, Fe: 85 }],
    overN: ['Перекорм азотом', { light: 85, heat: 85, water: 80, N: 100, P: 70, K: 42, Ca: 78, Mg: 62, Fe: 80 }],
    cold: ['Холодная весна', { light: 72, heat: 28, water: 85, N: 70, P: 60, K: 80, Ca: 85, Mg: 80, Fe: 80 }],
    hard: ['Жёсткая вода', { light: 85, heat: 85, water: 80, N: 80, P: 72, K: 80, Ca: 96, Mg: 78, Fe: 30 }]
  };
  const BARREL_ADVICE = {
    light: 'Добавьте лампу или переставьте ближе к окну. Подкормки сейчас бесполезны: азот уйдёт в нитраты.',
    heat: 'Утеплите: в холодном грунте корни почти не берут азот и фосфор, органика не разлагается.',
    water: 'Наладьте полив: без воды не работают ни корни, ни устьица.',
    N: 'Подкормите азотом половинной дозой: листья светлеют снизу.',
    P: 'Нужен фосфор, особенно в холодном грунте: монокалийфосфат слабым раствором.',
    K: 'Не хватает калия: калийная селитра или сульфат калия.',
    Ca: 'Кальций: кальциевая селитра, проверьте испарение и влажность воздуха.',
    Mg: 'Магний: сульфат магния, раз в месяц.',
    Fe: 'Железо заблокировано: хелат железа и мягкая вода, проверьте pH.'
  };

  register('barrel', el => {
    el.innerHTML = h.head('Бочка Либиха', 'Вода держится до уровня самой короткой доски. Выберите ситуацию или тяните доски вверх и вниз.') +
      `<div class="lab-controls">${h.chipsHtml('lab-bar-p', 'Ситуация', Object.entries(BARREL_PRESETS).map(([k, v]) => [k, v[0]]), 'winter')}</div>
       <div class="lab-grid wide-stage">
        <div class="lab-chart" id="lab-bar-ch"></div>
        <div class="lab-controls">
          ${h.chipsHtml('lab-bar-s', 'Доска', STAVES.map(s => [s[0], s[1]]), 'light')}
          ${h.rangeHtml('lab-bar-v', 'Уровень доски', 5, 100, 1, 22)}
          <p class="barrel-verdict" id="lab-bar-out" aria-live="polite"></p>
        </div>
       </div>`;
    const vals = Object.assign({}, BARREL_PRESETS.winter[1]);
    let sel = 'light';
    const PAD = 20;
    const ch = h.chart($('#lab-bar-ch', el), {
      label: 'Бочка из девяти досок-факторов с уровнем воды',
      h: w => clamp(w * 0.7, 250, 330),
      draw(w, hh) {
        const bw = Math.min(w - PAD * 2, 380), x0 = (w - bw) / 2, top = 28, bottom = hh - 30;
        const sw = bw / STAVES.length, fs = r1(Math.min(11, sw / 3.3));
        const Y = v => r1(bottom - (bottom - top) * v / 100);
        const min = Math.min(...STAVES.map(s => vals[s[0]]));
        const limit = STAVES.find(s => vals[s[0]] === min)[0];
        let s = `<clipPath id="lab-bar-clip"><rect x="${r1(x0)}" y="${top - 30}" width="${r1(bw)}" height="${r1(bottom - top + 30)}"/></clipPath>`;
        s += `<rect class="barrel-water" x="${r1(x0 + 2)}" y="${Y(min)}" width="${r1(bw - 4)}" height="${r1(bottom - Y(min))}" clip-path="url(#lab-bar-clip)"/>`;
        s += `<path class="barrel-wave" d="M${r1(x0 + 2)} ${Y(min)} q ${r1(sw / 2)} -5 ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw)} 0 t ${r1(sw - 4)} 0"/>`;
        STAVES.forEach(([k, name], i) => {
          const x = x0 + i * sw;
          const isLim = k === limit, isSel = k === sel;
          s += `<rect class="stave${isLim ? ' is-limit' : ''}${isSel ? ' is-sel' : ''}" x="${r1(x + 1.5)}" y="${Y(vals[k])}" width="${r1(sw - 3)}" height="${r1(bottom - Y(vals[k]))}" rx="3" data-k="${k}"/>`;
          s += `<text class="stave-lbl${isLim ? ' is-limit' : ''}" x="${r1(x + sw / 2)}" y="${bottom + 16}" text-anchor="middle" style="font-size:${fs}px">${name}</text>`;
          if (isLim) s += `<path class="barrel-spill" d="M${r1(x + sw / 2)} ${Y(min) - 1} q 8 6 6 20 t -2 ${r1(bottom - Y(min) - 12)}"/>`;
        });
        [0.3, 0.72].forEach(f => { s += `<rect class="hoop" x="${r1(x0 - 3)}" y="${r1(bottom - (bottom - top) * f)}" width="${r1(bw + 6)}" height="6" rx="3"/>`; });
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        if (kind !== 'set') return;
        const bw = Math.min(w - PAD * 2, 380), x0 = (w - bw) / 2, top = 28, bottom = hh - 30;
        const i = Math.floor((x - x0) / (bw / STAVES.length));
        if (i < 0 || i >= STAVES.length) return;
        const k = STAVES[i][0];
        vals[k] = clamp(Math.round((bottom - y) / (bottom - top) * 100), 5, 100);
        sel = k; pickS.set(k); rng.input.value = vals[k]; $('#lab-bar-v-v', el).textContent = vals[k] + ' %';
        upd();
      }
    });
    const upd = () => {
      const min = Math.min(...STAVES.map(s => vals[s[0]]));
      const k = STAVES.find(s => vals[s[0]] === min);
      $('#lab-bar-out', el).innerHTML = `<b>Ограничивает: ${k[1] === 'N' || k[1].length < 3 ? k[1] : k[1].toLowerCase()} (${min} %).</b> ${BARREL_ADVICE[k[0]]}`;
      ch.redraw();
    };
    const pickS = h.bindPick(el, 'lab-bar-s', k => { sel = k; rng.input.value = vals[k]; $('#lab-bar-v-v', el).textContent = vals[k] + ' %'; ch.redraw(); });
    const rng = h.bindRange(el, 'lab-bar-v', v => v + ' %', v => { vals[sel] = v; upd(); });
    h.bindPick(el, 'lab-bar-p', k => { Object.assign(vals, BARREL_PRESETS[k][1]); rng.input.value = vals[sel]; $('#lab-bar-v-v', el).textContent = vals[sel] + ' %'; upd(); });
    upd();
  });
