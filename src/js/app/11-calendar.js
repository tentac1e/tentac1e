  /* ================================================================== */
  /* CALENDAR (wheel + timeline)                                         */
  /* ================================================================== */
  function initCalendar() {
    const presetSel = $('#cal-preset');
    const dateIn = $('#cal-date');
    if (!presetSel || !dateIn) return;
    const presetField = $('#cal-preset-field');
    const dateLabel = $('#cal-date-label');
    const season = $('#cal-season');
    const wheel = $('#cal-wheel');
    const tip = $('#wheel-tip');
    const legend = $('#cal-legend');
    const timeline = $('#cal-timeline');
    const modeBtns = $$('[data-mode]');

    presetSel.innerHTML = B.PRESETS.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const now = today();
    let mode = 'garden';
    let preset = 'temperate';
    let gardenDate = null;
    let homeDate = now;
    let plan = null;

    const presetLF = id => {
      const p = B.PRESETS.find(x => x.id === id);
      if (!p || !p.lf) return null;
      let d = new Date(now.getFullYear(), p.lf[0] - 1, p.lf[1]);
      if (addDays(d, -42) < now) d = new Date(now.getFullYear() + 1, p.lf[0] - 1, p.lf[1]);
      return d;
    };
    const autumnFrost = (lf, id) => {
      const p = B.PRESETS.find(x => x.id === id);
      if (p && p.af) return new Date(lf.getFullYear(), p.af[0] - 1, p.af[1]);
      const doy = dayDiff(new Date(lf.getFullYear(), 0, 1), lf);
      return addDays(lf, clamp(Math.round(300 - 2 * (doy - 60)), 90, 230));
    };
    const rel = (a, b) => {
      const end = b || a;
      if (end < now) return 'прошло';
      if (a <= now) return 'сейчас';
      const n = dayDiff(now, a);
      return `через ${n}\u00a0${plural(n, 'день', 'дня', 'дней')}`;
    };

    const gardenPlan = LF => {
      const S = addDays(LF, -49);
      const T = addDays(LF, 14);
      const AF = autumnFrost(LF, preset);
      return {
        events: [
          { a: addDays(LF, -56), b: addDays(LF, -42), icon: 'seed', key: true, title: 'Посев на рассаду', text: 'За 6–8 недель до последнего заморозка. Заделка 0,5 см, мини-парник при 22–25 °C.' },
          { a: addDays(S, 5), b: addDays(S, 10), icon: 'sprout', title: 'Всходы', text: 'Сразу снимите укрытие, свет 14–16 ч, температура 20–22 °C.' },
          { a: addDays(S, 14), b: addDays(S, 21), icon: 'pot', title: 'Пикировка', text: 'При 1–2 парах настоящих листьев — в стаканы по 200–300 мл.' },
          { a: addDays(S, 24), b: addDays(S, 28), icon: 'flask', title: 'Первая подкормка', text: 'Комплексное удобрение для рассады в ¼ дозы.' },
          { a: addDays(S, 35), b: addDays(S, 42), icon: 'scissors', title: 'Прищипывание рассады', text: 'При 3–4 парах листьев — над 2-й или 3-й парой.' },
          { a: addDays(T, -10), b: addDays(T, -1), icon: 'wind', title: 'Закаливание', text: 'Выносите на улицу, начиная с 1–2 часов в тени.' },
          { a: addDays(LF, 10), b: addDays(LF, 21), icon: 'garden', key: true, title: 'Высадка в грунт', text: 'Когда ночи теплее +10 °C, а почва прогрелась до +15 °C. В теплицу — на 1–2 недели раньше.' },
          { a: addDays(T, 10), b: addDays(T, 14), icon: 'flask', title: 'Подкормка после приживания', text: 'Монокалийфосфат или комплексное удобрение, половинная доза.' },
          { a: addDays(T, 21), b: addDays(T, 28), icon: 'leaf', key: true, title: 'Первый урожай', text: 'Срезайте верхушки над парой листьев, не больше трети куста.' },
          { a: addDays(T, 28), b: addDays(AF, -21), icon: 'scissors', title: 'Регулярные срезки', text: 'Каждые 1–2 недели. Удаляйте бутоны, подкармливайте после срезки.' },
          { a: addDays(AF, -35), b: addDays(AF, -21), icon: 'cup', title: 'Черенки на зиму', text: 'Укорените 3–5 верхушек в воде для подоконника.' },
          { a: addDays(AF, -14), b: AF, icon: 'snow', key: true, title: 'Финальный сбор и заготовки', text: 'До первых осенних заморозков срежьте всё. Дата заморозка ориентировочная.' }
        ],
        phases: [
          { cls: 'ph-seed', name: 'Проращивание', a: S, b: addDays(S, 8) },
          { cls: 'ph-young', name: 'Рассада', a: addDays(S, 8), b: addDays(T, -10) },
          { cls: 'ph-hard', name: 'Закаливание', a: addDays(T, -10), b: T },
          { cls: 'ph-grow', name: 'Рост', a: T, b: addDays(T, 21) },
          { cls: 'ph-cut', name: 'Урожай', a: addDays(T, 21), b: AF }
        ],
        head: `Сезон ${T.getFullYear()}: высадка около ${fd(T)}, урожай до ${fd(AF)}`,
        center: ['высадка', fd(T), `урожай до ${fd(AF)}`]
      };
    };

    const homePlan = S => {
      const H = addDays(S, 55);
      const dark = [S, addDays(S, 30), addDays(S, 60)].some(d => d.getMonth() >= 9 || d.getMonth() <= 2);
      return {
        events: [
          { a: S, icon: 'seed', key: true, title: 'Посев', text: '2–3 семени в горшок, заделка 0,5 см, под крышку при 22–25 °C.' },
          { a: addDays(S, 5), b: addDays(S, 10), icon: 'sprout', title: 'Всходы', text: 'Сразу под лампу или на самое светлое окно, 14–16 ч света.' },
          { a: addDays(S, 14), b: addDays(S, 21), icon: 'pot', title: 'Прореживание', text: 'Оставьте одно сильное растение на горшок 1,5–2 л или три на 3–5 л.' },
          { a: addDays(S, 24), b: addDays(S, 28), icon: 'flask', title: 'Первая подкормка', text: 'Комплексное удобрение в ¼ дозы, дальше — раз в 10–14 дней.' },
          { a: addDays(S, 35), b: addDays(S, 45), icon: 'scissors', key: true, title: 'Первое прищипывание', text: 'При 3–4 парах листьев — над 2-й или 3-й парой.' },
          { a: addDays(S, 35), b: addDays(S, 42), icon: 'seed', title: 'Подсев новой партии', text: 'Для непрерывного урожая сейте новый горшок каждые 4–6 недель.' },
          { a: addDays(S, 50), b: addDays(S, 60), icon: 'leaf', key: true, title: 'Первый урожай', text: 'Срезайте верхушки над парой листьев, не больше трети куста.' },
          { a: addDays(S, 60), b: addDays(S, 110), icon: 'scissors', title: 'Регулярные срезки', text: 'Каждые 1–2 недели. Подкормка после срезки, промывка грунта раз в месяц.' },
          { a: addDays(S, 100), b: addDays(S, 130), icon: 'cup', title: 'Обновление куста', text: 'Куст стареет и деревенеет: укорените черенки или пересейте.' }
        ],
        phases: [
          { cls: 'ph-seed', name: 'Проращивание', a: S, b: addDays(S, 8) },
          { cls: 'ph-young', name: 'Сеянцы', a: addDays(S, 8), b: addDays(S, 35) },
          { cls: 'ph-grow', name: 'Рост', a: addDays(S, 35), b: addDays(S, 55) },
          { cls: 'ph-cut', name: 'Урожай', a: addDays(S, 55), b: addDays(S, 120) }
        ],
        head: `Посев ${fd(S)} → первый урожай около ${fd(H)}` + (dark ? '. В эти месяцы без лампы не обойтись.' : ''),
        center: ['первый урожай', fd(H), `посев ${fd(S)}`]
      };
    };

    /* wheel geometry */
    const C = 160;
    const yearFrac = d => {
      const start = new Date(d.getFullYear(), 0, 1);
      const days = (new Date(d.getFullYear() + 1, 0, 1) - start) / 864e5;
      return ((d - start) / 864e5) / days;
    };
    const pt = (frac, r) => {
      const a = frac * Math.PI * 2 - Math.PI / 2;
      return [C + r * Math.cos(a), C + r * Math.sin(a)];
    };
    const arcPath = (a, b, r) => {
      const f0 = yearFrac(a);
      let sweep = dayDiff(a, b) / 365;
      sweep = clamp(sweep, 0.004, 0.995);
      const f1v = f0 + sweep;
      const [x0, y0] = pt(f0, r);
      const [x1, y1] = pt(f1v, r);
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };

    const drawWheel = () => {
      const R = 106;
      let s = `<circle class="w-track" cx="${C}" cy="${C}" r="${R}" stroke-width="24"/>`;
      for (let m = 0; m < 12; m++) {
        const f = m / 12;
        const [x0, y0] = pt(f, 122);
        const [x1, y1] = pt(f, 132);
        s += `<line class="w-tick" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>`;
        const [lx, ly] = pt(f + 1 / 24, 146);
        s += `<text class="w-month" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${MONTHS_SHORT[m]}</text>`;
      }
      plan.phases.forEach((p, i) => {
        s += `<path class="w-arc ${p.cls}-c" d="${arcPath(p.a, addDays(p.b, -1), R)}" stroke-width="24" data-i="${i}" tabindex="0" role="img" aria-label="${p.name}: ${fr(p.a, p.b)}"/>`;
      });
      plan.events.filter(e => e.key).forEach(e => {
        const [x, y] = pt(yearFrac(e.a), 127);
        s += `<circle class="w-ev is-key" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/>`;
      });
      const [tx, ty] = pt(yearFrac(now), 90);
      const [tx2, ty2] = pt(yearFrac(now), 134);
      s += `<line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" style="stroke: var(--danger)" stroke-width="2" stroke-linecap="round"/>`;
      s += `<circle class="w-today" cx="${tx2.toFixed(1)}" cy="${ty2.toFixed(1)}" r="5"><title>Сегодня, ${fd(now)}</title></circle>`;
      s += `<text class="w-center-a" x="${C}" y="${C - 22}" text-anchor="middle">${plan.center[0]}</text>`;
      s += `<text class="w-center-b" x="${C}" y="${C + 8}" text-anchor="middle">${plan.center[1]}</text>`;
      s += `<text class="w-center-c" x="${C}" y="${C + 30}" text-anchor="middle">${plan.center[2]}</text>`;
      wheel.innerHTML = s;
    };

    const showTip = (i, evt) => {
      const p = plan.phases[i];
      if (!p) return;
      const wrap = wheel.parentElement.getBoundingClientRect();
      const box = evt.target.getBoundingClientRect();
      const x = (evt.clientX || box.left + box.width / 2) - wrap.left;
      const y = (evt.clientY || box.top + box.height / 2) - wrap.top;
      tip.innerHTML = `<b>${p.name}</b><div>${fr(p.a, p.b)}</div><div class="muted">${dayDiff(p.a, p.b)}\u00a0${plural(dayDiff(p.a, p.b), 'день', 'дня', 'дней')}</div>`;
      tip.style.left = `${clamp(x, 70, wrap.width - 70)}px`;
      tip.style.top = `${y}px`;
      tip.hidden = false;
    };
    wheel.addEventListener('pointermove', e => { const a = e.target.closest('.w-arc'); if (a) showTip(+a.dataset.i, e); else tip.hidden = true; });
    wheel.addEventListener('pointerleave', () => { tip.hidden = true; });
    wheel.addEventListener('focusin', e => { const a = e.target.closest('.w-arc'); if (a) showTip(+a.dataset.i, e); });
    wheel.addEventListener('focusout', () => { tip.hidden = true; });

    const render = () => {
      const isGarden = mode === 'garden';
      presetField.hidden = !isGarden;
      dateLabel.textContent = isGarden ? 'Последний весенний заморозок' : 'Дата посева';
      let base = isGarden ? gardenDate : homeDate;
      if (!base) base = isGarden ? presetLF(preset) : now;
      dateIn.value = toISO(base);
      plan = isGarden ? gardenPlan(base) : homePlan(base);
      plan.events.sort((x, y) => x.a - y.a);
      season.textContent = plan.head;
      drawWheel();
      legend.innerHTML = plan.phases.map(p => `<li><i class="${p.cls}"></i>${p.name}: ${fr(p.a, p.b)}</li>`).join('') + `<li><i class="today"></i>сегодня, ${fd(now)}</li>`;
      timeline.innerHTML = plan.events.map(ev => {
        const r = rel(ev.a, ev.b);
        return `
        <li class="${r === 'сейчас' ? 'is-now' : ''}">
          <div class="tl-date">${fr(ev.a, ev.b)}<small>${r}</small></div>
          <div class="tl-mark"><span class="tl-dot${ev.key ? ' is-key' : ''}">${icon(ev.icon)}</span></div>
          <div class="tl-body"><h4>${ev.title}</h4><p>${nb(ev.text)}</p></div>
        </li>`;
      }).join('');
    };

    modeBtns.forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      modeBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    presetSel.addEventListener('change', () => {
      preset = presetSel.value;
      if (preset !== 'custom') gardenDate = null;
      render();
    });
    dateIn.addEventListener('change', () => {
      const d = fromISO(dateIn.value);
      if (!d) return;
      if (mode === 'garden') { gardenDate = d; preset = 'custom'; presetSel.value = 'custom'; } else { homeDate = d; }
      render();
    });
    $('#cal-copy').addEventListener('click', () => {
      const text = plan.head + '\n\n' + plan.events.map(e => `• ${fr(e.a, e.b).replace(/\u00a0/g, ' ')} — ${e.title}. ${e.text}`).join('\n');
      copyText(text);
    });
    presetSel.value = preset;
    render();
  }

