  /* ================================================================== */
  /* PINCHING SIMULATOR                                                  */
  /* ================================================================== */
  function initSim() {
    const svg = $('#sim-svg');
    if (!svg) return;
    const ui = { week: $('#sim-week'), tips: $('#sim-tips'), leaves: $('#sim-leaves'), harvest: $('#sim-harvest'), aroma: $('#sim-aroma'), aromaBox: $('#sim-aroma-box'), msg: $('#sim-msg') };
    const MAX_DEPTH = 3;
    const MAX_NODES = [8, 6, 6, 6];
    const f2 = v => Math.round(v * 10) / 10;
    let stems = [], week = 5, harvested = 0, uid = 0, seen = new Set(), goalShown = false, focusAfter = false;

    const children = s => stems.filter(c => c.parent === s.id);
    const byId = id => stems.find(s => s.id === id);
    const leafCount = () => stems.reduce((a, s) => a + s.nodes * 2, 0);
    const tipsCount = () => stems.filter(s => s.state !== 'cut').length;
    const say = (text, tone) => { ui.msg.textContent = text; ui.msg.className = `sim-msg${tone && tone !== 'info' ? ' is-' + tone : ''}`; };

    const layout = () => {
      const geo = new Map();
      const place = (s, base, a0) => {
        const pts = [{ x: base.x, y: base.y, a: a0 }];
        let x = base.x, y = base.y;
        const L = (s.depth === 0 ? 31 : 25) * Math.pow(0.88, s.depth);
        for (let i = 1; i <= s.nodes; i++) {
          const a = a0 * Math.pow(0.8, i);
          const seg = L * Math.max(0.55, 1 - 0.07 * (i - 1));
          x += Math.sin(a) * seg;
          y -= Math.cos(a) * seg;
          pts.push({ x, y, a });
        }
        geo.set(s.id, pts);
        children(s).forEach(c => {
          const p = pts[c.at] || pts[pts.length - 1];
          place(c, p, clamp(p.a + c.side * (0.68 - 0.1 * s.depth), -1.25, 1.25));
        });
      };
      place(stems[0], { x: 0, y: -6 }, 0);
      return geo;
    };
    const fresh = key => { const isNew = !seen.has(key); seen.add(key); return isNew ? 'pop' : ''; };
    const recommended = s => {
      if (s.state === 'flower') return s.nodes >= 3 ? s.nodes - 1 : 2;
      if (s.state !== 'grow' || s.depth >= MAX_DEPTH) return 0;
      if (s.depth === 0) return s.nodes >= 4 ? 3 : 0;
      return s.nodes >= 4 ? 2 : 0;
    };

    const render = () => {
      const geo = layout();
      let minX = 0, maxX = 0, minY = 0;
      geo.forEach(pts => pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); }));
      const x0 = Math.min(-125, minX - 50), x1 = Math.max(125, maxX + 50);
      const y0 = Math.min(-225, minY - 70), y1 = 72;
      const size = Math.max(x1 - x0, y1 - y0);
      const cx = (x0 + x1) / 2;
      svg.setAttribute('viewBox', `${f2(cx - size / 2)} ${f2(y1 - size)} ${f2(size)} ${f2(size)}`);
      let stemsOut = '', leavesOut = '', tipsOut = '', nodesOut = '';
      const widths = [5.5, 4, 3, 2.4];
      stems.forEach(s => {
        const pts = geo.get(s.id);
        const last = pts[pts.length - 1];
        const deg = last.a * 180 / Math.PI;
        const ext = s.state === 'grow' ? 7 : s.state === 'cut' ? 3 : 0;
        const ex = last.x + Math.sin(last.a) * ext, ey = last.y - Math.cos(last.a) * ext;
        stemsOut += `<path class="s-stem" stroke-width="${widths[s.depth]}" d="M${pts.map(p => `${f2(p.x)} ${f2(p.y)}`).join(' L')} L${f2(ex)} ${f2(ey)}"/>`;
        const base = (s.depth === 0 ? 0.52 : 0.44) * Math.pow(0.92, s.depth);
        for (let i = 1; i <= s.nodes; i++) {
          const p = pts[i];
          const t = s.nodes - i;
          const k = s.state === 'grow' ? Math.min(1, 0.42 + 0.2 * t) : Math.min(1, 0.72 + 0.14 * t);
          const size2 = base * k;
          const fore = i % 2 === 0;
          const ang = fore ? 44 : 62;
          const pd = p.a * 180 / Math.PI;
          [-1, 1].forEach(side => {
            const key = `l${s.id}-${i}-${side}`;
            leavesOut += `<g transform="translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(pd + side * ang)})"><g class="${fresh(key)}"><use href="#leaf-shape" class="s-leaf" transform="scale(${f2(fore ? size2 * 0.74 * 100 : size2 * 100) / 100} ${f2(size2 * 100) / 100})"/></g></g>`;
          });
        }
        if (s.state === 'grow') {
          const bs = s.nodes === 0 ? 0.12 : 0.15;
          tipsOut += `<g transform="translate(${f2(ex)} ${f2(ey)}) rotate(${f2(deg)})"><g class="${fresh(`b${s.id}-${s.nodes}`)}"><use href="#leaf-shape" class="s-leaf" transform="rotate(-18) scale(${bs})"/><use href="#leaf-shape" class="s-leaf" transform="rotate(18) scale(${bs})"/></g></g>`;
        } else if (s.state === 'flower') {
          let fl = `<path class="s-stem" stroke-width="${Math.max(1.8, widths[s.depth] - 1)}" d="M0 0 L0 -40"/>`;
          for (let j = 1; j <= 4; j++) {
            const w = 7.5 - j * 1.3, y = -j * 9 + 2;
            fl += `<use href="#leaf-shape" class="s-bract" transform="translate(0 ${y + 2}) rotate(-75) scale(.09)"/><use href="#leaf-shape" class="s-bract" transform="translate(0 ${y + 2}) rotate(75) scale(.09)"/>`;
            fl += `<ellipse class="s-flower" cx="${f2(-w)}" cy="${y}" rx="${f2(w * 0.75)}" ry="2.6"/><ellipse class="s-flower" cx="${f2(w)}" cy="${y}" rx="${f2(w * 0.75)}" ry="2.6"/>`;
          }
          fl += '<circle class="s-flower" cx="0" cy="-42" r="2.4"/>';
          tipsOut += `<g transform="translate(${f2(last.x)} ${f2(last.y)}) rotate(${f2(deg)})"><g class="${fresh('f' + s.id)}">${fl}</g></g>`;
        } else if (s.state === 'cut') {
          tipsOut += `<g transform="translate(${f2(ex)} ${f2(ey)}) rotate(${f2(deg)})"><line class="s-stub" x1="-4" y1="0" x2="4" y2="0"/></g>`;
        }
        if (s.state !== 'cut') {
          const rec = recommended(s);
          for (let i = 1; i <= s.nodes; i++) {
            const p = pts[i];
            const pd = p.a * 180 / Math.PI;
            nodesOut += `<g class="s-node${i === rec ? ' is-rec' : ''}" tabindex="0" role="button" data-stem="${s.id}" data-node="${i}" aria-label="Срезать над ${i}-й парой листьев" transform="translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(pd)})"><circle class="hit" r="11"/><line class="cut" x1="-14" y1="-7" x2="14" y2="-7"/><circle class="dot" r="4"/></g>`;
          }
        }
      });
      const pot = '<path class="s-pot" d="M-62 2 L62 2 L50 66 L-50 66 Z"/><rect class="s-rim" x="-68" y="-8" width="136" height="14" rx="4"/><ellipse class="s-soil" cx="0" cy="-7" rx="60" ry="4.5"/>';
      svg.innerHTML = pot + stemsOut + leavesOut + tipsOut + nodesOut;
      const flowering = stems.some(s => s.state === 'flower');
      ui.week.textContent = `Неделя ${week} после всходов`;
      ui.tips.textContent = String(tipsCount());
      ui.leaves.textContent = String(leafCount());
      ui.harvest.textContent = String(harvested);
      ui.aroma.textContent = flowering ? 'горчит' : 'отличный';
      ui.aromaBox.classList.toggle('is-bad', flowering);
      if (focusAfter) {
        focusAfter = false;
        const n = svg.querySelector('.s-node.is-rec') || svg.querySelector('.s-node');
        if (n) n.focus();
      }
    };

    const checkGoal = () => {
      if (!goalShown && tipsCount() >= 8 && !stems.some(s => s.state === 'flower')) {
        goalShown = true;
        say('Готово: 8 верхушек роста — это уже настоящий куст! Дальше просто срезайте верхушки на урожай каждые 1–2 недели и не давайте ему цвести.', 'good');
      }
    };

    const pinch = (id, k) => {
      HAP.impact();
      const s = byId(id);
      if (!s || s.state === 'cut') return;
      if (k < 2) { say('Слишком низко: под срезом должно остаться минимум 2 пары листьев. Иначе новые побеги будут слабыми, а куст потеряет «фабрику питания».', 'warn'); return; }
      if (s.state === 'grow' && s.nodes < 3) { say('Рано: пусть побег наберёт хотя бы 3 пары листьев — тогда срез даст крепкие ветки.', 'warn'); return; }
      const before = leafCount();
      const wasFlower = s.state === 'flower';
      let removed = 2 * (s.nodes - k);
      const doomed = [];
      const collect = (p, minAt) => children(p).forEach(c => { if (minAt === null || c.at > minAt) { doomed.push(c); collect(c, null); } });
      collect(s, k);
      doomed.forEach(c => { removed += 2 * c.nodes; });
      stems = stems.filter(c => !doomed.includes(c));
      s.nodes = k;
      harvested += removed;
      let text, tone = wasFlower ? 'good' : 'info';
      const got = removed ? `Собрано листьев: ${removed}. ` : 'Прищипнута только верхушка. ';
      if (s.depth < MAX_DEPTH) {
        s.state = 'cut';
        stems.push({ id: ++uid, parent: s.id, at: k, side: -1, depth: s.depth + 1, nodes: 0, state: 'grow' }, { id: ++uid, parent: s.id, at: k, side: 1, depth: s.depth + 1, nodes: 0, state: 'grow' });
        text = `Срез над ${k}-й парой. ${wasFlower ? 'Соцветие удалено. ' : ''}${got}Из пазух под срезом пойдут 2 новых побега — нажмите «Неделя вперёд».`;
      } else {
        s.state = 'grow';
        text = `${wasFlower ? 'Соцветие удалено. ' : ''}${got}Куст уже густой: дальше в тренажёре ветвление не рисуем, срезки идут в урожай.`;
      }
      if (before > 0 && removed > before / 3) { text += ' Но это больше трети куста — растению понадобится время на восстановление.'; tone = 'warn'; }
      say(text, tone);
      render();
      checkGoal();
    };

    const nextWeek = () => {
      week += 1;
      const bloomed = [];
      stems.forEach(s => {
        if (s.state !== 'grow') return;
        if (s.nodes < MAX_NODES[s.depth]) s.nodes += 1; else { s.state = 'flower'; bloomed.push(s); }
      });
      const flowering = stems.filter(s => s.state === 'flower').length;
      const ready = stems.filter(s => s.state === 'grow' && s.depth < MAX_DEPTH && s.nodes >= 4).length;
      if (bloomed.length) say(`Зацвело побегов: ${bloomed.length}. Срежьте соцветия вместе с парой листьев под ними — нажмите на узел чуть ниже цветка.`, 'bad');
      else if (flowering) say('Куст цветёт — листья грубеют и горчат. Срежьте соцветия!', 'bad');
      else if (ready) say(`Готово к прищипыванию: ${ready} ${plural(ready, 'побег', 'побега', 'побегов')} с 4 парами листьев. Срезайте над 2–3-й парой — пульсирующая точка подскажет.`, 'info');
      else say('Куст растёт, новые побеги набирают листья.', 'info');
      render();
      checkGoal();
    };

    const reset = () => {
      uid = 0; week = 5; harvested = 0; goalShown = false; seen = new Set();
      stems = [{ id: ++uid, parent: null, at: 0, side: 0, depth: 0, nodes: 4, state: 'grow' }];
      say('Пятая неделя после всходов: у стебля 4 пары настоящих листьев. Самое время для первого прищипывания — срежьте над 2-й или 3-й парой.', 'info');
      render();
    };

    svg.addEventListener('click', e => { const n = e.target.closest('.s-node'); if (n) pinch(+n.dataset.stem, +n.dataset.node); });
    svg.addEventListener('keydown', e => {
      const n = e.target.closest && e.target.closest('.s-node');
      if (!n || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      focusAfter = true;
      pinch(+n.dataset.stem, +n.dataset.node);
    });
    $('#sim-week-btn').addEventListener('click', nextWeek);
    $('#sim-reset').addEventListener('click', reset);
    reset();
  }

