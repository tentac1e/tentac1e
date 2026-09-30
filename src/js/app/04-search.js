  /* ================================================================== */
  /* SEARCH                                                              */
  /* ================================================================== */
  const norm = s => String(s).toLowerCase().replace(/ё/g, 'е');
  const textOf = el => {
    const parts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
    return parts.join(' ').replace(/\s+/g, ' ').replace(/\s([.,;:!?)»])/g, '$1').trim();
  };
  let searchIndex = [];

  function buildSearchIndex() {
    const idx = [];
    const add = e => idx.push(Object.assign({ n: norm(e.title + ' ' + (e.text || '')), nt: norm(e.title) }, e));
    B.CHAPTERS.forEach(c => add({ title: c.title, sub: `Глава ${c.num}`, text: c.desc, hash: c.id, icon: 'book' }));
    B.TOOLS.forEach(t => add({ title: t.title, sub: 'Инструмент', text: t.desc, hash: t.hash, icon: t.icon }));
    if (window.BASIL_SEARCH) window.BASIL_SEARCH.forEach(add); // text of every chapter, indexed at build time
    else $$('[data-panel]').forEach(p => {
      const ch = chapterById(p.closest('[data-view]').dataset.view);
      add({ title: p.dataset.title, sub: ch.title, text: textOf(p).slice(0, 400), hash: p.id, icon: 'list' });
    });
    let n = 0;
    const skip = '#chapters, #quick, #tools-home, #journey, .diag-result, .el-detail, #variety-detail, .quiz, .plan-list, .timeline, .dose-out, .npk-out, .soil-out, .dli-out, .stage-body, .pager, .sim, #glossary, #disease-grid, #pest-grid, #diag-groups, #place-panel, #check-groups, .lab-tool, .deep-index, .recipe-book, .deep-src';
    if (!window.BASIL_SEARCH) $$('[data-view] h3, [data-view] h4, [data-view] summary').forEach(h => {
      if (h.closest(skip)) return;
      const view = h.closest('[data-view]');
      const ch = chapterById(view.dataset.view);
      const panel = h.closest('[data-panel]');
      if (!h.id) h.id = h.parentElement.classList.contains('deeper') && h.closest('details.deep') ? h.closest('details.deep').id + '-glubzhe' : 's-' + (++n);
      const box = h.closest('details, .card, .step, .pane, article, .rule, li') || h.parentElement;
      const text = textOf(box);
      const deep = h.tagName === 'SUMMARY' && h.parentElement.classList.contains('deep') ? h.parentElement : null;
      if (h.tagName === 'SUMMARY' && h.parentElement.classList.contains('deeper')) {
        const host = h.closest('details.deep');
        add({ title: $('.deeper-t', h).textContent.trim(), sub: 'Ещё глубже · ' + (host ? host.dataset.short : where), text: textOf(h.nextElementSibling).slice(0, 420), hash: h.id, icon: 'hex' });
        return;
      }
      const where = (ch ? ch.title : 'Главная') + (panel && panel.dataset.title ? ' · ' + panel.dataset.title : '');
      if (deep) {
        add({ title: $('.deep-title', h).textContent.trim(), sub: 'Глубже · ' + where, text: textOf($('.deep-sub', h)) + ' ' + textOf($('.deep-body', deep)).slice(0, 420), hash: deep.id, icon: 'hex' });
        return;
      }
      add({ title: h.textContent.trim(), sub: where + (h.closest('.deep') ? ' · Глубже' : ''), text: text.slice(0, 360), hash: h.id, icon: h.tagName === 'SUMMARY' ? 'info' : 'leaf' });
    });
    B.DIAG.forEach(g => g.items.forEach(it => add({ title: it.title, sub: 'Проблемы · Диагностика', text: it.causes.map(c => c.name + '. ' + c.check).join(' '), hash: 'problemy-diagnostika', icon: 'bug', act: 'sym:' + it.id, after: () => selectSymptom(it.id, true) })));
    B.ELEMENTS.forEach((e, i) => add({ title: `${e.name} (${e.sym})`, sub: 'Удобрения · Элементы', text: e.role + ' ' + e.def, hash: 'udobreniya-elementy', icon: 'flask', act: 'el:' + i, after: () => selectElement(i, true) }));
    B.VARIETIES.forEach((v, i) => add({ title: `Сорт «${v.name}»`, sub: 'Сорта · Каталог', text: v.desc + ' ' + v.use, hash: 'sorta-katalog', icon: 'seed', act: 'var:' + i, after: () => openVariety(i) }));
    B.DISEASES.forEach((d, i) => add({ title: d.name, sub: 'Проблемы · Болезни', text: d.sign + ' ' + d.fix, hash: 'dis-' + i, icon: 'alert' }));
    B.PESTS.forEach((d, i) => add({ title: d.name, sub: 'Проблемы · Вредители', text: d.sign + ' ' + d.fix, hash: 'pest-' + i, icon: 'bug' }));
    if (B.RECIPES) {
      const catName = Object.fromEntries(B.RECIPE_CATS.map(([id, name, ic]) => [id, [name, ic]]));
      B.RECIPES.forEach(r => add({ title: r.title, sub: 'Рецепты · ' + catName[r.cat][0], text: `${r.orig}. ${r.ing.map(i => i[0]).join(', ')}. ${r.sci[0]}`, hash: 'r-' + r.id, icon: catName[r.cat][1] }));
    }
    B.GLOSSARY.forEach(([t, d], i) => add({ title: t, sub: 'Справка · Словарь', text: d, hash: 'g-' + i, icon: 'book' }));
    if (window.BasilScience) {
      Object.values(window.BasilScience.MOLS).forEach(m => add({ title: m.name + (m.alt ? ` (${m.alt})` : ''), sub: 'Вкус · Молекулы аромата', text: `${m.cls}. Запах: ${m.smell}. Есть в: ${m.where}. Сорта: ${m.basil}. ${m.note}`, hash: 'vkus-molekuly', icon: 'hex' }));
      window.BasilScience.PAIRS.forEach(pr => add({ title: `Базилик и ${pr.name.toLowerCase()}`, sub: 'Вкус · Сочетания', text: pr.why + ' ' + pr.dish, hash: 'vkus-sochetaniya', icon: 'nose' }));
    }
    idx.forEach(e => { if (!e.page) e.page = pageOf(e.hash) || here; });
    searchIndex = idx;
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

  function highlight(text, words) {
    let out = esc(text);
    words.forEach(w => {
      if (w.length < 2) return;
      const re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/е/g, '[её]') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  function snippet(text, word) {
    const t = String(text);
    const i = norm(t).indexOf(word);
    if (i < 0) return t.slice(0, 110) + (t.length > 110 ? '…' : '');
    const start = Math.max(0, i - 40);
    return (start > 0 ? '…' : '') + t.slice(start, start + 120) + (start + 120 < t.length ? '…' : '');
  }

  function initSearch() {
    const input = $('#search-input');
    const box = $('#search-results');
    if (!input || !box) return;
    let results = [];
    let active = 0;
    const hints = ['желтеют листья', 'азот', 'прищипывание', 'лампа', 'песто', 'черенки', 'магазин', 'рассада'];

    const render = () => {
      const q = norm(input.value.trim());
      if (!q) {
        box.innerHTML = `<div class="sr-hint">Ищите по симптомам, элементам, сортам и советам.<div class="chips-row">${hints.map(h => `<button class="chip" type="button" data-q="${h}">${h}</button>`).join('')}</div></div>`;
        results = [];
        return;
      }
      const words = q.split(/\s+/).filter(Boolean);
      results = searchIndex
        .map(e => {
          if (!words.every(w => e.n.includes(w))) return null;
          let s = 0;
          if (e.nt.includes(q)) s += 10;
          if (e.nt.startsWith(q)) s += 5;
          words.forEach(w => { if (e.nt.includes(w)) s += 3; });
          if (e.sub === 'Инструмент') s += 1;
          return { e, s };
        })
        .filter(Boolean)
        .sort((a, b) => b.s - a.s)
        .slice(0, 24)
        .map(x => x.e);
      active = 0;
      if (!results.length) {
        box.innerHTML = `<div class="sr-empty">Ничего не нашлось по запросу «${esc(input.value.trim())}». Попробуйте другое слово, например «полив» или «удобрение».</div>`;
        return;
      }
      box.innerHTML = results.map((e, i) => `
        <a class="sr-item${i === 0 ? ' is-active' : ''}" href="${esc(entryUrl(e))}" data-i="${i}" role="option" aria-selected="${i === 0}">
          <span class="sr-ico">${icon(e.icon)}</span>
          <span><b>${highlight(e.title, words)}</b><small>${esc(e.sub)}</small><span class="sr-snip">${highlight(snippet(e.text || '', words[0]), words)}</span></span>
        </a>`).join('');
    };

    const go = i => {
      const e = results[i];
      if (!e) return;
      closeSheet($('#sheet-search'));
      const u = entryUrl(e);
      if (!u.startsWith('#')) { location.href = u; return; }
      navigate(u);
      if (e.after) setTimeout(e.after, 60);
    };

    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      const items = $$('.sr-item', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((it, i) => { it.classList.toggle('is-active', i === active); it.setAttribute('aria-selected', String(i === active)); });
        items[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        go(active);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSheet($('#sheet-search'));
      }
    });
    box.addEventListener('click', e => {
      const chip = e.target.closest('[data-q]');
      if (chip) { input.value = chip.dataset.q; render(); input.focus(); return; }
      const item = e.target.closest('.sr-item');
      if (item) { e.preventDefault(); e.stopPropagation(); go(+item.dataset.i); }
    });
    document.addEventListener('basil:search-ready', render);
    render();
  }

