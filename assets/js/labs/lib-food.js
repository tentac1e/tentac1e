/* Гид по базилику — библиотека рисунков «food». Файл собирает scripts/build.py из src/labs/_lib/food.js — правьте там */
(() => {
  'use strict';
  const L = window.BasilLibs = window.BasilLibs || {};
  /* ---------------- food: small illustrations of what basil goes with ----------------
     Every picture lives in a 64×64 box; colours are the --fd-* tokens. food.icon(id) — a ready <svg>,
     food.g(id) — the same drawing to put inside another SVG. */
  const food = (() => {
    const F = n => `var(--fd-${n})`;
    const hi = (cx, cy, rx, ry, a = -30, o = 0.4) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${F('hi')}" opacity="${o}" transform="rotate(${a} ${cx} ${cy})"/>`;
    const leaf = (cx, cy, s, a, c = 'leaf', vein = 'leaf-d') => `<g transform="translate(${cx} ${cy}) rotate(${a}) scale(${s})"><path d="M0 -14C9 -9 9 9 0 14C-9 9 -9 -9 0 -14Z" fill="${F(c)}"/><path d="M0 -12V12M0 -4L5 -8M0 2L-5 -3M0 7L4 4" stroke="${F(vein)}" stroke-width="1.1" fill="none" opacity=".6"/></g>`;
    const dots = (list, r, c) => list.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.35}" fill="${F(c)}"/>`).join('');
    const ART = {
      tomato: () =>
        `<ellipse cx="32" cy="38" rx="23" ry="19.5" fill="${F('tomato')}"/>` +
        `<path d="M10 40C14 54 50 54 54 40C50 58 14 58 10 40Z" fill="${F('tomato-d')}" opacity=".45"/>` +
        `<path d="M23 22C19 32 21 48 29 57M41 22C45 32 43 48 35 57" stroke="${F('tomato-d')}" stroke-width="1.4" fill="none" opacity=".35"/>` +
        hi(22, 30, 6.5, 3.4) +
        `<path d="M32 20L22 17L28 22L19 26L30 24.5L31 31L33.5 24.5L44 26L36 22L41 17Z" fill="${F('leaf')}"/>` +
        `<path d="M32 20Q33 13 38 10" stroke="${F('leaf-d')}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      strawberry: () =>
        `<path d="M32 58C18 50 10 37 13 27C16 19 26 18 32 22C38 18 48 19 51 27C54 37 46 50 32 58Z" fill="${F('straw')}"/>` +
        `<path d="M32 58C46 50 54 37 51 27C50 39 44 50 32 58Z" fill="${F('straw-d')}" opacity=".45"/>` +
        dots([[22, 31], [32, 29], [42, 31], [18, 39], [27, 38], [37, 38], [46, 39], [23, 46], [32, 46], [41, 46], [28, 53], [36, 53]], 1.1, 'seed') +
        hi(21, 32, 5, 2.8) +
        `<path d="M32 23L20 19L27 17L22 11L30 15L32 7L34 15L42 11L37 17L44 19Z" fill="${F('leaf')}"/>`,
      lemon: () =>
        `<path d="M9 35C11 23 22 15 34 16C46 17 55 25 57 34C55 45 44 53 32 53C20 53 11 46 9 35Z" fill="${F('lemon')}"/>` +
        `<path d="M6 35C7 33 9 33 10 35C9 37 7 37 6 35ZM57 34C58 32 60 32 61 34C60 36 58 36 57 34Z" fill="${F('lemon')}"/>` +
        `<path d="M11 40C16 50 44 55 55 40C50 51 38 55 30 54C20 53 13 48 11 40Z" fill="${F('lemon-d')}" opacity=".45"/>` +
        hi(24, 26, 7, 3) +
        dots([[36, 30], [42, 36], [30, 42], [46, 44], [22, 38]], 0.5, 'lemon-d') +
        `<path d="M40 17C44 9 52 7 58 9C55 15 48 19 40 17Z" fill="${F('leaf')}"/><path d="M41 16Q49 12 56 10" stroke="${F('leaf-d')}" stroke-width="1" fill="none" opacity=".6"/>`,
      peach: () =>
        `<circle cx="32" cy="37" r="21" fill="${F('peach')}"/>` +
        `<circle cx="39" cy="42" r="15" fill="${F('peach-b')}" opacity=".55"/>` +
        `<path d="M31 17C25 27 25 45 31 58" stroke="${F('peach-b')}" stroke-width="2" fill="none" opacity=".7"/>` +
        hi(22, 29, 5.5, 3) + leaf(40, 13, 0.62, 58),
      coriander: () =>
        [[19, 42, 6.5], [32, 46, 7], [45, 42, 6.5], [25, 55, 6], [39, 55, 6]].map(([x, y, r]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${F('cori')}"/><path d="M${x - r * 0.45} ${y - r * 0.85}Q${x - r * 0.75} ${y} ${x - r * 0.45} ${y + r * 0.85}M${x} ${y - r}V${y + r}M${x + r * 0.45} ${y - r * 0.85}Q${x + r * 0.75} ${y} ${x + r * 0.45} ${y + r * 0.85}" stroke="${F('cori-d')}" stroke-width=".9" fill="none" opacity=".7"/>` + hi(x - r * 0.35, y - r * 0.45, r * 0.3, r * 0.18, -30, 0.5)).join('') +
        `<path d="M32 36V26" stroke="${F('leaf-d')}" stroke-width="2"/>` +
        [[24, 20, 7], [32, 14, 7.5], [40, 20, 7], [32, 24, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${F('leaf')}"/>`).join('') +
        `<path d="M32 26L24 20M32 26L32 14M32 26L40 20" stroke="${F('leaf-d')}" stroke-width="1" opacity=".6"/>`,
      fennel: () =>
        [[22, 7], [32, 5], [42, 7]].map(([x, y]) => `<path d="M32 28L${x} ${y}" stroke="${F('fennel-g')}" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="M${x - 5} ${y + 1}L${x} ${y + 5}L${x + 5} ${y + 1}M${x - 4} ${y + 6}L${x} ${y + 9}L${x + 4} ${y + 6}" stroke="${F('fennel-g')}" stroke-width="1.2" fill="none"/>`).join('') +
        `<path d="M17 49C12 38 19 28 27 26H37C45 28 52 38 47 49C41 57 23 57 17 49Z" fill="${F('fennel')}"/>` +
        `<path d="M26 27C20 36 20 48 26 55M38 27C44 36 44 48 38 55M32 26V56" stroke="${F('fennel-d')}" stroke-width="1.6" fill="none"/>` +
        hi(24, 38, 3, 7, 10, 0.55),
      clove: () =>
        `<path d="M10 54C8 37 25 17 46 11C47 30 32 51 10 54Z" fill="${F('bay')}"/><path d="M11 53Q27 34 45 12" stroke="${F('leaf-d')}" stroke-width="1.3" fill="none" opacity=".6"/>` +
        [[46, 40, 20], [53, 51, -10]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 -2L1.8 13H-1.8Z" fill="${F('clove')}"/><circle cx="-3" cy="-4" r="2.6" fill="${F('clove')}"/><circle cx="3" cy="-4" r="2.6" fill="${F('clove')}"/><circle cx="0" cy="-8" r="2.6" fill="${F('clove')}"/><circle cx="0" cy="-3" r="2.2" fill="${F('clove')}"/></g>`).join(''),
      pepper: () =>
        [[22, 30, 7.5], [37, 25, 7], [46, 39, 7.5], [29, 44, 8], [42, 54, 6.5], [18, 52, 6]].map(([x, y, r]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${F('pepper')}"/><path d="M${x - r * 0.5} ${y - r * 0.2}q${r * 0.3} ${-r * 0.4} ${r * 0.6} 0M${x - r * 0.1} ${y + r * 0.35}q${r * 0.35} ${-r * 0.3} ${r * 0.6} ${r * 0.05}" stroke="${F('pepper-hi')}" stroke-width="1" fill="none"/>` + hi(x - r * 0.35, y - r * 0.45, r * 0.3, r * 0.17, -30, 0.35)).join(''),
      rosemary: () => {
        let s = `<path d="M14 58C22 44 34 26 52 8" stroke="${F('stem')}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
        for (let i = 0; i < 12; i++) {
          const t = 0.08 + i * 0.075, x = 14 + 38 * t + 6 * Math.sin(t * 3), y = 58 - 50 * t;
          s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${(-9 + (i % 2) * 2).toFixed(1)} -3M${x.toFixed(1)} ${y.toFixed(1)}l6 7" stroke="${F('rosemary')}" stroke-width="3" stroke-linecap="round"/>`;
        }
        return s;
      },
      mint: () => `<path d="M32 58V30" stroke="${F('mint-d')}" stroke-width="2.4"/>` + leaf(21, 40, 1.05, -48, 'mint', 'mint-d') + leaf(43, 40, 1.05, 48, 'mint', 'mint-d') + leaf(32, 19, 1.15, 0, 'mint', 'mint-d'),
      cocoa: () =>
        `<path d="M10 16H54V50L46 54L40 49L33 55L10 55Z" fill="${F('choc')}"/>` +
        [0, 1, 2].map(c => [0, 1].map(r => `<rect x="${13 + c * 14}" y="${19 + r * 16}" width="11" height="13" rx="2" fill="${F('choc-hi')}" opacity="${r && c === 2 ? 0.55 : 1}"/><path d="M${14 + c * 14} ${31 + r * 16}V${20 + r * 16}H${23 + c * 14}" stroke="${F('hi')}" stroke-width="1" fill="none" opacity=".18"/>`).join('')).join(''),
      olive: () =>
        `<path d="M28 7C36 21 44 29 44 40C44 50 37 57 28 57C19 57 12 50 12 40C12 29 20 21 28 7Z" fill="${F('oil')}"/>` +
        `<path d="M44 40C44 50 37 57 28 57C35 53 40 47 40 38Z" fill="${F('oil-d')}" opacity=".5"/>` + hi(21, 36, 3.5, 7, 15, 0.5) +
        `<ellipse cx="49" cy="47" rx="7" ry="9.5" fill="${F('olive')}" transform="rotate(25 49 47)"/>` + hi(47, 43, 1.8, 3, 25, 0.45) + leaf(52, 30, 0.6, 30, 'bay'),
      cucumber: () =>
        `<path d="M22 12A22 22 0 0 0 58 34Z" fill="${F('melon')}" transform="rotate(8 40 23)"/>` +
        `<path d="M22 12A22 22 0 0 0 58 34" stroke="${F('rind')}" stroke-width="4.5" fill="none" transform="rotate(8 40 23)"/>` +
        dots([[38, 22], [44, 26], [36, 29]], 1, 'dark') +
        `<circle cx="22" cy="46" r="14" fill="${F('cuke-f')}" stroke="${F('cuke')}" stroke-width="3.5"/>` +
        [0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<ellipse cx="${(22 + Math.cos(a) * 5.5).toFixed(1)}" cy="${(46 + Math.sin(a) * 5.5).toFixed(1)}" rx="1.4" ry="2.2" fill="${F('fennel-d')}" transform="rotate(${i * 60 + 90} ${(22 + Math.cos(a) * 5.5).toFixed(1)} ${(46 + Math.sin(a) * 5.5).toFixed(1)})"/>`; }).join(''),
      mozzarella: () =>
        `<ellipse cx="32" cy="56" rx="24" ry="3.5" fill="${F('cheese-d')}" opacity=".6"/>` +
        `<circle cx="24" cy="38" r="15" fill="${F('cheese')}"/><path d="M11 42C14 54 34 56 38 44C34 53 16 53 11 42Z" fill="${F('cheese-d')}" opacity=".7"/>` + hi(18, 31, 5, 3, -30, 0.9) +
        `<circle cx="45" cy="44" r="11" fill="${F('cheese')}"/><path d="M35 47C38 56 52 56 55 47C51 54 39 54 35 47Z" fill="${F('cheese-d')}" opacity=".7"/>` + hi(41, 39, 3.6, 2.2, -30, 0.9) +
        leaf(44, 22, 0.75, 35),
      parmesan: () =>
        `<path d="M8 36L40 18L58 30L26 48Z" fill="${F('parm')}"/><path d="M8 36L26 48V57L8 45Z" fill="${F('parm-d')}"/><path d="M26 48L58 30V39L26 57Z" fill="${F('parm-d')}" opacity=".8"/>` +
        `<path d="M40 18L58 30V39" stroke="${F('rind-p')}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>` +
        dots([[24, 34], [33, 30], [30, 38], [40, 29], [18, 38]], 0.9, 'hi'),
      garlic: () =>
        `<path d="M32 9C34 16 46 22 50 34C54 48 44 56 32 56C20 56 10 48 14 34C18 22 30 16 32 9Z" fill="${F('garlic')}"/>` +
        `<path d="M32 12C26 22 22 40 26 55M32 12C38 22 42 40 38 55M32 12C18 24 14 42 20 53M32 12C46 24 50 42 44 53" stroke="${F('garlic-d')}" stroke-width="1.4" fill="none"/>` +
        `<path d="M22 44C24 50 28 53 30 54M42 44C40 50 36 53 34 54" stroke="${F('garlic-p')}" stroke-width="2" fill="none" opacity=".7"/>` +
        `<path d="M26 56l-3 5M30 57l-1 5M34 57l1 5M38 56l3 5" stroke="${F('garlic-d')}" stroke-width="1.2"/>` + hi(24, 30, 3, 6, 20, 0.7),
      chili: () =>
        `<path d="M8 38H46A19 19 0 0 1 8 38Z" fill="${F('coco')}"/><path d="M12 38H42A15 15 0 0 1 12 38Z" fill="${F('coco-f')}"/>` +
        `<ellipse cx="27" cy="38" rx="15" ry="3" fill="${F('coco-f')}" stroke="${F('coco')}" stroke-width="1.5"/>` +
        `<path d="M36 16C50 18 59 33 55 52C51 44 44 30 32 23Z" fill="${F('chili')}"/>` + hi(46, 26, 2, 6, -35, 0.5) +
        `<path d="M33 22C30 18 31 13 35 11" stroke="${F('leaf')}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
    };
    const has = id => !!ART[id];
    const g = id => (ART[id] ? ART[id]() : '');
    const icon = (id, cls = '') => `<svg class="fd ${cls}" viewBox="0 0 64 64" aria-hidden="true">${g(id)}</svg>`;
    // a basil leaf coloured like the variety
    const LEAF = { purple: 'purple', african: 'purple', thai: 'thai', lemon: 'lime', lime: 'lime' };
    // by a leaf colour of the catalogue (green, deep, purple, thai, lime) or by a chemotype id
    const basil = (variety, s = 1) => {
      const c = ['green', 'deep', 'purple', 'thai', 'lime'].includes(variety) ? variety : LEAF[variety] || 'green';
      return `<g transform="scale(${s})"><path d="M0 -4C22 -5 31 -24 30 -44C29 -66 13 -92 0 -104C-13 -92 -29 -66 -30 -44C-31 -24 -22 -5 0 -4Z" fill="var(--lf-${c})"/>` +
        `<path d="M0 -4C1 -40 1 -70 0 -100M0 -24Q12 -28 21 -41M0 -24Q-12 -28 -21 -41M0 -44Q11 -49 18 -62M0 -44Q-11 -49 -18 -62M0 -64Q8 -69 12 -80M0 -64Q-8 -69 -12 -80" stroke="var(--lf-${c}-vein)" stroke-width="2" fill="none" stroke-linecap="round"/>` +
        `<path d="M-4 -14C-19 -21 -24 -40 -21 -56C-18 -72 -9 -86 -2 -95C-7 -76 -10 -46 -4 -14Z" fill="var(--fd-hi)" opacity=".16"/><path d="M0 -4V10" stroke="var(--lf-${c}-vein)" stroke-width="3" stroke-linecap="round"/></g>`;
    };
    return { icon, g, has, basil };
  })();
  L.food = food;
})();
