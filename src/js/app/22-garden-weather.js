  /* ================================================================== */
  /* MY BASIL: the weather for the bushes (Open-Meteo)                   */
  /* ================================================================== */
  // the place is the reader's choice (garden.where): nothing is asked of the weather service until there is one, and
  // only its coordinates go out, rounded to about a kilometre. The forecast is kept for 3 hours and shown with its age
  // when there is no network. Weather data by Open-Meteo.com, CC BY 4.0
  const WX_KEY = 'basil-weather', WX_TTL = 3 * 3600e3;
  const WX_API = 'https://api.open-meteo.com/v1/forecast', WX_GEO = 'https://geocoding-api.open-meteo.com/v1/search';
  const round2 = v => Math.round(v * 100) / 100;
  // the leaf's view of the air, the formula of the model «VPD» (src/labs/_lib/agro.js): the interface needs it
  // before any model of the page has loaded
  const wxSvp = T => 0.6108 * Math.exp(17.27 * T / (T + 237.3));
  const wxPlace = () => gardenLoad().where || null;
  let wxMemo = { raw: undefined, v: null };
  // the kept forecast, if it is for the place chosen now
  function wxCached() {
    let raw = null;
    try { raw = localStorage.getItem(WX_KEY); } catch (e) { /* storage unavailable */ }
    if (raw !== wxMemo.raw) { let v = null; try { v = raw ? JSON.parse(raw) : null; } catch (e) { v = null; } wxMemo = { raw, v }; }
    const c = wxMemo.v, w = wxPlace();
    return c && w && Array.isArray(c.days) && Math.abs(c.lat - w.lat) < 0.02 && Math.abs(c.lon - w.lon) < 0.02 ? c : null;
  }
  const pad2 = n => String(n).padStart(2, '0');
  // the service's answer, kept small: the days from today on, and 48 hours from now
  function wxParse(j) {
    const D = j.daily || {}, H = j.hourly || {}, ht = H.time || [];
    const vpdAt = k => round2(wxSvp(H.temperature_2m[k]) * (1 - H.relative_humidity_2m[k] / 100));
    const todayKey = toISO(today());
    const days = (D.time || []).map((d, i) => {
      // the afternoon, when the air dries a leaf the most
      const noon = ht.map((t, k) => [t, k]).filter(([t, k]) => t.startsWith(d) && +t.slice(11, 13) >= 11 && +t.slice(11, 13) <= 16 && isFinite(H.temperature_2m[k]) && isFinite(H.relative_humidity_2m[k]));
      const num = (a, f = 1) => (a && isFinite(a[i]) ? Math.round(a[i] * 10 * f) / 10 : null);
      return { d, min: num(D.temperature_2m_min), max: num(D.temperature_2m_max), rain: num(D.precipitation_sum) || 0, sun: num(D.sunshine_duration, 1 / 3600), light: num(D.daylight_duration, 1 / 3600), vpd: noon.length ? Math.max(...noon.map(([, k]) => vpdAt(k))) : null };
    }).filter(x => x.d >= todayKey && x.min !== null && x.max !== null);
    const now = new Date(), nowKey = `${toISO(now)}T${pad2(now.getHours())}:00`;
    const hours = ht.map((t, k) => ({ t, T: H.temperature_2m[k], RH: H.relative_humidity_2m[k] })).filter(x => x.t >= nowKey && isFinite(x.T) && isFinite(x.RH)).slice(0, 48)
      .map(x => ({ t: x.t, T: Math.round(x.T * 10) / 10, RH: Math.round(x.RH), vpd: round2(wxSvp(x.T) * (1 - x.RH / 100)) }));
    return { tz: j.timezone || '', days, hours };
  }
  let wxBusy = null;
  // a fresh forecast when the kept one is older than 3 hours (or asked for); the kept one when the network fails
  function wxRefresh(force) {
    const w = wxPlace();
    if (!w) return Promise.resolve(null);
    const c = wxCached();
    if (c && !force && Date.now() - c.at < WX_TTL) return Promise.resolve(c);
    if (wxBusy) return wxBusy;
    if (navigator.onLine === false) return Promise.resolve(c);
    const q = `latitude=${w.lat.toFixed(2)}&longitude=${w.lon.toFixed(2)}&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,sunshine_duration,daylight_duration&hourly=temperature_2m,relative_humidity_2m&forecast_days=7&timezone=auto`;
    wxBusy = fetch(`${WX_API}?${q}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('weather ' + r.status); return r.json(); })
      .then(j => {
        const v = Object.assign(wxParse(j), { at: Date.now(), lat: w.lat, lon: w.lon });
        if (!v.days.length) throw new Error('weather: no days');
        store.set(WX_KEY, v);
        document.dispatchEvent(new CustomEvent('basil:weather'));
        return v;
      })
      .catch(() => c)
      .finally(() => { wxBusy = null; });
    return wxBusy;
  }
  // places by name, in Russian
  function wxSearch(name) {
    const q = String(name || '').trim();
    if (q.length < 2) return Promise.resolve([]);
    return fetch(`${WX_GEO}?name=${encodeURIComponent(q)}&count=6&language=ru&format=json`)
      .then(r => (r.ok ? r.json() : {}))
      .then(j => (j.results || []).filter(x => isFinite(x.latitude) && isFinite(x.longitude)).map(x => ({ name: x.name, region: [x.admin1, x.country].filter(Boolean).join(', '), lat: x.latitude, lon: x.longitude })));
  }
  // the place for the weather (or none): kept with the bushes, so the copy in a file carries it
  function wxSetPlace(p) {
    const s = gardenLoad();
    if (p && isFinite(+p.lat) && isFinite(+p.lon)) s.where = { name: String(p.name || 'Моё место').slice(0, 80), region: String(p.region || '').slice(0, 80), lat: round2(+p.lat), lon: round2(+p.lon) };
    else delete s.where;
    try { localStorage.removeItem(WX_KEY); } catch (e) { /* storage unavailable */ }
    gardenSave(s);
    document.dispatchEvent(new CustomEvent('basil:weather'));
    return s.where ? wxRefresh(true) : Promise.resolve(null);
  }
  // «Где я»: the phone's position, rounded to about 10 km — enough for the weather, not for a house
  function wxHere() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('no geolocation')); return; }
      navigator.geolocation.getCurrentPosition(pos => resolve({ name: 'Где я сейчас', region: '', lat: Math.round(pos.coords.latitude * 10) / 10, lon: Math.round(pos.coords.longitude * 10) / 10 }), reject, { timeout: 12000, maximumAge: 3600e3 });
    });
  }

  /* what the forecast asks of a bush */
  const fmtT = t => (Math.round(t) > 0 ? '+' : Math.round(t) < 0 ? '−' : '') + Math.abs(Math.round(t)) + ' °C';
  const fillText = (s, o) => s.replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
  const WX_DAY = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
  const wxWhen = (d, day) => { const n = dayDiff(day, d); return n <= 0 ? 'сегодня' : n === 1 ? 'завтра' : WX_DAY[d.getDay()]; };
  const wxDays = (c, day) => c.days.map(x => Object.assign({ date: fromISO(x.d) }, x)).filter(x => x.date && x.date >= day);
  // tasks: the coldest night ahead (one task, on that night: what to do depends on how cold it gets) and the heat;
  // only for bushes outdoors, and a task done stays done
  function wxTasks(p, day) {
    const place = p.place || 'home', c = place === 'home' ? null : wxCached();
    if (!c) return [];
    const W = B.WEATHER, days = wxDays(c, day), log = p.log || [], out = [];
    const done = key => log.some(e => e.task === key);
    const task = (key, title, text, link, d, kind) => {
      if (done(key)) return;
      out.push({ key, title, text, link, from: d.date, to: d.date, due: d.date, weather: kind, state: dayDiff(day, d.date) <= 1 ? 'now' : 'soon' });
    };
    const cold = days.filter(x => x.min < W.cold[W.cold.length - 1].below);
    if (cold.length) {
      const worst = cold.reduce((a, b) => (b.min < a.min ? b : a));
      const lv = W.cold.find(l => worst.min < l.below);
      const at = place === 'garden' ? 'garden' : 'balcony';
      task(`wx-${lv.level}-${worst.d}`, fillText(lv.title[at], { t: fmtT(worst.min) }), lv[at], 'uhod-teplo', worst, lv.level);
    }
    const hot = days.filter(x => x.max >= W.heat.above);
    if (hot.length) task(`wx-heat-${hot[0].d}`, fillText(W.heat.title, { t: fmtT(Math.max(...hot.map(x => x.max))) }), W.heat.text, 'uhod-poliv', hot[0], 'heat');
    return out;
  }
  // advice for the card (no «done» to it): rain on a bed, dry air outdoors, dull days for a pot
  function wxAdvice(p, day) {
    const c = wxCached();
    if (!c) return [];
    const place = p.place || 'home', W = B.WEATHER, days = wxDays(c, day), out = [];
    const soon = days.filter(x => dayDiff(day, x.date) <= 1);
    const rain = place === 'garden' && soon.find(x => x.rain >= W.rain.mm);
    if (rain) out.push({ kind: 'rain', text: fillText(W.rain.text, { mm: `${fmtNum(rain.rain, 0)} мм`, when: wxWhen(rain.date, day) }) });
    const dry = place !== 'home' && soon.find(x => x.vpd !== null && x.vpd >= W.dry.vpd);
    if (dry) out.push({ kind: 'dry', text: fillText(W.dry.text, { v: fmtNum(dry.vpd, 1), when: wxWhen(dry.date, day) }) });
    if (place !== 'garden') {
      let n = 0;
      while (n < days.length && days[n].sun !== null && days[n].sun < W.dull.sun) n++;
      if (n >= W.dull.days) out.push({ kind: 'dull', text: fillText(W.dull.text, { n: `${n} ${plural(n, 'день', 'дня', 'дней')}` }) });
    }
    return out;
  }
  // how old the kept forecast is, said shortly
  function wxAge(at) {
    const m = Math.round((Date.now() - at) / 60000);
    if (m < 2) return 'только что';
    if (m < 60) return `${m} мин назад`;
    const hr = Math.round(m / 60);
    return hr < 24 ? `${hr} ч назад` : 'больше суток назад';
  }
  // one line about the weather over the bushes: the place, tonight and today, or an invitation to choose a place
  function wxStrip(plants, page) {
    const w = wxPlace();
    const outdoors = plants.some(p => p.place && p.place !== 'home');
    const where = '#moy-pogoda';
    if (!w) return outdoors ? `<p class="g-wx-strip">${icon('thermo')}<span>Укажите город — гид предупредит о холодных ночах и жаре для кустов на улице. <a href="${where}">Выбрать город</a></span></p>` : '';
    const c = wxCached(), day = today();
    if (!c) return `<p class="g-wx-strip">${icon('thermo')}<span><b>${esc(w.name)}</b>: прогноз появится, когда будет сеть. <a href="${where}">Погода для базилика</a></span></p>`;
    const d = wxDays(c, day)[0];
    if (!d) return '';
    return `<p class="g-wx-strip">${icon('thermo')}<span><b>${esc(w.name)}</b>: ночью ${fmtT(d.min)}, днём до ${fmtT(d.max)}${d.rain >= 0.5 ? `, дождь ${fmtNum(d.rain, 0)} мм` : ''}. <a href="${where}">Погода для базилика</a> <small>${wxAge(c.at)}</small></span></p>`;
  }
