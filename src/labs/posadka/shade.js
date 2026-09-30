  register('shade', el => {
    el.innerHTML = h.head('Тень соседей', 'Чем больше сеянцев в горшке, тем меньше красного и больше дальнего красного света доходит до каждого. Модель показывает реакцию одного сеянца.', true) +
      `<div class="lab-grid">
        <div class="lab-controls">${h.rangeHtml('lab-shade-n', 'Сеянцев в горшке', 1, 30, 1, 20)}
          <div class="rfr" aria-hidden="true"><span class="rfr-r">красный 660&nbsp;нм</span><i id="lab-shade-bar"></i><span class="rfr-fr">дальний красный 730&nbsp;нм</span></div>
        </div>
        <div class="lab-stage shade-stage"><svg class="lab-plant" viewBox="-130 -290 260 310" aria-label="Сеянец базилика среди соседей" role="img"><g id="lab-shade-ghosts" class="ghosts"></g><line class="soil-line" x1="-130" x2="130" y1="2" y2="2"/><g id="lab-shade-g"></g></svg></div>
      </div>` +
      h.readHtml([['Отношение R:FR', 'lab-shade-r'], ['Длина стебля', 'lab-shade-s'], ['Размер листьев', 'lab-shade-l']]);
    const g = $('#lab-shade-g', el), ghosts = $('#lab-shade-ghosts', el);
    const spec = st => S.basil({ nodes: 5, scale: 1.25, stretch: st, w: 5.5 });
    const plant = S.Plant(g, spec(1), { grown: true, leafScale: 0.62, sway: 0.7 });
    const pos = Array.from({ length: 16 }, (_, i) => ((i * 97) % 31) / 31 * 220 - 110);
    const upd = n => {
      const rfr = 0.2 + 1.0 * Math.exp(-(n - 1) / 8);
      const st = 1 + 1.3 * (1 - (rfr - 0.2) / 1.0);
      plant.setSpec(spec(st));
      const k = Math.min(n - 1, 16);
      let s = '';
      for (let i = 0; i < k; i++) {
        const x = r1(pos[i]), hgt = r1((70 + (i % 5) * 16) * st * 0.95);
        if (Math.abs(x) < 16) continue;
        s += `<path d="M${x} 2 C ${r1(x + 4)} ${r1(-hgt * 0.4)} ${r1(x - 3)} ${r1(-hgt * 0.7)} ${r1(x + 2)} ${-hgt}"/><ellipse cx="${r1(x - 9)}" cy="${r1(-hgt * 0.62)}" rx="11" ry="5"/><ellipse cx="${r1(x + 10)}" cy="${r1(-hgt * 0.8)}" rx="10" ry="4.5"/>`;
      }
      ghosts.innerHTML = s;
      set(el, 'lab-shade-r', fmt(rfr, 2));
      set(el, 'lab-shade-s', `× ${fmt(st)}`);
      set(el, 'lab-shade-l', `−${fmt0((1 - 1 / Math.pow(st, 0.35)) * 100)} %`);
      $('#lab-shade-bar', el).style.setProperty('--p', `${clamp((rfr - 0.2) / 1.0, 0, 1) * 100}%`);
    };
    h.bindRange(el, 'lab-shade-n', v => String(v), upd);
    upd(20);
  });
