  /* «Лист-лакмус»: anthocyanin of a purple leaf as a pH indicator. The model «Фиолетовый базилик и pH» (chapter Вкус)
     gives the colours: water about pH 7, vinegar about 3, baking soda about 8; the reader picks the colour of each glass */
  register('exlitmus', el => experiment(el, {
    id: 'litmus',
    note: 'Краска фиолетового листа меняет цвет с кислотностью. Модель «Фиолетовый базилик и pH» знает, каким должен стать каждый стакан, — сравните со своими.',
    fields: [{ k: 'ph', label: 'Цвет настоя', type: 'color' }],
    photo: true,
    unit: 'h',
    legend: false,
    // three glasses: the colour the model expects and the one the reader saw
    draw(host, run) {
      const EXPECT = [7, 3, 8];
      const last = g => { const r = run.recs.filter(x => x.g === g && x.v.ph !== undefined).sort((a, b) => b.at - a.at)[0]; return r ? r.v.ph : null; };
      const groups = window.BASIL.EXPERIMENTS.find(x => x.id === 'litmus').groups;
      host.innerHTML = `<div class="exp-litmus" role="img" aria-label="Цвет настоя: что ждёт модель и что получилось">
        <span></span><b>ждёт модель</b><b>у вас</b>
        ${groups.map((g, i) => { const v = last(i); return `<span class="exp-lt-g">${esc(g)}</span><i class="exp-lt-sw" style="background:var(--ph-${EXPECT[i]})"><small>pH ≈ ${EXPECT[i]}</small></i>${v === null ? '<i class="exp-lt-sw is-empty"><small>ещё нет</small></i>' : v ? `<i class="exp-lt-sw" style="background:var(--ph-${v})"><small>как pH ${v}</small></i>` : '<i class="exp-lt-sw is-none"><small>не окрасился</small></i>'}`; }).join('')}
      </div>`;
    },
    verdict(run) {
      const last = g => { const r = run.recs.filter(x => x.g === g && x.v.ph !== undefined).sort((a, b) => b.at - a.at)[0]; return r ? r.v.ph : null; };
      const [w, a, b] = [0, 1, 2].map(last);
      if (w === null || a === null || b === null) return '<p>Запишите цвет всех трёх стаканов — гид сравнит их с моделью.</p>';
      if (!w && !a && !b) return h.nb('<p>Настой не окрасился — значит, лист был зелёным: антоцианов в нём почти нет, и показывать нечего. Возьмите фиолетовый сорт: краска есть только в нём.</p>');
      if (a < w && w <= b) return h.nb(`<p><b>Работает как лакмус.</b> Уксус дал цвет как при pH около ${a}, вода — около ${w}, сода — около ${b}; модель ждала около 3, 7 и 8. Молекула антоциана меняет форму вместе с кислотностью: в кислоте она красный заряженный катион, в нейтральной воде — фиолетовая, в щёлочи синеет и зеленеет.</p>`);
      return h.nb('<p>Цвета не выстроились по кислотности: возможно, настой слабый или уксуса и соды мало. Добавьте ещё по ложке, подождите минуту и запишите снова.</p>');
    }
  }));
