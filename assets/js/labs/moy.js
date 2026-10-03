/* Гид по базилику — живые модели главы «Мой базилик». Файл собирает scripts/build.py из src/labs/moy/ — правьте там */
(() => {
  'use strict';
  const { register, illustrate, api: h } = window.BasilScience;
  const S = window.BasilScene;
  const { $, $$, clamp, lerp, fmt, fmt0, esc } = h;
  const NS = 'http://www.w3.org/2000/svg';
  const r1 = v => Math.round(v * 10) / 10;
  const pct = v => `${fmt0(v * 100)} %`;
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const set = (root, id, html) => { const e = $('#' + id, root); if (e) e.innerHTML = html; };
  const doyToday = () => { const t = new Date(); return Math.round((t - new Date(t.getFullYear(), 0, 0)) / 864e5); };
  const doyLabel = n => { const d = new Date(2023, 0, n); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
  const citiesChips = (id, lat) => h.chipsHtml(id, 'Город', h.CITIES.map(([l, n]) => [l, n]), lat);

  const { agro } = window.BasilLibs;
  window.BasilScience.styleFor("moy", "/* the frame of every experiment (_shared.js): start, steps, the form, records, the chart, the conclusion */\n.exp-start, .exp-run { display: grid; gap: 14px; }\n.exp-hint { margin: 0; font-size: .84rem; line-height: 1.45; color: var(--ink-3); }\n.exp-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap: 10px 14px; }\n.exp-f { display: grid; gap: 4px; min-width: 0; }\n.exp-l { font: 700 .8rem/1.3 var(--font-body); color: var(--ink-2); }\n.exp-l small { font-weight: 500; color: var(--ink-3); }\n.exp-in { display: flex; align-items: center; gap: 6px; }\n.exp-in input, .exp-f select, .exp-when input {\n  flex: 1 1 auto;\n  width: 100%;\n  min-width: 0;\n  min-height: 44px;\n  padding: 9px 11px;\n  border: 1px solid var(--line-strong);\n  border-radius: var(--radius-sm);\n  background: var(--surface);\n  color: var(--ink);\n  font: 500 1rem/1.2 var(--font-body);\n}\n.exp-in i { flex: none; font: 600 .82rem/1 var(--font-body); font-style: normal; color: var(--ink-3); }\n.exp-start .btn { justify-self: start; }\n.exp-since { margin: 0; font: 600 .86rem/1.3 var(--font-body); color: var(--ink-2); }\n\n/* the steps on a timeline */\n.exp-steps { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }\n.exp-steps li { display: grid; grid-template-columns: 8.4em minmax(0, 1fr); gap: 10px; padding: 6px 0; border-bottom: 1px dashed var(--line-strong); font-size: .86rem; line-height: 1.35; }\n.exp-step-t { font: 500 .74rem/1.5 var(--font-mono); color: var(--ink-3); }\n.exp-steps b { font-weight: 600; }\n.exp-steps small { display: block; margin-top: 2px; font-size: .82rem; color: var(--ink-2); }\n.exp-steps .is-done { color: var(--ink-3); }\n.exp-steps .is-done b { font-weight: 500; text-decoration: line-through; text-decoration-color: var(--line-strong); }\n.exp-steps .is-now .exp-step-t { color: var(--sci-chem); font-weight: 700; }\n.exp-steps .is-now b { color: var(--ink); }\n.exp-steps .is-missed { color: var(--ink-3); }\n\n/* the form: a fieldset for each group, in its series colour */\n.exp-form { display: grid; gap: 10px; }\n.exp-group { display: grid; gap: 10px; min-width: 0; margin: 0; padding: 10px 12px 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface-2); }\n.exp-group legend { display: flex; align-items: center; gap: 6px; padding: 0 4px; font: 700 .86rem/1.3 var(--font-body); color: var(--ink); }\n.exp-group legend small { font-weight: 500; color: var(--ink-3); }\n.exp-group legend i, .exp-legend i, .exp-recs i[class^=\"s\"] { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }\n.exp-run i.s1, .exp-past i.s1, .exp-start i.s1 { background: var(--ser-1); }\n.exp-run i.s2, .exp-past i.s2, .exp-start i.s2 { background: var(--ser-2); }\n.exp-run i.s3, .exp-past i.s3, .exp-start i.s3 { background: var(--ser-3); }\n.exp-seg { display: flex; flex-wrap: wrap; width: 100%; border-radius: 16px; }\n.exp-seg button { flex: 1 1 auto; min-height: 40px; }\n.exp-swatches { display: flex; flex-wrap: wrap; gap: 6px; }\n.exp-sw { width: 36px; height: 36px; padding: 0; border: 2px solid var(--surface); border-radius: 50%; box-shadow: 0 0 0 1px var(--line-strong); cursor: pointer; }\n.exp-sw[aria-pressed=\"true\"] { box-shadow: 0 0 0 3px var(--ink); }\n.exp-sw-none { width: auto; height: 36px; padding: 0 12px; border-radius: 999px; background: var(--surface); color: var(--ink-2); font: 600 .78rem/1 var(--font-body); }\n.exp-ph-row { display: flex; align-items: center; gap: 10px; }\n.exp-ph-row .g-link { display: inline-flex; align-items: center; gap: 6px; }\n.exp-ph-row .ico { width: 16px; height: 16px; }\n.exp-ph, .exp-rec-ph { display: inline-block; width: 44px; height: 44px; padding: 0; overflow: hidden; vertical-align: middle; border: 1px solid var(--line); border-radius: 10px; background: var(--surface-2); }\n.exp-rec-ph { width: 32px; height: 32px; margin-left: 6px; border-radius: 8px; cursor: pointer; }\n.exp-ph img, .exp-rec-ph img { width: 100%; height: 100%; object-fit: cover; }\n.exp-form-a { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; }\n.exp-when { flex: 1 1 220px; }\n.exp-form-a .btn { flex: none; }\n\n/* the records */\n.exp-recs { display: grid; margin: 0; padding: 0; list-style: none; }\n.exp-recs li { display: grid; grid-template-columns: 6.2em minmax(0, 1fr) 32px; gap: 10px; align-items: center; padding: 5px 0; border-bottom: 1px solid var(--line); font-size: .86rem; line-height: 1.35; }\n.exp-rec-t { font: 500 .74rem/1.3 var(--font-mono); color: var(--ink-3); }\n.exp-recs i[class^=\"s\"] { margin-right: 4px; }\n.exp-dot { display: inline-block; width: 12px; height: 12px; margin-right: 4px; border-radius: 50%; vertical-align: -1px; }\n\n/* the chart and its legend */\n.exp-chart { margin: 0; min-width: 0; }\n.exp-chart figcaption { margin: 8px 0 2px; font: 600 .8rem/1.3 var(--font-body); color: var(--ink-3); }\n.exp-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 4px 0 0; font-size: .8rem; color: var(--ink-2); }\n.exp-legend span { display: inline-flex; align-items: center; gap: 6px; }\n.exp-legend i.is-model { width: 18px; height: 0; border-radius: 0; border-top: 2px dashed var(--ink-3); }\n.exp-verdict p { margin: 0 0 8px; font-size: .9rem; line-height: 1.55; color: var(--ink-2); }\n.exp-verdict b { color: var(--ink); }\n.exp-run-a { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }\n\n/* «Лист-лакмус»: three glasses, the model's colour and the reader's */\n.exp-litmus { display: grid; grid-template-columns: minmax(0, 1fr) 96px 96px; gap: 8px 10px; align-items: center; }\n.exp-litmus > b { font: 600 .74rem/1.2 var(--font-body); color: var(--ink-3); text-align: center; }\n.exp-lt-g { font: 600 .9rem/1.2 var(--font-body); }\n.exp-lt-sw { display: grid; place-items: end center; height: 54px; padding-bottom: 4px; border-radius: 12px; border: 1px solid var(--line); }\n.exp-lt-sw small { padding: 1px 6px; border-radius: 6px; background: color-mix(in srgb, var(--surface) 80%, transparent); font: 600 .7rem/1.3 var(--font-mono); color: var(--ink); }\n.exp-lt-sw.is-empty, .exp-lt-sw.is-none { background: var(--surface-2); border-style: dashed; }\n\n/* the history */\n.exp-past { display: grid; gap: 8px; margin-top: 18px; }\n.exp-past h5 { margin: 0; font: 700 .74rem/1.2 var(--font-body); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }\n.exp-past-run { border: 1px solid var(--line); border-radius: 12px; background: var(--surface-2); }\n.exp-past-run > summary { min-height: 40px; padding: 10px 12px; font: 600 .86rem/1.3 var(--font-body); cursor: pointer; }\n.exp-past-body { padding: 0 12px 12px; }\n.exp-rec-v { display: grid; gap: 2px; min-width: 0; }\n.exp-rec-g { display: block; }\n.exp-seg { display: grid; grid-template-columns: repeat(auto-fit, minmax(6.5em, 1fr)); }\n/* «Погода глазами листа»: the place, the week, 48 hours */\n.wx-body { display: grid; gap: 16px; }\n.wx-find { display: grid; gap: 8px; }\n.wx-find label { font: 700 .82rem/1.2 var(--font-body); color: var(--ink-2); }\n.wx-find-row { display: flex; flex-wrap: wrap; gap: 8px; }\n.wx-find-row input {\n  flex: 1 1 220px;\n  min-width: 0;\n  min-height: 46px;\n  padding: 11px 12px;\n  border: 1px solid var(--line-strong);\n  border-radius: var(--radius-sm);\n  background: var(--surface);\n  color: var(--ink);\n  font: 500 1rem/1.2 var(--font-body);\n}\n.wx-found { display: grid; gap: 6px; margin: 4px 0 0; padding: 0; list-style: none; }\n.wx-pick {\n  display: grid;\n  width: 100%;\n  min-height: 44px;\n  padding: 8px 12px;\n  border: 1px solid var(--line);\n  border-radius: 12px;\n  background: var(--surface-2);\n  color: var(--ink);\n  font: 600 .92rem/1.25 var(--font-body);\n  text-align: left;\n  cursor: pointer;\n}\n.wx-pick small { font-weight: 500; font-size: .78rem; color: var(--ink-3); }\n.wx-pick:hover { border-color: var(--basil); }\n.wx-msg { margin: 0; font-size: .86rem; color: var(--ink-2); }\n.wx-find .g-link { justify-self: start; }\n\n.wx-place { display: grid; gap: 2px; }\n.wx-place p { margin: 0; }\n.wx-place b { font: 600 1.25rem/1.2 var(--font-display); }\n.wx-place small { color: var(--ink-3); font-size: .82rem; }\n.wx-age { font-size: .8rem; color: var(--ink-3); }\n.wx-place-a { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 4px; }\n\n/* the week: a row of days that scrolls sideways on a phone */\n.wx-days { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(118px, 1fr); gap: 8px; margin: 0; padding: 0 0 4px; overflow-x: auto; list-style: none; scrollbar-width: thin; }\n.wx-day {\n  display: grid;\n  gap: 4px;\n  align-content: start;\n  padding: 10px;\n  border: 1px solid var(--line);\n  border-radius: 14px;\n  background: var(--surface);\n  font-size: .82rem;\n}\n.wx-dname { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 6px; font: 700 .86rem/1.2 var(--font-body); }\n.wx-dname small { font: 500 .72rem/1.4 var(--font-mono); color: var(--ink-3); }\n.wx-n, .wx-x { display: flex; justify-content: space-between; gap: 6px; font: 700 .92rem/1.2 var(--font-body); white-space: nowrap; }\n.wx-n small, .wx-x small { font: 500 .72rem/1.5 var(--font-body); color: var(--ink-3); }\n.wx-r, .wx-s { display: flex; align-items: center; gap: 4px; min-height: 18px; color: var(--ink-2); }\n.wx-r .ico, .wx-s .ico { width: 13px; height: 13px; flex: none; }\n.wx-r .ico { color: var(--wx-rain); }\n.wx-s .ico { color: var(--oil-bright); }\n.wx-vpd { justify-self: start; padding: 2px 7px; border-radius: 999px; font: 600 .72rem/1.4 var(--font-mono); color: var(--ink); }\n.wx-vpd.z0 { background: var(--z0); } .wx-vpd.z1 { background: var(--z1); } .wx-vpd.z2 { background: var(--z2); } .wx-vpd.z3 { background: var(--z3); } .wx-vpd.z4 { background: var(--z4); }\n.wx-day.is-cold { border-color: var(--wx-cold); background: var(--wx-cold-soft); }\n.wx-day.is-cold .wx-n { color: var(--wx-cold); }\n.wx-day.is-frost { border-color: var(--wx-frost); background: var(--wx-cold-soft); }\n.wx-day.is-frost .wx-n { color: var(--wx-frost); }\n.wx-day.is-hot { border-color: var(--wx-hot); }\n.wx-day.is-hot .wx-x { color: var(--wx-hot); }\n.wx-day.is-hot:not(.is-cold):not(.is-frost) { background: var(--wx-hot-soft); }\n\n/* what the day's air is for a leaf */\n.wx-leaf { padding: 14px 16px; border-radius: 16px; background: var(--sci-phys-soft); }\n.wx-leaf h4 { margin: 0 0 6px; font: 700 .9rem/1.25 var(--font-body); color: var(--sci-phys); }\n.wx-leaf p { margin: 0; font-size: .9rem; line-height: 1.5; color: var(--ink-2); }\n\n.wx-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 14px; }\n.wx-chart { margin: 0; min-width: 0; }\n.wx-chart figcaption { margin-bottom: 2px; font: 600 .8rem/1.3 var(--font-body); color: var(--ink-3); }\n.lab-svg .band.is-hot { fill: var(--wx-hot-soft); }\n.lab-svg .band.wx-z0 { fill: var(--z0); opacity: .35; } .lab-svg .band.wx-z1 { fill: var(--z1); opacity: .35; } .lab-svg .band.wx-z2 { fill: var(--z2); opacity: .35; }\n.lab-svg .band.wx-z3 { fill: var(--z3); opacity: .35; } .lab-svg .band.wx-z4 { fill: var(--z4); opacity: .35; }\n.wx-src { margin: 0; font-size: .76rem; color: var(--ink-3); }\n\n/* the tab's text under the model */\n.wx-about { margin-top: 26px; }\n\n");
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

  // one chart of an experiment: series (dashed — the model), dots of the reader's records
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
        return `<div class="exp-f"><span class="exp-l" id="${id}-l">${f.label}</span><div class="exp-swatches" role="group" aria-labelledby="${id}-l">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => `<button type="button" class="exp-sw" style="background:var(--ph-${n})" data-f="${f.k}" data-g="${gi}" data-v="${n}" aria-pressed="${String(v === n)}" aria-label="цвет как при pH ${n}"></button>`).join('')}<button type="button" class="exp-sw exp-sw-none" data-f="${f.k}" data-g="${gi}" data-v="0" aria-pressed="${String(v === 0)}">не окрасился</button></div></div>`;
      }
      return `<label class="exp-f" for="${id}"><span class="exp-l">${f.label}${f.optional ? ' <small>если есть</small>' : ''}</span><span class="exp-in"><input id="${id}" type="number" inputmode="${f.type === 'count' ? 'numeric' : 'decimal'}" min="${f.min !== undefined ? f.min : 0}" max="${f.max !== undefined ? f.max : 9999}" step="${f.step || 1}" data-f="${f.k}" data-g="${gi}" value="${v !== undefined && v !== null ? v : ''}">${f.unit ? `<i>${f.unit}</i>` : ''}</span></label>`;
    }
    const groupForm = (gi, run) => {
      const ph = (draft[gi] || {}).ph;
      const bush = spec.bushes && run.cfg && run.cfg.plants && run.cfg.plants[gi] ? G.load().plants.find(p => p.id === run.cfg.plants[gi]) : null;
      return `<fieldset class="exp-group exp-g${gi + 1}">${groups[gi] !== null ? `<legend><i class="s${gi + 1}"></i>${esc(groups[gi])}${bush ? ` <small>«${esc(bush.name)}»</small>` : ''}</legend>` : ''}
        <div class="exp-fields">${spec.fields.map(f => fieldHtml(f, gi)).join('')}</div>
        ${spec.photo ? `<div class="exp-ph-row">${ph ? `<span class="exp-ph"><img data-photo="${ph}" alt="Фото к записи"></span>` : ''}<button class="g-link" type="button" data-ex-photo="${gi}">${h.icon('camera')}${ph ? 'Другое фото' : 'Фото'}</button></div>` : ''}
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
      expPlot(host, { label: `${def.title}: ваши записи и модель`, pad: Y.pad, x: [0, xMax], y: [Y.lo, Y.hi], xticks: expTimeTicks(xMax, unit), yticks: Y.ticks, fx: expFx(unit), fy: Y.fy || (v => fmt(v, 0)), ylab: Y.lab, xlab: unit === 'd' ? 'день опыта' : 'часов от начала', series, dots });
    }

    // a value as the record list says it
    const valText = (f, v) => (f.type === 'scale' ? f.opts[v] : f.type === 'color' ? (v ? `<i class="exp-dot" style="background:var(--ph-${v})"></i>как pH ${v}` : 'не окрасился') : `${f.short || f.label.toLowerCase()} ${nfmt(v)}${f.unit ? ' ' + f.unit : ''}`);
    // the records of one moment (one form, every group) in one line, the time from the start in front
    function recRows(run) {
      const byTime = new Map();
      run.recs.slice().sort((a, b) => a.at - b.at || a.g - b.g).forEach(r => { const k = Math.floor(r.at / 60000); if (!byTime.has(k)) byTime.set(k, []); byTime.get(k).push(r); });
      return [...byTime.values()].map(rs => {
        const hrs = Math.max(0, (rs[0].at - run.t0) / 3600e3);
        const t = unit === 'd' ? `${Math.round(hrs / 24)}-й день` : sinceText(hrs);
        const parts = rs.map(r => `<span class="exp-rec-g">${groups[0] !== null ? `<i class="s${r.g + 1}"></i>${esc(groups[r.g] || '')}: ` : ''}${spec.fields.filter(f => r.v[f.k] !== undefined && r.v[f.k] !== null && r.v[f.k] !== '').map(f => valText(f, r.v[f.k])).join(', ')}${r.ph ? ` <button class="exp-rec-ph" type="button" data-ex-show="${r.ph}"><img data-photo="${r.ph}" alt="Фото к записи"></button>` : ''}</span>`).join('');
        return `<li><span class="exp-rec-t">${t}</span><span class="exp-rec-v">${parts}</span><button class="g-log-x" type="button" data-ex-del="${rs.map(r => `${r.at}-${r.g}`).join(',')}" aria-label="Удалить запись">${h.icon('close')}</button></li>`;
      });
    }

    function render() {
      const { run, past } = state();
      let html = title;
      if (!run) {
        html += `<div class="exp-start">
          ${spec.cfg ? `<div class="exp-fields">${spec.cfg.map(c => `<label class="exp-f" for="ex-${spec.id}-cfg-${c.k}"><span class="exp-l">${c.label}</span><span class="exp-in"><input id="ex-${spec.id}-cfg-${c.k}" type="number" inputmode="decimal" min="${c.min}" max="${c.max}" step="${c.step || 1}" data-cfg="${c.k}" value="${cfgDraft[c.k] !== undefined ? cfgDraft[c.k] : c.def}">${c.unit ? `<i>${c.unit}</i>` : ''}</span></label>`).join('')}</div>` : ''}
          ${spec.bushes ? `<div class="exp-fields">${groups.map((g, gi) => `<label class="exp-f" for="ex-${spec.id}-bush-${gi}"><span class="exp-l">${esc(g)}</span><select id="ex-${spec.id}-bush-${gi}" data-bush="${gi}"><option value="">не из «Моего базилика»</option>${G.load().plants.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label>`).join('')}</div>` : ''}
          <button class="btn btn-primary btn-small" type="button" data-ex-start>${h.icon('flask')}${past.length ? 'Начать снова' : 'Начать опыт'}</button>
          <p class="exp-hint">Шаги опыта появятся среди дел «Моего базилика» — гид напомнит, когда пора смотреть и записывать.</p>
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
              (rest.length ? `<li class="is-later"><span class="exp-step-t">дальше</span><span>ещё ${rest.length} ${h.plural(rest.length, 'шаг', 'шага', 'шагов')}, последний — ${whenText(run.t0 + def.steps[rest[rest.length - 1]].h * 3600e3)}</span></li>` : '');
          })()}</ol>
          <form class="exp-form" data-ex-form novalidate>
            ${groups.map((g, gi) => groupForm(gi, run)).join('')}
            <div class="exp-form-a"><label class="exp-f exp-when" for="ex-${spec.id}-at"><span class="exp-l">Когда</span><input id="ex-${spec.id}-at" type="datetime-local" value="${localISO(Date.now())}" max="${localISO(Date.now() + 60000)}"></label><button class="btn btn-primary btn-small" type="submit">Записать</button></div>
          </form>
          ${run.recs.length ? `<ul class="exp-recs">${recRows(run).join('')}</ul>` : '<p class="exp-hint">Записей пока нет. Первая — сразу после начала: какими были листья, семена или горшок.</p>'}
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
        if (!run || !window.confirm('Отменить опыт и стереть его записи?')) return;
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

  /* @use agro */
  /* The weather tab of «Мой базилик»: the place, the week ahead for a basil leaf, and 48 hours of the temperature and
     of the air's pull on the leaf (VPD, zones as in the model «VPD»). The forecast is fetched and kept by the
     interface (BasilGarden.weather): this model only shows it and asks for a fresh one. */
  register('weather', el => {
    const G = window.BasilGarden, W = G && G.weather, D = window.BASIL;
    el.innerHTML = h.head('Погода глазами листа', 'Неделя для вашего места: холодные ночи, жара, дождь и то, как сильно воздух тянет воду из листа.') + '<div class="wx-body" id="wx-body"></div>';
    const body = $('#wx-body', el);
    if (!W) { body.innerHTML = '<p class="muted">Погода появится, когда страница загрузится полностью.</p>'; return; }
    const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const dayOf = iso => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
    const src = '<p class="wx-src">Погода: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>, CC&nbsp;BY&nbsp;4.0. Наружу уходят только координаты места.</p>';
    let found = [], msg = '', changing = false, busy = false;

    // the place: by name, or where the phone is
    const findForm = () => `<form class="wx-find" id="wx-find" novalidate>
        <label for="wx-q">${W.place() ? 'Другое место' : 'Где растёт ваш базилик'}</label>
        <div class="wx-find-row"><input id="wx-q" type="search" autocomplete="off" maxlength="60" placeholder="Город или посёлок, например Воронеж" enterkeyhint="search">
          <button class="btn btn-primary btn-small" type="submit">Найти</button>
          <button class="btn btn-ghost btn-small" type="button" data-wx-here>${h.icon('home')}Где я</button></div>
        ${found.length ? `<ul class="wx-found">${found.map((x, i) => `<li><button type="button" class="wx-pick" data-wx-pick="${i}"><b>${esc(x.name)}</b><small>${esc(x.region)}</small></button></li>`).join('')}</ul>` : ''}
        ${msg ? `<p class="wx-msg" role="status">${msg}</p>` : ''}
        ${W.place() ? '<button class="g-link" type="button" data-wx-cancel>Оставить прежнее место</button>' : ''}
      </form>`;

    // a day for a leaf: the night, the day, rain, sun and the afternoon air
    const dayCard = (d, i) => {
      const z = d.vpd === null ? null : agro.zoneOf(d.vpd);
      const date = dayOf(d.d);
      const cls = [d.min < 0.5 ? 'is-frost' : d.min < 10 ? 'is-cold' : '', d.max >= 30 ? 'is-hot' : ''].filter(Boolean).join(' ');
      return `<li class="wx-day ${cls}">
          <b class="wx-dname">${i === 0 ? 'сегодня' : i === 1 ? 'завтра' : WD[date.getDay()]}<small>${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}</small></b>
          <span class="wx-n"><small>ночь</small>${W.t(d.min)}</span>
          <span class="wx-x"><small>день</small>${W.t(d.max)}</span>
          <span class="wx-r">${d.rain >= 0.5 ? `${h.icon('drop')}${fmt(d.rain, d.rain < 10 ? 1 : 0)} мм` : '&nbsp;'}</span>
          <span class="wx-s">${d.sun !== null ? `${h.icon('sun')}${fmt0(d.sun)} ч` : '&nbsp;'}</span>
          ${z ? `<span class="wx-vpd ${z[1]}" title="VPD днём: ${z[2].toLowerCase()}">VPD ${fmt(d.vpd)}</span>` : ''}
        </li>`;
    };

    const render = () => {
      const w = W.place(), c = W.get();
      if (!w || changing) { body.innerHTML = findForm() + src; return; }
      const days = c ? c.days : [];
      const t0 = days[0];
      const z = t0 && t0.vpd !== null ? agro.zoneOf(t0.vpd) : null;
      const zi = z ? agro.VPD_Z.indexOf(z) : -1;
      body.innerHTML = `<div class="wx-place">
          <p><b>${esc(w.name)}</b>${w.region ? ` <small>${esc(w.region)}</small>` : ''}</p>
          <p class="wx-age" role="status">${busy ? 'Обновляется…' : c ? 'Прогноз получен ' + W.age(c.at) : 'Прогноза пока нет: нужна сеть'}${msg ? ' · ' + msg : ''}</p>
          <div class="wx-place-a"><button class="g-link" type="button" data-wx-refresh>Обновить</button><button class="g-link" type="button" data-wx-change>Другое место</button></div>
        </div>
        ${days.length ? `<ol class="wx-days">${days.map(dayCard).join('')}</ol>` : ''}
        ${zi >= 0 ? `<div class="wx-leaf"><h4>Сегодня для листа: ${z[2].toLowerCase()}</h4><p>${h.nb(D.WEATHER.leaf[zi])}</p></div>` : ''}
        ${c && c.hours.length > 6 ? `<div class="wx-charts"><figure class="wx-chart"><figcaption>Температура, 48 часов</figcaption><div id="wx-ch-t"></div></figure><figure class="wx-chart"><figcaption>Как воздух тянет воду из листа (VPD), 48 часов</figcaption><div id="wx-ch-v"></div></figure></div>` : ''}
        ${src}`;
      if (c && c.hours.length > 6) charts(c.hours);
    };

    // hours along x; a tick at midnight (the day's name) and at noon, at 6 and 18 too on a wide screen
    function charts(hours) {
      const n = hours.length;
      const ticks = w => hours.map((x, i) => [i, x.t.slice(11, 13)]).filter(([, hh]) => (w < 480 ? ['00', '12'] : ['00', '06', '12', '18']).includes(hh)).map(([i]) => i);
      const fx = i => { const t = hours[i].t, hh = t.slice(11, 13); return hh === '00' ? WD[dayOf(t).getDay()] : hh + ':00'; };
      const lo = Math.floor(Math.min(...hours.map(x => x.T)) / 5) * 5 - 5, hi = Math.ceil(Math.max(...hours.map(x => x.T)) / 5) * 5 + 5;
      const ty = []; for (let v = lo; v <= hi; v += (hi - lo > 30 ? 10 : 5)) ty.push(v);
      h.chart($('#wx-ch-t', body), {
        label: 'Температура воздуха на 48 часов вперёд',
        h: w => (w < 480 ? 190 : 220),
        draw(w, hh) {
          const bands = [];
          if (lo < 10) bands.push({ y0: lo, y1: Math.min(10, hi), cls: 'is-cold', label: 'ниже +10 °C — рост встаёт' });
          if (hi > 30) bands.push({ y0: Math.max(30, lo), y1: hi, cls: 'is-hot', label: 'жара' });
          const P = h.plot({ w, h: hh, x: [0, n - 1], y: [lo, hi], xticks: ticks(w), yticks: ty, fx, fy: v => (v > 0 ? '+' : '') + h.minus(String(v)) + '°', ylab: '°C', hbands: bands, series: [{ pts: hours.map((x, i) => [i, x.T]), cls: 's1' }] });
          return P.s;
        }
      });
      const vmax = Math.max(2, Math.ceil(Math.max(...hours.map(x => x.vpd)) * 2) / 2);
      h.chart($('#wx-ch-v', body), {
        label: 'Дефицит давления пара для листа на 48 часов вперёд',
        h: w => (w < 480 ? 190 : 220),
        draw(w, hh) {
          const edges = [0, ...agro.VPD_Z.slice(0, 4).map(z => z[0]), vmax];
          const bands = agro.VPD_Z.map((z, i) => ({ y0: edges[i], y1: Math.min(edges[i + 1], vmax), cls: 'wx-' + z[1], label: i === 2 ? 'оптимум' : '' })).filter(b => b.y1 > b.y0);
          const yt = []; for (let v = 0; v <= vmax + 1e-9; v += vmax > 3 ? 1 : 0.5) yt.push(Math.round(v * 10) / 10);
          const P = h.plot({ w, h: hh, x: [0, n - 1], y: [0, vmax], xticks: ticks(w), yticks: yt, fx, fy: v => fmt(v), ylab: 'кПа', hbands: bands, series: [{ pts: hours.map((x, i) => [i, x.vpd]), cls: 's2' }] });
          return P.s;
        }
      });
    }

    body.addEventListener('submit', e => {
      if (e.target.id !== 'wx-find') return;
      e.preventDefault();
      const q = $('#wx-q', body).value.trim();
      if (q.length < 2) { $('#wx-q', body).focus(); return; }
      msg = 'Ищу…';
      render();
      W.search(q).then(list => { found = list; msg = list.length ? '' : 'Ничего не нашлось — попробуйте написать иначе или ближайший город'; render(); },
        () => { found = []; msg = 'Нет связи с сервисом погоды — попробуйте позже'; render(); });
    });
    body.addEventListener('click', e => {
      const t = e.target.closest('[data-wx-pick], [data-wx-here], [data-wx-refresh], [data-wx-change], [data-wx-cancel]');
      if (!t) return;
      if (t.matches('[data-wx-pick]')) {
        const p = found[+t.dataset.wxPick];
        if (!p) return;
        found = []; msg = ''; changing = false; busy = true;
        render();
        W.set(p).then(() => { busy = false; render(); });
      } else if (t.matches('[data-wx-here]')) {
        msg = 'Узнаю место…';
        render();
        W.here().then(p => { found = []; msg = ''; changing = false; busy = true; render(); return W.set(p); }).then(() => { busy = false; render(); },
          () => { busy = false; msg = 'Не удалось узнать место: разрешите геолокацию или найдите город по названию'; render(); });
      } else if (t.matches('[data-wx-refresh]')) {
        busy = true; msg = '';
        render();
        const before = W.get();
        W.refresh(true).then(c => { busy = false; if (!c || c === before) msg = navigator.onLine === false ? 'нет сети' : 'сервис не ответил'; render(); });
      } else if (t.matches('[data-wx-change]')) {
        changing = true; found = []; msg = '';
        render();
        const q = $('#wx-q', body);
        if (q) q.focus();
      } else if (t.matches('[data-wx-cancel]')) {
        changing = false; found = []; msg = '';
        render();
      }
    });
    W.on(() => { if (!busy) render(); });
    render();
    if (W.place()) W.refresh();
  });

  /* «Лист-лакмус»: anthocyanin of a purple leaf as a pH indicator. The model «Фиолетовый базилик и pH» (chapter Вкус)
     gives the colours: water about pH 7, vinegar about 3, baking soda about 8; the reader picks the colour of each glass */
  register('exlitmus', el => experiment(el, {
    id: 'litmus',
    note: 'Краска фиолетового листа меняет цвет с кислотностью. Модель «Фиолетовый базилик и pH» знает, каким должен стать каждый стакан, — сравните со своими.',
    fields: [{ k: 'ph', label: 'Цвет настоя', type: 'color' }],
    photo: true,
    unit: 'h',
    legend: false,
    // three glasses: the colour the model expects and the one the reader saw
    draw(host, run) {
      const EXPECT = [7, 3, 8];
      const last = g => { const r = run.recs.filter(x => x.g === g && x.v.ph !== undefined).sort((a, b) => b.at - a.at)[0]; return r ? r.v.ph : null; };
      const groups = window.BASIL.EXPERIMENTS.find(x => x.id === 'litmus').groups;
      host.innerHTML = `<div class="exp-litmus" role="img" aria-label="Цвет настоя: что ждёт модель и что получилось">
        <span></span><b>ждёт модель</b><b>у вас</b>
        ${groups.map((g, i) => { const v = last(i); return `<span class="exp-lt-g">${esc(g)}</span><i class="exp-lt-sw" style="background:var(--ph-${EXPECT[i]})"><small>pH ≈ ${EXPECT[i]}</small></i>${v === null ? '<i class="exp-lt-sw is-empty"><small>ещё нет</small></i>' : v ? `<i class="exp-lt-sw" style="background:var(--ph-${v})"><small>как pH ${v}</small></i>` : '<i class="exp-lt-sw is-none"><small>не окрасился</small></i>'}`; }).join('')}
      </div>`;
    },
    verdict(run) {
      const last = g => { const r = run.recs.filter(x => x.g === g && x.v.ph !== undefined).sort((a, b) => b.at - a.at)[0]; return r ? r.v.ph : null; };
      const [w, a, b] = [0, 1, 2].map(last);
      if (w === null || a === null || b === null) return '<p>Запишите цвет всех трёх стаканов — гид сравнит их с моделью.</p>';
      if (!w && !a && !b) return h.nb('<p>Настой не окрасился — значит, лист был зелёным: антоцианов в нём почти нет, и показывать нечего. Возьмите фиолетовый сорт: краска есть только в нём.</p>');
      if (a < w && w <= b) return h.nb(`<p><b>Работает как лакмус.</b> Уксус дал цвет как при pH около ${a}, вода — около ${w}, сода — около ${b}; модель ждала около 3, 7 и 8. Молекула антоциана меняет форму вместе с кислотностью: в кислоте она красный заряженный катион, в нейтральной воде — фиолетовая, в щёлочи синеет и зеленеет.</p>`);
      return h.nb('<p>Цвета не выстроились по кислотности: возможно, настой слабый или уксуса и соды мало. Добавьте ещё по ложке, подождите минуту и запишите снова.</p>');
    }
  }));

  /* «Солёный огурец»: osmosis. A sprig in water keeps its turgor; in a salt solution the water leaves the cells for the side
     where more is dissolved. The model's line: the pull of the solution (agro.osmoticMPa) against a cell's own sap
     (agro.CELL_MPA) decides how fast the leaf goes limp */
  const OSMOS_FIRM = ['висит', 'мягкий', 'упругий', 'тугой'];
  register('exosmos', el => experiment(el, {
    id: 'osmos',
    note: 'Вода идёт туда, где растворено больше. Модель считает, с какой силой солёная вода тянет воду из клеток листа, и как скоро он сдастся.',
    cfg: [{ k: 'tsp', label: 'Соли на стакан 200 мл', unit: 'ч. л.', def: 1, min: 0.5, max: 3, step: 0.5 }],
    fields: [{ k: 'firm', label: 'Какой лист', type: 'scale', opts: OSMOS_FIRM }],
    photo: true,
    unit: 'h',
    y: { k: 'firm', lo: 0, hi: 3, ticks: [0, 1, 2, 3], fy: v => OSMOS_FIRM[v] || '', lab: '', pad: { l: 70 } },
    model(g, t, cfg) {
      if (g === 0) return 3;
      const drive = Math.max(0.1, agro.CELL_MPA - agro.osmoticMPa(30 * (cfg.tsp || 1)));
      return 3 * Math.exp(-t * drive / 6);
    },
    verdict(run) {
      const water = expSeries(run, 0, 'firm', 'h'), salt = expSeries(run, 1, 'firm', 'h');
      const psi = agro.osmoticMPa(30 * ((run.cfg && run.cfg.tsp) || 1));
      const pull = `Раствор тянет воду с силой около ${nfmt(psi)} МПа, а сок клетки — около ${nfmt(agro.CELL_MPA)} МПа: вода уходит из клетки наружу, и клетки опадают, как шарики, из которых выпустили воздух.`;
      if (!salt.length) return '<p>Запишите, какими листья были в начале, — и проверяйте их по шагам.</p>';
      const limp = salt.find(([, v]) => v <= 1);
      const wLast = water.length ? water[water.length - 1][1] : null;
      if (limp) return h.nb(`<p><b>Солёная вода забрала у листа упругость за ${nfmt(limp[0], limp[0] < 10 ? 1 : 0)} ч</b>${wLast !== null ? `, а в чистой воде он ${wLast >= 2 ? 'остался упругим' : 'тоже ослаб — возможно, веточка долго стояла без воды'}` : ''}. ${pull} Так же «обжигает» корни лишняя подкормка: грунт становится солонее корня, и куст вянет во влажной земле.</p>`);
      const lastT = salt[salt.length - 1][0];
      return h.nb(`<p>${lastT < 6 ? 'Пока лист в соли держится — осмос не мгновенный, проверьте через несколько часов.' : 'Лист в соли держится дольше, чем ждала модель: возможно, соли мало или стебель толстый и запасливый.'} ${pull}</p>`);
    }
  }));

  /* «Батарейка семени»: germination by thermal time. Two batches, warm and cool; the model (agro.germDays, the same as
     «Сколько ждать всходов» in chapter Посадка) gives the day half of the seeds show a root at each temperature */
  const germT = (cfg, g) => (g ? cfg.tB : cfg.tA);
  register('exgerm', el => experiment(el, {
    id: 'germ',
    note: 'Семя копит тепло выше 10,5 °C, как батарейка заряд: около 52 градусо-дней — и показывается корешок. Модель знает, когда это случится в тепле и в прохладе.',
    cfg: [
      { k: 'tA', label: 'Температура в тепле', unit: '°C', def: 24, min: 12, max: 35, step: 0.5 },
      { k: 'tB', label: 'Температура в прохладе', unit: '°C', def: 17, min: 11, max: 30, step: 0.5 },
      { k: 'n', label: 'Семян в каждом контейнере', unit: 'шт.', def: 10, min: 3, max: 50 }
    ],
    fields: [{ k: 'cnt', label: 'С корешком', type: 'count', unit: 'шт.', min: 0, max: 50, short: 'с корешком' }],
    unit: 'd',
    y: { k: 'cnt', lo: 0, hi: 100, ticks: [0, 25, 50, 75, 100], fy: v => `${v} %`, lab: 'проросло', of: (v, run) => 100 * v / ((run.cfg && run.cfg.n) || 10) },
    // most fresh seeds come up, not all: the line rises to 90 % around the day of a half
    model(g, t, cfg) {
      const t50 = agro.germDays(germT(cfg, g));
      return isFinite(t50) ? 90 / (1 + Math.exp(-(t - t50) / (0.2 * t50))) : 0;
    },
    verdict(run) {
      const cfg = run.cfg || {}, n = cfg.n || 10;
      const part = g => {
        const T = germT(cfg, g), pts = expSeries(run, g, 'cnt', 'd').map(([x, v]) => [x, 100 * v / n]);
        const t50 = expCross(pts, 50), m50 = agro.germDays(T), last = pts.length ? pts[pts.length - 1][1] : null;
        return { T, pts, t50, m50, last };
      };
      const [A, B] = [part(0), part(1)];
      if (!A.pts.length && !B.pts.length) return '<p>Каждый день считайте семена с корешком в обоих контейнерах — гид сравнит с моделью.</p>';
      const one = (name, x) => (x.t50 !== null ? `${name} (${nfmt(x.T)} °C) половина семян проросла к ${nfmt(x.t50)}-му дню — модель ждала ${nfmt(x.m50)}` : `${name} (${nfmt(x.T)} °C) пока проросло ${fmt0(x.last || 0)} %, модель ждёт половину к ${nfmt(x.m50)}-му дню`);
      let s = `<p>${one('В тепле', A)}; ${one('в прохладе', B).replace(/^В /, 'в ')}.</p>`;
      if (A.t50 !== null && B.t50 !== null) s += `<p><b>Тепло ускорило прорастание в ${nfmt(B.t50 / A.t50)} раза</b>, по модели — в ${nfmt(B.m50 / A.m50)}: каждый день при ${nfmt(A.T)} °C даёт семени ${nfmt(A.T - agro.GERM.Tb)} градусо-дня, а при ${nfmt(B.T)} °C — только ${nfmt(Math.max(0, B.T - agro.GERM.Tb))}.</p>`;
      const top = Math.max(A.last || 0, B.last || 0);
      if (top >= 50) s += `<p>Всего проросло до ${fmt0(top)} %: ${top >= 70 ? 'семена свежие и сильные.' : 'семена, похоже, старые — с годами всхожесть падает.'}</p>`;
      return h.nb(s);
    }
  }));

  /* «Растение потеет»: transpiration. The pot is weighed with its soil covered, so what it loses is what the leaves give
     to the air. Two charts: the weight over time, and how fast it falls against the air's pull on the leaf (VPD from the
     room's temperature and humidity, agro.vpd): the model is a straight line through zero */
  const sweatRates = run => {
    const pts = run.recs.filter(r => expVal(r, 'g') !== null).sort((a, b) => a.at - b.at);
    const vpdOf = r => (expVal(r, 't') !== null && expVal(r, 'rh') !== null ? agro.vpd(r.v.t, r.v.rh) : null);
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dt = (b.at - a.at) / 3600e3, loss = a.v.g - b.v.g;
      if (dt < 2 || loss < 0) continue; // a watering in between, or too short to tell
      const vs = [vpdOf(a), vpdOf(b)].filter(v => v !== null);
      out.push({ rate: loss / dt, vpd: vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : null, dt });
    }
    return out;
  };
  register('exsweat', el => experiment(el, {
    id: 'sweat',
    note: 'Лист испаряет воду, и сухой воздух тянет её сильнее. Если укрыть грунт, всё, что теряет горшок, — это вода, которую выпил и отдал воздуху куст.',
    fields: [
      { k: 'g', label: 'Вес горшка', type: 'number', unit: 'г', min: 0, max: 30000, step: 1, short: 'вес' },
      { k: 't', label: 'Температура в комнате', type: 'number', unit: '°C', min: -10, max: 45, step: 0.5, optional: true, short: 'воздух' },
      { k: 'rh', label: 'Влажность', type: 'number', unit: '%', min: 5, max: 100, step: 1, optional: true, short: 'влажность' }
    ],
    unit: 'h',
    legend: false,
    draw(host, run) {
      host.innerHTML = '<figcaption>Вес горшка</figcaption><div data-sw-a></div><figcaption>Как быстро уходит вода и как сух воздух</figcaption><div data-sw-b></div>';
      const w = expSeries(run, 0, 'g', 'h');
      const xMax = Math.max(96, ...w.map(p => p[0])) * 1.04;
      if (w.length) {
        const lo = Math.min(...w.map(p => p[1])), hi = Math.max(...w.map(p => p[1]));
        const span = Math.max(20, hi - lo), y0 = Math.floor((lo - span * 0.2) / 10) * 10, y1 = Math.ceil((hi + span * 0.2) / 10) * 10;
        const step = Math.max(10, Math.round((y1 - y0) / 4 / 10) * 10), yt = [];
        for (let v = y0; v <= y1; v += step) yt.push(v);
        expPlot($('[data-sw-a]', host), { label: 'Вес горшка по времени', pad: { l: 52 }, x: [0, xMax], y: [y0, y1], xticks: expTimeTicks(xMax, 'h'), yticks: yt, fx: expFx('h'), fy: v => fmt0(v), ylab: 'г', xlab: 'часов от начала', series: w.length > 1 ? [{ pts: w, cls: 's1' }] : [], dots: w.map(([x, v]) => [x, v, 's1']) });
      }
      const rates = sweatRates(run).filter(r => r.vpd !== null);
      if (rates.length) {
        const k = rates.reduce((s, r) => s + r.vpd * r.rate, 0) / rates.reduce((s, r) => s + r.vpd * r.vpd, 0);
        const vMax = Math.max(2, Math.ceil(Math.max(...rates.map(r => r.vpd)) * 2) / 2), rMax = Math.max(1, Math.ceil(Math.max(...rates.map(r => r.rate), k * vMax) * 1.15));
        const rt = []; for (let v = 0; v <= rMax + 1e-9; v += Math.max(1, Math.round(rMax / 4))) rt.push(v);
        const vt = []; for (let v = 0; v <= vMax + 1e-9; v += 0.5) vt.push(v);
        expPlot($('[data-sw-b]', host), { label: 'Скорость испарения в зависимости от VPD', x: [0, vMax], y: [0, rMax], xticks: vt, yticks: rt, fx: v => nfmt(v), fy: v => fmt0(v), ylab: 'г/ч', xlab: 'VPD, кПа', series: [{ pts: [[0, 0], [vMax, k * vMax]], cls: 's2', dash: true }], dots: rates.map(r => [r.vpd, r.rate, 's1']) });
      } else {
        $('[data-sw-b]', host).innerHTML = '<p class="exp-hint">Запишите вместе с весом температуру и влажность в комнате — и гид покажет, как скорость испарения зависит от сухости воздуха.</p>';
      }
    },
    verdict(run) {
      const w = expSeries(run, 0, 'g', 'h');
      if (w.length < 2) return '<p>Взвесьте горшок сейчас и потом утром и вечером — по разнице видно, сколько воды выпил и отдал воздуху куст.</p>';
      const rates = sweatRates(run);
      const hours = rates.reduce((s, r) => s + r.dt, 0), lost = rates.reduce((s, r) => s + r.rate * r.dt, 0);
      if (!hours) return '<p>Между взвешиваниями прошло мало времени или горшок полили — подождите хотя бы несколько часов.</p>';
      const perDay = lost / hours * 24;
      // «2 стакана», «5 стаканов», «2,5 стакана»
      const cups = n => { const r = Math.round(n * 10) / 10; return `${nfmt(r)} ${r % 1 ? 'стакана' : h.plural(r, 'стакан', 'стакана', 'стаканов')}`; };
      let s = `<p><b>Куст отдаёт воздуху около ${fmt0(perDay)} г воды в сутки</b> — это ${cups(perDay * 7 / 200)} по 200 мл в неделю. Почти вся вода, которую пьют корни, больше 95 %, уходит так: лист охлаждается испарением, как кожа потом, а уходящая вода тянет за собой следующую — от корней по стеблю, как сок по соломинке.</p>`;
      const dry = rates.filter(r => r.vpd !== null).sort((a, b) => a.vpd - b.vpd);
      if (dry.length >= 2 && dry[dry.length - 1].vpd - dry[0].vpd > 0.3) {
        const a = dry[0], b = dry[dry.length - 1];
        s += `<p>Чем суше воздух, тем быстрее: при VPD ${nfmt(a.vpd)} кПа куст терял ${nfmt(a.rate)} г в час, при ${nfmt(b.vpd)} — ${nfmt(b.rate)}. Поэтому у батареи, где воздух сухой, горшок сохнет заметно быстрее.</p>`;
      }
      return h.nb(s);
    }
  }));

  /* «Навигатор к свету»: phototropism. The top leans to the window over a day or two; the pot is turned at 48 h and the
     top comes round again. The model's line: the lean grows towards 35° with a time constant of a day, and after the
     turn starts from the other side */
  const LIGHT_TURN = 48, LIGHT_MAX = 35, LIGHT_TAU = 24;
  const lightModel = t => {
    if (t <= LIGHT_TURN) return LIGHT_MAX * (1 - Math.exp(-t / LIGHT_TAU));
    const at = LIGHT_MAX * (1 - Math.exp(-LIGHT_TURN / LIGHT_TAU));
    return -at + (at + LIGHT_MAX) * (1 - Math.exp(-(t - LIGHT_TURN) / LIGHT_TAU));
  };
  register('exlight', el => experiment(el, {
    id: 'light',
    note: 'Верхушка «видит» свет и растёт к нему: теневая сторона стебля вытягивается быстрее. Модель знает, как скоро она повернётся снова, если развернуть горшок.',
    fields: [{ k: 'deg', label: 'Наклон к окну (+) или от окна (−)', type: 'number', unit: '°', min: -90, max: 90, step: 5, short: 'наклон' }],
    photo: true,
    unit: 'h',
    y: { k: 'deg', lo: -60, hi: 60, ticks: [-60, -30, 0, 30, 60], fy: v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '°', lab: 'к окну' },
    model: (g, t) => lightModel(t),
    verdict(run) {
      const pts = expSeries(run, 0, 'deg', 'h');
      if (!pts.length) return '<p>Запишите наклон верхушки сейчас: прямо — 0°, к окну — со знаком плюс.</p>';
      const before = pts.filter(([t]) => t > 12 && t <= LIGHT_TURN + 1);
      const after = pts.filter(([t]) => t > LIGHT_TURN + 1);
      let s = '';
      if (before.length) { const [t, v] = before[before.length - 1]; s += `<p>За ${fmt0(t)} ч верхушка наклонилась на ${fmt0(v)}° ${v >= 0 ? 'к окну' : 'от окна'} — модель ждала около ${fmt0(lightModel(t))}°.</p>`; }
      const back = after.find(([, v]) => v >= 0);
      const mBack = LIGHT_TAU * Math.log((LIGHT_MAX * (1 - Math.exp(-LIGHT_TURN / LIGHT_TAU)) + LIGHT_MAX) / LIGHT_MAX);
      if (back) s += `<p><b>После поворота горшка верхушка снова встала к свету за ${fmt0(back[0] - LIGHT_TURN)} ч</b> — модель ждала около ${fmt0(mBack)}\u00a0ч. Свет ловит белок фототропин в кончике побега; гормон роста ауксин уходит на теневую сторону, и та растёт быстрее — стебель изгибается, как танк поворачивает, когда одна гусеница идёт быстрее другой.</p>`;
      else if (after.length) s += '<p>Верхушка ещё разворачивается — запишите наклон через несколько часов.</p>';
      else s += '<p>Через двое суток поверните горшок меткой от окна — и смотрите, как быстро верхушка найдёт свет снова.</p>';
      return h.nb(s);
    }
  }));

  /* «Начальник верхушки»: apical dominance on two of the reader's bushes. A is pinched at the start and again at day 21,
     B is left alone. The model's line is the rule of the pinching models (chapter Прищипывание): every cut over a node
     wakes the two buds below — 2, then 4 tops; the bush left alone keeps one leader for weeks */
  register('exapex', el => experiment(el, {
    id: 'apex',
    note: 'Верхушка — начальник, который велит почкам ниже ждать. Срежьте его — и почки пойдут в рост: модель ждёт 2 верхушки после первого среза и 4 после второго.',
    bushes: true,
    fields: [
      { k: 'tops', label: 'Растущих верхушек', type: 'count', unit: 'шт.', min: 0, max: 99, short: 'верхушек' },
      { k: 'hcm', label: 'Высота', type: 'number', unit: 'см', min: 0, max: 300, step: 0.5, short: 'высота' },
      { k: 'g', label: 'Урожай', type: 'number', unit: 'г', min: 0, max: 5000, optional: true, short: 'урожай' }
    ],
    unit: 'd',
    y: { k: 'tops', lo: 0, hi: 8, ticks: [0, 2, 4, 6, 8], lab: 'верхушек' },
    model: (g, t) => (g === 1 ? 1 : t < 5 ? 1 : t < 26 ? 2 : 4),
    // the measures of a bush from «Мой базилик» go into its diary as well
    diary: v => [v.tops || v.hcm ? { k: 'measure', n: v.tops || undefined, h: v.hcm || undefined } : null, v.g ? { k: 'cut', g: v.g } : null].filter(Boolean),
    verdict(run) {
      const last = (g, k) => { const p = expSeries(run, g, k, 'd'); return p.length ? p[p.length - 1][1] : null; };
      const sum = (g, k) => expSeries(run, g, k, 'd').reduce((s, p) => s + p[1], 0);
      const tA = last(0, 'tops'), tB = last(1, 'tops'), hA = last(0, 'hcm'), hB = last(1, 'hcm'), gA = sum(0, 'g'), gB = sum(1, 'g');
      if (tA === null && tB === null) return '<p>Запишите верхушки и высоту обоих кустов сразу после прищипки — это точка отсчёта.</p>';
      let s = '';
      if (tA !== null && tB !== null) s += `<p><b>У прищипнутого куста ${fmt0(tA)} ${h.plural(tA, 'верхушка', 'верхушки', 'верхушек')}, у нетронутого — ${fmt0(tB)}.</b> Модель: после одного среза — 2, после второго — 4, у нетронутого — одна. Пока верхушка на месте, она шлёт вниз ауксин, и почки в пазухах ждут, как заместители при начальнике; срез убирает сигнал, а цитокинины из корней — «бюджет» роста — достаются боковым почкам.</p>`;
      if (hA !== null && hB !== null) s += `<p>${hB > hA ? `Нетронутый куст выше на ${nfmt(hB - hA)} см — он тянется одним стеблем, а прищипнутый растёт вширь.` : 'Прищипнутый куст не уступает в высоте — значит, боковые побеги пошли сильно.'}</p>`;
      if (gA || gB) s += `<p>Урожай: с куста А — ${fmt0(gA)} г, с куста Б — ${fmt0(gB)} г.</p>`;
      return h.nb(s);
    }
  }));

  /* «Регенерация»: adventitious roots of a cutting, warm against cool. The model (agro.rootsLength, the same as «Черенок в
     стакане» in chapter Размножение): the day the first roots show and how fast they grow at each temperature */
  const rootsT = (cfg, g) => (g ? cfg.tB : cfg.tA);
  register('exroots', el => experiment(el, {
    id: 'roots',
    note: 'Клетки у узла черенка «переучиваются» и становятся корнями. Тепло ускоряет эту перестройку: модель знает, на какой день покажутся корешки в тепле и в прохладе.',
    cfg: [
      { k: 'tA', label: 'Температура в тепле', unit: '°C', def: 24, min: 15, max: 32, step: 0.5 },
      { k: 'tB', label: 'Температура в прохладе', unit: '°C', def: 18, min: 12, max: 26, step: 0.5 }
    ],
    fields: [{ k: 'mm', label: 'Самый длинный корешок', type: 'number', unit: 'мм', min: 0, max: 300, step: 1, short: 'корешок' }],
    photo: true,
    unit: 'd',
    y: { k: 'mm', lo: 0, hi: 60, ticks: [0, 20, 40, 60], lab: 'мм' },
    model: (g, t, cfg) => Math.min(60, agro.rootsLength(t, rootsT(cfg, g)) * 10),
    verdict(run) {
      const cfg = run.cfg || {};
      const part = (g, name) => {
        const T = rootsT(cfg, g), pts = expSeries(run, g, 'mm', 'd'), first = pts.find(([, v]) => v > 0);
        return first ? `${name} (${nfmt(T)} °C) первые корешки — к ${fmt0(first[0])}-му дню, модель ждала ${nfmt(agro.rootsOnset(T))}` : `${name} (${nfmt(T)} °C) корешков пока нет, модель ждёт их к ${nfmt(agro.rootsOnset(T))}-му дню`;
      };
      if (!run.recs.length) return '<p>Каждые два дня меняйте воду и измеряйте самый длинный корешок (0 — если его нет).</p>';
      return h.nb(`<p>${part(0, 'В тепле')}; ${part(1, 'в прохладе')}.</p><p>Пока снаружи ничего не видно, у основания идёт главная работа: ауксин стекает к срезу, и клетки возле узла, которые были стеблем, начинают делиться заново и закладывают корни — как ящерица отращивает хвост. В тепле ферменты работают быстрее, поэтому корни появляются раньше.</p>`);
    }
  }));

  /* «Без света»: etiolation. Seedlings in the dark stretch on the seed's reserves and stay yellow-white; on the light they
     turn green within a day or two (chlorophyll is finished only in light). The model's lines are qualitative: about
     4 mm a day in light, 11 mm a day in the dark until the reserves run out */
  const DARK_COL = ['жёлто-белые', 'бледно-зелёные', 'зелёные'];
  register('exdark', el => experiment(el, {
    id: 'dark',
    note: 'В темноте росток тратит запас семени на рывок вверх и не строит хлорофилл. Модель здесь качественная: в темноте ростки вытягиваются в 2–3 раза быстрее.',
    fields: [
      { k: 'mm', label: 'Высота ростков', type: 'number', unit: 'мм', min: 0, max: 300, step: 1, short: 'высота' },
      { k: 'col', label: 'Цвет', type: 'scale', opts: DARK_COL }
    ],
    photo: true,
    unit: 'd',
    y: { k: 'mm', lo: 0, hi: 80, ticks: [0, 20, 40, 60, 80], lab: 'мм' },
    model: (g, t) => (g === 0 ? 4 * t : t <= 5 ? 11 * t : 55 + 3 * (t - 5)),
    verdict(run) {
      const last = (g, k, upTo = Infinity) => { const p = expSeries(run, g, k, 'd').filter(([t]) => t <= upTo); return p.length ? p[p.length - 1] : null; };
      const L = last(0, 'mm', 5.5), D = last(1, 'mm', 5.5);
      if (!L && !D) return '<p>Каждый день измеряйте ростки в обеих чашках и отмечайте их цвет.</p>';
      let s = '';
      if (L && D && L[1] > 0) s += `<p><b>В темноте ростки ${D[1] > L[1] ? `в ${nfmt(D[1] / L[1])} раза выше` : 'не выше'}, чем на свету</b> (${fmt0(D[1])} и ${fmt0(L[1])} мм). Без света росток бросает весь запас семени на рывок вверх, как человек в тёмном коридоре бежит к выходу, а не обустраивается.</p>`;
      const dCol = expSeries(run, 1, 'col', 'd'), darkCol = dCol.filter(([t]) => t <= 5.5).pop(), lightCol = dCol.filter(([t]) => t > 5.5);
      if (darkCol) s += `<p>В темноте они были ${DARK_COL[darkCol[1]]}: последний шаг сборки хлорофилла идёт только на свету — как завод, который не собирает солнечные панели, пока нет солнца.</p>`;
      const green = lightCol.find(([, v]) => v >= 2) || lightCol.find(([, v]) => v >= 1);
      if (green) s += `<p>На свету бывшие тёмные ростки ${green[1] >= 2 ? 'позеленели' : 'начали зеленеть'} за ${nfmt(green[0] - 5)} сут.</p>`;
      return h.nb(s);
    }
  }));
})();
