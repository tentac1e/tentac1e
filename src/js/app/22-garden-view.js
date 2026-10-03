  /* ================================================================== */
  /* MY BASIL: the block on the home page and the sheet of one bush      */
  /* ================================================================== */
  const ago = (d, day) => { const n = dayDiff(d, day); return n <= 0 ? 'сегодня' : n === 1 ? 'вчера' : daysWord(n) + ' назад'; };
  // when a task is due, said shortly: «просрочено на 3 дня», «до 12 октября», «в четверг»
  const WEEKDAY = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
  function taskWhen(t, day) {
    // the weather's: the night or the day it is about
    if (t.weather) return t.weather === 'heat' ? wxWhen(t.due, day) : wxWhen(t.due, day) + ' ночью';
    if (t.state === 'late') return 'просрочено на ' + daysWord(dayDiff(t.once ? t.to : t.due, day));
    if (t.state === 'now') return !t.once || dayDiff(day, t.to) <= 0 ? 'сегодня' : dayDiff(t.from, t.to) > 40 ? 'в эти месяцы' : 'сейчас, до ' + fd(t.to);
    const n = dayDiff(day, t.due);
    return n === 1 ? 'завтра' : n < 7 ? WEEKDAY[t.due.getDay()] : fd(t.due);
  }
  const plantPic = (p, day) => { const v = gardenVariety(p); return `<span class="g-pic" data-leaf="${v ? v.leaf : 'green'}">${miniPlant(plantStage(p, day).pic)}</span>`; };
  // the latest photo of the bush, if there is one (newest by date, then by when it was written)
  const lastPhoto = p => (p.log || []).map((e, i) => Object.assign({ i }, e)).filter(e => e.k === 'photo' && e.ph && fromISO(e.d)).sort((a, b) => b.d.localeCompare(a.d) || b.i - a.i)[0] || null;
  const plantMeta = (p, day) => {
    const v = gardenVariety(p), st = plantStage(p, day);
    const start = B.GARDEN.starts.find(s => s.id === p.start);
    return [v && v.name !== p.name ? `«${esc(v.name)}»` : '', `${st.age + 1}-й день`, st.word, start ? start.short : ''].filter(Boolean).join(' · ');
  };
  // cal: in the bush's sheet a task goes into Google Calendar with one tap (the home page stays as it was)
  function taskHtml(p, t, day, cal) {
    const gcal = cal ? `<a class="g-how g-gcal" href="${esc(googleLink(p, t, t.due < day ? day : t.due))}" target="_blank" rel="noopener">В Google Календарь</a>` : '';
    return `<li class="g-task is-${t.state}${t.weather ? ' is-wx is-wx-' + t.weather : ''}">
      <div class="g-task-t"><b>${esc(t.title)}</b><small>${taskWhen(t, day)}</small><p>${nb(t.text)}</p></div>
      <div class="g-task-a"><span class="g-task-l"><a class="g-how" href="#${t.link}">Как?</a>${gcal}</span><button class="g-done" type="button" data-plant="${p.id}" data-task="${t.key}">${icon('check')}<span>Сделано</span></button></div>
    </li>`;
  }
  const notesHtml = p => `<div class="g-notes">${B.GARDEN.notes.map(n => `<button class="g-note" type="button" data-plant="${p.id}" data-note="${n.k}">${icon(n.icon)}<span>${n.name}</span></button>`).join('')}</div>`;
  // shared: the lamp is one for the whole windowsill, so on the home page it is asked once for all bushes
  const shared = t => /^light-/.test(t.key);
  function weekHtml(p, day, common, cal) {
    const w = plantWeek(p, day);
    if (common) w.now = w.now.filter(t => !shared(t));
    const water = lastNote(p, 'water');
    return (w.now.length ? `<ul class="g-tasks">${w.now.map(t => taskHtml(p, t, day, cal)).join('')}</ul>` : `<p class="g-free">На этой неделе дел по плану нет. Поливайте, когда верхние 1–2&nbsp;см грунта сухие.</p>`) +
      (w.next ? `<p class="g-next">Дальше: ${esc(w.next.title.charAt(0).toLowerCase() + w.next.title.slice(1))} — ${fd(w.next.due)}</p>` : '') +
      wxAdvice(p, day).map(a => `<p class="g-wx g-wx-${a.kind}">${icon(a.kind === 'rain' ? 'drop' : a.kind === 'dry' ? 'wind' : 'sun')}<span>${nb(a.text)}</span></p>`).join('') +
      notesHtml(p) + `<p class="g-water">${water ? 'Полит ' + ago(water, day) + '.' : 'Полив ещё не отмечен.'} <a href="#uhod-poliv">Как понять, что пора</a></p>`;
  }
  function gardenCard(p, day, page) {
    const ph = page && lastPhoto(p);
    return `<article class="g-card" data-plant-card="${p.id}">
      <div class="g-top">${ph ? `<span class="g-pic g-pic-photo"><img data-photo="${ph.ph}" alt="${esc(p.name)}: фото от ${fd(fromISO(ph.d))}"></span>` : plantPic(p, day)}<div class="g-id"><h3><button class="g-open" type="button" data-plant-open="${p.id}">${esc(p.name)}</button></h3><p>${plantMeta(p, day)}</p></div></div>
      ${weekHtml(p, day, true)}
    </article>`;
  }

  // the week of every bush, or an invitation to add the first one: on the home page (#garden-home) and on the
  // page «Мой базилик» (#garden-page), where the cover already says whose bushes these are
  function renderGardenBox(box, page) {
    const day = today(), [mon, sun] = weekOf(day);
    const { plants } = gardenLoad();
    const hid = page ? 'moy-page-h' : 'moy-h';
    const keep = `<p class="g-keep"><button type="button" class="g-link" data-garden-export>Сохранить копию</button><button type="button" class="g-link" data-garden-import>Загрузить копию</button>${page && canShareFile() ? '<button type="button" class="g-link" data-garden-share>Отправить копию</button>' : ''}<span>Кусты хранятся только в этом браузере. Safari стирает данные сайта, который не открывали неделю, — копия в файле их сбережёт.</span></p>`;
    // from the home page to the rest of it: the weather and the experiments live on the page
    const more = page ? '' : `<p class="g-more"><a class="g-link" href="#moy">Все кусты, погода и опыты${icon('arrow-r')}</a></p>`;
    if (!plants.length) {
      box.innerHTML = `<div class="g-empty card">
        <span class="g-pic g-pic-big" data-leaf="green">${miniPlant('harvest')}</span>
        <div><h2 id="${hid}">${page ? 'Ваш первый <em>куст</em>' : 'Мой <em>базилик</em>'}</h2>
        <p>Добавьте свой куст — гид подскажет, что делать с ним на этой неделе: когда прищипнуть, подкормить и срезать.</p>
        <div class="g-starts">${B.GARDEN.starts.filter(s => s.id !== 'seedling').map(s => `<button class="chip" type="button" data-garden-add="${s.id}">${icon(s.id === 'seed' ? 'seed' : s.id === 'shop' ? 'bag' : 'cup')}${s.id === 'shop' ? 'Купил горшок в магазине' : s.id === 'cutting' ? 'Укоренил черенок' : s.name}</button>`).join('')}</div>
        <p class="g-keep"><button type="button" class="g-link" data-garden-import>Загрузить копию</button></p>${more}</div>
      </div>${expCard() ? `<div class="g-list g-list-exp">${expCard()}</div>` : ''}`;
      fixLinks(box);
      return;
    }
    const common = plants.map(p => plantWeek(p, day).now.find(shared)).filter(Boolean)[0];
    box.innerHTML = `<div class="block-head"><h2 id="${hid}">${page ? 'На этой <em>неделе</em>' : 'Мой <em>базилик</em>'}</h2><p>${page ? fr(mon, sun) : 'На этой неделе · ' + fr(mon, sun)}</p></div>
      ${wxStrip(plants, page)}
      ${common ? `<ul class="g-tasks g-common">${taskHtml({ id: '*' }, Object.assign({}, common, { title: common.title + ' для всех кустов на окне' }), day)}</ul>` : ''}
      <div class="g-list">${expCard()}${plants.map(p => gardenCard(p, day, page)).join('')}</div>
      <div class="g-foot"><div class="g-foot-a"><button class="btn btn-ghost btn-small" type="button" data-garden-add="seed">${icon('sprout')}Добавить куст</button>${page ? `<button class="btn btn-ghost btn-small" type="button" data-garden-ics="*">${icon('cal')}Дела в календарь</button>` : ''}</div>${keep}</div>${more}`;
    fixLinks(box);
    if (page) fillPhotos(box);
  }
  // what is due this week over all the bushes (late ones too): the badge on the header button
  function gardenDue() {
    const day = today();
    const lists = gardenLoad().plants.map(p => plantWeek(p, day).now);
    const common = lists.some(l => l.some(shared));
    return lists.reduce((n, l) => n + l.filter(t => !shared(t)).length, 0) + (common ? 1 : 0) + expTasks().filter(t => t.state === 'now').length;
  }
  function renderGardenHome() {
    const home = $('#garden-home'), page = $('#garden-page');
    if (home) renderGardenBox(home, false);
    if (page) renderGardenBox(page, true);
    const n = gardenDue();
    $$('.garden-badge').forEach(b => { b.textContent = n > 9 ? '9+' : String(n); b.hidden = !n; });
    $$('[data-garden-link]').forEach(a => a.setAttribute('aria-label', n ? `Мой базилик: ${n} ${plural(n, 'дело', 'дела', 'дел')} на неделе` : 'Мой базилик'));
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
  const NOTE_NAMES = { water: 'Полил', feed: 'Подкормил', pinch: 'Прищипнул', cut: 'Срезал', buds: 'Убрал бутоны', flush: 'Промыл грунт', measure: 'Замер', photo: 'Фото', note: 'Заметка' };
  // what goes on inside the bush now, and what it is like
  function insideHtml(p, day) {
    const st = plantStage(p, day), x = B.GARDEN.inside[st.pic];
    if (!x) return '';
    return `<section class="g-sec g-inside"><h4>Что сейчас внутри<small>${st.word}</small></h4><p>${nb(x.text)}</p><p class="g-like"><b>На что похоже.</b> ${nb(x.like)}</p><a class="g-how" href="#${x.link}">Подробнее в гиде</a></section>`;
  }
  // the bush's height by the measures and the grams cut, over the days of its life
  function growthData(p) {
    const S = fromISO(p.date) || today();
    const log = (p.log || []).map((e, i) => Object.assign({ i, date: fromISO(e.d) }, e)).filter(e => e.date).sort((a, b) => a.date - b.date || a.i - b.i);
    const hs = log.filter(e => e.k === 'measure' && +e.h > 0).map(e => [dayDiff(S, e.date), +e.h]);
    let sum = 0;
    const gs = [];
    log.filter(e => e.k === 'cut' && +e.g > 0).forEach(e => { const d = dayDiff(S, e.date); gs.push([d, sum]); sum += +e.g; gs.push([d, sum]); });
    // the total stands until today: a step for each harvest
    if (gs.length) gs.push([Math.max(gs[gs.length - 1][0], dayDiff(S, today())), sum]);
    return { hs, gs, sum };
  }
  // round numbers for an axis: 0 … at least the top value, in steps of 1, 2 or 5 × 10ⁿ
  function niceTicks(top, n = 4) {
    const raw = Math.max(top, 1) / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 5, 10].map(k => k * mag).find(v => v >= raw);
    const out = [];
    for (let v = 0; v < top + step * 0.999; v += step) out.push(Math.round(v * 100) / 100);
    return out.length >= 2 ? out : [0, step];
  }
  // ticks on round days within [a, b]
  function axisTicks(a, b, n) {
    const raw = Math.max(b - a, 1) / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 5, 10].map(k => k * mag).find(v => v >= raw);
    const out = [];
    for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(Math.round(v));
    return out;
  }
  function growthCharts(box, p) {
    const A = window.BasilScience && window.BasilScience.api, host = $('#g-growth', box);
    if (!A || !host) return;
    const { hs, gs } = growthData(p);
    const one = (el, pts, o) => {
      const xs = pts.map(q => q[0]), x0 = Math.max(0, Math.min(...xs) - 2), x1 = Math.max(...xs) + 2;
      const yt = niceTicks(Math.max(...pts.map(q => q[1])) * 1.1);
      A.chart(el, {
        label: o.label,
        h: w => (w < 420 ? 170 : 190),
        draw(w, hh) {
          const xt = axisTicks(x0, x1, w < 420 ? 3 : 5);
          const P = A.plot({ w, h: hh, pad: { l: 40, r: 14, t: 24, b: 34 }, x: [x0, x1], y: [0, yt[yt.length - 1]], xticks: xt, yticks: yt, fx: v => v + '-й', ylab: o.unit, xlab: 'день жизни куста', series: [{ pts, cls: o.cls }] });
          return P.s + (o.dots || []).map(q => `<circle class="${o.cls}" cx="${P.X(q[0])}" cy="${P.Y(q[1])}" r="3.6"/>`).join('');
        }
      });
    };
    if (hs.length >= 2) one($('[data-g-chart="h"]', host), hs, { label: 'Высота куста по замерам', unit: 'см', cls: 's1', dots: hs });
    // a dot where each harvest lifted the total
    if (gs.length) one($('[data-g-chart="g"]', host), gs, { label: 'Сколько собрано с куста', unit: 'г', cls: 's2', dots: gs.filter((q, i) => i % 2 === 1 && i < gs.length - 1) });
  }
  function renderGardenPlant(p) {
    const day = today(), v = gardenVariety(p);
    const all = plantTasks(p, day);
    const STATE = { done: 'сделано', before: 'до дневника', missed: 'пропущено', late: 'просрочено', now: 'сейчас', soon: '' };
    const plan = all.filter(t => t.once).map(t => `<li class="g-step is-${t.state}"><span class="g-step-d">${t.state === 'done' ? fd(t.done) : fr(t.from, t.to)}</span><span class="g-step-t">${esc(t.title)}${STATE[t.state] ? `<small>${STATE[t.state]}</small>` : ''}</span></li>`).join('') +
      all.filter(t => t.repeat).map(t => `<li class="g-step is-repeat"><span class="g-step-d">${fd(t.due)}</span><span class="g-step-t">${esc(t.title)}<small>и дальше по кругу</small></span></li>`).join('');
    const tasks = Object.fromEntries(all.map(t => [t.key, t.title]));
    const log = (p.log || []).map((e, i) => Object.assign({ i, date: fromISO(e.d) }, e)).filter(e => e.date).sort((a, b) => b.date - a.date || b.i - a.i);
    const grams = log.reduce((s, e) => s + (e.k === 'cut' && +e.g > 0 ? +e.g : 0), 0);
    const measure = e => [+e.h > 0 ? `${fmtNum(+e.h, 1)}\u00a0см` : '', +e.n > 0 ? `${+e.n}\u00a0${plural(+e.n, 'верхушка', 'верхушки', 'верхушек')}` : ''].filter(Boolean).join(', ');
    const what = e => (e.k === 'task' ? 'Сделано: ' + esc((tasks[e.task] || 'дело по плану').toLowerCase()) : (NOTE_NAMES[e.k] || 'Заметка') + (e.task && tasks[e.task] ? ` (${esc(tasks[e.task].toLowerCase())})` : '')) + (e.k === 'cut' && +e.g > 0 ? `, ${+e.g} г` : '') + (e.k === 'measure' && measure(e) ? ': ' + measure(e) : '') + (e.t ? ` — ${esc(e.t)}` : '');
    const photos = log.filter(e => e.k === 'photo' && e.ph);
    const { hs, gs } = growthData(p);
    const growth = hs.length >= 2 || gs.length;
    return `<div class="g-sheet">
      <div class="g-top">${plantPic(p, day)}<div class="g-id"><h3>${esc(p.name)}</h3><p>${plantMeta(p, day)}</p></div><button class="btn btn-ghost btn-small g-edit" type="button" data-g-edit>Изменить</button></div>
      ${v ? `<div class="callout"><svg class="ico"><use href="#i-leaf"/></svg><p><b>«${esc(v.name)}».</b> ${nb(v.care)}</p></div>` : ''}
      <section class="g-sec"><h4>На этой неделе</h4>${weekHtml(p, day, false, true)}<p class="g-cal"><button class="g-link" type="button" data-garden-ics="${p.id}">${icon('cal')}Дела этого куста в календарь телефона</button></p></section>
      <section class="g-sec g-photos-sec"><h4>Фото${photos.length ? `<small>${photos.length}</small>` : ''}</h4>
        <div class="g-photos">${photos.slice(0, 12).map(e => `<button class="g-photo" type="button" data-photo-open="${e.ph}" data-cap="${esc(p.name)}, ${fd(e.date)}"><img data-photo="${e.ph}" alt="Фото от ${fd(e.date)}"><span>${fd(e.date)}</span></button>`).join('')}<button class="g-photo g-photo-add" type="button" data-photo-add="${p.id}">${icon('camera')}<span>${photos.length ? 'Ещё фото' : 'Добавить фото'}</span></button></div>
        ${photos.length ? '' : '<p class="muted g-photos-note">Снимок раз в неделю с одной точки покажет, как куст растёт и ветвится. Фото хранятся только в этом браузере.</p>'}
      </section>
      ${insideHtml(p, day)}
      <section class="g-sec"><h4>План куста</h4><ol class="g-plan">${plan}</ol></section>
      ${growth ? `<section class="g-sec"><h4>Рост и урожай</h4><div class="g-growth" id="g-growth">${hs.length >= 2 ? '<figure class="g-chart"><figcaption>Высота</figcaption><div data-g-chart="h"></div></figure>' : ''}${gs.length ? '<figure class="g-chart"><figcaption>Собрано всего</figcaption><div data-g-chart="g"></div></figure>' : ''}</div></section>` : ''}
      <section class="g-sec"><h4>Дневник${grams ? `<small>собрано ${grams} г</small>` : ''}</h4>
        <form class="g-log-form" id="g-log-form">
          <select id="g-log-k" aria-label="Что сделали">${['water', 'feed', 'pinch', 'cut', 'measure', 'buds', 'flush', 'note'].map(k => `<option value="${k}">${NOTE_NAMES[k]}</option>`).join('')}</select>
          <input type="date" id="g-log-d" value="${toISO(day)}" max="${toISO(day)}" aria-label="Когда">
          <input type="number" id="g-log-g" min="0" max="5000" step="1" inputmode="numeric" placeholder="граммы" aria-label="Сколько граммов срезали" hidden>
          <input type="number" id="g-log-h" min="0" max="300" step="0.5" inputmode="decimal" placeholder="высота, см" aria-label="Высота куста, см" hidden>
          <input type="number" id="g-log-n" min="0" max="200" step="1" inputmode="numeric" placeholder="верхушек" aria-label="Сколько верхушек" hidden>
          <input type="text" id="g-log-t" maxlength="120" placeholder="Заметка, если нужна" aria-label="Заметка">
          <button class="btn btn-ghost btn-small" type="submit">Записать</button>
        </form>
        ${log.length ? `<ul class="g-log">${log.map(e => `<li><span class="g-log-d">${fd(e.date)}</span><span>${e.k === 'photo' && e.ph ? `<button class="g-log-ph" type="button" data-photo-open="${e.ph}" data-cap="${esc(p.name)}, ${fd(e.date)}"><img data-photo="${e.ph}" alt=""></button>` : ''}${what(e)}</span><button class="g-log-x" type="button" data-log-del="${e.i}" aria-label="Удалить запись">${icon('close')}</button></li>`).join('')}</ul>` : '<p class="muted g-log-empty">Записей пока нет: отмечайте «Сделано» и «Полил» — гид будет считать от них.</p>'}
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
      fillPhotos(box);
      growthCharts(box, p);
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
  // one file with everything: the bushes, their diaries and photos, the place for the weather, the experiments
  async function gardenFile() {
    const s = gardenLoad();
    const photos = await photosOut(s.plants).catch(() => ({}));
    const data = JSON.stringify(Object.assign({}, s, { v: 2, saved: toISO(today()) }, Object.keys(photos).length ? { photos } : {}), null, 1);
    return { blob: new Blob([data], { type: 'application/json' }), name: `moy-bazilik-${toISO(today())}.json`, photos: Object.keys(photos).length };
  }
  async function exportGarden() {
    const f = await gardenFile();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f.blob);
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast(f.photos ? `Копия с ${f.photos} фото сохранена в файл` : 'Копия сохранена в файл');
  }
  // to oneself in a messenger or to the cloud, where the phone can send a file
  const canShareFile = () => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] })); } catch (e) { return false; } };
  async function shareGarden() {
    const f = await gardenFile();
    try { await navigator.share({ files: [new File([f.blob], f.name, { type: 'application/json' })], title: 'Мой базилик — копия' }); } catch (e) { if (e && e.name !== 'AbortError') exportGarden(); }
  }
  // a copy read back: only bushes that make sense, and only after a yes
  async function importGarden(text) {
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
        if (+e.h > 0) o.h = Math.min(300, Math.round(+e.h * 10) / 10);
        if (+e.n > 0) o.n = Math.min(200, Math.round(+e.n));
        if (e.ph && /^[a-z0-9]{4,32}$/.test(e.ph)) o.ph = e.ph;
        if (e.t) o.t = String(e.t).slice(0, 120);
        return o;
      })
    }));
    if (!plants.length) { toast('В файле нет кустов'); return; }
    const n = plants.length, mine = gardenLoad().plants.length;
    if (mine && !window.confirm(`Заменить ваши кусты (${mine}) кустами из копии (${n})?`)) return;
    const got = await photosIn(s.photos);
    gardenSave(Object.assign({ v: 2, plants }, gardenExtra(s, gardenLoad())));
    toast(`Загружено: ${n} ${plural(n, 'куст', 'куста', 'кустов')}` + (got ? `, ${got} фото` : ''));
  }
  // what a copy brings besides the bushes, checked like they are: the place for the weather and the experiments;
  // a copy without them keeps the ones this browser has
  function gardenExtra(s, keep) {
    const out = {};
    const w = s.where;
    if (w && isFinite(+w.lat) && isFinite(+w.lon) && Math.abs(+w.lat) <= 90 && Math.abs(+w.lon) <= 180) out.where = { name: String(w.name || '').slice(0, 80), region: String(w.region || '').slice(0, 80), lat: +w.lat, lon: +w.lon };
    else if (keep.where) out.where = keep.where;
    if (Array.isArray(s.exps)) out.exps = s.exps.filter(x => x && typeof x.exp === 'string' && expDef(x.exp) && fromISO(String(x.start || '').slice(0, 10)) && isFinite(x.t0)).slice(0, 40).map(x => JSON.parse(JSON.stringify(x)));
    else if (keep.exps) out.exps = keep.exps;
    return out;
  }

  function initGarden() {
    // the page's own models (the weather, the experiments) read and write the bushes through this
    window.BasilGarden = {
      load: gardenLoad, save: gardenSave, tasks: plantTasks, week: plantWeek, stage: plantStage, open: openGarden,
      on: fn => document.addEventListener('basil:garden', fn),
      weather: { place: wxPlace, get: wxCached, refresh: wxRefresh, search: wxSearch, set: wxSetPlace, here: wxHere, age: wxAge, t: fmtT, when: wxWhen, on: fn => document.addEventListener('basil:weather', fn) },
      exps: { def: expDef, step: expStep, running: expRunning },
      // a photo for an experiment: shrunk and kept like a bush's photo
      photos: {
        add: async file => { const blob = await photoShrink(file), id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); await photoPut(id, blob); return id; },
        fill: fillPhotos, show: showPhoto, forget: forgetPhoto
      }
    };
    renderGardenHome();
    // on the page, the experiments going on stand open: their models are built only when they come in sight
    if ($('#garden-page')) expRunning().forEach(x => { const d = document.getElementById('opyt-' + x.exp); if (d) d.open = true; });
    // the forecast once the page has started (never during the start), and again when the reader comes back to it
    document.addEventListener('basil:weather', renderGardenHome);
    const fresh = () => { if (wxPlace()) wxRefresh(); };
    if (document.documentElement.classList.contains('is-ready')) setTimeout(fresh, 1500); else document.addEventListener('basil:ready', () => setTimeout(fresh, 1500), { once: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) fresh(); });
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
    // a photo from the camera or the gallery, for the bush whose «Добавить фото» was tapped
    const shot = document.createElement('input');
    shot.type = 'file';
    shot.accept = 'image/*';
    shot.hidden = true;
    document.body.appendChild(shot);
    let shotFor = null;
    shot.addEventListener('change', async () => {
      const f = shot.files && shot.files[0], id = shotFor;
      shot.value = '';
      if (!f || !id) return;
      try {
        const blob = await photoShrink(f);
        const ph = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        await photoPut(ph, blob);
        const { s, p } = findPlant(id);
        if (!p) { photoDel(ph); return; }
        plantNote(p, { k: 'photo', ph });
        gardenSave(s);
        HAP.success();
        toast('Фото добавлено в дневник');
      } catch (err) { toast('Фото не сохранилось: в этом браузере нет места для фото'); }
    });
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-garden-add], [data-plant-open], .g-done, .g-note, [data-garden-export], [data-garden-import], [data-garden-share], [data-garden-ics], [data-photo-add], [data-photo-open], [data-g-edit], [data-g-del], [data-g-cancel], [data-log-del], [data-g-start], [data-g-place]');
      if (!t) return;
      if (t.matches('[data-garden-add]')) {
        openGarden({ form: true, draft: { start: t.dataset.gardenAdd || 'seed', variety: t.dataset.variety || '', place: 'home', name: '' } });
      } else if (t.matches('[data-plant-open]')) {
        openGarden({ id: t.dataset.plantOpen });
      } else if (t.matches('.g-done[data-exp]')) {
        // a step of an experiment done (the values themselves are written on its page)
        const s = gardenLoad(), x = (s.exps || []).find(e => e.id === t.dataset.exp);
        if (!x) return;
        x.done = [...new Set([...(x.done || []), +t.dataset.step])];
        HAP.success();
        gardenSave(s);
        toast('Шаг опыта отмечен');
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
      } else if (t.matches('[data-garden-share]')) {
        shareGarden();
      } else if (t.matches('[data-garden-ics]')) {
        const all = gardenLoad().plants;
        exportIcs(t.dataset.gardenIcs === '*' ? all : all.filter(x => x.id === t.dataset.gardenIcs));
      } else if (t.matches('[data-photo-add]')) {
        shotFor = t.dataset.photoAdd;
        shot.click();
      } else if (t.matches('[data-photo-open]')) {
        showPhoto(t.dataset.photoOpen, t.dataset.cap);
      } else if (t.matches('[data-garden-import]')) {
        file.click();
      } else if (t.matches('[data-g-edit]')) {
        openGarden({ form: true, id: gardenOpen && gardenOpen.id });
      } else if (t.matches('[data-g-cancel]')) {
        if (gardenOpen && gardenOpen.id) openGarden({ id: gardenOpen.id }); else closeSheet($('#sheet-garden'));
      } else if (t.matches('[data-g-del]')) {
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p || !window.confirm(`Удалить «${p.name}» вместе с дневником?`)) return;
        photoIds(p).forEach(forgetPhoto);
        s.plants = s.plants.filter(x => x !== p);
        gardenOpen = null;
        closeSheet($('#sheet-garden'));
        gardenSave(s);
      } else if (t.matches('[data-log-del]')) {
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p) return;
        const [gone] = p.log.splice(+t.dataset.logDel, 1);
        if (gone && gone.ph) forgetPhoto(gone.ph);
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
      if (e.target.id === 'g-log-k') {
        $('#g-log-g').hidden = e.target.value !== 'cut';
        $('#g-log-h').hidden = $('#g-log-n').hidden = e.target.value !== 'measure';
      }
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
        if (!$('#garden-home') && !$('#garden-page')) toast('Куст добавлен — его дела на неделю теперь в «Моём базилике»');
      } else if (e.target.id === 'g-log-form') {
        e.preventDefault();
        const { s, p } = findPlant(gardenOpen && gardenOpen.id);
        if (!p) return;
        const k = $('#g-log-k').value, d = fromISO($('#g-log-d').value) || today(), g = +$('#g-log-g').value, text = $('#g-log-t').value.trim();
        const hcm = +String($('#g-log-h').value).replace(',', '.'), tops = +$('#g-log-n').value;
        if (k === 'note' && !text) { $('#g-log-t').focus(); return; }
        if (k === 'measure' && !(hcm > 0) && !(tops > 0)) { $('#g-log-h').focus(); return; }
        const entry = { d: toISO(d), k };
        if (k === 'cut' && g > 0) entry.g = Math.min(5000, Math.round(g));
        if (k === 'measure' && hcm > 0) entry.h = Math.min(300, Math.round(hcm * 10) / 10);
        if (k === 'measure' && tops > 0) entry.n = Math.min(200, Math.round(tops));
        if (text) entry.t = text.slice(0, 120);
        plantNote(p, entry);
        gardenSave(s);
      }
    });
  }
