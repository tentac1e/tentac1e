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

  function openVariety(i) {
    const v = B.VARIETIES[i];
    const box = $('#variety-detail');
    if (!v || !box) return;
    const easy = { 1: 'легко', 2: 'средне', 3: 'капризный' }[v.easy];
    const where = v.pot >= 2 && v.garden >= 2 ? 'горшок и грядка' : v.pot >= 2 ? 'горшок, подоконник' : v.garden >= 2 ? 'грядка, большой горшок' : 'горшок или грядка';
    const resist = v.resist === 'dm' ? 'ложная мучнистая роса' : v.resist === 'fus' ? 'фузариоз' : '—';
    box.innerHTML = `
      <div class="vd-head">
        <div class="v-leaf">${leafArt(v)}</div>
        <div><h2 id="variety-h">${v.name}</h2><span class="v-latin">${v.latin}</span><ul class="tags">${v.labels.map(l => `<li class="${labelCls(l)}">${l}</li>`).join('')}</ul></div>
      </div>
      <p>${nb(v.desc)}</p>
      <dl class="vd-specs">
        <div><dt>Высота</dt><dd>${nb(v.height)}</dd></div>
        <div><dt>Первый срез</dt><dd>${nb(v.first)}</dd></div>
        <div><dt>Аромат</dt><dd>${v.aroma}</dd></div>
        <div><dt>Сложность</dt><dd>${meter(v.easy, 3)}${easy}</dd></div>
        <div><dt>Где лучше</dt><dd>${where}</dd></div>
        <div><dt>Устойчивость</dt><dd>${resist}</dd></div>
      </dl>
      <p><b>Для чего:</b> ${v.use}</p>
      <div class="callout"><svg class="ico"><use href="#i-leaf"/></svg><p><b>Особенности ухода.</b> ${nb(v.care)}</p></div>
      <div class="hero-actions"><a class="btn btn-primary btn-small" href="#posadka-posev">${icon('seed')}Как посеять</a><a class="btn btn-ghost btn-small" href="#sorta-podbor">${icon('list')}Подобрать сорт</a></div>`;
    openSheet('sheet-variety');
  }

  function initVarieties() {
    const grid = $('#variety-grid');
    if (!grid) return;
    const chips = $$('#variety-filters .chip');
    const count = $('#variety-count');
    grid.innerHTML = B.VARIETIES.map((v, i) => `
      <button class="variety" type="button" data-i="${i}" aria-haspopup="dialog">
        <span class="v-leaf">${leafArt(v)}</span>
        <span>
          <span class="v-name">${v.name}</span>
          <span class="v-latin">${v.latin}</span>
          <span class="v-line">${nb(v.height)} · срез ${nb(v.first)}</span>
          <ul class="tags">${v.labels.map(l => `<li class="${labelCls(l)}">${l}</li>`).join('')}</ul>
        </span>
      </button>`).join('');
    const cards = $$('.variety', grid);
    const apply = f => {
      let n = 0;
      cards.forEach((c, i) => {
        const v = B.VARIETIES[i];
        const show = f === 'all' || (f === 'resist' ? !!v.resist : v.tags.includes(f));
        c.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = `${n} ${plural(n, 'сорт', 'сорта', 'сортов')} из ${B.VARIETIES.length}`;
      chips.forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.filter === f)));
    };
    chips.forEach(ch => ch.addEventListener('click', () => apply(ch.dataset.filter)));
    grid.addEventListener('click', e => { const c = e.target.closest('.variety'); if (c) openVariety(+c.dataset.i); });
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
              <span class="v-leaf">${leafArt(r.v)}</span>
              <span><span class="v-name">${r.v.name}</span><span class="qr-why">${r.why.length ? r.why.slice(0, 3).join(' · ') : 'хороший универсальный выбор'}</span><span class="qr-score"><i style="width:${Math.round(clamp(r.s / 12.5, 0.08, 1) * 100)}%"></i></span></span>
            </button>`).join('')}</div>
          <button class="btn btn-ghost btn-small quiz-back" type="button" data-restart>${icon('seed')}Пройти заново</button>`;
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

