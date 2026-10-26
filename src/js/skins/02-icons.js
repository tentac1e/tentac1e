  /* ------------------------------------------------------------------ */
  /* the icons of a skin: while it is on, every symbol of the sprite     */
  /* (layout.html) that the skin has its own for shows that instead —    */
  /* «Гримуар» a sprite of the console in pixels, «Друид» a cut in wood.  */
  /* Each <use> of the page follows its symbol by itself, those the       */
  /* scripts write later too; switched off, the symbols get their own     */
  /* drawing back                                                         */
  /* ------------------------------------------------------------------ */
  // a sprite of «Гримуар»: rows of 16 characters, a character a pixel — the colour of the icon (#), its light (+), its
  // shade (=), the dark of its outline (o), blood (r), gold (g), venom (v), the cold of water (b), the glint (w); a dot
  // is nothing. Pixels of one colour go into one path, a row of them into one run
  const PIX = { '#': 'currentColor', '+': 'var(--ico-h)', '=': 'var(--ico-s)', o: 'var(--ico-o)', r: 'var(--ico-r)', g: 'var(--ico-g)', v: 'var(--ico-v)', b: 'var(--ico-b)', w: 'var(--ico-w)' };
  function pixelSprite(rows) {
    const runs = {};
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const c = row[x];
        let n = 1;
        while (row[x + n] === c) n++;
        if (PIX[c]) (runs[c] = runs[c] || []).push(`M${x} ${y}h${n}v1h-${n}z`);
        x += n;
      }
    });
    return Object.keys(runs).map(c => `<path style="fill:${PIX[c]};stroke:none" d="${runs[c].join('')}"/>`).join('');
  }
  // a cut of «Друид»: its groove first — the dark under the cut, a little lower — then the cut itself
  function carvedIcon(shapes) {
    const cut = (s, sh) => (s[0] === '*'
      ? `<path d="${s.slice(1)}" style="fill:${sh ? 'var(--ico-k)' : 'currentColor'};stroke:none"/>`
      : `<path d="${s}"${sh ? ' style="stroke:var(--ico-k)"' : ''}/>`);
    return `<g class="ico-groove" transform="translate(.45 .7)">${shapes.map(s => cut(s, true)).join('')}</g>${shapes.map(s => cut(s, false)).join('')}`;
  }
  const ICON_SETS = {
    grimoire: () => Object.fromEntries(Object.entries({ ...GRIMOIRE_ICONS, ...GRIMOIRE_HAND }).map(([k, rows]) => [k, { box: '0 0 16 16', body: pixelSprite(rows) }])),
    druid: () => Object.fromEntries(Object.entries(DRUID_ICONS).map(([k, shapes]) => [k, { box: '0 0 24 24', body: carvedIcon(shapes) }]))
  };
  const iconCache = {};
  const plainIcons = new Map();
  function iconsOn(skin) {
    const set = iconCache[skin] || (iconCache[skin] = ICON_SETS[skin] ? ICON_SETS[skin]() : {});
    $$('symbol[id^="i-"]').forEach(sym => {
      const own = set[sym.id.slice(2)];
      if (!own) return;
      if (!plainIcons.has(sym)) plainIcons.set(sym, { box: sym.getAttribute('viewBox'), body: sym.innerHTML });
      sym.setAttribute('viewBox', own.box);
      sym.innerHTML = own.body;
      sym.dataset.skinIco = skin;
    });
  }
  function iconsOff() {
    plainIcons.forEach((p, sym) => { sym.setAttribute('viewBox', p.box); sym.innerHTML = p.body; delete sym.dataset.skinIco; });
    plainIcons.clear();
  }
