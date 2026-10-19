  /* The check every two or three days: the numbers off the meters → what to do now, worst first. The limits are
     those of this chapter: solution 18–22 °C (24 °C — the rot threshold), pH 5.5–6.5, EC within a third of where it
     started, a fresh solution every 2–3 weeks in a bucket and every 6–8 weeks in a jar. */
  register('hcheck', el => {
    el.innerHTML = h.head('Проверка за две минуты', 'Впишите, что показали приборы, — инструмент скажет, что делать, начиная с самого срочного.') +
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
        ${h.rangeHtml('lab-hc-d', 'Дней со смены раствора', 0, 60, 1, 12)}
      </div>
      <ol class="hc-list" id="lab-hc-out" aria-live="polite"></ol>`;
    const v = { s: 'dwc', e0: 1.2, e: 1.4, p: 6.6, t: 23, d: 12 };
    const RANK = { bad: 0, warn: 1, ok: 2 };
    const check = () => {
      const out = [], add = (st, title, text) => out.push({ st, title, text });
      // temperature
      if (v.t > 24) add('bad', `Раствор ${fv(v.t)} °C — тепло для корней`, 'Выше 24 °C мало кислорода и раздолье для питиума. Уберите ёмкость от батареи и солнца, оберните светлым, положите в ведро замороженную бутылку воды; проверьте, работает ли компрессор.');
      else if (v.t > 22) add('warn', `Раствор ${fv(v.t)} °C — на верхней границе`, 'Пока терпимо, но следите за корнями: белые и упругие — хорошо, бурые и слизистые — меняйте раствор.');
      else if (v.t < 16) add('warn', `Раствор ${fv(v.t)} °C — холодно`, 'Корни берут питание медленнее, рост встаёт. Уберите ёмкость с холодного подоконника, подложите пенопласт.');
      else add('ok', `Температура ${fv(v.t)} °C — хорошо`, 'Кислорода в растворе достаточно, питиуму прохладно.');
      // pH
      if (v.p > 7) add('bad', `pH ${fmt(v.p, 1)} — высоко`, 'Железо, марганец и фосфор уходят из раствора: скоро пожелтеют молодые листья. pH‑минус по капле до 5,8–6,2.');
      else if (v.p > 6.5) add('warn', `pH ${fmt(v.p, 1)} — выше нормы`, 'Так ведёт себя раствор с нитратным азотом: корни подщелачивают его. Опустите до 5,8–6,2 pH‑минусом, по капле на литр.');
      else if (v.p < 5.2) add('bad', `pH ${fmt(v.p, 1)} — кисло`, 'Кальций и магний становятся недоступны, корни страдают. pH‑плюс по капле или свежий раствор; проверьте, не перелили ли кислоты.');
      else if (v.p < 5.5) add('warn', `pH ${fmt(v.p, 1)} — чуть кисловато`, 'Поднимите до 5,8 pH‑плюсом или долейте водопроводной воды: в ней есть бикарбонаты.');
      else add('ok', `pH ${fmt(v.p, 1)} — в норме`, 'Все элементы доступны. Следующий замер — через 2–3 дня.');
      // EC against where it started
      const r = v.e / v.e0;
      if (v.e > 2.2) add('bad', `EC ${fmt(v.e, 2)} — крепко для базилика`, 'Кончики листьев начнут подгорать. Долейте чистой воды до EC 1,2–1,6 или смените раствор.');
      else if (r > 1.3) add('warn', `EC выросла на ${fmt0((r - 1) * 100)} %`, 'Кусты пьют воду быстрее, чем берут соли, — так бывает в жару. Доливайте чистой водой, а не раствором.');
      else if (r < 0.7) add('warn', `EC упала на ${fmt0((1 - r) * 100)} %`, 'Соли вырабатываются быстрее воды. Долейте раствором половинной крепости или смените раствор.');
      else add('ok', `EC ${fmt(v.e, 2)} — держится`, 'Раствор работает: в нём столько солей, сколько нужно.');
      // age of the solution
      const life = v.s === 'dwc' ? [14, 21] : [42, 56];
      if (v.d > life[1]) add(v.s === 'dwc' ? 'bad' : 'warn', `Раствору ${v.d} ${h.plural(v.d, 'день', 'дня', 'дней')} — пора менять`, `В старом растворе копятся одни ионы и кончаются другие, а приборы этого не видят. Смените целиком и вымойте ёмкость.`);
      else if (v.d > life[0]) add('warn', `Раствору ${v.d} ${h.plural(v.d, 'день', 'дня', 'дней')}`, `Смена — в ближайшие ${life[1] - v.d} ${h.plural(life[1] - v.d, 'день', 'дня', 'дней')}.`);
      else add('ok', `Раствору ${v.d} ${h.plural(v.d, 'день', 'дня', 'дней')} — свежий`, `Менять через ${life[1] - v.d} ${h.plural(life[1] - v.d, 'день', 'дня', 'дней')}.`);
      return out.sort((a, b) => RANK[a.st] - RANK[b.st]);
    };
    const WORD = { bad: 'срочно', warn: 'скоро', ok: 'в порядке' };
    const upd = () => {
      const list = check();
      $('#lab-hc-out', el).innerHTML = list.map(x => `<li class="hc-item is-${x.st}"><span class="hc-st">${WORD[x.st]}</span><div><b>${h.nb(x.title)}</b><p>${h.nb(x.text)}</p></div></li>`).join('') +
        (list.every(x => x.st === 'ok') ? `<li class="hc-item is-all"><span class="hc-st">итог</span><div><b>Всё в порядке</b><p>${h.nb('Следующая проверка — через 2–3 дня.')}</p></div></li>` : '');
    };
    h.bindPick(el, 'lab-hc-s', x => { v.s = x; upd(); });
    h.bindRange(el, 'lab-hc-e0', x => `${fmt(x, 2)} мС/см`, x => { v.e0 = x; upd(); });
    h.bindRange(el, 'lab-hc-e', x => `${fmt(x, 2)} мС/см`, x => { v.e = x; upd(); });
    h.bindRange(el, 'lab-hc-p', x => fmt(x, 1), x => { v.p = x; upd(); });
    h.bindRange(el, 'lab-hc-t', x => h.nb(`${fv(x)} °C`), x => { v.t = x; upd(); });
    h.bindRange(el, 'lab-hc-d', x => `${fmt0(x)}`, x => { v.d = x; upd(); });
    upd();
  });
