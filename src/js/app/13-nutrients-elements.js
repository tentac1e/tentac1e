  /* ================================================================== */
  /* NUTRIENTS: elements                                                 */
  /* ================================================================== */
  const GROUP_NAME = { macro: 'Макроэлемент', meso: 'Мезоэлемент', micro: 'Микроэлемент' };
  const MOB = {
    mobile: { arrow: '↓', text: 'Подвижный: симптомы на старых листьях' },
    immobile: { arrow: '↑', text: 'Неподвижный: симптомы на молодых листьях' },
    partial: { arrow: '↕', text: 'Частично подвижный' }
  };
  let selectElement = () => {};

  function initElements() {
    const grid = $('#el-grid');
    const detail = $('#el-detail');
    if (!grid || !detail) return;
    grid.innerHTML = B.ELEMENTS.map((e, i) => `
      <button class="el-tile" type="button" data-group="${e.group}" data-i="${i}" aria-pressed="false" aria-label="${e.name}, ${GROUP_NAME[e.group].toLowerCase()}">
        <span class="el-mob" aria-hidden="true">${MOB[e.mob].arrow}</span>
        <span class="el-sym">${e.sym}</span>
        <span class="el-name">${e.name}</span>
      </button>`).join('');
    const tiles = $$('.el-tile', grid);
    selectElement = (i, scroll) => {
      const e = B.ELEMENTS[i];
      tiles.forEach((t, j) => t.setAttribute('aria-pressed', String(i === j)));
      detail.innerHTML = `
        <header>
          <div class="el-big ${e.group === 'macro' ? '' : 'is-' + e.group}" aria-hidden="true">${e.sym}</div>
          <div><h3>${e.name}</h3><div class="el-badges"><span class="badge">${GROUP_NAME[e.group]}</span><span class="badge">${MOB[e.mob].arrow} ${MOB[e.mob].text}</span></div></div>
        </header>
        <div class="el-section"><h4>За что отвечает</h4><p>${nb(e.role)}</p></div>
        <div class="el-section is-def"><h4>Признаки нехватки</h4><span class="el-ill" data-ill="def:${e.sym}"></span><p>${nb(e.def)}</p></div>
        <div class="el-section is-exc"><h4>Признаки избытка</h4><p>${nb(e.exc)}</p></div>
        <div class="el-section"><h4>Где взять</h4><p><b>Минеральные:</b> ${nb(e.mineral)}.<br><b>Органические:</b> ${nb(e.organic)}.</p></div>
        <div class="el-section"><h4>Когда важнее всего</h4><p>${nb(e.when)}</p></div>`;
      // at start the tab may be closed: the picture waits until it is seen; after a tap it is drawn at once
      paintIll(detail, !!scroll);
      if (scroll && window.matchMedia('(max-width: 940px)').matches) detail.scrollIntoView({ block: 'start', behavior: smooth() });
    };
    tiles.forEach((t, i) => t.addEventListener('click', () => selectElement(i, true)));
    selectElement(0, false);
  }

