  /* ------------------------------------------------------------------ */
  /* the drawings of the guide at the console's resolution               */
  /* ------------------------------------------------------------------ */
  /* Everything of a drawing but its captions goes into one group under a pixel filter (a sample every cell, an ordered
     dither, eight levels a channel); the captions — and a group that holds one — stay as they are, sharp enough to
     read. The cell is about 4 px on the screen whatever the size the drawing is shown at: a filter for each size of
     cell in the drawing's own units, made once. A drawing painted later (a picture coming near the screen, a model
     drawing again) is caught as it is added; the cell is fitted again when a tab or a dive opens and on a resize */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const KEEP = 'text, .ill-lbl, .ill-scale, [data-fit]';
  const CELL_PX = 4;
  const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
  const BAYER_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAPElEQVR42mNgAIIOIFACglVAwECGwBkgcAGCd0CQBgTkCBgDwW4gEASCmUBAjsB/ICgHgrtAEAoEZAgAAPqUf4F4u+hGAAAAAElFTkSuQmCC';
  let filterDefs = null;
  const made = new Set();
  function cellFilter(c) {
    const id = 'psx-cell-' + String(c).replace('.', '_');
    if (made.has(id)) return id;
    if (!filterDefs) {
      const host = doc.createElementNS(SVGNS, 'svg');
      host.setAttribute('aria-hidden', 'true');
      host.setAttribute('focusable', 'false');
      host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      filterDefs = doc.createElementNS(SVGNS, 'defs');
      host.appendChild(filterDefs);
      doc.body.appendChild(host);
    }
    const levels = '0 .14 .29 .43 .57 .71 .86 1';
    const f = doc.createElementNS(SVGNS, 'filter');
    f.id = id;
    f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML = `<feFlood x="${c / 4}" y="${c / 4}" width="${c / 2}" height="${c / 2}" flood-color="#000" result="dot"/>`
      + `<feComposite in="dot" x="0" y="0" width="${c}" height="${c}" result="cell"/><feTile in="cell" result="grid"/>`
      + `<feComposite in="SourceGraphic" in2="grid" operator="in" result="sample"/><feMorphology in="sample" operator="dilate" radius="${c / 2}" result="pix"/>`
      + `<feImage x="0" y="0" width="${c * 4}" height="${c * 4}" preserveAspectRatio="none" href="${BAYER_PNG}" result="bayer"/><feTile in="bayer" result="bayers"/>`
      + `<feComposite in="pix" in2="bayers" operator="arithmetic" k1="0" k2="1" k3="0.14" k4="-0.07" result="dith"/>`
      + `<feComponentTransfer in="dith"><feFuncR type="discrete" tableValues="${levels}"/><feFuncG type="discrete" tableValues="${levels}"/><feFuncB type="discrete" tableValues="${levels}"/><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>`;
    filterDefs.appendChild(f);
    made.add(id);
    return id;
  }
  // the cell, in the drawing's units, that comes out about CELL_PX on the screen
  function fitCell(g) {
    const svg = g.ownerSVGElement, vb = svg && svg.viewBox && svg.viewBox.baseVal;
    if (!vb || !vb.width) return;
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const ppu = Math.min(r.width / vb.width, r.height / vb.height), want = CELL_PX / ppu;
    const c = STEPS.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    const v = `url(#${cellFilter(c)})`;
    if (g.style.getPropertyValue('--psx-f') !== v) g.style.setProperty('--psx-f', v);
  }
  function pixelate(svg) {
    if (svg.dataset.psx) return;
    svg.dataset.psx = '1';
    const g = doc.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'psx-g');
    // the grid of the filter starts at the drawing's origin: an empty mark there keeps the origin inside the group's
    // box, so the first cell is never cut off (a drawing whose shapes all lie away from 0,0 would come out blank)
    const anchor = doc.createElementNS(SVGNS, 'rect');
    anchor.setAttribute('width', '1'); anchor.setAttribute('height', '1'); anchor.setAttribute('fill', 'none');
    g.appendChild(anchor);
    const labels = [];
    [...svg.children].forEach(n => {
      const tag = n.tagName.toLowerCase();
      if (tag === 'defs' || tag === 'title' || tag === 'desc' || tag === 'style') return;
      if (n.matches(KEEP) || n.querySelector('text')) labels.push(n); else g.appendChild(n);
    });
    svg.appendChild(g);
    labels.forEach(n => svg.appendChild(n));
    fitCell(g);
  }
  const pixelateIn = n => {
    if (n.nodeType !== 1) return;
    if (n.matches('svg.ill')) pixelate(n);
    else if (n.firstElementChild) n.querySelectorAll('svg.ill').forEach(pixelate);
  };
  const illWatch = new MutationObserver(list => { for (const m of list) m.addedNodes.forEach(pixelateIn); });
  // fitted again where something comes into view: a tab, a dive, a turned or resized screen
  let refitTimer = 0;
  const refit = (within = doc) => { clearTimeout(refitTimer); refitTimer = setTimeout(() => { $$('.psx-g', within.querySelectorAll ? within : doc).forEach(fitCell); }, 60); };
  const onToggle = e => { if (e.target.matches && e.target.matches('details')) refit(e.target); };
  const onPanel = () => refit();
  const onResize = () => refit();
