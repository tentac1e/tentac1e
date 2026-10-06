  register('pesto', el => {
    el.innerHTML = h.head('Песто-лаборатория', 'Качественная модель двух процессов: ферментативного потемнения и оливкования хлорофилла. Соберите свой рецепт и посмотрите цвет через сутки.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">
          ${h.segHtml('lab-pe-m', 'Чем растираем', [['mortar', 'Ступка'], ['blender', 'Блендер']], 'blender')}
          <div class="lab-seg-wrap"><span class="lab-label">Добавки и приёмы</span><div class="chips-row lab-chips" id="lab-pe-x">
            <button class="chip" type="button" data-x="blanch" aria-pressed="false">Бланшировать 10 с</button>
            <button class="chip" type="button" data-x="vitc" aria-pressed="false">Щепотка аскорбинки</button>
            <button class="chip" type="button" data-x="lemon" aria-pressed="false">Лимонный сок</button>
            <button class="chip" type="button" data-x="oil" aria-pressed="false">Слой масла сверху</button>
          </div></div>
          ${h.segHtml('lab-pe-s', 'Хранение', [['fridge', 'Холодильник'], ['room', 'Комната']], 'room')}
          ${h.rangeHtml('lab-pe-h', 'Прошло времени', 0, 72, 1, 24)}
        </div>
        <div class="pesto-out">
          <svg class="pesto-jar" viewBox="0 0 160 190" aria-hidden="true">
            <rect class="jar-lid" x="34" y="10" width="92" height="20" rx="6"/>
            <path class="jar-glass" d="M40 30 H120 Q132 30 132 46 V164 Q132 180 116 180 H44 Q28 180 28 164 V46 Q28 30 40 30 Z"/>
            <path id="lab-pe-fill" d="M31 70 Q80 62 129 70 V162 Q129 177 115 177 H45 Q31 177 31 162 Z"/>
            <path class="jar-oil" id="lab-pe-oil" d="M31 62 Q80 56 129 62 V72 Q80 64 31 72 Z"/>
            <path class="jar-shine" d="M42 50 V150"/>
          </svg>
          <p class="pesto-verdict" id="lab-pe-v"></p>
          <div class="pesto-bars" id="lab-pe-bars"></div>
        </div>
      </div>
      <ul class="ticks pesto-notes" id="lab-pe-notes"></ul>`;
    const st = { m: 'blender', s: 'room', t: 24, x: new Set() };
    const upd = () => {
      const X = st.x;
      let kE = 0.05, kO = 0.004;
      if (st.m === 'blender') { kE *= 1.6; kO *= 1.3; }
      if (X.has('blanch')) { kE *= 0.12; kO *= 1.5; }
      if (X.has('vitc')) kE *= 0.35;
      if (X.has('lemon')) { kE *= 0.7; kO *= 6; }
      if (X.has('oil')) kE *= 0.45;
      if (st.s === 'fridge') { kE *= 0.35; kO *= 0.4; }
      const E = 1 - Math.exp(-kE * st.t), O = 1 - Math.exp(-kO * st.t);
      const fresh = h.css('--pesto-fresh'), brown = h.css('--pesto-brown'), olive = h.css('--pesto-olive');
      const col = h.mix(h.mix(fresh, brown, E * 0.85), olive, O * 0.8);
      $('#lab-pe-fill', el).style.fill = col;
      $('#lab-pe-oil', el).style.opacity = X.has('oil') ? 1 : 0;
      const score = Math.max(E * 0.9, O * 0.85);
      $('#lab-pe-v', el).innerHTML = `<b>${score < 0.15 ? 'Изумрудное' : score < 0.35 ? 'Слегка потускнело' : score < 0.6 ? (O > E ? 'Оливковое' : 'Потемнело') : (O > E ? 'Оливково-бурое' : 'Бурое')}</b> через ${st.t} ч`;
      $('#lab-pe-bars', el).innerHTML = [['Ферментативное потемнение', E, 's3'], ['Оливкование хлорофилла', O, 's2']].map(([n, v, c]) => `<div class="gdd-row"><span>${n}</span><i class="${c}" style="--w:${clamp(v, 0.02, 1) * 100}%"></i><b>${pct(v)}</b></div>`).join('');
      const notes = [];
      notes.push(st.m === 'blender' ? 'Блендер греет и взбивает с воздухом — потемнение ускоряется. Охладите чашу и работайте импульсами.' : 'Ступка не греет массу и почти не вбивает воздух.');
      if (X.has('blanch')) notes.push('Бланширование разрушило полифенолоксидазу — главный виновник потемнения выключен. Аромат при этом чуть слабее.');
      if (X.has('vitc')) notes.push('Аскорбиновая кислота восстанавливает хиноны обратно, пока сама не израсходуется.');
      if (X.has('lemon')) notes.push('Кислота лимона немного тормозит фермент, но ускоряет оливкование: ион магния уходит из хлорофилла.');
      if (X.has('oil')) notes.push('Слой масла отрезает кислород сверху.');
      notes.push(st.s === 'fridge' ? 'Холод замедляет обе реакции примерно втрое.' : 'При комнатной температуре реакции идут быстро — песто лучше съесть сразу.');
      $('#lab-pe-notes', el).innerHTML = notes.map(n => `<li>${h.nb(n)}</li>`).join('');
    };
    h.bindPick(el, 'lab-pe-m', v => { st.m = v; upd(); });
    h.bindPick(el, 'lab-pe-s', v => { st.s = v; upd(); });
    h.bindRange(el, 'lab-pe-h', v => `${v} ч`, v => { st.t = v; upd(); });
    $('#lab-pe-x', el).addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      const on = !st.x.has(b.dataset.x);
      if (on) st.x.add(b.dataset.x); else st.x.delete(b.dataset.x);
      b.setAttribute('aria-pressed', String(on));
      upd();
    });
    upd();
    document.addEventListener('basil:theme', upd);
  });
