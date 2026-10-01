  /* ================================================================== */
  /* SEARCH                                                              */
  /* ================================================================== */
  const textOf = el => {
    const parts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
    return parts.join(' ').replace(/\s+/g, ' ').replace(/\s([.,;:!?)»])/g, '$1').trim();
  };
  let searchIndex = [];
  // results come in groups; equally good groups keep this order
  const SEARCH_GROUPS = [['sec', 'Разделы'], ['prob', 'Проблемы и симптомы'], ['var', 'Сорта'], ['el', 'Питание'], ['rec', 'Рецепты'], ['word', 'Словарь и вкус']];

  /* the one-file book has no index file: the page indexes itself by the rules of scripts/build.py */
  const SEARCH_SKIP = '#chapters, #quick, #tools-home, #journey, .diag-result, .el-detail, #variety-detail, .quiz, .plan-list, .timeline, .dose-out, .npk-out, .soil-out, .dli-out, .stage-body, .pager, .sim, #glossary, #disease-grid, #pest-grid, #diag-groups, #place-panel, #check-groups, .lab-tool, .deep-index, .recipe-book, .deep-src';
  const SEARCH_BOX = 'details, .card, .step, .pane, article, .rule, li';
  // what a heading titles: its box when it is the box's first heading, else itself and what follows it
  // up to the next heading
  function sectionOf(h) {
    const box = h.closest(SEARCH_BOX);
    if (box && box.querySelector('h3, h4, summary') === h) return [box];
    const out = [h];
    for (let n = h.nextSibling; n; n = n.nextSibling) {
      if (n.nodeType === 1 && (n.matches('h3, h4, summary') || n.querySelector('h3, h4, summary'))) break;
      out.push(n);
    }
    return out;
  }
  // the text of some nodes without the parts other entries own: every piece of text is indexed once
  function ownText(nodes, owned) {
    const parts = [];
    const walk = n => {
      if (n.nodeType === 3) { parts.push(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      for (let c = n.firstChild; c; c = c.nextSibling) if (!owned.has(c)) walk(c);
    };
    nodes.forEach(walk);
    return parts.join(' ').replace(/\s+/g, ' ').replace(/\s([.,;:!?)»])/g, '$1').trim();
  }
  function indexPage(add) {
    const list = []; // [entry, the nodes that hold its text, a node read first]
    let n = 0;
    $$('[data-view]').forEach(view => {
      const ch = chapterById(view.dataset.view);
      $$('[data-panel]', view).forEach(p => list.push([{ title: p.dataset.title || '', sub: ch ? ch.title : '', hash: p.id, icon: 'list' }, [p]]));
      $$('h3, h4, summary', view).forEach(h => {
        if (h.closest(SEARCH_SKIP)) return;
        const panel = h.closest('[data-panel]');
        const where = (ch ? ch.title : 'Главная') + (panel && panel.dataset.title ? ' · ' + panel.dataset.title : '');
        const parent = h.parentElement;
        if (h.tagName === 'SUMMARY' && parent.classList.contains('deeper')) {
          const host = h.closest('details.deep');
          if (!h.id) h.id = host ? host.id + '-glubzhe' : 's-' + (++n);
          const t = $('.deeper-t', h);
          list.push([{ title: (t || h).textContent.trim(), sub: 'Ещё глубже · ' + (host ? host.dataset.short : where), hash: h.id, icon: 'hex' }, [h.nextElementSibling]]);
          return;
        }
        if (h.tagName === 'SUMMARY' && parent.classList.contains('deep')) {
          const t = $('.deep-title', h);
          list.push([{ title: (t || h).textContent.trim(), sub: 'Глубже · ' + where, hash: parent.id, icon: 'hex' }, [$('.deep-body', parent)], $('.deep-sub', h)]);
          return;
        }
        if (!h.id) h.id = 's-' + (++n);
        const deep = h.closest('.deep');
        list.push([{ title: h.textContent.trim(), sub: where + (deep ? ' · Глубже' + (deep.dataset.short ? ': ' + deep.dataset.short : '') : ''), hash: h.id, icon: h.tagName === 'SUMMARY' ? 'info' : 'leaf' }, sectionOf(h), null, h]);
      });
    });
    const owned = new Set();
    list.forEach(([, nodes]) => nodes.forEach(x => { if (x) owned.add(x); }));
    list.forEach(([e, nodes, extra, head]) => {
      const mine = nodes.filter(Boolean);
      mine.forEach(x => owned.delete(x));
      // the heading itself is the entry's title, not its text
      if (head) owned.add(head);
      e.text = ((extra ? textOf(extra) + ' ' : '') + ownText(mine.filter(x => x !== head), owned)).trim();
      if (head) owned.delete(head);
      mine.forEach(x => owned.add(x));
      add(e);
    });
  }

  // pieces of text into one: a full stop only where a piece has none of its own
  const sentences = parts => parts.filter(Boolean).map(t => String(t).trim()).map(t => (/[.!?…]$/.test(t) ? t : t + '.')).join(' ');
  let searchVocab = null;
  function buildSearchIndex() {
    const idx = [];
    const add = e => { e.kind = e.kind || 'sec'; e.nt = norm(e.title); e.nx = norm(e.text || ''); idx.push(e); };
    B.CHAPTERS.forEach(c => add({ title: c.title, sub: `Глава ${c.num}`, text: c.desc, hash: c.id, icon: 'book' }));
    B.TOOLS.forEach(t => add({ title: t.title, sub: 'Инструмент', text: t.desc, hash: t.hash, icon: t.icon }));
    // the whole text of every chapter, indexed at build time (assets/js/search-index.js)
    if (window.BASIL_SEARCH) window.BASIL_SEARCH.forEach(e => add(Object.assign({}, e)));
    else indexPage(add);
    B.DIAG.forEach(g => g.items.forEach(it => add({ kind: 'prob', title: it.title, sub: 'Проблемы · Диагностика · ' + g.group, text: it.causes.map(c => `${c.name}. ${c.check} ${c.fix}`).join(' '), hash: 'problemy-diagnostika', icon: 'bug', act: 'sym:' + it.id, after: () => selectSymptom(it.id, true) })));
    B.DISEASES.forEach((d, i) => add({ kind: 'prob', title: d.name, sub: 'Проблемы · Болезни', text: sentences([d.latin, d.sign, d.fix, d.prevent]), hash: 'dis-' + i, icon: 'alert' }));
    B.PESTS.forEach((d, i) => add({ kind: 'prob', title: d.name, sub: 'Проблемы · Вредители', text: sentences([d.latin, d.sign, d.fix, d.prevent]), hash: 'pest-' + i, icon: 'bug' }));
    B.VARIETIES.forEach((v, i) => {
      const type = (B.VARIETY_TYPES || []).find(t => t.id === v.type);
      add({ kind: 'var', title: `Сорт «${v.name}»`, sub: 'Сорта · ' + (type ? type.name : 'Каталог'), text: `${v.latin}. Аромат: ${v.aroma}. ${v.desc} Для чего: ${v.use}. ${v.care} ${(v.labels || []).join(', ')}`, hash: 'sorta-katalog', icon: 'seed', act: 'var:' + i, after: () => openVariety(i) });
    });
    B.ELEMENTS.forEach((e, i) => add({ kind: 'el', title: `${e.name} (${e.sym})`, sub: 'Удобрения · Элементы', text: [e.role, 'Нехватка: ' + e.def, e.exc && 'Избыток: ' + e.exc, e.mineral && 'Чем дать: ' + e.mineral, e.organic, e.when].filter(Boolean).join(' '), hash: 'udobreniya-elementy', icon: 'flask', act: 'el:' + i, after: () => selectElement(i, true) }));
    if (B.RECIPES) {
      const catName = Object.fromEntries(B.RECIPE_CATS.map(([id, name, ic]) => [id, [name, ic]]));
      B.RECIPES.forEach(r => add({ kind: 'rec', title: r.title, sub: 'Рецепты · ' + catName[r.cat][0], text: sentences([r.orig, r.basil && 'Базилик: ' + r.basil, r.ing.map(x => x[0]).join(', ')].concat(r.steps || [], [r.sci && r.sci[0], r.tip])), hash: 'r-' + r.id, icon: catName[r.cat][1] }));
    }
    B.GLOSSARY.forEach(([t, d], i) => add({ kind: 'word', title: t, sub: 'Справка · Словарь', text: d, hash: 'g-' + i, icon: 'book' }));
    if (window.BasilScience) {
      Object.values(window.BasilScience.MOLS).forEach(m => add({ kind: 'word', title: m.name + (m.alt ? ` (${m.alt})` : ''), sub: 'Вкус · Молекулы аромата', text: `${m.cls}. Запах: ${m.smell}. Есть в: ${m.where}. Сорта: ${m.basil}. ${m.note}`, hash: 'vkus-molekuly', icon: 'hex' }));
      window.BasilScience.PAIRS.forEach(pr => add({ kind: 'word', title: `Базилик и ${pr.name.toLowerCase()}`, sub: 'Вкус · Сочетания', text: pr.why + ' ' + pr.dish, hash: 'vkus-sochetaniya', icon: 'nose' }));
    }
    idx.forEach(e => { if (!e.page) e.page = pageOf(e.hash) || here; });
    searchIndex = idx;
    searchVocab = null;
  }
  const entryUrl = e => {
    if (!PAGES || e.page === here) return '#' + aliasOf(e.hash);
    return PAGES.files[e.page] + (e.act ? '?do=' + encodeURIComponent(e.act) : '') + (PAGES.files[e.hash] ? '' : '#' + aliasOf(e.hash));
  };
  // the index of all chapters is a separate file: fetched the first time search opens
  let searchReady = null;
  function loadSearch() {
    if (searchReady) return searchReady;
    searchReady = new Promise(resolve => {
      if (!PAGES || window.BASIL_SEARCH) { resolve(); return; }
      const self = $('script[src*="/app.js"]');
      const tag = document.createElement('script');
      const v = PAGES && PAGES.v ? '?v=' + PAGES.v.search : '';
      tag.src = (self ? self.getAttribute('src').replace(/app\.js(\?.*)?$/, 'search-index.js') : 'assets/js/search-index.js') + v;
      tag.onload = tag.onerror = () => resolve();
      document.head.appendChild(tag);
    }).then(() => { buildSearchIndex(); document.dispatchEvent(new CustomEvent('basil:search-ready')); });
    return searchReady;
  }

  /* ---------------- matching ---------------- */
  // little words and the words of a question («как часто поливать» is about «поливать»)
  const SEARCH_STOP = new Set(('и в во не на с со по к ко у о об от до за из для при как что это а но ли же бы или то его ее их все уже так там где когда чем если без над под про через мне меня можно нужно надо ' +
    'часто сколько почему зачем какой какая какое какие каким нужен нужна нужны лучше правильно раз чтобы есть быть делать сделать мой моя мои свой свои очень этот эта эти').split(' '));
  // the query → its words with what each may be found as; stop words drop out unless nothing else is left.
  // The last word is still being typed unless a space follows it
  function parseQuery(q, typing) {
    const all = q.split(/[^a-zа-я0-9]+/).filter(Boolean);
    let words = all.filter(w => !SEARCH_STOP.has(w) && (w.length > 1 || /\d/.test(w)));
    if (!words.length) words = all;
    return words.map((w, i) => ({ w, typing: typing && i === words.length - 1 && w === all[all.length - 1], alts: altsOf(w) }));
  }
  // where a key stands in a text: a word that starts with it and ends soon after (an ending) is the best
  // place; a longer word is weaker («черенкование» for «черенок»), the middle of a word weaker still
  // («фитолампа» for «лампа»)
  function scanKey(hay, key, typing) {
    const mid = key.length >= 5 && /[а-я]/.test(key);
    let i = hay.indexOf(key), best = 0, at = -1, n = 0;
    while (i >= 0) {
      const start = i === 0 || !isWordChar(hay[i - 1]);
      if (start || mid) {
        let e = i + key.length;
        while (e < hay.length && isWordChar(hay[e])) e++;
        const tail = e - i - key.length;
        // a short stem takes a short ending only: «сея-ть», not «сея-нцы»
        let q = tail <= (key.length > 3 ? 3 : 2) ? 1 : tail <= 5 ? 0.55 : 0.3;
        if (typing && start) q = Math.max(q, 0.8); // the word being typed: any word it begins counts
        if (!start) q *= 0.45;
        n++;
        if (q > best) { best = q; at = i; }
        if (n >= 8 && best === 1) break;
      }
      i = hay.indexOf(key, i + 1);
    }
    return { q: best, at, n };
  }
  // the title counts most, then the text; the whole phrase above separate words, words close together
  // above words far apart; a whole tab gives way to the section that holds the words
  function scoreEntry(e, words, phrase) {
    let s = 0, hits = 0, mask = 0, inTitle = 0;
    const where = [];
    words.forEach((wd, wi) => {
      let t = 0, x = 0, cnt = 0, at = -1;
      wd.alts.forEach(a => {
        const st = scanKey(e.nt, a.k, wd.typing);
        if (st.q * a.wt > t) t = st.q * a.wt;
        const sx = scanKey(e.nx, a.k, wd.typing);
        if (sx.q * a.wt > x) { x = sx.q * a.wt; at = sx.at; }
        cnt += sx.n;
      });
      if (!t && !x) return;
      hits++;
      if (t) inTitle++;
      mask |= 1 << wi;
      s += t * 10 + x * 2.5 + Math.min(cnt, 6) * 0.35;
      if (at >= 0) where.push(at);
    });
    if (!hits) return null;
    if (words.length > 1 && phrase) { if (e.nt.includes(phrase)) s += 8; else if (e.nx.includes(phrase)) s += 4; }
    if (where.length > 1 && Math.max(...where) - Math.min(...where) < 90) s += 2.5;
    // a name typed in full leads to that very place («план подкормок» — the tab, not a heading inside it)
    if (phrase && e.nt === phrase) s += 12;
    else {
      if (phrase && e.nt.startsWith(phrase)) s += 3;
      if (e.icon === 'list') s -= 1.5;
    }
    // the title has every word: the text is shown from its start, otherwise from the first word found
    return { e, s, hits, mask, at: inTitle === words.length || !where.length ? -1 : Math.min(...where) };
  }
  function matchAll(words, phrase) {
    let res = [];
    let cover = 0;
    searchIndex.forEach(e => { const r = scoreEntry(e, words, phrase); if (r) { res.push(r); cover |= r.mask; } });
    // two results that lead to the same place (a tool and its tab): the better one stays
    const seen = new Set();
    res = res.sort((a, b) => b.s - a.s).filter(r => { const k = r.e.page + '#' + r.e.hash + '|' + (r.e.act || ''); if (seen.has(k)) return false; seen.add(k); return true; });
    const full = res.filter(r => r.hits === words.length);
    return { full, res, cover };
  }
  function vocabulary() {
    if (searchVocab) return searchVocab;
    searchVocab = new Map();
    searchIndex.forEach(e => (e.nt + ' ' + e.nx).split(/[^a-zа-я0-9]+/).forEach(w => { if (w.length >= 3) searchVocab.set(w, (searchVocab.get(w) || 0) + 1); }));
    return searchVocab;
  }
  // the results for what was typed; when nothing has all the words: the Latin keyboard, typos fixed,
  // and failing that the places that have some of the words
  function runSearch(raw, exact) {
    const q = norm(raw).replace(/\s+/g, ' ').trim();
    const typing = !/\s$/.test(raw);
    const words = parseQuery(q, typing);
    const phraseOf = ws => ws.map(x => x.w).join(' ');
    if (!words.length) return { list: [], words };
    let r = matchAll(words, phraseOf(words));
    if (r.full.length || exact) return { list: r.full, words };
    if (/[a-z]/.test(q) && !/[а-я]/.test(q)) {
      const q2 = fromLayout(q), w2 = parseQuery(q2, typing);
      const r2 = w2.length ? matchAll(w2, phraseOf(w2)) : null;
      if (r2 && r2.full.length) return { list: r2.full, words: w2, fixed: q2 };
    }
    if (words.some((wd, i) => !(r.cover & (1 << i)))) {
      const vocab = vocabulary();
      let changed = false;
      const w3 = words.map((wd, i) => {
        if (r.cover & (1 << i)) return wd;
        const nw = nearestWord(wd.w, vocab);
        if (!nw || nw === wd.w) return wd;
        changed = true;
        return { w: nw, typing: false, alts: altsOf(nw) };
      });
      if (changed) {
        const r3 = matchAll(w3, phraseOf(w3));
        if (r3.full.length) return { list: r3.full, words: w3, fixed: phraseOf(w3) };
        r = r3.res.length ? r3 : r;
      }
    }
    if (words.length > 1 && r.res.length) return { list: r.res.sort((a, b) => b.hits - a.hits || b.s - a.s), words, some: true };
    return { list: [], words };
  }

  /* ---------------- showing ---------------- */
  // every word of the text that a key of the query begins (or holds, for longer keys) is marked
  function highlight(text, keys) {
    const t = String(text);
    let out = '', last = 0;
    t.replace(/[A-Za-zА-Яа-яЁё0-9]+/g, (tok, i) => {
      const n = norm(tok);
      if (keys.some(k => n.startsWith(k) || (k.length >= 5 && /[а-я]/.test(k) && n.includes(k)))) {
        out += esc(t.slice(last, i)) + '<mark>' + esc(tok) + '</mark>';
        last = i + tok.length;
      }
      return tok;
    });
    return out + esc(t.slice(last));
  }
  // a piece of the text around the first word found
  function snippet(text, at) {
    const t = String(text);
    if (t.length <= 160) return t;
    if (at < 0) return t.slice(0, 150).replace(/\s+\S*$/, '') + '…';
    let a = Math.max(0, at - 50);
    if (a > 0) { const sp = t.lastIndexOf(' ', a); if (sp > at - 90) a = sp + 1; }
    let b = Math.min(t.length, a + 160);
    if (b < t.length) { const sp = t.indexOf(' ', b); if (sp > 0 && sp < b + 24) b = sp; }
    return (a > 0 ? '…' : '') + t.slice(a, b) + (b < t.length ? '…' : '');
  }

  // the place a result leads to lights up for a moment once the page stands there (another page too)
  const FOUND_KEY = 'basil-found';
  function markFound(e) {
    if (e.act) return;
    try { sessionStorage.setItem(FOUND_KEY, JSON.stringify({ id: aliasOf(e.hash), t: Date.now() })); } catch (err) { /* private mode */ }
  }
  function flashFound() {
    let f = null;
    try { f = JSON.parse(sessionStorage.getItem(FOUND_KEY) || 'null'); sessionStorage.removeItem(FOUND_KEY); } catch (err) { return; }
    if (!f || Date.now() - f.t > 20000) return;
    const el = document.getElementById(f.id);
    if (!el || el.matches('[data-panel], [data-view]')) return;
    // a heading lights up with what it titles: its card, or itself when it heads a part of a longer text
    let box = el;
    if (el.matches('h3, h4, summary')) { const sec = sectionOf(el); box = sec.length === 1 && sec[0] !== el ? sec[0] : el; }
    setTimeout(() => {
      box.classList.remove('is-found');
      void box.offsetWidth;
      box.classList.add('is-found');
      setTimeout(() => box.classList.remove('is-found'), 2600);
    }, reduceMotion.matches ? 50 : 450);
  }

  // a phone: the panel stands where the visible area is — under the status bar, down to the keyboard,
  // and it stays there when the keyboard opens or the page under it would move
  const searchVV = window.visualViewport;
  function fitSearchPanel() {
    const d = $('#sheet-search');
    if (!d || !searchVV) return;
    d.style.setProperty('--vv-top', Math.round(searchVV.offsetTop) + 'px');
    d.style.setProperty('--vv-h', Math.round(searchVV.height) + 'px');
  }
  if (searchVV) {
    const refit = () => { const d = $('#sheet-search'); if (d && d.open) fitSearchPanel(); };
    searchVV.addEventListener('resize', refit);
    searchVV.addEventListener('scroll', refit);
  }

  const RECENT_KEY = 'basil-recent';
  function initSearch() {
    const input = $('#search-input');
    const box = $('#search-results');
    if (!input || !box) return;
    const scroller = box.closest('.sheet-inner') || box;
    const hints = ['желтеют листья', 'мошки', 'прищипывание', 'досветка', 'песто', 'черенки', 'магазинный горшок', 'рассада'];
    let found = [], active = 0, exact = false, last = '';
    const open = new Set(); // groups opened with «Ещё»

    const recentHtml = () => {
      const recent = store.get(RECENT_KEY, []);
      return recent.length ? `<div class="sr-group"><div class="sr-gh"><span>Недавние</span><button class="sr-clear" type="button">Очистить</button></div>${recent.map(r => `<button class="sr-recent" type="button" data-q="${esc(r)}">${icon('clock')}<span>${esc(r)}</span></button>`).join('')}</div>` : '';
    };
    const setActive = i => {
      const items = $$('.sr-item', box);
      if (!items.length) { input.removeAttribute('aria-activedescendant'); return; }
      active = (i + items.length) % items.length;
      items.forEach((it, k) => { it.classList.toggle('is-active', k === active); it.setAttribute('aria-selected', String(k === active)); });
      input.setAttribute('aria-activedescendant', items[active].id);
      return items[active];
    };

    const render = () => {
      const raw = input.value;
      const q = raw.trim();
      if (q !== last) { exact = false; open.clear(); scroller.scrollTop = 0; }
      last = q;
      found = [];
      active = 0;
      if (!q) {
        box.innerHTML = recentHtml() + `<div class="sr-group"><div class="sr-gh"><span>Часто ищут</span></div><div class="chips-row">${hints.map(h => `<button class="chip" type="button" data-q="${h}">${h}</button>`).join('')}</div></div><p class="sr-tip">Ищите по симптомам, элементам, сортам и советам. Слова можно писать в любой форме, с опечаткой или в английской раскладке.</p>`;
        setActive(0);
        return;
      }
      if (!searchIndex.length) { box.innerHTML = '<div class="sr-empty">Загружаю указатель…</div>'; return; }
      const r = runSearch(raw, exact);
      const keys = [...new Set([].concat(...r.words.map(wd => wd.alts.map(a => a.k))))];
      let note = '';
      if (r.fixed) note = `<p class="sr-note">Показано по запросу «<b>${esc(r.fixed)}</b>». <button type="button" data-exact>Искать «${esc(q)}»</button></p>`;
      else if (r.some) note = '<p class="sr-note">Нет мест, где есть все слова сразу, — показано, где есть часть из них.</p>';
      if (!r.list.length) {
        box.innerHTML = `<div class="sr-empty">Ничего не нашлось по запросу «${esc(q)}». Попробуйте другое слово, например «полив» или «удобрение».</div>`;
        setActive(0);
        return;
      }
      const groups = SEARCH_GROUPS.map(([k, name], gi) => ({ k, name, gi, list: r.list.filter(x => x.e.kind === k) })).filter(g => g.list.length);
      groups.sort((a, b) => b.list[0].s - a.list[0].s || a.gi - b.gi);
      const item = x => {
        const i = found.push(x.e) - 1;
        return `<a class="sr-item" href="${esc(entryUrl(x.e))}" data-i="${i}" id="sr-${i}" role="option" aria-selected="false">
          <span class="sr-ico">${icon(x.e.icon)}</span>
          <span><b>${highlight(x.e.title, keys)}</b><small>${esc(x.e.sub)}</small>${x.e.text ? `<span class="sr-snip">${highlight(nb(snippet(x.e.text, x.at)), keys)}</span>` : ''}</span>
        </a>`;
      };
      box.innerHTML = note + groups.map(g => {
        const all = open.has(g.k), shown = all ? g.list.slice(0, 40) : g.list.slice(0, 5), more = g.list.length - shown.length;
        return `<div class="sr-group" role="group" aria-label="${g.name}"><div class="sr-gh"><span>${g.name}</span><span>${g.list.length}</span></div>${shown.map(item).join('')}${more > 0 && !all ? `<button class="sr-more" type="button" data-more="${g.k}">Ещё ${more}</button>` : ''}</div>`;
      }).join('');
      setActive(0);
    };

    const go = i => {
      const e = found[i];
      if (!e) return;
      const q = input.value.trim();
      if (q) store.set(RECENT_KEY, [q].concat(store.get(RECENT_KEY, []).filter(x => x !== q)).slice(0, 6));
      markFound(e);
      closeSheet($('#sheet-search'));
      const u = entryUrl(e);
      if (!u.startsWith('#')) { location.href = u; return; }
      navigate(u);
      if (e.after) setTimeout(e.after, 60);
    };

    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const it = setActive(active + (e.key === 'ArrowDown' ? 1 : -1));
        if (it) it.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = $$('.sr-item', box)[active];
        if (it) go(+it.dataset.i);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSheet($('#sheet-search'));
      }
    });
    box.addEventListener('click', e => {
      const q = e.target.closest('[data-q]');
      if (q) { input.value = q.dataset.q; render(); input.focus({ preventScroll: true }); return; }
      if (e.target.closest('.sr-clear')) { store.set(RECENT_KEY, []); render(); input.focus({ preventScroll: true }); return; }
      const more = e.target.closest('[data-more]');
      if (more) { open.add(more.dataset.more); const y = scroller.scrollTop; render(); scroller.scrollTop = y; return; }
      if (e.target.closest('[data-exact]')) { exact = true; render(); return; }
      const item = e.target.closest('.sr-item');
      if (item) { e.preventDefault(); e.stopPropagation(); go(+item.dataset.i); }
    });
    box.addEventListener('pointermove', e => {
      const item = e.target.closest('.sr-item');
      if (item && e.pointerType === 'mouse') setActive($$('.sr-item', box).indexOf(item));
    });
    document.addEventListener('basil:search-ready', render);
    render();
  }
