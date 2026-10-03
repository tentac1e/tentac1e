  /* @use agro */
  /* The experiments of «Мой базилик»: one frame for all of them. Start (with its settings), the steps on a timeline,
     a form for what the reader sees, the records, a chart of the reader's points against the model's line, the
     conclusion; the finished runs stay below as a history. One run of a kind goes on at a time. The data live with the
     bushes (garden.exps, window.BasilGarden), so the copy in a file carries them and the tasks of the week tell the steps.
     An experiment is experiment(el, spec):
       spec.id      the experiment in B.EXPERIMENTS (steps and their times, groups)
       spec.note    what the model says, under the title
       spec.cfg     settings asked at the start: [{ k, label, unit, def, min, max, step }]
       spec.bushes  true: each group may be one of the reader's bushes (its measures go into that bush's diary too)
       spec.fields  what is written each time: [{ k, label, type: number|count|scale|color, unit, min, max, step, opts, optional }]
       spec.photo   true: a photo may go with a record
       spec.unit    'h' or 'd' — the time axis
       spec.y       { k, lo, hi, ticks, fy, lab } — the field on the chart; spec.model(g, t, cfg) its line (or null)
       spec.draw    instead of the time chart: (host, run) draws its own
       spec.verdict (run) → html: what the reader's numbers say, against the model */
  const EXP_DEF = id => (window.BASIL.EXPERIMENTS || []).find(x => x.id === id);
  const two = n => String(n).padStart(2, '0');
  const localISO = ms => { const d = new Date(ms); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`; };
  const fromLocal = s => { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]).getTime() : NaN; };
  const whenText = ms => { const d = new Date(ms); return `${d.getDate()}\u00a0${MONTHS_GEN[d.getMonth()]}, ${d.getHours()}:${two(d.getMinutes())}`; };
  // time since the start, said shortly: «40 мин», «5 ч», «3 дн. 4 ч»
  const sinceText = hrs => {
    if (hrs < 1) return `${Math.max(0, Math.round(hrs * 60))}\u00a0мин`;
    if (hrs < 48) return `${Math.round(hrs)}\u00a0ч`;
    const d = Math.floor(hrs / 24), r = Math.round(hrs - d * 24);
    return `${d}\u00a0дн.${r ? ` ${r}\u00a0ч` : ''}`;
  };
  // a number without a needless «,0»: 3 h, 24 °C, but 3,4
  const nfmt = (v, d = 1) => (Math.abs(v - Math.round(v)) < 0.05 ? fmt0(v) : fmt(v, d));
  const expRid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // a chart's x: hours or days from the start
  const expX = (run, at, unit) => (at - run.t0) / 3600e3 / (unit === 'd' ? 24 : 1);
  // a value of a record's field, as a number (or null)
  const expVal = (r, k) => (r && r.v && r.v[k] !== undefined && r.v[k] !== null && r.v[k] !== '' && isFinite(+r.v[k]) ? +r.v[k] : null);

  // the line of a value over time for one group: the reader's points, in time order
  const expSeries = (run, g, k, unit) => run.recs.filter(r => r.g === g && expVal(r, k) !== null).map(r => [expX(run, r.at, unit), expVal(r, k)]).sort((a, b) => a[0] - b[0]);
  // the time when a group's value first reached a level (by a straight line between two records), or null
  function expCross(pts, level) {
    for (let i = 0; i < pts.length; i++) {
      if (pts[i][1] >= level) {
        if (!i) return pts[0][0];
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return x0 + (x1 - x0) * (level - y0) / (y1 - y0 || 1);
      }
    }
    return null;
  }

  // one chart of an experiment: series (dashed — the model), dots of the reader's records
  function expPlot(host, o) {
    return h.chart(host, {
      label: o.label,
      h: w => (w < 480 ? 200 : 230),
      draw(w, hh) {
        const P = h.plot({ w, h: hh, pad: o.pad, x: o.x, y: o.y, xticks: typeof o.xticks === 'function' ? o.xticks(w) : o.xticks, yticks: o.yticks, fx: o.fx, fy: o.fy, ylab: o.ylab, xlab: o.xlab, series: o.series });
        return P.s + (o.dots || []).map(([x, y, cls]) => `<circle class="${cls}" cx="${P.X(x)}" cy="${P.Y(y)}" r="4"/>`).join('');
      }
    });
  }
  // ticks on a time axis: hours or days from the start
  function expTimeTicks(xMax, unit) {
    const step = unit === 'd' ? (xMax > 21 ? 7 : xMax > 8 ? 2 : 1) : (xMax > 48 ? 24 : xMax > 12 ? 6 : xMax > 4 ? 1 : 0.5);
    const out = [];
    for (let t = 0; t <= xMax + 1e-9; t += step) out.push(Math.round(t * 10) / 10);
    return w => (w < 420 && out.length > 7 ? out.filter((t, i) => i % 2 === 0) : out);
  }
  const expFx = unit => v => (unit === 'd' ? `${v}-й` : v < 1 && v > 0 ? `${Math.round(v * 60)} мин` : `${v} ч`);

  function experiment(el, spec) {
    const G = window.BasilGarden, def = EXP_DEF(spec.id);
    const title = `<div class="lab-head"><p class="lab-kicker">Опыт</p><h4 class="lab-title">${esc(def ? def.title : spec.id)}</h4>${spec.note ? `<p class="lab-note">${h.nb(spec.note)}</p>` : ''}</div>`;
    if (!G || !def) { el.innerHTML = title + '<p class="muted">Опыт заработает, когда страница загрузится полностью.</p>'; return; }
    const groups = def.groups || [null];
    const unit = spec.unit || 'h';
    let draft = {}, photoFor = null, cfgDraft = {};
    const shot = document.createElement('input');
    shot.type = 'file';
    shot.accept = 'image/*';
    shot.hidden = true;
    el.appendChild(shot);

    const state = () => {
      const s = G.load(), all = (s.exps || []).filter(x => x.exp === spec.id);
      return { s, run: all.find(x => !x.end) || null, past: all.filter(x => x.end).sort((a, b) => b.end - a.end) };
    };
    const legend = () => (groups[0] === null || spec.legend === false ? '' : `<p class="exp-legend">${groups.map((g, i) => `<span><i class="s${i + 1}"></i>${esc(g)}</span>`).join('')}${spec.model ? '<span><i class="is-model"></i>модель</span>' : ''}</p>`);

    /* the field inputs of one group */
    function fieldHtml(f, gi) {
      const v = (draft[gi] || {})[f.k];
      const id = `ex-${spec.id}-${f.k}-${gi}`;
      if (f.type === 'scale') {
        return `<div class="exp-f"><span class="exp-l" id="${id}-l">${f.label}</span><div class="seg exp-seg" role="group" aria-labelledby="${id}-l">${f.opts.map((o, i) => `<button type="button" data-f="${f.k}" data-g="${gi}" data-v="${i}" aria-pressed="${String(v === i)}">${o}</button>`).join('')}</div></div>`;
      }
      if (f.type === 'color') {
        return `<div class="exp-f"><span class="exp-l" id="${id}-l">${f.label}</span><div class="exp-swatches" role="group" aria-labelledby="${id}-l">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => `<button type="button" class="exp-sw" style="background:var(--ph-${n})" data-f="${f.k}" data-g="${gi}" data-v="${n}" aria-pressed="${String(v === n)}" aria-label="цвет как при pH ${n}"></button>`).join('')}<button type="button" class="exp-sw exp-sw-none" data-f="${f.k}" data-g="${gi}" data-v="0" aria-pressed="${String(v === 0)}">не окрасился</button></div></div>`;
      }
      return `<label class="exp-f" for="${id}"><span class="exp-l">${f.label}${f.optional ? ' <small>если есть</small>' : ''}</span><span class="exp-in"><input id="${id}" type="number" inputmode="${f.type === 'count' ? 'numeric' : 'decimal'}" min="${f.min !== undefined ? f.min : 0}" max="${f.max !== undefined ? f.max : 9999}" step="${f.step || 1}" data-f="${f.k}" data-g="${gi}" value="${v !== undefined && v !== null ? v : ''}">${f.unit ? `<i>${f.unit}</i>` : ''}</span></label>`;
    }
    const groupForm = (gi, run) => {
      const ph = (draft[gi] || {}).ph;
      const bush = spec.bushes && run.cfg && run.cfg.plants && run.cfg.plants[gi] ? G.load().plants.find(p => p.id === run.cfg.plants[gi]) : null;
      return `<fieldset class="exp-group exp-g${gi + 1}">${groups[gi] !== null ? `<legend><i class="s${gi + 1}"></i>${esc(groups[gi])}${bush ? ` <small>«${esc(bush.name)}»</small>` : ''}</legend>` : ''}
        <div class="exp-fields">${spec.fields.map(f => fieldHtml(f, gi)).join('')}</div>
        ${spec.photo ? `<div class="exp-ph-row">${ph ? `<span class="exp-ph"><img data-photo="${ph}" alt="Фото к записи"></span>` : ''}<button class="g-link" type="button" data-ex-photo="${gi}">${h.icon('camera')}${ph ? 'Другое фото' : 'Фото'}</button></div>` : ''}
      </fieldset>`;
    };

    /* the chart: the reader's points and line per group, the model's dashed line */
    function timeChart(host, run) {
      const Y = spec.y;
      const lastStep = def.steps[def.steps.length - 1].h / (unit === 'd' ? 24 : 1);
      const xs = run.recs.map(r => expX(run, r.at, unit));
      const xMax = Math.max(lastStep, ...xs, 1) * 1.04;
      const series = [], dots = [];
      groups.forEach((g, gi) => {
        if (spec.model) {
          const pts = [];
          for (let i = 0; i <= 80; i++) { const t = xMax * i / 80, v = spec.model(gi, t, run.cfg || {}); if (v !== null && isFinite(v)) pts.push([t, v]); }
          if (pts.length) series.push({ pts, cls: `s${gi + 1}`, dash: true });
        }
        const mine = expSeries(run, gi, Y.k, unit).map(([x, v]) => [x, Y.of ? Y.of(v, run) : v]);
        if (mine.length > 1) series.push({ pts: mine, cls: `s${gi + 1}` });
        mine.forEach(([x, v]) => dots.push([x, v, `s${gi + 1}`]));
      });
      expPlot(host, { label: `${def.title}: ваши записи и модель`, pad: Y.pad, x: [0, xMax], y: [Y.lo, Y.hi], xticks: expTimeTicks(xMax, unit), yticks: Y.ticks, fx: expFx(unit), fy: Y.fy || (v => fmt(v, 0)), ylab: Y.lab, xlab: unit === 'd' ? 'день опыта' : 'часов от начала', series, dots });
    }

    // a value as the record list says it
    const valText = (f, v) => (f.type === 'scale' ? f.opts[v] : f.type === 'color' ? (v ? `<i class="exp-dot" style="background:var(--ph-${v})"></i>как pH ${v}` : 'не окрасился') : `${f.short || f.label.toLowerCase()} ${nfmt(v)}${f.unit ? ' ' + f.unit : ''}`);
    // the records of one moment (one form, every group) in one line, the time from the start in front
    function recRows(run) {
      const byTime = new Map();
      run.recs.slice().sort((a, b) => a.at - b.at || a.g - b.g).forEach(r => { const k = Math.floor(r.at / 60000); if (!byTime.has(k)) byTime.set(k, []); byTime.get(k).push(r); });
      return [...byTime.values()].map(rs => {
        const hrs = Math.max(0, (rs[0].at - run.t0) / 3600e3);
        const t = unit === 'd' ? `${Math.round(hrs / 24)}-й день` : sinceText(hrs);
        const parts = rs.map(r => `<span class="exp-rec-g">${groups[0] !== null ? `<i class="s${r.g + 1}"></i>${esc(groups[r.g] || '')}: ` : ''}${spec.fields.filter(f => r.v[f.k] !== undefined && r.v[f.k] !== null && r.v[f.k] !== '').map(f => valText(f, r.v[f.k])).join(', ')}${r.ph ? ` <button class="exp-rec-ph" type="button" data-ex-show="${r.ph}"><img data-photo="${r.ph}" alt="Фото к записи"></button>` : ''}</span>`).join('');
        return `<li><span class="exp-rec-t">${t}</span><span class="exp-rec-v">${parts}</span><button class="g-log-x" type="button" data-ex-del="${rs.map(r => `${r.at}-${r.g}`).join(',')}" aria-label="Удалить запись">${h.icon('close')}</button></li>`;
      });
    }

    function render() {
      const { run, past } = state();
      let html = title;
      if (!run) {
        html += `<div class="exp-start">
          ${spec.cfg ? `<div class="exp-fields">${spec.cfg.map(c => `<label class="exp-f" for="ex-${spec.id}-cfg-${c.k}"><span class="exp-l">${c.label}</span><span class="exp-in"><input id="ex-${spec.id}-cfg-${c.k}" type="number" inputmode="decimal" min="${c.min}" max="${c.max}" step="${c.step || 1}" data-cfg="${c.k}" value="${cfgDraft[c.k] !== undefined ? cfgDraft[c.k] : c.def}">${c.unit ? `<i>${c.unit}</i>` : ''}</span></label>`).join('')}</div>` : ''}
          ${spec.bushes ? `<div class="exp-fields">${groups.map((g, gi) => `<label class="exp-f" for="ex-${spec.id}-bush-${gi}"><span class="exp-l">${esc(g)}</span><select id="ex-${spec.id}-bush-${gi}" data-bush="${gi}"><option value="">не из «Моего базилика»</option>${G.load().plants.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label>`).join('')}</div>` : ''}
          <button class="btn btn-primary btn-small" type="button" data-ex-start>${h.icon('flask')}${past.length ? 'Начать снова' : 'Начать опыт'}</button>
          <p class="exp-hint">Шаги опыта появятся среди дел «Моего базилика» — гид напомнит, когда пора смотреть и записывать.</p>
        </div>`;
      } else {
        const st = G.exps.step(run);
        const done = run.done || [];
        html += `<div class="exp-run">
          <p class="exp-since">Идёт с ${whenText(run.t0)} — ${sinceText(st.hrs)}</p>
          <ol class="exp-steps">${(() => {
            // the steps done fold into one line; then the one due now and the next two; the rest is counted
            const shown = def.steps.map((s, i) => i).filter(i => !done.includes(i) && i >= st.cur && (i === st.cur || i > st.last));
            const head = shown.slice(0, st.cur >= 0 ? 3 : 2), rest = shown.slice(head.length);
            const doneN = done.length;
            return (doneN ? `<li class="is-done"><span class="exp-step-t">готово</span><span>${doneN} ${h.plural(doneN, 'шаг', 'шага', 'шагов')} из ${def.steps.length}</span></li>` : '') +
              head.map(i => { const s = def.steps[i], at = run.t0 + s.h * 3600e3; return `<li class="${i === st.cur ? 'is-now' : 'is-later'}"><span class="exp-step-t">${i === st.cur ? 'сейчас' : whenText(at)}</span><span><b>${esc(s.title)}</b>${i === st.cur ? `<small>${h.nb(s.text)}</small>` : ''}</span></li>`; }).join('') +
              (rest.length ? `<li class="is-later"><span class="exp-step-t">дальше</span><span>ещё ${rest.length} ${h.plural(rest.length, 'шаг', 'шага', 'шагов')}, последний — ${whenText(run.t0 + def.steps[rest[rest.length - 1]].h * 3600e3)}</span></li>` : '');
          })()}</ol>
          <form class="exp-form" data-ex-form novalidate>
            ${groups.map((g, gi) => groupForm(gi, run)).join('')}
            <div class="exp-form-a"><label class="exp-f exp-when" for="ex-${spec.id}-at"><span class="exp-l">Когда</span><input id="ex-${spec.id}-at" type="datetime-local" value="${localISO(Date.now())}" max="${localISO(Date.now() + 60000)}"></label><button class="btn btn-primary btn-small" type="submit">Записать</button></div>
          </form>
          ${run.recs.length ? `<ul class="exp-recs">${recRows(run).join('')}</ul>` : '<p class="exp-hint">Записей пока нет. Первая — сразу после начала: какими были листья, семена или горшок.</p>'}
          <figure class="exp-chart"><div data-ex-chart></div>${legend()}</figure>
          <div class="exp-verdict" aria-live="polite">${spec.verdict(run) || ''}</div>
          <div class="exp-run-a"><button class="btn btn-ghost btn-small" type="button" data-ex-end>${h.icon('check')}Закончить опыт</button><button class="g-link" type="button" data-ex-cancel>Отменить опыт</button></div>
        </div>`;
      }
      if (past.length) {
        html += `<div class="exp-past"><h5>Прошлые опыты</h5>${past.slice(0, 5).map((r, i) => `<details class="exp-past-run"${!run && i === 0 ? ' open' : ''}><summary>${whenText(r.t0)} — ${sinceText((r.end - r.t0) / 3600e3)}</summary><div class="exp-past-body"><figure class="exp-chart"><div data-ex-past="${esc(r.id)}"></div>${legend()}</figure><div class="exp-verdict">${r.verdict || spec.verdict(r) || ''}</div></div></details>`).join('')}</div>`;
      }
      el.innerHTML = html;
      el.appendChild(shot);
      G.photos.fill(el);
      const draw = (host, r) => { if (host) (spec.draw ? spec.draw(host, r) : timeChart(host, r)); };
      if (run) draw($('[data-ex-chart]', el), run);
      past.slice(0, 5).forEach(r => draw($(`[data-ex-past="${r.id}"]`, el), r));
    }

    const save = s => G.save(s);
    el.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.f !== undefined) { const gi = +t.dataset.g; draft[gi] = draft[gi] || {}; draft[gi][t.dataset.f] = t.value === '' ? null : +t.value; }
      if (t.dataset.cfg) cfgDraft[t.dataset.cfg] = t.value;
    });
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-f][data-v], [data-ex-start], [data-ex-end], [data-ex-cancel], [data-ex-del], [data-ex-photo], [data-ex-show]');
      if (!t) return;
      if (t.matches('[data-f][data-v]')) {
        const gi = +t.dataset.g, v = +t.dataset.v;
        draft[gi] = draft[gi] || {};
        draft[gi][t.dataset.f] = draft[gi][t.dataset.f] === v ? null : v;
        $$(`[data-f="${t.dataset.f}"][data-g="${gi}"]`, el).forEach(b => b.setAttribute('aria-pressed', String(draft[gi][t.dataset.f] === +b.dataset.v)));
      } else if (t.matches('[data-ex-start]')) {
        const s = G.load(), cfg = {};
        (spec.cfg || []).forEach(c => { const inp = $(`[data-cfg="${c.k}"]`, el); const v = inp ? +String(inp.value).replace(',', '.') : c.def; cfg[c.k] = isFinite(v) ? clamp(v, c.min, c.max) : c.def; });
        if (spec.bushes) cfg.plants = groups.map((g, gi) => { const sel = $(`[data-bush="${gi}"]`, el); return sel && sel.value ? sel.value : null; });
        s.exps = (s.exps || []).filter(x => !(x.exp === spec.id && !x.end));
        const now = Date.now();
        s.exps.push({ id: expRid(), exp: spec.id, start: localISO(now), t0: now, cfg, recs: [], done: [] });
        draft = {};
        save(s);
        if (window.BasilHaptics) window.BasilHaptics.success();
      } else if (t.matches('[data-ex-end]')) {
        const { s } = state(), run = (s.exps || []).find(x => x.exp === spec.id && !x.end);
        if (!run) return;
        run.end = Date.now();
        run.verdict = spec.verdict(run) || '';
        save(s);
      } else if (t.matches('[data-ex-cancel]')) {
        const { s } = state(), run = (s.exps || []).find(x => x.exp === spec.id && !x.end);
        if (!run || !window.confirm('Отменить опыт и стереть его записи?')) return;
        run.recs.forEach(r => { if (r.ph) G.photos.forget(r.ph); });
        s.exps = s.exps.filter(x => x !== run);
        draft = {};
        save(s);
      } else if (t.matches('[data-ex-del]')) {
        const { s } = state(), run = (s.exps || []).find(x => x.exp === spec.id && !x.end);
        if (!run) return;
        const keys = new Set(t.dataset.exDel.split(','));
        run.recs.filter(x => keys.has(`${x.at}-${x.g}`)).forEach(x => { if (x.ph) G.photos.forget(x.ph); });
        run.recs = run.recs.filter(x => !keys.has(`${x.at}-${x.g}`));
        save(s);
      } else if (t.matches('[data-ex-photo]')) {
        photoFor = +t.dataset.exPhoto;
        shot.click();
      } else if (t.matches('[data-ex-show]')) {
        G.photos.show(t.dataset.exShow, def.title);
      }
    });
    shot.addEventListener('change', async () => {
      const f = shot.files && shot.files[0], gi = photoFor;
      shot.value = '';
      if (!f || gi === null) return;
      try {
        const id = await G.photos.add(f);
        draft[gi] = draft[gi] || {};
        if (draft[gi].ph) G.photos.forget(draft[gi].ph);
        draft[gi].ph = id;
        render();
      } catch (err) { /* no room for photos in this browser: the record goes without */ }
    });
    el.addEventListener('submit', e => {
      if (!e.target.matches('[data-ex-form]')) return;
      e.preventDefault();
      const { s } = state(), run = (s.exps || []).find(x => x.exp === spec.id && !x.end);
      if (!run) return;
      const atIn = $(`#ex-${spec.id}-at`, el);
      let at = fromLocal(atIn && atIn.value);
      if (!isFinite(at) || at > Date.now() + 60000) at = Date.now();
      at = Math.max(at, run.t0);
      let n = 0;
      groups.forEach((g, gi) => {
        const d = draft[gi] || {}, v = {};
        spec.fields.forEach(f => { if (d[f.k] !== undefined && d[f.k] !== null && isFinite(d[f.k])) v[f.k] = f.max !== undefined ? clamp(d[f.k], f.min !== undefined ? f.min : -Infinity, f.max) : d[f.k]; });
        if (!Object.keys(v).length && !d.ph) return;
        const rec = { at: at + gi, g: gi, v };
        if (d.ph) rec.ph = d.ph;
        run.recs.push(rec);
        n++;
        // a measure of a bush from «Мой базилик» goes into its diary too
        const pid = spec.bushes && run.cfg.plants && run.cfg.plants[gi];
        const p = pid && s.plants.find(x => x.id === pid);
        if (p && spec.diary) [].concat(spec.diary(v) || []).forEach(entry => { p.log = p.log || []; p.log.push(Object.assign({ d: localISO(at).slice(0, 10) }, entry)); });
      });
      if (!n) { const first = $('[data-f]', el); if (first) first.focus(); return; }
      // the step whose time has come is done by this record
      const st = G.exps.step(run, at);
      if (st.last >= 0) run.done = [...new Set([...(run.done || []), st.last])];
      draft = {};
      save(s);
      if (window.BasilHaptics) window.BasilHaptics.success();
    });
    G.on(render);
    render();
  }
