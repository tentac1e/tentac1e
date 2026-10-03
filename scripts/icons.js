#!/usr/bin/env node
/* Значки сайта для экрана телефона: фирменный росток из шапки (src/layout.html) в PNG.

     node scripts/icons.js        → src/icons/*.png (их кладёт в assets/icons/ scripts/build.py)

   icon-192.png, icon-512.png       — обычные: росток на скруглённой плашке, углы прозрачные
   icon-maskable-512.png            — маскируемый: плашка во весь квадрат, росток внутри круга 80 %
                                      (Android сам вырежет круг, каплю или квадрат)
   apple-touch-icon.png (180)       — для iPhone: плашка во весь квадрат, углы скругляет система
   Цвета — те же, что у значка во вкладке браузера: в PNG токены CSS не работают. */
const fs = require('fs');
const path = require('path');
const { playwright } = require('../tests/lib');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'icons');

// the brand mark is drawn in a 32×32 box: the leaf spans y 2…30, the stem runs down its middle
const mark = (size, part) => {
  const s = size * part / 28, d = size / 2 - 16 * s;
  return `<g transform="translate(${d} ${d}) scale(${s})">
    <path d="M16 30 C 16 22 16 16 16 10" stroke="#2D6932" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M16 26 C 26 22 30 12 16 2 C 2 12 6 22 16 26 Z" fill="url(#leaf)" stroke="#1D4B22" stroke-width="1.6" stroke-linejoin="round"/>
  </g>`;
};
const svg = (size, { round, part }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6FAF2"/><stop offset="1" stop-color="#E3ECDD"/></linearGradient>
    <linearGradient id="leaf" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#7DBA4C"/><stop offset="1" stop-color="#5E9C34"/></linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${round ? size * 0.22 : 0}" fill="url(#bg)"/>
  ${mark(size, part)}
</svg>`;

const ICONS = [
  ['icon-192.png', 192, { round: true, part: 0.7 }],
  ['icon-512.png', 512, { round: true, part: 0.7 }],
  ['icon-maskable-512.png', 512, { round: false, part: 0.52 }],
  ['apple-touch-icon.png', 180, { round: false, part: 0.66 }],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright().chromium.launch();
  for (const [name, size, o] of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg(size, o)}`);
    await page.screenshot({ path: path.join(OUT, name), omitBackground: true });
    await page.close();
    console.log(`${name} ${size}×${size}`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
