  /* ================================================================== */
  /* VARIETIES + QUIZ                                                    */
  /* ================================================================== */
  function leafArt(v) {
    const sx = { wide: 1.2, normal: 1, narrow: 0.62, small: 0.85 }[v.shape] || 1;
    const s = v.shape === 'small' ? 0.62 : 0.78;
    const side = s * 0.78;
    return `<svg viewBox="-44 -80 88 84" aria-hidden="true"><g class="lf-${v.leaf}">
      <path d="M0 4 L0 -6" fill="none" stroke-width="2.4" stroke-linecap="round"/>
      <use href="#leaf-shape" transform="rotate(-44) scale(${f1(sx * side * 100) / 100} ${f1(side * 100) / 100})"/>
      <use href="#leaf-shape" transform="rotate(44) scale(${f1(sx * side * 100) / 100} ${f1(side * 100) / 100})"/>
      <use href="#leaf-shape" transform="scale(${f1(sx * s * 100) / 100} ${s})"/>
    </g></svg>`;
  }
  const labelCls = l => (/фиолет|декор/.test(l) ? 't-opal' : /устойчив|чай|цитрус|десерт|многолет|карлик/.test(l) ? 't-oil' : '');
  const meter = (n, max) => `<span class="meter" aria-hidden="true">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const EASY = { 1: 'легко', 2: 'средне', 3: 'капризный' };
  // the picture of a variety: a simple leaf until the chapter's drawings arrive (src/labs/sorta/_shared.js)
  const sortPic = i => `<span class="v-leaf" data-ill="sort:${i}">${leafArt(B.VARIETIES[i])}</span>`;
  let showVarietyType = () => {};

  function openVariety(i) {
    const v = B.VARIETIES[i];
    const box = $('#variety-detail');
    if (!v || !box) return;
    const where = v.pot >= 2 && v.garden >= 2 ? 'горшок и грядка' : v.pot >= 2 ? 'горшок, подоконник' : v.garden >= 2 ? 'грядка, большой горшок' : 'горшок или грядка';
    const resist = v.resist === 'dm' ? 'ложная мучнистая роса' : v.resist === 'fus' ? 'фузариоз' : '—';
    const type = B.VARIETY_TYPES.find(t => t.id === v.type);
    box.innerHTML = `
      <div class="vd-head">
        ${sortPic(i)}
        <div><h2 id="variety-h">${v.name}</h2><span class="v-latin">${v.latin}</span>${type ? `<span class="vd-type">${type.name}</span>` : ''}<ul class="tags">${v.labels.map(l => `<li class="${labelCls(l)}">${l}</li>`).join('')}</ul></div>
      </div>
      <p>${nb(v.desc)}</p>
      <dl class="vd-specs">
        <div><dt>Высота</dt><dd>${nb(v.height)}</dd></div>
        <div><dt>Первый срез</dt><dd>${nb(v.first)}</dd></div>
        <div><dt>Аромат</dt><dd>${v.aroma}</dd></div>
        <div><dt>Сложность</dt><dd>${meter(v.easy, 3)}${EASY[v.easy]}</dd></div>
        <div><dt>Где лучше</dt><dd>${where}</dd></div>
        <div><dt>Устойчивость</dt><dd>${resist}</dd></div>
      </dl>
      <p><b>Для чего:</b> ${v.use}</p>
      <div class="callout"><svg class="ico"><use href="#i-leaf"/></svg><p><b>Особенности ухода.</b> ${nb(v.care)}</p></div>
      <div class="hero-actions"><button class="btn btn-primary btn-small" type="button" data-garden-add="seed" data-variety="${esc(v.name)}">${icon('sprout')}Растёт у меня</button><a class="btn btn-ghost btn-small" href="#posadka-posev">${icon('seed')}Как посеять</a><a class="btn btn-ghost btn-small" href="#sorta-podbor">${icon('list')}Подобрать сорт</a></div>`;
    paintIll(box, true);
    showVarietyType(i);
    openSheet('sheet-variety');
  }

  /* the catalog: eight types with approximate values; a tap on a type opens its varieties under its row.
     One type at a time; a filter shows the types that have matching varieties, all open, with only those */
  function initVarieties() {
    const grid = $('#variety-grid');
    if (!grid) return;
    const chips = $$('#variety-filters .chip');
    const count = $('#variety-count');
    const TYPES = B.VARIETY_TYPES;
    const all = B.VARIETIES.length;
    const sortsOf = id => B.VARIETIES.map((v, i) => [v, i]).filter(([v]) => v.type === id);
    const sortCard = ([v, i]) => `
      <button class="variety" type="button" data-i="${i}" aria-haspopup="dialog">
        ${sortPic(i)}
        <span>
          <span class="v-name">${v.name}</span>
          <span class="v-latin">${v.latin}</span>
          <span class="v-line">${nb(v.height)} · срез ${nb(v.first)}</span>
          <span class="v-aroma">${v.aroma}</span>
          <ul class="tags">${v.labels.map(l => `<li class="${labelCls(l)}">${l}</li>`).join('')}</ul>
        </span>
      </button>`;
    const leafIco = v => `<svg viewBox="-24 -70 48 72" aria-hidden="true"><g class="lf-${v.leaf}"><use href="#leaf-shape"/></g></svg>`;
    grid.innerHTML = TYPES.map(t => {
      const list = sortsOf(t.id);
      return `
      <article class="vtype" data-t="${t.id}">
        <span class="vt-pic" data-ill="vtype:${t.id}"></span>
        <div class="vt-head">
          <h3 class="vt-name"><button class="vt-toggle" type="button" aria-expanded="false" aria-controls="vt-p-${t.id}">${t.name}</button></h3>
          <span class="vt-meta"><span class="vt-n">${list.length} ${plural(list.length, 'сорт', 'сорта', 'сортов')}</span> · ${meter(t.easy, 3)}${EASY[t.easy]}</span>
        </div>
        <p class="vt-desc">${nb(t.desc)}</p>
        <dl class="vt-specs">
          <div><dt>Аромат</dt><dd>${t.aroma}</dd></div>
          <div><dt>Высота</dt><dd>${nb(t.height)}</dd></div>
          <div><dt>Первый срез</dt><dd>${nb(t.first)}</dd></div>
          <div><dt>Для чего</dt><dd>${t.use}</dd></div>
          <div class="vt-wide"><dt>Где растить</dt><dd>${nb(t.where)}</dd></div>
        </dl>
        <div class="vt-foot" aria-hidden="true"><span class="vt-leaves">${list.map(([v]) => leafIco(v)).join('')}</span><span class="vt-more">Сорта</span><svg class="ico vt-chev"><use href="#i-chev-r"/></svg></div>
      </article>
      <div class="vt-panel" id="vt-p-${t.id}" data-t="${t.id}" role="region" aria-label="Сорта: ${t.name.toLowerCase()}" hidden>
        <p class="vt-panel-h"><b>${t.name}</b> · ${list.length} ${plural(list.length, 'сорт', 'сорта', 'сортов')} · нажмите на сорт, чтобы открыть подробности</p>
        <div class="vt-sorts">${list.map(sortCard).join('')}</div>
      </div>`;
    }).join('');
    const cards = $$('.vtype', grid);
    const panelOf = c => $(`#vt-p-${c.dataset.t}`, grid);
    let filter = 'all';
    const open = new Set();
    const match = v => filter === 'all' || (filter === 'resist' ? !!v.resist : v.tags.includes(filter));

    // an open type's varieties go under the row of its card, so the cards keep their places
    let cols = 0;
    function place() {
      cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      const shown = cards.filter(c => !c.hidden);
      const gx = grid.getBoundingClientRect().left;
      for (let r = 0; r < shown.length; r += cols) {
        const row = shown.slice(r, r + cols);
        let after = row[row.length - 1];
        row.forEach(c => {
          const p = panelOf(c);
          const on = open.has(c.dataset.t);
          c.classList.toggle('is-open', on);
          $('.vt-toggle', c).setAttribute('aria-expanded', String(on));
          $('.vt-more', c).textContent = on ? 'Свернуть' : 'Сорта';
          if (!on) { p.hidden = true; return; }
          if (after.nextElementSibling !== p) after.after(p);
          after = p;
          p.hidden = false;
          const b = c.getBoundingClientRect();
          p.style.setProperty('--ax', `${Math.round(b.left - gx + b.width / 2)}px`);
        });
      }
      cards.filter(c => c.hidden).forEach(c => { c.classList.remove('is-open'); panelOf(c).hidden = true; });
    }
    // the tapped card stays where it was on the screen while panels above it open and close
    function keep(card, fn) {
      const y0 = card.getBoundingClientRect().top;
      fn();
      const dy = card.getBoundingClientRect().top - y0;
      if (Math.abs(dy) > 1) window.scrollBy(0, dy);
    }
    function toggle(card, on) {
      const id = card.dataset.t;
      keep(card, () => {
        if (filter === 'all') open.clear();
        if (on) open.add(id); else open.delete(id);
        place();
      });
      if (!on) return;
      const p = panelOf(card);
      paintIll(p, true);
      const r = p.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.78) window.scrollBy({ top: r.top - window.innerHeight * 0.42, behavior: smooth() });
    }
    const apply = f => {
      filter = f;
      let n = 0;
      open.clear();
      cards.forEach(c => {
        const list = sortsOf(c.dataset.t), p = panelOf(c);
        let k = 0;
        $$('.variety', p).forEach(b => { const on = match(B.VARIETIES[+b.dataset.i]); b.hidden = !on; if (on) k++; });
        n += k;
        c.hidden = !k;
        $('.vt-n', c).textContent = f === 'all' ? `${list.length} ${plural(list.length, 'сорт', 'сорта', 'сортов')}` : `${k} из ${list.length}`;
        if (f !== 'all' && k) open.add(c.dataset.t);
      });
      if (count) count.textContent = f === 'all' ? `${all} ${plural(all, 'сорт', 'сорта', 'сортов')} в ${TYPES.length} типах` : `${n} ${plural(n, 'сорт', 'сорта', 'сортов')} из ${all}`;
      chips.forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.filter === f)));
      place();
      if (f !== 'all') paintIll(grid, true);
    };
    chips.forEach(ch => ch.addEventListener('click', () => apply(ch.dataset.filter)));
    grid.addEventListener('click', e => {
      const s = e.target.closest('.variety');
      if (s) { openVariety(+s.dataset.i); return; }
      const c = e.target.closest('.vtype');
      if (c) toggle(c, !open.has(c.dataset.t));
    });
    // the number of columns follows the width: move the open panels under their rows again
    if ('ResizeObserver' in window) new ResizeObserver(() => { const n = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1; if (n !== cols) place(); }).observe(grid);
    // a variety opened from search or the quiz: its type opens behind the sheet
    showVarietyType = i => {
      const v = B.VARIETIES[i];
      const card = v && cards.find(c => c.dataset.t === v.type);
      if (!card) return;
      if (!match(v)) apply('all');
      if (!open.has(v.type)) { if (filter === 'all') open.clear(); open.add(v.type); place(); paintIll(panelOf(card), true); }
    };
    apply('all');
  }

  function scoreVariety(v, a) {
    let s = 0;
    const why = [];
    const place = a.place === 'pot' ? v.pot : a.place === 'garden' ? v.garden : Math.min(2, (v.pot + v.garden) / 2 + (v.pot >= 1 ? 0.5 : 0));
    s += place * 2;
    if (place >= 2) why.push(a.place === 'pot' ? 'компактный, хорош в горшке' : a.place === 'garden' ? 'раскрывается на грядке' : 'подходит для балконного ящика');
    if (a.use === 'all') {
      if (v.universal) { s += 3; why.push('универсален на кухне'); }
    } else if (v.uses.includes(a.use)) {
      s += 4;
      why.push({ pesto: 'для песто и итальянской кухни', asian: 'для азиатской кухни', tea: 'для чая и десертов', decor: 'красив и нравится пчёлам' }[a.use]);
    }
    if (a.climate === 'hot' && v.heat) { s += 2.5; why.push('переносит жару'); }
    if (a.climate === 'damp' && v.resist) { s += 3; why.push(v.resist === 'dm' ? 'устойчив к ложной мучнистой росе' : 'устойчив к фузариозу'); }
    if (a.climate === 'damp' && v.easy === 3) s -= 1;
    if (a.exp === 'new') {
      if (v.easy === 1) { s += 1.5; why.push('прост для новичка'); }
      if (v.easy === 3) s -= 2;
    }
    return { s, why };
  }

  function initQuiz() {
    const box = $('#quiz');
    if (!box) return;
    let step = 0;
    let answers = {};
    const render = () => {
      if (step >= B.QUIZ.length) {
        const ranked = B.VARIETIES.map((v, i) => ({ v, i, ...scoreVariety(v, answers) })).sort((x, y) => y.s - x.s).slice(0, 3);
        box.innerHTML = `
          <div class="quiz-progress">${B.QUIZ.map(() => '<i class="on"></i>').join('')}</div>
          <span class="quiz-count">Результат</span>
          <h3>Вам подойдут</h3>
          <div class="quiz-results">${ranked.map((r, n) => `
            <button class="qr" type="button" data-i="${r.i}">
              <span class="qr-rank">${n + 1}</span>
              ${sortPic(r.i)}
              <span><span class="v-name">${r.v.name}</span><span class="qr-why">${r.why.length ? r.why.slice(0, 3).join(' · ') : 'хороший универсальный выбор'}</span><span class="qr-score"><i style="width:${Math.round(clamp(r.s / 12.5, 0.08, 1) * 100)}%"></i></span></span>
            </button>`).join('')}</div>
          <button class="btn btn-ghost btn-small quiz-back" type="button" data-restart>${icon('seed')}Пройти заново</button>`;
        paintIll(box, true);
        return;
      }
      const q = B.QUIZ[step];
      box.innerHTML = `
        <div class="quiz-progress">${B.QUIZ.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
        <div class="quiz-step">
          <span class="quiz-count">Вопрос ${step + 1} из ${B.QUIZ.length}</span>
          <h3>${q.q}</h3>
          <div class="quiz-options">${q.options.map(([v, t]) => `<button type="button" data-v="${v}">${t}</button>`).join('')}</div>
          ${step > 0 ? `<button class="btn btn-ghost btn-small quiz-back" type="button" data-back>${icon('chev-l')}Назад</button>` : ''}
        </div>`;
    };
    box.addEventListener('click', e => {
      const opt = e.target.closest('[data-v]');
      if (opt) { answers[B.QUIZ[step].id] = opt.dataset.v; step += 1; render(); return; }
      if (e.target.closest('[data-back]')) { step = Math.max(0, step - 1); render(); return; }
      if (e.target.closest('[data-restart]')) { step = 0; answers = {}; render(); return; }
      const r = e.target.closest('.qr');
      if (r) openVariety(+r.dataset.i);
    });
    render();
  }

