#!/usr/bin/env node
/* Картинки рамок оформлений: пишет src/css/style/26-skin-art.css — токены-картинки (data URI), которыми рамки, кнопки,
   ячейки, курсоры и узоры одеваются в 27-grimoire.css и 28-druid.css.

     node scripts/skin-art.js        → src/css/style/26-skin-art.css

   «Гримуар» — пиксели: рамка окна в 9 частей (костяная труба, чёрная линия, шов старой крови, золотые заклёпки по
   углам), окно-диалог, ячейка инвентаря, выпуклая и нажатая кнопка, знак у заголовка, камень ползунка, треугольник
   «дальше», стрелка и рука курсора. Рамка рисуется по профилю каждой кромки снаружи внутрь, угол берёт профиль ближней
   кромки, крайний пиксель угла срезан, поверх углов — штамп. «Друид» — вектор: рама из тёмного тёсаного дерева со
   срезанными углами и железными уголками на двух гвоздях, каменная табличка с мхом, плетёный шнур, волокно досок,
   наконечник курсора. Цвета в картинках — те же, что у токенов оформлений: в data URI токены CSS не работают. */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'src', 'css', 'style', '26-skin-art.css');
const enc = svg => `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/[<>#%{}\n]/g, c => ({ '<': '%3C', '>': '%3E', '#': '%23', '%': '%25', '{': '%7B', '}': '%7D', '\n': '' })[c])}")`;
const PAL = {
  k: '#000', K: 'rgba(0,0,0,.55)', w: '#EBE1C8', b: '#CDBF9E', B: '#9C8F72', d: '#4A3C42', g: '#E2BE63', G: '#8A6826', y: '#F6DF96',
  r: '#C62B35', R: '#5E1219', h: 'rgba(255,255,255,.34)', H: 'rgba(255,255,255,.16)', s: 'rgba(0,0,0,.42)', S: 'rgba(0,0,0,.62)', v: '#8FD45A'
};
// rows of characters → an SVG of pixels
function pix(rows) {
  const W = rows[0].length, H = rows.length, runs = {};
  rows.forEach((row, y) => { let x = 0; while (x < W) { const c = row[x]; let n = 1; while (row[x + n] === c) n++; if (PAL[c]) (runs[c] = runs[c] || []).push(`M${x} ${y}h${n}v1h-${n}z`); x += n; } });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" shape-rendering="crispEdges">${Object.keys(runs).map(c => `<path fill="${PAL[c]}" d="${runs[c].join('')}"/>`).join('')}</svg>`;
}
// a 9-slice frame of side 2n+1: each edge has its profile from the outside in (top, right, bottom, left); the corners
// take the profile of the nearer edge, the outermost pixel of each corner is cut; stamps go over the corners
function frame(n, prof, stamp, cut = 1) {
  const N = 2 * n + 1, rows = [];
  for (let y = 0; y < N; y++) {
    let r = '';
    for (let x = 0; x < N; x++) {
      const dT = y, dB = N - 1 - y, dL = x, dR = N - 1 - x;
      const dy = Math.min(dT, dB), dx = Math.min(dL, dR);
      const ey = dT <= dB ? prof.top : prof.bottom, ex = dL <= dR ? prof.left : prof.right;
      let c = '.';
      if (dx < n || dy < n) {
        if (dx + dy < cut) c = '.';
        else if (dy <= dx) c = ey[dy] || '.';
        else c = ex[dx] || '.';
      }
      r += c;
    }
    rows.push(r);
  }
  if (stamp) {
    const S = stamp.length;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const c = stamp[y][x];
      if (c === ' ') continue;
      const put = (X, Y) => { rows[Y] = rows[Y].slice(0, X) + c + rows[Y].slice(X + 1); };
      put(x, y); put(N - 1 - x, y); put(x, N - 1 - y); put(N - 1 - x, N - 1 - y);
    }
  }
  return rows;
}
const G = {};
// the window: a pipe of bone (lit on its top and left), a black line, a seam of old blood; studs of gold at the corners
G['px-win'] = pix(frame(8, { top: 'kbwbdkR', left: 'kbwbdkR', bottom: 'kdBbdkR', right: 'kdBbdkR' }, [
  '  kkk ',
  ' kGgGk',
  'kGyggk',
  'kggGGk',
  ' kGGk ',
  '  kk  '
], 2));
G['px-win-lit'] = pix(frame(8, { top: 'kgygGkR', left: 'kgygGkR', bottom: 'kGggGkR', right: 'kGggGkR' }, [
  '  kkk ',
  ' kwyyk',
  'kwyggk',
  'kygGGk',
  ' kGGk ',
  '  kk  '
], 2));
// a dialogue of the console: blood with a thread of gold, gold at the corners
G['px-dlg'] = pix(frame(8, { top: 'kRrRkG', left: 'kRrRkG', bottom: 'kRRRkG', right: 'kRRRkG' }, [
  ' kkk  ',
  'kgygk ',
  'kygGk ',
  'kgGGk ',
  ' kkk  ',
  '      '
], 2));
// a slot of the inventory: sunk into the window — dark above and to the left, a little light below and to the right
G['px-slot'] = pix(frame(5, { top: 'dSs', left: 'dSs', bottom: 'dHh', right: 'dHh' }, null, 1));
// a button: raised — light above and to the left, dark below and to the right, a black outline; a pressed one the other
// way round
G['px-btn'] = pix(frame(4, { top: 'kh', left: 'kh', bottom: 'kS', right: 'kS' }, null, 1));
G['px-btn-in'] = pix(frame(4, { top: 'kS', left: 'kS', bottom: 'kH', right: 'kH' }, null, 1));
// the sigil by a heading: a cross pattée of blood with a dark edge
G['px-sigil'] = pix([
  '.kkk.kkk.',
  'krrrkrrrk',
  'krwrrrrrk',
  '.krrrrrk.',
  'kkrrrrrkk',
  '.krrrrrk.',
  'krrrrrrrk',
  'krrrkrrrk',
  '.kkk.kkk.'
]);
// the gem on the slider: a cut stone of blood with a glint
G['px-gem'] = pix([
  '....kkkk....',
  '...kwrrrk...',
  '..kwrrrrRk..',
  '.kwrrrrrrRk.',
  'kwrrrrrrrrRk',
  'krrrrrrrrRRk',
  'krrrrrrrRRRk',
  '.krrrrrRRRk.',
  '..kRrRRRRk..',
  '...kRRRRk...',
  '....kkkk....',
  '............'
]);
// «more»: the triangle a dialogue of the console blinks at its foot
G['px-more'] = pix([
  'kkkkkkkkk',
  'kgyyyyygk',
  '.kgyyygk.',
  '..kgygk..',
  '...kgk...',
  '....k....'
]);
// the pointers of the console: the arrow, and the hand over what can be pressed
G['px-cur'] = pix([
  'k...........',
  'kk..........',
  'kwk.........',
  'kwwk........',
  'kwwwk.......',
  'kwwwwk......',
  'kwwwwwk.....',
  'kwwwwwwk....',
  'kwwwwwwwk...',
  'kwwwwwwwwk..',
  'kwwwwwkkkkk.',
  'kwwkwwk.....',
  'kwk.kwwk....',
  'kk..kwwk....',
  'k....kwwk...',
  '.....kwwk...',
  '......kk....'
]);
G['px-hand'] = pix([
  '....kk..........',
  '...kwwk.........',
  '...kwwk.........',
  '...kwwk.........',
  '...kwwkkk.......',
  '...kwwkwwkkk....',
  '...kwwkwwkwwkk..',
  'kk.kwwkwwkwwkwk.',
  'kwkkwwwwwwwwkwwk',
  'kwwkwwwwwwwwwwwk',
  '.kwwwwwwwwwwwwwk',
  '..kwwwwwwwwwwwk.',
  '..kwwwwwwwwwwwk.',
  '...kwwwwwwwwwk..',
  '...kwwwwwwwwwk..',
  '....kkkkkkkkk...'
]);

