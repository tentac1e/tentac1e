  /* Balanced growth (Brouwer): the plant shares its sugars between leaves and roots so that the roots bring in as
     much as the leaves can use. Light sets what a gram of leaf makes (sL), the root zone what a gram of root
     brings (sN); the share of leaves f = sN / (sL + sN). Growth is exponential while the leaves do not shade one
     another and linear after that (expolinear, from 40 g). All numbers are illustrative. */
  const AL_ROOT = { good: { name: 'горшок, хороший уход', n: 0.55 }, dry: { name: 'горшок, пересыхает', n: 0.3 } };
  const AL_HYDRO = 1.2;
  register('alloc', el => {
    el.innerHTML = h.head('Корни, листья и свет', 'Один и тот же сеянец в горшке и в растворе. Модель условная: она делит рост между корнями и листьями по правилу Брауэра и показывает, сколько зелени наберёт куст за 8 недель.', true) +
      `<div class="lab-controls">
        ${h.rangeHtml('lab-al-dli', 'Свет за день', 4, 30, 1, 15)}
        ${h.segHtml('lab-al-pot', 'Горшок', Object.keys(AL_ROOT).map(k => [k, AL_ROOT[k].name]), 'good')}
      </div>
      <div class="lab-chart" id="lab-al-ch"></div>
      <ul class="legend legend-lines"><li><i class="k-s1"></i>гидропоника</li><li><i class="k-s2"></i>горшок</li></ul>
      <div class="al-split" id="lab-al-split" aria-live="polite"></div>` +
      h.readHtml([['Через 8 недель', 'lab-al-m'], ['Разница', 'lab-al-d'], ['Вывод', 'lab-al-v', 'is-wide']]);
    let dli = 15, pot = 'good', hover = null;
    const sL = d => 0.3 * d / (d + 12);
    const grow = sN => {
      const L = sL(dli), f = sN / (L + sN), rgr = Math.max(0.005, L * f - 0.02), Mc = 40, pts = [];
      let m = 0.5;
      for (let day = 0; day <= 56; day++) {
        if (day % 2 === 0) pts.push([day / 7, m]);
        m += m < Mc ? rgr * m : rgr * Mc;
      }
      return { f, pts, end: pts[pts.length - 1][1] };
    };
    const nice = v => { const s = [10, 20, 50, 100, 200, 300]; return s.find(x => x >= v * 1.08) || 400; };
    const lightWord = d => d <= 6 ? 'зимнее окно без лампы' : d <= 11 ? 'светлое окно весной' : d <= 18 ? 'лампа 14–16 часов' : d <= 24 ? 'солнечный балкон' : 'летнее солнце';
    const ch = h.chart($('#lab-al-ch', el), {
      label: 'Масса зелени куста за 8 недель в горшке и в гидропонике',
      draw(w, hh) {
        const H = grow(AL_HYDRO), Pt = grow(AL_ROOT[pot].n), top = nice(Math.max(H.end, Pt.end));
        const step = top / 4;
        const P = h.plot({ w, h: hh, clip: true, x: [0, 8], y: [0, top], xticks: [0, 2, 4, 6, 8], yticks: [0, step, step * 2, step * 3, top], fx: v => v + ' нед', fy: v => fmt0(v), ylab: 'граммов зелени', xlab: 'недели после посадки',
          series: [{ pts: H.pts, cls: 's1', label: 'гидропоника', labelAt: 6.6, ldy: -10 }, { pts: Pt.pts, cls: 's2', label: 'горшок', labelAt: 7.4, ldy: 16 }], hover });
        let s = P.s;
        if (hover != null) {
          const at = pts => pts.reduce((a, b) => Math.abs(b[0] - hover) < Math.abs(a[0] - hover) ? b : a)[1];
          s += h.tip(P.X(hover), P.p.t + 4, w, [`${fmt(hover)} нед`, `гидропоника: ${fmt0(at(H.pts))} г`, `горшок: ${fmt0(at(Pt.pts))} г`]);
        }
        return s;
      },
      onPointer(x, y, w, hh, kind) {
        const P = h.plot({ w, h: hh, x: [0, 8], y: [0, 1] });
        hover = kind === 'leave' ? null : clamp(Math.round(P.inv(x) * 2) / 2, 0, 8);
        ch.redraw();
      }
    });
    const upd = () => {
      const H = grow(AL_HYDRO), Pt = grow(AL_ROOT[pot].n), gain = H.end / Pt.end - 1;
      $('#lab-al-split', el).innerHTML = [['Гидропоника', H.f, 's1'], ['Горшок', Pt.f, 's2']].map(([n, f, c]) =>
        `<div class="al-row"><span class="al-name">${n}</span><span class="al-bar"><i class="al-leaf ${c}" style="--w:${fmt0(f * 100)}%"></i><i class="al-root" style="--w:${fmt0((1 - f) * 100)}%"></i></span><span class="al-val">корни ${fmt0((1 - f) * 100)} %</span></div>`).join('') +
        `<p class="lab-foot">Цветная часть полосы — доля прироста, которая уходит в листья и стебли, бежевая — в корни.</p>`;
      set(el, 'lab-al-m', `${fmt0(H.end)} г и ${fmt0(Pt.end)} г`);
      set(el, 'lab-al-d', `+${fmt0(H.end - Pt.end)} г · +${fmt0(gain * 100)} %`);
      set(el, 'lab-al-v', H.end < 30
        ? `Света мало (${lightWord(dli)}): куст растёт медленно и там, и там, а выигрыш гидропоники — считаные граммы. Сначала — лампа.`
        : pot === 'dry'
          ? `В пересыхающем горшке корень забирает себе большую долю роста. В растворе её получают листья — отсюда разница в ${fmt0(gain * 100)} %.`
          : `Света хватает (${lightWord(dli)}), и раствор позволяет держать меньше корней: больше сахаров уходит в листья, а каждый новый лист сам добавляет сахаров.`);
      ch.redraw();
    };
    h.bindRange(el, 'lab-al-dli', v => h.nb(`${fmt0(v)} моль/м²`), v => { dli = v; upd(); });
    h.bindPick(el, 'lab-al-pot', v => { pot = v; upd(); });
    upd();
  });
