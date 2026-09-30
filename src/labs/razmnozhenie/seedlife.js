  register('seedlife', el => {
    el.innerHTML = h.head('Срок жизни семян', 'Правила Харрингтона относительно хранения при 20 °C и влажности семян 10 %, когда базилик держит всхожесть около 4–5 лет.', true) +
      `<div class="lab-controls">${h.chipsHtml('lab-sl-p', 'Где храним', [['room', 'Шкаф в квартире'], ['fridge', 'Холодильник и силикагель'], ['warm', 'Тёплая кладовка']], 'room')}${h.rangeHtml('lab-sl-t', 'Температура', 0, 30, 1, 22)}${h.rangeHtml('lab-sl-m', 'Влажность семян', 5, 14, 0.5, 9)}</div>
       <div class="sl-scale"><i id="lab-sl-bar"></i><span style="left:0%">×¼</span><span style="left:25%">×1</span><span style="left:50%">×4</span><span style="left:75%">×16</span><span style="left:100%">×64</span></div>` +
      h.readHtml([['Множитель срока', 'lab-sl-x'], ['Примерно', 'lab-sl-y']]);
    let T = 22, M = 9;
    const P = { room: [22, 9], fridge: [5, 6], warm: [28, 12] };
    const upd = () => {
      const k = Math.pow(2, (20 - T) / 5) * Math.pow(2, 10 - M);
      $('#lab-sl-bar', el).style.width = `${clamp((Math.log2(k) + 2) / 8, 0.01, 1) * 100}%`;
      set(el, 'lab-sl-x', k >= 1 ? `× ${k >= 10 ? fmt0(k) : fmt(k)}` : `× ${fmt(k, 2)}`);
      const y = 4.5 * k;
      set(el, 'lab-sl-y', y > 50 ? 'десятки лет — условия семенного банка' : y < 1 ? `${fmt0(y * 12)} мес.` : `${fmt(y)} лет`);
    };
    const tr = h.bindRange(el, 'lab-sl-t', v => `${v} °C`, v => { T = v; upd(); });
    const mr = h.bindRange(el, 'lab-sl-m', v => `${fmt(v)} %`, v => { M = v; upd(); });
    h.bindPick(el, 'lab-sl-p', k => { tr.set(P[k][0]); mr.set(P[k][1]); });
    upd();
  });
