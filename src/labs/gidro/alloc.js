  /* Balanced growth (Brouwer): the plant shares its sugars between leaves and roots so that the roots bring in as
     much as the leaves can use. Light sets what a gram of leaf makes (sL), the root zone what a gram of root
     brings (sN); the share of leaves f = sN / (sL + sN). Growth is exponential while the leaves do not shade one
     another and linear after that (expolinear, from 40 g). All numbers are illustrative: the model is drawn as the
     two bushes themselves, their tops and roots in proportion to what each grew. */
  const AL_ROOT = { good: { name: 'хороший уход', n: 0.55 }, dry: { name: 'пересыхает', n: 0.3 } };
  const AL_LIGHT = { winter: { name: 'зимнее окно', dli: 5 }, window: { name: 'светлое окно', dli: 10 }, lamp: { name: 'лампа', dli: 15 }, sun: { name: 'солнечный балкон', dli: 25 } };
  const AL_HYDRO = 1.2;
  register('alloc', el => {
    el.innerHTML = h.head('Корни, листья и свет', 'Два одинаковых сеянца через 8 недель: в горшке и в растворе. Модель условная — она делит рост между корнями и листьями по правилу Брауэра и рисует, что получилось.', true) +
      `<div class="lab-controls">
        ${pickHtml('lab-al-l', 'Свет', Object.keys(AL_LIGHT).map(k => [k, AL_LIGHT[k].name]), 'lamp')}
        ${h.segHtml('lab-al-pot', 'Горшок', Object.keys(AL_ROOT).map(k => [k, AL_ROOT[k].name]), 'good')}
      </div>
      <div class="hy-split">
        <div class="hy-pic" id="lab-al-pic"></div>
        <div class="hy-read" aria-live="polite"><div id="lab-al-hero"></div><div class="al-split" id="lab-al-split"></div><p class="hy-verdict" id="lab-al-v"></p></div>
      </div>`;
    const F = ill.F, q = ill.q;
    let light = 'lamp', pot = 'good';
    const sL = d => 0.3 * d / (d + 12);
    const grow = (sN, dli) => {
      const L = sL(dli), f = sN / (L + sN), rgr = Math.max(0.005, L * f - 0.02), Mc = 40;
      let m = 0.5;
      for (let day = 0; day < 56; day++) m += m < Mc ? rgr * m : rgr * Mc;
      return { f, m, shoot: m * f, root: m * (1 - f) };
    };
    // the biggest each part can be here (in a solution under the sun): the drawing's scale
    const TOP = grow(AL_HYDRO, 30), ROOT = grow(AL_ROOT.dry.n, 30);
    const pic = (P, Hy) => {
      const W = 320, Hh = 210, gy = 110;
      let g = Rh.paper(W, Hh);
      // under the ground line: soil on the left, the solution on the right, cut open
      g += `<path data-bg d="M8 ${gy}H156V196Q156 202 150 202H14Q8 202 8 196Z" fill="${F('soil')}" opacity=".9"/>`;
      g += `<path data-bg d="M164 ${gy}H312V196Q312 202 306 202H170Q164 202 164 196Z" fill="${F('water-c')}"/>`;
      for (let i = 0; i < 26; i++) g += `<circle cx="${q(16 + (i * 53) % 132)}" cy="${q(gy + 10 + (i * 29) % 82)}" r="1.4" fill="${F('soil-d')}" opacity=".8"/>`;
      [[82, P], [238, Hy]].forEach(([x, r], k) => {
        const rl = 14 + 70 * Math.sqrt(r.root / ROOT.root), rn = 5 + Math.round(6 * Math.sqrt(r.root / ROOT.root));
        g += Rh.roots(x, gy + 2, rl, rn, { seed: 5 + k, spread: k ? 0.5 : 0.9, w: 1.6 });
        g += `<rect x="${x - 13}" y="${gy - 4}" width="26" height="8" rx="3" fill="${F(k ? 'plastic' : 'pot')}"/>`;
        // the same bush on both sides, only its size differs: the height goes with the square root of the mass
        const hh = 16 + 74 * Math.sqrt(r.shoot / TOP.shoot);
        g += hh < 34 ? Rh.sprout(x, gy - 4, hh, { pairs: 2, s: 1.1 }) : ill.bush({ x, y: gy - 4, h: hh, nodes: 3, leaf: 0.1 + 0.14 * hh / 90, spread: 0.85, seed: 6 });
      });
      g += `<text class="hs-lbl" data-on-picture x="82" y="198" text-anchor="middle">горшок</text><text class="hs-lbl" data-on-picture x="238" y="198" text-anchor="middle">раствор</text>`;
      return ill.svg(W, Hh, g, `Куст в горшке и в растворе через 8 недель: листья и корни в пропорции`);
    };
    const upd = () => {
      const d = AL_LIGHT[light].dli, Hy = grow(AL_HYDRO, d), P = grow(AL_ROOT[pot].n, d), k = Hy.shoot / P.shoot;
      $('#lab-al-pic', el).innerHTML = pic(P, Hy);
      set(el, 'lab-al-hero', hyHero(k < 1.15 ? 'почти поровну' : h.nb(`в ${fmt(k)} раза`), k < 1.15 ? 'зелени в растворе и в горшке: свет — узкое место' : 'больше зелени в растворе, чем в горшке'));
      $('#lab-al-split', el).innerHTML = [['Раствор', Hy.f], ['Горшок', P.f]].map(([n, f]) =>
        `<div class="al-row"><span class="al-name">${n}</span><span class="al-bar" role="img" aria-label="${n}: листьям ${fmt0(f * 100)} %, корням ${fmt0((1 - f) * 100)} % прироста"><i class="al-leaf" style="--w:${fmt0(f * 100)}%"></i><i class="al-root" style="--w:${fmt0((1 - f) * 100)}%"></i></span><span class="al-val">корням ${fmt0((1 - f) * 100)} %</span></div>`).join('') +
        `<ul class="hy-key"><li><i class="al-key-leaf"></i>листьям и стеблям</li><li><i class="al-key-root"></i>корням</li></ul>`;
      set(el, 'lab-al-v', h.nb(k < 1.15
        ? 'Света мало: куст растёт медленно и там, и там. Раствор почти ничего не прибавляет — сначала нужна лампа.'
        : pot === 'dry'
          ? 'В пересыхающем горшке корень забирает себе большую долю роста. В растворе её получают листья — и каждый новый лист сам делает сахара для следующих.'
          : 'Света хватает, а раствор позволяет держать меньше корней: больше сахаров уходит в листья, и прирост растёт как сложные проценты.'));
    };
    h.bindPick(el, 'lab-al-l', v => { light = v; upd(); });
    h.bindPick(el, 'lab-al-pot', v => { pot = v; upd(); });
    upd();
  });
