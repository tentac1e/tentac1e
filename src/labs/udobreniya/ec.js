  register('ec', el => {
    el.innerHTML = h.head('EC, ppm и осмос', 'Переведите показания кондуктометра в шкалы TDS-метров и посмотрите, куда попадает раствор.') +
      `<div class="lab-controls">${h.rangeHtml('lab-ec-v', 'EC раствора', 0, 3, 0.05, 1.2)}</div>
       <div class="ec-scale" id="lab-ec-scale"><span class="ec-z" style="--a:13.3%;--b:26.7%">сеянцы</span><span class="ec-z" style="--a:33.3%;--b:53.3%">рост и срезки</span><span class="ec-z is-bad" style="--a:60%;--b:100%">риск ожога</span><i class="ec-mark" id="lab-ec-mark"></i></div>
       <p class="ec-ticks"><span>0</span><span>1</span><span>2</span><span>3 мС/см</span></p>` +
      h.readHtml([['Шкала 500', 'lab-ec-500'], ['Шкала 700', 'lab-ec-700'], ['Осмотический потенциал', 'lab-ec-psi']]);
    const upd = v => {
      set(el, 'lab-ec-500', `${fmt0(v * 500)} ppm`);
      set(el, 'lab-ec-700', `${fmt0(v * 700)} ppm`);
      set(el, 'lab-ec-psi', `${fmt(-0.036 * v, 3)} МПа`);
      $('#lab-ec-mark', el).style.left = `${v / 3 * 100}%`;
    };
    h.bindRange(el, 'lab-ec-v', v => `${fmt(v, 2)} мС/см`, upd);
    upd(1.2);
  });
