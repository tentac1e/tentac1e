  /* ---------------- agro: the plant's physics in numbers, shared by the models and the experiments ----------------
     The pressure of water vapour and the leaf's view of the air (VPD) with its zones, from the model «VPD: воздух
     глазами листа» (chapter Уход); the experiments and the weather tab of «Мой базилик» compare a reader's numbers with these. */
  const agro = (() => {
    const svp = T => 0.6108 * Math.exp(17.27 * T / (T + 237.3));
    // the vapour pressure deficit for a leaf as warm as the air, kPa
    const vpd = (T, RH) => svp(T) * (1 - RH / 100);
    const VPD_Z = [[0.4, 'z0', 'Слишком влажно', 'устьица почти не тянут воду, на листьях конденсат — раздолье для ложной мучнистой росы'], [0.8, 'z1', 'Влажно', 'хорошо для рассады и черенков без корней'], [1.2, 'z2', 'Оптимум', 'вода и питание идут к листьям ровно, лист не перегревается'], [1.6, 'z3', 'Сухо', 'растение пьёт много: поливайте чаще, следите за клещом'], [99, 'z4', 'Стресс', 'устьица закрываются, фотосинтез падает, края листьев сохнут']];
    const zoneOf = v => VPD_Z.find(z => v < z[0]);
    return { svp, vpd, VPD_Z, zoneOf };
  })();