// «Друид»: vector pictures
const D = {};
// the window: a frame of dark hewn wood, its corners cut, a worn light on its inner edge; an iron plate on each cut with
// two nails
const iron = (t) => `<g transform="${t}"><path d="M0 7.5 L7.5 0 L15 0 L15 4.2 L4.2 15 L0 15 Z" fill="#454B50"/><path d="M0 7.5 L7.5 0 L15 0 L15 1.4 L8.1 1.4 L1.4 8.1 L1.4 15 L0 15 Z" fill="#8E979C" opacity=".6"/><path d="M4.2 15 L15 4.2 L15 5.6 L5.6 15 Z" fill="#1E2226"/><circle cx="10.2" cy="2.9" r="1.25" fill="#C9CFC9"/><circle cx="2.9" cy="10.2" r="1.25" fill="#C9CFC9"/><circle cx="10.5" cy="3.2" r=".6" fill="#2A2F33"/><circle cx="3.2" cy="10.5" r=".6" fill="#2A2F33"/></g>`;
D['dr-win'] = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
<path d="M8 0 H40 L48 8 V40 L40 48 H8 L0 40 V8 Z" fill="#1E150D"/>
<path d="M9 2 H39 L46 9 V39 L39 46 H9 L2 39 V9 Z" fill="#3A2A1A"/>
<path d="M10 4 H38 L44 10 V38 L38 44 H10 L4 38 V10 Z" fill="#2A1E13"/>
<path d="M9 2 H39 L46 9" fill="none" stroke="#6E5236" stroke-width="1"/>
<path d="M2 39 V9 L9 2" fill="none" stroke="#5C442D" stroke-width="1"/>
<path d="M10.5 6.5 H37.5 L41.5 10.5 V37.5 L37.5 41.5 H10.5 L6.5 37.5 V10.5 Z" fill="none" stroke="#120C07" stroke-width="1.2"/>
<path d="M0 3.2 H48 M0 44.8 H48 M3.2 0 V48 M44.8 0 V48" stroke="#4A3622" stroke-width=".7"/>
${iron('')}${iron('translate(48 0) scale(-1 1)')}${iron('translate(0 48) scale(1 -1)')}${iron('translate(48 48) scale(-1 -1)')}
</svg>`;
// the same, its iron warmed by the fire: a window under the hand
D['dr-win-lit'] = D['dr-win'].replace(/#454B50/g, '#6A5838').replace(/#8E979C/g, '#E2A43B').replace(/#C9CFC9/g, '#F6D58A');
// a plank for a button: its ends cut, a nail at each end, a groove along it
D['dr-btn'] = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<path d="M4 0 H20 L24 4 V20 L20 24 H4 L0 20 V4 Z" fill="#1E150D"/>
<path d="M4.5 1 H19.5 L23 4.5 V19.5 L19.5 23 H4.5 L1 19.5 V4.5 Z" fill="none" stroke="#8A6440" stroke-width="1" opacity=".55"/>
<path d="M4.5 23 H19.5 L23 19.5" fill="none" stroke="#000" stroke-width="1.2" opacity=".5"/>
<circle cx="5" cy="12" r="1.3" fill="#B9BFB9"/><circle cx="19" cy="12" r="1.3" fill="#B9BFB9"/>
<circle cx="5.3" cy="12.3" r=".6" fill="#2A2F33"/><circle cx="19.3" cy="12.3" r=".6" fill="#2A2F33"/>
</svg>`;
// a stone tablet for a word of advice: an uneven edge of grey stone, moss on its top
D['dr-stone'] = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
<path d="M6 2 Q14 0 24 1.5 Q35 0 42 2.5 Q47 6 46 14 Q47.5 24 46 34 Q47 43 41 46 Q31 48 22 46.5 Q12 48 6 45.5 Q1 41 2 32 Q0.5 22 2 13 Q1.5 5 6 2 Z" fill="#3E443D"/>
<path d="M7 4.5 Q15 3 24 4.2 Q34 3 40.5 5 Q44 8 43.5 15 Q44.8 24 43.5 33 Q44 41 39 43.5 Q30 45 22 44 Q13 45 7.5 43 Q4 39.5 4.6 32 Q3.4 22 4.6 14 Q4.2 7 7 4.5 Z" fill="#262B26"/>
<path d="M6 2 Q14 0 24 1.5 Q35 0 42 2.5 Q45 4.5 45.8 9 Q40 6.5 33 6 Q24 7.5 15 6 Q8 6.5 2.6 9.5 Q3 4 6 2 Z" fill="#4E7A3A"/>
<path d="M9 5 Q16 3.5 24 5 Q33 3.6 39 5.6" fill="none" stroke="#78A848" stroke-width="1.2" opacity=".7"/>
<path d="M3 30 Q2.5 36 4 40 M45 18 Q46 24 45.4 28" fill="none" stroke="#5F665D" stroke-width="1"/>
</svg>`;
// a band of knots: two strands woven over and under, for the rule under a heading
D['dr-knot'] = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="12" viewBox="0 0 32 12">
<path d="M0 6 C4 0 12 0 16 6 S28 12 32 6" fill="none" stroke="#120C07" stroke-width="3.6"/>
<path d="M0 6 C4 12 12 12 16 6 S28 0 32 6" fill="none" stroke="#120C07" stroke-width="3.6"/>
<path d="M0 6 C4 0 12 0 16 6 S28 12 32 6" fill="none" stroke="#B8823A" stroke-width="1.8"/>
<path d="M0 6 C4 12 12 12 16 6" fill="none" stroke="#120C07" stroke-width="3.6"/>
<path d="M0 6 C4 12 12 12 16 6" fill="none" stroke="#7E9C4A" stroke-width="1.8"/>
<path d="M16 6 C20 0 28 0 32 6" fill="none" stroke="#7E9C4A" stroke-width="1.8"/>
</svg>`;
// the grain of the planks: two boards across a window, their fibres, a knot in one
D['dr-grain'] = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="96" viewBox="0 0 240 96">
<g fill="none" stroke="#000" stroke-width="1">
<path d="M0 47.5 H240" opacity=".55"/><path d="M0 48.5 H240" stroke="#8A6440" opacity=".12"/>
<path d="M0 9 Q60 6 120 10 T240 8" opacity=".14"/><path d="M0 18 Q70 21 140 17 T240 19" opacity=".1"/>
<path d="M0 29 Q50 26 110 30 Q170 33 240 28" opacity=".12"/><path d="M0 38 Q80 40 160 36 T240 39" opacity=".09"/>
<path d="M0 58 Q60 55 100 60 Q130 64 160 58 T240 59" opacity=".13"/><path d="M0 68 Q40 71 90 67 Q120 63 150 68 T240 66" opacity=".1"/>
<path d="M0 79 Q70 76 140 80 T240 78" opacity=".12"/><path d="M0 88 Q90 91 180 87 T240 89" opacity=".09"/>
<ellipse cx="128" cy="63" rx="7" ry="3" opacity=".16"/><ellipse cx="128" cy="63" rx="3.5" ry="1.4" opacity=".2"/>
</g></svg>`;
// the pointer of the grove: an arrowhead of dark iron with a warm edge
D['dr-cur'] = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22">
<path d="M1.5 1.5 L17 9.5 L10 11.5 L7 19.5 Z" fill="#2A2F33" stroke="#0A0C0D" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M3.2 3.4 L14.2 9.2 L9.2 10.6" fill="none" stroke="#E2A43B" stroke-width="1"/>
</svg>`;
D['dr-hand'] = D['dr-cur'].replace(/#2A2F33/g, '#5A4630').replace('#E2A43B', '#F6D58A');

const block = (skin, o) => `:root[data-skin="${skin}"] {\n${Object.entries(o).map(([k, svg]) => `  --${k}: ${enc(svg)};`).join('\n')}\n}`;
fs.writeFileSync(OUT, `/* ================= the pictures of the skins' frames — written by scripts/skin-art.js, not by hand =================
   «Гримуар»: pixels (a frame in nine parts is drawn at twice its size: a pixel of it is two of the page); «Друид»: vector */
${block('grimoire', G)}
${block('druid', D)}
`);
console.log(`${path.relative(path.join(__dirname, '..'), OUT)}: ${Object.keys(G).length + Object.keys(D).length} картинок`);
