  register('flows', el => {
    el.innerHTML = h.head('Два потока и хлорофилл', 'Синие штрихи — ксилема с водой и ионами, жёлтые — флоэма с сахарами. Выберите группу элементов, чтобы увидеть, где проявится нехватка.') +
      `<div class="lab-controls">${h.segHtml('lab-fl-m', 'Элементы', [['mob', 'Подвижные: N, P, K, Mg'], ['imm', 'Неподвижные: Ca, Fe, B']], 'mob')}</div>
       <div class="lab-grid flows-grid">
        <div class="lab-stage"><svg class="lab-plant flows-svg" viewBox="-220 -300 440 400" role="img" aria-label="Растение с потоками ксилемы и флоэмы"><g id="lab-fl-g"></g>
          <g class="roots"><path d="M0 0 C -6 26 -30 40 -44 70 M0 0 C 4 30 26 46 40 76 M0 0 C 0 40 -8 60 -2 92 M-18 38 C -34 44 -52 44 -66 56 M16 44 C 34 50 48 50 64 62"/></g>
          <line class="soil-line" x1="-200" x2="200" y1="0" y2="0"/>
          <path class="xylem" d="M-3 90 C -4 40 -3 0 -3 -40 S -3 -160 -3 -250"/>
          <path class="phloem" d="M3 -250 C 3 -160 3 -60 3 0 S 4 50 5 90"/>
          <text class="tick" x="-14" y="60" text-anchor="end">ксилема ↑</text><text class="tick" x="14" y="44">флоэма ↕</text>
          <text class="tick fl-tag" id="lab-fl-tag" x="214" y="-250" text-anchor="end"></text>
        </svg></div>
        <figure class="chl-fig"><svg viewBox="0 0 220 220" role="img" aria-label="Схема молекулы хлорофилла: четыре пиррольных кольца вокруг иона магния">
          <g class="chl-ring">
            <path d="M110 44 L128 56 L122 78 L98 78 L92 56 Z"/><path d="M176 110 L164 128 L142 122 L142 98 L164 92 Z"/>
            <path d="M110 176 L92 164 L98 142 L122 142 L128 164 Z"/><path d="M44 110 L56 92 L78 98 L78 122 L56 128 Z"/>
            <path class="chl-bridge" d="M128 56 Q 158 62 164 92 M164 128 Q 158 158 128 164 M92 164 Q 62 158 56 128 M56 92 Q 62 62 92 56"/>
          </g>
          <g class="chl-bonds"><path d="M110 78 L110 98 M142 110 L122 110 M110 142 L110 122 M78 110 L98 110"/></g>
          <circle class="chl-mg" cx="110" cy="110" r="14"/><text class="chl-mg-t" x="110" y="115" text-anchor="middle">Mg</text>
          <g class="chl-n"><circle cx="110" cy="80" r="8"/><circle cx="140" cy="110" r="8"/><circle cx="110" cy="140" r="8"/><circle cx="80" cy="110" r="8"/></g>
          <g class="chl-n-t"><text x="110" y="84" text-anchor="middle">N</text><text x="140" y="114" text-anchor="middle">N</text><text x="110" y="144" text-anchor="middle">N</text><text x="80" y="114" text-anchor="middle">N</text></g>
          <path class="chl-tail" d="M110 176 C 112 188 100 194 106 204 S 118 214 112 220"/>
        </svg><figcaption>Хлорофилл: четыре кольца с азотом держат ион магния. Хвост из фитола закрепляет молекулу в мембране.</figcaption></figure>
       </div>`;
    const plant = S.Plant($('#lab-fl-g', el), S.basil({ nodes: 7, scale: 2.05, w: 9 }), { grown: true, leafScale: 0.72, sway: 0.5 });
    const upd = v => {
      const shoots = plant.shoots();
      shoots.forEach(s => s.leaves.forEach(lf => {
        const n = s.spec.internodes.length;
        const sick = v === 'mob' ? lf.node <= 1 : lf.node >= n - 3;
        lf.el.classList.toggle('is-sick', sick);
      }));
      const tag = $('#lab-fl-tag', el);
      tag.textContent = v === 'mob' ? 'голод виден снизу' : 'голод виден сверху';
      tag.setAttribute('y', v === 'mob' ? '-40' : '-240');
    };
    h.bindPick(el, 'lab-fl-m', upd);
    upd('mob');
  });
