  /* ================================================================== */
  /* MY BASIL: the experiments' steps among the week's tasks             */
  /* ================================================================== */
  // garden.exps: [{ id, exp, start: 'YYYY-MM-DDTHH:MM', t0: ms, cfg: {}, recs: [{ at: ms, g, v: {}, ph? }], done: [step], end?: ms }]
  // The steps and their times are in B.EXPERIMENTS; the forms, charts and the comparison with a model are on the page
  // (src/labs/moy/ex*.js). Here: what to do now in an experiment that is going on, told with the bushes' tasks
  const expDef = id => (B.EXPERIMENTS || []).find(x => x.id === id) || null;
  const expRunning = s => ((s || gardenLoad()).exps || []).filter(x => !x.end && isFinite(x.t0) && expDef(x.exp));
  // the step to do now: the latest one whose time has come, unless it is done (a missed earlier one gives way to it);
  // and the next one ahead
  function expStep(x, now = Date.now()) {
    const def = expDef(x.exp), done = x.done || [], hrs = (now - x.t0) / 3600e3;
    let cur = -1;
    def.steps.forEach((st, i) => { if (st.h <= hrs + 1e-6) cur = i; });
    const next = def.steps.findIndex((st, i) => i > cur);
    return { def, cur: cur >= 0 && !done.includes(cur) ? cur : -1, last: cur, next, hrs };
  }
  // tasks: the step due now, or the next one if it comes within a day
  function expTasks(s, now = Date.now()) {
    return expRunning(s).map(x => {
      const st = expStep(x, now);
      const i = st.cur >= 0 ? st.cur : st.next;
      if (i < 0) return null;
      const step = st.def.steps[i], due = x.t0 + step.h * 3600e3;
      if (st.cur < 0 && due - now > 24 * 3600e3) return null;
      return { x, def: st.def, i, step, due, state: st.cur >= 0 ? 'now' : 'soon' };
    }).filter(Boolean);
  }
  function expWhen(t, now = Date.now()) {
    if (t.state === 'now') return 'сейчас';
    const m = Math.round((t.due - now) / 60000);
    if (m < 60) return `через ${m} мин`;
    const h = Math.round(m / 60);
    return `через ${h} ${plural(h, 'час', 'часа', 'часов')}`;
  }
  // a card with the steps of every experiment going on, among the bushes
  function expCard() {
    const tasks = expTasks();
    const n = expRunning().length;
    if (!n) return '';
    return `<article class="g-card g-exp-card">
      <div class="g-top"><span class="g-pic g-pic-exp">${icon('flask')}</span><div class="g-id"><h3>Опыты</h3><p>${n === 1 ? 'идёт один опыт' : `идёт ${n} ${plural(n, 'опыт', 'опыта', 'опытов')}`}</p></div></div>
      ${tasks.length ? `<ul class="g-tasks">${tasks.map(t => `<li class="g-task is-${t.state} is-exp">
        <div class="g-task-t"><b>«${esc(t.def.title)}»: ${esc(t.step.title.charAt(0).toLowerCase() + t.step.title.slice(1))}</b><small>${expWhen(t)}</small><p>${nb(t.step.text)}</p></div>
        <div class="g-task-a"><a class="g-how" href="#opyt-${t.def.id}">Записать</a>${t.state === 'now' ? `<button class="g-done" type="button" data-exp="${esc(t.x.id)}" data-step="${t.i}">${icon('check')}<span>Сделано</span></button>` : ''}</div>
      </li>`).join('')}</ul>` : '<p class="g-free">Сейчас по опытам ничего не нужно — гид напомнит о следующем шаге.</p>'}
    </article>`;
  }
