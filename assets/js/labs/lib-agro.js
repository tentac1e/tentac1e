/* Гид по базилику — библиотека рисунков «agro». Файл собирает scripts/build.py из src/labs/_lib/agro.js — правьте там */
(() => {
  'use strict';
  const L = window.BasilLibs = window.BasilLibs || {};
  /* ---------------- agro: the plant's physics in numbers, shared by the models and the experiments ----------------
     Water vapour and the leaf's view of the air (VPD) with its zones, germination by thermal time, the roots of a cutting,
     the pull of a salt solution on a cell. The chapters' models draw these; the experiments and the weather of «Мой базилик»
     compare a reader's own numbers with them. */
  const agro = (() => {
    const svp = T => 0.6108 * Math.exp(17.27 * T / (T + 237.3));
    // the vapour pressure deficit for a leaf as warm as the air, kPa
    const vpd = (T, RH) => svp(T) * (1 - RH / 100);
    const VPD_Z = [[0.4, 'z0', 'Слишком влажно', 'устьица почти не тянут воду, на листьях конденсат — раздолье для ложной мучнистой росы'], [0.8, 'z1', 'Влажно', 'хорошо для рассады и черенков без корней'], [1.2, 'z2', 'Оптимум', 'вода и питание идут к листьям ровно, лист не перегревается'], [1.6, 'z3', 'Сухо', 'растение пьёт много: поливайте чаще, следите за клещом'], [99, 'z4', 'Стресс', 'устьица закрываются, фотосинтез падает, края листьев сохнут']];
    const zoneOf = v => VPD_Z.find(z => v < z[0]);

    // germination by thermal time (model «Сколько ждать всходов», chapter Посадка): about 52 degree-days above 10.5 °C
    // to the root, slower again above 30 °C, none past 42 °C; the shoot shows over the soil at 1.8 times that
    const GERM = { Tb: 10.5, To: 30, Tc: 42, th: 52, emerge: 1.8 };
    const germDays = T => (T <= GERM.Tb || T >= GERM.Tc) ? Infinity : T <= GERM.To ? GERM.th / (T - GERM.Tb) : GERM.th / ((GERM.To - GERM.Tb) * (GERM.Tc - T) / (GERM.Tc - GERM.To));

    // a cutting in water (model «Черенок в стакане», chapter Размножение): the day the first roots show and how fast they
    // grow, cm a day, at 18, 22 and 26 °C; in between by a straight line, outside held at the ends
    const ROOTS = [[18, 10, 0.35], [22, 7, 0.5], [26, 5, 0.6]];
    const along = (T, k) => {
      if (T <= ROOTS[0][0]) return ROOTS[0][k];
      for (let i = 1; i < ROOTS.length; i++) if (T <= ROOTS[i][0]) { const [a, b] = [ROOTS[i - 1], ROOTS[i]]; return a[k] + (b[k] - a[k]) * (T - a[0]) / (b[0] - a[0]); }
      return ROOTS[ROOTS.length - 1][k];
    };
    const rootsOnset = T => along(T, 1), rootsRate = T => along(T, 2);
    // roots of a cutting by day d at T °C, cm
    const rootsLength = (d, T) => Math.max(0, (d - rootsOnset(T)) * rootsRate(T));

    // the water potential of a salt solution, MPa (van 't Hoff): ψ = −i·c·R·T; table salt splits in two ions
    const osmoticMPa = (gPerL, T = 20, M = 58.44, i = 2) => -i * (gPerL / M) * 0.0083145 * (T + 273.15);
    // a leaf cell's own sap, about −0.8 MPa: a solution more negative than that draws water out of the cell
    const CELL_MPA = -0.8;

    return { svp, vpd, VPD_Z, zoneOf, GERM, germDays, ROOTS, rootsOnset, rootsRate, rootsLength, osmoticMPa, CELL_MPA };
  })();
  L.agro = agro;
})();
