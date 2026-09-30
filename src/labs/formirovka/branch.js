  register('branch', el => {
    el.innerHTML = h.head('Куст после n прищипываний', 'Каждый срез над узлом будит две почки. Сдвиньте ползунок — новые побеги вырастут на глазах.') +
      `<div class="lab-grid wide-stage">
        <div class="lab-stage"><svg class="lab-plant" viewBox="-250 -350 500 370" role="img" aria-label="Куст базилика после нескольких прищипываний"><line class="soil-line" x1="-250" x2="250" y1="2" y2="2"/><g id="lab-br-g"></g></svg></div>
        <div class="lab-controls">${h.rangeHtml('lab-br-n', 'Прищипываний', 0, 4, 1, 2)}</div>
      </div>` + h.readHtml([['Верхушек', 'lab-br-t'], ['Листьев на кусте', 'lab-br-l'], ['Возраст куста', 'lab-br-w']]);
    const SC = [2.1, 1.85, 1.62, 1.42, 1.24];
    const spec = n => S.bush(n, { scale: SC[n], leaf: 1 });
    const plant = S.Plant($('#lab-br-g', el), spec(2), { grown: true, leafScale: 0.6, sway: 0.8, growDur: 1.8 });
    const upd = n => {
      plant.setSpec(spec(n));
      const leaves = plant.shoots().reduce((a, s) => a + s.spec.internodes.length * 2, 0);
      set(el, 'lab-br-t', String(Math.pow(2, n)));
      set(el, 'lab-br-l', `≈ ${leaves}`);
      set(el, 'lab-br-w', `≈ ${fmt(5 + 2.5 * n)} нед.`);
    };
    h.bindRange(el, 'lab-br-n', v => String(v), upd);
    upd(2);
  });
