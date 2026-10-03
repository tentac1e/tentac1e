  /* ================================================================== */
  /* MY BASIL: one's own bushes and what each needs this week            */
  /* ================================================================== */
  // kept in this browser only:
  // { v: 1, plants: [{ id, name, variety, start, place, preset, date, added, log: [{ d, k, task?, g?, t? }] }] }
  const GARDEN_KEY = 'basil-garden';
  function gardenLoad() {
    const s = store.get(GARDEN_KEY, null);
    return s && Array.isArray(s.plants) ? s : { v: 1, plants: [] };
  }
  function gardenSave(s) {
    store.set(GARDEN_KEY, s);
    document.dispatchEvent(new CustomEvent('basil:garden'));
  }
  const gardenVariety = p => B.VARIETIES.find(v => v.name === p.variety) || null;
  // a week runs from Monday to Sunday
  const weekOf = d => { const m = addDays(d, -((d.getDay() + 6) % 7)); return [m, addDays(m, 6)]; };
  const later = (a, b) => (!a ? b : !b ? a : a > b ? a : b);
  const daysWord = n => `${n} ${plural(n, 'день', 'дня', 'дней')}`;

  // everything the guide asks of one bush. Steps once — from sowing to the first harvest, and the season
  // of a bush outdoors — and the ones that come again: feeding, cutting, buds, flushing the pot, fresh water
  // for a cutting, the lamp in winter. A step is done when the diary says so; a note of its kind
  // («Подкормил») closes it too. What was over before the diary began is not asked for
  function plantTasks(p, day) {
    const G = B.GARDEN;
    const S = fromISO(p.date) || day;
    const added = fromISO(p.added) || S;
    const age = dayDiff(S, day);
    const place = p.place || 'home';
    const log = (p.log || []).map(e => Object.assign({ date: fromISO(e.d) }, e)).filter(e => e.date).sort((a, b) => a.date - b.date);
    const last = k => log.reduce((m, e) => (e.k === k ? e.date : m), null);
    const out = [], byKey = {};
    const state = (from, to) => (to < day ? 'late' : from <= day ? 'now' : 'soon');
    const once = (st, from, to) => {
      const note = log.find(e => e.task === st.key) || (st.kind && log.find(e => e.k === st.kind && e.date >= addDays(from, -5) && e.date <= addDays(to, 30)));
      const t = { key: st.key, title: st.title, text: st.text, link: st.link, kind: st.kind, from, to, due: from, once: true };
      if (note) { t.state = 'done'; t.done = note.date; }
      else if (to < added) t.state = 'before';
      else if (dayDiff(to, day) > 21) t.state = 'missed';
      else t.state = state(from, to);
      out.push(t);
      byKey[st.key] = t;
      return t;
    };
    // from the last time it was done; never before the diary began
    const again = (key, def, next) => {
      if (!next) return;
      next = later(next, added);
      out.push({ key, title: def.title, text: def.text, link: def.link, kind: key, from: next, to: next, due: next, repeat: true, state: state(next, next) });
    };

    // outdoors the season counts from the frosts of the climate
    let lf = null, af = null;
    if (place !== 'home') {
      let fr = seasonFrosts(p.preset || 'temperate', S.getFullYear());
      if (S > fr.af) fr = seasonFrosts(p.preset || 'temperate', S.getFullYear() + 1);
      lf = fr.lf;
      af = fr.af;
    }
    const plantOut = place === 'garden' && (p.start === 'seed' || p.start === 'seedling');
    (G.steps[p.start] || G.steps.seed).forEach(st => {
      if (plantOut && st.key === 'plant') return; // a garden bush is planted out by the season
      let a = st.a, b = st.b;
      if (a === 'first') {
        // the variety's own weeks to the first cut, but never before the first pinch has grown back
        const v = gardenVariety(p), wk = v ? parseInt((String(v.first).match(/\d+/) || [])[0], 10) : 0;
        a = Math.max(wk ? wk * 7 : 0, 52);
        b = a + st.b;
      }
      let from = addDays(S, a), to = addDays(S, b);
      if (plantOut && st.key === 'harvest1' && addDays(lf, 35) > from) { from = addDays(lf, 35); to = addDays(from, 10); }
      once(st, from, to);
    });
    if (lf) {
      (place === 'garden' ? G.season : [G.balcony]).forEach(st => {
        if (st.starts && !(plantOut && st.starts.includes(p.start))) return;
        const base = st.from === 'lf' ? lf : af;
        let from = addDays(base, st.a), to = addDays(base, st.b);
        if (st.key === 'plantout' && to < S) { from = S; to = addDays(S, 3); } // bought after planting time: plant now
        if (to < S) return;
        once(st, from, to);
      });
    }

    // the season of a bush outdoors ends with the frost
    const over = place === 'garden' && af && (day > af || (byKey.final && byKey.final.state === 'done'));
    const R = G.repeat;
    const closed = t => t && (t.state === 'done' || t.state === 'before' || t.state === 'missed');
    const baseOf = t => (t.state === 'done' ? t.done : t.to);
    if (!over) {
      if (closed(byKey.feed1)) again('feed', R.feed, addDays(later(last('feed'), baseOf(byKey.feed1)), R.feed.every[place] || 10));
      if (closed(byKey.harvest1)) again('cut', R.cut, addDays(later(last('cut'), baseOf(byKey.harvest1)), R.cut.every));
      if (R.buds.months.includes(day.getMonth()) && age >= R.buds.age) { const b = last('buds'); again('buds', R.buds, b ? addDays(b, R.buds.every) : day); }
      if (R.flush.places.includes(place) && age >= R.flush.age) again('flush', R.flush, addDays(later(last('flush'), addDays(S, R.flush.age - R.flush.every)), R.flush.every));
    }
    if (p.start === 'cutting' && byKey.pot && !closed(byKey.pot)) again('water', R.water, addDays(later(last('water'), S), R.water.every));
    // the lamp: once a winter, at home (on the balcony once the bush has come in)
    const L = G.light;
    if (L.months.includes(day.getMonth()) && L.places.includes(place) && (place === 'home' || (af && day >= addDays(af, -10)))) {
      const sy = day.getMonth() >= 9 ? day.getFullYear() : day.getFullYear() - 1;
      once(Object.assign({}, L, { key: 'light-' + sy }), later(new Date(sy, 9, 1), added), new Date(sy + 1, 2, 31));
    }
    // the forecast for a bush outdoors: a cold spell, the heat (22-garden-weather.js)
    wxTasks(p, day).forEach(t => out.push(t));
    return out.sort((a, b) => a.due - b.due);
  }
  // what is left to do this week (with what is late), and what comes after it
  function plantWeek(p, day) {
    const end = weekOf(day)[1];
    const all = plantTasks(p, day);
    const open = all.filter(t => t.state === 'late' || t.state === 'now' || t.state === 'soon');
    // the weather's tasks stand in the week as long as the forecast reaches them: a frost on Monday is told on Saturday
    const shown = t => t.due <= end || (t.weather && dayDiff(day, t.due) <= 7);
    return { all, now: open.filter(shown), next: open.filter(t => !shown(t))[0] || null };
  }
  // how the bush looks at its age: the picture of its stage and the word for it
  function plantStage(p, day) {
    const age = Math.max(0, dayDiff(fromISO(p.date) || day, day));
    const st = (B.GARDEN.stages[p.start] || B.GARDEN.stages.seed).find(s => age < s[0]);
    return { age, pic: st[1], word: st[2] };
  }
  // the diary: a task done, or a note («Полил», «Срезал 40 г»)
  function plantNote(p, entry) {
    p.log = p.log || [];
    p.log.push(Object.assign({ d: toISO(today()) }, entry));
  }
  function plantDone(p, t) {
    if (t.repeat) plantNote(p, { k: t.key });
    else plantNote(p, t.kind ? { k: t.kind, task: t.key } : { k: 'task', task: t.key });
  }
  const lastNote = (p, k) => (p.log || []).reduce((m, e) => { const d = e.k === k && fromISO(e.d); return d && (!m || d > m) ? d : m; }, null);
