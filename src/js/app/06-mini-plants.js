  /* ================================================================== */
  /* MINI PLANTS (stages, journey)                                       */
  /* ================================================================== */
  function miniPlant(kind) {
    const leaf = (x, y, rot, s, sy) => `<use href="#leaf-shape" class="mini-leaf" transform="translate(${x} ${y}) rotate(${rot}) scale(${s} ${sy || s})"/>`;
    let g = '<line class="mini-ground" x1="6" y1="64" x2="56" y2="64"/>';
    if (kind === 'seed') {
      return `<svg viewBox="0 0 62 70" aria-hidden="true">${g}<ellipse class="mini-seed" cx="31" cy="58" rx="5" ry="3.2"/><path class="mini-stem" d="M31 60 Q 30 66 32 69" style="stroke-width:1.4"/><path class="mini-stem" d="M31 56 Q 29 49 34 46" style="stroke-width:1.6"/></svg>`;
    }
    const pair = (y, s, ang, fore) => leaf(31, y, -ang, fore ? s * 0.75 : s, s) + leaf(31, y, ang, fore ? s * 0.75 : s, s);
    const bush = () => {
      let out = '<path class="mini-stem" d="M31 64 L31 42 M31 42 Q 24 30 18 14 M31 42 Q 38 30 44 14"/>';
      out += pair(58, 0.26, 62) + pair(48, 0.22, 58, true);
      [[25, 30, -1], [37, 30, 1]].forEach(([x, y, sd]) => { out += leaf(x, y, sd * 70, 0.2) + leaf(x, y, sd * -20, 0.2); });
      out += leaf(19, 16, -30, 0.13) + leaf(19, 16, 8, 0.13) + leaf(43, 16, 30, 0.13) + leaf(43, 16, -8, 0.13);
      return out;
    };
    if (kind === 'seedling') {
      g += '<path class="mini-stem" d="M31 64 L31 42"/><ellipse cx="25" cy="49" rx="5" ry="2.6" class="mini-leaf" transform="rotate(-20 25 49)"/><ellipse cx="37" cy="49" rx="5" ry="2.6" class="mini-leaf" transform="rotate(20 37 49)"/>' + pair(42, 0.18, 30);
    } else if (kind === 'transplant') {
      g += '<path class="mini-stem" d="M31 64 L31 32"/>' + pair(56, 0.26, 62) + pair(44, 0.22, 52, true) + pair(33, 0.14, 24);
    } else if (kind === 'growth') {
      g += '<path class="mini-stem" d="M31 64 L31 16"/>' + pair(57, 0.3, 64) + pair(45, 0.27, 58, true) + pair(33, 0.23, 50) + pair(23, 0.17, 38, true) + pair(16, 0.1, 16);
    } else if (kind === 'harvest' || kind === 'end') {
      g += bush();
    } else if (kind === 'flower') {
      g += '<path class="mini-stem" d="M31 64 L31 6"/>' + pair(57, 0.3, 64) + pair(45, 0.26, 58, true) + pair(34, 0.2, 50);
      [26, 20, 14, 8].forEach((y, i) => { const w = 5 - i; g += `<ellipse class="mini-flower" cx="${31 - w}" cy="${y}" rx="${w * 0.7}" ry="1.8"/><ellipse class="mini-flower" cx="${31 + w}" cy="${y}" rx="${w * 0.7}" ry="1.8"/>`; });
    }
    return `<svg viewBox="0 0 62 70" aria-hidden="true">${g}</svg>`;
  }

