  /* ================================================================== */
  /* REFERENCE: glossary, checklist                                      */
  /* ================================================================== */
  function initGlossary() {
    const box = $('#glossary');
    const q = $('#gloss-q');
    if (!box) return;
    const sorted = B.GLOSSARY.map((g, i) => ({ t: g[0], d: g[1], i })).sort((a, b) => a.t.localeCompare(b.t, 'ru'));
    box.innerHTML = sorted.map(g => `<div class="gloss-item" id="g-${g.i}"><dt>${g.t}</dt><dd>${nb(g.d)}</dd></div>`).join('') + '<p class="gloss-empty" hidden>Такого термина нет. Попробуйте поиск по всему гиду.</p>';
    const items = $$('.gloss-item', box);
    const empty = $('.gloss-empty', box);
    if (q) q.addEventListener('input', () => {
      const v = norm(q.value.trim());
      let n = 0;
      items.forEach(it => { const show = !v || norm(it.textContent).includes(v); it.hidden = !show; if (show) n++; });
      empty.hidden = n > 0;
    });
  }

  function initChecklist() {
    const wrap = $('#check-groups');
    if (!wrap) return;
    const bar = $('#check-bar');
    const count = $('#check-count');
    const KEY = 'basil-checklist-v1';
    const state = store.get(KEY, {}) || {};
    wrap.innerHTML = B.CHECKLIST.map(g => `
      <div class="card check-group">
        <h4>${g.title}</h4>
        <ul>${g.items.map(([id, text]) => `
          <li><label class="check-item" for="ck-${id}">
            <input type="checkbox" id="ck-${id}" data-id="${id}"${state[id] ? ' checked' : ''}>
            <span class="check-box" aria-hidden="true">${icon('check')}</span>
            <span>${nb(text)}</span>
          </label></li>`).join('')}</ul>
      </div>`).join('');
    const boxes = $$('input[type="checkbox"]', wrap);
    const update = () => {
      const done = boxes.filter(b => b.checked).length;
      bar.style.width = `${Math.round(done / boxes.length * 100)}%`;
      count.textContent = done === boxes.length ? `Все ${boxes.length} шагов выполнены — отличный сезон!` : `Выполнено ${done} из ${boxes.length}`;
    };
    wrap.addEventListener('change', e => {
      const b = e.target;
      if (!b.dataset || !b.dataset.id) return;
      state[b.dataset.id] = b.checked;
      store.set(KEY, state);
      update();
      if (b.checked && boxes.every(x => x.checked)) setTimeout(() => HAP.success(), 120);
    });
    $('#check-reset').addEventListener('click', () => {
      boxes.forEach(b => { b.checked = false; state[b.dataset.id] = false; });
      store.set(KEY, state);
      update();
    });
    update();
  }

  function initRecipes() {
    const book = $('#recipe-book');
    if (!book || !B.RECIPES) return;
    const cats = Object.fromEntries(B.RECIPE_CATS.map(([id, name, ic]) => [id, { name, ic }]));
    const linkLabel = href => {
      const el = document.getElementById(href.slice(1));
      if (!el) return (PAGES && PAGES.titles && PAGES.titles[href.slice(1)]) || 'подробнее';
      if (el.classList.contains('deep')) return 'Глубже: ' + el.dataset.short;
      const ch = chapterById(el.closest('[data-view]').dataset.view);
      return `${ch ? ch.title : ''} · ${el.dataset.title}`;
    };
    const count = c => B.RECIPES.filter(r => c === 'all' || r.cat === c).length;
    const card = r => `
      <details class="recipe-card${r.feat ? ' is-feat' : ''}" id="r-${r.id}" data-cat="${r.cat}"${r.feat ? ' open' : ''}>
        <summary><span class="rc-sum">
          <span class="rc-ico" aria-hidden="true">${icon(cats[r.cat].ic)}</span>
          <span class="rc-head"><span class="rc-cat">${cats[r.cat].name}<span class="rc-time"> · ${nb(r.time)}</span></span><span class="rc-title">${r.title}</span><span class="rc-orig">${r.orig}</span></span>
          <span class="deep-plus" aria-hidden="true"></span>
        </span></summary>
        <div class="rc-body">
          <p class="rc-facts"><span>${icon('cal')}${nb(r.time)}</span><span>${icon('leaf')}${r.basil}</span></p>
          <div class="recipe-grid">
            <ul class="ingredients">${r.ing.map(([n, v]) => `<li><span>${n}</span>${v ? `<span>${nb(v)}</span>` : ''}</li>`).join('')}</ul>
            <ol class="rc-steps">${r.steps.map(x => `<li>${nb(x)}</li>`).join('')}</ol>
          </div>
          ${r.tip ? `<p class="rc-tip">${icon('info')}<span>${nb(r.tip)}</span></p>` : ''}
          <div class="rc-sci">
            <span class="rc-sci-k">${icon('hex')}Наука рецепта</span>
            <p>${nb(r.sci[0])}</p>
            <a href="${r.sci[1]}">${esc(linkLabel(r.sci[1]))} <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </details>`;
    book.innerHTML = `
      <div class="chips-row rb-filter" role="group" aria-label="Разделы книги рецептов">
        <button type="button" class="chip" data-cat="all" aria-pressed="true">Все <b>${count('all')}</b></button>
        ${B.RECIPE_CATS.map(([id, name, ic]) => `<button type="button" class="chip" data-cat="${id}" aria-pressed="false">${icon(ic)}${name} <b>${count(id)}</b></button>`).join('')}
      </div>
      <div class="rb-grid">${B.RECIPES.map(card).join('')}</div>`;
    const cards = $$('.recipe-card', book);
    $('.rb-filter', book).addEventListener('click', e => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      const c = b.dataset.cat;
      $$('.rb-filter [data-cat]', book).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      cards.forEach(el => { el.hidden = c !== 'all' && el.dataset.cat !== c; });
    });
  }

