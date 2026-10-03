  /* ------------------------------------------------------------------ */
  /* molecules: heavy atoms and bonds; 3D shape is relaxed at runtime    */
  /* ------------------------------------------------------------------ */
  const FAM = {
    mono: { name: 'монотерпены', cls: 's1' },
    phen: { name: 'фенилпропаноиды', cls: 's2' },
    sesq: { name: 'сесквитерпены', cls: 's3' },
    glv: { name: 'альдегиды зелёного листа', cls: 's4' }
  };
  const RING6 = [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1]];
  const MOLS = {
    lin: {
      name: 'Линалоол', formula: 'C10H18O', fam: 'mono', cls: 'монотерпеновый спирт', bp: 198,
      smell: 'цветочный, лавандовый, свежий', where: 'лаванда, семена кориандра, бергамот, хмель', basil: 'генуэзский, греческий, фиолетовые, коричный, «Пурпурный шар»',
      note: 'Главная молекула европейского базилика. Её же много в семенах кориандра, поэтому базилик и кориандр так похожи по ощущению свежести.',
      atoms: 'CCCCCCCCCCO', bonds: [[0, 1, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6, 2], [6, 7], [2, 8], [6, 9], [2, 10]]
    },
    est: {
      name: 'Эстрагол', alt: 'метилхавикол', formula: 'C10H12O', fam: 'phen', cls: 'фенилпропаноид', bp: 216,
      smell: 'анис, эстрагон, лакрица', where: 'эстрагон, фенхель, анис', basil: 'тайский, фиолетовые, «Арарат», «Анисовый восторг»',
      note: 'Делает тайский базилик анисовым. Летучесть ниже, чем у линалоола, поэтому тайский базилик лучше держит аромат в горячем карри.',
      atoms: 'CCCCCCCCCOC', ring: [0, 1, 2, 3, 4, 5], bonds: RING6.concat([[0, 6], [6, 7], [7, 8, 2], [3, 9], [9, 10]])
    },
    eug: {
      name: 'Эвгенол', formula: 'C10H12O2', fam: 'phen', cls: 'фенилпропаноид', bp: 254,
      smell: 'гвоздика, тёплая пряность', where: 'гвоздика, лавровый лист, душистый перец', basil: 'генуэзский, гвоздичный, тулси, ереванский, «Философ», «Василиск»',
      note: 'Слегка немеет язык — эвгенол давно используют стоматологи как мягкий антисептик и обезболивающее. Самая стойкая нота базилика.',
      atoms: 'CCCCCCOOCCCC', ring: [0, 1, 2, 3, 4, 5], bonds: RING6.concat([[0, 6], [1, 7], [7, 8], [3, 9], [9, 10], [10, 11, 2]])
    },
    cin: {
      name: '1,8-Цинеол', alt: 'эвкалиптол', formula: 'C10H18O', fam: 'mono', cls: 'монотерпеновый оксид', bp: 176,
      smell: 'эвкалипт, холодок', where: 'эвкалипт, розмарин, лавр, кардамон', basil: 'генуэзский, греческий, африканский синий',
      note: 'Даёт базилику лёгкий освежающий холодок. Одна из самых летучих его молекул: при варке уходит первой после «зелёных» альдегидов.',
      atoms: 'COCCCCCCCCC', bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [3, 6], [6, 7], [7, 0], [0, 8], [2, 9], [2, 10]]
    },
    cit: {
      name: 'Цитраль', alt: 'гераниаль и нераль', formula: 'C10H16O', fam: 'mono', cls: 'монотерпеновый альдегид', bp: 229,
      smell: 'лимон', where: 'лемонграсс, лимонная цедра, мелисса, вербена', basil: 'лимонный, лаймовый',
      note: 'Лимонный базилик пахнет лимоном потому, что синтезирует ту же молекулу, что и лемонграсс.',
      atoms: 'OCCCCCCCCCC', bonds: [[0, 1, 2], [1, 2], [2, 3, 2], [3, 4], [4, 5], [5, 6], [6, 7, 2], [7, 8], [3, 9], [7, 10]]
    },
    mci: {
      name: 'Метилциннамат', formula: 'C10H10O2', fam: 'phen', cls: 'эфир коричной кислоты', bp: 262,
      smell: 'корица, клубника, бальзам', where: 'клубника (многие сорта)', basil: 'коричный; по аромату — «Карамельный»',
      note: 'Корицей пахнет не коричный альдегид, как в самой корице, а родственный ему эфир. Он же есть в клубнике — отсюда пара «клубника и коричный базилик».',
      atoms: 'CCCCCCCCCOOC', ring: [0, 1, 2, 3, 4, 5], bonds: RING6.concat([[0, 6], [6, 7, 2], [7, 8], [8, 9, 2], [8, 10], [10, 11]])
    },
    cam: {
      name: 'Камфора', formula: 'C10H16O', fam: 'mono', cls: 'монотерпеновый кетон', bp: 204,
      smell: 'камфора, смола, холод', where: 'розмарин, шалфей, камфорный лавр', basil: 'африканский синий, камфорный',
      note: 'У африканского синего базилика её много, поэтому он лучше подходит для чая и букетов, чем для песто.',
      atoms: 'CCCCCCCOCCC', bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [6, 3], [1, 7, 2], [0, 8], [6, 9], [6, 10]]
    },
    car: {
      name: 'β-Кариофиллен', formula: 'C15H24', fam: 'sesq', cls: 'сесквитерпен', bp: 262,
      smell: 'перечный, древесный', where: 'чёрный перец, гвоздика, хмель', basil: 'тулси, лимонный',
      note: 'Одно из немногих ароматических веществ, которые связываются с каннабиноидным рецептором CB2, без какого-либо психоактивного эффекта.',
      atoms: 'CCCCCCCCCCCCCCC', bonds: [[0, 1], [1, 2], [2, 3], [3, 4, 2], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0], [8, 9], [9, 10], [10, 0], [3, 11], [10, 12], [10, 13], [7, 14, 2]]
    },
    hex: {
      name: '(Z)-3-Гексеналь', formula: 'C6H10O', fam: 'glv', cls: 'альдегид зелёного листа', bp: 126,
      smell: 'свежескошенная трава, зелёный томат', where: 'срезанная трава, свежий томат, листья', basil: 'любой сорт в момент разреза',
      note: 'Появляется за секунды после повреждения клеток и быстро перестраивается в (E)-2-гексеналь с более резким запахом.',
      atoms: 'OCCCCCC', bonds: [[0, 1, 2], [1, 2], [2, 3], [3, 4, 2], [4, 5], [5, 6]]
    }
  };
  const EXTRA = { meu: { name: 'Метилэвгенол', fam: 'phen', smell: 'гвоздика с анисом, тёплый' }, ber: { name: 'α-Бергамотен', fam: 'sesq', smell: 'древесный, чайный, с бергамотом' } };
  const molName = id => (MOLS[id] || EXTRA[id]).name;
  const molFam = id => (MOLS[id] || EXTRA[id]).fam;

  const CHEMO = [
    { id: 'genovese', name: 'Генуэзский', p: { lin: 45, eug: 14, cin: 8, est: 4, ber: 7, car: 2, cam: 1 }, why: 'Цветочный линалоол и тёплый эвгенол почти без аниса — сладкий «итальянский» базилик. Цинеол добавляет свежести.' },
    { id: 'greek', name: 'Греческий', p: { lin: 42, eug: 12, cin: 10, est: 10, ber: 5, car: 2 }, why: 'Тот же аккорд, что у генуэзского, плюс заметная анисовая нота — вкус получается плотнее и пряней.' },
    { id: 'clove', name: 'Гвоздичный', p: { eug: 36, lin: 30, cin: 6, est: 3, ber: 4, car: 4 }, why: 'Эвгенола почти столько же, сколько линалоола, и гвоздика выходит на первый план. Хорош в маринадах: эвгенол стоек к нагреву.' },
    { id: 'purple', name: 'Фиолетовые', p: { lin: 38, est: 16, eug: 14, cin: 6, ber: 6, car: 3 }, why: 'Линалоол, эвгенол и эстрагол в сопоставимых долях: гвоздика, анис и перчинка. Отсюда пряный «кавказский» характер ереванского и опалового.' },
    { id: 'thai', name: 'Тайский', p: { est: 72, lin: 7, cin: 4, ber: 4, car: 2, eug: 1 }, why: 'Около трёх четвертей масла — эстрагол, поэтому тайский базилик пахнет анисом и лакрицей и не теряется в горячем карри.' },
    { id: 'lemon', name: 'Лимонный', p: { cit: 52, lin: 9, car: 5, est: 4, ber: 3 }, why: 'Цитраль — та же молекула, что в лемонграссе. Отсюда чистый лимонный запах без кислоты.' },
    { id: 'lime', name: 'Лаймовый', p: { cit: 45, lin: 12, car: 6, est: 2 }, why: 'Цитраль с большей долей линалоола и кариофиллена: цитрус с цветочной и перечной нотой.' },
    { id: 'cinnamon', name: 'Коричный', p: { mci: 50, lin: 26, cin: 4, ber: 3, eug: 2 }, why: 'Метилциннамат даёт корицу и клубнику, линалоол — цветочную мягкость. Идеален к ягодам и выпечке.' },
    { id: 'tulsi', name: 'Тулси', p: { eug: 42, car: 20, meu: 12, cin: 3, lin: 2 }, why: 'Эвгенол и метилэвгенол плюс перечный кариофиллен: гвоздика с перцем. Поэтому тулси чаще заваривают, чем кладут в салат.' },
    { id: 'african', name: 'Африканский синий', p: { cam: 36, lin: 24, cin: 16, eug: 3, car: 2 }, why: 'Камфора и цинеол дают «аптечный» холодящий запах. Красив и медонос, но для песто резковат.' }
  ];
  const CHEMO_COLS = ['lin', 'cin', 'cit', 'cam', 'est', 'eug', 'meu', 'mci', 'car', 'ber'];

  const PAIRS = [
    { id: 'tomato', name: 'Томат', mols: ['lin', 'hex'], variety: 'Генуэзский', dish: 'капрезе, маринара, пицца', why: 'Общие молекулы — линалоол и «зелёный» (Z)-3-гексеналь, один из главных запахов свежего томата. Плюс контраст: глутамат и кислота томата оттеняют сладкий аромат базилика.' },
    { id: 'strawberry', name: 'Клубника', mols: ['lin', 'mci'], variety: 'Коричный или лимонный', dish: 'клубника с бальзамиком, лимонады', why: 'В аромате многих сортов клубники есть линалоол и метилциннамат — главная молекула коричного базилика.' },
    { id: 'lemon', name: 'Лимон и лемонграсс', mols: ['cit', 'lin'], variety: 'Лимонный', dish: 'лимонады, рыба, заправки', why: 'Цитраль общий: лимонный базилик синтезирует ту же молекулу, что лемонграсс и лимонная цедра.' },
    { id: 'peach', name: 'Персик', mols: ['lin'], variety: 'Генуэзский или коричный', dish: 'салат с персиком и моцареллой, сорбет', why: 'Линалоол входит в аромат персика вместе со сливочными лактонами. Базилик подчёркивает цветочную сторону фрукта.' },
    { id: 'coriander', name: 'Кориандр', mols: ['lin'], variety: 'Генуэзский', dish: 'маринады, соусы, карри', why: 'Эфирное масло семян кориандра больше чем наполовину состоит из линалоола.' },
    { id: 'fennel', name: 'Фенхель, эстрагон', mols: ['est'], variety: 'Тайский', dish: 'рыба, бульоны, азиатские супы', why: 'Эстрагол — главная молекула эстрагона и заметная часть аромата фенхеля. Анисовые ноты усиливают друг друга.' },
    { id: 'clove', name: 'Гвоздика и лавр', mols: ['eug', 'cin'], variety: 'Гвоздичный или тулси', dish: 'маринады, томатные соусы, чай', why: 'Эвгенол — основа запаха гвоздики. В лавровом листе есть и цинеол, и эвгенол.' },
    { id: 'pepper', name: 'Чёрный перец', mols: ['car'], variety: 'Тулси или лимонный', dish: 'паста, мясо, сыр', why: 'β-кариофиллен — одна из главных молекул чёрного перца.' },
    { id: 'rosemary', name: 'Розмарин', mols: ['cin', 'cam'], variety: 'Африканский синий', dish: 'запечённые овощи, мясо', why: 'Цинеол и камфора общие, но розмарин сильнее и легко перебивает базилик: кладите его заметно меньше.' },
    { id: 'mint', name: 'Мята', mols: ['cin'], variety: 'Лимонный или генуэзский', dish: 'летние салаты, лимонады', why: 'Обе — яснотковые. В мяте тоже есть цинеол, но главная её молекула — ментол, который холодит сильнее.' },
    { id: 'cocoa', name: 'Тёмный шоколад', mols: ['lin'], variety: 'Коричный или генуэзский', dish: 'ганаш, трюфели', why: 'Линалоол отвечает за цветочные ноты тонкого какао. Базилик их подхватывает, а горечь шоколада гасит сладость.' },
    { id: 'olive', name: 'Оливковое масло', mols: [], kin: ['hex'], variety: 'Любой', dish: 'песто, заправки', why: 'Свежее масло пахнет зелёными альдегидами — родственниками гексеналя. А главное, жир растворяет и удерживает терпены базилика.' },
    { id: 'cucumber', name: 'Огурец, арбуз', mols: [], kin: ['hex'], variety: 'Лимонный или генуэзский', dish: 'холодные супы, салаты, лимонады', why: 'Их свежесть дают девятиуглеродные «зелёные» альдегиды — дальняя родня гексеналя, одна обонятельная семья.' },
    { id: 'mozzarella', name: 'Моцарелла, сливки', mols: [], variety: 'Генуэзский', dish: 'капрезе, сливочные соусы', why: 'Общих молекул почти нет — работает контраст: нейтральный жир растворяет аромат и продлевает его, молочная свежесть оттеняет пряность.' },
    { id: 'parmesan', name: 'Пармезан', mols: [], variety: 'Генуэзский', dish: 'песто', why: 'Глутамат выдержанного сыра даёт умами, соль усиливает восприятие аромата, жир его удерживает.' },
    { id: 'garlic', name: 'Чеснок', mols: [], variety: 'Генуэзский', dish: 'песто, писту', why: 'Контраст: острые серные соединения из аллицина против цветочных терпенов. Вместе — средиземноморский аккорд.' },
    { id: 'chili', name: 'Чили и кокос', mols: [], variety: 'Тайский или святой', dish: 'зелёное карри, пад кра пао', why: 'Контраст тайской кухни: жгучий капсаицин, жирное кокосовое молоко и анисовый эстрагол, который не боится горячего.' }
  ];

  /* seeded random for the molecule relaxation */
  const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

  function embed(mol) {
    const n = mol.atoms.length;
    const el = i => mol.atoms[i];
    const ring = new Set(mol.ring || []);
    const adj = Array.from({ length: n }, () => []);
    mol.bonds.forEach(([a, b, o = 1]) => { adj[a].push([b, o]); adj[b].push([a, o]); });
    const sp2 = i => ring.has(i) || adj[i].some(([, o]) => o >= 2);
    const bl = (a, b, o) => {
      const hasO = el(a) === 'O' || el(b) === 'O';
      if (o === 2) return hasO ? 1.22 : 1.34;
      if (ring.has(a) && ring.has(b)) return 1.4;
      return hasO ? 1.43 : 1.54;
    };
    const len = new Map();
    const cons = [];
    const near = Array.from({ length: n }, () => new Set());
    mol.bonds.forEach(([a, b, o = 1]) => {
      const d = bl(a, b, o);
      len.set(a + '-' + b, d); len.set(b + '-' + a, d);
      cons.push([a, b, d, 1, 0]);
      near[a].add(b); near[b].add(a);
    });
    for (let c = 0; c < n; c++) {
      const nbs = adj[c];
      for (let x = 0; x < nbs.length; x++) for (let y = x + 1; y < nbs.length; y++) {
        const a = nbs[x][0], b = nbs[y][0];
        const da = len.get(a + '-' + c), db = len.get(b + '-' + c);
        const th = (sp2(c) ? 120 : 109.5) * Math.PI / 180;
        cons.push([a, b, Math.sqrt(da * da + db * db - 2 * da * db * Math.cos(th)), 0.7, 0]);
        near[a].add(b); near[b].add(a);
      }
    }
    if (mol.ring) for (let k = 0; k < 3; k++) cons.push([mol.ring[k], mol.ring[k + 3], 2.8, 0.8, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (!near[i].has(j)) cons.push([i, j, 2.95, 0.35, 1]);
    const rnd = seeded(n * 7919 + mol.bonds.length * 104729);
    let best = null, bestE = Infinity;
    for (let r = 0; r < 6; r++) {
      const P = Array.from({ length: n }, () => [rnd() * 4 - 2, rnd() * 4 - 2, rnd() * 4 - 2]);
      for (let it = 0; it < 700; it++) {
        for (const [i, j, d, w, t] of cons) {
          const dx = P[j][0] - P[i][0], dy = P[j][1] - P[i][1], dz = P[j][2] - P[i][2];
          const L = Math.hypot(dx, dy, dz) || 1e-6;
          if (t === 1 && L >= d) continue;
          const k = (L - d) / L * 0.5 * w;
          P[i][0] += dx * k; P[i][1] += dy * k; P[i][2] += dz * k;
          P[j][0] -= dx * k; P[j][1] -= dy * k; P[j][2] -= dz * k;
        }
      }
      let E = 0;
      for (const [i, j, d, , t] of cons) {
        const L = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1], P[j][2] - P[i][2]);
        if (t === 1) { if (L < d) E += (d - L) * (d - L); } else E += (L - d) * (L - d);
      }
      if (E < bestE) { bestE = E; best = P; }
    }
    const c = [0, 1, 2].map(k => best.reduce((s, p) => s + p[k], 0) / n);
    return best.map(p => [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  }
  const embedCache = new Map();
  const shape = id => { if (!embedCache.has(id)) embedCache.set(id, embed(MOLS[id])); return embedCache.get(id); };

  /* the molecule's turn: a 3×3 matrix (rows), so that it goes over the top as far as the finger takes it */
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
  const mul = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  // thousands of small turns bend the matrix a little: it is squared up again after each one
  const ortho = R => {
    const n = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
    const a = n(R[0]), d = a[0] * R[1][0] + a[1] * R[1][1] + a[2] * R[1][2];
    const b = n(R[1].map((x, i) => x - d * a[i]));
    return [a, b, [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]];
  };
  // seen a little from above, it turns by itself as on a turntable: round the upright axis tipped by that look
  const TILT = rx(-0.35), UNTILT = rx(0.35);

  /* 3D ball-and-stick viewer on canvas: turns by itself; a finger or the mouse turns it any way — sideways round the
     screen's upright axis, up and down round its level axis, over the top as far as one likes. The canvas keeps the
     whole gesture (touch-action: none): the page is scrolled past it, and on a phone it is never more than 44 % of the
     screen high (06-lab-tools.css) */
  function MolViewer(canvas, id) {
    const ctx = canvas.getContext('2d');
    let mol = MOLS[id], P = shape(id);
    // R: the turn; spin: the turntable's speed (rad/s), wx: what is left of an up-or-down flick
    let R = mul(TILT, ry(0.6)), spin = 0.35, wx = 0, dpr = 1, W = 0, H = 0, raf = 0, last = 0, visible = true, drag = null;
    let pal = {};
    const readPal = () => { pal = { c: css('--mol-c'), cHi: css('--mol-c-hi'), o: css('--mol-o'), oHi: css('--mol-o-hi'), bond: css('--mol-bond'), edge: css('--mol-edge') }; };
    function size() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    function draw() {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const maxR = Math.max(...P.map(p => Math.hypot(p[0], p[1], p[2]))) || 1;
      const scale = Math.min(W, H) * 0.44 / maxR;
      const f = maxR * 4;
      const [r0, r1, r2] = R;
      const Q = P.map(([x, y, z]) => {
        const x1 = r0[0] * x + r0[1] * y + r0[2] * z, y1 = r1[0] * x + r1[1] * y + r1[2] * z, z1 = r2[0] * x + r2[1] * y + r2[2] * z;
        const k = f / (f - z1);
        return { x: W / 2 + x1 * scale * k, y: H / 2 + y1 * scale * k, z: z1, k };
      });
      const items = [];
      mol.bonds.forEach(([a, b, o = 1]) => items.push({ t: 'b', a, b, o, z: (Q[a].z + Q[b].z) / 2 }));
      Q.forEach((q, i) => items.push({ t: 'a', i, z: q.z + 0.3 }));
      items.sort((u, v) => u.z - v.z);
      ctx.lineCap = 'round';
      for (const it of items) {
        if (it.t === 'b') {
          const A = Q[it.a], B = Q[it.b];
          const w = 5.2 * (A.k + B.k) / 2;
          const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
          const nx = -dy / L, ny = dx / L;
          const offs = it.o === 2 ? [-3.4, 3.4] : [0];
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          for (const off of offs) {
            ctx.lineWidth = it.o === 2 ? w * 0.62 : w;
            ctx.strokeStyle = mol.atoms[it.a] === 'O' ? pal.o : pal.bond;
            ctx.beginPath(); ctx.moveTo(A.x + nx * off, A.y + ny * off); ctx.lineTo(mx + nx * off, my + ny * off); ctx.stroke();
            ctx.strokeStyle = mol.atoms[it.b] === 'O' ? pal.o : pal.bond;
            ctx.beginPath(); ctx.moveTo(mx + nx * off, my + ny * off); ctx.lineTo(B.x + nx * off, B.y + ny * off); ctx.stroke();
          }
        } else {
          const q = Q[it.i];
          const isO = mol.atoms[it.i] === 'O';
          const r = (isO ? 13 : 11) * q.k * clamp(Math.min(W, H) / 300, 0.7, 1.3);
          const g = ctx.createRadialGradient(q.x - r * 0.35, q.y - r * 0.4, r * 0.1, q.x, q.y, r);
          g.addColorStop(0, isO ? pal.oHi : pal.cHi);
          g.addColorStop(1, isO ? pal.o : pal.c);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = pal.edge; ctx.stroke();
        }
      }
    }
    const SC = window.BasilScene;
    const ready = SC && SC.gate ? SC.gate(60, 30) : () => true;
    function frame(ts) {
      raf = 0;
      if (!visible || document.hidden) return;
      // the page is left alone: the molecule stops turning until the reader comes back
      if (SC && SC.calm && SC.calm.state === 'sleep' && !drag) { SC.calm.onWake(wake); return; }
      raf = requestAnimationFrame(frame);
      if (!drag && !ready(ts)) return;
      const t = ts / 1000, dt = Math.min(0.05, t - (last || t));
      last = t;
      if (!drag) {
        // the turntable, and the rest of a flick: sideways it melts into the turntable's own speed, up or down it fades
        R = mul(TILT, mul(ry(spin * dt), mul(UNTILT, R)));
        if (Math.abs(wx) > 1e-3) R = mul(rx(wx * dt), R);
        R = ortho(R);
        spin += (0.35 - spin) * 0.02;
        wx -= wx * 0.04;
      }
      draw();
    }
    const wake = () => { if (reduce.matches) { draw(); return; } if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    const hap = window.BasilHaptics ? window.BasilHaptics.dragTicker(22) : null;
    // one finger turns it; a second one on the canvas is not a new turn from another place
    canvas.addEventListener('pointerdown', e => {
      if (drag) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      if (hap) hap.start(e.clientX, e.clientY);
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (hap) hap.move(e.clientX, e.clientY);
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      // the near side follows the finger: sideways round the upright axis, down round the level one
      const b = dx * 0.012, a = -dy * 0.012;
      R = ortho(mul(rx(a), mul(ry(b), R)));
      const dt = Math.max(16, performance.now() - drag.t) / 1000;
      spin = clamp(b / dt, -6, 6);
      wx = clamp(a / dt, -6, 6);
      drag = { id: drag.id, x: e.clientX, y: e.clientY, t: performance.now() };
      if (reduce.matches) draw();
    });
    // a finger that stood still before letting go puts the molecule down: no flick, the turntable comes back slowly
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (performance.now() - drag.t > 90) { spin = 0; wx = 0; }
      drag = null;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.style.touchAction = 'none';
    readPal(); size(); draw(); wake();
    if ('ResizeObserver' in window) new ResizeObserver(() => { size(); draw(); }).observe(canvas);
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { visible = en.some(x => x.isIntersecting); if (visible) wake(); }).observe(canvas);
    document.addEventListener('visibilitychange', wake);
    document.addEventListener('basil:theme', () => { readPal(); draw(); });
    const api = {
      set(nid) { mol = MOLS[nid]; P = shape(nid); spin = 1.6; draw(); wake(); },
      get id() { return Object.keys(MOLS).find(k => MOLS[k] === mol); },
      // the turn as it stands (tests/gestures.js reads it from the canvas)
      get turn() { return R.map(r => r.slice()); }
    };
    canvas.molView = api;
    return api;
  }

