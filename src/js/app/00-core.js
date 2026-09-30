
  const B = window.BASIL;
  if (!B) return;

  /* ---------------- utils ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f1 = v => Math.round(v * 10) / 10;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    }
  };

  // number + short word → non-breaking space ("20 °C", "1 г/л", "3 пары")
  const nb = s => String(s).replace(/(\d) (?=[^\s\d–—-]{1,6}(?=[\s,.;:)!?/]|$))/g, '$1\u00a0');

  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };
  // one Intl formatter per precision: toLocaleString builds a new one on every call, which is slow
  const NF = {};
  const fmtNum = (v, digits = 1) => (NF[digits] || (NF[digits] = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: 0 }))).format(v);

  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  const fd = d => `${d.getDate()}\u00a0${MONTHS[d.getMonth()]}`;
  const fr = (a, b) => {
    if (!b || +a === +b) return fd(a);
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()}–${b.getDate()}\u00a0${MONTHS[a.getMonth()]}`;
    return `${fd(a)} – ${fd(b)}`;
  };
  const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromISO = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const dayDiff = (a, b) => Math.round((b - a) / 864e5);
  const icon = name => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const chapterById = id => B.CHAPTERS.find(c => c.id === id);
  const HAP = window.BasilHaptics || { tick() {}, select() {}, impact() {}, success() {}, supported: false };

  /* ---------------- pages: every chapter is its own HTML file ---------------- */
  // BASIL_PAGES comes from scripts/build.py; without it (one-file build) all chapters share one page
  const PAGES = window.BASIL_PAGES || null;
  const here = (document.querySelector('[data-view]') || { dataset: {} }).dataset.view || 'glavnaya';
  const pageOf = id => {
    if (!PAGES || !id) return null;
    if (PAGES.files[id]) return id;
    if (PAGES.ids[id]) return PAGES.ids[id];
    for (const pre in PAGES.prefixes) if (id.startsWith(pre)) return PAGES.prefixes[pre];
    return null;
  };
  // tabs have short anchors (#план); data and old bookmarks use the long ids (#udobreniya-plan)
  const aliasOf = id => (PAGES && PAGES.alias && PAGES.alias[id]) || id;
  // «#id» → the address that really shows it: same page keeps the hash, another chapter gets «page#id»
  const urlFor = hash => {
    let id = String(hash || '').replace(/^#/, '');
    try { id = decodeURIComponent(id); } catch (e) { /* already plain */ }
    if (!PAGES || !id || id === 'main' || id === 'top' || id === here || document.getElementById(id)) return '#' + id;
    const pg = pageOf(id);
    if (!pg || pg === here) return '#' + aliasOf(id);
    if (PAGES.files[id]) return PAGES.files[id];
    return PAGES.files[pg] + '#' + aliasOf(id);
  };
  function fixLinks(root) {
    if (!PAGES || !root || !root.querySelectorAll) return;
    const list = root.matches && root.matches('a[href^="#"]') ? [root] : [];
    root.querySelectorAll('a[href^="#"]').forEach(a => list.push(a));
    list.forEach(a => {
      const h = a.getAttribute('href');
      const u = urlFor(h);
      if (u !== h) a.setAttribute('href', u);
    });
  }
  const smooth = () => (reduceMotion.matches ? 'auto' : 'smooth');

  let toastTimer = 0;
  function toast(text) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Скопировано');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      toast(ok ? 'Скопировано' : 'Не удалось скопировать — выделите текст вручную');
    }
  }

