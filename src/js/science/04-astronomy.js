  /* ------------------------------------------------------------------ */
  /* astronomy shared by several models                                  */
  /* ------------------------------------------------------------------ */
  const DOY21 = [21, 52, 80, 111, 141, 172, 202, 233, 264, 294, 325, 355];
  const decl = n => 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365);
  function dayLength(lat, n) {
    const phi = lat * Math.PI / 180, d = decl(n) * Math.PI / 180;
    const c = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d));
    if (c <= -1) return 24;
    if (c >= 1) return 0;
    return 2 * Math.acos(c) * 180 / Math.PI / 15;
  }
  function h0(lat, n) {
    const phi = lat * Math.PI / 180, d = decl(n) * Math.PI / 180;
    const dr = 1 + 0.033 * Math.cos(2 * Math.PI * n / 365);
    const c = clamp(-Math.tan(phi) * Math.tan(d), -1, 1);
    const ws = Math.acos(c);
    return Math.max(0, 37.6 * dr * (ws * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(ws)));
  }
  const noonSun = (lat, n) => 90 - lat + decl(n);
  const CITIES = [[43.6, 'Сочи'], [45, 'Краснодар'], [53.9, 'Минск'], [55.8, 'Москва'], [56.8, 'Екатеринбург'], [59.9, 'Петербург'], [69, 'Мурманск']];

