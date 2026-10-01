
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const minus = x => x.replace(/^-/, '\u2212');
  const NF = {};
  const nf = d => NF[d] || (NF[d] = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: d }));
  const fmt = (v, d = 1) => minus(nf(d).format(Number(v)));
  const fmt0 = v => minus(nf(0).format(Math.round(v)));
  const nb = s => String(s).replace(/([\d¼½¾]) (?=[^\s\d–—-]{1,6}(?=[\s,.;:)!?/]|$))/g, '$1 ').replace(/(\d)([–…])(?=[+−]?\d)/g, '$1$2\u2060').replace(/(^|[^а-яёa-z])([а-яё]{1,4}) (?=[+−≈~]?[\d¼½¾])/gi, '$1$2\u00a0').replace(/([а-яё²³])\/(?=[а-яё])/gi, '$1/\u2060').replace(/(\S) — /g, '$1\u00a0— ').replace(/(^|[^а-яёa-z\u00ad-])(в|с|к|у|о|а|и|я|во|со|ко|об|на|за|по|до|от|из|не|ни|но) (?=\S)/gi, '$1$2\u00a0');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const f1 = v => (Math.round(v * 10) / 10);
  const icon = name => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const plural = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? many : b > 1 && b < 5 ? few : b === 1 ? one : many; };
  const sub = s => String(s).replace(/(\d+)/g, m => m.split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join(''));

