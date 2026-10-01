  /* ================================================================== */
  /* MY BASIL: the block on the home page and the sheet of one bush      */
  /* ================================================================== */
  const ago = (d, day) => { const n = dayDiff(d, day); return n <= 0 ? 'сегодня' : n === 1 ? 'вчера' : daysWord(n) + ' назад'; };
  // when a task is due, said shortly: «просрочено на 3 дня», «до 12 октября», «в четверг»
  const WEEKDAY = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
  function taskWhen(t, day) {
    if (t.state === 'late') return 'просрочено на ' + daysWord(dayDiff(t.once ? t.to : t.due, day));
    if (t.state === 'now') return !t.once || dayDiff(day, t.to) <= 0 ? 'сегодня' : dayDiff(t.from, t.to) > 40 ? 'в эти месяцы' : 'сейчас, до ' + fd(t.to);
    const n = dayDiff(day, t.due);
    return n === 1 ? 'завтра' : n < 7 ? WEEKDAY[t.due.getDay()] : fd(t.due);
  }
  const plantPic = (p, day) => { const v = gardenVariety(p); return `<span class="g-pic" data-leaf="${v ? v.leaf : 'green'}">${miniPlant(plantStage(p, day).pic)}</span>`; };
  const plantMeta = (p, day) => {
    const v = gardenVariety(p), st = plantStage(p, day);
    const start = B.GARDEN.starts.find(s => s.id === p.start);
    return [v && v.name !== p.name ? `«${esc(v.name)}»` : '', `${st.age + 1}-й день`, st.word, start ? start.short : ''].filter(Boolean).join(' · ');
  };
  function taskHtml(p, t, day) {
    return `<li class="g-task is-${t.state}">
      <div class="g-task-t"><b>${esc(t.title)}</b><small>${taskWhen(t, day)}</small><p>${nb(t.text)}</p></div>
      <div class="g-task-a"><a class="g-how" href="#${t.link}">Как?</a><button class="g-done" type="button" data-plant="${p.id}" data-task="${t.key}">${icon('check')}<span>Сделано</span></button></div>
    </li>`;
  }
  const notesHtml = p => `<div class="g-notes">${B.GARDEN.notes.map(n => `<button class="g-note" type="button" data-plant="${p.id}" data-note="${n.k}">${icon(n.icon)}<span>${n.name}</span></button>`).join('')}</div>`;
  // shared: the lamp is one for the whole windowsill, so on the home page it is asked once for all bushes
  const shared = t => /^light-/.test(t.key);
  function weekHtml(p, day, common) {
    const w = plantWeek(p, day);
    if (common) w.now = w.now.filter(t => !shared(t));
    const water = lastNote(p, 'water');
    return (w.now.length ? `<ul class="g-tasks">${w.now.map(t => taskHtml(p, t, day)).join('')}</ul>` : `<p class="g-free">На этой неделе дел по плану нет. Поливайте, когда верхние 1–2&nbsp;см грунта сухие.</p>`) +
      (w.next ? `<p class="g-next">Дальше: ${esc(w.next.title.charAt(0).toLowerCase() + w.next.title.slice(1))} — ${fd(w.next.due)}</p>` : '') +
      notesHtml(p) + `<p class="g-water">${water ? 'Полит ' + ago(water, day) + '.' : 'Полив ещё не отмечен.'} <a href="#uhod-poliv">Как понять, что пора</a></p>`;
  }
  function gardenCard(p, day) {
    return `<article class="g-card" data-plant-card="${p.id}">
      <div class="g-top">${plantPic(p, day)}<div class="g-id"><h3><button class="g-open" type="button" data-plant-open="${p.id}">${esc(p.name)}</button></h3><p>${plantMeta(p, day)}</p></div></div>
      ${weekHtml(p, day, true)}
    </article>`;
  }

  // the home page: the week of every bush, or an invitation to add the first one
  function renderGardenHome() {
    const box = $('#garden-home');
    if (!box) return;
    const day = today(), [mon, sun] = weekOf(day);
    const { plants } = gardenLoad();
    const keep = `<p class="g-keep"><button type="button" class="g-link" data-garden-export>Сохранить копию</button><button type="button" class="g-link" data-garden-import>Загрузить копию</button><span>Кусты хранятся только в этом браузере. Safari стирает данные сайта, который не открывали неделю, — копия в файле их сбережёт.</span></p>`;
    if (!plants.length) {
      box.innerHTML = `<div class="g-empty card">
        <span class="g-pic g-pic-big" data-leaf="green">${miniPlant('harvest')}</span>
        <div><h2 id="moy-h">Мой <em>базилик</em></h2>
        <p>Добавьте свой куст — гид подскажет, что делать с ним на этой неделе: когда прищипнуть, подкормить и срезать.</p>
        <div class="g-starts">${B.GARDEN.starts.filter(s => s.id !== 'seedling').map(s => `<button class="chip" type="button" data-garden-add="${s.id}">${icon(s.id === 'seed' ? 'seed' : s.id === 'shop' ? 'bag' : 'cup')}${s.id === 'shop' ? 'Купил горшок в магазине' : s.id === 'cutting' ? 'Укоренил черенок' : s.name}</button>`).join('')}</div>
        <p class="g-keep"><button type="button" class="g-link" data-garden-import>Загрузить копию</button></p></div>
      </div>`;
      return;
    }
    const common = plants.map(p => plantWeek(p, day).now.find(shared)).filter(Boolean)[0];
    box.innerHTML = `<div class="block-head"><h2 id="moy-h">Мой <em>базилик</em></h2><p>На этой неделе · ${fr(mon, sun)}</p></div>
      ${common ? `<ul class="g-tasks g-common">${taskHtml({ id: '*' }, Object.assign({}, common, { title: common.title + ' для всех кустов на окне' }), day)}</ul>` : ''}
      <div class="g-list">${plants.map(p => gardenCard(p, day)).join('')}</div>
      <div class="g-foot"><button class="btn btn-ghost btn-small" type="button" data-garden-add="seed">${icon('sprout')}Добавить куст</button>${keep}</div>`;
    fixLinks(box);
  }

  /* ---------------- the sheet of one bush ---------------- */
  let gardenOpen = null; // { id } of the bush in the sheet, or { form, id? }
  function varietyOptions(sel) {
    return `<option value="">Не знаю</option>` + B.VARIETY_TYPES.map(t => {
      const vs = B.VARIETIES.filter(v => v.type === t.id);
      return vs.length ? `<optgroup label="${esc(t.name)}">${vs.map(v => `<option${v.name === sel ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</optgroup>` : '';
    }).join('');
  }
  function renderGardenForm(p) {
    const G = B.GARDEN;
    const seg = (name, list, cur) => `<div class="seg g-seg g-seg-${list.length}" role="group" aria-labelledby="g-${name}-l">${list.map(x => `<button type="button" data-g-${name}="${x.id}" aria-pressed="${x.id === cur}">${x.name}</button>`).join('')}</div>`;
    const startDef = G.starts.find(s => s.id === p.start) || G.starts[0];
    return `<form class="g-form" id="g-form" novalidate>
      <div class="field"><label for="g-name">Как назовём</label><input type="text" id="g-name" maxlength="40" autocomplete="off" value="${esc(p.name || '')}" placeholder="Например, гвоздичный на кухне"></div>
      <div class="field"><label for="g-variety">Сорт</label><select id="g-variety">${varietyOptions(p.variety)}</select></div>
      <div class="field"><span class="label" id="g-start-l">С чего начали</span>${seg('start', G.starts, p.start)}</div>
      <div class="field"><span class="label" id="g-place-l">Где растёт</span>${seg('place', G.places, p.place)}</div>
      <div class="field" id="g-preset-f"${p.place === 'home' ? ' hidden' : ''}><label for="g-preset">Климат — от него сроки высадки и осенних заморозков</label><select id="g-preset">${B.PRESETS.filter(x => x.lf).map(x => `<option value="${x.id}"${x.id === (p.preset || 'temperate') ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select><small class="field-note" id="g-cities">Например, ${esc(B.PRESETS.find(x => x.id === (p.preset || 'temperate')).cities)}</small></div>
      <div class="field"><label for="g-date" id="g-date-l">${startDef.date}</label><input type="date" id="g-date" value="${p.date || toISO(today())}" max="${toISO(addDays(today(), 60))}"></div>
      <div class="g-form-a"><button class="btn btn-primary btn-small" type="submit">${icon('check')}Сохранить</button><button class="btn btn-ghost btn-small" type="button" data-g-cancel>Отмена</button></div>
    </form>`;
  }
  const NOTE_NAMES = { water: 'Полил', feed: 'Подкормил', pinch: 'Прищипнул', cut: 'Срезал', buds: 'Убрал бутоны', flush: 'Промыл грунт', note: 'Заметка' };
  function renderGardenPlant(p) {
    const day = today(), v = gardenVariety(p);
    const all = plantTasks(p, day);
    const STATE = { done: 'сделано', before: 'до дневника', missed: 'пропущено', late: 'просрочено', now: 'сейчас', soon: '' };
    const plan = all.filter(t => t.once).map(t => `<li class="g-step is-${t.state}"><span class="g-step-d">${t.state === 'done' ? fd(t.done) : fr(t.from, t.to)}</span><span class="g-step-t">${esc(t.title)}${STATE[t.state] ? `<small>${STATE[t.state]}</small>` : ''}</span></li>`).join('') +
      all.filter(t => t.repeat).map(t => `<li class="g-step is-repeat"><span class="g-step-d">${fd(t.due)}</span><span class="g-step-t">${esc(t.title)}<small>и дальше по кругу</small></span></li>`).join('');
    const tasks = Object.fromEntries(all.map(t => [t.key, t.title]));
    const log = (p.log || []).map((e, i) => Object.assign({ i, date: fromISO(e.d) }, e)).filter(e => e.date).sort((a, b) => b.date - a.date || b.i - a.i);
    const grams = log.reduce((s, e) => s + (e.k === 'cut' && +e.g > 0 ? +e.g : 0), 0);
    const what = e => (e.k === 'task' ? 'Сделано: ' + esc((tasks[e.task] || 'дело по плану').toLowerCase()) : (NOTE_NAMES[e.k] || 'Заметка') + (e.task && tasks[e.task] ? ` (${esc(tasks[e.task].toLowerCase())})` : '')) + (e.k === 'cut' && +e.g > 0 ? `, ${+e.g} г` : '') + (e.t ? ` — ${esc(e.t)}` : '');
    return `<div class="g-sheet">
      <div class="g-top">${plantPic(p, day)}<div class="g-id"><h3>${esc(p.name)}</h3><p>${plantMeta(p, day)}</p></div><button class="btn btn-ghost btn-small g-edit" type="button" data-g-edit>Изменить</button></div>
      ${v ? `<div class="callout"><svg class="ico"><use href="#i-leaf"/></svg><p><b>«${esc(v.name)}».</b> ${nb(v.care)}</p></div>` : ''}
      <section class="g-sec"><h4>На этой неделе</h4>${weekHtml(p, day)}</section>
      <section class="g-sec"><h4>План куста</h4><ol class="g-plan">${plan}</ol></section>
      <section class="g-sec"><h4>Дневник${grams ? `<small>собрано ${grams} г</small>` : ''}</h4>
        <form class="g-log-form" id="g-log-form">
          <select id="g-log-k" aria-label="Что сделали">${['water', 'feed', 'pinch', 'cut', 'buds', 'flush', 'note'].map(k => `<option value="${k}">${NOTE_NAMES[k]}</option>`).join('')}</select>
          <input type="date" id="g-log-d" value="${toISO(day)}" max="${toISO(day)}" aria-label="Когда">
          <input type="number" id="g-log-g" min="0" max="5000" step="1" inputmode="numeric" placeholder="граммы" aria-label="Сколько граммов срезали" hidden>
          <input type="text" id="g-log-t" maxlength="120" placeholder="Заметка, если нужна" aria-label="Заметка">
          <button class="btn btn-ghost btn-small" type="submit">Записать</button>
        </form>
        ${log.length ? `<ul class="g-log">${log.map(e => `<li><span class="g-log-d">${fd(e.date)}</span><span>${what(e)}</span><button class="g-log-x" type="button" data-log-del="${e.i}" aria-label="Удалить запись">${icon('close')}</button></li>`).join('')}</ul>` : '<p class="muted g-log-empty">Записей пока нет: отмечайте «Сделано» и «Полил» — гид будет считать от них.</p>'}
      </section>
      <p class="g-del-row"><button class="g-link g-del" type="button" data-g-del>Удалить куст</button></p>
    </div>`;
  }
  function renderGardenSheet() {
    const box = $('#garden-detail'), title = $('#sheet-garden-h');
    if (!box || !gardenOpen) return;
    const { plants } = gardenLoad();
    const p = gardenOpen.id && plants.find(x => x.id === gardenOpen.id);
    if (gardenOpen.form) {
      title.textContent = p ? 'Изменить куст' : 'Новый куст';
      box.innerHTML = renderGardenForm(p || gardenOpen.draft);
    } else if (p) {
      title.textContent = 'Мой куст';
      box.innerHTML = renderGardenPlant(p);
    } else {
      gardenOpen = null;
      closeSheet($('#sheet-garden'));
      return;
    }
    fixLinks(box);
  }
  function openGarden(state) {
    // over another sheet (a variety card): that one goes away at once
    $$('dialog.sheet[open]').forEach(d => { if (d.id !== 'sheet-garden') closeSheet(d, true); });
    gardenOpen = state;
    renderGardenSheet();
    openSheet('sheet-garden');
    const sc = $('#sheet-garden .sheet-inner');
    if (sc) sc.scrollTop = 0;
  }

  /* ---------------- a copy in a file ---------------- */
  function exportGarden() {
    const data = JSON.stringify(Object.assign(gardenLoad(), { saved: toISO(today()) }), null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = `moy-bazilik-${toISO(today())}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('Копия сохранена в файл');
  }
  // a copy read back: only bushes that make sense, and only after a yes
  function importGarden(text) {
    let s = null;
    try { s = JSON.parse(text); } catch (e) { s = null; }
    const starts = B.GARDEN.starts.map(x => x.id), places = B.GARDEN.places.map(x => x.id);
    const plants = (s && Array.isArray(s.plants) ? s.plants : []).filter(p => p && fromISO(p.date) && starts.includes(p.start)).map(p => ({
      id: String(p.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(0, 24),
      name: String(p.name || 'Мой базилик').slice(0, 40), variety: String(p.variety || '').slice(0, 40),
      start: p.start, place: places.includes(p.place) ? p.place : 'home', preset: String(p.preset || 'temperate').slice(0, 16),
      date: p.date, added: fromISO(p.added) ? p.added : p.date,
      log: (Array.isArray(p.log) ? p.log : []).filter(e => e && fromISO(e.d) && typeof e.k === 'string').map(e => {
        const o = { d: e.d, k: e.k.slice(0, 12) };
        if (e.task) o.task = String(e.task).slice(0, 24);
        if (+e.g > 0) o.g = Math.min(5000, Math.round(+e.g));
        if (e.t) o.t = String(e.t).slice(0, 120);
        return o;
      })
    }));
    if (!plants.length) { toast('В файле нет кустов'); return; }
    const n = plants.length, mine = gardenLoad().plants.length;
    if (mine && !window.confirm(`Заменить ваши кусты (${mine}) кустами из копии (${n})?`)) return;
    gardenSave({ v: 1, plants });
    toast(`Загружено: ${n} ${plural(n, 'куст', 'куста', 'кустов')}`);
  }

  function initGarden() {
    renderGardenHome();
    document.addEventListener('basil:garden', () => { renderGardenHome(); if (gardenOpen && !gardenOpen.form && $('#sheet-garden').open) { const sc = $('#sheet-garden .sheet-inner'), y = sc ? sc.scrollTop : 0; renderGardenSheet(); if (sc) sc.scrollTop = y; } });
    // a day passed while the page stayed open: the week moves on
    document.addEventListener('visibilitychange', () => { if (!document.hidden) renderGardenHome(); });
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.hidden = true;
    document.body.appendChild(file);
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => importGarden(String(r.result));
      r.readAsText(f);
      file.value = '';
    });
    const findPlant = id => { const s = gardenLoad(); return { s, p: s.plants.find(x => x.id === id) }; };
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-garden-add], [data-plant-open], .g-done, .g-note, [data-garden-export], [data-garden-import], [data-g-edit], [data-g-del], [data-g-cancel], [data-log-del], [data-g-start], [data-g-place]');
      if (!t) return;
      if (t.matches('[data-garden-add]')) {
        openGarden({ form: true, draft: { start: t.dataset.gardenAdd || 'seed', variety: t.dataset.variety || '', place: 'home', name: '' } });
      } else if (t.matches('[data-plant-open]')) {
        openGarden({ id: t.dataset.plantOpen });
      } else if (t.matches('.g-done') && t.dataset.plant === '*') {
        // a task shared by the bushes on the windowsill: done for each that has it
        const s = gardenLoad();
        let title = '';
        s.plants.forEach(p => { const task = plantTasks(p, today()).find(x => x.key === t.dataset.task && x.state !== 'done'); if (task) { plantDone(p, task); title = task.title; } });
        if (!title) return;
        HAP.success();
        gardenSave(s);
        toast('Отмечено: ' + title.charAt(0).toLowerCase() + title.slice(1));
      } else if (t.matches('.g-done')) {
        const { s, p } = findPlant(t.dataset.plant);
        const task = p && plantTasks(p, today()).find(x => x.key === t.dataset.task);
        if (!task) return;
        plantDone(p, task);
        HAP.success();
        gardenSave(s);
        toast('Отмечено: ' + task.title.charAt(0).toLowerCase() + task.title.slice(1));
      } else if (t.matches('.g-note')) {
        const { s, p } = findPlant(t.dataset.plant);
        if (!p) return;
        plantNote(p, { k: t.dataset.note });
        gardenSave(s);
        toast('Записано: ' + NOTE_NAMES[t.dataset.note].toLowerCase());
      } else if (t.matches('[data-garden-export]')) {
        exportGarden();
      } else if (t.matches('[data-garden-import]')) {
        file.click();
      } else if (t.matches('[data-g-edit]')) {
        openGarden({ form: true, id: gardenOpen && gardenOpen.id });
      } else if (t.matches('[data-g-cancel]')) {
        if (gardenOpen && gardenOpen.id) openGarden({ id: gardenOpen.id }); else closeSheet($('#sheet-garden'));
      } else if (t.matches('[data-g-del]')) {
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p || !window.confirm(`Удалить «${p.name}» вместе с дневником?`)) return;
        s.plants = s.plants.filter(x => x !== p);
        gardenOpen = null;
        closeSheet($('#sheet-garden'));
        gardenSave(s);
      } else if (t.matches('[data-log-del]')) {
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p) return;
        p.log.splice(+t.dataset.logDel, 1);
        gardenSave(s);
      } else if (t.matches('[data-g-start], [data-g-place]')) {
        // the form's segmented choices
        const group = t.parentElement;
        $$('button', group).forEach(b => b.setAttribute('aria-pressed', String(b === t)));
        if (t.dataset.gStart) $('#g-date-l').textContent = B.GARDEN.starts.find(x => x.id === t.dataset.gStart).date;
        if (t.dataset.gPlace) $('#g-preset-f').hidden = t.dataset.gPlace === 'home';
      }
    });
    document.addEventListener('change', e => {
      if (e.target.id === 'g-log-k') $('#g-log-g').hidden = e.target.value !== 'cut';
      if (e.target.id === 'g-preset') $('#g-cities').textContent = 'Например, ' + B.PRESETS.find(x => x.id === e.target.value).cities;
    });
    document.addEventListener('submit', e => {
      if (e.target.id === 'g-form') {
        e.preventDefault();
        const pick = name => { const b = $(`#g-form [data-g-${name}][aria-pressed="true"]`); return b ? b.dataset['g' + name.charAt(0).toUpperCase() + name.slice(1)] : null; };
        const date = $('#g-date').value;
        if (!fromISO(date)) { $('#g-date').focus(); toast('Укажите дату'); return; }
        const variety = $('#g-variety').value;
        const s = gardenLoad();
        let p = gardenOpen && gardenOpen.id && s.plants.find(x => x.id === gardenOpen.id);
        if (!p) {
          p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), added: toISO(today()), log: [] };
          s.plants.push(p);
        }
        Object.assign(p, {
          name: ($('#g-name').value.trim() || variety || 'Мой базилик').slice(0, 40),
          variety, start: pick('start') || 'seed', place: pick('place') || 'home', preset: $('#g-preset').value || 'temperate', date
        });
        gardenOpen = { id: p.id };
        gardenSave(s);
        renderGardenSheet();
        HAP.success();
        if (!$('#garden-home')) toast('Куст добавлен — его дела на неделю теперь на главной');
      } else if (e.target.id === 'g-log-form') {
        e.preventDefault();
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p) return;
        const k = $('#g-log-k').value, d = fromISO($('#g-log-d').value) || today(), g = +$('#g-log-g').value, text = $('#g-log-t').value.trim();
        if (k === 'note' && !text) { $('#g-log-t').focus(); return; }
        const entry = { d: toISO(d), k };
        if (k === 'cut' && g > 0) entry.g = Math.min(5000, Math.round(g));
        if (text) entry.t = text.slice(0, 120);
        plantNote(p, entry);
        gardenSave(s);
      }
    });
  }
