  /* ================================================================== */
  /* NUTRIENTS: feeding plan                                             */
  /* ================================================================== */
  function initPlan() {
    const list = $('#plan-list');
    const dateIn = $('#plan-date');
    const weeks = $('#plan-weeks');
    if (!list || !dateIn || !weeks) return;
    const modeBtns = $$('[data-plan-mode]');
    let mode = 'pot';
    let items = [];
    dateIn.value = toISO(addDays(today(), -14));

    const build = (S, total) => {
      const end = addDays(S, total);
      const out = [];
      const push = (d, title, what, tag) => { if (d <= total) out.push({ date: addDays(S, d), title, what, tag }); };
      if (mode === 'hydro') {
        push(0, 'Проращивание', 'Кубики минваты или кокоса, чистая вода. Удобрения не нужны.', 'o');
        push(14, 'Перенос в систему', 'Раствор EC 0,6–0,8, pH 5,8–6,2. Корни наполовину в растворе.', 'p');
        push(28, 'Повышение концентрации', 'EC 1,0–1,2, pH 5,5–6,5. Проверяйте каждые 2–3 дня.', 'n');
        push(42, 'Активный рост', 'EC 1,2–1,4. Доливайте чистую воду, а не концентрат.', 'n');
        for (let d = 56; d <= total - 7; d += 14) push(d, 'Полная замена раствора', 'EC 1,2–1,6, pH 5,5–6,5, температура 18–22 °C.', 'k');
        return { out, end };
      }
      push(24, 'Первая подкормка', 'Комплексное удобрение для рассады, ¼ дозы с упаковки.', 'p');
      push(38, 'Вторая подкормка', 'Монокалийфосфат 0,3–0,5 г/л или комплексное ⅓ дозы — для корней.', 'p');
      const cycle = mode === 'pot'
        ? [['Подкормка для зелени', 'Комплексное удобрение «для зелени», ½ дозы.', 'n'], ['Подкормка для аромата', 'Калийная селитра 0,5 г/л.', 'k'], ['Органика', 'Жидкий биогумус по инструкции.', 'o']]
        : [['Подкормка для зелени', 'Нитроаммофоска 1–1,5 г/л или настой крапивы 1:10.', 'n'], ['Подкормка для аромата', 'Калийная селитра 1 г/л.', 'k'], ['Органика', 'Биогумус или настой крапивы 1:10.', 'o']];
      let startD, stepD;
      if (mode === 'garden') {
        const T = 56;
        push(T, 'Высадка в грунт', 'Только полив тёплой водой, без удобрений 7–10 дней.', 'o');
        push(T + 10, 'Подкормка для корней', 'Монокалийфосфат 1 г/л или гумат калия по инструкции.', 'p');
        startD = T + 24; stepD = 18;
      } else {
        startD = 52; stepD = 10;
      }
      let k = 0;
      for (let d = startD; d <= total - 16; d += stepD) {
        const c = cycle[k % cycle.length];
        push(d, c[0], c[1], c[2]);
        k += 1;
      }
      for (let d = mode === 'pot' ? 60 : 96; d <= total - 16; d += 30) {
        push(d + 3, mode === 'pot' ? 'Промывка и магний' : 'Магний по листу', mode === 'pot' ? 'Пролейте горшок чистой водой в объёме 2–3 горшков, через день — сульфат магния 1 г/л.' : 'Сульфат магния 1 г/л, опрыскивание вечером.', 'o');
      }
      push(total - 14, 'Финишная подкормка без азота', mode === 'pot' ? 'Сульфат калия 0,5 г/л — для аромата перед финальным сбором.' : 'Сульфат калия 1 г/л или зольный настой.', 'k');
      push(total, 'Финальный сбор', 'Срежьте всё для заготовок или укорените черенки для нового цикла.', 'o');
      out.sort((a, b) => a.date - b.date);
      return { out, end };
    };

    const TAG = { n: ['pt-n', 'азот'], k: ['pt-k', 'калий'], p: ['pt-p', 'фосфор, корни'], o: ['pt-o', 'уход'] };
    const render = () => {
      const S = fromISO(dateIn.value) || today();
      const total = clamp(parseInt(weeks.value, 10) || 20, 10, 30) * 7;
      $('#plan-weeks-val').textContent = String(Math.round(total / 7));
      const { out } = build(S, total);
      items = out;
      const now = today();
      let nextMarked = false;
      list.innerHTML = out.map(it => {
        const past = it.date < now;
        const next = !past && !nextMarked;
        if (next) nextMarked = true;
        const n = dayDiff(now, it.date);
        const rel = past ? 'прошло' : n === 0 ? 'сегодня' : `через ${n}\u00a0${plural(n, 'день', 'дня', 'дней')}`;
        return `<li class="plan-item${past ? ' is-past' : ''}${next ? ' is-next' : ''}">
          <div class="plan-date">${fd(it.date)}<small>${rel}</small></div>
          <div><h4>${it.title}<span class="plan-tag ${TAG[it.tag][0]}">${TAG[it.tag][1]}</span></h4><p>${nb(it.what)}</p></div>
        </li>`;
      }).join('');
    };
    modeBtns.forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.planMode;
      modeBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    [dateIn, weeks].forEach(el => el.addEventListener('input', render));
    $('#plan-copy').addEventListener('click', () => {
      copyText('План подкормок базилика\n\n' + items.map(it => `• ${fd(it.date).replace(/\u00a0/g, ' ')} — ${it.title}. ${it.what}`).join('\n'));
    });
    render();
  }

